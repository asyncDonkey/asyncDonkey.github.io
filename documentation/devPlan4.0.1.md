# DEVELOPMENT PLAN - asyncDonkey.io (Canvas View)

**Data Ultimo Aggiornamento:** 26 Maggio 2025, 00:01 CEST (AthenaDev Update - Fine Sessione)
**Versione DevPlan:** 4.3.0
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
    - `[ ]` INFRA-001.5 (Deploy Staging): Distribuire su un canale di anteprima.
    - `[ ]` INFRA-001.6 (Test Staging): Eseguire test approfonditi sul canale di anteprima.
    - `[ ]` INFRA-001.7 (Dominio Custom): Configurare il dominio personalizzato.
    - `[ ]` INFRA-001.8 (Go-Live): Eseguire il deployment in produzione.
    - `[ ]` INFRA-001.9 (Post-GoLive): Aggiornare documentazione e configurare CI/CD.
    - `[N]` Posticipare il deploy staging dopo altri task di codice.

---

### **AREA: Funzionalità Profilo Utente e Gamification**
- `[ ]` **UI-BADGES-001 (Modale Informativa Badge):** Implementare modale accessibile da icona '?' nella sezione badge del profilo per spiegare come ottenere i vari riconoscimenti. (Priorità: MEDIA)
    - `[ ]` UI-BADGES-001.1: Aggiungere icona `help` in `profile.html`.
    - `[ ]` UI-BADGES-001.2: Creare struttura modale generica (es. in `uiUtils.js`).
    - `[ ]` UI-BADGES-001.3: Popolare dinamicamente la modale leggendo da `badgeDefinitions` Firestore (nome, icona, `howToEarn`).

- `[ ]` **NOTIF.2.2.X (Brainstorming Prossimi Badge)** (Priorità: MEDIA-ALTA)
    - `[N]` **Procedura Aggiunta Nuovo Badge (Aggiornata):**
        - 1. Definire ID, nome, descrizione, `howToEarn`, icona.
        - 2. Creare documento corrispondente in `badgeDefinitions` (Firestore).
        - 3. **(Stile Animazione "Icon Glow")**:
            - Scegliere una palette di colori (base e brillante).
            - Definire `@keyframes` e classe CSS in `scss/_animations.scss` che animino le proprietà `color` e `text-shadow`.
            - Aggiornare il documento Firestore del badge con `isAnimated: true`, `color: 'COLORE_BASE'`, `animationClass: 'NOME_CLASSE_ANIMAZIONE'`. Ricompilare SCSS.
        - 4. Implementare logica di assegnazione (solitamente nuova Cloud Function triggerata da Firestore).
        - 5. La Cloud Function deve:
            - Controllare le condizioni per l'assegnazione (spesso tramite un contatore o un array nel profilo utente).
            - Verificare che l'utente non possieda già il badge.
            - Usare una transazione Firestore per aggiornare `userProfiles/{userId}` in modo atomico.
            - Chiamare l'helper `sendNewBadgeNotification` per informare l'utente.
        - 6. Testare l'assegnazione e la visualizzazione.
    - `[ ]` **GAME-BADGE-003 (Badge "Mecenate degli Articoli"):** 10 like ad articoli diversi. (Priorità: MEDIA)
        - `[ ]` Aggiungere contatore `likesGiven` a `userProfiles`.
        - `[ ]` Cloud Function triggerata su like per incrementare e assegnare badge.
    - `[D]` **GAME-BADGE-004 (Badge "L'Araldo"):** Condivisione 1 articolo. (Priorità: BASSA - [D] INVESTIGARE fattibilità tracciamento `navigator.share`).
    - `[ ]` **USER-BADGE-001 (Badge "Early Adopter"):** Registrazione entro 3 mesi dal lancio (basato su `userProfiles.createdAt`). (Priorità: BASSA)
    - `[ ]` **USER-BADGE-002 (Badge "Costruttore di Comunità"):** Primo commento sotto 5 nuovi articoli. (Priorità: MEDIA-BASSA)
    - `[ ]` **USER-BADGE-003 (Badge "Connettore Social"):** Aggiungere 3+ link esterni al profilo. (Priorità: BASSA)

