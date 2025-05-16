# DEVELOPMENT PLAN (v3.9.0 - Riorganizzazione Registrazione e Profilo Utente) 🚀

**Stato del Progetto:** Implementati i like per articoli e commenti (con visualizzazione likers). Editor Markdown funzionante. Pagine `contribute.html` e `admin-dashboard.html` create e operative con funzionalità admin per articoli (inclusa gestione `rejectionReason` tramite modale dedicata). Sistema base di tracciamento issue implementato. Avatar (Blockie) e bandierina autore aggiunti alle card articoli sulla homepage. Logica client-side per bozze articolo e visualizzazione stati in "I Miei Articoli" completa. Pre-popolamento del form di sottomissione articoli da articoli respinti implementato. Notifiche Toast implementate. ESLint e Prettier configurati. File `.gitignore` aggiunto.

---

🚧 **Prossimi Step e Task da Prioritizzare** 🚧

## Sezione AUTH: Gestione Autenticazione e Profilo Utente (Nuova Sezione Prioritaria) ✨👤

* **Task AUTH.1: Centralizzazione Processo di Registrazione**
    * `[ ]` Sub-task AUTH.1.1: Creare nuova pagina `register.html`.
        * Includere form con: Email, Password, Conferma Password, Nickname, Nazionalità (select), e sezione informativa su Avatar.
        * Aggiungere sezioni informative chiare che indicano che Nickname e Nazionalità **non saranno modificabili** dopo la registrazione (per il momento).
        * Spiegare che l'avatar sarà un Blockie generato dinamicamente basato sull'ID utente, visualizzato consistentemente in tutto il sito.
    * `[ ]` Sub-task AUTH.1.2: Creare nuovo file `js/register.js` per la logica di validazione e creazione utente/profilo Firestore.
        * Al successo, reindirizzare l'utente (es. a `profile.html` o `index.html` con messaggio di benvenuto).
    * `[ ]` Sub-task AUTH.1.3: Modificare tutti i pulsanti/link "Register" esistenti nel sito per puntare a `register.html`.
    * `[ ]` Sub-task AUTH.1.4: Rimuovere il codice HTML e JS relativo alle modali di signup da tutte le pagine.

* **Task AUTH.2: Semplificazione Modifica Profilo Utente**
    * `[ ]` Sub-task AUTH.2.1: In `profile.html` e `js/profile.js`, rimuovere la funzionalità e l'UI per modificare il Nickname e la Nazionalità. Questi campi diventeranno solo di visualizzazione.
    * `[ ]` Sub-task AUTH.2.2: Verificare e confermare che gli avatar Blockie siano generati dinamicamente *al momento della visualizzazione* in tutte le sezioni del sito (articoli, commenti, leaderboard, header, ecc.) basandosi sull' `userId`, garantendo coerenza senza necessità di propagazione. *(Questo dovrebbe essere già il comportamento attuale, ma va verificato)*.
        * Se questa verifica conferma la dinamicità, la funzione "Rigenera Avatar Casuale" (se intesa come cambio di Blockie) non è applicabile mantenendo il legame con l'ID utente. Se si intendeva un futuro avatar personalizzato, quel task rimane (C.1).

