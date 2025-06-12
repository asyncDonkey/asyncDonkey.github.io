// js/test-zone.js
import { auth, db, escapeHTML } from './main.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    serverTimestamp,
    setDoc, // MODIFICATO: Usiamo setDoc invece di addDoc per creare/aggiornare documenti con ID specifici
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { showToast } from './toastNotifications.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@5.0.1/lib/marked.esm.js';

// NUOVO: Configurazione di marked
marked.setOptions({
    breaks: true, // Interpreta le singole nuove righe come <br> (interruzioni di linea HTML)
    gfm: true, // Abilita GitHub Flavored Markdown (include tabelle, task lists, ecc.)
});

import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';

const functions = getFunctions();
const updateTestStepStatusCallable = httpsCallable(functions, 'updateTestStepStatus'); // QUESTA È LA TUA NUOVA CLOUD FUNCTION

// --- RIFERIMENTI DOM ---
const loader = document.getElementById('test-zone-loader');
const accessDeniedMessage = document.getElementById('access-denied-message');
const testZoneContent = document.getElementById('test-zone-content');
const testTasksListContainer = document.getElementById('test-tasks-list-container');
// --- NUOVI RIFERIMENTI PER GUIDELINES TOAST ---
const guidelinesToast = document.getElementById('guidelines-toast');
const dismissGuidelinesToastBtn = document.getElementById('dismiss-guidelines-toast');

let currentUserForTestZone = null;

/**
 * @param {object} taskData I dati del task.
 * @param {string} taskId L'ID del task.
 * @param {object|null} existingResult Il risultato del test già sottomesso dall'utente per questo task.
 * @returns {string} La stringa HTML per la task card.
 */
