const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'../..');
const Camera=require(path.join(root,'child-camera.js'));
const source=fs.readFileSync(path.join(root,'child-camera.js'),'utf8');
const engine=fs.readFileSync(path.join(root,'interactive-activity-engine.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');

function fixture(){
  const panel={hidden:true,dataset:{}},video={srcObject:null,play:async()=>{},pause(){}},status={textContent:''};
  const close={addEventListener(){},removeEventListener(){}};
  const button={attributes:{},addEventListener(){},removeEventListener(){},setAttribute(name,value){this.attributes[name]=value}};
  const host={set innerHTML(value){this.markup=value},querySelector(selector){return selector==='.child-camera'?panel:selector==='video'?video:selector==='.child-camera-status'?status:close},replaceChildren(){this.cleared=true}};
  return{host,panel,video,status,button};
}

test('child camera is opt-in, front-facing and never requests microphone audio',()=>{
  assert.equal(Camera.CAMERA_CONSTRAINTS.audio,false);
  assert.equal(Camera.CAMERA_CONSTRAINTS.video.facingMode,'user');
  assert.match(Camera.PRIVACY_TEXT,/אינה מוקלטת, נשמרת או נשלחת לענן/);
  assert.match(engine,/id="interactiveCameraToggle"[^>]+aria-pressed="false"/);
  assert.match(engine,/EAChildCamera\?\.create/);
});

test('temporary camera stream is shown locally and every track is stopped on close',async()=>{
  const original=Object.getOwnPropertyDescriptor(globalThis,'navigator'),track={stopped:false,stop(){this.stopped=true}},stream={getTracks:()=>[track]};
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:async constraints=>{assert.equal(constraints.audio,false);return stream}}}});
  try{
    const view=fixture(),camera=new Camera.ChildCameraController(view.host,{button:view.button});
    assert.equal(view.panel.hidden,true);
    assert.equal(await camera.start(),true);
    assert.equal(view.video.srcObject,stream);
    assert.equal(view.panel.hidden,false);
    camera.stop();
    assert.equal(track.stopped,true);
    assert.equal(view.video.srcObject,null);
    assert.equal(view.panel.hidden,true);
  }finally{if(original)Object.defineProperty(globalThis,'navigator',original);else delete globalThis.navigator}
});

test('permission denial fails safely and lesson close destroys the camera',async()=>{
  const original=Object.getOwnPropertyDescriptor(globalThis,'navigator');
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:async()=>{const error=new Error('denied');error.name='NotAllowedError';throw error}}}});
  try{
    const view=fixture(),camera=new Camera.ChildCameraController(view.host,{button:view.button});
    assert.equal(await camera.start(),false);
    assert.equal(view.panel.dataset.state,'error');
    assert.match(view.status.textContent,/הרשאה/);
  }finally{if(original)Object.defineProperty(globalThis,'navigator',original);else delete globalThis.navigator}
  assert.match(engine,/this\.camera\?\.destroy\?\.\(\);this\.camera=null/);
  assert.doesNotMatch(source,/MediaRecorder|firebase|firestore|localStorage|fetch\s*\(/i);
});

test('camera UI is responsive, accessible and available offline',()=>{
  assert.match(html,/child-camera\.css\?v=4\.24\.0/);
  assert.match(html,/child-camera\.js\?v=4\.24\.0[\s\S]*interactive-activity-engine\.js/);
  assert.match(sw,/child-camera\.css\?v=4\.24\.0/);
  assert.match(sw,/child-camera\.js\?v=4\.24\.0/);
  assert.match(source,/aria-label="סגירת מצלמת הילד"/);
  assert.match(fs.readFileSync(path.join(root,'child-camera.css'),'utf8'),/@media\(max-width:700px\)/);
  assert.match(html,/interactive-top\{display:grid;grid-template-columns:auto minmax\(90px,auto\) minmax\(100px,1fr\) auto auto auto/);
});
