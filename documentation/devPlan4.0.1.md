# DEVELOPMENT PLAN (v4.0.1 - Stabilizzazione & Refactoring CSS) 🚀

**Data Ultimo Aggiornamento:** 21 Maggio 2025 (Athena Update - Refactoring SCSS completato)
**Visione Progetto:** Consolidare e stabilizzare la piattaforma esistente, migliorando la documentazione, la sicurezza e risolvendo il debito tecnico. Le funzionalità attuali, come Donkey Runner e il sistema di articoli, saranno mantenute e ottimizzate. L'evoluzione verso una piattaforma di "conoscenza on-demand" (KOD) NON è PREVISTA in questa versione e sarà dettagliata in un piano di sviluppo separato.

**Stato Generale del Progetto:**
La piattaforma ha recentemente completato un'importante revisione della gestione dei profili utente, delle relative regole di sicurezza Firestore (SEC-RULE-001), e un refactoring significativo del CSS per migliorare la manutenibilità e l'organizzazione tramite SCSS. La priorità rimane la stabilizzazione, il completamento della documentazione dello schema (`firestore-schema.md`) e la risoluzione del debito tecnico identificato.

**Legenda Stati:**

- ✅ **COMPLETATO** (Task concluso e verificato)
- `[x]` **COMPLETATO** (Sub-task concluso)
- `[ ]` **DA FARE** (Task pianificato, non iniziato)
- `[P]` **IN PROGRESSO** (Task avviato)
- ⚠️ **ON HOLD** (Task sospeso o in attesa di dipendenze/decisioni)
- 🆕 **NUOVO** (Task introdotto in questa versione del devplan)
- ➡️ **OBSOLETO** (Task il cui scopo è stato reso obsoleto o non più necessario)
- ⭐ **KOD CORE** (Task fondamentale per la visione "Knowledge-on-Demand" - _Riferimento per futuro piano KOD_)

---

## 🎯 FASE 1: STABILIZZAZIONE E DOCUMENTAZIONE (PRIORITÀ CRITICA) 🎯

**Task ANALYSIS-001.4 Follow-up (Priorità CRITICA): Implementare le raccomandazioni dell'analisi firestore.rules.**

- ✅ **ANALYSIS-001.4.1 / SEC-RULE-001:** Revisionare e restringere l'accesso in lettura a `/userProfiles/{userId}`. (RACCOMANDAZIONE CHIAVE)
    - `[x]` Modificate regole Firestore per `/userProfiles` (solo owner/admin leggono dati privati).
    - `[x]` Introdotta nuova collezione `/userPublicProfiles` per dati pubblici (leggibile da utenti auth), incluso `statusMessage`.
    - `[x]` Create, modularizzate (`userPublicProfileSync.js`) e testate Cloud Functions (`createUserPublicProfile`, `updateUserPublicProfile`, `deleteUserPublicProfile`) per sincronizzare `userProfiles` -> `userPublicProfiles`.
    - `[x]` Aggiornati e testati `js/profile.js`, `js/leaderboard.js`, `js/articleViewer.js`, e `js/comments.js` per utilizzare `/userPublicProfiles` per la visualizzazione dei dati pubblici altrui e `/userProfiles` per i dati privati del proprietario.
    - `[x]` Debug e risoluzione notifica mancante per badge `awardGlitchzillaSlayer`.
    - `[x]` Corretti i link nelle notifiche badge per usare `?userId=` invece di `?uid=`.
- ⚠️ **ANALYSIS-001.4.2 / SEC-RULE-002:** Implementare validazione completa per `externalLinks` negli aggiornamenti del profilo utente.
    - **Stato:** `⚠️ ON HOLD / DECISIONE PRESA`
    - **Nota:** Mantenuta validazione server-side semplificata, validazione dettagliata delegata al client (`js/profile.js`), risultato un compromesso accettabile.
- ➡️ **ANALYSIS-001.4.3 / SEC-RULE-003:** Mettere in sicurezza il meccanismo di aggiornamento del `commentCount` per `/articles/{articleId}`. (Reso OBSOLETO - 21 Maggio 2025)
- ➡️ **ANALYSIS-001.4.4 / SEC-RULE-004:** Reintrodurre validazione stretta delle chiavi (`keys().hasOnly([...])`) per la creazione di documenti in `/userIssues/{issueId}`. (RACCOMANDAZIONE CHIAVE) (Reso OBSOLETO - 21 Maggio 2025)
- `[ ]` **ANALYSIS-001.4.5 (Azione Utente):** Investigare e risolvere attivamente il problema di caricamento di `firestore.rules` nell'emulatore.

