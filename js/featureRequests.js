// js/featureRequests.js

import { db, auth } from './main.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
// Non serve onAuthStateChanged qui se non gestiamo UI dinamica basata sul login per questo form specifico

console.log('featureRequests.js caricato.');

// --- DOM ELEMENT REFERENCES ---
const featureRequestForm = document.getElementById('featureRequestForm');
const featureTitleInput = document.getElementById('featureTitle');
const featureDescriptionInput = document.getElementById('featureDescription');
const submitFeatureRequestBtn = document.getElementById('submitFeatureRequestBtn');
const featureRequestMessageDiv = document.getElementById('featureRequestMessage');

// --- PAGE CONTEXT ---
const PAGE_CONTEXT_FEATURE_REQUEST = 'donkeyRunnerGame'; // O dinamico se necessario

async function handleSubmitFeatureRequest(event) {
    event.preventDefault();
    if (!db) {
        featureRequestMessageDiv.textContent = 'Errore: Connessione al database fallita.';
        featureRequestMessageDiv.style.color = 'red';
        return;
    }
    if (!featureDescriptionInput || !submitFeatureRequestBtn || !featureRequestMessageDiv) {
        console.error('Elementi DOM del form feature request mancanti.');
        return;
    }

    const title = featureTitleInput ? featureTitleInput.value.trim() : ''; // Titolo opzionale
    const description = featureDescriptionInput.value.trim();

    if (!description) {
        featureRequestMessageDiv.textContent = 'Per favore, inserisci una descrizione per il tuo suggerimento.';
        featureRequestMessageDiv.style.color = 'orange';
        featureDescriptionInput.focus();
        return;
    }

    submitFeatureRequestBtn.disabled = true;
    submitFeatureRequestBtn.textContent = 'Invio in corso...';
    featureRequestMessageDiv.textContent = '';

    const featureData = {
        description: description,
        pageContext: PAGE_CONTEXT_FEATURE_REQUEST,
        timestamp: serverTimestamp(),
        status: 'new', // Status iniziale (es. new, under consideration, planned, implemented, declined)
        upvotes: 0, // Inizializza gli upvotes a 0
    };

    if (title) {
        // Aggiungi il titolo solo se fornito
        featureData.title = title;
    }

    const currentUser = auth.currentUser;
    if (currentUser) {
        featureData.userId = currentUser.uid;
        // Potresti voler aggiungere anche il userName se facilmente accessibile
        // const userProfileRef = doc(db, "userProfiles", currentUser.uid);
        // const docSnap = await getDoc(userProfileRef);
        // if (docSnap.exists() && docSnap.data().nickname) {
        //     featureData.userName = docSnap.data().nickname;
        // }
    }

    try {
        const featureRequestsCollection = collection(db, 'featureRequests');
        await addDoc(featureRequestsCollection, featureData);

        featureRequestMessageDiv.textContent = 'Grazie! Il tuo suggerimento è stato inviato con successo.';
        featureRequestMessageDiv.style.color = 'green';
        if (featureRequestForm) featureRequestForm.reset();
    } catch (error) {
        console.error('Errore invio suggerimento funzionalità:', error);
        featureRequestMessageDiv.textContent = "Si è verificato un errore durante l'invio. Riprova.";
        featureRequestMessageDiv.style.color = 'red';
    } finally {
        submitFeatureRequestBtn.disabled = false;
        submitFeatureRequestBtn.textContent = 'Invia Suggerimento';
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    if (featureRequestForm) {
        featureRequestForm.addEventListener('submit', handleSubmitFeatureRequest);
    }
});
