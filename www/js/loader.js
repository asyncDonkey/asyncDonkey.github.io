// www/js/loader.js - Reworked for ASCII Progress Bar & New Theme

import { setupGameEngine, preloadGameAssets, launchGame } from './donkeyRunner.js';
import { showToast } from './toastNotifications.js';

// Riferimenti agli elementi del DOM
const terminalContainer = document.getElementById('terminal-container');
const terminalLog = document.getElementById('terminal-log');
const asciiProgressBar = document.getElementById('ascii-progress-bar'); // Nuovo riferimento
const mainMenu = document.getElementById('main-menu');
const startGameBtn = document.getElementById('start-game-btn');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const glitchpediaBtn = document.getElementById('glitchpedia-btn');
const accountBtn = document.getElementById('account-icon-container'); // Riferimento corretto al container
const gameContainerWrapper = document.getElementById('game-container-wrapper');

const loadingMessages = [
    '[SYSTEM] Network interface online. Monitoring for anomalies...',
    '[ALERT] Unidentified polymorphic intrusion detected. System integrity compromised.',
    '[CRITICAL] Cascading failures detected in core kernel. Quarantine protocols failing.',
    '[SYSTEM] Emergency override engaged. Activating primary defense: donkeyDebugger protocol.',
    '[donkeyDebugger] Isolating corrupted nodes and purging memory sectors.',
    '[donkeyDebugger] Deploying counter-malware sub-routine: CodeDash.',
    '[CodeDash] Interface loaded. System cleanse initiated. Stand by.',
];

// Mappatura delle keyword per l'highlighting
const keywordClasses = {
    // Parole che lampeggeranno di rosso (errori e allarmi)
    ALERT: 'keyword-error',
    intrusion: 'keyword-error',
    compromised: 'keyword-error',
    CRITICAL: 'keyword-error',
    failures: 'keyword-error',
    corrupted: 'keyword-error',

    // Parole da evidenziare (termini di sistema e protocolli)
    SYSTEM: 'keyword-highlight',
    monitoring: 'keyword-highlight',
    donkeyDebugger: 'keyword-highlight',
    protocol: 'keyword-highlight',
    'sub-routine': 'keyword-highlight',
    CodeDash: 'keyword-highlight',
    Interface: 'keyword-highlight',
    cleanse: 'keyword-highlight',
};

let messageIndex = 0;
let charIndex = 0;
let typingInterval = 15; // Velocità di scrittura

function applyKeywordStyling(element, rawText) {
    let formattedHtml = rawText;
    for (const keyword in keywordClasses) {
        const regex = new RegExp(`\\b(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
        formattedHtml = formattedHtml.replace(regex, `<span class="${keywordClasses[keyword]}">$1</span>`);
    }
    element.innerHTML = formattedHtml;
}

async function typeWriterEffect() {
    return new Promise((resolve) => {
        if (messageIndex >= loadingMessages.length) {
            resolve();
            return;
        }

        const currentMessageDiv = document.createElement('div');
        terminalLog.appendChild(currentMessageDiv);
        terminalLog.scrollTop = terminalLog.scrollHeight;

        const currentRawMessage = loadingMessages[messageIndex];
        charIndex = 0;

        const typeChar = () => {
            if (charIndex < currentRawMessage.length) {
                currentMessageDiv.textContent += currentRawMessage.charAt(charIndex);
                charIndex++;
                setTimeout(typeChar, typingInterval);
            } else {
                applyKeywordStyling(currentMessageDiv, currentRawMessage);
                messageIndex++;
                setTimeout(resolve, 300); // Pausa più breve tra i messaggi
            }
        };
        typeChar();
    });
}

// NUOVA FUNZIONE per la barra di progresso ASCII
function updateAsciiProgressBar(percentage) {
    const barWidth = 40; // Larghezza della barra in caratteri
    const filledBlocks = Math.round((barWidth * percentage) / 100);
    const emptyBlocks = barWidth - filledBlocks;

    const filledChar = '█';
    const emptyChar = '░';

    const bar = filledChar.repeat(filledBlocks) + emptyChar.repeat(emptyBlocks);

    asciiProgressBar.textContent = `[${bar}] ${percentage}%`;
}

async function startLoadingSequence() {
    // --- 1. NASCONDI L'ICONA ALL'INIZIO ---
    if (accountBtn) accountBtn.style.display = 'none';
    // ------------------------------------

    terminalContainer.style.display = 'flex';
    mainMenu.style.display = 'none';
    gameContainerWrapper.style.display = 'none';

    setupGameEngine();
    const preloadPromise = preloadGameAssets();
    updateAsciiProgressBar(0);

    for (let i = 0; i < loadingMessages.length; i++) {
        await typeWriterEffect();
        const progress = Math.round(((i + 1) / loadingMessages.length) * 100);
        updateAsciiProgressBar(progress);
        await new Promise((res) => setTimeout(res, 100));
    }

    await preloadPromise;
    updateAsciiProgressBar(100);

    const finalMessage = document.createElement('div');
    finalMessage.innerHTML = 'EXECUTION COMPLETE. DISPLAYING MENU: <span class="blinking-cursor">_</span>';
    terminalLog.appendChild(finalMessage);
    terminalLog.scrollTop = terminalLog.scrollHeight;

    setTimeout(() => {
        terminalContainer.style.opacity = 0;
        setTimeout(() => {
            terminalContainer.style.display = 'none';
            mainMenu.style.display = 'flex';
            mainMenu.style.opacity = 1;

            // --- 2. MOSTRA DI NUOVO L'ICONA INSIEME AL MENU ---
            if (accountBtn) accountBtn.style.display = 'flex';
            // ----------------------------------------------------
        }, 800);
    }, 1200);
}

if (startGameBtn) {
    startGameBtn.addEventListener('click', () => {
        mainMenu.style.display = 'none';
        gameContainerWrapper.style.display = 'flex';
        launchGame();
    });
}

if (glitchpediaBtn) {
    glitchpediaBtn.addEventListener('click', () => {
        showToast('Apertura Glitchpedia...', 'info');
        const glitchpediaModal = document.getElementById('glitchpediaModal');
        if (glitchpediaModal) glitchpediaModal.style.display = 'block';
    });
}

// Listener per l'icona account/profilo.
// La logica di cosa fare (aprire modale login o profilo) è in auth.js e profile.js
// Qui ci assicuriamo solo che il contenitore esista.
if (accountBtn) {
    console.log('Account icon container is ready.');
}

document.addEventListener('DOMContentLoaded', startLoadingSequence);
