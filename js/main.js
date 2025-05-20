// js/main.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
    getFirestore,
    connectFirestoreEmulator, // IMPORT PER EMULATORE FIRESTORE
    doc,
    getDoc,
    serverTimestamp,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    onSnapshot,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
    getAuth,
    connectAuthEmulator, // IMPORT PER EMULATORE AUTH
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// IMPORT PER EMULATORE STORAGE
import { getStorage, connectStorageEmulator } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

import { createIcon } from './blockies.mjs';
import { displayArticlesSection, displayGlitchzillaBanner } from './homePageFeatures.js';
import { showToast } from './toastNotifications.js';

// --- Firebase Config ---
const firebaseConfig = {
    apiKey: 'AIzaSyBrXQ4qwB9JhZF4kSIPyvxQYw1X4PGXpFk', // Sostituisci con la tua vera chiave se necessario (anche se per gli emulatori non è usata per auth)
    authDomain: 'asyncdonkey.firebaseapp.com',
    projectId: 'asyncdonkey',
    storageBucket: 'asyncdonkey.firebasestorage.app', // Assicurati sia il bucket corretto
    messagingSenderId: '939854468396',
    appId: '1:939854468396:web:9646d4f51737add7704889',
    measurementId: 'G-EQDBKQM3YE',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); // INIZIALIZZA STORAGE

let currentUserProfileUnsubscribe = null;
let loggedInUser = null; // Mantieni aggiornato lo stato dell'utente loggato
let notificationListener = null; // Per tenere traccia del listener delle notifiche

// ----- INIZIO CODICE PER EMULATORI -----
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
//         connectStorageEmulator(storage, "localhost", 9199);
//         console.log("[main.js] Connesso a Storage Emulator su localhost:9199");

//         // Potresti aggiungere connectFunctionsEmulator qui se userai callable functions dal client
//         // import { getFunctions, connectFunctionsEmulator } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';
//         // const functions = getFunctions(app);
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

