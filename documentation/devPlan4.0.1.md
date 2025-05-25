---
title: DEVELOPMENT PLAN (v4.0.15 - Fine Sessione Athena - Debug Deploy Richiesto)
date: 2025-05-25
version: 4.0.15
author: AthenaDev
status: In Corso
---

# DEVELOPMENT PLAN (v4.0.15 - Fine Sessione Athena - Debug Deploy Richiesto) 🚀

**Data Ultimo Aggiornamento:** 25 Maggio 2025 (Athena Update - Fine Sessione)
**Visione Progetto:** Consolidare e stabilizzare la piattaforma esistente, migliorando la documentazione, la sicurezza, l'UX e risolvendo il debito tecnico. Le funzionalità attuali, come Donkey Runner e il sistema di articoli, saranno mantenute e ottimizzate, con un focus sul miglioramento dell'esperienza utente per le notifiche e la pagina profilo.

**Stato Generale del Progetto:**
Nella sessione odierna abbiamo **COMPLETATO** con successo il task di rifinitura per il feedback admin nel pannello di gestione delle richieste nickname (`FUNC.1.5.F`). Abbiamo poi iniziato a lavorare sull'implementazione della notifica e assegnazione badge per la verifica email dell'utente (`NOTIF.2.1`). Il codice per la Cloud Function è stato scritto, ma il deploy ha restituito un errore (`TypeError: Cannot read properties of undefined (reading 'user')`) che necessita di investigazione e risoluzione nella prossima sessione.

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
- ✅ **SEC-RULE-005 (Nickname Requests):** Aggiunta regola di sicurezza per `/nicknameChangeRequests` per permettere lettura agli admin e agli utenti delle proprie richieste.

