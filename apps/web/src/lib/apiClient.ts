// Browser-side calls to our API. Errors carry the server's code and friendly message.

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
  }
}

export async function apiFetch<T = unknown>(path: string, init: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
      headers: init.body === undefined || init.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
      body: init.body === undefined ? undefined : init.body instanceof FormData ? init.body : JSON.stringify(init.body),
      signal: init.signal,
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiClientError(0, 'network', 'You seem to be offline. Check your connection and try again.');
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error ?? {};
    throw new ApiClientError(res.status, err.code ?? 'error', err.message ?? 'Something went wrong. Please try again.', err.fields);
  }
  return data as T;
}

/** SWR fetcher: GET and return JSON. */
export const swrFetcher = <T>(path: string) => apiFetch<T>(path);

/** Sends a signed-out student to sign in, then back here. */
export function goToLogin(next?: string) {
  const back = next ?? `${window.location.pathname}${window.location.search}`;
  window.location.href = `/login?next=${encodeURIComponent(back)}`;
}
