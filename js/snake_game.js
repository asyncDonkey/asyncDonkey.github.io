// Importa le funzioni necessarie da Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Configurazione Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyBrXQ4qwB9JhZF4kSIPyvxQYw1X4PGXpFk",
    authDomain: "asyncdonkey.firebaseapp.com",
    projectId: "asyncdonkey",
    storageBucket: "asyncdonkey.appspot.com",
    messagingSenderId: "939854468396",
    appId: "1:939854468396:web:9646d4f51737add7704889",
    measurementId: "G-EQDBKQM3YE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const leaderboardCollection = collection(db, "leaderboardScores");

document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('snakeCanvas');
    if (!canvas) { console.error("Canvas element not found!"); return; }
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
    const touchUpBtn = document.getElementById('touchUpBtn');
    const touchDownBtn = document.getElementById('touchDownBtn');
    const touchLeftBtn = document.getElementById('touchLeftBtn');
    const touchRightBtn = document.getElementById('touchRightBtn');

    const isTouchDevice = ('ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0);
    if (isTouchDevice) {
        document.body.classList.add('touch-enabled');
        if (touchControlsContainer) {
            touchControlsContainer.style.display = 'flex';
        } else {
            console.warn("Touch device detected, but touch container not found!");
        }
    } else {
        if (touchControlsContainer) {
            touchControlsContainer.style.display = 'none';
        }
    }

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

    const foodColor = '#f0f0e0';
    const foodBorderColor = '#adb5bd';
    const snakeBodyColor = '#3498db';
    const snakeHeadColor = '#5dade2';
    const snakeStrokeColor = '#21618C';

    let particleEffect = { active: false, particles: [], x: 0, y: 0, framesLeft: 0 };
    const PARTICLE_COUNT = 8; const PARTICLE_LIFESPAN = 10; const PARTICLE_SPEED = 2;

    function calculateTargetCanvasWidth() {
        let targetWidth = initialCanvasWidth;
        if (!gameUIContainer) {
            console.error("Game UI container not found! Cannot calculate target canvas width.");
        } else {
            const containerStyle = window.getComputedStyle(gameUIContainer);
            const containerPaddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
            const containerPaddingRight = parseFloat(containerStyle.paddingRight) || 0;
            const availableWidth = gameUIContainer.clientWidth - containerPaddingLeft - containerPaddingRight;
            let newTileCount = Math.floor(availableWidth / gridSize);
            if (newTileCount < 10) newTileCount = 10;
            targetWidth = newTileCount * gridSize;
        }
        return targetWidth;
    }

    async function loadLeaderboard() {
        if (leaderboardList) {
            leaderboardList.innerHTML = '<li>Loading scores...</li>'; // Translated
        } else {
            console.error("Leaderboard list element not found!");
            return;
        }
        try {
            const q = query(leaderboardCollection, orderBy("score", "desc"), limit(MAX_LEADERBOARD_ENTRIES));
            const querySnapshot = await getDocs(q);
            const fetchedLeaderboard = [];
            querySnapshot.forEach((doc) => fetchedLeaderboard.push(doc.data()));
            displayLeaderboard(fetchedLeaderboard);
        } catch (error) {
            console.error("Error loading leaderboard: ", error);
            if (leaderboardList) leaderboardList.innerHTML = '<li>Error loading scores</li>'; // Translated
        }
    }

    function displayLeaderboard(leaderboardData) {
        if (!leaderboardList) return;
        leaderboardList.innerHTML = '';
        if (!leaderboardData || leaderboardData.length === 0) {
            leaderboardList.innerHTML = '<li>No scores yet</li>'; // Translated
            return;
        }
        leaderboardData.forEach(entry => {
            const li = document.createElement('li');
            const nameSpan = document.createElement('span'); nameSpan.className = 'player-name';
            nameSpan.textContent = entry.initials || 'N/A'; // Translated (N/A is common)
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
        const currentScoreVal = score;
        if (initials.length > 0 && initials.length <= 5) {
            saveScoreBtn.disabled = true; saveScoreBtn.textContent = "Saving..."; // Translated
            try {
                await addDoc(leaderboardCollection, { initials: initials, score: currentScoreVal, timestamp: serverTimestamp() });
                highscoreInputContainer.style.display = 'none';
                playerInitialsInput.value = '';
                if (restartBtn) restartBtn.style.display = 'block';
                await loadLeaderboard();
            } catch (error) {
                console.error("Error saving score: ", error);
                alert("Error saving score. Please try again."); // Translated
            } finally {
                saveScoreBtn.disabled = false; saveScoreBtn.textContent = "Save Score"; // Translated
            }
        } else {
            alert('Please enter 1 to 5 characters for your initials.'); // Translated
            playerInitialsInput.focus();
        }
    }

    function shouldShowHighscoreInput(currentScoreVal) {
        return currentScoreVal > 0;
    }

    function clearCanvasAndDrawBackground() {
        if (!canvas || !ctx) return;
        const canvasBgColor = getComputedStyle(canvas).backgroundColor;
        ctx.fillStyle = canvasBgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawFood() {
        if (!food || !ctx) return;
        const foodRadius = (gridSize / 2) * 0.75;
        const foodX = food.x * gridSize + gridSize / 2;
        const foodY = food.y * gridSize + gridSize / 2;
        ctx.fillStyle = foodColor;
        ctx.beginPath();
        ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = foodBorderColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
        ctx.stroke();
    }

    function getRandomFoodPosition() {
        let newPosition;
        if (tileCountX <= 0 || tileCountY <= 0) {
            console.warn("Cannot get random food position, invalid tile count:", tileCountX, tileCountY);
            return { x: 0, y: 0 };
        }
        do {
            newPosition = {
                x: Math.floor(Math.random() * tileCountX),
                y: Math.floor(Math.random() * tileCountY)
            };
        } while (snake && snake.length > 0 && snake.some(segment => segment.x === newPosition.x && segment.y === newPosition.y));
        return newPosition;
    }

    function drawSnakeSegment(tileX, tileY, segmentWidth, segmentHeight, cornerRadius, fillColor, strokeColor) {
        if (!ctx) return;
        const x = tileX * gridSize + (gridSize - segmentWidth) / 2;
        const y = tileY * gridSize + (gridSize - segmentHeight) / 2;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x, y, segmentWidth, segmentHeight, cornerRadius);
        } else {
            console.warn("ctx.roundRect not available, drawing simple rectangle.");
            ctx.rect(x, y, segmentWidth, segmentHeight);
        }
        ctx.fillStyle = fillColor;
        ctx.fill();
        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 2;
            ctx.stroke();
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
            drawSnakeSegment(segment.x, segment.y, segmentSize, segmentSize, cornerRadius, fillColor, snakeStrokeColor);
        });
    }

    function drawParticleEffect() {
        if (!particleEffect.active || !ctx) return;
        if (particleEffect.framesLeft > 0) {
            particleEffect.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                const alpha = particleEffect.framesLeft / PARTICLE_LIFESPAN;
                ctx.fillStyle = `rgba(240, 240, 224, ${alpha * 0.8})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            particleEffect.framesLeft--;
        } else {
            particleEffect.active = false;
        }
    }

    function updateGameState() {
        if (isGameOver || !snake || snake.length === 0) return;

        const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };

        if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
            isGameOver = true;
            return;
        }
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                isGameOver = true;
                return;
            }
        }

        snake.unshift(head);

        if (food && head.x === food.x && head.y === food.y) {
            score++;
            if (currentScoreDisplay) currentScoreDisplay.textContent = score;

            particleEffect.active = true;
            particleEffect.x = food.x * gridSize + gridSize / 2;
            particleEffect.y = food.y * gridSize + gridSize / 2;
            particleEffect.framesLeft = PARTICLE_LIFESPAN;
            particleEffect.particles = [];
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                particleEffect.particles.push({
                    x: particleEffect.x, y: particleEffect.y,
                    vx: (Math.random() - 0.5) * PARTICLE_SPEED * 2,
                    vy: (Math.random() - 0.5) * PARTICLE_SPEED * 2,
                    size: Math.random() * (gridSize * 0.15) + (gridSize * 0.05)
                });
            }

            food = getRandomFoodPosition();
            if (score > personalHighScore) {
                personalHighScore = score;
                if (highScoreDisplay) highScoreDisplay.textContent = personalHighScore;
                localStorage.setItem('snakePersonalHighScore', personalHighScore.toString());
            }
        } else {
            if (snake.length > 1) {
                 snake.pop();
            }
        }
    }

    function handleGameOverLogic() {
        clearInterval(gameIntervalId);
        gameRunning = false;
        if (restartBtn) {
            restartBtn.style.display = 'block';
        } else {
            console.warn("Restart button not found for game over logic!");
        }

        if (shouldShowHighscoreInput(score)) {
            if (highscoreInputContainer) {
                highscoreInputContainer.style.display = 'block';
                if (saveScoreBtn) {
                    saveScoreBtn.disabled = false;
                    saveScoreBtn.textContent = "Save Score"; // Translated
                }
            } else {
                console.warn("Highscore input container not found!");
            }
        }
    }

    function processInput(newVelocityX, newVelocityY) {
        if (isGameOver) return;

        const goingUp = velocityY === -1;
        const goingDown = velocityY === 1;
        const goingLeft = velocityX === -1;
        const goingRight = velocityX === 1;
        let directionChanged = false;

        if (newVelocityX === 0 && newVelocityY === -1 && !goingDown) { // Up
            velocityX = 0; velocityY = -1; directionChanged = true;
        } else if (newVelocityX === 0 && newVelocityY === 1 && !goingUp) { // Down
            velocityX = 0; velocityY = 1; directionChanged = true;
        } else if (newVelocityX === -1 && newVelocityY === 0 && !goingRight) { // Left
            velocityX = -1; velocityY = 0; directionChanged = true;
        } else if (newVelocityX === 1 && newVelocityY === 0 && !goingLeft) { // Right
            velocityX = 1; velocityY = 0; directionChanged = true;
        }

        if (directionChanged && !gameRunning) {
            startGameLoop();
        }
    }

    function handleKeyPress(event) {
        if (highscoreInputContainer && highscoreInputContainer.style.display === 'block') {
            if (event.key === 'Enter') {
                handleSaveScore();
                event.preventDefault();
            }
            return;
        }

        if (isGameOver && event.key === 'Enter' && restartBtn && restartBtn.style.display === 'block') {
            initializeGame();
            event.preventDefault();
            return;
        }

        if (isGameOver) return;

        let processed = false;
        switch (event.key) {
            case 'ArrowUp': case 'w': case 'W': processInput(0, -1); processed = true; break;
            case 'ArrowDown': case 's': case 'S': processInput(0, 1); processed = true; break;
            case 'ArrowLeft': case 'a': case 'A': processInput(-1, 0); processed = true; break;
            case 'ArrowRight': case 'd': case 'D': processInput(1, 0); processed = true; break;
        }

        if (processed && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            event.preventDefault();
        }
    }

    function setupNewGame() {
        snake = [{ x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) }];
        food = getRandomFoodPosition();
        velocityX = 0; velocityY = 0;
        score = 0;
        if (currentScoreDisplay) currentScoreDisplay.textContent = score;
        isGameOver = false;
        gameRunning = false;

        if (restartBtn) restartBtn.style.display = 'none';
        if (highscoreInputContainer) highscoreInputContainer.style.display = 'none';
        if (playerInitialsInput) playerInitialsInput.value = '';
    }

    function drawInitialState() {
        clearCanvasAndDrawBackground();
        drawSnake();
        drawFood();
    }

    function startGameLoop() {
        if (gameRunning) return;
        gameRunning = true;
        isGameOver = false;

        clearInterval(gameIntervalId);
        if (restartBtn) restartBtn.style.display = 'none';
        if (highscoreInputContainer) highscoreInputContainer.style.display = 'none';

        gameIntervalId = setInterval(() => {
            updateGameState();
            if (isGameOver) {
                handleGameOverLogic();
            } else {
                clearCanvasAndDrawBackground();
                drawFood();
                drawSnake();
                drawParticleEffect();
            }
        }, gameSpeed);
    }

    async function initializeGame() {
        const targetWidth = calculateTargetCanvasWidth();
        canvas.width = targetWidth;
        canvas.height = targetWidth;
        tileCountX = Math.floor(canvas.width / gridSize);
        tileCountY = Math.floor(canvas.height / gridSize);

        clearInterval(gameIntervalId);
        gameRunning = false;
        isGameOver = false;

        await loadLeaderboard();
        setupNewGame();
        drawInitialState();

        personalHighScore = localStorage.getItem('snakePersonalHighScore') ? parseInt(localStorage.getItem('snakePersonalHighScore')) : 0;
        if (highScoreDisplay) highScoreDisplay.textContent = personalHighScore;

        if (highscoreInputContainer) highscoreInputContainer.style.display = 'none';
        if (restartBtn) restartBtn.style.display = 'none';
    }

    document.addEventListener('keydown', handleKeyPress);
    if (restartBtn) restartBtn.addEventListener('click', initializeGame);
    if (saveScoreBtn) saveScoreBtn.addEventListener('click', handleSaveScore);

    if (touchUpBtn) touchUpBtn.addEventListener('click', () => processInput(0, -1));
    if (touchDownBtn) touchDownBtn.addEventListener('click', () => processInput(0, 1));
    if (touchLeftBtn) touchLeftBtn.addEventListener('click', () => processInput(-1, 0));
    if (touchRightBtn) touchRightBtn.addEventListener('click', () => processInput(1, 0));

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const currentCanvasWidth = canvas.width;
            const targetCanvasWidth = calculateTargetCanvasWidth();
            const isInputCurrentlyVisible = highscoreInputContainer && highscoreInputContainer.style.display === 'block';

            if (targetCanvasWidth !== currentCanvasWidth) {
                if (!isInputCurrentlyVisible && !gameRunning) {
                    initializeGame();
                } else if (!isInputCurrentlyVisible && gameRunning) {
                    initializeGame();
                } else {
                    canvas.width = targetCanvasWidth;
                    canvas.height = targetCanvasWidth;
                    tileCountX = Math.floor(canvas.width / gridSize);
                    tileCountY = Math.floor(canvas.height / gridSize);
                    if (isGameOver) {
                        clearCanvasAndDrawBackground();
                        drawSnake();
                        drawFood();
                    } else if (!gameRunning) {
                        drawInitialState();
                    }
                }
            }
        }, 250);
    });

    initializeGame();

});