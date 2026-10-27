function hasAdminSessionCookie(request) {
  const raw = request.headers.get('cookie');
  if (!raw) return false;
  return raw.split(';').some((part) => {
    const trimmed = part.trim();
    if (!trimmed.startsWith('wfc_admin=')) return false;
    return trimmed.length > 'wfc_admin='.length;
  });
}

export default function middleware(request) {
  const url = new URL(request.url);
  if (url.pathname !== '/admin') return;

  if (hasAdminSessionCookie(request)) return;

  url.pathname = '/admin/login';
  return Response.redirect(url, 307);
}

export const config = {
  matcher: ['/admin']
};
