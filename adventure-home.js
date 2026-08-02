(function(){
  const copy={
    he:{world:'היער הלוחש',mission:'המשימה של היום',ready:'ההרפתקה מחכה!',complete:'הקריסטל זוהר! המשימה הושלמה.',first:'הדרקון הקטן איבד את קריסטל הקסם הראשון. עזרו לו למצוא אותו בעזרת אנגלית!',review:'הדרקון שכח מילת קסם. בואו נזכיר לו ונפתח את השביל הסודי.',returning:'ינשוף היער מצא רמז חדש. דברו באנגלית כדי להוביל את הדרקון אל הקריסטל.',advanced:'שער הטירה נעול. רק מילים באנגלית יכולות לפתוח אותו.',dragon:'פִּיפּ מחכה לצאת איתך להרפתקה!',dragonHappy:'פִּיפּ שמח! בואו נמצא את הקריסטל יחד!',village:'הכפר',forest:'היער',castle:'הטירה',ocean:'האוקיינוס',space:'החלל'},
    en:{world:'Whispering Forest',mission:"Today's mission",ready:'Your adventure is waiting!',complete:'The crystal is glowing! Mission complete.',first:'The baby dragon lost its first magic crystal. Help find it using English!',review:'The dragon forgot a magic word. Help remember it and open the secret path.',returning:'The forest owl found a new clue. Speak English to guide the dragon to the crystal.',advanced:'The castle gate is locked. Only English words can open it.',dragon:'Pip is waiting to adventure with you!',dragonHappy:'Pip is happy! Let’s find the crystal together!',village:'Village',forest:'Forest',castle:'Castle',ocean:'Ocean',space:'Space'}
  };
  function missionFor({lang='he',progress={},completed=false}={}){
    const t=copy[lang]||copy.he,done=(progress.completed||[]).length,mistakes=(progress.mistakes||[]).length+(progress.voiceReview||[]).length;
    if(completed)return{title:t.complete,story:t.ready,state:'complete'};
    if(mistakes)return{title:t.review,story:t.dragon,state:'review'};
    if(!done)return{title:t.first,story:t.dragon,state:'first'};
    if(done>=8)return{title:t.advanced,story:t.dragon,state:'castle'};
    return{title:t.returning,story:t.dragon,state:'forest'};
  }
  function install(){
    const home=document.querySelector('.teacher-home'),art=home?.querySelector('.teacher-home-art'),copyBox=home?.querySelector('.teacher-home-copy');
    if(!home||!art||!copyBox||home.dataset.adventureReady)return;
    home.dataset.adventureReady='true';home.classList.add('living-world');
    art.innerHTML='<div class="world-sky" aria-hidden="true"><i class="world-cloud cloud-one"></i><i class="world-cloud cloud-two"></i><i class="world-star star-one">✦</i><i class="world-star star-two">✧</i></div><div class="world-hills" aria-hidden="true"></div><div class="world-tree tree-left" aria-hidden="true">🌳</div><div class="world-tree tree-right" aria-hidden="true">🌲</div><div class="teacher-home-avatar"></div><button class="dragon-companion" type="button" aria-describedby="dragonMessage"><img src="assets/baby-dragon.svg" alt=""><span class="dragon-name">Pip</span></button><p class="dragon-message" id="dragonMessage" role="status"></p><span class="firefly f1" aria-hidden="true"></span><span class="firefly f2" aria-hidden="true"></span><span class="firefly f3" aria-hidden="true"></span>';
    const start=copyBox.querySelector('#dailyLessonBtn');
    const mission=document.createElement('section');mission.className='daily-mission';mission.setAttribute('aria-live','polite');mission.innerHTML='<span class="mission-label" id="worldName"></span><small id="missionLabel"></small><h2 id="dailyMissionTitle"></h2><p id="dailyMissionStory"></p>';
    copyBox.insertBefore(mission,start);
    const trail=document.createElement('nav');trail.className='world-trail';trail.setAttribute('aria-label','Adventure worlds');trail.innerHTML='<span data-world="village">🏡<small></small></span><span class="active" data-world="forest">🌳<small></small></span><span data-world="castle">🏰<small></small></span><span data-world="ocean">🐠<small></small></span><span data-world="space">🚀<small></small></span>';
    art.append(trail);
    art.querySelector('.dragon-companion').addEventListener('click',()=>{const dragon=art.querySelector('.dragon-companion');dragon.classList.remove('excited');void dragon.offsetWidth;dragon.classList.add('excited');const lang=document.documentElement.lang==='en'?'en':'he';art.querySelector('.dragon-message').textContent=copy[lang].dragonHappy;setTimeout(()=>dragon.classList.remove('excited'),1100)});
  }
  function update({lang='he',progress={},completed=false,teacherName='',childName=''}={}){
    install();const t=copy[lang]||copy.he,m=missionFor({lang,progress,completed}),home=document.querySelector('.teacher-home');if(!home)return m;
    home.dataset.missionState=m.state;
    const set=(s,v)=>{const n=home.querySelector(s);if(n)n.textContent=v};
    set('#worldName',`✦ ${t.world}`);set('#missionLabel',t.mission);set('#dailyMissionTitle',m.title);set('#dailyMissionStory',m.story);set('#dragonMessage',t.dragon);
    ['village','forest','castle','ocean','space'].forEach(key=>set(`[data-world="${key}"] small`,t[key]));
    const dragon=home.querySelector('.dragon-companion');if(dragon)dragon.setAttribute('aria-label',`${t.dragon} ${childName}`.trim());
    if(teacherName)home.style.setProperty('--teacher-name',`"${teacherName}"`);
    return m;
  }
  window.EAAdventureHome={missionFor,install,update};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
