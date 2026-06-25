# newman.foo

A tiny free-floating spiral galaxy prototype with a deterministic core, a
three.js world, a DOM HUD, and a prerendered fallback.

- `npm run dev` — Vite dev server
- `npm run build` — production build plus static prerender
- `npm run preview` — preview the built site on port 4173
- `npm test` — run the Vitest suite
- `npm run typecheck` — run TypeScript without emitting files
- `npm run e2e` — Playwright smoke and axe scan (needs `npm run build` first)
- `npm run budgets` — check gzip budgets for fallback, world, JS/CSS, and homepage media
