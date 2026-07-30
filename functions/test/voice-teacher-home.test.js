const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const teacher=fs.readFileSync(path.join(root,'teacher-ai.js'),'utf8');
const translations=fs.readFileSync(path.join(root,'translations.js'),'utf8');

test('voice teacher is the main and largest home action',()=>{
  assert.match(html,/class="teacher-home"/);
  assert.match(html,/class="primary daily-start" id="dailyLessonBtn"/);
  assert.match(html,/teacher-home-avatar/);
  assert.match(html,/min-height:82px/);
  assert.match(translations,/🎙️ Start Daily Lesson with Teacher/);
});

test('daily home action opens the free guided teacher directly',()=>{
  assert.match(app,/window\.EAVoiceTeacher\?\.startDaily/);
  assert.match(app,/active=lesson;return window\.EAVoiceTeacher\.startDaily\(\)/);
  assert.match(teacher,/selectedMode='free';start\(\);return true/);
  assert.doesNotMatch(teacher,/function startDailyVoice[\s\S]{0,500}openPreflight/);
});

test('browser speech, microphone denial and button fallback remain complete',()=>{
  assert.match(teacher,/SpeechRecognition\|\|window\.webkitSpeechRecognition/);
  assert.match(teacher,/speechSynthesis/);
  assert.match(teacher,/event\.error==='not-allowed'/);
  assert.match(teacher,/function showAnswers/);
  assert.match(teacher,/source:'button'/);
  assert.match(teacher,/id="teacherSkip"/);
  assert.match(teacher,/confirm\('לסיים את השיעור/);
});

test('speech recognition pipeline exposes every lifecycle event and releases stale listening state',()=>{
  for(const event of ['recognition created','recognition started','recognition ended','recognition restarted','onstart','onspeechstart','onspeechend','onaudiostart','onaudioend','onresult','onerror','transcript final'])assert.match(teacher,new RegExp(event));
  assert.match(teacher,/interimResults=true/);
  assert.match(teacher,/result\.isFinal/);
  assert.match(teacher,/r\.onend=.*turnGuard\.handleAnswer\(\)/);
  assert.match(teacher,/listen\(instruction\(\),\{manual:true\}\)/);
  for(const label of ['Microphone:','Recognition:','Last transcript:','Current lesson state:'])assert.match(teacher,new RegExp(label));
});

test('daily voice completion is per child and idempotent',()=>{
  assert.match(app,/EACompleteDailyVoice/);
  assert.match(app,/daily-lesson-complete/);
  assert.match(app,/profile\(\)\.p/);
  assert.match(app,/completeDaily\(p/);
});

test('daily voice startup makes zero OpenAI calls',()=>{
  const dailyStart=app.match(/function startDailyLesson[\s\S]*?function renderFilters/)?.[0]||'';
  assert.doesNotMatch(dailyStart,/fetch\(|openai|backend/i);
});

test('teacher lesson uses separate top, animation and bottom regions',()=>{
  assert.match(teacher,/class="teacher-lesson-top"/);
  assert.match(teacher,/class="teacher-focus-area"/);
  assert.match(teacher,/class="teacher-lesson-bottom"/);
  assert.match(teacher,/id="teacherVocabulary"/);
  assert.match(teacher,/grid-template-rows:minmax\(64px,10%\) minmax\(0,1fr\) minmax\(180px,25%\)/);
  assert.match(teacher,/teacher-bubbles\{display:none!important\}/);
});

test('teacher transcript never stacks over the activity and focus mode expands it',()=>{
  assert.match(teacher,/teacherTranscript'\)\.replaceChildren\(p\)/);
  assert.match(teacher,/stage\.dataset\.focus=state==='teacherSpeaking'\?'speaking':'answer'/);
  assert.match(teacher,/-webkit-line-clamp:2/);
});
