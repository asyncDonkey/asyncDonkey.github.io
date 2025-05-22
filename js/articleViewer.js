// js/articleViewer.js
import { db, auth, generateBlockieAvatar, escapeHTML } from './main.js';
import { getAuthorIconHTML } from './uiUtils.js';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    doc,
    updateDoc,
    getDoc,
    increment,
    arrayUnion,
    arrayRemove,
    Timestamp,
    serverTimestamp,
    documentId,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@5.0.1/lib/marked.esm.js';
import { showToast } from './toastNotifications.js';

const DEFAULT_AVATAR_IMAGE_PATH = 'assets/images/default-avatar.png';

let articleIdInternal = null;
let currentArticleData = null;

// Riferimenti DOM principali (come da tuo codice)
let articleDisplayLoading = document.getElementById('articleDisplayLoading');
let articleContentContainer = document.getElementById('articleContentContainer');
let articleDisplayTitle = document.getElementById('articleDisplayTitle');
let articleDisplayDate = document.getElementById('articleDisplayDate');
let articleDisplayAuthor = document.getElementById('articleDisplayAuthor');
let articleDisplayTagsContainer = document.getElementById('articleDisplayTagsContainer');
let articleDisplayContent = document.getElementById('articleDisplayContent');
let articleInteractionsSection = document.getElementById('articleInteractions');
let likeArticleButton = document.getElementById('likeArticleButton');
let articleLikeCountSpan = document.getElementById('articleLikeCount');
let commentsListDiv = document.getElementById('articleCommentsList');
let articleCommentFormContainer = document.getElementById('articleCommentFormContainer');
let articleCommentForm = document.getElementById('articleCommentForm');
let articleCommentMessageInput = document.getElementById('articleCommentMessage');
let submitArticleCommentBtn = document.getElementById('submitArticleCommentBtn');
let articleLoginToCommentMessage = document.getElementById('articleLoginToCommentMessage');
let articleLikeInteractionWrapper = null;

// Riferimenti DOM per la modale "Liked By"
let likedByModal = document.getElementById('likedByModal');
let closeLikedByModalBtn = document.getElementById('closeLikedByModalBtn');
let likedByModalTitle = document.getElementById('likedByModalTitle');
let likedByModalList = document.getElementById('likedByModalList');
let likedByModalLoading = document.getElementById('likedByModalLoading');
let likedByModalNoLikes = document.getElementById('likedByModalNoLikes');
let articleLikeCountClickListenerFunction = null;

// Riferimenti DOM per i pulsanti di condivisione
let articleShareSection = document.getElementById('articleShareSection');
let nativeShareBtn = document.getElementById('nativeShareBtn');
let copyLinkBtn = document.getElementById('copyLinkBtn');
let fallbackShareButtonsDiv = document.getElementById('fallbackShareButtons');
let shareToXBtn = document.getElementById('shareToX');
let shareToFacebookBtn = document.getElementById('shareToFacebook');
let shareToLinkedInBtn = document.getElementById('shareToLinkedIn');
let shareToWhatsAppBtn = document.getElementById('shareToWhatsApp');
let shareViaEmailBtn = document.getElementById('shareViaEmail');

function formatArticleDateForViewer(dateInput) {
    if (!dateInput) return 'Data non disponibile';
    try {
        let date;
        if (dateInput instanceof Timestamp) date = dateInput.toDate();
        else if (typeof dateInput === 'string') {
            date = new Date(dateInput);
            if (isNaN(date.getTime())) return 'Data invalida';
        } else if (dateInput && typeof dateInput.seconds === 'number' && typeof dateInput.nanoseconds === 'number') {
            date = new Timestamp(dateInput.seconds, dateInput.nanoseconds).toDate();
        } else return 'Formato data sconosciuto';
        return date.toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
        console.error('Errore formattazione data articolo:', e);
        return 'Errore data';
    }
}

function formatCommentTimestamp(firebaseTimestamp) {
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
        return 'Errore data';
    }
}

function setupShareButtons() {
    if (!currentArticleData || !articleShareSection) {
        if (articleShareSection) articleShareSection.style.display = 'none';
        return;
    }
    const articleTitle = currentArticleData.title || document.title;
    const articleUrl = window.location.href;
    const articleSnippet =
        currentArticleData.snippet ||
        (currentArticleData.contentMarkdown
            ? currentArticleData.contentMarkdown.substring(0, 100) + '...'
            : 'Leggi questo interessante articolo!');
    articleShareSection.style.display = 'block';

    if (navigator.share && nativeShareBtn) {
        nativeShareBtn.style.display = 'inline-flex';
        if (fallbackShareButtonsDiv) fallbackShareButtonsDiv.style.display = 'none';
        nativeShareBtn.onclick = async () => {
            try {
                await navigator.share({ title: articleTitle, text: articleSnippet, url: articleUrl });
                showToast('Articolo condiviso!', 'success');
            } catch (err) {
                if (err.name !== 'AbortError') {
                    showToast('Errore durante la condivisione.', 'error');
                    if (fallbackShareButtonsDiv) fallbackShareButtonsDiv.style.display = 'contents';
                }
            }
        };
    } else {
        if (nativeShareBtn) nativeShareBtn.style.display = 'none';
        if (fallbackShareButtonsDiv) fallbackShareButtonsDiv.style.display = 'contents';
    }

    if (copyLinkBtn) {
        copyLinkBtn.onclick = () => {
            navigator.clipboard
                .writeText(articleUrl)
                .then(() => showToast('Link copiato negli appunti!', 'success'))
                .catch(() => showToast('Errore nel copiare il link.', 'error'));
        };
    }

    const encodedUrl = encodeURIComponent(articleUrl);
    const encodedTitle = encodeURIComponent(articleTitle);
    if (shareToXBtn) shareToXBtn.href = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
    if (shareToFacebookBtn) shareToFacebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    if (shareToLinkedInBtn)
        shareToLinkedInBtn.href = `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodeURIComponent(articleSnippet)}`;
    if (shareToWhatsAppBtn)
        shareToWhatsAppBtn.href = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
    if (shareViaEmailBtn)
        shareViaEmailBtn.href = `mailto:?subject=${encodedTitle}&body=Leggi questo articolo:%20${encodedUrl}`;
}

function updateOpenGraphMetaTags(articleData) {
    if (!articleData) return;
    const setMetaTag = (property, content) => {
        let element = document.querySelector(`meta[property="${property}"]`);
        if (!element) {
            element = document.createElement('meta');
            element.setAttribute('property', property);
            document.head.appendChild(element);
        }
        element.setAttribute('content', content || '');
    };
    setMetaTag('og:title', articleData.title || document.title);
    setMetaTag(
        'og:description',
        articleData.snippet ||
            (articleData.contentMarkdown
                ? articleData.contentMarkdown.substring(0, 150) + '...'
                : 'Un interessante articolo da asyncDonkey.io')
    );
    setMetaTag('og:url', window.location.href);
    setMetaTag(
        'og:image',
        articleData.coverImageUrl || 'https://asyncdonkey.github.io/images/asyncDonkey-default-social-image.png'
    );
}

