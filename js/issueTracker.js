// js/issueTracker.js
import { db, auth } from './main.js';
import {
    collection, addDoc, query, where, orderBy, limit, getDocs,
    serverTimestamp, doc, updateDoc, getDoc, increment, arrayUnion, arrayRemove
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { showToast } from './toastNotifications.js';
import { setupDraggableCarousel } from './utils/carouselUtils.js'; // Assicurati che il percorso sia corretto

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
const issuesDisplayArea = document.getElementById('issuesDisplayArea');
const filterIssueTypeSelect = document.getElementById('filterIssueType');
const filterIssueStatusSelect = document.getElementById('filterIssueStatus');
const applyIssueFiltersBtn = document.getElementById('applyIssueFiltersBtn');

let currentUser = null;
const ISSUES_PER_PAGE = 15;

// NUOVA FUNZIONE HELPER
function updateCarouselState() {
    if (!issuesDisplayArea) return;

    if (window.innerWidth <= 768) {
        // Siamo su mobile
        if (issuesDisplayArea.children.length > 0 && !issuesDisplayArea.dataset.carouselInitialized) {
            console.log('Attivazione carosello per le issue...');
            setupDraggableCarousel(issuesDisplayArea);
            issuesDisplayArea.dataset.carouselInitialized = 'true';
        }
    } else {
        // Siamo su desktop
        if (issuesDisplayArea.dataset.carouselInitialized) {
            console.log('Disattivazione logica carosello per le issue (desktop).');
            delete issuesDisplayArea.dataset.carouselInitialized;
        }
    }
}
// FINE NUOVA FUNZIONE HELPER

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
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch (e) { return 'Formato data errato'; }
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'new': return 'status-new';
        case 'underConsideration': return 'status-under-consideration';
        case 'accepted': return 'status-accepted';
        case 'planned': return 'status-planned';
        case 'inProgress': return 'status-in-progress';
        case 'completed': return 'status-completed';
        case 'declined': return 'status-declined';
        default: return 'status-unknown';
    }
}

