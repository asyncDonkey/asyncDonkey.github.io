# DEVELOPMENT PLAN (v3.17.11 - Regressioni Critiche Post Avatar) 🚀

**Data Ultimo Aggiornamento:** 19 Maggio 2025 (Simulazione)

**Stato Generale del Progetto:**
Nonostante i progressi sulla funzionalità avatar, sono emerse regressioni critiche che bloccano funzionalità base come la registrazione utente e la modifica del profilo. La priorità massima è risolvere questi blocchi. L'aggiornamento dell'avatar, sebbene inizialmente sembrasse risolto, necessita di ulteriore verifica alla luce dei problemi generali in `profile.js`.

---

## 🆘 NUOVE ISSUE CRITICHE E TASK PRIORITARI (Regressioni) 🆘

### Task REGRESS-001: Impossibilità di Registrare Nuovi Utenti (Priorità Massima Urgente)
* **Descrizione:** La funzionalità di registrazione utente (`js/register.js` e la creazione del documento `userProfiles` in Firestore) sembra non funzionare più correttamente, impedendo la creazione di nuovi account.
* **Causa Probabile:** Modifiche recenti a `js/profile.js` (sebbene indirettamente), alle Regole di Sicurezza Firestore, o al flusso di creazione del documento `userProfiles` potrebbero aver introdotto errori o incompatibilità.
* **Sotto-Task:**
    * [ ] **REGRESS-001.1:** Analizzare il flusso di codice in `js/register.js`, in particolare la logica di `createUserWithEmailAndPassword` e la successiva creazione del documento in `userProfiles`.
    * [ ] **REGRESS-001.2:** Rivedere attentamente le Regole di Sicurezza Firestore (`firestore.rules`) per il path `userProfiles/{userId}`, specificamente la condizione `allow create`. Verificare che un utente appena autenticato (o il sistema) abbia i permessi per creare il proprio profilo.
    * [ ] **REGRESS-001.3:** Verificare i dati inviati durante la creazione del profilo per assicurarsi che siano conformi a eventuali vincoli imposti dalle regole (es. campi obbligatori, tipi di dati).
    * [ ] **REGRESS-001.4:** Eseguire il debug passo-passo della registrazione, controllando la console del browser e la console Firebase (Authentication, Firestore) per errori dettagliati.
    * [ ] **REGRESS-001.5:** Identificare e correggere la causa della regressione.
    * [ ] **REGRESS-001.6:** Testare end-to-end la registrazione con un nuovo utente, verificando la creazione dell'account in Firebase Auth e la creazione del documento in `userProfiles`.

### Task REGRESS-002: Regressione Permessi Funzionalità Profilo Utente (Priorità Massima Urgente)
* **Descrizione:** Gli utenti autenticati ricevono errori "Missing or insufficient permissions" quando tentano di aggiornare funzionalità del profilo come lo stato d'animo e la mini bio tramite `profile.js`.
* **Causa Probabile:** Modifiche alle Regole di Sicurezza Firestore per `userProfiles/{userId}` (`allow update`) o modifiche ai payload inviati dal client (`js/profile.js`) che non rispettano più le condizioni delle regole. L'introduzione o la rimozione di campi come `profileUpdatedAt` o `updatedAt` negli `updateDoc` client-side potrebbe essere la causa.
* **Sotto-Task:**
    * [ ] **REGRESS-002.1:** Rivedere le Regole di Sicurezza Firestore per `userProfiles/{userId}`, in particolare le condizioni per `allow update`. Verificare quali campi il client è autorizzato a modificare e sotto quali condizioni.
    * [ ] **REGRESS-002.2:** Analizzare le funzioni `handleStatusMessageUpdate` e `handleBioUpdate` in `js/profile.js`.
        * [ ] Verificare i payload esatti inviati a `updateDoc`.
        * [ ] **Rimuovere il campo `profileUpdatedAt: serverTimestamp()` da queste chiamate `updateDoc` client-side, poiché questo campo dovrebbe essere gestito dalla Cloud Function dell'avatar o non usato per queste specifiche modifiche se causa conflitti di permessi.** (Già discusso e applicato, ma da riverificare se il problema persiste).
        * [ ] Se un timestamp generico `updatedAt` è richiesto dalle regole per queste operazioni, assicurarsi che sia presente e che le regole lo permettano.
    * [ ] **REGRESS-002.3:** Correggere il codice client o le regole Firestore per ripristinare la funzionalità.
    * [ ] **REGRESS-002.4:** Testare end-to-end l'aggiornamento dello stato d'animo e della mini bio da parte di un utente autenticato sul proprio profilo.

