// www/js/loader.js

import { setupGameEngine, preloadGameAssets, launchGame } from './donkeyRunner.js';
import { showToast } from './toastNotifications.js'; // Assicurati di importare showToast

const terminalContainer = document.getElementById('terminal-container');
const terminalLog = document.getElementById('terminal-log');
const progressBar1 = document.getElementById('progress-bar-1');
const progressBar2 = document.getElementById('progress-bar-2');
const mainMenu = document.getElementById('main-menu');
const startGameBtn = document.getElementById('start-game-btn');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const glitchpediaBtn = document.getElementById('glitchpedia-btn');
const accountBtn = document.getElementById('account-btn');
const gameContainerWrapper = document.getElementById('game-container-wrapper'); // Contenitore del gioco

const loadingMessages = [
    "BOOTING SYSTEM...",
    "INITIALIZING SUBROUTINES...",
    "SCANNING FOR MALICIOUS CODE...",
    "ESTABLISHING SECURE CONNECTION...",
    "LOADING GAME ASSETS...",
    "PREPARING ENVIRONMENT...",
    "SYSTEM READY. AWAITING COMMANDS..."
];

let messageIndex = 0;
let charIndex = 0;
let currentMessageDiv = null;
let typingInterval = 50; // ms per carattere

async function typeWriterEffect() {
    return new Promise(resolve => {
        if (messageIndex >= loadingMessages.length) {
            resolve();
            return;
        }

        currentMessageDiv = document.createElement('div');
        terminalLog.appendChild(currentMessageDiv);

        const typeChar = () => {
            if (charIndex < loadingMessages[messageIndex].length) {
                currentMessageDiv.textContent += loadingMessages[messageIndex].charAt(charIndex);
                charIndex++;
                setTimeout(typeChar, typingInterval);
            } else {
                currentMessageDiv.textContent += ' _'; // Add blinking cursor
                messageIndex++;
                charIndex = 0;
                setTimeout(resolve, 800); // Pause before next message or completion
            }
        };
        typeChar();
    });
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
    // Hide everything initially
    terminalContainer.style.display = 'block';
    mainMenu.style.display = 'none';
    gameContainerWrapper.style.display = 'none';

    // Set up game engine first (obtains DOM references)
    setupGameEngine(); //

    // Start loading assets in the background
    const preloadPromise = preloadGameAssets(); //

    // Animate terminal messages and progress bars
    for (let i = 0; i < loadingMessages.length; i++) {
        await typeWriterEffect();
        if (i === 0) await animateProgressBar(progressBar1, 30, 0.5);
        if (i === 1) await animateProgressBar(progressBar2, 20, 0.5);
        if (i === 2) await animateProgressBar(progressBar1, 60, 0.7);
        if (i === 3) await animateProgressBar(progressBar2, 50, 0.7);
        if (i === 4) await animateProgressBar(progressBar1, 90, 0.8);
        if (i === 5) await animateProgressBar(progressBar2, 80, 0.8);
    }

    // Wait for all assets to be fully loaded
    await preloadPromise; // Wait for background asset loading to finish

    await animateProgressBar(progressBar1, 100, 0.3);
    await animateProgressBar(progressBar2, 100, 0.3);

    // Final message and transition
    terminalLog.lastChild.textContent = terminalLog.lastChild.textContent.replace(' _', ''); // Remove blinking cursor
    const finalMessage = document.createElement('div');
    finalMessage.textContent = "PROCESS COMPLETE. DISPLAYING MENU...";
    terminalLog.appendChild(finalMessage);

    setTimeout(() => {
        terminalContainer.style.opacity = 0; // Fade out terminal
        setTimeout(() => {
            terminalContainer.style.display = 'none';
            mainMenu.style.display = 'flex'; // Show main menu
            mainMenu.style.opacity = 1; // Fade in menu
            console.log("Menu principale visualizzato.");
        }, 500); // Wait for fade-out to complete
    }, 1000);
}

// Attach menu button event listeners
if (startGameBtn) {
    startGameBtn.addEventListener('click', () => {
        console.log("Start Game button clicked.");
        mainMenu.style.display = 'none';
        gameContainerWrapper.style.display = 'flex'; // Show game canvas
        launchGame(); //
    });
}

if (leaderboardBtn) {
    leaderboardBtn.addEventListener('click', () => {
        console.log("Leaderboard button clicked.");
        // Implement navigation or modal display for leaderboard
        showToast("Caricamento Classifica...", "info");
        // For now, redirect. Later, consider a modal for Capacitor.
        window.location.href = 'leaderboard.html';
    });
}

if (glitchpediaBtn) {
    glitchpediaBtn.addEventListener('click', () => {
        console.log("Glitchpedia button clicked.");
        // Implement modal or section display for Glitchpedia
        showToast("Apertura Glitchpedia...", "info");
        // Example: show a hidden div or modal
        // const glitchpediaModal = document.getElementById('glitchpediaModal');
        // if (glitchpediaModal) glitchpediaModal.style.display = 'block';
    });
}

if (accountBtn) {
    accountBtn.addEventListener('click', () => {
        console.log("Account button clicked.");
        // Implement logic to show login/profile modal
        showToast("Apertura Account...", "info");
        // Example: show login modal from main.js if it's imported globally or exposed.
        // For now, redirect. Later, consider a modal for Capacitor.
        window.location.href = 'profile.html'; // Assuming profile.html handles login state
    });
}


// Start the loading sequence when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', startLoadingSequence);