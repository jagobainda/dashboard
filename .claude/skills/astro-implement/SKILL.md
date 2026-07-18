---
name: astro-implement
description: Implement a feature, page, component or change in THIS Astro project following its structure, conventions and best practices. Invoke as `/astro-implement <what to build>` (e.g. "/astro-implement a contact page with a form"). Use whenever adding or modifying anything in this codebase so the result stays consistent with the established stack and style.
argument-hint: what to implement (page, component, content collection, script, fix...)
---

# astro-implement

Implement whatever is described in the invocation **following this project's conventions**.
Do not introduce new patterns, libraries or styles when an existing one fits. When the request
is ambiguous about scope or behaviour, ask before building.

## Stack (do not deviate without being asked)

- **Astro** (latest stable) with TypeScript in `strict` mode (`astro/tsconfigs/strict`).
- **Tailwind CSS** via the `@tailwindcss/vite` plugin (no `tailwind.config.js`; theme lives in CSS).
- **astro-icon** for icons. Install the Iconify set you need (`npm i @iconify-json/<set>`) and use
  `<Icon name="set:icon" />`, or place local SVGs in `src/icons/`.
- **animejs** for animations (client-side only — see the anime.js section below).
- **Content Collections + Zod** for any structured/repeated content (`src/content.config.ts`).
- **@astrojs/node** adapter (standalone) for on-demand routes; **@astrojs/sitemap** for the sitemap.

## Rendering: choose static vs SSR per route

`astro.config.mjs` uses `output: "static"` (the `hybrid` output no longer exists), so **every
route is prerendered at build time by default**.
Decide per page:

- **Static (default):** content known at build time (landing, about, docs, blog posts). Do nothing —
  it is already static. Prefer this; it is faster and cheaper.
- **On-demand / SSR:** depends on the request (auth, form POST handling, per-request data, search).
  Add `export const prerender = false;` at the top of that page or endpoint. The node adapter serves it.

Never flip the whole project to `output: "server"` for one dynamic page — opt that single route out instead.

## Project structure (place files accordingly)

```
src/
├── components/
│   ├── cards/      # small repeated display units
│   ├── sections/   # larger page sections / modals
│   ├── ui/         # base primitives (Button, Modal, Tabs...)
│   └── pages/      # per-page composition components (PageName.astro)
├── content/        # JSON/MD content for collections
├── content.config.ts
├── layouts/        # BaseLayout and any specialised layouts
├── lib/            # framework-agnostic TS helpers (seo.ts, ...)
├── pages/          # routes (.astro / endpoints)
├── scripts/        # client-side TS, one module per domain (animations.ts, forms.ts,
│                   # nav.ts...). No main.ts catch-all: each component imports the
│                   # module it needs directly. If truly global bootstrapping is ever
│                   # needed (something that must run on every page, no exceptions),
│                   # it goes in a thin main.ts that only orchestrates — never feature logic.
└── styles/         # global.css (Tailwind import + theme tokens)
```

Conventions to mirror:
- Routes in `src/pages/` stay thin: import a `components/pages/*.astro` component and render it.
- Reuse `ui/` primitives instead of re-styling raw elements. Keep components small and focused.
- All pages render through `BaseLayout` so SEO/OG/JSON-LD stay centralised.

## Component anatomy (`.astro`)

- **Frontmatter (`---`)** is only for: imports, typed props, data fetching and small one-off
  transformations. No complex business logic there — anything reusable or testable (calculations,
  helpers, fetchers) lives in `src/lib/` as plain TS and is imported from the frontmatter.
- **`<script>`**: if the logic is intrinsic to the component (depends on its own DOM /
  data-attributes and is not reused elsewhere), keep it inline. Non-trivial client logic, or logic
  reused by more than one component, lives in a domain module under `src/scripts/` (e.g.
  `animations.ts`, `forms.ts`) — never centralised in a `main.ts` that imports everything. The
  component's `<script>` imports the specific module it needs directly:
  `import { fadeInOnScroll } from "../../scripts/animations";`
- **`<style>`** is scoped by default. Use `is:global` only when a style must reach the output of
  child components, and leave a comment explaining why the scoping is broken.
