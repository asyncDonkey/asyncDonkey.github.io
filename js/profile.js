// js/profile.js
import { db, auth, generateBlockieAvatar, showConfirmationModal } from './main.js';
import {
    doc,
    // getDoc, // Sostituito con onSnapshot per i dati principali del profilo
    onSnapshot, // Per ascoltare le modifiche in tempo reale
    updateDoc,
    collection,
    query,
    where,
    getDocs, // Mantenuto per caricare gli articoli utente
    orderBy,
    deleteDoc,
    serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import {
    getStorage,
    ref as storageRef,
    uploadBytesResumable,
    // getDownloadURL, // Non direttamente necessario qui se CF aggiorna Firestore
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

import { onAuthStateChanged, sendEmailVerification } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { showToast } from './toastNotifications.js';

// --- RIFERIMENTI DOM (come dal tuo codice) ---
const profileSectionTitle = document.querySelector('#profile h2');
const profileContent = document.getElementById('profileContent');
const profileAvatarImg = document.getElementById('profileAvatar'); // ID corretto
const profileEmailSpan = document.getElementById('profileEmail');
const profileEmailRow = document.getElementById('profileEmailRow');
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

const myArticlesSection = document.getElementById('myArticlesSection');
const myDraftArticlesListDiv = document.getElementById('myDraftArticlesList');
const myPendingArticlesListDiv = document.getElementById('myPendingArticlesList');
const myPublishedArticlesListDiv = document.getElementById('myPublishedArticlesList');
const myRejectedArticlesListDiv = document.getElementById('myRejectedArticlesList');
const myDraftsLoadingMessage = document.getElementById('myDraftsLoadingMessage');
const myPendingLoadingMessage = document.getElementById('myPendingLoadingMessage');
const myPublishedLoadingMessage = document.getElementById('myPublishedLoadingMessage');
const myRejectedLoadingMessage = document.getElementById('myRejectedLoadingMessage');

const bioSection = document.getElementById('bioSection');
const bioDisplay = document.getElementById('bioDisplay');
const updateBioForm = document.getElementById('updateBioForm');
const bioInput = document.getElementById('bioInput');
const bioCharCountDisplay = document.getElementById('bioCharCount');
const bioCurrentCharsSpan = document.getElementById('bioCurrentChars');
const bioUpdateMessage = document.getElementById('bioUpdateMessage');

const badgesSection = document.getElementById('badgesSection');
const badgesDisplayContainer = document.getElementById('badgesDisplayContainer');
const noBadgesMessage = document.getElementById('noBadgesMessage');

const avatarUploadSection = document.getElementById('avatarUploadSection');
const avatarUploadInput = document.getElementById('avatarUploadInput');
const selectAvatarFileBtn = document.getElementById('selectAvatarFileBtn');
const avatarPreview = document.getElementById('avatarPreview');
const avatarPreviewPlaceholder = document.getElementById('avatarPreviewPlaceholder');
const confirmAvatarUploadBtn = document.getElementById('confirmAvatarUploadBtn');
const avatarUploadProgressContainer = document.getElementById('avatarUploadProgressContainer');
const avatarUploadProgressBar = document.getElementById('avatarUploadProgressBar');
const avatarUploadProgressText = document.getElementById('avatarUploadProgressText');
const avatarUploadStatus = document.getElementById('avatarUploadStatus');

// --- STATO DEL MODULO E COSTANTI ---
let loggedInUser = null;
let profileDataForDisplay = null; // Mantiene l'ultimo stato noto dei dati del profilo visualizzato
let currentProfileListenerUnsubscribe = null; // Per fare l'unsubscribe da onSnapshot
let badgeDetailModal, closeBadgeDetailModalBtn, badgeDetailModalIcon, badgeDetailModalName, badgeDetailModalDescription;

const MAX_EXTERNAL_LINKS = 5;
const MAX_BIO_CHARS = 300;
let selectedAvatarFile = null;
const MAX_AVATAR_SIZE_MB = 5;
const DEFAULT_AVATAR_IMAGE_PATH = 'assets/images/default-avatar.png'; // Definisci il percorso del tuo avatar di default

const storage = getStorage();

const BADGE_DEFINITIONS = {
    'author-rookie': {
        name: 'Autore Debuttante',
        icon: 'school',
        description:
            'Congratulazioni! Hai pubblicato il tuo primo articolo su asyncDonkey.io, condividendo la tua conoscenza con la community!',
        color: 'var(--bs-teal)',
        isNeon: false,
        isAnimated: true,
        animationClass: 'author-rookie-icon-animated',
    },
    'glitchzilla-slayer': {
        name: 'Glitchzilla Slayer',
        icon: 'shield_moon',
        description:
            'Epico! Hai sconfitto il temibile Glitchzilla in CodeDash! Runner, dimostrando la tua abilità e determinazione!',
        color: 'var(--bs-purple)',
        isNeon: true,
        isAnimated: false,
    },
    'prolific-commenter': {
        name: 'Commentatore Prolifico',
        icon: 'forum',
        description: 'Grazie per i tuoi numerosi e utili commenti! Hai scritto più di 20 interventi costruttivi.',
        color: 'var(--bs-info)',
        isNeon: false,
        isAnimated: false,
    },
};

// --- FUNZIONI DI RENDERING UI (non modificate significativamente, tranne dove `profileDataForDisplay` viene usato) ---

function renderExternalLinks(linksArray, isOwnProfile) {
    if (!externalLinksListUL || !noExternalLinksMessage) return;
    externalLinksListUL.innerHTML = '';

    // Mostra la sezione solo se è il profilo dell'utente E ci sono link o si può aggiungere
    if (!isOwnProfile || !externalLinksSection) { // Se non è il profilo proprio, non mostrare la sezione link esterni
        if(externalLinksSection) externalLinksSection.style.display = 'none';
        return;
    }
    externalLinksSection.style.display = 'block';


    if (!linksArray || linksArray.length === 0) {
        if (noExternalLinksMessage) noExternalLinksMessage.style.display = 'list-item';
        return;
    }
    if (noExternalLinksMessage) noExternalLinksMessage.style.display = 'none';

    linksArray.forEach((link, index) => {
        const li = document.createElement('li');
        // ... (resto della logica di renderExternalLinks invariata,
        // poiché questa funzione viene chiamata solo se isOwnProfile è true e la sezione è visibile)
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
        urlSpan.textContent = ` (${link.url})`;
        linkDisplayDiv.appendChild(urlSpan);
        li.appendChild(linkDisplayDiv);
        // I bottoni Modifica/Elimina sono già implicitamente gestiti da isOwnProfile
        // nel chiamante o nella logica di visualizzazione della sezione manageExternalLinksUI
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
        externalLinksListUL.appendChild(li);
    });
}

/**
 * Aggiorna l'interfaccia utente con i dati del profilo.
 * Questa funzione viene chiamata dal callback di onSnapshot.
 * @param {object} data - Dati del profilo (da userProfiles o userPublicProfiles).
 * @param {boolean} isOwnProfile - True se è il profilo dell'utente loggato.
 * @param {string} uidLoaded - L'UID del profilo caricato.
 */
function updateProfilePageUI(data, isOwnProfile, uidLoaded) {
    profileDataForDisplay = { ...data, userId: uidLoaded, isPublicSnapshot: !isOwnProfile };

    const profileNameForTitle = data.nickname || 'Utente';
    document.title = `Profilo di ${profileNameForTitle} - asyncDonkey.io`;
    if (profileSectionTitle) {
        profileSectionTitle.textContent = isOwnProfile ? 'Il Mio Profilo' : `Profilo di ${profileNameForTitle}`;
    }

    if (profileEmailRow) profileEmailRow.style.display = isOwnProfile && data.email ? 'flex' : 'none';
    if (profileEmailSpan && isOwnProfile) profileEmailSpan.textContent = data.email || 'N/A';

    if (currentNicknameSpan) currentNicknameSpan.textContent = data.nickname || 'Non impostato';

    if (profileNationalitySpan) {
        // ... (logica nazionalità invariata)
        if (data.nationalityCode && data.nationalityCode !== 'OTHER') {
            const countryCodeOriginal = data.nationalityCode.toUpperCase();
            const countryCodeForLibrary = countryCodeOriginal.toLowerCase();
            profileNationalitySpan.innerHTML = '';
            const flagIconSpan = document.createElement('span');
            flagIconSpan.classList.add('fi', `fi-${countryCodeForLibrary}`);
            flagIconSpan.style.marginRight = '8px';
            const codeTextNode = document.createTextNode(countryCodeOriginal);
            profileNationalitySpan.appendChild(flagIconSpan);
            profileNationalitySpan.appendChild(codeTextNode);
        } else if (data.nationalityCode === 'OTHER') {
            profileNationalitySpan.textContent = 'Altro / Non specificato';
        } else {
            profileNationalitySpan.textContent = 'Non specificata';
        }
    }

    if (profileAvatarImg) {
        // ... (logica avatar invariata dall'ultima versione)
        let avatarSrcToSet;
        let altText = `${profileNameForTitle}'s Avatar`;
        let cacheBusterTimestamp = null;
        let mainAvatarUrl = null;

        if (isOwnProfile && data.avatarUrls && data.avatarUrls.profile) {
            mainAvatarUrl = data.avatarUrls.profile;
            cacheBusterTimestamp = data.profileUpdatedAt;
        } else if (!isOwnProfile && data.avatarUrls && data.avatarUrls.thumbnail) {
            mainAvatarUrl = data.avatarUrls.thumbnail;
            cacheBusterTimestamp = data.profilePublicUpdatedAt;
        } else if (isOwnProfile && data.avatarUrls && data.avatarUrls.small) {
             mainAvatarUrl = data.avatarUrls.small;
             cacheBusterTimestamp = data.profileUpdatedAt;
        }

        if (mainAvatarUrl) {
            altText = `${profileNameForTitle}'s Custom Avatar`;
            if (cacheBusterTimestamp && cacheBusterTimestamp.seconds) {
                avatarSrcToSet = `${mainAvatarUrl}?v=${cacheBusterTimestamp.seconds}`;
            } else if (cacheBusterTimestamp instanceof Date) {
                avatarSrcToSet = `${mainAvatarUrl}?v=${cacheBusterTimestamp.getTime()}`;
            } else {
                avatarSrcToSet = mainAvatarUrl;
            }
        } else if (uidLoaded) {
            avatarSrcToSet = generateBlockieAvatar(uidLoaded, 80, { size: 8 });
            altText = `${profileNameForTitle}'s Blockie Avatar`;
        } else {
            avatarSrcToSet = DEFAULT_AVATAR_IMAGE_PATH;
            altText = `${profileNameForTitle}'s Default Avatar`;
        }
        
        profileAvatarImg.src = avatarSrcToSet;
        profileAvatarImg.alt = altText;
        profileAvatarImg.onerror = () => {
            console.warn(`[AthenaDev Debug - UpdateUI] Errore caricamento avatar: ${avatarSrcToSet}. Fallback.`);
            if (uidLoaded) {
                profileAvatarImg.src = generateBlockieAvatar(uidLoaded, 80, { size: 8 });
                profileAvatarImg.alt = `${profileNameForTitle}'s Blockie Avatar (fallback errore)`;
            } else {
                profileAvatarImg.src = DEFAULT_AVATAR_IMAGE_PATH;
                profileAvatarImg.alt = `${profileNameForTitle}'s Default Avatar (fallback errore critico)`;
            }
            profileAvatarImg.onerror = null; 
        };
    }

    // Gestione Status Message (ORA POTENZIALMENTE PUBBLICO)
    if (statusMessageSection && statusMessageDisplay) {
        if (data.statusMessage && data.statusMessage.trim() !== '') {
            statusMessageSection.style.display = 'block';
            statusMessageDisplay.textContent = data.statusMessage;
        } else {
            // Se è il profilo proprio e non c'è messaggio, mostra l'invito
            if (isOwnProfile) {
                statusMessageSection.style.display = 'block';
                statusMessageDisplay.innerHTML =
                    '<p style="color: var(--text-color-muted);">Nessuno stato d\'animo impostato. Scrivine uno qui sotto!</p>';
            } else {
                // Se è il profilo di un altro e non c'è messaggio pubblico, nascondi la sezione
                statusMessageSection.style.display = 'none';
            }
        }
    }

    // Gestione Bio (disponibile sia in userProfiles che userPublicProfiles)
    if (bioSection) bioSection.style.display = 'block';
    if (bioDisplay) {
        // ... (logica bio invariata)
        if (data.bio && data.bio.trim() !== '') {
            bioDisplay.textContent = data.bio;
        } else {
            bioDisplay.innerHTML = `<p style="color: var(--text-color-muted);">Nessuna bio impostata.</p>`;
        }
    }

    // Gestione Badges
    if (badgesSection && badgesDisplayContainer && noBadgesMessage) {
        // ... (logica badges invariata)
        badgesDisplayContainer.innerHTML = '';
        noBadgesMessage.style.display = 'none';
        const earnedBadgesArray = isOwnProfile ? (data.earnedBadges || []) : [];
        if (earnedBadgesArray.length > 0) {
            badgesSection.style.display = 'block';
            earnedBadgesArray.forEach((badgeId) => {
                const badgeInfo = BADGE_DEFINITIONS[badgeId];
                if (badgeInfo) {
                    const badgeIconElement = document.createElement('div');
                    badgeIconElement.className = 'badge-icon-item';
                    badgeIconElement.title = `${badgeInfo.name}\n${badgeInfo.description}`;
                    badgeIconElement.setAttribute('role', 'button');
                    badgeIconElement.setAttribute('tabindex', '0');
                    badgeIconElement.setAttribute('aria-label', `Dettagli badge: ${badgeInfo.name}`);
                    const iconSpan = document.createElement('span');
                    iconSpan.className = 'material-symbols-rounded';
                    iconSpan.textContent = badgeInfo.icon;
                    iconSpan.style.color = badgeInfo.color || 'var(--text-color-primary)';
                    if (badgeInfo.isNeon) iconSpan.classList.add('testo-neon-arcade');
                    else if (badgeInfo.isAnimated && badgeInfo.animationClass)
                        iconSpan.classList.add(badgeInfo.animationClass);
                    badgeIconElement.appendChild(iconSpan);
                    badgeIconElement.addEventListener('click', () => openBadgeDetailsModal(badgeId));
                    badgeIconElement.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openBadgeDetailsModal(badgeId);
                        }
                    });
                    badgesDisplayContainer.appendChild(badgeIconElement);
                }
            });
        } else {
            if (isOwnProfile) {
                badgesSection.style.display = 'block';
                noBadgesMessage.textContent = 'Nessun riconoscimento ancora ottenuto.';
                noBadgesMessage.style.display = 'block';
            } else {
                badgesSection.style.display = 'none';
            }
        }
    }

    // Mostra/nascondi sezioni e form di modifica basati su isOwnProfile
    if (isOwnProfile) {
        if (emailVerificationBanner && loggedInUser && !loggedInUser.emailVerified) {
            emailVerificationBanner.style.display = 'block';
            if (resendEmailMessage) resendEmailMessage.textContent = '';
        }
        
        if (updateStatusForm) {
            updateStatusForm.style.display = 'flex';
            if (statusMessageInput)
                statusMessageInput.placeholder = data.statusMessage
                    ? 'Modifica il tuo stato attuale...'
                    : 'Come ti senti oggi?';
        }
        if (updateBioForm) {
            updateBioForm.style.display = 'block';
            if (bioInput)
                bioInput.placeholder = data.bio
                    ? 'Modifica la tua bio...'
                    : 'Scrivi qualcosa di te...';
        }

        if (manageExternalLinksUI) manageExternalLinksUI.style.display = 'block';
        renderExternalLinks(data.externalLinks || [], true);
        
        updateBioCharCounter();
        if (avatarUploadSection) avatarUploadSection.style.display = 'block';

    } else {
        // Profilo di un altro utente
        if (emailVerificationBanner) emailVerificationBanner.style.display = 'none';
        if (updateStatusForm) updateStatusForm.style.display = 'none'; // Form di modifica stato nascosto
        if (updateBioForm) updateBioForm.style.display = 'none';
        if (manageExternalLinksUI) manageExternalLinksUI.style.display = 'none';
        if (externalLinksSection) externalLinksSection.style.display = 'none';
        if (avatarUploadSection) avatarUploadSection.style.display = 'none';
    }

    if (profileLoadingMessage) profileLoadingMessage.style.display = 'none';
    if (profileContent) profileContent.style.display = 'block';
}
/**
 * Carica i dati del profilo utente (privato o pubblico) e imposta un listener.
 */
