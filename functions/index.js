// functions/index.js

// Firebase Functions v2 imports
// REMOVED 'onDocumentWritten' as it's not currently used
const { onDocumentUpdated, onDocumentCreated } = require('firebase-functions/v2/firestore');
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

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

// --- CONSTANTS FOR BADGES ---
const BADGE_ID_AUTORE_DEBUTTANTE = 'author-rookie';
const BADGE_ID_GLITCHZILLA_SLAYER = 'glitchzilla-slayer';

// --- CONSTANTS FOR BADGE DETAILS (for Notifications) ---
const BADGE_DETAILS = {
    [BADGE_ID_AUTORE_DEBUTTANTE]: {
        name: "Autore Debuttante",
        description: "Hai pubblicato il tuo primo articolo!",
        icon: "emoji_events", // Icona specifica per questo badge
        linkPath: "#badgesSection" // Aggiunto per coerenza, sarà parte di /profile.html?uid=...
    },
    [BADGE_ID_GLITCHZILLA_SLAYER]: {
        name: "Glitchzilla Slayer",
        description: "Hai sconfitto Glitchzilla nel leggendario Donkey Runner!",
        icon: "whatshot", // Icona specifica per questo badge
        linkPath: "#badgesSection"
    },
};

// --- HELPER FUNCTION FOR CREATING NOTIFICATIONS (v2 Syntax) ---
/**
 * Helper function to create a notification document in Firestore.
 * @param {string} userId The ID of the user to notify.
 * @param {object} notificationData Object containing notification details.
 * Required fields: type, title, message. Optional: link, icon, relatedItemId.
 */
async function createNotification(userId, notificationData) {
    if (!userId || !notificationData || !notificationData.type || !notificationData.title || !notificationData.message) {
        logger.error("createNotification: Missing required parameters.", { userId, notificationData });
        return null;
    }

    const notificationPayload = {
        ...notificationData,
        timestamp: FieldValue.serverTimestamp(), // Correct FieldValue usage
        read: false,
        icon: notificationData.icon || "notifications", // Default icon
    };

    try {
        const notificationRef = db.collection("userProfiles").doc(userId).collection("notifications").doc();
        await notificationRef.set(notificationPayload);
        logger.info(`Notification created for user ${userId}, type: ${notificationPayload.type}, id: ${notificationRef.id}`);
        return notificationRef.id;
    } catch (error) {
        logger.error(`Error creating notification for user ${userId}:`, error);
        return null;
    }
}

// --- NEW FUNCTION: Handle Article Status Change Notifications ---
/**
 * Sends notifications when an article's status changes to 'published' or 'rejected'.
 */
exports.handleArticleStatusNotifications = onDocumentUpdated('articles/{articleId}', async (event) => {
    if (!event.data) {
        logger.warn('handleArticleStatusNotifications: Event data missing.', { eventId: event.id });
        return;
    }

    const articleAfter = event.data.after.data();
    const articleBefore = event.data.before.data();
    const articleId = event.params.articleId;

    if (!articleAfter || !articleBefore) {
        logger.info('handleArticleStatusNotifications: Snapshot data (before or after) is missing. Exiting.', { articleId });
        return;
    }

    const authorId = articleAfter.authorId;
    if (!authorId) {
        logger.error('handleArticleStatusNotifications: authorId missing in article. Cannot send notification.', { articleId });
        return;
    }

    // Check if status actually changed
    if (articleBefore.status !== articleAfter.status) {
        logger.info(`handleArticleStatusNotifications: Article ${articleId} status changed from '${articleBefore.status}' to '${articleAfter.status}'.`);

        if (articleAfter.status === 'published') {
            await createNotification(authorId, {
                type: "article_published", // Consistent with your status
                title: "Articolo Pubblicato!",
                message: `Il tuo articolo "${articleAfter.title || 'Senza titolo'}" è stato pubblicato.`,
                link: `/view-article.html?id=${articleId}`,
                icon: "check_circle",
                relatedItemId: articleId,
            });
        } else if (articleAfter.status === 'rejected') { // Using your confirmed status 'rejected'
            // Using your confirmed field 'rejectionReason'
            const reason = articleAfter.rejectionReason || 'Nessun motivo specificato.';
            // const snippetInfo = articleAfter.snippet ? ` Snippet: "${articleAfter.snippet}"` : ""; // Uncomment if snippet is desired in message
            await createNotification(authorId, {
                type: "article_rejected",
                title: "Articolo Respinto",
                message: `Il tuo articolo "${articleAfter.title || 'Senza titolo'}" è stato respinto. Motivo: ${reason}`,
                link: `/submit-article.html?id=${articleId}`, // Or user's article management page
                icon: "error",
                relatedItemId: articleId,
            });
        }
        // Add other 'else if' blocks here for other status changes needing notifications
    }
});


