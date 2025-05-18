// functions/index.js

const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

// Importa specificamente le funzionalità da firestore
// Questo è spesso più robusto con diverse versioni dell'SDK e bundler.
const { FieldValue } = require("firebase-admin/firestore");


// Verifica se l'app è già stata inizializzata per evitare errori
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();
// const FieldValue = admin.firestore.FieldValue; // RIGA PRECEDENTE - LA COMMENTIAMO O RIMUOVIAMO

const BADGE_ID_AUTORE_DEBUTTANTE = "author-rookie";

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

// Potresti aggiungere altre funzioni qui in futuro...