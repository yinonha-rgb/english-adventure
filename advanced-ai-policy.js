(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EAAdvancedAIPolicy=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const PAID_REASONS=new Set(['unexpected-relevant-question','ambiguous-meaning','personalized-explanation','explicit-full-conversation']);
  function shouldUsePaidAI(request={},settings={}){
    if(settings.maximumCreditSavings!==false&&!PAID_REASONS.has(request.reason))return{allowed:false,reason:'local-first'};
    if(request.cancelled||request.silence||request.backgroundNoise)return{allowed:false,reason:'no-meaningful-input'};
    if(request.duplicateId&&request.duplicateId===settings.lastRequestId)return{allowed:false,reason:'duplicate'};
    if(!settings.advancedConsent)return{allowed:false,reason:'consent-required'};
    if(!settings.limitsConfigured)return{allowed:false,reason:'limits-required'};
    return{allowed:true,reason:request.reason};
  }
  function usageWarnings(percent){const value=Math.max(0,Number(percent)||0);return[50,75,90].filter(threshold=>value>=threshold)}
  return{PAID_REASONS,shouldUsePaidAI,usageWarnings};
});
