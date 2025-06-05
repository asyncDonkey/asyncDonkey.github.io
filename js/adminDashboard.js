import { db, auth, showConfirmationModal } from './main.js';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    orderBy,
    deleteDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { showToast } from './toastNotifications.js';

// --- NUOVO IMPORT PER CHIAMARE LE CLOUD FUNCTIONS ---
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';

// Inizializza Firebase Functions
const functions = getFunctions();
// --- FINE NUOVO IMPORT ---

const adminAuthMessageDiv = document.getElementById('adminAuthMessage');
const adminDashboardContentDiv = document.getElementById('adminDashboardContent');
const pendingArticlesListDiv = document.getElementById('pendingArticlesList');

// Elementi modale modifica articolo
const editArticleModal = document.getElementById('editArticleModal');
const closeEditArticleModalBtn = document.getElementById('closeEditArticleModalBtn');
const editArticleForm = document.getElementById('editArticleForm');
const editingArticleIdInput = document.getElementById('editingArticleId');
const editArticleTitleInput = document.getElementById('editArticleTitle');
const editArticleContentTextarea = document.getElementById('editArticleContent');
const editArticleTagsInput = document.getElementById('editArticleTags');
const editArticleSnippetInput = document.getElementById('editArticleSnippet');
const editArticleCoverImageUrlInput = document.getElementById('editArticleCoverImageUrl');
const editArticleIsFeaturedCheckbox = document.getElementById('editArticleIsFeatured');

let easyMDEEditInstance = null;

// Riferimenti DOM per bozze e articoli respinti
const draftArticlesListDiv = document.getElementById('draftArticlesList');
const rejectedArticlesListDiv = document.getElementById('rejectedArticlesList');

// --- Gestione Issue Utente per Admin (variabili esistenti) ---
const adminUserIssuesListDiv = document.getElementById('adminUserIssuesList');
const adminFilterIssueTypeSelect = document.getElementById('adminFilterIssueType');
const adminFilterIssueStatusSelect = document.getElementById('adminFilterIssueStatus');
const adminApplyIssueFiltersBtn = document.getElementById('adminApplyIssueFiltersBtn');

const ISSUE_STATUSES = ['new', 'underConsideration', 'accepted', 'planned', 'inProgress', 'completed', 'declined'];
const ISSUE_TYPES = ['generalFeature', 'newGameRequest', 'gameIssue'];

// --- Riferimenti DOM per la Nuova Modale di Rifiuto ---
const rejectReasonModal = document.getElementById('rejectReasonModal');
const closeRejectReasonModalBtn = document.getElementById('closeRejectReasonModalBtn');
const rejectReasonForm = document.getElementById('rejectReasonForm');
const rejectingArticleIdInput = document.getElementById('rejectingArticleId'); // Hidden input
const rejectionReasonTextarea = document.getElementById('rejectionReasonTextarea');
const cancelRejectReasonBtn = document.getElementById('cancelRejectReasonBtn');
// submitRejectReasonBtn sarà gestito dall'event listener del form

const nicknameRequestsListDiv = document.getElementById('nicknameRequestsList');

// --- NUOVI RIFERIMENTI DOM PER MONITORAGGIO TESTER ---
const testerMonitoringListContainer = document.getElementById('tester-monitoring-list-container');
const testTasksSummaryContainer = document.getElementById('test-tasks-summary-container');

let currentArticleIdToReject = null; // Variabile per tenere traccia dell'ID durante il processo di rifiuto

function initializeOrUpdateEditMarkdownEditor(content = '') {
    if (editArticleContentTextarea) {
        if (!easyMDEEditInstance) {
            try {
                easyMDEEditInstance = new EasyMDE({
                    element: editArticleContentTextarea,
                    initialValue: content,
                    spellChecker: false,
                    placeholder: "Contenuto dell'articolo in Markdown...",
                    toolbar: [
                        'bold',
                        'italic',
                        'heading',
                        '|',
                        'quote',
                        'unordered-list',
                        'ordered-list',
                        '|',
                        'link',
                        'image',
                        'code',
                        'horizontal-rule',
                        '|',
                        'preview',
                        'side-by-side',
                        'fullscreen',
                        '|',
                        'guide',
                    ],
                    autosave: {
                        enabled: false, // Disabilitato per la modale di modifica admin
                    },
                });
            } catch (e) {
                console.error('Errore inizializzazione EasyMDE per modifica:', e);
                editArticleContentTextarea.value = content;
            }
        } else {
            easyMDEEditInstance.value(content);
        }
    } else {
        console.error('Textarea per EasyMDE (editArticleContent) non trovato nella modale.');
    }
}

function destroyEditMarkdownEditor() {
    if (easyMDEEditInstance) {
        try {
            easyMDEEditInstance.toTextArea();
            easyMDEEditInstance = null;
        } catch (e) {
            console.error('Errore rimozione EasyMDE per modifica:', e);
        }
    }
    if (editArticleContentTextarea) {
        editArticleContentTextarea.value = '';
    }
}

