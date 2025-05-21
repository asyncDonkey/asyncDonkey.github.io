// functions/userPublicProfileSync.js

const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');

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
        statusMessage: userProfileData.statusMessage || null, // <-- AGGIUNTO QUI
        nationalityCode: userProfileData.nationalityCode || null,
        hasPublishedArticles: userProfileData.hasPublishedArticles || false,
        hasDefeatedGlitchzilla: userProfileData.hasDefeatedGlitchzilla || false,
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
        await db.collection("userPublicProfiles").doc(userId).set(publicProfileData);
        logger.info(`[CF:handleCreateUserPublicProfile] Public profile for ${userId} created successfully.`);
    } catch (error) {
        logger.error(
            `[CF:handleCreateUserPublicProfile] Error creating public profile for ${userId}:`,
            error
        );
    }
    return null;
}

/**
 * Handles the update of a userPublicProfile document.
 * @param {functions.firestore.FirestoreEvent<functions.Change<functions.firestore.QueryDocumentSnapshot> | undefined>} event The Firestore event.
 */
async function handleUpdateUserPublicProfile(event) {
    const userId = event.params.userId;
    const newData = event.data.after.data();
    const oldData = event.data.before.data();

    if (!newData || !oldData) {
        logger.info(`[CF:handleUpdateUserPublicProfile] Snapshot data (before or after) for ${userId} is missing. Exiting.`);
        return null;
    }

    const relevantFields = [
        "nickname", "bio", "statusMessage", // <-- AGGIUNTO QUI
        "avatarUrls", "nationalityCode",
        "hasPublishedArticles", "hasDefeatedGlitchzilla",
        "kodComplimentsReceived", "kodRank",
    ];

    let changed = false;
    for (const field of relevantFields) {
        if (JSON.stringify(newData[field]) !== JSON.stringify(oldData[field])) {
            changed = true;
            logger.info(`[CF:handleUpdateUserPublicProfile] Field '${field}' changed for user ${userId}.`);
            break;
        }
    }

    if (!changed) {
        logger.info(`[CF:handleUpdateUserPublicProfile] No relevant public fields changed for ${userId}. No update to public profile.`);
        return null;
    }

    logger.info(`[CF:handleUpdateUserPublicProfile] Updating public profile for user: ${userId}`);
    const publicProfileDataToUpdate = preparePublicProfileData(newData);

    try {
        await db.collection("userPublicProfiles").doc(userId).set(publicProfileDataToUpdate, { merge: true });
        logger.info(`[CF:handleUpdateUserPublicProfile] Public profile for ${userId} updated successfully.`);
    } catch (error) {
        logger.error(
            `[CF:handleUpdateUserPublicProfile] Error updating public profile for ${userId}:`,
            error
        );
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
        await db.collection("userPublicProfiles").doc(userId).delete();
        logger.info(`[CF:handleDeleteUserPublicProfile] Public profile for ${userId} deleted successfully.`);
    } catch (error) {
        logger.error(
            `[CF:handleDeleteUserPublicProfile] Error deleting public profile for ${userId}:`,
            error
        );
    }
    return null;
}

module.exports = {
    handleCreateUserPublicProfile,
    handleUpdateUserPublicProfile,
    handleDeleteUserPublicProfile,
};