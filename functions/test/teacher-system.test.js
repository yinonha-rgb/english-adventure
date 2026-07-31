const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','..');
const System=require(path.join(root,'teacher-system.js'));
const Visual=require(path.join(root,'teacher-visual.js'));
const Rig=require(path.join(root,'teacher-rig.js'));
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const sync=fs.readFileSync(path.join(root,'firebase-sync.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');

test('initial catalog includes warm female and male private tutors',()=>{
  assert.deepEqual(System.CATALOG.map(x=>x.id),['female-young','male-young']);
  assert.equal(System.byId('female-young').voiceGender,'female');
  assert.equal(System.byId('male-young').voiceGender,'male');
  for(const profile of System.CATALOG){
    assert.ok(profile.name&&profile.nameHe&&profile.character&&profile.descriptionHe);
    assert.ok(profile.age>=25&&profile.age<=35);
    for(const trait of ['encouraging','patient','positive','playful','calm'])assert.ok(profile.personality.includes(trait));
    assert.ok(Object.isFrozen(profile));
    assert.ok(Object.isFrozen(profile.personality));
  }
  assert.equal(System.byId('female-young').choiceLabelHe,'נועה – מורה');
  assert.equal(System.byId('male-young').choiceLabelHe,'אדם – מורה');
  assert.equal(System.byId('female-young').imageAsset,'assets/teacher-noa.png');
  assert.equal(System.byId('male-young').imageAsset,'assets/teacher-adam.png');
  assert.equal(System.byId('female-young').spriteAsset,'assets/teacher-noa-body-v2.png');
  assert.equal(System.byId('male-young').spriteAsset,'assets/teacher-adam-body-v2.png');
  assert.equal(System.byId('noa').id,'female-young');
  assert.equal(System.byId('daniel').id,'male-young');
});

test('layered sprite rigs use distinct isolated atlases, expressions and mouth shapes',()=>{
  const female=Rig.rigMarkup('female-young');
  const male=Rig.rigMarkup('male-young');
  assert.match(female,/teacher-noa-body-v2\.png/);
  assert.match(male,/teacher-adam-body-v2\.png/);
  for(const markup of [female,male]){
    assert.match(markup,/class="rig-body"[^>]*src=/);
    assert.match(markup,/rig-expression[^>]*src=[^>]* hidden/);
    assert.match(markup,/rig-mouth-shape[^>]*src=[^>]* hidden/);
    for(const expression of ['listening','thinking','encouraging','celebrating'])assert.match(markup,new RegExp(`rig-expression-${expression}`));
    for(const mouth of ['rest','a','e','o','smile'])assert.match(markup,new RegExp(`rig-mouth-${mouth}`));
  }
  assert.doesNotMatch(female,/teacher-adam-/);
  assert.doesNotMatch(male,/teacher-noa-/);
  const rigCss=fs.readFileSync(path.join(root,'teacher-rig.css'),'utf8');
  for(const state of ['speaking','listening','thinking','encouraging','celebrating'])assert.match(rigCss,new RegExp(`data-state=\"${state}\"`));
  assert.match(rigCss,/prefers-reduced-motion:reduce/);
});

test('rig assets are shipped, cached offline and loaded before the teacher system',()=>{
  for(const file of ['teacher-noa-body-v2.png','teacher-adam-body-v2.png']){
    assert.ok(fs.statSync(path.join(root,'assets',file)).size>100000,file);
    assert.match(sw,new RegExp(`assets/${file.replace('.','\\.')}`));
  }
  for(const teacher of ['noa','adam'])for(const expression of ['happy','listening','thinking','encouraging','celebrating']){
    const file=`teacher-${teacher}-expression-${expression}-v2.png`;
    assert.ok(fs.existsSync(path.join(root,'assets',file)),file);
    assert.match(sw,new RegExp(`assets/${file.replace('.','\\.')}`));
  }
  assert.match(html,/teacher-rig\.css\?v=4\.20\.15/);
  assert.match(html,/teacher-visual\.js\?v=4\.20\.15[\s\S]*teacher-rig\.js\?v=4\.20\.15[\s\S]*teacher-system\.js\?v=4\.20\.15/);
});

test('female and male teachers use distinct dedicated artwork',()=>{
  const first=Visual.characterSvg('female-young');
  const second=Visual.characterSvg('female-young');
  const male=Visual.characterSvg('male-young');
  const firstId=first.match(/id="skin-([^"]+)"/)?.[1];
  const secondId=second.match(/id="skin-([^"]+)"/)?.[1];
  assert.ok(firstId&&secondId);
  assert.notEqual(firstId,secondId);
  assert.match(first,new RegExp(`fill="url\\(#skin-${firstId}\\)"`));
  assert.match(first,/מורה צעירה, ידידותית ומקצועית/);
  assert.match(male,/מורה צעיר, ידידותי ומקצועי/);
  assert.match(first,/teacher-female-asset/);
  assert.match(male,/teacher-male-asset/);
  assert.match(first,/female-teacher/);
  assert.match(male,/male-teacher/);
  assert.doesNotMatch(first,/#d9a441/);
  assert.match(male,/#d9a441/);
});

test('photo teachers animate as layered characters in every lesson state',()=>{
  const source=fs.readFileSync(path.join(root,'teacher-visual.js'),'utf8');
  for(const layer of ['teacher-photo-base','teacher-photo-head','teacher-photo-arm','teacher-photo-speech','teacher-photo-aura','teacher-photo-stars'])assert.match(source,new RegExp(layer));
  for(const animation of ['teacherPhotoBreath','teacherPhotoAliveHead','teacherPhotoTalkHead','teacherPhotoExplainHand','teacherPhotoWaveHand','teacherPhotoListen','teacherPhotoCelebrate','teacherPhotoMouth'])assert.match(html,new RegExp(animation));
  for(const state of ['speaking','listening','thinking','pointing','praising','celebrating','correcting'])assert.match(html,new RegExp(`data-state="${state}"`));
  assert.match(html,/prefers-reduced-motion:reduce/);
});

test('photo teachers use natural, state-aware motion without excluding reduced-motion users',()=>{
  for(const animation of ['teacherNaturalBlink','teacherNaturalIdle','teacherListeningLean','teacherThoughtfulBody','teacherGestureArc','teacherGentleCorrection']){
    assert.match(html,new RegExp(animation));
  }
  assert.match(html,/teacher-photo-wrap::before/);
  assert.match(html,/data-state="listening"[^}]+teacher-photo-wrap/);
  assert.match(html,/data-state="pointing"[^}]+teacher-photo-wrap::after/);
  assert.match(html,/@media\(prefers-reduced-motion:reduce\)[^{]*\{[^}]*teacher-photo-wrap/);
  assert.doesNotMatch(html,/teacherPhotoCelebrate[^@]+translateY\(-13px\)/);
  assert.doesNotMatch(html,/teacherPhotoPoint[^@]+rotate\(-8deg\)/);
  assert.match(html,/animation-duration:1\.65s/);
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
  assert.match(sync,/noa:'female-young'/);
  assert.match(sync,/daniel:'male-young'/);
  assert.match(sync,/teacherId:newer\.teacherId\|\|null/);
});