// --- EXISTING FUNCTION: updateAuthorOnArticlePublish (MODIFIED for Badge Notification) ---
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

    // Only proceed if the article is newly published
    if (newValue.status === 'published' && previousValue.status !== 'published') {
        const authorId = newValue.authorId;
        if (!authorId) {
            logger.error("updateAuthorOnArticlePublish: AuthorId missing in the published article:", articleId);
            return;
        }

        const userProfileRef = db.collection('userProfiles').doc(authorId);
        let profileUpdates = {};
        let newBadgeAwardedId = null; // To store ID of newly awarded badge for notification

        try {
            const userProfileSnap = await userProfileRef.get();
            if (!userProfileSnap.exists) {
                logger.warn(`updateAuthorOnArticlePublish: User profile not found for authorId: ${authorId}`);
                return;
            }
            const userProfileData = userProfileSnap.data();

            // Update 'hasPublishedArticles' flag
            if (userProfileData.hasPublishedArticles !== true) {
                profileUpdates.hasPublishedArticles = true;
                logger.info(`updateAuthorOnArticlePublish: Flag 'hasPublishedArticles' will be set to true for user: ${authorId}`);
            }

            // Award 'Autore Debuttante' badge if not already earned
            const earnedBadges = userProfileData.earnedBadges || [];
            if (!earnedBadges.includes(BADGE_ID_AUTORE_DEBUTTANTE)) {
                if (FieldValue && typeof FieldValue.arrayUnion === 'function') {
                    profileUpdates.earnedBadges = FieldValue.arrayUnion(BADGE_ID_AUTORE_DEBUTTANTE);
                    newBadgeAwardedId = BADGE_ID_AUTORE_DEBUTTANTE; // Mark for notification
                    logger.info(`updateAuthorOnArticlePublish: Badge '${BADGE_ID_AUTORE_DEBUTTANTE}' will be awarded to user: ${authorId}`);
                } else {
                    logger.error('updateAuthorOnArticlePublish: CRITICAL ERROR - FieldValue.arrayUnion is not a function!', { fieldValueObject: FieldValue });
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

                // Send notification for the newly awarded badge, if any
                if (newBadgeAwardedId && BADGE_DETAILS[newBadgeAwardedId]) {
                    const badgeInfo = BADGE_DETAILS[newBadgeAwardedId];
                    await createNotification(authorId, {
                        type: "new_badge",
                        title: "Nuovo Badge Sbloccato!",
                        message: `Hai ottenuto il badge: ${badgeInfo.name} ${badgeInfo.description}`,
                        link: `/profile.html?uid=${authorId}${badgeInfo.linkPath || ''}`,
                        icon: badgeInfo.icon,
                        relatedItemId: newBadgeAwardedId,
                    });
                }
            }
        } catch (error) {
            logger.error("updateAuthorOnArticlePublish: Error updating user profile or sending badge notification:", error, { authorId });
        }
    }
});

