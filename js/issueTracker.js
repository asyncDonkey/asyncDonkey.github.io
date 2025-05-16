// js/issueTracker.js
import { db, auth } from './main.js'; // Assicurati che main.js esporti db e auth
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    serverTimestamp,
    doc,
    updateDoc,
    getDoc,
    increment,
    arrayUnion,
    arrayRemove,
    Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// Riferimenti DOM
const issueSubmissionForm = document.getElementById('issueSubmissionForm');
const issueTitleInput = document.getElementById('issueTitle');
const issueDescriptionInput = document.getElementById('issueDescription');
const issueTypeSelect = document.getElementById('issueType');
const gameSelectionContainer = document.getElementById('gameSelectionContainer');
const issueGameIdSelect = document.getElementById('issueGameId');
const submitIssueBtn = document.getElementById('submitIssueBtn');
const issueSubmissionMessageDiv = document.getElementById('issueSubmissionMessage');

const issueAuthRequiredMessageDiv = document.getElementById('issueAuthRequiredMessage');
const loginLinkFromContributePage = document.getElementById('loginLinkFromContributePage');

const issuesDisplayArea = document.getElementById('issuesDisplayArea');
const filterIssueTypeSelect = document.getElementById('filterIssueType');
const filterIssueStatusSelect = document.getElementById('filterIssueStatus');
const applyIssueFiltersBtn = document.getElementById('applyIssueFiltersBtn');

let currentUser = null;

const ISSUES_PER_PAGE = 15; // Potremmo implementare paginazione in futuro

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatIssueTimestamp(firebaseTimestamp) {
    if (!firebaseTimestamp?.toDate) return 'Data non disponibile';
    try {
        return firebaseTimestamp.toDate().toLocaleString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (e) {
        return 'Formato data errato';
    }
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'new':
            return 'status-new';
        case 'underConsideration':
            return 'status-under-consideration';
        case 'accepted':
            return 'status-accepted';
        case 'planned':
            return 'status-planned';
        case 'inProgress':
            return 'status-in-progress';
        case 'completed':
            return 'status-completed';
        case 'declined':
            return 'status-declined';
        default:
            return 'status-unknown';
    }
}

// Gestione autenticazione per il form
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (issueSubmissionForm && issueAuthRequiredMessageDiv) {
        if (user) {
            issueAuthRequiredMessageDiv.style.display = 'none';
            issueSubmissionForm.style.display = 'block';
        } else {
            issueAuthRequiredMessageDiv.style.display = 'block';
            issueSubmissionForm.style.display = 'none';
            if (loginLinkFromContributePage && document.getElementById('showLoginBtn')) {
                // Clona il link per evitare listener multipli se onAuthStateChanged scatta più volte
                const newLoginLink = loginLinkFromContributePage.cloneNode(true);
                if (loginLinkFromContributePage.parentNode) {
                    loginLinkFromContributePage.parentNode.replaceChild(newLoginLink, loginLinkFromContributePage);
                }
                newLoginLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    const showLoginBtnGlobal = document.getElementById('showLoginBtn');
                    if (showLoginBtnGlobal) {
                        showLoginBtnGlobal.click(); // Apre la modale di login da main.js
                    }
                });
            }
        }
    }
    loadIssues(); // Ricarica le issue per aggiornare lo stato degli upvote
});

// Logica per mostrare/nascondere la selezione del gioco
if (issueTypeSelect && gameSelectionContainer) {
    issueTypeSelect.addEventListener('change', () => {
        if (issueTypeSelect.value === 'gameIssue') {
            gameSelectionContainer.style.display = 'block';
            if (issueGameIdSelect) issueGameIdSelect.required = true;
        } else {
            gameSelectionContainer.style.display = 'none';
            if (issueGameIdSelect) {
                issueGameIdSelect.required = false;
                issueGameIdSelect.value = ''; // Resetta la selezione
            }
        }
    });
}

