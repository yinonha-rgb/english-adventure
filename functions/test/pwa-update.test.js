const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8'),app=fs.readFileSync(path.join(root,'app.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');

test('PWA navigations are network-first with an offline index fallback',()=>{
  assert.match(sw,/request\.mode==='navigate'/);
  assert.match(sw,/fetch\(request,\{cache:'no-store'\}\)/);
  assert.match(sw,/fallback:'\.\/index\.html'/);
});
test('only successful basic responses enter the cache and one bad optional asset cannot abort install',()=>{
  assert.match(sw,/response\?\.ok&&response\.type==='basic'/);
  assert.match(sw,/Promise\.allSettled\(CORE\.map/);
  assert.doesNotMatch(sw,/cache\.addAll/);
});
test('activation deletes obsolete app caches and immediately claims clients',()=>{
  assert.match(sw,/key\.startsWith\(CACHE_PREFIX\)&&key!==VERSION/);
  assert.match(sw,/self\.clients\.claim\(\)/);
});
test('service-worker updates bypass cache, show an accessible action and reload at most once',()=>{
  assert.match(app,/updateViaCache:'none'/);
  assert.match(app,/reg\.update\(\)/);
  assert.match(app,/if\(swReloadStarted\)return;swReloadStarted=true;location\.reload\(\)/);
  assert.match(app,/updateBtn\.disabled=true/);
  assert.match(html,/id="updateNotice" role="status" aria-live="polite"/);
});
test('4.9.2 precache contains every local script referenced by index',()=>{
  for(const match of html.matchAll(/<script(?: type="module")? src="([^"]+)"/g))assert.ok(sw.includes(`'./${match[1]}'`),match[1]);
});
test('service worker never handles cross-origin Firebase or API traffic',()=>{
  assert.match(sw,/if\(url\.origin!==self\.location\.origin\)return/);
  assert.doesNotMatch(sw,/openai/i);
});
