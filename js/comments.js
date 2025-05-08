// js/comments.js

// Importa le funzioni necessarie da Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, Timestamp, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// Nota: Aggiunti 'doc', 'updateDoc', 'increment'

// --- Configurazione Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyBrXQ4qwB9JhZF4kSIPyvxQYw1X4PGXpFk", // Sostituisci con la tua vera API Key se diversa
    authDomain: "asyncdonkey.firebaseapp.com",
    projectId: "asyncdonkey",
    storageBucket: "asyncdonkey.appspot.com",
    messagingSenderId: "939854468396",
    appId: "1:939854468396:web:9646d4f51737add7704889",
    measurementId: "G-EQDBKQM3YE"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const guestbookCollection = collection(db, "guestbookEntries");

// --- Elementi DOM ---
const commentForm = document.getElementById('commentForm');
const commentNameInput = document.getElementById('commentName');
const commentMessageInput = document.getElementById('commentMessage');
const submitCommentBtn = document.getElementById('submitCommentBtn');
const commentsListDiv = document.getElementById('commentsList');

const MAX_COMMENTS_DISPLAYED = 20; // Limita il numero di commenti visualizzati (per ora, la paginazione è successiva)

// --- Funzioni ---

/**
 * Formatta un oggetto Timestamp di Firestore o una stringa ISO in una stringa leggibile. (VERSIONE CORRETTA)
 * @param {Timestamp|string|any} firebaseTimestamp Il valore del campo timestamp dal database.
 * @returns {string} Data e ora formattate o un messaggio di fallback.
 */
function formatFirebaseTimestamp(firebaseTimestamp) {
    // 1. Controlla se è un oggetto Timestamp di Firestore valido (ha il metodo toDate)
    if (firebaseTimestamp && typeof firebaseTimestamp.toDate === 'function') {
        try {
            const date = firebaseTimestamp.toDate();
            // Formatta usando le opzioni desiderate
            return date.toLocaleString('it-IT', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) {
            console.error("Errore durante la conversione del Timestamp Firestore:", e);
            return 'Errore formato data';
        }
    }
    // 2. Se non è un Timestamp, prova a vedere se è una stringa e tenta di interpretarla
    else if (typeof firebaseTimestamp === 'string' && firebaseTimestamp.length > 0) {
        try {
            // Tenta di creare un oggetto Date dalla stringa
            const date = new Date(firebaseTimestamp);
            // Controlla se la data risultante è valida
            if (!isNaN(date.getTime())) {
                return date.toLocaleString('it-IT', {
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                }) + " (convertito)"; // Indica che è stato convertito
            } else {
                // Se la stringa non è una data valida, mostrala com'è
                return firebaseTimestamp + ' (formato non riconosciuto)';
            }
        } catch (e) {
            console.error("Errore durante il parsing della stringa timestamp:", e);
            // Mostra la stringa originale in caso di errore nel parsing
            return firebaseTimestamp + ' (errore parsing)';
        }
    }
    // 3. Se non è né un Timestamp né una stringa riconoscibile
    else {
        console.warn("Formato timestamp non riconosciuto o valore mancante:", firebaseTimestamp);
        return 'Data non disponibile';
    }
}


/**
 * Carica e visualizza i commenti da Firestore.
 */
async function loadComments() {
    if (!commentsListDiv) {
        console.error("Elemento commentsList non trovato!");
        return;
    }
    commentsListDiv.innerHTML = '<p>Caricamento commenti...</p>';

    try {
        const q = query(guestbookCollection, orderBy("timestamp", "desc"), limit(MAX_COMMENTS_DISPLAYED));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            commentsListDiv.innerHTML = '<p>Nessun commento ancora. Sii il primo!</p>';
            return;
        }

        commentsListDiv.innerHTML = '';

        querySnapshot.forEach((docSnapshot) => { // Rinominato 'doc' in 'docSnapshot' per chiarezza
            const commentData = docSnapshot.data();
            const commentId = docSnapshot.id; // Ottieni l'ID del documento
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment-item');

            const nameEl = document.createElement('strong');
            nameEl.textContent = commentData.name || 'Anonimo';

            const dateEl = document.createElement('small');
            dateEl.classList.add('comment-date');
            // Qui viene chiamata la funzione formatFirebaseTimestamp CORRETTA
            dateEl.textContent = ` - ${formatFirebaseTimestamp(commentData.timestamp)}`;

            const messageEl = document.createElement('p');
            messageEl.textContent = commentData.message || '';
            messageEl.textContent = messageEl.textContent.replace(/</g, "&lt;").replace(/>/g, "&gt;");

            commentElement.appendChild(nameEl);
            commentElement.appendChild(dateEl);
            commentElement.appendChild(messageEl);

            // --- SEZIONE PER I LIKE ---
            const likesContainer = document.createElement('div');
            likesContainer.classList.add('likes-container'); // Per CSS

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
            // --- FINE SEZIONE LIKE ---

            commentsListDiv.appendChild(commentElement);
        });

    } catch (error) {
        // Stampiamo l'errore specifico qui se il caricamento fallisce
        console.error("Errore durante il caricamento dei commenti: ", error);
        commentsListDiv.innerHTML = '<p>Errore nel caricare i commenti. Riprova più tardi.</p>';
    }
}