- **Passing frontmatter data to a client `<script>`**: use `data-*` attributes read with
  `getAttribute`, not `define:vars` — `define:vars` forces the script into inline mode, so it can
  no longer use imports/modules.

## Styling (Tailwind)

- `src/styles/global.css` is limited to `@import "tailwindcss";` + the `@theme` design tokens
  (colours, spacing, fonts) + the theme variables (`--bg-primary`, `--text-color`, ... — light
  default + `body.dark` overrides). No loose utility rules or accumulated `@apply` in there.
- Use standard Tailwind utilities whenever one exists; reach for arbitrary values (`[...]`) only
  for genuinely one-off cases.
- Reference theme CSS variables with Tailwind's parenthesis shorthand: `bg-(--bg-primary)`, not
  `bg-[var(--bg-primary)]`.
- When a utility is ambiguous about what the variable means (e.g. `text-` is colour *or* size),
  add the type hint: `text-(color:--my-var)` / `text-(length:--my-var)`.
- Class ordering is handled by `prettier-plugin-tailwindcss` — run the formatter.
- Add new tokens to `global.css` rather than hard-coding hex values in components.

## TypeScript

- `strict` mode is on (`astro/tsconfigs/strict`); no implicit `any`.
- Every `.astro` component that takes props defines an explicit `interface Props` in its frontmatter.
- Types shared across several components (not just one component's props) go in a dedicated types
  file in `src/lib/`, never duplicated per component.
- Prefer discriminated unions for component variants over several loose booleans:
  `{ kind: "link"; href: string } | { kind: "button"; onClickId: string }` instead of `isLink`/`isButton`.

## Animations (anime.js)

- anime.js is a DOM library: it runs **only** in client-side code — never import or call it in the
  frontmatter, which runs at build/server time with no DOM available.
- Reusable animations (fade-ins, stagger, scroll-triggered...) live in `src/scripts/animations.ts`,
  exported as functions (`fadeInOnScroll`, `staggerCards`...). Components import and call them from
  their own `<script>` — they are not registered in any central file.
- An animation that exists only for one specific component and is not reused can stay inline in
  that component's `<script>`, without going through `animations.ts`.
- Use the current ESM API: `import { animate, stagger } from "animejs";`. The legacy default-export
  `anime({...})` call is obsolete — never generate that style.
- Gate non-essential animations behind reduced-motion:
  ```ts
  const motionOK = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
  ```
- animejs ships its own TS types: do **not** install `@types/animejs` (it targets the legacy API)
  or hand-type what the library already types.

## Content

When content is data-like or repeated, model it as a Content Collection: add JSON under `src/content/<name>/`,
define the collection with a Zod schema and a loader in `src/content.config.ts`, and read it with
`getCollection` / `getEntry`. Do not hard-code lists that belong in content.

**Page-level copy (title, description, heading, noindex, …) belongs in a `pages`
collection, not in the route's frontmatter.** One JSON per route at
`src/content/pages/<route>.json`, schema-validated by Zod; the page reads it with
`getEntry("pages", "<route>")` and passes the fields straight to `BaseLayout`.
This is the i18n swap point: when locales land, only the loader / schema need
to change — pages stay untouched. Data that is intrinsically structural (e.g.
a network diagram's layer / connection topology) can stay in the component that
uses it; only user-facing copy follows the rule above.

## SEO

Centralise structured data and site constants in `src/lib/seo.ts`. Page-level
SEO fields (`title`, `description`, `noindex`, …) come from the route's
`pages` collection entry — see the Content section. `ogImage` / `ogType` /
`jsonLd` are still passed per-page into `BaseLayout`. Keep canonical URLs and
Open Graph consistent.

## Code style (Prettier — already configured)

4-space indent, double quotes, semicolons, `printWidth` 120, `trailingComma: all`, `arrowParens: avoid`,
`endOfLine: lf`. Comments are concise and explain the *why*, not the *what* — match the surrounding code.

## Definition of done

1. Code follows the structure and conventions above.
2. `npm run format` — apply Prettier (CI runs `format:check`).
3. `npm run build` — must pass (CI builds and runs `npm audit --audit-level=high`).
4. Update `TODO.md` if you resolved or introduced a follow-up.
