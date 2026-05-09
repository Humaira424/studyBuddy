// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// TODO: Replace with your app's Firebase project configuration
// Yeh config details aapko Firebase Console se milengi jab aap naya project banayenge.
const firebaseConfig = {
  apiKey: "AIzaSyBL-ex4lAQJMQnvvICfQTKm3gUMRgEp914",
  authDomain: "studybuddy-1c31b.firebaseapp.com",
  projectId: "studybuddy-1c31b",
  storageBucket: "studybuddy-1c31b.firebasestorage.app",
  messagingSenderId: "734463663806",
  appId: "1:734463663806:web:6d54aad73b512a5a0288ef",
  measurementId: "G-P3KF9FJP55"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Export services taake doosri files (auth.js, tasks.js) mein use ho sakein
export { auth, db };
