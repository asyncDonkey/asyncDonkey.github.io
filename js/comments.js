// js/comments.js
import { db, auth, generateBlockieAvatar, escapeHTML } from './main.js';
import { getAuthorIconHTML } from './uiUtils.js';
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
    documentId,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { showToast } from './toastNotifications.js';

const DEFAULT_AVATAR_COMMENT_PATH = 'assets/images/default-avatar.png';

// Riferimenti DOM per la modale "Liked By" (invariati)
let likedByModal, closeLikedByModalBtn, likedByModalTitle, likedByModalList, likedByModalLoading, likedByModalNoLikes;

let guestbookCollection;
if (db) {
    guestbookCollection = collection(db, 'guestbookEntries');
} else {
    console.error('comments.js: DB instance not valid!');
}

// Riferimenti DOM specifici (invariati)
let commentForm,
    commentNameInput,
    commentMessageInput,
    submitCommentBtn,
    commentsListDiv,
    commentNameSection,
    commentsListContainer;

let currentPageId = 'default';

/**
 * Formatta un timestamp di Firestore per la visualizzazione. (invariata)
 */
function formatFirebaseTimestamp(firebaseTimestamp) {
    if (!firebaseTimestamp?.toDate) return 'Data non disponibile';
    try {
        return firebaseTimestamp.toDate().toLocaleString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (e) {
        console.error('Errore formattazione timestamp commento:', e);
        return 'Formato data errato';
    }
}

/**
 * Gestisce il click sul pulsante "Like" per un commento del guestbook. (invariata)
 */
// La funzione handleGuestbookCommentLike rimane la stessa,
// il controllo !currentUser è ora una doppia sicurezza.
async function handleGuestbookCommentLike(event) {
    const button = event.currentTarget; // Questo è il <button>
    const commentId = button.dataset.commentId;
    const currentUser = auth.currentUser;

    if (!currentUser) {
        // Questa toast non dovrebbe più essere chiamata qui se il wrapper funziona
        // showToast("Devi essere loggato per mettere 'Mi piace' ai commenti.", "info");
        console.warn("[handleGuestbookCommentLike] Chiamata anomala: l'utente non è loggato ma il bottone era attivo?");
        return;
    }
    if (!commentId || !guestbookCollection) {
        console.error('[comments.js] handleGuestbookCommentLike: commentId o guestbookCollection mancante.');
        showToast("Errore nell'azione di like.", "error");
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
                if (currentLikesCount > 0 && currentUser) {
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
// --- FUNZIONE loadComments AGGIORNATA ---
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
            limit(20)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            commentsListDiv.innerHTML = `<p>Nessun commento per "${currentPageId}". Sii il primo!</p>`;
            return;
        }

        const commenterIdsToFetch = [
            ...new Set(querySnapshot.docs.map((docSnap) => docSnap.data().userId).filter((id) => id)),
        ];
        const commenterPublicProfilesMap = new Map();
        if (commenterIdsToFetch.length > 0) {
            const MAX_IDS_PER_IN_QUERY = 30;
            const profilePromises = [];
            for (let i = 0; i < commenterIdsToFetch.length; i += MAX_IDS_PER_IN_QUERY) {
                const batchUserIds = commenterIdsToFetch.slice(i, i + MAX_IDS_PER_IN_QUERY);
                const profilesQuery = query(
                    collection(db, 'userPublicProfiles'),
                    where(documentId(), 'in', batchUserIds)
                );
                profilePromises.push(getDocs(profilesQuery));
            }
            try {
                const snapshotsArray = await Promise.all(profilePromises);
                snapshotsArray.forEach((snapshot) => {
                    snapshot.forEach((docSnap) => {
                        if (docSnap.exists()) {
                            commenterPublicProfilesMap.set(docSnap.id, docSnap.data());
                        }
                    });
                });
            } catch (profileError) {
                console.error(
                    '[comments.js] Errore durante il recupero batch dei profili pubblici dei commentatori:',
                    profileError
                );
            }
        }

        commentsListDiv.innerHTML = '';
        querySnapshot.forEach((docSnapshot) => {
            const commentData = docSnapshot.data();
            const commentId = docSnapshot.id;
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment-item');

            const avatarImg = document.createElement('img');
            avatarImg.classList.add('comment-avatar-img');
            let commenterAvatarSrc = DEFAULT_AVATAR_COMMENT_PATH;
            let commenterNameDisplay = commentData.userName || commentData.name || 'Anonimo';
            let commenterNationalityCode = commentData.nationalityCode || null;
            const commenterPublicProfile = commentData.userId ? commenterPublicProfilesMap.get(commentData.userId) : null;
            let commenterProfilePublicUpdatedAt = null;

            if (commenterPublicProfile) {
                commenterNameDisplay = commenterPublicProfile.nickname || commenterNameDisplay;
                commenterNationalityCode = commenterPublicProfile.nationalityCode || commenterNationalityCode;
                if (commenterPublicProfile.avatarUrls && commenterPublicProfile.avatarUrls.thumbnail) {
                    commenterAvatarSrc = commenterPublicProfile.avatarUrls.thumbnail;
                    commenterProfilePublicUpdatedAt = commenterPublicProfile.profilePublicUpdatedAt;
                } else if (commentData.userId) {
                    commenterAvatarSrc = generateBlockieAvatar(commentData.userId, 40, { size: 8 });
                }
            } else if (commentData.userId) {
                commenterAvatarSrc = generateBlockieAvatar(commentData.userId, 40, { size: 8 });
            } else {
                const seedForGuestBlockie = commentData.name || `anon-g-${commentId}`;
                commenterAvatarSrc = generateBlockieAvatar(seedForGuestBlockie, 40, { size: 8 });
            }
            if (commenterAvatarSrc !== DEFAULT_AVATAR_COMMENT_PATH && !commenterAvatarSrc.startsWith('data:image/png;base64') && commenterProfilePublicUpdatedAt) {
                if (commenterProfilePublicUpdatedAt.seconds) {
                    commenterAvatarSrc += `?v=${commenterProfilePublicUpdatedAt.seconds}`;
                } else if (commenterProfilePublicUpdatedAt instanceof Date) {
                    commenterAvatarSrc += `?v=${commenterProfilePublicUpdatedAt.getTime()}`;
                }
            }
            avatarImg.src = commenterAvatarSrc;
            avatarImg.alt = `Avatar di ${commenterNameDisplay}`;
            avatarImg.onerror = () => { avatarImg.src = DEFAULT_AVATAR_COMMENT_PATH; avatarImg.onerror = null; };
            
            const headerDiv = document.createElement('div');
            headerDiv.classList.add('comment-header', 'd-flex', 'align-items-center', 'mb-2'); // Utilizzo di classi Bootstrap/SCSS per allineamento
            headerDiv.appendChild(avatarImg);

            const nameAndDateDiv = document.createElement('div');
            nameAndDateDiv.classList.add('ms-2'); // Bootstrap margin start

            const nameStrong = document.createElement('strong');
            const authorIconHTML = getAuthorIconHTML(commenterPublicProfile); // Recupera HTML dell'icona
            const escapedCommenterName = escapeHTML(commenterNameDisplay);

            if (commentData.userId) {
                const userProfileLink = document.createElement('a');
                userProfileLink.href = `profile.html?userId=${commentData.userId}`;
                userProfileLink.classList.add('comment-author-link');
                userProfileLink.innerHTML = escapedCommenterName + authorIconHTML; // Nome + Icona nel link
                nameStrong.appendChild(userProfileLink);
            } else {
                nameStrong.innerHTML = escapedCommenterName + authorIconHTML; // Nome + Icona (senza link se utente non registrato)
            }

            if (commenterNationalityCode && commenterNationalityCode !== 'OTHER') {
                const flagSpan = document.createElement('span');
                flagSpan.className = `fi fi-${commenterNationalityCode.toLowerCase()} ms-1`; // Bootstrap margin start
                nameStrong.appendChild(flagSpan);
            }
            nameAndDateDiv.appendChild(nameStrong);

            const dateSmall = document.createElement('small');
            dateSmall.classList.add('text-muted', 'ms-2', 'comment-date-text');
            dateSmall.textContent = ` - ${formatFirebaseTimestamp(commentData.timestamp)}`;
            nameAndDateDiv.appendChild(dateSmall);
            
            headerDiv.appendChild(nameAndDateDiv);

            const messageP = document.createElement('p');
            messageP.classList.add('comment-message', 'mb-1', 'mt-1');
            messageP.textContent = commentData.message ? String(commentData.message).replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
            
            commentElement.appendChild(headerDiv);
            commentElement.appendChild(messageP);

            // --- Sezione Like Commento con WRAPPER (come nel tuo codice originale, ma assicurati che il currentUser sia passato/disponibile) ---
            // ... (la logica dei like ai commenti, inclusa la gestione di currentUser, rimane invariata)
            const likesContainer = document.createElement('div');
            likesContainer.classList.add('likes-container', 'mt-1');

            const likeInteractionWrapper = document.createElement('div');
            likeInteractionWrapper.style.display = 'inline-block'; 
            likeInteractionWrapper.classList.add('comment-like-interaction-wrapper');

            const likeButton = document.createElement('button');
            likeButton.classList.add('like-btn');
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
            
            const oldBtnHandler = likeButton.handlerAttached;
            if (oldBtnHandler) {
                likeButton.removeEventListener('click', oldBtnHandler);
                delete likeButton.handlerAttached;
            }
            const oldGuestWrapperHandler = likeInteractionWrapper.guestHandlerAttached;
            if (oldGuestWrapperHandler) {
                likeInteractionWrapper.removeEventListener('click', oldGuestWrapperHandler);
                delete likeInteractionWrapper.guestHandlerAttached;
            }
            likeInteractionWrapper.classList.remove('guest-interactive');


            if (currentUser) {
                likeButton.disabled = false;
                likeInteractionWrapper.style.cursor = 'pointer'; 
                likeButton.addEventListener('click', handleGuestbookCommentLike);
                likeButton.handlerAttached = handleGuestbookCommentLike;
            } else {
                likeButton.disabled = true;
                likeInteractionWrapper.style.cursor = 'pointer';
                likeInteractionWrapper.title = "Accedi per mettere 'Mi piace'";
                likeInteractionWrapper.classList.add('guest-interactive');

                const guestLikeHandler = (e) => {
                    e.stopPropagation();
                    showToast("Devi essere loggato per mettere 'Mi piace' ai commenti.", "info", 3000);
                };
                likeInteractionWrapper.addEventListener('click', guestLikeHandler);
                likeInteractionWrapper.guestHandlerAttached = guestLikeHandler;
            }
            
            likeInteractionWrapper.appendChild(likeButton);
            likesContainer.appendChild(likeInteractionWrapper);
            commentElement.appendChild(likesContainer);
            
            const likeCountSpanInsideButton = likeButton.querySelector('.like-count');
            if (likeCountSpanInsideButton) {
                const oldListener = likeCountSpanInsideButton.handleLikeCountClick;
                if (oldListener) likeCountSpanInsideButton.removeEventListener('click', oldListener);
                
                if (currentLikes > 0 && currentUser) {
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
            commentsListDiv.appendChild(commentElement);
        });
    } catch (error) {
        // ... (gestione errore invariata)
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
 * (La logica per recuperare il profilo dell'utente corrente da userProfiles è CORRETTA e rimane invariata)
 */
async function handleCommentSubmit(event) {
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
            // *** IMPORTANTE: Legge da userProfiles (privato) per denormalizzare i dati del PROPRIO profilo ***
            // Questo è CORRETTO perché stiamo scrivendo nuovi dati basati sul profilo completo dell'utente loggato.
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
            commentDataPayload.userName = userNameForDb;
            if (userNationalityCode) {
                commentDataPayload.nationalityCode = userNationalityCode;
            }
        } else {
            commentDataPayload.name = nameForDb;
        }

        await addDoc(guestbookCollection, commentDataPayload);

        if (commentMessageInput) commentMessageInput.value = '';
        if (commentNameInput && !user) commentNameInput.value = '';
        await loadComments();
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

function closeGuestbookLikedByListModal() {
    if (likedByModal) likedByModal.style.display = 'none';
    if (likedByModalList) likedByModalList.innerHTML = '';
    if (likedByModalLoading) likedByModalLoading.style.display = 'none';
    if (likedByModalNoLikes) likedByModalNoLikes.style.display = 'none';
}

async function openGuestbookLikedByListModal(commentId) {
    if (!likedByModal) {
        console.error('[comments.js] Elemento likedByModal non trovato.');
        return;
    }
    if (!auth.currentUser) {
        showToast('Devi essere loggato per vedere i like.', 'info');
        return;
    }
    if (likedByModalList) likedByModalList.innerHTML = '';
    if (likedByModalNoLikes) likedByModalNoLikes.style.display = 'none';
    if (likedByModalLoading) likedByModalLoading.style.display = 'block';
    if (likedByModalTitle) likedByModalTitle.textContent = 'Persone a cui piace questo commento';
    likedByModal.style.display = 'block';
    await populateGuestbookLikedByListModal(commentId);
}

async function populateGuestbookLikedByListModal(commentId) {
    if (!likedByModalList || !likedByModalLoading || !likedByModalNoLikes || !db) {
        return;
    }

    try {
        const commentDocRef = doc(db, 'guestbookEntries', commentId);
        const commentSnap = await getDoc(commentDocRef);
        let likedByUsersIds = [];
        if (commentSnap.exists()) {
            likedByUsersIds = commentSnap.data().likedBy || [];
        } else {
            console.warn(`[comments.js] Commento guestbook non trovato ID: ${commentId}`);
            likedByModalList.innerHTML = '<li>Errore: commento non trovato.</li>';
            if (likedByModalLoading) likedByModalLoading.style.display = 'none';
            return;
        }

        if (likedByUsersIds.length === 0) {
            if (likedByModalNoLikes) likedByModalNoLikes.style.display = 'block';
            likedByModalList.innerHTML = '';
        } else {
            // *** MODIFICA CHIAVE: Query su userPublicProfiles ***
            const userProfilePromises = likedByUsersIds.map((userId) => getDoc(doc(db, 'userPublicProfiles', userId)));
            const userProfileSnapshots = await Promise.all(userProfilePromises);
            likedByModalList.innerHTML = '';

            userProfileSnapshots.forEach((userSnap) => {
                const li = document.createElement('li');
                const avatarImg = document.createElement('img');
                avatarImg.className = 'liked-by-avatar';

                let userAvatarSrc = DEFAULT_AVATAR_COMMENT_PATH;
                let userNameDisplay = 'Anonimo';
                const userIdForBlockie = userSnap.id || 'unknownLiker';
                let userProfilePublicUpdatedAt = null; // Per cache busting dell'avatar pubblico

                if (userSnap.exists()) {
                    const userPublicData = userSnap.data(); // Dati dal profilo pubblico
                    userNameDisplay = userPublicData.nickname || 'Utente';
                    userProfilePublicUpdatedAt = userPublicData.profilePublicUpdatedAt;

                    // *** MODIFICA CHIAVE: Usa avatarUrls.thumbnail dal profilo pubblico ***
                    if (userPublicData.avatarUrls && userPublicData.avatarUrls.thumbnail) {
                        userAvatarSrc = userPublicData.avatarUrls.thumbnail;
                    } else {
                        // Profilo pubblico trovato ma senza avatar.thumbnail
                        userAvatarSrc = generateBlockieAvatar(userSnap.id, 32, { size: 8 });
                    }
                } else {
                    // Profilo pubblico non trovato
                    console.warn(`[comments.js] Profilo pubblico (likedBy modal) non trovato: ${userSnap.id}`);
                    userAvatarSrc = generateBlockieAvatar(userIdForBlockie, 32, { size: 8 });
                }

                // Applica cache busting
                if (
                    userAvatarSrc !== DEFAULT_AVATAR_COMMENT_PATH &&
                    !userAvatarSrc.startsWith('data:image/png;base64') &&
                    userProfilePublicUpdatedAt
                ) {
                    if (userProfilePublicUpdatedAt.seconds) {
                        userAvatarSrc += `?v=${userProfilePublicUpdatedAt.seconds}`;
                    } else if (userProfilePublicUpdatedAt instanceof Date) {
                        // Fallback per sicurezza
                        userAvatarSrc += `?v=${userProfilePublicUpdatedAt.getTime()}`;
                    }
                }

                avatarImg.src = userAvatarSrc;
                avatarImg.alt = `Avatar di ${userNameDisplay}`;
                avatarImg.onerror = () => {
                    avatarImg.src = DEFAULT_AVATAR_COMMENT_PATH;
                    avatarImg.onerror = null;
                };
                li.appendChild(avatarImg);

                const nameSpan = document.createElement('span');
                nameSpan.className = 'liked-by-name';
                nameSpan.textContent = userNameDisplay;
                li.appendChild(nameSpan);

                // Nazionalità dal profilo pubblico (se esiste)
                if (
                    userSnap.exists() &&
                    userSnap.data().nationalityCode &&
                    userSnap.data().nationalityCode !== 'OTHER'
                ) {
                    const userPublicDataForFlag = userSnap.data();
                    const flagSpan = document.createElement('span');
                    flagSpan.className = `fi fi-${userPublicDataForFlag.nationalityCode.toLowerCase()}`;
                    flagSpan.title = userPublicDataForFlag.nationalityCode;
                    flagSpan.style.marginLeft = '8px';
                    li.appendChild(flagSpan);
                }
                likedByModalList.appendChild(li);
            });
        }
    } catch (error) {
        console.error(`[comments.js] Errore nel popolare la lista "Liked By" per commento guestbook:`, error);
        likedByModalList.innerHTML = '<li>Errore durante il caricamento della lista.</li>';
    } finally {
        if (likedByModalLoading) likedByModalLoading.style.display = 'none';
    }
}

// --- INIZIALIZZAZIONE ---
document.addEventListener('DOMContentLoaded', () => {
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
        console.error('[comments.js] Uno o più Elementi DOM essenziali per la funzionalità guestbook sono mancanti.');
    }

    const user = auth.currentUser;
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
        if (!commentForm.hasAttribute('data-submit-listener-attached')) {
            commentForm.addEventListener('submit', handleCommentSubmit);
            commentForm.setAttribute('data-submit-listener-attached', 'true');
        }
    }

    if (commentsListDiv && db && currentPageId) {
        loadComments();
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
        loadComments();
    }
});
