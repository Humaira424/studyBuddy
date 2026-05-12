import { auth, db } from './firebase.js';
import { 
    collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const taskModal = document.getElementById('taskModal');
const openTaskModalBtn = document.getElementById('openTaskModalBtn');
const closeTaskModal = document.getElementById('closeTaskModal');
const taskForm = document.getElementById('taskForm');
const tasksList = document.getElementById('tasksList');
const searchTask = document.getElementById('searchTask');
const filterStatus = document.getElementById('filterStatus');
const planTabs = document.querySelectorAll('.btn-tab');

let currentPlan = 'all';
let userInteracted = false;
let tasksData = [];

// Track user interaction for audio permissions
document.addEventListener('click', () => userInteracted = true, { once: true });

// Helper to open/close modal
function toggleModal(modal, show) {
    if (show) {
        modal.classList.add('active');
    } else {
        modal.classList.remove('active');
        taskForm.reset();
        document.getElementById('taskId').value = '';
        document.getElementById('taskHours').value = '0';
        document.getElementById('taskMinutes').value = '0';
        document.getElementById('taskSeconds').value = '0';
    }
}

openTaskModalBtn?.addEventListener('click', () => toggleModal(taskModal, true));
closeTaskModal?.addEventListener('click', () => toggleModal(taskModal, false));

// Listen to Tasks Data
auth.onAuthStateChanged((user) => {
    if (user) {
        const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
        onSnapshot(q, (snapshot) => {
            tasksData = [];
            snapshot.forEach((doc) => {
                tasksData.push({ id: doc.id, ...doc.data() });
            });
            renderTasks();
            
            // Dispatch event for analytics
            window.dispatchEvent(new CustomEvent('tasksUpdated', { detail: tasksData }));
        });
    }
});

// Smart Reminder Logic (Improved)
function startSmartReminderSystem() {
    setInterval(() => {
        const now = new Date();
        const currentHour = now.getHours();
        const todayStr = now.toISOString().split('T')[0];
        
        // Reminder rings if it's after 4 PM and user has pending tasks for today
        if (currentHour >= 16) {
            const pendingDueTasks = tasksData.filter(t => t.status !== 'completed' && t.dueDate === todayStr);
            
            if (pendingDueTasks.length > 0) {
                const lastReminderTime = localStorage.getItem('lastSmartReminderTime');
                const nowTime = now.getTime();
                
                // Remind every 30 minutes if still pending
                if (!lastReminderTime || (nowTime - lastReminderTime > 30 * 60 * 1000)) {
                    
                    // Show notification banner if it exists
                    const notification = document.getElementById('deadlineNotification');
                    if (notification) {
                        notification.style.display = 'flex';
                        notification.querySelector('p').textContent = `Reminder: You have ${pendingDueTasks.length} pending tasks for today!`;
                    }
                    
                    // Play Sound if user has interacted
                    if (userInteracted) {
                        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                        audio.volume = 0.6;
                        audio.play().catch(err => console.log("Sound failed:", err));
                    }
                    
                    localStorage.setItem('lastSmartReminderTime', nowTime);
                }
            }
        }
    }, 60000); // Check every minute
}

// Start the smart reminder background check
startSmartReminderSystem();

// Render Tasks function
function renderTasks() {
    if (!tasksList) return;
    
    tasksList.innerHTML = '';
    const searchTerm = searchTask?.value.toLowerCase() || "";
    const statusFilter = filterStatus?.value || "all";
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    let totalHours = 0;
    
    const filteredTasks = tasksData.filter(task => {
        // 1. Calculate total study hours (from completed tasks only)
        if (task.status === 'completed' && task.duration) {
            if (task.duration.includes(':')) {
                const [h, m, s] = task.duration.split(':').map(Number);
                totalHours += h + (m / 60) + (s / 3600);
            } else {
                totalHours += parseFloat(task.duration);
            }
        }
        
        // 2. Filter by Search & Status
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) || (task.subject && task.subject.toLowerCase().includes(searchTerm));
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        
        // 3. Filter by Plan (Daily/Weekly/Monthly)
        let matchesPlan = true;
        if (currentPlan === 'daily') {
            matchesPlan = task.dueDate === todayStr;
        } else if (currentPlan === 'weekly') {
            const weekFromNow = new Date();
            weekFromNow.setDate(now.getDate() + 7);
            const weekStr = weekFromNow.toISOString().split('T')[0];
            matchesPlan = task.dueDate >= todayStr && task.dueDate <= weekStr;
        } else if (currentPlan === 'monthly') {
            const monthFromNow = new Date();
            monthFromNow.setDate(now.getDate() + 30);
            const monthStr = monthFromNow.toISOString().split('T')[0];
            matchesPlan = task.dueDate >= todayStr && task.dueDate <= monthStr;
        }

        return matchesSearch && matchesStatus && matchesPlan;
    });
    
    // Update Total Study Hours on Dashboard
    const totalStudyHoursEl = document.getElementById('totalStudyHours');
    if (totalStudyHoursEl) {
        totalStudyHoursEl.textContent = totalHours.toFixed(2);
    }

    if (filteredTasks.length === 0) {
        tasksList.innerHTML = `<p style="text-align: center; color: var(--text-muted); margin-top: 40px;">No tasks found for ${currentPlan} plan.</p>`;
        return;
    }

    filteredTasks.forEach(task => {
        const statusBadge = task.status === 'completed' 
            ? '<span class="badge status-completed">Completed</span>'
            : '<span class="badge status-pending">Pending</span>';
            
        const subjectBadge = task.subject ? `<span class="badge" style="background: var(--bg-color); border: 1px solid var(--border-color); color: var(--text-main);">${task.subject}</span>` : '';
            
        let displayDuration = task.duration;
        if (task.duration && task.duration.includes(':')) {
            const [h, m, s] = task.duration.split(':');
            displayDuration = `${parseInt(h)}h ${parseInt(m)}m ${parseInt(s)}s`;
        }

        const div = document.createElement('div');
        div.className = 'task-item';
        div.innerHTML = `
            <div class="task-info">
                <h4>${task.title}</h4>
                <p>${subjectBadge} <i class="ri-calendar-line"></i> Due: ${task.dueDate} | <i class="ri-time-line"></i> ${displayDuration} | ${statusBadge}</p>
            </div>
            <div class="actions">
                <button onclick="toggleTaskStatus('${task.id}', '${task.status}')" class="btn-complete" title="Mark Complete/Pending">
                    <i class="ri-${task.status === 'completed' ? 'refresh-line' : 'check-line'}"></i>
                </button>
                <button onclick="editTask('${task.id}')" class="btn-complete" title="Edit Task" style="background: var(--primary-color);">
                    <i class="ri-edit-line"></i>
                </button>
                <button onclick="deleteTask('${task.id}')" class="btn-delete" title="Delete Task">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        `;
        tasksList.appendChild(div);
    });
}

