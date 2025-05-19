# Canvas DevPlan: Migrazione a Firebase Hosting

**Obiettivo:** Migrare l'hosting del sito web statico da GitHub Pages a Firebase Hosting per una migliore integrazione con i servizi Firebase esistenti (Auth, Firestore, Functions) e per sfruttare potenzialmente la CDN di Google e funzionalità di hosting avanzate.

---

### Fase 1: Preparazione e Analisi

| Task                          | Dettagli                                                                                                                                      | Responsabile      | Stima      |
| :---------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- | :---------------- | :--------- |
| **Revisione Asset Statici**   | Catalogare tutti i file statici (HTML, CSS, JS, immagini, font, ecc.) attualmente serviti. Verificare che siano ben organizzati.              | Team di Sviluppo  | 2-4 ore    |
| **Analisi Processi di Build** | Identificare se sono necessari passaggi di build o pre-processing per gli asset statici. (Attualmente sembra non esserci un build complesso). | Team di Sviluppo  | 1-2 ore    |
| **Setup Firebase CLI**        | Assicurarsi che la Firebase CLI sia installata e configurata (`firebase login`, `firebase projects:list`, `firebase use <PROJECT_ID>`).       | Ogni Sviluppatore | <1 ora/dev |
| **Creazione Branch Git**      | Creare un nuovo branch Git per isolare i lavori di migrazione (es. `feat/firebase-hosting-migration`).                                        | Team di Sviluppo  | <0.5 ore   |

---

### Fase 2: Configurazione Firebase Hosting

| Task                               | Dettagli                                                                                                                                                                                                                                                                                                                                                                                          | Responsabile     | Stima    |
| :--------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------- | :------- |
| **Inizializzazione Hosting**       | Eseguire `firebase init hosting`. Selezionare progetto, specificare dir pubblica (es. `.`), SPA (probabilmente `N`), no build automatico con GitHub (per ora).                                                                                                                                                                                                                                    | Team di Sviluppo | 1-2 ore  |
| **Configurazione `firebase.json`** | Affinare la sezione `hosting`:<ul><li>`public`: Confermare directory.</li><li>`ignore`: File da non caricare.</li><li>`rewrites`: Per URL puliti o gestione routing (es. `/profile` -> `/profile.html`).</li><li>`headers`: Per caching (es. Cache-Control), sicurezza (CSP).</li><li>`cleanUrls`: true (opzionale, per URL senza `.html`).</li><li>`trailingSlash`: false (opzionale).</li></ul> | Team di Sviluppo | 2-4 ore  |
| **Aggiornamento `.gitignore`**     | Aggiungere file generati da Firebase che non vanno su Git (es. `.firebase/`, `firebase-debug.log`).                                                                                                                                                                                                                                                                                               | Team di Sviluppo | <0.5 ore |

---

### Fase 3: Sviluppo e Test Locali

| Task                           | Dettagli                                                                                                                                                                                                  | Responsabile        | Stima   |
| :----------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------ | :------ |
| **Test con Firebase Emulator** | Utilizzare `firebase emulators:start --only hosting` per testare localmente (solitamente su `http://localhost:5000`).                                                                                     | Team di Sviluppo    | 4-8 ore |
| **Verifica Funzionalità**      | Checklist:<ul><li>Navigazione completa.</li><li>Funzionamento script JS.</li><li>Caricamento CSS/immagini.</li><li>Integrazione con Auth, Firestore, Functions (usando emulatori se possibile).</li></ul> | Team di Sviluppo/QA | Incluso |

---

### Fase 4: Deployment su Canale di Anteprima (Staging)

| Task                               | Dettagli                                                                                                                                  | Responsabile        | Stima   |
| :--------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- | :------------------ | :------ |
| **Deploy su Canale di Anteprima**  | Distribuire su un canale di anteprima: `firebase hosting:channel:deploy NOME_CANALE --expires 7d`. Fornisce URL temporaneo per test live. | Team di Sviluppo    | 1-2 ore |
| **Test Approfonditi su Anteprima** | Eseguire test completi sul canale di anteprima, replicando scenari d'uso reali su diversi browser/dispositivi.                            | Team di Sviluppo/QA | 4-8 ore |

---

### Fase 5: Configurazione Dominio (Se Applicabile)

_Nota: Rilevante se si usa un dominio personalizzato._

| Task                                | Dettagli                                                                                                              | Responsabile                    | Stima                  |
| :---------------------------------- | :-------------------------------------------------------------------------------------------------------------------- | :------------------------------ | :--------------------- |
| **Aggiunta Dominio Personalizzato** | Aggiungere dominio nella console Firebase > Hosting. Seguire procedura guidata (verifica TXT).                        | Amministratore Dominio/Sviluppo | 1-2 ore (no DNS prop.) |
| **Aggiornamento Record DNS**        | Aggiornare record DNS (A o CNAME) per puntare a Firebase Hosting. Propagazione DNS può richiedere tempo (fino a 48h). | Amministratore Dominio          | 1 ora (no DNS prop.)   |

---

### Fase 6: Deployment in Produzione e Go-Live

| Task                                   | Dettagli                                                                                                       | Responsabile             | Stima    |
| :------------------------------------- | :------------------------------------------------------------------------------------------------------------- | :----------------------- | :------- |
| **Pianificazione Manutenzione (Opz.)** | Se si prevede downtime o per minimizzare impatto.                                                              | Project Manager/Sviluppo | -        |
| **Deploy su Canale Live**              | Eseguire `firebase deploy --only hosting` per aggiornare il sito principale.                                   | Team di Sviluppo         | <1 ora   |
| **Aggiornamento Config. GitHub Pages** | Se si usa dominio personalizzato, rimuovere/aggiornare CNAME o impostazioni repo GitHub per evitare conflitti. | Team di Sviluppo         | <1 ora   |
| **Monitoraggio Post-Deploy**           | Monitorare il sito live (log Firebase, console browser, feedback utenti) per le prime 24-48 ore.               | Team di Sviluppo         | Continuo |

---

### Fase 7: Post-Migrazione

| Task                             | Dettagli                                                                                                                                                           | Responsabile     | Stima   |
| :------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------- | :------ |
| **Aggiornamento Documentazione** | Aggiornare README, guide di deploy, ecc., per riflettere il nuovo setup di hosting.                                                                                | Team di Sviluppo | 2-4 ore |
| **Configurazione CI/CD (Opz.)**  | Impostare GitHub Actions per deploy automatici su Firebase Hosting (su PR per anteprima, su merge a main per produzione). Già menzionato nel `devPlan Concise.md`. | Team di Sviluppo | 4-8 ore |
| **Archiviazione Vecchio Deploy** | Rimuovere/archiviare configurazione GitHub Pages se non più necessaria.                                                                                            | Team di Sviluppo | <1 ora  |

---

### Piano di Rollback

| Scenario                                            | Azione                                                                                                                                         |
| :-------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| **Problemi critici post-deploy (dominio custom)**   | Ripristinare record DNS per puntare a GitHub Pages. (Richiede tempo di propagazione).                                                          |
| **Problemi critici post-deploy (dominio Firebase)** | Comunicare URL GitHub Pages come fallback. Risolvere problemi su Firebase Hosting e ridistribuire o deployare versione precedente funzionante. |
| **Rollback del Codice**                             | Usare Git per revertire modifiche e fare nuovo deploy.                                                                                         |
