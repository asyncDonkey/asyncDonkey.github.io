// js/main.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';

import { initLeaderboard } from './leaderboardManager.js';
// Importa solo la funzione di apertura della modale di auth da auth.js
import { showAuthModal } from './auth.js';
import { openProfileModal, initProfileControls } from './profile.js';

import {
    getFirestore,
    // connectFirestoreEmulator, // IMPORT PER EMULATORE FIRESTORE - Commentato se non usato
    doc,
    getDoc,
    // serverTimestamp, // Non direttamente usato qui in main.js, ma ok se serve altrove
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    onSnapshot,
    documentId,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
    getAuth,
    // connectAuthEmulator, // IMPORT PER EMULATORE AUTH - Commentato se non usato
    signOut,
    onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { auth, db, functions } from './firebase-config.js'; // Importa l'istanza auth, db e functions

// IMPORT PER EMULATORE STORAGE - Rimuovi se non usato, altrimenti importa e abilita
// import { getStorage, connectStorageEmulator } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

import { createIcon } from './blockies.mjs';
import { displayArticlesSection, displayGlitchzillaBanner } from './homePageFeatures.js';
import { showToast } from './toastNotifications.js';

let loggedInUser = null; // Mantieni aggiornato lo stato dell'utente loggato
let currentUserProfileUnsubscribe = null; // Per il listener del profilo utente
let notificationListener = null; // Per tenere traccia del listener delle notifiche

// ----- INIZIO CODICE PER EMULATORI (MANTIENI O Rimuovi in base al tuo setup) -----
// Controlla se siamo in un contesto locale (es. localhost o 127.0.0.1)
// Se l'hostname è vuoto (es. apertura diretta di file:///), gli emulatori non verranno usati.
// if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
//     try {
//         console.log("[main.js] Tentativo di connessione agli emulatori Firebase...");

//         // Connetti a Firestore Emulator (porta 8080, come configurato)
//         connectFirestoreEmulator(db, 'localhost', 8080);
//         console.log("[main.js] Connesso a Firestore Emulator su localhost:8080");

//         // Connetti a Auth Emulator (porta 9099, come configurato)
//         connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true }); // disableWarnings è opzionale
//         console.log("[main.js] Connesso a Auth Emulator su http://localhost:9099");

//         // Connetti a Storage Emulator (porta 9199, default)
//         // const storage = getStorage(firebaseAppInstance); // Assicurati di avere l'istanza dell'app Firebase
//         // connectStorageEmulator(storage, "localhost", 9199);
//         // console.log("[main.js] Connesso a Storage Emulator su localhost:9199");

//         // Potresti aggiungere connectFunctionsEmulator qui se userai callable functions dal client
//         // connectFunctionsEmulator(functions, "localhost", 5001); // Porta Functions Emulator
//         // console.log("[main.js] Connesso a Functions Emulator su localhost:5001");

//         showToast("Collegato agli emulatori Firebase locali (Auth, Firestore, Storage)!", "info", 7000);
//     } catch (error) {
//         console.error("[main.js] Errore durante la connessione agli emulatori:", error);
//         showToast("Errore connessione emulatori Firebase. Vedi console.", "error", 7000);
//     }
// } else {
//     console.log("[main.js] Connesso ai servizi Firebase di produzione.");
// }
// ----- FINE CODICE PER EMULATORI -----

// Non ho trovato una definizione di `showConfirmationModal` nel tuo `main.js`
// ma l'ho lasciata qui commentata in caso la volessi definire o importare.
/*
export function showConfirmationModal(title = 'Conferma Azione', message = 'Sei sicuro di voler procedere?') {
    // ... (codice invariato, se presente altrove)
}
*/

export function generateBlockieAvatar(seed, imgSize = 40, blockieOptions = {}) {
    // ... (codice invariato)
    if (typeof createIcon !== 'function') {
        console.error('createIcon from Blockies non importata!');
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${imgSize}' height='${imgSize}' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' fill='%23ddd'/%3E%3Ctext x='5' y='7.5' font-size='5' text-anchor='middle' fill='%23777'%3E?%3C/text%3E%3C/svg%3E`;
    }
    try {
        const defaultOptions = {
            seed: String(seed).toLowerCase(),
            size: 8,
            scale: 5,
        };
        const options = { ...defaultOptions, ...blockieOptions };
        options.scale = Math.max(1, Math.round(imgSize / options.size));
        const canvasElement = createIcon(options);
        if (canvasElement && typeof canvasElement.toDataURL === 'function') {
            return canvasElement.toDataURL();
        } else {
            throw new Error('createIcon non ha restituito un canvas valido.');
        }
    } catch (e) {
        console.error('Errore generazione avatar Blockie:', e, 'Seed:', seed);
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${imgSize}' height='${imgSize}' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' fill='%23ddd'/%3E%3Ctext x='5' y='7.5' font-size='5' text-anchor='middle' fill='%23777'%3E?%3C/text%3E%3C/svg%3E`;
    }
}

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Funzione `setupThemeSwitcher` qui se vuoi usarla
function setupThemeSwitcher() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (!themeToggleBtn) {
        console.error('[Main.js setupThemeSwitcher] Pulsante themeToggleBtn NON TROVATO nel DOM.');
        return;
    }
    const bodyElement = document.body;
    const moonIconName = 'nights_stay';
    const sunIconName = 'sunny';
    const iconSpan = themeToggleBtn.querySelector('.material-symbols-rounded');

    function applyTheme(theme) {
        bodyElement.classList.toggle('dark-mode', theme === 'dark');
        if (iconSpan) iconSpan.textContent = theme === 'dark' ? sunIconName : moonIconName;
        localStorage.setItem('theme', theme);
        themeToggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Attiva Tema Chiaro' : 'Attiva Tema Scuro');
        themeToggleBtn.setAttribute('title', theme === 'dark' ? 'Attiva Tema Chiaro' : 'Attiva Tema Scuro');
    }

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

    themeToggleBtn.addEventListener('click', () => {
        applyTheme(bodyElement.classList.contains('dark-mode') ? 'light' : 'dark');
    });
    console.log('[Main.js setupThemeSwitcher] Theme switcher inizializzato.');
}

