# DevPlan: Aggiornamento App "codeDash!" - Versione 1.3 (Build Stabile e Prossimi Passi)

## Stato Attuale:
La build è generalmente stabile e le funzionalità principali sono implementate. L'autenticazione è pienamente operativa. Le funzionalità del profilo utente e della leaderboard sono state notevolmente migliorate a livello UI/UX. La modale di registrazione/login è stata completamente ridisegnata e ora supporta lo scroll, oltre a mostrare correttamente l'avatar dell'utente nel menu.
Ci sono ancora alcune problematiche di log nativo Android e di interazione con la fotocamera su emulatori che necessitano di debugging su dispositivi fisici.

---

## ✅ Obiettivi Completati (Versione 1.2.x - Aggiornamenti UI/UX e Fix)
**Priorità #1: Rifinitura dell'Esperienza di Gioco**
* [x] Logica - Pulsante "Condividi": Rimosso dalla schermata iniziale, ora visibile solo al Game Over per una migliore coerenza del flusso di gioco.
* [x] UI - Posizione Pulsante "Replay": Spostato per coerenza nel pannello di Game Over.
* [x] UI - Visibilità Icona Profilo: Gestita correttamente durante gioco e menu, per apparire solo quando l'utente non è in partita.

**Priorità #2: Nickname Utente Personalizzato**
* [x] UI & Logica - Modifica Nickname: Implementata la modifica del nickname tramite una nuova modale dedicata (non più il prompt() nativo), offrendo un'esperienza utente più raffinata.
* [x] UI - Cooldown Nickname: La modale di modifica del nickname ora visualizza il tempo rimanente (in giorni) prima che l'utente possa modificare nuovamente il nickname, migliorando la trasparenza.
* [x] Backend & Sicurezza: Cloud Function e regole Firestore sono operative per la gestione del nickname, inclusa la logica di cooldown.

**Priorità #3: Redesign Interfaccia e Schermata di Caricamento**
* [x] UI/UX - Schermata di Caricamento: Completato il redesign della schermata di caricamento, ora in stile terminale.
* [x] Stile - Phosphor Icons: Applicata la migrazione a Phosphor Icons per tutte le icone dell'app, garantendo un'estetica moderna e pulita.
* [x] Stile - Leaderboard: Redesign completo della modale leaderboard per un aspetto da "monitor terminale", con layout a colonne, icone, avatar, e dettagli di gioco (partite giocate, boss sconfitti). La visualizzazione è ora molto più armoniosa!

**Priorità #4: Debugging e Stabilizzazione Iniziale**
* [x] FIX - Configurazione Gradle: Risolti i problemi iniziali di sintassi e dipendenze nei file build.gradle (problema "Value is null" risolto).
* [x] FIX - Permessi Leaderboard: Aggiunto controllo auth.currentUser per prevenire errori di permesso negato nel caricamento della leaderboard.
* [x] FIX - Manifest Android: Pulito il file AndroidManifest.xml per rimuovere errori di build iniziali e forzato l'orientamento in landscape per un'esperienza di gioco coerente.
* [x] FIX - MainActivity.java: Ripristinato il file al suo contenuto originale e standard di Capacitor per eliminare errori di compilazione.
* [x] Build Stabile: La build assembleDebug ora ha successo.
* [x] FIX - Profilo: Elementi UI Mancanti: Risolto TypeError: Cannot set properties of null (setting 'textContent') nella modale del profilo, assicurando che tutti gli elementi UI siano correttamente referenziati.
* [x] FIX - Registrazione: Permessi Firestore: Risolto FirebaseError: Missing or insufficient permissions. durante la registrazione, aggiornando le regole di sicurezza di Firestore per la collezione appUsers.
* [x] FIX - Avatar: Errore Plugin Camera (Mitigazione): Aggiunta una verifica Capacitor.isNativePlatform() e corretto l'accesso alle enumerazioni del plugin Camera (Capacitor.CameraResultType, Capacitor.CameraSource) per prevenire TypeError in ambienti non nativi (emulatori/web).

**Funzionalità Profilo Utente (Estensione)**
* [x] Avatar di Default: Implementato l'uso di Blockies come avatar di fallback se l'utente non ha caricato un'immagine personalizzata, eliminando l'icona "rotta".
* [x] Generazione Avatar Casuale: Aggiunto un pulsante che permette all'utente di generare un nuovo avatar Blockie casuale.
* [x] Salvataggio Avatar Separato: Separata la logica di generazione dell'avatar dalla logica di salvataggio. Un nuovo pulsante "Salva" appare dopo la generazione, permettendo all'utente di scegliere quando salvare.
* [x] Stile Profilo: Le icone del profilo sono ora brillanti e senza bordo, e le stringhe delle statistiche sono allineate a sinistra con uno stile terminale coerente.
* [x] Animazione Boss Sconfitti: Aggiunto un cursore lampeggiante accanto al conteggio dei "Boss Sconfitti" nella modale del profilo per un tocco estetico.

