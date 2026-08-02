const VERSION='english-adventure-4.30.0';
const CACHE_PREFIX='english-adventure-';
const CORE=['./','./index.html','./teacher-rig.css?v=4.30.0','./adventure-home.css?v=4.30.0','./translations.js?v=4.30.0','./ui-controls.js?v=4.30.0','./answer-playback.js?v=4.30.0','./natural-voice.js?v=4.30.0','./teacher-visual.js?v=4.30.0','./teacher-rig.js?v=4.30.0','./teacher-system.js?v=4.30.0','./adventure-home.js?v=4.30.0','./adaptive-learning.js?v=4.30.0','./daily-lesson-core.js?v=4.30.0','./interactive-activity-engine.js?v=4.30.0','./advanced-ai-config.js?v=4.30.0','./pricing-config.js?v=4.30.0','./advanced-ai-policy.js?v=4.30.0','./teacher-providers.js?v=4.30.0','./app.js?v=4.30.0','./teacher-modes-core.js?v=4.30.0','./firebase-sync.js?v=4.30.0','./teacher-ai.js?v=4.30.0','./firebase-config.js','./content.json','./manifest.json','./update-manifest.json','./icon.svg','./icon-maskable.svg','./assets/baby-dragon.svg','./assets/teacher-adam.png','./assets/teacher-noa.png','./assets/teacher-adam-body-v2.png','./assets/teacher-adam-expression-celebrating-v2.png','./assets/teacher-adam-expression-encouraging-v2.png','./assets/teacher-adam-expression-happy-v2.png','./assets/teacher-adam-expression-listening-v2.png','./assets/teacher-adam-expression-neutral-v2.png','./assets/teacher-adam-expression-thinking-v2.png','./assets/teacher-adam-mouth-a-v2.png','./assets/teacher-adam-mouth-e-v2.png','./assets/teacher-adam-mouth-o-v2.png','./assets/teacher-adam-mouth-rest-v2.png','./assets/teacher-adam-mouth-smile-v2.png','./assets/teacher-noa-body-v2.png','./assets/teacher-noa-expression-celebrating-v2.png','./assets/teacher-noa-expression-encouraging-v2.png','./assets/teacher-noa-expression-happy-v2.png','./assets/teacher-noa-expression-listening-v2.png','./assets/teacher-noa-expression-neutral-v2.png','./assets/teacher-noa-expression-thinking-v2.png','./assets/teacher-noa-mouth-a-v2.png','./assets/teacher-noa-mouth-e-v2.png','./assets/teacher-noa-mouth-o-v2.png','./assets/teacher-noa-mouth-rest-v2.png','./assets/teacher-noa-mouth-smile-v2.png'];

CORE.push('./assets/teacher-noa-idle-loop-v1.webp','./assets/teacher-adam-idle-loop-v1.webp');
CORE.push('./child-camera.css?v=4.30.0','./child-camera.js?v=4.30.0');

const cacheGoodResponse=async(cache,request,response)=>{
  if(response?.ok&&response.type==='basic')await cache.put(request,response.clone());
  return response;
};

self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(VERSION);
  // One unavailable optional asset must not reject the whole service-worker install.
  await Promise.allSettled(CORE.map(async url=>{
    const response=await fetch(new Request(url,{cache:'reload'}));
    if(response.ok&&response.type==='basic')await cache.put(url,response);
  }));
})()));

self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==VERSION).map(key=>caches.delete(key)));
  await self.clients.claim();
  const clients=await self.clients.matchAll({type:'window'});
  clients.forEach(client=>client.postMessage({type:'SW_ACTIVATED',version:VERSION}));
})()));

self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});

async function networkFirst(request,{fallback}={}){
  const cache=await caches.open(VERSION);
  try{
    const response=await fetch(request,{cache:'no-store'});
    return await cacheGoodResponse(cache,request,response);
  }catch{
    return await cache.match(request)||await caches.match(fallback||request)||(fallback?Response.error():Response.error());
  }
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  // Authentication, Firestore and every other cross-origin response remain outside this cache.
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'||url.pathname.endsWith('/index.html')){
    event.respondWith(networkFirst(event.request,{fallback:'./index.html'}));
    return;
  }
  if(url.pathname.endsWith('/sw.js')||url.pathname.endsWith('/update-manifest.json')){
    event.respondWith(networkFirst(event.request));
    return;
  }
  event.respondWith((async()=>{
    const cache=await caches.open(VERSION),cached=await cache.match(event.request);
    const refresh=fetch(event.request).then(response=>cacheGoodResponse(cache,event.request,response)).catch(()=>null);
    if(cached){event.waitUntil(refresh);return cached}
    return await refresh||Response.error();
  })());
});
