// js/homePageFeatures.js
import { db } from './main.js'; // Assicurati che db sia esportato da main.js
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// L'array statico sampleArticles è stato rimosso.
// I dati degli articoli verranno caricati direttamente da Firestore.

/**
 * Formatta un oggetto Timestamp di Firestore o una stringa data in un formato leggibile.
 * @param {object|string|null|undefined} dateInput - Timestamp di Firestore, oggetto {seconds: number, nanoseconds: number}, o stringa data.
 * @returns {string} Data formattata o un messaggio di fallback.
 */
function formatArticleDate(dateInput) {
    if (!dateInput) return 'Data non disponibile';
    try {
        let date;
        if (dateInput instanceof Timestamp) {
            date = dateInput.toDate();
        } else if (typeof dateInput === 'string') {
            date = new Date(dateInput);
            if (isNaN(date.getTime())) { // Controlla se la data parsata è valida
                console.warn("Formato stringa data non riconosciuto in formatArticleDate:", dateInput);
                return "Data invalida";
            }
        } else if (dateInput && typeof dateInput.seconds === 'number' && typeof dateInput.nanoseconds === 'number') {
            // Gestisce l'oggetto grezzo che Firestore potrebbe restituire in alcuni contesti o da vecchi dati
            date = new Timestamp(dateInput.seconds, dateInput.nanoseconds).toDate();
        } else {
            console.warn("Formato data non gestito in formatArticleDate:", dateInput);
            return 'Formato data sconosciuto';
        }
        return date.toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
        console.error("Errore formattazione data articolo:", e, "Input:", dateInput);
        return 'Errore data';
    }
}

/**
 * Crea e appende una card articolo al DOM.
 * @param {object} articleData - L'oggetto articolo da Firestore (doc.data()).
 * @param {string} articleId - L'ID del documento articolo.
 * @param {HTMLElement} gridContainer - Il contenitore della griglia a cui appendere la card.
 */
function createArticleCard(articleData, articleId, gridContainer) {
    const card = document.createElement('div');
    card.className = 'article-card';
    card.setAttribute('data-article-id', articleId);

    const titleEl = document.createElement('h4');
    titleEl.textContent = articleData.title || "Titolo mancante";
    card.appendChild(titleEl);

    const metaEl = document.createElement('div');
    metaEl.className = 'article-meta';

    const dateEl = document.createElement('span');
    dateEl.className = 'article-date';
    const dateValueForCard = articleData.publishedAt || articleData.createdAt; // Privilegia publishedAt, fallback a createdAt
    dateEl.textContent = formatArticleDate(dateValueForCard);
    metaEl.appendChild(dateEl);

    if (articleData.tags && Array.isArray(articleData.tags) && articleData.tags.length > 0) {
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'article-tags';
        articleData.tags.forEach(tagText => {
            const tagEl = document.createElement('span');
            tagEl.className = 'article-tag';
            tagEl.textContent = tagText;
            tagsContainer.appendChild(tagEl);
        });
        metaEl.appendChild(tagsContainer);
    }
    card.appendChild(metaEl);

    const snippetEl = document.createElement('p');
    snippetEl.className = 'article-snippet';
    snippetEl.textContent = articleData.snippet || "Nessun riassunto disponibile.";
    card.appendChild(snippetEl);

    const interactionsEl = document.createElement('div');
    interactionsEl.className = 'article-card-interactions';

    // Like
    const likeContainer = document.createElement('div');
    likeContainer.className = 'interaction-item like-interaction-homepage';
    const likeButton = document.createElement('button');
    likeButton.className = 'article-like-btn homepage-like-btn';
    likeButton.setAttribute('data-article-id', articleId);
    likeButton.innerHTML = `🤍`; // L'UI del like verrà aggiornata da main.js
    likeButton.title = "Like this article";
    const likeCountSpan = document.createElement('span');
    likeCountSpan.className = 'article-like-count homepage-like-count';
    likeCountSpan.textContent = `${articleData.likeCount || 0}`;
    likeContainer.appendChild(likeButton);
    likeContainer.appendChild(likeCountSpan);
    interactionsEl.appendChild(likeContainer);

    // Commenti
    const commentContainer = document.createElement('div');
    commentContainer.className = 'interaction-item comment-interaction-homepage';
    const commentIcon = document.createElement('span');
    commentIcon.className = 'comment-icon-homepage';
    commentIcon.innerHTML = '💬';
    const commentCountSpan = document.createElement('span');
    commentCountSpan.className = 'article-comment-count homepage-comment-count';
    commentCountSpan.textContent = `${articleData.commentCount || 0}`;
    const commentLink = document.createElement('a');
    commentLink.className = 'article-comment-link-homepage';
    commentLink.href = `view-article.html?id=${articleId}#articleCommentsSectionContainer`;
    commentLink.textContent = "Commenta";
    commentLink.title = "Vedi e aggiungi commenti";
    commentContainer.appendChild(commentIcon);
    commentContainer.appendChild(commentCountSpan);
    commentContainer.appendChild(commentLink);
    interactionsEl.appendChild(commentContainer);
    card.appendChild(interactionsEl);

    const readMoreLinkEl = document.createElement('a');
    readMoreLinkEl.className = 'btn-read-more';
    readMoreLinkEl.href = `view-article.html?id=${articleId}`;
    readMoreLinkEl.textContent = 'Leggi di più →';
    card.appendChild(readMoreLinkEl);

    gridContainer.appendChild(card);
}

/**
 * Visualizza la sezione articoli e l'articolo in evidenza caricandoli da Firestore.
 */
