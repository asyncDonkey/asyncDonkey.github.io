// js/homePageFeatures.js
import { db, generateBlockieAvatar } from './main.js'; // Importa generateBlockieAvatar
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    doc,
    getDoc,
    getDocs,
    Timestamp,
    documentId, // AGGIUNTO: Necessario per la query 'in
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const MAX_ARTICLES_ON_HOME = 6; // Mostra l'articolo in evidenza + 5 nella griglia

// const MAX_FEATURED_FOR_CAROUSEL = 3; // Se avessi un carosello separato
const ARTICLE_SNIPPET_LENGTH = 150; // Usato da te, ma createSnippet nella tua versione non lo usa
const DEFAULT_AUTHOR_AVATAR_PATH = 'assets/images/default-avatar.png';

/**
 * Formatta un oggetto Timestamp di Firestore o una stringa data in un formato leggibile.
 * @param {object|string|null|undefined} dateInput - Timestamp di Firestore o stringa data.
 * @returns {string} Data formattata.
 */
export function formatArticleDate(dateInput) {
    if (!dateInput) return 'Data non disponibile';
    try {
        let date;
        if (dateInput instanceof Timestamp) {
            date = dateInput.toDate();
        } else if (dateInput && typeof dateInput.seconds === 'number') {
            date = new Timestamp(dateInput.seconds, dateInput.nanoseconds).toDate();
        } else {
            return 'Data invalida';
        }
        return date.toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
        console.error('Errore formattazione data articolo:', e, 'Input:', dateInput);
        return 'Errore data';
    }
}

/**
 * Crea e restituisce un elemento DOM per una card articolo.
 * @param {object} articleData - Dati dell'articolo da Firestore.
 * @param {string} articleId - ID del documento articolo.
 * @param {object|null} authorPublicProfile - Profilo pubblico dell'autore.
 * @param {boolean} isFeatured - Se true, applica la classe 'is-featured'.
 * @returns {HTMLElement} L'elemento della card articolo.
 */
export function createArticleCard(articleData, articleId, authorPublicProfile, isFeatured = false) {
    const card = document.createElement('article');
    card.className = 'article-card';
    if (isFeatured) {
        card.classList.add('is-featured');
    }
    card.setAttribute('data-article-id', articleId);

    // Immagine di copertina (la sua visualizzazione è gestita da CSS)
    if (articleData.coverImageUrl) {
        const coverImgLink = document.createElement('a');
        coverImgLink.href = `view-article.html?id=${articleId}`;
        const coverImg = document.createElement('img');
        coverImg.src = articleData.coverImageUrl;
        coverImg.alt = `Copertina per ${articleData.title || 'articolo'}`;
        coverImg.className = 'article-card-cover-image';
        coverImg.loading = 'lazy'; // Migliora le performance
        coverImgLink.appendChild(coverImg);
        card.appendChild(coverImgLink);
    }

    // Contenuto testuale della card
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'article-card-text-content';

    const titleEl = document.createElement('h4');
    const titleLink = document.createElement('a');
    titleLink.href = `view-article.html?id=${articleId}`;
    titleLink.textContent = articleData.title || 'Titolo mancante';
    titleLink.classList.add('article-card-title-link');
    titleEl.appendChild(titleLink);
    contentWrapper.appendChild(titleEl);

    const metaEl = document.createElement('div');
    metaEl.className = 'article-meta';

    const authorInfoSpan = document.createElement('span');
    authorInfoSpan.className = 'article-author-info';

    let authorDisplayName = articleData.authorName || 'Autore Sconosciuto';
    let authorAvatarSrc = DEFAULT_AUTHOR_AVATAR_PATH;
    let authorNationalityCode = articleData.authorNationalityCode || null;

    if (authorPublicProfile) {
        authorDisplayName = authorPublicProfile.nickname || authorDisplayName;
        authorNationalityCode = authorPublicProfile.nationalityCode || authorNationalityCode;
        if (authorPublicProfile.avatarUrls?.thumbnail) {
            authorAvatarSrc = authorPublicProfile.avatarUrls.thumbnail;
            const lastUpdated = authorPublicProfile.profilePublicUpdatedAt?.seconds || Date.now() / 1000;
            authorAvatarSrc += `?v=${lastUpdated}`;
        } else if (articleData.authorId) {
            authorAvatarSrc = generateBlockieAvatar(articleData.authorId, 24);
        }
    } else if (articleData.authorId) {
        authorAvatarSrc = generateBlockieAvatar(articleData.authorId, 24);
    }

    const avatarImg = document.createElement('img');
    avatarImg.className = 'author-avatar-homepage';
    avatarImg.src = authorAvatarSrc;
    avatarImg.alt = `Avatar di ${authorDisplayName}`;
    avatarImg.onerror = () => {
        avatarImg.src = DEFAULT_AUTHOR_AVATAR_PATH;
        avatarImg.onerror = null;
    };
    authorInfoSpan.appendChild(avatarImg);

    const authorNameContainer = document.createElement('span');
    authorNameContainer.className = 'article-author-name';
    if (articleData.authorId) {
        const authorLink = document.createElement('a');
        authorLink.href = `profile.html?userId=${articleData.authorId}`;
        authorLink.textContent = authorDisplayName;
        authorNameContainer.appendChild(authorLink);
    } else {
        authorNameContainer.textContent = authorDisplayName;
    }
    authorInfoSpan.appendChild(authorNameContainer);

    if (authorNationalityCode && authorNationalityCode !== 'OTHER' && typeof authorNationalityCode === 'string') {
        const flagIcon = document.createElement('span');
        flagIcon.classList.add('fi', `fi-${authorNationalityCode.toLowerCase()}`);
        flagIcon.title = authorNationalityCode;
        flagIcon.style.marginLeft = '5px';
        authorInfoSpan.appendChild(flagIcon);
    }
    metaEl.appendChild(authorInfoSpan);

    const dateEl = document.createElement('span');
    dateEl.className = 'article-date';
    dateEl.textContent = formatArticleDate(articleData.publishedAt || articleData.createdAt);
    metaEl.appendChild(dateEl);

    contentWrapper.appendChild(metaEl);

    const snippetEl = document.createElement('p');
    snippetEl.className = 'article-snippet';
    snippetEl.textContent = articleData.snippet || 'Nessun riassunto disponibile.';
    contentWrapper.appendChild(snippetEl);

    const interactionsEl = document.createElement('div');
    interactionsEl.className = 'article-card-interactions';
    interactionsEl.innerHTML = `
        <div class="interaction-item like-interaction-homepage">
            <span class="material-symbols-rounded">favorite</span>
            <span class="article-like-count homepage-like-count">${articleData.likeCount || 0}</span>
        </div>
        <div class="interaction-item comment-interaction-homepage">
            <span class="material-symbols-rounded">chat_bubble</span>
            <span class="article-comment-count homepage-comment-count">${articleData.commentCount || 0}</span>
        </div>
    `;
    contentWrapper.appendChild(interactionsEl);

    const readMoreLinkEl = document.createElement('a');
    readMoreLinkEl.className = 'btn-read-more';
    readMoreLinkEl.href = `view-article.html?id=${articleId}`;
    readMoreLinkEl.textContent = 'Leggi di più →';
    contentWrapper.appendChild(readMoreLinkEl);

    card.appendChild(contentWrapper);

    return card;
}
/**
 * Visualizza la sezione articoli e l'articolo in evidenza caricandoli da Firestore.
 */
