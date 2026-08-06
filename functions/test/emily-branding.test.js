const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const System=require(path.join(root,'teacher-system.js'));

test('the installed application is branded Emily',()=>{
  const manifest=JSON.parse(read('manifest.json'));
  const html=read('index.html');
  assert.equal(manifest.short_name,'Emily');
  assert.match(manifest.name,/^Emily\b/);
  assert.match(html,/<title>Emily<\/title>/);
  assert.match(html,/<span class="logo">E<\/span><span>Emily<\/span>/);
});

test('the female teacher is Emily without changing persistent profile ids',()=>{
  const emily=System.byId('female-young');
  assert.equal(emily.id,'female-young');
  assert.equal(emily.name,'Emily');
  assert.equal(emily.nameHe,'אמילי – מורה');
  assert.match(emily.previewHe,/אני אמילי/);
  assert.equal(emily.imageAsset,'assets/teacher-noa.png');
  assert.equal(System.byId('noa').id,'female-young');
});

test('visible teacher copy no longer presents the old female name',()=>{
  const copy=['index.html','app.js','entry-video.js','teacher-ai.js','teacher-visual.js','teacher-rig.js','teacher-noa-video.js']
    .map(read).join('\n');
  for(const oldName of ['המורה נועה','נועה – מורה','אני נועה','נועה מדברת','נועה מקשיבה']){
    assert.doesNotMatch(copy,new RegExp(oldName));
  }
  assert.match(copy,/אמילי/);
});

