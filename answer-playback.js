(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EAAnswerPlayback=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  class AnswerPlayback{
    constructor({MediaRecorder,Audio,URL,speechSynthesis,onState=()=>{}}={}){
      this.MediaRecorder=MediaRecorder;this.Audio=Audio;this.URL=URL;this.speechSynthesis=speechSynthesis;this.onState=onState;
      this.recorder=null;this.stream=null;this.chunks=[];this.audio=null;this.url='';this.consent=false;this.auto=false;
    }
    configure({consent=false,auto=false}={}){this.consent=!!consent;this.auto=!!auto;if(!this.consent)this.clear()}
    supported(){return this.consent&&typeof this.MediaRecorder==='function'}
    start(stream){
      this.stopPlayback();this.clear();if(!this.supported())return{ok:false,reason:this.consent?'unsupported':'consent-required'};
      if(!stream)return{ok:false,reason:'permission-denied'};this.stream=stream;this.chunks=[];this.recorder=new this.MediaRecorder(stream);
      this.recorder.ondataavailable=event=>{if(event.data?.size)this.chunks.push(event.data)};
      this.recorder.onstop=()=>{const blob=new Blob(this.chunks,{type:this.recorder?.mimeType||'audio/webm'});if(blob.size){this.url=this.URL.createObjectURL(blob);this.audio=new this.Audio(this.url)}this.onState('finished')};
      this.recorder.start();this.onState('recording');return{ok:true};
    }
    stop(){if(this.recorder?.state==='recording')this.recorder.stop()}
    async play(){
      if(!this.audio)return false;this.speechSynthesis?.cancel?.();this.stopPlayback();this.audio.currentTime=0;this.onState('playing');
      await this.audio.play();return true;
    }
    stopPlayback(){if(this.audio&&!this.audio.paused){this.audio.pause();this.audio.currentTime=0}}
    beforeTeacherSpeech(){this.stopPlayback()}
    clear(){this.stopPlayback();if(this.url)this.URL?.revokeObjectURL?.(this.url);this.url='';this.audio=null;this.chunks=[];this.recorder=null;this.stream=null;this.onState('empty')}
    hasRecording(){return !!this.audio}
  }
  return{AnswerPlayback};
});
