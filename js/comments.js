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

const MAX_COMMENTS_DISPLAYED = 20;

/**
 * Formats a Firestore Timestamp object or an ISO string into a readable string.
 * @param {Timestamp|string|any} firebaseTimestamp The timestamp field value from the database.
 * @returns {string} Formatted date and time or a fallback message.
 */
function formatFirebaseTimestamp(firebaseTimestamp) {
    if (firebaseTimestamp && typeof firebaseTimestamp.toDate === 'function') {
        try {
            const date = firebaseTimestamp.toDate();
            return date.toLocaleString('en-US', { // Changed to en-US for English format
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) {
            console.error("Error converting Firestore Timestamp:", e);
            return 'Date format error'; // Translated
        }
    }
    else if (typeof firebaseTimestamp === 'string' && firebaseTimestamp.length > 0) {
        try {
            const date = new Date(firebaseTimestamp);
            if (!isNaN(date.getTime())) {
                return date.toLocaleString('en-US', { // Changed to en-US
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                }) + " (converted)"; // Translated
            } else {
                return firebaseTimestamp + ' (unrecognized format)'; // Translated
            }
        } catch (e) {
            console.error("Error parsing timestamp string:", e);
            return firebaseTimestamp + ' (parsing error)';
        }
    }
    else {
        console.warn("Unrecognized timestamp format or missing value:", firebaseTimestamp);
        return 'Date not available'; // Translated
    }
}


/**
 * Loads and displays comments from Firestore.
 */
async function loadComments() {
    if (!commentsListDiv) {
        console.error("commentsList element not found!");
        return;
    }
    commentsListDiv.innerHTML = '<p>Loading comments...</p>'; // Translated

    try {
        const q = query(guestbookCollection, orderBy("timestamp", "desc"), limit(MAX_COMMENTS_DISPLAYED));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            commentsListDiv.innerHTML = '<p>No comments yet. Be the first!</p>'; // Translated
            return;
        }

        commentsListDiv.innerHTML = '';

        querySnapshot.forEach((docSnapshot) => {
            const commentData = docSnapshot.data();
            const commentId = docSnapshot.id;
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment-item');

            const nameEl = document.createElement('strong');
            nameEl.textContent = commentData.name || 'Anonymous'; // Standard English for anonymous

            const dateEl = document.createElement('small');
            dateEl.classList.add('comment-date');
            dateEl.textContent = ` - ${formatFirebaseTimestamp(commentData.timestamp)}`;

            const messageEl = document.createElement('p');
            messageEl.textContent = commentData.message || '';
            messageEl.textContent = messageEl.textContent.replace(/</g, "&lt;").replace(/>/g, "&gt;");

            commentElement.appendChild(nameEl);
            commentElement.appendChild(dateEl);
            commentElement.appendChild(messageEl);

            const likesContainer = document.createElement('div');
            likesContainer.classList.add('likes-container');

            const likeButton = document.createElement('button');
            likeButton.innerHTML = '👍';
            likeButton.classList.add('like-btn');
            likeButton.setAttribute('data-comment-id', commentId);
            likeButton.title = "Like this comment"; // Translated

            const likeCountSpan = document.createElement('span');
            likeCountSpan.classList.add('like-count');
            likeCountSpan.textContent = `${commentData.likes || 0}`;

            const likedComments = JSON.parse(localStorage.getItem('likedGuestbookComments')) || [];
            if (likedComments.includes(commentId)) {
                likeButton.disabled = true;
                likeButton.classList.add('liked');
                likeButton.innerHTML = '❤️'; // Heart indicates already liked
            }

            likeButton.addEventListener('click', handleLikeComment);

            likesContainer.appendChild(likeButton);
            likesContainer.appendChild(likeCountSpan);
            commentElement.appendChild(likesContainer);

            commentsListDiv.appendChild(commentElement);
        });

    } catch (error) {
        console.error("Error loading comments: ", error);
        commentsListDiv.innerHTML = '<p>Error loading comments. Please try again later.</p>'; // Translated
    }
}

/**
 * Handles the "Like" button click.
 * @param {Event} event
 */
async function handleLikeComment(event) {
    const likeButton = event.currentTarget;
    const commentId = likeButton.getAttribute('data-comment-id');

    if (!commentId) {
        console.error("Comment ID not found for 'like'.");
        return;
    }

    likeButton.disabled = true;

    try {
        const commentDocRef = doc(db, "guestbookEntries", commentId);
        await updateDoc(commentDocRef, {
            likes: increment(1)
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
        console.error("Error updating 'likes':", error);
        alert("Could not register your 'like'. Please try again."); // Translated
        const likedComments = JSON.parse(localStorage.getItem('likedGuestbookComments')) || [];
        if (!likedComments.includes(commentId)) {
             likeButton.disabled = false;
        }
    }
}


/**
 * Handles the comment form submission.
 * @param {Event} event
 */
async function handleCommentSubmit(event) {
    event.preventDefault();

    if (!commentNameInput || !commentMessageInput || !submitCommentBtn) {
        console.error("Comment form elements missing!");
        return;
    }

    const name = commentNameInput.value.trim();
    const message = commentMessageInput.value.trim();

    if (!name || !message) {
        alert("Please enter both name and message."); // Translated
        return;
    }

    submitCommentBtn.disabled = true;
    submitCommentBtn.textContent = "Submitting..."; // Translated

    try {
        await addDoc(guestbookCollection, {
            name: name,
            message: message,
            timestamp: serverTimestamp(),
            likes: 0
        });

        commentNameInput.value = '';
        commentMessageInput.value = '';
        alert("Comment submitted successfully!"); // Translated

        await loadComments();

    } catch (error) {
        console.error("Error submitting comment: ", error);
        alert("There was an error submitting your comment. Please try again."); // Translated
    } finally {
        submitCommentBtn.disabled = false;
        submitCommentBtn.textContent = "Submit Comment"; // Translated
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    if (commentForm) {
        commentForm.addEventListener('submit', handleCommentSubmit);
    } else {
        console.error("Comment form not found!");
    }
    loadComments();
});