### Task REGRESS-003: Revisione Generale Funzionalità Profilo (`js/profile.js`) e Avatar (Priorità Alta)
* **Descrizione:** Problemi persistenti con l'aggiornamento dell'avatar (nonostante i recenti fix sembrassero funzionare, è necessaria una verifica completa a causa delle instabilità generali). L'immagine di default `default-avatar.png` restituisce 404. C'è confusione sul comportamento di `onSnapshot` e la gestione di `profileUpdatedAt`.
* **Sotto-Task:**
    * [x] **REGRESS-003.1 (Avatar - Reattività):** Implementato `onSnapshot` in `js/profile.js` per l'ascolto in tempo reale dei dati del profilo.
    * [x] **REGRESS-003.2 (Avatar - Cache Busting):** Implementata logica di cache-busting per l'URL dell'avatar utilizzando `profileUpdatedAt`.
    * [ ] **REGRESS-003.3 (Avatar - Stabilità):** Nonostante i fix, monitorare attentamente il log di `onSnapshot` in `js/profile.js` per capire perché `profileUpdatedAt` potrebbe apparire `null` o causare comportamenti inattesi. Assicurarsi che la logica di fallback e aggiornamento dell' `src` dell'immagine sia completamente robusta.
    * [ ] **REGRESS-003.4 (Avatar - Default Non Trovato):** Verificare e correggere il percorso della costante `DEFAULT_AVATAR_IMAGE_PATH` in `js/profile.js` per puntare correttamente all'immagine di avatar di default (Errore 404 attuale).
    * [ ] **REGRESS-003.5 (Avatar - Test Completo):** Eseguire test end-to-end approfonditi dell'intero flusso di upload e visualizzazione avatar (default -> custom A, custom A -> custom B, custom B -> custom A), verificando l'aggiornamento su `profile.html` e (una volta risolto REGRESS-004) sulle altre sezioni (leaderboard, articoli, commenti).

