// functions/index.js (Versione Corretta e Refattorizzata)

// Firebase Functions v2 imports
const { onDocumentUpdated, onDocumentCreated, onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { onObjectFinalized } = require('firebase-functions/v2/storage');
const { HttpsError, onCall } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');

// Firebase Admin SDK imports
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');

// Node.js core modules
const path = require('path');
const os = require('os');

// Third-party libraries
const fs = require('fs-extra');
const sharp = require('sharp');

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

// --- PROJECT-SPECIFIC MODULES ---
const userPublicProfileSync = require('./userPublicProfileSync');
const { createNotification } = require('./notificationUtils');
const nicknameHandlers = require('./nicknameRequestHandler');

// --- CONSTANTS ---
// BADGE_DETAILS è stato rimosso. Ora leggiamo le definizioni direttamente da Firestore.
const BADGE_ID_AUTORE_DEBUTTANTE = 'author-rookie';
const BADGE_ID_GLITCHZILLA_SLAYER = 'glitchzilla-slayer';
const BADGE_ID_VERIFIED_USER = 'verified-user';
const BADGE_ID_THE_DEBUGGATOR = 'the-debuggator';

const BADGE_ID_ARTICLE_COMMENTER = 'article-commenter'; // Per 10 commenti su articoli
const BADGE_ID_GUESTBOOK_INTERACTIVE = 'guestbook-interactive'; // Per 15 commenti su guestbook
const BADGE_ID_CONTENT_EXPLORER = 'content-explorer'; // Per commenti su 3 articoli diversi

const BADGE_ID_ARTICLE_PATRON = 'article-patron'; // NUOVO: Per 5 like ad articoli diversi
const BADGE_ID_EARLY_ADOPTER = 'early-adopter'; // NUOVO

const BADGE_ID_APPRECIATED_AUTHOR = 'appreciated-author';

/**
 * Helper per recuperare i dettagli di un badge da Firestore.
 * Potremmo aggiungere un livello di cache qui in futuro se necessario.
 * @param {string} badgeId L'ID del badge da recuperare.
 * @returns {Promise<object|null>} I dati del badge o null se non trovato.
 */
async function getBadgeDetails(badgeId) {
    try {
        const badgeRef = db.collection('badgeDefinitions').doc(badgeId);
        const doc = await badgeRef.get();
        if (doc.exists) {
            return doc.data();
        }
        logger.warn(`[getBadgeDetails] Dettagli non trovati per il badge ID: ${badgeId}`);
        return null;
    } catch (error) {
        logger.error(`[getBadgeDetails] Errore nel recuperare i dettagli del badge ${badgeId}:`, error);
        return null;
    }
}

async function sendNewBadgeNotification(userId, badgeId) {
    const badgeInfo = await getBadgeDetails(badgeId);
    if (badgeInfo) {
        await createNotification(userId, {
            type: 'new_badge',
            title: 'Nuovo Badge Sbloccato!',
            message: `Congratulazioni! Hai ottenuto il badge: "${badgeInfo.name}".`,
            icon: badgeInfo.icon,
            link: '/profile.html#badgesSection',
            relatedItemId: badgeId,
        });
    }
}

// --- USER PUBLIC PROFILE SYNC FUNCTIONS ---
exports.createUserPublicProfile = onDocumentCreated(
    'userProfiles/{userId}',
    userPublicProfileSync.handleCreateUserPublicProfile
);
exports.updateUserPublicProfile = onDocumentUpdated(
    'userProfiles/{userId}',
    userPublicProfileSync.handleUpdateUserPublicProfile
);
exports.deleteUserPublicProfile = onDocumentDeleted(
    'userProfiles/{userId}',
    userPublicProfileSync.handleDeleteUserPublicProfile
);

// --- ARTICLE STATUS NOTIFICATIONS ---
exports.handleArticleStatusNotifications = onDocumentUpdated('articles/{articleId}', async (event) => {
    if (!event.data) return;
    const articleAfter = event.data.after.data();
    const articleBefore = event.data.before.data();
    const articleId = event.params.articleId;
    if (!articleAfter || !articleBefore) return;
    const authorId = articleAfter.authorId;
    if (!authorId) return;

    if (articleBefore.status !== articleAfter.status) {
        if (articleAfter.status === 'published') {
            await createNotification(authorId, {
                type: 'article_published',
                title: 'Articolo Pubblicato!',
                message: `Il tuo articolo "${articleAfter.title || 'Senza titolo'}" è stato pubblicato.`,
                link: `/view-article.html?id=${articleId}`,
                icon: 'check_circle',
                relatedItemId: articleId,
            });
        } else if (articleAfter.status === 'rejected') {
            const reason = articleAfter.rejectionReason || 'Nessun motivo specificato.';
            await createNotification(authorId, {
                type: 'article_rejected',
                title: 'Articolo Respinto',
                message: `Il tuo articolo "${articleAfter.title || 'Senza titolo'}" è stato respinto. Motivo: ${reason}`,
                link: `/submit-article.html?id=${articleId}`,
                icon: 'error',
                relatedItemId: articleId,
            });
        }
    }
});

// --- NOTIFY ADMINS ON NEW NICKNAME REQUEST ---
exports.notifyAdminsOnNewNicknameRequest = onDocumentCreated('nicknameChangeRequests/{requestId}', async (event) => {
    const functionName = 'notifyAdminsOnNewNicknameRequest';
    if (!event.data) return;
    const requestData = event.data.data();
    const requestingUserId = requestData.userId;
    const requestedNickname = requestData.requestedNickname;
    if (!requestingUserId || !requestedNickname) return;
    const currentNickname = requestData.currentNickname || 'un utente';

    try {
        const adminsSnapshot = await db.collection('userProfiles').where('isAdmin', '==', true).get();
        if (adminsSnapshot.empty) return;
        const adminIds = adminsSnapshot.docs.map((doc) => doc.id);
        const notificationPayload = {
            type: 'admin_new_nickname_request',
            title: 'Nuova Richiesta Nickname',
            message: `L'utente ${currentNickname} ha richiesto il nuovo nickname: "${requestedNickname}".`,
            link: '/admin-dashboard.html#nickname-requests-section',
            icon: 'manage_accounts',
            relatedItemId: event.params.requestId,
        };
        const notificationPromises = adminIds.map((adminId) => {
            if (adminId === requestingUserId) return null;
            return createNotification(adminId, notificationPayload);
        });
        await Promise.all(notificationPromises.filter((p) => p !== null));
    } catch (error) {
        logger.error(`[CF:${functionName}] Failed to send nickname request notifications.`, { error: error });
    }
});

// --- BADGE AND AUTHOR UPDATE LOGIC ---
exports.updateAuthorOnArticlePublish = onDocumentUpdated('articles/{articleId}', async (event) => {
    if (!event.data) return;
    const newValue = event.data.after.data();
    const previousValue = event.data.before.data();
    if (!newValue || !previousValue) return;

    if (newValue.status === 'published' && previousValue.status !== 'published') {
        const authorId = newValue.authorId;
        if (!authorId) return;
        const userProfileRef = db.collection('userProfiles').doc(authorId);
        try {
            await db.runTransaction(async (transaction) => {
                const userProfileSnap = await transaction.get(userProfileRef);
                if (!userProfileSnap.exists) return;
                const userProfileData = userProfileSnap.data();
                let profileUpdates = {};
                let newBadgeAwardedId = null;

                if (userProfileData.hasPublishedArticles !== true) profileUpdates.hasPublishedArticles = true;
                const earnedBadges = userProfileData.earnedBadges || [];
                if (!earnedBadges.includes(BADGE_ID_AUTORE_DEBUTTANTE)) {
                    profileUpdates.earnedBadges = FieldValue.arrayUnion(BADGE_ID_AUTORE_DEBUTTANTE);
                    newBadgeAwardedId = BADGE_ID_AUTORE_DEBUTTANTE;
                }

                if (Object.keys(profileUpdates).length > 0) {
                    profileUpdates.updatedAt = FieldValue.serverTimestamp();
                    transaction.update(userProfileRef, profileUpdates);
                    if (newBadgeAwardedId) {
                        const badgeInfo = await getBadgeDetails(newBadgeAwardedId);
                        if (badgeInfo) {
                            await createNotification(authorId, {
                                type: 'new_badge',
                                title: 'Nuovo Badge Sbloccato!',
                                message: `Hai ottenuto il badge: "${badgeInfo.name}".`,
                                link: `/profile.html?uid=${authorId}#badgesSection`,
                                icon: badgeInfo.icon,
                                relatedItemId: newBadgeAwardedId,
                            });
                        }
                    }
                }
            });
        } catch (error) {
            logger.error('updateAuthorOnArticlePublish: Error in transaction:', error, { authorId });
        }
    }
});

exports.awardGlitchzillaSlayer = onDocumentCreated('leaderboardScores/{scoreId}', async (event) => {
    const functionName = 'awardGlitchzillaSlayerAndBannerUpdate';
    if (!event.data) return;

    const scoreData = event.data.data();
    if (scoreData.userId && scoreData.glitchzillaDefeated === true) {
        const userId = scoreData.userId;
        const userProfileRef = db.collection('userProfiles').doc(userId);
        const glitchzillaStatsRef = db.collection('platformInfo').doc('glitchzillaStats');

        try {
            // --- INIZIO MODIFICA CHIAVE ---
            // Recuperiamo il profilo utente per ottenere il nickname canonico.
            // Questo è più sicuro che fidarsi di un nickname inviato dal client.
            const userProfileSnap = await userProfileRef.get();
            if (!userProfileSnap.exists) {
                logger.warn(
                    `[CF:${functionName}] Profilo utente ${userId} non trovato. Impossibile aggiornare il banner con un nickname corretto.`
                );
                // Potremmo decidere di non fare nulla o usare un fallback. Per ora usiamo il fallback.
            }
            const userProfileData = userProfileSnap.data() || {};
            const userNickname = userProfileData.nickname || 'Un Eroe Anonimo'; // Usa il nickname dal profilo, o il fallback.
            // --- FINE MODIFICA CHIAVE ---

            // Logica per assegnare il badge (ora usa userProfileSnap già recuperato)
            await db.runTransaction(async (transaction) => {
                // Non abbiamo più bisogno di ri-leggere il profilo nella transazione se l'oggetto non è cambiato.
                // Ma per coerenza e sicurezza, la transazione può ri-leggerlo.
                const freshUserProfileSnap = await transaction.get(userProfileRef);
                if (!freshUserProfileSnap.exists) return;

                const freshUserProfileData = freshUserProfileSnap.data();
                let profileUpdates = {};
                let newBadgeAwardedId = null;

                if (freshUserProfileData.hasDefeatedGlitchzilla !== true) {
                    profileUpdates.hasDefeatedGlitchzilla = true;
                }

                const earnedBadges = freshUserProfileData.earnedBadges || [];
                if (!earnedBadges.includes(BADGE_ID_GLITCHZILLA_SLAYER)) {
                    profileUpdates.earnedBadges = FieldValue.arrayUnion(BADGE_ID_GLITCHZILLA_SLAYER);
                    newBadgeAwardedId = BADGE_ID_GLITCHZILLA_SLAYER;
                }

                if (Object.keys(profileUpdates).length > 0) {
                    profileUpdates.updatedAt = FieldValue.serverTimestamp();
                    transaction.update(userProfileRef, profileUpdates);
                    if (newBadgeAwardedId) {
                        await sendNewBadgeNotification(userId, newBadgeAwardedId);
                    }
                }
            });
            logger.info(`[CF:${functionName}] Controllo badge per utente ${userId} completato.`);

            // Aggiornamento del banner con il nickname corretto
            const bannerUpdateData = {
                lastWinnerNickname: userNickname, // Ora è il nickname corretto!
                lastWinnerId: userId,
                defeatedAt: FieldValue.serverTimestamp(),
            };

            await glitchzillaStatsRef.set(bannerUpdateData);
            logger.info(`[CF:${functionName}] Banner di Glitchzilla aggiornato con il vincitore: ${userNickname}.`);
        } catch (error) {
            logger.error(`[CF:${functionName}] Errore nella transazione o nell'aggiornamento del banner:`, error, {
                userId,
            });
        }
    }
});

// --- CALLABLE FUNCTIONS ---
exports.grantVerificationBadge = onCall({ region: 'us-central1' }, async (request) => {
    const functionName = 'grantVerificationBadge';
    if (!request.auth || !request.auth.uid) {
        throw new HttpsError('unauthenticated', 'Devi essere autenticato per eseguire questa operazione.');
    }
    const userId = request.auth.uid;
    if (!request.auth.token.email_verified) {
        throw new HttpsError('failed-precondition', 'La tua email non risulta ancora verificata.');
    }

    const userProfileRef = db.collection('userProfiles').doc(userId);
    const newBadgeId = BADGE_ID_VERIFIED_USER;

    try {
        await db.runTransaction(async (transaction) => {
            const userProfileSnap = await transaction.get(userProfileRef);
            if (!userProfileSnap.exists) {
                return;
            }
            const userProfileData = userProfileSnap.data();
            const earnedBadges = userProfileData.earnedBadges || [];

            if (earnedBadges.includes(newBadgeId)) {
                return;
            }

            logger.info(`[CF:${functionName}] Awarding '${newBadgeId}' badge to user ${userId}.`);
            transaction.update(userProfileRef, {
                earnedBadges: FieldValue.arrayUnion(newBadgeId),
                updatedAt: FieldValue.serverTimestamp(),
            });

            const badgeInfo = await getBadgeDetails(newBadgeId);
            if (badgeInfo) {
                await createNotification(userId, {
                    type: 'new_badge',
                    title: 'Nuovo Badge Sbloccato!',
                    message: `Hai ottenuto il badge: "${badgeInfo.name}".`,
                    link: `/profile.html#badgesSection`,
                    icon: badgeInfo.icon,
                    relatedItemId: newBadgeId,
                });
            }
        });
        return { success: true, message: 'Badge assegnato con successo!' };
    } catch (error) {
        logger.error(`[CF:${functionName}] Errore durante l'assegnazione del badge di verifica a ${userId}:`, error);
        throw new HttpsError('internal', 'Impossibile assegnare il badge. Riprova più tardi.');
    }
});

// --- BADGE 'THE DEBUGGATOR' ---
exports.awardDebuggatorBadgeOnNewHighScore = onDocumentCreated('leaderboardScores/{scoreId}', async (event) => {
    const functionName = 'awardDebuggatorBadgeOnNewHighScore';
    if (!event.data) return;

    const scoreData = event.data.data();
    const score = scoreData.score;
    const userId = scoreData.userId;

    if (!userId) {
        logger.info(`[CF:${functionName}] Punteggio registrato da un guest. Nessun badge da assegnare.`);
        return;
    }

    if (score < 2000) {
        return;
    }

    const userProfileRef = db.collection('userProfiles').doc(userId);
    const newBadgeId = BADGE_ID_THE_DEBUGGATOR;

    try {
        const userProfileSnap = await userProfileRef.get();
        if (!userProfileSnap.exists) {
            logger.error(`[CF:${functionName}] Profilo utente ${userId} non trovato.`);
            return;
        }

        const userProfile = userProfileSnap.data();
        const earnedBadges = userProfile.earnedBadges || [];

        if (earnedBadges.includes(newBadgeId)) {
            logger.info(`[CF:${functionName}] L'utente ${userId} possiede già il badge '${newBadgeId}'.`);
            return;
        }

        logger.info(`[CF:${functionName}] Assegnazione del badge '${newBadgeId}' all'utente ${userId}.`);
        await userProfileRef.update({
            earnedBadges: FieldValue.arrayUnion(newBadgeId),
        });

        const badgeInfo = await getBadgeDetails(newBadgeId);
        if (badgeInfo) {
            await createNotification(userId, {
                type: 'new_badge',
                title: 'Nuovo Riconoscimento!',
                message: `Hai sbloccato il badge "${badgeInfo.name}" per il tuo punteggio epico in Donkey Runner!`,
                icon: badgeInfo.icon,
                link: '/profile.html#badgesSection',
                relatedItemId: newBadgeId,
            });
        }
    } catch (error) {
        logger.error(
            `[CF:${functionName}] Errore durante l'assegnazione del badge '${newBadgeId}' a ${userId}:`,
            error
        );
    }
});

// ==================================================================
// --- NUOVE FUNZIONI PER BADGE DI COMMENTO ---
// ==================================================================

/**
 * Gestisce la creazione di un commento a un articolo,
 * aggiornando i contatori e assegnando due possibili badge.
 */
exports.handleArticleCommentCreation = onDocumentCreated('articleComments/{commentId}', async (event) => {
    const functionName = 'handleArticleCommentCreation';
    if (!event.data) return;

    const commentData = event.data.data();
    const userId = commentData.userId;
    const articleId = commentData.articleId;

    if (!userId || !articleId) {
        logger.info(`[CF:${functionName}] Commento senza userId o articleId. Uscita.`);
        return;
    }

    const userProfileRef = db.collection('userProfiles').doc(userId);

    try {
        await db.runTransaction(async (transaction) => {
            const userProfileSnap = await transaction.get(userProfileRef);
            if (!userProfileSnap.exists) {
                logger.warn(`[CF:${functionName}] Profilo utente ${userId} non trovato.`);
                return;
            }

            const userProfile = userProfileSnap.data();
            const earnedBadges = userProfile.earnedBadges || [];
            const newBadgesAwarded = [];

            // --- Logica Badge #1: Commentatore di Articoli (10 commenti totali) ---
            const articleCommentsCount = (userProfile.articleCommentsWritten || 0) + 1;
            if (!earnedBadges.includes(BADGE_ID_ARTICLE_COMMENTER) && articleCommentsCount === 10) {
                newBadgesAwarded.push(BADGE_ID_ARTICLE_COMMENTER);
            }

            // --- Logica Badge #2: Esploratore di Contenuti (commenti su 3 articoli diversi) ---
            const commentedArticles = userProfile.commentedArticleIds || [];
            // Aggiungiamo l'ID corrente solo se non è già presente
            if (!commentedArticles.includes(articleId)) {
                // Se l'array non include questo articolo, e la sua nuova dimensione sarà 3, assegna il badge
                if (!earnedBadges.includes(BADGE_ID_CONTENT_EXPLORER) && commentedArticles.length + 1 === 3) {
                    newBadgesAwarded.push(BADGE_ID_CONTENT_EXPLORER);
                }
            }

            // Costruisci l'oggetto di aggiornamento per Firestore
            const profileUpdates = {
                articleCommentsWritten: FieldValue.increment(1),
                commentedArticleIds: FieldValue.arrayUnion(articleId), // Aggiunge l'ID solo se non presente
                updatedAt: FieldValue.serverTimestamp(),
            };

            if (newBadgesAwarded.length > 0) {
                profileUpdates.earnedBadges = FieldValue.arrayUnion(...newBadgesAwarded);
            }

            transaction.update(userProfileRef, profileUpdates);

            // Invia notifiche DOPO che la transazione è stata preparata
            for (const badgeId of newBadgesAwarded) {
                await sendNewBadgeNotification(userId, badgeId);
            }
        });
    } catch (error) {
        logger.error(`[CF:${functionName}] Errore nella transazione per l'utente ${userId}:`, error);
    }
});

/**
 * Assegna il badge "Tipo Interattivo" per i commenti nel guestbook.
 */
exports.awardGuestbookInteractiveBadge = onDocumentCreated('guestbookEntries/{entryId}', async (event) => {
    const functionName = 'awardGuestbookInteractiveBadge';
    if (!event.data) return;

    const commentData = event.data.data();
    const userId = commentData.userId;
    const badgeId = BADGE_ID_GUESTBOOK_INTERACTIVE;
    const commentThreshold = 15;

    if (!userId) {
        logger.info(`[CF:${functionName}] Commento Guestbook senza userId. Uscita.`);
        return;
    }

    const userProfileRef = db.collection('userProfiles').doc(userId);

    try {
        await db.runTransaction(async (transaction) => {
            const userProfileSnap = await transaction.get(userProfileRef);
            if (!userProfileSnap.exists) {
                logger.warn(`[CF:${functionName}] Profilo utente ${userId} non trovato.`);
                return;
            }

            const userProfile = userProfileSnap.data();
            if (userProfile.earnedBadges && userProfile.earnedBadges.includes(badgeId)) {
                // L'utente ha già il badge, incrementa solo il contatore per statistica
                transaction.update(userProfileRef, { guestbookCommentsWritten: FieldValue.increment(1) });
                return;
            }

            const newCount = (userProfile.guestbookCommentsWritten || 0) + 1;
            const profileUpdates = {
                guestbookCommentsWritten: newCount,
                updatedAt: FieldValue.serverTimestamp(),
            };

            let badgeAwarded = false;
            if (newCount === commentThreshold) {
                logger.info(
                    `[CF:${functionName}] L'utente ${userId} ha raggiunto la soglia di ${commentThreshold} commenti guestbook.`
                );
                profileUpdates.earnedBadges = FieldValue.arrayUnion(badgeId);
                badgeAwarded = true;
            }

            transaction.update(userProfileRef, profileUpdates);

            if (badgeAwarded) {
                await sendNewBadgeNotification(userId, badgeId);
            }
        });
    } catch (error) {
        logger.error(`[CF:${functionName}] Errore durante l'assegnazione del badge '${badgeId}' a ${userId}:`, error);
    }
});

// --- NICKNAME CHANGE HANDLERS ---
exports.requestNicknameChange = nicknameHandlers.requestNicknameChange;
exports.approveNicknameChange = nicknameHandlers.approveNicknameChange;
exports.rejectNicknameChange = nicknameHandlers.rejectNicknameChange;

// --- AVATAR PROCESSING ---
const AVATAR_THUMBNAIL_SIZE = 48;
const AVATAR_PROFILE_SIZE = 160;
exports.processUploadedAvatar = onObjectFinalized(
    { bucket: 'asyncdonkey.firebasestorage.app', memory: '512MiB', timeoutSeconds: 120, cpu: 1 },
    async (event) => {
        const fileObject = event.data;
        const filePath = fileObject.name;
        const contentType = fileObject.contentType;
        const bucketName = fileObject.bucket;
        if (!contentType || !contentType.startsWith('image/')) return;
        if (!filePath || !filePath.startsWith('user-avatars/')) return;
        if (filePath.includes('/processed/')) return;
        if (
            filePath.includes(`avatar_${AVATAR_THUMBNAIL_SIZE}.webp`) ||
            filePath.includes(`avatar_${AVATAR_PROFILE_SIZE}.webp`)
        )
            return;

        const parts = filePath.split('/');
        if (parts.length < 3) return;
        const userId = parts[1];
        const originalFileName = parts[parts.length - 1];
        const bucket = admin.storage().bucket(bucketName);
        const tempLocalOriginalPath = path.join(os.tmpdir(), `original_${userId}_${originalFileName}`);
        const tempFileNameBaseForLocal = `${userId}_${Date.now()}`;
        const tempLocalThumbPath = path.join(os.tmpdir(), `thumb_${tempFileNameBaseForLocal}.webp`);
        const tempLocalProfilePath = path.join(os.tmpdir(), `profile_${tempFileNameBaseForLocal}.webp`);

        try {
            await bucket.file(filePath).download({ destination: tempLocalOriginalPath });
            await sharp(tempLocalOriginalPath)
                .resize(AVATAR_THUMBNAIL_SIZE, AVATAR_THUMBNAIL_SIZE, { fit: 'cover' })
                .webp({ quality: 80 })
                .toFile(tempLocalThumbPath);
            await sharp(tempLocalOriginalPath)
                .resize(AVATAR_PROFILE_SIZE, AVATAR_PROFILE_SIZE, { fit: 'cover' })
                .webp({ quality: 80 })
                .toFile(tempLocalProfilePath);

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

            await thumbUploadResponse.makePublic();
            await profileUploadResponse.makePublic();

            await db
                .collection('userProfiles')
                .doc(userId)
                .update({
                    avatarUrls: { small: thumbUploadResponse.publicUrl(), profile: profileUploadResponse.publicUrl() },
                    profileUpdatedAt: FieldValue.serverTimestamp(),
                });
            await bucket.file(filePath).delete();
        } catch (error) {
            logger.error('processUploadedAvatar: Error during avatar processing:', error, { userId, filePath });
        } finally {
            try {
                await fs.remove(tempLocalOriginalPath);
                await fs.remove(tempLocalThumbPath);
                await fs.remove(tempLocalProfilePath);
            } catch (cleanupError) {
                logger.warn('processUploadedAvatar: Error deleting temporary files:', cleanupError);
            }
        }
    }
);

// --- NUOVA FUNZIONE PER BADGE "MECENATE DEGLI ARTICOLI" ---
exports.awardArticlePatronBadge = onDocumentUpdated('articles/{articleId}', async (event) => {
    const functionName = 'awardArticlePatronBadge';
    if (!event.data || !event.data.before || !event.data.after) {
        logger.info(`[CF:${functionName}] Evento non valido o dati mancanti.`);
        return;
    }

    const articleId = event.params.articleId;
    const dataBefore = event.data.before.data();
    const dataAfter = event.data.after.data();

    const likedByBefore = dataBefore.likedByUsers || [];
    const likedByAfter = dataAfter.likedByUsers || [];

    const newLikers = likedByAfter.filter((userId) => !likedByBefore.includes(userId));

    if (newLikers.length === 0) {
        return;
    }

    const badgeIdToAward = BADGE_ID_ARTICLE_PATRON;
    const likeThreshold = 5;

    for (const userId of newLikers) {
        if (!userId) continue;

        const userProfileRef = db.collection('userProfiles').doc(userId);
        try {
            let badgeWasActuallyAwardedThisRun = false;

            await db.runTransaction(async (transaction) => {
                const userProfileSnap = await transaction.get(userProfileRef);
                if (!userProfileSnap.exists) {
                    logger.warn(`[CF:${functionName}] Profilo utente ${userId} non trovato.`);
                    return;
                }

                const userProfile = userProfileSnap.data();
                const earnedBadges = userProfile.earnedBadges || [];

                if (earnedBadges.includes(badgeIdToAward)) {
                    // L'utente ha già il badge. Potremmo comunque aggiornare likedArticleIds se non fosse una transazione di sola lettura per questo caso.
                    // Per ora, se ha il badge, non facciamo nulla per mantenere semplice la logica del trigger.
                    // Se volessimo tracciare comunque likedArticleIds, dovremmo togliere questo return
                    // e fare l'update di likedArticleIds fuori dal check `if (newLikedArticlesSet.size >= likeThreshold)`.
                    // Ma per ora, l'obiettivo è solo assegnare il badge la prima volta.
                    return;
                }

                // Calcola lo stato futuro di likedArticleIds
                const currentLikedArticles = userProfile.likedArticleIds || [];
                const newLikedArticlesSet = new Set(currentLikedArticles);
                newLikedArticlesSet.add(articleId);

                // Aggiornamenti base del profilo (sempre se l'utente non ha il badge)
                const profileUpdates = {
                    likedArticleIds: FieldValue.arrayUnion(articleId), // Aggiunge sempre l'articolo se l'utente non ha il badge
                    updatedAt: FieldValue.serverTimestamp(),
                };

                if (newLikedArticlesSet.size >= likeThreshold) {
                    logger.info(
                        `[CF:${functionName}] Utente ${userId} raggiunge soglia per badge '${badgeIdToAward}'.`
                    );
                    profileUpdates.earnedBadges = FieldValue.arrayUnion(badgeIdToAward);
                    badgeWasActuallyAwardedThisRun = true; // Il badge sta per essere assegnato in questa transazione
                }

                transaction.update(userProfileRef, profileUpdates);
            });

            // Post-transazione: Invia notifica solo se il badge è stato effettivamente aggiunto in questa esecuzione.
            if (badgeWasActuallyAwardedThisRun) {
                logger.info(
                    `[CF:${functionName}] Transazione completata. Invio notifica per badge '${badgeIdToAward}' a utente ${userId}.`
                );
                await sendNewBadgeNotification(userId, badgeIdToAward);
            }
        } catch (error) {
            logger.error(
                `[CF:${functionName}] Errore durante la gestione del like per utente ${userId} e articolo ${articleId}:`,
                error
            );
        }
    }
});
// --- NUOVA FUNZIONE PER BADGE "EARLY ADOPTER" ---
exports.awardEarlyAdopterBadge = onDocumentCreated('userProfiles/{userId}', async (event) => {
    const functionName = 'awardEarlyAdopterBadge';
    if (!event.data) {
        logger.info(`[CF:${functionName}] Evento non valido o dati mancanti.`);
        return;
    }

    const userData = event.data.data();
    const userId = event.params.userId;

    if (!userData.createdAt || !userId) {
        logger.error(`[CF:${functionName}] Dati utente 'createdAt' o 'userId' mancanti per ${userId}.`, { userData });
        return;
    }

    const createdAtTimestamp = userData.createdAt; // È già un Timestamp di Firestore

    // Definisci la data di lancio e la finestra di 3 mesi
    // Data di lancio: 26 Maggio 2025 (00:00:00 UTC)
    const launchDate = new Date(Date.UTC(2025, 4, 26, 0, 0, 0)); // Mesi sono 0-indicizzati (0=Gen, 4=Mag)

    const threeMonthsLater = new Date(launchDate.getTime());
    threeMonthsLater.setUTCMonth(launchDate.getUTCMonth() + 3);
    // Gestisci il caso in cui andando avanti di 3 mesi si superi la fine del mese (es. 30 Nov + 3 mesi -> 28/29 Feb)
    // Se il giorno del mese originale era maggiore dell'ultimo giorno del mese di destinazione,
    // Date.prototype.setMonth lo corregge automaticamente all'ultimo giorno del mese di destinazione.
    // Per essere precisi sull'inclusione dell'ultimo giorno della finestra di 3 mesi, impostiamo l'ora alla fine del giorno.
    threeMonthsLater.setUTCHours(23, 59, 59, 999);

    const userRegistrationDate = createdAtTimestamp.toDate(); // Converti Timestamp Firestore in Date JS

    const badgeIdToAward = BADGE_ID_EARLY_ADOPTER;

    logger.info(
        `[CF:${functionName}] Controllo utente ${userId} (Registrato: ${userRegistrationDate.toISOString()}). Finestra Early Adopter: ${launchDate.toISOString()} - ${threeMonthsLater.toISOString()}`
    );

    // Controlla se la data di registrazione rientra nella finestra
    if (userRegistrationDate >= launchDate && userRegistrationDate <= threeMonthsLater) {
        logger.info(`[CF:${functionName}] Utente ${userId} è idoneo per il badge '${badgeIdToAward}'.`);

        const userProfileRef = db.collection('userProfiles').doc(userId);
        try {
            // Non serve una transazione complessa qui perché stiamo solo aggiungendo un badge
            // a un documento appena creato, e la condizione è già verificata.
            // L'importante è assicurarsi che non venga aggiunto più volte se la funzione triggerasse per errore più volte.
            const userProfileSnap = await userProfileRef.get(); // Rileggi per sicurezza, anche se è onCreate
            if (userProfileSnap.exists) {
                const userProfile = userProfileSnap.data();
                const earnedBadges = userProfile.earnedBadges || [];
                if (!earnedBadges.includes(badgeIdToAward)) {
                    await userProfileRef.update({
                        earnedBadges: FieldValue.arrayUnion(badgeIdToAward),
                        updatedAt: FieldValue.serverTimestamp(), // Aggiorna anche updatedAt
                    });
                    logger.info(
                        `[CF:${functionName}] Badge '${badgeIdToAward}' assegnato a ${userId}. Invio notifica.`
                    );
                    await sendNewBadgeNotification(userId, badgeIdToAward);
                } else {
                    logger.info(
                        `[CF:${functionName}] Utente ${userId} ha già il badge '${badgeIdToAward}' (improbabile su onCreate).`
                    );
                }
            } else {
                logger.warn(
                    `[CF:${functionName}] Profilo utente ${userId} non trovato subito dopo la creazione (improbabile).`
                );
            }
        } catch (error) {
            logger.error(
                `[CF:${functionName}] Errore durante l'assegnazione del badge '${badgeIdToAward}' a ${userId}:`,
                error
            );
        }
    } else {
        logger.info(`[CF:${functionName}] Utente ${userId} non idoneo per il badge '${badgeIdToAward}'.`);
    }
});
// --- NUOVA FUNZIONE PER BADGE "AUTORE APPREZZATO" ---
exports.awardAppreciatedAuthorBadge = onDocumentUpdated('articles/{articleId}', async (event) => {
    const functionName = 'awardAppreciatedAuthorBadge';
    if (!event.data || !event.data.before || !event.data.after) {
        logger.info(`[CF:${functionName}] Evento non valido o dati mancanti.`);
        return;
    }

    const articleId = event.params.articleId;
    const articleAfter = event.data.after.data();
    // const articleBefore = event.data.before.data(); // Non strettamente necessario per questa logica

    const authorId = articleAfter.authorId;
    const likeCount = articleAfter.likeCount || 0;
    const likeThreshold = 5;
    const badgeIdToAward = BADGE_ID_APPRECIATED_AUTHOR;

    if (!authorId) {
        logger.warn(`[CF:${functionName}] Articolo ${articleId} non ha un authorId.`);
        return;
    }

    if (likeCount < likeThreshold) {
        // logger.info(`[CF:${functionName}] Articolo ${articleId} ha ${likeCount} likes, soglia non raggiunta.`);
        return;
    }

    const userProfileRef = db.collection('userProfiles').doc(authorId);

    try {
        let badgeActuallyAwarded = false;
        await db.runTransaction(async (transaction) => {
            const userProfileSnap = await transaction.get(userProfileRef);
            if (!userProfileSnap.exists) {
                logger.warn(`[CF:${functionName}] Profilo utente ${authorId} non trovato per articolo ${articleId}.`);
                return;
            }

            const userProfile = userProfileSnap.data();
            const earnedBadges = userProfile.earnedBadges || [];

            if (earnedBadges.includes(badgeIdToAward)) {
                // logger.info(`[CF:${functionName}] Utente <span class="math-inline">\{authorId\} ha già il badge '</span>{badgeIdToAward}'.`);
                return;
            }

            // L'utente non ha il badge e la soglia like è raggiunta
            logger.info(
                `[CF:<span class="math-inline">{functionName}] Assegnazione badge '</span>{badgeIdToAward}' a utente ${authorId} per articolo ${articleId}.`
            );
            transaction.update(userProfileRef, {
                earnedBadges: FieldValue.arrayUnion(badgeIdToAward),
                updatedAt: FieldValue.serverTimestamp(),
            });
            badgeActuallyAwarded = true;
        });

        if (badgeActuallyAwarded) {
            await sendNewBadgeNotification(authorId, badgeIdToAward);
            logger.info(
                `[CF:<span class="math-inline">{functionName}] Notifica inviata per badge '</span>{badgeIdToAward}' a utente ${authorId}.`
            );
        }
    } catch (error) {
        logger.error(
            `[CF:<span class="math-inline">{functionName}] Errore durante la transazione per badge '</span>{badgeIdToAward}' a utente ${authorId} (articolo ${articleId}):`,
            error
        );
    }
});

// ==================================================================
// --- NUOVA FUNZIONE PER GESTIRE LE SPUNTE DEI TEST STEPS ---
// ==================================================================

exports.updateTestStepStatus = onCall({ region: 'us-central1' }, async (request) => {
    const functionName = 'updateTestStepStatus';
    // 1. Autenticazione: Assicurati che l'utente sia loggato
    if (!request.auth || !request.auth.uid) {
        logger.warn(`[CF:${functionName}] Chiamata non autenticata.`);
        throw new HttpsError('unauthenticated', 'Devi essere autenticato per eseguire questa operazione.');
    }
    const userId = request.auth.uid;

    // 2. Validazione Input: Verifica che i parametri essenziali siano presenti e validi
    const { taskId, stepId, isCompleted } = request.data;
    if (!taskId || !stepId || typeof isCompleted !== 'boolean') {
        logger.warn(`[CF:${functionName}] Parametri mancanti o non validi: taskId=${taskId}, stepId=${stepId}, isCompleted=${isCompleted}`);
        throw new HttpsError('invalid-argument', 'Parametri necessari mancanti o non validi (taskId, stepId, isCompleted).');
    }

    const userProfileRef = db.collection('userProfiles').doc(userId);
    const testResultDocRef = userProfileRef.collection('testResults').doc(taskId);

    try {
        // Usa una transazione per assicurare l'integrità dei dati
        await db.runTransaction(async (transaction) => {
            // Log di debug per db e transaction (lasciali, sono utili)
            logger.debug(`[CF:${functionName}] Inside transaction - typeof db: ${typeof db}, db.constructor.name: ${db.constructor.name}`);
            logger.debug(`[CF:${functionName}] Inside transaction - typeof transaction: ${typeof transaction}, transaction.constructor.name: ${transaction.constructor.name}`);

            const docSnap = await transaction.get(testResultDocRef);

            // Log di debug per docSnap (lascialo, è fondamentale)
            logger.debug(`[CF:${functionName}] Debug docSnap - Type: ${typeof docSnap}, Value: ${JSON.stringify(docSnap)}`);
            
            // --- MODIFICA CRUCIALE QUI ---
            // Tentativo di accedere ai dati del documento, assumendo che docSnap sia
            // un DocumentSnapshot valido, o che docSnap.data() si comporti come previsto
            // in questo caso di bug (restituendo undefined o un errore gestibile).
            let currentCompletedSteps = [];
            let currentOutcome = null;
            let documentExists = false; // NUOVO: Flag per tracciare se il documento esiste

            // Controlla se docSnap è un oggetto valido e ha un metodo .data()
            // Se docSnap è una DocumentReference, .data() potrebbe non esistere,
            // il che causerà un nuovo errore. Se non esiste, significa che la transazione
            // sta restituendo un oggetto completamente sbagliato.
            if (docSnap && typeof docSnap.data === 'function') {
                const data = docSnap.data(); // Tenta di accedere ai dati
                if (data !== undefined && data !== null) { // Se i dati sono presenti, il documento esiste
                    documentExists = true;
                    currentCompletedSteps = data.completedSteps || [];
                    currentOutcome = data.outcome || null;
                }
            } else {
                // Se docSnap non è un oggetto o non ha .data(), è un problema grave
                logger.error(`[CF:${functionName}] Unexpected object type from transaction.get: ${typeof docSnap}. Full object: ${JSON.stringify(docSnap)}`);
                throw new HttpsError('internal', 'Errore critico: il database non ha restituito lo snapshot atteso.');
            }
            // --- FINE MODIFICA CRUCIALE ---

            let updatedSteps;
            if (isCompleted) {
                updatedSteps = [...new Set([...currentCompletedSteps, stepId])];
            } else {
                updatedSteps = currentCompletedSteps.filter(id => id !== stepId);
            }

            const updatePayload = {
                completedSteps: updatedSteps,
                lastUpdated: FieldValue.serverTimestamp(),
            };

            // Adatta il controllo dell'esistenza al nuovo flag
            if (!documentExists) { // Se il documento non esiste, crealo
                if (!currentOutcome) {
                    updatePayload.status = 'in_progress';
                }
                updatePayload.taskId = taskId;
                updatePayload.testerId = userId;
                updatePayload.createdAt = FieldValue.serverTimestamp();
                transaction.set(testResultDocRef, updatePayload);
            } else { // Se il documento esiste, aggiornalo
                if (currentOutcome !== 'success' && currentOutcome !== 'failure') {
                    updatePayload.status = 'in_progress';
                }
                transaction.update(testResultDocRef, updatePayload);
            }
        });

        logger.info(`[CF:${functionName}] Stato step '${stepId}' per task '${taskId}' di utente '${userId}' aggiornato a 'isCompleted: ${isCompleted}'.`);
        return { success: true, message: 'Stato dello step aggiornato con successo!' };

    } catch (error) {
        logger.error(`[CF:${functionName}] Errore durante l'aggiornamento dello step '${stepId}' per task '${taskId}' di utente '${userId}':`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'Si è verificato un errore interno durante l_aggiornamento dello step. Riprova.');
    }
});

exports.requestTesterRole = onCall({ region: 'us-central1' }, async (request) => {
    const functionName = 'requestTesterRole';

    // 1. Verifica autenticazione
    if (!request.auth || !request.auth.uid) {
        logger.warn(`[CF:${functionName}] Chiamata non autenticata.`);
        throw new HttpsError('unauthenticated', 'Devi essere autenticato per fare questa richiesta.');
    }
    const userId = request.auth.uid;
    const userNickname = request.auth.token.name || 'un utente sconosciuto'; // 'name' viene dal custom claim del nickname

    try {
        // 2. Recupera tutti gli admin
        const adminsSnapshot = await db.collection('userProfiles').where('isAdmin', '==', true).get();
        if (adminsSnapshot.empty) {
            logger.warn(`[CF:${functionName}] Nessun admin trovato a cui inviare la notifica.`);
            // Non considerarlo un errore per l'utente, la richiesta è comunque "valida"
            return { success: true, message: 'La tua richiesta è stata registrata, ma non ci sono admin da notificare.' };
        }

        const adminIds = adminsSnapshot.docs.map(doc => doc.id);

        // 3. Prepara e invia le notifiche
        const notificationPayload = {
            type: 'tester_request',
            title: 'Richiesta Ruolo Tester',
            message: `L'utente "${userNickname}" (ID: ${userId}) ha richiesto di diventare un Beta Tester.`,
            link: `/admin-dashboard.html#users-management-section`, // Link diretto alla sezione admin
            icon: 'science',
            relatedItemId: userId
        };

        const notificationPromises = adminIds.map(adminId => 
            createNotification(adminId, notificationPayload)
        );
        
        await Promise.all(notificationPromises);

        logger.info(`[CF:${functionName}] Notifiche inviate a ${adminIds.length} admin per la richiesta da parte di ${userId}.`);
        return { success: true, message: 'Notifiche inviate agli amministratori.' };

    } catch (error) {
        logger.error(`[CF:${functionName}] Errore durante l'invio delle notifiche per la richiesta di ruolo tester da ${userId}:`, error);
        throw new HttpsError('internal', 'Impossibile inviare la richiesta agli admin. Riprova più tardi.');
    }
});