🆕 **Task SCHEMA-001: Aggiornare `firestore-schema.md` (Priorità ALTA)**

- **Descrizione:** Revisionare l'attuale struttura del database Firestore. Aggiornare il file `documentation/firestoreDocumentation/firestore-schema.md`.
- `[x]` Verificare e aggiornare la struttura di `userProfiles` per riflettere la sua natura privata.
- `[x]` Documentare la nuova collezione `userPublicProfiles`.
- `[x]` Aggiornato `firestore-schema.md` con le modifiche sopra.
- `[ ]` Verificare la struttura di `articles` e relative sottocollezioni (es. `comments`, `likes`).
- `[ ]` Verificare la struttura delle notifiche.
- **Verifica Necessaria:** Confronto con dati Firestore reali e regole.

---

## 💅 MIGLIORAMENTI STRUTTURALI E UI/UX 💅

🆕 **Task CSS-REFACTOR-001: Refactoring CSS con SCSS (Priorità ALTA)**

- **Descrizione:** Migliorare la manutenibilità, organizzazione e leggibilità del CSS del progetto adottando SCSS e modularizzando il file `styles.css` in partials.
- ✅ **CSS-REFACTOR-001.1:** Setup dell'ambiente per la compilazione SCSS (tramite estensione VS Code "Live Sass Compiler").
    - `[x]` Installata estensione "Live Sass Compiler".
    - `[x]` Configurato `settings.json` di VS Code per la compilazione.
- ✅ **CSS-REFACTOR-001.2:** Modularizzazione di `styles.css` in partials SCSS.
    - `[x]` Creato file `scss/main.scss` come entry point per gli import.
    - `[x]` Estratti stili per variabili (`_variables.scss`), reset/base (`_base.scss`), animazioni (`_animations.scss`), header (`_header.scss`), footer (`_footer.scss`), layout principale (`_main-content.scss`), homepage (`_homepage.scss`), vista articolo (`_article-view.scss`), skills (`_skills.scss`), profilo utente (`_profile.scss`), commenti (`_comments.scss`), modali (`_modals.scss`), Donkey Runner (`_donkey-runner.scss`), utilities (`_utilities.scss`), admin (`_admin.scss`), toast (`_toast.scss`), notifiche (`_notifications.scss`), register (`_register.scss`), issues (`_issues.scss`).
    - `[x]` Estratti stili responsive in un partial dedicato (`_responsive.scss`) e importato per ultimo.
    - `[x]` Spostati gli stili rimanenti (es. `.dev-text-content`, `.like-btn`, badges) nei partials appropriati (o in nuovi partials come `_typography.scss`, `_components.scss`).
    - `[x]` Verificata la corretta compilazione di `scss/main.scss` in `styles.css`.
    - `[x]` Testata la funzionalità e l'aspetto del sito dopo il refactoring.

✅ **Task UI-FIX-001: Correzione Visualizzazione Dati Utente in Mini-Leaderboards (Priorità ALTA)**

- **Descrizione:** Risolto problema di mancata visualizzazione di avatar e nomi utente aggiornati nelle mini-leaderboard.
- `[x]` **UI-FIX-001.1 (Donkey Runner):** Modificate `js/donkeyRunner.js` (`loadDonkeyLeaderboard`, `displayDonkeyLeaderboard`) per recuperare dati da `userPublicProfiles` (inclusi `displayName`, `avatarUrls.small`, `profileUpdatedAt` per cache-busting avatar, `nationalityCode`) e gestire fallback.
- `[x]` **UI-FIX-001.2 (Homepage Snippet):** Modificata funzione `loadHomeMiniLeaderboard` in `js/main.js` per recuperare dati da `userPublicProfiles` (inclusi `displayName`, `avatarUrls.small`, `profileUpdatedAt` per cache-busting avatar, `nationalityCode`) per la card "Top Players Snippet" (`homeMiniLeaderboardList`).

---

## 🔧 TECHNICAL DEBT & REFACTORING (Legacy) 🔧

➡️ **Task TECH-DEBT-001: Unificare Sistemi di Gestione Commenti (Priorità MEDIA-ALTA)** (Reso OBSOLETO - 21 Maggio 2025)

- **Descrizione:** Investigare i due sistemi di commenti separati. Progettare e implementare un sistema unificato.
- `[ ]` Analizzare strutture Firestore correnti.
- `[ ]` Definire una struttura Firestore unica.
- `[ ]` Rifattorizzare `js/comments.js` e `js/articleViewer.js`.
- `[ ]` Gestire migrazione dati.

