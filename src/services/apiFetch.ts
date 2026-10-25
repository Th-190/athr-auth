const readCookie = (name: string): string | null => {
  const prefix = `${name}=`;
  const value = document.cookie.split('; ').find(cookie => cookie.startsWith(prefix));
  if (!value) return null;
  try { return decodeURIComponent(value.slice(prefix.length)); } catch { return value.slice(prefix.length); }
};

const csrfMetaToken = (): string | null => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || null;

let csrfRefresh: Promise<void> | null = null;
async function refreshCsrfCookie(): Promise<void> {
  if (!csrfRefresh) {
    csrfRefresh = fetch('/sanctum/csrf-cookie', { credentials: 'include', headers: { Accept: 'application/json' } })
      .then(() => undefined)
      .finally(() => { csrfRefresh = null; });
  }
  await csrfRefresh;
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  headers.delete('Authorization');
  headers.set('Accept', headers.get('Accept') || 'application/json');
  const isUnsafe = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  const setCsrfHeader = () => {
    const cookieToken = readCookie('XSRF-TOKEN');
    if (cookieToken) {
      headers.set('X-XSRF-TOKEN', cookieToken);
      headers.delete('X-CSRF-TOKEN');
    } else {
      headers.delete('X-XSRF-TOKEN');
      const metaToken = csrfMetaToken();
      if (metaToken) headers.set('X-CSRF-TOKEN', metaToken);
      else headers.delete('X-CSRF-TOKEN');
    }
  };

  if (isUnsafe && !readCookie('XSRF-TOKEN') && !csrfMetaToken()) {
    await refreshCsrfCookie();
  }
  if (isUnsafe) setCsrfHeader();

  const response = await fetch(input, { ...init, method, headers, credentials: 'include' });
  if (isUnsafe && response.status === 419) {
    await refreshCsrfCookie();
    setCsrfHeader();
    return fetch(input, { ...init, method, headers, credentials: 'include' });
  }
  return response;
}
