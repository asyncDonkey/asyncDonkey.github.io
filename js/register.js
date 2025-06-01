// =============== js/register.js ===============
import { db, auth } from './main.js'; // Assicurati che il percorso sia corretto
import {
    createUserWithEmailAndPassword,
    // sendEmailVerification, // Commentalo se non lo usi attivamente in questo flusso
    signInWithEmailAndPassword, // Per la modale di login
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { showToast } from './toastNotifications.js'; // Assicurati che il percorso sia corretto

// --- RIFERIMENTI DOM ---
const registerForm = document.getElementById('registerForm');
const emailInput = document.getElementById('registerEmail');
const passwordInput = document.getElementById('registerPassword');
const confirmPasswordInput = document.getElementById('registerConfirmPassword');
const nicknameInput = document.getElementById('registerNickname');
const nationalitySelect = document.getElementById('registerNationality');

const emailErrorDiv = document.getElementById('emailError');
const passwordErrorDiv = document.getElementById('passwordError');
const confirmPasswordErrorDiv = document.getElementById('confirmPasswordError');
const nicknameErrorDiv = document.getElementById('nicknameError');
const nationalityErrorDiv = document.getElementById('nationalityError');
const generalErrorDiv = document.getElementById('generalError');

const registrationSuccessMessageDiv = document.getElementById('registrationSuccessMessage');

const loginRedirectLink = document.getElementById('loginRedirectLink');
const loginModal = document.getElementById('loginModal');
const loginFormModal = document.getElementById('loginFormModal'); // Assumendo sia l'ID del form DENTRO la modale
const loginEmailModalInput = document.getElementById('loginEmailModal');
const loginPasswordModalInput = document.getElementById('loginPasswordModal');
const closeLoginModalBtn = document.getElementById('closeLoginModalBtn'); // DEVE ESSERE L'ID DEL BOTTONE DI CHIUSURA NELLA MODALE
const loginModalErrorDiv = document.getElementById('loginModalError'); // Errore specifico per la modale di login

const openTermsModalLink = document.getElementById('openTermsModalLink');
const openPrivacyModalLink = document.getElementById('openPrivacyModalLink');
const legalInfoModal = document.getElementById('legalInfoModal');
const closeLegalInfoModalBtn = document.getElementById('closeLegalInfoModalBtn');
const legalInfoModalTitle = document.getElementById('legalInfoModalTitle');
const legalInfoModalContent = document.getElementById('legalInfoModalContent');

// --- FUNZIONI DI VALIDAZIONE E UTILITY ---
function showFieldError(errorDiv, message) {
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    } else {
        console.warn(`Tentativo di mostrare errore su un div non trovato. Messaggio: ${message}`);
        if (generalErrorDiv) {
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
    if (nationalityErrorDiv) clearFieldError(nationalityErrorDiv);
    clearFieldError(generalErrorDiv);
    if (registrationSuccessMessageDiv) registrationSuccessMessageDiv.style.display = 'none';
    // Pulisci anche l'errore della modale di login, se visibile e se la modale non è più attiva
    if (loginModalErrorDiv && loginModal && loginModal.style.display !== 'block') {
        clearFieldError(loginModalErrorDiv);
    }
}

// Testi Placeholder (DA SOSTITUIRE CON I TESTI FINALI)
const termsOfServiceText = `
    <h2>Termini di Servizio di asyncDonkey.io</h2>
    <p><strong>Ultimo aggiornamento:</strong> 28 Maggio 2025</p>
    <p>Benvenuto su asyncDonkey.io!</p>
    <p>L'utilizzo di questo sito implica l'accettazione dei seguenti termini e condizioni. Se non sei d'accordo con uno qualsiasi di questi termini, sei pregato di non utilizzare il nostro sito.</p>
    <h4>1. Utilizzo del Sito</h4>
    <p>asyncDonkey.io fornisce una piattaforma per giochi, articoli tecnici e interazione con la community. È vietato utilizzare il sito per scopi illegali o non autorizzati.</p>
    <h4>2. Account Utente</h4>
    <p>Per accedere ad alcune funzionalità, potrebbe essere necessario registrare un account. Sei responsabile della riservatezza delle tue credenziali e di tutte le attività che avvengono sul tuo account.</p>
    <h4>3. Contenuti Generati dagli Utenti</h4>
    <p>Se il sito permette la pubblicazione di contenuti (commenti, articoli, ecc.), sei l'unico responsabile dei contenuti che pubblichi. Non sono ammessi contenuti illegali, offensivi, o che violino i diritti di terzi. asyncDonkey.io si riserva il diritto di rimuovere tali contenuti a sua discrezione.</p>
    <h4>4. Proprietà Intellettuale</h4>
    <p>I contenuti originali del sito (esclusi i contenuti generati dagli utenti), le funzionalità e le caratteristiche sono e rimarranno di proprietà esclusiva di asyncDonkey.io e dei suoi licenziatari.</p>
    <h4>5. Limitazione di Responsabilità</h4>
    <p>Il sito è fornito "così com'è" e "come disponibile". Non garantiamo che il sito sia privo di errori, interruzioni o sicuro al 100%. L'utilizzo del sito è a tuo rischio.</p>
    <h4>6. Modifiche ai Termini</h4>
    <p>Ci riserviamo il diritto di modificare questi termini in qualsiasi momento. Le modifiche saranno efficaci immediatamente dopo la pubblicazione sul sito. È tua responsabilità controllare periodicamente questa pagina per eventuali aggiornamenti.</p>
    <h4>7. Contatti</h4>
    <p>Per qualsiasi domanda relativa a questi Termini di Servizio, contattaci tramite i canali forniti sul sito.</p>
    <p><em>Questo è un testo placeholder generato da AI. Sostituiscilo con i tuoi Termini di Servizio completi e legalmente validi.</em></p>
`;

const privacyPolicyText = `
    <h2>Privacy Policy di asyncDonkey.io</h2>
    <p><strong>Ultimo aggiornamento:</strong> 28 Maggio 2025</p>
    <p>Questa Privacy Policy descrive come asyncDonkey.io ("noi", "nostro") raccoglie, utilizza e protegge le tue informazioni personali quando utilizzi il nostro sito web.</p>
    <h4>1. Informazioni che Raccogliamo</h4>
    <p>Potremmo raccogliere le seguenti informazioni quando ti registri o utilizzi i nostri servizi:</p>
    <ul>
        <li><strong>Informazioni di identificazione personale:</strong> Indirizzo email, nickname, nazionalità (se fornita).</li>
        <li><strong>Dati di utilizzo:</strong> Informazioni su come utilizzi il sito, come punteggi nei giochi, interazioni con articoli e commenti, attività sulla piattaforma.</li>
        <li><strong>Informazioni tecniche:</strong> Indirizzo IP, tipo di browser, sistema operativo, e dati di log standard per analisi e sicurezza.</li>
    </ul>
    <h4>2. Come Utilizziamo le Tue Informazioni</h4>
    <p>Utilizziamo le informazioni raccolte per:</p>
    <ul>
        <li>Fornire, operare e migliorare i nostri servizi e la piattaforma.</li>
        <li>Personalizzare la tua esperienza utente.</li>
        <li>Comunicare con te, ad esempio per inviare email di verifica, notifiche relative al tuo account o aggiornamenti importanti.</li>
        <li>Garantire la sicurezza e l'integrità della nostra piattaforma.</li>
        <li>Analizzare l'utilizzo del sito per capire come migliorarlo.</li>
    </ul>
    <h4>3. Condivisione delle Informazioni</h4>
    <p>Non vendiamo, scambiamo o trasferiamo in altro modo a terzi le tue informazioni di identificazione personale senza il tuo consenso, tranne nei seguenti casi limitati:</p>
    <ul>
        <li>Per rispettare obblighi legali o richieste governative valide.</li>
        <li>Per proteggere i nostri diritti, la nostra proprietà o la sicurezza di asyncDonkey.io, dei nostri utenti o del pubblico.</li>
        <li>Con fornitori di servizi terzi che ci assistono nell'operare il nostro sito web o condurre la nostra attività, a condizione che tali parti accettino di mantenere riservate queste informazioni.</li>
    </ul>
    <p>Il tuo nickname e la tua nazionalità (se fornita) sono informazioni pubbliche visibili agli altri utenti sulla piattaforma.</p>
    <h4>4. Sicurezza dei Dati</h4>
    <p>Adottiamo misure di sicurezza appropriate per proteggere contro l'accesso non autorizzato, l'alterazione, la divulgazione o la distruzione delle tue informazioni personali. Tuttavia, nessun metodo di trasmissione su Internet o di archiviazione elettronica è sicuro al 100%.</p>
    <h4>5. Cookie</h4>
    <p>Il nostro sito potrebbe utilizzare cookie essenziali per il funzionamento della piattaforma (es. gestione della sessione utente). Non utilizziamo cookie di tracciamento di terze parti per scopi pubblicitari invasivi. Puoi istruire il tuo browser a rifiutare tutti i cookie o a indicare quando un cookie viene inviato, ma alcune parti del sito potrebbero non funzionare correttamente.</p>
    <h4>6. I Tuoi Diritti (es. GDPR)</h4>
    <p>A seconda della tua giurisdizione, potresti avere determinati diritti riguardo alle tue informazioni personali, come il diritto di accedere, correggere, aggiornare o richiedere la cancellazione dei tuoi dati. Per esercitare tali diritti, puoi contattarci o gestire le informazioni disponibili tramite la pagina del tuo profilo.</p>
    <h4>7. Conservazione dei Dati</h4>
    <p>Conserveremo le tue informazioni personali solo per il tempo necessario agli scopi indicati in questa Privacy Policy, a meno che un periodo di conservazione più lungo non sia richiesto o consentito dalla legge.</p>
    <h4>8. Modifiche a questa Policy</h4>
    <p>Potremmo aggiornare questa Privacy Policy di tanto in tanto. Ti informeremo di eventuali modifiche significative pubblicando la nuova policy sul sito con una data di aggiornamento rivista.</p>
    <h4>9. Contatti</h4>
    <p>Se hai domande su questa Privacy Policy, contattaci attraverso i canali forniti sul sito.</p>
    <p><em>Questo è un testo placeholder generato da AI. Sostituiscilo con la tua Privacy Policy completa, specifica e conforme alle normative vigenti (es. GDPR).</em></p>
`;

function openLegalModal(type) {
    if (!legalInfoModal || !legalInfoModalTitle || !legalInfoModalContent) {
        console.error('Elementi della modale legale non trovati.');
        return;
    }

    if (type === 'terms') {
        legalInfoModalTitle.textContent = 'Termini di Servizio';
        legalInfoModalContent.innerHTML = termsOfServiceText;
    } else if (type === 'privacy') {
        legalInfoModalTitle.textContent = 'Privacy Policy';
        legalInfoModalContent.innerHTML = privacyPolicyText;
    }
    legalInfoModal.style.display = 'flex';
    document.body.classList.add('modal-open');
}

function closeLegalModal() {
    if (!legalInfoModal) return;
    legalInfoModal.style.display = 'none';
    document.body.classList.remove('modal-open');
}

// --- GESTIONE REGISTRAZIONE ---
const handleRegistration = async (event) => {
    event.preventDefault();
    clearAllFieldErrors();
    console.log('Tentativo di registrazione...');

    const emailElement = document.getElementById('registerEmail');
    const passwordElement = document.getElementById('registerPassword');
    const confirmPasswordElement = document.getElementById('registerConfirmPassword');
    const nicknameElement = document.getElementById('registerNickname');
    const nationalityElement = document.getElementById('registerNationality');

    if (!emailElement || !passwordElement || !confirmPasswordElement || !nicknameElement || !nationalityElement) {
        console.error('Errore critico: Impossibile trovare uno o più elementi del form nel DOM.');
        showToast('Errore interno durante il recupero dei campi del form.', 'error');
        if (generalErrorDiv) showFieldError(generalErrorDiv, 'Errore interno, riprova più tardi.');
        return;
    }

    const email = emailElement.value;
    const password = passwordElement.value;
    const confirmPassword = confirmPasswordElement.value;
    const nickname = nicknameElement.value;
    const nationality = nationalityElement.value;

    if (!email) {
        showFieldError(emailErrorDiv, "L'email è obbligatoria.");
        showToast("L'email è obbligatoria.", 'warning');
        return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        showFieldError(emailErrorDiv, 'Inserisci un indirizzo email valido.');
        showToast('Inserisci un indirizzo email valido.', 'warning');
        return;
    }
    if (!nickname) {
        showFieldError(nicknameErrorDiv, 'Il nickname è obbligatorio.');
        showToast('Il nickname è obbligatorio.', 'warning');
        return;
    }
    if (nickname.length < 3 || nickname.length > 25) {
        showFieldError(nicknameErrorDiv, 'Il nickname deve avere tra 3 e 25 caratteri.');
        showToast('Il nickname deve avere tra 3 e 25 caratteri.', 'warning');
        return;
    }
    if (!password) {
        showFieldError(passwordErrorDiv, 'La password è obbligatoria.');
        showToast('La password è obbligatoria.', 'warning');
        return;
    }
    if (password.length < 6) {
        showFieldError(passwordErrorDiv, 'La password deve contenere almeno 6 caratteri.');
        showToast('La password deve contenere almeno 6 caratteri.', 'warning');
        return;
    }
    if (password !== confirmPassword) {
        showFieldError(confirmPasswordErrorDiv, 'Le password non coincidono.');
        showToast('Le password non coincidono.', 'warning');
        return;
    }

    // La select per nazionalità avrà sempre un valore, "" se "Seleziona..."
    // Le Firestore Rules permettono nationalityCode: null, che la logica sotto gestisce.
    // Un controllo esplicito qui per `if (!nationality)` non è strettamente necessario
    // se "" è un valore accettabile che poi verrà convertito in null.

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('Utente creato con successo in Firebase Auth:', user.uid);
        showToast('Registrazione autenticazione avvenuta con successo!', 'success');

        const userProfileData = {
            email: user.email,
            nickname: nickname,
            nationalityCode: nationality || null,
            createdAt: serverTimestamp(),
            isAdmin: false,
            isTestUser: false, // <-- AGGIUNGI QUESTA RIGA
            statusMessage: 'Nuovo utente!',
            externalLinks: [],
            earnedBadges: [],
            bio: '',
            hasPublishedArticles: false,
            hasDefeatedGlitchzilla: false,
        };

        console.log('Dati del profilo da salvare:', userProfileData);
        await setDoc(doc(db, 'userProfiles', user.uid), userProfileData);

        console.log('Profilo utente creato con successo in Firestore.');
        if (registrationSuccessMessageDiv) {
            registrationSuccessMessageDiv.textContent =
                'Registrazione completata con successo! Sarai reindirizzato a breve.';
            registrationSuccessMessageDiv.style.display = 'block';
            if (registerForm) registerForm.style.display = 'none'; // Nascondi form dopo successo
        }
        showToast('Profilo utente creato con successo! Reindirizzamento...', 'success', 4000);

        if (registerForm) {
            const submitButton = registerForm.querySelector('button[type="submit"]');
            if (submitButton) submitButton.disabled = true;
        }

        setTimeout(() => {
            window.location.href = '/profile.html';
        }, 2000);
    } catch (error) {
        console.error('Errore durante la registrazione:', error);
        let errorMessage = 'Errore imprevisto durante la registrazione. Riprova.';
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
                    errorMessage =
                        "La registrazione tramite email e password non è abilitata. Contatta l'amministratore.";
                    if (generalErrorDiv) showFieldError(generalErrorDiv, errorMessage);
                    break;
                case 'auth/weak-password':
                    errorMessage = 'La password è troppo debole. Scegli una password più robusta.';
                    showFieldError(passwordErrorDiv, errorMessage);
                    break;
                default:
                    errorMessage = `Errore di registrazione (${error.code}). Riprova o contatta l'assistenza.`;
                    if (generalErrorDiv) showFieldError(generalErrorDiv, errorMessage);
            }
        } else if (error.message && error.message.includes('Missing or insufficient permissions')) {
            errorMessage =
                'Errore di permessi durante la creazione del profilo. Verifica le regole Firestore e i dati inviati.';
            if (generalErrorDiv) showFieldError(generalErrorDiv, errorMessage);
        }
        showToast(errorMessage, 'error', 7000);
    }
};

