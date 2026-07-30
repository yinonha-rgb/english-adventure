(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.EATeacherProviders=api})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const METHODS=['startSession','endSession','speak','listen','validateAnswer','requestHint','repeatInstruction','switchLanguage','updateLessonContext','generateLessonSummary','reportUsage','handleDisconnect'];
  class TeacherProvider{
    constructor({type='base',onEvent=()=>{},validator=null}={}){this.type=type;this.onEvent=onEvent;this.validator=validator;this.context=null;this.started=false;this.usage={paidRequests:0,sessions:0,durationSeconds:0}}
    emit(type,data={}){const event={type,provider:this.type,at:new Date().toISOString(),...data};this.onEvent(event);return event}
    async startSession(context={}){this.context=context;this.started=true;this.usage.sessions++;return this.emit('connected')}
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
  class FreeGuidedTeacherProvider extends TeacherProvider{constructor(options={}){super({...options,type:'free'})}}
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
  class MockAITeacherProvider extends TeacherProvider{
    constructor(options={}){super({...options,type:'mock-ai'});this.scenario=SCENARIOS[options.scenario]?options.scenario:'success';this.usage={paidRequests:0,sessions:0,durationSeconds:0,simulatedTextTokens:0,simulatedAudioSeconds:0}}
    async startSession(context={}){this.context=context;this.started=true;this.usage.sessions++;this.emit('mock-status',{label:'מצב הדגמה – ללא שימוש ב־API'});for(const type of SCENARIOS[this.scenario])this.emit(type,{simulated:true});return{ok:!['consentMissing','unauthorizedChild','backendUnavailable','usageLimit','timeout'].includes(this.scenario),scenario:this.scenario,paidRequests:0}}
    async speak(text){this.usage.simulatedTextTokens+=Math.ceil(String(text).length/4);return this.emit('speaking',{text,simulated:true})}
    async listen(){this.usage.simulatedAudioSeconds+=4;return this.emit('listening',{simulated:true})}
    async handleDisconnect(){this.emit('disconnected',{simulated:true});return this.emit('reconnecting',{simulated:true})}
  }
  function activationStatus(config={},serverStatus={}){
    const checks={featureFlag:config.ADVANCED_AI_ENABLED===true,parentConsent:serverStatus.parentConsent===true,backendConfigured:config.backendDeployed===true&&!!config.backendEndpoint,serverSecret:serverStatus.serverSecretConfigured===true,limitsConfigured:serverStatus.limitsConfigured===true,billingApproval:config.billingApproved===true,productionToken:serverStatus.activationTokenValid===true,productionBuild:config.buildMode==='production'};
    return{unlocked:Object.values(checks).every(Boolean),checks};
  }
  class OpenAIRealtimeTeacherProvider extends TeacherProvider{
    constructor(options={}){super({...options,type:'openai-realtime'});this.config=options.config||{};this.serverStatus=options.serverStatus||{}}
    async startSession(){const status=activationStatus(this.config,this.serverStatus);if(!status.unlocked){this.emit('locked',{checks:status.checks});return{ok:false,reason:'real-api-locked',paidRequests:0}}throw new Error('Real provider transport is intentionally unavailable in mock-only builds')}
  }
  function createProvider(type,options={}){if(type==='mock-ai')return new MockAITeacherProvider(options);if(type==='openai-realtime')return new OpenAIRealtimeTeacherProvider(options);return new FreeGuidedTeacherProvider(options)}
  return{METHODS,SCENARIOS,TeacherProvider,FreeGuidedTeacherProvider,MockAITeacherProvider,OpenAIRealtimeTeacherProvider,activationStatus,createProvider};
});