async function loadPendingArticles() {
    if (!pendingArticlesListDiv) {
        return;
    }
    pendingArticlesListDiv.innerHTML = '<p>Caricamento articoli in attesa di revisione...</p>';
    try {
        const articlesRef = collection(db, 'articles');
        const q = query(articlesRef, where('status', '==', 'pendingReview'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            pendingArticlesListDiv.innerHTML = '<p>Nessun articolo in attesa di revisione al momento.</p>';
            return;
        }

        pendingArticlesListDiv.innerHTML = '';
        querySnapshot.forEach((docSnapshot) => {
            const article = docSnapshot.data();
            const articleId = docSnapshot.id;
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('article-list-item');
            const creationDate = article.createdAt?.toDate
                ? article.createdAt
                      .toDate()
                      .toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'N/A';
            itemDiv.innerHTML = `
        <span class="article-info">
          <strong>${article.title || 'Titolo mancante'}</strong><br>
          <small>Autore: ${article.authorName || article.authorId} | Inviato: ${creationDate}</small>
        </span>
        <span class="actions">
          <button class="game-button view-edit-btn" data-id="${articleId}">Visualizza/Modifica</button>
          <button class="game-button approve-btn" data-id="${articleId}" style="background-color: var(--game-border-color); color: white;">Approva</button>
          <button class="game-button reject-btn" data-id="${articleId}" style="background-color: #dc3545; color: white;">Respingi</button>
        </span>
      `;
            pendingArticlesListDiv.appendChild(itemDiv);
        });
        addEventListenersToAdminArticleButtons();
    } catch (error) {
        console.error('Errore caricamento articoli pending:', error);
        pendingArticlesListDiv.innerHTML = '<p>Errore nel caricamento degli articoli. Controlla la console.</p>';
    }
}

function addEventListenersToAdminArticleButtons() {
    document.querySelectorAll('#pendingArticlesList .view-edit-btn').forEach((button) => {
        button.removeEventListener('click', handleViewEditArticleClick);
        button.addEventListener('click', handleViewEditArticleClick);
    });
    document.querySelectorAll('#pendingArticlesList .approve-btn').forEach((button) => {
        button.removeEventListener('click', handleApproveArticleClick);
        button.addEventListener('click', handleApproveArticleClick);
    });
    document.querySelectorAll('#pendingArticlesList .reject-btn').forEach((button) => {
        button.removeEventListener('click', handleRejectArticleClick);
        button.addEventListener('click', handleRejectArticleClick);
    });
}

async function handleViewEditArticleClick(e) {
    const articleId = e.target.dataset.id;
    await openEditArticleModal(articleId);
}

async function handleApproveArticleClick(e) {
    const articleId = e.target.dataset.id;
    await approveArticle(articleId);
}

async function handleRejectArticleClick(e) {
    const articleId = e.target.dataset.id;
    if (!articleId) {
        showToast('ID articolo non specificato per il rifiuto.', 'error');
        return;
    }

    let articleTitleForDisplay = `ID: ${articleId.substring(0, 6)}...`;
    try {
        const articleRef = doc(db, 'articles', articleId);
        const docSnap = await getDoc(articleRef);
        if (docSnap.exists() && docSnap.data().title) {
            articleTitleForDisplay = `"${docSnap.data().title}"`;
        }
    } catch (err) {
        console.warn(`Impossibile recuperare il titolo per l'articolo ${articleId}:`, err);
    }

    const userConfirmedInitialRejection = await showConfirmationModal(
        'Conferma Iniziale Rifiuto',
        `Sei sicuro di voler avviare il processo di rifiuto per l'articolo ${articleTitleForDisplay}? Potrai inserire un motivo nel passo successivo.`
    );

    if (!userConfirmedInitialRejection) {
        showToast("Processo di rifiuto annullato dall'utente.", 'info');
        return;
    }

    currentArticleIdToReject = articleId;

    if (rejectingArticleIdInput) {
        rejectingArticleIdInput.value = articleId;
    }
    if (rejectionReasonTextarea) {
        rejectionReasonTextarea.value = '';
    }

    const modalReasonTitleEl = document.getElementById('rejectReasonModalTitle');
    if (modalReasonTitleEl) {
        modalReasonTitleEl.textContent = `Motivo Rifiuto per: ${articleTitleForDisplay}`;
    }

    if (rejectReasonModal) {
        rejectReasonModal.style.display = 'block';
        if (rejectionReasonTextarea) {
            rejectionReasonTextarea.focus();
        }
    } else {
        showToast('Errore critico: la modale per inserire il motivo del rifiuto non è stata trovata.', 'error');
        console.error('La modale #rejectReasonModal non è stata trovata nel DOM!');
    }
}

// =================================================================================
// ============== NUOVE FUNZIONI PER IL MONITORAGGIO DEI TESTER ====================
// =================================================================================

/**
 * Crea l'HTML per la card di un singolo tester con le sue statistiche.
 * @param {object} testerProfile - I dati del profilo del tester (es. { nickname, email }).
 * @param {object} stats - Le statistiche aggregate (es. { total, success, failure, lastSubmissionDate }).
 * @returns {string} La stringa HTML per la card del tester.
 */
function createTesterCardHTML(testerProfile, stats) {
    const successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 0;
    const failureRate = stats.total > 0 ? ((stats.failure / stats.total) * 100).toFixed(1) : 0;
    const lastSubmission = stats.lastSubmissionDate
        ? stats.lastSubmissionDate.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'N/A';

    return `
        <div class="article-list-item tester-card">
            <span class="article-info">
                <strong>${testerProfile.nickname || 'Nickname non disponibile'}</strong><br>
                <small>Email: ${testerProfile.email || 'N/A'} | Ultimo feedback: ${lastSubmission}</small>
            </span>
            <span class="actions tester-stats" style="text-align: right;">
                <span title="Task Completati">Completati: <strong>${stats.total}</strong></span>
                <span title="Successi" style="color: var(--success-color);">Successi: <strong>${stats.success} (${successRate}%)</strong></span>
                <span title="Fallimenti" style="color: var(--error-color);">Fallimenti: <strong>${stats.failure} (${failureRate}%)</strong></span>
            </span>
        </div>
    `;
}

/**
 * Crea l'HTML per la riga di riepilogo di un singolo task.
 * @param {object} taskInfo - I dati del task (es. { id, title }).
 * @param {object} stats - Le statistiche aggregate per quel task (es. { total, success, failure }).
 * @returns {string} La stringa HTML per la riga del task.
 */
function createTaskSummaryHTML(taskInfo, stats) {
    const successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 0;

    return `
        <div class="article-list-item task-summary-item">
            <span class="article-info">
                <strong>${taskInfo.title || 'Titolo non disponibile'}</strong><br>
                <small>Task ID: ${taskInfo.id}</small>
            </span>
            <span class="actions task-stats" style="text-align: right;">
                 <span>Feedback Totali: <strong>${stats.total}</strong></span>
                 <span style="color: var(--success-color);">% Successo: <strong>${successRate}%</strong></span>
            </span>
        </div>
    `;
}

/**
 * Carica e aggrega i dati dai profili dei tester e i loro risultati di test.
 */
async function loadTesterMonitoringData() {
    if (!testerMonitoringListContainer || !testTasksSummaryContainer) return;

    try {
        // 1. Recupera le definizioni dei task per avere i titoli a disposizione
        const tasksDefSnapshot = await getDocs(collection(db, 'testTasksDefinition'));
        const tasksDefinitions = new Map();
        tasksDefSnapshot.forEach((doc) => {
            tasksDefinitions.set(doc.id, doc.data());
        });

        // 2. Recupera tutti gli utenti che sono tester
        const testersQuery = query(collection(db, 'userProfiles'), where('isTestUser', '==', true));
        const testersSnapshot = await getDocs(testersQuery);

        if (testersSnapshot.empty) {
            testerMonitoringListContainer.innerHTML = '<p>Nessun utente tester trovato.</p>';
            testTasksSummaryContainer.innerHTML = '<p>Nessun dato da visualizzare.</p>';
            return;
        }

        const taskAggregates = new Map(); // Per aggregare i risultati per task
        let testerPromises = []; // Array per contenere le promise di elaborazione di ogni tester

        // 3. Itera su ogni tester per recuperare e aggregare i suoi risultati
        testersSnapshot.forEach((testerDoc) => {
            const testerProfile = testerDoc.data();
            const testerId = testerDoc.id;

            const promise = (async () => {
                const resultsCollectionRef = collection(db, 'userProfiles', testerId, 'testResults');
                const resultsSnapshot = await getDocs(resultsCollectionRef);

                const stats = {
                    total: resultsSnapshot.size,
                    success: 0,
                    failure: 0,
                    lastSubmissionDate: null,
                };

                resultsSnapshot.forEach((resultDoc) => {
                    const resultData = resultDoc.data();

                    // Aggiorna statistiche del singolo tester
                    if (resultData.outcome === 'success') stats.success++;
                    if (resultData.outcome === 'failure') stats.failure++;

                    const timestamp = resultData.timestamp?.toDate();
                    if (timestamp && (!stats.lastSubmissionDate || timestamp > stats.lastSubmissionDate)) {
                        stats.lastSubmissionDate = timestamp;
                    }

                    // Aggiorna statistiche globali per task
                    const taskId = resultData.taskId;
                    if (!taskAggregates.has(taskId)) {
                        taskAggregates.set(taskId, { total: 0, success: 0, failure: 0 });
                    }
                    const currentTaskStats = taskAggregates.get(taskId);
                    currentTaskStats.total++;
                    if (resultData.outcome === 'success') currentTaskStats.success++;
                    if (resultData.outcome === 'failure') currentTaskStats.failure++;
                });

                return { profile: testerProfile, stats: stats };
            })();

            testerPromises.push(promise);
        });

        // 4. Attendi che tutti i dati dei tester siano stati processati
        const allTestersData = await Promise.all(testerPromises);

        // 5. Renderizza l'HTML
        // Panoramica per Tester
        let testersHTML = '';
        allTestersData
            .sort((a, b) => b.stats.total - a.stats.total) // Ordina per numero di task completati
            .forEach((data) => {
                testersHTML += createTesterCardHTML(data.profile, data.stats);
            });
        testerMonitoringListContainer.innerHTML = testersHTML || '<p>Nessun risultato sottomesso dai tester.</p>';

        // Panoramica per Task
        let tasksSummaryHTML = '';
        taskAggregates.forEach((stats, taskId) => {
            const taskInfo = {
                id: taskId,
                title: tasksDefinitions.get(taskId)?.title || `Task ${taskId}`,
            };
            tasksSummaryHTML += createTaskSummaryHTML(taskInfo, stats);
        });
        testTasksSummaryContainer.innerHTML =
            tasksSummaryHTML || '<p>Ancora nessun feedback ricevuto per i task di test.</p>';
    } catch (error) {
        console.error('Errore nel caricare i dati di monitoraggio dei tester:', error);
        testerMonitoringListContainer.innerHTML =
            '<p style="color: var(--error-color);">Errore nel caricamento dei dati dei tester.</p>';
        testTasksSummaryContainer.innerHTML =
            '<p style="color: var(--error-color);">Errore nel caricamento del riepilogo dei task.</p>';
        showToast('Errore nel caricamento dei dati di monitoraggio.', 'error');
    }
}

async function loadNicknameChangeRequests() {
    if (!nicknameRequestsListDiv) {
        console.warn('Elemento nicknameRequestsListDiv non trovato.');
        return;
    }
    nicknameRequestsListDiv.innerHTML = '<p>Caricamento richieste cambio nickname...</p>';
    try {
        const requestsRef = collection(db, 'nicknameChangeRequests');
        const q = query(requestsRef, where('status', '==', 'pending'), orderBy('requestedAt', 'asc'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            nicknameRequestsListDiv.innerHTML = '<p>Nessuna richiesta di cambio nickname in sospeso.</p>';
            return;
        }

        nicknameRequestsListDiv.innerHTML = '';
        querySnapshot.forEach((docSnapshot) => {
            const request = docSnapshot.data();
            const requestId = docSnapshot.id;
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('admin-list-item', 'nickname-request-item');

            const requestedDate = request.requestedAt?.toDate
                ? request.requestedAt.toDate().toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                  })
                : 'Data non disponibile';
            const userIdentifier = request.userEmail || request.userId;

            itemDiv.innerHTML = `
        <span class="article-info" style="flex-basis: 65%;"> Utente: <strong>${userIdentifier}</strong> (ID: ${request.userId})<br>
          <small>
            Nickname Attuale: <em>${request.currentNickname || 'Non specificato'}</em><br>
            Nuovo Nickname Richiesto: <strong>${request.requestedNickname}</strong><br>
            Data Richiesta: ${requestedDate}
          </small>
        </span>
        <span class="actions" style="flex-basis: 35%; text-align:right;">
          <button class="game-button approve-nickname-btn" data-id="${requestId}" data-userid="${request.userId}" data-newnickname="${request.requestedNickname}" style="background-color: var(--game-border-color); color: white; margin-bottom: 5px;">Approva</button>
          <button class="game-button reject-nickname-btn" data-id="${requestId}" data-userid="${request.userId}" data-currentnickname="${request.currentNickname}" data-requestednickname="${request.requestedNickname}" data-useremail="${userIdentifier}" style="background-color: #dc3545; color: white;">Rifiuta</button>
        </span>
      `;
            nicknameRequestsListDiv.appendChild(itemDiv);
        });

        addEventListenersToNicknameRequestButtons();
    } catch (error) {
        console.error('Errore caricamento richieste cambio nickname:', error);
        nicknameRequestsListDiv.innerHTML = '<p>Errore nel caricamento delle richieste. Controlla la console.</p>';
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
            nicknameRequestsListDiv.innerHTML +=
                '<p style="color:red;"><b>Nota:</b> Sembra mancare un indice Firestore per questa query. Controlla la console per il link per crearlo.</p>';
        }
    }
}

