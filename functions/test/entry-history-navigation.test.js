const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'../..');
const entry=fs.readFileSync(path.join(root,'entry-video.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');

test('entering the home screen creates a browser-history destination',()=>{
  assert.match(entry,/history\.replaceState\(viewState\(ENTRY_VIEW\)/);
  assert.match(entry,/history\.pushState\(viewState\(HOME_VIEW\)/);
  assert.match(entry,/if\(pushHistory\)pushHomeHistory\(\)/);
});

test('browser Back restores the intro and Forward restores the home screen',()=>{
  assert.match(entry,/addEventListener\('popstate'/);
  assert.match(entry,/event\.state\?\.eaView===HOME_VIEW/);
  assert.match(entry,/show\(\{fromHistory:true\}\)/);
  assert.match(entry,/close\(\{pushHistory:false\}\)/);
});

test('the navigation fix is served by the new application cache',()=>{
  assert.match(html,/entry-video\.js\?v=4\.46\.0/);
  assert.match(sw,/english-adventure-4\.46\.8/);
  assert.match(sw,/entry-video\.js\?v=4\.46\.0/);
});
