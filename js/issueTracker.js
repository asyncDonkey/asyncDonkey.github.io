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
import { showToast } from './toastNotifications.js'; // Assicurati di avere un modulo per le toast
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
    currentUser = user; // currentUser è già aggiornato qui
    if (issueSubmissionForm && issueAuthRequiredMessageDiv) {
        if (user) {
            issueAuthRequiredMessageDiv.style.display = 'none';
            issueSubmissionForm.style.display = 'block';
        } else {
            issueAuthRequiredMessageDiv.style.display = 'block';
            issueSubmissionForm.style.display = 'none';
            // La logica per loginLinkFromContributePage è stata rimossa
            // perché i link sono ora direttamente nell'HTML.
        }
    }
    // Ricarica le issue per aggiornare lo stato degli upvote e dei listener
    // (es. per abilitare/disabilitare i pulsanti di voto in base al login)
    if (document.getElementById('issuesDisplayArea')) {
        loadIssues();
    }
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
    // currentUser è aggiornato da onAuthStateChanged

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

        const querySnapshot = await getDocs(q);
        issuesDisplayArea.innerHTML = '';

        if (querySnapshot.empty) {
            issuesDisplayArea.innerHTML =
                '<p>Nessuna segnalazione o suggerimento trovato per i filtri selezionati.</p>';
            return;
        }

        querySnapshot.forEach((docSnapshot) => {
            const issue = docSnapshot.data();
            const issueId = docSnapshot.id;
            const issueCard = document.createElement('div');
            issueCard.className = 'issue-card';
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

            const upvoteInteractionWrapper = document.createElement('div');
            upvoteInteractionWrapper.style.display = 'inline-block';
            upvoteInteractionWrapper.classList.add('upvote-interaction-wrapper');

            const upvoteButton = document.createElement('button');
            upvoteButton.className = 'upvote-issue-btn game-button';

            let userHasVoted = false;
            if (currentUser && issue.upvotedBy && issue.upvotedBy.includes(currentUser.uid)) {
                userHasVoted = true;
            }

            const upvoteIconFill = userHasVoted ? 1 : 0;
            const upvoteIconName = 'how_to_vote'; // Icona scelta

            upvoteButton.innerHTML = `<span class="material-symbols-rounded" style="font-variation-settings: 'FILL' ${upvoteIconFill};">${upvoteIconName}</span> <span class="upvote-count">${issue.upvotes || 0}</span>`;
            upvoteButton.title = userHasVoted ? 'Hai già votato' : 'Vota questa segnalazione';
            if (userHasVoted) upvoteButton.classList.add('voted');

            // Pulisci listener e classi precedenti
            if (upvoteInteractionWrapper.guestHandlerAttached) {
                upvoteInteractionWrapper.removeEventListener('click', upvoteInteractionWrapper.guestHandlerAttached);
                delete upvoteInteractionWrapper.guestHandlerAttached;
            }
            upvoteInteractionWrapper.classList.remove('guest-interactive');
            upvoteInteractionWrapper.style.cursor = 'default';

            const oldButtonHandler = upvoteButton.handlerAttached;
            if (oldButtonHandler) {
                upvoteButton.removeEventListener('click', oldButtonHandler);
                delete upvoteButton.handlerAttached;
            }

            if (currentUser) {
                upvoteButton.disabled = false;
                upvoteInteractionWrapper.style.cursor = 'pointer';

                const upvoteHandler = () => handleIssueUpvote(issueId);
                upvoteButton.addEventListener('click', upvoteHandler);
                upvoteButton.handlerAttached = upvoteHandler;
            } else {
                upvoteButton.disabled = true;
                upvoteInteractionWrapper.style.cursor = 'pointer';
                upvoteInteractionWrapper.title = 'Accedi per votare';
                upvoteInteractionWrapper.classList.add('guest-interactive');

                const guestUpvoteHandler = (e) => {
                    e.stopPropagation();
                    showToast('Devi essere loggato per votare segnalazioni o suggerimenti.', 'info', 3000);
                    const showLoginBtnGlobal = document.getElementById('showLoginBtn');
                    if (showLoginBtnGlobal) {
                        showLoginBtnGlobal.click();
                    }
                };
                upvoteInteractionWrapper.addEventListener('click', guestUpvoteHandler);
                upvoteInteractionWrapper.guestHandlerAttached = guestUpvoteHandler;
            }

            upvoteInteractionWrapper.appendChild(upvoteButton);
            actionsEl.appendChild(upvoteInteractionWrapper);

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
        console.warn('[handleIssueUpvote] Chiamata anomala: utente non loggato.');
        // La toast e il modale sono gestiti dal wrapper, ma come fallback:
        // showToast("Devi essere loggato per votare.", "info");
        // const showLoginBtnGlobal = document.getElementById('showLoginBtn');
        // if (showLoginBtnGlobal) showLoginBtnGlobal.click();
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
            showToast('Errore: Segnalazione non trovata.', 'error');
            if (upvoteButton) upvoteButton.disabled = false;
            return;
        }

        const issueData = docSnap.data();
        const userHasUpvoted = issueData.upvotedBy && issueData.upvotedBy.includes(currentUser.uid);

        const newUpvotesCountOp = userHasUpvoted ? increment(-1) : increment(1);
        const userArrayUpdateOp = userHasUpvoted ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid);

        const updatePayload = {
            upvotes: newUpvotesCountOp,
            upvotedBy: userArrayUpdateOp,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(issueRef, updatePayload);
        if (userHasUpvoted) {
            // Se l'utente AVEVA votato, ora sta togliendo il voto
            showToast('Voto rimosso.', 'info', 2000);
        } else {
            // Se l'utente NON aveva votato, ora sta aggiungendo il voto
            showToast('Grazie per il tuo voto!', 'success', 2000);
        }

        const updatedDocSnap = await getDoc(issueRef);
        if (updatedDocSnap.exists() && upvoteButton) {
            const updatedData = updatedDocSnap.data();
            const countSpan = upvoteButton.querySelector('.upvote-count');
            if (countSpan) countSpan.textContent = updatedData.upvotes || 0;

            const userNowHasVoted = updatedData.upvotedBy && updatedData.upvotedBy.includes(currentUser.uid);
            const upvoteIconFill = userNowHasVoted ? 1 : 0;
            const upvoteIconName = 'how_to_vote'; // Mantieni la stessa icona

            const iconSpanElement = upvoteButton.querySelector('.material-symbols-rounded');
            if (iconSpanElement) {
                iconSpanElement.textContent = upvoteIconName;
                iconSpanElement.style.fontVariationSettings = `'FILL' ${upvoteIconFill}`;
            }
            // Se vuoi ricreare l'innerHTML completo:
            // upvoteButton.innerHTML = `<span class="material-symbols-rounded" style="font-variation-settings: 'FILL' ${upvoteIconFill};">${upvoteIconName}</span> <span class="upvote-count">${updatedData.upvotes || 0}</span>`;

            if (userNowHasVoted) {
                upvoteButton.classList.add('voted');
                upvoteButton.title = 'Hai già votato';
            } else {
                upvoteButton.classList.remove('voted');
                upvoteButton.title = 'Vota questa segnalazione';
            }
        }
    } catch (error) {
        console.error('Errore upvote issue:', error);
        showToast('Errore durante il voto.', 'error');
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