function addEventListenersToNicknameRequestButtons() {
    document.querySelectorAll('#nicknameRequestsList .approve-nickname-btn').forEach((button) => {
        button.removeEventListener('click', handleApproveNicknameClick);
        button.addEventListener('click', handleApproveNicknameClick);
    });
    document.querySelectorAll('#nicknameRequestsList .reject-nickname-btn').forEach((button) => {
        button.removeEventListener('click', handleRejectNicknameClick);
        button.addEventListener('click', handleRejectNicknameClick);
    });
}

async function handleApproveNicknameClick(e) {
    const button = e.currentTarget;
    const requestId = button.dataset.id;
    const userId = button.dataset.userid;
    const newNickname = button.dataset.newnickname;

    if (!requestId || !userId || !newNickname) {
        showToast('Dati mancanti per approvare la richiesta.', 'error');
        return;
    }

    const confirmed = await showConfirmationModal(
        'Conferma Approvazione Nickname',
        `Sei sicuro di voler APPROVARE il nickname "${newNickname}" per l'utente (ID: ${userId})?`
    );

    if (!confirmed) {
        showToast('Approvazione annullata.', 'info');
        return;
    }

    button.disabled = true;
    button.textContent = 'Approvazione...';

    try {
        const approveNicknameFunction = httpsCallable(functions, 'approveNicknameChange');
        const result = await approveNicknameFunction({ requestId, userId, newNickname });

        if (result.data.success) {
            // --- MODIFICA INIZIO ---
            // Messaggio di feedback dettagliato per l'admin
            const successMessage = `Richiesta approvata: L'utente (ID: ${userId}) ora ha il nickname "${newNickname}".`;
            showToast(successMessage, 'success');
            // --- MODIFICA FINE ---
            loadNicknameChangeRequests();
        } else {
            throw new Error(result.data.message || "Errore sconosciuto durante l'approvazione.");
        }
    } catch (error) {
        console.error('Errore durante la chiamata a approveNicknameChange:', error);
        const errorMessage = error.message || 'Si è verificato un errore. Riprova più tardi.';
        showToast(`Errore approvazione: ${errorMessage}`, 'error');
    } finally {
        button.disabled = false;
        button.textContent = 'Approva';
    }
}

