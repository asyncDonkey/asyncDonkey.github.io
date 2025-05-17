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
    serverTimestamp,
    doc,
    updateDoc,
    getDoc,
    increment,
    arrayUnion,
    arrayRemove,
    Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@5.0.1/lib/marked.esm.js';
import { showToast } from './toastNotifications.js';

const INITIAL_COMMENT_LIKE_EMOJI = '🤍';
const LIKED_COMMENT_EMOJI = '💙';

let articleIdInternal = null;
let currentArticleData = null;

// Riferimenti DOM principali (verranno assegnati in DOMContentLoaded)
let articleDisplayLoading,
    articleContentContainer,
    articleDisplayTitle,
    articleDisplayDate,
    articleDisplayAuthor,
    articleDisplayTagsContainer,
    articleDisplayContent,
    articleInteractionsSection,
    likeArticleButton,
    articleLikeCountSpan,
    commentsListDiv,
    articleCommentFormContainer,
    articleCommentForm,
    articleCommentMessageInput,
    submitArticleCommentBtn,
    articleLoginToCommentMessage;

let likedByModal, closeLikedByModalBtn, likedByModalTitle, likedByModalList, likedByModalLoading, likedByModalNoLikes;
let articleLikeCountClickListenerFunction = null;

let articleShareSection,
    nativeShareBtn,
    copyLinkBtn,
    fallbackShareButtonsDiv,
    shareToXBtn,
    shareToFacebookBtn,
    shareToLinkedInBtn,
    shareToWhatsAppBtn,
    shareViaEmailBtn;

// Funzioni di formattazione e utility (invariate rispetto alla tua versione)
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
    // ... (corpo della funzione come nella tua ultima versione, senza modifiche qui)
    // Assicurati che all'interno di questa funzione, prima di chiamare loadArticleComments o setupShareButtons,
    // la variabile currentArticleData sia stata effettivamente popolata se docSnap.exists().
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
                const displayDate = articleDataFromDb.publishedAt || articleDataFromDb.createdAt;
                articleDisplayDate.textContent = formatArticleDateForViewer(displayDate);
            }
            if (articleDisplayAuthor) {
    articleDisplayAuthor.innerHTML = ''; // Pulisci prima
    if (articleDataFromDb.authorId) {
        const authorLink = document.createElement('a');
        authorLink.href = `profile.html?userId=${articleDataFromDb.authorId}`;
        authorLink.textContent = articleDataFromDb.authorName || 'Autore Sconosciuto';
        // authorLink.classList.add('user-profile-link'); // Stile opzionale
        articleDisplayAuthor.appendChild(authorLink);
    } else {
        articleDisplayAuthor.textContent = articleDataFromDb.authorName || 'N/D';
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

/**
 * Aggiorna la visibilità del form commenti e del messaggio di login.
 * @param {firebase.User|null} user - L'utente Firebase autenticato o null.
 */
function updateArticleCommentFormUI(user) {
    // Assicurati che i riferimenti DOM siano validi PRIMA di usarli.
    // Questa funzione potrebbe essere chiamata da onAuthStateChanged prima che DOMContentLoaded completi l'assegnazione.
    const currentFormContainer = document.getElementById('articleCommentFormContainer');
    let currentLoginMessage = document.getElementById('articleLoginToCommentMessage');
    const nameSectionLegacy = document.getElementById('articleCommentNameSection');

    // Se il messaggio di login non esiste e il container del form sì, crea il messaggio
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

    // Ora procedi con la logica di visualizzazione
    if (currentFormContainer && currentLoginMessage) {
        if (user) {
            // Utente Loggato
            currentFormContainer.style.display = 'block';
            currentLoginMessage.style.display = 'none';
            if (nameSectionLegacy) {
                // Nascondi la vecchia sezione nome se presente
                nameSectionLegacy.style.display = 'none';
                const nameInput = document.getElementById('articleCommentName');
                if (nameInput) nameInput.required = false;
            }
        } else {
            // Utente Non Loggato
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
    } else {
        // Se i contenitori principali non sono ancora pronti, non fare nulla.
        // Verranno gestiti quando DOMContentLoaded li definisce e chiama di nuovo questa funzione.
        // console.warn('[articleViewer] updateArticleCommentFormUI chiamata prima che i container fossero pronti.');
    }
}

async function handleArticleCommentSubmit(event) {
    event.preventDefault();
    // I riferimenti DOM articleCommentMessageInput e submitArticleCommentBtn sono globali al modulo
    // e dovrebbero essere stati inizializzati in DOMContentLoaded.
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
        await loadArticleComments(); // Ricarica i commenti per visualizzare quello nuovo
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
    // ... (invariato rispetto alla tua ultima versione)
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
            console.error('Commento non trovato:', commentId);
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
                // Doppia verifica
                button.disabled = false;
                return;
            }
            if ((commentData.likes || 0) <= 0) newLikesCountOp = increment(0); // Non andare sotto zero
        }
        await updateDoc(commentRef, { likes: newLikesCountOp, likedBy: userArrayUpdateOp });
        const updatedCommentSnap = await getDoc(commentRef); // Rileggi per UI
        if (updatedCommentSnap.exists()) {
            const updatedCommentData = updatedCommentSnap.data();
            const currentLikesCount = updatedCommentData.likes || 0;
            const userNowHasLiked = updatedCommentData.likedBy && updatedCommentData.likedBy.includes(currentUser.uid);
            const likeCountSpanInsideButton = button.querySelector('.like-count');
            if (likeCountSpanInsideButton) {
                likeCountSpanInsideButton.textContent = currentLikesCount;
            }
            const emojiNode = button.childNodes[0]; // Assumendo che emoji sia il primo nodo di testo
            if (emojiNode && emojiNode.nodeType === Node.TEXT_NODE) {
                emojiNode.nodeValue = `${userNowHasLiked ? LIKED_COMMENT_EMOJI : INITIAL_COMMENT_LIKE_EMOJI} `;
            }
            if (userNowHasLiked) {
                button.classList.add('liked');
                button.title = 'Togli il like a questo commento';
            } else {
                button.classList.remove('liked');
                button.title = 'Metti like a questo commento';
            }
        }
        button.disabled = false;
    } catch (error) {
        console.error('Errore like/unlike commento articolo:', error);
        showToast('Si è verificato un errore durante il like/unlike del commento. Riprova.', 'error');
        button.disabled = false;
        if (commentsListDiv && articleIdInternal) await loadArticleComments(); // Ricarica in caso di errore per UI consistente
    }
}

