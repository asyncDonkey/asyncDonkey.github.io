# Piano di Test per asyncDonkey.io (v1.1)

**Data:** 17 maggio 2025
**Versione Piano di Sviluppo di Riferimento:** v3.17.1
**Esito Generale Test:** DA ESEGUIRE

## Changelog da v1.0

- **ART-007 (Interazioni Articolo - Commenti):** Aggiornato il risultato atteso per i commenti da parte di utenti non loggati. Ora ci si aspetta che l'UI richieda il login, in linea con `BUGFIX-001.1`.
- **ISSUE-DR-001 (Issue Specifiche Donkey Runner):** Aggiornato il risultato atteso per riflettere la correzione dei permessi Firestore (`BUGFIX-001.2`, `BUGFIX-001.3`). L'invio di Bug Report e Feature Request da `donkeyRunner.html` ora dovrebbe funzionare.
- **ISSUE-001 e ISSUE-002 (Issue Tracker Generale):** I test rimangono concettualmente gli stessi, ma la loro validità è rafforzata dalla correzione delle regole Firestore (`BUGFIX-001.4`).

## Indice

1.  [Registrazione Utente (Pagina register.html)](#1-registrazione-utente-pagina-registerhtml)
2.  [Login Utente (Modale di Login e Autenticazione Generale)](#2-login-utente-modale-di-login-e-autenticazione-generale)
3.  [Profilo Utente (profile.html)](#3-profilo-utente-profilehtml)
4.  [Workflow Articoli (Sottomissione, Revisione, Visualizzazione)](#4-workflow-articoli-sottomissione-revisione-visualizzazione)
5.  [Issue Tracker (contribute.html e donkeyRunner.html)](#5-issue-tracker-contributehtml-e-donkeyrunnerhtml)
6.  [Donkey Runner (UI/UX e Integrazione)](#6-donkey-runner-uiux-e-integrazione)
7.  [Test UI/UX Generali (Task D.4.3)](#7-test-uiux-generali-task-d43)

---

## 1. Registrazione Utente (Pagina `register.html`)

### [ ] REG-001: Registrazione utente con dati validi

- **Precondizioni:** L'utente non è loggato. L'email utilizzata non è già presente nel sistema.
- **Passi:**
    1.  Navigare alla pagina `register.html`.
    2.  Compilare il campo "Email" con un indirizzo email valido e unico (es. `testuser_[timestamp]@example.com`).
    3.  Compilare il campo "Password" con una password valida (es. `Password123!`).
    4.  Compilare il campo "Conferma Password" con la stessa password.
    5.  Compilare il campo "Nickname" con un nickname valido (es. `TestUser_[timestamp]`, min 3, max 25 caratteri alfanumerici, `_`, `.`, `-`).
    6.  Selezionare una "Nazionalità" dal menu a tendina.
    7.  Cliccare sul pulsante "Registrati".
- **Risultato Atteso:**
    1.  L'utente viene creato in Firebase Authentication.
    2.  Un documento profilo viene creato nella collezione `userProfiles` in Firestore con i dati forniti (`email`, `nickname`, `nationalityCode`, `isAdmin: false`, `createdAt`, `statusMessage: ""`, `externalLinks: []`, `earnedBadges: []`, `bio: ""`).
    3.  Un messaggio di successo viene visualizzato sulla pagina (es. "Registrazione completata! Ti abbiamo inviato un'email di verifica...").
    4.  Un'email di verifica viene inviata all'indirizzo email fornito (verificare messaggio UI che lo indica).
    5.  L'utente potrebbe essere reindirizzato alla homepage o alla pagina del profilo.
    6.  Al primo login _post-verifica_, un toast di benvenuto dovrebbe apparire (es. "Benvenuto/a su asyncDonkey.io, {Nickname}!").

### [ ] REG-002: Tentativo di registrazione con email già in uso

- **Precondizioni:** L'utente non è loggato. Esiste già un utente registrato con l'email `existinguser@example.com`.
- **Passi:**
    1.  Navigare alla pagina `register.html`.
    2.  Compilare il campo "Email" con `existinguser@example.com`.
    3.  Compilare gli altri campi obbligatori con dati validi.
    4.  Cliccare sul pulsante "Registrati".
- **Risultato Atteso:**
    1.  Viene visualizzato un messaggio di errore specifico per l'email (es. "L'indirizzo email è già utilizzato da un altro account.").
    2.  L'utente non viene creato.

### [ ] REG-003: Tentativo di registrazione con password non corrispondenti

- **Precondizioni:** L'utente non è loggato.
- **Passi:**
    1.  Navigare alla pagina `register.html`.
    2.  Compilare i campi "Email", "Nickname", "Nazionalità" con dati validi.
    3.  Compilare il campo "Password" con `Password123!`.
    4.  Compilare il campo "Conferma Password" con `PasswordDiverse?`.
    5.  Cliccare sul pulsante "Registrati".
- **Risultato Atteso:**
    1.  Viene visualizzato un messaggio di errore specifico per la conferma password (es. "Le password non corrispondono.").
    2.  L'utente non viene creato.

### [ ] REG-004: Tentativo di registrazione con password debole

- **Precondizioni:** L'utente non è loggato.
- **Passi:**
    1.  Navigare alla pagina `register.html`.
    2.  Compilare i campi "Email", "Nickname", "Nazionalità" con dati validi.
    3.  Compilare il campo "Password" con una password debole (es. `pass`).
    4.  Compilare il campo "Conferma Password" con la stessa password debole.
    5.  Cliccare sul pulsante "Registrati".
- **Risultato Atteso:**
    1.  Viene visualizzato un messaggio di errore specifico per la debolezza della password (es. "La password deve essere di almeno 8 caratteri." o "La password deve contenere almeno una maiuscola, una minuscola e un numero.").
    2.  L'utente non viene creato.

### [ ] REG-005: Tentativo di registrazione con campi obbligatori mancanti

- **Precondizioni:** L'utente non è loggato.
- **Passi:**
    1.  Navigare alla pagina `register.html`.
    2.  Provare a cliccare "Registrati" senza compilare alcun campo.
    3.  Compilare un campo alla volta e tentare la registrazione, lasciando gli altri obbligatori vuoti.
- **Risultato Atteso:**
    1.  Per ogni campo obbligatorio mancante, viene visualizzato un messaggio di errore specifico.
    2.  L'utente non viene creato.

### [ ] REG-006: Validazione formato nickname

- **Precondizioni:** L'utente non è loggato.
- **Passi:**
    1.  Navigare alla pagina `register.html`.
    2.  Compilare tutti gli altri campi obbligatori con dati validi.
    3.  Tentare di registrarsi con nickname:
        - Troppo corto (es. `ab`).
        - Troppo lungo (es. più di 25 caratteri).
        - Con caratteri non permessi (es. `nick con spazi`).
- **Risultato Atteso:**
    1.  Per ogni formato non valido, viene visualizzato un messaggio di errore appropriato.
    2.  L'utente non viene creato.

### [ ] REG-007: Verifica link "Accedi qui"

- **Precondizioni:** L'utente si trova sulla pagina `register.html`.
- **Passi:**
    1.  Cliccare sul link "Accedi qui".
- **Risultato Atteso:**
    1.  La modale di login (`loginModal`) si apre correttamente.

---

## 2. Login Utente (Modale di Login e Autenticazione Generale)

### [ ] LOG-001: Login con credenziali valide (email verificata)

- **Precondizioni:** Esiste un utente registrato con email `verifieduser@example.com` e password `Password123!`, e la sua email è stata verificata. L'utente non è loggato.
- **Passi:**
    1.  Aprire la modale di login.
    2.  Inserire `verifieduser@example.com` e `Password123!`.
    3.  Cliccare "Login".
- **Risultato Atteso:**
    1.  Login successo. Modale chiusa. UI header aggiornata. Link condizionali visibili. Toast di benvenuto (se applicabile).

### [ ] LOG-002: Login con credenziali valide (email NON verificata)

- **Precondizioni:** Esiste utente `unverifieduser@example.com` con password `Password123!`, email NON verificata. L'utente non è loggato.
- **Passi:**
    1.  Aprire modale login.
    2.  Inserire `unverifieduser@example.com` e `Password123!`.
    3.  Cliccare "Login".
- **Risultato Atteso:**
    1.  Login successo. Modale chiusa. UI header aggiornata.
    2.  Navigando a `profile.html`, è visibile il banner di verifica email.

### [ ] LOG-003: Tentativo di login con password errata

- **Precondizioni:** Esiste utente `testuser@example.com`. L'utente non è loggato.
- **Passi:**
    1.  Aprire modale login.
    2.  Inserire `testuser@example.com` e password errata.
    3.  Cliccare "Login".
- **Risultato Atteso:**
    1.  Messaggio di errore nella modale (es. "Password errata."). Utente non loggato. Modale aperta.

### [ ] LOG-004: Tentativo di login con email non esistente

- **Precondizioni:** L'utente non è loggato. Email `nonexistentuser@example.com` non registrata.
- **Passi:**
    1.  Aprire modale login.
    2.  Inserire `nonexistentuser@example.com` e password qualsiasi.
    3.  Cliccare "Login".
- **Risultato Atteso:**
    1.  Messaggio di errore nella modale (es. "Nessun utente trovato con questa email."). Utente non loggato. Modale aperta.

### [ ] LOG-005: Logout

- **Precondizioni:** Utente loggato.
- **Passi:**
    1.  Cliccare "Logout" nell'header.
- **Risultato Atteso:**
    1.  Utente sloggato. UI header aggiornata (Login/Register visibili). Link condizionali nascosti. Reindirizzamento da pagine protette. Toast di conferma.

---

## 3. Profilo Utente (`profile.html`)

### [ ] PROF-001: Visualizzazione Proprio Profilo

- **Precondizioni:** Utente loggato con email verificata.
- **Passi:**
    1.  Navigare a `profile.html`.
- **Risultato Atteso:**
    1.  Dati corretti visualizzati: email, nickname, nazionalità, avatar.
    2.  Sezioni "Stato d'Animo", "Link Esterni", "I Miei Articoli" visibili e funzionanti.
    3.  Banner verifica email NON visibile.

### [ ] PROF-002: Visualizzazione Profilo Altrui (tramite URL `?userId=xxx`)

- **Precondizioni:** Esiste utente "OtherUser" con UID `otherUserId123`. Utente corrente loggato o non.
- **Passi:**
    1.  Navigare a `profile.html?userId=otherUserId123`.
- **Risultato Atteso:**
    1.  Dati pubblici di "OtherUser" visualizzati: nickname, nazionalità, avatar. Email NON visibile.
    2.  "Stato d'Animo" e "Link Esterni" di "OtherUser" visibili, ma NON i form per modificarli.
    3.  Sezione "I Miei Articoli" NON visibile.

### [ ] PROF-003: Profilo Altrui Non Esistente (URL con `userId` non valido)

- **Precondizioni:** Utente corrente loggato o non.
- **Passi:**
    1.  Navigare a `profile.html?userId=invalidOrNonExistentUserId`.
- **Risultato Atteso:**
    1.  Messaggio "Profilo utente non trovato". Sezioni di modifica e "I Miei Articoli" non visibili.

### [ ] PROF-004: Modifica Stato d'Animo

- **Precondizioni:** Utente loggato visualizza il proprio profilo.
- **Passi:**
    1.  Modificare lo stato d'animo.
    2.  Svuotare il campo e aggiornare.
    3.  Provare stato troppo lungo (se validazione implementata).
- **Risultato Atteso:**
    1.  Stato aggiornato in UI e Firestore. Toast di conferma. Validazione lunghezza (se presente) funziona.

### [ ] PROF-005: Gestione Link Esterni (CRUD)

- **Precondizioni:** Utente loggato visualizza il proprio profilo.
- **Passi:**
    1.  Aggiungere, modificare, eliminare link.
    2.  Testare limite massimo link (5).
    3.  Testare input invalidi (titolo mancante, URL non valido/vuoto).
- **Risultato Atteso:**
    1.  CRUD funziona (UI e Firestore). Toast di conferma.
    2.  Limite massimo rispettato.
    3.  Errori per input invalidi. UI form corretta.

### [ ] PROF-006: Reinvio Email di Verifica (per utente non verificato)

- **Precondizioni:** Utente loggato con email NON verificata, visualizza proprio profilo.
- **Passi:**
    1.  Cliccare "Invia di nuovo email di verifica".
    2.  Attendere e cliccare di nuovo.
- **Risultato Atteso:**
    1.  Messaggio UI conferma invio. Toast di conferma. Pulsante temporaneamente disabilitato.

### [ ] PROF-007: Visualizzazione "I Miei Articoli"

- **Precondizioni:** Utente loggato con articoli in vari stati (draft, pendingReview, published, rejected con rejectionReason).
- **Passi:**
    1.  Navigare al proprio profilo. Esaminare la sezione "I Miei Articoli".
- **Risultato Atteso:**
    1.  Articoli visualizzati correttamente nelle rispettive sezioni.
    2.  Card articolo mostra titolo, data, stato.
    3.  **Bozze:** Pulsanti "Modifica" e "Elimina".
    4.  **In Revisione:** Pulsante "Anteprima".
    5.  **Pubblicati:** Pulsante "Visualizza".
    6.  **Respinti:** Mostra `rejectionReason`. Pulsanti "Crea da Questo Articolo" e "Elimina Respinto".
    7.  Messaggio appropriato se una categoria è vuota.

---

## 4. Workflow Articoli (Sottomissione, Revisione, Visualizzazione)

### [ ] ART-001: Sottomissione Nuovo Articolo per Revisione

- **Precondizioni:** Utente loggato.
- **Passi:**
    1.  Navigare a `submit-article.html`. Compilare campi obbligatori e opzionali. Cliccare "Invia per Revisione".
- **Risultato Atteso:**
    1.  Articolo salvato in Firestore con `status: 'pendingReview'`. Dati corretti. Toast di conferma. Form resettato.

### [ ] ART-002: Salvataggio Bozza

- **Precondizioni:** Utente loggato.
- **Passi:**
    1.  Navigare a `submit-article.html`. Compilare alcuni campi. Cliccare "Salva Bozza".
- **Risultato Atteso:**
    1.  Articolo salvato con `status: 'draft'`. URL aggiornato con `draftId`. Toast conferma. Dati rimangono nel form. Pulsanti aggiornati.

### [ ] ART-003: Modifica Bozza e Invio per Revisione

- **Precondizioni:** Utente loggato. Esiste una bozza.
- **Passi:**
    1.  Da `profile.html`, cliccare "Modifica" su una bozza.
    2.  Modificare campi. Cliccare "Aggiorna Bozza".
    3.  Cliccare "Aggiorna e Invia per Revisione".
- **Risultato Atteso:**
    1.  Bozza aggiornata. Toast. (Dopo "Aggiorna Bozza")
    2.  Articolo aggiornato a `pendingReview`. Toast. Form resettato. URL senza `draftId`. Articolo spostato da Bozze a In Revisione nel profilo. (Dopo "Aggiorna e Invia")

### [ ] ART-004: Admin - Approva Articolo (da `admin-dashboard.html`)

- **Precondizioni:** Admin loggato. Esiste articolo `pendingReview`.
- **Passi:**
    1.  Admin naviga a `admin-dashboard.html`. Trova articolo. (Opzionale) Modifica. Clicca "Approva". Conferma.
- **Risultato Atteso:**
    1.  Articolo `status: 'published'`, `publishedAt` impostato. Visibile pubblicamente. Spostato da "Pending" a "Pubblicati" in admin dashboard. Toast.

### [ ] ART-005: Admin - Respingi Articolo con Motivo (da `admin-dashboard.html`)

- **Precondizioni:** Admin loggato. Esiste articolo `pendingReview`.
- **Passi:**
    1.  Admin naviga a `admin-dashboard.html`. Trova articolo. Clicca "Respingi". Inserisce motivo nella modale. Conferma.
- **Risultato Atteso:**
    1.  Articolo `status: 'rejected'`, `rejectionReason` salvato. Spostato da "Pending" a "Respinti" (se sezione esiste). Autore vede motivo nel profilo. Toast.

### [ ] ART-006: Visualizzazione Articolo Pubblicato (`view-article.html`)

- **Precondizioni:** Esiste articolo pubblicato.
- **Passi:**
    1.  Navigare a `view-article.html?id=publishedArticleId123`.
- **Risultato Atteso:**
    1.  Articolo visualizzato correttamente (titolo, autore, data, tags, contenuto Markdown, immagine copertina).
    2.  Sezioni commenti e Likes funzionanti. Pulsanti condivisione presenti. Meta tag Open Graph popolati.

### [ ] ART-007: Interazioni Articolo (Like e Commenti)

- **Precondizioni:** Utente loggato. Articolo pubblicato.
- **Passi (Like):**
    1.  Visualizzare articolo. Cliccare "Like" (🤍). Ricaricare. Cliccare "Like" (💙). Aprire modale "Persone a cui piace".
- **Risultato Atteso (Like):**
    1.  Conteggio like e stato UI/Firestore corretti. Persistenza. Modale likers corretta.
- **Passi (Commenti):**
    1.  _(Utente Loggato)_ Visualizzare articolo. Scrivere commento. Inviare. Mettere like a un commento.
    2.  **(MODIFICATO)** _(Utente NON Loggato)_ Visualizzare articolo. Tentare di commentare.
- **Risultato Atteso (Commenti):**
    1.  _(Loggato)_ Commento aggiunto a lista e Firestore. `commentCount` articolo incrementato. Avatar, nome, bandiera corretti. Like a commenti funziona. Modale likers commenti funziona.
    2.  **(MODIFICATO)** _(NON Loggato)_ L'UI dovrebbe indicare che è necessario il login per commentare (es. form nascosto, messaggio "Devi essere loggato..."). Non deve essere possibile inviare commenti.

### [ ] ART-008: Condivisione Articolo (`navigator.share` e fallback)

- **Precondizioni:** Articolo visualizzato.
- **Passi:**
    1.  Provare pulsante "Condividi..." (se `navigator.share` supportato).
    2.  Provare pulsanti fallback (Copia Link, X, Facebook).
- **Risultato Atteso:**
    1.  `navigator.share`: UI nativa condivisione si apre con dati precompilati.
    2.  Copia Link: Link copiato. Toast.
    3.  Fallback Social: Nuova tab/finestra con URL condivisione corretto.

---

## 5. Issue Tracker (`contribute.html` e `donkeyRunner.html`)

### [ ] ISSUE-001: Invio Nuova Issue (Generale - `contribute.html` - utente loggato)

- **Precondizioni:** Utente loggato.
- **Passi:**
    1.  Navigare a `contribute.html`. Compilare form nuova issue (titolo opzionale, descrizione, tipo, gioco se `gameIssue`). Cliccare "Invia".
- **Risultato Atteso:**
    1.  Issue creata in `userIssues` Firestore con dati corretti. UI lista issue aggiornata. Form resettato. Toast.

### [ ] ISSUE-DR-001: Invio Nuova Issue specifica Donkey Runner (da `donkeyRunner.html`)

- **Precondizioni:** Utente loggato e non loggato (provare entrambi).
- **Passi:**
    1.  Navigare a `donkeyRunner.html`. Scorrere a sezione "Segnala un Bug / Suggerisci Miglioramento".
    2.  Compilare form "Segnala Bug" (se non loggato, opzionalmente email). Cliccare "Invia Segnalazione Bug".
    3.  Compilare form "Suggerisci Miglioramento" (descrizione obbligatoria). Cliccare "Invia Suggerimento".
- **Risultato Atteso:**
    1.  **(MODIFICATO)** Le segnalazioni (bug/feature) vengono inviate e create nelle rispettive collezioni (`bugReports`, `featureRequests`) in Firestore con `pageContext: "donkeyRunnerGame"`.
    2.  L'UI del form si resetta e mostra un messaggio di successo/toast.
    3.  Se utente loggato, `userId` e info utente (da profilo) vengono salvate con l'issue.
    4.  Se utente non loggato e fornisce email per bug report, questa viene salvata.

### [ ] ISSUE-002: Upvote Issue (`contribute.html` - utente loggato)

- **Precondizioni:** Utente loggato. Esistono issue.
- **Passi:**
    1.  Navigare a `contribute.html`. Cliccare upvote (👍) su un'issue. Ricaricare. Cliccare di nuovo upvote.
- **Risultato Atteso:**
    1.  Conteggio upvote e stato UI/Firestore corretti. Persistenza. Secondo click rimuove upvote.

### [ ] ISSUE-003: Filtro Issue (`contribute.html` - per tipo/stato)

- **Precondizioni:** Esistono issue con tipi e stati differenti.
- **Passi:**
    1.  Navigare a `contribute.html`. Usare filtri per tipo/stato. Cliccare "Applica Filtri". Provare combinazioni e reset.
- **Risultato Atteso:**
    1.  Lista issue aggiornata correttamente. Messaggio se nessun risultato. Reset filtri funziona.

### [ ] ISSUE-004: Admin - Modifica Stato Issue (da `admin-dashboard.html`)

- **Precondizioni:** Admin loggato. Esistono issue.
- **Passi:**
    1.  Admin naviga a `admin-dashboard.html`. Cambia stato issue usando select. Verificare su `contribute.html`.
- **Risultato Atteso:**
    1.  Stato issue aggiornato in Firestore. UI admin e `contribute.html` riflettono modifica. Toast.

---

## 6. Donkey Runner (UI/UX e Integrazione)

### [ ] DR-001: Layout Mobile e Fullscreen

- **Precondizioni:** Nessuna.
- **Passi:**
    1.  Aprire `donkeyRunner.html` su mobile/emulatore (portrait/landscape). Avviare gioco. Attivare fullscreen. Giocare. Visualizzare form punteggio in fullscreen.
- **Risultato Atteso:**
    1.  Controlli Touch: Visibili, accessibili, utilizzabili, non sovrapposti.
    2.  Canvas: Adattamento corretto, giocabilità mantenuta.
    3.  Testi: Leggibili, non tagliati.
    4.  Form Punteggio: Visibile e utilizzabile in fullscreen (specie landscape) senza che tastiera virtuale copra.
    5.  Pulsanti Start/Restart Mobile: Visibili e utilizzabili.

### [ ] DR-002: Salvataggio Punteggio - Ospite

- **Precondizioni:** Utente NON loggato.
- **Passi:**
    1.  Giocare, punteggio > 0. Al Game Over, inserire iniziali. Cliccare "Salva Punteggio".
- **Risultato Atteso:**
    1.  Punteggio salvato in `leaderboardScores` (`userId: null`, `initials` corrette, `userName` = `initials`, `gameId: "donkeyRunner"`, `score`, `timestamp`). Mini-leaderboard aggiornata. Toast. Form scompare.

### [ ] DR-003: Salvataggio Punteggio - Utente Loggato

- **Precondizioni:** Utente loggato.
- **Passi:**
    1.  Giocare, punteggio > 0. Al Game Over, form mostra nickname precompilato. Cliccare "Salva Punteggio".
- **Risultato Atteso:**
    1.  Punteggio salvato in `leaderboardScores` (`userId`, `userName` (nickname), `initials` (da nickname), `nationalityCode`, `gameId`, `score`, `timestamp`). Mini-leaderboard aggiornata. Toast. Form scompare.

### [ ] DR-004: Commenti Guestbook Donkey Runner (`pageId: "donkeyRunnerGame"`)

- **Precondizioni:** Utente loggato e non loggato (provare entrambi).
- **Passi:**
    1.  Navigare a `donkeyRunner.html`. Scorrere a Guestbook.
    2.  Se non loggato, inserire nome e messaggio. Inviare.
    3.  Se loggato, inserire messaggio. Inviare.
    4.  Mettere like a un commento.
- **Risultato Atteso:**
    1.  Commenti salvati in `guestbookEntries` con `pageId: "donkeyRunnerGame"`.
    2.  Commenti visualizzati correttamente (avatar, nome/nickname, bandiera, data, messaggio).
    3.  Funzionalità "like" commenti guestbook gioco funziona.

---

## 7. Test UI/UX Generali (Task D.4.3)

Eseguire su diverse risoluzioni (desktop, tablet, mobile) e browser.

### [ ] UXM-001: Navigazione Mobile

- **Descrizione:** Verificare navigazione fluida e accessibile su schermi piccoli per tutte le pagine principali.
- **Passi:**
    1.  Aprire ogni pagina su mobile. Interagire con menu header, link footer, link interni. Verificare scrolling.
- **Risultato Atteso:**
    1.  Menu header usabile. Elementi non sovrapposti. Testo leggibile. Scrolling fluido. Link funzionanti.

### [ ] UXM-002: Leggibilità Testi su Mobile

- **Descrizione:** Controllare dimensione e contrasto font su mobile.
- **Passi:**
    1.  Aprire ogni pagina su mobile. Esaminare testi principali.
- **Risultato Atteso:**
    1.  Testi leggibili senza zoom eccessivo. Contrasto sufficiente. Font adattati.

### [ ] UXM-003: Usabilità Form su Mobile

- **Descrizione:** Verificare usabilità di tutti i form su mobile.
- **Passi:**
    1.  Aprire ogni pagina/modale con form su mobile. Compilare campi. Interagire con `select`, `textarea`, ecc. Verificare tastiera virtuale. Inviare form.
- **Risultato Atteso:**
    1.  Campi selezionabili, focus chiaro. Tastiera non copre. `select` utilizzabili. Pulsanti invio accessibili. Validazione e messaggi errore visibili.

### [ ] UXM-004: Notifiche Toast su Mobile

- **Descrizione:** Verificare visualizzazione e leggibilità notifiche toast su mobile.
- **Passi:**
    1.  Eseguire azioni che scatenano toast su mobile.
- **Risultato Atteso:**
    1.  Toast visibili, non coprono permanentemente. Testo leggibile. Scompaiono/chiudibili. Gestione multipli toast corretta.
