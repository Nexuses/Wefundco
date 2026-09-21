const { getDb } = require('../lib/db');
const { recordClick } = require('../lib/tracking');
const { publicSiteUrl, eventName, CIRCLE_WHATSAPP_URL } = require('../lib/mail');
const { attendanceConfirmedPage, trackingNotFoundPage } = require('../lib/templates');
const { allowMethods, getQuery } = require('../lib/http');

function html(res, status, body) {
  if (typeof res.status === 'function') res.status(status);
  else res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(body);
}

function tokenFrom(req) {
  const query = getQuery(req);
  if (query.token) return String(query.token).trim();
  if (req.params && req.params.token) return String(req.params.token).trim();
  try {
    const url = new URL(req.url, 'http://localhost');
    const parts = url.pathname.split('/').filter(Boolean);
    const rIndex = parts.indexOf('r');
    if (rIndex >= 0 && parts[rIndex + 1]) return decodeURIComponent(parts[rIndex + 1]);
  } catch {
    /* ignore */
  }
  return '';
}

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'HEAD'])) return;

  const token = tokenFrom(req);
  const query = getQuery(req);
  const siteUrl = publicSiteUrl();

  if (!token) {
    return html(res, 404, trackingNotFoundPage({ siteUrl }));
  }

  try {
    const db = await getDb();
    const result = await recordClick(db, token);
    if (!result.ok) {
      return html(res, 404, trackingNotFoundPage({ siteUrl }));
    }

    if (query.next === 'circle' || result.send.kind === 'waitlist_thankyou') {
      res.statusCode = 302;
      res.setHeader('Location', CIRCLE_WHATSAPP_URL);
      res.setHeader('Cache-Control', 'no-store');
      return res.end();
    }

    return html(res, 200, attendanceConfirmedPage({
      siteUrl,
      confirmation: result.confirmation,
      eventName: eventName()
    }));
  } catch (err) {
    console.error('[WeFundCo] tracking click failed:', err);
    return html(res, 500, trackingNotFoundPage({ siteUrl }));
  }
};
