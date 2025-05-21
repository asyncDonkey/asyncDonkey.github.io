DEVELOPMENT PLAN (v4.0.0 - Knowledge-on-Demand Pivot) 🚀
Data Ultimo Aggiornamento: 21 Maggio 2025 (Athena Update - Task SEC-RULE-001 Completato)
Visione Progetto: Evolvere la piattaforma in un'applicazione web (e futuramente mobile) per la "conoscenza on-demand". Gli utenti potranno richiedere articoli su argomenti specifici, votare le richieste, e gli autori potranno prendere in carico la stesura. Un sistema di "complimenti" e ranking incentiverà la partecipazione degli autori. Le funzionalità esistenti, come Donkey Runner, saranno mantenute.

Stato Generale del Progetto:
La piattaforma ha recentemente completato un'importante revisione della gestione dei profili utente e delle relative regole di sicurezza Firestore (SEC-RULE-001), introducendo una separazione tra dati privati e pubblici. È stato anche risolto un problema relativo alle notifiche per i badge. La priorità immediata rimane la stabilizzazione attraverso l'implementazione delle restanti raccomandazioni per firestore.rules e il completamento della documentazione dello schema (firestore-schema.md). Successivamente, lo sviluppo si concentrerà sulla realizzazione delle funzionalità core della nuova piattaforma "Knowledge-on-Demand" (KOD), partendo dalla riprogettazione della homepage e dall'implementazione del sistema di richiesta articoli.

Legenda Stati:

✅ COMPLETATO (Task concluso e verificato)

[x] COMPLETATO (Sub-task concluso)

[ ] DA FARE (Task pianificato, non iniziato)

[P] IN PROGRESSO (Task avviato)

⚠️ ON HOLD (Task sospeso o in attesa di dipendenze/decisioni)

🆕 NUOVO (Task introdotto in questa versione del devplan)

➡️ MIGRATO/SUPERSEDED (Task il cui scopo è stato assorbito da un altro o reso obsoleto)

⭐ KOD CORE (Task fondamentale per la nuova visione "Knowledge-on-Demand")

🎯 FASE 1: STABILIZZAZIONE E DOCUMENTAZIONE (PRIORITÀ CRITICA IMMEDIATA) 🎯
Task ANALYSIS-001.4 Follow-up (Priorità CRITICA): Implementare le raccomandazioni dell'analisi firestore.rules.

✅ ANALYSIS-001.4.1 / SEC-RULE-001: Revisionare e restringere l'accesso in lettura a /userProfiles/{userId}. (RACCOMANDAZIONE CHIAVE)

[x] Modificate regole Firestore per /userProfiles (solo owner/admin leggono dati privati).

[x] Introdotta nuova collezione /userPublicProfiles per dati pubblici (leggibile da utenti auth), incluso statusMessage.

[x] Create, modularizzate (userPublicProfileSync.js) e testate Cloud Functions (createUserPublicProfile, updateUserPublicProfile, deleteUserPublicProfile) per sincronizzare userProfiles -> userPublicProfiles.

[x] Aggiornati e testati js/profile.js, js/leaderboard.js, js/articleViewer.js, e js/comments.js per utilizzare /userPublicProfiles per la visualizzazione dei dati pubblici altrui e /userProfiles per i dati privati del proprietario.

[x] Debug e risoluzione notifica mancante per badge awardGlitchzillaSlayer (confermata corretta creazione in Firestore e funzionamento della Cloud Function aggiornata).

[x] Corretti i link nelle notifiche badge per usare ?userId= invece di ?uid=.

[ ] ANALYSIS-001.4.2 / SEC-RULE-002: Implementare validazione completa per externalLinks negli aggiornamenti del profilo utente.

[ ] ANALYSIS-001.4.3 / SEC-RULE-003: Mettere in sicurezza il meccanismo di aggiornamento del commentCount per /articles/{articleId}.

[ ] ANALYSIS-001.4.4 / SEC-RULE-004: Reintrodurre validazione stretta delle chiavi (keys().hasOnly([...])) per la creazione di documenti in /userIssues/{issueId}. (RACCOMANDAZIONE CHIAVE)

[ ] ANALYSIS-001.4.5 (Azione Utente): Investigare e risolvere attivamente il problema di caricamento di firestore.rules nell'emulatore, seguendo i log e i suggerimenti di troubleshooting.

🆕 Task SCHEMA-001: Aggiornare firestore-schema.md (Priorità ALTA)

