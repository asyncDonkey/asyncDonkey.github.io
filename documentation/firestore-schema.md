# Schema del Database Firestore di asyncDonkey.io (v3.11.0)

Questo documento descrive la struttura delle collezioni e dei documenti utilizzati nel database Firestore del progetto asyncDonkey.io, aggiornato secondo il piano di sviluppo v3.11.0.

## Convenzioni Generali

- **Timestamp**: Dove indicato come `timestamp`, si riferisce al tipo di dato Timestamp di Firestore, tipicamente impostato con `serverTimestamp()` alla creazione o all'aggiornamento.
- **ID Utente (UID)**: Stringa univoca fornita da Firebase Authentication per identificare gli utenti. È l'ID del documento nella collezione `userProfiles`.
- **Campi Opzionali/Default**: I valori di default indicati sono quelli impostati al momento della creazione del documento, se non diversamente specificato. Campi `null` indicano assenza di valore o valore non applicabile.
- **Relazioni**: Indicate dove un campo fa riferimento a un ID di un'altra collezione.

---

## 1. `userProfiles`

Contiene i profili degli utenti registrati. L'ID di ogni documento in questa collezione è l'UID dell'utente.

**Struttura Documento Esempio (`/userProfiles/{userId}`):**

| Campo             | Tipo                                    | Descrizione                                                                                                | Note e Vincoli                                                                                              |
| :---------------- | :-------------------------------------- | :--------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------- |
| `userId`          | string                                  | (ID del documento) UID dell'utente.                                                                        | Chiave primaria.                                                                                            |
| `email`           | string                                  | Indirizzo email dell'utente (usato per il login).                                                          | Unico, fornito da Firebase Auth. Non modificabile dall'utente post-registrazione.                           |
| `nickname`        | string                                  | Nickname pubblico dell'utente.                                                                             | Obbligatorio. Impostato alla registrazione, min 3 / max 25 caratteri. Non modificabile dall'utente per ora. |
| `createdAt`       | timestamp                               | Data e ora di creazione del profilo.                                                                       | Impostato con `serverTimestamp()`. Immutabile.                                                              |
| `updatedAt`       | timestamp                               | Data e ora dell'ultimo aggiornamento del profilo (per campi come `statusMessage`, `externalLinks`, `bio`). | Impostato con `serverTimestamp()` ad ogni modifica permessa.                                                |
| `nationalityCode` | string / null                           | Codice ISO 3166-1 alpha-2 della nazionalità (es. "IT") o "OTHER". `null` se non specificato.               | Obbligatorio alla registrazione. Non modificabile dall'utente per ora.                                      |
| `isAdmin`         | boolean                                 | Indica se l'utente ha privilegi di amministratore.                                                         | Default: `false` alla creazione. Modificabile solo da altri admin (non implementato).                       |
| `statusMessage`   | string                                  | Breve messaggio di stato o "stato d'animo" dell'utente.                                                    | Modificabile dall'utente. Max 150 caratteri. Default: `""`.                                                 |
| `externalLinks`   | array di map                            | Lista di link esterni personali dell'utente.                                                               | Modificabile dall'utente. Max 3-5 link. Default: `[]`.                                                      |
|                   | `[{ title: string, url: string }, ...]` | Ogni oggetto link ha `title` (string, max 50 char) e `url` (string, URL valido, max 2048 char).            |                                                                                                             |
| `earnedBadges`    | array di string                         | Lista degli ID dei badge guadagnati dall'utente (riferimento a IDs nella collezione `badges`).             | Aggiornato dal sistema (es. admin, logica di gioco). Default: `[]`.                                         |
| `bio`             | string                                  | Breve biografia o descrizione personale dell'utente.                                                       | Modificabile dall'utente. Max 300 caratteri. Default: `""`.                                                 |

---

## 2. `articles`

Contiene gli articoli del blog/sito.

**Struttura Documento Esempio (`/articles/{articleId}`):**

