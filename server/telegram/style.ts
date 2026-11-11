
const SMALL_CAPS: Record<string, string> = {
  a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ", i: "ɪ", j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ",
  n: "ɴ", o: "ᴏ", p: "ᴘ", q: "ǫ", r: "ʀ", s: "ꜱ", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ",
};

export const sc = (s: string): string => s.toLowerCase().replace(/[a-z]/g, (c) => SMALL_CAPS[c] ?? c);

export const BRAND = `✦ ${sc("saavnx")}`;
export const DOT = "◈";
export const LINE = "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈";

const BARS = "▁▂▃▄▅▆▇█";

export function wave(seed: string, length = 22): string {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  let level = 3 + (Math.abs(h) % 3);
  let out = "";
  for (let i = 0; i < length; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177) + i;
    level += (Math.abs(h) % 5) - 2;
    level = Math.max(0, Math.min(BARS.length - 1, level));
    out += BARS[level];
  }
  return out;
}

export function progress(total: string, width = 14): string {
  return `0:00 ◉${"─".repeat(width)} ${total}`;
}

export const row = (label: string, value: string): string => `${DOT} <b>${sc(label)}</b>  ${value}`;

export const VIBES: { key: string; label: string; query: string }[] = [
  { key: "chill", label: "🌙 Chill", query: "chill lofi hindi" },
  { key: "party", label: "🪩 Party", query: "party hits" },
  { key: "broken", label: "💔 Heartbreak", query: "sad hindi songs" },
  { key: "gym", label: "🔥 Gym", query: "workout motivation" },
  { key: "love", label: "💞 Romance", query: "romantic hits" },
  { key: "focus", label: "🎯 Focus", query: "instrumental focus" },
  { key: "desi", label: "🎤 Desi Hip-Hop", query: "desi hip hop" },
  { key: "retro", label: "📻 Retro", query: "old is gold classics" },
  { key: "road", label: "🚗 Road Trip", query: "road trip songs" },
  { key: "punjabi", label: "🥁 Punjabi", query: "punjabi swag" },
];
