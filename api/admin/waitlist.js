const { ObjectId } = require('mongodb');
const { getDb } = require('../../lib/db');
const { requireAdmin } = require('../../lib/auth');
const { allowMethods, escapeRegex, getQuery, getBody } = require('../../lib/http');

async function handleList(req, res) {
  const query = getQuery(req);
  const q = String(query.q || '').trim();
  const role = String(query.role || '').trim();
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(500, Math.max(1, parseInt(query.limit, 10) || 50));

  const filter = {};
  if (q) filter.email = { $regex: escapeRegex(q), $options: 'i' };
  if (role && role !== 'all') filter.role = role;

  const db = await getDb();
  const col = db.collection('waitlist');
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [items, total, allTotal, thisWeek, roleGroups] = await Promise.all([
    col.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    col.countDocuments(filter),
    col.countDocuments(),
    col.countDocuments({ createdAt: { $gte: weekAgo } }),
    col.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]).toArray()
  ]);

  const byRole = { startup: 0, investor: 0, partner: 0, general: 0 };
  roleGroups.forEach((row) => {
    byRole[row._id] = row.count;
  });

  return res.status(200).json({
    ok: true,
    items: items.map((item) => ({
      id: String(item._id),
      email: item.email,
      phone: item.phone || '',
      role: item.role,
      source: item.source,
      page: item.page,
      userAgent: item.userAgent,
      createdAt: item.createdAt
    })),
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    stats: {
      allTotal,
      thisWeek,
      byRole
    }
  });
}

async function handleDelete(req, res) {
  const query = getQuery(req);
  const body = getBody(req);
  const id = String(query.id || body.id || '').trim();

  if (!id || !ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'A valid waitlist entry id is required.' });
  }

  const db = await getDb();
  const result = await db.collection('waitlist').deleteOne({ _id: new ObjectId(id) });
  if (!result.deletedCount) {
    return res.status(404).json({ error: 'Waitlist entry not found.' });
  }

  return res.status(200).json({ ok: true });
}

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'DELETE'])) return;
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    if (req.method === 'DELETE') {
      return await handleDelete(req, res);
    }
    return await handleList(req, res);
  } catch (err) {
    console.error('[WeFundCo] admin waitlist error:', err);
    return res.status(500).json({
      error: req.method === 'DELETE'
        ? 'Could not delete that waitlist entry.'
        : 'Could not load waitlist entries.'
    });
  }
};
