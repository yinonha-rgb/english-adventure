const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const root = path.resolve(__dirname, '../..');
const storageModule = require(path.join(root, 'services/storage.js'));
const stateModule = require(path.join(root, 'services/state.js'));

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    value: key => values.get(key)
  };
}

const defaults = () => ({ lang: 'he', selected: 'p1', profiles: [{ id: 'p1', name: 'אורי', p: { xp: 0 } }] });

test('storage preserves the existing ea-v2 schema and recovers from corrupted JSON', () => {
  const backend = memoryStorage({ 'ea-v2': '{broken' });
  const storage = storageModule.createStorage({ backend, key: 'ea-v2', validate: value => Array.isArray(value?.profiles) });
  assert.deepEqual(storage.load(defaults()), defaults());
  storage.save(defaults());
  assert.equal(JSON.parse(backend.value('ea-v2')).selected, 'p1');
});

test('application state loads profiles, persists updates and returns isolated snapshots', () => {
  const backend = memoryStorage();
  const storage = storageModule.createStorage({ backend, key: 'ea-v2', validate: value => Array.isArray(value?.profiles) });
  const state = stateModule.createAppState({ storage, defaults });
  assert.equal(state.activeProfile().name, 'אורי');
  state.update(draft => { draft.profiles[0].p.xp = 25; });
  const snapshot = state.snapshot();
  snapshot.profiles[0].p.xp = 999;
  assert.equal(state.activeProfile().p.xp, 25);
  assert.equal(JSON.parse(backend.value('ea-v2')).profiles[0].p.xp, 25);
});

test('XP awards and activity entries are idempotent across repeated synchronization', () => {
  const progress = { xp: 0, awards: {}, study: {}, activity: [], streak: 0, lastDay: '' };
  const options = { key: 'daily-lesson', amount: 20, label: 'Daily lesson', day: '2026-08-05', now: new Date('2026-08-05T09:00:00Z') };
  assert.equal(stateModule.awardXP(progress, options), true);
  assert.equal(stateModule.awardXP(progress, options), false);
  assert.equal(progress.xp, 20);
  assert.equal(progress.activity.length, 1);
});

test('mistakes are updated instead of duplicated and are scheduled for review', () => {
  const progress = { mistakes: [] };
  const mistake = { lesson: 'animals', qid: 'dog', answer: 'cat' };
  stateModule.addMistake(progress, mistake, { now: 1000, retryAfterMs: 500 });
  stateModule.addMistake(progress, mistake, { now: 2000, retryAfterMs: 500 });
  assert.equal(progress.mistakes.length, 1);
  assert.equal(progress.mistakes[0].count, 2);
  assert.equal(progress.mistakes[0].next, 2500);
});

test('the modular services load before the legacy application and are cached offline', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.ok(html.indexOf('services/storage.js') < html.indexOf('app.js'));
  assert.ok(html.indexOf('services/state.js') < html.indexOf('app.js'));
  assert.match(sw, /services\/storage\.js\?v=4\.43\.0/);
  assert.match(sw, /services\/state\.js\?v=4\.43\.0/);
  assert.match(app, /STORE='ea-v2'/);
  assert.match(app, /appState\.persist\(data\)/);
});
