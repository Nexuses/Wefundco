const bcrypt = require('bcryptjs');
const { getDb } = require('../../lib/db');
const { signAdmin, cookieHeader } = require('../../lib/auth');
const { allowMethods, getBody, isValidEmail } = require('../../lib/http');

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;

  try {
    const body = getBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!isValidEmail(email) || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const db = await getDb();
    const admin = await db.collection('admins').findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const token = signAdmin(admin);
    res.setHeader('Set-Cookie', cookieHeader(token));
    return res.status(200).json({ ok: true, email: admin.email, name: admin.name || '' });
  } catch (err) {
    console.error('[WeFundCo] login error:', err);
    return res.status(500).json({ error: 'Could not log in just now.' });
  }
};
