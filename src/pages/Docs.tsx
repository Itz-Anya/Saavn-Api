import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LOGO_URL } from "@/lib/logo";

type Param = { name: string; required?: boolean; type?: string; desc?: string };
type EP = { method: string; path: string; desc: string; params?: Param[]; example?: string };
type Section = { id: string; title: string; blurb: string; endpoints: EP[] };

const SECTIONS: Section[] = [
  {
    id: "search", title: "Search",
    blurb: "Query JioSaavn's catalogue. Results mirror JioSaavn's own ranking; add artist or album for specificity.",
    endpoints: [
      { method: "GET", path: "/api/search", desc: "Global top results across every entity type.", params: [{ name: "query", required: true, type: "string", desc: "Search term" }], example: "/api/search?query=arijit" },
      { method: "GET", path: "/api/search/songs", desc: "Paginated song search.", params: [
        { name: "query", required: true, type: "string" }, { name: "page", type: "number" }, { name: "limit", type: "number" },
      ], example: "/api/search/songs?query=kesariya&limit=20" },
      { method: "GET", path: "/api/search/albums", desc: "Paginated album search.", params: [
        { name: "query", required: true, type: "string" }, { name: "page", type: "number" }, { name: "limit", type: "number" },
      ], example: "/api/search/albums?query=brahmastra" },
      { method: "GET", path: "/api/search/artists", desc: "Paginated artist search.", params: [
        { name: "query", required: true, type: "string" }, { name: "page", type: "number" }, { name: "limit", type: "number" },
      ], example: "/api/search/artists?query=arijit" },
      { method: "GET", path: "/api/search/playlists", desc: "Paginated playlist search.", params: [
        { name: "query", required: true, type: "string" }, { name: "page", type: "number" }, { name: "limit", type: "number" },
      ], example: "/api/search/playlists?query=workout" },
    ],
  },
  {
    id: "songs", title: "Songs",
    blurb: "Fetch songs with decrypted download URLs and rich metadata.",
    endpoints: [
      { method: "GET", path: "/api/songs", desc: "Fetch songs by IDs or link.", params: [
        { name: "ids", type: "string", desc: "Comma-separated song IDs" }, { name: "link", type: "url", desc: "JioSaavn song URL" },
      ], example: "/api/songs?ids=5WXAlMNt,9BjJPi9M" },
      { method: "GET", path: "/api/songs/{id}", desc: "Song by ID.", params: [{ name: "id", required: true, type: "string" }], example: "/api/songs/5WXAlMNt" },
      { method: "GET", path: "/api/songs/{id}/suggestions", desc: "Suggested songs for a given ID.", params: [{ name: "id", required: true, type: "string" }, { name: "limit", type: "number" }], example: "/api/songs/5WXAlMNt/suggestions?limit=10" },
    ],
  },
  { id: "albums", title: "Albums", blurb: "Full album metadata with track lists.", endpoints: [
    { method: "GET", path: "/api/albums", desc: "Album by ID or JioSaavn album link.", params: [{ name: "id", type: "string" }, { name: "link", type: "url" }], example: "/api/albums?id=23241654" },
  ] },
  { id: "artists", title: "Artists", blurb: "Artist profiles, discography and top songs.", endpoints: [
    { method: "GET", path: "/api/artists", desc: "Artist by ID or link.", params: [
      { name: "id", type: "string" }, { name: "link", type: "url" },
      { name: "page", type: "number" }, { name: "songCount", type: "number" }, { name: "albumCount", type: "number" },
      { name: "sortBy", type: "enum", desc: "popularity | latest | alphabetical" },
      { name: "sortOrder", type: "enum", desc: "asc | desc" },
    ], example: "/api/artists?id=459320" },
    { method: "GET", path: "/api/artists/{id}", desc: "Artist by ID.", params: [{ name: "id", required: true, type: "string" }] },
    { method: "GET", path: "/api/artists/{id}/songs", desc: "Songs by an artist.", params: [
      { name: "id", required: true, type: "string" }, { name: "page", type: "number" },
      { name: "sortBy", type: "enum" }, { name: "sortOrder", type: "enum" },
    ] },
    { method: "GET", path: "/api/artists/{id}/albums", desc: "Albums by an artist.", params: [
      { name: "id", required: true, type: "string" }, { name: "page", type: "number" },
      { name: "sortBy", type: "enum" }, { name: "sortOrder", type: "enum" },
    ] },
  ] },
  { id: "playlists", title: "Playlists", blurb: "JioSaavn-curated and user playlists with full track lists.", endpoints: [
    { method: "GET", path: "/api/playlists", desc: "Playlist by ID or JioSaavn link.", params: [
      { name: "id", type: "string" }, { name: "link", type: "url" },
      { name: "page", type: "number" }, { name: "limit", type: "number" },
    ], example: "/api/playlists?id=82914609" },
  ] },
];

