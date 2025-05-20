// js/homePageFeatures.js
import { db, generateBlockieAvatar } from './main.js'; // Importa generateBlockieAvatar
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    doc,
    getDocs,
    Timestamp,
    documentId // AGGIUNTO: Necessario per la query 'in
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const MAX_FEATURED_ARTICLES = 5; // Definisci quante card mostrare nella griglia normale
// const MAX_FEATURED_FOR_CAROUSEL = 3; // Se avessi un carosello separato
const ARTICLE_SNIPPET_LENGTH = 150; // Usato da te, ma createSnippet nella tua versione non lo usa
const DEFAULT_AUTHOR_AVATAR_PATH = 'assets/images/default-avatar.png';

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
 * @param {object} articleData - L'oggetto articolo da Firestore.
 * @param {string} articleId - L'ID del documento articolo.
 * @param {object|null} authorProfile - Il profilo dell'autore recuperato da userProfiles, o null. // AGGIUNTO PARAMETRO
 * @param {HTMLElement} gridContainer - Il contenitore della griglia a cui appendere la card.
 */
function createArticleCard(articleData, articleId, authorProfile, gridContainer) { // MODIFICATA SIGNATURE
    const card = document.createElement('div');
    card.className = 'article-card'; // Assicurati che questa classe sia stilizzata per la griglia
    card.setAttribute('data-article-id', articleId);

    const titleEl = document.createElement('h4');
    // AGGIUNTO: Link sul titolo
    const titleLink = document.createElement('a');
    titleLink.href = `view-article.html?id=${articleId}`;
    titleLink.textContent = articleData.title || 'Titolo mancante';
    titleLink.classList.add('article-card-title-link'); // Per stile
    titleEl.appendChild(titleLink);
    card.appendChild(titleEl);
    
    // Immagine di copertina (se presente)
    if (articleData.coverImageUrl) {
        const coverImgLink = document.createElement('a');
        coverImgLink.href = `view-article.html?id=${articleId}`;
        const coverImg = document.createElement('img');
        coverImg.src = articleData.coverImageUrl;
        coverImg.alt = `Copertina per ${articleData.title || 'articolo'}`;
        coverImg.className = 'article-card-cover-image'; // Per stile
        coverImgLink.appendChild(coverImg);
        card.appendChild(coverImgLink);
    }


    const metaEl = document.createElement('div');
    metaEl.className = 'article-meta';

    const authorInfoSpan = document.createElement('span');
    authorInfoSpan.className = 'article-author-info';

    // --- MODIFICATO: Logica Avatar e Nome Autore ---
    let authorDisplayName = articleData.authorName || 'Autore Sconosciuto';
    let authorAvatarSrc = DEFAULT_AUTHOR_AVATAR_PATH;
    let authorNationalityCode = articleData.authorNationalityCode || null; // Prendi da articolo come fallback

    if (authorProfile) {
        authorDisplayName = authorProfile.nickname || authorDisplayName;
        authorNationalityCode = authorProfile.nationalityCode || authorNationalityCode; // Sovrascrivi se presente nel profilo

        let chosenAvatarUrl = null;
        if (authorProfile.avatarUrls) {
            if (authorProfile.avatarUrls.small) {
                chosenAvatarUrl = authorProfile.avatarUrls.small;
            } else if (authorProfile.avatarUrls.profile) {
                chosenAvatarUrl = authorProfile.avatarUrls.profile;
            }
        }

        if (chosenAvatarUrl) {
            authorAvatarSrc = chosenAvatarUrl;
            if (authorProfile.profileUpdatedAt && authorProfile.profileUpdatedAt.seconds) {
                authorAvatarSrc += `?v=${authorProfile.profileUpdatedAt.seconds}`;
            }
        } else if (articleData.authorId) { // Profilo trovato ma senza avatar validi
            authorAvatarSrc = generateBlockieAvatar(articleData.authorId, 24); // Dimensione per homepage
        }
    } else if (articleData.authorId) { // Profilo non trovato, ma c'è ID autore
        authorAvatarSrc = generateBlockieAvatar(articleData.authorId, 24);
    }
    // Se authorId non c'è, rimane il DEFAULT_AUTHOR_AVATAR_PATH

    const avatarImg = document.createElement('img');
    avatarImg.className = 'author-avatar-homepage'; // Assicurati che questa classe sia stilizzata (es. 24x24px, rounded)
    avatarImg.src = authorAvatarSrc;
    avatarImg.alt = `Avatar di ${authorDisplayName}`;
    avatarImg.onerror = () => { avatarImg.src = DEFAULT_AUTHOR_AVATAR_PATH; avatarImg.onerror = null; };
    authorInfoSpan.appendChild(avatarImg);
    // --- FINE MODIFICA AVATAR ---

    const authorNameContainer = document.createElement('span');
    authorNameContainer.className = 'article-author-name';

    if (articleData.authorId) {
        const authorLink = document.createElement('a');
        authorLink.href = `profile.html?userId=${articleData.authorId}`;
        authorLink.textContent = authorDisplayName; // Usa il nome aggiornato dal profilo se disponibile
        authorNameContainer.appendChild(authorLink);
    } else {
        authorNameContainer.textContent = authorDisplayName;
    }
    authorInfoSpan.appendChild(authorNameContainer);

    if (authorNationalityCode && authorNationalityCode !== 'OTHER' && typeof authorNationalityCode === 'string') {
        const flagIcon = document.createElement('span');
        flagIcon.classList.add('fi', `fi-${authorNationalityCode.toLowerCase()}`);
        flagIcon.title = authorNationalityCode;
        flagIcon.style.marginLeft = '5px'; // Aggiungi un po' di spazio
        authorInfoSpan.appendChild(flagIcon);
    }
    metaEl.appendChild(authorInfoSpan);

    const dateEl = document.createElement('span');
    dateEl.className = 'article-date';
    const dateValueForCard = articleData.publishedAt || articleData.createdAt;
    dateEl.textContent = formatArticleDate(dateValueForCard);
    metaEl.appendChild(dateEl);

    if (articleData.tags && Array.isArray(articleData.tags) && articleData.tags.length > 0) {
        // ... (la tua logica per i tag non cambia)
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'article-tags';
        articleData.tags.slice(0, 3).forEach((tagText) => { // Mostra max 3 tag per brevità
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
    
    const interactionsEl = document.createElement('div');
    interactionsEl.className = 'article-card-interactions';
    // ... (la tua logica per like e commenti (solo display) qui, come nel tuo file, non cambia)
     // Like
    const likeContainer = document.createElement('div');
    likeContainer.className = 'interaction-item like-interaction-homepage';
    const likeIcon = document.createElement('span'); // Usiamo solo l'icona e il conteggio
    likeIcon.className = 'material-symbols-rounded';
    likeIcon.innerHTML = 'favorite'; // o 'favorite_border' se vuoi indicare non-liked
    likeIcon.title = 'Mi piace';
    const likeCountSpan = document.createElement('span');
    likeCountSpan.className = 'article-like-count homepage-like-count';
    likeCountSpan.textContent = `${articleData.likeCount || 0}`;
    likeContainer.appendChild(likeIcon);
    likeContainer.appendChild(likeCountSpan);
    interactionsEl.appendChild(likeContainer);

    // Commenti
    const commentContainer = document.createElement('div');
    commentContainer.className = 'interaction-item comment-interaction-homepage';
    const commentIcon = document.createElement('span');
    commentIcon.className = 'comment-icon-homepage material-symbols-rounded';
    commentIcon.innerHTML = 'chat_bubble'; // o 'chat_bubble_outline'
    const commentCountSpan = document.createElement('span');
    commentCountSpan.className = 'article-comment-count homepage-comment-count';
    commentCountSpan.textContent = `${articleData.commentCount || 0}`;
    commentContainer.appendChild(commentIcon);
    commentContainer.appendChild(commentCountSpan);
    interactionsEl.appendChild(commentContainer);

    card.appendChild(interactionsEl);

    const readMoreLinkEl = document.createElement('a');
    readMoreLinkEl.className = 'btn-read-more'; // Stila questo come un bottone o link prominente
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
    // ... (elementi featured come nel tuo file)
    const featuredArticleCard = document.getElementById('featuredArticleCard');
    const featuredArticleTitleEl = document.getElementById('featuredArticleActualTitle');
    const featuredArticleSnippetEl = document.getElementById('featuredArticleSnippet');
    const featuredArticleLinkEl = document.getElementById('featuredArticleLink');


    if (!articlesSection || !articlesGrid ) { /* ... errore critico ... */ 
        console.error('[homePageFeatures.js] articlesSection o articlesGrid non trovato.');
        return;
    }
    
    const featuredElementsPresent = featuredArticleCard && featuredArticleTitleEl && featuredArticleSnippetEl && featuredArticleLinkEl;
    if (!featuredElementsPresent) {
        console.warn('[homePageFeatures.js] Elementi per Articolo in Evidenza mancanti. Funzionalità disabilitata.');
        if(featuredArticleCard) featuredArticleCard.style.display = 'none';
    }


    articlesGrid.innerHTML = '<p style="text-align:center; color:var(--text-color-muted); grid-column: 1 / -1;">Caricamento articoli...</p>';
    articlesSection.style.display = 'block';
    if (featuredArticleCard && featuredElementsPresent) featuredArticleCard.style.display = 'none'; // Nascondi inizialmente

    if (!db) { /* ... errore db ... */ 
        console.error('[homePageFeatures.js] Istanza Firestore (db) non disponibile.');
        articlesGrid.innerHTML = '<p style="text-align:center; color:red;">Errore: Connessione al database non disponibile.</p>';
        return;
    }

    try {
        const articlesCollectionRef = collection(db, 'articles');
        const q = query(
            articlesCollectionRef,
            where('status', '==', 'published'),
            orderBy('publishedAt', 'desc'),
            limit(10) // Recupera un po' di più per avere scelta per il featured e la griglia
        );

        const querySnapshot = await getDocs(q);
        const articlesFromDb = [];
        querySnapshot.forEach((doc) => {
            articlesFromDb.push({ id: doc.id, ...doc.data() });
        });

        articlesGrid.innerHTML = ''; 

        // --- AGGIUNTO: Recupero profili autori con query 'in' ---
        const authorIdsToFetch = [...new Set(articlesFromDb
            .map(article => article.authorId)
            .filter(id => id) // Escludi articoli senza authorId
        )];

        const profilesMap = new Map();
        if (authorIdsToFetch.length > 0) {
            const MAX_IDS_PER_IN_QUERY = 30;
            const profilePromises = [];
            for (let i = 0; i < authorIdsToFetch.length; i += MAX_IDS_PER_IN_QUERY) {
                const batchUserIds = authorIdsToFetch.slice(i, i + MAX_IDS_PER_IN_QUERY);
                const profilesQuery = query(collection(db, 'userProfiles'), where(documentId(), 'in', batchUserIds));
                profilePromises.push(getDocs(profilesQuery));
            }
            try {
                const profileSnapshotsArray = await Promise.all(profilePromises);
                profileSnapshotsArray.forEach(profileSnaps => {
                    profileSnaps.forEach(snap => {
                        if (snap.exists()) {
                            profilesMap.set(snap.id, snap.data());
                        }
                    });
                });
            } catch (profileError) {
                console.error("[homePageFeatures.js] Errore recupero profili autori per homepage:", profileError);
            }
        }
        // --- FINE RECUPERO PROFILI ---

        let actualFeaturedArticleData = null;
        if (articlesFromDb.length > 0 && featuredElementsPresent) {
            actualFeaturedArticleData = articlesFromDb.find(article => article.isFeatured === true) || articlesFromDb[0];
            if (actualFeaturedArticleData) {
                // Popola la card dell'articolo in evidenza
                if (featuredArticleTitleEl) featuredArticleTitleEl.textContent = actualFeaturedArticleData.title || 'N/D';
                if (featuredArticleSnippetEl) {
                    featuredArticleSnippetEl.textContent = actualFeaturedArticleData.snippet || 
                        (actualFeaturedArticleData.contentMarkdown ? actualFeaturedArticleData.contentMarkdown.substring(0, 150) + '...' : 'Leggi...');
                }
                if (featuredArticleLinkEl) featuredArticleLinkEl.href = `view-article.html?id=${actualFeaturedArticleData.id}`;
                
                // --- AGGIUNTO: Avatar per l'articolo in evidenza ---
                const featuredAuthorAvatarElement = document.getElementById('featuredArticleAuthorAvatar'); // Assicurati che esista questo ID
                const featuredAuthorNameElement = document.getElementById('featuredArticleAuthorName');   // Assicurati che esista questo ID
                
                if (featuredAuthorAvatarElement && featuredAuthorNameElement) {
                    let featAuthorName = actualFeaturedArticleData.authorName || 'Autore Sconosciuto';
                    let featAuthorAvatarSrc = DEFAULT_AUTHOR_AVATAR_PATH;
                    const featAuthorProfile = actualFeaturedArticleData.authorId ? profilesMap.get(actualFeaturedArticleData.authorId) : null;

                    if (featAuthorProfile) {
                        featAuthorName = featAuthorProfile.nickname || featAuthorName;
                        let chosenFeatAvatarUrl = null;
                        if (featAuthorProfile.avatarUrls) {
                            if (featAuthorProfile.avatarUrls.small) chosenFeatAvatarUrl = featAuthorProfile.avatarUrls.small;
                            else if (featAuthorProfile.avatarUrls.profile) chosenFeatAvatarUrl = featAuthorProfile.avatarUrls.profile;
                        }
                        if (chosenFeatAvatarUrl) {
                            featAuthorAvatarSrc = chosenFeatAvatarUrl;
                            if (featAuthorProfile.profileUpdatedAt && featAuthorProfile.profileUpdatedAt.seconds) {
                                featAuthorAvatarSrc += `?v=${featAuthorProfile.profileUpdatedAt.seconds}`;
                            }
                        } else if (actualFeaturedArticleData.authorId) {
                            featAuthorAvatarSrc = generateBlockieAvatar(actualFeaturedArticleData.authorId, 32); // Dimensione per featured
                        }
                    } else if (actualFeaturedArticleData.authorId) {
                        featAuthorAvatarSrc = generateBlockieAvatar(actualFeaturedArticleData.authorId, 32);
                    }
                    featuredAuthorAvatarElement.src = featAuthorAvatarSrc;
                    featuredAuthorAvatarElement.alt = `Avatar di ${featAuthorName}`;
                    featuredAuthorAvatarElement.onerror = () => { featuredAuthorAvatarElement.src = DEFAULT_AUTHOR_AVATAR_PATH; featuredAuthorAvatarElement.onerror = null; };
                    
                    if (actualFeaturedArticleData.authorId) {
                        featuredAuthorNameElement.innerHTML = `<a href="profile.html?userId=${actualFeaturedArticleData.authorId}">${featAuthorName}</a>`;
                    } else {
                        featuredAuthorNameElement.textContent = featAuthorName;
                    }
                }
                // --- FINE AVATAR FEATURED ---
                if (featuredArticleCard) featuredArticleCard.style.display = 'flex'; // o 'block' a seconda del tuo CSS
            }
        }

        let articlesAddedToGrid = 0;
        articlesFromDb.forEach((articleDataInLoop) => {
            if (!actualFeaturedArticleData || articleDataInLoop.id !== actualFeaturedArticleData.id) {
                if (articlesAddedToGrid < MAX_FEATURED_ARTICLES) { // Mostra MAX_FEATURED_ARTICLES nella griglia
                    const authorProfileForCard = articleDataInLoop.authorId ? profilesMap.get(articleDataInLoop.authorId) : null;
                    createArticleCard(articleDataInLoop, articleDataInLoop.id, authorProfileForCard, articlesGrid);
                    articlesAddedToGrid++;
                }
            }
        });

        if (articlesFromDb.length === 0) { /* ... nessun articolo ... */ 
            articlesGrid.innerHTML = '<p style="text-align:center; color:var(--text-color-muted); grid-column: 1 / -1;">Nessun articolo pubblicato trovato.</p>';
            if (featuredArticleCard && featuredElementsPresent) featuredArticleCard.style.display = 'none';
        } else if (articlesAddedToGrid === 0 && actualFeaturedArticleData) { /* ... solo featured ... */ 
            articlesGrid.innerHTML = '<p style="text-align:center; color:var(--text-color-muted); grid-column: 1 / -1;">Nessun altro articolo da visualizzare al momento.</p>';
        }
        
    } catch (error) { /* ... gestione errore ... */ 
        console.error('[homePageFeatures.js] Errore durante il caricamento degli articoli:', error);
        articlesGrid.innerHTML = '<p style="text-align:center; color:red;">Errore nel caricamento degli articoli. Controlla la console.</p>';
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
            articlesGrid.innerHTML += '<p style="text-align:center; color:orange;">Indice Firestore mancante...</p>';
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

// Initialize features when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Verifica che esista la sezione prima di chiamare la funzione
    if (document.getElementById('articlesSection') && document.getElementById('articlesGrid')) {
        displayArticlesSection();
    }
    if (document.getElementById('glitchzillaDefeatedBanner')) {
        displayGlitchzillaBanner(); // Se vuoi che sia chiamata al DOMContentLoaded
    }
});
