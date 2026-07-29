const VERSION='english-adventure-4.3.0';
const CORE=['./','./index.html','./app.js?v=4.3.0','./teacher-modes-core.js?v=4.3.0','./firebase-sync.js?v=4.3.0','./teacher-ai.js?v=4.3.0','./firebase-config.js','./content.json','./manifest.json','./update-manifest.json','./icon.svg','./icon-maskable.svg'];

self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(CORE))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  // Never inspect or cache Firebase Authentication, Firestore, Google account,
  // or any other cross-origin response. Firebase manages its own offline queue.
  if(url.origin!==self.location.origin)return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok&&response.type==='basic'){
      const copy=response.clone();
      caches.open(VERSION).then(cache=>cache.put(event.request,copy));
    }
    return response;
  }).catch(async()=>await caches.match(event.request)||(event.request.mode==='navigate'?caches.match('./index.html'):Response.error())));
});
