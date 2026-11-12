const { randomUUID } = require('crypto');
const { ObjectId } = require('mongodb');
const { getDb } = require('./db');
const { isValidEmail } = require('./http');
const { uploadBuffer, deleteObject, getObjectStream, keyFromUrl } = require('./s3');

const MAX_MB = 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;
const MAX_FILES = 32;
const ALLOWED_EXT = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.svg']);

function normalizeRole(raw) {
  const r = String(raw || '').trim().toLowerCase();
  if (r === 'startup' || r === 'investor') return r;
  return 'unknown';
}

function extname(filename) {
  const i = String(filename || '').lastIndexOf('.');
  return i >= 0 ? String(filename).slice(i).toLowerCase() : '';
}

function fileUrl(entry) {
  if (typeof entry === 'string') return entry;
  return String((entry && entry.url) || '').trim();
}

function fileMeta(entry) {
  if (typeof entry === 'string') {
    const name = entry.split('/').pop() || entry;
    return { fieldId: '', url: entry, name };
  }
  if (!entry || typeof entry !== 'object') return null;
  const url = fileUrl(entry);
  if (!url) return null;
  return {
    fieldId: String(entry.fieldId || '').trim(),
    url,
    name: String(entry.name || entry.originalName || url.split('/').pop() || 'file').trim()
  };
}

function answersContactFields(answers) {
  const email = String(answers.contact_email || answers.contactEmail || '').trim().toLowerCase();
  return {
    answers,
    role: normalizeRole(answers.role),
    contactEmail: email,
    contactName: String(answers.contact_name || '').trim().slice(0, 200),
    contactPhone: String(answers.contact_phone || '').trim().slice(0, 40)
  };
}

function assertResumeAccess(sub, token) {
  if (!sub) {
    const err = new Error('Submission not found.');
    err.status = 404;
    throw err;
  }
  if (sub.status === 'complete') {
    const err = new Error('This submission is already complete.');
    err.status = 409;
    throw err;
  }
  const t = String(token || '').trim();
  if (!t || t !== String(sub.resumeToken || '')) {
    const err = new Error('Submission not found.');
    err.status = 404;
    throw err;
  }
}

async function streamToBuffer(stream) {
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > MAX_BYTES) {
      stream.destroy?.();
      const err = new Error(`Each file must be ${MAX_MB} MB or smaller.`);
      err.status = 400;
      throw err;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function createSubmission(req, answers) {
  const email = String(answers.contact_email || answers.contactEmail || '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    const err = new Error('Please enter a valid email address.');
    err.status = 400;
    throw err;
  }

  const now = new Date();
  const doc = {
    answers,
    role: normalizeRole(answers.role),
    contactEmail: email,
    contactName: String(answers.contact_name || '').trim().slice(0, 200),
    contactPhone: String(answers.contact_phone || '').trim().slice(0, 40),
    status: 'uploading',
    files: [],
    userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
    ip: String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim().slice(0, 64),
    createdAt: now,
    updatedAt: now
  };

  const db = await getDb();
  const result = await db.collection('onboarding').insertOne(doc);
  return { id: String(result.insertedId) };
}

async function createOrUpdateDraft(req, answers, currentStepId) {
  const email = String(answers.contact_email || answers.contactEmail || '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    const err = new Error('Please enter a valid email address.');
    err.status = 400;
    throw err;
  }

  const db = await getDb();
  const col = db.collection('onboarding');
  const existing = await col.findOne({ contactEmail: email, status: 'in_progress' });
  const now = new Date();
  const stepId = String(currentStepId || '').trim().slice(0, 80);

  if (existing) {
    const merged = { ...(existing.answers || {}), ...(answers || {}) };
    const fields = answersContactFields(merged);
    await col.updateOne(
      { _id: existing._id },
      {
        $set: {
          ...fields,
          currentStepId: stepId || existing.currentStepId || '',
          updatedAt: now
        }
      }
    );
    return { id: String(existing._id), resumeToken: existing.resumeToken };
  }

  const resumeToken = randomUUID();
  const merged = { ...(answers || {}) };
  const fields = answersContactFields(merged);
  const doc = {
    ...fields,
    status: 'in_progress',
    resumeToken,
    currentStepId: stepId,
    files: [],
    userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
    ip: String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim().slice(0, 64),
    createdAt: now,
    updatedAt: now
  };
  const result = await col.insertOne(doc);
  return { id: String(result.insertedId), resumeToken };
}

async function updateDraft(submissionId, token, payload) {
  if (!ObjectId.isValid(submissionId)) {
    const err = new Error('Submission not found.');
    err.status = 404;
    throw err;
  }
  const sub = await getSubmission(submissionId);
  assertResumeAccess(sub, token);

  const answers = payload.answers && typeof payload.answers === 'object' ? payload.answers : {};
  const merged = { ...(sub.answers || {}), ...answers };
  const fields = answersContactFields(merged);
  const stepId = String(payload.currentStepId || sub.currentStepId || '').trim().slice(0, 80);

  const db = await getDb();
  await db.collection('onboarding').updateOne(
    { _id: sub._id },
    {
      $set: {
        ...fields,
        currentStepId: stepId,
        updatedAt: new Date()
      }
    }
  );
  return { ok: true };
}

function mapDraftForClient(sub) {
  const files = (sub.files || []).map(fileMeta).filter(Boolean);
  return {
    id: String(sub._id),
    status: sub.status,
    currentStepId: sub.currentStepId || '',
    answers: sub.answers || {},
    files
  };
}

async function getDraftForResume(submissionId, token) {
  if (!ObjectId.isValid(submissionId)) {
    const err = new Error('Submission not found.');
    err.status = 404;
    throw err;
  }
  const sub = await getSubmission(submissionId);
  assertResumeAccess(sub, token);
  return mapDraftForClient(sub);
}

async function getSubmission(id) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  return db.collection('onboarding').findOne({ _id: new ObjectId(id) });
}

