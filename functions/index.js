// functions/index.js

// Firebase Functions v2 imports
const { onDocumentUpdated, onDocumentCreated, onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { onObjectFinalized } = require('firebase-functions/v2/storage');
const { HttpsError, onCall } = require('firebase-functions/v2/https'); // <-- MODIFICA: Aggiunto HttpsError e onCall
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
const BADGE_ID_AUTORE_DEBUTTANTE = 'author-rookie';
const BADGE_ID_GLITCHZILLA_SLAYER = 'glitchzilla-slayer';
const BADGE_ID_VERIFIED_USER = 'verified-user'; // <-- NUOVO: ID Badge utente verificato

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
    // <-- NUOVO: Dettagli del nuovo badge -->
[BADGE_ID_VERIFIED_USER]: {
name: 'Utente Verificato',
description: 'Hai verificato con successo il tuo indirizzo email.',
icon: 'verified_user',
linkPath: '#badgesSection',
},
};

// --- USER PUBLIC PROFILE SYNC FUNCTIONS ---
exports.createUserPublicProfile = onDocumentCreated('userProfiles/{userId}', userPublicProfileSync.handleCreateUserPublicProfile);
exports.updateUserPublicProfile = onDocumentUpdated('userProfiles/{userId}', userPublicProfileSync.handleUpdateUserPublicProfile);
exports.deleteUserPublicProfile = onDocumentDeleted('userProfiles/{userId}', userPublicProfileSync.handleDeleteUserPublicProfile);

// --- ARTICLE STATUS NOTIFICATIONS ---
exports.handleArticleStatusNotifications = onDocumentUpdated('articles/{articleId}', async (event) => {
// (Il codice di questa funzione rimane invariato)
if (!event.data) return;
const articleAfter = event.data.after.data();
const articleBefore = event.data.before.data();
const articleId = event.params.articleId;
if (!articleAfter || !articleBefore) return;
const authorId = articleAfter.authorId;
if (!authorId) return;

if (articleBefore.status !== articleAfter.status) {
if (articleAfter.status === 'published') {
await createNotification(authorId, { type: 'article_published', title: 'Articolo Pubblicato!', message: `Il tuo articolo "${articleAfter.title || 'Senza titolo'}" è stato pubblicato.`, link: `/view-article.html?id=${articleId}`, icon: 'check_circle', relatedItemId: articleId });
} else if (articleAfter.status === 'rejected') {
const reason = articleAfter.rejectionReason || 'Nessun motivo specificato.';
await createNotification(authorId, { type: 'article_rejected', title: 'Articolo Respinto', message: `Il tuo articolo "${articleAfter.title || 'Senza titolo'}" è stato respinto. Motivo: ${reason}`, link: `/submit-article.html?id=${articleId}`, icon: 'error', relatedItemId: articleId });
}
}
});

// --- NOTIFY ADMINS ON NEW NICKNAME REQUEST ---
exports.notifyAdminsOnNewNicknameRequest = onDocumentCreated('nicknameChangeRequests/{requestId}', async (event) => {
    // (Il codice di questa funzione rimane invariato)
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
const notificationPayload = { type: 'admin_new_nickname_request', title: 'Nuova Richiesta Nickname', message: `L'utente ${currentNickname} ha richiesto il nuovo nickname: "${requestedNickname}".`, link: '/admin-dashboard.html#nickname-requests-section', icon: 'manage_accounts', relatedItemId: event.params.requestId };
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
    // (Il codice di questa funzione rimane invariato)
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
if (newBadgeAwardedId && BADGE_DETAILS[newBadgeAwardedId]) {
const badgeInfo = BADGE_DETAILS[newBadgeAwardedId];
await createNotification(authorId, { type: 'new_badge', title: 'Nuovo Badge Sbloccato!', message: `Hai ottenuto il badge: ${badgeInfo.name}. ${badgeInfo.description}`, link: `/profile.html?uid=${authorId}${badgeInfo.linkPath || ''}`, icon: badgeInfo.icon, relatedItemId: newBadgeAwardedId });
}
}
});
} catch (error) {
logger.error('updateAuthorOnArticlePublish: Error in transaction:', error, { authorId });
}
}
});

