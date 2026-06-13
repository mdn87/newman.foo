import { NODES, SITE } from './content/nodes';
import { renderListPage } from './fallback/render';
import { chooseSurface, detectWebgl, type Surface } from './router';

const content = document.getElementById('content')!;

const params = new URLSearchParams(location.search);
const forced = (['world', 'list'] as const).find((m) => params.get('mode') === m) ?? null;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const surface: Surface = chooseSurface({ forced, reducedMotion, webgl: detectWebgl() });

// Dev parity: prerender fills #content in prod; fill it live in dev.
if (!content.querySelector('section')) {
  content.innerHTML = renderListPage(NODES, SITE);
}

document.body.dataset.mode = surface;

if (surface === 'world') {
  content.setAttribute('hidden', '');
  import('./world/mount')
    .then(({ mountWorld }) =>
      mountWorld({ nodes: NODES, site: SITE, reducedMotion }),
    )
    .catch((err) => {
      console.error('world failed to boot - switching to ground control', err);
      content.removeAttribute('hidden');
      document.body.dataset.mode = 'list';
    });
}
