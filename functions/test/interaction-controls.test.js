const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Natural=require('../../natural-voice.js');
const {AnswerPlayback}=require('../../answer-playback.js');

test('boy and girl voice preferences preserve quality and manual override',()=>{
  const voices=[
    {name:'Microsoft Daniel Natural',voiceURI:'male',lang:'en-US',localService:true},
    {name:'Microsoft Jenny Natural',voiceURI:'female',lang:'en-US',localService:true},
    {name:'Robot male basic',voiceURI:'bad',lang:'en-US',localService:false}
  ];
  assert.equal(Natural.chooseVoice(voices,'en-US','', 'boy').voice.voiceURI,'male');
  assert.equal(Natural.chooseVoice(voices,'en-US','', 'girl').voice.voiceURI,'female');
  assert.equal(Natural.chooseVoice(voices,'en-US','male','girl').voice.voiceURI,'male');
  assert.notEqual(Natural.chooseVoice(voices,'en-US','', 'boy').voice.voiceURI,'bad');
});

test('legacy profile migration and synced gender are explicit',()=>{
  const app=fs.readFileSync(require.resolve('../../app.js'),'utf8');
  const sync=fs.readFileSync(require.resolve('../../firebase-sync.js'),'utf8');
  assert.match(app,/not-specified/);
  assert.match(sync,/gender:\['boy','girl'\]\.includes/);
  assert.match(sync,/gender:newer\.gender/);
});

test('temporary answer recording is consent gated, replayable and deleted',async()=>{
  let revoked='',cancelled=0,paused=0;
  class Recorder{
    constructor(){this.state='inactive';this.mimeType='audio/webm'}
    start(){this.state='recording'}
    stop(){this.state='inactive';this.ondataavailable({data:new Blob(['voice'])});this.onstop()}
  }
  class AudioMock{
    constructor(){this.paused=true;this.currentTime=0}
    play(){this.paused=false;return Promise.resolve()}
    pause(){this.paused=true;paused++}
  }
  const playback=new AnswerPlayback({MediaRecorder:Recorder,Audio:AudioMock,URL:{createObjectURL:()=> 'blob:answer',revokeObjectURL:value=>revoked=value},speechSynthesis:{cancel:()=>cancelled++}});
  assert.equal(playback.start({}).reason,'consent-required');
  playback.configure({consent:true});
  assert.equal(playback.start({}).ok,true);
  playback.stop();
  assert.equal(playback.hasRecording(),true);
  await playback.play();
  assert.equal(cancelled,1);
  playback.beforeTeacherSpeech();
  assert.ok(paused>=1);
  playback.clear();
  assert.equal(revoked,'blob:answer');
  assert.equal(playback.hasRecording(),false);
});

test('unsupported recorder and permission denial have safe fallbacks',()=>{
  const playback=new AnswerPlayback({MediaRecorder:null,Audio:null,URL:null});
  playback.configure({consent:true});
  assert.equal(playback.start({}).reason,'unsupported');
  const supported=new AnswerPlayback({MediaRecorder:function(){},Audio:null,URL:null});
  supported.configure({consent:true});
  assert.equal(supported.start(null).reason,'permission-denied');
});

test('all dialog close paths and unsaved confirmation are implemented',()=>{
  const source=fs.readFileSync(require.resolve('../../ui-controls.js'),'utf8');
  for(const behavior of ['Escape','popstate','dismissSafe','confirmClose','סגירת החלון','ea-modal-closed'])assert.ok(source.includes(behavior),behavior);
  const app=fs.readFileSync(require.resolve('../../app.js'),'utf8');
  assert.match(app,/לצאת בלי לשמור\?/);
  assert.match(app,/המשך/);
  assert.match(app,/יציאה/);
});

test('recording success never bypasses deterministic answer validation',()=>{
  const teacher=fs.readFileSync(require.resolve('../../teacher-ai.js'),'utf8');
  assert.match(teacher,/evaluate\(result\.transcript,i/);
  assert.doesNotMatch(teacher,/answerPlayback\?\.hasRecording\(\).*valid:true/);
});
