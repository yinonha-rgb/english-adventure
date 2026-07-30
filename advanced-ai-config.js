(function(root){
  'use strict';
  const config=Object.freeze({
    ADVANCED_AI_ENABLED:false,
    REALTIME_VOICE_ENABLED:false,
    OPENAI_BACKEND_ENABLED:false,
    productionActivationToken:'',
    backendEndpoint:'',
    backendDeployed:false,
    serverSecretConfigured:false,
    billingApproved:false,
    pricingVerifiedAt:null,
    buildMode:'mock-only'
  });
  Object.defineProperty(root,'EAAdvancedAIConfig',{value:config,writable:false,configurable:false});
})(typeof window!=='undefined'?window:globalThis);
