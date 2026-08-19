const test=require('node:test'),assert=require('node:assert/strict');
const Core=require('../../teacher-modes-core.js'),content=require('../../content.json');
const colorSpec=Core.validationSpec({lessonId:'colors',exerciseId:'color-red',expectedAnswers:['red'],acceptedSynonyms:['crimson'],pronunciationVariations:['read'],recognitionAlternatives:['its red'],requiredKeywords:['red'],contextKeywords:['color','red'],kind:'single-word',minimumThreshold:.82});
const sentenceSpec=Core.validationSpec({lessonId:'hello',exerciseId:'nice-meet',expectedAnswers:['Nice to meet you'],recognitionAlternatives:['Nice meeting you'],requiredKeywords:['nice','meet'],kind:'sentence',minimumThreshold:.68});
const appleSpec=Core.validationSpec({lessonId:'colors',exerciseId:'apple-color',question:'What color is the apple in this picture?',expectedAnswers:['red'],requiredKeywords:['red'],contextKeywords:['red','green','apple','color'],rejectedExamples:['green','blue'],hints:['Look at the apple in this picture.'],misconceptionExplanations:['Apples can sometimes be green, but in this picture we are looking for red.'],followUpPrompts:['Can you say red?'],reviewWords:['red'],kind:'single-word'});

