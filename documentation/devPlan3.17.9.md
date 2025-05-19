# DEVELOPMENT PLAN (v3.17.9 - Avatar Utente Full Flow Emulato & CF Deployed) 🚀

**Data Ultimo Aggiornamento:** 19 Maggio 2025 (Simulazione)

**Stato del Progetto:** Registrazione utente centralizzata e profilo utente (visualizzazione dati, stato d'animo, mini-bio, link esterni CRUD base, navigazione URL per visualizzazione pubblica/privata, link ai profili utente) implementati. Pulsanti di condivisione articoli OK. Documentazione schema Firestore e commenti Regole Firestore base completati. Funzionalità admin per articoli (inclusa `rejectionReason` con `textarea` e pre-popolamento) e issue tracker base operativi. Like per articoli/commenti, editor Markdown, gestione bozze e stati articoli utente, notifiche Toast, Linter/Formatter e `.gitignore` OK. Fix recenti hanno risolto problemi di visualizzazione commenti, controlli mobili Donkey Runner, visualizzazione articoli homepage, logout mobile e warning ARIA. Integrazione Material Symbols completata (navbar, footer, portal card, like/commenti homepage). Nuova navbar implementata e funzionante. Layout form Donkey Runner compattato. **Cloud Functions per assegnazione automatica badge "Autore Debuttante" e "Glitchzilla Slayer" implementate e deployate in produzione.** **Funzionalità di upload avatar utente con selezione file, validazione client, upload su Firebase Storage (originale), processamento (ridimensionamento, conversione WebP con `sharp`) tramite Cloud Function `processUploadedAvatar`, e aggiornamento URL in Firestore implementata e testata con successo tramite emulatori.** Visualizzazione badge utente (icone animate e modale dettagli) su pagina profilo implementata. README aggiornato con tecnologie.

---

🚧 **Prossimi Step e Task da Prioritizzare** 🚧

## Sezione AUTH: Gestione Autenticazione e Profilo Utente ✨👤

- (Task AUTH.1, AUTH.2, AUTH.3.1, AUTH.3.2.1, AUTH.3.3 - `[x]`)
- **Task AUTH.3: Miglioramenti Funzionali Pagina Profilo Utente (`profile.html`)**
    - `[x]` Mini-Bio Utente (AUTH.3.4).
    - `[x]` Visualizzazione Badge/Riconoscimenti Utente (icone animate cliccabili con modale dettagli) (AUTH.3.4.B.2, AUTH.3.6.3).
    - `[ ]` Sub-task AUTH.3.2.2 (Miglioramento Visivo Link): Anteprime/icone sito per link esterni (Priorità Media).
    - `[ ]` Sub-task AUTH.3.4 (Opzionale/Idee Future):
        - `[ ]` Contatori Semplici (Data registrazione). (Priorità Bassa)
        - `[x]` Badge/Achievements Semplici (Pilota):
            - `[x]` Sub-task AUTH.3.4.B.1: Struttura Dati Base.
            - `[x]` Sub-task AUTH.3.4.B.3 (Pilota 1 - Glitchzilla Slayer): Tracciamento e assegnazione badge via CF `awardGlitchzillaSlayer` (deployata).
            - `[x]` Sub-task AUTH.3.4.B.4 (Pilota 2 - Autore Debuttante): Tracciamento e assegnazione badge via CF `updateAuthorOnArticlePublish` (deployata).
            - `[ ]` Sub-task AUTH.3.4.B.5 (Pilota 3 - 10 Articoli Pubblicati): Tracciamento contatore e assegnazione badge (Richiede CF per contatore). (Priorità Media-Bassa)
    - `[ ]` **Sub-task AUTH.3.5 (Nuovo): Articoli Preferiti / Segnalibri.** (Priorità Bassa)
    - `[ ]` **Sub-task AUTH.3.6 (Nuovo - Idee Gamification Visiva Profilo): Miglioramenti Visivi Nickname.**
        - `[ ]` Sub-task AUTH.3.6.1: Nickname Dinamico - Glitchzilla Effect (basato su flag `hasDefeatedGlitchzilla`).
        - `[ ]` Sub-task AUTH.3.6.2: Nickname Dinamico - Icona Autore (basato su flag `hasPublishedArticles`).
    - `[ ]` **Sub-task AUTH.3.7 (Nuovo - Idea Futura): Sistema di Amicizie/Followers.** (Priorità Molto Bassa)

## Sezione A: Gestione Contributi e Moderazione 🖋️

- `[x]` A.4.2.6.A (Admin UI): Textarea per `rejectionReason`.
- `[ ]` **Task A.5 (Nuovo): Sistema di Notifiche In-App (Base).** (Priorità Media)
    - `[ ]` Sub-task A.5.1: Struttura dati `userNotifications`.
    - `[ ]` Sub-task A.5.2: **Logica Cloud Function** per notifiche "articolo approvato/respinto" e "nuovo badge".
    - `[ ]` Sub-task A.5.3: UI base nell'header (icona campanella con contatore).
    - `[ ]` Sub-task A.5.4: Pagina o dropdown per visualizzare notifiche.
    - `[ ]` Sub-task A.5.5: Valutare notifiche per interazioni sociali (richiede CF).

## Sezione C: Nuove Funzionalità e Miglioramenti Specifici Giochi/Piattaforma 🎮

- `[x]` **Task C.1: Gestione Avatar Utente Personalizzato.**
    - `[x]` Frontend: UI per selezione, validazione, anteprima e upload immagine originale su Firebase Storage.
    - `[x]` Backend: Cloud Function `processUploadedAvatar` (trigger Storage) per ridimensionare (48px, 160px), convertire in WebP (con `sharp`), salvare versioni processate su Storage, e aggiornare `avatarUrls` in Firestore.
    - `[x]` Testato con successo l'intero flusso con emulatori Firebase.
    - `[ ]` **Deploy Cloud Function `processUploadedAvatar` in produzione e test finale end-to-end.**
- `[x]` Task C.2.4 (Donkey Runner): Leggibilità testi e usabilità form fullscreen.
- (Altri sub-task di C.2 come da piano precedente)
- `[ ]` Task C.3: Miglioramenti Leaderboard & Info Glitchzilla (Priorità Media).
- `[ ]` Task C.5 (Nuovo): Migliorare UI/UX di Donkey Runner Game (Priorità Media).

## Sezione D: Miglioramenti UI/UX e Ottimizzazioni Generali ✨

- `[x]` Correzione ESLint `showConfirmationModal` in `js/profile.js`.
- `[x]` Task D.3.B.6: Revisionare e aggiornare `README.md` (focus tecnologie).
- `[ ]` Sub-task D.1.A.1 (Nuovo): Aggiungere notifiche toast per conferma/errore like. (Priorità Media-Bassa)
- `[ ]` Task D.9: Migliorare UX per Utente Non Registrato. (Priorità Media)
- (Altri task D come da piano precedente)

## Sezione E: Ricerca e Sviluppo a Lungo Termine 🔬📈

- `[x]` **Task E.4: Adozione e Implementazione Cloud Functions per Funzionalità Avanzate.**
    - `[x]` Sub-task E.4.4: Decisione sull'adozione: **SÌ**.
    - `[x]` Implementate e deployate in produzione: `updateAuthorOnArticlePublish`, `awardGlitchzillaSlayer`.
    - `[x]` Implementata e testata con emulatori: `processUploadedAvatar`.

## Sezione F: Fase di Perfezionamento Finale (Polish) 💅🎨

- `[x]` F.2.4.3.A.1 (Icone Like/Commenti Homepage).
- `[x]` F.2.4.3.A.2 (Icone Portal Card Homepage).
- (Altri task F come da piano precedente)

---

## Prossimi Passi Immediati Suggeriti (Ordine di Priorità Rivisto) 🎯

1.  **Task C.1 (Avatar Utente): Deploy Cloud Function `processUploadedAvatar` in produzione e test completo end-to-end.** (Priorità Massima)
2.  **Task AUTH.3.6.1 & AUTH.3.6.2 (Nickname Dinamico):** Implementare effetto Glitchzilla e Icona Autore per i nickname. (Priorità Alta)
3.  **Task A.5 (Notifiche In-App via Cloud Functions):**
    - Sub-task A.5.1: Definire/Confermare struttura `userNotifications`.
    - Sub-task A.5.2: Implementare CF per notifiche "articolo approvato/respinto" e "nuovo badge sbloccato".
    - Sub-task A.5.3 & A.5.4: UI per visualizzare notifiche. (Priorità Alta)
4.  **Task D.9: Migliorare UX per Utente Non Registrato.** (Priorità Media)
5.  **Task D.1.A.1 (Nuovo): Notifiche Toast per Like.** (Priorità Media-Bassa)
6.  **Task C.3: Miglioramenti Leaderboard & Info Glitchzilla.** (Priorità Media)
7.  **Task C.5: Migliorare UI/UX di Donkey Runner Game.** (Priorità Media)
8.  **Task AUTH.3.5 (Nuovo): Articoli Preferiti / Segnalibri.** (Priorità Bassa)
9.  **Task A.4.4 (Nuovo): Statistiche Utente Aggregate per Admin (UI base).** (Priorità Bassa/Futuro)
10. **Task C.2.8 (Donkey Runner): Risolvere problemi file audio mancanti.** (Priorità Bassa)
11. **Sub-task AUTH.3.2.2 (Link Esterni): Migliorare visualizzazione.** (Priorità Media)
12. **Sub-task AUTH.3.4.B.5 (Badge 10 Articoli):** Implementare tracciamento e assegnazione (CF). (Priorità Media-Bassa)

---
