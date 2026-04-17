let questions = [];
let shuffledQuestions = [];
let currentIdx = 0;
let score = 0;
let seconds = 0;
let timerInterval;
let mastery = {};

// --- Helper Functions ---

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function startTimer(resumeSeconds = 0) {
  clearInterval(timerInterval);
  seconds = resumeSeconds;
  timerInterval = setInterval(() => {
    seconds++;
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    document.getElementById('timer').innerText = `${mins}:${secs}`;
    saveProgress();
  }, 1000);
}

function updateProgress() {
  const percent = (currentIdx / shuffledQuestions.length) * 100;
  document.getElementById('progress-bar').style.width = percent + "%";
}

// --- Persistence Logic ---

function saveProgress() {
  const quizState = {
    currentIdx,
    score,
    seconds,
    shuffledQuestions,
    mastery
  };
  localStorage.setItem('fl_quiz_progress', JSON.stringify(quizState));
}

function loadProgress() {
  const saved = localStorage.getItem('fl_quiz_progress');
  if (saved) {
    const state = JSON.parse(saved);
    currentIdx = state.currentIdx;
    score = state.score;
    seconds = state.seconds || 0;
    shuffledQuestions = state.shuffledQuestions;
    mastery = state.mastery || {};
    return true;
  }
  return false;
}

// --- Core Quiz Logic ---

async function init(limit = null) {
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error("Failed to load questions");
    questions = await response.json();

    // 1. Shuffle and optionally slice
    shuffledQuestions = shuffleArray(questions);

    if (limit) {
      shuffledQuestions = shuffledQuestions.slice(0, limit);
    }

    currentIdx = 0;
    score = 0;
    seconds = 0;
    mastery = {};

    document.getElementById('score').innerText = `SCORE: ${score}/${shuffledQuestions.length}`;
    startTimer(seconds);
    showQuestion();
    saveProgress();
  } catch (error) {
    console.error("Error:", error);
    document.getElementById('question-text').innerText = "⚠️ Error loading questions.";
  }
}

function showQuestion() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const qData = shuffledQuestions[currentIdx];

  if (!qData) return finishQuiz();

  document.getElementById('category-tag').innerText = qData.cat || "General";
  document.getElementById('question-text').innerText = qData.q;
  document.getElementById('feedback-area').classList.add('hidden');

  const container = document.getElementById('options-container');
  container.innerHTML = '';

  qData.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    // Using your Minimalist / Neo-Brutal style for options
    btn.className = "w-full text-left px-5 py-4 rounded-xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all duration-100 text-slate-600 font-semibold flex justify-between items-center group text-sm";
    btn.innerHTML = `<span>${opt}</span> <span class="mono text-[10px] opacity-0 group-hover:opacity-100 text-indigo-400 font-bold">KEY [${i + 1}]</span>`;
    btn.onclick = () => checkAnswer(i, btn);
    container.appendChild(btn);
  });

  updateProgress();
}

function checkAnswer(selectedIdx, clickedBtn) {
  const qData = shuffledQuestions[currentIdx];
  const feedbackArea = document.getElementById('feedback-area');
  const explanationEl = document.getElementById('explanation-text');
  const correctIdx = qData.correct;
  const btns = document.querySelectorAll('#options-container button');

  if (!mastery[qData.cat]) mastery[qData.cat] = { correct: 0, total: 0 };
  mastery[qData.cat].total++;

  btns.forEach(b => b.disabled = true);

  if (selectedIdx === correctIdx) {
    // Sharp borders and soft backgrounds for minimalist look
    clickedBtn.classList.replace('border-slate-100', 'border-indigo-500');
    clickedBtn.classList.add('bg-indigo-50/50');
    clickedBtn.classList.replace('border-slate-100', 'border-green-500');
    clickedBtn.classList.add('bg-green-50');
    score++;
    mastery[qData.cat].correct++;
    document.getElementById('feedback-text').innerText = "CORRECT";
    document.getElementById('feedback-text').className = "text-[10px] font-black tracking-widest text-green-600 mb-1";
  } else {
    clickedBtn.classList.replace('border-slate-100', 'border-rose-500');
    clickedBtn.classList.add('bg-rose-50/50');
    btns[correctIdx].classList.replace('border-slate-100', 'border-emerald-500');
    btns[correctIdx].classList.add('bg-emerald-50/50');
    clickedBtn.classList.replace('border-slate-100', 'border-red-500');
    clickedBtn.classList.add('bg-red-50');
    btns[correctIdx].classList.replace('border-slate-100', 'border-green-500');
    btns[correctIdx].classList.add('bg-green-50');

    document.getElementById('feedback-text').innerText = "INCORRECT";
    document.getElementById('feedback-text').className = "text-[10px] font-black tracking-widest text-red-600 mb-1";
  }

  // --- Explanation Formatting ---
  let formattedExplanation = qData.explanation || "No explanation provided.";
  formattedExplanation = formattedExplanation
    .replace(/(Key Point:)/g, '<strong class="text-indigo-600 font-bold">$1</strong>')
    .replace(/(Calculation:)/g, '<strong class="text-purple-600 font-bold">$1</strong>')
    .replace(/(Correction:)/g, '<strong class="text-red-500 font-bold">$1</strong>');

  explanationEl.innerHTML = formattedExplanation;
  document.getElementById('score').innerText = `SCORE: ${score}/${shuffledQuestions.length}`;
  feedbackArea.classList.remove('hidden');
  saveProgress();
}

