const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','..');
const rig=fs.readFileSync(path.join(root,'teacher-rig.js'),'utf8');
const css=fs.readFileSync(path.join(root,'teacher-rig.css'),'utf8');
const rigModule=require(path.join(root,'teacher-rig.js'));

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

test('accessible teacher motion uses natural gender-correct Hebrew',()=>{
  assert.equal(rigModule.stateLabel('female-young','idle'),'אמילי מוכנה');
  assert.equal(rigModule.stateLabel('female-young','encouraging'),'אמילי מעודדת אותך');
  assert.equal(rigModule.stateLabel('male-young','idle'),'אדם מוכן');
  assert.equal(rigModule.stateLabel('male-young','celebrating'),'אדם חוגג איתך');
  assert.doesNotMatch(rig,/מוכן\$\{gender===.*\}/);
  assert.doesNotMatch(rig,/`\$\{this\.name\} \$\{normalized\}`/);
  assert.doesNotMatch(rig,/מוכןה/);
  assert.match(rig,/startMouth\(\).*gestureLabel\.textContent=stateLabel\(this\.character,'speak'\)/);
});
