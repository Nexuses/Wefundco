const bcrypt = require('bcryptjs');
const { getDb } = require('../../lib/db');
const { signAdmin, cookieHeader, readAdminToken } = require('../../lib/auth');
const { allowMethods, getBody, isValidEmail } = require('../../lib/http');

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const db = await getDb();
      const count = await db.collection('admins').countDocuments();
      return res.status(200).json({ open: count === 0 });
    } catch (err) {
      console.error('[WeFundCo] signup status error:', err);
      return res.status(500).json({ error: 'Could not check signup status.' });
    }
  }

  if (!allowMethods(req, res, ['POST', 'GET'])) return;

  try {
    const body = getBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const name = String(body.name || '').trim().slice(0, 80);

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const db = await getDb();
    const admins = db.collection('admins');
    const existingCount = await admins.countDocuments();

    if (existingCount > 0 && !readAdminToken(req)) {
      return res.status(403).json({
        error: 'Signup is closed. Ask an existing admin to add you from the dashboard.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const doc = {
      email,
      name,
      passwordHash,
      createdAt: new Date()
    };

    let inserted;
    try {
      inserted = await admins.insertOne(doc);
    } catch (err) {
      if (err && err.code === 11000) {
        return res.status(409).json({ error: 'An admin with that email already exists.' });
      }
      throw err;
    }

    const invitedByAdmin = Boolean(readAdminToken(req));
    if (!invitedByAdmin) {
      const token = signAdmin({ _id: inserted.insertedId, email });
      res.setHeader('Set-Cookie', cookieHeader(token));
    }
    return res.status(201).json({ ok: true, email, name });
  } catch (err) {
    console.error('[WeFundCo] signup error:', err);
    return res.status(500).json({
      error: /MONGODB_URI/.test(String(err && err.message))
        ? 'MongoDB is not configured. Set MONGODB_URI in .env.'
        : 'Could not create the admin account.'
    });
  }
};
