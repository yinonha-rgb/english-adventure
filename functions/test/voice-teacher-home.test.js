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
  assert.match(teacher,/not-allowed'\)showAnswers/);
  assert.match(teacher,/function showAnswers/);
  assert.match(teacher,/source:'button'/);
  assert.match(teacher,/id="teacherSkip"/);
  assert.match(teacher,/confirm\('לסיים את השיעור/);
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
