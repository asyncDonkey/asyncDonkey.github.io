// www/js/leaderboardManager.js

// === MODIFICA CHIAVE: Allineamento alla versione 10.12.2 ===
// Aggiunto onSnapshot per gli aggiornamenti in tempo reale
import { collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// ==========================================================
import { db } from './firebase-config.js';
import { generateBlockieAvatar } from './main.js'; // Assicurati che generateBlockieAvatar sia importato da main.js

// Aggiungi questi import all'inizio del file
import { auth } from './firebase-config.js';
import { showToast } from './toastNotifications.js';

// Riferimenti agli elementi del DOM
const leaderboardModal = document.getElementById('leaderboardModal');
const closeLeaderboardModalBtn = document.getElementById('closeLeaderboardModal');
const leaderboardList = document.getElementById('leaderboard-list');
const leaderboardLoader = document.getElementById('leaderboard-loader');
const leaderboardBtn = document.getElementById('leaderboard-btn');

// Rimuovi isLeaderboardPopulated, useremo onSnapshot

let unsubscribeLeaderboard = null; // Per memorizzare la funzione di unsubscribe

async function openLeaderboard() {
    // Controlla se l'utente è loggato prima di procedere
    if (!auth.currentUser) {
        showToast("Devi effettuare il login per vedere la classifica!", "error");
        return; 
    }

    leaderboardModal.style.display = 'flex';
    leaderboardLoader.style.display = 'block';
    leaderboardList.innerHTML = ''; // Pulisci la lista ad ogni apertura

    // Disiscriviti dal listener precedente se esiste, per evitare duplicati
    if (unsubscribeLeaderboard) {
        unsubscribeLeaderboard();
        unsubscribeLeaderboard = null;
    }

    try {
        const q = query(
            collection(db, "appUsers"),
            orderBy("gameStats.highestScore", "desc"), // MODIFICA QUI: Ordina per highestScore
            limit(25)
        );

        // MODIFICA QUI: Usa onSnapshot per aggiornamenti in tempo reale
        unsubscribeLeaderboard = onSnapshot(q, (snapshot) => {
            populateLeaderboard(snapshot.docs);
            leaderboardLoader.style.display = 'none'; // Nascondi il loader una volta popolato
        }, (error) => {
            console.error("Errore nel recuperare la leaderboard in tempo reale:", error);
            leaderboardList.innerHTML = '<li><span class="player">Errore nel caricare la classifica.</span></li>';
            
            if (error.code === 'permission-denied') {
                 leaderboardList.innerHTML += '<li><span class="player" style="font-size: 0.8em; color: var(--terminal-error-bright);">(Errore: Permessi insufficienti.)</span></li>';
            } else if (error.code === 'failed-precondition') {
                 leaderboardList.innerHTML += '<li><span class="player" style="font-size: 0.8em; color: var(--terminal-error-bright);">(Causa: Indice Firestore mancante. Controlla la console per il link di creazione.)</span></li>';
                 console.error("INDICE MANCANTE: Firebase richiede un indice composito per questa query. Clicca sul link che Firebase dovrebbe aver fornito in un log di errore precedente per crearlo automaticamente nella tua console Firebase.");
            }
            leaderboardLoader.style.display = 'none'; // Nascondi il loader anche in caso di errore
        });

    } catch (error) {
        // Questo catch potrebbe non essere sempre attivato con onSnapshot, ma lo teniamo per sicurezza
        console.error("Errore iniziale nel setup della leaderboard:", error);
        leaderboardList.innerHTML = '<li><span class="player">Errore critico nel setup della classifica.</span></li>';
        leaderboardLoader.style.display = 'none';
    }
}

function populateLeaderboard(userDocs) {
    if (userDocs.length === 0) {
        leaderboardList.innerHTML = '<li><span class="player">Nessun punteggio. Sii il primo!</span></li>';
        return;
    }

    leaderboardList.innerHTML = ''; // Pulisci prima di popolare
    userDocs.forEach((doc, index) => {
        const userData = doc.data();
        const rank = index + 1;
        
        // MODIFICA QUI: Usa photoURL e genera Blockie come fallback
        // Usa avatarSeed se disponibile, altrimenti user.uid per la generazione del Blockie
        const avatarSeed = userData.avatarSeed || doc.id; // Usa avatarSeed se esiste, altrimenti l'ID del documento
        const avatarSrc = userData.photoURL && userData.photoURL.trim() !== '' 
            ? userData.photoURL 
            : generateBlockieAvatar(avatarSeed, 32); // Dimensioni adatte per la leaderboard
        
        const nickname = userData.nickname || userData.displayName || 'Giocatore Anonimo'; // Fallback a displayName

        // Recupera le statistiche specifiche
        const highestScore = userData.gameStats?.highestScore || 0; // MODIFICA QUI: Prendi highestScore
        const gamesPlayed = userData.gameStats?.gamesPlayed || 0; // MODIFICA QUI: Aggiungi gamesPlayed
        const bossesDefeated = userData.gameStats?.bossesDefeated || 0; // MODIFICA QUI: Aggiungi bossesDefeated


        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span class="rank">${rank}.</span>
            <span class="player-info-container">
                <img src="${avatarSrc}" class="avatar" alt="Avatar di ${nickname}" onerror="this.onerror=null; this.src='${generateBlockieAvatar(avatarSeed, 32)}';">
                <span class="nickname">${nickname}</span>
            </span>
            <span class="score">${highestScore.toLocaleString('it-IT')}</span>
            <span class="details">
                Partite: ${gamesPlayed} | Boss: ${bossesDefeated}
            </span>
        `;
        leaderboardList.appendChild(listItem);
    });
}

function closeLeaderboard() {
    leaderboardModal.style.display = 'none';
    // Opzionale: Disiscriviti dal listener quando la modale è chiusa
    if (unsubscribeLeaderboard) {
        unsubscribeLeaderboard();
        unsubscribeLeaderboard = null;
        console.log("Leaderboard listener disiscritto.");
    }
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