// js/homePageFeatures.js
import { db, generateBlockieAvatar } from './main.js'; // Importa generateBlockieAvatar
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

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
            if (isNaN(date.getTime())) {
                // Controlla se la data parsata è valida
                console.warn('Formato stringa data non riconosciuto in formatArticleDate:', dateInput);
                return 'Data invalida';
            }
        } else if (dateInput && typeof dateInput.seconds === 'number' && typeof dateInput.nanoseconds === 'number') {
            // Gestisce l'oggetto grezzo che Firestore potrebbe restituire in alcuni contesti o da vecchi dati
            date = new Timestamp(dateInput.seconds, dateInput.nanoseconds).toDate();
        } else {
            console.warn('Formato data non gestito in formatArticleDate:', dateInput);
            return 'Formato data sconosciuto';
        }
        return date.toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
        console.error('Errore formattazione data articolo:', e, 'Input:', dateInput);
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
    titleEl.textContent = articleData.title || 'Titolo mancante';
    card.appendChild(titleEl);

    const metaEl = document.createElement('div');
    metaEl.className = 'article-meta';

    const authorInfoSpan = document.createElement('span');
    authorInfoSpan.className = 'article-author-info';

    if (articleData.authorId) {
        const avatarImg = document.createElement('img');
        avatarImg.className = 'author-avatar-homepage';
        avatarImg.src = generateBlockieAvatar(articleData.authorId, 24);
        avatarImg.alt = `Avatar di ${articleData.authorName || 'Autore'}`;
        authorInfoSpan.appendChild(avatarImg);
    }

    const authorNameContainer = document.createElement('span');
    authorNameContainer.className = 'article-author-name';

    if (articleData.authorId) {
        const authorLink = document.createElement('a');
        authorLink.href = `profile.html?userId=${articleData.authorId}`;
        authorLink.textContent = articleData.authorName || 'Autore Sconosciuto';
        authorNameContainer.appendChild(authorLink);
    } else {
        authorNameContainer.textContent = articleData.authorName || 'Autore Sconosciuto';
    }
    authorInfoSpan.appendChild(authorNameContainer);

    if (
        articleData.authorNationalityCode &&
        articleData.authorNationalityCode !== 'OTHER' &&
        typeof articleData.authorNationalityCode === 'string'
    ) {
        const flagIcon = document.createElement('span');
        flagIcon.classList.add('fi', `fi-${articleData.authorNationalityCode.toLowerCase()}`);
        flagIcon.title = articleData.authorNationalityCode;
        authorInfoSpan.appendChild(flagIcon);
    }
    metaEl.appendChild(authorInfoSpan);

    const dateEl = document.createElement('span');
    dateEl.className = 'article-date';
    const dateValueForCard = articleData.publishedAt || articleData.createdAt;
    dateEl.textContent = formatArticleDate(dateValueForCard);
    metaEl.appendChild(dateEl);

    if (articleData.tags && Array.isArray(articleData.tags) && articleData.tags.length > 0) {
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'article-tags';
        articleData.tags.forEach((tagText) => {
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
    snippetEl.textContent = articleData.snippet || 'Nessun riassunto disponibile.';
    card.appendChild(snippetEl);

    // --- MODIFICHE QUI ---
    const interactionsEl = document.createElement('div');
    interactionsEl.className = 'article-card-interactions';

    // Like
    const likeContainer = document.createElement('div');
    likeContainer.className = 'interaction-item like-interaction-homepage';
    const likeButton = document.createElement('button');
    likeButton.className = 'article-like-btn homepage-like-btn'; // Manteniamo le classi esistenti per CSS e JS
    likeButton.setAttribute('data-article-id', articleId);
    // Sostituisci l'emoji con Material Symbol
    likeButton.innerHTML = `<span class="material-symbols-rounded">favorite_border</span>`;
    likeButton.title = 'Like this article'; // Il titolo verrà aggiornato dinamicamente
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
    // Applica la classe Material Symbols e usa il nome dell'icona
    commentIcon.className = 'comment-icon-homepage material-symbols-rounded';
    commentIcon.innerHTML = 'chat_bubble_outline'; // o 'comment'
    const commentCountSpan = document.createElement('span');
    commentCountSpan.className = 'article-comment-count homepage-comment-count';
    commentCountSpan.textContent = `${articleData.commentCount || 0}`;
    const commentLink = document.createElement('a');
    commentLink.className = 'article-comment-link-homepage';
    commentLink.href = `view-article.html?id=${articleId}#articleCommentsSectionContainer`;
    commentLink.textContent = 'Commenta';
    commentLink.title = 'Vedi e aggiungi commenti';
    commentContainer.appendChild(commentIcon); // Icona
    commentContainer.appendChild(commentCountSpan); // Conteggio
    commentContainer.appendChild(commentLink); // Link testuale "Commenta"
    interactionsEl.appendChild(commentContainer);
    // --- FINE MODIFICHE ---

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
    // console.log('[homePageFeatures.js] displayArticlesSection chiamata.'); // DEBUG

    const articlesSection = document.getElementById('articlesSection');
    const articlesGrid = document.getElementById('articlesGrid');

    // Elementi per l'articolo in evidenza
    const featuredArticleCard = document.getElementById('featuredArticleCard');
    const featuredArticleTitleEl = document.getElementById('featuredArticleActualTitle');
    const featuredArticleSnippetEl = document.getElementById('featuredArticleSnippet');
    const featuredArticleLinkEl = document.getElementById('featuredArticleLink');

    // Verifica elementi essenziali per la griglia articoli
    if (!articlesSection) {
        console.error(
            '[homePageFeatures.js] Errore critico: Elemento #articlesSection non trovato. Impossibile continuare.'
        );
        return;
    }
    if (!articlesGrid) {
        console.error(
            '[homePageFeatures.js] Errore critico: Elemento #articlesGrid non trovato. Impossibile continuare.'
        );
        articlesSection.style.display = 'block';
        articlesSection.innerHTML =
            '<p style="color:red; text-align:center;">Errore di configurazione: contenitore griglia articoli mancante.</p>';
        return;
    }

    // Verifica elementi per l'articolo in evidenza.
    const featuredElementsPresent =
        featuredArticleCard && featuredArticleTitleEl && featuredArticleSnippetEl && featuredArticleLinkEl;
    if (!featuredElementsPresent) {
        console.warn(
            '[homePageFeatures.js] Uno o più elementi DOM per "Articolo in Evidenza" non trovati. La funzionalità Featured Article sarà disabilitata per questa esecuzione.'
        );
        if (featuredArticleCard) featuredArticleCard.style.display = 'none';
    }

    // Mostra il messaggio di caricamento nella griglia e rendi visibile la sezione
    articlesGrid.innerHTML =
        '<p style="text-align:center; color:var(--text-color-muted); grid-column: 1 / -1;">Caricamento articoli da Firestore...</p>';
    articlesSection.style.display = 'block';

    // Nascondi la card dell'articolo in evidenza se gli elementi sono presenti (verrà mostrata se c'è un articolo featured)
    if (featuredArticleCard && featuredElementsPresent) {
        featuredArticleCard.style.display = 'none';
    }

    if (!db) {
        console.error('[homePageFeatures.js] Istanza Firestore (db) non disponibile.');
        articlesGrid.innerHTML =
            '<p style="text-align:center; color:red;">Errore: Connessione al database non disponibile.</p>';
        return;
    }

    try {
        const articlesCollectionRef = collection(db, 'articles');
        const q = query(
            articlesCollectionRef,
            where('status', '==', 'published'),
            orderBy('publishedAt', 'desc'),
            limit(10)
        );

        const querySnapshot = await getDocs(q);
        const articlesFromDb = [];
        querySnapshot.forEach((doc) => {
            articlesFromDb.push({ id: doc.id, ...doc.data() });
        });
        // console.log('[homePageFeatures.js] Articoli fetched:', articlesFromDb.length);

        articlesGrid.innerHTML = ''; // Pulisci la griglia ("Caricamento...")

        let actualFeaturedArticleData = null;

        if (articlesFromDb.length > 0) {
            // Solo se ci sono articoli, gestisci il featured (se gli elementi DOM esistono)
            if (featuredElementsPresent) {
                actualFeaturedArticleData =
                    articlesFromDb.find((article) => article.isFeatured === true) || articlesFromDb[0];

                if (actualFeaturedArticleData) {
                    if (featuredArticleTitleEl)
                        featuredArticleTitleEl.textContent =
                            actualFeaturedArticleData.title || 'Titolo non disponibile';
                    if (featuredArticleSnippetEl) {
                        featuredArticleSnippetEl.textContent =
                            actualFeaturedArticleData.snippet ||
                            (actualFeaturedArticleData.contentMarkdown
                                ? actualFeaturedArticleData.contentMarkdown.substring(0, 150) + '...'
                                : 'Leggi di più...');
                    }
                    if (featuredArticleLinkEl)
                        featuredArticleLinkEl.href = `view-article.html?id=${actualFeaturedArticleData.id}`;
                    if (featuredArticleCard) featuredArticleCard.style.display = 'flex';
                }
            }
        }

        let articlesAddedToGrid = 0;
        articlesFromDb.forEach((articleDataInLoop) => {
            if (!actualFeaturedArticleData || articleDataInLoop.id !== actualFeaturedArticleData.id) {
                if (typeof createArticleCard === 'function') {
                    createArticleCard(articleDataInLoop, articleDataInLoop.id, articlesGrid);
                    articlesAddedToGrid++;
                } else {
                    console.error('[homePageFeatures.js] Funzione createArticleCard non definita!');
                }
            }
        });
        // console.log('[homePageFeatures.js] Articoli aggiunti alla griglia (escluso featured):', articlesAddedToGrid);

        if (articlesFromDb.length === 0) {
            articlesGrid.innerHTML =
                '<p style="text-align:center; color:var(--text-color-muted); grid-column: 1 / -1;">Nessun articolo pubblicato trovato.</p>';
            if (featuredArticleCard && featuredElementsPresent) featuredArticleCard.style.display = 'none';
        } else if (articlesAddedToGrid === 0 && actualFeaturedArticleData) {
            // Questo caso si verifica se l'unico articolo è quello in evidenza
            articlesGrid.innerHTML =
                '<p style="text-align:center; color:var(--text-color-muted); grid-column: 1 / -1;">Nessun altro articolo da visualizzare al momento.</p>';
        }
    } catch (error) {
        console.error('[homePageFeatures.js] Errore durante il caricamento degli articoli:', error);
        articlesGrid.innerHTML =
            '<p style="text-align:center; color:red;">Errore nel caricamento degli articoli. Controlla la console.</p>';
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
            articlesGrid.innerHTML +=
                '<p style="text-align:center; color:orange;">Indice Firestore mancante. Controlla la console del browser per il link per crearlo.</p>';
        }
        if (featuredArticleCard && featuredElementsPresent) featuredArticleCard.style.display = 'none';
    }
}

/**
 * Mostra il banner dell'ultimo giocatore che ha sconfitto Glitchzilla.
 */
export function displayGlitchzillaBanner() {
    const bannerElement = document.getElementById('glitchzillaDefeatedBanner');
    const defeaterNameElement = document.getElementById('lastGlitchzillaDefeater');

    if (!bannerElement || !defeaterNameElement) {
        return;
    }

    // Dati placeholder, da sostituire con logica Firestore (Task C.3.4)
    const lastDefeaterData = {
        name: 'cYd3R_pUnK_2077',
        defeated: true, // Simula che sia stato sconfitto per mostrare il banner
    };

    if (lastDefeaterData && lastDefeaterData.defeated && lastDefeaterData.name) {
        defeaterNameElement.textContent = lastDefeaterData.name;
        bannerElement.style.display = 'block';
    } else {
        bannerElement.style.display = 'none';
    }
}
