// Wait for the DOM to be fully loaded before running the game script
document.addEventListener('DOMContentLoaded', () => {

    // --- Touch Device Detection & Controls Setup ---
    const isTouchDevice = ('ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0);
    const touchControlsContainer = document.getElementById('touch-controls-container');
    const gameInstructions = document.querySelector('.game-instructions');

    if (isTouchDevice) {
        document.body.classList.add('touch-enabled');
        if (touchControlsContainer) {
            touchControlsContainer.style.display = 'flex'; // Directly show touch controls
        }
        if (gameInstructions) {
            // Optional: You can hide or modify keyboard instructions for touch devices
            // gameInstructions.textContent = "Use the on-screen buttons to move the snake.";
            // gameInstructions.style.display = 'none'; 
        }
        console.log("Touch device detected. Touch controls enabled.");
    } else {
        if (touchControlsContainer) {
            touchControlsContainer.style.display = 'none'; // Ensure touch controls are hidden
        }
        console.log("Non-touch device detected.");
    }

    // --- 1. Initial Setup: DOM Element Selection and Core Variables ---
    const canvas = document.getElementById('snakeCanvas');
    const ctx = canvas.getContext('2d');
    const gameUIContainer = document.querySelector('.game-ui-container'); // Crucial for canvas sizing

    const currentScoreDisplay = document.getElementById('currentScore');
    const highScoreDisplay = document.getElementById('highScore'); // Display for personal high score
    const restartBtn = document.getElementById('restartGameBtn');

    // Elements for leaderboard and initials input
    const highscoreInputContainer = document.getElementById('highscore-input-container');
    const playerInitialsInput = document.getElementById('playerInitials');
    const saveScoreBtn = document.getElementById('saveScoreBtn');
    const leaderboardList = document.getElementById('leaderboard-list');

    // Buttons for touch controls
    const touchUpBtn = document.getElementById('touchUpBtn');
    const touchDownBtn = document.getElementById('touchDownBtn');
    const touchLeftBtn = document.getElementById('touchLeftBtn');
    const touchRightBtn = document.getElementById('touchRightBtn');

    const initialCanvasWidth = 400; // Original canvas width
    // const initialCanvasHeight = 400; // Original canvas height (now square, so width is used)
    const gridSize = 20; // Keep gridSize fixed
    let tileCountX = initialCanvasWidth / gridSize;
    let tileCountY = initialCanvasWidth / gridSize; // Assuming square canvas initially

    let gameSpeed = 120; // Lower is faster
    let gameIntervalId;

    // Game state
    let snake;
    let food;
    let velocityX;
    let velocityY;
    let score;
    let personalHighScore = localStorage.getItem('snakePersonalHighScore') ? parseInt(localStorage.getItem('snakePersonalHighScore')) : 0;
    highScoreDisplay.textContent = personalHighScore;

    let isGameOver;
    let gameRunning; // Tracks if the game loop is active (snake is moving)

    // Leaderboard
    const MAX_LEADERBOARD_ENTRIES = 5;
    let leaderboard = [];

    // Colors
    const snakeColor = '#3498db';
    const foodColor = '#f0f0e0'; // Light color for food

    // --- Function to Adapt Canvas Dimensions ---
    /**
     * Adapts canvas dimensions for various screen sizes.
     * Keeps gridSize fixed and recalculates tileCount.
     */
    function adjustCanvasSize() {
        if (!gameUIContainer) {
            console.error("Game UI container not found for canvas sizing!");
            canvas.width = initialCanvasWidth; // Fallback
            canvas.height = initialCanvasWidth;
        } else {
            const containerStyle = window.getComputedStyle(gameUIContainer);
            const containerPaddingLeft = parseFloat(containerStyle.paddingLeft);
            const containerPaddingRight = parseFloat(containerStyle.paddingRight);
            
            // availableWidth is the content-box width of the container
            const availableWidth = gameUIContainer.clientWidth - containerPaddingLeft - containerPaddingRight;
            
            let newTileCount = Math.floor(availableWidth / gridSize);

            if (newTileCount < 10) newTileCount = 10; // Minimum 10 tiles wide

            let newCanvasWidth = newTileCount * gridSize;
            
            // Optional: Cap canvas width if it's larger than the initial design but screen is still smallish
            // if (newCanvasWidth > initialCanvasWidth && window.innerWidth < 768) {
            // newCanvasWidth = initialCanvasWidth;
            // }

            canvas.width = newCanvasWidth;
            canvas.height = newCanvasWidth; // Keep canvas square
        }

        tileCountX = canvas.width / gridSize;
        tileCountY = canvas.height / gridSize;

        console.log(`Canvas resized to: ${canvas.width}x${canvas.height}. Tiles: ${tileCountX}x${tileCountY}`);
    }


    // --- Leaderboard Functions ---
    function loadLeaderboard() {
        const storedLeaderboard = localStorage.getItem('snakeLeaderboard');
        leaderboard = storedLeaderboard ? JSON.parse(storedLeaderboard) : [];
    }

    function saveLeaderboard() {
        localStorage.setItem('snakeLeaderboard', JSON.stringify(leaderboard));
    }

    function displayLeaderboard() {
        leaderboardList.innerHTML = ''; // Clear existing list
        if (leaderboard.length === 0) {
            leaderboardList.innerHTML = '<li>No scores yet</li>';
            return;
        }
        leaderboard.forEach(entry => {
            const li = document.createElement('li');
            const nameSpan = document.createElement('span');
            nameSpan.className = 'player-name';
            nameSpan.textContent = entry.initials;
            const scoreSpan = document.createElement('span');
            scoreSpan.className = 'player-score';
            scoreSpan.textContent = entry.score;
            li.appendChild(nameSpan);
            li.appendChild(scoreSpan);
            leaderboardList.appendChild(li);
        });
    }

    function qualifiesForLeaderboard(currentScore) {
        if (currentScore <= 0) return false;
        if (leaderboard.length < MAX_LEADERBOARD_ENTRIES) return true;
        return currentScore > leaderboard[leaderboard.length - 1].score;
    }

    function addScoreToLeaderboard(initials, newScore) {
        leaderboard.push({ initials: initials.toUpperCase(), score: newScore });
        leaderboard.sort((a, b) => b.score - a.score); // Sort descending
        leaderboard = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES); // Keep only top entries
        saveLeaderboard();
        displayLeaderboard();
    }

    function handleSaveScore() {
        const initials = playerInitialsInput.value.trim();
        if (initials.length > 0 && initials.length <= 5) {
            addScoreToLeaderboard(initials, score);
            highscoreInputContainer.style.display = 'none';
            playerInitialsInput.value = ''; // Clear input
            restartBtn.style.display = 'block'; // Show restart button
        } else {
            alert('Please enter 1 to 5 characters for your initials.');
            playerInitialsInput.focus();
        }
    }

    // --- 2. Basic Drawing Logic ---
    function clearCanvasAndDrawBackground() {
        const canvasBgColor = getComputedStyle(canvas).backgroundColor; // Get actual background color
        ctx.fillStyle = canvasBgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawRect(x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * gridSize, y * gridSize, gridSize - 1, gridSize - 1); // -1 for grid line effect
    }

    function drawSnake() {
        snake.forEach(segment => drawRect(segment.x, segment.y, snakeColor));
    }

    function drawFood() {
        drawRect(food.x, food.y, foodColor);
    }

    function getRandomFoodPosition() {
        let newPosition;
        do {
            newPosition = {
                x: Math.floor(Math.random() * tileCountX),
                y: Math.floor(Math.random() * tileCountY)
            };
        } while (snake && snake.some(segment => segment.x === newPosition.x && segment.y === newPosition.y)); // Ensure food not on snake
        return newPosition;
    }

    // --- 3. Main Game Logic ---
    function updateGameState() {
        if (isGameOver) return;

        const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };

        // Check for wall collision
        if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
            isGameOver = true;
            return;
        }
        // Check for self-collision
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                isGameOver = true;
                return;
            }
        }

        snake.unshift(head); // Add new head

        // Check for food consumption
        if (head.x === food.x && head.y === food.y) {
            score++;
            currentScoreDisplay.textContent = score;
            food = getRandomFoodPosition();
            if (score > personalHighScore) {
                personalHighScore = score;
                highScoreDisplay.textContent = personalHighScore;
                localStorage.setItem('snakePersonalHighScore', personalHighScore.toString());
            }
        } else {
            snake.pop(); // Remove tail if no food eaten
        }
    }

    function handleGameOverLogic() {
        clearInterval(gameIntervalId);
        gameRunning = false; // Stop game loop flag
        // Display "Game Over" message or visual cue (optional)
        // ctx.fillStyle = 'rgba(0,0,0,0.7)';
        // ctx.fillRect(0,0,canvas.width, canvas.height);
        // ctx.font = '30px Space Grotesk';
        // ctx.fillStyle = 'white';
        // ctx.textAlign = 'center';
        // ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 20);
        // ctx.font = '20px Space Grotesk';
        // ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);


        if (qualifiesForLeaderboard(score)) {
            highscoreInputContainer.style.display = 'block';
            playerInitialsInput.focus();
            restartBtn.style.display = 'none'; // Hide restart until score is saved/skipped
        } else {
            restartBtn.style.display = 'block';
        }
    }

    // --- 4. Input Handling (Keyboard and Touch) ---
    function processInput(newVelocityX, newVelocityY) {
        if (isGameOver && !gameRunning) return; // Allow direction change if game over but loop not stopped yet (e.g. for first move)

        const goingUp = velocityY === -1;
        const goingDown = velocityY === 1;
        const goingLeft = velocityX === -1;
        const goingRight = velocityX === 1;

        let directionChanged = false;

        // Prevent moving directly into itself
        if (newVelocityX === 0 && newVelocityY === -1 && !goingDown) { // Up
            velocityX = 0; velocityY = -1; directionChanged = true;
        } else if (newVelocityX === 0 && newVelocityY === 1 && !goingUp) { // Down
            velocityX = 0; velocityY = 1; directionChanged = true;
        } else if (newVelocityX === -1 && newVelocityY === 0 && !goingRight) { // Left
            velocityX = -1; velocityY = 0; directionChanged = true;
        } else if (newVelocityX === 1 && newVelocityY === 0 && !goingLeft) { // Right
            velocityX = 1; velocityY = 0; directionChanged = true;
        }
        
        // Start game on first valid input if not already running
        if (directionChanged && !gameRunning && !isGameOver) {
            startGameLoop();
        }
    }

    function handleKeyPress(event) {
        // If highscore input is visible, Enter key should save score
        if (highscoreInputContainer.style.display === 'block') {
            if (event.key === 'Enter') {
                handleSaveScore();
            }
            return; // Don't process game inputs
        }

        // If game is over and restart button is visible, Enter key can restart
        if (isGameOver && event.key === 'Enter' && restartBtn.style.display === 'block') {
            initializeGame();
            return;
        }
        
        // If game hasn't started or is over, and no input dialog, don't change velocity yet
        // but allow first move to start the game via processInput
        if (isGameOver && gameRunning) return;


        switch (event.key) {
            case 'ArrowUp': case 'w': case 'W':
                processInput(0, -1); event.preventDefault(); break;
            case 'ArrowDown': case 's': case 'S':
                processInput(0, 1); event.preventDefault(); break;
            case 'ArrowLeft': case 'a': case 'A':
                processInput(-1, 0); event.preventDefault(); break;
            case 'ArrowRight': case 'd': case 'D':
                processInput(1, 0); event.preventDefault(); break;
        }
    }

    // --- 5. Game Initialization and Controls ---
    function setupNewGame() {
        // Recalculate snake's starting position based on current canvas dimensions
        snake = [{ x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) }];
        food = getRandomFoodPosition();
        velocityX = 0; // Snake doesn't move until first input
        velocityY = 0;
        score = 0;
        currentScoreDisplay.textContent = score;
        isGameOver = false;
        gameRunning = false; // Game loop not started yet
        restartBtn.style.display = 'none';
        highscoreInputContainer.style.display = 'none';
        playerInitialsInput.value = '';
    }

    function drawInitialState() {
        clearCanvasAndDrawBackground();
        drawSnake();
        drawFood();
        // Optional: Draw "Press any key to start" message
        // if (!gameRunning && !isGameOver) {
        //     ctx.font = '20px Space Grotesk';
        //     ctx.fillStyle = 'white';
        //     ctx.textAlign = 'center';
        //     ctx.fillText('Press an arrow key to start', canvas.width / 2, canvas.height / 2 + 50);
        // }
    }

    function startGameLoop() {
        if (gameRunning) return; // Prevent multiple loops
        gameRunning = true;
        isGameOver = false; // Ensure game over state is reset
        clearInterval(gameIntervalId); // Clear any existing interval
        restartBtn.style.display = 'none'; // Hide restart button during gameplay
        highscoreInputContainer.style.display = 'none';

        gameIntervalId = setInterval(() => {
            updateGameState();
            if (isGameOver) {
                handleGameOverLogic();
            } else {
                clearCanvasAndDrawBackground();
                drawFood();
                drawSnake();
            }
        }, gameSpeed);
    }

    function initializeGame() {
        console.log("Snake Game Initialized!");
        adjustCanvasSize(); // Adapt canvas dimensions first
        clearInterval(gameIntervalId); // Stop any ongoing game
        loadLeaderboard();
        displayLeaderboard();
        setupNewGame(); // Setup game state with new canvas dimensions
        drawInitialState(); // Draw initial state on the potentially resized canvas
        personalHighScore = localStorage.getItem('snakePersonalHighScore') ? parseInt(localStorage.getItem('snakePersonalHighScore')) : 0;
        highScoreDisplay.textContent = personalHighScore;
    }

    // Event Listeners
    document.addEventListener('keydown', handleKeyPress);
    restartBtn.addEventListener('click', initializeGame);
    saveScoreBtn.addEventListener('click', handleSaveScore);

    // Event Listeners for Touch Controls (only if buttons exist)
    if (touchUpBtn) touchUpBtn.addEventListener('click', () => processInput(0, -1));
    if (touchDownBtn) touchDownBtn.addEventListener('click', () => processInput(0, 1));
    if (touchLeftBtn) touchLeftBtn.addEventListener('click', () => processInput(-1, 0));
    if (touchRightBtn) touchRightBtn.addEventListener('click', () => processInput(1, 0));
    
    // Add a listener for window resize (with debounce)
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const oldCanvasWidth = canvas.width;
            // Re-initialize the game which includes adjustCanvasSize
            initializeGame(); 
            
            // If the game was running and canvas size changed significantly,
            // it's already reset by initializeGame.
            // You might want to provide a message or specific handling here if needed.
            if(gameRunning && canvas.width !== oldCanvasWidth){
                 console.warn("Canvas resized during gameplay. Game has been reset.");
            }
        }, 250); // Debounce to avoid too many calls
    });

    // Start the initialization
    initializeGame();

}); // End DOMContentLoaded
