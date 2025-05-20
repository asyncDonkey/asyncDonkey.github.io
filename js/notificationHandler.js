// js/notificationHandler.js

// Importa 'db' e 'auth' da main.js
import { db, auth } from './main.js';

// Importa solo le funzioni specifiche di Firestore che usi qui
import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

console.log('[NotificationHandler] DEBUG: Modulo caricato. Imported db:', db ? 'Available' : 'Not Available');
console.log('[NotificationHandler] DEBUG: Modulo caricato. Imported auth:', auth ? 'Available' : 'Not Available');
document.addEventListener('testAthenaEvent', (e) => {
    console.log('[NotificationHandler] Evento "testAthenaEvent" RICEVUTO!', e.detail);
});

let currentUserId = null;

// Elementi del DOM
const notificationList = document.getElementById('notification-list');
const noNotificationsPlaceholder = document.getElementById('no-notifications-placeholder');
const markAllAsReadBtn = document.getElementById('mark-all-as-read-btn');
const viewAllNotificationsLink = document.getElementById('view-all-notifications-link');

// Listener per l'evento 'userAuthenticated' dispatchato da main.js
// Questo è utile per aggiornamenti se lo stato cambia MENTRE la pagina è aperta.
document.addEventListener('userAuthenticated', (event) => {
    console.log('[NotificationHandler] Evento "userAuthenticated" RICEVUTO. Dettaglio evento:', event.detail);
    const newUserId = event.detail ? event.detail.userId : null;
    if (currentUserId !== newUserId) {
        currentUserId = newUserId;
        console.log(`[NotificationHandler] currentUserId aggiornato a: ${currentUserId} dall'evento.`);

        // Se il pannello è aperto, e l'utente è appena stato autenticato (o sloggato), aggiorna la vista.
        const panel = document.getElementById('notification-panel');
        if (panel && panel.style.display === 'block') {
            if (currentUserId && db) {
                loadNotifications();
            } else {
                // Pulisci il pannello se l'utente fa logout o l'ID non è valido
                if (notificationList) notificationList.innerHTML = '';
                if (noNotificationsPlaceholder) {
                    noNotificationsPlaceholder.style.display = 'block';
                    noNotificationsPlaceholder.querySelector('p').textContent =
                        'Effettua il login per vedere le notifiche.';
                }
                if (markAllAsReadBtn) markAllAsReadBtn.style.display = 'none';
                if (viewAllNotificationsLink) viewAllNotificationsLink.style.display = 'none';
            }
        }
    }
});

// formatTimeAgo, createNotificationElement (SENZA MODIFICHE, le lascio per completezza nel blocco)
function formatTimeAgo(firestoreTimestamp) {
    if (!firestoreTimestamp || typeof firestoreTimestamp.toDate !== 'function') {
        return 'Data sconosciuta';
    }
    const date = firestoreTimestamp.toDate();
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    if (seconds < 5) return 'Ora';
    if (seconds < 60) return `${seconds}s fa`;
    if (minutes < 60) return `${minutes}m fa`;
    if (hours < 24) return `${hours}h fa`;
    return `${days}g fa`;
}

function createNotificationElement(notification) {
    const item = document.createElement('li');
    item.classList.add('notification-item');
    if (!notification.read) {
        item.classList.add('unread');
    }
    item.setAttribute('data-notification-id', notification.id);

    let iconClass = 'info';
    let iconColor = 'var(--primary-color)';
    if (notification.type === 'articleApproved' || notification.type === 'article_approved') {
        // Considera entrambe le diciture se possibile
        iconClass = 'check_circle';
        iconColor = 'var(--success-color, green)';
    } else if (notification.type === 'articleRejected' || notification.type === 'article_rejected') {
        iconClass = 'cancel';
        iconColor = 'var(--danger-color, red)';
    } else if (notification.type === 'badgeEarned' || notification.type === 'new_badge') {
        // 'new_badge' come dal tuo snippet
        iconClass = 'emoji_events';
        iconColor = 'var(--accent-color, orange)';
    }
    // Aggiungi altri tipi di notifica se necessario

    // ---> MODIFICA CHIAVE QUI: da notification.text a notification.message <---
    item.innerHTML = `
        <div class="notification-item-icon" style="color: ${iconColor};">
            <i class="material-symbols-rounded" style="font-size: 20px;">${iconClass}</i>
        </div>
        <div class="notification-item-content">
            <p class="notification-item-text">${notification.message || 'Contenuto notifica non disponibile.'}</p> 
            <span class="notification-item-timestamp">${formatTimeAgo(notification.timestamp)}</span>
        </div>
        ${notification.link ? `<a href="${notification.link}" class="notification-item-link" aria-label="Vedi dettaglio notifica"></a>` : ''}
    `;
    return item;
}