Descrizione: Revisionare l'attuale struttura del database Firestore. Aggiornare il file documentation/firestoreDocumentation/firestore-schema.md per riflettere accuratamente tutte le collezioni, sottocollezioni, campi dei documenti e il loro scopo.

[x] Verificare e aggiornare la struttura di userProfiles per riflettere la sua natura privata.

[x] Documentare la nuova collezione userPublicProfiles (incluso statusMessage come campo pubblico).

[x] Aggiornato firestore-schema.md con le modifiche sopra.

[ ] Verificare la struttura di articles e relative sottocollezioni (es. comments, likes).

[ ] Verificare la struttura delle notifiche.

[ ] Documentare ogni nuova struttura introdotta per KOD (vedi sotto) man mano che viene definita.

Verifica Necessaria: Confronto con dati Firestore reali e regole.

⭐ FASE 2: CORE DEVELOPMENT - KNOWLEDGE-ON-DEMAND (KOD) PLATFORM ⭐
🆕 EPIC - KOD-PLATFORM: Funzionalità Core della Piattaforma "Knowledge-on-Demand" (Priorità ALTA)

⭐🆕 **Sub-Task KOD-FEAT-001: Sistema di Richiesta Articoli**
_ [ ] Definire struttura Firestore per le richieste articoli (es. `articleRequests/{requestId}` con campi: `topic`, `description`, `requesterUserId`, `timestamp`, `status` ['pending', 'assigned', 'completed', 'rejected'], `voteCount`, `editorUserId` (chi prende in carico)).
_ [ ] Progettare e implementare UI per la sottomissione di una richiesta articolo (accessibile dalla nuova homepage).
_ [ ] Implementare logica per gli utenti per votare le richieste articolo (+1).
_ [ ] Cloud Function (o logica client-protetta) per gestire i voti in modo sicuro.

⭐🆕 **Sub-Task KOD-FEAT-002: Riprogettazione Homepage (Impatto Elevato)**
_ [ ] Wireframe/Mockup del nuovo layout homepage. Sezioni chiave:
_ Modulo/CTA per richiedere un articolo.
_ Sezione "Richieste Articoli più Votate" (non ancora assegnate, filtrabili/ordinabili).
_ Sezione "Articoli Recenti/In Evidenza" (basati su KOD).
_ [ ] Riscrivere `index.html` per il nuovo layout.
_ [ ] Rifattorizzare/Riscrivere `js/homePageFeatures.js` per popolare le nuove sezioni.

⭐🆕 **Sub-Task KOD-FEAT-003: Assegnazione/Presa in Carico Articoli Richiesti**
_ [ ] UI per autori per visualizzare richieste disponibili e "prendere in carico" una richiesta.
_ [ ] Logica per aggiornare lo stato della richiesta articolo (es. `status: 'assigned'`, `editorUserId: currentUserId`).
_ [ ] Collegare la presa in carico al processo di sottomissione articolo esistente (`submit-article.html`). L'articolo sottomesso deve referenziare l'`articleRequestId` originale.
_ [ ] UI per l'utente che ha richiesto l'articolo per vedere lo stato della sua richiesta.

⭐🆕 **Sub-Task KOD-FEAT-004: Sistema di "Complimenti" per Autori e Ranking**
_ [ ] Definire come i "complimenti" vengono dati/registrati (es. `articles/{articleId}/compliments/{userId}` o `userProfiles/{authorId}/complimentsReceived/{complimentId}` con `giverUserId`, `timestamp`).
_ [ ] Progettare e implementare UI per dare un "complimento" all'autore di un articolo (es. un bottone sulla pagina dell'articolo).
_ [ ] Definire logica di ranking: come i complimenti (e/o altri fattori come numero articoli approvati) contribuiscono al ranking.
_ [ ] Struttura dati per i badge/banner di ranking (es. in `userProfiles/{userId}/rankBadges`).
_ [ ] Cloud Function per aggiornare il ranking/assegnare badge quando un autore riceve complimenti o raggiunge traguardi.
_ [ ] Visualizzare ranking/badge sul profilo utente e potenzialmente accanto al nome dell'autore negli articoli.

🆕 **Sub-Task KOD-FEAT-005: Strategia Applicazione Mobile (Placeholder per Ricerca Futura - Priorità BASSA)**
_ [ ] Valutazione iniziale: PWA vs Responsive Design vs Approcci Nativi per il futuro.
_ [ ] Identificare le funzionalità KOD chiave che beneficerebbero maggiormente da un'esperienza mobile dedicata.

