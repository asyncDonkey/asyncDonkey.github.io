// www/js/leaderboardManager.js

// === MODIFICA CHIAVE: Allineamento alla versione 10.12.2 ===
import { collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// ==========================================================
import { db } from './firebase-config.js';
import { createIcon } from './blockies.mjs';

// Aggiungi questi import all'inizio del file
import { auth } from './firebase-config.js';
import { showToast } from './toastNotifications.js';

// Riferimenti agli elementi del DOM
const leaderboardModal = document.getElementById('leaderboardModal');
const closeLeaderboardModalBtn = document.getElementById('closeLeaderboardModal');
const leaderboardList = document.getElementById('leaderboard-list');
const leaderboardLoader = document.getElementById('leaderboard-loader');
const leaderboardBtn = document.getElementById('leaderboard-btn');

let isLeaderboardPopulated = false;

// Funzione helper per generare avatar di fallback
function generateBlockieAvatar(seed, imgSize = 40) {
    try {
        const canvasElement = createIcon({
            seed: String(seed).toLowerCase(),
            size: 8,
            scale: Math.max(1, Math.round(imgSize / 8)),
        });
        return canvasElement.toDataURL();
    } catch (e) {
        console.error('Errore generazione avatar Blockie:', e);
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${imgSize}' height='${imgSize}' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' fill='%23ddd'/%3E%3C/svg%3E`;
    }
}

async function openLeaderboard() {
    // --- INIZIO MODIFICA ---
    // Controlla se l'utente è loggato prima di procedere
    if (!auth.currentUser) {
        showToast("Devi effettuare il login per vedere la classifica!", "error");
        // Opzionale: apri direttamente la modale di login
        // const loginModal = document.getElementById('loginModal');
        // if (loginModal) loginModal.style.display = 'flex';
        return; // Interrompe l'esecuzione della funzione
    }
    // --- FINE MODIFICA ---

    leaderboardModal.style.display = 'flex';
    if (isLeaderboardPopulated) return;

    leaderboardLoader.style.display = 'block';
    leaderboardList.innerHTML = '';

    try {
        const q = query(
            collection(db, "appUsers"),
            orderBy("gameStats.totalScore", "desc"),
            limit(25)
        );
        const querySnapshot = await getDocs(q);
        populateLeaderboard(querySnapshot.docs);
        isLeaderboardPopulated = true;
    } catch (error) {
        console.error("Errore nel recuperare la leaderboard:", error);
        leaderboardList.innerHTML = '<li><span class="player">Errore nel caricare la classifica.</span></li>';
        
        // --- INIZIO MODIFICA CONSIGLIATA ---
        // Aggiungi un controllo specifico per il permesso negato per dare un feedback più chiaro
        if (error.code === 'permission-denied') {
             leaderboardList.innerHTML += '<li><span class="player" style="font-size: 0.8em; color: var(--terminal-error-bright);">(Errore: Permessi insufficienti.)</span></li>';
        } 
        // --- FINE MODIFICA CONSIGLIATA ---

        else if (error.code === 'failed-precondition') {
             leaderboardList.innerHTML += '<li><span class="player" style="font-size: 0.8em; color: var(--terminal-error-bright);">(Causa: Indice Firestore mancante. Controlla la console per il link di creazione.)</span></li>';
             console.error("INDICE MANCANTE: Firebase richiede un indice composito per questa query. Clicca sul link che Firebase dovrebbe aver fornito in un log di errore precedente per crearlo automaticamente nella tua console Firebase.");
        }
    } finally {
        leaderboardLoader.style.display = 'none';
    }
}


function populateLeaderboard(userDocs) {
    if (userDocs.length === 0) {
        leaderboardList.innerHTML = '<li><span class="player">Nessun punteggio. Sii il primo!</span></li>';
        return;
    }

    userDocs.forEach((doc, index) => {
        const userData = doc.data();
        const rank = index + 1;
        
        const avatarSrc = userData.avatarUrl || generateBlockieAvatar(doc.id, 32);
        const nickname = userData.nickname || 'Giocatore Anonimo';
        const score = userData.gameStats?.totalScore || 0;

        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span class="rank">${rank}</span>
            <span class="player">
                <img src="${avatarSrc}" class="avatar" alt="Avatar di ${nickname}">
                <span>${nickname}</span>
            </span>
            <span class="score">${score.toLocaleString('it-IT')}</span>
        `;
        leaderboardList.appendChild(listItem);
    });
}

function closeLeaderboard() {
    leaderboardModal.style.display = 'none';
}

export function initLeaderboard() {
    if (leaderboardBtn) {
        leaderboardBtn.addEventListener('click', openLeaderboard);
    }
    if (closeLeaderboardModalBtn) {
        closeLeaderboardModalBtn.addEventListener('click', closeLeaderboard);
    }
    window.addEventListener('click', (event) => {
        if (event.target === leaderboardModal) {
            closeLeaderboard();
        }
    });
}