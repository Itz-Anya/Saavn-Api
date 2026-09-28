import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LOGO_URL, HERO_WAVE_URL, STACK_URL } from "@/lib/logo";

const heroWave = HERO_WAVE_URL;
const sectionStack = STACK_URL;

type EndpointKey =
  | "search" | "search/songs" | "search/albums" | "search/artists" | "search/playlists"
  | "songs" | "songs/:id" | "songs/:id/suggestions"
  | "albums" | "artists" | "artists/:id" | "artists/:id/songs" | "artists/:id/albums"
  | "playlists";

interface Endpoint {
  key: EndpointKey;
  group: "Search" | "Songs" | "Albums" | "Artists" | "Playlists";
  label: string;
  path: string;
  params: { name: string; placeholder: string; required?: boolean; kind: "query" | "path" }[];
  description: string;
}

const ENDPOINTS: Endpoint[] = [
  { key: "search", group: "Search", label: "Global search", path: "/api/search", description: "Top hits across songs, albums, artists and playlists.", params: [{ name: "query", placeholder: "arijit singh", required: true, kind: "query" }] },
  { key: "search/songs", group: "Search", label: "Search songs", path: "/api/search/songs", description: "Paginated song search.", params: [
    { name: "query", placeholder: "kesariya", required: true, kind: "query" },
    { name: "page", placeholder: "0", kind: "query" },
    { name: "limit", placeholder: "10", kind: "query" },
  ] },
  { key: "search/albums", group: "Search", label: "Search albums", path: "/api/search/albums", description: "Paginated album search.", params: [
    { name: "query", placeholder: "brahmastra", required: true, kind: "query" },
    { name: "page", placeholder: "0", kind: "query" },
    { name: "limit", placeholder: "10", kind: "query" },
  ] },
  { key: "search/artists", group: "Search", label: "Search artists", path: "/api/search/artists", description: "Paginated artist search.", params: [
    { name: "query", placeholder: "arijit", required: true, kind: "query" },
    { name: "page", placeholder: "0", kind: "query" },
    { name: "limit", placeholder: "10", kind: "query" },
  ] },
  { key: "search/playlists", group: "Search", label: "Search playlists", path: "/api/search/playlists", description: "Paginated playlist search.", params: [
    { name: "query", placeholder: "workout", required: true, kind: "query" },
    { name: "page", placeholder: "0", kind: "query" },
    { name: "limit", placeholder: "10", kind: "query" },
  ] },
  { key: "songs", group: "Songs", label: "Get songs", path: "/api/songs", description: "Fetch songs by comma-separated IDs or JioSaavn song link.", params: [
    { name: "ids", placeholder: "5WXAlMNt,9BjJPi9M", kind: "query" },
    { name: "link", placeholder: "https://www.jiosaavn.com/song/…/…", kind: "query" },
  ] },
  { key: "songs/:id", group: "Songs", label: "Song by ID", path: "/api/songs/{id}", description: "Fetch a single song by its ID.", params: [
    { name: "id", placeholder: "5WXAlMNt", required: true, kind: "path" },
  ] },
  { key: "songs/:id/suggestions", group: "Songs", label: "Song suggestions", path: "/api/songs/{id}/suggestions", description: "Songs suggested for a given ID.", params: [
    { name: "id", placeholder: "5WXAlMNt", required: true, kind: "path" },
    { name: "limit", placeholder: "10", kind: "query" },
  ] },
  { key: "albums", group: "Albums", label: "Get album", path: "/api/albums", description: "Fetch an album by ID or JioSaavn album link.", params: [
    { name: "id", placeholder: "23241654", kind: "query" },
    { name: "link", placeholder: "https://www.jiosaavn.com/album/…/…", kind: "query" },
  ] },
  { key: "artists", group: "Artists", label: "Get artist", path: "/api/artists", description: "Fetch an artist by ID or JioSaavn artist link.", params: [
    { name: "id", placeholder: "459320", kind: "query" },
    { name: "link", placeholder: "https://www.jiosaavn.com/artist/…/…", kind: "query" },
    { name: "page", placeholder: "0", kind: "query" },
    { name: "songCount", placeholder: "10", kind: "query" },
    { name: "albumCount", placeholder: "10", kind: "query" },
  ] },
  { key: "artists/:id", group: "Artists", label: "Artist by ID", path: "/api/artists/{id}", description: "Artist details by ID.", params: [
    { name: "id", placeholder: "459320", required: true, kind: "path" },
  ] },
  { key: "artists/:id/songs", group: "Artists", label: "Artist songs", path: "/api/artists/{id}/songs", description: "Songs by an artist.", params: [
    { name: "id", placeholder: "459320", required: true, kind: "path" },
    { name: "page", placeholder: "0", kind: "query" },
    { name: "sortBy", placeholder: "popularity | latest | alphabetical", kind: "query" },
    { name: "sortOrder", placeholder: "asc | desc", kind: "query" },
  ] },
  { key: "artists/:id/albums", group: "Artists", label: "Artist albums", path: "/api/artists/{id}/albums", description: "Albums by an artist.", params: [
    { name: "id", placeholder: "459320", required: true, kind: "path" },
    { name: "page", placeholder: "0", kind: "query" },
    { name: "sortBy", placeholder: "popularity | latest | alphabetical", kind: "query" },
    { name: "sortOrder", placeholder: "asc | desc", kind: "query" },
  ] },
  { key: "playlists", group: "Playlists", label: "Get playlist", path: "/api/playlists", description: "Fetch a playlist by ID or JioSaavn playlist link.", params: [
    { name: "id", placeholder: "82914609", kind: "query" },
    { name: "link", placeholder: "https://www.jiosaavn.com/featured/…/…", kind: "query" },
    { name: "page", placeholder: "0", kind: "query" },
    { name: "limit", placeholder: "10", kind: "query" },
  ] },
];

