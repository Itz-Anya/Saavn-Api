import { build } from "esbuild";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(root, "..");

const KNOWN_EXTS = new Set([".ts", ".tsx", ".mjs", ".js", ".json"]);
const candidatesFor = (importPath, resolveDir) => {
  if (KNOWN_EXTS.has(path.extname(importPath))) return [];
  const base = path.resolve(resolveDir, importPath);
  return [
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.mjs`,
    `${base}.js`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
    path.join(base, "index.mjs"),
    path.join(base, "index.js"),
  ];
};

const extensionlessRelativeImports = {
  name: "extensionless-relative-imports",
  setup(build) {
    build.onResolve({ filter: /^\.\.?\// }, (args) => {
      for (const candidate of candidatesFor(args.path, args.resolveDir)) {
        if (existsSync(candidate)) return { path: candidate };
      }
      return null;
    });
  },
};

mkdirSync(path.join(projectRoot, "api"), { recursive: true });

await build({
  entryPoints: [path.join(projectRoot, "server/vercel-entry.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outfile: path.join(projectRoot, "api/index.js"),
  absWorkingDir: projectRoot,
  plugins: [extensionlessRelativeImports],
  banner: {
    js: "import{createRequire}from'module';const require=createRequire(import.meta.url);",
  },
  logLevel: "info",
});