function loadProfileData(uidToLoad, isOwnProfile) {
    console.log(`[AthenaDev Debug - Load] Inizio loadProfileData per UID: ${uidToLoad}, isOwnProfile: ${isOwnProfile}`);

    // Reset UI iniziale (parziale, il resto è gestito da updateProfilePageUI o nascosto se non c'è utente)
    // Pulisci i campi principali in attesa dei dati freschi
    if (profileAvatarImg) {
        if (uidToLoad) {
            // Se uidToLoad è disponibile, usa subito il Blockie come placeholder
            profileAvatarImg.src = generateBlockieAvatar(uidToLoad, 80, { size: 8 });
            profileAvatarImg.alt = 'Caricamento avatar... (Blockie)';
        } else {
            // Se uidToLoad non fosse disponibile qui (improbabile se la funzione è chiamata correttamente),
            // si potrebbe usare il vecchio DEFAULT_AVATAR_IMAGE_PATH (se si aggiunge il file)
            // o un placeholder neutro.
            profileAvatarImg.src = ''; // O un'immagine placeholder base64 trasparente, o DEFAULT_AVATAR_IMAGE_PATH
            profileAvatarImg.alt = 'Caricamento avatar...';
            console.warn(
                '[AthenaDev Debug - Load] uidToLoad non disponibile per Blockie placeholder iniziale in loadProfileData.'
            );
        }
        profileAvatarImg.style.display = 'block'; // Assicurati sia visibile
    }
    if (profileEmailSpan) profileEmailSpan.textContent = 'Caricamento...';
    if (currentNicknameSpan) currentNicknameSpan.textContent = 'Caricamento...';
    if (profileNationalitySpan) profileNationalitySpan.textContent = 'Caricamento...';
    if (statusMessageDisplay) statusMessageDisplay.textContent = 'Caricamento stato...';
    if (bioDisplay) bioDisplay.innerHTML = '<p style="color: var(--text-color-muted);">Caricamento bio...</p>';
    if (badgesDisplayContainer) badgesDisplayContainer.innerHTML = ''; // Pulisce i badge vecchi
    if (noBadgesMessage) noBadgesMessage.style.display = 'none';

    if (currentProfileListenerUnsubscribe) {
        console.log('[AthenaDev Debug - Load] Annullamento iscrizione dal listener precedente.');
        currentProfileListenerUnsubscribe();
        currentProfileListenerUnsubscribe = null;
    }

    // MODIFICA CHIAVE: Scegli la collezione da cui leggere
    const collectionPath = isOwnProfile ? 'userProfiles' : 'userPublicProfiles';
    const userProfileRef = doc(db, collectionPath, uidToLoad);

    console.log(`[AthenaDev Debug - Load] Ascolto su: ${collectionPath}/${uidToLoad}`);

    currentProfileListenerUnsubscribe = onSnapshot(
        userProfileRef,
        (docSnap) => {
            console.log(`[AthenaDev Debug - onSnapshot] Dati da ${collectionPath} ricevuti/aggiornati per ${uidToLoad}.`);
            if (docSnap.exists()) {
                const profileData = docSnap.data();
                // console.log('[AthenaDev Debug - onSnapshot] Dati grezzi:', JSON.parse(JSON.stringify(profileData)));
                updateProfilePageUI(profileData, isOwnProfile, uidToLoad);
            } else {
                // Documento profilo (privato o pubblico) non trovato
                document.title = 'Profilo Non Trovato - asyncDonkey.io';
                if (profileSectionTitle) profileSectionTitle.textContent = 'Profilo Non Trovato';
                if (profileLoadingMessage) profileLoadingMessage.style.display = 'none';
                if (profileLoginMessage) {
                    profileLoginMessage.style.display = 'block';
                    profileLoginMessage.innerHTML = `<p>Errore: Profilo utente con ID "${uidToLoad}" non trovato nella collezione ${collectionPath}.</p> <p><a href="index.html">Torna alla Homepage</a></p>`;
                }
                if (profileContent) profileContent.style.display = 'none';
                // Nascondi sezioni specifiche se il profilo non esiste
                if (myArticlesSection) myArticlesSection.style.display = 'none';
                if (avatarUploadSection) avatarUploadSection.style.display = 'none';
                if (statusMessageSection) statusMessageSection.style.display = 'none';
                if (externalLinksSection) externalLinksSection.style.display = 'none';
                if (bioSection) bioSection.style.display = 'none';
                if (badgesSection) badgesSection.style.display = 'none';
            }
        },
        (error) => {
            document.title = 'Errore Profilo - asyncDonkey.io';
            if (profileSectionTitle) profileSectionTitle.textContent = 'Errore Profilo';
            console.error(`[AthenaDev Debug - onSnapshot] Errore nel listener del profilo ${collectionPath}/${uidToLoad}:`, error);
            if (profileLoadingMessage) profileLoadingMessage.style.display = 'none';
            if (profileLoginMessage) {
                profileLoginMessage.style.display = 'block';
                profileLoginMessage.innerHTML = `<p>Errore caricamento profilo: ${error.message}</p>`;
            }
            if (profileContent) profileContent.style.display = 'none';
        }
    );
}

