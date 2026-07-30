const test=require('node:test'),assert=require('node:assert/strict');
const Visual=require('../../teacher-visual.js');
test('teacher exposes every required visual state',()=>{for(const state of ['idle','greeting','speaking','listening','thinking','explaining','pointing','praising','correcting','celebrating','waiting','paused','uncertain','goodbye','waving','happy','encouraging'])assert.ok(Visual.STATES.includes(state))});
test('wrong answers never trigger a success reaction',()=>{for(const category of ['almost-correct','wrong-related','completely-unrelated','didnt-answer','speech-recognition-uncertain'])assert.ok(!['praising','celebrating'].includes(Visual.stateFor(category,5)))});
test('correct streak strengthens celebration only after several successes',()=>{assert.equal(Visual.stateFor('correct',1),'praising');assert.equal(Visual.stateFor('correct',3),'celebrating')});
test('both original teacher characters contain accessible complete SVG artwork',()=>{for(const id of ['noa','daniel']){const svg=Visual.characterSvg(id);for(const part of ['teacher-head','teacher-eyes','teacher-brows','teacher-mouth','teacher-arm','teacher-body'])assert.match(svg,new RegExp(part));assert.match(svg,/role="img"/)}});
test('visual state labels communicate gestures without relying on animation',()=>{for(const state of Visual.STATES)assert.ok(Visual.STATE_LABELS[state]?.length>3)});
