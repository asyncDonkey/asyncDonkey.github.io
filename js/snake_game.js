// Importa le funzioni necessarie da Firebase SDK (grazie a type="module" in HTML)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"; 
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Configurazione Firebase ---
// Assicurati che questi siano i TUOI valori corretti presi dalla console Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBrXQ4qwB9JhZF4kSIPyvxQYw1X4PGXpFk", // Verifica che sia corretto!
    authDomain: "asyncdonkey.firebaseapp.com",
    projectId: "asyncdonkey",
    storageBucket: "asyncdonkey.appspot.com", // Ricontrolla questo valore nella console Firebase
    messagingSenderId: "939854468396",
    appId: "1:939854468396:web:9646d4f51737add7704889",
    measurementId: "G-EQDBKQM3YE" // Opzionale
};

// Inizializza Firebase (UNA SOLA VOLTA)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); 
const leaderboardCollection = collection(db, "leaderboardScores"); 


// --- Touch Device Detection & Controls Setup ---
const isTouchDevice = ('ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0);
const touchControlsContainer = document.getElementById('touch-controls-container');
const gameInstructions = document.querySelector('.game-instructions');

if (isTouchDevice) {
    document.body.classList.add('touch-enabled');
    if (touchControlsContainer) {
        touchControlsContainer.style.display = 'flex';
    }
    console.log("Touch device detected. Touch controls enabled.");
} else {
    if (touchControlsContainer) {
        touchControlsContainer.style.display = 'none';
    }
    console.log("Non-touch device detected.");
}

// --- Setup Elementi DOM e Variabili Core ---
const canvas = document.getElementById('snakeCanvas');
const ctx = canvas.getContext('2d');
const gameUIContainer = document.querySelector('.game-ui-container');

const currentScoreDisplay = document.getElementById('currentScore');
const highScoreDisplay = document.getElementById('highScore');
const restartBtn = document.getElementById('restartGameBtn');

const highscoreInputContainer = document.getElementById('highscore-input-container');
const playerInitialsInput = document.getElementById('playerInitials');
const saveScoreBtn = document.getElementById('saveScoreBtn');
const leaderboardList = document.getElementById('leaderboard-list');

const touchUpBtn = document.getElementById('touchUpBtn');
const touchDownBtn = document.getElementById('touchDownBtn');
const touchLeftBtn = document.getElementById('touchLeftBtn');
const touchRightBtn = document.getElementById('touchRightBtn');

const initialCanvasWidth = 400;
const gridSize = 20;
let tileCountX = initialCanvasWidth / gridSize;
let tileCountY = initialCanvasWidth / gridSize;

let gameSpeed = 120;
let gameIntervalId;

// Stato del gioco
let snake;
let food;
let velocityX;
let velocityY;
let score;
let personalHighScore = localStorage.getItem('snakePersonalHighScore') ? parseInt(localStorage.getItem('snakePersonalHighScore')) : 0; 
highScoreDisplay.textContent = personalHighScore; 

let isGameOver;
let gameRunning;

const MAX_LEADERBOARD_ENTRIES = 5; 

// --- Colors ---
const foodColor = '#f0f0e0';
const foodBorderColor = '#adb5bd';
const snakeBodyColor = '#3498db';
const snakeHeadColor = '#5dade2';
const snakeStrokeColor = '#21618C';

// --- Effetto Particelle ---
let particleEffect = { active: false, particles: [], x: 0, y: 0, framesLeft: 0 };
const PARTICLE_COUNT = 8;
const PARTICLE_LIFESPAN = 10;
const PARTICLE_SPEED = 2;

// --- Funzioni ---

function adjustCanvasSize() { 
    if (!gameUIContainer) {
        console.error("Game UI container not found for canvas sizing!");
        canvas.width = initialCanvasWidth; canvas.height = initialCanvasWidth;
    } else {
        const containerStyle = window.getComputedStyle(gameUIContainer);
        const containerPaddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
        const containerPaddingRight = parseFloat(containerStyle.paddingRight) || 0;
        const availableWidth = gameUIContainer.clientWidth - containerPaddingLeft - containerPaddingRight;
        let newTileCount = Math.floor(availableWidth / gridSize);
        if (newTileCount < 10) newTileCount = 10; 
        let newCanvasWidth = newTileCount * gridSize;
        canvas.width = newCanvasWidth; canvas.height = newCanvasWidth; 
    }
    tileCountX = canvas.width / gridSize; tileCountY = canvas.height / gridSize;
    console.log(`Canvas resized to: ${canvas.width}x${canvas.height}. Tiles: ${tileCountX}x${tileCountY}`);
}

// --- Funzioni Leaderboard (Modificate per Firestore) ---
async function loadLeaderboard() {
    console.log("Loading global leaderboard from Firestore...");
    leaderboardList.innerHTML = '<li>Loading...</li>'; 
    try {
        const q = query(leaderboardCollection, orderBy("score", "desc"), limit(MAX_LEADERBOARD_ENTRIES));
        const querySnapshot = await getDocs(q);
        const fetchedLeaderboard = [];
        querySnapshot.forEach((doc) => fetchedLeaderboard.push(doc.data()));
        displayLeaderboard(fetchedLeaderboard); 
    } catch (error) {
        console.error("Error loading leaderboard: ", error);
        leaderboardList.innerHTML = '<li>Error loading scores</li>';
    }
}

function displayLeaderboard(leaderboardData) {
    leaderboardList.innerHTML = ''; 
    if (!leaderboardData || leaderboardData.length === 0) {
        leaderboardList.innerHTML = '<li>No scores yet</li>'; return;
    }
    leaderboardData.forEach(entry => {
        const li = document.createElement('li');
        const nameSpan = document.createElement('span');
        nameSpan.className = 'player-name';
        nameSpan.textContent = entry.initials || 'N/A'; 
        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'player-score';
        scoreSpan.textContent = entry.score !== undefined ? entry.score : '-';
        li.appendChild(nameSpan); li.appendChild(scoreSpan);
        leaderboardList.appendChild(li);
    });
}

async function handleSaveScore() {
    const initials = playerInitialsInput.value.trim().toUpperCase();
    const currentScore = score; 
    if (initials.length > 0 && initials.length <= 5) {
        saveScoreBtn.disabled = true; saveScoreBtn.textContent = "Saving...";
        try {
            const docRef = await addDoc(leaderboardCollection, {
                initials: initials, score: currentScore, timestamp: serverTimestamp() 
            });
            console.log("Score saved with ID: ", docRef.id);
            // Nascondi input e assicurati che restart sia visibile
            highscoreInputContainer.style.display = 'none';
            playerInitialsInput.value = ''; 
            restartBtn.style.display = 'block'; 
            await loadLeaderboard(); 
        } catch (error) {
            console.error("Error saving score: ", error);
            alert("Error saving score. Please try again."); 
        } finally {
             saveScoreBtn.disabled = false; saveScoreBtn.textContent = "Save Score";
        }
    } else {
        alert('Please enter 1 to 5 characters for your initials.');
        playerInitialsInput.focus();
    }
}

function shouldShowHighscoreInput(currentScore) {
    // Mostra input solo se il punteggio è maggiore di 0
    // Potresti aggiungere logica più complessa qui se necessario
    // (es. confrontare con il punteggio più basso nella leaderboard globale)
    return currentScore > 0;
}

// --- Funzioni di Disegno e Utility ---
function clearCanvasAndDrawBackground() {
    const canvasBgColor = getComputedStyle(canvas).backgroundColor; 
    ctx.fillStyle = canvasBgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawFood() { 
    const foodRadius = (gridSize / 2) * 0.75; 
    const foodX = food.x * gridSize + gridSize / 2;
    const foodY = food.y * gridSize + gridSize / 2;
    ctx.fillStyle = foodColor;
    ctx.beginPath(); ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = foodBorderColor; ctx.lineWidth = 2; 
    ctx.beginPath(); ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2); ctx.stroke();
}

function getRandomFoodPosition() {
    let newPosition;
    do {
        newPosition = {
            x: Math.floor(Math.random() * tileCountX),
            y: Math.floor(Math.random() * tileCountY)
        };
    } while (snake && snake.length > 0 && snake.some(segment => segment.x === newPosition.x && segment.y === newPosition.y)); 
    return newPosition;
}

function drawSnakeSegment(tileX, tileY, segmentWidth, segmentHeight, cornerRadius, fillColor, strokeColor) { 
    const x = tileX * gridSize + (gridSize - segmentWidth) / 2; 
    const y = tileY * gridSize + (gridSize - segmentHeight) / 2;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, segmentWidth, segmentHeight, cornerRadius);
    } else {
        console.warn("ctx.roundRect not available, drawing simple rectangle.");
        ctx.rect(x, y, segmentWidth, segmentHeight);
    }
    ctx.fillStyle = fillColor; ctx.fill();
    if (strokeColor) {
        ctx.strokeStyle = strokeColor; ctx.lineWidth = 2; ctx.stroke(); 
    }
}