/**
 * Inizializza la sezione e il pulsante per la richiesta di diventare beta tester.
 * @param {object} user L'oggetto utente di Firebase.
 * @param {object|null} profileData I dati del profilo utente da Firestore.
 */
function initializeTesterRequestButton(user, profileData) {
    const requestSection = document.getElementById('beta-tester-request-section');
    const requestButton = document.getElementById('request-tester-role-btn');

    if (!requestSection || !requestButton) {
        return;
    }

    if (user && profileData && !profileData.isTestUser && !profileData.isAdmin) {
        requestSection.style.display = 'block';

        requestButton.addEventListener('click', async () => {
            requestButton.disabled = true;
            requestButton.textContent = 'Invio richiesta in corso...';

            try {
                const requestTesterRole = httpsCallable(functions, 'requestTesterRole');
                const result = await requestTesterRole();

                if (result.data.success) {
                    showToast('Richiesta inviata con successo! Un admin la esaminerà presto. 🚀', 'success', 8000);
                    requestSection.style.display = 'none';
                } else {
                    throw new Error(result.data.message || 'Si è verificato un errore sconosciuto.');
                }
            } catch (error) {
                console.error('Errore durante la chiamata a requestTesterRole:', error);
                showToast(`Errore: ${error.message}`, 'error');
                requestButton.disabled = false;
                requestButton.innerHTML = `<span class="material-symbols-rounded" style="vertical-align: middle; margin-right: 8px;">rocket_launch</span>Voglio diventare un Beta Tester!`;
            }
        });
    } else {
        requestSection.style.display = 'none';
    }
}

function updateHeaderAuthContainersVisibility(user) {
    // Non è chiaro dove siano "authContainer" e "userProfileContainer" nel tuo index.html attuale.
    // Se non esistono, questa funzione non farà nulla o causerà errori se non gestito.
    // L'icona dell'account è gestita più in basso nella funzione onAuthStateChanged.
    // const authContainer = document.getElementById('authContainer');
    // const userProfileContainer = document.getElementById('userProfileContainer');
    // if (authContainer) authContainer.style.display = user ? 'none' : 'flex';
    // if (userProfileContainer) userProfileContainer.style.display = user ? 'flex' : 'none';
}

function toggleMobileMenu() {
    const mobileMenuContainer = document.getElementById('mobileNavMenu');
    const mobileMenuButton = document.getElementById('navbarToggler');

    if (!mobileMenuContainer || !mobileMenuButton) {
        console.error('[toggleMobileMenu] Elementi del menu mobile non trovati.');
        return;
    }
    const burgerIcon = mobileMenuButton.querySelector('.material-symbols-rounded');
    if (!burgerIcon) {
        console.error('[toggleMobileMenu] Icona burger non trovata.');
        return;
    }

    const isActive = mobileMenuContainer.classList.toggle('active');
    mobileMenuButton.setAttribute('aria-expanded', isActive.toString());
    burgerIcon.textContent = isActive ? 'close' : 'menu';

    if (!isActive) {
        mobileMenuContainer.setAttribute('aria-hidden', 'true');
        setTimeout(() => {
            if (document.activeElement === document.body || mobileMenuContainer.contains(document.activeElement)) {
                mobileMenuButton.focus();
            }
        }, 0);
    } else {
        mobileMenuContainer.removeAttribute('aria-hidden');
        const firstFocusableElement = mobileMenuContainer.querySelector('a, button');
        if (firstFocusableElement) {
            // firstFocusableElement.focus();
        }
    }
}

