# Schema del Database Firestore di asyncDonkey.io (v4.0.0)

Questo documento descrive la struttura delle collezioni e dei documenti utilizzati nel database Firestore del progetto asyncDonkey.io, aggiornato secondo il piano di sviluppo v4.0.0 e l'introduzione della piattaforma Knowledge-on-Demand (KOD).

## Convenzioni Generali

- **Timestamp**: Dove indicato come `timestamp`, si riferisce al tipo di dato Timestamp di Firestore, tipicamente impostato con `serverTimestamp()` alla creazione o all'aggiornamento.
- **ID Utente (UID)**: Stringa univoca fornita da Firebase Authentication per identificare gli utenti. È l'ID del documento nelle collezioni `userProfiles` e `userPublicProfiles`.
- **Campi Opzionali/Default**: I valori di default indicati sono quelli impostati al momento della creazione del documento, se non diversamente specificato. Campi `null` indicano assenza di valore o valore non applicabile.
- **Relazioni**: Indicate dove un campo fa riferimento a un ID di un'altra collezione.

---

## 1. `userProfiles` (Dati Privati Utente)

Contiene i dati privati e completi dei profili degli utenti registrati. L'ID di ogni documento in questa collezione è l'UID dell'utente. **L'accesso in lettura a questa collezione è ristretto al proprietario del profilo e agli amministratori.** I dati pubblici destinati alla visualizzazione da parte di altri utenti sono memorizzati in `userPublicProfiles`.

**Struttura Documento Esempio (`/userProfiles/{userId}`):**

| Campo                    | Tipo                                    | Descrizione                                                                                                  | Note e Vincoli                                                                                                                |
| :----------------------- | :-------------------------------------- | :----------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| `userId`                 | string                                  | (ID del documento) UID dell'utente.                                                                          | Chiave primaria.                                                                                                              |
| `email`                  | string                                  | Indirizzo email dell'utente (usato per il login).                                                            | Unico, fornito da Firebase Auth. Non modificabile dall'utente post-registrazione. **Considerato privato.**                    |
| `nickname`               | string                                  | Nickname pubblico dell'utente.                                                                               | Obbligatorio. Impostato alla registrazione, min 3 / max 25 caratteri. **Sincronizzato su `userPublicProfiles`**.              |
| `createdAt`              | timestamp                               | Data e ora di creazione del profilo.                                                                         | Impostato con `serverTimestamp()`. Immutabile.                                                                                |
| `updatedAt`              | timestamp                               | Data e ora dell'ultimo aggiornamento del profilo (per campi come `statusMessage`, `externalLinks`, `bio`).   | Impostato con `serverTimestamp()` ad ogni modifica permessa.                                                                  |
| `profileUpdatedAt`       | timestamp                               | (Legacy o specifico per avatar) Data e ora dell'ultimo aggiornamento dell'avatar o dati critici del profilo. | Usato per cache-busting dell'avatar. Sarà sincronizzato o gestito in relazione a `userPublicProfiles.profilePublicUpdatedAt`. |
| `nationalityCode`        | string / null                           | Codice ISO 3166-1 alpha-2 della nazionalità (es. "IT") o "OTHER". `null` se non specificato.                 | Obbligatorio alla registrazione. **Sincronizzato su `userPublicProfiles` se reso pubblico.**                                  |
| `isAdmin`                | boolean                                 | Indica se l'utente ha privilegi di amministratore.                                                           | Default: `false`. Modificabile solo da altri admin.                                                                           |
| `statusMessage`          | string                                  | Breve messaggio di stato o "stato d'animo" dell'utente.                                                      | Modificabile dall'utente. Max 150 caratteri. Default: `""`. **Considerato privato.**                                          |
| `externalLinks`          | array di map                            | Lista di link esterni personali dell'utente.                                                                 | Modificabile dall'utente. Max 5 link. Default: `[]`. **Considerati privati finché non validati e resi pubblici.**             |
|                          | `[{ title: string, url: string }, ...]` | Ogni oggetto link ha `title` (max 50 char) e `url` (URL valido, max 2048 char).                              |                                                                                                                               |
| `earnedBadges`           | array di string                         | Lista degli ID dei badge guadagnati (riferimento a def. badge).                                              | Aggiornato dal sistema. Default: `[]`. La _visualizzazione_ pubblica dei badge avverrà tramite `userPublicProfiles`.          |
| `bio`                    | string                                  | Breve biografia o descrizione personale dell'utente.                                                         | Modificabile dall'utente. Max 300 caratteri. Default: `""`. **Sincronizzata su `userPublicProfiles`**.                        |
| `avatarUrls`             | map / null                              | Mappa contenente URL alle varie versioni dell'avatar utente.                                                 | Es. `{ original: "url", profile: "url_256x256", small: "url_48x48" }`. Gestito da Cloud Function.                             |
| `hasPublishedArticles`   | boolean                                 | Indica se l'utente ha pubblicato almeno un articolo.                                                         | Default: `false`. Gestito da Cloud Functions. **Sincronizzato su `userPublicProfiles`**.                                      |
| `hasDefeatedGlitchzilla` | boolean                                 | Indica se l'utente ha sconfitto Glitchzilla.                                                                 | Default: `false`. Gestito da Cloud Functions. **Sincronizzato su `userPublicProfiles`**.                                      |

