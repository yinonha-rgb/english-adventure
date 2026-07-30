(function(root){
  'use strict';

  const TYPES={
    WELCOME:'welcome',
    PICTURE_CHOICE:'picture-choice',
    DRAG_MATCH:'drag-match',
    REPEAT:'repeat-after-teacher',
    MEMORY:'memory',
    SENTENCE:'sentence-builder',
    MOVEMENT:'movement',
    LISTENING:'listening',
    STORY:'story-choice'
  };

  const activity=(id,type,value)=>({
    id,type,difficulty:'easy',skill:'vocabulary',xp:5,
    successFeedback:'Wonderful! Great trying!',
    retryFeedback:'Good try. Look carefully and try once more.',
    ...value
  });

  function createAnimalsLesson(childName='Friend'){
    return{
      id:'daily-animals-interactive-v1',
      title:'Animals',
      titleHe:'חיות',
      words:['dog','cat','bird'],
      activities:[
        activity('animals-welcome',TYPES.WELCOME,{
          teacherInstructionHe:`שלום ${childName}! היום נלמד שמות של חיות. מוכנים?`,
          teacherInstructionEn:`Hello ${childName}! Today we will learn animals. Are you ready?`,
          prompt:'כן, מתחילים',options:['כן, מתחילים'],correctAnswer:'כן, מתחילים',xp:0
        }),
        activity('animals-dog',TYPES.PICTURE_CHOICE,{
          teacherInstructionHe:'Listen carefully. איפה הכלב? לחצו על הכלב.',
          teacherInstructionEn:'Listen carefully. Where is the dog?',
          prompt:'dog',audioText:'dog',
          options:[{value:'dog',label:'🐶',word:'dog'},{value:'cat',label:'🐱',word:'cat'},{value:'bird',label:'🐦',word:'bird'}],
          correctAnswer:'dog',hint:'הכלב אומר woof!'
        }),
        activity('animals-repeat-dog',TYPES.REPEAT,{
          teacherInstructionHe:'Great! עכשיו אמרו: Dog.',
          teacherInstructionEn:'Great! Say: Dog.',
          prompt:'Dog',audioText:'dog',correctAnswer:'dog',
          options:['אמרתי'],hint:'הקשיבו שוב למורה: dog.'
        }),
        activity('animals-listen-cat',TYPES.LISTENING,{
          teacherInstructionHe:'הקשיבו למילה ולחצו על התמונה הנכונה.',
          teacherInstructionEn:'Listen. Tap the cat.',
          prompt:'cat',audioText:'cat',
          options:[{value:'bird',label:'🐦',word:'bird'},{value:'cat',label:'🐱',word:'cat'},{value:'dog',label:'🐶',word:'dog'}],
          correctAnswer:'cat',hint:'החתול אומר meow!'
        }),
        activity('animals-drag',TYPES.DRAG_MATCH,{
          teacherInstructionHe:'גררו כל מילה אל התמונה המתאימה. אפשר גם ללחוץ על מילה ואז על תמונה.',
          teacherInstructionEn:'Match each word to its picture.',
          prompt:'Match the animals',
          pairs:[{value:'dog',label:'🐶'},{value:'cat',label:'🐱'},{value:'bird',label:'🐦'}],
          correctAnswer:['dog','cat','bird'],hint:'אמרו כל מילה בקול וחפשו את החיה.'
        }),
        activity('animals-memory',TYPES.MEMORY,{
          teacherInstructionHe:'זכרו איפה החתול. עוד רגע הקלפים יתהפכו.',
          teacherInstructionEn:'Remember where the cat is.',
          prompt:'cat',
          options:[{value:'dog',label:'🐶'},{value:'cat',label:'🐱'},{value:'bird',label:'🐦'}],
          correctAnswer:'cat',hint:'החתול היה באמצע.'
        }),
        activity('animals-move',TYPES.MOVEMENT,{
          teacherInstructionHe:'עכשיו עמדו ועשו תנועה של ציפור. נפנפו בעדינות בכנפיים!',
          teacherInstructionEn:'Move like a bird. Flap your wings gently!',
          prompt:'🐦',options:['סיימתי'],correctAnswer:'סיימתי',xp:4
        }),
        activity('animals-sentence',TYPES.SENTENCE,{
          teacherInstructionHe:'איזו חיה אתם אוהבים? השלימו את המשפט.',
          teacherInstructionEn:'What animal do you like? Complete the sentence.',
          prompt:'I like…',
          options:['dogs','cats','birds'],correctAnswer:['dogs','cats','birds'],keywordMode:'any',
          hint:'בחרו אחת מהחיות שלמדנו.'
        }),
        activity('animals-final',TYPES.STORY,{
          teacherInstructionHe:'אתגר אחרון! מי יכולה לעוף?',
          teacherInstructionEn:'Final challenge! Which animal can fly?',
          prompt:'Who can fly?',
          options:[{value:'dog',label:'🐶 dog'},{value:'bird',label:'🐦 bird'},{value:'cat',label:'🐱 cat'}],
          correctAnswer:'bird',xp:10,hint:'חפשו חיה עם כנפיים.'
        })
      ]
    };
  }

  const normalize=value=>String(value??'').toLowerCase().trim().replace(/[.!?,]/g,'').replace(/\s+/g,' ');
  function validate(activity,response){
    if(activity.type===TYPES.DRAG_MATCH){
      const expected=(activity.correctAnswer||[]).map(normalize);
      const actual=Array.isArray(response)?response.map(normalize):[];
      return expected.length===actual.length&&expected.every(value=>actual.includes(value));
    }
    const accepted=(Array.isArray(activity.correctAnswer)?activity.correctAnswer:[activity.correctAnswer]).map(normalize);
    const heard=normalize(response);
    return accepted.includes(heard)||accepted.some(value=>heard===`i like ${value}`);
  }
  function transition(state,response,correct){
    const attempts=(state.attempts||0)+1;
    if(correct)return{...state,attempts:0,index:state.index+1,lastResult:'correct'};
    if(attempts>=2)return{...state,attempts,lastResult:'hint',hintVisible:true};
    return{...state,attempts,lastResult:'incorrect'};
  }

  class InteractiveTeacher{
    constructor({lesson,child,progress,onComplete}){
      this.lesson=lesson;
      this.child=child;
      this.progress=progress;
      this.onComplete=onComplete;
      this.state={index:0,attempts:0,results:[],...(progress?.load?.(lesson.id)||{})};
      this.timer=null;
      this.recognition=null;
      this.selectedWord=null;
      this.matched=new Set();
    }
    start(){
      this.ensureUI();
      this.render();
    }
    ensureUI(){
      let modal=document.querySelector('#interactiveTeacher');
      if(!modal){
        modal=document.createElement('div');
        modal.className='modal';
        modal.id='interactiveTeacher';
        modal.setAttribute('role','dialog');
        modal.setAttribute('aria-modal','true');
        modal.setAttribute('aria-labelledby','interactiveTeacherTitle');
        modal.innerHTML=`<article class="panel interactive-panel" data-focus="speaking"><header class="interactive-top"><div class="interactive-teacher-mini" aria-hidden="true">👩‍🏫</div><div class="interactive-child"><strong id="interactiveChildName"></strong><small id="interactiveState" aria-live="polite">המורה מדברת</small></div><div class="interactive-progress" aria-label="התקדמות בשיעור"><span></span></div><button class="btn interactive-pause" id="interactivePause" type="button" aria-label="השהיית השיעור">⏸️</button><button class="close" type="button" data-close aria-label="סגירת החלון">×</button></header><main class="interactive-center" aria-label="אזור הפעילות"><div id="interactiveActivity"></div></main><footer class="interactive-bottom"><div class="interactive-speech" id="interactiveInstruction" aria-live="polite"></div><div class="interactive-vocabulary" id="interactiveVocabulary" aria-label="מילות השיעור"></div><div class="interactive-answer-controls" id="interactiveAnswerControls"></div><p class="interactive-feedback" id="interactiveFeedback" role="status"></p><div class="interactive-tools"><button class="btn" id="interactiveReplay">🔊 שוב</button><button class="btn" id="interactiveHint">💡 רמז</button><button class="danger" id="interactiveEnd">סיום</button></div></footer></article>`;
        document.body.append(modal);
        modal.querySelector('.close').onclick=()=>this.end();
        modal.querySelector('#interactiveReplay').onclick=()=>this.speakCurrent();
        modal.querySelector('#interactiveHint').onclick=()=>this.showHint();
        modal.querySelector('#interactiveEnd').onclick=()=>this.end();
        modal.querySelector('#interactivePause').onclick=()=>this.togglePause();
      }
      this.modal=modal;
      this.modal.querySelector('#interactiveChildName').textContent=this.child?.name||'חבר/ה';
      this.modal.classList.add('open');
      document.body.style.overflow='hidden';
    }
    current(){return this.lesson.activities[this.state.index]}
    save(){
      this.progress?.save?.(this.lesson.id,{...this.state,updatedAt:new Date().toISOString()});
    }
    render(){
      clearTimeout(this.timer);
      const item=this.current();
      if(!item)return this.complete();
      this.matched.clear();
      this.selectedWord=null;
      this.modal.querySelector('.interactive-progress span').style.width=`${Math.round(this.state.index/this.lesson.activities.length*100)}%`;
      this.setInstruction(item.teacherInstructionEn,item.teacherInstructionHe);
      this.modal.querySelector('#interactiveFeedback').textContent='';
      this.modal.querySelector('#interactiveState').textContent='המורה מדברת';
      const host=this.modal.querySelector('#interactiveActivity');
      const controls=this.modal.querySelector('#interactiveAnswerControls');
      host.replaceChildren();
      controls.replaceChildren();
      this.renderVocabulary(item);
      this.renderActivity(item,host,controls);
      this.save();
      this.speakCurrent();
      this.timer=setTimeout(()=>this.speakCurrent('לא נורא, אני אחזור על ההוראה.'),14000);
    }
    speakCurrent(prefix=''){
      const item=this.current();
      if(!item)return;
      clearTimeout(this.timer);
      this.modal.querySelector('.interactive-panel').dataset.focus='speaking';
      const text=[prefix,item.teacherInstructionEn,item.teacherInstructionHe].filter(Boolean).join(' ');
      this.speakSegments(text,.82,()=>{if(this.current()===item){this.modal.querySelector('#interactiveState').textContent='המורה מחכה לתשובה';this.modal.querySelector('.interactive-panel').dataset.focus='answer'}});
    }
    speakSegments(text,rate=.85,onend=()=>{}){
      const Natural=root.EANaturalVoice;
      const segments=Natural?.splitSpeechSegments?.(text,'en-US')||[{text:Natural?.normalizeTextForSpeech?.(text,'en-US')||String(text||''),lang:'en-US'}];
      speechSynthesis?.cancel();
      let index=0;
      const next=()=>{
        const segment=segments[index++];
        if(!segment)return onend();
        const speechText=Natural?.normalizeTextForSpeech?.(segment.text,segment.lang)||segment.text;
        if(!speechText)return next();
        const utterance=new SpeechSynthesisUtterance(speechText);
        utterance.lang=segment.lang;
        utterance.rate=rate;
        utterance.onend=next;
        utterance.onerror=next;
        speechSynthesis?.speak(utterance);
      };
      next();
    }
    setInstruction(english,hebrew=''){
      const box=this.modal.querySelector('#interactiveInstruction');
      box.replaceChildren();
      const en=document.createElement('strong');en.textContent=english||'';box.append(en);
      if(hebrew){const he=document.createElement('small');he.textContent=hebrew;box.append(he)}
    }
    renderVocabulary(item){
      const strip=this.modal.querySelector('#interactiveVocabulary');
      strip.replaceChildren();
      for(const word of this.lesson.words||[]){const card=document.createElement('span');card.className='interactive-word';card.textContent=word;if(String(item.prompt||'').toLowerCase().includes(word))card.classList.add('active');strip.append(card)}
    }
    togglePause(){
      this.paused=!this.paused;
      const button=this.modal.querySelector('#interactivePause');
      button.textContent=this.paused?'▶️':'⏸️';
      button.setAttribute('aria-label',this.paused?'המשך השיעור':'השהיית השיעור');
      if(this.paused){speechSynthesis?.cancel();this.recognition?.abort();this.modal.querySelector('#interactiveState').textContent='השיעור מושהה';this.modal.querySelector('.interactive-panel').dataset.focus='answer'}else this.speakCurrent();
    }
    button(label,value,action){
      const button=document.createElement('button');
      button.className='interactive-choice';
      button.type='button';
      button.innerHTML=label;
      button.onclick=()=>action(value,button);
      return button;
    }
    renderActivity(item,host,controls){
      const pictureTypes=[TYPES.PICTURE_CHOICE,TYPES.LISTENING,TYPES.STORY];
      if(item.type===TYPES.WELCOME){
        host.innerHTML='<div class="movement-demo">🌟</div>';
        controls.append(this.button('כן, מתחילים ▶️',item.correctAnswer,value=>this.answer(value)));
      }else if(pictureTypes.includes(item.type)){
        const grid=document.createElement('div');grid.className='interactive-options';
        item.options.forEach(option=>grid.append(this.button(`<span>${option.label}</span><strong>${option.word||''}</strong>`,option.value,(value,button)=>this.answer(value,button))));
        host.append(grid);
      }else if(item.type===TYPES.REPEAT){
        const word=document.createElement('div');word.className='repeat-word';word.innerHTML=`<span>🐶</span><strong>${item.prompt}</strong>`;
        controls.append(this.button('🎤 דברו למיקרופון','microphone',()=>this.listen()),this.button('✅ אמרתי','אמרתי',()=>this.answer(item.correctAnswer)));
        host.append(word);
      }else if(item.type===TYPES.DRAG_MATCH){
        const targets=document.createElement('div');targets.className='match-targets';
        item.pairs.forEach(pair=>{const target=this.button(`${pair.label}<small>${pair.value}</small>`,pair.value,value=>this.matchTarget(value));target.dataset.target=value;target.ondragover=event=>event.preventDefault();target.ondrop=event=>{event.preventDefault();this.selectedWord=event.dataTransfer.getData('text/plain');this.matchTarget(value)};targets.append(target)});
        const words=document.createElement('div');words.className='match-words';
        item.pairs.slice().reverse().forEach(pair=>{const word=this.button(pair.value,pair.value,value=>{this.selectedWord=value;word.classList.add('selected')});word.draggable=true;word.ondragstart=event=>event.dataTransfer.setData('text/plain',pair.value);words.append(word)});
        host.append(targets,words);
      }else if(item.type===TYPES.MEMORY){
        const grid=document.createElement('div');grid.className='interactive-options memory';
        item.options.forEach(option=>{const card=this.button(option.label,option.value,(value,button)=>this.answer(value,button));card.dataset.value=option.value;grid.append(card)});
        host.append(grid);
        setTimeout(()=>grid.querySelectorAll('button').forEach(card=>{card.textContent='❓';card.classList.add('hidden-card')}),1800);
      }else if(item.type===TYPES.MOVEMENT){
        const move=document.createElement('div');move.className='movement-demo';move.textContent='🐦  3… 2… 1…';
        host.append(move);controls.append(this.button('סיימתי! ⭐',item.correctAnswer,value=>this.answer(value)));
      }else if(item.type===TYPES.SENTENCE){
        const sentence=document.createElement('div');sentence.className='sentence-builder';sentence.innerHTML='<strong>I like …</strong>';
        item.options.forEach(option=>controls.append(this.button(option,option,value=>this.answer(value))));
        host.append(sentence);
      }
    }
    matchTarget(target){
      if(!this.selectedWord)return this.feedback('בחרו קודם מילה.',false);
      if(this.selectedWord===target){
        this.matched.add(target);
        this.modal.querySelector(`[data-target="${target}"]`)?.classList.add('matched');
        this.feedback('התאמה מצוינת!',true);
        this.selectedWord=null;
        if(this.matched.size===this.current().pairs.length)this.answer([...this.matched]);
      }else{
        this.feedback('כמעט! נסו לחבר את המילה לתמונה אחרת.',false);
        this.selectedWord=null;
      }
    }
    listen(){
      const item=this.current(),SR=root.SpeechRecognition||root.webkitSpeechRecognition;
      if(!SR)return this.feedback('זיהוי דיבור אינו זמין. לחצו “אמרתי” כדי להמשיך.',false);
      this.recognition?.abort();
      const recognition=this.recognition=new SR();
      recognition.lang='en-US';
      recognition.interimResults=false;
      this.modal.querySelector('#interactiveState').textContent='המורה מקשיבה';
      recognition.onresult=event=>this.answer(event.results[0][0].transcript);
      recognition.onerror=()=>this.feedback('לא שמעתי בבירור. אפשר לנסות שוב או ללחוץ “אמרתי”.',false);
      try{recognition.start()}catch{this.feedback('המיקרופון אינו זמין. לחצו “אמרתי”.',false)}
    }
    answer(value,button){
      clearTimeout(this.timer);
      const item=this.current(),correct=validate(item,value);
      this.state.results.push({activityId:item.id,correct,response:String(value),at:new Date().toISOString()});
      this.state=transition(this.state,value,correct);
      if(correct){
        button?.classList.add('correct');
        this.feedback(item.successFeedback,true);
        this.save();
        setTimeout(()=>this.render(),850);
      }else{
        button?.classList.add('wrong');
        this.feedback(this.state.hintVisible?`${item.retryFeedback} ${item.hint||''}`:item.retryFeedback,false);
        this.save();
        this.speakCurrent(this.state.hintVisible?item.hint:'');
      }
    }
    feedback(text,positive){
      const box=this.modal.querySelector('#interactiveFeedback');
      box.textContent=text;
      box.dataset.kind=positive?'success':'retry';
      this.setInstruction(text);
      this.modal.querySelector('.interactive-panel').dataset.focus='feedback';
      this.modal.querySelector('#interactiveState').textContent=positive?'המורה מעודדת':'המורה עוזרת';
      this.speakSegments(text,.85);
    }
    showHint(){
      const hint=this.current()?.hint||'הסתכלו שוב ונסו צעד קטן.';
      this.feedback(hint,false);
    }
    complete(){
      clearTimeout(this.timer);
      this.state.completed=true;
      this.state.completedAt=this.state.completedAt||new Date().toISOString();
      this.save();
      const earned=this.lesson.activities.reduce((sum,item)=>sum+(item.xp||0),0);
      this.progress?.complete?.(this.lesson.id,earned);
      const host=this.modal.querySelector('#interactiveActivity');
      host.innerHTML=`<div class="interactive-complete"><div>🏆✨</div><h2>כל הכבוד! סיימתם את השיעור היומי עם המורה</h2><p>למדנו: dog, cat and bird</p><p><strong>+${earned} XP</strong></p><button class="primary" id="interactiveHome">חזרה למסך הבית</button></div>`;
      this.modal.querySelector('#interactiveInstruction').textContent='Great work! Today you learned dog, cat and bird.';
      this.modal.querySelector('#interactiveState').textContent='המורה חוגגת';
      this.speakSegments(`כל הכבוד ${this.child.name}! Today you learned dog, cat and bird.`,.82);
      host.querySelector('#interactiveHome').onclick=()=>this.close();
      this.onComplete?.();
    }
    end(){
      if(confirm('לסיים את הפעילות ולחזור למסך הבית?'))this.close();
    }
    close(){
      clearTimeout(this.timer);
      speechSynthesis?.cancel();
      this.recognition?.abort();
      this.modal.classList.remove('open');
      document.body.style.overflow='';
    }
  }

  const COMPONENTS={
    PictureChoiceActivity:TYPES.PICTURE_CHOICE,
    DragMatchActivity:TYPES.DRAG_MATCH,
    RepeatAfterTeacherActivity:TYPES.REPEAT,
    MemoryActivity:TYPES.MEMORY,
    SentenceBuilderActivity:TYPES.SENTENCE,
    MovementActivity:TYPES.MOVEMENT,
    ListeningActivity:TYPES.LISTENING,
    StoryChoiceActivity:TYPES.STORY
  };

  function startAnimals(options){
    const lesson=createAnimalsLesson(options.child.name);
    const teacher=new InteractiveTeacher({...options,lesson});
    teacher.start();
    return teacher;
  }

  root.EAInteractiveTeacher={TYPES,COMPONENTS,createAnimalsLesson,validate,transition,startAnimals};
})(typeof window!=='undefined'?window:globalThis);
