// js/comments.js

import { db, auth, generateBlockieAvatar } from './main.js';
import {
    collection, addDoc, query, orderBy, limit, getDocs,
    serverTimestamp, doc, updateDoc, increment, getDoc, where,
    arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// ---> AGGIUNGI L'IMPORTAZIONE MANCANTE <---
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


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
const commentsListContainer = document.getElementById('commentsListContainer');

const MAX_COMMENTS_DISPLAYED = 20;
const INITIAL_LIKE_EMOJI = '🤍'; // Cuore bianco per "non piaciuto"
const LIKED_EMOJI = '💙';       // Cuore azzurro per "piaciuto"

let currentPageId = 'default'; 
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
    if (!commentsListDiv || !guestbookCollection) {
        if (commentsListDiv) commentsListDiv.innerHTML = '<p>Error: Database connection or DOM element missing.</p>';
        return;
    }
    commentsListDiv.innerHTML = `<p>Loading comments for ${currentPageId}...</p>`;
    
    const currentUser = auth.currentUser; 

    try {
        const q = query(
            guestbookCollection,
            where("pageId", "==", currentPageId), 
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
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment-item');

            const avatarImg = document.createElement('img');
            avatarImg.width = 40; avatarImg.height = 40;
            avatarImg.style.borderRadius = '4px'; avatarImg.style.imageRendering = 'pixelated';
            avatarImg.style.flexShrink = '0'; avatarImg.classList.add('comment-avatar-img'); 
            const seedForBlockie = commentData.userId || commentData.userName || commentData.name || `anon-${commentId}`;
            let altTextForBlockie = commentData.userName || commentData.name || 'Anonymous'; 
            avatarImg.src = generateBlockieAvatar(seedForBlockie, 40, {size: 8}); 
            avatarImg.alt = `${altTextForBlockie}'s Blockie Avatar`;
            avatarImg.style.backgroundColor = 'transparent'; 
            avatarImg.onerror = () => { 
                avatarImg.style.backgroundColor = '#ddd'; avatarImg.alt = 'Avatar Error'; 
                avatarImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' fill='%23ddd'/%3E%3Ctext x='5' y='7.5' font-size='5' text-anchor='middle' fill='%23777'%3E?%3C/text%3E%3C/svg%3E";
            };
            commentElement.appendChild(avatarImg);

            const commentContent = document.createElement('div');
            commentContent.classList.add('comment-content');
            const nameEl = document.createElement('strong');
            let commenterNameDisplay = commentData.userId ? (commentData.userName || 'Utente Registrato') : ((commentData.name || 'Anonimo') + " (Ospite)");
            nameEl.textContent = commenterNameDisplay; 
            const dateEl = document.createElement('small');
            dateEl.classList.add('comment-date');
            dateEl.textContent = ` - ${formatFirebaseTimestamp(commentData.timestamp)}`;
            const messageEl = document.createElement('p');
            messageEl.textContent = commentData.message ? String(commentData.message).replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';
            commentContent.appendChild(nameEl); commentContent.appendChild(dateEl); commentContent.appendChild(messageEl);

            const likesContainer = document.createElement('div');
            likesContainer.classList.add('likes-container');
            const likeButton = document.createElement('button');
            likeButton.classList.add('like-btn');
            likeButton.setAttribute('data-comment-id', commentId); 
            likeButton.title = "Like this comment";
            
            const likeCountSpan = document.createElement('span');
            likeCountSpan.classList.add('like-count'); 
            likeCountSpan.textContent = `${commentData.likes || 0}`;
            
            if (!currentUser) { 
                likeButton.innerHTML = INITIAL_LIKE_EMOJI;
                likeButton.disabled = true;
                likeButton.title = "Devi essere loggato per mettere like";
            } else {
                const userHasLiked = commentData.likedBy && commentData.likedBy.includes(currentUser.uid);
                if (userHasLiked) {
                    likeButton.innerHTML = LIKED_EMOJI;
                    likeButton.classList.add('liked');
                    likeButton.disabled = true;
                } else {
                    likeButton.innerHTML = INITIAL_LIKE_EMOJI;
                    likeButton.disabled = false; 
                }
            }
            
            likeButton.addEventListener('click', handleLikeComment);
            likesContainer.appendChild(likeButton); 
            likesContainer.appendChild(likeCountSpan);
            commentContent.appendChild(likesContainer);

            commentElement.appendChild(commentContent);
            commentsListDiv.appendChild(commentElement);
        });
    } catch (error) {
        console.error(`comments.js - Error loading comments for pageId ${currentPageId}: `, error); 
        if (error.code === 'failed-precondition' && commentsListDiv) {
            commentsListDiv.innerHTML = `<p>Errore: Indice Firestore mancante per filtrare i commenti. Controlla la console del browser per il link per crearlo.</p>`;
        } else if (commentsListDiv) {
            commentsListDiv.innerHTML = '<p>Errore caricamento commenti. Riprova più tardi.</p>';
        }
    }
}