// --- FUNZIONE loadAndDisplayArticleFromFirestore AGGIORNATA ---
async function loadAndDisplayArticleFromFirestore(articleId) {
    if (articleDisplayLoading) articleDisplayLoading.style.display = 'block';
    if (articleContentContainer) articleContentContainer.style.display = 'none';
    if (articleInteractionsSection) articleInteractionsSection.style.display = 'none';
    if (articleShareSection) articleShareSection.style.display = 'none';
    if (articleDisplayContent) articleDisplayContent.innerHTML = '';

    try {
        const articleRef = doc(db, 'articles', articleId);
        const docSnap = await getDoc(articleRef);

        if (docSnap.exists() && docSnap.data().status === 'published') {
            const articleDataFromDb = docSnap.data();
            currentArticleData = articleDataFromDb;
            document.title = `${articleDataFromDb.title || 'Articolo'} - asyncDonkey.io`;
            updateOpenGraphMetaTags(articleDataFromDb);

            if (articleDisplayTitle) articleDisplayTitle.textContent = articleDataFromDb.title || 'N/D';
            if (articleDisplayDate) {
                articleDisplayDate.textContent = formatArticleDateForViewer(
                    articleDataFromDb.publishedAt || articleDataFromDb.updatedAt
                );
            }

            let authorNameForDisplay = articleDataFromDb.authorName || 'Autore Sconosciuto';
            let authorAvatarSrc = DEFAULT_AVATAR_IMAGE_PATH;
            const authorActualAvatarElement = document.getElementById('authorActualAvatar');
            let authorProfilePublicUpdatedAt = null;
            let authorPublicDataForIcon = null; // Variabile per i dati del profilo pubblico dell'autore

            if (articleDataFromDb.authorId) {
                try {
                    const authorPublicProfileRef = doc(db, 'userPublicProfiles', articleDataFromDb.authorId);
                    const authorPublicProfileSnap = await getDoc(authorPublicProfileRef);

                    if (authorPublicProfileSnap.exists()) {
                        authorPublicDataForIcon = authorPublicProfileSnap.data(); // Salva i dati per l'icona
                        authorNameForDisplay = authorPublicDataForIcon.nickname || authorNameForDisplay;
                        authorProfilePublicUpdatedAt = authorPublicDataForIcon.profilePublicUpdatedAt;

                        if (authorPublicDataForIcon.avatarUrls && authorPublicDataForIcon.avatarUrls.thumbnail) {
                            authorAvatarSrc = authorPublicDataForIcon.avatarUrls.thumbnail;
                        } else {
                            authorAvatarSrc = generateBlockieAvatar(articleDataFromDb.authorId, 48);
                        }
                    } else {
                        if (articleDataFromDb.authorId) {
                            authorAvatarSrc = generateBlockieAvatar(articleDataFromDb.authorId, 48);
                        }
                    }
                } catch (profileError) {
                    console.error(`Errore recupero profilo pubblico autore ${articleDataFromDb.authorId}:`, profileError);
                    if (articleDataFromDb.authorId) {
                        authorAvatarSrc = generateBlockieAvatar(articleDataFromDb.authorId, 48);
                    }
                }
            }

            if (authorAvatarSrc !== DEFAULT_AVATAR_IMAGE_PATH && !authorAvatarSrc.startsWith('data:image/png;base64') && authorProfilePublicUpdatedAt) {
                if (authorProfilePublicUpdatedAt.seconds) {
                    authorAvatarSrc += `?v=${authorProfilePublicUpdatedAt.seconds}`;
                } else if (authorProfilePublicUpdatedAt instanceof Date) {
                    authorAvatarSrc += `?v=${authorProfilePublicUpdatedAt.getTime()}`;
                }
            }

            if (authorActualAvatarElement) {
                authorActualAvatarElement.src = authorAvatarSrc;
                authorActualAvatarElement.alt = `Avatar di ${authorNameForDisplay}`;
                authorActualAvatarElement.onerror = () => {
                    authorActualAvatarElement.src = DEFAULT_AVATAR_IMAGE_PATH;
                    authorActualAvatarElement.onerror = null;
                };
            }

            if (articleDisplayAuthor) {
                articleDisplayAuthor.innerHTML = ''; // Pulisci prima
                const authorIconHTML = getAuthorIconHTML(authorPublicDataForIcon); // Passa i dati del profilo pubblico
                const escapedAuthorName = escapeHTML(authorNameForDisplay);

                if (articleDataFromDb.authorId) {
                    const authorLink = document.createElement('a');
                    authorLink.href = `profile.html?userId=${articleDataFromDb.authorId}`;
                    authorLink.innerHTML = escapedAuthorName + authorIconHTML; // Nickname + Icona
                    articleDisplayAuthor.appendChild(authorLink);
                } else {
                    articleDisplayAuthor.innerHTML = escapedAuthorName + authorIconHTML; // Nickname + Icona
                }
            }

            // ... (resto della funzione: tags, content, interactions, share, likes, comments, listeners - rimane invariato)
            if (articleDisplayTagsContainer) {
                articleDisplayTagsContainer.innerHTML = '';
                if (articleDataFromDb.tags && Array.isArray(articleDataFromDb.tags) && articleDataFromDb.tags.length > 0) {
                    articleDataFromDb.tags.forEach((tagText) => {
                        const tagEl = document.createElement('span');
                        tagEl.className = 'article-tag';
                        tagEl.textContent = tagText;
                        articleDisplayTagsContainer.appendChild(tagEl);
                    });
                } else {
                    articleDisplayTagsContainer.textContent = 'Nessun tag';
                }
            }
            if (articleDisplayContent) {
                if (articleDataFromDb.contentMarkdown) {
                    try {
                        articleDisplayContent.innerHTML = marked.parse(articleDataFromDb.contentMarkdown);
                    } catch (e) {
                        console.error('Errore durante il parsing del Markdown:', e);
                        articleDisplayContent.textContent = articleDataFromDb.contentMarkdown; // Fallback a testo semplice
                    }
                } else {
                    articleDisplayContent.innerHTML = '<p>Contenuto non disponibile.</p>';
                }
            }

            if (articleContentContainer) articleContentContainer.style.display = 'block';
            if (articleInteractionsSection) articleInteractionsSection.style.display = 'block';

            setupShareButtons(); // Chiama dopo che currentArticleData è impostato
            await loadAndDisplayArticleLikes(articleId); // Chiama dopo che currentArticleData è impostato
            await loadArticleComments(); // Chiama dopo che l'ID articolo è valido

            // Assicurati che i listener siano aggiunti solo una volta
            if (likeArticleButton && !likeArticleButton.hasAttribute('data-listener-attached')) {
                likeArticleButton.addEventListener('click', handleArticleLike);
                likeArticleButton.setAttribute('data-listener-attached', 'true');
            }
            if (articleCommentForm && !articleCommentForm.hasAttribute('data-listener-attached')) {
                articleCommentForm.addEventListener('submit', handleArticleCommentSubmit);
                articleCommentForm.setAttribute('data-listener-attached', 'true');
            }

        } else {
            // ... (logica articolo non trovato/non pubblicato - rimane invariata)
            let message = `<p>Spiacenti, articolo ID "${articleId}" non trovato o non pubblicato.`;
            if (docSnap.exists() && docSnap.data().status !== 'published') {
                message = `<p>Spiacenti, l'articolo ID "${articleId}" non è attualmente pubblicato.`;
            }
            message += ` Torna alla <a href='index.html#articlesSection'>lista articoli</a>.</p>`;

            if (articleContentContainer) articleContentContainer.style.display = 'block'; // Mostra contenitore per messaggio errore
            if (articleDisplayTitle) articleDisplayTitle.textContent = 'Articolo Non Trovato';
            if (articleDisplayContent) articleDisplayContent.innerHTML = message;
            if (articleInteractionsSection) articleInteractionsSection.style.display = 'none';
            if (articleShareSection) articleShareSection.style.display = 'none';
            document.title = 'Articolo Non Trovato - asyncDonkey.io';
            currentArticleData = null;
        }
    } catch (error) {
        // ... (gestione errore caricamento articolo - rimane invariata)
        console.error('Errore caricamento articolo:', error);
        if (articleContentContainer) articleContentContainer.style.display = 'block'; // Mostra contenitore per messaggio errore
        if (articleDisplayTitle) articleDisplayTitle.textContent = 'Errore Caricamento';
        if (articleDisplayContent) articleDisplayContent.innerHTML = "<p>Errore nel caricamento dell'articolo. Riprova più tardi.</p>";
        if (articleInteractionsSection) articleInteractionsSection.style.display = 'none';
        if (articleShareSection) articleShareSection.style.display = 'none';
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
            if (articleDisplayContent) articleDisplayContent.innerHTML += '<p style="color:orange;">Indice Firestore mancante. Controlla la console per il link per crearlo.</p>';
        }
        currentArticleData = null;
    } finally {
        if (articleDisplayLoading) articleDisplayLoading.style.display = 'none';
    }
}



