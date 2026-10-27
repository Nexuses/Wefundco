const { GridFSBucket, ObjectId } = require('mongodb');
const { getDb } = require('./db');
const { isValidEmail } = require('./http');

const BUCKET = 'onboardingFiles';
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

function bucketFor(db) {
  return new GridFSBucket(db, { bucketName: BUCKET });
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
  const db = await getDb();
  const bucket = bucketFor(db);
  const safeName = String(file.filename || 'upload').replace(/[^\w.\-()+ ]/g, '_').slice(0, 180);
  const uploadName = `${submissionId}/${fieldId}/${Date.now()}-${safeName}`;

  const uploaded = await new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(uploadName, {
      contentType: file.mimeType || 'application/octet-stream',
      metadata: { submissionId, fieldId, originalName: file.filename }
    });
    file.stream.on('error', reject);
    uploadStream.on('error', reject);
    uploadStream.on('finish', () => {
      resolve({ id: uploadStream.id, length: uploadStream.length || 0 });
    });
    file.stream.pipe(uploadStream);
  });

  if (uploaded.length > MAX_BYTES) {
    await bucket.delete(uploaded.id).catch(() => {});
    const err = new Error(`Each file must be ${MAX_MB} MB or smaller.`);
    err.status = 400;
    throw err;
  }

  const entry = {
    fileId: String(uploaded.id),
    fieldId: String(fieldId || '').slice(0, 80),
    filename: safeName,
    mimeType: file.mimeType || 'application/octet-stream',
    size: uploaded.length
  };

  await db.collection('onboarding').updateOne(
    { _id: sub._id },
    {
      $push: { files: entry },
      $set: { updatedAt: new Date() }
    }
  );

  return entry;
}

async function completeSubmission(submissionId) {
  const sub = await getSubmission(submissionId);
  if (!sub) {
    const err = new Error('Submission not found.');
    err.status = 404;
    throw err;
  }
  const db = await getDb();
  await db.collection('onboarding').updateOne(
    { _id: sub._id },
    { $set: { status: 'complete', updatedAt: new Date() } }
  );
  return { ok: true };
}

async function deleteSubmissionFiles(db, files) {
  if (!files || !files.length) return;
  const bucket = bucketFor(db);
  await Promise.all(
    files.map((f) => {
      if (!f.fileId || !ObjectId.isValid(f.fileId)) return Promise.resolve();
      return bucket.delete(new ObjectId(f.fileId)).catch(() => {});
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
  await deleteSubmissionFiles(db, sub.files);
  await db.collection('onboarding').deleteOne({ _id: sub._id });
  return { ok: true };
}

async function openFileStream(fileId) {
  if (!ObjectId.isValid(fileId)) return null;
  const db = await getDb();
  const bucket = bucketFor(db);
  const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
  if (!files.length) return null;
  return {
    meta: files[0],
    stream: bucket.openDownloadStream(new ObjectId(fileId))
  };
}

module.exports = {
  BUCKET,
  MAX_MB,
  MAX_FILES,
  createSubmission,
  getSubmission,
  attachFile,
  completeSubmission,
  deleteSubmission,
  openFileStream,
  normalizeRole
};
