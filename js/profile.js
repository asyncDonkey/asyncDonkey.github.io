// js/profile.js (Versione Definitiva Completa con Nickname Animation)
import { db, auth, generateBlockieAvatar, showConfirmationModal, escapeHTML } from './main.js';
import {
    doc,
    onSnapshot,
    updateDoc,
    collection,
    // addDoc, // Non usato direttamente, rimosso se non serve per altre parti non mostrate
    query,
    where,
    getDocs,
    orderBy,
    deleteDoc,
    serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';

import {
    getStorage,
    ref as storageRef,
    uploadBytesResumable,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

import { onAuthStateChanged, sendEmailVerification } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { showToast } from './toastNotifications.js';
import { getAuthorIconHTML, showInfoModal } from './uiUtils.js';

// --- RIFERIMENTI DOM ---
const profileSectionTitle = document.querySelector('#profile h2');
const profileContent = document.getElementById('profileContent');
const profileAvatarImg = document.getElementById('profileAvatar');
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
// const avatarPreview = document.getElementById('avatarPreview'); // Non usato nel tuo codice per la modale
// const avatarPreviewPlaceholder = document.getElementById('avatarPreviewPlaceholder'); // Non usato
// const confirmAvatarUploadBtn = document.getElementById('confirmAvatarUploadBtn'); // Non usato
const avatarUploadProgressContainer = document.getElementById('avatarUploadProgressContainer');
const avatarUploadProgressBar = document.getElementById('avatarUploadProgressBar');
const avatarUploadProgressText = document.getElementById('avatarUploadProgressText');
// const avatarUploadStatus = document.getElementById('avatarUploadStatus'); // Non usato
// const avatarConfirmationArea = document.getElementById('avatarConfirmationArea'); // Non usato

const avatarConfirmationModal = document.getElementById('avatarConfirmationModal');
const modalAvatarPreview = document.getElementById('modalAvatarPreview');
const modalAvatarStatus = document.getElementById('modalAvatarStatus');
const modalConfirmUploadBtn = document.getElementById('modalConfirmUploadBtn');
const modalCancelUploadBtn = document.getElementById('modalCancelUploadBtn');
const requestNicknameChangeBtn = document.getElementById('requestNicknameChangeBtn');
const requestNicknameChangeModal = document.getElementById('requestNicknameChangeModal');
const closeNicknameChangeModalBtn = document.getElementById('closeNicknameChangeModalBtn');
// const nicknameChangeModalTitle = document.getElementById('nicknameChangeModalTitle'); // Non usato attivamente
const nicknameChangeInitialView = document.getElementById('nicknameChangeInitialView');
const newNicknameInput = document.getElementById('newNicknameInput');
// const newNicknameHint = document.getElementById('newNicknameHint'); // Non usato nel tuo codice originale
const nicknameChangeError = document.getElementById('nicknameChangeError');
const submitNicknameChangeRequestBtn = document.getElementById('submitNicknameChangeRequestBtn');
const cancelNicknameChangeRequestBtn = document.getElementById('cancelNicknameChangeRequestBtn');
const nicknameChangeRequestSentView = document.getElementById('nicknameChangeRequestSentView');
const nicknameChangeCooldownView = document.getElementById('nicknameChangeCooldownView');
// const nicknameCooldownDaysSpan = document.getElementById('nicknameCooldownDays'); // Non usato
const nicknameChangeProcessedView = document.getElementById('nicknameChangeProcessedView');

// NUOVI RIFERIMENTI DOM per Nickname Animation
const customizeNicknameBtn = document.getElementById('customizeNicknameBtn');
const nicknameAnimationModal = document.getElementById('nicknameAnimationModal');
const closeNicknameAnimationModalBtn = document.getElementById('closeNicknameAnimationModalBtn');
const nicknameAnimationListUL = document.getElementById('nicknameAnimationList');
const noNicknameAnimationsMessage = document.getElementById('noNicknameAnimationsMessage');

// --- STATO DEL MODULO E COSTANTI ---
let loggedInUser = null;
let profileDataForDisplay = null;
let currentProfileListenerUnsubscribe = null;
let badgeDetailModal, closeBadgeDetailModalBtn, badgeDetailModalIcon, badgeDetailModalName, badgeDetailModalDescription;
let nicknameCooldownInterval = null;

const NICKNAME_CHANGE_COOLDOWN_DAYS = 90;
const NICKNAME_CHANGE_COOLDOWN_MS = NICKNAME_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
const MAX_EXTERNAL_LINKS = 5;
const MAX_BIO_CHARS = 300;
let selectedAvatarFile = null;
const MAX_AVATAR_SIZE_MB = 5;
const DEFAULT_AVATAR_IMAGE_PATH = 'assets/images/default-avatar.png';

const storage = getStorage();
const functions = getFunctions();

// =================================================================================
// --- SISTEMA DI GESTIONE BADGE DA FIRESTORE ---
// =================================================================================
let badgeDefinitionsCache = null;

async function fetchAndCacheBadgeDefinitions() {
    if (badgeDefinitionsCache) {
        return badgeDefinitionsCache;
    }
    try {
        const querySnapshot = await getDocs(collection(db, 'badgeDefinitions'));
        const badges = {};
        querySnapshot.forEach((doc) => {
            badges[doc.id] = doc.data();
        });
        badgeDefinitionsCache = badges;
        return badgeDefinitionsCache;
    } catch (error) {
        console.error('[AthenaDev] Errore nel caricare le definizioni dei badge:', error);
        showToast('Errore nel caricamento delle definizioni dei badge.', 'error');
        return {};
    }
}
fetchAndCacheBadgeDefinitions();

async function renderBadges(earnedBadgesArray = [], isOwnProfile) {
    if (!badgesSection || !badgesDisplayContainer || !noBadgesMessage) return;
    badgesDisplayContainer.innerHTML = '';
    if (earnedBadgesArray.length > 0 || isOwnProfile) {
        badgesSection.style.display = 'block';
    } else {
        badgesSection.style.display = 'none';
        return;
    }
    if (earnedBadgesArray.length === 0) {
        noBadgesMessage.textContent = 'Nessun riconoscimento ancora ottenuto.';
        noBadgesMessage.style.display = 'block';
        return;
    }
    noBadgesMessage.style.display = 'none';
    const badgeDefinitions = await fetchAndCacheBadgeDefinitions();
    if (Object.keys(badgeDefinitions).length === 0) {
        noBadgesMessage.textContent = 'Non è stato possibile caricare le informazioni sui badge.';
        noBadgesMessage.style.display = 'block';
        return;
    }
    earnedBadgesArray.forEach((badgeId) => {
        const badgeInfo = badgeDefinitions[badgeId];
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
            else if (badgeInfo.isAnimated && badgeInfo.animationClass) iconSpan.classList.add(badgeInfo.animationClass);
            badgeIconElement.appendChild(iconSpan);
            badgeIconElement.addEventListener('click', () => openBadgeDetailsModal(badgeId));
            badgeIconElement.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openBadgeDetailsModal(badgeId);
                }
            });
            badgesDisplayContainer.appendChild(badgeIconElement);
        } else {
            console.warn(`[AthenaDev] Definizione non trovata per il badge ID: ${badgeId}`);
        }
    });
}

