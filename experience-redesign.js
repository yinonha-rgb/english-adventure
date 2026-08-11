(function(root){
  'use strict';
  const feature=(icon,he,en)=>{const item=document.createElement('span');item.className='mentor-benefit';item.innerHTML=`<b aria-hidden="true">${icon}</b><span class="copy-he" lang="he">${he}</span><span class="copy-en" lang="en">${en}</span>`;return item};
  function install(){
    const home=document.querySelector('.teacher-home'),art=home?.querySelector('.teacher-home-art'),copy=home?.querySelector('.teacher-home-copy');
    if(!home||!art||!copy||home.dataset.experienceV2)return false;
    home.dataset.experienceV2='true';home.classList.add('mentor-studio');
    const studioBar=document.createElement('div');studioBar.className='mentor-studio-bar';studioBar.setAttribute('aria-hidden','true');studioBar.innerHTML='<i></i><i></i><i></i><span>EMILY LIVE</span>';art.prepend(studioBar);
    const live=document.createElement('div');live.className='mentor-live-state';live.innerHTML='<i></i><span class="copy-he" lang="he">המורה שלך מוכנה</span><span class="copy-en" lang="en">Your teacher is ready</span>';art.append(live);
    const benefits=document.createElement('div');benefits.className='mentor-benefits';benefits.setAttribute('aria-label','יתרונות המורה האישית');benefits.append(feature('💬','מדברת ומקשיבה','Talks and listens'),feature('🧠','זוכרת את ההתקדמות','Remembers progress'),feature('🌍','מסבירה גם בעברית','Explains in Hebrew'));
    const start=copy.querySelector('#dailyLessonBtn');copy.insertBefore(benefits,start);
    document.querySelector('.progress-card')?.classList.add('compact-dashboard');
    document.querySelector('.daily')?.classList.add('compact-dashboard','goal-dashboard');
    document.querySelector('.reviewcard')?.classList.add('mission-review-card');
    document.querySelector('#lessonGrid')?.classList.add('activity-shelf');
    return true;
  }
  root.EAExperienceRedesign={install};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  root.addEventListener?.('ea-app-ready',install,{once:true});
})(typeof window!=='undefined'?window:globalThis);