function updateArticleCommentFormUI(user) {
    const currentFormContainer = document.getElementById('articleCommentFormContainer');
    let currentLoginMessage = document.getElementById('articleLoginToCommentMessage');
    const nameSectionLegacy = document.getElementById('articleCommentNameSection');

    if (!currentLoginMessage && currentFormContainer && currentFormContainer.parentNode) {
        currentLoginMessage = document.createElement('div');
        currentLoginMessage.id = 'articleLoginToCommentMessage';
        currentLoginMessage.style.padding = '15px';
        currentLoginMessage.style.textAlign = 'center';
        currentLoginMessage.style.backgroundColor = 'var(--surface-bg-secondary)';
        currentLoginMessage.style.borderRadius = '4px';
        currentLoginMessage.style.marginTop = '10px';
        currentLoginMessage.innerHTML = `<p>Devi essere <a href="#" id="loginLinkFromArticleComment" style="color: var(--link-color); text-decoration: underline;">loggato</a> per lasciare un commento.</p>`;
        currentFormContainer.parentNode.insertBefore(currentLoginMessage, currentFormContainer);
    }

    if (currentFormContainer && currentLoginMessage) {
        if (user) {
            currentFormContainer.style.display = 'block';
            currentLoginMessage.style.display = 'none';
            if (nameSectionLegacy) {
                nameSectionLegacy.style.display = 'none';
                const nameInput = document.getElementById('articleCommentName');
                if (nameInput) nameInput.required = false;
            }
        } else {
            currentFormContainer.style.display = 'none';
            currentLoginMessage.style.display = 'block';
            const loginLink = currentLoginMessage.querySelector('#loginLinkFromArticleComment');
            if (loginLink && !loginLink.hasAttribute('data-listener-attached')) {
                loginLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    const showLoginBtnGlobal = document.getElementById('showLoginBtn');
                    if (showLoginBtnGlobal) showLoginBtnGlobal.click();
                });
                loginLink.setAttribute('data-listener-attached', 'true');
            }
        }
    }
}

async function handleArticleCommentSubmit(event) {
    event.preventDefault();
    if (!articleCommentMessageInput || !submitArticleCommentBtn || !articleIdInternal) {
        showToast('Errore: elementi del form commenti mancanti.', 'error');
        return;
    }
    const message = articleCommentMessageInput.value.trim();
    if (!message) {
        showToast('Inserisci un messaggio per il commento.', 'warning');
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        showToast('Devi essere loggato per inviare un commento.', 'error');
        updateArticleCommentFormUI(null);
        return;
    }

    submitArticleCommentBtn.disabled = true;
    submitArticleCommentBtn.textContent = 'Invio...';

    let commentDataPayload = {
        articleId: articleIdInternal,
        message: message,
        timestamp: serverTimestamp(),
        likes: 0,
        likedBy: [],
        userId: user.uid,
    };

    try {
        // *** IMPORTANTE: Questa lettura da userProfiles è CORRETTA per denormalizzare i dati del PROPRIO profilo ***
        const userProfileRef = doc(db, 'userProfiles', user.uid);
        const docSnap = await getDoc(userProfileRef);
        if (docSnap.exists()) {
            commentDataPayload.userName =
                docSnap.data().nickname || (user.email ? user.email.split('@')[0] : 'Utente Registrato');
            if (docSnap.data().nationalityCode) {
                commentDataPayload.nationalityCode = docSnap.data().nationalityCode;
            }
        } else {
            commentDataPayload.userName = user.email ? user.email.split('@')[0] : 'Utente Registrato';
        }

        const commentsCollectionRef = collection(db, 'articleComments');
        await addDoc(commentsCollectionRef, commentDataPayload);

        if (articleIdInternal) {
            const articleRef = doc(db, 'articles', articleIdInternal);
            try {
                await updateDoc(articleRef, { commentCount: increment(1), updatedAt: serverTimestamp() });
                if (currentArticleData && typeof currentArticleData.commentCount === 'number') {
                    currentArticleData.commentCount++;
                }
            } catch (e) {
                console.error('Errore client aggiornamento conteggio commenti articolo:', e);
            }
        }
        articleCommentMessageInput.value = '';
        await loadArticleComments(); // Ricarica per visualizzare con i dati corretti
        showToast('Commento inviato con successo!', 'success');
    } catch (error) {
        console.error('Errore durante invio commento:', error);
        showToast('Si è verificato un errore durante l_invio del commento. Riprova.', 'error');
    } finally {
        if (submitArticleCommentBtn) {
            submitArticleCommentBtn.disabled = false;
            submitArticleCommentBtn.textContent = 'Invia Commento';
        }
    }
}

