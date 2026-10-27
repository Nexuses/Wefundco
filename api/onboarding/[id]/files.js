const { allowMethods, getQuery } = require('../../../lib/http');
const { attachFile } = require('../../../lib/onboarding-store');
const { uploadOneFileFromRequest } = require('../../../lib/onboarding-multipart');
const { submissionIdFromRequest, sendError } = require('../../../lib/onboarding-http');

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['POST', 'OPTIONS'])) return;

  const id = submissionIdFromRequest(req);
  if (!id) {
    return res.status(400).json({ error: 'Submission id is required.' });
  }

  try {
    const fieldId = String(getQuery(req).fieldId || '').trim();
    const entry = await uploadOneFileFromRequest(req, id, fieldId, attachFile);
    return res.status(200).json({ ok: true, file: entry });
  } catch (err) {
    console.error('[WeFundCo] onboarding file error:', err);
    const missingMongo = /MONGODB_URI/.test(String(err && err.message));
    if (err.status) return sendError(res, err);
    return res.status(500).json({
      error: missingMongo
        ? 'Onboarding storage is not configured yet.'
        : 'Could not upload that file. Please try again.'
    });
  }
};