const GROUPS = ["Search", "Songs", "Albums", "Artists", "Playlists"] as const;

export default function Index() {
  const [active, setActive] = useState<EndpointKey>("search");
  const [values, setValues] = useState<Record<string, string>>({ query: "arijit singh" });
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string>("");
  const [status, setStatus] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const endpoint = ENDPOINTS.find((e) => e.key === active)!;

  const url = useMemo(() => {
    let path = endpoint.path;
    for (const p of endpoint.params.filter((x) => x.kind === "path")) {
      path = path.replace(`{${p.name}}`, encodeURIComponent(values[p.name] || `{${p.name}}`));
    }
    const qs = new URLSearchParams();
    for (const p of endpoint.params.filter((x) => x.kind === "query")) {
      const v = values[p.name];
      if (v) qs.set(p.name, v);
    }
    const q = qs.toString();
    return q ? `${path}?${q}` : path;
  }, [endpoint, values]);

  async function run() {
    setLoading(true);
    setResponse("");
    setStatus(null);
    setElapsed(null);
    const t0 = performance.now();
    try {
      const res = await fetch(url);
      setStatus(res.status);
      const json = await res.json();
      setResponse(JSON.stringify(json, null, 2));
    } catch (e) {
      setResponse(String(e));
    } finally {
      setElapsed(Math.round(performance.now() - t0));
      setLoading(false);
    }
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(window.location.origin + url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <img src={LOGO_URL} alt="saavn/api logo" width={40} height={40} className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
            <div className="min-w-0">
              <div className="font-display text-base font-semibold leading-none sm:text-lg">saavn/api</div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground sm:text-[10px]">v1.0 · node</div>
            </div>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4 font-mono text-xs uppercase tracking-widest">
            <a href="#explorer" className="hidden text-muted-foreground transition hover:text-foreground sm:inline">Explorer</a>
            <Link to="/docs" className="hidden text-muted-foreground transition hover:text-foreground sm:inline">Docs</Link>
            <span className="hidden items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-[10px] text-primary md:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> operational
            </span>
            <Link to="/docs" className="rounded-full border border-border bg-card/60 px-3 py-1.5 text-[10px] text-foreground sm:hidden">Docs</Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border/60 grain">
        <div className="absolute inset-0 -z-0">
          <img src={heroWave} alt="" className="h-full w-full object-cover opacity-40" width={1600} height={1200} />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground backdrop-blur sm:mb-8 sm:text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            unofficial jiosaavn rest api
          </div>
          <h1 className="font-display text-4xl font-semibold leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">
            The sound of <span className="italic text-primary">JioSaavn</span>,
            <br className="hidden sm:block" />{" "}
            <span className="text-muted-foreground">served as JSON.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:mt-8 sm:text-lg">
            Search, stream metadata, decrypted download links and rich catalogue data for songs, albums,
            artists and playlists. One API, edge-cached, zero keys.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 sm:mt-10">
            <a href="#explorer" className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
              Try the API <Arrow />
            </a>
            <Link to="/docs" className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-5 py-3 text-sm font-medium backdrop-blur transition hover:bg-accent">
              Read the docs
            </Link>
          </div>

          <div className="mt-12 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-6 border-t border-border/60 pt-8 sm:mt-16 sm:grid-cols-4 sm:gap-x-8">
            <Stat kpi="14" label="Endpoints" />
            <Stat kpi="BOM1" label="Edge region" />
            <Stat kpi="7d" label="Cache SWR" />
            <Stat kpi="∞" label="Rate limit" />
          </div>
        </div>
      </section>

      <section id="explorer" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mb-8 flex flex-col gap-2 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">§ 01 — explorer</div>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Play with every endpoint.</h2>
          </div>
          <div className="hidden font-mono text-xs text-muted-foreground sm:block">responses stream live from /api/*</div>
        </div>

        <div className="mb-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3 text-left"
          >
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{endpoint.group}</div>
              <div className="truncate font-medium">{endpoint.label}</div>
            </div>
            <svg viewBox="0 0 20 20" className={`h-4 w-4 shrink-0 transition ${sidebarOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 8l5 5 5-5" /></svg>
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className={`${sidebarOpen ? "block" : "hidden"} rounded-2xl border border-border bg-card/40 p-3 lg:block`}>
            {GROUPS.map((g) => (
              <div key={g} className="mb-3 last:mb-0">
                <div className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{g}</div>
                <ul className="space-y-0.5">
                  {ENDPOINTS.filter((e) => e.group === g).map((e) => {
                    const isActive = active === e.key;
                    return (
                      <li key={e.key}>
                        <button
                          onClick={() => {
                            setActive(e.key);
                            setValues({});
                            setResponse("");
                            setStatus(null);
                            setElapsed(null);
                            setSidebarOpen(false);
                          }}
                          className={`group relative w-full rounded-lg px-3 py-2.5 text-left transition ${isActive ? "bg-primary/10" : "hover:bg-accent/60"}`}
                        >
                          {isActive && <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-primary" />}
                          <div className={`text-sm font-medium ${isActive ? "text-primary" : ""}`}>{e.label}</div>
                          <div className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">{e.path}</div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </aside>

          <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card/40">
            <div className="border-b border-border/60 bg-background/30 px-4 py-4 sm:px-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-primary/15 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wider text-primary">GET</span>
                <code className="break-all font-mono text-xs sm:text-sm">{endpoint.path}</code>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{endpoint.description}</p>
              {active.startsWith("search") && (
                <div className="mt-4 flex gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-[12px] text-muted-foreground">
                  <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  <span>Results mirror JioSaavn's ranking — for a specific track, add the artist (e.g. <code className="font-mono text-primary">suzume radwimps</code>).</span>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6">
              <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Parameters</div>
              <div className="grid gap-4">
                {endpoint.params.map((p) => (
                  <label key={p.name} className="grid gap-2">
                    <span className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="font-semibold text-foreground">{p.name}</span>
                      {p.required && <span className="text-primary">required</span>}
                      <span className="ml-auto uppercase tracking-widest text-muted-foreground">{p.kind}</span>
                    </span>
                    <input
                      value={values[p.name] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [p.name]: e.target.value }))}
                      placeholder={p.placeholder}
                      className="rounded-lg border border-input bg-background/60 px-3.5 py-2.5 font-mono text-sm placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-background/50 p-3 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 break-all px-2 font-mono text-xs text-muted-foreground sm:truncate sm:break-normal">{url}</code>
                <div className="flex gap-2">
                  <button onClick={copyUrl} className="flex-1 rounded-lg border border-border bg-card/60 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition hover:text-foreground sm:flex-none">
                    {copied ? "copied" : "copy"}
                  </button>
                  <button onClick={run} disabled={loading} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary-foreground transition hover:brightness-110 disabled:opacity-60 sm:flex-none">
                    {loading ? "sending" : "send"}
                    {!loading && <Arrow />}
                  </button>
                </div>
              </div>

              {(response || loading) && (
                <div className="mt-6">
                  <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    <span>Response</span>
                    {status !== null && (
                      <span className={`rounded px-2 py-0.5 tracking-normal ${status < 400 ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>{status}</span>
                    )}
                    {elapsed !== null && <span>· {elapsed}ms</span>}
                  </div>
                  <pre className="max-h-[460px] overflow-auto rounded-xl border border-border bg-background/70 p-4 font-mono text-[11px] leading-relaxed sm:text-[12px]">
                    <code>{loading ? "…" : response}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-card/20">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mb-10 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">§ 02 — built for speed</div>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Small surface. Sharp defaults.</h2>
            </div>
            <img src={sectionStack} alt="" loading="lazy" width={1200} height={1200} className="hidden h-32 w-32 rounded-2xl object-cover md:block" />
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border/40 sm:grid-cols-2 md:grid-cols-3">
            <Feature n="01" title="Edge-cached" body="All GETs carry Cache-Control with stale-while-revalidate. Repeat hits served from Vercel's edge worldwide." />
            <Feature n="02" title="Decrypted URLs" body="Media URLs are decrypted server-side with DES so you get direct CDN links you can play immediately." />
            <Feature n="03" title="No API keys" body="Public endpoints. CORS-open. Drop the URL into your fetch and ship." />
            <Feature n="04" title="Mumbai origin" body="Requests to JioSaavn originate from bom1 so you get the full Indian catalogue, not a filtered view." />
            <Feature n="05" title="Typed responses" body="Consistent { success, data } envelope with predictable shapes across every endpoint." />
            <Feature n="06" title="Zero config" body="Deploy to Vercel with one click. Fork, push, done." />
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <img src={LOGO_URL} alt="" width={32} height={32} className="h-8 w-8" />
              <div>
                <div className="font-display text-sm font-semibold">saavn/api</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">unofficial jiosaavn rest api</div>
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">Creators</div>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <li><a href="https://github.com/itz-Anya" target="_blank" rel="noreferrer noopener" className="transition hover:text-foreground">Anya — @itz-Anya</a></li>
                <li><a href="https://github.com/Itz-Murali" target="_blank" rel="noreferrer noopener" className="transition hover:text-foreground">Murali — @Itz-Murali</a></li>
              </ul>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">Credits</div>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <li>All music &amp; data © <a href="https://www.jiosaavn.com" target="_blank" rel="noreferrer noopener" className="text-foreground underline-offset-4 hover:underline">JioSaavn</a> (Jio Platforms)</li>
                
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-border/60 pt-6 font-mono text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Anya &amp; Murali — not affiliated with or endorsed by JioSaavn.
          </div>
        </div>
      </footer>
    </div>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

function Stat({ kpi, label }: { kpi: string; label: string }) {
  return (
    <div>
      <div className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{kpi}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
    </div>
  );
}

function Feature({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="bg-card/60 p-6 transition hover:bg-card sm:p-8">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">{n}</div>
      <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