async function loadArticleComments() {
    // ... (invariato rispetto alla tua ultima versione)
    if (!commentsListDiv || !articleIdInternal) {
        if (commentsListDiv) commentsListDiv.innerHTML = '<p>Impossibile caricare i commenti.</p>';
        return;
    }
    commentsListDiv.innerHTML = '<p>Caricamento commenti...</p>';
    try {
        const commentsCollectionRef = collection(db, 'articleComments');
        const q = query(
            commentsCollectionRef,
            where('articleId', '==', articleIdInternal),
            orderBy('timestamp', 'desc'),
            limit(25)
        );
        const querySnapshot = await getDocs(q);
        commentsListDiv.innerHTML = '';
        if (querySnapshot.empty) {
            commentsListDiv.innerHTML = '<p>Nessun commento. Sii il primo!</p>';
            return;
        }
        const currentUser = auth.currentUser;
        querySnapshot.forEach((docSnapshot) => {
            const commentData = docSnapshot.data();
            const commentId = docSnapshot.id;
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment-item');
            const avatarImg = document.createElement('img');
            avatarImg.classList.add('comment-avatar-img');
            const seedForBlockie = commentData.userId || commentData.userName || `anon-articlecomment-${commentId}`;
            avatarImg.src = generateBlockieAvatar(seedForBlockie, 40, { size: 8 });
            avatarImg.alt = 'Avatar';
            commentElement.appendChild(avatarImg);
            const commentContentDiv = document.createElement('div');
            commentContentDiv.classList.add('comment-content');
            const nameEl = document.createElement('strong'); // o span, a seconda dello stile desiderato
let commenterNameDisplay = commentData.userName || 'Utente (Dati Profilo Mancanti)';

// Aggiungi la bandierina PRIMA del nome/link, se presente
if (commentData.nationalityCode && commentData.nationalityCode !== 'OTHER') {
    const flagIconSpan = document.createElement('span');
    flagIconSpan.classList.add('fi', `fi-${commentData.nationalityCode.toLowerCase()}`);
    flagIconSpan.style.marginRight = '5px';
    flagIconSpan.style.verticalAlign = 'middle';
    nameEl.appendChild(flagIconSpan); // Aggiungi la bandiera al contenitore del nome
}

if (commentData.userId) { // Se l'ID utente esiste, crea un link
    const userProfileLink = document.createElement('a');
    userProfileLink.href = `profile.html?userId=${commentData.userId}`;
    userProfileLink.textContent = commenterNameDisplay;
    // userProfileLink.classList.add('user-profile-link'); // Aggiungi classe per stile se necessario
    nameEl.appendChild(userProfileLink);
} else { // Altrimenti, solo testo
    nameEl.appendChild(document.createTextNode(commenterNameDisplay));
}
            nameEl.appendChild(document.createTextNode(commenterNameDisplay));
            const dateEl = document.createElement('small');
            dateEl.classList.add('comment-date');
            dateEl.textContent = ` - ${formatCommentTimestamp(commentData.timestamp)}`;
            const messageEl = document.createElement('p');
            messageEl.textContent = commentData.message;
            commentContentDiv.appendChild(nameEl);
            commentContentDiv.appendChild(dateEl);
            commentContentDiv.appendChild(messageEl);
            const commentLikesContainer = document.createElement('div');
            commentLikesContainer.classList.add('likes-container');
            const commentLikeButton = document.createElement('button');
            commentLikeButton.classList.add('like-btn');
            commentLikeButton.setAttribute('data-comment-id', commentId);
            const currentLikes = commentData.likes || 0;
            let userHasLikedThisComment = false;
            if (currentUser && commentData.likedBy && commentData.likedBy.includes(currentUser.uid)) {
                userHasLikedThisComment = true;
            }
            commentLikeButton.innerHTML = `${userHasLikedThisComment ? LIKED_COMMENT_EMOJI : INITIAL_COMMENT_LIKE_EMOJI} <span class="like-count">${currentLikes}</span>`;
            if (userHasLikedThisComment) {
                commentLikeButton.classList.add('liked');
            }
            commentLikeButton.title = userHasLikedThisComment ? 'Togli il like' : 'Metti like';
            commentLikeButton.disabled = !currentUser;
            commentLikeButton.addEventListener('click', handleArticleCommentLike);
            const commentLikeCountSpanInButton = commentLikeButton.querySelector('.like-count');
            if (commentLikeCountSpanInButton) {
                if (currentLikes > 0) {
                    commentLikeCountSpanInButton.classList.add('clickable-comment-like-count');
                    commentLikeCountSpanInButton.title = 'Vedi a chi piace questo commento';
                    commentLikeCountSpanInButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openLikedByListModal(commentId, 'articleComment');
                    });
                } else {
                    commentLikeCountSpanInButton.classList.remove('clickable-comment-like-count');
                    commentLikeCountSpanInButton.style.cursor = 'default';
                    commentLikeCountSpanInButton.style.textDecoration = 'none';
                    commentLikeCountSpanInButton.title = '';
                }
            }
            commentLikesContainer.appendChild(commentLikeButton);
            commentContentDiv.appendChild(commentLikesContainer);
            commentElement.appendChild(commentContentDiv);
            commentsListDiv.appendChild(commentElement);
        });
    } catch (error) {
        console.error(`Errore caricamento commenti:`, error);
        if (commentsListDiv) commentsListDiv.innerHTML = '<p>Errore caricamento commenti.</p>';
    }
}

