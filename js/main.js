// js/main.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
    getFirestore,
    doc,
    getDoc,
    setDoc, // MANTENUTO - Usato nel blocco signupForm se rimane attivo
    serverTimestamp,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    updateDoc,
    increment,
    arrayUnion,
    arrayRemove,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
    getAuth, // MANTENUTO - Essenziale per inizializzare auth
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { createIcon } from './blockies.mjs';
import { displayArticlesSection, displayGlitchzillaBanner } from './homePageFeatures.js';
import { showToast } from './toastNotifications.js'; // Assicurati che showToast sia importato

// --- Firebase Config ---
const firebaseConfig = {
    apiKey: 'AIzaSyBrXQ4qwB9JhZF4kSIPyvxQYw1X4PGXpFk', // Sostituisci se necessario
    authDomain: 'asyncdonkey.firebaseapp.com',
    projectId: 'asyncdonkey',
    storageBucket: 'asyncdonkey.appspot.com',
    messagingSenderId: '939854468396',
    appId: '1:939854468396:web:9646d4f51737add7704889',
    measurementId: 'G-EQDBKQM3YE',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // CORRETTO - getAuth è necessario

// --- Utility Functions ---
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

async function loadUserProfile(user) {
    const userDisplayNameElement = document.getElementById('userDisplayName');
    const headerUserAvatarElement = document.getElementById('headerUserAvatar');

    if (!user || !userDisplayNameElement || !headerUserAvatarElement) {
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
        headerUserAvatarElement.style.display = 'none';
    };

    const userProfileRef = doc(db, 'userProfiles', user.uid);
    try {
        const docSnap = await getDoc(userProfileRef);
        if (docSnap.exists()) {
            nicknameToShow = docSnap.data().nickname || nicknameToShow;
        }
        userDisplayNameElement.textContent = `Ciao, ${escapeHTML(nicknameToShow)}`;
        headerUserAvatarElement.alt = `Avatar di ${escapeHTML(nicknameToShow)}`;
    } catch (error) {
        console.error('Errore caricamento profilo utente per navbar:', error);
    }
}

function updateAuthUI(user) {
    const authContainer = document.getElementById('authContainer');
    const userProfileContainer = document.getElementById('userProfileContainer');
    const profileNavLink = document.getElementById('profileNav');
    const writeArticleNavLink = document.getElementById('navWriteArticle');

    const elementsToToggleBasedOnLogin = [
        { el: authContainer, showWhenLoggedOut: true, displayType: 'flex' },
        { el: userProfileContainer, showWhenLoggedOut: false, displayType: 'flex' },
        { el: profileNavLink, showWhenLoggedOut: false, displayType: 'list-item' },
        { el: writeArticleNavLink, showWhenLoggedOut: false, displayType: 'list-item' },
    ];

    elementsToToggleBasedOnLogin.forEach((item) => {
        if (item.el) {
            const displayStyle = user
                ? item.showWhenLoggedOut
                    ? 'none'
                    : item.displayType
                : item.showWhenLoggedOut
                  ? item.displayType
                  : 'none';
            item.el.style.display = displayStyle;
        }
    });

    const userDisplayName = document.getElementById('userDisplayName');
    const headerUserAvatar = document.getElementById('headerUserAvatar');

    if (!user) {
        if (userDisplayName) userDisplayName.textContent = '';
        if (headerUserAvatar) headerUserAvatar.style.display = 'none';
    } else {
        loadUserProfile(user);
        const loginModal = document.getElementById('loginModal');
        // const signupModal = document.getElementById('signupModal'); // RIMOSSO RIFERIMENTO ALLA MODALE SIGNUP

        if (loginModal && loginModal.style.display === 'block') loginModal.style.display = 'none';
        // La riga sotto che chiudeva signupModal non è più necessaria se la modale HTML è stata rimossa
        // if (signupModal && signupModal.style.display === 'block') signupModal.style.display = 'none';
    }
}

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
        // La query dovrebbe già essere corretta per prendere i dati necessari (incluso userId)
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
            avatarImg.style.backgroundColor = 'transparent'; // Già presente
            avatarImg.onerror = () => { /* ... gestione errore avatar ... */ };
            listItem.appendChild(avatarImg);

            const playerInfoSpan = document.createElement('span');
            playerInfoSpan.className = 'player-info'; // Contenitore per nome e bandiera

            // Elemento per il nome (potrebbe essere un link o testo semplice)
            const nameElementContainer = document.createElement('span');
            nameElementContainer.className = 'player-name'; // Mantieni la classe per lo stile

            // Aggiungi la bandierina prima del nome/link
            if (entry.nationalityCode && entry.nationalityCode !== 'OTHER' && entry.nationalityCode.length === 2) {
                const flagIconSpan = document.createElement('span');
                flagIconSpan.classList.add('fi', `fi-${entry.nationalityCode.toLowerCase()}`);
                flagIconSpan.style.marginRight = '5px';
                flagIconSpan.style.verticalAlign = 'middle';
                nameElementContainer.appendChild(flagIconSpan);
            }

            let displayName = entry.userName || entry.initials || 'Anonimo';

            if (entry.userId) { // Utente Registrato -> Crea Link
                const profileLink = document.createElement('a');
                profileLink.href = `profile.html?userId=${entry.userId}`;
                profileLink.textContent = displayName;
                // Aggiungi eventuali classi CSS specifiche per i link nei profili se necessario
                // profileLink.classList.add('leaderboard-profile-link');
                nameElementContainer.appendChild(profileLink);
            } else { // Utente Ospite -> Testo Semplice
                if (entry.initials) {
                    displayName = entry.initials + ' (Ospite)';
                } else {
                    displayName += ' (Ospite)';
                }
                nameElementContainer.appendChild(document.createTextNode(displayName));
            }

            playerInfoSpan.appendChild(nameElementContainer); // Aggiungi il contenitore del nome (con link o testo)
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
    if (!buttonElement || !articleId) {
        return;
    }
    const likeCountSpan = buttonElement.nextElementSibling;
    if (!likeCountSpan || !likeCountSpan.classList.contains('homepage-like-count')) {
        console.warn(`Span conteggio like non trovato o errato per articleId: ${articleId}.`);
    }

    try {
        const articleRef = doc(db, 'articles', articleId);
        const docSnap = await getDoc(articleRef);

        if (docSnap.exists()) {
            const articleData = docSnap.data();
            if (articleData.status !== 'published') {
                if (likeCountSpan) likeCountSpan.textContent = articleData.likeCount || 0;
                buttonElement.innerHTML = `🤍`;
                buttonElement.disabled = true;
                buttonElement.title = 'Articolo non disponibile per like';
                buttonElement.classList.remove('liked');
                return;
            }

            const likes = articleData.likeCount || 0;
            const likedByUsers = articleData.likedByUsers || [];

            if (likeCountSpan) {
                likeCountSpan.textContent = likes;
            }

            if (currentUser) {
                buttonElement.disabled = false;
                const userHasLiked = Array.isArray(likedByUsers) && likedByUsers.includes(currentUser.uid);
                if (userHasLiked) {
                    buttonElement.innerHTML = `💙`;
                    buttonElement.classList.add('liked');
                    buttonElement.title = "Hai messo 'Mi piace' (vedi articolo per cambiare)";
                } else {
                    buttonElement.innerHTML = `🤍`;
                    buttonElement.classList.remove('liked');
                    buttonElement.title = "Metti 'Mi piace' (vedi articolo)";
                }
            } else {
                buttonElement.innerHTML = `🤍`;
                buttonElement.disabled = true;
                buttonElement.title = 'Fai login per mettere like';
                buttonElement.classList.remove('liked');
            }
        } else {
            console.warn(`Articolo "${articleId}" non trovato in Firestore.`);
            if (likeCountSpan) likeCountSpan.textContent = '0';
            buttonElement.innerHTML = `🤍`;
            buttonElement.disabled = true;
        }
    } catch (error) {
        console.error(`Errore Firestore aggiornamento UI like per articolo "${articleId}":`, error);
        if (likeCountSpan) likeCountSpan.textContent = 'Err';
        buttonElement.innerHTML = `🤍`;
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
    if (!articlesGrid) {
        return;
    }
    const articleCards = articlesGrid.querySelectorAll('.article-card');

    if (articleCards.length === 0) {
        return;
    }

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
    return errors[codiceErrore] || `Errore (${codiceErrore}). Riprova.`; // Modificato il fallback
}

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');

    const logoutButton = document.getElementById('logoutButton');
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const bodyElement = document.body;
    const loginModal = document.getElementById('loginModal');
    // const signupModal = document.getElementById('signupModal'); // RIMOSSO - La modale signup è stata eliminata
    const showLoginBtn = document.getElementById('showLoginBtn');
    // const showSignupBtn = document.getElementById('showSignupBtn'); // RIMOSSO - Ora è un link diretto in HTML, non apre modale
    const closeLoginBtn = loginModal ? loginModal.querySelector('.closeLoginBtn') : null;
    // const closeSignupBtn = signupModal ? signupModal.querySelector('.closeSignupBtn') : null; // RIMOSSO

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
                skillDetailsContainer.innerHTML = `<h3>${escapeHTML(skillName)}</h3><p>${escapeHTML(
                    skillDescription
                )}</p>`;
            });
        });
    }
    function setupThemeSwitcher() {
        if (!themeToggleBtn || !bodyElement) return;
        const moonIcon = '🌙';
        const sunIcon = '☀️';
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
        const openModal = (modal) => {
            if (modal) modal.style.display = 'block';
        };
        const closeModal = (modal) => {
            if (modal) modal.style.display = 'none';
        };

        if (showLoginBtn && loginModal) {
            showLoginBtn.addEventListener('click', () => openModal(loginModal));
        }

        // RIMOSSO: if (showSignupBtn && signupModal) showSignupBtn.addEventListener('click', () => openModal(signupModal));

        if (closeLoginBtn) {
            closeLoginBtn.addEventListener('click', () => closeModal(loginModal));
        }
        // RIMOSSO: if (closeSignupBtn) closeSignupBtn.addEventListener('click', () => closeModal(signupModal));

        window.addEventListener('click', (event) => {
            if (event.target === loginModal) closeModal(loginModal);
            // RIMOSSO: if (event.target === signupModal) closeModal(signupModal);
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
                if (auth.currentUser) {
                    initializeHomepageArticleInteractions(auth.currentUser);
                }
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
            try {
                await signInWithEmailAndPassword(auth, email, password);
                loginForm.reset();
            } catch (error) {
                const loginModalErrorDiv = document.querySelector('#loginModal .error-message');
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

    // RIMOSSO: Blocco if (signupForm) { ... }
    // L'event listener per il signupForm è ora gestito in js/register.js
    // Se il signupForm è ancora referenziato qui, è un residuo e dovrebbe essere rimosso
    // dato che la modale di signup non esiste più in questo contesto.
    // Per sicurezza, lo commento invece di rimuoverlo completamente se hai ancora
    // un elemento con id="signupForm" in qualche pagina per altri scopi (improbabile).
    /*
    if (signupForm) { // QUESTO BLOCCO VA RIMOSSO SE signupForm ERA SOLO PER LA MODALE
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = signupForm.signupEmail.value;
            const password = signupForm.signupPassword.value;
            const nickname = signupForm.signupNickname.value.trim();
            const selectedNationalityCode = signupForm.signupNationality.value;
            if (password.length < 6) {
                showToast('Password min. 6 caratteri.');
                return;
            }
            if (nickname.length < 3 || nickname.length > 25) {
                showToast('Nickname 3-25 caratteri.');
                return;
            }
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                const userProfileData = {
                    email: user.email,
                    nickname: nickname,
                    createdAt: serverTimestamp(),
                };
                if (selectedNationalityCode && selectedNationalityCode !== '') {
                    userProfileData.nationalityCode = selectedNationalityCode;
                }
                await setDoc(doc(db, 'userProfiles', user.uid), userProfileData);
                signupForm.reset();
                showToast('Registrazione avvenuta con successo!');
            } catch (authError) {
                showToast('Errore Registrazione: ' + traduireErroreFirebase(authError.code));
            }
        });
    }
    */

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await signOut(auth);
                showToast('Logout effettuato con successo!', 'info');
                if (
                    window.location.pathname.includes('profile.html') ||
                    window.location.pathname.includes('admin-dashboard.html') ||
                    window.location.pathname.includes('submit-article.html')
                ) {
                    window.location.href = 'index.html';
                }
            } catch (error) {
                showToast('Errore logout: ' + error.message, 'error');
            }
        });
    }
});

