const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'../..');
const accessibility=require(path.join(root,'accessibility-tools.js'));

test('accessibility settings are normalized and safely bounded',()=>{
  assert.deepEqual(accessibility.normalize({textScale:9,letterSpacing:-4,highContrast:1}),{
    readableFont:false,
    textScale:1.4,
    letterSpacing:0,
    highContrast:true,
    readingRuler:false,
    reduceMotion:false
  });
  assert.deepEqual(accessibility.normalize(),accessibility.DEFAULTS);
});

test('the application exposes an accessible, closable settings panel',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
  assert.match(html,/id="accessibilityBtn"/);
  assert.match(html,/id="accessibilityModal" role="dialog" aria-modal="true"/);
  assert.match(html,/id="accessibilityModal"[\s\S]*?data-close aria-label="סגירת החלון"/);
  assert.match(app,/EAAccessibility\?\.mount/);
  assert.match(app,/data\.settings\.accessibility=next;save\(\)/);
});

test('accessibility module supports core reading adaptations without remote services',()=>{
  const source=fs.readFileSync(path.join(root,'accessibility-tools.js'),'utf8');
  for(const feature of ['ea-readable-font','ea-high-contrast','ea-reading-ruler','ea-reduce-motion'])assert.match(source,new RegExp(feature));
  assert.doesNotMatch(source,/fetch\s*\(|XMLHttpRequest|openai|gemini|\/api\//i);
});
