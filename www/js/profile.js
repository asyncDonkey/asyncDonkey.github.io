import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';
import { db, auth, functions, storage } from './firebase-config.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { showToast } from './toastNotifications.js';
import { generateBlockieAvatar } from './main.js';

const Camera = Capacitor.Plugins.Camera;
const CameraResultType = Capacitor.CameraResultType;
const CameraSource = Capacitor.CameraSource;

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
    const editAvatarBtn = document.getElementById('edit-avatar-btn');
    const saveGeneratedAvatarBtn = document.getElementById('save-generated-avatar-btn');
    const generateAvatarBtn = document.getElementById('generate-avatar-btn'); // Riferimento al pulsante genera

    if (!profileModal || !editNicknameBtn || !editAvatarBtn || !saveGeneratedAvatarBtn || !generateAvatarBtn) {
        console.warn('Elementi della modale profilo non trovati nel DOM.');
        return;
    }

    try {
        const userRef = doc(db, 'appUsers', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const data = userDoc.data();
            const gameStats = data.gameStats || {};

            const avatarSeed = data.avatarSeed || user.uid;
            const avatarSrc =
                data.photoURL && data.photoURL.trim() !== '' ? data.photoURL : generateBlockieAvatar(avatarSeed, 80);

            document.getElementById('profile-modal-avatar').src = avatarSrc;
            document.getElementById('profile-modal-name').textContent = data.nickname || data.displayName || 'Utente';
            document.getElementById('profile-modal-email').textContent = data.email || '';
            document.getElementById('profile-modal-highest-score').textContent = gameStats.highestScore || 0;
            document.getElementById('profile-modal-total-score').textContent = gameStats.totalScore || 0;
            document.getElementById('profile-modal-games-played').textContent = gameStats.gamesPlayed || 0;

            // MODIFICA QUI: Aggiungi il cursore lampeggiante ai boss sconfitti
            document.getElementById('profile-modal-bosses-defeated').innerHTML =
                `${gameStats.bossesDefeated || 0}<span class="blinking-cursor">_</span>`;

            const cooldown = getCooldownInfo(data.nicknameLastUpdatedAt);
            if (cooldown.onCooldown) {
                editNicknameBtn.disabled = true;
                editNicknameBtn.title = `Puoi modificare il nickname di nuovo tra ${cooldown.daysRemaining} giorni.`;
            } else {
                editNicknameBtn.disabled = false;
                editNicknameBtn.title = 'Modifica Nickname';
            }

            // Nascondi il pulsante Salva all'apertura se non c'è un avatar generato in attesa di salvataggio
            saveGeneratedAvatarBtn.style.display = 'none';
        }
        profileModal.style.display = 'flex';
    } catch (error) {
        console.error("Errore nell'aprire la modale del profilo:", error);
        showToast('Impossibile caricare il profilo.', 'error');
    }
}

/**
 * Gestisce la logica per la modifica del nickname utilizzando una modale.
 */
