const { allowMethods, getBody } = require('../lib/http');
const { createSubmission } = require('../lib/onboarding-store');

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['POST', 'OPTIONS'])) return;

  try {
    const body = getBody(req);
    const answers = body.answers && typeof body.answers === 'object' ? body.answers : body;
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'answers object is required.' });
    }

    const { id } = await createSubmission(req, answers);
    return res.status(200).json({ ok: true, id });
  } catch (err) {
    console.error('[WeFundCo] onboarding create error:', err);
    const missingMongo = /MONGODB_URI/.test(String(err && err.message));
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    return res.status(500).json({
      error: missingMongo
        ? 'Onboarding storage is not configured yet.'
        : 'Could not start your submission. Please try again.'
    });
  }
};
