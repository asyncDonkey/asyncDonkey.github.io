// js/test-zone.js
import { auth, db, escapeHTML } from './main.js'; // Aggiunto escapeHTML
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
    addDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'; // Aggiunte nuove importazioni
import { showToast } from './toastNotifications.js';
// --- RIFERIMENTI DOM ---
const loader = document.getElementById('test-zone-loader');
const accessDeniedMessage = document.getElementById('access-denied-message');
const testZoneContent = document.getElementById('test-zone-content');
const testTasksListContainer = document.getElementById('test-tasks-list-container');

let currentUserForTestZone = null; // Per memorizzare l'utente loggato

/**
 * Crea l'HTML per una singola card di un task di test.
 * @param {object} taskData I dati del task.
 * @param {string} taskId L'ID del task.
 * @returns {string} La stringa HTML per la task card.
 */
function createTaskCardHTML(taskData, taskId) {
    const stepsHTML = taskData.stepsToReproduce
        ? `<div class="test-task-details-section"><strong>Passaggi:</strong><div class="formatted-text">${escapeHTML(taskData.stepsToReproduce).replace(/\n/g, '<br>')}</div></div>`
        : '';
    const expectedHTML = taskData.expectedBehavior
        ? `<div class="test-task-details-section"><strong>Risultato Atteso:</strong><div class="formatted-text">${escapeHTML(taskData.expectedBehavior).replace(/\n/g, '<br>')}</div></div>`
        : '';
    const areaHTML = taskData.area
        ? `<p class="test-task-area"><strong>Area:</strong> ${escapeHTML(taskData.area)}</p>`
        : '';

    return `
        <div class="test-task-card" id="task-card-${taskId}" data-task-id="${taskId}">
            <h3>${escapeHTML(taskData.title) || 'Task Senza Titolo'}</h3>
            <p class="test-task-description">${escapeHTML(taskData.description) || 'Nessuna descrizione.'}</p>
            ${areaHTML}
            ${stepsHTML}
            ${expectedHTML}
            <div class="task-actions" id="task-actions-${taskId}" style="margin-top: 15px;">
                <p style="font-weight: bold; margin-bottom: 8px;">Questo task è stato completato con successo?</p>
                <button class="game-button success-button outcome-button" data-task-id="${taskId}" data-outcome="success">
                    <span class="material-symbols-rounded">check_circle</span> Sì, Successo!
                </button>
                <button class="game-button failure-button outcome-button" data-task-id="${taskId}" data-outcome="failure" style="margin-left: 10px;">
                    <span class="material-symbols-rounded">cancel</span> No, Fallimento
                </button>
            </div>
            <div id="feedback-form-container-${taskId}" class="feedback-form-container" style="display: none; margin-top: 15px;">
                <h4>Fornisci Feedback per "${escapeHTML(taskData.title)}"</h4>
                <textarea id="feedback-comment-${taskId}" class="input-field" placeholder="Aggiungi un commento (opzionale, max 2000 caratteri)..." maxlength="2000" rows="4"></textarea>
                <div class="form-actions" style="margin-top:10px;">
                    <button class="game-button submit-feedback-button" data-task-id="${taskId}">Invia Feedback</button>
                    <button class="game-button secondary-button cancel-feedback-button" data-task-id="${taskId}" style="margin-left: 10px;">Annulla</button>
                </div>
            </div>
            <div id="feedback-submitted-message-${taskId}" class="feedback-submitted-message" style="display: none; margin-top: 15px; padding: 10px; background-color: var(--success-bg-light); border-left: 4px solid var(--success-color); color: var(--success-color-dark);">
                <p style="margin:0;">Grazie per il tuo feedback!</p>
            </div>
        </div>
    `;
}

