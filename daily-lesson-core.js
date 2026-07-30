(function(root){
  'use strict';

  const isoDay=value=>{
    const date=value instanceof Date?value:new Date(value||Date.now());
    return date.toISOString().slice(0,10);
  };
  const hash=value=>{
    let result=2166136261;
    for(const char of String(value||'')){
      result^=char.codePointAt(0);
      result=Math.imul(result,16777619);
    }
    return result>>>0;
  };
  const dailyStore=progress=>{
    if(!progress.dailyLessons||typeof progress.dailyLessons!=='object'||Array.isArray(progress.dailyLessons))progress.dailyLessons={};
    return progress.dailyLessons;
  };
  const lessonIdFromMistake=mistake=>mistake?.lesson||mistake?.lessonId;
  const recentIds=progress=>(progress.lessonHistory||[])
    .map(item=>item.lessonId)
    .filter(Boolean)
    .slice(0,4);

  function selectDailyLesson({profile,lessons,date=Date.now()}){
    if(!profile||!Array.isArray(lessons)||!lessons.length)return null;
    const progress=profile.p||profile.progress||{};
    const day=isoDay(date),stored=dailyStore(progress)[day];
    const byId=id=>lessons.find(lesson=>lesson.id===id);

    const unresolved=(progress.mistakes||[])
      .filter(item=>!item.resolvedAt)
      .sort((a,b)=>(b.count||1)-(a.count||1)||(a.next||0)-(b.next||0));
    const mistakeLesson=unresolved.map(lessonIdFromMistake).map(byId).find(Boolean);
    if(mistakeLesson)return{lesson:mistakeLesson,reason:'unresolved-mistake',day};

    if(stored?.status!=='completed'&&byId(stored?.lessonId)){
      return{lesson:byId(stored.lessonId),reason:'in-progress',day};
    }

    const completed=new Set(progress.completed||[]),recent=new Set(recentIds(progress));
    const recommended=lessons.filter(lesson=>!completed.has(lesson.id)&&!recent.has(lesson.id));
    if(recommended.length){
      const age=profile.age||profile.childAge||'',level=profile.level||Math.floor((progress.xp||0)/100)+1;
      const index=hash(`${profile.id}|${age}|${level}|${day}`)%recommended.length;
      return{lesson:recommended[index],reason:'next-recommended',day};
    }

    const reviewIds=[...(progress.voiceReview||[])]
      .filter(item=>!item.next||item.next<=new Date(day+'T23:59:59Z').getTime())
      .map(lessonIdFromMistake);
    const spaced=reviewIds.map(byId).find(Boolean)||
      lessons.find(lesson=>completed.has(lesson.id)&&!recent.has(lesson.id));
    if(spaced)return{lesson:spaced,reason:'spaced-review',day};

    const incomplete=lessons.filter(lesson=>!completed.has(lesson.id));
    return{lesson:incomplete[0]||lessons[hash(`${profile.id}|${day}`)%lessons.length],reason:'next-incomplete',day};
  }

  function buildDailyLesson(selection,{profile,lessons}){
    if(!selection?.lesson)return null;
    const lesson=selection.lesson,progress=profile?.p||{},review=[];
    const reviewIds=[
      ...(progress.mistakes||[]).map(lessonIdFromMistake),
      ...(progress.lessonHistory||[]).map(item=>item.lessonId),
      ...(progress.completed||[]).slice(-2).reverse()
    ];
    for(const id of reviewIds){
      const source=lessons.find(item=>item.id===id);
      for(const phrase of source?.phrases||[]){
        if(review.length>=2)break;
        if(!review.some(item=>item.english===phrase.english))review.push({...phrase,dailySection:'review'});
      }
      if(review.length>=2)break;
    }
    const fresh=(lesson.phrases||[])
      .filter(phrase=>!review.some(item=>item.english===phrase.english))
      .slice(0,3)
      .map(phrase=>({...phrase,dailySection:'new'}));
    return{
      ...lesson,
      phrases:[...review,...fresh].slice(0,5),
      quiz:(lesson.quiz||[]).slice(0,2),
      dailyLesson:true,
      dailyDate:selection.day,
      dailyReason:selection.reason
    };
  }

  function rememberSelection(progress,selection,now=Date.now()){
    if(!selection?.lesson)return null;
    const store=dailyStore(progress),existing=store[selection.day];
    if(existing?.status==='completed')return existing;
    return store[selection.day]={
      date:selection.day,
      lessonId:selection.lesson.id,
      status:'selected',
      selectionReason:selection.reason,
      selectedAt:existing?.selectedAt||new Date(now).toISOString(),
      updatedAt:new Date(now).toISOString()
    };
  }

  function completeDaily(progress,{day=isoDay(),lessonId,now=Date.now()}={}){
    const store=dailyStore(progress),existing=store[day]||{};
    const firstCompletion=existing.status!=='completed';
    store[day]={
      ...existing,
      date:day,
      lessonId:lessonId||existing.lessonId,
      status:'completed',
      completedAt:existing.completedAt||new Date(now).toISOString(),
      updatedAt:new Date(now).toISOString()
    };
    return{record:store[day],creditDue:firstCompletion};
  }

  root.EADailyLesson={isoDay,selectDailyLesson,buildDailyLesson,rememberSelection,completeDaily};
})(typeof window!=='undefined'?window:globalThis);
