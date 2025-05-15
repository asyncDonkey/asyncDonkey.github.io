// js/profile.js

import { db, auth, generateBlockieAvatar } from './main.js';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, deleteDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// --- DEFINIZIONE COSTANTI ELEMENTI DOM (ESISTENTI) ---
const profileContent = document.getElementById('profileContent');
const profileDetailsDisplay = document.getElementById('profileDetailsDisplay'); // Assicurati esista
const profileAvatarImg = document.getElementById('profileAvatar');
const profileEmailSpan = document.getElementById('profileEmail');
const currentNicknameSpan = document.getElementById('currentNickname');
const profileNationalitySpan = document.getElementById('profileNationality');
const profileUpdateForm = document.getElementById('profileUpdateForm');
const profileNicknameInput = document.getElementById('profileNicknameInput');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const profileMessage = document.getElementById('profileMessage');
const profileLoadingMessage = document.getElementById('profileLoadingMessage');
const profileLoginMessage = document.getElementById('profileLoginMessage');

// --- NUOVI RIFERIMENTI DOM per "I Miei Articoli" ---
const myArticlesSection = document.getElementById('myArticlesSection');
const myDraftsLoadingMessage = document.getElementById('myDraftsLoadingMessage');
const myDraftArticlesListDiv = document.getElementById('myDraftArticlesList');
// Aggiungi qui altri se necessario per pending, published, rejected in futuro

let currentUser = null;
let currentUserProfile = null;

