/* The parent-supplied Noa recording is an optional greeting/voice preview.
   It never replaces the lesson's dynamic local speech engine. */
(()=>{
  const SRC='assets/teacher-noa-greeting.mp4';
  const style=document.createElement('style');
  style.textContent='.noa-video-preview{display:grid;gap:7px;margin-top:9px}.noa-video-preview video{width:min(230px,100%);border-radius:14px;background:#17203b;box-shadow:0 8px 18px #17203b33}.noa-video-play{border:0;border-radius:12px;background:#d95a93;color:#fff;padding:9px 12px;font-weight:800;cursor:pointer}';
  document.head.append(style);
  function addPreview(presence){
    if(presence.dataset.noaVideoReady==='true') return;
    presence.dataset.noaVideoReady='true';
    const bubbles=presence.querySelector('.teacher-bubbles');
    if(!bubbles) return;
    const box=document.createElement('div');
    box.className='noa-video-preview';
    box.innerHTML=`<video playsinline preload="metadata" aria-label="סרטון המורה נועה"><source src="${SRC}" type="video/mp4"></video><button type="button" class="noa-video-play" aria-label="השמעת הסרטון והקול של נועה">▶ סרטון וקול של נועה</button>`;
    const video=box.querySelector('video'),button=box.querySelector('button');
    button.addEventListener('click',()=>{
      if(!video.paused){video.pause();button.textContent='▶ סרטון וקול של נועה';return;}
      window.speechSynthesis?.cancel?.();
      video.currentTime=0;
      video.muted=false;
      video.play().then(()=>{ button.textContent='■ עצירת הסרטון'; }).catch(()=>{ button.textContent='לא ניתן להפעיל את הסרטון כאן'; });
    });
    video.addEventListener('ended',()=>{button.textContent='▶ סרטון וקול של נועה';});
    bubbles.append(box);
  }
  function scan(){document.querySelectorAll('.teacher-presence-photo[data-character="female-young"]').forEach(addPreview);}
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',scan);
})();
