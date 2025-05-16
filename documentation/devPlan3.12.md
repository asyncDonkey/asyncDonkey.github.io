# DEVELOPMENT PLAN (v3.12.0 - Focus Giochi e Documentazione Residua) 🚀

**Stato del Progetto:** Registrazione utente centralizzata e profilo base (visualizzazione dati, stato d'animo, link esterni, navigazione URL) OK. Pulsanti di condivisione articoli (base) OK. Schema Firestore e Regole Firestore base commentate. Funzionalità admin per articoli e issue OK. Like, commenti, editor Markdown, notifiche Toast OK. Linter/Formatter OK.

---

**PRINCIPI GUIDA E BEST PRACTICES:**

* 🆕 **Valutazione Preventiva per Task Complessi:** Per modifiche strutturali, funzionalità complesse (es. propagazione dati, sistemi di messaggistica), o revisioni profonde delle Regole Firestore, verrà condotta un'analisi preliminare dettagliata. Questa includerà:
    * **Scopo e Risultati Attesi:** Definizione chiara.
    * **Dipendenze e Impatto:** Analisi delle interconnessioni con il sistema esistente.
    * **Complessità e Sforzo:** Stima realistica.
    * **Alternative e Incrementalità:** Valutazione di approcci più semplici o per fasi.
    * **Piano di Test Specifico:** Criteri di validazione.
* **Focus sulla User Experience (UX):** Prioritizzare chiarezza, feedback immediato, e facilità d'uso.
* **Sicurezza e Validazione:** Controlli client-side per UX, regole Firestore robuste per sicurezza backend.
* **Documentazione Continua:** Commentare codice, strutture dati e decisioni architetturali.

---

🚧 **Prossimi Step e Task da Prioritizzare** 🚧

## Sezione AUTH: Gestione Autenticazione e Profilo Utente ✨👤

* **Task AUTH.1: Centralizzazione e Miglioramento Processo di Registrazione** `[x]`
    * `[x]` Sub-task AUTH.1.1: Creare pagina dedicata `register.html`.
    * `[x]` Sub-task AUTH.1.2: Sviluppare `js/register.js` per logica `register.html` (inclusa creazione profilo base e invio email di verifica).
    * `[x]` Sub-task AUTH.1.3: Aggiornare tutti i link/pulsanti "Register" esistenti.
    * `[x]` Sub-task AUTH.1.4: Rimuovere HTML e JS delle modali di signup.

* **Task AUTH.2: Semplificazione e Conferma Funzionalità Profilo Utente** `[x]`
    * `[x]` Sub-task AUTH.2.1: Rimuovere da `profile.html` e `js/profile.js` l'UI e la logica per la *modifica* di Nickname e Nazionalità.
    * `[x]` Sub-task AUTH.2.2: Verifica e Documentazione Comportamento Avatar Blockie (confermato dinamico).

* **Task AUTH.3: Miglioramenti Funzionali Pagina Profilo Utente (`profile.html`)**
    * `[x]` Sub-task AUTH.3.1: Implementare "Stato d'Animo" (Status Message).
    * `[x]` **Sub-task AUTH.3.2: Implementare Link a Contenuti Esterni con Anteprime.**
        * `[x]` Sub-task AUTH.3.2.1: Gestione CRUD e Visualizzazione Base Link.
        * `[ ]` Sub-task AUTH.3.2.2 (Miglioramento Visivo): Migliorare visualizzazione link con anteprime/icone (Ricerca iniziale da fare, implementazione semplificata se anteprime dinamiche complesse).
    * `[ ]` **Sub-task AUTH.3.3: Rendere Pagina Profilo Navigabile e Pubblica.**
        * `[x]` Parte 1: Logica per caricare profili via `userId` URL e distinzione UI pubblica/privata.
        * `[ ]` Parte 2: Trasformare i nomi utente (articoli, commenti, ecc.) in link ai profili pubblici.
    * `[ ]` Sub-task AUTH.3.4 (Opzionale/Idee Future - *se il tempo lo permette, scegliere 1-2 max*):
        * `[ ]` **Mini-Bio Utente:** Campo `bio: string` (max 300 caratteri) in `userProfiles`, modificabile.
        * `[ ]` **Contatori Semplici:** Visualizzare data di registrazione.
        * `[ ]` **Badge/Achievements Semplici (Pilota):** (Concetto, Struttura Dati, Badge Pilota 1 & 2, Visualizzazione).

## Sezione A: Gestione Contributi e Moderazione 🖋️
* (Task A.1 - A.4.2.7 rimangono come nel piano v3.11.0, con A.4.2.7 "Pre-popolamento form da articoli respinti" come `[x]`)

---
## Sezione B & G: Articoli, Contributi Utente, Guestbook `[x]` (Funzionalità base complete) 📝📖
---

## Sezione C: Nuove Funzionalità e Miglioramenti Specifici Giochi/Piattaforma 🎮

* `[ ]` **Task C.1:** Gestione Avatar Utente Personalizzato (Upload immagine tramite Firebase Storage).
    * **Valutazione:** Mantenuto come **Opzionale/Futuro (Priorità Media)**.
* `[ ]` **Task C.2: Ottimizzazione Layout Mobile per Donkey Runner.**
    * `[ ]` Sub-task C.2.1: Testare `donkeyRunner.html` su diverse risoluzioni mobile (smartphone/tablet, portrait/landscape).
    * `[ ]` Sub-task C.2.2: Verificare che i controlli touch (`#mobileControls`) siano comodi, reattivi e non si sovrappongano ad elementi importanti del gioco.
    * `[ ]` Sub-task C.2.3: Assicurare che il `<canvas>` del gioco si ridimensioni correttamente e mantenga le proporzioni, evitando barre di scorrimento orizzontali sulla pagina.
    * `[ ]` Sub-task C.2.4: Verificare la leggibilità di punteggio e altri testi del gioco su schermi piccoli.
* `[ ]` **Task C.3: Miglioramenti Leaderboard & Info Glitchzilla.**
    * `[ ]` Sub-task C.3.1: Visualizzare stato/info Glitchzilla (se attivo, ultimo sconfitto e da chi) direttamente in `donkeyRunner.html` (es. sopra o sotto la mini-leaderboard).
    * `[ ]` Sub-task C.3.2: (Opzionale) Aggiungere filtri o tab alla pagina `leaderboard.html` (es. per punteggi settimanali/mensili, se tecnicamente fattibile con query Firestore semplici).
* `[ ]` **Task C.4:** Migliorare Compatibilità e Prestazioni su iOS per Donkey Runner.
    * `[ ]` Sub-task C.4.1: Test specifici su dispositivi iOS (iPhone/iPad).
    * `[ ]` Sub-task C.4.2: Indagare e risolvere eventuali problemi di performance o rendering specifici di Safari/iOS.

---

## Sezione D: Miglioramenti UI/UX e Ottimizzazioni Generali ✨

* (Task D.1.A `[x]`, D.1.B `[ ]`, D.1.C `[ ]`, D.1.D `[ ]`, D.2 (cancellazione commenti) `[ ]`, D.7 `[x]` rimangono come nel piano v3.11.0)
* **Task D.3: Ottimizzazioni del Codice e Documentazione**
    * `[x]` Sub-task D.3.A: Configurazione Linter (ESLint) e Formatter (Prettier).
    * `[ ]` **Sub-task D.3.B: Documentazione Approfondita del Codice e del Progetto.**
        * `[ ]` D.3.B.1: JSDoc per tutte le funzioni pubbliche e logiche complesse in tutti i file `.js`.
        * `[ ]` D.3.B.2: Commenti inline chiari per passaggi non ovvi.
        * `[ ]` D.3.B.3: Commenti a livello di modulo/file (scopo e responsabilità).
        * `[x]` D.3.B.4: Creare/Aggiornare `documentation/firestore-schema.md`.
        * `[x]` D.3.B.5: Commentare estensivamente le Regole Firestore (`firestore.rules`).
        * `[ ]` D.3.B.6: Revisionare e aggiornare `README.md` del progetto.
        * `[ ]` D.3.B.7: Mantenere aggiornato il `DEVELOPMENT_PLAN.md`.
* **Task D.8: Integrazioni Esterne e Condivisione**
    * `[x]` Sub-task D.8.1: Implementare Pulsanti di Condivisione (Share Buttons) per articoli.
        * `[ ]` Estendere a Punteggi Giochi (in `donkeyRunner.html`, dopo salvataggio punteggio).
    * `[ ]` Sub-task D.8.2: Collegare a GitHub Issues.
    * `[ ]` Sub-task D.8.3 (Ricerca): Documentazione su widget/embedding.

---
## Sezione E: Ricerca e Sviluppo a Lungo Termine 🔬📈
* (Task E.1 Propagazione Dati, E.2 Messaggistica Interna rimangono come nel piano v3.11.0)

---
## Sezione F: Fase di Perfezionamento Finale  polish
* (Task F.1 Revisione HTML/CSS rimane come nel piano v3.11.0)

---
🌍 ## Fase Successiva (Lungo Termine): Internazionalizzazione (i18n) Completa `[ ]`
---

## Considerazioni Chiave e Suggerimenti Migliorativi (Aggiornate) 💡
* **Test Regole Firestore:** L'importanza di testare le regole (anche con il simulatore) è stata cruciale per il successo delle recenti implementazioni. Continuare questa pratica.
* **Modularità `js/profile.js`:** Con l'aggiunta di "Stato d'Animo" e "Link Esterni", il file `js/profile.js` sta crescendo. Se si aggiungono altre sezioni modificabili (Bio, Badges), valutare un refactoring per estrarre logiche specifiche in moduli più piccoli.
* **Anteprime Link Esterni (AUTH.3.2.2):** La richiesta di anteprime per i link esterni è valida per migliorare l'UX. La fattibilità e complessità (CORS, API esterne) andranno valutate attentamente. Un approccio incrementale (icone generiche prima, poi anteprime se possibile) è saggio.
* **UX Registrazione e Profilo:** La chiarezza sui campi non modificabili e la gestione della verifica email sono punti chiave dell'esperienza utente.
* **Documentazione:** Mantenere aggiornato `firestore-schema.md` e commentare le regole Firestore è un ottimo inizio. Proseguire con JSDoc e commenti inline nel codice JS.
* **Sicurezza e Validazione:** Continuare a validare input sia client-side che tramite regole Firestore.

---

## Prossimi Passi Immediati Suggeriti (Nuovo Ordine di Priorità) 🎯

1.  **Task C.2: Ottimizzazione Layout Mobile per Donkey Runner.** (Nuova priorità principale)
    * Sub-task C.2.1: Testare `donkeyRunner.html` su diverse risoluzioni mobile.
    * Sub-task C.2.2: Verificare comodità e reattività controlli touch.
    * Sub-task C.2.3: Assicurare ridimensionamento corretto canvas.
    * Sub-task C.2.4: Verificare leggibilità testi gioco.
2.  **Task D.3.B (Documentazione Residua):**
    * D.3.B.1: Iniziare con JSDoc per le funzioni in `js/register.js` e `js/profile.js`.
    * D.3.B.2: Aggiungere commenti inline dove necessario nei file JS modificati di recente.
    * D.3.B.6: Revisionare e aggiornare `README.md` con le nuove funzionalità.
3.  **Task D.4: Test e QA (Quality Assurance).**
    * Testare formalmente il flusso di registrazione, login, visualizzazione profilo (proprio/altrui), modifica stato d'animo e link esterni.
4.  **Task AUTH.3.3 (Completamento): Trasformare i nomi utente in link ai profili pubblici.**
    * Identificare dove vengono visualizzati i nomi utente (es. autore articolo, autore commento).
    * Modificare il codice JS per rendere questi nomi dei link a `profile.html?userId=<ID_AUTORE>`.
5.  **Task AUTH.3.4 (Opzionali Profilo): Iniziare con Mini-Bio Utente.**
    * Aggiungere campo `bio` a `userProfiles` (già presente nella struttura, ma da rendere modificabile).
    * UI e logica JS in `profile.html` e `js/profile.js` per modifica e visualizzazione.
    * Aggiornare regole Firestore per permettere la modifica della `bio`.
6.  **Task C.3: Miglioramenti Leaderboard & Info Glitchzilla.** (Se C.2 è rapido)

---