exports.awardGlitchzillaSlayer = onDocumentCreated('leaderboardScores/{scoreId}', async (event) => {
    // (Il codice di questa funzione rimane invariato)
if (!event.data) return;
const scoreData = event.data.data();
if (scoreData.userId && scoreData.glitchzillaDefeated === true) {
const userId = scoreData.userId;
const userProfileRef = db.collection('userProfiles').doc(userId);
try {
await db.runTransaction(async (transaction) => {
const userProfileSnap = await transaction.get(userProfileRef);
if (!userProfileSnap.exists) return;
const userProfileData = userProfileSnap.data();
let profileUpdates = {};
let newBadgeAwardedId = null;

if (userProfileData.hasDefeatedGlitchzilla !== true) profileUpdates.hasDefeatedGlitchzilla = true;
const earnedBadges = userProfileData.earnedBadges || [];
if (!earnedBadges.includes(BADGE_ID_GLITCHZILLA_SLAYER)) {
profileUpdates.earnedBadges = FieldValue.arrayUnion(BADGE_ID_GLITCHZILLA_SLAYER);
newBadgeAwardedId = BADGE_ID_GLITCHZILLA_SLAYER;
}

if (Object.keys(profileUpdates).length > 0) {
profileUpdates.updatedAt = FieldValue.serverTimestamp();
transaction.update(userProfileRef, profileUpdates);
if (newBadgeAwardedId && BADGE_DETAILS[newBadgeAwardedId]) {
const badgeInfo = BADGE_DETAILS[newBadgeAwardedId];
await createNotification(userId, { type: 'new_badge', title: 'Nuovo Badge Sbloccato!', message: `Hai ottenuto il badge: ${badgeInfo.name}. ${badgeInfo.description}`, link: `/profile.html?uid=${userId}${badgeInfo.linkPath || ''}`, icon: badgeInfo.icon, relatedItemId: newBadgeAwardedId });
}
}
});
} catch (error) {
logger.error('awardGlitchzillaSlayer: Error in transaction:', error, { userId });
}
}
});


// --- NUOVA FUNZIONE CALLABLE ---
/**
 * Assegna il badge 'Utente Verificato' e invia una notifica.
 * Questa funzione è chiamata dal client dopo che ha verificato che user.emailVerified è true.
 */
exports.grantVerificationBadge = onCall({ region: 'us-central1' }, async (request) => {
    const functionName = 'grantVerificationBadge';
    logger.info(`[CF:${functionName}] Function triggered.`);

    // 1. Controlla l'autenticazione
    if (!request.auth || !request.auth.uid) {
        logger.warn(`[CF:${functionName}] Unauthorized call. Auth context missing.`);
        throw new HttpsError('unauthenticated', 'Devi essere autenticato per eseguire questa operazione.');
    }
    const userId = request.auth.uid;
    const userEmail = request.auth.token.email || 'N/A';

    // 2. Controlla che l'email sia effettivamente verificata (doppio controllo)
    if (!request.auth.token.email_verified) {
        logger.warn(`[CF:${functionName}] User ${userId} (${userEmail}) called function without a verified email.`);
        throw new HttpsError('failed-precondition', 'La tua email non risulta ancora verificata.');
    }
    
    const userProfileRef = db.collection('userProfiles').doc(userId);
    const newBadgeId = BADGE_ID_VERIFIED_USER;
    
    try {
        // 3. Esegui una transazione per garantire l'atomicità
        await db.runTransaction(async (transaction) => {
            const userProfileSnap = await transaction.get(userProfileRef);

            if (!userProfileSnap.exists) {
                logger.error(`[CF:${functionName}] User profile for ${userId} does not exist.`);
                // Non lanciare un errore qui, potrebbe essere una condizione di race. Logghiamo e usciamo.
                return; 
            }
            const userProfileData = userProfileSnap.data();
            const earnedBadges = userProfileData.earnedBadges || [];

            // 4. Controlla se il badge è già stato assegnato per evitare duplicati
            if (earnedBadges.includes(newBadgeId)) {
                logger.info(`[CF:${functionName}] User ${userId} already has the '${newBadgeId}' badge. No action needed.`);
                return;
            }
            
            // 5. Assegna il badge
            logger.info(`[CF:${functionName}] Awarding '${newBadgeId}' badge to user ${userId}.`);
            transaction.update(userProfileRef, {
                earnedBadges: FieldValue.arrayUnion(newBadgeId),
                updatedAt: FieldValue.serverTimestamp(),
            });

            // 6. Invia la notifica (fuori dalla transazione se `createNotification` non è idempotente)
            // Poiché createNotification scrive su un'altra collection, è sicuro chiamarla dopo aver preparato l'update.
            const badgeInfo = BADGE_DETAILS[newBadgeId];
            await createNotification(userId, {
                type: 'new_badge',
                title: 'Nuovo Badge Sbloccato!',
                message: `Hai ottenuto il badge: "${badgeInfo.name}". ${badgeInfo.description}`,
                link: `/profile.html${badgeInfo.linkPath || ''}`, // Link al profilo utente, sezione badge
                icon: badgeInfo.icon,
                relatedItemId: newBadgeId,
            });
        });

        logger.info(`[CF:${functionName}] Badge e notifica per ${userId} processati con successo.`);
        return { success: true, message: 'Badge assegnato con successo!' };

    } catch (error) {
        logger.error(`[CF:${functionName}] Errore durante l'assegnazione del badge di verifica a ${userId}:`, error);
        throw new HttpsError('internal', 'Impossibile assegnare il badge. Riprova più tardi.');
    }
});


