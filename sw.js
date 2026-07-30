const VERSION='english-adventure-4.9.1';
const CORE=['./','./index.html','./translations.js?v=4.9.1','./ui-controls.js?v=4.9.1','./answer-playback.js?v=4.9.1','./natural-voice.js?v=4.9.1','./teacher-visual.js?v=4.9.1','./adaptive-learning.js?v=4.9.1','./advanced-ai-config.js?v=4.9.1','./pricing-config.js?v=4.9.1','./advanced-ai-policy.js?v=4.9.1','./teacher-providers.js?v=4.9.1','./app.js?v=4.9.1','./teacher-modes-core.js?v=4.9.1','./firebase-sync.js?v=4.9.1','./teacher-ai.js?v=4.9.1','./firebase-config.js','./content.json','./manifest.json','./update-manifest.json','./icon.svg','./icon-maskable.svg'];

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
