// js/firebase-config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';
import { getFunctions } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';

// La tua configurazione Firebase
const firebaseConfig = {
    apiKey: 'AIzaSyBrXQ4qwB9JhZF4kSIPyvxQYw1X4PGXpFk',
    authDomain: 'asyncdonkey.firebaseapp.com',
    projectId: 'asyncdonkey',
    storageBucket: 'asyncdonkey.firebasestorage.app',
    messagingSenderId: '939854468396',
    appId: '1:939854468396:web:9646d4f51737add7704889',
    measurementId: 'G-EQDBKQM3YE',
};

// Inizializza Firebase UNA SOLA VOLTA
const app = initializeApp(firebaseConfig);

// Crea ed esporta i servizi Firebase che ti servono
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'us-central1');

export { db, auth, storage, functions };