// La funzione handleArticleCommentLike rimane quasi la stessa,
// il controllo !currentUser è ora una doppia sicurezza.
async function handleArticleCommentLike(event) {
    const button = event.currentTarget; 
    const commentId = button.dataset.commentId;
    const currentUser = auth.currentUser;

    if (!currentUser) {
        // showToast("Devi essere loggato per mettere 'Mi piace' ai commenti.", "info");
        // const showLoginBtnGlobal = document.getElementById('showLoginBtn');
        // if (showLoginBtnGlobal) showLoginBtnGlobal.click();
        console.warn("[handleArticleCommentLike] Chiamata anomala: l'utente non è loggato ma il bottone era attivo?");
        return;
    }
     if(!commentId){
        showToast("ID commento non trovato.", "error");
        return;
    }

    button.disabled = true;
    const commentRef = doc(db, 'articleComments', commentId);
    try {
        const commentSnap = await getDoc(commentRef);
        if (!commentSnap.exists()) {
            showToast('Errore: commento non trovato.', 'error');
            button.disabled = false;
            return;
        }
        const commentData = commentSnap.data();
        const likedByUsers = commentData.likedBy || [];
        const userHasLiked = likedByUsers.includes(currentUser.uid);
        let newLikesCountOp = userHasLiked ? increment(-1) : increment(1);
        let userArrayUpdateOp = userHasLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid);

        if (userHasLiked && (commentData.likes || 0) <= 0) {
            if (!likedByUsers.includes(currentUser.uid)) { button.disabled = false; return; }
            if ((commentData.likes || 0) <= 0) newLikesCountOp = increment(0);
        }

        await updateDoc(commentRef, { likes: newLikesCountOp, likedBy: userArrayUpdateOp });

        const updatedCommentSnap = await getDoc(commentRef);
        if (updatedCommentSnap.exists()) {
            const updatedCommentData = updatedCommentSnap.data();
            const currentLikesCount = updatedCommentData.likes || 0;
            const userNowHasLiked = updatedCommentData.likedBy && updatedCommentData.likedBy.includes(currentUser.uid);

            const iconName = userNowHasLiked ? 'favorite' : 'favorite_border';
            button.innerHTML = `<span class="material-symbols-rounded">${iconName}</span> <span class="like-count">${currentLikesCount}</span>`;
            button.classList.toggle('liked', userNowHasLiked);
            button.title = userNowHasLiked ? 'Togli il like a questo commento' : 'Metti like a questo commento';
            
            const commentLikeCountSpanInButton = button.querySelector('.like-count');
            if (commentLikeCountSpanInButton) {
                const oldListener = commentLikeCountSpanInButton.handleLikeCountClick;
                if (oldListener) commentLikeCountSpanInButton.removeEventListener('click', oldListener);
                
                if (currentLikesCount > 0 && currentUser) { // Solo utenti loggati
                    commentLikeCountSpanInButton.classList.add('clickable-comment-like-count');
                    commentLikeCountSpanInButton.title = 'Vedi a chi piace questo commento';
                    const newListener = (e) => {
                        e.stopPropagation();
                        openLikedByListModal(commentId, 'articleComment');
                    };
                    commentLikeCountSpanInButton.addEventListener('click', newListener);
                    commentLikeCountSpanInButton.handleLikeCountClick = newListener;
                } else {
                    commentLikeCountSpanInButton.classList.remove('clickable-comment-like-count');
                    commentLikeCountSpanInButton.style.cursor = 'default';
                    commentLikeCountSpanInButton.style.textDecoration = 'none';
                    commentLikeCountSpanInButton.title = '';
                    delete commentLikeCountSpanInButton.handleLikeCountClick;
                }
            }
        }
        button.disabled = false;
    } catch (error) {
        console.error('[articleViewer.js] Errore like/unlike commento articolo:', error);
        showToast('Si è verificato un errore durante il like/unlike del commento. Riprova.', 'error');
        button.disabled = false;
    }
}

