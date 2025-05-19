// functions/index.js

const { onDocumentUpdated, onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onObjectFinalized } = require('firebase-functions/v2/storage');

const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');

const path = require('path');
const os = require('os');
const fs = require('fs-extra');
const sharp = require('sharp');

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

const BADGE_ID_AUTORE_DEBUTTANTE = 'author-rookie';
const BADGE_ID_GLITCHZILLA_SLAYER = 'glitchzilla-slayer';

exports.updateAuthorOnArticlePublish = onDocumentUpdated('articles/{articleId}', async (event) => {
    // ... (codice di updateAuthorOnArticlePublish invariato, come nelle versioni precedenti)
    if (!event.data) {
        logger.warn('Evento dati mancante, uscita anticipata.', { eventId: event.id });
        return;
    }
    const newValue = event.data.after.data();
    const previousValue = event.data.before.data();
    const articleId = event.params.articleId;
    if (!newValue || !previousValue) {
        logger.info('Uno degli snapshot (before/after) manca. Uscita.');
        return;
    }
    if (newValue.status === 'published' && previousValue.status !== 'published') {
        const authorId = newValue.authorId;
        if (!authorId) {
            logger.error("AuthorId mancante nell'articolo pubblicato:", articleId);
            return;
        }
        const userProfileRef = db.collection('userProfiles').doc(authorId);
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
            }
            const earnedBadges = userProfileData.earnedBadges || [];
            if (!earnedBadges.includes(BADGE_ID_AUTORE_DEBUTTANTE)) {
                if (FieldValue && typeof FieldValue.arrayUnion === 'function') {
                    profileUpdates.earnedBadges = FieldValue.arrayUnion(BADGE_ID_AUTORE_DEBUTTANTE);
                    logger.info(`Badge '${BADGE_ID_AUTORE_DEBUTTANTE}' verrà assegnato all'utente: ${authorId}`);
                } else {
                    logger.error('ERRORE CRITICO: FieldValue.arrayUnion non è una funzione!', {
                        fieldValueObject: FieldValue,
                    });
                }
            }
            if (Object.keys(profileUpdates).length > 0) {
                if (FieldValue && typeof FieldValue.serverTimestamp === 'function') {
                    profileUpdates.updatedAt = FieldValue.serverTimestamp();
                } else {
                    logger.error(
                        'ERRORE CRITICO: FieldValue.serverTimestamp non è una funzione! Uso Date() come fallback.',
                        { fieldValueObject: FieldValue }
                    );
                    profileUpdates.updatedAt = new Date();
                }
                await userProfileRef.update(profileUpdates);
                logger.info(`Profilo utente ${authorId} aggiornato con:`, profileUpdates);
            }
            return;
        } catch (error) {
            logger.error("Errore durante l'aggiornamento del profilo utente:", error, { authorId: authorId });
            return;
        }
    } else {
        return;
    }
});

exports.awardGlitchzillaSlayer = onDocumentCreated('leaderboardScores/{scoreId}', async (event) => {
    // ... (codice di awardGlitchzillaSlayer invariato, come nelle versioni precedenti)
    if (!event.data) {
        logger.warn('awardGlitchzillaSlayer: Evento dati mancante (nessun documento creato?).', { eventId: event.id });
        return;
    }
    const scoreData = event.data.data();
    const scoreId = event.params.scoreId;
    if (scoreData.userId && scoreData.glitchzillaDefeated === true) {
        const userId = scoreData.userId;
        const userProfileRef = db.collection('userProfiles').doc(userId);
        let profileUpdatesGlitch = {};
        try {
            const userProfileSnap = await userProfileRef.get();
            if (!userProfileSnap.exists) {
                logger.warn(
                    `awardGlitchzillaSlayer: Profilo utente non trovato per userId: ${userId} dal punteggio ${scoreId}`
                );
                return;
            }
            const userProfileData = userProfileSnap.data();
            if (userProfileData.hasDefeatedGlitchzilla !== true) {
                profileUpdatesGlitch.hasDefeatedGlitchzilla = true;
                logger.info(
                    `awardGlitchzillaSlayer: Flag 'hasDefeatedGlitchzilla' verrà impostato a true per l'utente: ${userId}`
                );
            }
            const earnedBadges = userProfileData.earnedBadges || [];
            if (!earnedBadges.includes(BADGE_ID_GLITCHZILLA_SLAYER)) {
                profileUpdatesGlitch.earnedBadges = FieldValue.arrayUnion(BADGE_ID_GLITCHZILLA_SLAYER);
                logger.info(
                    `awardGlitchzillaSlayer: Badge '${BADGE_ID_GLITCHZILLA_SLAYER}' verrà assegnato all'utente: ${userId}`
                );
            }
            if (Object.keys(profileUpdatesGlitch).length > 0) {
                profileUpdatesGlitch.updatedAt = FieldValue.serverTimestamp();
                await userProfileRef.update(profileUpdatesGlitch);
                logger.info(
                    `awardGlitchzillaSlayer: Profilo utente ${userId} aggiornato con i dati di Glitchzilla:`,
                    profileUpdatesGlitch
                );
            }
            return;
        } catch (error) {
            logger.error(
                "awardGlitchzillaSlayer: Errore durante l'aggiornamento del profilo utente per Glitchzilla:",
                error,
                { userId }
            );
            return;
        }
    } else {
        return;
    }
});

// --- CLOUD FUNCTION per Processare Avatar (CON NOME BUCKET CORRETTO) ---
const AVATAR_THUMBNAIL_SIZE = 48;
const AVATAR_PROFILE_SIZE = 160;

