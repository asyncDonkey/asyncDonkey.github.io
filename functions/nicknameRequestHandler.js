// functions/nicknameRequestHandler.js

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');
const { createNotification } = require('./notificationUtils'); // <-- IMPORTIAMO LA NUOVA FUNZIONE

// Assumendo che admin.initializeApp() sia già stato chiamato in index.js
const db = admin.firestore();

const NICKNAME_CHANGE_COOLDOWN_DAYS = 90;
const NICKNAME_CHANGE_COOLDOWN_MS = NICKNAME_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

/**
 * Controlla se un nickname è già in uso da un altro utente, in modo case-insensitive.
 * @param {string} nickname Il nickname da controllare.
 * @param {string} currentUserId L'ID dell'utente che fa la richiesta, da escludere dalla ricerca.
 * @returns {Promise<boolean>} True se il nickname è già in uso, altrimenti false.
 */
async function isNicknameTaken(nickname, currentUserId) {
    const normalizedRequestedNickname = nickname.toLowerCase();
    const snapshot = await db.collection('userProfiles').get();

    for (const doc of snapshot.docs) {
        const existingNickname = doc.data().nickname;
        if (existingNickname && existingNickname.toLowerCase() === normalizedRequestedNickname) {
            if (doc.id !== currentUserId) {
                return true;
            }
        }
    }

    return false;
}

