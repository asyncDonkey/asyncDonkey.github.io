// js/comments.js
import { db, auth, generateBlockieAvatar } from './main.js';
import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    getDocs,
    serverTimestamp,
    doc,
    updateDoc,
    increment,
    getDoc,
    where,
    arrayUnion,
    arrayRemove,
    Timestamp,
    documentId // AGGIUNTO: Necessario per le query 'in'
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { showToast } from './toastNotifications.js';

const DEFAULT_AVATAR_COMMENT_PATH = 'assets/images/default-avatar.png'; // Path corretto

// Riferimenti DOM per la modale "Liked By"
let likedByModal, closeLikedByModalBtn, likedByModalTitle, likedByModalList, likedByModalLoading, likedByModalNoLikes;

let guestbookCollection;
if (db) {
    guestbookCollection = collection(db, 'guestbookEntries');
} else {
    console.error('comments.js: DB instance not valid!');
}

// Riferimenti DOM specifici
let commentForm,
    commentNameInput,
    commentMessageInput,
    submitCommentBtn,
    commentsListDiv,
    commentNameSection,
    commentsListContainer;

let currentPageId = 'default';

/**
 * Formatta un timestamp di Firestore per la visualizzazione.
 */
function formatFirebaseTimestamp(firebaseTimestamp) {
    // ... (codice invariato)
    if (!firebaseTimestamp?.toDate) return 'Data non disponibile';
    try {
        return firebaseTimestamp.toDate().toLocaleString('it-IT', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch (e) {
        console.error('Errore formattazione timestamp commento:', e);
        return 'Formato data errato';
    }
}

/**
 * Gestisce il click sul pulsante "Like" per un commento del guestbook.
 */
async function handleGuestbookCommentLike(event) {
    // ... (codice invariato, usa già la logica corretta per i like)
    const button = event.currentTarget;
    const commentId = button.dataset.commentId;
    const currentUser = auth.currentUser;

    if (!commentId || !guestbookCollection) {
        console.error('[comments.js] handleGuestbookCommentLike: commentId o guestbookCollection mancante.');
        return;
    }
    if (!currentUser) {
        showToast("Devi essere loggato per mettere 'Mi piace' ai commenti.");
        return;
    }

    button.disabled = true;
    const commentDocRef = doc(db, 'guestbookEntries', commentId);

    try {
        const commentSnap = await getDoc(commentDocRef);
        if (!commentSnap.exists()) {
            console.error('[comments.js] Commento del guestbook non trovato:', commentId);
            showToast('Errore: commento non trovato.');
            button.disabled = false;
            return;
        }

        const commentData = commentSnap.data();
        const likedByUsers = commentData.likedBy || [];
        const userHasLiked = likedByUsers.includes(currentUser.uid);

        let newLikesCountOp = userHasLiked ? increment(-1) : increment(1);
        let userArrayUpdateOp = userHasLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid);

        if (userHasLiked && (commentData.likes || 0) <= 0) {
            if (!likedByUsers.includes(currentUser.uid)) {
                console.warn(
                    `[comments.js] Inconsistenza dati per commento ${commentId}: l'utente non ha messo like ma il conteggio è <=0.`
                );
                button.disabled = false;
                return;
            }
            if ((commentData.likes || 0) <= 0) newLikesCountOp = increment(0);
        }

        await updateDoc(commentDocRef, {
            likes: newLikesCountOp,
            likedBy: userArrayUpdateOp,
        });

        const updatedCommentSnap = await getDoc(commentDocRef);
        if (updatedCommentSnap.exists()) {
            const updatedCommentData = updatedCommentSnap.data();
            const currentLikesCount = updatedCommentData.likes || 0;
            const userNowHasLiked = updatedCommentData.likedBy && updatedCommentData.likedBy.includes(currentUser.uid);

            const iconName = userNowHasLiked ? 'favorite' : 'favorite_border';
            button.innerHTML = `<span class="material-symbols-rounded">${iconName}</span> <span class="like-count">${currentLikesCount}</span>`;
            
            button.classList.toggle('liked', userNowHasLiked);
            button.title = userNowHasLiked ? "Togli il 'Mi piace'" : "Metti 'Mi piace'";
            
            const likeCountSpanInsideButton = button.querySelector('.like-count');
            if (likeCountSpanInsideButton) {
                const oldListener = likeCountSpanInsideButton.handleLikeCountClick;
                if (oldListener) {
                    likeCountSpanInsideButton.removeEventListener('click', oldListener);
                }
                if (currentLikesCount > 0) {
                    likeCountSpanInsideButton.classList.add('clickable-comment-like-count');
                    likeCountSpanInsideButton.title = 'Vedi a chi piace questo commento';
                    const newListener = (e) => {
                        e.stopPropagation();
                        openGuestbookLikedByListModal(commentId);
                    };
                    likeCountSpanInsideButton.addEventListener('click', newListener);
                    likeCountSpanInsideButton.handleLikeCountClick = newListener;
                } else {
                    likeCountSpanInsideButton.classList.remove('clickable-comment-like-count');
                    likeCountSpanInsideButton.style.cursor = 'default';
                    likeCountSpanInsideButton.style.textDecoration = 'none';
                    likeCountSpanInsideButton.title = '';
                    delete likeCountSpanInsideButton.handleLikeCountClick;
                }
            }
        }
        button.disabled = false;
    } catch (error) {
        console.error("[comments.js] Errore durante l'aggiornamento del like al commento guestbook:", error);
        showToast("Si è verificato un errore durante l'aggiornamento del like. Riprova.");
        button.disabled = false;
    }
}

/**
 * Carica e visualizza i commenti del guestbook per la pagina corrente.
 */
async function loadComments() {
    if (!commentsListDiv || !guestbookCollection) {
        if (commentsListDiv) commentsListDiv.innerHTML = '<p>Errore: Connessione al DB o elemento DOM mancante.</p>';
        return;
    }
    commentsListDiv.innerHTML = `<p>Caricamento commenti per ${currentPageId}...</p>`;
    const currentUser = auth.currentUser;

    try {
        const q = query(
            guestbookCollection,
            where('pageId', '==', currentPageId),
            orderBy('timestamp', 'desc'),
            limit(20) // MAX_COMMENTS_DISPLAYED
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            commentsListDiv.innerHTML = `<p>Nessun commento per "${currentPageId}". Sii il primo!</p>`;
            return;
        }

        // --- MODIFICATO: Ottimizzazione recupero profili commentatori con query 'in' ---
        const commenterIdsToFetch = [...new Set(querySnapshot.docs
            .map(docSnap => docSnap.data().userId)
            .filter(id => id) // Filtra userId nulli o indefiniti (per commenti ospiti)
        )];

        const commenterProfilesMap = new Map();
        if (commenterIdsToFetch.length > 0) {
            const MAX_IDS_PER_IN_QUERY = 30;
            const profilePromises = [];
            for (let i = 0; i < commenterIdsToFetch.length; i += MAX_IDS_PER_IN_QUERY) {
                const batchUserIds = commenterIdsToFetch.slice(i, i + MAX_IDS_PER_IN_QUERY);
                // Ora documentId() è importato e può essere usato
                const profilesQuery = query(collection(db, 'userProfiles'), where(documentId(), 'in', batchUserIds));
                profilePromises.push(getDocs(profilesQuery));
            }
            try {
                const snapshotsArray = await Promise.all(profilePromises);
                snapshotsArray.forEach(snapshot => {
                    snapshot.forEach(docSnap => {
                        if (docSnap.exists()) {
                            commenterProfilesMap.set(docSnap.id, docSnap.data());
                        }
                    });
                });
            } catch (profileError) {
                console.error("[comments.js] Errore durante il recupero batch dei profili commentatori:", profileError);
            }
        }
        // --- FINE OTTIMIZZAZIONE ---

        commentsListDiv.innerHTML = ''; // Pulisci
        querySnapshot.forEach((docSnapshot) => {
            const commentData = docSnapshot.data();
            const commentId = docSnapshot.id;
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment-item'); // Assicurati che ci sia stile per .comment-item

            const avatarImg = document.createElement('img');
            avatarImg.classList.add('comment-avatar-img'); // Applica stili CSS (es. width: 40px, height: 40px, border-radius: 50%)
            
            let commenterAvatarSrc = DEFAULT_AVATAR_COMMENT_PATH;
            let commenterNameDisplay = commentData.userName || commentData.name || "Anonimo";
            let commenterNationalityCode = commentData.nationalityCode || null;
            const commenterProfile = commentData.userId ? commenterProfilesMap.get(commentData.userId) : null;

            if (commenterProfile) {
                commenterNameDisplay = commenterProfile.nickname || commenterNameDisplay;
                commenterNationalityCode = commenterProfile.nationalityCode || commenterNationalityCode;

                let chosenAvatarUrl = null;
                if (commenterProfile.avatarUrls) {
                    if (commenterProfile.avatarUrls.small) {
                        chosenAvatarUrl = commenterProfile.avatarUrls.small;
                    } else if (commenterProfile.avatarUrls.profile) {
                        chosenAvatarUrl = commenterProfile.avatarUrls.profile;
                    }
                }

                if (chosenAvatarUrl) {
                    commenterAvatarSrc = chosenAvatarUrl;
                    if (commenterProfile.profileUpdatedAt && commenterProfile.profileUpdatedAt.seconds) {
                        commenterAvatarSrc += `?v=${commenterProfile.profileUpdatedAt.seconds}`;
                    }
                } else if (commentData.userId) { // Profilo trovato ma senza avatarUrls validi
                    commenterAvatarSrc = generateBlockieAvatar(commentData.userId, 40, { size: 8 });
                }
                // Se !commenterProfile ma commentData.userId esiste, gestito sotto
            } else if (commentData.userId) { // userId presente ma profilo non trovato nella map (o errore fetch)
                commenterAvatarSrc = generateBlockieAvatar(commentData.userId, 40, { size: 8 });
            } else { // Commento ospite (senza userId)
                const seedForGuestBlockie = commentData.name || `anon-g-${commentId}`;
                commenterAvatarSrc = generateBlockieAvatar(seedForGuestBlockie, 40, { size: 8 });
            }
            
            avatarImg.src = commenterAvatarSrc;
            avatarImg.alt = `Avatar di ${commenterNameDisplay}`;
            avatarImg.onerror = () => { avatarImg.src = DEFAULT_AVATAR_COMMENT_PATH; avatarImg.onerror = null; };
            
            // --- Struttura DOM commento (come nel tuo codice, con avatarImg inserito) ---
            const headerDiv = document.createElement("div");
            headerDiv.classList.add("comment-header", "d-flex", "align-items-center", "mb-2");
            headerDiv.appendChild(avatarImg); // Aggiungi l'avatar all'inizio dell'header

            const nameAndDateDiv = document.createElement('div'); // Contenitore per nome e data
            nameAndDateDiv.classList.add('ms-2'); // Aggiungi un po' di margine se avatar e nome sono vicini

            const nameStrong = document.createElement("strong");
            if (commenterNationalityCode && commenterNationalityCode !== "OTHER") {
                const flagSpan = document.createElement("span");
                flagSpan.className = `fi fi-${commenterNationalityCode.toLowerCase()} me-1`; // me-1 per spazio
                nameStrong.appendChild(flagSpan);
            }
            
            // Gestione link al profilo per utenti loggati
            if (commentData.userId) {
                const userProfileLink = document.createElement('a');
                userProfileLink.href = `profile.html?userId=${commentData.userId}`;
                userProfileLink.textContent = commenterNameDisplay;
                userProfileLink.classList.add('comment-author-link'); // Aggiungi classe per stile se necessario
                nameStrong.appendChild(userProfileLink);
            } else {
                nameStrong.appendChild(document.createTextNode(commenterNameDisplay));
            }
            nameAndDateDiv.appendChild(nameStrong);

            const dateSmall = document.createElement("small");
            dateSmall.classList.add("text-muted", "ms-2", "comment-date-text"); // Classe per stile data
            dateSmall.textContent = ` - ${formatFirebaseTimestamp(commentData.timestamp)}`;
            nameAndDateDiv.appendChild(dateSmall);
            
            headerDiv.appendChild(nameAndDateDiv);

            const messageP = document.createElement("p");
            messageP.classList.add("comment-message", "mb-1", "mt-1"); // mt-1 per separare da header
            messageP.textContent = commentData.message ? String(commentData.message).replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
            
            commentElement.appendChild(headerDiv);
            commentElement.appendChild(messageP);

            // Bottone Like per commento (logica come nel tuo codice)
            const likesContainer = document.createElement('div');
            likesContainer.classList.add('likes-container', 'mt-1'); // mt-1 per spazio
            const likeButton = document.createElement('button');
            likeButton.classList.add('like-btn'); // Usa la tua classe 'like-btn'
            likeButton.setAttribute('data-comment-id', commentId);

            const currentLikes = commentData.likes || 0;
            let userHasLikedThisComment = false;
            if (currentUser && commentData.likedBy && commentData.likedBy.includes(currentUser.uid)) {
                userHasLikedThisComment = true;
            }
            const iconName = userHasLikedThisComment ? 'favorite' : 'favorite_border';
            likeButton.innerHTML = `<span class="material-symbols-rounded">${iconName}</span> <span class="like-count">${currentLikes}</span>`;
            likeButton.classList.toggle('liked', userHasLikedThisComment);
            likeButton.title = userHasLikedThisComment ? "Togli il 'Mi piace'" : "Metti 'Mi piace'";
            likeButton.disabled = !currentUser;
            
            // Previene l'aggiunta multipla di listener se loadComments viene chiamato più volte
            if (!likeButton.hasAttribute('data-like-listener-attached')) {
                likeButton.addEventListener('click', handleGuestbookCommentLike);
                likeButton.setAttribute('data-like-listener-attached', 'true');
            }
            
            const likeCountSpanInsideButton = likeButton.querySelector('.like-count');
            if (likeCountSpanInsideButton) {
                const oldListener = likeCountSpanInsideButton.handleLikeCountClick;
                if (oldListener) likeCountSpanInsideButton.removeEventListener('click', oldListener);
                if (currentLikes > 0) {
                    likeCountSpanInsideButton.classList.add('clickable-comment-like-count');
                    likeCountSpanInsideButton.title = 'Vedi a chi piace questo commento';
                    const newListener = (e) => { e.stopPropagation(); openGuestbookLikedByListModal(commentId);};
                    likeCountSpanInsideButton.addEventListener('click', newListener);
                    likeCountSpanInsideButton.handleLikeCountClick = newListener;
                } else {
                    likeCountSpanInsideButton.classList.remove('clickable-comment-like-count');
                    // ... reset stile come nel tuo codice
                    likeCountSpanInsideButton.style.cursor = 'default';
                    likeCountSpanInsideButton.style.textDecoration = 'none';
                    likeCountSpanInsideButton.title = '';
                    delete likeCountSpanInsideButton.handleLikeCountClick;
                }
            }

            likesContainer.appendChild(likeButton);
            commentElement.appendChild(likesContainer); // Aggiungi il contenitore dei like all'elemento del commento
            commentsListDiv.appendChild(commentElement);
        });
    } catch (error) {
        // ... (gestione errori come nel tuo codice) ...
        console.error(`[comments.js] Errore caricamento commenti per pageId ${currentPageId}: `, error);
        if (error.code === 'failed-precondition' && commentsListDiv) {
            commentsListDiv.innerHTML = `<p>Errore: Indice Firestore mancante per filtrare i commenti. Controlla la console.</p>`;
        } else if (commentsListDiv) {
            commentsListDiv.innerHTML = '<p>Errore caricamento commenti. Riprova più tardi.</p>';
        }
    }
}

/**
 * Gestisce l'invio di un nuovo commento al guestbook.
 */
async function handleCommentSubmit(event) {
    // ... (codice invariato, usa già la logica corretta per l'invio)
    event.preventDefault();
    if (!guestbookCollection || !commentMessageInput || !submitCommentBtn || !commentsListDiv) {
        console.error('[comments.js] Elementi DOM del form commenti mancanti.');
        showToast('Errore interfaccia. Riprova.');
        return;
    }
    const message = commentMessageInput.value.trim();
    if (!message) {
        showToast('Per favore, inserisci un messaggio.');
        return;
    }

    const user = auth.currentUser;
    let userIdToSave = null,
        userNameForDb = null,
        nameForDb = null,
        userNationalityCode = null;

    if (user) {
        userIdToSave = user.uid;
        try {
            const userProfileRef = doc(db, 'userProfiles', user.uid);
            const docSnap = await getDoc(userProfileRef);
            if (docSnap.exists()) {
                const profileData = docSnap.data();
                userNameForDb = profileData.nickname || (user.email ? user.email.split('@')[0] : 'Utente Registrato');
                if (profileData.nationalityCode) {
                    userNationalityCode = profileData.nationalityCode;
                }
            } else {
                userNameForDb = user.email ? user.email.split('@')[0] : 'Utente Registrato';
            }
        } catch (profileError) {
            console.error('[comments.js] Errore caricamento profilo per commento:', profileError);
            userNameForDb = user.email ? user.email.split('@')[0] : 'Utente Registrato';
        }
    } else {
        if (!commentNameInput || !commentNameSection) {
            console.error('[comments.js] Elementi DOM per nome anonimo mancanti.');
            showToast('Errore interfaccia. Riprova.');
            return;
        }
        nameForDb = commentNameInput.value.trim();
        if (!nameForDb) {
            showToast('Per favore, inserisci il tuo nome o effettua il login.');
            return;
        }
    }

    submitCommentBtn.disabled = true;
    submitCommentBtn.textContent = 'Invio...';
    try {
        const commentDataPayload = {
            message: message,
            timestamp: serverTimestamp(),
            likes: 0,
            likedBy: [],
            pageId: currentPageId,
        };
        if (userIdToSave) {
            commentDataPayload.userId = userIdToSave;
            commentDataPayload.userName = userNameForDb; // Questo è il nickname o fallback
            if (userNationalityCode) {
                commentDataPayload.nationalityCode = userNationalityCode;
            }
        } else {
            commentDataPayload.name = nameForDb; // Nome per ospiti
        }

        await addDoc(guestbookCollection, commentDataPayload);

        if (commentMessageInput) commentMessageInput.value = '';
        if (commentNameInput && !user) commentNameInput.value = '';
        await loadComments(); // Ricarica i commenti, che ora avranno la nuova logica avatar
        showToast('Commento inviato con successo!', 'success');
    } catch (error) {
        console.error('[comments.js] Errore invio commento:', error);
        showToast('Errore invio commento. Riprova.');
    } finally {
        if (submitCommentBtn) {
            submitCommentBtn.disabled = false;
            submitCommentBtn.textContent = 'Invia Commento';
        }
    }
}

// --- Funzioni per la Modale "Liked By" per i Commenti del Guestbook ---
// (populateGuestbookLikedByListModal è quella da modificare per gli avatar)
function closeGuestbookLikedByListModal() { /* ... (codice invariato) ... */ 
    if (likedByModal) likedByModal.style.display = 'none';
    if (likedByModalList) likedByModalList.innerHTML = '';
    if (likedByModalLoading) likedByModalLoading.style.display = 'none';
    if (likedByModalNoLikes) likedByModalNoLikes.style.display = 'none';
}

async function openGuestbookLikedByListModal(commentId) { /* ... (codice invariato) ... */
    if (!likedByModal) { console.error('[comments.js] Elemento likedByModal non trovato.'); return; }
    if (!auth.currentUser) { showToast('Devi essere loggato per vedere i like.', 'info'); return; }
    if (likedByModalList) likedByModalList.innerHTML = '';
    if (likedByModalNoLikes) likedByModalNoLikes.style.display = 'none';
    if (likedByModalLoading) likedByModalLoading.style.display = 'block';
    if (likedByModalTitle) likedByModalTitle.textContent = 'Persone a cui piace questo commento';
    likedByModal.style.display = 'block';
    await populateGuestbookLikedByListModal(commentId);
}

async function populateGuestbookLikedByListModal(commentId) {
    if (!likedByModalList || !likedByModalLoading || !likedByModalNoLikes || !db) { /* ... errore ... */ return; }

    try {
        const commentDocRef = doc(db, 'guestbookEntries', commentId);
        const commentSnap = await getDoc(commentDocRef);
        let likedByUsersIds = [];
        if (commentSnap.exists()) {
            likedByUsersIds = commentSnap.data().likedBy || [];
        } else { /* ... commento non trovato ... */ 
            console.warn(`[comments.js] Commento guestbook non trovato ID: ${commentId}`);
            likedByModalList.innerHTML = '<li>Errore: commento non trovato.</li>';
            if (likedByModalLoading) likedByModalLoading.style.display = 'none';
            return;
        }

        if (likedByUsersIds.length === 0) { /* ... nessun like ... */ 
            if (likedByModalNoLikes) likedByModalNoLikes.style.display = 'block';
            likedByModalList.innerHTML = '';
        } else {
            // MODIFICATO: Recupero profili e logica avatar come nelle altre sezioni
            const userProfilePromises = likedByUsersIds.map((userId) => getDoc(doc(db, 'userProfiles', userId)));
            const userProfileSnapshots = await Promise.all(userProfilePromises);
            likedByModalList.innerHTML = '';

            userProfileSnapshots.forEach((userSnap) => {
                const li = document.createElement('li');
                const avatarImg = document.createElement('img');
                avatarImg.className = 'liked-by-avatar'; // Applica stili CSS (es. 32x32px)

                let userAvatarSrc = DEFAULT_AVATAR_COMMENT_PATH;
                let userNameDisplay = 'Anonimo';
                const userIdForBlockie = userSnap.id || 'unknownLiker';

                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    userNameDisplay = userData.nickname || 'Utente';

                    let chosenAvatarUrl = null;
                    if (userData.avatarUrls) {
                        if (userData.avatarUrls.small) { // Priorità a 'small' per liste
                            chosenAvatarUrl = userData.avatarUrls.small;
                        } else if (userData.avatarUrls.profile) {
                            chosenAvatarUrl = userData.avatarUrls.profile;
                        }
                    }

                    if (chosenAvatarUrl) {
                        userAvatarSrc = chosenAvatarUrl;
                        if (userData.profileUpdatedAt && userData.profileUpdatedAt.seconds) {
                            userAvatarSrc += `?v=${userData.profileUpdatedAt.seconds}`;
                        }
                    } else { // Nessun avatar personalizzato, usa Blockie
                        userAvatarSrc = generateBlockieAvatar(userSnap.id, 32, { size: 8 });
                    }
                } else {
                    console.warn(`[comments.js] Profilo (likedBy modal) non trovato: ${userSnap.id}`);
                    userAvatarSrc = generateBlockieAvatar(userIdForBlockie, 32, { size: 8 });
                }
                
                avatarImg.src = userAvatarSrc;
                avatarImg.alt = `Avatar di ${userNameDisplay}`;
                avatarImg.onerror = () => { avatarImg.src = DEFAULT_AVATAR_COMMENT_PATH; avatarImg.onerror = null; };
                li.appendChild(avatarImg);

                const nameSpan = document.createElement('span');
                nameSpan.className = 'liked-by-name';
                nameSpan.textContent = userNameDisplay;
                li.appendChild(nameSpan);

                if (userSnap.exists() && userSnap.data().nationalityCode && userSnap.data().nationalityCode !== 'OTHER') {
                    const userDataNC = userSnap.data(); // riaccedi per sicurezza
                    const flagSpan = document.createElement('span');
                    flagSpan.className = `fi fi-${userDataNC.nationalityCode.toLowerCase()}`;
                    flagSpan.title = userDataNC.nationalityCode;
                    flagSpan.style.marginLeft = '8px';
                    li.appendChild(flagSpan);
                }
                likedByModalList.appendChild(li);
            });
        }
    } catch (error) { /* ... gestione errore ... */ 
         console.error(`[comments.js] Errore nel popolare la lista "Liked By" per commento guestbook:`, error);
        likedByModalList.innerHTML = '<li>Errore durante il caricamento della lista.</li>';
    } finally {
        if (likedByModalLoading) likedByModalLoading.style.display = 'none';
    }
}

