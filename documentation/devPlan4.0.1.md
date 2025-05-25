# DEVELOPMENT PLAN (v4.0.12 - Sessione Athena - Ripristino e Focus Stati Modale Nickname) 🚀

**Data Ultimo Aggiornamento:** 25 Maggio 2025 (Athena Update - Inizio Sessione Post-Ripristino)
**Visione Progetto:** Consolidare e stabilizzare la piattaforma esistente, migliorando la documentazione, la sicurezza, l'UX e risolvendo il debito tecnico. Le funzionalità attuali, come Donkey Runner e il sistema di articoli, saranno mantenute e ottimizzate, con un focus sul miglioramento dell'esperienza utente per le notifiche e la pagina profilo.

**Stato Generale del Progetto:**
Sessione precedente dedicata all'implementazione della richiesta di cambio nickname (`FUNC.1`). Abbiamo **COMPLETATO** l'interfaccia utente base in `profile.html` (`FUNC.1.1`) e la logica JavaScript per la Cloud Function (`FUNC.1.3`). L'utente ha ripristinato il codice a una versione precedente all'implementazione del contatore dinamico per il cooldown, a causa di problemi riscontrati.
**Il focus attuale è risolvere il comportamento dell'icona di modifica nickname (che dovrebbe essere sempre visibile sul proprio profilo) e assicurare la corretta gestione dei vari stati della modale (Eleggibile, Richiesta Inviata, In Cooldown) prima di reintrodurre miglioramenti UX come il contatore.**
Il task ausiliario (link admin nel footer) rimane completato.

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
- `[x]` **INFRA-001.1:** Revisionare la documentazione `firebaseHostingMigration.md`.
- `[x]` **INFRA-001.2:** Configurare il progetto Firebase per Firebase Hosting.
- `[x]` **INFRA-001.3:** Affinare la configurazione di hosting in `firebase.json`.
- `[x]` **INFRA-001.4 (Test Locali):** Eseguire test con `firebase emulators:start`.
- `[ ]` **INFRA-001.5 (Deploy Staging):** Distribuire su un canale di anteprima.
- `[ ]` **INFRA-001.6 (Test Staging):** Eseguire test approfonditi sul canale di anteprima.
- `[ ]` **INFRA-001.7 (Dominio Custom):** Configurare il dominio personalizzato.
- `[ ]` **INFRA-001.8 (Go-Live):** Eseguire il deployment in produzione.
- `[ ]` **INFRA-001.9 (Post-GoLive):** Aggiornare la documentazione e configurare CI/CD.
- **Nota:** Posticipare il deploy staging dopo altri task di codice.

---

## 🎯 FASE 1: STABILIZZAZIONE E DOCUMENTAZIONE (PRIORITÀ CRITICA) 🎯

**Task ANALYSIS-001.4 Follow-up: Implementare le raccomandazioni dell'analisi firestore.rules.**
- ✅ **ANALYSIS-001.4.1 / SEC-RULE-001:** Revisionare e restringere l'accesso in lettura a `/userProfiles/{userId}`.
- ⚠️ **ANALYSIS-001.4.2 / SEC-RULE-002:** Implementare validazione completa per `externalLinks`. (ON HOLD / DECISIONE PRESA)
- ➡️ **ANALYSIS-001.4.3 / SEC-RULE-003:** Mettere in sicurezza `commentCount`. (OBSOLETO)
- ➡️ **ANALYSIS-001.4.4 / SEC-RULE-004:** Reintrodurre validazione chiavi `userIssues`. (OBSOLETO)
- ✅ **ANALYSIS-001.4.5:** Risolto problema caricamento `firestore.rules` in emulatore.

