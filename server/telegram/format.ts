import type { z } from "zod";
import type { SongModel } from "../jiosaavn/modules/songs/models";

export type Song = z.infer<typeof SongModel>;

export const QUALITIES = ["320", "160", "96", "48"] as const;
export type Quality = (typeof QUALITIES)[number];
export const DEFAULT_QUALITY: Quality = "320";

export const CREATORS = [
  { name: "𝚨𝝒𝛄ꫝ ˚‌⁣♡゙", url: "https://github.com/Itz-Anya" },
  { name: "𝐌 𝐔 𝐑 𝚨 𝐋 𝐈", url: "https://github.com/Itz-Murali" },
] as const;

export const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const clean = (s: unknown): string =>
  esc(
    String(s ?? "")
      .replace(/&quot;/g, '"')
      .replace(/&#039;|&apos;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim(),
  );

export const plain = (s: unknown): string =>
  String(s ?? "")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();

export const truncate = (s: string, max: number): string => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

export function fmtDuration(sec: number | null | undefined): string {
  if (!sec || sec < 0) return "–";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function fmtCount(n: number | null | undefined): string {
  if (!n) return "–";
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

export const primaryArtists = (song: Song): string => {
  const list = song.artists?.primary?.length ? song.artists.primary : song.artists?.all ?? [];
  return list.map((a) => plain(a.name)).join(", ") || "Unknown artist";
};

export const pickImage = (images: { quality: string; url: string }[] | undefined, quality = "500x500"): string | undefined =>
  images?.find((i) => i.quality === quality)?.url ?? images?.[images.length - 1]?.url;

export function pickDownload(song: Song, quality: Quality): { url: string; quality: string } | undefined {
  const links = song.downloadUrl ?? [];
  if (!links.length) return undefined;
  const exact = links.find((l) => l.quality === `${quality}kbps`);
  if (exact) return exact;
  const want = Number(quality);
  const sorted = [...links].sort(
    (a, b) => Math.abs(parseInt(a.quality) - want) - Math.abs(parseInt(b.quality) - want),
  );
  return sorted[0];
}

export function fitBytes(s: string, maxBytes: number): string {
  let out = "";
  let bytes = 0;
  for (const ch of s) {
    const b = Buffer.byteLength(ch);
    if (bytes + b > maxBytes) break;
    out += ch;
    bytes += b;
  }
  return out;
}

export function parseJioLink(
  text: string,
): { kind: "song" | "album" | "artist" | "playlist"; token: string } | undefined {
  const m = text.match(/https?:\/\/(?:www\.)?(?:jiosaavn|saavn)\.com\/(song|album|artist|featured|s\/playlist)\/[^/\s]+\/([^/\s?#]+)/i);
  if (!m) return undefined;
  const kind = m[1] === "featured" || m[1] === "s/playlist" ? "playlist" : (m[1].toLowerCase() as "song" | "album" | "artist");
  return { kind, token: m[2] };
}