✅ **Task SCHEMA-001: Aggiornare `firestore-schema.md`**
- `[x]` (Tutti i sub-task completati, inclusa l'aggiunta di `nicknameChangeRequests` e `lastNicknameRequestTimestamp`).
- `[ ]` **SCHEMA-001.1 (Nuovo Badge):** Aggiungere `verified-user` alla lista dei badge possibili in `userProfiles.earnedBadges`.

---

## 💈 TASK NAVBAR (PRIORITÀ CRITICA) 💈

✅ **Task NAV.1: Refactoring Completo Funzionalità e UI Navbar**
- `[x]` (TUTTI I SUB-TASK COMPLETATI)

---

## 🐞 BUG TRACKING 🐞

- ➡️ **BUG-NAV-RESP-001:** Scroll orizzontale homepage su mobile. (OBSOLETO - Risolto).
- ✅ 🐞 **BUG-PROF-AVATAR-BTN-001:** Pulsante "Conferma e Carica Avatar" invisibile. (RISOLTO)
- 🆕 🐞 **BUG-DEPLOY-FUNC-001 (Notifica Email):** Errore `TypeError: Cannot read properties of undefined (reading 'user')` durante il deploy della funzione `sendEmailVerificationNotification`. Da investigare e risolvere. (Vedi `NOTIF.2.1`)

---

## ✨ TASK DI RIFINITURA E NUOVE FUNZIONALITÀ ✨

✅ **Task NOTIF.1: Miglioramento UX Pannello Notifiche Popup**
- `[x]` (Tutti i sub-task completati)

🆕 **Task NOTIF.2: Espansione Tipi di Notifiche In-App**
- **Descrizione:** Introdurre nuove notifiche per migliorare il coinvolgimento.
- `[P]` **NOTIF.2.1 (Notifica Conferma Email & Badge "Utente Verificato"):**
    - `[P]` **NOTIF.2.1.A (Creazione Logica Cloud Function):** Scritta funzione `sendEmailVerificationNotification` che assegna badge e invia notifica. **Errore in deploy.**
    - `[x]` **NOTIF.2.1.B (Testo e Azione Notifica/Badge):** Definiti: tipo `new_badge`, titolo "Nuovo Badge Sbloccato!", messaggio per badge "Utente Verificato", icona `verified_user`, link al profilo.
    - `[ ]` **NOTIF.2.1.C (Persistenza e Rimozione):** Gestita da sistema notifiche esistente. Da verificare dopo deploy.
    - `[ ]` **NOTIF.2.1.D (Debug Deploy):** Risolvere `TypeError` in `functions/index.js` legato all'import/utilizzo di `functions.auth`.
- `[P]` **NOTIF.2.2 (Brainstorming e Implementazione Altre Notifiche):**
    - 💡 Primo articolo pubblicato. (GESTITO DA `updateAuthorOnArticlePublish`)
    - 💡 Badge sbloccato. (GESTITO DA `updateAuthorOnArticlePublish` e `awardGlitchzillaSlayer`)
    - `[ ]` Risposta a un commento. (DA FARE)
    - `[x]` **(Admin) Nuova richiesta di cambio nickname:** (Completato, vedi FUNC.1.4)
    - `[x]` **(Utente) Esito richiesta cambio nickname:** (Completato, vedi FUNC.1.4)
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

✅ **Task REFACTOR-NOTIF-UTILS-001: Refactoring della funzione `createNotification`.**
- `[x]` **REFACTOR-NOTIF-UTILS-001.1:** Spostato `createNotification` da `functions/index.js` a un nuovo file helper dedicato (`functions/notificationUtils.js`).
- `[x]` **REFACTOR-NOTIF-UTILS-001.2:** Esportata la funzione dal nuovo file.
- `[x]` **REFACTOR-NOTIF-UTILS-001.3:** Importato e utilizzato `createNotification` in `functions/index.js` e `functions/nicknameRequestHandler.js`.

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

✅ **Task FUNC.1 (Revisione 3): Richiesta Cambio Nickname via Modale con Feedback Dettagliato e Notifiche Admin/Utente** (Priorità MEDIA)
- **Descrizione:** Implementata funzionalità completa in `profile.html` e nel pannello admin per richiedere e gestire il cambio nickname.
- `[x]` **FUNC.1.1 (UI Profilo):** Aggiunta icona e struttura modale in `profile.html`. Stili base SCSS.
- `[x]` **FUNC.1.2 (Modale Richiesta Nickname - Logica Visualizzazione Dinamica):** Gestiti stati: Iniziale, Richiesta Inviata, In Cooldown, incluso contatore dinamico.
- `[x]` **FUNC.1.3 (Logica Invio e Gestione Richiesta - Cloud Function):** Validazione, creazione documento in `/nicknameChangeRequests`, e aggiornamento `userProfiles`.
- ✅ **FUNC.1.4 (Notifiche):**
    - `[x]` **Notifica all'utente per approvazione/rifiuto:** Completato.
    - `[x]` **Notifica automatica agli Admin alla creazione di una richiesta:** Creata Cloud Function `notifyAdminsOnNewNicknameRequest`.
- ✅ **FUNC.1.5 (Gestione Admin nel Pannello):** Visualizzazione richieste e azioni di approvazione/rifiuto.
    - `[x]` **FUNC.1.5.A (UI Admin Dashboard):** Creata sezione per visualizzare richieste.
    - `[x]` **FUNC.1.5.B (JS Admin Dashboard - Visualizzazione):** Implementata funzione `loadNicknameChangeRequests`.
    - `[x]` **FUNC.1.5.C (JS Admin Dashboard - Chiamata Cloud Functions):** Implementata logica per chiamare `approveNicknameChange` e `rejectNicknameChange`.
    - `[x]` **FUNC.1.5.D (Cloud Functions - Base):** Create e deployate funzioni base per approvazione/rifiuto.
    - `[x]` **FUNC.1.5.E (Cloud Functions - Notifiche):** Integrata la creazione di notifiche utente.
    - ✅ **FUNC.1.5.F (UI Admin - Feedback Dettagliato):** Migliorato il feedback (toast) per l'admin dopo approvazione/rifiuto. (Completato il 25/05)

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

## ✅ TASK COMPLETATI (Sessione Corrente del 25 Maggio 2025 Inclusa) ✅

- **(Sessioni Precedenti):** REGRESS-001, ..., UI-GB-STYLE-001, etc.
- ✅ **Task REFACTOR-NOTIF-UTILS-001:** Completato il refactoring della funzione `createNotification`.
- ✅ **Task FUNC.1.4 (Notifiche Utente e Admin Nickname):** Completate.
- ✅ **FUNC.1.2 & FUNC.1.3 (Modale e Logica Invio Richiesta Nickname):** COMPLETATI.
- ✅ **FUNC.1.5.A-E (Gestione Admin Nickname):** Completate.
- ✅ **SEC-RULE-005 (Nickname Requests):** COMPLETATO.
- ✅ **FUNC.1.5.F (UI Admin - Feedback Dettagliato Nickname):** Migliorato il feedback per l'admin dopo approvazione/rifiuto. (Completato il 25/05)

---

## 📝 TASK IN PROGRESSO (Fine Sessione 25 Maggio 2025) 📝

- **`[P]` INFRA-001:** Migrazione Hosting su Firebase Hosting.
- **`[P]` NOTIF.2.1 (Notifica Conferma Email & Badge "Utente Verificato"):** Logica Cloud Function scritta, ma deploy fallito. Necessita debug (`BUG-DEPLOY-FUNC-001`).
    - `[P]` **NOTIF.2.1.A:** Cloud Function `sendEmailVerificationNotification` (include assegnazione badge).
    - `[ ]` **NOTIF.2.1.D:** Debug deploy.
- **`[P]` PROF.1.2:** Layout Riconoscimenti Pagina Profilo.

---

// DevPlan v4.0.15 - Canvas Markdown - AthenaDev 🏛️✨ Sessione Conclusa.
// **Prossima Sessione:** Priorità al debug del deploy per `sendEmailVerificationNotification` (`BUG-DEPLOY-FUNC-001`/`NOTIF.2.1.D`). Successivamente, potremo testare la funzionalità e procedere con gli altri tipi di notifiche (`NOTIF.2.2`).
