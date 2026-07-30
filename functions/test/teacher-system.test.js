const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','..');
const System=require(path.join(root,'teacher-system.js'));
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
    assert.ok(Object.isFrozen(profile));
  }
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
  assert.match(html,/teacher-system\.js\?v=4\.17\.1/);
  assert.match(sw,/teacher-system\.js\?v=4\.17\.1/);
  assert.match(fs.readFileSync(path.join(root,'teacher-ai.js'),'utf8'),/teacher\?\.voiceGender/);
  assert.match(fs.readFileSync(path.join(root,'interactive-activity-engine.js'),'utf8'),/EATeacherSystem\?\.createLessonTeacher/);
});