---

## 📚 PIANO DI SVILUPPO INTEGRATO (Stato Attuale & Funzionalità Esistenti) 📚

_(Le sezioni A, AUTH, C, D, E, F mantengono i task come da devplan v4.0.1 originale, con le seguenti eccezioni o focus)_

### Sezione A: Gestione Contributi e Moderazione 🖋️

_Stato: Flusso base sottomissione/revisione articoli implementato._

- `[x]` A.4.2.6.A (Admin UI): Textarea per `rejectionReason`.
- **Task A.5: Sistema di Notifiche In-App (Base).**
    - _(Funzionalità base pannello e pagina "Tutte le Notifiche" COMPLETATE)_
    - `[x]` Sub-task A.5.1 - A.5.4.7 (COMPLETATI)
    - `⚠️ [ON HOLD]` **Sub-task A.5.5: Notifiche per Interazioni Sociali Avanzate.**
        - `[ ]` Notifica autore per "complimento" articolo.
        - `[ ]` Notifica utente per presa in carico richiesta articolo.
        - `[ ]` Notifica utente per pubblicazione articolo richiesto.
        - `⚠️ [ON HOLD]` Notifiche like/commenti generici.
        - `⚠️ [ON HOLD]` Notifiche risposte commenti (richiede prima TECH-DEBT-001).

### Sezione AUTH: Gestione Autenticazione e Profilo Utente ✨👤

_Stato: Funzionalità base profilo presenti._

- **Task AUTH.3: Miglioramenti Funzionali Pagina Profilo Utente (`profile.html`)**
    - `[x]` Mini-Bio Utente (AUTH.3.4).
    - `[x]` Link Esterni (AUTH.3.2).
    - `[x]` Visualizzazione Badge/Riconoscimenti Utente.
    - `[ ]` Sub-task AUTH.3.2.2 (Miglioramento Visivo Link): Anteprime/icone sito (Priorità MEDIA-BASSA).
    - **Sub-task AUTH.3.4 (Opzionale/Idee Future):**
        - `[ ]` Contatori Semplici (Data registrazione). (Priorità BASSA)
        - `[x]` Badge/Achievements Semplici (Pilota) (COMPLETATI AUTH.3.4.B.1, B.3, B.4)
        - `[ ]` Sub-task AUTH.3.4.B.5 (10 Articoli Pubblicati): Tracciamento e badge (Priorità MEDIA-BASSA).
    - `[ ]` Sub-task AUTH.3.5: Articoli Preferiti / Segnalibri (Priorità MEDIA-BASSA).
    - **Sub-task AUTH.3.6: Miglioramenti Visivi Nickname.** (Priorità MEDIA)
        - `[ ]` Sub-task AUTH.3.6.1: Nickname Dinamico - Glitchzilla Effect.
        - `[ ]` Sub-task AUTH.3.6.2: Nickname Dinamico - Icona Autore.
    - ➡️ **Sub-task AUTH.3.7: Sistema di Amicizie/Followers.** (OBSOLETO)

### Sezione C: Funzionalità Specifiche Giochi/Piattaforma 🎮 & Contenuti Esistenti

_Stato: Donkey Runner e Leaderboard rimangono._

- **Task C.1: Gestione Avatar Utente Personalizzato.** (✅ COMPLETATO)
- **Task C.2: Donkey Runner (Gioco Esistente)**
    - `[x]` C.2.4 (Donkey Runner): Leggibilità testi e usabilità form fullscreen.
    - `[ ]` Task C.2.8 (Donkey Runner): Risolvere problemi file audio mancanti. (Priorità BASSA)
- **Task C.3: Miglioramenti Leaderboard & Info Glitchzilla** (Priorità MEDIA)
    - `[x]` Avatar aggiornati e performanti sulla Leaderboard (REGRESS-004).
    - `[ ]` Restanti miglioramenti funzionali o di UI per la leaderboard.
    - `[ ]` Miglioramenti Info Glitchzilla.
- **Task C.5: Migliorare UI/UX di Donkey Runner Game** (Priorità MEDIA-BASSA).
    - _Da definire focus specifico (es. menu, HUD, game over screen, controlli mobile)_
- ➡️ **Task C.NEW_FEATURE_HP_ACTIVITY:** (SUPERSEDED)

### Sezione D: Miglioramenti UI/UX e Ottimizzazioni Generali ✨

_Stato: Alcuni task rimangono validi._

