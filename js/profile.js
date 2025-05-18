// js/profile.js
import { db, auth, generateBlockieAvatar, showConfirmationModal } from './main.js';
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
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged, sendEmailVerification } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { showToast } from './toastNotifications.js';

// --- RIFERIMENTI DOM ---
const profileSectionTitle = document.querySelector('#profile h2');
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

const externalLinksSection = document.getElementById('externalLinksSection');
const externalLinksListUL = document.getElementById('externalLinksList');
const noExternalLinksMessage = document.getElementById('noExternalLinksMessage');
const manageExternalLinksUI = document.getElementById('manageExternalLinksUI');
const toggleAddLinkFormBtn = document.getElementById('toggleAddLinkFormBtn');
const externalLinkFormContainer = document.getElementById('externalLinkFormContainer');
const externalLinkFormTitle = document.getElementById('externalLinkFormTitle');
const externalLinkForm = document.getElementById('externalLinkForm');
const editingLinkIndexInput = document.getElementById('editingLinkIndex');
const externalLinkTitleInput = document.getElementById('externalLinkTitle');
const externalLinkUrlInput = document.getElementById('externalLinkUrl');
const externalLinkErrorDiv = document.getElementById('externalLinkError');
const saveExternalLinkBtn = document.getElementById('saveExternalLinkBtn');
const cancelEditExtLinkBtn = document.getElementById('cancelEditExtLinkBtn');

// Riferimenti DOM per la sezione "I Miei Articoli"
const myArticlesSection = document.getElementById('myArticlesSection');
const myDraftArticlesListDiv = document.getElementById('myDraftArticlesList');
const myPendingArticlesListDiv = document.getElementById('myPendingArticlesList');
const myPublishedArticlesListDiv = document.getElementById('myPublishedArticlesList');
const myRejectedArticlesListDiv = document.getElementById('myRejectedArticlesList');
const myDraftsLoadingMessage = document.getElementById('myDraftsLoadingMessage');
const myPendingLoadingMessage = document.getElementById('myPendingLoadingMessage');
const myPublishedLoadingMessage = document.getElementById('myPublishedLoadingMessage');
const myRejectedLoadingMessage = document.getElementById('myRejectedLoadingMessage');

// --- NUOVI RIFERIMENTI DOM per la BIO ---
const bioSection = document.getElementById('bioSection');
const bioDisplay = document.getElementById('bioDisplay');
const updateBioForm = document.getElementById('updateBioForm');
const bioInput = document.getElementById('bioInput');
const bioCharCountDisplay = document.getElementById('bioCharCount');
const bioCurrentCharsSpan = document.getElementById('bioCurrentChars');
const bioUpdateMessage = document.getElementById('bioUpdateMessage');

let loggedInUser = null;
let profileDataForDisplay = null;
const MAX_EXTERNAL_LINKS = 5;
const MAX_BIO_CHARS = 300;