// --- FUNZIONI DI GESTIONE (la maggior parte rimane invariata) ---

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
    // Assicurati che externalLinkTitleInput, externalLinkUrlInput, editingLinkIndexInput,
    // externalLinkErrorDiv, saveExternalLinkBtn siano definite globalmente o passate correttamente.
    // Dall'analisi del tuo js/profile.js, queste sono definite come costanti globali nel modulo.

    const title = externalLinkTitleInput.value.trim();
    const url = externalLinkUrlInput.value.trim();
    const editingIndex = parseInt(editingLinkIndexInput.value, 10);

    if (!title || !url) {
        if (externalLinkErrorDiv) externalLinkErrorDiv.textContent = 'Titolo e URL sono obbligatori.';
        showToast('Titolo e URL sono obbligatori.', 'warning');
        return;
    }
    if (!isValidHttpUrl(url)) {
        // isValidHttpUrl è una funzione helper che dovresti avere nel file
        if (externalLinkErrorDiv) externalLinkErrorDiv.textContent = 'Inserisci un URL valido (http:// o https://).';
        showToast('URL non valido. Deve iniziare con http:// o https://', 'warning');
        return;
    }
    if (externalLinkErrorDiv) externalLinkErrorDiv.textContent = '';

    let currentLinks = Array.isArray(profileDataForDisplay.externalLinks)
        ? [...profileDataForDisplay.externalLinks]
        : [];
    if (editingIndex > -1) {
        // Modalità Modifica
        if (editingIndex < currentLinks.length) {
            currentLinks[editingIndex] = { title, url };
        } else {
            showToast('Errore: indice link da modificare non valido.', 'error');
            return;
        }
    } else {
        // Modalità Aggiungi
        if (currentLinks.length >= MAX_EXTERNAL_LINKS) {
            // MAX_EXTERNAL_LINKS è una costante (es. 5)
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
            updatedAt: serverTimestamp(), // <<< MODIFICA CHIAVE: da profileUpdatedAt a updatedAt
        });
        showToast(editingIndex > -1 ? 'Link aggiornato con successo!' : 'Link aggiunto con successo!', 'success');
        // onSnapshot dovrebbe aggiornare l'UI, incluso renderExternalLinks
        resetAndHideExternalLinkForm(); // Funzione helper per resettare e nascondere il form
    } catch (error) {
        console.error('Errore salvataggio link esterno:', error);
        showToast('Errore durante il salvataggio del link.', 'error');
        if (externalLinkErrorDiv) externalLinkErrorDiv.textContent = `Errore: ${error.message}`;
    } finally {
        if (saveExternalLinkBtn) {
            saveExternalLinkBtn.disabled = false;
            // Il testo del bottone viene resettato da resetAndHideExternalLinkForm
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
    if (!linkToDelete) {
        showToast('Link non trovato per eliminazione.', 'error');
        return;
    }

    // Assumendo che showConfirmationModal sia una funzione globale/importata
    const confirmed = await showConfirmationModal(
        'Conferma Eliminazione Link',
        `Sei sicuro di voler eliminare il link "${linkToDelete.title || 'Senza titolo'}"?`
    );
    if (!confirmed) {
        showToast('Eliminazione link annullata.', 'info');
        return;
    }

    let currentLinks = [...profileDataForDisplay.externalLinks];
    currentLinks.splice(indexToDelete, 1);

    const userProfileRef = doc(db, 'userProfiles', loggedInUser.uid);
    try {
        await updateDoc(userProfileRef, {
            externalLinks: currentLinks,
            updatedAt: serverTimestamp(), // <<< MODIFICA CHIAVE: da profileUpdatedAt a updatedAt
        });
        showToast('Link eliminato con successo!', 'success');
        // onSnapshot dovrebbe aggiornare l'UI
        // Se il form di modifica era aperto per il link eliminato, resettalo
        if (
            externalLinkFormContainer &&
            externalLinkFormContainer.style.display === 'block' &&
            editingLinkIndexInput &&
            parseInt(editingLinkIndexInput.value, 10) === indexToDelete
        ) {
            resetAndHideExternalLinkForm();
        }
    } catch (error) {
        console.error('Errore eliminazione link:', error);
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
    // statusMessageInput è una costante globale definita all'inizio del file js/profile.js
    if (!statusMessageInput /*|| !statusUpdateMessage || !statusMessageDisplay*/) {
        // statusUpdateMessage e statusMessageDisplay non sono cruciali per l'update stesso
        console.error('Elementi DOM per aggiornamento stato mancanti (input).');
        showToast('Errore interfaccia utente (input stato).', 'error');
        return;
    }
    const newStatus = statusMessageInput.value.trim();
    if (newStatus.length > 150) {
        if (statusUpdateMessage) statusUpdateMessage.textContent = 'Stato max 150 caratteri.'; // statusUpdateMessage è per i messaggi di errore UI
        showToast('Stato troppo lungo (max 150 caratteri).', 'warning');
        return;
    }
    // Opzionale: Verifica se lo stato è effettivamente cambiato prima di inviare
    if (newStatus === (profileDataForDisplay.statusMessage || '')) {
        showToast('Nessuna modifica allo stato.', 'info');
        return;
    }

    const updateBtn = updateStatusForm ? updateStatusForm.querySelector('button[type="submit"]') : null;
    if (updateBtn) {
        updateBtn.disabled = true;
        updateBtn.textContent = 'Aggiornamento...';
    }

    const userProfileRef = doc(db, 'userProfiles', loggedInUser.uid);
    try {
        await updateDoc(userProfileRef, {
            statusMessage: newStatus,
            updatedAt: serverTimestamp(), // << MODIFICA CORRETTA
        });
        showToast('Stato aggiornato!', 'success');
        if (statusMessageInput) statusMessageInput.value = ''; // Pulisci input dopo successo
        if (statusUpdateMessage) statusUpdateMessage.textContent = ''; // Pulisci messaggio errore
        // onSnapshot dovrebbe aggiornare statusMessageDisplay
    } catch (error) {
        console.error('Errore aggiornamento stato:', error);
        showToast(`Errore aggiornamento stato: ${error.message}`, 'error');
        if (statusUpdateMessage) statusUpdateMessage.textContent = `Errore: ${error.message}`;
    } finally {
        if (updateBtn) {
            updateBtn.disabled = false;
            updateBtn.textContent = 'Aggiorna';
        }
    }
}

function updateBioCharCounter() {
    if (bioInput && bioCurrentCharsSpan && bioCharCountDisplay) {
        const currentLength = bioInput.value.length;
        bioCurrentCharsSpan.textContent = currentLength;
        bioCharCountDisplay.style.color = currentLength > MAX_BIO_CHARS ? 'red' : 'var(--text-color-muted)';
        bioCharCountDisplay.title = currentLength > MAX_BIO_CHARS ? `Limite ${MAX_BIO_CHARS} caratteri superato.` : '';
    }
}

async function handleBioUpdate(event) {
    event.preventDefault();
    if (!loggedInUser || !profileDataForDisplay || profileDataForDisplay.userId !== loggedInUser.uid) {
        showToast('Devi essere loggato e sul tuo profilo per aggiornare la bio.', 'error');
        return;
    }
    // bioInput è una costante globale definita all'inizio del file js/profile.js
    if (!bioInput /*|| !bioUpdateMessage || !bioDisplay*/) {
        // bioUpdateMessage e bioDisplay non sono cruciali per l'update stesso
        console.error('Elementi DOM per aggiornamento bio mancanti (input).');
        showToast('Errore interfaccia utente (input bio).', 'error');
        return;
    }
    const newBio = bioInput.value; // Non fare trim() qui per permettere spazi intenzionali, Firestore rules non lo vietano
    if (newBio.length > MAX_BIO_CHARS) {
        // MAX_BIO_CHARS è una costante definita nel file (300)
        showToast(`Bio troppo lunga (max ${MAX_BIO_CHARS} caratteri).`, 'warning');
        return;
    }
    // Opzionale: Verifica se la bio è effettivamente cambiata
    if (newBio === (profileDataForDisplay.bio || '')) {
        showToast('Nessuna modifica alla bio.', 'info');
        return;
    }

    const updateBtn = updateBioForm ? updateBioForm.querySelector('button[type="submit"]') : null;
    if (updateBtn) {
        updateBtn.disabled = true;
        updateBtn.textContent = 'Salvataggio Bio...';
    }

    const userProfileRef = doc(db, 'userProfiles', loggedInUser.uid);
    try {
        await updateDoc(userProfileRef, {
            bio: newBio,
            updatedAt: serverTimestamp(), // << MODIFICA CORRETTA
        });
        showToast('Bio aggiornata!', 'success');
        if (bioInput) bioInput.value = ''; // Pulisci input dopo successo
        if (bioUpdateMessage) bioUpdateMessage.textContent = ''; // Pulisci messaggio errore
        updateBioCharCounter(); // Aggiorna il contatore caratteri
        // onSnapshot dovrebbe aggiornare bioDisplay
    } catch (error) {
        console.error('Errore aggiornamento bio:', error);
        showToast(`Errore aggiornamento bio: ${error.message}`, 'error');
        if (bioUpdateMessage) bioUpdateMessage.textContent = `Errore: ${error.message}`;
    } finally {
        if (updateBtn) {
            updateBtn.disabled = false;
            updateBtn.textContent = 'Salva Bio';
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
    const statusText =
        currentStatus === 'draft' ? 'bozza' : currentStatus === 'rejected' ? 'articolo respinto' : 'articolo';
    const userConfirmed = await showConfirmationModal(
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
            `${statusText.charAt(0).toUpperCase() + statusText.slice(1)} "${articleTitle || 'Senza Titolo'}" eliminato.`,
            'success'
        );
        if (loggedInUser) loadMyArticles(loggedInUser.uid); // Ricarica la lista
    } catch (error) {
        console.error(`Errore eliminazione ${statusText}:`, error);
        showToast(`Errore eliminazione. Riprova.`, 'error');
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
        reasonEl.innerHTML = `<strong>Motivo:</strong> ${article.rejectionReason}`; // Usa innerHTML per il bold
        cardDiv.appendChild(reasonEl);
    }
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'my-article-card-actions';
    // ... (logica bottoni azioni come nel tuo codice originale, non modificata)
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
        const resubmitButton = document.createElement('a'); // Nome cambiato per chiarezza
        resubmitButton.href = `submit-article.html?rejectedArticleId=${articleId}`;
        resubmitButton.className = 'game-button my-article-action-button';
        resubmitButton.textContent = 'Crea da Questo Articolo';
        resubmitButton.title =
            'Crea una nuova sottomissione pre-compilata con il contenuto di questo articolo respinto';
        actionsDiv.appendChild(resubmitButton);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'game-button my-article-action-button delete';
        deleteButton.textContent = 'Elimina Respinto';
        deleteButton.addEventListener('click', () => handleDeleteArticle(articleId, article.title, 'rejected'));
        actionsDiv.appendChild(deleteButton);
    }
    if (actionsDiv.hasChildNodes()) cardDiv.appendChild(actionsDiv);
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
                const q = query(
                    collection(db, 'articles'),
                    where('authorId', '==', userIdToLoadArticlesFor),
                    where('status', '==', S.status),
                    orderBy('updatedAt', 'desc')
                );
                const querySnapshot = await getDocs(q); // getDocs è corretto qui, non serve onSnapshot per lista articoli
                S.loadingMsg.style.display = 'none';
                if (querySnapshot.empty) S.listDiv.innerHTML = `<p>Nessun articolo "${S.title}".</p>`;
                else
                    querySnapshot.forEach((docSnapshot) =>
                        S.listDiv.appendChild(createMyArticleItemElement(docSnapshot.data(), docSnapshot.id))
                    );
            } catch (error) {
                console.error(`Errore caricamento articoli ${S.status}:`, error);
                S.loadingMsg.style.display = 'none';
                if (S.listDiv) S.listDiv.innerHTML = `<p>Errore caricamento articoli "${S.status}".</p>`;
            }
        }
    }
}

