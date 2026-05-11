import { auth, db } from './firebase.js';
import { 
    collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const noteModal = document.getElementById('noteModal');
const openNoteModalBtn = document.getElementById('openNoteModalBtn');
const closeNoteModal = document.getElementById('closeNoteModal');
const noteForm = document.getElementById('noteForm');
const notesList = document.getElementById('notesList');

function toggleModal(modal, show) {
    if (show) {
        modal.classList.add('active');
    } else {
        modal.classList.remove('active');
        noteForm.reset();
        document.getElementById('noteId').value = '';
    }
}

openNoteModalBtn?.addEventListener('click', () => toggleModal(noteModal, true));
closeNoteModal?.addEventListener('click', () => toggleModal(noteModal, false));

let notesData = [];

auth.onAuthStateChanged((user) => {
    if (user) {
        const q = query(collection(db, "notes"), where("userId", "==", user.uid));
        onSnapshot(q, (snapshot) => {
            notesData = [];
            snapshot.forEach((doc) => {
                notesData.push({ id: doc.id, ...doc.data() });
            });
            renderNotes();
        });
    }
});

function renderNotes() {
    if (!notesList) return;
    
    notesList.innerHTML = '';

    if (notesData.length === 0) {
        notesList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); margin-top: 40px;">No notes found. Create your first note!</p>';
        return;
    }

    notesData.forEach(note => {
        const div = document.createElement('div');
        div.className = 'stat-card'; // Reusing stat card style for note card
        div.style.alignItems = 'flex-start';
        div.innerHTML = `
            <div style="display:flex; justify-content: space-between; width: 100%; align-items: flex-start;">
                <h3 style="color: var(--text-main); font-size: 18px;">${note.title}</h3>
                <div>
                    <button onclick="editNote('${note.id}')" style="background: none; border: none; color: var(--primary-color); cursor: pointer; margin-right: 8px;"><i class="ri-edit-line"></i></button>
                    <button onclick="deleteNote('${note.id}')" style="background: none; border: none; color: var(--danger-color); cursor: pointer;"><i class="ri-delete-bin-line"></i></button>
                </div>
            </div>
            <p style="color: var(--text-muted); font-size: 14px; margin-top: 12px; white-space: pre-wrap;">${note.content}</p>
        `;
        notesList.appendChild(div);
    });
}

noteForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const id = document.getElementById('noteId').value;
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;

    try {
        if (id) {
            await updateDoc(doc(db, "notes", id), { title, content });
        } else {
            await addDoc(collection(db, "notes"), {
                title,
                content,
                userId: user.uid,
                timestamp: new Date()
            });
        }
        toggleModal(noteModal, false);
    } catch (error) {
        console.error("Error saving note: ", error);
        alert("Could not save note.");
    }
});

window.editNote = (id) => {
    const note = notesData.find(n => n.id === id);
    if(note) {
        document.getElementById('noteId').value = note.id;
        document.getElementById('noteTitle').value = note.title;
        document.getElementById('noteContent').value = note.content;
        document.getElementById('noteModalTitle').textContent = 'Edit Note';
        toggleModal(noteModal, true);
    }
};

window.deleteNote = async (id) => {
    if (confirm("Delete this note?")) {
        try {
            await deleteDoc(doc(db, "notes", id));
        } catch (error) {
            console.error("Error deleting note: ", error);
        }
    }
};