// --- GESTIONE MODALE LOGIN ---
function translateFirebaseError(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-email':
            return "L'indirizzo email non è valido.";
        case 'auth/user-not-found':
            return 'Nessun utente trovato con questa email.';
        case 'auth/wrong-password':
            return 'Password errata.';
        case 'auth/user-disabled':
            return 'Questo account utente è stato disabilitato.';
        default:
            return `Errore di autenticazione. Riprova (${errorCode}).`;
    }
}

if (loginRedirectLink && loginModal) {
    loginRedirectLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.style.display = 'block';
        if (loginModalErrorDiv) clearFieldError(loginModalErrorDiv);
        if (loginFormModal) loginFormModal.reset(); // Pulisci form modale all'apertura
        if (loginEmailModalInput) loginEmailModalInput.focus(); // Focus sul primo campo
    });
}

if (closeLoginModalBtn && loginModal) {
    closeLoginModalBtn.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });
}

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
        if (!loginEmailModalInput || !loginPasswordModalInput) return;
        const email = loginEmailModalInput.value;
        const password = loginPasswordModalInput.value;
        const loginButton = loginFormModal.querySelector('button[type="submit"]');

        if (loginButton) {
            loginButton.disabled = true;
            loginButton.textContent = 'Accesso...';
        }
        if (loginModalErrorDiv) clearFieldError(loginModalErrorDiv);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            if (loginModal) loginModal.style.display = 'none';
            if (loginFormModal) loginFormModal.reset();
            showToast('Login effettuato con successo! Reindirizzamento...', 'success');

            // Reindirizza alla pagina profilo o a quella specificata da 'redirect'
            const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/profile.html';
            // Un piccolo ritardo per permettere al toast di essere visto prima del redirect
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1500);
        } catch (error) {
            console.error('Errore login da modale:', error);
            const friendlyMessage = translateFirebaseError(error.code);
            if (loginModalErrorDiv) showFieldError(loginModalErrorDiv, friendlyMessage);
            showToast(`Errore Login: ${friendlyMessage}`, 'error');
        } finally {
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent = 'Login';
            }
        }
    });
}

