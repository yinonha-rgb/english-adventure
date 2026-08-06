/* Parent-provided welcome video, presented before the learning home screen. */
(()=>{
  const seenKey='ea-entry-video-seen';
  const src='assets/entry-welcome.mp4?v=4.42.9';
  const ENTRY_VIEW='intro';
  const HOME_VIEW='home';
  let page=null,previousBodyOverflow='',backgroundState=[];
  const isolateBackground=()=>{
    backgroundState=[...document.body.children].filter(element=>element!==page&&element instanceof HTMLElement&&!['SCRIPT','STYLE','LINK','TEMPLATE'].includes(element.tagName)).map(element=>({element,inert:element.hasAttribute('inert'),ariaHidden:element.getAttribute('aria-hidden')}));
    backgroundState.forEach(({element})=>{element.setAttribute('inert','');element.setAttribute('aria-hidden','true')});
  };
  const restoreBackground=()=>{
    backgroundState.forEach(({element,inert,ariaHidden})=>{
      if(inert)element.setAttribute('inert','');else element.removeAttribute('inert');
      if(ariaHidden===null)element.removeAttribute('aria-hidden');else element.setAttribute('aria-hidden',ariaHidden);
    });
    backgroundState=[];
  };
  const viewState=view=>({...history.state,eaView:view});
  const setEntryHistory=()=>{
    if(history.state?.eaView!==ENTRY_VIEW)history.replaceState(viewState(ENTRY_VIEW),'',location.href);
  };
  const pushHomeHistory=()=>{
    if(history.state?.eaView!==HOME_VIEW)history.pushState(viewState(HOME_VIEW),'',location.href);
  };
  const style=document.createElement('style');
  style.textContent=`.ea-video-entry{position:fixed;inset:0;z-index:10020;display:grid;place-items:center;padding:clamp(16px,4vw,42px);overflow:auto;background:radial-gradient(circle at 15% 8%,#9ee8df 0,transparent 35%),radial-gradient(circle at 85% 7%,#b5adff 0,transparent 33%),linear-gradient(145deg,#17203b,#344779);color:#fff;direction:rtl}.ea-video-entry-card{width:min(970px,100%);display:grid;grid-template-columns:minmax(280px,1.08fr) minmax(270px,.92fr);gap:clamp(20px,4vw,48px);align-items:center;padding:clamp(20px,4vw,46px);border:1px solid #ffffff55;border-radius:32px;background:#ffffff14;box-shadow:0 28px 85px #060a1a8a;backdrop-filter:blur(14px)}.ea-video-entry-copy{display:grid;gap:15px}.ea-video-entry-kicker{display:inline-flex;justify-self:start;border-radius:999px;padding:7px 12px;background:#ffffff1d;color:#fff6bd;font-weight:900}.ea-video-entry h1{margin:0;font-size:clamp(2.1rem,5vw,4.2rem);line-height:1.03}.ea-video-entry p{margin:0;color:#f0f3ff;font-size:clamp(1rem,2vw,1.2rem);line-height:1.6}.ea-video-entry-actions{display:flex;gap:10px;flex-wrap:wrap}.ea-video-entry button{border:0;min-height:52px;border-radius:16px;padding:12px 18px;font:inherit;font-weight:900;cursor:pointer}.ea-video-entry-start{background:#ffcf51;color:#17203b;box-shadow:0 10px 24px #ffcf5144}.ea-video-entry-enter{background:#fff;color:#263452}.ea-video-entry-sound{background:#ffffff17;color:#fff;border:1px solid #ffffff4f!important}.ea-video-entry-media{position:relative;overflow:hidden;min-height:310px;border-radius:24px;background:#111a33;box-shadow:0 15px 35px #0c102755}.ea-video-entry video{width:100%;height:100%;min-height:310px;object-fit:cover;display:block}.ea-video-entry-caption{position:absolute;inset:auto 12px 12px 12px;padding:9px 12px;border-radius:13px;background:#111a33be;color:#fff;font-weight:800;backdrop-filter:blur(6px)}.ea-video-entry-close{position:absolute;top:14px;inset-inline-end:14px;width:44px!important;min-height:44px!important;padding:0!important;border-radius:50%!important;background:#ffffff2e!important;color:#fff!important;font-size:1.4rem!important}.ea-video-entry button:focus-visible{outline:3px solid #fff;outline-offset:3px}@media(max-width:720px){.ea-video-entry{place-items:start center;padding:14px}.ea-video-entry-card{grid-template-columns:1fr;align-content:start;padding:18px;border-radius:25px}.ea-video-entry-copy{gap:11px}.ea-video-entry-actions{order:0}.ea-video-entry-media{order:1;min-height:180px}.ea-video-entry video{min-height:180px}.ea-video-entry h1{font-size:clamp(1.85rem,9vw,2.65rem)}.ea-video-entry p{font-size:.98rem;line-height:1.45}}@media(prefers-reduced-motion:reduce){.ea-video-entry video{display:none}.ea-video-entry-media{min-height:120px}.ea-video-entry-media:before{content:'Emily';display:grid;place-items:center;height:120px;font-weight:900;font-size:1.6rem}}`;
  document.head.append(style);
  const show=({fromHistory=false}={})=>{
    if(page&&document.body.contains(page))return;
    page=document.createElement('section');
    page.className='ea-video-entry';page.setAttribute('role','dialog');page.setAttribute('aria-modal','true');page.setAttribute('aria-labelledby','eaEntryTitle');
    page.innerHTML=`<div class="ea-video-entry-card"><button class="ea-video-entry-close" type="button" aria-label="סגירת חלון">×</button><div class="ea-video-entry-copy"><span class="ea-video-entry-kicker">✨ ברוכים הבאים להרפתקה</span><h1 id="eaEntryTitle">מוכנים לגלות אנגלית בדרך חדשה?</h1><p>המורה מחכה להתחיל איתך הרפתקה קצרה, משחקית ומותאמת במיוחד לך.</p><div class="ea-video-entry-actions"><button class="ea-video-entry-start" type="button">🎙️ התחלת השיעור היומי</button><button class="ea-video-entry-enter" type="button">כניסה לאתר</button><button class="ea-video-entry-sound" type="button" aria-pressed="false">🔊 הפעלת קול</button></div></div><div class="ea-video-entry-media"><video muted autoplay loop playsinline preload="metadata" aria-label="סרטון פתיחה"><source src="${src}" type="video/mp4"></video><div class="ea-video-entry-caption">המורה מחכה לך כאן</div></div></div>`;
    const video=page.querySelector('video');
    video.controls=false;
    video.muted=false;
    video.defaultMuted=false;
    video.volume=1;
    const close=({pushHistory=true}={})=>{
      sessionStorage.setItem(seenKey,'1');
      document.removeEventListener('keydown',onKeydown);
      page?.remove();
      page=null;
      restoreBackground();
      document.body.style.overflow=previousBodyOverflow;
      if(pushHistory)pushHomeHistory();
      const target=document.querySelector('.daily-start,#dailyLessonBtn');
      requestAnimationFrame(()=>{scrollTo(0,0);try{target?.focus?.({preventScroll:true})}catch{target?.focus?.()}});
    };
    const onKeydown=event=>{
      if(!page||!document.body.contains(page))return;
      if(event.key==='Escape'){event.preventDefault();close();return}
      if(event.key!=='Tab')return;
      const controls=[...page.querySelectorAll('button')].filter(control=>!control.hidden&&!control.disabled);
      if(!controls.length)return;
      const first=controls[0],last=controls[controls.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
    };
    page.querySelector('.ea-video-entry-close').addEventListener('click',close);
    page.querySelector('.ea-video-entry-enter').addEventListener('click',close);
    page.querySelector('.ea-video-entry-start').addEventListener('click',()=>{close();setTimeout(()=>document.querySelector('.daily-start,#dailyLessonBtn')?.click(),0);});
    const sound=page.querySelector('.ea-video-entry-sound');
    sound.hidden=true;
    sound.textContent='▶️ הפעלת הפתיח עם קול';
    sound.addEventListener('click',event=>{
      event.stopImmediatePropagation();
      const enableSound=video.muted;
      video.muted=!enableSound;
      video.defaultMuted=!enableSound;
      video.volume=1;
      if(enableSound)video.currentTime=0;
      sound.setAttribute('aria-pressed',String(enableSound));
      sound.textContent=enableSound?'🔇 השתקת קול':'▶️ הפעלת הפתיח עם קול';
      video.play().catch(()=>{sound.textContent='▶️ לחצו שוב להפעלת הקול';});
    },true);
    document.addEventListener('keydown',onKeydown);
    previousBodyOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    document.body.append(page);
    isolateBackground();
    if(!fromHistory)setEntryHistory();
    video.load();
    const unlockSound=()=>{
      video.muted=false;
      video.defaultMuted=false;
      video.volume=1;
      video.play().catch(()=>{});
      const caption=page.querySelector('.ea-video-entry-caption');
      if(caption)caption.textContent='המורה מחכה לך כאן';
    };
    video.play().catch(()=>{
      video.muted=true;
      video.play().catch(()=>{});
      const caption=page.querySelector('.ea-video-entry-caption');
      if(caption)caption.textContent='געו במסך להפעלת הקול';
      page.addEventListener('pointerdown',unlockSound,{once:true,capture:true});
      page.addEventListener('keydown',unlockSound,{once:true,capture:true});
    });
    page.querySelector('.ea-video-entry-start').focus();
  };
  addEventListener('popstate',event=>{
    if(event.state?.eaView===HOME_VIEW){
      if(page)close({pushHistory:false});
      return;
    }
    show({fromHistory:true});
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>show(),{once:true});else show();
})();
