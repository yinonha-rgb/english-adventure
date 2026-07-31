(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EARiggedTeacher=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const GEOMETRY={
    'female-young':{key:'noa',body:'assets/teacher-noa-body-v2.png',expressionBox:[14,0,72,34],mouthBox:[40,14,20,6]},
    'male-young':{key:'adam',body:'assets/teacher-adam-body-v2.png',expressionBox:[14,0,72,31],mouthBox:[40,12,20,6]}
  };
  const labels={female:'נועה',male:'אדם'};
  const expressions=['neutral','happy','listening','thinking','encouraging','celebrating'];
  const mouths=['rest','a','e','o','smile'];
  const asset=(key,group,name)=>`assets/teacher-${key}-${group}-${name}-v2.png`;
  function rigMarkup(character){
    const g=GEOMETRY[character]||GEOMETRY['female-young'],gender=character==='male-young'?'male':'female',name=labels[gender],box=(prefix,values)=>values.map((value,index)=>`--${prefix}-${['x','y','w','h'][index]}:${value}%`).join(';');
    const faces=expressions.map(state=>`<img class="rig-expression rig-expression-${state}" src="${asset(g.key,'expression',state)}" alt="" hidden aria-hidden="true">`).join('');
    const lips=mouths.map(shape=>`<img class="rig-mouth-shape rig-mouth-${shape}" src="${asset(g.key,'mouth',shape)}" alt="" hidden aria-hidden="true">`).join('');
    return `<span class="teacher-rig" style="${box('expr',g.expressionBox)};${box('lip',g.mouthBox)}" data-rig-gender="${gender}" role="img" aria-label="${name}, מורה צעיר${gender==='female'?'ה':''} וידידותי${gender==='female'?'ת':''}"><span class="teacher-rig-canvas"><img class="rig-body" src="${g.body}" alt="">${faces}${lips}</span><i class="teacher-rig-blink" aria-hidden="true"></i><span class="teacher-rig-stars" aria-hidden="true">✦ ★ ✧</span></span>`;
  }
  function createController(rootEl,{character='female-young',reducedMotion=false,subtitles='all'}={}){
    let state='idle',mouthTimer=0,lastSpeech={text:'',lang:'en-US'},replay=()=>{};
    const gender=character==='male-young'?'male':'female',name=labels[gender];
    rootEl.innerHTML=`<section class="teacher-presence teacher-presence-rig" data-state="idle" data-character="${character}" data-mouth="rest" aria-live="polite"><button class="teacher-character" type="button" aria-label="לחצו על ${name} כדי לשמוע שוב">${rigMarkup(character)}<span class="teacher-ear" aria-hidden="true">👂</span></button><div class="teacher-bubbles"><p class="speech-bubble en" lang="en"></p><p class="speech-bubble he" lang="he" dir="rtl"></p></div><span class="sr-only teacher-gesture">${name} מוכן${gender==='female'?'ה':''}</span></section>`;
    const presence=rootEl.querySelector('.teacher-presence'),en=rootEl.querySelector('.speech-bubble.en'),he=rootEl.querySelector('.speech-bubble.he'),gesture=rootEl.querySelector('.teacher-gesture'),faceNodes=[...rootEl.querySelectorAll('.rig-expression')],mouthNodes=[...rootEl.querySelectorAll('.rig-mouth-shape')];
    const hideAll=items=>items.forEach(item=>item.hidden=true);
    const show=(selector,items)=>{hideAll(items);const item=rootEl.querySelector(selector);if(item)item.hidden=false};
    const expressionFor=next=>({listening:'listening',waiting:'listening',thinking:'thinking',encouraging:'encouraging',correcting:'encouraging',praising:'happy',celebrating:'celebrating',greeting:'happy',waving:'happy'}[next]||'');
    const stopMouth=()=>{clearInterval(mouthTimer);mouthTimer=0;presence.classList.remove('mouth-active');presence.dataset.mouth='rest';hideAll(mouthNodes)};
    const setState=next=>{state=next||'idle';presence.dataset.state=state;gesture.textContent=`${name} ${state}`;const face=expressionFor(state);hideAll(faceNodes);if(face)show(`.rig-expression-${face}`,faceNodes);if(!['speaking','greeting','explaining','praising','celebrating'].includes(state))stopMouth();return state};
    const showMouth=shape=>{presence.dataset.mouth=shape;show(`.rig-mouth-${shape}`,mouthNodes)};
    const startMouth=()=>{if(reducedMotion)return;stopMouth();presence.classList.add('mouth-active');let n=0;showMouth('a');mouthTimer=setInterval(()=>showMouth(['a','e','o','smile','rest'][++n%5]),125+(n%3)*24)};
    const showSpeech=(text,lang='en-US')=>{lastSpeech={text,lang};const target=lang.startsWith('he')?he:en,other=target===en?he:en;target.textContent=text;target.hidden=subtitles==='replay'||(subtitles==='english-hidden'&&target===en);if(other.textContent&&subtitles!=='all')other.hidden=true};
    const reveal=()=>{(lastSpeech.lang.startsWith('he')?he:en).hidden=false};
    rootEl.querySelector('.teacher-character').onclick=()=>{reveal();replay(lastSpeech)};
    return{setState,startMouth,stopMouth,showSpeech,reveal,setReplay(fn){replay=fn||(()=>{})},getState:()=>state,getLastSpeech:()=>({...lastSpeech}),destroy(){stopMouth()}};
  }
  return{GEOMETRY,rigMarkup,createController};
});
