const test=require('node:test');
const assert=require('node:assert/strict');
const Motion=require('../../teacher-video-motion.js');
test('Emily clip is eligible for one greeting or the initial spoken introduction',()=>{
  const base={character:'female-young',state:'greeting',reducedMotion:false,hidden:false,speaking:false};
  for(const state of Motion.VIDEO_STATES)assert.equal(Motion.eligible({...base,state}),true);
  for(const state of ['idle','speaking','speak','listening','waiting','paused','celebrating','goodbye'])assert.equal(Motion.eligible({...base,state}),false);
  assert.equal(Motion.eligible({...base,state:'idle',speaking:true,introSpeaking:true}),true);
  for(const change of [{character:'male-young'},{reducedMotion:true},{hidden:true},{played:true}])assert.equal(Motion.eligible({...base,...change}),false);
});
test('video lifecycle is silent, recovers to existing artwork and stops on teardown',async()=>{
  const classes=new Set(),events={},attrs={};let plays=0,pauses=0,removed=false,disconnected=false,destroyed=false;
  const video={hidden:true,currentTime:0,setAttribute:(k,v)=>attrs[k]=v,getAttribute:k=>attrs[k],removeAttribute:k=>delete attrs[k],addEventListener:(k,f)=>events[k]=f,removeEventListener:()=>{},play:()=>{plays++;video.currentTime=.5;return Promise.resolve()},pause:()=>pauses++,load:()=>{},remove:()=>removed=true};
  const button={append:()=>{},classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)}};
  const media={matches:false,addEventListener:()=>{},removeEventListener:()=>{}};
  const doc={hidden:false,createElement:()=>video,body:{classList:{contains:()=>false}},addEventListener:()=>{},removeEventListener:()=>{},defaultView:{matchMedia:()=>media,MutationObserver:class{observe(){}disconnect(){disconnected=true}}}};
  const host={ownerDocument:doc,querySelector:()=>button};
  const controller={setState:s=>s,startMouth(){},stopMouth(){},destroy(){destroyed=true}};
  Motion.attach(host,controller,{character:'female-young',preview:true});await Promise.resolve();
  assert.equal(video.muted,true);assert.equal(video.loop,false);assert.equal(video.hidden,true);assert.equal(plays,0);
  controller.setState('greeting');controller.startMouth();await Promise.resolve();assert.equal(video.hidden,false);assert.equal(plays,1);
  controller.stopMouth();assert.equal(video.hidden,false);
  controller.startMouth();await Promise.resolve();assert.equal(video.hidden,false);
  controller.stopMouth();assert.equal(video.hidden,false);
  controller.setState('listening');assert.equal(video.hidden,true);
  controller.setState('greeting');await Promise.resolve();assert.equal(video.hidden,true);assert.equal(plays,1);
  events.error();assert.equal(video.hidden,true);assert.equal(classes.size,0);
  controller.destroy();assert.ok(removed&&disconnected&&destroyed&&pauses>0);
});
test('missing optional UI and male teacher are no-ops',()=>{
  const controller={};assert.equal(Motion.attach(null,controller,{character:'female-young'}),controller);
  assert.equal(Motion.attach({querySelector:()=>({})},controller,{character:'male-young'}),controller);
});
test('preview can be disabled without touching the production teacher',()=>{
  const controller={};
  const host={querySelector(){throw new Error('Production must not mount sample')}};
  assert.equal(Motion.attach(host,controller,{character:'female-young',preview:false}),controller);
});
