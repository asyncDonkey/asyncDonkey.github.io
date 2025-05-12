// js/main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { createIcon } from './blockies.mjs';

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

// --- FUNZIONE HELPER PER AVATAR BLOCKIES ---
export function generateBlockieAvatar(seed, imgSize = 40, blockieOptions = {}) {
    if (typeof createIcon !== 'function') { // Verifica se createIcon è stata importata
        console.error("Funzione createIcon da Blockies non definita o non importata!");
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' fill='%23ddd'/%3E%3Ctext x='5' y='7.5' font-size='5' text-anchor='middle' fill='%23777'%3E?%3C/text%3E%3C/svg%3E"; // Fallback
    }
    try {
        const defaultOptions = {
            seed: String(seed).toLowerCase(),
            size: 8, // Numero di blocchi per lato (default della libreria)
            scale: 5, // Pixel per blocco (default della libreria è 4, qui impostato a 5 per un avatar di 40px se size=8)
            // color: '#hexcolor', // Colore principale opzionale
            // bgcolor: '#hexcolor', // Colore di sfondo opzionale
            // spotcolor: '#hexcolor' // Colore "macchia" opzionale
        };
        const options = { ...defaultOptions, ...blockieOptions };
        options.scale = Math.max(1, Math.round(imgSize / options.size));

        const canvasElement = createIcon(options);
        return canvasElement.toDataURL();
    } catch (e) {
        console.error("Errore durante la generazione dell'avatar Blockie:", e, "Seed:", seed);
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' fill='%23ddd'/%3E%3Ctext x='5' y='7.5' font-size='5' text-anchor='middle' fill='%23777'%3E?%3C/text%3E%3C/svg%3E"; 
    }
}

export { db, auth };

document.addEventListener('DOMContentLoaded', function() {
    // --- Standard UI Enhancements ---
    setupSmoothScrolling();
    setupScrollToTopButton();
    setupInteractiveSkills();
    setupThemeSwitcher();

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


 // QUESTA È L'UNICA DEFINIZIONE DI loadUserProfile CHE DEVE RIMANERE
async function loadUserProfile(user) {
    const userProfileContainer = document.getElementById('userProfileContainer'); // Assicurati che questi siano accessibili
    const userDisplayName = document.getElementById('userDisplayName');
    const headerUserAvatar = document.getElementById('headerUserAvatar');

    if (!user || !userProfileContainer) {
        console.warn("loadUserProfile chiamato ma utente o userProfileContainer non disponibile");
        return;

    }



    if (userDisplayName) userDisplayName.textContent = `Loading...`;
    if (headerUserAvatar) {
        headerUserAvatar.style.display = 'inline-block';
        headerUserAvatar.src = ''; // Pulisci src precedente
        headerUserAvatar.alt = 'Loading avatar';
        headerUserAvatar.style.backgroundColor = '#eee'; // Placeholder
    }

    // Dichiarare nicknameToShow qui, fuori dal try, con un valore di default
    let nicknameToShow = user.email ? user.email.split('@')[0] : 'Utente'; 

    const userProfileRef = doc(db, "userProfiles", user.uid);
    try {
        const docSnap = await getDoc(userProfileRef);

        if (docSnap.exists() && docSnap.data().nickname) {
            nicknameToShow = docSnap.data().nickname; // Aggiorna se il nickname esiste nel profilo
        }
        
        if (userDisplayName) userDisplayName.textContent = `Ciao, ${nicknameToShow}`;

        if (headerUserAvatar) {
            // Ora nicknameToShow è sicuramente definito perché dichiarato nello scope della funzione
            const seedForAvatar = user.uid; // Usa sempre user.uid come seed primario
            
            // Assicurati che generateBlockieAvatar sia accessibile qui
            // (dovrebbe esserlo se è esportata da main.js o definita globalmente come window.generateBlockieAvatar)
            headerUserAvatar.src = generateBlockieAvatar(seedForAvatar, 32, { size: 8 }); 
            headerUserAvatar.alt = `${nicknameToShow}'s Avatar`;
            headerUserAvatar.style.backgroundColor = 'transparent'; 
            
            headerUserAvatar.onload = () => {
                // console.log("Avatar header Blockie caricato.");
            }; 
            headerUserAvatar.onerror = () => { 
                headerUserAvatar.style.display = 'none'; 
                console.warn("Fallimento caricamento avatar Blockie nell'header."); 
                // Potresti impostare un SVG di fallback qui se l'errore è nella generazione del dataURL
                headerUserAvatar.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' fill='%23ddd'/%3E%3Ctext x='5' y='7.5' font-size='5' text-anchor='middle' fill='%23777'%3E?%3C/text%3E%3C/svg%3E";
            };
        }
    } catch (error) {
        console.error("main.js - Error loading user profile:", error);
        // Usa il nicknameToShow di fallback definito all'inizio della funzione
        if (userDisplayName) userDisplayName.textContent = `Ciao, ${nicknameToShow}`; // nicknameToShow qui sarà il default basato sull'email
        if (headerUserAvatar) {
             headerUserAvatar.src = generateBlockieAvatar(nicknameToShow || user.uid, 32, {size:8}); // Prova a generare anche in caso di errore parziale
             headerUserAvatar.alt = `${nicknameToShow}'s Fallback Avatar`;
        }
    }
}

    function updateAuthUI(user) {
        if (user) {
            if (authContainer) authContainer.style.display = 'none';
            if (userProfileContainer) userProfileContainer.style.display = 'flex';
            if (logoutButton) logoutButton.style.display = 'inline-block';
            if (profileNavLink) profileNavLink.style.display = 'list-item';
            if (loginModal?.style.display === 'block') loginModal.style.display = 'none';
            if (signupModal?.style.display === 'block') signupModal.style.display = 'none';
            if (commentNameSection) commentNameSection.style.display = 'none';
            if (commentNameInput) commentNameInput.required = false;
            loadUserProfile(user); 
        } else { 
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
        updateAuthUI(user);

    });
  });
  
  // --- Interactive Skills Section ---
  console.log('Initializing interactive skills section...'); 

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

