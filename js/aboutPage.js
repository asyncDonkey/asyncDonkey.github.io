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

function populateSkills() {
    const skillsGrid = document.querySelector("#skills .skills-grid");
    if (!skillsGrid) return;

    skillsGrid.innerHTML = ""; // Pulisce il messaggio di caricamento

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
 * NUOVA FUNZIONE: Aggiunge la logica per il trascinamento orizzontale del carosello.
 * @param {HTMLElement} container - L'elemento contenitore del carosello.
 */
function setupSkillsCarousel(container) {
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
        const walk = (x - startX) * 2; // Moltiplicatore per rendere il drag più veloce
        container.scrollLeft = scrollLeft - walk;
    });
}


// Event Listener principale che avvia le funzioni della pagina
document.addEventListener("DOMContentLoaded", () => {
    populateSkills();

    const skillsGrid = document.querySelector("#skills .skills-grid");
    if (skillsGrid) {
        skillsGrid.addEventListener("click", (event) => {
            const card = event.target.closest(".skill-card");
            if (card) {
                const skillId = card.getAttribute("data-skill-id");
                openSkillModal(skillId);
            }
        });

        // NUOVA LOGICA: Attiva il carosello solo su mobile
        if (window.innerWidth <= 768) {
            setupSkillsCarousel(skillsGrid);
        }
    }
});