function openBadgeDetailsModal(badgeId) {
    if (!badgeDetailModal || !badgeDetailModalIcon || !badgeDetailModalName || !badgeDetailModalDescription) {
        console.error('Elementi modale badge non trovati.');
        return;
    }
    const badgeInfo = BADGE_DEFINITIONS[badgeId];
    if (!badgeInfo) {
        console.error(`Dettagli non trovati per badge: ${badgeId}`);
        return;
    }
    badgeDetailModalIcon.textContent = badgeInfo.icon;
    badgeDetailModalIcon.style.color = badgeInfo.color || 'inherit';
    badgeDetailModalIcon.className = 'material-symbols-rounded'; // Resetta classi per sicurezza
    if (badgeInfo.isNeon) badgeDetailModalIcon.classList.add('testo-neon-arcade');
    else if (badgeInfo.isAnimated && badgeInfo.animationClass)
        badgeDetailModalIcon.classList.add(badgeInfo.animationClass);
    badgeDetailModalName.textContent = badgeInfo.name;
    badgeDetailModalDescription.textContent = badgeInfo.description;
    badgeDetailModal.style.display = 'block';
}

function handleAvatarFileSelection(event) {
    const file = event.target.files[0];
    if (!file) {
        selectedAvatarFile = null;
        if (avatarPreview) avatarPreview.style.display = 'none';
        if (avatarPreviewPlaceholder) avatarPreviewPlaceholder.style.display = 'flex';
        if (confirmAvatarUploadBtn) confirmAvatarUploadBtn.style.display = 'none';
        if (avatarUploadStatus) avatarUploadStatus.textContent = '';
        return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showToast('Formato file non supportato (JPG, PNG, WebP).', 'error');
        if (avatarUploadStatus) avatarUploadStatus.textContent = 'Formato file non valido.';
        selectedAvatarFile = null;
        if (avatarUploadInput) avatarUploadInput.value = '';
        return;
    }
    const maxSize = MAX_AVATAR_SIZE_MB * 1024 * 1024;
    if (file.size > maxSize) {
        showToast(`File troppo grande (max ${MAX_AVATAR_SIZE_MB}MB).`, 'error');
        if (avatarUploadStatus) avatarUploadStatus.textContent = `File troppo grande (max ${MAX_AVATAR_SIZE_MB}MB).`;
        selectedAvatarFile = null;
        if (avatarUploadInput) avatarUploadInput.value = '';
        return;
    }
    selectedAvatarFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        if (avatarPreview) {
            avatarPreview.src = e.target.result;
            avatarPreview.style.display = 'block';
        }
        if (avatarPreviewPlaceholder) avatarPreviewPlaceholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
    if (confirmAvatarUploadBtn) confirmAvatarUploadBtn.style.display = 'inline-block';
    if (avatarUploadStatus) avatarUploadStatus.textContent = `File selezionato: ${file.name}`;
    if (avatarUploadProgressContainer) avatarUploadProgressContainer.style.display = 'none';
}

