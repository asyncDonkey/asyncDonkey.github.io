// functions/appGameHandler.js

const { HttpsError, onCall } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore'); // Ora questa variabile verrà usata!

// Assicurati che l'SDK di admin sia inizializzato
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();

/**
 * Funzione Callable per registrare il risultato di una partita.
 */
exports.submitGameResult = onCall({ region: 'us-central1' }, async (request) => {
    const functionName = 'submitGameResult';

    if (!request.auth || !request.auth.uid) {
        logger.warn(`[CF:${functionName}] Chiamata non autenticata.`);
        throw new HttpsError('unauthenticated', 'Devi essere autenticato per registrare un punteggio.');
    }
    const userId = request.auth.uid;

    const { score, bossesDefeated } = request.data;
    if (typeof score !== 'number' || score < 0 || typeof bossesDefeated !== 'number' || bossesDefeated < 0) {
        throw new HttpsError('invalid-argument', 'I dati inviati (score, bossesDefeated) non sono validi.');
    }

    const userDocRef = db.collection('appUsers').doc(userId);

    try {
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userDocRef);

            if (!userDoc.exists) {
                throw new HttpsError('not-found', 'Documento utente non trovato.');
            }

            const currentStats = userDoc.data().gameStats || {};
            const currentHighestScore = currentStats.highestScore || 0;

            // L'unica statistica che dobbiamo calcolare manualmente è il nuovo punteggio massimo.
            const newHighestScore = Math.max(currentHighestScore, score);

            // Per tutto il resto, usiamo gli operatori atomici di Firebase.
            // Usiamo la "dot notation" per aggiornare campi specifici dentro la mappa 'gameStats'.
            const updates = {
                'gameStats.gamesPlayed': FieldValue.increment(1),
                'gameStats.totalScore': FieldValue.increment(score),
                'gameStats.bossesDefeated': FieldValue.increment(bossesDefeated),
                'gameStats.highestScore': newHighestScore // Questo deve essere impostato direttamente
            };

            transaction.update(userDocRef, updates);
        });

        logger.info(`[CF:${functionName}] Statistiche aggiornate per l'utente ${userId}.`);
        return { success: true, message: 'Statistiche aggiornate con successo!' };

    } catch (error) {
        logger.error(`[CF:${functionName}] Errore durante l'aggiornamento delle statistiche per ${userId}:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'Impossibile aggiornare le statistiche.');
    }
});