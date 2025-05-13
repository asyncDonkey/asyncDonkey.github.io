// js/articleViewer.js

// Per ora, importiamo (o copiamo) l'array sampleArticles.
// In futuro (Task B.5), recupereremo i dati da Firestore.
// Se sampleArticles è già esportato da homePageFeatures.js, puoi importarlo:
// import { sampleArticles } from './homePageFeatures.js'; 

// Altrimenti, per testare subito, copialo qui temporaneamente:
const sampleArticles = [
    {
        id: 'article-1',
        title: "Ottimizzazione Query Firestore per Leaderboard Performanti",
        date: "2025-05-15",
        author: "U.T.", // Aggiungiamo un campo autore
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
        `, // Contenuto HTML dell'articolo (in futuro sarà Markdown processato)
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
        link: "#", // Questo link non è usato nella pagina dell'articolo stesso
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


document.addEventListener('DOMContentLoaded', () => {
    const articleDisplayLoading = document.getElementById('articleDisplayLoading');
    const articleContentContainer = document.getElementById('articleContentContainer');
    const articleDisplayTitle = document.getElementById('articleDisplayTitle');
    const articleDisplayDate = document.getElementById('articleDisplayDate');
    const articleDisplayAuthor = document.getElementById('articleDisplayAuthor');
    const articleDisplayTagsContainer = document.getElementById('articleDisplayTagsContainer');
    const articleDisplayContent = document.getElementById('articleDisplayContent');

    // Elementi per interazioni future (like/commenti)
    const articleInteractionsSection = document.getElementById('articleInteractions');


    if (!articleContentContainer || !articleDisplayTitle || !articleDisplayDate || !articleDisplayAuthor || !articleDisplayTagsContainer || !articleDisplayContent || !articleDisplayLoading) {
        console.error("Uno o più elementi DOM per la visualizzazione dell'articolo non sono stati trovati.");
        if(articleDisplayLoading) articleDisplayLoading.innerHTML = "<p>Errore: Impossibile caricare la struttura della pagina dell'articolo.</p>";
        return;
    }

    // 1. Ottieni l'ID dell'articolo dall'URL
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    if (!articleId) {
        articleDisplayLoading.style.display = 'none';
        articleContentContainer.style.display = 'block'; // Mostra il contenitore per il messaggio di errore
        articleDisplayTitle.textContent = "Articolo Non Trovato";
        articleDisplayContent.innerHTML = "<p>L'ID dell'articolo non è stato specificato nell'URL. Torna alla <a href='index.html#articlesSection'>lista articoli</a>.</p>";
        if(articleInteractionsSection) articleInteractionsSection.style.display = 'none';
        return;
    }

    // 2. Trova l'articolo nell'array (o in futuro da Firestore)
    const article = sampleArticles.find(art => art.id === articleId);

    if (article) {
        // 3. Popola la pagina con i dati dell'articolo
        document.title = `${article.title} - asyncDonkey.io`; // Imposta il titolo della scheda del browser
        articleDisplayTitle.textContent = article.title;
        articleDisplayDate.textContent = new Date(article.date).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
        articleDisplayAuthor.textContent = article.author || "Redazione"; // Fallback per l'autore

        // Popola i tag
        articleDisplayTagsContainer.innerHTML = ''; // Pulisci eventuali tag placeholder
        if (article.tags && article.tags.length > 0) {
            article.tags.forEach(tagText => {
                const tagEl = document.createElement('span');
                tagEl.className = 'article-tag'; // Riusa la classe delle card
                tagEl.textContent = tagText;
                articleDisplayTagsContainer.appendChild(tagEl);
            });
        } else {
            articleDisplayTagsContainer.textContent = 'Nessun tag';
        }

        // Inserisci il contenuto dell'articolo
        // Per ora, assumiamo che article.content sia già HTML.
        // In futuro (Task S.4.2), qui ci sarà la conversione da Markdown a HTML.
        articleDisplayContent.innerHTML = article.content;

        articleDisplayLoading.style.display = 'none';
        articleContentContainer.style.display = 'block';
        if(articleInteractionsSection) articleInteractionsSection.style.display = 'block'; // Mostra sezione like/commenti
    } else {
        articleDisplayLoading.style.display = 'none';
        articleContentContainer.style.display = 'block';
        document.title = "Articolo Non Trovato - asyncDonkey.io";
        articleDisplayTitle.textContent = "Articolo Non Trovato";
        articleDisplayContent.innerHTML = `<p>Spiacenti, l'articolo con ID "${articleId}" non è stato trovato. Potrebbe essere stato spostato o rimosso. Torna alla <a href='index.html#articlesSection'>lista articoli</a>.</p>`;
        if(articleInteractionsSection) articleInteractionsSection.style.display = 'none';
    }
});