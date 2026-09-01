(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.EATeacherSystem=api})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  class TeacherProfile{
    constructor({id,name,nameHe,choiceLabel=name,choiceLabelHe=nameHe,character,imageAsset=character,spriteAsset='',gender,voiceGender,localeHebrew='he-IL',localeEnglish='en-US',previewHe='',age,personality=[],accent='#6552a5',role='tutor',description='',descriptionHe='',enabled=true}){
      Object.assign(this,{id,name,nameHe,choiceLabel,choiceLabelHe,character,imageAsset,spriteAsset,gender,voiceGender,localeHebrew,localeEnglish,previewHe,age,personality:Object.freeze([...personality]),accent,role,description,descriptionHe,enabled});
      Object.freeze(this);
    }
  }

  const CATALOG=[
    new TeacherProfile({id:'female-young',name:'Emily',nameHe:'אמילי – מורה',choiceLabel:'Emily — Teacher',choiceLabelHe:'אמילי – מורה',character:'female-young',imageAsset:'assets/teacher-noa.png',spriteAsset:'assets/teacher-noa-body-v2.png',gender:'female',voiceGender:'female',localeHebrew:'he-IL',localeEnglish:'en-US',previewHe:'שלום, אני אמילי. אני שמחה ללמוד איתך אנגלית!',age:29,personality:['encouraging','patient','positive','playful','calm'],accent:'#a84f82',description:'Warm, creative and encouraging',descriptionHe:'חמה, סבלנית, יצירתית ומעודדת'}),
    new TeacherProfile({id:'male-young',name:'Adam',nameHe:'אדם – מורה',choiceLabel:'Adam — Teacher',choiceLabelHe:'אדם – מורה',character:'male-young',imageAsset:'assets/teacher-adam.png',spriteAsset:'assets/teacher-adam-body-v2.png',gender:'male',voiceGender:'male',localeHebrew:'he-IL',localeEnglish:'en-US',previewHe:'שלום, אני אדם. אני שמח ללמוד איתך אנגלית!',age:31,personality:['encouraging','patient','positive','playful','calm','energetic'],accent:'#27766f',description:'Energetic, patient and friendly',descriptionHe:'אנרגטי, סבלני, רגוע וידידותי'})
  ];
  const LEGACY_IDS={noa:'female-young',daniel:'male-young'};
  const byId=id=>CATALOG.find(profile=>profile.id===(LEGACY_IDS[id]||id)&&profile.enabled)||null;
  const defaultProfile=()=>CATALOG[0];

  class TeacherAnimationController{
    constructor(controller){this.controller=controller;this.state='idle'}
    set(state){this.state=state;this.controller?.setState?.(state);return state}
    speak(text,lang){this.controller?.showSpeech?.(text,lang);this.controller?.startMouth?.();return this.set('speaking')}
    stopSpeaking(next='listening'){this.controller?.stopMouth?.();return this.set(next)}
    react(category){return this.set(TeacherEmotionController.stateFor(category))}
    destroy(){this.controller?.destroy?.()}
  }

  class TeacherEmotionController{
    static stateFor(category){return {correct:'celebrating','almost-correct':'encouraging','wrong-related':'pointing','completely-unrelated':'encouraging','didnt-answer':'listening','speech-recognition-uncertain':'listening'}[category]||'thinking'}
  }

  class TeacherVoiceManager{
    constructor({profile,voices=[]}={}){this.profile=profile||defaultProfile();this.voices=voices}
    choose(lang,preferred=''){return root.EANaturalVoice?.chooseVoice?.(this.voices,lang,preferred,this.profile.voiceGender)||{voice:null,basic:true,available:[]}}
    settings(base={}){return{...base,teacherVoiceGender:this.profile.voiceGender,childGender:this.profile.voiceGender}}
  }

  class TeacherRenderer{
    constructor(host,{teacherId='female-young',reducedMotion=false,subtitles='replay'}={}){
      this.host=host;
      this.profile=byId(teacherId)||defaultProfile();
      const controller=(this.profile.imageAsset&&root.EATeacherVisual?.createController?root.EATeacherVisual.createController:root.EARiggedTeacher?.createController)?.(host,{character:this.profile.character,imageAsset:this.profile.imageAsset,spriteAsset:this.profile.spriteAsset,reducedMotion,subtitles});
      // Optional video must never prevent the free lesson from starting.
      try{root.EATeacherVideoMotion?.attach?.(host,controller,{character:this.profile.character,reducedMotion})}catch(error){
        if(root.location?.hostname==='127.0.0.1')console.debug('[Teacher video] Using existing teacher',error);
      }
      this.animation=new TeacherAnimationController(controller);
      host?.setAttribute?.('data-teacher-id',this.profile.id);
      host?.style?.setProperty?.('--teacher-accent',this.profile.accent);
    }
    setReplay(handler){this.animation.controller?.setReplay?.(handler)}
    destroy(){this.animation.destroy()}
  }

  function createLessonTeacher(host,options={}){return new TeacherRenderer(host,options)}
  function portraitMarkup(profile){return profile?.imageAsset?.startsWith?.('assets/')?`<img class="teacher-photo" src="${profile.imageAsset}" alt="${profile.nameHe}" loading="eager">`:root.EATeacherVisual?.characterSvg?.(profile?.character)||''}
  function selectionMarkup(selected='',lang='he'){
    const selectedId=byId(selected)?.id||selected;
    return CATALOG.map(profile=>`<article class="teacher-choice${selectedId===profile.id?' selected':''}" data-teacher-card="${profile.id}" style="--teacher-accent:${profile.accent}"><span class="teacher-choice-art">${portraitMarkup(profile)}</span><strong>${lang==='he'?profile.choiceLabelHe:profile.choiceLabel}</strong><small>${lang==='he'?profile.descriptionHe:profile.description}</small><div class="teacher-choice-actions"><button class="btn" type="button" data-teacher-preview="${profile.id}">${lang==='he'?'🔊 השמעת קול':'🔊 Preview voice'}</button><button class="primary" type="button" data-teacher-choice="${profile.id}" aria-pressed="${selectedId===profile.id}">${lang==='he'?'בחירה':'Select'}</button></div><span class="teacher-choice-check">${selectedId===profile.id?'✓':''}</span></article>`).join('');
  }
  async function previewTeacher(profile,lang='he'){const synth=root.speechSynthesis;if(!synth||!root.SpeechSynthesisUtterance)return false;let voices=synth.getVoices?.()||[];if(!voices.length)voices=await new Promise(resolve=>{const done=()=>resolve(synth.getVoices?.()||[]);synth.addEventListener?.('voiceschanged',done,{once:true});setTimeout(done,700)});const locale=lang==='he'?profile.localeHebrew:profile.localeEnglish,text=lang==='he'?profile.previewHe:`Hello, I'm ${profile.name}. I'm happy to learn English with you!`,choice=root.EANaturalVoice?.chooseVoice?.(voices,locale,'',profile.voiceGender),utterance=new root.SpeechSynthesisUtterance(text);utterance.lang=locale;if(choice?.voice)utterance.voice=choice.voice;utterance.pitch=root.EANaturalVoice?.genderPitch?.(profile.voiceGender,choice?.actualGender)||1;if(root.location?.search?.includes('speechDebug=1'))console.debug('[EA Voice]',{teacher:profile.id,requestedGender:profile.voiceGender,voice:choice?.voice?.name||'browser-default',actualGender:choice?.actualGender||'unknown',pitch:utterance.pitch,fallback:choice?.fallbackReason||'matched'});synth.cancel();synth.speak(utterance);return true}
  function bindSelection(host,{selected='',lang='he',onSelect=()=>{},onPreview=previewTeacher}={}){
    host.innerHTML=selectionMarkup(selected,lang);
    host.querySelectorAll('[data-teacher-choice]').forEach(button=>button.addEventListener('click',()=>onSelect(byId(button.dataset.teacherChoice))));
    host.querySelectorAll('[data-teacher-preview]').forEach(button=>button.addEventListener('click',()=>onPreview(byId(button.dataset.teacherPreview),lang)));
  }

  return{TeacherProfile,TeacherRenderer,TeacherAnimationController,TeacherVoiceManager,TeacherEmotionController,CATALOG,LEGACY_IDS,byId,defaultProfile,createLessonTeacher,portraitMarkup,selectionMarkup,previewTeacher,bindSelection};
});