| Campo                   | Tipo             | Descrizione                                                             | Note e Vincoli                                 |
| :---------------------- | :--------------- | :---------------------------------------------------------------------- | :--------------------------------------------- |
| `articleId`             | string           | (ID del documento) ID univoco dell'articolo.                            | Generato da Firestore.                         |
| `authorId`              | string           | UID dell'autore (riferimento a `userProfiles`).                         | Immutabile dopo la creazione.                  |
| `authorName`            | string           | Nickname dell'autore (denormalizzato).                                  |                                                |
| `authorNationalityCode` | string / null    | Codice nazionalità dell'autore (denormalizzato).                        |                                                |
| `title`                 | string           | Titolo dell'articolo.                                                   | Obbligatorio. Max 150 caratteri.               |
| `contentMarkdown`       | string           | Contenuto completo dell'articolo in formato Markdown.                   | Obbligatorio.                                  |
| `snippet`               | string           | Breve riassunto/introduzione dell'articolo.                             | Max 300 caratteri.                             |
| `tags`                  | array di string  | Lista di tag associati all'articolo.                                    |                                                |
| `coverImageUrl`         | string / null    | URL di un'immagine di copertina per l'articolo.                         | Opzionale. Deve essere un URL valido.          |
| `status`                | string           | Stato dell'articolo: `draft`, `pendingReview`, `published`, `rejected`. | Gestisce il workflow.                          |
| `createdAt`             | timestamp        | Data e ora di creazione iniziale.                                       | Impostato con `serverTimestamp()`. Immutabile. |
| `updatedAt`             | timestamp        | Data e ora dell'ultima modifica.                                        | Impostato con `serverTimestamp()`.             |
| `publishedAt`           | timestamp / null | Data e ora di pubblicazione. `null` se non pubblicato.                  | Impostato dall'admin all'approvazione.         |
| `likeCount`             | number           | Numero totale di "like" ricevuti.                                       | Incrementale. Default: `0`.                    |
| `likedByUsers`          | array di string  | Lista degli UID degli utenti che hanno messo "like".                    | Default: `[]`.                                 |
| `commentCount`          | number           | Numero totale di commenti.                                              | Incrementale. Default: `0`.                    |
| `isFeatured`            | boolean          | Indica se l'articolo è "in evidenza".                                   | Default: `false`. Modificabile dall'admin.     |
| `rejectionReason`       | string / null    | Motivo fornito dall'admin in caso di rifiuto.                           | Opzionale. Impostato dall'admin.               |

---

## 3. `articleComments`

Contiene i commenti associati agli articoli.

**Struttura Documento Esempio (`/articleComments/{commentId}`):**

| Campo             | Tipo            | Descrizione                                                               | Note e Vincoli                                                        |
| :---------------- | :-------------- | :------------------------------------------------------------------------ | :-------------------------------------------------------------------- |
| `commentId`       | string          | (ID del documento) ID univoco del commento.                               | Generato da Firestore.                                                |
| `articleId`       | string          | ID dell'articolo a cui il commento appartiene (riferimento a `articles`). | Obbligatorio.                                                         |
| `userId`          | string / null   | UID dell'utente che ha scritto il commento, se loggato.                   | `null` per commenti anonimi (se permessi, attualmente non nel piano). |
| `userName`        | string / null   | Nickname dell'utente loggato (denormalizzato).                            | `null` per anonimi.                                                   |
| `name`            | string / null   | Nome fornito dall'utente anonimo (se il form lo permette).                | Attualmente il form per i commenti articolo richiede login.           |
| `nationalityCode` | string / null   | Codice nazionalità dell'utente loggato (denormalizzato).                  |                                                                       |
| `message`         | string          | Contenuto del commento.                                                   | Obbligatorio. Max 1000 caratteri.                                     |
| `timestamp`       | timestamp       | Data e ora di invio.                                                      | Impostato con `serverTimestamp()`.                                    |
| `likes`           | number          | Numero di "like" ricevuti.                                                | Default: `0`.                                                         |
| `likedBy`         | array di string | Lista degli UID degli utenti che hanno messo "like".                      | Default: `[]`.                                                        |

---

## 4. `guestbookEntries`

Contiene i messaggi lasciati nel guestbook generale.

**Struttura Documento Esempio (`/guestbookEntries/{entryId}`):**

| Campo             | Tipo            | Descrizione                                                                                  | Note e Vincoli                     |
| :---------------- | :-------------- | :------------------------------------------------------------------------------------------- | :--------------------------------- |
| `entryId`         | string          | (ID del documento) ID univoco del messaggio.                                                 | Generato da Firestore.             |
| `pageId`          | string          | Identificatore della pagina/sezione del guestbook (es. "mainGuestbook", "donkeyRunnerGame"). | Obbligatorio.                      |
| `userId`          | string / null   | UID dell'utente, se loggato.                                                                 |                                    |
| `userName`        | string / null   | Nickname dell'utente loggato (denormalizzato).                                               |                                    |
| `name`            | string / null   | Nome fornito dall'utente anonimo (se campo `commentName` visibile).                          |                                    |
| `nationalityCode` | string / null   | Codice nazionalità dell'utente loggato (denormalizzato).                                     |                                    |
| `message`         | string          | Contenuto del messaggio.                                                                     | Obbligatorio. Max 500 caratteri.   |
| `timestamp`       | timestamp       | Data e ora di invio.                                                                         | Impostato con `serverTimestamp()`. |
| `likes`           | number          | Numero di "like" ricevuti.                                                                   | Default: `0`.                      |
| `likedBy`         | array di string | Lista degli UID degli utenti che hanno messo "like".                                         | Default: `[]`.                     |

---

## 5. `leaderboardScores`

