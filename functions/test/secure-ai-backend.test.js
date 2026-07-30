const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Backend=require('../ai-backend-core');

const root=path.resolve(__dirname,'../..');

test('all advanced feature flags are immutable and disabled',()=>{
  assert.deepEqual(Backend.FEATURE_FLAGS,{
    ADVANCED_AI_ENABLED:false,
    REALTIME_VOICE_ENABLED:false,
    OPENAI_BACKEND_ENABLED:false
  });
  assert.equal(Object.isFrozen(Backend.FEATURE_FLAGS),true);
});

test('disabled backend interfaces require authentication and child ownership',()=>{
  const body={childProfileId:'child-a',lessonId:'lesson-a'};
  assert.equal(Backend.handleDisabledEndpoint('createConversationSession',{body}).error,'authentication-required');
  assert.equal(Backend.handleDisabledEndpoint('createConversationSession',{auth:{uid:'parent-a',childProfileIds:['child-b']},body}).error,'child-profile-not-owned');
  const result=Backend.handleDisabledEndpoint('createConversationSession',{auth:{uid:'parent-a',childProfileIds:['child-a']},body});
  assert.equal(result.error,'advanced-ai-disabled');
  assert.equal(result.paidRequests,0);
});

test('rate, daily, lesson, duration and cost limits are restrictive',()=>{
  const L=Backend.COST_LIMITS;
  assert.equal(Backend.checkLimits({requestsLastMinute:L.MAX_AI_REQUESTS_PER_MINUTE}).error,'rate-limit');
  assert.equal(Backend.checkLimits({childDaySeconds:L.MAX_AI_MINUTES_PER_CHILD_PER_DAY*60}).error,'child-daily-limit');
  assert.equal(Backend.checkLimits({accountDaySeconds:L.MAX_AI_MINUTES_PER_ACCOUNT_PER_DAY*60}).error,'account-daily-limit');
  assert.equal(Backend.checkLimits({lessonRequestCount:L.MAX_AI_REQUESTS_PER_LESSON}).error,'lesson-request-limit');
  assert.equal(Backend.checkLimits({sessionDurationSeconds:L.MAX_SESSION_DURATION_SECONDS}).error,'session-duration-limit');
  assert.equal(Backend.checkLimits({dailyEstimatedCostUsd:L.MAX_DAILY_AI_COST_USD}).error,'daily-cost-limit');
  assert.equal(Backend.checkLimits({monthlyEstimatedCostUsd:L.MAX_MONTHLY_AI_COST_USD}).error,'monthly-cost-limit');
});

test('duplicate, replay, oversize input and raw audio are rejected',()=>{
  assert.equal(Backend.checkLimits({lastRequestId:'same'},{requestId:'same'}).error,'duplicate-request');
  assert.equal(Backend.checkLimits({usedNonces:['used']},{nonce:'used'}).error,'replay-detected');
  assert.equal(Backend.validateRequest({input:'x'.repeat(Backend.COST_LIMITS.MAX_INPUT_LENGTH+1)}).error,'input-too-long');
  assert.equal(Backend.validateRequest({rawAudio:'never-store'}).error,'raw-audio-not-accepted');
});

test('usage records contain bounded metadata and never raw audio or transcripts',()=>{
  const record=Backend.createUsageRecord({parentUserId:'parent-a',childProfileId:'child-a',lessonId:'lesson-a',sessionId:'session-a',requestCount:2,inputUnits:12,outputUnits:8,audioInputDuration:3,audioOutputDuration:2,estimatedCost:.01,status:'mock',rawAudio:'forbidden',transcript:'forbidden'});
  assert.deepEqual(Object.keys(record),['parentUserId','childProfileId','lessonId','sessionId','requestCount','inputUnits','outputUnits','audioInputDuration','audioOutputDuration','estimatedCost','createdAt','status']);
  assert.equal(record.rawAudio,undefined);
  assert.equal(record.transcript,undefined);
});

test('repository frontend contains no provider URL, SDK, key token or direct transport',()=>{
  const frontendFiles=fs.readdirSync(root).filter(name=>/\.(?:js|html)$/i.test(name));
  const forbidden=[
    ['api','openai','com'].join('.'),
    ['OPENAI','API','KEY'].join('_'),
    ['sk',''].join('-'),
    ['new','OpenAI('].join(' '),
    ['OpenAI','Realtime'].join('')
  ];
  for(const name of frontendFiles){
    const source=fs.readFileSync(path.join(root,name),'utf8');
    for(const token of forbidden)assert.equal(source.includes(token),false,`${name} contains forbidden frontend token`);
  }
});

test('disabled backend exports all four prepared interfaces and no provider transport',()=>{
  const source=fs.readFileSync(path.join(root,'functions/index.js'),'utf8');
  for(const endpoint of Backend.ENDPOINTS)assert.match(source,new RegExp(`exports\\.${endpoint}=`));
  assert.equal(source.includes(['api','openai','com'].join('.')),false);
  assert.equal(source.includes(['OPENAI','API','KEY'].join('_')),false);
});
