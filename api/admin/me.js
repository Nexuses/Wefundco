const { requireAdmin } = require('../../lib/auth');
const { allowMethods } = require('../../lib/http');

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return;
  const admin = requireAdmin(req, res);
  if (!admin) return;
  return res.status(200).json({ ok: true, email: admin.email });
};
