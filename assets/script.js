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
  const qData = shuffledQuestions[currentIdx];
  document.getElementById('category-tag').innerText = qData.cat;
  document.getElementById('question-text').innerText = qData.q;
  document.getElementById('feedback-area').classList.add('hidden');

  const container = document.getElementById('options-container');
  container.innerHTML = '';
  container.className = "space-y-3 pb-10";

  // Map options to keep track of the original index for correct/incorrect checking
  const optionsWithIndices = qData.options.map((opt, i) => ({ text: opt, originalIdx: i }));
  shuffleArray(optionsWithIndices);

  optionsWithIndices.forEach((optObj) => {
    const btn = document.createElement('button');
    btn.className = "w-full text-left p-4 rounded-xl border-2 border-slate-100 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-slate-600 font-medium flex justify-between items-center group";
    btn.innerHTML = `<span>${optObj.text}</span> <i class="fa-solid fa-circle-check opacity-0 group-hover:opacity-20"></i>`;
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

    // Results screen
    document.getElementById('quiz-box').innerHTML = `
            <div class="text-center pb-10">
                <h2 class="text-2xl font-bold mb-4 text-slate-800">Exam Finished!</h2>
                <p class="text-lg font-semibold mb-2">Final Score: ${score}/${shuffledQuestions.length}</p>
                <p class="mb-8 text-slate-500">Total Time: ${document.getElementById('timer').innerText}</p>
                <button id="restart-btn" onclick="location.reload()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all">
                    Restart Quiz
                </button>
            </div>`;
  }
};

// Start the app
init();