function createTaskCardHTML(taskData, taskId, existingResult) {
    let stepsHTML = '';
    // MODIFICA: Utilizza il nuovo campo 'steps' che è un array di oggetti
    if (taskData.steps && Array.isArray(taskData.steps) && taskData.steps.length > 0) {
        let stepsListHtml = '';
        const completedSteps = existingResult ? existingResult.completedSteps || [] : [];
        const isCompletedOrFailed =
            existingResult && (existingResult.outcome === 'success' || existingResult.outcome === 'failure');

        taskData.steps.forEach((step) => {
            const isChecked = completedSteps.includes(step.id) ? 'checked' : '';
            // Disabilita la checkbox se il task è già stato completato o ha fallito
            const isDisabled = isCompletedOrFailed ? 'disabled' : '';
            stepsListHtml += `
                <div class="test-step-item">
                    <input type="checkbox" id="step-${taskId}-${step.id}" data-task-id="${taskId}" data-step-id="${step.id}" class="test-step-checkbox" ${isChecked} ${isDisabled}>
                    <label for="step-${taskId}-${step.id}">${marked.parse(step.description)}</label>
                </div>
            `;
        });
        stepsHTML = `<div class="test-task-details-section"><strong>Passaggi:</strong><div class="formatted-text steps-list">${stepsListHtml}</div></div>`;
    } else {
        // Fallback per vecchi dati o dati malformati
        stepsHTML = taskData.stepsToReproduce // Controlla il vecchio nome del campo come fallback
            ? `<div class="test-task-details-section"><strong>Passaggi:</strong><div class="formatted-text">${marked.parse(taskData.stepsToReproduce)}</div></div>`
            : '';
    }

    const expectedHTML = taskData.expectedBehavior
        ? `<div class="test-task-details-section"><strong>Risultato Atteso:</strong><div class="formatted-text">${marked.parse(taskData.expectedBehavior)}</div></div>`
        : '';
    const areaHTML = taskData.area
        ? `<p class="test-task-area"><strong>Area:</strong> ${escapeHTML(taskData.area)}</p>`
        : '';

    // NUOVO: Logica per mostrare lo stato "sottomesso" o i pulsanti di azione
    let actionsOrStatusHTML;
    if (existingResult) {
        const outcomeClass = existingResult.outcome === 'success' ? 'success' : 'failure';
        const outcomeText = existingResult.outcome === 'success' ? 'Successo' : 'Fallimento';
        actionsOrStatusHTML = `
            <div id="feedback-submitted-message-${taskId}" class="feedback-submitted-message" style="display: block; margin-top: 15px; padding: 10px; background-color: var(--${outcomeClass}-bg-light); border-left: 4px solid var(--${outcomeClass}-color); color: var(--${outcomeClass}-color-dark);">
                <p style="margin:0;"><strong>Esito inviato: ${outcomeText}</strong></p>
                ${existingResult.comment ? `<p style="margin:5px 0 0 0; font-style: italic;">"${escapeHTML(existingResult.comment)}"</p>` : ''}
            </div>
            <div class="task-actions" id="task-actions-${taskId}" style="margin-top: 10px;">
                <button class="game-button secondary-button edit-feedback-button" data-task-id="${taskId}">
                    <span class="material-symbols-rounded">edit</span> Modifica Esito
                </button>
            </div>
        `;
    } else {
        actionsOrStatusHTML = `
            <div class="task-actions" id="task-actions-${taskId}" style="margin-top: 15px;">
    <p>Questo task è stato completato con successo?</p>
                <button class="game-button success-button outcome-button" data-task-id="${taskId}" data-outcome="success">
                    <span class="material-symbols-rounded">check_circle</span> Sì, Successo!
                </button>
                <button class="game-button failure-button outcome-button" data-task-id="${taskId}" data-outcome="failure" style="margin-left: 10px;">
                    <span class="material-symbols-rounded">cancel</span> No, Fallimento
                </button>
            </div>
        `;
    }

    return `
        <div class="test-task-card" id="task-card-${taskId}" data-task-id="${taskId}">
            <h3>${escapeHTML(taskData.title) || 'Task Senza Titolo'}</h3>
            <div class="test-task-description formatted-text">${marked.parse(taskData.description || 'Nessuna descrizione.')}</div>
            ${areaHTML}
            ${stepsHTML}
            ${expectedHTML}

            ${actionsOrStatusHTML}

            <div id="feedback-form-container-${taskId}" class="feedback-form-container" style="display: none; margin-top: 15px;">
                <h4>Fornisci Feedback per "${escapeHTML(taskData.title)}"</h4>
                <textarea id="feedback-comment-${taskId}" class="input-field" placeholder="Aggiungi un commento (opzionale, max 2000 caratteri)..." maxlength="2000" rows="4">${existingResult ? escapeHTML(existingResult.comment) : ''}</textarea>
                <div class="form-actions" style="margin-top:10px;">
                    <button class="game-button submit-feedback-button" data-task-id="${taskId}">${existingResult ? 'Aggiorna Feedback' : 'Invia Feedback'}</button>
                    <button class="game-button secondary-button cancel-feedback-button" data-task-id="${taskId}" style="margin-left: 10px;">Annulla</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Gestisce il click su una checkbox di uno step di test.
 * @param {Event} event L'evento di click.
 */
async function handleTestStepCheckboxClick(event) {
    const checkbox = event.target;
    if (!checkbox.classList.contains('test-step-checkbox')) return;

    const taskId = checkbox.dataset.taskId;
    const stepId = checkbox.dataset.stepId;
    const isCompleted = checkbox.checked;

    if (!currentUserForTestZone) {
        showToast('Devi essere loggato per marcare gli step.', 'info');
        checkbox.checked = !isCompleted; // Ripristina lo stato
        return;
    }

    try {
        const response = await updateTestStepStatusCallable({ taskId, stepId, isCompleted });
        if (response.data.success) {
            // showToast('Stato step aggiornato!', 'success'); // Meno toast, per non essere troppo intrusivo
        } else {
            showToast('Errore: ' + response.data.message, 'error');
            checkbox.checked = !isCompleted; // Ripristina lo stato
        }
    } catch (error) {
        console.error('Errore chiamata Cloud Function per aggiornare step:', error);
        showToast('Errore durante l_aggiornamento dello step. Riprova.', 'error');
        checkbox.checked = !isCompleted; // Ripristina lo stato
    }
}

/**
 * // MODIFICATO: Salva o aggiorna il risultato del test in Firestore usando setDoc.
 * @param {string} taskId L'ID del task.
 * @param {string} outcome L'esito ('success' o 'failure').
 * @param {string} comment Il commento dell'utente.
 */
async function saveTestResult(taskId, outcome, comment) {
    if (!currentUserForTestZone) {
        showToast('Errore: utente non identificato per salvare il feedback.', 'error');
        return;
    }

    const submitButton = document.querySelector(`.submit-feedback-button[data-task-id="${taskId}"]`);
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Salvataggio...';
    }

    try {
        // NUOVO: Creiamo un riferimento al documento usando l'ID del task.
        const testResultDocRef = doc(db, 'userProfiles', currentUserForTestZone.uid, 'testResults', taskId);

        await setDoc(testResultDocRef, {
            taskId: taskId,
            outcome: outcome,
            comment: comment || '',
            timestamp: serverTimestamp(),
            testerId: currentUserForTestZone.uid,
        });

        showToast('Feedback inviato con successo!', 'success');

        // NUOVO: Ricarica solo i task per aggiornare la UI in modo consistente
        await loadTestTasks();
    } catch (error) {
        console.error('Errore nel salvare il risultato del test:', error);
        showToast('Errore durante il salvataggio del feedback. Riprova.', 'error');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Invia Feedback';
        }
    }
}

/**
 * // MODIFICATO: Gestisce i click anche per il nuovo pulsante "Modifica Esito".
 */
function setupTaskFeedbackListeners() {
    if (!testTasksListContainer) return;

    // DICHIARA LA VARIABILE QUI
    let currentOutcomeForTask = {};

    // Rimuovi eventuali listener duplicati prima di aggiungerli (molto importante per loadTestTasks)
    testTasksListContainer.removeEventListener('click', handleTestStepCheckboxClick);
    testTasksListContainer.removeEventListener('click', handleTaskActionClicks); // Nuova funzione per i bottoni esistenti

    testTasksListContainer.addEventListener('click', handleTestStepCheckboxClick);
    testTasksListContainer.addEventListener('click', handleTaskActionClicks);

    // Aggiungi una funzione separata per gestire i click sui bottoni di submit/edit/cancel
    // Questo aiuta a mantenere la logica più organizzata.
    function handleTaskActionClicks(event) {
        const target = event.target;
        const button = target.closest('button'); // Trova il bottone più vicino

        if (!button) return;

        const taskId = button.dataset.taskId;
        if (!taskId) return;

        const feedbackFormContainer = document.getElementById(`feedback-form-container-${taskId}`);
        const taskActionsContainer = document.getElementById(`task-actions-${taskId}`);
        const commentTextarea = document.getElementById(`feedback-comment-${taskId}`);

        // Gestione pulsanti "Successo" / "Fallimento"
        if (button.classList.contains('outcome-button')) {
            // Puoi anche aggiornare l'outcome solo quando l'utente invia il feedback
            // Per ora, lo usiamo per mostrare il form
            currentOutcomeForTask[taskId] = button.dataset.outcome;
            if (feedbackFormContainer) {
                feedbackFormContainer.style.display = 'block';
                if (commentTextarea) commentTextarea.focus();
            }
        }
        // Gestione pulsante "Modifica Esito"
        else if (button.classList.contains('edit-feedback-button')) {
            if (taskActionsContainer) taskActionsContainer.style.display = 'none';
            if (feedbackFormContainer) feedbackFormContainer.style.display = 'block';
            // Potresti voler ricaricare qui il commento esistente nel textarea se non lo è già
        }
        // Gestione pulsante "Invia Feedback" / "Aggiorna Feedback"
        else if (button.classList.contains('submit-feedback-button')) {
            // Se l'outcome non è stato scelto (es. in modalità modifica), lo recuperiamo dallo stato precedente
            if (!currentOutcomeForTask[taskId]) {
                const card = document.getElementById(`task-card-${taskId}`);
                if (card.querySelector('.feedback-submitted-message.success')) {
                    currentOutcomeForTask[taskId] = 'success';
                } else if (card.querySelector('.feedback-submitted-message.failure')) {
                    currentOutcomeForTask[taskId] = 'failure';
                }
            }
            // Cerca di inferire l'esito dalla UI se non è stato cliccato un nuovo pulsante
            if (!currentOutcomeForTask[taskId]) {
                const submittedMessage = document.querySelector(`#feedback-submitted-message-${taskId} p strong`);
                if (submittedMessage) {
                    const text = submittedMessage.textContent.toLowerCase();
                    if (text.includes('successo')) {
                        currentOutcomeForTask[taskId] = 'success';
                    } else if (text.includes('fallimento')) {
                        currentOutcomeForTask[taskId] = 'failure';
                    }
                }
            }

            const outcome = currentOutcomeForTask[taskId];
            const comment = commentTextarea ? commentTextarea.value.trim() : '';

            if (!outcome) {
                showToast("Errore critico: impossibile determinare l'esito. Selezionalo di nuovo.", 'error');
                return;
            }
            saveTestResult(taskId, outcome, comment);
            delete currentOutcomeForTask[taskId];
        }
        // Gestione pulsante "Annulla"
        else if (button.classList.contains('cancel-feedback-button')) {
            // Semplicemente ricarichiamo per tornare allo stato salvato, è la via più semplice e robusta
            loadTestTasks();
        }
        if (event.target.tagName.toLowerCase() === 'textarea') {
            event.target.style.height = 'auto';
            event.target.style.height = `${event.target.scrollHeight}px`;
        }
    }
}

