// www/js/loader.js - v1.4.1 con durata adattata

import { setupGameEngine, preloadGameAssets, launchGame } from './donkeyRunner.js';
import { loadSound, playSound, audioContext } from './audioManager.js';

// Riferimenti DOM
const terminalContainer = document.getElementById('terminal-container');
const terminalLog = document.getElementById('terminal-log');
const mainMenu = document.getElementById('main-menu');
const startGameBtn = document.getElementById('start-game-btn');
const accountBtn = document.getElementById('account-icon-container');
const gameContainerWrapper = document.getElementById('game-container-wrapper');
const glitchpediaBtn = document.getElementById('glitchpedia-btn'); // VARIABILE REINSERITA
// Messaggi di caricamento
const loadingMessages = [
    'Initializing kernel v1.4...',
    'Scanning for system exploits...',
    '[ALERT] Multiple intrusions detected!', // Voce
    'Injecting system exploits... SUCCESS',   // Voce
    'Compiling shaders... [PASS]',
    'Loading asset manifest... DECRYPTED',
    'Final integrity check...',
    '[OK] System ready. Launching C0DEDASH.EXE', // Voce
];

// NUOVO: Definiamo quali messaggi (con indice 0-based) avranno una voce
const messagesWithVoice = [2, 3, 7]; // Corrisponde a "ALERT", "Injecting", "OK System ready"

const keywordClasses = {
    ALERT: 'keyword-error',
    intrusions: 'keyword-error',
    C0DEDASH: 'keyword-highlight',
    SUCCESS: 'keyword-highlight',
    DECRYPTED: 'keyword-highlight',
    OK: 'keyword-highlight',
};

let typingSoundSource = null;
let humSoundSource = null;

async function preloadLoaderSounds() {
    console.log('Pre-caricamento suoni del loader...');
    try {
        const soundAssetsToLoad = [
            loadSound('loading_hum', 'audio/loading_hum.mp3'),
            loadSound('typing_loop', 'audio/typing_loop.mp3'),
            loadSound('success_bleep', 'audio/success_bleep.mp3'),
        ];
        
        // Carica SOLO i file voce necessari
        messagesWithVoice.forEach(index => {
            const soundName = `log_${index + 1}`;
            const soundPath = `audio/${soundName}.mp3`;
            console.log(`Aggiunto al caricamento: ${soundName}`);
            soundAssetsToLoad.push(loadSound(soundName, soundPath));
        });

        await Promise.all(soundAssetsToLoad);
        console.log('Suoni del loader caricati con successo.');
    } catch (error) {
        console.warn('Uno o più suoni del loader non sono stati caricati:', error);
    }
}

function applyKeywordStyling(element, rawText) {
    let formattedHtml = rawText;
    for (const keyword in keywordClasses) {
        const regex = new RegExp(`\\b(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
        formattedHtml = formattedHtml.replace(regex, `<span class="${keywordClasses[keyword]}">$1</span>`);
    }
    element.innerHTML = formattedHtml;
}

async function typeWriterEffect(messageIndex) {
    const currentMessageDiv = document.createElement('div');
    terminalLog.appendChild(currentMessageDiv);
    terminalLog.scrollTop = terminalLog.scrollHeight;

    typingSoundSource = playSound('typing_loop', true, 0.7);

    const currentRawMessage = loadingMessages[messageIndex];
    let charIndex = 0;

    return new Promise((resolve) => {
        const typeChar = () => {
            if (charIndex < currentRawMessage.length) {
                currentMessageDiv.textContent += currentRawMessage.charAt(charIndex);
                charIndex++;
                setTimeout(typeChar, 25);
            } else {
                applyKeywordStyling(currentMessageDiv, currentRawMessage);
                if (typingSoundSource && typingSoundSource.stop) {
                    typingSoundSource.stop();
                }
                // Controlla se questo messaggio deve avere una voce
                if (messagesWithVoice.includes(messageIndex)) {
                    playSound(`log_${messageIndex + 1}`);
                }
                resolve();
            }
        };
        typeChar();
    });
}

function updateIndividualAsciiBar(barId, percentage) {
    const progressBarElement = document.getElementById(barId);
    if (!progressBarElement) return;
    const barWidth = 40;
    const filledBlocks = Math.round((barWidth * percentage) / 100);
    const emptyBlocks = barWidth - filledBlocks;
    const bar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
    progressBarElement.textContent = `[${bar}] ${percentage}%`;
}

function runLoadingBar(barId, duration) {
    return new Promise((resolve) => {
        let progress = 0;
        const intervalTime = Math.max(16, duration / 100); // Assicura un minimo di ~60fps
        const interval = setInterval(() => {
            progress += 1;
            if (progress >= 100) {
                progress = 100;
                updateIndividualAsciiBar(barId, progress);
                clearInterval(interval);
                resolve();
            }
            updateIndividualAsciiBar(barId, progress);
        }, intervalTime);
    });
}

async function startLoadingSequence() {
    try {
        document.body.addEventListener('click', () => {
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
        }, { once: true });

        await preloadLoaderSounds();

        if (accountBtn) accountBtn.style.display = 'none';
        terminalContainer.style.display = 'flex';
        mainMenu.style.display = 'none';
        gameContainerWrapper.style.display = 'none';
        terminalLog.innerHTML = '';
        updateIndividualAsciiBar('progress-bar-1', 0);
        updateIndividualAsciiBar('progress-bar-2', 0);
        updateIndividualAsciiBar('progress-bar-3', 0);

        humSoundSource = playSound('loading_hum', true, 0.4);

        setupGameEngine();
        const preloadPromise = preloadGameAssets();
        const bar1Promise = runLoadingBar('progress-bar-1', 8000 + Math.random() * 1000);
        const bar2Promise = runLoadingBar('progress-bar-2', 10000 + Math.random() * 1000);
        const bar3Promise = runLoadingBar('progress-bar-3', 12000 + Math.random() * 1000);

        for (let i = 0; i < loadingMessages.length; i++) {
            await typeWriterEffect(i);
            const pauseDuration = messagesWithVoice.includes(i) ? 2500 : 300;
            await new Promise((res) => setTimeout(res, pauseDuration));
        }

        await Promise.all([bar1Promise, bar2Promise, bar3Promise, preloadPromise]);

        if (humSoundSource && humSoundSource.stop) {
            humSoundSource.stop();
        }
        playSound('success_bleep');

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
                if (accountBtn) accountBtn.style.display = 'flex';
            }, 800);
        }, 1200);

    } catch (error) {
        console.error("ERRORE CRITICO durante la sequenza di caricamento:", error);
        terminalLog.innerHTML += `\n<span class="keyword-error">FATAL ERROR: ${error.message}</span>`;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startLoadingSequence);
} else {
    startLoadingSequence();
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

