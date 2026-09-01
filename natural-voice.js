(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.EANaturalVoice=api})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const STATES=['teacherSpeaking','waitingForChild','childSpeaking','validating','correcting','praising','paused','disconnected'],RATES={greeting:.96,newWord:.78,instruction:.91,pronunciation:.64,repeat:.76,hebrew:.92,celebration:.98,goodbye:.92},STATE_HE={teacherSpeaking:'המורה מדבר',waitingForChild:'עכשיו תורך',childSpeaking:'מקשיב לך',validating:'בודק את התשובה',correcting:'מתרגלים יחד',praising:'כל הכבוד!',paused:'מושהה',disconnected:'ממתין'};
  const clamp=(n,a,b,f)=>Number.isFinite(Number(n))?Math.min(b,Math.max(a,Number(n))):f;
  Object.assign(RATES,{greeting:.92,newWord:.79,instruction:.88,pronunciation:.68,repeat:.76,hebrew:.89,celebration:.95,goodbye:.9});
  function voiceScore(v,lang){const target=String(lang||'en-US').toLowerCase(),vl=String(v.lang||'').toLowerCase(),name=String(v.name||'');let n=vl===target?50:vl.split('-')[0]===target.split('-')[0]?30:0;if(v.localService)n+=18;if(v.default)n+=5;if(/natural|premium|enhanced|neural|online|siri/i.test(name))n+=34;else if(/google|microsoft|apple/i.test(name))n+=20;if(/compact|espeak|robot|basic|desktop/i.test(name))n-=22;return n}
  const VOICE_PREFERENCES={
    female:{he:['Hila','Carmit','Yael','Sivan','Microsoft Hila','Google עברית'],en:['Samantha','Ava','Aria','Jenny','Zira','Victoria','Karen','Moira','Susan','Hazel','Nicky','Shelley']},
    male:{he:['Asaf','Avri','Eitan','Lior','Microsoft Asaf','Google עברית גבר'],en:['Daniel','David','Guy','Aaron','Alex','Arthur','Fred','Tom','Mark','George','James','Ryan','Christopher']}
  };
  const normalizeGender=value=>({girl:'female',woman:'female',female:'female',boy:'male',man:'male',male:'male'}[String(value||'').toLowerCase()]||'not-specified');
  function voiceGender(v){if(v?.gender)return normalizeGender(v.gender);const value=`${v?.name||''} ${v?.voiceURI||''}`.toLowerCase();if(/daniel|david|guy|asaf|avri|eitan|lior|aaron|arthur|fred|tom|mark|george|james|ryan|christopher|\bmale\b|\bboy\b|גבר|בן/.test(value))return'male';if(/samantha|aria|jenny|zira|hila|carmit|yael|sivan|ava|victoria|karen|moira|susan|hazel|nicky|shelley|\bfemale\b|\bgirl\b|אישה|בת/.test(value))return'female';return'not-specified'}
  function naturalVoiceGender(v){
    const reported=voiceGender(v);
    if(reported!=='not-specified')return reported;
    const value=`${v?.name||''} ${v?.voiceURI||''}`.toLowerCase();
    if(/sonia|libby|natasha|michelle|emma|clara|joanna|kendra|kimberly|salli|ivy/.test(value))return'female';
    if(/brian|matthew|joey|justin|kevin/.test(value))return'male';
    return'not-specified';
  }
  function oppositeGender(gender){return gender==='female'?'male':gender==='male'?'female':'not-specified'}
  function preferenceIndex(v,lang,gender){const list=VOICE_PREFERENCES[normalizeGender(gender)]?.[String(lang).toLowerCase().startsWith('he')?'he':'en']||[],value=`${v?.name||''} ${v?.voiceURI||''}`.toLowerCase(),index=list.findIndex(name=>value.includes(name.toLowerCase()));return index<0?0:Math.max(4,20-index)}
  function rankVoices(voices,lang,gender='not-specified'){const targetGender=normalizeGender(gender);return[...(voices||[])].filter(v=>String(v.lang||'').toLowerCase().startsWith(String(lang).slice(0,2).toLowerCase())).sort((a,b)=>{const score=v=>{const detected=naturalVoiceGender(v),genderScore=targetGender==='not-specified'?0:detected===targetGender?34:detected==='not-specified'?2:-60;return voiceScore(v,lang)+preferenceIndex(v,lang,targetGender)+genderScore};return score(b)-score(a)||String(a.name).localeCompare(String(b.name))})}
  function chooseVoice(voices,lang,preferred='',gender='not-specified'){
    const targetGender=normalizeGender(gender),available=rankVoices(voices,lang,targetGender),opposite=oppositeGender(targetGender),compatible=targetGender==='not-specified'?available:available.filter(v=>naturalVoiceGender(v)!==opposite);
    const manual=compatible.find(v=>(v.voiceURI===preferred||v.name===preferred)),matched=targetGender==='not-specified'?null:compatible.find(v=>naturalVoiceGender(v)===targetGender),voice=manual||(targetGender==='not-specified'?available[0]:matched||compatible.find(v=>naturalVoiceGender(v)==='not-specified')||compatible[0]||available[0])||null,actual=naturalVoiceGender(voice),fallbackReason=!voice?'no-language-voice':actual===targetGender?'matched-gender':actual==='not-specified'?'gender-unknown-gentle-correction':'opposite-gender-language-fallback';
    return{voice,basic:!!voice&&voiceScore(voice,lang)<55,available,requestedGender:targetGender,actualGender:actual,fallbackReason}
  }
  function genderPitch(gender,actualGender='not-specified'){const requested=normalizeGender(gender),actual=normalizeGender(actualGender);if(requested==='female')return actual==='female'?1.01:actual==='male'?1.16:1.065;if(requested==='male')return actual==='male'?.98:actual==='female'?.92:.94;return 1}
  function applyVoiceIdentity(utterance,{voices=[],lang='en-US',preferred='',gender='not-specified',pitch,rate,volume}={}){const choice=chooseVoice(voices,lang,preferred,gender);utterance.lang=lang;if(choice.voice)utterance.voice=choice.voice;utterance.pitch=clamp(pitch,.72,1.28,genderPitch(gender,choice.actualGender));if(rate!=null)utterance.rate=clamp(rate,.5,1.3,.88);if(volume!=null)utterance.volume=clamp(volume,0,1,1);return choice}
  function decodeEntities(text){return String(text).replace(/&nbsp;/gi,' ').replace(/&amp;/gi,' and ').replace(/&quot;|&#34;/gi,'"').replace(/&apos;|&#39;/gi,"'").replace(/&lt;/gi,' ').replace(/&gt;/gi,' ')}
  function normalizeTextForSpeech(input,language='',options={}){
    const item=input&&typeof input==='object'?input:{text:input};
    if(item.speechText!=null||item.spokenText!=null)return normalizeTextForSpeech(String(item.speechText??item.spokenText),language,{...options,allowSymbols:options.allowSymbols||item.allowSymbols||item.teachesSymbols,explicit:true});
    let text=decodeEntities(item.text??item.displayText??'').replace(/<[^>]*>/g,' ');
    const allowSymbols=options.allowSymbols||item.allowSymbols||item.teachesSymbols;
    text=text.replace(/!\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/```[\s\S]*?```/g,' ').replace(/`([^`]*)`/g,'$1');
    text=text.replace(/\b(?:https?|ftp):\/\/[^\s]+/gi,' ').replace(/\bwww\.[^\s]+/gi,' ');
    text=text.replace(/\b[A-Za-z]:\\(?:[^\\\s]+\\)*[^\\\s]*/g,' ').replace(/(?:^|\s)\/(?:[^/\s]+\/)+[^/\s]*/g,' ');
    text=text.replace(/[*#~^]+/g,' ').replace(/_+/g,' ').replace(/([A-Za-z0-9])[-–—]([A-Za-z0-9])/g,'$1 $2');
    if(!allowSymbols){
      text=text.replace(/\s*[/\\|]+\s*/g,', ').replace(/[()[\]{}<>]/g,' ').replace(/\b(?:backslash|underscore|pipe|asterisk|hash|open parenthesis|close parenthesis|slash)\b/gi,' ');
      try{text=text.replace(/\p{Extended_Pictographic}/gu,' ')}catch{}
    }
    text=text.replace(/([!?.,])\1+/g,'$1').replace(/\s+([!?.,])/g,'$1').replace(/([!?.,])(?=[A-Za-z\u0590-\u05ff])/g,'$1 ').replace(/,\s*,+/g,', ').replace(/\s+/g,' ').trim();
    if(text&&!/[.!?]$/.test(text)&&/[\u0590-\u05ff]/.test(text)&&/[A-Za-z]/.test(text))text+='.';
    const debug=!!(root?.EA_DEV_MODE||root?.EAApp?.getData?.()?.settings?.teacherAI?.developerDebug);
    if(debug)console.debug('[speech-normalized]',{language,text});
    return text;
  }
  const toSpokenText=(input,options={})=>normalizeTextForSpeech(input,options.language||'',options);
  function humanizeTeacherText(input,language='en-US'){
    let text=normalizeTextForSpeech(input,language);
    if(!text)return'';
    if(String(language).toLowerCase().startsWith('en')){
      const replacements=[[/\bLet us\b/g,"Let's"],[/\bI am\b/g,"I'm"],[/\bWe are\b/g,"We're"],[/\bwe are\b/g,"we're"],[/\bThat is\b/g,"That's"],[/\bthat is\b/g,"that's"],[/\bYou are\b/g,"You're"],[/\byou are\b/g,"you're"],[/\bdo not\b/g,"don't"],[/\bDid not\b/g,"Didn't"],[/\bdid not\b/g,"didn't"],[/\bcould not\b/g,"couldn't"]];
      for(const [pattern,value] of replacements)text=text.replace(pattern,value);
      text=text.replace(/^Correct!\s*/,'Yes — that’s right! ').replace(/^Great\.\s*/,'Great! ').replace(/^Good effort\.\s*/,'Nice try. ');
    }
    return text.replace(/\s+/g,' ').trim();
  }
  function splitPhrases(text,language=''){
    const sentences=normalizeTextForSpeech(text,language).split(/(?<=[.!?])\s+|\s*;\s*/).map(x=>x.trim()).filter(Boolean),phrases=[];
    for(const sentence of sentences){
      const words=sentence.split(/\s+/);
      if(words.length<=16){phrases.push(sentence);continue}
      const clauses=sentence.split(/(?<=,)\s+|\s+[\u2013\u2014]\s+|(?<=:)\s+/).map(x=>x.trim()).filter(Boolean);
      if(clauses.length>1)phrases.push(...clauses);else for(let index=0;index<words.length;index+=14)phrases.push(words.slice(index,index+14).join(' '));
    }
    return phrases;
  }
  function splitSpeechSegments(input,defaultLanguage='en-US'){
    const normalized=normalizeTextForSpeech(input,defaultLanguage);
    const segments=[];
    for(const phrase of splitPhrases(normalized,defaultLanguage)){
      const parts=phrase.match(/[\u0590-\u05ff][\u0590-\u05ff\s'"׳״.,!?-]*|[^\u0590-\u05ff]+/g)||[];
      for(const raw of parts){
        const text=normalizeTextForSpeech(raw,/[\u0590-\u05ff]/.test(raw)?'he-IL':defaultLanguage);
        if(text)segments.push({text,lang:/[\u0590-\u05ff]/.test(text)?'he-IL':defaultLanguage});
      }
    }
    return segments;
  }
  function pronunciationMeta(text,p={}){const displayText=p.displayText||text,spokenText=normalizeTextForSpeech(p.speechText??p.spokenText??text,'en-US',{allowSymbols:p.teachesSymbols}),naturalPronunciation=normalizeTextForSpeech(p.naturalPronunciation||spokenText,'en-US',{allowSymbols:p.teachesSymbols}),words=spokenText.replace(/[.!?]/g,'').split(/\s+/).filter(Boolean);return{displayText,spokenText,naturalPronunciation,slowPronunciation:normalizeTextForSpeech(p.slowPronunciation||naturalPronunciation,'en-US',{allowSymbols:p.teachesSymbols}),pronunciationChunks:p.pronunciationChunks?.length?p.pronunciationChunks.map(x=>normalizeTextForSpeech(x,'en-US',{allowSymbols:p.teachesSymbols})):(words.length===1?[naturalPronunciation]:words),stressHint:p.stressHint||'',commonRecognitionVariants:p.commonRecognitionVariants||[]}}
  function responseStyle({category,correctStreak=0,attempts=0,hadDifficulty=false,index=0}={}){const pick=a=>a[Math.abs(index)%a.length];if(category==='correct'){if(hadDifficulty||attempts>1)return{state:'praising',text:pick(["Yes — you worked it out!","There it is! You kept trying, and you got it."]),tone:'celebration'};if(correctStreak>=3)return{state:'praising',text:pick(["Wow, you're on a roll!","Look at you — three in a row!"]),tone:'celebration'};return{state:'praising',text:pick(["Yes — that's it!",'Exactly right.','You got it!','Nice one!','That’s the word!']),tone:'celebration'}}if(category==='almost-correct')return{state:'correcting',text:pick(["Ooh, nearly. Listen once more, then try again.","So close! Let's say it slowly together.","You've got the idea. One tiny change."]),tone:'repeat'};if(category==='speech-recognition-uncertain')return{state:'correcting',text:pick(["Hmm, I didn't catch that clearly. Say it once more?","I heard your voice, but not the words. Try once more for me."]),tone:'repeat'};if(category==='didnt-answer')return{state:'waitingForChild',text:pick(["No rush. I'm right here when you're ready.","Take your time. We can do it together."]),tone:'instruction'};return{state:'correcting',text:pick(["Nice try. Let's look at it together.","Not quite yet. Here's a little clue.","Good thinking. Let's take one more look."]),tone:'instruction'}}
  function finalizeRecognitionResult({finalTranscript='',interimTranscript='',heardSpeech=false,finalConfidence=0,interimConfidence=0}={}){const finalText=String(finalTranscript||'').trim(),interimText=String(interimTranscript||'').trim();if(finalText)return{text:finalText,confidence:Number(finalConfidence)||0,fallback:false};if(heardSpeech&&interimText)return{text:interimText,confidence:Math.max(Number(interimConfidence)||0,.72),fallback:true};return{text:'',confidence:0,fallback:false}}
  class SpeechQueue{constructor({synth,Utterance,onState=()=>{},getSettings=()=>({}),pause=(ms)=>new Promise(r=>setTimeout(r,ms))}={}){this.synth=synth;this.Utterance=Utterance;this.onState=onState;this.getSettings=getSettings;this.pause=pause;this.token=0;this.active=false;this.last=null;this.voices=[]}setVoices(v){this.voices=[...(v||[])]}cancel(){this.token++;this.active=false;this.synth?.cancel?.()}async speak(items,{priority=false}={}){if(priority)this.cancel();const token=++this.token;this.synth?.cancel?.();this.active=true;this.onState('teacherSpeaking');const list=(Array.isArray(items)?items:[{text:items}]).flatMap(x=>splitSpeechSegments(x.text,x.lang||'en-US').map(segment=>({...x,...segment})));this.last=list;for(let index=0;index<list.length;index++){const item={...list[index],cadenceIndex:index};if(token!==this.token)break;await this.one(item,token);if(token!==this.token)break;const naturalPause=item.question?560:item.tone==='greeting'||item.tone==='celebration'?190:240;await this.pause(clamp(item.pauseAfter,0,3000,naturalPause))}if(token===this.token){this.active=false;this.onState('waitingForChild')}return token===this.token}one(item,token){return new Promise(resolve=>{if(!this.synth||!this.Utterance)return resolve();const lang=item.lang||'en-US',speechText=humanizeTeacherText(item.text,lang),u=new this.Utterance(speechText),s=this.getSettings(),teacherGender=s.teacherVoiceGender||s.childGender||'not-specified',selected=lang.startsWith('he')?s.hebrewVoice:s.englishVoice,choice=chooseVoice(this.voices,lang,selected,teacherGender);u.lang=lang;if(choice.voice)u.voice=choice.voice;const mult={slow:.84,normal:1,natural:1.03}[s.speechSpeed]||1,cadence=[1,.985,1.012][Math.abs(Number(item.cadenceIndex)||0)%3];u.rate=clamp((item.rate||(RATES[item.tone]||RATES.instruction))*mult*cadence,.5,1.16,.9);const expressive=item.tone==='celebration'?1.025:(item.question ? 0.992 : 1);u.pitch=clamp(item.pitch,.72,1.28,genderPitch(teacherGender,choice.actualGender)*expressive);u.volume=clamp(s.speechVolume,.72,1,1);if(s.developerDebug)console.debug('[EA Voice Utterance]',{lang,teacherGender,voice:choice.voice?.name||null,actualGender:choice.actualGender,pitch:u.pitch,rate:u.rate,fallback:choice.fallbackReason});let done=false;const end=()=>{if(done)return;done=true;resolve()};u.onend=end;u.onerror=end;if(token!==this.token||!speechText)return end();this.synth.speak(u)})}repeatSlower(){if(!this.last)return Promise.resolve(false);return this.speak(this.last.map(x=>({...x,tone:'repeat',rate:(x.rate||RATES[x.tone]||.88)*.8})),{priority:true})}}
  function createTurnGuard(){let speaking=false,listening=false,answerHandled=false,generation=0;return{beginSpeech(){generation++;speaking=true;listening=false;answerHandled=false;return generation},endSpeech(id){if(id!==generation)return false;speaking=false;return true},beginListening(){if(speaking||listening)return false;listening=true;answerHandled=false;return true},handleAnswer(){if(!listening||answerHandled)return false;answerHandled=true;listening=false;return true},interrupt(){generation++;speaking=false;listening=false;answerHandled=false},snapshot(){return{speaking,listening,answerHandled,generation}}}}
  return{STATES,STATE_HE,RATES,VOICE_PREFERENCES,normalizeGender,voiceScore,voiceGender,naturalVoiceGender,rankVoices,chooseVoice,oppositeGender,genderPitch,applyVoiceIdentity,normalizeTextForSpeech,humanizeTeacherText,toSpokenText,splitPhrases,splitSpeechSegments,pronunciationMeta,responseStyle,finalizeRecognitionResult,SpeechQueue,createTurnGuard};
});
