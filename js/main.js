// js/main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getFirestore, doc, getDoc, setDoc, serverTimestamp,
    collection, query, where, orderBy, limit, getDocs
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

// --- Avatar Generation ---
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

// Export db and auth for use in other modules if needed by them
// generateBlockieAvatar is already exported above.
export { db, auth };

// --- Homepage Mini Leaderboard ---
const MAX_ENTRIES_HOME_LEADERBOARD = 5; // Number of entries for the home mini leaderboard

async function loadHomeMiniLeaderboard() {
    const leaderboardListElement = document.getElementById('homeMiniLeaderboardList');
    if (!leaderboardListElement) {
        // Element not found, likely not on the homepage. Do nothing.
        return;
    }
    if (!db) {
        console.error("DB instance not available for home mini-leaderboard.");
        leaderboardListElement.innerHTML = '<li>Errore DB.</li>';
        return;
    }

    leaderboardListElement.innerHTML = '<li>Caricamento...</li>'; // Loading message

    try {
        const scoresCollectionRef = collection(db, "leaderboardScores");
        const q = query(
            scoresCollectionRef,
            where("gameId", "==", "donkeyRunner"), // Filter for the specific game
            orderBy("score", "desc"),             // Order by score descending
            limit(MAX_ENTRIES_HOME_LEADERBOARD)   // Limit to the desired number of entries
        );

        const querySnapshot = await getDocs(q);
        leaderboardListElement.innerHTML = ''; // Clear list before populating

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
            avatarImg.className = 'player-avatar'; // CSS will style this
            const seedForBlockie = entry.userId || entry.initials || entry.userName || `anon-${docSnapshot.id}`;
            avatarImg.src = generateBlockieAvatar(seedForBlockie, 24, { size: 6, scale: 4 }); // Smaller avatar
            avatarImg.alt = `Avatar`; // Alt text for accessibility
            avatarImg.style.backgroundColor = 'transparent'; // Avoid placeholder bg showing through
            avatarImg.onerror = () => { // Fallback if avatar fails to load
                avatarImg.style.backgroundColor = '#ddd';
                avatarImg.alt = 'Err';
                avatarImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' fill='%23ddd'/%3E%3Ctext x='5' y='7.5' font-size='5' text-anchor='middle' fill='%23777'%3E?%3C/text%3E%3C/svg%3E";
            };
            listItem.appendChild(avatarImg);

            const playerInfoSpan = document.createElement('span');
            playerInfoSpan.className = 'player-info';
            const nameSpan = document.createElement('span');
            nameSpan.className = 'player-name';

            // Add flag icon if nationalityCode is present
            if (entry.nationalityCode && entry.nationalityCode !== "OTHER" && entry.nationalityCode.length === 2) {
                const flagIconSpan = document.createElement('span');
                flagIconSpan.classList.add('fi', `fi-${entry.nationalityCode.toLowerCase()}`);
                flagIconSpan.style.marginRight = '5px';
                flagIconSpan.style.fontSize = '1em'; // Adjust size as needed
                flagIconSpan.style.verticalAlign = 'middle';
                nameSpan.appendChild(flagIconSpan);
            }

            let displayName = entry.userName || entry.initials || 'Anonimo';
            if (!entry.userId && entry.initials) displayName = entry.initials; // Show only initials for guests
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
            // This error often means a composite index is needed in Firestore
            leaderboardListElement.innerHTML += '<li>(Indice DB mancante)</li>';
             console.error("Firestore composite index likely missing. Original error:", error.message);
        }
    }
}

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', function() {
    // Select DOM elements (cache them for performance)
    const authContainer = document.getElementById('authContainer');
    const userProfileContainer = document.getElementById('userProfileContainer');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const logoutButton = document.getElementById('logoutButton');
    const userDisplayName = document.getElementById('userDisplayName');
