// functions/index.js

const { onDocumentUpdated, onDocumentCreated } = require("firebase-functions/v2/firestore"); // AGGIUNTO onDocumentCreated
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore"); // Usiamo l'import diretto




// Verifica se l'app è già stata inizializzata per evitare errori
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();
// const FieldValue = admin.firestore.FieldValue; // RIGA PRECEDENTE - LA COMMENTIAMO O RIMUOVIAMO

const BADGE_ID_AUTORE_DEBUTTANTE = "author-rookie";
const BADGE_ID_GLITCHZILLA_SLAYER = "glitchzilla-slayer"; // NUOVO ID BADGE


exports.updateAuthorOnArticlePublish = onDocumentUpdated("articles/{articleId}", async (event) => {
    if (!event.data) {
        logger.warn("Evento dati mancante, uscita anticipata.", { eventId: event.id });
        return;
    }

    const newValue = event.data.after.data();
    const previousValue = event.data.before.data();
    const articleId = event.params.articleId;

    logger.info(`Articolo aggiornato: ${articleId}`);
    logger.info("Stato precedente:", previousValue ? previousValue.status : "N/A");
    logger.info("Nuovo stato:", newValue ? newValue.status : "N/A");

    if (!newValue || !previousValue) {
        logger.info("Uno degli snapshot (before/after) manca. Uscita.");
        return;
    }

    if (newValue.status === "published" && previousValue.status !== "published") {
        const authorId = newValue.authorId;

        if (!authorId) {
            logger.error("AuthorId mancante nell'articolo pubblicato:", articleId);
            return;
        }

        const userProfileRef = db.collection("userProfiles").doc(authorId);
        let profileUpdates = {};

        try {
            const userProfileSnap = await userProfileRef.get();

            if (!userProfileSnap.exists) {
                logger.warn(`Profilo utente non trovato per authorId: ${authorId}`);
                return;
            }

            const userProfileData = userProfileSnap.data();

            if (userProfileData.hasPublishedArticles !== true) {
                profileUpdates.hasPublishedArticles = true;
                logger.info(`Flag 'hasPublishedArticles' verrà impostato a true per l'utente: ${authorId}`);
            } else {
                logger.info(`L'utente ${authorId} ha già il flag hasPublishedArticles.`);
            }

            const earnedBadges = userProfileData.earnedBadges || [];
            if (!earnedBadges.includes(BADGE_ID_AUTORE_DEBUTTANTE)) {
                // Log di debug PRIMA dell'uso di FieldValue
                logger.debug("Tentativo di usare FieldValue.arrayUnion. FieldValue è:", FieldValue);
                if (FieldValue && typeof FieldValue.arrayUnion === 'function') {
                    profileUpdates.earnedBadges = FieldValue.arrayUnion(BADGE_ID_AUTORE_DEBUTTANTE);
                    logger.info(`Badge '${BADGE_ID_AUTORE_DEBUTTANTE}' verrà assegnato all'utente: ${authorId}`);
                } else {
                    logger.error("ERRORE CRITICO: FieldValue.arrayUnion non è una funzione!", { fieldValueObject: FieldValue });
                    // Fallback o gestione errore se arrayUnion non è disponibile
                    // Per ora, non aggiorniamo i badge se c'è questo problema per evitare errori
                }
            } else {
                logger.info(`L'utente ${authorId} ha già il badge '${BADGE_ID_AUTORE_DEBUTTANTE}'.`);
            }
            
            if (Object.keys(profileUpdates).length > 0) {
                 // Log di debug PRIMA dell'uso di FieldValue.serverTimestamp
                logger.debug("Tentativo di usare FieldValue.serverTimestamp. FieldValue è:", FieldValue);
                if (FieldValue && typeof FieldValue.serverTimestamp === 'function') {
                    profileUpdates.updatedAt = FieldValue.serverTimestamp();
                } else {
                    logger.error("ERRORE CRITICO: FieldValue.serverTimestamp non è una funzione! Uso Date() come fallback.", { fieldValueObject: FieldValue });
                    profileUpdates.updatedAt = new Date(); // Fallback, anche se meno ideale
                }
                
                await userProfileRef.update(profileUpdates);
                logger.info(`Profilo utente ${authorId} aggiornato con:`, profileUpdates);
            } else {
                logger.info(`Nessun aggiornamento necessario al profilo utente ${authorId} per questo evento.`);
            }
            return;
        } catch (error) {
            logger.error("Errore durante l'aggiornamento del profilo utente:", error, { authorId: authorId });
            return;
        }
    } else {
        logger.info("L'articolo non è diventato 'published' o lo era già. Nessuna azione per badge/flag.");
        return;
    }
});

