// Contenuto completo e aggiornato per js/aboutPage.js

const competenzeTecniche = [
        {
            id: 'javascript',
            nome: 'JavaScript (ES6+)',
            iconClass: 'fab fa-js-square',
            coloreIcona: '#f7df1e',
            descrizioneDettagliata: 'Cuore pulsante di ogni interazione, utilizzato per manipolare il DOM, orchestrare chiamate di rete asincrone (con Promises e async/await) e gestire lo stato dell\'applicazione in tempo reale.',
            esempioPratico: 'Tutta la logica interattiva del sito, dal gioco codeDash! alla gestione dei commenti e dei profili utente in `js/main.js` e moduli associati.'
        },
        {
            id: 'html5',
            nome: 'HTML5',
            iconClass: 'fab fa-html5',
            coloreIcona: '#E34F26',
            descrizioneDettagliata: 'Utilizzato per creare la struttura portante di tutte le pagine web del progetto, con un focus rigoroso sulla semantica (es. <main>, <section>, <nav>) per massimizzare l\'accessibilità (a11y) e la SEO.',
            esempioPratico: 'L\'intera impalcatura di pagine come `index.html`, `about.html` e `profile.html` è costruita seguendo le best practice di HTML5.'
        },
        {
            id: 'scss',
            nome: 'SCSS',
            iconClass: 'fab fa-sass',
            coloreIcona: '#CC6699',
            descrizioneDettagliata: 'Impiegato per scrivere CSS in modo modulare e manutenibile. L\'uso di variabili, nesting, mixin e partials ha permesso di creare un design system coerente e facilmente scalabile.',
            esempioPratico: 'L\'intera cartella `scss/`, dove ogni componente (es. `_header.scss`, `_modals.scss`) è un partial importato nel file principale `styles.scss`.'
        },
        {
            id: 'firestore_db',
            nome: 'Firestore Database',
            iconClass: 'fas fa-database', // Usiamo un'icona generica ma chiara
            coloreIcona: '#FFCA28', // Giallo/Arancio di Firebase
            descrizioneDettagliata: 'Database NoSQL utilizzato come backend primario per la persistenza di tutti i dati dinamici dell\'applicazione, inclusi profili utente, punteggi della leaderboard, articoli e commenti.',
            esempioPratico: 'Le collezioni `userProfiles`, `leaderboardScores` e `articles` sono esempi centrali dell\'architettura dati su Firestore.'
        },
        {
            id: 'firestore_rules',
            nome: 'Security Rules',
            iconClass: 'fas fa-shield-alt', // Icona a tema sicurezza
            coloreIcona: '#D32F2F', // Un rosso per indicare importanza/sicurezza
            descrizioneDettagliata: 'Sviluppo di regole di sicurezza granulari per proteggere i dati su Firestore, garantendo che gli utenti possano leggere e scrivere dati solo secondo i permessi loro concessi. Un pilastro fondamentale dell\'applicazione.',
            esempioPratico: 'Il file `firestore.rules` definisce le logiche di validazione e autorizzazione, ad esempio permettendo a un utente di modificare solo il proprio profilo.'
        },
        {
            id: 'firebase_auth',
            nome: 'Firebase Auth',
            iconClass: 'fas fa-user-shield', // Icona a tema sicurezza utente
            coloreIcona: '#4285F4', // Un blu istituzionale
            descrizioneDettagliata: 'Gestione dell\'intero ciclo di vita dell\'autenticazione utente: registrazione, login, logout, verifica email. Integrato con le Security Rules per un controllo degli accessi basato sull\'identità.',
            esempioPratico: 'La logica di `onAuthStateChanged` in `js/main.js` e le funzioni `signInWithEmailAndPassword` sono l\'implementazione diretta di questo servizio.'
        },
        {
            id: 'cloud_functions',
            nome: 'Cloud Functions',
            iconClass: 'fas fa-bolt', // Icona che suggerisce trigger/eventi
            coloreIcona: '#FFA000', // Un arancione energetico
            descrizioneDettagliata: 'Utilizzo di funzioni serverless per eseguire logica di backend in risposta a eventi (es. creazione utente, aggiornamento di un documento) senza gestire un server. Ideale per logiche atomiche e notifiche.',
            esempioPratico: 'Le funzioni in `functions/index.js`, come quella che assegna i badge al verificarsi di determinate condizioni (`awardAppreciatedAuthorBadge`).'
        },
        {
            id: 'firebase_storage',
            nome: 'Firebase Storage',
            iconClass: 'fas fa-folder-open', // Icona per file/storage
            coloreIcona: '#3F51B5', // Un blu solido
            descrizioneDettagliata: 'Servizio utilizzato per l\'upload e la gestione di file utente, in particolare per gli avatar del profilo. Include la gestione dei metadati per un corretto versioning e cache-busting.',
            esempioPratico: 'La funzionalità di upload dell\'avatar custom in `js/profile.js` che carica l\'immagine su Storage e ne salva l\'URL in Firestore.'
        },
        {
            id: 'git',
            nome: 'Git & GitHub',
            iconClass: 'fab fa-github',
            coloreIcona: '#181717', // Nero/Grigio scuro di GitHub
            descrizioneDettagliata: 'Utilizzo sistematico di Git per il controllo di versione del codice e di GitHub come repository remoto per la collaborazione, la gestione del progetto (tramite Issues e DevPlan) e il deployment.',
            esempioPratico: 'L\'intero progetto è versionato su GitHub. I commit regolari e l\'uso di branch (come `refinement`) dimostrano la padronanza del workflow.'
        }
    ];

    const patternComplessi = [
    {
        id: "async",
        icon: "hourglass_top",
        titolo: "Gestione Asincrona (async/await)",
        descrizione: `
            Questo pattern è il cuore di un'applicazione web moderna e reattiva. Invece di eseguire un'operazione lunga (come chiedere i dati al database) e costringere l'utente ad aspettare, il codice la avvia e 'promette' di completarla in un secondo momento, senza bloccare il resto dell'interfaccia.
            <br><br>
            <strong>L'analogia è semplice:</strong> è come ordinare un caffè. Invece di restare fermo al bancone, ti viene dato un dischetto che vibrerà quando l'ordine è pronto, lasciandoti libero di sederti. Allo stesso modo, il sito rimane sempre fluido e navigabile mentre attende i dati.
            <br><br>
            L'uso di <code>async/await</code> è la sintassi che rende questo flusso di lavoro elegante e leggibile, ed è fondamentale per caricare elementi come i punteggi della classifica o i commenti degli articoli senza mai 'congelare' l'esperienza dell'utente.
        `
    },
    {
        id: "realtime",
        icon: "sync",
        titolo: "Realtime Listeners (onSnapshot)",
        descrizione: `
            Questo pattern trasforma l'applicazione da una pagina statica a un'esperienza viva e collaborativa. Utilizzando la funzione <code>onSnapshot</code> di Firestore, il client non si limita a 'chiedere' i dati una volta, ma 'sottoscrive' un abbonamento alle modifiche future.
            <br><br>
            <strong>L'analogia:</strong> è come essere in una chat di gruppo. Non hai bisogno di aggiornare manualmente per vedere i nuovi messaggi; questi appaiono istantaneamente per tutti i partecipanti. Allo stesso modo, quando un utente lascia un commento su un articolo, questo compare sulla pagina di chiunque la stia visualizzando in quel momento.
            <br><br>
            Questa reattività è fondamentale per le notifiche, le sezioni di commenti e per qualsiasi funzionalità che richieda una sincronizzazione live, rendendo l'interazione più fluida e coinvolgente.
        `
    },
    {
        id: "modules",
        icon: "view_module",
        titolo: "Modularizzazione del Codice JS",
        descrizione: `
            Questo approccio è fondamentale per la salute e la longevità di un codebase. Invece di un unico, monolitico file JavaScript, il codice è stato scomposto in moduli indipendenti (<code>ES6 Modules</code>), ognuno con una responsabilità chiara e definita.
            <br><br>
            <strong>L'analogia:</strong> è come costruire con i mattoncini LEGO®. Invece di partire da un blocco gigante, si utilizzano mattoncini standard e specializzati (i moduli) che possono essere combinati e riutilizzati. Il file <code>main.js</code> agisce come il 'manuale di istruzioni', importando e orchestrando i diversi moduli, come <code>auth.js</code> per la gestione degli utenti o <code>comments.js</code> per i commenti.
            <br><br>
            Questo non solo rende il codice più pulito e leggibile, ma ne semplifica drasticamente la manutenzione: se c'è un problema con i commenti, sappiamo di dover guardare solo nel 'cassetto' giusto, senza rischiare di rompere altre parti del sito.
        `
    },
    {
        id: "cacheBusting",
        icon: "cached",
        titolo: "Cache Busting per Risorse Critiche",
        descrizione: `
            Questo pattern risolve un problema comune e frustrante: la visualizzazione di risorse non aggiornate a causa della 'memoria' (cache) del browser. Per garantire che l'utente veda sempre la versione più recente di un file critico, come il proprio avatar, si 'invalida' la versione precedente.
            <br><br>
            <strong>L'analogia:</strong> è come un prodotto al supermercato. Se la scatola cambia leggermente, potresti non notarlo, ma se viene aggiunta un'etichetta con scritto 'Nuova Formula!', sai per certo di dover prendere quella. Aggiungere un parametro all'indirizzo di un'immagine (es. <code>avatar.jpg?v=12345</code>) agisce come quell'etichetta, forzando il browser a ignorare la vecchia versione e scaricare quella nuova.
            <br><br>
            Nel progetto, questo è visibile in <code>js/profile.js</code>: quando un utente carica un nuovo avatar, all'URL dell'immagine viene aggiunto un timestamp, garantendo che la modifica sia visibile a tutti istantaneamente.
        `
    },
    {
        id: "denormalization",
        icon: "schema",
        titolo: "Sincronizzazione Dati Denormalizzati",
        descrizione: `
            Questo è un pattern avanzato di architettura per database <code>NoSQL</code> come <code>Firestore</code>, che bilancia performance e coerenza. Per rendere il sito più veloce, alcune informazioni (come il nickname di un utente) vengono duplicate e salvate direttamente dove servono (es. all'interno di un commento), un processo chiamato 'denormalizzazione'.
            <br><br>
            <strong>L'analogia:</strong> è come avere il numero di un amico sia nella rubrica del telefono (la fonte di verità) sia scritto su vari post-it. Se il numero cambia, devi aggiornare tutti i post-it. Per evitare questo lavoro manuale, una <strong><code>Cloud Function</code></strong> agisce da 'assistente magico': non appena aggiorni la rubrica, l'assistente trova e corregge automaticamente ogni post-it.
            <br><br>
            Allo stesso modo, la funzione <code>userPublicProfileSync.js</code> nel backend 'ascolta' le modifiche al profilo di un utente e le propaga istantaneamente in tutti i documenti correlati, garantendo coerenza in tutto il sito senza sacrificare la velocità di caricamento.
        `
    }
];