async function handleConfirmAvatarUpload() {
    if (!selectedAvatarFile || !loggedInUser) {
        showToast('Nessun file selezionato o utente non loggato.', 'warning');
        return;
    }
    if (confirmAvatarUploadBtn) {
        confirmAvatarUploadBtn.disabled = true;
        confirmAvatarUploadBtn.textContent = 'Caricamento...';
    }
    if (avatarUploadStatus) avatarUploadStatus.textContent = 'Inizio upload...';
    if (avatarUploadProgressContainer) avatarUploadProgressContainer.style.display = 'block';
    if (avatarUploadProgressBar) avatarUploadProgressBar.style.width = '0%';
    if (avatarUploadProgressText) avatarUploadProgressText.textContent = '0%';

    const fileExtension = selectedAvatarFile.name.split('.').pop();
    const filePath = `user-avatars/${loggedInUser.uid}/original_${Date.now()}.${fileExtension}`;
    const fileStorageRef = storageRef(storage, filePath);
    const uploadTask = uploadBytesResumable(fileStorageRef, selectedAvatarFile);

    uploadTask.on(
        'state_changed',
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (avatarUploadProgressBar) avatarUploadProgressBar.style.width = progress + '%';
            if (avatarUploadProgressText) avatarUploadProgressText.textContent = Math.round(progress) + '%';
        },
        (error) => {
            console.error('Errore upload avatar su Storage:', error);
            showToast(`Errore upload: ${error.code}`, 'error'); // Mostra error.code che è più utile a volte
            if (avatarUploadStatus) avatarUploadStatus.textContent = `Errore upload: ${error.code}`;
            if (confirmAvatarUploadBtn) {
                confirmAvatarUploadBtn.disabled = false;
                confirmAvatarUploadBtn.textContent = 'Conferma e Carica';
            }
            if (avatarUploadProgressContainer) avatarUploadProgressContainer.style.display = 'none';
            selectedAvatarFile = null;
            if (avatarUploadInput) avatarUploadInput.value = ''; // Resetta input
        },
        () => {
            // Upload completato con successo su Storage
            showToast('Immagine caricata! In attesa di elaborazione...', 'info', 7000);
            if (avatarUploadStatus)
                avatarUploadStatus.textContent = "Elaborazione in corso... L'immagine si aggiornerà a breve.";
            if (confirmAvatarUploadBtn) confirmAvatarUploadBtn.style.display = 'none'; // Nascondi bottone dopo successo
            if (avatarUploadInput) avatarUploadInput.value = '';
            if (avatarPreview) avatarPreview.style.display = 'none';
            if (avatarPreviewPlaceholder) avatarPreviewPlaceholder.style.display = 'flex';
            selectedAvatarFile = null; // Resetta file dopo upload per evitare re-upload accidentali

            // L'UI si aggiornerà grazie a onSnapshot in loadProfileData
            // Non è necessario un refresh manuale o un richiamo a loadProfileData

            // setTimeout per resettare il bottone se l'utente volesse caricare un altro file dopo un po'
            // Ma dato che nascondiamo il bottone, questo è meno rilevante.
            // setTimeout(() => {
            //    if (confirmAvatarUploadBtn) {
            //        confirmAvatarUploadBtn.disabled = false;
            //        confirmAvatarUploadBtn.textContent = 'Conferma e Carica';
            //    }
            // }, 1500);
        }
    );
}