// --- EXISTING FUNCTION: awardGlitchzillaSlayer (MODIFIED for Badge Notification) ---
exports.awardGlitchzillaSlayer = onDocumentCreated('leaderboardScores/{scoreId}', async (event) => {
    if (!event.data) {
        logger.warn('awardGlitchzillaSlayer: Event data missing (no document created?).', { eventId: event.id });
        return;
    }
    const scoreData = event.data.data();
    const scoreId = event.params.scoreId; 

    if (scoreData.userId && scoreData.glitchzillaDefeated === true) {
        const userId = scoreData.userId;
        const userProfileRef = db.collection('userProfiles').doc(userId);
        let profileUpdatesGlitch = {};
        let newBadgeAwardedId = null; // To store ID of newly awarded badge for notification

        try {
            const userProfileSnap = await userProfileRef.get();
            if (!userProfileSnap.exists) {
                logger.warn(`awardGlitchzillaSlayer: User profile not found for userId: ${userId} from score ${scoreId}`);
                return;
            }
            const userProfileData = userProfileSnap.data();

            // Update 'hasDefeatedGlitchzilla' flag
            if (userProfileData.hasDefeatedGlitchzilla !== true) {
                profileUpdatesGlitch.hasDefeatedGlitchzilla = true;
                logger.info(`awardGlitchzillaSlayer: Flag 'hasDefeatedGlitchzilla' will be set to true for user: ${userId}`);
            }

            // Award 'Glitchzilla Slayer' badge if not already earned
            const earnedBadges = userProfileData.earnedBadges || [];
            if (!earnedBadges.includes(BADGE_ID_GLITCHZILLA_SLAYER)) {
                if (FieldValue && typeof FieldValue.arrayUnion === 'function') {
                     profileUpdatesGlitch.earnedBadges = FieldValue.arrayUnion(BADGE_ID_GLITCHZILLA_SLAYER);
                     newBadgeAwardedId = BADGE_ID_GLITCHZILLA_SLAYER; // Mark for notification
                     logger.info(`awardGlitchzillaSlayer: Badge '${BADGE_ID_GLITCHZILLA_SLAYER}' will be awarded to user: ${userId}`);
                } else {
                    logger.error('awardGlitchzillaSlayer: CRITICAL ERROR - FieldValue.arrayUnion is not a function!', { fieldValueObject: FieldValue });
                }
            }

            if (Object.keys(profileUpdatesGlitch).length > 0) {
                if (FieldValue && typeof FieldValue.serverTimestamp === 'function') {
                    profileUpdatesGlitch.updatedAt = FieldValue.serverTimestamp();
                } else {
                    logger.error(
                        'awardGlitchzillaSlayer: CRITICAL ERROR - FieldValue.serverTimestamp is not a function! Using Date() as fallback.',
                         { fieldValueObject: FieldValue }
                    );
                    profileUpdatesGlitch.updatedAt = new Date();
                }
                await userProfileRef.update(profileUpdatesGlitch);
                logger.info(`awardGlitchzillaSlayer: User profile ${userId} updated with Glitchzilla data:`, profileUpdatesGlitch);

                // Send notification for the newly awarded badge, if any
                if (newBadgeAwardedId && BADGE_DETAILS[newBadgeAwardedId]) {
                    const badgeInfo = BADGE_DETAILS[newBadgeAwardedId];
                    await createNotification(userId, {
                        type: "new_badge",
                        title: "Nuovo Badge Sbloccato!",
                        message: `Hai ottenuto il badge: ${badgeInfo.name} ${badgeInfo.description}`,
                        link: `/profile.html?uid=${userId}${badgeInfo.linkPath || ''}`,
                        icon: badgeInfo.icon,
                        relatedItemId: newBadgeAwardedId,
                    });
                }
            }
        } catch (error) {
            logger.error("awardGlitchzillaSlayer: Error updating user profile for Glitchzilla or sending badge notification:", error, { userId });
        }
    }
});


// --- EXISTING FUNCTION: processUploadedAvatar (UNCHANGED LOGIC) ---
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
        const fileObject = event.data; 
        const filePath = fileObject.name;
        const contentType = fileObject.contentType;
        const bucketName = fileObject.bucket;

        logger.info(`processUploadedAvatar: New file detected: ${filePath} in bucket ${bucketName} with type ${contentType}`);

        if (!contentType || !contentType.startsWith('image/')) {
            logger.log("processUploadedAvatar: Not an image. Exiting.");
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
        const tempLocalThumbPath = path.join(os.tmpdir(),`thumb_${tempFileNameBaseForLocal}.webp`);
        const tempLocalProfilePath = path.join(os.tmpdir(),`profile_${tempFileNameBaseForLocal}.webp`);

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
                    small: thumbUrl,
                    profile: profileUrl,
                },
                profileUpdatedAt: FieldValue.serverTimestamp(), 
            });
            logger.info(`processUploadedAvatar: User profile ${userId} updated with new avatar URLs.`);

            await bucket.file(filePath).delete();
            logger.info(`processUploadedAvatar: Original image ${filePath} deleted from Storage.`);

            await fs.remove(tempLocalOriginalPath);
            await fs.remove(tempLocalThumbPath);
            await fs.remove(tempLocalProfilePath);
            logger.info('processUploadedAvatar: Temporary local files deleted.');

            return null;
        } catch (error) {
            logger.error("processUploadedAvatar: Error during avatar processing:", error, { userId, filePath });
            await fs.remove(tempLocalOriginalPath).catch(e => logger.warn('processUploadedAvatar: Error deleting temp original (in catch):', e));
            await fs.remove(tempLocalThumbPath).catch(e => logger.warn('processUploadedAvatar: Error deleting temp thumb (in catch):', e));
            await fs.remove(tempLocalProfilePath).catch(e => logger.warn('processUploadedAvatar: Error deleting temp profile (in catch):', e));
            return null;
        }
    }
);
// Add other Cloud Functions below as needed