async function handleNicknameEdit() {
    const user = auth.currentUser;
    if (!user) {
        showToast('Devi essere loggato per modificare il nickname.', 'error');
        return;
    }

    const editNicknameModal = document.getElementById('editNicknameModal');
    const newNicknameInput = document.getElementById('newNicknameInput');
    const nicknameCooldownMessage = document.getElementById('nicknameCooldownMessage');
    const saveNewNicknameBtn = document.getElementById('saveNewNicknameBtn');
    const closeEditNicknameModal = document.getElementById('closeEditNicknameModal');
    const profileModalName = document.getElementById('profile-modal-name');

    if (
        !editNicknameModal ||
        !newNicknameInput ||
        !nicknameCooldownMessage ||
        !saveNewNicknameBtn ||
        !closeEditNicknameModal ||
        !profileModalName
    ) {
        console.error('Elementi della modale di modifica nickname non trovati.');
        showToast('Errore UI: Impossibile aprire la modale modifica nickname.', 'error');
        return;
    }

    // Carica il nickname attuale e lo stato del cooldown
    try {
        const userRef = doc(db, 'appUsers', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const data = userDoc.data();
            const currentNickname = data.nickname || data.displayName || '';
            newNicknameInput.value = currentNickname;

            const cooldown = getCooldownInfo(data.nicknameLastUpdatedAt);
            if (cooldown.onCooldown) {
                nicknameCooldownMessage.textContent = `Puoi modificare il nickname di nuovo tra ${cooldown.daysRemaining} giorni.`;
                newNicknameInput.disabled = true;
                saveNewNicknameBtn.disabled = true;
                saveNewNicknameBtn.textContent = 'In cooldown';
            } else {
                nicknameCooldownMessage.textContent = 'Puoi modificare il tuo nickname in qualsiasi momento.';
                newNicknameInput.disabled = false;
                saveNewNicknameBtn.disabled = false;
                saveNewNicknameBtn.textContent = 'Salva';
            }
        }
    } catch (error) {
        console.error('Errore caricamento dati nickname per modale:', error);
        nicknameCooldownMessage.textContent = 'Errore caricamento cooldown.';
        newNicknameInput.disabled = true;
        saveNewNicknameBtn.disabled = true;
    }

    editNicknameModal.style.display = 'flex';

    // Rimuovi listener precedenti per evitare duplicati
    saveNewNicknameBtn.removeEventListener('click', saveNicknameHandler);
    closeEditNicknameModal.removeEventListener('click', closeNicknameModalHandler);

    // Aggiungi nuovi listener
    saveNewNicknameBtn.addEventListener('click', saveNicknameHandler);
    closeEditNicknameModal.addEventListener('click', closeNicknameModalHandler);

    async function saveNicknameHandler() {
        const newNickname = newNicknameInput.value.trim();
        const currentNicknameOnModal = profileModalName.textContent;

        if (newNickname === '') {
            showToast('Il nickname non può essere vuoto.', 'warning');
            return;
        }
        if (newNickname === currentNicknameOnModal) {
            showToast('Il nuovo nickname è uguale al precedente.', 'info');
            editNicknameModal.style.display = 'none';
            return;
        }

        saveNewNicknameBtn.disabled = true;
        saveNewNicknameBtn.textContent = 'Salvataggio...';

        try {
            const updateNickname = httpsCallable(functions, 'updateNickname');
            const result = await updateNickname({ nickname: newNickname });
            if (result.data.success) {
                profileModalName.textContent = newNickname;
                showToast('Nickname aggiornato con successo!', 'success');
                const updatedUserDoc = await getDoc(doc(db, 'appUsers', user.uid));
                if (updatedUserDoc.exists()) {
                    const updatedData = updatedUserDoc.data();
                    const updatedCooldown = getCooldownInfo(updatedData.nicknameLastUpdatedAt);
                    if (updatedCooldown.onCooldown) {
                        document.getElementById('edit-nickname-btn').disabled = true;
                        document.getElementById('edit-nickname-btn').title =
                            `Puoi modificare il nickname di nuovo tra ${updatedCooldown.daysRemaining} giorni.`;
                    }
                }
                editNicknameModal.style.display = 'none';
            } else {
                throw new Error(result.data.message || 'Si è verificato un errore sconosciuto.');
            }
        } catch (error) {
            console.error("Errore durante l'aggiornamento del nickname:", error);
            showToast(`Errore: ${error.message}`, 'error');
            saveNewNicknameBtn.disabled = false;
            saveNewNicknameBtn.textContent = 'Salva';
        }
    }

    function closeNicknameModalHandler() {
        editNicknameModal.style.display = 'none';
    }
}

/**
 * Gestisce la logica per la modifica dell'avatar tramite selezione da galleria.
 */
async function handleAvatarEdit() {
    if (!auth.currentUser) return;

    if (!window.Capacitor || !Capacitor.isNativePlatform() || !Capacitor.Plugins || !Capacitor.Plugins.Camera) {
        showToast("La modifica dell'avatar è disponibile solo su dispositivi mobili.", 'info');
        console.warn('Capacitor Camera plugin non disponibile o non su piattaforma nativa.');
        document.getElementById('edit-avatar-btn').disabled = false;
        return;
    }

    try {
        const image = await Camera.getPhoto({
            quality: 90,
            allowEditing: true,
            resultType: CameraResultType.Uri,
            source: CameraSource.Photos,
        });

        const user = auth.currentUser;
        const editAvatarBtn = document.getElementById('edit-avatar-btn');
        const saveGeneratedAvatarBtn = document.getElementById('save-generated-avatar-btn');
        editAvatarBtn.disabled = true;
        if (saveGeneratedAvatarBtn) saveGeneratedAvatarBtn.style.display = 'none';
        showToast('Caricamento immagine...', 'info');

        const response = await fetch(image.webPath);
        const blob = await response.blob();

        const filePath = `user-avatars/${user.uid}/avatar_original.png`;
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, blob);

        showToast('Elaborazione immagine...', 'info');
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const resizedImagePath = `user-avatars/${user.uid}/processed/avatar_profile.webp`;
        const resizedImageRef = ref(storage, resizedImagePath);
        const downloadURL = await getDownloadURL(resizedImageRef);

        const userDocRef = doc(db, 'appUsers', user.uid);
        await updateDoc(userDocRef, {
            photoURL: downloadURL,
            profileUpdatedAt: serverTimestamp(),
            avatarSeed: null,
        });

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
        document.getElementById('save-generated-avatar-btn').style.display = 'none';
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
    const editAvatarBtn = document.getElementById('edit-avatar-btn');
    const generateAvatarBtn = document.getElementById('generate-avatar-btn');
    const saveGeneratedAvatarBtn = document.getElementById('save-generated-avatar-btn');

    if (closeProfileModal) {
        closeProfileModal.addEventListener('click', () => {
            if (profileModal) profileModal.style.display = 'none';
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
                if (profileModal) profileModal.style.display = 'none';
                showToast('Logout effettuato con successo.', 'success');
            } catch (error) {
                console.error('Errore durante il logout:', error);
                showToast('Errore durante il logout.', 'error');
            }
        });
    }

    if (editNicknameBtn) {
        editNicknameBtn.addEventListener('click', handleNicknameEdit);
    }

    if (editAvatarBtn) {
        editAvatarBtn.addEventListener('click', handleAvatarEdit);
    }

    if (generateAvatarBtn) {
        generateAvatarBtn.addEventListener('click', handleGenerateRandomAvatar);
    }

    if (saveGeneratedAvatarBtn) {
        saveGeneratedAvatarBtn.addEventListener('click', handleSaveGeneratedAvatar);
    }
}

