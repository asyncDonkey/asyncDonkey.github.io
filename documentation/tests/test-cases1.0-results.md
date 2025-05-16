# Piano di Test per asyncDonkey.io

**Data:** 16 maggio 2025
**Versione Piano di Sviluppo di Riferimento:** v3.14.0
**Esito Generale Test:** PARZIALMENTE SUPERATO (Vedi dettagli sotto)

## Indice

1.  [Registrazione Utente (Pagina register.html)](#1-registrazione-utente-pagina-registerhtml)
2.  [Login Utente (Modale di Login e Autenticazione Generale)](#2-login-utente-modale-di-login-e-autenticazione-generale)
3.  [Profilo Utente (profile.html)](#3-profilo-utente-profilehtml)
4.  [Workflow Articoli (Sottomissione, Revisione, Visualizzazione)](#4-workflow-articoli-sottomissione-revisione-visualizzazione)
5.  [Issue Tracker (contribute.html)](#5-issue-tracker-contributehtml)
6.  [Donkey Runner (UI/UX e Integrazione)](#6-donkey-runner-uiux-e-integrazione)
7.  [Test UI/UX Generali (Task D.4.3)](#7-test-uiux-generali-task-d43)

---

## 1. Registrazione Utente (Pagina `register.html`)

### [X] REG-001: Registrazione utente con dati validi

- **Esito:** SUPERATO
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
    4.  Un'email di verifica viene inviata all'indirizzo email fornito (verificare messaggio UI che lo indica, non l'effettivo invio email in test manuale se non configurato).
    5.  L'utente potrebbe essere reindirizzato alla homepage o alla pagina del profilo (verificare comportamento specifico).
    6.  Al primo login _post-verifica_, un toast di benvenuto dovrebbe apparire (es. "Benvenuto/a su asyncDonkey.io, {Nickname}!").

### [X] REG-002: Tentativo di registrazione con email già in uso

- **Esito:** SUPERATO
- **Precondizioni:** L'utente non è loggato. Esiste già un utente registrato con l'email `existinguser@example.com`.
- **Passi:**
    1.  Navigare alla pagina `register.html`.
    2.  Compilare il campo "Email" con `existinguser@example.com`.
    3.  Compilare gli altri campi obbligatori con dati validi.
    4.  Cliccare sul pulsante "Registrati".
- **Risultato Atteso:**
    1.  Viene visualizzato un messaggio di errore specifico per l'email (es. "L'indirizzo email è già utilizzato da un altro account." o simile, come da `translateFirebaseError('auth/email-already-in-use')`).
    2.  L'utente non viene creato in Firebase Authentication né in Firestore.

### [X] REG-003: Tentativo di registrazione con password non corrispondenti

- **Esito:** SUPERATO
- **Precondizioni:** L'utente non è loggato.
- **Passi:**
    1.  Navigare alla pagina `register.html`.
    2.  Compilare i campi "Email", "Nickname", "Nazionalità" con dati validi.
    3.  Compilare il campo "Password" con `Password123!`.
    4.  Compilare il campo "Conferma Password" con `PasswordDiverse?`.
    5.  Cliccare sul pulsante "Registrati".
- **Risultato Atteso:**
    1.  Viene visualizzato un messaggio di errore specifico per la conferma password (es. "Le password non corrispondono." nel `confirmPasswordErrorDiv`).
    2.  L'utente non viene creato.

### [X] REG-004: Tentativo di registrazione con password debole

- **Esito:** SUPERATO
- **Precondizioni:** L'utente non è loggato.
- **Passi:**
    1.  Navigare alla pagina `register.html`.
    2.  Compilare i campi "Email", "Nickname", "Nazionalità" con dati validi.
    3.  Compilare il campo "Password" con una password debole (es. `pass`, meno di 8 caratteri, senza maiuscole/numeri).
    4.  Compilare il campo "Conferma Password" con la stessa password debole.
    5.  Cliccare sul pulsante "Registrati".
- **Risultato Atteso:**
    1.  Viene visualizzato un messaggio di errore specifico per la debolezza della password (es. "La password deve essere di almeno 8 caratteri." o "La password deve contenere almeno una maiuscola, una minuscola e un numero." nel `passwordErrorDiv`).
    2.  L'utente non viene creato.

### [X] REG-005: Tentativo di registrazione con campi obbligatori mancanti

- **Esito:** SUPERATO
- **Precondizioni:** L'utente non è loggato.
- **Passi:**
    1.  Navigare alla pagina `register.html`.
    2.  Provare a cliccare "Registrati" senza compilare alcun campo.
    3.  Compilare un campo alla volta e tentare la registrazione, lasciando gli altri obbligatori vuoti.
        - Manca Email.
        - Manca Password.
        - Manca Conferma Password.
        - Manca Nickname.
        - Manca Nazionalità.
- **Risultato Atteso:**
    1.  Per ogni campo obbligatorio mancante, viene visualizzato un messaggio di errore specifico vicino al campo corrispondente (es. "L'email è obbligatoria.", "Il nickname è obbligatorio.", ecc.).
    2.  L'utente non viene creato.

### [X] REG-006: Validazione formato nickname

- **Esito:** SUPERATO
- **Precondizioni:** L'utente non è loggato.
- **Passi:**
    1.  Navigare alla pagina `register.html`.
    2.  Compilare tutti gli altri campi obbligatori con dati validi.
    3.  Tentare di registrarsi con nickname:
        - Troppo corto (es. `ab`).
        - Troppo lungo (es. un nome con più di 25 caratteri).
        - Con caratteri non permessi (es. `nick con spazi`, `nick!@#`).
        - Valido ma con solo trattini/punti (es. `---`).
- **Risultato Atteso:**
    1.  Per ogni formato non valido, viene visualizzato un messaggio di errore appropriato nel `nicknameErrorDiv` (es. "Il nickname deve avere tra 3 e 25 caratteri.", "Il nickname può contenere solo lettere, numeri, underscore, punto o trattino.").
    2.  L'utente non viene creato.

### [X] REG-007: Verifica link "Accedi qui"

- **Esito:** SUPERATO
- **Precondizioni:** L'utente si trova sulla pagina `register.html`.
- **Passi:**
    1.  Individuare il link "Accedi qui" nella sezione "Hai già un account?".
    2.  Cliccare sul link "Accedi qui".
- **Risultato Atteso:**
    1.  La modale di login (`loginModal`) si apre correttamente.
    2.  Il form di registrazione rimane visibile o viene nascosto/sostituito dalla modale (verificare comportamento).

---

## 2. Login Utente (Modale di Login e Autenticazione Generale)

### [X] LOG-001: Login con credenziali valide (email verificata)

- **Esito:** SUPERATO
- **Precondizioni:** Esiste un utente registrato con email `verifieduser@example.com` e password `Password123!`, e la sua email è stata verificata. L'utente non è loggato.
- **Passi:**
    1.  Da qualsiasi pagina che contenga il pulsante "Login", cliccare "Login" per aprire la modale.
    2.  Inserire `verifieduser@example.com` nel campo email.
    3.  Inserire `Password123!` nel campo password.
    4.  Cliccare sul pulsante "Login" della modale.
- **Risultato Atteso:**
    1.  Login成功 (Successo). La modale si chiude.
    2.  L'UI dell'header si aggiorna per mostrare l'avatar e il nickname/display name dell'utente e il pulsante "Logout". I pulsanti "Login" e "Register" sono nascosti.
    3.  I link di navigazione condizionali (es. "Scrivi Articolo", "Profile") diventano visibili.
    4.  Se applicabile (es. primo login dopo verifica o nessuna interazione precedente), viene mostrato un toast di benvenuto.
    5.  Eventuale reindirizzamento a pagina profilo o homepage (verificare).

### [X] LOG-002: Login con credenziali valide (email NON verificata)

- **Esito:** SUPERATO
- **Precondizioni:** Esiste un utente registrato con email `unverifieduser@example.com` e password `Password123!`, ma la sua email NON è stata verificata. L'utente non è loggato.
- **Passi:**
    1.  Aprire la modale di login.
    2.  Inserire `unverifieduser@example.com` nel campo email.
    3.  Inserire `Password123!` nel campo password.
    4.  Cliccare "Login".
- **Risultato Atteso:**
    1.  Login成功. La modale si chiude.
    2.  L'UI dell'header si aggiorna come in LOG-001.
    3.  Navigando alla pagina `profile.html`, dovrebbe essere visibile un banner/messaggio che invita a verificare l'email (es. con il pulsante "Invia di nuovo email di verifica").

### [X] LOG-003: Tentativo di login con password errata

- **Esito:** SUPERATO
- **Precondizioni:** Esiste un utente registrato con email `testuser@example.com`. L'utente non è loggato.
- **Passi:**
    1.  Aprire la modale di login.
    2.  Inserire `testuser@example.com` nel campo email.
    3.  Inserire una password errata (es. `wrongpassword`).
    4.  Cliccare "Login".
- **Risultato Atteso:**
    1.  Viene visualizzato un messaggio di errore nella modale (es. "Password errata." o traduzione di `auth/wrong-password`).
    2.  L'utente non viene loggato. La modale rimane aperta.

### [X] LOG-004: Tentativo di login con email non esistente

- **Esito:** SUPERATO
- **Precondizioni:** L'utente non è loggato. L'email `nonexistentuser@example.com` non è registrata.
- **Passi:**
    1.  Aprire la modale di login.
    2.  Inserire `nonexistentuser@example.com` nel campo email.
    3.  Inserire una password qualsiasi.
    4.  Cliccare "Login".
- **Risultato Atteso:**
    1.  Viene visualizzato un messaggio di errore nella modale (es. "Nessun utente trovato con questa email." o traduzione di `auth/user-not-found`).
    2.  L'utente non viene loggato. La modale rimane aperta.

### [X] LOG-005: Logout

- **Esito:** SUPERATO
- **Precondizioni:** Un utente è loggato.
- **Passi:**
    1.  Individuare e cliccare il pulsante "Logout" nell'header.
- **Risultato Atteso:**
    1.  L'utente viene sloggato.
    2.  L'UI dell'header si aggiorna per mostrare i pulsanti "Login" e "Register". L'avatar, il nome utente e il pulsante "Logout" sono nascosti.
    3.  I link di navigazione condizionati (es. "Scrivi Articolo", "Profile") sono nascosti.
    4.  Se l'utente si trovava su una pagina protetta che richiede login (es. `profile.html`, `submit-article.html`, `admin-dashboard.html`), viene reindirizzato alla homepage o a una pagina pubblica.
    5.  Un toast di conferma logout viene mostrato (es. "Logout effettuato con successo!").

---

## 3. Profilo Utente (`profile.html`)

### [X] PROF-001: Visualizzazione Proprio Profilo

- **Esito:** SUPERATO
- **Precondizioni:** Utente loggato con email verificata (es. `verifieduser@example.com`).
- **Passi:**
    1.  Navigare a `profile.html` (direttamente o tramite link "Profile" nell'header).
- **Risultato Atteso:**
    1.  Vengono visualizzati i dati corretti del profilo utente: email, nickname, nazionalità con bandiera, avatar Blockie.
    2.  La sezione "Stato d'Animo" è visibile con il form per la modifica.
    3.  La sezione "Link Esterni" è visibile con l'UI per aggiungere/gestire link.
    4.  La sezione "I Miei Articoli" è visibile e popolata correttamente con le eventuali bozze, articoli in revisione, pubblicati e respinti dell'utente.
    5.  Il banner di verifica email NON è visibile.

### [X] PROF-002: Visualizzazione Profilo Altrui (tramite URL `?userId=xxx`)

- **Esito:** SUPERATO
- **Precondizioni:** Esiste un utente "OtherUser" con UID `otherUserId123` e un profilo pubblico con stato d'animo e alcuni link esterni. L'utente corrente può essere loggato o non loggato.
- **Passi:**
    1.  Navigare a `profile.html?userId=otherUserId123`.
- **Risultato Atteso:**
    1.  Vengono visualizzati i dati pubblici corretti di "OtherUser": nickname, nazionalità con bandiera, avatar Blockie.
    2.  L'email NON è visibile.
    3.  Lo "Stato d'Animo" di "OtherUser" è visibile, ma NON il form per modificarlo.
    4.  I "Link Esterni" di "OtherUser" sono visibili, ma NON l'UI per aggiungerli/modificarli/eliminarli.
    5.  La sezione "I Miei Articoli" NON è visibile.
    6.  Il banner di verifica email NON è visibile (indipendentemente dallo stato di verifica di "OtherUser").

### [X] PROF-003: Profilo Altrui Non Esistente (URL con `userId` non valido)

- **Esito:** SUPERATO
- **Precondizioni:** L'utente corrente può essere loggato o non loggato.
- **Passi:**
    1.  Navigare a `profile.html?userId=invalidOrNonExistentUserId`.
- **Risultato Atteso:**
    1.  Viene visualizzato un messaggio "Profilo utente non trovato" o simile.
    2.  Le sezioni di modifica (stato, link) e "I Miei Articoli" non sono visibili.

### [X] PROF-004: Modifica Stato d'Animo

- **Esito:** SUPERATO
- **Precondizioni:** Utente loggato visualizza il proprio profilo (`profile.html`).
- **Passi:**
    1.  Individuare la sezione "Stato d'Animo".
    2.  Inserire un nuovo stato nel campo di testo (es. "Programmando con entusiasmo!").
    3.  Cliccare sul pulsante "Aggiorna".
    4.  Svuotare il campo e cliccare "Aggiorna" (per impostare uno stato vuoto).
    5.  Provare a inserire uno stato troppo lungo (es. > 150 caratteri, se c'è validazione).
- **Risultato Atteso:**
    1.  Lo stato d'animo viene aggiornato correttamente nell'interfaccia utente (`statusMessageDisplay`) e nel documento `userProfiles` in Firestore.
    2.  Viene mostrato un toast di conferma (es. "Stato d'animo aggiornato!").
    3.  La validazione della lunghezza (se implementata) impedisce il salvataggio di stati troppo lunghi, mostrando un messaggio di errore appropriato.
    4.  L'impostazione di uno stato vuoto cancella lo stato precedente.

### [X] PROF-005: Gestione Link Esterni (CRUD)

- **Esito:** SUPERATO
- **Precondizioni:** Utente loggato visualizza il proprio profilo (`profile.html`).
- **Passi:**
    1.  **Aggiungere:**
        - Cliccare "Aggiungi Nuovo Link".
        - Compilare titolo (es. "Mio GitHub") e URL valido (es. `https://github.com/nomeutente`). Cliccare "Salva Link".
        - Ripetere fino ad avere 4 link.
    2.  **Modificare:**
        - Cliccare "Modifica" su un link esistente.
        - Cambiare titolo e/o URL (con un altro URL valido). Cliccare "Aggiorna Link".
    3.  **Eliminare:**
        - Cliccare "Elimina" su un link esistente. Confermare l'eliminazione.
    4.  **Caso Limite - Max Link:**
        - Aggiungere il 5° link.
        - Tentare di aggiungere un 6° link (dopo aver cliccato "Aggiungi Nuovo Link" e compilato i campi).
    5.  **Caso Errore - Input Invalido:**
        - Tentare di salvare un link con titolo mancante.
        - Tentare di salvare un link con URL non valido (es. `httpx://nonvalido`, `sito errato`).
        - Tentare di salvare un link con URL vuoto.
- **Risultato Atteso:**
    1.  **Aggiunta:** I link vengono aggiunti correttamente alla lista nell'UI e all'array `externalLinks` in Firestore. Toast di conferma.
    2.  **Modifica:** Il link selezionato viene aggiornato nell'UI e in Firestore. Toast di conferma.
    3.  **Eliminazione:** Il link selezionato viene rimosso dall'UI e da Firestore. Toast di conferma.
    4.  **Max Link:** È possibile aggiungere fino a 5 link. Al tentativo di aggiungere il 6° link, l'UI dovrebbe impedirlo (es. disabilitando il pulsante "Salva Link" se il form è aperto o mostrando un messaggio "Limite massimo di 5 link raggiunto." quando si tenta di salvare).
    5.  **Input Invalido:** Vengono mostrati messaggi di errore specifici per ogni campo mancante o non valido (es. "Titolo e URL sono obbligatori.", "URL non valido."). Il link non viene salvato/aggiornato.
    6.  L'UI del form di aggiunta/modifica si comporta correttamente (apertura, chiusura, reset campi, cambio testo pulsante "Salva/Aggiorna").

### [X] PROF-006: Reinvio Email di Verifica (per utente non verificato)

- **Esito:** SUPERATO
- **Precondizioni:** Utente loggato con email NON verificata (es. `unverifieduser@example.com`). L'utente visualizza il proprio profilo.
- **Passi:**
    1.  Individuare il banner di verifica email.
    2.  Cliccare sul pulsante "Invia di nuovo email di verifica".
    3.  Attendere alcuni secondi e cliccare di nuovo il pulsante.
- **Risultato Atteso:**
    1.  Viene mostrato un messaggio UI che conferma l'invio dell'email (es. "Email inviata. Potrebbe volerci qualche minuto.").
    2.  Un toast di conferma (es. "Email di verifica inviata nuovamente!") viene mostrato.
    3.  Il pulsante "Invia di nuovo email di verifica" viene temporaneamente disabilitato (throttling, es. per 30 secondi) per prevenire invii multipli.

### [X] PROF-007: Visualizzazione "I Miei Articoli" (Bozze, In Revisione, Pubblicati, Respinti)

- **Esito:** SUPERATO
- **Precondizioni:** Utente loggato. L'utente ha articoli in vari stati:
    - Almeno una Bozza (status: `draft`).
    - Almeno un Articolo In Revisione (status: `pendingReview`).
    - Almeno un Articolo Pubblicato (status: `published`).
    - Almeno un Articolo Respinto (status: `rejected`) con un `rejectionReason`.
- **Passi:**
    1.  Navigare alla pagina del proprio profilo.
    2.  Esaminare la sezione "I Miei Articoli", controllando ogni sottosezione (Bozze, In Revisione, Pubblicati, Respinti).
- **Risultato Atteso:**
    1.  Tutti gli articoli dell'utente sono visualizzati correttamente nelle rispettive sezioni in base al loro `status`.
    2.  Ogni card articolo mostra titolo, data (modifica per bozze/respinti, pubblicazione per pubblicati), e stato.
    3.  **Bozze:** Mostrano pulsanti "Modifica" (link a `submit-article.html?draftId=xxx`) e "Elimina".
    4.  **In Revisione:** Mostrano pulsante "Anteprima" (link a `view-article.html?id=xxx&preview=true`). Non c'è pulsante "Modifica" o "Elimina".
    5.  **Pubblicati:** Mostrano pulsante "Visualizza" (link a `view-article.html?id=xxx`).
    6.  **Respinti:** Mostrano il `rejectionReason` sulla card. Mostrano pulsanti "Crea da Questo Articolo" (link a `submit-article.html?rejectedArticleId=xxx`) e "Elimina Respinto".
    7.  Se una categoria non ha articoli, viene mostrato un messaggio appropriato (es. "Nessuna bozza trovata.").

---

## 4. Workflow Articoli (Sottomissione, Revisione, Visualizzazione)

### [X] ART-001: Sottomissione Nuovo Articolo per Revisione

- **Esito:** SUPERATO
- **Precondizioni:** Utente loggato.
- **Passi:**
    1.  Navigare alla pagina `submit-article.html`.
    2.  Compilare tutti i campi obbligatori (Titolo, Contenuto Markdown).
    3.  Compilare i campi opzionali (Tags, Snippet, URL Immagine Copertina) con dati validi.
    4.  Cliccare sul pulsante "Invia per Revisione".
- **Risultato Atteso:**
    1.  L'articolo viene salvato in Firestore nella collezione `articles` con `status: 'pendingReview'`.
    2.  I dati dell'articolo (`authorId`, `authorName`, `authorNationalityCode`, `title`, `contentMarkdown`, `tags`, `snippet`, `coverImageUrl`, `createdAt`, `updatedAt`, `likeCount:0`, `commentCount:0`, `likedByUsers:[]`, `isFeatured:false`) sono corretti.
    3.  Viene mostrato un toast di conferma (es. "Articolo inviato per la revisione!").
    4.  Il form di sottomissione viene resettato.
    5.  Eventuale reindirizzamento (es. alla pagina profilo o homepage).

### [X] ART-002: Salvataggio Bozza

- **Esito:** SUPERATO
- **Precondizioni:** Utente loggato.
- **Passi:**
    1.  Navigare alla pagina `submit-article.html`.
    2.  Compilare alcuni campi del form (es. Titolo e parte del Contenuto).
    3.  Cliccare sul pulsante "Salva Bozza".
- **Risultato Atteso:**
    1.  L'articolo viene salvato in Firestore con `status: 'draft'`.
    2.  L'URL della pagina `submit-article.html` viene aggiornato per includere il `draftId` (es. `submit-article.html?draftId=newDraftId123`).
    3.  Viene mostrato un toast di conferma (es. "Bozza salvata con successo!").
    4.  I dati inseriti rimangono nel form. I pulsanti cambiano testo (es. "Aggiorna Bozza", "Aggiorna e Invia per Revisione").

### [X] ART-003: Modifica Bozza e Invio per Revisione

- **Esito:** SUPERATO
- **Precondizioni:** Utente loggato. Esiste una bozza creata dall'utente.
- **Passi:**
    1.  Navigare alla pagina del proprio profilo (`profile.html`).
    2.  Nella sezione "I Miei Articoli" > "Bozze", cliccare "Modifica" su una bozza esistente.
    3.  Si viene reindirizzati a `submit-article.html?draftId=xxx` con i campi pre-popolati.
    4.  Modificare alcuni campi (es. aggiungere testo al contenuto).
    5.  Cliccare "Aggiorna Bozza".
        - **Risultato Atteso Intermedio:** La bozza viene aggiornata in Firestore. Toast di conferma. L'URL rimane con `draftId`.
    6.  Cliccare "Aggiorna e Invia per Revisione".
- **Risultato Atteso Finale (dopo passo 6):**
    1.  L'articolo in Firestore viene aggiornato: `status` cambia da `draft` a `pendingReview`, `updatedAt` viene aggiornato.
    2.  Viene mostrato un toast di conferma (es. "Bozza aggiornata e inviata per la revisione!").
    3.  Il form viene resettato. L'URL non contiene più `draftId`.
    4.  L'articolo non appare più tra le bozze nel profilo, ma tra quelli "In Revisione".

### [X] ART-004: Admin - Approva Articolo (da `admin-dashboard.html`)

- **Esito:** SUPERATO
- **Precondizioni:** Un utente Admin è loggato. Esiste un articolo con `status: 'pendingReview'` inviato da un altro utente.
- **Passi:**
    1.  L'Admin naviga a `admin-dashboard.html`.
    2.  Nella sezione "Articoli in Attesa di Revisione", individua l'articolo.
    3.  (Opzionale) Cliccare "Visualizza/Modifica" per ispezionare e apportare eventuali piccole correzioni. Salvare le modifiche.
    4.  Cliccare "Approva" per l'articolo. Confermare l'azione.
- **Risultato Atteso:**
    1.  Lo `status` dell'articolo in Firestore viene aggiornato a `published`.
    2.  Il campo `publishedAt` viene impostato con il `serverTimestamp()`.
    3.  Il campo `updatedAt` viene aggiornato.
    4.  L'articolo diventa visibile pubblicamente (es. sulla homepage e accessibile tramite `view-article.html?id=xxx`).
    5.  L'articolo non è più visibile nella lista "Pending" ma appare nella lista "Pubblicati" dell'admin dashboard.
    6.  Un toast di conferma viene mostrato all'admin.

### [X] ART-005: Admin - Respingi Articolo con Motivo (da `admin-dashboard.html`)

- **Esito:** SUPERATO
- **Precondizioni:** Utente Admin loggato. Esiste un articolo `pendingReview`.
- **Passi:**
    1.  Admin naviga a `admin-dashboard.html`.
    2.  Individua l'articolo nella sezione "Articoli in Attesa di Revisione".
    3.  Clicca "Respingi".
    4.  Nella modale che appare (o nel campo dedicato, non `prompt()`), inserire un motivo chiaro e costruttivo per il rifiuto (es. "Contenuto non in linea con le tematiche del sito. Si prega di focalizzarsi su argomenti tech.").
    5.  Confermare il rifiuto.
- **Risultato Atteso:**
    1.  Lo `status` dell'articolo in Firestore viene aggiornato a `rejected`.
    2.  Il campo `rejectionReason` viene salvato con il motivo fornito.
    3.  Il campo `updatedAt` viene aggiornato.
    4.  L'articolo non è più visibile nella lista "Pending" ma appare nella lista "Respinti" dell'admin dashboard (se tale sezione è implementata).
    5.  L'autore dell'articolo, visualizzando il proprio profilo, vedrà l'articolo nella sezione "Respinti" con il motivo del rifiuto.
    6.  Un toast di conferma viene mostrato all'admin.

### [X] ART-006: Visualizzazione Articolo Pubblicato (`view-article.html`)

- **Esito:** SUPERATO
- **Precondizioni:** Esiste un articolo pubblicato con ID `publishedArticleId123`.
- **Passi:**
    1.  Navigare a `view-article.html?id=publishedArticleId123`.
- **Risultato Atteso:**
    1.  L'articolo viene visualizzato correttamente:
        - Titolo, autore, data di pubblicazione, tags.
        - Contenuto Markdown parsato correttamente in HTML (verificare formattazione di titoli, liste, codice, link, immagini).
        - Eventuale immagine di copertina.
    2.  La sezione per i commenti è visibile e funzionante.
    3.  La sezione "Likes" è visibile e funzionante.
    4.  I pulsanti di condivisione articolo sono presenti e funzionanti.
    5.  I meta tag Open Graph nella `<head>` della pagina sono popolati dinamicamente con i dati dell'articolo.

### [ ] ART-007: Interazioni Articolo (Like e Commenti)

- **Esito:** PARZIALMENTE SUPERATO (Commenti non loggato FALLITO)
- **Note:** Un utente non registrato non può scrivere commenti (errore `FirebaseError: Missing or insufficient permissions` in `articleViewer.js`).
- **Precondizioni:** Un utente è loggato (per la maggior parte dei test). Un articolo è pubblicato.
- **Passi (Like):**
    1.  Visualizzare l'articolo.
    2.  Cliccare il pulsante "Like" (🤍).
    3.  Ricaricare la pagina.
    4.  Cliccare di nuovo il pulsante "Like" (💙).
    5.  Cliccare sul conteggio dei like per aprire la modale "Persone a cui piace".
- **Risultato Atteso (Like):**
    1.  Il conteggio dei like si incrementa/decrementa correttamente nell'UI e in Firestore (`likeCount` e `likedByUsers`).
    2.  L'aspetto del pulsante like cambia (es. 🤍 -> 💙) per riflettere lo stato.
    3.  Lo stato del like persiste dopo il ricaricamento della pagina.
    4.  La modale "Persone a cui piace" mostra correttamente gli utenti che hanno messo like (avatar, nickname, bandiera).
- **Passi (Commenti):**
    1.  _Test Utente Loggato:_ Visualizzare l'articolo. Scrivere un commento nel form e cliccare "Invia Commento". Mettere like al proprio commento o a quello di un altro utente.
    2.  _Test Utente NON Loggato:_ Visualizzare l'articolo. Il form per inserire nome (se visibile) e messaggio dovrebbe permettere l'invio.
- **Risultato Atteso (Commenti):**
    1.  _(Loggato)_ Il commento viene aggiunto alla lista dei commenti e salvato in Firestore (`articleComments`).
    2.  _(NON Loggato)_ **FALLITO** - L'invio del commento fallisce con errore di permessi. Atteso: Il commento viene salvato.
    3.  Il `commentCount` dell'articolo viene incrementato (solo per commenti riusciti).
    4.  Avatar, nome utente e bandiera del commentatore sono corretti.
    5.  Il like al commento funziona come descritto per i like agli articoli (UI, conteggio, persistenza).
    6.  La modale "Persone a cui piace" per i commenti funziona.

### [X] ART-008: Condivisione Articolo (`navigator.share` e fallback)

- **Esito:** SUPERATO
- **Precondizioni:** Un articolo è visualizzato (`view-article.html`).
- **Passi:**
    1.  Individuare la sezione/pulsanti di condivisione.
    2.  Se il browser supporta `navigator.share`, cliccare il pulsante "Condividi..." (o simile).
    3.  Se `navigator.share` non è supportato o fallisce, provare a cliccare i pulsanti di fallback (es. "Copia Link", "X", "Facebook").
- **Risultato Atteso:**
    1.  **`navigator.share`:** L'interfaccia di condivisione nativa del sistema operativo/browser si apre, precompilata con titolo, snippet e URL dell'articolo.
    2.  **Copia Link:** Il link dell'articolo viene copiato correttamente negli appunti. Un toast di conferma appare.
    3.  **Fallback Social:** Cliccando sui pulsanti social, si apre una nuova tab/finestra con l'URL di condivisione corretto per la piattaforma selezionata, precompilato con i dati dell'articolo.

---

## 5. Issue Tracker (`contribute.html` e `donkeyRunner.html`)

### [ ] ISSUE-001: Invio Nuova Issue (Generale - `contribute.html` - utente loggato)

- **Esito:** SUPERATO
- **Precondizioni:** Utente loggato.
- **Passi:**
    1.  Navigare a `contribute.html`.
    2.  Compilare il form per una nuova issue:
        - Titolo (opzionale).
        - Descrizione dettagliata.
        - Selezionare un "Tipo" (es. "Richiesta Funzionalità Generale").
        - Se il tipo è "Segnalazione Bug/Problema Gioco", selezionare un gioco dal menu a tendina "Gioco di Riferimento".
    3.  Cliccare "Invia Segnalazione/Suggerimento".
- **Risultato Atteso:**
    1.  L'issue viene creata nella collezione `userIssues` in Firestore con i dati corretti (`title`, `description`, `type`, `gameId` se applicabile, `userId`, `submittedBy`, `timestamp`, `status: 'new'`, `upvotes:0`, `upvotedBy:[]`).
    2.  L'UI della lista issue si aggiorna per mostrare la nuova issue in cima.
    3.  Il form viene resettato. Un messaggio di successo/toast viene mostrato.

### [ ] ISSUE-DR-001: Invio Nuova Issue specifica Donkey Runner (da `donkeyRunner.html` - Bug Report / Feature Request)

- **Esito:** FALLITO
- **Note:** Utenti (loggati e non) non riescono a inviare segnalazioni specifiche per Donkey Runner dalla pagina del gioco. Errore: `FirebaseError: Missing or insufficient permissions` in `featureRequests.js` e simile per `bugReports.js`.
- **Precondizioni:** Utente loggato e non loggato (provare entrambi).
- **Passi:**
    1.  Navigare a `donkeyRunner.html`.
    2.  Scorrere fino alla sezione "Segnala un Bug / Suggerisci Miglioramento".
    3.  Compilare il form "Segnala Bug per Donkey Runner" (se non loggato, opzionalmente inserire email). Cliccare "Invia Segnalazione Bug".
    4.  Compilare il form "Suggerisci Miglioramento per Donkey Runner" (titolo opzionale, descrizione obbligatoria). Cliccare "Invia Suggerimento".
- **Risultato Atteso:**
    1.  **FALLITO** - Le segnalazioni (bug/feature) vengono inviate e create nelle rispettive collezioni (`bugReports`, `featureRequests`) in Firestore con `pageContext: "donkeyRunnerGame"`.
    2.  L'UI del form si resetta e mostra un messaggio di successo.
    3.  Se l'utente è loggato, `userId` e info utente vengono salvate. Se non loggato e fornisce email per bug, questa viene salvata.

### [X] ISSUE-002: Upvote Issue (`contribute.html` - utente loggato)

- **Esito:** SUPERATO
- **Precondizioni:** Utente loggato. Esistono delle issue nella lista.
- **Passi:**
    1.  Navigare a `contribute.html`.
    2.  Individuare un'issue a cui non si è ancora messo upvote.
    3.  Cliccare il pulsante di upvote (👍) per quell'issue.
    4.  Ricaricare la pagina.
    5.  Cliccare di nuovo il pulsante di upvote sulla stessa issue.
- **Risultato Atteso:**
    1.  Il conteggio degli upvote per l'issue si incrementa/decrementa correttamente nell'UI e in Firestore (`upvotes` e `upvotedBy`).
    2.  L'aspetto del pulsante upvote cambia per indicare che l'utente ha votato (es. diventa `voted`).
    3.  Lo stato del voto persiste dopo il ricaricamento.
    4.  Un utente non può mettere upvote più di una volta alla stessa issue (il secondo click dovrebbe rimuovere l'upvote).

### [X] ISSUE-003: Filtro Issue (`contribute.html` - per tipo/stato)

- **Esito:** SUPERATO
- **Precondizioni:** Esistono diverse issue con tipi e stati differenti.
- **Passi:**
    1.  Navigare a `contribute.html`.
    2.  Usare i menu a tendina "Filtra per Tipo" e "Filtra per Stato" per selezionare diverse combinazioni di filtri.
    3.  Cliccare "Applica Filtri" dopo ogni selezione.
    4.  Provare a filtrare per un tipo specifico (es. "Segnalazione Bug/Problema Gioco").
    5.  Provare a filtrare per uno stato specifico (es. "Accepted").
    6.  Provare a combinare un filtro per tipo e uno per stato.
    7.  Resettare i filtri selezionando "Tutti i Tipi" e "Tutti gli Stati".
- **Risultato Atteso:**
    1.  La lista delle issue (`issuesDisplayArea`) si aggiorna correttamente per mostrare solo le issue che corrispondono ai criteri di filtro selezionati.
    2.  Se nessun issue corrisponde ai filtri, viene mostrato un messaggio appropriato (es. "Nessuna segnalazione trovata...").
    3.  Resettando i filtri, vengono mostrate tutte le issue (ordinate per timestamp, più recenti prima).

### [X] ISSUE-004: Admin - Modifica Stato Issue (da `admin-dashboard.html`)

- **Esito:** SUPERATO
- **Precondizioni:** Utente Admin loggato. Esistono delle issue.
- **Passi:**
    1.  Admin naviga a `admin-dashboard.html`.
    2.  Nella sezione "Segnalazioni e Suggerimenti Utenti", individua un'issue.
    3.  Utilizzare il menu a tendina accanto all'issue per cambiarne lo stato (es. da `new` a `underConsideration`, poi a `accepted`).
    4.  Verificare su `contribute.html` (come utente normale) che lo stato dell'issue sia aggiornato.
- **Risultato Atteso:**
    1.  Lo stato dell'issue viene aggiornato correttamente in Firestore (`status` e `updatedAt`).
    2.  L'UI in `admin-dashboard.html` riflette il nuovo stato (il menu a tendina rimane selezionato sul nuovo stato).
    3.  L'UI in `contribute.html` (per tutti gli utenti) mostra il badge di stato aggiornato per quell'issue.
    4.  Un toast di conferma viene mostrato all'admin.

---

## 6. Donkey Runner (UI/UX e Integrazione)

### [X] DR-001: Layout Mobile e Fullscreen

- **Esito:** SUPERATO
- **Precondizioni:** Nessuna.
- **Passi:**
    1.  Aprire `donkeyRunner.html` su un dispositivo mobile (o emulatore con dev tools).
    2.  Verificare il layout in modalità portrait e landscape.
    3.  Avviare il gioco.
    4.  Attivare la modalità fullscreen (se disponibile il pulsante o tramite API del browser se supportata).
    5.  Giocare in modalità fullscreen, sia portrait che (specialmente) landscape.
    6.  Morire nel gioco e visualizzare il form per il salvataggio del punteggio in fullscreen.
- **Risultato Atteso:**
    1.  **Controlli Touch:** I pulsanti "JMP" e "SHT" sono sempre visibili, accessibili e utilizzabili, specialmente in landscape fullscreen. Non si sovrappongono ad elementi critici.
    2.  **Canvas:** Il canvas del gioco si adatta correttamente alle dimensioni dello schermo/finestra, mantenendo la giocabilità (es. `object-fit: cover` o simile in fullscreen landscape).
    3.  **Testi:** Punteggio, menu, messaggi di game over e altri testi (sia su canvas che HTML) sono leggibili e non tagliati su schermi piccoli.
    4.  **Form Punteggio:** Il form per inserire le iniziali/salvare il punteggio è completamente visibile e utilizzabile anche in modalità fullscreen (specialmente landscape), senza che la tastiera virtuale lo copra eccessivamente.
    5.  **Pulsanti Start/Restart:** Il pulsante "START GAME" (o "RIGIOCA") su mobile è ben visibile e utilizzabile.

### [X] DR-002: Salvataggio Punteggio - Ospite

- **Esito:** SUPERATO
- **Precondizioni:** Utente NON loggato.
- **Passi:**
    1.  Giocare a Donkey Runner e ottenere un punteggio > 0.
    2.  Al Game Over, nel form di salvataggio punteggio, inserire delle iniziali (es. "TST").
    3.  Cliccare "Salva Punteggio".
- **Risultato Atteso:**
    1.  Il punteggio viene salvato nella collezione `leaderboardScores` in Firestore.
    2.  Il documento salvato ha `userId: null`, `initials` corrette, `userName` uguale a `initials`, `gameId: "donkeyRunner"`, `score` corretto, e `timestamp`. `nationalityCode` dovrebbe essere `null` o non presente.
    3.  La mini-leaderboard sulla pagina `donkeyRunner.html` si aggiorna per mostrare (eventualmente) il nuovo punteggio.
    4.  Un toast di conferma "Punteggio salvato!" appare.
    5.  Il form di salvataggio scompare.

### [X] DR-003: Salvataggio Punteggio - Utente Loggato

- **Esito:** SUPERATO
- **Precondizioni:** Utente loggato (es. `testuser@example.com` con nickname `TestUser` e nazionalità `IT`).
- **Passi:**
    1.  Giocare a Donkey Runner e ottenere un punteggio > 0.
    2.  Al Game Over, il form di salvataggio punteggio dovrebbe mostrare il nickname dell'utente pre-compilato e non richiedere iniziali.
    3.  Cliccare "Salva Punteggio".
- **Risultato Atteso:**
    1.  Il punteggio viene salvato in `leaderboardScores`.
    2.  Il documento salvato ha `userId` corretto, `userName` (nickname dell'utente), `initials` (derivate dal nickname, es. prime 5 lettere), `nationalityCode` (preso dal profilo utente), `gameId`, `score`, e `timestamp`.
    3.  La mini-leaderboard si aggiorna.
    4.  Toast di conferma. Form scompare.

### [X] DR-004: Commenti Guestbook Donkey Runner (`pageId: "donkeyRunnerGame"`)

- **Esito:** SUPERATO
- **Precondizioni:** Utente loggato e non loggato (provare entrambi).
- **Passi:**
    1.  Navigare a `donkeyRunner.html`.
    2.  Scorrere fino alla sezione Guestbook Donkey Runner.
    3.  Se non loggato, inserire un nome e un messaggio. Cliccare "Invia Commento".
    4.  Se loggato, inserire un messaggio. Cliccare "Invia Commento".
    5.  Mettere like a un commento.
- **Risultato Atteso:**
    1.  I commenti vengono salvati nella collezione `guestbookEntries` con `pageId: "donkeyRunnerGame"`.
    2.  I commenti vengono visualizzati correttamente nella lista sotto il form, con avatar, nome/nickname, bandiera (se utente loggato con nazionalità), data e messaggio.
    3.  La funzionalità di "like" per i commenti del guestbook specifico del gioco funziona come previsto (vedi LOG-007 per i dettagli sui like).

---

## 7. Test UI/UX Generali (Task D.4.3)

Questi test dovrebbero essere eseguiti su diverse risoluzioni (desktop, tablet, mobile portrait/landscape) e browser (Chrome, Firefox, Safari, Edge se possibile).

### [X] UXM-001: Navigazione Mobile

- **Esito:** SUPERATO
- **Descrizione:** Verificare che la navigazione (header, footer, link interni) sia fluida e accessibile su schermi piccoli per tutte le pagine principali:
    - `index.html`
    - `about.html`
    - `contribute.html`
    - `leaderboard.html`
    - `profile.html` (proprio e altrui)
    - `view-article.html`
    - `submit-article.html`
    - `admin-dashboard.html` (se accessibile e rilevante per test mobile)
    - `register.html`
    - `donkeyRunner.html`
- **Passi:**
    1.  Aprire ogni pagina elencata su un dispositivo mobile o emulatore.
    2.  Interagire con il menu di navigazione dell'header (se presente e responsivo, es. hamburger menu).
    3.  Cliccare sui link nel footer.
    4.  Cliccare su vari link interni per navigare tra le sezioni e le pagine.
    5.  Verificare lo scrolling verticale e orizzontale (non dovrebbe esserci scrolling orizzontale non voluto).
- **Risultato Atteso:**
    1.  Il menu header (se si trasforma) è facilmente apribile e utilizzabile.
    2.  Gli elementi dell'interfaccia non si sovrappongono.
    3.  Il testo è leggibile senza zoom eccessivo.
    4.  Lo scrolling è fluido.
    5.  Tutti i link sono cliccabili e portano alla destinazione corretta.

### [X] UXM-002: Leggibilità Testi su Mobile

- **Esito:** SUPERATO
- **Descrizione:** Controllare la dimensione e il contrasto dei font su mobile per le sezioni principali di tutte le pagine elencate in UXM-001.
- **Passi:**
    1.  Aprire ogni pagina su mobile.
    2.  Esaminare i testi principali (paragrafi, titoli, label dei form, link, pulsanti).
- **Risultato Atteso:**
    1.  I testi sono facilmente leggibili senza necessità di zoom eccessivo.
    2.  Il contrasto tra testo e sfondo è sufficiente per una buona leggibilità.
    3.  I font si adattano correttamente alle dimensioni dello schermo.

### [X] UXM-003: Usabilità Form su Mobile

- **Esito:** SUPERATO
- **Descrizione:** Verificare l'usabilità di tutti i form su dispositivi mobili:
    - Login (modale)
    - Registrazione (`register.html`)
    - Sottomissione Articolo (`submit-article.html`)
    - Modifica Articolo Admin (modale in `admin-dashboard.html`)
    - Commenti Articolo (`view-article.html`)
    - Commenti Guestbook (es. `about.html`, `donkeyRunner.html`)
    - Invio Issue (`contribute.html`)
    - Modifica Stato Profilo (`profile.html` - stato d'animo)
    - Gestione Link Esterni (`profile.html` - form aggiunta/modifica)
    - Salvataggio Punteggio Donkey Runner (modale/form in `donkeyRunner.html`)
    - Filtri Issue (`contribute.html`, `admin-dashboard.html`)
    - Motivo Rifiuto Articolo Admin (modale in `admin-dashboard.html`)
- **Passi:**
    1.  Aprire ogni pagina/modale contenente un form su mobile.
    2.  Tentare di compilare ogni campo del form.
    3.  Interagire con `select`, `textarea`, `input type="url"`, `input type="password"`, ecc.
    4.  Verificare l'interazione con la tastiera virtuale del dispositivo.
    5.  Tentare di inviare il form.
- **Risultato Atteso:**
    1.  I campi input sono facilmente selezionabili e il focus è chiaro.
    2.  La tastiera mobile non copre i campi attivi o elementi cruciali (es. pulsante "Invia").
    3.  I menu a tendina (`select`) sono utilizzabili.
    4.  I pulsanti di invio sono accessibili e cliccabili.
    5.  La validazione dei campi (HTML5 e JavaScript) funziona e i messaggi di errore sono visibili e comprensibili.

### [X] UXM-004: Notifiche Toast su Mobile

- **Esito:** SUPERATO
- **Descrizione:** Verificare la visualizzazione e la leggibilità delle notifiche toast (`showToast()`) su schermi piccoli.
- **Passi:**
    1.  Eseguire azioni che scatenano notifiche toast su mobile (es. login, logout, salvataggio bozza, invio commento, errore form, ecc.).
- **Risultato Atteso:**
    1.  Le notifiche toast sono chiaramente visibili (es. in basso a destra o altra posizione definita).
    2.  Non coprono elementi interattivi cruciali in modo permanente.
    3.  Il testo all'interno del toast è leggibile.
    4.  I toast scompaiono automaticamente dopo la durata prevista o possono essere chiusi manualmente.
    5.  Se più toast appaiono, sono gestiti correttamente (es. impilati o in coda).
