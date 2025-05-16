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
    Timestamp, // Aggiunto Timestamp se non già presente
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// --- INIZIO MODIFICHE ---

// Riferimenti DOM per la modale "Liked By" (da usare per i commenti del guestbook)
// Questi ID devono corrispondere a quelli della modale copiata in about.html e donkeyRunner.html
let likedByModal, closeLikedByModalBtn, likedByModalTitle, likedByModalList, likedByModalLoading, likedByModalNoLikes;

// Costanti per emoji dei like ai commenti (già presenti, ma le spostiamo per chiarezza)
const INITIAL_GUESTBOOK_COMMENT_LIKE_EMOJI = '🤍'; // Cuore bianco
const LIKED_GUESTBOOK_COMMENT_EMOJI = '💙'; // Cuore blu

let guestbookCollection;
if (db) {
    guestbookCollection = collection(db, 'guestbookEntries');
} else {
    console.error('comments.js: DB instance not valid!');
}

const commentForm = document.getElementById('commentForm');
const commentNameInput = document.getElementById('commentName');
const commentMessageInput = document.getElementById('commentMessage');
const submitCommentBtn = document.getElementById('submitCommentBtn');
const commentsListDiv = document.getElementById('commentsList');

const commentNameSection = document.getElementById('commentNameSection');
const commentsListContainer = document.getElementById('commentsListContainer');

const MAX_COMMENTS_DISPLAYED = 20;

let currentPageId = 'default';
if (commentsListContainer && commentsListContainer.dataset.pageId) {
    currentPageId = commentsListContainer.dataset.pageId;
    console.log(`comments.js: Initialized for pageId: ${currentPageId}`);
} else {
    console.warn(
        'comments.js: commentsListContainer o data-page-id non trovato. Verrà usato il pageId di fallback "default".'
    );
}

/** Formats Firestore Timestamp */
function formatFirebaseTimestamp(firebaseTimestamp) {
    if (!firebaseTimestamp?.toDate) return 'Date unavailable';
    try {
        return firebaseTimestamp.toDate().toLocaleString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (e) {
        return 'Date format error';
    }
}

/**
 * Gestisce il click sul pulsante "Like" per un commento del guestbook.
 * @param {Event} event - L'evento click.
 */
async function handleGuestbookCommentLike(event) {
    const button = event.currentTarget;
    const commentId = button.dataset.commentId; // Assicurati che il data-attribute sia 'data-comment-id'
    const currentUser = auth.currentUser;

    if (!commentId || !guestbookCollection) {
        console.error('handleGuestbookCommentLike: commentId o guestbookCollection mancante.');
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
            console.error('Commento del guestbook non trovato:', commentId);
            showToast('Errore: commento non trovato.');
            button.disabled = false;
            return;
        }

        const commentData = commentSnap.data();
        const likedByUsers = commentData.likedBy || [];
        const userHasLiked = likedByUsers.includes(currentUser.uid);

        // Determina l'operazione e l'aggiornamento dell'array
        let newLikesCountOp = userHasLiked ? increment(-1) : increment(1);
        let userArrayUpdateOp = userHasLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid);

        // Logica per evitare conteggio negativo se non dovrebbe succedere
        if (userHasLiked && (commentData.likes || 0) <= 0) {
            if (!likedByUsers.includes(currentUser.uid)) {
                // L'utente non era tra i likers ma il conteggio era <=0
                console.warn(
                    `Inconsistenza dati per commento ${commentId}: l'utente non ha messo like ma il conteggio è <=0.`
                );
                button.disabled = false; // Riabilita e non fare nulla
                return; // Evita l'operazione
            }
            // Se l'utente ha messo like ma il conteggio è già 0 o negativo, non decrementare ulteriormente.
            // Questo previene che 'likes' diventi negativo se c'è un'incoerenza.
            // Si limita a rimuovere l'utente da likedBy.
            if ((commentData.likes || 0) <= 0) newLikesCountOp = increment(0); // Non cambiare il conteggio se già a zero o meno
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

            // Aggiorna il conteggio numerico (se esiste come span separato o dentro il bottone)
            // Questa parte assume che il conteggio sia dentro il bottone, come per i commenti articolo
            const likeCountSpanInsideButton = button.querySelector('.like-count'); // Cerca uno span .like-count DENTRO il bottone
            if (likeCountSpanInsideButton) {
                likeCountSpanInsideButton.textContent = currentLikesCount;
            } else {
                // Se lo span è FRATELLO del bottone (come nella versione precedente di `comments.js`)
                const likeCountSpanSibling = button.nextElementSibling;
                if (likeCountSpanSibling && likeCountSpanSibling.classList.contains('like-count')) {
                    likeCountSpanSibling.textContent = `${currentLikesCount}`;
                }
            }

            // Aggiorna l'emoji del bottone
            // Assumiamo che l'emoji sia il primo nodo figlio del bottone e sia un nodo di testo
            const emojiNode = button.childNodes[0];
            if (emojiNode && emojiNode.nodeType === Node.TEXT_NODE) {
                emojiNode.nodeValue = `${userNowHasLiked ? LIKED_GUESTBOOK_COMMENT_EMOJI : INITIAL_GUESTBOOK_COMMENT_LIKE_EMOJI} `; // Spazio per separare dall'eventuale span
            }

            if (userNowHasLiked) {
                button.classList.add('liked');
                button.title = "Togli il 'Mi piace' a questo commento";
            } else {
                button.classList.remove('liked');
                button.title = "Metti 'Mi piace' a questo commento";
            }
        }
        button.disabled = false;
    } catch (error) {
        console.error("comments.js - Errore durante l'aggiornamento del like al commento guestbook:", error);
        showToast("Si è verificato un errore durante l'aggiornamento del like. Riprova.");
        button.disabled = false;
        // Potrebbe essere utile ricaricare i commenti per riflettere lo stato corretto
        if (commentsListDiv && guestbookCollection && currentPageId) {
            await loadComments();
        }
    }
}

