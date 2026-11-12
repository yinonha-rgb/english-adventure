const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {buildModel,chapters}=require('../../story-curriculum.js');
const root=path.resolve(__dirname,'../..');
const lessons=JSON.parse(fs.readFileSync(path.join(root,'content.json'),'utf8')).lessons;
test('story curriculum covers every existing lesson once',()=>{const ids=chapters.flatMap(x=>x.lessonIds);assert.equal(new Set(ids).size,ids.length);assert.deepEqual([...ids].sort(),lessons.map(x=>x.id).sort())});
test('next mission follows child progress',()=>{const model=buildModel(lessons,{completed:['hello','colors','numbers']});assert.equal(model.nextLesson.id,'animals');assert.equal(model.completedCount,3)});
test('unfinished checkpoint takes priority without mutating progress',()=>{const progress={completed:['hello'],lessonCheckpoint:{lessonId:'school',step:2}},before=structuredClone(progress);assert.equal(buildModel(lessons,progress).nextLesson.id,'school');assert.deepEqual(progress,before)});
test('children receive independent route progress',()=>{const first=buildModel(lessons,{completed:['hello']}),second=buildModel(lessons,{completed:['hello','colors','numbers','animals','goodbye']});assert.equal(first.nextLesson.id,'colors');assert.equal(second.nextLesson.id,'family');assert.notEqual(first.percent,second.percent)});
test('all-complete route remains replayable',()=>{const model=buildModel(lessons,{completed:lessons.map(x=>x.id)});assert.equal(model.allComplete,true);assert.equal(model.percent,100);assert.equal(model.nextLesson.id,'hello')});
test('home and service worker include story route release',()=>{const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');assert.match(html,/id="storyCurriculum"/);assert.match(html,/story-curriculum\.css\?v=5\.5\.0/);assert.match(html,/story-curriculum\.js\?v=5\.5\.0/);assert.match(sw,/english-adventure-5\.5\.0/);assert.match(sw,/story-curriculum\.js\?v=5\.5\.0/)});

