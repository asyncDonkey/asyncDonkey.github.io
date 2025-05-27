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
 * Creates and appends an article card to the DOM.
 * Uses authorProfile (from userPublicProfiles) for avatar and name.
 * @param {object} articleData - The article data from Firestore.
 * @param {string} articleId - The document ID of the article.
 * @param {object|null} authorPublicProfile - The author's public profile data, or null.
 * @param {HTMLElement} gridContainer - The grid container to append the card to.
 */
function createArticleCard(articleData, articleId, authorPublicProfile, gridContainer) {
    const card = document.createElement('div');
    card.className = 'article-card';
    card.setAttribute('data-article-id', articleId);

    const titleEl = document.createElement('h4');
    const titleLink = document.createElement('a');
    titleLink.href = `view-article.html?id=${articleId}`;
    titleLink.textContent = articleData.title || 'Titolo mancante';
    titleLink.classList.add('article-card-title-link');
    titleEl.appendChild(titleLink);
    card.appendChild(titleEl);

    if (articleData.coverImageUrl) {
        const coverImgLink = document.createElement('a');
        coverImgLink.href = `view-article.html?id=${articleId}`;
        const coverImg = document.createElement('img');
        coverImg.src = articleData.coverImageUrl;
        coverImg.alt = `Copertina per ${articleData.title || 'articolo'}`;
        coverImg.className = 'article-card-cover-image';
        coverImgLink.appendChild(coverImg);
        card.appendChild(coverImgLink);
    }

    const metaEl = document.createElement('div');
    metaEl.className = 'article-meta';

    const authorInfoSpan = document.createElement('span');
    authorInfoSpan.className = 'article-author-info';

    let authorDisplayName = articleData.authorName || 'Autore Sconosciuto'; // Fallback to denormalized name on article
    let authorAvatarSrc = DEFAULT_AUTHOR_AVATAR_PATH;
    let authorNationalityCode = articleData.authorNationalityCode || null; // Fallback

    if (authorPublicProfile) {
        authorDisplayName = authorPublicProfile.nickname || authorDisplayName;
        authorNationalityCode = authorPublicProfile.nationalityCode || authorNationalityCode;

        let chosenAvatarUrl = null;
        if (authorPublicProfile.avatarUrls && authorPublicProfile.avatarUrls.thumbnail) {
            // schema uses thumbnail
            chosenAvatarUrl = authorPublicProfile.avatarUrls.thumbnail;
        }
        // No need to check for .small or .profile here if userPublicProfileSync maps them to .thumbnail

        if (chosenAvatarUrl) {
            authorAvatarSrc = chosenAvatarUrl;
            let timestampForCache;
            if (authorPublicProfile.profilePublicUpdatedAt) {
                // Prioritize this from public profile
                timestampForCache = authorPublicProfile.profilePublicUpdatedAt;
            } else if (authorPublicProfile.profileUpdatedAt) {
                // Fallback if profileUpdatedAt is also synced
                timestampForCache = authorPublicProfile.profileUpdatedAt;
            }

            if (timestampForCache && typeof timestampForCache.seconds === 'number') {
                authorAvatarSrc += `?v=${timestampForCache.seconds}`;
            } else if (timestampForCache && typeof timestampForCache === 'number') {
                // e.g. a direct number timestamp
                authorAvatarSrc += `?v=${timestampForCache}`;
            } else if (timestampForCache instanceof Date) {
                authorAvatarSrc += `?v=${Math.floor(timestampForCache.getTime() / 1000)}`;
            }
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
    const dateValueForCard = articleData.publishedAt || articleData.createdAt;
    dateEl.textContent = formatArticleDate(dateValueForCard);
    metaEl.appendChild(dateEl);

    if (articleData.tags && Array.isArray(articleData.tags) && articleData.tags.length > 0) {
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'article-tags';
        articleData.tags.slice(0, 3).forEach((tagText) => {
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
    const likeContainer = document.createElement('div');
    likeContainer.className = 'interaction-item like-interaction-homepage';
    const likeIcon = document.createElement('span');
    likeIcon.className = 'material-symbols-rounded';
    likeIcon.innerHTML = 'favorite';
    likeIcon.title = 'Mi piace';
    const likeCountSpan = document.createElement('span');
    likeCountSpan.className = 'article-like-count homepage-like-count'; // Retain class for main.js to update
    likeCountSpan.textContent = `${articleData.likeCount || 0}`;
    likeContainer.appendChild(likeIcon);
    likeContainer.appendChild(likeCountSpan);
    interactionsEl.appendChild(likeContainer);

    const commentContainer = document.createElement('div');
    commentContainer.className = 'interaction-item comment-interaction-homepage';
    const commentIcon = document.createElement('span');
    commentIcon.className = 'comment-icon-homepage material-symbols-rounded';
    commentIcon.innerHTML = 'chat_bubble';
    const commentCountSpan = document.createElement('span');
    commentCountSpan.className = 'article-comment-count homepage-comment-count'; // Retain class
    commentCountSpan.textContent = `${articleData.commentCount || 0}`;
    commentContainer.appendChild(commentIcon);
    commentContainer.appendChild(commentCountSpan);
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
    const featuredArticleTitleEl = document.getElementById('featuredArticleActualTitle'); // ID from your HTML
    const featuredArticleSnippetEl = document.getElementById('featuredArticleSnippet');
    const featuredArticleLinkEl = document.getElementById('featuredArticleLink');
    const featuredAuthorAvatarElement = document.getElementById('featuredArticleAuthorAvatar');
    const featuredAuthorNameElement = document.getElementById('featuredArticleAuthorName');

    if (!articlesSection || !articlesGrid) {
        console.error('[homePageFeatures.js] articlesSection o articlesGrid non trovato.');
        return;
    }

    const featuredElementsPresent =
        featuredArticleCard &&
        featuredArticleTitleEl &&
        featuredArticleSnippetEl &&
        featuredArticleLinkEl &&
        featuredAuthorAvatarElement &&
        featuredAuthorNameElement;

    if (!featuredElementsPresent) {
        console.warn('[homePageFeatures.js] Elementi per Articolo in Evidenza mancanti. Funzionalità disabilitata.');
        if (featuredArticleCard) featuredArticleCard.style.display = 'none';
    }

    articlesGrid.innerHTML =
        '<p style="text-align:center; color:var(--text-color-muted); grid-column: 1 / -1;">Caricamento articoli...</p>';
    articlesSection.style.display = 'block';
    if (featuredArticleCard && featuredElementsPresent) featuredArticleCard.style.display = 'none';

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

        articlesGrid.innerHTML = '';

        const authorIdsToFetch = [...new Set(articlesFromDb.map((article) => article.authorId).filter((id) => id))];

        const publicProfilesMap = new Map(); // Changed variable name for clarity
        if (authorIdsToFetch.length > 0) {
            const MAX_IDS_PER_IN_QUERY = 30;
            const profilePromises = [];
            for (let i = 0; i < authorIdsToFetch.length; i += MAX_IDS_PER_IN_QUERY) {
                const batchUserIds = authorIdsToFetch.slice(i, i + MAX_IDS_PER_IN_QUERY);
                // CORRECTED: Fetch from userPublicProfiles
                const profilesQuery = query(
                    collection(db, 'userPublicProfiles'),
                    where(documentId(), 'in', batchUserIds)
                );
                profilePromises.push(getDocs(profilesQuery));
            }
            try {
                const profileSnapshotsArray = await Promise.all(profilePromises);
                profileSnapshotsArray.forEach((profileSnaps) => {
                    profileSnaps.forEach((snap) => {
                        if (snap.exists()) {
                            publicProfilesMap.set(snap.id, snap.data());
                        }
                    });
                });
            } catch (profileError) {
                console.error(
                    '[homePageFeatures.js] Errore recupero profili pubblici autori per homepage:',
                    profileError
                );
            }
        }

        let actualFeaturedArticleData = null;
        if (articlesFromDb.length > 0 && featuredElementsPresent) {
            actualFeaturedArticleData =
                articlesFromDb.find((article) => article.isFeatured === true) || articlesFromDb[0];
            if (actualFeaturedArticleData) {
                if (featuredArticleTitleEl)
                    featuredArticleTitleEl.textContent = actualFeaturedArticleData.title || 'N/D';
                if (featuredArticleSnippetEl) {
                    featuredArticleSnippetEl.textContent =
                        actualFeaturedArticleData.snippet ||
                        (actualFeaturedArticleData.contentMarkdown
                            ? actualFeaturedArticleData.contentMarkdown.substring(0, 150) + '...'
                            : 'Leggi...');
                }
                if (featuredArticleLinkEl)
                    featuredArticleLinkEl.href = `view-article.html?id=${actualFeaturedArticleData.id}`;

                let featAuthorName = actualFeaturedArticleData.authorName || 'Autore Sconosciuto';
                let featAuthorAvatarSrc = DEFAULT_AUTHOR_AVATAR_PATH;
                const featAuthorPublicProfile = actualFeaturedArticleData.authorId
                    ? publicProfilesMap.get(actualFeaturedArticleData.authorId)
                    : null;

                if (featAuthorPublicProfile) {
                    featAuthorName = featAuthorPublicProfile.nickname || featAuthorName;
                    let chosenFeatAvatarUrl = null;
                    if (featAuthorPublicProfile.avatarUrls && featAuthorPublicProfile.avatarUrls.thumbnail) {
                        chosenFeatAvatarUrl = featAuthorPublicProfile.avatarUrls.thumbnail;
                    }

                    if (chosenFeatAvatarUrl) {
                        featAuthorAvatarSrc = chosenFeatAvatarUrl;
                        let timestampForCache;
                        if (featAuthorPublicProfile.profilePublicUpdatedAt) {
                            // PRIORITIZE THIS
                            timestampForCache = featAuthorPublicProfile.profilePublicUpdatedAt;
                        } else if (featAuthorPublicProfile.profileUpdatedAt) {
                            // Fallback
                            timestampForCache = featAuthorPublicProfile.profileUpdatedAt;
                        }

                        if (timestampForCache && typeof timestampForCache.seconds === 'number') {
                            featAuthorAvatarSrc += `?v=${timestampForCache.seconds}`;
                        } else if (timestampForCache && typeof timestampForCache === 'number') {
                            featAuthorAvatarSrc += `?v=${timestampForCache}`;
                        } else if (timestampForCache instanceof Date) {
                            featAuthorAvatarSrc += `?v=${Math.floor(timestampForCache.getTime() / 1000)}`;
                        }
                    } else if (actualFeaturedArticleData.authorId) {
                        featAuthorAvatarSrc = generateBlockieAvatar(actualFeaturedArticleData.authorId, 32);
                    }
                } else if (actualFeaturedArticleData.authorId) {
                    featAuthorAvatarSrc = generateBlockieAvatar(actualFeaturedArticleData.authorId, 32);
                }

                if (featuredAuthorAvatarElement) {
                    featuredAuthorAvatarElement.src = featAuthorAvatarSrc;
                    featuredAuthorAvatarElement.alt = `Avatar di ${featAuthorName}`;
                    featuredAuthorAvatarElement.onerror = () => {
                        featuredAuthorAvatarElement.src = DEFAULT_AUTHOR_AVATAR_PATH;
                        featuredAuthorAvatarElement.onerror = null;
                    };
                }

                if (featuredAuthorNameElement) {
                    if (actualFeaturedArticleData.authorId) {
                        featuredAuthorNameElement.innerHTML = `<a href="profile.html?userId=${actualFeaturedArticleData.authorId}">${featAuthorName}</a>`;
                    } else {
                        featuredAuthorNameElement.textContent = featAuthorName;
                    }
                }
                if (featuredArticleCard) featuredArticleCard.style.display = 'flex';
            }
        }

        let articlesAddedToGrid = 0;
        articlesFromDb.forEach((articleDataInLoop) => {
            if (!actualFeaturedArticleData || articleDataInLoop.id !== actualFeaturedArticleData.id) {
                if (articlesAddedToGrid < MAX_FEATURED_ARTICLES) {
                    const authorPublicProfileForCard = articleDataInLoop.authorId
                        ? publicProfilesMap.get(articleDataInLoop.authorId)
                        : null;
                    createArticleCard(
                        articleDataInLoop,
                        articleDataInLoop.id,
                        authorPublicProfileForCard,
                        articlesGrid
                    );
                    articlesAddedToGrid++;
                }
            }
        });

        if (articlesFromDb.length === 0) {
            articlesGrid.innerHTML =
                '<p style="text-align:center; color:var(--text-color-muted); grid-column: 1 / -1;">Nessun articolo pubblicato trovato.</p>';
            if (featuredArticleCard && featuredElementsPresent) featuredArticleCard.style.display = 'none';
        } else if (articlesAddedToGrid === 0 && actualFeaturedArticleData) {
            articlesGrid.innerHTML =
                '<p style="text-align:center; color:var(--text-color-muted); grid-column: 1 / -1;">Nessun altro articolo da visualizzare al momento.</p>';
        }
    } catch (error) {
        console.error('[homePageFeatures.js] Errore durante il caricamento degli articoli:', error);
        articlesGrid.innerHTML =
            '<p style="text-align:center; color:red;">Errore nel caricamento degli articoli. Controlla la console.</p>';
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
            articlesGrid.innerHTML += '<p style="text-align:center; color:orange;">Indice Firestore mancante...</p>';
        }
        if (featuredArticleCard && featuredElementsPresent) featuredArticleCard.style.display = 'none';
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
        console.error("Errore nel recuperare i dati per il banner di Glitchzilla:", error);
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