---

## 2. `userPublicProfiles` (Dati Pubblici Utente - NUOVA COLLEZIONE)

Contiene una versione "snapshot" e pubblica dei dati del profilo utente, destinata alla visualizzazione da parte di altri utenti autenticati. L'ID di ogni documento è l'UID dell'utente. Questa collezione è gestita da Cloud Functions che sincronizzano i dati da `userProfiles`.

**Struttura Documento Esempio (`/userPublicProfiles/{userId}`):**

| Campo                    | Tipo          | Descrizione                                                                            | Note e Vincoli                                                                      |
| :----------------------- | :------------ | :------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------- |
| `userId`                 | string        | (ID del documento) UID dell'utente.                                                    | Chiave primaria. Corrisponde a `userProfiles/{userId}`.                             |
| `nickname`               | string        | Nickname pubblico dell'utente.                                                         | Obbligatorio. Sincronizzato da `userProfiles`.                                      |
| `bio`                    | string / null | Breve biografia pubblica.                                                              | Opzionale. Sincronizzata da `userProfiles`. Max 300 caratteri.                      |
| `statusMessage`          | string / null | (NUOVO PUBBLICO) Breve messaggio di stato o "stato d'animo" dell'utente.               | Opzionale. Sincronizzato da `userProfiles`. Max 150 caratteri.                      |
| `avatarUrls`             | map / null    | Mappa contenente URL alle versioni pubbliche dell'avatar.                              | Es. `{ thumbnail: "url_48x48.jpg" }`. Sincronizzato da `userProfiles.avatarUrls`.   |
| `nationalityCode`        | string / null | Codice ISO 3166-1 alpha-2 della nazionalità, se l'utente sceglie di renderlo pubblico. | Opzionale. Sincronizzato da `userProfiles`.                                         |
| `hasPublishedArticles`   | boolean       | Indica se l'utente ha pubblicato almeno un articolo.                                   | Default: `false`. Sincronizzato da `userProfiles`.                                  |
| `hasDefeatedGlitchzilla` | boolean       | Indica se l'utente ha sconfitto Glitchzilla.                                           | Default: `false`. Sincronizzato da `userProfiles`.                                  |
| `kodComplimentsReceived` | number        | Conteggio dei "complimenti" KOD ricevuti.                                              | Default: `0`. Aggiornato da Cloud Functions.                                        |
| `kodRank`                | string / map  | Rank o titolo KOD dell'utente.                                                         | Opzionale. Es. "Donkey Coder Bronzo" o `{ tier: "Bronze", title: "Donkey Coder" }`. |
| `profilePublicUpdatedAt` | timestamp     | Data e ora dell'ultimo aggiornamento di questo documento pubblico.                     | Impostato con `serverTimestamp()` dalla Cloud Function di sincronizzazione.         |

---

## 3. `articles`

Contiene gli articoli del blog/sito. _(Questa sezione rimane come nel tuo schema originale, la includo per completezza ma senza modifiche rispetto a quanto fornito, a meno che non mi chiedi di rivederla nel contesto KOD)_

**Struttura Documento Esempio (`/articles/{articleId}`):**