// --- Funzioni Esistenti ---
async function loadProfileData(uid) {
    console.log("profile.js - Loading profile for UID:", uid);

    // Assicurati che tutti gli elementi DOM necessari per questa funzione siano validi
    if (!profileContent || !profileLoadingMessage || !profileLoginMessage || !profileAvatarImg || !profileNationalitySpan || !profileEmailSpan || !currentNicknameSpan || !profileNicknameInput || !profileMessage) {
        console.error("Profile page DOM elements (for profile data) missing! Check IDs.");
        if (profileLoadingMessage) profileLoadingMessage.style.display = 'none';
        if (profileLoginMessage) {
            profileLoginMessage.style.display = 'block';
            profileLoginMessage.innerHTML = '<p>Error loading page elements. Please try again later.</p>';
        }
        return;
    }

    profileLoadingMessage.style.display = 'block';
    profileContent.style.display = 'none';
    profileLoginMessage.style.display = 'none';
    if (profileMessage) profileMessage.textContent = ''; // Pulisce messaggi precedenti
    profileAvatarImg.src = '';
    profileAvatarImg.alt = 'Loading avatar...';
    profileAvatarImg.style.backgroundColor = '#eee';
    profileEmailSpan.textContent = 'Loading...';
    currentNicknameSpan.textContent = 'Loading...';
    profileNationalitySpan.textContent = 'Loading...';
    profileNicknameInput.value = '';

    const userProfileRef = doc(db, "userProfiles", uid);
    try {
        const docSnap = await getDoc(userProfileRef);
        if (docSnap.exists()) {
            currentUserProfile = docSnap.data();
            console.log("profile.js - Profile data found:", currentUserProfile);

            profileEmailSpan.textContent = currentUserProfile.email || 'N/A';
            currentNicknameSpan.textContent = currentUserProfile.nickname || 'Non impostato';
            profileNicknameInput.value = currentUserProfile.nickname || '';

            if (profileNationalitySpan) {
                if (currentUserProfile.nationalityCode && currentUserProfile.nationalityCode !== "OTHER") {
                    const countryCodeOriginal = currentUserProfile.nationalityCode.toUpperCase();
                    const countryCodeForLibrary = countryCodeOriginal.toLowerCase();
                    profileNationalitySpan.innerHTML = '';
                    const flagIconSpan = document.createElement('span');
                    flagIconSpan.classList.add('fi', `fi-${countryCodeForLibrary}`);
                    flagIconSpan.style.marginRight = '8px';
                    const codeTextNode = document.createTextNode(countryCodeOriginal);
                    profileNationalitySpan.appendChild(flagIconSpan);
                    profileNationalitySpan.appendChild(codeTextNode);
                } else if (currentUserProfile.nationalityCode === "OTHER") {
                    profileNationalitySpan.textContent = 'Altro / Non specificato';
                } else {
                    profileNationalitySpan.textContent = 'Non specificata';
                }
            }

            if (profileAvatarImg) {
                const seedForAvatar = uid;
                profileAvatarImg.src = generateBlockieAvatar(seedForAvatar, 80, { size: 8 });
                profileAvatarImg.alt = `${currentUserProfile.nickname || 'User'}'s Blockie Avatar`;
                profileAvatarImg.style.backgroundColor = 'transparent';
                profileAvatarImg.onerror = () => {
                    profileAvatarImg.style.backgroundColor = '#eee';
                    profileAvatarImg.alt = 'Error loading avatar';
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

async function handleProfileUpdate(event) {
    event.preventDefault();
    if (!currentUser) {
        if (profileMessage) {
            profileMessage.textContent = 'Errore: Utente non autenticato.';
            profileMessage.style.color = 'red';
        }
        return;
    }

    if (!profileNicknameInput || !saveProfileBtn || !profileMessage || !currentNicknameSpan) {
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
        profileMessage.textContent = 'Profilo aggiornato con successo!';
        profileMessage.style.color = 'green';
        currentNicknameSpan.textContent = newNickname;
        if (currentUserProfile) currentUserProfile.nickname = newNickname;

        // Aggiorna anche il nome visualizzato nell'header, se presente
        const userDisplayNameElement = document.getElementById('userDisplayName');
        if (userDisplayNameElement) {
            userDisplayNameElement.textContent = `Ciao, ${newNickname}`;
        }
        const headerUserAvatarElement = document.getElementById('headerUserAvatar');
        if (headerUserAvatarElement) {
            headerUserAvatarElement.alt = `Avatar di ${newNickname}`;
        }

    } catch (error) {
        console.error("profile.js - Error updating profile:", error);
        profileMessage.textContent = `Errore aggiornamento profilo: ${error.message}`;
        profileMessage.style.color = 'red';
        if (error.code === 'permission-denied') {
            profileMessage.textContent += ' (Controlla le Regole Firestore)';
        }
    } finally {
        if (saveProfileBtn) {
            saveProfileBtn.disabled = false;
            saveProfileBtn.textContent = 'Salva Modifiche';
        }
    }
}


// --- NUOVE FUNZIONI per "I Miei Articoli" ---

/**
 * Formatta un Timestamp di Firestore per la visualizzazione.
 * @param {Timestamp} firebaseTimestamp - L'oggetto Timestamp di Firestore.
 * @returns {string} Data formattata o 'N/A'.
 */
function formatMyArticleTimestamp(firebaseTimestamp) {
    if (firebaseTimestamp && typeof firebaseTimestamp.toDate === 'function') {
        return firebaseTimestamp.toDate().toLocaleDateString('it-IT', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }
    return 'N/A';
}

/**
 * Gestisce l'eliminazione di una bozza.
 * @param {string} articleId - L'ID dell'articolo bozza da eliminare.
 * @param {string} articleTitle - Il titolo dell'articolo per il messaggio di conferma.
 */
async function handleDeleteDraft(articleId, articleTitle) {
    if (!confirm(`Sei sicuro di voler eliminare la bozza "${articleTitle || 'Senza Titolo'}"? L'azione è irreversibile.`)) {
        return;
    }
    try {
        const articleRef = doc(db, "articles", articleId);
        await deleteDoc(articleRef);
        alert(`Bozza "${articleTitle || 'Senza Titolo'}" eliminata con successo.`);
        if (currentUser) {
            loadMyArticles(currentUser.uid); // Ricarica la lista delle bozze
        }
    } catch (error) {
        console.error("Errore durante l'eliminazione della bozza:", error);
        alert("Si è verificato un errore durante l'eliminazione della bozza. Riprova.");
    }
}

/**
 * Carica e visualizza gli articoli dell'utente loggato.
 * @param {string} userId - L'UID dell'utente loggato.
 */
async function loadMyArticles(userId) {
    if (!userId) return;

    if (myArticlesSection) myArticlesSection.style.display = 'block';

    // Caricamento Bozze
    if (myDraftArticlesListDiv && myDraftsLoadingMessage) {
        myDraftsLoadingMessage.style.display = 'block';
        myDraftArticlesListDiv.innerHTML = '';

        try {
            const articlesRef = collection(db, "articles");
            const q = query(articlesRef, where("authorId", "==", userId), where("status", "==", "draft"), orderBy("updatedAt", "desc"));
            const querySnapshot = await getDocs(q);

            myDraftsLoadingMessage.style.display = 'none';

            if (querySnapshot.empty) {
                myDraftArticlesListDiv.innerHTML = '<p>Nessuna bozza trovata.</p>';
            } else {
                querySnapshot.forEach((docSnapshot) => {
                    const article = docSnapshot.data();
                    const articleId = docSnapshot.id;

                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'my-article-item';
                    itemDiv.setAttribute('data-id', articleId);

                    const titleEl = document.createElement('strong');
                    titleEl.textContent = article.title || "Bozza senza titolo";

                    const statusEl = document.createElement('span');
                    statusEl.className = 'my-article-status-draft';
                    statusEl.textContent = "Bozza";
                    
                    const dateEl = document.createElement('small');
                    dateEl.textContent = ` - Ultima modifica: ${formatMyArticleTimestamp(article.updatedAt)}`;

                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'my-article-actions';

                    const editButton = document.createElement('a');
                    editButton.href = `submit-article.html?draftId=${articleId}`;
                    editButton.className = 'game-button my-article-button';
                    editButton.textContent = 'Modifica Bozza';
                    
                    const deleteButton = document.createElement('button');
                    deleteButton.className = 'game-button my-article-button-delete';
                    deleteButton.textContent = 'Elimina';
                    deleteButton.addEventListener('click', () => handleDeleteDraft(articleId, article.title));

                    actionsDiv.appendChild(editButton);
                    actionsDiv.appendChild(deleteButton);

                    itemDiv.appendChild(titleEl);
                    itemDiv.appendChild(document.createTextNode(" ("));
                    itemDiv.appendChild(statusEl);
                    itemDiv.appendChild(document.createTextNode(")"));
                    itemDiv.appendChild(dateEl);
                    itemDiv.appendChild(actionsDiv);
                    myDraftArticlesListDiv.appendChild(itemDiv);
                });
            }
        } catch (error) {
            console.error("Errore caricamento bozze utente:", error);
            myDraftsLoadingMessage.style.display = 'none';
            if (myDraftArticlesListDiv) myDraftArticlesListDiv.innerHTML = '<p>Errore nel caricamento delle tue bozze. Riprova più tardi.</p>';
        }
    }

    // Implementare qui il caricamento per Pending, Published, Rejected se necessario
    // const myPendingArticlesListDiv = document.getElementById('myPendingArticlesList');
    // const myPublishedArticlesListDiv = document.getElementById('myPublishedArticlesList');
    // const myRejectedArticlesListDiv = document.getElementById('myRejectedArticlesList');
    // ... logica simile a quella delle bozze, ma con filtri di stato diversi e azioni diverse.
}


// --- INIZIALIZZAZIONE (esistente, modificata) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("profile.js - User is logged in:", user.uid);
        currentUser = user;
        if (profileContent && profileLoadingMessage && profileLoginMessage) {
            loadProfileData(user.uid);
            if (myArticlesSection) { // Controlla che la sezione esista prima di tentare di manipolarla
                 myArticlesSection.style.display = 'block';
                 loadMyArticles(user.uid);
            }
        } else {
            console.error("profile.js - Auth listener: Elementi UI principali del profilo non trovati.");
        }
    } else {
        console.log("profile.js - User is signed out.");
        currentUser = null;
        currentUserProfile = null;
        if (profileContent) profileContent.style.display = 'none';
        if (profileLoadingMessage) profileLoadingMessage.style.display = 'none';
        if (profileLoginMessage) profileLoginMessage.style.display = 'block';
        if (myArticlesSection) { // Controlla che la sezione esista
            myArticlesSection.style.display = 'none';
        }
        if (myDraftArticlesListDiv) myDraftArticlesListDiv.innerHTML = ''; // Pulisci la lista se l'utente fa logout
    }
});

if (profileUpdateForm) {
    profileUpdateForm.addEventListener('submit', handleProfileUpdate);
} else {
    console.warn("profile.js - Form profileUpdateForm non trovato.");
}