/** Handles the like button click */
async function handleLikeComment(event) {
    const likeButton = event.currentTarget;
    const commentId = likeButton.getAttribute('data-comment-id');
    if (!commentId || !guestbookCollection) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
        alert("Devi essere loggato per mettere like ai commenti.");
        return;
    }

    likeButton.disabled = true; 

    try {
        const commentDocRef = doc(db, "guestbookEntries", commentId);
        
        // Per essere sicuri dello stato attuale, potremmo fare un get, ma proviamo ad aggiornare direttamente
        // e gestire il caso in cui l'utente ha già messo like tramite l'UI e la logica di caricamento.
        // Firestore Rules dovrebbero prevenire abusi.

        await updateDoc(commentDocRef, { 
            likes: increment(1),
            likedBy: arrayUnion(currentUser.uid) 
        }); 
        
        // Aggiorna l'UI in modo ottimistico
        const likeCountSpan = likeButton.nextElementSibling;
        if (likeCountSpan?.classList.contains('like-count')) {
            const currentLikes = parseInt(likeCountSpan.textContent || '0');
            likeCountSpan.textContent = `${currentLikes + 1}`;
        }
        likeButton.classList.add('liked'); 
        likeButton.innerHTML = LIKED_EMOJI; 
        
        // Non è più necessario il localStorage per la logica di "già piaciuto" per l'utente corrente
        // perché ora ci basiamo sul campo 'likedBy' da Firestore.

    } catch (error) {
        console.error("comments.js - Like update error:", error); 
        alert("Errore nel registrare il like. Riprova.");
        // Se l'update fallisce, potremmo dover ripristinare lo stato del pulsante.
        // Questo può essere complesso perché l'errore potrebbe essere dovuto a varie cause (es. regole, rete).
        // Per ora, lo lasciamo disabilitato per evitare ulteriori problemi,
        // un refresh della pagina da parte dell'utente ricaricherà lo stato corretto.
        // Potremmo ricaricare solo questo commento per precisione.
        // likeButton.disabled = false; // Potrebbe non essere sicuro riabilitarlo senza sapere lo stato
        // likeButton.innerHTML = INITIAL_LIKE_EMOJI;
        loadComments(); // Ricarica tutti i commenti per riflettere lo stato corretto
    }
}


/** Handles comment form submission */
async function handleCommentSubmit(event) {
    event.preventDefault();
    if (!guestbookCollection || !commentMessageInput || !submitCommentBtn || !commentsListDiv) {
         console.error("comments.js - Elementi DOM del form commenti mancanti."); 
         alert("Errore interfaccia. Riprova.");
         return;
    }
    const message = commentMessageInput.value.trim();
    if (!message) { alert("Please enter a message."); return; }

    const user = auth.currentUser;
    let userIdToSave = null, userNameForDb = null, nameForDb = null;

    if (user) {
        userIdToSave = user.uid;
        try {
            const userProfileRef = doc(db, "userProfiles", user.uid);
            const docSnap = await getDoc(userProfileRef);
            userNameForDb = docSnap.exists() && docSnap.data().nickname ? docSnap.data().nickname : (user.email ? user.email.split('@')[0] : 'Registered User');
        } catch (profileError) {
            console.error("comments.js - Error loading profile for comment:", profileError);
            userNameForDb = user.email ? user.email.split('@')[0] : 'Registered User';
        }
    } else {
        if (!commentNameInput || !commentNameSection) {
            console.error("comments.js - Elementi DOM per nome anonimo mancanti."); 
            alert("Errore interfaccia. Riprova.");
            return;
        }
        nameForDb = commentNameInput.value.trim();
        if (!nameForDb) { alert("Please enter your name or log in."); return; }
    }

    submitCommentBtn.disabled = true; submitCommentBtn.textContent = "Submitting...";
    try {
        const commentData = {
            message: message,
            timestamp: serverTimestamp(),
            likes: 0,
            pageId: currentPageId,
            likedBy: [] // Inizializza likedBy come array vuoto
        };
        if (userIdToSave) {
            commentData.userId = userIdToSave;
            commentData.userName = userNameForDb;
        } else {
            commentData.name = nameForDb;
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
    if (commentNameSection && commentNameInput) { 
        if (user) { commentNameSection.style.display = 'none'; commentNameInput.required = false; } 
        else { commentNameSection.style.display = 'block'; commentNameInput.required = true; }
    }
    if (commentForm) commentForm.addEventListener('submit', handleCommentSubmit);
    if (commentsListDiv && db && currentPageId) {
        loadComments();
    } else if (!db && commentsListDiv) {
        commentsListDiv.innerHTML = "<p>Error: Cannot connect to database.</p>";
    } else if (!currentPageId && commentsListDiv) {
         commentsListDiv.innerHTML = "<p>Error: Page context for comments not defined.</p>";
    }

});

// --- Listener per cambio stato autenticazione (ORA CON IMPORT CORRETTO) ---
onAuthStateChanged(auth, (user) => {
    console.log("comments.js - Auth state changed. User:", user ? user.uid : "null");
    // Aggiorna la visibilità del campo nome
    if (commentNameSection && commentNameInput) {
        if (user) { 
            commentNameSection.style.display = 'none'; 
            commentNameInput.required = false; 
        } else { 
            commentNameSection.style.display = 'block'; 
            commentNameInput.required = true; 
        }
    }
    // Ricarica i commenti perché lo stato dei like potrebbe dover cambiare per l'utente corrente
    // e per aggiornare la UI dei pulsanti like
    if (commentsListDiv && db && currentPageId) {
        console.log("Auth state changed, reloading comments for like status and UI update.");
        loadComments();
    }
});

// --- Listener per cambio stato autenticazione (ORA CON IMPORT CORRETTO) ---
onAuthStateChanged(auth, (user) => {
    console.log("comments.js - Auth state changed. User:", user ? user.uid : "null");
    // Aggiorna la visibilità del campo nome
    if (commentNameSection && commentNameInput) {
        if (user) { 
            commentNameSection.style.display = 'none'; 
            commentNameInput.required = false; 
        } else { 
            commentNameSection.style.display = 'block'; 
            commentNameInput.required = true; 
        }
    }
    // Ricarica i commenti perché lo stato dei like potrebbe dover cambiare per l'utente corrente
    // e per aggiornare la UI dei pulsanti like
    if (commentsListDiv && db && currentPageId) {
        console.log("Auth state changed, reloading comments for like status and UI update.");
        loadComments();
    }
});