| Campo                   | Tipo             | Descrizione                                                                            | Note e Vincoli                                    |
| :---------------------- | :--------------- | :------------------------------------------------------------------------------------- | :------------------------------------------------ |
| `articleId`             | string           | (ID del documento) ID univoco dell'articolo.                                           | Generato da Firestore.                            |
| `authorId`              | string           | UID dell'autore (riferimento a `userProfiles`).                                        | Immutabile dopo la creazione.                     |
| `authorName`            | string           | Nickname dell'autore (denormalizzato da `userPublicProfiles.nickname`).                |                                                   |
| `authorNationalityCode` | string / null    | Codice nazionalità dell'autore (denormalizzato da `userPublicProfiles`).               |                                                   |
| `title`                 | string           | Titolo dell'articolo.                                                                  | Obbligatorio. Max 150 caratteri.                  |
| `contentMarkdown`       | string           | Contenuto completo dell'articolo in formato Markdown.                                  | Obbligatorio.                                     |
| `snippet`               | string           | Breve riassunto/introduzione dell'articolo.                                            | Max 300 caratteri.                                |
| `tags`                  | array di string  | Lista di tag associati all'articolo.                                                   |                                                   |
| `coverImageUrl`         | string / null    | URL di un'immagine di copertina per l'articolo.                                        | Opzionale. Deve essere un URL valido.             |
| `status`                | string           | Stato: `draft`, `pendingReview`, `published`, `rejected`.                              | Gestisce il workflow.                             |
| `createdAt`             | timestamp        | Data e ora di creazione iniziale.                                                      | Impostato con `serverTimestamp()`. Immutabile.    |
| `updatedAt`             | timestamp        | Data e ora dell'ultima modifica.                                                       | Impostato con `serverTimestamp()`.                |
| `publishedAt`           | timestamp / null | Data e ora di pubblicazione. `null` se non pubblicato.                                 | Impostato dall'admin all'approvazione.            |
| `likeCount`             | number           | Numero totale di "like" ricevuti.                                                      | Incrementale. Default: `0`.                       |
| `likedByUsers`          | array di string  | Lista degli UID degli utenti che hanno messo "like".                                   | Default: `[]`.                                    |
| `commentCount`          | number           | Numero totale di commenti.                                                             | Incrementale. Default: `0`.                       |
| `isFeatured`            | boolean          | Indica se l'articolo è "in evidenza".                                                  | Default: `false`. Modificabile dall'admin.        |
| `rejectionReason`       | string / null    | Motivo fornito dall'admin in caso di rifiuto.                                          | Opzionale. Impostato dall'admin.                  |
| `articleRequestId`      | string / null    | (NUOVO KOD) ID della `articleRequests` originale se l'articolo soddisfa una richiesta. | Opzionale. Collega l'articolo alla richiesta KOD. |

---

## 4. `articleComments`

Contiene i commenti associati agli articoli. _(Invariato rispetto al tuo schema, eccetto per la denormalizzazione da `userPublicProfiles`)_

**Struttura Documento Esempio (`/articleComments/{commentId}`):**

| Campo             | Tipo            | Descrizione                                                               | Note e Vincoli                              |
| :---------------- | :-------------- | :------------------------------------------------------------------------ | :------------------------------------------ |
| `commentId`       | string          | (ID del documento) ID univoco del commento.                               | Generato da Firestore.                      |
| `articleId`       | string          | ID dell'articolo a cui il commento appartiene (riferimento a `articles`). | Obbligatorio.                               |
| `userId`          | string / null   | UID dell'utente che ha scritto il commento, se loggato.                   | `null` per commenti anonimi (non previsto). |
| `userName`        | string / null   | Nickname dell'utente loggato (denormalizzato da `userPublicProfiles`).    |                                             |
| `nationalityCode` | string / null   | Codice nazionalità dell'utente (denormalizzato da `userPublicProfiles`).  |                                             |
| `message`         | string          | Contenuto del commento.                                                   | Obbligatorio. Max 1000 caratteri.           |
| `timestamp`       | timestamp       | Data e ora di invio.                                                      | Impostato con `serverTimestamp()`.          |
| `likes`           | number          | Numero di "like" ricevuti.                                                | Default: `0`.                               |
| `likedBy`         | array di string | Lista degli UID degli utenti che hanno messo "like".                      | Default: `[]`.                              |

