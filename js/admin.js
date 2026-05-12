import { auth, db } from './firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const adminTotalUsers = document.getElementById('adminTotalUsers');
const adminTotalTasks = document.getElementById('adminTotalTasks');
const adminUsersList = document.getElementById('adminUsersList');
const adminNav = document.getElementById('adminNav');

let isAdminDataLoaded = false;

async function loadAdminData() {
    if (isAdminDataLoaded) return;
    
    try {
        if(adminUsersList) adminUsersList.innerHTML = '<tr><td colspan="3" style="padding: 16px 8px; color: var(--text-muted); text-align:center;">Loading data...</td></tr>';
        
        // Fetch all users
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = [];
        usersSnapshot.forEach(doc => {
            users.push(doc.data());
        });
        
        // Fetch all tasks
        const tasksSnapshot = await getDocs(collection(db, "tasks"));
        const totalTasks = tasksSnapshot.size;
        
        // Update DOM
        if (adminTotalUsers) adminTotalUsers.textContent = users.length;
        if (adminTotalTasks) adminTotalTasks.textContent = totalTasks;
        
        if (adminUsersList) {
            adminUsersList.innerHTML = '';
            if (users.length === 0) {
                adminUsersList.innerHTML = '<tr><td colspan="3" style="padding: 16px 8px; color: var(--text-muted); text-align:center;">No users found.</td></tr>';
            } else {
                users.forEach((u, index) => {
                    const studentId = `U-${(index + 1).toString().padStart(3, '0')}`;
                    const date = u.registrationDate ? new Date(u.registrationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown';
                    const tr = document.createElement('tr');
                    tr.style.borderBottom = '1px solid var(--border-color)';
                    tr.innerHTML = `
                        <td style="padding: 12px 8px; font-weight: bold; color: var(--primary-color);">${studentId}</td>
                        <td style="padding: 12px 8px;">${u.email} <br><small style="color:var(--text-muted)">${u.displayName || 'No Name'}</small></td>
                        <td style="padding: 12px 8px;">${date}</td>
                    `;
                    adminUsersList.appendChild(tr);
                });
            }
        }
        
        isAdminDataLoaded = true;
    } catch (error) {
        console.error("Error loading admin data:", error);
        if(adminUsersList) adminUsersList.innerHTML = '<tr><td colspan="3" style="padding: 16px 8px; color: var(--danger-color); text-align:center;">Error loading data. Ensure you have admin privileges.</td></tr>';
    }
}

// Load data when admin tab is clicked
adminNav?.querySelector('a')?.addEventListener('click', () => {
    loadAdminData();
});
