# DEVELOPMENT PLAN (v3.4 Aggiornato)

**Stato del Progetto:** Implementati i like agli articoli, ai commenti degli articoli e ai commenti del guestbook (con visualizzazione likers). Integrato l'editor Markdown EasyMDE nella pagina di sottomissione articoli (submit-article.html), che ora è funzionante inclusa l'anteprima. La scritta placeholder sotto l'editor è stata rimossa.

---

🚧 **Prossimi Step e Task da Prioritizzare** 🚧

**Sezione A: Gestione Contributi e Moderazione (Nuova Sezione per Organizzazione)**

- **Task A.1: Pagina "Contribuisci"**
    - `[ ]` Sub-task A.1.1: Creare la pagina HTML `contribute.html`.
        - _Contenuto Iniziale:_
            - Spiegazione del processo di sottomissione articoli (revisione, editor Markdown).
            - Breve introduzione al Markdown (con cenni storici).
            - Link placeholder a un futuro articolo dettagliato sul Markdown (`view-article.html?id=markdown-guide-placeholder`).
            - Link alla pagina `submit-article.html` per chi vuole scrivere un articolo.
            - Introduzione alla sezione "Issue Tracking / Suggerimenti".
    - `[ ]` Sub-task A.1.2: Aggiungere un link a `contribute.html` nella navigazione principale (header), visibile a tutti.
- **Task A.2: Sistema di Tracciamento Issue/Suggerimenti (Integrato o Dedicato)**
    - `[ ]` Sub-task A.2.1: Definire la struttura dati in Firestore per le "Issues" (es. collezione `userIssues`).
        - _Campi previsti:_ `title`, `description`, `type` (gameIssue, generalFeature, newGameRequest), `submittedBy` (userId, userName), `timestamp`, `status` (new, accepted, inProgress, completed, declined), `upvotes`, `upvotedBy` (array di UID).
        - _Specifiche Tipi Issue:_
            - `gameIssue`: Relativa a un gioco specifico (richiederà un campo aggiuntivo `gameId` o simile).
            - `generalFeature`: Richiesta di implementazione generale per il sito/piattaforma.
            - `newGameRequest`: Suggerimento per un nuovo gioco.
    - `[ ]` Sub-task A.2.2: Creare l'interfaccia utente in `contribute.html` (o una nuova pagina `issues.html` linkata da `contribute.html`) per:
        - Visualizzare le issue esistenti (con filtri per tipo/status).
        - Permettere agli utenti loggati di inviare nuove issue (scegliendo il tipo).
        - Permettere agli utenti loggati di fare "upvote" alle issue esistenti.
    - `[ ]` Sub-task A.2.3: Implementare la logica JS per inviare nuove issue e registrare gli upvote in Firestore.
    - `[ ]` Sub-task A.2.4: Implementare la visualizzazione delle issue e dei relativi conteggi di upvote.
    - `[ ]` Sub-task A.2.5: (Admin) Interfaccia base per moderare/aggiornare lo stato delle issue.
- **Task A.3: Moderazione e Pubblicazione Articoli (Continuazione di B.4)**
    - `[ ]` Sub-task A.3.1 (Ex B.4.3): Raffinare e finalizzare le regole Firestore per `articles` per garantire sicurezza e workflow corretti per `draft`, `pendingReview`, e `published`.
        - _Obiettivo:_ Solo gli autori possono modificare le proprie bozze. Solo i moderatori/admin possono cambiare lo status da `pendingReview` a `published` o respingere.
    - `[ ]` Sub-task A.3.2 (Ex B.4.4): Sviluppare un'interfaccia admin/moderatore (nuova pagina `admin-dashboard.html` o sezione protetta) per:
        - Visualizzare gli articoli con status `pendingReview`.
        - Leggere il contenuto dell'articolo.
        - Modificare (correzioni minori) l'articolo prima della pubblicazione (opzionale, potrebbe essere solo approva/respingi).
        - Cambiare lo status dell'articolo a `published` (rendendolo visibile a tutti) o `rejected` (con eventuale notifica/feedback all'autore - futuro).
        - Assegnare `publishedAt: serverTimestamp()` quando un articolo viene pubblicato.
    - `[ ]` Sub-task A.3.3: Implementare la logica JS per l'interfaccia admin.
    - `[ ]` Sub-task A.3.4: (Opzionale Esteso) Sistema di notifica base per l'autore quando l'articolo viene approvato o respinto.