// Gestione invio form issue
if (issueSubmissionForm) {
    issueSubmissionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) {
            issueSubmissionMessageDiv.textContent = 'Devi essere loggato per inviare.';
            issueSubmissionMessageDiv.style.color = 'red';
            return;
        }

        const title = issueTitleInput.value.trim();
        const description = issueDescriptionInput.value.trim();
        const type = issueTypeSelect.value;
        const gameId = type === 'gameIssue' && issueGameIdSelect ? issueGameIdSelect.value : null;

        if (!description || !type) {
            issueSubmissionMessageDiv.textContent = 'Descrizione e Tipo sono obbligatori.';
            issueSubmissionMessageDiv.style.color = 'orange';
            return;
        }
        if (type === 'gameIssue' && !gameId) {
            issueSubmissionMessageDiv.textContent = 'Seleziona un gioco per le segnalazioni relative ai giochi.';
            issueSubmissionMessageDiv.style.color = 'orange';
            return;
        }

        if (submitIssueBtn) {
            submitIssueBtn.disabled = true;
            submitIssueBtn.textContent = 'Invio in corso...';
        }
        if (issueSubmissionMessageDiv) {
            issueSubmissionMessageDiv.textContent = '';
            issueSubmissionMessageDiv.className = '';
        }

        try {
            const userProfileRef = doc(db, 'userProfiles', currentUser.uid);
            const userProfileSnap = await getDoc(userProfileRef);
            let submittedByInfo = {
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email.split('@')[0], // Fallback
                userNationalityCode: null,
            };

            if (userProfileSnap.exists()) {
                const profileData = userProfileSnap.data();
                if (profileData.nickname) submittedByInfo.userName = profileData.nickname;
                if (profileData.nationalityCode) submittedByInfo.userNationalityCode = profileData.nationalityCode;
            }

            const issueData = {
                title: title || 'Segnalazione/Suggerimento senza titolo',
                description: description,
                type: type,
                userId: currentUser.uid, // <-- RIGA DA AGGIUNGERE/MODIFICARE
                submittedBy: submittedByInfo,
                timestamp: serverTimestamp(),
                status: 'new',
                upvotes: 0,
                upvotedBy: [],
            };
            if (gameId) {
                // gameId viene aggiunto solo se presente
                issueData.gameId = gameId;
            }

            const issuesCollectionRef = collection(db, 'userIssues');
            await addDoc(issuesCollectionRef, issueData);

            if (issueSubmissionMessageDiv) {
                issueSubmissionMessageDiv.textContent = 'Segnalazione/suggerimento inviato con successo!';
                issueSubmissionMessageDiv.style.color = 'green';
            }
            issueSubmissionForm.reset();
            if (gameSelectionContainer) gameSelectionContainer.style.display = 'none'; // Nascondi di nuovo la selezione gioco
            loadIssues(); // Ricarica la lista
        } catch (error) {
            console.error('Errore invio issue:', error);
            if (issueSubmissionMessageDiv) {
                issueSubmissionMessageDiv.textContent = `Errore durante l'invio: ${error.message}`;
                issueSubmissionMessageDiv.style.color = 'red';
            }
        } finally {
            if (submitIssueBtn) {
                submitIssueBtn.disabled = false;
                submitIssueBtn.textContent = 'Invia Segnalazione/Suggerimento';
            }
        }
    });
}

