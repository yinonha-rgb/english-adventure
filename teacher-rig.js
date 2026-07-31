(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EARiggedTeacher=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const GEOMETRY={
    'female-young':{key:'noa',body:'assets/teacher-noa-body-v2.png',expressionBox:[14,0,72,34],mouthBox:[44,15.8,12,4]},
    'male-young':{key:'adam',body:'assets/teacher-adam-body-v2.png',expressionBox:[14,0,72,31],mouthBox:[44,13,12,4]}
  };
  const labels={female:'נועה',male:'אדם'};
  const expressions=['neutral','happy','listening','thinking','encouraging','celebrating'];
  const mouths=['rest','a','e','o','smile'];
  const STATES=Object.freeze(['idle','speak','listen','think','point','wave','celebrate','goodbye']);
  const GESTURES=Object.freeze(['none','wave','point-left','point-right','thumbs-up','open-hands','heart-hands','clap','thinking-pose']);
  const STATE_ALIASES=Object.freeze({speaking:'speak',greeting:'wave',waving:'wave',listening:'listen',waiting:'listen',thinking:'think',pointing:'point',praising:'celebrate',celebrating:'celebrate',happy:'celebrate',encouraging:'encouraging',correcting:'encouraging',paused:'idle'});
  const asset=(key,group,name)=>`assets/teacher-${key}-${group}-${name}-v2.png`;
  const randomBetween=(min,max)=>Math.round(min+Math.random()*(max-min));
  function rigMarkup(character){
    const g=GEOMETRY[character]||GEOMETRY['female-young'],gender=character==='male-young'?'male':'female',name=labels[gender],box=(prefix,values)=>values.map((value,index)=>`--${prefix}-${['x','y','w','h'][index]}:${value}%`).join(';');
    const faces=expressions.map(state=>`<img class="rig-expression rig-expression-${state}" src="${asset(g.key,'expression',state)}" alt="" hidden aria-hidden="true">`).join('');
    const lips=mouths.map(shape=>`<img class="rig-mouth-shape rig-mouth-${shape}" src="${asset(g.key,'mouth',shape)}" alt="" hidden aria-hidden="true">`).join('');
    return `<span class="teacher-rig" style="${box('expr',g.expressionBox)};${box('lip',g.mouthBox)}" data-rig-gender="${gender}" data-motion="still" data-gesture="none" role="img" aria-label="${name}, מורה צעיר${gender==='female'?'ה':''} וידידותי${gender==='female'?'ת':''}"><span class="teacher-rig-canvas"><img class="rig-body" src="${g.body}" alt="">${faces}${lips}</span><i class="teacher-rig-blink" aria-hidden="true"></i><span class="teacher-rig-stars" aria-hidden="true">✦ ★ ✧</span><span class="teacher-gesture-trail" aria-hidden="true"></span></span>`;
  }
  class TeacherController{
    constructor(rootEl,{character='female-young',reducedMotion=false,subtitles='all'}={}){
      this.rootEl=rootEl;this.character=character;this.reducedMotion=reducedMotion;this.subtitles=subtitles;
      this.state='idle';this.gestureName='none';this.lastSpeech={text:'',lang:'en-US'};this.replay=()=>{};
      this.motionTimer=0;this.mouthTimer=0;this.gestureTimer=0;this.frameHandle=0;this.visible=true;
      this.metrics={fps:0,frames:0,updatedAt:0};this.frameSample={started:0,count:0};
      this.onVisibility=()=>this.handleVisibility();
      this.mount();
    }
    mount(){
      const gender=this.character==='male-young'?'male':'female',name=labels[gender];this.name=name;
      this.rootEl.innerHTML=`<section class="teacher-presence teacher-presence-rig" data-state="idle" data-controller-state="idle" data-character="${this.character}" data-mouth="rest" aria-live="polite"><button class="teacher-character" type="button" aria-label="לחצו על ${name} כדי לשמוע שוב">${rigMarkup(this.character)}<span class="teacher-ear" aria-hidden="true">👂</span></button><div class="teacher-bubbles"><p class="speech-bubble en" lang="en"></p><p class="speech-bubble he" lang="he" dir="rtl"></p></div><span class="sr-only teacher-gesture">${name} מוכן${gender==='female'?'ה':''}</span></section>`;
      this.presence=this.rootEl.querySelector('.teacher-presence');this.rig=this.rootEl.querySelector('.teacher-rig');this.en=this.rootEl.querySelector('.speech-bubble.en');this.he=this.rootEl.querySelector('.speech-bubble.he');this.gestureLabel=this.rootEl.querySelector('.teacher-gesture');this.faceNodes=[...this.rootEl.querySelectorAll('.rig-expression')];this.mouthNodes=[...this.rootEl.querySelectorAll('.rig-mouth-shape')];
      this.rootEl.querySelector('.teacher-character').onclick=()=>{this.reveal();this.replay(this.lastSpeech)};
      if(typeof document!=='undefined')document.addEventListener('visibilitychange',this.onVisibility);
      this.visible=typeof document==='undefined'||!document.hidden;this.startFrameMonitor();this.scheduleMotion(320);
    }
    hideAll(items){items.forEach(item=>item.hidden=true)}
    show(selector,items){this.hideAll(items);const item=this.rootEl.querySelector(selector);if(item)item.hidden=false}
    normalizeState(next){return STATE_ALIASES[next]||next||'idle'}
    expressionFor(next){return{listen:'listening',think:'thinking',encouraging:'encouraging',point:'encouraging',celebrate:'celebrating',wave:'happy',goodbye:'happy',speak:''}[next]??''}
    gestureFor(next){return{wave:'wave',point:'point-right',think:'thinking-pose',celebrate:'clap',encouraging:'open-hands',goodbye:'wave'}[next]||'none'}
    setState(next){
      const publicState=next||'idle',normalized=this.normalizeState(publicState);this.state=normalized;
      this.presence.dataset.state=publicState;this.presence.dataset.controllerState=normalized;this.gestureLabel.textContent=`${this.name} ${normalized}`;
      const face=this.expressionFor(normalized);this.hideAll(this.faceNodes);if(face)this.show(`.rig-expression-${face}`,this.faceNodes);
      if(normalized!=='speak')this.stopMouth();
      this.gesture(this.gestureFor(normalized),normalized==='celebrate'?1700:normalized==='wave'?1450:0);
      this.scheduleMotion(80);return normalized;
    }
    gesture(name='none',duration=0){
      clearTimeout(this.gestureTimer);this.gestureName=GESTURES.includes(name)?name:'none';this.rig.dataset.gesture=this.gestureName;
      if(duration&&!this.reducedMotion)this.gestureTimer=setTimeout(()=>{this.gestureName='none';this.rig.dataset.gesture='none'},duration);
      return this.gestureName;
    }
    react(event){
      const action={correct:['celebrate','clap'],success:['celebrate','thumbs-up'],wrong:['encouraging','point-right'],retry:['encouraging','open-hands'],question:['point','point-right'],hello:['wave','wave'],goodbye:['goodbye','wave']}[event];
      if(!action)return this.setState(event);this.setState(action[0]);this.gesture(action[1],event==='correct'?1800:1400);return this.state;
    }
    motionChoices(){
      if(this.state==='speak')return['talk-left','talk-right','brow','gaze-left','gaze-right','shoulder'];
      if(this.state==='listen')return['listen-nod','gaze-center','blink','head-left','head-right'];
      if(this.state==='think')return['gaze-up','head-right','blink','brow'];
      if(this.state==='celebrate')return['happy-bounce','blink','shoulder'];
      return['breathe','blink','gaze-left','gaze-right','head-left','head-right','shoulder','weight-left','weight-right'];
    }
    scheduleMotion(delay=randomBetween(900,2400)){
      clearTimeout(this.motionTimer);if(this.reducedMotion||!this.visible)return;
      this.motionTimer=setTimeout(()=>{
        const choices=this.motionChoices(),motion=choices[Math.floor(Math.random()*choices.length)];this.rig.dataset.motion=motion;
        const activeFor=motion==='blink'?170:randomBetween(520,1050);
        this.motionTimer=setTimeout(()=>{this.rig.dataset.motion='still';this.scheduleMotion(randomBetween(this.state==='speak'?420:900,this.state==='speak'?1050:2700))},activeFor);
      },delay);
    }
    showMouth(shape){this.presence.dataset.mouth=shape;this.show(`.rig-mouth-${shape}`,this.mouthNodes)}
    scheduleMouth(){
      clearTimeout(this.mouthTimer);if(this.reducedMotion||this.state!=='speak'||!this.visible)return;
      const shapes=['a','e','rest','o','a','smile','e'],shape=shapes[Math.floor(Math.random()*shapes.length)];this.showMouth(shape);
      this.mouthTimer=setTimeout(()=>this.scheduleMouth(),randomBetween(92,205));
    }
    startMouth(){if(this.reducedMotion)return;this.state='speak';this.presence.dataset.controllerState='speak';this.presence.classList.add('mouth-active');this.scheduleMouth();this.scheduleMotion(40)}
    stopMouth(){clearTimeout(this.mouthTimer);this.mouthTimer=0;this.presence.classList.remove('mouth-active');this.presence.dataset.mouth='rest';this.hideAll(this.mouthNodes)}
    showSpeech(text,lang='en-US'){this.lastSpeech={text,lang};const target=lang.startsWith('he')?this.he:this.en,other=target===this.en?this.he:this.en;target.textContent=text;target.hidden=this.subtitles==='replay'||(this.subtitles==='english-hidden'&&target===this.en);if(other.textContent&&this.subtitles!=='all')other.hidden=true}
    reveal(){(this.lastSpeech.lang.startsWith('he')?this.he:this.en).hidden=false}
    setReplay(fn){this.replay=fn||(()=>{})}
    handleVisibility(){this.visible=!document.hidden;if(!this.visible){clearTimeout(this.motionTimer);clearTimeout(this.mouthTimer);this.rig.dataset.motion='still'}else{if(this.state==='speak')this.scheduleMouth();this.scheduleMotion(120)}}
    startFrameMonitor(){
      if(typeof requestAnimationFrame!=='function'||this.reducedMotion)return;this.frameSample.started=typeof performance!=='undefined'?performance.now():Date.now();
      const tick=now=>{if(!this.visible){this.frameHandle=requestAnimationFrame(tick);return}this.frameSample.count++;const elapsed=now-this.frameSample.started;if(elapsed>=1000){this.metrics.fps=Math.round(this.frameSample.count*1000/elapsed);this.metrics.frames+=this.frameSample.count;this.metrics.updatedAt=Date.now();this.frameSample={started:now,count:0};if(this.presence)this.presence.dataset.fps=String(this.metrics.fps)}this.frameHandle=requestAnimationFrame(tick)};
      this.frameHandle=requestAnimationFrame(tick);
    }
    getState(){return this.state}
    getLastSpeech(){return{...this.lastSpeech}}
    getMetrics(){return{...this.metrics,state:this.state,gesture:this.gestureName,motion:this.rig?.dataset.motion||'still'}}
    destroy(){clearTimeout(this.motionTimer);clearTimeout(this.mouthTimer);clearTimeout(this.gestureTimer);if(this.frameHandle&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(this.frameHandle);if(typeof document!=='undefined')document.removeEventListener('visibilitychange',this.onVisibility);this.stopMouth()}
  }
  function createController(rootEl,options){return new TeacherController(rootEl,options)}
  return{GEOMETRY,STATES,GESTURES,TeacherController,rigMarkup,createController};
});
