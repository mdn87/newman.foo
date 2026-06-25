import { SITE } from './content/nodes';
import { renderFallbackPage } from './fallback/render';
import { chooseSurface, detectWebgl, isRootPath, type Surface } from './router';

const content = document.getElementById('content')!;

const params = new URLSearchParams(location.search);
const forced = (['world', 'list'] as const).find((m) => params.get('mode') === m) ?? null;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const surface: Surface = isRootPath(location.pathname)
  ? chooseSurface({ forced, reducedMotion, webgl: detectWebgl() })
  : 'list';

if (!content.querySelector('section, main')) {
  content.innerHTML = renderFallbackPage(SITE);
}

document.body.dataset.mode = surface;

if (surface === 'world') {
  content.setAttribute('hidden', '');
  import('./world/mount')
    .then(({ mountWorld }) =>
      mountWorld({ site: SITE, reducedMotion }),
    )
    .catch((err) => {
      console.error('world failed to boot - switching to fallback', err);
      content.removeAttribute('hidden');
      content.innerHTML = renderFallbackPage(SITE);
      document.body.dataset.mode = 'list';
    });
} else {
  content.removeAttribute('hidden');
  content.innerHTML = renderFallbackPage(SITE);
}