exports.requestNicknameChange = onCall(async (request) => {
    // 1. Autenticazione
    if (!request.auth) {
        logger.warn('requestNicknameChange: Chiamata non autenticata.');
        throw new HttpsError('unauthenticated', 'Devi essere autenticato per eseguire questa operazione.');
    }

    const userId = request.auth.uid;
    const { requestedNickname } = request.data;
    logger.info(
        `requestNicknameChange: Ricevuta richiesta da userId: ${userId} per il nickname: "${requestedNickname}"`
    );

    // 2. Validazione Input Base
    if (!requestedNickname || typeof requestedNickname !== 'string') {
        throw new HttpsError('invalid-argument', 'Il nickname richiesto non è valido.');
    }
    const trimmedNickname = requestedNickname.trim();
    if (trimmedNickname.length < 3 || trimmedNickname.length > 20) {
        throw new HttpsError('invalid-argument', 'Il nickname deve avere tra 3 e 20 caratteri.');
    }
    const nicknameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!nicknameRegex.test(trimmedNickname)) {
        throw new HttpsError('invalid-argument', "Il nickname può contenere solo lettere, numeri, '_' e '-'.");
    }

    const userProfileRef = db.collection('userProfiles').doc(userId);

    try {
        const userProfileSnap = await userProfileRef.get();
        if (!userProfileSnap.exists) {
            throw new HttpsError('not-found', 'Profilo utente non trovato.');
        }
        const profileData = userProfileSnap.data();

        // 3. Controllo Cooldown (Server-Side)
        if (profileData.lastNicknameRequestTimestamp) {
            const lastRequestDate = profileData.lastNicknameRequestTimestamp.toDate();
            const timeSinceLastRequest = new Date().getTime() - lastRequestDate.getTime();
            if (timeSinceLastRequest < NICKNAME_CHANGE_COOLDOWN_MS) {
                const remainingMs = NICKNAME_CHANGE_COOLDOWN_MS - timeSinceLastRequest;
                const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
                logger.warn(`Utente ${userId} in cooldown. Rimanenti: ${remainingDays} giorni.`);
                throw new HttpsError(
                    'failed-precondition',
                    `Sei in periodo di cooldown. Potrai fare una nuova richiesta tra ${remainingDays} giorni.`
                );
            }
        }

        // 4. Controllo Unicità Nickname (Case-Insensitive)
        if (await isNicknameTaken(trimmedNickname, userId)) {
            logger.warn(`Il nickname "${trimmedNickname}" (o una sua variante case) è già stato preso.`);
            throw new HttpsError('already-exists', 'Questo nickname è già in uso. Scegline un altro.');
        }

        // 5. Creazione della richiesta e aggiornamento profilo utente
        const requestDocRef = db.collection('nicknameChangeRequests').doc();

        await db.runTransaction(async (transaction) => {
            transaction.set(requestDocRef, {
                userId: userId,
                currentNickname: profileData.nickname || '',
                requestedNickname: trimmedNickname,
                status: 'pending',
                requestedAt: FieldValue.serverTimestamp(),
                userEmail: profileData.email,
            });

            transaction.update(userProfileRef, {
                lastNicknameRequestTimestamp: FieldValue.serverTimestamp(),
            });
        });

        logger.info(`Richiesta cambio nickname per l'utente ${userId} creata con successo (ID: ${requestDocRef.id}).`);
        return { success: true, message: 'Richiesta inviata con successo!' };
    } catch (error) {
        logger.error(`Errore durante la richiesta di cambio nickname per l'utente ${userId}:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'Si è verificato un errore interno. Riprova più tardi.');
    }
});

/**
 * Approva una richiesta di cambio nickname.
 */
exports.approveNicknameChange = onCall(async (request) => {
    logger.info('Inizio approveNicknameChange. Dati richiesta:', request.data);
    // 1. Autenticazione e Autorizzazione Admin
    if (!request.auth) {
        logger.warn('approveNicknameChange: Chiamata non autenticata.');
        throw new HttpsError('unauthenticated', 'Devi essere autenticato per eseguire questa operazione.');
    }
    const adminUid = request.auth.uid;
    const adminProfileRef = db.collection('userProfiles').doc(adminUid);
    let isAdminUser = false;
    try {
        const adminProfileSnap = await adminProfileRef.get();
        if (adminProfileSnap.exists && adminProfileSnap.data().isAdmin === true) {
            isAdminUser = true;
        }
    } catch (error) {
        logger.error('approveNicknameChange: Errore nel recuperare il profilo admin:', error);
        throw new HttpsError('internal', 'Errore durante la verifica dei permessi admin.');
    }

    if (!isAdminUser) {
        logger.warn(`approveNicknameChange: Utente ${adminUid} non è admin.`);
        throw new HttpsError('permission-denied', 'Non hai i permessi per eseguire questa operazione.');
    }

    // 2. Validazione Input
    const { requestId, userId, newNickname } = request.data;
    if (
        !requestId ||
        !userId ||
        !newNickname ||
        typeof newNickname !== 'string' ||
        newNickname.length < 3 ||
        newNickname.length > 20
    ) {
        throw new HttpsError('invalid-argument', 'Parametri non validi.');
    }
    const nicknameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!nicknameRegex.test(newNickname)) {
        throw new HttpsError('invalid-argument', "Il nuovo nickname può contenere solo lettere, numeri, '_' e '-'.");
    }

    const nicknameRequestRef = db.collection('nicknameChangeRequests').doc(requestId);
    const userProfileRef = db.collection('userProfiles').doc(userId);

    logger.info(
        `approveNicknameChange: Admin ${adminUid} sta approvando la richiesta ${requestId} per l'utente ${userId} con il nuovo nickname "${newNickname}".`
    );

    try {
        if (await isNicknameTaken(newNickname, userId)) {
            logger.warn(`approveNicknameChange: Il nickname "${newNickname}" è stato preso nel frattempo.`);
            await nicknameRequestRef.update({
                status: 'failed_approval_name_taken',
                processedAt: FieldValue.serverTimestamp(),
                processedBy: adminUid,
                notes: `Tentativo di approvazione fallito: il nickname '${newNickname}' è stato preso nel frattempo.`,
            });
            throw new HttpsError(
                'already-exists',
                `Il nickname "${newNickname}" è già in uso. La richiesta non può essere approvata.`
            );
        }

        await db.runTransaction(async (transaction) => {
            const requestSnap = await transaction.get(nicknameRequestRef);
            if (!requestSnap.exists) {
                throw new HttpsError('not-found', 'Richiesta di cambio nickname non trovata.');
            }
            if (requestSnap.data().status !== 'pending') {
                throw new HttpsError('failed-precondition', `La richiesta non è più in stato 'pending'.`);
            }

            // 1. Aggiorna la richiesta
            transaction.update(nicknameRequestRef, {
                status: 'approved',
                processedAt: FieldValue.serverTimestamp(),
                processedBy: adminUid,
                finalNickname: newNickname,
            });

            // 2. Aggiorna il profilo utente
            transaction.update(userProfileRef, {
                nickname: newNickname,
                updatedAt: FieldValue.serverTimestamp(),
            });

            // L'aggiornamento del profilo pubblico è gestito dalla funzione trigger `updateUserPublicProfile`
        });

        // 3. INVIA NOTIFICA DI SUCCESSO (FUNC.1.4)
        await createNotification(userId, {
            type: 'nickname_approved',
            title: 'Nickname Approvato!',
            message: `Il tuo nuovo nickname "${newNickname}" è stato approvato ed è ora attivo.`,
            link: `/profile.html?uid=${userId}`,
            icon: 'check_circle',
        });

        logger.info(`approveNicknameChange: Richiesta ${requestId} approvata con successo per l'utente ${userId}.`);
        return { success: true, message: 'Nickname approvato e aggiornato con successo!' };
    } catch (error) {
        logger.error(`approveNicknameChange: Errore durante l'approvazione della richiesta ${requestId}:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', "Si è verificato un errore interno durante l'approvazione.");
    }
});

/**
 * Rifiuta una richiesta di cambio nickname.
 */
exports.rejectNicknameChange = onCall(async (request) => {
    logger.info('Inizio rejectNicknameChange. Dati richiesta:', request.data);

    // 1. Autenticazione e Autorizzazione Admin
    if (!request.auth) {
        logger.warn('rejectNicknameChange: Chiamata non autenticata.');
        throw new HttpsError('unauthenticated', 'Devi essere autenticato per eseguire questa operazione.');
    }
    const adminUid = request.auth.uid;
    const adminProfileRef = db.collection('userProfiles').doc(adminUid);
    let isAdminUser = false;
    try {
        const adminProfileSnap = await adminProfileRef.get();
        if (adminProfileSnap.exists && adminProfileSnap.data().isAdmin === true) {
            isAdminUser = true;
        }
    } catch (error) {
        logger.error('rejectNicknameChange: Errore nel recuperare il profilo admin:', error);
        throw new HttpsError('internal', 'Errore durante la verifica dei permessi admin.');
    }
    if (!isAdminUser) {
        logger.warn(`rejectNicknameChange: Utente ${adminUid} non è admin.`);
        throw new HttpsError('permission-denied', 'Non hai i permessi per eseguire questa operazione.');
    }

    // 2. Validazione Input
    const { requestId, userId, reason } = request.data;
    if (!requestId || !userId) {
        throw new HttpsError('invalid-argument', 'ID richiesta o ID utente non validi.');
    }
    if (reason && typeof reason !== 'string') {
        throw new HttpsError('invalid-argument', 'Il motivo del rifiuto deve essere una stringa.');
    }
    const trimmedReason = reason ? reason.trim() : null;

    const nicknameRequestRef = db.collection('nicknameChangeRequests').doc(requestId);
    logger.info(
        `rejectNicknameChange: Admin ${adminUid} sta rifiutando la richiesta ${requestId}. Motivo: "${trimmedReason || 'Nessuno'}".`
    );

    try {
        let requestedNickname = '';

        await db.runTransaction(async (transaction) => {
            const requestSnap = await transaction.get(nicknameRequestRef);
            if (!requestSnap.exists) {
                throw new HttpsError('not-found', 'Richiesta di cambio nickname non trovata.');
            }
            const requestData = requestSnap.data();
            requestedNickname = requestData.requestedNickname; // Salviamo il nickname per la notifica

            if (requestData.status !== 'pending') {
                throw new HttpsError('failed-precondition', `La richiesta non è più in stato 'pending'.`);
            }

            // Aggiorna la richiesta
            const updateData = {
                status: 'rejected',
                processedAt: FieldValue.serverTimestamp(),
                processedBy: adminUid,
            };
            if (trimmedReason) {
                updateData.rejectionReason = trimmedReason;
            }
            transaction.update(nicknameRequestRef, updateData);
        });

        // 3. INVIA NOTIFICA DI RIFIUTO (FUNC.1.4)
        const rejectionMessage =
            `La tua richiesta per il nickname "${requestedNickname}" è stata rifiutata.` +
            (trimmedReason ? ` Motivo: ${trimmedReason}` : '');
        await createNotification(userId, {
            type: 'nickname_rejected',
            title: 'Richiesta Nickname Rifiutata',
            message: rejectionMessage,
            link: `/profile.html?uid=${userId}`,
            icon: 'cancel',
        });

        logger.info(`rejectNicknameChange: Richiesta ${requestId} rifiutata con successo.`);
        return { success: true, message: 'Richiesta di cambio nickname rifiutata.' };
    } catch (error) {
        logger.error(`rejectNicknameChange: Errore durante il rifiuto della richiesta ${requestId}:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'Si è verificato un errore interno durante il rifiuto.');
    }
});