function drawSnake() { 
    const segmentPadding = gridSize * 0.1; 
    const segmentSize = gridSize - (segmentPadding * 2); 
    const cornerRadius = gridSize * 0.25; 

    if (!snake || !Array.isArray(snake)) return; 

    snake.forEach((segment, index) => {
        const isHead = (index === 0);
        const fillColor = isHead ? snakeHeadColor : snakeBodyColor;
        drawSnakeSegment(
            segment.x, segment.y, segmentSize, segmentSize, 
            cornerRadius, fillColor, snakeStrokeColor
        );
    });
}

function drawParticleEffect() { 
    if (!particleEffect.active) return;
    if (particleEffect.framesLeft > 0) {
        particleEffect.particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            const alpha = particleEffect.framesLeft / PARTICLE_LIFESPAN;
            ctx.fillStyle = `rgba(240, 240, 224, ${alpha * 0.8})`; 
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        });
        particleEffect.framesLeft--;
    } else {
        particleEffect.active = false;
    }
}

// --- Logica di Gioco Principale ---
function updateGameState() { 
    if (isGameOver) return;
    if (!snake || snake.length === 0) return; 
    const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };
    if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) { isGameOver = true; return; }
    for (let i = 1; i < snake.length; i++) { if (head.x === snake[i].x && head.y === snake[i].y) { isGameOver = true; return; } }
    
    snake.unshift(head); 
    
    if (food && head.x === food.x && head.y === food.y) { 
        score++; currentScoreDisplay.textContent = score;
        particleEffect.active = true; particleEffect.x = food.x * gridSize + gridSize / 2; 
        particleEffect.y = food.y * gridSize + gridSize / 2;
        particleEffect.framesLeft = PARTICLE_LIFESPAN; particleEffect.particles = []; 
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particleEffect.particles.push({ x: particleEffect.x, y: particleEffect.y,
                vx: (Math.random() - 0.5) * PARTICLE_SPEED * 2, vy: (Math.random() - 0.5) * PARTICLE_SPEED * 2,
                size: Math.random() * (gridSize * 0.15) + (gridSize*0.05) });
        }
        food = getRandomFoodPosition(); 
        if (score > personalHighScore) { 
            personalHighScore = score; highScoreDisplay.textContent = personalHighScore;
            localStorage.setItem('snakePersonalHighScore', personalHighScore.toString());
        }
    } else {
        if (snake.length > 1) { snake.pop(); } 
    }
}

