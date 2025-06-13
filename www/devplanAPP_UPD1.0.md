# DevPlan: Aggiornamento App "codeDash!" - Versione 1.4 (Evoluzione Audio/Video & Gameplay)

## Stato Attuale:
La versione 1.3 è completa. La "Glitchpedia" è stata implementata con successo, fornendo una risorsa in-app ricca di contenuti su nemici, boss e power-up, inclusi i potenziamenti leggendari permanenti. La struttura della modale è stata aggiornata per accogliere sezioni dedicate e migliorare la navigazione. La base del gioco è solida e pronta per un importante passo evolutivo focalizzato sull'immersività e sul perfezionamento dell'esperienza utente.

---

## ✅ Obiettivi Completati (Versione 1.3 - Glitchpedia)
* **[x] Implementazione Glitchpedia:** Creata una risorsa in-app completa con descrizioni, pattern di attacco e strategie per tutti i nemici, i boss e i power-up.
* **[x] Struttura Modale Migliorata:** La modale della Glitchpedia ora utilizza pannelli accordion dedicati per "Bestiario", "Anomalie Principali (Boss)" e "Power-Up", migliorando l'organizzazione dei contenuti.
* **[x] Contenuti Dinamici e Dettagliati:** Le descrizioni riflettono le meccaniche di gioco, incluse le condizioni di sblocco e la natura permanente dei potenziamenti leggendari (Slayer Subroutine, Code Injector).
* **[x] Stile Coerente:** Le nuove sezioni mantengono lo stile "terminal" del resto dell'applicazione, garantendo coerenza visiva.

---

## 🚀 Prossimi Task / Massima Priorità (Versione 1.4 - Immersività)

**Priorità #1: Redesign Schermata di Caricamento**
* [ ] **Obiettivo:** Trasformare la schermata di caricamento da un semplice indicatore di progresso a un'esperienza tematica e coinvolgente.
* [ ] **UI/Grafica - Stringhe di Caricamento:** Sostituire i testi attuali con una sequenza di log più tematici e avvincenti (es. "Initializing kernel...", "Compiling shaders...", "Injecting system exploits...").
* [ ] **UI/Grafica - Barre di Progresso:** Rimpiazzare l'unica barra di caricamento con **tre barre parallele** che si riempiono rapidamente e in modo asincrono, dando una sensazione di processi multipli in esecuzione.
* [ ] **UI/Grafica - Messaggi Sopra le Barre:** Aggiungere etichette dinamiche sopra ciascuna barra (es. "DECRYPTING DATA", "LOADING ASSETS", "VERIFYING INTEGRITY").
* [ ] **Audio - Voce Robotica:** Integrare un file audio con una voce robotica che legge alcuni dei log più significativi mentre appaiono a schermo (breve, per non essere tedioso).
* [ ] **Audio - Effetti Sonori:** Aggiungere un suono di **digitazione da tastiera** che accompagna la comparsa del testo e un "bleep" o "hum" di sottofondo.

**Priorità #2: Revisione Audio In-Game**
* [ ] **Obiettivo:** Arricchire drasticamente l'esperienza sonora del gioco, rendendola più varia, dinamica e gratificante.
* [ ] **Musica di Background (BGM):**
    * [ ] **Azione:** Creare una playlist di circa **20 tracce musicali**.
    * [ ] **Azione:** Implementare una logica che selezioni e riproduca una traccia casuale dalla playlist all'inizio di ogni nuova partita.
* [ ] **Musica per i Boss:**
    * [ ] **Azione:** Selezionare e integrare una traccia audio specifica per le boss fight.
    * [ ] **Azione:** Implementare la logica per interrompere la BGM corrente e avviare la traccia del boss quando un'anomalia principale appare a schermo.
* [ ] **Effetti Sonori per Power-Up:**
    * [ ] **Azione:** Associare un effetto sonoro unico a ogni power-up raccolto.
    * [ ] **Azione:** Integrare i file audio (voce robotica che pronuncia il nome del power-up) che verranno generati.
* [ ] **Audio Game Over:**
    * [ ] **Azione:** Sostituire l'attuale suono di game over con uno più corto, secco e d'impatto.
    * [ ] **Azione:** Aggiungere una traccia musicale specifica per la schermata di Game Over, che parta dopo l'effetto sonoro.

**Priorità #3: Miglioramento Grafica In-Game**
* [ ] **Obiettivo:** Aumentare la profondità visiva e la coerenza tematica dell'ambiente di gioco.
* [ ] **Colore Sfondo:** Cambiare il colore di sfondo attuale con una tonalità più scura e in linea con l'estetica "terminal" (es. blu notte scuro, grigio antracite).
* [ ] **Effetto "Terminale":** Aggiungere un effetto di scanlines o griglia sottile sopra lo sfondo per emulare un vecchio monitor CRT.
* [ ] **Background Dinamico:** Implementare una funzione che disegni caratteri alfanumerici casuali (0, 1, simboli) nel background a diverse profondità (effetto parallasse). Questi caratteri dovrebbero apparire e svanire lentamente per dare un senso di flusso di dati costante.

**Priorità #4: Fix UI/UX Critici (Android)**
* [ ] **Obiettivo:** Eliminare imperfezioni visive su dispositivi fisici per un look professionale.
* [ ] **Azione:** Risolvere il problema del "pillar space" (banda laterale) su dispositivi con fotocamera interna (es. Galaxy S22). Il colore di sfondo di quest'area deve essere forzato a **nero (`#000000`)** per nascondere la barra e integrarsi con la scocca del dispositivo, come avviene nelle app principali (YouTube, etc.).

---

## 🕹️ Priorità Secondarie (Miglioramenti Gameplay & Logica)

* [ ] **Task: Revisione Logica Spawn Power-Up:** Analizzare e ottimizzare l'algoritmo che gestisce la comparsa dei power-up durante la partita per migliorare il bilanciamento e la varietà del gameplay.
* [ ] **Task: Finalizzazione Contenuti Statutari:** Scrivere e inserire il testo legale nei file `terms.html` e `privacy.html`, linkati dalla modale di registrazione.
* [ ] **Task: Revisione UI Glitchpedia:**
    * [ ] Analizzare e migliorare la logica di apertura/chiusura dei pannelli accordion per renderla più fluida.
    * [ ] Rivedere la logica del messaggio che si auto-compone alla fine della modale per assicurarsi che sia sempre visibile e non interferisca con lo scroll.

**Priorità #7: Sistema di Badge**

- [ ] Obiettivo: Aumentare il coinvolgimento degli utenti con un sistema di riconoscimenti.
- [ ] Azione: Verificare che la collezione `badgeDefinitions` su Firestore sia completa.
- [ ] Azione: Verificare che la Cloud Function che assegna i badge (`handleGameStatsAndAwardBadges` o simile) funzioni correttamente con le nuove statistiche.
- [ ] Azione: Implementare la logica per recuperare i badge guadagnati dall'utente e visualizzarli graficamente all'interno della `#profileModal`.

---

## 💡 Visione a Lungo Termine (Future Implementazioni)
* [ ] **Gamification - Sistema di Valuta:** Progettare e implementare un sistema di "monete" o "data-fragments" da raccogliere in gioco, da utilizzare in un futuro shop per upgrade o elementi cosmetici. (Bassa Priorità).
- [ ] Gamification - Sfide Giornaliere/Settimanali: Introdurre un sistema di sfide periodiche per aumentare il retention.


