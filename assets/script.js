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

function startTimer() {
  clearInterval(timerInterval);
  seconds = 0;
  timerInterval = setInterval(() => {
    seconds++;
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    document.getElementById('timer').innerText = `${mins}:${secs}`;
  }, 1000);
}

function updateProgress() {
  const percent = (currentIdx / shuffledQuestions.length) * 100;
  document.getElementById('progress-bar').style.width = percent + "%";
}

// --- Core Quiz Logic ---

async function init() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error("Failed to load questions");
    questions = await response.json();

    shuffledQuestions = shuffleArray([...questions]);
    currentIdx = 0;
    score = 0;
    mastery = {}; // Reset mastery for new session

    document.getElementById('score').innerText = `Score: 0/${shuffledQuestions.length}`;
    startTimer();
    showQuestion();
  } catch (error) {
    console.error("Error:", error);
    document.getElementById('question-text').innerText = "⚠️ Error loading data.json. Ensure you are using a Live Server.";
  }
}

function showQuestion() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const qData = shuffledQuestions[currentIdx];
  document.getElementById('category-tag').innerText = qData.cat;
  document.getElementById('question-text').innerText = qData.q;
  document.getElementById('feedback-area').classList.add('hidden');

  const container = document.getElementById('options-container');
  container.innerHTML = '';

  const optionsWithIndices = qData.options.map((opt, i) => ({ text: opt, originalIdx: i }));
  shuffleArray(optionsWithIndices);

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

  // Explanation Formatting
  let formattedExplanation = qData.explanation || "No explanation provided.";
  formattedExplanation = formattedExplanation
    .replace(/(Key Point:)/g, '<strong class="text-blue-600">$1</strong>')
    .replace(/(Calculation:)/g, '<strong class="text-purple-600 font-bold">$1</strong>')
    .replace(/(Correction:)/g, '<strong class="text-red-500">$1</strong>');

  explanationEl.innerHTML = formattedExplanation;
  document.getElementById('score').innerText = `Score: ${score}/${shuffledQuestions.length}`;
  feedbackArea.classList.remove('hidden');
}

// --- Navigation & Start ---

document.getElementById('next-btn').onclick = () => {
  currentIdx++;
  if (currentIdx < shuffledQuestions.length) {
    showQuestion();
  } else {
    finishQuiz();
  }
};

function finishQuiz() {
  clearInterval(timerInterval);
  document.getElementById('progress-bar').style.width = "100%";

  const percentage = Math.round((score / shuffledQuestions.length) * 100);
  const passed = percentage >= 70;
  const statusText = passed ? "PASSED" : "FAILED";
  const statusClass = passed ? "text-green-600" : "text-red-600";
  const subMessage = passed ? "Congratulations! You're ready for the state exam." : "Review the material and try again.";

  // Build Mastery breakdown
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

async function startQuiz() {
  const welcome = document.getElementById('welcome-screen');
  const main = document.getElementById('main-container');

  welcome.classList.add('animate-out');
  setTimeout(async () => {
    welcome.classList.add('hidden');
    main.classList.remove('hidden');
    main.classList.add('animate-in');
    await init();
  }, 300);
}

// Final Step: Link the button
document.getElementById('start-quiz-btn').onclick = startQuiz;