# DEVELOPMENT PLAN (v4.0.3 - Stabilizzazione Navbar & Profilo - Athena Session Update) 🚀

**Data Ultimo Aggiornamento:** 23 Maggio 2025 (Athena Update)
**Visione Progetto:** Consolidare e stabilizzare la piattaforma esistente, migliorando la documentazione, la sicurezza e risolvendo il debito tecnico. Le funzionalità attuali, come Donkey Runner e il sistema di articoli, saranno mantenute e ottimizzate.

**Stato Generale del Progetto:**
Recenti progressi includono la correzione del pulsante di logout desktop (NAV.1.1.1) e la risoluzione di un errore di export in `main.js`. È stato identificato un errore di annidamento HTML nell'header di `index.html` (corretto, ma il problema di visibilità del logout per utenti non autenticati su `index.html` persiste). Si sospetta che `homePageFeatures.js` possa influenzare la navbar su `index.html`. Sono emersi nuovi punti riguardanti la UX e la responsività della navbar e della homepage.

**Legenda Stati:**

* ✅ **COMPLETATO** (Task concluso e verificato)
* `[x]` **COMPLETATO** (Sub-task concluso)
* `[ ]` **DA FARE** (Task pianificato, non iniziato)
* `[P]` **IN PROGRESSO** (Task avviato)
* ⚠️ **ON HOLD** (Task sospeso o in attesa di dipendenze/decisioni)
* 🆕 **NUOVO** (Task introdotto in questa versione del devplan o durante la sessione)
* ➡️ **OBSOLETO** (Task il cui scopo è stato reso obsoleto o non più necessario)
* 🐞 **BUG** (Problema identificato da risolvere)
* 🤔 **INVESTIGARE** (Necessita di ulteriori analisi)

---

## 🎯 FASE 0: INFRASTRUTTURA E DEPLOYMENT 🎯

🆕 **Task INFRA-001: Migrazione Hosting su Firebase Hosting (se non già completata)**
* **Descrizione:** Valutare e completare la migrazione del sito da GitHub Pages a Firebase Hosting per sfruttare meglio l'integrazione con gli altri servizi Firebase (Auth, Firestore, Functions).
* `[ ]` **INFRA-001.1:** Revisionare la documentazione `firebaseHostingMigration.md` per i passi necessari.
* `[ ]` **INFRA-001.2:** Configurare il progetto Firebase per Firebase Hosting.
* `[ ]` **INFRA-001.3:** Aggiornare i build script/processi di deployment (se necessario) per puntare a Firebase Hosting.
* `[ ]` **INFRA-001.4:** Eseguire il deployment iniziale su Firebase Hosting.
* `[ ]` **INFRA-001.5:** Testare il sito su Firebase Hosting, inclusa la configurazione del dominio custom (se applicabile).
* `[ ]` **INFRA-001.6:** Aggiornare la documentazione del progetto con le nuove informazioni di hosting.
* **Nota:** Questo task era menzionato nella documentazione, lo reintegro formalmente. Verificare lo stato attuale.

---

## 🎯 FASE 1: STABILIZZAZIONE E DOCUMENTAZIONE (PRIORITÀ CRITICA) 🎯

**Task ANALYSIS-001.4 Follow-up (Priorità CRITICA): Implementare le raccomandazioni dell'analisi firestore.rules.**
* ✅ **ANALYSIS-001.4.1 / SEC-RULE-001:** Revisionare e restringere l'accesso in lettura a `/userProfiles/{userId}`.
    * `[x]` (Tutti i sub-task completati)
* ⚠️ **ANALYSIS-001.4.2 / SEC-RULE-002:** Implementare validazione completa per `externalLinks` negli aggiornamenti del profilo utente. (ON HOLD / DECISIONE PRESA)
* ➡️ **ANALYSIS-001.4.3 / SEC-RULE-003:** Mettere in sicurezza meccanismo `commentCount`. (OBSOLETO)
* ➡️ **ANALYSIS-001.4.4 / SEC-RULE-004:** Reintrodurre validazione chiavi `userIssues`. (OBSOLETO)
* ✅ **ANALYSIS-001.4.5:** Risolto problema caricamento `firestore.rules` in emulatore.

✅ **Task SCHEMA-001: Aggiornare `firestore-schema.md` (Priorità ALTA)**
* `[x]` (Tutti i sub-task completati)

---