async function loadAndDisplayArticleLikes(articleId) {
    // ... (invariato rispetto alla tua ultima versione)
    const localArticleLikeCountSpan = document.getElementById('articleLikeCount');
    const localLikeArticleButton = document.getElementById('likeArticleButton');
    if (!localLikeArticleButton || !localArticleLikeCountSpan || !articleId) {
        if (localArticleLikeCountSpan) localArticleLikeCountSpan.textContent = 'N/A';
        if (localLikeArticleButton) {
            localLikeArticleButton.innerHTML = `🤍 Like`;
            localLikeArticleButton.disabled = true;
        }
        return;
    }
    if (articleLikeCountClickListenerFunction && localArticleLikeCountSpan) {
        localArticleLikeCountSpan.removeEventListener('click', articleLikeCountClickListenerFunction);
        articleLikeCountClickListenerFunction = null;
    }
    localArticleLikeCountSpan.style.cursor = 'default';
    localArticleLikeCountSpan.style.textDecoration = 'none';
    localArticleLikeCountSpan.title = '';
    localArticleLikeCountSpan.classList.remove('clickable-like-count');
    const articleRef = doc(db, 'articles', articleId);
    try {
        const docSnap = await getDoc(articleRef);
        if (docSnap.exists()) {
            currentArticleData = docSnap.data();
            const likes = currentArticleData.likeCount || 0;
            const likedByUsers = currentArticleData.likedByUsers || [];
            localArticleLikeCountSpan.textContent = likes;
            if (likes > 0) {
                localArticleLikeCountSpan.classList.add('clickable-like-count');
                localArticleLikeCountSpan.title = 'Vedi a chi piace questo articolo';
                articleLikeCountClickListenerFunction = () => {
                    openLikedByListModal(articleId, 'article');
                };
                localArticleLikeCountSpan.addEventListener('click', articleLikeCountClickListenerFunction);
            }
            const currentUser = auth.currentUser;
            if (currentUser) {
                localLikeArticleButton.disabled = false;
                if (likedByUsers.includes(currentUser.uid)) {
                    localLikeArticleButton.innerHTML = `💙 Liked`;
                    localLikeArticleButton.classList.add('liked');
                    localLikeArticleButton.title = 'Unlike this article';
                } else {
                    localLikeArticleButton.innerHTML = `🤍 Like`;
                    localLikeArticleButton.classList.remove('liked');
                    localLikeArticleButton.title = 'Like this article';
                }
            } else {
                localLikeArticleButton.innerHTML = `🤍 Like`;
                localLikeArticleButton.disabled = true;
                localLikeArticleButton.title = 'Login to like this article';
                localLikeArticleButton.classList.remove('liked');
            }
        } else {
            console.warn(`Articolo ${articleId} non trovato per likes.`);
            if (localArticleLikeCountSpan) localArticleLikeCountSpan.textContent = '0';
            if (localLikeArticleButton) {
                localLikeArticleButton.innerHTML = `🤍 Like`;
                localLikeArticleButton.disabled = true;
            }
            currentArticleData = { title: 'Articolo non trovato', status: 'not_found' };
        }
    } catch (error) {
        console.error('Errore caricamento likes articolo:', error);
        if (localArticleLikeCountSpan) localArticleLikeCountSpan.textContent = 'Err';
        if (localLikeArticleButton) {
            localLikeArticleButton.disabled = true;
            localLikeArticleButton.innerHTML = `🤍 Like`;
        }
        currentArticleData = null;
    }
}

