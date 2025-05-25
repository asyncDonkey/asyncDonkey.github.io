# DEVELOPMENT PLAN (v4.0.11 - Sessione Athena - Nickname Change UI & Firestore Rules Block) 🚀

**Data Ultimo Aggiornamento:** 25 Maggio 2025 (Athena Update - Fine Sessione)
**Visione Progetto:** Consolidare e stabilizzare la piattaforma esistente, migliorando la documentazione, la sicurezza, l'UX e risolvendo il debito tecnico. Le funzionalità attuali, come Donkey Runner e il sistema di articoli, saranno mantenute e ottimizzate, con un focus sul miglioramento dell'esperienza utente per le notifiche e la pagina profilo.

**Stato Generale del Progetto:**
Sessione dedicata all'implementazione della richiesta di cambio nickname (`FUNC.1`). Abbiamo **COMPLETATO** l'interfaccia utente base in `profile.html` (icona e struttura modale - `FUNC.1.1`), e implementato la logica JavaScript iniziale per l'apertura/chiusura della modale e la gestione della visualizzazione dello stato di cooldown (`FUNC.1.2` parzialmente completato). La logica client-side per l'invio della richiesta (`FUNC.1.3`) è stata scritta, ma le **operazioni di scrittura su Firestore sono attualmente bloccate dalle regole di sicurezza**. Questo sarà il task prioritario da risolvere nella prossima sessione. L'utente ripristinerà le regole Firestore a una versione stabile precedente nel frattempo.
È stato anche implementato con successo un **task ausiliario non tracciato**: l'aggiunta di un link per il pannello admin nel footer, visibile solo agli amministratori, per facilitare i test.

**Legenda Stati:**

- ✅ **COMPLETATO** (Task concluso e verificato)
- `[x]` **COMPLETATO** (Sub-task concluso)
- `[ ]` **DA FARE** (Task pianificato, non iniziato)
- `[P]` **IN PROGRESSO** (Task avviato)
- ⚠️ **ON HOLD** (Task sospeso o in attesa di dipendenze/decisioni)
- 🆕 **NUOVO** (Task introdotto in questa versione del devplan o durante la sessione)
- ➡️ **OBSOLETO** (Task il cui scopo è stato reso obsoleto o non più necessario)
- 🐞 **BUG** (Problema identificato da risolvere)
- 🤔 **INVESTIGARE** (Necessita di ulteriori analisi)
- 💡 **IDEA** (Idea o possibile miglioramento futuro)
- ✨ **RIFINITURA** (Miglioramento UX/UI minore)

---

## 🎯 FASE 0: INFRASTRUTTURA E DEPLOYMENT 🎯

**Task INFRA-001: Migrazione Hosting su Firebase Hosting**

- **Descrizione:** Completare la migrazione del sito da GitHub Pages a Firebase Hosting per sfruttare meglio l'integrazione con gli altri servizi Firebase (Auth, Firestore, Functions).
- `[P]` **Stato Generale:** Inizializzazione e test locali completati.
- `[x]` **INFRA-001.1:** Revisionare la documentazione `firebaseHostingMigration.md` per i passi necessari.
- `[x]` **INFRA-001.2:** Configurare il progetto Firebase per Firebase Hosting (file `firebase.json` aggiornato con la sezione `hosting`).
- `[x]` **INFRA-001.3:** Affinare la configurazione di hosting in `firebase.json` (public, ignore, rewrites, headers, cleanUrls, trailingSlash).
- `[x]` **INFRA-001.4 (Test Locali):** Eseguire test con `firebase emulators:start` per validare la configurazione di hosting.
- `[ ]` **INFRA-001.5 (Deploy Staging):** Distribuire su un canale di anteprima (`firebase hosting:channel:deploy NOME_CANALE`).
- `[ ]` **INFRA-001.6 (Test Staging):** Eseguire test approfonditi sul canale di anteprima.
- `[ ]` **INFRA-001.7 (Dominio Custom):** Configurare il dominio personalizzato (se applicabile).
- `[ ]` **INFRA-001.8 (Go-Live):** Eseguire il deployment in produzione (`firebase deploy --only hosting`).
- `[ ]` **INFRA-001.9 (Post-GoLive):** Aggiornare la documentazione del progetto con le nuove informazioni di hosting e configurare CI/CD.
- **Nota:** Questo task è stato dettagliato e i primi passi sono stati completati con successo. Decisione utente: posticipare il deploy staging dopo altri task di codice.

