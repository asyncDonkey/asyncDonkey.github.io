// js/main.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyBrXQ4qwB9JhZF4kSIPyvxQYw1X4PGXpFk", // Replace with your actual API key if different
    authDomain: "asyncdonkey.firebaseapp.com",
    projectId: "asyncdonkey",
    storageBucket: "asyncdonkey.appspot.com",
    messagingSenderId: "939854468396",
    appId: "1:939854468396:web:9646d4f51737add7704889",
    measurementId: "G-EQDBKQM3YE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Export shared instances
export { db, auth };

// Initial console verification (can be removed later)
// console.log("main.js: db instance created:", db ? 'OK' : 'FAIL');
// console.log("main.js: auth instance created:", auth ? 'OK' : 'FAIL');


document.addEventListener('DOMContentLoaded', function() {

    // --- Standard UI Enhancements ---
    setupSmoothScrolling();
    setupScrollToTopButton();
    setupInteractiveSkills();
    setupThemeSwitcher(); // Initialize theme switcher and theme

    // --- Firebase Auth Related DOM Elements ---
    const authContainer = document.getElementById('authContainer');
    const userProfileContainer = document.getElementById('userProfileContainer');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const logoutButton = document.getElementById('logoutButton');
    const userDisplayName = document.getElementById('userDisplayName');
    const headerUserAvatar = document.getElementById('headerUserAvatar');
    const profileNavLink = document.getElementById('profileNav');
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    const commentNameSection = document.getElementById('commentNameSection');
    const commentNameInput = document.getElementById('commentName');

    setupModalControls(); // Setup listeners for login/signup modals

    // --- Core Functions ---

    /** Setup Smooth Scrolling */
    function setupSmoothScrolling() {
        const navLinks = document.querySelectorAll('header nav a[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    /** Setup Scroll-to-Top Button */
    function setupScrollToTopButton() {
        const scrollToTopBtn = document.getElementById('scrollToTopBtn');
        const scrollThreshold = 200;
        if (!scrollToTopBtn) return;
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > scrollThreshold) {
                scrollToTopBtn.classList.add('show');
            } else {
                scrollToTopBtn.classList.remove('show');
            }
        });
        scrollToTopBtn.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /** Setup Interactive Skills Section */
    function setupInteractiveSkills() {
        const skillBadges = document.querySelectorAll('#skills ul li[data-skill-name]');
        const skillDetailsContainer = document.getElementById('skillDetails');
        let currentlyActiveSkillBadge = null;
        if (!skillDetailsContainer || skillBadges.length === 0) return;

        skillBadges.forEach(badge => {
            badge.addEventListener('click', function() {
                const skillName = this.dataset.skillName;
                const skillDescription = this.dataset.description || "No further details available.";
                if (currentlyActiveSkillBadge) {
                    currentlyActiveSkillBadge.classList.remove('active-skill');
                }
                this.classList.add('active-skill');
                currentlyActiveSkillBadge = this;
                skillDetailsContainer.innerHTML = `<h3>${skillName}</h3><p>${skillDescription}</p>`;
            });
        });
    }

    /** Setup Theme Switcher */
    function setupThemeSwitcher() {
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        const bodyElement = document.body;
        const moonIcon = '🌙';
        const sunIcon = '☀️';

        function applyTheme(theme) {
            if (theme === 'dark') {
                bodyElement.classList.add('dark-mode');
                if (themeToggleBtn) themeToggleBtn.textContent = sunIcon;
                localStorage.setItem('theme', 'dark');
            } else {
                bodyElement.classList.remove('dark-mode');
                if (themeToggleBtn) themeToggleBtn.textContent = moonIcon;
                localStorage.setItem('theme', 'light');
            }
        }

        function initializeTheme() {
            const savedTheme = localStorage.getItem('theme');
            const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (savedTheme) { applyTheme(savedTheme); }
            else if (prefersDarkScheme) { applyTheme('dark'); }
            else { applyTheme('light'); }
        }

        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                bodyElement.classList.contains('dark-mode') ? applyTheme('light') : applyTheme('dark');
            });
        }
        initializeTheme(); // Apply theme on load
    }

     /** Setup Modal Controls */
     function setupModalControls() {
        const showLoginBtn = document.getElementById('showLoginBtn');
        const showSignupBtn = document.getElementById('showSignupBtn');
        const closeLoginBtn = document.querySelector('.closeLoginBtn');
        const closeSignupBtn = document.querySelector('.closeSignupBtn');

        if (showLoginBtn && loginModal) { showLoginBtn.addEventListener('click', () => loginModal.style.display = 'block'); }
        if (showSignupBtn && signupModal) { showSignupBtn.addEventListener('click', () => signupModal.style.display = 'block'); }
        if (closeLoginBtn && loginModal) { closeLoginBtn.addEventListener('click', () => loginModal.style.display = 'none'); }
        if (closeSignupBtn && signupModal) { closeSignupBtn.addEventListener('click', () => signupModal.style.display = 'none'); }

        // Close modal on outside click
        window.addEventListener('click', (event) => {
            if (loginModal && event.target == loginModal) { loginModal.style.display = 'none'; }
            if (signupModal && event.target == signupModal) { signupModal.style.display = 'none'; }
        });
    }


    /** Loads user profile data and updates header UI */
    async function loadUserProfile(user) {
        if (!user || !userProfileContainer) return; // Exit if no user or container missing

        // Initial state while loading
        if (userDisplayName) userDisplayName.textContent = `Loading...`;
        if (headerUserAvatar) {
            headerUserAvatar.style.display = 'inline-block'; // Show placeholder area
            headerUserAvatar.src = '';
            headerUserAvatar.alt = 'Loading avatar';
            headerUserAvatar.style.backgroundColor = '#eee';
        }

        const userProfileRef = doc(db, "userProfiles", user.uid);
        try {
            const docSnap = await getDoc(userProfileRef);
            let nicknameToShow = user.email.split('@')[0]; // Default to email part

            if (docSnap.exists() && docSnap.data().nickname) {
                nicknameToShow = docSnap.data().nickname;
                // console.log("main.js - Nickname found:", nicknameToShow);
            } else {
                // console.log("main.js - No profile/nickname found, using default.");
            }

            // Update display name
            if (userDisplayName) userDisplayName.textContent = `Ciao, ${nicknameToShow}`;

            // Update DiceBear avatar
            if (headerUserAvatar) {
                const avatarStyle = 'identicon'; // Or your preferred style
                const avatarUrl = `https://api.dicebear.com/8.x/${avatarStyle}/svg?seed=${user.uid}`;
                headerUserAvatar.src = avatarUrl;
                headerUserAvatar.alt = `${nicknameToShow}'s Avatar`;
                headerUserAvatar.onload = () => { headerUserAvatar.style.backgroundColor = 'transparent'; };
                headerUserAvatar.onerror = () => { headerUserAvatar.style.display = 'none'; console.warn("Failed to load header avatar."); };
            }

        } catch (error) {
            console.error("main.js - Error loading user profile:", error);
            // Fallback display on error
            if (userDisplayName) userDisplayName.textContent = `Ciao, ${user.email.split('@')[0]}`;
            if (headerUserAvatar) headerUserAvatar.style.display = 'none';
        }
    }

    /** Updates UI elements based on authentication state */
    function updateAuthUI(user) {
        if (user) { // Logged IN
            if (authContainer) authContainer.style.display = 'none';
            if (userProfileContainer) userProfileContainer.style.display = 'flex'; // Use flex to align items
            if (logoutButton) logoutButton.style.display = 'inline-block';
            if (profileNavLink) profileNavLink.style.display = 'list-item';
            if (loginModal?.style.display === 'block') loginModal.style.display = 'none';
            if (signupModal?.style.display === 'block') signupModal.style.display = 'none';
            if (commentNameSection) commentNameSection.style.display = 'none';
            if (commentNameInput) commentNameInput.required = false;
            loadUserProfile(user); // Load/refresh user details
        } else { // Logged OUT
            if (authContainer) authContainer.style.display = 'flex';
            if (userProfileContainer) userProfileContainer.style.display = 'none';
            if (logoutButton) logoutButton.style.display = 'none';
            if (profileNavLink) profileNavLink.style.display = 'none';
            if (userDisplayName) userDisplayName.textContent = '';
            if (headerUserAvatar) headerUserAvatar.style.display = 'none';
            if (commentNameSection) commentNameSection.style.display = 'block';
            if (commentNameInput) commentNameInput.required = true;
        }
    }

    /** Translates Firebase Auth error codes */
    function traduireErroreFirebase(codiceErrore) {
        // Simple translation map
        const errors = {
            "auth/invalid-email": "L'indirizzo email non è valido.",
            "auth/user-disabled": "Questo account utente è stato disabilitato.",
            "auth/user-not-found": "Nessun utente trovato con questa email.",
            "auth/wrong-password": "Password errata.",
            "auth/email-already-in-use": "L'indirizzo email è già utilizzato.",
            "auth/operation-not-allowed": "Operazione non permessa.",
            "auth/weak-password": "La password è troppo debole (min. 6 caratteri)."
        };
        return errors[codiceErrore] || `Si è verificato un errore (${codiceErrore}).`;
    }

    // --- Event Listeners ---

    // Authentication State Change Listener
    onAuthStateChanged(auth, (user) => {
        // console.log("main.js - Auth state changed, user:", user ? user.uid : 'None');
        updateAuthUI(user);
    });

    // Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.loginEmail.value;
            const password = loginForm.loginPassword.value;
            try {
                await signInWithEmailAndPassword(auth, email, password);
                loginForm.reset();
                // UI updated by onAuthStateChanged
            } catch (error) {
                console.error("main.js - Login Error:", error.code, error.message);
                alert("Errore Login: " + traduireErroreFirebase(error.code));
            }
        });
    }

    // Signup Form Submission
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = signupForm.signupEmail.value;
            const password = signupForm.signupPassword.value;
            try {
                // 1. Create Auth user
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                console.log("main.js - Auth Registration OK:", user.uid);

                // 2. Create Firestore profile document
                const userProfileRef = doc(db, "userProfiles", user.uid);
                const userProfileData = {
                    email: user.email,
                    nickname: user.email.split('@')[0],
                    createdAt: serverTimestamp() // Use imported function
                };
                // console.log("main.js - Attempting profile creation with data:", userProfileData);
                try {
                    await setDoc(userProfileRef, userProfileData);
                    console.log("main.js - Base profile created successfully for:", user.uid);
                } catch (firestoreError) {
                    console.error(`main.js - FIRESTORE PROFILE CREATION FAILED for ${user.uid}:`, firestoreError);
                    alert("WARNING: Registration partially successful. Could not create user profile record.");
                }
                signupForm.reset();
                alert("Registration successful!"); // User is automatically logged in
            } catch (authError) {
                console.error("main.js - Auth Registration Error:", authError.code, authError.message);
                alert("Registration Error: " + traduireErroreFirebase(authError.code));
            }
        });
    }

    // Logout Button Click
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await signOut(auth);
                // console.log("main.js - Logout successful.");
                // UI updated by onAuthStateChanged
            } catch (error) {
                console.error("main.js - Logout Error:", error);
                alert("Logout Error: " + error.message);
            }
        });
    }

}); // End DOMContentLoaded