// --- INIZIALIZZAZIONE ED EVENT LISTENERS GLOBALI ---
onAuthStateChanged(auth, (user) => {
    loggedInUser = user;
    const urlParams = new URLSearchParams(window.location.search);
    const profileUserIdFromUrl = urlParams.get('userId');

    if (currentProfileListenerUnsubscribe) {
        console.log(
            '[AthenaDev Debug - Auth] Annullamento iscrizione dal listener profilo precedente (cambio auth/utente).'
        );
        currentProfileListenerUnsubscribe();
        currentProfileListenerUnsubscribe = null;
    }

    if (profileUserIdFromUrl) {
        const isOwn = loggedInUser ? loggedInUser.uid === profileUserIdFromUrl : false;
        loadProfileData(profileUserIdFromUrl, isOwn); // Passa isOwn per caricare da userProfiles o userPublicProfiles
        if (isOwn) {
            if (myArticlesSection) myArticlesSection.style.display = 'block'; // Mostra la sezione articoli se è il profilo proprio
            loadMyArticles(profileUserIdFromUrl);
            // La visibilità di avatarUploadSection e altri form di modifica è gestita da updateProfilePageUI
        } else {
            if (myArticlesSection) myArticlesSection.style.display = 'none';
            // avatarUploadSection e altri form di modifica sono nascosti da updateProfilePageUI quando isOwnProfile è false
        }
    } else if (loggedInUser) {
        // Nessun userId nell'URL, ma l'utente è loggato -> carica il profilo dell'utente loggato
        loadProfileData(loggedInUser.uid, true); // È il profilo proprio
        if (myArticlesSection) myArticlesSection.style.display = 'block';
        loadMyArticles(loggedInUser.uid);
        // La visibilità di avatarUploadSection e altri form di modifica è gestita da updateProfilePageUI
    } else {
        // Utente non loggato e nessun userId nell'URL
        profileDataForDisplay = null; // Resetta dati locali
        if (profileContent) profileContent.style.display = 'none';
        if (profileLoadingMessage) profileLoadingMessage.style.display = 'none';
        if (profileLoginMessage) {
            profileLoginMessage.style.display = 'block';
            profileLoginMessage.innerHTML =
                '<p>Per visualizzare o modificare un profilo, <a href="register.html?authAction=login">accedi</a> o <a href="register.html?authAction=signup">registrati</a>.</p>';
        }
        // Nascondi tutte le sezioni specifiche del profilo
        if (emailVerificationBanner) emailVerificationBanner.style.display = 'none';
        if (statusMessageSection) statusMessageSection.style.display = 'none';
        if (externalLinksSection) externalLinksSection.style.display = 'none';
        if (manageExternalLinksUI) manageExternalLinksUI.style.display = 'none';
        if (bioSection) bioSection.style.display = 'none';
        if (badgesSection) badgesSection.style.display = 'none';
        if (myArticlesSection) myArticlesSection.style.display = 'none';
        if (avatarUploadSection) avatarUploadSection.style.display = 'none';
        
        document.title = 'Profilo Utente - asyncDonkey.io';
        if (profileSectionTitle) profileSectionTitle.textContent = 'Profilo Utente';
    }
});

