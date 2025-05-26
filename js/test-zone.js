import { auth, db } from './main.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// --- RIFERIMENTI DOM ---
const loader = document.getElementById('test-zone-loader');
const accessDeniedMessage = document.getElementById('access-denied-message');
const testZoneContent = document.getElementById('test-zone-content');
const testTasksListContainer = document.getElementById('test-tasks-list-container');

/**
 * Funzione per caricare e visualizzare i task di test.
 * (Per ora è un placeholder, la implementeremo nel prossimo passo)
 */
function loadTestTasks() {
    console.log("Logica per caricare i task di test da Firestore andrà qui.");
    // Esempio di come potrebbe apparire l'UI
    testTasksListContainer.innerHTML = `
        <div class="test-task-card">
            <h3>Task #001: Registrazione Nuovo Utente</h3>
            <p><strong>Obiettivo:</strong> Verificare che il flusso di registrazione funzioni correttamente.</p>
            <div class="task-actions">
                <button class="game-button">Test Superato</button>
                <button class="game-button secondary-button">Test Fallito</button>
            </div>
        </div>
        <div class="test-task-card">
            <h3>Task #002: Cambio Nickname</h3>
            <p><strong>Obiettivo:</strong> Provare a cambiare il nickname e verificare l'effetto.</p>
            <div class="task-actions">
                <button class="game-button">Test Superato</button>
                <button class="game-button secondary-button">Test Fallito</button>
            </div>
        </div>
    `;
}


/**
 * Inizializza la pagina verificando lo stato di autenticazione e i permessi dell'utente.
 */
function initializeTestZone() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // L'utente è loggato, controlliamo il suo profilo
            const userProfileRef = doc(db, 'userProfiles', user.uid);
            try {
                const docSnap = await getDoc(userProfileRef);

                if (docSnap.exists() && docSnap.data().isTestUser === true) {
                    // L'utente è un tester autorizzato
                    console.log("Accesso autorizzato. L'utente è un tester.");
                    loader.style.display = 'none';
                    accessDeniedMessage.style.display = 'none';
                    testZoneContent.style.display = 'block';
                    loadTestTasks(); // Carica i task di test
                } else {
                    // L'utente non è un tester
                    console.log("Accesso negato. L'utente non è un tester.");
                    loader.style.display = 'none';
                    accessDeniedMessage.style.display = 'block';
                }
            } catch (error) {
                console.error("Errore nel recuperare il profilo utente:", error);
                loader.textContent = "Errore nel verificare i permessi.";
                accessDeniedMessage.style.display = 'block';
            }
        } else {
            // L'utente non è loggato
            console.log("Accesso negato. Utente non autenticato.");
            loader.style.display = 'none';
            accessDeniedMessage.style.display = 'block';
        }
    });
}

// --- ESECUZIONE ---
document.addEventListener('DOMContentLoaded', () => {
    initializeTestZone();
});