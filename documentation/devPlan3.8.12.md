# DEVELOPMENT PLAN (v3.8.12 - Workflow Articoli Respinti con Motivazione Completato)

**Stato del Progetto:** Implementati i like per articoli e commenti (con visualizzazione likers). Editor Markdown funzionante. Pagine `contribute.html` e `admin-dashboard.html` create e operative. Funzionalità admin per articoli complete. Sistema base di tracciamento issue implementato e funzionalità di upvote corretta. Avatar e bandierina autore aggiunti alle card articoli sulla homepage. Implementata la logica client-side completa per la gestione delle bozze articolo. UI "I Miei Articoli" in `profile.html` estesa per visualizzare tutti gli stati degli articoli. **Implementata la possibilità per l'admin di aggiungere un motivo di rifiuto (`rejectionReason`) per gli articoli, visualizzabile dall'autore, e risolti i relativi bug di notifica.**

---

🚧 **Prossimi Step e Task da Prioritizzare** 🚧

## Sezione A: Gestione Contributi e Moderazione
* **Task A.1: Pagina "Contribuisci"** `[x]` (Completata)
* **Task A.2: Sistema di Tracciamento Issue/Suggerimenti** `[x]` (Completato nelle funzionalità base, inclusi upvote e moderazione status admin)
* **Task A.3: Moderazione e Pubblicazione Articoli**
    * `[x]` Sub-task A.3.1: Regole Firestore per workflow articoli (Admin).
    * `[x]` Sub-task A.3.2: Interfaccia Admin (`admin-dashboard.html`) per gestione articoli (Pending, Pubblicati, Bozze, Respinti, Linee Guida).
    * `[x]` Sub-task A.3.3: Logica JS Interfaccia Admin.
    * `[ ]` Sub-task A.3.4: (Opzionale Esteso) Sistema di notifica base per l'autore.
* **Task A.4: Implementazione e Debug Regole Firestore per Moderazione Articoli Admin & Autore**
    * `[x]` Sub-task A.4.1: Regole Admin (V5.1 funzionante).
    * **Task A.4.2 (REVISIONATO): Permettere agli autori di modificare le proprie bozze e implementare workflow per articoli respinti.**
        * `[x]` Sub-task A.4.2.1: Regole Firestore per modifica bozze da autore.
        * `[x]` Sub-task A.4.2.2: UI in `profile.html` per visualizzare tutti gli stati degli articoli dell'utente.
        * `[x]` Sub-task A.4.2.3: Logica JS in `profile.js` per caricare e gestire tutti gli stati degli articoli dell'utente.
        * `[x]` Sub-task A.4.2.4: Modifiche a `submit-article.html` e `js/articleSubmission.js` per caricamento, modifica e invio bozze esistenti.
        * `[x]` Sub-task A.4.2.5: Estendere UI "I Miei Articoli" in `profile.html`.
        * `[x]` **Sub-task A.4.2.6: Workflow Articoli Respinti - Implementata la possibilità per l'admin di aggiungere un `rejectionReason` in `js/adminDashboard.js`. L'autore visualizza il motivo (`js/profile.js`).** *(Completato)*

---

## Sezione B: Sistema Articoli & Contributi Utente `[x]` (Completata nelle funzionalità base)

---

## Sezione G: Guestbook `[x]` (Completata nelle funzionalità base)

---

## Sezione C: Nuove Funzionalità e Miglioramenti Specifici Giochi/Piattaforma

* `[ ]` **Task C.1:** Gestione Avatar Utente Personalizzato
* `[ ]` **Task C.2:** Ottimizzazione Layout Mobile per Donkey Runner
* `[ ]` **Task C.3:** Miglioramenti Leaderboard & Info Glitchzilla (Sub-task C.3.1 - C.3.4)
* `[ ]` **Task C.4:** Migliorare Compatibilità e Prestazioni su iOS per Donkey Runner

---

## Sezione D: Miglioramenti UI/UX e Ottimizzazioni Generali

* **Task D.1: Miglioramenti UI/UX Generali**
    * `[x]` Sub-task D.1.A: Implementare Notifiche Toast per Feedback Utente (Modulare). *(Completato, `showToast` implementato e in uso)*
    * `[ ]` Sub-task D.1.B: Migliorare Messaggi di Caricamento (es. spinner visivamente più integrati, considerare skeleton loading per liste complesse come articoli o issue).
    * `[ ]` Sub-task D.1.C: Migliorare Gestione e Visualizzazione Errori (utilizzare `showToast` con messaggi specifici e user-friendly per tutti gli errori client-side e da Firestore, evitando `alert()` e messaggi troppo tecnici).
    * `[ ]` Sub-task D.1.D (Continuo): Ottimizzare layout mobile generale per tutte le pagine.
    * `[x]` Rivedere layout articoli homepage.
    * `[x]` Sub-task D.1.1: Link navigazione.
    * `[x]` Sub-task D.1.2: Riorganizzare visualizzazione "I Miei Articoli" in `profile.html` in una griglia di schede. *(Completato)*