export function showConfirmationModal(title = 'Conferma Azione', message = 'Sei sicuro di voler procedere?') {
    // ... (codice invariato, come da versione precedente)
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmationModal');
        const modalTitleEl = document.getElementById('confirmationModalTitle');
        const modalMessageEl = document.getElementById('confirmationModalMessage');
        const yesBtn = document.getElementById('confirmModalYesBtn');
        const noBtn = document.getElementById('confirmModalNoBtn');

        if (!modal || !modalTitleEl || !modalMessageEl || !yesBtn || !noBtn) {
            console.error(
                'Elementi della modale di conferma (confirmationModal, confirmationModalTitle, etc.) non trovati nel DOM.'
            );
            const userConfirmation = window.confirm(`${title}\n${message}`);
            resolve(userConfirmation);
            return;
        }

        modalTitleEl.textContent = title;
        modalMessageEl.textContent = message;

        const closeAndResolve = (value) => {
            modal.style.display = 'none';
            const newYesBtn = yesBtn.cloneNode(true);
            yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
            const newNoBtn = noBtn.cloneNode(true);
            noBtn.parentNode.replaceChild(newNoBtn, noBtn);
            modal.removeEventListener('click', handleModalOutsideClick);
            resolve(value);
        };

        const handleModalOutsideClick = (event) => {
            if (event.target === modal) {
                closeAndResolve(false);
            }
        };

        document.getElementById('confirmModalYesBtn').onclick = () => closeAndResolve(true);
        document.getElementById('confirmModalNoBtn').onclick = () => closeAndResolve(false);
        modal.addEventListener('click', handleModalOutsideClick);

        modal.style.display = 'block';
        if (yesBtn) yesBtn.focus();
    });
}

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
    // ... (codice invariato)
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Funzione loadHeaderUserProfileDisplay (modificata per caricare avatar personalizzato)
async function loadHeaderUserProfileDisplay(user, profileData) {
    // Modificata per accettare profileData
    const userDisplayNameElement = document.getElementById('userDisplayName');
    const headerUserAvatarElement = document.getElementById('headerUserAvatar');

    if (!userDisplayNameElement || !headerUserAvatarElement) {
        console.warn('[Main.js loadHeaderUserProfileDisplay] Elementi userDisplayName o headerUserAvatar non trovati.');
        return;
    }

    if (!user) {
        // Se l'utente non è loggato, assicurati che questi siano nascosti (gestito anche da updateHeaderAuthContainersVisibility)
        userDisplayNameElement.textContent = '';
        headerUserAvatarElement.style.display = 'none';
        return;
    }

    let nicknameToShow = user.email ? user.email.split('@')[0] : 'Utente'; // Fallback iniziale
    let avatarSrcToSet = generateBlockieAvatar(user.uid, 32, { size: 7, scale: 4 }); // Default Blockie per navbar
    let altText = `${nicknameToShow}'s Blockie Avatar`;

    if (profileData) {
        // Se abbiamo i dati del profilo (da onSnapshot)
        if (profileData.nickname) {
            nicknameToShow = profileData.nickname;
        }
        altText = `${nicknameToShow}'s Avatar`; // Aggiorna alt text con nickname corretto

        if (profileData.avatarUrls && (profileData.avatarUrls.thumbnail || profileData.avatarUrls.profile)) {
            let baseUrl = profileData.avatarUrls.thumbnail || profileData.avatarUrls.profile; // Preferisci thumbnail

            // Applica cache busting
            if (profileData.profileUpdatedAt && profileData.profileUpdatedAt.seconds) {
                avatarSrcToSet = `${baseUrl}?v=${profileData.profileUpdatedAt.seconds}`;
            } else if (profileData.profileUpdatedAt instanceof Date) {
                avatarSrcToSet = `${baseUrl}?v=${profileData.profileUpdatedAt.getTime()}`;
            } else {
                avatarSrcToSet = baseUrl; // Nessun timestamp per cache busting
            }
            altText = `${nicknameToShow}'s Custom Avatar`;
        }
        // Se profileData esiste ma non ci sono avatarUrls, avatarSrcToSet rimane il Blockie generato sopra.
    }
    // Se profileData è null (es. profilo non ancora creato o errore nel fetch),
    // nicknameToShow e avatarSrcToSet useranno i fallback basati su `user` e Blockie.

    userDisplayNameElement.textContent = `Ciao, ${escapeHTML(nicknameToShow)}`; // escapeHTML è già nel tuo codice
    headerUserAvatarElement.src = avatarSrcToSet;
    headerUserAvatarElement.alt = altText; // Usa l'alt text determinato
    headerUserAvatarElement.style.display = 'inline-block';
    headerUserAvatarElement.style.backgroundColor = 'transparent';

    headerUserAvatarElement.onerror = () => {
        console.warn(
            `[Main.js Navbar] Errore caricamento avatar: ${headerUserAvatarElement.src}. Fallback finale a Blockie.`
        );
        if (user && user.uid) {
            // Assicurati che user.uid sia ancora accessibile
            headerUserAvatarElement.src = generateBlockieAvatar(user.uid, 32, { size: 7, scale: 4 });
            headerUserAvatarElement.alt = `${nicknameToShow}'s Blockie Avatar (fallback errore)`;
        } else {
            headerUserAvatarElement.style.display = 'none'; // Nascondi se non si può generare Blockie
        }
    };
}

function updateHeaderAuthContainersVisibility(user) {
    // ... (codice invariato)
    const authContainer = document.getElementById('authContainer');
    const userProfileContainer = document.getElementById('userProfileContainer');
    if (authContainer) authContainer.style.display = user ? 'none' : 'flex';
    if (userProfileContainer) userProfileContainer.style.display = user ? 'flex' : 'none';
}

