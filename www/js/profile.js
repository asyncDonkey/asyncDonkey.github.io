// js/profile.js
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db, auth } from './firebase-config.js'; // Importa le istanze condivise
import { signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'; // Import per il WEB
import { showToast } from './toastNotifications.js';

/**
 * Recupera i dati del profilo da Firestore e popola la modale.
 * @param {object} user L'oggetto utente fornito da Firebase Auth.
 */
export async function openProfileModal(user) {
    if (!user) return;
    const profileModal = document.getElementById('profileModal');
    if (!profileModal) return;

    try {
        const userRef = doc(db, "appUsers", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const data = userDoc.data();
            document.getElementById('profile-modal-avatar').src = data.photoURL || '';
            document.getElementById('profile-modal-name').textContent = data.displayName || 'Utente';
            document.getElementById('profile-modal-email').textContent = data.email || '';
            document.getElementById('profile-modal-total-score').textContent = data.gameStats?.totalScore || 0;
            document.getElementById('profile-modal-games-played').textContent = data.gameStats?.gamesPlayed || 0;
        }
        
        profileModal.style.display = 'flex';

    } catch (error) {
        console.error("Errore nell'aprire la modale del profilo:", error);
        showToast("Impossibile caricare il profilo.", 'error');
    }
}

/**
 * Inizializza i controlli della modale del profilo (chiusura, logout).
 */
export function initProfileControls() {
    const profileModal = document.getElementById('profileModal');
    const closeProfileModal = document.getElementById('closeProfileModal');
    const logoutBtn = document.getElementById('logout-btn');

    if (closeProfileModal) {
        closeProfileModal.addEventListener('click', () => {
            if(profileModal) profileModal.style.display = 'none';
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                // Logica di logout intelligente
                if (window.Capacitor && Capacitor.isNativePlatform()) {
                    const { FirebaseAuthentication } = Capacitor.Plugins;
                    await FirebaseAuthentication.signOut();
                } else {
                    await signOut(auth); // Metodo web
                }

                if(profileModal) profileModal.style.display = 'none';
                showToast("Logout effettuato con successo.", 'success');
            } catch (error) {
                console.error("Errore durante il logout:", error);
            }
        });
    }
}