// js/main.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { menuAnimation } from './menuAnimation.js';
import { launchGame, preloadGameAssets, setupGameEngine } from './donkeyRunner.js';
import * as AudioManager from './audioManager.js';
import { initLeaderboard } from './leaderboardManager.js';
// Importa solo la funzione di apertura della modale di auth da auth.js
import { showAuthModal } from './auth.js';
import { openProfileModal, initProfileControls } from './profile.js';
import { openGlitchpediaModal } from './glitchpedia.js'; // Nuovo import
import {
    getFirestore,
    // connectFirestoreEmulator, // IMPORT PER EMULATORE FIRESTORE - Commentato se non usato
    doc,
    getDoc,
    // serverTimestamp, // Non direttamente usato qui in main.js, ma ok se serve altrove
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    onSnapshot,
    documentId,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
    getAuth,
    // connectAuthEmulator, // IMPORT PER EMULATORE AUTH - Commentato se non usato
    signOut,
    onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { auth, db, functions } from './firebase-config.js'; // Importa l'istanza auth, db e functions

// IMPORT PER EMULATORE STORAGE - Rimuovi se non usato, altrimenti importa e abilita
// import { getStorage, connectStorageEmulator } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

import { createIcon } from './blockies.mjs';
import { displayArticlesSection, displayGlitchzillaBanner } from './homePageFeatures.js';
import { showToast } from './toastNotifications.js';

let loggedInUser = null; // Mantieni aggiornato lo stato dell'utente loggato
let currentUserProfileUnsubscribe = null; // Per il listener del profilo utente
let notificationListener = null; // Per tenere traccia del listener delle notifiche

// ----- INIZIO CODICE PER EMULATORI (MANTIENI O Rimuovi in base al tuo setup) -----
// Controlla se siamo in un contesto locale (es. localhost o 127.0.0.1)
// Se l'hostname è vuoto (es. apertura diretta di file:///), gli emulatori non verranno usati.
// if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
//     try {
//         console.log("[main.js] Tentativo di connessione agli emulatori Firebase...");

//         // Connetti a Firestore Emulator (porta 8080, come configurato)
//         connectFirestoreEmulator(db, 'localhost', 8080);
//         console.log("[main.js] Connesso a Firestore Emulator su localhost:8080");

//         // Connetti a Auth Emulator (porta 9099, come configurato)
//         connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true }); // disableWarnings è opzionale
//         console.log("[main.js] Connesso a Auth Emulator su http://localhost:9099");

//         // Connetti a Storage Emulator (porta 9199, default)
//         // const storage = getStorage(firebaseAppInstance); // Assicurati di avere l'istanza dell'app Firebase
//         // connectStorageEmulator(storage, "localhost", 9199);
//         // console.log("[main.js] Connesso a Storage Emulator su localhost:9199");

//         // Potresti aggiungere connectFunctionsEmulator qui se userai callable functions dal client
//         // connectFunctionsEmulator(functions, "localhost", 5001); // Porta Functions Emulator
//         // console.log("[main.js] Connesso a Functions Emulator su localhost:5001");

//         showToast("Collegato agli emulatori Firebase locali (Auth, Firestore, Storage)!", "info", 7000);
//     } catch (error) {
//         console.error("[main.js] Errore durante la connessione agli emulatori:", error);
//         showToast("Errore connessione emulatori Firebase. Vedi console.", "error", 7000);
//     }
// } else {
//     console.log("[main.js] Connesso ai servizi Firebase di produzione.");
// }
// ----- FINE CODICE PER EMULATORI -----

// Non ho trovato una definizione di `showConfirmationModal` nel tuo `main.js`
// ma l'ho lasciata qui commentata in caso la volessi definire o importare.
/*
export function showConfirmationModal(title = 'Conferma Azione', message = 'Sei sicuro di voler procedere?') {
    // ... (codice invariato, se presente altrove)
}
*/

export function generateBlockieAvatar(seed, imgSize = 40, blockieOptions = {}) {
    // ... (codice invariato)
    if (typeof createIcon !== 'function') {
        console.error('createIcon from Blockies non importata!');
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${imgSize}' height='${imgSize}' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' fill='%23ddd'/%3E%3Ctext x='5' y='7.5' font-size='5' text-anchor='middle' fill='%23777'%3E?%3C/text%3E%3C/svg%3E`;
    }
    try {
        const defaultOptions = {
            seed: String(seed).toLowerCase(),
            size: 8,
            scale: 5,
        };
        const options = { ...defaultOptions, ...blockieOptions };
        options.scale = Math.max(1, Math.round(imgSize / options.size));
        const canvasElement = createIcon(options);
        if (canvasElement && typeof canvasElement.toDataURL === 'function') {
            return canvasElement.toDataURL();
        } else {
            throw new Error('createIcon non ha restituito un canvas valido.');
        }
    } catch (e) {
        console.error('Errore generazione avatar Blockie:', e, 'Seed:', seed);
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${imgSize}' height='${imgSize}' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' fill='%23ddd'/%3E%3Ctext x='5' y='7.5' font-size='5' text-anchor='middle' fill='%23777'%3E?%3C/text%3E%3C/svg%3E`;
    }
}

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}




export { db, auth, escapeHTML };

export function getCurrentUserId() {
    return auth.currentUser ? auth.currentUser.uid : null;
}


