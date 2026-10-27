/** Fail-closed same-origin check for browser-originated API mutations. */
export function mutationOriginDenied(request) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return null;
  if (!request.nextUrl.pathname.startsWith('/api/')) return null;
  const origin = request.headers.get('origin');
  if (!origin) return 'Origin header required for mutating API requests';
  if (origin !== request.nextUrl.origin) return 'Cross-origin mutations are forbidden';
  return null;
}
