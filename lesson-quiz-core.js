/* Deterministic, bias-resistant quiz ordering shared by lessons and tests. */
(()=>{
  const hash=value=>{
    let result=2166136261;
    for(const character of String(value||'')){
      result^=character.charCodeAt(0);
      result=Math.imul(result,16777619);
    }
    return result>>>0;
  };

  function orderedChoices(question,seed=''){
    const options=Array.isArray(question?.options)?question.options:[];
    const optionsHe=Array.isArray(question?.optionsHe)?question.optionsHe:[];
    const correctIndex=Number.isInteger(question?.answer)?question.answer:0;
    const choices=options.map((english,index)=>({
      originalIndex:index,
      english,
      hebrew:optionsHe[index]??english,
      correct:index===correctIndex
    }));
    if(choices.length<2)return choices;
    let state=hash(`${seed}|${question?.id||''}|${options.join('|')}`)||1;
    const random=()=>{
      state^=state<<13;state^=state>>>17;state^=state<<5;
      return (state>>>0)/4294967296;
    };
    for(let index=choices.length-1;index>0;index--){
      const target=Math.floor(random()*(index+1));
      [choices[index],choices[target]]=[choices[target],choices[index]];
    }
    // Legacy content placed every correct answer first. Never preserve that
    // exploitable pattern, even when a seeded shuffle happens to return it.
    if(choices[0]?.correct)choices.push(choices.shift());
    return choices;
  }

  function evaluateAttempt({correct,attempts=0,maxAttempts=2}={}){
    const nextAttempts=attempts+1;
    if(correct)return{correct:true,attempts:nextAttempts,retry:false,reveal:false};
    const reveal=nextAttempts>=Math.max(1,maxAttempts);
    return{correct:false,attempts:nextAttempts,retry:!reveal,reveal};
  }

  window.EALessonQuiz={hash,orderedChoices,evaluateAttempt};
})();