// --- MODIFICATA ---
function handleGameOverLogic() { 
    clearInterval(gameIntervalId); 
    gameRunning = false; 
    console.log("[DEBUG] Game Over Logic - Score:", score); // Log di debug

    // Mostra SEMPRE il pulsante Restart alla fine del gioco
    if (restartBtn) { // Aggiungi controllo null
         restartBtn.style.display = 'block';
         console.log("[DEBUG] Restart button displayed.");
    } else {
         console.warn("[DEBUG] Restart button not found!");
    }

    // Controlla se mostrare il form per il punteggio
    if (shouldShowHighscoreInput(score)) { 
        console.log("[DEBUG] Showing highscore input..."); 
        if (highscoreInputContainer) { // Aggiungi controllo null
            highscoreInputContainer.style.display = 'block';
            // Tenta di dare il focus, ma preparati a fallire su alcuni dispositivi touch
            try {
                if (playerInitialsInput) playerInitialsInput.focus(); // Aggiungi controllo null
                console.log("[DEBUG] Focus requested on input.");
            } catch (e) {
                console.warn("[DEBUG] Could not focus on input automatically:", e);
            }
             // Assicurati che il bottone Salva sia abilitato e con testo corretto
             if(saveScoreBtn) { // Aggiungi controllo null
                 saveScoreBtn.disabled = false; 
                 saveScoreBtn.textContent = "Save Score";
             }
        } else {
            console.warn("[DEBUG] Highscore input container not found!");
        }
    } else {
        console.log("[DEBUG] Score doesn't qualify for input.");
        // Il pulsante Restart è già visibile (mostrato sopra)
    }
}