## 💈 TASK NAVBAR (PRIORITÀ CRITICA) 💈 (Precedentemente "NUOVO TASK NAVBAR")

**Task NAV.1: Refactoring Completo Funzionalità e UI Navbar**
* **Descrizione:** Revisionare e aggiornare la funzionalità, l'aspetto e la coerenza della navbar principale.
* `[P]` **NAV.1.1 (Funzionalità):**
    * ✅ **NAV.1.1.1:** Risolvere bug: pulsante logout non funzionante in versione desktop.
    * `[P]` **NAV.1.1.2:** Assicurare che tutti i pulsanti (Login, Registrazione, Profilo, link sezioni specifiche) siano sempre presenti, visibili e funzionanti correttamente in base allo stato dell'utente (ospite, loggato, admin) su tutte le pagine HTML.
        * `[x]` **NAV.1.1.2.A (Visibilità `userDisplayName`):** Corretta la visibilità di `userDisplayName` per utente loggato in `loadHeaderUserProfileDisplay`.
        * `[P]` **NAV.1.1.2.B (Visibilità Logout Utente Non Autenticato - `index.html`):** Il pulsante logout (`#logoutButton`) risulta ancora visibile per utenti non autenticati specificamente su `index.html`, nonostante `#userProfileContainer` (ora correttamente strutturato in HTML) riceva `display: none`.
            * 🤔 **NAV.1.1.2.B.1:** Investigare potenziale influenza di `homePageFeatures.js` o altri script specifici di `index.html` che potrebbero modificare la visibilità degli elementi della navbar dopo l'inizializzazione di `main.js`.
            * `[ ]` **NAV.1.1.2.B.2:** Verificare se `updateHeaderAuthContainersVisibility` viene chiamata più volte o se il suo effetto viene sovrascritto su `index.html`.
    * `[ ]` **NAV.1.1.3:** Verificare e correggere la logica di popolamento dinamico dei link utente (profilo, logout) e dei link admin (se presenti in navbar) nel menu desktop e mobile.
* `[ ]` **NAV.1.2 (Layout Icone e Testo):**
    * `[ ]` **NAV.1.2.1:** Rivedere e ottimizzare la disposizione e lo stile delle icone e del testo per i link nella navbar (sia desktop che mobile) per massima chiarezza, coerenza visiva e accessibilità (es. `title` attributes).
    * `[ ]` **NAV.1.2.2:** Assicurare che i pulsanti solo-icona siano correttamente dimensionati e che le icone siano centrate.
    * 🆕 `[ ]` **NAV.1.2.3 (Miglioramento UX Link Profilo):** Valutare rimozione di `a#profileNavIconLink` e rendere `img#headerUserAvatar` il link cliccabile per la pagina profilo. Include aggiunta event listener a `img#headerUserAvatar` (o contenitore) per reindirizzamento e stile `cursor: pointer`.
    * 🆕 `[ ]` **NAV.1.2.4 (Differenziazione Icone Login/Logout):** Se necessario, valutare modifica icone `login`/`logout` per maggiore distinguibilità (bassa priorità).
    * 🆕 `[P]` **NAV.1.2.5 (Layout Header Mobile):** Riorganizzare layout icone utente (`#userProfileContainer` e figli) e `themeToggleBtn` su mobile.
        * `[ ]` **NAV.1.2.5.A:** Le icone utente (notifiche, avatar, profilo, logout) e il toggle tema dovrebbero apparire in riga, sotto il titolo "asyncDonkey.io", allineate a sinistra.
        * `[ ]` **NAV.1.2.5.B:** Il pulsante hamburger (`#navbarToggler`) dovrebbe essere allineato a destra, sulla stessa "riga virtuale" delle icone utente.
        * (Attualmente le icone di `#userProfileContainer` appaiono in colonna a destra del titolo su mobile).
* `[ ]` **NAV.1.3 (Struttura Link e Dropdown):**
    * `[ ]` **NAV.1.3.1:** Rivedere quali sezioni/pagine sono accessibili direttamente dalla navbar e quali tramite il dropdown "Community".
    * `[ ]` **NAV.1.3.2:** Assicurare il corretto funzionamento e l'aspetto del dropdown "Community" sia su desktop che su mobile.
    * `[ ]` **NAV.1.3.3:** Garantire che i link "Scrivi Articolo" (`#navWriteArticleDropdown`) e "Contribuisci" siano visibili/nascosti correttamente in base allo stato di login e ai permessi.

