/* Keep a child-visible camera preview available when microphone access is busy or denied. */
(()=>{
  const api=window.EAChildCamera;
  const Controller=api?.ChildCameraController;
  if(!Controller||Controller.prototype.__eaCameraFallback) return;
  Controller.prototype.__eaCameraFallback=true;

  Controller.prototype.start=async function(){
    if(this.active||this.starting) return true;
    this.panel.hidden=false;
    const media=navigator.mediaDevices;
    if(!media?.getUserMedia){this.update('unsupported','המצלמה אינה נתמכת בדפדפן הזה');return false;}
    this.starting=true;
    this.update('starting','מבקש הרשאה למצלמה ולמיקרופון…');
    let stream,videoOnly=false;
    try{
      try{
        stream=await media.getUserMedia(api.CAMERA_CONSTRAINTS);
      }catch(withAudioError){
        // Speech recognition or another app may hold the microphone. Do not make
        // that unrelated problem hide the live camera preview.
        stream=await media.getUserMedia({video:api.CAMERA_CONSTRAINTS.video,audio:false});
        videoOnly=true;
      }
      if(!this.starting){stream.getTracks().forEach(track=>track.stop());return false;}
      this.stream=stream;
      this.video.srcObject=stream;
      await this.video.play?.().catch(()=>{});
      this.active=true;
      if(videoOnly){
        this.update('video-only','המצלמה פועלת. המיקרופון לא זמין כרגע — אפשר להמשיך עם כפתורי התשובה.');
        this.button?.setAttribute('aria-pressed','true');
        if(this.button)this.button.title='כיבוי מצלמה';
      }else this.update('on','המצלמה והמיקרופון פועלים');
      return true;
    }catch(error){
      const denied=error?.name==='NotAllowedError'||error?.name==='SecurityError';
      this.update('error',denied?'לא ניתנה הרשאה למצלמה. לחצו על סמל המצלמה ליד כתובת האתר ובחרו “אפשר”.':'לא הצלחנו להפעיל את המצלמה. ודאו שאפליקציה אחרת אינה משתמשת בה.');
      return false;
    }finally{this.starting=false;}
  };
})();
