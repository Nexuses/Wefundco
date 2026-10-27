const { ObjectId } = require('mongodb');
const { getDb } = require('../../lib/db');
const { requireAdmin } = require('../../lib/auth');
const { allowMethods, escapeRegex, getQuery, getBody } = require('../../lib/http');
const { deleteSubmission, openFileStream, getSubmission, fileUrl } = require('../../lib/onboarding-store');

function mapItem(item) {
  return {
    id: String(item._id),
    contactName: item.contactName || '',
    contactEmail: item.contactEmail || '',
    contactPhone: item.contactPhone || '',
    role: item.role || 'unknown',
    status: item.status || '',
    fileCount: (item.files || []).length,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function mapDetail(item) {
  return {
    ...mapItem(item),
    answers: item.answers || {},
    files: (item.files || []).map((f) => fileUrl(f)).filter(Boolean)
  };
}

async function handleList(req, res) {
  const query = getQuery(req);
  const q = String(query.q || '').trim();
  const role = String(query.role || '').trim();
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(500, Math.max(1, parseInt(query.limit, 10) || 50));

  const filter = { status: 'complete' };
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: 'i' };
    filter.$or = [{ contactEmail: rx }, { contactName: rx }];
  }
  if (role && role !== 'all') filter.role = role;

  const db = await getDb();
  const col = db.collection('onboarding');
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [items, total, allTotal, thisWeek, roleGroups] = await Promise.all([
    col.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    col.countDocuments(filter),
    col.countDocuments({ status: 'complete' }),
    col.countDocuments({ status: 'complete', createdAt: { $gte: weekAgo } }),
    col.aggregate([
      { $match: { status: 'complete' } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]).toArray()
  ]);

  const byRole = { startup: 0, investor: 0, unknown: 0 };
  roleGroups.forEach((row) => {
    byRole[row._id] = row.count;
  });

  return res.status(200).json({
    ok: true,
    items: items.map(mapItem),
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    stats: { allTotal, thisWeek, byRole }
  });
}

async function handleDetail(req, res, id) {
  const item = await getSubmission(id);
  if (!item || item.status !== 'complete') {
    return res.status(404).json({ error: 'Submission not found.' });
  }
  return res.status(200).json({ ok: true, item: mapDetail(item) });
}

async function handleFile(req, res, submissionId, fileUrlParam) {
  const item = await getSubmission(submissionId);
  if (!item) {
    return res.status(404).json({ error: 'Submission not found.' });
  }
  const wanted = String(fileUrlParam || '').trim();
  const match = (item.files || []).map(fileUrl).find((url) => url === wanted);
  if (!match) {
    return res.status(404).json({ error: 'File not found.' });
  }

  const file = await openFileStream(match);
  if (!file) {
    return res.status(404).json({ error: 'File not found.' });
  }

  const filename = file.meta.filename || 'download';
  res.setHeader('Content-Type', file.meta.contentType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${filename.replace(/"/g, '')}"`);
  if (file.meta.contentLength) {
    res.setHeader('Content-Length', String(file.meta.contentLength));
  }
  file.stream.pipe(res);
}

async function handleDelete(req, res, id) {
  await deleteSubmission(id);
  return res.status(200).json({ ok: true });
}

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'DELETE'])) return;
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const query = getQuery(req);
  const body = getBody(req);
  const action = String(query.action || '').trim();

  try {
    if (req.method === 'DELETE') {
      const id = String(query.id || body.id || '').trim();
      if (!id || !ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'A valid submission id is required.' });
      }
      return await handleDelete(req, res, id);
    }

    if (action === 'file') {
      const submissionId = String(query.id || '').trim();
      const url = String(query.url || '').trim();
      if (!submissionId || !url) {
        return res.status(400).json({ error: 'id and url are required.' });
      }
      return await handleFile(req, res, submissionId, url);
    }

    const id = String(query.id || '').trim();
    if (id) {
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid submission id.' });
      }
      return await handleDetail(req, res, id);
    }

    return await handleList(req, res);
  } catch (err) {
    console.error('[WeFundCo] admin onboarding error:', err);
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Could not load onboarding submissions.' });
  }
};
