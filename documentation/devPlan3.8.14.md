# DEVELOPMENT PLAN (v3.8.14 - Linter/Formatter e Prossimi Passi) 🚀

**Stato del Progetto:** Implementati i like per articoli e commenti (con visualizzazione likers). Editor Markdown funzionante. Pagine `contribute.html` e `admin-dashboard.html` create e operative. Funzionalità admin per articoli complete (inclusa gestione `rejectionReason`). Sistema base di tracciamento issue implementato e funzionalità di upvote corretta. Avatar e bandierina autore aggiunti alle card articoli sulla homepage. Implementata la logica client-side completa per la gestione delle bozze articolo e visualizzazione di tutti gli stati in "I Miei Articoli". Notifiche Toast implementate. **ESLint e Prettier configurati nel progetto con file di configurazione specifici (`eslint.config.mjs`, `.prettierrc.json`) e file `.gitignore` aggiunto.**

---

🚧 **Prossimi Step e Task da Prioritizzare** 🚧

## Sezione A: Gestione Contributi e Moderazione 🖋️

- **Task A.1: Pagina "Contribuisci"** `[x]` (Completata)
- **Task A.2: Sistema di Tracciamento Issue/Suggerimenti** `[x]` (Completato nelle funzionalità base, inclusi upvote e moderazione status admin)
- **Task A.3: Moderazione e Pubblicazione Articoli**
    - `[x]` Sub-task A.3.1: Regole Firestore per workflow articoli (Admin).
    - `[x]` Sub-task A.3.2: Interfaccia Admin (`admin-dashboard.html`) per gestione articoli (Pending, Pubblicati, Bozze, Respinti, Linee Guida).
    - `[x]` Sub-task A.3.3: Logica JS Interfaccia Admin.
    - `[ ]` Sub-task A.3.4: (Opzionale Esteso) Sistema di notifica base per l'autore (articoli approvati/respinti).
        - `[ ]` 🆕 Sub-task A.3.4.1: Definire struttura dati per notifiche utente in Firestore (es. `userNotifications` con `userId`, `message`, `linkToContent`, `timestamp`, `isRead`).
        - `[ ]` 🆕 Sub-task A.3.4.2: Implementare la creazione di notifiche in Firestore da `adminDashboard.js` dopo approvazione/rigetto.
        - `[ ]` 🆕 Sub-task A.3.4.3: Creare UI (es. icona nell'header o sezione in `profile.html`) per visualizzare e gestire le notifiche.
- **Task A.4: Implementazione e Debug Regole Firestore per Moderazione Articoli Admin & Autore**
    - `[x]` Sub-task A.4.1: Regole Admin (V5.1 funzionante).
    - `[x]` **Task A.4.2: Workflow autori per bozze e articoli respinti.**
        - `[x]` Sub-task A.4.2.1 - A.4.2.5: Gestione bozze e visualizzazione stati articoli utente.
        - `[x]` Sub-task A.4.2.6: Workflow Articoli Respinti con `rejectionReason`.
        - `[ ]` 🆕 Sub-task A.4.2.6.A (Miglioramento UI): Modificare UI in `admin-dashboard.html` per inserimento `rejectionReason` tramite `textarea` (invece di `prompt()`).
        - `[ ]` 🆕 Sub-task A.4.2.7 (Miglioramento UX Autore): Pre-popolare `submit-article.html` con i dati di un articolo respinto quando l'autore sceglie di creare una nuova sottomissione basata su quello (passando `articleId` e caricando i dati).

---

## Sezione B: Sistema Articoli & Contributi Utente `[x]` (Completata nelle funzionalità base) 📝

---

## Sezione G: Guestbook `[x]` (Completata nelle funzionalità base) 📖

---

## Sezione C: Nuove Funzionalità e Miglioramenti Specifici Giochi/Piattaforma 🎮

- `[ ]` **Task C.1:** Gestione Avatar Utente Personalizzato (Es. upload immagine).
- `[ ]` **Task C.2:** Ottimizzazione Layout Mobile per Donkey Runner.
    - `[ ]` 🆕 Sub-task C.2.1: Testare `donkeyRunner.html` su diverse risoluzioni mobile, verificare che i controlli touch siano comodi e il layout non si rompa.
- `[ ]` **Task C.3:** Miglioramenti Leaderboard & Info Glitchzilla.
    - `[ ]` 🆕 Sub-task C.3.X: Visualizzare stato/info Glitchzilla (se attivo o ultimo sconfitto) direttamente in `donkeyRunner.html`.
- `[ ]` **Task C.4:** Migliorare Compatibilità e Prestazioni su iOS per Donkey Runner.

---

## Sezione D: Miglioramenti UI/UX e Ottimizzazioni Generali ✨

- **Task D.1: Miglioramenti UI/UX Generali**
    - `[x]` Sub-task D.1.A: Implementare Notifiche Toast.
    - `[ ]` Sub-task D.1.B: Migliorare Messaggi di Caricamento (es. spinner più integrati, considerare skeleton loading per articoli, issue, commenti).
    - `[ ]` Sub-task D.1.C: Migliorare Gestione e Visualizzazione Errori.
        - `[ ]` 🆕 Sub-task D.1.C.1: Revisionare tutti i file `.js` per `try...catch` completi per operazioni Firestore/asincrone.
        - `[ ]` 🆕 Sub-task D.1.C.2: Standardizzare messaggi di errore utente (via `showToast`) e log in console.
    - `[ ]` Sub-task D.1.D (Continuo): Ottimizzare layout mobile generale per tutte le pagine (es. `admin-dashboard.html`, `profile.html`).
    - `[x]` Rivedere layout articoli homepage.
    - `[x]` Sub-task D.1.1: Link navigazione.
    - `[x]` Sub-task D.1.2: Riorganizzare "I Miei Articoli" in griglia.
- **Task D.2: Funzionalità Aggiuntive per l'Utente**
    - `[ ]` Modifica Nazionalità dal profilo utente.
        - `[ ]` 🆕 Sub-task D.2.1: Aggiungere `<select>` per nazionalità in `profile.html` e logica di update in `js/profile.js`.
        - `[ ]` 🆕 Sub-task D.2.2: Aggiornare regole Firestore per permettere modifica `nationalityCode`.
    - `[ ]` Possibilità per gli utenti di cancellare i propri commenti (articoli e guestbook).
        - `[ ]` 🆕 Sub-task D.2.3: UI e logica per eliminare propri commenti nel guestbook (`js/comments.js`).
        - `[ ]` 🆕 Sub-task D.2.4: UI e logica per eliminare propri commenti negli articoli (`js/articleViewer.js`).
        - `[ ]` 🆕 Sub-task D.2.5: Regole Firestore per `allow delete` sui commenti e gestione `commentCount` (valutare Cloud Function se l'aggiornamento del contatore diventa complesso o critico per la sicurezza).
- **Task D.3: Ottimizzazioni del Codice**
    - `[x]` Refactoring JS (NON VERRA' EFFETTUATO)
    - `[x]` **Sub-task D.3.A (Nuovo): Configurazione Linter (ESLint) e Formatter (Prettier).**
        - `[x]` Installazione dipendenze (`eslint`, `prettier`, `eslint-config-prettier`, `eslint-plugin-jsonc`, `eslint-plugin-markdown`, `globals`, `@eslint/js`).
        - `[x]` Creazione e configurazione di `eslint.config.mjs` (Flat Config).
        - `[x]` Creazione e configurazione di `.prettierrc.json`.
        - `[x]` Creazione di `.gitignore` (per `node_modules/` ecc.).
        - `[ ]` Applicare linting e formattazione a tutto il codebase esistente.
    - `[ ]` Aggiungere commenti dettagliati e documentazione JSDoc alle funzioni e sezioni complesse.
        - `[ ]` 🆕 Sub-task D.3.1: Iniziare con JSDoc per funzioni pubbliche/esportate e logica complessa.
        - `[ ]` 🆕 Sub-task D.3.2: Aggiungere commenti inline per passaggi logici non ovvi.
- **Task D.4: Test e Quality Assurance**
    - `[ ]` Test cross-browser (Edge, Firefox, Safari) e cross-device (mobile, tablet).
        - `[ ]` 🆕 Sub-task D.4.1: Creare checklist di test manuali per funzionalità chiave.
        - `[ ]` 🆕 Sub-task D.4.2: Eseguire checklist su Chrome, poi estendere a Firefox, Edge.
        - `[ ]` 🆕 Sub-task D.4.3: Eseguire checklist su mobile (o emulatore).
    - `[ ]` Definire casi di test formali.
- **Task D.5: Filtri Avanzati per Leaderboard Globale** `[ ]`
    - `[ ]` 🆕 Sub-task D.5.1: UI per filtri leaderboard (periodo, nazionalità).
    - `[ ]` 🆕 Sub-task D.5.2: Logica JS e query Firestore per applicare i filtri.
- **Task D.6: Miglioramenti Stili Commenti e Interazioni Like**
    - `[ ]` Sub-task D.6.1: Rivedere gli stili per la sezione commenti (articoli e guestbook) per leggibilità e impatto visivo, specialmente su mobile.
    - `[x]` Sub-task D.6.2: Interattività bottoni like/conteggi.
- **Task D.7: Miglioramento Grafico Card Articoli Homepage** `[x]`

---

🌍 ## Fase Successiva (Lungo Termine): Internazionalizzazione (i18n) Completa `[ ]`

---

## Considerazioni Chiave e Suggerimenti Migliorativi (Aggiornate) 💡

- **Test Regole Firestore:** Cruciale. Utilizzare estensivamente il Simulatore Firestore nella console Firebase.
- **Modularità del Codice:** Bene l'esempio di `toastNotifications.js`. Continuare a identificare opportunità per estrarre logiche riutilizzabili o specifiche di entità (es. interazioni Firestore per `articles`, `userIssues`) in moduli dedicati.
- **Sicurezza:**
    - **Sanificazione Input:** Anche se il Markdown viene gestito da `marked` (che dovrebbe sanificare di default, ma è bene verificarne la configurazione), qualsiasi altro `innerHTML` basato su input utente richiede attenzione per prevenire XSS. Privilegiare `textContent` ove possibile.
    - **Regole Firestore Robuste:** Continuare a verificarle e a renderle il più specifiche possibile.
- **Accessibilità (a11y):** Man mano che si aggiungono UI complesse (modali, filtri, notifiche), verificare la navigabilità da tastiera, l'uso di attributi ARIA corretti e il contrasto cromatico.
- **Performance:**
    - **Query Firestore:** Monitorare la complessità delle query e assicurarsi che gli indici necessari siano creati (Firebase di solito avvisa in console per indici compositi mancanti).
    - **Lazy Loading Immagini:** Per le immagini di copertina degli articoli o altre immagini pesanti, considerare il lazy loading per migliorare il tempo di caricamento iniziale della pagina.
    - `[ ]` 🆕 **Bundle Size:** Anche se non si usa un bundler complesso, tenere d'occhio la dimensione totale degli script JS. Se il progetto crescesse molto, considerare tecniche di code splitting o caricamento dinamico di moduli se supportato nativamente dai browser in modo efficiente.
- **Documentazione del Codice (D.3):** Fondamentale per la manutenibilità. JSDoc aiuta a definire contratti chiari per le funzioni.
- **Repository GitHub:**
    - `[x]` **Configurazione `.gitignore`**: Aggiunto per escludere `node_modules/` e altri file non necessari.
    - `[ ]` 🆕 **Issue Templates:** Verificare che i template per le issue su GitHub (`.github/ISSUE_TEMPLATE/`) siano chiari e utili per chi vuole segnalare bug o proporre feature.
    - `[ ]` 🆕 **Contributing Guidelines:** Considerare un file `CONTRIBUTING.md` nel repository se si vuole incoraggiare contributi esterni in modo più strutturato.
- `[ ]` 🆕 **UI Consistente:** Mantenere coerenza stilistica e funzionale tra le varie sezioni (es. bottoni, form, modali). Le variabili CSS aiutano molto in questo.
- `[ ]` 🆕 **Revisione UX Admin Dashboard:** Con l'aggiunta di più sezioni (bozze, respinti, issue), assicurarsi che la dashboard admin rimanga navigabile e non sovraccarica. Potrebbe essere utile raggruppare le funzionalità o usare tab/sezioni collassabili in modo più esteso.
- **Linting e Formattazione Codice:** La configurazione di ESLint e Prettier aiuterà a mantenere uno stile di codice consistente e a identificare potenziali problemi prima. È importante applicare questi strumenti a tutto il codebase esistente.

---

## Prossimi Passi Immediati Suggeriti (da discutere e ordinare per priorità) 🎯

1.  **Applicare Linting/Formattazione al Codebase Esistente (Sub-task D.3.A):** Eseguire `npx eslint . --fix` e `npx prettier . --write` per uniformare il codice esistente. Potrebbe richiedere alcune correzioni manuali.
2.  **Migliorare UI Admin per `rejectionReason` (A.4.2.6.A):** Sostituire `prompt()` con un campo `textarea` in `admin-dashboard.html` per una migliore UX admin.
3.  **Pre-popolamento Form per Articoli Respinti (A.4.2.7):** Migliora significativamente l'UX per l'autore.
4.  **Modifica Nazionalità dal profilo utente (D.2.1, D.2.2):** Funzionalità relativamente contenuta e utile per la completezza del profilo.
5.  **Documentazione Codice (D.3):** Iniziare a commentare le parti più complesse o recentemente modificate.
6.  **Test e QA (D.4.1, D.4.2):** Definire e iniziare a eseguire un primo ciclo di test manuali sulle funzionalità principali.

---