exports.processUploadedAvatar = onObjectFinalized(
    {
        bucket: 'asyncdonkey.firebasestorage.app', // <--- NOME CORRETTO DEL BUCKET!
        memory: '512MiB',
        timeoutSeconds: 120,
        cpu: 1,
    },
    async (event) => {
        const fileObject = event.data;
        const filePath = fileObject.name;
        const contentType = fileObject.contentType;
        const bucketName = fileObject.bucket; // Questo ora sarà "asyncdonkey.firebasestorage.app"

        logger.info(`Nuovo file rilevato: ${filePath} nel bucket ${bucketName} con tipo ${contentType}`);

        if (!contentType || !contentType.startsWith('image/')) {
            logger.log("Non è un'immagine. Uscita.");
            return null;
        }
        if (!filePath || !filePath.startsWith('user-avatars/')) {
            logger.log("File non nel percorso 'user-avatars/'. Uscita.");
            return null;
        }
        if (filePath.includes('/processed/')) {
            logger.log("File già processato (contiene '/processed/'). Uscita.");
            return null;
        }
        if (
            filePath.includes(`avatar_${AVATAR_THUMBNAIL_SIZE}.webp`) ||
            filePath.includes(`avatar_${AVATAR_PROFILE_SIZE}.webp`)
        ) {
            logger.log('File sembra essere già una versione processata. Uscita.');
            return null;
        }

        const parts = filePath.split('/');
        if (parts.length < 3) {
            logger.error('Percorso file non valido, impossibile estrarre userId:', filePath);
            return null;
        }
        const userId = parts[1];
        const originalFileName = parts[parts.length - 1];

        logger.info(`Processando avatar per utente ${userId} da ${originalFileName}`);

        const bucket = admin.storage().bucket(bucketName); // Usa il bucketName dall'evento

        const tempLocalOriginalPath = path.join(os.tmpdir(), originalFileName);
        const tempFileNameBaseForLocal = `${userId}_${Date.now()}`; // Usiamo un nome diverso per chiarezza
        const tempLocalThumbPath = path.join(
            os.tmpdir(),
            `avatar_${AVATAR_THUMBNAIL_SIZE}_${tempFileNameBaseForLocal}.webp`
        );
        const tempLocalProfilePath = path.join(
            os.tmpdir(),
            `avatar_${AVATAR_PROFILE_SIZE}_${tempFileNameBaseForLocal}.webp`
        );
        try {
            await bucket.file(filePath).download({ destination: tempLocalOriginalPath });
            logger.info('Immagine originale scaricata in:', tempLocalOriginalPath);

            await sharp(tempLocalOriginalPath)
                .resize(AVATAR_THUMBNAIL_SIZE, AVATAR_THUMBNAIL_SIZE, { fit: 'cover' })
                .webp({ quality: 80 })
                .toFile(tempLocalThumbPath);
            logger.info(`Thumbnail creata: ${tempLocalThumbPath}`);

            await sharp(tempLocalOriginalPath)
                .resize(AVATAR_PROFILE_SIZE, AVATAR_PROFILE_SIZE, { fit: 'cover' })
                .webp({ quality: 80 })
                .toFile(tempLocalProfilePath);
            logger.info(`Immagine profilo creata: ${tempLocalProfilePath}`);

            const thumbStoragePath = `user-avatars/${userId}/processed/avatar_small.webp`;
            const profileStoragePath = `user-avatars/${userId}/processed/avatar_profile.webp`;

            const [thumbUploadResponse] = await bucket.upload(tempLocalThumbPath, {
                destination: thumbStoragePath,
                metadata: { contentType: 'image/webp', cacheControl: 'public, max-age=3600' },
            });
            const [profileUploadResponse] = await bucket.upload(tempLocalProfilePath, {
                destination: profileStoragePath,
                metadata: { contentType: 'image/webp', cacheControl: 'public, max-age=3600' },
            });
            logger.info('Immagini processate caricate su Storage.');

            const thumbFile = thumbUploadResponse;
            const profileFile = profileUploadResponse;

            await thumbFile.makePublic();
            await profileFile.makePublic();

            const thumbUrl = thumbFile.publicUrl();
            const profileUrl = profileFile.publicUrl();

            logger.info('URL pubblici ottenuti:', { thumbUrl, profileUrl });

            const userProfileRef = db.collection('userProfiles').doc(userId);
            await userProfileRef.update({
                avatarUrls: {
                    small: thumbUrl,
                    profile: profileUrl,
                },
                profileUpdatedAt: FieldValue.serverTimestamp(),
            });
            logger.info(`Profilo utente ${userId} aggiornato con i nuovi URL avatar.`);

            await bucket.file(filePath).delete();
            logger.info(`Immagine originale ${filePath} cancellata da Storage.`);

            await fs.remove(tempLocalOriginalPath);
            await fs.remove(tempLocalThumbPath);
            await fs.remove(tempLocalProfilePath);
            logger.info('File temporanei locali cancellati.');

            return null;
        } catch (error) {
            logger.error("Errore durante il processamento dell'avatar:", error, { userId, filePath });
            await fs
                .remove(tempLocalOriginalPath)
                .catch((e) => logger.warn('Errore cancellazione temp original (in catch):', e));
            await fs
                .remove(tempLocalThumbPath)
                .catch((e) => logger.warn('Errore cancellazione temp thumb (in catch):', e));
            await fs
                .remove(tempLocalProfilePath)
                .catch((e) => logger.warn('Errore cancellazione temp profile (in catch):', e));
            return null;
        }
    }
);
// Potresti aggiungere altre funzioni qui in futuro...
