// js/comments.js

import { db, auth } from './main.js';
import {
    collection, addDoc, query, orderBy, limit, getDocs,
    serverTimestamp, Timestamp, doc, updateDoc, increment,
    getDoc, where // <<< Assicurati di importare 'where'
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let guestbookCollection;
if (db) {
    guestbookCollection = collection(db, "guestbookEntries");
} else {
    console.error("comments.js: DB instance not valid!");
}

// DOM Elements
const commentForm = document.getElementById('commentForm');
const commentNameInput = document.getElementById('commentName');
const commentMessageInput = document.getElementById('commentMessage');
const submitCommentBtn = document.getElementById('submitCommentBtn');
const commentsListDiv = document.getElementById('commentsList');
const commentNameSection = document.getElementById('commentNameSection');
const commentsListContainer = document.getElementById('commentsListContainer'); // <<< NUOVO RIFERIMENTO DOM

const MAX_COMMENTS_DISPLAYED = 20;

// --- NUOVO: Ottieni il pageId dal data-attribute ---
let currentPageId = 'default'; // Fallback
if (commentsListContainer && commentsListContainer.dataset.pageId) {
    currentPageId = commentsListContainer.dataset.pageId;
    console.log(`comments.js: Initialized for pageId: ${currentPageId}`);
} else {
    console.warn('comments.js: commentsListContainer o data-page-id non trovato. Verrà usato il pageId di fallback "default".');
}


/** Formats Firestore Timestamp */
function formatFirebaseTimestamp(firebaseTimestamp) {
    if (!firebaseTimestamp?.toDate) return 'Date unavailable';
    try {
        return firebaseTimestamp.toDate().toLocaleString('it-IT', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return 'Date format error'; }
}

/** Loads and displays comments based on currentPageId */
async function loadComments() {
    if (!commentsListDiv) return;
    if (!guestbookCollection) {
        commentsListDiv.innerHTML = '<p>Error: Database connection failed.</p>';
        return;
    }
    commentsListDiv.innerHTML = `<p>Loading comments for ${currentPageId}...</p>`;
    
    try {
        // MODIFICA: Aggiungi il filtro 'where' alla query
        const q = query(
            guestbookCollection,
            where("pageId", "==", currentPageId), // Filtra per il pageId corrente
            orderBy("timestamp", "desc"),
            limit(MAX_COMMENTS_DISPLAYED)
        );
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            commentsListDiv.innerHTML = '<p>Nessun commento per questa pagina. Sii il primo!</p>';
            return;
        }
        commentsListDiv.innerHTML = '';
        querySnapshot.forEach((docSnapshot) => {
            const commentData = docSnapshot.data();
            const commentId = docSnapshot.id;
            // ... (il resto della logica per creare l'elemento del commento rimane invariato) ...
            // Assicurati che la logica di creazione dell'avatar e del contenuto del commento sia qui sotto
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment-item');

            const avatarImg = document.createElement('img');
            avatarImg.width = 40; avatarImg.height = 40;
            avatarImg.style.borderRadius = '4px'; avatarImg.style.imageRendering = 'pixelated';
            avatarImg.style.backgroundColor = '#eee'; avatarImg.style.flexShrink = '0';
            avatarImg.alt = 'Avatar'; avatarImg.classList.add('comment-avatar-img');

            const avatarStyle = 'identicon';
            let seed = commentData.userId || commentData.name || `anon-${commentId}`;
            let altText = commentData.userName || commentData.name || 'Anonymous';

            const avatarUrl = `https://api.dicebear.com/8.x/${avatarStyle}/svg?seed=${encodeURIComponent(seed)}`;
            avatarImg.src = avatarUrl;
            avatarImg.alt = `${altText}'s Avatar`;
            avatarImg.onload = () => { avatarImg.style.backgroundColor = 'transparent'; };
            avatarImg.onerror = () => { avatarImg.style.backgroundColor = '#ddd'; avatarImg.alt = '!'; };
            commentElement.appendChild(avatarImg);

            const commentContent = document.createElement('div');
            commentContent.classList.add('comment-content');
            const nameEl = document.createElement('strong');
            nameEl.textContent = altText;
            const dateEl = document.createElement('small');
            dateEl.classList.add('comment-date');
            dateEl.textContent = ` - ${formatFirebaseTimestamp(commentData.timestamp)}`;
            const messageEl = document.createElement('p');
            messageEl.textContent = commentData.message ? String(commentData.message).replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';
            commentContent.appendChild(nameEl); commentContent.appendChild(dateEl); commentContent.appendChild(messageEl);

            const likesContainer = document.createElement('div');
            likesContainer.classList.add('likes-container');
            const likeButton = document.createElement('button');
            likeButton.innerHTML = '👍'; likeButton.classList.add('like-btn');
            likeButton.setAttribute('data-comment-id', commentId); likeButton.title = "Like this comment";
            const likeCountSpan = document.createElement('span');
            likeCountSpan.classList.add('like-count'); likeCountSpan.textContent = `${commentData.likes || 0}`;
            const likedComments = JSON.parse(localStorage.getItem('likedGuestbookComments')) || [];
            if (likedComments.includes(commentId)) { likeButton.disabled = true; likeButton.classList.add('liked'); likeButton.innerHTML = '❤️'; }
            likeButton.addEventListener('click', handleLikeComment);
            likesContainer.appendChild(likeButton); likesContainer.appendChild(likeCountSpan);
            commentContent.appendChild(likesContainer);

            commentElement.appendChild(commentContent);
            commentsListDiv.appendChild(commentElement);
        });
    } catch (error) {
        console.error(`comments.js - Error loading comments for pageId ${currentPageId}: `, error);
        if (error.code === 'failed-precondition' && commentsListDiv) {
            commentsListDiv.innerHTML = `<p>Errore: Indice Firestore mancante per filtrare i commenti. Controlla la console del browser per il link per crearlo.</p>`;
            console.error("Potrebbe essere necessario un indice composito in Firestore per la query dei commenti. L'errore originale è:", error.message);
        } else if (commentsListDiv) {
            commentsListDiv.innerHTML = '<p>Errore caricamento commenti. Riprova più tardi.</p>';
        }
    }
}

/** Handles the like button click (invariato, ma verifica che non modifichi pageId) */
async function handleLikeComment(event) {
    // ... (codice esistente, assicurati che l'updateDoc non rimuova/modifichi pageId accidentalmente)
    // Solitamente, l'incremento dei like non tocca altri campi, quindi dovrebbe essere ok.
    const likeButton = event.currentTarget;
    const commentId = likeButton.getAttribute('data-comment-id');
    if (!commentId) return;
    const user = auth.currentUser; // Non serve per l'azione di like in sé, ma può essere un controllo
    // if (!user) { alert("You must be logged in to like comments."); return; } // Rimosso per permettere like anonimi se le regole lo consentono (le regole attuali non lo vietano)
    if (!guestbookCollection) { alert("Database connection error."); return; }
    
    let likedComments = JSON.parse(localStorage.getItem('likedGuestbookComments')) || [];
    if (likedComments.includes(commentId)) { // Controllo aggiuntivo per evitare doppi click veloci
        console.log("Commento già piaciuto localmente.");
        return;
    }

    likeButton.disabled = true; 
    try {
        const commentDocRef = doc(db, "guestbookEntries", commentId);
        await updateDoc(commentDocRef, { likes: increment(1) });
        
        const likeCountSpan = likeButton.nextElementSibling;
        if (likeCountSpan?.classList.contains('like-count')) {
            likeCountSpan.textContent = `${parseInt(likeCountSpan.textContent || '0') + 1}`;
        }
        likeButton.classList.add('liked'); 
        likeButton.innerHTML = '❤️'; 
        
        if (!likedComments.includes(commentId)) {
            likedComments.push(commentId);
            localStorage.setItem('likedGuestbookComments', JSON.stringify(likedComments));
        }
    } catch (error) {
        console.error("comments.js - Like update error:", error); 
        alert("Failed to register like.");
        // Solo riabilita se non è già localmente segnato come 'liked'
        const stillLikedComments = JSON.parse(localStorage.getItem('likedGuestbookComments')) || [];
        if (!stillLikedComments.includes(commentId)) {
             likeButton.disabled = false; 
             likeButton.classList.remove('liked'); 
             likeButton.innerHTML = '👍';
        }
    }
}


/** Handles comment form submission */
async function handleCommentSubmit(event) {
    event.preventDefault();
    if (!guestbookCollection) { alert("Error: DB connection failed."); return; }
    const message = commentMessageInput?.value.trim();
    if (!message) { alert("Please enter a message."); return; }

    const user = auth.currentUser;
    let userIdToSave = null;
    let nameIdentifier = 'Anonymous'; 

    if (user) { 
        userIdToSave = user.uid;
        const userProfileRef = doc(db, "userProfiles", user.uid);
        try {
            const docSnap = await getDoc(userProfileRef);
            nameIdentifier = docSnap.exists() && docSnap.data().nickname ? docSnap.data().nickname : user.email.split('@')[0];
        } catch (profileError) {
            console.error("comments.js - Error loading profile for comment:", profileError);
            nameIdentifier = user.email.split('@')[0];
        }
    } else { 
        const nameFromInput = commentNameInput?.value.trim();
        if (!nameFromInput) { alert("Please enter your name or log in."); return; }
        nameIdentifier = nameFromInput;
    }

    if (!submitCommentBtn) { alert("Error: Submit button missing."); return; }
    submitCommentBtn.disabled = true; submitCommentBtn.textContent = "Submitting...";

    try {
        const commentData = {
            message: message,
            timestamp: serverTimestamp(),
            likes: 0,
            pageId: currentPageId // <<< AGGIUNGI IL pageId CORRENTE
        };
        if (userIdToSave) {
            commentData.userId = userIdToSave;
            commentData.userName = nameIdentifier;
        } else {
            commentData.name = nameIdentifier;
        }
        
        await addDoc(guestbookCollection, commentData);
        
        if (commentMessageInput) commentMessageInput.value = '';
        if (commentNameInput && !user) commentNameInput.value = '';
        await loadComments(); 
    } catch (error) {
        console.error("comments.js - Error submitting comment:", error);
        alert("Error submitting comment. Please try again.");
    } finally {
        if (submitCommentBtn) { submitCommentBtn.disabled = false; submitCommentBtn.textContent = "Submit Comment"; }
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    const user = auth.currentUser; 
    if (user && commentNameSection) {
         commentNameSection.style.display = 'none';
         if (commentNameInput) commentNameInput.required = false;
    } else if (commentNameSection) {
         commentNameSection.style.display = 'block';
         if (commentNameInput) commentNameInput.required = true;
    }
    
    if (commentForm) {
        commentForm.addEventListener('submit', handleCommentSubmit);
    }
    
    if (commentsListDiv && db && currentPageId) { // Assicurati che currentPageId sia definito
        loadComments();
    } else if (!db) {
        if(commentsListDiv) commentsListDiv.innerHTML = "<p>Error: Cannot connect to database.</p>";
    } else if (!currentPageId && commentsListDiv) {
         commentsListDiv.innerHTML = "<p>Error: Page context for comments not defined.</p>";
    }
});