// js/auth.js
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db, auth } from './firebase-config.js'; // Importa le istanze condivise
import { GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'; // Import per il WEB
import { showToast } from './toastNotifications.js';

/**
 * Gestisce il login con Google, scegliendo il metodo corretto (nativo o web)
 * in base alla piattaforma in cui l'app è in esecuzione.
 */
export async function handleGoogleSignIn() {
    try {
        let result;

        // Controlla se l'oggetto Capacitor esiste e se siamo su una piattaforma nativa
        if (window.Capacitor && Capacitor.isNativePlatform()) {
            console.log("Piattaforma nativa rilevata. Uso del plugin Capacitor.");
            const { FirebaseAuthentication } = Capacitor.Plugins;
            result = await FirebaseAuthentication.signInWithGoogle();
        } else {
            console.log("Piattaforma web rilevata. Uso del Firebase Web SDK.");
            const provider = new GoogleAuthProvider();
            result = await signInWithPopup(auth, provider);
        }

        const user = result.user;
        if (!user) {
            throw new Error("L'oggetto utente non è stato ricevuto da Google.");
        }

        const userRef = doc(db, "appUsers", user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp(),
                gameStats: { totalScore: 0, gamesPlayed: 0, bossesDefeated: 0 },
                earnedBadges: []
            });
            showToast(`Benvenuto, ${user.displayName}!`, 'success');
        } else {
            await updateDoc(userRef, { lastLoginAt: serverTimestamp() });
            showToast(`Bentornato, ${user.displayName}!`, 'success');
        }

        const loginModal = document.getElementById('loginModal');
        if (loginModal) loginModal.style.display = 'none';

    } catch (error) {
        console.error("Errore durante il login con Google:", error);
        // Evita di mostrare l'errore se l'utente chiude il popup di login
        if (error.code !== 'auth/popup-closed-by-user') {
            showToast("Errore durante l'accesso. Riprova.", 'error');
        }
    }
}