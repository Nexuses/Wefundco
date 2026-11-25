const { allowMethods, getQuery } = require('../../lib/http');
const { getBlogBySlug } = require('../../lib/blogs');

function slugFromRequest(req) {
  if (req.params && req.params.slug) return String(req.params.slug);
  const query = getQuery(req);
  if (query.slug) return String(query.slug);
  try {
    const url = new URL(req.url, 'http://localhost');
    const parts = url.pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('blogs');
    if (idx >= 0 && parts[idx + 1]) return decodeURIComponent(parts[idx + 1]);
  } catch (_) { /* ignore */ }
  return '';
}

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'OPTIONS'])) return;

  const slug = slugFromRequest(req).trim();
  if (!slug) {
    return res.status(400).json({ error: 'Blog slug is required.' });
  }

  try {
    const item = await getBlogBySlug(slug);
    if (!item) {
      return res.status(404).json({ error: 'Blog not found.' });
    }
    return res.status(200).json({ ok: true, item });
  } catch (err) {
    console.error('[WeFundCo] blog detail error:', err);
    return res.status(500).json({ error: 'Could not load that blog.' });
  }
};
