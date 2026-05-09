// Sidebar navigation logic
const navLinks = document.querySelectorAll('.nav-links a');
const pageSections = document.querySelectorAll('.page-section');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all links
        navLinks.forEach(l => l.classList.remove('active'));
        
        // Add active class to clicked link
        e.currentTarget.classList.add('active');
        
        // Get target section id
        const targetId = e.currentTarget.getAttribute('data-target');
        
        // Hide all sections
        pageSections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        document.getElementById(targetId).classList.add('active');
    });
});

// Dark mode toggle
const themeToggle = document.getElementById('themeToggle');
const htmlTag = document.documentElement;

// Check local storage for theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    htmlTag.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

themeToggle.addEventListener('click', () => {
    const currentTheme = htmlTag.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    htmlTag.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    // Dispatch event to re-render chart with new colors
    window.dispatchEvent(new CustomEvent('themeChanged'));
});

function updateThemeIcon(theme) {
    if (theme === 'dark') {
        themeToggle.innerHTML = '<i class="ri-sun-line"></i>';
    } else {
        themeToggle.innerHTML = '<i class="ri-moon-line"></i>';
    }
}

// Display current date
const dateDisplay = document.getElementById('currentDateDisplay');
if (dateDisplay) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateDisplay.textContent = new Date().toLocaleDateString('en-US', options);
}

// -----------------------------------------
// NEW FEATURE: Focus Timer (Pomodoro) Logic
// -----------------------------------------
let timerInterval;
let timeLeft = 25 * 60; // 25 minutes
let isTimerRunning = false;

const timerDisplay = document.getElementById('timerDisplay');
const startTimerBtn = document.getElementById('startTimerBtn');
const resetTimerBtn = document.getElementById('resetTimerBtn');

function updateTimerDisplay() {
    if(!timerDisplay) return;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

startTimerBtn?.addEventListener('click', () => {
    if (isTimerRunning) {
        // Pause
        clearInterval(timerInterval);
        startTimerBtn.innerHTML = '<i class="ri-play-fill"></i> Start';
        isTimerRunning = false;
    } else {
        // Start
        startTimerBtn.innerHTML = '<i class="ri-pause-fill"></i> Pause';
        isTimerRunning = true;
        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                isTimerRunning = false;
                startTimerBtn.innerHTML = '<i class="ri-play-fill"></i> Start';
                timeLeft = 25 * 60;
                updateTimerDisplay();
                // Play notification sound when done
                new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play().catch(e => console.log(e));
                
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("Focus Time Over!", { body: "Great job! Take a 5 minute break." });
                } else {
                    alert("Focus Time Over! Great job! Take a 5 minute break.");
                }
            }
        }, 1000);
    }
});

resetTimerBtn?.addEventListener('click', () => {
    clearInterval(timerInterval);
    isTimerRunning = false;
    startTimerBtn.innerHTML = '<i class="ri-play-fill"></i> Start';
    timeLeft = 25 * 60;
    updateTimerDisplay();
});
