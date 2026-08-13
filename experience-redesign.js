(function(root){
  'use strict';
  const feature=(icon,he,en)=>{const item=document.createElement('span');item.className='mentor-benefit';item.innerHTML=`<b aria-hidden="true">${icon}</b><span class="copy-he" lang="he">${he}</span><span class="copy-en" lang="en">${en}</span>`;return item};
  const bilingual=(className,he,en)=>`<span class="${className} copy-he" lang="he">${he}</span><span class="${className} copy-en" lang="en">${en}</span>`;
  function teacherIdentityCopy(teacher={}){
    const male=teacher.gender==='male',name=String(teacher.name||'Emily'),nameHe=String(teacher.nameHe||'אמילי').split(/\s+[–-]\s+/)[0];
    return{
      studio:`${name.toUpperCase()} LIVE`,
      readyHe:male?'המורה שלך מוכן':'המורה שלך מוכנה',
      readyEn:`${name} is ready`,
      journeyHe:male?`${nameHe} מסביר בלי לחץ, מקשיב לתשובה ומתקדם רק כשהילד באמת משתתף.`:`${nameHe} מסבירה בלי לחץ, מקשיבה לתשובה ומתקדמת רק כשהילד באמת משתתף.`,
      journeyEn:`${name} explains without pressure, listens to each answer and moves on only after real participation.`
    }
  }
  function ensureIdentityElements(){
    const art=document.querySelector('.teacher-home-art');if(!art)return;
    if(!art.querySelector('.mentor-studio-bar')){const studioBar=document.createElement('div');studioBar.className='mentor-studio-bar';studioBar.setAttribute('aria-hidden','true');studioBar.innerHTML='<i></i><i></i><i></i><span data-teacher-studio-name></span>';art.prepend(studioBar)}
    if(!art.querySelector('.mentor-live-state')){const live=document.createElement('div');live.className='mentor-live-state';live.innerHTML='<i></i><span class="copy-he" lang="he" data-teacher-ready-he></span><span class="copy-en" lang="en" data-teacher-ready-en></span>';art.append(live)}
  }
  function updateTeacher(teacher){
    ensureIdentityElements();
    const copy=teacherIdentityCopy(teacher||root.EATeacherSystem?.defaultProfile?.());
    const values={
      '[data-teacher-studio-name]':copy.studio,
      '[data-teacher-ready-he]':copy.readyHe,
      '[data-teacher-ready-en]':copy.readyEn,
      '[data-teacher-journey-he]':copy.journeyHe,
      '[data-teacher-journey-en]':copy.journeyEn
    };
    for(const [selector,text] of Object.entries(values)){const element=document.querySelector(selector);if(element)element.textContent=text}
    return copy
  }
  function learningJourney(){
    const section=document.createElement('section');section.className='emily-learning-journey';section.setAttribute('aria-labelledby','emilyJourneyTitle');
    section.innerHTML=`<header><span class="eyebrow">${bilingual('','מה קורה בשיעור?','Inside every lesson')}</span><h2 id="emilyJourneyTitle">${bilingual('','מפגש קצר, אישי ומלא השתתפות','A short, personal and active session')}</h2><p><span class="copy-he" lang="he" data-teacher-journey-he></span><span class="copy-en" lang="en" data-teacher-journey-en></span></p></header><ol><li><b aria-hidden="true">👋</b>${bilingual('','שלום אישי','Personal hello')}</li><li><b aria-hidden="true">🎮</b>${bilingual('','משחק ומשימה','Game mission')}</li><li><b aria-hidden="true">🎙️</b>${bilingual('','דיבור והקשבה','Talk and listen')}</li><li><b aria-hidden="true">⭐</b>${bilingual('','סיכום והתקדמות','Reward and review')}</li></ol>`;
    return section;
  }
  function confidenceStrip(){
    const section=document.createElement('section');section.className='emily-confidence';section.setAttribute('aria-label','מידע חשוב להורים');
    section.innerHTML=`<div>🫶 ${bilingual('','סבלנית וללא שיפוטיות','Patient and judgment-free')}</div><div>🌍 ${bilingual('','עברית ואנגלית','Hebrew and English')}</div><div>🛡️ ${bilingual('','ללא פרסומות או מעקב','No ads or tracking')}</div><div>☁️ ${bilingual('','עובדת גם במצב לא מקוון','Works offline too')}</div>`;
    return section;
  }
  function install(){
    const home=document.querySelector('.teacher-home'),art=home?.querySelector('.teacher-home-art'),copy=home?.querySelector('.teacher-home-copy');
    if(!home||!art||!copy||home.dataset.experienceV2)return false;
    home.dataset.experienceV2='true';home.classList.add('mentor-studio');
    ensureIdentityElements();
    const benefits=document.createElement('div');benefits.className='mentor-benefits';benefits.setAttribute('aria-label','יתרונות המורה האישית');benefits.append(feature('💬','מדברת ומקשיבה','Talks and listens'),feature('🧠','זוכרת את ההתקדמות','Remembers progress'),feature('🌍','מסבירה גם בעברית','Explains in Hebrew'));
    const start=copy.querySelector('#dailyLessonBtn');copy.insertBefore(benefits,start);
    document.querySelector('.progress-card')?.classList.add('compact-dashboard');
    document.querySelector('.daily')?.classList.add('compact-dashboard','goal-dashboard');
    document.querySelector('.reviewcard')?.classList.add('mission-review-card');
    document.querySelector('#lessonGrid')?.classList.add('activity-shelf');
    const hero=document.querySelector('.hero'),supporting=document.querySelector('.supporting-label');
    if(hero&&!document.querySelector('.emily-confidence'))hero.after(confidenceStrip());
    if(supporting&&!document.querySelector('.emily-learning-journey'))supporting.before(learningJourney());
    const revealTargets=[...document.querySelectorAll('.emily-confidence,.emily-learning-journey,.reviewcard,.privacy')];
    if('IntersectionObserver'in root&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
      const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('flow-visible');observer.unobserve(entry.target)}}),{threshold:.12});
      revealTargets.forEach(target=>{target.classList.add('flow-observed');observer.observe(target)});
    }else revealTargets.forEach(target=>target.classList.add('flow-visible'));
    updateTeacher(root.EATeacherSystem?.defaultProfile?.());return true;
  }
  const api={install,updateTeacher,teacherIdentityCopy};root.EAExperienceRedesign=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(typeof document==='undefined')return;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  root.addEventListener?.('ea-app-ready',install,{once:true});
})(typeof window!=='undefined'?window:globalThis);