function populateSkills() {
    const skillsGrid = document.querySelector("#skills .skills-grid");
    if (!skillsGrid) return;

    skillsGrid.innerHTML = ""; 

    competenzeTecniche.forEach((skill) => {
        const listItem = document.createElement("li");
        listItem.className = "skill-card";
        listItem.setAttribute("data-skill-id", skill.id);

        listItem.innerHTML = `
            <i class="skill-icon ${skill.iconClass}" style="color: ${skill.coloreIcona};" aria-hidden="true"></i>
            <span>${skill.nome}</span>
        `;
        skillsGrid.appendChild(listItem);
    });
}

/**
 * NUOVA FUNZIONE: Popola dinamicamente le card dei pattern complessi.
 */
function populatePatterns() {
    const patternsContainer = document.querySelector("#complex-patterns .patterns-container");
    if (!patternsContainer) return;

    patternsContainer.innerHTML = ""; 

    patternComplessi.forEach((pattern) => {
        const card = document.createElement("div");
        card.className = "pattern-card";
        card.setAttribute("data-pattern-id", pattern.id);
        
        // *** MODIFICA CHIAVE: Rimuoviamo la descrizione dalla card sulla pagina ***
        card.innerHTML = `
            <div class="pattern-header">
                <span class="material-symbols-rounded">${pattern.icon}</span>
                <h3>${pattern.titolo}</h3>
            </div>
        `;
        // Non aggiungiamo più:
        // <div class="pattern-body">
        //     <p>${pattern.descrizione}</p>
        // </div>
        patternsContainer.appendChild(card);
    });
}