---

## 🐞 BUG TRACKING 🐞

* 🆕 `[ ]` **BUG-NAV-RESP-001: Scroll orizzontale homepage (`index.html`) su mobile post-login.**
    * **Descrizione:** Dopo il login, la homepage su mobile richiede uno scroll orizzontale. Probabilmente causato dagli elementi aggiuntivi nella navbar (`#userProfileContainer`) che non vengono gestiti correttamente dal CSS responsive.

---

## 💅 MIGLIORAMENTI STRUTTURALI E UI/UX 💅

✅ **Task CSS-REFACTOR-001: Refactoring CSS con SCSS (Priorità ALTA)**
* `[x]` (Tutti i sub-task completati)

✅ **Task UI-FIX-001: Correzione Visualizzazione Dati Utente in Mini-Leaderboards (Priorità ALTA)**
* `[x]` (Tutti i sub-task completati)

✅ **Task D.9: Migliorare UX per Utente Non Registrato. (Priorità MEDIA)**
* `[x]` (Tutti i sub-task completati eccetto D.9.5)
    * `[ ]` **D.9.5 (Coerenza Modali e Notifiche):** Verificare la presenza e il funzionamento dei modali di login su tutte le pagine rilevanti. Assicurare che l'header delle notifiche sia consistente. (Priorità MEDIA-BASSA)

🆕 **Task UI-ICON-UPDATE-001: Aggiornamento Icone con Material Symbols (Priorità BASSA)**
* `[x]` **UI-ICON-UPDATE-001.1 (Upvote Issue):** Completato.
* `[x]` **UI-ICON-UPDATE-001.2 (Contribute.html Headers):** Completato.
* `[ ]` **UI-ICON-UPDATE-001.3 (Altre Sezioni):** Valutare altre aree del sito per aggiornamenti icone.

🆕 **Task UI-GB-STYLE-001: Rivedere stile commenti nel Guestbook (Priorità MEDIA-BASSA)**
* `[ ]` Analizzare CSS attuale per `.comment-item` in `scss/_comments.scss`.
* `[ ]` Proporre e implementare miglioramenti per leggibilità, spaziatura, e coerenza visiva.
* `[ ]` Testare su diverse risoluzioni.

---

## 🔧 TECHNICAL DEBT & REFACTORING (Legacy) 🔧
➡️ **Task TECH-DEBT-001: Unificare Sistemi di Gestione Commenti.** (OBSOLETO)

---

## 📚 PIANO DI SVILUPPO INTEGRATO (Stato Attuale & Funzionalità Esistenti) 📚

### Sezione A: Gestione Contributi e Moderazione 🖋️
* `[x]` A.4.2.6.A (Admin UI): Textarea per `rejectionReason`.
* **Task A.5: Sistema di Notifiche In-App (Base).**
    * `[x]` (Funzionalità base pannello e pagina "Tutte le Notifiche" COMPLETATE)
    * `[x]` Corretta struttura HTML per `notificationBellContainer` e `notification-panel` in `index.html` header.
    * `⚠️ [ON HOLD]` **Sub-task A.5.5: Notifiche per Interazioni Sociali Avanzate.** (Legate a KOD)

### Sezione AUTH: Gestione Autenticazione e Profilo Utente ✨👤

