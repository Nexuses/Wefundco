const { ObjectId } = require('mongodb');
const { getDb } = require('../../lib/db');
const { requireAdmin } = require('../../lib/auth');
const { allowMethods, escapeRegex, getQuery, getBody } = require('../../lib/http');
const { confirmationForEntry, listSendsForEmail, toPublicSend } = require('../../lib/tracking');
const { buildConfirmationView } = require('../../lib/confirmation');
const { sendTrackedGuestEmail, smtpConfigured } = require('../../lib/mail');

async function handleList(req, res) {
  const query = getQuery(req);
  const q = String(query.q || '').trim();
  const role = String(query.role || '').trim();
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(500, Math.max(1, parseInt(query.limit, 10) || 50));

  const filter = {};
  if (q) filter.email = { $regex: escapeRegex(q), $options: 'i' };
  if (role && role !== 'all') filter.role = role;

  const db = await getDb();
  const col = db.collection('waitlist');
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [items, total, allTotal, thisWeek, roleGroups] = await Promise.all([
    col.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    col.countDocuments(filter),
    col.countDocuments(),
    col.countDocuments({ createdAt: { $gte: weekAgo } }),
    col.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]).toArray()
  ]);

  const byRole = { startup: 0, investor: 0, partner: 0, general: 0 };
  roleGroups.forEach((row) => {
    byRole[row._id] = row.count;
  });

  const emails = items.map((item) => item.email);
  const sends = emails.length
    ? await db.collection('emailSends').find({
      email: { $in: emails },
      failedAt: { $exists: false }
    }).toArray()
    : [];
  const sendsByEmail = new Map();
  sends.forEach((send) => {
    const list = sendsByEmail.get(send.email) || [];
    list.push(toPublicSend(send));
    sendsByEmail.set(send.email, list);
  });

  const decorated = items.map((item) => ({
    id: String(item._id),
    email: item.email,
    phone: item.phone || '',
    role: item.role,
    source: item.source,
    page: item.page,
    userAgent: item.userAgent,
    createdAt: item.createdAt,
    confirmation: buildConfirmationView({
      sends: sendsByEmail.get(item.email) || [],
      legacyClickedAt: item.legacyClickedAt || item.confirmedAt || null,
      legacyAction: item.legacyAction || ''
    })
  }));

  return res.status(200).json({
    ok: true,
    items: decorated,
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    stats: {
      allTotal,
      thisWeek,
      byRole
    }
  });
}

async function handleDelete(req, res) {
  const query = getQuery(req);
  const body = getBody(req);
  const id = String(query.id || body.id || '').trim();

  if (!id || !ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'A valid waitlist entry id is required.' });
  }

  const db = await getDb();
  const result = await db.collection('waitlist').deleteOne({ _id: new ObjectId(id) });
  if (!result.deletedCount) {
    return res.status(404).json({ error: 'Waitlist entry not found.' });
  }

  return res.status(200).json({ ok: true });
}

async function handleSend(req, res) {
  const body = getBody(req);
  const id = String(body.id || '').trim();
  const kind = body.kind === 'waitlist_thankyou' ? 'waitlist_thankyou' : 'event_rsvp';

  if (!id || !ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'A valid waitlist entry id is required.' });
  }
  if (!smtpConfigured()) {
    return res.status(503).json({ error: 'Email sending is not configured yet.' });
  }

  const db = await getDb();
  const entry = await db.collection('waitlist').findOne({ _id: new ObjectId(id) });
  if (!entry) {
    return res.status(404).json({ error: 'Waitlist entry not found.' });
  }

  const result = await sendTrackedGuestEmail(db, entry, kind);
  const confirmation = await confirmationForEntry(db, entry);
  const sends = (await listSendsForEmail(db, entry.email)).map(toPublicSend);

  return res.status(200).json({
    ok: true,
    sent: Boolean(result.sent),
    sendIndex: result.send && result.send.sendIndex,
    confirmation,
    sends
  });
}

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'POST', 'DELETE'])) return;
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    if (req.method === 'DELETE') {
      return await handleDelete(req, res);
    }
    if (req.method === 'POST') {
      return await handleSend(req, res);
    }
    return await handleList(req, res);
  } catch (err) {
    console.error('[WeFundCo] admin waitlist error:', err);
    return res.status(500).json({
      error: req.method === 'DELETE'
        ? 'Could not delete that waitlist entry.'
        : req.method === 'POST'
          ? 'Could not send that email.'
          : 'Could not load waitlist entries.'
    });
  }
};