/**
 * Gestisce il click sul pulsante "Like".
 * @param {Event} event
 */
async function handleLikeComment(event) {
    const likeButton = event.currentTarget;
    const commentId = likeButton.getAttribute('data-comment-id');

    if (!commentId) {
        console.error("ID del commento non trovato per il 'like'.");
        return;
    }

    likeButton.disabled = true; // Previene click multipli

    try {
        const commentDocRef = doc(db, "guestbookEntries", commentId);
        await updateDoc(commentDocRef, {
            likes: increment(1) // Operatore atomico di Firestore
        });

        const likeCountSpan = likeButton.nextElementSibling;
        if (likeCountSpan && likeCountSpan.classList.contains('like-count')) {
            const currentLikes = parseInt(likeCountSpan.textContent);
            likeCountSpan.textContent = `${currentLikes + 1}`;
        }
        likeButton.classList.add('liked');
        likeButton.innerHTML = '❤️';

        let likedComments = JSON.parse(localStorage.getItem('likedGuestbookComments')) || [];
        if (!likedComments.includes(commentId)) {
            likedComments.push(commentId);
            localStorage.setItem('likedGuestbookComments', JSON.stringify(likedComments));
        }

    } catch (error) {
        // L'errore di permessi o altro verrà stampato qui
        console.error("Errore durante l'aggiornamento dei 'like':", error);
        alert("Non è stato possibile registrare il tuo 'like'. Riprova.");
        // Riabilita il pulsante solo se l'utente non ha già messo like (verificato da localStorage al prossimo load)
        const likedComments = JSON.parse(localStorage.getItem('likedGuestbookComments')) || [];
        if (!likedComments.includes(commentId)) {
             likeButton.disabled = false;
        }
    }
}


/**
 * Gestisce l'invio del form dei commenti.
 * @param {Event} event
 */
async function handleCommentSubmit(event) {
    event.preventDefault();

    if (!commentNameInput || !commentMessageInput || !submitCommentBtn) {
        console.error("Elementi del form dei commenti mancanti!");
        return;
    }

    const name = commentNameInput.value.trim();
    const message = commentMessageInput.value.trim();

    if (!name || !message) {
        alert("Per favore, inserisci sia il nome che il messaggio.");
        return;
    }

    submitCommentBtn.disabled = true;
    submitCommentBtn.textContent = "Invio...";

    try {
        await addDoc(guestbookCollection, {
            name: name,
            message: message,
            timestamp: serverTimestamp(), // Salva il timestamp nel formato corretto
            likes: 0 // Inizializza i likes a 0 per i nuovi commenti
        });

        commentNameInput.value = '';
        commentMessageInput.value = '';
        alert("Commento inviato con successo!");

        await loadComments();

    } catch (error) {
        console.error("Errore durante l'invio del commento: ", error);
        alert("C'è stato un errore durante l'invio del commento. Riprova.");
    } finally {
        submitCommentBtn.disabled = false;
        submitCommentBtn.textContent = "Invia Commento";
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    if (commentForm) {
        commentForm.addEventListener('submit', handleCommentSubmit);
    } else {
        console.error("Form dei commenti non trovato!");
    }
    loadComments(); // Carica i commenti quando la pagina è pronta
});