/**
 * // MODIFICATO: Carica sia i task sia i risultati esistenti del tester.
 */
async function loadTestTasks() {
    if (!testTasksListContainer || !currentUserForTestZone) return;
    testTasksListContainer.innerHTML = '<p>Caricamento task di test...</p>';

    try {
        // 1. NUOVO: Recupera i risultati dei test già sottomessi dall'utente
        const testResultsCollectionRef = collection(db, 'userProfiles', currentUserForTestZone.uid, 'testResults');
        const resultsSnapshot = await getDocs(testResultsCollectionRef);
        const userResultsMap = new Map();
        resultsSnapshot.forEach((doc) => {
            userResultsMap.set(doc.id, doc.data());
        });

        // 2. Recupera le definizioni dei task attivi
        const q = query(
            collection(db, 'testTasksDefinition'),
            where('status', '==', 'active'),
            orderBy('priority', 'asc'),
            orderBy('createdAt', 'desc')
        );
        const tasksSnapshot = await getDocs(q);

        if (tasksSnapshot.empty) {
            testTasksListContainer.innerHTML =
                '<p>Nessun task di test attivo al momento. Grazie per la tua disponibilità!</p>';
            return;
        }

        // 3. Renderizza i task, passando i risultati esistenti
        let tasksHTML = '';
        tasksSnapshot.forEach((taskDoc) => {
            const taskId = taskDoc.id;
            const taskData = taskDoc.data();
            const existingResult = userResultsMap.get(taskId) || null;
            tasksHTML += createTaskCardHTML(taskData, taskId, existingResult);
        });
        testTasksListContainer.innerHTML = tasksHTML;

        // Listener viene settato una volta dopo il rendering completo
        // La gestione è stata spostata in initializeTestZone per evitare duplicazioni
    } catch (error) {
        console.error('Errore nel caricare i task di test da Firestore:', error);
        testTasksListContainer.innerHTML =
            '<p style="color: var(--error-color);">Errore nel caricamento dei task. Riprova più tardi.</p>';
        showToast('Errore nel caricamento dei task di test.', 'error');
    }
}

