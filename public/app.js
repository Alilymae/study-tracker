const timeEl = document.getElementById("time");
const startStopBtn = document.getElementById("startStop");
const pausePlayBtn = document.getElementById("pausePlay");
const submitBtn = document.getElementById("submit");
const statusEl = document.getElementById("status");
const todayTotalEl = document.getElementById("todayTotal");
const goalInput = document.getElementById("goalInput");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

// Timer state
let startTime = 0;
let elapsedMs = 0;
let tick = null;
let isRunning = false;
let isPaused = false;

// Format ms → HH:MM:SS
function format(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Update UI
function render() {
  timeEl.textContent = format(elapsedMs);
  submitBtn.disabled = elapsedMs <= 0;
  pausePlayBtn.disabled = !isRunning;
  pausePlayBtn.textContent = isPaused ? "Play" : "Pause";
}

// START RESUME TIMER
function startTimer() {
  if (isRunning) return;

  isRunning = true;
  isPaused = false;
  startTime = Date.now();

  tick = setInterval(() => {
    elapsedMs += Date.now() - startTime;
    startTime = Date.now();
    render();
  }, 250);

  startStopBtn.textContent = "Stop";
  statusEl.textContent = "Timer running…";
  render();
}

// Pause / Play
function togglePause() {
  if (!isRunning) return;

  if (!isPaused) {
    clearInterval(tick);
    tick = null;
    isPaused = true;
    statusEl.textContent = "Paused";
  } else {
    isPaused = false;
    startTime = Date.now();
    tick = setInterval(() => {
      elapsedMs += Date.now() - startTime;
      startTime = Date.now();
      render();
    }, 250);
    statusEl.textContent = "Timer running…";
  }

  render();
}

// Stop timer
function stopTimer() {
  clearInterval(tick);
  tick = null;
  isRunning = false;
  isPaused = false;
  startStopBtn.textContent = "Start";
  statusEl.textContent = "Timer stopped. Ready to submit.";
  render();
}

// Buttons
startStopBtn.addEventListener("click", () => {
  isRunning ? stopTimer() : startTimer();
});

pausePlayBtn.addEventListener("click", togglePause);

// Submit study session
submitBtn.addEventListener("click", async () => {
  if (isRunning) stopTimer();

  const minutes = Math.floor(elapsedMs / 60000);
  if (minutes <= 0) return;

  statusEl.textContent = "Submitting…";

  const res = await fetch("/api/study", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ minutes })
  });

  const data = await res.json();
  statusEl.textContent = data.ok ? "Saved!" : data.message;

  elapsedMs = 0;
  startTime = 0;
  render();
  fetchTodayTotal();
});

// Goal input (localStorage)
goalInput.value = localStorage.getItem("dailyGoal") || "";

goalInput.addEventListener("input", () => {
  localStorage.setItem("dailyGoal", goalInput.value);
  fetchTodayTotal();
});

// Fetch today’s total from backend
async function fetchTodayTotal() {
  const res = await fetch("/api/study/today");
  const data = await res.json();

  const total = data.totalMinutes || 0;
  todayTotalEl.textContent = `Today: ${total} minutes`;

  updateProgress(total);
}

// UPDATE PROGRESS BAR
function updateProgress(totalMinutes) {
  const goal = Number(goalInput.value);
  if (!goal) {
    progressBar.style.width = "0%";
    progressText.textContent = "";
    return;
  }
//MONKEY CHECK THIS AGAIN
  const percent = Math.min((totalMinutes / goal) * 100, 100);
  progressBar.style.width = percent + "%";
  progressText.textContent = `${totalMinutes} / ${goal} minutes`;
}

//EYE MOVEMNT
const eyes = document.getElementById("eyes");

document.addEventListener("mousemove", (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 20;
  const y = (e.clientY / window.innerHeight - 0.5) * 20;

  eyes.style.transform = `
    translate(-50%, -50%)
    translate(${x}px, ${y}px)
  `;
});

// RUN THE APP INIT?
render();
fetchTodayTotal();