// --- AGGANCIO EVENT LISTENER PRINCIPALE E LOGICA authAction ---
document.addEventListener('DOMContentLoaded', () => {
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
        console.log("js/register.js: Event listener per 'submit' AGGIUNTO a 'registerForm'.");
    } else {
        console.error("js/register.js: ERRORE CRITICO - Elemento form con ID 'registerForm' NON TROVATO.");
    }

    if (emailInput && emailErrorDiv) emailInput.addEventListener('input', () => clearFieldError(emailErrorDiv));
    if (passwordInput && passwordErrorDiv)
        passwordInput.addEventListener('input', () => clearFieldError(passwordErrorDiv));
    if (confirmPasswordInput && confirmPasswordErrorDiv)
        confirmPasswordInput.addEventListener('input', () => clearFieldError(confirmPasswordErrorDiv));
    if (nicknameInput && nicknameErrorDiv)
        nicknameInput.addEventListener('input', () => clearFieldError(nicknameErrorDiv));

    // ----- INIZIO CODICE MODALE LEGALE DA SPOSTARE QUI -----
    if (openTermsModalLink) {
        openTermsModalLink.addEventListener('click', (e) => {
            e.preventDefault();
            openLegalModal('terms');
        });
    }

    if (openPrivacyModalLink) {
        openPrivacyModalLink.addEventListener('click', (e) => {
            e.preventDefault();
            openLegalModal('privacy');
        });
    }

    if (closeLegalInfoModalBtn) {
        closeLegalInfoModalBtn.addEventListener('click', closeLegalModal);
    }

    if (legalInfoModal) {
        legalInfoModal.addEventListener('click', (event) => {
            if (event.target === legalInfoModal) {
                closeLegalModal();
            }
        });
    }
    // ----- FINE CODICE MODALE LEGALE -----

    // Logica per authAction
    const urlParams = new URLSearchParams(window.location.search);
    const authAction = urlParams.get('authAction');
    const currentLoginModal = document.getElementById('loginModal'); // Riferimento fresco

    console.log(`[Register.js] DOMContentLoaded - authAction dall'URL: ${authAction}`);

    if (authAction === 'login') {
        if (currentLoginModal) {
            console.log("[Register.js] Azione 'login' richiesta: apro la modale di login.");
            currentLoginModal.style.display = 'block';
            const errorDivModal = currentLoginModal.querySelector('#loginModalError'); // Usa ID corretto se diverso
            if (errorDivModal) clearFieldError(errorDivModal);
            const emailInputModal = currentLoginModal.querySelector('#loginEmailModal'); // Usa ID corretto
            if (emailInputModal) emailInputModal.focus();
        } else {
            console.warn("[Register.js] Azione 'login' richiesta, ma la modale di login non è stata trovata nel DOM.");
        }
    } else if (authAction === 'signup') {
        console.log("[Register.js] Azione 'signup' richiesta: comportamento di default (form registrazione visibile).");
        if (currentLoginModal) {
            currentLoginModal.style.display = 'none'; // Assicurati che la modale sia chiusa
        }
        // Il form di registrazione dovrebbe essere visibile di default
    } else {
        console.log('[Register.js] Nessuna authAction specifica o valore non riconosciuto. Comportamento di default.');
        if (currentLoginModal) {
            currentLoginModal.style.display = 'none'; // Assicurati che la modale sia chiusa
        }
    }
    console.log('js/register.js caricato e inizializzato (incluso il gestore authAction).');
});