**Sezione B: Sistema Articoli & Contributi Utente (Rimanenti da Task Originale)**

- **Task B.1: Visualizzazione Articoli Completa (Pagine Dedicate)** `[x]`
- **Task B.2: Commenti per gli Articoli** `[x]`
- **Task B.3: "Like" per gli Articoli e Miglioramento Like Esistenti** `[x]`
- **Task B.4: Contribuzione Articoli da Parte degli Utenti (con Moderazione)**
    - `[x]` Sub-task B.4.1: Creare un'interfaccia utente per la sottomissione di nuovi articoli (`submit-article.html`).
    - `[x]` Sub-task B.4.2: Integrare un editor Markdown JavaScript (EasyMDE) in `submit-article.html`.
    - `[ ]` _SPOSTATO e RINOMINATO in Task A.3.1_ (Ex B.4.3: Sviluppare la logica backend (regole Firestore) per salvataggio bozze, pendingReview, published).
    - `[ ]` _SPOSTATO e RINOMINATO in Task A.3.2, A.3.3_ (Ex B.4.4: Meccanismo di approvazione/moderazione).
- **Task B.5: Gestione Dati Articoli da Firestore (Migrazione da Statico)** `[x]`

**Sezione G: Guestbook**

- **Task G.1: Implementazione "Like" per Commenti Guestbook** `[x]`

**Sezione C: Nuove Funzionalità e Miglioramenti Specifici Giochi/Piattaforma**

- `[ ]` Task C.1: Gestione Avatar Utente Personalizzato
- `[ ]` Task C.2: Ottimizzazione Layout Mobile per Donkey Runner
- `[ ]` Task C.3: Miglioramenti Leaderboard & Info Glitchzilla (Sub-task C.3.1 - C.3.4)
- `[ ]` Task C.4: Migliorare Compatibilità e Prestazioni su iOS per Donkey Runner
- `[ ]` Task C.5: _RIMOSSO_ (La funzionalità di tracciamento issue ora è il Task A.2, più completo e integrato).

**Sezione D: Miglioramenti UI/UX e Ottimizzazioni Generali**

- **Task D.1: Miglioramenti UI/UX Generali**
    - `[ ]` Feedback visivo per operazioni asincrone (es. loader più evidenti, disabilitazione bottoni durante attesa).
    - `[ ]` Migliorare gestione errori (messaggi più specifici e user-friendly).
    - `[ ]` Ottimizzare layout mobile generale per tutte le pagine.
    - `[x]` Rivedere layout disposizione articoli homepage (roll scorrevole).
    - `[ ]` Sub-task D.1.1 (Nuovo): Aggiungere link/pulsante per "Scrivi Articolo" alla navigazione (header) e/o pagina profilo, visibile solo a utenti loggati.
- **Task D.2: Funzionalità Aggiuntive per l'Utente**
    - `[ ]` Modifica Nazionalità dal profilo utente.
    - `[ ]` Possibilità per gli utenti di cancellare i propri commenti (articoli e guestbook).
- **Task D.3: Ottimizzazioni del Codice**
    - `[x]` _NON VERRA' EFFETTUATO_ - Refactoring generale del codice JavaScript per migliorare modularità e manutenibilità.
    - `[ ]` Aggiungere commenti dettagliati a tutte le funzioni e sezioni complesse.
- **Task D.4: Test e Quality Assurance**
    - `[ ]` Test cross-browser e cross-device approfonditi.
    - `[ ]` Definire casi di test per le funzionalità chiave.
- **Task D.5: Filtri Avanzati per Leaderboard Globale**
    - `[ ]` Implementare filtri per periodo (es. settimanale, mensile, assoluto).
    - `[ ]` Implementare filtri per nazionalità (se rilevante).