onAuthStateChanged(auth, (user) => {
    console.log('main.js - Auth state changed. User:', user ? user.uid : 'null');
    updateAuthUI(user);

    const articlesGridElement = document.getElementById('articlesGrid');
    if (articlesGridElement && typeof initializeHomepageArticleInteractions === 'function') {
        setTimeout(() => {
            if (articlesGridElement.querySelector('.article-card')) {
                initializeHomepageArticleInteractions(user);
            }
        }, 250);
    }

    if (user && user.emailVerified) {
        const isNewlyRegistered = sessionStorage.getItem('newlyRegistered');
        if (isNewlyRegistered) {
            getDoc(doc(db, 'userProfiles', user.uid))
                .then((profileSnap) => {
                    if (profileSnap.exists()) {
                        const nickname = profileSnap.data().nickname || user.email.split('@')[0];
                        showToast(`Benvenuto/a su asyncDonkey.io, ${nickname}!`, 'success', 7000);
                    } else {
                        showToast(`Benvenuto/a su asyncDonkey.io!`, 'success', 7000);
                    }
                    sessionStorage.removeItem('newlyRegistered');
                })
                .catch(() => {
                    showToast(`Benvenuto/a su asyncDonkey.io!`, 'success', 7000);
                    sessionStorage.removeItem('newlyRegistered');
                });
        }
    }
});