// --- FUNZIONE loadArticleComments AGGIORNATA ---
async function loadArticleComments() {
    if (!commentsListDiv || !articleIdInternal) {
        if (commentsListDiv) commentsListDiv.innerHTML = '<p>Impossibile caricare i commenti (ID articolo mancante).</p>';
        return;
    }
    commentsListDiv.innerHTML = '<p>Caricamento commenti...</p>';
    const currentUser = auth.currentUser;

    try {
        const commentsCollectionRef = collection(db, 'articleComments');
        const q = query(
            commentsCollectionRef,
            where('articleId', '==', articleIdInternal),
            orderBy('timestamp', 'desc'),
            limit(25) // Limita a 25 commenti per ora, puoi aggiungere paginazione in futuro
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            commentsListDiv.innerHTML = '<p>Nessun commento. Sii il primo!</p>';
            return;
        }

        // Pre-carica tutti i profili pubblici dei commentatori in un unico batch (o più batch se necessario)
        const commenterIdsToFetch = [...new Set(querySnapshot.docs.map(docSnap => docSnap.data().userId).filter(id => id))];
        const commenterPublicProfilesMap = new Map();

        if (commenterIdsToFetch.length > 0) {
            const MAX_IDS_PER_IN_QUERY = 30; // Limite Firestore per query 'in'
            const profilePromises = [];
            for (let i = 0; i < commenterIdsToFetch.length; i += MAX_IDS_PER_IN_QUERY) {
                const batchUserIds = commenterIdsToFetch.slice(i, i + MAX_IDS_PER_IN_QUERY);
                const profilesQuery = query(collection(db, 'userPublicProfiles'), where(documentId(), 'in', batchUserIds));
                profilePromises.push(getDocs(profilesQuery));
            }
            try {
                const snapshotsArray = await Promise.all(profilePromises);
                snapshotsArray.forEach(snapshot => {
                    snapshot.forEach(docSnap => {
                        if (docSnap.exists()) {
                            commenterPublicProfilesMap.set(docSnap.id, docSnap.data());
                        }
                    });
                });
            } catch (profileError) {
                console.error('[articleViewer.js] Errore recupero batch profili pubblici commentatori:', profileError);
                // Continua comunque, i commenti verranno mostrati con info di fallback
            }
        }

        commentsListDiv.innerHTML = ''; // Pulisci prima di aggiungere
        querySnapshot.forEach((docSnapshot) => {
            const commentData = docSnapshot.data();
            const commentId = docSnapshot.id;
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment-item');

            const avatarImg = document.createElement('img');
            avatarImg.classList.add('comment-avatar-img');

            let commenterNameDisplay = commentData.userName || 'Utente Anonimo'; // Nome denormalizzato sul commento
            let commenterAvatarSrc = DEFAULT_AVATAR_IMAGE_PATH;
            let commenterNationalityCode = commentData.nationalityCode || null; // Nazionalità denormalizzata sul commento
            let commenterProfileForIcon = null; // Dati del profilo pubblico del commentatore
            let commenterProfilePublicUpdatedAt = null;


            const commenterPublicProfile = commentData.userId ? commenterPublicProfilesMap.get(commentData.userId) : null;
            if (commenterPublicProfile) {
                commenterProfileForIcon = commenterPublicProfile; // Salva per l'icona
                commenterNameDisplay = commenterPublicProfile.nickname || commenterNameDisplay; // Preferisci nickname dal profilo
                commenterNationalityCode = commenterPublicProfile.nationalityCode || commenterNationalityCode; // Preferisci nazionalità dal profilo
                commenterProfilePublicUpdatedAt = commenterPublicProfile.profilePublicUpdatedAt;

                if (commenterPublicProfile.avatarUrls && commenterPublicProfile.avatarUrls.thumbnail) {
                    commenterAvatarSrc = commenterPublicProfile.avatarUrls.thumbnail;
                } else if (commentData.userId) { // Fallback a blockie se profilo pubblico esiste ma non ha avatarUrl
                    commenterAvatarSrc = generateBlockieAvatar(commentData.userId, 40, { size: 8 });
                }
            } else if (commentData.userId) { // Se non c'è profilo pubblico, usa blockie basato su userId
                commenterAvatarSrc = generateBlockieAvatar(commentData.userId, 40, { size: 8 });
            }
            // Altrimenti, userà DEFAULT_AVATAR_IMAGE_PATH

            if (commenterAvatarSrc !== DEFAULT_AVATAR_IMAGE_PATH && !commenterAvatarSrc.startsWith('data:image/png;base64') && commenterProfilePublicUpdatedAt) {
                 if (commenterProfilePublicUpdatedAt.seconds) {
                    commenterAvatarSrc += `?v=${commenterProfilePublicUpdatedAt.seconds}`;
                } else if (commenterProfilePublicUpdatedAt instanceof Date) {
                    commenterAvatarSrc += `?v=${commenterProfilePublicUpdatedAt.getTime()}`;
                }
            }
            avatarImg.src = commenterAvatarSrc;
            avatarImg.alt = `Avatar di ${commenterNameDisplay}`;
            avatarImg.onerror = () => { avatarImg.src = DEFAULT_AVATAR_IMAGE_PATH; avatarImg.onerror = null; };
            commentElement.appendChild(avatarImg);

            const commentContentDiv = document.createElement('div');
            commentContentDiv.classList.add('comment-content');

            const nameEl = document.createElement('strong');
            const authorIconHTML = getAuthorIconHTML(commenterProfileForIcon); // Passa i dati del profilo pubblico
            const escapedCommenterName = escapeHTML(commenterNameDisplay);

            if (commentData.userId) {
                const commenterProfileLink = document.createElement('a');
                commenterProfileLink.href = `profile.html?userId=${commentData.userId}`;
                commenterProfileLink.innerHTML = escapedCommenterName + authorIconHTML; // Nickname + Icona nel link
                nameEl.appendChild(commenterProfileLink);
            } else {
                nameEl.innerHTML = escapedCommenterName + authorIconHTML; // Nickname + Icona (senza link se no userId)
            }

            if (commenterNationalityCode && commenterNationalityCode !== 'OTHER') {
                const flagSpan = document.createElement('span');
                flagSpan.className = `fi fi-${commenterNationalityCode.toLowerCase()}`;
                flagSpan.title = commenterNationalityCode;
                flagSpan.style.marginLeft = '5px'; // Spazio dopo nome/icona
                nameEl.appendChild(flagSpan); // Aggiungi dopo il link o il nome+icona
            }

            const dateEl = document.createElement('small');
            dateEl.classList.add('comment-date');
            dateEl.textContent = ` - ${formatCommentTimestamp(commentData.timestamp)}`;

            const nameAndDateContainer = document.createElement('div');
            nameAndDateContainer.style.display = 'flex';
            nameAndDateContainer.style.alignItems = 'baseline'; // O 'center' per allineare verticalmente
            nameAndDateContainer.appendChild(nameEl);
            nameAndDateContainer.appendChild(dateEl);

            const messageEl = document.createElement('p');
            messageEl.textContent = commentData.message;
            messageEl.style.marginTop = '4px'; // Stile per separare messaggio da nome/data

            commentContentDiv.appendChild(nameAndDateContainer);
            commentContentDiv.appendChild(messageEl);

            // --- Sezione Like Commento con WRAPPER ---
            // ... (la logica dei like ai commenti rimane invariata, come nel tuo codice originale)
            const commentLikesContainer = document.createElement('div');
            commentLikesContainer.classList.add('likes-container'); // Per stile se necessario
            commentLikesContainer.style.marginTop = '4px';

            const commentLikeInteractionWrapper = document.createElement('div');
            commentLikeInteractionWrapper.style.display = 'inline-block'; // Per corretto posizionamento
            commentLikeInteractionWrapper.classList.add('comment-like-interaction-wrapper');

            const commentLikeButton = document.createElement('button');
            commentLikeButton.classList.add('like-btn'); // Stile generico per i bottoni like
            commentLikeButton.setAttribute('data-comment-id', commentId);

            const currentLikes = commentData.likes || 0;
            let userHasLikedThisComment = false;
            if (currentUser && commentData.likedBy && commentData.likedBy.includes(currentUser.uid)) {
                userHasLikedThisComment = true;
            }

            const iconName = userHasLikedThisComment ? 'favorite' : 'favorite_border';
            commentLikeButton.innerHTML = `<span class="material-symbols-rounded">${iconName}</span> <span class="like-count">${currentLikes}</span>`;
            commentLikeButton.classList.toggle('liked', userHasLikedThisComment);
            commentLikeButton.title = userHasLikedThisComment ? 'Togli il like a questo commento' : 'Metti like a questo commento';
            
            // Rimuovi vecchi listener prima di aggiungerne di nuovi per evitare duplicazioni
            const oldBtnHandler = commentLikeButton.handlerAttached;
            if (oldBtnHandler) {
                commentLikeButton.removeEventListener('click', oldBtnHandler);
                delete commentLikeButton.handlerAttached;
            }
            const oldGuestWrapperHandler = commentLikeInteractionWrapper.guestHandlerAttached;
            if (oldGuestWrapperHandler) {
                commentLikeInteractionWrapper.removeEventListener('click', oldGuestWrapperHandler);
                delete commentLikeInteractionWrapper.guestHandlerAttached;
            }
            commentLikeInteractionWrapper.classList.remove('guest-interactive'); // Pulisci sempre


            if (currentUser) {
                commentLikeButton.disabled = false;
                commentLikeInteractionWrapper.style.cursor = 'pointer'; // Il wrapper gestisce il click se il bottone è disabilitato
                
                const newHandler = handleArticleCommentLike; // Riferimento diretto alla funzione
                commentLikeButton.addEventListener('click', newHandler);
                commentLikeButton.handlerAttached = newHandler; // Memorizza per rimozione
            } else {
                commentLikeButton.disabled = true; // Il bottone è disabilitato
                commentLikeInteractionWrapper.style.cursor = 'pointer'; // Ma il wrapper è cliccabile
                commentLikeInteractionWrapper.title = "Accedi per mettere 'Mi piace'";
                commentLikeInteractionWrapper.classList.add('guest-interactive');

                const guestCommentLikeHandler = (e) => {
                    e.stopPropagation();
                    showToast("Devi essere loggato per mettere 'Mi piace' ai commenti.", "info", 3000);
                    // Non aprire modale qui, è solo un toast per i commenti, come da D.9.3
                };
                commentLikeInteractionWrapper.addEventListener('click', guestCommentLikeHandler);
                commentLikeInteractionWrapper.guestHandlerAttached = guestCommentLikeHandler;
            }
            
            commentLikeInteractionWrapper.appendChild(commentLikeButton);
            commentLikesContainer.appendChild(commentLikeInteractionWrapper);
            commentContentDiv.appendChild(commentLikesContainer);
            // --- Fine Sezione Like Commento con WRAPPER ---

            // Logica per rendere cliccabile il numero di like (se > 0 e utente loggato)
             const commentLikeCountSpanInButton = commentLikeButton.querySelector('.like-count');
            if (commentLikeCountSpanInButton) {
                const oldListener = commentLikeCountSpanInButton.handleLikeCountClick;
                if (oldListener) commentLikeCountSpanInButton.removeEventListener('click', oldListener);
                
                if (currentLikes > 0 && currentUser) { // Solo utenti loggati
                    commentLikeCountSpanInButton.classList.add('clickable-comment-like-count');
                    commentLikeCountSpanInButton.title = 'Vedi a chi piace questo commento';
                    const newListener = (e) => {
                        e.stopPropagation(); // Evita che il click sul numero triggeri anche il like/unlike del bottone
                        openLikedByListModal(commentId, 'articleComment');
                    };
                    commentLikeCountSpanInButton.addEventListener('click', newListener);
                    commentLikeCountSpanInButton.handleLikeCountClick = newListener; // Memorizza per futura rimozione
                } else {
                    commentLikeCountSpanInButton.classList.remove('clickable-comment-like-count');
                    commentLikeCountSpanInButton.style.cursor = 'default';
                    commentLikeCountSpanInButton.style.textDecoration = 'none';
                    commentLikeCountSpanInButton.title = '';
                    delete commentLikeCountSpanInButton.handleLikeCountClick; // Rimuovi riferimento
                }
            }

            commentElement.appendChild(commentContentDiv);
            commentsListDiv.appendChild(commentElement);
        });
    } catch (error) {
        console.error(`[articleViewer.js] Errore caricamento commenti:`, error);
        if (commentsListDiv) commentsListDiv.innerHTML = '<p>Errore caricamento commenti.</p>';
    }
}

