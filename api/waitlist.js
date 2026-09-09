const { getDb } = require('../lib/db');
const { sendWaitlistEmails } = require('../lib/mail');
const { allowMethods, getBody, isValidEmail } = require('../lib/http');

const ROLES = new Set(['startup', 'investor', 'partner', 'general']);

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;

  try {
    const body = getBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const role = ROLES.has(body.role) ? body.role : 'general';
    const source = String(body.source || 'unknown').slice(0, 80);
    const page = String(body.page || '').slice(0, 120);

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid work email address.' });
    }

    const db = await getDb();
    const col = db.collection('waitlist');
    const existing = await col.findOne({ email });
    if (existing) {
      return res.status(409).json({
        error: 'This email is already on the waitlist.',
        alreadyJoined: true
      });
    }

    const now = new Date();

    const doc = {
      email,
      role,
      source,
      page,
      userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
      createdAt: now
    };

    try {
      await col.insertOne(doc);
    } catch (err) {
      if (err && err.code === 11000) {
        return res.status(409).json({
          error: 'This email is already on the waitlist.',
          alreadyJoined: true
        });
      }
      throw err;
    }

    try {
      await sendWaitlistEmails(doc);
    } catch (err) {
      console.error('[WeFundCo] waitlist email failed:', err);
    }

    return res.status(200).json({
      ok: true,
      alreadyJoined: false,
      message: "You're on the list. We'll be in touch before launch."
    });
  } catch (err) {
    console.error('[WeFundCo] waitlist error:', err);
    const missingMongo = /MONGODB_URI/.test(String(err && err.message));
    return res.status(500).json({
      error: missingMongo
        ? 'Waitlist storage is not configured yet.'
        : 'Could not join the waitlist just now. Please try again.'
    });
  }
};
