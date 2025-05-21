# DEVELOPMENT PLAN (v3.11.0 - Strategia Registrazione, Profilo Avanzato, UX e Direttive Future) 🚀

**Stato del Progetto:** Like per articoli/commenti con visualizzazione likers OK. Editor Markdown OK. Pagine `contribute.html` e `admin-dashboard.html` operative con funzionalità admin (inclusa `rejectionReason` via modale). Tracciamento issue base OK. Avatar/bandierina autore su card homepage OK. Gestione bozze e visualizzazione stati articoli utente OK. Pre-popolamento form da articoli respinti OK. Notifiche Toast OK. ESLint/Prettier configurati e codebase formattato. `.gitignore` OK.

---

**PRINCIPI GUIDA E BEST PRACTICES:**

- 🆕 **Valutazione Preventiva per Task Complessi:** Per modifiche strutturali, funzionalità complesse (es. propagazione dati, sistemi di messaggistica), o revisioni profonde delle Regole Firestore, verrà condotta un'analisi preliminare dettagliata. Questa includerà:
    - **Scopo e Risultati Attesi:** Definizione chiara.
    - **Dipendenze e Impatto:** Analisi delle interconnessioni con il sistema esistente.
    - **Complessità e Sforzo:** Stima realistica.
    - **Alternative e Incrementalità:** Valutazione di approcci più semplici o per fasi.
    - **Piano di Test Specifico:** Criteri di validazione.
- **Focus sulla User Experience (UX):** Prioritizzare chiarezza, feedback immediato, e facilità d'uso.
- **Sicurezza e Validazione:** Controlli client-side per UX, regole Firestore robuste per sicurezza backend.
- **Documentazione Continua:** Commentare codice, strutture dati e decisioni architetturali.

---

🚧 **Prossimi Step e Task da Prioritizzare** 🚧

## Sezione AUTH: Gestione Autenticazione e Profilo Utente ✨👤

- **Task AUTH.1: Centralizzazione e Miglioramento Processo di Registrazione**

    - `[ ]` Sub-task AUTH.1.1: Creare pagina dedicata `register.html`.
        - **Dettagli:**
            - Form con: Email, Password (con input separato per conferma), Nickname, Nazionalità (select), sezione informativa su Avatar.
            - **Campi Obbligatori:** Chiaramente indicati (es. con `*`).
            - **Validazione HTML5:** Uso di `required`, `type="email"`, `minlength`, `pattern` per password (es. complessità minima: almeno 1 maiuscola, 1 minuscola, 1 numero, min. 8 caratteri).
            - **Informativa Chiara (Testo sulla Pagina):**
                - Nickname: "Scegli con cura il tuo Nickname. Sarà il tuo identificativo pubblico sul sito. **Per il momento, non potrà essere modificato** dopo la registrazione."
                - Nazionalità: "La tua nazionalità sarà visibile agli altri utenti. **Per il momento, non potrà essere modificata** dopo la registrazione."
                - Avatar: "Verrà generato un avatar (Blockie) basato sul tuo ID utente, visibile in tutto il sito. In futuro, potrai caricare un'immagine personalizzata."
            - Link a Termini di Servizio / Privacy Policy (placeholder).
    - `[ ]` Sub-task AUTH.1.2: Sviluppare `js/register.js` per logica `register.html`.
        - **Dettagli:**
            - Validazione JavaScript aggiuntiva (es. corrispondenza password, complessità password se non solo con pattern HTML). Feedback di errore inline vicino ai campi.
            - Logica `createUserWithEmailAndPassword`.
            - Creazione documento in `userProfiles` Firestore (nickname, nationalityCode, email, createdAt, `isAdmin: false`, `statusMessage: ""`, `externalLinks: []`, `earnedBadges: []`, `bio: ""`).
            - Implementazione **verifica email** via Firebase Auth (`sendEmailVerification(auth.currentUser)`).
                - UI in `js/register.js` o pagina di reindirizzamento per informare l'utente di controllare l'email.
                - Considerare UI in `profile.html` per utenti con email non verificata (es. banner "Verifica la tua email", pulsante "Invia di nuovo email di verifica").
            - **Messaggio di Benvenuto:** Dopo registrazione e login (o al primo login post-verifica), usare `showToast("Benvenuto/a su asyncDonkey.io, {Nickname}!", "success", 5000);`.
            - Reindirizzamento (es. a `profile.html` o `index.html`).
    - `[ ]` Sub-task AUTH.1.3: Aggiornare tutti i link/pulsanti "Register" esistenti per puntare a `register.html`.
    - `[ ]` Sub-task AUTH.1.4: Rimuovere HTML e JS delle modali di signup (`signupModal`) da tutte le pagine. (La `loginModal` può rimanere).

