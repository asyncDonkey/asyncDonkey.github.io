// js/main.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
    getFirestore,
    doc,
    getDoc,
    // setDoc, 
    serverTimestamp, 
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    // updateDoc, 
    // increment,
    // arrayUnion,
    // arrayRemove,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    // createUserWithEmailAndPassword, 
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// Importazioni locali
import { createIcon } from './blockies.mjs';
import { displayArticlesSection, displayGlitchzillaBanner } from './homePageFeatures.js';
import { showToast } from './toastNotifications.js';

// --- Firebase Config ---
const firebaseConfig = {
    apiKey: 'AIzaSyBrXQ4qwB9JhZF4kSIPyvxQYw1X4PGXpFk', 
    authDomain: 'asyncdonkey.firebaseapp.com',
    projectId: 'asyncdonkey',
    storageBucket: 'asyncdonkey.appspot.com',
    messagingSenderId: '939854468396',
    appId: '1:939854468396:web:9646d4f51737add7704889',
    measurementId: 'G-EQDBKQM3YE',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/**
 * Mostra una modale di conferma personalizzata e restituisce una Promise.
 * La Promise si risolve in `true` se l'utente conferma (clicca "Sì"),
 * o in `false` se l'utente annulla (clicca "No" o chiude la modale).
 * Assicurati che l'HTML per la modale con ID 'confirmationModal' esista nella pagina.
 * @param {string} [title="Conferma Azione"] Titolo della modale.
 * @param {string} [message="Sei sicuro di voler procedere?"] Messaggio di conferma.
 * @returns {Promise<boolean>} Promise che si risolve con la scelta dell'utente.
 */
export function showConfirmationModal(title = "Conferma Azione", message = "Sei sicuro di voler procedere?") {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmationModal');
        const modalTitleEl = document.getElementById('confirmationModalTitle');
        const modalMessageEl = document.getElementById('confirmationModalMessage');
        const yesBtn = document.getElementById('confirmModalYesBtn');
        const noBtn = document.getElementById('confirmModalNoBtn');

        if (!modal || !modalTitleEl || !modalMessageEl || !yesBtn || !noBtn) {
            console.error(
                "Elementi della modale di conferma (confirmationModal, confirmationModalTitle, etc.) non trovati nel DOM."
            );
            // Fallback al confirm nativo del browser se gli elementi della modale non sono presenti
            const userConfirmation = window.confirm(`${title}\n${message}`);
            resolve(userConfirmation);
            return;
        }

        modalTitleEl.textContent = title;
        modalMessageEl.textContent = message;

        // Funzione interna per chiudere la modale e risolvere la Promise
        const closeAndResolve = (value) => {
            modal.style.display = 'none';
            // Rimuovi gli event listener specifici per questa istanza della modale
            // per evitare accumuli se la funzione viene chiamata più volte.
            // Clonare i nodi è un modo efficace per rimuovere tutti i listener.
            const newYesBtn = yesBtn.cloneNode(true);
            yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);

            const newNoBtn = noBtn.cloneNode(true);
            noBtn.parentNode.replaceChild(newNoBtn, noBtn);
            
            // Rimuovi anche il listener per il click esterno, se aggiunto
            modal.removeEventListener('click', handleModalOutsideClick);

            resolve(value);
        };
        
        // Funzione per gestire il click esterno (sullo sfondo della modale)
        const handleModalOutsideClick = (event) => {
            if (event.target === modal) {
                closeAndResolve(false); // Risolve con 'false' come se si premesse "No"
            }
        };

        // Assegna i nuovi listener ai bottoni (ora clonati, quindi quelli nel DOM)
        document.getElementById('confirmModalYesBtn').onclick = () => closeAndResolve(true);
        document.getElementById('confirmModalNoBtn').onclick = () => closeAndResolve(false);
        
        // Aggiungi il listener per il click esterno
        modal.addEventListener('click', handleModalOutsideClick);

        modal.style.display = 'block';
        if (yesBtn) yesBtn.focus(); // Opzionale: metti il focus sul pulsante "Sì"
    });
}

