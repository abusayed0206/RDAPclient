# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

RDAPclient: a Next.js 16 (App Router, React 19, Tailwind 4) app that looks up domain, IP, and ASN registration data via RDAP and exposes it both as a web UI and as a JSON API. Live at https://rdap.sayed.app.

## Commands

pnpm (version pinned via `packageManager`), Node 24 (`.nvmrc` — the local nvm shim refuses to run node if the version there isn't installed).

```
pnpm dev               # next dev
pnpm build             # next build; postbuild runs next-sitemap
pnpm lint:strict       # eslint src, zero warnings (what CI runs)
pnpm typecheck         # tsc --noEmit
pnpm format:check      # prettier (CI runs this too)
pnpm test              # jest (jsdom by default)
pnpm test -- src/lib/__tests__/rdap.test.ts   # single file
pnpm test -- -t "rangeToCidr"                 # by test name
```

CI (`.github/workflows/lint.yml`) runs lint:strict → typecheck → format:check → test. Husky pre-commit runs lint-staged; commit-msg enforces Conventional Commits (allowed types in `commitlint.config.js`). Releases via release-please. Lib tests that don't touch the DOM use a `/** @jest-environment node */` docblock. pnpm build scripts are gated by `allowBuilds` in `pnpm-workspace.yaml`.

## Architecture

**Request flow:** `src/app/page.tsx` is a static server component that mounts the client `src/components/lookup.tsx`. The URL `?q=` param is the source of truth: `lookup.tsx` classifies the input with `src/lib/query.ts` (domain / IP / ASN, intentionally dependency-free to keep `tldts`/`ip-address` out of the client bundle), then fetches the app's own API. Result rendering lives in `src/components/results/*`; shared primitives in `src/components/ui.tsx`.

**API routes** (`src/app/api/{lookup,ip,asn}/[param]/route.ts`) are thin: they `await params` (Next 16), call `lookupDomain` / `lookupIP` / `lookupASN`, and wrap the result with `lookupResponse` / `errorResponse` from `src/lib/api.ts`. CORS and security headers are set in `next.config.ts`, not in routes.

**Lookup libs** (`src/lib/rdap.ts`, `ip-rdap.ts`, `asn-rdap.ts`) all follow RFC 9224 bootstrap: `fetchBootstrapData()` in `rdap-bootstrap.ts` (in-memory 24h cache, de-duplicated in-flight requests, serves stale on IANA failure) → pick the authoritative server (longest suffix for domains, most-specific prefix for IPs) → `fetchRdapJson()` in `rdap-common.ts` (10s timeout) → normalize. `rdap-common.ts` also holds vCard/entity helpers; entities are flattened recursively because registries nest contacts (e.g. registrar → abuse).

**Errors:** throw `RdapError(message, status, stage?)`; `errorResponse` returns `{ error, stage }` with its `.status` (anything else becomes 500). `stage` (`input` | `bootstrap` | `registry`, defaulting from status) tells the UI's route strip which station failed — pass `'bootstrap'` for "no RDAP server for this TLD/range". Upstream 5xx maps to 502, timeouts to 504. Successful responses also carry `fetchedAt` and `queryMs` (server-measured); the client uses them plus cache headers to label answers live vs cached — never show a client round-trip as a registry time.

**API contract:** the normalized domain shape (`NormalizedRdapData`) is the public API documented in README.md. Dates are `toUTCString()` strings and missing domain fields are the literal `'N/A'` — keep that stable; the UI's `Fields` component hides `'N/A'`/empty values. Additive fields (e.g. `rdapUrl`) are fine.

**Design system:** `DESIGN.md` describes the visual system ("plain-English answer"): one large answer sentence per result, Bricolage Grotesque display + Geist text + Geist Mono for data only, cool light / deep-violet dark themes. The accent follows the lookup kind via `data-kind` (`domain` violet, `ip` teal, `asn` amber) — components use `accent*` tokens, not specific hues. Tokens are CSS variables in `src/styles/globals.css` exposed via `@theme inline` (`bg-paper`, `bg-surface`, `text-ink`, `text-ink-2`, `border-line`, `bg-accent`, …). Dark mode is class-based (`@custom-variant dark`), applied pre-paint by an inline script in `layout.tsx` reading `localStorage['theme-mode']`. `PRODUCT.md` holds product truth. DESIGN.md and `.impeccable/` are excluded from Prettier.

**Pages:** `/` (lookup, `src/components/lookup.tsx`) and `/api` (docs, `src/app/api/page.tsx` — a page living alongside the `/api/*` route handlers; its interactive parts are in `src/components/docs/`). Shared header/footer: `src/components/site-chrome.tsx`.

**Path aliases:** `@/*` → `src/*`, `~/*` → `public/*` (mirrored in `jest.config.js`).
