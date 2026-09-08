const { getDb } = require('../../lib/db');
const { requireAdmin } = require('../../lib/auth');
const { allowMethods, escapeRegex, getQuery } = require('../../lib/http');

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return;
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
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
  } catch (err) {
    console.error('[WeFundCo] admin waitlist error:', err);
    return res.status(500).json({ error: 'Could not load waitlist entries.' });
  }
};
