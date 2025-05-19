// =============== js/register.js ===============
import { db, auth } from './main.js'; // Assicurati che il percorso sia corretto
import {
    createUserWithEmailAndPassword,
    // sendEmailVerification, // Commentalo se non lo usi attivamente in questo flusso
    signInWithEmailAndPassword, // Per la modale di login, se usata
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { showToast } from './toastNotifications.js'; // Assicurati che il percorso sia corretto

// --- RIFERIMENTI DOM ---
// Questi ID devono corrispondere esattamente a quelli nel tuo register.html
const registerForm = document.getElementById('registerForm');
const emailInput = document.getElementById('registerEmail');
const passwordInput = document.getElementById('registerPassword');
const confirmPasswordInput = document.getElementById('registerConfirmPassword');
const nicknameInput = document.getElementById('registerNickname');
const nationalitySelect = document.getElementById('registerNationality');

// Div per mostrare errori specifici dei campi
const emailErrorDiv = document.getElementById('emailError');
const passwordErrorDiv = document.getElementById('passwordError');
const confirmPasswordErrorDiv = document.getElementById('confirmPasswordError');
const nicknameErrorDiv = document.getElementById('nicknameError');
const nationalityErrorDiv = document.getElementById('nationalityError'); // NOTA: Questo ID non è presente in register.html caricato.
const generalErrorDiv = document.getElementById('generalError'); // Usato come fallback o per errori generali

const registrationSuccessMessageDiv = document.getElementById('registrationSuccessMessage');

// Riferimenti per la modale di Login (se presente e usata in register.html)
const loginRedirectLink = document.getElementById('loginRedirectLink');
const loginModal = document.getElementById('loginModal');
const loginFormModal = document.getElementById('loginFormModal');
const loginEmailModalInput = document.getElementById('loginEmailModal');
const loginPasswordModalInput = document.getElementById('loginPasswordModal');
const closeLoginModalBtn = document.getElementById('closeLoginModalBtn');
const loginModalErrorDiv = document.getElementById('loginModalError');

// --- FUNZIONI DI VALIDAZIONE E UTILITY ---

function showFieldError(errorDiv, message) {
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block'; // o 'inline', a seconda del tuo CSS
    } else {
        // Se il div di errore specifico non esiste, potresti voler loggare un warning
        // o mostrare l'errore in un div generico, se appropriato.
        console.warn(`Tentativo di mostrare errore su un div non trovato. Messaggio: ${message}`);
        if (generalErrorDiv) { // Fallback a generalErrorDiv se lo specifico non c'è
            generalErrorDiv.textContent = message;
            generalErrorDiv.style.display = 'block';
        }
    }
}

function clearFieldError(errorDiv) {
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
    }
}

function clearAllFieldErrors() {
    clearFieldError(emailErrorDiv);
    clearFieldError(passwordErrorDiv);
    clearFieldError(confirmPasswordErrorDiv);
    clearFieldError(nicknameErrorDiv);
    if (nationalityErrorDiv) clearFieldError(nationalityErrorDiv); // Cancella solo se il div esiste
    clearFieldError(generalErrorDiv);
    if (registrationSuccessMessageDiv) registrationSuccessMessageDiv.style.display = 'none';
}

// NOTA: La funzione `handleRegistration` di seguito ha la sua logica di validazione.
// La funzione `validateRegistrationForm()` fornita in precedenza potrebbe essere ridondante
// o usata per una validazione live mentre l'utente digita.
// Per chiarezza, mi concentro sulla validazione all'interno di `handleRegistration`.

