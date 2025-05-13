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


    export function getFlagEmoji(countryCode) {
        if (!countryCode || typeof countryCode !== 'string' || countryCode.length !== 2) {
            return ''; // Restituisce stringa vuota per input non validi
        }
        // Converte le lettere del codice paese (es. "IT") nei corrispondenti
        // caratteri Regional Indicator Symbol dell'Unicode per formare l'emoji della bandiera.
        // A = 127462 (0x1F1E6) ... Z = 127487 (0x1F1FF)
        // L'offset da 'A' a Regional Indicator A è 127462 - 65 = 127397
        try {
            const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
            return String.fromCodePoint(...codePoints);
        } catch (e) {
            console.warn("Impossibile generare emoji per il codice paese:", countryCode, e);
            return '🏳️'; // Bandiera bianca di fallback o stringa vuota
        }
    }

export { db, auth};


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


 // QUESTA È L'UNICA DEFINIZIONE DI loadUserProfile CHE DEVE RIMANERE
async function loadUserProfile(user) {
    const userProfileContainer = document.getElementById('userProfileContainer');
    const userDisplayName = document.getElementById('userDisplayName');
    const headerUserAvatar = document.getElementById('headerUserAvatar');

    // ---> AGGIUNGI QUESTO CONTROLLO <---
    if (!user) {
        // Non fare nulla se l'utente non è fornito
        // console.warn("loadUserProfile chiamato senza utente.");
        return;
    }
    // ---> FINE CONTROLLO <---

    // Se userProfileContainer non esiste sulla pagina corrente, non procedere con l'aggiornamento dell'header
    if (!userProfileContainer && !userDisplayName && !headerUserAvatar) {
        // console.log("loadUserProfile: Elementi UI dell'header non presenti in questa pagina.");
        return;
    }

    if (userDisplayName) userDisplayName.textContent = `Loading...`;
    if (headerUserAvatar) {
        headerUserAvatar.style.display = 'inline-block';
        headerUserAvatar.src = '';
        headerUserAvatar.alt = 'Loading avatar';
        headerUserAvatar.style.backgroundColor = '#eee';
    }


            // Aggiorna il nome visualizzato
            userDisplayName.textContent = `Ciao, ${escapeHTML(nicknameToShow)}`;


    const userProfileRef = doc(db, "userProfiles", user.uid); 
    try {
        const docSnap = await getDoc(userProfileRef);


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


    // Authentication State Change Listener
    onAuthStateChanged(auth, (user) => {
        updateAuthUI(user);

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

                // Recupera i nuovi valori dal form
                const nickname = signupForm.signupNickname.value.trim();
                const selectedNationalityCode = signupForm.signupNationality.value; // Prende il 'value' dall'opzione selezionata

                const userProfileData = {
        email: user.email,
        nickname: nickname,
        createdAt: serverTimestamp(),
    };

            if (selectedNationalityCode && selectedNationalityCode !== "OTHER" && selectedNationalityCode !== "") {
                userProfileData.nationalityCode = selectedNationalityCode;
            } else if (selectedNationalityCode === "OTHER") {
                userProfileData.nationalityCode = "OTHER";
            }

            // ---> !!! RIGA MANCANTE DA AGGIUNGERE QUI !!! <---
            const userProfileRef = doc(db, "userProfiles", user.uid); 
            // Questa riga crea il riferimento al documento Firestore per il nuovo utente.

            try {
                // Ora userProfileRef sarà definita e setDoc potrà usarla.
                // L'errore "userProfileRef is not defined" avviene qui (riga ~364 nel tuo file):
                await setDoc(userProfileRef, userProfileData); 
                console.log("main.js - Profilo completo creato con successo per:", user.uid, " Dati:", userProfileData);
            } catch (firestoreError) {
                console.error(`main.js - CREAZIONE PROFILO FIRESTORE FALLITA per ${user.uid}:`, firestoreError);
                alert("ATTENZIONE: Registrazione parzialmente riuscita. Impossibile creare il record del profilo utente con tutti i dettagli.");
            }
                signupForm.reset();
                alert("Registrazione avvenuta con successo!"); // User is automatically logged in

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


}); // End DOMContentLoaded