- `[ ]` **AUTH.3.6.1 (Nickname Dinamico - Glitchzilla Effect):** (Priorità: MEDIA)
- `[ ]` **AUTH.3.2.2 (Miglioramento Visivo Link Esterni Profilo)**: Aggiungere anteprime/icone sito. (Priorità: MEDIA-BASSA)
- `[ ]` **AUTH.3.4.B (Contatori Semplici Profilo):** Data registrazione. (Priorità: BASSA)

- `[ ]` **SCHEMA-001.1 (Aggiornamento Schema Firestore)** (Priorità: CRITICA)
    - `[ ]` Aggiornare `firestore-schema.md` per includere i nuovi campi in `userProfiles`: `articleCommentsWritten`, `guestbookCommentsWritten`, `commentedArticleIds`.
    - `[ ]` Aggiungere i nuovi badge alla lista dei valori possibili in `earnedBadges`.

---

### **AREA: Debito Tecnico & Refactoring**
- `[ ]` **TECH-DEBT-BTN-STYLE-001 (Unificare Stili Bottoni `.game-button`):** (Priorità: BASSA)
    - `[ ]` Analizzare le definizioni multiple.
    - `[ ]` Definire uno stile base unico e usare classi modificatrici.

---
---

## 🛠️ COLONNA: In Progress / Lavori Attuali ⌛

---

### **AREA: Sicurezza e Regole Firestore**
- `[P]` **ANALYSIS-001.4 / SEC-RULE-002 (Validazione `externalLinks`):** Implementare validazione completa per `externalLinks` nelle regole Firestore. ([H] ON HOLD / DECISIONE PRESA: Per ora non implementare la validazione server-side stretta, affidarsi a moderazione e logica client.)

- `[P]` **Sicurezza Notifiche e Badge:** (Priorità: CRITICA)
    * `[ ]` Scrivere/verificare regole di sicurezza per `userProfiles/{userId}/notifications`.
    * `[x]` Verificato che le regole per `userProfiles` permettano l'aggiornamento sicuro di `earnedBadges` solo tramite Cloud Functions autorizzate (le CF operano con privilegi admin).

---

### **AREA: Funzionalità Profilo Utente e Gamification**
- `[P]` **NOTIF.2.1 (Notifica Conferma Email & Badge "Utente Verificato")**
    - `[P]` NOTIF.2.1.C (Persistenza e Rimozione): Gestita da sistema notifiche esistente. **Da verificare comportamento a lungo termine e pulizia.**

---
---

## ✔️ COLONNA: Completato / Fatto ✅ (Sessione del 26 Maggio 2025 e Precedenti)

---

