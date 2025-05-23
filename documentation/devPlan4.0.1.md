# DEVELOPMENT PLAN (v4.0.4 - Rifiniture Navbar & Notifiche - Athena Session Update) 🚀

**Data Ultimo Aggiornamento:** 23 Maggio 2025 (Athena Update)
**Visione Progetto:** Consolidare e stabilizzare la piattaforma esistente, migliorando la documentazione, la sicurezza, l'UX e risolvendo il debito tecnico. Le funzionalità attuali, come Donkey Runner e il sistema di articoli, saranno mantenute e ottimizzate, con un focus sul miglioramento dell'esperienza utente per le notifiche.

**Stato Generale del Progetto:**
Progressi significativi sono stati fatti sulla stabilizzazione della navbar, inclusa la correzione di bug critici di visibilità e layout responsive. La migrazione a Firebase Hosting è stata avviata e configurata localmente. Il focus si sposta ora sulle rifiniture del sistema di notifiche e sul completamento della migrazione dell'hosting.

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
- `[x]` **INFRA-001.4 (Test Locali):** Eseguire test con `firebase emulators:start` per validare la configurazione di hosting. (Precedentemente INFRA-001.5 per la parte locale)
- `[ ]` **INFRA-001.5 (Deploy Staging):** Distribuire su un canale di anteprima (`firebase hosting:channel:deploy NOME_CANALE`).
- `[ ]` **INFRA-001.6 (Test Staging):** Eseguire test approfonditi sul canale di anteprima.
- `[ ]` **INFRA-001.7 (Dominio Custom):** Configurare il dominio personalizzato (se applicabile).
- `[ ]` **INFRA-001.8 (Go-Live):** Eseguire il deployment in produzione (`firebase deploy --only hosting`).
- `[ ]` **INFRA-001.9 (Post-GoLive):** Aggiornare la documentazione del progetto con le nuove informazioni di hosting e configurare CI/CD.
- **Nota:** Questo task è stato dettagliato e i primi passi sono stati completati con successo.

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

**Task NAV.1: Refactoring Completo Funzionalità e UI Navbar**

