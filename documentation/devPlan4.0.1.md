# DEVELOPMENT PLAN - asyncDonkey.io (Canvas View)

**Data Ultimo Aggiornamento:** 25 Maggio 2025, 22:09 CEST (AthenaDev Update - Fine Sessione)
**Versione DevPlan:** 4.2.0
**Visione Progetto:** Consolidare e stabilizzare la piattaforma, migliorando documentazione, sicurezza, UX e risolvendo il debito tecnico. Focus sull'espansione del sistema di badge e notifiche.

---

## ☰ LEGGENDA STATI ☰

- `[ ]` **DA FARE** (Pianificato)
- `[P]` **IN PROGRESSO** (Iniziato)
- `[x]` **COMPLETATO** (Concluso e Verificato)
- `[D]` **IN DISCUSSIONE / DA DEFINIRE**
- `[H]` **ON HOLD** (Sospeso)
- `[B]` **BUG / PROBLEMA IDENTIFICATO**
- `[N]` **NOTA / INFO**
- `[OBS]` **OBSOLETO**

---

## 📋 COLONNA: Backlog / Da Fare 🎯

---

### **AREA: Infrastruttura e Deployment**
- `[ ]` **INFRA-001: Migrazione Hosting su Firebase Hosting** (Priorità: ALTA)
    - `[x]` INFRA-001.1: Revisionare documentazione `firebaseHostingMigration.md`.
    - `[x]` INFRA-001.2: Configurare progetto Firebase per Firebase Hosting.
    - `[x]` INFRA-001.3: Affinare configurazione di hosting in `firebase.json`.
    - `[x]` INFRA-001.4 (Test Locali): Eseguire test con `firebase emulators:start`.
    - `[ ]` INFRA-001.5 (Deploy Staging): Distribuire su un canale di anteprima.
    - `[ ]` INFRA-001.6 (Test Staging): Eseguire test approfonditi sul canale di anteprima.
    - `[ ]` INFRA-001.7 (Dominio Custom): Configurare il dominio personalizzato.
    - `[ ]` INFRA-001.8 (Go-Live): Eseguire il deployment in produzione.
    - `[ ]` INFRA-001.9 (Post-GoLive): Aggiornare documentazione e configurare CI/CD.
    - `[N]` Posticipare il deploy staging dopo altri task di codice.

---

### **AREA: Funzionalità Profilo Utente e Gamification**
- `[ ]` **PROF.1.2 (Layout Riconoscimenti - Pagina Profilo)** (Priorità: MEDIA)
    - `[x]` PROF.1.2.A: Corretto allineamento sezione badge.
    - `[ ]` PROF.1.2.B: Valutare/implementare sezione dedicata per i badge (Decisione Utente 24/05/2025: Per ora va bene così).
- `[ ]` **AUTH.3.2.2 (Miglioramento Visivo Link Esterni Profilo)**: Aggiungere anteprime/icone sito. (Priorità: MEDIA-BASSA)
- `[ ]` **AUTH.3.4.B (Contatori Semplici Profilo):** Data registrazione. (Priorità: BASSA)
- `[H]` **AUTH.3.4.B.5 (Badge "10 Articoli Pubblicati"):** Tracciamento e badge. (Priorità: MEDIA-BASSA - POSTICIPATO, vedi NOTIF.2.2.X)
- `[ ]` **AUTH.3.6.1 (Nickname Dinamico - Glitchzilla Effect):** (Priorità: MEDIA)

- `[ ]` **UI-BADGES-001 (Modale Informativa Badge):** Implementare modale accessibile da icona '?' nella sezione badge del profilo per spiegare come ottenere i vari riconoscimenti. (Priorità: MEDIA)
    - `[ ]` UI-BADGES-001.1: Aggiungere icona `help` in `profile.html`.
    - `[ ]` UI-BADGES-001.2: Creare struttura modale generica (es. in `uiUtils.js`).
    - `[ ]` UI-BADGES-001.3: Popolare dinamicamente la modale leggendo da `badgeDefinitions` Firestore (nome, icona, `howToEarn`).

