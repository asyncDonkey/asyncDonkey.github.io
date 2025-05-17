# DEVELOPMENT PLAN (v3.16.0 - UX, Admin Stats, Notifiche Base e Polish) 🚀

**Data Ultimo Aggiornamento:** 16 Maggio 2025

**Stato del Progetto:** Registrazione utente centralizzata e profilo utente (visualizzazione dati, stato d'animo, link esterni CRUD base, navigazione URL per visualizzazione pubblica/privata) implementati e funzionanti. Pulsanti di condivisione per articoli (base con `navigator.share` e fallback "Copia Link") OK. Documentazione schema Firestore (`firestore-schema.md`) e commenti base per le Regole Firestore (`firestore.rules`) completati. Funzionalità admin per articoli (inclusa `rejectionReason` e pre-popolamento) e issue tracker base operative. Like per articoli/commenti, editor Markdown, gestione bozze e stati articoli utente, notifiche Toast, Linter/Formatter e `.gitignore` OK. **Fix recenti hanno risolto problemi di visualizzazione dei commenti per utenti loggati/non loggati su pagine articolo e il corretto funzionamento dei controlli mobili in Donkey Runner.**

---

**PRINCIPI GUIDA E BEST PRACTICES (Dettaglio):**

* 🆕 **Valutazione Preventiva per Task Complessi:** Per modifiche strutturali, funzionalità complesse (es. propagazione dati, sistemi di messaggistica), o revisioni profonde delle Regole Firestore, condurre un'analisi preliminare dettagliata, includendo:
    * **Scopo e Risultati Attesi:** Definizione chiara.
    * **Dipendenze e Impatto:** Analisi delle interconnessioni con il sistema esistente.
    * **Complessità e Sforzo:** Stima realistica.
    * **Alternative e Incrementalità:** Valutazione di approcci più semplici o per fasi.
    * **Piano di Test Specifico:** Criteri di validazione chiari.
* 🎯 **Focus sulla User Experience (UX):** Prioritizzare chiarezza, intuitività, feedback immediato e facilità d'uso in tutte le interfacce. Particolare attenzione all'esperienza mobile, garantendo reattività e accessibilità.
* 🛡️ **Sicurezza e Validazione Dati:** Implementare controlli di validazione sia client-side (per una UX reattiva) sia server-side (tramite Regole Firestore robuste) per garantire l'integrità e la sicurezza dei dati. Sanificare gli input utente ove necessario.
* 📄 **Documentazione Continua ed Esaustiva:**
    * Commentare il codice sorgente in modo chiaro e dettagliato, spiegando la logica delle funzioni, le decisioni architetturali e i passaggi complessi.
    * **Utilizzare JSDoc per tutte le nuove funzioni JavaScript e per quelle modificate significativamente, documentando parametri, valori di ritorno e lo scopo generale, come parte integrante del processo di sviluppo.**
    * **Aggiungere commenti inline e a livello di modulo/file per spiegare passaggi non ovvi o la responsabilità generale del modulo/file durante lo sviluppo di nuove funzionalità o la modifica di quelle esistenti.**
    * Mantenere aggiornata la documentazione di progetto, inclusi lo schema del database (`firestore-schema.md`), le Regole Firestore commentate, il `README.md` e il presente Piano di Sviluppo.
* 🧪 **Test Incrementali e Rigorosi:**
    * Testare le funzionalità dopo ogni modifica significativa su diversi browser (Chrome, Firefox, Safari, Edge) e dispositivi (desktop, mobile, tablet, o emulatori).
    * Utilizzare il Simulatore Firestore per validare le regole di sicurezza prima del deployment.
    * Definire e seguire casi di test per le funzionalità chiave per identificare e risolvere rapidamente le regressioni.
* ⚙️ **Version Control Disciplinato:** Utilizzare Git per il controllo di versione, con commit frequenti, messaggi descrittivi e l'uso di branch per lo sviluppo di nuove funzionalità o per la correzione di bug complessi.
* 🧹 **Manutenzione Proattiva e Qualità del Codice:**
    * Risolvere tempestivamente i problemi noti, warning della console e bug minori per mantenere la codebase pulita, stabile e performante.
    * Utilizzare strumenti come Linter (ESLint) e Formatter (Prettier) per mantenere uno stile di codice consistente e identificare potenziali problemi.
* 🧩 **Modularità del Codice:** Favorire la creazione di codice modulare e riutilizzabile. Estrarre logiche specifiche o complesse in moduli o funzioni dedicate per migliorare la manutenibilità, la leggibilità e la testabilità.
* ⚡ **Attenzione alle Performance:** Monitorare e ottimizzare le performance dell'applicazione, con particolare attenzione alle funzionalità critiche, al caricamento di liste di dati e all'uso efficiente delle risorse.
* 🎨 **Coerenza UI/UX:** Mantenere uno stile visivo e un'esperienza utente coerenti attraverso tutte le sezioni e le funzionalità del sito.

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
    * `[ ]` **Sub-task AUTH.3.3: Rendere Pagina Profilo Navigabile e Pubblica.**
        * `[x]` Parte 1: Logica per caricare profili via `userId` URL e distinzione UI pubblica/privata.
        * `[ ]` Parte 2: Trasformare i nomi utente (su articoli, commenti, leaderboard, ecc.) in link cliccabili ai rispettivi profili pubblici (`profile.html?userId=<ID_UTENTE>`). (Priorità Medio-Alta)
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
        * `[ ]` Sub-task A.4.4.1: Ricerca su come aggregare dati da Firestore in modo efficiente (query dirette o Cloud Functions per conteggi periodici).
        * `[ ]` Sub-task A.4.4.2: UI in `admin-dashboard.html` per visualizzare: Numero totale utenti, Numero articoli per stato, Numero issue per tipo/stato, Issue più votate (opzionale).
* `[ ]` **Task A.5 (Nuovo): Sistema di Notifiche In-App (Base).** (Priorità Media-Bassa)
    * `[ ]` Sub-task A.5.1: Struttura dati `userNotifications` (`userId`, `message`, `type` (articlePublished, articleRejected, commentReply, newBadge, system), `linkToContent`, `timestamp`, `isRead: boolean`).
    * `[ ]` Sub-task A.5.2: Logica in `adminDashboard.js` per creare notifiche quando un articolo viene approvato o respinto.
    * `[ ]` Sub-task A.5.3: UI base nell'header (es. icona campanella con contatore) per utenti loggati.
    * `[ ]` Sub-task A.5.4: Pagina o dropdown per visualizzare le notifiche e marcarle come lette.

---
## Sezione B & G: Articoli, Contributi Utente, Guestbook `[x]` (Funzionalità base complete) 📝📖
---

## Sezione C: Nuove Funzionalità e Miglioramenti Specifici Giochi/Piattaforma 🎮

* `[ ]` **Task C.1:** Gestione Avatar Utente Personalizzato (Upload immagine tramite Firebase Storage). (Priorità Media-Bassa)
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

* `[x]` D.1.A: Notifiche Toast.
* `[ ]` D.1.B: Migliorare Messaggi di Caricamento. (Priorità Media)
* `[ ]` D.1.C: Migliorare Gestione Errori. (Priorità Media)
* `[ ]` D.1.D: Ottimizzazione layout mobile generale. (Priorità Media)
* `[ ]` D.2: Possibilità per gli utenti di cancellare i propri commenti. (Priorità Bassa)
* `[x]` D.7: Miglioramento Grafico Card Articoli Homepage.
* `[ ]` **Task BUGFIX-001: Risolvere Permessi Firestore e Aggiornare UI per Commenti/Feedback.**
    * `[x]` Sub-task BUGFIX-001.1: **Commenti Articoli (`articleViewer.js`, `view-article.html`):** UI aggiornata per richiedere login.
    * `[ ]` Sub-task BUGFIX-001.2: **Bug Report (`bugReports.js`, `donkeyRunner.html`):** Analizzare e correggere Regole Firestore.
    * `[ ]` Sub-task BUGFIX-001.3: **Feature Request (`featureRequests.js`, `donkeyRunner.html`):** Analizzare e correggere Regole Firestore.
    * `[ ]` Sub-task BUGFIX-001.4: **Issue Tracker Generale (`issueTracker.js`, `contribute.html`):** Revisione Regole Firestore.
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
* **Task D.4: Test e QA (Quality Assurance)** (Priorità Alta - In corso)
    * `[ ]` D.4.1: Definire casi di test per le funzionalità chiave.
    * `[x]` D.4.2: Eseguire test manuali e documentare eventuali bug (Prima sessione completata).
    * `[ ]` D.4.3: Testare specificamente l'esperienza utente mobile per le sezioni principali e Donkey Runner.
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

---
## Sezione E: Ricerca e Sviluppo a Lungo Termine 🔬📈
* (Task E.1 Propagazione Dati, E.2 Messaggistica Interna rimangono come nel piano precedente - Priorità Bassa/Futuro)

---
## Sezione F: Fase di Perfezionamento Finale (Polish) 💅🎨

* **Task F.1: Revisione HTML/CSS.** (Priorità Media-Bassa)
* `[ ]` **Task F.2 (Nuovo): Revamp Grafico Generale.** (Priorità Bassa/Futuro)
    * `[ ]` Sub-task F.2.1: Ricerca e definizione di un nuovo stile visivo.
    * `[ ]` Sub-task F.2.2: Prototipazione di UI per sezioni chiave.
    * `[ ]` Sub-task F.2.3: Implementazione graduale del nuovo tema.

---
🌍 ## Fase Successiva (Lungo Termine): Internazionalizzazione (i18n) Completa `[ ]`
---

## Considerazioni Chiave e Suggerimenti Migliorativi (Aggiornate) 💡
* **Test Regole Firestore:** Essenziale.
* **Modularità Codice JS:** Continuare a valutare.
* **Anteprime Link Esterni (AUTH.3.2.2):** Fattibilità da ricercare.
* **UX Mobile Donkey Runner:** Leggibilità testo (C.2.4) ancora da migliorare.
* **Gestione File Audio (Donkey Runner C.2.8):** Ora a priorità bassa, ma da non dimenticare.
* **Documentazione:** Proseguire con commenti inline/modulo e aggiornare README. JSDoc da riprendere.
* **Gestione Errori e Feedback Utente:** Standardizzare.
* **Performance:** Monitorare.
* **Coerenza UI/UX:** Mantenere.
* **UX Utente Non Registrato (D.9):** Assicurare un'esperienza fluida e informativa.
* **Notifiche (A.5) e Statistiche Admin (A.4.4):** Aree di crescita future.
* **Articoli Preferiti (AUTH.3.5):** Feature per engagement utente.

---

## Prossimi Passi Immediati Suggeriti (Ordine di Priorità Rivisto) 🎯

1.  **Task BUGFIX-001 (Sub-tasks .2, .3, .4): Risolvere Permessi Firestore per Bug Report, Feature Request e revisione Issue Tracker.** (Priorità Immediata - Sblocca funzionalità chiave)
2.  **Task D.4: Test e QA (Quality Assurance) - Continuazione.** (Priorità Alta)
    * `[ ]` D.4.1: Finalizzare definizione casi di test (se necessario).
    * `[ ]` D.4.2: Eseguire secondo ciclo di test manuali dopo i fix.
    * `[ ]` D.4.3: Test specifici esperienza mobile.
3.  **Task AUTH.3.3 (Completamento): Link ai Profili Utente.** (Priorità Medio-Alta)
    * `[ ]` Parte 2: Trasformare i nomi utente in link cliccabili.
4.  **Task C.2.4 (Donkey Runner): Migliorare leggibilità testi e usabilità form in fullscreen.** (Priorità Media)
5.  **Task A.4.2.6.A (Admin UI): Textarea per `rejectionReason`.** (Priorità Media)
6.  **Task D.9: Migliorare UX per Utente Non Registrato.** (Priorità Media)
7.  **Task C.5: Migliorare UI/UX di Donkey Runner Game (iniziare con C.5.1, C.5.2).** (Priorità Media)
8.  **Task AUTH.3.4 (Opzionali Profilo): Iniziare con Mini-Bio Utente.** (Priorità Media)
9.  **Task D.3.B.6: Revisionare e aggiornare `README.md`.** (Priorità Media)
10. **Task C.3: Miglioramenti Leaderboard & Info Glitchzilla.** (Priorità Media)
11. **Task A.5 (Nuovo): Sistema di Notifiche In-App (Base - iniziare con A.5.1, A.5.2).** (Priorità Media-Bassa)
12. **Task AUTH.3.5 (Nuovo): Articoli Preferiti / Segnalibri.** (Priorità Bassa)
13. **Task A.4.4 (Nuovo): Statistiche Utente Aggregate per Admin (iniziare con A.4.4.1, A.4.4.2 - solo UI base).** (Priorità Bassa/Futuro)
14. **Task C.2.8 (Donkey Runner): Risolvere problemi file audio mancanti.** (Priorità Bassa)
15. **Task D.3.B (Documentazione): Riprendere JSDoc e commenti inline/modulo.** (Priorità Continua/Bassa per recupero pregresso)

---