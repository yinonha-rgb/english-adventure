const VERSION='english-adventure-4.42.16';
const CACHE_PREFIX='english-adventure-';
const CORE=['./','./index.html','./teacher-rig.css?v=4.38.0','./adventure-home.css?v=4.38.0','./translations.js?v=4.38.0','./ui-controls.js?v=4.38.0','./answer-playback.js?v=4.38.0','./natural-voice.js?v=4.38.0','./teacher-visual.js?v=4.38.0','./teacher-rig.js?v=4.38.0','./teacher-system.js?v=4.38.0','./adventure-home.js?v=4.38.0','./adaptive-learning.js?v=4.38.0','./daily-lesson-core.js?v=4.38.0','./interactive-activity-engine.js?v=4.38.0','./advanced-ai-config.js?v=4.38.0','./pricing-config.js?v=4.38.0','./advanced-ai-policy.js?v=4.38.0','./teacher-providers.js?v=4.38.0','./app.js?v=4.38.0','./teacher-modes-core.js?v=4.38.0','./firebase-sync.js?v=4.38.0','./teacher-ai.js?v=4.38.0','./firebase-config.js','./content.json','./manifest.json','./update-manifest.json','./icon.svg','./icon-maskable.svg','./assets/baby-dragon.svg','./assets/teacher-adam.png','./assets/teacher-noa.png','./assets/teacher-adam-body-v2.png','./assets/teacher-adam-expression-celebrating-v2.png','./assets/teacher-adam-expression-encouraging-v2.png','./assets/teacher-adam-expression-happy-v2.png','./assets/teacher-adam-expression-listening-v2.png','./assets/teacher-adam-expression-neutral-v2.png','./assets/teacher-adam-expression-thinking-v2.png','./assets/teacher-adam-mouth-a-v2.png','./assets/teacher-adam-mouth-e-v2.png','./assets/teacher-adam-mouth-o-v2.png','./assets/teacher-adam-mouth-rest-v2.png','./assets/teacher-adam-mouth-smile-v2.png','./assets/teacher-noa-body-v2.png','./assets/teacher-noa-expression-celebrating-v2.png','./assets/teacher-noa-expression-encouraging-v2.png','./assets/teacher-noa-expression-happy-v2.png','./assets/teacher-noa-expression-listening-v2.png','./assets/teacher-noa-expression-neutral-v2.png','./assets/teacher-noa-expression-thinking-v2.png','./assets/teacher-noa-mouth-a-v2.png','./assets/teacher-noa-mouth-e-v2.png','./assets/teacher-noa-mouth-o-v2.png','./assets/teacher-noa-mouth-rest-v2.png','./assets/teacher-noa-mouth-smile-v2.png'];

CORE.push('./assets/teacher-noa-idle-loop-v1.webp','./assets/teacher-adam-idle-loop-v1.webp','./landing-page.js?v=4.38.0');
CORE.push('./adventure-home.css?v=4.42.5');
CORE.push('./entry-video.js?v=4.42.6','./assets/entry-welcome.mp4?v=4.42.6');
CORE.push('./entry-video.js?v=4.42.7','./assets/entry-welcome.mp4?v=4.42.7');
CORE.push('./entry-video.js?v=4.42.8','./assets/entry-welcome.mp4?v=4.42.8');
CORE.push('./entry-video.js?v=4.42.9','./assets/entry-welcome.mp4?v=4.42.9');
CORE.push('./entry-video.js?v=4.42.16');
CORE.push('./teacher-ai.js?v=4.42.10');
CORE.push('./interactive-activity-engine.js?v=4.42.11');
CORE.push('./interactive-activity-engine.js?v=4.42.12');
CORE.push('./interactive-activity-engine.js?v=4.42.13');
CORE.push('./child-camera.js?v=4.42.14','./child-camera-fix.js?v=4.42.14','./interactive-activity-engine.js?v=4.42.14','./teacher-ai.js?v=4.42.14');
CORE.push('./child-camera.js?v=4.42.15','./child-camera-fix.js?v=4.42.15','./interactive-activity-engine.js?v=4.42.15','./teacher-ai.js?v=4.42.15');
CORE.push('./teacher-noa-video.js?v=4.42.2','./assets/teacher-noa-greeting.mp4','./entry-video.js?v=4.40.0','./assets/entry-welcome.mp4');
CORE.push('./child-camera.css?v=4.38.0','./child-camera.js?v=4.38.0','./child-camera-fix.js?v=4.41.1','./child-camera.js?v=4.41.0','./home-teacher-restore.js?v=4.42.0');

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
  // Media elements request byte ranges. Passing these through preserves HTTP 206
  // responses; serving a cached full response here prevents Chrome from playing MP4.
  if(event.request.headers.has('range')){
    event.respondWith(fetch(event.request));
    return;
  }
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