🔧 TECHNICAL DEBT & REFACTORING 🔧
🆕 Task TECH-DEBT-001: Unificare Sistemi di Gestione Commenti (Priorità MEDIA-ALTA)

Descrizione: Investigare i due sistemi di commenti separati (js/comments.js per pagine generiche e js/articleViewer.js per articoli). Progettare e implementare un sistema unificato. Cruciale per consistenza e funzionalità future (notifiche, risposte).

[ ] Analizzare strutture Firestore correnti per entrambi i tipi di commenti.

[ ] Definire una struttura Firestore unica e consistente (es. commenti articoli sempre in articles/{articleId}/comments; decidere per commenti guestbook - es. guestbookEntries/{pageId}/comments).

[ ] Rifattorizzare js/comments.js e js/articleViewer.js per usare il sistema unificato.

[ ] Gestire migrazione dati per commenti esistenti, se necessario.

Verifica Necessaria: Code review e test approfonditi.

📚 PIANO DI SVILUPPO INTEGRATO (Stato Attuale & Funzionalità Esistenti) 📚
Sezione A: Gestione Contributi e Moderazione 🖋️
Stato: Il flusso base di sottomissione/revisione articoli è implementato e rimane centrale per KOD.

[x] A.4.2.6.A (Admin UI): Textarea per rejectionReason.

Task A.5: Sistema di Notifiche In-App (Base).

(Le funzionalità base del pannello e pagina "Tutte le Notifiche" sono COMPLETATE)

[x] Sub-task A.5.1: Struttura dati userProfiles/{userId}/notifications definita.

[x] Sub-task A.5.2: Logica Cloud Function per notifiche (articolo approvato/respinto, nuovo badge).

[x] Sub-task A.5.3: UI base nell'header (icona campanella con contatore).

[x] Sub-task A.5.4: Pagina o dropdown per visualizzare notifiche. (COMPLETATO)

[x] A.5.4.1: Struttura HTML del Pannello Notifiche (Dropdown).

[x] A.5.4.2: Styling CSS del Pannello Notifiche.

[x] A.5.4.3: Logica JS per Mostrare/Nascondere il Pannello.

[x] A.5.4.4: Logica JS per Caricare e Visualizzare le Notifiche nel Pannello.

[x] A.5.4.5: Logica JS per Interazione con Singola Notifica (Redirect, Marcatura come Letta).

[x] A.5.4.6: Funzionalità "Mark all as read" nel pannello.

[x] A.5.4.7: Link "Vedi tutte le notifiche" (Pagina all-notifications.html).

[ ] Sub-task A.5.5: Notifiche per Interazioni Sociali KOD (Fase 2 Notifiche KOD - Priorità MEDIA, dipende da KOD-FEAT-004 e TECH-DEBT-001).

[ ] Notifica all'autore quando un suo articolo riceve un "complimento".

[ ] Notifica all'utente quando la sua richiesta articolo viene presa in carico.

[ ] Notifica all'utente quando l'articolo da lui richiesto viene pubblicato.

⚠️ [ON HOLD] Notifiche per like/commenti generici (da rivalutare post-KOD).

⚠️ [ON HOLD] Notifiche per risposte ai commenti (richiede prima TECH-DEBT-001 e implementazione threading commenti).

Sezione AUTH: Gestione Autenticazione e Profilo Utente ✨👤
Stato: Le funzionalità di base del profilo sono presenti. Saranno potenziate dal sistema di ranking KOD.

(Task AUTH.1, AUTH.2, AUTH.3.1, AUTH.3.2.1, AUTH.3.3 - [x] Stato da v3.17.10)

Task AUTH.3: Miglioramenti Funzionali Pagina Profilo Utente (profile.html)

[x] Mini-Bio Utente (AUTH.3.4).

[x] Link Esterni (AUTH.3.2) - Vedi SEC-RULE-002 per validazione.

[x] Visualizzazione Badge/Riconoscimenti Utente (AUTH.3.4.B.2, AUTH.3.6.3) - Verrà espanso da KOD-FEAT-004.

[ ] Sub-task AUTH.3.2.2 (Miglioramento Visivo Link): Anteprime/icone sito per link esterni (Priorità MEDIA-BASSA).

Sub-task AUTH.3.4 (Opzionale/Idee Future):

[ ] Contatori Semplici (Data registrazione). (Priorità BASSA)

[x] Badge/Achievements Semplici (Pilota):

[x] Sub-task AUTH.3.4.B.1: Struttura Dati Base.

