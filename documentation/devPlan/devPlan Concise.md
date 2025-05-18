# DEVELOPMENT PLAN (v3.17.6 - Icon Revamp Esteso, Test Pre/Post Deploy) 🚀

**Data Ultimo Aggiornamento:** 18 Maggio 2025

**Stato del Progetto:** Registrazione utente centralizzata e profilo utente (visualizzazione dati, stato d'animo, link esterni CRUD base, navigazione URL per visualizzazione pubblica/privata, link ai profili utente da nomi autore articoli, commenti articoli/guestbook e leaderboard) implementati e funzionanti. Pulsanti di condivisione per articoli (base con `navigator.share` e fallback "Copia Link") OK. Documentazione schema Firestore (`firestore-schema.md`) e commenti base per le Regole Firestore (`firestore.rules`) completati. Funzionalità admin per articoli (inclusa `rejectionReason` e pre-popolamento) e issue tracker base (creazione, visualizzazione, upvote, gestione admin status, risoluzione bug invio issue e feature request da Donkey Runner) operative. Like per articoli/commenti, editor Markdown, gestione bozze e stati articoli utente, notifiche Toast, Linter/Formatter e `.gitignore` OK. Fix recenti hanno risolto problemi di visualizzazione dei commenti per utenti loggati/non loggati su pagine articolo e il corretto funzionamento dei controlli mobili in Donkey Runner. Integrazione Material Symbols e spostamento link ".Dev" nel footer completati. Nuova navbar (desktop ibrida, mobile hamburger) implementata, testata e funzionante. Valutazione preliminare per l'implementazione di Cloud Functions (Task E.4) completata. Revisione testi e layout mobile base pagina 'About' (`about.html` - Task D.11) completata. Correzione icone like/commenti in `view-article.html` e `js/comments.js` (guestbook) completata.

---

🚧 **Prossimi Step e Task da Prioritizzare** 🚧

## Sezione AUTH: Gestione Autenticazione e Profilo Utente ✨👤

* **Task AUTH.1: Centralizzazione e Miglioramento Processo di Registrazione** `[x]`
* **Task AUTH.2: Semplificazione e Conferma Funzionalità Profilo Utente** `[x]`
* **Task AUTH.3: Miglioramenti Funzionali Pagina Profilo Utente (`profile.html`)**
    * `[x]` Sub-task AUTH.3.1: Implementare "Stato d'Animo" (Status Message).
    * `[x]` **Sub-task AUTH.3.2: Implementare Link a Contenuti Esterni.**
        * `[x]` Sub-task AUTH.3.2.1: Gestione CRUD (Aggiunta, Modifica, Eliminazione) e Visualizzazione Base Link.
        * `[ ]` Sub-task AUTH.3.2.2 (Miglioramento Visivo): Migliorare visualizzazione link esterni per includere anteprime o icone sito (Ricerca iniziale su fattibilità e complessità, poi implementazione. Priorità Media).
    * `[x]` **Sub-task AUTH.3.3: Rendere Pagina Profilo Navigabile e Pubblica.**
        * `[x]` Parte 1: Logica per caricare profili via `userId` URL e distinzione UI pubblica/privata.
        * `[x]` Parte 2.LEADERBOARD: Trasformare nomi utente nella leaderboard in link cliccabili.
        * `[x]` Parte 2.ALTRO: Trasformare i nomi utente (su articoli, commenti articolo, commenti guestbook) in link cliccabili ai rispettivi profili pubblici (`profile.html?userId=<ID_UTENTE>`).
    * `[ ]` Sub-task AUTH.3.4 (Opzionale/Idee Future):
        * `[ ]` **Mini-Bio Utente:** Campo `bio: string` (max 300 caratteri) in `userProfiles`, UI e logica per modifica/visualizzazione. (Priorità Media)
        * `[ ]` **Contatori Semplici:** Visualizzare data di registrazione sul profilo. (Priorità Bassa)
        * `[ ]` **Badge/Achievements Semplici (Pilota):** (Priorità Bassa/Valutare dopo altre funzionalità core)
    * `[ ]` **Sub-task AUTH.3.5 (Nuovo): Articoli Preferiti / Segnalibri.** (Priorità Bassa)
        * `[ ]` Struttura Dati: Campo `bookmarkedArticles: array<string>` (lista di `articleId`) in `userProfiles`.
        * `[ ]` UI: Pulsante "Salva/Rimuovi dai Preferiti" sulle card articolo (`index.html`) e nella pagina articolo (`view-article.html`).
        * `[ ]` Visualizzazione: Sezione "I Miei Articoli Salvati" in `profile.html` (solo per il proprietario del profilo).
        * `[ ]` Logica JS per interazione e regole Firestore per aggiornare `bookmarkedArticles`.

## Sezione A: Gestione Contributi e Moderazione 🖋️
* (Task A.1 - A.3.3 come da piano precedente - Principalmente `[x]`)
* **Task A.4: Miglioramenti Dashboard Admin (`admin-dashboard.html`)**
    * (Sub-task A.4.1 - A.4.2.6 come da piano precedente)
    * `[x]` A.4.2.7: Pre-popolamento form da articoli respinti.
    * `[ ]` Sub-task A.4.2.6.A (Miglioramento UI): Modificare UI in `admin-dashboard.html` per inserimento `rejectionReason` tramite `textarea` (invece di `prompt()`). (Priorità Media)
    * `[ ]` **Task A.4.3: Visualizzazione e Gestione Utenti.** (Priorità Bassa/Futuro)
        * `[ ]` Sub-task A.4.3.1: Lista utenti registrati con info base (nickname, email, data registrazione).
        * `[ ]` Sub-task A.4.3.2: Link al profilo pubblico di ogni utente.
        * `[ ]` Sub-task A.4.3.3: (Valutare) Funzionalità base di ban/sospensione.
    * `[ ]` **Task A.4.4 (Nuovo): Statistiche Utente Aggregate per Admin.** (Priorità Bassa/Futuro)
        * `[x]` Sub-task A.4.4.1: Ricerca su come aggregare dati da Firestore in modo efficiente (query dirette o Cloud Functions per conteggi periodici). *(Valutazione Cloud Functions completata, vedi E.4)*
        * `[ ]` Sub-task A.4.4.2: UI in `admin-dashboard.html` per visualizzare: Numero totale utenti, Numero articoli per stato, Numero issue per tipo/stato, Issue più votate (opzionale).
* `[ ]` **Task A.5 (Nuovo): Sistema di Notifiche In-App (Base).** (Priorità Media-Bassa)
    * `[ ]` Sub-task A.5.1: Struttura dati `userNotifications` (`userId`, `message`, `type` (articlePublished, articleRejected, commentReply, newBadge, system), `linkToContent`, `timestamp`, `isRead: boolean`).
    * `[ ]` Sub-task A.5.2: Logica in `adminDashboard.js` per creare notifiche quando un articolo viene approvato o respinto. *(Valutare se spostare a Cloud Functions per robustezza, vedi E.4)*
    * `[ ]` Sub-task A.5.3: UI base nell'header (es. icona campanella con contatore) per utenti loggati.
    * `[ ]` Sub-task A.5.4: Pagina o dropdown per visualizzare le notifiche e marcarle come lette.
    * `[ ]` Sub-task A.5.5 (Nuovo): Valutare notifiche per interazioni sociali (es. 'Il tuo articolo è stato commentato', 'Qualcuno ha risposto al tuo commento', 'Il tuo articolo è stato condiviso' - quest'ultima potrebbe essere complessa da tracciare senza Cloud Functions). (Priorità Bassa/Futuro, vedi E.4)

---
## Sezione B & G: Articoli, Contributi Utente, Guestbook `[x]` (Funzionalità base complete) 📝📖
---

## Sezione C: Nuove Funzionalità e Miglioramenti Specifici Giochi/Piattaforma 🎮

* `[ ]` **Task C.1:** Gestione Avatar Utente Personalizzato (Upload immagine tramite Firebase Storage). (Priorità Media-Bassa) *(Vedi E.4 per potenziale uso di Cloud Functions per processamento)*
* `[x]` **Task C.2: Ottimizzazione Layout Mobile per Donkey Runner.**
    * `[ ]` **Sub-task C.2.8: Risolvere problemi file audio mancanti** (`game_over.mp3`, `shield_block.mp3`). Verificare percorsi e presenza file. **(Priorità Bassa)**
    * `[x]` Sub-task C.2.1: Testare `donkeyRunner.html` su diverse risoluzioni mobile.
    * `[x]` Sub-task C.2.2: Verificare e ottimizzare comodità, reattività e posizionamento dei controlli touch.
    * `[x]` Sub-task C.2.3: Assicurare che il `<canvas>` del gioco si ridimensioni correttamente.
    * `[ ]` Sub-task C.2.4: Verificare e migliorare la leggibilità di punteggio, menu, game over e altri testi del gioco su schermi piccoli, sia su canvas che HTML. (Priorità Media)
    * `[x]` Sub-task C.2.5: Implementare logica per forzare/suggerire orientamento landscape in modalità fullscreen.
    * `[x]` Sub-task C.2.6: Assicurare che il form di salvataggio punteggio e il pulsante Start/Restart mobile siano ben visibili e utilizzabili.
    * `[x]` Sub-task C.2.7: Risolvere problema visualizzazione pulsante SHT in fullscreen landscape.
* `[ ]` **Task C.3: Miglioramenti Leaderboard & Info Glitchzilla.** (Priorità Medio-Alta)
    * `[ ]` Sub-task C.3.1: Visualizzare stato/info Glitchzilla in `donkeyRunner.html`.
    * `[ ]` Sub-task C.3.2: (Opzionale) Aggiungere filtri o tab alla pagina `leaderboard.html`.
    * `[ ]` Sub-task C.3.3: Nella leaderboard, distinguere chiaramente gli utenti registrati dagli "Ospiti".
* `[ ]` **Task C.4:** Migliorare Compatibilità e Prestazioni su iOS per Donkey Runner. (Priorità Media)
* `[ ]` **Task C.5 (Nuovo): Migliorare UI/UX di Donkey Runner Game.** (Priorità Media)
    * `[ ]` Sub-task C.5.1: Revisione elementi grafici del gioco.
    * `[ ]` Sub-task C.5.2: Migliorare feedback visivi.
    * `[ ]` Sub-task C.5.3: Ottimizzare la presentazione del menu, game over, e istruzioni.
    * `[ ]` Sub-task C.5.4: Valutare animazioni più fluide o effetti particellari.

---

## Sezione D: Miglioramenti UI/UX e Ottimizzazioni Generali ✨

* `[ ]` **Task D.1: Miglioramenti UI/UX Generali**
    * `[x]` Sub-task D.1.A: Implementare Notifiche Toast per Feedback Utente (Modulare).
        * `[ ]` Sub-task D.1.A.1 (Nuovo): Aggiungere notifiche toast per conferma/errore quando si mette/toglie un like (articoli e commenti). (Priorità Media-Bassa)
    * `[ ]` Sub-task D.1.B: Migliorare Messaggi di Caricamento. (Priorità Media)
    * `[ ]` Sub-task D.1.C: Migliorare Gestione Errori. (Priorità Media)
    * `[ ]` Sub-task D.1.D: Ottimizzazione layout mobile generale. (Priorità Media)
* `[ ]` D.2: Possibilità per gli utenti di cancellare i propri commenti. (Priorità Bassa)
* `[x]` D.7: Miglioramento Grafico Card Articoli Homepage.
* `[ ]` **Task D.7.1 (Nuovo - Idea): Miglioramento Interattività Card Articoli Homepage.** (Priorità Bassa/Futuro)
    * `[ ]` Sub-task D.7.1.1: Valutare interazioni avanzate per le card articolo su `index.html` (es. effetto "ruota" o modale espansa al click/hover per più dettagli, simile all'idea per le skill cards).
* `[x]` **Task BUGFIX-001: Risolvere Permessi Firestore e Aggiornare UI per Commenti/Feedback.**
    * `[x]` Sub-task BUGFIX-001.1: **Commenti Articoli (`articleViewer.js`, `view-article.html`):** UI aggiornata per richiedere login.
    * `[x]` Sub-task BUGFIX-001.2: **Bug Report (`bugReports.js`, `donkeyRunner.html`):** Regole Firestore corrette.
    * `[x]` Sub-task BUGFIX-001.3: **Feature Request (`featureRequests.js`, `donkeyRunner.html`):** Regole Firestore corrette.
    * `[x]` Sub-task BUGFIX-001.4: **Issue Tracker Generale (`issueTracker.js`, `contribute.html`):** Regole Firestore per creazione e upvote corrette.
* **Task D.3: Ottimizzazioni del Codice e Documentazione**
    * `[x]` Sub-task D.3.A: Configurazione Linter (ESLint) e Formatter (Prettier).
    * `[ ]` **Sub-task D.3.B: Documentazione Approfondita del Codice e del Progetto.** (Priorità Alta - In corso, JSDoc posticipato per ora)
        * `[ ]` D.3.B.1: JSDoc per tutte le funzioni pubbliche e logiche complesse in tutti i file `.js` (da riprendere).
        * `[ ]` D.3.B.2: Commenti inline chiari per passaggi non ovvi (da integrare durante lo sviluppo).
        * `[ ]` D.3.B.3: Commenti a livello di modulo/file (da integrare).
        * `[x]` D.3.B.4: Creare/Aggiornare `documentation/firestore-schema.md`.
        * `[x]` D.3.B.5: Commentare estensivamente le Regole Firestore (`firestore.rules`).
        * `[ ]` D.3.B.6: Revisionare e aggiornare `README.md` del progetto (descrizione, setup, funzionalità).
        * `[x]` D.3.B.7: Mantenere aggiornato il `DEVELOPMENT_PLAN.md`.
* **Task D.4: Test e QA (Quality Assurance)** (Priorità Continua/Finale)
    * `[ ]` D.4.1: Definire casi di test per le funzionalità chiave (nuove e modificate).
    * `[ ]` D.4.2: Eseguire un ciclo di test manuali completo pre-deploy.
    * `[ ]` D.4.3: Eseguire un ciclo di test di verifica post-deploy.
    * _Nota: Test di base vengono eseguiti dopo ogni implementazione. Cicli di QA più strutturati sono previsti prima e dopo i deploy principali._
* **Task D.8: Integrazioni Esterne e Condivisione**
    * `[x]` Sub-task D.8.1: Implementare Pulsanti di Condivisione (Share Buttons) per articoli.
        * `[ ]` Estendere a Punteggi Giochi (in `donkeyRunner.html`, dopo salvataggio punteggio). (Priorità Media)
    * `[ ]` Sub-task D.8.2: Collegare a GitHub Issues. (Priorità Bassa)
    * `[ ]` Sub-task D.8.3 (Ricerca): Documentazione su widget/embedding. (Priorità Bassa)
* `[ ]` **Task D.9 (Nuovo): Migliorare UX per Utente Non Registrato.** (Priorità Media)
    * `[ ]` Sub-task D.9.1: Analizzare i percorsi utente non registrato.
    * `[ ]` Sub-task D.9.2: Assicurare che i "call to action" per la registrazione/login siano chiari e contestuali.
    * `[ ]` Sub-task D.9.3: Valutare se limitare alcune funzionalità per incentivare la registrazione.
    * `[ ]` Sub-task D.9.4: Fornire spiegazioni chiare sui benefici della registrazione.
* `[x]` **Task D.10 (Nuovo): Revisione Layout e Design Navbar.**
    * `[x]` Sub-task D.10.1: Analizzare il comportamento attuale della navbar su diverse larghezze di schermo.
    * `[x]` Sub-task D.10.2: Progettare alternative per gestire un numero crescente di link (Desktop: Ibrida con Dropdown "Community"; Mobile: Hamburger Menu).
    * `[x]` Sub-task D.10.3: Implementare e testare la nuova soluzione per la navbar (HTML, CSS e JS).
    * `[x]` Sub-task D.10.4: Spostare il link '.Dev' (che punta ad `about.html`) dalla navbar principale al footer.
    * `[x]` **Sub-task D.10.5 (Nuovo - Debug): Risolvere problemi di scope e referenze in `js/main.js` per il corretto funzionamento del menu hamburger, del dropdown "Community" e aggiornamento dinamico dei link condizionali.**
    * `[x]` **Sub-task D.10.6 (Nuovo): Implementare logica in `js/main.js` per visualizzare condizionalmente il link "Admin Dashboard" nel footer solo per utenti admin.**
* `[x]` **Task D.11 (Nuovo): Revisione Contenuto e Layout Pagina 'About' (`about.html`).**
    * `[x]` Sub-task D.11.1: Rileggere e migliorare la chiarezza e l'impatto dei testi nella pagina 'About'.
    * `[x]` Sub-task D.11.2: Analizzare e correggere i problemi di layout mobile specifici di `about.html`.
    * `[ ]` **Sub-task D.11.3 (Nuovo - Idea): Migliorare interattività sezione "Competenze Tecniche" (`about.html`).** (Priorità Bassa/Futuro)
        * `[ ]` Sub-task D.11.3.1: Al click su una skill card, invece di mostrare la descrizione sotto, aprire una modale con descrizione più dettagliata.
        * `[ ]` Sub-task D.11.3.2: Aggiungere un link "Scopri di più" nella modale che reindirizza a una risorsa esterna (es. Wikipedia) per quella competenza.
        * `[ ]` Sub-task D.11.3.3 (Idea Avanzata): Valutare se la griglia delle competenze può essere trasformata in una "ruota di schede" interattiva (swipe su mobile, controlli su desktop).

---
## Sezione E: Ricerca e Sviluppo a Lungo Termine 🔬📈
* `[ ]` Task E.1 Propagazione Dati (Priorità Bassa/Futuro)
* `[ ]` Task E.2 Messaggistica Interna (Priorità Bassa/Futuro)
* `[ ]` **Task E.3 (Nuovo): Ricerca su come creare un'applicazione mobile per il sito.** (Priorità Bassa/Futuro)
    * `[ ]` Sub-task E.3.1: Analizzare tecnologie PWA (Progressive Web App) per offrire un'esperienza app-like installabile.
    * `[ ]` Sub-task E.3.2: Valutare framework come Capacitor o Ionic per creare wrapper nativi se PWA non sufficiente.
    * `[ ]` Sub-task E.3.3: Definire MVP per l'app mobile (es. visualizzazione articoli, notifiche push base).
* `[x]` **Task E.4 (Nuovo): Valutazione Implementazione Cloud Functions per Funzionalità Avanzate.** *(Ricerca Iniziale e Valutazione Completate)*
    * `[x]` Sub-task E.4.1: Analisi requisiti per notifiche utente complesse (es. articolo condiviso, nuovo badge), aggiornamenti contatori aggregati, e potenziale propagazione dati avatar. *(Completato in `documentation/cloudFunctionsEvaluation.md`)*
    * `[x]` Sub-task E.4.2: Stima complessità e valutazione competenze per lo sviluppo di Cloud Functions in Node.js/TypeScript. *(Completato in `documentation/cloudFunctionsEvaluation.md`)*
    * `[x]` Sub-task E.4.3: Valutazione costi potenziali associati a Cloud Functions (Firebase/Google Cloud). *(Completato in `documentation/cloudFunctionsEvaluation.md`)*
    * `[ ]` Sub-task E.4.4: Decisione sull'adozione e pianificazione implementazione per funzionalità specifiche. *(Prossimo passo per questo task)*

---
## Sezione F: Fase di Perfezionamento Finale (Polish) 💅🎨

* **Task F.1: Revisione HTML/CSS.** (Priorità Media-Bassa)
* `[ ]` **Task F.2 (Nuovo): Revamp Grafico Generale.** (Priorità Bassa/Futuro)
    * `[ ]` Sub-task F.2.1: Ricerca e definizione di un nuovo stile visivo.
    * `[ ]` Sub-task F.2.2: Prototipazione di UI per sezioni chiave.
    * `[ ]` Sub-task F.2.3: Implementazione graduale del nuovo tema.
    * `[x]` **Sub-task F.2.4 (Nuovo): Integrazione Libreria Icone Moderna.**
        * `[x]` Sub-task F.2.4.1: Scelta Libreria (Material Symbols - Rounded).
        * `[x]` Sub-task F.2.4.2: Integrazione della libreria scelta nel progetto (via CDN).
        * `[x]` Sub-task F.2.4.3: Sostituzione graduale delle icone SVG personalizzate esistenti e utilizzo della nuova libreria per future necessità, ove appropriato (Navbar, Footer e prime icone UI completate).
        * `[ ]` **Sub-task F.2.4.3.A (Nuovo - Dettaglio di F.2.4.3): Revamp Icone UI con Material Symbols.** (Priorità Media-Bassa)
            * `[ ]` Sub-task F.2.4.3.A.1: **Pulsanti Like/Commenti:** Sostituire emoji/SVG con Material Symbols (es. `favorite` / `favorite_border`, `comment` / `chat_bubble_outline`)
                * `[ ]` `index.html` (card articoli)                 * `[x]` `view-article.html` (articolo e commenti)                 * `[x]` `js/comments.js` (guestbook)             * `[ ]` Sub-task F.2.4.3.A.2: **Icone Sezioni Homepage:** Valutare e sostituire le icone SVG nelle `portal-card` di `index.html` (es. `.Dev` -> `code_blocks`, `CodeDash!` -> `sports_esports`, `Leaderboard` -> `emoji_events`, `Mini Leaderboard` -> `list_alt`, `Feedback` -> `feedback`, `Guestbook` -> `forum`, `Articolo Evidenza` -> `star`).
            * `[ ]` Sub-task F.2.4.3.A.3: **Sezione Bug Report/Feature Request (`donkeyRunner.html` e `contribute.html`):** Utilizzare icone appropriate (es. `bug_report`, `lightbulb`, `send`).
            * `[ ]` Sub-task F.2.4.3.A.4: **Pagina "Contribuisci" (`contribute.html`):** Associare icone ai titoli delle sezioni (es. "Scrivere un Articolo" -> `article`, "Markdown" -> `notes`, "Segnalazioni" -> `campaign`).
            * `[ ]` Sub-task F.2.4.3.A.5: **Pagina Profilo (`profile.html`):** Icone per "Stato d'Animo" (es. `mood`), "Link Esterni" (es. `link`), "I Miei Articoli" (es. `dynamic_feed`), azioni CRUD link (es. `add_circle`, `edit`, `delete`).
            * `[ ]` Sub-task F.2.4.3.A.6: **Admin Dashboard (`admin-dashboard.html`):** Icone per azioni (es. `visibility`, `edit`, `check_circle`, `cancel`, `delete_forever`), sezioni (es. `pending_actions`, `history_edu`, `gpp_bad`).
            * `[ ]` Sub-task F.2.4.3.A.7: **Pulsanti di Condivisione (`view-article.html`):** Sostituire SVG con Material Symbols per "Condividi" e "Copia Link" (es. `share`, `link`). _Nota: I pulsanti social specifici (X, Facebook, etc.) manterranno probabilmente il loro branding testuale o icone specifiche della piattaforma se non si usano Material Symbols per quelli._
            * `[ ]` Sub-task F.2.4.3.A.8: **Altre Azioni UI Minori:** Scansionare il sito per altre piccole icone o emoji che potrebbero essere sostituite per coerenza (es. frecce, simboli di conferma/errore non gestiti da Toast).

---
🌍 ## Fase Successiva (Lungo Termine): Internazionalizzazione (i18n) Completa `[ ]`
---

## Considerazioni Chiave e Suggerimenti Migliorativi (Aggiornate) 💡
* **Test Regole Firestore:** Essenziale.
* **Modularità Codice JS:** Continuare a valutare.
* **Anteprime Link Esterni (AUTH.3.2.2):** Fattibilità da ricercare.
* **UX Mobile Donkey Runner:** Leggibilità testo (C.2.4) ancora da migliorare.
* **Gestione File Audio (Donkey Runner C.2.8):** Da non dimenticare.
* **Documentazione:** Proseguire con commenti inline/modulo e aggiornare README. JSDoc da riprendere.
* **Gestione Errori e Feedback Utente:** Standardizzare.
* **Performance:** Monitorare.
* **Coerenza UI/UX:** Mantenere, specialmente con il revamp delle icone.
* **UX Utente Non Registrato (D.9):** Assicurare un'esperienza fluida.
* **Notifiche (A.5) e Statistiche Admin (A.4.4):** Aree di crescita future.
* **Articoli Preferiti (AUTH.3.5):** Feature per engagement utente.
* **Hosting Piattaforma:** Mantenere GitHub Pages per ora è ragionevole.
* **Implementazione Cloud Functions:** Competenza costruibile con approccio incrementale.

---

## Prossimi Passi Immediati Suggeriti (Ordine di Priorità Rivisto) 🎯

1.  **FIX: Risolvere visualizzazione articoli homepage (`index.html`, `js/homePageFeatures.js`, `js/main.js`)** - Assicurare che gli ID HTML siano corretti e che `displayArticlesSection` funzioni. (Priorità Massima)
2.  **Task F.2.4.3.A.1 (Icone Like/Commenti Homepage): Completare per `index.html`.** (Priorità Alta - una volta che gli articoli sono visibili)
3.  **Task F.2.4.3.A.2 (Icone Portal Card Homepage): Sostituire SVG in `index.html`.** (Priorità Alta)
4.  **Task C.2.4 (Donkey Runner): Migliorare leggibilità testi e usabilità form in fullscreen.** (Priorità Media)
5.  **Task A.4.2.6.A (Admin UI): Textarea per `rejectionReason`.** (Priorità Media)
6.  **Task D.9: Migliorare UX per Utente Non Registrato.** (Priorità Media)
7.  **Task D.1.A.1 (Nuovo): Notifiche Toast per Like.** (Priorità Media-Bassa)
8.  **Task C.5: Migliorare UI/UX di Donkey Runner Game (iniziare con C.5.1, C.5.2).** (Priorità Media)
9.  **Task AUTH.3.4 (Opzionali Profilo): Iniziare con Mini-Bio Utente.** (Priorità Media)
10. **Task D.3.B.6: Revisionare e aggiornare `README.md`.** (Priorità Media)
11. **Task C.3: Miglioramenti Leaderboard & Info Glitchzilla.** (Priorità Media)
12. **Task A.5 (Nuovo): Sistema di Notifiche In-App (Base - iniziare con A.5.1, A.5.2).** (Priorità Media-Bassa)
13. **Task AUTH.3.5 (Nuovo): Articoli Preferiti / Segnalibri.** (Priorità Bassa)
14. **Task A.4.4 (Nuovo): Statistiche Utente Aggregate per Admin (iniziare con A.4.4.2 - solo UI base, implementazione logica con CF posticipata).** (Priorità Bassa/Futuro)
15. **Task C.2.8 (Donkey Runner): Risolvere problemi file audio mancanti.** (Priorità Bassa)


