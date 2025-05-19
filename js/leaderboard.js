import { db, generateBlockieAvatar } from './main.js'; // auth non sembra usato qui
import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    doc, // AGGIUNTO: per referenziare un singolo documento
    getDoc, // AGGIUNTO: per recuperare un singolo documento
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
const refreshLeaderboardBtn = document.getElementById('refreshLeaderboardBtn'); // NUOVO

// --- PAGINATION STATE & CONSTANTS ---
const SCORES_PER_PAGE = 25;
let currentPage = 1;
let lastVisibleDoc = null;
let firstVisibleDoc = null;
let firstDocsHistory = [];

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
    if (!leaderboardTableBody || !prevPageBtn || !nextPageBtn || !currentPageIndicator || !refreshLeaderboardBtn) {
        console.error('Elementi DOM per la leaderboard o paginazione/refresh mancanti.');
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

    leaderboardTableBody.innerHTML = `<tr class="loading-leaderboard"><td colspan="4" class="text-center py-3"><div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Caricamento...</span></div> Caricamento classifica...</td></tr>`;
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
    refreshLeaderboardBtn.disabled = true;
    const originalRefreshBtnText = refreshLeaderboardBtn.innerHTML; // Salva testo originale del pulsante refresh
    refreshLeaderboardBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Caricamento...';


    const leaderboardScoresCollection = collection(db, 'leaderboardScores');
    let q;
    let isFetchingFirstPageQuery = false;

    try {
        if (direction === 'initial') {
            currentPage = 1;
            lastVisibleDoc = null;
            firstVisibleDoc = null;
            firstDocsHistory = [];
            isFetchingFirstPageQuery = true;
            q = query(
                leaderboardScoresCollection,
                where('gameId', '==', 'donkeyRunner'), // Assicurati che questo sia il gameId corretto
                orderBy('score', 'desc'),
                orderBy('timestamp', 'asc'), // O 'desc' se vuoi i più recenti a parità di punteggio
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
        } else if (direction === 'prev') {
            if (currentPage <= 1) {
                loadGlobalLeaderboard('initial'); // Ricarica la prima pagina
                return;
            }
            // Per la pagina precedente, currentPage è già stato decrementato (vedi gestione bottoni)
            // Quindi firstDocsHistory[currentPage - 1] è il primo doc della pagina a cui vogliamo andare
            const startAtDocForPrevPage = firstDocsHistory[currentPage - 1]; // Primo doc della pagina target
            
            if (startAtDocForPrevPage) {
                 q = query( // Questa query deve essere 'ricostruita' per ottenere esattamente quella pagina
                    leaderboardScoresCollection,
                    where('gameId', '==', 'donkeyRunner'),
                    orderBy('score', 'desc'),
                    orderBy('timestamp', 'asc'),
                    // NOTA: startAfter non è l'ideale per "tornare a un punto esatto".
                    // Per una paginazione precisa indietro, si dovrebbe partire dall'inizio
                    // della pagina precedente. O meglio, la logica qui è per il cursore startAfter,
                    // quindi se currentPage è N, firstDocsHistory[N-1] è il primo doc della pag N.
                    // Per andare a pagina N-1, ci serve il primo doc della pagina N-1,
                    // che è firstDocsHistory[N-2] come startAfter.

                    // Se currentPage è stato decrementato a X, e vogliamo mostrare la pagina X,
                    // firstDocsHistory[X-1] è il primo documento della pagina X.
                    // Se X > 1, allora firstDocsHistory[X-2] è il primo doc della pagina X-1,
                    // e lo usiamo come cursore startAfter per ottenere la pagina X.
                    startAfter(firstDocsHistory[currentPage - 2]), // currentPage qui è la pagina target (es. 1 se vogliamo la pag 1)
                    limit(SCORES_PER_PAGE)
                );
                if (currentPage === 1) { // Se stiamo tornando alla pagina 1
                     isFetchingFirstPageQuery = true;
                     q = query(
                        leaderboardScoresCollection,
                        where('gameId', '==', 'donkeyRunner'),
                        orderBy('score', 'desc'),
                        orderBy('timestamp', 'asc'),
                        limit(SCORES_PER_PAGE)
                    );
                }

            } else { // Dovrebbe significare che stiamo tornando alla prima pagina
                 isFetchingFirstPageQuery = true;
                 q = query(
                    leaderboardScoresCollection,
                    where('gameId', '==', 'donkeyRunner'),
                    orderBy('score', 'desc'),
                    orderBy('timestamp', 'asc'),
                    limit(SCORES_PER_PAGE)
                );
            }
        } else {
            console.warn("Stato paginazione non valido. Ritorno a 'initial'.");
            loadGlobalLeaderboard('initial');
            return;
        }

        const querySnapshot = await getDocs(q);
        const scoreDocs = querySnapshot.docs;
        const enrichedScores = [];

        // Arricchisci i punteggi con i dati del profilo utente
        for (const scoreDoc of scoreDocs) {
            const scoreData = scoreDoc.data();
            let userProfileData = null;
            let profileDisplayName = scoreData.userName || scoreData.initials || 'Giocatore Anonimo'; // Default
            let profileAvatarUrl = null; // Sarà blockie o default se non trovato

            if (scoreData.userId) {
                try {
                    const userProfileRef = doc(db, 'userProfiles', scoreData.userId);
                    const userProfileSnap = await getDoc(userProfileRef);
                    if (userProfileSnap.exists()) {
                        userProfileData = userProfileSnap.data();
                        profileDisplayName = userProfileData.displayName || profileDisplayName;
                        profileAvatarUrl = userProfileData.avatarUrls?.small || userProfileData.photoURL || null;
                    } else {
                        console.warn(`Profilo utente non trovato per ID: ${scoreData.userId}`);
                    }
                } catch (profileError) {
                    console.error(`Errore nel recuperare il profilo per ${scoreData.userId}:`, profileError);
                }
            }
            // Se profileAvatarUrl è ancora null, useremo blockie/default in displayGlobalLeaderboard
            enrichedScores.push({
                id: scoreDoc.id,
                ...scoreData,
                firestoreDoc: scoreDoc, // Manteniamo il doc per i cursori
                profileDisplayName, // Nome aggiornato dal profilo
                profileAvatarUrl,   // URL avatar personalizzato (o null)
            });
        }


        if (enrichedScores.length > 0) {
            if (direction === 'next') {
                currentPage++;
            } else if (direction === 'prev' && !isFetchingFirstPageQuery) {
                // currentPage è stato già decrementato dai gestori dei bottoni
                // Rimuovi le history successive se stiamo tornando indietro e non alla prima pagina
                 firstDocsHistory.splice(currentPage); // Se currentPage è X, rimuove da indice X in poi
            }
            // se direction === 'initial', currentPage è già 1

            firstVisibleDoc = enrichedScores[0].firestoreDoc;
            lastVisibleDoc = enrichedScores[enrichedScores.length - 1].firestoreDoc;

            if (firstVisibleDoc) {
                // firstDocsHistory[N-1] deve essere il primo doc della pagina N
                if (firstDocsHistory.length < currentPage) {
                    firstDocsHistory.push(firstVisibleDoc);
                } else {
                    firstDocsHistory[currentPage - 1] = firstVisibleDoc;
                }
            }
        } else {
            if (direction === 'next') {
                // Non c'erano più pagine
            } else if (direction === 'prev' && !isFetchingFirstPageQuery) {
                console.warn('Nessun score trovato andando indietro (non prima pagina).');
                // Potrebbe essere necessario ricaricare la prima pagina qui se la logica della history è off
                // loadGlobalLeaderboard('initial'); return;
            }
             if(isFetchingFirstPageQuery && direction !== 'initial') { // Se stavamo cercando di tornare alla prima pagina e non troviamo nulla
                currentPage = 1; // Assicura che currentPage sia 1
                firstDocsHistory = [];
             }
            firstVisibleDoc = null; // Non ci sono doc in questa "pagina"
        }

        displayGlobalLeaderboard(enrichedScores, currentPage);
        updatePaginationControls(
            enrichedScores.length,
            isFetchingFirstPageQuery || currentPage === 1 // È la prima pagina se la query era per initial o se currentPage è 1
        );

    } catch (error) {
        console.error(`Errore durante il caricamento della leaderboard (direzione: ${direction}):`, error);
        if (leaderboardTableBody) {
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
        updatePaginationControls(0, true); // Resetta controlli come se fosse la prima pagina vuota
    } finally {
        refreshLeaderboardBtn.disabled = false;
        refreshLeaderboardBtn.innerHTML = originalRefreshBtnText; // Ripristina testo/icona
    }
}

/**
 * Popola la tabella HTML con i dati della leaderboard.
 * @param {Array} leaderboardData - Array di oggetti punteggio arricchiti.
 * @param {number} pageNumber - Il numero della pagina corrente.
 */
function displayGlobalLeaderboard(leaderboardData, pageNumber) {
    if (!leaderboardTableBody) return;
    leaderboardTableBody.innerHTML = '';

    if (!leaderboardData || leaderboardData.length === 0) {
        const message = (pageNumber === 1)
            ? "Nessun punteggio registrato per Donkey Runner. Sii il primo!"
            : "Nessun altro punteggio disponibile. Sei arrivato alla fine!";
        leaderboardTableBody.innerHTML = `<tr class="no-scores"><td colspan="4" class="text-center py-3">${message}</td></tr>`;
        return;
    }

    leaderboardData.forEach((entry, index) => {
        const tr = document.createElement('tr');
        tr.dataset.docId = entry.id;

        const rank = (pageNumber - 1) * SCORES_PER_PAGE + index + 1;
        const tdRank = document.createElement('td');
        tdRank.className = 'player-rank text-center align-middle';
        tdRank.textContent = `${rank}`;
        tr.appendChild(tdRank);

        const tdPlayer = document.createElement('td');
        tdPlayer.className = 'player-info-cell align-middle';

        const avatarImg = document.createElement('img');
        avatarImg.className = 'player-avatar me-2'; // Aggiunto me-2 per un po' di spazio
        avatarImg.width = 36;
        avatarImg.height = 36;
        avatarImg.style.borderRadius = '50%';
        avatarImg.style.objectFit = 'cover';

        // Utilizza l'avatar personalizzato se disponibile, altrimenti Blockie, altrimenti default
        if (entry.profileAvatarUrl) {
            avatarImg.src = entry.profileAvatarUrl;
        } else {
            // Usa il Blockie come fallback se non c'è avatar personalizzato
            const seedForBlockie = entry.userId || entry.initials || entry.profileDisplayName || `anon-${entry.id}`;
            avatarImg.src = generateBlockieAvatar(seedForBlockie, 36, { size: 8, scale: 4.5 }); // size e scale per blockies
        }
        const altText = entry.profileDisplayName || 'Avatar giocatore';
        avatarImg.alt = altText;
        avatarImg.onerror = () => { // Fallback per errore caricamento immagine
            avatarImg.src = 'assets/images/default-avatar.png'; // Assicurati che questo percorso sia corretto
            console.warn(`Errore caricamento avatar per ${altText}, uso default.`);
        };
        tdPlayer.appendChild(avatarImg);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'player-name';

        if (entry.nationalityCode && entry.nationalityCode !== 'OTHER' && entry.nationalityCode.length === 2) {
            const flagIconSpan = document.createElement('span');
            flagIconSpan.classList.add('fi', `fi-${entry.nationalityCode.toLowerCase()}`);
            flagIconSpan.style.marginRight = '8px';
            flagIconSpan.style.verticalAlign = 'middle';
            nameSpan.appendChild(flagIconSpan);
        }

        const displayNameText = entry.profileDisplayName || 'Giocatore Anonimo';
        if (entry.userId) {
            const profileLink = document.createElement('a');
            profileLink.href = `profile.html?userId=${entry.userId}`;
            profileLink.textContent = displayNameText;
            profileLink.classList.add('text-decoration-none'); // Bootstrap class
            nameSpan.appendChild(profileLink);
        } else {
            nameSpan.appendChild(document.createTextNode(displayNameText + (entry.initials ? '' : ' (Ospite)')));
        }
        tdPlayer.appendChild(nameSpan);
        tr.appendChild(tdPlayer);

        const tdScore = document.createElement('td');
        tdScore.className = 'player-score text-end align-middle';
        tdScore.textContent = entry.score !== undefined ? entry.score.toLocaleString() : '-';
        tr.appendChild(tdScore);

        const tdDate = document.createElement('td');
        tdDate.className = 'player-date text-center align-middle';
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
    prevPageBtn.disabled = isFirstPageResult || currentPage === 1;
    nextPageBtn.disabled = countOnCurrentPage < SCORES_PER_PAGE;
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded per leaderboard.js con paginazione.');

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            if (!nextPageBtn.disabled) {
                loadGlobalLeaderboard('next');
            }
        });
    } else {
        console.error('Bottone nextPageBtn non trovato!');
    }

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (!prevPageBtn.disabled && currentPage > 1) { // Aggiunto controllo currentPage > 1
                currentPage--; // Decrementa currentPage QUI, prima di chiamare loadGlobalLeaderboard
                loadGlobalLeaderboard('prev');
            } else if (currentPage === 1 && !prevPageBtn.disabled) { // Se siamo alla pagina 1 e si clicca prev (non dovrebbe essere abilitato)
                 loadGlobalLeaderboard('initial'); // Sicurezza: ricarica la prima pagina
            }
        });
    } else {
        console.error('Bottone prevPageBtn non trovato!');
    }

    // NUOVO: Event listener per il pulsante di refresh
    if (refreshLeaderboardBtn) {
        refreshLeaderboardBtn.addEventListener('click', () => {
            if(!refreshLeaderboardBtn.disabled) {
                 console.log('Pulsante Aggiorna cliccato. Ricarico la prima pagina.');
                 loadGlobalLeaderboard('initial'); // Ricarica sempre la prima pagina
            }
        });
    } else {
        console.error('Pulsante refreshLeaderboardBtn non trovato!');
    }

    loadGlobalLeaderboard('initial'); // Carica la prima pagina all'avvio
});
