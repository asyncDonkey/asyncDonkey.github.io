// js/profile.js

import { db, auth, generateBlockieAvatar } from './main.js';
import {
    doc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    deleteDoc,
    Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { showToast } from './toastNotifications.js';

// --- DEFINIZIONE COSTANTI ELEMENTI DOM (ESISTENTI) ---
const profileContent = document.getElementById('profileContent');
const profileDetailsDisplay = document.getElementById('profileDetailsDisplay');
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

// --- RIFERIMENTI DOM per "I Miei Articoli" ---
const myArticlesSection = document.getElementById('myArticlesSection');

// Bozze
const myDraftsLoadingMessage = document.getElementById('myDraftsLoadingMessage');
const myDraftArticlesListDiv = document.getElementById('myDraftArticlesList');

// In Revisione
const myPendingLoadingMessage = document.getElementById('myPendingLoadingMessage');
const myPendingArticlesListDiv = document.getElementById('myPendingArticlesList');

// Pubblicati
const myPublishedLoadingMessage = document.getElementById('myPublishedLoadingMessage');
const myPublishedArticlesListDiv = document.getElementById('myPublishedArticlesList');

// Respinti
const myRejectedLoadingMessage = document.getElementById('myRejectedLoadingMessage');
const myRejectedArticlesListDiv = document.getElementById('myRejectedArticlesList');

let currentUser = null;
let currentUserProfile = null;

// --- Funzioni Esistenti (loadProfileData, handleProfileUpdate) ---
async function loadProfileData(uid) {
    console.log('profile.js - Loading profile for UID:', uid);
    if (
        !profileContent ||
        !profileLoadingMessage ||
        !profileLoginMessage ||
        !profileAvatarImg ||
        !profileNationalitySpan ||
        !profileEmailSpan ||
        !currentNicknameSpan ||
        !profileNicknameInput ||
        !profileMessage
    ) {
        console.error('Profile page DOM elements (for profile data) missing! Check IDs.');
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
    if (profileMessage) profileMessage.textContent = '';
    profileAvatarImg.src = '';
    profileAvatarImg.alt = 'Loading avatar...';
    profileAvatarImg.style.backgroundColor = '#eee';
    profileEmailSpan.textContent = 'Loading...';
    currentNicknameSpan.textContent = 'Loading...';
    profileNationalitySpan.textContent = 'Loading...';
    profileNicknameInput.value = '';

    const userProfileRef = doc(db, 'userProfiles', uid);
    try {
        const docSnap = await getDoc(userProfileRef);
        if (docSnap.exists()) {
            currentUserProfile = docSnap.data();
            profileEmailSpan.textContent = currentUserProfile.email || 'N/A';
            currentNicknameSpan.textContent = currentUserProfile.nickname || 'Non impostato';
            profileNicknameInput.value = currentUserProfile.nickname || '';
            if (profileNationalitySpan) {
                if (currentUserProfile.nationalityCode && currentUserProfile.nationalityCode !== 'OTHER') {
                    const countryCodeOriginal = currentUserProfile.nationalityCode.toUpperCase();
                    const countryCodeForLibrary = countryCodeOriginal.toLowerCase();
                    profileNationalitySpan.innerHTML = '';
                    const flagIconSpan = document.createElement('span');
                    flagIconSpan.classList.add('fi', `fi-${countryCodeForLibrary}`);
                    flagIconSpan.style.marginRight = '8px';
                    const codeTextNode = document.createTextNode(countryCodeOriginal);
                    profileNationalitySpan.appendChild(flagIconSpan);
                    profileNationalitySpan.appendChild(codeTextNode);
                } else if (currentUserProfile.nationalityCode === 'OTHER') {
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
            console.warn('profile.js - No profile document found for user:', uid);
            profileLoadingMessage.style.display = 'none';
            profileLoginMessage.style.display = 'block';
            profileLoginMessage.innerHTML = '<p>Error: Could not find profile data.</p>';
        }
    } catch (error) {
        console.error('profile.js - Error loading profile data:', error);
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
        console.error("profile.js - Elementi DOM per l'aggiornamento del profilo mancanti.");
        showToast("Errore nell'interfaccia utente. Impossibile salvare.");
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
    const userProfileRef = doc(db, 'userProfiles', currentUser.uid);
    const dataToUpdate = { nickname: newNickname };
    try {
        await updateDoc(userProfileRef, dataToUpdate);
        showToast('Profilo aggiornato con successo!', 'success'); // Esempio chiamata
        currentNicknameSpan.textContent = newNickname;
        if (currentUserProfile) currentUserProfile.nickname = newNickname;
        const userDisplayNameElement = document.getElementById('userDisplayName');
        if (userDisplayNameElement) userDisplayNameElement.textContent = `Ciao, ${newNickname}`;
        const headerUserAvatarElement = document.getElementById('headerUserAvatar');
        if (headerUserAvatarElement) headerUserAvatarElement.alt = `Avatar di ${newNickname}`;
    } catch (error) {
        console.error('profile.js - Error updating profile:', error);
        profileMessage.textContent = `Errore aggiornamento profilo: ${error.message}`;
        profileMessage.style.color = 'red';
        if (error.code === 'permission-denied') {
            //showToast(friendlyErrorMessage, ' (Controlla le Regole Firestore)'); // Esempio chiamata
        }
    } finally {
        if (saveProfileBtn) {
            saveProfileBtn.disabled = false;
            saveProfileBtn.textContent = 'Salva Modifiche';
        }
    }
}

// --- Funzioni per "I Miei Articoli" ---

function formatMyArticleTimestamp(firebaseTimestamp) {
    if (firebaseTimestamp && typeof firebaseTimestamp.toDate === 'function') {
        return firebaseTimestamp.toDate().toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }
    return 'N/A';
}

async function handleDeleteArticle(articleId, articleTitle, currentStatus) {
    const statusText = currentStatus === 'draft' ? 'bozza' : 'articolo respinto';
    if (
        !confirm(
            `Sei sicuro di voler eliminare ${statusText} "${articleTitle || 'Senza Titolo'}"? L'azione è irreversibile.`
        )
    ) {
        return;
    }
    try {
        const articleRef = doc(db, 'articles', articleId);
        await deleteDoc(articleRef);
        // alert(`${statusText.charAt(0).toUpperCase() + statusText.slice(1)} "${articleTitle || 'Senza Titolo'}" eliminato con successo.`); // VECCHIO
        showToast(
            `${statusText.charAt(0).toUpperCase() + statusText.slice(1)} "${articleTitle || 'Senza Titolo'}" eliminato con successo.`,
            'success'
        ); // NUOVO
        if (currentUser) {
            loadMyArticles(currentUser.uid);
        }
    } catch (error) {
        console.error(`Errore durante l'eliminazione di ${statusText}:`, error); // Log dell'errore
        // alert(`Si è verificato un errore durante l'eliminazione. Riprova.`); // VECCHIO
        showToast(`Si è verificato un errore durante l'eliminazione. Riprova.`, 'error'); // NUOVO
    }
}

/**
 * Crea un elemento DOM CARD per un articolo dell'utente.
 * @param {object} article - L'oggetto dati dell'articolo.
 * @param {string} articleId - L'ID dell'articolo.
 * @returns {HTMLElement} L'elemento div (card) per l'articolo.
 */
function createMyArticleItemElement(article, articleId) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'my-article-profile-card'; // Nuova classe per la card
    cardDiv.setAttribute('data-id', articleId);

    const titleEl = document.createElement('h4'); // Usiamo h4 per il titolo della card
    titleEl.className = 'my-article-card-title';
    titleEl.textContent = article.title || `Articolo senza titolo (ID: ${articleId.substring(0, 6)}...)`;
    cardDiv.appendChild(titleEl);

    const metaInfoDiv = document.createElement('div');
    metaInfoDiv.className = 'my-article-card-meta';

    const statusTextMap = {
        draft: 'Bozza',
        pendingReview: 'In Revisione',
        published: 'Pubblicato',
        rejected: 'Respinto',
    };
    const statusDisplay = statusTextMap[article.status] || article.status || 'Stato Sconosciuto';
    const statusEl = document.createElement('span');
    statusEl.className = `my-article-card-status status-${article.status || 'unknown'}`; // Classe specifica per lo stato + generica
    statusEl.textContent = statusDisplay;
    metaInfoDiv.appendChild(statusEl);

    const dateEl = document.createElement('span');
    dateEl.className = 'my-article-card-date';
    const dateToDisplay = article.status === 'published' ? article.publishedAt : article.updatedAt;
    const datePrefix = article.status === 'published' ? 'Pubblicato: ' : 'Modificato: ';
    dateEl.textContent = `${datePrefix}${formatMyArticleTimestamp(dateToDisplay)}`;
    metaInfoDiv.appendChild(dateEl);
    cardDiv.appendChild(metaInfoDiv);

    if (article.status === 'rejected' && article.rejectionReason) {
        const reasonEl = document.createElement('p'); // Usiamo <p> per il motivo
        reasonEl.className = 'my-article-card-rejection-reason';
        reasonEl.innerHTML = `<strong>Motivo:</strong> ${article.rejectionReason}`; // Usiamo innerHTML per il bold
        cardDiv.appendChild(reasonEl);
    }

    // Snippet (Opzionale, potremmo aggiungerlo se c'è spazio nella card)
    // const snippetEl = document.createElement('p');
    // snippetEl.className = 'my-article-card-snippet';
    // snippetEl.textContent = (article.snippet || article.contentMarkdown.substring(0, 70) + "...") ; // Esempio
    // cardDiv.appendChild(snippetEl);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'my-article-card-actions';

    // Azioni specifiche per stato (logica esistente, adattata per card)
    if (article.status === 'draft') {
        const editButton = document.createElement('a');
        editButton.href = `submit-article.html?draftId=${articleId}`;
        editButton.className = 'game-button my-article-action-button'; // Classe per bottoni azione card
        editButton.textContent = 'Modifica';
        actionsDiv.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'game-button my-article-action-button delete'; // Classe specifica per delete
        deleteButton.textContent = 'Elimina';
        deleteButton.addEventListener('click', () => handleDeleteArticle(articleId, article.title, 'draft'));
        actionsDiv.appendChild(deleteButton);
    } else if (article.status === 'pendingReview') {
        const previewButton = document.createElement('a');
        previewButton.href = `view-article.html?id=${articleId}&preview=true`;
        previewButton.target = '_blank';
        previewButton.className = 'game-button my-article-action-button';
        previewButton.textContent = 'Anteprima';
        actionsDiv.appendChild(previewButton);
    } else if (article.status === 'published') {
        const viewButton = document.createElement('a');
        viewButton.href = `view-article.html?id=${articleId}`;
        viewButton.target = '_blank';
        viewButton.className = 'game-button my-article-action-button';
        viewButton.textContent = 'Visualizza';
        actionsDiv.appendChild(viewButton);
    } else if (article.status === 'rejected') {
        const resubmitButton = document.createElement('a');
        resubmitButton.href = `submit-article.html`;
        resubmitButton.className = 'game-button my-article-action-button';
        resubmitButton.textContent = 'Nuova Sottomissione';
        resubmitButton.title = 'Crea un nuovo articolo (puoi copiare il contenuto da quello respinto)';
        actionsDiv.appendChild(resubmitButton);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'game-button my-article-action-button delete';
        deleteButton.textContent = 'Elimina';
        deleteButton.addEventListener('click', () => handleDeleteArticle(articleId, article.title, 'rejected'));
        actionsDiv.appendChild(deleteButton);
    }

    if (actionsDiv.hasChildNodes()) {
        cardDiv.appendChild(actionsDiv);
    }
    return cardDiv;
}

async function loadMyArticles(userId) {
    if (!userId) return;

    if (myArticlesSection) myArticlesSection.style.display = 'block';

    const articleStatusesToLoad = [
        { status: 'draft', listDiv: myDraftArticlesListDiv, loadingMsg: myDraftsLoadingMessage, title: 'Le Mie Bozze' },
        {
            status: 'pendingReview',
            listDiv: myPendingArticlesListDiv,
            loadingMsg: myPendingLoadingMessage,
            title: 'Articoli in Revisione',
        },
        {
            status: 'published',
            listDiv: myPublishedArticlesListDiv,
            loadingMsg: myPublishedLoadingMessage,
            title: 'Articoli Pubblicati',
        },
        {
            status: 'rejected',
            listDiv: myRejectedArticlesListDiv,
            loadingMsg: myRejectedLoadingMessage,
            title: 'Articoli Respinti',
        },
    ];

    for (const S of articleStatusesToLoad) {
        const container = S.listDiv?.parentElement; // es. myDraftArticlesListContainer
        if (container && S.listDiv && S.loadingMsg) {
            S.loadingMsg.style.display = 'block';
            S.listDiv.innerHTML = '';

            try {
                const articlesRef = collection(db, 'articles');
                const q = query(
                    articlesRef,
                    where('authorId', '==', userId),
                    where('status', '==', S.status),
                    orderBy('updatedAt', 'desc')
                );
                const querySnapshot = await getDocs(q);

                S.loadingMsg.style.display = 'none';

                if (querySnapshot.empty) {
                    S.listDiv.innerHTML = `<p>Nessun articolo trovato con stato "${S.title}".</p>`;
                } else {
                    querySnapshot.forEach((docSnapshot) => {
                        const article = docSnapshot.data();
                        const articleId = docSnapshot.id;
                        const articleItemElement = createMyArticleItemElement(article, articleId);
                        S.listDiv.appendChild(articleItemElement);
                    });
                }
            } catch (error) {
                console.error(`Errore caricamento articoli utente con stato ${S.status}:`, error);
                S.loadingMsg.style.display = 'none';
                if (S.listDiv)
                    S.listDiv.innerHTML = `<p>Errore nel caricamento degli articoli "${S.status}". Riprova più tardi.</p>`;
            }
        } else {
            console.warn(
                `Elementi DOM per lo stato "${S.status}" non trovati o non configurati in profile.js. Sezione non caricata.`
            );
            if (S.loadingMsg) S.loadingMsg.style.display = 'none'; // Nascondi comunque il messaggio di caricamento
            if (S.listDiv) S.listDiv.innerHTML = `<p>Sezione articoli "${S.status}" non caricata (errore config).</p>`;
        }
    }
}

// --- INIZIALIZZAZIONE ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        if (profileContent && profileLoadingMessage && profileLoginMessage) {
            loadProfileData(user.uid);
            if (myArticlesSection) {
                myArticlesSection.style.display = 'block';
                loadMyArticles(user.uid);
            } else {
                console.warn('profile.js: Elemento myArticlesSection non trovato nel DOM.');
            }
        } else {
            console.error('profile.js - Auth listener: Elementi UI principali del profilo non trovati.');
        }
    } else {
        currentUser = null;
        currentUserProfile = null;
        if (profileContent) profileContent.style.display = 'none';
        if (profileLoadingMessage) profileLoadingMessage.style.display = 'none';
        if (profileLoginMessage) profileLoginMessage.style.display = 'block';

        if (myArticlesSection) myArticlesSection.style.display = 'none';

        const articleListsToClear = [
            myDraftArticlesListDiv,
            myPendingArticlesListDiv,
            myPublishedArticlesListDiv,
            myRejectedArticlesListDiv,
        ];
        articleListsToClear.forEach((listDiv) => {
            if (listDiv) listDiv.innerHTML = '';
        });
        const loadingMessagesToHide = [
            myDraftsLoadingMessage,
            myPendingLoadingMessage,
            myPublishedLoadingMessage,
            myRejectedLoadingMessage,
        ];
        loadingMessagesToHide.forEach((msgEl) => {
            if (msgEl) msgEl.style.display = 'none';
        });
    }
});

if (profileUpdateForm) {
    profileUpdateForm.addEventListener('submit', handleProfileUpdate);
} else {
    console.warn('profile.js - Form profileUpdateForm non trovato.');
}