// --- Funzioni Utility Esistenti ---
export function generateBlockieAvatar(seed, imgSize = 40, blockieOptions = {}) {
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

async function loadHeaderUserProfileDisplay(user) {
    const userDisplayNameElement = document.getElementById('userDisplayName'); 
    const headerUserAvatarElement = document.getElementById('headerUserAvatar'); 

    if (!userDisplayNameElement || !headerUserAvatarElement) {
        return;
    }
    if (!user) {
        userDisplayNameElement.textContent = '';
        headerUserAvatarElement.style.display = 'none';
        return;
    }
    let nicknameToShow = user.email ? user.email.split('@')[0] : 'Utente'; 
    const seedForAvatar = user.uid;
    userDisplayNameElement.textContent = `Ciao, ${escapeHTML(nicknameToShow)}`;
    headerUserAvatarElement.src = generateBlockieAvatar(seedForAvatar, 32, { size: 8 }); 
    headerUserAvatarElement.alt = `Avatar di ${escapeHTML(nicknameToShow)}`;
    headerUserAvatarElement.style.display = 'inline-block';
    headerUserAvatarElement.style.backgroundColor = 'transparent';
    headerUserAvatarElement.onerror = () => {
        headerUserAvatarElement.style.display = 'none'; 
    };
    try {
        const userProfileRef = doc(db, 'userProfiles', user.uid);
        const docSnap = await getDoc(userProfileRef);
        if (docSnap.exists() && docSnap.data().nickname) {
            nicknameToShow = docSnap.data().nickname;
        }
    } catch (error) {
        console.error('Errore caricamento profilo utente per display header:', error);
    }
    userDisplayNameElement.textContent = `Ciao, ${escapeHTML(nicknameToShow)}`;
    headerUserAvatarElement.alt = `Avatar di ${escapeHTML(nicknameToShow)}`;
}

function updateHeaderAuthContainersVisibility(user) {
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
        console.error('[toggleMobileMenu] Elementi del menu mobile non trovati. ID HTML attesi: mobileNavMenu, navbarToggler.');
        return;
    }
    const burgerIcon = mobileMenuButton.querySelector('.material-symbols-rounded'); 

    if (!burgerIcon) {
        console.error('[toggleMobileMenu] Icona burger non trovata dentro navbarToggler.');
        return;
    }

    const isActive = mobileMenuContainer.classList.toggle('active'); 
    mobileMenuButton.setAttribute('aria-expanded', isActive.toString());
    burgerIcon.textContent = isActive ? 'close' : 'menu';
    console.log(`[toggleMobileMenu] Menu mobile ${isActive ? 'APERTO' : 'CHIUSO'}. Classe 'active' su #mobileNavMenu: ${isActive}`);
}

