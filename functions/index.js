// functions/index.js

// Firebase Functions v2 imports
const { onDocumentUpdated, onDocumentCreated, onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { onObjectFinalized } = require('firebase-functions/v2/storage');
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
const { createNotification } = require('./notificationUtils'); // <-- MODIFICA: Importata da nuovo modulo
const nicknameHandlers = require('./nicknameRequestHandler'); // Importa tutte le funzioni da nicknameRequestHandler

// --- CONSTANTS ---
const BADGE_ID_AUTORE_DEBUTTANTE = 'author-rookie';
const BADGE_ID_GLITCHZILLA_SLAYER = 'glitchzilla-slayer';
const BADGE_DETAILS = {
    [BADGE_ID_AUTORE_DEBUTTANTE]: {
        name: 'Autore Debuttante',
        description: 'Hai pubblicato il tuo primo articolo!',
        icon: 'emoji_events',
        linkPath: '#badgesSection',
    },
    [BADGE_ID_GLITCHZILLA_SLAYER]: {
        name: 'Glitchzilla Slayer',
        description: 'Hai sconfitto Glitchzilla nel leggendario Donkey Runner!',
        icon: 'whatshot',
        linkPath: '#badgesSection',
    },
};

// --- HELPER FUNCTION createNotification ORA È STATA SPOSTATA in notificationUtils.js ---

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
    // (Il codice di questa funzione rimane invariato, userà la createNotification importata)
    if (!event.data) {
        logger.warn('handleArticleStatusNotifications: Event data missing.', { eventId: event.id });
        return;
    }
    const articleAfter = event.data.after.data();
    const articleBefore = event.data.before.data();
    const articleId = event.params.articleId;

    if (!articleAfter || !articleBefore) {
        logger.info('handleArticleStatusNotifications: Snapshot data is missing. Exiting.', { articleId });
        return;
    }
    const authorId = articleAfter.authorId;
    if (!authorId) {
        logger.error('handleArticleStatusNotifications: authorId missing in article.', { articleId });
        return;
    }

    if (articleBefore.status !== articleAfter.status) {
        logger.info(`Article ${articleId} status changed from '${articleBefore.status}' to '${articleAfter.status}'.`);

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
    logger.info(`[CF:${functionName}] Triggered for requestId: ${event.params.requestId}`);

    if (!event.data) {
        logger.warn(`[CF:${functionName}] Event data is missing. Exiting.`);
        return;
    }

    const requestData = event.data.data();
    const requestingUserId = requestData.userId;
    const requestedNickname = requestData.requestedNickname;

    if (!requestingUserId || !requestedNickname) {
        logger.error(`[CF:${functionName}] Missing 'userId' or 'requestedNickname' in the request document.`, {
            data: requestData,
        });
        return;
    }

    // Per una notifica più ricca, usiamo il nickname attuale fornito nella richiesta.
    const currentNickname = requestData.currentNickname || 'un utente'; // Fallback se il campo non esiste

    try {
        // 1. Trova tutti gli profili degli amministratori
        const adminsSnapshot = await db.collection('userProfiles').where('isAdmin', '==', true).get();

        if (adminsSnapshot.empty) {
            logger.warn(`[CF:${functionName}] No admin users found to notify.`);
            return;
        }

        const adminIds = adminsSnapshot.docs.map((doc) => doc.id);
        logger.info(`[CF:${functionName}] Found ${adminIds.length} admin(s) to notify:`, adminIds);

        // 2. Prepara il payload della notifica
        const notificationPayload = {
            type: 'admin_new_nickname_request',
            title: 'Nuova Richiesta Nickname',
            message: `L'utente ${currentNickname} ha richiesto il nuovo nickname: "${requestedNickname}".`,
            link: '/admin-dashboard.html#nickname-requests-section', // Link diretto alla sezione nel pannello admin
            icon: 'manage_accounts',
            relatedItemId: event.params.requestId,
        };

        // 3. Crea una promessa di notifica per ogni admin
        const notificationPromises = adminIds.map((adminId) => {
            // Un admin non dovrebbe ricevere una notifica per una sua stessa richiesta (caso limite).
            if (adminId === requestingUserId) {
                logger.info(`[CF:${functionName}] Admin ${adminId} is the requester. Skipping notification for them.`);
                return null;
            }
            return createNotification(adminId, notificationPayload);
        });

        // 4. Esegui tutte le promesse in parallelo
        await Promise.all(notificationPromises.filter((p) => p !== null));
        logger.info(
            `[CF:${functionName}] Notifications for new nickname request have been sent successfully to relevant admins.`
        );
    } catch (error) {
        logger.error(`[CF:${functionName}] Failed to send nickname request notifications to admins.`, { error: error });
    }
});

