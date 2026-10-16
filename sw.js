const CACHE = 'azkar-v12';
const FILES = ["./", "index.html", "manifest.webmanifest", "amiri.woff", "ruqaa.woff", "messiri.woff", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];
// install: always download fresh copies (never from the browser's short-term cache)
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(FILES.map(f => fetch(new Request(f, {cache: 'reload'})).then(r => { if (r.ok) return c.put(f, r); }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // the app page itself: network first (so updates appear at once when online), saved copy when offline
  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
    e.respondWith(fetch(new Request(req.url, {cache: 'no-store'})).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put('index.html', cp)); }
      return res;
    }).catch(() => caches.match('index.html').then(r => r || caches.match('./'))));
    return;
  }
  // fonts and icons: saved copy first
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(r => r || fetch(req).then(res => {
    if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return res; })));
});