function populateMobileMenu() {
    const navbarLinksContainer = document.querySelector('.desktop-nav > ul');
    const mobileMenuTarget = document.getElementById('mobileNavMenu');

    // console.log('[populateMobileMenu] Inizio...'); // DEBUG

    if (!navbarLinksContainer) {
        // console.error('[populateMobileMenu] Contenitore link desktop (.desktop-nav > ul) NON TROVATO.');
        return;
    }
    if (!mobileMenuTarget) {
        // console.error('[populateMobileMenu] Target menu mobile (mobileNavMenu) NON TROVATO.');
        return;
    }

    mobileMenuTarget.innerHTML = ''; // Pulisci prima di ripopolare
    const mobileUl = document.createElement('ul');
    mobileUl.className = 'mobile-menu-list';
    mobileUl.style.listStyle = 'none';
    mobileUl.style.padding = '0';
    mobileUl.style.margin = '0';
    // console.log('[populateMobileMenu] mobileUl (.mobile-menu-list) creato.'); // DEBUG

    const desktopListItems = navbarLinksContainer.querySelectorAll(':scope > li');
    // console.log(`[populateMobileMenu] Trovati ${desktopListItems.length} elementi <li> diretti nel menu desktop.`); // DEBUG

    desktopListItems.forEach((desktopLi) => { // Rimosso 'index' non usato
        // console.log(`[populateMobileMenu] Processo desktopLi:`, desktopLi); // DEBUG

        const isDropdownContainer = desktopLi.classList.contains('nav-dropdown-container');
        let linkToProcess;

        if (isDropdownContainer) {
            linkToProcess = desktopLi.querySelector('button.dropdown-toggle#communityDropdownToggle');
            // console.log(`[populateMobileMenu] desktopLi è Dropdown Container. linkToProcess:`, linkToProcess); // DEBUG
        } else {
            linkToProcess = desktopLi.querySelector('a');
            // console.log(`[populateMobileMenu] desktopLi è Link Normale. linkToProcess:`, linkToProcess); // DEBUG
        }

        if (!linkToProcess) {
            // console.warn(`[populateMobileMenu] desktopLi SKIPPATO (no suitable <a> o button#communityDropdownToggle):`, desktopLi); // DEBUG
            return; // Salta questo <li> se non c'è un link o bottone primario
        }

        // NON clonare gli <li> che sono placeholder per link dinamici gestiti da updateLoginLogoutLinks
        // Questi ID sono per gli elementi LI che verranno creati dinamicamente.
        const dynamicDesktopLiIds = ['profile-link-li', 'logout-link-li', 'login-link-li'];
        if (dynamicDesktopLiIds.includes(desktopLi.id)) {
            // console.log(`[populateMobileMenu] desktopLi (ID: ${desktopLi.id}) SKIPPATO perché è un placeholder dinamico desktop.`); // DEBUG
            return;
        }

        if (isDropdownContainer && linkToProcess && linkToProcess.id === 'communityDropdownToggle') {
            // console.log(`[populateMobileMenu] Processo Dropdown 'Community'...`); // DEBUG
            const mobileDropdownLi = document.createElement('li');
            mobileDropdownLi.classList.add('nav-item', 'mobile-dropdown');

            const mobileDropdownToggle = document.createElement('a');
            mobileDropdownToggle.href = '#'; // I link del menu mobile per toggle non navigano
            mobileDropdownToggle.innerHTML = linkToProcess.innerHTML;
            mobileDropdownToggle.classList.add('dropdown-toggle');
            mobileDropdownToggle.setAttribute('aria-expanded', 'false');

            const mobileSubmenu = document.createElement('ul');
            mobileSubmenu.classList.add('mobile-submenu');
            mobileSubmenu.style.display = 'none';
            mobileSubmenu.style.listStyle = 'none';
            mobileSubmenu.style.paddingLeft = '20px';

            const desktopSubmenuItems = desktopLi.querySelectorAll('.dropdown-menu li');
            // console.log(`[populateMobileMenu] Trovati ${desktopSubmenuItems.length} voci <li> nel sottomenu Community desktop.`); // DEBUG

            desktopSubmenuItems.forEach(subItemLi => {
                const subItemLink = subItemLi.querySelector('a');
                if (subItemLink) {
                    const mobileSubmenuItemLi = document.createElement('li');
                    if (subItemLi.id === 'navWriteArticleDropdown') { // ID del LI nel dropdown desktop
                        mobileSubmenuItemLi.id = 'mobile-navWriteArticleDropdown'; // ID per il LI nel sottomenu mobile
                        mobileSubmenuItemLi.style.display = 'none'; // Inizia nascosto, gestito da updateLoginLogoutLinks
                        // console.log(`[populateMobileMenu] Creato LI per "Scrivi Articolo" mobile con ID: mobile-navWriteArticleDropdown`); // DEBUG
                    }

                    const mobileSubmenuLink = document.createElement('a');
                    mobileSubmenuLink.href = subItemLink.href;
                    mobileSubmenuLink.innerHTML = subItemLink.innerHTML; // Copia tutto l'HTML interno (icona + testo)
                    mobileSubmenuLink.classList.add('nav-item'); // Applica classe per stile uniforme
                    if (subItemLink.target === '_blank') {
                        mobileSubmenuLink.target = '_blank';
                        mobileSubmenuLink.rel = 'noopener noreferrer';
                    }
                    mobileSubmenuItemLi.appendChild(mobileSubmenuLink);
                    mobileSubmenu.appendChild(mobileSubmenuItemLi);
                    // console.log(`[populateMobileMenu] Aggiunto sottomenu item '${subItemLink.textContent.trim()}' al dropdown Community mobile.`); // DEBUG
                }
            });

            mobileDropdownToggle.addEventListener('click', (e) => {
                e.preventDefault();
                const isExpanded = mobileSubmenu.style.display === 'block';
                mobileSubmenu.style.display = isExpanded ? 'none' : 'block';
                mobileDropdownToggle.setAttribute('aria-expanded', String(!isExpanded));
                const icon = mobileDropdownToggle.querySelector('.material-symbols-rounded.dropdown-arrow');
                if (icon) icon.textContent = !isExpanded ? 'arrow_drop_up' : 'arrow_drop_down'; // Invertito per logica corretta
            });

            mobileDropdownLi.appendChild(mobileDropdownToggle);
            mobileDropdownLi.appendChild(mobileSubmenu);
            mobileUl.appendChild(mobileDropdownLi);
            // console.log('[populateMobileMenu] Dropdown Community mobile AGGIUNTO a mobileUl.'); // DEBUG
        } else if (!isDropdownContainer && linkToProcess) { // Link statico di primo livello
            const itemText = (linkToProcess.textContent || "SENZA TESTO").trim();
            // console.log(`[populateMobileMenu] Processo Link Statico '${itemText}'...`); // DEBUG
            const mobileListItem = document.createElement('li');
            const mobileLink = document.createElement('a');
            mobileLink.href = linkToProcess.href || '#';
            mobileLink.innerHTML = linkToProcess.innerHTML; // Copia tutto l'HTML interno (icona + testo)
            mobileLink.classList.add('nav-item'); // Applica classe per stile uniforme
            if (linkToProcess.target === '_blank') {
                mobileLink.target = '_blank';
                mobileLink.rel = 'noopener noreferrer';
            }
            mobileListItem.appendChild(mobileLink);
            mobileUl.appendChild(mobileListItem);
            // console.log(`[populateMobileMenu] Link statico '${itemText}' AGGIUNTO a mobileUl.`); // DEBUG
        }
    });

    if (mobileUl.hasChildNodes()) {
        mobileMenuTarget.appendChild(mobileUl);
        // console.log('[populateMobileMenu] mobileUl (.mobile-menu-list) appeso a #mobileNavMenu.'); // DEBUG
    } else {
        // console.warn('[populateMobileMenu] mobileUl è VUOTO.'); // DEBUG
    }
    // console.log('[populateMobileMenu] Fine.'); // DEBUG
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
            if (dropdownMenu.style.display === 'block' &&
                !dropdownToggle.contains(event.target) &&
                !dropdownMenu.contains(event.target)) {
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
    aClasses.forEach(cls => link.classList.add(cls));
    if (onClickHandler) {
        link.addEventListener('click', onClickHandler);
    }
    listItem.appendChild(link);
    return listItem;
}

async function getUserProfile(userId) {
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

    // Gestione Visibilità "Scrivi Articolo" (nel sottomenu mobile)
    const navWriteArticleDropdownLiMobile = document.getElementById('mobile-navWriteArticleDropdown');
    if (navWriteArticleDropdownLiMobile) {
        navWriteArticleDropdownLiMobile.style.display = user ? 'list-item' : 'none';
    }
    // E per desktop (nel dropdown community)
    const navWriteArticleDropdownLiDesktop = document.getElementById('navWriteArticleDropdown');
    if (navWriteArticleDropdownLiDesktop) {
        navWriteArticleDropdownLiDesktop.style.display = user ? 'list-item' : 'none';
    }


    if (!mobileMenuContainer) {
        return;
    }

    // Rimuovi SEMPRE i link dinamici di sessione dal menu mobile prima di aggiungerli
    // Questo previene duplicati se la funzione viene chiamata più volte.
    const dynamicMobileLiIds = ['mobile-profile-link-li', 'mobile-logout-link-li', 'mobile-login-link-li'];
    dynamicMobileLiIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.parentNode === mobileMenuContainer) {
            el.remove();
        }
    });

    if (user) {
        let userProfile = await getUserProfile(user.uid);
        let userNickname = userProfile?.nickname || (user.email ? user.email.split('@')[0] : 'Utente');
        // Non troncare il nickname per il menu mobile, c'è più spazio verticale
        // if (userNickname.length > 15) userNickname = userNickname.substring(0, 12) + '...';

        // Voce "My Profile" per il menu mobile
        const profileHTMLMobile = `<span class="material-symbols-rounded">account_circle</span> <span class="nav-text">My Profile (${escapeHTML(userNickname)})</span>`;
        mobileMenuContainer.appendChild(createNavLinkItem('mobile-profile-link-li', 'mobile-profile-link', 'profile.html', profileHTMLMobile, ['nav-item']));

        // Voce "Logout" per il menu mobile
        const logoutHandler = async (e) => { /* ... (come prima) ... */ };
        const logoutHTMLMobile = `<span class="material-symbols-rounded">logout</span> <span class="nav-text">Logout</span>`;
        mobileMenuContainer.appendChild(createNavLinkItem('mobile-logout-link-li', 'mobile-logout-link', '#', logoutHTMLMobile, ['nav-item'], logoutHandler));

    } else { // Utente non loggato
        // Voce "Login" per il menu mobile
        const loginHTMLMobile = `<span class="material-symbols-rounded">login</span> <span class="nav-text">Login / Register</span>`;
        mobileMenuContainer.appendChild(createNavLinkItem('mobile-login-link-li', 'mobile-login-link', 'register.html', loginHTMLMobile, ['nav-item']));
        // Nota: Questo link porta a register.html. Se vuoi che apra la modale di login,
        // dovrai cambiare href a '#' e aggiungere l'event listener per aprire la modale,
        // come avevamo discusso per il link Login nel menu mobile precedentemente.
        // Esempio per aprire modale:
        // mobileMenuContainer.appendChild(createNavLinkItem('mobile-login-link-li', 'mobile-login-link', '#', loginHTMLMobile, ['nav-item'], (e) => {
        //    e.preventDefault();
        //    const loginModalEl = document.getElementById('loginModal');
        //    if(loginModalEl) loginModalEl.style.display = 'block';
        //    if(mobileMenuNode.classList.contains('active')) toggleMobileMenu(); // Chiudi menu mobile
        // }));
    }
}