function populateMobileMenu() {
    const navbarLinksContainer = document.querySelector('.desktop-nav > ul');
    const mobileMenuTarget = document.getElementById('mobileNavMenu');

    if (!navbarLinksContainer || !mobileMenuTarget) {
        return;
    }

    mobileMenuTarget.innerHTML = '';
    const mobileUl = document.createElement('ul');
    mobileUl.className = 'mobile-menu-list';
    mobileUl.style.listStyle = 'none';
    mobileUl.style.padding = '0';
    mobileUl.style.margin = '0';

    const desktopListItems = navbarLinksContainer.querySelectorAll(':scope > li');

    desktopListItems.forEach((desktopLi) => {
        const isDropdownContainer = desktopLi.classList.contains('nav-dropdown-container');
        let linkToProcess;

        if (isDropdownContainer) {
            linkToProcess = desktopLi.querySelector('button.dropdown-toggle#communityDropdownToggle');
        } else {
            linkToProcess = desktopLi.querySelector('a');
        }

        if (!linkToProcess) {
            return;
        }

        const dynamicDesktopLiIds = ['profile-link-li', 'logout-link-li', 'login-link-li'];
        if (dynamicDesktopLiIds.includes(desktopLi.id)) {
            return;
        }

        if (isDropdownContainer && linkToProcess && linkToProcess.id === 'communityDropdownToggle') {
            const mobileDropdownLi = document.createElement('li');
            mobileDropdownLi.classList.add('nav-item', 'mobile-dropdown');

            const mobileDropdownToggle = document.createElement('a');
            mobileDropdownToggle.href = '#';
            mobileDropdownToggle.innerHTML = linkToProcess.innerHTML;
            mobileDropdownToggle.classList.add('dropdown-toggle');
            mobileDropdownToggle.setAttribute('aria-expanded', 'false');

            const mobileSubmenu = document.createElement('ul');
            mobileSubmenu.classList.add('mobile-submenu');
            mobileSubmenu.style.display = 'none';
            mobileSubmenu.style.listStyle = 'none';
            mobileSubmenu.style.paddingLeft = '20px';

            const desktopSubmenuItems = desktopLi.querySelectorAll('.dropdown-menu li');

            desktopSubmenuItems.forEach((subItemLi) => {
                const subItemLink = subItemLi.querySelector('a');
                if (subItemLink) {
                    const mobileSubmenuItemLi = document.createElement('li');
                    if (subItemLi.id === 'navWriteArticleDropdown') {
                        mobileSubmenuItemLi.id = 'mobile-navWriteArticleDropdown';
                        mobileSubmenuItemLi.style.display = 'none';
                    }

                    const mobileSubmenuLink = document.createElement('a');
                    mobileSubmenuLink.href = subItemLink.href;
                    mobileSubmenuLink.innerHTML = subItemLink.innerHTML;
                    mobileSubmenuLink.classList.add('nav-item');
                    if (subItemLink.target === '_blank') {
                        mobileSubmenuLink.target = '_blank';
                        mobileSubmenuLink.rel = 'noopener noreferrer';
                    }
                    mobileSubmenuItemLi.appendChild(mobileSubmenuLink);
                    mobileSubmenu.appendChild(mobileSubmenuItemLi);
                }
            });

            mobileDropdownToggle.addEventListener('click', (e) => {
                e.preventDefault();
                const isExpanded = mobileSubmenu.style.display === 'block';
                mobileSubmenu.style.display = isExpanded ? 'none' : 'block';
                mobileDropdownToggle.setAttribute('aria-expanded', String(!isExpanded));
                const icon = mobileDropdownToggle.querySelector('.material-symbols-rounded.dropdown-arrow');
                if (icon) icon.textContent = !isExpanded ? 'arrow_drop_up' : 'arrow_drop_down';
            });

            mobileDropdownLi.appendChild(mobileDropdownToggle);
            mobileDropdownLi.appendChild(mobileSubmenu);
            mobileUl.appendChild(mobileDropdownLi);
        } else if (!isDropdownContainer && linkToProcess) {
            const mobileListItem = document.createElement('li');
            const mobileLink = document.createElement('a');
            mobileLink.href = linkToProcess.href || '#';
            mobileLink.innerHTML = linkToProcess.innerHTML;
            mobileLink.classList.add('nav-item');
            if (linkToProcess.target === '_blank') {
                mobileLink.target = '_blank';
                mobileLink.rel = 'noopener noreferrer';
            }
            mobileListItem.appendChild(mobileLink);
            mobileUl.appendChild(mobileListItem);
        }
    });

    if (mobileUl.hasChildNodes()) {
        mobileMenuTarget.appendChild(mobileUl);
    }
}

