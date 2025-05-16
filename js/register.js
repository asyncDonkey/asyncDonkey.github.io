// js/register.js
import { db, auth } from './main.js';
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signInWithEmailAndPassword, // Aggiunto per la modale di login
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { showToast } from './toastNotifications.js';

// --- RIFERIMENTI DOM ---
const registrationForm = document.getElementById('registrationForm');
const emailInput = document.getElementById('regEmail');
const passwordInput = document.getElementById('regPassword');
const confirmPasswordInput = document.getElementById('regConfirmPassword');
const nicknameInput = document.getElementById('regNickname');
const nationalitySelect = document.getElementById('regNationality');
const registerBtn = document.getElementById('registerBtn');

// Messaggi di errore specifici per campo
const emailErrorDiv = document.getElementById('emailError');
const passwordErrorDiv = document.getElementById('passwordError');
const confirmPasswordErrorDiv = document.getElementById('confirmPasswordError');
const nicknameErrorDiv = document.getElementById('nicknameError');
const nationalityErrorDiv = document.getElementById('nationalityError'); // Aggiunto se necessario, anche se il select ha 'required'
const generalErrorDiv = document.getElementById('generalError');

const registrationSuccessMessageDiv = document.getElementById('registrationSuccessMessage');

// Riferimenti per la modale di Login (se l'utente clicca su "Accedi qui")
const loginRedirectLink = document.getElementById('loginRedirectLink');
const loginModal = document.getElementById('loginModal'); // Assumendo che l'ID sia questo nel register.html
const loginFormModal = document.getElementById('loginFormModal'); // Form dentro la modale
const loginEmailModalInput = document.getElementById('loginEmailModal');
const loginPasswordModalInput = document.getElementById('loginPasswordModal');
const closeLoginModalBtn = document.getElementById('closeLoginModalBtn');
const loginModalErrorDiv = document.getElementById('loginModalError');

// --- FUNZIONI DI VALIDAZIONE ---

/**
 * Mostra un messaggio di errore per un campo specifico.
 * @param {HTMLElement} errorDiv - L'elemento div dove mostrare l'errore.
 * @param {string} message - Il messaggio di errore.
 */
function showFieldError(errorDiv, message) {
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

/**
 * Nasconde il messaggio di errore per un campo specifico.
 * @param {HTMLElement} errorDiv - L'elemento div dell'errore.
 */
function clearFieldError(errorDiv) {
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
    }
}

/**
 * Pulisce tutti i messaggi di errore dei campi.
 */
function clearAllFieldErrors() {
    clearFieldError(emailErrorDiv);
    clearFieldError(passwordErrorDiv);
    clearFieldError(confirmPasswordErrorDiv);
    clearFieldError(nicknameErrorDiv);
    clearFieldError(nationalityErrorDiv); // Se aggiunto
    clearFieldError(generalErrorDiv);
}

/**
 * Valida l'intero form di registrazione.
 * @returns {boolean} True se il form è valido, altrimenti false.
 */
function validateRegistrationForm() {
    clearAllFieldErrors();
    let isValid = true;

    // Validazione Email
    if (!emailInput.value.trim()) {
        showFieldError(emailErrorDiv, 'L\'email è obbligatoria.');
        isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(emailInput.value.trim())) {
        showFieldError(emailErrorDiv, 'Inserisci un indirizzo email valido.');
        isValid = false;
    }

    // Validazione Password
    const password = passwordInput.value;
    if (!password) {
        showFieldError(passwordErrorDiv, 'La password è obbligatoria.');
        isValid = false;
    } else if (password.length < 8) {
        showFieldError(passwordErrorDiv, 'La password deve essere di almeno 8 caratteri.');
        isValid = false;
    } else if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/.test(password)) {
        showFieldError(passwordErrorDiv, 'La password deve contenere almeno una maiuscola, una minuscola e un numero.');
        isValid = false;
    }

    // Validazione Conferma Password
    if (!confirmPasswordInput.value) {
        showFieldError(confirmPasswordErrorDiv, 'La conferma password è obbligatoria.');
        isValid = false;
    } else if (confirmPasswordInput.value !== password) {
        showFieldError(confirmPasswordErrorDiv, 'Le password non corrispondono.');
        isValid = false;
    }

    // Validazione Nickname
    const nickname = nicknameInput.value.trim();
    if (!nickname) {
        showFieldError(nicknameErrorDiv, 'Il nickname è obbligatorio.');
        isValid = false;
    } else if (nickname.length < 3 || nickname.length > 25) {
        showFieldError(nicknameErrorDiv, 'Il nickname deve avere tra 3 e 25 caratteri.');
        isValid = false;
    } else if (!/^[a-zA-Z0-9_.-]*$/.test(nickname)) {
        showFieldError(nicknameErrorDiv, 'Il nickname può contenere solo lettere, numeri, underscore, punto o trattino.');
        isValid = false;
    }


    // Validazione Nazionalità
    if (!nationalitySelect.value) {
        // Potrebbe essere gestito da HTML5 'required', ma aggiungiamo un controllo JS
        if (nationalityErrorDiv) showFieldError(nationalityErrorDiv, 'La nazionalità è obbligatoria.');
        else showFieldError(generalErrorDiv, 'La nazionalità è obbligatoria.'); // Fallback a errore generale
        isValid = false;
    }

    return isValid;
}

