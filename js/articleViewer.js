// js/articleViewer.js

// Importa db, auth, generateBlockieAvatar da main.js
import { db, auth, generateBlockieAvatar } from './main.js'; 
import { 
    collection, addDoc, query, where, orderBy, limit, getDocs, 
    serverTimestamp, doc, updateDoc, getDoc // Aggiunto getDoc se mancava per userProfileRef
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

let articleIdInternal = null; // Rinominata per evitare confusione con la costante articleId in alcuni scope

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
    const commentsListDiv = document.getElementById('articleCommentsList');
    if (!commentsListDiv || !articleIdInternal) { // Usa articleIdInternal
        if (commentsListDiv) commentsListDiv.innerHTML = "<p>Impossibile caricare i commenti (ID articolo mancante).</p>";
        return;
    }
    commentsListDiv.innerHTML = "<p>Caricamento commenti...</p>";

    try {
        const commentsCollectionRef = collection(db, "articleComments");
        const q = query(
            commentsCollectionRef, 
            where("articleId", "==", articleIdInternal), // Usa articleIdInternal
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

            const commentContent = document.createElement('div');
            commentContent.classList.add('comment-content');

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

            commentContent.appendChild(nameEl);
            commentContent.appendChild(dateEl);
            commentContent.appendChild(messageEl);

            const likesContainer = document.createElement('div');
            likesContainer.classList.add('likes-container');
            const likeButton = document.createElement('button');
            likeButton.classList.add('like-btn');
            likeButton.setAttribute('data-comment-id', commentId);
            likeButton.setAttribute('data-collection-type', 'articleComments');
            likeButton.innerHTML = `❤️ <span class="like-count">${commentData.likes || 0}</span>`;
            // Aggiungere logica e listener per i like qui
            likesContainer.appendChild(likeButton);
            commentContent.appendChild(likesContainer);

            commentElement.appendChild(commentContent);
            commentsListDiv.appendChild(commentElement);
        });

    } catch (error) {
        console.error(`Errore caricamento commenti per articolo ${articleIdInternal}:`, error); // Usa articleIdInternal
        commentsListDiv.innerHTML = "<p>Errore nel caricamento dei commenti.</p>";
    }
}

async function handleArticleCommentSubmit(event) {
    event.preventDefault();
    const commentMessageInput = document.getElementById('articleCommentMessage');
    const commentNameInput = document.getElementById('articleCommentName');
    const submitBtn = document.getElementById('submitArticleCommentBtn');

    if (!commentMessageInput || !submitBtn || !articleIdInternal) { // Usa articleIdInternal
        alert("Errore nel form dei commenti.");
        return;
    }

    const message = commentMessageInput.value.trim();
    if (!message) {
        alert("Per favore, inserisci un messaggio.");
        return;
    }

    const user = auth.currentUser;
    let commentData = {
        articleId: articleIdInternal, // Usa articleIdInternal
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
        const name = commentNameInput ? commentNameInput.value.trim() : '';
        if (!name) {
            alert("Per favore, inserisci il tuo nome.");
            return;
        }
        commentData.name = name;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Invio...";

    try {
        const commentsCollectionRef = collection(db, "articleComments");
        await addDoc(commentsCollectionRef, commentData);
        commentMessageInput.value = '';
        if (commentNameInput && !user) commentNameInput.value = '';
        await loadArticleComments();
    } catch (error) {
        console.error("Errore invio commento articolo:", error);
        alert("Errore durante l'invio del commento. Riprova.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Invia Commento";
    }
}

// --- Funzione Principale di Inizializzazione della Pagina Articolo ---
document.addEventListener('DOMContentLoaded', () => {
    const articleDisplayLoading = document.getElementById('articleDisplayLoading');
    const articleContentContainer = document.getElementById('articleContentContainer');
    const articleDisplayTitle = document.getElementById('articleDisplayTitle');
    const articleDisplayDate = document.getElementById('articleDisplayDate');
    const articleDisplayAuthor = document.getElementById('articleDisplayAuthor');
    const articleDisplayTagsContainer = document.getElementById('articleDisplayTagsContainer');
    const articleDisplayContent = document.getElementById('articleDisplayContent');
    const articleInteractionsSection = document.getElementById('articleInteractions');
    const articleCommentForm = document.getElementById('articleCommentForm');
    const articleCommentNameSection = document.getElementById('articleCommentNameSection');

    // Verifica elementi DOM essenziali
    if (!articleContentContainer || !articleDisplayTitle || !articleDisplayDate || 
        !articleDisplayAuthor || !articleDisplayTagsContainer || !articleDisplayContent || 
        !articleDisplayLoading || !articleInteractionsSection) {
        console.error("Elementi DOM essenziali per la pagina articolo mancanti.");
        if(articleDisplayLoading) articleDisplayLoading.innerHTML = "<p>Errore struttura pagina.</p>";
        else document.body.innerHTML = "<p>Errore grave: struttura pagina articolo incompleta.</p>"
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    articleIdInternal = urlParams.get('id'); // Imposta la variabile a livello di script

    if (!articleIdInternal) {
        articleDisplayLoading.style.display = 'none';
        articleContentContainer.style.display = 'block';
        articleDisplayTitle.textContent = "Articolo Non Trovato";
        articleDisplayContent.innerHTML = "<p>L'ID dell'articolo non è stato specificato nell'URL. Torna alla <a href='index.html#articlesSection'>lista articoli</a>.</p>";
        articleInteractionsSection.style.display = 'none';
        return; // Esci se non c'è articleId
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
        articleInteractionsSection.style.display = 'block';

        loadArticleComments();

        if (articleCommentForm) {
            articleCommentForm.addEventListener('submit', handleArticleCommentSubmit);
        }
        
        onAuthStateChanged(auth, (user) => {
            if (articleCommentNameSection) {
                articleCommentNameSection.style.display = user ? 'none' : 'block';
                const nameInput = document.getElementById('articleCommentName');
                if (nameInput) nameInput.required = !user;
            }
            // Ricarica i commenti in caso di cambio stato auth per aggiornare UI dei like ai commenti (se implementato)
            loadArticleComments(); 
        });

    } else {
        articleDisplayLoading.style.display = 'none';
        articleContentContainer.style.display = 'block';
        document.title = "Articolo Non Trovato - asyncDonkey.io";
        articleDisplayTitle.textContent = "Articolo Non Trovato";
        articleDisplayContent.innerHTML = `<p>Spiacenti, l'articolo con ID "${articleIdInternal}" non è stato trovato. Potrebbe essere stato spostato o rimosso. Torna alla <a href='index.html#articlesSection'>lista articoli</a>.</p>`;
        articleInteractionsSection.style.display = 'none';
    }
});