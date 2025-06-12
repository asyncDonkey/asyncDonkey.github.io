# devplan.md - Operazione: Donkey Mobile v2.0 📱🐴

## Visione del Progetto:

Trasformare il gioco web codeDash! in un'applicazione nativa per Android (e successivamente iOS) con un'esperienza utente immersiva e personalizzata, che includa una schermata di caricamento a tema "terminale" e un menu di gioco dedicato, ottimizzata per l'interazione mobile e arricchita da nuove funzionalità.

## Fase 1: Fondamenta del Progetto e Connessione al Backend (COMPLETATA ✔️)

- **Task 1.1: Impostazione dell'Ambiente di Sviluppo**
    - [x] Verificato Node.js e npm.
    - [x] Installata la CLI di Capacitor.
    - [x] Preparato l'ambiente per Android (Android Studio).
    - [ ] Preparazione ambiente iOS (Xcode) - In pausa.
- **Task 1.2: Integrazione di Capacitor nel Progetto**
    - [x] Inizializzato Capacitor con `npx cap init`.
    - [x] Creato il file `capacitor.config.json`.
- **Task 1.3: Aggiunta della Piattaforma Nativa Android**
    - [x] Installato il pacchetto `@capacitor/android`.
    - [x] Creato con successo il progetto nativo nella cartella `android`.
- **Task 1.4: Integrazione Nativa di Firebase**
    - [x] Registrata l'app Android nella console Firebase.
    - [x] Posizionato il file `google-services.json` in `android/app/`.
    - [x] Configurato i file `build.gradle` per includere l'SDK di Firebase.
- **Task 1.5: Installazione Plugin di Autenticazione Nativa**
    - [x] Installato il plugin `@capacitor-firebase/authentication`.
    - [x] Sincronizzato il progetto con `npx cap sync`.
- **Task 1.6: Primo Avvio e Debug Iniziale**
    - [x] L'app si avvia correttamente sull'emulatore.
    - [x] Identificati e risolti errori iniziali di JS (resolve module specifier, assignment to constant variable).
    - [x] Risolto problema `miniLeaderboardList` non trovato all'avvio.

Nota di Seshat: 🥳 Abbiamo costruito fondamenta solidissime! L'app ora è un vero progetto ibrido, collegato a Firebase e pronto per essere modellato. Grande lavoro, Ingegnere!

## Fase 2: The "codeDash!" App Experience (IN CORSO 🚀)

- **Task 2.1: Sviluppo della Schermata di Avvio Immersiva**
    - [x] Riorganizzata la cartella `www`: rinominato l'attuale `index.html` (il gioco) in `game.html`.
    - [x] Creato un nuovo `www/index.html` come punto di ingresso dell'app.
    - [x] Strutturato il nuovo `index.html` per contenere tre sezioni principali: `#terminal-container` (per il loader), `#main-menu` (per il menu), e `#game-container-wrapper` (che ospita il gioco).
    - [x] Creato il file `www/loader.css` per lo stile della schermata di avvio e del menu.
    - [x] Definito stile "terminale" con palette "Dracula" e effetti "cursore lampeggiante" (per il log finale).
    - [x] Implementato animazione "typewriter" e riempimento barre di progresso in `www/js/loader.js`.
    - [x] Aggiustata la velocità di digitazione del terminale e la dimensione dei font per un look "Git Bash".
    - [x] Implementato colore persistente per parole chiave nei messaggi del terminale.
    - [x] Reso il terminale scrollabile.
- **Task 2.2: Refactoring Modulare di donkeyRunner.js**
    - [x] Incapsulata tutta la logica in funzioni esportate: `setupGameEngine()`, `preloadGameAssets()`, `launchGame()`.
    - [x] Rimosse tutte le chiamate di funzione auto-avvianti dalla fine del file, rendendolo controllabile da `loader.js`.
