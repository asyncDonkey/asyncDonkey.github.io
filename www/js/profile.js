import { doc, getDoc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';
import { db, auth, functions } from './firebase-config.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { showToast } from './toastNotifications.js';

// **NUOVO**: Funzione helper per calcolare i giorni rimanenti
function getCooldownInfo(lastUpdateTimestamp) {
    if (!lastUpdateTimestamp) {
        return { onCooldown: false, daysRemaining: 0 };
    }
    
    const lastUpdate = lastUpdateTimestamp.toDate();
    const now = new Date();
    const fourteenDaysInMillis = 14 * 24 * 60 * 60 * 1000;
    const timeSinceLastUpdate = now.getTime() - lastUpdate.getTime();

    if (timeSinceLastUpdate < fourteenDaysInMillis) {
        const daysRemaining = Math.ceil((fourteenDaysInMillis - timeSinceLastUpdate) / (1000 * 60 * 60 * 24));
        return { onCooldown: true, daysRemaining };
    }

    return { onCooldown: false, daysRemaining: 0 };
}

/**
 * Recupera i dati del profilo da Firestore e popola la modale.
 */
export async function openProfileModal(user) {
    if (!user) return;
    const profileModal = document.getElementById('profileModal');
    const editNicknameBtn = document.getElementById('edit-nickname-btn');
    if (!profileModal || !editNicknameBtn) return;

    try {
        const userRef = doc(db, "appUsers", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const data = userDoc.data();
            document.getElementById('profile-modal-avatar').src = data.photoURL || '';
            document.getElementById('profile-modal-name').textContent = data.nickname || data.displayName || 'Utente';
            document.getElementById('profile-modal-email').textContent = data.email || '';
            document.getElementById('profile-modal-total-score').textContent = data.gameStats?.totalScore || 0;
            document.getElementById('profile-modal-games-played').textContent = data.gameStats?.gamesPlayed || 0;

            // **NUOVA LOGICA UI PER COOLDOWN**
            const cooldown = getCooldownInfo(data.nicknameLastUpdatedAt);
            if (cooldown.onCooldown) {
                editNicknameBtn.disabled = true;
                editNicknameBtn.title = `Puoi modificare il nickname di nuovo tra ${cooldown.daysRemaining} giorni.`;
            } else {
                editNicknameBtn.disabled = false;
                editNicknameBtn.title = 'Modifica Nickname';
            }
        }
        
        profileModal.style.display = 'flex';

    } catch (error) {
        console.error("Errore nell'aprire la modale del profilo:", error);
        showToast("Impossibile caricare il profilo.", 'error');
    }
}

/**
 * Gestisce la logica per la modifica del nickname.
 */
async function handleNicknameEdit() {
    const currentNickname = document.getElementById('profile-modal-name').textContent;
    const newNickname = prompt("Inserisci il tuo nuovo nickname:", currentNickname);

    if (newNickname === null || newNickname.trim() === "") {
        showToast("Modifica annullata.", "info");
        return;
    }

    if (newNickname.trim() === currentNickname) {
        showToast("Il nuovo nickname è uguale al precedente.", "info");
        return;
    }
    
    const editBtn = document.getElementById('edit-nickname-btn');
    editBtn.disabled = true;

    try {
        const updateNickname = httpsCallable(functions, 'updateNickname');
        const result = await updateNickname({ nickname: newNickname.trim() });

        if (result.data.success) {
            document.getElementById('profile-modal-name').textContent = newNickname.trim();
            showToast("Nickname aggiornato con successo!", 'success');
            // Dopo una modifica riuscita, avvia il cooldown sull'UI
            editBtn.title = `Puoi modificare il nickname di nuovo tra 14 giorni.`;
        } else {
            // Questo 'else' non dovrebbe mai essere raggiunto se la funzione lancia HttpsError
            throw new Error(result.data.message || 'Si è verificato un errore sconosciuto.');
        }
    } catch (error) {
        console.error("Errore durante l'aggiornamento del nickname:", error);
        showToast(`Errore: ${error.message}`, 'error');
        // Riabilita il pulsante solo se l'errore non è un cooldown (potrebbe esserlo per tentativi rapidi)
        // Per semplicità, lo riabilitiamo. La funzione openProfileModal lo disabiliterà correttamente al prossimo caricamento.
        editBtn.disabled = false; 
    }
    // Non riabilitiamo il pulsante qui, perché dopo un successo deve rimanere disabilitato per il cooldown.
}

/**
 * Inizializza i controlli della modale del profilo (chiusura, logout, modifica nickname).
 */
export function initProfileControls() {
    const profileModal = document.getElementById('profileModal');
    const closeProfileModal = document.getElementById('closeProfileModal');
    const logoutBtn = document.getElementById('logout-btn');
    const editNicknameBtn = document.getElementById('edit-nickname-btn');

    if (closeProfileModal) {
        closeProfileModal.addEventListener('click', () => {
            if(profileModal) profileModal.style.display = 'none';
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                if (window.Capacitor && Capacitor.isNativePlatform()) {
                    const { FirebaseAuthentication } = Capacitor.Plugins;
                    await FirebaseAuthentication.signOut();
                } else {
                    await signOut(auth);
                }

                if(profileModal) profileModal.style.display = 'none';
                showToast("Logout effettuato con successo.", 'success');
            } catch (error) {
                console.error("Errore durante il logout:", error);
                showToast("Errore durante il logout.", "error");
            }
        });
    }

    if (editNicknameBtn) {
        editNicknameBtn.addEventListener('click', handleNicknameEdit);
    }
}