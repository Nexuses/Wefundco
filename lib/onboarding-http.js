function submissionIdFromRequest(req) {
  if (req.params && req.params.id) return String(req.params.id);
  if (req.query && req.query.id) return String(req.query.id);
  try {
    const path = (req.url || '').split('?')[0];
    const parts = path.split('/').filter(Boolean);
    const idx = parts.indexOf('onboarding');
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
  } catch {
    /* ignore */
  }
  return '';
}

function sendError(res, err, fallback) {
  const status = err.status || 500;
  const message = err.message || fallback || 'Request failed';
  return res.status(status).json({ error: message });
}

module.exports = { submissionIdFromRequest, sendError };