function loadContentSpecificFeatures(user) {
    // console.log('[Main.js] loadContentSpecificFeatures chiamata per utente:', user ? user.uid : null);
}

function setupDesktopCommunityDropdown() {
    const dropdownToggle = document.getElementById('communityDropdownToggle');
    const dropdownMenu = document.getElementById('communityDropdownMenu');

    if (dropdownToggle && dropdownMenu) {
        dropdownToggle.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', String(!isExpanded));
            dropdownMenu.style.display = isExpanded ? 'none' : 'block';
            const icon = this.querySelector('.material-symbols-rounded.dropdown-arrow');
            if (icon) icon.textContent = isExpanded ? 'arrow_drop_down' : 'arrow_drop_up';
        });
        document.addEventListener('click', function (event) {
            if (
                dropdownMenu.style.display === 'block' &&
                !dropdownToggle.contains(event.target) &&
                !dropdownMenu.contains(event.target)
            ) {
                dropdownMenu.style.display = 'none';
                dropdownToggle.setAttribute('aria-expanded', 'false');
                const icon = dropdownToggle.querySelector('.material-symbols-rounded.dropdown-arrow');
                if (icon) icon.textContent = 'arrow_drop_down';
            }
        });
    }
}

function createNavLinkItem(liId, aId, href, innerHTML, aClasses = ['nav-item'], onClickHandler = null) {
    const listItem = document.createElement('li');
    listItem.id = liId;
    const link = document.createElement('a');
    link.id = aId;
    link.href = href;
    link.innerHTML = innerHTML;
    aClasses.forEach((cls) => link.classList.add(cls));
    if (onClickHandler) {
        link.addEventListener('click', onClickHandler);
    }
    listItem.appendChild(link);
    return listItem;
}

function initializeNewNavbar() {
    const mobileMenuButton = document.getElementById('navbarToggler');
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', toggleMobileMenu);
    } else {
        console.error('[initializeNewNavbar] Pulsante menu mobile (navbarToggler) NON TROVATO.');
    }
    populateMobileMenu();
    setupDesktopCommunityDropdown();
    console.log('[initializeNewNavbar] Nuova navbar inizializzata.');
}

export { db, auth, escapeHTML };

export function getCurrentUserId() {
    return auth.currentUser ? auth.currentUser.uid : null;
}

