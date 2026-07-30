const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'daily-lesson-core.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const translations=fs.readFileSync(path.join(root,'translations.js'),'utf8');
const context={globalThis:{}};
vm.runInNewContext(source,context);
const daily=context.globalThis.EADailyLesson;
const lessons=Array.from({length:7},(_,index)=>({
  id:`lesson-${index+1}`,
  title:`Lesson ${index+1}`,
  phrases:[{english:`word ${index+1}`,hebrew:`מילה ${index+1}`}],
  quiz:[{id:`q-${index+1}`,question:'Choose',options:['yes','no'],answer:0}]
}));
const profile=(id='child-a')=>({id,p:{xp:0,completed:[],mistakes:[],voiceReview:[],lessonHistory:[],dailyLessons:{}}});
const day=new Date('2026-07-30T10:00:00Z');

test('a prominent accessible daily lesson button is present on the home page',()=>{
  assert.match(html,/id="dailyLessonBtn"[^>]*data-i="startDailyLesson"/);
  assert.match(html,/class="primary daily-start"/);
  assert.match(html,/min-height:64px/);
  assert.match(translations,/Start Daily Lesson/);
  assert.match(translations,/התחל שיעור יומי/);
});

test('different children receive deterministic but potentially different recommendations',()=>{
  const ids=new Set(['child-a','child-b','child-c','child-d'].map(id=>
    daily.selectDailyLesson({profile:profile(id),lessons,date:day}).lesson.id));
  assert.ok(ids.size>1);
  const first=daily.selectDailyLesson({profile:profile('child-a'),lessons,date:day}).lesson.id;
  const second=daily.selectDailyLesson({profile:profile('child-a'),lessons,date:day}).lesson.id;
  assert.equal(first,second);
});

test('mastered and recently completed lessons are not unnecessarily recommended',()=>{
  const child=profile();
  child.p.completed=['lesson-1','lesson-2'];
  child.p.lessonHistory=[{lessonId:'lesson-3'}];
  const result=daily.selectDailyLesson({profile:child,lessons,date:day});
  assert.ok(!['lesson-1','lesson-2','lesson-3'].includes(result.lesson.id));
});

test('an unresolved mistake has priority over an in-progress or recommended lesson',()=>{
  const child=profile();
  child.p.mistakes=[{lesson:'lesson-6',qid:'q-6',count:2}];
  child.p.dailyLessons['2026-07-30']={lessonId:'lesson-3',status:'selected'};
  const result=daily.selectDailyLesson({profile:child,lessons,date:day});
  assert.equal(result.lesson.id,'lesson-6');
  assert.equal(result.reason,'unresolved-mistake');
});

test('selection and completion survive JSON persistence and daily credit is idempotent',()=>{
  const child=profile();
  const selected=daily.selectDailyLesson({profile:child,lessons,date:day});
  daily.rememberSelection(child.p,selected,day.getTime());
  const restored=JSON.parse(JSON.stringify(child));
  assert.equal(restored.p.dailyLessons['2026-07-30'].lessonId,selected.lesson.id);
  assert.equal(daily.completeDaily(restored.p,{day:'2026-07-30',lessonId:selected.lesson.id}).creditDue,true);
  assert.equal(daily.completeDaily(restored.p,{day:'2026-07-30',lessonId:selected.lesson.id}).creditDue,false);
});

test('daily flow is local-only, offline cached and independent of Advanced AI or OpenAI',()=>{
  assert.doesNotMatch(source,/\bfetch\s*\(|openai|teacher-ai/i);
  assert.match(sw,/daily-lesson-core\.js\?v=4\.10\.0/);
  assert.match(app,/startDailyLesson/);
  assert.match(app,/startLesson\(lesson\)/);
  assert.match(app,/daily-lesson-complete/);
});
