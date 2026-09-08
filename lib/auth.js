const jwt = require('jsonwebtoken');
const { parseCookies } = require('./http');

const COOKIE = 'wfc_admin';
const WEEK = 7 * 24 * 60 * 60;

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
}

function signAdmin(admin) {
  return jwt.sign(
    { sub: String(admin._id), email: admin.email },
    jwtSecret(),
    { expiresIn: WEEK }
  );
}

function cookieHeader(token, { clear = false } = {}) {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const parts = [
    `${COOKIE}=${clear ? '' : token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    clear ? 'Max-Age=0' : `Max-Age=${WEEK}`
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

function readAdminToken(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE];
  if (!token) return null;
  try {
    return jwt.verify(token, jwtSecret());
  } catch {
    return null;
  }
}

function requireAdmin(req, res) {
  const admin = readAdminToken(req);
  if (!admin) {
    res.status(401).json({ error: 'Please log in' });
    return null;
  }
  return admin;
}

module.exports = {
  COOKIE,
  signAdmin,
  cookieHeader,
  readAdminToken,
  requireAdmin
};