test('selected teacher owns renderer and voice identity',()=>{
  assert.match(app,/teacher\.nameHe.*מחכה לך/);
  assert.match(html,/teacher-choice-grid/);
  assert.match(html,/teacher-system\.js\?v=4\.20\.15/);
  assert.match(sw,/teacher-system\.js\?v=4\.20\.15/);
  assert.match(fs.readFileSync(path.join(root,'teacher-ai.js'),'utf8'),/teacher\?\.voiceGender/);
  assert.match(fs.readFileSync(path.join(root,'teacher-ai.js'),'utf8'),/teacherVoiceGender/);
  assert.match(fs.readFileSync(path.join(root,'teacher-ai.js'),'utf8'),/voiceTeacherId/);
  assert.match(fs.readFileSync(path.join(root,'teacher-ai.js'),'utf8'),/TeacherSystem=window\.EATeacherSystem/);
  assert.match(fs.readFileSync(path.join(root,'interactive-activity-engine.js'),'utf8'),/EATeacherSystem\?\.createLessonTeacher/);
});

test('female and male previews apply matching voices and distinct fallback pitch',async()=>{
  const oldNatural=globalThis.EANaturalVoice,oldSynth=globalThis.speechSynthesis,oldUtterance=globalThis.SpeechSynthesisUtterance;
  const Natural=require(path.join(root,'natural-voice.js')),spoken=[];
  globalThis.EANaturalVoice=Natural;
  globalThis.speechSynthesis={getVoices:()=>[{name:'Unknown Hebrew',lang:'he-IL',voiceURI:'he',localService:true}],cancel(){},speak(value){spoken.push(value)}};
  globalThis.SpeechSynthesisUtterance=function(text){this.text=text};
  try{
    await System.previewTeacher(System.byId('female-young'),'he');
    await System.previewTeacher(System.byId('male-young'),'he');
    assert.ok(spoken[0].pitch>1.1);
    assert.ok(spoken[1].pitch<.9);
    assert.match(spoken[0].text,/נועה/);
    assert.match(spoken[1].text,/אדם/);
  }finally{globalThis.EANaturalVoice=oldNatural;globalThis.speechSynthesis=oldSynth;globalThis.SpeechSynthesisUtterance=oldUtterance}
});

