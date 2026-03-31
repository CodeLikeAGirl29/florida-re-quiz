let questions = [];
let shuffledQuestions = [];
let currentIdx = 0;
let score = 0;
let seconds = 0;
let timerInterval;
let mastery = {};

// --- Helper Functions ---

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function startTimer(resumeSeconds = 0) {
  clearInterval(timerInterval);
  seconds = resumeSeconds;
  timerInterval = setInterval(() => {
    seconds++;
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    document.getElementById('timer').innerText = `${mins}:${secs}`;
    saveProgress(); // Save time elapsed
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

function clearSavedProgress() {
  localStorage.removeItem('fl_quiz_progress');
}

// --- Core Quiz Logic ---

async function init(selectedCat = 'All') {
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error("Failed to load questions");
    questions = await response.json();

    // Check if we should resume or start fresh
    const isResuming = loadProgress();

    if (!isResuming) {
      let filtered = selectedCat === 'All'
        ? [...questions]
        : questions.filter(q => q.cat === selectedCat);

      shuffledQuestions = shuffleArray(filtered);
      currentIdx = 0;
      score = 0;
      seconds = 0;
      mastery = {};
    }

    document.getElementById('score').innerText = `Score: ${score}/${shuffledQuestions.length}`;
    startTimer(seconds);
    showQuestion();
  } catch (error) {
    console.error("Error:", error);
    document.getElementById('question-text').innerText = "⚠️ Error loading data.json.";
  }
}

function showQuestion() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const qData = shuffledQuestions[currentIdx];

  if (!qData) return finishQuiz();

  document.getElementById('category-tag').innerText = qData.cat;
  document.getElementById('question-text').innerText = qData.q;
  document.getElementById('feedback-area').classList.add('hidden');

  const container = document.getElementById('options-container');
  container.innerHTML = '';

  const optionsWithIndices = qData.options.map((opt, i) => ({ text: opt, originalIdx: i }));

  // Note: We don't reshuffle options on a reload to keep the UI consistent
  optionsWithIndices.forEach((optObj) => {
    const btn = document.createElement('button');
    btn.className = "w-full text-left p-3 rounded-xl border-2 border-slate-100 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-slate-600 font-medium flex justify-between items-center group text-sm";
    btn.innerHTML = `<span>${optObj.text}</span> <i class="fa-solid fa-circle-check opacity-0 group-hover:opacity-20"></i>`;
    btn.onclick = () => checkAnswer(optObj.originalIdx, btn);
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
    clickedBtn.classList.add('bg-green-500', 'text-white', 'border-green-600');
    score++;
    mastery[qData.cat].correct++;
    document.getElementById('feedback-text').innerText = "✨ Correct!";
    document.getElementById('feedback-text').className = "text-green-600 font-bold mb-1";
  } else {
    clickedBtn.classList.add('bg-red-500', 'text-white', 'border-red-600');
    btns.forEach(b => {
      if (b.innerText.includes(qData.options[correctIdx])) {
        b.classList.add('bg-green-100', 'border-green-500', 'text-green-700');
      }
    });
    document.getElementById('feedback-text').innerText = "❌ Incorrect.";
    document.getElementById('feedback-text').className = "text-red-600 font-bold mb-1";
  }

  // --- Explanation Formatting ---
  let formattedExplanation = qData.explanation || "No explanation provided.";

  // Bold color highlights for specific terms
  formattedExplanation = formattedExplanation
    .replace(/(Key Point:)/g, '<strong class="text-blue-600 font-bold">$1</strong>')
    .replace(/(Calculation:)/g, '<strong class="text-purple-600 font-bold">$1</strong>')
    .replace(/(Correction:)/g, '<strong class="text-red-500 font-bold">$1</strong>');

  // Set the "small, gray, italic" look you preferred
  explanationEl.className = "text-xs text-slate-500 font-normal italic mb-4 leading-relaxed px-4";
  explanationEl.innerHTML = formattedExplanation;

  document.getElementById('score').innerText = `Score: ${score}/${shuffledQuestions.length}`;
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
    if (!nextBtn.classList.contains('hidden')) {
      nextBtn.click();
    }
  }
});

