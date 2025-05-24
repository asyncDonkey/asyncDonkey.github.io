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
const fs = require('fs-extra'); // For file system operations
const sharp = require('sharp'); // For image processing

const { initializeApp } = require("firebase-admin/app");

// Inizializza l'app Firebase Admin UNA SOLA VOLTA
initializeApp();

// Importa ed esporta la tua nuova funzione per l'invio delle email
const verificationEmail = require("./sendVerificationEmail");
exports.sendVerificationEmail = verificationEmail.sendVerificationEmail;

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore(); // db è già definito qui e sarà usato dal modulo importato

// --- IMPORT NEW MODULE FOR USER PUBLIC PROFILE SYNC ---
const userPublicProfileSync = require('./userPublicProfileSync');

// --- CONSTANTS FOR BADGES ---
const BADGE_ID_AUTORE_DEBUTTANTE = 'author-rookie';
const BADGE_ID_GLITCHZILLA_SLAYER = 'glitchzilla-slayer';

// --- CONSTANTS FOR BADGE DETAILS (for Notifications) ---
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

// --- HELPER FUNCTION FOR CREATING NOTIFICATIONS (v2 Syntax) ---
/**
 * Helper function to create a notification document in Firestore.
 * @param {string} userId The ID of the user to notify.
 * @param {object} notificationData Object containing notification details.
 */
async function createNotification(userId, notificationData) {
    if (
        !userId ||
        !notificationData ||
        !notificationData.type ||
        !notificationData.title ||
        !notificationData.message
    ) {
        logger.error('createNotification: Missing required parameters.', { userId, notificationData });
        return null;
    }

    const notificationPayload = {
        ...notificationData,
        timestamp: FieldValue.serverTimestamp(),
        read: false,
        icon: notificationData.icon || 'notifications',
    };

    try {
        const notificationRef = db.collection('userProfiles').doc(userId).collection('notifications').doc();
        await notificationRef.set(notificationPayload);
        logger.info(
            `Notification created for user ${userId}, type: ${notificationPayload.type}, id: ${notificationRef.id}`
        );
        return notificationRef.id;
    } catch (error) {
        logger.error(`Error creating notification for user ${userId}:`, error);
        return null;
    }
}

// --- NEW USER PUBLIC PROFILE SYNC FUNCTIONS (Exported from the new module) ---

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