// --- NUOVA LOGICA NAVBAR ---
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
        // Menu CHIUSO
        mobileMenuContainer.setAttribute('aria-hidden', 'true');
        // Ritarda leggermente lo spostamento del focus per assicurarsi che il menu sia "andato"
        // e che il focus non venga "rubato" da un elemento appena nascosto.
        setTimeout(() => {
            // Controlla se il focus è ancora su un elemento dentro il menu mobile (che ora è nascosto)
            // o se è sul body (il che può accadere se l'elemento con focus è stato rimosso).
            if (document.activeElement === document.body || mobileMenuContainer.contains(document.activeElement)) {
                // Se sì, sposta il focus sul pulsante che ha aperto/chiuso il menu.
                mobileMenuButton.focus();
            }
            // Altrimenti, il focus potrebbe essere già stato gestito correttamente (es. da un logout)
            // o spostato altrove dall'utente/browser, quindi non lo forziamo.
        }, 0);
    } else {
        // Menu APERTO
        mobileMenuContainer.removeAttribute('aria-hidden');
        // Opzionale: focus sul primo elemento del menu quando si apre
        const firstFocusableElement = mobileMenuContainer.querySelector('a, button');
        if (firstFocusableElement) {
            // firstFocusableElement.focus(); // Commentato per ora, può essere fastidioso
        }
    }
    // console.log(`[main.js toggleMobileMenu] Menu mobile ${isActive ? 'APERTO' : 'CHIUSO'}.`);
}

