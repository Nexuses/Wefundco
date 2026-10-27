const { clearSessionCookieHeaders, writeCookies } = require('../../lib/auth');
const { allowMethods } = require('../../lib/http');

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  writeCookies(res, clearSessionCookieHeaders());
  return res.status(200).json({ ok: true });
};