async function loadAndDisplayArticleLikes(articleId) {
    console.log('[AV - LikeDebug] loadAndDisplayArticleLikes INIZIO per articleId:', articleId);
    // articleLikeInteractionWrapper è già definito a livello di modulo e assegnato in DOMContentLoaded
    if (!articleLikeInteractionWrapper) { // Controllo aggiunto per sicurezza
        console.error('[AV - LikeDebug] articleLikeInteractionWrapper NON TROVATO nel DOM in loadAndDisplayArticleLikes.');
        // Potresti voler disabilitare il pulsante o gestire l'errore in altro modo
        if (likeArticleButton) likeArticleButton.disabled = true;
        return;
    }
    console.log('[AV - LikeDebug] articleLikeInteractionWrapper preso dal DOM:', articleLikeInteractionWrapper);

    if (!likeArticleButton || !articleLikeCountSpan || !articleId) {
        console.warn('[AV - LikeDebug] Elementi mancanti, esco. Button:', !!likeArticleButton, 'CountSpan:', !!articleLikeCountSpan, 'Wrapper:', !!articleLikeInteractionWrapper);
        if (articleLikeCountSpan) articleLikeCountSpan.textContent = 'N/A';
        if (likeArticleButton) {
            likeArticleButton.innerHTML = `<span class="material-symbols-rounded">favorite_border</span> Like`;
            likeArticleButton.disabled = true;
        }
        articleLikeInteractionWrapper.style.cursor = 'default';
        articleLikeInteractionWrapper.classList.remove('guest-interactive');
        return;
    }
    
    // Pulisci listener precedenti dal wrapper
    if (articleLikeInteractionWrapper.handlerAttached) {
        console.log('[AV - LikeDebug] Rimuovo vecchio handler dal wrapper del like articolo.');
        articleLikeInteractionWrapper.removeEventListener('click', articleLikeInteractionWrapper.handlerAttached);
        delete articleLikeInteractionWrapper.handlerAttached;
    }
    articleLikeInteractionWrapper.style.cursor = 'default';
    articleLikeInteractionWrapper.classList.remove('guest-interactive'); // Rimuovi sempre all'inizio

    // ... (logica per articleLikeCountClickListenerFunction invariata) ...
    if (articleLikeCountClickListenerFunction && articleLikeCountSpan) {
        articleLikeCountSpan.removeEventListener('click', articleLikeCountClickListenerFunction);
        articleLikeCountClickListenerFunction = null;
    }
    articleLikeCountSpan.style.cursor = 'default';
    articleLikeCountSpan.style.textDecoration = 'none';
    articleLikeCountSpan.title = '';
    articleLikeCountSpan.classList.remove('clickable-like-count');


    const articleRef = doc(db, 'articles', articleId);
    try {
        console.log('[AV - LikeDebug] Tento getDoc per articolo:', articleId);
        const docSnap = await getDoc(articleRef);
        if (docSnap.exists()) {
            console.log('[AV - LikeDebug] Articolo trovato.');
            currentArticleData = docSnap.data();
            const likes = currentArticleData.likeCount || 0;
            const likedByUsers = currentArticleData.likedByUsers || [];
            articleLikeCountSpan.textContent = likes;

            if (likes > 0 && auth.currentUser) { // Solo se loggato può vedere la lista
                articleLikeCountSpan.classList.add('clickable-like-count');
                articleLikeCountSpan.title = 'Vedi a chi piace questo articolo';
                const newListener = () => {
                    openLikedByListModal(articleId, 'article');
                };
                articleLikeCountSpan.addEventListener('click', newListener);
                articleLikeCountClickListenerFunction = newListener;
            }

            const currentUser = auth.currentUser;
            console.log('[AV - LikeDebug] currentUser:', currentUser);

            if (currentUser) {
                console.log('[AV - LikeDebug] Utente LOGGATO per like articolo.');
                likeArticleButton.disabled = false;
                articleLikeInteractionWrapper.style.cursor = 'pointer'; 
                // Non è necessario aggiungere 'guest-interactive' qui
                const userHasLikedArticle = likedByUsers.includes(currentUser.uid);
                const iconNameArticle = userHasLikedArticle ? 'favorite' : 'favorite_border';
                const buttonTextArticle = userHasLikedArticle ? 'Liked' : 'Like';
                likeArticleButton.innerHTML = `<span class="material-symbols-rounded">${iconNameArticle}</span> ${buttonTextArticle}`;
                likeArticleButton.classList.toggle('liked', userHasLikedArticle);
                likeArticleButton.title = userHasLikedArticle ? 'Togli il like a questo articolo' : 'Metti like a questo articolo';
                // L'event listener sul likeArticleButton è già stato aggiunto in DOMContentLoaded o sarà aggiunto una sola volta
            } else {
                console.log('[AV - LikeDebug] Utente NON LOGGATO per like articolo.');
                likeArticleButton.disabled = true;
                likeArticleButton.innerHTML = `<span class="material-symbols-rounded">favorite_border</span> Like`;
                likeArticleButton.title = 'Accedi per mettere like';
                likeArticleButton.classList.remove('liked');
                
                console.log('[AV - LikeDebug] Aggiungo guestLikeHandler al wrapper articolo.');
                articleLikeInteractionWrapper.style.cursor = 'pointer';
                articleLikeInteractionWrapper.classList.add('guest-interactive'); // Fondamentale per il CSS pointer-events

                const guestLikeHandler = (event) => {
                    event.stopPropagation(); // Previene bubbling se ci fossero altri listener sul body
                    console.log('[AV - LikeDebug] Wrapper ARTICOLO cliccato da GUEST!');
                    showToast("Devi essere loggato per mettere 'Mi piace'.", "info", 3000);
                    const showLoginBtnGlobal = document.getElementById('showLoginBtn');
                    if (showLoginBtnGlobal) {
                        showLoginBtnGlobal.click();
                    }
                };
                articleLikeInteractionWrapper.addEventListener('click', guestLikeHandler);
                articleLikeInteractionWrapper.handlerAttached = guestLikeHandler;
            }
        } else {
            console.warn(`[AV - LikeDebug] Articolo ${articleId} non trovato per likes.`);
            if (articleLikeCountSpan) articleLikeCountSpan.textContent = '0';
            if (likeArticleButton) {
                likeArticleButton.innerHTML = `<span class="material-symbols-rounded">favorite_border</span> Like`;
                likeArticleButton.disabled = true;
            }
            articleLikeInteractionWrapper.style.cursor = 'default';
            articleLikeInteractionWrapper.classList.remove('guest-interactive');
        }
    } catch (error) {
        console.error('[AV - LikeDebug] Errore caricamento likes articolo:', error);
        if (articleLikeCountSpan) articleLikeCountSpan.textContent = 'Err';
        if (likeArticleButton) {
            likeArticleButton.disabled = true;
            likeArticleButton.innerHTML = `<span class="material-symbols-rounded">favorite_border</span> Like`;
        }
        articleLikeInteractionWrapper.style.cursor = 'default';
        articleLikeInteractionWrapper.classList.remove('guest-interactive');
    }
    console.log('[AV - LikeDebug] loadAndDisplayArticleLikes FINE');
}