function populateMobileMenu() {
    // ... (codice invariato)
    const navbarLinksContainer = document.querySelector('.desktop-nav > ul');
    const mobileMenuTarget = document.getElementById('mobileNavMenu');

    if (!navbarLinksContainer) {
        return;
    }
    if (!mobileMenuTarget) {
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
    // TODO: Implementare logica per caricare funzionalità specifiche della pagina
    // basate sull'utente o sul percorso della pagina corrente.
}

function setupDesktopCommunityDropdown() {
    // ... (codice invariato)
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
    // ... (codice invariato)
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

async function getUserProfile(userId) {
    // ... (codice invariato)
    if (!db) {
        console.error('Firestore (db) non inizializzato (getUserProfile).');
        return { nickname: 'Errore DB' };
    }
    try {
        const userProfileDoc = await getDoc(doc(db, 'userProfiles', userId));
        if (userProfileDoc.exists()) {
            return userProfileDoc.data();
        } else {
            return { nickname: 'Utente' };
        }
    } catch (error) {
        console.error(`Errore durante il recupero del profilo utente (${userId}):`, error);
        return { nickname: 'Errore Profilo' };
    }
}

async function updateLoginLogoutLinks(user) {
    const mobileMenuNode = document.getElementById('mobileNavMenu');
    const mobileMenuContainer = mobileMenuNode ? mobileMenuNode.querySelector('.mobile-menu-list') : null;

    const navWriteArticleDropdownLiMobile = document.getElementById('mobile-navWriteArticleDropdown');
    if (navWriteArticleDropdownLiMobile) {
        navWriteArticleDropdownLiMobile.style.display = user ? 'list-item' : 'none';
    }
    const navWriteArticleDropdownLiDesktop = document.getElementById('navWriteArticleDropdown');
    if (navWriteArticleDropdownLiDesktop) {
        navWriteArticleDropdownLiDesktop.style.display = user ? 'list-item' : 'none';
    }

    if (!mobileMenuContainer) {
        console.warn('[main.js updateLoginLogoutLinks] Contenitore menu mobile non trovato o non ancora popolato.');
        return;
    }

    const dynamicMobileLiIds = ['mobile-profile-link-li', 'mobile-logout-link-li', 'mobile-login-link-li'];
    dynamicMobileLiIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.parentNode === mobileMenuContainer) {
            // console.log(`[main.js updateLoginLogoutLinks] Rimuovo LI mobile: ${id}`); // DEBUG
            el.remove();
        }
    });

    if (user) {
        let userProfile = await getUserProfile(user.uid);
        let userNickname = userProfile?.nickname || (user.email ? user.email.split('@')[0] : 'Utente');

        const profileHTMLMobile = `<span class="material-symbols-rounded">account_circle</span> <span class="nav-text">My Profile (${escapeHTML(userNickname)})</span>`;
        mobileMenuContainer.appendChild(
            createNavLinkItem('mobile-profile-link-li', 'mobile-profile-link', 'profile.html', profileHTMLMobile, [
                'nav-item',
            ])
        );
        // console.log('[main.js updateLoginLogoutLinks] Aggiunto link "My Profile" mobile.'); // DEBUG

        const logoutHandler = async (e) => {
            e.preventDefault();
            console.log('[main.js logoutHandler mobile] Logout cliccato!'); // DEBUG
            const mobileMenuContainerForLogout = document.getElementById('mobileNavMenu'); // Riferimento fresco
            const isActiveBeforeLogout =
                mobileMenuContainerForLogout && mobileMenuContainerForLogout.classList.contains('active');

            if (isActiveBeforeLogout) {
                // console.log('[main.js logoutHandler mobile] Chiusura menu mobile prima del signOut.'); // DEBUG
                toggleMobileMenu(); // Chiude il menu e dovrebbe spostare il focus sul toggler
            } else {
                // console.log('[main.js logoutHandler mobile] Menu mobile non attivo, procedo con signOut.'); // DEBUG
            }

            try {
                console.log('[main.js logoutHandler mobile] Chiamata a signOut...'); // DEBUG
                await signOut(auth);
                showToast('Logout effettuato con successo!', 'success');
                console.log('[main.js logoutHandler mobile] Logout riuscito.'); // DEBUG
            } catch (error) {
                console.error('Errore durante il logout (mobile):', error);
                showToast('Errore durante il logout. Riprova.', 'error');
            }
        };
        const logoutHTMLMobile = `<span class="material-symbols-rounded">logout</span> <span class="nav-text">Logout</span>`;
        mobileMenuContainer.appendChild(
            createNavLinkItem(
                'mobile-logout-link-li',
                'mobile-logout-link',
                '#',
                logoutHTMLMobile,
                ['nav-item'],
                logoutHandler
            )
        );
        // console.log('[main.js updateLoginLogoutLinks] Aggiunto link "Logout" mobile.'); // DEBUG
    } else {
        const loginHTMLMobile = `<span class="material-symbols-rounded">login</span> <span class="nav-text">Login / Register</span>`;
        const loginMobileHandler = (e) => {
            e.preventDefault();
            const loginModalEl = document.getElementById('loginModal');
            if (loginModalEl) loginModalEl.style.display = 'block';
            const mobileMenuContainerForLogin = document.getElementById('mobileNavMenu');
            if (mobileMenuContainerForLogin && mobileMenuContainerForLogin.classList.contains('active')) {
                toggleMobileMenu(); // Chiudi menu mobile
            }
        };
        // mobileMenuContainer.appendChild(createNavLinkItem('mobile-login-link-li', 'mobile-login-link', 'register.html', loginHTMLMobile, ['nav-item']));
        mobileMenuContainer.appendChild(
            createNavLinkItem(
                'mobile-login-link-li',
                'mobile-login-link',
                '#',
                loginHTMLMobile,
                ['nav-item'],
                loginMobileHandler
            )
        );

        // console.log('[main.js updateLoginLogoutLinks] Aggiunto link "Login/Register" mobile.'); // DEBUG
    }
}

async function updateAdminDashboardLink(user) {
    // ... (codice invariato)
    const adminDashboardLinkFooter = document.getElementById('admin-dashboard-footer-link');
    if (!adminDashboardLinkFooter) return;
    if (user) {
        try {
            const idTokenResult = await user.getIdTokenResult();
            adminDashboardLinkFooter.style.display = idTokenResult.claims.admin ? '' : 'none';
        } catch (error) {
            console.error("Errore nel verificare i custom claims dell'admin:", error);
            adminDashboardLinkFooter.style.display = 'none';
        }
    } else {
        adminDashboardLinkFooter.style.display = 'none';
    }
}

