(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EAGoogleAIProvider=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  class GoogleAIUnavailableError extends Error{
    constructor(reason='google-ai-disabled'){super(reason);this.name='GoogleAIUnavailableError';this.code=reason}
  }
  const safeText=value=>String(value||'').replace(/[<>]/g,'').trim().slice(0,1200);
  const childPrompt=(input,context={})=>({
    system:[
      'You are Emily, a warm English teacher for children ages 3 to 10.',
      'Keep replies under three short sentences.',
      'Never praise an incorrect, unrelated, silent, or uncertain answer.',
      'Use Hebrew briefly for explanation and English for practice.',
      'Never request personal information and never mention APIs.'
    ].join(' '),
    input:safeText(input),
    lesson:{id:safeText(context.lessonId||context.lesson?.id),topic:safeText(context.topic||context.lesson?.title),expectedAnswers:(context.expectedAnswers||[]).map(safeText).slice(0,12)},
    // Never send a child's name or other profile data to the model.
    child:{level:Number(context.level)||1}
  });
  class GoogleConversationProvider{
    constructor({config={},adapter=null,onEvent=()=>{}}={}){this.type='google-gemini';this.config=config;this.adapter=adapter;this.onEvent=onEvent;this.context=null;this.started=false;this.usage={paidRequests:0,sessions:0,durationSeconds:0};this.abortController=null}
    emit(type,data={}){const event={type,provider:this.type,at:new Date().toISOString(),...data};this.onEvent(event);return event}
    assertReady(){if(this.config.enabled!==true)throw new GoogleAIUnavailableError('google-ai-disabled');if(this.config.appCheckEnabled!==true)throw new GoogleAIUnavailableError('app-check-required');if(!this.adapter?.generate)throw new GoogleAIUnavailableError('google-ai-adapter-unavailable')}
    async startSession(context={}){this.assertReady();this.context=context;this.started=true;this.usage.sessions++;return this.emit('connected',{model:this.config.model,liveAudio:false})}
    async processUtterance(input,context={}){this.assertReady();if(!safeText(input))throw new GoogleAIUnavailableError('no-meaningful-input');this.abortController?.abort();this.abortController=new AbortController();this.emit('thinking',{animationState:'thinking'});const result=await this.adapter.generate(childPrompt(input,{...this.context,...context}),{signal:this.abortController.signal,timeoutMs:this.config.timeoutMs,maxOutputTokens:this.config.maxOutputTokens,model:this.config.model});const text=safeText(result?.text);if(!text)throw new GoogleAIUnavailableError('empty-model-response');this.usage.paidRequests++;this.emit('speaking',{text,animationState:'speaking'});return{text,provider:this.type,usage:this.reportUsage()}}
    async interrupt(){this.abortController?.abort();this.abortController=null;return this.emit('interrupted',{animationState:'listening'})}
    reset(){this.abortController?.abort();this.context=null;this.started=false;return this.emit('reset')}
    async endSession(reason='completed'){await this.interrupt();this.started=false;return this.emit('ended',{reason})}
    async speak(text){return this.emit('speaking',{text:safeText(text),animationState:'speaking'})}
    async listen(){return this.emit('listening',{animationState:'listening'})}
    validateAnswer(){return{valid:false,category:'speech-recognition-uncertain',reason:'deterministic-validator-required'}}
    async requestHint(){return this.emit('hint')}
    async repeatInstruction(){return this.emit('repeat')}
    async switchLanguage(language){return this.emit('language',{language})}
    async updateLessonContext(context){this.context={...this.context,...context};return this.emit('context-updated')}
    async generateLessonSummary(){return{provider:this.type,completed:this.started,usage:this.reportUsage()}}
    reportUsage(){return{...this.usage}}
    async handleDisconnect(){this.started=false;return this.emit('disconnected')}
  }
  return{GoogleAIUnavailableError,GoogleConversationProvider,childPrompt,safeText};
});

