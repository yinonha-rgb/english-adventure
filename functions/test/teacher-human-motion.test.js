const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','..');
const rig=fs.readFileSync(path.join(root,'teacher-rig.js'),'utf8');
const css=fs.readFileSync(path.join(root,'teacher-rig.css'),'utf8');

test('visible teacher motion uses gentle body shifts instead of hidden layers',()=>{
  assert.match(rig,/weight-left.*weight-right/);
  assert.doesNotMatch(rig,/gaze-left.*gaze-right.*shoulder.*breathe/);
  assert.match(css,/data-motion="weight-left"\] \.teacher-rig-canvas/);
  assert.match(css,/data-motion="weight-right"\] \.teacher-rig-canvas/);
});

test('human motion cadence remains varied and subtle',()=>{
  assert.match(rig,/randomBetween\(1600,2600\)/);
  assert.match(rig,/randomBetween\(850,1550\)/);
  assert.match(css,/@keyframes rigAlive/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