// Event Listeners per i form e altri elementi interattivi
if (updateStatusForm) updateStatusForm.addEventListener('submit', handleStatusMessageUpdate);

if (resendVerificationEmailBtn && emailVerificationBanner) {
    // Assicurati che anche banner esista
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
                showToast('Errore invio email. Riprova.', 'error');
                if (resendEmailMessage) {
                    resendEmailMessage.textContent = `Errore: ${error.message}`;
                    resendEmailMessage.style.color = 'red';
                }
            } finally {
                setTimeout(() => {
                    // Timeout per riabilitare il bottone
                    if (resendVerificationEmailBtn) {
                        resendVerificationEmailBtn.disabled = false;
                        resendVerificationEmailBtn.textContent = 'Invia di nuovo email di verifica';
                    }
                }, 30000); // 30 secondi
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
            if (isVisible) {
                resetAndHideExternalLinkForm(); // Resetta se si sta nascondendo
            } else {
                resetAndHideExternalLinkForm(); // Resetta sempre prima di mostrare per pulire
                externalLinkFormContainer.style.display = 'block';
                toggleAddLinkFormBtn.textContent = 'Nascondi Form';
                if (externalLinkTitleInput) externalLinkTitleInput.focus();
            }
        }
    });
}

if (externalLinkForm) externalLinkForm.addEventListener('submit', handleExternalLinkFormSubmit);
if (cancelEditExtLinkBtn) cancelEditExtLinkBtn.addEventListener('click', resetAndHideExternalLinkForm);
if (bioInput) bioInput.addEventListener('input', updateBioCharCounter);
if (updateBioForm) updateBioForm.addEventListener('submit', handleBioUpdate);