---

## 5. `guestbookEntries`

Contiene i messaggi lasciati nel guestbook generale. _(Invariato rispetto al tuo schema, eccetto per la denormalizzazione da `userPublicProfiles`)_

**Struttura Documento Esempio (`/guestbookEntries/{entryId}`):**

| Campo             | Tipo            | Descrizione                                                                      | Note e Vincoli                     |
| :---------------- | :-------------- | :------------------------------------------------------------------------------- | :--------------------------------- |
| `entryId`         | string          | (ID del documento) ID univoco del messaggio.                                     | Generato da Firestore.             |
| `pageId`          | string          | Identificatore della pagina/sezione (es. "mainGuestbook").                       | Obbligatorio.                      |
| `userId`          | string / null   | UID dell'utente, se loggato.                                                     |                                    |
| `userName`        | string / null   | Nickname dell'utente loggato (denormalizzato da `userPublicProfiles`).           |                                    |
| `name`            | string / null   | Nome fornito dall'utente anonimo (se campo `commentName` visibile).              |                                    |
| `nationalityCode` | string / null   | Codice nazionalità dell'utente loggato (denormalizzato da `userPublicProfiles`). |                                    |
| `message`         | string          | Contenuto del messaggio.                                                         | Obbligatorio. Max 500 caratteri.   |
| `timestamp`       | timestamp       | Data e ora di invio.                                                             | Impostato con `serverTimestamp()`. |
| `likes`           | number          | Numero di "like" ricevuti.                                                       | Default: `0`.                      |
| `likedBy`         | array di string | Lista degli UID degli utenti che hanno messo "like".                             | Default: `[]`.                     |

---

## 6. `leaderboardScores`

Contiene i punteggi della leaderboard. _(Invariato rispetto al tuo schema, eccetto per la denormalizzazione da `userPublicProfiles`)_

**Struttura Documento Esempio (`/leaderboardScores/{scoreId}`):**

| Campo                 | Tipo           | Descrizione                                                                            | Note e Vincoli                                              |
| :-------------------- | :------------- | :------------------------------------------------------------------------------------- | :---------------------------------------------------------- |
| `scoreId`             | string         | (ID del documento) ID univoco del punteggio.                                           | Generato da Firestore.                                      |
| `gameId`              | string         | Identificatore del gioco.                                                              | Es. "donkeyRunner". Obbligatorio.                           |
| `userId`              | string / null  | UID dell'utente, se loggato.                                                           |                                                             |
| `userName`            | string         | Nickname dell'utente (denormalizzato da `userPublicProfiles`) o iniziali dell'anonimo. | Obbligatorio. Max 50 caratteri.                             |
| `initials`            | string         | Iniziali del giocatore (se anonimo).                                                   | Usato per `userName` se `userId` è `null`. Max 5 caratteri. |
| `nationalityCode`     | string / null  | Codice nazionalità (denormalizzato da `userPublicProfiles` se loggato).                |                                                             |
| `score`               | number         | Punteggio ottenuto.                                                                    | Obbligatorio. Intero non negativo.                          |
| `timestamp`           | timestamp      | Data e ora di registrazione.                                                           | Impostato con `serverTimestamp()`.                          |
| `glitchzillaDefeated` | boolean / null | `true` se il boss è stato sconfitto.                                                   | Opzionale.                                                  |

---

## 7. `userIssues`

Contiene le segnalazioni di bug e i suggerimenti. _(Invariato rispetto al tuo schema, eccetto `submittedBy.userName` e `submittedBy.userNationalityCode` da `userPublicProfiles`)_

**Struttura Documento Esempio (`/userIssues/{issueId}`):**

