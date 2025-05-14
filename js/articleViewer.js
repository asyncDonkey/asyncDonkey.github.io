// js/articleViewer.js
import { db, auth, generateBlockieAvatar } from './main.js';
import {
    collection, addDoc, query, where, orderBy, limit, getDocs,
    serverTimestamp, doc, updateDoc, getDoc, increment,
    arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Dati statici degli articoli (mantieni o importa se necessario per il contenuto dell'articolo)
const sampleArticles = [
    {
        id: 'article-1',
        title: "Ottimizzazione Query Firestore per Leaderboard Performanti",
        date: "2025-05-15",
        author: "U.T.",
        content: `
<p>Le leaderboard sono una funzionalità comune nei giochi e nelle applicazioni competitive. Man mano che la base utenti e il numero di punteggi crescono, le query per recuperare e ordinare questi dati possono diventare un collo di bottiglia per le prestazioni se non gestite correttamente con Firestore.</p>
<h2>Problema Comune</h2>
<p>Una query tipica per una leaderboard potrebbe essere <code>collection('scores').orderBy('score', 'desc').limit(10)</code>. Sebbene semplice, senza gli indici corretti, Firestore potrebbe dover analizzare un gran numero di documenti.</p>
<h2>Soluzioni e Best Practice</h2>
<h3>1. Indici Compositi</h3>
<p>Firestore spesso suggerisce automaticamente gli indici compositi necessari quando esegui query complesse in modalità test. Assicurati di crearli! Per una leaderboard che ordina per <code>score</code> e poi, ad esempio, per <code>timestamp</code> per gli spareggi, un indice su <code>(score DESC, timestamp ASC)</code> è cruciale.</p>
<pre><code class="language-javascript">// Esempio di query che beneficerebbe da un indice composito
const scoresRef = collection(db, 'leaderboardScores');
const q = query(scoresRef, orderBy('score', 'desc'), orderBy('timestamp', 'asc'), limit(10));</code></pre>
<h3>2. Denormalizzazione e Campi Aggregati</h3>
<p>Per leaderboard molto grandi o con filtri complessi (es. settimanali/mensili), considera la denormalizzazione. Ad esempio, potresti avere una collection separata per le "Top Scores Settimanali" che viene aggiornata tramite Cloud Functions.</p>
<h3>3. Limitare i Dati Letti</h3>
<p>Usa sempre <code>limit()</code> per recuperare solo il numero di punteggi che ti serve visualizzare. Per la paginazione, usa i cursori <code>startAfter()</code>.</p>
<h3>4. Struttura dei Dati</h3>
<p>Considera la struttura dei tuoi documenti. A volte, includere campi aggiuntivi per facilitare il filtraggio o l'ordinamento può essere utile, anche se introduce una certa ridondanza.</p>
        `,
        tags: ["Firebase", "Firestore", "Performance", "NoSQL"],
        featured: true,
        likesPlaceholder: 15,
        commentsPlaceholder: 3
    },
    {
        id: 'article-2',
        title: "Introduzione all'Architettura dei Componenti Web con JS Puro",
        date: "2025-05-10",
        author: "asyncDonkey",
        content: `
<p>I Componenti Web sono un insieme di tecnologie web che permettono di creare elementi HTML personalizzati, riutilizzabili e incapsulati. Questo articolo esplora come iniziare a usarli con JavaScript vanilla.</p>
<h2>Tecnologie Chiave</h2>
<ul>
    <li><strong>Custom Elements:</strong> Permettono di definire i propri tag HTML.</li>
    <li><strong>Shadow DOM:</strong> Fornisce incapsulamento per la struttura DOM e gli stili CSS del componente.</li>
    <li><strong>HTML Templates:</strong> I tag <code>&lt;template&gt;</code> e <code>&lt;slot&gt;</code> aiutano a definire markup riutilizzabile.</li>
</ul>
        `,
        tags: ["JavaScript", "Web Components", "Frontend"],
        link: "#",
        likesPlaceholder: 22,
        commentsPlaceholder: 7
    },
    {
        id: 'article-3',
        title: "Gestione dello Stato in un Gioco JavaScript Semplice",
        date: "2025-05-01",
        author: "asyncDonkey",
        content: "<p>Affrontiamo alcune strategie per gestire lo stato (punteggio, vite, ecc.) in un gioco 2D costruito con JavaScript e Canvas API.</p>",
        tags: ["JavaScript", "GameDev", "State Management"],
        link: "#",
        likesPlaceholder: 10,
        commentsPlaceholder: 2
    }
];

let articleIdInternal = null;
let currentArticleData = null; // Per mantenere i dati dell'articolo corrente da Firestore

// Dichiarazione delle variabili DOM a livello di modulo
let likeArticleButton, articleLikeCountSpan, articleLikedByListDiv;
let commentsListDiv, articleCommentMessageInput, articleCommentNameInput, submitArticleCommentBtn;
let articleDisplayLoading, articleContentContainer, articleDisplayTitle, articleDisplayDate,
    articleDisplayAuthor, articleDisplayTagsContainer, articleDisplayContent,
    articleInteractionsSection, articleCommentForm, articleCommentNameSection;


function formatCommentTimestamp(firebaseTimestamp) {
    if (!firebaseTimestamp?.toDate) return 'Data non disponibile';
    try {
        return firebaseTimestamp.toDate().toLocaleString('it-IT', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch (e) { return 'Errore data'; }
}

async function loadArticleComments() {
    // commentsListDiv è già inizializzato in DOMContentLoaded
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
        commentsListDiv.innerHTML = '';

        if (querySnapshot.empty) {
            commentsListDiv.innerHTML = "<p>Nessun commento per questo articolo. Sii il primo!</p>";
            return;
        }

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

            const commentContentDiv = document.createElement('div'); // Rinominato per chiarezza
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

            // Logica per i like ai commenti (se vuoi aggiungerla qui in futuro)
            const commentLikesContainer = document.createElement('div');
            commentLikesContainer.classList.add('likes-container');
            const commentLikeButton = document.createElement('button');
            commentLikeButton.classList.add('like-btn'); // Potresti voler una classe diversa per i like ai commenti vs articoli
            commentLikeButton.setAttribute('data-comment-id', commentId);
            // commentLikeButton.setAttribute('data-collection-type', 'articleComments'); // Già presente
            commentLikeButton.innerHTML = `❤️ <span class="like-count">${commentData.likes || 0}</span>`;
            // TODO: Aggiungere event listener per handleCommentLike(commentId, 'articleComments')
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

async function handleArticleCommentSubmit(event) {
    event.preventDefault();
    if (!articleCommentMessageInput || !submitArticleCommentBtn || !articleIdInternal) {
        alert("Errore nel form dei commenti.");
        return;
    }

    const message = articleCommentMessageInput.value.trim();
    if (!message) {
        alert("Per favore, inserisci un messaggio.");
        return;
    }

    const user = auth.currentUser;
    let commentData = {
        articleId: articleIdInternal,
        message: message,
        timestamp: serverTimestamp(),
        likes: 0,
        likedBy: []
    };

    if (user) {
        commentData.userId = user.uid;
        const userProfileRef = doc(db, "userProfiles", user.uid);
        try {
            const docSnap = await getDoc(userProfileRef);
            if (docSnap.exists()) {
                commentData.userName = docSnap.data().nickname || (user.email ? user.email.split('@')[0] : "Utente Registrato");
                if (docSnap.data().nationalityCode) {
                    commentData.nationalityCode = docSnap.data().nationalityCode;
                }
            } else {
                commentData.userName = user.email ? user.email.split('@')[0] : "Utente Registrato";
            }
        } catch (e) {
            console.error("Errore recupero profilo per commento:", e);
            commentData.userName = user.email ? user.email.split('@')[0] : "Utente Registrato";
        }
    } else {
        const name = articleCommentNameInput ? articleCommentNameInput.value.trim() : '';
        if (!name && articleCommentNameInput && articleCommentNameInput.required) {
            alert("Per favore, inserisci il tuo nome.");
            return;
        }
        if (name) commentData.name = name;
    }

    submitArticleCommentBtn.disabled = true;
    submitArticleCommentBtn.textContent = "Invio...";

    try {
        const commentsCollectionRef = collection(db, "articleComments");
        await addDoc(commentsCollectionRef, commentData); // Aggiunge il commento

        // --- INIZIO AGGIUNTA: Incrementa commentCount sull'articolo ---
        if (articleIdInternal) {
            const articleRef = doc(db, "articles", articleIdInternal);
            await updateDoc(articleRef, {
                commentCount: increment(1)
            });
            console.log(`Conteggio commenti incrementato per l'articolo ${articleIdInternal}`);
        }
        // --- FINE AGGIUNTA ---

        articleCommentMessageInput.value = '';
        if (articleCommentNameInput && !user) articleCommentNameInput.value = '';
        await loadArticleComments(); // Ricarica la lista dei commenti
        // Potremmo anche aggiornare un eventuale contatore totale sulla pagina articolo qui
    } catch (error) {
        console.error("Errore invio commento articolo o aggiornamento conteggio:", error);
        alert("Errore durante l'invio del commento. Riprova.");
    } finally {
        if (submitArticleCommentBtn) {
            submitArticleCommentBtn.disabled = false;
            submitArticleCommentBtn.textContent = "Invia Commento";
        }
    }
}


async function loadAndDisplayArticleLikes(articleId) {
    if (!likeArticleButton || !articleLikeCountSpan || !articleId) {
        console.warn("loadAndDisplayArticleLikes: Elementi DOM per i like (likeArticleButton, articleLikeCountSpan) o articleId mancanti.");
        if(articleLikeCountSpan) articleLikeCountSpan.textContent = "N/A";
        if(likeArticleButton) {
            likeArticleButton.innerHTML = `🤍 Like`;
            likeArticleButton.disabled = true;
        }
        return;
    }

    const articleRef = doc(db, "articles", articleId);
    try {
        const docSnap = await getDoc(articleRef);
        if (docSnap.exists()) {
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
            console.warn(`Article with ID ${articleId} not found in Firestore for likes. currentArticleData non verrà aggiornato.`);
            articleLikeCountSpan.textContent = "0"; // Default a 0 se articolo non ha dati like
            likeArticleButton.disabled = true; // O disabilitato se l'articolo non esiste affatto
            likeArticleButton.innerHTML = `🤍 Like`;
            currentArticleData = { likeCount: 0, likedByUsers: [] }; // Stato di fallback
        }
    } catch (error) {
        console.error("Error loading article likes:", error);
        articleLikeCountSpan.textContent = "Err";
        likeArticleButton.disabled = true;
        likeArticleButton.innerHTML = `🤍 Like`;
        currentArticleData = null; // Indica che i dati non sono stati caricati
    }
}

async function handleArticleLike() {
    if (!articleIdInternal || !auth.currentUser) {
        alert("Devi essere loggato per mettere like agli articoli.");
        return;
    }
    if (!currentArticleData) {
        alert("Dati articolo non caricati correttamente. Impossibile mettere like.");
        if (articleIdInternal) await loadAndDisplayArticleLikes(articleIdInternal);
        return;
    }
    if (!likeArticleButton) {
        console.error("handleArticleLike: likeArticleButton non è inizializzato.");
        return;
    }

    likeArticleButton.disabled = true; // Disabilita subito
    const articleRef = doc(db, "articles", articleIdInternal);
    const userId = auth.currentUser.uid;
    const userHasLiked = currentArticleData.likedByUsers && currentArticleData.likedByUsers.includes(userId);

    let likeUpdateOperation;
    let userArrayUpdateOperation;

    if (userHasLiked) {
        // Logica per UNLIKE
        if (currentArticleData.likeCount <= 0 && !userHasLiked) { // Prevenzione più robusta: non decrementare se già a 0 E l'utente non ha un like da rimuovere
            console.warn("Attempting to unlike when like count is zero or user hasn't liked. Aborting.");
            await loadAndDisplayArticleLikes(articleIdInternal); // Ricarica per sicurezza UI
            // likeArticleButton.disabled = false; // loadAndDisplayArticleLikes gestirà lo stato del bottone
            return;
        }
        likeUpdateOperation = increment(-1);
        userArrayUpdateOperation = arrayRemove(userId);
        console.log(`Attempting to UNLIKE article ${articleIdInternal} by user ${userId}. Current likes: ${currentArticleData.likeCount}`);
    } else {
        // Logica per LIKE
        likeUpdateOperation = increment(1);
        userArrayUpdateOperation = arrayUnion(userId);
        console.log(`Attempting to LIKE article ${articleIdInternal} by user ${userId}. Current likes: ${currentArticleData.likeCount}`);
    }

    const updatePayload = {
        likeCount: likeUpdateOperation,
        likedByUsers: userArrayUpdateOperation
    };
    console.log("Client sending updateDoc with payload:", updatePayload);

    try {
        await updateDoc(articleRef, updatePayload); // UNA SOLA CHIAMATA updateDoc
        console.log("Article like/unlike successful.");
        // currentArticleData si aggiornerà con la prossima chiamata a loadAndDisplayArticleLikes
    } catch (error) {
        console.error("Error updating article like/unlike:", error);
        alert("An error occurred while processing your like. Please try again.");
        // Non riabilitare il bottone qui, loadAndDisplayArticleLikes lo farà
    } finally {
        // Ricarica sempre lo stato dei like per riflettere l'ultimo stato del DB,
        // sia in caso di successo che di fallimento (per resettare UI a stato corretto).
        // Questo aggiornerà anche currentArticleData.
        if (articleIdInternal) {
            await loadAndDisplayArticleLikes(articleIdInternal);
        }
    }
}

// --- Funzione Principale di Inizializzazione della Pagina Articolo ---
document.addEventListener('DOMContentLoaded', () => {
    // Inizializzazione delle variabili DOM definite a livello di modulo
    likeArticleButton = document.getElementById('likeArticleButton');
    articleLikeCountSpan = document.getElementById('articleLikeCount');
    articleLikedByListDiv = document.getElementById('articleLikedByList');

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


    if (!articleContentContainer || !articleDisplayTitle || !articleDisplayDate ||
        !articleDisplayAuthor || !articleDisplayTagsContainer || !articleDisplayContent ||
        !articleDisplayLoading || !articleInteractionsSection || !likeArticleButton || !articleLikeCountSpan) {
        console.error("Elementi DOM essenziali per la pagina articolo mancanti. Controlla gli ID.");
        if (articleDisplayLoading) articleDisplayLoading.innerHTML = "<p>Errore: Struttura della pagina articolo incompleta.</p>";
        else if (document.body) document.body.innerHTML = "<p>Errore grave: Struttura pagina articolo non caricata correttamente.</p>";
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    articleIdInternal = urlParams.get('id');

    if (!db) {
        console.error("js/articleViewer.js: Firebase DB instance is not available. Article interactions will be affected.");
        if (articleDisplayLoading) articleDisplayLoading.innerHTML = "<p>Errore: Connessione al database non disponibile.</p>";
        if (articleInteractionsSection) articleInteractionsSection.style.display = 'none';
        return;
    }

    if (!articleIdInternal) {
        articleDisplayLoading.style.display = 'none';
        articleContentContainer.style.display = 'block';
        articleDisplayTitle.textContent = "Articolo Non Trovato";
        articleDisplayContent.innerHTML = "<p>L'ID dell'articolo non è stato specificato nell'URL. Torna alla <a href='index.html#articlesSection'>lista articoli</a>.</p>";
        articleInteractionsSection.style.display = 'none';
        return;
    }

    const article = sampleArticles.find(art => art.id === articleIdInternal);

    if (article) {
        document.title = `${article.title} - asyncDonkey.io`;
        articleDisplayTitle.textContent = article.title;
        articleDisplayDate.textContent = new Date(article.date).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
        articleDisplayAuthor.textContent = article.author || "Redazione";

        articleDisplayTagsContainer.innerHTML = '';
        if (article.tags && article.tags.length > 0) {
            article.tags.forEach(tagText => {
                const tagEl = document.createElement('span');
                tagEl.className = 'article-tag';
                tagEl.textContent = tagText;
                articleDisplayTagsContainer.appendChild(tagEl);
            });
        } else {
            articleDisplayTagsContainer.textContent = 'Nessun tag';
        }

        articleDisplayContent.innerHTML = article.content;
        articleDisplayLoading.style.display = 'none';
        articleContentContainer.style.display = 'block';
        if(articleInteractionsSection) articleInteractionsSection.style.display = 'block';


        if (articleIdInternal) {
            loadAndDisplayArticleLikes(articleIdInternal); // Carica stato like da Firestore
            if (likeArticleButton) {
                likeArticleButton.addEventListener('click', handleArticleLike);
            } else {
                console.error("Pulsante 'likeArticleButton' non trovato nel DOM all'interno di DOMContentLoaded.");
            }
        } else {
            console.warn("articleIdInternal non definito al momento di aggiungere listener per i like.");
            if (likeArticleButton) likeArticleButton.disabled = true;
            if (articleLikeCountSpan) articleLikeCountSpan.textContent = "N/A";
        }

        loadArticleComments();

        if (articleCommentForm) {
            articleCommentForm.addEventListener('submit', handleArticleCommentSubmit);
        }

        onAuthStateChanged(auth, (user) => {
            if (articleCommentNameSection) {
                // const nameInput = document.getElementById('articleCommentName'); // Già inizializzato come articleCommentNameInput
                articleCommentNameSection.style.display = user ? 'none' : 'block';
                if (articleCommentNameInput) articleCommentNameInput.required = !user;
            }
            if (articleIdInternal) {
                loadArticleComments();
                loadAndDisplayArticleLikes(articleIdInternal); // Aggiorna stato like al cambio auth
            }
        });

    } else {
        articleDisplayLoading.style.display = 'none';
        articleContentContainer.style.display = 'block';
        document.title = "Articolo Non Trovato - asyncDonkey.io";
        articleDisplayTitle.textContent = "Articolo Non Trovato";
        articleDisplayContent.innerHTML = `<p>Spiacenti, l'articolo con ID "${articleIdInternal}" non è stato trovato. Potrebbe essere stato spostato o rimosso. Torna alla <a href='index.html#articlesSection'>lista articoli</a>.</p>`;
        if(articleInteractionsSection) articleInteractionsSection.style.display = 'none';
    }
});