async function handleArticleLike() {
    // ... (invariato rispetto alla tua ultima versione)
    if (!articleIdInternal || !auth.currentUser) {
        showToast('Devi essere loggato per mettere like.', 'error');
        return;
    }
    const localLikeArticleButton = document.getElementById('likeArticleButton');
    if (!localLikeArticleButton) {
        console.error('Bottone Like articolo non trovato nel DOM.');
        return;
    }
    if (!currentArticleData || !Object.prototype.hasOwnProperty.call(currentArticleData, 'likeCount')) {
        showToast('Dati articolo non completamente caricati. Riprova tra un momento.', 'warning');
        if (articleIdInternal) await loadAndDisplayArticleLikes(articleIdInternal);
        if (!currentArticleData || !Object.prototype.hasOwnProperty.call(currentArticleData, 'likeCount')) return;
    }

    localLikeArticleButton.disabled = true;
    const articleRef = doc(db, 'articles', articleIdInternal);
    const userId = auth.currentUser.uid;
    const userHasLiked = currentArticleData.likedByUsers && currentArticleData.likedByUsers.includes(userId);
    let likeUpdateOperation = userHasLiked ? increment(-1) : increment(1);
    let userArrayUpdateOperation = userHasLiked ? arrayRemove(userId) : arrayUnion(userId);
    if (userHasLiked && (currentArticleData.likeCount || 0) <= 0) {
        if ((currentArticleData.likeCount || 0) <= 0) likeUpdateOperation = increment(0);
    }
    const updatePayload = {
        likeCount: likeUpdateOperation,
        likedByUsers: userArrayUpdateOperation,
        updatedAt: serverTimestamp(),
    };
    try {
        await updateDoc(articleRef, updatePayload);
    } catch (error) {
        console.error('Errore aggiornamento like articolo:', error);
        showToast("Errore nell'aggiornare il like. Riprova.", 'error');
    } finally {
        if (articleIdInternal) {
            await loadAndDisplayArticleLikes(articleIdInternal);
        }
    }
}

function closeLikedByListModal() {
    // ... (invariato rispetto alla tua ultima versione)
    if (likedByModal) {
        likedByModal.style.display = 'none';
    }
    if (likedByModalList) likedByModalList.innerHTML = '';
    if (likedByModalLoading) likedByModalLoading.style.display = 'none';
    if (likedByModalNoLikes) likedByModalNoLikes.style.display = 'none';
}

