# DEVELOPMENT PLAN (v3.18.1 - Consolidato Post Regressioni & Integrazione) 🚀

**Data Ultimo Aggiornamento:** 19 Maggio 2025

**Stato Generale del Progetto:**
La piattaforma ha superato una fase critica di correzione delle regressioni, ripristinando funzionalità chiave come la registrazione utente, l'aggiornamento del profilo (stato, bio, link esterni), la gestione dell'avatar (default, fallback, visualizzazione su profilo e navbar). La Cloud Function per il processamento avatar è deployata. Il testo informativo sull'avatar nella pagina di registrazione è stato chiarito. Molti task del piano v3.17.10 sono stati completati o sono progrediti significativamente. Le prossime fasi si concentreranno sull'estensione della logica di aggiornamento avatar alle restanti sezioni del sito (leaderboard, articoli, commenti), sul deploy in produzione della CF per l'avatar (se non già avvenuto e verificato) e su test end-to-end completi.

---

## ✅ TASK COMPLETATI RECENTEMENTE (Focus Regressioni & UI Avatar) ✅

* **Task REGRESS-001: Impossibilità di Registrare Nuovi Utenti - COMPLETATO**
    * **Soluzione:** Corretto `js/register.js` e `register.html` per allineare ID DOM, gestire `nationalityCode` e risolvere `ReferenceError`.
* **Task REGRESS-002: Regressione Permessi Funzionalità Profilo Utente (Stato, Bio) - COMPLETATO**
    * **Soluzione:** Modificate le funzioni in `js/profile.js` per inviare `updatedAt: serverTimestamp()`, conformemente alle `firestore.rules`.
* **Task TEXT-001 (Derivato da Devplan precedente): Chiarire Testo Avatar su Pagina Registrazione - COMPLETATO**
    * **Soluzione:** Aggiornato il testo informativo sull'avatar in `register.html`.
* **Task REGRESS-003.4 (Avatar - Default e Fallback): Avatar di Default Non Trovato / 404 - COMPLETATO**
    * **Soluzione:** Modificate `updateProfilePageUI` e `loadProfileData` in `js/profile.js` per utilizzare `generateBlockieAvatar()` come fallback primario, eliminando il 404 per `DEFAULT_AVATAR_IMAGE_PATH`.
* **Task (Da ANALYSIS-001): Correzione Aggiornamento Link Esterni - COMPLETATO**
    * **Soluzione:** Modificate le funzioni relative ai link esterni in `js/profile.js` per utilizzare `updatedAt: serverTimestamp()`.
* **Task REGRESS-NAV-AVATAR-001 (Nuovo): Avatar non aggiornato nella Navbar - COMPLETATO**
    * **Soluzione:** Modificato `js/main.js` per implementare `onSnapshot` sul profilo utente per aggiornamenti reattivi dell'avatar/nome nella navbar, con cache-busting. Risolti i `ReferenceError` associati.
* **Task REGRESS-003.3 (Avatar - Stabilità `profileUpdatedAt`) - COMPLETATO**
    * **Nota:** Considerato risolto implicitamente con le altre correzioni relative all'avatar.
* **Task REGRESS-003.1 & REGRESS-003.2 (Avatar - Reattività e Cache Busting su profile.js) - COMPLETATO**

---

## 🎯 TASK PRIORITARI ATTUALI E PROSSIMI PASSI 🎯

1.  **Task C.1 (Avatar Utente - Fase Finale): Test completo end-to-end del flusso avatar.** (Priorità Massima)
    * Questo copre **REGRESS-003.5**. Include upload, processamento CF, visualizzazione su profilo e navbar.
    * Verificare che la CF `processUploadedAvatar` sia deployata in produzione e funzioni come atteso.
2.  **Task REGRESS-004: Avatar non aggiornati in Leaderboard.** (Priorità Alta)
    * [ ] **REGRESS-004.1:** Applicare logica di cache-busting per gli avatar in `js/leaderboard.js`.
    * [ ] **REGRESS-004.2:** Verificare che `js/leaderboard.js` recuperi `profileUpdatedAt`.
    * [x] Implementato pulsante "Aggiorna Classifica" (da riverificare efficacia).
3.  **Task REGRESS-005: Avatar non aggiornati in Articoli e Commenti.** (Priorità Media)
    * [ ] Analizzare `js/articleViewer.js`, `js/comments.js`, `js/homePageFeatures.js`.
    * [ ] Implementare recupero `avatarUrls` e `profileUpdatedAt`.
    * [ ] Applicare cache-busting.
