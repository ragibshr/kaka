import { KakaError } from './errors';

interface HttpOptions {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
}

interface HttpResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
  latencyMs: number;
}

export async function http<T = unknown>(options: HttpOptions): Promise<HttpResult<T>> {
  const { url, method = 'GET', headers = {}, body, timeoutMs = 15000, signal } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  // If an external signal is provided, link it
  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  const start = Date.now();

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const latencyMs = Date.now() - start;
    const raw = await res.text();
    let data: T;
    try {
      data = (raw ? JSON.parse(raw) : {}) as T;
    } catch {
      data = { raw: raw.slice(0, 500) } as T;
    }

    if (!res.ok) {
      throw new KakaError({
        status: res.status,
        message: `HTTP ${res.status}`,
        bodySnippet: JSON.stringify(data).slice(0, 200),
      });
    }
    return { ok: true, status: res.status, data, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - start;
    if (err instanceof KakaError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new KakaError({ status: 0, message: `Request timed out after ${timeoutMs}ms` });
    }
    throw new KakaError({ status: 0, message: (err as Error).message || 'Network error' });
  } finally {
    clearTimeout(timeout);
  }
}
