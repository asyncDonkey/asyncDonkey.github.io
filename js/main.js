// js/main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getFirestore, doc, getDoc, setDoc, serverTimestamp,
    collection, query, where, orderBy, limit, getDocs,
    updateDoc, increment, arrayUnion, arrayRemove // <-- IMPORTAZIONI AGGIUNTE/CORRETTE
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { createIcon } from './blockies.mjs';
import { displayArticlesSection, displayGlitchzillaBanner } from './homePageFeatures.js';

// --- Firebase Config ---
const firebaseConfig = {
    apiKey: "AIzaSyBrXQ4qwB9JhZF4kSIPyvxQYw1X4PGXpFk",
    authDomain: "asyncdonkey.firebaseapp.com",
    projectId: "asyncdonkey",
    storageBucket: "asyncdonkey.appspot.com",
    messagingSenderId: "939854468396",
    appId: "1:939854468396:web:9646d4f51737add7704889",
    measurementId: "G-EQDBKQM3YE"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Utility Functions (definite a livello di modulo) ---
export function generateBlockieAvatar(seed, imgSize = 40, blockieOptions = {}) {
    if (typeof createIcon !== 'function') {
        console.error("createIcon from Blockies not imported!");
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
            throw new Error("createIcon did not return a valid canvas.");
        }
    } catch (e) {
        console.error("Error generating Blockie avatar:", e, "Seed:", seed);
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${imgSize}' height='${imgSize}' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' fill='%23ddd'/%3E%3Ctext x='5' y='7.5' font-size='5' text-anchor='middle' fill='%23777'%3E?%3C/text%3E%3C/svg%3E`;
    }
}

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function loadUserProfile(user) {
    const userDisplayNameElement = document.getElementById('userDisplayName');
    const headerUserAvatarElement = document.getElementById('headerUserAvatar');
    const userProfileContainerElement = document.getElementById('userProfileContainer');

    // Aggiunto controllo per user, userDisplayNameElement e headerUserAvatarElement
    if (!user || !userDisplayNameElement || !headerUserAvatarElement) {
        // console.warn('loadUserProfile: Utente non loggato o elementi DOM mancanti.');
        if (userDisplayNameElement) userDisplayNameElement.textContent = '';
        if (headerUserAvatarElement) headerUserAvatarElement.style.display = 'none';
        return;
    }

    let nicknameToShow = user.email ? user.email.split('@')[0] : 'User';
    const seedForAvatar = user.uid;

    userDisplayNameElement.textContent = `Ciao, ${escapeHTML(nicknameToShow)}`;
    headerUserAvatarElement.style.setProperty('display', 'inline-block', 'important');
    headerUserAvatarElement.src = generateBlockieAvatar(seedForAvatar, 32, { size: 8 });
    headerUserAvatarElement.alt = `Avatar di ${escapeHTML(nicknameToShow)}`;
    headerUserAvatarElement.style.backgroundColor = 'transparent';
    headerUserAvatarElement.onerror = () => {
        console.warn("Navbar Debug: Failed to load Blockie avatar in header. Hiding avatar.");
        headerUserAvatarElement.style.display = 'none';
    };

    const userProfileRef = doc(db, "userProfiles", user.uid);
    try {
        const docSnap = await getDoc(userProfileRef);
        if (docSnap.exists()) {
            nicknameToShow = docSnap.data().nickname || nicknameToShow;
        }
        userDisplayNameElement.textContent = `Ciao, ${escapeHTML(nicknameToShow)}`;
        headerUserAvatarElement.alt = `Avatar di ${escapeHTML(nicknameToShow)}`; // Aggiorna alt text
    } catch (error) {
        console.error("Errore caricamento profilo utente per navbar:", error);
        // Lascia il nickname di fallback già impostato
    }
}

function updateAuthUI(user) {
    const authContainer = document.getElementById('authContainer');
    const userProfileContainer = document.getElementById('userProfileContainer');
    const logoutButton = document.getElementById('logoutButton');
    const profileNavLink = document.getElementById('profileNav');
    // Rimosso commentNameSection e commentNameInput da qui, sono più specifici di about.html e altre pagine.
    // Se una pagina specifica ne ha bisogno, lo gestirà nel suo script o in onAuthStateChanged locale.

    const elementsToToggle = [
        { el: authContainer, showWhenLoggedOut: true, displayType: 'flex' },
        { el: userProfileContainer, showWhenLoggedOut: false, displayType: 'flex' },
        { el: logoutButton, showWhenLoggedOut: false, displayType: 'inline-block' },
        { el: profileNavLink, showWhenLoggedOut: false, displayType: 'list-item' },
    ];

    elementsToToggle.forEach(item => {
        if (item.el) {
            const displayStyle = item.displayType; // Già include 'flex' o 'inline-block'
            item.el.style.display = user ? (item.showWhenLoggedOut ? 'none' : displayStyle) : (item.showWhenLoggedOut ? displayStyle : 'none');
        }
    });
    
    const userDisplayName = document.getElementById('userDisplayName'); // Definizione spostata
    const headerUserAvatar = document.getElementById('headerUserAvatar'); // Definizione spostata

    if (!user) {
        if (userDisplayName) userDisplayName.textContent = '';
        if (headerUserAvatar) headerUserAvatar.style.display = 'none';
    } else {
        loadUserProfile(user);
        const loginModal = document.getElementById('loginModal');
        const signupModal = document.getElementById('signupModal');
        if (loginModal && loginModal.style.display === 'block') loginModal.style.display = 'none';
        if (signupModal && signupModal.style.display === 'block') signupModal.style.display = 'none';
    }
}

// Export db and auth for use in other modules if needed by them
export { db, auth };


// --- Homepage Mini Leaderboard ---
const MAX_ENTRIES_HOME_LEADERBOARD = 5;

async function loadHomeMiniLeaderboard() {
    const leaderboardListElement = document.getElementById('homeMiniLeaderboardList');
    if (!leaderboardListElement) return;
    if (!db) {
        console.error("DB instance not available for home mini-leaderboard.");
        leaderboardListElement.innerHTML = '<li>Errore DB.</li>';
        return;
    }
    leaderboardListElement.innerHTML = '<li>Caricamento...</li>';
    try {
        const scoresCollectionRef = collection(db, "leaderboardScores");
        const q = query(
            scoresCollectionRef,
            where("gameId", "==", "donkeyRunner"),
            orderBy("score", "desc"),
            limit(MAX_ENTRIES_HOME_LEADERBOARD)
        );
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
            const seedForBlockie = entry.userId || entry.initials || entry.userName || `anon-${docSnapshot.id}`;
            avatarImg.src = generateBlockieAvatar(seedForBlockie, 24, { size: 6, scale: 4 });
            avatarImg.alt = `Avatar`;
            avatarImg.style.backgroundColor = 'transparent';
            avatarImg.onerror = () => {
                avatarImg.style.backgroundColor = '#ddd';
                avatarImg.alt = 'Err';
                avatarImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' fill='%23ddd'/%3E%3Ctext x='5' y='7.5' font-size='5' text-anchor='middle' fill='%23777'%3E?%3C/text%3E%3C/svg%3E";
            };
            listItem.appendChild(avatarImg);
            const playerInfoSpan = document.createElement('span');
            playerInfoSpan.className = 'player-info';
            const nameSpan = document.createElement('span');
            nameSpan.className = 'player-name';
            if (entry.nationalityCode && entry.nationalityCode !== "OTHER" && entry.nationalityCode.length === 2) {
                const flagIconSpan = document.createElement('span');
                flagIconSpan.classList.add('fi', `fi-${entry.nationalityCode.toLowerCase()}`);
                flagIconSpan.style.marginRight = '5px';
                flagIconSpan.style.fontSize = '1em';
                flagIconSpan.style.verticalAlign = 'middle';
                nameSpan.appendChild(flagIconSpan);
            }
            let displayName = entry.userName || entry.initials || 'Anonimo';
            if (!entry.userId && entry.initials) displayName = entry.initials;
            nameSpan.appendChild(document.createTextNode(displayName));
            playerInfoSpan.appendChild(nameSpan);
            listItem.appendChild(playerInfoSpan);
            const scoreSpan = document.createElement('span');
            scoreSpan.className = 'player-score';
            scoreSpan.textContent = entry.score !== undefined ? entry.score.toLocaleString() : '-';
            listItem.appendChild(scoreSpan);
            leaderboardListElement.appendChild(listItem);
            rank++;
        });
    } catch (error) {
        console.error("Error loading home mini-leaderboard:", error);
        leaderboardListElement.innerHTML = '<li>Errore caricamento.</li>';
        if (error.code === 'failed-precondition') {
            leaderboardListElement.innerHTML += '<li>(Indice DB mancante)</li>';
            console.error("Firestore composite index likely missing. Original error:", error.message);
        }
    }
}

// --- FUNZIONI PER LIKE ARTICOLI SULLA HOMEPAGE (definite a livello di modulo) ---
async function updateHomepageLikeButtonUI(buttonElement, articleId, currentUser) {
    if (!buttonElement || !articleId) return;
    const likeCountSpan = buttonElement.nextElementSibling;
    try {
        const articleRef = doc(db, "articles", articleId);
        const docSnap = await getDoc(articleRef);
        if (docSnap.exists()) {
            const articleData = docSnap.data();
            const likes = articleData.likeCount || 0;
            const likedByUsers = articleData.likedByUsers || [];
            if (likeCountSpan) likeCountSpan.textContent = likes;
            if (currentUser) {
                buttonElement.disabled = false;
                if (likedByUsers.includes(currentUser.uid)) {
                    buttonElement.innerHTML = `💙`;
                    buttonElement.classList.add('liked');
                    buttonElement.title = "Togli il like a questo articolo";
                } else {
                    buttonElement.innerHTML = `🤍`;
                    buttonElement.classList.remove('liked');
                    buttonElement.title = "Metti like a questo articolo";
                }
            } else {
                buttonElement.innerHTML = `🤍`;
                buttonElement.disabled = true;
                buttonElement.title = "Fai login per mettere like";
                buttonElement.classList.remove('liked');
            }
        } else {
            console.warn(`Articolo ${articleId} non trovato per aggiornamento UI like.`);
            if (likeCountSpan) likeCountSpan.textContent = "0";
            buttonElement.innerHTML = `🤍`;
            buttonElement.disabled = true;
        }
    } catch (error) {
        console.error(`Errore durante l'aggiornamento UI like per ${articleId}:`, error);
        if (likeCountSpan) likeCountSpan.textContent = "Err";
        buttonElement.innerHTML = `🤍`;
        buttonElement.disabled = true;
    }
}

