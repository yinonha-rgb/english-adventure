(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.EAChildCamera=api})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  const PRIVACY_TEXT='המצלמה מוצגת רק במכשיר הזה. התמונה אינה מוקלטת, נשמרת או נשלחת לענן.';
  const CAMERA_CONSTRAINTS=Object.freeze({audio:false,video:Object.freeze({facingMode:'user',width:Object.freeze({ideal:480}),height:Object.freeze({ideal:360})})});

  class ChildCameraController{
    constructor(host,{button=null,onStatus=()=>{}}={}){
      this.host=host;this.button=button;this.onStatus=onStatus;this.stream=null;this.active=false;this.starting=false;
      this.onPageHide=()=>this.stop();
      this.onToggle=()=>this.toggle();
      this.onClose=()=>this.stop();
      this.mount();
    }
    mount(){
      this.host.innerHTML=`<aside class="child-camera" hidden aria-label="מצלמת הילד"><video muted playsinline autoplay aria-label="תצוגת המצלמה שלכם"></video><div class="child-camera-bar"><span class="child-camera-status" role="status">המצלמה כבויה</span><button class="child-camera-close" type="button" aria-label="סגירת מצלמת הילד">×</button></div><p class="child-camera-privacy">${PRIVACY_TEXT}</p></aside>`;
      this.panel=this.host.querySelector('.child-camera');this.video=this.host.querySelector('video');this.status=this.host.querySelector('.child-camera-status');
      this.closeButton=this.host.querySelector('.child-camera-close');this.closeButton.addEventListener('click',this.onClose);
      this.button?.addEventListener('click',this.onToggle);
      root.addEventListener?.('pagehide',this.onPageHide);
      this.update('off','המצלמה כבויה');
    }
    update(state,message){
      this.status.textContent=message;this.panel.dataset.state=state;this.button?.setAttribute('aria-pressed',String(state==='on'));
      if(this.button)this.button.title=state==='on'?'כיבוי מצלמה':'הפעלת מצלמה';
      this.onStatus(state,message);
    }
    async start(){
      if(this.active||this.starting)return true;
      this.panel.hidden=false;
      if(!root.navigator?.mediaDevices?.getUserMedia){this.update('unsupported','המצלמה אינה נתמכת בדפדפן הזה');return false}
      this.starting=true;this.update('starting','מבקש הרשאה למצלמה…');
      try{
        const stream=await root.navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
        if(!this.starting){stream.getTracks().forEach(track=>track.stop());return false}
        this.stream=stream;this.video.srcObject=stream;await this.video.play?.().catch(()=>{});this.active=true;this.update('on','המצלמה פועלת');return true;
      }catch(error){
        const denied=error?.name==='NotAllowedError'||error?.name==='SecurityError';
        this.update('error',denied?'לא ניתנה הרשאה למצלמה':'לא הצלחנו להפעיל את המצלמה');
        return false;
      }finally{this.starting=false}
    }
    stop(){
      this.starting=false;this.stream?.getTracks?.().forEach(track=>track.stop());this.stream=null;this.active=false;
      if(this.video){this.video.pause?.();this.video.srcObject=null}
      if(this.panel){this.panel.hidden=true;this.update('off','המצלמה כבויה')}
      return true;
    }
    toggle(){return this.active||this.starting?(this.stop(),Promise.resolve(false)):this.start()}
    destroy(){this.stop();this.button?.removeEventListener?.('click',this.onToggle);this.closeButton?.removeEventListener?.('click',this.onClose);root.removeEventListener?.('pagehide',this.onPageHide);this.host.replaceChildren?.()}
  }

  function create(host,options){return new ChildCameraController(host,options)}
  return{PRIVACY_TEXT,CAMERA_CONSTRAINTS,ChildCameraController,create};
});