/**
 * Salva il risultato del test in Firestore.
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
        const testResultsCollectionRef = collection(db, 'userProfiles', currentUserForTestZone.uid, 'testResults');
        await addDoc(testResultsCollectionRef, {
            taskId: taskId,
            outcome: outcome,
            comment: comment || '', // Salva stringa vuota se non c'è commento
            timestamp: serverTimestamp(),
            testerId: currentUserForTestZone.uid, // Aggiunto per completezza, anche se è nella subcollection
        });

        showToast('Feedback inviato con successo!', 'success');

        // Nascondi il form e i pulsanti di outcome, mostra messaggio di ringraziamento
        const feedbackFormContainer = document.getElementById(`feedback-form-container-${taskId}`);
        const taskActionsContainer = document.getElementById(`task-actions-${taskId}`);
        const feedbackSubmittedMessage = document.getElementById(`feedback-submitted-message-${taskId}`);

        if (feedbackFormContainer) feedbackFormContainer.style.display = 'none';
        if (taskActionsContainer) taskActionsContainer.style.display = 'none'; // Nasconde i pulsanti Successo/Fallimento
        if (feedbackSubmittedMessage) feedbackSubmittedMessage.style.display = 'block';
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
 * Gestisce i click sui pulsanti all'interno delle task card.
 */
function setupTaskFeedbackListeners() {
    if (!testTasksListContainer) return;

    // Variabile per memorizzare l'esito scelto
    let currentOutcomeForTask = {};

    testTasksListContainer.addEventListener('click', async (event) => {
        const target = event.target;
        const button = target.closest('button'); // Trova il bottone più vicino se si clicca su un'icona interna

        if (!button) return;

        const taskId = button.dataset.taskId;
        if (!taskId) return;

        const feedbackFormContainer = document.getElementById(`feedback-form-container-${taskId}`);
        const commentTextarea = document.getElementById(`feedback-comment-${taskId}`);

        // Gestione pulsanti "Successo" / "Fallimento"
        if (button.classList.contains('outcome-button')) {
            currentOutcomeForTask[taskId] = button.dataset.outcome; // Memorizza l'esito per questo task
            if (feedbackFormContainer) {
                feedbackFormContainer.style.display = 'block';
                if (commentTextarea) commentTextarea.focus();
            }
            console.log(`Task ${taskId} outcome scelto: ${currentOutcomeForTask[taskId]}`);
        }
        // Gestione pulsante "Invia Feedback"
        else if (button.classList.contains('submit-feedback-button')) {
            const outcome = currentOutcomeForTask[taskId]; // Recupera l'esito memorizzato
            const comment = commentTextarea ? commentTextarea.value.trim() : '';

            if (!outcome) {
                showToast("Per favore, seleziona prima 'Successo' o 'Fallimento'.", 'warning');
                return;
            }
            await saveTestResult(taskId, outcome, comment);
            delete currentOutcomeForTask[taskId]; // Pulisce l'esito memorizzato dopo l'invio
        }
        // Gestione pulsante "Annulla" (nel form di feedback)
        else if (button.classList.contains('cancel-feedback-button')) {
            if (feedbackFormContainer) feedbackFormContainer.style.display = 'none';
            if (commentTextarea) commentTextarea.value = ''; // Pulisce il commento
            delete currentOutcomeForTask[taskId]; // Pulisce l'esito memorizzato
            console.log(`Feedback annullato per task ${taskId}`);
        }
    });
}

/**
 * Funzione per caricare e visualizzare i task di test.
 */
async function loadTestTasks() {
    if (!testTasksListContainer) return;
    testTasksListContainer.innerHTML = '<p>Caricamento task di test...</p>';

    try {
        const q = query(
            collection(db, 'testTasksDefinition'),
            where('status', '==', 'active'),
            orderBy('priority', 'asc'),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            testTasksListContainer.innerHTML =
                '<p>Nessun task di test attivo al momento. Grazie per la tua disponibilità!</p>';
            return;
        }

        let tasksHTML = '';
        querySnapshot.forEach((doc) => {
            tasksHTML += createTaskCardHTML(doc.data(), doc.id);
        });
        testTasksListContainer.innerHTML = tasksHTML;
        setupTaskFeedbackListeners(); // Chiama per aggiungere i listener ai nuovi elementi
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

    onAuthStateChanged(auth, async (user) => {
        currentUserForTestZone = user; // Memorizza l'utente corrente
        if (user) {
            const userProfileRef = doc(db, 'userProfiles', user.uid);
            try {
                const docSnap = await getDoc(userProfileRef);
                if (docSnap.exists() && docSnap.data().isTestUser === true) {
                    console.log("Accesso autorizzato. L'utente è un tester.");
                    if (loader) loader.style.display = 'none';
                    if (accessDeniedMessage) accessDeniedMessage.style.display = 'none';
                    if (testZoneContent) testZoneContent.style.display = 'block';
                    loadTestTasks();
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
