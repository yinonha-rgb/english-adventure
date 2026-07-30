const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const Providers=require('../../teacher-providers.js'),Pricing=require('../../pricing-config.js'),Policy=require('../../advanced-ai-policy.js');
const root=path.resolve(__dirname,'../..');

test('all providers expose the common provider interface',()=>{
  for(const type of ['free','mock-ai','openai-realtime']){
    const provider=Providers.createProvider(type);
    for(const method of Providers.METHODS)assert.equal(typeof provider[method],'function',`${type}.${method}`);
  }
});
test('mock provider covers every required scenario and never makes a paid request',async()=>{
  const oldFetch=global.fetch;
  global.fetch=()=>{throw new Error('external request attempted')};
  try{
    for(const scenario of Object.keys(Providers.SCENARIOS)){
      const events=[],provider=new Providers.MockAITeacherProvider({scenario,onEvent:event=>events.push(event)});
      const result=await provider.startSession({childId:'mock-child'});
      assert.equal(result.paidRequests,0);
      assert.equal(provider.reportUsage().paidRequests,0);
      assert.ok(events.length>0,scenario);
    }
  }finally{global.fetch=oldFetch}
});
test('production provider stays locked with the shipped immutable configuration',async()=>{
  const source=fs.readFileSync(path.join(root,'advanced-ai-config.js'),'utf8');
  const sandbox={window:{}};vm.runInNewContext(source,sandbox);
  const config=sandbox.window.EAAdvancedAIConfig;
  assert.equal(config.ADVANCED_AI_ENABLED,false);
  assert.equal(config.buildMode,'mock-only');
  assert.equal(Object.isFrozen(config),true);
  const provider=new Providers.OpenAIRealtimeTeacherProvider({config,serverStatus:{parentConsent:true,serverSecretConfigured:true,limitsConfigured:true,activationTokenValid:true}});
  assert.equal((await provider.startSession()).reason,'real-api-locked');
});
test('browser, URL or synchronized preferences cannot bypass the build lock',()=>{
  for(const attackerData of [{ADVANCED_AI_ENABLED:true},{allowedAdvanced:true,advancedConsent:true},{productionActivationToken:'fake'}]){
    const result=Providers.activationStatus({ADVANCED_AI_ENABLED:false,buildMode:'mock-only',...attackerData},{parentConsent:true});
    assert.equal(result.unlocked,false);
  }
});
test('frontend and mock modules contain no OpenAI endpoint and no secret-shaped value',()=>{
  for(const file of ['advanced-ai-config.js','pricing-config.js','advanced-ai-policy.js','teacher-providers.js','teacher-ai.js']){
    const text=fs.readFileSync(path.join(root,file),'utf8');
    assert.doesNotMatch(text,/api\.openai\.com|Bearer\s+sk-|sk-[A-Za-z0-9_-]{20,}/i,file);
  }
});
test('real pricing is intentionally unset and mock estimates are explicitly simulated',()=>{
  assert.equal(Pricing.PRICING.verifiedAt,null);
  assert.equal(Pricing.PRICING.textInputPerMillion,null);
  const estimate=Pricing.estimate({durationSeconds:60,inputCharacters:100,mock:true,budget:1});
  assert.equal(estimate.simulated,true);
  assert.match(estimate.notice,/מדומים/);
});
test('hybrid policy is local-first, rejects noise and duplicates, and requires consent plus limits',()=>{
  assert.equal(Policy.shouldUsePaidAI({reason:'routine-practice'},{maximumCreditSavings:true}).reason,'local-first');
  assert.equal(Policy.shouldUsePaidAI({reason:'unexpected-relevant-question',silence:true},{advancedConsent:true,limitsConfigured:true}).reason,'no-meaningful-input');
  assert.equal(Policy.shouldUsePaidAI({reason:'unexpected-relevant-question',duplicateId:'x'},{advancedConsent:true,limitsConfigured:true,lastRequestId:'x'}).reason,'duplicate');
  assert.equal(Policy.shouldUsePaidAI({reason:'unexpected-relevant-question'},{advancedConsent:false,limitsConfigured:true}).reason,'consent-required');
  assert.equal(Policy.shouldUsePaidAI({reason:'unexpected-relevant-question'},{advancedConsent:true,limitsConfigured:true}).allowed,true);
  assert.deepEqual(Policy.usageWarnings(91),[50,75,90]);
});
test('backend request is guarded before the future external transport and deployment is blocked',()=>{
  const source=fs.readFileSync(path.join(root,'functions/index.js'),'utf8');
  assert.ok(source.indexOf("advanced-ai-locked")<source.indexOf("api.openai.com"));
  const pkg=require('../package.json');
  assert.match(pkg.scripts.deploy,/intentionally locked/i);
});
test('optional teacher initialization cannot create a self-triggering DOM observer or contact a backend',()=>{
  const source=fs.readFileSync(path.join(root,'teacher-ai.js'),'utf8');
  const observer=source.match(/new MutationObserver\(\(\)=>\{([^}]*)\}\)/)?.[1]||'';
  assert.doesNotMatch(observer,/renderProviderStatus/);
  assert.match(source,/try\{await ready/);
  assert.match(source,/Optional voice teacher disabled; the free application remains available/);
  assert.ok(source.indexOf("ADVANCED_AI_ENABLED!==true")<source.indexOf('fetch(teacherAIConfig.backendEndpoint'));
});
