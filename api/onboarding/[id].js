const { allowMethods, getBody, getQuery } = require('../../lib/http');
const { updateDraft, getDraftForResume } = require('../../lib/onboarding-store');
const { submissionIdFromRequest, sendError } = require('../../lib/onboarding-http');

function resumeTokenFromRequest(req, body) {
  const fromBody = body && body.resumeToken;
  if (fromBody) return String(fromBody).trim();
  const q = getQuery(req);
  if (q.token) return String(q.token).trim();
  const h = req.headers && (req.headers['x-resume-token'] || req.headers['X-Resume-Token']);
  return String(h || '').trim();
}

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'PATCH', 'OPTIONS'])) return;

  const id = submissionIdFromRequest(req);
  if (!id) {
    return res.status(400).json({ error: 'Submission id is required.' });
  }

  try {
    if (req.method === 'GET') {
      const token = resumeTokenFromRequest(req, null);
      if (!token) {
        return res.status(400).json({ error: 'Resume token is required.' });
      }
      const draft = await getDraftForResume(id, token);
      return res.status(200).json({ ok: true, draft });
    }

    const body = getBody(req);
    const token = resumeTokenFromRequest(req, body);
    if (!token) {
      return res.status(400).json({ error: 'Resume token is required.' });
    }
    const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};
    await updateDraft(id, token, {
      answers,
      currentStepId: body.currentStepId
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[WeFundCo] onboarding draft error:', err);
    const missingMongo = /MONGODB_URI/.test(String(err && err.message));
    if (err.status) return sendError(res, err);
    return res.status(500).json({
      error: missingMongo
        ? 'Onboarding storage is not configured yet.'
        : 'Could not save your progress. Please try again.'
    });
  }
};
