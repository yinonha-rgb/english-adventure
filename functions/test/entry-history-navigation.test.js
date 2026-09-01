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

test('the intro traps focus, closes reliably with Escape and locks background scrolling',()=>{
  assert.match(entry,/document\.body\.style\.overflow='hidden'/);
  assert.match(entry,/document\.body\.style\.overflow=previousBodyOverflow/);
  assert.match(entry,/if\(event\.key==='Escape'\)\{event\.preventDefault\(\);close\(\);return\}/);
  assert.match(entry,/if\(event\.key!=='Tab'\)return/);
  assert.match(entry,/document\.removeEventListener\('keydown',onKeydown\)/);
  assert.doesNotMatch(entry,/document\.addEventListener\('keydown'[^\n]+once:true/);
});

test('the intro makes the background inert and restores its previous accessibility state',()=>{
  assert.match(entry,/!\['SCRIPT','STYLE','LINK','TEMPLATE'\]\.includes\(element\.tagName\)/);
  assert.match(entry,/element\.setAttribute\('inert',''\)/);
  assert.match(entry,/element\.setAttribute\('aria-hidden','true'\)/);
  assert.match(entry,/restoreBackground\(\)/);
  assert.match(entry,/if\(inert\)element\.setAttribute\('inert',''\);else element\.removeAttribute\('inert'\)/);
});

test('the mobile primary action appears before media and closing returns to the top safely',()=>{
  assert.match(entry,/\.ea-video-entry-actions\{order:0\}/);
  assert.match(entry,/\.ea-video-entry-media\{order:1;min-height:180px\}/);
  assert.doesNotMatch(entry,/\.ea-video-entry-media\{order:-1/);
  assert.match(entry,/scrollTo\(0,0\)/);
  assert.match(entry,/focus\?\.\(\{preventScroll:true\}\)/);
});

test('late video playback callbacks cannot touch a closed intro',()=>{
  const guard=/if\(!page\|\|!document\.body\.contains\(page\)\)return/g;
  assert.ok((entry.match(guard)||[]).length>=3);
  assert.match(entry,/page\.querySelector\('\.ea-video-entry-start'\)\?\.focus\(\)/);
});

test('the navigation fix is served by the new application cache',()=>{
  assert.match(html,/entry-video\.js\?v=5\.3\.2/);
  assert.match(sw,/english-adventure-5\.4\.10/);
  assert.match(sw,/entry-video\.js\?v=5\.3\.2/);
});
