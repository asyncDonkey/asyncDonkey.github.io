# DEVELOPMENT PLAN (v3)

**Stato del Progetto:** Implementati i like agli articoli e ai commenti degli articoli. Articoli e conteggi commenti/like caricati e visualizzati correttamente da Firestore sia sulla homepage che sulla pagina articolo. L'azione di like agli articoli dalla homepage reindirizza alla pagina articolo e lo stato del like (cuore pieno/vuoto) sulla homepage riflette correttamente la preferenza dell'utente. La visualizzazione di chi ha messo "Mi piace" è stata implementata e testata con successo *localmente* sulla pagina `view-article.html` per i like agli articoli e ai commenti degli articoli.

---

🚧 **Prossimi Step e Task da Prioritizzare** 🚧

**Sezione B: Sistema Articoli & Contributi Utente**

* **Task B.1: Visualizzazione Articoli Completa (Pagine Dedicate)**
    * `[x]` Sub-task B.1.1: Struttura HTML per `view-article.html`.
    * `[x]` Sub-task B.1.2: Logica JS in `js/articleViewer.js` per caricare e visualizzare articolo da Firestore.
        * *Stato:* Completato.

* **Task B.2: Commenti per gli Articoli**
    * `[x]` Sub-task B.2.1: Struttura dati Firestore per commenti articoli.
    * `[x]` Sub-task B.2.2: UI per aggiungere/visualizzare commenti su `view-article.html`.
    * `[x]` Sub-task B.2.3: Visualizzazione bandierina nazionalità nei commenti.
        * *Stato:* Completato.

* **Task B.3: "Like" per gli Articoli e Miglioramento Like Esistenti**
    * `[x]` Sub-task B.3.1: Implementare un sistema di "Like" per gli articoli.
        * Logica Firestore per conteggio e `likedByUsers`: Completata.
        * UI e logica JS per like/unlike su `view-article.html`: Completata e funzionante.
        * UI e logica JS sulle card articolo in homepage (`index.html`):
            * Visualizzazione stato like (cuore pieno/vuoto) per utente loggato: `[x] Completata.`
            * Funzionalità di like/unlike diretto dalla homepage: `[x] Disabilitata come da decisione (il click reindirizza alla pagina articolo).`
    * `[ ]` Sub-task B.3.2 (Miglioramento Globale - **Visualizzazione Likers**): Implementare la funzionalità per visualizzare chi ha messo "Like" (es. tramite modale).
        * *Stato:* Funzionalità modale implementata e testata con successo *localmente* su `view-article.html` per articoli e commenti articoli. Il conteggio dei like (se > 0) è cliccabile per aprire la modale.
        * *Prossimo Step (Posticipato):* Refactoring per rendere la modale e la sua logica globalmente accessibili (da `main.js`) e estenderla ai commenti del guestbook. Attualmente posticipato per complessità di refactoring che hanno impattato altre funzionalità.
    * `[x]` Sub-task B.3.3: Implementazione "Like" ai commenti degli articoli in `js/articleViewer.js`.
        * *Stato:* Completato.
    * `[ ]` Sub-task B.3.4 (Refactoring Modale "Visualizzazione Likers" - **Posticipato**): Rendere la modale "Visualizzazione Likers" e la sua logica JavaScript globalmente accessibili (es. da `js/main.js`, con HTML modale in `index.html`) per un utilizzo cross-pagina (articoli, commenti articoli, commenti guestbook).
        * *Stato:* In attesa, posticipato.

* **Task B.4: Contribuzione Articoli da Parte degli Utenti (con Moderazione)**
    * `[ ]` Sub-task B.4.1: Creare un'interfaccia utente per la sottomissione di nuovi articoli.
    * `[ ]` Sub-task B.4.2: Integrare un editor Markdown JavaScript.
    * `[ ]` Sub-task B.4.3: Sviluppare la logica backend (regole Firestore) per salvataggio bozze.
    * `[ ]` Sub-task B.4.4: Meccanismo di approvazione/moderazione.

* **Task B.5: Gestione Dati Articoli da Firestore (Migrazione da Statico)**
    * `[x]` Sub-task B.5.A: Preparazione Dati Articolo in Firestore.
    * `[x]` Sub-task B.5.B: `js/homePageFeatures.js` carica Articoli da Firestore.
    * `[x]` Sub-task B.5.C: `js/articleViewer.js` carica Singolo Articolo da Firestore.
    * `[x]` Sub-task B.5.1: Aggiornamento `commentCount` in Firestore.
    * `[x]` Sub-task B.5.2: Visualizzazione dinamica `commentCount` sulla homepage.
        * *Stato:* Completato.

**Sezione C: Nuove Funzionalità e Miglioramenti Specifici Giochi/Piattaforma**
* `[ ]` Task C.1: Gestione Avatar Utente Personalizzato
* `[ ]` Task C.2: Ottimizzazione Layout Mobile per Donkey Runner
* `[ ]` Task C.3: Miglioramenti Leaderboard & Info Glitchzilla (Sub-task C.3.1 - C.3.4)
* `[ ]` Task C.4: Migliorare Compatibilità e Prestazioni su iOS per Donkey Runner
* `[ ]` Task C.5: Integrazione Funzionalità GitHub Issues

