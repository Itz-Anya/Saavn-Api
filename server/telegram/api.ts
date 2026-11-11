
export class TelegramError extends Error {
  constructor(public method: string, message: string, public code?: number) {
    super(`${method}: ${message}`);
  }
}

type Params = Record<string, unknown>;

export class Telegram {
  constructor(private readonly token: string, private readonly f: typeof fetch = fetch) {}

  private url(method: string) {
    return `https://api.telegram.org/bot${this.token}/${method}`;
  }

  private async parse<T>(method: string, res: Response): Promise<T> {
    const json = (await res.json().catch(() => null)) as
      | { ok: boolean; result?: T; description?: string; error_code?: number }
      | null;
    if (!json?.ok) throw new TelegramError(method, json?.description ?? `HTTP ${res.status}`, json?.error_code ?? res.status);
    return json.result as T;
  }

  async call<T = any>(method: string, params: Params = {}): Promise<T> {
    const res = await this.f(this.url(method), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(params),
    });
    return this.parse<T>(method, res);
  }

  async upload<T = any>(
    method: string,
    params: Params,
    files: { field: string; blob: Blob; filename: string }[],
  ): Promise<T> {
    const form = new FormData();
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      form.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
    }
    for (const file of files) form.append(file.field, file.blob, file.filename);
    const res = await this.f(this.url(method), { method: "POST", body: form });
    return this.parse<T>(method, res);
  }
}

export async function downloadBlob(
  url: string,
  opts: { maxBytes?: number; timeoutMs?: number; f?: typeof fetch } = {},
): Promise<Blob> {
  const { maxBytes = 49 * 1024 * 1024, timeoutMs = 40_000, f = fetch } = opts;
  const res = await f(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
  const len = Number(res.headers.get("content-length") ?? 0);
  if (len && len > maxBytes) throw new Error("file too large for Telegram");
  const blob = await res.blob();
  if (blob.size > maxBytes) throw new Error("file too large for Telegram");
  return blob;
}
