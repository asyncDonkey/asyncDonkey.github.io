import { db, auth } from './main.js'; // Assuming main.js exports auth and db correctly
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    doc,
    updateDoc,
    serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
// If you have a global showToast, import it. For now, console.log for errors.
// import { showToast } from './toastNotifications.js';

// DOM Elements
const unreadListElement = document.getElementById('unread-notifications-list');
const readListElement = document.getElementById('read-notifications-list');
const unreadCountElement = document.getElementById('unread-count');
const readLimitDisplayElement = document.getElementById('read-limit-display'); // To show "Ultime 25"
const noUnreadPlaceholder = document.getElementById('no-unread-placeholder');
const noReadPlaceholder = document.getElementById('no-read-placeholder');
const loadingUnreadPlaceholder = document.getElementById('loading-unread-placeholder');
const loadingReadPlaceholder = document.getElementById('loading-read-placeholder');
const authPromptElement = document.getElementById('auth-prompt');
const notificationsContentElement = document.getElementById('notifications-content');
const loginPromptBtn = document.getElementById('login-prompt-btn');

const NOTIFICATIONS_LIMIT = 25; // Max notifications to show in each list

/**
 * Formats a Firestore Timestamp into a human-readable "time ago" string.
 * Adapted from notificationHandler.js
 */
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

/**
 * Creates an HTML list item element for a single notification.
 * Adapted from notificationHandler.js
 * @param {object} notification - The notification data object.
 * @returns {HTMLLIElement} The created list item element.
 */
function createNotificationListItem(notification) {
    const item = document.createElement('li');
    item.classList.add('notification-item');
    item.setAttribute('data-notification-id', notification.id);

    if (!notification.read) {
        item.classList.add('unread');
    } else {
        item.classList.add('read');
    }

    let iconClass = 'info'; // Default icon
    let iconColor = 'var(--primary-color)'; // Default color

    // Icon logic (same as in notificationHandler.js)
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
    // Add more types as needed

    item.innerHTML = `
        <div class="notification-item-icon" style="color: ${iconColor};">
            <i class="material-symbols-rounded" style="font-size: 24px;">${iconClass}</i>
        </div>
        <div class="notification-item-content">
            <p class="notification-item-text">${notification.message || 'Contenuto notifica non disponibile.'}</p>
            <span class="notification-item-timestamp">${formatTimeAgo(notification.timestamp)}</span>
        </div>
        ${notification.link ? `<a href="${notification.link}" class="notification-item-link" aria-label="Vedi dettaglio notifica"></a>` : ''}
    `;
    return item;
}

/**
 * Marks a notification as read in Firestore and updates its UI on this page.
 * @param {string} notificationId - The ID of the notification.
 * @param {string} currentUserId - The current user's ID.
 * @param {HTMLLIElement} listItemElement - The LI element in the DOM to update.
 */
async function markSpecificNotificationAsRead(notificationId, currentUserId, listItemElement) {
    if (!currentUserId || !db) {
        console.error('[AllNotifications] User ID or DB not available. Cannot mark as read.');
        // showToast('Errore: utente non valido.', 'error');
        return false;
    }
    console.log(
        `[AllNotifications by Athena] Marking notification ${notificationId} as read for user ${currentUserId}.`
    );
    const notifRef = doc(db, 'userProfiles', currentUserId, 'notifications', notificationId);
    try {
        await updateDoc(notifRef, {
            read: true,
            updatedAt: serverTimestamp(),
        });
        console.log(`[AllNotifications by Athena] Notification ${notificationId} marked as read in Firestore.`);
        if (listItemElement) {
            listItemElement.classList.remove('unread');
            listItemElement.classList.add('read');
            // Potentially move it from unread list to read list dynamically if desired,
            // or simply update style. For now, style update is enough.
            // A re-fetch/re-render would also sort it.
        }
        // The main.js bell counter will update due to its onSnapshot listener.
        return true;
    } catch (error) {
        console.error(
            `[AllNotifications by Athena] Firestore error marking notification ${notificationId} as read:`,
            error
        );
        // showToast('Errore nel segnare la notifica come letta.', 'error');
        return false;
    }
}

/**
 * Handles click on a notification item.
 * @param {Event} event - The click event.
 * @param {string} currentUserId - The current user's ID.
 */
async function handleNotificationItemClick(event, currentUserId) {
    const clickedItem = event.target.closest('.notification-item');
    if (!clickedItem) return;

    const notificationId = clickedItem.dataset.notificationId;
    if (!notificationId) return;

    const isUnread = clickedItem.classList.contains('unread');
    const linkElement = clickedItem.querySelector('a.notification-item-link');
    const targetUrl = linkElement ? linkElement.href : null;

    if (targetUrl && isUnread && event.target.closest('a.notification-item-link')) {
        event.preventDefault();
    }

    if (isUnread) {
        const success = await markSpecificNotificationAsRead(notificationId, currentUserId, clickedItem);
        if (success && unreadCountElement) {
            // Decrement client-side counter
            let currentCount = parseInt(unreadCountElement.textContent, 10);
            if (!isNaN(currentCount) && currentCount > 0) {
                unreadCountElement.textContent = currentCount - 1;
            }
        }
    }

    if (targetUrl) {
        window.location.href = targetUrl;
    }
}