---

## 🎯 FASE 1: STABILIZZAZIONE E DOCUMENTAZIONE (PRIORITÀ CRITICA) 🎯

**Task ANALYSIS-001.4 Follow-up (Priorità CRITICA): Implementare le raccomandazioni dell'analisi firestore.rules.**

- ✅ **ANALYSIS-001.4.1 / SEC-RULE-001:** Revisionare e restringere l'accesso in lettura a `/userProfiles/{userId}`.
  - `[x]` (Tutti i sub-task completati)
- ⚠️ **ANALYSIS-001.4.2 / SEC-RULE-002:** Implementare validazione completa per `externalLinks` negli aggiornamenti del profilo utente. (ON HOLD / DECISIONE PRESA)
- ➡️ **ANALYSIS-001.4.3 / SEC-RULE-003:** Mettere in sicurezza meccanismo `commentCount`. (OBSOLETO)
- ➡️ **ANALYSIS-001.4.4 / SEC-RULE-004:** Reintrodurre validazione chiavi `userIssues`. (OBSOLETO)
- ✅ **ANALYSIS-001.4.5:** Risolto problema caricamento `firestore.rules` in emulatore.

✅ **Task SCHEMA-001: Aggiornare `firestore-schema.md` (Priorità ALTA)**

- `[x]` (Tutti i sub-task completati)

---

## 💈 TASK NAVBAR (PRIORITÀ CRITICA) 💈

**✅ Task NAV.1: Refactoring Completo Funzionalità e UI Navbar**

- **Descrizione:** Revisionare e aggiornare la funzionalità, l'aspetto e la coerenza della navbar principale.
- ✅ **NAV.1.1 (Funzionalità):** (Tutti i sub-task rilevanti completati o obsoleti)
- ✅ **NAV.1.2 (Layout Icone e Testo):** (Tutti i sub-task rilevanti completati)
- ✅ **NAV.1.3 (Struttura Link e Dropdown):** (Tutti i sub-task rilevanti completati o obsoleti)

---

## 🐞 BUG TRACKING 🐞

- ➡️ **BUG-NAV-RESP-001: Scroll orizzontale homepage (`index.html`) su mobile post-login.** (OBSOLETO - Risolto).
- ✅ 🐞 **BUG-PROF-AVATAR-BTN-001: Pulsante "Conferma e Carica Avatar" (`#confirmAvatarUploadBtn`) invisibile ma cliccabile in `profile.html`.** (RISOLTO)

---

## ✨ TASK DI RIFINITURA E NUOVE FUNZIONALITÀ (Derivati dalla sessione) ✨

✅ **Task NOTIF.1: Miglioramento UX Pannello Notifiche Popup**

- `[x]` (Tutti i sub-task completati)

🆕 **Task NOTIF.2: Espansione Tipi di Notifiche In-App**

- **Descrizione:** Introdurre nuove notifiche per migliorare il coinvolgimento e guidare l'utente.
- `[ ]` **NOTIF.2.1 (Notifica Conferma Email):**
    - `[ ]` **NOTIF.2.1.A (Creazione Logica Cloud Function):** Generare notifica Firestore per utente che deve confermare email.
    - `[ ]` **NOTIF.2.1.B (Testo e Azione Notifica):** Definire testo e comportamento al click.
    - `[ ]` **NOTIF.2.1.C (Persistenza e Rimozione):** Gestire la visibilità della notifica in base allo stato di verifica email.
- `[ ]` **NOTIF.2.2 (Brainstorming e Implementazione Altre Notifiche):**
    - 💡 Primo articolo pubblicato.
    - 💡 Badge sbloccato.
    - 💡 Risposta a un commento.
    - 💡 (Admin) Nuovo articolo in attesa di approvazione.
    - 💡 (Admin) Nuova richiesta di cambio nickname.
- ➡️ **NOTIF.EMAIL-TEMPLATES (Miglioramento/Creazione Email):** (OBSOLETO)

---

## 💅 MIGLIORAMENTI STRUTTURALI E UI/UX (Legacy & Nuovi) 💅