async function loadHomeMiniLeaderboard() {
    const leaderboardListElement = document.getElementById('homeMiniLeaderboardList');
    if (!leaderboardListElement) {
        console.warn('[main.js] Elemento homeMiniLeaderboardList non trovato.');
        return;
    }
    if (!db) {
        console.error('[main.js] Istanza DB non disponibile per mini-leaderboard homepage.');
        leaderboardListElement.innerHTML = '<li>Errore DB.</li>';
        return;
    }

    leaderboardListElement.innerHTML =
        '<li><div class="loader-dots"><span></span><span></span><span></span></div> Caricamento...</li>';

    try {
        const scoresCollectionRef = collection(db, 'leaderboardScores');
        const q = query(scoresCollectionRef, orderBy('score', 'desc'), limit(5));

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            leaderboardListElement.innerHTML = '<li>Nessun punteggio! Sii il primo!</li>';
            return;
        }

        const scoresData = [];
        querySnapshot.forEach((docSnapshot) => {
            scoresData.push({ id: docSnapshot.id, ...docSnapshot.data() });
        });

        const userIds = [...new Set(scoresData.map((entry) => entry.userId).filter((id) => id))];
        const profilesMap = new Map();

        if (userIds.length > 0) {
            const MAX_IDS_PER_IN_QUERY = 30;
            const profilePromises = [];
            for (let i = 0; i < userIds.length; i += MAX_IDS_PER_IN_QUERY) {
                const batchUserIds = userIds.slice(i, i + MAX_IDS_PER_IN_QUERY);
                if (batchUserIds.length > 0) {
                    const profilesQuery = query(
                        collection(db, 'userPublicProfiles'),
                        where(documentId(), 'in', batchUserIds)
                    );
                    profilePromises.push(getDocs(profilesQuery));
                }
            }
            try {
                const profileSnapshotsArray = await Promise.all(profilePromises);
                profileSnapshotsArray.forEach((profileSnaps) => {
                    profileSnaps.forEach((snap) => {
                        if (snap.exists()) {
                            profilesMap.set(snap.id, snap.data());
                        }
                    });
                });
            } catch (profileError) {
                console.error('[main.js] Errore caricamento profili per mini-leaderboard homepage:', profileError);
            }
        }

        leaderboardListElement.innerHTML = '';
        let rank = 1;
        scoresData.forEach((entry) => {
            const listItem = document.createElement('li');

            const rankSpan = document.createElement('span');
            rankSpan.className = 'player-rank';
            rankSpan.textContent = `${rank}.`;
            listItem.appendChild(rankSpan);

            const avatarImg = document.createElement('img');
            avatarImg.className = 'player-avatar';

            const seedForBlockie = entry.userId || entry.initials || entry.userName || `anon-home-${entry.id}`;
            let userDisplayName = entry.userName || entry.initials || 'Anonimo';
            let altTextForAvatar = userDisplayName;
            let avatarSrcToUse = generateBlockieAvatar(seedForBlockie, 24, { size: 6, scale: 4 });
            let userNationalityCode = entry.nationalityCode;

            const userProfile = entry.userId ? profilesMap.get(entry.userId) : null;

            if (userProfile) {
                userDisplayName = userProfile.displayName || userDisplayName;
                altTextForAvatar = userDisplayName;
                userNationalityCode = userProfile.nationalityCode || userNationalityCode;

                let chosenAvatarUrl = null;
                if (userProfile.avatarUrls && userProfile.avatarUrls.small) {
                    chosenAvatarUrl = userProfile.avatarUrls.small;
                } else if (userProfile.avatarUrls && userProfile.avatarUrls.profile) {
                    chosenAvatarUrl = userProfile.avatarUrls.profile;
                } else if (userProfile.avatarUrls && userProfile.avatarUrls.thumbnail) {
                    chosenAvatarUrl = userProfile.avatarUrls.thumbnail;
                } else if (userProfile.avatarUrl) {
                    chosenAvatarUrl = userProfile.avatarUrl;
                }

                if (chosenAvatarUrl) {
                    avatarSrcToUse = chosenAvatarUrl;
                    let timestampForCache;
                    if (userProfile.profilePublicUpdatedAt) {
                        timestampForCache = userProfile.profilePublicUpdatedAt;
                    } else if (userProfile.profileUpdatedAt) {
                        timestampForCache = userProfile.profileUpdatedAt;
                    }

                    if (timestampForCache) {
                        if (timestampForCache.seconds !== undefined && typeof timestampForCache.seconds === 'number') {
                            avatarSrcToUse += `?ts=${timestampForCache.seconds}`;
                        } else if (typeof timestampForCache === 'number') {
                            avatarSrcToUse += `?ts=${timestampForCache}`;
                        } else if (timestampForCache instanceof Date) {
                            avatarSrcToUse += `?ts=${Math.floor(timestampForCache.getTime() / 1000)}`;
                        } else {
                            console.warn(
                                `[main.js] Timestamp per cache-busting avatar non riconosciuto per ${entry.userId}:`,
                                timestampForCache
                            );
                        }
                    } else {
                        console.warn(
                            `[main.js] Nessun timestamp (profilePublicUpdatedAt o profileUpdatedAt) trovato per cache-busting avatar per ${entry.userId}`
                        );
                    }
                }
            }

            avatarImg.src = avatarSrcToUse;
            avatarImg.alt = `${altTextForAvatar}'s Avatar`;
            avatarImg.style.backgroundColor = 'transparent';
            avatarImg.onerror = () => {
                avatarImg.src = generateBlockieAvatar(seedForBlockie, 24, { size: 6, scale: 4 });
                avatarImg.alt = `${altTextForAvatar}'s Fallback Avatar`;
                avatarImg.onerror = null;
            };
            listItem.appendChild(avatarImg);

            const playerInfoSpan = document.createElement('span');
            playerInfoSpan.className = 'player-info';

            const nameElementContainer = document.createElement('span');
            nameElementContainer.className = 'player-name';

            if (
                userNationalityCode &&
                userNationalityCode !== 'OTHER' &&
                typeof userNationalityCode === 'string' &&
                userNationalityCode.length === 2
            ) {
                const flagIconSpan = document.createElement('span');
                flagIconSpan.classList.add('fi', `fi-${userNationalityCode.toLowerCase()}`);
                flagIconSpan.title = userNationalityCode;
                flagIconSpan.style.marginRight = '5px';
                flagIconSpan.style.verticalAlign = 'middle';
                nameElementContainer.appendChild(flagIconSpan);
            }

            if (entry.userId) {
                const profileLink = document.createElement('a');
                profileLink.href = `profile.html?userId=${entry.userId}`;
                profileLink.textContent = escapeHTML(userDisplayName);
                nameElementContainer.appendChild(profileLink);
            } else {
                let guestName = userDisplayName;
                if (entry.initials && !guestName.toLowerCase().includes('(ospite)'))
                    guestName = entry.initials + ' (Ospite)';
                else if (!entry.initials && guestName === 'Anonimo' && !guestName.toLowerCase().includes('(ospite)'))
                    guestName += ' (Ospite)';
                nameElementContainer.appendChild(document.createTextNode(escapeHTML(guestName)));
            }
            playerInfoSpan.appendChild(nameElementContainer);
            listItem.appendChild(playerInfoSpan);

            const scoreSpan = document.createElement('span');
            scoreSpan.className = 'player-score';
            scoreSpan.textContent = entry.score !== undefined ? entry.score.toLocaleString() : '-';
            listItem.appendChild(scoreSpan);

            leaderboardListElement.appendChild(listItem);
            rank++;
        });
    } catch (error) {
        console.error('[main.js] Errore caricamento mini-leaderboard homepage:', error);
        leaderboardListElement.innerHTML = '<li>Errore caricamento.</li>';
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
            leaderboardListElement.innerHTML += '<li>(Indice DB mancante)</li>';
        }
    }
}

