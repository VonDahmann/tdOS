/**
 * quiz.js
 */

const questions = [
  {
    q: "The 'Convoy Effect' occurs in which scheduling algorithm?",
    options: ["Round Robin", "Shortest Job First", "First Come First Serve (FCFS)", "Priority Scheduling"],
    ans: 2,
    explanation: "FCFS suffers from the Convoy Effect, where small processes wait behind a very large process."
  },
  {
    q: "Which algorithm is optimal and gives the minimum average waiting time for a given set of processes?",
    options: ["SJF (Shortest Job First)", "FCFS", "Round Robin", "Multi-Level Queue"],
    ans: 0,
    explanation: "SJF always yields the minimum average waiting time by executing shortest bursts first."
  },
  {
    q: "What is a major problem with Priority Scheduling?",
    options: ["Context Switching Overhead", "Starvation of low-priority processes", "High response time", "Implementation complexity"],
    ans: 1,
    explanation: "Low-priority processes may never execute if high-priority processes keep arriving (Starvation). The solution is Aging."
  },
  {
    q: "If the Time Quantum in Round Robin is very large, the algorithm behaves like:",
    options: ["SJF", "SRTF", "FCFS", "Multi-Level Feedback"],
    ans: 2,
    explanation: "If the quantum is larger than the max burst time, every process finishes in one go, acting exactly like FCFS."
  },
  {
    q: "When a process finishes its CPU burst and requires I/O, its state changes from RUNNING to:",
    options: ["READY", "WAITING / BLOCKED", "TERMINATED", "NEW"],
    ans: 1,
    explanation: "A process goes to the WAITING (or Blocked) state while doing I/O."
  },
  {
    q: "In Multi-Level Feedback Queues, how is starvation typically prevented?",
    options: ["By randomizing priorities", "By increasing quantum sizes in lower queues", "By aging (moving processes to higher-priority queues over time)", "It cannot be prevented"],
    ans: 2,
    explanation: "Aging is used to incrementally promote processes from lower queues back to Q1."
  },
  {
    q: "Turnaround Time (ATT) is calculated as:",
    options: ["Completion Time - Arrival Time", "Burst Time + Waiting Time", "Both A and B", "First CPU Start - Arrival Time"],
    ans: 2,
    explanation: "Both formulas are correct: CT - AT equals BT + WT."
  },
  {
    q: "Which scheduling algorithm naturally provides the lowest Response Time for interactive processes?",
    options: ["FCFS", "SJF (Non-Preemptive)", "Round Robin", "Priority (Non-Preemptive)"],
    ans: 2,
    explanation: "Round Robin guarantees every process gets a slice of CPU quickly, minimizing response time."
  },
  {
    q: "What happens during an 'Interrupt' in a preemptive system?",
    options: ["A running process is moved to WAITING state", "A running process is moved to READY state", "The system crashes", "The process skips its next I/O"],
    ans: 1,
    explanation: "Hardware/Timer interrupts force the CPU to context switch, placing the current process back in the READY queue."
  },
  {
    q: "Response Time is purely a measure of:",
    options: ["How fast a process finishes entirely", "How long a process awaits I/O", "How quickly a process gets the CPU for the very first time", "The size of the time quantum"],
    ans: 2,
    explanation: "Response Time is the difference between Arrival Time and the first time the process is scheduled."
  }
];

document.addEventListener('DOMContentLoaded', () => {
  let currentQIdx = 0;
  let score = 0;
  let hasAnswered = false;

  // Shuffle questions randomly once loaded
  const shuffledQs = [...questions].sort(() => Math.random() - 0.5).map((q, idx) => {
    // We want 10 questions total and our list is exactly 10, just keep the randomized order
    return q;
  });

  const quizContainer = document.getElementById('quizContainer');
  const resultsPanel = document.getElementById('resultsPanel');
  const questionCounter = document.getElementById('questionCounter');
  const scoreDisplay = document.getElementById('scoreDisplay');
  const progressFill = document.getElementById('progressFill');
  const questionText = document.getElementById('questionText');
  const optionsGrid = document.getElementById('optionsGrid');
  const feedbackBox = document.getElementById('feedbackBox');
  const feedbackText = document.getElementById('feedbackText');
  const nextBtn = document.getElementById('nextBtn');
  const retryBtn = document.getElementById('retryBtn');

  function loadQuestion() {
    hasAnswered = false;
    feedbackBox.style.display = 'none';
    
    const qData = shuffledQs[currentQIdx];
    questionCounter.innerText = `Question ${currentQIdx + 1} / ${shuffledQs.length}`;
    scoreDisplay.innerText = `Score: ${score}`;
    progressFill.style.width = `${((currentQIdx) / shuffledQs.length) * 100}%`;
    
    questionText.innerText = qData.q;
    optionsGrid.innerHTML = '';

    qData.options.forEach((optText, i) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerText = optText;
      btn.onclick = () => selectOption(i, btn);
      optionsGrid.appendChild(btn);
    });
  }

  function selectOption(selectedIndex, btnElement) {
    if (hasAnswered) return;
    hasAnswered = true;

    const qData = shuffledQs[currentQIdx];
    const isCorrect = (selectedIndex === qData.ans);

    // Disable all options
    const btns = optionsGrid.querySelectorAll('.option-btn');
    btns.forEach(b => b.disabled = true);

    if (isCorrect) {
      btnElement.classList.add('correct');
      score++;
      scoreDisplay.innerText = `Score: ${score}`;
      feedbackBox.className = 'feedback-box correct';
      feedbackText.innerHTML = `<strong>Correct!</strong> ${qData.explanation}`;
    } else {
      btnElement.classList.add('wrong');
      btns[qData.ans].classList.add('correct'); // Highlight answer
      feedbackBox.className = 'feedback-box wrong';
      feedbackText.innerHTML = `<strong>Incorrect.</strong> ${qData.explanation}`;
    }

    feedbackBox.style.display = 'flex';
  }

  nextBtn.addEventListener('click', () => {
    currentQIdx++;
    if (currentQIdx < shuffledQs.length) {
      loadQuestion();
    } else {
      showResults();
    }
  });

  function showResults() {
    quizContainer.style.display = 'none';
    resultsPanel.style.display = 'block';
    
    document.getElementById('finalScore').innerText = `${score}/${shuffledQs.length}`;
    
    const msg = document.getElementById('finalMessage');
    if (score === 10) msg.innerText = "Perfect! You're an OS master!";
    else if (score >= 7) msg.innerText = "Great job! You have a solid grasp of scheduling.";
    else if (score >= 5) msg.innerText = "Good effort, but there's room to review the formulas.";
    else msg.innerText = "Time to revisit the interactive simulations to study more!";
  }

  retryBtn.addEventListener('click', () => {
    score = 0;
    currentQIdx = 0;
    // Reshuffle optional here
    shuffledQs.sort(() => Math.random() - 0.5);
    quizContainer.style.display = 'block';
    resultsPanel.style.display = 'none';
    loadQuestion();
  });

  // Start
  loadQuestion();
});