// --- Navigation & Start ---

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
  clearSavedProgress(); // Quiz complete, clear storage
  document.getElementById('progress-bar').style.width = "100%";

  const percentage = Math.round((score / shuffledQuestions.length) * 100);
  const passed = percentage >= 70;
  const statusText = passed ? "PASSED" : "FAILED";
  const statusClass = passed ? "text-green-600" : "text-red-600";
  const subMessage = passed ? "Congratulations! You're ready for the state exam." : "Review the material and try again.";

  let masteryHTML = `<div class="mt-6 text-left mb-6">
                      <p class="text-xs font-bold uppercase text-slate-400 mb-2">Performance by Category</p>`;
  for (const cat in mastery) {
    const catScore = Math.round((mastery[cat].correct / mastery[cat].total) * 100);
    const color = catScore >= 70 ? 'text-green-600' : 'text-red-500';
    masteryHTML += `
        <div class="flex justify-between items-center bg-white p-2 mb-1 rounded border border-slate-100">
            <span class="text-xs font-medium text-slate-700">${cat}</span>
            <span class="text-xs font-bold ${color}">${catScore}%</span>
        </div>`;
  }
  masteryHTML += `</div>`;

  if (passed) {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
  }

  const footer = document.getElementById('quiz-footer');
  if (footer) footer.classList.remove('hidden');

  document.getElementById('quiz-box').innerHTML = `
      <div class="text-center pb-10 animate-in">
          <h2 class="text-3xl font-black mb-2 ${statusClass}">${statusText}</h2>
          <p class="text-lg font-bold text-slate-700 mb-1">${percentage}% Correct</p>
          <p class="text-sm text-slate-500 mb-6">${subMessage}</p>
          <div class="bg-slate-50 rounded-lg p-4 mt-4 border border-slate-100">
              <p class="text-sm font-semibold text-slate-600">Final Score: ${score}/${shuffledQuestions.length}</p>
              <p class="text-xs text-slate-400">Total Time: ${document.getElementById('timer').innerText}</p>
          </div>
          ${masteryHTML}
          <button id="restart-btn" onclick="location.reload()" class="w-full bg-slate-800 hover:bg-black text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all transform hover:scale-[1.02]">
              Try Again
          </button>
      </div>`;
}

// --- Formula Cheat Sheet Logic ---
function initFormulaModal() {
  const modal = document.getElementById('formula-modal');
  const openBtn = document.getElementById('formula-btn');
  const closeBtn = document.getElementById('close-modal');

  if (openBtn) {
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.remove('hidden');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  // Close modal if user clicks outside the white box
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.classList.add('hidden');
    }
  });
}

// --- Navigation & Start ---
async function startQuiz() {
  const welcome = document.getElementById('welcome-screen');
  const main = document.getElementById('main-container');
  const footer = document.getElementById('quiz-footer');

  welcome.classList.add('animate-out');

  setTimeout(async () => {
    welcome.classList.add('hidden');
    // Hide footer during quiz
    if (footer) footer.classList.add('hidden');

    main.classList.remove('hidden');
    main.classList.add('animate-in');

    initFormulaModal();
    await init();
  }, 300);
}

// Handle the Next Button
document.getElementById('next-btn').onclick = () => {
  currentIdx++;
  if (currentIdx < shuffledQuestions.length) {
    showQuestion();
    saveProgress();
  } else {
    finishQuiz();
  }
};

// --- App Initialization & Button Logic ---
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start-quiz-btn');
  const newQuizBtn = document.getElementById('new-quiz-btn');
  const footer = document.getElementById('quiz-footer');

  // Check if there is a saved session in LocalStorage
  if (localStorage.getItem('fl_quiz_progress')) {
    // 1. Change the primary button to "Resume Quiz" and style it green
    startBtn.innerHTML = `Resume Quiz <i class="fa-solid fa-rotate-right ml-2 text-xs"></i>`;
    startBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
    startBtn.classList.add('bg-green-600', 'hover:bg-green-700');

    // 2. Reveal the "Start New Quiz" button by removing the 'hidden' class
    if (newQuizBtn) {
      newQuizBtn.classList.remove('hidden');
    }
  }

  // Handle "Resume / Take Quiz"
  startBtn.onclick = startQuiz;

  // Handle "Start New Quiz"
  if (newQuizBtn) {
    newQuizBtn.onclick = () => {
      const confirmNew = confirm("This will delete your current progress. Are you sure you want to start a new quiz?");
      if (confirmNew) {
        clearSavedProgress(); // Removes progress from localStorage
        location.reload();    // Hard reset to clear variables and start at the Welcome screen
      }
    };
  }
});