async function handleHomepageArticleLike(event) {
    const button = event.currentTarget;
    const articleId = button.dataset.articleId;
    const currentUser = auth.currentUser;
    if (!articleId || !currentUser) {
        alert("Devi essere loggato per mettere like agli articoli.");
        return;
    }
    button.disabled = true;
    const articleRef = doc(db, "articles", articleId);
    try {
        const docSnap = await getDoc(articleRef);
        if (!docSnap.exists()) {
            console.error("Articolo non trovato per il like/unlike.");
            alert("Errore: articolo non trovato.");
            button.disabled = false;
            return;
        }
        const articleData = docSnap.data();
        const likedByUsers = articleData.likedByUsers || [];
        const userHasLiked = likedByUsers.includes(currentUser.uid);
        let newLikeCountOp;
        let userArrayUpdateOp;
        if (userHasLiked) {
            newLikeCountOp = increment(-1);
            userArrayUpdateOp = arrayRemove(currentUser.uid);
        } else {
            newLikeCountOp = increment(1);
            userArrayUpdateOp = arrayUnion(currentUser.uid);
        }
        if (userHasLiked && (articleData.likeCount || 0) <= 0) {
             console.warn(`Tentativo di unlike su articolo con likeCount <= 0. Articolo: ${articleId}, Like attuali: ${articleData.likeCount}`);
        }
        await updateDoc(articleRef, {
            likeCount: newLikeCountOp,
            likedByUsers: userArrayUpdateOp
        });
        await updateHomepageLikeButtonUI(button, articleId, currentUser);
    } catch (error) {
        console.error("Errore durante il like/unlike dell'articolo:", error);
        alert("Si è verificato un errore. Riprova.");
        await updateHomepageLikeButtonUI(button, articleId, currentUser); // Ripristina UI allo stato del DB
    }
}