### Task ANALYSIS-001: Analisi Congiunta `profile.js` e Regole Firestore/Storage (Priorità Alta)
* **Descrizione:** Necessità di un confronto dettagliato tra il codice client che interagisce con `userProfiles` (principalmente `js/profile.js`, ma anche `js/register.js`) e le Regole di Sicurezza Firestore e Storage per identificare disallineamenti, potenziali conflitti o ottimizzazioni.
* **Sotto-Task:**
    * [ ] **ANALYSIS-001.1:** Mappare tutte le operazioni di lettura e scrittura (create, update, delete) effettuate da `js/profile.js` e `js/register.js` sulla collezione `userProfiles` in Firestore. Documentare i campi specifici letti/scritti e le condizioni logiche nel client.
    * [ ] **ANALYSIS-001.2:** Richiedere e analizzare il file `firestore.rules`. Confrontare le operazioni mappate al punto precedente con le regole definite per `userProfiles/{userId}` (es. `allow read, write, create, update, delete`).
    * [ ] **ANALYSIS-001.3:** Identificare ogni discrepanza tra le operazioni client e i permessi concessi dalle regole. Prestare particolare attenzione ai campi condizionati nelle regole e ai campi inviati dal client.
    * [ ] **ANALYSIS-001.4:** Richiedere e analizzare il file `storage.rules`. Verificare che le regole per `user-avatars/{userId}/{fileName}` e `user-avatars/{userId}/processed/{processedAvatarName}` siano coerenti con il flusso di upload dell'avatar (upload client, processamento CF) e non interferiscano con le operazioni della Cloud Function (che opera con privilegi admin per la scrittura ma necessita di regole di lettura pubblica per i file processati).
    * [ ] **ANALYSIS-001.5:** Valutare se le regole Firestore per `userProfiles` potrebbero interferire o essere in conflitto con le regole di Storage (improbabile un conflitto diretto, ma una cattiva configurazione di uno può impattare la percezione del funzionamento dell'altro).
    * [ ] **ANALYSIS-001.6:** Documentare le scoperte e proporre modifiche necessarie al codice client (`js/profile.js`, `js/register.js`) o ai file delle regole (`firestore.rules`, `storage.rules`) per risolvere i conflitti di permesso e garantire la sicurezza.

---

## 🎯 Prossimi Passi Immediati Suggeriti (Ordine di Priorità Rivisto) 🎯

1.  **Task REGRESS-001: Risolvere Impossibilità di Registrare Nuovi Utenti.** (MASSIMA PRIORITÀ)
    * Eseguire sotto-task da REGRESS-001.1 a REGRESS-001.6.
2.  **Task REGRESS-002: Risolvere Regressione Permessi Profilo Utente (Stato, Bio).** (MASSIMA PRIORITÀ)
    * Eseguire sotto-task da REGRESS-002.1 a REGRESS-002.4.
3.  **Task REGRESS-003.4: Correggere Path Avatar di Default.** (ALTA PRIORITÀ - Fix Rapido)
4.  **Task ANALYSIS-001: Analisi Congiunta `profile.js` e Regole Firestore/Storage.** (ALTA PRIORITÀ - Fondamentale per capire i problemi di permesso)
    * Ottenere i file `firestore.rules` e `storage.rules`.
    * Eseguire sotto-task da ANALYSIS-001.1 a ANALYSIS-001.6. Le scoperte qui influenzeranno la risoluzione finale di REGRESS-001, REGRESS-002 e REGRESS-003.
5.  **Task REGRESS-003 (Restanti Sotto-Task Avatar):** Continuare investigazione e fix per la stabilità dell'avatar.
    * Eseguire sotto-task REGRESS-003.3 e REGRESS-003.5.
6.  **Task REGRESS-004 (Ex C.1.NEW parziale / Leaderboard): Avatar non aggiornati in Leaderboard.** (Priorità Media - da affrontare dopo i blocchi)
    * [ ] **REGRESS-004.1:** Applicare logica di cache-busting (con `profileUpdatedAt` se recuperato) per gli avatar in `js/leaderboard.js`.
    * [ ] **REGRESS-004.2:** Verificare che `js/leaderboard.js` recuperi `profileUpdatedAt` insieme agli altri dati utente.
    * [x] Implementato pulsante "Aggiorna Classifica" per re-fetch manuale in `js/leaderboard.js`.
7.  **Task REGRESS-005: Avatar non aggiornati in Articoli e Commenti.** (Priorità Media-Bassa)
    * [ ] Analizzare `js/articleViewer.js`, `js/comments.js`, `js/homePageFeatures.js`.
    * [ ] Implementare recupero di `avatarUrls.small` e `profileUpdatedAt`.
    * [ ] Applicare logica di cache-busting.
    * [ ] Valutare se è necessario un meccanismo di refresh (es. Event Bus) o se l'aggiornamento al successivo caricamento è accettabile.

---

## C: Nuove Funzionalità e Miglioramenti Specifici Giochi/Piattaforma 🎮

### Task C.1: Gestione Avatar Utente Personalizzato.
* [x] Frontend: UI per selezione, validazione, anteprima e upload immagine originale su Firebase Storage.
* [x] Backend: Cloud Function `processUploadedAvatar` (trigger Storage) per ridimensionare, convertire in WebP, salvare versioni processate, e aggiornare `avatarUrls` e `profileUpdatedAt` in Firestore.
* [x] Bucket Firebase Storage predefinito creato e configurato.
* [x] Configurazione Firebase client e trigger CF aggiornati per il bucket corretto.
* [x] Cloud Function `processUploadedAvatar` deployata in produzione.
* **Sub-task C.1.NEW (Ora parte di REGRESS-003): Risolvere problemi di visualizzazione/aggiornamento avatar.**
    * [x] Aggiornate Regole di Sicurezza di Firebase Storage per permettere upload client. (Ulteriore verifica in ANALYSIS-001.4)
    * [ ] ~~Sub-task C.1.FIX-AVATAR: Investigare perché `profileUpdatedAt` appare `null`...~~ (Spostato a REGRESS-003.3)
    * [ ] ~~Sub-task C.1.FIX-AVATAR: Verificare e correggere il percorso di `DEFAULT_AVATAR_IMAGE_PATH`...~~ (Spostato a REGRESS-003.4)
    * [ ] ~~Sub-task C.1.FIX-AVATAR: Assicurarsi che la logica di cache-busting...~~ (Spostato a REGRESS-003.3)
    * [ ] Test finale end-to-end dell'intero flusso di upload e visualizzazione avatar (dopo fix regressioni). (Spostato a REGRESS-003.5)

*(Le altre sezioni e task del devplan originale (C.2.4, C.3, C.5, AUTH, A, D, E, F) mantengono per ora lo stato e le priorità relative indicate nel devplan v3.17.10, ma verranno rivalutate dopo la risoluzione delle regressioni critiche. Le priorità indicate sopra in "Prossimi Passi Immediati" hanno la precedenza su tutto.)*

---

Questo piano dovrebbe aiutarci a concentrarci sulla risoluzione dei problemi più urgenti. Iniziamo con **REGRESS-001** e **REGRESS-002**, e parallelamente prepariamoci per **ANALYSIS-001** ottenendo i file delle regole.