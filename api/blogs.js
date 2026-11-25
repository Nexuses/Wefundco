const { allowMethods, getQuery } = require('../lib/http');
const { listBlogs } = require('../lib/blogs');

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'OPTIONS'])) return;

  try {
    const query = getQuery(req);
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 50));
    const data = await listBlogs({ page, limit, admin: false });
    return res.status(200).json({ ok: true, ...data });
  } catch (err) {
    console.error('[WeFundCo] blogs list error:', err);
    const missing = /MONGODB_URI/.test(String(err && err.message || ''));
    return res.status(500).json({
      error: missing ? 'Database is not configured yet.' : 'Could not load blogs.'
    });
  }
};