- **Task 2.3: Cablaggio del Menu Principale**
    - [x] In `loader.js`, dopo l'animazione di caricamento, viene mostrato il `#main-menu`.
    - [x] Collegato il pulsante `#start-game-btn` alla funzione `launchGame()` importata da `donkeyRunner.js`.
    - [x] Collegato il pulsante `#leaderboard-btn` per caricare `leaderboard.html`.
    - [x] Collegato il pulsante `#glitchpedia-btn` (attualmente mostra un toast, ma la logica modale è pronta).
    - [x] Sostituito il pulsante `#account-btn` con una piccola icona in basso a destra (`#account-icon-btn`) e cablata al reindirizzamento `profile.html`.
    - [x] Aggiustato il posizionamento del titolo del menu (h1) per non toccare il bordo superiore.
    - [x] Modificato il font dei pulsanti del menu per essere più "da sistema" (Source Code Pro).
    - [x] Risolte interferenze da `styles.css` rimuovendolo da `index.html`.
- **Task 2.4: Ottimizzazione Layout Controlli di Gioco (In Gioco)**
    - [x] Riveduta la posizione dei pulsanti di gioco (`jumpButton`, `shootButton`) per posizionarli quasi all'estrema sinistra e destra dello schermo e molto in basso.
    - [ ] **RISOLVERE: I pulsanti di gioco non ricompaiono dopo il Game Over/Reset.**
    - [x] Riveduta la posizione del pulsante "Ricomincia" (`restartGameBtnDonkey`) nella schermata di Game Over per comparire più in basso e non coprire le scritte.
    - [x] Applicati stili al prompt per le iniziali (`scoreInputContainerDonkey`) e ai pulsanti di salvataggio/condivisione, poiché erano "nudi" (senza stile); reso il box del punteggio più grande e centrato.
    - [x] Rimosso il piccolo pulsante con il punto interrogativo (`creditsIconBtn`).
    - [x] Impostato i pulsanti di gioco (`jumpButton`, `shootButton`) per mostrare solo icone (arrow_circle_up, code) e resi quadrati.
    - [x] Spostata l'icona del profilo (`account-icon-btn`) in alto a destra.
    - [x] Assicurata la corretta visibilità/scomparsa del pulsante profilo/login (`account-icon-btn`) durante gli stati di gioco (visibile in MENU/GAME_OVER, nascosto in PLAYING).
    - [x] Aggiunto un tasto per tornare al menu principale dalla schermata di Game Over (`backToMenuBtn`).

## Fase 3: Nuove Funzionalità e Polish Nativo (IN LAVORAZIONE ✨)

- **Task 3.1: Logica per Boss Multipli**
    - [ ] Progettare una pipeline per l'introduzione di nuovi boss (oltre Glitchzilla).
    - [ ] Definire soglie di punteggio o eventi per l'apparizione di boss successivi.
    - [ ] Creare classi/oggetti per nuovi tipi di boss con pattern di attacco e sprite unici.
    - [ ] Integrare la gestione dei nuovi boss nel `gameLoop` e nel sistema di collisione.
- **Task 3.2: Sistema di Badges/Achievement**
    - [ ] Definire un set di badges sbloccabili (es. "Primo Salto", "1000 Punti", "Glitchzilla Debunked").
    - [ ] Implementare la logica per tracciare il raggiungimento di questi obiettivi durante il gioco.
    - [ ] Integrare i dati dei badges con Firebase (profili utente).
    - [ ] Creare una sezione dedicata ai badges nel profilo utente o in una "Glitchpedia" espansa.
    - [ ] Aggiungere notifiche in-game quando un badge viene sbloccato.
    - [ ] **[DA FARE] Aggiungere la possibilità di condividere i badge ottenuti.**
- **Task 3.3: Configurazione e Ottimizzazione Nativa**
    - [ ] Creare un'icona per l'app e una splash screen (schermata di avvio) personalizzate per Android/iOS.
    - [ ] Forzare l'orientamento dell'app in landscape (orizzontale) tramite le impostazioni native di Android per un'esperienza di gioco ottimale.
    - [ ] Gestire le "safe areas" (notch, barre di sistema) per evitare che elementi UI vengano coperti.
    - [ ] Verificare il comportamento della tastiera virtuale quando si inseriscono i punteggi.
    - [ ] Implementare Feedback Aptico (vibrazione) per azioni di gioco (salto, colpo).
- **Task 3.4: Pulizia Finale del Codice**
    - [ ] Rivedere e pulire i file CSS per rimuovere regole non necessarie o obsolete.
    - [ ] Riorganizzare gli script JS caricati in `index.html` per caricare solo ciò che serve strettamente.
    - [ ] **[DA FARE] Rivedere la logica di condivisione del punteggio (`handleShareScore`) per eventuali miglioramenti.**

---
