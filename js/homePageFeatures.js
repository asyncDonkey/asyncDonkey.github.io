// js/homePageFeatures.js

// Dati statici degli articoli (Sub-task H.3.3)
const sampleArticles = [
    {
        id: 'article-1',
        title: "Ottimizzazione Query Firestore per Leaderboard Performanti",
        date: "2025-05-15",
        snippet: "Un'analisi di come strutturare le query Firestore e gli indici...",
        tags: ["Firebase", "Firestore", "Performance", "NoSQL"],
        link: "#",
        featured: true,
        likesPlaceholder: 15, // Esempio
        commentsPlaceholder: 3  // Esempio
    },
    {
        id: 'article-2',
        title: "Introduzione all'Architettura dei Componenti Web con JS Puro",
        date: "2025-05-10",
        snippet: "Esploriamo come creare componenti web riutilizzabili...",
        tags: ["JavaScript", "Web Components", "Frontend"],
        link: "#",
        likesPlaceholder: 22, // Esempio
        commentsPlaceholder: 7  // Esempio
    },
    {
        id: 'article-3',
        title: "Gestione dello Stato in un Gioco JavaScript Semplice",
        date: "2025-05-01",
        snippet: "Tecniche e pattern per gestire lo stato (punteggio, vite, power-up) in un gioco 2D sviluppato con JavaScript e Canvas API, mantenendo il codice organizzato.",
        tags: ["JavaScript", "GameDev", "State Management"],
        link: "#"
    }
];

/**
 * Crea e appende una card articolo al DOM.
 * @param {object} article - L'oggetto articolo.
 * @param {HTMLElement} gridContainer - Il contenitore della griglia a cui appendere la card.
 */