* **Task D.2: Funzionalità Aggiuntive per l'Utente**
    * `[ ]` **Modifica Nazionalità dal profilo utente.**
    * `[ ]` Possibilità per gli utenti di cancellare i propri commenti (articoli e guestbook).
* **Task D.3: Ottimizzazioni del Codice**
    * `[x]` Refactoring JS (NON VERRA' EFFETTUATO)
    * `[ ]` Aggiungere commenti dettagliati e documentazione JSDoc alle funzioni e sezioni complesse per migliorare la manutenibilità.
* **Task D.4: Test e Quality Assurance**
    * `[ ]` Test cross-browser (Edge, Firefox, Safari) e cross-device (mobile, tablet) approfonditi per tutte le funzionalità chiave.
    * `[ ]` Definire casi di test formali per le principali interazioni utente e admin.
* **Task D.5: Filtri Avanzati per Leaderboard Globale** `[ ]`
* **Task D.6: Miglioramenti Stili Commenti e Interazioni Like**
    * `[ ]` Sub-task D.6.1: Rivedere gli stili per la sezione commenti (articoli e guestbook) per migliorare leggibilità e impatto visivo, specialmente su mobile.
    * `[x]` Sub-task D.6.2: Interattività bottoni like/conteggi.
* **Task D.7: Miglioramento Grafico Card Articoli Homepage** `[x]` (Completato)

---

🌍 ## Fase Successiva (Lungo Termine): Internazionalizzazione (i18n) Completa `[ ]`

---

## Considerazioni Chiave e Suggerimenti Migliorativi

* **Test Regole Firestore:** Con l'aumentare della complessità delle interazioni (autori, admin, stati diversi), è cruciale utilizzare il **Simulatore Firestore** nella console Firebase per testare ogni percorso logico delle regole prima del deployment. Questo aiuta a prevenire errori di permessi e comportamenti inattesi.
* **Input Admin per `rejectionReason`:** L'utilizzo attuale di `prompt()` per la `rejectionReason` è funzionale. Per un'esperienza admin più rifinita (e per gestire testi più lunghi o formattati), si potrebbe considerare di aggiungere un campo `textarea` dedicato nella modale di modifica dell'articolo quando si seleziona l'azione "Respingi", oppure una piccola modale apposita che appare dopo la conferma del rigetto.
* **Workflow Autore per Articoli Respinti:** L'attuale approccio (l'autore crea una *nuova* sottomissione basandosi sul feedback) è semplice dal punto di vista delle regole. Per migliorare l'UX, il pulsante "Crea Nuova Sottomissione" (per un articolo respinto) nella pagina profilo potrebbe reindirizzare a `submit-article.html` pre-popolando i campi con i dati dell'articolo respinto (es. tramite parametri URL o `localStorage`). Questo eviterebbe all'autore di dover fare copia-incolla manuale.
* **Coerenza `updatedAt`:** Mantenere la buona pratica di includere `updatedAt: serverTimestamp()` in tutte le operazioni di scrittura che modificano un documento, per tracciabilità e ordinamenti corretti.
* **Modularità del Codice:** Il modulo `toastNotifications.js` è un buon esempio. Continuare a valutare se altre parti del codice (es. interazioni specifiche con Firestore per entità come `articles` o `userIssues`) potrebbero beneficiare dall'essere estratte in moduli dedicati per mantenere `main.js` e gli altri script di pagina più focalizzati.
* **Gestione Errori Completa:** Oltre a sostituire gli `alert()`, assicurarsi che ogni blocco `try...catch` gestisca l'errore in modo appropriato, fornendo un feedback utile all'utente tramite `showToast` e loggando dettagli tecnici in console per il debug.
* **Sicurezza:**
    * **Sanificazione Input:** Anche se Firestore stesso non è vulnerabile a SQL injection, se si renderizza HTML basato su input utente (diverso da Markdown che viene parsato da `marked`), assicurarsi che sia sanificato per prevenire XSS. `textContent` è generalmente sicuro; `innerHTML` richiede cautela.
    * **Regole Firestore Robuste:** Continuare a pensare a casi limite e assicurarsi che le regole siano il più restrittive possibile pur permettendo le funzionalità desiderate.
* **Documentazione del Codice (Task D.3):** Con la crescente complessità, dedicare del tempo a commentare le funzioni più complesse, la logica di business e le decisioni architetturali diventerà sempre più importante per la manutenibilità a lungo termine.

---

## Prossimi Passi Possibili (da discutere)

1.  **Modifica Nazionalità dal profilo utente (Task D.2)**
2.  **Migliorare Messaggi di Caricamento (Sub-task D.1.B)**
3.  **Migliorare UI Admin per `rejectionReason`** (sostituire `prompt()`)
4.  **Avatar Utente Personalizzato (Task C.1)**
5.  **Aggiungere commenti dettagliati al codice (Task D.3)**

---