function renderExternalLinks(linksArray, isOwnProfile) {
    if (!externalLinksListUL || !noExternalLinksMessage) return;
    externalLinksListUL.innerHTML = '';

    if (!linksArray || linksArray.length === 0) {
        if (noExternalLinksMessage) noExternalLinksMessage.style.display = 'list-item';
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
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        linkDisplayDiv.appendChild(anchor);
        const urlSpan = document.createElement('span');
        urlSpan.className = 'link-url';
        urlSpan.textContent = ` (${link.url})`; // Aggiunto spazio per separazione
        linkDisplayDiv.appendChild(urlSpan);
        li.appendChild(linkDisplayDiv);

        if (isOwnProfile) {
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

async function loadProfileData(uidToLoad, isOwnProfile) {
    // console.log(`profile.js - Loading profile for UID: ${uidToLoad}, isOwnProfile: ${isOwnProfile}`);
    if (
        !profileContent ||
        !profileLoadingMessage ||
        !profileLoginMessage ||
        !profileAvatarImg ||
        !profileNationalitySpan ||
        !profileEmailSpan ||
        !currentNicknameSpan ||
        !statusMessageSection ||
        !statusMessageDisplay ||
        !externalLinksSection ||
        !manageExternalLinksUI ||
        !updateStatusForm ||
        !bioSection ||
        !bioDisplay ||
        !updateBioForm ||
        !bioInput ||
        !bioCharCountDisplay ||
        !bioCurrentCharsSpan ||
        !bioUpdateMessage
    ) {
        console.error('Profile page DOM elements (profile, status, links, OR BIO) are missing!');
        if (profileLoadingMessage) profileLoadingMessage.textContent = 'Errore: Elementi della pagina mancanti.';
        return;
    }

    profileLoadingMessage.style.display = 'block';
    profileContent.style.display = 'none';
    profileLoginMessage.style.display = 'none';

    statusMessageSection.style.display = 'none';
    if (updateStatusForm) updateStatusForm.style.display = 'none';
    externalLinksSection.style.display = 'none';
    manageExternalLinksUI.style.display = 'none';
    bioSection.style.display = 'none';
    if (updateBioForm) updateBioForm.style.display = 'none';
    if (emailVerificationBanner) emailVerificationBanner.style.display = 'none';

    profileAvatarImg.src = '';
    profileAvatarImg.alt = 'Caricamento avatar...';
    profileEmailSpan.textContent = 'Caricamento...';
    currentNicknameSpan.textContent = 'Caricamento...';
    profileNationalitySpan.textContent = 'Caricamento...';
    statusMessageDisplay.textContent = 'Caricamento stato...';
    if (statusMessageInput) statusMessageInput.value = '';
    if (statusUpdateMessage) statusUpdateMessage.textContent = '';
    if (externalLinksListUL) renderExternalLinks([], isOwnProfile);
    if (bioDisplay) bioDisplay.innerHTML = '<p style="color: var(--text-color-muted);">Caricamento bio...</p>';
    if (bioInput) bioInput.value = '';
    if (bioUpdateMessage) bioUpdateMessage.textContent = '';
    if (bioCurrentCharsSpan) bioCurrentCharsSpan.textContent = '0';

    const userProfileRef = doc(db, 'userProfiles', uidToLoad);
    try {
        const docSnap = await getDoc(userProfileRef);
        if (docSnap.exists()) {
            profileDataForDisplay = { ...docSnap.data(), userId: uidToLoad };

            const profileNameForTitle = profileDataForDisplay.nickname || 'Utente';
            document.title = `Profilo di ${profileNameForTitle} - asyncDonkey.io`;
            if (profileSectionTitle)
                profileSectionTitle.textContent = isOwnProfile ? 'Il Mio Profilo' : `Profilo di ${profileNameForTitle}`;

            profileEmailSpan.textContent = profileDataForDisplay.email || 'N/A';
            currentNicknameSpan.textContent = profileDataForDisplay.nickname || 'Non impostato';

            if (profileNationalitySpan) {
                if (profileDataForDisplay.nationalityCode && profileDataForDisplay.nationalityCode !== 'OTHER') {
                    const countryCodeOriginal = profileDataForDisplay.nationalityCode.toUpperCase();
                    const countryCodeForLibrary = countryCodeOriginal.toLowerCase();
                    profileNationalitySpan.innerHTML = '';
                    const flagIconSpan = document.createElement('span');
                    flagIconSpan.classList.add('fi', `fi-${countryCodeForLibrary}`);
                    flagIconSpan.style.marginRight = '8px';
                    const codeTextNode = document.createTextNode(countryCodeOriginal);
                    profileNationalitySpan.appendChild(flagIconSpan);
                    profileNationalitySpan.appendChild(codeTextNode);
                } else if (profileDataForDisplay.nationalityCode === 'OTHER') {
                    profileNationalitySpan.textContent = 'Altro / Non specificato';
                } else {
                    profileNationalitySpan.textContent = 'Non specificata';
                }
            }
            if (profileAvatarImg) {
                profileAvatarImg.src = generateBlockieAvatar(uidToLoad, 80, { size: 8 });
                profileAvatarImg.alt = `${profileDataForDisplay.nickname || 'User'}'s Blockie Avatar`;
                profileAvatarImg.style.backgroundColor = 'transparent';
            }

            if (statusMessageDisplay) {
                statusMessageDisplay.textContent = profileDataForDisplay.statusMessage || '';
                if (!profileDataForDisplay.statusMessage && isOwnProfile) {
                    // Mostra un placeholder solo al proprietario se vuoto
                    statusMessageDisplay.innerHTML =
                        '<p style="color: var(--text-color-muted);">Nessuno stato d\'animo impostato. Scrivine uno qui sotto!</p>';
                } else if (!profileDataForDisplay.statusMessage && !isOwnProfile) {
                    statusMessageDisplay.innerHTML =
                        '<p style="color: var(--text-color-muted);">Nessuno stato d\'animo impostato.</p>';
                }
            }
            if (statusMessageSection) statusMessageSection.style.display = 'block';

            if (externalLinksSection) {
                externalLinksSection.style.display = 'block';
                renderExternalLinks(profileDataForDisplay.externalLinks || [], isOwnProfile);
            }

            if (bioSection) bioSection.style.display = 'block';
            if (bioDisplay) {
                if (profileDataForDisplay.bio && profileDataForDisplay.bio.trim() !== '') {
                    bioDisplay.textContent = profileDataForDisplay.bio;
                } else {
                    bioDisplay.innerHTML = '<p style="color: var(--text-color-muted);">Nessuna bio impostata.</p>';
                }
            }

            if (isOwnProfile) {
                if (emailVerificationBanner && loggedInUser && !loggedInUser.emailVerified) {
                    emailVerificationBanner.style.display = 'block';
                    if (resendEmailMessage) resendEmailMessage.textContent = '';
                }
                if (updateStatusForm) updateStatusForm.style.display = 'flex';
                if (statusMessageInput) {
                    // statusMessageInput.value = profileDataForDisplay.statusMessage || ''; // RIGA COMMENTATA/RIMOSSA
                    statusMessageInput.placeholder = profileDataForDisplay.statusMessage
                        ? 'Modifica il tuo stato attuale...'
                        : 'Come ti senti oggi?'; // Placeholder dinamico
                }
                if (manageExternalLinksUI) manageExternalLinksUI.style.display = 'block';

                // --- MODIFICHE PER BIO (MODIFICA) ---
                if (updateBioForm) updateBioForm.style.display = 'block';
                if (bioInput) {
                    // bioInput.value = profileDataForDisplay.bio || ''; // RIGA COMMENTATA/RIMOSSA
                    bioInput.placeholder = profileDataForDisplay.bio
                        ? 'Modifica la tua bio...'
                        : 'Scrivi qualcosa di te...'; // Placeholder dinamico
                }
                updateBioCharCounter(); // Chiamata per resettare il contatore se l'input è vuoto
                // --- FINE MODIFICHE PER BIO (MODIFICA) ---
            }

            profileLoadingMessage.style.display = 'none';
            profileContent.style.display = 'block';
        } else {
            document.title = 'Profilo Non Trovato - asyncDonkey.io';
            if (profileSectionTitle) profileSectionTitle.textContent = 'Profilo Non Trovato';
            // console.warn('profile.js - No profile document found for user:', uidToLoad);
            profileLoadingMessage.style.display = 'none';
            profileLoginMessage.style.display = 'block';
            profileLoginMessage.innerHTML = `<p>Errore: Profilo utente con ID "${uidToLoad}" non trovato.</p> <p><a href="index.html">Torna alla Homepage</a></p>`;
        }
    } catch (error) {
        document.title = 'Errore Profilo - asyncDonkey.io';
        if (profileSectionTitle) profileSectionTitle.textContent = 'Errore Profilo';
        console.error('profile.js - Error loading profile data:', error);
        profileLoadingMessage.style.display = 'none';
        profileLoginMessage.style.display = 'block';
        profileLoginMessage.innerHTML = `<p>Errore caricamento profilo: ${error.message}</p>`;
    }
}

function openExternalLinkFormForEdit(index) {
    if (!profileDataForDisplay || !profileDataForDisplay.externalLinks || !externalLinkFormContainer) return;
    const linkToEdit = profileDataForDisplay.externalLinks[index];
    if (!linkToEdit) return;

    if (externalLinkFormTitle) externalLinkFormTitle.textContent = 'Modifica Link Esterno';
    if (externalLinkTitleInput) externalLinkTitleInput.value = linkToEdit.title;
    if (externalLinkUrlInput) externalLinkUrlInput.value = linkToEdit.url;
    if (editingLinkIndexInput) editingLinkIndexInput.value = index;
    if (saveExternalLinkBtn) saveExternalLinkBtn.textContent = 'Aggiorna Link';
    if (cancelEditExtLinkBtn) cancelEditExtLinkBtn.style.display = 'inline-block';
    if (externalLinkErrorDiv) externalLinkErrorDiv.textContent = '';

    externalLinkFormContainer.style.display = 'block';
    if (toggleAddLinkFormBtn) toggleAddLinkFormBtn.textContent = 'Nascondi Form Modifica';
    if (externalLinkTitleInput) externalLinkTitleInput.focus();
}

async function handleExternalLinkFormSubmit(event) {
    event.preventDefault();
    if (!loggedInUser || !profileDataForDisplay || profileDataForDisplay.userId !== loggedInUser.uid) {
        showToast('Azione non permessa o errore interfaccia.', 'error');
        return;
    }
    const title = externalLinkTitleInput.value.trim();
    const url = externalLinkUrlInput.value.trim();
    const editingIndex = parseInt(editingLinkIndexInput.value, 10);

    if (!title || !url) {
        if (externalLinkErrorDiv) externalLinkErrorDiv.textContent = 'Titolo e URL sono obbligatori.';
        showToast('Titolo e URL sono obbligatori.', 'warning');
        return;
    }
    if (!isValidHttpUrl(url)) {
        if (externalLinkErrorDiv)
            externalLinkErrorDiv.textContent = 'Inserisci un URL valido (deve iniziare con http:// o https://).';
        showToast('URL non valido. Deve iniziare con http:// o https://', 'warning');
        return;
    }
    if (externalLinkErrorDiv) externalLinkErrorDiv.textContent = '';

    let currentLinks = Array.isArray(profileDataForDisplay.externalLinks)
        ? [...profileDataForDisplay.externalLinks]
        : [];

    if (editingIndex > -1) {
        if (editingIndex < currentLinks.length) {
            currentLinks[editingIndex] = { title, url };
        } else {
            showToast('Errore: indice link da modificare non valido.', 'error');
            return;
        }
    } else {
        if (currentLinks.length >= MAX_EXTERNAL_LINKS) {
            showToast(`Puoi aggiungere al massimo ${MAX_EXTERNAL_LINKS} link.`, 'warning');
            return;
        }
        currentLinks.push({ title, url });
    }

    if (saveExternalLinkBtn) {
        saveExternalLinkBtn.disabled = true;
        saveExternalLinkBtn.textContent = 'Salvataggio...';
    }

    const userProfileRef = doc(db, 'userProfiles', loggedInUser.uid);
    try {
        await updateDoc(userProfileRef, {
            externalLinks: currentLinks,
            updatedAt: serverTimestamp(),
        });
        showToast(editingIndex > -1 ? 'Link aggiornato con successo!' : 'Link aggiunto con successo!', 'success');
        profileDataForDisplay.externalLinks = currentLinks;
        renderExternalLinks(currentLinks, true);
        resetAndHideExternalLinkForm();
    } catch (error) {
        console.error('Errore salvataggio link esterno:', error);
        showToast('Errore durante il salvataggio del link.', 'error');
        if (externalLinkErrorDiv) externalLinkErrorDiv.textContent = `Errore: ${error.message}`;
    } finally {
        if (saveExternalLinkBtn) {
            saveExternalLinkBtn.disabled = false;
            // Il testo viene resettato in resetAndHideExternalLinkForm
        }
    }
}

async function handleDeleteExternalLink(indexToDelete) {
    if (
        !loggedInUser ||
        !profileDataForDisplay ||
        profileDataForDisplay.userId !== loggedInUser.uid ||
        !Array.isArray(profileDataForDisplay.externalLinks)
    ) {
        showToast('Azione non permessa o errore dati.', 'error');
        return;
    }
    const linkToDelete = profileDataForDisplay.externalLinks[indexToDelete];
    if (!linkToDelete || !confirm(`Sei sicuro di voler eliminare il link "${linkToDelete.title || 'Senza titolo'}"?`)) {
        return;
    }

    let currentLinks = [...profileDataForDisplay.externalLinks];
    currentLinks.splice(indexToDelete, 1);

    const userProfileRef = doc(db, 'userProfiles', loggedInUser.uid);
    try {
        await updateDoc(userProfileRef, {
            externalLinks: currentLinks,
            updatedAt: serverTimestamp(),
        });
        showToast('Link eliminato con successo!', 'success');
        profileDataForDisplay.externalLinks = currentLinks;
        renderExternalLinks(currentLinks, true);
        if (
            externalLinkFormContainer.style.display === 'block' &&
            parseInt(editingLinkIndexInput.value, 10) === indexToDelete
        ) {
            resetAndHideExternalLinkForm();
        }
    } catch (error) {
        console.error('Errore eliminazione link esterno:', error);
        showToast("Errore durante l'eliminazione del link.", 'error');
    }
}

function resetAndHideExternalLinkForm() {
    if (externalLinkForm) externalLinkForm.reset();
    if (editingLinkIndexInput) editingLinkIndexInput.value = '-1';
    if (externalLinkFormTitle) externalLinkFormTitle.textContent = 'Aggiungi Nuovo Link';
    if (saveExternalLinkBtn) saveExternalLinkBtn.textContent = 'Salva Link';
    if (cancelEditExtLinkBtn) cancelEditExtLinkBtn.style.display = 'none';
    if (externalLinkErrorDiv) externalLinkErrorDiv.textContent = '';
    if (externalLinkFormContainer) externalLinkFormContainer.style.display = 'none';
    if (toggleAddLinkFormBtn) toggleAddLinkFormBtn.textContent = 'Aggiungi Nuovo Link';
}

function isValidHttpUrl(string) {
    let url;
    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }
    return url.protocol === 'http:' || url.protocol === 'https:';
}

async function handleStatusMessageUpdate(event) {
    event.preventDefault();
    if (!loggedInUser || !profileDataForDisplay || profileDataForDisplay.userId !== loggedInUser.uid) {
        showToast('Devi essere loggato e sul tuo profilo per aggiornare lo stato.', 'error');
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

    if (profileDataForDisplay && newStatus === (profileDataForDisplay.statusMessage || '')) {
        statusUpdateMessage.textContent = 'Nessuna modifica rilevata.';
        statusUpdateMessage.style.color = 'var(--text-color-muted)';
        showToast('Nessuna modifica allo stato.', 'info');
        return;
    }
    const updateStatusBtnElem = updateStatusForm.querySelector('button[type="submit"]');
    if (updateStatusBtnElem) {
        updateStatusBtnElem.disabled = true;
        updateStatusBtnElem.textContent = 'Aggiornamento...';
    }
    statusUpdateMessage.textContent = '';

    const userProfileRef = doc(db, 'userProfiles', loggedInUser.uid);
    try {
        await updateDoc(userProfileRef, {
            statusMessage: newStatus,
            updatedAt: serverTimestamp(),
        });
        showToast("Stato d'animo aggiornato con successo!", 'success');
        statusMessageDisplay.textContent = newStatus || ''; // Mostra stringa vuota invece di null/undefined
        if (!newStatus && profileDataForDisplay.userId === loggedInUser?.uid) {
            // Mostra placeholder solo al proprietario se vuoto
            statusMessageDisplay.innerHTML =
                '<p style="color: var(--text-color-muted);">Nessuno stato d\'animo impostato. Scrivine uno qui sotto!</p>';
        } else if (!newStatus) {
            statusMessageDisplay.innerHTML =
                '<p style="color: var(--text-color-muted);">Nessuno stato d\'animo impostato.</p>';
        }

        if (profileDataForDisplay) profileDataForDisplay.statusMessage = newStatus;
        statusUpdateMessage.textContent = 'Stato aggiornato!';
        statusUpdateMessage.style.color = 'green';
        setTimeout(() => {
            if (statusUpdateMessage) statusUpdateMessage.textContent = '';
        }, 3000);
    } catch (error) {
        console.error("Errore aggiornamento stato d'animo:", error);
        statusUpdateMessage.textContent = `Errore: ${error.message}`;
        statusUpdateMessage.style.color = 'red';
        showToast("Errore durante l'aggiornamento dello stato.", 'error');
    } finally {
        if (updateStatusBtnElem) {
            updateStatusBtnElem.disabled = false;
            updateStatusBtnElem.textContent = 'Aggiorna';
        }
    }
}

function updateBioCharCounter() {
    if (bioInput && bioCurrentCharsSpan && bioCharCountDisplay) {
        const currentLength = bioInput.value.length;
        bioCurrentCharsSpan.textContent = currentLength;
        if (currentLength > MAX_BIO_CHARS) {
            bioCharCountDisplay.style.color = 'red';
            bioCharCountDisplay.title = `Hai superato il limite di ${MAX_BIO_CHARS} caratteri.`;
        } else {
            bioCharCountDisplay.style.color = 'var(--text-color-muted)';
            bioCharCountDisplay.title = '';
        }
    }
}

async function handleBioUpdate(event) {
    event.preventDefault();
    if (!loggedInUser || !profileDataForDisplay || profileDataForDisplay.userId !== loggedInUser.uid) {
        showToast('Devi essere loggato e sul tuo profilo per aggiornare la bio.', 'error');
        return;
    }
    if (!bioInput || !bioUpdateMessage || !bioDisplay) {
        console.error('Elementi DOM per aggiornamento bio mancanti.');
        showToast('Errore interfaccia utente. Impossibile aggiornare la bio.', 'error');
        return;
    }

    const newBio = bioInput.value; // Non fare trim() qui per permettere all'utente di salvare spazi se lo desidera
    if (newBio.length > MAX_BIO_CHARS) {
        bioUpdateMessage.textContent = `La bio non può superare i ${MAX_BIO_CHARS} caratteri. Attualmente: ${newBio.length}.`;
        bioUpdateMessage.style.color = 'red';
        showToast(`Bio troppo lunga (max ${MAX_BIO_CHARS} caratteri).`, 'warning');
        return;
    }

    if (profileDataForDisplay && newBio === (profileDataForDisplay.bio || '')) {
        bioUpdateMessage.textContent = 'Nessuna modifica rilevata alla bio.';
        bioUpdateMessage.style.color = 'var(--text-color-muted)';
        showToast('Nessuna modifica alla bio.', 'info');
        return;
    }

    const updateBioBtnElem = updateBioForm.querySelector('button[type="submit"]');
    if (updateBioBtnElem) {
        updateBioBtnElem.disabled = true;
        updateBioBtnElem.textContent = 'Salvataggio Bio...';
    }
    bioUpdateMessage.textContent = '';

    const userProfileRef = doc(db, 'userProfiles', loggedInUser.uid);
    try {
        await updateDoc(userProfileRef, {
            bio: newBio, // Salva la bio così com'è, gli spazi verranno gestiti da pre-wrap
            updatedAt: serverTimestamp(),
        });
        showToast('Bio aggiornata con successo!', 'success');
        if (profileDataForDisplay) profileDataForDisplay.bio = newBio;

        if (newBio.trim() !== '') {
            // Usa trim() solo per il controllo del placeholder
            bioDisplay.textContent = newBio; // textContent preserva gli spazi e va a capo con pre-wrap
        } else {
            bioDisplay.innerHTML = '<p style="color: var(--text-color-muted);">Nessuna bio impostata.</p>';
        }

        bioUpdateMessage.textContent = 'Bio aggiornata!';
        bioUpdateMessage.style.color = 'green';
        setTimeout(() => {
            if (bioUpdateMessage) bioUpdateMessage.textContent = '';
        }, 3000);
    } catch (error) {
        console.error('Errore aggiornamento bio:', error);
        bioUpdateMessage.textContent = `Errore: ${error.message}`;
        bioUpdateMessage.style.color = 'red';
        showToast("Errore durante l'aggiornamento della bio.", 'error');
    } finally {
        if (updateBioBtnElem) {
            updateBioBtnElem.disabled = false;
            updateBioBtnElem.textContent = 'Salva Bio';
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
    const userConfirmed = await showConfirmationModal(
        // Usa la modale di conferma
        `Conferma Eliminazione ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
        `Sei sicuro di voler eliminare ${statusText} "${articleTitle || 'Senza Titolo'}"? L'azione è irreversibile.`
    );

    if (!userConfirmed) {
        showToast('Eliminazione annullata.', 'info');
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
        if (loggedInUser) {
            loadMyArticles(loggedInUser.uid);
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
        previewButton.href = `view-article.html?id=${articleId}&preview=true`; // Assumendo che view-article gestisca la preview
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

async function loadMyArticles(userIdToLoadArticlesFor) {
    const articleStatusesToLoad = [
        { status: 'draft', listDiv: myDraftArticlesListDiv, loadingMsg: myDraftsLoadingMessage, title: 'Bozze' },
        {
            status: 'pendingReview',
            listDiv: myPendingArticlesListDiv,
            loadingMsg: myPendingLoadingMessage,
            title: 'In Revisione',
        },
        {
            status: 'published',
            listDiv: myPublishedArticlesListDiv,
            loadingMsg: myPublishedLoadingMessage,
            title: 'Pubblicati',
        },
        {
            status: 'rejected',
            listDiv: myRejectedArticlesListDiv,
            loadingMsg: myRejectedLoadingMessage,
            title: 'Respinti',
        },
    ];
    if (!userIdToLoadArticlesFor) {
        if (myArticlesSection) myArticlesSection.style.display = 'none';
        return;
    }
    if (loggedInUser && loggedInUser.uid === userIdToLoadArticlesFor) {
        if (myArticlesSection) myArticlesSection.style.display = 'block';
    } else {
        if (myArticlesSection) myArticlesSection.style.display = 'none';
        return;
    }

    for (const S of articleStatusesToLoad) {
        if (S.listDiv && S.loadingMsg) {
            S.loadingMsg.style.display = 'block';
            S.listDiv.innerHTML = '';
            try {
                const articlesRef = collection(db, 'articles');
                const q = query(
                    articlesRef,
                    where('authorId', '==', userIdToLoadArticlesFor),
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
    loggedInUser = user;
    const urlParams = new URLSearchParams(window.location.search);
    const profileUserIdFromUrl = urlParams.get('userId');

    if (profileUserIdFromUrl) {
        const isOwn = loggedInUser ? loggedInUser.uid === profileUserIdFromUrl : false;
        loadProfileData(profileUserIdFromUrl, isOwn);
        if (isOwn) {
            loadMyArticles(profileUserIdFromUrl);
        } else {
            if (myArticlesSection) myArticlesSection.style.display = 'none';
        }
    } else if (loggedInUser) {
        loadProfileData(loggedInUser.uid, true);
        loadMyArticles(loggedInUser.uid);
    } else {
        profileDataForDisplay = null;
        if (profileContent) profileContent.style.display = 'none';
        if (profileLoadingMessage) profileLoadingMessage.style.display = 'none';
        if (profileLoginMessage) profileLoginMessage.style.display = 'block';
        if (emailVerificationBanner) emailVerificationBanner.style.display = 'none';
        if (statusMessageSection) statusMessageSection.style.display = 'none';
        if (externalLinksSection) externalLinksSection.style.display = 'none';
        if (manageExternalLinksUI) manageExternalLinksUI.style.display = 'none';
        if (bioSection) bioSection.style.display = 'none';
        if (myArticlesSection) myArticlesSection.style.display = 'none';
    }
});

if (updateStatusForm) {
    updateStatusForm.addEventListener('submit', handleStatusMessageUpdate);
}

if (resendVerificationEmailBtn) {
    resendVerificationEmailBtn.addEventListener('click', async () => {
        if (loggedInUser && !loggedInUser.emailVerified) {
            try {
                resendVerificationEmailBtn.disabled = true;
                resendVerificationEmailBtn.textContent = 'Invio...';
                if (resendEmailMessage) resendEmailMessage.textContent = '';
                await sendEmailVerification(loggedInUser);
                showToast('Email di verifica inviata nuovamente! Controlla la tua casella di posta.', 'success', 6000);
                if (resendEmailMessage) {
                    resendEmailMessage.textContent = 'Email inviata. Potrebbe volerci qualche minuto.';
                    resendEmailMessage.style.color = 'green';
                }
            } catch (error) {
                console.error('Errore invio nuova email di verifica:', error);
                showToast("Errore durante l'invio dell'email di verifica. Riprova più tardi.", 'error');
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
        } else if (loggedInUser && loggedInUser.emailVerified) {
            showToast('La tua email è già verificata.', 'info');
            if (emailVerificationBanner) emailVerificationBanner.style.display = 'none';
        }
    });
}

if (toggleAddLinkFormBtn) {
    toggleAddLinkFormBtn.addEventListener('click', () => {
        if (externalLinkFormContainer) {
            const isVisible = externalLinkFormContainer.style.display === 'block';
            externalLinkFormContainer.style.display = isVisible ? 'none' : 'block';
            toggleAddLinkFormBtn.textContent = isVisible ? 'Aggiungi Nuovo Link' : 'Nascondi Form';
            if (!isVisible) {
                resetAndHideExternalLinkForm();
                if (externalLinkTitleInput) externalLinkTitleInput.focus();
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

// Event listener per il contatore caratteri della bio
if (bioInput && bioCharCountDisplay && bioCurrentCharsSpan) {
    // Assicurati che tutti gli elementi esistano
    bioInput.addEventListener('input', updateBioCharCounter);
}

// Event listener per il submit del form della bio
if (updateBioForm) {
    updateBioForm.addEventListener('submit', handleBioUpdate);
}

// Inizializza il contatore caratteri se l'input è già visibile al caricamento
// (principalmente per il caso in cui l'utente è già loggato e vede il proprio profilo)
document.addEventListener('DOMContentLoaded', () => {
    if (bioInput && bioInput.offsetParent !== null) {
        updateBioCharCounter();
    }
});
