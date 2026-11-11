import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { HTTPException } from "./jiosaavn/common/errors";

export const CACHE = {
  search: "public, s-maxage=1800, stale-while-revalidate=86400",
  entity: "public, s-maxage=86400, stale-while-revalidate=604800",
  listing: "public, s-maxage=3600, stale-while-revalidate=86400",
  suggestions: "public, s-maxage=600, stale-while-revalidate=3600",
} as const;

/** Attribution attached to every API response. */
export const CREDITS = {
  data: "JioSaavn (Saavn Media Limited / Jio Platforms) — all music, metadata and media belong to JioSaavn and their respective owners",
  reference: "https://github.com/sumitkolhe/jiosaavn-api",
  creators: [
    { name: "Anya", github: "https://github.com/itz-Anya" },
    { name: "Murali", github: "https://github.com/Itz-Murali" },
  ],
  disclaimer: "Unofficial project. Not affiliated with or endorsed by JioSaavn.",
} as const;

export function ok(res: Response, data: unknown, cacheControl?: string, status = 200) {
  if (cacheControl) res.setHeader("Cache-Control", cacheControl);
  res.status(status).json({ success: true, data, credits: CREDITS });
}

export function fail(res: Response, message: string, status = 400) {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json({ success: false, message, credits: CREDITS });
}

export function wrap(
  fn: (req: Request, res: Response) => Promise<unknown> | unknown,
  cacheControl?: string,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await fn(req, res);
      if (!res.headersSent) ok(res, data, cacheControl);
    } catch (err) {
      next(err);
    }
  };
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (res.headersSent) return;
  if (err instanceof HTTPException) return fail(res, err.message, err.status);
  if (err instanceof z.ZodError) return fail(res, err.errors[0]?.message ?? "Invalid request", 400);
  const message = err instanceof Error ? err.message : "Internal server error";
  console.error("[api]", err);
  return fail(res, message, 500);
}

export const numberParam = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => (v === undefined || v === "" ? undefined : Number(v)))
  .pipe(z.number().int().nonnegative().optional());

export function matchJioLink(url: string | undefined, kind: "song" | "album" | "artist"): string | undefined {
  if (!url) return undefined;
  const re = new RegExp(`jiosaavn\\.com\\/${kind}\\/[^/]+\\/([^/]+)$`);
  return url.match(re)?.[1];
}

export function matchPlaylistLink(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const matches = url.match(
    /(?:jiosaavn\.com|saavn\.com)\/(?:featured|s\/playlist)\/[^/]+\/([^/]+)$|\/([^/]+)$/,
  );
  const filtered = matches?.filter((m) => m !== undefined);
  return filtered && filtered[filtered.length - 1];
}

export function num(v: unknown, fallback: number): number {
  if (v === undefined || v === null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
