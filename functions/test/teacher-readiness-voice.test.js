const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', '..', 'teacher-ai.js'), 'utf8');

test('daily lesson greeting automatically opens a voice turn', () => {
  assert.match(source, /exerciseId:'lesson-ready'/);
  assert.match(source, /listen:true/);
  assert.match(source, /expectedAnswers:\['yes','ready'/);
  assert.match(source, /r\.lang=phase===0\?'he-IL':'en-US'/);
  assert.match(source, /async function startFree\(\)[^\n]+await prepareMicrophone\(\)/);
  assert.match(source, /lastError==='no-speech'&&restartAttempt<2/);
  assert.match(source, /microphoneWarmupAttempted=false;await prepareMicrophone\(\)/);
});

test('spoken yes or ready advances beyond the greeting', () => {
  assert.match(source, /phase===0&&\(intent===Providers\.CONVERSATION_INTENTS\.READY\|\|intent===Providers\.CONVERSATION_INTENTS\.YES\)/);
  assert.match(source, /speak\("Lovely — let's begin!"[^\n]+nextPhase/);
});

test('ready never triggers Great outside the explicit readiness question', () => {
  assert.match(source, /if\(intent===Providers\.CONVERSATION_INTENTS\.READY\)return false/);
  assert.doesNotMatch(source, /CONVERSATION_INTENTS\.READY\)\{speak\('Great\. Let us continue/);
});
