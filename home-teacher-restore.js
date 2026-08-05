/* The living-world decoration rebuilds the home art area; always restore the chosen teacher portrait. */
(()=>{
  function restore(){
    const home=document.querySelector('.teacher-home');
    const avatar=home?.querySelector('.teacher-home-avatar');
    if(!avatar||avatar.dataset.portraitReady==='true') return;
    const welcome=document.querySelector('#teacherWelcome')?.textContent||'';
    const male=/\bAdam\b|אדם/.test(welcome);
    const source=male?'assets/teacher-adam.png':'assets/teacher-noa.png';
    const label=male?'אדם, המורה שלך':'אמילי, המורה שלך';
    avatar.dataset.portraitReady='true';
    avatar.dataset.teacherId=male?'male-young':'female-young';
    avatar.innerHTML=`<img class="teacher-photo" src="${source}" alt="${label}">`;
  }
  function observe(){
    restore();
    new MutationObserver(restore).observe(document.body,{childList:true,subtree:true});
    setTimeout(restore,50);setTimeout(restore,400);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
})();