- `[x]` Correzione ESLint `showConfirmationModal` in `js/profile.js`.
- `[x]` Task D.3.B.6: Revisionare e aggiornare README.md (focus tecnologie).
- `[ ]` Sub-task D.1.A.1: Aggiungere notifiche toast per conferma/errore like. (Priorità MEDIA-BASSA).
- `[ ]` Task D.9: Migliorare UX per Utente Non Registrato. (Priorità MEDIA).
- ➡️ **Task D.UI-HP-FEATURED:** (SUPERSEDED)
- **Task D.LEADERBOARD-UX: Migliorare UI/UX della Leaderboard** (Priorità BASSA)
    - `[ ]` D.LEADERBOARD-UX.1: Stilizzare il pulsante di refresh della leaderboard.
    - `[ ]` D.LEADERBOARD-UX.2: Verificare e migliorare la responsività della tabella dei punteggi.
    - `[ ]` D.LEADERBOARD-UX.3: Progettare/implementare visualizzazione compatta/espandibile per le righe.
- _(Altri task D come da v3.17.10 - da rivalutare)_

### Sezione Sicurezza & Stabilità (Derivata da ANALYSIS-001.4) 🛡️

_Stato: Ora inclusi nella Fase 1 CRITICA (ma alcuni resi obsoleti)._

- **Task ANALYSIS-001.4: Analisi storage.rules e firestore.rules.** (✅ ANALISI COMPLETATA)
    - `[x]` Analisi `storage.rules`.
    - `[x]` Analisi `firestore.rules`.
- _(Vedi inizio devplan per task SEC-RULE e ANALYSIS-001.4.5)_

### Sezione E: Ricerca e Sviluppo a Lungo Termine 🔬📈

- `[x]` Task E.4: Adozione e Implementazione Cloud Functions.
    - `[x]` Sub-task E.4.4: Decisione adozione: SÌ.
    - `[x]` Implementate e deployate: `updateAuthorOnArticlePublish`, `awardGlitchzillaSlayer`, `processUploadedAvatar`, `handleArticleStatusNotifications`.
- _(Strategia Mobile per piano futuro)_

### Sezione F: Fase di Perfezionamento Finale (Polish) 💅🎨

_Stato: Da rivalutare._

- `[x]` F.2.4.3.A.1 (Icone Like/Commenti Homepage).
- `[x]` F.2.4.3.A.2 (Icone Portal Card Homepage).
- _(Altri task F come da v3.17.10 - da rivalutare)_

---

## ✅ TASK COMPLETATI RECENTEMENTE (Focus Notifiche Panel/Page & Rules Analysis - Pre-Pivot KOD & Refactoring CSS) ✅

_(Riferimento a v3.18.3 e aggiornamenti sessione corrente)_

- Task REGRESS-001: Impossibilità di Registrare Nuovi Utenti - COMPLETATO
- Task REGRESS-002: Regressione Permessi Funzionalità Profilo Utente - COMPLETATO
- Task TEXT-001: Chiarire Testo Avatar su Pagina Registrazione - COMPLETATO
- Task REGRESS-003.4 (Avatar - Default e Fallback): Avatar di Default Non Trovato - COMPLETATO
- Task (Da ANALYSIS-001): Correzione Aggiornamento Link Esterni - COMPLETATO
- Task REGRESS-NAV-AVATAR-001: Avatar non aggiornato nella Navbar - COMPLETATO
- Task REGRESS-003.3 (Avatar - Stabilità profileUpdatedAt) - COMPLETATO
- Task REGRESS-003.1 & REGRESS-003.2 (Avatar - Reattività e Cache Busting) - COMPLETATO
- Task C.1 (Avatar Utente - Fase Finale) / REGRESS-003.5: Test completo end-to-end avatar - COMPLETATO
- Task REGRESS-004: Avatar non aggiornati in Leaderboard - COMPLETATO
- Task REGRESS-005: Avatar non aggiornati in Articoli e Commenti - COMPLETATO
- Task A.5 (Notifiche In-App via Cloud Functions) - FUNZIONALITÀ BASE COMPLETATE
- Task ANALYSIS-001.4 (Analisi `storage.rules` e `firestore.rules`) - ANALISI COMPLETATA
- ✅ **Task UI-FIX-001:** Correzione Visualizzazione Dati Utente in Mini-Leaderboards (Donkey Runner & Homepage Snippet) - COMPLETATO (21 Maggio 2025)
- ✅ **Task CSS-REFACTOR-001:** Refactoring CSS con SCSS e modularizzazione `styles.css` - COMPLETATO (21 Maggio 2025)

---
