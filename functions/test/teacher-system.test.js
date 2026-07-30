const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','..');
const System=require(path.join(root,'teacher-system.js'));
const Visual=require(path.join(root,'teacher-visual.js'));
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const sync=fs.readFileSync(path.join(root,'firebase-sync.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');

test('initial catalog includes warm female and male private tutors',()=>{
  assert.deepEqual(System.CATALOG.map(x=>x.id),['noa','daniel']);
  assert.equal(System.byId('noa').voiceGender,'girl');
  assert.equal(System.byId('daniel').voiceGender,'boy');
  for(const profile of System.CATALOG){
    assert.ok(profile.name&&profile.nameHe&&profile.character&&profile.descriptionHe);
    assert.ok(profile.age>=25&&profile.age<=35);
    for(const trait of ['encouraging','patient','positive','playful','calm'])assert.ok(profile.personality.includes(trait));
    assert.ok(Object.isFrozen(profile));
    assert.ok(Object.isFrozen(profile.personality));
  }
  assert.match(System.byId('noa').choiceLabel,/Young Female Teacher/);
  assert.match(System.byId('daniel').choiceLabel,/Young Male Teacher/);
  assert.match(System.byId('noa').choiceLabelHe,/צעירה/);
  assert.match(System.byId('daniel').choiceLabelHe,/צעיר/);
});

test('teacher artwork is consistent and collision-free across simultaneous instances',()=>{
  const first=Visual.characterSvg('noa');
  const second=Visual.characterSvg('noa');
  const male=Visual.characterSvg('daniel');
  const firstId=first.match(/id="skin-([^"]+)"/)?.[1];
  const secondId=second.match(/id="skin-([^"]+)"/)?.[1];
  assert.ok(firstId&&secondId);
  assert.notEqual(firstId,secondId);
  assert.match(first,new RegExp(`fill="url\\(#skin-${firstId}\\)"`));
  assert.match(first,/מורה צעירה, ידידותית ומקצועית/);
  assert.match(male,/מורה צעיר, ידידותי ומקצועי/);
});

test('teacher architecture is reusable without lesson-engine changes',()=>{
  for(const component of ['TeacherProfile','TeacherRenderer','TeacherAnimationController','TeacherVoiceManager','TeacherEmotionController'])assert.equal(typeof System[component],'function');
  assert.equal(System.TeacherEmotionController.stateFor('correct'),'celebrating');
  assert.equal(System.TeacherEmotionController.stateFor('wrong-related'),'pointing');
  assert.equal(System.TeacherEmotionController.stateFor('completely-unrelated'),'encouraging');
});

test('teacher selection is per child, available on first lesson and profile settings',()=>{
  assert.match(app,/if\(voice&&!child\.teacherId\)return chooseTeacher/);
  assert.match(app,/current\.teacherId=teacher\.id/);
  assert.match(app,/data\.profiles\.find\(item=>item\.id===childId\)/);
  assert.match(app,/בחירת מורה עבור/);
  assert.match(app,/teacherId:child\.teacherId/);
  assert.match(sync,/teacherId:\['noa','daniel'\]\.includes/);
  assert.match(sync,/teacherId:newer\.teacherId\|\|null/);
});

test('selected teacher owns renderer and voice identity',()=>{
  assert.match(app,/teacher\.nameHe.*מחכה לך/);
  assert.match(html,/teacher-choice-grid/);
  assert.match(html,/teacher-system\.js\?v=4\.18\.0/);
  assert.match(sw,/teacher-system\.js\?v=4\.18\.0/);
  assert.match(fs.readFileSync(path.join(root,'teacher-ai.js'),'utf8'),/teacher\?\.voiceGender/);
  assert.match(fs.readFileSync(path.join(root,'interactive-activity-engine.js'),'utf8'),/EATeacherSystem\?\.createLessonTeacher/);
});