[x] Sub-task AUTH.3.4.B.3 (Glitchzilla Slayer): CF awardGlitchzillaSlayer.

[x] Sub-task AUTH.3.4.B.4 (Autore Debuttante): CF updateAuthorOnArticlePublish.

[ ] Sub-task AUTH.3.4.B.5 (10 Articoli Pubblicati): Tracciamento e assegnazione badge (Richiede CF). (Priorità MEDIA-BASSA, potrebbe integrarsi con KOD ranking).

[ ] Sub-task AUTH.3.5: Articoli Preferiti / Segnalibri (Priorità MEDIA-BASSA, potrebbe essere utile per KOD).

Sub-task AUTH.3.6: Miglioramenti Visivi Nickname. (Priorità MEDIA)

[ ] Sub-task AUTH.3.6.1: Nickname Dinamico - Glitchzilla Effect.

[ ] Sub-task AUTH.3.6.2: Nickname Dinamico - Icona Autore.

➡️ Sub-task AUTH.3.7: Sistema di Amicizie/Followers. (Priorità MOLTO BASSA / ON HOLD - Funzionalità KOD più prioritarie).

Sezione C: Funzionalità Specifiche Giochi/Piattaforma 🎮 & Contenuti Esistenti
Stato: Donkey Runner e Leaderboard rimangono come feature distintive.

Task C.1: Gestione Avatar Utente Personalizzato. (✅ COMPLETATO)

Task C.2: Donkey Runner (Gioco Esistente)

[x] C.2.4 (Donkey Runner): Leggibilità testi e usabilità form fullscreen.

[ ] Task C.2.8 (Donkey Runner): Risolvere problemi file audio mancanti. (Priorità BASSA)

Task C.3: Miglioramenti Leaderboard & Info Glitchzilla (Priorità MEDIA)

[x] Avatar aggiornati e performanti sulla Leaderboard (REGRESS-004).

[ ] Restanti miglioramenti funzionali o di UI per la leaderboard.

[ ] Miglioramenti Info Glitchzilla.

Task C.5: Migliorare UI/UX di Donkey Runner Game (Priorità MEDIA-BASSA).

➡️ Task C.NEW_FEATURE_HP_ACTIVITY: Visualizzare attività recenti sulla homepage. (SUPERSEDED da KOD-FEAT-002 - La nuova homepage avrà sezioni dedicate alle attività KOD).

Sezione D: Miglioramenti UI/UX e Ottimizzazioni Generali ✨
Stato: Alcuni task rimangono validi, altri verranno influenzati dalla riprogettazione KOD.

[x] Correzione ESLint showConfirmationModal in js/profile.js.

[x] Task D.3.B.6: Revisionare e aggiornare README.md (focus tecnologie).

[ ] Sub-task D.1.A.1: Aggiungere notifiche toast per conferma/errore like. (Priorità MEDIA-BASSA, se i "like" generici verranno mantenuti).

[ ] Task D.9: Migliorare UX per Utente Non Registrato. (Priorità MEDIA - Importante per attrarre nuovi utenti KOD).

➡️ Task D.UI-HP-FEATURED: Rivedere il layout grafico della card dell'articolo in evidenza sulla homepage. (SUPERSEDED da KOD-FEAT-002).

Task D.LEADERBOARD-UX: Migliorare UI/UX della Leaderboard (Priorità BASSA)

[ ] D.LEADERBOARD-UX.1: Stilizzare il pulsante di refresh della leaderboard.

[ ] D.LEADERBOARD-UX.2: Verificare e migliorare la responsività della tabella dei punteggi.

[ ] D.LEADERBOARD-UX.3: Progettare/implementare visualizzazione compatta/espandibile per le righe e valutarne la complessità.

(Altri task D come da piano precedente v3.17.10 - non elencati qui per brevità, da rivalutare singolarmente)

Sezione Sicurezza & Stabilità (Derivata da ANALYSIS-001.4) 🛡️
Stato: Ora inclusi nella Fase 1 CRITICA.

Task ANALYSIS-001.4: Analisi storage.rules e firestore.rules. (✅ ANALISI COMPLETATA, RACCOMANDAZIONI FORNITE)

[x] Analisi storage.rules.

[x] Analisi firestore.rules.

(Vedi inizio devplan per task di implementazione SEC-RULE-001 a SEC-RULE-004 e ANALYSIS-001.4.5)

Sezione E: Ricerca e Sviluppo a Lungo Termine 🔬📈
[x] Task E.4: Adozione e Implementazione Cloud Functions per Funzionalità Avanzate.

