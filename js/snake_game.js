// Importa le funzioni necessarie da Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"; 
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Configurazione Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyBrXQ4qwB9JhZF4kSIPyvxQYw1X4PGXpFk", // Verifica!
    authDomain: "asyncdonkey.firebaseapp.com",
    projectId: "asyncdonkey",
    storageBucket: "asyncdonkey.appspot.com", // Verifica!
    messagingSenderId: "939854468396",
    appId: "1:939854468396:web:9646d4f51737add7704889",
    measurementId: "G-EQDBKQM3YE" 
};

// Inizializza Firebase (UNA SOLA VOLTA, a livello di modulo)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); 
const leaderboardCollection = collection(db, "leaderboardScores"); 

// --- ASPETTA CHE IL DOM SIA PRONTO PRIMA DI ESEGUIRE IL RESTO ---
document.addEventListener('DOMContentLoaded', () => {

    // --- Setup Elementi DOM e Variabili Core ---
    // Spostato qui per sicurezza, per accedere agli elementi DOPO che il DOM è pronto
    const canvas = document.getElementById('snakeCanvas');
    if (!canvas) { console.error("Canvas element not found!"); return; } // Uscita anticipata se la canvas non esiste
    const ctx = canvas.getContext('2d');
    if (!ctx) { console.error("Canvas context not available!"); return; }

    const gameUIContainer = document.querySelector('.game-ui-container');
    const currentScoreDisplay = document.getElementById('currentScore');
    const highScoreDisplay = document.getElementById('highScore');
    const restartBtn = document.getElementById('restartGameBtn');
    const highscoreInputContainer = document.getElementById('highscore-input-container');
    const playerInitialsInput = document.getElementById('playerInitials');
    const saveScoreBtn = document.getElementById('saveScoreBtn');
    const leaderboardList = document.getElementById('leaderboard-list');
    const touchControlsContainer = document.getElementById('touch-controls-container');
    const gameInstructions = document.querySelector('.game-instructions');
    const touchUpBtn = document.getElementById('touchUpBtn');
    const touchDownBtn = document.getElementById('touchDownBtn');
    const touchLeftBtn = document.getElementById('touchLeftBtn');
    const touchRightBtn = document.getElementById('touchRightBtn');


    // --- Touch Device Detection & Controls Setup ---
    // Ora siamo sicuri che touchControlsContainer esista (o sia null)
    const isTouchDevice = ('ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0);
    if (isTouchDevice) {
        document.body.classList.add('touch-enabled');
        if (touchControlsContainer) {
            touchControlsContainer.style.display = 'flex';
             console.log("Touch device detected. Touch controls enabled and displayed.");
        } else {
             console.warn("Touch device detected, but touch container not found!");
        }
       
    } else {
        if (touchControlsContainer) {
            touchControlsContainer.style.display = 'none';
        }
        console.log("Non-touch device detected.");
    }

    // --- Variabili di Stato e Configurazione Gioco ---
    const initialCanvasWidth = 400;
    const gridSize = 20;
    let tileCountX = initialCanvasWidth / gridSize;
    let tileCountY = initialCanvasWidth / gridSize;
    let gameSpeed = 120;
    let gameIntervalId;
    let snake;
    let food;
    let velocityX;
    let velocityY;
    let score;
    let personalHighScore = localStorage.getItem('snakePersonalHighScore') ? parseInt(localStorage.getItem('snakePersonalHighScore')) : 0; 
    if (highScoreDisplay) highScoreDisplay.textContent = personalHighScore; 
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
    const PARTICLE_COUNT = 8; const PARTICLE_LIFESPAN = 10; const PARTICLE_SPEED = 2;

    // --- Funzioni ---

    function calculateTargetCanvasWidth() { 
        let targetWidth = initialCanvasWidth; 
        if (!gameUIContainer) { console.error("Game UI container not found!"); } 
        else {
            const containerStyle = window.getComputedStyle(gameUIContainer);
            const containerPaddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
            const containerPaddingRight = parseFloat(containerStyle.paddingRight) || 0;
            const availableWidth = gameUIContainer.clientWidth - containerPaddingLeft - containerPaddingRight;
            let newTileCount = Math.floor(availableWidth / gridSize);
            if (newTileCount < 10) newTileCount = 10; 
            targetWidth = newTileCount * gridSize; 
            console.log(`[calculateTargetCanvasWidth] Available: ${availableWidth}, Target Width: ${targetWidth}`);
        }
        return targetWidth;
    }

    async function loadLeaderboard() {
        console.log("Loading global leaderboard from Firestore...");
        if (leaderboardList) leaderboardList.innerHTML = '<li>Loading...</li>'; 
        else { console.error("Leaderboard list element not found!"); return; }
        try {
            const q = query(leaderboardCollection, orderBy("score", "desc"), limit(MAX_LEADERBOARD_ENTRIES));
            const querySnapshot = await getDocs(q);
            const fetchedLeaderboard = [];
            querySnapshot.forEach((doc) => fetchedLeaderboard.push(doc.data()));
            displayLeaderboard(fetchedLeaderboard); 
        } catch (error) {
            console.error("Error loading leaderboard: ", error);
            if (leaderboardList) leaderboardList.innerHTML = '<li>Error loading scores</li>';
        }
    }

    function displayLeaderboard(leaderboardData) {
        if (!leaderboardList) return;
        leaderboardList.innerHTML = ''; 
        if (!leaderboardData || leaderboardData.length === 0) { leaderboardList.innerHTML = '<li>No scores yet</li>'; return; }
        leaderboardData.forEach(entry => {
            const li = document.createElement('li');
            const nameSpan = document.createElement('span'); nameSpan.className = 'player-name';
            nameSpan.textContent = entry.initials || 'N/A'; 
            const scoreSpan = document.createElement('span'); scoreSpan.className = 'player-score';
            scoreSpan.textContent = entry.score !== undefined ? entry.score : '-';
            li.appendChild(nameSpan); li.appendChild(scoreSpan);
            leaderboardList.appendChild(li);
        });
    }

    async function handleSaveScore() {
         if (!playerInitialsInput || !saveScoreBtn || !highscoreInputContainer || !restartBtn) {
             console.error("Missing UI elements for saving score.");
             return;
         }
        const initials = playerInitialsInput.value.trim().toUpperCase();
        const currentScore = score; 
        if (initials.length > 0 && initials.length <= 5) {
            saveScoreBtn.disabled = true; saveScoreBtn.textContent = "Saving...";
            try {
                const docRef = await addDoc(leaderboardCollection, { initials: initials, score: currentScore, timestamp: serverTimestamp() });
                console.log("Score saved with ID: ", docRef.id);
                highscoreInputContainer.style.display = 'none';
                playerInitialsInput.value = ''; restartBtn.style.display = 'block'; 
                await loadLeaderboard(); 
            } catch (error) {
                console.error("Error saving score: ", error); alert("Error saving score. Please try again."); 
            } finally {
                 saveScoreBtn.disabled = false; saveScoreBtn.textContent = "Save Score";
            }
        } else {
            alert('Please enter 1 to 5 characters for your initials.');
            playerInitialsInput.focus(); // Focus only on error here
        }
    }

    function shouldShowHighscoreInput(currentScore) { return currentScore > 0; }

    function clearCanvasAndDrawBackground() {
        if (!canvas || !ctx) return;
        const canvasBgColor = getComputedStyle(canvas).backgroundColor; 
        ctx.fillStyle = canvasBgColor; ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawFood() { 
        if (!food || !ctx) return; // Aggiunto controllo
        const foodRadius = (gridSize / 2) * 0.75; 
        const foodX = food.x * gridSize + gridSize / 2; const foodY = food.y * gridSize + gridSize / 2;
        ctx.fillStyle = foodColor;
        ctx.beginPath(); ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = foodBorderColor; ctx.lineWidth = 2; 
        ctx.beginPath(); ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2); ctx.stroke();
    }

    function getRandomFoodPosition() {
        let newPosition;
        // Assicurati che tileCountX/Y siano > 0
        if (tileCountX <= 0 || tileCountY <= 0) {
             console.warn("Cannot get random food position, invalid tile count:", tileCountX, tileCountY);
             return { x: 0, y: 0 }; // Fallback
        }
        do {
            newPosition = { x: Math.floor(Math.random() * tileCountX), y: Math.floor(Math.random() * tileCountY) };
        } while (snake && snake.length > 0 && snake.some(segment => segment.x === newPosition.x && segment.y === newPosition.y)); 
        return newPosition;
    }

    function drawSnakeSegment(tileX, tileY, segmentWidth, segmentHeight, cornerRadius, fillColor, strokeColor) { 
        if (!ctx) return;
        const x = tileX * gridSize + (gridSize - segmentWidth) / 2; 
        const y = tileY * gridSize + (gridSize - segmentHeight) / 2;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') { ctx.roundRect(x, y, segmentWidth, segmentHeight, cornerRadius); } 
        else { console.warn("ctx.roundRect not available, drawing simple rectangle."); ctx.rect(x, y, segmentWidth, segmentHeight); }
        ctx.fillStyle = fillColor; ctx.fill();
        if (strokeColor) { ctx.strokeStyle = strokeColor; ctx.lineWidth = 2; ctx.stroke(); }
    }

    function drawSnake() { 
        const segmentPadding = gridSize * 0.1; 
        const segmentSize = gridSize - (segmentPadding * 2); 
        const cornerRadius = gridSize * 0.25; 
        if (!snake || !Array.isArray(snake)) return; 
        snake.forEach((segment, index) => {
            const isHead = (index === 0);
            const fillColor = isHead ? snakeHeadColor : snakeBodyColor;
            drawSnakeSegment(segment.x, segment.y, segmentSize, segmentSize, cornerRadius, fillColor, snakeStrokeColor);
        });
    }

    function drawParticleEffect() { 
        if (!particleEffect.active || !ctx) return;
        if (particleEffect.framesLeft > 0) {
            particleEffect.particles.forEach(p => {
                p.x += p.vx; p.y += p.vy; const alpha = particleEffect.framesLeft / PARTICLE_LIFESPAN;
                ctx.fillStyle = `rgba(240, 240, 224, ${alpha * 0.8})`; 
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
            });
            particleEffect.framesLeft--;
        } else { particleEffect.active = false; }
    }

    function updateGameState() { 
        if (isGameOver) return; if (!snake || snake.length === 0) return; 
        const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };
        if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) { isGameOver = true; return; }
        for (let i = 1; i < snake.length; i++) { if (head.x === snake[i].x && head.y === snake[i].y) { isGameOver = true; return; } }
        snake.unshift(head); 
        if (food && head.x === food.x && head.y === food.y) { 
            score++; if(currentScoreDisplay) currentScoreDisplay.textContent = score;
            particleEffect.active = true; particleEffect.x = food.x * gridSize + gridSize / 2; 
            particleEffect.y = food.y * gridSize + gridSize / 2;
            particleEffect.framesLeft = PARTICLE_LIFESPAN; particleEffect.particles = []; 
            for (let i = 0; i < PARTICLE_COUNT; i++) { /* ... crea particelle ... */ 
                 particleEffect.particles.push({ x: particleEffect.x, y: particleEffect.y,
                     vx: (Math.random() - 0.5) * PARTICLE_SPEED * 2, vy: (Math.random() - 0.5) * PARTICLE_SPEED * 2,
                     size: Math.random() * (gridSize * 0.15) + (gridSize*0.05) });
            }
            food = getRandomFoodPosition(); 
            if (score > personalHighScore) { 
                personalHighScore = score; if(highScoreDisplay) highScoreDisplay.textContent = personalHighScore;
                localStorage.setItem('snakePersonalHighScore', personalHighScore.toString());
            }
        } else { if (snake.length > 1) { snake.pop(); } }
    }

    function handleGameOverLogic() { 
        clearInterval(gameIntervalId); gameRunning = false; 
        console.log("[DEBUG] Game Over Logic - Score:", score); 
        if (restartBtn) { restartBtn.style.display = 'block'; console.log("[DEBUG] Restart button displayed."); } 
        else { console.warn("[DEBUG] Restart button not found!"); }
        if (shouldShowHighscoreInput(score)) { 
            console.log("[DEBUG] Showing highscore input (Restart button also visible)..."); 
            if (highscoreInputContainer) { 
                highscoreInputContainer.style.display = 'block';
                try { /* Focus disabilitato per test */ console.log("[DEBUG] Focus on input DISABLED for testing."); } 
                catch (e) { console.warn("[DEBUG] Could not focus on input automatically:", e); }
                 if(saveScoreBtn) { saveScoreBtn.disabled = false; saveScoreBtn.textContent = "Save Score"; }
            } else { console.warn("[DEBUG] Highscore input container not found!"); }
        } else { console.log("[DEBUG] Score doesn't qualify for input."); }
    }

    function processInput(newVelocityX, newVelocityY) { 
        // Log per vedere se viene chiamata
        console.log(`[DEBUG] processInput called with: x=${newVelocityX}, y=${newVelocityY}`); 
        
        if (isGameOver && !gameRunning) {} else if (isGameOver) return;
        const goingUp = velocityY === -1; const goingDown = velocityY === 1;
        const goingLeft = velocityX === -1; const goingRight = velocityX === 1;
        let directionChanged = false;
        if (newVelocityX === 0 && newVelocityY === -1 && !goingDown) { velocityX = 0; velocityY = -1; directionChanged = true; } 
        else if (newVelocityX === 0 && newVelocityY === 1 && !goingUp) { velocityX = 0; velocityY = 1; directionChanged = true; } 
        else if (newVelocityX === -1 && newVelocityY === 0 && !goingRight) { velocityX = -1; velocityY = 0; directionChanged = true; } 
        else if (newVelocityX === 1 && newVelocityY === 0 && !goingLeft) { velocityX = 1; velocityY = 0; directionChanged = true; }
        
        if (directionChanged) {
             console.log(`[DEBUG] Direction changed to: x=${velocityX}, y=${velocityY}`);
             if (!gameRunning && !isGameOver) { 
                 console.log("[DEBUG] Starting game loop from processInput.");
                 startGameLoop(); 
             }
        }
    }
    function handleKeyPress(event) { 
         // Log per vedere se l'evento viene catturato
         console.log(`[DEBUG] KeyDown event: ${event.key}`);

        if (highscoreInputContainer && highscoreInputContainer.style.display === 'block') { 
            if (event.key === 'Enter') handleSaveScore(); 
            return; 
        }
        if (isGameOver && event.key === 'Enter' && restartBtn && restartBtn.style.display === 'block') { 
            initializeGame(); return; 
        }
        // Modifica: Non bloccare l'input se il gioco non è ancora partito!
        // Permetti al primo input di chiamare processInput -> startGameLoop
        // if (isGameOver && gameRunning) return; // Vecchio controllo
        if (isGameOver) return; // Blocca solo se è finito *e* in corso (impossibile) o solo finito

        let processed = false; // Flag per vedere se il tasto è stato processato
        switch (event.key) {
            case 'ArrowUp': case 'w': case 'W': processInput(0, -1); processed = true; break;
            case 'ArrowDown': case 's': case 'S': processInput(0, 1); processed = true; break;
            case 'ArrowLeft': case 'a': case 'A': processInput(-1, 0); processed = true; break;
            case 'ArrowRight': case 'd': case 'D': processInput(1, 0); processed = true; break;
        }
        // Previene lo scroll della pagina con i tasti freccia solo se usati per il gioco
        if (processed && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            event.preventDefault(); 
        }
     }

    function setupNewGame() { 
        snake = [{ x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) }];
        food = getRandomFoodPosition(); 
        velocityX = 0; velocityY = 0; score = 0;
        if(currentScoreDisplay) currentScoreDisplay.textContent = score;
        isGameOver = false; gameRunning = false; 
        if(restartBtn) restartBtn.style.display = 'none'; 
        if(highscoreInputContainer) highscoreInputContainer.style.display = 'none'; 
        if(playerInitialsInput) playerInitialsInput.value = ''; 
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
        if(restartBtn) restartBtn.style.display = 'none'; 
        if(highscoreInputContainer) highscoreInputContainer.style.display = 'none'; 
        gameIntervalId = setInterval(() => {
            updateGameState();
            if (isGameOver) { handleGameOverLogic(); } 
            else { clearCanvasAndDrawBackground(); drawFood(); drawSnake(); drawParticleEffect(); }
        }, gameSpeed);
    }

    async function initializeGame() { 
        console.log("[DEBUG] Initialize Game Called - Current highscore input display:", highscoreInputContainer ? highscoreInputContainer.style.display : 'N/A'); 
        console.log("Snake Game Initialized!");
        
        // Calcola e imposta dimensioni canvas e tile count
        const targetWidth = calculateTargetCanvasWidth();
        canvas.width = targetWidth; canvas.height = targetWidth; 
        tileCountX = canvas.width / gridSize; tileCountY = canvas.height / gridSize;
        console.log(`Canvas initialized to: ${canvas.width}x${canvas.height}. Tiles: ${tileCountX}x${tileCountY}`);

        // Stoppa loop esistente e resetta stati logici
        clearInterval(gameIntervalId); gameRunning = false; isGameOver = false; 
        
        await loadLeaderboard(); 
        setupNewGame(); 
        drawInitialState(); 
        
        personalHighScore = localStorage.getItem('snakePersonalHighScore') ? parseInt(localStorage.getItem('snakePersonalHighScore')) : 0;
        if(highScoreDisplay) highScoreDisplay.textContent = personalHighScore; 
        
        if(highscoreInputContainer) highscoreInputContainer.style.display = 'none';
        if(restartBtn) restartBtn.style.display = 'none'; 
    }

    // --- Event Listeners (Spostati alla fine per sicurezza DOM) ---
    document.addEventListener('keydown', handleKeyPress);
    if(restartBtn) restartBtn.addEventListener('click', initializeGame); 
    if(saveScoreBtn) saveScoreBtn.addEventListener('click', handleSaveScore); 

    // Listener Touch (controlla se i bottoni esistono prima di aggiungere listener)
    if (touchUpBtn) touchUpBtn.addEventListener('click', () => processInput(0, -1));
    if (touchDownBtn) touchDownBtn.addEventListener('click', () => processInput(0, 1));
    if (touchLeftBtn) touchLeftBtn.addEventListener('click', () => processInput(-1, 0));
    if (touchRightBtn) touchRightBtn.addEventListener('click', () => processInput(1, 0));

    // Resize Listener Modificato
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log("[DEBUG] Resize event triggered.");
            const currentWidth = canvas.width;
            const targetWidth = calculateTargetCanvasWidth(); 
            const isInputVisible = highscoreInputContainer && highscoreInputContainer.style.display === 'block';
            
            if (!isInputVisible && targetWidth !== currentWidth) {
                console.log(`[DEBUG] Width change detected (${currentWidth} -> ${targetWidth}). Re-initializing game...`);
                initializeGame(); 
            } else if (isInputVisible && targetWidth !== currentWidth) {
                 console.log(`[DEBUG] Resize detected, but input visible. Width changed (${currentWidth} -> ${targetWidth}). Adjusting canvas only.`);
                 // Se la larghezza cambia MENTRE l'input è visibile (es. rotazione tablet)
                 // Dobbiamo almeno ridimensionare la canvas, ma NON resettare il gioco.
                 canvas.width = targetWidth; canvas.height = targetWidth; 
                 tileCountX = canvas.width / gridSize; tileCountY = canvas.height / gridSize;
                 // Potrebbe essere necessario ridisegnare lo stato di game over qui
                 clearCanvasAndDrawBackground(); drawSnake(); drawFood(); // Ridisegna elementi base
            }
             else {
                 console.log(`[DEBUG] Resize event ignored (input visible or no width change: ${currentWidth}==${targetWidth}).`);
            }
        }, 250); 
    });

    // Avvia l'inizializzazione del gioco la prima volta
    initializeGame(); 

}); // Fine DOMContentLoaded