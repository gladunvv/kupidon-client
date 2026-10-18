// ProtectedRoute puts the blocked location into router state as `from`.
// Only same-app paths are accepted: `//host` is protocol-relative and would
// leave the app, and returning to /login itself would loop.
export function getReturnPath(state: unknown): string {
  const from = (state as { from?: { pathname?: unknown } } | null)?.from;
  const pathname = from?.pathname;
  if (
    typeof pathname !== 'string' ||
    !pathname.startsWith('/') ||
    pathname.startsWith('//') ||
    pathname.startsWith('/login')
  ) {
    return '/';
  }
  const { search, hash } = from as { search?: unknown; hash?: unknown };
  return (
    pathname +
    (typeof search === 'string' ? search : '') +
    (typeof hash === 'string' ? hash : '')
  );
}
