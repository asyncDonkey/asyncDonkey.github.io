// js/profile.js

// Importazioni
import { db, auth, generateBlockieAvatar } from './main.js'; 
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// --- DEFINIZIONE COSTANTI ELEMENTI DOM ---
const profileContent = document.getElementById('profileContent');
const profileDetailsDisplay = document.getElementById('profileDetailsDisplay');
const profileAvatarImg = document.getElementById('profileAvatar');
const profileEmailSpan = document.getElementById('profileEmail');
const currentNicknameSpan = document.getElementById('currentNickname');
const profileNationalitySpan = document.getElementById('profileNationality'); // Definito qui
const profileUpdateForm = document.getElementById('profileUpdateForm');
const profileNicknameInput = document.getElementById('profileNicknameInput');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const profileMessage = document.getElementById('profileMessage');
const profileLoadingMessage = document.getElementById('profileLoadingMessage');
const profileLoginMessage = document.getElementById('profileLoginMessage');
// --- FINE DEFINIZIONE COSTANTI ---

let currentUser = null;
let currentUserProfile = null; // Inizializzato a null

// --- Functions ---

/**
 * Loads the profile data for the given user UID.
 * @param {string} uid The user's unique ID.
 */
async function loadProfileData(uid) {
    console.log("profile.js - Loading profile for UID:", uid);
    
    if (!profileContent || !profileLoadingMessage || !profileLoginMessage || !profileAvatarImg || !profileNationalitySpan || !profileEmailSpan || !currentNicknameSpan || !profileNicknameInput ) {
         console.error("Profile page DOM elements missing! Check IDs.");
         if(profileLoadingMessage) profileLoadingMessage.style.display = 'none';
         if(profileLoginMessage) {
             profileLoginMessage.style.display = 'block';
             profileLoginMessage.innerHTML = '<p>Error loading page elements. Please try again later.</p>';
         }
         return;
    }

    profileLoadingMessage.style.display = 'block';
    profileContent.style.display = 'none';
    profileLoginMessage.style.display = 'none';
    profileMessage.textContent = '';
    profileAvatarImg.src = ''; 
    profileAvatarImg.alt = 'Loading avatar...';
    profileAvatarImg.style.backgroundColor = '#eee';
    profileEmailSpan.textContent = 'Loading...';
    currentNicknameSpan.textContent = 'Loading...';
    profileNationalitySpan.textContent = 'Loading...'; // Testo di caricamento
    profileNicknameInput.value = '';

    const userProfileRef = doc(db, "userProfiles", uid);
    try {
        const docSnap = await getDoc(userProfileRef);
        if (docSnap.exists()) {
            currentUserProfile = docSnap.data(); // <<< currentUserProfile VIENE POPOLATO QUI
            console.log("profile.js - Profile data found:", currentUserProfile);

            profileEmailSpan.textContent = currentUserProfile.email || 'N/A';
            currentNicknameSpan.textContent = currentUserProfile.nickname || 'Non impostato';
            profileNicknameInput.value = currentUserProfile.nickname || '';

            // --- LOGICA PER LA NAZIONALITÀ (Solo Testo) SPOSTATA QUI DENTRO ---
            if (profileNationalitySpan) { // profileNationalitySpan è la costante definita sopra
                if (currentUserProfile.nationalityCode && currentUserProfile.nationalityCode !== "OTHER") {
                    const countryCode = currentUserProfile.nationalityCode.toUpperCase();
                    profileNationalitySpan.textContent = countryCode; // Mostra solo il codice
                    console.log("profile.js (Solo Testo): Codice Nazione visualizzato:", countryCode);
                } else if (currentUserProfile.nationalityCode === "OTHER") {
                    profileNationalitySpan.textContent = 'Altro / Non specificato';
                } else {
                    profileNationalitySpan.textContent = 'Non specificata';
                }
            }
            // --- FINE LOGICA NAZIONALITÀ ---

            if (profileAvatarImg) {
                 const seedForAvatar = uid; 
                 profileAvatarImg.src = generateBlockieAvatar(seedForAvatar, 80, { size: 8 }); 
                 profileAvatarImg.alt = `${currentUserProfile.nickname || 'User'}'s Blockie Avatar`;
                 profileAvatarImg.style.backgroundColor = 'transparent'; 
                 profileAvatarImg.onerror = () => { 
                     profileAvatarImg.style.backgroundColor = '#eee'; 
                     profileAvatarImg.alt='Error loading avatar'; 
                 };
            }

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
    if (!currentUser) { 
        if(profileMessage) { 
            profileMessage.textContent = 'Errore: Utente non autenticato.';
            profileMessage.style.color = 'red';
        }
        return; 
    }
    
    if (!profileNicknameInput || !saveProfileBtn || !profileMessage || !currentNicknameSpan ) { 
        console.error("profile.js - Elementi DOM per l'aggiornamento del profilo mancanti in handleProfileUpdate.");
        alert("Errore nell'interfaccia utente. Impossibile salvare.");
        return; 
    }

    const newNickname = profileNicknameInput.value.trim();

    if (newNickname.length < 3 || newNickname.length > 50) { 
        profileMessage.textContent = 'Il nickname deve avere tra 3 e 50 caratteri.';
        profileMessage.style.color = 'red';
        return; 
    }
    // Controlla se currentUserProfile è stato caricato prima di accedere al nickname
    const currentStoredNickname = currentUserProfile ? currentUserProfile.nickname : '';
    if (newNickname === (currentStoredNickname || '')) { 
        profileMessage.textContent = 'Nessuna modifica rilevata nel nickname.';
        profileMessage.style.color = 'orange';
        return; 
    }

    saveProfileBtn.disabled = true; 
    saveProfileBtn.textContent = 'Saving...'; 
    profileMessage.textContent = '';

    const userProfileRef = doc(db, "userProfiles", currentUser.uid);
    const dataToUpdate = { nickname: newNickname };

    try {
        await updateDoc(userProfileRef, dataToUpdate);
        console.log("profile.js - Profile nickname updated successfully for UID:", currentUser.uid);
        profileMessage.textContent = 'Profile updated successfully!'; 
        profileMessage.style.color = 'green';
        currentNicknameSpan.textContent = newNickname;
        if(currentUserProfile) currentUserProfile.nickname = newNickname;
    } catch (error) {
        console.error("profile.js - Error updating profile:", error);
        profileMessage.textContent = `Error updating profile: ${error.message}`; 
        profileMessage.style.color = 'red';
        if (error.code === 'permission-denied') { 
            profileMessage.textContent += ' (Check Firestore Rules)'; 
        }
    } finally {
        if(saveProfileBtn) { 
            saveProfileBtn.disabled = false; 
            saveProfileBtn.textContent = 'Save Changes'; 
        }
    }
}

// --- Initialization --- 
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("profile.js - User is logged in:", user.uid);
        currentUser = user;
        if (profileContent && profileLoadingMessage && profileLoginMessage) {
            loadProfileData(user.uid); 
        } else {
            console.error("profile.js - Auth listener: Elementi UI principali non trovati.");
        }
    } else {
        console.log("profile.js - User is signed out.");
        currentUser = null; 
        currentUserProfile = null;
        if (profileContent) profileContent.style.display = 'none';
        if (profileLoadingMessage) profileLoadingMessage.style.display = 'none';
        if (profileLoginMessage) profileLoginMessage.style.display = 'block';
    }
});

if (profileUpdateForm) {
    profileUpdateForm.addEventListener('submit', handleProfileUpdate);
} else {
     console.warn("profile.js - Form profileUpdateForm non trovato.");
}