function processInput(newVelocityX, newVelocityY) { 
    if (isGameOver && !gameRunning) {} else if (isGameOver) return;
    const goingUp = velocityY === -1; const goingDown = velocityY === 1;
    const goingLeft = velocityX === -1; const goingRight = velocityX === 1;
    let directionChanged = false;
    if (newVelocityX === 0 && newVelocityY === -1 && !goingDown) { velocityX = 0; velocityY = -1; directionChanged = true; } 
    else if (newVelocityX === 0 && newVelocityY === 1 && !goingUp) { velocityX = 0; velocityY = 1; directionChanged = true; } 
    else if (newVelocityX === -1 && newVelocityY === 0 && !goingRight) { velocityX = -1; velocityY = 0; directionChanged = true; } 
    else if (newVelocityX === 1 && newVelocityY === 0 && !goingLeft) { velocityX = 1; velocityY = 0; directionChanged = true; }
    if (directionChanged && !gameRunning && !isGameOver) { startGameLoop(); }
}
function handleKeyPress(event) { 
    if (highscoreInputContainer && highscoreInputContainer.style.display === 'block') { // Aggiunto controllo null
        if (event.key === 'Enter') handleSaveScore(); 
        return; 
    }
    if (isGameOver && event.key === 'Enter' && restartBtn && restartBtn.style.display === 'block') { // Aggiunto controllo null
        initializeGame(); return; 
    }
    if (isGameOver && gameRunning) return;
    switch (event.key) {
        case 'ArrowUp': case 'w': case 'W': processInput(0, -1); event.preventDefault(); break;
        case 'ArrowDown': case 's': case 'S': processInput(0, 1); event.preventDefault(); break;
        case 'ArrowLeft': case 'a': case 'A': processInput(-1, 0); event.preventDefault(); break;
        case 'ArrowRight': case 'd': case 'D': processInput(1, 0); event.preventDefault(); break;
    }
 }

function setupNewGame() { 
    snake = [{ x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) }];
    food = getRandomFoodPosition(); 
    velocityX = 0; velocityY = 0; score = 0;
    currentScoreDisplay.textContent = score;
    isGameOver = false; gameRunning = false; 
    if(restartBtn) restartBtn.style.display = 'none'; // Aggiunto controllo null
    if(highscoreInputContainer) highscoreInputContainer.style.display = 'none'; // Aggiunto controllo null
    if(playerInitialsInput) playerInitialsInput.value = ''; // Aggiunto controllo null
}
function drawInitialState() { 
    clearCanvasAndDrawBackground(); 
    drawSnake();
    drawFood();
}
function startGameLoop() { 
    if (gameRunning) return; 
    gameRunning = true; isGameOver = false; 
    clearInterval(gameIntervalId); 
    if(restartBtn) restartBtn.style.display = 'none'; // Aggiunto controllo null
    if(highscoreInputContainer) highscoreInputContainer.style.display = 'none'; // Aggiunto controllo null
    gameIntervalId = setInterval(() => {
        updateGameState();
        if (isGameOver) { handleGameOverLogic(); } 
        else { clearCanvasAndDrawBackground(); drawFood(); drawSnake(); drawParticleEffect(); }
    }, gameSpeed);
}

async function initializeGame() { 
    // Aggiunto Log di Debug per initializeGame
    console.log("[DEBUG] Initialize Game Called - Current highscore input display:", highscoreInputContainer ? highscoreInputContainer.style.display : 'N/A'); 
    
    console.log("Snake Game Initialized!");
    adjustCanvasSize(); 
    clearInterval(gameIntervalId); // Stoppa loop esistente
    gameRunning = false; // Assicura che il gioco sia considerato non in corso
    isGameOver = false; // Resetta stato game over
    
    await loadLeaderboard(); 
    setupNewGame(); 
    drawInitialState(); 
    
    personalHighScore = localStorage.getItem('snakePersonalHighScore') ? parseInt(localStorage.getItem('snakePersonalHighScore')) : 0;
    highScoreDisplay.textContent = personalHighScore; 

     // Assicurati che gli elementi UI siano nello stato iniziale corretto
    if(highscoreInputContainer) highscoreInputContainer.style.display = 'none';
    if(restartBtn) restartBtn.style.display = 'none'; // Il bottone restart appare solo alla fine del gioco (se non si inserisce highscore)
}

// Event Listeners
document.addEventListener('keydown', handleKeyPress);
// Aggiungi controlli null anche qui per sicurezza
if(restartBtn) restartBtn.addEventListener('click', initializeGame); 
if(saveScoreBtn) saveScoreBtn.addEventListener('click', handleSaveScore); 

if (touchUpBtn) touchUpBtn.addEventListener('click', () => processInput(0, -1));
if (touchDownBtn) touchDownBtn.addEventListener('click', () => processInput(0, 1));
if (touchLeftBtn) touchLeftBtn.addEventListener('click', () => processInput(-1, 0));
if (touchRightBtn) touchRightBtn.addEventListener('click', () => processInput(1, 0));

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        console.log("[DEBUG] Window resized, re-initializing game..."); // Log resize
        const oldCanvasWidth = canvas.width;
        initializeGame(); 
        if(gameRunning && canvas.width !== oldCanvasWidth){ // gameRunning sarà false dopo initializeGame
             console.warn("Canvas resized during gameplay. Game has been reset.");
        }
    }, 250); 
});

// Avvia l'inizializzazione del gioco
initializeGame();