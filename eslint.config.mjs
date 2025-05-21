// eslint.config.mjs
import js from '@eslint/js';
import globals from 'globals';
import pluginJson from 'eslint-plugin-jsonc';
import pluginMarkdown from 'eslint-plugin-markdown';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
    // 1. Configurazione Globale degli Ignores
    {
        ignores: [
            'node_modules/', // Ignora node_modules nella root
            'functions/node_modules/', // Ignora node_modules dentro /functions
            '*.min.js',
            'documentation/', // Tutta la cartella documentation
            'images/',
            'audio/',
            '.devcontainer/',
            '.github/', // Ignora la cartella .github (contiene workflow e template issue, non codice sorgente da lintare)
            '*.svg',
            '*.png',
            '*.jpg',
            '*.ico',
            '*.txt',
            '*.yml',
            // File specifici da NON ignorare se presenti nella root (o altrove)
            // '!eslint.config.mjs', // Non ignorare se stesso
            // '!package.json',
            // '!.prettierrc.json',
            // '!firebase.json',
            // '!.firebaserc'
        ],
    },

    // 2. Configurazione base per file JavaScript Client-Side (ES Modules)
    {
        files: ['js/**/*.js', '*.js', '*.mjs'], // File .js nella cartella js, e .js, .mjs nella root
        ignores: ['functions/**/*.js', 'eslint.config.mjs'], // Escludi esplicitamente i file delle functions e questo file di config se *.js lo prende
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser, // Globali del browser (window, document, ecc.)
                // Aggiungi qui eventuali globali specifici del tuo progetto client-side
                EasyMDE: 'readonly', // Se usi EasyMDE come globale
                marked: 'readonly', // Se usi marked come globale
                showToast: 'readonly', // La tua funzione globale per i toast
                google: 'readonly', // Per Firebase/Google SDK
                createIcon: 'readonly', // Da blockies.mjs se esposto globalmente
                firebase: 'readonly', // Oggetto globale Firebase, se usato (anche se di solito si usano import specifici)
                // Per le classi dei giochi se sono globali (anche se sarebbe meglio fossero moduli)
                Animation: 'readonly',
                PowerUpItem: 'readonly',
                Player: 'readonly',
                Obstacle: 'readonly',
                Projectile: 'readonly',
                BaseEnemy: 'readonly',
                ArmoredEnemy: 'readonly',
                ShootingEnemy: 'readonly',
                EnemyProjectile: 'readonly',
                FlyingEnemy: 'readonly',
                ArmoredShootingEnemy: 'readonly',
                ToughBasicEnemy: 'readonly',
                DangerousFlyingEnemy: 'readonly',
                Glitchzilla: 'readonly',
                AudioManager: 'readonly', // Se l'oggetto AudioManager è globale
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            'no-console': 'warn', // Permetti console.warn e .error, ma avvisa per .log
            'require-await': 'warn', // Avvisa se una funzione async non ha await
            indent: ['warn', 4, { SwitchCase: 1 }],
            'space-before-function-paren': [
                'warn',
                {
                    anonymous: 'always',
                    named: 'never',
                    asyncArrow: 'always',
                },
            ],
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            // Potresti voler disabilitare/modificare 'no-prototype-builtins' se lo usi consapevolmente
            // 'no-prototype-builtins': 'off',
        },
    },

    // 2.B Configurazione specifica per eslint.config.mjs (ES Module, ambiente Node)
    {
        files: ['eslint.config.mjs'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node, // Per `module`, `require` se usati in contesti specifici (ma è mjs)
            },
        },
        rules: {
            'no-console': 'off', // Permetti console.log nel file di config
            // Potrebbe essere necessario importare 'js' e 'globals'
        },
    },

    // 3. Configurazione specifica per la cartella 'functions' (Node.js / CommonJS)
    {
        files: ['functions/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest', // O una versione specifica di Node.js che usi, es. 2020 per Node 14
            sourceType: 'commonjs', // Fondamentale per 'require' e 'module.exports'
            globals: {
                ...globals.node, // Aggiunge 'require', 'module', 'exports', 'process', ecc.
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            'no-console': 'off', // Nelle Cloud Functions console.log è usato per il logging (anche se functions.logger è meglio)
            // 'no-undef': 'off', // Se hai problemi con globali specifici di Firebase Functions che ESLint non riconosce
            // Potresti dover aggiungere regole specifiche per Node.js qui o disabilitare regole del browser.
        },
    },

    // 4. Configurazione per file JSON (usando eslint-plugin-jsonc)
    ...pluginJson.configs['flat/recommended-with-jsonc'],
    {
        files: ['**/*.json', '**/*.jsonc', '**/*.json5'],
        rules: {
            // "jsonc/sort-keys": "warn", // Esempio
        },
    },

    // 5. Configurazione per file Markdown e blocchi di codice al loro interno
    {
        files: ['**/*.md'],
        plugins: {
            markdown: pluginMarkdown,
        },
        processor: 'markdown/markdown', // Processa i file Markdown
    },
    // Questa configurazione si applica ai blocchi di codice *dentro* i file Markdown
    {
        files: [
            '**/*.md/*.{js,javascript,json,html,css,bash,sh,yaml,yml,jsx,ts,tsx,php,py,rb,go,java,c,cpp,cs,swift,kt,scala,rust,toml,graphql,sql,xml,powershell,dockerfile,Makefile,diff,ignore,properties,ini,bat,cmd,env,http,scss,less,styl,vue,svelte,astro,tf,hcl,bicep,terraform,jsonc,json5,mdx}',
        ], // Estendi con i linguaggi dei tuoi blocchi codice
        languageOptions: {
            // Opzioni di linguaggio di default per i blocchi di codice
            ecmaVersion: 'latest',
            sourceType: 'module', // Assumiamo moduli ES per JS nei MD, puoi cambiarlo
            globals: {
                ...globals.browser, // Globali comuni per esempi web
                ...globals.node, // Globali comuni per esempi Node
                // Aggiungi altri globali comuni per i tuoi esempi se necessario
            },
        },
        rules: {
            // Regole più permissive per i blocchi di codice negli esempi Markdown
            'no-console': 'off',
            'no-unused-vars': 'warn', // Avvisa ma non bloccare per variabili non usate negli esempi
            'no-undef': 'warn', // Avvisa per non definiti, utile per typo ma non bloccare
            'eol-last': 'off',
            indent: 'off', // L'indentazione è spesso difficile da gestire automaticamente nei blocchi MD
            'prettier/prettier': 'off', // Spesso Prettier può avere problemi con i blocchi MD
            // Potresti voler disabilitare altre regole che sono troppo restrittive per snippet di codice
        },
    },

    // 6. Applica eslint-config-prettier ALLA FINE per sovrascrivere regole di formattazione
    eslintConfigPrettier,
];