if (selectAvatarFileBtn && avatarUploadInput) {
    selectAvatarFileBtn.addEventListener('click', () => avatarUploadInput.click());
}
if (avatarUploadInput) {
    avatarUploadInput.addEventListener('change', handleAvatarFileSelection);
}
if (confirmAvatarUploadBtn) {
    confirmAvatarUploadBtn.addEventListener('click', handleConfirmAvatarUpload);
}

document.addEventListener('DOMContentLoaded', () => {
    badgeDetailModal = document.getElementById('badgeDetailModal');
    if (badgeDetailModal) {
        closeBadgeDetailModalBtn = badgeDetailModal.querySelector('#closeBadgeDetailModalBtn');
        badgeDetailModalIcon = badgeDetailModal.querySelector('#badgeDetailModalIcon');
        badgeDetailModalName = badgeDetailModal.querySelector('#badgeDetailModalName');
        badgeDetailModalDescription = badgeDetailModal.querySelector('#badgeDetailModalDescription');
        if (closeBadgeDetailModalBtn) {
            closeBadgeDetailModalBtn.addEventListener('click', () => {
                badgeDetailModal.style.display = 'none';
            });
        }
        badgeDetailModal.addEventListener('click', (event) => {
            // Chiudi cliccando fuori dalla modale
            if (event.target === badgeDetailModal) badgeDetailModal.style.display = 'none';
        });
    }
    // Inizializza contatore bio se il campo è già visibile (es. proprio profilo)
    if (bioInput && bioInput.offsetParent !== null) updateBioCharCounter();
});
