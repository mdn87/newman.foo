import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NodeDef } from '../src/core/types';
import { NODES, SITE } from '../src/content/nodes';
import { validateContent } from '../src/content/schema';
import { renderListPage } from '../src/fallback/render';

/** Pure: template + content -> { route: html }. Throws on invalid content. */
export function prerender(
  template: string,
  nodes: NodeDef[],
  site: typeof SITE,
): Record<string, string> {
  const errs = validateContent(nodes);
  if (errs.length) throw new Error(`content invalid:\n${errs.join('\n')}`);
  const listHtml = renderListPage(nodes, site);
  const pages: Record<string, string> = {};
  for (const n of nodes) {
    const title = n.kind === 'intro' ? site.title : `${n.title} — Not An Astronaut`;
    pages[n.route] = template
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
      .replace(
        /<link rel="canonical" href="[^"]*" \/>/,
        `<link rel="canonical" href="${esc(`${site.origin}${n.route === '/' ? '/' : n.route}`)}" />`,
      )
      .replace('<!--SSG-->', listHtml);
  }
  return pages;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const dist = join(process.cwd(), 'dist');
  const template = readFileSync(join(dist, 'index.html'), 'utf8');
  const pages = prerender(template, NODES, SITE);
  for (const [route, html] of Object.entries(pages)) {
    const out = route === '/' ? join(dist, 'index.html') : join(dist, route.slice(1), 'index.html');
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html);
    console.log(`prerendered ${route} -> ${out}`);
  }
}