async function updateHomepageLikeButtonUI(buttonElement, articleId, currentUser) {
    if (!buttonElement || !articleId) return;
    const likeCountSpan = buttonElement.nextElementSibling;
    if (!likeCountSpan || !likeCountSpan.classList.contains('homepage-like-count')) {
        // console.warn(`Span conteggio like non trovato o errato per articleId: ${articleId}.`);
    }
    try {
        const articleRef = doc(db, 'articles', articleId);
        const docSnap = await getDoc(articleRef);
        if (docSnap.exists()) {
            const articleData = docSnap.data();
            if (articleData.status !== 'published') {
                if (likeCountSpan) likeCountSpan.textContent = articleData.likeCount || 0;
                buttonElement.innerHTML = `<span class="material-symbols-rounded">favorite_border</span>`;
                buttonElement.disabled = true;
                buttonElement.title = 'Articolo non disponibile per like';
                buttonElement.classList.remove('liked');
                return;
            }
            const likes = articleData.likeCount || 0;
            const likedByUsers = articleData.likedByUsers || [];
            if (likeCountSpan) likeCountSpan.textContent = likes;
            if (currentUser) {
                buttonElement.disabled = false;
                const userHasLiked = Array.isArray(likedByUsers) && likedByUsers.includes(currentUser.uid);
                if (userHasLiked) {
                    buttonElement.innerHTML = `<span class="material-symbols-rounded">favorite</span>`;
                    buttonElement.classList.add('liked');
                    buttonElement.title = "Hai messo 'Mi piace' (vedi articolo per cambiare)";
                } else {
                    buttonElement.innerHTML = `<span class="material-symbols-rounded">favorite_border</span>`;
                    buttonElement.classList.remove('liked');
                    buttonElement.title = "Metti 'Mi piace' (vedi articolo)";
                }
            } else {
                buttonElement.innerHTML = `<span class="material-symbols-rounded">favorite_border</span>`;
                buttonElement.disabled = true;
                buttonElement.title = 'Fai login per mettere like';
                buttonElement.classList.remove('liked');
            }
        } else {
            if (likeCountSpan) likeCountSpan.textContent = '0';
            buttonElement.innerHTML = `<span class="material-symbols-rounded">favorite_border</span>`;
            buttonElement.disabled = true;
        }
    } catch (error) {
        console.error(`Errore Firestore aggiornamento UI like per articolo "${articleId}":`, error);
        if (likeCountSpan) likeCountSpan.textContent = 'Err';
        buttonElement.innerHTML = `<span class="material-symbols-rounded">favorite_border</span>`;
        buttonElement.disabled = true;
    }
}

async function handleHomepageArticleLike(event) {
    const button = event.currentTarget;
    const articleId = button.dataset.articleId;
    const currentUser = auth.currentUser;
    if (!currentUser) {
        showToast("Devi essere loggato per interagire con i like. Puoi mettere like dalla pagina dell'articolo.");
        return;
    }
    if (!articleId) {
        console.error('ArticleId mancante nel dataset del bottone like homepage.');
        return;
    }
    window.location.href = `view-article.html?id=${articleId}#articleLikesContainer`;
}

