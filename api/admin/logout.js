const { cookieHeader } = require('../../lib/auth');
const { allowMethods } = require('../../lib/http');

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  res.setHeader('Set-Cookie', cookieHeader('', { clear: true }));
  return res.status(200).json({ ok: true });
};
