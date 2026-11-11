import type { services as Services } from "../services";
import { Telegram, TelegramError, downloadBlob } from "./api";
import {
  CREATORS,
  DEFAULT_QUALITY,
  QUALITIES,
  clean,
  esc,
  fitBytes,
  fmtCount,
  fmtDuration,
  parseJioLink,
  pickDownload,
  pickImage,
  plain,
  primaryArtists,
  truncate,
  type Quality,
  type Song,
} from "./format";
import { BRAND, DOT, LINE, VIBES, progress, row, sc, wave } from "./style";

type Button = Record<string, unknown>;
type Keyboard = { inline_keyboard: Button[][] };
type Any = any;

export interface BotDeps {
  tg: Telegram;
  services: typeof Services;
  baseUrl: string;
  botUsername?: string;
  fetchImpl?: typeof fetch;
}

const PAGE = 8;
const SEP = LINE;
const niceLang = (l?: string | null) => (l && l.toLowerCase() !== "unknown" ? l[0].toUpperCase() + l.slice(1) : "");
const RANDOM_QUERIES = [
  "arijit singh", "lofi hindi", "punjabi hits", "romantic hindi", "90s bollywood", "edm party",
  "sad songs hindi", "tamil hits", "telugu hits", "english pop", "retro classics", "workout hits",
  "diljit dosanjh", "atif aslam", "shreya ghoshal", "ap dhillon", "anirudh", "kk hits",
];

const btn = (text: string, callback_data: string): Button => ({ text, callback_data });
const link = (text: string, url: string): Button => ({ text, url });
const kb = (...rows: Button[][]): Keyboard => ({ inline_keyboard: rows.filter((r) => r.length) });

const creditsHtml = () =>
  `${DOT} <b>${sc("crafted with love by")}</b>\n` +
  CREATORS.map((c) => `      ✦ <a href="${c.url}">${c.name}</a>`).join("\n");