async function updateHomepageCommentCountUI(countSpanElement, articleId) {
    if (!countSpanElement || !articleId) return;
    try {
        const articleRef = doc(db, 'articles', articleId);
        const docSnap = await getDoc(articleRef);
        if (docSnap.exists() && docSnap.data().status === 'published') {
            const articleData = docSnap.data();
            const comments = articleData.commentCount || 0;
            countSpanElement.textContent = comments;
        } else {
            countSpanElement.textContent = '0';
        }
    } catch (error) {
        console.error(`Errore aggiornamento UI conteggio commenti per ${articleId}:`, error);
        countSpanElement.textContent = 'Err';
    }
}

export async function initializeHomepageArticleInteractions(currentUser) {
    const articlesGrid = document.getElementById('articlesGrid');
    if (!articlesGrid) return;
    const articleCards = articlesGrid.querySelectorAll('.article-card');
    if (articleCards.length === 0) return;
    for (const card of articleCards) {
        const articleId = card.dataset.articleId;
        const likeButton = card.querySelector('.homepage-like-btn');
        const commentCountSpan = card.querySelector('.homepage-comment-count');
        if (articleId) {
            if (likeButton) {
                await updateHomepageLikeButtonUI(likeButton, articleId, currentUser);
                likeButton.removeEventListener('click', handleHomepageArticleLike);
                likeButton.addEventListener('click', handleHomepageArticleLike);
            }
            if (commentCountSpan) {
                await updateHomepageCommentCountUI(commentCountSpan, articleId);
            }
        }
    }
}

function traduireErroreFirebase(codiceErrore) {
    const errors = {
        'auth/invalid-email': "L'indirizzo email non è valido.",
        'auth/user-disabled': 'Questo account utente è stato disabilitato.',
        'auth/user-not-found': 'Nessun utente trovato con questa email.',
        'auth/wrong-password': 'Password errata.',
        'auth/email-already-in-use': "L'indirizzo email è già utilizzato da un altro account.",
        'auth/operation-not-allowed': 'Operazione non permessa (controlla config Firebase Auth).',
        'auth/weak-password': 'La password è troppo debole (minimo 6 caratteri).',
    };
    return errors[codiceErrore] || `Errore (${codiceErrore}). Riprova.`;
}

/**
 * Imposta il listener Firestore per le notifiche non lette dell'utente.
 * @param {string} userId L'ID dell'utente.
 */
function setupNotificationBellListener(userId) {
    if (typeof db === 'undefined' || !db) {
        console.error("Firestore 'db' instance is not available in main.js for notifications.");
        return;
    }
    if (notificationListener) {
        clearNotificationBellListener();
    }

    const bellContainer = document.getElementById('notificationBellContainer');
    const counterElement = document.getElementById('notificationCounter');
    const bellLink = document.getElementById('notificationBellLink');

    if (bellContainer) {
        bellContainer.style.display = 'flex';
        if (bellLink && !bellLink.getAttribute('data-listener-attached')) {
            bellLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Notification bell clicked! Future: show notifications panel.');
            });
            bellLink.setAttribute('data-listener-attached', 'true');
        }
    } else {
        console.warn('setupNotificationBellListener: notificationBellContainer non trovato nel DOM.');
        return;
    }

    const notificationsRef = collection(db, 'userProfiles', userId, 'notifications');
    const unreadNotificationsQuery = query(notificationsRef, where('read', '==', false));

    notificationListener = onSnapshot(
        unreadNotificationsQuery,
        (snapshot) => {
            const unreadCount = snapshot.size;

            if (counterElement) {
                if (unreadCount > 0) {
                    counterElement.textContent = unreadCount > 99 ? '99+' : unreadCount;
                    counterElement.style.display = 'inline-block';
                } else {
                    counterElement.style.display = 'none';
                }
            }
            if (bellLink) {
                bellLink.title = unreadCount > 0 ? `${unreadCount} notifiche non lette` : 'Nessuna nuova notifica';
            }
        },
        (error) => {
            console.error('Errore nel listener delle notifiche: ', error);
            if (counterElement) counterElement.style.display = 'none';
        }
    );
    console.log('[Main.js setupNotificationBellListener] Notification listener attached for user:', userId);
}

/**
 * Rimuove il listener Firestore per le notifiche e nasconde la campanella.
 */
