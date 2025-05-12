// js/main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { createIcon } from './blockies.mjs'; // Assicurati che il percorso sia corretto

// --- Firebase Config ---
// Assicurati che questi valori siano corretti per il tuo progetto
const firebaseConfig = {
    apiKey: "AIzaSyBrXQ4qwB9JhZF4kSIPyvxQYw1X4PGXpFk", // Potrebbe essere meglio usare variabili d'ambiente
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

// Esporta db e auth se ti servono in altri moduli (raro per main.js)
export { db, auth };

// --- FUNZIONE HELPER PER AVATAR BLOCKIES ---
// (Può stare fuori da DOMContentLoaded se non accede direttamente al DOM all'avvio)
export function generateBlockieAvatar(seed, imgSize = 40, blockieOptions = {}) {
    // Verifica se createIcon è stata importata correttamente
    if (typeof createIcon !== 'function') {
        console.error("Funzione createIcon da Blockies non definita o non importata!");
        // Fornisce un SVG di fallback semplice
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='" + imgSize + "' height='" + imgSize + "' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' fill='%23ddd'/%3E%3Ctext x='5' y='7.5' font-size='5' text-anchor='middle' fill='%23777'%3E?%3C/text%3E%3C/svg%3E";
    }
    try {
        const defaultOptions = {
            seed: String(seed).toLowerCase(), // Il seed deve essere una stringa
            size: 8, // Numero di blocchi (default libreria)
            scale: 5, // Scala iniziale (verrà ricalcolata)
            // color: '#hexcolor', // Colore principale opzionale
            // bgcolor: '#hexcolor', // Colore di sfondo opzionale
            // spotcolor: '#hexcolor' // Colore "macchia" opzionale
        };
        const options = { ...defaultOptions, ...blockieOptions };

        // Calcola la scala per adattarsi alla dimensione richiesta dell'immagine
        options.scale = Math.max(1, Math.round(imgSize / options.size));

        const canvasElement = createIcon(options);
        if (canvasElement && typeof canvasElement.toDataURL === 'function') {
            return canvasElement.toDataURL();
        } else {
            throw new Error("createIcon non ha restituito un canvas valido.");
        }
    } catch (e) {
        console.error("Errore durante la generazione dell'avatar Blockie:", e, "Seed:", seed);
        // Ritorna l'SVG di fallback in caso di errore
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='" + imgSize + "' height='" + imgSize + "' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' fill='%23ddd'/%3E%3Ctext x='5' y='7.5' font-size='5' text-anchor='middle' fill='%23777'%3E?%3C/text%3E%3C/svg%3E";
    }
}

// --- Codice Eseguito Dopo il Caricamento del DOM ---
document.addEventListener('DOMContentLoaded', function() {

    // --- Selezione Elementi DOM ---
    // (È buona norma selezionarli tutti qui, all'inizio)
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
    const showLoginBtn = document.getElementById('showLoginBtn');
    const showSignupBtn = document.getElementById('showSignupBtn');
    const closeLoginBtn = loginModal ? loginModal.querySelector('.closeLoginBtn') : null; // Cerca dentro al modal
    const closeSignupBtn = signupModal ? signupModal.querySelector('.closeSignupBtn') : null; // Cerca dentro al modal
    const commentNameSection = document.getElementById('commentNameSection');
    const commentNameInput = document.getElementById('commentName');
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const skillBadges = document.querySelectorAll('#skills ul li[data-skill-name]');
    const skillDetailsContainer = document.getElementById('skillDetails');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const bodyElement = document.body;

    // --- Funzioni Helper e Setup UI ---

    /** Setup Smooth Scrolling per i link interni */
    function setupSmoothScrolling() {
        const navLinks = document.querySelectorAll('header nav a[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                try {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                        console.warn(`Elemento target per smooth scroll non trovato: ${targetId}`);
                    }
                } catch (error) {
                    console.error(`Errore nel selettore per smooth scroll: ${targetId}`, error);
                }
            });
        });
    }

    /** Setup Bottone Scroll-to-Top */
    function setupScrollToTopButton() {
        if (!scrollToTopBtn) return; // Esci se il bottone non esiste
        const scrollThreshold = 200; // Mostra dopo 200px di scroll

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

    /** Setup Sezione Skills Interattiva */
    function setupInteractiveSkills() {
        if (!skillDetailsContainer || skillBadges.length === 0) {
            // console.log('Elementi per skills interattive non trovati, skip setup.');
            return;
        }
        console.log('Inizializzazione sezione skills interattiva...');

        let currentlyActiveSkillBadge = null;

        skillBadges.forEach(badge => {
            badge.addEventListener('click', function() {
                const skillName = this.dataset.skillName || "Skill"; // Fallback nome
                const skillDescription = this.dataset.description || "Nessun dettaglio disponibile."; // Fallback descrizione

                // Rimuovi classe attiva dal precedente
                if (currentlyActiveSkillBadge) {
                    currentlyActiveSkillBadge.classList.remove('active-skill');
                }

                // Aggiungi classe attiva a quello cliccato
                this.classList.add('active-skill');
                currentlyActiveSkillBadge = this;

                // Aggiorna il contenitore dei dettagli
                skillDetailsContainer.innerHTML = `<h3>${escapeHTML(skillName)}</h3><p>${escapeHTML(skillDescription)}</p>`;
            });
        });
    }

    /** Funzione Semplice per Escaping HTML (per sicurezza) */
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }


    /** Setup Theme Switcher (Light/Dark Mode) */
    function setupThemeSwitcher() {
        if (!themeToggleBtn || !bodyElement) return;

        const moonIcon = '🌙';
        const sunIcon = '☀️';

        function applyTheme(theme) {
            if (theme === 'dark') {
                bodyElement.classList.add('dark-mode');
                themeToggleBtn.textContent = sunIcon; // Mostra sole in dark mode
                localStorage.setItem('theme', 'dark');
            } else { // Default to light
                bodyElement.classList.remove('dark-mode');
                themeToggleBtn.textContent = moonIcon; // Mostra luna in light mode
                localStorage.setItem('theme', 'light');
            }
        }

        function initializeTheme() {
            const savedTheme = localStorage.getItem('theme');
            // Rileva preferenza sistema SOLO se non c'è un tema salvato
            const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

            if (savedTheme) {
                applyTheme(savedTheme);
            } else if (prefersDarkScheme) {
                applyTheme('dark');
            } else {
                applyTheme('light'); // Default iniziale
            }
        }

        themeToggleBtn.addEventListener('click', () => {
            // Cambia tema: se è dark passa a light, altrimenti passa a dark
            const isDarkMode = bodyElement.classList.contains('dark-mode');
            applyTheme(isDarkMode ? 'light' : 'dark');
        });

        initializeTheme(); // Applica tema al caricamento
    }

    /** Setup Controlli Modali Login/Signup */
    function setupModalControls() {
        // Funzione helper per aprire un modal
        const openModal = (modal) => {
            if (modal) modal.style.display = 'block';
        };

        // Funzione helper per chiudere un modal
        const closeModal = (modal) => {
            if (modal) modal.style.display = 'none';
        };

        // Listener per aprire i modal
        if (showLoginBtn && loginModal) {
            showLoginBtn.addEventListener('click', () => openModal(loginModal));
        } else if (!showLoginBtn) {
            // console.warn("Bottone 'showLoginBtn' non trovato.");
        } else if (!loginModal) {
            // console.warn("Modal 'loginModal' non trovato.");
        }

        if (showSignupBtn && signupModal) {
            showSignupBtn.addEventListener('click', () => openModal(signupModal));
        } else if (!showSignupBtn) {
            // console.warn("Bottone 'showSignupBtn' non trovato.");
        } else if (!signupModal) {
            // console.warn("Modal 'signupModal' non trovato.");
        }

        // Listener per chiudere i modal (bottoni X)
        if (closeLoginBtn) {
            closeLoginBtn.addEventListener('click', () => closeModal(loginModal));
        }
        if (closeSignupBtn) {
            closeSignupBtn.addEventListener('click', () => closeModal(signupModal));
        }

        // Listener per chiudere i modal cliccando fuori dal contenuto
        window.addEventListener('click', (event) => {
            if (event.target === loginModal) {
                closeModal(loginModal);
            }
            if (event.target === signupModal) {
                closeModal(signupModal);
            }
        });
    }

    /** Carica e Visualizza Profilo Utente (Nickname e Avatar) */
    async function loadUserProfile(user) {
        // Assicurati che gli elementi UI esistano prima di procedere
        if (!userProfileContainer || !userDisplayName || !headerUserAvatar) {
            console.warn("loadUserProfile: Elementi UI del profilo mancanti.");
            return;
        }
        if (!user) {
             console.warn("loadUserProfile: chiamato senza un utente valido.");
             return;
        }

        // Stato iniziale mentre carica
        userDisplayName.textContent = `Caricamento...`;
        headerUserAvatar.style.display = 'inline-block'; // Mostra l'avatar
        headerUserAvatar.src = ''; // Pulisci src precedente
        headerUserAvatar.alt = 'Avatar in caricamento';
        headerUserAvatar.style.backgroundColor = '#eee'; // Colore placeholder

        // Nickname di fallback dall'email
        let nicknameToShow = user.email ? user.email.split('@')[0] : 'Utente';
        const seedForAvatar = user.uid; // Usa sempre UID per consistenza avatar

        try {
            const userProfileRef = doc(db, "userProfiles", user.uid);
            const docSnap = await getDoc(userProfileRef);

            if (docSnap.exists() && docSnap.data().nickname) {
                nicknameToShow = docSnap.data().nickname; // Usa nickname da Firestore se esiste
                // console.log(`Nickname caricato da Firestore: ${nicknameToShow}`);
            } else {
                // console.log("Nessun profilo Firestore trovato o nickname mancante, usando fallback.");
                // Se il profilo non esiste, potresti volerlo creare qui
                // await setDoc(userProfileRef, { email: user.email, nickname: nicknameToShow, createdAt: serverTimestamp() });
            }

            // Aggiorna il nome visualizzato
            userDisplayName.textContent = `Ciao, ${escapeHTML(nicknameToShow)}`;

            // Genera e imposta l'avatar Blockie
            const avatarDataUrl = generateBlockieAvatar(seedForAvatar, 32, { size: 8 }); // Dimensione avatar 32x32
            headerUserAvatar.src = avatarDataUrl;
            headerUserAvatar.alt = `Avatar di ${escapeHTML(nicknameToShow)}`;
            headerUserAvatar.style.backgroundColor = 'transparent'; // Rimuovi sfondo placeholder

            // Gestione caricamento/errore immagine (anche se è data URL, buona pratica)
            headerUserAvatar.onload = () => {
                // console.log("Avatar header Blockie caricato.");
            };
            headerUserAvatar.onerror = () => {
                console.warn("Fallimento caricamento avatar Blockie nell'header.");
                // Non dovrebbe succedere con data URL, ma per sicurezza
                headerUserAvatar.style.display = 'none'; // Nascondi se rotto
            };

        } catch (error) {
            console.error("Errore durante il caricamento del profilo utente da Firestore:", error);
            // Mostra comunque il fallback nickname in caso di errore DB
            userDisplayName.textContent = `Ciao, ${escapeHTML(nicknameToShow)}`;
            // Prova a generare l'avatar anche in caso di errore DB (usa UID o nickname)
            try {
                 const fallbackAvatar = generateBlockieAvatar(seedForAvatar, 32, { size: 8 });
                 headerUserAvatar.src = fallbackAvatar;
                 headerUserAvatar.alt = `Avatar di fallback per ${escapeHTML(nicknameToShow)}`;
                 headerUserAvatar.style.backgroundColor = 'transparent';
            } catch (avatarError) {
                 console.error("Errore anche nella generazione avatar di fallback", avatarError);
                 headerUserAvatar.style.display = 'none'; // Nascondi se tutto fallisce
            }
        }
    }

    /** Aggiorna l'Interfaccia Utente in base allo Stato di Autenticazione */
    function updateAuthUI(user) {
        if (user) {
            // --- Utente Loggato ---
            if (authContainer) authContainer.style.display = 'none'; // Nasconde bottoni login/signup
            if (userProfileContainer) userProfileContainer.style.display = 'flex'; // Mostra area profilo
            if (logoutButton) logoutButton.style.display = 'inline-block'; // Mostra bottone logout
            if (profileNavLink) profileNavLink.style.display = 'list-item'; // Mostra link profilo nel nav

            // Chiude i modal se aperti
            if (loginModal && loginModal.style.display === 'block') loginModal.style.display = 'none';
            if (signupModal && signupModal.style.display === 'block') signupModal.style.display = 'none';

            // Gestione commenti (utente loggato non ha bisogno di inserire nome)
            if (commentNameSection) commentNameSection.style.display = 'none';
            if (commentNameInput) commentNameInput.required = false;

            loadUserProfile(user); // Carica dettagli profilo

        } else {
            // --- Utente Non Loggato ---
            if (authContainer) authContainer.style.display = 'flex'; // Mostra bottoni login/signup
            if (userProfileContainer) userProfileContainer.style.display = 'none'; // Nasconde area profilo
            if (logoutButton) logoutButton.style.display = 'none'; // Nasconde bottone logout
            if (profileNavLink) profileNavLink.style.display = 'none'; // Nasconde link profilo nel nav

            // Pulisce info utente precedente
            if (userDisplayName) userDisplayName.textContent = '';
            if (headerUserAvatar) headerUserAvatar.style.display = 'none';

            // Gestione commenti (utente non loggato deve inserire nome)
            if (commentNameSection) commentNameSection.style.display = 'block';
            if (commentNameInput) commentNameInput.required = true;
        }
    }

    /** Traduce Codici Errore Firebase Auth in Messaggi Utente */
    function traduireErroreFirebase(codiceErrore) {
        // Mappa semplice (puoi espanderla)
        const errors = {
            "auth/invalid-email": "L'indirizzo email non è valido.",
            "auth/user-disabled": "Questo account utente è stato disabilitato.",
            "auth/user-not-found": "Nessun utente trovato con questa email.",
            "auth/wrong-password": "Password errata.",
            "auth/email-already-in-use": "L'indirizzo email è già utilizzato da un altro account.",
            "auth/operation-not-allowed": "Operazione non permessa (controlla config Firebase Auth).",
            "auth/weak-password": "La password è troppo debole (minimo 6 caratteri)."
            // Aggiungi altri codici errore se necessario
        };
        return errors[codiceErrore] || `Si è verificato un errore (${codiceErrore}). Riprova.`;
    }

    // --- Inizializzazione e Listener Principali ---

    // Setup UI iniziale
    setupSmoothScrolling();
    setupScrollToTopButton();
    setupInteractiveSkills();
    setupThemeSwitcher();
    setupModalControls();

    // Listener per lo stato di autenticazione Firebase
    onAuthStateChanged(auth, (user) => {
        console.log("Stato autenticazione cambiato:", user ? `Utente ${user.uid}` : "Nessun utente");
        updateAuthUI(user); // Aggiorna UI in base allo stato
    });

    // Listener per il form di Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impedisce ricaricamento pagina
            const email = loginForm.loginEmail.value;
            const password = loginForm.loginPassword.value;
            // Qui potresti aggiungere validazione semplice dei campi
            try {
                console.log(`Tentativo login per: ${email}`);
                await signInWithEmailAndPassword(auth, email, password);
                // Il successo viene gestito da onAuthStateChanged che chiama updateAuthUI
                loginForm.reset(); // Pulisce il form
                // closeModal(loginModal); // Chiude modal (già fatto da updateAuthUI?)
            } catch (error) {
                console.error("Errore Login Firebase:", error.code, error.message);
                alert("Errore Login: " + traduireErroreFirebase(error.code));
            }
        });
    } else {
        console.warn("Elemento Form di Login (loginForm) non trovato.");
    }

    // Listener per il form di Signup
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = signupForm.signupEmail.value;
            const password = signupForm.signupPassword.value;
            // Qui potresti aggiungere validazione password (es. conferma password)

            try {
                console.log(`Tentativo registrazione per: ${email}`);
                // 1. Crea utente in Firebase Auth
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                console.log("Registrazione Auth OK:", user.uid);

                // 2. Crea documento profilo base in Firestore
                const userProfileRef = doc(db, "userProfiles", user.uid);
                const userProfileData = {
                    email: user.email,
                    nickname: user.email.split('@')[0], // Nickname iniziale
                    createdAt: serverTimestamp() // Orario server creazione
                };

                try {
                    await setDoc(userProfileRef, userProfileData);
                    console.log("Profilo Firestore base creato per:", user.uid);
                } catch (firestoreError) {
                    // Errore grave: utente creato ma profilo no. Loggalo bene.
                    console.error(`FALLIMENTO CREAZIONE PROFILO Firestore per ${user.uid}:`, firestoreError);
                    // Avvisa l'utente che qualcosa è andato storto ma è registrato
                    alert("Registrazione completata, ma c'è stato un problema nella creazione del profilo utente. Contatta l'assistenza se necessario.");
                }

                signupForm.reset();
                // Non serve alert di successo qui, onAuthStateChanged aggiornerà l'UI e chiuderà il modal
                // alert("Registrazione completata con successo!");

            } catch (authError) {
                console.error("Errore Registrazione Firebase Auth:", authError.code, authError.message);
                alert("Errore Registrazione: " + traduireErroreFirebase(authError.code));
            }
        });
    } else {
        console.warn("Elemento Form di Signup (signupForm) non trovato.");
    }

    // Listener per il bottone di Logout
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await signOut(auth);
                console.log("Logout eseguito.");
                // L'UI viene aggiornata da onAuthStateChanged
                // Potresti reindirizzare alla homepage o fare altro qui se necessario
                // window.location.href = '/';
            } catch (error) {
                console.error("Errore Logout:", error);
                alert("Errore durante il logout: " + error.message);
            }
        });
    } else {
        // Non è un errore grave se non c'è, viene mostrato solo se loggati
        // console.log("Bottone Logout (logoutButton) non trovato inizialmente (normale se non loggati).");
    }

});

