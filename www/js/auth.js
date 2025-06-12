// js/auth.js
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db, auth } from './firebase-config.js'; 
import { showToast } from './toastNotifications.js';

// Importa solo le funzioni per email/password
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'; 



// Rimuoviamo o commentiamo le variabili globali non più necessarie
// let confirmationResult = null;
// let recaptchaVerifier = null;

// Rimuoviamo o commentiamo le funzioni di autenticazione Google e Telefonica

/*
export async function handleGoogleSignIn() {
    // ... (codice di Google Sign-In rimosso o commentato)
}

export function initializeRecaptchaVerifier() {
    // ... (codice reCAPTCHA rimosso o commentato)
}

export async function sendPhoneNumberVerification(phoneNumber) {
    // ... (codice autenticazione telefonica rimosso o commentato)
}

export async function verifyPhoneNumberCode(verificationCode) {
    // ... (codice autenticazione telefonica rimosso o commentato)
}
*/

/**
 * Registra un nuovo utente con email e password.
 * @param {string} email
 * @param {string} password
 * @param {string} displayName (Opzionale)
 */
export async function registerWithEmailPassword(email, password, displayName = null) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Crea un documento utente in Firestore
        const userRef = doc(db, "appUsers", user.uid);
        await setDoc(userRef, {
            uid: user.uid,
            displayName: displayName || email, // Usa displayName se fornito, altrimenti l'email
            email: user.email,
            photoURL: user.photoURL || null, // Firebase non fornisce photoURL per email/password
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            gameStats: { totalScore: 0, gamesPlayed: 0, bossesDefeated: 0 },
            earnedBadges: []
        });

        showToast(`Account creato con successo per ${user.email}!`, 'success');
        return user;
    } catch (error) {
        console.error("Errore durante la registrazione:", error);
        let errorMessage = "Errore durante la registrazione.";
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = "Questa email è già in uso.";
                break;
            case 'auth/invalid-email':
                errorMessage = "Formato email non valido.";
                break;
            case 'auth/weak-password':
                errorMessage = "La password è troppo debole (minimo 6 caratteri).";
                break;
            default:
                errorMessage = `Errore: ${error.message}`;
                break;
        }
        showToast(errorMessage, 'error');
        throw error; // Rilancia l'errore per gestione esterna
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

        // Aggiorna lastLoginAt in Firestore
        const userRef = doc(db, "appUsers", user.uid);
        await updateDoc(userRef, { lastLoginAt: serverTimestamp() });

        showToast(`Bentornato, ${user.email}!`, 'success');
        
        const loginModal = document.getElementById('loginModal');
        if (loginModal) loginModal.style.display = 'none'; // Chiudi la modale
        
        return user;
    } catch (error) {
        console.error("Errore durante il login:", error);
        let errorMessage = "Email o password non valide.";
        switch (error.code) {
            case 'auth/invalid-credential': // o 'auth/wrong-password', 'auth/user-not-found'
                errorMessage = "Email o password non valide.";
                break;
            case 'auth/invalid-email':
                errorMessage = "Formato email non valido.";
                break;
            default:
                errorMessage = `Errore: ${error.message}`;
                break;
        }
        showToast(errorMessage, 'error');
        throw error; // Rilancia l'errore per gestione esterna
    }
}