✅ **Task SCHEMA-001: Aggiornare `firestore-schema.md`**
- `[x]` (Tutti i sub-task completati, inclusa l'aggiunta di `nicknameChangeRequests` e `lastNicknameRequestTimestamp`).

---

## 💈 TASK NAVBAR (PRIORITÀ CRITICA) 💈

✅ **Task NAV.1: Refactoring Completo Funzionalità e UI Navbar**
- `[x]` (TUTTI I SUB-TASK COMPLETATI)

---

## 🐞 BUG TRACKING 🐞

- ➡️ **BUG-NAV-RESP-001:** Scroll orizzontale homepage su mobile. (OBSOLETO - Risolto).
- ✅ 🐞 **BUG-PROF-AVATAR-BTN-001:** Pulsante "Conferma e Carica Avatar" invisibile. (RISOLTO)

---

## ✨ TASK DI RIFINITURA E NUOVE FUNZIONALITÀ ✨

✅ **Task NOTIF.1: Miglioramento UX Pannello Notifiche Popup**
- `[x]` (Tutti i sub-task completati)

🆕 **Task NOTIF.2: Espansione Tipi di Notifiche In-App**
- **Descrizione:** Introdurre nuove notifiche per migliorare il coinvolgimento.
- `[ ]` **NOTIF.2.1 (Notifica Conferma Email):**
    - `[ ]` **NOTIF.2.1.A (Creazione Logica Cloud Function):** Generare notifica Firestore.
    - `[ ]` **NOTIF.2.1.B (Testo e Azione Notifica):** Definire testo e comportamento.
    - `[ ]` **NOTIF.2.1.C (Persistenza e Rimozione):** Gestire visibilità.
- `[ ]` **NOTIF.2.2 (Brainstorming e Implementazione Altre Notifiche):**
    - 💡 Primo articolo pubblicato.
    - 💡 Badge sbloccato.
    - 💡 Risposta a un commento.
    - 💡 (Admin) Nuovo articolo in attesa di approvazione.
    - 💡 (Admin) Nuova richiesta di cambio nickname (vedi FUNC.1.4).
- ➡️ **NOTIF.EMAIL-TEMPLATES:** (OBSOLETO)

---

## 💅 MIGLIORAMENTI STRUTTURALI E UI/UX 💅

✅ **Task CSS-REFACTOR-001: Refactoring CSS con SCSS**
- `[x]` (Tutti i sub-task completati)

✅ **Task UI-FIX-001: Correzione Visualizzazione Dati Utente in Mini-Leaderboards**
- `[x]` (Tutti i sub-task completati)

✅ **Task D.9: Migliorare UX per Utente Non Registrato.**
- `[x]` (Tutti i sub-task completati eccetto D.9.5)
    - `[ ]` **D.9.5 (Coerenza Modali e Notifiche):** Verificare modali di login e header notifiche. (Priorità MEDIA-BASSA)

🆕 **Task UI-ICON-UPDATE-001: Aggiornamento Icone con Material Symbols**
- `[x]` **UI-ICON-UPDATE-001.1 (Upvote Issue):** Completato.
- `[x]` **UI-ICON-UPDATE-001.2 (Contribute.html Headers):** Completato.
- `[ ]` **UI-ICON-UPDATE-001.3 (Altre Sezioni):** Valutare altre aree.

✅ **Task UI-GB-STYLE-001: Rivedere stile commenti nel Guestbook**
- `[x]` (Tutti i sub-task completati)

➡️ ✨ **Task PROF-STYLE.1: Rendere quadrati i contenitori avatar.** (OBSOLETO)

✅ ✨ **Task PROF-STYLE.2: Migliorare CSS per box di input pagina profilo.**
- `[x]` (Tutti i sub-task completati)

---

## 🔧 TECHNICAL DEBT & REFACTORING 🔧

➡️ **Task TECH-DEBT-001: Unificare Sistemi di Gestione Commenti.** (OBSOLETO)

🆕💡 **Task TECH-DEBT-BTN-STYLE-001: Unificare e razionalizzare stili dei bottoni `.game-button`.** (Priorità BASSA)
- `[ ]` Analizzare le definizioni multiple.
- `[ ]` Definire uno stile base unico.
- `[ ]` Utilizzare classi modificatrici.

---

## 📚 PIANO DI SVILUPPO INTEGRATO 📚

### Sezione A: Gestione Contributi e Moderazione 🖋️
- `[x]` A.4.2.6.A (Admin UI): Textarea per `rejectionReason`.
- **Task A.5: Sistema di Notifiche In-App (Base).**
    - `[x]` (Funzionalità base completate)
    - `⚠️ [ON HOLD]` **Sub-task A.5.5: Notifiche per Interazioni Sociali Avanzate.** (Potenzialmente integrabili con NOTIF.2)

### Sezione AUTH: Gestione Autenticazione e Profilo Utente ✨👤

**Task PROF.1: Risoluzione Problemi e Miglioramenti Pagina Profilo (`profile.html`)**
- ✅ 🐞 **PROF.1.1 (Bug Mobile - Stato d'Animo):** (RISOLTO)
- `[P]` **PROF.1.2 (Layout Riconoscimenti - Desktop & Mobile):** (Priorità MEDIA)
    - ✅ **PROF.1.2.A:** Corretto allineamento sezione badge.
    - `[ ]` **PROF.1.2.B:** Valutare/implementare sezione dedicata per i badge. (*Decisione Utente 24/05/2025: Per ora va bene così*).
- ✅ **PROF.1.3 (Visibilità Riconoscimenti Profilo Pubblico):** (RISOLTO)
- ✅ **PROF.1.4 (Layout Generale Pagina Profilo):** (COMPLETATO)

**Task FUNC.1 (Revisione 3): Richiesta Cambio Nickname via Modale con Feedback Dettagliato e Notifiche Admin/Utente** (Priorità MEDIA) `[P] IN PROGRESSO`
- **Descrizione:** Implementare funzionalità in `profile.html` per richiedere cambio nickname.
- `[x]` **FUNC.1.1 (UI Profilo):** Aggiunta icona e struttura modale in `profile.html`. Stili base SCSS.
- `[P]` **FUNC.1.2 (Modale Richiesta Nickname - Logica Visualizzazione Dinamica):** Gestire stati: Iniziale, Richiesta Inviata, In Cooldown.
    - `[x]` Implementata logica base apertura/chiusura modale e visualizzazione vista iniziale.
    - `[x]` Implementata visualizzazione vista cooldown (client-side) basata su `lastNicknameRequestTimestamp`.
    - `[P]` **Gestione robusta stati modale (Richiesta Inviata, In Cooldown) basata sui dati Firestore e visibilità icona.** (FOCUS ATTUALE)
        - `[ ]` Assicurare che l'icona `#requestNicknameChangeBtn` sia sempre visibile se `isOwnProfile`.
        - `[ ]` Modificare `openNicknameChangeModal` per:
            - `[ ]` Controllare se esiste una richiesta `pending` per l'utente su `nicknameChangeRequests`. Se sì, mostrare `nicknameChangeRequestSentView`.
            - `[ ]` Altrimenti, controllare `getNicknameCooldownStatus`. Se in cooldown, mostrare `nicknameChangeCooldownView`.
            - `[ ]` Altrimenti, mostrare `nicknameChangeInitialView`.
    - `[ ]` **(DA FARE DOPO STABILIZZAZIONE STATI)** Implementare contatore dinamico (giorni, ore, minuti, secondi) per la vista `nicknameChangeCooldownView`.
- `[x]` **FUNC.1.3 (Logica Invio e Gestione Richiesta - Cloud Function):** Validazione, creazione documento in `/nicknameChangeRequests`, update `userProfiles.lastNicknameRequestTimestamp`, controllo intervallo 90 giorni, feedback tramite Cloud Function.
    - `[x]` Implementata validazione input client-side.
    - `[x]` Creata Cloud Function `requestNicknameChange` per la logica backend (unicità nickname case-insensitive, cooldown, scrittura su Firestore).
    - `[x]` Modificato `js/profile.js` per chiamare la Cloud Function.
    - `[x]` Implementato feedback tramite toast per successo/errore da Cloud Function.
- `[ ]` **FUNC.1.4 (Notifiche):**
    - `[ ]` Notifica all'utente per approvazione/rifiuto (da implementare quando la gestione admin è pronta).
    - 💡 (Opzionale/Futuro) Notifica automatica agli Admin alla creazione di una richiesta (vedi NOTIF.2.2).
- `[ ]` **FUNC.1.5 (Gestione Admin nel Pannello):** Visualizzazione richieste, possibilità di segnare come "processata".
- **Nota:** Focus attuale su `FUNC.1.2` per la corretta visualizzazione dell'icona e gestione degli stati della modale.

- **Task AUTH.3: Miglioramenti Funzionali Pagina Profilo Utente (`profile.html`)**
    - `[x]` Mini-Bio Utente (AUTH.3.4).
    - `[x]` Link Esterni (AUTH.3.2).
    - `[x]` Visualizzazione Badge/Riconoscimenti Utente (Base).
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
- ✅ **Task C.1: Gestione Avatar Utente Personalizzato.**
- **Task C.2: Donkey Runner (Gioco Esistente)**
    - `[x]` C.2.4 (Donkey Runner): Leggibilità testi e usabilità form fullscreen.
    - `[ ]` Task C.2.8 (Donkey Runner): Risolvere problemi file audio mancanti. (Priorità BASSA)
    - 🆕 `[ ]` **C.2.9 (Review Stili e Allineamento):** Revisionare stili e allineamento in `donkeyRunner.html` e `.js`. (Priorità MEDIA)
    - 🆕 `[ ]` **C.2.10 (Invito Amici / Sfida):** Aggiungere pulsante/sezione "Invita amici". (Priorità MEDIA-BASSA)
        - `[ ]` **C.2.10.1:** Definire UI.
        - `[ ]` **C.2.10.2:** Implementare logica (es. `navigator.share`).
    - 🆕 🤔 **C.2.11 (Condivisione Punteggio Partita):** Valutare fattibilità condivisione punteggio CodeDash. (Priorità BASSA - INVESTIGARE)
        - `[ ]` **C.2.11.1:** Analisi tecnica.
        - `[ ]` **C.2.11.2:** Design UI.
- ✅ **Task C.3: Miglioramenti Leaderboard & Info Glitchzilla** (Parzialmente Completato)
    - `[x]` (Molti sub-task già completati)
    - `[ ]` (Restante da C.3) Valutare ulteriori miglioramenti per "Info Glitchzilla".
- **Task C.5: Migliorare UI/UX di Donkey Runner Game** (Priorità MEDIA-BASSA).
    - _Potrebbe includere C.2.9_
- ➡️ **Task C.NEW_FEATURE_HP_ACTIVITY:** (SUPERSEDED)

### Sezione D: Miglioramenti UI/UX e Ottimizzazioni Generali ✨
- `[x]` Correzione ESLint `showConfirmationModal` in `js/profile.js`.
- `[x]` Task D.3.B.6: Revisionare e aggiornare README.md.
- `[ ]` Sub-task D.1.A.1: Aggiungere notifiche toast per conferma/errore like. (Priorità MEDIA-BASSA).
- ➡️ **Task D.UI-HP_FEATURED:** (SUPERSEDED)
- **Task D.LEADERBOARD-UX: Migliorare UI/UX della Leaderboard**
    - ✅ **D.LEADERBOARD-UX.1:** Stilizzare pulsante refresh. (COMPLETATO)
    - ➡️ **D.LEADERBOARD-UX.2:** Responsività tabella. (OBSOLETO)
    - ➡️ **D.LEADERBOARD-UX.3:** Visualizzazione compatta/espandibile. (OBSOLETO)

### Sezione Sicurezza & Stabilità 🛡️
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
- SCHEMA-001: Aggiornato `firestore-schema.md` (include `nicknameChangeRequests`).
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
- ✅ **FUNC.1.1 (UI Profilo - Modale Nickname):** COMPLETATO.
- ✅ **FUNC.1.3 (Logica Invio Richiesta Nickname - Cloud Function):** COMPLETATO.
- ✅ **Task Ausiliario (Footer Admin Link):** COMPLETATO.

---

// DevPlan v4.0.12 - Canvas Markdown - AthenaDev 🏛️✨ Sessione Pronta per Riprendere.
// Focus: Risolvere FUNC.1.2 (visibilità icona e stati modale nickname).