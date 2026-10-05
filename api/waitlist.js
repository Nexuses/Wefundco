const { getDb } = require('../lib/db');
const { sendWaitlistEmails } = require('../lib/mail');
const { allowMethods, getBody, isValidEmail } = require('../lib/http');

const ROLES = new Set(['startup', 'investor', 'partner', 'general']);

function normalizePhone(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const cleaned = raw.replace(/[^\d+]/g, '');
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return null;
  return cleaned;
}

async function handleJoin(req, res) {
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
      alreadyJoined: true,
      hasPhone: !!(existing.phone && String(existing.phone).trim())
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
    const inserted = await col.insertOne(doc);
    doc._id = inserted.insertedId;
  } catch (err) {
    if (err && err.code === 11000) {
      const dup = await col.findOne({ email });
      return res.status(409).json({
        error: 'This email is already on the waitlist.',
        alreadyJoined: true,
        hasPhone: !!(dup && dup.phone && String(dup.phone).trim())
      });
    }
    throw err;
  }

  try {
    await sendWaitlistEmails(db, { ...doc, _id: doc._id });
  } catch (err) {
    console.error('[WeFundCo] waitlist email failed:', err);
  }

  return res.status(200).json({
    ok: true,
    alreadyJoined: false,
    message: "You're on the list. We'll be in touch before launch."
  });
}

async function handlePhoneUpdate(req, res) {
  const body = getBody(req);
  const email = String(body.email || '').trim().toLowerCase();
  const phone = normalizePhone(body.phone);

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!phone) {
    return res.status(400).json({ error: 'Please enter a valid phone number.' });
  }

  const db = await getDb();
  const result = await db.collection('waitlist').findOneAndUpdate(
    { email },
    { $set: { phone, phoneUpdatedAt: new Date() } },
    { returnDocument: 'after' }
  );

  const updated = result && (result.value || result);
  if (!updated || !updated.email) {
    return res.status(404).json({ error: 'Waitlist entry not found for that email.' });
  }

  return res.status(200).json({
    ok: true,
    message: "Got it. We'll send updates to your number."
  });
}

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['POST', 'PATCH'])) return;

  try {
    if (req.method === 'PATCH') {
      return await handlePhoneUpdate(req, res);
    }
    return await handleJoin(req, res);
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
