(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EAPricingConfig=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const PRICING=Object.freeze({currency:'USD',verifiedAt:null,source:'Verify official OpenAI pricing before activation',textInputPerMillion:null,textOutputPerMillion:null,audioInputPerMinute:null,audioOutputPerMinute:null});
  const MOCK_RATES=Object.freeze({textInputPerMillion:1,audioInputPerMinute:.01,audioOutputPerMinute:.02});
  function estimate({durationSeconds=0,inputCharacters=0,outputCharacters=0,mock=true,budget=0}={}){
    const rates=mock?MOCK_RATES:PRICING,minutes=Math.max(0,Number(durationSeconds)||0)/60,inputTokens=Math.ceil(Math.max(0,Number(inputCharacters)||0)/4),outputTokens=Math.ceil(Math.max(0,Number(outputCharacters)||0)/4);
    const known=[rates.textInputPerMillion,rates.audioInputPerMinute,rates.audioOutputPerMinute].every(Number.isFinite);
    const cost=known?(inputTokens/1e6*rates.textInputPerMillion+minutes*(rates.audioInputPerMinute+rates.audioOutputPerMinute)):null;
    return{simulated:mock,durationSeconds:Math.max(0,Number(durationSeconds)||0),estimatedInputTokens:inputTokens,estimatedOutputTokens:outputTokens,estimatedAudioMinutes:Number(minutes.toFixed(2)),approximateCost:cost==null?null:Number(cost.toFixed(6)),remainingBudget:cost==null?null:Number(Math.max(0,(Number(budget)||0)-cost).toFixed(4)),pricingVerifiedAt:PRICING.verifiedAt,notice:mock?'נתונים מדומים בלבד — ללא שימוש ב־API':'הערכה בלבד; יש לאמת מחירים רשמיים לפני הפעלה'};
  }
  return{PRICING,MOCK_RATES,estimate};
});