function traduireErroreFirebase(codiceErrore) {
    const errors = {
        'auth/invalid-email': "L'indirizzo email non è valido.",
        'auth/user-disabled': 'Questo account utente è stato disabilitato.',
        'auth/user-not-found': 'Nessun utente trovato con questa email.',
        'auth/wrong-password': 'Password errata.',
        'auth/email-already-in-use': "L'indirizzo email è già utilizzato da un altro account.",
        'auth/operation-not-allowed': 'Operazione non permessa (controlla config Firebase Auth).',
        'auth/weak-password': 'La password è troppo debole (minimo 6 caratteri).',
    };
    return errors[codiceErrore] || `Errore (${codiceErrore}). Riprova.`;
}






// ---- LISTENER PRINCIPALE DELL'APPLICAZIONE ----
document.addEventListener('DOMContentLoaded', function () {
    console.log('[Main.js] DOMContentLoaded: Inizializzazione applicazione.');

    const mainMenu = document.getElementById('main-menu');

    // Inizializza le parti dell'UI che non dipendono dallo stato di login
    initLeaderboard();
    initProfileControls();

    // --- LOGICA DI TRANSIZIONE E INIZIALIZZAZIONE MENU ---
    // Poiché loader.js gestisce la visualizzazione del menu, usiamo un
    // MutationObserver per reagire a quando il menu diventa visibile.
    if (mainMenu) {
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style' && mainMenu.style.display === 'flex') {
                    console.log('Main menu visibile. Inizializzo animazione e musica.');

                    AudioManager.loadBackgroundMusic('assets/audio/music_menu.ogg')
                        .then(() => AudioManager.playMusic(true));

                    const playerSprite = new Image();
                    playerSprite.src = 'images/asyncDonkey_walk.png';
                    playerSprite.onload = () => {
                        menuAnimation.init('menuCanvas', playerSprite);
                    };
                    
                    observer.disconnect(); // Eseguito una volta, non serve più
                    break;
                }
            }
        });
        observer.observe(mainMenu, { attributes: true });
    }

    // --- LOGICA PULSANTI MENU (SINTASSI CORRETTA E SICURA) ---
    let isGameStarting = false;
    const startGameSequence = () => {
        if (isGameStarting) return;
        isGameStarting = true;

        AudioManager.playSound('gameStart');
        AudioManager.stopMusic();

        menuAnimation.startExitAnimation().then(() => {
            const gameContainerWrapper = document.getElementById('game-container-wrapper');
            if (mainMenu) mainMenu.style.display = 'none';
            if (gameContainerWrapper) gameContainerWrapper.style.display = 'block';
            launchGame();
            isGameStarting = false;
        });
    };

    // Collegamento sicuro degli event listener senza optional chaining (`?.`)
    const startGameBtn = document.getElementById('start-game-btn');
    if (startGameBtn) startGameBtn.addEventListener('click', startGameSequence);

    const leaderboardBtn = document.getElementById('leaderboard-btn');
    if (leaderboardBtn) {
        leaderboardBtn.addEventListener('click', () => {
            const leaderboardModal = document.getElementById('leaderboardModal');
            if (leaderboardModal) leaderboardModal.style.display = 'flex';
        });
    }

    const glitchpediaBtn = document.getElementById('glitchpedia-btn');
    if (glitchpediaBtn) glitchpediaBtn.addEventListener('click', openGlitchpediaModal);

    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) profileBtn.addEventListener('click', () => openProfileModal(loggedInUser));

    const showLoginModalBtn = document.getElementById('show-login-modal-btn');
    if (showLoginModalBtn) {
        showLoginModalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showAuthModal('login');
        });
    }

    const userAvatarIcon = document.getElementById('user-avatar-icon');
    if (userAvatarIcon) {
        userAvatarIcon.addEventListener('click', () => openProfileModal(loggedInUser));
    }

    // Listener per il tasto Invio per avviare il gioco dal menu
    window.addEventListener('keydown', (e) => {
        if (mainMenu && e.key === 'Enter' && mainMenu.style.display === 'flex') {
            e.preventDefault(); // Previene comportamenti di default del tasto Invio
            startGameSequence();
        }
    });

    // --- LOGICA DI AUTENTICAZIONE (onAuthStateChanged) ---
    onAuthStateChanged(auth, async (user) => {
        console.log('[Main.js] Stato autenticazione cambiato. Utente:', user ? user.uid : null);
        loggedInUser = user;

        const loginIcon = document.getElementById('show-login-modal-btn');
        const avatarIcon = document.getElementById('user-avatar-icon');

        if (user) {
            // Utente LOGGATO
            if (loginIcon) loginIcon.style.display = 'none';
            if (avatarIcon) {
                let photoURLToUse = generateBlockieAvatar(user.uid, 32);
                try {
                    const userProfileDoc = await getDoc(doc(db, 'appUsers', user.uid));
                    if (userProfileDoc.exists()) {
                        const profileData = userProfileDoc.data();
                        if (profileData.photoURL) {
                            photoURLToUse = profileData.photoURL;
                        } else if (user.photoURL) {
                            photoURLToUse = user.photoURL;
                        }
                    } else if (user.photoURL) {
                        photoURLToUse = user.photoURL;
                    }

                    if (photoURLToUse.startsWith('http')) {
                        photoURLToUse += `?v=${new Date().getTime()}`;
                    }
                    avatarIcon.src = photoURLToUse;
                    avatarIcon.style.display = 'block';
                } catch (error) {
                    console.error("Errore nel recuperare il profilo utente:", error);
                    avatarIcon.src = photoURLToUse; // Usa il blockie come fallback
                    avatarIcon.style.display = 'block';
                }
            }
        } else {
            // Utente NON LOGGATO
            if (loginIcon) loginIcon.style.display = 'block';
            if (avatarIcon) avatarIcon.style.display = 'none';
        }
    });
});