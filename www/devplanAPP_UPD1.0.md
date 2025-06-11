# DevPlan: codeDash - Fase 2 (Rifinitura e Funzionalità Avanzate)

*Stato: Base di autenticazione ibrida (Web/Nativa) completata e funzionante. L'architettura è ora modulare e robusta. Pronti per la fase successiva!*

---

## 🎯 Priorità #1: Rifinitura dell'Esperienza di Gioco (Quality of Life)

*Obiettivo: Perfezionare il flusso di gioco per renderlo più intuitivo e professionale.*

- [ ] **UI - Posizione Pulsante "Replay"**:
    -   Analizzare la schermata del salvataggio punteggio.
    -   Spostare il pulsante "Replay" in una posizione più prominente e meno invasiva, probabilmente sotto il riepilogo del punteggio o accanto al pulsante per tornare al menu.

- [ ] **Logica - Pulsante "Condividi"**:
    -   Rimuovere il pulsante "Condividi" dal menu di Game Over iniziale.
    -   Implementare una nuova logica: dopo che l'utente ha salvato con successo il punteggio, mostrare un messaggio di successo ("Punteggio Salvato!") insieme a un nuovo pulsante "Condividi il tuo risultato!".

- [ ] **UI - Visibilità Icona Profilo**:
    -   Identificare l'inizio del gameplay attivo (es. `game.start()`).
    -   Nascondere l'icona del profilo (`#user-avatar-icon`) quando il gioco inizia.
    -   Identificare l'evento di "Game Over".
    -   Mostrare nuovamente l'icona del profilo quando appare la schermata di Game Over.

---

## 👤 Priorità #2: Profilo Utente Avanzato

*Obiettivo: Dare agli utenti maggior controllo e personalizzazione sul proprio profilo per aumentare il coinvolgimento.*

- [ ] **Nickname Personalizzato**:
    -   **Firestore**: Aggiungere un campo `nickname` al documento utente in `appUsers`.
    -   **UI**: Nella modale del profilo, aggiungere un'icona "modifica" accanto al `displayName`.
    -   **Logica**: Al click sull'icona, mostrare un `prompt` o un campo di input per inserire il nuovo nickname. Salvare il nickname in Firestore.
    -   **Regole di Sicurezza**: Aggiornare le regole di Firestore per permettere la modifica del campo `nickname` solo dal proprietario dell'account.

- [ ] **Cooldown Modifica Nickname**:
    -   **Firestore**: Aggiungere un campo `nicknameLastUpdatedAt` (tipo Timestamp) al documento utente.
    -   **Cloud Function (Consigliato)**: Creare una Cloud Function che gestisca la richiesta di cambio nickname. La funzione controllerà se sono passati almeno 14 giorni da `nicknameLastUpdatedAt` prima di approvare la modifica. Questo è più sicuro rispetto a gestire la logica solo sul client.
    -   **UI**: Se non sono passati 14 giorni, il pulsante di modifica nickname deve essere disabilitato o mostrare un tooltip con il tempo rimanente.

---

## 🏆 Priorità #3: Leaderboard Globale

*Obiettivo: Creare una leaderboard dinamica e visivamente accattivante per stimolare la competizione.*

- [ ] **UI - Modale Leaderboard**:
    -   Progettare una nuova modale (`#leaderboardModal`) che si apra al click su un'icona "Leaderboard" nella UI principale.
    -   La modale mostrerà una lista di giocatori con posizione, avatar, nickname e punteggio.

- [ ] **Logica - Recupero Dati**:
    -   Creare una funzione in un nuovo file `leaderboard.js` che recuperi i punteggi dalla collezione `leaderboardScores` (o `appUsers`, a seconda della strategia).
    -   La query dovrà ordinare per `score` in modo decrescente (`orderBy('score', 'desc')`).
    -   **Architettura Chiave**: I punteggi devono fare riferimento allo `userId`. Quando si visualizza la leaderboard, si usa lo `userId` per recuperare i dati del profilo (avatar e nickname aggiornati) dalla collezione `appUsers` in tempo reale. L'uso di `onSnapshot` qui è un'ottima idea per avere una leaderboard che si aggiorna da sola.

---

## ✨ Priorità #4: Ricerca e Sviluppo Grafico (Badges & Icone)

*Obiettivo: Sviluppare un'identità visiva unica e memorabile per i riconoscimenti del gioco.*

- [ ] **Ricerca Icone Open Source**:
    -   Esplorare librerie di icone alternative a Material Symbols.
    -   **Suggerimenti**:
        -   **Tabler Icons**: Stile outline pulito e molto vasto.
        -   **Feather Icons**: Minimaliste ed eleganti.
        -   **Phosphor Icons**: Stile "duotone" molto moderno e flessibile.
        -   **Iconoir**: Una delle librerie open-source più grandi e variegate.
        -   **Game-Icons.net**: Libreria immensa di icone a tema fantasy/gioco, perfette per badge "strani" e unici.

- [ ] **Valutazione Badge Personalizzati (Aseprite)**:
    -   **Proposta**: Creare badge unici e animati in Aseprite è un'idea **fantastica** per dare un tocco speciale!
    -   **Complessità**: Non è eccessivamente complesso. Puoi esportare le animazioni come un singolo file immagine (`spritesheet`).
    -   **Implementazione**: In CSS, si applica lo spritesheet come `background-image` a un `<div>` e si usa un'animazione con `steps()` per scorrere i fotogrammi. Questo darebbe un'identità visiva fortissima al gioco. Si può partire con 2-3 badge speciali per testare il flusso.

---

## 💡 Suggerimenti Proposti (Visione a Lungo Termine)

*Obiettivo: Identificare aree di miglioramento futuro per rendere l'app ancora più solida.*

- [ ] **UI/UX - Consistenza Modali**: Creare un gestore di modali centralizzato in `uiUtils.js` per garantire che tutte le modali (Profilo, Leaderboard, Impostazioni) abbiano lo stesso comportamento di apertura/chiusura e le stesse animazioni.
- [ ] **Performance - Ottimizzazione Immagini**: Per quando implementerai l'upload di avatar personalizzati, valutare un'estensione Firebase come **"Resize Images"** che crea automaticamente miniature ottimizzate per non rallentare il caricamento di leaderboard e profili.
- [ ] **Gamification - Sfide Giornaliere/Settimanali**: Introdurre un sistema di sfide (es. "Raccogli 50 monete in una partita") che si resettano periodicamente, per mantenere gli utenti attivi e premiarli con piccoli bonus.
- [ ] **Accessibilità (a11y)**: Rivedere tutti gli elementi interattivi (pulsanti, link, modali) per assicurarsi che siano accessibili tramite tastiera e screen reader, usando attributi ARIA appropriati.

---

Ancora complimenti per il traguardo raggiunto. Questo piano ci guiderà verso una versione ancora più incredibile di `codeDash!`.