export async function displayArticlesSection() {
    const articlesSection = document.getElementById('articlesSection');
    const articlesGrid = document.getElementById('articlesGrid');
    const featuredArticleCard = document.getElementById('featuredArticleCard');
    const featuredArticleTitleEl = document.getElementById('featuredArticleActualTitle');
    const featuredArticleSnippetEl = document.getElementById('featuredArticleSnippet');
    const featuredArticleLinkEl = document.getElementById('featuredArticleLink');

    if (!articlesSection || !articlesGrid || !featuredArticleCard || !featuredArticleTitleEl || !featuredArticleSnippetEl || !featuredArticleLinkEl) {
        console.warn("Elementi DOM per la sezione articoli non trovati in displayArticlesSection.");
        if (articlesSection) articlesSection.style.display = 'none'; // Nascondi la sezione se incompleta
        return;
    }

    if (articlesGrid) articlesGrid.innerHTML = '<p style="text-align:center; color:var(--text-color-muted); grid-column: 1 / -1;">Caricamento articoli da Firestore...</p>';
    if (featuredArticleCard) featuredArticleCard.style.display = 'none';
    if (articlesSection) articlesSection.style.display = 'block'; // Mostra la sezione con il messaggio di caricamento

    if (!db) {
        if (articlesGrid) articlesGrid.innerHTML = '<p style="text-align:center; color:red;">Errore: Connessione al database non disponibile.</p>';
        return;
    }

    try {
        const articlesCollectionRef = collection(db, "articles");
        const q = query(
            articlesCollectionRef,
            where("status", "==", "published"),
            orderBy("publishedAt", "desc"),
            limit(10)
        );

        const querySnapshot = await getDocs(q);
        const articlesFromDb = [];
        querySnapshot.forEach((doc) => {
            articlesFromDb.push({ id: doc.id, ...doc.data() });
        });

        // Pulisci la griglia solo una volta prima di popolarla
        if (articlesGrid) articlesGrid.innerHTML = ''; 

        let featuredArticleData = null;
        if (articlesFromDb.length > 0) {
            featuredArticleData = articlesFromDb.find(article => article.isFeatured === true) || articlesFromDb[0];

            if (featuredArticleData) {
                const featuredH3TitleEl = document.getElementById('featuredArticleTitle'); 
                if (featuredH3TitleEl) featuredH3TitleEl.style.display = 'block';

                if (featuredArticleTitleEl) featuredArticleTitleEl.textContent = featuredArticleData.title || "Titolo non disponibile";
                
                if (featuredArticleSnippetEl) {
                    featuredArticleSnippetEl.textContent = featuredArticleData.snippet || 
                                                         (featuredArticleData.contentMarkdown ? featuredArticleData.contentMarkdown.substring(0, 150) + "..." : "Leggi di più...");
                }
                
                if (featuredArticleLinkEl) featuredArticleLinkEl.href = `view-article.html?id=${featuredArticleData.id}`;
                if (featuredArticleCard) featuredArticleCard.style.display = 'flex';
            }
        }
        
        // Popola la griglia con gli articoli non "featured" (o tutti se non c'è un featured esplicito e ne abbiamo solo uno)
        let articlesAddedToGrid = 0;
        articlesFromDb.forEach(articleDataInLoop => {
            if (!featuredArticleData || articleDataInLoop.id !== featuredArticleData.id) { // Non duplicare il featured
                if (typeof createArticleCard === "function") { // Verifica che createArticleCard esista
                    createArticleCard(articleDataInLoop, articleDataInLoop.id, articlesGrid);
                    articlesAddedToGrid++;
                } else {
                    console.error("Funzione createArticleCard non definita!");
                }
            }
        });

        if (articlesFromDb.length === 0) { // Nessun articolo trovato
            if (articlesGrid) articlesGrid.innerHTML = '<p style="text-align:center; color:var(--text-color-muted); grid-column: 1 / -1;">Nessun articolo pubblicato trovato.</p>';
            if (featuredArticleCard) featuredArticleCard.style.display = 'none';
        } else if (articlesAddedToGrid === 0 && !featuredArticleData) { // C'erano articoli, ma nessuno aggiunto alla griglia (es. solo il featured) e il featured non è stato mostrato
             if (articlesGrid) articlesGrid.innerHTML = '<p style="text-align:center; color:var(--text-color-muted); grid-column: 1 / -1;">Nessun altro articolo da visualizzare.</p>';
        }


    } catch (error) {
        console.error("Errore durante il caricamento degli articoli da Firestore (homePageFeatures.js):", error);
        if (articlesGrid) articlesGrid.innerHTML = '<p style="text-align:center; color:red;">Errore nel caricamento degli articoli. Controlla la console.</p>';
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
             if (articlesGrid) articlesGrid.innerHTML += '<p style="text-align:center; color:orange;">Indice Firestore mancante. Controlla la console del browser per il link per crearlo.</p>';
        }
        if (featuredArticleCard) featuredArticleCard.style.display = 'none';
    }
}

/**
 * Mostra il banner dell'ultimo giocatore che ha sconfitto Glitchzilla.
 */
export function displayGlitchzillaBanner() {
    const bannerElement = document.getElementById('glitchzillaDefeatedBanner');
    const defeaterNameElement = document.getElementById('lastGlitchzillaDefeater');

    if (!bannerElement || !defeaterNameElement) {
        // console.warn("Elementi DOM per il banner Glitchzilla non trovati."); // Meno verboso
        return;
    }

    // Dati placeholder, da sostituire con logica Firestore (Task C.3.4)
    const lastDefeaterData = {
        name: "cYd3R_pUnK_2077",
        defeated: true
    };
    
    if (lastDefeaterData && lastDefeaterData.defeated && lastDefeaterData.name) {
        defeaterNameElement.textContent = lastDefeaterData.name;
        bannerElement.style.display = 'block';
    } else {
        bannerElement.style.display = 'none';
    }
}
