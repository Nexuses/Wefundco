const { allowMethods } = require('../../../lib/http');
const { completeSubmission } = require('../../../lib/onboarding-store');
const { submissionIdFromRequest, sendError } = require('../../../lib/onboarding-http');
const { sendOnboardingEmails } = require('../../../lib/mail');

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['POST', 'OPTIONS'])) return;

  const id = submissionIdFromRequest(req);
  if (!id) {
    return res.status(400).json({ error: 'Submission id is required.' });
  }

  try {
    const submission = await completeSubmission(id);
    try {
      await sendOnboardingEmails(submission);
    } catch (mailErr) {
      console.error('[WeFundCo] onboarding email failed:', mailErr);
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[WeFundCo] onboarding complete error:', err);
    const missingMongo = /MONGODB_URI/.test(String(err && err.message));
    if (err.status) return sendError(res, err);
    return res.status(500).json({
      error: missingMongo
        ? 'Onboarding storage is not configured yet.'
        : 'Could not complete your submission. Please try again.'
    });
  }
};