- `[ ]` **NOTIF.2.2.X (Implementazione Nuovi Badge Brainstorming)** (Priorità: MEDIA-ALTA - Da fare nella prossima sessione)
    - `[N]` **Procedura Generale Aggiunta Nuovo Badge:**
        - 1. Definire ID, nome, descrizione, `howToEarn`, icona, colore base.
        - 2. Creare documento corrispondente in `badgeDefinitions` (Firestore).
        - 3. Se animato: Definire `@keyframes` e classe CSS in `scss/_animations.scss`. Aggiornare `isAnimated: true` e `animationClass` nel documento Firestore del badge. Ricompilare SCSS.
        - 4. Implementare logica di assegnazione (solitamente nuova Cloud Function triggerata da Firestore o HTTP Callable).
        - 5. La Cloud Function deve:
            - Controllare le condizioni per l'assegnazione.
            - Verificare che l'utente non possieda già il badge.
            - Aggiornare `userProfiles/{userId}.earnedBadges` con `FieldValue.arrayUnion('ID_BADGE')`.
            - Chiamare `createNotification` (da `notificationUtils.js`, usando `getBadgeDetails` per i dettagli) per informare l'utente.
        - 6. Testare l'assegnazione e la visualizzazione.
    - `[ ]` **GAME-BADGE-002 (Badge "Commentatore Assiduo"):** 10 commenti totali. (Priorità: MEDIA)
        - `[ ]` Aggiungere contatore `commentsWritten` a `userProfiles`.
        - `[ ]` Cloud Function triggerata su creazione commento per incrementare e assegnare badge.
    - `[ ]` **GAME-BADGE-003 (Badge "Mecenate degli Articoli"):** 10 like ad articoli diversi. (Priorità: MEDIA)
        - `[ ]` Aggiungere contatore `likesGiven` a `userProfiles`.
        - `[ ]` Cloud Function triggerata su like per incrementare e assegnare badge.
    - `[D]` **GAME-BADGE-004 (Badge "L'Araldo"):** Condivisione 1 articolo. (Priorità: BASSA - [D] INVESTIGARE fattibilità tracciamento `navigator.share`).
    - `[ ]` **USER-BADGE-001 (Badge "Early Adopter"):** Registrazione entro 3 mesi dal lancio (basato su `userProfiles.createdAt`). (Priorità: BASSA)
    - `[ ]` **USER-BADGE-002 (Badge "Costruttore di Comunità"):** Primo commento sotto 5 nuovi articoli. (Priorità: MEDIA-BASSA)
    - `[ ]` **USER-BADGE-003 (Badge "Connettore Social"):** Aggiungere 3+ link esterni al profilo. (Priorità: BASSA)

- `[ ]` **NOTIF.2.2 (Implementazione Altre Notifiche In-App)** (Priorità: MEDIA - Sostituito da NOTIF.2.2.X per focus sui badge)
    - `[ ]` **NOTIF.2.2.A:** Risposta a un commento.
    - `[N]` `NOTIF.2.2.B`: Primo articolo pubblicato (GESTITO da `updateAuthorOnArticlePublish` che ora assegna `author-rookie`).
    - `[N]` `NOTIF.2.2.C`: Badge sbloccato (GESTITO da varie funzioni, es. `updateAuthorOnArticlePublish`, `awardGlitchzillaSlayer`, `grantVerificationBadge`, `awardDebuggatorBadgeOnNewHighScore`).
    - `[N]` `NOTIF.2.2.D`: (Admin) Nuova richiesta cambio nickname (Completato, vedi FUNC.1.4).
    - `[N]` `NOTIF.2.2.E`: (Utente) Esito richiesta cambio nickname (Completato, vedi FUNC.1.4).

- `[ ]` **SCHEMA-001.1 (Aggiornamento Schema Badge):** Aggiungere `verified-user`, `author-rookie`, `the-debuggator` (e futuri) alla lista dei badge possibili in `userProfiles.earnedBadges` nel file `firestore-schema.md` (Priorità: ALTA).

---

### **AREA: Donkey Runner (Gioco Esistente)**
- `[ ]` **C.2.8 (Donkey Runner):** Risolvere problemi file audio mancanti. (Priorità: BASSA)
- `[ ]` **C.2.9 (Donkey Runner - Review Stili):** Revisionare stili e allineamento in `donkeyRunner.html` e `.js`. (Priorità: MEDIA)
- `[ ]` **C.2.10 (Donkey Runner - Invito Amici):** Aggiungere pulsante/sezione "Invita amici". (Priorità: MEDIA-BASSA)
    - `[ ]` C.2.10.1: Definire UI.
    - `[ ]` C.2.10.2: Implementare logica (es. `navigator.share`).
