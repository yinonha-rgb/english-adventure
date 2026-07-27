const state = { lessons: [], current: null, step: 0, score: 0, completed: new Set(JSON.parse(localStorage.getItem('ea-completed') || '[]')) };
const $ = (selector) => document.querySelector(selector);
const grid = $('#lessonGrid');
const modal = $('#lessonModal');

async function init() {
  try {
    const response = await fetch('content.json');
    if (!response.ok) throw new Error('Content could not be loaded');
    state.lessons = (await response.json()).lessons;
    renderLessons(); updateDashboard();
  } catch (error) {
    grid.innerHTML = `<p>We couldn't load the adventure. Please refresh and try again.</p>`;
  }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

function renderLessons() {
  grid.innerHTML = state.lessons.map((lesson, index) => {
    const done = state.completed.has(lesson.id);
    return `<article class="lesson-card"><div class="lesson-icon">${lesson.icon}</div><h3>${lesson.title}</h3><p>${lesson.description}</p><div class="meta"><span>${lesson.phrases.length} phrases</span><span>${lesson.level}</span></div><button class="start-btn ${done ? 'done' : ''}" data-id="${lesson.id}">${done ? 'Practice again ✓' : `Start lesson ${index + 1}`}</button></article>`;
  }).join('');
}

function updateDashboard() {
  const total = state.lessons.length || 1;
  const percent = Math.round((state.completed.size / total) * 100);
  $('#progressRing').style.setProperty('--p', percent);
  $('#progressPercent').textContent = `${percent}%`;
  $('#progressTitle').textContent = percent === 100 ? 'Adventure complete!' : percent ? 'Great momentum!' : 'Ready to begin?';
  $('#progressText').textContent = percent === 100 ? 'You finished every lesson. Keep practicing!' : `${state.completed.size} of ${state.lessons.length} lessons complete.`;
}

function openLesson(id) {
  state.current = state.lessons.find((lesson) => lesson.id === id); state.step = 0; state.score = 0;
  $('#lessonCategory').textContent = state.current.category; $('#lessonTitle').textContent = `${state.current.icon} ${state.current.title}`;
  modal.classList.add('open'); document.body.style.overflow = 'hidden'; renderStep();
}

function renderStep() {
  const lesson = state.current; const phraseCount = lesson.phrases.length; const total = phraseCount + lesson.quiz.length;
  $('#lessonProgressBar').style.width = `${Math.round((state.step / total) * 100)}%`;
  if (state.step < phraseCount) {
    const phrase = lesson.phrases[state.step];
    $('#lessonBody').innerHTML = `<div class="step active"><h3>Listen and repeat</h3><p>Tap the sound button, then say the phrase aloud.</p><div class="phrase"><div class="phrase-row"><strong>${phrase.english}</strong><button class="speak" data-speak="${phrase.english}" aria-label="Hear pronunciation">🔊</button></div><p class="translation">${phrase.meaning}</p></div><button class="primary" id="nextStep">Got it — next</button></div>`;
  } else if (state.step < total) {
    const quiz = lesson.quiz[state.step - phraseCount];
    $('#lessonBody').innerHTML = `<div class="step active"><h3>Quick challenge</h3><p>${quiz.question}</p><div class="options">${quiz.options.map((option, i) => `<button class="option" data-answer="${i}">${option}</button>`).join('')}</div><div class="feedback" id="feedback"></div><button class="primary" id="nextStep" hidden>Continue</button></div>`;
  } else {
    state.completed.add(lesson.id); localStorage.setItem('ea-completed', JSON.stringify([...state.completed])); renderLessons(); updateDashboard();
    $('#lessonProgressBar').style.width = '100%';
    $('#lessonBody').innerHTML = `<div class="complete"><div class="trophy">🏆</div><h3>Lesson complete!</h3><p>You scored ${state.score} of ${lesson.quiz.length}. Every repeat makes your English stronger.</p><button class="primary" id="finishLesson">Back to the map</button></div>`;
  }
}

function answer(button) {
  if ($('#nextStep').hidden === false) return;
  const quiz = state.current.quiz[state.step - state.current.phrases.length]; const chosen = Number(button.dataset.answer); const correctButton = document.querySelector(`[data-answer="${quiz.answer}"]`);
  correctButton.classList.add('correct');
  if (chosen === quiz.answer) { state.score++; $('#feedback').textContent = 'Excellent! That’s right. ✨'; }
  else { button.classList.add('wrong'); $('#feedback').textContent = `Almost! ${quiz.explanation}`; }
  document.querySelectorAll('.option').forEach((item) => item.disabled = true); $('#nextStep').hidden = false;
}

function speak(text) { if (!('speechSynthesis' in window)) return showToast('Speech is not available in this browser.'); speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'en-US'; utterance.rate = .85; speechSynthesis.speak(utterance); }
function closeLesson() { modal.classList.remove('open'); document.body.style.overflow = ''; }
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2400); }

grid.addEventListener('click', (event) => { const button = event.target.closest('[data-id]'); if (button) openLesson(button.dataset.id); });
$('#lessonBody').addEventListener('click', (event) => { const speakButton = event.target.closest('[data-speak]'); const answerButton = event.target.closest('[data-answer]'); if (speakButton) speak(speakButton.dataset.speak); if (answerButton) answer(answerButton); if (event.target.id === 'nextStep') { state.step++; renderStep(); } if (event.target.id === 'finishLesson') closeLesson(); });
$('#closeModal').addEventListener('click', closeLesson); modal.addEventListener('click', (event) => { if (event.target === modal) closeLesson(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeLesson(); });
$('#resetBtn').addEventListener('click', () => { if (!confirm('Reset all lesson progress?')) return; state.completed.clear(); localStorage.removeItem('ea-completed'); renderLessons(); updateDashboard(); showToast('Progress reset. Fresh adventure!'); });

let installPrompt; window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); installPrompt = event; $('#installBtn').hidden = false; });
$('#installBtn').addEventListener('click', async () => { if (!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; $('#installBtn').hidden = true; });
init();
