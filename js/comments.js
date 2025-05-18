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
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { showToast } from './toastNotifications.js'; // Assicurati sia importato se lo usi qui

// Riferimenti DOM per la modale "Liked By" (devono essere presenti nell'HTML della pagina che usa comments.js)
let likedByModal, closeLikedByModalBtn, likedByModalTitle, likedByModalList, likedByModalLoading, likedByModalNoLikes;

let guestbookCollection;
if (db) {
    guestbookCollection = collection(db, 'guestbookEntries');
} else {
    console.error('comments.js: DB instance not valid!');
}

// Riferimenti DOM specifici per il form e la lista dei commenti del guestbook
let commentForm,
    commentNameInput,
    commentMessageInput,
    submitCommentBtn,
    commentsListDiv,
    commentNameSection,
    commentsListContainer; // Questo è il contenitore che ha data-page-id

let currentPageId = 'default'; // Fallback

/**
 * Formatta un timestamp di Firestore per la visualizzazione.
 * @param {object|null|undefined} firebaseTimestamp - Timestamp di Firestore.
 * @returns {string} Data e ora formattate o messaggio di fallback.
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
        console.error("Errore formattazione timestamp commento:", e);
        return 'Formato data errato';
    }
}

/**
 * Gestisce il click sul pulsante "Like" per un commento del guestbook.
 * @param {Event} event - L'evento click.
 */
