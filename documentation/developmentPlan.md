# Piano di Sviluppo Aggiornato

**Stato del Progetto:** Implementati i like agli articoli e ai commenti degli articoli. Articoli e conteggi commenti/like caricati e visualizzati correttamente da Firestore sia sulla homepage che sulla pagina articolo. L'azione di like agli articoli dalla homepage reindirizza alla pagina articolo e lo stato del like (cuore pieno/vuoto) sulla homepage riflette correttamente la preferenza dell'utente.

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
    * `[ ]` Sub-task B.3.2 (Miglioramento Globale): Per i like (sia quelli nuovi per gli articoli, sia quelli esistenti per i commenti del guestbook e articoli), implementare la funzionalità per visualizzare chi ha messo "Like" (es. tramite un tooltip o modale).
    * `[x]` Sub-task B.3.3: Implementazione "Like" ai commenti degli articoli in `js/articleViewer.js`.
        * *Stato:* Completato.

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
    * `[ ]` Feedback visivo per operazioni asincrone.
    * `[ ]` Migliorare gestione errori.
    * `[ ]` Ottimizzare layout mobile generale.
    * `[x]` Rivedere layout disposizione articoli homepage (roll scorrevole).
* `[ ]` Task D.2: Funzionalità Aggiuntive per l'Utente (Modifica Nazionalità, Cancella Commenti Propri).
* `[ ]` Task D.3: Ottimizzazioni del Codice (Refactoring, Commenti, Modularizzazione).
* `[ ]` Task D.4: Test e Quality Assurance.
* `[ ]` Task D.5: Filtri Avanzati per Leaderboard Globale.

🌍 **Fase Successiva (Lungo Termine): Internazionalizzazione (i18n) Completa**
* `[ ]` Task E.1: Implementare Sistema di Traduzione.
* `[ ]` Task E.2: Selettore Manuale Lingua.

---
**Considerazioni Chiave Attuali:**
* **Firestore Rules:** Continuare a verificare e affinare le regole per garantire sicurezza e funzionalità corrette per ogni nuova interazione.
* **Dati Articoli in Firestore:** Assicurarsi che tutti gli articoli in Firestore abbiano il campo `status: "published"` e i campi contatore correttamente inizializzati.
* **Modularità del Codice:** Valutare costantemente opportunità per modularizzare il codice JavaScript.
---