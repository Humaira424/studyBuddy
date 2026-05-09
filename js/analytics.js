// This file handles updating the Dashboard overview statistics and charts
let progressChartInstance = null;
let lastStats = { completed: 0, pending: 0 };

// Listen to tasks updates
window.addEventListener('tasksUpdated', (e) => {
    const tasks = e.detail;

    // Calculate stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = totalTasks - completedTasks;
    const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    // Save for theme changes
    lastStats = { completed: completedTasks, pending: pendingTasks };

    // Update DOM
    document.getElementById('totalTasksCount').textContent = totalTasks;
    document.getElementById('completedTasksCount').textContent = completedTasks;
    document.getElementById('pendingTasksCount').textContent = pendingTasks;
    document.getElementById('progressPercentage').textContent = `${progressPercentage}%`;

    // Render Chart
    if (totalTasks > 0) {
        renderChart(completedTasks, pendingTasks);
    } else {
        renderChart(0, 1); // Empty state look
    }
});

// Re-render chart when theme changes to update text colors
window.addEventListener('themeChanged', () => {
    renderChart(lastStats.completed, lastStats.pending);
});

function renderChart(completed, pending) {
    const ctx = document.getElementById('progressChart');
    if (!ctx) return;

    // Destroy existing chart to prevent overlap if it exists
    if (progressChartInstance) {
        progressChartInstance.destroy();
    }

    // Checking current theme to adjust chart colors
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#F9FAFB' : '#111827';

    // Create new chart using Chart.js
    progressChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending'],
            datasets: [{
                data: [completed, pending],
                backgroundColor: [
                    '#10B981', // Success color
                    completed === 0 && pending === 1 && lastStats.pending === 0 ? '#E5E7EB' : '#F59E0B'  // Warning color or empty state gray
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        padding: 20
                    }
                }
            },
            cutout: '75%'
        }
    });
}
