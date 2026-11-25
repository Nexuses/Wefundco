const { ObjectId } = require('mongodb');
const { getDb } = require('./db');
const { uploadBuffer, deleteObject, keyFromUrl } = require('./s3');

const COVER_MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sanitizeHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript:/gi, '');
}

function htmlToPlainText(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Plain text → HTML: paragraphs, ## headings, - lists */
function bodyToHtml(raw) {
  const text = String(raw || '').replace(/\r\n/g, '\n').trim();
  if (!text) return '';

  const blocks = text.split(/\n{2,}/);
  const html = [];

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trimEnd()).filter((l) => l.length);
    if (!lines.length) continue;

    if (lines.every((l) => /^[-*]\s+/.test(l))) {
      html.push(
        '<ul>' +
          lines
            .map((l) => `<li>${escapeHtml(l.replace(/^[-*]\s+/, ''))}</li>`)
            .join('') +
          '</ul>'
      );
      continue;
    }

    if (lines.length === 1 && /^##\s+/.test(lines[0])) {
      html.push(`<h2>${escapeHtml(lines[0].replace(/^##\s+/, ''))}</h2>`);
      continue;
    }

    html.push(`<p>${lines.map((l) => escapeHtml(l)).join('<br />')}</p>`);
  }

  return html.join('\n');
}

function normalizeContent({ body, bodyHtml, content }) {
  const rich = sanitizeHtml(String(bodyHtml || content || '').trim());
  if (rich) {
    const plain = htmlToPlainText(rich);
    return { body: plain, bodyHtml: rich, excerpt: plain.replace(/\s+/g, ' ').slice(0, 160) };
  }
  const plain = String(body || '').trim();
  return {
    body: plain,
    bodyHtml: bodyToHtml(plain),
    excerpt: plain.replace(/\s+/g, ' ').slice(0, 160)
  };
}

function formatDisplayDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

function toIsoDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function normalizeStatus(value) {
  return String(value || '').toLowerCase() === 'draft' ? 'draft' : 'published';
}

function normalizeSeo(input = {}) {
  const seoDescription = String(input.seoDescription || input.description || '').trim().slice(0, 180);
  return {
    seoTitle: String(input.seoTitle || input.seo || '').trim().slice(0, 70),
    seoDescription
  };
}

function mapPublic(item) {
  const cover = item.coverImageUrl || item.imageUrl || '';
  const description = item.seoDescription || item.excerpt || '';
  return {
    id: String(item._id),
    title: item.title || '',
    slug: item.slug || '',
    author: item.author || '',
    status: normalizeStatus(item.status),
    publishedAt: item.publishedAt,
    publishedAtIso: toIsoDate(item.publishedAt),
    publishedAtLabel: formatDisplayDate(item.publishedAt),
    coverImageUrl: cover,
    imageUrl: cover,
    excerpt: description,
    bodyHtml: item.bodyHtml || bodyToHtml(item.body || ''),
    seoTitle: item.seoTitle || '',
    seoDescription: description
  };
}

function mapAdmin(item) {
  return {
    ...mapPublic(item),
    body: item.body || '',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

async function ensureUniqueSlug(base, excludeId) {
  const db = await getDb();
  const col = db.collection('blogs');
  let slug = base || 'post';
  let n = 0;
  for (;;) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const filter = { slug: candidate };
    if (excludeId) filter._id = { $ne: excludeId };
    const exists = await col.findOne(filter, { projection: { _id: 1 } });
    if (!exists) return candidate;
    n += 1;
  }
}

async function listBlogs({ q = '', page = 1, limit = 50, admin = false } = {}) {
  const db = await getDb();
  const col = db.collection('blogs');
  const filter = {};
  if (!admin) {
    filter.$and = [
      { $or: [{ status: 'published' }, { status: { $exists: false } }, { status: null }] }
    ];
  }
  if (q) {
    const rx = { $regex: String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    const textFilter = { $or: [{ title: rx }, { author: rx }, { slug: rx }] };
    if (filter.$and) filter.$and.push(textFilter);
    else Object.assign(filter, textFilter);
  }

  const skip = (Math.max(1, page) - 1) * limit;
  const [items, total] = await Promise.all([
    col.find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(limit).toArray(),
    col.countDocuments(filter)
  ]);

  return {
    items: items.map(admin ? mapAdmin : mapPublic),
    page: Math.max(1, page),
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / Math.max(1, limit)))
  };
}