function initializeNewNavbar() {
    // ... (codice invariato)
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

function updateUIBasedOnAuthState(user, profileData) {
    console.log('[Main.js updateUIBasedOnAuthState] Chiamata con utente:', user ? user.uid : null);
    // console.log('[Main.js updateUIBasedOnAuthState] ProfileData ricevuto:', profileData);

    // Aggiorna la visibilità dei container principali Login/Profilo nell'header
    updateHeaderAuthContainersVisibility(user); // Funzione già presente nel tuo codice

    // Aggiorna l'avatar e il nome utente nell'header usando profileData reattivo
    loadHeaderUserProfileDisplay(user, profileData); // Funzione già presente e corretta nel tuo codice

    // Aggiorna i link dinamici nel menu mobile (es. Profilo, Logout/Login)
    updateLoginLogoutLinks(user); // Funzione già presente nel tuo codice

    // Aggiorna la visibilità del link "Scrivi Articolo" nella navbar desktop e mobile
    const navWriteArticleDropdownDesktop = document.getElementById('navWriteArticleDropdown');
    if (navWriteArticleDropdownDesktop) {
        navWriteArticleDropdownDesktop.style.display = user ? 'list-item' : 'none';
    }
    // (La logica per 'mobile-navWriteArticleDropdown' è già in updateLoginLogoutLinks)

    // Aggiorna il link Admin Dashboard nel footer (se l'utente è admin)
    // La funzione updateAdminDashboardLink gestisce il recupero dei custom claims
    // e la visualizzazione del link nel footer, puoi chiamarla qui.
    updateAdminDashboardLink(user); // Funzione già presente nel tuo codice

    // Inizializza/aggiorna altre interazioni UI specifiche (es. homepage)
    // Se initializeHomepageArticleInteractions deve essere chiamata qui:
    if (document.getElementById('articlesSection')) {
        // O un altro check per la homepage
        initializeHomepageArticleInteractions(user); // Funzione già presente nel tuo codice
    }

    console.log('[Main.js updateUIBasedOnAuthState] Fine aggiornamenti UI orchestrati.');
}

export { db, auth, firebaseConfig };

async function loadHomeMiniLeaderboard() {
    // ... (codice invariato)
    const leaderboardListElement = document.getElementById('homeMiniLeaderboardList');
    if (!leaderboardListElement) return;
    if (!db) {
        console.error('DB instance non disponibile per mini-leaderboard homepage.');
        leaderboardListElement.innerHTML = '<li>Errore DB.</li>';
        return;
    }
    leaderboardListElement.innerHTML = '<li>Caricamento...</li>';
    try {
        const scoresCollectionRef = collection(db, 'leaderboardScores');
        const q = query(scoresCollectionRef, where('gameId', '==', 'donkeyRunner'), orderBy('score', 'desc'), limit(5));
        const querySnapshot = await getDocs(q);
        leaderboardListElement.innerHTML = '';
        if (querySnapshot.empty) {
            leaderboardListElement.innerHTML = '<li>Nessun punteggio! Sii il primo!</li>';
            return;
        }
        let rank = 1;
        querySnapshot.forEach((docSnapshot) => {
            const entry = docSnapshot.data();
            const listItem = document.createElement('li');
            const rankSpan = document.createElement('span');
            rankSpan.className = 'player-rank';
            rankSpan.textContent = `${rank}.`;
            listItem.appendChild(rankSpan);
            const avatarImg = document.createElement('img');
            avatarImg.className = 'player-avatar';
            const seedForBlockie = entry.userId || entry.initials || entry.userName || `anon-home-${docSnapshot.id}`;
            avatarImg.src = generateBlockieAvatar(seedForBlockie, 24, { size: 6, scale: 4 });
            avatarImg.alt = `Avatar`;
            avatarImg.style.backgroundColor = 'transparent';
            avatarImg.onerror = () => {
                /* gestione errore avatar */
            };
            listItem.appendChild(avatarImg);
            const playerInfoSpan = document.createElement('span');
            playerInfoSpan.className = 'player-info';
            const nameElementContainer = document.createElement('span');
            nameElementContainer.className = 'player-name';
            if (entry.nationalityCode && entry.nationalityCode !== 'OTHER' && entry.nationalityCode.length === 2) {
                const flagIconSpan = document.createElement('span');
                flagIconSpan.classList.add('fi', `fi-${entry.nationalityCode.toLowerCase()}`);
                flagIconSpan.style.marginRight = '5px';
                flagIconSpan.style.verticalAlign = 'middle';
                nameElementContainer.appendChild(flagIconSpan);
            }
            let displayName = entry.userName || entry.initials || 'Anonimo';
            if (entry.userId) {
                const profileLink = document.createElement('a');
                profileLink.href = `profile.html?userId=${entry.userId}`;
                profileLink.textContent = escapeHTML(displayName);
                nameElementContainer.appendChild(profileLink);
            } else {
                if (entry.initials) displayName = entry.initials + ' (Ospite)';
                else displayName += ' (Ospite)';
                nameElementContainer.appendChild(document.createTextNode(escapeHTML(displayName)));
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
        console.error('Errore caricamento mini-leaderboard homepage:', error);
        leaderboardListElement.innerHTML = '<li>Errore caricamento.</li>';
        if (error.code === 'failed-precondition') {
            leaderboardListElement.innerHTML += '<li>(Indice DB mancante)</li>';
        }
    }
}

async function updateHomepageLikeButtonUI(buttonElement, articleId, currentUser) {
    // ... (codice invariato, già usa Material Symbols)
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
    // ... (codice invariato)
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
    // ... (codice invariato)
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
    // ... (codice invariato)
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
    // ... (codice invariato)
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
        // Rimuovi listener precedente se esiste
        clearNotificationBellListener(); // clearNotificationBellListener si occuperà anche di nascondere il bell
    }

    const bellContainer = document.getElementById('notificationBellContainer');
    const counterElement = document.getElementById('notificationCounter');
    const bellLink = document.getElementById('notificationBellLink');

    if (bellContainer) {
        bellContainer.style.display = 'flex'; // o 'inline-flex' o come preferisci per visualizzarlo
        // Assicurati che il click listener sia aggiunto una sola volta
        if (bellLink && !bellLink.getAttribute('data-listener-attached')) {
            bellLink.addEventListener('click', (e) => {
                e.preventDefault();
                // TODO: (A.5.4) Mostra il pannello/dropdown delle notifiche qui
                console.log('Notification bell clicked! Future: show notifications panel.');
            });
            bellLink.setAttribute('data-listener-attached', 'true');
        }
    } else {
        console.warn('setupNotificationBellListener: notificationBellContainer non trovato nel DOM.');
        return; // Non procedere se il contenitore non c'è
    }

    const notificationsRef = collection(db, 'userProfiles', userId, 'notifications'); // Uso corretto di collection()
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
            if (counterElement) counterElement.style.display = 'none'; // Nascondi in caso di errore
        }
    );
    console.log('[Main.js setupNotificationBellListener] Notification listener attached for user:', userId);
}

/**
 * Rimuove il listener Firestore per le notifiche e nasconde la campanella.
 */
function clearNotificationBellListener() {
    if (notificationListener) {
        notificationListener(); // Chiama la funzione di unsubscribe ritornata da onSnapshot
        notificationListener = null;
        console.log('[Main.js clearNotificationBellListener] Notification listener detached.');
    }
    const bellContainer = document.getElementById('notificationBellContainer');
    if (bellContainer) {
        bellContainer.style.display = 'none'; // Nascondi sempre la campanella al clear
    }
    const counterElement = document.getElementById('notificationCounter');
    if (counterElement) {
        counterElement.textContent = '0';
        counterElement.style.display = 'none';
    }
    const bellLink = document.getElementById('notificationBellLink');
    if (bellLink) {
        // Rimuovi l'attributo per permettere al listener di essere riattaccato
        bellLink.removeAttribute('data-listener-attached');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // ... (codice invariato, inclusa la chiamata a initializeNewNavbar)
    initializeNewNavbar();
    const loginForm = document.getElementById('loginForm');
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const loginModal = document.getElementById('loginModal');
    const showLoginBtn = document.getElementById('showLoginBtn');
    const closeLoginBtn = loginModal ? loginModal.querySelector('.closeLoginBtn') : null;
    const openModal = (modal) => {
        if (modal) modal.style.display = 'block';
    };
    const closeModal = (modal) => {
        if (modal) modal.style.display = 'none';
    };

    function setupSmoothScrolling() {
        document.querySelectorAll('header nav a[href^="#"]').forEach((link) => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                try {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                } catch (error) {
                    /* Gestisci errore selettore */
                }
            });
        });
    }
    function setupScrollToTopButton() {
        if (!scrollToTopBtn) return;
        window.addEventListener('scroll', () => {
            scrollToTopBtn.classList.toggle('show', window.pageYOffset > 200);
        });
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    function setupInteractiveSkills() {
        const skillBadges = document.querySelectorAll('#skills ul li[data-skill-name]');
        const skillDetailsContainer = document.getElementById('skillDetails');
        if (!skillDetailsContainer || skillBadges.length === 0) return;
        let currentlyActiveSkillBadge = null;
        skillBadges.forEach((badge) => {
            badge.addEventListener('click', function () {
                if (currentlyActiveSkillBadge) {
                    currentlyActiveSkillBadge.classList.remove('active-skill');
                }
                this.classList.add('active-skill');
                currentlyActiveSkillBadge = this;
                const skillName = this.dataset.skillName || 'Skill';
                const skillDescription = this.dataset.description || 'Nessun dettaglio disponibile.';
                skillDetailsContainer.innerHTML = `<h3>${escapeHTML(skillName)}</h3><p>${escapeHTML(skillDescription)}</p>`;
            });
        });
    }
    function setupThemeSwitcher() {
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        if (!themeToggleBtn) return;
        const bodyElement = document.body;
        const moonIconName = 'dark_mode';
        const sunIconName = 'light_mode';
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
    }

    function setupModalControls() {
        if (showLoginBtn && loginModal) {
            showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openModal(loginModal);
            });
        }
        if (closeLoginBtn) {
            closeLoginBtn.addEventListener('click', () => closeModal(loginModal));
        }
        window.addEventListener('click', (event) => {
            if (event.target === loginModal) closeModal(loginModal);
        });
    }
    setupSmoothScrolling();
    setupScrollToTopButton();
    setupInteractiveSkills();
    setupThemeSwitcher();
    setupModalControls();

    if (document.getElementById('homeMiniLeaderboardList')) {
        loadHomeMiniLeaderboard();
    }
    if (document.getElementById('articlesSection')) {
        displayArticlesSection()
            .then(() => {
                /* Interazioni inizializzate da onAuthStateChanged */
            })
            .catch((error) => {
                console.error('Errore durante displayArticlesSection in DOMContentLoaded:', error);
            });
    }
    if (document.getElementById('glitchzillaDefeatedBanner')) {
        displayGlitchzillaBanner();
    }
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.loginEmail.value;
            const password = loginForm.loginPassword.value;
            const loginModalErrorDiv = document.querySelector('#loginModal .error-message');
            if (loginModalErrorDiv) loginModalErrorDiv.style.display = 'none';
            try {
                await signInWithEmailAndPassword(auth, email, password);
                loginForm.reset();
                closeModal(loginModal);
                showToast('Login effettuato con successo!', 'success');
            } catch (error) {
                const friendlyError = traduireErroreFirebase(error.code);
                if (loginModalErrorDiv) {
                    loginModalErrorDiv.textContent = friendlyError;
                    loginModalErrorDiv.style.display = 'block';
                } else {
                    showToast('Errore Login: ' + friendlyError, 'error');
                }
            }
        });
    }
});

