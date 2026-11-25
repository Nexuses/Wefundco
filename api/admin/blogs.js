const { requireAdmin } = require('../../lib/auth');
const { allowMethods, getQuery, getBody } = require('../../lib/http');
const {
  listBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  uploadCoverImage
} = require('../../lib/blogs');
const { parseBlogForm } = require('../../lib/blog-multipart');

async function resolveImage(fields, file) {
  if (file && file.buffer && file.buffer.length) {
    const uploaded = await uploadCoverImage({
      buffer: file.buffer,
      filename: file.filename,
      mimeType: file.mimeType
    });
    return { coverImageUrl: uploaded.url, coverImageKey: uploaded.key, uploadedKey: uploaded.key };
  }
  const url = String(fields.imageUrl || fields.coverImageUrl || '').trim();
  return { coverImageUrl: url, coverImageKey: '', uploadedKey: '' };
}

function blogPayload(fields, image) {
  return {
    title: fields.title,
    slug: fields.slug,
    author: fields.author,
    status: fields.status,
    publishedAt: fields.publishedAt || fields.publishedDate,
    body: fields.body,
    bodyHtml: fields.bodyHtml || fields.content,
    content: fields.content,
    seoTitle: fields.seoTitle || fields.seo,
    seoDescription: fields.seoDescription || fields.description,
    coverImageUrl: image.coverImageUrl,
    imageUrl: image.coverImageUrl,
    coverImageKey: image.coverImageKey
  };
}

async function handleImageUpload(req, res) {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return res.status(400).json({ error: 'Expected multipart form data.' });
  }
  const parsed = await parseBlogForm(req);
  const file = parsed.file;
  if (!file || !file.buffer || !file.buffer.length) {
    return res.status(400).json({ error: 'An image file is required.' });
  }
  const uploaded = await uploadCoverImage({
    buffer: file.buffer,
    filename: file.filename,
    mimeType: file.mimeType
  });
  return res.status(200).json({ ok: true, url: uploaded.url, key: uploaded.key });
}

async function handleList(req, res) {
  const query = getQuery(req);
  const q = String(query.q || '').trim();
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 50));

  if (query.id) {
    const item = await getBlogById(String(query.id));
    if (!item) return res.status(404).json({ error: 'Blog not found.' });
    return res.status(200).json({ ok: true, item });
  }

  const data = await listBlogs({ q, page, limit, admin: true });
  return res.status(200).json({ ok: true, ...data });
}

async function handleCreate(req, res) {
  const query = getQuery(req);
  if (String(query.action || '') === 'upload-image') {
    return handleImageUpload(req, res);
  }

  const contentType = req.headers['content-type'] || '';
  let fields = {};
  let file = null;

  if (contentType.includes('multipart/form-data')) {
    const parsed = await parseBlogForm(req);
    fields = parsed.fields;
    file = parsed.file;
  } else {
    fields = getBody(req);
  }

  const image = await resolveImage(fields, file);
  if (!image.coverImageUrl) {
    return res.status(400).json({ error: 'Image URL is required.' });
  }

  try {
    const item = await createBlog(blogPayload(fields, image));
    return res.status(201).json({ ok: true, item });
  } catch (err) {
    if (image.uploadedKey) {
      try {
        const { deleteObject } = require('../../lib/s3');
        await deleteObject(image.uploadedKey);
      } catch (_) { /* ignore */ }
    }
    throw err;
  }
}

async function handleUpdate(req, res) {
  const query = getQuery(req);
  const contentType = req.headers['content-type'] || '';
  let fields = {};
  let file = null;
  let id = String(query.id || '').trim();

  if (contentType.includes('multipart/form-data')) {
    const parsed = await parseBlogForm(req);
    fields = parsed.fields;
    file = parsed.file;
    if (!id) id = String(fields.id || '').trim();
  } else {
    fields = getBody(req);
    if (!id) id = String(fields.id || '').trim();
  }

  if (!id) {
    return res.status(400).json({ error: 'Blog id is required.' });
  }

  const image = await resolveImage(fields, file);
  const patch = blogPayload(fields, image);
  if (!image.coverImageUrl) {
    delete patch.coverImageUrl;
    delete patch.imageUrl;
    delete patch.coverImageKey;
  }

  const item = await updateBlog(id, patch);
  return res.status(200).json({ ok: true, item });
}

async function handleDelete(req, res) {
  const query = getQuery(req);
  const body = getBody(req);
  const id = String(query.id || body.id || '').trim();
  if (!id) {
    return res.status(400).json({ error: 'Blog id is required.' });
  }
  await deleteBlog(id);
  return res.status(200).json({ ok: true });
}

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'])) return;
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    if (req.method === 'GET') return await handleList(req, res);
    if (req.method === 'POST') return await handleCreate(req, res);
    if (req.method === 'PATCH') return await handleUpdate(req, res);
    if (req.method === 'DELETE') return await handleDelete(req, res);
  } catch (err) {
    console.error('[WeFundCo] admin blogs error:', err);
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    const msg = String(err && err.message || '');
    const missingConfig = /MONGODB_URI|AWS_|S3_BUCKET/.test(msg);
    return res.status(500).json({
      error: missingConfig
        ? 'Blog storage is not configured yet.'
        : err.message || 'Could not process blog request.'
    });
  }
};
