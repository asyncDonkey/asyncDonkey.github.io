# Documentazione: Processi di Build Complessi (Webpack & Parcel)

## Introduzione ai Bundler di Moduli e Build Tools

I "build tools" (strumenti di compilazione/costruzione) e i "module bundlers" (aggregatori di moduli) sono strumenti software che automatizzano il processo di preparazione del codice sorgente per l'ambiente di produzione. Gestiscono e processano gli asset del progetto (JavaScript, CSS, immagini, ecc.) per ottimizzarli e renderli pronti per il deployment.

**Perché utilizzarli?**

- **Gestione delle Dipendenze:** Permettono di utilizzare moduli (es. `import`/`export` in JS, o dipendenze da `npm`) e li raggruppano in modo efficiente.
- **Ottimizzazione del Codice:**
    - **Minificazione:** Riducono la dimensione dei file JS, CSS, HTML rimuovendo caratteri non necessari (spazi, commenti) e accorciando i nomi delle variabili.
    - **Compressione:** Preparano i file per algoritmi di compressione (es. Gzip, Brotli).
- **Trasformazione del Codice (Transpiling):**
    - Convertono codice moderno (es. ES6+ JavaScript, TypeScript, JSX) in versioni compatibili con browser più datati (es. ES5) usando strumenti come Babel.
    - Processano preprocessori CSS (Sass, LESS) in CSS standard.
- **Code Splitting:** Dividono il codice in "pezzi" (chunks) più piccoli che possono essere caricati su richiesta (lazy loading), migliorando il tempo di caricamento iniziale della pagina.
- **Gestione degli Asset:** Possono processare e ottimizzare immagini, font, e altri tipi di file, includendoli nel bundle o gestendoli separatamente.
- **Hot Module Replacement (HMR):** Durante lo sviluppo, permettono di aggiornare i moduli nel browser senza ricaricare l'intera pagina, preservando lo stato dell'applicazione.
- **Variabili d'Ambiente:** Facilitano la gestione di configurazioni diverse per sviluppo e produzione.

---

## Webpack

Webpack è un potente e altamente configurabile static module bundler per applicazioni JavaScript moderne.

**Concetti Chiave di Webpack:**

1.  **Entry Point (`entry`):** Il file (o i file) da cui Webpack inizia a costruire il grafo delle dipendenze interne.
    - _Esempio:_ `'./src/index.js'`
2.  **Output (`output`):** Specifica dove e come Webpack deve emettere i bundle creati e altri asset.
    - _Esempio:_ `{ path: path.resolve(__dirname, 'dist'), filename: 'bundle.js' }`
3.  **Loaders (`module.rules`):** Trasformano i file sorgente. I loader permettono a Webpack di processare tipi di file diversi da JavaScript (es. CSS, immagini, TypeScript). Vengono eseguiti per modulo.
    - _Esempi:_ `babel-loader` (per transpilare JS), `css-loader` (per interpretare `@import` e `url()` in CSS), `style-loader` (per injettare CSS nel DOM), `file-loader` (per gestire file), `ts-loader` (per TypeScript).
4.  **Plugins (`plugins`):** Eseguono una gamma più ampia di task sui bundle. Intervengono in vari punti del processo di compilazione.
    - _Esempi:_ `HtmlWebpackPlugin` (genera un file HTML che include automaticamente i bundle), `MiniCssExtractPlugin` (estrae CSS in file separati), `CleanWebpackPlugin` (pulisce la directory di output prima di ogni build).
5.  **Mode (`mode`):** Può essere impostato su `'development'`, `'production'`, o `'none'`. Abilita ottimizzazioni predefinite di Webpack specifiche per ciascun ambiente.
    - `'production'`: Abilita minificazione, tree shaking (rimozione codice morto), e altre ottimizzazioni per la produzione.
    - `'development'`: Abilita source maps dettagliate e un server di sviluppo con live reload/HMR.
6.  **DevServer (`devServer`):** Fornisce un server di sviluppo locale con live reloading e HMR.

**Esempio Concettuale di Configurazione (`webpack.config.js`):**

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development', // o 'production'
    entry: './src/index.js', // Il tuo file JS principale
    output: {
        filename: 'main.[contenthash].js', // Aggiunge un hash per il cache busting
        path: path.resolve(__dirname, 'dist'),
        clean: true, // Pulisce la cartella 'dist' prima di ogni build
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader', // Per transpilare JavaScript moderno
                },
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'], // Per caricare e injettare CSS
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource', // Gestione moderna degli asset (Webpack 5+)
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html', // Template HTML
        }),
    ],
    devServer: {
        static: './dist',
        hot: true, // Abilita Hot Module Replacement
    },
    devtool: 'inline-source-map', // Per un debugging più facile in sviluppo
};
```
