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