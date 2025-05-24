// File: functions/userPublicProfileSync.js

const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');

// Assicurati che db sia inizializzato qui se non lo importi da index.js
// if (admin.apps.length === 0) { // Potrebbe non essere necessario se index.js lo fa sempre per primo
// admin.initializeApp();
// }
const db = admin.firestore();

/**
 * Prepares the public profile data object from the main user profile data.
 * @param {object} userProfileData The full user profile data.
 * @return {object} The data object for userPublicProfiles.
 */
function preparePublicProfileData(userProfileData) {
    const publicData = {
        nickname: userProfileData.nickname || null,
        bio: userProfileData.bio || null,
        statusMessage: userProfileData.statusMessage || null,
        nationalityCode: userProfileData.nationalityCode || null,
        hasPublishedArticles: userProfileData.hasPublishedArticles || false,
        hasDefeatedGlitchzilla: userProfileData.hasDefeatedGlitchzilla || false,
        earnedBadges: userProfileData.earnedBadges || [], // Assicura che sia un array
        kodComplimentsReceived: userProfileData.kodComplimentsReceived || 0,
        kodRank: userProfileData.kodRank || null,
        profilePublicUpdatedAt: FieldValue.serverTimestamp(),
    };

    if (userProfileData.avatarUrls) {
        if (userProfileData.avatarUrls.small) {
            publicData.avatarUrls = { thumbnail: userProfileData.avatarUrls.small };
        } else if (userProfileData.avatarUrls.profile) {
            publicData.avatarUrls = { thumbnail: userProfileData.avatarUrls.profile };
        } else {
            publicData.avatarUrls = null;
        }
    } else {
        publicData.avatarUrls = null;
    }
    return publicData;
}

/**
 * Handles the creation of a userPublicProfile document.
 * @param {functions.firestore.FirestoreEvent<functions.firestore.QueryDocumentSnapshot | undefined>} event The Firestore event.
 */
async function handleCreateUserPublicProfile(event) {
    const userId = event.params.userId;
    const newUserProfileData = event.data.data();

    if (!newUserProfileData) {
        logger.info(`[CF:handleCreateUserPublicProfile] New profile data for ${userId} is missing. Exiting.`);
        return null;
    }

    logger.info(`[CF:handleCreateUserPublicProfile] Creating public profile for user: ${userId}`);
    const publicProfileData = preparePublicProfileData(newUserProfileData);

    try {
        await db.collection('userPublicProfiles').doc(userId).set(publicProfileData);
        logger.info(`[CF:handleCreateUserPublicProfile] Public profile for ${userId} created successfully.`);
    } catch (error) {
        logger.error(`[CF:handleCreateUserPublicProfile] Error creating public profile for ${userId}:`, error);
    }
    return null;
}

/**
 * Handles the update of a userPublicProfile document.
 * @param {functions.firestore.FirestoreEvent<functions.Change<functions.firestore.QueryDocumentSnapshot> | undefined>} event The Firestore event.
 */
async function handleUpdateUserPublicProfile(event) {
    const userId = event.params.userId;
    logger.info(`[CF:handleUpdateUserPublicProfile] Triggered for userId: ${userId}`);

    if (!event.data || !event.data.before || !event.data.after) {
        logger.warn(`[CF:handleUpdateUserPublicProfile] Event data, before, or after snapshot is missing for userId: ${userId}. Exiting.`);
        return null;
    }

    const newData = event.data.after.data();
    const oldData = event.data.before.data();

    if (!newData || !oldData) {
        logger.warn(`[CF:handleUpdateUserPublicProfile] Snapshot data (newData or oldData) for ${userId} is missing after access. Exiting.`);
        return null;
    }

    const relevantFields = [
        'nickname',
        'bio',
        'statusMessage',
        'avatarUrls',
        'nationalityCode',
        'hasPublishedArticles',
        'hasDefeatedGlitchzilla',
        'kodComplimentsReceived',
        'kodRank',
        'earnedBadges',
    ];

    let changed = false;
    for (const field of relevantFields) {
        if (JSON.stringify(newData[field]) !== JSON.stringify(oldData[field])) {
            changed = true;
            logger.info(`[CF:handleUpdateUserPublicProfile] Field '${field}' changed for user ${userId}. Triggering update.`);
            break; 
        }
    }

    if (!changed) {
        logger.info(
            `[CF:handleUpdateUserPublicProfile] No relevant public fields changed for ${userId}. No update to public profile.`
        );
        return null;
    }

    const publicProfileDataToUpdate = preparePublicProfileData(newData);

    try {
        await db.collection('userPublicProfiles').doc(userId).set(publicProfileDataToUpdate, { merge: true });
        logger.info(`[CF:handleUpdateUserPublicProfile] Public profile for ${userId} updated successfully.`);
    } catch (error) {
        logger.error(`[CF:handleUpdateUserPublicProfile] Error updating public profile for ${userId}:`, error);
    }
    return null;
}

/**
 * Handles the deletion of a userPublicProfile document.
 * @param {functions.firestore.FirestoreEvent<functions.firestore.QueryDocumentSnapshot | undefined>} event The Firestore event.
 */
async function handleDeleteUserPublicProfile(event) {
    const userId = event.params.userId;
    logger.info(`[CF:handleDeleteUserPublicProfile] Deleting public profile for user: ${userId}`);

    try {
        await db.collection('userPublicProfiles').doc(userId).delete();
        logger.info(`[CF:handleDeleteUserPublicProfile] Public profile for ${userId} deleted successfully.`);
    } catch (error) {
        logger.error(`[CF:handleDeleteUserPublicProfile] Error deleting public profile for ${userId}:`, error);
    }
    return null;
}

module.exports = {
    handleCreateUserPublicProfile,
    handleUpdateUserPublicProfile,
    handleDeleteUserPublicProfile,
};