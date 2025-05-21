// js/leaderboard.js
import { db, generateBlockieAvatar } from './main.js';
import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    doc,
    getDoc,
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
const refreshLeaderboardBtn = document.getElementById('refreshLeaderboardBtn');

// --- PAGINATION STATE & CONSTANTS ---
const SCORES_PER_PAGE = 25;
let currentPage = 1;
let lastVisibleDoc = null;
let firstVisibleDoc = null;
let firstDocsHistory = [];
const DEFAULT_AVATAR_LEADERBOARD_PATH = 'assets/images/default-avatar.png';

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
            }
            isFetchingFirstPageQuery = currentPage === 1;

            if (isFetchingFirstPageQuery) {
                q = query(
                    leaderboardScoresCollection,
                    where('gameId', '==', 'donkeyRunner'),
                    orderBy('score', 'desc'),
                    orderBy('timestamp', 'asc'),
                    limit(SCORES_PER_PAGE)
                );
            } else if (firstDocsHistory[currentPage - 2]) {
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
            const userIdsToFetch = [...new Set(scoreDocs.map((sDoc) => sDoc.data().userId).filter((id) => id))];
            const publicProfilesMap = new Map(); // Dati letti da userPublicProfiles

            if (userIdsToFetch.length > 0) {
                const MAX_IDS_PER_IN_QUERY = 30;
                const profilePromises = [];

                for (let i = 0; i < userIdsToFetch.length; i += MAX_IDS_PER_IN_QUERY) {
                    const batchUserIds = userIdsToFetch.slice(i, i + MAX_IDS_PER_IN_QUERY);
                    // *** MODIFICA CHIAVE: Query su userPublicProfiles ***
                    const profilesQuery = query(
                        collection(db, 'userPublicProfiles'), // <-- Query su userPublicProfiles
                        where(documentId(), 'in', batchUserIds)
                    );
                    profilePromises.push(getDocs(profilesQuery));
                }

                try {
                    const snapshotsArray = await Promise.all(profilePromises);
                    snapshotsArray.forEach((snapshot) => {
                        snapshot.forEach((docSnap) => {
                            publicProfilesMap.set(docSnap.id, docSnap.data());
                        });
                    });
                } catch (profileError) {
                    console.error('Errore durante il recupero batch dei profili pubblici:', profileError);
                }
            }

            for (const scoreDoc of scoreDocs) {
                const scoreData = scoreDoc.data();
                const userPublicProfile = scoreData.userId ? publicProfilesMap.get(scoreData.userId) : null;

                let profileDisplayName = scoreData.userName || scoreData.initials || 'Giocatore Anonimo';
                let profileAvatarUrl = null;
                // *** MODIFICA CHIAVE: Usa il timestamp dal profilo pubblico per cache busting ***
                let userProfilePublicUpdatedAt = null;
                let nationalityCode = scoreData.nationalityCode || null;

                if (userPublicProfile) {
                    profileDisplayName = userPublicProfile.nickname || profileDisplayName;
                    // *** MODIFICA CHIAVE: Usa avatarUrls.thumbnail dal profilo pubblico ***
                    if (userPublicProfile.avatarUrls && userPublicProfile.avatarUrls.thumbnail) {
                        profileAvatarUrl = userPublicProfile.avatarUrls.thumbnail;
                    }
                    userProfilePublicUpdatedAt = userPublicProfile.profilePublicUpdatedAt || null;
                    nationalityCode = userPublicProfile.nationalityCode || nationalityCode;
                }

                enrichedScores.push({
                    id: scoreDoc.id,
                    ...scoreData,
                    firestoreDoc: scoreDoc,
                    profileDisplayName,
                    profileAvatarUrl,
                    userProfilePublicUpdatedAt, // Timestamp pubblico per cache busting
                    nationalityCode,
                });
            }
        }

        if (enrichedScores.length > 0) {
            if (direction === 'next') {
                currentPage++;
            }
            if (direction === 'prev' && !isFetchingFirstPageQuery) {
                firstDocsHistory.splice(currentPage);
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

        // *** MODIFICA CHIAVE: Usa profileAvatarUrl e userProfilePublicUpdatedAt ***
        if (entry.profileAvatarUrl) {
            let avatarUrlToSet = entry.profileAvatarUrl;
            if (entry.userProfilePublicUpdatedAt && typeof entry.userProfilePublicUpdatedAt.seconds === 'number') {
                avatarUrlToSet = `${entry.profileAvatarUrl}?v=${entry.userProfilePublicUpdatedAt.seconds}`;
            } else if (entry.userProfilePublicUpdatedAt instanceof Date) {
                // Fallback se è già un oggetto Date JS
                avatarUrlToSet = `${entry.profileAvatarUrl}?v=${entry.userProfilePublicUpdatedAt.getTime()}`;
            }
            avatarImg.src = avatarUrlToSet;
        } else {
            const seedForBlockie = entry.userId || entry.initials || entry.profileDisplayName || `anon-${entry.id}`;
            try {
                avatarImg.src = generateBlockieAvatar(seedForBlockie, 36, { size: 8, scale: 4.5 });
            } catch (e) {
                console.error('Errore generazione Blockie per leaderboard:', e, 'seed:', seedForBlockie);
                avatarImg.src = DEFAULT_AVATAR_LEADERBOARD_PATH;
            }
        }
        const altText = entry.profileDisplayName || 'Avatar giocatore';
        avatarImg.alt = altText;
        avatarImg.onerror = () => {
            console.warn(`Errore caricamento avatar per ${altText} (URL: ${avatarImg.src}), uso default.`);
            avatarImg.src = DEFAULT_AVATAR_LEADERBOARD_PATH;
            avatarImg.onerror = null;
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

function updatePaginationControls(countOnCurrentPage, isFirstPageResult = false) {
    if (!prevPageBtn || !nextPageBtn || !currentPageIndicator) return;
    currentPageIndicator.textContent = `Pagina ${currentPage}`;
    prevPageBtn.disabled = isFirstPageResult || currentPage === 1;
    nextPageBtn.disabled = countOnCurrentPage < SCORES_PER_PAGE;
}

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
