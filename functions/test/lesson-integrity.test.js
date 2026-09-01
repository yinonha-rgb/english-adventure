const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'lesson-quiz-core.js'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const content=JSON.parse(fs.readFileSync(path.join(root,'content.json'),'utf8'));
const sandbox={window:{}};
vm.runInNewContext(source,sandbox);
const quiz=sandbox.window.EALessonQuiz;

test('legacy first-answer content is reordered without losing the correct mapping',()=>{
  const questions=content.lessons.flatMap(lesson=>lesson.quiz.map(question=>({lesson:lesson.id,question})));
  assert.ok(questions.length>20);
  for(const {lesson,question} of questions){
    const ordered=quiz.orderedChoices(question,`child|${lesson}|${question.id}`);
    assert.equal(ordered.length,question.options.length);
    assert.equal(ordered.filter(choice=>choice.correct).length,1);
    assert.notEqual(ordered[0].originalIndex,question.answer,`${lesson}:${question.id}`);
    assert.equal(ordered.find(choice=>choice.correct).english,question.options[question.answer]);
  }
});

test('quiz ordering is deterministic per child and lesson',()=>{
  const question=content.lessons[0].quiz[0];
  const first=quiz.orderedChoices(question,'child-a|lesson-a').map(choice=>choice.originalIndex);
  const repeated=quiz.orderedChoices(question,'child-a|lesson-a').map(choice=>choice.originalIndex);
  assert.deepEqual(first,repeated);
});

test('wrong answers retry once, then reveal; correct answers finish immediately',()=>{
  const plain=value=>JSON.parse(JSON.stringify(value));
  assert.deepEqual(plain(quiz.evaluateAttempt({correct:false,attempts:0,maxAttempts:2})),{correct:false,attempts:1,retry:true,reveal:false});
  assert.deepEqual(plain(quiz.evaluateAttempt({correct:false,attempts:1,maxAttempts:2})),{correct:false,attempts:2,retry:false,reveal:true});
  assert.deepEqual(plain(quiz.evaluateAttempt({correct:true,attempts:0,maxAttempts:2})),{correct:true,attempts:1,retry:false,reveal:false});
});

test('standard lessons award pronunciation XP only after validated microphone speech',()=>{
  assert.doesNotMatch(app,/award\(`speak:\$\{active\.id\}:\$\{step\}`/);
  assert.doesNotMatch(app,/award\(`phrase:\$\{active\.id\}:\$\{step\}`/);
  assert.doesNotMatch(app,/סיימתי את המשפט \+5 XP|Phrase complete \+5 XP/);
  assert.match(app,/if\(s>=75&&award\(`mic:/);
});

test('quiz integrity module loads before the app and is available offline',()=>{
  assert.match(html,/lesson-quiz-core\.js\?v=4\.51\.0[\s\S]*app\.js\?v=5\.3\.4/);
  assert.match(sw,/lesson-quiz-core\.js\?v=4\.51\.0/);
  assert.match(sw,/english-adventure-5\.4\.10/);
});
