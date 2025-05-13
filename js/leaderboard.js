// js/leaderboard.js

import { db, auth, generateBlockieAvatar } from './main.js'; // auth potrebbe non servire qui direttamente ma lo teniamo per coerenza
import {
    collection, query, orderBy, limit, getDocs, where, // Aggiunto 'where'
    // doc, getDoc // Questi potrebbero non essere necessari se tutte le info sono in leaderboardScores
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("leaderboard.js caricato.");

// --- DOM ELEMENT REFERENCES ---
const leaderboardTableBody = document.getElementById('leaderboardEntries');
const globalLeaderboardContainer = document.getElementById('globalLeaderboardContainer'); // Per messaggi di errore generali

const MAX_SCORES_TO_LOAD = 50; // Numero di punteggi da caricare inizialmente

/** Formatta Firestore Timestamp per la leaderboard (simile a donkeyRunner.js) */
function formatGlobalScoreTimestamp(firebaseTimestamp) {
    if (!firebaseTimestamp || typeof firebaseTimestamp.toDate !== 'function') {
        return 'N/A';
    }
    try {
        return firebaseTimestamp.toDate().toLocaleString('it-IT', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch (e) {
        console.error("Errore formattazione timestamp:", e);
        return 'Data errata';
    }
}

/**
 * Carica e visualizza la leaderboard globale per Donkey Runner.
 */
async function loadGlobalLeaderboard() {
    if (!leaderboardTableBody) {
        console.error("Elemento leaderboardTableBody non trovato. Impossibile visualizzare la classifica.");
        if (globalLeaderboardContainer) {
            globalLeaderboardContainer.innerHTML = '<p class="no-scores">Errore: Impossibile caricare la struttura della pagina della classifica.</p>';
        }
        return;
    }
    if (!db) {
        console.error("Istanza DB non disponibile per caricare la leaderboard globale.");
        leaderboardTableBody.innerHTML = `<tr class="no-scores"><td colspan="4">Errore di connessione al database.</td></tr>`;
        return;
    }

    leaderboardTableBody.innerHTML = `<tr class="loading-leaderboard"><td colspan="4">Caricamento classifica...</td></tr>`;
    const leaderboardScoresCollection = collection(db, "leaderboardScores");

    try {
        const q = query(
            leaderboardScoresCollection,
            where("gameId", "==", "donkeyRunner"), // Filtra per il gioco specifico
            orderBy("score", "desc"),
            orderBy("timestamp", "asc"), // Chi ha fatto prima il punteggio a parità è più in alto
            limit(MAX_SCORES_TO_LOAD)
        );

        const querySnapshot = await getDocs(q);
        const fetchedLeaderboard = [];
        querySnapshot.forEach((doc) => {
            fetchedLeaderboard.push({ id: doc.id, ...doc.data() });
        });

        displayGlobalLeaderboard(fetchedLeaderboard);

    } catch (error) {
        console.error("Errore durante il caricamento della leaderboard globale:", error);
        if (error.code === 'failed-precondition') {
             leaderboardTableBody.innerHTML = `<tr class="no-scores"><td colspan="4">Indice Firestore mancante per questa query. Controlla la console (F12) per il link per crearlo.</td></tr>`;
             console.error("Potrebbe essere necessario un indice composito in Firestore. L'errore originale è:", error.message, "Controlla la console per un link per creare l'indice mancante se fornito da Firebase.");
        } else {
            leaderboardTableBody.innerHTML = `<tr class="no-scores"><td colspan="4">Errore nel caricamento dei punteggi. Riprova più tardi.</td></tr>`;
        }
    }
}

/**
 * Popola la tabella HTML con i dati della leaderboard.
 * @param {Array} leaderboardData - Array di oggetti punteggio.
 */
function displayGlobalLeaderboard(leaderboardData) {
    if (!leaderboardTableBody) return;
    leaderboardTableBody.innerHTML = ''; // Pulisci righe precedenti (caricamento o errore)

    if (!leaderboardData || leaderboardData.length === 0) {
        leaderboardTableBody.innerHTML = `<tr class="no-scores"><td colspan="4">Nessun punteggio registrato per Donkey Runner. Sii il primo!</td></tr>`;
        return;
    }

    leaderboardData.forEach((entry, index) => {
        const tr = document.createElement('tr');

        // 1. Rank
        const tdRank = document.createElement('td');
        tdRank.className = 'player-rank';
        tdRank.textContent = `${index + 1}`;
        tr.appendChild(tdRank);

        // 2. Giocatore (Avatar + Nome + Bandiera)
        const tdPlayer = document.createElement('td');
        tdPlayer.className = 'player-info-cell';

        const avatarImg = document.createElement('img');
        avatarImg.className = 'player-avatar';
        const seedForBlockie = entry.userId || entry.initials || entry.userName || `anon-${entry.id}`;
        let altTextForBlockie = entry.userName || entry.initials || 'Anonimo';
        avatarImg.src = generateBlockieAvatar(seedForBlockie, 36, { size: 8 }); // Usa la funzione globale
        avatarImg.alt = `${altTextForBlockie}'s Avatar`;
        avatarImg.style.backgroundColor = 'transparent';
        avatarImg.onerror = () => {
            avatarImg.style.backgroundColor = '#ddd'; avatarImg.alt = 'Avatar Error';
            avatarImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' fill='%23ddd'/%3E%3Ctext x='5' y='7.5' font-size='5' text-anchor='middle' fill='%23777'%3E?%3C/text%3E%3C/svg%3E";
        };
        tdPlayer.appendChild(avatarImg);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'player-name';

        // Bandiera
        if (entry.nationalityCode && entry.nationalityCode !== "OTHER" && entry.nationalityCode.length === 2) {
            const flagIconSpan = document.createElement('span');
            const countryCodeForLibrary = entry.nationalityCode.toLowerCase();
            flagIconSpan.classList.add('fi', `fi-${countryCodeForLibrary}`);
            // Stili per la bandiera (es. margine) possono essere nel CSS globale o qui
            // flagIconSpan.style.marginRight = '8px';
            // flagIconSpan.style.fontSize = '1.2em'; // Adatta se necessario
            nameSpan.appendChild(flagIconSpan);
        }

        let displayName = entry.userName || entry.initials || 'Giocatore Anonimo';
        if (!entry.userId && !entry.initials) {
             displayName += " (Ospite)";
        } else if (!entry.userId && entry.initials) {
             displayName = entry.initials + " (Ospite)";
        }
        nameSpan.appendChild(document.createTextNode(displayName));
        tdPlayer.appendChild(nameSpan);
        tr.appendChild(tdPlayer);

        // 3. Punteggio
        const tdScore = document.createElement('td');
        tdScore.className = 'player-score';
        tdScore.textContent = entry.score !== undefined ? entry.score.toLocaleString() : '-'; // Formatta punteggio con separatore migliaia
        tr.appendChild(tdScore);

        // 4. Data
        const tdDate = document.createElement('td');
        tdDate.className = 'player-date';
        tdDate.textContent = formatGlobalScoreTimestamp(entry.timestamp);
        tr.appendChild(tdDate);

        leaderboardTableBody.appendChild(tr);
    });
}


// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded per leaderboard.js");
    loadGlobalLeaderboard();
});