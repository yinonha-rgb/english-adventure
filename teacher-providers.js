(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.EATeacherProviders=api})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const METHODS=['startSession','processUtterance','interrupt','reset','endSession','speak','listen','validateAnswer','requestHint','repeatInstruction','switchLanguage','updateLessonContext','generateLessonSummary','reportUsage','handleDisconnect'];
  class DisabledProviderError extends Error{
    constructor(message='Advanced AI provider is disabled'){super(message);this.name='DisabledProviderError';this.code='advanced-provider-disabled'}
  }
  class ConversationProvider{
    constructor({type='base',onEvent=()=>{},validator=null}={}){this.type=type;this.onEvent=onEvent;this.validator=validator;this.context=null;this.started=false;this.usage={paidRequests:0,sessions:0,durationSeconds:0}}
    emit(type,data={}){const event={type,provider:this.type,at:new Date().toISOString(),...data};this.onEvent(event);return event}
    async startSession(context={}){this.context=context;this.started=true;this.usage.sessions++;return this.emit('connected')}
    async processUtterance(input,context={}){return this.emit('utterance',{input:String(input||''),context})}
    async interrupt(){return this.emit('interrupted')}
    reset(){this.context=null;this.started=false;return this.emit('reset')}
    async endSession(reason='completed'){this.started=false;return this.emit('ended',{reason})}
    async speak(text){return this.emit('speaking',{text})}
    async listen(){return this.emit('listening')}
    validateAnswer(answer,spec,meta){return this.validator?.(answer,spec,meta)||{valid:false,category:'speech-recognition-uncertain',reason:'validator-unavailable'}}
    async requestHint(){return this.emit('hint',{text:'Look carefully at the important lesson word.'})}
    async repeatInstruction(){return this.emit('repeat')}
    async switchLanguage(language){return this.emit('language',{language})}
    async updateLessonContext(context){this.context={...this.context,...context};return this.emit('context-updated')}
    async generateLessonSummary(){return{provider:this.type,completed:this.started,usage:this.reportUsage()}}
    reportUsage(){return{...this.usage}}
    async handleDisconnect(){this.started=false;return this.emit('disconnected')}
  }
  const CONVERSATION_INTENTS=Object.freeze({
    ANSWER:'answer',
    REPEAT:'repeat',
    SLOWER:'slower',
    EXPLAIN:'explain',
    HINT:'hint',
    DONT_KNOW:'dont-know',
    TRY_AGAIN:'try-again',
    BREAK:'break',
    STOP:'stop',
    READY:'ready',
    YES:'yes',
    NO:'no',
    GREETING:'greeting',
    THANKS:'thanks',
    ENCOURAGEMENT:'encouragement',
    INSTRUCTION:'instruction-question',
    LESSON_TOPIC:'lesson-topic-question',
    LANGUAGE_CHOICE:'language-choice-question'
  });
  function normalizeConversationText(text){
    return String(text||'').normalize('NFKC').toLocaleLowerCase().replace(/[.,!?;:"'()[\]{}]/g,' ').replace(/\s+/g,' ').trim();
  }
  function conversationIntent(text){
    const normalized=normalizeConversationText(text),has=patterns=>patterns.some(pattern=>pattern.test(normalized));
    if(!normalized)return{intent:CONVERSATION_INTENTS.ANSWER,normalized,confidence:0};
    if(has([/^(hi|hello|hey|good morning|good afternoon|good evening)$/,/^שלום$/]))return{intent:CONVERSATION_INTENTS.GREETING,normalized,confidence:.98};
    if(has([/^(thanks|thank you|thank you teacher)$/,/^תודה$/]))return{intent:CONVERSATION_INTENTS.THANKS,normalized,confidence:.98};
    if(has([/\b(stop|end|finish|quit)\b/,/(עצור|תעצור|לסיים|סיום|די להיום)/]))return{intent:CONVERSATION_INTENTS.STOP,normalized,confidence:.98};
    if(has([/\b(break|pause|rest)\b/,/(הפסקה|להפסיק רגע|לנוח)/]))return{intent:CONVERSATION_INTENTS.BREAK,normalized,confidence:.98};
    if(has([/\b(let me try again|try again|one more try)\b/,/(אני רוצה לנסות שוב|אפשר לנסות שוב|עוד ניסיון)/]))return{intent:CONVERSATION_INTENTS.TRY_AGAIN,normalized,confidence:.96};
    if(has([/\b(repeat|again|say it again)\b/,/(חזור|תחזור|שוב|לא שמעתי)/]))return{intent:CONVERSATION_INTENTS.REPEAT,normalized,confidence:.97};
    if(has([/\b(slower|slow down|more slowly)\b/,/(יותר לאט|לאט יותר|דבר לאט|דברי לאט)/]))return{intent:CONVERSATION_INTENTS.SLOWER,normalized,confidence:.98};
    const meaning=normalized.match(/(?:what does|what is|meaning of)\s+([a-z][a-z '-]*)|(?:מה זה|מה פירוש|מה אומרת המילה)\s+([a-z][a-z '-]*)/i);
    if(meaning)return{intent:CONVERSATION_INTENTS.EXPLAIN,normalized,confidence:.96,subject:(meaning[1]||meaning[2]||'').trim()};
    if(has([/\b(hint|help me|help please)\b/,/(רמז|עזרה|תעזור|תעזרי)/]))return{intent:CONVERSATION_INTENTS.HINT,normalized,confidence:.96};
    if(has([/\b(i do not know|i don't know|no idea)\b/,/(לא יודע|לא יודעת|אין לי מושג)/]))return{intent:CONVERSATION_INTENTS.DONT_KNOW,normalized,confidence:.98};
    if(has([/\b(i am ready|ready|let's go|lets go)\b/,/(אני מוכן|אני מוכנה|אפשר להתחיל|מתחילים)/]))return{intent:CONVERSATION_INTENTS.READY,normalized,confidence:.93};
    if(has([/^(yes|yeah|yep|sure|okay|ok)$/,/^(כן|בטח|אוקיי)$/]))return{intent:CONVERSATION_INTENTS.YES,normalized,confidence:.9};
    if(has([/^(no|nope)$/,/^(לא)$/]))return{intent:CONVERSATION_INTENTS.NO,normalized,confidence:.9};
    if(has([/\b(this is fun|i like this|great game)\b/,/(כיף לי|אני אוהב|אני אוהבת|איזה כיף)/]))return{intent:CONVERSATION_INTENTS.ENCOURAGEMENT,normalized,confidence:.94};
    if(has([/^(what should i do|what do i do|what now|i do not understand|i don't understand)$/,/^(מה לעשות|מה עושים|מה עושים עכשיו|לא הבנתי|לא הבנתי מה לעשות)$/]))return{intent:CONVERSATION_INTENTS.INSTRUCTION,normalized,confidence:.97};
    if(has([/^(what are we learning|what is the lesson|what are we doing today)$/,/^(מה לומדים|מה לומדים היום|על מה השיעור|מה השיעור)$/]))return{intent:CONVERSATION_INTENTS.LESSON_TOPIC,normalized,confidence:.97};
    if(has([/^(can i answer in hebrew|can i answer in english|in hebrew|in english)$/,/^(אפשר לענות בעברית|אפשר לענות באנגלית|אפשר בעברית|אפשר באנגלית)$/]))return{intent:CONVERSATION_INTENTS.LANGUAGE_CHOICE,normalized,confidence:.98};
    return{intent:CONVERSATION_INTENTS.ANSWER,normalized,confidence:1};
  }
  function shouldRestartRecognition({elapsedMs=0,heardSpeech=false,finalTranscript='',error='',restartCount=0,maxRestarts=2}={}){
    return !error&&!finalTranscript&&restartCount<maxRestarts&&elapsedMs<4500&&!heardSpeech;
  }
  class FreeConversationProvider extends ConversationProvider{
    constructor(options={}){super({...options,type:'free'})}
    handleChildInput(text,context={}){
      const result={...conversationIntent(text),context};
      this.emit('child-intent',result);
      return result;
    }
    async processUtterance(input,context={}){return this.handleChildInput(input,context)}
  }
  const SCENARIOS=Object.freeze({
    success:['connected','greeting','speaking','listening','transcription','correct','summary','ended'],
    incorrect:['connected','listening','transcription','incorrect','hint','correction','ended'],
    unrelated:['connected','listening','transcription','unrelated','correction','ended'],
    silence:['connected','listening','silence','repeat','choices','ended'],
    uncertain:['connected','listening','uncertain','repeat','choices','ended'],
    hebrewHelp:['connected','greeting','hebrew-help','speaking','ended'],
    adaptive:['connected','listening','incorrect','difficulty-easier','correct','summary','ended'],
    reconnect:['connected','disconnected','reconnecting','connected','ended'],
    timeout:['connecting','timeout','fallback'],
    usageLimit:['usage-warning-90','usage-limit','fallback'],
    consentMissing:['consent-missing','fallback'],
    unauthorizedChild:['unauthorized-child','fallback'],
    backendUnavailable:['backend-unavailable','fallback']
  });
  class MockAdvancedConversationProvider extends ConversationProvider{
    constructor(options={}){super({...options,type:'mock-ai'});this.scenario=SCENARIOS[options.scenario]?options.scenario:'success';this.usage={paidRequests:0,sessions:0,durationSeconds:0,simulatedTextTokens:0,simulatedAudioSeconds:0}}
    async startSession(context={}){this.context=context;this.started=true;this.usage.sessions++;this.emit('mock-status',{label:'מצב הדגמה – ללא שימוש ב־API'});for(const type of SCENARIOS[this.scenario])this.emit(type,{simulated:true});return{ok:!['consentMissing','unauthorizedChild','backendUnavailable','usageLimit','timeout'].includes(this.scenario),scenario:this.scenario,paidRequests:0}}
    async speak(text){this.usage.simulatedTextTokens+=Math.ceil(String(text).length/4);return this.emit('speaking',{text,simulated:true})}
    async listen(){this.usage.simulatedAudioSeconds+=4;return this.emit('listening',{simulated:true})}
    async handleDisconnect(){this.emit('disconnected',{simulated:true});return this.emit('reconnecting',{simulated:true})}
  }
  function activationStatus(config={},serverStatus={}){
    const checks={advancedAI:config.ADVANCED_AI_ENABLED===true,realtimeVoice:config.REALTIME_VOICE_ENABLED===true,backend:config.OPENAI_BACKEND_ENABLED===true,parentConsent:serverStatus.parentConsent===true,backendConfigured:config.backendDeployed===true&&!!config.backendEndpoint,serverSecret:serverStatus.serverSecretConfigured===true,limitsConfigured:serverStatus.limitsConfigured===true,billingApproval:config.billingApproved===true,productionToken:serverStatus.activationTokenValid===true,productionBuild:config.buildMode==='production'};
    return{unlocked:Object.values(checks).every(Boolean),checks};
  }
  class AdvancedConversationProvider extends ConversationProvider{
    constructor(options={}){super({...options,type:'openai-realtime'});this.config=options.config||{};this.serverStatus=options.serverStatus||{}}
    disabled(){const status=activationStatus(this.config,this.serverStatus);this.emit('locked',{checks:status.checks});throw new DisabledProviderError()}
    async startSession(){return this.disabled()}
    async processUtterance(){return this.disabled()}
  }
  const MockConversationProvider=MockAdvancedConversationProvider;
  const TeacherProvider=ConversationProvider;
  const FreeGuidedTeacherProvider=FreeConversationProvider;
  const MockAITeacherProvider=MockAdvancedConversationProvider;
  function createProvider(type,options={}){
    if(['mock-ai','mock-conversation','mock'].includes(type))return new MockAdvancedConversationProvider(options);
    if(['openai-realtime','advanced-conversation','advanced'].includes(type))return new AdvancedConversationProvider(options);
    return new FreeConversationProvider(options);
  }
  function createProductionProvider(options={}){return new FreeConversationProvider(options)}
  async function startSessionWithFallback(provider,context={},options={}){
    try{
      const result=await provider.startSession(context);
      if(result?.ok===false)throw new DisabledProviderError();
      return{provider,result,fallback:false,context};
    }catch(error){
      if(options.development===true)options.onWarning?.({code:error.code||'provider-failure',message:String(error.message||error)});
      const free=options.freeProvider||new FreeConversationProvider(options);
      const result=await free.startSession(context);
      return{provider:free,result,fallback:true,reason:error.code||'provider-failure',context};
    }
  }
  return{METHODS,SCENARIOS,CONVERSATION_INTENTS,normalizeConversationText,conversationIntent,shouldRestartRecognition,DisabledProviderError,ConversationProvider,FreeConversationProvider,MockAdvancedConversationProvider,MockConversationProvider,AdvancedConversationProvider,TeacherProvider,FreeGuidedTeacherProvider,MockAITeacherProvider,activationStatus,createProvider,createProductionProvider,startSessionWithFallback};
});