test('correct single-word answer and safe wrappers are accepted',()=>{for(const answer of ['red',"it's red",'the color is red'])assert.equal(Core.validateAnswer(answer,colorSpec).valid,true,answer)});
test('approved synonym is accepted',()=>assert.equal(Core.validateAnswer('crimson',colorSpec).valid,true));
test('approved pronunciation or recognition variation is accepted',()=>{assert.equal(Core.validateAnswer('read',colorSpec).valid,true);assert.equal(Core.validateAnswer('its red',colorSpec).valid,true)});
test('Hebrew text survives normalization and bilingual equivalents are accepted',()=>{
  const bilingual=Core.validationSpec({expectedAnswers:['red','אדום'],requiredKeywords:['red'],kind:'single-word'});
  assert.equal(Core.normalize('  אָדוֹם!  '),'א דו ם');
  assert.equal(Core.validateAnswer('אדום',bilingual).valid,true);
  assert.equal(Core.validateAnswer('כחול',bilingual).valid,false);
});
test('gender-marked Hebrew lesson answers expand into natural spoken variants',()=>{
  const variants=Core.expandAnswerVariants('אני רעב/ה.');
  assert.ok(variants.includes('אני רעב'));
  assert.ok(variants.includes('אני רעבה'));
});
test('a Hebrew answer receives a concise English learning bridge only when needed',()=>{
  const bilingual=Core.validationSpec({expectedAnswers:['dog','כלב'],requiredKeywords:['dog'],kind:'single-word'});
  assert.equal(Core.englishBridge('dog',bilingual,true),'');
  assert.equal(Core.englishBridge('כלב',bilingual,true),'Correct! In English, we say: dog.');
  assert.equal(Core.englishBridge('חתול',bilingual,false),"Let's try in English. The answer is: dog. Can you say dog?");
});
test('unrelated word is rejected',()=>{const v=Core.validateAnswer('banana',colorSpec);assert.equal(v.valid,false);assert.equal(v.reason,'missing-required-keyword')});
test('random sentence remains rejected even when it contains the target word',()=>assert.equal(Core.validateAnswer('banana red dog hello',colorSpec).valid,false));
test('silence and background noise are rejected explicitly',()=>{assert.equal(Core.validateAnswer('',colorSpec).reason,'silence');assert.equal(Core.validateAnswer('uh hmm noise',colorSpec).reason,'background-noise')});
test('low recognition confidence never produces a correct result',()=>{const v=Core.validateAnswer('red',colorSpec,{confidence:.2});assert.equal(v.valid,false);assert.equal(v.reason,'low-confidence')});
test('meaning-equivalent sentence is accepted without exact wording',()=>assert.equal(Core.validateAnswer('nice to meet',sentenceSpec).valid,true));
test('partial sentence missing an important keyword is rejected',()=>{const v=Core.validateAnswer('nice',sentenceSpec);assert.equal(v.valid,false);assert.equal(v.reason,'missing-required-keyword')});
test('repeated wrong answers have a finite retry, hint, explanation, continue sequence',()=>assert.deepEqual([1,2,3,4].map(Core.retryAction),['retry','hint','explain-and-repeat','continue']));
test('button fallback choices are deterministic without revealing one fixed answer position',()=>{
  const source=['dog','cat','bird'],snapshot=[...source],first=Core.orderAnswerChoices(source,'child-a:animals:q1:0');
  assert.deepEqual(Core.orderAnswerChoices(source,'child-a:animals:q1:0'),first);
  assert.deepEqual(source,snapshot);
  assert.deepEqual([...first].sort(),[...source].sort());
  const positions=new Set(Array.from({length:12},(_,index)=>Core.orderAnswerChoices(source,`child-${index}:animals:q1:0`).indexOf('dog')));
  assert.ok(positions.size>1,'the correct answer must not stay in one predictable position');
});
test('every spoken answer maps to exactly one teaching category',()=>{const cases=[['red',Core.CATEGORIES.CORRECT],['reed',Core.CATEGORIES.ALMOST_CORRECT],['green',Core.CATEGORIES.WRONG_RELATED],['pizza',Core.CATEGORIES.UNRELATED],['banana',Core.CATEGORIES.UNRELATED],['',Core.CATEGORIES.NO_ANSWER]];for(const [answer,category] of cases)assert.equal(Core.validateAnswer(answer,appleSpec).category,category,answer);assert.equal(Core.validateAnswer('red',appleSpec,{confidence:.1}).category,Core.CATEGORIES.UNCERTAIN)});
test('human teaching responses explain related mistakes and never praise nonsense',()=>{const related=Core.teachingResponse(Core.validateAnswer('green',appleSpec),appleSpec,{[Core.CATEGORIES.WRONG_RELATED]:1});assert.match(related.message,/Apples can sometimes be green/);const unrelated=Core.teachingResponse(Core.validateAnswer('pizza',appleSpec),appleSpec,{[Core.CATEGORIES.UNRELATED]:1});assert.match(unrelated.message,/doesn't quite fit/);assert.equal(unrelated.action,'retry')});
test('silence, uncertainty and every wrong category never receive success praise',()=>{const praise=/\b(great|excellent|correct|exactly|wonderful|you got it|that is right)\b/i,cases=[Core.validateAnswer('',appleSpec),Core.validateAnswer('red',appleSpec,{confidence:.1}),Core.validateAnswer('reed',appleSpec),Core.validateAnswer('green',appleSpec),Core.validateAnswer('pizza',appleSpec)];for(const verdict of cases){assert.equal(verdict.valid,false);assert.doesNotMatch(Core.teachingResponse(verdict,appleSpec,{[verdict.category]:1}).message,praise,verdict.category)}});
test('silence repeats once then offers two-choice recovery and uncertain speech offers choices after three',()=>{const silent=Core.validateAnswer('',appleSpec),uncertain=Core.validateAnswer('red',appleSpec,{confidence:.1});assert.equal(Core.teachingResponse(silent,appleSpec,{[Core.CATEGORIES.NO_ANSWER]:1}).action,'repeat');assert.equal(Core.teachingResponse(silent,appleSpec,{[Core.CATEGORIES.NO_ANSWER]:2}).action,'choices');assert.equal(Core.teachingResponse(uncertain,appleSpec,{[Core.CATEGORIES.UNCERTAIN]:2}).action,'retry');assert.equal(Core.teachingResponse(uncertain,appleSpec,{[Core.CATEGORIES.UNCERTAIN]:3}).action,'choices')});
test('difficulty is tolerant only where intended',()=>{const easy=Core.validationSpec({...sentenceSpec,difficulty:'easy'}),hard=Core.validationSpec({...sentenceSpec,difficulty:'hard'});assert.equal(easy.difficulty,'easy');assert.equal(hard.difficulty,'hard');assert.ok(Core.DIFFICULTY.easy.threshold<Core.DIFFICULTY.hard.threshold)});
test('all existing lessons receive complete human-teaching contracts',()=>{let exercises=0;for(const lesson of content.lessons){const shared=Core.sharedContext({lesson,child:{level:1},mistakes:[],difficulty:'medium'});for(const exercise of [...shared.lesson.phrases,...shared.lesson.quiz]){exercises++;const v=exercise.validation;assert.ok(v.expectedAnswers.length,`${lesson.id} expected`);for(const field of ['acceptedSynonyms','pronunciationVariations','recognitionAlternatives','rejectedExamples','hints','misconceptionExplanations','followUpPrompts','reviewWords'])assert.ok(Array.isArray(v[field]),`${lesson.id} ${field}`);for(const field of ['rejectedExamples','hints','misconceptionExplanations','followUpPrompts','reviewWords'])assert.ok(v[field].length,`${lesson.id} ${field} content`);assert.ok(v.requiredKeywords.length,`${lesson.id} keywords`);assert.ok(v.minimumThreshold>=.68,`${lesson.id} threshold`)}}assert.equal(exercises,110)});
test('every existing phrase and quiz accepts its exact Hebrew and English answer',()=>{for(const lesson of content.lessons){const shared=Core.sharedContext({lesson,child:{level:1},mistakes:[],difficulty:'medium'});for(const phrase of shared.lesson.phrases){assert.equal(Core.validateAnswer(phrase.english,phrase.validation).valid,true,`${lesson.id} English phrase`);for(const hebrew of Core.expandAnswerVariants(phrase.hebrew))assert.equal(Core.validateAnswer(hebrew,phrase.validation).valid,true,`${lesson.id} Hebrew phrase: ${hebrew}`)}for(const quiz of shared.lesson.quiz){const english=quiz.options[quiz.answer],hebrew=quiz.optionsHe[quiz.answer];assert.equal(Core.validateAnswer(english,quiz.validation).valid,true,`${lesson.id} English quiz`);for(const answer of Core.expandAnswerVariants(hebrew))assert.equal(Core.validateAnswer(answer,quiz.validation).valid,true,`${lesson.id} Hebrew quiz: ${answer}`)}}});