// --- NUOVA Funzione per Glitchzilla Slayer Badge/Flag ---
exports.awardGlitchzillaSlayer = onDocumentCreated("leaderboardScores/{scoreId}", async (event) => {
    if (!event.data) {
        logger.warn("awardGlitchzillaSlayer: Evento dati mancante (nessun documento creato?).", { eventId: event.id });
        return;
    }

    const scoreData = event.data.data(); // Dati del nuovo documento score
    const scoreId = event.params.scoreId;

    // logger.info(`Nuovo punteggio registrato: ${scoreId}`, { scoreData });

    // Controlla se l'utente è loggato (ha userId) e se ha sconfitto Glitchzilla
    if (scoreData.userId && scoreData.glitchzillaDefeated === true) {
        const userId = scoreData.userId;
        const userProfileRef = db.collection("userProfiles").doc(userId);
        let profileUpdatesGlitch = {};

        try {
            const userProfileSnap = await userProfileRef.get();

            if (!userProfileSnap.exists) {
                logger.warn(`awardGlitchzillaSlayer: Profilo utente non trovato per userId: ${userId} dal punteggio ${scoreId}`);
                return;
            }

            const userProfileData = userProfileSnap.data();

            // 1. Imposta il flag 'hasDefeatedGlitchzilla' se non già true
            if (userProfileData.hasDefeatedGlitchzilla !== true) {
                profileUpdatesGlitch.hasDefeatedGlitchzilla = true;
                logger.info(`awardGlitchzillaSlayer: Flag 'hasDefeatedGlitchzilla' verrà impostato a true per l'utente: ${userId}`);
            } else {
                logger.info(`awardGlitchzillaSlayer: L'utente ${userId} ha già il flag hasDefeatedGlitchzilla.`);
            }

            // 2. Assegna il badge "Glitchzilla Slayer" se non già presente
            const earnedBadges = userProfileData.earnedBadges || [];
            if (!earnedBadges.includes(BADGE_ID_GLITCHZILLA_SLAYER)) {
                profileUpdatesGlitch.earnedBadges = FieldValue.arrayUnion(BADGE_ID_GLITCHZILLA_SLAYER);
                logger.info(`awardGlitchzillaSlayer: Badge '${BADGE_ID_GLITCHZILLA_SLAYER}' verrà assegnato all'utente: ${userId}`);
                
                // Potremmo aggiungere una notifica qui in futuro
            } else {
                logger.info(`awardGlitchzillaSlayer: L'utente ${userId} ha già il badge '${BADGE_ID_GLITCHZILLA_SLAYER}'.`);
            }

            // Esegui l'aggiornamento solo se ci sono modifiche da fare
            if (Object.keys(profileUpdatesGlitch).length > 0) {
                profileUpdatesGlitch.updatedAt = FieldValue.serverTimestamp(); // Aggiorna sempre il timestamp del profilo
                
                await userProfileRef.update(profileUpdatesGlitch);
                logger.info(`awardGlitchzillaSlayer: Profilo utente ${userId} aggiornato con i dati di Glitchzilla:`, profileUpdatesGlitch);
            } else {
                logger.info(`awardGlitchzillaSlayer: Nessun aggiornamento necessario al profilo utente ${userId} per questo punteggio.`);
            }
            return;

        } catch (error) {
            logger.error("awardGlitchzillaSlayer: Errore durante l'aggiornamento del profilo utente per Glitchzilla:", error, { userId });
            return;
        }
    } else {
        // logger.info(`awardGlitchzillaSlayer: Punteggio ${scoreId} non riguarda un utente loggato o Glitchzilla non sconfitto.`);
        return;
    }
});
// Potresti aggiungere altre funzioni qui in futuro...