// --- GESTIONE REGISTRAZIONE ---
async function handleRegistration(event) {
    event.preventDefault();
    if (!validateRegistrationForm()) {
        showToast('Per favore, correggi gli errori nel form.', 'error');
        return;
    }

    if (registerBtn) {
        registerBtn.disabled = true;
        registerBtn.textContent = 'Registrazione in corso...';
    }
    if (generalErrorDiv) clearFieldError(generalErrorDiv);

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const nickname = nicknameInput.value.trim();
    let nationalityCode = nationalitySelect.value; // Può essere ""

    // Se nationalityCode è una stringa vuota dal select, impostalo a null
    // per essere coerente con request.resource.data.get('nationalityCode', null) == null nella regola
    if (nationalityCode === '') {
        nationalityCode = null;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Invia email di verifica
        await sendEmailVerification(user);
        sessionStorage.setItem('newlyRegistered', 'true'); // Per il messaggio di benvenuto in main.js

        // Crea documento profilo utente su Firestore
        // Modificato per inviare solo i campi permessi dalla regola di creazione (+ createdAt)
        const userProfileRef = doc(db, 'userProfiles', user.uid);
        const userProfileData = {
    email: user.email, // Già corretto, user.email è l'email dell'utente autenticato
    nickname: nickname,
    nationalityCode: nationalityCode, // JS già gestisce "" a null
    isAdmin: false,
    createdAt: serverTimestamp(),
    statusMessage: '',
    externalLinks: [],
    earnedBadges: [],
    bio: '',
};
        
        // Se nationalityCode è null, non lo includiamo nell'oggetto per far scattare correttamente
        // request.resource.data.get('nationalityCode', null) == null nella regola.
        // Tuttavia, la regola sulle chiavi si aspetta 'nationalityCode'.
        // Firestore gestisce bene i campi null, quindi inviarlo come null è corretto.
        // La regola `keys().toSet().difference(...)` si aspetta la presenza della CHIAVE 'nationalityCode'
        // se è nella lista. Se `nationalityCode` è `null` ma la chiave c'è, va bene.

        await setDoc(userProfileRef, userProfileData);

        if (registrationForm) registrationForm.style.display = 'none';
        if (registrationSuccessMessageDiv) registrationSuccessMessageDiv.style.display = 'block';

    } catch (error) {
        console.error('Errore durante la registrazione:', error);
        const friendlyErrorMessage = translateFirebaseError(error.code); // Funzione definita in register.js
        showFieldError(generalErrorDiv, friendlyErrorMessage);
        showToast(`Errore registrazione: ${friendlyErrorMessage}`, 'error');
    } finally {
        if (registerBtn) {
            registerBtn.disabled = false;
            registerBtn.textContent = 'Registrati';
        }
    }
}

/**
 * Traduce i codici di errore di Firebase Auth in messaggi user-friendly.
 * @param {string} errorCode - Il codice di errore di Firebase.
 * @returns {string} Il messaggio tradotto.
 */
function translateFirebaseError(errorCode) {
    switch (errorCode) {
        case 'auth/email-already-in-use':
            return 'L\'indirizzo email è già utilizzato da un altro account.';
        case 'auth/invalid-email':
            return 'L\'indirizzo email non è valido.';
        case 'auth/operation-not-allowed':
            return 'Operazione non permessa. Contatta l\'amministratore.';
        case 'auth/weak-password':
            return 'La password fornita è troppo debole.';
        default:
            return `Si è verificato un errore sconosciuto (${errorCode}). Riprova.`;
    }
}

// --- GESTIONE MODALE LOGIN ---
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

// Chiudi modale se si clicca fuori
if (loginModal) {
    window.addEventListener('click', (event) => {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });
}


if (loginFormModal) {
    loginFormModal.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginEmailModalInput.value;
        const password = loginPasswordModalInput.value;
        const loginButton = loginFormModal.querySelector('button[type="submit"]');

        if (loginButton) {
            loginButton.disabled = true;
            loginButton.textContent = 'Accesso...';
        }
        if (loginModalErrorDiv) clearFieldError(loginModalErrorDiv);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // Login avvenuto con successo
            if (loginModal) loginModal.style.display = 'none';
            loginFormModal.reset();

            // Reindirizza alla pagina profilo o homepage
            // Il message di benvenuto sarà gestito da main.js all'auth state change
            // se l'email è verificata.
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get('redirect') || 'profile.html'; // Default a profile.html
            window.location.href = redirectUrl;

        } catch (error) {
            console.error('Errore login da modale:', error);
            const friendlyErrorMessage = translateFirebaseError(error.code); // Usa la stessa funzione di traduzione
            if (loginModalErrorDiv) showFieldError(loginModalErrorDiv, friendlyErrorMessage);
            showToast(`Errore Login: ${friendlyErrorMessage}`, 'error');
        } finally {
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent = 'Login';
            }
        }
    });
}


// --- EVENT LISTENERS ---
if (registrationForm) {
    registrationForm.addEventListener('submit', handleRegistration);
}

// Aggiungi event listener per pulire gli errori mentre l'utente scrive (opzionale ma buona UX)
if (emailInput && emailErrorDiv) emailInput.addEventListener('input', () => clearFieldError(emailErrorDiv));
if (passwordInput && passwordErrorDiv) passwordInput.addEventListener('input', () => clearFieldError(passwordErrorDiv));
if (confirmPasswordInput && confirmPasswordErrorDiv) confirmPasswordInput.addEventListener('input', () => clearFieldError(confirmPasswordErrorDiv));
if (nicknameInput && nicknameErrorDiv) nicknameInput.addEventListener('input', () => clearFieldError(nicknameErrorDiv));
if (nationalitySelect && nationalityErrorDiv) nationalitySelect.addEventListener('change', () => clearFieldError(nationalityErrorDiv));

console.log('js/register.js caricato e inizializzato.');