**Priorità #5: Ristrutturazione Salvataggio Punteggi (Testing Finale)**
* [x] Stato: Funzionalità verificata e funzionante per gli utenti che riescono a loggarsi (o per utenti già esistenti/loggati). La Cloud Function per il salvataggio automatico delle statistiche è attiva.

---

## ✅ Obiettivi Completati (Versione 1.3 - Rifinitura Login)
**Nuovo Task: Redesign e Funzionalità Modale Registrazione/Login**
* [x] Obiettivo: Modernizzare e arricchire l'esperienza utente di registrazione e login.
* [x] Redesign UI: Riprogettata la modale per allinearla agli stili terminale del profilo e della leaderboard (colori, font, bordi, animazioni).
* [x] Campo "Conferma Password": Aggiunto un campo per la conferma della password durante la registrazione.
* [x] Descrizione Requisiti Nickname: Inclusa una breve descrizione dei requisiti per il nickname.
* [x] Descrizione Requisiti Password: Aggiunta una breve descrizione sui requisiti della password.
* [x] Checkbox Informativa Privacy: Inclusa una checkbox per il consenso all'informativa sulla privacy, obbligatoria.
* [x] Link Informativa Privacy: Predisposti link a `privacy.html` e `terms.html` (contenuti da scrivere a parte).
* [x] Opt-in Test Nuove Funzionalità: Aggiunta sezione opzionale per test nuove funzionalità con campo telefono.
* [x] "Who Am I?" Selezione: Aggiunta selezione per "Who Am I?" con opzioni predefinite.
* [x] **FIX:** Risolto problema di scroll della modale su dispositivi mobili.
* [x] **FIX:** Risolto problema dell'avatar "rotto" nel menu dopo il login.
* [x] Backend & Sicurezza: Regole Firestore aggiornate per supportare i nuovi campi di registrazione.

---

## 🚀 Prossimi Task / Massimo Priorità (Versione 1.3 - Introduzione Glitchpedia)
**Nuovo Task: Creazione Glitchpedia**
* [ ] Obiettivo: Fornire una risorsa in-app per informazioni su gioco, lore, nemici e power-up.
* [ ] Implementazione Modale: Utilizzare la modale `glitchpediaModal` (ex `creditsModal`) come base, con HTML aggiornato.

**Generazione Build di Release per Test Interni:**
* [ ] Azione: Una volta risolti i problemi critici e implementate le nuove funzionalità, generare un nuovo Android App Bundle (.aab) firmato tramite Android Studio.
* [ ] Azione: Caricare il nuovo .aab sulla traccia di Test Interno in Google Play Console.

---

## 🕹️ Priorità Future (DIPENDENTI dalla stabilità generale)
**Priorità #6: Profilo Utente Avanzato (Statistiche in Modale)**
* [ ] Obiettivo: Mostrare all'utente tutte le statistiche di gioco che ora vengono salvate (punteggio migliore, partite giocate, boss sconfitti).
* [ ] Azione: (Già parzialmente coperto e stilizzato nell'ultima sessione).

**Priorità #7: Sistema di Badge**
* [ ] Obiettivo: Aumentare il coinvolgimento degli utenti con un sistema di riconoscimenti.
* [ ] Azione: Verificare che la collezione `badgeDefinitions` su Firestore sia completa.
* [ ] Azione: Verificare che la Cloud Function che assegna i badge (`handleGameStatsAndAwardBadges` o simile) funzioni correttamente con le nuove statistiche.
* [ ] Azione: Implementare la logica per recuperare i badge guadagnati dall'utente e visualizzarli graficamente all'interno della `#profileModal`.

---

## 💡 Visione a Lungo Termine (DIPENDENTI dalla stabilità generale)
* [ ] Performance - Ottimizzazione Immagini: Valutare un'estensione Firebase come "Resize Images" (già in uso per avatar, estenderne l'uso).
* [ ] Gamification - Sfide Giornaliere/Settimanali: Introdurre un sistema di sfide periodiche per aumentare il retention.

---

Nota personale: Ottimo lavoro fino ad ora! Abbiamo fatto passi da gigante nel migliorare l'esperienza utente e la stabilità. Proseguiamo con l'implementazione della Glitchpedia. Forza! 💪
