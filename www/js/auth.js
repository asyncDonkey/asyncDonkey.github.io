import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    updateDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db, auth } from './firebase-config.js';
import { showToast } from './toastNotifications.js';

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

/* --- INIZIO COSTANTI E VARIABILI PER LA MODALE DI LOGIN/REGISTRAZIONE --- */
const loginModal = document.getElementById('loginModal');
const closeLoginModalBtn = document.getElementById('closeLoginModal');

const showLoginTabBtn = document.getElementById('showLoginTab');
const showRegisterTabBtn = document.getElementById('showRegisterTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// Campi del form di Login
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');

// Campi del form di Registrazione
const registerDisplayNameInput = document.getElementById('registerDisplayName');
const registerEmailInput = document.getElementById('registerEmail');
const registerPasswordInput = document.getElementById('registerPassword');
const registerConfirmPasswordInput = document.getElementById('registerConfirmPassword');
const privacyConsentCheckbox = document.getElementById('privacyConsent');
const optInTestsCheckbox = document.getElementById('optInTests');
const optInPhoneNumberInput = document.getElementById('optInPhoneNumber');
const whoAmISelect = document.getElementById('whoAmISelect');
const registerBtn = document.getElementById('registerBtn');

/* --- FINE COSTANTI E VARIABILI --- */

/**
 * Funzione per attivare il tab corretto (Login o Registrazione).
 * Spostata fuori da DOMContentLoaded per essere accessibile da showAuthModal.
 * @param {string} tabName 'login' o 'register'
 */
function activateTab(tabName) {
    if (tabName === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        showLoginTabBtn.classList.add('active');
        showRegisterTabBtn.classList.remove('active');
        if (loginModal) {
            // Assicurati che loginModal esista prima di provare a manipolarlo
            const h2Element = loginModal.querySelector('h2');
            if (h2Element) h2Element.innerHTML = '<i class="ph ph-terminal"></i> Accedi al Sistema';
        }
    } else if (tabName === 'register') {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        showRegisterTabBtn.classList.add('active');
        showLoginTabBtn.classList.remove('active');
        if (loginModal) {
            // Assicurati che loginModal esista prima di provare a manipolarlo
            const h2Element = loginModal.querySelector('h2');
            if (h2Element) h2Element.innerHTML = '<i class="ph ph-terminal"></i> Crea Account';
        }
    }
}

/**
 * Mostra la modale di autenticazione e imposta il tab iniziale.
 * Esportata per essere chiamata da `main.js`.
 * @param {string} initialTab Il tab da mostrare inizialmente ('login' o 'register').
 */
export function showAuthModal(initialTab = 'login') {
    if (loginModal) {
        loginModal.style.display = 'flex';
        document.body.classList.add('modal-open');
        activateTab(initialTab);
    } else {
        console.error('Errore: la modale di login/registrazione (loginModal) non è stata trovata nel DOM.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Solo un log di conferma che gli elementi sono pronti
    console.log('[Auth.js DOMContentLoaded] Elementi della modale di autenticazione pronti.');

    // Inizializzazione della modale e dei listener, ma senza chiamare showAuthModal qui
    // showAuthModal verrà chiamata solo su click dell'icona in main.js

    // Event Listener per chiudere la modale
    if (closeLoginModalBtn) {
        closeLoginModalBtn.addEventListener('click', () => {
            loginModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        });
    }

    // Chiusura della modale cliccando fuori
    window.addEventListener('click', (event) => {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    });

    // Gestione dei tab Accedi/Registrati
    if (showLoginTabBtn) {
        showLoginTabBtn.addEventListener('click', () => activateTab('login'));
    }
    if (showRegisterTabBtn) {
        showRegisterTabBtn.addEventListener('click', () => activateTab('register'));
    }

    // Gestione visualizzazione campo telefono per Opt-in Test
    if (optInTestsCheckbox && optInPhoneNumberInput) {
        optInTestsCheckbox.addEventListener('change', () => {
            optInPhoneNumberInput.style.display = optInTestsCheckbox.checked ? 'block' : 'none';
            if (!optInTestsCheckbox.checked) {
                optInPhoneNumberInput.value = '';
            }
        });
    }

    // Event listener per il pulsante di Login
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = loginEmailInput.value;
            const password = loginPasswordInput.value;
            if (!email || !password) {
                showToast('Per favore, inserisci email e password.', 'error');
                return;
            }
            try {
                await signInWithEmailPassword(email, password);
                loginModal.style.display = 'none';
                document.body.classList.remove('modal-open');
            } catch (error) {
                // Gli errori sono già gestiti da signInWithEmailPassword
            }
        });
    }

    // Event listener per il pulsante di Registrazione
    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            const displayName = registerDisplayNameInput.value.trim();
            const email = registerEmailInput.value.trim();
            const password = registerPasswordInput.value;
            const confirmPassword = registerConfirmPasswordInput.value;
            const privacyConsent = privacyConsentCheckbox.checked;
            const optInForTests = optInTestsCheckbox.checked;
            const optInPhoneNumber = optInPhoneNumberInput.value.trim();
            const whoAmI = whoAmISelect.value;

            // Validazione Frontend
            if (!displayName || !email || !password || !confirmPassword) {
                showToast('Tutti i campi obbligatori devono essere compilati.', 'error');
                return;
            }

            if (password !== confirmPassword) {
                showToast('Le password non corrispondono.', 'error');
                return;
            }

            if (password.length < 6) {
                showToast('La password è troppo corta (minimo 6 caratteri).', 'error');
                return;
            }
            if (!/^[a-zA-Z0-9_]{3,15}$/.test(displayName)) {
                showToast(
                    'Nickname non valido. Min 3, max 15 caratteri. Solo lettere, numeri e underscore (_).',
                    'error'
                );
                return;
            }

            if (!privacyConsent) {
                showToast(
                    "Devi accettare l'Informativa sulla Privacy e i Termini e Condizioni per registrarti.",
                    'error'
                );
                return;
            }

            try {
                await registerWithEmailPassword(email, password, displayName, optInForTests, optInPhoneNumber, whoAmI);
                loginModal.style.display = 'none';
                document.body.classList.remove('modal-open');
            } catch (error) {
                // Gli errori sono già gestiti da registerWithEmailPassword
            }
        });
    }
}); // Fine DOMContentLoaded