async function updateAdminDashboardLink(user) {
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

// --- Funzioni Homepage Esistenti ---
export { db, auth }; 

async function loadHomeMiniLeaderboard() {
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
            avatarImg.onerror = () => { /* gestione errore avatar */ };
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

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', function () {
    initializeNewNavbar(); 
    const loginForm = document.getElementById('loginForm');
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const loginModal = document.getElementById('loginModal');
    const showLoginBtn = document.getElementById('showLoginBtn'); 
    const closeLoginBtn = loginModal ? loginModal.querySelector('.closeLoginBtn') : null;
    const openModal = (modal) => { if (modal) modal.style.display = 'block'; };
    const closeModal = (modal) => { if (modal) modal.style.display = 'none'; };

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
                } catch (error) { /* Gestisci errore selettore */ }
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
            .then(() => { /* Interazioni inizializzate da onAuthStateChanged */ })
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

// --- onAuthStateChanged ---
onAuthStateChanged(auth, async (user) => { 
    console.log('[onAuthStateChanged] Stato autenticazione cambiato. Utente:', user ? `'${user.uid}'` : 'null');

    updateHeaderAuthContainersVisibility(user);
    if (user) {
        await loadHeaderUserProfileDisplay(user);
    } else {
        loadHeaderUserProfileDisplay(null); 
    }
    await updateLoginLogoutLinks(user); 
    await updateAdminDashboardLink(user);

    if (document.getElementById('articlesGrid')) { 
         setTimeout(async () => { 
            await initializeHomepageArticleInteractions(user);
        }, 100); 
    }
    if (user && user.emailVerified) { 
        const isNewlyRegistered = sessionStorage.getItem('newlyRegistered');
        if (isNewlyRegistered) {
            try {
                const profileSnap = await getDoc(doc(db, 'userProfiles', user.uid));
                let nickname = user.email.split('@')[0];
                if (profileSnap.exists() && profileSnap.data().nickname) {
                    nickname = profileSnap.data().nickname;
                }
                showToast(`Benvenuto/a su asyncDonkey.io, ${escapeHTML(nickname)}!`, 'success', 7000);
            } catch (e) {
                showToast(`Benvenuto/a su asyncDonkey.io!`, 'success', 7000);
            } finally {
                sessionStorage.removeItem('newlyRegistered');
            }
        }
    }
    console.log('[onAuthStateChanged] Aggiornamento UI completato.');
});
