const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'../..');
const tools=require(path.join(root,'classroom-tools.js'));

test('provides local pronunciation help without a backend',()=>{
  assert.deepEqual(tools.describeWord('Dog'),{
    word:'dog',ipa:'/dɒɡ/',hebrew:'דוֹג',tip:'צליל קצר וברור: דּוֹג'
  });
  assert.equal(tools.describeWord('unknown').word,'unknown');
});

test('selects and normalizes child-friendly difficulty levels',()=>{
  assert.equal(tools.difficultyForChild({level:1}),'easy');
  assert.equal(tools.difficultyForChild({level:4}),'medium');
  assert.equal(tools.difficultyForChild({level:8,progress:{completedMissions:10,unresolvedMistakes:1,averageRetries:.5}}),'hard');
  assert.equal(tools.difficultyForChild({level:8,progress:{completedMissions:10,unresolvedMistakes:6,averageRetries:.5}}),'easy');
  assert.equal(tools.difficultyForChild({level:8,progress:{completedMissions:10,unresolvedMistakes:1,averageRetries:2.5}}),'easy');
  assert.equal(tools.difficultyForChild({level:2,progress:{completedMissions:5}}),'medium');
  assert.equal(tools.difficultyForChild({level:8},'easy'),'easy');
  assert.equal(tools.normalizeDifficulty('invalid'),'easy');
});

test('interactive lesson exposes live transcript, difficulty and phonetic tools',()=>{
  const engine=fs.readFileSync(path.join(root,'interactive-activity-engine.js'),'utf8');
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.match(html,/classroom-tools\.js\?v=/);
  assert.match(engine,/id="interactiveLiveTranscript"/);
  assert.match(engine,/id="interactiveDifficultyHost"/);
  assert.match(engine,/EAClassroomTools\?\.updateTranscript/);
  assert.match(engine,/EAClassroomTools\.renderVocabulary/);
});

test('classroom helper contains no paid or remote conversation calls',()=>{
  const source=fs.readFileSync(path.join(root,'classroom-tools.js'),'utf8');
  assert.doesNotMatch(source,/\/api\/|openai|gemini|fetch\s*\(/i);
});
