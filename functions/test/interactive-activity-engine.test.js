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
const teacher=fs.readFileSync(path.join(root,'teacher-ai.js'),'utf8');
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
  assert.equal(engine.validate(picture,'כלב'),true);
  assert.equal(engine.validate(picture,'pizza'),false);
  const drag=lesson.activities.find(item=>item.type==='drag-match');
  assert.equal(engine.validate(drag,['dog','cat','bird']),true);
  assert.equal(engine.validate(drag,['dog','cat','pizza']),false);
});

test('every spoken animal answer accepts the matching Hebrew or English meaning',()=>{
  const cases=[['animals-dog','dog','כלב'],['animals-repeat-dog','dog','הכלב'],['animals-listen-cat','cat','חתול'],['animals-memory','cat','החתול'],['animals-final','bird','ציפור']];
  for(const [id,english,hebrew] of cases){const item=lesson.activities.find(activity=>activity.id===id);assert.equal(engine.validate(item,english),true,`${id} English`);assert.equal(engine.validate(item,hebrew),true,`${id} Hebrew`)}
  const sentence=lesson.activities.find(item=>item.id==='animals-sentence');
  assert.equal(engine.validate(sentence,'I like dogs'),true);
  assert.equal(engine.validate(sentence,'אני אוהבת כלבים'),true);
  assert.equal(engine.validate(sentence,'פיצה'),false);
});

