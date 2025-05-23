// js/notificationHandler.js

// Importa 'db' e 'auth' da main.js
import { db, auth } from './main.js';

// Importa le funzioni specifiche di Firestore
import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    doc,
    updateDoc,
    serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

console.log(
    '[NotificationHandler by Athena] DEBUG: Modulo caricato per "Mark all as read". DB:',
    db ? 'Available' : 'Not Available',
    'Auth:',
    auth ? 'Available' : 'Not Available'
);

let currentUserId = null;

// --- Module-scoped DOM element variables ---
let notificationList = null;
let noNotificationsPlaceholder = null;
let markAllAsReadBtn = null; // This is the button we'll be wiring up
let viewAllNotificationsLink = null;
let notificationPanel = null;
let notificationBellLink = null;
// --- End Module-scoped DOM element variables ---

document.addEventListener('userAuthenticated', (event) => {
    // ... (existing userAuthenticated event listener code - unchanged) ...
    console.log('[NotificationHandler by Athena] Evento "userAuthenticated" RICEVUTO. Dettaglio evento:', event.detail);
    const newUserId = event.detail ? event.detail.userId : null;
    if (currentUserId !== newUserId) {
        currentUserId = newUserId;
        console.log(`[NotificationHandler by Athena] currentUserId aggiornato a: ${currentUserId} dall'evento.`);
        if (notificationPanel && notificationPanel.style.display === 'block') {
            if (currentUserId && db) {
                loadNotifications();
            } else {
                if (notificationList) notificationList.innerHTML = '';
                if (noNotificationsPlaceholder) {
                    noNotificationsPlaceholder.style.display = 'block';
                    noNotificationsPlaceholder.querySelector('p').textContent =
                        'Effettua il login per vedere le notifiche.';
                }
                if (markAllAsReadBtn) markAllAsReadBtn.style.display = 'none'; // Hide if no user
                if (viewAllNotificationsLink) viewAllNotificationsLink.style.display = 'none';
            }
        }
    }
});