function clearNotificationBellListener() {
    if (notificationListener) {
        notificationListener();
        notificationListener = null;
        console.log('[Main.js clearNotificationBellListener] Notification listener detached.');
    }
    const bellContainer = document.getElementById('notificationBellContainer');
    if (bellContainer) {
        bellContainer.style.display = 'none';
    }
    const counterElement = document.getElementById('notificationCounter');
    if (counterElement) {
        counterElement.textContent = '0';
        counterElement.style.display = 'none';
    }
    const bellLink = document.getElementById('notificationBellLink');
    if (bellLink) {
        bellLink.removeAttribute('data-listener-attached');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('[Main.js DOMContentLoaded] DOM completamente caricato e parsato.');

    // Inizializzazioni principali
    // initializeNewNavbar();
    // setupThemeSwitcher();
    initLeaderboard();

    // Solo l'event listener per aprire la modale, il resto è gestito da auth.js
    const showLoginModalBtn = document.getElementById('show-login-modal-btn');
    if (showLoginModalBtn) {
        showLoginModalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("Click sull'icona di login registrato!");
            showAuthModal('login'); // Chiama la funzione esposta da auth.js
        });
    }

    const userAvatarIcon = document.getElementById('user-avatar-icon');
    if (userAvatarIcon) {
        userAvatarIcon.addEventListener('click', () => {
            openProfileModal(loggedInUser);
        });
    }

    // Inizializza i controlli della modale del profilo (logout, etc)
    initProfileControls();

    // Manteniamo le altre inizializzazioni importanti!
    if (document.getElementById('homeMiniLeaderboardList')) {
        loadHomeMiniLeaderboard();
    }
    if (document.getElementById('articlesSection')) {
        displayArticlesSection();
    }
    if (document.getElementById('glitchzillaDefeatedBanner')) {
        displayGlitchzillaBanner();
    }

    // --- LOGICA DI AUTENTICAZIONE (onAuthStateChanged) ---
    onAuthStateChanged(auth, async (user) => {
        console.log('[Main.js] Stato autenticazione cambiato. Utente:', user ? user.uid : null);
        loggedInUser = user;

        const loginIcon = document.getElementById('show-login-modal-btn');
        const avatarIcon = document.getElementById('user-avatar-icon');

        if (user) {
            // Utente LOGGATO
            if (loginIcon) loginIcon.style.display = 'none';
            if (avatarIcon) {
                // 1. Inizializza sempre con un avatar Blockie di default.
                let photoURLToUse = generateBlockieAvatar(user.uid, 32);

                // 2. Tenta di recuperare i dati del profilo da Firestore (appUsers).
                const userProfileDoc = await getDoc(doc(db, 'appUsers', user.uid));

                if (userProfileDoc.exists()) {
                    const profileData = userProfileDoc.data();

                    // 3. Se esiste una photoURL valida nel documento Firestore, usala.
                    if (profileData.photoURL && profileData.photoURL !== '') {
                        photoURLToUse = profileData.photoURL;
                    }
                    // 4. ALTRIMENTI, se non c'è in Firestore, controlla la photoURL da Firebase Auth.
                    // Questo è utile se l'utente ha fatto login con un provider come Google e ha una foto.
                    else if (user.photoURL && user.photoURL !== '') {
                        photoURLToUse = user.photoURL;
                    }
                    if (profileData.nickname) {
                        // console.log("Nickname utente loggato:", profileData.nickname);
                    }
                    // Inizializza il pulsante beta tester se le condizioni sono soddisfatte
                    initializeTesterRequestButton(user, profileData);
                } else {
                    // Se il documento 'appUsers' per l'utente non esiste per qualche motivo,
                    // il 'photoURLToUse' rimane il Blockie generato all'inizio.
                    // Potresti anche qui voler controllare `user.photoURL` come fallback aggiuntivo se preferisci.
                    if (user.photoURL && user.photoURL !== '') {
                        photoURLToUse = user.photoURL;
                    }
                }

                // 5. Aggiungi cache-busting per l'avatar solo se è un URL HTTP/HTTPS (non un data URL del Blockie)
                if (photoURLToUse && photoURLToUse.startsWith('http')) {
                    photoURLToUse += `?v=${new Date().getTime()}`; // Aggiungi timestamp attuale per forzare il reload
                }

                // Imposta la sorgente dell'immagine e rendila visibile
                avatarIcon.src = photoURLToUse;
                avatarIcon.style.display = 'block';
            }

            initializeHomepageArticleInteractions(user);
            setupNotificationBellListener(user.uid);
            loadContentSpecificFeatures(user);
        } else {
            // Utente NON LOGGATO
            if (loginIcon) loginIcon.style.display = 'block';
            if (avatarIcon) avatarIcon.style.display = 'none';

            initializeHomepageArticleInteractions(null);
            clearNotificationBellListener();
            loadContentSpecificFeatures(null);

            // Nascondi la sezione beta tester se l'utente non è loggato
            const requestSection = document.getElementById('beta-tester-request-section');
            if (requestSection) {
                requestSection.style.display = 'none';
            }
        }
    });
}); // Fine dell'UNICO DOMContentLoaded
