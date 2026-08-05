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
  assert.equal(System.byId('female-young').choiceLabelHe,'אמילי – מורה');
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
    assert.match(markup,/class="[^"]*\brig-body\b[^"]*"[^>]*src=/);
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

test('central TeacherController exposes the complete living-teacher state contract',()=>{
  assert.equal(typeof Rig.TeacherController,'function');
  assert.deepEqual(Rig.STATES,['idle','speak','listen','think','point','wave','celebrate','goodbye']);
  for(const gesture of ['wave','point-left','point-right','thumbs-up','open-hands','heart-hands','clap','thinking-pose'])assert.ok(Rig.GESTURES.includes(gesture),gesture);
  const source=fs.readFileSync(path.join(root,'teacher-rig.js'),'utf8');
  assert.match(source,/scheduleMotion\(delay=randomBetween/);
  assert.match(source,/document\.addEventListener\('visibilitychange'/);
  assert.match(source,/getMetrics\(\)/);
  assert.doesNotMatch(source,/setInterval\([^)]*showMouth/);
});

test('living teacher motion remains subtle and accessible on mobile',()=>{
  const css=fs.readFileSync(path.join(root,'teacher-rig.css'),'utf8');
  for(const motion of ['breathe','blink','gaze-left','gaze-right','head-left','head-right','listen-nod','happy-bounce'])assert.match(css,new RegExp(`data-motion="${motion}"`));
  for(const gesture of ['wave','point-left','point-right','thumbs-up','open-hands','heart-hands','clap','thinking-pose'])assert.match(css,new RegExp(`data-gesture="${gesture}"`));
  assert.match(css,/max-width:600px/);
  assert.match(css,/prefers-reduced-motion:reduce/);
});

test('each teacher has a calibrated lip anchor and speaking never stacks a second face',()=>{
  assert.notDeepEqual(Rig.GEOMETRY['female-young'].mouthBox,Rig.GEOMETRY['male-young'].mouthBox);
  for(const geometry of Object.values(Rig.GEOMETRY)){
    const [x,y,width,height]=geometry.mouthBox;
    assert.ok(x>=42&&x<=46,`${geometry.key} lip x`);
    assert.ok(y>=10&&y<=17,`${geometry.key} lip y`);
    assert.ok(width<=12&&height<=4,`${geometry.key} lip size`);
  }
  const rigCss=fs.readFileSync(path.join(root,'teacher-rig.css'),'utf8');
  assert.match(rigCss,/\.teacher-presence-rig\.mouth-active \.rig-expression\{display:none!important\}/);
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
  assert.match(html,/teacher-rig\.css\?v=\d+\.\d+\.\d+/);
  assert.match(html,/teacher-visual\.js\?v=\d+\.\d+\.\d+[\s\S]*teacher-rig\.js\?v=\d+\.\d+\.\d+[\s\S]*teacher-system\.js\?v=\d+\.\d+\.\d+/);
});

test('both teachers have local seamless idle video loops with safe fallbacks',()=>{
  for(const teacher of ['noa','adam']){
    const file=`teacher-${teacher}-idle-loop-v1.webp`,bytes=fs.readFileSync(path.join(root,'assets',file));
    assert.equal(bytes.subarray(0,4).toString(),'RIFF');
    assert.equal(bytes.subarray(8,12).toString(),'WEBP');
    assert.ok(bytes.includes(Buffer.from('ANIM')),`${teacher} loop is animated`);
    assert.match(sw,new RegExp(`assets/${file.replace('.','\\.')}`));
  }
  const female=Rig.rigMarkup('female-young'),male=Rig.rigMarkup('male-young');
  assert.match(female,/rig-body-loop[^>]+teacher-noa-idle-loop-v1\.webp/);
  assert.match(male,/rig-body-loop[^>]+teacher-adam-idle-loop-v1\.webp/);
  const css=fs.readFileSync(path.join(root,'teacher-rig.css'),'utf8');
  assert.match(css,/mouth-active \.rig-body-loop\{opacity:0\}/);
  assert.match(css,/prefers-reduced-motion:reduce[\s\S]+\.rig-body-loop/);
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
  assert.match(html,/teacher-system\.js\?v=\d+\.\d+\.\d+/);
  assert.match(sw,/teacher-system\.js\?v=\d+\.\d+\.\d+/);
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
    assert.match(spoken[0].text,/אמילי/);
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

test('Emily uses the supplied portrait consistently and offline',()=>{
  const asset=path.join(root,'assets','teacher-noa.png');
  assert.ok(fs.existsSync(asset));
  assert.ok(fs.statSync(asset).size>100000);
  assert.match(System.portraitMarkup(System.byId('female-young')),/assets\/teacher-noa\.png/);
  assert.match(sw,/\.\/assets\/teacher-noa\.png/);
});

test('preview screen exposes names, descriptions, matching previews and explicit controls',()=>{
  const markup=System.selectionMarkup('female-young','he');
  assert.match(markup,/אמילי – מורה/);
  assert.match(markup,/אדם – מורה/);
  assert.match(markup,/data-teacher-preview="female-young"/);
  assert.match(markup,/data-teacher-choice="male-young"/);
  assert.equal(System.byId('female-young').previewHe,'שלום, אני אמילי. אני שמחה ללמוד איתך אנגלית!');
  assert.equal(System.byId('male-young').previewHe,'שלום, אני אדם. אני שמח ללמוד איתך אנגלית!');
  assert.match(markup,/assets\/teacher-adam\.png/);
  assert.match(markup,/assets\/teacher-noa\.png/);
});

test('Hebrew state grammar follows the selected teacher gender',()=>{
  assert.equal(Visual.GENDER_LABELS.female.listening,'אמילי מקשיבה');
  assert.equal(Visual.GENDER_LABELS.male.listening,'אדם מקשיב');
  assert.equal(Visual.GENDER_LABELS.female.idle,'אמילי מוכנה');
  assert.equal(Visual.GENDER_LABELS.male.idle,'אדם מוכן');
});
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
    assert.match(markup,/class="[^"]*\brig-body\b[^"]*"[^>]*src=/);
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

test('central TeacherController exposes the complete living-teacher state contract',()=>{
  assert.equal(typeof Rig.TeacherController,'function');
  assert.deepEqual(Rig.STATES,['idle','speak','listen','think','point','wave','celebrate','goodbye']);
  for(const gesture of ['wave','point-left','point-right','thumbs-up','open-hands','heart-hands','clap','thinking-pose'])assert.ok(Rig.GESTURES.includes(gesture),gesture);
  const source=fs.readFileSync(path.join(root,'teacher-rig.js'),'utf8');
  assert.match(source,/scheduleMotion\(delay=randomBetween/);
  assert.match(source,/document\.addEventListener\('visibilitychange'/);
  assert.match(source,/getMetrics\(\)/);
  assert.doesNotMatch(source,/setInterval\([^)]*showMouth/);
});

test('living teacher motion remains subtle and accessible on mobile',()=>{
  const css=fs.readFileSync(path.join(root,'teacher-rig.css'),'utf8');
  for(const motion of ['breathe','blink','gaze-left','gaze-right','head-left','head-right','listen-nod','happy-bounce'])assert.match(css,new RegExp(`data-motion="${motion}"`));
  for(const gesture of ['wave','point-left','point-right','thumbs-up','open-hands','heart-hands','clap','thinking-pose'])assert.match(css,new RegExp(`data-gesture="${gesture}"`));
  assert.match(css,/max-width:600px/);
  assert.match(css,/prefers-reduced-motion:reduce/);
});

test('each teacher has a calibrated lip anchor and speaking never stacks a second face',()=>{
  assert.notDeepEqual(Rig.GEOMETRY['female-young'].mouthBox,Rig.GEOMETRY['male-young'].mouthBox);
  for(const geometry of Object.values(Rig.GEOMETRY)){
    const [x,y,width,height]=geometry.mouthBox;
    assert.ok(x>=42&&x<=46,`${geometry.key} lip x`);
    assert.ok(y>=10&&y<=17,`${geometry.key} lip y`);
    assert.ok(width<=12&&height<=4,`${geometry.key} lip size`);
  }
  const rigCss=fs.readFileSync(path.join(root,'teacher-rig.css'),'utf8');
  assert.match(rigCss,/\.teacher-presence-rig\.mouth-active \.rig-expression\{display:none!important\}/);
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
  assert.match(html,/teacher-rig\.css\?v=\d+\.\d+\.\d+/);
  assert.match(html,/teacher-visual\.js\?v=\d+\.\d+\.\d+[\s\S]*teacher-rig\.js\?v=\d+\.\d+\.\d+[\s\S]*teacher-system\.js\?v=\d+\.\d+\.\d+/);
});

test('both teachers have local seamless idle video loops with safe fallbacks',()=>{
  for(const teacher of ['noa','adam']){
    const file=`teacher-${teacher}-idle-loop-v1.webp`,bytes=fs.readFileSync(path.join(root,'assets',file));
    assert.equal(bytes.subarray(0,4).toString(),'RIFF');
    assert.equal(bytes.subarray(8,12).toString(),'WEBP');
    assert.ok(bytes.includes(Buffer.from('ANIM')),`${teacher} loop is animated`);
    assert.match(sw,new RegExp(`assets/${file.replace('.','\\.')}`));
  }
  const female=Rig.rigMarkup('female-young'),male=Rig.rigMarkup('male-young');
  assert.match(female,/rig-body-loop[^>]+teacher-noa-idle-loop-v1\.webp/);
  assert.match(male,/rig-body-loop[^>]+teacher-adam-idle-loop-v1\.webp/);
  const css=fs.readFileSync(path.join(root,'teacher-rig.css'),'utf8');
  assert.match(css,/mouth-active \.rig-body-loop\{opacity:0\}/);
  assert.match(css,/prefers-reduced-motion:reduce[\s\S]+\.rig-body-loop/);
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
  assert.match(html,/teacher-system\.js\?v=\d+\.\d+\.\d+/);
  assert.match(sw,/teacher-system\.js\?v=\d+\.\d+\.\d+/);
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