* **Task AUTH.3: Miglioramenti Pagina Profilo Utente (`profile.html`)**
    * `[ ]` Sub-task AUTH.3.1: Implementare funzionalità "Stato d'Animo" (Status Message).
        * Aggiungere campo `statusMessage` (stringa, max 100-150 caratteri) a `userProfiles`.
        * In `profile.html`: UI per visualizzare e modificare lo `statusMessage` (input testo + pulsante "Aggiorna").
        * In `js/profile.js`: Logica per caricare e aggiornare lo `statusMessage`.
        * Aggiornare regole Firestore per `userProfiles` per permettere la modifica di `statusMessage` da parte del proprietario.
    * `[ ]` Sub-task AUTH.3.2 (Opzionale/Idee): Aggiungere altre funzionalità "carine e simpatiche":
        * Visualizzazione contatori (articoli pubblicati, commenti fatti, data registrazione).
        * Campo per una breve bio/descrizione personale.
        * Campi per link a profili social (es. GitHub, LinkedIn).
    * `[ ]` Sub-task AUTH.3.3: Rendere la pagina profilo navigabile e visualizzabile da altri utenti.
        * Modificare `js/profile.js` per caricare i dati del profilo basandosi su un `userId` passato come parametro URL (es. `profile.html?userId=xxx`).
        * Se nessun `userId` è nell'URL, mostra il profilo dell'utente loggato (se esiste) o un messaggio appropriato.
        * Distinguere tra visualizzazione pubblica e privata (quando l'utente loggato guarda il proprio profilo vs. quello di un altro).
        * Trasformare i nomi utente (in articoli, commenti, ecc.) in link che puntano al rispettivo profilo pubblico.

## Sezione A: Gestione Contributi e Moderazione 🖋️

* **Task A.1: Pagina "Contribuisci"** `[x]`
* **Task A.2: Sistema di Tracciamento Issue/Suggerimenti** `[x]`
* **Task A.3: Moderazione e Pubblicazione Articoli**
    * `[x]` Sub-task A.3.1 - A.3.3 (Logica Admin Base).
    * `[ ]` Sub-task A.3.4: (Opzionale Esteso) Sistema di notifica base per l'autore (articoli approvati/respinti tramite `userNotifications` in Firestore).
        * `[ ]` 🆕 Sub-task A.3.4.1: Definire struttura dati per notifiche.
        * `[ ]` 🆕 Sub-task A.3.4.2: Creazione notifiche da `adminDashboard.js`.
        * `[ ]` 🆕 Sub-task A.3.4.3: UI per visualizzare notifiche.
* **Task A.4: Implementazione e Debug Regole Firestore per Moderazione Articoli Admin & Autore**
    * `[x]` Sub-task A.4.1: Regole Admin (V5.1 funzionante).
    * `[x]` **Task A.4.2: Workflow autori per bozze e articoli respinti.**
        * `[x]` Sub-task A.4.2.1 - A.4.2.5: Gestione bozze e visualizzazione stati articoli utente.
        * `[x]` Sub-task A.4.2.6: Workflow Articoli Respinti con `rejectionReason` (UI Admin aggiornata).
        * `[x]` Sub-task A.4.2.7: Pre-popolamento `submit-article.html` da articoli respinti.

---

## Sezione B: Sistema Articoli & Contributi Utente `[x]` (Funzionalità base complete) 📝

---

## Sezione G: Guestbook `[x]` (Funzionalità base complete) 📖

---

## Sezione C: Nuove Funzionalità e Miglioramenti Specifici Giochi/Piattaforma 🎮

* `[ ]` **Task C.1:** Gestione Avatar Utente Personalizzato (Upload immagine). *(Questo task diventa più rilevante ora che la modifica post-registrazione è limitata).*
* `[ ]` **Task C.2:** Ottimizzazione Layout Mobile per Donkey Runner.
    * `[ ]` 🆕 Sub-task C.2.1: Test specifici.
* `[ ]` **Task C.3:** Miglioramenti Leaderboard & Info Glitchzilla.
    * `[ ]` 🆕 Sub-task C.3.X: Info Glitchzilla in `donkeyRunner.html`.
* `[ ]` **Task C.4:** Migliorare Compatibilità e Prestazioni su iOS per Donkey Runner.

---

## Sezione D: Miglioramenti UI/UX e Ottimizzazioni Generali ✨

* **Task D.1: Miglioramenti UI/UX Generali**
    * `[x]` Sub-task D.1.A: Notifiche Toast.
    * `[ ]` Sub-task D.1.B: Messaggi di Caricamento (spinner, skeleton loading).
    * `[ ]` Sub-task D.1.C: Gestione Errori (standardizzare uso `showToast`).
        * `[ ]` 🆕 Sub-task D.1.C.1: Revisione `try...catch`.
        * `[ ]` 🆕 Sub-task D.1.C.2: Standardizzazione messaggi.
    * `[ ]` Sub-task D.1.D: Ottimizzazione layout mobile generale.
    * `[x]` Layout articoli homepage.
    * `[x]` Link navigazione.
    * `[x]` Riorganizzazione "I Miei Articoli".
* **Task D.2: Funzionalità Aggiuntive per l'Utente**
    * `[ ]` **Task D.2.X (Ex D.2.1, D.2.2): Modifica Nazionalità dal profilo utente.** `[RIMOSSO/POSTICIPATO]`
    * `[ ]` Possibilità per gli utenti di cancellare i propri commenti.
        * `[ ]` 🆕 Sub-task D.2.3 - D.2.5: Logica e regole Firestore.
* **Task D.3: Ottimizzazioni del Codice**
    * `[x]` Refactoring JS (NON VERRA' EFFETTUATO)
    * `[x]` **Sub-task D.3.A: Configurazione Linter (ESLint) e Formatter (Prettier).** (Completato)
        * `[x]` Installazione dipendenze.
        * `[x]` Configurazione `eslint.config.mjs`, `.prettierrc.json`.
        * `[x]` Configurazione `.gitignore`.
        * `[x]` Applicazione a codebase esistente.
    * `[ ]` Aggiungere commenti dettagliati e documentazione JSDoc.
        * `[ ]` 🆕 Sub-task D.3.1: JSDoc.
        * `[ ]` 🆕 Sub-task D.3.2: Commenti inline.
* **Task D.4: Test e Quality Assurance**
    * `[ ]` Test cross-browser e cross-device.
        * `[ ]` 🆕 Sub-task D.4.1 - D.4.3: Checklist e esecuzione.
    * `[ ]` Definire casi di test formali.
* **Task D.5: Filtri Avanzati per Leaderboard Globale** `[ ]`
    * `[ ]` 🆕 Sub-task D.5.1 - D.5.2: UI e logica.
* **Task D.6: Miglioramenti Stili Commenti e Interazioni Like**
    * `[ ]` Sub-task D.6.1: Rivedere stili commenti.
    * `[x]` Sub-task D.6.2: Interattività like.
* **Task D.7: Miglioramento Grafico Card Articoli Homepage** `[x]`

---

🌍 ## Fase Successiva (Lungo Termine): Internazionalizzazione (i18n) Completa `[ ]`

---

## Considerazioni Chiave e Suggerimenti Migliorativi (Aggiornate) 💡

* **Coerenza Dati Profilo:** La decisione di non propagare modifiche di nickname/nazionalità semplifica enormemente. La nuova pagina di registrazione enfatizzerà l'impostazione iniziale di questi dati. Gli avatar Blockie generati dinamicamente dall'ID utente garantiscono coerenza visiva senza necessità di sincronizzazione.
* **Test Regole Firestore:** Cruciale, specialmente con le nuove regole per la creazione profilo e la modifica dello `statusMessage`.
* **Modularità del Codice:** Oltre a `toastNotifications.js`, la nuova pagina `register.html` avrà il suo `js/register.js`, il che è un buon passo verso la modularità.
* **Sicurezza:** Validazione input in `register.html` e regole Firestore robuste per la creazione profilo.
* **Accessibilità (a11y), Performance, Documentazione Codice, Repository GitHub, UI Consistente, UX Admin Dashboard:** Rimangono considerazioni importanti.

---

## Prossimi Passi Immediati Suggeriti (Nuovo Ordine di Priorità) 🎯

1.  **Implementare Pagina di Registrazione Dedicata (`register.html`) (Task AUTH.1.1, AUTH.1.2):** Creare l'HTML e la logica JS base per la nuova pagina di registrazione, includendo le informative su nickname/nazionalità non modificabili e avatar.
2.  **Aggiornare Link e Rimuovere Modali di Signup (Task AUTH.1.3, AUTH.1.4):** Modificare i pulsanti "Register" esistenti per puntare a `register.html` e rimuovere le vecchie modali.
3.  **Semplificare Pagina Profilo (Task AUTH.2.1):** Rimuovere da `profile.html` e `js/profile.js` l'UI e la logica per modificare nickname e nazionalità.
4.  **Implementare "Stato d'Animo" su Profilo (Task AUTH.3.1):** Aggiungere la funzionalità per visualizzare e modificare lo stato d'animo.
5.  **Rendere Pagina Profilo Navigabile (Task AUTH.3.3 - Inizio):** Modificare `js/profile.js` per caricare i profili via `userId` nell'URL. La parte di rendere i nomi utente cliccabili può seguire.
6.  **Documentazione Codice (D.3):** Iniziare a commentare le parti più complesse o recentemente modificate.
7.  **Test e QA (D.4):** Iniziare a definire e eseguire test manuali per le nuove funzionalità di registrazione e profilo.

---