// --- INIZIALIZZAZIONE ---
document.addEventListener('DOMContentLoaded', () => {
    // ... (codice invariato come nel tuo file, per assegnare i riferimenti DOM e currentPageId)
    console.log('[comments.js] DOMContentLoaded');
    commentForm = document.getElementById('commentForm');
    commentNameInput = document.getElementById('commentName');
    commentMessageInput = document.getElementById('commentMessage');
    submitCommentBtn = document.getElementById('submitCommentBtn');
    commentsListDiv = document.getElementById('commentsList');
    commentNameSection = document.getElementById('commentNameSection');
    commentsListContainer = document.getElementById('commentsListContainer');

    likedByModal = document.getElementById('likedByModal');
    if (likedByModal) {
        closeLikedByModalBtn = likedByModal.querySelector('#closeLikedByModalBtn');
        likedByModalTitle = likedByModal.querySelector('#likedByModalTitle');
        likedByModalList = likedByModal.querySelector('#likedByModalList');
        likedByModalLoading = likedByModal.querySelector('#likedByModalLoading');
        likedByModalNoLikes = likedByModal.querySelector('#likedByModalNoLikes');

        if (closeLikedByModalBtn) {
            closeLikedByModalBtn.addEventListener('click', closeGuestbookLikedByListModal);
        }
        likedByModal.addEventListener('click', (event) => {
            if (event.target === likedByModal) {
                closeGuestbookLikedByListModal();
            }
        });
    }

    if (commentsListContainer && commentsListContainer.dataset.pageId) {
        currentPageId = commentsListContainer.dataset.pageId;
        console.log(`[comments.js] Inizializzato per pageId: ${currentPageId}`);
    } else {
        console.warn(
            '[comments.js] commentsListContainer o data-page-id non trovato. Verrà usato il pageId di fallback "default".'
        );
    }

    if (!commentForm || !commentMessageInput || !submitCommentBtn || !commentsListDiv || !commentsListContainer) {
        console.error(
            '[comments.js] Uno o più Elementi DOM essenziali per la funzionalità guestbook sono mancanti.'
        );
    }

    const user = auth.currentUser; // Controlla subito lo stato utente
    if (commentNameSection && commentNameInput) {
        if (user) {
            commentNameSection.style.display = 'none';
            commentNameInput.required = false;
        } else {
            commentNameSection.style.display = 'block';
            commentNameInput.required = true; 
        }
    }

    if (commentForm) {
        // Previene l'aggiunta multipla di listener se DOMContentLoaded viene chiamato più volte (improbabile ma sicuro)
        if (!commentForm.hasAttribute('data-submit-listener-attached')) {
            commentForm.addEventListener('submit', handleCommentSubmit);
            commentForm.setAttribute('data-submit-listener-attached', 'true');
        }
    }

    if (commentsListDiv && db && currentPageId) {
        loadComments(); // Carica i commenti iniziali
    } else if (!db && commentsListDiv) {
        commentsListDiv.innerHTML = '<p>Errore: Impossibile connettersi al database.</p>';
    } else if (!currentPageId && commentsListDiv) {
        commentsListDiv.innerHTML = '<p>Errore: Contesto pagina per i commenti non definito.</p>';
    }
});

onAuthStateChanged(auth, (user) => {
    console.log('[comments.js] Auth state changed. User:', user ? user.uid : 'null');
    if (commentNameSection && commentNameInput) {
        if (user) {
            commentNameSection.style.display = 'none';
            commentNameInput.required = false;
        } else {
            commentNameSection.style.display = 'block';
            commentNameInput.required = true; 
        }
    }
    if (commentsListDiv && db && currentPageId) {
        console.log('[comments.js] Auth state changed, ricaricamento commenti per aggiornare UI like.');
        loadComments(); // Ricarica per aggiornare stato like e UI
    }
});
