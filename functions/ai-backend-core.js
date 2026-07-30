'use strict';

const FEATURE_FLAGS=Object.freeze({
  ADVANCED_AI_ENABLED:false,
  REALTIME_VOICE_ENABLED:false,
  OPENAI_BACKEND_ENABLED:false
});

const COST_LIMITS=Object.freeze({
  MAX_AI_MINUTES_PER_CHILD_PER_DAY:5,
  MAX_AI_MINUTES_PER_ACCOUNT_PER_DAY:10,
  MAX_AI_REQUESTS_PER_MINUTE:3,
  MAX_AI_REQUESTS_PER_LESSON:12,
  MAX_INPUT_LENGTH:1200,
  MAX_OUTPUT_LENGTH:700,
  MAX_REQUEST_BYTES:12_000,
  MAX_SESSION_DURATION_SECONDS:600,
  MAX_DAILY_AI_COST_USD:0.50,
  MAX_MONTHLY_AI_COST_USD:5
});

const ENDPOINTS=Object.freeze([
  'createConversationSession',
  'processConversationTurn',
  'endConversationSession',
  'getRealtimeClientCredential'
]);

function cleanId(value,max=100){
  const id=String(value||'');
  return /^[A-Za-z0-9_-]+$/.test(id)&&id.length<=max?id:'';
}

function authorizeRequest(auth={},body={}){
  const parentUserId=cleanId(auth.uid,128);
  if(!parentUserId)return{ok:false,status:401,error:'authentication-required'};
  const childProfileId=cleanId(body.childProfileId);
  if(!childProfileId)return{ok:false,status:400,error:'invalid-child-profile'};
  if(!Array.isArray(auth.childProfileIds)||!auth.childProfileIds.includes(childProfileId))return{ok:false,status:403,error:'child-profile-not-owned'};
  return{ok:true,parentUserId,childProfileId};
}

function validateRequest(body={}){
  let bytes=Infinity;
  try{bytes=Buffer.byteLength(JSON.stringify(body),'utf8')}catch{}
  if(bytes>COST_LIMITS.MAX_REQUEST_BYTES)return{ok:false,status:413,error:'request-too-large'};
  if(body.rawAudio!=null||body.audio!=null||body.audioBlob!=null)return{ok:false,status:400,error:'raw-audio-not-accepted'};
  if(String(body.input||'').length>COST_LIMITS.MAX_INPUT_LENGTH)return{ok:false,status:400,error:'input-too-long'};
  if(Number(body.requestedOutputLength||0)>COST_LIMITS.MAX_OUTPUT_LENGTH)return{ok:false,status:400,error:'output-too-long'};
  return{ok:true};
}

function checkLimits(usage={},request={}){
  if((usage.childDaySeconds||0)>=COST_LIMITS.MAX_AI_MINUTES_PER_CHILD_PER_DAY*60)return{ok:false,error:'child-daily-limit'};
  if((usage.accountDaySeconds||0)>=COST_LIMITS.MAX_AI_MINUTES_PER_ACCOUNT_PER_DAY*60)return{ok:false,error:'account-daily-limit'};
  if((usage.requestsLastMinute||0)>=COST_LIMITS.MAX_AI_REQUESTS_PER_MINUTE)return{ok:false,error:'rate-limit'};
  if((usage.lessonRequestCount||0)>=COST_LIMITS.MAX_AI_REQUESTS_PER_LESSON)return{ok:false,error:'lesson-request-limit'};
  if((usage.sessionDurationSeconds||0)>=COST_LIMITS.MAX_SESSION_DURATION_SECONDS)return{ok:false,error:'session-duration-limit'};
  if((usage.dailyEstimatedCostUsd||0)>=COST_LIMITS.MAX_DAILY_AI_COST_USD)return{ok:false,error:'daily-cost-limit'};
  if((usage.monthlyEstimatedCostUsd||0)>=COST_LIMITS.MAX_MONTHLY_AI_COST_USD)return{ok:false,error:'monthly-cost-limit'};
  if(request.requestId&&request.requestId===usage.lastRequestId)return{ok:false,error:'duplicate-request'};
  if(request.nonce&&Array.isArray(usage.usedNonces)&&usage.usedNonces.includes(request.nonce))return{ok:false,error:'replay-detected'};
  return{ok:true};
}

function createUsageRecord(input={}){
  return{
    parentUserId:cleanId(input.parentUserId,128),
    childProfileId:cleanId(input.childProfileId),
    lessonId:cleanId(input.lessonId),
    sessionId:cleanId(input.sessionId),
    requestCount:Math.max(0,Number(input.requestCount)||0),
    inputUnits:Math.max(0,Number(input.inputUnits)||0),
    outputUnits:Math.max(0,Number(input.outputUnits)||0),
    audioInputDuration:Math.max(0,Number(input.audioInputDuration)||0),
    audioOutputDuration:Math.max(0,Number(input.audioOutputDuration)||0),
    estimatedCost:Math.max(0,Number(input.estimatedCost)||0),
    createdAt:input.createdAt||null,
    status:['disabled','mock','completed','failed'].includes(input.status)?input.status:'disabled'
  };
}

function disabledResponse(endpoint){
  if(!ENDPOINTS.includes(endpoint))return{ok:false,status:400,error:'unknown-endpoint'};
  return{
    ok:false,
    status:503,
    error:'advanced-ai-disabled',
    endpoint,
    mode:'disabled',
    mock:true,
    paidRequests:0,
    credential:null
  };
}

function handleDisabledEndpoint(endpoint,{auth={},body={},usage={}}={}){
  const authorization=authorizeRequest(auth,body);
  if(!authorization.ok)return authorization;
  const validation=validateRequest(body);
  if(!validation.ok)return validation;
  const limit=checkLimits(usage,body);
  if(!limit.ok)return{ok:false,status:429,error:limit.error};
  return disabledResponse(endpoint);
}

module.exports={FEATURE_FLAGS,COST_LIMITS,ENDPOINTS,cleanId,authorizeRequest,validateRequest,checkLimits,createUsageRecord,disabledResponse,handleDisabledEndpoint};