async function handleGuestbookCommentLike(event) {
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

        // Aggiorna l'UI leggendo i dati aggiornati da Firestore per coerenza
        const updatedCommentSnap = await getDoc(commentDocRef);
        if (updatedCommentSnap.exists()) {
            const updatedCommentData = updatedCommentSnap.data();
            const currentLikesCount = updatedCommentData.likes || 0;
            const userNowHasLiked = updatedCommentData.likedBy && updatedCommentData.likedBy.includes(currentUser.uid);

            const iconName = userNowHasLiked ? 'favorite' : 'favorite_border';
            button.innerHTML = `<span class="material-symbols-rounded">${iconName}</span> <span class="like-count">${currentLikesCount}</span>`;
            console.log(`[comments.js] handleGuestbookCommentLike - Pulsante commento ${commentId}: Icona=${iconName}, Conteggio=${currentLikesCount}`);
            
            button.classList.toggle('liked', userNowHasLiked);
            button.title = userNowHasLiked ? "Togli il 'Mi piace'" : "Metti 'Mi piace'";
            
            // Aggiorna la cliccabilità del conteggio
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
        // Considera se ricaricare i commenti qui in caso di errore per UI consistente
        // if (commentsListDiv && guestbookCollection && currentPageId) {
        // await loadComments();
        // }
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
        commentsListDiv.innerHTML = ''; // Pulisci
        querySnapshot.forEach((docSnapshot) => {
            const commentData = docSnapshot.data();
            const commentId = docSnapshot.id;
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment-item');

            const avatarImg = document.createElement('img');
            avatarImg.classList.add('comment-avatar-img');
            const seedForBlockie =
                commentData.userId || commentData.userName || commentData.name || `anon-g-${commentId}`;
            avatarImg.src = generateBlockieAvatar(seedForBlockie, 40, { size: 8 });
            avatarImg.alt = 'Avatar';
            commentElement.appendChild(avatarImg);

            const commentContentDiv = document.createElement('div');
            commentContentDiv.classList.add('comment-content');

            const nameEl = document.createElement('strong');
            let commenterNameDisplay = commentData.userId 
                ? (commentData.userName || 'Utente Registrato') 
                : (commentData.name || 'Anonimo') + (commentData.userId === null || typeof commentData.userId === 'undefined' ? ' (Ospite)' : '');


            if (commentData.nationalityCode && commentData.nationalityCode !== 'OTHER') {
                const flagIconSpan = document.createElement('span');
                flagIconSpan.classList.add('fi', `fi-${commentData.nationalityCode.toLowerCase()}`);
                flagIconSpan.style.marginRight = '5px';
                flagIconSpan.style.verticalAlign = 'middle';
                nameEl.appendChild(flagIconSpan);
            }

            if (commentData.userId) {
                const userProfileLink = document.createElement('a');
                userProfileLink.href = `profile.html?userId=${commentData.userId}`;
                userProfileLink.textContent = commenterNameDisplay;
                nameEl.appendChild(userProfileLink);
            } else {
                nameEl.appendChild(document.createTextNode(commenterNameDisplay));
            }
            
            const dateEl = document.createElement('small');
            dateEl.classList.add('comment-date');
            dateEl.textContent = ` - ${formatFirebaseTimestamp(commentData.timestamp)}`;
            
            const messageEl = document.createElement('p');
            messageEl.textContent = commentData.message
                ? String(commentData.message).replace(/</g, '&lt;').replace(/>/g, '&gt;')
                : '';
            
            commentContentDiv.appendChild(nameEl);
            commentContentDiv.appendChild(dateEl);
            commentContentDiv.appendChild(messageEl);

            const likesContainer = document.createElement('div');
            likesContainer.classList.add('likes-container');
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
            console.log(`[comments.js] loadComments - Creato pulsante commento ${commentId}: Icona=${iconName}, Conteggio=${currentLikes}`);

            likeButton.classList.toggle('liked', userHasLikedThisComment);
            likeButton.title = userHasLikedThisComment ? "Togli il 'Mi piace'" : "Metti 'Mi piace'";
            likeButton.disabled = !currentUser;
            likeButton.addEventListener('click', handleGuestbookCommentLike);

            const likeCountSpanInsideButton = likeButton.querySelector('.like-count');
            if (likeCountSpanInsideButton) {
                const oldListener = likeCountSpanInsideButton.handleLikeCountClick;
                if (oldListener) {
                    likeCountSpanInsideButton.removeEventListener('click', oldListener);
                }
                if (currentLikes > 0) {
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

            likesContainer.appendChild(likeButton);
            commentContentDiv.appendChild(likesContainer);
            commentElement.appendChild(commentContentDiv);
            commentsListDiv.appendChild(commentElement);
        });
    } catch (error) {
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
 * @param {Event} event - L'evento di submit del form.
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

// --- Funzioni per la Modale "Liked By" per i Commenti del Guestbook ---

function closeGuestbookLikedByListModal() {
    if (likedByModal) {
        likedByModal.style.display = 'none';
    }
    if (likedByModalList) likedByModalList.innerHTML = '';
    if (likedByModalLoading) likedByModalLoading.style.display = 'none';
    if (likedByModalNoLikes) likedByModalNoLikes.style.display = 'none';
}

async function openGuestbookLikedByListModal(commentId) {
    if (!likedByModal) {
        console.error('[comments.js] Elemento likedByModal non trovato per i commenti del guestbook.');
        return;
    }
    if (!auth.currentUser) {
        showToast('Devi essere loggato per vedere i like.', 'info');
        return;
    }

    if (likedByModalList) likedByModalList.innerHTML = '';
    if (likedByModalNoLikes) likedByModalNoLikes.style.display = 'none';
    if (likedByModalLoading) likedByModalLoading.style.display = 'block';

    if (likedByModalTitle) {
        likedByModalTitle.textContent = 'Persone a cui piace questo commento';
    }

    likedByModal.style.display = 'block';
    await populateGuestbookLikedByListModal(commentId);
}

async function populateGuestbookLikedByListModal(commentId) {
    if (!likedByModalList || !likedByModalLoading || !likedByModalNoLikes || !db) {
        console.error('[comments.js] Elementi modale o DB mancanti per populateGuestbookLikedByListModal');
        if (likedByModalLoading) likedByModalLoading.style.display = 'none';
        if (likedByModalList) likedByModalList.innerHTML = '<li>Errore critico.</li>';
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
            const userProfilePromises = likedByUsersIds.map((userId) => getDoc(doc(db, 'userProfiles', userId)));
            const userProfileSnapshots = await Promise.all(userProfilePromises);

            likedByModalList.innerHTML = '';
            userProfileSnapshots.forEach((userSnap) => {
                const li = document.createElement('li');
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    const avatarImg = document.createElement('img');
                    avatarImg.className = 'liked-by-avatar';
                    avatarImg.src = generateBlockieAvatar(userSnap.id, 32, { size: 8 });
                    avatarImg.alt = `Avatar di ${userData.nickname || 'Utente'}`;

                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'liked-by-name';
                    nameSpan.textContent = userData.nickname || 'Utente Sconosciuto';

                    li.appendChild(avatarImg);
                    li.appendChild(nameSpan);

                    if (userData.nationalityCode && userData.nationalityCode !== 'OTHER') {
                        const flagSpan = document.createElement('span');
                        flagSpan.className = `fi fi-${userData.nationalityCode.toLowerCase()}`;
                        flagSpan.title = userData.nationalityCode;
                        flagSpan.style.marginLeft = '8px';
                        li.appendChild(flagSpan);
                    }
                } else {
                    console.warn(`[comments.js] Profilo utente non trovato per ID: ${userSnap.id} (liker di commento guestbook)`);
                    const avatarImg = document.createElement('img');
                    avatarImg.className = 'liked-by-avatar';
                    avatarImg.src = generateBlockieAvatar(userSnap.id || 'unknown', 32, { size: 8 });
                    avatarImg.alt = 'Avatar Utente Sconosciuto';
                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'liked-by-name';
                    nameSpan.textContent = 'Utente Sconosciuto';
                    li.appendChild(avatarImg);
                    li.appendChild(nameSpan);
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
    // Assegnazione riferimenti DOM
    commentForm = document.getElementById('commentForm');
    commentNameInput = document.getElementById('commentName');
    commentMessageInput = document.getElementById('commentMessage');
    submitCommentBtn = document.getElementById('submitCommentBtn');
    commentsListDiv = document.getElementById('commentsList');
    commentNameSection = document.getElementById('commentNameSection');
    commentsListContainer = document.getElementById('commentsListContainer'); // Questo è il contenitore che ha data-page-id

    // Inizializzazione dei riferimenti DOM per la modale "Liked By"
    likedByModal = document.getElementById('likedByModal'); // ID generico della modale
    if (likedByModal) {
        closeLikedByModalBtn = likedByModal.querySelector('#closeLikedByModalBtn'); // Cerca all'interno
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
    } else {
        // console.warn("[comments.js] La modale 'likedByModal' non è presente in questa pagina.");
    }

    // Determina il currentPageId
    if (commentsListContainer && commentsListContainer.dataset.pageId) {
        currentPageId = commentsListContainer.dataset.pageId;
        console.log(`[comments.js] Inizializzato per pageId: ${currentPageId}`);
    } else {
        console.warn(
            '[comments.js] commentsListContainer o data-page-id non trovato. Verrà usato il pageId di fallback "default". Questo potrebbe causare problemi se la pagina si aspetta un ID specifico.'
        );
    }
    
    // CORREZIONE: Lista degli elementi DOM essenziali per comments.js
    const essentialGuestbookElements = [
        commentForm,
        commentMessageInput,
        submitCommentBtn,
        commentsListDiv,
        commentsListContainer,
        // commentNameInput e commentNameSection sono opzionali se l'utente è sempre loggato
        // per lasciare commenti, ma li includiamo per completezza se la logica li usa.
        commentNameInput, // Può essere null se non presente nella pagina
        commentNameSection // Può essere null se non presente nella pagina
    ];

    // Verifica se gli elementi essenziali per il guestbook sono presenti
    // Nota: commentNameInput e commentNameSection sono gestiti con controlli di esistenza nel codice,
    // quindi non blocchiamo l'esecuzione se mancano.
    if (!commentForm || !commentMessageInput || !submitCommentBtn || !commentsListDiv || !commentsListContainer) {
        console.error('[comments.js] Uno o più Elementi DOM essenziali per la funzionalità guestbook sono mancanti. Controllare gli ID: commentForm, commentMessageInput, submitCommentBtn, commentsListDiv, commentsListContainer.');
        // Non fare return qui, così il resto dello script (es. onAuthStateChanged) può ancora girare
        // per gestire la visibilità del form nome se l'utente è loggato/sloggato.
    }


    const user = auth.currentUser;
    if (commentNameSection && commentNameInput) {
        if (user) {
            commentNameSection.style.display = 'none';
            commentNameInput.required = false;
        } else {
            commentNameSection.style.display = 'block';
            commentNameInput.required = true; // Potrebbe essere opzionale
        }
    }

    if (commentForm) {
        commentForm.addEventListener('submit', handleCommentSubmit);
    }

    if (commentsListDiv && db && currentPageId) {
        loadComments();
    } else if (!db && commentsListDiv) {
        commentsListDiv.innerHTML = '<p>Errore: Impossibile connettersi al database.</p>';
    } else if (!currentPageId && commentsListDiv) {
        // Questo caso dovrebbe essere già gestito dal console.warn sopra
        commentsListDiv.innerHTML = '<p>Errore: Contesto pagina per i commenti non definito.</p>';
    }
});

onAuthStateChanged(auth, (user) => {
    console.log('[comments.js] Auth state changed. User:', user ? user.uid : 'null');
    // Aggiorna la visibilità della sezione nome
    if (commentNameSection && commentNameInput) {
        if (user) {
            commentNameSection.style.display = 'none';
            commentNameInput.required = false;
        } else {
            commentNameSection.style.display = 'block';
            commentNameInput.required = true; // O false se il nome è opzionale per gli anonimi
        }
    }
    // Ricarica i commenti per aggiornare lo stato dei like e l'UI
    if (commentsListDiv && db && currentPageId) {
        console.log('[comments.js] Auth state changed, ricaricamento commenti per aggiornare UI like.');
        loadComments();
    }
});
