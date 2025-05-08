// js/comments.js

import { db, auth } from './main.js'; // Importa istanze centralizzate

console.log("comments.js: db instance imported:", db ? 'OK' : 'FAIL', db);
console.log("comments.js: auth instance imported:", auth ? 'OK' : 'FAIL', auth);

// Import necessari da Firestore (inclusi doc e getDoc)
import {
    collection, addDoc, query, orderBy, limit, getDocs,
    serverTimestamp, Timestamp, doc, updateDoc, increment,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let guestbookCollection;
if (db) {
    guestbookCollection = collection(db, "guestbookEntries");
    console.log("comments.js: guestbookCollection initialized with db:", guestbookCollection ? 'OK' : 'FAIL');
} else {
    console.error("comments.js: Istanza DB non valida! Impossibile inizializzare guestbookCollection.");
}

// Riferimenti agli elementi DOM
const commentForm = document.getElementById('commentForm');
const commentNameInput = document.getElementById('commentName');
const commentMessageInput = document.getElementById('commentMessage');
const submitCommentBtn = document.getElementById('submitCommentBtn');
const commentsListDiv = document.getElementById('commentsList');
const commentNameSection = document.getElementById('commentNameSection');
const MAX_COMMENTS_DISPLAYED = 20;

// Funzione per formattare il timestamp
function formatFirebaseTimestamp(firebaseTimestamp) {
    if (firebaseTimestamp && typeof firebaseTimestamp.toDate === 'function') {
        try {
            const date = firebaseTimestamp.toDate();
            return date.toLocaleString('it-IT', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) { return 'Data non formattabile'; }
    } else if (typeof firebaseTimestamp === 'string' && firebaseTimestamp.length > 0) {
        try {
            const date = new Date(firebaseTimestamp);
            if (!isNaN(date.getTime())) {
                return date.toLocaleString('it-IT', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + " (convertita)";
            } else { return firebaseTimestamp + ' (formato non riconosciuto)'; }
        } catch (e) { return firebaseTimestamp + ' (errore di parsing)'; }
    } else { return 'Data non disponibile'; }
}

// Funzione per caricare i commenti
async function loadComments() {
    if (!commentsListDiv) { console.warn("Elemento commentsListDiv non trovato."); return; }
    if (!guestbookCollection) {
        console.error("comments.js - loadComments: guestbookCollection non è inizializzata.");
        commentsListDiv.innerHTML = '<p>Errore: Connessione al database fallita.</p>';
        return;
    }
    commentsListDiv.innerHTML = '<p>Caricamento commenti...</p>';
    console.log("comments.js - loadComments: Inizio caricamento..."); // Log 1
    try {
        const q = query(guestbookCollection, orderBy("timestamp", "desc"), limit(MAX_COMMENTS_DISPLAYED));
        const querySnapshot = await getDocs(q);
        console.log(`comments.js - loadComments: Trovati ${querySnapshot.size} documenti.`); // Log 2
        if (querySnapshot.empty) {
            commentsListDiv.innerHTML = '<p>Nessun commento ancora. Sii il primo!</p>';
            console.log("comments.js - loadComments: Query vuota, HTML aggiornato."); // Log 3
            return;
        }
        commentsListDiv.innerHTML = ''; // Pulisci prima di aggiungere
        let count = 0;
        querySnapshot.forEach((docSnapshot) => {
            count++;
            const commentData = docSnapshot.data();
            const commentId = docSnapshot.id;
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment-item');

            // --- Creazione HTML per il singolo commento ---
            const nameEl = document.createElement('strong');
            nameEl.textContent = commentData.userName || commentData.name || 'Anonimo';

            const dateEl = document.createElement('small');
            dateEl.classList.add('comment-date');
            dateEl.textContent = ` - ${formatFirebaseTimestamp(commentData.timestamp)}`;

            const messageEl = document.createElement('p');
            messageEl.textContent = commentData.message ? String(commentData.message).replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';

            commentElement.appendChild(nameEl);
            commentElement.appendChild(dateEl);
            commentElement.appendChild(messageEl);

            // Likes
            const likesContainer = document.createElement('div');
            likesContainer.classList.add('likes-container');
            const likeButton = document.createElement('button');
            likeButton.innerHTML = '👍';
            likeButton.classList.add('like-btn');
            likeButton.setAttribute('data-comment-id', commentId);
            likeButton.title = "Metti 'Mi piace'";
            const likeCountSpan = document.createElement('span');
            likeCountSpan.classList.add('like-count');
            likeCountSpan.textContent = `${commentData.likes || 0}`;
            const likedComments = JSON.parse(localStorage.getItem('likedGuestbookComments')) || [];
            if (likedComments.includes(commentId)) {
                likeButton.disabled = true;
                likeButton.classList.add('liked');
                likeButton.innerHTML = '❤️';
            }
            likeButton.addEventListener('click', handleLikeComment);
            likesContainer.appendChild(likeButton);
            likesContainer.appendChild(likeCountSpan);
            commentElement.appendChild(likesContainer);
            // --- Fine Creazione HTML ---

            commentsListDiv.appendChild(commentElement);
        });
        console.log(`comments.js - loadComments: Loop forEach completato (${count} iterazioni), HTML aggiornato.`); // Log 4
    } catch (error) {
        console.error("comments.js - Errore durante loadComments: ", error); // Log 5
        commentsListDiv.innerHTML = '<p>Errore nel caricare i commenti. Riprova più tardi.</p>';
    }
}

// Funzione per gestire i "Mi piace"
async function handleLikeComment(event) {
    const likeButton = event.currentTarget;
    const commentId = likeButton.getAttribute('data-comment-id');
    if (!commentId) { console.error("ID commento mancante per 'like'."); return; }
    const user = auth.currentUser;
    if (!user) { alert("Devi effettuare il login per mettere 'Mi piace'."); return; }
    if (!guestbookCollection) { alert("Errore di connessione al database."); return; }
    likeButton.disabled = true;
    try {
        const commentDocRef = doc(db, "guestbookEntries", commentId);
        await updateDoc(commentDocRef, { likes: increment(1) });
        const likeCountSpan = likeButton.nextElementSibling;
        if (likeCountSpan?.classList.contains('like-count')) { // Optional chaining
            likeCountSpan.textContent = `${parseInt(likeCountSpan.textContent) + 1}`;
        }
        likeButton.classList.add('liked');
        likeButton.innerHTML = '❤️';
        let likedComments = JSON.parse(localStorage.getItem('likedGuestbookComments')) || [];
        if (!likedComments.includes(commentId)) {
            likedComments.push(commentId);
            localStorage.setItem('likedGuestbookComments', JSON.stringify(likedComments));
        }
    } catch (error) {
        console.error("comments.js - Errore aggiornamento 'likes':", error);
        alert("Impossibile registrare il 'Mi piace'.");
        const likedComments = JSON.parse(localStorage.getItem('likedGuestbookComments')) || [];
        if (!likedComments.includes(commentId)) {
            likeButton.disabled = false;
            likeButton.classList.remove('liked');
            likeButton.innerHTML = '👍';
        }
    }
}

// Funzione per inviare un commento
async function handleCommentSubmit(event) {
    event.preventDefault();
    console.log("comments.js - handleCommentSubmit avviato.");
    if (!guestbookCollection) { alert("Errore: Connessione db fallita."); return; }

    const message = commentMessageInput?.value.trim(); // Optional chaining
    if (!message) { alert("Per favore, inserisci un messaggio."); return; }

    const user = auth.currentUser;
    let userIdToSave = null;
    let userNameForComment = 'Anonimo';

    if (user) { // Utente Loggato
        userIdToSave = user.uid;
        const userProfileRef = doc(db, "userProfiles", user.uid);
        try {
            const docSnap = await getDoc(userProfileRef); // Usa getDoc importato
            if (docSnap.exists() && docSnap.data().nickname) {
                userNameForComment = docSnap.data().nickname;
            } else {
                userNameForComment = user.email.split('@')[0];
            }
            console.log("comments.js - Nome utente per commento:", userNameForComment);
        } catch (profileError) {
            console.error("comments.js - Errore caricamento profilo per commento:", profileError);
            userNameForComment = user.email.split('@')[0]; // Fallback
        }
    } else { // Utente Anonimo
        const nameFromInput = commentNameInput?.value.trim(); // Optional chaining
        if (!nameFromInput) { alert("Per favore, inserisci il tuo nome o effettua il login."); return; }
        userNameForComment = nameFromInput;
    }

    if (!submitCommentBtn) { alert("Errore interno: bottone invio mancante."); return; }
    submitCommentBtn.disabled = true;
    submitCommentBtn.textContent = "Invio...";

    try {
        const commentData = {
            message: message,
            timestamp: serverTimestamp(), // Usa serverTimestamp importato
            likes: 0
        };
        if (userIdToSave) {
            commentData.userId = userIdToSave;
            commentData.userName = userNameForComment;
        } else {
            commentData.name = userNameForComment; // Per anonimi, il campo è 'name'
        }
        console.log("comments.js - Dati commento da inviare:", commentData);
        const docRef = await addDoc(guestbookCollection, commentData);
        console.log("comments.js - Commento inviato con ID:", docRef.id);

        if (commentMessageInput) commentMessageInput.value = '';
        if (commentNameInput && !user) commentNameInput.value = ''; // Pulisci nome solo se anonimo
        alert("Commento inviato con successo!");
        await loadComments(); // Ricarica i commenti

    } catch (error) {
        console.error("comments.js - Errore invio commento a Firestore: ", error);
        alert("Si è verificato un errore durante l'invio del commento. Riprova.");
    } finally {
        if (submitCommentBtn) {
            submitCommentBtn.disabled = false;
            submitCommentBtn.textContent = "Invia Commento";
        }
    }
}

// EventListener DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Imposta stato iniziale campo nome (required o no)
    if (auth.currentUser && commentNameSection) {
         commentNameSection.style.display = 'none';
         if (commentNameInput) commentNameInput.required = false;
    } else if (commentNameSection) {
         commentNameSection.style.display = 'block';
         if (commentNameInput) commentNameInput.required = true;
    }
    // Aggiungi listener al form
    if (commentForm) {
        commentForm.addEventListener('submit', handleCommentSubmit);
    }
    // Carica commenti iniziali
    if (commentsListDiv && db) {
        loadComments();
    } else if (!db) {
        console.warn("comments.js - DOMContentLoaded: Istanza DB non valida. Non carico i commenti.");
        if(commentsListDiv) commentsListDiv.innerHTML = "<p>Errore di connessione al database per i commenti.</p>";
    }
});