async function handleArticleLike() {
    if (!auth.currentUser) {
        // Questa situazione dovrebbe essere gestita dal wrapper, ma come fallback:
        showToast("Devi essere loggato per mettere 'Mi piace'.", "info");
        const showLoginBtnGlobal = document.getElementById('showLoginBtn');
        if (showLoginBtnGlobal) showLoginBtnGlobal.click();
        return;
    }
    if (!articleIdInternal) {
        showToast("ID articolo non definito.", "error");
        return;
    }
    if (!likeArticleButton) {
        console.error('[articleViewer.js] Bottone Like articolo non trovato nel DOM.');
        return;
    }
    if (!currentArticleData || typeof currentArticleData.likeCount === 'undefined') {
        // Ricarica i dati se sono mancanti, questo può succedere se la pagina non è completamente inizializzata
        const articleRefCheck = doc(db, 'articles', articleIdInternal);
        const docSnapCheck = await getDoc(articleRefCheck);
        if (docSnapCheck.exists()) {
            currentArticleData = docSnapCheck.data();
        } else {
            showToast('Errore: dati articolo non trovati per il like.', 'error');
            return;
        }
    }
    
    likeArticleButton.disabled = true; // Disabilita durante l'operazione

    const articleRef = doc(db, 'articles', articleIdInternal);
    const userId = auth.currentUser.uid;
    const userHasLiked = currentArticleData.likedByUsers && currentArticleData.likedByUsers.includes(userId);

    const likeUpdateOperation = userHasLiked ? increment(-1) : increment(1);
    const userArrayUpdateOperation = userHasLiked ? arrayRemove(userId) : arrayUnion(userId);

    const updatePayload = {
        likeCount: likeUpdateOperation,
        likedByUsers: userArrayUpdateOperation,
        updatedAt: serverTimestamp(),
    };

    try {
        await updateDoc(articleRef, updatePayload);
    } catch (error) {
        console.error('[articleViewer.js] Errore aggiornamento like articolo:', error);
        showToast("Errore nell'aggiornare il like. Riprova.", 'error');
    } finally {
        // Ricarica lo stato dei like per riflettere l'aggiornamento,
        // questo riabiliterà il bottone e aggiornerà l'UI.
        if (articleIdInternal) {
            await loadAndDisplayArticleLikes(articleIdInternal);
        }
    }
}

function closeLikedByListModal() {
    if (likedByModal) {
        likedByModal.style.display = 'none';
    }
    if (likedByModalList) likedByModalList.innerHTML = '';
    if (likedByModalLoading) likedByModalLoading.style.display = 'none';
    if (likedByModalNoLikes) likedByModalNoLikes.style.display = 'none';
}

async function openLikedByListModal(contentId, contentType) {
    if (!likedByModal) {
        console.error('[articleViewer.js] Elemento likedByModal non trovato.');
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
        likedByModalTitle.textContent =
            contentType === 'article' ? "Persone a cui piace l'articolo" : 'Persone a cui piace il commento';
    }
    likedByModal.style.display = 'block';
    await populateLikedByListModal(contentId, contentType);
}

async function populateLikedByListModal(contentId, contentType) {
    if (!likedByModalList || !likedByModalLoading || !likedByModalNoLikes || !db) return;

    try {
        let likedByUsersIds = [];
        const collectionName = contentType === 'article' ? 'articles' : 'articleComments';
        const docRef = doc(db, collectionName, contentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            likedByUsersIds = (contentType === 'article' ? data.likedByUsers : data.likedBy) || [];
        } else {
            console.warn(`[articleViewer.js] Doc non trovato in ${collectionName} ID: ${contentId}`);
            likedByModalList.innerHTML = '<li>Errore: contenuto non trovato.</li>';
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

                let userAvatarSrc = DEFAULT_AVATAR_IMAGE_PATH;
                let userNameDisplay = 'Anonimo';
                const userIdForBlockie = userSnap.id || 'unknownLiker';
                let userProfilePublicUpdatedAt = null;

                if (userSnap.exists()) {
                    const userPublicData = userSnap.data();
                    userNameDisplay = userPublicData.nickname || 'Utente';
                    userProfilePublicUpdatedAt = userPublicData.profilePublicUpdatedAt;

                    // *** MODIFICA CHIAVE: Usa avatarUrls.thumbnail dal profilo pubblico ***
                    if (userPublicData.avatarUrls && userPublicData.avatarUrls.thumbnail) {
                        userAvatarSrc = userPublicData.avatarUrls.thumbnail;
                    } else {
                        userAvatarSrc = generateBlockieAvatar(userSnap.id, 32, { size: 8 });
                    }
                } else {
                    console.warn(`[articleViewer.js] Profilo pubblico (like list) non trovato: ${userSnap.id}`);
                    userAvatarSrc = generateBlockieAvatar(userIdForBlockie, 32, { size: 8 });
                }

                if (
                    userAvatarSrc !== DEFAULT_AVATAR_IMAGE_PATH &&
                    !userAvatarSrc.startsWith('data:image/png;base64') &&
                    userProfilePublicUpdatedAt
                ) {
                    if (userProfilePublicUpdatedAt.seconds) {
                        userAvatarSrc += `?v=${userProfilePublicUpdatedAt.seconds}`;
                    } else if (userProfilePublicUpdatedAt instanceof Date) {
                        userAvatarSrc += `?v=${userProfilePublicUpdatedAt.getTime()}`;
                    }
                }

                avatarImg.src = userAvatarSrc;
                avatarImg.alt = `Avatar di ${userNameDisplay}`;
                avatarImg.onerror = () => {
                    avatarImg.src = DEFAULT_AVATAR_IMAGE_PATH;
                    avatarImg.onerror = null;
                };
                li.appendChild(avatarImg);

                const nameSpan = document.createElement('span');
                nameSpan.className = 'liked-by-name';
                nameSpan.textContent = userNameDisplay;
                li.appendChild(nameSpan);

                if (
                    userSnap.exists() &&
                    userSnap.data().nationalityCode &&
                    userSnap.data().nationalityCode !== 'OTHER'
                ) {
                    const userPublicData = userSnap.data(); // Rileggi per sicurezza, o usa quella già letta
                    const flagSpan = document.createElement('span');
                    flagSpan.className = `fi fi-${userPublicData.nationalityCode.toLowerCase()}`;
                    flagSpan.title = userPublicData.nationalityCode;
                    flagSpan.style.marginLeft = '8px';
                    li.appendChild(flagSpan);
                }
                likedByModalList.appendChild(li);
            });
        }
    } catch (error) {
        console.error(`[articleViewer.js] Errore popola lista "Liked By":`, error);
        likedByModalList.innerHTML = '<li>Errore caricamento lista.</li>';
    } finally {
        if (likedByModalLoading) likedByModalLoading.style.display = 'none';
    }
}

