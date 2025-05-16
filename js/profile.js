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
    serverTimestamp,
    arrayUnion,  // NUOVO: Per aggiungere elementi a un array
    arrayRemove, // NUOVO: Per rimuovere elementi da un array
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged, sendEmailVerification } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { showToast } from './toastNotifications.js';

// --- RIFERIMENTI DOM (Esistenti) ---
const profileContent = document.getElementById('profileContent');
const profileDetailsDisplay = document.getElementById('profileDetailsDisplay');
const profileAvatarImg = document.getElementById('profileAvatar');
const profileEmailSpan = document.getElementById('profileEmail');
const currentNicknameSpan = document.getElementById('currentNickname');
const profileNationalitySpan = document.getElementById('profileNationality');
const profileLoadingMessage = document.getElementById('profileLoadingMessage');
const profileLoginMessage = document.getElementById('profileLoginMessage');
const emailVerificationBanner = document.getElementById('emailVerificationBanner');
const resendVerificationEmailBtn = document.getElementById('resendVerificationEmailBtn');
const resendEmailMessage = document.getElementById('resendEmailMessage');
const statusMessageSection = document.getElementById('statusMessageSection');
const statusMessageDisplay = document.getElementById('statusMessageDisplay');
const updateStatusForm = document.getElementById('updateStatusForm');
const statusMessageInput = document.getElementById('statusMessageInput');
const statusUpdateMessage = document.getElementById('statusUpdateMessage');

// --- NUOVI RIFERIMENTI DOM per Link Esterni ---
const externalLinksSection = document.getElementById('externalLinksSection');
const externalLinksListUL = document.getElementById('externalLinksList'); // L'elemento <ul>
const noExternalLinksMessage = document.getElementById('noExternalLinksMessage');
const manageExternalLinksUI = document.getElementById('manageExternalLinksUI');
const toggleAddLinkFormBtn = document.getElementById('toggleAddLinkFormBtn');
const externalLinkFormContainer = document.getElementById('externalLinkFormContainer');
const externalLinkFormTitle = document.getElementById('externalLinkFormTitle');
const externalLinkForm = document.getElementById('externalLinkForm');
const editingLinkIndexInput = document.getElementById('editingLinkIndex'); // Hidden input
const externalLinkTitleInput = document.getElementById('externalLinkTitle');
const externalLinkUrlInput = document.getElementById('externalLinkUrl');
const externalLinkErrorDiv = document.getElementById('externalLinkError');
const saveExternalLinkBtn = document.getElementById('saveExternalLinkBtn');
const cancelEditExtLinkBtn = document.getElementById('cancelEditExtLinkBtn');

// --- RIFERIMENTI DOM per "I Miei Articoli" (esistenti) ---
// ... (come prima)
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
const MAX_EXTERNAL_LINKS = 5; // Come da piano (max 3-5, scegliamo 5)

// --- Funzione per renderizzare i link esterni ---
function renderExternalLinks(linksArray) {
    if (!externalLinksListUL || !noExternalLinksMessage) return;
    externalLinksListUL.innerHTML = ''; // Pulisci la lista esistente

    if (!linksArray || linksArray.length === 0) {
        if (noExternalLinksMessage) noExternalLinksMessage.style.display = 'block';
        return;
    }
    if (noExternalLinksMessage) noExternalLinksMessage.style.display = 'none';

    linksArray.forEach((link, index) => {
        const li = document.createElement('li');

        const linkDisplayDiv = document.createElement('div');
        linkDisplayDiv.className = 'link-display';

        const anchor = document.createElement('a');
        anchor.href = link.url;
        anchor.textContent = link.title || 'Link senza titolo';
        anchor.target = '_blank'; // Apri in una nuova scheda
        anchor.rel = 'noopener noreferrer'; // Per sicurezza
        linkDisplayDiv.appendChild(anchor);

        const urlSpan = document.createElement('span');
        urlSpan.className = 'link-url';
        urlSpan.textContent = `(${link.url})`; // Mostra l'URL per chiarezza
        linkDisplayDiv.appendChild(urlSpan);

        li.appendChild(linkDisplayDiv);

        // Mostra i pulsanti di modifica/eliminazione solo se l'utente sta visualizzando il proprio profilo
        if (currentUserForProfilePage && currentUserForProfilePage.uid === (currentUserProfileData?.userId || currentUserForProfilePage.uid)) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'link-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'game-button edit-link-btn';
            editBtn.textContent = 'Modifica';
            editBtn.type = 'button';
            editBtn.dataset.index = index;
            editBtn.addEventListener('click', () => openExternalLinkFormForEdit(index));
            actionsDiv.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'game-button delete-link-btn';
            deleteBtn.textContent = 'Elimina';
            deleteBtn.type = 'button';
            deleteBtn.dataset.index = index;
            deleteBtn.addEventListener('click', () => handleDeleteExternalLink(index));
            actionsDiv.appendChild(deleteBtn);
            li.appendChild(actionsDiv);
        }
        externalLinksListUL.appendChild(li);
    });
}