async function handleRejectNicknameClick(e) {
    const button = e.currentTarget;
    const requestId = button.dataset.id;
    const userId = button.dataset.userid;
    const requestedNickname = button.dataset.requestednickname;

    if (!requestId || !userId) {
        showToast('Dati mancanti per rifiutare la richiesta.', 'error');
        return;
    }

    const reason = prompt(
        `Inserisci un motivo per RIFIUTARE la richiesta per "${requestedNickname}" (utente ID: ${userId}). Lascia vuoto se nessun motivo specifico.`
    );

    if (reason === null) {
        showToast('Rifiuto annullato.', 'info');
        return;
    }

    const finalReason = reason.trim();
    button.disabled = true;
    button.textContent = 'Rifiuto...';

    try {
        const rejectNicknameFunction = httpsCallable(functions, 'rejectNicknameChange');
        const result = await rejectNicknameFunction({ requestId, userId, reason: finalReason });

        if (result.data.success) {
            // --- MODIFICA INIZIO ---
            // Messaggio di feedback dettagliato per l'admin
            let toastMessage = `Richiesta per "${requestedNickname}" (utente ID: ${userId}) è stata rifiutata.`;
            if (finalReason) {
                toastMessage += ` Motivo: "${finalReason}"`;
            }
            showToast(toastMessage, 'success');
            // --- MODIFICA FINE ---
            loadNicknameChangeRequests();
        } else {
            throw new Error(result.data.message || 'Errore sconosciuto durante il rifiuto.');
        }
    } catch (error) {
        console.error('Errore durante la chiamata a rejectNicknameChange:', error);
        const errorMessage = error.message || 'Si è verificato un errore. Riprova più tardi.';
        showToast(`Errore rifiuto: ${errorMessage}`, 'error');
    } finally {
        button.disabled = false;
        button.textContent = 'Rifiuta';
    }
}

async function processArticleRejection(articleId, reason) {
    if (!articleId) {
        showToast('ID articolo mancante per il rifiuto.', 'error');
        return;
    }

    try {
        const articleRef = doc(db, 'articles', articleId);
        const updateData = {
            status: 'rejected',
            publishedAt: null,
            updatedAt: serverTimestamp(),
        };

        if (reason !== null && reason.trim() !== '') {
            updateData.rejectionReason = reason.trim();
        } else {
            updateData.rejectionReason = null;
        }

        await updateDoc(articleRef, updateData);

        showToast(
            'Articolo respinto con successo.' + (reason && reason.trim() !== '' ? ' Motivo salvato.' : ''),
            'success'
        );
        if (rejectReasonModal) rejectReasonModal.style.display = 'none';
        currentArticleIdToReject = null;

        loadPendingArticles();
        loadRejectedArticlesForAdmin();
    } catch (error) {
        console.error("Errore durante il respingimento dell'articolo:", error);
        showToast('Si è verificato un errore durante il respingimento. Riprova.', 'error');
    }
}

async function openEditArticleModal(articleId) {
    if (
        !editArticleModal ||
        !editingArticleIdInput ||
        !editArticleTitleInput ||
        !editArticleContentTextarea ||
        !editArticleTagsInput ||
        !editArticleSnippetInput ||
        !editArticleCoverImageUrlInput ||
        editArticleIsFeaturedCheckbox === undefined
    ) {
        console.error('Elementi della modale di modifica articolo non trovati.');
        return;
    }
    const articleRef = doc(db, 'articles', articleId);
    try {
        const docSnap = await getDoc(articleRef);
        if (docSnap.exists()) {
            const articleData = docSnap.data();
            editingArticleIdInput.value = articleId;
            editArticleTitleInput.value = articleData.title || '';
            initializeOrUpdateEditMarkdownEditor(articleData.contentMarkdown || '');
            editArticleTagsInput.value = (articleData.tags || []).join(', ');
            editArticleSnippetInput.value = articleData.snippet || '';
            editArticleCoverImageUrlInput.value = articleData.coverImageUrl || '';
            if (editArticleIsFeaturedCheckbox) editArticleIsFeaturedCheckbox.checked = articleData.isFeatured || false;

            const modalTitleEl = document.getElementById('editArticleModalTitle');
            if (modalTitleEl) {
                modalTitleEl.textContent = `Modifica Articolo: ${articleData.title || 'Senza Titolo'}`;
            }
            editArticleModal.style.display = 'block';
        } else {
            showToast('Articolo non trovato per la modifica.');
        }
    } catch (error) {
        console.error('Errore apertura modale modifica articolo:', error);
        showToast('Errore caricamento dati articolo per modifica.');
    }
}