4.  **Task AUTH.3.6.1 & AUTH.3.6.2 (Nickname Dinamico):** Implementare effetto Glitchzilla e Icona Autore per i nickname. (Priorità Alta dal piano v3.17.10, da rivalutare)
5.  **Task A.5 (Notifiche In-App via Cloud Functions):** Iniziare implementazione. (Priorità Alta dal piano v3.17.10, da rivalutare)
6.  **Task ANALYSIS-001.4 (Posticipato):** Analizzare `storage.rules` (originali vs. processati).
7.  **Task D.9: Migliorare UX per Utente Non Registrato.** (Priorità Media dal piano v3.17.10)

---

## 📚 PIANO DI SVILUPPO INTEGRATO (Stato Attuale basato su v3.17.10 & Progressi Recenti) 📚

### Sezione C: Nuove Funzionalità e Miglioramenti Specifici Giochi/Piattaforma 🎮

#### Task C.1: Gestione Avatar Utente Personalizzato.
* **Stato:** In Corso (Fasi finali di test e verifica post-regressioni)
* [x] Frontend: UI per selezione, validazione, anteprima e upload immagine originale su Firebase Storage.
* [x] Backend: Cloud Function `processUploadedAvatar` (trigger Storage) per ridimensionare (48px, 160px), convertire in WebP (con sharp), salvare versioni processate su Storage, e aggiornare `avatarUrls` e `profileUpdatedAt` in Firestore.
* [x] Bucket Firebase Storage predefinito (`asyncdonkey.firebasestorage.app`) creato e configurato.
* [x] Configurazione Firebase client (`js/main.js`) aggiornata per il bucket corretto.
* [x] Configurazione trigger Cloud Function `processUploadedAvatar` aggiornata per il bucket corretto.
* [x] Cloud Function `processUploadedAvatar` deployata in produzione (come da v3.17.10, da riconfermare operatività post-fix).
* **Sotto-task Correlati alle Regressioni (ora completati o in fase di test finale):**
    * [x] Risolti problemi di visualizzazione/aggiornamento avatar su `profile.html` e navbar (REGRESS-003.1, .2, .3, .4, REGRESS-NAV-AVATAR-001).
    * [x] Analizzate e parzialmente verificate Regole di Sicurezza Firebase Storage (ANALYSIS-001.4 posticipato per dettagli).
* [ ] **Sub-task C.1.FINAL_TEST (ora REGRESS-003.5): Test finale end-to-end dell'intero flusso di upload e visualizzazione avatar.** (Verificare su profilo, navbar, e successivamente leaderboard, articoli, commenti).

#### Task C.2: Donkey Runner (Gioco Esistente)
* [x] C.2.4 (Donkey Runner): Leggibilità testi e usabilità form fullscreen. (Stato da v3.17.10)
* *(Altri sub-task di C.2 come da piano precedente v3.17.10 - non elencati qui per brevità, presumibilmente molti completati)*
* [ ] Task C.2.8 (Donkey Runner): Risolvere problemi file audio mancanti. (Priorità Bassa da v3.17.10)