✅ **Task CSS-REFACTOR-001: Refactoring CSS con SCSS (Priorità ALTA)**

- `[x]` (Tutti i sub-task completati)

✅ **Task UI-FIX-001: Correzione Visualizzazione Dati Utente in Mini-Leaderboards (Priorità ALTA)**

- `[x]` (Tutti i sub-task completati)

✅ **Task D.9: Migliorare UX per Utente Non Registrato. (Priorità MEDIA)**

- `[x]` (Tutti i sub-task completati eccetto D.9.5)
    - `[ ]` **D.9.5 (Coerenza Modali e Notifiche):** Verificare la presenza e il funzionamento dei modali di login su tutte le pagine rilevanti. Assicurare che l'header delle notifiche sia consistente. (Priorità MEDIA-BASSA)

🆕 **Task UI-ICON-UPDATE-001: Aggiornamento Icone con Material Symbols (Priorità BASSA)**

- `[x]` **UI-ICON-UPDATE-001.1 (Upvote Issue):** Completato.
- `[x]` **UI-ICON-UPDATE-001.2 (Contribute.html Headers):** Completato.
- `[ ]` **UI-ICON-UPDATE-001.3 (Altre Sezioni):** Valutare altre aree del sito per aggiornamenti icone.

✅ **Task UI-GB-STYLE-001: Rivedere stile commenti nel Guestbook (Priorità MEDIA-BASSA)**
- `[x]` Analizzato SCSS (`_comments.scss`) e HTML relativi.
- `[x]` Proposte e applicate (dall'utente) modifiche HTML per coerenza selettori in `about.html`, `donkeyRunner.html`, `view-article.html`.
- `[x]` Fornito SCSS rivisto per `_comments.scss` per migliorare leggibilità, spaziatura e interazione.
- `[x]` Creati nuovi stili SCSS specifici per i bottoni di condivisione (`#nativeShareBtn`, `#copyLinkBtn`) in `view-article.html`, trasformandoli in bottoni solo-icona.

➡️ ✨ **Task PROF-STYLE.1: Rendere quadrati i contenitori avatar (Priorità MEDIA)** (OBSOLETO - Decisione utente del 24/05/2025)

✅ ✨ **Task PROF-STYLE.2: Migliorare CSS per box di input pagina profilo (Priorità MEDIA)**
    - `[x]` (Tutti i sub-task completati)

---

## 🔧 TECHNICAL DEBT & REFACTORING (Legacy & Nuovi) 🔧

➡️ **Task TECH-DEBT-001: Unificare Sistemi di Gestione Commenti.** (OBSOLETO)

🆕💡 **Task TECH-DEBT-BTN-STYLE-001: Unificare e razionalizzare stili dei bottoni `.game-button`.** (Priorità BASSA)
    - `[ ]` Analizzare le definizioni multiple di `.game-button` (es. in `_main-content.scss`, `_donkey-runner.scss`).
    - `[ ]` Definire uno stile base per `.game-button` in un unico file (es. `_buttons.scss` o consolidare in `_main-content.scss`).
    - `[ ]` Utilizzare classi modificatrici (es. `.game-button--primary`, `.game-button--donkey-runner`) per le variazioni specifiche.

---

## 📚 PIANO DI SVILUPPO INTEGRATO (Stato Attuale & Funzionalità Esistenti) 📚

### Sezione A: Gestione Contributi e Moderazione 🖋️

- `[x]` A.4.2.6.A (Admin UI): Textarea per `rejectionReason`.
- **Task A.5: Sistema di Notifiche In-App (Base).**
    - `[x]` (Funzionalità base pannello e pagina "Tutte le Notifiche" COMPLETATE)
    - `[x]` Corretta struttura HTML per `notificationBellContainer` e `notification-panel` in `index.html` header.
    - `⚠️ [ON HOLD]` **Sub-task A.5.5: Notifiche per Interazioni Sociali Avanzate.** (Legate a KOD - Ora potenzialmente integrabili con NOTIF.2)

### Sezione AUTH: Gestione Autenticazione e Profilo Utente ✨👤

**Task PROF.1: Risoluzione Problemi e Miglioramenti Pagina Profilo (`profile.html`)**

- ✅ 🐞 **PROF.1.1 (Bug Mobile - Stato d'Animo):** (RISOLTO)
- `[P]` **PROF.1.2 (Layout Riconoscimenti - Desktop & Mobile):** (Priorità MEDIA)
    - ✅ **PROF.1.2.A:** Corretto allineamento sezione badge.
    - `[ ]` **PROF.1.2.B:** Valutare/implementare sezione dedicata per i badge. (*Decisione Utente 24/05/2025: Per ora va bene così*).
- ✅ **PROF.1.3 (Visibilità Riconoscimenti Profilo Pubblico):** (RISOLTO)
- ✅ **PROF.1.4 (Layout Generale Pagina Profilo):** (COMPLETATO)

**Task FUNC.1 (Revisione 2): Richiesta Cambio Nickname via Modale con Feedback Dettagliato e Notifiche Admin/Utente** (Priorità MEDIA) `[P] IN PROGRESSO`
- **Descrizione:** Implementare funzionalità in `profile.html` per richiedere cambio nickname agli admin, con feedback chiaro sullo stato della richiesta e notifiche.
- `[x]` **FUNC.1.1 (UI Profilo):** Aggiunta icona e struttura modale in `profile.html`. Stili base SCSS per icona e modale.
- `[P]` **FUNC.1.2 (Modale Richiesta Nickname - Logica Visualizzazione Dinamica):** Gestire stati: Iniziale, Richiesta Inviata, Nickname Cambiato di Recente.
    - `[x]` Implementata logica base apertura/chiusura modale e visualizzazione vista iniziale.
    - `[x]` Implementata visualizzazione vista cooldown (client-side) basata su `lastNicknameRequestTimestamp`.
    - `[x]` Gestita visibilità icona "modifica nickname" in base a `isOwnProfile` e stato cooldown.
    - `[ ]` Gestione completa e robusta degli stati modale (Richiesta Inviata, Richiesta Processata) basata sui dati Firestore (es. collezione `nicknameChangeRequests` o campi di stato sul profilo utente).
- `[P]` **FUNC.1.3 (Logica Invio e Gestione Richiesta):** Validazione, creazione documento in `/nicknameChangeRequests`, update `userProfiles.lastNicknameRequestTimestamp`, controllo intervallo 90 giorni, toast feedback.
    - `[x]` Implementata validazione input client-side.
    - `[x]` Implementata logica client-side per preparare e tentare l'invio della richiesta (creazione documento in `nicknameChangeRequests` e aggiornamento `lastNicknameRequestTimestamp` su `userProfiles`).
    - `[x]` Implementato feedback tramite toast per successo/errore (lato client).
    - `[ ]` **(BLOCCATO - PRIORITÀ PROSSIMA SESSIONE)** Risolvere problemi con regole Firestore per permettere la scrittura sicura su `nicknameChangeRequests` e l'aggiornamento di `lastNicknameRequestTimestamp` su `userProfiles`.
- `[ ]` **FUNC.1.4 (Notifiche):**
    - `[ ]` Notifica all'utente per approvazione/rifiuto.
    - 💡 (Opzionale/Futuro) Notifica automatica agli Admin alla creazione di una richiesta (vedi NOTIF.2.2).
- `[ ]` **FUNC.1.5 (Gestione Admin nel Pannello):** Visualizzazione richieste, possibilità di segnare come "processata".
- **Nota:** L'utente ripristinerà le regole Firestore a una versione stabile. Il focus della prossima sessione sarà la definizione e il test delle nuove regole specifiche per questa funzionalità.

- **Task AUTH.3: Miglioramenti Funzionali Pagina Profilo Utente (`profile.html`)**
    - `[x]` Mini-Bio Utente (AUTH.3.4).
    - `[x]` Link Esterni (AUTH.3.2).
    - `[x]` Visualizzazione Badge/Riconoscimenti Utente (Base, risolti problemi con PROF.1.3).
    - `[ ]` Sub-task AUTH.3.2.2 (Miglioramento Visivo Link Esterni): Anteprime/icone sito (Priorità MEDIA-BASSA).
    - **Sub-task AUTH.3.4 (Opzionale/Idee Future):**
        - `[ ]` Contatori Semplici (Data registrazione). (Priorità BASSA)
        - `[ ]` Sub-task AUTH.3.4.B.5 (10 Articoli Pubblicati): Tracciamento e badge (Priorità MEDIA-BASSA).
    - ➡️ **Sub-task AUTH.3.5: Articoli Preferiti / Segnalibri.** (OBSOLETO)
    - **Sub-task AUTH.3.6: Miglioramenti Visivi Nickname.** (Priorità MEDIA)
        - `[ ]` Sub-task AUTH.3.6.1: Nickname Dinamico - Glitchzilla Effect.
        - ✅ **Sub-task AUTH.3.6.2: Nickname Dinamico - Icona Autore.** (Completato)
    - ➡️ **Sub-task AUTH.3.7: Sistema di Amicizie/Followers.** (OBSOLETO)

### Sezione C: Funzionalità Specifiche Giochi/Piattaforma 🎮 & Contenuti Esistenti

- ✅ **Task C.1: Gestione Avatar Utente Personalizzato.** (Include BUG-PROF-AVATAR-BTN-001 risolto)
- **Task C.2: Donkey Runner (Gioco Esistente)**
    - `[x]` C.2.4 (Donkey Runner): Leggibilità testi e usabilità form fullscreen.
    - `[ ]` Task C.2.8 (Donkey Runner): Risolvere problemi file audio mancanti (`game_over.mp3`, `shield_block.mp3`). (Priorità BASSA)
    - 🆕 `[ ]` **C.2.9 (Review Stili e Allineamento):** Revisionare gli stili generali e l'allineamento degli elementi in `donkeyRunner.html` e `donkeyRunner.js` per coerenza e pulizia. (Priorità MEDIA)
    - 🆕 `[ ]` **C.2.10 (Invito Amici / Sfida):** Aggiungere un pulsante/sezione per "Invita i tuoi amici a giocare" o "Sfida qualcuno a battere il tuo punteggio". (Priorità MEDIA-BASSA)
        - `[ ]` **C.2.10.1:** Definire UI (pulsante/link, posizione).
        - `[ ]` **C.2.10.2:** Implementare logica (potrebbe usare `navigator.share` o link precompilati per social).
    - 🆕 🤔 **C.2.11 (Condivisione Punteggio Partita):** Valutare la complessità e la fattibilità di permettere la condivisione diretta di un punteggio specifico ottenuto in una partita di CodeDash (DonkeyRunner). (Priorità BASSA - INVESTIGARE)
        - `[ ]` **C.2.11.1:** Analisi tecnica: come salvare/identificare un punteggio di una singola partita in modo condivisibile (es. URL con parametri, immagine generata).
        - `[ ]` **C.2.11.2:** Design UI per l'opzione di condivisione post-partita.
- ✅ **Task C.3: Miglioramenti Leaderboard & Info Glitchzilla** (Priorità MEDIA - Parzialmente Completato)
    - `[x]` Avatar aggiornati e performanti sulla Leaderboard (REGRESS-004).
    - `[x]` Pulsante refresh stilizzato con icona (D.LEADERBOARD-UX.1).
    - `[x]` Responsività base tabella (scroll orizzontale, colonna Data nascosta su mobile) (D.LEADERBOARD-UX.2 parziale).
    - `[x]` Evidenziazione utente loggato.
    - `[x]` Indicatore "Glitchzilla Debunked!" con icona animata.
    - `[ ]` (Restante da C.3) Valutare ulteriori miglioramenti funzionali o di UI specifici per "Info Glitchzilla" se non coperti.
- **Task C.5: Migliorare UI/UX di Donkey Runner Game** (Priorità MEDIA-BASSA).
    - _Da definire focus specifico, potrebbe includere C.2.9_
- ➡️ **Task C.NEW_FEATURE_HP_ACTIVITY:** (SUPERSEDED)

### Sezione D: Miglioramenti UI/UX e Ottimizzazioni Generali ✨

- `[x]` Correzione ESLint `showConfirmationModal` in `js/profile.js`.
- `[x]` Task D.3.B.6: Revisionare e aggiornare README.md.
- `[ ]` Sub-task D.1.A.1: Aggiungere notifiche toast per conferma/errore like (su azioni di like/unlike _effettive_ degli utenti loggati). (Priorità MEDIA-BASSA).
- ➡️ **Task D.UI-HP_FEATURED:** (SUPERSEDED)
- **Task D.LEADERBOARD-UX: Migliorare UI/UX della Leaderboard**
    - ✅ **D.LEADERBOARD-UX.1:** Stilizzare il pulsante di refresh della leaderboard. (COMPLETATO)
    - ➡️ **D.LEADERBOARD-UX.2:** Verificare e migliorare la responsività della tabella dei punteggi. (OBSOLETO)
    - ➡️ **D.LEADERBOARD-UX.3:** Progettare/implementare visualizzazione compatta/espandibile per le righe. (OBSOLETO)

### Sezione Sicurezza & Stabilità (Derivata da ANALYSIS-001.4) 🛡️

- ✅ **Task ANALYSIS-001.4: Analisi storage.rules e firestore.rules.** (ANALISI COMPLETATA)

### Sezione E: Ricerca e Sviluppo a Lungo Termine 🔬📈

- ✅ **Task E.4: Adozione e Implementazione Cloud Functions.** (COMPLETATO)

### Sezione F: Fase di Perfezionamento Finale (Polish) 💅🎨

- `[x]` F.2.4.3.A.1 (Icone Like/Commenti Homepage).
- `[x]` F.2.4.3.A.2 (Icone Portal Card Homepage).

---

## ✅ TASK COMPLETATI (Sessioni Precedenti e Sessione Corrente del 25 Maggio 2025 Inclusa) ✅

- Task REGRESS-001, REGRESS-002, TEXT-001, REGRESS-003.4, (Da ANALYSIS-001), REGRESS-NAV-AVATAR-001, REGRESS-003.3, REGRESS-003.1 & REGRESS-003.2, C.1 / REGRESS-003.5, REGRESS-004, REGRESS-005.
- Task A.5 (Notifiche In-App via Cloud Functions) - FUNZIONALITÀ BASE COMPLETATE.
- Task ANALYSIS-001.4 (Analisi `storage.rules` e `firestore.rules`) - ANALISI COMPLETATA.
- Task UI-FIX-001: Correzione Visualizzazione Dati Utente in Mini-Leaderboards.
- Task CSS-REFACTOR-001: Refactoring CSS con SCSS.
- ANALYSIS-001.4.5: Risolto problema caricamento `firestore.rules` in emulatore.
- SCHEMA-001: Aggiornato `firestore-schema.md`.
- D.9 (Parziale): Migliorata UX Utente Non Registrato.
- UI-ICON-UPDATE-001 (Parziale): Aggiornate icone Upvote e Headers in `contribute.html`.
- D.9.6 (Messaggio Interattivo Contribute - Form Invio Issue).
- AUTH.3.6.2 (Icona Autore accanto al Nickname).
- C.3 / D.LEADERBOARD-UX.1 (Pulsante Refresh Leaderboard).
- C.3 / D.LEADERBOARD-UX.2 parziale (Responsività base Leaderboard).
- C.3 (Highlight Utente Loggato in Leaderboard).
- C.3 (Indicatore "Glitchzilla Debunked!" in Leaderboard con animazione).
- ✅ **NAV.1 (Intero Task Refactoring Navbar):** COMPLETATO.
- ✅ **NOTIF.1 (Miglioramento UX Pannello Notifiche):** COMPLETATO.
- ✅ 🐞 **BUG-PROF-AVATAR-BTN-001:** RISOLTO.
- ✅ ✨ **PROF-STYLE.2 (CSS Box Input Profilo):** COMPLETATO.
- ✅ **PROF.1.2.A (Allineamento Badge Profilo):** COMPLETATO.
- ✅ **PROF.1.3 (Visibilità Riconoscimenti Profilo Pubblico):** RISOLTO.
- ✅ **PROF.1.4 (Layout Generale Pagina Profilo):** COMPLETATO.
- ✅ **UI-GB-STYLE-001 (Stili Commenti e Bottoni Condivisione ArticleViewer):** COMPLETATO.
- ✅ **Task Ausiliario (Footer Admin Link):** Aggiunto link al pannello admin nel footer, visibile solo agli amministratori. (COMPLETATO - Sessione 25 Maggio 2025)

---

// DevPlan v4.0.11 - Canvas Markdown - AthenaDev 🏛️✨ Sessione Conclusa.
// Ottimo lavoro nel debug e nell'implementazione della UI per il cambio nickname. Prossimo passo: regole Firestore!