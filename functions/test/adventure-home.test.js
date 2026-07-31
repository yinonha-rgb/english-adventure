const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'adventure-home.js'),'utf8');
const css=fs.readFileSync(path.join(root,'adventure-home.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const sandbox={document:{readyState:'loading',addEventListener(){}},setTimeout(){},console};sandbox.window=sandbox;
vm.runInNewContext(source,sandbox);
const mission=sandbox.EAAdventureHome.missionFor;

test('home becomes a living story world without replacing the daily lesson engine',()=>{
  assert.match(html,/adventure-home\.css\?v=4\.22\.0/);
  assert.match(html,/adventure-home\.js\?v=4\.22\.0/);
  assert.match(source,/living-world/);
  assert.match(source,/dragon-companion/);
  assert.match(source,/world-trail/);
  assert.match(html,/id="dailyLessonBtn"/);
});

test('daily mission changes safely with learning state',()=>{
  assert.equal(mission({lang:'en',progress:{completed:[]}}).state,'first');
  assert.equal(mission({lang:'en',progress:{completed:['one'],mistakes:[{id:'m'}]}}).state,'review');
  assert.equal(mission({lang:'en',progress:{completed:Array(9).fill('done')}}).state,'castle');
  assert.equal(mission({lang:'en',progress:{},completed:true}).state,'complete');
});

test('the world stays visibly alive and respects reduced motion',()=>{
  for(const animation of ['worldCloud','worldSparkle','treeSway','dragonFloat','crystalGlow','firefly','worldPulse'])assert.match(css,new RegExp(`@keyframes ${animation}`));
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(source,/firefly f1/);
});

test('companion artwork and the new experience are available offline',()=>{
  assert.ok(fs.existsSync(path.join(root,'assets','baby-dragon.svg')));
  for(const asset of ['./adventure-home.css?v=4.22.0','./adventure-home.js?v=4.22.0','./assets/baby-dragon.svg'])assert.ok(sw.includes(`'${asset}'`),asset);
  assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|openai/i);
});

test('audit ranks exactly fifty improvements and records the selected first slice',()=>{
  const audit=fs.readFileSync(path.join(root,'PRODUCT_VISION_AUDIT_2026-07-31.md'),'utf8');
  assert.equal((audit.match(/^\| \d+ \|/gm)||[]).length,50);
  assert.match(audit,/\| 1 \|.*עולם חי/);
  assert.match(audit,/מיושם ב־4\.21\.0/);
});