// --- Keyboard Support ---
window.addEventListener('keydown', (e) => {
  if (document.getElementById('main-container').classList.contains('hidden')) return;

  if (['1', '2', '3', '4'].includes(e.key)) {
    const buttons = document.querySelectorAll('#options-container button');
    if (buttons[e.key - 1] && !buttons[e.key - 1].disabled) {
      buttons[e.key - 1].click();
    }
  } else if (e.key === 'Enter') {
    const nextBtn = document.getElementById('next-btn');
    const feedbackArea = document.getElementById('feedback-area');
    if (!feedbackArea.classList.contains('hidden')) {
      nextBtn.click();
    }
  }
});

// --- Navigation ---

document.getElementById('next-btn').onclick = () => {
  currentIdx++;
  if (currentIdx < shuffledQuestions.length) {
    showQuestion();
    saveProgress();
  } else {
    finishQuiz();
  }
};

function finishQuiz() {
  clearInterval(timerInterval);
  localStorage.removeItem('fl_quiz_progress');

  const percentage = Math.round((score / shuffledQuestions.length) * 100);
  const passed = percentage >= 75; // Pearson VUE Standard

  if (passed) {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
  }

  document.getElementById('main-container').innerHTML = `
      <div class="p-10 text-center animate-slide-up">
          <h2 class="text-3xl font-800 mb-2 ${passed ? 'text-green-600' : 'text-slate-900'}">
            ${passed ? 'DRILL COMPLETE' : 'KEEP DRILLING'}
          </h2>
          <p class="text-4xl font-black text-slate-900 mb-1">${percentage}%</p>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Final Score: ${score}/${shuffledQuestions.length}</p>
          
          <button onclick="location.reload()" class="w-full h-14 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg">
              Return to Menu
          </button>
      </div>`;
}

// --- UI Logic ---

function startQuizUI() {
  document.getElementById('welcome-screen').classList.add('hidden');
  document.getElementById('main-container').classList.remove('hidden');
  initFormulaModal();
}

function initFormulaModal() {
  const modal = document.getElementById('formula-modal');
  const openBtn = document.getElementById('formula-btn');
  const closeBtn = document.getElementById('close-modal');

  openBtn.onclick = () => modal.classList.remove('hidden');
  closeBtn.onclick = () => modal.classList.add('hidden');
  modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
}

// --- App Entry Point ---

document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start-quiz-btn');
  const quickBtn = document.getElementById('quick-20-btn');
  const resumeBtn = document.getElementById('resume-btn');

  // Resume check
  if (localStorage.getItem('fl_quiz_progress')) {
    resumeBtn.classList.remove('hidden');
  }

  startBtn.onclick = () => { startQuizUI(); init(); };
  quickBtn.onclick = () => { startQuizUI(); init(20); };

  resumeBtn.onclick = () => {
    startQuizUI();
    loadProgress();
    document.getElementById('score').innerText = `SCORE: ${score}/${shuffledQuestions.length}`;
    startTimer(seconds);
    showQuestion();
  };
});

// Add the Quick 20 event listener
document.getElementById('quick-20-btn').onclick = () => {
  startQuizUI();
  init(20); // Passes the limit to the init function
};