/** Loads and displays comments based on currentPageId */
async function loadComments() {
    if (!commentsListDiv || !guestbookCollection) {
        if (commentsListDiv) commentsListDiv.innerHTML = '<p>Error: Database connection or DOM element missing.</p>';
        return;
    }
    commentsListDiv.innerHTML = `<p>Loading comments for ${currentPageId}...</p>`;

    const currentUser = auth.currentUser;

    try {
        const q = query(
            guestbookCollection,
            where('pageId', '==', currentPageId),
            orderBy('timestamp', 'desc'),
            limit(MAX_COMMENTS_DISPLAYED)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            commentsListDiv.innerHTML = '<p>Nessun commento per questa pagina. Sii il primo!</p>';
            return;
        }
        commentsListDiv.innerHTML = '';
        querySnapshot.forEach((docSnapshot) => {
            const commentData = docSnapshot.data();
            const commentId = docSnapshot.id;
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment-item');

            const avatarImg = document.createElement('img');
            avatarImg.classList.add('comment-avatar-img'); // Usa la classe CSS
            const seedForBlockie =
                commentData.userId || commentData.userName || commentData.name || `anon-g-${commentId}`;
            let altTextForBlockie = commentData.userName || commentData.name || 'Anonymous';
            avatarImg.src = generateBlockieAvatar(seedForBlockie, 40, { size: 8 });
            avatarImg.alt = `${altTextForBlockie}'s Blockie Avatar`;
            commentElement.appendChild(avatarImg);

            const commentContent = document.createElement('div');
            commentContent.classList.add('comment-content');
            const nameEl = document.createElement('strong');
            let commenterNameDisplay = commentData.userId
                ? commentData.userName || 'Utente Registrato'
                : (commentData.name || 'Anonimo') + ' (Ospite)';

            // Aggiungi bandierina se presente
            if (commentData.nationalityCode && commentData.nationalityCode !== 'OTHER') {
                const flagIconSpan = document.createElement('span');
                flagIconSpan.classList.add('fi', `fi-${commentData.nationalityCode.toLowerCase()}`);
                flagIconSpan.style.marginRight = '5px';
                flagIconSpan.style.verticalAlign = 'middle';
                nameEl.appendChild(flagIconSpan);
            }

            nameEl.appendChild(document.createTextNode(commenterNameDisplay));
            const dateEl = document.createElement('small');
            dateEl.classList.add('comment-date');
            dateEl.textContent = ` - ${formatFirebaseTimestamp(commentData.timestamp)}`;
            const messageEl = document.createElement('p');
            messageEl.textContent = commentData.message
                ? String(commentData.message).replace(/</g, '&lt;').replace(/>/g, '&gt;')
                : '';
            commentContent.appendChild(nameEl);
            commentContent.appendChild(dateEl);
            commentContent.appendChild(messageEl);

            // --- Sezione Like per commenti Guestbook ---
            const likesContainer = document.createElement('div');
            likesContainer.classList.add('likes-container');
            const likeButton = document.createElement('button');
            likeButton.classList.add('like-btn'); // Classe generica per stile bottone like
            likeButton.setAttribute('data-comment-id', commentId);

            const currentLikes = commentData.likes || 0;
            let userHasLikedThisComment = false;
            if (currentUser && commentData.likedBy && commentData.likedBy.includes(currentUser.uid)) {
                userHasLikedThisComment = true;
            }

            // Mettiamo l'emoji e lo span del conteggio DENTRO al bottone
            likeButton.innerHTML = `${userHasLikedThisComment ? LIKED_GUESTBOOK_COMMENT_EMOJI : INITIAL_GUESTBOOK_COMMENT_LIKE_EMOJI} <span class="like-count">${currentLikes}</span>`;

            if (userHasLikedThisComment) {
                likeButton.classList.add('liked'); // Per stilizzare il bottone "liked"
            }
            likeButton.title = userHasLikedThisComment ? "Togli il 'Mi piace'" : "Metti 'Mi piace'";
            likeButton.disabled = !currentUser; // Disabilita se utente non loggato

            likeButton.addEventListener('click', handleGuestbookCommentLike);
            likesContainer.appendChild(likeButton);

            // Rendi il conteggio dei like cliccabile per aprire la modale
            const likeCountSpanInButton = likeButton.querySelector('.like-count');
            if (likeCountSpanInButton) {
                // Verifica che lo span esista
                if (currentLikes > 0) {
                    likeCountSpanInButton.classList.add('clickable-comment-like-count'); // Aggiungi per stile CSS
                    likeCountSpanInButton.title = 'Vedi a chi piace questo commento';

                    likeCountSpanInButton.addEventListener('click', (e) => {
                        e.stopPropagation(); // Evita che il click si propaghi al bottone like
                        openGuestbookLikedByListModal(commentId); // Apri modale per questo commento
                    });
                } else {
                    // Se non ci sono like, non rendere cliccabile e rimuovi eventuali stili
                    likeCountSpanInButton.classList.remove('clickable-comment-like-count');
                    likeCountSpanInButton.style.cursor = 'default';
                    likeCountSpanInButton.style.textDecoration = 'none';
                    likeCountSpanInButton.title = '';
                }
            }

            commentContent.appendChild(likesContainer);
            // --- Fine Sezione Like ---

            commentElement.appendChild(commentContent);
            commentsListDiv.appendChild(commentElement);
        });
    } catch (error) {
        console.error(`comments.js - Error loading comments for pageId ${currentPageId}: `, error);
        if (error.code === 'failed-precondition' && commentsListDiv) {
            commentsListDiv.innerHTML = `<p>Errore: Indice Firestore mancante per filtrare i commenti. Controlla la console del browser per il link per crearlo.</p>`;
        } else if (commentsListDiv) {
            commentsListDiv.innerHTML = '<p>Errore caricamento commenti. Riprova più tardi.</p>';
        }
    }
}