async function handleShowAllBadgesInfo() {
    const badgesInfoBtn = document.getElementById('badgesInfoBtn');
    if (badgesInfoBtn) badgesInfoBtn.disabled = true;
    try {
        const badgeDefinitions = await fetchAndCacheBadgeDefinitions();
        if (!badgeDefinitions || Object.keys(badgeDefinitions).length === 0) {
            showInfoModal('Informazioni Badge', '<p>Non è stato possibile caricare le informazioni sui badge.</p>');
            return;
        }
        const sortedBadgeIds = Object.keys(badgeDefinitions).sort((a, b) =>
            (badgeDefinitions[a].name || '').localeCompare(badgeDefinitions[b].name || '')
        );
        let contentHtml = '<ul class="badge-info-list">';
        for (const badgeId of sortedBadgeIds) {
            const badge = badgeDefinitions[badgeId];
            const iconClass = `material-symbols-rounded badge-icon ${badge.isAnimated && badge.animationClass ? badge.animationClass : ''}`;
            const iconColor = badge.color || 'var(--text-color-primary)';
            contentHtml += `
                <li class="badge-info-item">
                    <span class="${iconClass}" style="color: ${iconColor};">${badge.icon}</span>
                    <div class="badge-details">
                        <span class="badge-name">${escapeHTML(badge.name)}</span>
                        <span class="badge-howto">${escapeHTML(badge.howToEarn || badge.description)}</span>
                    </div>
                </li>`;
        }
        contentHtml += '</ul>';
        showInfoModal('Come Ottenere i Riconoscimenti', contentHtml);
    } catch (error) {
        console.error('Errore nel mostrare la modale informativa dei badge:', error);
        showToast('Errore nel caricare le informazioni.', 'error');
    } finally {
        if (badgesInfoBtn) badgesInfoBtn.disabled = false;
    }
}

async function openBadgeDetailsModal(badgeId) {
    if (!badgeDetailModal || !badgeDetailModalIcon || !badgeDetailModalName || !badgeDetailModalDescription) {
        console.error('[AthenaDev] Elementi della modale badge non trovati nel DOM.');
        return;
    }
    const badgeDefinitions = await fetchAndCacheBadgeDefinitions();
    const badgeInfo = badgeDefinitions[badgeId];
    if (!badgeInfo) {
        console.error(`[AthenaDev] Dettagli non trovati per il badge: ${badgeId}`);
        showToast('Informazioni per questo badge non disponibili.', 'error');
        return;
    }
    badgeDetailModalIcon.textContent = badgeInfo.icon;
    badgeDetailModalIcon.style.color = badgeInfo.color || 'inherit';
    badgeDetailModalIcon.className = 'material-symbols-rounded';
    if (badgeInfo.isNeon) badgeDetailModalIcon.classList.add('testo-neon-arcade');
    else if (badgeInfo.isAnimated && badgeInfo.animationClass)
        badgeDetailModalIcon.classList.add(badgeInfo.animationClass);
    badgeDetailModalName.textContent = badgeInfo.name;
    badgeDetailModalDescription.textContent = badgeInfo.howToEarn || badgeInfo.description;
    badgeDetailModal.style.display = 'block';
}

/**
 * Restituisce l'HTML dell'icona e il colore basati sull'URL del link.
 * @param {string} url - L'URL del link esterno.
 * @returns {object} Un oggetto con { iconHtml: string, color: string }
 */
function getIconDetailsForExternalLink(url) {
    let iconHtml = '<span class="material-symbols-rounded external-link-icon">link</span>'; // Icona Material di default
    let iconColor = '#757575'; // Grigio di default (colore definito 'a mano')

    if (!url) return { iconHtml, color: iconColor };

    try {
        const hostname = new URL(url).hostname.toLowerCase();

        if (hostname.includes('github.com')) {
            iconHtml = '<i class="fab fa-github external-link-icon"></i>'; // Font Awesome
            iconColor = '#333333'; // Nero GitHub
        } else if (hostname.includes('linkedin.com')) {
            iconHtml = '<i class="fab fa-linkedin external-link-icon"></i>'; // Font Awesome
            iconColor = '#0077B5'; // Blu LinkedIn
        } else if (hostname.includes('x.com') || hostname.includes('twitter.com')) {
            iconHtml = '<i class="fab fa-twitter external-link-icon"></i>'; // Font Awesome (o fa-x-twitter se aggiornato)
            iconColor = '#1DA1F2'; // Blu Twitter
        } else if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
            iconHtml = '<i class="fab fa-youtube external-link-icon"></i>'; // Font Awesome
            iconColor = '#FF0000'; // Rosso YouTube
        } else if (hostname.includes('facebook.com')) {
            iconHtml = '<i class="fab fa-facebook external-link-icon"></i>'; // Font Awesome
            iconColor = '#1877F2'; // Blu Facebook
        } else if (hostname.includes('instagram.com')) {
            iconHtml = '<i class="fab fa-instagram external-link-icon"></i>'; // Font Awesome
            iconColor = '#E4405F'; // Rosa Instagram
        } else if (hostname.includes('t.me') || hostname.includes('telegram.org')) {
            iconHtml = '<i class="fab fa-telegram external-link-icon"></i>'; // Font Awesome
            iconColor = '#2CA5E0'; // Blu Telegram
        } else if (hostname.includes('medium.com')) {
            iconHtml = '<i class="fab fa-medium external-link-icon"></i>'; // Font Awesome
            iconColor = '#000000'; // Nero Medium
        } else if (hostname.includes('stackoverflow.com')) {
            iconHtml = '<i class="fab fa-stack-overflow external-link-icon"></i>'; // Font Awesome
            iconColor = '#F58025'; // Arancione StackOverflow
        } else if (hostname.includes('reddit.com')) {
            iconHtml = '<i class="fab fa-reddit-alien external-link-icon"></i>'; // Font Awesome
            iconColor = '#FF4500'; // Rosso-Arancio Reddit
        }
        // Aggiungi altri 'else if' per altri domini/servizi se necessario
        // Se nessun brand specifico viene riconosciuto, usa l'icona 'link' di Material Symbols
        // e il colore di default già impostati.
    } catch (e) {
        console.warn(`[AthenaDev] URL non valido per getIconDetailsForExternalLink: ${url}`, e);
        // Restituisce comunque l'icona e il colore di default
    }
    return { iconHtml, color: iconColor };
}

