const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const { buildConfirmationView } = require('./confirmation');

const SEND_KINDS = new Set(['waitlist_thankyou', 'event_rsvp']);

function mintToken() {
  return crypto.randomBytes(24).toString('base64url');
}

function trackingUrl(siteUrl, token, next) {
  const base = String(siteUrl || 'https://wefundco.in').replace(/\/$/, '');
  const url = `${base}/r/${encodeURIComponent(token)}`;
  if (!next) return url;
  return `${url}?next=${encodeURIComponent(next)}`;
}

function normalizeKind(kind) {
  return SEND_KINDS.has(kind) ? kind : 'event_rsvp';
}

function toPublicSend(doc) {
  if (!doc) return null;
  return {
    token: doc.token || '',
    kind: doc.kind,
    sendIndex: doc.sendIndex,
    sentAt: doc.sentAt,
    clickedAt: doc.clickedAt || null,
    lastClickedAt: doc.lastClickedAt || null,
    clickCount: doc.clickCount || 0,
    ambiguous: Boolean(doc.ambiguous)
  };
}

async function nextSendIndex(col, email) {
  const last = await col.find({ email }).sort({ sendIndex: -1 }).limit(1).toArray();
  return last.length ? Number(last[0].sendIndex || 0) + 1 : 1;
}

async function createEmailSend(db, {
  email,
  waitlistId,
  kind,
  token = mintToken()
}) {
  const col = db.collection('emailSends');
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const sendIndex = await nextSendIndex(col, normalizedEmail);
  const now = new Date();
  const doc = {
    token,
    email: normalizedEmail,
    waitlistId: waitlistId || null,
    kind: normalizeKind(kind),
    sendIndex,
    sentAt: now,
    clickedAt: null,
    lastClickedAt: null,
    clickCount: 0,
    ambiguous: false
  };
  await col.insertOne(doc);
  return doc;
}

async function listSendsForEmail(db, email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  return db.collection('emailSends')
    .find({ email: normalizedEmail, failedAt: { $exists: false } })
    .sort({ sendIndex: 1 })
    .toArray();
}

async function confirmationForEntry(db, entry) {
  const sends = await listSendsForEmail(db, entry.email);
  return buildConfirmationView({
    sends: sends.map(toPublicSend),
    legacyClickedAt: entry.legacyClickedAt || entry.confirmedAt || null,
    legacyAction: entry.legacyAction || ''
  });
}

async function markSendFailed(db, token) {
  await db.collection('emailSends').updateOne(
    { token },
    { $set: { failedAt: new Date() } }
  );
}

async function recordClick(db, token) {
  const col = db.collection('emailSends');
  const send = await col.findOne({ token, failedAt: { $exists: false } });
  if (!send) return { ok: false, reason: 'not_found' };

  const now = new Date();
  const firstClickOnThisSend = !send.clickedAt;
  await col.updateOne(
    { token },
    {
      $set: {
        ...(firstClickOnThisSend ? { clickedAt: now } : {}),
        lastClickedAt: now
      },
      $inc: { clickCount: 1 }
    }
  );

  const updated = {
    ...send,
    clickedAt: send.clickedAt || now,
    lastClickedAt: now,
    clickCount: (send.clickCount || 0) + 1
  };

  if (send.waitlistId) {
    const waitlist = db.collection('waitlist');
    const entry = await waitlist.findOne({ _id: send.waitlistId });
    if (entry && !entry.confirmedAt) {
      await waitlist.updateOne(
        { _id: send.waitlistId },
        { $set: { confirmedAt: now } }
      );
    }
  } else if (send.email) {
    const entry = await db.collection('waitlist').findOne({ email: send.email });
    if (entry && !entry.confirmedAt) {
      await db.collection('waitlist').updateOne(
        { _id: entry._id },
        { $set: { confirmedAt: now } }
      );
    }
  }

  const entry = send.waitlistId
    ? await db.collection('waitlist').findOne({ _id: send.waitlistId })
    : await db.collection('waitlist').findOne({ email: send.email });
  const confirmation = await confirmationForEntry(db, entry || { email: send.email });

  return {
    ok: true,
    send: toPublicSend(updated),
    confirmation,
    firstClickOnThisSend
  };
}

function parseWaitlistId(value) {
  if (!value) return null;
  if (value instanceof ObjectId) return value;
  const raw = String(value);
  return ObjectId.isValid(raw) ? new ObjectId(raw) : null;
}

module.exports = {
  mintToken,
  trackingUrl,
  createEmailSend,
  listSendsForEmail,
  confirmationForEntry,
  markSendFailed,
  recordClick,
  parseWaitlistId,
  toPublicSend,
  SEND_KINDS
};
