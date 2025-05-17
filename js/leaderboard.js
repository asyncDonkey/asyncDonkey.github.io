// js/leaderboard.js

import { db, auth, generateBlockieAvatar } from './main.js';
import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    where,
    startAfter,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

console.log('leaderboard.js caricato.');

// --- DOM ELEMENT REFERENCES ---
const leaderboardTableBody = document.getElementById('leaderboardEntries');
const globalLeaderboardContainer = document.getElementById('globalLeaderboardContainer');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const currentPageIndicator = document.getElementById('currentPageIndicator');

// --- PAGINATION STATE & CONSTANTS ---
const SCORES_PER_PAGE = 25;
let currentPage = 1;
let lastVisibleDoc = null; // Cursore Firestore per la pagina successiva (basato sull'ultimo doc della pagina corrente)
let firstVisibleDoc = null; // Primo documento Firestore della pagina corrente (per la history)
let firstDocsHistory = []; // Array per memorizzare i primi documenti delle pagine visitate
// firstDocsHistory[0] = primo doc della pagina 1
// firstDocsHistory[1] = primo doc della pagina 2, etc.

/** Formatta Firestore Timestamp */
function formatGlobalScoreTimestamp(firebaseTimestamp) {
    if (!firebaseTimestamp || typeof firebaseTimestamp.toDate !== 'function') {
        return 'N/A';
    }
    try {
        return firebaseTimestamp.toDate().toLocaleString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (e) {
        console.error('Errore formattazione timestamp:', e);
        return 'Data errata';
    }
}

/**
 * Carica e visualizza una pagina della leaderboard globale.
 * @param {('initial'|'next'|'prev')} direction - Direzione della paginazione.
 */
async function loadGlobalLeaderboard(direction = 'initial') {
    if (!leaderboardTableBody || !prevPageBtn || !nextPageBtn || !currentPageIndicator) {
        console.error('Elementi DOM per la leaderboard o paginazione mancanti.');
        if (globalLeaderboardContainer)
            globalLeaderboardContainer.innerHTML =
                '<p class="no-scores">Errore: Struttura pagina classifica non caricata.</p>';
        return;
    }
    if (!db) {
        console.error('Istanza DB non disponibile.');
        leaderboardTableBody.innerHTML = `<tr class="no-scores"><td colspan="4">Errore connessione DB.</td></tr>`;
        return;
    }

    leaderboardTableBody.innerHTML = `<tr class="loading-leaderboard"><td colspan="4">Caricamento classifica...</td></tr>`;
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;

    const leaderboardScoresCollection = collection(db, 'leaderboardScores');
    let q;
    let isFetchingFirstPageQuery = false; // Flag per sapere se la query costruita è per la prima pagina

    try {
        if (direction === 'initial') {
            currentPage = 1;
            lastVisibleDoc = null;
            firstVisibleDoc = null;
            firstDocsHistory = [];
            isFetchingFirstPageQuery = true;
            q = query(
                leaderboardScoresCollection,
                where('gameId', '==', 'donkeyRunner'),
                orderBy('score', 'desc'),
                orderBy('timestamp', 'asc'),
                limit(SCORES_PER_PAGE)
            );
        } else if (direction === 'next' && lastVisibleDoc) {
            q = query(
                leaderboardScoresCollection,
                where('gameId', '==', 'donkeyRunner'),
                orderBy('score', 'desc'),
                orderBy('timestamp', 'asc'),
                startAfter(lastVisibleDoc),
                limit(SCORES_PER_PAGE)
            );
            // Non incrementare currentPage qui, fallo dopo il fetch se ci sono risultati
        } else if (direction === 'prev') {
            if (currentPage <= 1) {
                loadGlobalLeaderboard('initial');
                return; // Dovrebbe essere già gestito dal bottone disabilitato
            }

            let startAfterDocForPrev = null;
            // Se vogliamo caricare pagina N (dopo aver decrementato currentPage a N),
            // ci serve il primo doc della pagina N-1 come cursore startAfter.
            // firstDocsHistory[N-2] contiene il primo doc della pagina N-1.
            if (currentPage - 1 > 1) {
                // Se la pagina precedente NON è la prima pagina
                startAfterDocForPrev = firstDocsHistory[currentPage - 2]; // currentPage è già stato decrementato se siamo qui da un click su prev
            }

            if (startAfterDocForPrev) {
                q = query(
                    leaderboardScoresCollection,
                    where('gameId', '==', 'donkeyRunner'),
                    orderBy('score', 'desc'),
                    orderBy('timestamp', 'asc'),
                    startAfter(startAfterDocForPrev),
                    limit(SCORES_PER_PAGE)
                );
            } else {
                // Stiamo tornando alla prima pagina
                isFetchingFirstPageQuery = true;
                q = query(
                    leaderboardScoresCollection,
                    where('gameId', '==', 'donkeyRunner'),
                    orderBy('score', 'desc'),
                    orderBy('timestamp', 'asc'),
                    limit(SCORES_PER_PAGE)
                );
            }
            // Non modificare currentPage qui, lo facciamo dopo il fetch o in base ai risultati
        } else {
            console.warn("Stato paginazione non valido o cursore mancante per 'next'. Ritorno a initial.", {
                direction,
                lastVisibleDoc,
                currentPage,
            });
            loadGlobalLeaderboard('initial');
            return;
        }

        const querySnapshot = await getDocs(q);
        const fetchedScores = [];
        querySnapshot.forEach((doc) => {
            fetchedScores.push({ id: doc.id, ...doc.data(), firestoreDoc: doc });
        });

        if (fetchedScores.length > 0) {
            if (direction === 'next') {
                currentPage++;
            } else if (direction === 'prev') {
                // currentPage è stato già decrementato PRIMA della query
                // Se currentPage è diventato X, la history deve contenere fino a X-1
                firstDocsHistory.splice(currentPage - 1);
            }
            // se direction === 'initial', currentPage è già 1

            firstVisibleDoc = fetchedScores[0].firestoreDoc;
            lastVisibleDoc = fetchedScores[fetchedScores.length - 1].firestoreDoc;

            // Aggiorna la history se necessario
            // Vogliamo che firstDocsHistory[N-1] sia il primo doc della pagina N
            if (firstVisibleDoc) {
                if (firstDocsHistory.length < currentPage) {
                    // Nuova pagina visitata andando avanti
                    firstDocsHistory.push(firstVisibleDoc);
                } else if (firstDocsHistory[currentPage - 1] !== firstVisibleDoc) {
                    // Caso in cui potremmo aver ricaricato una pagina (es. tornando indietro e poi di nuovo avanti)
                    firstDocsHistory[currentPage - 1] = firstVisibleDoc;
                }
            }
        } else {
            // Nessun punteggio trovato per la query
            if (direction === 'next') {
                // Non c'erano più pagine, quindi non incrementare currentPage
                // lastVisibleDoc rimane quello dell'ultima pagina valida
            } else if (direction === 'prev') {
                // Se tornando indietro non troviamo nulla, c'è un problema o siamo andati troppo indietro.
                // Forse ricaricare la prima pagina è più sicuro.
                console.warn('Nessun score trovato andando indietro, potrebbe esserci un problema di logica/history.');
                loadGlobalLeaderboard('initial');
                return;
            }
            // Se 'initial' e non ci sono score, displayGlobalLeaderboard gestirà il messaggio.
            firstVisibleDoc = null; // Non ci sono doc in questa "pagina"
        }

        displayGlobalLeaderboard(fetchedScores, currentPage);
        updatePaginationControls(
            fetchedScores.length,
            isFetchingFirstPageQuery || (direction === 'prev' && currentPage === 1)
        );
    } catch (error) {
        console.error(`Errore durante il caricamento della leaderboard (direzione: ${direction}):`, error);
        if (globalLeaderboardContainer) {
            // Mostra messaggio di errore generico
            if (error.code === 'failed-precondition') {
                leaderboardTableBody.innerHTML = `<tr class="no-scores"><td colspan="4">Indice Firestore mancante. Controlla la console per il link per crearlo.</td></tr>`;
            } else {
                leaderboardTableBody.innerHTML = `<tr class="no-scores"><td colspan="4">Errore nel caricamento dei punteggi.</td></tr>`;
            }
        }
        currentPage = 1;
        lastVisibleDoc = null;
        firstVisibleDoc = null;
        firstDocsHistory = [];
        updatePaginationControls(0, true);
    }
}

/**
 * Popola la tabella HTML con i dati della leaderboard.
 * @param {Array} leaderboardData - Array di oggetti punteggio.
 * @param {number} pageNumber - Il numero della pagina corrente.
 */
function displayGlobalLeaderboard(leaderboardData, pageNumber) {
    if (!leaderboardTableBody) return;
    leaderboardTableBody.innerHTML = '';

    if (!leaderboardData || leaderboardData.length === 0) {
        if (pageNumber === 1) {
            leaderboardTableBody.innerHTML = `<tr class="no-scores"><td colspan="4">Nessun punteggio registrato per Donkey Runner. Sii il primo!</td></tr>`;
        } else {
            leaderboardTableBody.innerHTML = `<tr class="no-scores"><td colspan="4">Nessun altro punteggio disponibile. Sei arrivato alla fine!</td></tr>`;
        }
        return;
    }

    leaderboardData.forEach((entry, index) => {
        const tr = document.createElement('tr');
        tr.dataset.docId = entry.id;

        const rank = (pageNumber - 1) * SCORES_PER_PAGE + index + 1;
        const tdRank = document.createElement('td');
        tdRank.className = 'player-rank';
        tdRank.textContent = `${rank}`;
        tr.appendChild(tdRank);

        const tdPlayer = document.createElement('td');
        tdPlayer.className = 'player-info-cell';
        const avatarImg = document.createElement('img');
        avatarImg.className = 'player-avatar';
        const seedForBlockie = entry.userId || entry.initials || entry.userName || `anon-${entry.id}`;
        let altTextForBlockie = entry.userName || entry.initials || 'Anonimo';
        avatarImg.src = generateBlockieAvatar(seedForBlockie, 36, { size: 8 });
        avatarImg.alt = `${altTextForBlockie}'s Avatar`;
        avatarImg.style.backgroundColor = 'transparent';
        avatarImg.onerror = () => {
            avatarImg.src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' fill='%23ddd'/%3E%3Ctext x='5' y='7.5' font-size='5' text-anchor='middle' fill='%23777'%3E?%3C/text%3E%3C/svg%3E";
            avatarImg.alt = 'Error';
        };
        tdPlayer.appendChild(avatarImg);

        const nameSpan = document.createElement('span');
    nameSpan.className = 'player-name'; // Mantieni la classe per lo stile

    // Aggiungi la bandierina prima del nome/link
    if (entry.nationalityCode && entry.nationalityCode !== 'OTHER' && entry.nationalityCode.length === 2) {
        const flagIconSpan = document.createElement('span');
        flagIconSpan.classList.add('fi', `fi-${entry.nationalityCode.toLowerCase()}`);
        // Applica eventuali stili per la bandierina se necessario qui o via CSS
        flagIconSpan.style.marginRight = '8px'; // Esempio
        flagIconSpan.style.verticalAlign = 'middle';
        nameSpan.appendChild(flagIconSpan);
    }

    let displayName = entry.userName || entry.initials || 'Giocatore Anonimo';

    if (entry.userId) { // Utente Registrato
        const profileLink = document.createElement('a');
        profileLink.href = `profile.html?userId=${entry.userId}`;
        profileLink.textContent = displayName;
        // Potresti aggiungere una classe CSS specifica per i link ai profili se vuoi stili diversi
        // profileLink.classList.add('profile-link-leaderboard');
        nameSpan.appendChild(profileLink);
    } else { // Utente Ospite
        if (!entry.initials) displayName += ' (Ospite)'; // Se non ci sono initials, rendi più esplicito che è ospite
        else if (entry.initials) displayName = entry.initials + ' (Ospite)'; // Se ci sono initials, usa quelle + (Ospite)
        nameSpan.appendChild(document.createTextNode(displayName));
    }
        if (!entry.userId && !entry.initials) displayName += ' (Ospite)';
        else if (!entry.userId && entry.initials) displayName = entry.initials + ' (Ospite)';
        
        tdPlayer.appendChild(nameSpan);
        tr.appendChild(tdPlayer);

        const tdScore = document.createElement('td');
        tdScore.className = 'player-score';
        tdScore.textContent = entry.score !== undefined ? entry.score.toLocaleString() : '-';
        tr.appendChild(tdScore);

        const tdDate = document.createElement('td');
        tdDate.className = 'player-date';
        tdDate.textContent = formatGlobalScoreTimestamp(entry.timestamp);
        tr.appendChild(tdDate);

        leaderboardTableBody.appendChild(tr);
    });
}

/**
 * Aggiorna lo stato dei pulsanti di paginazione e l'indicatore di pagina.
 * @param {number} countOnCurrentPage - Numero di elementi caricati nella pagina corrente.
 * @param {boolean} isFirstPageResult - True se i dati caricati sono per la prima pagina.
 */
function updatePaginationControls(countOnCurrentPage, isFirstPageResult = false) {
    if (!prevPageBtn || !nextPageBtn || !currentPageIndicator) return;

    currentPageIndicator.textContent = `Pagina ${currentPage}`;
    prevPageBtn.disabled = isFirstPageResult || currentPage === 1; // Disabilitato se è il risultato della prima pagina o currentPage è 1
    nextPageBtn.disabled = countOnCurrentPage < SCORES_PER_PAGE;
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded per leaderboard.js con paginazione.');

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            if (!nextPageBtn.disabled) {
                // Salviamo il primo documento della pagina corrente PRIMA di caricare la successiva
                // Questa logica è ora gestita all'interno di loadGlobalLeaderboard
                loadGlobalLeaderboard('next');
            }
        });
    } else {
        console.error('Bottone nextPageBtn non trovato!');
    }

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (!prevPageBtn.disabled) {
                // La logica di decremento di currentPage e gestione history è in loadGlobalLeaderboard
                loadGlobalLeaderboard('prev');
            }
        });
    } else {
        console.error('Bottone prevPageBtn non trovato!');
    }

    loadGlobalLeaderboard('initial');
});