async function loadProfileData(uid) {
    console.log('profile.js - Loading profile for UID:', uid);
    // ... (controlli DOM esistenti, inclusi quelli per statusMessageSection) ...
    if (
        !externalLinksSection || !externalLinksListUL || !noExternalLinksMessage ||
        !manageExternalLinksUI || !toggleAddLinkFormBtn || !externalLinkFormContainer
    ) {
        console.error('Elementi DOM per la sezione Link Esterni mancanti!');
        // Potresti voler gestire questo errore in modo più specifico
    }


    profileLoadingMessage.style.display = 'block';
    profileContent.style.display = 'none';
    profileLoginMessage.style.display = 'none';
    statusMessageSection.style.display = 'none';
    if(externalLinksSection) externalLinksSection.style.display = 'none'; // Nascondi sezione link
    if(manageExternalLinksUI) manageExternalLinksUI.style.display = 'none'; // Nascondi UI gestione link


    // ... (reset campi esistenti) ...
    profileAvatarImg.src = '';
    profileAvatarImg.alt = 'Loading avatar...';
    profileAvatarImg.style.backgroundColor = '#eee';
    profileEmailSpan.textContent = 'Caricamento...';
    currentNicknameSpan.textContent = 'Caricamento...';
    profileNationalitySpan.textContent = 'Caricamento...';
    statusMessageDisplay.textContent = 'Caricamento stato...';
    if(statusMessageInput) statusMessageInput.value = '';
    if(statusUpdateMessage) statusUpdateMessage.textContent = '';
    if(externalLinksListUL) externalLinksListUL.innerHTML = ''; // Pulisci lista link
    if(noExternalLinksMessage) noExternalLinksMessage.style.display = 'block';


    const userProfileRef = doc(db, 'userProfiles', uid);
    try {
        const docSnap = await getDoc(userProfileRef);
        if (docSnap.exists()) {
            currentUserProfileData = { ...docSnap.data(), userId: uid }; // Salva anche l'UID nel profilo caricato
            // ... (caricamento email, nickname, nazionalità, avatar, statusMessage come prima) ...
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
             if (statusMessageDisplay) {
                statusMessageDisplay.textContent = currentUserProfileData.statusMessage || '';
            }


            // NUOVO: Carica e visualizza i Link Esterni
            if (externalLinksSection) {
                renderExternalLinks(currentUserProfileData.externalLinks || []);
            }

            // Gestione visibilità sezioni e banner verifica email
            if (currentUserForProfilePage && currentUserForProfilePage.uid === uid) { // È il profilo dell'utente loggato
                if (emailVerificationBanner) {
                    emailVerificationBanner.style.display = !currentUserForProfilePage.emailVerified ? 'block' : 'none';
                    if (resendEmailMessage) resendEmailMessage.textContent = '';
                }
                if (statusMessageSection) statusMessageSection.style.display = 'block';
                if (externalLinksSection) externalLinksSection.style.display = 'block';
                if (manageExternalLinksUI) manageExternalLinksUI.style.display = 'block'; // Mostra UI per aggiungere/modificare link
                if (statusMessageInput) statusMessageInput.value = currentUserProfileData.statusMessage || '';


            } else { // Si visualizza il profilo di un altro utente
                if (emailVerificationBanner) emailVerificationBanner.style.display = 'none';
                if (statusMessageSection) { // Mostra stato, ma non form modifica
                    statusMessageSection.style.display = 'block';
                    if(updateStatusForm) updateStatusForm.style.display = 'none';
                }
                if (externalLinksSection) { // Mostra link, ma non UI gestione
                    externalLinksSection.style.display = 'block';
                    if (manageExternalLinksUI) manageExternalLinksUI.style.display = 'none';
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
            if (externalLinksSection) externalLinksSection.style.display = 'none';

        }
    } catch (error) {
        // ... (gestione errore caricamento come prima) ...
        console.error('profile.js - Error loading profile data:', error);
        profileLoadingMessage.style.display = 'none';
        profileLoginMessage.style.display = 'block';
        profileLoginMessage.innerHTML = `<p>Errore caricamento profilo: ${error.message}</p>`;
        if (emailVerificationBanner) emailVerificationBanner.style.display = 'none';
        if (statusMessageSection) statusMessageSection.style.display = 'none';
        if (externalLinksSection) externalLinksSection.style.display = 'none';
    }
}

// --- Funzione per validare URL (base) ---
function isValidHttpUrl(string) {
    let url;
    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
}

// --- Funzioni per Gestire Link Esterni ---
function openExternalLinkFormForEdit(index) {
    if (!currentUserProfileData || !currentUserProfileData.externalLinks || !externalLinkFormContainer) return;
    const linkToEdit = currentUserProfileData.externalLinks[index];
    if (!linkToEdit) return;

    if(externalLinkFormTitle) externalLinkFormTitle.textContent = 'Modifica Link Esterno';
    if(externalLinkTitleInput) externalLinkTitleInput.value = linkToEdit.title;
    if(externalLinkUrlInput) externalLinkUrlInput.value = linkToEdit.url;
    if(editingLinkIndexInput) editingLinkIndexInput.value = index; // Memorizza l'indice
    if(saveExternalLinkBtn) saveExternalLinkBtn.textContent = 'Aggiorna Link';
    if(cancelEditExtLinkBtn) cancelEditExtLinkBtn.style.display = 'inline-block';
    if(externalLinkErrorDiv) externalLinkErrorDiv.textContent = '';

    externalLinkFormContainer.style.display = 'block';
    if(toggleAddLinkFormBtn) toggleAddLinkFormBtn.textContent = 'Nascondi Form';
    if(externalLinkTitleInput) externalLinkTitleInput.focus();
}

async function handleExternalLinkFormSubmit(event) {
    event.preventDefault();
    if (!currentUserForProfilePage || !currentUserProfileData || !externalLinkFormContainer) {
        showToast('Azione non permessa o errore interfaccia.', 'error');
        return;
    }

    const title = externalLinkTitleInput.value.trim();
    const url = externalLinkUrlInput.value.trim();
    const editingIndex = parseInt(editingLinkIndexInput.value, 10);

    if (!title || !url) {
        if(externalLinkErrorDiv) externalLinkErrorDiv.textContent = 'Titolo e URL sono obbligatori.';
        showToast('Titolo e URL sono obbligatori.', 'warning');
        return;
    }
    if (!isValidHttpUrl(url)) {
        if(externalLinkErrorDiv) externalLinkErrorDiv.textContent = 'Inserisci un URL valido (deve iniziare con http:// o https://).';
        showToast('URL non valido. Deve iniziare con http:// o https://', 'warning');
        return;
    }
    if(externalLinkErrorDiv) externalLinkErrorDiv.textContent = '';


    let currentLinks = Array.isArray(currentUserProfileData.externalLinks) ? [...currentUserProfileData.externalLinks] : [];

    if (editingIndex > -1) { // Modalità Modifica
        if (editingIndex < currentLinks.length) {
            currentLinks[editingIndex] = { title, url };
        } else {
            showToast('Errore: indice link da modificare non valido.', 'error');
            return;
        }
    } else { // Modalità Aggiunta
        if (currentLinks.length >= MAX_EXTERNAL_LINKS) {
            showToast(`Puoi aggiungere al massimo ${MAX_EXTERNAL_LINKS} link.`, 'warning');
            return;
        }
        currentLinks.push({ title, url });
    }

    if(saveExternalLinkBtn) saveExternalLinkBtn.disabled = true;
    if(saveExternalLinkBtn) saveExternalLinkBtn.textContent = 'Salvataggio...';

    const userProfileRef = doc(db, 'userProfiles', currentUserForProfilePage.uid);
    try {
        await updateDoc(userProfileRef, {
            externalLinks: currentLinks,
            updatedAt: serverTimestamp(),
        });
        showToast(editingIndex > -1 ? 'Link aggiornato con successo!' : 'Link aggiunto con successo!', 'success');
        currentUserProfileData.externalLinks = currentLinks; // Aggiorna dati locali
        renderExternalLinks(currentLinks);
        resetAndHideExternalLinkForm();
    } catch (error) {
        console.error('Errore salvataggio link esterno:', error);
        showToast('Errore durante il salvataggio del link.', 'error');
        if(externalLinkErrorDiv) externalLinkErrorDiv.textContent = `Errore: ${error.message}`;
    } finally {
        if(saveExternalLinkBtn) saveExternalLinkBtn.disabled = false;
        // Il testo del bottone viene resettato da resetAndHideExternalLinkForm
    }
}

async function handleDeleteExternalLink(indexToDelete) {
    if (!currentUserForProfilePage || !currentUserProfileData || !Array.isArray(currentUserProfileData.externalLinks)) {
        showToast('Azione non permessa o errore dati.', 'error');
        return;
    }
    const linkToDelete = currentUserProfileData.externalLinks[indexToDelete];
    if (!linkToDelete || !confirm(`Sei sicuro di voler eliminare il link "${linkToDelete.title || 'Senza titolo'}"?`)) {
        return;
    }

    let currentLinks = [...currentUserProfileData.externalLinks];
    currentLinks.splice(indexToDelete, 1); // Rimuovi l'elemento dall'array

    const userProfileRef = doc(db, 'userProfiles', currentUserForProfilePage.uid);
    try {
        await updateDoc(userProfileRef, {
            externalLinks: currentLinks,
            updatedAt: serverTimestamp(),
        });
        showToast('Link eliminato con successo!', 'success');
        currentUserProfileData.externalLinks = currentLinks; // Aggiorna dati locali
        renderExternalLinks(currentLinks);
        if(externalLinkFormContainer.style.display === 'block' && parseInt(editingLinkIndexInput.value, 10) === indexToDelete){
            resetAndHideExternalLinkForm(); // Se il form era aperto per modificare il link eliminato, resettalo
        }
    } catch (error) {
        console.error('Errore eliminazione link esterno:', error);
        showToast('Errore durante l\'eliminazione del link.', 'error');
    }
}

function resetAndHideExternalLinkForm() {
    if(externalLinkForm) externalLinkForm.reset();
    if(editingLinkIndexInput) editingLinkIndexInput.value = "-1"; // Resetta indice
    if(externalLinkFormTitle) externalLinkFormTitle.textContent = 'Aggiungi Nuovo Link';
    if(saveExternalLinkBtn) saveExternalLinkBtn.textContent = 'Salva Link';
    if(cancelEditExtLinkBtn) cancelEditExtLinkBtn.style.display = 'none';
    if(externalLinkErrorDiv) externalLinkErrorDiv.textContent = '';
    if(externalLinkFormContainer) externalLinkFormContainer.style.display = 'none';
    if(toggleAddLinkFormBtn) toggleAddLinkFormBtn.textContent = 'Aggiungi Nuovo Link';
}

// ... (funzioni esistenti: handleStatusMessageUpdate, formatMyArticleTimestamp, handleDeleteArticle, createMyArticleItemElement, loadMyArticles)
async function handleStatusMessageUpdate(event) {
    event.preventDefault();
    if (!currentUserForProfilePage) {
        showToast('Devi essere loggato per aggiornare il tuo stato.', 'error');
        return;
    }
    if (!statusMessageInput || !statusUpdateMessage || !statusMessageDisplay) {
        console.error('Elementi DOM per aggiornamento stato mancanti.');
        showToast('Errore interfaccia utente. Impossibile aggiornare lo stato.', 'error');
        return;
    }

    const newStatus = statusMessageInput.value.trim();
    if (newStatus.length > 150) { 
        statusUpdateMessage.textContent = 'Lo stato non può superare i 150 caratteri.';
        statusUpdateMessage.style.color = 'red';
        showToast('Stato troppo lungo (max 150 caratteri).', 'warning');
        return;
    }

    if (currentUserProfileData && newStatus === (currentUserProfileData.statusMessage || '')) {
        statusUpdateMessage.textContent = 'Nessuna modifica rilevata.';
        statusUpdateMessage.style.color = 'orange';
        showToast('Nessuna modifica allo stato.', 'info');
        return;
    }
    const updateStatusBtnElem = updateStatusForm.querySelector('button[type="submit"]');
    if(updateStatusBtnElem) {
        updateStatusBtnElem.disabled = true;
        updateStatusBtnElem.textContent = 'Aggiornamento...';
    }
    statusUpdateMessage.textContent = '';

    const userProfileRef = doc(db, 'userProfiles', currentUserForProfilePage.uid);
    try {
        await updateDoc(userProfileRef, {
            statusMessage: newStatus,
            updatedAt: serverTimestamp(), 
        });
        showToast('Stato d\'animo aggiornato con successo!', 'success');
        statusMessageDisplay.textContent = newStatus; 
        if (currentUserProfileData) currentUserProfileData.statusMessage = newStatus; 
        statusUpdateMessage.textContent = 'Stato aggiornato!';
        statusUpdateMessage.style.color = 'green';
        setTimeout(() => { if(statusUpdateMessage) statusUpdateMessage.textContent = ''; }, 3000);

    } catch (error) {
        console.error('Errore aggiornamento stato d\'animo:', error);
        statusUpdateMessage.textContent = `Errore: ${error.message}`;
        statusUpdateMessage.style.color = 'red';
        showToast('Errore durante l\'aggiornamento dello stato.', 'error');
    } finally {
        if (updateStatusBtnElem) {
            updateStatusBtnElem.disabled = false;
            updateStatusBtnElem.textContent = 'Aggiorna';
        }
    }
}
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


// --- INIZIALIZZAZIONE ed Event Listeners ---
onAuthStateChanged(auth, (user) => {
    currentUserForProfilePage = user;
    if (user) {
        // ... (logica caricamento profilo e articoli come prima) ...
        if (profileContent && profileLoadingMessage && profileLoginMessage) {
            loadProfileData(user.uid); // Questa ora gestisce anche la visibilità iniziale di externalLinksSection e manageExternalLinksUI
            if (myArticlesSection) {
                myArticlesSection.style.display = 'block';
                loadMyArticles(user.uid);
            }
        } else {
            console.error('profile.js - Auth listener: Elementi UI principali del profilo non trovati.');
        }
    } else {
        // ... (logica per utente non loggato, inclusa la pulizia di externalLinksSection e manageExternalLinksUI) ...
        currentUserProfileData = null;
        if (profileContent) profileContent.style.display = 'none';
        if (profileLoadingMessage) profileLoadingMessage.style.display = 'none';
        if (profileLoginMessage) profileLoginMessage.style.display = 'block';
        if (emailVerificationBanner) emailVerificationBanner.style.display = 'none';
        if (statusMessageSection) statusMessageSection.style.display = 'none';
        if (externalLinksSection) externalLinksSection.style.display = 'none'; // Nascondi
        if (manageExternalLinksUI) manageExternalLinksUI.style.display = 'none'; // Nascondi


        if (myArticlesSection) myArticlesSection.style.display = 'none';
        // ... (pulizia liste articoli)
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

if (updateStatusForm) {
    updateStatusForm.addEventListener('submit', handleStatusMessageUpdate);
}

if (resendVerificationEmailBtn) {
    // ... (event listener esistente per reinvio email) ...
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

// NUOVI EVENT LISTENERS per Link Esterni
if (toggleAddLinkFormBtn) {
    toggleAddLinkFormBtn.addEventListener('click', () => {
        if (externalLinkFormContainer) {
            const isVisible = externalLinkFormContainer.style.display === 'block';
            externalLinkFormContainer.style.display = isVisible ? 'none' : 'block';
            toggleAddLinkFormBtn.textContent = isVisible ? 'Aggiungi Nuovo Link' : 'Nascondi Form';
            if (!isVisible) { // Se stiamo mostrando il form per aggiungere (non per modificare)
                if(externalLinkForm) externalLinkForm.reset();
                if(editingLinkIndexInput) editingLinkIndexInput.value = "-1";
                if(externalLinkFormTitle) externalLinkFormTitle.textContent = 'Aggiungi Nuovo Link';
                if(saveExternalLinkBtn) saveExternalLinkBtn.textContent = 'Salva Link';
                if(cancelEditExtLinkBtn) cancelEditExtLinkBtn.style.display = 'none';
                if(externalLinkTitleInput) externalLinkTitleInput.focus();
            }
        }
    });
}

if (externalLinkForm) {
    externalLinkForm.addEventListener('submit', handleExternalLinkFormSubmit);
}

if (cancelEditExtLinkBtn) {
    cancelEditExtLinkBtn.addEventListener('click', resetAndHideExternalLinkForm);
}