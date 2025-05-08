// js/main.js

// Importa le funzioni necessarie da Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
// ++ AGGIUNTO serverTimestamp ALL'IMPORT ++
import {
    getFirestore, doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// --- Configurazione Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyBrXQ4qwB9JhZF4kSIPyvxQYw1X4PGXpFk",
    authDomain: "asyncdonkey.firebaseapp.com",
    projectId: "asyncdonkey",
    storageBucket: "asyncdonkey.appspot.com",
    messagingSenderId: "939854468396",
    appId: "1:939854468396:web:9646d4f51737add7704889",
    measurementId: "G-EQDBKQM3YE"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Esporta auth e db
export { db, auth };

// DEBUG: Verifica istanze esportate
console.log("main.js: db instance created:", db ? 'OK' : 'FAIL');
console.log("main.js: auth instance created:", auth ? 'OK' : 'FAIL');


document.addEventListener('DOMContentLoaded', function() {

    // --- Smooth Scrolling, ScrollToTop, Skills, Theme Switcher (come prima) ---
    const navLinks = document.querySelectorAll('header nav a[href^="#"]');
    navLinks.forEach(link => { /* ... listener ... */ });
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (scrollToTopBtn) { /* ... listener ... */ }
    const skillBadges = document.querySelectorAll('#skills ul li[data-skill-name]');
    const skillDetailsContainer = document.getElementById('skillDetails');
    let currentlyActiveSkillBadge = null;
    if (!skillDetailsContainer) { console.warn('#skillDetails non trovato.'); }
    if (skillBadges.length === 0) { console.warn('Nessun skill badge trovato.'); }
    else { skillBadges.forEach(badge => { /* ... listener ... */ }); }
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const bodyElement = document.body;
    const moonIcon = '🌙'; const sunIcon = '☀️';
    function applyTheme(theme) { /* ... */ }
    function initializeTheme() { /* ... */ }
    if (themeToggleBtn) { themeToggleBtn.addEventListener('click', () => { /* ... */ }); }
    initializeTheme();
    // --- Fine sezioni esistenti ---


    // --- Firebase Auth UI and Logic ---
    const authContainer = document.getElementById('authContainer');
    const userProfileContainer = document.getElementById('userProfileContainer');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const logoutButton = document.getElementById('logoutButton');
    const userDisplayName = document.getElementById('userDisplayName');
    const profileNavLink = document.getElementById('profileNav');
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    const showLoginBtn = document.getElementById('showLoginBtn');
    const showSignupBtn = document.getElementById('showSignupBtn');
    const closeLoginBtn = document.querySelector('.closeLoginBtn');
    const closeSignupBtn = document.querySelector('.closeSignupBtn');
    const commentNameSection = document.getElementById('commentNameSection');
    const commentNameInput = document.getElementById('commentName');


    // Gestione Modali (come prima)
    if (showLoginBtn && loginModal) { showLoginBtn.addEventListener('click', () => loginModal.style.display = 'block'); }
    if (showSignupBtn && signupModal) { showSignupBtn.addEventListener('click', () => signupModal.style.display = 'block'); }
    if (closeLoginBtn && loginModal) { closeLoginBtn.addEventListener('click', () => loginModal.style.display = 'none'); }
    if (closeSignupBtn && signupModal) { closeSignupBtn.addEventListener('click', () => signupModal.style.display = 'none'); }
    window.addEventListener('click', (event) => { /* ... chiusura modale su click esterno ... */ });

    // Load User Profile (come prima, usa getDoc importato)
    async function loadUserProfile(user) {
        if (!user) return;
        console.log("main.js - loadUserProfile per utente:", user.uid);
        const userProfileRef = doc(db, "userProfiles", user.uid);
        try {
            const docSnap = await getDoc(userProfileRef); // Usa getDoc importato
            if (docSnap.exists()) {
                const userProfile = docSnap.data();
                console.log("main.js - Profilo trovato:", userProfile);
                if (userDisplayName) userDisplayName.textContent = `Ciao, ${userProfile.nickname || user.email.split('@')[0]}`;
            } else {
                console.log("main.js - Nessun profilo Firestore trovato per l'utente, uso email.");
                if (userDisplayName) userDisplayName.textContent = `Ciao, ${user.email.split('@')[0]}`;
            }
        } catch (error) {
            console.error("main.js - Errore caricamento profilo utente (Regole Firestore?):", error);
            if (userDisplayName) userDisplayName.textContent = `Ciao, ${user.email.split('@')[0]}`; // Fallback
        }
    }

    // Update Auth UI (con gestione 'required', come prima)
    function updateAuthUI(user) {
        if (user) { // Loggato
            if (authContainer) authContainer.style.display = 'none';
            if (userProfileContainer) userProfileContainer.style.display = 'block';
            if (logoutButton) logoutButton.style.display = 'inline-block';
            if (profileNavLink) profileNavLink.style.display = 'list-item';
            if (loginModal && loginModal.style.display === 'block') loginModal.style.display = 'none';
            if (signupModal && signupModal.style.display === 'block') signupModal.style.display = 'none';
            if (commentNameSection) commentNameSection.style.display = 'none';
            if (commentNameInput) commentNameInput.required = false;
            loadUserProfile(user);
        } else { // Non Loggato
            if (authContainer) authContainer.style.display = 'flex';
            if (userProfileContainer) userProfileContainer.style.display = 'none';
            if (logoutButton) logoutButton.style.display = 'none';
            if (profileNavLink) profileNavLink.style.display = 'none';
            if (userDisplayName) userDisplayName.textContent = '';
            if (commentNameSection) commentNameSection.style.display = 'block';
            if (commentNameInput) commentNameInput.required = true;
        }
    }

    // Listener stato autenticazione (come prima)
    onAuthStateChanged(auth, (user) => {
        console.log("main.js - onAuthStateChanged, utente:", user ? user.uid : 'Nessuno');
        updateAuthUI(user);
    });

    // Gestione Login (come prima)
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); /* ... */
            try {
                const userCredential = await signInWithEmailAndPassword(auth, loginForm.loginEmail.value, loginForm.loginPassword.value);
                /* ... */ loginForm.reset();
            } catch (error) { /* ... */ alert("Errore login: " + traduireErroreFirebase(error.code));}
        });
    }

    // ++ Gestione Signup CORRETTA con Try/Catch per setDoc ++
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = signupForm.signupEmail.value;
            const password = signupForm.signupPassword.value;
            try {
                // 1. Crea l'utente Auth
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                console.log("main.js - Registrazione Auth OK:", user.uid);

                // 2. Tenta di creare il documento profilo in Firestore
                const userProfileRef = doc(db, "userProfiles", user.uid); // Usa 'doc' importato
                const userProfileData = {
                    email: user.email,
                    nickname: user.email.split('@')[0], // Nickname di default
                    createdAt: serverTimestamp() // Usa serverTimestamp importato
                };
                console.log("main.js - Tentativo creazione profilo con dati:", userProfileData);

                // ++ Aggiunto Try/Catch specifico per setDoc ++
                try {
                    await setDoc(userProfileRef, userProfileData); // Usa 'setDoc' importato
                    console.log("main.js - Profilo base creato con successo per:", user.uid);
                } catch (firestoreError) {
                    console.error(`main.js - ERRORE creazione profilo Firestore per ${user.uid}:`, firestoreError);
                    // Potresti voler loggare l'errore o informare l'utente
                    alert("ATTENZIONE: Errore durante la finalizzazione della registrazione (profilo db). L'account è stato creato ma il profilo potrebbe essere incompleto. Contatta l'assistenza se il problema persiste.");
                }
                // -- Fine Try/Catch per setDoc --

                signupForm.reset();
                // Messaggio modificato perché l'utente è già loggato dopo la registrazione
                alert("Registrazione completata con successo!");

            } catch (authError) { // Errore durante createUserWithEmailAndPassword
                console.error("main.js - Errore registrazione Auth:", authError.code, authError.message);
                alert("Errore di registrazione: " + traduireErroreFirebase(authError.code));
            }
        });
    }


    // Gestione Logout (come prima)
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
             try { await signOut(auth); /* ... */ } catch (error) { /* ... */ }
        });
    }

    // Funzione traduci errore (come prima)
    function traduireErroreFirebase(codiceErrore) {
        switch (codiceErrore) {
            case "auth/invalid-email": return "L'indirizzo email non è valido.";
            // ... altri casi ...
            default: return `Si è verificato un errore (${codiceErrore}).`;
        }
    }

}); // Fine DOMContentLoaded
