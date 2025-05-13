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

    // NUOVA SEZIONE PER STATISTICHE ARTICOLO (LIKE/COMMENTI)
    const statsEl = document.createElement('div');
    statsEl.className = 'article-stats';

    // Placeholder per i Like
    const likesBadge = document.createElement('span');
    likesBadge.className = 'article-stat-badge article-likes-badge';
    likesBadge.innerHTML = `<span class="stat-icon">❤️</span> <span class="stat-count">${article.likesPlaceholder || 0}</span>`; // Usiamo article.likesPlaceholder se lo aggiungeremo ai dati statici, altrimenti 0
    likesBadge.title = `${article.likesPlaceholder || 0} Likes`;
    statsEl.appendChild(likesBadge);

    // Placeholder per i Commenti
    const commentsBadge = document.createElement('span');
    commentsBadge.className = 'article-stat-badge article-comments-badge';
    commentsBadge.innerHTML = `<span class="stat-icon">💬</span> <span class="stat-count">${article.commentsPlaceholder || 0}</span>`; // Usiamo article.commentsPlaceholder se lo aggiungeremo, altrimenti 0
    commentsBadge.title = `${article.commentsPlaceholder || 0} Commenti`;
    statsEl.appendChild(commentsBadge);
    
    card.appendChild(statsEl); // Aggiungi il contenitore delle statistiche alla card

    const linkEl = document.createElement('a');
    linkEl.className = 'btn-read-more';
    // MODIFICA QUI:
    linkEl.href = `view-article.html?id=${article.id}`; // Passa l'ID dell'articolo come parametro URL
    linkEl.textContent = 'Leggi di più →';
    // Rimuovi l'alert per il link placeholder se ora punta a una pagina reale
    // if (article.link === "#") { 
    //     linkEl.onclick = (e) => { e.preventDefault(); alert('Articolo non ancora disponibile!'); };
    // }
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

    // Pulisci la griglia e placeholder
    const placeholderGrid = articlesGrid.querySelector('p');
    if(placeholderGrid) placeholderGrid.remove();
    articlesGrid.innerHTML = '';


    if (sampleArticles && sampleArticles.length > 0) {
        // Trova l'articolo in evidenza
        const featuredArticle = sampleArticles.find(article => article.featured) || sampleArticles[0]; // Prendi il primo se nessuno è marked 'featured'

        if (featuredArticle) {
            featuredArticleTitleEl.textContent = featuredArticle.title;
            featuredArticleSnippetEl.textContent = featuredArticle.snippet;
            // MODIFICA QUI:
            featuredArticleLinkEl.href = `view-article.html?id=${featuredArticle.id}`;
            // Rimuovi l'alert per il link placeholder
            // if (featuredArticle.link === "#") {
            //    featuredArticleLinkEl.onclick = (e) => { e.preventDefault(); alert('Articolo non ancora disponibile!'); };
            // } else {
            //    featuredArticleLinkEl.onclick = null;
            // }
            featuredArticleCard.style.display = 'flex';
        }

        // Popola la griglia degli articoli (escludendo quello già mostrato come featured, se diverso)
        sampleArticles.forEach(article => {
            // if (!article.featured || article.id !== featuredArticle.id) { // Opzionale: non ripetere il featured nella griglia
                createArticleCard(article, articlesGrid);
            // }
        });
        articlesSection.style.display = 'block'; // Mostra la sezione articoli
    } else {
        articlesSection.style.display = 'none'; // Nascondi se non ci sono articoli
        featuredArticleCard.style.display = 'none';
        if (placeholderGrid) articlesGrid.appendChild(placeholderGrid); // Ripristina placeholder
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