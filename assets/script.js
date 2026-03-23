let questions = []; // Now starts empty
let shuffledQuestions = [];
let currentIdx = 0;
let score = 0;
let seconds = 0;
let timerInterval;

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

/**
 * UPDATED: Now an async function to fetch your data.json
 */
async function init() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error("Failed to load questions");

    // Load the JSON data into our global questions array
    questions = await response.json();

    // Now proceed with your original initialization logic
    shuffledQuestions = shuffleArray([...questions]);
    currentIdx = 0;
    score = 0;

    document.getElementById('score').innerText = `Score: 0/${shuffledQuestions.length}`;
    startTimer();
    showQuestion();
  } catch (error) {
    console.error("Error:", error);
    document.getElementById('question-text').innerText = "⚠️ Error loading data.json. Make sure you are using a Live Server.";
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
  container.className = "space-y-2 pb-4";

  // Map options to keep track of the original index for correct/incorrect checking
  const optionsWithIndices = qData.options.map((opt, i) => ({ text: opt, originalIdx: i }));
  shuffleArray(optionsWithIndices);

  optionsWithIndices.forEach((optObj) => {
    const btn = document.createElement('button');
btn.className = "w-full text-left p-3 rounded-xl border-2 border-slate-100 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-slate-600 font-medium flex justify-between items-center group text-sm";    btn.innerHTML = `<span>${optObj.text}</span> <i class="fa-solid fa-circle-check opacity-0 group-hover:opacity-20"></i>`;
    btn.onclick = () => checkAnswer(optObj.originalIdx, btn);
    container.appendChild(btn);
  });

  updateProgress();
}

function checkAnswer(selectedIdx, clickedBtn) {
  const correctIdx = shuffledQuestions[currentIdx].correct;
  const btns = document.querySelectorAll('#options-container button');

  btns.forEach(b => b.disabled = true);

  if (selectedIdx === correctIdx) {
    clickedBtn.classList.add('bg-green-500', 'text-white', 'border-green-600');
    score++;
    document.getElementById('score').innerText = `Score: ${score}/${shuffledQuestions.length}`;
    document.getElementById('feedback-text').innerText = "✨ Correct! Keep it up.";
    document.getElementById('feedback-text').className = "text-green-600 font-bold mb-4";
  } else {
    clickedBtn.classList.add('bg-red-500', 'text-white', 'border-red-600');
    document.getElementById('score').innerText = `Score: ${score}/${shuffledQuestions.length}`;

    btns.forEach(b => {
      // Logic to find the correct button text and highlight it
      if (b.innerText.includes(shuffledQuestions[currentIdx].options[correctIdx])) {
        b.classList.add('bg-green-100', 'border-green-500', 'text-green-700');
      }
    });
    document.getElementById('feedback-text').innerText = "❌ Incorrect. Review the answer above.";
    document.getElementById('feedback-text').className = "text-red-600 font-bold mb-4";
  }

  document.getElementById('feedback-area').classList.remove('hidden');
}

function updateProgress() {
  const percent = (currentIdx / shuffledQuestions.length) * 100;
  document.getElementById('progress-bar').style.width = percent + "%";
}

document.getElementById('next-btn').onclick = () => {
  currentIdx++;
  if (currentIdx < shuffledQuestions.length) {
    showQuestion();
  } else {
    clearInterval(timerInterval);
    document.getElementById('progress-bar').style.width = "100%";

    // 1. Calculate percentage
    const percentage = Math.round((score / shuffledQuestions.length) * 100);
    const passingScore = 70; // Set your passing grade here
    const passed = percentage >= passingScore;

    // 2. Determine Pass/Fail styling and message
    const statusText = passed ? "PASSED" : "FAILED";
    const statusClass = passed ? "text-green-600" : "text-red-600";
    const subMessage = passed 
        ? "Congratulations! You're ready for the state exam." 
        : "Don't give up! Review the material and try again.";

    // 3. Trigger Confetti if passed
    if (passed) {
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#22c55e', '#3b82f6', '#f59e0b']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#22c55e', '#3b82f6', '#f59e0b']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }

    // 4. Results screen display
    document.getElementById('quiz-box').innerHTML = `
        <div class="text-center pb-10 animate-in">
            <h2 class="text-3xl font-black mb-2 ${statusClass}">${statusText}</h2>
            <p class="text-lg font-bold text-slate-700 mb-1">${percentage}% Correct</p>
            <p class="text-sm text-slate-500 mb-6">${subMessage}</p>
            
            <div class="bg-slate-50 rounded-lg p-4 mb-8 border border-slate-100">
                <p class="text-sm font-semibold text-slate-600">Final Score: ${score}/${shuffledQuestions.length}</p>
                <p class="text-xs text-slate-400">Total Time: ${document.getElementById('timer').innerText}</p>
            </div>

            <button id="restart-btn" onclick="location.reload()" class="w-full bg-slate-800 hover:bg-black text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all transform hover:scale-[1.02]">
                Try Again
            </button>
        </div>`;
  }
};

// Start the app
init();