// --- EXISTING FUNCTION: handleArticleStatusNotifications ---
exports.handleArticleStatusNotifications = onDocumentUpdated('articles/{articleId}', async (event) => {
    if (!event.data) {
        logger.warn('handleArticleStatusNotifications: Event data missing.', { eventId: event.id });
        return;
    }

    const articleAfter = event.data.after.data();
    const articleBefore = event.data.before.data();
    const articleId = event.params.articleId;

    if (!articleAfter || !articleBefore) {
        logger.info('handleArticleStatusNotifications: Snapshot data (before or after) is missing. Exiting.', {
            articleId,
        });
        return;
    }

    const authorId = articleAfter.authorId;
    if (!authorId) {
        logger.error('handleArticleStatusNotifications: authorId missing in article. Cannot send notification.', {
            articleId,
        });
        return;
    }

    if (articleBefore.status !== articleAfter.status) {
        logger.info(
            `handleArticleStatusNotifications: Article ${articleId} status changed from '${articleBefore.status}' to '${articleAfter.status}'.`
        );

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

// --- EXISTING FUNCTION: updateAuthorOnArticlePublish ---
exports.updateAuthorOnArticlePublish = onDocumentUpdated('articles/{articleId}', async (event) => {
    if (!event.data) {
        logger.warn('updateAuthorOnArticlePublish: Event data missing, exiting early.', { eventId: event.id });
        return;
    }
    const newValue = event.data.after.data();
    const previousValue = event.data.before.data();
    const articleId = event.params.articleId;

    if (!newValue || !previousValue) {
        logger.info('updateAuthorOnArticlePublish: One of the snapshots (before/after) is missing. Exiting.');
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
                logger.info(
                    `updateAuthorOnArticlePublish: Flag 'hasPublishedArticles' will be set to true for user: ${authorId}`
                );
            }

            const earnedBadges = userProfileData.earnedBadges || [];
            if (!earnedBadges.includes(BADGE_ID_AUTORE_DEBUTTANTE)) {
                if (FieldValue && typeof FieldValue.arrayUnion === 'function') {
                    profileUpdates.earnedBadges = FieldValue.arrayUnion(BADGE_ID_AUTORE_DEBUTTANTE);
                    newBadgeAwardedId = BADGE_ID_AUTORE_DEBUTTANTE;
                    logger.info(
                        `updateAuthorOnArticlePublish: Badge '${BADGE_ID_AUTORE_DEBUTTANTE}' will be awarded to user: ${authorId}`
                    );
                } else {
                    logger.error(
                        'updateAuthorOnArticlePublish: CRITICAL ERROR - FieldValue.arrayUnion is not a function!',
                        { fieldValueObject: FieldValue }
                    );
                }
            }

            if (Object.keys(profileUpdates).length > 0) {
                if (FieldValue && typeof FieldValue.serverTimestamp === 'function') {
                    profileUpdates.updatedAt = FieldValue.serverTimestamp();
                } else {
                    logger.error(
                        'updateAuthorOnArticlePublish: CRITICAL ERROR - FieldValue.serverTimestamp is not a function! Using Date() as fallback.',
                        { fieldValueObject: FieldValue }
                    );
                    profileUpdates.updatedAt = new Date();
                }
                await userProfileRef.update(profileUpdates);
                logger.info(`updateAuthorOnArticlePublish: User profile ${authorId} updated with:`, profileUpdates);

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
            logger.error(
                'updateAuthorOnArticlePublish: Error updating user profile or sending badge notification:',
                error,
                { authorId }
            );
        }
    }
});

// --- EXISTING FUNCTION: awardGlitchzillaSlayer ---
exports.awardGlitchzillaSlayer = onDocumentCreated('leaderboardScores/{scoreId}', async (event) => {
    const functionName = 'awardGlitchzillaSlayer'; // Per facilitare il filtro dei log
    logger.info(`[CF:${functionName}] Triggered for scoreId: ${event.params.scoreId}`);

    if (!event.data) {
        logger.warn(`[CF:${functionName}] Event data missing (no document created?). Exiting.`, { eventId: event.id });
        return;
    }
    const scoreData = event.data.data();
    const scoreId = event.params.scoreId; // Corretto per v2

    logger.info(`[CF:${functionName}] Processing score data:`, { scoreId, scoreData });

    if (scoreData.userId && scoreData.glitchzillaDefeated === true) {
        const userId = scoreData.userId;
        logger.info(
            `[CF:${functionName}] Conditions met: userId=${userId}, glitchzillaDefeated=true. Proceeding to award badge.`
        );

        const userProfileRef = db.collection('userProfiles').doc(userId);
        let profileUpdatesGlitch = {};
        let newBadgeAwardedId = null;

        try {
            logger.info(`[CF:${functionName}] Attempting to get user profile for userId: ${userId}`);
            const userProfileSnap = await userProfileRef.get();

            if (!userProfileSnap.exists) {
                logger.warn(
                    `[CF:${functionName}] User profile not found for userId: ${userId} from score ${scoreId}. Exiting badge award logic.`
                );
                return;
            }
            const userProfileData = userProfileSnap.data();
            logger.info(`[CF:${functionName}] User profile data fetched:`, { userId, userProfileData });

            // Update 'hasDefeatedGlitchzilla' flag
            if (userProfileData.hasDefeatedGlitchzilla !== true) {
                profileUpdatesGlitch.hasDefeatedGlitchzilla = true;
                logger.info(
                    `[CF:${functionName}] Flag 'hasDefeatedGlitchzilla' will be set to true for user: ${userId}`
                );
            } else {
                logger.info(`[CF:${functionName}] Flag 'hasDefeatedGlitchzilla' is already true for user: ${userId}`);
            }

            // Award 'Glitchzilla Slayer' badge if not already earned
            const earnedBadges = userProfileData.earnedBadges || [];
            logger.info(`[CF:${functionName}] User's current badges:`, { userId, earnedBadges });

            if (!earnedBadges.includes(BADGE_ID_GLITCHZILLA_SLAYER)) {
                if (FieldValue && typeof FieldValue.arrayUnion === 'function') {
                    profileUpdatesGlitch.earnedBadges = FieldValue.arrayUnion(BADGE_ID_GLITCHZILLA_SLAYER);
                    newBadgeAwardedId = BADGE_ID_GLITCHZILLA_SLAYER;
                    logger.info(
                        `[CF:${functionName}] Badge '${BADGE_ID_GLITCHZILLA_SLAYER}' will be awarded to user: ${userId}`
                    );
                } else {
                    logger.error(`[CF:${functionName}] CRITICAL ERROR - FieldValue.arrayUnion is not a function!`, {
                        fieldValueObject: FieldValue,
                    });
                }
            } else {
                logger.info(`[CF:${functionName}] User ${userId} already has badge '${BADGE_ID_GLITCHZILLA_SLAYER}'.`);
            }

            if (Object.keys(profileUpdatesGlitch).length > 0) {
                logger.info(
                    `[CF:${functionName}] Preparing to update profile for ${userId} with:`,
                    profileUpdatesGlitch
                );
                if (FieldValue && typeof FieldValue.serverTimestamp === 'function') {
                    profileUpdatesGlitch.updatedAt = FieldValue.serverTimestamp();
                } else {
                    logger.error(
                        `[CF:${functionName}] CRITICAL ERROR - FieldValue.serverTimestamp is not a function! Using Date() as fallback.`,
                        { fieldValueObject: FieldValue }
                    );
                    profileUpdatesGlitch.updatedAt = new Date();
                }
                await userProfileRef.update(profileUpdatesGlitch);
                logger.info(
                    `[CF:${functionName}] User profile ${userId} updated with Glitchzilla data:`,
                    profileUpdatesGlitch
                );

                // Send notification for the newly awarded badge, if any
                if (newBadgeAwardedId && BADGE_DETAILS[newBadgeAwardedId]) {
                    const badgeInfo = BADGE_DETAILS[newBadgeAwardedId];
                    logger.info(
                        `[CF:${functionName}] Preparing notification for new badge '${newBadgeAwardedId}' for user ${userId}. Badge details:`,
                        badgeInfo
                    );
                    await createNotification(userId, {
                        type: 'new_badge',
                        title: 'Nuovo Badge Sbloccato!',
                        message: `Hai ottenuto il badge: ${badgeInfo.name} ${badgeInfo.description}`,
                        link: `/profile.html?userId=${userId}${badgeInfo.linkPath || ''}`, // Corretto a ?userId=
                        icon: badgeInfo.icon,
                        relatedItemId: newBadgeAwardedId,
                    });
                    logger.info(
                        `[CF:${functionName}] Notification for badge '${newBadgeAwardedId}' sent to user ${userId}.`
                    );
                } else if (newBadgeAwardedId) {
                    logger.warn(
                        `[CF:${functionName}] newBadgeAwardedId is set to '${newBadgeAwardedId}', but no details found in BADGE_DETAILS. Notification NOT sent.`
                    );
                } else {
                    logger.info(
                        `[CF:${functionName}] No new badge ID was set, so no notification will be sent for this update.`
                    );
                }
            } else {
                logger.info(`[CF:${functionName}] No profile updates to apply for user ${userId}.`);
            }
        } catch (error) {
            logger.error(
                `[CF:${functionName}] Error updating user profile for Glitchzilla or sending badge notification:`,
                error,
                { userId }
            );
        }
    } else {
        logger.info(
            `[CF:${functionName}] Conditions for Glitchzilla badge not met for scoreId: ${scoreId}. scoreData.userId: ${scoreData.userId}, scoreData.glitchzillaDefeated: ${scoreData.glitchzillaDefeated}. No badge awarded.`
        );
    }
    // La funzione termina qui implicitamente se nessuna delle condizioni precedenti ha causato un return.
});

// --- EXISTING FUNCTION: processUploadedAvatar ---
const AVATAR_THUMBNAIL_SIZE = 48;
const AVATAR_PROFILE_SIZE = 160;

exports.processUploadedAvatar = onObjectFinalized(
    {
        bucket: 'asyncdonkey.firebasestorage.app', // Assicurati che il nome del bucket sia corretto
        memory: '512MiB',
        timeoutSeconds: 120,
        cpu: 1,
    },
    async (event) => {
        const fileObject = event.data;
        const filePath = fileObject.name;
        const contentType = fileObject.contentType;
        const bucketName = fileObject.bucket;

        logger.info(
            `processUploadedAvatar: New file detected: ${filePath} in bucket ${bucketName} with type ${contentType}`
        );

        if (!contentType || !contentType.startsWith('image/')) {
            logger.log('processUploadedAvatar: Not an image. Exiting.');
            return null;
        }
        if (!filePath || !filePath.startsWith('user-avatars/')) {
            logger.log("processUploadedAvatar: File not in 'user-avatars/' path. Exiting.");
            return null;
        }
        if (filePath.includes('/processed/')) {
            logger.log("processUploadedAvatar: File already processed (contains '/processed/'). Exiting.");
            return null;
        }
        if (
            filePath.includes(`avatar_${AVATAR_THUMBNAIL_SIZE}.webp`) ||
            filePath.includes(`avatar_${AVATAR_PROFILE_SIZE}.webp`)
        ) {
            logger.log('processUploadedAvatar: File appears to be an already processed version. Exiting.');
            return null;
        }

        const parts = filePath.split('/');
        if (parts.length < 3) {
            logger.error('processUploadedAvatar: Invalid file path, cannot extract userId:', filePath);
            return null;
        }
        const userId = parts[1];
        const originalFileName = parts[parts.length - 1];

        logger.info(`processUploadedAvatar: Processing avatar for user ${userId} from ${originalFileName}`);

        const bucket = admin.storage().bucket(bucketName);

        const tempLocalOriginalPath = path.join(os.tmpdir(), `original_${userId}_${originalFileName}`);
        const tempFileNameBaseForLocal = `${userId}_${Date.now()}`;
        const tempLocalThumbPath = path.join(os.tmpdir(), `thumb_${tempFileNameBaseForLocal}.webp`);
        const tempLocalProfilePath = path.join(os.tmpdir(), `profile_${tempFileNameBaseForLocal}.webp`);

        try {
            await bucket.file(filePath).download({ destination: tempLocalOriginalPath });
            logger.info('processUploadedAvatar: Original image downloaded to:', tempLocalOriginalPath);

            await sharp(tempLocalOriginalPath)
                .resize(AVATAR_THUMBNAIL_SIZE, AVATAR_THUMBNAIL_SIZE, { fit: 'cover' })
                .webp({ quality: 80 })
                .toFile(tempLocalThumbPath);
            logger.info(`processUploadedAvatar: Thumbnail created: ${tempLocalThumbPath}`);

            await sharp(tempLocalOriginalPath)
                .resize(AVATAR_PROFILE_SIZE, AVATAR_PROFILE_SIZE, { fit: 'cover' })
                .webp({ quality: 80 })
                .toFile(tempLocalProfilePath);
            logger.info(`processUploadedAvatar: Profile image created: ${tempLocalProfilePath}`);

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
            logger.info('processUploadedAvatar: Processed images uploaded to Storage.');

            const thumbFile = thumbUploadResponse;
            const profileFile = profileUploadResponse;

            await thumbFile.makePublic();
            await profileFile.makePublic();

            const thumbUrl = thumbFile.publicUrl();
            const profileUrl = profileFile.publicUrl();

            logger.info('processUploadedAvatar: Public URLs obtained:', { thumbUrl, profileUrl });

            const userProfileRef = db.collection('userProfiles').doc(userId);
            await userProfileRef.update({
                avatarUrls: {
                    small: thumbUrl, // Corrisponde a avatarUrls.small usato nel client
                    profile: profileUrl, // Corrisponde a avatarUrls.profile usato nel client
                },
                profileUpdatedAt: FieldValue.serverTimestamp(),
            });
            logger.info(`processUploadedAvatar: User profile ${userId} updated with new avatar URLs.`);

            await bucket.file(filePath).delete();
            logger.info(`processUploadedAvatar: Original image ${filePath} deleted from Storage.`);
        } catch (error) {
            logger.error('processUploadedAvatar: Error during avatar processing:', error, { userId, filePath });
        } finally {
            // Cleanup local temporary files
            try {
                await fs.remove(tempLocalOriginalPath);
                await fs.remove(tempLocalThumbPath);
                await fs.remove(tempLocalProfilePath);
                logger.info('processUploadedAvatar: Temporary local files deleted.');
            } catch (cleanupError) {
                logger.warn('processUploadedAvatar: Error deleting temporary files:', cleanupError);
            }
        }
        return null;
    }
);
// Add other Cloud Functions below as needed
