// js/profile.js
import { db, auth, generateBlockieAvatar } from './main.js';
import {
    doc,
    getDoc,
    updateDoc, // Ri-aggiunto per aggiornare lo statusMessage
    collection,
    query,
    where,
    getDocs,
    orderBy,
    deleteDoc,
    serverTimestamp, // Necessario per updatedAt
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged, sendEmailVerification } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { showToast } from './toastNotifications.js';

// --- RIFERIMENTI DOM (Aggiornati) ---
const profileContent = document.getElementById('profileContent');
const profileDetailsDisplay = document.getElementById('profileDetailsDisplay');
const profileAvatarImg = document.getElementById('profileAvatar');
const profileEmailSpan = document.getElementById('profileEmail');
const currentNicknameSpan = document.getElementById('currentNickname');
const profileNationalitySpan = document.getElementById('profileNationality');
const profileLoadingMessage = document.getElementById('profileLoadingMessage');
const profileLoginMessage = document.getElementById('profileLoginMessage');

// Riferimenti DOM per il banner di verifica email
const emailVerificationBanner = document.getElementById('emailVerificationBanner');
const resendVerificationEmailBtn = document.getElementById('resendVerificationEmailBtn');
const resendEmailMessage = document.getElementById('resendEmailMessage');

// NUOVI RIFERIMENTI DOM per lo Stato d'Animo
const statusMessageSection = document.getElementById('statusMessageSection');
const statusMessageDisplay = document.getElementById('statusMessageDisplay');
const updateStatusForm = document.getElementById('updateStatusForm');
const statusMessageInput = document.getElementById('statusMessageInput');
const updateStatusBtn = document.getElementById('updateStatusBtn'); // Se si vuole manipolare direttamente il bottone
const statusUpdateMessage = document.getElementById('statusUpdateMessage');


// --- RIFERIMENTI DOM per "I Miei Articoli" (esistenti) ---
const myArticlesSection = document.getElementById('myArticlesSection');
const myDraftsLoadingMessage = document.getElementById('myDraftsLoadingMessage');
const myDraftArticlesListDiv = document.getElementById('myDraftArticlesList');
const myPendingLoadingMessage = document.getElementById('myPendingLoadingMessage');
const myPendingArticlesListDiv = document.getElementById('myPendingArticlesList');
const myPublishedLoadingMessage = document.getElementById('myPublishedLoadingMessage');
const myPublishedArticlesListDiv = document.getElementById('myPublishedArticlesList');
const myRejectedLoadingMessage = document.getElementById('myRejectedLoadingMessage');
const myRejectedArticlesListDiv = document.getElementById('myRejectedArticlesList');

