const test=require('node:test');
const assert=require('node:assert/strict');
const Providers=require('../../teacher-providers.js');

test('free teacher understands common Hebrew and English classroom intents locally',()=>{
  const cases=[
    ['חזור בבקשה','repeat'],
    ['יותר לאט','slower'],
    ['מה זה dog','explain'],
    ['אפשר רמז','hint'],
    ['אני לא יודעת','dont-know'],
    ['אני רוצה לנסות שוב','try-again'],
    ['אפשר הפסקה','break'],
    ['די להיום','stop'],
    ['אני מוכן','ready'],
    ['yes','yes'],
    ['לא','no'],
    ['hello','greeting'],
    ['שלום','greeting'],
    ['thank you','thanks'],
    ['תודה','thanks'],
    ['כיף לי','encouragement'],
    ['מה עושים עכשיו','instruction-question'],
    ['מה לומדים היום','lesson-topic-question'],
    ['אפשר לענות בעברית','language-choice-question']
  ];
  for(const [text,intent] of cases)assert.equal(Providers.conversationIntent(text).intent,intent,text);
});

test('Emily answers contextual child questions locally',()=>{
  for(const text of ['what should I do','what are we learning','can I answer in Hebrew']){
    assert.notEqual(Providers.conversationIntent(text).intent,Providers.CONVERSATION_INTENTS.ANSWER);
  }
});

test('ordinary and unrelated answers remain answers for deterministic validation',()=>{
  for(const text of ['dog','the animal is a cat','pizza','banana sounds funny']){
    assert.equal(Providers.conversationIntent(text).intent,Providers.CONVERSATION_INTENTS.ANSWER);
  }
});

test('social chat is acknowledged but never treated as a lesson answer',()=>{
  assert.equal(Providers.conversationIntent('hello').intent,Providers.CONVERSATION_INTENTS.GREETING);
  assert.equal(Providers.conversationIntent('thank you').intent,Providers.CONVERSATION_INTENTS.THANKS);
  assert.equal(Providers.conversationIntent('pizza').intent,Providers.CONVERSATION_INTENTS.ANSWER);
});

test('free provider emits intent events and never performs a network request',()=>{
  const events=[],provider=new Providers.FreeConversationProvider({onEvent:event=>events.push(event)});
  const result=provider.handleChildInput('repeat please',{lessonId:'animals'});
  assert.equal(result.intent,'repeat');
  assert.equal(events[0].type,'child-intent');
  assert.equal(provider.reportUsage().paidRequests,0);
});

test('recognition restart policy is bounded and only recovers an early empty stop',()=>{
  assert.equal(Providers.shouldRestartRecognition({elapsedMs:900,restartCount:0}),true);
  assert.equal(Providers.shouldRestartRecognition({elapsedMs:5000,restartCount:0}),true);
  assert.equal(Providers.shouldRestartRecognition({elapsedMs:900,heardSpeech:true,restartCount:0}),false);
  assert.equal(Providers.shouldRestartRecognition({elapsedMs:900,finalTranscript:'dog',restartCount:0}),false);
  assert.equal(Providers.shouldRestartRecognition({elapsedMs:900,error:'network',restartCount:0}),false);
  assert.equal(Providers.shouldRestartRecognition({elapsedMs:900,restartCount:4}),false);
  assert.equal(Providers.shouldRestartRecognition({elapsedMs:900,error:'no-speech',heardSpeech:true,restartCount:2}),true);
});

test('recognition selects the most lesson-relevant browser alternative without accepting it automatically',()=>{
  const result={0:{transcript:'banana',confidence:.91},1:{transcript:'red',confidence:.72},2:{transcript:'read',confidence:.68},length:3};
  const selected=Providers.selectRecognitionAlternative(result,{scoreAlternative:text=>text==='red'?1:0});
  assert.equal(selected.transcript,'red');
  assert.equal(selected.index,1);
  assert.equal(selected.relevance,1);
});

test('recognition keeps the highest-confidence alternative when lesson relevance is equal',()=>{
  const result={0:{transcript:'cat',confidence:.45},1:{transcript:'cap',confidence:.82},length:2};
  assert.equal(Providers.selectRecognitionAlternative(result).transcript,'cap');
});

test('recognition alternates to Hebrew on a bounded retry when Hebrew answers are accepted',()=>{
  const expectedAnswers=['dog','כלב'];
  assert.equal(Providers.recognitionLanguage({phase:'speaking',restartAttempt:0,expectedAnswers}),'en-US');
  assert.equal(Providers.recognitionLanguage({phase:'speaking',restartAttempt:1,expectedAnswers}),'he-IL');
  assert.equal(Providers.recognitionLanguage({phase:'speaking',restartAttempt:2,expectedAnswers}),'en-US');
  assert.equal(Providers.recognitionLanguage({phase:'greeting',restartAttempt:0,expectedAnswers:['yes']}),'en-US');
  assert.equal(Providers.recognitionLanguage({phase:'greeting',restartAttempt:0,expectedAnswers:['yes','כן']}),'he-IL');
  assert.equal(Providers.recognitionLanguage({phase:'greeting',restartAttempt:1,expectedAnswers:['yes','כן']}),'en-US');
  assert.equal(Providers.recognitionLanguage({phase:'speaking',restartAttempt:1,expectedAnswers:['dog']}),'en-US');
});