- **Task AUTH.2: Semplificazione e Conferma Funzionalità Profilo Utente**

    - `[ ]` Sub-task AUTH.2.1: Rimuovere da `profile.html` e `js/profile.js` l'UI e la logica per la _modifica_ di Nickname e Nazionalità. Questi campi saranno solo visualizzati.
    - `[ ]` Sub-task AUTH.2.2: Verifica e Documentazione Comportamento Avatar Blockie.
        - **Azione:** Confermare che la generazione `generateBlockieAvatar(userId, ...)` sia usata consistentemente per visualizzare avatar ovunque, garantendo dinamicità e coerenza senza sincronizzazione. Documentare questo approccio.

- **Task AUTH.3: Miglioramenti Funzionali Pagina Profilo Utente (`profile.html`)**
    - `[ ]` Sub-task AUTH.3.1: Implementare "Stato d'Animo" (Status Message).
        - **Dettagli:** Come definito precedentemente (campo in `userProfiles`, UI per modifica in `profile.html`, logica JS, regole Firestore).
    - `[ ]` Sub-task AUTH.3.2: Implementare Link a Contenuti Esterni.
        - **Dettagli:**
            - Struttura dati: `externalLinks: array` in `userProfiles` (oggetti `{ title: string, url: string }`, max 3-5 link).
            - UI per modifica (solo dal proprietario): Aggiungere, eliminare, modificare titolo/URL dei link. Validazione URL.
            - Visualizzazione: Lista di link cliccabili sul profilo pubblico.
            - Regole Firestore per permettere la modifica di questo array.
    - `[ ]` Sub-task AUTH.3.3: Rendere Pagina Profilo Navigabile e Pubblica.
        - **Dettagli:** Come definito precedentemente (routing via `?userId=`, distinzione UI pubblica/privata, link ai profili da nomi utente).
    - `[ ]` Sub-task AUTH.3.4 (Opzionale/Idee Future - _se il tempo lo permette, scegliere 1-2 max_):
        - **Mini-Bio Utente:** Campo `bio: string` (max 300 caratteri) in `userProfiles`, modificabile dall'utente.
        - **Contatori Semplici:** Visualizzare data di registrazione. _Contatori di articoli/commenti richiedono query o aggregazioni più complesse, posticipare se non semplici da ottenere._
        - **Badge/Achievements Semplici (Pilota):**
            - **Concetto:** Introdurre 1-2 badge iniziali per testare il sistema.
            - **Struttura Dati:** Collezione `badges` (`badgeId`, `name`, `description`, `iconUrl`). Campo `earnedBadges: array<string>` in `userProfiles`.
            - **Badge Pilota 1: "Autore Debuttante"**: Assegnato da `js/adminDashboard.js` quando il primo articolo di un utente viene approvato. Richiede un controllo se l'utente ha già altri articoli pubblicati o questo badge.
            - **Badge Pilota 2: "Glitchzilla Slayer" (se non già tracciato):** Assegnato da `js/donkeyRunner.js` al salvataggio di un punteggio che indica la sconfitta di Glitchzilla (se `glitchzillaDefeated: true` viene salvato con il punteggio).
            - **Visualizzazione:** Sezione "I Miei Riconoscimenti" in `profile.html`.
            - _Complessità da valutare attentamente prima di iniziare._

## Sezione A: Gestione Contributi e Moderazione 🖋️

- (Task A.1 - A.4.2.7 rimangono come nel piano v3.9.0)

---

## Sezione B & G: Articoli, Contributi Utente, Guestbook `[x]` (Funzionalità base complete) 📝📖

---

## Sezione C: Nuove Funzionalità e Miglioramenti Specifici Giochi/Piattaforma 🎮

- `[ ]` **Task C.1:** Gestione Avatar Utente Personalizzato (Upload immagine tramite Firebase Storage).
    - **Valutazione:** Mantenuto come **Opzionale/Futuro (Priorità Media)**. La sua implementazione aggiunge un livello di complessità (upload, storage, sicurezza, moderazione potenziale, processamento immagini) che può essere affrontato dopo aver consolidato le funzionalità di base del profilo e della registrazione. I Blockies sono un'ottima soluzione temporanea/di default.
- (Altri task C.2, C.3, C.4 rimangono come nel piano v3.9.0)

---

## Sezione D: Miglioramenti UI/UX e Ottimizzazioni Generali ✨

