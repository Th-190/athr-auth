const readCookie = (name: string): string | null => {
  const prefix = `${name}=`;
  const value = document.cookie.split('; ').find(cookie => cookie.startsWith(prefix));
  return value ? decodeURIComponent(value.slice(prefix.length)) : null;
};

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  headers.delete('Authorization');
  headers.set('Accept', headers.get('Accept') || 'application/json');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    let csrf = readCookie('XSRF-TOKEN');
    if (!csrf) {
      await fetch('/sanctum/csrf-cookie', { credentials: 'same-origin' });
      csrf = readCookie('XSRF-TOKEN');
    }
    if (csrf) headers.set('X-XSRF-TOKEN', csrf);
  }
  return fetch(input, { ...init, method, headers, credentials: 'same-origin' });
}
