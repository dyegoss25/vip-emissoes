// Service Worker — VIP Emissões
// Estratégia: network-first (sempre busca a versão nova quando há internet;
// usa o cache só quando está offline). Isso evita ficar preso em versão antiga.

const CACHE_NOME = 'vip-emissoes-v1';
const ARQUIVOS_BASE = [
  './',
  './index.html',
  './icon-192.png',
  './icon-512.png'
];

// Instala: guarda os arquivos base
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NOME).then((cache) => cache.addAll(ARQUIVOS_BASE))
  );
  self.skipWaiting();
});

// Ativa: limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => n !== CACHE_NOME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Busca: network-first para navegação/HTML; ignora chamadas externas (Google, APIs)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Só cuida do próprio site (mesma origem). Deixa Google/Drive/Sheets passarem direto.
  if (url.origin !== self.location.origin) return;
  if (req.method !== 'GET') return;

  event.respondWith(
    fetch(req)
      .then((resp) => {
        // Atualiza o cache com a versão nova
        const copia = resp.clone();
        caches.open(CACHE_NOME).then((cache) => cache.put(req, copia));
        return resp;
      })
      .catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
  );
});
