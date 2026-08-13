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

  const VOICE_ANSWER_TYPES=new Set([
    TYPES.WELCOME,
    TYPES.PICTURE_CHOICE,
    TYPES.REPEAT,
    TYPES.MEMORY,
    TYPES.SENTENCE,
    TYPES.LISTENING,
    TYPES.STORY
  ]);
  const supportsVoiceAnswer=item=>Boolean(item&&VOICE_ANSWER_TYPES.has(item.type));
  const SUCCESS_MESSAGES=[
    'Amazing! You opened the next part of the adventure!',
    'Wonderful! Pip is cheering for you!',
    'Great listening! The magic path is glowing!',
    'You did it! Let’s discover what comes next!'
  ];
  const successMessage=index=>SUCCESS_MESSAGES[Math.abs(Number(index)||0)%SUCCESS_MESSAGES.length];

  const QUESTS=[
    {id:'forest',icon:'🌲',titleHe:'משימת היער הקסום',titleEn:'Magic Forest Mission',welcomeHe:'פיפ צריך את עזרתך! שלושה חברים מהיער איבדו את הדרך. נשתמש במילים באנגלית כדי למצוא אותם. מוכנים?',welcomeEn:'Pip needs your help! Three forest friends are lost. We can find them with English magic words. Are you ready?',completeHe:'הצלחנו! כל חברי היער חזרו הביתה והקריסטל זוהר!',completeEn:'We did it! Every forest friend is home and the crystal is glowing!'},
    {id:'treasure',icon:'🏴‍☠️',titleHe:'מסע אל אי האוצר',titleEn:'Treasure Island Quest',welcomeHe:'מפת האוצר ננעלה! רק שלוש מילות חיות באנגלית יפתחו אותה. מוכנים לצאת לדרך?',welcomeEn:'The treasure map is locked! Three English animal words will open it. Are you ready to sail?',completeHe:'האוצר נמצא! המילים שלכם פתחו את התיבה הסודית!',completeEn:'Treasure found! Your words opened the secret chest!'},
    {id:'space',icon:'🚀',titleHe:'מבצע חילוץ בחלל',titleEn:'Space Rescue Mission',welcomeHe:'שלוש חיות אסטרונאוטיות צריכות עזרה לחזור לחללית. האנגלית שלכם תפעיל את קרן החילוץ. מוכנים?',welcomeEn:'Three animal astronauts need help returning to their ship. Your English powers the rescue beam. Are you ready?',completeHe:'משימת החלל הושלמה! כל האסטרונאוטים בטוחים!',completeEn:'Space mission complete! Every astronaut is safe!'}
  ];
  const MISSION_BEATS={
    forest:['השביל מתחיל לזהור!','מצאנו עקבות קסומים!','פיפ רואה חבר בין העצים!','הקריסטל הראשון התעורר!','דלת סודית נפתחה!','כמעט הגענו הביתה!'],
    treasure:['המפה גילתה חץ חדש!','מצאנו עקבות בחול!','הספינה מתקרבת לאי!','מפתח מוזהב הופיע!','תיבת האוצר רועדת!','האוצר ממש קרוב!'],
    space:['מנוע החללית נדלק!','מצאנו אות מהחלל!','קרן החילוץ מתחזקת!','אסטרונאוט אחד ניצל!','שער הכוכבים נפתח!','החללית בדרך הביתה!']
  };
  function questFor(seed='friend'){
    const value=String(seed),score=[...value].reduce((sum,char)=>((sum*31)+char.charCodeAt(0))>>>0,7);
    return QUESTS[score%QUESTS.length];
  }
  function speechPlan(difficulty,index,item,attempts=0){
    const level=['easy','medium','hard'].includes(difficulty)?difficulty:'easy',welcome=item?.type===TYPES.WELCOME;
    const includeHebrew=welcome||level==='easy'||attempts>0||(level==='medium'&&index<3);
    return includeHebrew?[item?.teacherInstructionHe,item?.teacherInstructionEn].filter(Boolean):[item?.teacherInstructionEn].filter(Boolean);
  }
  function speechMouthShape(text,index=0){
    const sound=String(text||'').slice(Math.max(0,index),Math.max(0,index)+3).toLowerCase();
    if(/[ou]/.test(sound))return'o';
    if(/[ei]/.test(sound))return'e';
    if(/[a]/.test(sound))return'a';
    return'rest';
  }

  const activity=(id,type,value)=>({
    id,type,difficulty:'easy',skill:'vocabulary',xp:5,
    successFeedback:'Wonderful! Great trying!',
    retryFeedback:'Not quite yet. Look carefully and try once more.',
    ...value
  });

  function animalPicture(kind){
    const open=`<svg class="match-animal-svg" viewBox="0 0 120 100" role="img" aria-label="${kind}"><title>${kind}</title>`;
    if(kind==='dog')return`${open}<path d="M26 26 9 8 7 52 30 46Z" fill="#8b542f"/><path d="m94 26 17-18 2 44-23-6Z" fill="#8b542f"/><ellipse cx="60" cy="51" rx="42" ry="38" fill="#d89a58"/><circle cx="45" cy="45" r="5" fill="#263238"/><circle cx="75" cy="45" r="5" fill="#263238"/><ellipse cx="60" cy="62" rx="17" ry="13" fill="#f4d2a6"/><path d="M54 58q6-6 12 0-1 8-6 8t-6-8Z" fill="#38251d"/><path d="M60 66q0 11-10 12m10-12q0 11 10 12" fill="none" stroke="#6d3f29" stroke-width="3" stroke-linecap="round"/></svg>`;
    if(kind==='cat')return`${open}<path d="M22 36 27 5 49 25M98 36 93 5 71 25" fill="#d9823b" stroke="#a95d2a" stroke-width="3"/><ellipse cx="60" cy="52" rx="40" ry="37" fill="#eda658"/><path d="M49 20 57 35M71 20 63 35" stroke="#a95d2a" stroke-width="4" stroke-linecap="round"/><circle cx="45" cy="48" r="5" fill="#263238"/><circle cx="75" cy="48" r="5" fill="#263238"/><path d="m60 59-7 6h14Z" fill="#d35f6d"/><path d="M58 66q-6 8-13 5m17-5q6 8 13 5M45 62 14 57m31 11-32 7m62-13 31-5M75 68l32 7" fill="none" stroke="#6d3f29" stroke-width="2.5" stroke-linecap="round"/></svg>`;
    return`${open}<ellipse cx="56" cy="55" rx="35" ry="28" fill="#55a9df"/><circle cx="79" cy="38" r="19" fill="#75c8ee"/><path d="m96 39 22 9-22 8Z" fill="#f5a623"/><circle cx="84" cy="34" r="4" fill="#263238"/><path d="M52 49q-22 5-19 26 23 4 34-14Z" fill="#337eb6"/><path d="M27 55 6 42l7 24Z" fill="#3f91c8"/><path d="M65 80v12m13-13v13M57 92h13m1 0h14" stroke="#7b5530" stroke-width="3" stroke-linecap="round"/></svg>`;
  }

  function ensureMatchStyles(){
    if(document.querySelector('#interactiveMatchStyles'))return;
    const style=document.createElement('style');
    style.id='interactiveMatchStyles';
    style.textContent=`.interactive-top{grid-template-columns:auto minmax(90px,auto) minmax(100px,1fr) auto auto auto auto}.interactive-timer{white-space:nowrap;padding:5px 9px;border-radius:999px;background:#fff3c7;color:#725300;font-weight:900;font-variant-numeric:tabular-nums}.match-game{width:100%;display:grid;gap:clamp(10px,2vh,18px);align-content:center}.match-targets,.match-words{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(6px,1.4vw,14px);width:100%}.match-targets .interactive-choice,.match-words .interactive-choice{min-width:0;width:100%;margin:0}.match-targets .interactive-choice{min-height:clamp(82px,18vh,150px);padding:6px}.match-picture{display:grid;place-items:center;width:100%;height:clamp(62px,14vh,118px)}.match-animal-svg{display:block;width:100%;height:100%;max-width:150px;overflow:visible;filter:drop-shadow(0 5px 5px #244c6a28)}.match-picture-label{font-size:clamp(.72rem,1.7vw,.95rem);color:#34495e}.match-word{touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none}.match-word.dragging{z-index:20;cursor:grabbing;animation:none!important;box-shadow:0 18px 35px #223c5980;transition:none}.match-word.matched{opacity:.48;text-decoration:line-through}.match-targets .interactive-choice.drop-ready{outline:5px solid #ffe16b;transform:scale(1.04)}@media(max-width:700px){.interactive-top{grid-template-columns:minmax(54px,auto) minmax(36px,1fr) auto auto auto auto}.interactive-teacher-mini{display:none}.interactive-timer{padding:4px 6px;font-size:.72rem}.match-game{gap:8px}.match-targets,.match-words{gap:5px}.match-targets .interactive-choice{min-height:76px}.match-picture{height:58px}.match-picture-label{font-size:.68rem}.match-words .interactive-choice{min-height:44px;padding:6px;font-size:.85rem}}`;
    style.textContent+=`.quest-banner{position:absolute;z-index:8;top:10px;left:50%;translate:-50% 0;width:min(70%,560px);padding:7px 16px;border:2px solid #fff9;border-radius:18px;background:#263b70e8;color:#fff;font-weight:900;text-align:center;box-shadow:0 7px 18px #14244c35;pointer-events:none}.mission-trail{display:flex;justify-content:center;gap:5px;margin-top:5px}.mission-crystal{width:11px;height:11px;rotate:45deg;border:1px solid #fff9;border-radius:2px;background:#ffffff35;transition:.35s}.mission-crystal.found{background:#ffe765;box-shadow:0 0 10px #fff49b;scale:1.18}.mission-burst{position:absolute;z-index:12;left:50%;top:42%;translate:-50% -50%;padding:13px 20px;border-radius:20px;background:#fff9d8;color:#563d00;font-size:clamp(1rem,3vw,1.5rem);font-weight:1000;box-shadow:0 16px 38px #17203b44;animation:missionReward 1.45s ease-out forwards;pointer-events:none}.mission-burst.surprise{background:linear-gradient(135deg,#fff3a4,#ffb95d);font-size:clamp(1.2rem,4vw,1.8rem)}.adventure-stage[data-quest="treasure"]{background:linear-gradient(180deg,#75d9ff 0 55%,#f7d887 55% 70%,#58b9ce 70%)}.adventure-stage[data-quest="space"]{background:radial-gradient(circle at 70% 20%,#786be8 0,#22275e 48%,#111631 100%)}.adventure-stage[data-quest="space"] .stage-hill{background:#8074a8}.adventure-stage[data-quest="space"] .stage-sun{filter:hue-rotate(180deg)}@keyframes missionReward{0%{opacity:0;scale:.35;rotate:-8deg}25%{opacity:1;scale:1.12;rotate:3deg}75%{opacity:1;scale:1}100%{opacity:0;translate:-50% -120%;scale:.9}}@media(max-width:700px){.quest-banner{top:5px;width:72%;padding:5px 9px;font-size:.72rem}.mission-crystal{width:8px;height:8px}}@media(prefers-reduced-motion:reduce){.mission-burst{animation:none;opacity:1}}`;
    document.head.append(style);
  }

  function createAnimalsLesson(childName='Friend',day=new Date().toISOString().slice(0,10)){
    const quest=questFor(`${childName}:${day}`);
    return{
      id:'daily-animals-interactive-v1',
      title:'Animals',
      titleHe:'חיות',
      quest,
      words:['dog','cat','bird'],
      activities:[
        activity('animals-welcome',TYPES.WELCOME,{
          teacherInstructionHe:`שלום ${childName}! ${quest.welcomeHe}`,
          teacherInstructionEn:`Hello ${childName}! ${quest.welcomeEn}`,
          prompt:'כן, מתחילים',options:['כן, מתחילים'],correctAnswer:'כן, מתחילים',
          acceptedAnswers:['yes','ready','I am ready',"I'm ready","let's start","let's go",'okay','ok','כן','בטח','מוכן','מוכנה','מוכנים','מוכנות','אני מוכן','אני מוכנה','אפשר להתחיל','מתחילים','קדימה','יאללה'],xp:0
        }),
        activity('animals-dog',TYPES.PICTURE_CHOICE,{
          teacherInstructionHe:'Listen carefully. איפה הכלב? לחצו על הכלב.',
          teacherInstructionEn:'Listen carefully. Where is the dog?',
          prompt:'dog',audioText:'dog',
          options:[{value:'dog',label:'🐶',word:'dog'},{value:'cat',label:'🐱',word:'cat'},{value:'bird',label:'🐦',word:'bird'}],
          correctAnswer:'dog',acceptedAnswers:['dog','כלב','הכלב'],hint:'הכלב אומר woof!'
        }),
        activity('animals-repeat-dog',TYPES.REPEAT,{
          teacherInstructionHe:'Great! עכשיו אמרו: Dog.',
          teacherInstructionEn:'Great! Say: Dog.',
          prompt:'Dog',audioText:'dog',correctAnswer:'dog',acceptedAnswers:['dog','כלב','הכלב'],
          options:['אמרתי'],hint:'הקשיבו שוב למורה: dog.'
        }),
        activity('animals-listen-cat',TYPES.LISTENING,{
          teacherInstructionHe:'הקשיבו למילה ולחצו על התמונה הנכונה.',
          teacherInstructionEn:'Listen. Tap the cat.',
          prompt:'cat',audioText:'cat',
          options:[{value:'bird',label:'🐦',word:'bird'},{value:'cat',label:'🐱',word:'cat'},{value:'dog',label:'🐶',word:'dog'}],
          correctAnswer:'cat',acceptedAnswers:['cat','חתול','החתול'],hint:'החתול אומר meow!'
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
          correctAnswer:'cat',acceptedAnswers:['cat','חתול','החתול'],hint:'החתול היה באמצע.'
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
          options:['dogs','cats','birds'],correctAnswer:['dogs','cats','birds'],acceptedAnswers:['dogs','cats','birds','כלב','כלבים','חתול','חתולים','ציפור','ציפורים','אני אוהב כלבים','אני אוהבת כלבים','אני אוהב חתולים','אני אוהבת חתולים','אני אוהב ציפורים','אני אוהבת ציפורים'],keywordMode:'any',
          hint:'בחרו אחת מהחיות שלמדנו.'
        }),
        activity('animals-final',TYPES.STORY,{
          teacherInstructionHe:'אתגר אחרון! מי יכולה לעוף?',
          teacherInstructionEn:'Final challenge! Which animal can fly?',
          prompt:'Who can fly?',
          options:[{value:'dog',label:'🐶 dog'},{value:'bird',label:'🐦 bird'},{value:'cat',label:'🐱 cat'}],
          correctAnswer:'bird',acceptedAnswers:['bird','ציפור','הציפור'],xp:10,hint:'חפשו חיה עם כנפיים.'
        })
      ]
    };
  }

  const normalize=value=>String(value??'').toLowerCase().trim().replace(/[.!?,]/g,'').replace(/\s+/g,' ');
  const containsHebrew=value=>/[\u0590-\u05ff]/.test(String(value||''));
  const englishAnswer=item=>String(Array.isArray(item?.correctAnswer)?item.correctAnswer[0]:item?.correctAnswer||'').trim();
  function requiresEnglishPractice(activity,response){
    return Boolean(activity&&activity.type!==TYPES.WELCOME&&containsHebrew(response)&&englishAnswer(activity)&&validate(activity,response));
  }
  function probableSpeechEcho(heard,spoken,elapsedMs=Infinity,onsetDelayMs=Infinity){
    if(elapsedMs>3200)return false;
    const answer=normalize(heard),teacher=normalize(spoken);
    const answerTokens=answer.split(' ').filter(Boolean),teacherTokens=teacher.split(' ').filter(Boolean);
    if(!answerTokens.length||!teacherTokens.length)return false;
    // A very early exact fragment is normally the device speaker feeding the
    // teacher's own voice back into Chrome. It must never earn child XP.
    if(teacher.includes(answer))return answerTokens.length>=4||onsetDelayMs<=500;
    if(answerTokens.length<4||teacherTokens.length<4)return false;
    const teacherSet=new Set(teacherTokens),overlap=answerTokens.filter(token=>teacherSet.has(token)).length;
    return overlap/answerTokens.length>=.75;
  }
  function validateLegacy(activity,response){
    if(activity.type===TYPES.WELCOME){
      const heard=normalize(response),accepted=(activity.acceptedAnswers||[activity.correctAnswer]).map(normalize);
      return accepted.includes(heard);
    }
    if(activity.type===TYPES.DRAG_MATCH){
      const expected=(activity.correctAnswer||[]).map(normalize);
      const actual=Array.isArray(response)?response.map(normalize):[];
      return expected.length===actual.length&&expected.every(value=>actual.includes(value));
    }
    const accepted=[...(Array.isArray(activity.correctAnswer)?activity.correctAnswer:[activity.correctAnswer]),...(activity.acceptedAnswers||[])].map(normalize);
    const heard=normalize(response);
    return accepted.includes(heard)||accepted.some(value=>heard===`i like ${value}`)||accepted.some(value=>heard===`אני אוהב ${value}`||heard===`אני אוהבת ${value}`);
  }
  function validationSpecFor(activity){
    const expected=(Array.isArray(activity.correctAnswer)?activity.correctAnswer:[activity.correctAnswer]).filter(Boolean);
    return{
      lessonId:'daily-animals-interactive-v1',exerciseId:activity.id,
      kind:activity.type===TYPES.SENTENCE?'sentence':'single-word',difficulty:activity.difficulty||'easy',
      expectedAnswers:expected,acceptedSynonyms:activity.acceptedAnswers||[],
      pronunciationVariations:activity.pronunciationVariations||[],recognitionAlternatives:activity.recognitionAlternatives||[],
      requiredKeywords:expected,keywordMode:activity.keywordMode||(expected.length>1?'any':'all'),
      minimumThreshold:activity.minimumThreshold||.78,question:activity.teacherInstructionEn||activity.prompt||'',
      hints:activity.hint?[activity.hint]:[]
    };
  }
  function validationResult(activity,response){
    if(activity.type===TYPES.WELCOME||activity.type===TYPES.DRAG_MATCH){
      const valid=validateLegacy(activity,response);
      return{valid,reason:valid?'approved':'unrelated'};
    }
    const valid=validateLegacy(activity,response);
    if(valid)return{valid:true,reason:'approved'};
    const centralized=root.EATeacherCore?.validateAnswer?.(response,validationSpecFor(activity));
    if(centralized?.valid)return centralized;
    const accepted=[...(Array.isArray(activity.correctAnswer)?activity.correctAnswer:[activity.correctAnswer]),...(activity.acceptedAnswers||[])].map(normalize);
    const heard=normalize(response),safeWords=new Set(['a','an','the','it','is','its','this','that','answer','word']);
    const wrapped=accepted.some(value=>{const wanted=value.split(' ').filter(Boolean),heardWords=heard.split(' ').filter(Boolean);return wanted.length===1&&heardWords.includes(value)&&heardWords.every(word=>word===value||safeWords.has(word))});
    return wrapped?{valid:true,reason:'approved'}:(centralized||{valid:false,reason:'unrelated'});
  }
  function validate(activity,response){return validationResult(activity,response).valid}
  function transition(state,response,correct){
    const attempts=(state.attempts||0)+1;
    if(correct)return{...state,attempts:0,index:state.index+1,lastResult:'correct'};
    if(attempts>=2)return{...state,attempts,lastResult:'hint',hintVisible:true};
    return{...state,attempts,lastResult:'incorrect'};
  }

  class InteractiveTeacher{
    constructor({lesson,child,progress,onComplete,teacherId}){
      this.lesson=lesson;
      this.child=child;
      this.progress=progress;
      this.onComplete=onComplete;
      this.teacherId=teacherId||child?.teacherId||'female-young';
      this.teacherProfile=root.EATeacherSystem?.byId?.(this.teacherId);
      this.teacherGender=this.teacherProfile?.gender||'female';
      this.state={index:0,attempts:0,results:[],...(progress?.load?.(lesson.id)||{})};
      this.englishPromptAttempts={};
      this.timer=null;
      this.lessonTimerId=null;
      this.lessonRemainingSeconds=Number(this.state.lessonRemainingSeconds)||600;
      this.lessonTimerLast=0;
      this.paused=false;
      this.pendingRender=false;
      this.answerLocked=true;
      this.recognition=null;
      this.recognitionGeneration=0;
      this.microphoneWarmupAttempted=false;
      this.cameraStartPromise=null;
      this.closed=false;
      this.autoListeningActivityId=null;
      this.lastSpokenText='';
      this.lastSpeechEndedAt=0;
      this.difficulty=root.EAClassroomTools?.difficultyForChild?.(child,progress?.load?.(`${lesson.id}:difficulty`)?.value)||'easy';
      this.speechDebug={microphone:'STOPPED',recognition:'STOPPED',lastTranscript:'—',lessonState:'idle',events:[]};
      this.selectedWord=null;
      this.matched=new Set();
      this.visual=null;
    }
    teacherText(female,male){return this.teacherGender==='male'?male:female}
    async start(){
      this.closed=false;
      this.ensureUI();
      this.startLessonTimer();
      // A first-time getUserMedia request can stay pending until the family
      // answers the browser prompt.  The camera is useful, but it must never
      // hold the teacher, visible controls or text fallback hostage.
      this.render();
      void this.prepareMicrophone();
    }
    async prepareMicrophone(){
      // Start the browser permission flow from the lesson-start gesture.  The
      // stream is immediately released: SpeechRecognition owns the real turn.
      if(this.microphoneWarmupAttempted||!root.navigator?.mediaDevices?.getUserMedia)return;
      this.microphoneWarmupAttempted=true;
      try{
        if(this.cameraStartPromise){
          await this.cameraStartPromise;
          if(this.closed)return;
          if(this.camera?.microphonePermissionPrepared){
            this.speechLog('microphone permission prepared by camera');
            return;
          }
          this.speechLog('camera did not prepare microphone','requesting audio separately');
        }
        const stream=await root.navigator.mediaDevices.getUserMedia({audio:true});
        stream.getTracks?.().forEach(track=>track.stop());
        this.speechLog('microphone ready for automatic listening');
      }catch(error){this.speechLog('microphone warmup unavailable',error?.name||'unknown')}
    }
    shouldAutoListen(item){
      return supportsVoiceAnswer(item)&&!this.paused&&this.autoListeningActivityId!==item.id;
    }
    ensureUI(){
      ensureMatchStyles();
      let modal=document.querySelector('#interactiveTeacher');
      if(!modal){
        modal=document.createElement('div');
        modal.className='modal';
        modal.id='interactiveTeacher';
        modal.setAttribute('role','dialog');
        modal.setAttribute('aria-modal','true');
        modal.setAttribute('aria-labelledby','interactiveTeacherTitle');
        modal.innerHTML=`<article class="panel interactive-panel" data-focus="speaking" data-teacher-state="speaking"><header class="interactive-top"><div class="interactive-teacher-mini" aria-hidden="true">✨</div><div class="interactive-child"><strong id="interactiveChildName"></strong><small id="interactiveState" aria-live="polite">המורה מדברת</small></div><div class="interactive-progress" aria-label="התקדמות בשיעור"><span></span></div><div id="interactiveDifficultyHost"></div><output class="interactive-timer" id="interactiveTimer" aria-live="off">⏳ 10:00</output><button class="btn interactive-camera" id="interactiveCameraToggle" type="button" aria-label="הפעלת מצלמת הילד" aria-pressed="false">📷</button><button class="btn interactive-pause" id="interactivePause" type="button" aria-label="השהיית השיעור">⏸️</button><button class="close" type="button" data-close aria-label="סגירת החלון">×</button></header><main class="interactive-center" aria-label="אזור הפעילות"><section class="adventure-stage" aria-label="במת משחק מונפשת"><div class="quest-banner" id="interactiveQuestBanner" role="status"></div><div class="stage-sky" aria-hidden="true"><i></i><i></i><i></i></div><div class="stage-scenery" aria-hidden="true"><span class="stage-sun">☀️</span><span class="stage-hill hill-a"></span><span class="stage-hill hill-b"></span><span class="stage-sparkles">✦ · ✧</span></div><aside class="stage-teacher" id="interactiveTeacherVisual" aria-label="המורה המלווה"></aside><div class="stage-activity" id="interactiveActivity"></div><div class="child-camera-host" id="interactiveChildCamera"></div><figure class="lesson-dragon" id="interactiveDragon" data-state="watching" aria-label="הדרקון החבר"><img src="assets/baby-dragon.svg" alt=""><span aria-hidden="true">✦</span></figure><output class="interactive-live-transcript" id="interactiveLiveTranscript" aria-live="polite" hidden></output><div class="lesson-celebration" id="interactiveCelebration" aria-hidden="true"><i>★</i><i>✦</i><i>●</i><i>★</i><i>✧</i><i>●</i></div><output class="animation-fps" id="interactiveFps" hidden aria-label="קצב אנימציה"></output></section></main><footer class="interactive-bottom"><div class="interactive-speech" id="interactiveInstruction" aria-live="polite"></div><div class="interactive-vocabulary" id="interactiveVocabulary" aria-label="מילות השיעור"></div><div class="interactive-answer-controls" id="interactiveAnswerControls"></div><p class="interactive-feedback" id="interactiveFeedback" role="status"></p><div class="interactive-tools"><button class="btn" id="interactiveReplay">🔊 שוב</button><button class="btn" id="interactiveHint">💡 רמז</button><button class="danger" id="interactiveEnd">סיום</button></div></footer><pre class="teacher-debug" id="interactiveSpeechDebug" hidden aria-label="מצב צינור זיהוי הדיבור"></pre></article>`;
        document.body.append(modal);
        modal.querySelector('.close').onclick=()=>this.end();
        modal.querySelector('#interactiveReplay').onclick=()=>this.speakCurrent();
        modal.querySelector('#interactiveHint').onclick=()=>this.showHint();
        modal.querySelector('#interactiveEnd').onclick=()=>this.end();
        modal.querySelector('#interactivePause').onclick=()=>this.togglePause();
        root.EAClassroomTools?.mountDifficulty?.(document,modal.querySelector('#interactiveDifficultyHost'),this.difficulty,value=>{
          this.difficulty=value;
          this.progress?.save?.(`${this.lesson.id}:difficulty`,{value,updatedAt:new Date().toISOString()});
          this.feedback(`רמת השיעור שונתה ל${root.EAClassroomTools.LEVELS[value].label}.`,true,{speak:false});
        });
      }
      this.modal=modal;
      if(!this.camera){
        this.camera=root.EAChildCamera?.create?.(this.modal.querySelector('#interactiveChildCamera'),{button:this.modal.querySelector('#interactiveCameraToggle'),onStatus:(_,message)=>this.feedback(message,false)});
        // This runs in the same gesture that starts the lesson when possible. A browser may
        // still require first-time permission, and failure never blocks the learning flow.
        this.cameraStartPromise=Promise.resolve(this.camera?.start?.()).catch(()=>false);
      }
      const visualHost=this.modal.querySelector('#interactiveTeacherVisual');
      if(visualHost&&!this.visual){
        const renderer=root.EATeacherSystem?.createLessonTeacher?.(visualHost,{teacherId:this.teacherId,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,subtitles:'replay'});
        this.teacherRenderer=renderer;
        this.visual=renderer?.animation?.controller||root.EATeacherVisual?.createController?.(visualHost,{character:this.teacherId,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,subtitles:'replay'});
        this.visual?.setReplay(last=>this.speakSegments(last.text,.82));
      }
      this.startAnimationMonitor();
      this.modal.querySelector('#interactiveChildName').textContent=this.child?.name||'חבר/ה';
      const quest=this.lesson.quest||questFor(this.child?.name||'friend'),questBanner=this.modal.querySelector('#interactiveQuestBanner'),stage=this.modal.querySelector('.adventure-stage');
      if(questBanner){const title=document.createElement('span');title.textContent=`${quest.icon} ${document.documentElement.lang==='en'?quest.titleEn:quest.titleHe}`;const trail=document.createElement('span');trail.className='mission-trail';trail.setAttribute('aria-label','קריסטלים שנמצאו');for(let index=0;index<this.lesson.activities.length;index++){const crystal=document.createElement('i');crystal.className='mission-crystal';crystal.setAttribute('aria-hidden','true');trail.append(crystal)}questBanner.replaceChildren(title,trail)};
      if(stage)stage.dataset.quest=quest.id;
      this.modal.classList.add('open');
      document.body.style.overflow='hidden';
    }
    current(){return this.lesson.activities[this.state.index]}
    renderLessonTimer(){
      const box=this.modal?.querySelector('#interactiveTimer');
      if(!box)return;
      const minutes=Math.floor(this.lessonRemainingSeconds/60),seconds=this.lessonRemainingSeconds%60;
      box.textContent=`⏳ ${minutes}:${String(seconds).padStart(2,'0')}`;
      box.setAttribute('aria-label',`זמן נותר בשיעור: ${minutes} דקות ו-${seconds} שניות`);
    }
    startLessonTimer(){
      clearInterval(this.lessonTimerId);
      this.lessonTimerLast=Date.now();
      this.renderLessonTimer();
      this.lessonTimerId=setInterval(()=>{
        if(this.paused){this.lessonTimerLast=Date.now();return}
        const elapsed=Math.floor((Date.now()-this.lessonTimerLast)/1000);
        if(elapsed<1)return;
        this.lessonRemainingSeconds=Math.max(0,this.lessonRemainingSeconds-elapsed);
        this.lessonTimerLast+=elapsed*1000;
        this.state.lessonRemainingSeconds=this.lessonRemainingSeconds;
        this.renderLessonTimer();
      },300);
    }
    stopLessonTimer(){clearInterval(this.lessonTimerId);this.lessonTimerId=null}
    speechLog(event,detail=''){
      this.speechDebug.lessonState=`activity ${this.state.index+1} / ${this.modal?.querySelector('.interactive-panel')?.dataset.teacherState||'idle'}`;
      this.speechDebug.events.push({at:new Date().toISOString(),event,detail:String(detail||'')});
      this.speechDebug.events=this.speechDebug.events.slice(-24);
      const enabled=new URLSearchParams(location.search).get('speechDebug')==='1',box=this.modal?.querySelector('#interactiveSpeechDebug');
      if(enabled)console.debug('[EA Speech]',event,detail);
      if(box){box.hidden=!enabled;box.textContent=`Microphone: ${this.speechDebug.microphone}\nRecognition: ${this.speechDebug.recognition}\nLast transcript: ${this.speechDebug.lastTranscript}\nCurrent lesson state: ${this.speechDebug.lessonState}\n\n${this.speechDebug.events.map(x=>`${x.at.slice(11,23)} ${x.event}${x.detail?`: ${x.detail}`:''}`).join('\n')}`}
    }
    save(){
      this.state.lessonRemainingSeconds=this.lessonRemainingSeconds;
      this.progress?.save?.(this.lesson.id,{...this.state,updatedAt:new Date().toISOString()});
      if(!this.state.completed)root.EAApp?.saveLessonCheckpoint?.({kind:'interactive',lessonId:this.lesson.id,lesson:this.lesson,index:this.state.index,results:[...this.state.results]});
    }
    render(){
      clearTimeout(this.timer);
      this.answerLocked=true;
      const item=this.current();
      if(!item)return this.complete();
      this.matched.clear();
      root.EAClassroomTools?.clearTranscript?.(this.modal);
      this.selectedWord=null;
      this.autoListeningActivityId=null;
      this.modal.querySelector('.interactive-progress span').style.width=`${Math.round(this.state.index/this.lesson.activities.length*100)}%`;
      this.modal.querySelectorAll('.mission-crystal').forEach((crystal,index)=>crystal.classList.toggle('found',index<this.state.index));
      this.setInstruction(item.teacherInstructionEn,item.teacherInstructionHe);
      this.modal.querySelector('#interactiveFeedback').textContent='';
      this.modal.querySelector('#interactiveFeedback').hidden=true;
      const asksQuestion=/\?/.test(`${item.teacherInstructionEn||''} ${item.teacherInstructionHe||''}`);
      this.modal.querySelector('#interactiveState').textContent=asksQuestion?this.teacherText('אמילי שואלת','אדם שואל'):this.teacherText('אמילי מדברת','אדם מדבר');
      const host=this.modal.querySelector('#interactiveActivity');
      const controls=this.modal.querySelector('#interactiveAnswerControls');
      host.replaceChildren();
      controls.replaceChildren();
      this.renderVocabulary(item);
      this.renderActivity(item,host,controls);
      this.modal.querySelector('.adventure-stage').dataset.activity=item.type;
      this.setVisualState('speaking');
      this.save();
      this.speakCurrent();
    }
    speakCurrent(prefix=''){
      const item=this.current();
      if(!item)return;
      clearTimeout(this.timer);
      this.autoListeningActivityId=null;
      this.modal.querySelector('.interactive-panel').dataset.focus='speaking';
      this.setVisualState('speaking');
      const text=[prefix,...speechPlan(this.difficulty,this.state.index,item,this.state.attempts)].filter(Boolean).join(' ');
      this.speakSegments(text,.82,()=>{
        if(this.current()!==item||this.paused)return;
        if(item.type===TYPES.MEMORY){this.startMemoryPreview(item);return}
        this.answerLocked=false;
        this.modal.querySelector('#interactiveState').textContent=this.teacherText('אמילי מקשיבה לתשובה','אדם מקשיב לתשובה');
        this.modal.querySelector('.interactive-panel').dataset.focus='answer';
        this.setVisualState('waiting');
        if(this.shouldAutoListen(item)){
          this.autoListeningActivityId=item.id;
          this.speechLog('automatic listening scheduled',item.id);
          // Leave an acoustic gap so Chrome does not feed the tail of the
          // teacher's synthesized voice back into SpeechRecognition.
          setTimeout(()=>{if(this.current()===item&&!this.paused&&!this.answerLocked)this.listen({automatic:true})},750);
        }else{
          // A visual reminder starts only after the teacher has finished. Voice
          // turns own their timeout so a reminder can never interrupt listening.
          this.timer=setTimeout(()=>{
            if(this.current()===item&&!this.paused&&!this.answerLocked)this.speakCurrent('לא נורא, אני אחזור על ההוראה.');
          },20000);
        }
      });
    }
    startMemoryPreview(item){
      if(this.current()!==item||this.paused)return;
      this.answerLocked=true;
      const cards=[...this.modal.querySelectorAll('.memory .interactive-choice')];
      cards.forEach(card=>{card.disabled=true;card.classList.remove('hidden-card');card.setAttribute('aria-label',`זכרו את המיקום של ${card.dataset.value}`)});
      this.setInstruction('Look carefully and remember where each animal is.','הסתכלו היטב: החיות יוצגו במשך ארבע שניות. זכרו איפה כל חיה נמצאת.');
      this.modal.querySelector('#interactiveFeedback').textContent='👀 הביטו וזכרו… 4 שניות';
      this.modal.querySelector('#interactiveState').textContent=this.teacherText('אמילי נותנת זמן לזכור','אדם נותן זמן לזכור');
      this.modal.querySelector('.interactive-panel').dataset.focus='answer';
      this.setVisualState('speaking');
      this.timer=setTimeout(()=>{
        if(this.current()!==item||this.paused)return;
        cards.forEach(card=>{card.textContent='❓';card.classList.add('hidden-card');card.disabled=false;card.setAttribute('aria-label','קלף חיה מוסתר — אפשר לבחור')});
        this.answerLocked=false;
        this.modal.querySelector('#interactiveFeedback').textContent='עכשיו בחרו איפה הייתה החיה.';
        this.modal.querySelector('#interactiveState').textContent=this.teacherText('אמילי מקשיבה לתשובה','אדם מקשיב לתשובה');
        this.setVisualState('waiting');
        if(this.shouldAutoListen(item))setTimeout(()=>{if(this.current()===item&&!this.paused&&!this.answerLocked)this.listen({automatic:true})},500);
      },4000);
    }
    speakSegments(text,rate=.85,onend=()=>{}){
      const Natural=root.EANaturalVoice;
      const segments=Natural?.splitSpeechSegments?.(text,'en-US')||[{text:Natural?.normalizeTextForSpeech?.(text,'en-US')||String(text||''),lang:'en-US'}];
      speechSynthesis?.cancel();
      this.lastSpokenText=String(text||'');
      this.lastSpeechEndedAt=0;
      if(!root.speechSynthesis||typeof root.SpeechSynthesisUtterance!=='function'){
        this.lastSpeechEndedAt=Date.now();
        this.visual?.stopMouth();
        onend();
        return;
      }
      let index=0;
      const next=()=>{
        const segment=segments[index++];
        if(!segment){this.lastSpeechEndedAt=Date.now();return onend()}
        const speechText=Natural?.normalizeTextForSpeech?.(segment.text,segment.lang)||segment.text;
        if(!speechText)return next();
        const utterance=new root.SpeechSynthesisUtterance(speechText);
        this.visual?.showSpeech(speechText,segment.lang);
        this.visual?.startMouth();
        this.animateCue();
        const settings=root.EAApp?.getData?.()?.settings?.teacherAI||{};
        const preferred=segment.lang.startsWith('he')?settings.hebrewVoice:settings.englishVoice;
        const choice=Natural?.applyVoiceIdentity?.(utterance,{voices:speechSynthesis?.getVoices?.()||[],lang:segment.lang,preferred,gender:this.teacherProfile?.voiceGender||this.teacherGender,rate,volume:settings.speechVolume??1});
        if(!choice){utterance.lang=segment.lang;utterance.rate=rate}
        if(settings.developerDebug||new URLSearchParams(location.search).get('speechDebug')==='1')console.debug(`[EA Interactive Voice] teacher=${this.teacherProfile?.id||'unknown'} requested=${this.teacherProfile?.voiceGender||this.teacherGender} lang=${segment.lang} voice=${choice?.voice?.name||'browser-default'} actual=${choice?.actualGender||'unknown'} pitch=${utterance.pitch} fallback=${choice?.fallbackReason||'none'}`);
        utterance.onend=()=>{this.visual?.stopMouth();next()};
        utterance.onerror=()=>{this.visual?.stopMouth();next()};
        utterance.onboundary=event=>this.visual?.syncMouth?.(speechMouthShape(speechText,event.charIndex));
        root.speechSynthesis.speak(utterance);
      };
      next();
    }
    setVisualState(state){
      const panel=this.modal?.querySelector('.interactive-panel');
      if(panel)panel.dataset.teacherState=state;
      const asksToFind=[TYPES.PICTURE_CHOICE,TYPES.LISTENING,TYPES.STORY].includes(this.current()?.type);
      const mapped={speaking:this.current()?.type===TYPES.WELCOME?'waving':asksToFind?'pointing':'speaking',waiting:'listening',listening:'listening',success:'celebrating',retry:'encouraging',paused:'paused'}[state]||state;
      this.visual?.setState(mapped);
      if(state==='success')this.visual?.gesture?.('clap',1800);
      if(state==='retry')this.visual?.gesture?.('point-right',1400);
      const dragon=this.modal?.querySelector('#interactiveDragon');
      if(dragon)dragon.dataset.state={speaking:'watching',waiting:'listening',listening:'listening',success:'celebrating',retry:'encouraging',paused:'sleeping'}[state]||'watching';
      const celebration=this.modal?.querySelector('#interactiveCelebration');
      if(celebration){celebration.classList.toggle('active',state==='success');if(state==='success')setTimeout(()=>celebration.classList.remove('active'),1900)}
    }
    startAnimationMonitor(){
      clearInterval(this.animationMonitor);const enabled=new URLSearchParams(location.search).get('animationDebug')==='1',box=this.modal?.querySelector('#interactiveFps');
      if(box)box.hidden=!enabled;
      this.animationMonitor=setInterval(()=>{const metrics=this.visual?.getMetrics?.();if(box&&metrics)box.textContent=`${metrics.fps} FPS · ${metrics.state} · ${metrics.gesture}`},1000);
    }
    animateCue(){
      const stage=this.modal?.querySelector('.adventure-stage');
      if(!stage)return;
      stage.classList.remove('cue');
      void stage.offsetWidth;
      stage.classList.add('cue');
    }
    celebrateMissionBeat(progress){
      const stage=this.modal?.querySelector('.adventure-stage');if(!stage)return;
      const quest=this.lesson.quest||QUESTS[0],beats=MISSION_BEATS[quest.id]||MISSION_BEATS.forest,surprise=progress===4&&!this.state.surpriseFound;
      if(surprise)this.state.surpriseFound=true;
      const burst=document.createElement('div');burst.className=`mission-burst${surprise?' surprise':''}`;burst.setAttribute('role','status');burst.textContent=surprise?'🎁 תיבת הפתעה! מצאתם מדבקת כוכב!':`✨ ${beats[(progress-1)%beats.length]}`;stage.append(burst);
      const crystals=this.modal.querySelectorAll('.mission-crystal');crystals.forEach((crystal,index)=>crystal.classList.toggle('found',index<progress));
      setTimeout(()=>burst.remove(),1600);
    }
    setInstruction(english,hebrew=''){
      const box=this.modal.querySelector('#interactiveInstruction');
      box.replaceChildren();
      const en=document.createElement('strong');en.lang='en';en.dir='ltr';en.textContent=english||'';box.append(en);
      if(hebrew){const he=document.createElement('small');he.lang='he';he.dir='rtl';he.textContent=hebrew;box.append(he)}
    }
    renderVocabulary(item){
      const strip=this.modal.querySelector('#interactiveVocabulary');
      if(root.EAClassroomTools?.renderVocabulary){
        root.EAClassroomTools.renderVocabulary(document,strip,this.lesson.words||[],item.prompt||'',word=>this.speakSegments(word,.72));
        return;
      }
      strip.replaceChildren();
      for(const word of this.lesson.words||[]){const card=document.createElement('span');card.className='interactive-word';card.textContent=word;if(String(item.prompt||'').toLowerCase().includes(word))card.classList.add('active');strip.append(card)}
    }
    togglePause(){
      this.paused=!this.paused;
      this.lessonTimerLast=Date.now();
      this.answerLocked=true;
      const button=this.modal.querySelector('#interactivePause');
      button.textContent=this.paused?'▶️':'⏸️';
      button.setAttribute('aria-label',this.paused?'המשך השיעור':'השהיית השיעור');
      if(this.paused){speechSynthesis?.cancel();this.visual?.stopMouth();this.recognition?.abort();this.modal.querySelector('#interactiveState').textContent='השיעור מושהה';this.modal.querySelector('.interactive-panel').dataset.focus='answer';this.setVisualState('paused')}else if(this.pendingRender){this.pendingRender=false;this.render()}else this.speakCurrent();
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
        const hebrewChoice=(item.acceptedAnswers||[]).find(containsHebrew)||'';
        controls.append(this.button('🎤 דברו למיקרופון','microphone',()=>this.listen()),this.button(`🔤 ${item.prompt}${hebrewChoice?` / ${hebrewChoice}`:''}`,item.correctAnswer,(value,button)=>this.answer(value,button)));
        host.append(word);
      }else if(item.type===TYPES.DRAG_MATCH){
        const game=document.createElement('div');game.className='match-game';
        const targets=document.createElement('div');targets.className='match-targets';
        item.pairs.forEach(pair=>{const target=this.button(`<span class="match-picture">${animalPicture(pair.value)}</span><small class="match-picture-label">${pair.value}</small>`,pair.value,value=>this.matchTarget(value));target.dataset.target=pair.value;target.setAttribute('aria-label',`Match a word to the ${pair.value} picture`);target.ondragenter=()=>target.classList.add('drop-ready');target.ondragleave=()=>target.classList.remove('drop-ready');target.ondragover=event=>{event.preventDefault();event.dataTransfer.dropEffect='move'};target.ondrop=event=>{event.preventDefault();target.classList.remove('drop-ready');this.selectedWord=event.dataTransfer.getData('text/plain');this.matchTarget(pair.value)};targets.append(target)});
        const words=document.createElement('div');words.className='match-words';
        item.pairs.slice().reverse().forEach(pair=>{const word=this.button(pair.value,pair.value,value=>{if(word.dataset.ignoreClick)return;this.selectMatchWord(value,word)});word.classList.add('match-word');word.dataset.word=pair.value;word.setAttribute('aria-pressed','false');this.wireMatchWord(word,pair.value);words.append(word)});
        game.append(targets,words);host.append(game);
      }else if(item.type===TYPES.MEMORY){
        const grid=document.createElement('div');grid.className='interactive-options memory';
        item.options.forEach(option=>{const card=this.button(option.label,option.value,(value,button)=>this.answer(value,button));card.dataset.value=option.value;card.disabled=true;grid.append(card)});
        host.append(grid);
      }else if(item.type===TYPES.MOVEMENT){
        const move=document.createElement('div');move.className='movement-demo';move.textContent='🐦  3… 2… 1…';
        host.append(move);controls.append(this.button('סיימתי! ⭐',item.correctAnswer,value=>this.answer(value)));
      }else if(item.type===TYPES.SENTENCE){
        const sentence=document.createElement('div');sentence.className='sentence-builder';sentence.innerHTML='<strong>I like …</strong>';
        item.options.forEach(option=>controls.append(this.button(option,option,value=>this.answer(value))));
        host.append(sentence);
      }
    }
    clearMatchSelection(){
      this.modal.querySelectorAll('.match-word.selected').forEach(word=>{word.classList.remove('selected');word.setAttribute('aria-pressed','false')});
    }
    selectMatchWord(value,word){
      if(word.disabled)return;
      this.clearMatchSelection();
      this.selectedWord=value;
      word.classList.add('selected');
      word.setAttribute('aria-pressed','true');
      this.feedback(`Selected ${value}. Now tap its picture.`,true);
    }
    wireMatchWord(word,value){
      word.draggable=true;
      word.ondragstart=event=>{this.selectedWord=value;event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',value);word.classList.add('dragging')};
      word.ondragend=()=>word.classList.remove('dragging');
      word.onpointerdown=event=>{
        if(event.pointerType==='mouse'||word.disabled)return;
        this.touchDrag={word,value,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,moved:false};
        word.setPointerCapture?.(event.pointerId);
      };
      word.onpointermove=event=>{
        const drag=this.touchDrag;
        if(!drag||drag.word!==word||drag.pointerId!==event.pointerId)return;
        const x=event.clientX-drag.startX,y=event.clientY-drag.startY;
        if(Math.hypot(x,y)>7)drag.moved=true;
        if(!drag.moved)return;
        event.preventDefault();word.classList.add('dragging');word.style.transform=`translate(${x}px,${y}px) scale(1.06)`;
      };
      word.onpointerup=event=>{
        const drag=this.touchDrag;
        if(!drag||drag.word!==word)return;
        this.touchDrag=null;word.releasePointerCapture?.(event.pointerId);word.classList.remove('dragging');word.style.transform='';
        if(!drag.moved)return this.selectMatchWord(value,word);
        word.dataset.ignoreClick='1';setTimeout(()=>delete word.dataset.ignoreClick,0);
        word.style.pointerEvents='none';const hit=document.elementFromPoint(event.clientX,event.clientY);word.style.pointerEvents='';
        const target=hit?.closest?.('[data-target]');
        if(target){this.selectedWord=value;this.matchTarget(target.dataset.target)}
        else{this.clearMatchSelection();this.selectedWord=null;this.feedback('Drop the word on one of the animal pictures.',false)}
      };
      word.onpointercancel=()=>{this.touchDrag=null;word.classList.remove('dragging');word.style.transform=''};
    }
    matchTarget(target){
      if(!this.selectedWord)return this.feedback('בחרו קודם מילה.',false);
      if(this.selectedWord===target){
        this.matched.add(target);
        const targetButton=this.modal.querySelector(`[data-target="${target}"]`),wordButton=this.modal.querySelector(`[data-word="${target}"]`);
        targetButton?.classList.add('matched');if(targetButton)targetButton.disabled=true;
        wordButton?.classList.add('matched');if(wordButton)wordButton.disabled=true;
        this.feedback('התאמה מצוינת!',true);
        this.clearMatchSelection();this.selectedWord=null;
        if(this.matched.size===this.current().pairs.length)this.answer([...this.matched]);
      }else{
        this.feedback('כמעט! נסו לחבר את המילה לתמונה אחרת.',false);
        this.clearMatchSelection();this.selectedWord=null;
      }
    }
    listen({automatic=false,retryAttempt=0,echoAttempt=0}={}){
      if(this.paused||this.answerLocked)return this.speechLog('start blocked',this.paused?'lesson paused':'teacher still speaking');
      const item=this.current(),SR=root.SpeechRecognition||root.webkitSpeechRecognition;
      if(!SR){this.speechLog('recognition unavailable');return this.feedback('זיהוי דיבור אינו זמין. לחצו “אמרתי” כדי להמשיך.',false)}
      if(this.recognition){const stale=this.recognition;this.recognition=null;this.recognitionGeneration++;for(const event of ['onstart','onaudiostart','onspeechstart','onspeechend','onaudioend','onresult','onerror','onend'])stale[event]=null;try{stale.abort()}catch{}this.speechLog('recognition retired','before new listening turn')}
      const generation=++this.recognitionGeneration,recognition=this.recognition=new SR(),startedListeningAt=Date.now();
      let settled=false,heardSpeech=false,finalTranscript='',interimTranscript='',interimConfidence=0,speechStartedAt=Infinity;
      const isCurrent=()=>this.recognition===recognition&&this.recognitionGeneration===generation;
      this.speechLog('recognition created',`generation ${generation}`);
      if(generation>1)this.speechLog('recognition restarted',`generation ${generation}`);
      recognition.lang=root.EATeacherProviders?.recognitionLanguage?.({phase:item.type===TYPES.WELCOME?'greeting':'activity',restartAttempt:retryAttempt,expectedAnswers:[item.correctAnswer,...(item.acceptedAnswers||[])]})||(item.type===TYPES.WELCOME?'he-IL':'en-US');
      this.speechLog('recognition language',recognition.lang);
      recognition.interimResults=true;
      recognition.continuous=false;
      recognition.maxAlternatives=3;
      this.modal.querySelector('#interactiveState').textContent=this.teacherText('אמילי מקשיבה','אדם מקשיב');
      root.EAClassroomTools?.updateTranscript?.(this.modal,'מקשיבה…');
      this.setVisualState('listening');
      recognition.onstart=()=>{if(!isCurrent())return;this.speechDebug.microphone='READY';this.speechDebug.recognition='RUNNING';this.speechLog('onstart')};
      recognition.onaudiostart=()=>{if(!isCurrent())return;this.speechDebug.microphone='LISTENING';this.speechLog('onaudiostart')};
      recognition.onspeechstart=()=>{if(!isCurrent())return;heardSpeech=true;speechStartedAt=Date.now();this.speechLog('onspeechstart')};
      recognition.onspeechend=()=>{if(isCurrent())this.speechLog('onspeechend')};
      recognition.onaudioend=()=>{if(!isCurrent())return;this.speechDebug.microphone='STOPPED';this.speechLog('onaudioend')};
      recognition.onresult=event=>{if(!isCurrent())return;let interim='';this.speechLog('onresult',`index ${event.resultIndex}`);for(let n=event.resultIndex;n<event.results.length;n++){const result=event.results[n],alternative=root.EATeacherProviders?.selectRecognitionAlternative?.(result,{scoreAlternative:text=>validate(item,text)?1:0})||{transcript:result[0]?.transcript||'',confidence:Number(result[0]?.confidence)||0,index:0},text=alternative.transcript;if(text)heardSpeech=true;if(alternative.index>0)this.speechLog('recognition alternative selected',`option ${alternative.index+1} of ${result.length}`);if(result.isFinal)finalTranscript=`${finalTranscript} ${text}`.trim();else{interim=`${interim} ${text}`.trim();interimConfidence=Math.max(interimConfidence,alternative.confidence)}}if(interim)interimTranscript=interim;this.speechDebug.lastTranscript=finalTranscript||interim||'—';root.EAClassroomTools?.updateTranscript?.(this.modal,this.speechDebug.lastTranscript,{final:Boolean(finalTranscript)});this.speechLog(finalTranscript?'transcript final':'transcript interim',this.speechDebug.lastTranscript);if(finalTranscript&&!settled){const elapsed=Date.now()-(this.lastSpeechEndedAt||0),onsetDelay=speechStartedAt-startedListeningAt;if(probableSpeechEcho(finalTranscript,this.lastSpokenText,elapsed,onsetDelay)){settled=true;this.speechLog('teacher echo ignored',`${finalTranscript} (${onsetDelay}ms)`);root.EAClassroomTools?.clearTranscript?.(this.modal);try{recognition.abort()}catch{}if(echoAttempt<1)setTimeout(()=>this.listen({automatic:true,retryAttempt,echoAttempt:echoAttempt+1}),900);else this.feedback('לא שמעתי תשובה ברורה. נסו שוב או בחרו תשובה.',false);return}settled=true;try{recognition.stop()}catch{}this.answer(finalTranscript)}};
      recognition.onerror=event=>{if(!isCurrent())return;const error=event.error||'unknown';this.speechLog('onerror',error);if(settled)return;if(error==='no-speech'&&retryAttempt<4){settled=true;this.speechLog('recognition restart scheduled',`attempt ${retryAttempt+1}, alternating language`);this.modal.querySelector('#interactiveState').textContent='מקשיבה שוב…';root.EAClassroomTools?.updateTranscript?.(this.modal,'מקשיבה…');setTimeout(()=>this.listen({automatic:true,retryAttempt:retryAttempt+1}),420);return}settled=true;root.EAClassroomTools?.clearTranscript?.(this.modal);if(error==='not-allowed'||error==='service-not-allowed')this.feedback('המיקרופון לא אושר. אשרו הרשאה או לחצו “אמרתי”.',false);else this.feedback('לא שמעתי בבירור. אפשר לנסות שוב או ללחוץ “אמרתי”.',false)};
      recognition.onend=()=>{if(!isCurrent())return;this.speechDebug.microphone='STOPPED';this.speechDebug.recognition='STOPPED';this.speechLog('recognition ended',heardSpeech&&!finalTranscript?'speech without final transcript':'');if(this.recognition===recognition)this.recognition=null;const fallback=root.EANaturalVoice?.finalizeRecognitionResult?.({finalTranscript,interimTranscript,heardSpeech,interimConfidence});if(!settled&&fallback?.text&&fallback.fallback&&probableSpeechEcho(fallback.text,this.lastSpokenText,Date.now()-(this.lastSpeechEndedAt||0),speechStartedAt-startedListeningAt)){settled=true;this.speechLog('teacher echo ignored',fallback.text);if(echoAttempt<1)setTimeout(()=>this.listen({automatic:true,retryAttempt,echoAttempt:echoAttempt+1}),900);else this.feedback('לא נשמעה תשובת ילד. נסו שוב או בחרו תשובה.',false);return}if(!settled&&fallback?.text&&fallback.fallback){settled=true;this.speechLog('interim promoted to final',fallback.text);this.answer(fallback.text);return}if(!settled){settled=true;this.feedback(heardSpeech?'שמעתי קול אבל לא התקבל תמלול. נסו שוב.':'לא נשמעה תשובה. נסו שוב או בחרו תשובה.',false)}};
      root.navigator?.permissions?.query?.({name:'microphone'}).then(permission=>this.speechLog('microphone permission',permission.state)).catch(()=>this.speechLog('microphone permission','query unavailable'));
      try{recognition.start();this.speechLog(automatic?'recognition started automatically':'recognition started')}catch(error){settled=true;this.speechLog('start exception',error?.message||'unknown');this.speechDebug.microphone='STOPPED';this.speechDebug.recognition='STOPPED';this.feedback('המיקרופון אינו זמין. לחצו “אמרתי”.',false)}
    }
    handleConversation(value,item){
      const Providers=root.EATeacherProviders,intent=Providers?.conversationIntent?.(value)?.intent,I=Providers?.CONVERSATION_INTENTS;
      if(!I||[I.ANSWER,I.YES,I.NO,I.READY].includes(intent))return false;
      const resume=text=>{this.feedback(text,false,{speak:false});this.speakSegments(text,.82,()=>{if(this.current()!==item||this.paused)return;this.answerLocked=false;this.setVisualState('waiting');setTimeout(()=>this.listen({automatic:true}),450)});return true};
      if(intent===I.REPEAT){this.answerLocked=false;this.speakCurrent();return true}
      if(intent===I.HINT||intent===I.DONT_KNOW)return resume(item.hint||'Look at the picture and the important word.');
      if(intent===I.INSTRUCTION)return resume(item.teacherInstructionHe||item.teacherInstructionEn);
      if(intent===I.LANGUAGE_CHOICE)return resume('You may answer in Hebrew or English. I will help you say the answer in English.');
      if(intent===I.THANKS||intent===I.GREETING)return resume('You are welcome. I am listening. Let us return to the question.');
      if(intent===I.BREAK||intent===I.STOP){this.answerLocked=false;this.togglePause();return true}
      return false;
    }
    answer(value,button){
      if(this.paused||this.answerLocked)return;
      this.answerLocked=true;
      clearTimeout(this.timer);
      const item=this.current();
      if(this.handleConversation(value,item))return;
      let correct=validate(item,value);
      if(correct&&requiresEnglishPractice(item,value)){
        const promptCount=(this.englishPromptAttempts[item.id]||0)+1;
        this.englishPromptAttempts[item.id]=promptCount;
        const expected=englishAnswer(item),autoRetry=promptCount<=2;
        const prompt=autoRetry?`מעולה, הבנת נכון. עכשיו נסו לענות באנגלית. Say: ${expected}.`:`הבנת נכון. כדי להמשיך, אמרו ${expected} באנגלית או לחצו על הכפתור ${expected}.`;
        this.state.results.push({activityId:item.id,correct:false,understood:true,englishPracticeRequired:true,response:String(value),at:new Date().toISOString()});
        this.feedback(prompt,false,{speak:false});
        this.save();
        this.speakSegments(prompt,.82,()=>{
          if(this.current()!==item||this.paused||!this.modal.classList.contains('open'))return;
          this.answerLocked=false;
          this.modal.querySelector('#interactiveState').textContent=this.teacherText('אמילי מחכה לתשובה באנגלית','אדם מחכה לתשובה באנגלית');
          this.setVisualState('waiting');
          if(autoRetry&&this.shouldAutoListen(item))setTimeout(()=>{if(this.current()===item&&!this.paused&&!this.answerLocked)this.listen({automatic:true})},650);
        });
        return;
      }
      this.state.results.push({activityId:item.id,correct,response:String(value),englishCoached:correct&&item.type!==TYPES.WELCOME&&containsHebrew(value),at:new Date().toISOString()});
      this.state=transition(this.state,value,correct);
      if(correct){
        button?.classList.add('correct');
        this.celebrateMissionBeat(this.state.index);
        const bridge=item.type!==TYPES.WELCOME&&containsHebrew(value)&&englishAnswer(item)?`You understood it. In English, we say: ${englishAnswer(item)}.`:'';
        const successText=bridge||successMessage(this.state.index-1);
        this.feedback(successText,true,{speak:false});
        this.save();
        const nextIndex=this.state.index;
        const advance=()=>{
          if(this.state.index!==nextIndex||!this.modal.classList.contains('open'))return;
          if(this.paused){this.pendingRender=true;return}
          this.modal.querySelector('#interactiveState').textContent=this.teacherText('אמילי פותחת את האתגר הבא','אדם פותח את האתגר הבא');
          this.timer=setTimeout(()=>{if(this.state.index===nextIndex&&!this.paused)this.render();else if(this.paused)this.pendingRender=true},280);
        };
        this.speakSegments(successText,.88,advance);
      }else{
        button?.classList.add('wrong');
        const bridge=this.state.hintVisible&&containsHebrew(value)&&englishAnswer(item)?` Let's try in English. Say: ${englishAnswer(item)}.`:'';
        const retryText=this.state.hintVisible?`${item.retryFeedback} ${item.hint||''}${bridge}`:item.retryFeedback;
        this.feedback(retryText,false,{speak:false});
        this.save();
        this.speakCurrent(retryText);
      }
    }
    feedback(text,positive,{speak=true}={}){
      const box=this.modal.querySelector('#interactiveFeedback');
      box.textContent=text;
      box.hidden=true;
      box.dataset.kind=positive?'success':'retry';
      this.setInstruction(text);
      this.modal.querySelector('.interactive-panel').dataset.focus='feedback';
      this.modal.querySelector('#interactiveState').textContent=positive?this.teacherText('אמילי מעודדת','אדם מעודד'):this.teacherText('אמילי עוזרת','אדם עוזר');
      this.setVisualState(positive?'success':'retry');
      this.animateCue();
      if(speak)this.speakSegments(text,.85);
    }
    showHint(){
      const hint=this.current()?.hint||'הסתכלו שוב ונסו צעד קטן.';
      this.feedback(hint,false);
    }
    complete(){
      clearTimeout(this.timer);
      this.stopLessonTimer();
      this.state.completed=true;
      this.state.completedAt=this.state.completedAt||new Date().toISOString();
      this.save();
      root.EAApp?.clearLessonCheckpoint?.();
      const earned=this.lesson.activities.reduce((sum,item)=>sum+(item.xp||0),0);
      this.progress?.complete?.(this.lesson.id,earned);
      const host=this.modal.querySelector('#interactiveActivity');
      host.innerHTML=`<div class="interactive-complete"><div>🏆✨</div><h2>כל הכבוד! סיימתם את השיעור היומי עם המורה</h2><p>למדנו: dog, cat and bird</p><p class="xp-reward" role="status" aria-label="קיבלתם ${earned} נקודות ניסיון">+${earned} XP</p><button class="primary" id="interactiveHome" aria-label="סיום השיעור וחזרה למסך הבית">סיום ✓</button></div>`;
      const quest=this.lesson.quest;
      if(quest)host.querySelector('h2').textContent=document.documentElement.lang==='en'?quest.completeEn:quest.completeHe;
      this.modal.querySelector('#interactiveInstruction').textContent=`${quest?.completeEn||'Mission complete!'} Magic words collected: dog, cat and bird.`;
      this.modal.querySelector('#interactiveState').textContent='המורה חוגגת';
      this.setVisualState('success');
      this.speakSegments(`כל הכבוד ${this.child.name}! ${quest?.completeEn||'Mission complete!'} Magic words: dog, cat and bird.`,.82);
      this.setInstruction('המשימה הושלמה. לחצו על סיום.');
      this.speakSegments('המשימה הושלמה. לחצו על סיום.',.9);
      host.querySelector('#interactiveHome').onclick=()=>this.close();
      host.querySelector('#interactiveHome').focus();
      this.onComplete?.();
    }
    end(){
      if(confirm('לסיים את הפעילות ולחזור למסך הבית?'))this.close();
    }
    close(){
      this.closed=true;
      clearTimeout(this.timer);
      this.stopLessonTimer();
      clearInterval(this.animationMonitor);
      speechSynthesis?.cancel();
      this.recognition?.abort();
      this.visual?.stopMouth();
      this.camera?.destroy?.();this.camera=null;
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

  root.EAInteractiveTeacher={TYPES,VOICE_ANSWER_TYPES,supportsVoiceAnswer,SUCCESS_MESSAGES,successMessage,QUESTS,questFor,speechPlan,speechMouthShape,COMPONENTS,createAnimalsLesson,animalPicture,validate,validationResult,requiresEnglishPractice,transition,probableSpeechEcho,startAnimals};
})(typeof window!=='undefined'?window:globalThis);