// Funzione per caricare e visualizzare le issue
async function loadIssues() {
    if (!issuesDisplayArea || !db) {
        if (issuesDisplayArea) issuesDisplayArea.innerHTML = '<p>Errore: Impossibile caricare le segnalazioni.</p>';
        return;
    }
    issuesDisplayArea.innerHTML = '<p>Caricamento segnalazioni...</p>';

    try {
        const issuesCollectionRef = collection(db, 'userIssues');
        let q = query(issuesCollectionRef, orderBy('timestamp', 'desc'), limit(ISSUES_PER_PAGE));

        const filterType = filterIssueTypeSelect ? filterIssueTypeSelect.value : 'all';
        const filterStatus = filterIssueStatusSelect ? filterIssueStatusSelect.value : 'all';

        const conditions = [];
        if (filterType !== 'all') {
            conditions.push(where('type', '==', filterType));
        }
        if (filterStatus !== 'all') {
            conditions.push(where('status', '==', filterStatus));
        }

        if (conditions.length > 0) {
            q = query(issuesCollectionRef, ...conditions, orderBy('timestamp', 'desc'), limit(ISSUES_PER_PAGE));
        }
        // Nota: Firestore richiede che il primo orderBy sia sullo stesso campo di un'eventuale disuguaglianza
        // Se ci sono filtri (where), potremmo dover aggiustare l'orderBy o creare indici compositi.
        // Per ora, l'orderBy("timestamp", "desc") potrebbe funzionare o richiedere un indice.

        const querySnapshot = await getDocs(q);
        issuesDisplayArea.innerHTML = ''; // Pulisci

        if (querySnapshot.empty) {
            issuesDisplayArea.innerHTML =
                '<p>Nessuna segnalazione o suggerimento trovato per i filtri selezionati.</p>';
            return;
        }

        querySnapshot.forEach((docSnapshot) => {
            const issue = docSnapshot.data();
            const issueId = docSnapshot.id;
            const issueCard = document.createElement('div');
            issueCard.className = 'issue-card'; // Applica stili CSS per la card
            issueCard.setAttribute('data-issue-id', issueId);

            const titleEl = document.createElement('h5');
            titleEl.textContent = escapeHTML(issue.title);

            const descriptionEl = document.createElement('p');
            descriptionEl.className = 'issue-description';
            descriptionEl.textContent =
                escapeHTML(issue.description.substring(0, 200)) + (issue.description.length > 200 ? '...' : '');

            const metaEl = document.createElement('div');
            metaEl.className = 'issue-meta';
            const typeText =
                issue.type === 'gameIssue'
                    ? `Problema Gioco (${escapeHTML(issue.gameId || 'Non specificato')})`
                    : issue.type === 'generalFeature'
                      ? 'Funzionalità Generale Sito'
                      : issue.type === 'newGameRequest'
                        ? 'Suggerimento Nuovo Gioco'
                        : 'Sconosciuto';
            const statusBadge = `<span class="issue-status-badge ${getStatusBadgeClass(issue.status)}">${escapeHTML(issue.status)}</span>`;

            let submittedByText = `Inviato da: ${escapeHTML(issue.submittedBy.userName || 'Anonimo')}`;
            if (issue.submittedBy.userNationalityCode && issue.submittedBy.userNationalityCode !== 'OTHER') {
                submittedByText += ` <span class="fi fi-${issue.submittedBy.userNationalityCode.toLowerCase()}"></span>`;
            }
            submittedByText += ` il ${formatIssueTimestamp(issue.timestamp)}`;

            metaEl.innerHTML = `
                <p><strong>Tipo:</strong> ${typeText} | <strong>Stato:</strong> ${statusBadge}</p>
                <p><small>${submittedByText}</small></p>
            `;

            const actionsEl = document.createElement('div');
            actionsEl.className = 'issue-actions';
            const upvoteButton = document.createElement('button');
            upvoteButton.className = 'upvote-issue-btn game-button';
            upvoteButton.innerHTML = `👍 <span class="upvote-count">${issue.upvotes || 0}</span>`;
            upvoteButton.title = 'Vota questa segnalazione';
            upvoteButton.disabled = !currentUser; // Disabilita se utente non loggato

            if (currentUser && issue.upvotedBy && issue.upvotedBy.includes(currentUser.uid)) {
                upvoteButton.classList.add('voted');
                upvoteButton.title = 'Hai già votato';
            }
            upvoteButton.addEventListener('click', () => handleIssueUpvote(issueId));

            actionsEl.appendChild(upvoteButton);
            // Potremmo aggiungere un link "Dettagli" qui se la descrizione è troncata

            issueCard.appendChild(titleEl);
            issueCard.appendChild(descriptionEl);
            issueCard.appendChild(metaEl);
            issueCard.appendChild(actionsEl);
            issuesDisplayArea.appendChild(issueCard);
        });
    } catch (error) {
        console.error('Errore caricamento issues:', error);
        if (issuesDisplayArea) {
            if (error.code === 'failed-precondition') {
                issuesDisplayArea.innerHTML =
                    '<p>Errore: Indice Firestore mancante per i filtri o ordinamento. Controlla la console per il link per crearlo.</p>';
            } else {
                issuesDisplayArea.innerHTML = '<p>Errore caricamento segnalazioni. Riprova più tardi.</p>';
            }
        }
    }
}

