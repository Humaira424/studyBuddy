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