| Campo         | Tipo             | Descrizione                                                                                                 | Note e Vincoli                                                            |
| :------------ | :--------------- | :---------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| `issueId`     | string           | (ID del documento) ID univoco dell'issue.                                                                   | Generato da Firestore.                                                    |
| `userId`      | string           | UID dell'utente che ha inviato l'issue.                                                                     | Obbligatorio.                                                             |
| `submittedBy` | map              | Info denormalizzate sul mittente: `{ userId: string, userName: string, userNationalityCode: string/null }`. | `userName` e `userNationalityCode` da `userPublicProfiles`. Obbligatorio. |
| `title`       | string / null    | Titolo opzionale.                                                                                           | Max 150 caratteri.                                                        |
| `description` | string           | Descrizione dettagliata.                                                                                    | Obbligatorio. Max 2000 caratteri.                                         |
| `type`        | string           | Tipo: `generalFeature`, `newGameRequest`, `gameIssue`.                                                      | Obbligatorio.                                                             |
| `gameId`      | string / null    | ID del gioco, se `type` è `gameIssue`.                                                                      | Obbligatorio se `type` è `gameIssue`.                                     |
| `timestamp`   | timestamp        | Data e ora di creazione.                                                                                    | Impostato con `serverTimestamp()`.                                        |
| `updatedAt`   | timestamp / null | Data e ora dell'ultimo aggiornamento.                                                                       | Impostato con `serverTimestamp()` su modifica.                            |
| `status`      | string           | Stato: `new`, `underConsideration`, `accepted`, `planned`, `inProgress`, `completed`, `declined`.           | Default: `new`. Modificabile dall'admin.                                  |
| `upvotes`     | number           | Numero di upvote.                                                                                           | Default: `0`.                                                             |
| `upvotedBy`   | array di string  | Lista UID utenti che hanno fatto upvote.                                                                    | Default: `[]`.                                                            |

---

## 8. `badges` (Definizioni Badge)

Collezione per definire i badge disponibili nel sistema. _(Invariato rispetto al tuo schema)_

**Struttura Documento Esempio (`/badges/{badgeId}`):**

| Campo         | Tipo          | Descrizione                                                          | Note e Vincoli                                    |
| :------------ | :------------ | :------------------------------------------------------------------- | :------------------------------------------------ |
| `badgeId`     | string        | (ID del documento) Identificatore univoco del badge.                 | Es. "autore-debutante", "glitchzilla-slayer".     |
| `name`        | string        | Nome visualizzato del badge.                                         | Es. "Autore Debuttante".                          |
| `description` | string        | Descrizione di come si ottiene o cosa rappresenta il badge.          | Es. "Assegnato per il primo articolo pubblicato". |
| `iconUrl`     | string / null | URL dell'icona rappresentativa del badge.                            | Opzionale.                                        |
| `createdAt`   | timestamp     | Data di creazione della definizione del badge (per amministrazione). |                                                   |

---

## 9. Sottocollezione: Notifiche Utente (`userProfiles/{userId}/notifications`)

Memorizza le notifiche specifiche per un utente. _(Invariato rispetto al tuo schema)_

**Percorso:** `/userProfiles/{userId}/notifications/{notificationId}`

**Campi del Documento (`notificationId`):**

| Campo             | Tipo      | Descrizione                                                        | Esempio Valore                                         | Note                                                         |
| :---------------- | :-------- | :----------------------------------------------------------------- | :----------------------------------------------------- | :----------------------------------------------------------- |
| `type`            | String    | Tipo di notifica (per logica e iconografia).                       | `'article_approved'`, `'new_badge_awarded'`            |                                                              |
| `title`           | String    | Titolo breve della notifica.                                       | `"Articolo Approvato!"`                                | Max ~100 caratteri consigliato.                              |
| `message`         | String    | (Opzionale) Messaggio più dettagliato.                             | `"Il tuo articolo 'Storia dei Videogiochi' è online."` | Max ~250 caratteri consigliato.                              |
| `link`            | String    | (Opzionale) URL relativo alla risorsa target.                      | `"/view-article.html?id=ARTICLE_XYZ"`                  |                                                              |
| `timestamp`       | Timestamp | Data e ora di creazione.                                           | `FieldValue.serverTimestamp()`                         | Usato per ordinare le notifiche.                             |
| `isRead`          | Boolean   | Indica se l'utente ha letto/interagito.                            | `false` (default), `true`                              |                                                              |
| `icon`            | String    | (Opzionale) Nome icona (es. Material Symbols) o URL.               | `'check_circle'`, `'emoji_events'`                     | Per differenziare visivamente.                               |
| `relatedEntityId` | String    | (Opzionale) ID dell'entità correlata (es. `articleId`, `badgeId`). | `"ARTICLE_XYZ"`                                        | Utile per raggruppare o filtrare.                            |
| `userId`          | String    | ID dell'utente a cui è destinata la notifica.                      | `"USER_ABC"`                                           | Ridondante (già nel path), ma può semplificare query/regole. |

