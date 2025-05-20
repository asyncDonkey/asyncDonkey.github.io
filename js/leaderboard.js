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
    documentId,
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
    const originalRefreshBtnText = refreshLeaderboardBtn.innerHTML;
    refreshLeaderboardBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Caricamento...';

    const leaderboardScoresCollection = collection(db, 'leaderboardScores');
    let q;
    let isFetchingFirstPageQuery = false;

    try {
        // --- Logica query per paginazione 'initial', 'next', 'prev' (come nel tuo file, con piccole correzioni alla logica 'prev') ---
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
        } else if (direction === 'prev') {
            if (currentPage <= 1) {
                loadGlobalLeaderboard('initial');
                return;
            } // currentPage è già decrementato
            isFetchingFirstPageQuery = currentPage === 1; // Sarà la prima pagina solo se currentPage è 1

            if (isFetchingFirstPageQuery) {
                q = query(
                    leaderboardScoresCollection,
                    where('gameId', '==', 'donkeyRunner'),
                    orderBy('score', 'desc'),
                    orderBy('timestamp', 'asc'),
                    limit(SCORES_PER_PAGE)
                );
            } else if (firstDocsHistory[currentPage - 2]) {
                // Usa il primo doc della pagina precedente come cursore 'startAfter'
                // firstDocsHistory[currentPage-1] è il primo della pag. corrente
                // firstDocsHistory[currentPage-2] è il primo della pag. precedente
                q = query(
                    leaderboardScoresCollection,
                    where('gameId', '==', 'donkeyRunner'),
                    orderBy('score', 'desc'),
                    orderBy('timestamp', 'asc'),
                    startAfter(firstDocsHistory[currentPage - 2]),
                    limit(SCORES_PER_PAGE)
                );
            } else {
                console.warn("History non sufficiente per 'prev', ricarico 'initial'");
                loadGlobalLeaderboard('initial');
                return;
            }
        } else {
            console.warn("Stato paginazione non valido. Ritorno a 'initial'.");
            loadGlobalLeaderboard('initial');
            return;
        }

        const querySnapshot = await getDocs(q);
        const scoreDocs = querySnapshot.docs;
        let enrichedScores = [];

        if (scoreDocs.length > 0) {
            // --- OTTIMIZZAZIONE: Recupero profili utente con query 'in' ---
            const userIdsToFetch = [...new Set(scoreDocs.map((sDoc) => sDoc.data().userId).filter((id) => id))]; // Array di userId unici e validi
            const profilesMap = new Map();

            if (userIdsToFetch.length > 0) {
                const MAX_IDS_PER_IN_QUERY = 30; // Limite di Firestore per operatore 'in'
                const profilePromises = [];

                for (let i = 0; i < userIdsToFetch.length; i += MAX_IDS_PER_IN_QUERY) {
                    const batchUserIds = userIdsToFetch.slice(i, i + MAX_IDS_PER_IN_QUERY);
                    const profilesQuery = query(
                        collection(db, 'userProfiles'),
                        where(documentId(), 'in', batchUserIds)
                    );
                    profilePromises.push(getDocs(profilesQuery));
                }

                try {
                    const snapshotsArray = await Promise.all(profilePromises);
                    snapshotsArray.forEach((snapshot) => {
                        snapshot.forEach((docSnap) => {
                            profilesMap.set(docSnap.id, docSnap.data());
                        });
                    });
                } catch (profileError) {
                    console.error('Errore durante il recupero batch dei profili utente:', profileError);
                    // Potresti voler gestire questo errore in modo più granulare, es. mostrando placeholder
                }
            }
            // --- FINE OTTIMIZZAZIONE ---

            // Arricchisci i punteggi con i dati del profilo utente dalla profilesMap
            for (const scoreDoc of scoreDocs) {
                const scoreData = scoreDoc.data();
                const userProfile = scoreData.userId ? profilesMap.get(scoreData.userId) : null;

                let profileDisplayName = scoreData.userName || scoreData.initials || 'Giocatore Anonimo';
                let profileAvatarUrl = null;
                let userProfileUpdatedAt = null;
                let nationalityCode = scoreData.nationalityCode || null; // Prendi da scoreData se disponibile

                if (userProfile) {
                    profileDisplayName = userProfile.nickname || userProfile.displayName || profileDisplayName;
                    if (userProfile.avatarUrls && userProfile.avatarUrls.url_48x48) {
                        profileAvatarUrl = userProfile.avatarUrls.url_48x48;
                    } else if (userProfile.avatarUrls && userProfile.avatarUrls.small) {
                        profileAvatarUrl = userProfile.avatarUrls.small;
                    } else if (userProfile.photoURL) {
                        profileAvatarUrl = userProfile.photoURL;
                    }
                    userProfileUpdatedAt = userProfile.profileUpdatedAt || null;
                    nationalityCode = userProfile.nationalityCode || nationalityCode; // Sovrascrivi con quello del profilo se presente
                }

                enrichedScores.push({
                    id: scoreDoc.id,
                    ...scoreData,
                    firestoreDoc: scoreDoc, // Manteniamo il doc per i cursori
                    profileDisplayName,
                    profileAvatarUrl,
                    userProfileUpdatedAt,
                    nationalityCode, // Assicura che nationalityCode sia nell'oggetto enrichedScores
                });
            }
        }
        // --- Fine arricchimento punteggi ---

        // ... (resto della logica di paginazione e gestione firstVisibleDoc/lastVisibleDoc come nel tuo file) ...
        if (enrichedScores.length > 0) {
            if (direction === 'next') {
                currentPage++;
            }
            if (direction === 'prev' && !isFetchingFirstPageQuery) {
                firstDocsHistory.splice(currentPage); // currentPage è già il numero della pagina visualizzata
            }

            firstVisibleDoc = enrichedScores[0].firestoreDoc;
            lastVisibleDoc = enrichedScores[enrichedScores.length - 1].firestoreDoc;

            if (firstVisibleDoc) {
                if (firstDocsHistory.length < currentPage) {
                    firstDocsHistory.push(firstVisibleDoc);
                } else {
                    firstDocsHistory[currentPage - 1] = firstVisibleDoc;
                }
            }
        } else {
            if (direction === 'next') {
                /* No more pages */
            } else if (isFetchingFirstPageQuery || currentPage === 1) {
                currentPage = 1;
                firstDocsHistory = [];
                lastVisibleDoc = null;
            }
            firstVisibleDoc = null;
        }

        displayGlobalLeaderboard(enrichedScores, currentPage);
        updatePaginationControls(enrichedScores.length, isFetchingFirstPageQuery || currentPage === 1);
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
        updatePaginationControls(0, true);
    } finally {
        refreshLeaderboardBtn.disabled = false;
        refreshLeaderboardBtn.innerHTML = originalRefreshBtnText;
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
        const message =
            pageNumber === 1
                ? 'Nessun punteggio registrato per Donkey Runner. Sii il primo!'
                : 'Nessun altro punteggio disponibile. Sei arrivato alla fine!';
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
        avatarImg.className = 'player-avatar me-2';
        avatarImg.width = 36;
        avatarImg.height = 36;
        avatarImg.style.borderRadius = '50%';
        avatarImg.style.objectFit = 'cover';

        if (entry.profileAvatarUrl) {
            if (entry.userProfileUpdatedAt && typeof entry.userProfileUpdatedAt.seconds === 'number') {
                avatarImg.src = `${entry.profileAvatarUrl}?v=${entry.userProfileUpdatedAt.seconds}`;
            } else {
                avatarImg.src = entry.profileAvatarUrl;
            }
        } else {
            const seedForBlockie = entry.userId || entry.initials || entry.profileDisplayName || `anon-${entry.id}`;
            try {
                avatarImg.src = generateBlockieAvatar(seedForBlockie, 36, { size: 8, scale: 4.5 });
            } catch (e) {
                console.error('Errore generazione Blockie per leaderboard:', e, 'seed:', seedForBlockie);
                avatarImg.src = 'assets/images/default-avatar.png';
            }
        }
        const altText = entry.profileDisplayName || 'Avatar giocatore';
        avatarImg.alt = altText;
        avatarImg.onerror = () => {
            console.warn(`Errore caricamento avatar per ${altText} (URL: ${avatarImg.src}), uso default.`);
            avatarImg.src = 'assets/images/default-avatar.png';
            avatarImg.onerror = null;
        };
        tdPlayer.appendChild(avatarImg);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'player-name';

        // Usa entry.nationalityCode che ora è parte di enrichedScores
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
            profileLink.classList.add('text-decoration-none');
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

// --- INITIALIZATION --- (come nel tuo file, con correzioni per la logica di currentPage in prevPageBtn)
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded per leaderboard.js con paginazione.');
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            if (!nextPageBtn.disabled) loadGlobalLeaderboard('next');
        });
    } else {
        console.error('Bottone nextPageBtn non trovato!');
    }

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (!prevPageBtn.disabled) {
                if (currentPage > 1) {
                    currentPage--;
                    loadGlobalLeaderboard('prev');
                } else {
                    console.warn("PrevPageBtn cliccato su currentPage=1, ricarico 'initial'");
                    loadGlobalLeaderboard('initial');
                }
            }
        });
    } else {
        console.error('Bottone prevPageBtn non trovato!');
    }

    if (refreshLeaderboardBtn) {
        refreshLeaderboardBtn.addEventListener('click', () => {
            if (!refreshLeaderboardBtn.disabled) {
                console.log('Pulsante Aggiorna cliccato. Ricarico la prima pagina.');
                loadGlobalLeaderboard('initial');
            }
        });
    } else {
        console.error('Pulsante refreshLeaderboardBtn non trovato!');
    }
    loadGlobalLeaderboard('initial');
});