async function getBlogBySlug(slug) {
  const db = await getDb();
  const item = await db.collection('blogs').findOne({
    slug: String(slug || '').trim(),
    $or: [{ status: 'published' }, { status: { $exists: false } }, { status: null }]
  });
  return item ? mapPublic(item) : null;
}

async function getBlogById(id) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const item = await db.collection('blogs').findOne({ _id: new ObjectId(id) });
  return item ? mapAdmin(item) : null;
}

async function createBlog(input) {
  const cleanTitle = String(input.title || '').trim();
  if (!cleanTitle) {
    const err = new Error('Title is required.');
    err.status = 400;
    throw err;
  }

  const coverImageUrl = String(input.coverImageUrl || input.imageUrl || '').trim();
  if (!coverImageUrl) {
    const err = new Error('Image URL is required.');
    err.status = 400;
    throw err;
  }

  const pub = input.publishedAt ? new Date(input.publishedAt) : new Date();
  if (Number.isNaN(pub.getTime())) {
    const err = new Error('A valid published date is required.');
    err.status = 400;
    throw err;
  }

  const content = normalizeContent(input);
  if (!content.bodyHtml) {
    const err = new Error('Content is required.');
    err.status = 400;
    throw err;
  }

  const requestedSlug = slugify(input.slug || cleanTitle);
  const slug = await ensureUniqueSlug(requestedSlug || slugify(cleanTitle));
  const now = new Date();
  const seo = normalizeSeo(input);
  const doc = {
    title: cleanTitle,
    slug,
    author: String(input.author || 'WeFundCo Editorial').trim() || 'WeFundCo Editorial',
    status: normalizeStatus(input.status),
    publishedAt: pub,
    coverImageUrl,
    imageUrl: coverImageUrl,
    coverImageKey: input.coverImageKey || keyFromUrl(coverImageUrl) || '',
    body: content.body,
    bodyHtml: content.bodyHtml,
    excerpt: seo.seoDescription || content.excerpt,
    ...seo,
    createdAt: now,
    updatedAt: now
  };

  const db = await getDb();
  const result = await db.collection('blogs').insertOne(doc);
  return mapAdmin({ ...doc, _id: result.insertedId });
}

