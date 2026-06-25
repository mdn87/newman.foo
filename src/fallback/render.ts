export interface FallbackSite {
  title: string;
  origin: string;
  status: string;
  fallback: string;
}

export function renderFallbackPage(site: FallbackSite): string {
  return `<main class="fallback">
  <h1>${esc(site.title)}</h1>
  <p class="fallback-status">${esc(site.status)}</p>
  <p>${esc(site.fallback)}</p>
  <p><a href="/?mode=world">Enter world mode</a></p>
</main>`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