Contiene i punteggi della leaderboard per i giochi (attualmente solo "donkeyRunner").

**Struttura Documento Esempio (`/leaderboardScores/{scoreId}`):**

| Campo                 | Tipo           | Descrizione                                                                   | Note e Vincoli                                              |
| :-------------------- | :------------- | :---------------------------------------------------------------------------- | :---------------------------------------------------------- |
| `scoreId`             | string         | (ID del documento) ID univoco del punteggio.                                  | Generato da Firestore.                                      |
| `gameId`              | string         | Identificatore del gioco.                                                     | Es. "donkeyRunner". Obbligatorio.                           |
| `userId`              | string / null  | UID dell'utente, se loggato.                                                  |                                                             |
| `userName`            | string         | Nickname dell'utente loggato o iniziali fornite dall'utente anonimo.          | Obbligatorio. Max 50 caratteri.                             |
| `initials`            | string         | Iniziali del giocatore (se anonimo).                                          | Usato per `userName` se `userId` è `null`. Max 5 caratteri. |
| `nationalityCode`     | string / null  | Codice nazionalità dell'utente (denormalizzato da `userProfiles` se loggato). |                                                             |
| `score`               | number         | Punteggio ottenuto nel gioco.                                                 | Obbligatorio. Intero non negativo.                          |
| `timestamp`           | timestamp      | Data e ora di registrazione del punteggio.                                    | Impostato con `serverTimestamp()`.                          |
| `glitchzillaDefeated` | boolean / null | `true` se il boss è stato sconfitto.                                          | Opzionale.                                                  |

---

## 6. `userIssues`

Contiene le segnalazioni di bug e i suggerimenti inviati dagli utenti.

**Struttura Documento Esempio (`/userIssues/{issueId}`):**

| Campo         | Tipo             | Descrizione                                                                                                  | Note e Vincoli                                                                          |
| :------------ | :--------------- | :----------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- |
| `issueId`     | string           | (ID del documento) ID univoco dell'issue.                                                                    | Generato da Firestore.                                                                  |
| `userId`      | string           | UID dell'utente che ha inviato l'issue (da `request.auth.uid`).                                              | Obbligatorio.                                                                           |
| `submittedBy` | map              | Oggetto contenente info denormalizzate sul mittente al momento dell'invio.                                   | `{ userId: string, userName: string, userNationalityCode: string/null }`. Obbligatorio. |
| `title`       | string / null    | Titolo opzionale dell'issue.                                                                                 | Max 150 caratteri.                                                                      |
| `description` | string           | Descrizione dettagliata dell'issue.                                                                          | Obbligatorio. Max 2000 caratteri.                                                       |
| `type`        | string           | Tipo di issue: `generalFeature`, `newGameRequest`, `gameIssue`.                                              | Obbligatorio.                                                                           |
| `gameId`      | string / null    | ID del gioco di riferimento, se `type` è `gameIssue`.                                                        | Obbligatorio se `type` è `gameIssue`.                                                   |
| `timestamp`   | timestamp        | Data e ora di creazione dell'issue.                                                                          | Impostato con `serverTimestamp()`.                                                      |
| `updatedAt`   | timestamp / null | Data e ora dell'ultimo aggiornamento (es. cambio di stato, modifica admin).                                  | Impostato con `serverTimestamp()` su modifica.                                          |
| `status`      | string           | Stato dell'issue: `new`, `underConsideration`, `accepted`, `planned`, `inProgress`, `completed`, `declined`. | Default: `new`. Modificabile dall'admin.                                                |
| `upvotes`     | number           | Numero di upvote ricevuti.                                                                                   | Default: `0`.                                                                           |
| `upvotedBy`   | array di string  | Lista degli UID degli utenti che hanno fatto upvote.                                                         | Default: `[]`.                                                                          |

---

## 7. `badges` (Collezione per Gamification - Task AUTH.3.4 Opzionale)

Collezione per definire i badge disponibili nel sistema.

**Struttura Documento Esempio (`/badges/{badgeId}`):**

| Campo         | Tipo          | Descrizione                                                          | Note e Vincoli                                    |
| :------------ | :------------ | :------------------------------------------------------------------- | :------------------------------------------------ |
| `badgeId`     | string        | (ID del documento) Identificatore univoco del badge.                 | Es. "autore-debutante", "glitchzilla-slayer".     |
| `name`        | string        | Nome visualizzato del badge.                                         | Es. "Autore Debuttante".                          |
| `description` | string        | Descrizione di come si ottiene o cosa rappresenta il badge.          | Es. "Assegnato per il primo articolo pubblicato". |
| `iconUrl`     | string / null | URL dell'icona rappresentativa del badge.                            | Opzionale.                                        |
| `createdAt`   | timestamp     | Data di creazione della definizione del badge (per amministrazione). |                                                   |

---