function openSkillModal(skillId) {
    const skill = competenzeTecniche.find(s => s.id === skillId);
    if (!skill) return;

    const modal = document.getElementById("skillDetailModal");
    const modalContent = document.getElementById("skillModalContent");
    const closeModalBtn = modal.querySelector(".close-modal-btn");

    modalContent.innerHTML = `
        <div class="skill-modal-header">
            <i class="${skill.iconClass}" style="color: ${skill.coloreIcona};" aria-hidden="true"></i>
            <h2>${skill.nome}</h2>
        </div>
        <div class="skill-modal-body">
            <h3>Descrizione Dettagliata</h3>
            <p>${skill.descrizioneDettagliata}</p>
            <h3>Esempio Pratico nel Progetto</h3>
            <p>${skill.esempioPratico}</p>
        </div>
    `;

    modal.style.display = "block";

    const closeModal = () => {
        modal.style.display = "none";
        closeModalBtn.removeEventListener('click', closeModal);
        window.removeEventListener('click', closeOutside);
    };

    const closeOutside = (event) => {
        if (event.target == modal) {
            closeModal();
        }
    };

    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', closeOutside);
}

/**
 * *** MODIFICA 2: NUOVA FUNZIONE per aprire la modale dei pattern ***
 */
function openPatternModal(patternId) {
    const pattern = patternComplessi.find(p => p.id === patternId);
    if (!pattern) return;

    // Riusiamo la stessa modale delle competenze, per efficienza
    const modal = document.getElementById("skillDetailModal");
    const modalContent = document.getElementById("skillModalContent");
    const closeModalBtn = modal.querySelector(".close-modal-btn");

    // Popoliamo la modale con il contenuto del pattern
    modalContent.innerHTML = `
        <div class="skill-modal-header">
            <span class="material-symbols-rounded" style="font-size: 2.8em; color: var(--link-color);">${pattern.icon}</span>
            <h2>${pattern.titolo}</h2>
        </div>
        <div class="skill-modal-body">
            <p>${pattern.descrizione}</p>
        </div>
    `;

    modal.style.display = "block";

    // Logica di chiusura (identica alla precedente)
    const closeModal = () => {
        modal.style.display = "none";
        closeModalBtn.removeEventListener('click', closeModal);
        window.removeEventListener('click', closeOutside);
    };

    const closeOutside = (event) => {
        if (event.target == modal) {
            closeModal();
        }
    };

    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', closeOutside);
}

