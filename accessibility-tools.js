(function(root){
  'use strict';

  const DEFAULTS=Object.freeze({
    readableFont:false,
    textScale:1,
    letterSpacing:0,
    highContrast:false,
    readingRuler:false,
    reduceMotion:false
  });

  const COPY={
    he:{
      title:'נגישות וקריאה',button:'♿ נגישות',intro:'אפשר להתאים את התצוגה לקריאה נוחה יותר. ההגדרות נשמרות ומסתנכרנות עם חשבון ההורה.',font:'גופן קריא וברור',scale:'גודל טקסט',spacing:'ריווח בין אותיות',contrast:'ניגודיות גבוהה',ruler:'סרגל קריאה',motion:'הפחתת תנועה',reset:'איפוס הגדרות',normal:'רגיל'
    },
    en:{
      title:'Accessibility and reading',button:'♿ Accessibility',intro:'Adjust the display for comfortable reading. These settings are saved and synchronized with the parent account.',font:'Clear readable font',scale:'Text size',spacing:'Letter spacing',contrast:'High contrast',ruler:'Reading ruler',motion:'Reduce motion',reset:'Reset settings',normal:'Normal'
    }
  };

  const clamp=(value,min,max)=>Math.min(max,Math.max(min,Number(value)||min));
  function normalize(settings={}){
    return{
      readableFont:Boolean(settings.readableFont),
      textScale:clamp(settings.textScale??1,1,1.4),
      letterSpacing:clamp(settings.letterSpacing??0,0,3),
      highContrast:Boolean(settings.highContrast),
      readingRuler:Boolean(settings.readingRuler),
      reduceMotion:Boolean(settings.reduceMotion)
    };
  }

  function ensureStyles(document){
    if(!document||document.querySelector('#eaAccessibilityStyles'))return;
    const style=document.createElement('style');
    style.id='eaAccessibilityStyles';
    style.textContent=`html{font-size:calc(100% * var(--ea-text-scale,1))}body{letter-spacing:var(--ea-letter-spacing,0px)}body.ea-readable-font{font-family:Verdana,"Segoe UI",Arial,sans-serif}body.ea-high-contrast{--ink:#000;--muted:#252525;--bg:#fff;--card:#fff;--p:#3422aa;--p2:#4d35dc;--line:#222;--shadow:0 0 0 2px #222}body.ea-high-contrast .panel,body.ea-high-contrast .teacher-home,body.ea-high-contrast .progress-card,body.ea-high-contrast .daily,body.ea-high-contrast .lesson,body.ea-high-contrast .profilebar{border-color:#222}.ea-reading-ruler{position:fixed;z-index:1600;inset-inline:0;height:42px;top:calc(var(--ea-ruler-y,50vh) - 21px);pointer-events:none;background:#ffe16b42;border-block:2px solid #a56d00;box-shadow:0 -100vh 0 #fff0,0 100vh 0 #fff0}.ea-reading-ruler[hidden]{display:none}.accessibility-settings{display:grid;gap:12px}.accessibility-setting{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px;border:1px solid var(--line);border-radius:15px;background:#f8f6ff}.accessibility-setting label{font-weight:800}.accessibility-setting input[type=checkbox]{width:24px;height:24px;accent-color:var(--p)}.accessibility-setting input[type=range]{width:min(220px,48vw);accent-color:var(--p)}.accessibility-value{min-width:54px;text-align:center;font-weight:900;color:var(--p)}body.ea-reduce-motion *,body.ea-reduce-motion *:before,body.ea-reduce-motion *:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}@media(max-width:620px){.accessibility-setting{align-items:flex-start;flex-direction:column}.accessibility-setting input[type=range]{width:100%}}`;
    document.head.append(style);
  }

  function apply(document,settings={}){
    if(!document)return normalize(settings);
    ensureStyles(document);
    const next=normalize(settings),body=document.body,html=document.documentElement;
    html.style.setProperty('--ea-text-scale',String(next.textScale));
    body.style.setProperty('--ea-letter-spacing',`${next.letterSpacing}px`);
    body.classList.toggle('ea-readable-font',next.readableFont);
    body.classList.toggle('ea-high-contrast',next.highContrast);
    body.classList.toggle('ea-reduce-motion',next.reduceMotion);
    let ruler=document.querySelector('#eaReadingRuler');
    if(!ruler){ruler=document.createElement('div');ruler.id='eaReadingRuler';ruler.className='ea-reading-ruler';ruler.setAttribute('aria-hidden','true');document.body.append(ruler)}
    ruler.hidden=!next.readingRuler;
    return next;
  }

  function mount({document,root:panel,button,settings,onChange,language='he'}={}){
    if(!document||!panel)return null;
    ensureStyles(document);
    let current=apply(document,settings),lang=language==='en'?'en':'he';
    const emit=next=>{current=apply(document,next);onChange?.({...current})};
    const render=()=>{
      const text=COPY[lang];panel.replaceChildren();panel.className='accessibility-settings';
      const checkbox=(key,label)=>{const row=document.createElement('div');row.className='accessibility-setting';const title=document.createElement('label'),input=document.createElement('input');title.textContent=label;input.type='checkbox';input.checked=current[key];input.setAttribute('aria-label',label);input.onchange=()=>emit({...current,[key]:input.checked});row.append(title,input);panel.append(row)};
      const range=(key,label,min,max,step,format)=>{const row=document.createElement('div');row.className='accessibility-setting';const title=document.createElement('label'),wrap=document.createElement('div'),input=document.createElement('input'),value=document.createElement('output');title.textContent=label;input.type='range';input.min=String(min);input.max=String(max);input.step=String(step);input.value=String(current[key]);input.setAttribute('aria-label',label);value.className='accessibility-value';value.textContent=format(current[key]);input.oninput=()=>{const next=Number(input.value);value.textContent=format(next);emit({...current,[key]:next})};wrap.append(input,value);row.append(title,wrap);panel.append(row)};
      checkbox('readableFont',text.font);
      range('textScale',text.scale,1,1.4,.1,value=>value===1?text.normal:`${Math.round(value*100)}%`);
      range('letterSpacing',text.spacing,0,3,.5,value=>value===0?text.normal:`${value}px`);
      checkbox('highContrast',text.contrast);
      checkbox('readingRuler',text.ruler);
      checkbox('reduceMotion',text.motion);
      const reset=document.createElement('button');reset.type='button';reset.className='btn';reset.textContent=text.reset;reset.onclick=()=>{emit(DEFAULTS);render()};panel.append(reset);
      if(button){button.textContent=text.button;button.setAttribute('aria-label',text.title)}
      const heading=document.querySelector('#accessibilityTitle'),intro=document.querySelector('#accessibilityIntro');if(heading)heading.textContent=text.title;if(intro)intro.textContent=text.intro;
    };
    const move=event=>{if(!current.readingRuler)return;const y=event.touches?.[0]?.clientY??event.clientY;if(Number.isFinite(y))document.documentElement.style.setProperty('--ea-ruler-y',`${y}px`)};
    document.addEventListener('pointermove',move,{passive:true});document.addEventListener('touchmove',move,{passive:true});render();
    return{
      getSettings:()=>({...current}),
      setSettings(next){current=apply(document,next);render()},
      setLanguage(next){lang=next==='en'?'en':'he';render()},
      destroy(){document.removeEventListener('pointermove',move);document.removeEventListener('touchmove',move)}
    };
  }

  const api={DEFAULTS,normalize,apply,mount};
  root.EAAccessibility=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