// =================================================================================
// --- FUNZIONI DI RENDERING E GESTIONE UI (PROFILO) ---
// =================================================================================
function renderExternalLinks(linksArray, isOwnProfile) {
    if (!externalLinksListUL || !noExternalLinksMessage) return;
    externalLinksListUL.innerHTML = '';

    // La sezione link è visibile solo se è il profilo dell'utente loggato
    // e l'elemento della sezione esiste.
    if (!isOwnProfile || !externalLinksSection) {
        if (externalLinksSection) externalLinksSection.style.display = 'none';
        return;
    }
    externalLinksSection.style.display = 'block';

    if (!linksArray || linksArray.length === 0) {
        if (noExternalLinksMessage) noExternalLinksMessage.style.display = 'list-item'; // Usa list-item per coerenza con <ul>
        return;
    }

    if (noExternalLinksMessage) noExternalLinksMessage.style.display = 'none';

    linksArray.forEach((link, index) => {
        const li = document.createElement('li');

        // --- INIZIO MODIFICHE PER ICONA ---
        const iconDetails = getIconDetailsForExternalLink(link.url);
        const iconElement = document.createElement('span'); // Usiamo span per contenere l'HTML dell'icona
        iconElement.innerHTML = iconDetails.iconHtml;
        // Applica il colore direttamente all'icona (o al suo primo figlio se è un <i> dentro lo <span>)
        const actualIconTag = iconElement.firstChild;
        if (actualIconTag) {
            actualIconTag.style.color = iconDetails.color;
            // Aggiungiamo una classe generica per lo stile comune (es. margini)
            // La classe specifica (fab fa-github o material-symbols-rounded) è già nell'innerHTML.
            actualIconTag.classList.add('external-link-icon-base-style');
        }
        li.appendChild(iconElement); // Aggiungi l'icona al li
        // --- FINE MODIFICHE PER ICONA ---

        const linkDisplayDiv = document.createElement('div');
        linkDisplayDiv.className = 'link-display'; // Questo div ora conterrà solo il testo

        const anchor = document.createElement('a');
        anchor.href = link.url;
        anchor.textContent = link.title || 'Link senza titolo';
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        linkDisplayDiv.appendChild(anchor);

        // Opzionale: mostrare l'URL completo potrebbe essere ridondante con le icone,
        // ma lo manteniamo per ora. Potresti volerlo rimuovere o nascondere.
        const urlSpan = document.createElement('span');
        urlSpan.className = 'link-url';
        urlSpan.textContent = ` (${new URL(link.url).hostname})`; // Mostra solo l'hostname per pulizia
        linkDisplayDiv.appendChild(urlSpan);

        li.appendChild(linkDisplayDiv);

        // Le azioni rimangono uguali, ma assicurati che siano allineate correttamente con flexbox
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

async function updateProfilePageUI(data, isOwnProfile, uidLoaded) {
    profileDataForDisplay = { ...data, userId: uidLoaded, isPublicSnapshot: !isOwnProfile };
    const profileNameForTitle = data.nickname || 'Utente';
    document.title = `Profilo di ${profileNameForTitle} - asyncDonkey.io`;
    if (profileSectionTitle) {
        profileSectionTitle.textContent = isOwnProfile ? 'Il Mio Profilo' : `Profilo di ${profileNameForTitle}`;
    }

    if (profileEmailRow) profileEmailRow.style.display = isOwnProfile && data.email ? 'flex' : 'none';
    if (profileEmailSpan && isOwnProfile) profileEmailSpan.textContent = data.email || 'N/A';

    // Gestione NICKNAME e STILE NICKNAME
    if (currentNicknameSpan) {
        const nicknameText = data.nickname || 'Non impostato';
        const authorIcon = getAuthorIconHTML(data); // Funzione esistente
        const currentAnimationClass = data.activeNicknameAnimation || '';

        currentNicknameSpan.className = ''; // Pulisce classi di animazione precedenti
        if (currentAnimationClass) {
            currentNicknameSpan.classList.add(currentAnimationClass);
        }
        currentNicknameSpan.innerHTML = escapeHTML(nicknameText) + authorIcon;
    }

    // VISIBILITÀ PULSANTI NICKNAME
    if (requestNicknameChangeBtn) {
        requestNicknameChangeBtn.style.display = isOwnProfile ? 'inline-flex' : 'none';
    }
    if (customizeNicknameBtn) {
        // Gestione visibilità nuovo pulsante
        customizeNicknameBtn.style.display = isOwnProfile ? 'inline-flex' : 'none';
    }

    const testZoneLink = document.getElementById('testZoneLink');
    if (testZoneLink) {
        // Assicurati che l'elemento esista
        if (isOwnProfile && data.isTestUser === true) {
            testZoneLink.style.display = 'inline-flex'; // o 'inline-block' a seconda dello stile desiderato per l'icona
        } else {
            testZoneLink.style.display = 'none';
        }
    }

    if (profileNationalitySpan) {
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

    // Aggiunto per mostrare la data di registrazione
const registrationDateSpan = document.getElementById('registrationDate');
if (registrationDateSpan) {
    // La data di creazione è un dato privato di Auth, la mostriamo solo al proprietario del profilo.
    if (isOwnProfile && loggedInUser && loggedInUser.metadata.creationTime) {
        registrationDateSpan.textContent = new Date(loggedInUser.metadata.creationTime).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        // Assicuriamoci che il paragrafo contenitore sia visibile
        if(registrationDateSpan.parentElement) registrationDateSpan.parentElement.style.display = 'block';
    } else {
        // Se non siamo sul nostro profilo o il dato non è disponibile, nascondiamo l'intera riga.
        if(registrationDateSpan.parentElement) registrationDateSpan.parentElement.style.display = 'none';
    }
}

    if (profileAvatarImg) {
        let avatarSrcToSet;
        let altText = `${profileNameForTitle}'s Avatar`;
        let cacheBusterTimestamp = null;
        let mainAvatarUrl = null;
        if (isOwnProfile && data.avatarUrls && data.avatarUrls.profile) {
            mainAvatarUrl = data.avatarUrls.profile;
            cacheBusterTimestamp = data.profileUpdatedAt;
        } else if (!isOwnProfile && data.avatarUrls && data.avatarUrls.thumbnail) {
            mainAvatarUrl = data.avatarUrls.thumbnail;
            cacheBusterTimestamp = data.profilePublicUpdatedAt; // Sincronizzato da userPublicProfileSync
        } else if (isOwnProfile && data.avatarUrls && data.avatarUrls.small) {
            // Fallback per avatar profilo
            mainAvatarUrl = data.avatarUrls.small;
            cacheBusterTimestamp = data.profileUpdatedAt;
        }

        if (mainAvatarUrl) {
            altText = `${profileNameForTitle}'s Custom Avatar`;
            if (cacheBusterTimestamp && cacheBusterTimestamp.seconds) {
                avatarSrcToSet = `${mainAvatarUrl}?v=${cacheBusterTimestamp.seconds}`;
            } else if (cacheBusterTimestamp instanceof Date) {
                // Se fosse un oggetto Date JS
                avatarSrcToSet = `${mainAvatarUrl}?v=${cacheBusterTimestamp.getTime()}`;
            } else {
                avatarSrcToSet = mainAvatarUrl;
            }
        } else if (uidLoaded) {
            avatarSrcToSet = generateBlockieAvatar(uidLoaded, 120, { size: 10, scale: 6 }); // Aumentate dimensioni per profilo
            altText = `${profileNameForTitle}'s Blockie Avatar`;
        } else {
            avatarSrcToSet = DEFAULT_AVATAR_IMAGE_PATH;
            altText = `${profileNameForTitle}'s Default Avatar`;
        }
        profileAvatarImg.src = avatarSrcToSet;
        profileAvatarImg.alt = altText;
        profileAvatarImg.onerror = () => {
            console.warn(`[AthenaDev] Errore caricamento avatar: ${profileAvatarImg.src}. Fallback.`);
            if (uidLoaded) {
                profileAvatarImg.src = generateBlockieAvatar(uidLoaded, 120, { size: 10, scale: 6 });
                profileAvatarImg.alt = `${profileNameForTitle}'s Blockie Avatar (fallback errore)`;
            } else {
                profileAvatarImg.src = DEFAULT_AVATAR_IMAGE_PATH;
                profileAvatarImg.alt = `${profileNameForTitle}'s Default Avatar (fallback errore critico)`;
            }
            profileAvatarImg.onerror = null; // Evita loop se anche il fallback fallisce
        };
    }

    if (statusMessageSection && statusMessageDisplay) {
        if (data.statusMessage && data.statusMessage.trim() !== '') {
            statusMessageSection.style.display = 'block';
            statusMessageDisplay.textContent = data.statusMessage;
        } else {
            if (isOwnProfile) {
                statusMessageSection.style.display = 'block';
                statusMessageDisplay.innerHTML =
                    '<p style="color: var(--text-color-muted);">Nessuno stato d\'animo impostato. Scrivine uno qui sotto!</p>';
            } else {
                statusMessageSection.style.display = 'none';
            }
        }
    }

    if (bioSection) bioSection.style.display = 'block';
    if (bioDisplay) {
        if (data.bio && data.bio.trim() !== '') {
            bioDisplay.textContent = data.bio;
        } else {
            if (isOwnProfile) {
                bioDisplay.innerHTML = `<p style="color: var(--text-color-muted);">Nessuna bio ancora scritta. Aggiungine una qui sotto!</p>`;
            } else {
                bioDisplay.innerHTML = `<p style="color: var(--text-color-muted);">Questo utente non ha ancora scritto una bio.</p>`;
            }
        }
    }
    await renderBadges(data.earnedBadges || [], isOwnProfile);

    if (isOwnProfile) {
        if (emailVerificationBanner && loggedInUser && !loggedInUser.emailVerified) {
            emailVerificationBanner.style.display = 'block';
            if (resendEmailMessage) resendEmailMessage.textContent = '';
        } else if (emailVerificationBanner) {
            emailVerificationBanner.style.display = 'none';
        }
        if (updateStatusForm) {
            updateStatusForm.style.display = 'flex'; // o 'block' se preferisci
            if (statusMessageInput)
                statusMessageInput.placeholder = data.statusMessage
                    ? 'Modifica il tuo stato attuale...'
                    : 'Come ti senti oggi?';
        }
        if (updateBioForm) {
            updateBioForm.style.display = 'block';
            if (bioInput) bioInput.placeholder = data.bio ? 'Modifica la tua bio...' : 'Scrivi qualcosa di te...';
        }
        if (manageExternalLinksUI) manageExternalLinksUI.style.display = 'block';
        renderExternalLinks(data.externalLinks || [], true);
        updateBioCharCounter(); // Chiama per inizializzare
        if (avatarUploadSection) avatarUploadSection.style.display = 'block'; // o 'flex' o 'grid'
    } else {
        if (emailVerificationBanner) emailVerificationBanner.style.display = 'none';
        if (updateStatusForm) updateStatusForm.style.display = 'none';
        if (updateBioForm) updateBioForm.style.display = 'none';
        if (manageExternalLinksUI) manageExternalLinksUI.style.display = 'none';
        if (externalLinksSection) externalLinksSection.style.display = 'none';
        if (avatarUploadSection) avatarUploadSection.style.display = 'none';
    }

    if (profileLoadingMessage) profileLoadingMessage.style.display = 'none';
    if (profileContent) profileContent.style.display = 'block';
}

function loadProfileData(uidToLoad, isOwnProfile) {
    const guestMsgDiv = document.getElementById('guestProfileViewMessage');
    if (profileLoadingMessage) profileLoadingMessage.style.display = 'block';
    if (profileContent) profileContent.style.display = 'none';
    if (profileLoginMessage) profileLoginMessage.style.display = 'none';
    if (guestMsgDiv) guestMsgDiv.style.display = 'none';

    if (profileAvatarImg) {
        if (uidToLoad) {
            profileAvatarImg.src = generateBlockieAvatar(uidToLoad, 120, { size: 10, scale: 6 });
            profileAvatarImg.alt = 'Caricamento avatar... (Blockie)';
        } else {
            profileAvatarImg.src = ''; // O un placeholder
            profileAvatarImg.alt = 'Caricamento avatar...';
        }
        profileAvatarImg.style.display = 'block'; // Assicurati sia visibile
    }
    if (profileEmailSpan) profileEmailSpan.textContent = 'Caricamento...';
    if (currentNicknameSpan) currentNicknameSpan.textContent = 'Caricamento...';
    if (profileNationalitySpan) profileNationalitySpan.textContent = 'Caricamento...';
    if (statusMessageDisplay) statusMessageDisplay.textContent = 'Caricamento stato...';
    if (bioDisplay) bioDisplay.innerHTML = '<p style="color: var(--text-color-muted);">Caricamento bio...</p>';
    if (badgesDisplayContainer) badgesDisplayContainer.innerHTML = '';
    if (noBadgesMessage) noBadgesMessage.style.display = 'none';

    if (currentProfileListenerUnsubscribe) {
        currentProfileListenerUnsubscribe();
        currentProfileListenerUnsubscribe = null;
    }
    const collectionPath = isOwnProfile ? 'userProfiles' : 'userPublicProfiles';
    const userProfileRef = doc(db, collectionPath, uidToLoad);
    currentProfileListenerUnsubscribe = onSnapshot(
        userProfileRef,
        async (docSnap) => {
            if (profileLoadingMessage) profileLoadingMessage.style.display = 'none';
            if (docSnap.exists()) {
                const profileData = docSnap.data();
                await updateProfilePageUI(profileData, isOwnProfile, uidToLoad);
                if (guestMsgDiv) {
                    if (!isOwnProfile && !loggedInUser) {
                        guestMsgDiv.style.display = 'block';
                        const loginLink = guestMsgDiv.querySelector('#guestProfileLoginLink');
                        if (loginLink && !loginLink.hasAttribute('data-listener-attached')) {
                            loginLink.addEventListener('click', (e) => {
                                e.preventDefault();
                                const showLoginBtnGlobal = document.getElementById('showLoginBtn');
                                if (showLoginBtnGlobal) showLoginBtnGlobal.click();
                            });
                            loginLink.setAttribute('data-listener-attached', 'true');
                        }
                    } else {
                        guestMsgDiv.style.display = 'none';
                    }
                }
                if (profileContent) profileContent.style.display = 'block';
                if (profileLoginMessage) profileLoginMessage.style.display = 'none';
            } else {
                document.title = 'Profilo Non Trovato - asyncDonkey.io';
                if (profileSectionTitle) profileSectionTitle.textContent = 'Profilo Non Trovato';
                if (profileContent) profileContent.style.display = 'none';
                if (profileLoginMessage) {
                    profileLoginMessage.style.display = 'block';
                    profileLoginMessage.innerHTML = `<p>Errore: Profilo utente con ID "${uidToLoad}" non trovato.</p> <p><a href="index.html">Torna alla Homepage</a></p>`;
                }
                if (guestMsgDiv) guestMsgDiv.style.display = 'none';
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
            console.error(
                `[AthenaDev Debug - onSnapshot] Errore nel listener del profilo ${collectionPath}/${uidToLoad}:`,
                error
            );
            if (profileLoadingMessage) profileLoadingMessage.style.display = 'none';
            if (profileContent) profileContent.style.display = 'none';
            if (profileLoginMessage) {
                profileLoginMessage.style.display = 'block';
                profileLoginMessage.innerHTML = `<p>Si è verificato un errore durante il caricamento del profilo. Riprova più tardi.</p>`;
            }
            if (guestMsgDiv) guestMsgDiv.style.display = 'none';
        }
    );
}

// =================================================================================
// --- NUOVA LOGICA PER MODALE PERSONALIZZAZIONE NICKNAME ---
// =================================================================================

async function openNicknameAnimationModal() {
    if (
        !nicknameAnimationModal ||
        !nicknameAnimationListUL ||
        !noNicknameAnimationsMessage ||
        !profileDataForDisplay ||
        !loggedInUser
    ) {
        console.error('Elementi modale animazione nickname, dati profilo o utente loggato mancanti.');
        showToast("Errore nell'aprire la personalizzazione.", 'error');
        return;
    }

    nicknameAnimationListUL.innerHTML = '';
    const badgeDefinitions = await fetchAndCacheBadgeDefinitions();
    const earnedBadges = profileDataForDisplay.earnedBadges || [];
    const activeUserAnimation = profileDataForDisplay.activeNicknameAnimation || null;

    let availableAnimationsCount = 0;

    for (const badgeId of earnedBadges) {
        const badgeDef = badgeDefinitions[badgeId];
        if (badgeDef && badgeDef.nicknameAnimationClass) {
            availableAnimationsCount++;
            const li = document.createElement('li');
            li.className = 'animation-list-item';

            const previewText = document.createElement('span');
            previewText.className = `animation-preview-text ${badgeDef.nicknameAnimationClass}`;
            previewText.textContent = badgeDef.name;
            previewText.title = `Animazione sbloccata da: ${badgeDef.name}`;

            const toggleLabel = document.createElement('label');
            toggleLabel.className = 'switch';
            const toggleInput = document.createElement('input');
            toggleInput.type = 'checkbox';
            toggleInput.dataset.animationClass = badgeDef.nicknameAnimationClass;
            toggleInput.checked = activeUserAnimation === badgeDef.nicknameAnimationClass;
            toggleInput.addEventListener('change', handleNicknameAnimationToggle);

            const sliderSpan = document.createElement('span');
            sliderSpan.className = 'slider round';

            toggleLabel.appendChild(toggleInput);
            toggleLabel.appendChild(sliderSpan);

            li.appendChild(previewText);
            li.appendChild(toggleLabel);
            nicknameAnimationListUL.appendChild(li);
        }
    }

    if (availableAnimationsCount === 0) {
        noNicknameAnimationsMessage.style.display = 'block';
        nicknameAnimationListUL.style.display = 'none';
    } else {
        noNicknameAnimationsMessage.style.display = 'none';
        nicknameAnimationListUL.style.display = 'block';
    }
    nicknameAnimationModal.style.display = 'flex';
}

async function handleNicknameAnimationToggle(event) {
    if (!loggedInUser || !profileDataForDisplay || profileDataForDisplay.userId !== loggedInUser.uid) {
        showToast('Azione non permessa.', 'error');
        if (event.target) event.target.checked = !event.target.checked;
        return;
    }

    const selectedAnimationClass = event.target.dataset.animationClass;
    const isChecked = event.target.checked;
    let newActiveAnimation = null;

    if (isChecked) {
        newActiveAnimation = selectedAnimationClass;
    }

    if (isChecked) {
        const allToggles = nicknameAnimationListUL.querySelectorAll('input[type="checkbox"]');
        allToggles.forEach((toggle) => {
            if (toggle !== event.target) {
                toggle.checked = false;
            }
        });
    }

    try {
        const userProfileRef = doc(db, 'userProfiles', loggedInUser.uid);
        await updateDoc(userProfileRef, {
            activeNicknameAnimation: newActiveAnimation,
            updatedAt: serverTimestamp(),
        });
        showToast(newActiveAnimation ? 'Stile nickname applicato!' : 'Stile nickname rimosso.', 'success');

        if (currentNicknameSpan && profileDataForDisplay) {
            currentNicknameSpan.className = '';
            if (newActiveAnimation) {
                currentNicknameSpan.classList.add(newActiveAnimation);
            }
            const nicknameText = profileDataForDisplay.nickname || 'Non impostato';
            const authorIcon = getAuthorIconHTML(profileDataForDisplay);
            currentNicknameSpan.innerHTML = escapeHTML(nicknameText) + authorIcon;
            profileDataForDisplay.activeNicknameAnimation = newActiveAnimation; // Update local state
        }
    } catch (error) {
        console.error('Errore aggiornamento stile nickname:', error);
        showToast("Errore durante l'aggiornamento dello stile.", 'error');
        if (event.target) event.target.checked = !event.target.checked;
    }
}

function closeNicknameAnimationModal() {
    if (nicknameAnimationModal) {
        nicknameAnimationModal.style.display = 'none';
    }
}

// --- FUNZIONI DI GESTIONE ESISTENTI ---
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
        if (externalLinkErrorDiv) externalLinkErrorDiv.textContent = 'Inserisci un URL valido (http:// o https://).';
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
        resetAndHideExternalLinkForm();
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
            updatedAt: serverTimestamp(),
        });
        showToast('Link eliminato con successo!', 'success');
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
    if (!statusMessageInput) {
        console.error('Elementi DOM per aggiornamento stato mancanti (input).');
        showToast('Errore interfaccia utente (input stato).', 'error');
        return;
    }
    const newStatus = statusMessageInput.value.trim();
    if (newStatus.length > 150) {
        if (statusUpdateMessage) statusUpdateMessage.textContent = 'Stato max 150 caratteri.';
        showToast('Stato troppo lungo (max 150 caratteri).', 'warning');
        return;
    }
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
            updatedAt: serverTimestamp(),
        });
        showToast('Stato aggiornato!', 'success');
        if (statusMessageInput) statusMessageInput.value = '';
        if (statusUpdateMessage) statusUpdateMessage.textContent = '';
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

async function checkForPendingNicknameChange(userId) {
    if (!userId) return false;
    const requestsRef = collection(db, 'nicknameChangeRequests');
    const q = query(requestsRef, where('userId', '==', userId), where('status', '==', 'pending'));
    try {
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error('Errore nel controllo delle richieste di nickname pendenti:', error);
        showToast('Errore nel verificare lo stato della richiesta. Riprova.', 'error');
        return false;
    }
}

function startCooldownTimer(cooldownEndDate) {
    const timerElement = document.getElementById('nicknameCooldownTimer');
    if (!timerElement) return;
    if (nicknameCooldownInterval) {
        clearInterval(nicknameCooldownInterval);
    }
    nicknameCooldownInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = cooldownEndDate.getTime() - now;
        if (distance < 0) {
            clearInterval(nicknameCooldownInterval);
            timerElement.textContent = 'Cooldown terminato! Puoi fare una nuova richiesta.';
            closeNicknameChangeModal();
            openNicknameChangeModal();
            return;
        }
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        timerElement.textContent = `${days}g ${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
}

function getNicknameCooldownStatus(profileData) {
    if (profileData && profileData.lastNicknameRequestTimestamp) {
        const lastRequestDate = profileData.lastNicknameRequestTimestamp.toDate();
        const now = new Date();
        const timeSinceLastRequest = now.getTime() - lastRequestDate.getTime();
        if (timeSinceLastRequest < NICKNAME_CHANGE_COOLDOWN_MS) {
            const remainingMs = NICKNAME_CHANGE_COOLDOWN_MS - timeSinceLastRequest;
            const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
            return { inCooldown: true, daysRemaining: remainingDays };
        }
    }
    return { inCooldown: false, daysRemaining: 0 };
}

function renderNicknameModalView(viewToShowID) {
    const views = [
        nicknameChangeInitialView,
        nicknameChangeRequestSentView,
        nicknameChangeCooldownView,
        nicknameChangeProcessedView,
    ];
    views.forEach((view) => {
        if (view) {
            view.style.display = view.id === viewToShowID ? 'block' : 'none';
        }
    });
}

async function openNicknameChangeModal() {
    if (!requestNicknameChangeModal || !loggedInUser) {
        showToast('Errore: modale o utente non disponibile.', 'error');
        return;
    }
    if (!profileDataForDisplay || profileDataForDisplay.userId !== loggedInUser.uid) {
        showToast('Puoi richiedere il cambio nickname solo dal tuo profilo.', 'warning');
        return;
    }
    if (newNicknameInput) newNicknameInput.value = '';
    if (nicknameChangeError) nicknameChangeError.textContent = '';
    const hasPendingRequest = await checkForPendingNicknameChange(loggedInUser.uid);
    if (hasPendingRequest) {
        renderNicknameModalView('nicknameChangeRequestSentView');
        requestNicknameChangeModal.style.display = 'flex';
        return;
    }
    const cooldownStatus = getNicknameCooldownStatus(profileDataForDisplay);
    if (cooldownStatus.inCooldown) {
        renderNicknameModalView('nicknameChangeCooldownView');
        const lastRequestDate = profileDataForDisplay.lastNicknameRequestTimestamp.toDate();
        const cooldownEndDate = new Date(lastRequestDate.getTime() + NICKNAME_CHANGE_COOLDOWN_MS);
        startCooldownTimer(cooldownEndDate);
        requestNicknameChangeModal.style.display = 'flex';
        return;
    }
    renderNicknameModalView('nicknameChangeInitialView');
    requestNicknameChangeModal.style.display = 'flex';
    if (newNicknameInput) newNicknameInput.focus();
}

function closeNicknameChangeModal() {
    if (requestNicknameChangeModal) {
        requestNicknameChangeModal.style.display = 'none';
    }
    if (nicknameCooldownInterval) {
        clearInterval(nicknameCooldownInterval);
        nicknameCooldownInterval = null;
    }
}

async function handleSubmitNicknameChangeRequest() {
    if (
        !loggedInUser ||
        !profileDataForDisplay ||
        !newNicknameInput ||
        !nicknameChangeError ||
        !submitNicknameChangeRequestBtn
    ) {
        showToast('Errore: componenti UI o dati utente mancanti.', 'error');
        return;
    }
    const requestedNickname = newNicknameInput.value.trim();
    if (requestedNickname.length < 3 || requestedNickname.length > 20) {
        nicknameChangeError.textContent = 'Il nickname deve avere tra 3 e 20 caratteri.';
        newNicknameInput.focus();
        return;
    }
    const nicknameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!nicknameRegex.test(requestedNickname)) {
        nicknameChangeError.textContent = "Il nickname può contenere solo lettere, numeri, '_' e '-'.";
        newNicknameInput.focus();
        return;
    }
    if (requestedNickname === profileDataForDisplay.nickname) {
        nicknameChangeError.textContent = 'Il nuovo nickname deve essere diverso da quello attuale.';
        newNicknameInput.focus();
        return;
    }
    nicknameChangeError.textContent = '';
    submitNicknameChangeRequestBtn.disabled = true;
    submitNicknameChangeRequestBtn.textContent = 'Invio in corso...';
    const requestNicknameChange = httpsCallable(functions, 'requestNicknameChange');
    try {
        const result = await requestNicknameChange({ requestedNickname: requestedNickname });
        if (result.data.success) {
            showToast('Richiesta di cambio nickname inviata con successo!', 'success');
            renderNicknameModalView('nicknameChangeRequestSentView');
            if (requestNicknameChangeBtn) requestNicknameChangeBtn.style.display = 'none';
        } else {
            throw new Error(result.data.message || 'Errore sconosciuto dalla funzione.');
        }
    } catch (error) {
        console.error("Errore durante la chiamata alla funzione 'requestNicknameChange':", error);
        const errorMessage = error.message || 'Si è verificato un errore. Riprova più tardi.';
        nicknameChangeError.textContent = errorMessage;
        showToast(errorMessage, 'error');
    } finally {
        submitNicknameChangeRequestBtn.disabled = false;
        submitNicknameChangeRequestBtn.textContent = 'Invia Richiesta';
    }
}

function initializeNicknameChangeModalListeners() {
    if (requestNicknameChangeBtn) requestNicknameChangeBtn.addEventListener('click', openNicknameChangeModal);
    if (closeNicknameChangeModalBtn) closeNicknameChangeModalBtn.addEventListener('click', closeNicknameChangeModal);
    if (cancelNicknameChangeRequestBtn)
        cancelNicknameChangeRequestBtn.addEventListener('click', closeNicknameChangeModal);
    if (requestNicknameChangeModal) {
        requestNicknameChangeModal.addEventListener('click', (event) => {
            if (event.target === requestNicknameChangeModal) closeNicknameChangeModal();
        });
    }
    if (submitNicknameChangeRequestBtn)
        submitNicknameChangeRequestBtn.addEventListener('click', handleSubmitNicknameChangeRequest);
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
    if (!bioInput) {
        console.error('Elementi DOM per aggiornamento bio mancanti (input).');
        showToast('Errore interfaccia utente (input bio).', 'error');
        return;
    }
    const newBio = bioInput.value;
    if (newBio.length > MAX_BIO_CHARS) {
        showToast(`Bio troppo lunga (max ${MAX_BIO_CHARS} caratteri).`, 'warning');
        return;
    }
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
            updatedAt: serverTimestamp(),
        });
        showToast('Bio aggiornata!', 'success');
        // if (bioInput) bioInput.value = ''; // Commentato per non svuotare il campo
        if (bioUpdateMessage) bioUpdateMessage.textContent = '';
        updateBioCharCounter();
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
        if (loggedInUser) loadMyArticles(loggedInUser.uid);
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
        reasonEl.innerHTML = `<strong>Motivo:</strong> ${escapeHTML(article.rejectionReason)}`;
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
        const resubmitButton = document.createElement('a');
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
                const querySnapshot = await getDocs(q);
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

function closeModalAndReset() {
    if (avatarConfirmationModal) avatarConfirmationModal.style.display = 'none';
    selectedAvatarFile = null;
    if (avatarUploadInput) avatarUploadInput.value = '';
    if (modalConfirmUploadBtn) modalConfirmUploadBtn.disabled = false;
    if (modalCancelUploadBtn) modalCancelUploadBtn.disabled = false;
    if (avatarUploadProgressContainer) avatarUploadProgressContainer.style.display = 'none';
    if (avatarUploadProgressBar) avatarUploadProgressBar.style.width = '0%';
    if (avatarUploadProgressText) avatarUploadProgressText.textContent = '0%';
}

function handleAvatarFileSelection(event) {
    const file = event.target.files[0];
    const cleanup = () => {
        selectedAvatarFile = null;
        if (avatarUploadInput) avatarUploadInput.value = '';
    };
    if (!file) {
        cleanup();
        return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showToast('Formato file non supportato (JPEG, PNG, WebP).', 'error');
        cleanup();
        return;
    }
    const maxSize = MAX_AVATAR_SIZE_MB * 1024 * 1024;
    if (file.size > maxSize) {
        showToast(`File troppo grande (max ${MAX_AVATAR_SIZE_MB}MB).`, 'error');
        cleanup();
        return;
    }
    selectedAvatarFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        if (modalAvatarPreview) modalAvatarPreview.src = e.target.result;
    };
    reader.readAsDataURL(file);
    if (modalAvatarStatus) modalAvatarStatus.textContent = `Caricare il file: ${file.name}?`;
    if (avatarConfirmationModal) avatarConfirmationModal.style.display = 'flex';
}

async function handleConfirmAvatarUpload() {
    if (!selectedAvatarFile || !loggedInUser) {
        if (avatarConfirmationModal) closeModalAndReset();
        return showToast('Nessun file selezionato o utente non loggato.', 'warning');
    }
    if (modalConfirmUploadBtn) modalConfirmUploadBtn.disabled = true;
if (modalCancelUploadBtn) modalCancelUploadBtn.disabled = true;

if (avatarUploadProgressContainer) {
    avatarUploadProgressContainer.style.display = 'block'; // Make container visible
}
if (avatarUploadProgressBar) {
    avatarUploadProgressBar.style.width = '0%'; // Set initial width
}
if (avatarUploadProgressText) {
    avatarUploadProgressText.textContent = '0%'; // Set initial text
}

// === NUOVA RIGA PER FORZARE IL REFLOW ===
if (avatarUploadProgressBar) {
    void avatarUploadProgressBar.offsetWidth; // Leggere una proprietà come offsetWidth forza il reflow
}
// === FINE NUOVA RIGA ===

if (modalAvatarStatus) modalAvatarStatus.textContent = 'Caricamento in corso...';

const fileExtension = selectedAvatarFile.name.split('.').pop().toLowerCase();
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
            showToast(`Errore upload: ${error.code}`, 'error');
            closeModalAndReset();
        },
        () => {
            showToast('Immagine caricata! In attesa di elaborazione...', 'info', 7000);
            closeModalAndReset();
        }
    );
}

// --- INIZIALIZZAZIONE ---
onAuthStateChanged(auth, (user) => {
    loggedInUser = user;
    const urlParams = new URLSearchParams(window.location.search);
    const profileUserIdFromUrl = urlParams.get('userId');
    const guestMsgDiv = document.getElementById('guestProfileViewMessage');

    if (currentProfileListenerUnsubscribe) {
        currentProfileListenerUnsubscribe();
        currentProfileListenerUnsubscribe = null;
    }

    if (profileUserIdFromUrl) {
        const isOwn = loggedInUser ? loggedInUser.uid === profileUserIdFromUrl : false;
        loadProfileData(profileUserIdFromUrl, isOwn);
        if (isOwn) {
            if (myArticlesSection) myArticlesSection.style.display = 'block';
            loadMyArticles(profileUserIdFromUrl);
        } else {
            if (myArticlesSection) myArticlesSection.style.display = 'none';
        }
        if (guestMsgDiv) guestMsgDiv.style.display = !isOwn && !loggedInUser ? 'block' : 'none';
    } else if (loggedInUser) {
        loadProfileData(loggedInUser.uid, true);
        if (myArticlesSection) myArticlesSection.style.display = 'block';
        loadMyArticles(loggedInUser.uid);
        if (guestMsgDiv) guestMsgDiv.style.display = 'none';
    } else {
        profileDataForDisplay = null;
        if (profileContent) profileContent.style.display = 'none';
        if (profileLoadingMessage) profileLoadingMessage.style.display = 'none';
        if (profileLoginMessage) {
            profileLoginMessage.style.display = 'block';
            profileLoginMessage.innerHTML =
                '<p>Per visualizzare o modificare un profilo, <a href="#" id="profilePageLoginLink" style="color: var(--link-color); text-decoration: underline;">accedi</a> o <a href="register.html" style="color: var(--link-color); text-decoration: underline;">registrati</a>.</p>';
            const profilePageLoginLink = document.getElementById('profilePageLoginLink');
            if (profilePageLoginLink && !profilePageLoginLink.hasAttribute('data-listener-attached')) {
                profilePageLoginLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    const showLoginBtnGlobal = document.getElementById('showLoginBtn');
                    if (showLoginBtnGlobal) showLoginBtnGlobal.click();
                });
                profilePageLoginLink.setAttribute('data-listener-attached', 'true');
            }
        }
        if (guestMsgDiv) guestMsgDiv.style.display = 'none';
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

document.addEventListener('DOMContentLoaded', () => {
    initializeNicknameChangeModalListeners();

    // NUOVI LISTENER PER MODALE ANIMAZIONE NICKNAME
    if (customizeNicknameBtn) {
        customizeNicknameBtn.addEventListener('click', openNicknameAnimationModal);
    }
    if (closeNicknameAnimationModalBtn) {
        closeNicknameAnimationModalBtn.addEventListener('click', closeNicknameAnimationModal);
    }
    if (nicknameAnimationModal) {
        nicknameAnimationModal.addEventListener('click', (event) => {
            if (event.target === nicknameAnimationModal) {
                closeNicknameAnimationModal();
            }
        });
    }

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
            if (event.target === badgeDetailModal) badgeDetailModal.style.display = 'none';
        });
    }

    const badgesInfoBtn = document.getElementById('badgesInfoBtn');
    if (badgesInfoBtn) {
        badgesInfoBtn.addEventListener('click', handleShowAllBadgesInfo);
    }

    if (updateStatusForm) updateStatusForm.addEventListener('submit', handleStatusMessageUpdate);
    if (resendVerificationEmailBtn && emailVerificationBanner) {
        resendVerificationEmailBtn.addEventListener('click', async () => {
            if (loggedInUser && !loggedInUser.emailVerified) {
                try {
                    resendVerificationEmailBtn.disabled = true;
                    resendVerificationEmailBtn.textContent = 'Invio...';
                    if (resendEmailMessage) resendEmailMessage.textContent = '';
                    await sendEmailVerification(loggedInUser);
                    showToast(
                        'Email di verifica inviata nuovamente! Controlla la tua casella di posta.',
                        'success',
                        6000
                    );
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
                if (isVisible) {
                    resetAndHideExternalLinkForm();
                } else {
                    resetAndHideExternalLinkForm(); // Resetta prima di mostrare
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

    if (selectAvatarFileBtn) {
        selectAvatarFileBtn.addEventListener('click', () => avatarUploadInput.click());
    }
    if (avatarUploadInput) {
        avatarUploadInput.addEventListener('change', handleAvatarFileSelection);
    }
    if (modalConfirmUploadBtn) {
        modalConfirmUploadBtn.addEventListener('click', handleConfirmAvatarUpload);
    }
    if (modalCancelUploadBtn) {
        modalCancelUploadBtn.addEventListener('click', closeModalAndReset);
    }
    if (avatarConfirmationModal) {
        avatarConfirmationModal.addEventListener('click', (event) => {
            if (event.target === avatarConfirmationModal) {
                closeModalAndReset();
            }
        });
    }
    if (bioInput && bioInput.offsetParent !== null) updateBioCharCounter(); // Inizializza se visibile
});
