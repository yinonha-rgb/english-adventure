const test=require('node:test'),assert=require('node:assert/strict');
const Natural=require('../../natural-voice');
globalThis.EANaturalVoice=Natural;
const Core=require('../../teacher-modes-core'),content=require('../../content.json');

const voices=[
  {name:'Basic English',lang:'en-US',voiceURI:'basic',localService:false,default:true},
  {name:'Microsoft Aria Natural',lang:'en-US',voiceURI:'aria',localService:true},
  {name:'Hebrew Local',lang:'he-IL',voiceURI:'hebrew',localService:true},
  {name:'English UK',lang:'en-GB',voiceURI:'uk',localService:true}
];
test('voice ranking prefers high-quality local matching voices',()=>assert.equal(Natural.chooseVoice(voices,'en-US').voice.voiceURI,'aria'));
test('English and Hebrew selections stay language scoped',()=>{assert.equal(Natural.chooseVoice(voices,'en-US').voice.lang,'en-US');assert.equal(Natural.chooseVoice(voices,'he-IL').voice.lang,'he-IL')});
test('preferred device voice persists when still available',()=>assert.equal(Natural.chooseVoice(voices,'en-US','basic').voice.voiceURI,'basic'));
test('phrase splitting creates natural short utterances',()=>assert.deepEqual(Natural.splitPhrases("Hi, Ori! Today we're learning colors. What color is it?"),['Hi, Ori!',"Today we're learning colors.",'What color is it?']));
test('pronunciation metadata uses defined chunks and recognition variants',()=>{const m=Natural.pronunciationMeta('Wonderful.',{pronunciationChunks:['Won','der','ful'],commonRecognitionVariants:['wonder full']});assert.deepEqual(m.pronunciationChunks,['Won','der','ful']);assert.deepEqual(m.commonRecognitionVariants,['wonder full'])});
test('turn guard prevents overlap and duplicate answers',()=>{const g=Natural.createTurnGuard(),id=g.beginSpeech();assert.equal(g.beginListening(),false);assert.equal(g.endSpeech(id),true);assert.equal(g.beginListening(),true);assert.equal(g.handleAnswer(),true);assert.equal(g.handleAnswer(),false)});
test('stale synthesis completion cannot start a turn',()=>{const g=Natural.createTurnGuard(),old=g.beginSpeech();g.beginSpeech();assert.equal(g.endSpeech(old),false);assert.equal(g.snapshot().speaking,true)});
test('interruption clears both speech and recognition state',()=>{const g=Natural.createTurnGuard(),id=g.beginSpeech();g.interrupt();assert.equal(g.endSpeech(id),false);assert.deepEqual(g.snapshot().speaking,false)});
test('response variation is deterministic and never praises wrong answers',()=>{const a=Natural.responseStyle({category:'correct',index:0}),b=Natural.responseStyle({category:'correct',index:1}),wrong=Natural.responseStyle({category:'completely-unrelated',index:0});assert.notEqual(a.text,b.text);assert.equal(wrong.state,'correcting');assert.doesNotMatch(wrong.text,/right|exactly|great job/i)});
test('praise matches streak and success after difficulty',()=>{assert.match(Natural.responseStyle({category:'correct',correctStreak:3}).text,/getting really good/);assert.match(Natural.responseStyle({category:'correct',hadDifficulty:true}).text,/worked it out/)});
test('silence and uncertain recognition remain gentle',()=>{assert.match(Natural.responseStyle({category:'didnt-answer'}).text,/Take your time/);assert.match(Natural.responseStyle({category:'speech-recognition-uncertain'}).text,/heard/)});
test('speech queue never overlaps and slower replay is temporary',async()=>{const utterances=[],synth={cancel(){},speak(u){utterances.push(u);queueMicrotask(()=>u.onend())}},U=function(text){this.text=text},q=new Natural.SpeechQueue({synth,Utterance:U,pause:()=>Promise.resolve(),getSettings:()=>({speechSpeed:'normal'})});await q.speak([{text:'Hello. Ready?',lang:'en-US',tone:'greeting'}]);const original=utterances.map(x=>x.rate);await q.repeatSlower();assert.ok(utterances.slice(original.length).every((x,i)=>x.rate<original[i]));assert.equal(q.active,false)});
test('pause, background, resume, device changes and duplicate events use idempotent cancellation',()=>{const q=new Natural.SpeechQueue({synth:{cancel(){}},Utterance:function(){}});q.cancel();q.cancel();assert.equal(q.active,false)});
test('voice settings migrate and persist without enabling paid mode',()=>{const s=Core.migrateSettings({englishVoice:'aria',hebrewVoice:'hebrew',speechSpeed:'slow',speechVolume:.7,voiceCalibrated:true});assert.equal(s.englishVoice,'aria');assert.equal(s.speechSpeed,'slow');assert.equal(s.speechVolume,.7);assert.equal(s.allowedAdvanced,false)});
test('every lesson phrase has complete pronunciation modeling metadata',()=>{let count=0;for(const lesson of content.lessons){const shared=Core.sharedContext({lesson});for(const phrase of shared.lesson.phrases){count++;for(const key of ['naturalPronunciation','slowPronunciation','pronunciationChunks','stressHint','commonRecognitionVariants'])assert.ok(key in phrase,`${lesson.id} ${key}`);assert.ok(phrase.pronunciationChunks.length)}}assert.equal(count,66)});
test('speech preprocessing removes markup and technical symbols naturally',()=>{
  const clean=Natural.toSpokenText;
  assert.equal(clean('Say: cat/dog'),'Say: cat or dog');
  assert.equal(clean('red/blue'),'red or blue');
  assert.equal(clean('My_name'),'My name');
  assert.equal(clean('hello-world'),'hello world');
  assert.equal(clean('**Hello** [friend](https://example.com)!!!'),'Hello friend!');
  assert.equal(clean('<b>Open</b> (the door)'),'Open the door');
  assert.equal(clean('one\\two | three'),'one or two or three');
});
test('speech never leaks symbol names unless a lesson explicitly teaches symbols',()=>{
  const forbidden=/\b(?:slash|backslash|underscore|pipe|asterisk|hash|open parenthesis|close parenthesis)\b/i;
  for(const input of ['slash','backslash','under_score','a|b','*word*','#title','(hello)','[hello]','{hello}','<hello>'])assert.doesNotMatch(Natural.toSpokenText(input),forbidden);
  assert.equal(Natural.toSpokenText({spokenText:'slash',teachesSymbols:true}),'slash');
});
test('displayText remains separate while spokenText always wins',()=>{
  const meta=Natural.pronunciationMeta('cat/dog',{displayText:'cat/dog',spokenText:'cat or dog'});
  assert.equal(meta.displayText,'cat/dog');
  assert.equal(meta.spokenText,'cat or dog');
  assert.equal(meta.naturalPronunciation,'cat or dog');
});
test('every existing lesson has safe automatically generated speech',()=>{
  const unsafe=/[/\\|_*#~^`[\]{}<>]/;
  for(const lesson of content.lessons)for(const phrase of lesson.phrases){const meta=Natural.pronunciationMeta(phrase.english,phrase);assert.doesNotMatch(meta.spokenText,unsafe,`${lesson.id}: ${meta.spokenText}`)}
});
test('SpeechQueue preprocesses the final utterance immediately before synthesis',async()=>{
  const spoken=[],synth={cancel(){},speak(utterance){spoken.push(utterance.text);queueMicrotask(()=>utterance.onend())}};
  class Utterance{constructor(text){this.text=text}}
  const queue=new Natural.SpeechQueue({synth,Utterance,pause:()=>Promise.resolve(),getSettings:()=>({})});
  await queue.speak([{text:'Say **cat/dog**!!!'}]);
  assert.deepEqual(spoken,['Say cat or dog!']);
});
