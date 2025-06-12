import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';
import { db, auth, functions, storage } from './firebase-config.js'; // Aggiunto 'storage'
import { signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { showToast } from './toastNotifications.js';

// Import Capacitor Camera plugin
const { Camera, CameraResultType, CameraSource } = Capacitor.Plugins;

// Funzione helper per calcolare i giorni rimanenti per il cooldown del nickname
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
            const gameStats = data.gameStats || {};
            document.getElementById('profile-modal-avatar').src = data.photoURL || 'data:,';
            document.getElementById('profile-modal-name').textContent = data.nickname || data.displayName || 'Utente';
            document.getElementById('profile-modal-email').textContent = data.email || '';
            document.getElementById('profile-modal-highest-score').textContent = gameStats.highestScore || 0;
            document.getElementById('profile-modal-total-score').textContent = gameStats.totalScore || 0;
            document.getElementById('profile-modal-games-played').textContent = gameStats.gamesPlayed || 0;
            document.getElementById('profile-modal-bosses-defeated').textContent = gameStats.bossesDefeated || 0;
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
            editBtn.title = `Puoi modificare il nickname di nuovo tra 14 giorni.`;
        } else {
            throw new Error(result.data.message || 'Si è verificato un errore sconosciuto.');
        }
    } catch (error) {
        console.error("Errore durante l'aggiornamento del nickname:", error);
        showToast(`Errore: ${error.message}`, 'error');
        editBtn.disabled = false; 
    }
}

/**
 * NUOVO: Gestisce la logica per la modifica dell'avatar.
 */
async function handleAvatarEdit() {
    if (!auth.currentUser) return;

    try {
        // 1. Usa il plugin Camera per ottenere una foto
        const image = await Camera.getPhoto({
            quality: 90,
            allowEditing: true,
            resultType: CameraResultType.Uri, // Otteniamo l'URI per convertirlo in Blob
            source: CameraSource.Photos // Apri la galleria
        });

        const user = auth.currentUser;
        const editAvatarBtn = document.getElementById('edit-avatar-btn');
        editAvatarBtn.disabled = true;
        showToast('Caricamento immagine...', 'info');

        // 2. Converti l'immagine da URI a Blob
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        
        // 3. Carica il file su Firebase Storage
        const filePath = `profile-images/${user.uid}/avatar_original.png`;
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, blob);

        // 4. Attendi che l'estensione Resize Images faccia il suo lavoro
        // Diamo qualche secondo all'estensione per creare la thumbnail.
        // In un'app di produzione, si userebbe una Cloud Function per notificare il completamento.
        // Per ora, un timeout è una soluzione semplice ed efficace.
        showToast('Elaborazione immagine...', 'info');
        await new Promise(resolve => setTimeout(resolve, 5000)); 

        // 5. Ottieni l'URL della nuova immagine ridimensionata
        const resizedImagePath = `profile-images/${user.uid}/avatar_original_200x200.png`;
        const resizedImageRef = ref(storage, resizedImagePath);
        const downloadURL = await getDownloadURL(resizedImageRef);

        // 6. Aggiorna il documento utente su Firestore
        const userDocRef = doc(db, 'appUsers', user.uid);
        await updateDoc(userDocRef, {
            photoURL: downloadURL
        });

        // 7. Aggiorna l'UI
        document.getElementById('profile-modal-avatar').src = downloadURL;
        const userAvatarIcon = document.getElementById('user-avatar-icon');
        if (userAvatarIcon) {
            userAvatarIcon.src = downloadURL;
        }

        showToast('Immagine del profilo aggiornata!', 'success');
        editAvatarBtn.disabled = false;

    } catch (error) {
        if (error.message.includes('User cancelled photos app')) {
            showToast('Selezione annullata.', 'info');
        } else {
            console.error("Errore durante la modifica dell'avatar:", error);
            showToast('Errore durante il caricamento. Riprova.', 'error');
        }
        document.getElementById('edit-avatar-btn').disabled = false;
    }
}


/**
 * Inizializza i controlli della modale del profilo.
 */
export function initProfileControls() {
    const profileModal = document.getElementById('profileModal');
    const closeProfileModal = document.getElementById('closeProfileModal');
    const logoutBtn = document.getElementById('logout-btn');
    const editNicknameBtn = document.getElementById('edit-nickname-btn');
    const editAvatarBtn = document.getElementById('edit-avatar-btn'); // NUOVO

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

    // NUOVO: Aggiungi l'event listener per il pulsante di modifica avatar
    if (editAvatarBtn) {
        editAvatarBtn.addEventListener('click', handleAvatarEdit);
    }
}