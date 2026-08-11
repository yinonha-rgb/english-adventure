const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'experience-redesign.css'),'utf8');
const js=fs.readFileSync(path.join(root,'experience-redesign.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');

test('original mentor studio keeps Emily and the daily teacher as the visual focus',()=>{
  assert.match(css,/\.teacher-home\.mentor-studio/);
  assert.match(css,/grid-template-columns:minmax\(310px/);
  assert.match(js,/mentor-studio-bar/);
  assert.match(js,/mentor-live-state/);
  assert.match(html,/id="dailyLessonBtn"/);
});

test('home hierarchy stays bilingual, responsive and motion safe',()=>{
  assert.match(js,/מדברת ומקשיבה/);
  assert.match(js,/Talks and listens/);
  assert.match(css,/html\[lang="he"\] \.copy-en/);
  assert.match(css,/@media\(max-width:720px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

test('redesign is original, local, offline and does not introduce paid AI',()=>{
  assert.match(html,/experience-redesign\.css\?v=5\.1\.0/);
  assert.match(html,/experience-redesign\.js\?v=5\.1\.0/);
  assert.match(sw,/experience-redesign\.css\?v=5\.1\.0/);
  assert.match(sw,/experience-redesign\.js\?v=5\.1\.0/);
  assert.doesNotMatch(`${js}\n${css}`,/lexiteach|fetch\s*\(|openai|api[_-]?key/i);
});