export default function Docs() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <img src={LOGO_URL} alt="" width={40} height={40} className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
            <div className="min-w-0">
              <div className="font-display text-base font-semibold leading-none sm:text-lg">saavn/api</div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground sm:text-[10px]">documentation</div>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/" className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground transition hover:text-foreground sm:text-xs">← Explorer</Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Contents</div>
            <nav className="mt-4 space-y-1">
              {SECTIONS.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-accent/60 hover:text-foreground">
                  {s.title}
                </a>
              ))}
              <a href="#envelope" className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-accent/60 hover:text-foreground">Response envelope</a>
              <a href="#errors" className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-accent/60 hover:text-foreground">Errors</a>
            </nav>
          </aside>

          <main className="min-w-0">
            <div className="mb-16">
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">Reference · v1.0</div>
              <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">API documentation</h1>
              <p className="mt-4 max-w-2xl text-muted-foreground">
                Every endpoint is a plain <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">GET</code> with query
                parameters. No auth, no keys, CORS-open. Base URL is your deployment origin.
              </p>
            </div>

            <section id="envelope" className="mb-16">
              <h2 className="font-display text-2xl font-semibold tracking-tight">Response envelope</h2>
              <p className="mt-2 text-sm text-muted-foreground">Every response follows one of two shapes.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Every response also carries a <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">credits</code> object
                attributing JioSaavn (the source of all music and data), the reference project and the creators. Please keep it intact if you redistribute responses.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Code title="Success">{`{\n  "success": true,\n  "data": { … },\n  "credits": { … }\n}`}</Code>
                <Code title="Failure">{`{\n  "success": false,\n  "message": "…",\n  "credits": { … }\n}`}</Code>
              </div>
            </section>

            {SECTIONS.map((s) => (
              <section id={s.id} key={s.id} className="mb-16 scroll-mt-24">
                <div className="mb-6 border-l-2 border-primary pl-4">
                  <h2 className="font-display text-2xl font-semibold tracking-tight">{s.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{s.blurb}</p>
                </div>
                <div className="space-y-4">
                  {s.endpoints.map((e) => <EndpointCard key={e.path + e.method} ep={e} />)}
                </div>
              </section>
            ))}

            <section id="errors" className="mb-16 scroll-mt-24">
              <div className="mb-6 border-l-2 border-primary pl-4">
                <h2 className="font-display text-2xl font-semibold tracking-tight">Errors</h2>
                <p className="mt-1 text-sm text-muted-foreground">Standard HTTP status codes.</p>
              </div>
              <div className="overflow-hidden rounded-xl border border-border">
                {[
                  ["400", "Bad request — missing or invalid parameter"],
                  ["404", "Resource not found on JioSaavn"],
                  ["500", "Upstream or server error"],
                ].map(([code, msg]) => (
                  <div key={code} className="flex items-center gap-6 border-b border-border/60 bg-card/40 px-5 py-3 last:border-0">
                    <span className="rounded bg-destructive/15 px-2 py-0.5 font-mono text-xs font-semibold text-destructive">{code}</span>
                    <span className="text-sm text-muted-foreground">{msg}</span>
                  </div>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center font-mono text-[11px] text-muted-foreground">
          <div>© {new Date().getFullYear()} Anya &amp; Murali · saavn/api</div>
          <div className="mt-2">
            All music &amp; data belong to <a href="https://www.jiosaavn.com" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4 hover:text-foreground">JioSaavn</a> ·
            
          </div>
        </div>
      </footer>
    </div>
  );
}

function EndpointCard({ ep }: { ep: EP }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/40">
      <div className="flex flex-wrap items-center gap-3 border-b border-border/60 bg-background/40 px-5 py-3">
        <span className="rounded bg-primary/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">{ep.method}</span>
        <code className="font-mono text-sm">{ep.path}</code>
      </div>
      <div className="p-5">
        <p className="text-sm text-muted-foreground">{ep.desc}</p>
        {ep.params && ep.params.length > 0 && (
          <div className="mt-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Parameters</div>
            <div className="mt-2 divide-y divide-border/60 rounded-lg border border-border/60">
              {ep.params.map((p) => (
                <div key={p.name} className="grid grid-cols-[max-content_max-content_1fr] items-baseline gap-3 px-3 py-2">
                  <code className="font-mono text-sm text-foreground">{p.name}</code>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {p.type || "string"}{p.required ? " · req" : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">{p.desc || ""}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {ep.example && (
          <div className="mt-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Example</div>
            <pre className="mt-2 overflow-auto rounded-lg border border-border/60 bg-background/60 p-3 font-mono text-xs"><code>{ep.example}</code></pre>
          </div>
        )}
      </div>
    </div>
  );
}

function Code({ title, children }: { title: string; children: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/40">
      <div className="border-b border-border/60 bg-background/40 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{title}</div>
      <pre className="overflow-auto p-4 font-mono text-xs leading-relaxed"><code>{children}</code></pre>
    </div>
  );
}