- `[ ]` **C.2.11 (Donkey Runner - Condivisione Punteggio):** Valutare fattibilità condivisione punteggio. (Priorità: BASSA - [D] INVESTIGARE)
    - `[ ]` C.2.11.1: Analisi tecnica.
    - `[ ]` C.2.11.2: Design UI.
- `[ ]` **C.3 (Restante - Info Glitchzilla):** Valutare ulteriori miglioramenti per "Info Glitchzilla". (Priorità: BASSA)
- `[ ]` **C.5 (Migliorare UI/UX Donkey Runner):** Potrebbe includere C.2.9. (Priorità: MEDIA-BASSA)

---

### **AREA: Miglioramenti UI/UX Generali**
- `[ ]` **D.9.5 (Coerenza Modali e Notifiche Login/Header):** Verificare modali di login e header notifiche. (Priorità: MEDIA-BASSA)
- `[ ]` **UI-ICON-UPDATE-001.3 (Altre Sezioni Icone):** Valutare altre aree per aggiornamento icone con Material Symbols. (Priorità: BASSA)
- `[ ]` **D.1.A.1 (Notifiche Toast per Like):** Aggiungere notifiche toast per conferma/errore like. (Priorità: MEDIA-BASSA)

---

### **AREA: Debito Tecnico & Refactoring**
- `[ ]` **TECH-DEBT-BTN-STYLE-001 (Unificare Stili Bottoni `.game-button`):** (Priorità: BASSA)
    - `[ ]` Analizzare le definizioni multiple.
    - `[ ]` Definire uno stile base unico.
    - `[ ]` Utilizzare classi modificatrici.

---

### **AREA: Gestione Contributi e Moderazione (KOD)**
- `[ ]` **A.5.5 (Notifiche per Interazioni Sociali Avanzate KOD):** Potenzialmente integrabili con NOTIF.2. ([H] ON HOLD)

---
---

## 🛠️ COLONNA: In Progress / Lavori Attuali ⌛

---

### **AREA: Sicurezza e Regole Firestore**
- `[P]` **ANALYSIS-001.4 / SEC-RULE-002 (Validazione `externalLinks`):** Implementare validazione completa per `externalLinks` nelle regole Firestore. ([H] ON HOLD / DECISIONE PRESA: Per ora non implementare la validazione server-side stretta, affidarsi a moderazione e logica client.)

- `[P]` **Sicurezza Notifiche e Badge:** (Priorità: CRITICA)
    * **Descrizione:** Assicurare che le nuove funzionalità di notifica e badge siano supportate da regole Firestore robuste.
    * `[ ]` Scrivere/verificare regole di sicurezza per `userProfiles/{userId}/notifications` (solo utente proprietario e admin possono leggere/scrivere). (Verificato implicitamente come funzionante, ma da rivedere per completezza formale).
    * `[ ]` Verificare che le regole per `userProfiles` permettano l'aggiornamento sicuro di `earnedBadges` solo tramite Cloud Functions autorizzate. (Verificato, le CF operano con privilegi elevati).

---

### **AREA: Funzionalità Profilo Utente e Gamification**
- `[P]` **NOTIF.2.1 (Notifica Conferma Email & Badge "Utente Verificato")**
    - `[x]` NOTIF.2.1.A (Creazione Logica Cloud Function): Scritta funzione `grantVerificationBadge` (callable) che assegna badge e invia notifica.
    - `[x]` NOTIF.2.1.B (Testo e Azione Notifica/Badge): Definiti.
    - `[x]` NOTIF.2.1.D (Risoluzione Bug Deploy): Bug `TypeError` originale obsoleto. Nuovo bug "stale token" risolto forzando refresh token.
    - `[P]` NOTIF.2.1.C (Persistenza e Rimozione): Gestita da sistema notifiche esistente. **Da verificare comportamento a lungo termine e pulizia.**

---
---

## ✔️ COLONNA: Completato / Fatto ✅ (Sessione del 25 Maggio 2025 e Precedenti)

---

