const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'../..');
const css=fs.readFileSync(path.join(root,'visual-polish.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');

test('shared visual polish loads after the existing home and camera styles',()=>{
  assert.match(html,/adventure-home\.css\?v=4\.42\.5[\s\S]*visual-polish\.css\?v=4\.50\.0/);
  assert.equal([...html.matchAll(/visual-polish\.css/g)].length,1);
});

test('visual system gives home and lesson surfaces a consistent hierarchy',()=>{
  for(const selector of ['.profilebar','.teacher-home','.lesson','.interactive-panel','.interactive-top','.interactive-bottom','.interactive-choice'])assert.ok(css.includes(selector),selector);
  assert.match(css,/--ea-violet:/);
  assert.match(css,/--ea-shadow:/);
  assert.match(css,/focus|\.daily-start/);
});

test('camera loading and failure states are branded instead of black',()=>{
  assert.match(css,/\.child-camera\[data-state="starting"\]/);
  assert.match(css,/\.child-camera\[data-state="error"\]/);
  assert.match(css,/content:"📷"/);
  assert.doesNotMatch(css,/\.child-camera\{[^}]*background:\s*#000/);
});

test('visual polish is responsive, motion-safe and available offline',()=>{
  assert.match(css,/@media\(max-width:700px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(sw,/visual-polish\.css\?v=4\.50\.0/);
  assert.match(sw,/english-adventure-5\.3\.0/);
});