test('Adam uses the supplied portrait consistently and offline',()=>{
  const asset=path.join(root,'assets','teacher-adam.png');
  assert.ok(fs.existsSync(asset));
  assert.ok(fs.statSync(asset).size>100000);
  assert.match(System.portraitMarkup(System.byId('male-young')),/class="teacher-photo"/);
  assert.match(app,/EATeacherSystem\?\.portraitMarkup/);
  assert.match(sw,/\.\/assets\/teacher-adam\.png/);
});

test('Noa uses the supplied portrait consistently and offline',()=>{
  const asset=path.join(root,'assets','teacher-noa.png');
  assert.ok(fs.existsSync(asset));
  assert.ok(fs.statSync(asset).size>100000);
  assert.match(System.portraitMarkup(System.byId('female-young')),/assets\/teacher-noa\.png/);
  assert.match(sw,/\.\/assets\/teacher-noa\.png/);
});

test('preview screen exposes names, descriptions, matching previews and explicit controls',()=>{
  const markup=System.selectionMarkup('female-young','he');
  assert.match(markup,/נועה – מורה/);
  assert.match(markup,/אדם – מורה/);
  assert.match(markup,/data-teacher-preview="female-young"/);
  assert.match(markup,/data-teacher-choice="male-young"/);
  assert.equal(System.byId('female-young').previewHe,'שלום, אני נועה. אני שמחה ללמוד איתך אנגלית!');
  assert.equal(System.byId('male-young').previewHe,'שלום, אני אדם. אני שמח ללמוד איתך אנגלית!');
  assert.match(markup,/assets\/teacher-adam\.png/);
  assert.match(markup,/assets\/teacher-noa\.png/);
});

test('Hebrew state grammar follows the selected teacher gender',()=>{
  assert.equal(Visual.GENDER_LABELS.female.listening,'נועה מקשיבה');
  assert.equal(Visual.GENDER_LABELS.male.listening,'אדם מקשיב');
  assert.equal(Visual.GENDER_LABELS.female.idle,'נועה מוכנה');
  assert.equal(Visual.GENDER_LABELS.male.idle,'אדם מוכן');
});
