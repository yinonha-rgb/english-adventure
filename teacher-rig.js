(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EARiggedTeacher=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  let instance=0;
  const GEOMETRY={
    'female-young':{asset:'assets/teacher-noa-sprite.png',x:48,y:28,w:320,h:950,head:[42,0,238,315],leftArm:[20,245,105,370],rightArm:[242,245,76,370],mouth:[50.5,21.2]},
    'male-young':{asset:'assets/teacher-adam-sprite.png',x:45,y:28,w:385,h:955,head:[70,0,250,285],leftArm:[24,210,115,420],rightArm:[290,210,92,420],mouth:[50.5,18.7]}
  };
  const labels={female:'נועה',male:'אדם'};
  const esc=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function clip(id,box){return `<clipPath id="${id}"><rect x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}" rx="18"/></clipPath>`}
  function image(asset,g){return `<image href="${asset}" x="-${g.x}" y="-${g.y}" width="1536" height="1024" preserveAspectRatio="xMinYMin meet"/>`}
  function rigMarkup(character){
    const g=GEOMETRY[character]||GEOMETRY['female-young'],uid=`ea-rig-${++instance}`,gender=character==='male-young'?'male':'female',name=labels[gender];
    return `<span class="teacher-rig" style="--rig-mouth-x:${g.mouth[0]}%;--rig-mouth-y:${g.mouth[1]}%" data-rig-gender="${gender}"><svg class="teacher-rig-svg" viewBox="0 0 ${g.w} ${g.h}" role="img" aria-label="${name}, מורה צעיר${gender==='female'?'ה':''} וידידותי${gender==='female'?'ת':''}"><defs>${clip(`${uid}-full`,[0,0,g.w,g.h])}${clip(`${uid}-head`,g.head)}${clip(`${uid}-left`,g.leftArm)}${clip(`${uid}-right`,g.rightArm)}</defs><g class="rig-body" clip-path="url(#${uid}-full)">${image(g.asset,g)}</g><g class="rig-head" clip-path="url(#${uid}-head)">${image(g.asset,g)}</g><g class="rig-arm rig-arm-left" clip-path="url(#${uid}-left)">${image(g.asset,g)}</g><g class="rig-arm rig-arm-right" clip-path="url(#${uid}-right)">${image(g.asset,g)}</g></svg><i class="teacher-rig-mouth" aria-hidden="true"></i><i class="teacher-rig-blink" aria-hidden="true"></i><span class="teacher-rig-stars" aria-hidden="true">✦ ★ ✧</span></span>`;
  }
  function createController(rootEl,{character='female-young',reducedMotion=false,subtitles='all'}={}){
    let state='idle',mouthTimer=0,lastSpeech={text:'',lang:'en-US'},replay=()=>{};
    const gender=character==='male-young'?'male':'female',name=labels[gender];
    rootEl.innerHTML=`<section class="teacher-presence teacher-presence-rig" data-state="idle" data-character="${character}" aria-live="polite"><button class="teacher-character" type="button" aria-label="לחצו על ${name} כדי לשמוע שוב">${rigMarkup(character)}<span class="teacher-ear" aria-hidden="true">👂</span></button><div class="teacher-bubbles"><p class="speech-bubble en" lang="en"></p><p class="speech-bubble he" lang="he" dir="rtl"></p></div><span class="sr-only teacher-gesture">${name} מוכן${gender==='female'?'ה':''}</span></section>`;
    const presence=rootEl.querySelector('.teacher-presence'),en=rootEl.querySelector('.speech-bubble.en'),he=rootEl.querySelector('.speech-bubble.he'),gesture=rootEl.querySelector('.teacher-gesture');
    const stopMouth=()=>{clearInterval(mouthTimer);mouthTimer=0;presence.classList.remove('mouth-active');delete presence.dataset.mouth};
    const setState=next=>{state=next||'idle';presence.dataset.state=state;gesture.textContent=`${name} ${state}`;if(!['speaking','greeting','explaining','praising','celebrating'].includes(state))stopMouth();return state};
    const startMouth=()=>{if(reducedMotion)return;stopMouth();presence.classList.add('mouth-active');let n=0;presence.dataset.mouth='a';mouthTimer=setInterval(()=>presence.dataset.mouth=['a','o','e','a','rest'][++n%5],125+(n%3)*24)};
    const showSpeech=(text,lang='en-US')=>{lastSpeech={text,lang};const target=lang.startsWith('he')?he:en,other=target===en?he:en;target.textContent=text;target.hidden=subtitles==='replay'||(subtitles==='english-hidden'&&target===en);if(other.textContent&&subtitles!=='all')other.hidden=true};
    const reveal=()=>{(lastSpeech.lang.startsWith('he')?he:en).hidden=false};
    rootEl.querySelector('.teacher-character').onclick=()=>{reveal();replay(lastSpeech)};
    return{setState,startMouth,stopMouth,showSpeech,reveal,setReplay(fn){replay=fn||(()=>{})},getState:()=>state,getLastSpeech:()=>({...lastSpeech}),destroy(){stopMouth()}};
  }
  return{GEOMETRY,rigMarkup,createController};
});
