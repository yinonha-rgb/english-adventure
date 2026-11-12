(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.EATeacherVideoMotion=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SOURCES=Object.freeze({
    speaking:'assets/emily-greeting-flow-v1.mp4',
    listening:'assets/emily-listening-flow-v1.mp4'
  });
  const SRC=SOURCES.speaking;
  const VIDEO_STATES=['idle','greeting','waving','wave','speaking','pointing','listening','waiting','thinking','encouraging','celebrating','paused','goodbye'];
  function eligible({character,state,reducedMotion,hidden,speaking,introSpeaking=false,played=false}){
    return character==='female-young'&&!reducedMotion&&!hidden;
  }
  function sourceFor({state='idle',speaking=false}={}){
    if(speaking||['greeting','speaking','explaining','encouraging','celebrating','waving','wave','goodbye'].includes(state))return SOURCES.speaking;
    return SOURCES.listening;
  }
  function labelFor({state='idle',speaking=false}={}){
    if(speaking||['greeting','speaking','explaining'].includes(state))return 'אמילי מדברת';
    if(['listening','waiting','idle'].includes(state))return 'אמילי מקשיבה';
    if(state==='thinking')return 'אמילי חושבת';
    if(['encouraging','celebrating'].includes(state))return 'אמילי מעודדת';
    return 'אמילי איתך';
  }
  function attach(host,controller,{character,reducedMotion=false,preview=true}={}){
    if(!preview)return controller;
    const button=host?.querySelector?.('.teacher-character');
    if(!button||!controller||character!=='female-young')return controller;
    const doc=host.ownerDocument,win=doc.defaultView;
    const video=doc.createElement('video');
    video.className='teacher-rest-video';video.muted=true;video.defaultMuted=true;
    video.loop=true;video.playsInline=true;video.preload='metadata';video.hidden=true;
    video.setAttribute('aria-hidden','true');video.setAttribute('tabindex','-1');
    const status=doc.createElement('span');status.className='teacher-motion-status';status.setAttribute('aria-hidden','true');
    button.append(video,status);
    const media=win.matchMedia('(prefers-reduced-motion: reduce)');
    let state='idle',speaking=false,introSpeaking=false,played=false,failed=false,destroyed=false,active=false,attempt=0;
    function conceal(){video.hidden=true;button.classList.remove('teacher-rest-video-active')}
    function sync(){
      status.textContent=labelFor({state,speaking});
      const wanted=!failed&&!destroyed&&eligible({character,state,speaking,introSpeaking,played,hidden:doc.hidden,reducedMotion:reducedMotion||media.matches||doc.body.classList.contains('ea-reduce-motion')});
      const wantedSource=sourceFor({state,speaking}),sourceChanged=video.getAttribute('src')!==wantedSource;
      if(wanted===active&&!sourceChanged)return;
      active=wanted;const ticket=++attempt;
      if(!wanted){video.pause();conceal();return}
      if(sourceChanged){video.pause();conceal();video.setAttribute('src',wantedSource);video.currentTime=0;video.load()}
      video.playbackRate=speaking?1:.86;
      video.play().then(()=>{
        if(ticket!==attempt||!active||destroyed)return;
        video.hidden=false;button.classList.add('teacher-rest-video-active');
      }).catch(()=>{if(ticket===attempt){failed=true;active=false;conceal()}});
    }
    const onError=()=>{failed=true;sync()};
    const onEnded=()=>{video.currentTime=0;sync()};
    video.addEventListener('error',onError);
    video.addEventListener('ended',onEnded);
    doc.addEventListener('visibilitychange',sync);media.addEventListener('change',sync);
    const observer=new win.MutationObserver(sync);
    observer.observe(doc.body,{attributes:true,attributeFilter:['class']});
    const setState=controller.setState.bind(controller),start=controller.startMouth.bind(controller),stop=controller.stopMouth.bind(controller),destroy=controller.destroy.bind(controller);
    controller.setState=next=>{
      state=next;
      const result=setState(next);sync();return result;
    };
    controller.startMouth=()=>{
      speaking=true;
      // The real lesson starts speaking immediately, before it exposes a greeting
      // state. Treat that first utterance as the one-shot animated introduction.
      introSpeaking=!played&&(state==='idle'||VIDEO_STATES.includes(state));
      sync();return start();
    };
    controller.stopMouth=()=>{introSpeaking=false;speaking=false;const result=stop();sync();return result};
    controller.destroy=()=>{
      destroyed=true;active=false;++attempt;video.pause();conceal();
      doc.removeEventListener('visibilitychange',sync);media.removeEventListener('change',sync);observer.disconnect();
      video.removeEventListener('error',onError);video.removeEventListener('ended',onEnded);video.removeAttribute('src');video.load();status.remove();video.remove();destroy();
    };
    sync();return controller;
  }
  return{SRC,SOURCES,VIDEO_STATES,eligible,sourceFor,labelFor,attach};
});

