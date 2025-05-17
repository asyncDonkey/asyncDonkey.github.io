# DEVELOPMENT PLAN (v3.17.1 - Hosting, Cloud Functions, App Mobile, UI Refinements, Icone) 🚀

**Data Ultimo Aggiornamento:** 17 Maggio 2025

**Stato del Progetto:** Registrazione utente centralizzata e profilo utente (visualizzazione dati, stato d'animo, link esterni CRUD base, navigazione URL per visualizzazione pubblica/privata, link ai profili utente da nomi autore articoli e commenti articoli/guestbook) implementati e funzionanti. Pulsanti di condivisione per articoli (base con `navigator.share` e fallback "Copia Link") OK. Documentazione schema Firestore (`firestore-schema.md`) e commenti base per le Regole Firestore (`firestore.rules`) completati. Funzionalità admin per articoli (inclusa `rejectionReason` e pre-popolamento) e issue tracker base (creazione, visualizzazione, upvote, gestione admin status, risoluzione bug invio issue e feature request da Donkey Runner) operative. Like per articoli/commenti, editor Markdown, gestione bozze e stati articoli utente, notifiche Toast, Linter/Formatter e `.gitignore` OK. Fix recenti hanno risolto problemi di visualizzazione dei commenti per utenti loggati/non loggati su pagine articolo e il corretto funzionamento dei controlli mobili in Donkey Runner.

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
    * `[ ]` Sub-task A.5.5 (Nuovo): Valutare notifiche per interazioni sociali (es. 'Il tuo articolo è stato commentato', 'Qualcuno ha risposto al tuo commento', 'Il tuo articolo è stato condiviso' - quest'ultima potrebbe essere complessa da tracciare senza Cloud Functions). (Priorità Bassa/Futuro)

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

* `[ ]` **Task D.1: Miglioramenti UI/UX Generali**
    * `[x]` Sub-task D.1.A: Implementare Notifiche Toast per Feedback Utente (Modulare).
        * `[ ]` Sub-task D.1.A.1 (Nuovo): Aggiungere notifiche toast per conferma/errore quando si mette/toglie un like (articoli e commenti). (Priorità Media-Bassa)
    * `[ ]` Sub-task D.1.B: Migliorare Messaggi di Caricamento. (Priorità Media)
    * `[ ]` Sub-task D.1.C: Migliorare Gestione Errori. (Priorità Media)
    * `[ ]` Sub-task D.1.D: Ottimizzazione layout mobile generale. (Priorità Media)
* `[ ]` D.2: Possibilità per gli utenti di cancellare i propri commenti. (Priorità Bassa)
* `[x]` D.7: Miglioramento Grafico Card Articoli Homepage.
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
* **Task D.4: Test e QA (Quality Assurance)** (Priorità Alta - In corso)
    * `[ ]` D.4.1: Definire casi di test per le funzionalità chiave.
    * `[x]` D.4.2: Eseguire test manuali e documentare eventuali bug (Prima sessione completata, seconda sessione dopo BUGFIX-001).
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
* `[ ]` **Task D.10 (Nuovo): Revisione Layout e Design Navbar.** (Priorità Media)
    * `[ ]` Sub-task D.10.1: Analizzare il comportamento attuale della navbar su diverse larghezze di schermo.
    * `[ ]` Sub-task D.10.2: Progettare alternative per gestire un numero crescente di link (es. menu dropdown 'Altro', raggruppamento logico, icone).
    * `[ ]` Sub-task D.10.3: Implementare e testare la nuova soluzione per la navbar.
    * `[ ]` Sub-task D.10.4: Spostare il link '.Dev' (che punta ad `about.html`) dalla navbar principale a una posizione meno prominente (es. footer o sezione 'Altro' della navbar).
* `[ ]` **Task D.11 (Nuovo): Revisione Contenuto e Layout Pagina 'About' (`about.html`).** (Priorità Media)
    * `[ ]` Sub-task D.11.1: Rileggere e migliorare la chiarezza e l'impatto dei testi nella pagina 'About'.
    * `[ ]` Sub-task D.11.2: Analizzare e correggere i problemi di layout mobile specifici di `about.html`.

---
## Sezione E: Ricerca e Sviluppo a Lungo Termine 🔬📈
* `[ ]` Task E.1 Propagazione Dati (Priorità Bassa/Futuro)
* `[ ]` Task E.2 Messaggistica Interna (Priorità Bassa/Futuro)
* `[ ]` **Task E.3 (Nuovo): Ricerca su come creare un'applicazione mobile per il sito.** (Priorità Bassa/Futuro)
    * `[ ]` Sub-task E.3.1: Analizzare tecnologie PWA (Progressive Web App) per offrire un'esperienza app-like installabile.
    * `[ ]` Sub-task E.3.2: Valutare framework come Capacitor o Ionic per creare wrapper nativi se PWA non sufficiente.
    * `[ ]` Sub-task E.3.3: Definire MVP per l'app mobile (es. visualizzazione articoli, notifiche push base).
* `[ ]` **Task E.4 (Nuovo): Valutazione Implementazione Cloud Functions per Funzionalità Avanzate.** (Priorità Bassa/Futuro)
    * `[ ]` Sub-task E.4.1: Analisi requisiti per notifiche utente complesse (es. articolo condiviso, nuovo badge), aggiornamenti contatori aggregati, e potenziale propagazione dati avatar.
    * `[ ]` Sub-task E.4.2: Stima complessità e valutazione competenze per lo sviluppo di Cloud Functions in Node.js/TypeScript.
    * `[ ]` Sub-task E.4.3: Valutazione costi potenziali associati a Cloud Functions (Firebase/Google Cloud).
    * `[ ]` Sub-task E.4.4: Decisione sull'adozione e pianificazione implementazione per funzionalità specifiche.

---
## Sezione F: Fase di Perfezionamento Finale (Polish) 💅🎨

* **Task F.1: Revisione HTML/CSS.** (Priorità Media-Bassa)
* `[ ]` **Task F.2 (Nuovo): Revamp Grafico Generale.** (Priorità Bassa/Futuro)
    * `[ ]` Sub-task F.2.1: Ricerca e definizione di un nuovo stile visivo.
    * `[ ]` Sub-task F.2.2: Prototipazione di UI per sezioni chiave.
    * `[ ]` Sub-task F.2.3: Implementazione graduale del nuovo tema.
    * `[ ]` **Sub-task F.2.4 (Nuovo): Integrazione Libreria Icone Moderna.**
        * `[ ]` Sub-task F.2.4.1: Valutazione finale e scelta tra Bootstrap Icons, Tabler Icons, Material Symbols, Phosphor Icons, o css.gg per una maggiore coerenza e disponibilità di icone moderne.
        * `[ ]` Sub-task F.2.4.2: Integrazione della libreria scelta nel progetto (via CDN o SVG).
        * `[ ]` Sub-task F.2.4.3: Sostituzione graduale delle icone SVG personalizzate esistenti e utilizzo della nuova libreria per future necessità, ove appropriato.

---
🌍 ## Fase Successiva (Lungo Termine): Internazionalizzazione (i18n) Completa `[ ]`
---

## Considerazioni Chiave e Suggerimenti Migliorativi (Aggiornate) 💡
* **Test Regole Firestore:** Essenziale, specialmente dopo le recenti correzioni.
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
* **Hosting Piattaforma:**
    * **GitHub Pages:** Attualmente in uso, ottima per siti statici e progetti con build frontend semplici. Gratuita per repository pubblici.
    * **Firebase Hosting:** Offre integrazione più stretta con Firebase (Authentication, Firestore, Functions). CDN globale, SSL automatico, deploy semplici. Piano Spark gratuito generoso, ma con costi potenziali al superamento delle soglie.
    * **Valutazione:** Per ora, GitHub Pages è adeguato. Se l'uso di Cloud Functions diventasse intensivo o se si necessitassero funzionalità server-side più complesse non gestibili solo client-side con Firebase BaaS, Firebase Hosting diventerebbe una scelta più naturale e potente. Per ora, **mantenere GitHub Pages è ragionevole**, rivalutare se/quando si implementeranno Cloud Functions in modo esteso.
* **Implementazione Cloud Functions:**
    * **Valutazione Competenze:** L'implementazione di Cloud Functions (tipicamente in Node.js o TypeScript per Firebase) richiederebbe un apprendimento dedicato di questi ambienti server-side, della gestione delle dipendenze (npm/yarn), e delle best practice per funzioni serverless (idempotenza, gestione errori, logging, sicurezza).
    * **Probabilità di Successo Iniziale:** Basandomi sulla tua attuale progressione e focus sul frontend e regole Firestore, la probabilità di successo *immediato* per implementare Cloud Functions complesse senza un periodo di studio e sperimentazione dedicato sarebbe **medio-bassa (circa 40-50%)**. Tuttavia, con un approccio incrementale (iniziando con funzioni semplici) e risorse di apprendimento, la competenza può essere costruita. È un'area di crescita significativa e molto utile.
    * **Alternative per Notifiche/Aggiornamenti Avatar:**
        * **Notifiche "Il tuo articolo è stato condiviso":** Molto complesso senza logica server. Si potrebbe tracciare solo se la condivisione avviene tramite un pulsante *interno* al sito che fa una chiamata a Firestore (ma non traccerebbe condivisioni dirette del link).
        * **Aggiornamento Avatar (Task C.1):** Se l'utente carica un nuovo avatar, l'URL dell'immagine viene salvato in `userProfiles.avatarUrl`. Il client, quando visualizza un avatar, dovrebbe: 1. Controllare se `userProfiles.avatarUrl` esiste. 2. Se sì, usare quello. 3. Se no (o errore caricamento), usare il Blockie generato da `userId`. Questo non richiede Cloud Functions per la *visualizzazione*. Cloud Functions potrebbero servire per *processare* l'immagine all'upload (resize, ottimizzazione), ma non per la propagazione dell'URL.
* **Navbar (Task D.10):** Con l'aumento dei link, la navbar attuale potrebbe diventare affollata, specialmente su mobile. Un menu "Altro" o un raggruppamento più logico dei link è una buona idea. Spostare ".Dev" nel footer o in un sottomenu ha senso se si vuole dare priorità ad altre sezioni.

---

## Prossimi Passi Immediati Suggeriti (Ordine di Priorità Rivisto) 🎯

1.  **Task D.4: Test e QA (Quality Assurance) - Continuazione.** (Priorità Alta)
    * `[ ]` D.4.1: Finalizzare definizione casi di test per le funzionalità corrette da BUGFIX-001.
    * `[ ]` D.4.2: Eseguire secondo ciclo di test manuali focalizzato su Bug Report, Feature Request (da Donkey Runner) e Issue Tracker (da contribute.html).
    * `[ ]` D.4.3: Test specifici esperienza mobile (generale e Donkey Runner).
2.  **Task AUTH.3.3 (Completamento): Link ai Profili Utente.** (Priorità Medio-Alta)
    * `[ ]` Parte 2.LEADERBOARD: Trasformare i nomi utente nella leaderboard in link cliccabili.
3.  **Task D.10: Revisione Layout e Design Navbar.** (Priorità Media - Impatta UX Globale)
    * `[ ]` Sub-task D.10.1, D.10.2, D.10.3, D.10.4 (Spostare link '.Dev').
4.  **Task D.11: Revisione Contenuto e Layout Pagina 'About' (`about.html`).** (Priorità Media - Migliorare leggibilità e mobile)
5.  **Task C.2.4 (Donkey Runner): Migliorare leggibilità testi e usabilità form in fullscreen.** (Priorità Media)
6.  **Task A.4.2.6.A (Admin UI): Textarea per `rejectionReason`.** (Priorità Media)
7.  **Task D.9: Migliorare UX per Utente Non Registrato.** (Priorità Media)
8.  **Task D.1.A.1 (Nuovo): Notifiche Toast per Like.** (Priorità Media-Bassa)
9.  **Task C.5: Migliorare UI/UX di Donkey Runner Game (iniziare con C.5.1, C.5.2).** (Priorità Media)
10. **Task AUTH.3.4 (Opzionali Profilo): Iniziare con Mini-Bio Utente.** (Priorità Media)
11. **Task D.3.B.6: Revisionare e aggiornare `README.md`.** (Priorità Media)
12. **Task C.3: Miglioramenti Leaderboard & Info Glitchzilla.** (Priorità Media)
13. **Task A.5 (Nuovo): Sistema di Notifiche In-App (Base - iniziare con A.5.1, A.5.2).** (Priorità Media-Bassa)
14. **Task AUTH.3.5 (Nuovo): Articoli Preferiti / Segnalibri.** (Priorità Bassa)
15. **Task A.4.4 (Nuovo): Statistiche Utente Aggregate per Admin (iniziare con A.4.4.1, A.4.4.2 - solo UI base).** (Priorità Bassa/Futuro)
16. **Task C.2.8 (Donkey Runner): Risolvere problemi file audio mancanti.** (Priorità Bassa)
17. **Task D.3.B (Documentazione): Riprendere JSDoc e commenti inline/modulo.** (Priorità Continua/Bassa per recupero pregresso)
18. **Task E.3 e E.4 (Ricerca App Mobile e Cloud Functions):** (Priorità Bassa/Ricerca a Lungo Termine)

---
