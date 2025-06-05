import { db } from './main.js';
import { createArticleCard } from './homePageFeatures.js';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    documentId,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/**
 * Carica tutti gli articoli pubblicati da Firestore e li visualizza nella pagina.
 */
async function loadAllArticles() {
    const articlesContainer = document.getElementById('allArticlesContainer');
    if (!articlesContainer) {
        console.error('[articlesPage.js] Contenitore #allArticlesContainer non trovato.');
        return;
    }

    try {
        // 1. Definisci la query per recuperare tutti gli articoli pubblicati
        const articlesQuery = query(
            collection(db, 'articles'),
            where('status', '==', 'published'),
            orderBy('publishedAt', 'desc')
            // Nessun 'limit' qui, li vogliamo tutti
        );

        const articleSnapshots = await getDocs(articlesQuery);

        // 2. Gestisci il caso in cui non ci sono articoli
        if (articleSnapshots.empty) {
            articlesContainer.innerHTML =
                '<p style="text-align:center; color:var(--text-color-muted);">Nessun articolo trovato al momento. Torna a trovarci presto!</p>';
            return;
        }

        // 3. Estrai i dati e gli ID degli autori
        const articles = articleSnapshots.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const authorIds = [...new Set(articles.map((a) => a.authorId).filter(Boolean))];

        // 4. Recupera i profili pubblici degli autori in modo efficiente
        let profiles = {};
        if (authorIds.length > 0) {
            // Firestore supporta fino a 30 valori in una clausola 'in' per query.
            // Per un numero elevato di articoli/autori, bisognerebbe suddividere la query.
            // Per ora, presumendo un numero ragionevole di autori, una singola query è sufficiente.
            const profilesQuery = query(collection(db, 'userPublicProfiles'), where(documentId(), 'in', authorIds));
            const profileSnapshots = await getDocs(profilesQuery);
            profileSnapshots.forEach((doc) => {
                profiles[doc.id] = doc.data();
            });
        }

        // 5. Popola il contenitore con le card degli articoli
        articlesContainer.innerHTML = ''; // Pulisce il messaggio "Caricamento..."
        articles.forEach((article) => {
            const authorProfile = profiles[article.authorId] || null;
            // 'isFeatured' è sempre false in questa pagina
            const cardElement = createArticleCard(article, article.id, authorProfile, false);
            articlesContainer.appendChild(cardElement);
        });
    } catch (error) {
        console.error('Errore durante il caricamento di tutti gli articoli:', error);
        articlesContainer.innerHTML =
            '<p style="text-align:center; color: var(--error-color);">Si è verificato un errore nel caricare gli articoli. Riprova più tardi.</p>';
        if (error.code === 'failed-precondition') {
            articlesContainer.innerHTML +=
                '<p style="text-align:center; font-size: 0.9em; color: var(--text-color-muted);">(Dettaglio tecnico: Indice Firestore mancante o non corretto per questa query).</p>';
        }
    }
}

// Esegui la funzione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', loadAllArticles);
