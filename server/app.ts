import express from "express";
import cors from "cors";
import { z } from "zod";
import { services } from "./services";
import { CACHE, errorHandler, fail, matchJioLink, matchPlaylistLink, num, numberParam, wrap } from "./shared";

type SortBy = "popularity" | "latest" | "alphabetical";
type SortOrder = "asc" | "desc";

export function createApp() {
  const app = express();
  app.use(cors({ origin: "*", methods: ["GET", "OPTIONS"] }));

  // ---- search ----
  const searchQuery = z.object({ query: z.string().min(1, "query is required") });
  const paged = z.object({
    query: z.string().min(1, "query is required"),
    page: numberParam,
    limit: numberParam,
  });

  app.get("/api/search", wrap(async (req) => {
    const { query } = searchQuery.parse({ query: req.query.query });
    return services.search.searchAll(query);
  }, CACHE.search));

  const mkSearch = (fn: (p: { query: string; page: number; limit: number }) => Promise<unknown>) =>
    wrap(async (req) => {
      const { query, page, limit } = paged.parse({
        query: req.query.query,
        page: req.query.page,
        limit: req.query.limit,
      });
      return fn({ query, page: page ?? 0, limit: limit ?? 10 });
    }, CACHE.search);

  app.get("/api/search/songs", mkSearch((p) => services.search.searchSongs(p)));
  app.get("/api/search/albums", mkSearch((p) => services.search.searchAlbums(p)));
  app.get("/api/search/artists", mkSearch((p) => services.search.searchArtists(p)));
  app.get("/api/search/playlists", mkSearch((p) => services.search.searchPlaylists(p)));

  // ---- songs ----
  app.get("/api/songs", wrap(async (req, res) => {
    const ids = typeof req.query.ids === "string" ? req.query.ids : undefined;
    const link = typeof req.query.link === "string" ? req.query.link : undefined;
    const token = matchJioLink(link, "song");
    if (!ids && !token) { fail(res, "Either song IDs or link is required", 400); return; }
    return token ? services.song.getSongByLink(token) : services.song.getSongByIds({ songIds: ids! });
  }, CACHE.entity));

  app.get("/api/songs/:id", wrap(async (req) =>
    services.song.getSongByIds({ songIds: req.params.id }), CACHE.entity));

  app.get("/api/songs/:id/suggestions", wrap(async (req) =>
    services.song.getSongSuggestions({ songId: req.params.id, limit: num(req.query.limit, 10) }), CACHE.suggestions));

  // ---- albums ----
  app.get("/api/albums", wrap(async (req, res) => {
    const id = typeof req.query.id === "string" ? req.query.id : undefined;
    const link = typeof req.query.link === "string" ? req.query.link : undefined;
    const token = matchJioLink(link, "album");
    if (!id && !token) { fail(res, "Either album ID or link is required", 400); return; }
    return token ? services.album.getAlbumByLink(token) : services.album.getAlbumById(id!);
  }, CACHE.entity));

  // ---- artists ----
  app.get("/api/artists", wrap(async (req, res) => {
    const id = typeof req.query.id === "string" ? req.query.id : undefined;
    const link = typeof req.query.link === "string" ? req.query.link : undefined;
    const token = matchJioLink(link, "artist");
    if (!id && !token) { fail(res, "Either artist ID or link is required", 400); return; }
    const page = num(req.query.page, 0);
    const songCount = num(req.query.songCount, 10);
    const albumCount = num(req.query.albumCount, 10);
    const sortBy = (req.query.sortBy as SortBy) || "popularity";
    const sortOrder = (req.query.sortOrder as SortOrder) || "asc";
    return token
      ? services.artist.getArtistByLink({ token, page, songCount, albumCount, sortBy, sortOrder })
      : services.artist.getArtistById({ artistId: id!, page, songCount, albumCount, sortBy, sortOrder });
  }, CACHE.entity));

  app.get("/api/artists/:id", wrap(async (req) => {
    const page = num(req.query.page, 0);
    const songCount = num(req.query.songCount, 10);
    const albumCount = num(req.query.albumCount, 10);
    const sortBy = (req.query.sortBy as SortBy) || "popularity";
    const sortOrder = (req.query.sortOrder as SortOrder) || "asc";
    return services.artist.getArtistById({ artistId: req.params.id, page, songCount, albumCount, sortBy, sortOrder });
  }, CACHE.entity));

  app.get("/api/artists/:id/songs", wrap(async (req) => {
    const page = num(req.query.page, 0);
    const sortBy = (req.query.sortBy as SortBy) || "popularity";
    const sortOrder = (req.query.sortOrder as SortOrder) || "asc";
    return services.artist.getArtistSongs({ artistId: req.params.id, page, sortBy, sortOrder });
  }, CACHE.listing));

  app.get("/api/artists/:id/albums", wrap(async (req) => {
    const page = num(req.query.page, 0);
    const sortBy = (req.query.sortBy as SortBy) || "popularity";
    const sortOrder = (req.query.sortOrder as SortOrder) || "asc";
    return services.artist.getArtistAlbums({ artistId: req.params.id, page, sortBy, sortOrder });
  }, CACHE.listing));

  // ---- playlists ----
  app.get("/api/playlists", wrap(async (req, res) => {
    const id = typeof req.query.id === "string" ? req.query.id : undefined;
    const link = typeof req.query.link === "string" ? req.query.link : undefined;
    const token = matchPlaylistLink(link);
    if (!id && !token) { fail(res, "Either playlist ID or link is required", 400); return; }
    const page = num(req.query.page, 0);
    const limit = num(req.query.limit, 10);
    return token
      ? services.playlist.getPlaylistByLink({ token, page, limit })
      : services.playlist.getPlaylistById({ id: id!, page, limit });
  }, CACHE.entity));

  app.use("/api", (_req, res) => fail(res, "Not found", 404));
  app.use(errorHandler);

  return app;
}
