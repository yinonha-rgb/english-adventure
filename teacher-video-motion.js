(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.EATeacherVideoMotion=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SRC='assets/emily-greeting-flow-v1.mp4';
  const VIDEO_STATES=['greeting','waving','wave'];
  function eligible({character,state,reducedMotion,hidden,speaking}){
    return character==='female-young'&&VIDEO_STATES.includes(state)&&!reducedMotion&&!hidden&&!speaking;
  }
  function attach(host,controller,{character,reducedMotion=false,preview=true}={}){
    if(!preview)return controller;
    const button=host?.querySelector?.('.teacher-character');
    if(!button||!controller||character!=='female-young')return controller;
    const doc=host.ownerDocument,win=doc.defaultView;
    const video=doc.createElement('video');
    video.className='teacher-rest-video';video.muted=true;video.defaultMuted=true;
    video.loop=true;video.playsInline=true;video.preload='none';video.hidden=true;
    video.setAttribute('aria-hidden','true');video.setAttribute('tabindex','-1');
    button.append(video);
    const media=win.matchMedia('(prefers-reduced-motion: reduce)');
    let state='idle',speaking=false,failed=false,destroyed=false,active=false,attempt=0;
    function conceal(){video.hidden=true;button.classList.remove('teacher-rest-video-active')}
    function sync(){
      const wanted=!failed&&!destroyed&&eligible({character,state,speaking,hidden:doc.hidden,reducedMotion:reducedMotion||media.matches||doc.body.classList.contains('ea-reduce-motion')});
      if(wanted===active)return;
      active=wanted;const ticket=++attempt;
      if(!wanted){video.pause();conceal();return}
      if(!video.getAttribute('src'))video.src=SRC;
      video.play().then(()=>{
        if(ticket!==attempt||!active||destroyed)return;
        video.hidden=false;button.classList.add('teacher-rest-video-active');
      }).catch(()=>{if(ticket===attempt){failed=true;active=false;conceal()}});
    }
    const onError=()=>{failed=true;sync()};
    video.addEventListener('error',onError);
    doc.addEventListener('visibilitychange',sync);media.addEventListener('change',sync);
    const observer=new win.MutationObserver(sync);
    observer.observe(doc.body,{attributes:true,attributeFilter:['class']});
    const setState=controller.setState.bind(controller),start=controller.startMouth.bind(controller),stop=controller.stopMouth.bind(controller),destroy=controller.destroy.bind(controller);
    controller.setState=next=>{state=next;const result=setState(next);sync();return result};
    controller.startMouth=()=>{speaking=true;sync();return start()};
    controller.stopMouth=()=>{speaking=false;const result=stop();sync();return result};
    controller.destroy=()=>{
      destroyed=true;active=false;++attempt;video.pause();conceal();
      doc.removeEventListener('visibilitychange',sync);media.removeEventListener('change',sync);observer.disconnect();
      video.removeEventListener('error',onError);video.removeAttribute('src');video.load();video.remove();destroy();
    };
    sync();return controller;
  }
  return{SRC,VIDEO_STATES,eligible,attach};
});