**Sezione D: Miglioramenti UI/UX e Ottimizzazioni Generali**

* **Task D.1: Miglioramenti UI/UX Generali**
    * `[ ]` Feedback visivo per operazioni asincrone (es. loader più evidenti, disabilitazione bottoni durante attesa).
    * `[ ]` Migliorare gestione errori (messaggi più specifici e user-friendly).
    * `[ ]` Ottimizzare layout mobile generale per tutte le pagine.
    * `[x]` Rivedere layout disposizione articoli homepage (roll scorrevole).
* **Task D.2: Funzionalità Aggiuntive per l'Utente**
    * `[ ]` Modifica Nazionalità dal profilo utente.
    * `[ ]` Possibilità per gli utenti di cancellare i propri commenti (articoli e guestbook).
* **Task D.3: Ottimizzazioni del Codice**
    * `[ ]` Refactoring generale del codice JavaScript per migliorare modularità e manutenibilità.
    * `[ ]` Aggiungere commenti dettagliati a tutte le funzioni e sezioni complesse.
* **Task D.4: Test e Quality Assurance**
    * `[ ]` Test cross-browser e cross-device approfonditi.
    * `[ ]` Definire casi di test per le funzionalità chiave.
* **Task D.5: Filtri Avanzati per Leaderboard Globale**
    * `[ ]` Implementare filtri per periodo (es. settimanale, mensile, assoluto).
    * `[ ]` Implementare filtri per nazionalità (se rilevante).
* **Task D.6: Miglioramenti Stili Commenti e Interazioni Like**
    * `[ ]` Sub-task D.6.1: Rivedere gli stili per la sezione commenti (articoli e guestbook) per migliorare leggibilità e impatto visivo.
    * `[ ]` Sub-task D.6.2: Migliorare l'aspetto e l'interattività dei bottoni "Like" e dei relativi conteggi nei commenti (articoli e guestbook), inclusa l'indicazione di cliccabilità per visualizzare i likers.

🌍 **Fase Successiva (Lungo Termine): Internazionalizzazione (i18n) Completa**
* `[ ]` Task E.1: Implementare Sistema di Traduzione (es. con JSON e JS).
* `[ ]` Task E.2: Selettore Manuale Lingua per l'utente.

---
**Considerazioni Chiave e Miglioramenti Futuri Possibili:**

* **Firestore Rules:** Continuare a verificare e affinare le regole per garantire sicurezza e funzionalità corrette per ogni nuova interazione. Con l'aggiunta di nuove funzionalità, le regole diventano sempre più cruciali.
* **Dati Articoli in Firestore:** Assicurarsi che tutti gli articoli in Firestore abbiano il campo `status: "published"` e i campi contatore (`likeCount`, `commentCount`) correttamente inizializzati a 0 se non presenti.
* **Modularità del Codice JavaScript:**
    * Valutare costantemente opportunità per modularizzare il codice. Ad esempio, la gestione delle modali (login, signup, likedBy) potrebbe essere centralizzata in un modulo `modals.js`.
    * Le interazioni con Firestore (letture/scritture) per entità specifiche (articoli, commenti, profili) potrebbero essere raggruppate in moduli dedicati (es. `firestoreServiceArticles.js`, `firestoreServiceComments.js`) per separare la logica di accesso ai dati dalla logica UI.
* **Gestione dello Stato Globale:** Per applicazioni più complesse, considerare un semplice gestore di stato o l'uso di Custom Events per comunicare cambiamenti di stato tra moduli disaccoppiati (es. stato di login).
* **Performance:**
    * Ottimizzare il caricamento delle immagini (es. lazy loading per immagini non immediatamente visibili).
    * Minificare i file JS e CSS per la produzione.
    * Analizzare le query Firestore per assicurarsi che siano efficienti e utilizzino indici ove necessario.
* **User Experience (UX):**
    * **Notifiche Toast:** Invece di `alert()`, usare notifiche "toast" non intrusive per feedback (es. "Commento inviato!", "Like registrato!", "Errore: ...").
    * **Caricamento Scheletro (Skeleton Loading):** Per le sezioni che caricano dati (articoli, commenti), mostrare placeholder "scheletro" dell'interfaccia invece di un semplice "Caricamento..." per migliorare la percezione della velocità.
    * **Accessibilità (a11y):** Continuare a testare e migliorare l'accessibilità, ad esempio assicurando che tutti gli elementi interattivi siano navigabili e utilizzabili da tastiera e che gli attributi ARIA siano usati correttamente, specialmente per componenti dinamici come le modali.
* **Sicurezza:**
    * Oltre alle regole Firestore, validare sempre i dati di input sia lato client (per UX immediata) sia lato server/regole Firestore (per sicurezza effettiva).
    * Sanificare qualsiasi output HTML generato dinamicamente da input utente per prevenire XSS (anche se Firestore di per sé non è vulnerabile a SQL injection, l'iniezione di HTML/JS nel rendering lato client è sempre una preoccupazione).
* **Sviluppo e Debug:**
    * Considerare l'adozione di un linter più configurato (ESLint con regole specifiche) e un formattatore (Prettier) per mantenere la coerenza del codice.
    * Sfruttare meglio il debugger del browser per tracciare problemi complessi.