function createArticleCard(article, gridContainer) {
    const card = document.createElement('div');
    card.className = 'article-card';
    card.setAttribute('data-article-id', article.id); // Aggiungiamo un ID per riferimento

    const titleEl = document.createElement('h4');
    titleEl.textContent = article.title;
    card.appendChild(titleEl);

    const metaEl = document.createElement('div');
    metaEl.className = 'article-meta';

    const dateEl = document.createElement('span');
    dateEl.className = 'article-date';
    dateEl.textContent = new Date(article.date).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
    metaEl.appendChild(dateEl);

    if (article.tags && article.tags.length > 0) {
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'article-tags';
        article.tags.forEach(tagText => {
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
    snippetEl.textContent = article.snippet;
    card.appendChild(snippetEl);

    // --- INIZIO MODIFICHE PER LIKE E COMMENTI ---
    const interactionsEl = document.createElement('div');
    interactionsEl.className = 'article-card-interactions'; // Nuova classe per stilizzare

    // Bottone e contatore Like
    const likeContainer = document.createElement('div');
    likeContainer.className = 'interaction-item like-interaction-homepage';

    const likeButton = document.createElement('button');
    likeButton.className = 'article-like-btn homepage-like-btn'; // Classe specifica per homepage
    likeButton.setAttribute('data-article-id', article.id);
    likeButton.innerHTML = `🤍`; // Icona iniziale, verrà aggiornata da JS
    likeButton.title = "Like this article";

    const likeCountSpan = document.createElement('span');
    likeCountSpan.className = 'article-like-count homepage-like-count';
    likeCountSpan.textContent = `${article.likesPlaceholder || 0}`; // Placeholder iniziale

    likeContainer.appendChild(likeButton);
    likeContainer.appendChild(likeCountSpan);
    interactionsEl.appendChild(likeContainer);

    // Contatore e link Commenti
    const commentContainer = document.createElement('div');
    commentContainer.className = 'interaction-item comment-interaction-homepage';

    const commentIcon = document.createElement('span');
    commentIcon.className = 'comment-icon-homepage';
    commentIcon.innerHTML = '💬';

    const commentCountSpan = document.createElement('span');
    commentCountSpan.className = 'article-comment-count homepage-comment-count';
    commentCountSpan.textContent = `${article.commentsPlaceholder || 0}`; // Placeholder iniziale
    commentContainer.appendChild(commentIcon);
    commentContainer.appendChild(commentCountSpan);

    // Link per andare alla pagina dell'articolo (e poi alla sezione commenti)
    const commentLink = document.createElement('a');
    commentLink.className = 'article-comment-link-homepage';
    commentLink.href = `view-article.html?id=${article.id}#articleCommentsSectionContainer`;
    commentLink.textContent = "Commenta";
    commentLink.title = "View comments and comment";
    
    // Potremmo aggiungere il link commenta come parte del container o separato
    // Per ora, mettiamolo vicino al conteggio
    commentContainer.appendChild(commentLink);


    interactionsEl.appendChild(commentContainer);
    card.appendChild(interactionsEl);
    // --- FINE MODIFICHE PER LIKE E COMMENTI ---

    const linkEl = document.createElement('a');
    linkEl.className = 'btn-read-more';
    linkEl.href = `view-article.html?id=${article.id}`;
    linkEl.textContent = 'Leggi di più →';
    card.appendChild(linkEl);

    gridContainer.appendChild(card);
}

/**
 * Visualizza la sezione articoli e l'articolo in evidenza.
 */
export function displayArticlesSection() {
    const articlesSection = document.getElementById('articlesSection');
    const articlesGrid = document.getElementById('articlesGrid');
    const featuredArticleCard = document.getElementById('featuredArticleCard');
    const featuredArticleTitleEl = document.getElementById('featuredArticleActualTitle');
    const featuredArticleSnippetEl = document.getElementById('featuredArticleSnippet');
    const featuredArticleLinkEl = document.getElementById('featuredArticleLink');

    if (!articlesSection || !articlesGrid || !featuredArticleCard || !featuredArticleTitleEl || !featuredArticleSnippetEl || !featuredArticleLinkEl) {
        console.warn("Elementi DOM per la sezione articoli non trovati.");
        return;
    }

    const placeholderGrid = articlesGrid.querySelector('p');
    if(placeholderGrid) placeholderGrid.remove();
    articlesGrid.innerHTML = '';


    if (sampleArticles && sampleArticles.length > 0) {
        const featuredArticle = sampleArticles.find(article => article.featured) || sampleArticles[0];

        if (featuredArticle) {
            featuredArticleTitleEl.textContent = featuredArticle.title;
            featuredArticleSnippetEl.textContent = featuredArticle.snippet;
            featuredArticleLinkEl.href = `view-article.html?id=${featuredArticle.id}`;
            featuredArticleCard.style.display = 'flex'; // Assicurati che sia 'flex' se usi flexbox per la card
        }

        sampleArticles.forEach(article => {
            createArticleCard(article, articlesGrid);
        });
        articlesSection.style.display = 'block';
    } else {
        articlesSection.style.display = 'none';
        featuredArticleCard.style.display = 'none';
        if (placeholderGrid) articlesGrid.appendChild(placeholderGrid);
    }
}

/**
 * Mostra il banner dell'ultimo giocatore che ha sconfitto Glitchzilla.
 * Per ora, usa dati placeholder.
 */
export function displayGlitchzillaBanner() {
    const bannerElement = document.getElementById('glitchzillaDefeatedBanner');
    const defeaterNameElement = document.getElementById('lastGlitchzillaDefeater');

    if (!bannerElement || !defeaterNameElement) {
        console.warn("Elementi DOM per il banner Glitchzilla non trovati.");
        return;
    }

    // --- DATI PLACEHOLDER ---
    // In futuro (Task C.3.4), questa informazione verrà da Firestore.
    const lastDefeaterData = {
        name: "cYd3R_pUnK_2077", // Nome placeholder
        defeated: true // Flag per indicare se qualcuno l'ha sconfitto
    };
    // --- FINE DATI PLACEHOLDER ---

    if (lastDefeaterData && lastDefeaterData.defeated && lastDefeaterData.name) {
        defeaterNameElement.textContent = lastDefeaterData.name;
        bannerElement.style.display = 'block'; // Mostra il banner
        console.log(`Banner Glitchzilla mostrato per: ${lastDefeaterData.name}`);
    } else {
        bannerElement.style.display = 'none'; // Nascondi il banner se non ci sono dati o non è stato sconfitto
        console.log("Banner Glitchzilla nascosto (nessun dato o Glitchzilla non sconfitto).");
    }
}