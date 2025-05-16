# DEVELOPMENT PLAN (v3.6 - Integrato)

**Stato del Progetto (secondo v3.6):** Implementati i like per articoli, commenti articoli e commenti guestbook (con visualizzazione likers). Editor Markdown EasyMDE funzionante in `submit-article.html`. Pagina `contribute.html` creata e linkata. Pagina `admin-dashboard.html` creata con logica base per visualizzare articoli pending e modale di modifica; funzionalità di approvazione/rigetto articoli implementata a livello base.

---

🚧 **Prossimi Step e Task da Prioritizzare** 🚧

## Sezione A: Gestione Contributi e Moderazione

### Task A.1: Pagina "Contribuisci"

- `[x]` **Sub-task A.1.1:** Creare la pagina HTML `contribute.html` con contenuto informativo iniziale.
    - _Contenuto Iniziale (dettagli da v3.4):_
        - Spiegazione del processo di sottomissione articoli (revisione, editor Markdown).
        - Breve introduzione al Markdown (con cenni storici).
        - Link placeholder a un futuro articolo dettagliato sul Markdown (`view-article.html?id=markdown-guide-placeholder`).
        - Link alla pagina `submit-article.html` per chi vuole scrivere un articolo.
        - Introduzione alla sezione "Issue Tracking / Suggerimenti".
- `[x]` **Sub-task A.1.2:** Aggiungere un link a `contribute.html` nella navigazione principale (header), visibile a tutti.

### Task A.2: Sistema di Tracciamento Issue/Suggerimenti (Integrato o Dedicato)

- `[ ]` **Sub-task A.2.1:** Definire la struttura dati in Firestore per le "Issues" (es. collezione `userIssues`).
    - _Campi previsti (combinazione v3.6 & v3.4):_ `title`, `description`, `type` (gameIssue, generalFeature, newGameRequest), `gameId` (se `type` è gameIssue), `submittedBy` (userId, userName, userNationalityCode), `timestamp`, `status` (new, underConsideration, accepted, planned, inProgress, completed, declined), `upvotes`, `upvotedBy` (array di UID).
    - _Specifiche Tipi Issue (da v3.4):_
        - `gameIssue`: Relativa a un gioco specifico (richiederà un campo aggiuntivo `gameId` o simile).
        - `generalFeature`: Richiesta di implementazione generale per il sito/piattaforma.
        - `newGameRequest`: Suggerimento per un nuovo gioco.
- `[ ]` **Sub-task A.2.2:** Creare l'interfaccia utente in `contribute.html` (o una nuova pagina `issues.html` linkata da `contribute.html`) per:
    - Visualizzare le issue esistenti (con filtri per tipo/status).
    - Permettere agli utenti loggati di inviare nuove issue (scegliendo il tipo e, se `gameIssue`, il gioco di riferimento).
    - Permettere agli utenti loggati di fare "upvote" alle issue esistenti.
- `[ ]` **Sub-task A.2.3:** Implementare la logica JS per inviare nuove issue e registrare gli upvote in Firestore.
- `[ ]` **Sub-task A.2.4:** Implementare la visualizzazione delle issue e dei relativi conteggi di upvote.
- `[ ]` **Sub-task A.2.5:** (Admin) Interfaccia base in `admin-dashboard.html` per moderare/aggiornare lo stato delle issue.

### Task A.3: Moderazione e Pubblicazione Articoli

- `[x]` **Sub-task A.3.1:** Raffinare e finalizzare le regole Firestore per `articles` (workflow `draft`, `pendingReview`, `published`).
    - _Obiettivo (da v3.4):_ Solo gli autori possono modificare le proprie bozze. Solo i moderatori/admin possono cambiare lo status da `pendingReview` a `published` o respingere.