- (Task D.1.A `[x]`, D.1.B `[ ]`, D.1.C `[ ]`, D.1.D `[ ]`, D.2 (cancellazione commenti) `[ ]`, D.3.A `[x]`, D.4 `[ ]`, D.5 `[ ]`, D.6 `[ ]`, D.7 `[x]` rimangono come nel piano v3.9.0)
- **Task D.3: Ottimizzazioni del Codice e Documentazione**
    - (D.3.A Linter/Formatter `[x]`)
    - `[ ]` Sub-task D.3.B: **Documentazione Approfondita del Codice e del Progetto.**
        - `[ ]` D.3.B.1: JSDoc per tutte le funzioni pubbliche e logiche complesse in tutti i file `.js`.
        - `[ ]` D.3.B.2: Commenti inline chiari per passaggi non ovvi.
        - `[ ]` D.3.B.3: Commenti a livello di modulo/file (scopo e responsabilità).
        - `[ ]` D.3.B.4: Creare/Aggiornare `documentation/firestore-schema.md` con la descrizione dettagliata di tutte le collezioni, la struttura tipica dei documenti, i tipi di campo, e le relazioni.
        - `[ ]` D.3.B.5: Commentare estensivamente le Regole Firestore (`firestore.rules`) per spiegare ogni condizione.
        - `[ ]` D.3.B.6: Revisionare e aggiornare `README.md` del progetto.
        - `[ ]` D.3.B.7: Mantenere aggiornato il `DEVELOPMENT_PLAN.md`.
- **Task D.8: Integrazioni Esterne e Condivisione**
    - `[ ]` Sub-task D.8.1: Implementare Pulsanti di Condivisione (Share Buttons).
        - **Punteggi Giochi:** In `donkeyRunner.html`, dopo il salvataggio del punteggio.
        - **Articoli:** In `view-article.html` (e opzionalmente sulle card in `index.html`).
        - **Tecnologia:** Prioritizzare `navigator.share()`. Fornire fallback con "Copia Link" e link diretti manuali per social comuni (X, Facebook, LinkedIn, WhatsApp, Email).
    - `[ ]` Sub-task D.8.2: Collegare a GitHub Issues. (Come definito in v3.9.0 - link diretti, ricerca widget/API opzionale).
    - `[ ]` Sub-task D.8.3 (Ricerca): Documentazione su widget/embedding da piattaforme comuni (Instagram, ecc.).

---

## Sezione E: Ricerca e Sviluppo a Lungo Termine 🔬📈

- (Task E.1 Propagazione Dati, E.2 Messaggistica Interna rimangono come nel piano v3.9.0)

---

## Sezione F: Fase di Perfezionamento Finale polish

- (Task F.1 Revisione HTML/CSS rimane come nel piano v3.9.0)

---

## 🌍 ## Fase Successiva (Lungo Termine): Internazionalizzazione (i18n) Completa `[ ]`

## Considerazioni Chiave e Suggerimenti Migliorativi (Aggiornate) 💡

- (Tutte le considerazioni da v3.9.0 rimangono valide, in particolare la Valutazione Preventiva, Coerenza Dati Profilo (ora gestita con la nuova strategia), Test Regole Firestore, ecc.)
- **UX Registrazione:** La nuova pagina di registrazione deve essere molto chiara e guidare l'utente, specialmente riguardo ai campi non modificabili. La verifica email è un passo importante per la qualità degli utenti.
- **Gamification (Badge):** Iniziare con pochi badge semplici per testare il concetto. La logica di assegnazione deve essere robusta.

---

## Prossimi Passi Immediati Suggeriti (Nuovo Ordine di Priorità) 🎯

1.  **Implementare Pagina di Registrazione Dedicata (`register.html`) (Task AUTH.1.1, AUTH.1.2):** HTML, JS base, informative chiare, **validazione campi client-side dettagliata**, implementare **verifica email Firebase**.
2.  **Aggiornare Link "Register" e Rimuovere Modali Signup (Task AUTH.1.3, AUTH.1.4).**
3.  **Semplificare Pagina Profilo (Rimozione Modifica Nickname/Nazionalità) (Task AUTH.2.1).**
4.  **Implementare "Stato d'Animo" su Profilo (Task AUTH.3.1).**
5.  **Implementare Link Esterni su Profilo (Task AUTH.3.2):** Struttura dati, UI (semplice, non necessariamente modale di modifica complessa subito), visualizzazione.
6.  **Rendere Pagina Profilo Navigabile (Task AUTH.3.3 - Inizio):** Logica per caricare profili via `userId` URL.
7.  **Implementare Pulsanti di Condivisione (Task D.8.1):** Iniziare con `navigator.share()` e "Copia Link" su `view-article.html`.
8.  **Documentazione Codice e Struttura Dati (Task D.3.B):** Iniziare a documentare in parallelo, specialmente `firestore-schema.md`.
9.  **Test e QA (D.4):** Testare le nuove funzionalità di registrazione e profilo.

---