// --- GESTIONE REGISTRAZIONE ---
const handleRegistration = async (event) => {
    event.preventDefault();
    clearAllFieldErrors(); // Pulisce errori precedenti
    console.log('Tentativo di registrazione...');

    // Ottieni i valori direttamente dagli ID corretti all'interno della funzione
    const emailElement = document.getElementById('registerEmail');
    const passwordElement = document.getElementById('registerPassword');
    const confirmPasswordElement = document.getElementById('registerConfirmPassword');
    const nicknameElement = document.getElementById('registerNickname');
    const nationalityElement = document.getElementById('registerNationality');

    // Verifica preliminare che gli elementi esistano (dovrebbero, se il DOM è caricato)
    if (!emailElement || !passwordElement || !confirmPasswordElement || !nicknameElement || !nationalityElement) {
        console.error("Errore critico: Impossibile trovare uno o più elementi del form nel DOM.");
        showToast("Errore interno durante il recupero dei campi del form.", "error");
        if (generalErrorDiv) showFieldError(generalErrorDiv, "Errore interno, riprova più tardi.");
        return;
    }

    const email = emailElement.value;
    const password = passwordElement.value;
    const confirmPassword = confirmPasswordElement.value;
    const nickname = nicknameElement.value;
    const nationality = nationalityElement.value; // Può essere "" se non selezionato

    // Validazioni Client-Side
    if (!email) {
        showFieldError(emailErrorDiv, "L'email è obbligatoria.");
        showToast("L'email è obbligatoria.", "warning"); return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        showFieldError(emailErrorDiv, "Inserisci un indirizzo email valido.");
        showToast("Inserisci un indirizzo email valido.", "warning"); return;
    }
    if (!nickname) {
        showFieldError(nicknameErrorDiv, "Il nickname è obbligatorio.");
        showToast("Il nickname è obbligatorio.", "warning"); return;
    }
    if (nickname.length < 3 || nickname.length > 25) {
        showFieldError(nicknameErrorDiv, "Il nickname deve avere tra 3 e 25 caratteri.");
        showToast("Il nickname deve avere tra 3 e 25 caratteri.", "warning"); return;
    }
    // Potresti aggiungere qui una regex per i caratteri validi del nickname se necessario
    if (!password) {
        showFieldError(passwordErrorDiv, "La password è obbligatoria.");
        showToast("La password è obbligatoria.", "warning"); return;
    }
    if (password.length < 6) { // Firebase richiede almeno 6 caratteri
        showFieldError(passwordErrorDiv, "La password deve contenere almeno 6 caratteri.");
        showToast("La password deve contenere almeno 6 caratteri.", "warning"); return;
    }
    if (password !== confirmPassword) {
        showFieldError(confirmPasswordErrorDiv, "Le password non coincidono.");
        showToast("Le password non coincidono.", "warning"); return;
    }
    // La validazione della nazionalità qui dipende se è un campo obbligatorio per la logica di business.
    // Le regole Firestore permettono null, quindi "" dal select è OK.

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('Utente creato con successo in Firebase Auth:', user.uid);
        showToast("Registrazione autenticazione avvenuta con successo!", "success");

        const userProfileData = {
            email: user.email,
            nickname: nickname,
            nationalityCode: nationality || null, // Se nationality è "", diventa null
            createdAt: serverTimestamp(),
            isAdmin: false,
            statusMessage: "Nuovo utente!", // Valore di default per il nuovo profilo
            externalLinks: [],
            earnedBadges: [],
            bio: "",
            hasPublishedArticles: false,
            hasDefeatedGlitchzilla: false
        };

        console.log('Dati del profilo da salvare:', userProfileData);
        await setDoc(doc(db, "userProfiles", user.uid), userProfileData);

        console.log('Profilo utente creato con successo in Firestore.');
        if (registrationSuccessMessageDiv) {
            registrationSuccessMessageDiv.textContent = 'Registrazione completata con successo! Sarai reindirizzato a breve.';
            registrationSuccessMessageDiv.style.display = 'block';
        }
        showToast("Profilo utente creato con successo! Reindirizzamento...", "success", 4000);
        
        // Disabilita il form per prevenire doppi click durante il reindirizzamento
        if (registerForm) {
            const submitButton = registerForm.querySelector('button[type="submit"]');
            if (submitButton) submitButton.disabled = true;
        }

        setTimeout(() => {
            window.location.href = '/profile.html'; // o la pagina desiderata post-registrazione
        }, 2000); // Un piccolo ritardo per mostrare il messaggio di successo

    } catch (error) {
        console.error('Errore durante la registrazione:', error);
        let errorMessage = "Errore imprevisto durante la registrazione. Riprova.";
        if (error.code) {
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = "L'indirizzo email è già in uso da un altro account.";
                    showFieldError(emailErrorDiv, errorMessage);
                    break;
                case 'auth/invalid-email':
                    errorMessage = "L'indirizzo email non è valido.";
                    showFieldError(emailErrorDiv, errorMessage);
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = "La registrazione tramite email e password non è abilitata. Contatta l'amministratore.";
                    if (generalErrorDiv) showFieldError(generalErrorDiv, errorMessage);
                    break;
                case 'auth/weak-password':
                    errorMessage = "La password è troppo debole. Scegli una password più robusta.";
                    showFieldError(passwordErrorDiv, errorMessage);
                    break;
                default:
                    errorMessage = `Errore di registrazione (${error.code}). Riprova o contatta l'assistenza.`;
                    if (generalErrorDiv) showFieldError(generalErrorDiv, errorMessage);
            }
        } else if (error.message && error.message.includes("Missing or insufficient permissions")) {
            errorMessage = "Errore di permessi durante la creazione del profilo. Verifica le regole Firestore e i dati inviati.";
            if (generalErrorDiv) showFieldError(generalErrorDiv, errorMessage);
        }
        showToast(errorMessage, "error", 7000);
    }
};

