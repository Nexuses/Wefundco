const { getDb } = require('../lib/db');
const { sendWaitlistEmails, sendWaitlistProfileEmails } = require('../lib/mail');
const { allowMethods, getBody, isValidEmail } = require('../lib/http');

const ROLES = new Set(['startup', 'investor', 'partner', 'general']);

function normalizeLinkedIn(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw.slice(0, 300);
  if (/^(www\.)?linkedin\.com\//i.test(raw)) return `https://${raw.replace(/^https?:\/\//i, '')}`.slice(0, 300);
  if (/^[a-z0-9\-_%]+$/i.test(raw)) return `https://www.linkedin.com/in/${raw}`.slice(0, 300);
  return raw.slice(0, 300);
}

function hasProfileDetails(entry) {
  if (!entry) return false;
  return Boolean(
    (entry.companyName && String(entry.companyName).trim()) ||
    (entry.company && String(entry.company).trim()) ||
    (entry.linkedin && String(entry.linkedin).trim())
  );
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
      hasPhone: !!(existing.phone && String(existing.phone).trim()),
      hasProfile: hasProfileDetails(existing)
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
      const dup = await col.findOne({ email });
      return res.status(409).json({
        error: 'This email is already on the waitlist.',
        alreadyJoined: true,
        hasPhone: !!(dup && dup.phone && String(dup.phone).trim()),
        hasProfile: hasProfileDetails(dup)
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
}

async function handleProfileUpdate(req, res) {
  const body = getBody(req);
  const lookupEmail = String(body.lookupEmail || body.email || '').trim().toLowerCase();
  const email = String(body.email || '').trim().toLowerCase();
  const companyName = String(body.companyName || body.company || '').trim().slice(0, 160);
  const linkedin = normalizeLinkedIn(body.linkedin);

  if (!isValidEmail(lookupEmail) && !isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!companyName) {
    return res.status(400).json({ error: 'Please enter your company name.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!linkedin) {
    return res.status(400).json({ error: 'Please enter your LinkedIn profile.' });
  }

  const db = await getDb();
  const result = await db.collection('waitlist').findOneAndUpdate(
    { email: lookupEmail || email },
    {
      $set: {
        companyName,
        company: companyName,
        linkedin,
        profileEmail: email,
        profileUpdatedAt: new Date()
      }
    },
    { returnDocument: 'after' }
  );

  const updated = result && (result.value || result);
  if (!updated || !updated.email) {
    return res.status(404).json({ error: 'Waitlist entry not found for that email.' });
  }

  try {
    await sendWaitlistProfileEmails(updated);
  } catch (err) {
    console.error('[WeFundCo] waitlist profile email failed:', err);
  }

  return res.status(200).json({
    ok: true,
    message: 'Thanks — your details are saved.'
  });
}

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['POST', 'PATCH'])) return;

  try {
    if (req.method === 'PATCH') {
      return await handleProfileUpdate(req, res);
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