- **Task D.6: Miglioramenti Stili Commenti e Interazioni Like**
    - `[ ]` Sub-task D.6.1: Rivedere gli stili per la sezione commenti (articoli e guestbook) per migliorare leggibilità e impatto visivo.
    - `[x]` Sub-task D.6.2: Migliorare l'aspetto e l'interattività dei bottoni "Like" e dei relativi conteggi nei commenti (articoli e guestbook), inclusa l'indicazione di cliccabilità per visualizzare i likers. (Parzialmente completato, UX migliorata).

🌍 **Fase Successiva (Lungo Termine): Internazionalizzazione (i18n) Completa**

- `[ ]` Task E.1: Implementare Sistema di Traduzione (es. con JSON e JS).
- `[ ]` Task E.2: Selettore Manuale Lingua per l'utente.

---

**Considerazioni Chiave e Miglioramenti Futuri Possibili:**

- **Firestore Rules:** Continuare a verificare e affinare le regole per garantire sicurezza e funzionalità corrette per ogni nuova interazione (diventa ancora più cruciale con moderazione articoli e gestione issue).
- **Admin Roles:** Per la moderazione degli articoli (Task A.3) e la gestione delle issue (Task A.2.5), sarà necessario un sistema per identificare gli utenti amministratori/moderatori. Questo potrebbe essere un campo booleano `isAdmin: true` nel documento `userProfiles` di utenti specifici. Le regole Firestore dovranno poi controllare questo campo per le operazioni di amministrazione.
- **Modularità del Codice JavaScript:** Con l'aggiunta della pagina "Contribuisci" e la gestione delle "Issue", considera di creare file JS dedicati (es. `contributePage.js`, `issueTracker.js`) e di mantenere `main.js` per le funzionalità veramente globali. Le interazioni con Firestore (letture/scritture) per entità specifiche (articoli, commenti, profili) potrebbero essere raggruppate in moduli dedicati (es. `firestoreServiceArticles.js`, `firestoreServiceComments.js`).
- **User Experience (UX) per Issue Tracker:** Filtri, ordinamento, e un'interfaccia chiara saranno importanti per la sezione delle issue.
- **Gestione dello Stato Globale:** Per applicazioni più complesse, considerare un semplice gestore di stato o l'uso di Custom Events per comunicare cambiamenti di stato tra moduli disaccoppiati (es. stato di login).
- **Performance:**
    - Ottimizzare il caricamento delle immagini (es. lazy loading per immagini non immediatamente visibili).
    - Minificare i file JS e CSS per la produzione.
    - Analizzare le query Firestore per assicurarsi che siano efficienti e utilizzino indici ove necessario.
- **User Experience (UX) Generale:**
    - **Notifiche Toast:** Invece di `alert()`, usare notifiche "toast" non intrusive per feedback (es. "Commento inviato!", "Like registrato!", "Errore: ...").
    - **Caricamento Scheletro (Skeleton Loading):** Per le sezioni che caricano dati (articoli, commenti), mostrare placeholder "scheletro" dell'interfaccia invece di un semplice "Caricamento..." per migliorare la percezione della velocità.
    - **Accessibilità (a11y):** Continuare a testare e migliorare l'accessibilità, ad esempio assicurando che tutti gli elementi interattivi siano navigabili e utilizzabili da tastiera e che gli attributi ARIA siano usati correttamente, specialmente per componenti dinamici come le modali.
- **Sicurezza:**
    - Oltre alle regole Firestore, validare sempre i dati di input sia lato client (per UX immediata) sia lato server/regole Firestore (per sicurezza effettiva).
    - Sanificare qualsiasi output HTML generato dinamicamente da input utente per prevenire XSS.
- **Sviluppo e Debug:**
    - Considerare l'adozione di un linter più configurato (ESLint con regole specifiche) e un formattatore (Prettier) per mantenere la coerenza del codice.
    - Sfruttare meglio il debugger del browser per tracciare problemi complessi.