// --- GESTIONE MODALE LOGIN (Logica di supporto se presente nella pagina) ---
function translateFirebaseError(errorCode) {
    // ... (la tua implementazione di translateFirebaseError)
    switch (errorCode) {
        case 'auth/email-already-in-use': return "L'indirizzo email è già utilizzato.";
        case 'auth/invalid-email': return "L'indirizzo email non è valido.";
        case 'auth/user-not-found': return "Nessun utente trovato con questa email.";
        case 'auth/wrong-password': return "Password errata.";
        default: return `Errore di autenticazione (${errorCode}).`;
    }
}

if (loginRedirectLink && loginModal) {
    loginRedirectLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.style.display = 'block';
        if (loginModalErrorDiv) clearFieldError(loginModalErrorDiv);
    });
}

if (closeLoginModalBtn && loginModal) {
    closeLoginModalBtn.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });
}

if (loginModal) { // Chiudi cliccando fuori dalla modale
    window.addEventListener('click', (event) => {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });
}

if (loginFormModal) {
    loginFormModal.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!loginEmailModalInput || !loginPasswordModalInput) return; // Guard clause
        const email = loginEmailModalInput.value;
        const password = loginPasswordModalInput.value;
        const loginButton = loginFormModal.querySelector('button[type="submit"]');

        if (loginButton) { loginButton.disabled = true; loginButton.textContent = 'Accesso...'; }
        if (loginModalErrorDiv) clearFieldError(loginModalErrorDiv);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            if (loginModal) loginModal.style.display = 'none';
            if (loginFormModal) loginFormModal.reset();
            // Il reindirizzamento/aggiornamento UI sarà gestito da onAuthStateChanged in main.js
            showToast("Login effettuato con successo!", "success");
            // Potresti voler reindirizzare qui se la logica di main.js non copre il caso da modale
            // window.location.href = new URLSearchParams(window.location.search).get('redirect') || '/profile.html';
        } catch (error) {
            console.error('Errore login da modale:', error);
            const friendlyMessage = translateFirebaseError(error.code);
            if (loginModalErrorDiv) showFieldError(loginModalErrorDiv, friendlyMessage);
            showToast(`Errore Login: ${friendlyMessage}`, 'error');
        } finally {
            if (loginButton) { loginButton.disabled = false; loginButton.textContent = 'Login'; }
        }
    });
}

// --- AGGANCIO EVENT LISTENER PRINCIPALE ---
if (registerForm) {
    registerForm.addEventListener('submit', handleRegistration);
    console.log("js/register.js: Event listener per 'submit' AGGIUNTO CORRETTAMENTE a 'registerForm'.");
} else {
    console.error("js/register.js: ERRORE CRITICO - Elemento form con ID 'registerForm' NON TROVATO. La registrazione non funzionerà.");
}

// Aggiungi event listener per pulire gli errori specifici mentre l'utente scrive (migliora UX)
if (emailInput && emailErrorDiv) emailInput.addEventListener('input', () => clearFieldError(emailErrorDiv));
if (passwordInput && passwordErrorDiv) passwordInput.addEventListener('input', () => clearFieldError(passwordErrorDiv));
if (confirmPasswordInput && confirmPasswordErrorDiv) confirmPasswordInput.addEventListener('input', () => clearFieldError(confirmPasswordErrorDiv));
if (nicknameInput && nicknameErrorDiv) nicknameInput.addEventListener('input', () => clearFieldError(nicknameErrorDiv));
// Non c'è un nationalityErrorDiv definito nell'HTML, quindi non aggiungo listener per quello.

console.log('js/register.js caricato e inizializzato.');
// =============== FINE js/register.js ===============
