// js/profile.js

import { db, auth } from './main.js'; // Import shared instances
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// --- DOM Elements ---
const profileContent = document.getElementById('profileContent');
const profileDetailsDisplay = document.getElementById('profileDetailsDisplay');
const profileAvatarImg = document.getElementById('profileAvatar'); // Prendi l'elemento <img>
const profileEmailSpan = document.getElementById('profileEmail');
const currentNicknameSpan = document.getElementById('currentNickname');
const profileUpdateForm = document.getElementById('profileUpdateForm');
const profileNicknameInput = document.getElementById('profileNicknameInput');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const profileMessage = document.getElementById('profileMessage');
const profileLoadingMessage = document.getElementById('profileLoadingMessage');
const profileLoginMessage = document.getElementById('profileLoginMessage');

let currentUser = null;
let currentUserProfile = null;

// --- Functions ---

/**
 * Loads the profile data for the given user UID.
 * @param {string} uid The user's unique ID.
 */
async function loadProfileData(uid) {
    console.log("profile.js - Loading profile for UID:", uid);
    if (!profileContent || !profileLoadingMessage || !profileLoginMessage || !profileAvatarImg) { // Check for img tag
         console.error("Profile page DOM elements missing!");
         return;
    }

    profileLoadingMessage.style.display = 'block';
    profileContent.style.display = 'none';
    profileLoginMessage.style.display = 'none';
    profileMessage.textContent = '';
    profileAvatarImg.src = ''; // Clear previous avatar
    profileAvatarImg.alt = 'Loading avatar...';
    profileAvatarImg.style.backgroundColor = '#eee'; // Reimposta bg placeholder

    const userProfileRef = doc(db, "userProfiles", uid);

    try {
        const docSnap = await getDoc(userProfileRef);

        if (docSnap.exists()) {
            currentUserProfile = docSnap.data();
            console.log("profile.js - Profile data found:", currentUserProfile);

            // Populate display fields
            if (profileEmailSpan) profileEmailSpan.textContent = currentUserProfile.email || 'N/A';
            if (currentNicknameSpan) currentNicknameSpan.textContent = currentUserProfile.nickname || 'Not Set';
            if (profileNicknameInput) profileNicknameInput.value = currentUserProfile.nickname || '';

            // ++ Set Avatar using DiceBear API URL ++
            if (profileAvatarImg) {
                 const avatarStyle = 'identicon'; // <-- Usa lo stile identicon come richiesto
                 const avatarUrl = `https://api.dicebear.com/8.x/${avatarStyle}/svg?seed=${uid}`;
                 profileAvatarImg.src = avatarUrl;
                 profileAvatarImg.alt = `${currentUserProfile.nickname || 'User'}'s Avatar`;
                 profileAvatarImg.onload = () => { profileAvatarImg.style.backgroundColor = 'transparent'; }; // Rimuovi bg solo se carica
                 profileAvatarImg.onerror = () => { profileAvatarImg.style.backgroundColor = '#eee'; profileAvatarImg.alt='Error'; }; // Fallback visivo su errore
            }
            // ++ End Avatar ++

            profileLoadingMessage.style.display = 'none';
            profileContent.style.display = 'block';

        } else {
            console.warn("profile.js - No profile document found for user:", uid);
            profileLoadingMessage.style.display = 'none';
            profileLoginMessage.style.display = 'block';
            profileLoginMessage.innerHTML = '<p>Error: Could not find profile data.</p>';
        }
    } catch (error) {
        console.error("profile.js - Error loading profile data:", error);
        profileLoadingMessage.style.display = 'none';
        profileLoginMessage.style.display = 'block';
        profileLoginMessage.innerHTML = `<p>Error loading profile: ${error.message}</p>`;
    }
}

/**
 * Handles the profile update form submission.
 * @param {Event} event
 */
async function handleProfileUpdate(event) {
    event.preventDefault();
    if (!currentUser) { /* ... errore ... */ return; }
    if (!profileNicknameInput || !saveProfileBtn) { /* ... errore ... */ return; }

    const newNickname = profileNicknameInput.value.trim();

    // Validation
    if (newNickname.length < 3 || newNickname.length > 50) { /* ... errore ... */ return; }
    if (newNickname === (currentUserProfile?.nickname || '')) { /* ... nessun cambiamento ... */ return; }

    saveProfileBtn.disabled = true; saveProfileBtn.textContent = 'Saving...'; profileMessage.textContent = '';

    const userProfileRef = doc(db, "userProfiles", currentUser.uid);
    const dataToUpdate = { nickname: newNickname };

    try {
        await updateDoc(userProfileRef, dataToUpdate);
        console.log("profile.js - Profile nickname updated successfully for UID:", currentUser.uid);
        profileMessage.textContent = 'Profile updated successfully!'; profileMessage.style.color = 'green';
        if (currentNicknameSpan) currentNicknameSpan.textContent = newNickname;
        if(currentUserProfile) currentUserProfile.nickname = newNickname;
    } catch (error) {
        console.error("profile.js - Error updating profile:", error);
        profileMessage.textContent = `Error updating profile: ${error.message}`; profileMessage.style.color = 'red';
        if (error.code === 'permission-denied') { profileMessage.textContent += ' (Check Firestore Rules)'; }
    } finally {
        if(saveProfileBtn) { saveProfileBtn.disabled = false; saveProfileBtn.textContent = 'Save Changes'; }
    }
}

// --- Initialization ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("profile.js - User is logged in:", user.uid);
        currentUser = user;
        loadProfileData(user.uid);
    } else {
        console.log("profile.js - User is signed out.");
        currentUser = null; currentUserProfile = null;
        if (profileContent) profileContent.style.display = 'none';
        if (profileLoadingMessage) profileLoadingMessage.style.display = 'none';
        if (profileLoginMessage) profileLoginMessage.style.display = 'block';
    }
});

if (profileUpdateForm) {
    profileUpdateForm.addEventListener('submit', handleProfileUpdate);
}