/**
 * Fetches and displays all notifications for the given user.
 * @param {string} userId - The ID of the user.
 */
async function loadAllUserNotifications(userId) {
    if (!db) {
        console.error("[AllNotifications] Firestore 'db' instance not available.");
        loadingUnreadPlaceholder.textContent = 'Errore di connessione.';
        loadingReadPlaceholder.textContent = 'Errore di connessione.';
        return;
    }

    // Clear existing lists and show loading indicators
    unreadListElement.innerHTML = '';
    readListElement.innerHTML = '';
    unreadListElement.appendChild(loadingUnreadPlaceholder);
    readListElement.appendChild(loadingReadPlaceholder);
    loadingUnreadPlaceholder.style.display = 'list-item';
    loadingReadPlaceholder.style.display = 'list-item';
    noUnreadPlaceholder.style.display = 'none';
    noReadPlaceholder.style.display = 'none';

    if (readLimitDisplayElement) readLimitDisplayElement.textContent = NOTIFICATIONS_LIMIT;

    let unreadFetchedCount = 0;
    let readFetchedCount = 0;

    try {
        // Fetch Unread Notifications
        const unreadNotificationsRef = collection(db, 'userProfiles', userId, 'notifications');
        const unreadQuery = query(
            unreadNotificationsRef,
            where('read', '==', false),
            orderBy('timestamp', 'desc'),
            limit(NOTIFICATIONS_LIMIT)
        );
        const unreadSnapshot = await getDocs(unreadQuery);

        loadingUnreadPlaceholder.style.display = 'none';
        if (unreadSnapshot.empty) {
            unreadListElement.appendChild(noUnreadPlaceholder);
            noUnreadPlaceholder.style.display = 'list-item';
        } else {
            unreadSnapshot.forEach((doc) => {
                const notification = { id: doc.id, ...doc.data() };
                const listItem = createNotificationListItem(notification);
                unreadListElement.appendChild(listItem);
                unreadFetchedCount++;
            });
        }
        if (unreadCountElement) unreadCountElement.textContent = unreadFetchedCount;

        // Fetch Read Notifications
        const readNotificationsRef = collection(db, 'userProfiles', userId, 'notifications');
        const readQuery = query(
            readNotificationsRef,
            where('read', '==', true),
            orderBy('timestamp', 'desc'),
            limit(NOTIFICATIONS_LIMIT)
        );
        const readSnapshot = await getDocs(readQuery);

        loadingReadPlaceholder.style.display = 'none';
        if (readSnapshot.empty) {
            readListElement.appendChild(noReadPlaceholder);
            noReadPlaceholder.style.display = 'list-item';
        } else {
            readSnapshot.forEach((doc) => {
                const notification = { id: doc.id, ...doc.data() };
                const listItem = createNotificationListItem(notification);
                readListElement.appendChild(listItem);
                readFetchedCount++;
            });
        }

        // Add event listeners to the lists for interaction
        unreadListElement.addEventListener('click', (event) => handleNotificationItemClick(event, userId));
        readListElement.addEventListener('click', (event) => handleNotificationItemClick(event, userId)); // Handles clicks on already read items for navigation
    } catch (error) {
        console.error('[AllNotifications by Athena] Error fetching notifications:', error);
        loadingUnreadPlaceholder.textContent = 'Errore nel caricare le notifiche.';
        loadingReadPlaceholder.textContent = 'Errore nel caricare le notifiche.';
        loadingUnreadPlaceholder.style.display = 'list-item'; // Ensure it's visible
        loadingReadPlaceholder.style.display = 'list-item'; // Ensure it's visible
        // showToast('Errore caricamento notifiche.', 'error');
    }
}

// Main execution flow
document.addEventListener('DOMContentLoaded', () => {
    console.log('[AllNotifications by Athena] DOMContentLoaded.');

    if (loginPromptBtn) {
        loginPromptBtn.addEventListener('click', () => {
            // Assuming login modal is handled by main.js or globally accessible
            const loginModalEl = document.getElementById('loginModal');
            if (loginModalEl) loginModalEl.style.display = 'block';
            else window.location.href = 'index.html'; // Fallback if modal not on page
        });
    }

    // Check authentication state
    // Using a slight delay for auth to initialize, or listen to 'userAuthenticated' from main.js
    // For simplicity here, direct check after a brief timeout.
    // A more robust way is to ensure main.js dispatches an event that this page can listen to,
    // or that auth.onAuthStateChanged is handled here too.
    // Let's use onAuthStateChanged for robustness as it's the standard Firebase way.

    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('[AllNotifications by Athena] User is authenticated:', user.uid);
            authPromptElement.style.display = 'none';
            notificationsContentElement.style.display = 'block';
            loadAllUserNotifications(user.uid);
        } else {
            console.log('[AllNotifications by Athena] User is not authenticated.');
            authPromptElement.style.display = 'block';
            notificationsContentElement.style.display = 'none';
            // Clear any potentially loaded data if user logs out while on page
            if (unreadListElement) unreadListElement.innerHTML = '';
            if (readListElement) readListElement.innerHTML = '';
            if (unreadCountElement) unreadCountElement.textContent = '0';
        }
    });
});