const headerUserAvatar = document.getElementById('headerUserAvatar');
console.log('DOM Query - userDisplayName element:', userDisplayName); // <-- AGGIUNGI QUESTO
console.log('DOM Query - headerUserAvatar element:', headerUserAvatar); // <-- AGGIUNGI QUESTO
    const profileNavLink = document.getElementById('profileNav');
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    const showLoginBtn = document.getElementById('showLoginBtn');
    const showSignupBtn = document.getElementById('showSignupBtn');
    const closeLoginBtn = loginModal ? loginModal.querySelector('.closeLoginBtn') : null;
    const closeSignupBtn = signupModal ? signupModal.querySelector('.closeSignupBtn') : null;
    const commentNameSection = document.getElementById('commentNameSection');
    const commentNameInput = document.getElementById('commentName');
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const skillBadges = document.querySelectorAll('#skills ul li[data-skill-name]');
    const skillDetailsContainer = document.getElementById('skillDetails');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const bodyElement = document.body;

    // --- Utility Functions ---
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // --- UI Setup Functions ---
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
                    // console.error(`Error in selector for smooth scroll: ${targetId}`, error);
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
        applyTheme(savedTheme || (prefersDark ? 'dark' : 'light')); // Apply initial theme
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

        window.addEventListener('click', (event) => { // Close by clicking outside
            if (event.target === loginModal) closeModal(loginModal);
            if (event.target === signupModal) closeModal(signupModal);
        });
    }

    async function loadUserProfile(user) {
        console.log('loadUserProfile - user:', user);
        if (!user || (!userProfileContainer && !userDisplayName && !headerUserAvatar)) {
            // No user or essential UI elements missing, do nothing.
            return;
        }

        let nicknameToShow = user.email ? user.email.split('@')[0] : 'User'; // Fallback nickname
        const seedForAvatar = user.uid; // Use UID for consistent avatar

        if (userDisplayName) userDisplayName.textContent = `Ciao, ${escapeHTML(nicknameToShow)}`;
            if (headerUserAvatar) {
                headerUserAvatar.style.setProperty('display', 'inline-block', 'important'); // Forza la visualizzazione
                console.log('Navbar Debug: #headerUserAvatar display set to inline-block !important');
                headerUserAvatar.src = generateBlockieAvatar(seedForAvatar, 32, { size: 8 });
                headerUserAvatar.alt = `Avatar di ${escapeHTML(nicknameToShow)}`;
                headerUserAvatar.style.backgroundColor = 'transparent';
                headerUserAvatar.onerror = () => {
                    console.warn("Navbar Debug: Failed to load Blockie avatar in header. Hiding avatar.");
                    headerUserAvatar.style.display = 'none';
                };
            }

        const userProfileRef = doc(db, "userProfiles", user.uid);
        try {
            const docSnap = await getDoc(userProfileRef);
            if (docSnap.exists()) {
                nicknameToShow = docSnap.data().nickname || nicknameToShow;
            }
            console.log('loadUserProfile - profile data from DB:', docSnap.data());

            if (userDisplayName) userDisplayName.textContent = `Ciao, ${escapeHTML(nicknameToShow)}`;
            if (headerUserAvatar) {
                headerUserAvatar.src = generateBlockieAvatar(seedForAvatar, 32, { size: 8 });
                headerUserAvatar.alt = `Avatar di ${escapeHTML(nicknameToShow)}`;
                headerUserAvatar.style.backgroundColor = 'transparent';
                headerUserAvatar.onerror = () => {
                    // console.warn("Failed to load Blockie avatar in header.");
                    headerUserAvatar.style.display = 'none';
                };
            }
        } catch (error) {
            // console.error("Error loading user profile from Firestore:", error);
            if (userDisplayName) userDisplayName.textContent = `Ciao, ${escapeHTML(nicknameToShow)}`; // Use fallback name
            if (headerUserAvatar) { // Attempt to generate fallback avatar even on DB error
                try {
                    headerUserAvatar.src = generateBlockieAvatar(seedForAvatar, 32, { size: 8 });
                    headerUserAvatar.alt = `Fallback avatar for ${escapeHTML(nicknameToShow)}`;
                    headerUserAvatar.style.backgroundColor = 'transparent';
                } catch (avatarError) {
                    // console.error("Error generating fallback avatar as well", avatarError);
                    headerUserAvatar.style.display = 'none';
                }
            }
        }
    }

    function updateAuthUI(user) {
        console.log('updateAuthUI - user:', user);
        const elementsToToggle = [
            { el: authContainer, showWhenLoggedOut: true },
            { el: userProfileContainer, showWhenLoggedOut: false }, // display: flex quando loggato
            { el: logoutButton, showWhenLoggedOut: false, displayType: 'inline-block' }, // <-- MODIFICATO displayType
            { el: profileNavLink, showWhenLoggedOut: false, displayType: 'list-item' },
            { el: commentNameSection, showWhenLoggedOut: true }
        ];

        elementsToToggle.forEach(item => {
    if (item.el) {
        const displayStyle = item.displayType || (item.showWhenLoggedOut ? 'flex' : 'none');
        item.el.style.display = user ? (item.showWhenLoggedOut ? 'none' : displayStyle) : (item.showWhenLoggedOut ? displayStyle : 'none');
        
        // Log specifico per userProfileContainer
        if (item.el.id === 'userProfileContainer') {
            console.log(`Navbar Debug: #userProfileContainer display set to '${item.el.style.display}' by elementsToToggle logic. User logged in: ${!!user}`);
        }
    }
});

if (user && userProfileContainer && userProfileContainer.style.display === 'none') {
    console.warn('Navbar Debug: #userProfileContainer was still display:none after elementsToToggle. Forcing to flex.');
    userProfileContainer.style.setProperty('display', 'flex', 'important'); // Prova con !important
    // Verifica subito dopo
    console.log('Navbar Debug: #userProfileContainer display IS NOW:', window.getComputedStyle(userProfileContainer).display);
}

        if (commentNameInput) commentNameInput.required = !user;

        // Clear user-specific info if logged out
        if (!user) {
    if (userDisplayName) userDisplayName.textContent = '';
    if (headerUserAvatar) headerUserAvatar.style.display = 'none';
} else {
    loadUserProfile(user); // loadUserProfile si occuperà di mostrare headerUserAvatar
    if (loginModal && loginModal.style.display === 'block') loginModal.style.display = 'none';
    if (signupModal && signupModal.style.display === 'block') signupModal.style.display = 'none';
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

    // Initialize UI setup functions
    setupSmoothScrolling();
    setupScrollToTopButton();
    setupInteractiveSkills();
    setupThemeSwitcher();
    setupModalControls();

    // Load homepage specific features if on homepage
    if (document.getElementById('homeMiniLeaderboardList')) {
        loadHomeMiniLeaderboard(); // Assicurati che questa sia definita o importata correttamente
    }
    if (document.getElementById('articlesSection')) { // Verifica se la sezione articoli esiste
        displayArticlesSection(); // CHIAMATA ALLA NUOVA FUNZIONE
    }
    if (document.getElementById('glitchzillaDefeatedBanner')) { // Verifica se il banner esiste
        displayGlitchzillaBanner(); // <--- CHIAMATA ALLA NUOVA FUNZIONE PER IL BANNER
    }
    // Add other homepage-specific function calls here if needed

    // --- Authentication Listeners ---
    onAuthStateChanged(auth, updateAuthUI); // Main listener for auth state changes

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.loginEmail.value;
            const password = loginForm.loginPassword.value;
            try {
                await signInWithEmailAndPassword(auth, email, password);
                loginForm.reset();
            } catch (error) {
                // console.error("Firebase Login Error:", error.code, error.message);
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
                alert("La password deve contenere almeno 6 caratteri.");
                return;
            }
            if (nickname.length < 3) {
                alert("Il nickname deve contenere almeno 3 caratteri.");
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
                // Add nationalityCode only if a valid selection is made (not empty and not "OTHER")
                // or if "OTHER" is explicitly selected.
                if (selectedNationalityCode && selectedNationalityCode !== "") {
                    userProfileData.nationalityCode = selectedNationalityCode;
                }

                await setDoc(doc(db, "userProfiles", user.uid), userProfileData);
                signupForm.reset();
                alert("Registrazione avvenuta con successo!");
            } catch (authError) {
                // console.error("Firebase Signup Auth Error:", authError.code, authError.message);
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
                // console.error("Logout Error:", error);
                alert("Errore durante il logout: " + error.message);
            }
        });
    }
}); // End DOMContentLoaded
