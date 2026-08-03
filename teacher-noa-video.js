/* The parent-supplied Noa recording is an optional greeting/voice preview.
   It never replaces the lesson's dynamic local speech engine. */
(()=>{
  const SRC='assets/teacher-noa-greeting.mp4';
  const style=document.createElement('style');
  style.textContent='.noa-video-preview{display:grid;gap:7px;margin-top:9px}.noa-video-preview video{width:min(230px,100%);border-radius:14px;background:#17203b;box-shadow:0 8px 18px #17203b33}.noa-video-play{border:0;border-radius:12px;background:#d95a93;color:#fff;padding:9px 12px;font-weight:800;cursor:pointer}.teacher-home-avatar.noa-video-home{position:relative;overflow:hidden;background:#17203b}.noa-video-home>video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:2}.noa-video-home>img{visibility:hidden}.noa-video-home button{position:absolute;z-index:3;bottom:7px;inset-inline:7px;border:0;border-radius:10px;background:#d95a93e8;color:#fff;font-size:.78rem;font-weight:800;padding:7px;cursor:pointer}';
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
  function addHomePreview(home){
    if(home.dataset.noaVideoHome==='true'||!home.querySelector('img[src*="teacher-noa"]')) return;
    home.dataset.noaVideoHome='true';home.classList.add('noa-video-home');
    const video=document.createElement('video'),button=document.createElement('button');
    video.src=SRC;video.playsInline=true;video.loop=true;video.muted=true;video.autoplay=true;video.setAttribute('aria-label','סרטון המורה נועה');
    button.type='button';button.textContent='▶ קול של נועה';button.setAttribute('aria-label','הפעלת הקול המקורי של נועה');
    button.addEventListener('click',()=>{if(video.muted){window.speechSynthesis?.cancel?.();video.muted=false;video.play();button.textContent='■ השתקת הקול';}else{video.muted=true;button.textContent='▶ קול של נועה';}});
    home.append(video,button);
  }
  function scanAll(){scan();document.querySelectorAll('.teacher-home-avatar').forEach(addHomePreview);}
  new MutationObserver(scanAll).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',scanAll);
})();