async function loadNotifications() {
    // currentUserId viene ora impostato da toggleNotificationPanel prima di chiamare questa funzione
    if (!currentUserId || !db) {
        console.warn(
            `[NotificationHandler] loadNotifications chiamato ma UserID (${currentUserId}) o DB (${!!db}) non pronti.`
        );
        if (noNotificationsPlaceholder && notificationList) {
            // Assicurati che esistano
            notificationList.innerHTML = ''; // Svuota per sicurezza
            noNotificationsPlaceholder.style.display = 'block';
            noNotificationsPlaceholder.querySelector('p').textContent = currentUserId
                ? 'Errore caricamento (DB non pronto?)'
                : 'Effettua il login.';
        }
        return;
    }

    console.log(`[NotificationHandler] Caricamento notifiche per utente: ${currentUserId}`);
    if (notificationList) notificationList.innerHTML = '';
    if (noNotificationsPlaceholder) noNotificationsPlaceholder.style.display = 'none';

    try {
        const notificationsRef = collection(db, 'userProfiles', currentUserId, 'notifications');
        const q = query(notificationsRef, orderBy('timestamp', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            if (noNotificationsPlaceholder) {
                noNotificationsPlaceholder.style.display = 'block';
                noNotificationsPlaceholder.querySelector('p').textContent = 'Nessuna nuova notifica.';
            }
            if (markAllAsReadBtn) markAllAsReadBtn.style.display = 'none';
            if (viewAllNotificationsLink) viewAllNotificationsLink.style.display = 'none';
        } else {
            querySnapshot.forEach((doc) => {
                const notification = { id: doc.id, ...doc.data() };
                const notificationElement = createNotificationElement(notification);
                if (notificationList) notificationList.appendChild(notificationElement);
            });
            if (markAllAsReadBtn) markAllAsReadBtn.style.display = 'inline-block';
            if (viewAllNotificationsLink) viewAllNotificationsLink.style.display = 'inline-block';
        }
    } catch (error) {
        console.error('[NotificationHandler] Errore nel caricare le notifiche:', error);
        if (noNotificationsPlaceholder) {
            noNotificationsPlaceholder.style.display = 'block';
            noNotificationsPlaceholder.querySelector('p').textContent = 'Errore nel caricare le notifiche.';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const notificationBellLink = document.getElementById('notificationBellLink');
    const notificationPanel = document.getElementById('notification-panel');

    console.log(
        '[NotificationHandler] DOMContentLoaded: auth.currentUser:',
        auth ? auth.currentUser : 'auth non definito'
    );
    // Imposta currentUserId se l'utente è GIÀ loggato quando il DOM è pronto
    // Questo avviene se onAuthStateChanged in main.js è già scattato prima di questo DOMContentLoaded.
    if (auth && auth.currentUser) {
        currentUserId = auth.currentUser.uid;
        console.log(
            `[NotificationHandler] DOMContentLoaded: currentUserId impostato a ${currentUserId} da auth.currentUser.`
        );
    } else {
        console.log(
            '[NotificationHandler] DOMContentLoaded: auth.currentUser è null. currentUserId rimane:',
            currentUserId
        );
    }

    if (!notificationBellLink || !notificationPanel) {
        console.warn('[NotificationHandler] Elementi UI per notifiche non trovati.');
        return;
    }

    function toggleNotificationPanel(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const isPanelVisible = notificationPanel.style.display === 'block';
        notificationPanel.style.display = isPanelVisible ? 'none' : 'block';

        if (!isPanelVisible) {
            // Il pannello è APPENA STATO APERTO
            // Tenta di ottenere l'ID utente più aggiornato direttamente da auth quando il pannello si apre
            if (auth && auth.currentUser) {
                currentUserId = auth.currentUser.uid;
            } else {
                // Se ancora non c'è auth.currentUser, l'evento 'userAuthenticated' dovrebbe averlo già impostato
                // o lo imposterà. currentUserId potrebbe essere ancora null se l'evento non è scattato.
            }

            console.log(`[NotificationHandler] Pannello aperto. UserID attuale: ${currentUserId}, DB Pronto: ${!!db}`);

            if (currentUserId && db) {
                loadNotifications();
            } else {
                console.warn(
                    '[NotificationHandler] Pannello aperto, ma UserID o DB non pronti per caricare notifiche.'
                );
                if (notificationList) notificationList.innerHTML = '';
                if (noNotificationsPlaceholder) {
                    noNotificationsPlaceholder.style.display = 'block';
                    let msg = 'Accesso richiesto.';
                    if (!db) msg = 'Servizio notifiche non disponibile.';
                    else if (!auth) msg = 'Servizio autenticazione non pronto.';
                    else if (!currentUserId) msg = 'Autenticazione in corso...'; // Potrebbe essere ancora in attesa dell'evento
                    noNotificationsPlaceholder.querySelector('p').textContent = msg;
                }
                if (markAllAsReadBtn) markAllAsReadBtn.style.display = 'none';
                if (viewAllNotificationsLink) viewAllNotificationsLink.style.display = 'none';
            }
            document.addEventListener('click', handleClickOutsidePanel, true);
        } else {
            // Il pannello è APPENA STATO CHIUSO
            document.removeEventListener('click', handleClickOutsidePanel, true);
        }
    }

    function handleClickOutsidePanel(event) {
        if (!notificationPanel.contains(event.target) && !notificationBellLink.contains(event.target)) {
            notificationPanel.style.display = 'none';
            document.removeEventListener('click', handleClickOutsidePanel, true);
        }
    }

    notificationBellLink.addEventListener('click', toggleNotificationPanel);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && notificationPanel.style.display === 'block') {
            notificationPanel.style.display = 'none';
            document.removeEventListener('click', handleClickOutsidePanel, true);
        }
    });
});
