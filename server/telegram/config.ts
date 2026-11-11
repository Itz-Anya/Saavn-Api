import { createHash } from "node:crypto";

export const DEFAULT_BASE_URL = "https://saavnx.vercel.app";

function normalize(host: string): string {
  const h = host.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(h) ? h : `https://${h}`;
}

export function resolveBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const host = env.PUBLIC_URL || env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL;
  return host ? normalize(host) : DEFAULT_BASE_URL;
}

export function webhookSecret(token: string): string {
  return createHash("sha256").update(`saavnx:${token}`).digest("hex");
}
