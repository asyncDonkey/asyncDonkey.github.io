// www/js/loader.js

import { setupGameEngine, preloadGameAssets, launchGame } from './donkeyRunner.js';
import { showToast } from './toastNotifications.js';

const terminalContainer = document.getElementById('terminal-container');
const terminalLog = document.getElementById('terminal-log');
const progressBar1 = document.getElementById('progress-bar-1');
const progressBar2 = document.getElementById('progress-bar-2');
const mainMenu = document.getElementById('main-menu');
const startGameBtn = document.getElementById('start-game-btn');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const glitchpediaBtn = document.getElementById('glitchpedia-btn');
const accountBtn = document.getElementById('account-icon-btn'); // AGGIORNATO: Riferimento alla nuova icona
const gameContainerWrapper = document.getElementById('game-container-wrapper');

// MESSAGGI DI CARICAMENTO - ORA SOLO TESTO, LA FORMATTAZIONE AVVERRÀ DOPO
const loadingMessages = [
    "kernel: booting asynchronous debugging system...",
    "console: logging as donkeyDebugger...",
    "filesystem: sudo scanning /root/sys for anomalies...",
    "network: pinging remote glitch servers... (response: 404 not found)",
    "antivirus: donkeyDebugger protocol v2.0 activated.",
    "analysis: mysterious bugs and glitches detected in core system!",
    "protocol: only donkey runner protocols can clean this system.",
    "status: loading essential game assets for system cleanse...",
    "interface: preparing environment for execution. hold tight...",
    "system: donkeyDebugger is now active. system ready."
];

// Mappatura delle parole chiave ai nomi delle classi CSS per il colore
const keywordColors = {
    "kernel": "keyword-blue",
    "donkeyDebugger": "keyword-blue",
    "sudo": "keyword-green",
    "pinging": "keyword-yellow",
    "404 not found": "keyword-red",
    "antivirus": "keyword-blue",
    "analysis": "keyword-red",
    "bugs": "keyword-red",
    "glitches": "keyword-red",
    "protocol": "keyword-blue",
    "system": "keyword-green",
    "filesystem": "keyword-green",
    "network": "keyword-yellow",
    "console": "keyword-blue",
    "status": "keyword-green",
    "interface": "keyword-yellow",
    "execution": "keyword-red"
};


let messageIndex = 0;
let charIndex = 0;
let currentMessageDiv = null;
let typingInterval = 15; // Reso ancora più veloce

async function typeWriterEffect() {
    return new Promise(resolve => {
        if (messageIndex >= loadingMessages.length) {
            resolve();
            return;
        }

        currentMessageDiv = document.createElement('div');
        terminalLog.appendChild(currentMessageDiv);
        terminalLog.scrollTop = terminalLog.scrollHeight;

        const currentRawMessage = loadingMessages[messageIndex];
        charIndex = 0; // Reset charIndex for the new message

        const typeChar = () => {
            if (charIndex < currentRawMessage.length) {
                currentMessageDiv.textContent += currentRawMessage.charAt(charIndex);
                charIndex++;
                setTimeout(typeChar, typingInterval);
            } else {
                // Quando la riga è completa, applica la formattazione con colori
                applyKeywordColors(currentMessageDiv, currentRawMessage);
                messageIndex++;
                setTimeout(resolve, 600); // Pausa prima del prossimo messaggio
            }
        };
        typeChar();
    });
}

function applyKeywordColors(element, rawText) {
    let formattedHtml = rawText;
    for (const keyword in keywordColors) {
        if (rawText.includes(keyword)) {
            // Usa una regex globale e case-insensitive per trovare tutte le occorrenze
            // e assicurati di non sovrapporre gli span per le stesse parole
            // $& si riferisce alla stringa trovata dalla regex
            const regex = new RegExp(`\\b(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?!<\\/span>)\\b`, 'gi');
            formattedHtml = formattedHtml.replace(regex, `<span class="${keywordColors[keyword]}">$1</span>`);
        }
    }
    element.innerHTML = formattedHtml; // Sovrascrivi con l'HTML formattato
    element.style.textTransform = 'lowercase'; // Assicurati che rimanga minuscolo
}


function animateProgressBar(progressBar, targetPercentage, duration) {
    return new Promise(resolve => {
        let currentPercentage = 0;
        const intervalTime = 50;
        const increment = (targetPercentage / (duration * 1000 / intervalTime));

        const updateProgress = () => {
            if (currentPercentage < targetPercentage) {
                currentPercentage += increment;
                if (currentPercentage > targetPercentage) currentPercentage = targetPercentage;
                progressBar.style.width = currentPercentage + '%';
                progressBar.textContent = Math.floor(currentPercentage) + '%';
                setTimeout(updateProgress, intervalTime);
            } else {
                resolve();
            }
        };
        updateProgress();
    });
}

async function startLoadingSequence() {
    terminalContainer.style.display = 'flex';
    mainMenu.style.display = 'none';
    gameContainerWrapper.style.display = 'none';

    setupGameEngine();

    const preloadPromise = preloadGameAssets();

    for (let i = 0; i < loadingMessages.length; i++) {
        await typeWriterEffect();
        const progressIncrement = 100 / loadingMessages.length;
        if (progressBar1 && progressBar2) {
            if (i % 2 === 0) {
                await animateProgressBar(progressBar1, (i + 1) * progressIncrement, 0.4);
            } else {
                await animateProgressBar(progressBar2, (i + 1) * progressIncrement, 0.4);
            }
        }
    }

    await preloadPromise;

    if (progressBar1) await animateProgressBar(progressBar1, 100, 0.3);
    if (progressBar2) await animateProgressBar(progressBar2, 100, 0.3);

    // Final message with blinking cursor
    const finalMessage = document.createElement('div');
    finalMessage.innerHTML = "EXECUTION COMPLETE. DISPLAYING MENU: <span class=\"blinking-cursor\">_</span>";
    terminalLog.appendChild(finalMessage);
    terminalLog.scrollTop = terminalLog.scrollHeight;
    finalMessage.style.textTransform = 'lowercase';


    setTimeout(() => {
        terminalContainer.style.opacity = 0;
        setTimeout(() => {
            terminalContainer.style.display = 'none';
            mainMenu.style.display = 'flex';
            mainMenu.style.opacity = 1;
            console.log("Menu principale visualizzato.");
        }, 500);
    }, 1000);
}

if (startGameBtn) {
    startGameBtn.addEventListener('click', () => {
        console.log("Start Game button clicked.");
        mainMenu.style.display = 'none';
        gameContainerWrapper.style.display = 'flex';
        launchGame();
    });
}

if (leaderboardBtn) {
    leaderboardBtn.addEventListener('click', () => {
        console.log("Leaderboard button clicked.");
        showToast("Caricamento Classifica...", "info");
        window.location.href = 'leaderboard.html';
    });
}

if (glitchpediaBtn) {
    glitchpediaBtn.addEventListener('click', () => {
        console.log("Glitchpedia button clicked.");
        showToast("Apertura Glitchpedia...", "info");
        const glitchpediaModal = document.getElementById('glitchpediaModal');
        if (glitchpediaModal) glitchpediaModal.style.display = 'block';
    });
}

// AGGIORNATO: Listener per la nuova icona dell'account
if (accountBtn) {
    accountBtn.addEventListener('click', () => {
        console.log("Account icon clicked.");
        showToast("Apertura Account...", "info");
        window.location.href = 'profile.html';
    });
}

document.addEventListener('DOMContentLoaded', startLoadingSequence);