// Event Listeners for Filters & Tabs
searchTask?.addEventListener('input', renderTasks);
filterStatus?.addEventListener('change', renderTasks);

planTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        planTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentPlan = tab.dataset.plan;
        renderTasks();
    });
});

// Add/Update Task Form Submit
taskForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const id = document.getElementById('taskId').value;
    const title = document.getElementById('taskTitle').value;
    const subject = document.getElementById('taskSubject').value;
    const dueDate = document.getElementById('taskDate').value;
    
    const h = document.getElementById('taskHours').value || 0;
    const m = document.getElementById('taskMinutes').value || 0;
    const s = document.getElementById('taskSeconds').value || 0;
    const duration = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    let taskObj = {
        title,
        subject,
        dueDate,
        duration,
        userId: user.uid
    };

    try {
        if (id) {
            await updateDoc(doc(db, "tasks", id), taskObj);
        } else {
            taskObj.status = 'pending';
            taskObj.timestamp = new Date();
            await addDoc(collection(db, "tasks"), taskObj);
        }
        toggleModal(taskModal, false);
    } catch (error) {
        console.error("Error saving task: ", error);
        alert("Could not save task.");
    }
});

// Global functions
window.editTask = (id) => {
    const task = tasksData.find(t => t.id === id);
    if(task) {
        document.getElementById('taskId').value = task.id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskSubject').value = task.subject || '';
        document.getElementById('taskDate').value = task.dueDate;
        
        if (task.duration && task.duration.includes(':')) {
            const [h, m, s] = task.duration.split(':');
            document.getElementById('taskHours').value = parseInt(h);
            document.getElementById('taskMinutes').value = parseInt(m);
            document.getElementById('taskSeconds').value = parseInt(s);
        } else {
            document.getElementById('taskHours').value = task.duration || 0;
            document.getElementById('taskMinutes').value = 0;
            document.getElementById('taskSeconds').value = 0;
        }
        
        document.getElementById('taskModalTitle').textContent = 'Edit Task';
        toggleModal(taskModal, true);
    }
};

window.deleteTask = async (id) => {
    if (confirm("Delete this task?")) {
        try {
            await deleteDoc(doc(db, "tasks", id));
        } catch (error) {
            console.error("Error deleting task: ", error);
        }
    }
};

window.toggleTaskStatus = async (id, currentStatus) => {
    try {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        await updateDoc(doc(db, "tasks", id), { status: newStatus });
    } catch (error) {
        console.error("Error updating status: ", error);
    }
};
