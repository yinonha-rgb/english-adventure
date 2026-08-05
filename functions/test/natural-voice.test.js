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
test('teacher gender uses explicit metadata and configurable preferences',()=>{
  const candidates=[
    {name:'Neutral A',gender:'male',lang:'en-US',localService:true},
    {name:'Neutral B',gender:'female',lang:'en-US',localService:true}
  ];
  assert.equal(Natural.chooseVoice(candidates,'en-US','','female').voice.name,'Neutral B');
  assert.equal(Natural.chooseVoice(candidates,'en-US','','male').voice.name,'Neutral A');
  assert.ok(Natural.VOICE_PREFERENCES.female.en.includes('Samantha'));
  assert.ok(Natural.VOICE_PREFERENCES.male.en.includes('Daniel'));
});
test('voice fallback is explicit when gender metadata is unavailable',()=>{
  const choice=Natural.chooseVoice([{name:'Unknown Local',lang:'he-IL',localService:true}],'he-IL','','female');
  assert.equal(choice.fallbackReason,'gender-unknown-pitch-adjusted');
  assert.ok(Natural.genderPitch('female',choice.actualGender)>1);
  assert.ok(Natural.genderPitch('male',choice.actualGender)<1);
});
test('an opposite-gender saved voice never overrides the selected teacher',()=>{
  const candidates=[
    {name:'Adam Voice',gender:'male',lang:'en-US',voiceURI:'adam',localService:true},
    {name:'Emily Voice',gender:'female',lang:'en-US',voiceURI:'noa',localService:true}
  ];
  assert.equal(Natural.chooseVoice(candidates,'en-US','adam','female').voice.voiceURI,'noa');
  assert.equal(Natural.chooseVoice(candidates,'en-US','noa','male').voice.voiceURI,'adam');
});
test('central utterance identity applies the selected teacher voice to direct speech paths',()=>{
  const candidates=[
    {name:'Microsoft Asaf',gender:'male',lang:'he-IL',voiceURI:'asaf',localService:true},
    {name:'Microsoft Hila',gender:'female',lang:'he-IL',voiceURI:'hila',localService:true}
  ],female={},male={};
  Natural.applyVoiceIdentity(female,{voices:candidates,lang:'he-IL',gender:'female',rate:.82});
  Natural.applyVoiceIdentity(male,{voices:candidates,lang:'he-IL',gender:'male',rate:.82});
  assert.equal(female.voice.voiceURI,'hila');
  assert.equal(male.voice.voiceURI,'asaf');
  assert.ok(female.pitch>1);
  assert.ok(male.pitch<1);
});
test('an explicitly male-only fallback is strongly corrected for the female teacher',()=>{
  const utterance={},choice=Natural.applyVoiceIdentity(utterance,{voices:[{name:'Microsoft Asaf',gender:'male',lang:'he-IL',voiceURI:'asaf'}],lang:'he-IL',gender:'female'});
  assert.equal(choice.actualGender,'male');
  assert.ok(utterance.pitch>=1.2);
});
test('speech queue keeps female and male voices audibly distinct when browser gender is unknown',async()=>{
  const utterances=[],synth={cancel(){},speak(u){utterances.push(u);queueMicrotask(()=>u.onend())}},U=function(text){this.text=text};
  const speakFor=async teacherVoiceGender=>{const q=new Natural.SpeechQueue({synth,Utterance:U,pause:()=>Promise.resolve(),getSettings:()=>({teacherVoiceGender})});q.setVoices([{name:'Hebrew Local',lang:'he-IL',voiceURI:'he',localService:true}]);await q.speak([{text:'שלום',lang:'he-IL'}]);return utterances.at(-1)};
  const female=await speakFor('female'),male=await speakFor('male');
  assert.ok(female.pitch>1.1);
  assert.ok(male.pitch<.9);
  assert.equal(female.voice.voiceURI,'he');
  assert.equal(male.voice.voiceURI,'he');
});
test('preferred device voice persists when still available',()=>assert.equal(Natural.chooseVoice(voices,'en-US','basic').voice.voiceURI,'basic'));
test('phrase splitting creates natural short utterances',()=>assert.deepEqual(Natural.splitPhrases("Hi, Ori! Today we're learning colors. What color is it?"),['Hi, Ori!',"Today we're learning colors.",'What color is it?']));
test('pronunciation metadata uses defined chunks and recognition variants',()=>{const m=Natural.pronunciationMeta('Wonderful.',{pronunciationChunks:['Won','der','ful'],commonRecognitionVariants:['wonder full']});assert.deepEqual(m.pronunciationChunks,['Won','der','ful']);assert.deepEqual(m.commonRecognitionVariants,['wonder full'])});
test('turn guard prevents overlap and duplicate answers',()=>{const g=Natural.createTurnGuard(),id=g.beginSpeech();assert.equal(g.beginListening(),false);assert.equal(g.endSpeech(id),true);assert.equal(g.beginListening(),true);assert.equal(g.handleAnswer(),true);assert.equal(g.handleAnswer(),false)});
test('stale synthesis completion cannot start a turn',()=>{const g=Natural.createTurnGuard(),old=g.beginSpeech();g.beginSpeech();assert.equal(g.endSpeech(old),false);assert.equal(g.snapshot().speaking,true)});
test('interruption clears both speech and recognition state',()=>{const g=Natural.createTurnGuard(),id=g.beginSpeech();g.interrupt();assert.equal(g.endSpeech(id),false);assert.deepEqual(g.snapshot().speaking,false)});
test('final recognition transcript always wins over interim text',()=>{
  assert.deepEqual(Natural.finalizeRecognitionResult({finalTranscript:'red',interimTranscript:'read',heardSpeech:true,finalConfidence:.91,interimConfidence:.45}),{text:'red',confidence:.91,fallback:false});
});
test('Chrome interim transcript is safely promoted when speech was actually heard',()=>{
  const result=Natural.finalizeRecognitionResult({interimTranscript:'the color is red',heardSpeech:true,interimConfidence:.61});
  assert.equal(result.text,'the color is red');
  assert.equal(result.fallback,true);
  assert.ok(result.confidence>=.72);
});
test('noise or an interim result without detected speech is never treated as an answer',()=>{
  assert.deepEqual(Natural.finalizeRecognitionResult({interimTranscript:'background noise',heardSpeech:false,interimConfidence:.8}),{text:'',confidence:0,fallback:false});
});
test('response variation is deterministic and never praises wrong answers',()=>{const a=Natural.responseStyle({category:'correct',index:0}),b=Natural.responseStyle({category:'correct',index:1}),wrong=Natural.responseStyle({category:'completely-unrelated',index:0});assert.notEqual(a.text,b.text);assert.equal(wrong.state,'correcting');assert.doesNotMatch(wrong.text,/right|exactly|great job/i)});
test('praise matches streak and success after difficulty',()=>{assert.match(Natural.responseStyle({category:'correct',correctStreak:3}).text,/getting really good/);assert.match(Natural.responseStyle({category:'correct',hadDifficulty:true}).text,/worked it out/)});
test('silence and uncertain recognition remain gentle',()=>{assert.match(Natural.responseStyle({category:'didnt-answer'}).text,/Take your time/);assert.match(Natural.responseStyle({category:'speech-recognition-uncertain'}).text,/heard/)});
test('speech queue never overlaps and slower replay is temporary',async()=>{const utterances=[],synth={cancel(){},speak(u){utterances.push(u);queueMicrotask(()=>u.onend())}},U=function(text){this.text=text},q=new Natural.SpeechQueue({synth,Utterance:U,pause:()=>Promise.resolve(),getSettings:()=>({speechSpeed:'normal'})});await q.speak([{text:'Hello. Ready?',lang:'en-US',tone:'greeting'}]);const original=utterances.map(x=>x.rate);await q.repeatSlower();assert.ok(utterances.slice(original.length).every((x,i)=>x.rate<original[i]));assert.equal(q.active,false)});
test('pause, background, resume, device changes and duplicate events use idempotent cancellation',()=>{const q=new Natural.SpeechQueue({synth:{cancel(){}},Utterance:function(){}});q.cancel();q.cancel();assert.equal(q.active,false)});
test('voice settings migrate and persist without enabling paid mode',()=>{const s=Core.migrateSettings({englishVoice:'aria',hebrewVoice:'hebrew',voiceTeacherId:'female-young',speechSpeed:'slow',speechVolume:.7,voiceCalibrated:true});assert.equal(s.englishVoice,'aria');assert.equal(s.voiceTeacherId,'female-young');assert.equal(s.speechSpeed,'slow');assert.equal(s.speechVolume,.7);assert.equal(s.allowedAdvanced,false)});
test('every lesson phrase has complete pronunciation modeling metadata',()=>{let count=0;for(const lesson of content.lessons){const shared=Core.sharedContext({lesson});for(const phrase of shared.lesson.phrases){count++;for(const key of ['naturalPronunciation','slowPronunciation','pronunciationChunks','stressHint','commonRecognitionVariants'])assert.ok(key in phrase,`${lesson.id} ${key}`);assert.ok(phrase.pronunciationChunks.length)}}assert.equal(count,66)});
test('speech preprocessing removes markup and technical symbols naturally',()=>{
  const clean=Natural.normalizeTextForSpeech;
  assert.equal(clean('Say: cat/dog','en-US'),'Say: cat, dog');
  assert.equal(clean('red/blue','en-US'),'red, blue');
  assert.equal(clean('My_name'),'My name');
  assert.equal(clean('hello-world'),'hello world');
  assert.equal(clean('**Hello** [friend](https://example.com)!!!'),'Hello friend!');
  assert.equal(clean('<b>Open</b> (the door)'),'Open the door');
  assert.equal(clean('one\\two | three'),'one, two, three');
});
test('central speech normalization handles slash, markup, URLs and backslash',()=>{
  const clean=Natural.normalizeTextForSpeech;
  const bilingual=clean('Dog / כלב');
  assert.doesNotMatch(bilingual,/slash|\//i);
  assert.match(bilingual,/Dog/);
  assert.match(bilingual,/כלב/);
  assert.equal(clean('cat/dog/bird','en-US'),'cat, dog, bird');
  assert.equal(clean('<strong>Dog</strong>','en-US'),'Dog');
  assert.equal(clean('https://example.com','en-US'),'');
  assert.doesNotMatch(clean('Listen \\ הקשב'),/backslash|\\/i);
});
test('bilingual speech is split into language-specific voice segments',()=>{
  assert.deepEqual(Natural.splitSpeechSegments('Dog / כלב','en-US'),[
    {text:'Dog,',lang:'en-US'},
    {text:'כלב.',lang:'he-IL'}
  ]);
  assert.deepEqual(Natural.splitSpeechSegments('Listen \\ הקשב','en-US').map(x=>x.lang),['en-US','he-IL']);
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
  assert.deepEqual(spoken,['Say cat, dog!']);
});
test('every production SpeechSynthesis utterance passes through the central normalizer',()=>{
  const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'../..');
  for(const file of ['app.js','teacher-ai.js','interactive-activity-engine.js','natural-voice.js']){
    const source=fs.readFileSync(path.join(root,file),'utf8');
    const constructors=[...source.matchAll(/new (?:window\.)?SpeechSynthesisUtterance\(([^)]*)\)|new this\.Utterance\(([^)]*)\)/g)];
    if(!constructors.length)continue;
    for(const match of constructors){
      const argument=(match[1]||match[2]||'').trim();
      assert.match(argument,/speechText/,`${file} bypasses normalizeTextForSpeech: ${match[0]}`);
    }
  }
});
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
test('teacher gender uses explicit metadata and configurable preferences',()=>{
  const candidates=[
    {name:'Neutral A',gender:'male',lang:'en-US',localService:true},
    {name:'Neutral B',gender:'female',lang:'en-US',localService:true}
  ];
  assert.equal(Natural.chooseVoice(candidates,'en-US','','female').voice.name,'Neutral B');
  assert.equal(Natural.chooseVoice(candidates,'en-US','','male').voice.name,'Neutral A');
  assert.ok(Natural.VOICE_PREFERENCES.female.en.includes('Samantha'));
  assert.ok(Natural.VOICE_PREFERENCES.male.en.includes('Daniel'));
});
test('voice fallback is explicit when gender metadata is unavailable',()=>{
  const choice=Natural.chooseVoice([{name:'Unknown Local',lang:'he-IL',localService:true}],'he-IL','','female');
  assert.equal(choice.fallbackReason,'gender-unknown-pitch-adjusted');
  assert.ok(Natural.genderPitch('female',choice.actualGender)>1);
  assert.ok(Natural.genderPitch('male',choice.actualGender)<1);
});
test('an opposite-gender saved voice never overrides the selected teacher',()=>{
  const candidates=[
    {name:'Adam Voice',gender:'male',lang:'en-US',voiceURI:'adam',localService:true},
    {name:'Noa Voice',gender:'female',lang:'en-US',voiceURI:'noa',localService:true}
  ];
  assert.equal(Natural.chooseVoice(candidates,'en-US','adam','female').voice.voiceURI,'noa');
  assert.equal(Natural.chooseVoice(candidates,'en-US','noa','male').voice.voiceURI,'adam');
});
test('central utterance identity applies the selected teacher voice to direct speech paths',()=>{
  const candidates=[
    {name:'Microsoft Asaf',gender:'male',lang:'he-IL',voiceURI:'asaf',localService:true},
    {name:'Microsoft Hila',gender:'female',lang:'he-IL',voiceURI:'hila',localService:true}
  ],female={},male={};
  Natural.applyVoiceIdentity(female,{voices:candidates,lang:'he-IL',gender:'female',rate:.82});
  Natural.applyVoiceIdentity(male,{voices:candidates,lang:'he-IL',gender:'male',rate:.82});
  assert.equal(female.voice.voiceURI,'hila');
  assert.equal(male.voice.voiceURI,'asaf');
  assert.ok(female.pitch>1);
  assert.ok(male.pitch<1);
});
test('an explicitly male-only fallback is strongly corrected for the female teacher',()=>{
  const utterance={},choice=Natural.applyVoiceIdentity(utterance,{voices:[{name:'Microsoft Asaf',gender:'male',lang:'he-IL',voiceURI:'asaf'}],lang:'he-IL',gender:'female'});
  assert.equal(choice.actualGender,'male');
  assert.ok(utterance.pitch>=1.2);
});
test('speech queue keeps female and male voices audibly distinct when browser gender is unknown',async()=>{
  const utterances=[],synth={cancel(){},speak(u){utterances.push(u);queueMicrotask(()=>u.onend())}},U=function(text){this.text=text};
  const speakFor=async teacherVoiceGender=>{const q=new Natural.SpeechQueue({synth,Utterance:U,pause:()=>Promise.resolve(),getSettings:()=>({teacherVoiceGender})});q.setVoices([{name:'Hebrew Local',lang:'he-IL',voiceURI:'he',localService:true}]);await q.speak([{text:'שלום',lang:'he-IL'}]);return utterances.at(-1)};
  const female=await speakFor('female'),male=await speakFor('male');
  assert.ok(female.pitch>1.1);
  assert.ok(male.pitch<.9);
  assert.equal(female.voice.voiceURI,'he');
  assert.equal(male.voice.voiceURI,'he');
});
test('preferred device voice persists when still available',()=>assert.equal(Natural.chooseVoice(voices,'en-US','basic').voice.voiceURI,'basic'));
test('phrase splitting creates natural short utterances',()=>assert.deepEqual(Natural.splitPhrases("Hi, Ori! Today we're learning colors. What color is it?"),['Hi, Ori!',"Today we're learning colors.",'What color is it?']));
test('pronunciation metadata uses defined chunks and recognition variants',()=>{const m=Natural.pronunciationMeta('Wonderful.',{pronunciationChunks:['Won','der','ful'],commonRecognitionVariants:['wonder full']});assert.deepEqual(m.pronunciationChunks,['Won','der','ful']);assert.deepEqual(m.commonRecognitionVariants,['wonder full'])});
test('turn guard prevents overlap and duplicate answers',()=>{const g=Natural.createTurnGuard(),id=g.beginSpeech();assert.equal(g.beginListening(),false);assert.equal(g.endSpeech(id),true);assert.equal(g.beginListening(),true);assert.equal(g.handleAnswer(),true);assert.equal(g.handleAnswer(),false)});
test('stale synthesis completion cannot start a turn',()=>{const g=Natural.createTurnGuard(),old=g.beginSpeech();g.beginSpeech();assert.equal(g.endSpeech(old),false);assert.equal(g.snapshot().speaking,true)});
test('interruption clears both speech and recognition state',()=>{const g=Natural.createTurnGuard(),id=g.beginSpeech();g.interrupt();assert.equal(g.endSpeech(id),false);assert.deepEqual(g.snapshot().speaking,false)});
test('final recognition transcript always wins over interim text',()=>{
  assert.deepEqual(Natural.finalizeRecognitionResult({finalTranscript:'red',interimTranscript:'read',heardSpeech:true,finalConfidence:.91,interimConfidence:.45}),{text:'red',confidence:.91,fallback:false});
});
test('Chrome interim transcript is safely promoted when speech was actually heard',()=>{
  const result=Natural.finalizeRecognitionResult({interimTranscript:'the color is red',heardSpeech:true,interimConfidence:.61});
  assert.equal(result.text,'the color is red');
  assert.equal(result.fallback,true);
  assert.ok(result.confidence>=.72);
});
test('noise or an interim result without detected speech is never treated as an answer',()=>{
  assert.deepEqual(Natural.finalizeRecognitionResult({interimTranscript:'background noise',heardSpeech:false,interimConfidence:.8}),{text:'',confidence:0,fallback:false});
});
test('response variation is deterministic and never praises wrong answers',()=>{const a=Natural.responseStyle({category:'correct',index:0}),b=Natural.responseStyle({category:'correct',index:1}),wrong=Natural.responseStyle({category:'completely-unrelated',index:0});assert.notEqual(a.text,b.text);assert.equal(wrong.state,'correcting');assert.doesNotMatch(wrong.text,/right|exactly|great job/i)});
test('praise matches streak and success after difficulty',()=>{assert.match(Natural.responseStyle({category:'correct',correctStreak:3}).text,/getting really good/);assert.match(Natural.responseStyle({category:'correct',hadDifficulty:true}).text,/worked it out/)});
test('silence and uncertain recognition remain gentle',()=>{assert.match(Natural.responseStyle({category:'didnt-answer'}).text,/Take your time/);assert.match(Natural.responseStyle({category:'speech-recognition-uncertain'}).text,/heard/)});
test('speech queue never overlaps and slower replay is temporary',async()=>{const utterances=[],synth={cancel(){},speak(u){utterances.push(u);queueMicrotask(()=>u.onend())}},U=function(text){this.text=text},q=new Natural.SpeechQueue({synth,Utterance:U,pause:()=>Promise.resolve(),getSettings:()=>({speechSpeed:'normal'})});await q.speak([{text:'Hello. Ready?',lang:'en-US',tone:'greeting'}]);const original=utterances.map(x=>x.rate);await q.repeatSlower();assert.ok(utterances.slice(original.length).every((x,i)=>x.rate<original[i]));assert.equal(q.active,false)});
test('pause, background, resume, device changes and duplicate events use idempotent cancellation',()=>{const q=new Natural.SpeechQueue({synth:{cancel(){}},Utterance:function(){}});q.cancel();q.cancel();assert.equal(q.active,false)});
test('voice settings migrate and persist without enabling paid mode',()=>{const s=Core.migrateSettings({englishVoice:'aria',hebrewVoice:'hebrew',voiceTeacherId:'female-young',speechSpeed:'slow',speechVolume:.7,voiceCalibrated:true});assert.equal(s.englishVoice,'aria');assert.equal(s.voiceTeacherId,'female-young');assert.equal(s.speechSpeed,'slow');assert.equal(s.speechVolume,.7);assert.equal(s.allowedAdvanced,false)});
test('every lesson phrase has complete pronunciation modeling metadata',()=>{let count=0;for(const lesson of content.lessons){const shared=Core.sharedContext({lesson});for(const phrase of shared.lesson.phrases){count++;for(const key of ['naturalPronunciation','slowPronunciation','pronunciationChunks','stressHint','commonRecognitionVariants'])assert.ok(key in phrase,`${lesson.id} ${key}`);assert.ok(phrase.pronunciationChunks.length)}}assert.equal(count,66)});
test('speech preprocessing removes markup and technical symbols naturally',()=>{
  const clean=Natural.normalizeTextForSpeech;
  assert.equal(clean('Say: cat/dog','en-US'),'Say: cat, dog');
  assert.equal(clean('red/blue','en-US'),'red, blue');
  assert.equal(clean('My_name'),'My name');
  assert.equal(clean('hello-world'),'hello world');
  assert.equal(clean('**Hello** [friend](https://example.com)!!!'),'Hello friend!');
  assert.equal(clean('<b>Open</b> (the door)'),'Open the door');
  assert.equal(clean('one\\two | three'),'one, two, three');
});
test('central speech normalization handles slash, markup, URLs and backslash',()=>{
  const clean=Natural.normalizeTextForSpeech;
  const bilingual=clean('Dog / כלב');
  assert.doesNotMatch(bilingual,/slash|\//i);
  assert.match(bilingual,/Dog/);
  assert.match(bilingual,/כלב/);
  assert.equal(clean('cat/dog/bird','en-US'),'cat, dog, bird');
  assert.equal(clean('<strong>Dog</strong>','en-US'),'Dog');
  assert.equal(clean('https://example.com','en-US'),'');
  assert.doesNotMatch(clean('Listen \\ הקשב'),/backslash|\\/i);
});
test('bilingual speech is split into language-specific voice segments',()=>{
  assert.deepEqual(Natural.splitSpeechSegments('Dog / כלב','en-US'),[
    {text:'Dog,',lang:'en-US'},
    {text:'כלב.',lang:'he-IL'}
  ]);
  assert.deepEqual(Natural.splitSpeechSegments('Listen \\ הקשב','en-US').map(x=>x.lang),['en-US','he-IL']);
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
  assert.deepEqual(spoken,['Say cat, dog!']);
});
test('every production SpeechSynthesis utterance passes through the central normalizer',()=>{
  const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'../..');
  for(const file of ['app.js','teacher-ai.js','interactive-activity-engine.js','natural-voice.js']){
    const source=fs.readFileSync(path.join(root,file),'utf8');
    const constructors=[...source.matchAll(/new (?:window\.)?SpeechSynthesisUtterance\(([^)]*)\)|new this\.Utterance\(([^)]*)\)/g)];
    if(!constructors.length)continue;
    for(const match of constructors){
      const argument=(match[1]||match[2]||'').trim();
      assert.match(argument,/speechText/,`${file} bypasses normalizeTextForSpeech: ${match[0]}`);
    }
  }
});
