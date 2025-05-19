// functions/index.js

const { onDocumentUpdated, onDocumentCreated } = require("firebase-functions/v2/firestore");
// NUOVO IMPORT per Storage Trigger V2
const { onObjectFinalized } = require("firebase-functions/v2/storage"); 

const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore"); 

// NUOVI IMPORT per processamento immagini
const path = require("path"); // Modulo Node.js per lavorare con i percorsi file
const os = require("os");     // Modulo Node.js per accedere a info del sistema operativo (es. tmpdir)
const fs = require("fs-extra"); // File system extra, utile per creare/cancellare directory temporanee
const sharp = require("sharp"); // Libreria per processamento immagini

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();
const storage = admin.storage(); // Inizializza Storage Admin SDK

const BADGE_ID_AUTORE_DEBUTTANTE = "author-rookie";
const BADGE_ID_GLITCHZILLA_SLAYER = "glitchzilla-slayer";


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

// --- NUOVA CLOUD FUNCTION per Processare Avatar ---
const AVATAR_THUMBNAIL_SIZE = 48; // px per avatar_small.webp
const AVATAR_PROFILE_SIZE = 160;  // px per avatar_profile.webp

exports.processUploadedAvatar = onObjectFinalized(
    {
        bucket: "asyncdonkey.appspot.com", // Specifica il bucket di default del tuo progetto
        memory: "512MiB", // Aumenta la memoria allocata
        timeoutSeconds: 120,  // Aumenta il timeout
        cpu: 1, // CPU di default, può essere aumentato se necessario
    }, 
    async (event) => {
        const fileObject = event.data; // Oggetto metadata del file caricato
        const filePath = fileObject.name; // Es. 'user-avatars/userId123/original_timestamp.jpg'
        const contentType = fileObject.contentType; // Es. 'image/jpeg'
        const bucketName = fileObject.bucket;

        logger.info(`Nuovo file rilevato: ${filePath} nel bucket ${bucketName} con tipo ${contentType}`);

        // 1. Verifica che sia un'immagine e nel percorso corretto
        if (!contentType || !contentType.startsWith("image/")) {
            logger.log("Non è un immagine. Uscita.");
            return null;
        }
        if (!filePath || !filePath.startsWith("user-avatars/")) {
            logger.log("File non nel percorso 'user-avatars/'. Uscita.");
            return null;
        }
        if (filePath.includes("/processed/")) { // Evita loop infiniti se salviamo i processati in un subfolder "processed"
            logger.log("File già processato (contiene '/processed/'). Uscita.");
            return null;
        }
        // Evita di processare le versioni già ridimensionate se per errore vengono caricate qui
        if (filePath.includes(`avatar_${AVATAR_THUMBNAIL_SIZE}.webp`) || filePath.includes(`avatar_${AVATAR_PROFILE_SIZE}.webp`)) {
            logger.log("File sembra essere già una versione processata. Uscita.");
            return null;
        }


        // Estrai userId e nome file originale
        const parts = filePath.split("/"); // ["user-avatars", "userId123", "original_timestamp.jpg"]
        if (parts.length < 3) {
            logger.error("Percorso file non valido, impossibile estrarre userId:", filePath);
            return null;
        }
        const userId = parts[1];
        const originalFileName = parts[parts.length - 1]; // L'ultimo elemento è il nome file

        logger.info(`Processando avatar per utente ${userId} da ${originalFileName}`);

        const bucket = storage.bucket(bucketName);
        const tempLocalOriginalPath = path.join(os.tmpdir(), originalFileName);
        const tempLocalThumbPath = path.join(os.tmpdir(), `avatar_${AVATAR_THUMBNAIL_SIZE}_${userId}.webp`);
        const tempLocalProfilePath = path.join(os.tmpdir(), `avatar_${AVATAR_PROFILE_SIZE}_${userId}.webp`);

        try {
            // 2. Scarica l'immagine originale in una directory temporanea della Cloud Function
            await bucket.file(filePath).download({ destination: tempLocalOriginalPath });
            logger.info("Immagine originale scaricata in:", tempLocalOriginalPath);

            // 3. Processa l'immagine per creare le due versioni con Sharp
            // Thumbnail (avatar_small)
            await sharp(tempLocalOriginalPath)
                .resize(AVATAR_THUMBNAIL_SIZE, AVATAR_THUMBNAIL_SIZE, { fit: 'cover' }) // 'cover' per riempire senza distorcere, tagliando se necessario
                .webp({ quality: 80 }) // Converti in WebP con qualità 80
                .toFile(tempLocalThumbPath);
            logger.info(`Thumbnail creata: ${tempLocalThumbPath}`);

            // Profile (avatar_profile)
            await sharp(tempLocalOriginalPath)
                .resize(AVATAR_PROFILE_SIZE, AVATAR_PROFILE_SIZE, { fit: 'cover' })
                .webp({ quality: 80 })
                .toFile(tempLocalProfilePath);
            logger.info(`Immagine profilo creata: ${tempLocalProfilePath}`);

            // 4. Carica le immagini processate su Storage
            const thumbStoragePath = `user-avatars/${userId}/processed/avatar_small.webp`;
            const profileStoragePath = `user-avatars/${userId}/processed/avatar_profile.webp`;

            const [thumbUploadResponse] = await bucket.upload(tempLocalThumbPath, {
                destination: thumbStoragePath,
                metadata: { contentType: "image/webp" },
            });
            const [profileUploadResponse] = await bucket.upload(tempLocalProfilePath, {
                destination: profileStoragePath,
                metadata: { contentType: "image/webp" },
            });
            logger.info("Immagini processate caricate su Storage.");
            
            
            // 5. Ottieni gli URL di download pubblici (o firmati, a seconda della tua configurazione)
            // Per URL pubblici, le regole di Storage devono permettere la lettura pubblica
            const thumbFile = thumbUploadResponse; 
const profileFile = profileUploadResponse;


await thumbFile.makePublic(); // Assicurati che questa riga ci sia prima di publicUrl()
await profileFile.makePublic(); // Assicurati che questa riga ci sia prima di publicUrl()
// Per ottenere URL pubblici, i file devono essere resi pubblici o usare URL firmati
// Rendiamo i file pubblici prima di ottenere l'URL (o assicurati che le regole lo permettano)
await thumbFile.makePublic();
await profileFile.makePublic();

const thumbUrl = thumbFile.publicUrl();
const profileUrl = profileFile.publicUrl();

logger.info("URL pubblici ottenuti:", { thumbUrl, profileUrl });

            // 6. Aggiorna Firestore con i nuovi URL
            const userProfileRef = db.collection("userProfiles").doc(userId);
            await userProfileRef.update({
                avatarUrls: {
                    small: thumbUrl,
                    profile: profileUrl,
                },
                profileUpdatedAt: FieldValue.serverTimestamp(), // O un campo dedicato per l'avatar
            });
            logger.info(`Profilo utente ${userId} aggiornato con i nuovi URL avatar.`);

            // 7. (Opzionale) Cancella l'immagine originale e i file temporanei
            await bucket.file(filePath).delete();
            logger.info(`Immagine originale ${filePath} cancellata da Storage.`);
            
            await fs.remove(tempLocalOriginalPath);
            await fs.remove(tempLocalThumbPath);
            await fs.remove(tempLocalProfilePath);
            logger.info("File temporanei locali cancellati.");

            return null;

        } catch (error) {
            logger.error("Errore durante il processamento dell'avatar:", error, { userId, filePath });
            // Cancella file temporanei anche in caso di errore, se esistono
            await fs.remove(tempLocalOriginalPath).catch(e => logger.error("Errore cancellazione temp original:", e));
            await fs.remove(tempLocalThumbPath).catch(e => logger.error("Errore cancellazione temp thumb:", e));
            await fs.remove(tempLocalProfilePath).catch(e => logger.error("Errore cancellazione temp profile:", e));
            return null;
        }
    }
);
// Potresti aggiungere altre funzioni qui in futuro...