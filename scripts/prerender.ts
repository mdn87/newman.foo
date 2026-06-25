import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from '../src/content/nodes';
import { renderFallbackPage } from '../src/fallback/render';

export function prerender(template: string, site: typeof SITE): Record<string, string> {
  return {
    '/': template
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(site.title)}</title>`)
      .replace(
        /<link rel="canonical" href="[^"]*" \/>/,
        `<link rel="canonical" href="${esc(`${site.origin}/`)}" />`,
      )
      .replace('<!--SSG-->', renderFallbackPage(site)),
  };
}

export function routeOutFile(dist: string, route: string): string {
  if (route !== '/') throw new Error(`only root route can be prerendered: ${route}`);
  return resolve(dist, 'index.html');
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
  const pages = prerender(template, SITE);
  for (const [route, html] of Object.entries(pages)) {
    const out = routeOutFile(dist, route);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html);
    console.log(`prerendered ${route} -> ${out}`);
  }
}
