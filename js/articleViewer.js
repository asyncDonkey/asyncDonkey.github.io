// js/articleViewer.js
import { db, auth, generateBlockieAvatar } from './main.js';
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
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
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

            let authorNameForDisplay = articleDataFromDb.authorName || 'Autore Sconosciuto'; // Denormalized on article
            let authorAvatarSrc = DEFAULT_AVATAR_IMAGE_PATH;
            const authorActualAvatarElement = document.getElementById('authorActualAvatar');
            let authorProfilePublicUpdatedAt = null;

            if (articleDataFromDb.authorId) {
                try {
                    // *** MODIFICA CHIAVE: Leggi da userPublicProfiles per l'autore ***
                    const authorPublicProfileRef = doc(db, 'userPublicProfiles', articleDataFromDb.authorId);
                    const authorPublicProfileSnap = await getDoc(authorPublicProfileRef);

                    if (authorPublicProfileSnap.exists()) {
                        const authorPublicData = authorPublicProfileSnap.data();
                        authorNameForDisplay = authorPublicData.nickname || authorNameForDisplay; // Preferisci nickname dal profilo pubblico
                        authorProfilePublicUpdatedAt = authorPublicData.profilePublicUpdatedAt;

                        // *** MODIFICA CHIAVE: Usa avatarUrls.thumbnail ***
                        if (authorPublicData.avatarUrls && authorPublicData.avatarUrls.thumbnail) {
                            authorAvatarSrc = authorPublicData.avatarUrls.thumbnail;
                        } else { 
                            console.log(
                                `Nessun URL avatar.thumbnail trovato nel profilo pubblico per autore ${articleDataFromDb.authorId}, genero Blockie.`
                            );
                            authorAvatarSrc = generateBlockieAvatar(articleDataFromDb.authorId, 48);
                        }
                    } else {
                        console.warn(`Profilo pubblico autore non trovato (ID: ${articleDataFromDb.authorId}), genero Blockie se authorId esiste, altrimenti uso default.`);
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
                } else if (authorProfilePublicUpdatedAt instanceof Date) { // Fallback se è già un oggetto Date JS
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
                articleDisplayAuthor.innerHTML = '';
                if (articleDataFromDb.authorId) {
                    const authorLink = document.createElement('a');
                    authorLink.href = `profile.html?userId=${articleDataFromDb.authorId}`;
                    authorLink.textContent = authorNameForDisplay;
                    articleDisplayAuthor.appendChild(authorLink);
                } else {
                    articleDisplayAuthor.textContent = authorNameForDisplay;
                }
            }

            if (articleDisplayTagsContainer) {
                articleDisplayTagsContainer.innerHTML = '';
                if (
                    articleDataFromDb.tags &&
                    Array.isArray(articleDataFromDb.tags) &&
                    articleDataFromDb.tags.length > 0
                ) {
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
                        articleDisplayContent.textContent = articleDataFromDb.contentMarkdown;
                    }
                } else {
                    articleDisplayContent.innerHTML = '<p>Contenuto non disponibile.</p>';
                }
            }

            if (articleContentContainer) articleContentContainer.style.display = 'block';
            if (articleInteractionsSection) articleInteractionsSection.style.display = 'block';

            setupShareButtons();
            await loadAndDisplayArticleLikes(articleId);
            await loadArticleComments();

            if (likeArticleButton && !likeArticleButton.hasAttribute('data-listener-attached')) {
                likeArticleButton.addEventListener('click', handleArticleLike);
                likeArticleButton.setAttribute('data-listener-attached', 'true');
            }
            if (articleCommentForm && !articleCommentForm.hasAttribute('data-listener-attached')) {
                articleCommentForm.addEventListener('submit', handleArticleCommentSubmit);
                articleCommentForm.setAttribute('data-listener-attached', 'true');
            }
        } else {
            let message = `<p>Spiacenti, articolo ID "${articleId}" non trovato o non pubblicato.`;
            if (docSnap.exists() && docSnap.data().status !== 'published') {
                message = `<p>Spiacenti, l'articolo ID "${articleId}" non è attualmente pubblicato.`;
            }
            message += ` Torna alla <a href='index.html#articlesSection'>lista articoli</a>.</p>`;
            if (articleContentContainer) articleContentContainer.style.display = 'block';
            if (articleDisplayTitle) articleDisplayTitle.textContent = 'Articolo Non Trovato';
            if (articleDisplayContent) articleDisplayContent.innerHTML = message;
            if (articleInteractionsSection) articleInteractionsSection.style.display = 'none';
            if (articleShareSection) articleShareSection.style.display = 'none';
            document.title = 'Articolo Non Trovato - asyncDonkey.io';
            currentArticleData = null;
        }
    } catch (error) {
        console.error('Errore caricamento articolo:', error);
        if (articleContentContainer) articleContentContainer.style.display = 'block';
        if (articleDisplayTitle) articleDisplayTitle.textContent = 'Errore Caricamento';
        if (articleDisplayContent)
            articleDisplayContent.innerHTML = "<p>Errore nel caricamento dell'articolo. Riprova più tardi.</p>";
        if (articleInteractionsSection) articleInteractionsSection.style.display = 'none';
        if (articleShareSection) articleShareSection.style.display = 'none';
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
            if (articleDisplayContent)
                articleDisplayContent.innerHTML += '<p style="color:orange;">Indice Firestore mancante.</p>';
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

async function handleArticleCommentLike(event) {
    const button = event.currentTarget;
    const commentId = button.dataset.commentId;
    const currentUser = auth.currentUser;

    if (!commentId || !currentUser) {
        showToast('Devi essere loggato per mettere like ai commenti.', 'error');
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
            if (!likedByUsers.includes(currentUser.uid)) {
                button.disabled = false; return;
            }
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
                if (oldListener) {
                    commentLikeCountSpanInButton.removeEventListener('click', oldListener);
                }
                if (currentLikesCount > 0) {
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

async function loadArticleComments() {
    if (!commentsListDiv || !articleIdInternal) {
        if(commentsListDiv) commentsListDiv.innerHTML = '<p>Impossibile caricare i commenti (ID articolo mancante).</p>';
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
            limit(25)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            commentsListDiv.innerHTML = '<p>Nessun commento. Sii il primo!</p>';
            return;
        }

        const commenterIdsToFetch = [...new Set(querySnapshot.docs.map((docSnap) => docSnap.data().userId).filter((id) => id))];
        const commenterPublicProfilesMap = new Map();

        if (commenterIdsToFetch.length > 0) {
            const MAX_IDS_PER_IN_QUERY = 30;
            const profilePromises = [];
            for (let i = 0; i < commenterIdsToFetch.length; i += MAX_IDS_PER_IN_QUERY) {
                const batchUserIds = commenterIdsToFetch.slice(i, i + MAX_IDS_PER_IN_QUERY);
                // *** MODIFICA CHIAVE: Query su userPublicProfiles ***
                const profilesQuery = query(collection(db, 'userPublicProfiles'), where(documentId(), 'in', batchUserIds));
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
                console.error('[articleViewer.js] Errore recupero batch profili pubblici commentatori:', profileError);
            }
        }

        commentsListDiv.innerHTML = '';
        querySnapshot.forEach((docSnapshot) => {
            const commentData = docSnapshot.data(); // Dati denormalizzati dal commento stesso
            const commentId = docSnapshot.id;
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment-item');

            const avatarImg = document.createElement('img');
            avatarImg.classList.add('comment-avatar-img');
            
            let commenterAvatarSrc = DEFAULT_AVATAR_IMAGE_PATH;
            let commenterNameDisplay = commentData.userName || 'Utente Anonimo'; // Priorità al nome denormalizzato sul commento
            let commenterNationalityCode = commentData.nationalityCode || null; // Priorità alla nazionalità denormalizzata
            
            const commenterPublicProfile = commentData.userId ? commenterPublicProfilesMap.get(commentData.userId) : null;
            let commenterProfilePublicUpdatedAt = null;

            if (commenterPublicProfile) {
                commenterNameDisplay = commenterPublicProfile.nickname || commenterNameDisplay; // Sovrascrive se il profilo pubblico ha un nickname
                commenterNationalityCode = commenterPublicProfile.nationalityCode || commenterNationalityCode; // Sovrascrive se il profilo pubblico ha nazionalità
                
                if (commenterPublicProfile.avatarUrls && commenterPublicProfile.avatarUrls.thumbnail) {
                    commenterAvatarSrc = commenterPublicProfile.avatarUrls.thumbnail;
                    commenterProfilePublicUpdatedAt = commenterPublicProfile.profilePublicUpdatedAt;
                } else if (commentData.userId) { // Profilo pubblico trovato ma senza avatar.thumbnail
                    commenterAvatarSrc = generateBlockieAvatar(commentData.userId, 40, { size: 8 });
                }
            } else if (commentData.userId) { // Nessun profilo pubblico trovato, ma c'è un userId
                commenterAvatarSrc = generateBlockieAvatar(commentData.userId, 40, { size: 8 });
            }
            // Se non c'è userId, si usa il DEFAULT_AVATAR_IMAGE_PATH (o un Blockie se si volesse generare per nome)

            if (commenterAvatarSrc !== DEFAULT_AVATAR_IMAGE_PATH && !commenterAvatarSrc.startsWith('data:image/png;base64') && commenterProfilePublicUpdatedAt) {
                if (commenterProfilePublicUpdatedAt.seconds) {
                     commenterAvatarSrc += `?v=${commenterProfilePublicUpdatedAt.seconds}`;
                } else if (commenterProfilePublicUpdatedAt instanceof Date) {
                     commenterAvatarSrc += `?v=${commenterProfilePublicUpdatedAt.getTime()}`;
                }
            }
            
            avatarImg.src = commenterAvatarSrc;
            avatarImg.alt = `Avatar di ${commenterNameDisplay}`;
            avatarImg.onerror = () => {
                avatarImg.src = DEFAULT_AVATAR_IMAGE_PATH;
                avatarImg.onerror = null;
            };
            commentElement.appendChild(avatarImg);

            const commentContentDiv = document.createElement('div');
            commentContentDiv.classList.add('comment-content');

            const nameEl = document.createElement('strong');
            if (commenterNationalityCode && commenterNationalityCode !== 'OTHER') {
                const flagIconSpan = document.createElement('span');
                flagIconSpan.classList.add('fi', `fi-${commenterNationalityCode.toLowerCase()}`);
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
            dateEl.classList.add('comment-date'); // ms-2 rimosso, gestito da layout flex
            dateEl.textContent = ` - ${formatCommentTimestamp(commentData.timestamp)}`;
            
            const nameAndDateContainer = document.createElement('div'); // Nuovo container per nome e data
            nameAndDateContainer.style.display = 'flex';
            nameAndDateContainer.style.alignItems = 'baseline';
            nameAndDateContainer.appendChild(nameEl);
            nameAndDateContainer.appendChild(dateEl);

            const messageEl = document.createElement('p');
            messageEl.textContent = commentData.message;
            messageEl.style.marginTop = '4px'; // Aggiunge spazio sopra il messaggio

            commentContentDiv.appendChild(nameAndDateContainer); // Aggiunge container nome+data
            commentContentDiv.appendChild(messageEl);

            const commentLikesContainer = document.createElement('div');
            commentLikesContainer.classList.add('likes-container'); // Assicurati che questa classe esista o aggiungi stile
            commentLikesContainer.style.marginTop = '4px'; // Spazio sopra i like
            const commentLikeButton = document.createElement('button');
            commentLikeButton.classList.add('like-btn');
            commentLikeButton.setAttribute('data-comment-id', commentId);

            const currentLikes = commentData.likes || 0;
            let userHasLikedThisComment = false;
            if (currentUser && commentData.likedBy && commentData.likedBy.includes(currentUser.uid)) {
                userHasLikedThisComment = true;
            }

            const iconName = userHasLikedThisComment ? 'favorite' : 'favorite_border';
            commentLikeButton.innerHTML = `<span class="material-symbols-rounded">${iconName}</span> <span class="like-count">${currentLikes}</span>`;
            commentLikeButton.classList.toggle('liked', userHasLikedThisComment);
            commentLikeButton.title = userHasLikedThisComment ? 'Togli il like' : 'Metti like';
            commentLikeButton.disabled = !currentUser;

            if (!commentLikeButton.hasAttribute('data-listener-attached')) {
                commentLikeButton.addEventListener('click', handleArticleCommentLike);
                commentLikeButton.setAttribute('data-listener-attached', 'true');
            }

            const commentLikeCountSpanInButton = commentLikeButton.querySelector('.like-count');
            if (commentLikeCountSpanInButton) {
                const oldListener = commentLikeCountSpanInButton.handleLikeCountClick;
                if (oldListener) commentLikeCountSpanInButton.removeEventListener('click', oldListener);
                if (currentLikes > 0) {
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
            commentLikesContainer.appendChild(commentLikeButton);
            commentContentDiv.appendChild(commentLikesContainer);
            commentElement.appendChild(commentContentDiv);
            commentsListDiv.appendChild(commentElement);
        });
    } catch (error) {
        console.error(`[articleViewer.js] Errore caricamento commenti:`, error);
        if (commentsListDiv) commentsListDiv.innerHTML = '<p>Errore caricamento commenti.</p>';
    }
}


async function loadAndDisplayArticleLikes(articleId) {
    if (!likeArticleButton || !articleLikeCountSpan || !articleId) {
        if(articleLikeCountSpan) articleLikeCountSpan.textContent = 'N/A';
        if(likeArticleButton) {
            likeArticleButton.innerHTML = `<span class="material-symbols-rounded">favorite_border</span> Like`;
            likeArticleButton.disabled = true;
        }
        return;
    }

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
        const docSnap = await getDoc(articleRef);
        if (docSnap.exists()) {
            currentArticleData = docSnap.data(); 
            const likes = currentArticleData.likeCount || 0;
            const likedByUsers = currentArticleData.likedByUsers || [];
            articleLikeCountSpan.textContent = likes;

            if (likes > 0) {
                articleLikeCountSpan.classList.add('clickable-like-count');
                articleLikeCountSpan.title = 'Vedi a chi piace questo articolo';
                const newListener = () => {
                    openLikedByListModal(articleId, 'article');
                };
                articleLikeCountSpan.addEventListener('click', newListener);
                articleLikeCountClickListenerFunction = newListener;
            }

            const currentUser = auth.currentUser;
            if (currentUser) {
                likeArticleButton.disabled = false;
                const userHasLikedArticle = likedByUsers.includes(currentUser.uid);
                const iconNameArticle = userHasLikedArticle ? 'favorite' : 'favorite_border';
                const buttonTextArticle = userHasLikedArticle ? 'Liked' : 'Like';
                likeArticleButton.innerHTML = `<span class="material-symbols-rounded">${iconNameArticle}</span> ${buttonTextArticle}`;
                likeArticleButton.classList.toggle('liked', userHasLikedArticle);
                likeArticleButton.title = userHasLikedArticle ? 'Unlike this article' : 'Like this article';
            } else {
                likeArticleButton.innerHTML = `<span class="material-symbols-rounded">favorite_border</span> Like`;
                likeArticleButton.disabled = true;
                likeArticleButton.title = 'Login to like this article';
                likeArticleButton.classList.remove('liked');
            }
        } else {
            console.warn(`[articleViewer.js] Articolo ${articleId} non trovato per likes.`);
            if (articleLikeCountSpan) articleLikeCountSpan.textContent = '0';
            if (likeArticleButton) {
                 likeArticleButton.innerHTML = `<span class="material-symbols-rounded">favorite_border</span> Like`;
                 likeArticleButton.disabled = true;
            }
        }
    } catch (error) {
        console.error('[articleViewer.js] Errore caricamento likes articolo:', error);
        if (articleLikeCountSpan) articleLikeCountSpan.textContent = 'Err';
        if (likeArticleButton) {
            likeArticleButton.disabled = true;
            likeArticleButton.innerHTML = `<span class="material-symbols-rounded">favorite_border</span> Like`;
        }
    }
}

async function handleArticleLike() {
    if (!articleIdInternal || !auth.currentUser) {
        showToast('Devi essere loggato per mettere like.', 'error');
        return;
    }
    if (!likeArticleButton) {
        console.error('[articleViewer.js] Bottone Like articolo non trovato nel DOM.');
        return;
    }
    if (!currentArticleData || typeof currentArticleData.likeCount === 'undefined') {
        showToast('Dati articolo non completamente caricati. Riprova tra un momento.', 'warning');
        if (articleIdInternal) await loadAndDisplayArticleLikes(articleIdInternal);
        if (!currentArticleData || typeof currentArticleData.likeCount === 'undefined') return;
    }

    likeArticleButton.disabled = true;

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
                
                if (userAvatarSrc !== DEFAULT_AVATAR_IMAGE_PATH && !userAvatarSrc.startsWith('data:image/png;base64') && userProfilePublicUpdatedAt) {
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

                if (userSnap.exists() && userSnap.data().nationalityCode && userSnap.data().nationalityCode !== 'OTHER') {
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
    articleDisplayLoading = document.getElementById('articleDisplayLoading');
    articleContentContainer = document.getElementById('articleContentContainer');
    articleDisplayTitle = document.getElementById('articleDisplayTitle');
    articleDisplayDate = document.getElementById('articleDisplayDate');
    articleDisplayAuthor = document.getElementById('articleDisplayAuthor');
    articleDisplayTagsContainer = document.getElementById('articleDisplayTagsContainer');
    articleDisplayContent = document.getElementById('articleDisplayContent');
    articleInteractionsSection = document.getElementById('articleInteractions');
    likeArticleButton = document.getElementById('likeArticleButton');
    articleLikeCountSpan = document.getElementById('articleLikeCount');
    commentsListDiv = document.getElementById('articleCommentsList');
    articleCommentFormContainer = document.getElementById('articleCommentFormContainer');
    articleCommentForm = document.getElementById('articleCommentForm');
    articleCommentMessageInput = document.getElementById('articleCommentMessage');
    submitArticleCommentBtn = document.getElementById('submitArticleCommentBtn');

    articleLoginToCommentMessage = document.getElementById('articleLoginToCommentMessage');
    if (!articleLoginToCommentMessage && articleCommentFormContainer && articleCommentFormContainer.parentNode) {
        articleLoginToCommentMessage = document.createElement('div');
        articleLoginToCommentMessage.id = 'articleLoginToCommentMessage';
        articleLoginToCommentMessage.style.padding = '15px';
        articleLoginToCommentMessage.style.textAlign = 'center';
        articleLoginToCommentMessage.style.backgroundColor = 'var(--surface-bg-secondary)';
        articleLoginToCommentMessage.style.borderRadius = '4px';
        articleLoginToCommentMessage.style.marginTop = '10px';
        articleLoginToCommentMessage.innerHTML = `<p>Devi essere <a href="#" id="loginLinkFromArticleComment" style="color: var(--link-color); text-decoration: underline;">loggato</a> per lasciare un commento.</p>`;
        articleCommentFormContainer.parentNode.insertBefore(articleLoginToCommentMessage, articleCommentFormContainer);
    }
    const nameSectionLegacy = document.getElementById('articleCommentNameSection');
    if (nameSectionLegacy) {
        nameSectionLegacy.style.display = 'none';
    }

    likedByModal = document.getElementById('likedByModal');
    closeLikedByModalBtn = document.getElementById('closeLikedByModalBtn');
    likedByModalTitle = document.getElementById('likedByModalTitle');
    likedByModalList = document.getElementById('likedByModalList');
    likedByModalLoading = document.getElementById('likedByModalLoading');
    likedByModalNoLikes = document.getElementById('likedByModalNoLikes');

    articleShareSection = document.getElementById('articleShareSection');
    nativeShareBtn = document.getElementById('nativeShareBtn');
    copyLinkBtn = document.getElementById('copyLinkBtn');
    fallbackShareButtonsDiv = document.getElementById('fallbackShareButtons');
    shareToXBtn = document.getElementById('shareToX');
    shareToFacebookBtn = document.getElementById('shareToFacebook');
    shareToLinkedInBtn = document.getElementById('shareToLinkedIn');
    shareToWhatsAppBtn = document.getElementById('shareToWhatsApp');
    shareViaEmailBtn = document.getElementById('shareViaEmail');

    if (closeLikedByModalBtn) closeLikedByModalBtn.addEventListener('click', closeLikedByListModal);
    if (likedByModal) {
        likedByModal.addEventListener('click', (event) => {
            if (event.target === likedByModal) closeLikedByListModal();
        });
    }

    const essentialElementsCheck = [
        articleContentContainer, articleDisplayTitle, articleDisplayDate, articleDisplayAuthor,
        articleDisplayTagsContainer, articleDisplayContent, articleDisplayLoading,
        articleInteractionsSection, likeArticleButton, articleLikeCountSpan, commentsListDiv,
        articleCommentFormContainer, articleCommentForm, likedByModal, closeLikedByModalBtn,
        likedByModalTitle, likedByModalList, likedByModalLoading, likedByModalNoLikes,
        articleShareSection, nativeShareBtn, copyLinkBtn,
    ];

    if (essentialElementsCheck.some((el) => !el)) {
        console.error('[articleViewer.js] Uno o più Elementi DOM essenziali per view-article.html sono mancanti.');
        // return; // Rimuovi il return per permettere il caricamento dell'articolo anche se alcuni elementi UI minori mancano
    }

    const urlParams = new URLSearchParams(window.location.search);
    articleIdInternal = urlParams.get('id');

    if (!db) {
        if (articleDisplayLoading)
            articleDisplayLoading.innerHTML = '<p>Errore: Connessione al DB non disponibile.</p>';
        return;
    }
    if (!articleIdInternal) {
        if (articleDisplayLoading) articleDisplayLoading.style.display = 'none';
        if (articleDisplayTitle) articleDisplayTitle.textContent = 'Articolo Non Specificato';
        if (articleDisplayContent) articleDisplayContent.innerHTML = '<p>ID articolo non fornito.</p>';
        if (articleShareSection) articleShareSection.style.display = 'none';
        return;
    }

    updateArticleCommentFormUI(auth.currentUser);
    loadAndDisplayArticleFromFirestore(articleIdInternal);

    onAuthStateChanged(auth, (user) => {
        console.log('[articleViewer.js] Auth state changed. User:', user ? user.uid : null);
        updateArticleCommentFormUI(user);
        if (articleIdInternal) {
            loadAndDisplayArticleLikes(articleIdInternal);
            loadArticleComments();
            if (currentArticleData) setupShareButtons();
        }
    });
});