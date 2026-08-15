const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..','..');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');

test('precache includes every active teacher visual required offline',()=>{
  for(const teacher of ['noa','adam']){
    assert.match(sw,new RegExp(`assets/teacher-${teacher}\\.png`));
    assert.match(sw,new RegExp(`assets/teacher-${teacher}-body-v2\\.png`));
    for(const expression of ['neutral','happy','listening','thinking','encouraging','celebrating']){
      assert.match(sw,new RegExp(`assets/teacher-${teacher}-expression-${expression}-v2\\.png`));
    }
    for(const mouth of ['rest','a','e','o','smile']){
      assert.match(sw,new RegExp(`assets/teacher-${teacher}-mouth-${mouth}-v2\\.png`));
    }
  }
});

test('precache excludes unused legacy rig layers and idle-loop media',()=>{
  assert.doesNotMatch(sw,/assets\/rigs\//);
  assert.doesNotMatch(sw,/idle-loop-v1\.webp/);
  assert.doesNotMatch(sw,/const RIG_PARTS=/);
});

test('teacher runtime does not advertise an unused idle-loop asset',()=>{
  const rig=fs.readFileSync(path.join(root,'teacher-rig.js'),'utf8');
  assert.doesNotMatch(rig,/idleLoop/);
});