function closeEditArticleModal() {
    if (editArticleModal) editArticleModal.style.display = 'none';
    destroyEditMarkdownEditor();
    if (editArticleForm) editArticleForm.reset();
    if (editingArticleIdInput) editingArticleIdInput.value = '';
    if (editArticleIsFeaturedCheckbox) editArticleIsFeaturedCheckbox.checked = false;
}

async function approveArticle(articleId) {
    if (!confirm(`Sei sicuro di voler APPROVARE e PUBBLICARE l'articolo ID: ${articleId}?`)) return;
    try {
        const articleRef = doc(db, 'articles', articleId);
        await updateDoc(articleRef, {
            status: 'published',
            publishedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        showToast('Articolo approvato e pubblicato!', 'success');
        loadPendingArticles();
        loadPublishedArticlesForAdmin();
    } catch (error) {
        console.error('Errore approvazione articolo:', error);
        showToast("Errore durante l'approvazione.", 'error');
    }
}

function formatAdminTimestamp(firebaseTimestamp) {
    if (firebaseTimestamp && typeof firebaseTimestamp.toDate === 'function') {
        return firebaseTimestamp.toDate().toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }
    return 'N/A';
}

function populateSelectWithOptions(selectElement, optionsArray, defaultOptionText, defaultOptionValue = 'all') {
    if (!selectElement) return;
    selectElement.innerHTML = '';
    if (defaultOptionText) {
        const defaultOpt = document.createElement('option');
        defaultOpt.value = defaultOptionValue;
        defaultOpt.textContent = defaultOptionText;
        selectElement.appendChild(defaultOpt);
    }
    optionsArray.forEach((optionValue) => {
        const opt = document.createElement('option');
        opt.value = optionValue;
        let text = optionValue.replace(/([A-Z])/g, ' $1').trim();
        text = text.charAt(0).toUpperCase() + text.slice(1);
        opt.textContent = text;
        selectElement.appendChild(opt);
    });
}

async function loadUserIssuesForAdmin() {
    if (!adminUserIssuesListDiv) {
        return;
    }
    adminUserIssuesListDiv.innerHTML = '<p>Caricamento segnalazioni e suggerimenti...</p>';
    try {
        const issuesCollectionRef = collection(db, 'userIssues');
        let q_issues;
        const filterType = adminFilterIssueTypeSelect ? adminFilterIssueTypeSelect.value : 'all';
        const filterStatus = adminFilterIssueStatusSelect ? adminFilterIssueStatusSelect.value : 'all';
        const conditions = [];
        if (filterType !== 'all') conditions.push(where('type', '==', filterType));
        if (filterStatus !== 'all') conditions.push(where('status', '==', filterStatus));

        const orderByField = 'timestamp';
        q_issues =
            conditions.length > 0
                ? query(issuesCollectionRef, ...conditions, orderBy(orderByField, 'desc'))
                : query(issuesCollectionRef, orderBy(orderByField, 'desc'));

        const querySnapshot = await getDocs(q_issues);
        if (querySnapshot.empty) {
            adminUserIssuesListDiv.innerHTML =
                '<p>Nessuna segnalazione o suggerimento trovato per i filtri selezionati.</p>';
            return;
        }
        adminUserIssuesListDiv.innerHTML = '';
        querySnapshot.forEach((docSnapshot) => {
            const issue = docSnapshot.data();
            const issueId = docSnapshot.id;
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('article-list-item');
            const submittedDate = formatAdminTimestamp(issue.timestamp);
            const gameIdText = issue.type === 'gameIssue' && issue.gameId ? ` (${issue.gameId})` : '';
            let readableType = issue.type;
            if (issue.type === 'generalFeature') readableType = 'Funzionalità Generale';
            else if (issue.type === 'newGameRequest') readableType = 'Nuovo Gioco';
            else if (issue.type === 'gameIssue') readableType = 'Problema Gioco';

            itemDiv.innerHTML = `
        <span class="article-info" style="flex-basis: 70%;">
          <strong>${issue.title || '<em>Senza titolo</em>'}</strong> <small>[Tipo: ${readableType}${gameIdText}]</small><br>
          <small>Autore: ${issue.submittedBy.userName || 'N/D'} | Inviato: ${submittedDate} | Upvotes: ${issue.upvotes || 0}</small><br>
          <small style="display:block; margin-top:5px; max-height: 60px; overflow-y:auto; background: var(--surface-bg-secondary); padding:5px; border-radius:3px;">Desc: <em>${issue.description.substring(0, 150)}${issue.description.length > 150 ? '...' : ''}</em></small>
        </span>
        <span class="actions" style="flex-basis: 30%; text-align:right;">
          <label for="statusSelect-${issueId}" style="font-size:0.8em; display:block; margin-bottom:3px;">Cambia Stato:</label>
          <select id="statusSelect-${issueId}" data-id="${issueId}" class="admin-issue-status-select" style="padding: 5px; font-size:0.9em; margin-bottom:5px;">
            ${ISSUE_STATUSES.map((s_val) => {
                let s_text = s_val.replace(/([A-Z])/g, ' $1').trim();
                s_text = s_text.charAt(0).toUpperCase() + s_text.slice(1);
                return `<option value="${s_val}" ${issue.status === s_val ? 'selected' : ''}>${s_text}</option>`;
            }).join('')}
          </select>
        </span>`;
            adminUserIssuesListDiv.appendChild(itemDiv);
        });
        document.querySelectorAll('.admin-issue-status-select').forEach((select) => {
            select.removeEventListener('change', handleIssueStatusChange);
            select.addEventListener('change', handleIssueStatusChange);
        });
    } catch (error) {
        console.error('Errore caricamento issue per admin:', error);
        if (adminUserIssuesListDiv) {
            adminUserIssuesListDiv.innerHTML =
                error.code === 'failed-precondition'
                    ? '<p>Errore: Indice Firestore mancante per i filtri o ordinamento. Controlla la console.</p>'
                    : '<p>Errore nel caricamento delle segnalazioni. Controlla la console.</p>';
        }
    }
}

async function handleIssueStatusChange(event) {
    const selectElement = event.target;
    const issueId = selectElement.dataset.id;
    const newStatus = selectElement.value;

    if (!issueId || !newStatus) {
        showToast('Errore: ID issue o nuovo stato non validi.');
        return;
    }
    if (!confirm(`Cambiare stato della issue ID: ${issueId} a "${newStatus}"?`)) {
        const issueRefForOldStatus = doc(db, 'userIssues', issueId);
        try {
            const docSnap = await getDoc(issueRefForOldStatus);
            if (docSnap.exists()) selectElement.value = docSnap.data().status;
        } catch (e) {
            console.error('Errore ripristino select status', e);
        }
        return;
    }

    try {
        const issueRef = doc(db, 'userIssues', issueId);
        await updateDoc(issueRef, { status: newStatus, updatedAt: serverTimestamp() });
        showToast(`Stato issue ${issueId} aggiornato a "${newStatus}".`);
        loadUserIssuesForAdmin();
    } catch (error) {
        console.error('Errore aggiornamento stato issue:', error);
        showToast("Errore durante l'aggiornamento stato.");
        loadUserIssuesForAdmin();
    }
}

const adminPublishedArticlesListDiv = document.getElementById('adminPublishedArticlesList');
const adminSearchPublishedTitleInput = document.getElementById('adminSearchPublishedTitle');
const adminApplyPublishedFiltersBtn = document.getElementById('adminApplyPublishedFiltersBtn');

async function loadPublishedArticlesForAdmin() {
    if (!adminPublishedArticlesListDiv) {
        return;
    }
    adminPublishedArticlesListDiv.innerHTML = '<p>Caricamento articoli pubblicati...</p>';
    try {
        const articlesCollectionRef = collection(db, 'articles');
        const baseQueryConstraints = [where('status', '==', 'published'), orderBy('publishedAt', 'desc')];
        const q_published_articles = query(articlesCollectionRef, ...baseQueryConstraints);

        const querySnapshot = await getDocs(q_published_articles);
        let articlesToDisplay = [];
        querySnapshot.forEach((docSnapshot) => articlesToDisplay.push({ id: docSnapshot.id, ...docSnapshot.data() }));

        const searchTerm = adminSearchPublishedTitleInput
            ? adminSearchPublishedTitleInput.value.trim().toLowerCase()
            : '';
        if (searchTerm) {
            articlesToDisplay = articlesToDisplay.filter(
                (article) => article.title && article.title.toLowerCase().includes(searchTerm)
            );
        }

        if (articlesToDisplay.length === 0) {
            adminPublishedArticlesListDiv.innerHTML = searchTerm
                ? '<p>Nessun articolo pubblicato trovato per la ricerca.</p>'
                : '<p>Nessun articolo pubblicato.</p>';
            return;
        }
        adminPublishedArticlesListDiv.innerHTML = '';
        articlesToDisplay.forEach((article) => {
            const articleId = article.id;
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('article-list-item');
            const publishedDate = formatAdminTimestamp(article.publishedAt);
            const updatedDate = formatAdminTimestamp(article.updatedAt);

            itemDiv.innerHTML = `
        <span class="article-info" style="flex-basis: 60%;">
          <strong>${article.title || '<em>Senza titolo</em>'}</strong><br>
          <small>Autore: ${article.authorName || article.authorId} | Pubblicato: ${publishedDate} | Ult. Mod.: ${updatedDate}</small>
        </span>
        <span class="actions" style="flex-basis: 40%; text-align:right;">
          <a href="view-article.html?id=${articleId}" target="_blank" class="game-button" style="text-decoration:none; margin-right:5px;">Anteprima</a>
          <button class="game-button edit-published-btn" data-id="${articleId}" style="margin-right:5px;">Modifica</button>
          <button class="game-button unpublish-btn" data-id="${articleId}" style="background-color: #ffc107; color: #333; margin-right:5px;">Rimuovi Pubbl.</button>
          <button class="game-button delete-published-btn" data-id="${articleId}" style="background-color: #dc3545; color: white;">Elimina</button>
        </span>`;
            adminPublishedArticlesListDiv.appendChild(itemDiv);
        });
        addEventListenersToPublishedArticleButtons();
    } catch (error) {
        console.error('Errore caricamento articoli pubblicati admin:', error);
        if (adminPublishedArticlesListDiv)
            adminPublishedArticlesListDiv.innerHTML = '<p>Errore caricamento articoli pubblicati.</p>';
    }
}

function addEventListenersToPublishedArticleButtons() {
    document.querySelectorAll('#adminPublishedArticlesList .edit-published-btn').forEach((button) => {
        button.removeEventListener('click', handleEditPublishedArticleClick);
        button.addEventListener('click', handleEditPublishedArticleClick);
    });
    document.querySelectorAll('#adminPublishedArticlesList .unpublish-btn').forEach((button) => {
        button.removeEventListener('click', handleUnpublishArticleClick);
        button.addEventListener('click', handleUnpublishArticleClick);
    });
    document.querySelectorAll('#adminPublishedArticlesList .delete-published-btn').forEach((button) => {
        button.removeEventListener('click', handleDeletePublishedArticleClick);
        button.addEventListener('click', handleDeletePublishedArticleClick);
    });
}

async function handleEditPublishedArticleClick(e) {
    await openEditArticleModal(e.target.dataset.id);
}

async function handleUnpublishArticleClick(e) {
    const articleId = e.target.dataset.id;
    const newStatus = 'draft';
    if (!confirm(`Rimuovere dalla pubblicazione l'articolo ID: ${articleId}? (Status diventerà: '${newStatus}')`))
        return;
    try {
        const articleRef = doc(db, 'articles', articleId);
        await updateDoc(articleRef, {
            status: newStatus,
            publishedAt: null,
            updatedAt: serverTimestamp(),
        });
        showToast(`Articolo ${articleId} rimosso dalla pubblicazione. Status: ${newStatus}.`);
        loadPublishedArticlesForAdmin();
        loadDraftArticlesForAdmin();
    } catch (error) {
        console.error('Errore rimozione pubblicazione:', error);
        showToast('Errore durante la rimozione dalla pubblicazione.', 'error');
    }
}

async function handleDeletePublishedArticleClick(e) {
    const articleId = e.target.dataset.id;
    if (!confirm(`ELIMINARE PERMANENTEMENTE l'articolo ID: ${articleId}? Azione IRREVERSIBILE.`)) return;
    try {
        const articleRef = doc(db, 'articles', articleId);
        await deleteDoc(articleRef);
        showToast(`Articolo ID: ${articleId} eliminato con successo.`);
        loadPublishedArticlesForAdmin();
    } catch (error) {
        console.error('Errore eliminazione articolo:', error);
        showToast("Errore durante l'eliminazione dell'articolo.", 'error');
    }
}

function initializeGuidelineToggles() {
    const guidelineToggleButtons = document.querySelectorAll('.guideline-toggle-btn');
    guidelineToggleButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const contentId = button.getAttribute('aria-controls');
            const contentElement = document.getElementById(contentId);
            const isExpanded = button.getAttribute('aria-expanded') === 'true';
            button.setAttribute('aria-expanded', String(!isExpanded));
            if (contentElement) contentElement.hidden = isExpanded;
        });
    });
}