---

## 10. `articleRequests` (NUOVA COLLEZIONE - KOD)

Contiene le richieste di articoli fatte dagli utenti per la piattaforma Knowledge-on-Demand.

**Struttura Documento Esempio (`/articleRequests/{requestId}`):**

| Campo                | Tipo             | Descrizione                                                                           | Note e Vincoli                                         |
| :------------------- | :--------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------- |
| `requestId`          | string           | (ID del documento) ID univoco della richiesta.                                        | Generato da Firestore.                                 |
| `topic`              | string           | Argomento/titolo proposto per l'articolo.                                             | Obbligatorio. Max ~200 caratteri.                      |
| `description`        | string           | Descrizione più dettagliata della richiesta, cosa ci si aspetta dall'articolo.        | Obbligatorio. Max ~2000 caratteri.                     |
| `requesterUserId`    | string           | UID dell'utente che ha fatto la richiesta (riferimento a `userProfiles`).             | Obbligatorio.                                          |
| `requesterName`      | string           | Nickname dell'utente richiedente (denormalizzato da `userPublicProfiles`).            | Per visualizzazione rapida.                            |
| `timestamp`          | timestamp        | Data e ora della creazione della richiesta.                                           | Impostato con `serverTimestamp()`.                     |
| `status`             | string           | Stato della richiesta: `pending`, `assigned`, `completed`, `rejected`.                | Default: `pending`.                                    |
| `voteCount`          | number           | Numero di voti ricevuti per questa richiesta.                                         | Default: `0`. Incrementato da Cloud Function.          |
| `votedBy`            | array            | Array di UID degli utenti che hanno votato per questa richiesta.                      | Default: `[]`. Usato per prevenire voti multipli.      |
| `editorUserId`       | string / null    | UID dell'autore che ha preso in carico la richiesta (riferimento a `userProfiles`).   | `null` se non ancora assegnata.                        |
| `editorName`         | string / null    | Nickname dell'autore che ha preso in carico (denormalizzato da `userPublicProfiles`). | `null` se non ancora assegnata.                        |
| `assignedAt`         | timestamp / null | Data e ora in cui la richiesta è stata presa in carico.                               |                                                        |
| `completedArticleId` | string / null    | ID dell'articolo pubblicato che soddisfa questa richiesta (riferimento a `articles`). | `null` finché l'articolo non è completato e collegato. |

---

## 11. `compliments` (NUOVA COLLEZIONE - KOD)

Potrebbe essere una sottocollezione di `articles` o `userProfiles` per tracciare i "complimenti" dati agli autori.
Consideriamo per ora una sottocollezione di `articles` per semplicità iniziale, ma da valutare se centralizzare su `userProfiles` sia meglio per aggregazioni.

**Opzione A: Sottocollezione di Articoli**
**Percorso:** `/articles/{articleId}/compliments/{complimentId}` (dove `complimentId` potrebbe essere `giverUserId` per unicità per articolo)

| Campo         | Tipo      | Descrizione                                                     | Note e Vincoli                                       |
| :------------ | :-------- | :-------------------------------------------------------------- | :--------------------------------------------------- |
| `giverUserId` | string    | UID dell'utente che ha dato il complimento.                     | Obbligatorio.                                        |
| `giverName`   | string    | Nickname del donatore (denormalizzato da `userPublicProfiles`). | Per visualizzazione.                                 |
| `articleId`   | string    | ID dell'articolo complimentato.                                 | Ridondante se sottocollezione, ma utile se estratta. |
| `authorId`    | string    | UID dell'autore che riceve il complimento.                      | Obbligatorio.                                        |
| `timestamp`   | timestamp | Data e ora del complimento.                                     | Impostato con `serverTimestamp()`.                   |
| `type`        | string    | (Opzionale) Tipo di complimento se ce ne fossero diversi.       | Es. "insightful", "well-written".                    |

_Nota: Aggiorneremo questa sezione man mano che le funzionalità KOD saranno ulteriormente definite._

---