**🆕 Task PROF.1: Risoluzione Problemi e Miglioramenti Pagina Profilo (`profile.html`)** (Derivato da feedback utente)
* `[ ]` 🐞 **PROF.1.1 (Bug Mobile - Stato d'Animo):** Il campo per aggiornare lo "Stato d'Animo" non compare su mobile. (Priorità ALTA)
* `[ ]` **PROF.1.2 (Layout Riconoscimenti - Desktop & Mobile):** (Priorità MEDIA)
    * `[ ]` Correggere allineamento attuale dei badge (spostati a destra).
    * `[ ]` Valutare/implementare sezione dedicata per i badge (es. griglia di card) per migliore presentazione.
* `[ ]` **PROF.1.3 (Visibilità Riconoscimenti Profilo Pubblico):** La sezione dei riconoscimenti (badge) non è visibile quando si visualizza il profilo di un altro utente. (Priorità MEDIA)
* `[ ]` **PROF.1.4 (Layout Generale Pagina Profilo):** Rivedere il layout generale di `profile.html` per migliorare organizzazione e presentazione. (Priorità MEDIA)

**🆕 Task FUNC.1 (Revisione 2): Richiesta Cambio Nickname via Modale con Feedback Dettagliato e Notifiche Admin/Utente** (Priorità MEDIA)
* **Descrizione:** Implementare funzionalità in `profile.html` per richiedere cambio nickname agli admin, con feedback chiaro sullo stato della richiesta e notifiche.
* `[ ]` **FUNC.1.1 (UI Profilo):** Aggiungere icona e modale in `profile.html`.
* `[ ]` **FUNC.1.2 (Modale Richiesta Nickname - Logica Visualizzazione Dinamica):** Gestire stati: Iniziale, Richiesta Inviata, Nickname Cambiato di Recente (con calcolo giorni rimanenti per 90gg).
* `[ ]` **FUNC.1.3 (Logica Invio e Gestione Richiesta):** Validazione, creazione documento in `/nicknameChangeRequests`, update `userProfiles.lastNicknameRequestTimestamp`, controllo intervallo 90 giorni, toast feedback.
* `[ ]` **FUNC.1.4 (Notifiche):**
    * `[ ]` Notifica all'utente per approvazione/rifiuto (via Cloud Function su update richiesta).
    * `[ ]` (Opzionale/Futuro) Notifica automatica agli Admin alla creazione di una richiesta.
* `[ ]` **FUNC.1.5 (Gestione Admin nel Pannello):** Visualizzazione richieste, possibilità di segnare come "processata", infobox per procedura manuale cambio nickname.

* **Task AUTH.3: Miglioramenti Funzionali Pagina Profilo Utente (`profile.html`)**
    * `[x]` Mini-Bio Utente (AUTH.3.4).
    * `[x]` Link Esterni (AUTH.3.2).
    * `[x]` Visualizzazione Badge/Riconoscimenti Utente (Base, ma vedi PROF.1.2 e PROF.1.3 per problemi).
    * `[ ]` Sub-task AUTH.3.2.2 (Miglioramento Visivo Link Esterni): Anteprime/icone sito (Priorità MEDIA-BASSA).
    * **Sub-task AUTH.3.4 (Opzionale/Idee Future):**
        * `[ ]` Contatori Semplici (Data registrazione). (Priorità BASSA)
        * `[ ]` Sub-task AUTH.3.4.B.5 (10 Articoli Pubblicati): Tracciamento e badge (Priorità MEDIA-BASSA).
    * ➡️ **Sub-task AUTH.3.5: Articoli Preferiti / Segnalibri.** (OBSOLETO)
    * **Sub-task AUTH.3.6: Miglioramenti Visivi Nickname.** (Priorità MEDIA)
        * `[ ]` Sub-task AUTH.3.6.1: Nickname Dinamico - Glitchzilla Effect.
        * ✅ **Sub-task AUTH.3.6.2: Nickname Dinamico - Icona Autore.** (Completato)
    * ➡️ **Sub-task AUTH.3.7: Sistema di Amicizie/Followers.** (OBSOLETO)

### Sezione C: Funzionalità Specifiche Giochi/Piattaforma 🎮 & Contenuti Esistenti
* ✅ **Task C.1: Gestione Avatar Utente Personalizzato.**
* **Task C.2: Donkey Runner (Gioco Esistente)**
    * `[x]` C.2.4 (Donkey Runner): Leggibilità testi e usabilità form fullscreen.
    * `[ ]` Task C.2.8 (Donkey Runner): Risolvere problemi file audio mancanti (`game_over.mp3`, `shield_block.mp3`). (Priorità BASSA)
* ✅ **Task C.3: Miglioramenti Leaderboard & Info Glitchzilla** (Priorità MEDIA - Parzialmente Completato)
    * `[x]` Avatar aggiornati e performanti sulla Leaderboard (REGRESS-004).
    * `[x]` Pulsante refresh stilizzato con icona (D.LEADERBOARD-UX.1).
    * `[x]` Responsività base tabella (scroll orizzontale, colonna Data nascosta su mobile) (D.LEADERBOARD-UX.2 parziale).
    * `[x]` Evidenziazione utente loggato.
    * `[x]` Indicatore "Glitchzilla Debunked!" con icona animata.
    * `[ ]` (Restante da C.3) Valutare ulteriori miglioramenti funzionali o di UI specifici per "Info Glitchzilla" se non coperti.
* **Task C.5: Migliorare UI/UX di Donkey Runner Game** (Priorità MEDIA-BASSA).
    * _Da definire focus specifico_
* ➡️ **Task C.NEW_FEATURE_HP_ACTIVITY:** (SUPERSEDED)

### Sezione D: Miglioramenti UI/UX e Ottimizzazioni Generali ✨
* `[x]` Correzione ESLint `showConfirmationModal` in `js/profile.js`.
* `[x]` Task D.3.B.6: Revisionare e aggiornare README.md.
* `[ ]` Sub-task D.1.A.1: Aggiungere notifiche toast per conferma/errore like (su azioni di like/unlike *effettive* degli utenti loggati). (Priorità MEDIA-BASSA).
* ➡️ **Task D.UI-HP-FEATURED:** (SUPERSEDED)
* **Task D.LEADERBOARD-UX: Migliorare UI/UX della Leaderboard**
    * ✅ **D.LEADERBOARD-UX.1:** Stilizzare il pulsante di refresh della leaderboard. (COMPLETATO)
    * ➡️ **D.LEADERBOARD-UX.2:** Verificare e migliorare la responsività della tabella dei punteggi. (OBSOLETO - Sostituito da fix parziali e valutazione)
    * ➡️ **D.LEADERBOARD-UX.3:** Progettare/implementare visualizzazione compatta/espandibile per le righe. (OBSOLETO)

### Sezione Sicurezza & Stabilità (Derivata da ANALYSIS-001.4) 🛡️
* ✅ **Task ANALYSIS-001.4: Analisi storage.rules e firestore.rules.** (ANALISI COMPLETATA)

### Sezione E: Ricerca e Sviluppo a Lungo Termine 🔬📈
* ✅ **Task E.4: Adozione e Implementazione Cloud Functions.** (COMPLETATO)

### Sezione F: Fase di Perfezionamento Finale (Polish) 💅🎨
* `[x]` F.2.4.3.A.1 (Icone Like/Commenti Homepage).
* `[x]` F.2.4.3.A.2 (Icone Portal Card Homepage).

---

## ✅ TASK COMPLETATI RECENTEMENTE (Sessione Corrente Inclusa) ✅

* Task REGRESS-001, REGRESS-002, TEXT-001, REGRESS-003.4, (Da ANALYSIS-001), REGRESS-NAV-AVATAR-001, REGRESS-003.3, REGRESS-003.1 & REGRESS-003.2, C.1 / REGRESS-003.5, REGRESS-004, REGRESS-005.
* Task A.5 (Notifiche In-App via Cloud Functions) - FUNZIONALITÀ BASE COMPLETATE.
* Task ANALYSIS-001.4 (Analisi `storage.rules` e `firestore.rules`) - ANALISI COMPLETATA.
* Task UI-FIX-001: Correzione Visualizzazione Dati Utente in Mini-Leaderboards.
* Task CSS-REFACTOR-001: Refactoring CSS con SCSS.
* ANALYSIS-001.4.5: Risolto problema caricamento `firestore.rules` in emulatore.
* SCHEMA-001: Aggiornato `firestore-schema.md`.
* D.9 (Parziale): Migliorata UX Utente Non Registrato.
* UI-ICON-UPDATE-001 (Parziale): Aggiornate icone Upvote e Headers in `contribute.html`.
* D.9.6 (Messaggio Interattivo Contribute - Form Invio Issue).
* AUTH.3.6.2 (Icona Autore accanto al Nickname).
* C.3 / D.LEADERBOARD-UX.1 (Pulsante Refresh Leaderboard).
* C.3 / D.LEADERBOARD-UX.2 parziale (Responsività base Leaderboard).
* C.3 (Highlight Utente Loggato in Leaderboard).
* C.3 (Indicatore "Glitchzilla Debunked!" in Leaderboard con animazione).
* ✅ **NAV.1.1.1:** Risolto bug pulsante logout desktop.
* ✅ Corretto errore di export `db` in `main.js`.
* ✅ Corretta struttura HTML `userProfileContainer` in `index.html` (annidamento).
* ✅ Corretta visibilità `userDisplayName` per utente loggato.

---
// DevPlan v4.0.3 - Aggiornato e firmato da AthenaDev 🏛️✨
// Focus prossima sessione: INFRA-001 (Verifica stato migrazione hosting), NAV.1.1.2.B (Visibilità Logout `index.html`), BUG-NAV-RESP-001, NAV.1.2.5 (Layout Mobile Header).