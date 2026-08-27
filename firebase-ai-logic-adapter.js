import {firebaseConfig,teacherAIConfig} from './firebase-config.js';

const SDK='12.14.0';
let adapterPromise;

export function createFirebaseAILogicAdapter(config=window.EAGoogleAIConfig){
  if(config?.enabled!==true||config?.appCheckEnabled!==true)return null;
  if(!adapterPromise)adapterPromise=(async()=>{
    const [{initializeApp,getApps,getApp},{initializeAppCheck,ReCaptchaEnterpriseProvider},{getAI,getGenerativeModel,GoogleAIBackend}]=await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-app-check.js`),
      import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-ai.js`)
    ]);
    const app=getApps().length?getApp():initializeApp(firebaseConfig);
    if(!teacherAIConfig.appCheckSiteKey)throw new Error('app-check-site-key-missing');
    initializeAppCheck(app,{
      provider:new ReCaptchaEnterpriseProvider(teacherAIConfig.appCheckSiteKey),
      isTokenAutoRefreshEnabled:true
    });
    const ai=getAI(app,{backend:new GoogleAIBackend()});
    return{
      async generate(payload,{signal,maxOutputTokens,model}={}){
        if(signal?.aborted)throw new DOMException('Aborted','AbortError');
        const instance=getGenerativeModel(ai,{model:model||config.model,systemInstruction:payload.system,generationConfig:{maxOutputTokens:Number(maxOutputTokens)||180,temperature:.35}});
        const result=await instance.generateContent(JSON.stringify({input:payload.input,lesson:payload.lesson,child:payload.child}));
        if(signal?.aborted)throw new DOMException('Aborted','AbortError');
        return{text:result.response.text()};
      }
    };
  })();
  return{generate:async(...args)=>(await adapterPromise).generate(...args)};
}

window.EAFirebaseAILogic=Object.freeze({createFirebaseAILogicAdapter});