// --- NICKNAME CHANGE HANDLERS ---
exports.requestNicknameChange = nicknameHandlers.requestNicknameChange;
exports.approveNicknameChange = nicknameHandlers.approveNicknameChange;
exports.rejectNicknameChange = nicknameHandlers.rejectNicknameChange;

// --- AVATAR PROCESSING ---
// (Il codice di questa funzione rimane invariato)
const AVATAR_THUMBNAIL_SIZE = 48;
const AVATAR_PROFILE_SIZE = 160;
exports.processUploadedAvatar = onObjectFinalized({ bucket: 'asyncdonkey.firebasestorage.app', memory: '512MiB', timeoutSeconds: 120, cpu: 1 }, async (event) => {
    // ... codice esistente ...
    const fileObject = event.data;
    const filePath = fileObject.name;
    const contentType = fileObject.contentType;
    const bucketName = fileObject.bucket;
    if (!contentType || !contentType.startsWith('image/')) return null;
    if (!filePath || !filePath.startsWith('user-avatars/')) return null;
    if (filePath.includes('/processed/')) return null;
    if (filePath.includes(`avatar_${AVATAR_THUMBNAIL_SIZE}.webp`) || filePath.includes(`avatar_${AVATAR_PROFILE_SIZE}.webp`)) return null;
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
        await sharp(tempLocalOriginalPath).resize(AVATAR_THUMBNAIL_SIZE, AVATAR_THUMBNAIL_SIZE, { fit: 'cover' }).webp({ quality: 80 }).toFile(tempLocalThumbPath);
        await sharp(tempLocalOriginalPath).resize(AVATAR_PROFILE_SIZE, AVATAR_PROFILE_SIZE, { fit: 'cover' }).webp({ quality: 80 }).toFile(tempLocalProfilePath);
        const thumbStoragePath = `user-avatars/${userId}/processed/avatar_small.webp`;
        const profileStoragePath = `user-avatars/${userId}/processed/avatar_profile.webp`;
        const [thumbUploadResponse] = await bucket.upload(tempLocalThumbPath, { destination: thumbStoragePath, metadata: { contentType: 'image/webp', cacheControl: 'public, max-age=3600' }});
        const [profileUploadResponse] = await bucket.upload(tempLocalProfilePath, { destination: profileStoragePath, metadata: { contentType: 'image/webp', cacheControl: 'public, max-age=3600' }});
        await thumbUploadResponse.makePublic();
        await profileUploadResponse.makePublic();
        await db.collection('userProfiles').doc(userId).update({ avatarUrls: { small: thumbUploadResponse.publicUrl(), profile: profileUploadResponse.publicUrl() }, profileUpdatedAt: FieldValue.serverTimestamp() });
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
});