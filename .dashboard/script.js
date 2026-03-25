/**
 * DASHBOARD SHELL v1.0.4.ALPHA
 * Features: Auto-refresh & Real-time Mocked Metrics
 */

// 1. Clock Update
function updateClock() {
    const clock = document.getElementById('clock');
    const now = new Date();
    clock.textContent = now.toLocaleTimeString('en-US', { hour12: false });
}
setInterval(updateClock, 1000);
updateClock();

// 2. Mocking Log Stream
const logContainer = document.getElementById('logs');
const logBuffer = [
    "Checking dependencies...",
    "Health check: DEWA",
    "Model google/gemini-3-flash responding at 34ms",
    "Internal rotate triggered",
    "Proactive account switching... OK",
    "Token usage within threshold.",
    "Watching files for changes..."
];

function addLog() {
    const entry = document.createElement('p');
    entry.className = 'log-entry system';
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    entry.textContent = `[${timestamp}] > ${logBuffer[Math.floor(Math.random() * logBuffer.length)]}`;

    logContainer.appendChild(entry);

    // Auto-scroll
    logContainer.parentElement.scrollTop = logContainer.parentElement.scrollHeight;

    // Keep it clean
    if (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.children[0]);
    }
}
setInterval(addLog, 4500);

// 3. Auto-refresh (Suggestion 1)
// This uses a simple check: if the dashboard hasn't been reloaded in X minutes, it refreshes.
// Or we can simulate a socket-like reload if we have a way to detect changes.
console.log("Auto-refresh active. Dashboard will refresh if idle for 10 minutes.");
let idleTime = 0;
document.onmousemove = () => idleTime = 0;
setInterval(() => {
    idleTime++;
    if (idleTime >= 600) { // 10 minutes idle
        window.location.reload();
    }
}, 1000);

// 4. Token metrics dynamic simulation (Suggestion 2)
function updateMetrics() {
    const fills = document.querySelectorAll('.fill');
    const metricVals = document.querySelectorAll('.metric-val');

    fills.forEach((fill, index) => {
        // Simulating different behaviors for different tokens
        const trend = Math.sin(Date.now() / 5000 + index) * 5; // Sine wave trend
        const jitter = (Math.random() - 0.5) * 3;

        let currentWidth = parseFloat(fill.style.width) || 50;
        let newWidth = currentWidth + trend + jitter;

        // Boundaries
        newWidth = Math.max(10, Math.min(95, newWidth));
        fill.style.width = newWidth.toFixed(1) + '%';

        // Update text value if match found
        if (metricVals[index]) {
            metricVals[index].textContent = newWidth.toFixed(1) + '%';
        }
    });
}
setInterval(updateMetrics, 3000);

// 5. Sound Effects (Synthesized via Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playClick() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

// 6. Log Filtering
const filterBtns = document.querySelectorAll('.filter-btn');
let currentFilter = 'all';

filterBtns.forEach(btn => {
    btn.onclick = () => {
        playClick();
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderLogs();
    };
});

function renderLogs() {
    const entries = logContainer.querySelectorAll('.log-entry');
    entries.forEach(entry => {
        if (currentFilter === 'all') {
            entry.style.display = 'block';
        } else if (entry.classList.contains(currentFilter)) {
            entry.style.display = 'block';
        } else {
            entry.style.display = 'none';
        }
    });
}

// Override addLog to support types
function addLogWithType(text, type = 'info') {
    const entry = document.createElement('p');
    entry.className = `log-entry ${type}`;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    entry.textContent = `[${timestamp}] > ${text}`;

    logContainer.appendChild(entry);
    renderLogs(); // Re-apply filter
    logContainer.parentElement.scrollTop = logContainer.parentElement.scrollHeight;
}

// Simplified random logs for demo
setInterval(() => {
    const types = ['info', 'info', 'error', 'system'];
    const type = types[Math.floor(Math.random() * types.length)];
    addLogWithType(logBuffer[Math.floor(Math.random() * logBuffer.length)], type);
}, 4500);