[x] Sub-task E.4.4: Decisione sull'adozione: SÌ.

[x] Implementate e deployate: updateAuthorOnArticlePublish, awardGlitchzillaSlayer, processUploadedAvatar, handleArticleStatusNotifications.

(KOD-FEAT-005 - Strategia Mobile rientra qui a lungo termine)

Sezione F: Fase di Perfezionamento Finale (Polish) 💅🎨
Stato: Da rivalutare dopo l'implementazione delle funzionalità KOD.

[x] F.2.4.3.A.1 (Icone Like/Commenti Homepage).

[x] F.2.4.3.A.2 (Icone Portal Card Homepage).

(Altri task F come da piano precedente v3.17.10 - da rivalutare)

✅ TASK COMPLETATI RECENTEMENTE (Focus Notifiche Panel/Page & Rules Analysis - Pre-Pivot KOD) ✅
(Riferimento a v3.18.3)

Task REGRESS-001: Impossibilità di Registrare Nuovi Utenti - COMPLETATO

Task REGRESS-002: Regressione Permessi Funzionalità Profilo Utente (Stato, Bio) - COMPLETATO

Task TEXT-001: Chiarire Testo Avatar su Pagina Registrazione - COMPLETATO

Task REGRESS-003.4 (Avatar - Default e Fallback): Avatar di Default Non Trovato / 404 - COMPLETATO

Task (Da ANALYSIS-001): Correzione Aggiornamento Link Esterni - COMPLETATO

Task REGRESS-NAV-AVATAR-001: Avatar non aggiornato nella Navbar - COMPLETATO

Task REGRESS-003.3 (Avatar - Stabilità profileUpdatedAt) - COMPLETATO

Task REGRESS-003.1 & REGRESS-003.2 (Avatar - Reattività e Cache Busting su profile.js) - COMPLETATO

Task C.1 (Avatar Utente - Fase Finale) / REGRESS-003.5: Test completo end-to-end del flusso avatar - COMPLETATO

Task REGRESS-004: Avatar non aggiornati in Leaderboard - COMPLETATO

[x] REGRESS-004.1: Applicata logica di cache-busting per gli avatar in js/leaderboard.js.

[x] REGRESS-004.2: Verificato che js/leaderboard.js recuperi profileUpdatedAt.

[x] REGRESS-004.3 (Nuovo): Ottimizzato recupero profili con query in in js/leaderboard.js.

Task REGRESS-005: Avatar non aggiornati in Articoli e Commenti - COMPLETATO

[x] Analizzati js/articleViewer.js, js/comments.js, js/homePageFeatures.js.

[x] Implementato recupero avatarUrls e profileUpdatedAt con cache-busting.

[x] Ottimizzato recupero profili con query in in js/articleViewer.js (per commenti) e js/homePageFeatures.js.

Task A.5 (Notifiche In-App via Cloud Functions) - PROGRESSO SIGNIFICATIVO / FUNZIONALITÀ BASE COMPLETATE

[x] A.5.1: Struttura dati userProfiles/{userId}/notifications definita.

[x] A.5.2: Implementare logica Cloud Function per notifiche (articolo approvato/respinto, nuovo badge).

[x] A.5.3: Implementare UI base nell'header (icona campanella con contatore).

[x] A.5.4.1: Definire Struttura HTML del Pannello Notifiche (Dropdown).

[x] A.5.4.2: Styling CSS del Pannello Notifiche.

[x] A.5.4.3: Logica JS per Mostrare/Nascondere il Pannello.

[x] A.5.4.4: Logica JS per Caricare e Visualizzare le Notifiche nel Pannello.

[x] A.5.4.5: Logica JS per Interazione con Singola Notifica (Redirect, Marcatura come Letta).

[x] A.5.4.6 (Opzionale): Implementare funzionalità "Mark all as read" nel pannello.

[x] A.5.4.7 (Opzionale): Implementare link "Vedi tutte le notifiche" nel pannello.

Task ANALYSIS-001.4: Analizzare storage.rules e firestore.rules. (ANALISI COMPLETATA, RACCOMANDAZIONI FORNITE)

[x] Analisi storage.rules completata.

[x] Analisi firestore.rules completata.
Spero che questa versione aggiornata del devplan rifletta accuratamente la nuova direzione e le priorità che hai definito. Fammi sapere se vuoi apportare modifiche o chiarimenti! E grazie a te per la collaborazione! 😊
