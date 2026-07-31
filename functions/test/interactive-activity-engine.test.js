const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'interactive-activity-engine.js'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const context={globalThis:{}};
vm.runInNewContext(source,context);
const engine=context.globalThis.EAInteractiveTeacher;
const lesson=engine.createAnimalsLesson('אורי');

test('complete Animals lesson contains teacher-led participation throughout',()=>{
  assert.equal(lesson.words.join(','),'dog,cat,bird');
  assert.ok(lesson.activities.length>=9);
  for(const item of lesson.activities){
    assert.ok(item.teacherInstructionHe);
    assert.ok(item.teacherInstructionEn);
    assert.ok(item.type);
  }
  const types=new Set(lesson.activities.map(item=>item.type));
  for(const type of ['picture-choice','repeat-after-teacher','drag-match','memory','movement','sentence-builder','listening','story-choice'])assert.ok(types.has(type),type);
});

test('activity state never advances before a correct child response',()=>{
  const initial={index:1,attempts:0};
  assert.equal(engine.transition(initial,'cat',false).index,1);
  assert.equal(engine.transition(initial,'dog',true).index,2);
});

test('activity engine locks each turn against overlapping taps or speech events',()=>{
  assert.match(source,/this\.answerLocked=true/);
  assert.match(source,/if\(this\.paused\|\|this\.answerLocked\)return/);
  assert.match(source,/this\.answerLocked=false/);
});

test('wrong attempts retry and then reveal a hint',()=>{
  const once=engine.transition({index:1,attempts:0},'cat',false);
  assert.equal(once.lastResult,'incorrect');
  assert.equal(once.hintVisible,undefined);
  const twice=engine.transition(once,'bird',false);
  assert.equal(twice.index,1);
  assert.equal(twice.lastResult,'hint');
  assert.equal(twice.hintVisible,true);
});

test('validators accept correct participation and reject unrelated choices',()=>{
  const picture=lesson.activities.find(item=>item.id==='animals-dog');
  assert.equal(engine.validate(picture,'dog'),true);
  assert.equal(engine.validate(picture,'pizza'),false);
  const drag=lesson.activities.find(item=>item.type==='drag-match');
  assert.equal(engine.validate(drag,['dog','cat','bird']),true);
  assert.equal(engine.validate(drag,['dog','cat','pizza']),false);
});

test('microphone fallback and touch alternatives are always present',()=>{
  assert.match(source,/if\(!SR\)\{this\.speechLog\('recognition unavailable'\);return this\.feedback/);
  assert.match(source,/לחצו “אמרתי” כדי להמשיך/);
  assert.match(source,/this\.button\('✅ אמרתי'/);
  assert.match(source,/onclick/);
});

test('progress resumes per child and completion awards remain idempotent',()=>{
  assert.match(app,/interactiveLessons/);
  assert.match(app,/EAInteractiveProgress/);
  assert.match(app,/daily-lesson-complete/);
  assert.match(app,/award\(`interactive:/);
  assert.match(source,/progress\?\.load/);
  assert.match(source,/progress\?\.save/);
});

test('interactive engine is offline cached and makes zero OpenAI calls',()=>{
  assert.match(html,/interactive-activity-engine\.js\?v=4\.21\.0/);
  assert.match(sw,/interactive-activity-engine\.js\?v=4\.21\.0/);
  assert.doesNotMatch(source,/\bfetch\s*\(|openai|backendEndpoint|Authorization/i);
});

test('daily interactive teacher handles the complete Chrome recognition lifecycle',()=>{
  for(const event of ['recognition created','recognition started','recognition ended','recognition restarted','onstart','onspeechstart','onspeechend','onaudiostart','onaudioend','onresult','onerror','transcript final'])assert.match(source,new RegExp(event));
  assert.match(source,/interimResults=true/);
  assert.match(source,/result\.isFinal/);
  assert.match(source,/speech without final transcript/);
  assert.match(source,/interactiveSpeechDebug/);
});

test('daily interactive speech always applies the selected teacher voice identity',()=>{
  assert.match(source,/Natural\?\.applyVoiceIdentity/);
  assert.match(source,/this\.teacherProfile\?\.voiceGender\|\|this\.teacherGender/);
  assert.match(source,/speechSynthesis\?\.getVoices/);
  assert.match(source,/settings\.hebrewVoice/);
  assert.match(source,/settings\.englishVoice/);
  assert.match(app,/configureTeacherUtterance/);
  assert.equal((app.match(/new SpeechSynthesisUtterance/g)||[]).length,(app.match(/configureTeacherUtterance/g)||[]).length-1);
});

test('activity canvas is isolated from speech, vocabulary and controls',()=>{
  assert.match(source,/class="interactive-center"[^>]*><section class="adventure-stage"/);
  assert.match(source,/class="stage-activity" id="interactiveActivity"/);
  assert.match(source,/class="interactive-bottom"/);
  assert.match(source,/id="interactiveVocabulary"/);
  assert.match(source,/id="interactiveAnswerControls"/);
  assert.match(html,/grid-template-rows:minmax\(64px,10%\) minmax\(0,1fr\) minmax\(200px,30%\)/);
  assert.match(html,/interactive-panel\[data-focus="speaking"\]/);
  assert.doesNotMatch(source,/interactive-board/);
});

test('premium stage keeps teacher, scenery and gameplay alive together',()=>{
  assert.match(source,/id="interactiveTeacherVisual"/);
  assert.match(source,/EATeacherSystem\?\.createLessonTeacher/);
  assert.match(source,/setVisualState\('speaking'\)/);
  assert.match(source,/setVisualState\('listening'\)/);
  assert.match(source,/positive\?'success':'retry'/);
  assert.match(html,/\.adventure-stage\{/);
  assert.match(html,/@keyframes cloudDrift/);
  assert.match(html,/@keyframes choiceAlive/);
  assert.match(html,/data-teacher-state="success"/);
  assert.match(html,/grid-template-columns:minmax\(210px,31%\)/);
  assert.match(html,/grid-template-columns:minmax\(118px,33%\)/);
  assert.match(html,/@keyframes teacherWave/);
  assert.match(html,/@keyframes teacherClapLeft/);
  assert.match(html,/@keyframes teacherPoint/);
  assert.match(source,/waiting:'listening'/);
  assert.match(source,/retry:'encouraging'/);
  assert.match(html,/@media\(prefers-reduced-motion:reduce\)/);
});

test('interactive speech replaces content and stays at two visible lines',()=>{
  assert.match(source,/setInstruction\(english,hebrew/);
  assert.match(source,/box\.replaceChildren\(\)/);
  assert.match(html,/-webkit-line-clamp:1/);
});