async function attachFile(submissionId, fieldId, file) {
  if (!String(fieldId || '').trim()) {
    const err = new Error('fieldId is required.');
    err.status = 400;
    throw err;
  }
  const sub = await getSubmission(submissionId);
  if (!sub) {
    const err = new Error('Submission not found.');
    err.status = 404;
    throw err;
  }
  if (sub.status === 'complete') {
    const err = new Error('This submission is already complete.');
    err.status = 409;
    throw err;
  }
  if ((sub.files || []).length >= MAX_FILES) {
    const err = new Error('Too many files for this submission.');
    err.status = 400;
    throw err;
  }

  const ext = extname(file.filename);
  if (!ALLOWED_EXT.has(ext)) {
    const err = new Error('File type not allowed. Use PDF, JPG, PNG, or SVG.');
    err.status = 400;
    throw err;
  }

  const safeName = String(file.filename || 'upload').replace(/[^\w.\-()+ ]/g, '_').slice(0, 180);
  const key = `onboarding/${submissionId}/${fieldId}/${randomUUID()}-${safeName}`;
  const body = await streamToBuffer(file.stream);
  const mimeType = file.mimeType || 'application/octet-stream';

  const uploaded = await uploadBuffer({
    key,
    body,
    contentType: mimeType,
    metadata: {
      submissionid: String(submissionId).slice(0, 64),
      fieldid: String(fieldId).slice(0, 80),
      originalname: safeName.slice(0, 180)
    }
  });

  const url = uploaded.url;
  const fileEntry = { fieldId: String(fieldId).trim(), url, name: safeName };

  const db = await getDb();
  await db.collection('onboarding').updateOne(
    { _id: sub._id },
    {
      $push: { files: fileEntry },
      $set: { updatedAt: new Date() }
    }
  );

  return fileEntry;
}

async function completeSubmission(submissionId) {
  const sub = await getSubmission(submissionId);
  if (!sub) {
    const err = new Error('Submission not found.');
    err.status = 404;
    throw err;
  }
  if (sub.status === 'complete') {
    const err = new Error('This submission is already complete.');
    err.status = 409;
    throw err;
  }
  const db = await getDb();
  const answers = { ...(sub.answers || {}) };
  if (!answers.submitted_at) {
    answers.submitted_at = new Date().toISOString();
  }
  await db.collection('onboarding').updateOne(
    { _id: sub._id },
    {
      $set: {
        status: 'complete',
        answers,
        updatedAt: new Date()
      }
    }
  );
  return { ok: true };
}

async function deleteSubmissionFiles(files) {
  if (!files || !files.length) return;
  await Promise.all(
    files.map((f) => {
      const key = typeof f === 'string' ? keyFromUrl(f) : f.key || keyFromUrl(f.url);
      if (!key) return Promise.resolve();
      return deleteObject(key).catch(() => {});
    })
  );
}

async function deleteSubmission(submissionId) {
  if (!ObjectId.isValid(submissionId)) {
    const err = new Error('Invalid submission id.');
    err.status = 400;
    throw err;
  }
  const db = await getDb();
  const sub = await db.collection('onboarding').findOne({ _id: new ObjectId(submissionId) });
  if (!sub) {
    const err = new Error('Submission not found.');
    err.status = 404;
    throw err;
  }
  await deleteSubmissionFiles(sub.files);
  await db.collection('onboarding').deleteOne({ _id: sub._id });
  return { ok: true };
}

async function openFileStream(url) {
  const key = keyFromUrl(url);
  if (!key) return null;
  const file = await getObjectStream(key);
  return {
    meta: {
      contentType: file.contentType,
      contentLength: file.contentLength,
      filename: key.split('/').pop() || 'download'
    },
    stream: file.stream
  };
}

module.exports = {
  MAX_MB,
  MAX_FILES,
  createSubmission,
  createOrUpdateDraft,
  updateDraft,
  getDraftForResume,
  getSubmission,
  attachFile,
  completeSubmission,
  deleteSubmission,
  openFileStream,
  fileUrl,
  fileMeta,
  normalizeRole
};
