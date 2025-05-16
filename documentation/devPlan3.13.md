# DEVELOPMENT PLAN (v3.13.0 - Ottimizzazione Giochi e Finalizzazione Documentazione) 🚀

**Stato del Progetto:** Registrazione utente centralizzata e profilo utente (visualizzazione dati, stato d'animo, link esterni CRUD base, navigazione URL per visualizzazione pubblica/privata) implementati e funzionanti. Pulsanti di condivisione per articoli (base con `navigator.share` e fallback "Copia Link") OK. Documentazione schema Firestore (`firestore-schema.md`) e commenti base per le Regole Firestore (`firestore.rules`) completati. Funzionalità admin per articoli (inclusa `rejectionReason` e pre-popolamento) e issue tracker base operative. Like per articoli/commenti, editor Markdown, gestione bozze e stati articoli utente, notifiche Toast, Linter/Formatter e `.gitignore` OK.

---

**PRINCIPI GUIDA E BEST PRACTICES:**

- 🆕 **Valutazione Preventiva per Task Complessi:** Per modifiche strutturali, funzionalità complesse (es. propagazione dati, sistemi di messaggistica), o revisioni profonde delle Regole Firestore, verrà condotta un'analisi preliminare dettagliata. Questa includerà:
    - **Scopo e Risultati Attesi:** Definizione chiara.
    - **Dipendenze e Impatto:** Analisi delle interconnessioni con il sistema esistente.
    - **Complessità e Sforzo:** Stima realistica.
    - **Alternative e Incrementalità:** Valutazione di approcci più semplici o per fasi.
    - **Piano di Test Specifico:** Criteri di validazione.
- **Focus sulla User Experience (UX):** Prioritizzare chiarezza, feedback immediato, e facilità d'uso, inclusa l'esperienza mobile.
- **Sicurezza e Validazione:** Controlli client-side per UX, regole Firestore robuste per sicurezza backend.
- **Documentazione Continua:** Commentare codice, strutture dati, decisioni architetturali e mantenere aggiornato il piano di sviluppo.

---

🚧 **Prossimi Step e Task da Prioritizzare** 🚧

## Sezione AUTH: Gestione Autenticazione e Profilo Utente ✨👤

- **Task AUTH.1: Centralizzazione e Miglioramento Processo di Registrazione** `[x]`

    - `[x]` Sub-task AUTH.1.1: Creare pagina dedicata `register.html`.
    - `[x]` Sub-task AUTH.1.2: Sviluppare `js/register.js` per logica `register.html`.
    - `[x]` Sub-task AUTH.1.3: Aggiornare tutti i link/pulsanti "Register" esistenti.
    - `[x]` Sub-task AUTH.1.4: Rimuovere HTML e JS delle modali di signup.

- **Task AUTH.2: Semplificazione e Conferma Funzionalità Profilo Utente** `[x]`

    - `[x]` Sub-task AUTH.2.1: Rimuovere da `profile.html` e `js/profile.js` l'UI e la logica per la _modifica_ di Nickname e Nazionalità.
    - `[x]` Sub-task AUTH.2.2: Verifica e Documentazione Comportamento Avatar Blockie.

- **Task AUTH.3: Miglioramenti Funzionali Pagina Profilo Utente (`profile.html`)**
    - `[x]` Sub-task AUTH.3.1: Implementare "Stato d'Animo" (Status Message).
    - `[x]` **Sub-task AUTH.3.2: Implementare Link a Contenuti Esterni con Anteprime.**
        - `[x]` Sub-task AUTH.3.2.1: Gestione CRUD (Aggiunta, Modifica, Eliminazione) e Visualizzazione Base Link.
        - `[ ]` Sub-task AUTH.3.2.2 (Miglioramento Visivo): Migliorare visualizzazione link esterni per includere anteprime o icone sito (Ricerca iniziale su fattibilità e complessità, poi implementazione. Priorità Media).
    - `[ ]` **Sub-task AUTH.3.3: Rendere Pagina Profilo Navigabile e Pubblica.**
        - `[x]` Parte 1: Logica per caricare profili via `userId` URL e distinzione UI pubblica/privata.
        - `[ ]` Parte 2: Trasformare i nomi utente (su articoli, commenti, leaderboard, ecc.) in link cliccabili ai rispettivi profili pubblici (`profile.html?userId=<ID_UTENTE>`). (Priorità Medio-Alta)
    - `[ ]` Sub-task AUTH.3.4 (Opzionale/Idee Future - _se il tempo lo permette, scegliere 1-2 max_):
        - `[ ]` **Mini-Bio Utente:** Campo `bio: string` (max 300 caratteri) in `userProfiles` (già presente nello schema), UI e logica per modifica/visualizzazione. (Priorità Media)
        - `[ ]` **Contatori Semplici:** Visualizzare data di registrazione sul profilo. (Priorità Bassa)
        - `[ ]` **Badge/Achievements Semplici (Pilota):** (Priorità Bassa/Valutare dopo altre funzionalità core)
            - **Concetto:** Introdurre 1-2 badge iniziali.
            - **Struttura Dati:** Collezione `badges` (`badgeId`, `name`, `description`, `iconUrl`). Campo `earnedBadges: array<string>` in `userProfiles`.
            - **Badge Pilota 1: "Autore Debuttante"**.
            - **Badge Pilota 2: "Glitchzilla Slayer"**.
            - **Visualizzazione:** Sezione "I Miei Riconoscimenti" in `profile.html`.

## Sezione A: Gestione Contributi e Moderazione 🖋️

- (Task A.1 - A.3.3 come da v3.11.0)
- **Task A.4: Miglioramenti Dashboard Admin (`admin-dashboard.html`)**
    - (Sub-task A.4.1 - A.4.2.6 come da v3.11.0)
    - `[x]` A.4.2.7: Pre-popolamento form da articoli respinti.
    - `[ ]` A.4.3: (Nuovo) Visualizzazione e gestione utenti (lista utenti, possibilità di visualizzare profilo, eventuale ban/sospensione base - da valutare attentamente per regole Firestore). (Priorità Bassa/Futuro)

---

## Sezione B & G: Articoli, Contributi Utente, Guestbook `[x]` (Funzionalità base complete) 📝📖

---

## Sezione C: Nuove Funzionalità e Miglioramenti Specifici Giochi/Piattaforma 🎮

- `[ ]` **Task C.1:** Gestione Avatar Utente Personalizzato (Upload immagine tramite Firebase Storage).
    - **Valutazione:** Mantenuto come **Opzionale/Futuro (Priorità Media-Bassa)**.
- `[ ]` **Task C.2: Ottimizzazione Layout Mobile per Donkey Runner.** (Priorità Attuale)
    - `[ ]` Sub-task C.2.1: Testare `donkeyRunner.html` su diverse risoluzioni mobile (smartphone/tablet, portrait/landscape).
    - `[ ]` Sub-task C.2.2: Verificare e ottimizzare comodità, reattività e posizionamento dei controlli touch (`#mobileControls`), specialmente in modalità fullscreen landscape.
    - `[ ]` Sub-task C.2.3: Assicurare che il `<canvas>` del gioco si ridimensioni correttamente (`object-fit: cover` in fullscreen landscape) e mantenga la giocabilità, evitando barre di scorrimento.
    - `[ ]` Sub-task C.2.4: Verificare e migliorare la leggibilità di punteggio, menu, game over e altri testi del gioco su schermi piccoli, sia su canvas che HTML (es. form punteggio).
    - `[ ]` Sub-task C.2.5: Implementare logica per forzare/suggerire orientamento landscape in modalità fullscreen su mobile e gestire la visibilità/layout dei controlli di conseguenza.
    - `[ ]` Sub-task C.2.6: Assicurare che il form di salvataggio punteggio e il pulsante Start/Restart mobile siano ben visibili e utilizzabili in modalità fullscreen.
- `[ ]` **Task C.3: Miglioramenti Leaderboard & Info Glitchzilla.** (Priorità Medio-Alta, dopo C.2)
    - `[ ]` Sub-task C.3.1: Visualizzare stato/info Glitchzilla (se attivo, ultimo sconfitto e da chi) direttamente in `donkeyRunner.html`.
    - `[ ]` Sub-task C.3.2: (Opzionale) Aggiungere filtri o tab alla pagina `leaderboard.html`.
    - `[ ]` Sub-task C.3.3: Nella leaderboard, distinguere chiaramente gli utenti registrati dagli "Ospiti" (basato su `userId`).
- `[ ]` **Task C.4:** Migliorare Compatibilità e Prestazioni su iOS per Donkey Runner. (Priorità Media)
    - `[ ]` Sub-task C.4.1: Test specifici su dispositivi iOS.
    - `[ ]` Sub-task C.4.2: Indagare e risolvere eventuali problemi.

---

## Sezione D: Miglioramenti UI/UX e Ottimizzazioni Generali ✨

- (Task D.1.A `[x]`, D.1.B `[ ]`, D.1.C `[ ]`, D.1.D `[ ]`, D.2 (cancellazione commenti) `[ ]`, D.7 `[x]` rimangono come nel piano v3.11.0)
- **Task D.3: Ottimizzazioni del Codice e Documentazione**
    - `[x]` Sub-task D.3.A: Configurazione Linter (ESLint) e Formatter (Prettier).
    - `[ ]` **Sub-task D.3.B: Documentazione Approfondita del Codice e del Progetto.** (Priorità Alta - In corso)
        - `[ ]` D.3.B.1: JSDoc per tutte le funzioni pubbliche e logiche complesse in tutti i file `.js` (iniziare con `register.js`, `profile.js`, `donkeyRunner.js`).
        - `[ ]` D.3.B.2: Commenti inline chiari per passaggi non ovvi.
        - `[ ]` D.3.B.3: Commenti a livello di modulo/file (scopo e responsabilità).
        - `[x]` D.3.B.4: Creare/Aggiornare `documentation/firestore-schema.md`.
        - `[x]` D.3.B.5: Commentare estensivamente le Regole Firestore (`firestore.rules`).
        - `[ ]` D.3.B.6: Revisionare e aggiornare `README.md` del progetto (descrizione, setup, funzionalità).
        - `[x]` D.3.B.7: Mantenere aggiornato il `DEVELOPMENT_PLAN.md`.
- **Task D.4: Test e QA (Quality Assurance)** (Priorità Alta - Da iniziare formalmente)
    - `[ ]` D.4.1: Definire casi di test per le funzionalità di registrazione, login, profilo (visualizzazione, modifica stato/link, navigazione URL), condivisione articoli.
    - `[ ]` D.4.2: Eseguire test manuali e documentare eventuali bug.
    - `[ ]` D.4.3: Testare specificamente l'esperienza utente mobile per le sezioni principali.
- **Task D.8: Integrazioni Esterne e Condivisione**
    - `[x]` Sub-task D.8.1: Implementare Pulsanti di Condivisione (Share Buttons) per articoli.
        - `[ ]` Estendere a Punteggi Giochi (in `donkeyRunner.html`, dopo salvataggio punteggio). (Priorità Media)
    - `[ ]` Sub-task D.8.2: Collegare a GitHub Issues. (Priorità Bassa)
    - `[ ]` Sub-task D.8.3 (Ricerca): Documentazione su widget/embedding. (Priorità Bassa)

---

## Sezione E: Ricerca e Sviluppo a Lungo Termine 🔬📈

- (Task E.1 Propagazione Dati, E.2 Messaggistica Interna rimangono come nel piano v3.11.0 - Priorità Bassa/Futuro)

---

## Sezione F: Fase di Perfezionamento Finale polish

- (Task F.1 Revisione HTML/CSS rimane come nel piano v3.11.0 - Priorità Media, dopo funzionalità principali)

---

## 🌍 ## Fase Successiva (Lungo Termine): Internazionalizzazione (i18n) Completa `[ ]`

## Considerazioni Chiave e Suggerimenti Migliorativi (Aggiornate) 💡

- **Test Regole Firestore:** Continuare a testare meticolosamente le regole Firestore con il simulatore e tramite test funzionali è essenziale per prevenire regressioni e garantire la sicurezza.
- **Modularità Codice JS:** `js/profile.js` e `js/donkeyRunner.js` sono file significativi. Valutare refactoring futuri per estrarre logiche specifiche in moduli più piccoli se la complessità aumenta ulteriormente.
- **Anteprime Link Esterni (AUTH.3.2.2):** La fattibilità dell'ottenimento di anteprime dinamiche (favicon/og:image) richiede una ricerca. Se complesso, optare per icone generiche o un miglioramento stilistico delle card dei link.
- **UX Mobile Donkey Runner:** Il focus su `object-fit: cover` per il canvas in fullscreen landscape è una buona direzione per l'immersività. Il posizionamento dei controlli touch e la gestione del form del punteggio in questa modalità sono cruciali.
- **Documentazione:** Aver completato lo schema Firestore e commentato le regole è un grande passo. Proseguire con JSDoc per il codice JavaScript critico e aggiornare il README.md.
- **Gestione Errori e Feedback Utente:** Continuare a fornire feedback chiari (es. `showToast`) per operazioni asincrone, errori di validazione e caricamento.
- **Performance:** Tenere d'occhio le performance, specialmente per il gioco Donkey Runner su mobile e durante il caricamento di liste (articoli, commenti).

---

## Prossimi Passi Immediati Suggeriti (Nuovo Ordine di Priorità) 🎯

1.  **Task C.2: Ottimizzazione Layout Mobile per Donkey Runner.** (Priorità Attuale - In corso)
    - `[ ]` Sub-task C.2.1: Testare `donkeyRunner.html` su diverse risoluzioni mobile.
    - `[ ]` Sub-task C.2.2: Verificare e ottimizzare controlli touch.
    - `[ ]` Sub-task C.2.3: Assicurare ridimensionamento corretto canvas (`object-fit: cover`).
    - `[ ]` Sub-task C.2.4: Verificare leggibilità testi gioco.
    - `[ ]` Sub-task C.2.5: Implementare logica orientamento landscape in fullscreen.
    - `[ ]` Sub-task C.2.6: Assicurare visibilità e usabilità form punteggio e pulsante Start/Restart mobile in fullscreen.
2.  **Task D.3.B (Documentazione Codice JS):** (Priorità Alta - Da avviare in parallelo o subito dopo C.2)
    - `[ ]` D.3.B.1: JSDoc per funzioni in `js/register.js`, `js/profile.js`, `js/donkeyRunner.js`.
    - `[ ]` D.3.B.2 & D.3.B.3: Commenti inline e a livello di modulo per i file JS principali.
3.  **Task D.4: Test e QA (Quality Assurance).** (Priorità Alta - Dopo C.2 e inizio documentazione JS)
    - `[ ]` D.4.1, D.4.2, D.4.3: Testare formalmente registrazione, profilo, condivisione, e l'esperienza mobile di Donkey Runner.
4.  **Task AUTH.3.3 (Completamento): Link ai Profili Utente.** (Priorità Medio-Alta)
5.  **Task C.3: Miglioramenti Leaderboard & Info Glitchzilla.** (Priorità Media)
6.  **Task AUTH.3.4 (Opzionali Profilo): Iniziare con Mini-Bio Utente.** (Priorità Media)
7.  **Task D.3.B.6: Revisionare e aggiornare `README.md`.** (Priorità Media)

---