export async function initializeHomepageArticleInteractions(currentUser) {
    const articleCards = document.querySelectorAll('#articlesGrid .article-card');
    if (articleCards.length === 0 && document.getElementById('articlesGrid')) {
        return;
    }
    // console.log(`Inizializzazione interazioni per ${articleCards.length} card articolo sulla homepage.`);
    for (const card of articleCards) {
        const articleId = card.dataset.articleId;
        const likeButton = card.querySelector('.homepage-like-btn');
        if (articleId && likeButton) {
            await updateHomepageLikeButtonUI(likeButton, articleId, currentUser);
            likeButton.removeEventListener('click', handleHomepageArticleLike);
            likeButton.addEventListener('click', handleHomepageArticleLike);
        } else {
            if (!articleId) console.warn("Card articolo senza data-article-id:", card);
            if (!likeButton) console.warn(`Bottone like non trovato per articolo ID: ${articleId} in card:`, card);
        }
    }
}

function traduireErroreFirebase(codiceErrore) {
    const errors = {
        "auth/invalid-email": "L'indirizzo email non è valido.",
        "auth/user-disabled": "Questo account utente è stato disabilitato.",
        "auth/user-not-found": "Nessun utente trovato con questa email.",
        "auth/wrong-password": "Password errata.",
        "auth/email-already-in-use": "L'indirizzo email è già utilizzato da un altro account.",
        "auth/operation-not-allowed": "Operazione non permessa (controlla config Firebase Auth).",
        "auth/weak-password": "La password è troppo debole (minimo 6 caratteri)."
    };
    return errors[codiceErrore] || `Si è verificato un errore (${codiceErrore}). Riprova.`;
}

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', function() {
    // Select DOM elements (cache them for performance)
    // Queste variabili ora sono definite all'interno di DOMContentLoaded o nelle funzioni che le usano.
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const logoutButton = document.getElementById('logoutButton');
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const skillBadges = document.querySelectorAll('#skills ul li[data-skill-name]');
    const skillDetailsContainer = document.getElementById('skillDetails');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const bodyElement = document.body;
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    const showLoginBtn = document.getElementById('showLoginBtn');
    const showSignupBtn = document.getElementById('showSignupBtn');
    const closeLoginBtn = loginModal ? loginModal.querySelector('.closeLoginBtn') : null;
    const closeSignupBtn = signupModal ? signupModal.querySelector('.closeSignupBtn') : null;


    // --- UI Setup Functions (definite qui o importate se modularizzate) ---
    function setupSmoothScrolling() {
        document.querySelectorAll('header nav a[href^="#"]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                try {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                } catch (error) {
                    console.error(`Error in selector for smooth scroll: ${targetId}`, error);
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
        if (!skillDetailsContainer || skillBadges.length === 0) return;
        let currentlyActiveSkillBadge = null;
        skillBadges.forEach(badge => {
            badge.addEventListener('click', function() {
                if (currentlyActiveSkillBadge) {
                    currentlyActiveSkillBadge.classList.remove('active-skill');
                }
                this.classList.add('active-skill');
                currentlyActiveSkillBadge = this;
                const skillName = this.dataset.skillName || "Skill";
                const skillDescription = this.dataset.description || "No details available.";
                skillDetailsContainer.innerHTML = `<h3>${escapeHTML(skillName)}</h3><p>${escapeHTML(skillDescription)}</p>`;
            });
        });
    }

    function setupThemeSwitcher() {
        if (!themeToggleBtn || !bodyElement) return;
        const moonIcon = '🌙'; const sunIcon = '☀️';
        function applyTheme(theme) {
            bodyElement.classList.toggle('dark-mode', theme === 'dark');
            themeToggleBtn.textContent = theme === 'dark' ? sunIcon : moonIcon;
            localStorage.setItem('theme', theme);
        }
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
        themeToggleBtn.addEventListener('click', () => {
            applyTheme(bodyElement.classList.contains('dark-mode') ? 'light' : 'dark');
        });
    }

    function setupModalControls() {
        const openModal = (modal) => { if (modal) modal.style.display = 'block'; };
        const closeModal = (modal) => { if (modal) modal.style.display = 'none'; };
        if (showLoginBtn && loginModal) showLoginBtn.addEventListener('click', () => openModal(loginModal));
        if (showSignupBtn && signupModal) showSignupBtn.addEventListener('click', () => openModal(signupModal));
        if (closeLoginBtn) closeLoginBtn.addEventListener('click', () => closeModal(loginModal));
        if (closeSignupBtn) closeSignupBtn.addEventListener('click', () => closeModal(signupModal));
        window.addEventListener('click', (event) => {
            if (event.target === loginModal) closeModal(loginModal);
            if (event.target === signupModal) closeModal(signupModal);
        });
    }

    // Initialize UI setup functions
    setupSmoothScrolling();
    setupScrollToTopButton();
    setupInteractiveSkills();
    setupThemeSwitcher();
    setupModalControls();

    // Load homepage specific features if on homepage
    if (document.getElementById('homeMiniLeaderboardList')) {
        loadHomeMiniLeaderboard();
    }
    if (document.getElementById('articlesSection')) {
        displayArticlesSection();
        // La chiamata a initializeHomepageArticleInteractions è gestita da onAuthStateChanged
    }
    if (document.getElementById('glitchzillaDefeatedBanner')) {
        displayGlitchzillaBanner();
    }

    // --- Authentication Listeners (ora dentro DOMContentLoaded per assicurare che gli elementi esistano) ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.loginEmail.value;
            const password = loginForm.loginPassword.value;
            try {
                await signInWithEmailAndPassword(auth, email, password);
                loginForm.reset();
                // La chiusura del modale e l'aggiornamento UI sono gestiti da onAuthStateChanged -> updateAuthUI
            } catch (error) {
                alert("Errore Login: " + traduireErroreFirebase(error.code));
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = signupForm.signupEmail.value;
            const password = signupForm.signupPassword.value;
            const nickname = signupForm.signupNickname.value.trim();
            const selectedNationalityCode = signupForm.signupNationality.value;

            if (password.length < 6) {
                alert("La password deve contenere almeno 6 caratteri."); return;
            }
            if (nickname.length < 3 || nickname.length > 25) { // Max 25 come da rules
                 alert("Il nickname deve avere tra 3 e 25 caratteri."); return;
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                const userProfileData = {
                    email: user.email,
                    nickname: nickname,
                    createdAt: serverTimestamp(),
                };
                if (selectedNationalityCode && selectedNationalityCode !== "") {
                    userProfileData.nationalityCode = selectedNationalityCode;
                }
                await setDoc(doc(db, "userProfiles", user.uid), userProfileData);
                signupForm.reset();
                alert("Registrazione avvenuta con successo!");
                // La chiusura del modale e l'aggiornamento UI sono gestiti da onAuthStateChanged -> updateAuthUI
            } catch (authError) {
                alert("Errore Registrazione: " + traduireErroreFirebase(authError.code));
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await signOut(auth);
                // UI update is handled by onAuthStateChanged
            } catch (error) {
                alert("Errore durante il logout: " + error.message);
            }
        });
    }
}); // End DOMContentLoaded


// Listener globale per lo stato di autenticazione
// Questo ora è correttamente a livello di modulo e può chiamare updateAuthUI
onAuthStateChanged(auth, (user) => {
    console.log('main.js - Auth state changed. User:', user ? user.uid : "null");
    updateAuthUI(user); // Chiamata alla funzione definita a livello di modulo

    // Inizializza/Aggiorna i like sulla homepage ogni volta che lo stato auth cambia
    if (document.getElementById('articlesGrid')) {
        initializeHomepageArticleInteractions(user);
    } else if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        // Se siamo sulla homepage ma #articlesGrid non è ancora pronto (improbabile con dati statici)
        // Potremmo aggiungere un piccolo timeout o un observer, ma per ora logghiamo.
        console.warn("onAuthStateChanged: #articlesGrid non trovato sulla homepage, i like potrebbero non inizializzarsi correttamente subito.");
    }
});
