const timeEl = document.getElementById("time");
const startStopBtn = document.getElementById("startStop");
const pausePlayBtn = document.getElementById("pausePlay");
const submitBtn = document.getElementById("submit");
const statusEl = document.getElementById("status");
const todayTotalEl = document.getElementById("todayTotal");

let startTime = 0;
let elapsedMs = 0;
let tick = null;
let isRunning = false;
let isPaused = false;

function format(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function render() {
  timeEl.textContent = format(elapsedMs);
  submitBtn.disabled = elapsedMs <= 0;
  pausePlayBtn.disabled = elapsedMs <= 0;
  pausePlayBtn.textContent = isPaused ? "Play" : "Pause";
}

// Start a new session or resume
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

  pausePlayBtn.disabled = false;
  startStopBtn.textContent = "Stop";
  statusEl.textContent = "Timer running…";
}

// Pause or resume
function togglePause() {
  if (!isRunning) return;

  if (!isPaused) {
    // Pause
    clearInterval(tick);
    tick = null;
    isPaused = true;
    statusEl.textContent = "Paused";
  } else {
    // Resume
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

function stopTimer() {
  if (tick) clearInterval(tick);
  tick = null;
  isRunning = false;
  isPaused = false;
  startStopBtn.textContent = "Start";
  statusEl.textContent = "Timer stopped. Ready to submit.";
  render();
}

startStopBtn.addEventListener("click", () => {
  if (!isRunning) startTimer();
  else stopTimer();
});

pausePlayBtn.addEventListener("click", togglePause);

// Submit handler
submitBtn.addEventListener("click", async () => {
  if (isRunning && !isPaused) togglePause();

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
  isRunning = false;
  isPaused = false;
  render();
  fetchTodayTotal();
});

render();
fetchTodayTotal();