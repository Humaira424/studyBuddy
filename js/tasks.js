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
const filterPriority = document.getElementById('filterPriority');

// Helper to open/close modal
function toggleModal(modal, show) {
    if (show) {
        modal.classList.add('active');
    } else {
        modal.classList.remove('active');
        taskForm.reset();
        document.getElementById('taskId').value = '';
    }
}

openTaskModalBtn?.addEventListener('click', () => toggleModal(taskModal, true));
closeTaskModal?.addEventListener('click', () => toggleModal(taskModal, false));

// Listen to Tasks Data
let tasksData = [];

// Using onSnapshot to automatically update UI when data changes in Firestore
auth.onAuthStateChanged((user) => {
    if (user) {
        const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
        onSnapshot(q, (snapshot) => {
            tasksData = [];
            snapshot.forEach((doc) => {
                tasksData.push({ id: doc.id, ...doc.data() });
            });
            renderTasks();
            checkReminders(tasksData); // Call Reminder System
            
            // Dispatch event for analytics
            window.dispatchEvent(new CustomEvent('tasksUpdated', { detail: tasksData }));
        });
    }
});

// Reminder System Logic
let reminderPlayed = false; // Ek baar sound play karne ke liye

function checkReminders(tasks) {
    const today = new Date().toISOString().split('T')[0];
    
    // Find tasks due today or overdue that are still pending
    const dueTasks = tasks.filter(t => t.status !== 'completed' && t.dueDate && t.dueDate <= today);

    // Agar pehle se koi banner bana hua hai to usko hata dein (kyunke ab humein awaz chahiye)
    const oldAlert = document.getElementById('reminderAlert');
    if (oldAlert) {
        oldAlert.remove();
    }
    
    if (dueTasks.length > 0 && !reminderPlayed) {
        // 1. Play Sound Only
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        
        // Try to play sound (Browser policy ki wajah se kabhi interact karna zaroori hota hai)
        audio.play().then(() => {
            reminderPlayed = true; // Sound chalne ke baad isko true kar dein taake bar bar na baje
        }).catch(err => {
            console.log("Please click anywhere on the page to allow sound to play.", err);
        });
    }
}

// Render Tasks function
function renderTasks() {
    if (!tasksList) return;
    
    tasksList.innerHTML = '';
    
    // Filter & Search Logic
    const searchTerm = searchTask.value.toLowerCase();
    const priorityFilter = filterPriority.value;
    
    const filteredTasks = tasksData.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm);
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        return matchesSearch && matchesPriority;
    });

    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin-top: 40px;">No tasks found.</p>';
        return;
    }

    filteredTasks.forEach(task => {
        const statusBadge = task.status === 'completed' 
            ? '<span class="badge status-completed">Completed</span>'
            : '<span class="badge status-pending">Pending</span>';
            
        const div = document.createElement('div');
        div.className = 'task-item';
        div.innerHTML = `
            <div class="task-info">
                <h4>${task.title}</h4>
                <p><i class="ri-calendar-line"></i> Due: ${task.dueDate} | <span class="badge ${task.priority}">${task.priority}</span> | ${statusBadge}</p>
            </div>
            <div class="actions">
                <button onclick="toggleTaskStatus('${task.id}', '${task.status}')" class="btn-complete" title="Mark Complete/Pending">
                    <i class="ri-${task.status === 'completed' ? 'refresh-line' : 'check-line'}"></i>
                </button>
                <button onclick="deleteTask('${task.id}')" class="btn-delete" title="Delete Task">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        `;
        tasksList.appendChild(div);
    });
}

// Search and filter event listeners
searchTask?.addEventListener('input', renderTasks);
filterPriority?.addEventListener('change', renderTasks);

// Add/Update Task Form Submit
taskForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const id = document.getElementById('taskId').value;
    const title = document.getElementById('taskTitle').value;
    const dueDate = document.getElementById('taskDate').value;
    const priority = document.getElementById('taskPriority').value;

    const taskObj = {
        title,
        dueDate,
        priority,
        userId: user.uid,
        status: 'pending',
        timestamp: new Date()
    };

    try {
        if (id) {
            await updateDoc(doc(db, "tasks", id), taskObj);
        } else {
            // Add new task
            await addDoc(collection(db, "tasks"), taskObj);
        }
        toggleModal(taskModal, false);
    } catch (error) {
        console.error("Error saving task: ", error);
        alert("Could not save task. Please try again.");
    }
});

// Global functions for buttons generated in HTML string
window.deleteTask = async (id) => {
    if (confirm("Are you sure you want to delete this task?")) {
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
