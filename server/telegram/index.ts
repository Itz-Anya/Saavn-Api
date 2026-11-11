import express, { Router } from "express";
import { services } from "../services";
import { Telegram } from "./api";
import { createBot, type Bot } from "./bot";
import { resolveBaseUrl, webhookSecret } from "./config";
import commands from "./commands.json";

let cached: { token: string; tg: Telegram; bot: Bot } | undefined;
const seen = new Map<number, number>();

function getBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return undefined;
  if (!cached || cached.token !== token) {
    const tg = new Telegram(token);
    cached = { token, tg, bot: createBot({ tg, services, baseUrl: resolveBaseUrl(), botUsername: process.env.TELEGRAM_BOT_USERNAME }) };
  }
  return cached;
}

function alreadySeen(id: unknown): boolean {
  if (typeof id !== "number") return false;
  const now = Date.now();
  for (const [k, t] of seen) if (now - t > 10 * 60_000) seen.delete(k);
  if (seen.has(id)) return true;
  seen.set(id, now);
  return false;
}

export function telegramRouter(): Router {
  const r = Router();

  r.post("/", express.json({ limit: "1mb" }), async (req, res) => {
    const ctx = getBot();
    if (!ctx) return void res.status(503).json({ ok: false, message: "TELEGRAM_BOT_TOKEN is not set" });
    if (req.header("x-telegram-bot-api-secret-token") !== webhookSecret(ctx.token))
      return void res.status(401).json({ ok: false, message: "bad secret token" });

    const update = req.body;
    if (alreadySeen(update?.update_id)) return void res.json({ ok: true, duplicate: true });
    await ctx.bot.handleUpdate(update);
    res.json({ ok: true });
  });

  r.get("/setup", async (req, res) => {
    const ctx = getBot();
    if (!ctx) return void res.status(503).json({ ok: false, message: "TELEGRAM_BOT_TOKEN is not set" });
    const webhookUrl = `${resolveBaseUrl()}/api/telegram`;
    try {
      const username = await ctx.bot.me();
      await ctx.tg.call("setWebhook", {
        url: webhookUrl,
        secret_token: webhookSecret(ctx.token),
        allowed_updates: ["message", "callback_query", "inline_query"],
        drop_pending_updates: req.query.drop === "1",
        max_connections: 40,
      });
      await ctx.tg.call("setMyCommands", { commands });
      await ctx.tg.call("setMyShortDescription", { short_description: "✦ saavnx — your pocket jukebox. Search & download songs in up to 320 kbps." }).catch(() => {});
      await ctx.tg.call("setMyDescription", {
        description: "✦ saavnx — your pocket jukebox\n\nDrop a song name and I'll spin it: 320 kbps, cover art, albums, artists, playlists, mood picks and inline mode.\n\nTap START ↓",
      }).catch(() => {});
      res.json({ ok: true, bot: `@${username}`, webhook: webhookUrl, commands: commands.length });
    } catch (e) {
      res.status(500).json({ ok: false, message: e instanceof Error ? e.message : "setup failed" });
    }
  });

  r.get("/", async (_req, res) => {
    const ctx = getBot();
    const info = ctx ? await ctx.tg.call("getWebhookInfo").catch(() => null) : null;
    res.json({
      ok: true,
      configured: Boolean(ctx),
      baseUrl: resolveBaseUrl(),
      webhook: info ? { url: info.url, pending: info.pending_update_count, lastError: info.last_error_message ?? null } : null,
    });
  });

  return r;
}