async function openLikedByListModal(contentId, contentType) {
    // ... (invariato rispetto alla tua ultima versione)
    if (!likedByModal) {
        console.error('Elemento likedByModal non trovato.');
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
    // ... (invariato rispetto alla tua ultima versione)
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
            console.warn(`Doc non trovato in ${collectionName} ID: ${contentId}`);
            likedByModalList.innerHTML = '<li>Errore: contenuto non trovato.</li>';
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
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    const li = document.createElement('li');
                    const avatarImg = document.createElement('img');
                    avatarImg.className = 'liked-by-avatar';
                    avatarImg.src = generateBlockieAvatar(userSnap.id, 32, { size: 8 });
                    avatarImg.alt = `Avatar di ${userData.nickname || 'Utente'}`;
                    li.appendChild(avatarImg);
                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'liked-by-name';
                    nameSpan.textContent = userData.nickname || 'Anonimo';
                    li.appendChild(nameSpan);
                    if (userData.nationalityCode && userData.nationalityCode !== 'OTHER') {
                        const flagSpan = document.createElement('span');
                        flagSpan.className = `fi fi-${userData.nationalityCode.toLowerCase()}`;
                        flagSpan.title = userData.nationalityCode;
                        li.appendChild(flagSpan);
                    }
                    likedByModalList.appendChild(li);
                } else {
                    console.warn(`Profilo utente non trovato: ${userSnap.id}`);
                    const li = document.createElement('li');
                    const avatarImg = document.createElement('img');
                    avatarImg.className = 'liked-by-avatar';
                    avatarImg.src = generateBlockieAvatar(userSnap.id || 'unknownUser', 32, { size: 8 });
                    avatarImg.alt = 'Avatar Utente Sconosciuto';
                    li.appendChild(avatarImg);
                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'liked-by-name';
                    nameSpan.textContent = 'Utente (profilo non disp.)';
                    li.appendChild(nameSpan);
                    likedByModalList.appendChild(li);
                }
            });
        }
    } catch (error) {
        console.error(`Errore popola lista "Liked By":`, error);
        likedByModalList.innerHTML = '<li>Errore caricamento lista.</li>';
    } finally {
        if (likedByModalLoading) likedByModalLoading.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Assegnazione riferimenti DOM
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
    // Se articleLoginToCommentMessage non esiste, crealo dinamicamente e inseriscilo
    if (!articleLoginToCommentMessage && articleCommentFormContainer && articleCommentFormContainer.parentNode) {
        articleLoginToCommentMessage = document.createElement('div');
        articleLoginToCommentMessage.id = 'articleLoginToCommentMessage';
        articleLoginToCommentMessage.style.padding = '15px';
        articleLoginToCommentMessage.style.textAlign = 'center';
        articleLoginToCommentMessage.style.backgroundColor = 'var(--surface-bg-secondary)';
        articleLoginToCommentMessage.style.borderRadius = '4px';
        articleLoginToCommentMessage.style.marginTop = '10px';
        articleLoginToCommentMessage.innerHTML = `<p>Devi essere <a href="#" id="loginLinkFromArticleComment" style="color: var(--link-color); text-decoration: underline;">loggato</a> per lasciare un commento.</p>`;
        // Inserisci il messaggio prima del contenitore del form dei commenti
        articleCommentFormContainer.parentNode.insertBefore(articleLoginToCommentMessage, articleCommentFormContainer);
    }
    // Nascondi la sezione del nome (legacy) se ancora presente nell'HTML
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
        // Rinominato per evitare conflitto di scope se essentialElements fosse globale
        articleContentContainer,
        articleDisplayTitle,
        articleDisplayDate,
        articleDisplayAuthor,
        articleDisplayTagsContainer,
        articleDisplayContent,
        articleDisplayLoading,
        articleInteractionsSection,
        likeArticleButton,
        articleLikeCountSpan,
        commentsListDiv,
        articleCommentFormContainer,
        articleCommentForm, // articleCommentNameSection non è più essenziale qui
        likedByModal,
        closeLikedByModalBtn,
        likedByModalTitle,
        likedByModalList,
        likedByModalLoading,
        likedByModalNoLikes,
        articleShareSection,
        nativeShareBtn,
        copyLinkBtn,
    ];

    if (essentialElementsCheck.some((el) => !el)) {
        console.error('Uno o più Elementi DOM essenziali per view-article.html sono mancanti.');
        // ... (gestione errore come prima)
        return;
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

    updateArticleCommentFormUI(auth.currentUser); // Chiamata iniziale allo stato corrente
    loadAndDisplayArticleFromFirestore(articleIdInternal);

    onAuthStateChanged(auth, (user) => {
        console.log('[articleViewer] Auth state changed. User:', user ? user.uid : null);
        updateArticleCommentFormUI(user);
        if (articleIdInternal) {
            loadAndDisplayArticleLikes(articleIdInternal); // Ricarica per aggiornare stato like pulsante articolo
            loadArticleComments(); // Ricarica per aggiornare stato like pulsanti commenti e UI generale
            if (currentArticleData) setupShareButtons(); // Imposta di nuovo i pulsanti condivisione
        }
    });
});