onAuthStateChanged(auth, async (user) => {
    console.log('[Main.js onAuthStateChanged] Stato autenticazione cambiato. Utente:', user ? user.uid : null);
    loggedInUser = user; // Assumendo che loggedInUser sia una variabile a livello di modulo/globale che usi

    // Gestione unsubscribe dal listener del profilo precedente
    if (currentUserProfileUnsubscribe) {
        console.log('[Main.js onAuthStateChanged] Annullamento iscrizione dal listener profilo navbar precedente.');
        currentUserProfileUnsubscribe();
        currentUserProfileUnsubscribe = null;
    }

    if (user) {
        // Utente AUTENTICATO
        const userIdForEvent = user.uid; // Variabile locale per chiarezza nell'evento
        const userProfileRef = doc(db, 'userProfiles', userIdForEvent);

        console.log(
            `[Main.js onAuthStateChanged] Impostazione listener onSnapshot per profilo navbar UID: ${userIdForEvent}`
        );

        currentUserProfileUnsubscribe = onSnapshot(
            userProfileRef,
            (docSnap) => {
                const userProfileData = docSnap.exists() ? docSnap.data() : null;
                if (docSnap.exists()) {
                    console.log(
                        '[Main.js onSnapshot Navbar] Dati profilo ricevuti/aggiornati per navbar:',
                        userProfileData
                    );
                } else {
                    console.warn(
                        `[Main.js onSnapshot Navbar] Profilo per UID ${userIdForEvent} non trovato. La navbar userà dati Auth di fallback.`
                    );
                }
                // Chiamata principale per aggiornare tutta l'UI, inclusa la logica della campanella
                updateUIBasedOnAuthState(user, userProfileData);
            },
            (error) => {
                console.error('[Main.js onSnapshot Navbar] Errore nel listener del profilo per navbar:', error);
                updateUIBasedOnAuthState(user, null); // Usa dati Auth di fallback in caso di errore
            }
        );

        // Configura il listener della campanella delle notifiche
        setupNotificationBellListener(userIdForEvent);
        loadContentSpecificFeatures(user);

        // ---> INIZIO SEZIONE: INVIA EVENTO userAuthenticated PER UTENTE LOGGATO <---
        console.log(`[Main.js onAuthStateChanged] Invio evento "userAuthenticated" con userId: ${userIdForEvent}`);
        document.dispatchEvent(
            new CustomEvent('userAuthenticated', {
                detail: { user: user, userId: userIdForEvent }, // Passa l'oggetto user completo e userId
            })
        );
        // ---> FINE SEZIONE: INVIA EVENTO userAuthenticated <---

        console.log('[Main.js onAuthStateChanged] Operazioni per utente autenticato completate.');
    } else {
        // Utente NON AUTENTICATO (logout)
        console.log('[Main.js onAuthStateChanged] Utente non loggato.');
        updateUIBasedOnAuthState(null, null); // Aggiorna l'UI per lo stato di logout
        clearNotificationBellListener(); // Assicurati che il listener e la campanella siano rimossi/nascosti
        loadContentSpecificFeatures(null);

        // ---> INIZIO SEZIONE: INVIA EVENTO userAuthenticated PER LOGOUT <---
        console.log('[Main.js onAuthStateChanged] Invio evento "userAuthenticated" con utente nullo (logout).');
        document.dispatchEvent(
            new CustomEvent('userAuthenticated', {
                detail: { user: null, userId: null }, // Invia null per indicare il logout
            })
        );
        // ---> FINE SEZIONE: INVIA EVENTO userAuthenticated <---

        console.log('[Main.js onAuthStateChanged] Operazioni per utente non autenticato completate.');
    }
    console.log(
        '[Main.js onAuthStateChanged] Aggiornamento UI di base completato (dettagli profilo via onSnapshot se loggato).'
    );
});