### **SESSIONE CORRENTE (25 Maggio 2025 - Sera)**
- `[x]` **TECH-DEBT-BADGE-DEFS-001 (Centralizzare Definizioni Badge su Firestore)**
    - `[x]` Creata collezione `badgeDefinitions` su Firestore.
    - `[x]` Definiti dati per `verified-user`, `glitchzilla-slayer`, `author-rookie` (con campo `howToEarn`) su Firestore.
    - `[x]` Aggiornate regole Firestore per `badgeDefinitions` (`read:true`, `write:false`).
    - `[x]` Refactoring `js/profile.js`:
        - Rimossa costante `BADGE_DEFINITIONS`.
        - Implementata funzione `WorkspaceAndCacheBadgeDefinitions()` per caricare da Firestore e mettere in cache.
        - Aggiornata funzione `renderBadges` (precedentemente parte di `updateProfilePageUI`) per usare dati da Firestore.
        - Resa `async` la funzione `openBadgeDetailsModal` per usare dati da Firestore.
        - Ottimizzata performance con pre-fetch dei badge.
    - `[x]` Refactoring `functions/index.js`:
        - Rimossa costante `BADGE_DETAILS`.
        - Implementata funzione helper `getBadgeDetails(badgeId)` per recuperare definizioni da Firestore.
        - Aggiornate Cloud Functions (`updateAuthorOnArticlePublish`, `awardGlitchzillaSlayer`, `grantVerificationBadge`) per usare `getBadgeDetails` per le notifiche.
- `[x]` **GAME-BADGE-001 (Badge "The Debuggator" - Donkey Runner)**
    - `[x]` Definizione badge `the-debuggator` in `badgeDefinitions` Firestore (incl. icona, colore, `howToEarn`).
    - `[x]` Creata Cloud Function `awardDebuggatorBadgeOnNewHighScore` (trigger `onCreate` su `leaderboardScores`):
        - Controlla punteggio `>= 2000` e `userId`.
        - Verifica non duplicati.
        - Assegna badge in `userProfiles`.
        - Invia notifica usando `createNotification` e `getBadgeDetails`.
    - `[x]` Aggiunta animazione `debuggator-icon-pulse-alert` in `scss/_animations.scss`.
    - `[x]` Aggiornato documento Firestore `the-debuggator` con `isAnimated: true` e `animationClass: 'debuggator-icon-pulse-alert'`.
- `[x]` **BUG-BADGE-ANIM-001 (Animazione `verified-user` non funzionante):** RISOLTO.
    - `[x]` Corretta struttura dati del badge `verified-user` su Firestore (`isAnimated`, `animationClass`).
- `[x]` **BUG-BADGE-ANIM-002 (Animazione `glitchzilla-slayer` non funzionante/definita):** RISOLTO.
    - `[x]` Corretta struttura dati del badge `glitchzilla-slayer` su Firestore (`isNeon`, `color`, etc.).

---

### **SESSIONI PRECEDENTI (Estratto Significativo del 25 Maggio 2025 e Precedenti - Non toccato in questa sessione serale)**
- `[x]` **NOTIF.2.1.A (Badge Utente Verificato - Implementazione Base)** (vedi NOTIF.2.1 sopra, progredito)
    - `[x]` Creata Cloud Function `grantVerificationBadge` (callable).
    - `[x]` Aggiunta logica client in `js/main.js` per chiamare la funzione dopo verifica email e refresh token.
    - `[x]` Definito il badge `verified-user` in `js/profile.js` (`BADGE_DEFINITIONS`) - OBSOLETO, ora in Firestore.
    - `[x]` Aggiunta animazione "pulse" ciano/blu per il badge `verified-user` (SCSS in `_animations.scss` e `_profile.scss`).