async function updateBlog(id, fields) {
  if (!ObjectId.isValid(id)) {
    const err = new Error('Invalid blog id.');
    err.status = 400;
    throw err;
  }

  const db = await getDb();
  const col = db.collection('blogs');
  const existing = await col.findOne({ _id: new ObjectId(id) });
  if (!existing) {
    const err = new Error('Blog not found.');
    err.status = 404;
    throw err;
  }

  const patch = { updatedAt: new Date() };

  if (fields.title != null) {
    const cleanTitle = String(fields.title).trim();
    if (!cleanTitle) {
      const err = new Error('Title is required.');
      err.status = 400;
      throw err;
    }
    patch.title = cleanTitle;
  }

  if (fields.slug != null || fields.title != null) {
    const fromSlug = fields.slug != null ? slugify(fields.slug) : '';
    const base = fromSlug || slugify(fields.title || existing.title);
    patch.slug = await ensureUniqueSlug(base || slugify(existing.title), existing._id);
  }

  if (fields.author != null) {
    patch.author = String(fields.author).trim() || 'WeFundCo Editorial';
  }

  if (fields.status != null) {
    patch.status = normalizeStatus(fields.status);
  }

  if (fields.publishedAt != null) {
    const pub = new Date(fields.publishedAt);
    if (Number.isNaN(pub.getTime())) {
      const err = new Error('A valid published date is required.');
      err.status = 400;
      throw err;
    }
    patch.publishedAt = pub;
  }

  if (fields.body != null || fields.bodyHtml != null || fields.content != null) {
    const content = normalizeContent(fields);
    if (!content.bodyHtml) {
      const err = new Error('Content is required.');
      err.status = 400;
      throw err;
    }
    patch.body = content.body;
    patch.bodyHtml = content.bodyHtml;
    if (fields.seoDescription == null && fields.description == null) {
      patch.excerpt = content.excerpt;
    }
  }

  if (fields.seoTitle != null || fields.seoDescription != null || fields.description != null) {
    const seo = normalizeSeo({
      seoTitle: fields.seoTitle != null ? fields.seoTitle : existing.seoTitle,
      seoDescription: fields.seoDescription != null || fields.description != null
        ? (fields.seoDescription || fields.description)
        : existing.seoDescription
    });
    Object.assign(patch, seo);
    patch.excerpt = seo.seoDescription || existing.excerpt || '';
  }

  const nextImage = String(fields.coverImageUrl || fields.imageUrl || '').trim();
  if (nextImage) {
    patch.coverImageUrl = nextImage;
    patch.imageUrl = nextImage;
    patch.coverImageKey = fields.coverImageKey || keyFromUrl(nextImage) || '';
  }

  await col.updateOne({ _id: existing._id }, { $set: patch });

  if (
    patch.coverImageKey &&
    existing.coverImageKey &&
    existing.coverImageKey !== patch.coverImageKey
  ) {
    try {
      await deleteObject(existing.coverImageKey);
    } catch (_) { /* best-effort cleanup */ }
  }

  return getBlogById(id);
}

async function deleteBlog(id) {
  if (!ObjectId.isValid(id)) {
    const err = new Error('Invalid blog id.');
    err.status = 400;
    throw err;
  }
  const db = await getDb();
  const col = db.collection('blogs');
  const existing = await col.findOne({ _id: new ObjectId(id) });
  if (!existing) {
    const err = new Error('Blog not found.');
    err.status = 404;
    throw err;
  }
  await col.deleteOne({ _id: existing._id });
  if (existing.coverImageKey) {
    try {
      await deleteObject(existing.coverImageKey);
    } catch (_) { /* best-effort */ }
  }
  return true;
}

async function uploadCoverImage({ buffer, filename, mimeType }) {
  const type = String(mimeType || '').toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(type)) {
    const err = new Error('Cover image must be JPEG, PNG, WebP, or GIF.');
    err.status = 400;
    throw err;
  }
  if (!buffer || !buffer.length) {
    const err = new Error('Cover image is required.');
    err.status = 400;
    throw err;
  }
  if (buffer.length > COVER_MAX_BYTES) {
    const err = new Error('Cover image must be 5 MB or smaller.');
    err.status = 400;
    throw err;
  }

  const ext =
    type === 'image/png' ? 'png' :
    type === 'image/webp' ? 'webp' :
    type === 'image/gif' ? 'gif' : 'jpg';

  const safeName = String(filename || 'cover')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .slice(0, 40);
  const key = `blogs/${Date.now()}-${safeName}.${ext}`.replace(/\.\.+/g, '.');

  const uploaded = await uploadBuffer({
    key,
    body: buffer,
    contentType: type,
    metadata: { purpose: 'blog-cover' }
  });

  return { url: uploaded.url, key: uploaded.key };
}

module.exports = {
  slugify,
  bodyToHtml,
  sanitizeHtml,
  formatDisplayDate,
  mapPublic,
  mapAdmin,
  listBlogs,
  getBlogBySlug,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  uploadCoverImage,
  COVER_MAX_BYTES,
  ALLOWED_IMAGE_TYPES
};