function createIssueCardElement(issueData, issueId, localCurrentUser) {
    const issueCard = document.createElement('div');
    issueCard.className = 'issue-card';
    issueCard.setAttribute('data-issue-id', issueId);

    const titleEl = document.createElement('h5');
    titleEl.textContent = escapeHTML(issueData.title);

    const descriptionEl = document.createElement('p');
    descriptionEl.className = 'issue-description';
    descriptionEl.textContent =
        escapeHTML(issueData.description.substring(0, 200)) + (issueData.description.length > 200 ? '...' : '');

    const metaEl = document.createElement('div');
    metaEl.className = 'issue-meta';
    
    const typeText =
        issueData.type === 'gameIssue'
            ? `Problema Gioco (${escapeHTML(issueData.gameId || 'Non specificato')})`
            : issueData.type === 'generalFeature'
                ? 'Funzionalità Generale Sito'
                : issueData.type === 'newGameRequest'
                    ? 'Suggerimento Nuovo Gioco'
                    : 'Sconosciuto';
    
    // CORREZIONE QUI: Assicurarsi che statusBadge sia un template literal corretto
    const statusBadge = `<span class="issue-status-badge ${getStatusBadgeClass(issueData.status)}">${escapeHTML(issueData.status)}</span>`;

    let submittedByText = `Inviato da: ${escapeHTML(issueData.submittedBy.userName || 'Anonimo')}`;
    if (issueData.submittedBy.userNationalityCode && issueData.submittedBy.userNationalityCode !== 'OTHER') {
        submittedByText += ` <span class="fi fi-${issueData.submittedBy.userNationalityCode.toLowerCase()}"></span>`;
    }
    submittedByText += ` il ${formatIssueTimestamp(issueData.timestamp)}`;

    // CORREZIONE QUI: Usare correttamente le variabili nel template literal
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
    if (localCurrentUser && issueData.upvotedBy && issueData.upvotedBy.includes(localCurrentUser.uid)) {
        userHasVoted = true;
    }

    const upvoteIconFill = userHasVoted ? 1 : 0;
    const upvoteIconName = 'how_to_vote';

    // CORREZIONE QUI: Assicurarsi che upvoteIconFill e upvoteIconName siano interpolati correttamente
    upvoteButton.innerHTML = `<span class="material-symbols-rounded" style="font-variation-settings: 'FILL' ${upvoteIconFill};">${upvoteIconName}</span> <span class="upvote-count">${issueData.upvotes || 0}</span>`;
    upvoteButton.title = userHasVoted ? 'Hai già votato' : 'Vota questa segnalazione';
    if (userHasVoted) upvoteButton.classList.add('voted');

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
    
    if (localCurrentUser) {
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
    
    return issueCard;
}

async function loadAndDisplayTopVotedIssue() {
    const topIssueSection = document.getElementById('top-voted-issue-section');
    const topIssueContainer = document.getElementById('topVotedIssueContainer');

    if (!topIssueSection || !topIssueContainer) return;

    try {
        const issuesCollectionRef = collection(db, 'userIssues');
        // Query per la top issue attiva (non completata o rifiutata) con almeno 1 voto
        const q = query(
            issuesCollectionRef,
            where('status', 'not-in', ['completed', 'declined']),
            orderBy('upvotes', 'desc'),
            orderBy('timestamp', 'desc'), // Criterio secondario per coerenza
            limit(1)
        );

        const querySnapshot = await getDocs(q);
        topIssueContainer.innerHTML = ''; // Pulisci il contenitore

        if (!querySnapshot.empty) {
            const topIssueDoc = querySnapshot.docs[0];
            const topIssueData = topIssueDoc.data();

            if (topIssueData.upvotes > 0) { // Mostra solo se ha almeno un voto
                const topIssueCardElement = createIssueCardElement(topIssueData, topIssueDoc.id, currentUser);
                topIssueCardElement.classList.add('top-issue-highlight'); // Aggiungi classe per styling specifico

                topIssueContainer.appendChild(topIssueCardElement);
                topIssueSection.style.display = 'block'; // Rendi visibile la sezione
            } else {
                topIssueSection.style.display = 'none'; // Nascondi se la top issue non ha voti
            }
        } else {
            topIssueSection.style.display = 'none'; // Nascondi se non ci sono issue idonee
        }
    } catch (error) {
        console.error("Errore nel caricare la top issue:", error);
        topIssueSection.style.display = 'none';
         if (error.code === 'failed-precondition' && topIssueContainer) {
            topIssueContainer.innerHTML = '<p><small>Indice Firestore per top issue mancante.</small></p>';
            topIssueSection.style.display = 'block'; 
        }
    }
}

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (issueSubmissionForm && issueAuthRequiredMessageDiv) {
        if (user) {
            issueAuthRequiredMessageDiv.style.display = 'none';
            issueSubmissionForm.style.display = 'block';
        } else {
            issueAuthRequiredMessageDiv.style.display = 'block';
            issueSubmissionForm.style.display = 'none';
        }
    }
    if (issuesDisplayArea) {
        loadIssues();
        loadAndDisplayTopVotedIssue();
    }
});

if (issueTypeSelect && gameSelectionContainer) {
    issueTypeSelect.addEventListener('change', () => {
        if (issueTypeSelect.value === 'gameIssue') {
            gameSelectionContainer.style.display = 'block';
            if (issueGameIdSelect) issueGameIdSelect.required = true;
        } else {
            gameSelectionContainer.style.display = 'none';
            if (issueGameIdSelect) {
                issueGameIdSelect.required = false;
                issueGameIdSelect.value = '';
            }
        }
    });
}

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
        const gameIdValueFromInput = type === 'gameIssue' && issueGameIdSelect ? issueGameIdSelect.value : null;

        if (!description || !type) {
            issueSubmissionMessageDiv.textContent = 'Descrizione e Tipo sono obbligatori.';
            issueSubmissionMessageDiv.style.color = 'orange';
            return;
        }
        if (type === 'gameIssue' && !gameIdValueFromInput) {
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
                userName: currentUser.displayName || currentUser.email.split('@')[0],
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
                userId: currentUser.uid,
                submittedBy: submittedByInfo,
                timestamp: serverTimestamp(),
                status: 'new',
                upvotes: 0,
                upvotedBy: [],
            };
            if (gameIdValueFromInput) {
                issueData.gameId = gameIdValueFromInput;
            }

            const issuesCollectionRef = collection(db, 'userIssues');
            await addDoc(issuesCollectionRef, issueData);

            if (issueSubmissionMessageDiv) {
                issueSubmissionMessageDiv.textContent = 'Segnalazione/suggerimento inviato con successo!';
                issueSubmissionMessageDiv.style.color = 'green';
            }
            issueSubmissionForm.reset();
            if(gameSelectionContainer) gameSelectionContainer.style.display = 'none';
            loadIssues();
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