// Gestione upvote
async function handleIssueUpvote(issueId) {
    if (!currentUser) {
        // currentUser dovrebbe essere già definito globalmente nel modulo
        showToast('Devi essere loggato per votare.');
        return;
    }
    const issueRef = doc(db, 'userIssues', issueId);
    const issueCard = document.querySelector(`.issue-card[data-issue-id="${issueId}"]`);
    const upvoteButton = issueCard ? issueCard.querySelector('.upvote-issue-btn') : null;

    if (upvoteButton) upvoteButton.disabled = true;

    try {
        const docSnap = await getDoc(issueRef);
        if (!docSnap.exists()) {
            console.error('Issue non trovata:', issueId);
            showToast('Errore: Segnalazione non trovata.');
            if (upvoteButton) upvoteButton.disabled = false;
            return;
        }

        const issueData = docSnap.data();
        const userHasUpvoted = issueData.upvotedBy && issueData.upvotedBy.includes(currentUser.uid);

        const newUpvotesCountOp = userHasUpvoted ? increment(-1) : increment(1);
        const userArrayUpdateOp = userHasUpvoted ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid);

        // *** Oggetto di aggiornamento CORRETTO ***
        const updatePayload = {
            upvotes: newUpvotesCountOp,
            upvotedBy: userArrayUpdateOp,
            updatedAt: serverTimestamp(), // <-- AGGIUNTA CRUCIALE
        };

        await updateDoc(issueRef, updatePayload);

        // Aggiorna UI direttamente o ricarica quella specifica issue/tutta la lista
        const updatedDocSnap = await getDoc(issueRef); // Richiedi dati aggiornati
        if (updatedDocSnap.exists() && upvoteButton) {
            const updatedData = updatedDocSnap.data();
            const countSpan = upvoteButton.querySelector('.upvote-count');
            if (countSpan) countSpan.textContent = updatedData.upvotes || 0;

            if (updatedData.upvotedBy && updatedData.upvotedBy.includes(currentUser.uid)) {
                upvoteButton.classList.add('voted');
                upvoteButton.title = 'Hai già votato';
            } else {
                upvoteButton.classList.remove('voted');
                upvoteButton.title = 'Vota questa segnalazione';
            }
        }
    } catch (error) {
        console.error('Errore upvote issue:', error); // Log originale del tuo errore
        showToast('Errore durante il voto.');
    } finally {
        if (upvoteButton) upvoteButton.disabled = false;
    }
}

// Event listener per i filtri
if (applyIssueFiltersBtn) {
    applyIssueFiltersBtn.addEventListener('click', loadIssues);
}

// Caricamento iniziale
document.addEventListener('DOMContentLoaded', () => {
    // `onAuthStateChanged` gestirà il primo caricamento dopo aver definito `currentUser`
    // Non è necessaria una chiamata diretta a `loadIssues()` qui se `onAuthStateChanged` lo fa.
});

export { loadIssues }; // Esporta se vuoi chiamarla da altri moduli (es. dopo login da main.js)