- `[ ]` **Sub-task A.3.2:** Sviluppare un'interfaccia admin/moderatore in `admin-dashboard.html` per la gestione degli articoli.
    - `[x]` Visualizzazione lista articoli `pendingReview` con titolo, autore, data.
    - `[x]` Azioni base per ogni articolo: "Visualizza/Modifica", "Approva", "Respingi".
    - `[x]` Modale "Visualizza/Modifica" che carica i dati dell'articolo e permette modifiche tramite EasyMDE.
    - `[ ]` Aggiungere una scheda/sezione interattiva o pannello informativo in `admin-dashboard.html` che spieghi chiaramente le linee guida per la moderazione:
        - Quando apportare modifiche minori (correzioni ortografiche, grammaticali, formattazione Markdown).
        - Quando respingere un articolo (contenuto inappropriato, spam, fuori tema, qualità insufficiente).
        - Workflow di approvazione (controllo finale, impostazione `publishedAt`).
    - `[ ]` Assegnare `publishedAt: serverTimestamp()` quando un articolo viene pubblicato (specifica da v3.4).
    - `[ ]` (Opzionale) Visualizzazione lista bozze di tutti gli utenti (status: `draft`).
    - `[ ]` Visualizzazione lista articoli pubblicati (status: `published`) con azioni: "Visualizza Anteprima", "Modifica (Admin)", "Rimuovi Pubblicazione (cambia status a `draft` o `archived`)", "Elimina".
    - `[ ]` (Opzionale) Visualizzazione lista articoli respinti (status: `rejected`).
- `[x]` **Sub-task A.3.3:** Implementare la logica JS per l'interfaccia admin (caricamento articoli, azioni di approva/respingi, apertura/gestione modale di modifica con EasyMDE, salvataggio modifiche admin).
- `[ ]` **Sub-task A.3.4:** (Opzionale Esteso) Sistema di notifica base (o campo feedback) per l'autore quando l'articolo viene approvato o respinto.

---

## Sezione B: Sistema Articoli & Contributi Utente

- `[x]` **Task B.1:** Visualizzazione Articoli Completa (Pagine Dedicate)
- `[x]` **Task B.2:** Commenti per gli Articoli
- `[x]` **Task B.3:** "Like" per gli Articoli e Miglioramento Like Esistenti
- **Task B.4: Contribuzione Articoli da Parte degli Utenti (con Moderazione)**
    - `[x]` Sub-task B.4.1: Creare un'interfaccia utente per la sottomissione di nuovi articoli (`submit-article.html`).
    - `[x]` Sub-task B.4.2: Integrare un editor Markdown JavaScript (EasyMDE) in `submit-article.html`.
    - _NOTA (da v3.6/v3.4):_ L'ex Sub-task B.4.3 (logica backend per workflow articoli) è stato **SPOSTATO e RINOMINATO in Task A.3.1**.
    - _NOTA (da v3.6/v3.4):_ L'ex Sub-task B.4.4 (meccanismo approvazione/moderazione) è stato **SPOSTATO e RINOMINATO in Task A.3.2 e A.3.3**.
- `[x]` **Task B.5:** Gestione Dati Articoli da Firestore (Migrazione da Statico)

---

## Sezione G: Guestbook

- `[x]` **Task G.1:** Implementazione "Like" per Commenti Guestbook

---

## Sezione C: Nuove Funzionalità e Miglioramenti Specifici Giochi/Piattaforma

- `[ ]` **Task C.1:** Gestione Avatar Utente Personalizzato
- `[ ]` **Task C.2:** Ottimizzazione Layout Mobile per Donkey Runner
- `[ ]` **Task C.3:** Miglioramenti Leaderboard & Info Glitchzilla (Sub-task C.3.1 - C.3.4)
- `[ ]` **Task C.4:** Migliorare Compatibilità e Prestazioni su iOS per Donkey Runner
- _NOTA (da v3.4):_ Task C.5 è stato **RIMOSSO** (La funzionalità di tracciamento issue ora è il Task A.2, più completo e integrato).

---

## Sezione D: Miglioramenti UI/UX e Ottimizzazioni Generali

### Task D.1: Miglioramenti UI/UX Generali

- `[ ]` Feedback visivo per operazioni asincrone (es. loader più evidenti, disabilitazione bottoni durante attesa).
- `[ ]` Migliorare gestione errori (messaggi più specifici e user-friendly).
- `[ ]` Ottimizzare layout mobile generale per tutte le pagine.
- `[x]` Rivedere layout disposizione articoli homepage (roll scorrevole).
- `[x]` **Sub-task D.1.1:** Aggiungere link/pulsante per "Scrivi Articolo" e "Contribuisci" alla navigazione (header) e/o pagina profilo, visibile solo a utenti loggati (specifica "Contribuisci" da v3.6, "Scrivi Articolo" da entrambi).

### Task D.2: Funzionalità Aggiuntive per l'Utente

- `[ ]` Modifica Nazionalità dal profilo utente.
- `[ ]` Possibilità per gli utenti di cancellare i propri commenti (articoli e guestbook).

### Task D.3: Ottimizzazioni del Codice

