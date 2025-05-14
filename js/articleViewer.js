// js/articleViewer.js
import { db, auth, generateBlockieAvatar } from './main.js';
import {
    collection, addDoc, query, where, orderBy, limit, getDocs,
    serverTimestamp, doc, updateDoc, getDoc, increment,
    arrayUnion, arrayRemove, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const INITIAL_COMMENT_LIKE_EMOJI = '🤍';
const LIKED_COMMENT_EMOJI = '💙';

let articleIdInternal = null;
let currentArticleData = null; // Mantiene i dati dell'articolo corrente letti da Firestore

// Variabili DOM globali per questo modulo
let likeArticleButton, articleLikeCountSpan;
let commentsListDiv, articleCommentMessageInput, articleCommentNameInput, submitArticleCommentBtn;
let articleDisplayLoading, articleContentContainer, articleDisplayTitle, articleDisplayDate,
    articleDisplayAuthor, articleDisplayTagsContainer, articleDisplayContent,
    articleInteractionsSection, articleCommentForm, articleCommentNameSection;

/**
 * Formatta una data per la visualizzazione dell'articolo.
 * @param {object|string|null|undefined} dateInput - Timestamp di Firestore, oggetto {seconds: number, nanoseconds: number}, o stringa data.
 * @returns {string} Data formattata o un messaggio di fallback.
 */
function formatArticleDateForViewer(dateInput) {
    if (!dateInput) return 'Data non disponibile';
    try {
        let date;
        if (dateInput instanceof Timestamp) {
            date = dateInput.toDate();
        } else if (typeof dateInput === 'string') {
            date = new Date(dateInput);
            if (isNaN(date.getTime())) {
                console.warn("Formato stringa data non riconosciuto in formatArticleDateForViewer:", dateInput);
                return "Data invalida";
            }
        } else if (dateInput && typeof dateInput.seconds === 'number' && typeof dateInput.nanoseconds === 'number') {
            date = new Timestamp(dateInput.seconds, dateInput.nanoseconds).toDate();
        } else {
            console.warn("Formato data non gestito in formatArticleDateForViewer:", dateInput);
            return 'Formato data sconosciuto';
        }
        return date.toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
        console.error("Errore formattazione data articolo (viewer):", e, "Input:", dateInput);
        return 'Errore data';
    }
}

/**
 * Formatta un Timestamp di Firestore per i commenti.
 * @param {object} firebaseTimestamp - Oggetto Timestamp di Firestore.
 * @returns {string} Data e ora formattate.
 */
function formatCommentTimestamp(firebaseTimestamp) {
    if (!firebaseTimestamp?.toDate) return 'Data non disponibile';
    try {
        return firebaseTimestamp.toDate().toLocaleString('it-IT', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch (e) { return 'Errore data'; }
}

/**
 * Gestisce il like/unlike a un commento dell'articolo.
 * @param {Event} event - L'evento click.
 */
async function handleArticleCommentLike(event) {
    const button = event.currentTarget;
    const commentId = button.dataset.commentId;
    const currentUser = auth.currentUser;

    if (!commentId || !currentUser) {
        alert("Devi essere loggato per mettere like ai commenti.");
        return;
    }

    button.disabled = true;
    const commentRef = doc(db, "articleComments", commentId);

    try {
        const commentSnap = await getDoc(commentRef);
        if (!commentSnap.exists()) {
            console.error("Commento non trovato:", commentId);
            alert("Errore: commento non trovato.");
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
                  button.disabled = false;
                  return;
             }
             if ((commentData.likes || 0) <= 0) newLikesCountOp = increment(0); 
        }

        await updateDoc(commentRef, {
            likes: newLikesCountOp,
            likedBy: userArrayUpdateOp
        });

        // Aggiorna UI del bottone e conteggio in modo più affidabile
        const updatedCommentSnap = await getDoc(commentRef); // Rileggi sempre i dati aggiornati
        if (updatedCommentSnap.exists()) {
            const updatedCommentData = updatedCommentSnap.data();
            const currentLikesCount = updatedCommentData.likes || 0;
            const userNowHasLiked = updatedCommentData.likedBy && updatedCommentData.likedBy.includes(currentUser.uid);

            button.innerHTML = `${userNowHasLiked ? LIKED_COMMENT_EMOJI : INITIAL_COMMENT_LIKE_EMOJI} <span class="like-count">${currentLikesCount}</span>`;
            if (userNowHasLiked) {
                button.classList.add('liked');
                button.title = "Togli il like a questo commento";
            } else {
                button.classList.remove('liked');
                button.title = "Metti like a questo commento";
            }
        }
        button.disabled = false; // Riabilita solo dopo che tutto è andato a buon fine
    } catch (error) {
        console.error("Errore durante il like/unlike del commento articolo:", error);
        alert("Si è verificato un errore durante il like/unlike del commento. Riprova.");
        button.disabled = false; // Riabilita in caso di errore
        // Considera di ricaricare i commenti per resettare lo stato UI se l'operazione fallisce
        if(commentsListDiv && articleIdInternal) await loadArticleComments();
    }
}

/**
 * Carica e visualizza i commenti per l'articolo corrente.
 */
async function loadArticleComments() {
    if (!commentsListDiv || !articleIdInternal) {
        if (commentsListDiv) commentsListDiv.innerHTML = "<p>Impossibile caricare i commenti (ID articolo o elemento DOM mancante).</p>";
        return;
    }
    commentsListDiv.innerHTML = "<p>Caricamento commenti...</p>";

    try {
        const commentsCollectionRef = collection(db, "articleComments");
        const q = query(
            commentsCollectionRef,
            where("articleId", "==", articleIdInternal),
            orderBy("timestamp", "desc"),
            limit(25)
        );

        const querySnapshot = await getDocs(q);
        commentsListDiv.innerHTML = ''; // Pulisci prima di aggiungere nuovi commenti

        if (querySnapshot.empty) {
            commentsListDiv.innerHTML = "<p>Nessun commento per questo articolo. Sii il primo!</p>";
            return;
        }

        const currentUser = auth.currentUser; // Ottieni l'utente corrente una volta fuori dal ciclo

        querySnapshot.forEach((docSnapshot) => {
            const commentData = docSnapshot.data();
            const commentId = docSnapshot.id;

            const commentElement = document.createElement('div');
            commentElement.classList.add('comment-item');

            const avatarImg = document.createElement('img');
            avatarImg.classList.add('comment-avatar-img');
            const seedForBlockie = commentData.userId || commentData.userName || commentData.name || `anon-comment-${commentId}`;
            avatarImg.src = generateBlockieAvatar(seedForBlockie, 40, { size: 8 });
            avatarImg.alt = "Avatar commentatore";
            commentElement.appendChild(avatarImg);

            const commentContentDiv = document.createElement('div');
            commentContentDiv.classList.add('comment-content');

            const nameEl = document.createElement('strong');
            let commenterNameDisplay = commentData.userId ? (commentData.userName || 'Utente Registrato') : ((commentData.name || 'Anonimo') + " (Ospite)");

            if (commentData.nationalityCode && commentData.nationalityCode !== "OTHER") {
                const flagIconSpan = document.createElement('span');
                flagIconSpan.classList.add('fi', `fi-${commentData.nationalityCode.toLowerCase()}`);
                flagIconSpan.style.marginRight = '5px';
                flagIconSpan.style.verticalAlign = 'middle';
                nameEl.appendChild(flagIconSpan);
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
            commentLikeButton.title = userHasLikedThisComment ? "Togli il like" : "Metti like";
            commentLikeButton.disabled = !currentUser;

            commentLikeButton.addEventListener('click', handleArticleCommentLike);

            commentLikesContainer.appendChild(commentLikeButton);
            commentContentDiv.appendChild(commentLikesContainer);
            commentElement.appendChild(commentContentDiv);
            commentsListDiv.appendChild(commentElement);
        });
    } catch (error) {
        console.error(`Errore caricamento commenti per articolo ${articleIdInternal}:`, error);
        if (commentsListDiv) commentsListDiv.innerHTML = "<p>Errore nel caricamento dei commenti.</p>";
    }
}

/**
 * Gestisce l'invio di un nuovo commento per l'articolo.
 * @param {Event} event - L'evento submit del form.
 */
async function handleArticleCommentSubmit(event) {
    event.preventDefault();
    if (!articleCommentMessageInput || !submitArticleCommentBtn || !articleIdInternal) {
        alert("Errore nel form dei commenti."); return;
    }
    const message = articleCommentMessageInput.value.trim();
    if (!message) {
        alert("Per favore, inserisci un messaggio."); return;
    }
    const user = auth.currentUser;
    let commentDataPayload = {
        articleId: articleIdInternal,
        message: message,
        timestamp: serverTimestamp(),
        likes: 0,
        likedBy: [] // Inizializza sempre likedBy come array vuoto
    };
    if (user) {
        commentDataPayload.userId = user.uid;
        const userProfileRef = doc(db, "userProfiles", user.uid);
        try {
            const docSnap = await getDoc(userProfileRef);
            if (docSnap.exists()) {
                commentDataPayload.userName = docSnap.data().nickname || (user.email ? user.email.split('@')[0] : "Utente Registrato");
                if (docSnap.data().nationalityCode) {
                    commentDataPayload.nationalityCode = docSnap.data().nationalityCode;
                }
            } else {
                commentDataPayload.userName = user.email ? user.email.split('@')[0] : "Utente Registrato";
            }
        } catch (e) {
            console.error("Errore recupero profilo per commento:", e);
            commentDataPayload.userName = user.email ? user.email.split('@')[0] : "Utente Registrato";
        }
    } else {
        const name = articleCommentNameInput ? articleCommentNameInput.value.trim() : '';
        if (!name && articleCommentNameInput && articleCommentNameInput.required) {
            alert("Per favore, inserisci il tuo nome."); return;
        }
        if (name) commentDataPayload.name = name;
    }
    submitArticleCommentBtn.disabled = true;
    submitArticleCommentBtn.textContent = "Invio...";
    try {
        const commentsCollectionRef = collection(db, "articleComments");
        await addDoc(commentsCollectionRef, commentDataPayload);
        if (articleIdInternal) {
            const articleRef = doc(db, "articles", articleIdInternal);
            await updateDoc(articleRef, { commentCount: increment(1) });
        }
        articleCommentMessageInput.value = '';
        if (articleCommentNameInput && !user) articleCommentNameInput.value = '';
        await loadArticleComments(); // Ricarica la lista dei commenti
    } catch (error) {
        console.error("Errore invio commento o aggiornamento conteggio:", error);
        alert("Errore durante l'invio del commento. Riprova.");
    } finally {
        if (submitArticleCommentBtn) {
            submitArticleCommentBtn.disabled = false;
            submitArticleCommentBtn.textContent = "Invia Commento";
        }
    }
}

/**
 * Carica e visualizza lo stato dei like per l'articolo corrente.
 * @param {string} articleId L'ID dell'articolo.
 */
async function loadAndDisplayArticleLikes(articleId) {
    if (!likeArticleButton || !articleLikeCountSpan || !articleId) {
        if(articleLikeCountSpan) articleLikeCountSpan.textContent = "N/A";
        if(likeArticleButton) { likeArticleButton.innerHTML = `🤍 Like`; likeArticleButton.disabled = true; }
        return;
    }
    const articleRef = doc(db, "articles", articleId);
    try {
        const docSnap = await getDoc(articleRef);
        if (docSnap.exists()) {
            // Aggiorna currentArticleData con i dati freschi da Firestore
            currentArticleData = docSnap.data(); 
            const likes = currentArticleData.likeCount || 0;
            const likedByUsers = currentArticleData.likedByUsers || [];
            articleLikeCountSpan.textContent = likes;
            const currentUser = auth.currentUser;
            if (currentUser) {
                likeArticleButton.disabled = false;
                if (likedByUsers.includes(currentUser.uid)) {
                    likeArticleButton.innerHTML = `💙 Liked`;
                    likeArticleButton.classList.add('liked');
                    likeArticleButton.title = "Unlike this article";
                } else {
                    likeArticleButton.innerHTML = `🤍 Like`;
                    likeArticleButton.classList.remove('liked');
                    likeArticleButton.title = "Like this article";
                }
            } else {
                likeArticleButton.innerHTML = `🤍 Like`;
                likeArticleButton.disabled = true;
                likeArticleButton.title = "Login to like this article";
                likeArticleButton.classList.remove('liked');
            }
        } else {
            console.warn(`Articolo ${articleId} non trovato in Firestore per likes. Usando fallback.`);
            articleLikeCountSpan.textContent = "0";
            likeArticleButton.innerHTML = `🤍 Like`;
            likeArticleButton.disabled = true;
            // Imposta un fallback per currentArticleData se l'articolo non esiste
            currentArticleData = { title: "Articolo non trovato", content: "", likeCount: 0, likedByUsers: [], commentCount: 0, status: "not_found" };
        }
    } catch (error) {
        console.error("Errore caricamento likes articolo:", error);
        articleLikeCountSpan.textContent = "Err";
        likeArticleButton.disabled = true;
        likeArticleButton.innerHTML = `🤍 Like`;
        currentArticleData = null; // Indica che i dati non sono stati caricati correttamente
    }
}

/**
 * Gestisce il like/unlike all'articolo.
 */
async function handleArticleLike() {
    if (!articleIdInternal || !auth.currentUser) {
        alert("Devi essere loggato per mettere like agli articoli.");
        return;
    }
    // Assicurati che currentArticleData sia stato caricato da Firestore
    if (!currentArticleData || !currentArticleData.hasOwnProperty('likeCount')) { 
        alert("I dati dell'articolo non sono stati caricati correttamente. Riprova a caricare la pagina.");
        // Prova a ricaricare i dati dell'articolo prima di uscire, se non sono validi
        if (articleIdInternal) await loadAndDisplayArticleFromFirestore(articleIdInternal);
        if (!currentArticleData || !currentArticleData.hasOwnProperty('likeCount')) return; // Esci se ancora non validi
    }
    if (!likeArticleButton) {
        console.error("handleArticleLike: likeArticleButton non è inizializzato.");
        return;
    }

    likeArticleButton.disabled = true;
    const articleRef = doc(db, "articles", articleIdInternal);
    const userId = auth.currentUser.uid;
    
    // Usa i dati freschi da currentArticleData, che dovrebbero essere stati aggiornati da loadAndDisplayArticleLikes
    const userHasLiked = currentArticleData.likedByUsers && currentArticleData.likedByUsers.includes(userId);

    let likeUpdateOperation = userHasLiked ? increment(-1) : increment(1);
    let userArrayUpdateOperation = userHasLiked ? arrayRemove(userId) : arrayUnion(userId);

    if (userHasLiked && (currentArticleData.likeCount || 0) <= 0) {
        if ((currentArticleData.likeCount || 0) <= 0) likeUpdateOperation = increment(0); 
    }

    const updatePayload = {
        likeCount: likeUpdateOperation,
        likedByUsers: userArrayUpdateOperation
    };

    try {
        await updateDoc(articleRef, updatePayload);
        // Non è necessario aggiornare currentArticleData qui, 
        // loadAndDisplayArticleLikes lo farà nella clausola finally.
    } catch (error) {
        console.error("Error updating article like/unlike:", error);
        alert("Si è verificato un errore durante l'elaborazione del tuo like. Riprova.");
    } finally {
        // Ricarica sempre lo stato dei like per riflettere l'ultimo stato del DB
        // e aggiornare currentArticleData.
        if (articleIdInternal) {
            await loadAndDisplayArticleLikes(articleIdInternal);
        }
    }
}

/**
 * Funzione principale per caricare e visualizzare i dati dell'articolo da Firestore.
 * @param {string} articleId L'ID dell'articolo da caricare.
 */
async function loadAndDisplayArticleFromFirestore(articleId) {
    // Verifica che gli elementi DOM principali siano disponibili
    if (!articleContentContainer || !articleDisplayTitle || !articleDisplayDate ||
        !articleDisplayAuthor || !articleDisplayTagsContainer || !articleDisplayContent ||
        !articleDisplayLoading || !articleInteractionsSection || !likeArticleButton || !articleLikeCountSpan) {
        console.error("Elementi DOM essenziali mancanti in loadAndDisplayArticleFromFirestore.");
        if(articleDisplayLoading) articleDisplayLoading.innerHTML = "<p>Errore: Elementi della pagina non caricati correttamente.</p>";
        else if (document.body) document.body.innerHTML = "<p>Errore grave: Impossibile inizializzare la pagina articolo.</p>"
        return;
    }
    
    articleDisplayLoading.style.display = 'block';
    articleContentContainer.style.display = 'none';
    if(articleInteractionsSection) articleInteractionsSection.style.display = 'none';

    try {
        const articleRef = doc(db, "articles", articleId);
        const docSnap = await getDoc(articleRef);

        if (docSnap.exists() && docSnap.data().status === 'published') {
            const articleDataFromDb = docSnap.data();
            // Imposta currentArticleData QUI, prima di chiamare funzioni che ne dipendono (come loadAndDisplayArticleLikes)
            currentArticleData = articleDataFromDb; 

            document.title = `${articleDataFromDb.title || 'Articolo'} - asyncDonkey.io`;
            articleDisplayTitle.textContent = articleDataFromDb.title || "Titolo Non Disponibile";
            articleDisplayDate.textContent = formatArticleDateForViewer(articleDataFromDb.date); // Usa la funzione corretta
            articleDisplayAuthor.textContent = articleDataFromDb.author || "Autore Sconosciuto";
            
            articleDisplayTagsContainer.innerHTML = '';
            if (articleDataFromDb.tags && Array.isArray(articleDataFromDb.tags) && articleDataFromDb.tags.length > 0) {
                articleDataFromDb.tags.forEach(tagText => {
                    const tagEl = document.createElement('span');
                    tagEl.className = 'article-tag';
                    tagEl.textContent = tagText;
                    articleDisplayTagsContainer.appendChild(tagEl);
                });
            } else {
                articleDisplayTagsContainer.textContent = 'Nessun tag';
            }

            articleDisplayContent.innerHTML = articleDataFromDb.content || "<p>Contenuto non disponibile.</p>";
            
            articleDisplayLoading.style.display = 'none';
            articleContentContainer.style.display = 'block';
            if(articleInteractionsSection) articleInteractionsSection.style.display = 'block';

            // Ora che currentArticleData è popolato con i dati dell'articolo,
            // carica lo stato dei like e i commenti.
            await loadAndDisplayArticleLikes(articleId); 
            await loadArticleComments();                 

            // Aggiungi listener una sola volta
            if (likeArticleButton && !likeArticleButton.hasAttribute('data-listener-attached')) {
                likeArticleButton.addEventListener('click', handleArticleLike);
                likeArticleButton.setAttribute('data-listener-attached', 'true');
            }
            if (articleCommentForm && !articleCommentForm.hasAttribute('data-listener-attached')) {
                articleCommentForm.addEventListener('submit', handleArticleCommentSubmit);
                articleCommentForm.setAttribute('data-listener-attached', 'true');
            }

        } else {
            let message = `<p>Spiacenti, l'articolo con ID "${articleId}" non è stato trovato.`;
            if (docSnap.exists() && docSnap.data().status !== 'published') {
                message = `<p>Spiacenti, l'articolo con ID "${articleId}" non è attualmente pubblicato.`;
            }
            message += ` Potrebbe essere stato spostato o rimosso. Torna alla <a href='index.html#articlesSection'>lista articoli</a>.</p>`;
            
            articleDisplayLoading.style.display = 'none';
            articleContentContainer.style.display = 'block';
            document.title = "Articolo Non Trovato - asyncDonkey.io";
            articleDisplayTitle.textContent = "Articolo Non Trovato";
            articleDisplayContent.innerHTML = message;
            if(articleInteractionsSection) articleInteractionsSection.style.display = 'none';
        }
    } catch (error) {
        console.error("Errore durante il caricamento dell'articolo da Firestore:", error);
        articleDisplayLoading.style.display = 'none';
        articleContentContainer.style.display = 'block';
        articleDisplayTitle.textContent = "Errore Caricamento Articolo";
        articleDisplayContent.innerHTML = "<p>Si è verificato un errore imprevisto durante il caricamento dell'articolo. Riprova più tardi.</p>";
        if(articleInteractionsSection) articleInteractionsSection.style.display = 'none';
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
             articleDisplayContent.innerHTML += '<p style="color:orange;">Potrebbe mancare un indice Firestore. Controlla la console (F12) per il link per crearlo.</p>';
        }
    }
}

// --- Event Listener Principale ---
document.addEventListener('DOMContentLoaded', () => {
    // Inizializzazione delle variabili DOM globali del modulo
    likeArticleButton = document.getElementById('likeArticleButton');
    articleLikeCountSpan = document.getElementById('articleLikeCount');
    // articleLikedByListDiv = document.getElementById('articleLikedByList'); // Non sembra usato per visualizzare una lista

    commentsListDiv = document.getElementById('articleCommentsList');
    articleCommentMessageInput = document.getElementById('articleCommentMessage');
    articleCommentNameInput = document.getElementById('articleCommentName');
    submitArticleCommentBtn = document.getElementById('submitArticleCommentBtn');

    articleDisplayLoading = document.getElementById('articleDisplayLoading');
    articleContentContainer = document.getElementById('articleContentContainer');
    articleDisplayTitle = document.getElementById('articleDisplayTitle');
    articleDisplayDate = document.getElementById('articleDisplayDate');
    articleDisplayAuthor = document.getElementById('articleDisplayAuthor');
    articleDisplayTagsContainer = document.getElementById('articleDisplayTagsContainer');
    articleDisplayContent = document.getElementById('articleDisplayContent');
    articleInteractionsSection = document.getElementById('articleInteractions');
    articleCommentForm = document.getElementById('articleCommentForm');
    articleCommentNameSection = document.getElementById('articleCommentNameSection');

    // Verifica robusta degli elementi DOM essenziali
    const essentialElements = [
        articleContentContainer, articleDisplayTitle, articleDisplayDate, articleDisplayAuthor,
        articleDisplayTagsContainer, articleDisplayContent, articleDisplayLoading,
        articleInteractionsSection, likeArticleButton, articleLikeCountSpan, commentsListDiv,
        articleCommentForm, articleCommentNameSection
    ];
    if (essentialElements.some(el => !el)) {
        console.error("Uno o più Elementi DOM essenziali per la pagina articolo sono mancanti. Controlla gli ID in view-article.html.");
        if (articleDisplayLoading) { // Se almeno il loader esiste, usalo per il messaggio
            articleDisplayLoading.innerHTML = "<p>Errore critico: Struttura della pagina articolo corrotta o incompleta. Impossibile caricare l'articolo.</p>";
            articleDisplayLoading.style.display = 'block'; // Assicurati sia visibile
            if(articleContentContainer) articleContentContainer.style.display = 'none';
            if(articleInteractionsSection) articleInteractionsSection.style.display = 'none';
        } else if (document.body) { // Fallback estremo
            document.body.innerHTML = "<p>Errore grave: Impossibile inizializzare la pagina articolo a causa di elementi DOM mancanti.</p>";
        }
        return; // Interrompi l'esecuzione se gli elementi base non ci sono
    }

    const urlParams = new URLSearchParams(window.location.search);
    articleIdInternal = urlParams.get('id');

    if (!db) {
        console.error("js/articleViewer.js: Istanza DB Firebase non disponibile. Impossibile caricare l'articolo.");
        articleDisplayLoading.innerHTML = "<p>Errore: Connessione al database non disponibile.</p>";
        articleDisplayLoading.style.display = 'block';
        articleContentContainer.style.display = 'none';
        if (articleInteractionsSection) articleInteractionsSection.style.display = 'none';
        return;
    }

    if (!articleIdInternal) {
        articleDisplayLoading.style.display = 'none';
        articleContentContainer.style.display = 'block';
        articleDisplayTitle.textContent = "Articolo Non Trovato";
        articleDisplayContent.innerHTML = "<p>L'ID dell'articolo non è stato specificato nell'URL. Torna alla <a href='index.html#articlesSection'>lista articoli</a>.</p>";
        if (articleInteractionsSection) articleInteractionsSection.style.display = 'none';
        return;
    }

    // Chiamata principale per caricare e visualizzare l'articolo da Firestore
    loadAndDisplayArticleFromFirestore(articleIdInternal);

    // Gestione UI form commenti in base all'autenticazione
    onAuthStateChanged(auth, (user) => {
        if (articleCommentNameSection) { // Verifica che l'elemento esista
            articleCommentNameSection.style.display = user ? 'none' : 'block';
            if (articleCommentNameInput) articleCommentNameInput.required = !user;
        }
        // Quando lo stato auth cambia, ricarica lo stato dei like dell'articolo
        // e dei like sui commenti, poiché potrebbero essere cambiati.
        if (articleIdInternal) {
            loadAndDisplayArticleLikes(articleIdInternal); 
            loadArticleComments(); 
        }
    });
});

export { loadAndDisplayArticleFromFirestore };