function formatTimeAgo(firestoreTimestamp) {
    // ... (existing formatTimeAgo function - unchanged) ...
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

function updatePanelState() {
    if (!notificationList || !noNotificationsPlaceholder || !viewAllNotificationsLink) return;

    const hasNotifications = notificationList.children.length > 0;

    // Mostra/nasconde il messaggio "Nessuna nuova notifica"
    noNotificationsPlaceholder.style.display = hasNotifications ? 'none' : 'block';
    if (!hasNotifications) {
        noNotificationsPlaceholder.querySelector('p').textContent = 'Nessuna nuova notifica.';
    }

    // Task NOTIF.1.2.B: Assicura che il link 'Vedi tutte' sia sempre visibile se ci sono o non ci sono notifiche.
    // La sua visibilità dipende solo dallo stato di login, che è gestito in loadNotifications.
    viewAllNotificationsLink.style.display = 'inline-block';

    // Controlla la visibilità del bottone "Segna tutti come letti"
    const hasUnread = notificationList.querySelector('li.notification-item.unread');
    if (markAllAsReadBtn) {
        markAllAsReadBtn.style.display = hasUnread ? 'inline-block' : 'none';
    }
}

function createNotificationElement(notification) {
    // ... (existing createNotificationElement function - unchanged) ...
    const item = document.createElement('li');
    item.classList.add('notification-item');
    if (!notification.read) {
        item.classList.add('unread');
    } else {
        item.classList.add('read');
    }
    item.setAttribute('data-notification-id', notification.id);

    let iconClass = 'info';
    let iconColor = 'var(--primary-color)';
    if (notification.type === 'articleApproved' || notification.type === 'article_approved') {
        iconClass = 'check_circle';
        iconColor = 'var(--success-color, green)';
    } else if (notification.type === 'articleRejected' || notification.type === 'article_rejected') {
        iconClass = 'cancel';
        iconColor = 'var(--danger-color, red)';
    } else if (notification.type === 'badgeEarned' || notification.type === 'new_badge') {
        iconClass = 'emoji_events';
        iconColor = 'var(--accent-color, orange)';
    }

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
    if (!currentUserId || !db) {
        console.warn(
            `[NotificationHandler by Athena] loadNotifications: UserID (${currentUserId}) or DB (${!!db}) not ready.`
        );
        if (noNotificationsPlaceholder && notificationList) {
            notificationList.innerHTML = '';
            noNotificationsPlaceholder.style.display = 'block';
            noNotificationsPlaceholder.querySelector('p').textContent = currentUserId
                ? 'Errore caricamento (DB non pronto?)'
                : 'Effettua il login.';
        }
        if (markAllAsReadBtn) markAllAsReadBtn.style.display = 'none';
        // AthenaDev: Nascondiamo il link "Vedi tutte" solo se l'utente non è loggato.
        if (viewAllNotificationsLink) viewAllNotificationsLink.style.display = 'none';
        return;
    }

    console.log(`[NotificationHandler by Athena] Caricamento notifiche per utente: ${currentUserId}`);
    if (notificationList) notificationList.innerHTML = '';
    if (noNotificationsPlaceholder) noNotificationsPlaceholder.style.display = 'none';

    try {
        const notificationsRef = collection(db, 'userProfiles', currentUserId, 'notifications');
        const q = query(notificationsRef, orderBy('timestamp', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            querySnapshot.forEach((docSnapshot) => {
                const notification = { id: docSnapshot.id, ...docSnapshot.data() };
                // Mostriamo solo le notifiche non lette nel pannello
                if (!notification.read) {
                    const notificationElement = createNotificationElement(notification);
                    if (notificationList) notificationList.appendChild(notificationElement);
                }
            });
        }
    } catch (error) {
        console.error('[NotificationHandler by Athena] Errore nel caricare le notifiche:', error);
        if (noNotificationsPlaceholder) {
            noNotificationsPlaceholder.style.display = 'block';
            noNotificationsPlaceholder.querySelector('p').textContent = 'Errore nel caricare le notifiche.';
        }
    } finally {
        // AthenaDev: Usiamo la nuova funzione centralizzata per gestire la UI.
        updatePanelState();
    }
}

// --- Panel Management Logic (Module Scope) ---
function closeNotificationPanel() {
    // ... (existing closeNotificationPanel function - unchanged) ...
    if (notificationPanel && notificationPanel.style.display === 'block') {
        notificationPanel.style.display = 'none';
        document.removeEventListener('click', handleClickOutsidePanel, true);
        console.log('[NotificationHandler by Athena] Panel closed, outside click listener removed.');
    }
}

function openNotificationPanel() {
    // ... (existing openNotificationPanel function - unchanged, loadNotifications will handle button visibility) ...
    if (notificationPanel && notificationPanel.style.display !== 'block') {
        notificationPanel.style.display = 'block';
        if (auth && auth.currentUser) {
            currentUserId = auth.currentUser.uid;
        }
        console.log(`[NotificationHandler by Athena] Panel opened. UserID: ${currentUserId}, DB Ready: ${!!db}`);
        if (currentUserId && db) {
            loadNotifications(); // This will now also manage markAllAsReadBtn visibility
        } else {
            console.warn(
                '[NotificationHandler by Athena] Panel opened, but UserID or DB not ready for loadNotifications.'
            );
            if (notificationList) notificationList.innerHTML = '';
            if (noNotificationsPlaceholder) {
                noNotificationsPlaceholder.style.display = 'block';
                let msg = 'Accesso richiesto.';
                if (!db) msg = 'Servizio notifiche non disponibile.';
                else if (!auth) msg = 'Servizio autenticazione non pronto.';
                else if (!currentUserId) msg = 'Autenticazione in corso...';
                noNotificationsPlaceholder.querySelector('p').textContent = msg;
            }
            if (markAllAsReadBtn) markAllAsReadBtn.style.display = 'none'; // Ensure hidden
            if (viewAllNotificationsLink) viewAllNotificationsLink.style.display = 'none';
        }
        document.addEventListener('click', handleClickOutsidePanel, true);
        console.log('[NotificationHandler by Athena] Panel opened, outside click listener added.');
    }
}

function toggleNotificationPanelState(event) {
    // ... (existing toggleNotificationPanelState function - unchanged) ...
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    if (!notificationPanel) {
        console.warn(
            '[NotificationHandler by Athena] toggleNotificationPanelState called before notificationPanel is initialized.'
        );
        return;
    }
    if (notificationPanel.style.display === 'block') {
        closeNotificationPanel();
    } else {
        openNotificationPanel();
    }
}

function handleClickOutsidePanel(event) {
    // ... (existing handleClickOutsidePanel function - unchanged) ...
    if (!notificationPanel || !notificationBellLink) return;

    if (!notificationPanel.contains(event.target) && !notificationBellLink.contains(event.target)) {
        closeNotificationPanel();
    }
}
// --- End Panel Management Logic ---

async function markNotificationAsRead(notificationId) {
    if (!currentUserId || !db) {
        console.error('[NotificationHandler by Athena] User ID or DB not available. Cannot mark as read.');
        throw new Error('User ID or DB not available.');
    }
    console.log(
        `[NotificationHandler by Athena] Operation: Attempting to mark notification ${notificationId} as read for user ${currentUserId}.`
    );
    const notifRef = doc(db, 'userProfiles', currentUserId, 'notifications', notificationId);
    try {
        // AthenaDev: La funzione ora aggiorna solo i dati, non più la UI.
        await updateDoc(notifRef, {
            read: true,
            updatedAt: serverTimestamp(),
        });
        console.log(
            `[NotificationHandler by Athena] Notification ${notificationId} successfully marked as read in Firestore.`
        );
    } catch (error) {
        console.error(
            `[NotificationHandler by Athena] Firestore error marking notification ${notificationId} as read:`,
            error
        );
        throw error; // Rilancia l'errore per essere gestito dal chiamante.
    }
}
async function handleNotificationClick(event) {
    const clickedItem = event.target.closest('.notification-item');
    if (!clickedItem) return;

    const notificationId = clickedItem.dataset.notificationId;
    if (!notificationId) return;

    // Preveniamo la chiusura immediata del pannello se si clicca su un item
    event.stopPropagation();

    const isUnread = clickedItem.classList.contains('unread');
    const linkElement = clickedItem.querySelector('a.notification-item-link');
    const targetUrl = linkElement ? linkElement.href : null;

    // Se è non letta, la marchiamo come tale e la rimuoviamo dalla UI
    if (isUnread) {
        try {
            // 1. Marchiamo come letta su Firestore
            await markNotificationAsRead(notificationId);

            // 2. Rimuoviamo l'elemento dalla UI con una transizione
            clickedItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            clickedItem.style.opacity = '0';
            clickedItem.style.transform = 'scale(0.9)';

            setTimeout(() => {
                clickedItem.remove();
                // 3. Aggiorniamo lo stato del pannello (mostra placeholder se vuoto)
                updatePanelState();

                // 4. Se c'era un link, navighiamo solo dopo che la UI è stata gestita
                if (targetUrl) {
                    window.location.href = targetUrl;
                } else {
                    // Se non c'è link, e abbiamo finito l'animazione, potremmo voler chiudere il pannello?
                    // Per ora, lo lasciamo aperto per coerenza.
                }
            }, 300); // Durata della transizione
        } catch (error) {
            console.error(`[NotificationHandler by Athena] Failed to process click for ${notificationId}.`, error);
            // Se l'update su Firestore fallisce, navighiamo comunque se c'è un link
            if (targetUrl) {
                window.location.href = targetUrl;
            }
        }
    } else if (targetUrl) {
        // Se la notifica è già letta ma ha un link, navighiamo semplicemente
        window.location.href = targetUrl;
    }
}

// --- NUOVA FUNZIONE PER TASK A.5.4.6 ---
/**
 * Handles the click event for the "Mark all as read" button.
 * Iterates through currently visible unread notifications in the panel and marks them as read.
 */
async function handleMarkAllAsRead() {
    if (!notificationList || !currentUserId || !db) {
        console.warn('[NotificationHandler by Athena] Cannot "Mark all as read": List, UserID, or DB not available.');
        return;
    }

    // Athena's signature log for this new feature!
    console.log('[NotificationHandler by Athena] "Mark all as read" button clicked. Processing panel notifications.');

    const unreadItems = notificationList.querySelectorAll('li.notification-item.unread');

    if (unreadItems.length === 0) {
        console.log('[NotificationHandler by Athena] No unread notifications found in the panel to mark as read.');
        if (markAllAsReadBtn) {
            markAllAsReadBtn.style.display = 'none'; // Hide button if no unread items
        }
        return;
    }

    // Disable button to prevent multiple clicks during processing
    if (markAllAsReadBtn) markAllAsReadBtn.disabled = true;

    let successCount = 0;
    let failCount = 0;

    for (const item of unreadItems) {
        const notificationId = item.dataset.notificationId;
        if (notificationId) {
            try {
                await markNotificationAsRead(notificationId); // Reuse existing function
                successCount++;
            } catch (error) {
                failCount++;
                console.error(
                    `[NotificationHandler by Athena] Failed to mark notification ${notificationId} as read during "Mark all" operation.`,
                    error
                );
                // Continue to next item even if one fails
            }
        }
    }

    console.log(
        `[NotificationHandler by Athena] "Mark all as read" completed. Success: ${successCount}, Failed: ${failCount}.`
    );

    // After processing, hide the button as all *visible* items should now be read or attempted.
    // The bell counter will have updated progressively.
    if (markAllAsReadBtn) {
        markAllAsReadBtn.style.display = 'none'; // Hide the button
        markAllAsReadBtn.disabled = false; // Re-enable for future panel openings if needed
    }

    // Potentially show a toast summary if you have a toast notification system
    // e.g., if (typeof showToast === 'function') {
    //    if (failCount > 0) {
    //        showToast(`${successCount} notifiche segnate come lette. ${failCount} errori.`, 'warning');
    //    } else {
    //        showToast(`${successCount} notifiche segnate come lette.`, 'success');
    //    }
    // }
}
// --- FINE NUOVA FUNZIONE ---

document.addEventListener('DOMContentLoaded', () => {
    // --- Assign module-scoped DOM elements ---
    notificationList = document.getElementById('notification-list');
    noNotificationsPlaceholder = document.getElementById('no-notifications-placeholder');
    markAllAsReadBtn = document.getElementById('mark-all-as-read-btn'); // Key button for this task
    viewAllNotificationsLink = document.getElementById('view-all-notifications-link');
    notificationPanel = document.getElementById('notification-panel');
    notificationBellLink = document.getElementById('notificationBellLink');
    // --- End Assign module-scoped DOM elements ---

    // ... (existing DOMContentLoaded user auth state logic - unchanged) ...
    console.log(
        '[NotificationHandler by Athena] DOMContentLoaded: auth.currentUser:',
        auth ? auth.currentUser : 'auth non definito'
    );
    if (auth && auth.currentUser) {
        currentUserId = auth.currentUser.uid;
        console.log(
            `[NotificationHandler by Athena] DOMContentLoaded: currentUserId impostato a ${currentUserId} da auth.currentUser.`
        );
    } else {
        console.log(
            '[NotificationHandler by Athena] DOMContentLoaded: auth.currentUser è null. currentUserId rimane:',
            currentUserId
        );
    }

    if (notificationBellLink) {
        notificationBellLink.addEventListener('click', toggleNotificationPanelState);
    } else {
        console.warn(
            '[NotificationHandler by Athena] notificationBellLink NOT FOUND. Panel cannot be opened by bell click.'
        );
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeNotificationPanel();
        }
    });

    if (notificationList) {
        notificationList.addEventListener('click', handleNotificationClick);
        console.log(
            '[NotificationHandler by Athena] Click listener for notification items attached to notificationList.'
        );
    } else {
        console.warn(
            '[NotificationHandler by Athena] DOMContentLoaded: notificationList element NOT FOUND. Click interactions for notifications will not work.'
        );
    }

    // --- AGGIUNTA EVENT LISTENER PER TASK A.5.4.6 ---
    if (markAllAsReadBtn) {
        markAllAsReadBtn.addEventListener('click', handleMarkAllAsRead);
        console.log('[NotificationHandler by Athena] Click listener for "Mark all as read" button attached.');
    } else {
        console.warn(
            '[NotificationHandler by Athena] DOMContentLoaded: markAllAsReadBtn element NOT FOUND. "Mark all as read" feature will not work.'
        );
    }
    // --- FINE AGGIUNTA EVENT LISTENER ---
});