/**
 * NUOVO: Gestisce la generazione di un avatar casuale (solo UI).
 */
async function handleGenerateRandomAvatar() {
    const user = auth.currentUser;
    if (!user) {
        showToast('Devi essere loggato per generare un avatar.', 'error');
        return;
    }

    const newSeed = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const newBlockieUrl = generateBlockieAvatar(newSeed, 80);

    const profileModalAvatar = document.getElementById('profile-modal-avatar');
    const saveGeneratedAvatarBtn = document.getElementById('save-generated-avatar-btn');

    if (profileModalAvatar) {
        profileModalAvatar.src = newBlockieUrl;
    }

    // Memorizza il nuovo seed e URL in un attributo data, in attesa di salvataggio
    if (profileModalAvatar) {
        profileModalAvatar.dataset.pendingBlockieUrl = newBlockieUrl;
        profileModalAvatar.dataset.pendingAvatarSeed = newSeed;
    }

    // Mostra il pulsante "Salva Avatar"
    if (saveGeneratedAvatarBtn) {
        saveGeneratedAvatarBtn.style.display = 'inline-flex'; // Modificato a inline-flex per icon-button
        saveGeneratedAvatarBtn.disabled = false; // Assicurati che sia abilitato
        showToast('Nuovo avatar generato. Clicca "Salva" per confermare.', 'info');
    }
}

/**
 * NUOVO: Salva l'avatar Blockie generato nella UI sul database.
 */
async function handleSaveGeneratedAvatar() {
    const user = auth.currentUser;
    if (!user) {
        showToast("Devi essere loggato per salvare l'avatar.", 'error');
        return;
    }

    const profileModalAvatar = document.getElementById('profile-modal-avatar');
    const saveGeneratedAvatarBtn = document.getElementById('save-generated-avatar-btn');

    const pendingBlockieUrl = profileModalAvatar.dataset.pendingBlockieUrl;
    const pendingAvatarSeed = profileModalAvatar.dataset.pendingAvatarSeed;

    if (!pendingBlockieUrl || !pendingAvatarSeed) {
        showToast('Nessun avatar generato in attesa di salvataggio.', 'warning');
        return;
    }

    if (saveGeneratedAvatarBtn) {
        saveGeneratedAvatarBtn.disabled = true;
        saveGeneratedAvatarBtn.textContent = 'Salvataggio...'; // Testo cambiato
    }

    try {
        const userDocRef = doc(db, 'appUsers', user.uid);
        await updateDoc(userDocRef, {
            photoURL: pendingBlockieUrl,
            profileUpdatedAt: serverTimestamp(),
            avatarSeed: pendingAvatarSeed,
        });

        const userAvatarIcon = document.getElementById('user-avatar-icon');
        if (userAvatarIcon) {
            userAvatarIcon.src = pendingBlockieUrl;
        }

        showToast('Avatar Blockie salvato con successo!', 'success');

        // Pulisci i dati temporanei e nascondi il pulsante Salva
        profileModalAvatar.removeAttribute('data-pending-blockie-url');
        profileModalAvatar.removeAttribute('data-pending-avatar-seed');
        if (saveGeneratedAvatarBtn) {
            saveGeneratedAvatarBtn.style.display = 'none';
            saveGeneratedAvatarBtn.disabled = false;
            saveGeneratedAvatarBtn.innerHTML = '<i class="ph-bold ph-floppy-disk"></i>'; // Ripristina l'icona
        }
    } catch (error) {
        console.error("Errore durante il salvataggio dell'avatar Blockie:", error);
        showToast("Errore durante il salvataggio dell'avatar Blockie.", 'error');
        if (saveGeneratedAvatarBtn) {
            saveGeneratedAvatarBtn.disabled = false;
            saveGeneratedAvatarBtn.innerHTML = '<i class="ph-bold ph-floppy-disk"></i>'; // Ripristina l'icona
        }
    }
}