// --- INIZIALIZZAZIONE ---
document.addEventListener('DOMContentLoaded', () => {
    // ... (tutte le tue assegnazioni DOM esistenti qui)
    articleLikeInteractionWrapper = document.getElementById('articleLikeInteractionWrapper');
    if (!articleLikeInteractionWrapper) {
        console.error("[AV - DOMContentLoaded] Elemento #articleLikeInteractionWrapper NON TROVATO!");
    }
    
    likeArticleButton = document.getElementById('likeArticleButton');
    if (likeArticleButton && !likeArticleButton.hasAttribute('data-listener-attached')) {
        likeArticleButton.addEventListener('click', handleArticleLike);
        likeArticleButton.setAttribute('data-listener-attached', 'true');
    }
    
    articleDisplayLoading = document.getElementById('articleDisplayLoading');
    articleContentContainer = document.getElementById('articleContentContainer');
    articleDisplayTitle = document.getElementById('articleDisplayTitle');
    articleDisplayDate = document.getElementById('articleDisplayDate');
    articleDisplayAuthor = document.getElementById('articleDisplayAuthor'); // Riassegna qui se non globale
    articleDisplayTagsContainer = document.getElementById('articleDisplayTagsContainer');
    articleDisplayContent = document.getElementById('articleDisplayContent');
    articleInteractionsSection = document.getElementById('articleInteractions');
    articleLikeCountSpan = document.getElementById('articleLikeCount');
    commentsListDiv = document.getElementById('articleCommentsList');
    articleCommentFormContainer = document.getElementById('articleCommentFormContainer');
    articleCommentForm = document.getElementById('articleCommentForm');
    if (articleCommentForm && !articleCommentForm.hasAttribute('data-listener-attached')) { // Aggiunto controllo listener
        articleCommentForm.addEventListener('submit', handleArticleCommentSubmit);
        articleCommentForm.setAttribute('data-listener-attached', 'true');
    }
    articleCommentMessageInput = document.getElementById('articleCommentMessage');
    submitArticleCommentBtn = document.getElementById('submitArticleCommentBtn');
    articleLoginToCommentMessage = document.getElementById('articleLoginToCommentMessage'); // Se non definito globalmente

    // Modale Liked By
    likedByModal = document.getElementById('likedByModal');
    closeLikedByModalBtn = document.getElementById('closeLikedByModalBtn');
    likedByModalTitle = document.getElementById('likedByModalTitle');
    likedByModalList = document.getElementById('likedByModalList');
    likedByModalLoading = document.getElementById('likedByModalLoading');
    likedByModalNoLikes = document.getElementById('likedByModalNoLikes');

    if (closeLikedByModalBtn) closeLikedByModalBtn.addEventListener('click', closeLikedByListModal);
    if (likedByModal) {
        likedByModal.addEventListener('click', (event) => {
            if (event.target === likedByModal) closeLikedByListModal();
        });
    }

    // Pulsanti Share
    articleShareSection = document.getElementById('articleShareSection');
    nativeShareBtn = document.getElementById('nativeShareBtn');
    copyLinkBtn = document.getElementById('copyLinkBtn');
    fallbackShareButtonsDiv = document.getElementById('fallbackShareButtons');
    shareToXBtn = document.getElementById('shareToX');
    shareToFacebookBtn = document.getElementById('shareToFacebook');
    shareToLinkedInBtn = document.getElementById('shareToLinkedIn');
    shareToWhatsAppBtn = document.getElementById('shareToWhatsApp');
    shareViaEmailBtn = document.getElementById('shareViaEmail');


    const urlParams = new URLSearchParams(window.location.search);
    articleIdInternal = urlParams.get('id'); // Imposta l'ID articolo a livello di modulo

    if (!db) {
        console.error("Firebase DB non inizializzato in articleViewer.js");
        if (articleDisplayLoading) articleDisplayLoading.style.display = 'none';
        if (articleDisplayContent) articleDisplayContent.innerHTML = "<p>Errore critico: connessione al database fallita.</p>";
        return;
    }

    if (!articleIdInternal) {
        if (articleDisplayLoading) articleDisplayLoading.style.display = 'none';
        if (articleDisplayTitle) articleDisplayTitle.textContent = 'Articolo Non Specificato';
        if (articleDisplayContent) articleDisplayContent.innerHTML = "<p>Nessun articolo specificato nell'URL. Controlla il link.</p>";
        if (articleContentContainer) articleContentContainer.style.display = 'block';
        if (articleInteractionsSection) articleInteractionsSection.style.display = 'none';
        if (articleShareSection) articleShareSection.style.display = 'none';
        return;
    }
    
    loadAndDisplayArticleFromFirestore(articleIdInternal); // Carica l'articolo principale

    onAuthStateChanged(auth, (user) => {
        console.log('[articleViewer.js] Auth state changed. User:', user ? user.uid : 'Nessuno');
        // Aggiorna l'UI del form commenti in base allo stato di login
        updateArticleCommentFormUI(user); 
        
        // Ricarica i like e i commenti perché lo stato di "liked" potrebbe essere cambiato
        // e la possibilità di mettere like/commentare dipende dall'utente
        if (articleIdInternal) {
            loadAndDisplayArticleLikes(articleIdInternal); 
            loadArticleComments(); // Ricarica i commenti per aggiornare lo stato dei like sui commenti
            if (currentArticleData) { // Assicurati che currentArticleData sia definito
                 setupShareButtons(); // Aggiorna i pulsanti di condivisione (se necessario in base all'utente)
            }
        }
    });
});