/** Handles comment form submission */
async function handleCommentSubmit(event) {
    event.preventDefault();
    if (!guestbookCollection || !commentMessageInput || !submitCommentBtn || !commentsListDiv) {
        console.error('comments.js - Elementi DOM del form commenti mancanti.');
        showToast('Errore interfaccia. Riprova.');
        return;
    }
    const message = commentMessageInput.value.trim();
    if (!message) {
        showToast('Please enter a message.');
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
                userNameForDb = profileData.nickname || (user.email ? user.email.split('@')[0] : 'Registered User');
                if (profileData.nationalityCode) {
                    userNationalityCode = profileData.nationalityCode;
                }
            } else {
                userNameForDb = user.email ? user.email.split('@')[0] : 'Registered User';
            }
        } catch (profileError) {
            console.error('comments.js - Error loading profile for comment:', profileError);
            userNameForDb = user.email ? user.email.split('@')[0] : 'Registered User';
        }
    } else {
        if (!commentNameInput || !commentNameSection) {
            console.error('comments.js - Elementi DOM per nome anonimo mancanti.');
            showToast('Errore interfaccia. Riprova.');
            return;
        }
        nameForDb = commentNameInput.value.trim();
        if (!nameForDb) {
            showToast('Please enter your name or log in.');
            return;
        }
    }

    submitCommentBtn.disabled = true;
    submitCommentBtn.textContent = 'Submitting...';
    try {
        const commentDataPayload = {
            // Rinominato per chiarezza
            message: message,
            timestamp: serverTimestamp(),
            likes: 0, // Sub-task G.1.1: Inizializza likes a 0
            likedBy: [], // Sub-task G.1.1: Inizializza likedBy a array vuoto
            pageId: currentPageId,
        };
        if (userIdToSave) {
            commentDataPayload.userId = userIdToSave;
            commentDataPayload.userName = userNameForDb;
            if (userNationalityCode) {
                // Salva anche la nazionalità per gli utenti loggati
                commentDataPayload.nationalityCode = userNationalityCode;
            }
        } else {
            commentDataPayload.name = nameForDb;
            // Per gli utenti anonimi, la nazionalità non è richiesta/gestita nel form base
        }

        await addDoc(guestbookCollection, commentDataPayload);

        if (commentMessageInput) commentMessageInput.value = '';
        if (commentNameInput && !user) commentNameInput.value = ''; // Pulisci nome solo se utente non loggato
        await loadComments();
    } catch (error) {
        console.error('comments.js - Error submitting comment:', error);
        showToast('Error submitting comment. Please try again.');
    } finally {
        if (submitCommentBtn) {
            submitCommentBtn.disabled = false;
            submitCommentBtn.textContent = 'Submit Comment';
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
        console.error('Elemento likedByModal non trovato per i commenti del guestbook.');
        return;
    }
    // Non serve controllare auth.currentUser qui, perché il conteggio cliccabile
    // non dovrebbe essere visibile o la modale non dovrebbe aprirsi se non ci sono like.
    // La logica di chi può vedere è più a livello di UI che impedisce l'azione.

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
        console.error('Elementi modale o DB mancanti per populateGuestbookLikedByListModal');
        if (likedByModalLoading) likedByModalLoading.style.display = 'none';
        if (likedByModalList) likedByModalList.innerHTML = '<li>Errore critico.</li>';
        return;
    }

    try {
        const commentDocRef = doc(db, 'guestbookEntries', commentId); // Usa la collezione corretta
        const commentSnap = await getDoc(commentDocRef);

        let likedByUsersIds = [];
        if (commentSnap.exists()) {
            likedByUsersIds = commentSnap.data().likedBy || [];
        } else {
            console.warn(`Commento guestbook non trovato ID: ${commentId}`);
            likedByModalList.innerHTML = '<li>Errore: commento non trovato.</li>';
            if (likedByModalLoading) likedByModalLoading.style.display = 'none';
            return;
        }

        if (likedByUsersIds.length === 0) {
            if (likedByModalNoLikes) likedByModalNoLikes.style.display = 'block';
            likedByModalList.innerHTML = ''; // Assicurati che la lista sia vuota
        } else {
            const userProfilePromises = likedByUsersIds.map((userId) => getDoc(doc(db, 'userProfiles', userId)));
            const userProfileSnapshots = await Promise.all(userProfilePromises);

            likedByModalList.innerHTML = ''; // Pulisci prima di popolare
            userProfileSnapshots.forEach((userSnap) => {
                const li = document.createElement('li');
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    const avatarImg = document.createElement('img');
                    avatarImg.className = 'liked-by-avatar'; // Usa la classe CSS per lo stile avatar
                    avatarImg.src = generateBlockieAvatar(userSnap.id, 32, { size: 8 });
                    avatarImg.alt = `Avatar di ${userData.nickname || 'Utente'}`;

                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'liked-by-name'; // Usa la classe CSS per lo stile nome
                    nameSpan.textContent = userData.nickname || 'Utente Sconosciuto';

                    li.appendChild(avatarImg);
                    li.appendChild(nameSpan);

                    if (userData.nationalityCode && userData.nationalityCode !== 'OTHER') {
                        const flagSpan = document.createElement('span');
                        flagSpan.className = `fi fi-${userData.nationalityCode.toLowerCase()}`;
                        flagSpan.title = userData.nationalityCode; // Tooltip con il codice paese
                        // Potresti aggiungere stili direttamente qui o via CSS per il flagSpan
                        flagSpan.style.marginLeft = '8px'; // Esempio di stile
                        li.appendChild(flagSpan);
                    }
                } else {
                    // Utente potrebbe essere stato cancellato o ID non valido
                    console.warn(`Profilo utente non trovato per ID: ${userSnap.id} (liker di commento guestbook)`);
                    const avatarImg = document.createElement('img');
                    avatarImg.className = 'liked-by-avatar';
                    avatarImg.src = generateBlockieAvatar(userSnap.id || 'unknown', 32, { size: 8 }); // Avatar generico
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
        console.error(`Errore nel popolare la lista "Liked By" per commento guestbook:`, error);
        likedByModalList.innerHTML = '<li>Errore durante il caricamento della lista.</li>';
    } finally {
        if (likedByModalLoading) likedByModalLoading.style.display = 'none';
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Inizializzazione dei riferimenti DOM per la modale
    // Questi ID DEVONO CORRISPONDERE a quelli nell'HTML copiato in about.html e donkeyRunner.html
    likedByModal = document.getElementById('likedByModal'); // Assumiamo ID generico per la modale
    if (likedByModal) {
        // Solo se la modale esiste nella pagina corrente
        closeLikedByModalBtn = likedByModal.querySelector('#closeLikedByModalBtn'); // Cerca all'interno della modale
        likedByModalTitle = likedByModal.querySelector('#likedByModalTitle');
        likedByModalList = likedByModal.querySelector('#likedByModalList');
        likedByModalLoading = likedByModal.querySelector('#likedByModalLoading');
        likedByModalNoLikes = likedByModal.querySelector('#likedByModalNoLikes');

        if (closeLikedByModalBtn) {
            closeLikedByModalBtn.addEventListener('click', closeGuestbookLikedByListModal);
        }
        // Event listener per chiudere la modale cliccando sullo sfondo
        likedByModal.addEventListener('click', (event) => {
            if (event.target === likedByModal) {
                // Se il click è direttamente sullo sfondo della modale
                closeGuestbookLikedByListModal();
            }
        });
    } else {
        // console.warn("La modale 'likedByModal' non è presente in questa pagina. Le funzionalità di visualizzazione likers per i commenti guestbook potrebbero non essere attive.");
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
    if (commentForm) commentForm.addEventListener('submit', handleCommentSubmit);
    if (commentsListDiv && db && currentPageId) {
        loadComments();
    } else if (!db && commentsListDiv) {
        commentsListDiv.innerHTML = '<p>Error: Cannot connect to database.</p>';
    } else if (!currentPageId && commentsListDiv) {
        commentsListDiv.innerHTML = '<p>Error: Page context for comments not defined.</p>';
    }
});

onAuthStateChanged(auth, (user) => {
    console.log('comments.js - Auth state changed. User:', user ? user.uid : 'null');
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
        console.log('Auth state changed, reloading comments for like status and UI update (guestbook).');
        loadComments(); // Ricarica per aggiornare lo stato dei like
    }
});
// --- FINE MODIFICHE ---