#### Task C.3: Miglioramenti Leaderboard & Info Glitchzilla (Priorità Media).
* **Stato:** Parzialmente coperto da REGRESS-004 per la parte avatar.
* [ ] Restanti miglioramenti funzionali o di UI per la leaderboard (oltre all'avatar).
* [ ] Miglioramenti Info Glitchzilla.

#### Task C.5: Migliorare UI/UX di Donkey Runner Game (Priorità Media).
* **Stato:** [ ]

---

### Sezione AUTH: Gestione Autenticazione e Profilo Utente ✨👤

*(Task AUTH.1, AUTH.2, AUTH.3.1, AUTH.3.2.1, AUTH.3.3 - [x] Stato da v3.17.10)*
*(AUTH.REGRESS-001 e AUTH.REGRESS-002 sono stati rinominati REGRESS-001 e REGRESS-002 e sono COMPLETATI)*

#### Task AUTH.3: Miglioramenti Funzionali Pagina Profilo Utente (`profile.html`)
* [x] Mini-Bio Utente (AUTH.3.4). (Funzionalità CRUD base ora funzionante).
* [x] Link Esterni (AUTH.3.2). (Funzionalità CRUD base ora funzionante).
* [x] Visualizzazione Badge/Riconoscimenti Utente (AUTH.3.4.B.2, AUTH.3.6.3).
* [ ] Sub-task AUTH.3.2.2 (Miglioramento Visivo Link): Anteprime/icone sito per link esterni (Priorità Media).
* **Sub-task AUTH.3.4 (Opzionale/Idee Future):**
    * [ ] Contatori Semplici (Data registrazione). (Priorità Bassa)
    * [x] Badge/Achievements Semplici (Pilota):
        * [x] Sub-task AUTH.3.4.B.1: Struttura Dati Base.
        * [x] Sub-task AUTH.3.4.B.3 (Glitchzilla Slayer): CF `awardGlitchzillaSlayer` (deployata).
        * [x] Sub-task AUTH.3.4.B.4 (Autore Debuttante): CF `updateAuthorOnArticlePublish` (deployata).
        * [ ] Sub-task AUTH.3.4.B.5 (10 Articoli Pubblicati): Tracciamento e assegnazione badge (Richiede CF). (Priorità Media-Bassa)
* [ ] **Sub-task AUTH.3.5: Articoli Preferiti / Segnalibri.** (Priorità Bassa)
* **Sub-task AUTH.3.6: Miglioramenti Visivi Nickname.** (Priorità Alta in v3.17.10, da rivalutare)
    * [ ] Sub-task AUTH.3.6.1: Nickname Dinamico - Glitchzilla Effect.
    * [ ] Sub-task AUTH.3.6.2: Nickname Dinamico - Icona Autore.
* [ ] **Sub-task AUTH.3.7: Sistema di Amicizie/Followers.** (Priorità Molto Bassa)

---

### Sezione A: Gestione Contributi e Moderazione 🖋️
* [x] A.4.2.6.A (Admin UI): Textarea per `rejectionReason`.
* **Task A.5: Sistema di Notifiche In-App (Base).** (Priorità Alta in v3.17.10, da rivalutare)
    * [ ] Sub-task A.5.1: Struttura dati `userNotifications`.
    * [ ] Sub-task A.5.2: Logica Cloud Function per notifiche (articolo approvato/respinto, nuovo badge).
    * [ ] Sub-task A.5.3: UI base nell'header (icona campanella con contatore).
    * [ ] Sub-task A.5.4: Pagina o dropdown per visualizzare notifiche.
    * [ ] Sub-task A.5.5: Valutare notifiche per interazioni sociali.

---

### Sezione D: Miglioramenti UI/UX e Ottimizzazioni Generali ✨
* [x] Correzione ESLint `showConfirmationModal` in `js/profile.js`.
* [x] Task D.3.B.6: Revisionare e aggiornare `README.md` (focus tecnologie).
* [x] **Task D.REGRESS-003.4 (Path Avatar Default):** Corrisponde a REGRESS-003.4 - COMPLETATO.
* [ ] Sub-task D.1.A.1: Aggiungere notifiche toast per conferma/errore like. (Priorità Media-Bassa)
* [ ] Task D.9: Migliorare UX per Utente Non Registrato. (Priorità Media)
*(Altri task D come da piano precedente v3.17.10 - non elencati qui per brevità)*

---

### Sezione E: Ricerca e Sviluppo a Lungo Termine 🔬📈
* [x] **Task E.4: Adozione e Implementazione Cloud Functions per Funzionalità Avanzate.**
    * [x] Sub-task E.4.4: Decisione sull'adozione: **SÌ**.
    * [x] Implementate e deployate in produzione: `updateAuthorOnArticlePublish`, `awardGlitchzillaSlayer`.
    * [x] Implementata e deployata (da riconfermare post-fix operatività) in produzione: `processUploadedAvatar`.

---

### Sezione F: Fase di Perfezionamento Finale (Polish) 💅🎨
* [x] F.2.4.3.A.1 (Icone Like/Commenti Homepage).
* [x] F.2.4.3.A.2 (Icone Portal Card Homepage).
*(Altri task F come da piano precedente v3.17.10 - non elencati qui per brevità)*

---
Spero che questa versione consolidata sia completa e chiara. Quando riprenderemo, potremo partire dai "Prossimi Passi Immediati Suggeriti" qui sopra, iniziando dal test end-to-end dell'avatar e poi passando alla leaderboard!

Grazie ancora per la tua collaborazione e la tua pazienza! È stato un piacere.