- **Descrizione:** Revisionare e aggiornare la funzionalità, l'aspetto e la coerenza della navbar principale.
- `[P]` **NAV.1.1 (Funzionalità):**
    - ✅ **NAV.1.1.1:** Risolvere bug: pulsante logout non funzionante in versione desktop.
    - ✅ **NAV.1.1.2 (Visibilità Pulsanti Auth):** Assicurare che tutti i pulsanti (Login, Registrazione, Profilo, Logout) siano sempre presenti e visibili/nascosti correttamente in base allo stato dell'utente su tutte le pagine HTML.
        - `[x]` **NAV.1.1.2.A (Visibilità `userDisplayName`):** Corretta la visibilità di `userDisplayName` per utente loggato.
        - ✅ **NAV.1.1.2.B (Visibilità Logout Utente Non Autenticato - `index.html`):** Risolto il bug per cui il pulsante logout era visibile per utenti non autenticati su `index.html` (causa: errore strutturale HTML in `index.html`).
            - ➡️ **NAV.1.1.2.B.1:** Investigare potenziale influenza di `homePageFeatures.js` (OBSOLETO - Ipotesi errata).
            - ➡️ **NAV.1.1.2.B.2:** Verificare se `updateHeaderAuthContainersVisibility` viene chiamata più volte (OBSOLETO - Causa identificata nell'HTML).
    - `[ ]` **NAV.1.1.3:** Verificare e correggere la logica di popolamento dinamico dei link utente (profilo, logout) e dei link admin (se presenti in navbar) nel menu desktop e mobile.
- `[P]` **NAV.1.2 (Layout Icone e Testo):**
    - `[ ]` **NAV.1.2.1:** Rivedere e ottimizzare la disposizione e lo stile delle icone e del testo per i link nella navbar (sia desktop che mobile) per massima chiarezza, coerenza visiva e accessibilità (es. `title` attributes).
    - `[ ]` **NAV.1.2.2:** Assicurare che i pulsanti solo-icona siano correttamente dimensionati e che le icone siano centrate.
    - 🆕 `[ ]` **NAV.1.2.3 (Miglioramento UX Link Profilo):** Valutare rimozione di `a#profileNavIconLink` e rendere `img#headerUserAvatar` il link cliccabile per la pagina profilo. Include aggiunta event listener a `img#headerUserAvatar` (o contenitore) per reindirizzamento e stile `cursor: pointer`.
    - 🆕 `[ ]` **NAV.1.2.4 (Differenziazione Icone Login/Logout):** Se necessario, valutare modifica icone `login`/`logout` per maggiore distinguibilità (bassa priorità).
    - 🆕 ✅ **NAV.1.2.5 (Layout Header Mobile):** Riorganizzare layout icone utente (`#userProfileContainer` e figli) e `themeToggleBtn` su mobile.
        - `[x]` **NAV.1.2.5.A:** Le icone utente e il toggle tema appaiono in riga, sotto il titolo, allineate a sinistra. (COMPLETATO con fix HTML e CSS)
        - `[x]` **NAV.1.2.5.B:** Il pulsante hamburger (`#navbarToggler`) è allineato a destra, sulla stessa "riga virtuale" del titolo. (COMPLETATO con fix HTML e CSS)
        - ✨ **NAV.1.2.5.C (Centraggio Hamburger):** Allineare verticalmente l'icona hamburger su mobile. (COMPLETATO)
- `[ ]` **NAV.1.3 (Struttura Link e Dropdown):**
    - `[ ]` **NAV.1.3.1:** Rivedere quali sezioni/pagine sono accessibili direttamente dalla navbar e quali tramite il dropdown "Community".
    - ✅ **NAV.1.3.2 (Dropdown Community Desktop):** Assicurare il corretto funzionamento e l'aspetto del dropdown "Community" su desktop. (RISOLTA REGRESSIONE)
    - `[ ]` **NAV.1.3.3 (Dropdown Community Mobile):** Assicurare il corretto funzionamento e l'aspetto del dropdown "Community" su mobile.
    - `[ ]` **NAV.1.3.4:** Garantire che i link "Scrivi Articolo" (`#navWriteArticleDropdown`) e "Contribuisci" siano visibili/nascosti correttamente in base allo stato di login e ai permessi.

---

## 🐞 BUG TRACKING 🐞

- ➡️ **BUG-NAV-RESP-001: Scroll orizzontale homepage (`index.html`) su mobile post-login.** (OBSOLETO - Risolto come side-effect del fix HTML per NAV.1.1.2.B).

---

## ✨ TASK DI RIFINITURA E NUOVE FUNZIONALITÀ (Derivati dalla sessione) ✨

🆕 **Task NOTIF.1: Miglioramento UX Pannello Notifiche Popup**

- **Descrizione:** Ottimizzare l'interazione e la presentazione del pannello notifiche accessibile dalla campanella.
- `[ ]` **NOTIF.1.1 (Rimozione Notifica Lette dal Pannello):** Quando una notifica nel pannello popup viene cliccata:
    - `[ ]` **NOTIF.1.1.A:** Lo stato della notifica su Firestore deve essere impostato su `read: true`.
    - `[ ]` **NOTIF.1.1.B:** La notifica deve essere rimossa dinamicamente dalla lista nel pannello popup.
    - `[ ]` **NOTIF.1.1.C:** La notifica (anche se letta) deve rimanere visibile nella pagina `all-notifications.html`.
- `[ ]` **NOTIF.1.2 (Gestione Pannello Vuoto e Footer):**
    - `[ ]` **NOTIF.1.2.A:** Se non ci sono notifiche attive da mostrare nel pannello popup, il messaggio "Nessuna nuova notifica al momento." (`#no-notifications-placeholder`) deve essere visibile.
    - `[ ]` **NOTIF.1.2.B (Link "Vedi tutte" Sempre Visibile):** Il link/pulsante "Vedi tutte le notifiche" (`#view-all-notifications-link`) nel footer del pannello popup deve essere **sempre visibile**.
- ✨ **NOTIF.1.3 (Posizionamento Pannello Notifiche Mobile):** Su mobile, il pannello notifiche (`#notification-panel`) deve aprirsi centrato orizzontalmente rispetto allo schermo/viewport. (COMPLETATO)

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

🆕 **Task UI-GB-STYLE-001: Rivedere stile commenti nel Guestbook (Priorità MEDIA-BASSA)**

- `[ ]` Analizzare CSS attuale per `.comment-item` in `scss/_comments.scss`.
- `[ ]` Proporre e implementare miglioramenti per leggibilità, spaziatura, e coerenza visiva.
- `[ ]` Testare su diverse risoluzioni.

---

## 🔧 TECHNICAL DEBT & REFACTORING (Legacy) 🔧

➡️ **Task TECH-DEBT-001: Unificare Sistemi di Gestione Commenti.** (OBSOLETO)

---

## 📚 PIANO DI SVILUPPO INTEGRATO (Stato Attuale & Funzionalità Esistenti) 📚

### Sezione A: Gestione Contributi e Moderazione 🖋️

- `[x]` A.4.2.6.A (Admin UI): Textarea per `rejectionReason`.
- **Task A.5: Sistema di Notifiche In-App (Base).**
    - `[x]` (Funzionalità base pannello e pagina "Tutte le Notifiche" COMPLETATE)
    - `[x]` Corretta struttura HTML per `notificationBellContainer` e `notification-panel` in `index.html` header. (Verificato durante fix navbar)
    - `⚠️ [ON HOLD]` **Sub-task A.5.5: Notifiche per Interazioni Sociali Avanzate.** (Legate a KOD - Ora potenzialmente integrabili con NOTIF.2)

### Sezione AUTH: Gestione Autenticazione e Profilo Utente ✨👤

**🆕 Task PROF.1: Risoluzione Problemi e Miglioramenti Pagina Profilo (`profile.html`)** (Derivato da feedback utente)

- `[ ]` 🐞 **PROF.1.1 (Bug Mobile - Stato d'Animo):** Il campo per aggiornare lo "Stato d'Animo" non compare su mobile. (Priorità ALTA)
- `[ ]` **PROF.1.2 (Layout Riconoscimenti - Desktop & Mobile):** (Priorità MEDIA)
    - `[ ]` Correggere allineamento attuale dei badge (spostati a destra).
    - `[ ]` Valutare/implementare sezione dedicata per i badge (es. griglia di card) per migliore presentazione.
- `[ ]` **PROF.1.3 (Visibilità Riconoscimenti Profilo Pubblico):** La sezione dei riconoscimenti (badge) non è visibile quando si visualizza il profilo di un altro utente. (Priorità MEDIA)
- `[ ]` **PROF.1.4 (Layout Generale Pagina Profilo):** Rivedere il layout generale di `profile.html` per migliorare organizzazione e presentazione. (Priorità MEDIA)

**🆕 Task FUNC.1 (Revisione 2): Richiesta Cambio Nickname via Modale con Feedback Dettagliato e Notifiche Admin/Utente** (Priorità MEDIA)

- **Descrizione:** Implementare funzionalità in `profile.html` per richiedere cambio nickname agli admin, con feedback chiaro sullo stato della richiesta e notifiche.
- `[ ]` **FUNC.1.1 (UI Profilo):** Aggiungere icona e modale in `profile.html`.
- `[ ]` **FUNC.1.2 (Modale Richiesta Nickname - Logica Visualizzazione Dinamica):** Gestire stati: Iniziale, Richiesta Inviata, Nickname Cambiato di Recente.
- `[ ]` **FUNC.1.3 (Logica Invio e Gestione Richiesta):** Validazione, creazione documento in `/nicknameChangeRequests`, update `userProfiles.lastNicknameRequestTimestamp`, controllo intervallo 90 giorni, toast feedback.
- `[ ]` **FUNC.1.4 (Notifiche):**
    - `[ ]` Notifica all'utente per approvazione/rifiuto.
    - 💡 (Opzionale/Futuro) Notifica automatica agli Admin alla creazione di una richiesta (vedi NOTIF.2.2).
- `[ ]` **FUNC.1.5 (Gestione Admin nel Pannello):** Visualizzazione richieste, possibilità di segnare come "processata".

- **Task AUTH.3: Miglioramenti Funzionali Pagina Profilo Utente (`profile.html`)**
    - `[x]` Mini-Bio Utente (AUTH.3.4).
    - `[x]` Link Esterni (AUTH.3.2).
    - `[x]` Visualizzazione Badge/Riconoscimenti Utente (Base, ma vedi PROF.1.2 e PROF.1.3 per problemi).
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
    - `[ ]` Task C.2.8 (Donkey Runner): Risolvere problemi file audio mancanti (`game_over.mp3`, `shield_block.mp3`). (Priorità BASSA)
- ✅ **Task C.3: Miglioramenti Leaderboard & Info Glitchzilla** (Priorità MEDIA - Parzialmente Completato)
    - `[x]` Avatar aggiornati e performanti sulla Leaderboard (REGRESS-004).
    - `[x]` Pulsante refresh stilizzato con icona (D.LEADERBOARD-UX.1).
    - `[x]` Responsività base tabella (scroll orizzontale, colonna Data nascosta su mobile) (D.LEADERBOARD-UX.2 parziale).
    - `[x]` Evidenziazione utente loggato.
    - `[x]` Indicatore "Glitchzilla Debunked!" con icona animata.
    - `[ ]` (Restante da C.3) Valutare ulteriori miglioramenti funzionali o di UI specifici per "Info Glitchzilla" se non coperti.
- **Task C.5: Migliorare UI/UX di Donkey Runner Game** (Priorità MEDIA-BASSA).
    - _Da definire focus specifico_
- ➡️ **Task C.NEW_FEATURE_HP_ACTIVITY:** (SUPERSEDED)

### Sezione D: Miglioramenti UI/UX e Ottimizzazioni Generali ✨

- `[x]` Correzione ESLint `showConfirmationModal` in `js/profile.js`.
- `[x]` Task D.3.B.6: Revisionare e aggiornare README.md.
- `[ ]` Sub-task D.1.A.1: Aggiungere notifiche toast per conferma/errore like (su azioni di like/unlike _effettive_ degli utenti loggati). (Priorità MEDIA-BASSA).
- ➡️ **Task D.UI-HP-FEATURED:** (SUPERSEDED)
- **Task D.LEADERBOARD-UX: Migliorare UI/UX della Leaderboard**
    - ✅ **D.LEADERBOARD-UX.1:** Stilizzare il pulsante di refresh della leaderboard. (COMPLETATO)
    - ➡️ **D.LEADERBOARD-UX.2:** Verificare e migliorare la responsività della tabella dei punteggi. (OBSOLETO - Sostituito da fix parziali e valutazione)
    - ➡️ **D.LEADERBOARD-UX.3:** Progettare/implementare visualizzazione compatta/espandibile per le righe. (OBSOLETO)

### Sezione Sicurezza & Stabilità (Derivata da ANALYSIS-001.4) 🛡️

- ✅ **Task ANALYSIS-001.4: Analisi storage.rules e firestore.rules.** (ANALISI COMPLETATA)

### Sezione E: Ricerca e Sviluppo a Lungo Termine 🔬📈

- ✅ **Task E.4: Adozione e Implementazione Cloud Functions.** (COMPLETATO)

### Sezione F: Fase di Perfezionamento Finale (Polish) 💅🎨

- `[x]` F.2.4.3.A.1 (Icone Like/Commenti Homepage).
- `[x]` F.2.4.3.A.2 (Icone Portal Card Homepage).

---

## ✅ TASK COMPLETATI RECENTEMENTE (Sessione Corrente Inclusa) ✅

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
- ✅ **NAV.1.1.1:** Risolto bug pulsante logout desktop.
- ✅ Corretto errore di export `db` in `main.js`.
- ✅ Corretta struttura HTML `userProfileContainer` in `index.html` (annidamento) e successiva ristrutturazione dell'header per layout mobile.
- ✅ Corretta visibilità `userDisplayName` per utente loggato.
- ✅ **NAV.1.1.2.B (Visibilità Logout Utente Non Autenticato - `index.html`):** Risolto.
- ➡️ **BUG-NAV-RESP-001:** Risolto come side-effect di fix HTML.
- ✅ **NAV.1.2.5 (Layout Header Mobile):** Riorganizzato layout per corretto posizionamento su due righe (titolo/hamburger + controlli).
- ✅ **NAV.1.2.5.C (Centraggio Hamburger):** Allineato verticalmente l'icona hamburger su mobile.
- ✅ **NAV.1.3.2 (Dropdown Community Desktop):** Funzionalità ripristinata.
- ✅ **NAV.THEME-TOGGLER:** Funzionalità Theme Toggler ripristinata (desktop e mobile).
- ✨ **NOTIF.1.3 (Posizionamento Pannello Notifiche Mobile):** Centrato pannello rispetto alla viewport.

---

// DevPlan v4.0.4 - Canvas Markdown - AthenaDev 🏛️✨
// Prossimo focus: NOTIF.1.1 e NOTIF.1.2
