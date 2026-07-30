(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.EATeacherSystem=api})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  class TeacherProfile{
    constructor({id,name,nameHe,choiceLabel=name,choiceLabelHe=nameHe,character,voiceGender,age,personality=[],accent='#6552a5',role='tutor',description='',descriptionHe='',enabled=true}){
      Object.assign(this,{id,name,nameHe,choiceLabel,choiceLabelHe,character,voiceGender,age,personality:Object.freeze([...personality]),accent,role,description,descriptionHe,enabled});
      Object.freeze(this);
    }
  }

  const CATALOG=[
    new TeacherProfile({id:'noa',name:'Noa',nameHe:'המורה נועה',choiceLabel:'Young Female Teacher — Noa',choiceLabelHe:'מורה צעירה — נועה',character:'noa',voiceGender:'girl',age:29,personality:['encouraging','patient','positive','playful','calm'],accent:'#8b57a5',description:'Warm, creative and encouraging',descriptionHe:'חמה, יצירתית ומעודדת'}),
    new TeacherProfile({id:'daniel',name:'Daniel',nameHe:'המורה דניאל',choiceLabel:'Young Male Teacher — Daniel',choiceLabelHe:'מורה צעיר — דניאל',character:'daniel',voiceGender:'boy',age:31,personality:['encouraging','patient','positive','playful','calm','energetic'],accent:'#27766f',description:'Energetic, patient and friendly',descriptionHe:'אנרגטי, סבלני וידידותי'})
  ];
  const byId=id=>CATALOG.find(profile=>profile.id===id&&profile.enabled)||null;
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
    settings(base={}){return{...base,childGender:this.profile.voiceGender}}
  }

  class TeacherRenderer{
    constructor(host,{teacherId='noa',reducedMotion=false,subtitles='replay'}={}){
      this.host=host;
      this.profile=byId(teacherId)||defaultProfile();
      const controller=root.EATeacherVisual?.createController?.(host,{character:this.profile.character,reducedMotion,subtitles});
      this.animation=new TeacherAnimationController(controller);
      host?.setAttribute?.('data-teacher-id',this.profile.id);
      host?.style?.setProperty?.('--teacher-accent',this.profile.accent);
    }
    setReplay(handler){this.animation.controller?.setReplay?.(handler)}
    destroy(){this.animation.destroy()}
  }

  function createLessonTeacher(host,options={}){return new TeacherRenderer(host,options)}
  function selectionMarkup(selected='',lang='he'){
    return CATALOG.map(profile=>`<button class="teacher-choice${selected===profile.id?' selected':''}" type="button" data-teacher-choice="${profile.id}" aria-pressed="${selected===profile.id}" style="--teacher-accent:${profile.accent}"><span class="teacher-choice-art" aria-hidden="true">${root.EATeacherVisual?.characterSvg?.(profile.character)||''}</span><strong>${lang==='he'?profile.choiceLabelHe:profile.choiceLabel}</strong><small>${lang==='he'?profile.descriptionHe:profile.description}</small><span class="teacher-choice-check">${selected===profile.id?'✓':''}</span></button>`).join('');
  }
  function bindSelection(host,{selected='',lang='he',onSelect=()=>{}}={}){
    host.innerHTML=selectionMarkup(selected,lang);
    host.querySelectorAll('[data-teacher-choice]').forEach(button=>button.addEventListener('click',()=>onSelect(byId(button.dataset.teacherChoice))));
  }

  return{TeacherProfile,TeacherRenderer,TeacherAnimationController,TeacherVoiceManager,TeacherEmotionController,CATALOG,byId,defaultProfile,createLessonTeacher,selectionMarkup,bindSelection};
});