async function loadIssues() {
    if (!issuesDisplayArea || !db) {
        if (issuesDisplayArea) issuesDisplayArea.innerHTML = '<p>Errore: Impossibile caricare le segnalazioni.</p>';
        return;
    }
    issuesDisplayArea.innerHTML = '<p>Caricamento segnalazioni...</p>';

    try {
        const issuesCollectionRef = collection(db, 'userIssues');
        const filterType = filterIssueTypeSelect ? filterIssueTypeSelect.value : 'all';
        const filterStatus = filterIssueStatusSelect ? filterIssueStatusSelect.value : 'all';
        
        const conditions = []; 
        let queryClauses = []; 

        if (filterType !== 'all') {
            conditions.push(where('type', '==', filterType));
        }
        if (filterStatus !== 'all') {
            conditions.push(where('status', '==', filterStatus));
        }

        if (conditions.length > 0) {
            queryClauses = [...conditions, orderBy('upvotes', 'desc'), orderBy('timestamp', 'desc'), limit(ISSUES_PER_PAGE)];
        } else {
            queryClauses = [orderBy('upvotes', 'desc'), orderBy('timestamp', 'desc'), limit(ISSUES_PER_PAGE)];
        }
        
        const q = query(issuesCollectionRef, ...queryClauses);
        const querySnapshot = await getDocs(q);
        issuesDisplayArea.innerHTML = ''; 

        if (querySnapshot.empty) {
            issuesDisplayArea.innerHTML = '<p>Nessuna segnalazione o suggerimento trovato per i filtri selezionati.</p>';
        } else {
            querySnapshot.forEach((docSnapshot) => {
                const issue = docSnapshot.data();
                const issueId = docSnapshot.id;
                const issueCardElement = createIssueCardElement(issue, issueId, currentUser);
    issuesDisplayArea.appendChild(issueCardElement);
});
        }
        
        // <<< CHIAMATA A updateCarouselState AGGIUNTA QUI >>>
        updateCarouselState(); 

    } catch (error) {
        console.error('Errore caricamento issues:', error);
        if (issuesDisplayArea) {
            if (error.code === 'failed-precondition') {
                issuesDisplayArea.innerHTML =
                    '<p>Errore: Indice Firestore mancante. Controlla la console per il link per crearlo.</p>';
            } else {
                issuesDisplayArea.innerHTML = '<p>Errore caricamento segnalazioni. Riprova più tardi.</p>';
            }
        }
    }
}

async function handleIssueUpvote(issueId) {
    if (!currentUser) {
        console.warn('[handleIssueUpvote] Chiamata anomala: utente non loggato.');
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
            showToast('Voto rimosso.', 'info', 2000);
        } else {
            showToast('Grazie per il tuo voto!', 'success', 2000);
        }

        const updatedDocSnap = await getDoc(issueRef);
        if (updatedDocSnap.exists() && upvoteButton) {
            const updatedData = updatedDocSnap.data();
            const countSpan = upvoteButton.querySelector('.upvote-count');
            if (countSpan) countSpan.textContent = updatedData.upvotes || 0;

            const userNowHasVoted = updatedData.upvotedBy && updatedData.upvotedBy.includes(currentUser.uid);
            const upvoteIconFill = userNowHasVoted ? 1 : 0;
            const upvoteIconName = 'how_to_vote';

            const iconSpanElement = upvoteButton.querySelector('.material-symbols-rounded');
            if (iconSpanElement) {
                iconSpanElement.textContent = upvoteIconName;
                iconSpanElement.style.fontVariationSettings = `'FILL' ${upvoteIconFill}`;
            }
            
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

if (applyIssueFiltersBtn) {
    applyIssueFiltersBtn.addEventListener('click', loadIssues);
}

document.addEventListener('DOMContentLoaded', () => {
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateCarouselState();
        }, 250); 
    });
});

export { loadIssues };