// --- BADGE AND AUTHOR UPDATE LOGIC ---
exports.updateAuthorOnArticlePublish = onDocumentUpdated('articles/{articleId}', async (event) => {
    // (Il codice di questa funzione rimane invariato)
    if (!event.data) {
        logger.warn('updateAuthorOnArticlePublish: Event data missing, exiting early.', { eventId: event.id });
        return;
    }
    const newValue = event.data.after.data();
    const previousValue = event.data.before.data();
    const articleId = event.params.articleId;

    if (!newValue || !previousValue) {
        logger.info('updateAuthorOnArticlePublish: One of the snapshots is missing. Exiting.');
        return;
    }

    if (newValue.status === 'published' && previousValue.status !== 'published') {
        const authorId = newValue.authorId;
        if (!authorId) {
            logger.error('updateAuthorOnArticlePublish: AuthorId missing in the published article:', articleId);
            return;
        }

        const userProfileRef = db.collection('userProfiles').doc(authorId);
        let profileUpdates = {};
        let newBadgeAwardedId = null;

        try {
            const userProfileSnap = await userProfileRef.get();
            if (!userProfileSnap.exists) {
                logger.warn(`updateAuthorOnArticlePublish: User profile not found for authorId: ${authorId}`);
                return;
            }
            const userProfileData = userProfileSnap.data();

            if (userProfileData.hasPublishedArticles !== true) {
                profileUpdates.hasPublishedArticles = true;
            }

            const earnedBadges = userProfileData.earnedBadges || [];
            if (!earnedBadges.includes(BADGE_ID_AUTORE_DEBUTTANTE)) {
                profileUpdates.earnedBadges = FieldValue.arrayUnion(BADGE_ID_AUTORE_DEBUTTANTE);
                newBadgeAwardedId = BADGE_ID_AUTORE_DEBUTTANTE;
            }

            if (Object.keys(profileUpdates).length > 0) {
                profileUpdates.updatedAt = FieldValue.serverTimestamp();
                await userProfileRef.update(profileUpdates);
                logger.info(`User profile ${authorId} updated with:`, profileUpdates);

                if (newBadgeAwardedId && BADGE_DETAILS[newBadgeAwardedId]) {
                    const badgeInfo = BADGE_DETAILS[newBadgeAwardedId];
                    await createNotification(authorId, {
                        type: 'new_badge',
                        title: 'Nuovo Badge Sbloccato!',
                        message: `Hai ottenuto il badge: ${badgeInfo.name} ${badgeInfo.description}`,
                        link: `/profile.html?uid=${authorId}${badgeInfo.linkPath || ''}`,
                        icon: badgeInfo.icon,
                        relatedItemId: newBadgeAwardedId,
                    });
                }
            }
        } catch (error) {
            logger.error('updateAuthorOnArticlePublish: Error updating user profile:', error, { authorId });
        }
    }
});

exports.awardGlitchzillaSlayer = onDocumentCreated('leaderboardScores/{scoreId}', async (event) => {
    // (Codice corretto: rimossa la variabile 'scoreId' non utilizzata)
    const functionName = 'awardGlitchzillaSlayer';
    if (!event.data) {
        logger.warn(`[CF:${functionName}] Event data missing. Exiting.`);
        return;
    }
    const scoreData = event.data.data();
    // const scoreId = event.params.scoreId; // <-- RIGA RIMOSSA

    if (scoreData.userId && scoreData.glitchzillaDefeated === true) {
        const userId = scoreData.userId;
        const userProfileRef = db.collection('userProfiles').doc(userId);
        let profileUpdatesGlitch = {};
        let newBadgeAwardedId = null;

        try {
            const userProfileSnap = await userProfileRef.get();
            if (!userProfileSnap.exists) {
                logger.warn(`[CF:${functionName}] User profile not found for userId: ${userId}`);
                return;
            }
            const userProfileData = userProfileSnap.data();

            if (userProfileData.hasDefeatedGlitchzilla !== true) {
                profileUpdatesGlitch.hasDefeatedGlitchzilla = true;
            }

            const earnedBadges = userProfileData.earnedBadges || [];
            if (!earnedBadges.includes(BADGE_ID_GLITCHZILLA_SLAYER)) {
                profileUpdatesGlitch.earnedBadges = FieldValue.arrayUnion(BADGE_ID_GLITCHZILLA_SLAYER);
                newBadgeAwardedId = BADGE_ID_GLITCHZILLA_SLAYER;
            }

            if (Object.keys(profileUpdatesGlitch).length > 0) {
                profileUpdatesGlitch.updatedAt = FieldValue.serverTimestamp();
                await userProfileRef.update(profileUpdatesGlitch);

                if (newBadgeAwardedId && BADGE_DETAILS[newBadgeAwardedId]) {
                    const badgeInfo = BADGE_DETAILS[newBadgeAwardedId];
                    await createNotification(userId, {
                        type: 'new_badge',
                        title: 'Nuovo Badge Sbloccato!',
                        message: `Hai ottenuto il badge: ${badgeInfo.name} ${badgeInfo.description}`,
                        link: `/profile.html?userId=${userId}${badgeInfo.linkPath || ''}`,
                        icon: badgeInfo.icon,
                        relatedItemId: newBadgeAwardedId,
                    });
                }
            }
        } catch (error) {
            logger.error(`[CF:${functionName}] Error updating user profile:`, error, { userId });
        }
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
    {
        bucket: 'asyncdonkey.firebasestorage.app',
        memory: '512MiB',
        timeoutSeconds: 120,
        cpu: 1,
    },
    async (event) => {
        // (Il codice di questa funzione rimane invariato)
        const fileObject = event.data;
        const filePath = fileObject.name;
        const contentType = fileObject.contentType;
        const bucketName = fileObject.bucket;

        if (!contentType || !contentType.startsWith('image/')) return null;
        if (!filePath || !filePath.startsWith('user-avatars/')) return null;
        if (filePath.includes('/processed/')) return null;
        if (
            filePath.includes(`avatar_${AVATAR_THUMBNAIL_SIZE}.webp`) ||
            filePath.includes(`avatar_${AVATAR_PROFILE_SIZE}.webp`)
        )
            return null;

        const parts = filePath.split('/');
        if (parts.length < 3) return null;
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
        return null;
    }
);
