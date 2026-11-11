import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const env = process.env;
const force = process.argv.includes("--force");
const token = env.TELEGRAM_BOT_TOKEN;

if (!token) process.exit(0);
if (!force && env.VERCEL_ENV && env.VERCEL_ENV !== "production") process.exit(0);

const host = env.PUBLIC_URL || env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL || "saavnx.vercel.app";
const base = (/^https?:\/\//i.test(host) ? host : `https://${host}`).replace(/\/+$/, "");
const secret = createHash("sha256").update(`saavnx:${token}`).digest("hex");
const commands = JSON.parse(readFileSync(new URL("../server/telegram/commands.json", import.meta.url), "utf8"));

const call = async (method, body) => {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`${method}: ${json.description}`);
  return json.result;
};

try {
  await call("setWebhook", {
    url: `${base}/api/telegram`,
    secret_token: secret,
    allowed_updates: ["message", "callback_query", "inline_query"],
    max_connections: 40,
  });
  await call("setMyCommands", { commands });
  console.log(`telegram webhook → ${base}/api/telegram`);
} catch (e) {
  console.warn(`telegram webhook: ${e.message}`);
}
