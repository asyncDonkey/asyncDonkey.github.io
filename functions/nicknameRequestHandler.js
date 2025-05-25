const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');

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
    // Per un controllo case-insensitive corretto, si confronta una versione normalizzata (lowercase).
    // Questo presuppone che i documenti in 'userProfiles' abbiano un campo 'nickname' standard.
    // La query recupera tutti i profili e il confronto avviene nel codice della funzione.
    // NOTA: Per collezioni molto grandi, sarebbe più performante avere un campo 'nickname_lowercase'
    // su cui effettuare direttamente la query con 'where'. Per la dimensione attuale del progetto,
    // questo approccio è un eccellente compromesso tra correttezza e semplicità infrastrutturale.
    
    const normalizedRequestedNickname = nickname.toLowerCase();
    const snapshot = await db.collection('userProfiles').get();

    for (const doc of snapshot.docs) {
        const existingNickname = doc.data().nickname;
        if (existingNickname && existingNickname.toLowerCase() === normalizedRequestedNickname) {
            // Un nickname corrispondente è stato trovato. Controlliamo se appartiene a un utente diverso.
            if (doc.id !== currentUserId) {
                return true; // Trovato, ed è di un altro utente.
            }
        }
    }
    
    return false; // Nessun nickname corrispondente trovato (o appartiene all'utente stesso).
}


exports.requestNicknameChange = onCall(async (request) => {
    // 1. Autenticazione
    if (!request.auth) {
        logger.warn('requestNicknameChange: Chiamata non autenticata.');
        throw new HttpsError('unauthenticated', 'Devi essere autenticato per eseguire questa operazione.');
    }

    const userId = request.auth.uid;
    const { requestedNickname } = request.data;
    logger.info(`requestNicknameChange: Ricevuta richiesta da userId: ${userId} per il nickname: "${requestedNickname}"`);

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
                throw new HttpsError('failed-precondition', `Sei in periodo di cooldown. Potrai fare una nuova richiesta tra ${remainingDays} giorni.`);
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
            // Scrive il nuovo documento di richiesta
            transaction.set(requestDocRef, {
                userId: userId,
                currentNickname: profileData.nickname || '',
                requestedNickname: trimmedNickname,
                status: 'pending',
                requestedAt: FieldValue.serverTimestamp(),
                userEmail: profileData.email 
            });

            // Aggiorna il timestamp sul profilo dell'utente
            transaction.update(userProfileRef, {
                lastNicknameRequestTimestamp: FieldValue.serverTimestamp()
            });
        });

        logger.info(`Richiesta cambio nickname per l'utente ${userId} creata con successo (ID: ${requestDocRef.id}).`);
        return { success: true, message: 'Richiesta inviata con successo!' };

    } catch (error) {
        logger.error(`Errore durante la richiesta di cambio nickname per l'utente ${userId}:`, error);
        if (error instanceof HttpsError) {
            throw error; // Rilancia l'errore HttpsError per il client
        }
        throw new HttpsError('internal', 'Si è verificato un errore interno. Riprova più tardi.');
    }
});

