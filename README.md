<div align="center">

<img src="./public/images/logo.png" alt="saavn/api" width="70%" />

# saavn/api

**Unofficial JioSaavn REST API — Node.js + Express backend, Vite + React frontend, bundled for Vercel serverless.**

<p>
  <img src="https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node 20" />
  <img src="https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

<b>14 endpoints</b> · <b>DES-decrypted media URLs</b> · <b>edge-cached</b> · <b>CORS-open</b> · <b>zero keys</b>

<p>
  <a href="#-quick-start">Quick start</a> ·
  <a href="#-deploy-to-vercel">Deploy</a> ·
  <a href="#-api-reference">API reference</a> ·
  <a href="#-credits">Credits</a>
</p>

</div>

---

## 📖 Table of contents

- [Highlights](#-highlights)
- [Quick start](#-quick-start)
- [Deploy to Vercel](#-deploy-to-vercel)
- [Telegram bot](#-telegram-bot)
- [API reference](#-api-reference)
- [Response format](#-response-format)
- [Caching strategy](#-caching-strategy)
- [Examples](#-examples)
- [Project structure](#-project-structure)
- [Creators](#-creators)
- [Credits](#-credits)
- [Disclaimer](#-disclaimer)

---

## ✨ Highlights

- 🎧 **Full JioSaavn coverage** — search, songs, albums, artists, playlists, suggestions
- 🔓 **Direct download URLs** — server-side DES decryption, streamable CDN links
- ⚡ **Edge-cached** — `s-maxage` + `stale-while-revalidate` on every response
- 🇮🇳 **Region-pinned** — deployed to Mumbai (`bom1`) for the full Indian catalogue
- 📦 **Single-bundle function** — the whole API is bundled into one Vercel serverless function via a custom esbuild pipeline
- 🌗 **Light / dark UI** — persisted, no flash on load
- 🧠 **Interactive explorer** — try every endpoint from the landing page
- 🏷️ **Built-in attribution** — every JSON response carries a `credits` object (see [Response format](#-response-format))

---

## 🚀 Quick start

**Requirements:** Node.js 20.x

```bash
npm install
npm run dev          # frontend :5173, api :3001
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Runs the API (`:3001`) and Vite frontend (`:5173`) together |
| `npm run build` | Frontend production build + API bundle |
| `npm run build:api` | Bundles the serverless function into `api/index.js` |
| `npm start` | Runs only the Express server |

Open <http://localhost:5173>. In dev, Vite proxies `/api/*` to the local Express server on `:3001`.

---

## ☁️ Deploy to Vercel

1. Push this folder to GitHub.
2. Import it as a Vercel project — no environment variables are needed for the API; add `TELEGRAM_BOT_TOKEN` for the [Telegram bot](#-telegram-bot).
3. Everything else is handled by `vercel.json`:

| Setting | Value |
| --- | --- |
| Build | `npm run build` (frontend + API bundle) |
| Output | `dist/` |
| Function | `api/index.js` — Node.js 20, region `bom1` |
| Rewrites | `/api/*` → serverless function, everything else → SPA |

---

## 🤖 Telegram bot

Saavnx Bot runs inside the same Vercel serverless function as the API — no extra server, no database, no polling. Telegram calls a webhook, the bot answers.

### Features

| | |
| --- | --- |
| 🎧 **Downloads** | Up to 320 kbps `.m4a` with cover art, title, artist and duration tags |
| 🔎 **Search** | Songs, albums, artists and playlists with paging |
| 🎛 **Vibes** | `/vibe` one-tap mood picks — Chill, Party, Heartbreak, Gym, Romance and more |
| 🎲 **Random** | `/random` surprise track |
| 🎚 **Quality** | Re-download any song in 160 / 96 / 48 kbps from the buttons under it |
| 🎵 **Similar** | Song suggestions, album and artist shortcuts, share button |
| 🔗 **Links** | Paste any `jiosaavn.com` song, album, artist or playlist link |
| ⚡ **Inline mode** | `@yourbot song name` in any chat, with the logo shown in the empty state |
| 📖 **Help** | Callback-button help menu, start screen with `public/images/m.png` |
| ❤️ **Credits** | Linked creator names on the credits screen |

### Commands

| Command | Action |
| --- | --- |
| `/start` | Welcome screen with image and menu |
| `/help` | Help menu |
| `/song <name>` | Search and download (in private chats plain text works too) |
| `/album <name>` · `/artist <name>` · `/playlist <name>` | Search by type |
| `/vibe` | Mood picker |
| `/random` | Random song |
| `/about` | Credits |
| `/ping` | Latency |

### Deploy the bot

1. **Create the bot** — open [@BotFather](https://t.me/BotFather), send `/newbot`, and copy the token.
2. **Add the images** — place `public/images/logo.png` (inline empty state) and `public/images/m.png` (start image) in the project.
3. **Deploy to Vercel** — push the project to GitHub and import it in Vercel.
4. **Add the token** — *Project → Settings → Environment Variables* → `TELEGRAM_BOT_TOKEN` = your token (Production).
5. **Redeploy** — the build registers the webhook, the command list and the bot description automatically.
6. **Enable inline mode** — in @BotFather send `/setinline`, pick your bot and set a placeholder such as `song name…`.
7. **Check** — open `https://<your-domain>/api/telegram`; it should report `configured: true` and show the webhook URL.

If the webhook was not registered (for example the token was added after the last build), open `https://<your-domain>/api/telegram/setup` once.

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | Yes | Token from @BotFather |
| `PUBLIC_URL` | No | Force the public URL, e.g. a custom domain |
| `TELEGRAM_BOT_USERNAME` | No | Skips the one-time username lookup |

The public URL resolves in this order: `PUBLIC_URL` → `VERCEL_PROJECT_PRODUCTION_URL` → `VERCEL_URL` → `https://saavnx.vercel.app`.

### Routes

| Route | Purpose |
| --- | --- |
| `POST /api/telegram` | Webhook. Requests are verified with a secret token derived from the bot token |
| `GET /api/telegram/setup` | Registers webhook, commands and bot description. `?drop=1` clears pending updates |
| `GET /api/telegram` | Status — configured flag, base URL and webhook info; the token is never exposed |

### Run locally

```bash
export TELEGRAM_BOT_TOKEN=123456:ABC...
export PUBLIC_URL=https://<your-tunnel>.example
npm run telegram:setup
npm run dev
```

Telegram needs a public HTTPS address, so use a tunnel (for example `cloudflared` or `ngrok`) pointing at the API port `3001`.

### Project layout

```
server/telegram/
├── index.ts      Express router: webhook, setup, status
├── bot.ts        Commands, callbacks, inline mode, song delivery
├── api.ts        Telegram Bot API client and file download
├── style.ts      Signature look: waveform, progress line, vibes
├── format.ts     Formatting helpers, quality picker, link parser
├── config.ts     URL resolution and webhook secret
└── commands.json Command list registered with Telegram
scripts/set-webhook.mjs   Webhook registration run at the end of the build
```

### Troubleshooting

| Symptom | Fix |
| --- | --- |
| Bot does not reply | Open `/api/telegram` and check `webhook.url` and `lastError`; run `/api/telegram/setup` |
| `401 bad secret token` | The webhook was set outside this project; run `/api/telegram/setup` |
| Start message has no image | Add `public/images/m.png` and redeploy |
| Inline empty state has no logo | Add `public/images/logo.png` and redeploy |
| Inline results do not appear | Run `/setinline` in @BotFather |
| Large songs time out | The function limit is 60 seconds in `vercel.json`; use a lower quality button |

---

## 📡 API reference

Every endpoint is `GET`, CORS-open, no auth.

### Search

| Path | Query |
| --- | --- |
| `/api/search` | `query` |
| `/api/search/songs` | `query`, `page?`, `limit?` |
| `/api/search/albums` | `query`, `page?`, `limit?` |
| `/api/search/artists` | `query`, `page?`, `limit?` |
| `/api/search/playlists` | `query`, `page?`, `limit?` |

### Songs

| Path | Params |
| --- | --- |
| `/api/songs` | `ids` (comma-separated) **or** `link` |
| `/api/songs/:id` | — |
| `/api/songs/:id/suggestions` | `limit?` |

### Albums · Artists · Playlists

| Path | Params |
| --- | --- |
| `/api/albums` | `id` **or** `link` |
| `/api/artists` | `id` **or** `link`, `page?`, `songCount?`, `albumCount?`, `sortBy?`, `sortOrder?` |
| `/api/artists/:id` | — |
| `/api/artists/:id/songs` | `page?`, `sortBy?`, `sortOrder?` |
| `/api/artists/:id/albums` | `page?`, `sortBy?`, `sortOrder?` |
| `/api/playlists` | `id` **or** `link`, `page?`, `limit?` |

> `sortBy`: `popularity` · `latest` · `alphabetical`  —  `sortOrder`: `asc` · `desc`

---

## 📦 Response format

Every response uses one of two envelopes, and **both include a `credits` object** attributing JioSaavn, the reference project and the creators.

**Success**

```json
{
  "success": true,
  "data": { "...": "..." },
  "credits": {
    "data": "JioSaavn (Saavn Media Limited / Jio Platforms) — all music, metadata and media belong to JioSaavn and their respective owners",
    "reference": "https://github.com/sumitkolhe/jiosaavn-api",
    "creators": [
      { "name": "Anya", "github": "https://github.com/itz-Anya" },
      { "name": "Murali", "github": "https://github.com/Itz-Murali" }
    ],
    "disclaimer": "Unofficial project. Not affiliated with or endorsed by JioSaavn."
  }
}
```

**Error**

```json
{
  "success": false,
  "message": "album not found",
  "credits": { "...": "same object as above" }
}
```

| Status | Meaning |
| --- | --- |
| `400` | Missing or invalid parameter |
| `404` | Resource not found |
| `500` | Upstream or server error |

---

## 🗄️ Caching strategy

| Route family | `s-maxage` | `stale-while-revalidate` |
| --- | --- | --- |
| Search | 30 m | 1 d |
| Entity (song / album / artist / playlist) | 1 d | 7 d |
| Listings (artist songs / albums) | 1 h | 1 d |
| Suggestions | 10 m | 1 h |

---

## 🧪 Examples

**Search and grab a direct CDN link**

```ts
const res = await fetch("https://<your-deploy>/api/search/songs?query=kesariya&limit=5");
const { data } = await res.json();
console.log(data.results[0].downloadUrl); // direct CDN URLs, ready to play
```




<p align="center">
  <img src="https://random-images-anya.vercel.app/am" alt="Random Image" />
</p>

---

## 🙏 Credits

- 🎵 **[JioSaavn](https://www.jiosaavn.com)** (Saavn Media Limited / Jio Platforms) — all music, metadata, artwork and media served through this API belong to JioSaavn and their respective artists, labels and rights holders. Huge thanks to the JioSaavn team for the platform this project builds on.
- 📚 **[sumitkolhe/jiosaavn-api](https://github.com/sumitkolhe/jiosaavn-api)** — the reference project this API is based on and inspired by. Thank you for the open-source groundwork.
- 👩‍💻 **[Itz-Anya](https://github.com/itz-Anya)** and **[Itz-Murali](https://github.com/Itz-Murali)** — creators of this Node.js edition.

The credits above are also shown in the website footer and returned in the `credits` field of every API response.

---

## ⚠️ Disclaimer

This is an **unofficial** project and is **not affiliated with, endorsed by, or connected to JioSaavn**. No audio is hosted here — the project only re-shapes the public JioSaavn web API into a friendlier JSON contract for developers. All trademarks, music and content are the property of their respective owners. Use responsibly and respect JioSaavn's terms of service.

---

<div align="center">

Made with 💗 by **Anya** & **Murali** · Powered by **JioSaavn** data 

</div>
