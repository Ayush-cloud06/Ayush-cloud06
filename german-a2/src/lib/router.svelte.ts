// Minimal hash router: #/path/segments?query
export interface Route {
  path: string[];
  query: URLSearchParams;
}

function parse(): Route {
  const raw = (typeof location !== 'undefined' ? location.hash : '').replace(/^#\/?/, '');
  const [p, q = ''] = raw.split('?');
  return { path: p.split('/').filter(Boolean).map(decodeURIComponent), query: new URLSearchParams(q) };
}

export const router = $state<{ route: Route }>({ route: parse() });

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    router.route = parse();
    window.scrollTo(0, 0);
  });
}

export function go(path: string) {
  const target = path.startsWith('#') ? path : `#${path}`;
  if (location.hash === target) router.route = parse();
  else location.hash = target;
}

export function href(path: string) {
  return `#${path}`;
}