/**
 * Approva una richiesta di cambio nickname.
 * Richiede che il chiamante sia un admin.
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
    if (!requestId || typeof requestId !== 'string') {
        throw new HttpsError('invalid-argument', 'ID richiesta non valido.');
    }
    if (!userId || typeof userId !== 'string') {
        throw new HttpsError('invalid-argument', 'ID utente non valido.');
    }
    if (!newNickname || typeof newNickname !== 'string' || newNickname.length < 3 || newNickname.length > 20) {
        throw new HttpsError('invalid-argument', 'Nuovo nickname non valido (3-20 caratteri).');
    }
    const nicknameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!nicknameRegex.test(newNickname)) {
        throw new HttpsError('invalid-argument', "Il nuovo nickname può contenere solo lettere, numeri, '_' e '-'.");
    }

    // Riferimenti ai documenti
    const nicknameRequestRef = db.collection('nicknameChangeRequests').doc(requestId);
    const userProfileRef = db.collection('userProfiles').doc(userId);
    const userPublicProfileRef = db.collection('userPublicProfiles').doc(userId);

    logger.info(`approveNicknameChange: Admin ${adminUid} sta approvando la richiesta ${requestId} per l'utente ${userId} con il nuovo nickname "${newNickname}".`);

    try {
        // Controllo unicità nickname (importante farlo anche qui, nel caso fosse cambiato nel frattempo)
        if (await isNicknameTaken(newNickname, userId)) {
            logger.warn(`approveNicknameChange: Il nickname "${newNickname}" è stato preso nel frattempo.`);
            // In questo caso, potresti voler respingere automaticamente la richiesta invece di lanciare un errore generico.
            // Per ora, segnaliamo all'admin che deve rivalutare o l'utente deve scegliere un altro nome.
            // Potrebbe anche essere gestito aggiornando la richiesta a "failed_approval" con un motivo.
            await nicknameRequestRef.update({
                status: 'failed_approval_name_taken',
                processedAt: FieldValue.serverTimestamp(),
                processedBy: adminUid,
                notes: `Tentativo di approvazione fallito: il nickname '${newNickname}' è stato preso nel frattempo.`
            });
            throw new HttpsError('already-exists', `Il nickname "${newNickname}" è già in uso o è stato preso. La richiesta non può essere approvata con questo nome.`);
        }

        await db.runTransaction(async (transaction) => {
            const requestSnap = await transaction.get(nicknameRequestRef);
            if (!requestSnap.exists) {
                throw new HttpsError('not-found', 'Richiesta di cambio nickname non trovata.');
            }
            if (requestSnap.data().status !== 'pending') {
                throw new HttpsError('failed-precondition', `La richiesta non è più in stato 'pending' (stato attuale: ${requestSnap.data().status}).`);
            }

            // 1. Aggiorna la richiesta di nickname
            transaction.update(nicknameRequestRef, {
                status: 'approved',
                processedAt: FieldValue.serverTimestamp(),
                processedBy: adminUid,
                finalNickname: newNickname // Salviamo il nickname con cui è stata approvata
            });

            // 2. Aggiorna il profilo privato dell'utente
            // Non aggiorniamo lastNicknameRequestTimestamp come da tua preferenza.
            transaction.update(userProfileRef, {
                nickname: newNickname,
                // Se necessario, potresti voler aggiungere un campo come 'nicknameLastChangedAt: FieldValue.serverTimestamp()'
                updatedAt: FieldValue.serverTimestamp() // Assicurati che il profilo abbia un campo updatedAt per scopi generali
            });

            // 3. Aggiorna il profilo pubblico dell'utente
            // La funzione userPublicProfileSync dovrebbe già gestire l'aggiornamento
            // del profilo pubblico quando userProfiles cambia.
            // Tuttavia, per garantire l'aggiornamento immediato e corretto del nickname
            // e per evitare dipendenze da tempistiche di altre funzioni trigger,
            // è una buona pratica aggiornarlo esplicitamente anche qui.
            // Se hai un campo 'displayName' che deve rispecchiare il nickname, aggiornalo.
            transaction.update(userPublicProfileRef, {
                nickname: newNickname,
                // displayName: newNickname, // Se hai anche displayName da aggiornare
                // Assicurati che anche il profilo pubblico abbia un campo 'updatedAt' o simile
                // che userPublicProfileSync potrebbe usare per non sovrascrivere.
                // Se userPublicProfileSync è robusta, questo aggiornamento qui è una sicurezza aggiuntiva.
                // Considera la logica di userPublicProfileSync per evitare conflitti di scrittura.
                // Un approccio potrebbe essere aggiornare un timestamp specifico qui, che userPublicProfileSync rispetta.
                profilePublicUpdatedAt: FieldValue.serverTimestamp() // Esempio, se usi questo campo
            });

            // TODO (FUNC.1.4): Qui si potrebbe inserire la logica per creare una notifica per l'utente.
            // Ad esempio, scrivendo un nuovo documento nella sua subcollection 'notifications'.
            // const userNotificationsRef = userProfileRef.collection('notifications').doc();
            // transaction.set(userNotificationsRef, {
            // type: 'nickname_approved',
            // title: 'Nickname Approvato!',
            // message: `Il tuo nuovo nickname "${newNickname}" è stato approvato ed è ora attivo.`,
            // timestamp: FieldValue.serverTimestamp(),
            // read: false,
            // icon: 'check_circle' // o un'icona appropriata
            // });
        });

        logger.info(`approveNicknameChange: Richiesta ${requestId} approvata con successo per l'utente ${userId}.`);
        return { success: true, message: 'Nickname approvato e aggiornato con successo!' };

    } catch (error) {
        logger.error(`approveNicknameChange: Errore durante l'approvazione della richiesta ${requestId} per l'utente ${userId}:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', "Si è verificato un errore interno durante l'approvazione. Riprova.");
    }
});


/**
 * Rifiuta una richiesta di cambio nickname.
 * Richiede che il chiamante sia un admin.
 */