let currentUserForProfilePage = null;
let currentUserProfileData = null;

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
        !statusMessageSection || // NUOVO: Controllo per la nuova sezione
        !statusMessageDisplay
    ) {
        console.error('Profile page DOM elements missing! Check IDs.');
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
    statusMessageSection.style.display = 'none'; // Nascondi la sezione stato inizialmente

    profileAvatarImg.src = '';
    profileAvatarImg.alt = 'Loading avatar...';
    profileAvatarImg.style.backgroundColor = '#eee';
    profileEmailSpan.textContent = 'Caricamento...';
    currentNicknameSpan.textContent = 'Caricamento...';
    profileNationalitySpan.textContent = 'Caricamento...';
    statusMessageDisplay.textContent = 'Caricamento stato...'; // Testo placeholder
    if(statusMessageInput) statusMessageInput.value = '';
    if(statusUpdateMessage) statusUpdateMessage.textContent = '';


    const userProfileRef = doc(db, 'userProfiles', uid);
    try {
        const docSnap = await getDoc(userProfileRef);
        if (docSnap.exists()) {
            currentUserProfileData = docSnap.data();
            profileEmailSpan.textContent = currentUserProfileData.email || 'N/A';
            currentNicknameSpan.textContent = currentUserProfileData.nickname || 'Non impostato';

            if (profileNationalitySpan) {
                if (currentUserProfileData.nationalityCode && currentUserProfileData.nationalityCode !== 'OTHER') {
                    const countryCodeOriginal = currentUserProfileData.nationalityCode.toUpperCase();
                    const countryCodeForLibrary = countryCodeOriginal.toLowerCase();
                    profileNationalitySpan.innerHTML = '';
                    const flagIconSpan = document.createElement('span');
                    flagIconSpan.classList.add('fi', `fi-${countryCodeForLibrary}`);
                    flagIconSpan.style.marginRight = '8px';
                    const codeTextNode = document.createTextNode(countryCodeOriginal);
                    profileNationalitySpan.appendChild(flagIconSpan);
                    profileNationalitySpan.appendChild(codeTextNode);
                } else if (currentUserProfileData.nationalityCode === 'OTHER') {
                    profileNationalitySpan.textContent = 'Altro / Non specificato';
                } else {
                    profileNationalitySpan.textContent = 'Non specificata';
                }
            }
            if (profileAvatarImg) {
                const seedForAvatar = uid;
                profileAvatarImg.src = generateBlockieAvatar(seedForAvatar, 80, { size: 8 });
                profileAvatarImg.alt = `${currentUserProfileData.nickname || 'User'}'s Blockie Avatar`;
                profileAvatarImg.style.backgroundColor = 'transparent';
            }

            // NUOVO: Carica e visualizza lo statusMessage
            if (statusMessageDisplay) {
                statusMessageDisplay.textContent = currentUserProfileData.statusMessage || ''; // Mostra stringa vuota se non c'è, lo stile CSS gestirà il placeholder
            }
            if (statusMessageInput && currentUserForProfilePage && currentUserForProfilePage.uid === uid) { // Pre-compila l'input solo se è il proprio profilo
                statusMessageInput.value = currentUserProfileData.statusMessage || '';
            }


            // Gestione banner verifica email e visibilità sezione stato
            if (currentUserForProfilePage && currentUserForProfilePage.uid === uid) { // Logica solo per il proprietario del profilo
                if (emailVerificationBanner) {
                    emailVerificationBanner.style.display = !currentUserForProfilePage.emailVerified ? 'block' : 'none';
                    if (resendEmailMessage) resendEmailMessage.textContent = '';
                }
                if (statusMessageSection) { // Mostra la sezione stato
                    statusMessageSection.style.display = 'block';
                }
            } else { // Se si visualizza il profilo di un altro utente
                if (emailVerificationBanner) emailVerificationBanner.style.display = 'none'; // Nascondi banner verifica
                if (statusMessageSection) { // Mostra la sezione stato ma senza il form di modifica
                    statusMessageSection.style.display = 'block';
                    if(updateStatusForm) updateStatusForm.style.display = 'none';
                }
            }

            profileLoadingMessage.style.display = 'none';
            profileContent.style.display = 'block';
        } else {
            // ... (gestione profilo non trovato come prima) ...
            console.warn('profile.js - No profile document found for user:', uid);
            profileLoadingMessage.style.display = 'none';
            profileLoginMessage.style.display = 'block';
            profileLoginMessage.innerHTML = '<p>Errore: Impossibile trovare i dati del profilo.</p>';
            if (emailVerificationBanner) emailVerificationBanner.style.display = 'none';
            if (statusMessageSection) statusMessageSection.style.display = 'none';
        }
    } catch (error) {
        // ... (gestione errore caricamento come prima) ...
        console.error('profile.js - Error loading profile data:', error);
        profileLoadingMessage.style.display = 'none';
        profileLoginMessage.style.display = 'block';
        profileLoginMessage.innerHTML = `<p>Errore caricamento profilo: ${error.message}</p>`;
        if (emailVerificationBanner) emailVerificationBanner.style.display = 'none';
        if (statusMessageSection) statusMessageSection.style.display = 'none';
    }
}

