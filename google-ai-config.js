(function(root){
  'use strict';
  const config=Object.freeze({
    provider:'firebase-ai-logic',
    enabled:true,
    appCheckEnabled:true,
    model:'gemini-3.7-flash',
    liveModel:'gemini-3.1-flash-live-preview',
    liveAudioEnabled:false,
    responseLanguage:'bilingual-child-safe',
    maxOutputTokens:180,
    timeoutMs:12000,
    preview:true
  });
  Object.defineProperty(root,'EAGoogleAIConfig',{value:config,writable:false,configurable:false});
})(typeof window!=='undefined'?window:globalThis);

