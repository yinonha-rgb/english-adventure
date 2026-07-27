const VERSION='english-adventure-2.0.0';
const CORE=['./','./index.html','./app.js','./content.json','./manifest.json','./update-manifest.json','./icon.svg','./icon-maskable.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const url=new URL(e.request.url);if(url.origin!==location.origin)return;e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(VERSION).then(c=>c.put(e.request,copy))}return response}).catch(()=>e.request.mode==='navigate'?caches.match('./index.html'):undefined)))});