/**
 * FUNZIONE OTTIMIZZATA: Aggiunge la logica 'grab-and-drag' a qualsiasi contenitore.
 * @param {HTMLElement} container - L'elemento contenitore del carosello.
 */
function setupDraggableCarousel(container) {
    if (!container) return;
    let isDown = false;
    let startX;
    let scrollLeft;

    container.addEventListener('mousedown', (e) => {
        isDown = true;
        container.classList.add('active-carousel');
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    });

    container.addEventListener('mouseleave', () => {
        isDown = false;
        container.classList.remove('active-carousel');
    });

    container.addEventListener('mouseup', () => {
        isDown = false;
        container.classList.remove('active-carousel');
    });

    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2; 
        container.scrollLeft = scrollLeft - walk;
    });
}


// Event Listener principale che avvia le funzioni della pagina
// Event Listener principale che avvia le funzioni della pagina
document.addEventListener("DOMContentLoaded", () => {
    populateSkills();
    populatePatterns(); 

    // Gestione click per la modale delle competenze
    const skillsGrid = document.querySelector("#skills .skills-grid");
    if (skillsGrid) {
        skillsGrid.addEventListener("click", (event) => {
            const card = event.target.closest(".skill-card");
            if (card) {
                const skillId = card.getAttribute("data-skill-id");
                openSkillModal(skillId);
            }
        });
    }

    /**
     * *** MODIFICA 3: NUOVO EVENT LISTENER per le card dei pattern ***
     */
    const patternsContainer = document.querySelector("#complex-patterns .patterns-container");
    if (patternsContainer) {
        patternsContainer.addEventListener("click", (event) => {
            const card = event.target.closest(".pattern-card");
            if (card) {
                const patternId = card.getAttribute("data-pattern-id");
                if (patternId) {
                    openPatternModal(patternId);
                }
            }
        });
    }

    // Se siamo su mobile, attiva i caroselli
    if (window.innerWidth <= 768) {
        setupDraggableCarousel(skillsGrid);
        setupDraggableCarousel(patternsContainer); 
    }
});