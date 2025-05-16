// eslint.config.mjs
import js from '@eslint/js';
import globals from 'globals';
import pluginJson from 'eslint-plugin-jsonc'; // Usiamo eslint-plugin-jsonc che è più completo per JSON
import pluginMarkdown from 'eslint-plugin-markdown'; // Plugin per Markdown
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
    // Configurazione Globale degli Ignores
    // Questo sostituisce .eslintignore
    {
        ignores: [
            'node_modules/',
            '*.min.js',
            'documentation/',
            'images/',
            'audio/',
            '.devcontainer/',
            '.github/',
            '*.svg',
            '*.png',
            '*.jpg',
            '*.ico',
            // "*.md", // Non ignorare i MD se vuoi lintare i blocchi di codice al loro interno
            '*.txt',
            '*.yml',
            // NON ignorare eslint.config.mjs, package.json, .prettierrc.json
        ],
    },

    // Configurazione base per tutti i file JavaScript
    {
        files: ['**/*.{js,mjs,cjs}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                EasyMDE: 'readonly',
                marked: 'readonly',
                showToast: 'readonly',
                google: 'readonly',
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            'no-console': 'warn',
            'require-await': 'warn',
            indent: ['warn', 4, { SwitchCase: 1 }], // SwitchCase: 1 è una configurazione comune
            'space-before-function-paren': [
                'warn',
                {
                    anonymous: 'always',
                    named: 'never',
                    asyncArrow: 'always',
                },
            ],
            // Potresti aver bisogno di disabilitare/modificare regole specifiche da js.configs.recommended
            // se entrano in conflitto con le tue abitudini o con Prettier, anche se eslintConfigPrettier
            // dovrebbe gestire la maggior parte dei conflitti di formattazione.
            // Esempio: se 'no-unused-vars' è troppo aggressivo durante lo sviluppo:
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Ignora argomenti che iniziano con _
        },
    },

    // Configurazione per file JSON (usando eslint-plugin-jsonc)
    // Questo plugin può gestire JSON, JSONC (JSON con commenti), e JSON5
    // Assicurati di averlo installato: npm install eslint-plugin-jsonc --save-dev
    ...pluginJson.configs['flat/recommended-with-jsonc'], // Usa la configurazione flat raccomandata per JSONC
    // Puoi aggiungere configurazioni specifiche per JSON5 se necessario,
    // o sovrascrivere regole per i file JSON qui:
    {
        files: ['**/*.json', '**/*.jsonc', '**/*.json5'],
        rules: {
            // Esempio: se vuoi regole specifiche per i tuoi file JSON
            // "jsonc/sort-keys": "warn"
        },
    },

    // Configurazione per file Markdown
    {
        files: ['**/*.md'],
        plugins: {
            markdown: pluginMarkdown,
        },
        processor: 'markdown/markdown',
    },
    // Configurazione specifica per i blocchi di codice DENTRO i file Markdown
    {
        files: ['**/*.md/*.{js,javascript,mjs,cjs,html,css,json,yaml,xml}'], // Target per blocchi di codice
        // Eredita le regole JS, ma sovrascrivi alcune per gli esempi
        rules: {
            ...js.configs.recommended.rules, // Riprendi le regole JS base
            'no-console': 'off', // Permetti console.log negli esempi MD
            'no-unused-vars': 'warn', // Segnala variabili non usate, ma solo come warning
            indent: 'off', // Spesso l'indentazione nei MD è problematica per ESLint
            'eol-last': 'off', // L'ultima riga vuota può essere fastidiosa nei blocchi MD
        },
    },

    // Applica eslint-config-prettier ALLA FINE
    eslintConfigPrettier,
];