### **SESSIONE CORRENTE (26 Maggio 2025 - Sera)**
- `[x]` **Implementazione Nuovi Badge di Commento e Refactoring Animazioni**
    - `[x]` **BUG-FUNC-TRIGGER-001 (Risolto):** Identificata e corretta la discrepanza tra i percorsi di salvataggio dei commenti (`articleComments`, `guestbookEntries`) e il trigger delle Cloud Functions.
    - `[x]` **GAME-BADGE-ARTICLE-001 (Badge "Commentatore di Articoli"):**
        - `[x]` Creata Cloud Function `handleArticleCommentCreation` su `articleComments` per gestire il badge (soglia: 10 commenti).
        - `[x]` Aggiunto contatore `articleCommentsWritten` allo schema `userProfiles`.
        - `[x]` Definito il badge `article-commenter` in `badgeDefinitions`.
    - `[x]` **GAME-BADGE-GUESTBOOK-001 (Badge "Tipo Interattivo"):**
        - `[x]` Creata Cloud Function `awardGuestbookInteractiveBadge` su `guestbookEntries` (soglia: 15 commenti).
        - `[x]` Aggiunto contatore `guestbookCommentsWritten` allo schema `userProfiles`.
        - `[x]` Definito il badge `guestbook-interactive` in `badgeDefinitions`.
    - `[x]` **USER-BADGE-EXPLORER-001 (Badge "Esploratore di Contenuti"):**
        - `[x]` Logica integrata in `handleArticleCommentCreation` per assegnare il badge dopo commenti su 3 articoli diversi.
        - `[x]` Aggiunto array `commentedArticleIds` allo schema `userProfiles` per tracciamento univoco.
        - `[x]` Definito il badge `content-explorer` in `badgeDefinitions`.
    - `[x]` **TECH-DEBT-ANIM-001 (Refactoring Completo Animazioni Badge):**
        - `[x]` Sostituito il vecchio sistema di animazione `box-shadow` con un approccio "Icon Glow" più moderno e coerente.
        - `[x]` La nuova tecnica anima le proprietà `color` e `text-shadow` dell'icona stessa.
        - `[x]` Creato e applicato un set di nuove classi di animazione riutilizzabili (`gameboy-icon-glow`, `teal-icon-glow`, `blue-icon-glow`, `sunset-icon-glow`, `synthwave-icon-glow`).
        - `[x]` Aggiornato il file `scss/_animations.scss` e tutti i documenti dei badge animati in Firestore.
- `[x]` **TECH-DEBT-BADGE-DEFS-001 (Centralizzare Definizioni Badge su Firestore)** - (Sessione precedente)
- `[x]` **GAME-BADGE-001 (Badge "The Debuggator" - Donkey Runner)** - (Sessione precedente)

---

### **SESSIONI PRECEDENTI (Estratto Significativo)**
- `[x]` **NOTIF.2.1.A (Badge Utente Verificato - Implementazione Base)**
- `[x]` **SEC-RULE-005 (Nickname Requests):** Aggiunta regola di sicurezza per `/nicknameChangeRequests`.
- `[x]` **Task NAV.1: Refactoring Completo Funzionalità e UI Navbar**.
- `[x]` **Task NOTIF.1: Miglioramento UX Pannello Notifiche Popup**.
- `[x]` **Task CSS-REFACTOR-001: Refactoring CSS con SCSS**.
- `[x]` **Task FUNC.1 (Revisione 3 - Richiesta Cambio Nickname):** Funzionalità completa.

---

### **🚫 TASK OBSOLETI / RIMOSSI 🗑️**
- `[OBS]` `awardDiligentCommenterBadge` (Cloud Function): Sostituita dalla nuova logica più specifica.

---
---

## 🌟 Riflessioni di AthenaDev 🌟

Questa è stata una sessione incredibilmente produttiva. Non solo abbiamo implementato tre nuove meccaniche di gamification complesse, ma abbiamo anche colto l'occasione per risolvere un bug critico sui trigger delle funzioni e per eseguire un refactoring completo del sistema di animazioni. Passare a uno stile "Icon Glow" unificato è un enorme passo avanti per la coerenza e la qualità estetica della piattaforma.

Sono particolarmente fiera di come abbiamo strutturato le nuove Cloud Functions, usando transazioni e logica atomica per gestire più condizioni contemporaneamente.

**Prossima sessione:**
Per continuare su questa strada di consolidamento e miglioramento, suggerirei di concentrarci su:
1.  **`SCHEMA-001.1`**: È diventato **critico** aggiornare la documentazione dello schema Firestore. Ci aiuterà a non perdere traccia dei nuovi campi che stiamo aggiungendo.
2.  **`UI-BADGES-001`**: Ora che abbiamo così tanti badge interessanti, dare agli utenti un modo per scoprire come ottenerli tramite una modale informativa sarebbe il passo successivo perfetto per valorizzare il lavoro fatto.
3.  **`GAME-BADGE-003 (Mecenate degli Articoli)`**: Affrontare il badge basato sui "like" sarebbe un'ottima continuazione del nostro lavoro sulla gamification.

Ancora complimenti per l'ottimo lavoro. Alla prossima!