// NUOVA FUNZIONE: handleStatusMessageUpdate
async function handleStatusMessageUpdate(event) {
    event.preventDefault();
    if (!currentUserForProfilePage) {
        showToast('Devi essere loggato per aggiornare il tuo stato.', 'error');
        return;
    }
    if (!statusMessageInput || !updateStatusBtn || !statusUpdateMessage || !statusMessageDisplay) {
        console.error('Elementi DOM per aggiornamento stato mancanti.');
        showToast('Errore interfaccia utente. Impossibile aggiornare lo stato.', 'error');
        return;
    }

    const newStatus = statusMessageInput.value.trim();
    // Validazione (max 150 caratteri come da piano, ma il campo HTML ha già maxlength)
    if (newStatus.length > 150) { // Doppia sicurezza
        statusUpdateMessage.textContent = 'Lo stato non può superare i 150 caratteri.';
        statusUpdateMessage.style.color = 'red';
        showToast('Stato troppo lungo (max 150 caratteri).', 'warning');
        return;
    }

    // Non fare nulla se lo stato non è cambiato
    if (currentUserProfileData && newStatus === (currentUserProfileData.statusMessage || '')) {
        statusUpdateMessage.textContent = 'Nessuna modifica rilevata.';
        statusUpdateMessage.style.color = 'orange';
        showToast('Nessuna modifica allo stato.', 'info');
        return;
    }

    updateStatusBtn.disabled = true;
    updateStatusBtn.textContent = 'Aggiornamento...';
    statusUpdateMessage.textContent = '';

    const userProfileRef = doc(db, 'userProfiles', currentUserForProfilePage.uid);
    try {
        await updateDoc(userProfileRef, {
        statusMessage: newStatus,
        updatedAt: serverTimestamp(), // <-- AGGIUNGI QUESTO
    });
    showToast('Stato d\'animo aggiornato con successo!', 'success');
        statusMessageDisplay.textContent = newStatus; // Aggiorna visualizzazione
        if (currentUserProfileData) currentUserProfileData.statusMessage = newStatus; // Aggiorna dati locali
        statusUpdateMessage.textContent = 'Stato aggiornato!';
        statusUpdateMessage.style.color = 'green';
        setTimeout(() => { if(statusUpdateMessage) statusUpdateMessage.textContent = ''; }, 3000);

    } catch (error) {
        console.error('Errore aggiornamento stato d\'animo:', error);
        statusUpdateMessage.textContent = `Errore: ${error.message}`;
        statusUpdateMessage.style.color = 'red';
        showToast('Errore durante l\'aggiornamento dello stato.', 'error');
    } finally {
        if (updateStatusBtn) {
            updateStatusBtn.disabled = false;
            updateStatusBtn.textContent = 'Aggiorna';
        }
    }
}


// --- Funzioni per "I Miei Articoli" (esistenti) ---
// ... (codice loadMyArticles, createMyArticleItemElement, handleDeleteArticle, formatMyArticleTimestamp come prima) ...
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
        showToast(
            `${statusText.charAt(0).toUpperCase() + statusText.slice(1)} "${
                articleTitle || 'Senza Titolo'
            }" eliminato con successo.`,
            'success'
        );
        if (currentUserForProfilePage) {
            loadMyArticles(currentUserForProfilePage.uid);
        }
    } catch (error) {
        console.error(`Errore durante l'eliminazione di ${statusText}:`, error);
        showToast(`Si è verificato un errore durante l'eliminazione. Riprova.`, 'error');
    }
}