/**
 * Inizializza la pagina verificando lo stato di autenticazione e i permessi dell'utente.
 */
function initializeTestZone() {
    if (loader) loader.style.display = 'block';
    if (accessDeniedMessage) accessDeniedMessage.style.display = 'none';
    if (testZoneContent) testZoneContent.style.display = 'none';

    // NUOVO: Inizializza il listener una sola volta qui.
    setupTaskFeedbackListeners();

    onAuthStateChanged(auth, async (user) => {
        currentUserForTestZone = user;
        if (user) {
            const userProfileRef = doc(db, 'userProfiles', user.uid);
            try {
                const docSnap = await getDoc(userProfileRef);
                if (docSnap.exists() && docSnap.data().isTestUser === true) {
                    console.log("Accesso autorizzato. L'utente è un tester.");
                    if (loader) loader.style.display = 'none';
                    if (accessDeniedMessage) accessDeniedMessage.style.display = 'none';
                    if (testZoneContent) testZoneContent.style.display = 'block';
                    // --- NUOVA LOGICA PER IL TOAST DELLE LINEE GUIDA ---
                    if (guidelinesToast && dismissGuidelinesToastBtn) {
                        // Mostra il toast solo se non è già stato chiuso in questa sessione
                        if (sessionStorage.getItem('engineRoomToastDismissed') !== 'true') {
                            guidelinesToast.style.display = 'flex';
                        }

                        // Aggiungi il listener per chiudere il toast
                        dismissGuidelinesToastBtn.addEventListener('click', () => {
                            guidelinesToast.style.display = 'none';
                            sessionStorage.setItem('engineRoomToastDismissed', 'true');
                        });
                    }
                    await loadTestTasks(); // Usa await per coerenza
                } else {
                    console.log("Accesso negato. L'utente non è un tester o il profilo non esiste.");
                    if (loader) loader.style.display = 'none';
                    if (testZoneContent) testZoneContent.style.display = 'none';
                    if (accessDeniedMessage) accessDeniedMessage.style.display = 'block';
                }
            } catch (error) {
                console.error('Errore nel recuperare il profilo utente:', error);
                if (loader)
                    loader.innerHTML = "<p style='color: var(--error-color);'>Errore nel verificare i permessi.</p>";
                if (testZoneContent) testZoneContent.style.display = 'none';
                if (accessDeniedMessage) accessDeniedMessage.style.display = 'block';
                showToast('Errore verifica permessi.', 'error');
            }
        } else {
            console.log('Accesso negato. Utente non autenticato.');
            if (loader) loader.style.display = 'none';
            if (testZoneContent) testZoneContent.style.display = 'none';
            if (accessDeniedMessage) accessDeniedMessage.style.display = 'block';
        }
    });
}

// --- ESECUZIONE ---
document.addEventListener('DOMContentLoaded', () => {
    initializeTestZone();
});