/**
 * Visualizza la sezione articoli caricandoli da Firestore e creando la UI.
 */
export async function displayArticlesSection() {
    const articlesSection = document.getElementById('articlesSection');
    const articlesContainer = document.getElementById('articlesContainer');

    if (!articlesSection || !articlesContainer) {
        console.error('[homePageFeatures.js] Elementi della sezione articoli non trovati.');
        return;
    }

    try {
        const articlesQuery = query(
            collection(db, 'articles'),
            where('status', '==', 'published'),
            orderBy('publishedAt', 'desc'),
            limit(MAX_ARTICLES_ON_HOME)
        );

        const articleSnapshots = await getDocs(articlesQuery);
        if (articleSnapshots.empty) {
            articlesSection.style.display = 'none';
            return;
        }

        const articles = articleSnapshots.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const authorIds = [...new Set(articles.map((a) => a.authorId).filter(Boolean))];

        let profiles = {};
        if (authorIds.length > 0) {
            const profilesQuery = query(collection(db, 'userPublicProfiles'), where(documentId(), 'in', authorIds));
            const profileSnapshots = await getDocs(profilesQuery);
            profileSnapshots.forEach((doc) => {
                profiles[doc.id] = doc.data();
            });
        }

        articlesContainer.innerHTML = ''; // Pulisce il contenitore
        articles.forEach((article, index) => {
            const authorProfile = profiles[article.authorId] || null;
            const isFeatured = index === 0;
            const cardElement = createArticleCard(article, article.id, authorProfile, isFeatured);
            articlesContainer.appendChild(cardElement);
        });

        articlesSection.style.display = 'block'; // Mostra la sezione
    } catch (error) {
        console.error('Errore durante il caricamento degli articoli:', error);
        articlesContainer.innerHTML =
            '<p style="text-align:center; color: var(--error-color);">Impossibile caricare gli articoli.</p>';
        articlesSection.style.display = 'block';
    }
}

/**
 * Mostra il banner dell'ultimo giocatore che ha sconfitto Glitchzilla.
 */
/**
 * Mostra il banner dell'ultimo giocatore che ha sconfitto Glitchzilla recuperando i dati da Firestore.
 */
export async function displayGlitchzillaBanner() {
    const bannerElement = document.getElementById('glitchzillaDefeatedBanner');
    const defeaterNameElement = document.getElementById('lastGlitchzillaDefeater');

    if (!bannerElement || !defeaterNameElement) {
        console.warn('[homePageFeatures.js] Elementi del banner Glitchzilla non trovati.');
        return;
    }

    if (!db) {
        console.error('[homePageFeatures.js] Istanza Firestore (db) non disponibile per il banner.');
        bannerElement.style.display = 'none';
        return;
    }

    try {
        const statsDocRef = doc(db, 'platformInfo', 'glitchzillaStats');
        const docSnap = await getDoc(statsDocRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const winnerNickname = data.lastWinnerNickname;
            const winnerId = data.lastWinnerId;

            if (winnerNickname) {
                // Creiamo un link al profilo del giocatore
                defeaterNameElement.innerHTML = ''; // Pulisce il contenuto precedente
                const profileLink = document.createElement('a');
                profileLink.href = winnerId ? `profile.html?userId=${winnerId}` : '#';
                profileLink.textContent = winnerNickname;
                profileLink.classList.add('player-link'); // Aggiungi una classe per lo stile se vuoi

                defeaterNameElement.appendChild(profileLink);
                bannerElement.style.display = 'block';
            } else {
                bannerElement.style.display = 'none';
            }
        } else {
            // Il documento non esiste, quindi nessuno ha ancora battuto il boss
            bannerElement.style.display = 'none';
        }
    } catch (error) {
        console.error('Errore nel recuperare i dati per il banner di Glitchzilla:', error);
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