async function loadDraftArticlesForAdmin() {
    if (!draftArticlesListDiv) {
        return;
    }
    draftArticlesListDiv.innerHTML = '<p>Caricamento bozze articoli...</p>';
    try {
        const articlesRef = collection(db, 'articles');
        const q = query(articlesRef, where('status', '==', 'draft'), orderBy('updatedAt', 'desc'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            draftArticlesListDiv.innerHTML = '<p>Nessuna bozza trovata.</p>';
            return;
        }
        draftArticlesListDiv.innerHTML = '';
        querySnapshot.forEach((docSnapshot) => {
            const article = docSnapshot.data();
            const articleId = docSnapshot.id;
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('article-list-item');
            const updatedDate = formatAdminTimestamp(article.updatedAt);
            const authorInfo = article.authorName || article.authorId;

            itemDiv.innerHTML = `
        <span class="article-info">
          <strong>${article.title || '<em>Bozza Senza Titolo</em>'}</strong><br>
          <small>Autore: ${authorInfo} | Ultima Modifica: ${updatedDate}</small>
        </span>
        <span class="actions">
          <button class="game-button view-edit-btn" data-id="${articleId}" style="margin-right:5px;">Visualizza/Modifica</button>
          <button class="game-button delete-draft-btn" data-id="${articleId}" style="background-color: #dc3545; color: white;">Elimina Bozza</button>
        </span>`;
            draftArticlesListDiv.appendChild(itemDiv);
        });
        addEventListenersToDraftArticleButtons();
    } catch (error) {
        console.error('Errore caricamento bozze articoli admin:', error);
        draftArticlesListDiv.innerHTML = '<p>Errore nel caricamento delle bozze.</p>';
    }
}

async function loadRejectedArticlesForAdmin() {
    if (!rejectedArticlesListDiv) {
        return;
    }
    rejectedArticlesListDiv.innerHTML = '<p>Caricamento articoli respinti...</p>';
    try {
        const articlesRef = collection(db, 'articles');
        const q = query(articlesRef, where('status', '==', 'rejected'), orderBy('updatedAt', 'desc'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            rejectedArticlesListDiv.innerHTML = '<p>Nessun articolo respinto trovato.</p>';
            return;
        }
        rejectedArticlesListDiv.innerHTML = '';
        querySnapshot.forEach((docSnapshot) => {
            const article = docSnapshot.data();
            const articleId = docSnapshot.id;
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('article-list-item');
            const rejectedDate = formatAdminTimestamp(article.updatedAt);
            const authorInfo = article.authorName || article.authorId;
            const rejectionReasonText = article.rejectionReason
                ? `<br><small style="color: var(--text-color-muted);">Motivo: ${article.rejectionReason}</small>`
                : '';

            itemDiv.innerHTML = `
        <span class="article-info">
          <strong>${article.title || '<em>Articolo Senza Titolo</em>'}</strong><br>
          <small>Autore: ${authorInfo} | Respinto il: ${rejectedDate}</small>
          ${rejectionReasonText}
        </span>
        <span class="actions">
          <button class="game-button view-edit-btn" data-id="${articleId}" style="margin-right:5px;">Visualizza/Modifica</button>
          <button class="game-button delete-rejected-btn" data-id="${articleId}" style="background-color: #dc3545; color: white;">Elimina Definitivamente</button>
        </span>`;
            rejectedArticlesListDiv.appendChild(itemDiv);
        });
        addEventListenersToRejectedArticleButtons();
    } catch (error) {
        console.error('Errore caricamento articoli respinti admin:', error);
        rejectedArticlesListDiv.innerHTML = '<p>Errore nel caricamento degli articoli respinti.</p>';
    }
}

function addEventListenersToDraftArticleButtons() {
    document.querySelectorAll('#draftArticlesList .view-edit-btn').forEach((button) => {
        button.removeEventListener('click', handleViewEditArticleClick);
        button.addEventListener('click', handleViewEditArticleClick);
    });
    document.querySelectorAll('#draftArticlesList .delete-draft-btn').forEach((button) => {
        button.removeEventListener('click', handleDeleteDraftArticleClick);
        button.addEventListener('click', handleDeleteDraftArticleClick);
    });
}

function addEventListenersToRejectedArticleButtons() {
    document.querySelectorAll('#rejectedArticlesList .view-edit-btn').forEach((button) => {
        button.removeEventListener('click', handleViewEditArticleClick);
        button.addEventListener('click', handleViewEditArticleClick);
    });
    document.querySelectorAll('#rejectedArticlesList .delete-rejected-btn').forEach((button) => {
        button.removeEventListener('click', handleDeleteRejectedArticleClick);
        button.addEventListener('click', handleDeleteRejectedArticleClick);
    });
}

async function handleDeleteDraftArticleClick(e) {
    const articleId = e.target.dataset.id;
    if (!confirm(`ELIMINARE PERMANENTEMENTE la BOZZA ID: ${articleId}? Azione IRREVERSIBILE.`)) return;
    try {
        const articleRef = doc(db, 'articles', articleId);
        await deleteDoc(articleRef);
        showToast(`Bozza ID: ${articleId} eliminata con successo.`);
        loadDraftArticlesForAdmin();
    } catch (error) {
        console.error('Errore eliminazione bozza:', error);
        showToast("Errore durante l'eliminazione della bozza.", 'error');
    }
}

async function handleDeleteRejectedArticleClick(e) {
    const articleId = e.target.dataset.id;
    if (!confirm(`ELIMINARE PERMANENTEMENTE l'articolo RESPINTO ID: ${articleId}? Azione IRREVERSIBILE.`)) return;
    try {
        const articleRef = doc(db, 'articles', articleId);
        await deleteDoc(articleRef);
        showToast(`Articolo respinto ID: ${articleId} eliminato con successo.`);
        loadRejectedArticlesForAdmin();
    } catch (error) {
        console.error('Errore eliminazione articolo respinto:', error);
        showToast("Errore durante l'eliminazione dell'articolo respinto.", 'error');
    }
}

async function checkAdminPermissions() {
    const user = auth.currentUser;
    if (user) {
        try {
            const userProfileRef = doc(db, 'userProfiles', user.uid);
            const docSnap = await getDoc(userProfileRef);
            if (docSnap.exists() && docSnap.data().isAdmin === true) {
                if (adminAuthMessageDiv) adminAuthMessageDiv.style.display = 'none';
                if (adminDashboardContentDiv) adminDashboardContentDiv.style.display = 'block';

                if (adminFilterIssueTypeSelect && adminFilterIssueTypeSelect.options.length <= 1) {
                    populateSelectWithOptions(adminFilterIssueTypeSelect, ISSUE_TYPES, 'Tutti i Tipi');
                }
                if (adminFilterIssueStatusSelect && adminFilterIssueStatusSelect.options.length <= 1) {
                    populateSelectWithOptions(adminFilterIssueStatusSelect, ISSUE_STATUSES, 'Tutti gli Stati');
                }

                loadPendingArticles();
                loadUserIssuesForAdmin();
                loadPublishedArticlesForAdmin();
                initializeGuidelineToggles();
                loadDraftArticlesForAdmin();
                loadRejectedArticlesForAdmin();
                loadNicknameChangeRequests();
                loadTesterMonitoringData();
            } else {
                if (adminAuthMessageDiv)
                    adminAuthMessageDiv.innerHTML = '<p>Accesso negato. <a href="index.html">Home</a></p>';
                if (adminDashboardContentDiv) adminDashboardContentDiv.style.display = 'none';
            }
        } catch (error) {
            console.error('Errore verifica permessi admin:', error);
            if (adminAuthMessageDiv)
                adminAuthMessageDiv.innerHTML = '<p>Errore verifica permessi. <a href="index.html">Home</a></p>';
            if (adminDashboardContentDiv) adminDashboardContentDiv.style.display = 'none';
        }
    } else {
        if (adminAuthMessageDiv) {
            adminAuthMessageDiv.innerHTML =
                '<p>Devi essere <a href="#" id="loginLinkFromAdminPage">loggato</a> come admin. <a href="index.html">Home</a></p>';
            const loginLink = document.getElementById('loginLinkFromAdminPage');
            if (loginLink && !loginLink.hasAttribute('data-listener-attached-admin-login')) {
                loginLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    const showLoginBtnGlobal = document.getElementById('showLoginBtn');
                    if (showLoginBtnGlobal) showLoginBtnGlobal.click();
                });
                loginLink.setAttribute('data-listener-attached-admin-login', 'true');
            }
        }
        if (adminDashboardContentDiv) adminDashboardContentDiv.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (closeEditArticleModalBtn) closeEditArticleModalBtn.addEventListener('click', closeEditArticleModal);

    if (editArticleModal) {
        editArticleModal.addEventListener('click', (event) => {
            if (event.target === editArticleModal) {
                closeEditArticleModal();
            }
        });
    }

    if (editArticleForm) {
        editArticleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const articleId = editingArticleIdInput.value;
            if (!articleId) {
                showToast('ID articolo mancante.');
                return;
            }

            const updatedTitle = editArticleTitleInput.value.trim();
            const updatedContentMarkdown = easyMDEEditInstance
                ? easyMDEEditInstance.value()
                : editArticleContentTextarea.value.trim();

            if (!updatedTitle || !updatedContentMarkdown) {
                showToast('Titolo e Contenuto sono obbligatori.');
                return;
            }

            const updates = {
                title: updatedTitle,
                contentMarkdown: updatedContentMarkdown,
                tags: editArticleTagsInput.value.trim()
                    ? editArticleTagsInput.value
                          .trim()
                          .split(',')
                          .map((tag) => tag.trim().toLowerCase())
                          .filter((tag) => tag)
                    : [],
                snippet: editArticleSnippetInput.value.trim(),
                coverImageUrl: editArticleCoverImageUrlInput.value.trim() || null,
                updatedAt: serverTimestamp(),
            };
            if (editArticleIsFeaturedCheckbox) {
                updates.isFeatured = editArticleIsFeaturedCheckbox.checked;
            }

            try {
                const articleRef = doc(db, 'articles', articleId);
                await updateDoc(articleRef, updates);
                showToast('Articolo modificato con successo!', 'success');
                closeEditArticleModal();
                loadPendingArticles();
                loadPublishedArticlesForAdmin();
                loadDraftArticlesForAdmin();
                loadRejectedArticlesForAdmin();
            } catch (error) {
                console.error('Errore salvataggio modifiche articolo admin:', error);
                showToast('Errore durante il salvataggio delle modifiche.', 'error');
            }
        });
    }

    if (adminApplyIssueFiltersBtn && !adminApplyIssueFiltersBtn.hasAttribute('data-listener-attached-issues')) {
        adminApplyIssueFiltersBtn.addEventListener('click', loadUserIssuesForAdmin);
        adminApplyIssueFiltersBtn.setAttribute('data-listener-attached-issues', 'true');
    }
    if (
        adminApplyPublishedFiltersBtn &&
        !adminApplyPublishedFiltersBtn.hasAttribute('data-listener-attached-published')
    ) {
        adminApplyPublishedFiltersBtn.addEventListener('click', loadPublishedArticlesForAdmin);
        adminApplyPublishedFiltersBtn.setAttribute('data-listener-attached-published', 'true');
    }

    // --- Event Listener per la Nuova Modale di Rifiuto ---
    if (closeRejectReasonModalBtn) {
        closeRejectReasonModalBtn.addEventListener('click', () => {
            if (rejectReasonModal) rejectReasonModal.style.display = 'none';
            currentArticleIdToReject = null;
        });
    }

    if (cancelRejectReasonBtn) {
        cancelRejectReasonBtn.addEventListener('click', () => {
            if (rejectReasonModal) rejectReasonModal.style.display = 'none';
            currentArticleIdToReject = null;
        });
    }

    if (rejectReasonForm) {
        rejectReasonForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const reason = rejectionReasonTextarea ? rejectionReasonTextarea.value.trim() : '';
            const articleIdFromInput = rejectingArticleIdInput
                ? rejectingArticleIdInput.value
                : currentArticleIdToReject;

            if (!articleIdFromInput) {
                showToast('Errore: ID articolo non trovato per confermare il rifiuto.', 'error');
                return;
            }
            await processArticleRejection(articleIdFromInput, reason);
        });
    }

    if (rejectReasonModal) {
        rejectReasonModal.addEventListener('click', (event) => {
            if (event.target === rejectReasonModal) {
                rejectReasonModal.style.display = 'none';
                currentArticleIdToReject = null;
            }
        });
    }
});

onAuthStateChanged(auth, (user) => {
    checkAdminPermissions();
});