test('Hebrew participation is reinforced with the expected English answer',()=>{
  assert.match(source,/Correct! In English, we say:/);
  assert.match(source,/Let's try in English\. Say:/);
  assert.match(source,/containsHebrew\(value\)/);
});

test('interactive completion speaks and focuses an explicit Finish action',()=>{
  assert.match(source,/השיעור הסתיים\. לחצו על סיום\./);
  assert.match(source,/id="interactiveHome" aria-label="סיום השיעור וחזרה למסך הבית">סיום ✓/);
  assert.match(source,/speakSegments\('השיעור הסתיים\. לחצו על סיום\.'/);
  assert.match(source,/querySelector\('#interactiveHome'\)\.focus\(\)/);
});

test('earned XP is large, gold and animated on every lesson completion screen',()=>{
  assert.match(source,/class="xp-reward" role="status"/);
  assert.match(app,/el\('p','xp-reward'/);
  assert.match(teacher,/function decorateTeacherAchievement\(\)/);
  assert.match(teacher,/reward\.className='xp-reward'/);
  assert.match(html,/\.xp-reward\{[\s\S]*font-size:clamp/);
  assert.match(html,/\.xp-reward\{[\s\S]*linear-gradient/);
  assert.match(html,/@keyframes xpRewardGrow/);
  assert.match(html,/@media\(prefers-reduced-motion:reduce\)\{\.xp-reward\{animation:none!important\}\}/);
});

test('drag matching renders dependable vector pictures instead of font-only emoji',()=>{
  for(const animal of ['dog','cat','bird']){
    const picture=engine.animalPicture(animal);
    assert.match(picture,/^<svg/);
    assert.match(picture,new RegExp(`<title>${animal}</title>`));
  }
  assert.match(source,/class="match-animal-svg"/);
  assert.match(source,/class="match-picture"/);
  assert.match(source,/role="img" aria-label=/);
});

test('drag matching supports desktop, touch and tap-to-match input',()=>{
  assert.match(source,/word\.draggable=true/);
  assert.match(source,/word\.onpointerdown=/);
  assert.match(source,/word\.onpointermove=/);
  assert.match(source,/word\.onpointerup=/);
  assert.match(source,/document\.elementFromPoint/);
  assert.match(source,/selectMatchWord\(value,word\)/);
  assert.match(source,/touch-action:none/);
  assert.match(source,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});

test('interactive daily lesson keeps an accessible countdown visible and pausable',()=>{
  assert.match(source,/id="interactiveTimer"/);
  assert.match(source,/this\.lessonRemainingSeconds=Number\(this\.state\.lessonRemainingSeconds\)\|\|600/);
  assert.match(source,/startLessonTimer\(\)/);
  assert.match(source,/if\(this\.paused\)\{this\.lessonTimerLast=Date\.now\(\);return\}/);
  assert.match(source,/זמן נותר בשיעור/);
  assert.match(source,/this\.stopLessonTimer\(\)/);
  assert.match(source,/\.interactive-timer\{/);
});

test('microphone fallback and touch alternatives are always present',()=>{
  assert.match(source,/if\(!SR\)\{this\.speechLog\('recognition unavailable'\);return this\.feedback/);
  assert.match(source,/const hebrewChoice=\(item\.acceptedAnswers\|\|\[\]\)\.find\(containsHebrew\)/);
  assert.match(source,/`🔤 \$\{item\.prompt\}/);
  assert.match(source,/onclick/);
});

test('repeat-after-teacher turns start listening automatically after speech ends',()=>{
  assert.match(source,/prepareMicrophone\(\)/);
  assert.match(source,/getUserMedia\(\{audio:true\}\)/);
  assert.match(source,/shouldAutoListen\(item\)/);
  assert.match(source,/automatic listening scheduled/);
  assert.match(source,/this\.listen\(\{automatic:true\}\)/);
  assert.match(source,/recognition started automatically/);
});

test('daily lesson greeting listens automatically and accepts spoken readiness',()=>{
  const welcome=lesson.activities.find(item=>item.type==='welcome');
  for(const answer of ['yes','ready','I am ready',"I'm ready","let's start",'okay']){
    assert.equal(engine.validate(welcome,answer),true,answer);
  }
  assert.equal(engine.validate(welcome,'banana'),false);
  for(const answer of ['כן','אני מוכן','אני מוכנה','אפשר להתחיל','קדימה'])assert.equal(engine.validate(welcome,answer),true,answer);
  assert.equal(engine.supportsVoiceAnswer(welcome),true);
  assert.match(source,/recognition\.lang=item\.type===TYPES\.WELCOME\?'he-IL':'en-US'/);
  assert.match(source,/camera did not prepare microphone/);
  assert.match(source,/error==='no-speech'&&retryAttempt<2/);
  assert.match(source,/recognition restart scheduled/);
  assert.match(source,/this\.autoListeningActivityId=null;[\s\S]*automatic listening scheduled/);
  assert.match(source,/automatic listening scheduled/);
  assert.match(source,/this\.listen\(\{automatic:true\}\)/);
});

test('every spoken question opens recognition instead of falling into the repeat timer',()=>{
  const voiceTypes=['welcome','picture-choice','repeat-after-teacher','memory','sentence-builder','listening','story-choice'];
  for(const type of voiceTypes)assert.equal(engine.supportsVoiceAnswer({type,id:`voice-${type}`}),true,type);
  for(const type of ['drag-match','movement'])assert.equal(engine.supportsVoiceAnswer({type,id:`manual-${type}`}),false,type);
  assert.match(source,/supportsVoiceAnswer\(item\)/);
  assert.match(source,/אמילי שואלת/);
  assert.match(source,/אמילי מקשיבה לתשובה/);
});

test('memory animals stay visible for a full preview after teacher speech',()=>{
  assert.match(source,/if\(item\.type===TYPES\.MEMORY\)\{this\.startMemoryPreview\(item\);return\}/);
  assert.match(source,/startMemoryPreview\(item\)\{/);
  assert.match(source,/החיות יוצגו במשך ארבע שניות/);
  assert.match(source,/cards\.forEach\(card=>\{card\.disabled=true;card\.classList\.remove\('hidden-card'\)/);
  assert.match(source,/cards\.forEach\(card=>\{card\.textContent='❓';card\.classList\.add\('hidden-card'\);card\.disabled=false/);
  assert.match(source,/\},4000\)/);
  assert.doesNotMatch(source,/setTimeout\(\(\)=>grid\.querySelectorAll\('button'\)/);
});

test('progress resumes per child and completion awards remain idempotent',()=>{
  assert.match(app,/interactiveLessons/);
  assert.match(app,/EAInteractiveProgress/);
  assert.match(app,/daily-lesson-complete/);
  assert.match(app,/award\(`interactive:/);
  assert.match(source,/progress\?\.load/);
  assert.match(source,/progress\?\.save/);
});

test('automatic voice listening is never interrupted by a prompt reminder timer',()=>{
  assert.doesNotMatch(source,/this\.timer=setTimeout\(\(\)=>this\.speakCurrent\([^\n]+14000/);
  assert.match(source,/reminder can never interrupt listening/);
  assert.match(source,/if\(this\.shouldAutoListen\(item\)\)[\s\S]*?this\.listen\(\{automatic:true\}\)[\s\S]*?\}else\{/);
});

test('automatic listening ignores synthesized-teacher echo without rejecting short child answers',()=>{
  assert.equal(engine.probableSpeechEcho('hello today we will learn animals','Hello! Today we will learn animals. Are you ready?',900),true);
  assert.equal(engine.probableSpeechEcho('yes','Are you ready?',900),false);
  assert.equal(engine.probableSpeechEcho('I am ready','I am ready to start our lesson',900),false);
  assert.equal(engine.probableSpeechEcho('dog','Please repeat dog',900,120),true);
  assert.equal(engine.probableSpeechEcho('dog','Please repeat dog',900,900),false);
  assert.equal(engine.probableSpeechEcho('hello today we will learn animals','Hello! Today we will learn animals.',5000),false);
  assert.match(source,/teacher echo ignored/);
  assert.match(source,/speechStartedAt-startedListeningAt/);
  assert.match(source,/\},750\)/);
  assert.match(source,/feedback\(retryText,false,\{speak:false\}\)/);
});

test('interactive engine is offline cached and makes zero OpenAI calls',()=>{
  assert.match(html,/interactive-activity-engine\.js\?v=4\.46\.9/);
  assert.match(sw,/interactive-activity-engine\.js\?v=4\.46\.9/);
  assert.equal([...html.matchAll(/interactive-activity-engine\.js\?v=/g)].length,1,'activity engine must load exactly once');
  assert.doesNotMatch(source,/\bfetch\s*\(|openai|backendEndpoint|Authorization/i);
});

test('daily interactive teacher handles the complete Chrome recognition lifecycle',()=>{
  for(const event of ['recognition created','recognition started','recognition ended','recognition restarted','onstart','onspeechstart','onspeechend','onaudiostart','onaudioend','onresult','onerror','transcript final'])assert.match(source,new RegExp(event));
  assert.match(source,/interimResults=true/);
  assert.match(source,/result\.isFinal/);
  assert.match(source,/speech without final transcript/);
  assert.match(source,/if\(text\.trim\(\)\)heardSpeech=true/);
  assert.match(source,/try\{recognition\.stop\(\)\}catch\{\}this\.answer\(finalTranscript\)/);
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
  assert.match(source,/id="interactiveDragon"/);
  assert.match(source,/id="interactiveCelebration"/);
  assert.match(source,/this\.visual\?\.gesture\?\.\('clap',1800\)/);
  assert.match(source,/dragon\.dataset\.state/);
  assert.match(source,/getMetrics\?\.\(\)/);
  assert.match(html,/@media\(prefers-reduced-motion:reduce\)/);
});

test('interactive speech replaces content and stays at two visible lines',()=>{
  assert.match(source,/setInstruction\(english,hebrew/);
  assert.match(source,/box\.replaceChildren\(\)/);
  assert.match(source,/en\.lang='en';en\.dir='ltr'/);
  assert.match(source,/he\.lang='he';he\.dir='rtl'/);
  assert.match(html,/interactive-speech strong\[lang="en"\]\{direction:ltr/);
  assert.match(html,/interactive-speech small\[lang="he"\]\{direction:rtl/);
  assert.match(html,/-webkit-line-clamp:1/);
});
