// js/comments.js

import { db, auth } from './main.js';
import {
    collection, addDoc, query, orderBy, limit, getDocs,
    serverTimestamp, Timestamp, doc, updateDoc, increment,
    getDoc
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
const MAX_COMMENTS_DISPLAYED = 20;

/** Formats Firestore Timestamp */
function formatFirebaseTimestamp(firebaseTimestamp) {
    if (!firebaseTimestamp?.toDate) return 'Date unavailable';
    try {
        return firebaseTimestamp.toDate().toLocaleString('it-IT', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return 'Date format error'; }
}

/** Loads and displays comments */
async function loadComments() {
    if (!commentsListDiv) return;
    if (!guestbookCollection) {
        commentsListDiv.innerHTML = '<p>Error: Database connection failed.</p>';
        return;
    }
    commentsListDiv.innerHTML = '<p>Loading comments...</p>';
    // console.log("comments.js - loadComments: Starting...");
    try {
        const q = query(guestbookCollection, orderBy("timestamp", "desc"), limit(MAX_COMMENTS_DISPLAYED));
        const querySnapshot = await getDocs(q);
        // console.log(`comments.js - loadComments: Found ${querySnapshot.size} documents.`);
        if (querySnapshot.empty) {
            commentsListDiv.innerHTML = '<p>No comments yet. Be the first!</p>';
            return;
        }
        commentsListDiv.innerHTML = '';
        querySnapshot.forEach((docSnapshot) => {
            const commentData = docSnapshot.data();
            const commentId = docSnapshot.id;
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment-item');

            // Avatar Image using DiceBear (incl. Anonymous)
            const avatarImg = document.createElement('img');
            avatarImg.width = 40; avatarImg.height = 40;
            avatarImg.style.borderRadius = '4px'; avatarImg.style.imageRendering = 'pixelated';
            avatarImg.style.backgroundColor = '#eee'; avatarImg.style.flexShrink = '0';
            avatarImg.alt = 'Avatar'; avatarImg.classList.add('comment-avatar-img');

            const avatarStyle = 'identicon';
            let seed = commentData.userId || commentData.name || `anon-${commentId}`; // Use userId, fallback to name, fallback to unique ID
            let altText = commentData.userName || commentData.name || 'Anonymous';

            const avatarUrl = `https://api.dicebear.com/8.x/${avatarStyle}/svg?seed=${encodeURIComponent(seed)}`;
            avatarImg.src = avatarUrl;
            avatarImg.alt = `${altText}'s Avatar`;
            avatarImg.onload = () => { avatarImg.style.backgroundColor = 'transparent'; };
            avatarImg.onerror = () => { avatarImg.style.backgroundColor = '#ddd'; avatarImg.alt = '!'; };

            commentElement.appendChild(avatarImg);

            // Comment Content (Name, Date, Message, Likes)
            const commentContent = document.createElement('div');
            commentContent.classList.add('comment-content');
            const nameEl = document.createElement('strong');
            nameEl.textContent = altText; // Use the same name determined for alt text
            const dateEl = document.createElement('small');
            dateEl.classList.add('comment-date');
            dateEl.textContent = ` - ${formatFirebaseTimestamp(commentData.timestamp)}`;
            const messageEl = document.createElement('p');
            messageEl.textContent = commentData.message ? String(commentData.message).replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';
            commentContent.appendChild(nameEl); commentContent.appendChild(dateEl); commentContent.appendChild(messageEl);

            // Likes Section
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
        // console.log(`comments.js - loadComments: Loop complete.`);
    } catch (error) {
        console.error("comments.js - Error loading comments: ", error);
        commentsListDiv.innerHTML = '<p>Error loading comments. Please try again later.</p>';
    }
}

/** Handles the like button click */
async function handleLikeComment(event) {
    const likeButton = event.currentTarget;
    const commentId = likeButton.getAttribute('data-comment-id');
    if (!commentId) return;
    const user = auth.currentUser;
    if (!user) { alert("You must be logged in to like comments."); return; }
    if (!guestbookCollection) { alert("Database connection error."); return; }
    likeButton.disabled = true;
    try {
        const commentDocRef = doc(db, "guestbookEntries", commentId);
        await updateDoc(commentDocRef, { likes: increment(1) });
        const likeCountSpan = likeButton.nextElementSibling;
        if (likeCountSpan?.classList.contains('like-count')) {
            likeCountSpan.textContent = `${parseInt(likeCountSpan.textContent) + 1}`;
        }
        likeButton.classList.add('liked'); likeButton.innerHTML = '❤️';
        let likedComments = JSON.parse(localStorage.getItem('likedGuestbookComments')) || [];
        if (!likedComments.includes(commentId)) {
            likedComments.push(commentId);
            localStorage.setItem('likedGuestbookComments', JSON.stringify(likedComments));
        }
    } catch (error) {
        console.error("comments.js - Like update error:", error); alert("Failed to register like.");
        const likedComments = JSON.parse(localStorage.getItem('likedGuestbookComments')) || [];
        if (!likedComments.includes(commentId)) { // Only re-enable if not already liked locally
             likeButton.disabled = false; likeButton.classList.remove('liked'); likeButton.innerHTML = '👍';
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
    let nameIdentifier = 'Anonymous'; // Used for display and potentially saving

    if (user) { // Logged In
        userIdToSave = user.uid;
        const userProfileRef = doc(db, "userProfiles", user.uid);
        try {
            const docSnap = await getDoc(userProfileRef);
            nameIdentifier = docSnap.exists() && docSnap.data().nickname ? docSnap.data().nickname : user.email.split('@')[0];
        } catch (profileError) {
            console.error("comments.js - Error loading profile for comment:", profileError);
            nameIdentifier = user.email.split('@')[0]; // Fallback
        }
    } else { // Anonymous
        const nameFromInput = commentNameInput?.value.trim();
        if (!nameFromInput) { alert("Please enter your name or log in."); return; }
        nameIdentifier = nameFromInput;
    }

    if (!submitCommentBtn) { alert("Error: Submit button missing."); return; }
    submitCommentBtn.disabled = true; submitCommentBtn.textContent = "Submitting...";

    try {
        const commentData = { message: message, timestamp: serverTimestamp(), likes: 0 };
        if (userIdToSave) {
            commentData.userId = userIdToSave;
            commentData.userName = nameIdentifier; // Use determined name/nickname
        } else {
            commentData.name = nameIdentifier; // Use 'name' field for anonymous
        }
        // console.log("comments.js - Submitting comment data:", commentData);
        await addDoc(guestbookCollection, commentData);
        // console.log("comments.js - Comment submitted.");

        if (commentMessageInput) commentMessageInput.value = '';
        if (commentNameInput && !user) commentNameInput.value = ''; // Clear name only if anonymous
        await loadComments(); // Refresh comments list
    } catch (error) {
        console.error("comments.js - Error submitting comment:", error);
        alert("Error submitting comment. Please try again.");
    } finally {
        if (submitCommentBtn) { submitCommentBtn.disabled = false; submitCommentBtn.textContent = "Submit Comment"; }
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Set initial state of name input based on auth status
    const user = auth.currentUser; // Check initial state
    if (user && commentNameSection) {
         commentNameSection.style.display = 'none';
         if (commentNameInput) commentNameInput.required = false;
    } else if (commentNameSection) {
         commentNameSection.style.display = 'block';
         if (commentNameInput) commentNameInput.required = true;
    }
    // Attach form listener
    if (commentForm) {
        commentForm.addEventListener('submit', handleCommentSubmit);
    }
    // Load initial comments
    if (commentsListDiv && db) {
        loadComments();
    } else if (!db) {
        if(commentsListDiv) commentsListDiv.innerHTML = "<p>Error: Cannot connect to database.</p>";
    }
});