- `[x]` **BUG-DEPLOY-FUNC-001 (Errore Deploy Funzione Notifica Email):** OBSOLETO. Risolto cambiando approccio a Cloud Function Callable e gestendo "stale token".
- `[x]` **FUNC.1.5.F (UI Admin - Feedback Dettagliato Nickname):** Migliorato il feedback (toast) per l'admin dopo approvazione/rifiuto.
- `[x]` **ANALYSIS-001.4.1 / SEC-RULE-001:** Revisione e restrizione accesso lettura a `/userProfiles/{userId}`.
- `[x]` **ANALYSIS-001.4.5:** Risolto problema caricamento `firestore.rules` in emulatore.
- `[x]` **SEC-RULE-005 (Nickname Requests):** Aggiunta regola di sicurezza per `/nicknameChangeRequests`.
- `[x]` **SCHEMA-001 (Aggiornamento `firestore-schema.md` - Parziale):** Inclusa aggiunta `nicknameChangeRequests` e `lastNicknameRequestTimestamp`. *Nota: `verified-user` etc. da aggiungere.*
- `[x]` **Task NAV.1: Refactoring Completo Funzionalità e UI Navbar**.
- `[x]` **BUG-PROF-AVATAR-BTN-001:** Pulsante "Conferma e Carica Avatar" invisibile (RISOLTO).
- `[x]` **Task NOTIF.1: Miglioramento UX Pannello Notifiche Popup**.
- `[x]` **Task CSS-REFACTOR-001: Refactoring CSS con SCSS**.
- `[x]` **Task UI-FIX-001: Correzione Visualizzazione Dati Utente in Mini-Leaderboards**.
- `[x]` **Task D.9 (Migliorare UX Utente Non Registrato - Parziale):** Eccetto D.9.5.
- `[x]` **UI-ICON-UPDATE-001.1 (Upvote Issue)**.
- `[x]` **UI-ICON-UPDATE-001.2 (Contribute.html Headers)**.
- `[x]` **Task UI-GB-STYLE-001: Rivedere stile commenti nel Guestbook**.
- `[x]` **Task PROF-STYLE.2: Migliorare CSS per box di input pagina profilo**.
- `[x]` **Task REFACTOR-NOTIF-UTILS-001: Refactoring funzione `createNotification`**.
- `[x]` **A.4.2.6.A (Admin UI):** Textarea per `rejectionReason`.
- `[x]` **Task A.5 (Sistema Notifiche In-App - Base)**.
- `[x]` **PROF.1.1 (Bug Mobile - Stato d'Animo Profilo):** RISOLTO.
- `[x]` **PROF.1.3 (Visibilità Riconoscimenti Profilo Pubblico):** RISOLTO.
- `[x]` **PROF.1.4 (Layout Generale Pagina Profilo):** COMPLETATO.
- `[x]` **Task FUNC.1 (Revisione 3 - Richiesta Cambio Nickname):** Funzionalità completa.
- `[x]` **Task AUTH.3 (Miglioramenti Funzionali Profilo - Parziale):** Mini-Bio, Link Esterni (base), Visualizzazione Badge (base), Icona Autore Nickname.
- `[x]` **Task C.1: Gestione Avatar Utente Personalizzato**.
- `[x]` **C.2.4 (Donkey Runner):** Leggibilità testi e usabilità form fullscreen.
- `[x]` **Correzione ESLint `showConfirmationModal` in `js/profile.js`**.
- `[x]` **Task D.3.B.6: Revisionare e aggiornare README.md**.
- `[x]` **D.LEADERBOARD-UX.1: Stilizzare pulsante refresh leaderboard**.
- `[x]` **Task ANALYSIS-001.4 (Analisi storage.rules e firestore.rules - Base):** ANALISI COMPLETATA.
- `[x]` **Task E.4: Adozione e Implementazione Cloud Functions (Base)**.
- `[x]` **F.2.4.3.A.1 (Icone Like/Commenti Homepage)**.
- `[x]` **F.2.4.3.A.2 (Icone Portal Card Homepage)**.

---

### **🚫 TASK OBSOLETI / RIMOSSI 🗑️**
- `[OBS]` ANALYSIS-001.4.3 / SEC-RULE-003: Mettere in sicurezza `commentCount`.
- `[OBS]` ANALYSIS-001.4.4 / SEC-RULE-004: Reintrodurre validazione chiavi `userIssues`.
- `[OBS]` BUG-NAV-RESP-001: Scroll orizzontale homepage su mobile.
- `[OBS]` NOTIF.EMAIL-TEMPLATES.
- `[OBS]` PROF-STYLE.1: Rendere quadrati i contenitori avatar.
- `[OBS]` TECH-DEBT-001: Unificare Sistemi di Gestione Commenti.
- `[OBS]` Sub-task AUTH.3.5: Articoli Preferiti / Segnalibri.
- `[OBS]` Sub-task AUTH.3.7: Sistema di Amicizie/Followers.
- `[OBS]` Task C.NEW_FEATURE_HP_ACTIVITY.
- `[OBS]` Task D.UI-HP_FEATURED.
- `[OBS]` D.LEADERBOARD-UX.2: Responsività tabella.
- `[OBS]` D.LEADERBOARD-UX.3: Visualizzazione compatta/espandibile.

---
**Prossima Sessione:**
Inizieremo con `NOTIF.2.2.X (Implementazione Nuovi Badge Brainstorming)`, affrontando i badge che abbiamo discusso (es. "Commentatore Assiduo", "Mecenate degli Articoli") e valutando l'implementazione di altri. Seguiremo la procedura raffinata in questa sessione, ricordandoci di definire le animazioni in `scss/_animations.scss` e di creare i documenti corrispondenti in `badgeDefinitions` su Firestore, oltre alla logica di assegnazione nelle Cloud Functions.