export function createBot(deps: BotDeps) {
  const { tg, services, baseUrl } = deps;
  const f = deps.fetchImpl ?? fetch;
  let username = deps.botUsername?.replace(/^@/, "");

  async function me(): Promise<string> {
    if (!username) username = (await tg.call<{ username: string }>("getMe")).username;
    return username;
  }

  const startText = (first: string) =>
    `${BRAND} ✦\n<i>your pocket jukebox${first ? `, ${esc(first)}` : ""}</i>\n\n` +
    `${wave("saavnx-start", 26)}\n\n` +
    `<b>drop a song name — i'll spin it.</b>\n\n` +
    `${DOT} 320 kbps · cover art · full tags\n` +
    `${DOT} albums · artists · playlists\n` +
    `${DOT} paste any jiosaavn link\n` +
    `${DOT} mood picks with /vibe\n` +
    `${DOT} inline mode, in any chat\n\n` +
    `<i>tap below ↓</i>`;

  const mainMenu = async (): Promise<Keyboard> => {
    const u = await me();
    return kb(
      [btn("🎛 Pick a vibe", "h:vibe"), btn("🎲 Surprise me", "rnd")],
      [btn("📖 Help", "h:cmds"), btn("⚡ Inline mode", "h:inline")],
      [{ text: "🔍 Search inline", switch_inline_query_current_chat: "" }, btn("🎚 Quality", "h:quality")],
      [btn("💫 Credits", "h:about"), link("➕ Add to group", `https://t.me/${u}?startgroup=true`)],
    );
  };

  const vibeKeyboard = (): Keyboard => {
    const rows: Button[][] = [];
    for (let i = 0; i < VIBES.length; i += 2)
      rows.push(VIBES.slice(i, i + 2).map((v) => btn(v.label, `v:${v.key}`)));
    return kb(...rows, [btn("🎲 Surprise me", "rnd"), btn("🏠 Home", "h:main")]);
  };

  const backRow = (): Button[] => [btn("⬅️ Back", "h:main"), btn("🏠 Home", "h:main")];

  const HELP: Record<string, string> = {
    cmds:
      `${BRAND} · <b>${sc("help")}</b>\n${SEP}\n` +
      `/song <code>name</code>  ›  search &amp; download\n` +
      `/album <code>name</code>  ›  find albums\n` +
      `/artist <code>name</code>  ›  find artists\n` +
      `/playlist <code>name</code>  ›  find playlists\n` +
      `/vibe  ›  pick a mood 🎛\n` +
      `/random  ›  surprise track 🎲\n` +
      `/about  ·  /ping\n${SEP}\n` +
      `<i>in private chat you can skip commands — just type the song.\n` +
      `paste a jiosaavn link and i'll fetch it instantly.</i>`,
    search:
      `${BRAND} · <b>${sc("how to search")}</b>\n${SEP}\n` +
      `${DOT} send a name: <code>Kesariya</code>\n` +
      `${DOT} add the artist: <code>Tum Hi Ho Arijit</code>\n` +
      `${DOT} tap a <b>number</b> to get that track\n` +
      `${DOT} flip pages, or jump to 💿 albums · 🎤 artists · 📃 playlists\n${SEP}\n` +
      `<i>under every song: other qualities · similar · album · artist · share</i>`,
    quality:
      `${BRAND} · <b>${sc("quality")}</b>\n${SEP}\n` +
      `${DOT} default drop is <b>320 kbps</b> — the best there is\n` +
      `${DOT} tap <b>160k / 96k / 48k</b> under any song to re-grab it lighter\n\n` +
      `<i>every file carries title, artist, cover art &amp; duration.</i>`,
    inline:
      `${BRAND} · <b>${sc("inline mode")}</b>\n${SEP}\n` +
      `in <b>any</b> chat, type:\n<code>@${username ?? "botusername"} song name</code>\n\n` +
      `${DOT} pick a result → a song card lands in the chat\n` +
      `${DOT} tap <b>⬇️ Download</b> to attach the audio\n` +
      `${DOT} or <b>🤖 Get in bot</b> to receive the file privately`,
    vibe:
      `${BRAND} · <b>${sc("pick a vibe")}</b>\n${SEP}\n` +
      `<i>no idea what to play? choose a mood.</i>`,
    about:
      `${BRAND} · <b>${sc("about")}</b>\n${SEP}\n${creditsHtml()}\n\n` +
      `music &amp; media belong to <b>JioSaavn</b> and their respective owners.\n` +
      `<i>unofficial · not affiliated with or endorsed by jiosaavn.</i>`,
  };

  async function helpView(key: string): Promise<{ text: string; kb: Keyboard }> {
    if (key === "main") return { text: startText(""), kb: await mainMenu() };
    if (key === "about")
      return {
        text: HELP.about,
        kb: kb(
          CREATORS.map((c) => link(`🔗 ${plain(c.name)}`.replace(/[‌⁣]/g, ""), c.url)),
          backRow(),
        ),
      };
    if (key === "vibe") return { text: HELP.vibe, kb: vibeKeyboard() };
    if (key === "inline")
      return {
        text: HELP.inline,
        kb: kb([{ text: "🔍 Try it now", switch_inline_query_current_chat: "" }], backRow()),
      };
    return { text: HELP[key] ?? HELP.cmds, kb: kb(backRow()) };
  }

  async function sendView(chat_id: number, text: string, reply_markup: Keyboard, withPhoto: boolean, extra: Any = {}) {
    if (withPhoto) {
      try {
        await tg.call("sendPhoto", {
          chat_id,
          photo: `${baseUrl}/images/m.png`,
          caption: text,
          parse_mode: "HTML",
          reply_markup,
          ...extra,
        });
        return;
      } catch {}
    }
    await tg.call("sendMessage", {
      chat_id,
      text,
      parse_mode: "HTML",
      reply_markup,
      link_preview_options: { is_disabled: true },
      ...extra,
    });
  }

  async function editView(cb: Any, text: string, reply_markup: Keyboard) {
    const m = cb.message;
    const base = { chat_id: m.chat.id, message_id: m.message_id, reply_markup, parse_mode: "HTML" };
    try {
      if (m.photo || m.audio || m.document || m.video) await tg.call("editMessageCaption", { ...base, caption: truncate(text, 1020) });
      else await tg.call("editMessageText", { ...base, text, link_preview_options: { is_disabled: true } });
    } catch (e) {
      if (!(e instanceof TelegramError && /not modified/i.test(e.message))) throw e;
    }
  }

  function songCaption(song: Song, quality: string, user: string): string {
    const album = song.album?.name ? clean(song.album.name) : "";
    const lang = niceLang(song.language);
    const lines = [
      `${BRAND} · <b>${sc("now spinning")}</b>`,
      ``,
      `<b>${clean(song.name)}</b>`,
      `<i>${esc(truncate(primaryArtists(song), 120))}</i>`,
      ``,
      wave(song.id),
      progress(fmtDuration(song.duration)),
      ``,
      album ? row("album", song.album.url ? `<a href="${esc(song.album.url)}">${album}</a>` : album) : "",
      row("year", `${esc(song.year ?? "–")}${lang ? ` · ${esc(lang)}` : ""}`),
      row("quality", esc(quality.replace("kbps", " kbps"))),
      song.playCount ? row("plays", fmtCount(song.playCount)) : "",
      song.label ? row("label", esc(truncate(plain(song.label), 50))) : "",
      song.explicitContent ? `🔞 <i>explicit</i>` : "",
      ``,
      `<i>spun by @${esc(user)}</i>`,
    ].filter((l, i, arr) => l !== "" || (arr[i - 1] !== "" && i > 0));
    return truncate(lines.join("\n"), 1020);
  }

  function songKeyboard(song: Song, current: string, user: string): Keyboard {
    const others = QUALITIES.filter((q) => `${q}kbps` !== current).slice(0, 3);
    const artistId = song.artists?.primary?.[0]?.id ?? song.artists?.all?.[0]?.id;
    return kb(
      others.map((q) => btn(`🎚 ${q}k`, `d:${song.id}:${q}`)),
      [
        btn("🎵 Similar", `r:${song.id}`),
        ...(song.album?.id ? [btn("💿 Album", `alb:${song.album.id}:0`)] : []),
        ...(artistId ? [btn("🎤 Artist", `art:${artistId}:0`)] : []),
      ],
      [
        { text: "📤 Share", switch_inline_query: truncate(plain(song.name), 60) },
        ...(song.url ? [link("🔗 JioSaavn", song.url)] : []),
      ],
    );
  }

  async function sendSong(chat_id: number, songId: string, quality: Quality = DEFAULT_QUALITY, extra: Any = {}) {
    const user = await me();
    const [song] = await services.song.getSongByIds({ songIds: songId });
    if (!song) throw new Error("song not found");
    const dl = pickDownload(song, quality);
    if (!dl) {
      await tg.call("sendMessage", { chat_id, text: "😕 No downloadable file is available for this song.", ...extra });
      return;
    }
    await tg.call("sendChatAction", { chat_id, action: "upload_voice" }).catch(() => {});

    const caption = songCaption(song, dl.quality, user);
    const reply_markup = songKeyboard(song, dl.quality, user);
    const title = plain(song.name);
    const performer = truncate(primaryArtists(song), 100);
    const duration = song.duration ?? undefined;
    const common = { chat_id, caption, parse_mode: "HTML", reply_markup, title, performer, duration, ...extra };

    try {
      const thumbUrl = pickImage(song.image, "150x150");
      const [audio, thumb] = await Promise.all([
        downloadBlob(dl.url, { f }),
        thumbUrl ? downloadBlob(thumbUrl, { maxBytes: 190 * 1024, timeoutMs: 8000, f }).catch(() => undefined) : undefined,
      ]);
      const safe = `${title} - ${performer}`.replace(/[\\/:*?"<>|]+/g, " ").slice(0, 80).trim() || "song";
      const files = [{ field: "audio", blob: new Blob([audio], { type: "audio/mp4" }), filename: `${safe}.m4a` }];
      const params: Any = { ...common };
      if (thumb) {
        files.push({ field: "thumbnail", blob: new Blob([thumb], { type: "image/jpeg" }), filename: "cover.jpg" });
        params.thumbnail = "attach://thumbnail";
      }
      params.audio = "attach://audio";
      await tg.upload("sendAudio", params, files);
      return;
    } catch {}

    try {
      await tg.call("sendAudio", { ...common, audio: dl.url });
      return;
    } catch {}

    await tg.call("sendMessage", {
      chat_id,
      text: `${caption}\n\n⚠️ <i>Couldn't attach the file — use the direct link below.</i>`,
      parse_mode: "HTML",
      reply_markup: kb([link("⬇️ Direct download", dl.url)], ...songKeyboard(song, dl.quality, user).inline_keyboard),
      ...extra,
    });
  }

  const NUM = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

  const navRow = (page: number, hasNext: boolean, mk: (p: number) => string): Button[] => [
    ...(page > 0 ? [btn("◀️ Prev", mk(page - 1))] : []),
    btn(`📄 ${page + 1}`, "noop"),
    ...(hasNext ? [btn("Next ▶️", mk(page + 1))] : []),
  ];

  function numberGrid(ids: string[]): Button[][] {
    const rows: Button[][] = [];
    for (let i = 0; i < ids.length; i += 4)
      rows.push(ids.slice(i, i + 4).map((id, j) => btn(`${i + j + 1}`, `d:${id}:${DEFAULT_QUALITY}`)));
    return rows;
  }

  const songLines = (songs: Song[], offset = 0) =>
    songs
      .map(
        (s, i) =>
          `${NUM[offset + i] ?? `${offset + i + 1}.`} <b>${clean(truncate(plain(s.name), 46))}</b>\n      <i>${esc(truncate(primaryArtists(s), 38))}</i> ${DOT} ${fmtDuration(s.duration)}`,
      )
      .join("\n");

  async function songSearchView(query: string, page: number): Promise<{ text: string; kb: Keyboard } | undefined> {
    const res = await services.search.searchSongs({ query, page, limit: PAGE });
    if (!res.results.length) return undefined;
    const q = fitBytes(query, 40);
    const from = page * PAGE + 1;
    const to = page * PAGE + res.results.length;
    return {
      text:
        `${BRAND} · <b>${sc("results")}</b>\n“${esc(truncate(query, 60))}” <i>· ${from}–${to}${res.total ? ` of ${res.total}` : ""}</i>\n${SEP}\n` +
        songLines(res.results),
      kb: kb(
        ...numberGrid(res.results.map((s) => s.id)),
        navRow(page, to < res.total, (p) => `s:${p}:${q}`),
        [btn("💿 Albums", `sa:0:${q}`), btn("🎤 Artists", `sr:0:${q}`), btn("📃 Playlists", `sp:0:${q}`)],
      ),
    };
  }

  async function entitySearchView(kind: "sa" | "sr" | "sp", query: string, page: number) {
    const q = fitBytes(query, 40);
    const nav = (hasNext: boolean) => navRow(page, hasNext, (p) => `${kind}:${p}:${q}`);
    const switchRow = [btn("🎵 Songs", `s:0:${q}`)];
    let rows: { id: string; label: string }[] = [];
    let total = 0;
    let title = "";
    let target = "";
    if (kind === "sa") {
      const r = await services.search.searchAlbums({ query, page, limit: PAGE });
      rows = r.results.map((a) => ({ id: a.id, label: `💿 ${truncate(plain(a.name), 30)}${a.year ? ` (${a.year})` : ""}` }));
      total = r.total; title = "💿 Albums"; target = "alb";
    } else if (kind === "sr") {
      const r = await services.search.searchArtists({ query, page, limit: PAGE });
      rows = r.results.map((a) => ({ id: a.id, label: `🎤 ${truncate(plain(a.name), 36)}` }));
      total = r.total; title = "🎤 Artists"; target = "art";
    } else {
      const r = await services.search.searchPlaylists({ query, page, limit: PAGE });
      rows = r.results.map((p) => ({ id: p.id, label: `📃 ${truncate(plain(p.name), 34)}${p.songCount ? ` · ${p.songCount}` : ""}` }));
      total = r.total; title = "📃 Playlists"; target = "pl";
    }
    if (!rows.length) return undefined;
    const shown = page * PAGE + rows.length;
    return {
      text: `${BRAND} · <b>${sc(title.replace(/^\S+\s/, ""))}</b> ${title.split(" ")[0]}\n“${esc(truncate(query, 60))}” <i>· tap to open</i>`,
      kb: kb(
        ...rows.map((r) => [btn(r.label, `${target}:${r.id}:0`)]),
        nav(shown < total),
        [...switchRow, ...(kind !== "sa" ? [btn("💿 Albums", `sa:0:${q}`)] : []), ...(kind !== "sr" ? [btn("🎤 Artists", `sr:0:${q}`)] : []), ...(kind !== "sp" ? [btn("📃 Playlists", `sp:0:${q}`)] : [])],
      ),
    };
  }

  function trackListView(opts: {
    heading: string; sub: string; prefix: string; id: string; songs: Song[]; page: number; url?: string; image?: string;
  }) {
    const { songs, page } = opts;
    const slice = songs.slice(page * PAGE, page * PAGE + PAGE);
    return {
      text:
        `${opts.heading}\n<i>${opts.sub}</i>\n${SEP}\n` + songLines(slice),
      kb: kb(
        ...numberGrid(slice.map((s) => s.id)),
        navRow(page, (page + 1) * PAGE < songs.length, (p) => `${opts.prefix}:${opts.id}:${p}`),
        opts.url ? [link("🔗 Open on JioSaavn", opts.url)] : [],
      ),
    };
  }

  async function albumView(id: string, page: number) {
    const album = await services.album.getAlbumById(id);
    const songs = album.songs ?? [];
    const by = album.artists?.primary?.map((a) => plain(a.name)).join(", ");
    return trackListView({
      heading: `${BRAND} · 💿 <b>${clean(album.name)}</b>`,
      sub: `${esc(by || "Various artists")} · ${esc(album.year ?? "–")} · ${songs.length} tracks`,
      prefix: "alb", id, songs, page, url: album.url,
    });
  }

  async function playlistView(id: string, page: number) {
    const pl = await services.playlist.getPlaylistById({ id, page: 0, limit: 50 });
    const songs = pl.songs ?? [];
    return trackListView({
      heading: `${BRAND} · 📃 <b>${clean(pl.name)}</b>`,
      sub: `${songs.length} tracks${pl.language ? ` · ${esc(pl.language)}` : ""}`,
      prefix: "pl", id, songs, page, url: pl.url,
    });
  }

  async function artistView(id: string, page: number) {
    const { songs, total } = await services.artist.getArtistSongs({
      artistId: id, page, sortBy: "popularity", sortOrder: "desc",
    });
    const name =
      songs[0]?.artists?.primary?.find((a) => a.id === id)?.name ?? songs[0]?.artists?.primary?.[0]?.name ?? "Artist";
    const slice = songs.slice(0, 10);
    return {
      text: `${BRAND} · 🎤 <b>${clean(name)}</b>\n<i>top songs · page ${page + 1}</i>\n${SEP}\n${songLines(slice)}`,
      kb: kb(
        ...numberGrid(slice.map((s) => s.id)),
        navRow(page, (page + 1) * 10 < total, (p) => `art:${id}:${p}`),
        [btn("💿 Albums", `sa:0:${fitBytes(plain(name), 40)}`)],
      ),
    };
  }

  async function similarView(id: string) {
    const songs = await services.song.getSongSuggestions({ songId: id, limit: PAGE });
    if (!songs.length) return undefined;
    return {
      text: `${BRAND} · <b>${sc("more like this")}</b>\n<i>tap a number to grab it</i>\n${SEP}\n${songLines(songs)}`,
      kb: kb(...numberGrid(songs.map((s) => s.id))),
    };
  }

  const NOT_FOUND = (q: string) =>
    `🫥 <b>nothing found</b> for “${esc(truncate(q, 60))}”\n<i>try the song name + artist, or check the spelling.</i>`;

  async function reply(chat_id: number, text: string, reply_markup?: Keyboard, extra: Any = {}) {
    return tg.call("sendMessage", {
      chat_id, text, parse_mode: "HTML", reply_markup,
      link_preview_options: { is_disabled: true }, ...extra,
    });
  }

  async function doSongSearch(chat_id: number, query: string, extra: Any = {}) {
    await tg.call("sendChatAction", { chat_id, action: "typing" }).catch(() => {});
    const view = await songSearchView(query, 0);
    if (!view) return reply(chat_id, NOT_FOUND(query), undefined, extra);
    return reply(chat_id, view.text, view.kb, extra);
  }

  async function doEntitySearch(chat_id: number, kind: "sa" | "sr" | "sp", query: string, extra: Any = {}) {
    await tg.call("sendChatAction", { chat_id, action: "typing" }).catch(() => {});
    const view = await entitySearchView(kind, query, 0);
    if (!view) return reply(chat_id, NOT_FOUND(query), undefined, extra);
    return reply(chat_id, view.text, view.kb, extra);
  }

  async function handleLink(chat_id: number, parsed: NonNullable<ReturnType<typeof parseJioLink>>, extra: Any) {
    const { kind, token } = parsed;
    if (kind === "song") {
      const [song] = await services.song.getSongByLink(token);
      return sendSong(chat_id, song.id, DEFAULT_QUALITY, extra);
    }
    if (kind === "album") {
      const album = await services.album.getAlbumByLink(token);
      const v = await albumView(album.id, 0);
      return reply(chat_id, v.text, v.kb, extra);
    }
    if (kind === "playlist") {
      const pl = await services.playlist.getPlaylistByLink({ token, page: 0, limit: 50 });
      const v = await playlistView(pl.id, 0);
      return reply(chat_id, v.text, v.kb, extra);
    }
    const artist = await services.artist.getArtistByLink({ token, page: 0, songCount: 10, albumCount: 10, sortBy: "popularity", sortOrder: "desc" });
    const v = await artistView(artist.id, 0);
    return reply(chat_id, v.text, v.kb, extra);
  }

  async function onMessage(msg: Any) {
    if (msg.via_bot || msg.from?.is_bot) return;
    const chat_id: number = msg.chat.id;
    const isPrivate = msg.chat.type === "private";
    const text: string = (msg.text ?? msg.caption ?? "").trim();
    if (!text) return;
    const extra = isPrivate ? {} : { reply_parameters: { message_id: msg.message_id, allow_sending_without_reply: true } };
    const u = await me();

    const cmdMatch = text.match(/^\/([a-zA-Z_]+)(?:@(\w+))?(?:\s+([\s\S]*))?$/);
    if (cmdMatch) {
      const [, cmd, target, argsRaw] = cmdMatch;
      if (target && target.toLowerCase() !== u.toLowerCase()) return;
      const args = (argsRaw ?? "").trim();
      switch (cmd.toLowerCase()) {
        case "start": {
          if (args.startsWith("song_")) return sendSong(chat_id, args.slice(5), DEFAULT_QUALITY, extra);
          return sendView(chat_id, startText(msg.from?.first_name ?? ""), await mainMenu(), true, extra);
        }
        case "help":
          return sendView(chat_id, HELP.cmds, kb([btn("🔎 How to search", "h:search"), btn("⚡ Inline mode", "h:inline")], [btn("🎛 Vibes", "h:vibe"), btn("🎚 Quality", "h:quality")], [btn("💫 Credits", "h:about"), btn("🏠 Home", "h:main")]), true, extra);
        case "vibe": case "mood":
          return reply(chat_id, HELP.vibe, vibeKeyboard(), extra);
        case "about":
          return reply(chat_id, HELP.about, (await helpView("about")).kb, extra);
        case "ping": {
          const t = Date.now();
          const sent = await reply(chat_id, "🏓 Pinging…", undefined, extra);
          return tg.call("editMessageText", {
            chat_id, message_id: sent.message_id, parse_mode: "HTML",
            text: `🏓 <b>Pong!</b> <code>${Date.now() - t} ms</code>`,
          });
        }
        case "random": {
          const q = RANDOM_QUERIES[Math.floor(Math.random() * RANDOM_QUERIES.length)];
          const page = Math.floor(Math.random() * 3);
          const res = await services.search.searchSongs({ query: q, page, limit: 20 });
          if (!res.results.length) return reply(chat_id, NOT_FOUND(q), undefined, extra);
          const pick = res.results[Math.floor(Math.random() * res.results.length)];
          await reply(chat_id, `🎲 <b>${sc("random pick")}</b> · <i>${esc(q)}</i>`, undefined, extra);
          return sendSong(chat_id, pick.id, DEFAULT_QUALITY, extra);
        }
        case "song": case "s": case "search": case "download": case "dl": case "music": {
          if (!args) return reply(chat_id, `🎵 <b>Usage:</b> /song <code>song name</code>\n<i>e.g.</i> <code>/song Kesariya</code>`, undefined, extra);
          const parsed = parseJioLink(args);
          if (parsed) return handleLink(chat_id, parsed, extra);
          return doSongSearch(chat_id, args, extra);
        }
        case "album":
          if (!args) return reply(chat_id, `💿 <b>Usage:</b> /album <code>album name</code>`, undefined, extra);
          return doEntitySearch(chat_id, "sa", args, extra);
        case "artist":
          if (!args) return reply(chat_id, `🎤 <b>Usage:</b> /artist <code>artist name</code>`, undefined, extra);
          return doEntitySearch(chat_id, "sr", args, extra);
        case "playlist":
          if (!args) return reply(chat_id, `📃 <b>Usage:</b> /playlist <code>playlist name</code>`, undefined, extra);
          return doEntitySearch(chat_id, "sp", args, extra);
        default:
          return isPrivate ? reply(chat_id, `🤔 Unknown command. Try /help`, undefined, extra) : undefined;
      }
    }

    const parsed = parseJioLink(text);
    if (parsed) return handleLink(chat_id, parsed, extra);
    if (isPrivate) return doSongSearch(chat_id, text.slice(0, 100), extra);
  }

  async function show(cb: Any, v: { text: string; kb: Keyboard }) {
    if (cb.message.audio) return reply(cb.message.chat.id, v.text, v.kb);
    return editView(cb, v.text, v.kb);
  }

  async function onCallback(cb: Any) {
    const data: string = cb.data ?? "";
    const answer = (text?: string, alert = false) =>
      tg.call("answerCallbackQuery", { callback_query_id: cb.id, text, show_alert: alert }).catch(() => {});

    if (data === "noop") return answer();

    if (data.startsWith("dli:")) return onInlineDownload(cb, data.slice(4));

    const m = cb.message;
    if (!m) return answer("This message is too old.", true);
    const chat_id: number = m.chat.id;
    const [kind, a, b, ...rest] = data.split(":");
    const tail = [b, ...rest].join(":");

    try {
      switch (kind) {
        case "h": {
          await answer();
          const v = await helpView(a);
          return editView(cb, v.text, v.kb);
        }
        case "v": {
          const vibe = VIBES.find((x) => x.key === a);
          await answer(vibe ? `${vibe.label} ✨` : undefined);
          if (!vibe) return;
          const v = await songSearchView(vibe.query, 0);
          if (v) return show(cb, { text: v.text.replace(/<b>[^<]*<\/b>/, `<b>${sc(vibe.label.replace(/^\S+\s/, ""))}</b>`), kb: v.kb });
          return;
        }
        case "rnd": {
          await answer("🎲 Picking something for you…");
          const q = RANDOM_QUERIES[Math.floor(Math.random() * RANDOM_QUERIES.length)];
          const res = await services.search.searchSongs({ query: q, page: Math.floor(Math.random() * 3), limit: 20 });
          if (!res.results.length) return;
          return sendSong(chat_id, res.results[Math.floor(Math.random() * res.results.length)].id);
        }
        case "d": {
          const q = (QUALITIES as readonly string[]).includes(b) ? (b as Quality) : DEFAULT_QUALITY;
          await answer(`⬇️ Preparing ${q} kbps…`);
          return sendSong(chat_id, a, q);
        }
        case "r": {
          await answer("🎵 Finding similar songs…");
          const v = await similarView(a);
          if (!v) return reply(chat_id, "😕 No similar songs found.");
          return reply(chat_id, v.text, v.kb);
        }
        case "s": {
          await answer();
          const v = await songSearchView(tail, Number(a) || 0);
          if (v) return editView(cb, v.text, v.kb);
          return;
        }
        case "sa": case "sr": case "sp": {
          await answer();
          const v = await entitySearchView(kind, tail, Number(a) || 0);
          if (v) return editView(cb, v.text, v.kb);
          return;
        }
        case "alb": case "pl": case "art": {
          await answer();
          const page = Number(b) || 0;
          const v = kind === "alb" ? await albumView(a, page) : kind === "pl" ? await playlistView(a, page) : await artistView(a, page);
          return show(cb, v);
        }
        default:
          return answer();
      }
    } catch (e) {
      console.error("[bot] callback error", data, e);
      await answer("⚠️ Something went wrong. Please try again.", true);
    }
  }

  async function onInlineDownload(cb: Any, songId: string) {
    const answer = (text?: string, alert = false) =>
      tg.call("answerCallbackQuery", { callback_query_id: cb.id, text, show_alert: alert }).catch(() => {});
    const inline_message_id: string | undefined = cb.inline_message_id;
    const u = await me();
    const openBot = kb([link("🤖 Get the file in bot", `https://t.me/${u}?start=song_${songId}`)]);
    if (!inline_message_id) return answer("Open the bot to download this song.", true);
    try {
      const [song] = await services.song.getSongByIds({ songIds: songId });
      const dl = song && pickDownload(song, DEFAULT_QUALITY);
      if (!dl) throw new Error("no file");
      await tg.call("editMessageMedia", {
        inline_message_id,
        media: {
          type: "audio", media: dl.url, title: plain(song.name), performer: primaryArtists(song),
          duration: song.duration ?? undefined, parse_mode: "HTML", caption: songCaption(song, dl.quality, u),
        },
        reply_markup: kb([link("🤖 Open bot", `https://t.me/${u}`), ...(song.url ? [link("🔗 JioSaavn", song.url)] : [])]),
      });
      return answer("✅ Audio attached!");
    } catch {
      await tg.call("editMessageReplyMarkup", { inline_message_id, reply_markup: openBot }).catch(() => {});
      return answer("Telegram can't attach audio here — tap “Get the file in bot”.", true);
    }
  }

  async function onInlineQuery(iq: Any) {
    const u = await me();
    const query: string = (iq.query ?? "").trim();
    const button = { text: "🎧 Open Saavnx Bot", start_parameter: "inline" };
    const logo = `${baseUrl}/images/logo.png`;

    if (!query) {
      return tg.call("answerInlineQuery", {
        inline_query_id: iq.id, cache_time: 60, is_personal: false, button,
        results: [{
          type: "article", id: "hint", title: "Type a song name to search",
          description: `e.g. @${u} Kesariya`,
          thumbnail_url: logo, thumbnail_width: 256, thumbnail_height: 256,
          input_message_content: {
            message_text: `🎧 <b>Saavnx Bot</b>\nSearch &amp; download songs from any chat: <code>@${esc(u)} song name</code>`,
            parse_mode: "HTML",
          },
          reply_markup: kb([link("🤖 Open bot", `https://t.me/${u}`)]),
        }],
      });
    }

    const page = Number(iq.offset) || 0;
    const res = await services.search.searchSongs({ query, page, limit: 10 });
    const results = res.results.map((s) => {
      const img = pickImage(s.image, "500x500");
      const thumb = pickImage(s.image, "150x150");
      const album = s.album?.name ? clean(s.album.name) : "";
      const message_text =
        `${BRAND} · <b>${sc("now spinning")}</b>\n\n` +
        `<b>${clean(s.name)}</b>\n<i>${esc(truncate(primaryArtists(s), 120))}</i>\n\n` +
        `${wave(s.id)}\n${progress(fmtDuration(s.duration))}\n\n` +
        (album ? `${row("album", album)}\n` : "") +
        `${row("year", `${[esc(s.year ?? "–"), esc(niceLang(s.language))].filter(Boolean).join(" · ")}`)}\n\n` +
        `<i>spun by @${esc(u)}</i>`;
      return {
        type: "article",
        id: s.id,
        title: plain(s.name),
        description: `${truncate(primaryArtists(s), 50)} · ${fmtDuration(s.duration)}`,
        thumbnail_url: thumb,
        thumbnail_width: 150,
        thumbnail_height: 150,
        input_message_content: {
          message_text,
          parse_mode: "HTML",
          link_preview_options: img ? { url: img, show_above_text: true, prefer_large_media: true } : { is_disabled: true },
        },
        reply_markup: kb(
          [btn("⬇️ Download", `dli:${s.id}`)],
          [link("🤖 Get in bot", `https://t.me/${u}?start=song_${s.id}`), ...(s.url ? [link("🔗 JioSaavn", s.url)] : [])],
        ),
      };
    });

    const more = (page + 1) * 10 < res.total;
    return tg.call("answerInlineQuery", {
      inline_query_id: iq.id,
      results: results.length
        ? results
        : [{
            type: "article", id: "none", title: "Nothing found", description: "Try a different spelling",
            thumbnail_url: logo, thumbnail_width: 256, thumbnail_height: 256,
            input_message_content: { message_text: `😕 No results for “${esc(query)}”` },
          }],
      cache_time: 300,
      is_personal: false,
      next_offset: more ? String(page + 1) : "",
      button,
    });
  }

  async function handleUpdate(update: Any): Promise<void> {
    const chatId: number | undefined = update.message?.chat?.id ?? update.callback_query?.message?.chat?.id;
    try {
      if (update.message) await onMessage(update.message);
      else if (update.callback_query) await onCallback(update.callback_query);
      else if (update.inline_query) await onInlineQuery(update.inline_query);
    } catch (e) {
      console.error("[bot] update failed:", e);
      if (chatId && update.message) {
        await tg
          .call("sendMessage", {
            chat_id: chatId,
            text: "⚠️ <b>Oops!</b> Something went wrong while fetching that. Please try again in a moment.",
            parse_mode: "HTML",
          })
          .catch(() => {});
      }
    }
  }

  return { handleUpdate, me };
}

export type Bot = ReturnType<typeof createBot>;