/**
 * Registra un nuovo utente con email e password.
 * @param {string} email
 * @param {string} password
 * @param {string} displayName
 * @param {boolean} optInForTests
 * @param {string} optInPhoneNumber
 * @param {string} whoAmI
 */
export async function registerWithEmailPassword(email, password, displayName, optInForTests, optInPhoneNumber, whoAmI) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userRef = doc(db, 'appUsers', user.uid);
        await setDoc(userRef, {
            uid: user.uid,
            displayName: displayName,
            email: user.email,
            photoURL: user.photoURL || '',
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            gameStats: { totalScore: 0, gamesPlayed: 0, bossesDefeated: 0, highestScore: 0 },
            earnedBadges: [],
            nickname: displayName,
            nicknameLastUpdatedAt: serverTimestamp(),
            optInForTests: optInForTests,
            optInPhoneNumber: optInPhoneNumber,
            whoAmI: whoAmI,
        });

        showToast(`Account creato con successo per ${displayName}!`, 'success');
        return user;
    } catch (error) {
        console.error('Errore durante la registrazione:', error);
        let errorMessage = 'Errore durante la registrazione.';
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Questa email è già in uso.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Formato email non valido.';
                break;
            case 'auth/weak-password':
                errorMessage = 'La password è troppo debole (minimo 6 caratteri).';
                break;
            default:
                errorMessage = `Errore: ${error.message}`;
                break;
        }
        showToast(errorMessage, 'error');
        throw error;
    }
}

/**
 * Effettua il login di un utente con email e password.
 * @param {string} email
 * @param {string} password
 */
export async function signInWithEmailPassword(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userRef = doc(db, 'appUsers', user.uid);
        await updateDoc(userRef, { lastLoginAt: serverTimestamp() });

        showToast(`Bentornato, ${user.email}!`, 'success');

        // La chiusura della modale e la rimozione della classe `modal-open`
        // avvengono già nell'event listener del pulsante di login in auth.js.

        return user;
    } catch (error) {
        console.error('Errore durante il login:', error);
        let errorMessage = 'Email o password non valide.';
        switch (error.code) {
            case 'auth/invalid-credential':
                errorMessage = 'Email o password non valide.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Formato email non valido.';
                break;
            case 'auth/weak-password':
                errorMessage = 'La password è troppo debole (minimo 6 caratteri).';
                break;
            default:
                errorMessage = `Errore: ${error.message}`;
                break;
        }
        showToast(errorMessage, 'error');
        throw error;
    }
}
