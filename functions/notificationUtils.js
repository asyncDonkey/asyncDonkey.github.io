// functions/notificationUtils.js

const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');

// admin.initializeApp() è già chiamato in index.js, quindi possiamo usare l'istanza.
const db = admin.firestore();

/**
 * Crea un documento di notifica in Firestore per un utente specifico.
 * La funzione è robusta e logga errori in caso di parametri mancanti.
 * @param {string} userId L'ID dell'utente da notificare.
 * @param {object} notificationData Un oggetto contenente i dettagli della notifica.
 * @param {string} notificationData.type Tipo di notifica (es. 'new_badge').
 * @param {string} notificationData.title Il titolo della notifica.
 * @param {string} notificationData.message Il corpo del messaggio.
 * @param {string} [notificationData.link] Un link opzionale associato all'azione della notifica.
 * @param {string} [notificationData.icon] Un'icona opzionale (Material Symbols).
 * @param {string} [notificationData.relatedItemId] Un ID opzionale per l'elemento correlato.
 * @returns {Promise<string|null>} L'ID del documento di notifica creato o null in caso di fallimento.
 */
async function createNotification(userId, notificationData) {
    if (
        !userId ||
        !notificationData ||
        !notificationData.type ||
        !notificationData.title ||
        !notificationData.message
    ) {
        logger.error('createNotification: Parametri richiesti mancanti.', { userId, notificationData });
        return null;
    }

    const notificationPayload = {
        ...notificationData,
        timestamp: FieldValue.serverTimestamp(),
        read: false,
        icon: notificationData.icon || 'notifications', // Icona di default
    };

    try {
        const notificationRef = db.collection('userProfiles').doc(userId).collection('notifications').doc();
        await notificationRef.set(notificationPayload);
        logger.info(
            `Notifica creata per l'utente ${userId}, tipo: ${notificationPayload.type}, id: ${notificationRef.id}`
        );
        return notificationRef.id;
    } catch (error) {
        logger.error(`Errore durante la creazione della notifica per l'utente ${userId}:`, error);
        return null;
    }
}

module.exports = { createNotification };