// js/bugReports.js

import { db, auth } from './main.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

console.log('bugReports.js caricato.');

// --- DOM ELEMENT REFERENCES ---
const bugReportForm = document.getElementById('bugReportForm');
const bugDescriptionInput = document.getElementById('bugDescription');
const userEmailBugInput = document.getElementById('userEmailBug');
const submitBugReportBtn = document.getElementById('submitBugReportBtn');
const bugReportMessageDiv = document.getElementById('bugReportMessage');
const bugReportUserEmailSection = document.getElementById('bugReportUserEmailSection');

// --- PAGE CONTEXT (potrebbe essere dinamico se questa pagina è usata per più contesti) ---
// Per ora, lo impostiamo fisso per donkeyRunnerGame se lo script è in donkeyRunner.html
// Altrimenti, potresti leggerlo da un data-attribute come per i commenti.
const PAGE_CONTEXT_BUG_REPORT = 'donkeyRunnerGame';

// Gestisci la visibilità del campo email in base allo stato di autenticazione
onAuthStateChanged(auth, (user) => {
    if (bugReportUserEmailSection) {
        if (user) {
            bugReportUserEmailSection.style.display = 'none'; // Nascondi se loggato
            if (userEmailBugInput) userEmailBugInput.required = false;
        } else {
            bugReportUserEmailSection.style.display = 'block'; // Mostra se non loggato
            if (userEmailBugInput) userEmailBugInput.required = false; // Rimane opzionale
        }
    }
});

async function handleSubmitBugReport(event) {
    event.preventDefault();
    if (!db) {
        bugReportMessageDiv.textContent = 'Errore: Connessione al database fallita.';
        bugReportMessageDiv.style.color = 'red';
        return;
    }
    if (!bugDescriptionInput || !submitBugReportBtn || !bugReportMessageDiv) {
        console.error('Elementi DOM del form bug report mancanti.');
        return;
    }

    const description = bugDescriptionInput.value.trim();
    const userEmail = userEmailBugInput ? userEmailBugInput.value.trim() : '';

    if (!description) {
        bugReportMessageDiv.textContent = 'Per favore, inserisci una descrizione del bug.';
        bugReportMessageDiv.style.color = 'orange';
        bugDescriptionInput.focus();
        return;
    }

    submitBugReportBtn.disabled = true;
    submitBugReportBtn.textContent = 'Invio in corso...';
    bugReportMessageDiv.textContent = ''; // Pulisci messaggi precedenti

    const bugData = {
        description: description,
        pageContext: PAGE_CONTEXT_BUG_REPORT, // Es. "donkeyRunnerGame", "indexPage", ecc.
        timestamp: serverTimestamp(),
        status: 'new', // Status iniziale
        userAgent: navigator.userAgent, // Informazioni sul browser dell'utente
    };

    const currentUser = auth.currentUser;
    if (currentUser) {
        bugData.userId = currentUser.uid;
        // Non aggiungiamo l'email dell'utente loggato automaticamente qui per privacy,
        // a meno che non sia un requisito esplicito e l'utente ne sia informato.
        // Se vogliono essere ricontattati, possono usare il campo email se non loggati.
    } else {
        if (userEmail) {
            // Solo se l'utente anonimo ha fornito un'email
            bugData.userEmail = userEmail;
        }
    }

    try {
        const bugReportsCollection = collection(db, 'bugReports');
        await addDoc(bugReportsCollection, bugData);

        bugReportMessageDiv.textContent = 'Grazie! La tua segnalazione è stata inviata con successo.';
        bugReportMessageDiv.style.color = 'green';
        if (bugReportForm) bugReportForm.reset(); // Pulisci il form
    } catch (error) {
        console.error('Errore invio segnalazione bug:', error);
        bugReportMessageDiv.textContent = "Si è verificato un errore durante l'invio. Riprova.";
        bugReportMessageDiv.style.color = 'red';
    } finally {
        submitBugReportBtn.disabled = false;
        submitBugReportBtn.textContent = 'Invia Segnalazione Bug';
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    if (bugReportForm) {
        bugReportForm.addEventListener('submit', handleSubmitBugReport);
    }

    // Inizializza la visibilità del campo email una volta al caricamento del DOM
    // (onAuthStateChanged potrebbe non scattare subito se lo stato è già definito)
    const user = auth.currentUser;
    if (bugReportUserEmailSection) {
        if (user) {
            bugReportUserEmailSection.style.display = 'none';
            if (userEmailBugInput) userEmailBugInput.required = false;
        } else {
            bugReportUserEmailSection.style.display = 'block';
            if (userEmailBugInput) userEmailBugInput.required = false;
        }
    }
});