- `[x]` **NON VERRA' EFFETTUATO** - Refactoring generale del codice JavaScript per migliorare modularità e manutenibilità.
- `[ ]` Aggiungere commenti dettagliati a tutte le funzioni e sezioni complesse.

### Task D.4: Test e Quality Assurance

- `[ ]` Test cross-browser e cross-device approfonditi.
- `[ ]` Definire casi di test per le funzionalità chiave.

### Task D.5: Filtri Avanzati per Leaderboard Globale

- `[ ]` Implementare filtri per periodo (es. settimanale, mensile, assoluto).
- `[ ]` Implementare filtri per nazionalità (se rilevante).

### Task D.6: Miglioramenti Stili Commenti e Interazioni Like

- `[ ]` **Sub-task D.6.1:** Rivedere gli stili per la sezione commenti (articoli e guestbook) per migliorare leggibilità e impatto visivo.
- `[x]` **Sub-task D.6.2:** Migliorare l'aspetto e l'interattività dei bottoni "Like" e dei relativi conteggi nei commenti (articoli e guestbook), inclusa l'indicazione di cliccabilità per visualizzare i likers. _(Nota da v3.4: Parzialmente completato, UX migliorata)._

### Task D.7 (Nuovo da v3.6): Miglioramento Grafico Card Articoli Homepage

- `[ ]` **Sub-task D.7.1:** Visualizzare l'avatar dell'autore (Blockie generato da `authorId`) sulla card dell'articolo in `index.html`.
- `[ ]` **Sub-task D.7.2:** Visualizzare la bandierina della nazionalità dell'autore (se disponibile in `article.authorNationalityCode`) accanto al nome/avatar sulla card dell'articolo in `index.html`.

---

🌍 ## Fase Successiva (Lungo Termine): Internazionalizzazione (i18n) Completa

- `[ ]` **Task E.1:** Implementare Sistema di Traduzione (es. con JSON e JS).
- `[ ]` **Task E.2:** Selettore Manuale Lingua per l'utente.

---

## Considerazioni Chiave e Miglioramenti Futuri Possibili (Combinate da v3.6 e v3.4)

- **Admin Roles / Firestore Rules:** Fondamentale per Task A.2.5 e A.3. Sarà necessario un sistema per identificare gli utenti amministratori/moderatori (es. campo booleano `isAdmin: true` nel documento `userProfiles`). Le regole Firestore dovranno controllare questo campo e continuare a essere verificate e affinate per garantire sicurezza e funzionalità corrette per ogni nuova interazione.
- **Moderazione Automatica (Futuro):** Considerare l'uso di Cloud Functions per analizzare il contenuto degli articoli sottomessi (es. con API di Natural Language Processing per rilevare linguaggio inappropriato) prima della revisione manuale. Questo è un miglioramento avanzato per il futuro.
- **Notifiche:** Per autori (articolo approvato/respinto) e per admin (nuovo articolo/issue). Utilizzare notifiche "toast" non intrusive invece di `alert()`.
- **Modularità del Codice JavaScript:** Con l'aggiunta di nuove pagine e funzionalità, considerare file JS dedicati (es. `contributePage.js`, `issueTracker.js`) e raggruppare le interazioni con Firestore in moduli dedicati (es. `firestoreServiceArticles.js`).
- **User Experience (UX) per Issue Tracker:** Filtri, ordinamento, e un'interfaccia chiara saranno importanti.
- **Gestione dello Stato Globale:** Per applicazioni più complesse, considerare un semplice gestore di stato o l'uso di Custom Events.
- **Performance:**
    - Ottimizzare il caricamento delle immagini (es. lazy loading).
    - Minificare i file JS e CSS per la produzione.
    - Analizzare le query Firestore per efficienza e uso di indici.
- **User Experience (UX) Generale:**
    - **Caricamento Scheletro (Skeleton Loading):** Mostrare placeholder "scheletro" per le sezioni che caricano dati.
    - **Accessibilità (a11y):** Continuare a testare e migliorare l'accessibilità (navigazione da tastiera, attributi ARIA).
- **Sicurezza:**
    - Validare sempre i dati di input sia lato client sia lato server/regole Firestore.
    - Sanificare qualsiasi output HTML generato dinamicamente da input utente (prevenzione XSS).
- **Sviluppo e Debug:**
    - Considerare l'adozione di un linter (ESLint) e un formattatore (Prettier).
    - Sfruttare meglio il debugger del browser.