function createMyArticleItemElement(article, articleId) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'my-article-profile-card';
    cardDiv.setAttribute('data-id', articleId);

    const titleEl = document.createElement('h4');
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
    statusEl.className = `my-article-card-status status-${article.status || 'unknown'}`;
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
        const reasonEl = document.createElement('p');
        reasonEl.className = 'my-article-card-rejection-reason';
        reasonEl.innerHTML = `<strong>Motivo:</strong> ${article.rejectionReason}`;
        cardDiv.appendChild(reasonEl);
    }

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'my-article-card-actions';

    if (article.status === 'draft') {
        const editButton = document.createElement('a');
        editButton.href = `submit-article.html?draftId=${articleId}`;
        editButton.className = 'game-button my-article-action-button';
        editButton.textContent = 'Modifica';
        actionsDiv.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'game-button my-article-action-button delete';
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
        const resubmitBasedOnButton = document.createElement('a');
        resubmitBasedOnButton.href = `submit-article.html?rejectedArticleId=${articleId}`;
        resubmitBasedOnButton.className = 'game-button my-article-action-button';
        resubmitBasedOnButton.textContent = 'Crea da Questo Articolo';
        resubmitBasedOnButton.title =
            'Crea una nuova sottomissione pre-compilata con il contenuto di questo articolo respinto';
        actionsDiv.appendChild(resubmitBasedOnButton);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'game-button my-article-action-button delete';
        deleteButton.textContent = 'Elimina Respinto';
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
        if (S.listDiv && S.loadingMsg) {
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
        }
    }
}

// --- INIZIALIZZAZIONE ---
onAuthStateChanged(auth, (user) => {
    currentUserForProfilePage = user;
    if (user) {
        if (profileContent && profileLoadingMessage && profileLoginMessage) {
            loadProfileData(user.uid);
            if (myArticlesSection) {
                myArticlesSection.style.display = 'block';
                loadMyArticles(user.uid);
            }
        } else {
            console.error('profile.js - Auth listener: Elementi UI principali del profilo non trovati.');
        }
    } else {
        // ... (logica per utente non loggato come prima) ...
        currentUserProfileData = null;
        if (profileContent) profileContent.style.display = 'none';
        if (profileLoadingMessage) profileLoadingMessage.style.display = 'none';
        if (profileLoginMessage) profileLoginMessage.style.display = 'block';
        if (emailVerificationBanner) emailVerificationBanner.style.display = 'none';
        if (statusMessageSection) statusMessageSection.style.display = 'none'; // Nascondi sezione stato se non loggato


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

// NUOVO: Event listener per il form di aggiornamento dello stato
if (updateStatusForm) {
    updateStatusForm.addEventListener('submit', handleStatusMessageUpdate);
} else {
    // Questo warning potrebbe apparire se la pagina viene caricata da un utente non proprietario del profilo,
    // dove il form potrebbe non essere visibile/necessario. Lo rendiamo meno invasivo.
    // console.debug('profile.js - Form updateStatusForm non trovato (potrebbe essere normale se si visualizza il profilo di un altro utente).');
}


// Event listener per il pulsante "Invia di nuovo email di verifica" (esistente)
if (resendVerificationEmailBtn) {
    resendVerificationEmailBtn.addEventListener('click', async () => {
        if (currentUserForProfilePage && !currentUserForProfilePage.emailVerified) {
            try {
                resendVerificationEmailBtn.disabled = true;
                resendVerificationEmailBtn.textContent = 'Invio...';
                if (resendEmailMessage) resendEmailMessage.textContent = '';

                await sendEmailVerification(currentUserForProfilePage);
                showToast('Email di verifica inviata nuovamente! Controlla la tua casella di posta.', 'success', 6000);
                if (resendEmailMessage) {
                    resendEmailMessage.textContent = 'Email inviata. Potrebbe volerci qualche minuto.';
                    resendEmailMessage.style.color = 'green';
                }
            } catch (error) {
                console.error('Errore invio nuova email di verifica:', error);
                showToast('Errore durante l\'invio dell\'email di verifica. Riprova più tardi.', 'error');
                if (resendEmailMessage) {
                    resendEmailMessage.textContent = `Errore: ${error.message}`;
                    resendEmailMessage.style.color = 'red';
                }
            } finally {
                setTimeout(() => {
                    if (resendVerificationEmailBtn) {
                        resendVerificationEmailBtn.disabled = false;
                        resendVerificationEmailBtn.textContent = 'Invia di nuovo email di verifica';
                    }
                }, 30000);
            }
        } else if (currentUserForProfilePage && currentUserForProfilePage.emailVerified) {
            showToast('La tua email è già verificata.', 'info');
            if (emailVerificationBanner) emailVerificationBanner.style.display = 'none';
        }
    });
}
