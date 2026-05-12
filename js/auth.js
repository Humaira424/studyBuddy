import { auth, db } from './firebase.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { doc, setDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const ADMIN_EMAIL = 'ubaidullah51424@gmail.com'; // This user will see the admin panel

// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const logoutBtn = document.getElementById('logoutBtn');
const forgotPasswordBtn = document.getElementById('forgotPassword');

// Helpers for Alerts
function showAlert(elementId, message, type) {
    const alertEl = document.getElementById(elementId);
    if (alertEl) {
        alertEl.textContent = message;
        alertEl.className = `alert ${type}`;
        setTimeout(() => {
            alertEl.style.display = 'none';
            alertEl.className = 'alert';
        }, 5000);
    }
}

// 1. Sign Up Logic
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('signupBtn');
        
        try {
            btn.textContent = "Signing up...";
            btn.disabled = true;
            // Create user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Update profile with name
            await updateProfile(userCredential.user, { displayName: fullName });
            
            // Save user to Firestore 'users' collection for Admin Panel tracking
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                email: email,
                displayName: fullName,
                registrationDate: new Date().toISOString(),
                uid: userCredential.user.uid
            });
            
            showAlert('signupAlert', 'Account created! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } catch (error) {
            console.error("Signup Error:", error);
            let errorMessage = error.message;
            if (error.code === 'auth/email-already-in-use') errorMessage = "This email is already registered.";
            if (error.code === 'auth/weak-password') errorMessage = "Password should be at least 6 characters.";
            if (error.code === 'auth/invalid-email') errorMessage = "Please enter a valid email address.";
            
            showAlert('signupAlert', errorMessage, 'error');
            btn.textContent = "Sign Up";
            btn.disabled = false;
        }
    });
}

// 2. Login Logic
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('loginBtn');

        try {
            btn.textContent = "Logging in...";
            btn.disabled = true;
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error("Login Error:", error);
            let errorMessage = "Invalid email or password. Please try again.";
            if (error.code === 'auth/network-request-failed') errorMessage = "Network error. Please check your internet.";
            if (error.code === 'auth/too-many-requests') errorMessage = "Too many attempts. Please try again later.";
            
            showAlert('loginAlert', errorMessage, 'error');
            btn.textContent = "Login";
            btn.disabled = false;
        }
    });
}

// 3. Forgot Password Logic
if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        if (!email) {
            showAlert('loginAlert', 'Please enter your email address first.', 'error');
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            showAlert('loginAlert', 'Password reset email sent! Check your inbox.', 'success');
        } catch (error) {
            showAlert('loginAlert', error.message, 'error');
        }
    });
}

// 4. Logout Logic
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            window.location.href = 'login.html';
        } catch (error) {
            console.error("Logout Error:", error);
        }
    });
}

// 5. Route Protection & Auth State Listener
onAuthStateChanged(auth, (user) => {
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.includes('login.html') || currentPath.includes('signup.html') || currentPath.endsWith('/') || currentPath.endsWith('index.html');

    if (user) {
        // Dashboard par user ka naam update karna
        const nameDisplay = document.getElementById('userNameDisplay');
        if (nameDisplay) {
            nameDisplay.textContent = `Welcome, ${user.displayName || 'Student'}!`;
        }

        // Profile Section Populate
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileFullUid = document.getElementById('profileFullUid');
        const profileShortId = document.getElementById('profileShortId');

        if (profileName) profileName.textContent = user.displayName || 'Student';
        if (profileEmail) profileEmail.textContent = user.email;
        if (profileFullUid) profileFullUid.textContent = user.uid.substring(0, 6) + '...';

        // Fetch all users to find this user's simple ID (U-001 format)
        // Optimized: Only run if we are on a page that needs it
        if (profileShortId && profileShortId.textContent === "---") {
            getDocs(collection(db, "users")).then(snapshot => {
                const users = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.uid) users.push(data);
                });
                // Sort by registration date to keep IDs consistent
                users.sort((a, b) => new Date(a.registrationDate) - new Date(b.registrationDate));
                
                const index = users.findIndex(u => u.uid === user.uid);
                if (index !== -1) {
                    profileShortId.textContent = `U-${(index + 1).toString().padStart(3, '0')}`;
                } else {
                    profileShortId.textContent = "U-New";
                }
            }).catch(err => {
                console.error("Error fetching users for ID:", err);
                profileShortId.textContent = "User";
            });
        }
        
        // Admin Panel Visibility Logic
        const adminNav = document.getElementById('adminNav');
        if (adminNav) {
            if (user.email === ADMIN_EMAIL) {
                adminNav.style.display = 'block'; // Show Admin Tab
            } else {
                adminNav.style.display = 'none'; // Hide Admin Tab
            }
        }

        // Redirect if on auth page
        if (isAuthPage) {
            window.location.href = 'dashboard.html';
        }
    } else {
        // User logged out hai, agar dashboard par hai to login bhejo
        if (!isAuthPage && currentPath.includes('dashboard.html')) {
            window.location.href = 'login.html';
        }
    }
});