exports.rejectNicknameChange = onCall(async (request) => {
    logger.info('Inizio rejectNicknameChange. Dati richiesta:', request.data);

    // 1. Autenticazione e Autorizzazione Admin (simile a approveNicknameChange)
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
    const { requestId, userId, reason } = request.data; // 'reason' è opzionale
    if (!requestId || typeof requestId !== 'string') {
        throw new HttpsError('invalid-argument', 'ID richiesta non valido.');
    }
    if (!userId || typeof userId !== 'string') { // Aggiunto controllo userId anche se non lo usiamo per scrivere sul profilo utente
        throw new HttpsError('invalid-argument', 'ID utente della richiesta non valido.');
    }
    if (reason && typeof reason !== 'string') {
        throw new HttpsError('invalid-argument', 'Il motivo del rifiuto deve essere una stringa.');
    }
    const trimmedReason = reason ? reason.trim() : null;

    const nicknameRequestRef = db.collection('nicknameChangeRequests').doc(requestId);
    logger.info(`rejectNicknameChange: Admin ${adminUid} sta rifiutando la richiesta ${requestId}. Motivo: "${trimmedReason || 'Nessuno'}".`);

    try {
        await db.runTransaction(async (transaction) => {
            const requestSnap = await transaction.get(nicknameRequestRef);
            if (!requestSnap.exists) {
                throw new HttpsError('not-found', 'Richiesta di cambio nickname non trovata.');
            }
            if (requestSnap.data().status !== 'pending') {
                throw new HttpsError('failed-precondition', `La richiesta non è più in stato 'pending' (stato attuale: ${requestSnap.data().status}).`);
            }

            // Aggiorna la richiesta di nickname
            const updateData = {
                status: 'rejected',
                processedAt: FieldValue.serverTimestamp(),
                processedBy: adminUid,
            };
            if (trimmedReason) {
                updateData.rejectionReason = trimmedReason;
            }
            transaction.update(nicknameRequestRef, updateData);

            // Non aggiorniamo lastNicknameRequestTimestamp come da tua preferenza.

            // TODO (FUNC.1.4): Qui si potrebbe inserire la logica per creare una notifica per l'utente.
            // const userProfileRef = db.collection('userProfiles').doc(requestSnap.data().userId); // Ottieni userId dalla richiesta
            // const userNotificationsRef = userProfileRef.collection('notifications').doc();
            // transaction.set(userNotificationsRef, {
            // type: 'nickname_rejected',
            // title: 'Richiesta Nickname Rifiutata',
            // message: `La tua richiesta per il nickname "${requestSnap.data().requestedNickname}" è stata rifiutata.` + (trimmedReason ? ` Motivo: ${trimmedReason}` : ''),
            // timestamp: FieldValue.serverTimestamp(),
            // read: false,
            // icon: 'cancel' // o un'icona appropriata
            // });
        });

        logger.info(`rejectNicknameChange: Richiesta ${requestId} rifiutata con successo.`);
        return { success: true, message: 'Richiesta di cambio nickname rifiutata.' };

    } catch (error) {
        logger.error(`rejectNicknameChange: Errore durante il rifiuto della richiesta ${requestId}:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'Si è verificato un errore interno durante il rifiuto. Riprova.');
    }
});