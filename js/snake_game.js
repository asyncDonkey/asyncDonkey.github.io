// Attendere che il DOM sia completamente caricato prima di eseguire lo script del gioco
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Setup Iniziale: Selezione Elementi DOM e Variabili Core ---
    const canvas = document.getElementById('snakeCanvas');
    const ctx = canvas.getContext('2d');

    const currentScoreDisplay = document.getElementById('currentScore');
    const highScoreDisplay = document.getElementById('highScore'); // Display del punteggio massimo personale
    const restartBtn = document.getElementById('restartGameBtn');

    // Elementi per la classifica e l'input delle iniziali
    const highscoreInputContainer = document.getElementById('highscore-input-container');
    const playerInitialsInput = document.getElementById('playerInitials');
    const saveScoreBtn = document.getElementById('saveScoreBtn');
    const leaderboardList = document.getElementById('leaderboard-list');

    // Pulsanti per controlli touch
    const touchUpBtn = document.getElementById('touchUpBtn');
    const touchDownBtn = document.getElementById('touchDownBtn');
    const touchLeftBtn = document.getElementById('touchLeftBtn');
    const touchRightBtn = document.getElementById('touchRightBtn');

    const initialCanvasWidth = 400; // Larghezza originale del canvas
    const initialCanvasHeight = 400; // Altezza originale del canvas
    const gridSize = 20; // Manteniamo gridSize fisso
    let tileCountX = initialCanvasWidth / gridSize;
    let tileCountY = initialCanvasHeight / gridSize;

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

    // Leaderboard
    const MAX_LEADERBOARD_ENTRIES = 5;
    let leaderboard = [];

    // Colori
    const snakeColor = '#3498db';
    const foodColor = '#f0f0e0';

    // --- Funzione per Adattare Dimensioni Canvas ---
    /**
     * Adatta le dimensioni del canvas per schermi più piccoli.
     * Mantiene gridSize fisso e ricalcola tileCount.
     */
    function adjustCanvasSize() {
        const screenWidth = window.innerWidth;
        let newCanvasWidth = initialCanvasWidth;

        if (screenWidth < 440) { // Threshold per iniziare a ridimensionare (400 canvas + un po' di padding)
            newCanvasWidth = Math.floor((screenWidth - 40) / gridSize) * gridSize; // Rendi multiplo di gridSize, con margine
            if (newCanvasWidth < gridSize * 10) newCanvasWidth = gridSize * 10; // Minimo 10 tiles di larghezza
        }
        
        canvas.width = newCanvasWidth;
        canvas.height = newCanvasWidth; // Manteniamo il canvas quadrato per semplicità

        tileCountX = canvas.width / gridSize;
        tileCountY = canvas.height / gridSize;

        // Se il canvas è stato ridimensionato, potrebbe essere necessario ridisegnare lo stato attuale
        // Ma questo viene fatto da initializeGame/drawInitialState
        console.log(`Canvas resized to: ${canvas.width}x${canvas.height}. Tiles: ${tileCountX}x${tileCountY}`);
    }


    // --- Funzioni Leaderboard (invariate dalla versione precedente) ---
    function loadLeaderboard() {
        const storedLeaderboard = localStorage.getItem('snakeLeaderboard');
        if (storedLeaderboard) {
            leaderboard = JSON.parse(storedLeaderboard);
        } else {
            leaderboard = [];
        }
    }
    function saveLeaderboard() {
        localStorage.setItem('snakeLeaderboard', JSON.stringify(leaderboard));
    }
    function displayLeaderboard() {
        leaderboardList.innerHTML = '';
        if (leaderboard.length === 0) {
            leaderboardList.innerHTML = '<li>Nessun punteggio ancora</li>';
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
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES);
        saveLeaderboard();
        displayLeaderboard();
    }
    function handleSaveScore() {
        const initials = playerInitialsInput.value.trim();
        if (initials.length > 0 && initials.length <= 5) {
            addScoreToLeaderboard(initials, score);
            highscoreInputContainer.style.display = 'none';
            playerInitialsInput.value = '';
            restartBtn.style.display = 'block';
        } else {
            alert('Per favore, inserisci da 1 a 5 caratteri per le tue iniziali.');
            playerInitialsInput.focus();
        }
    }

    // --- 2. Logica di Disegno Base ---
    function clearCanvasAndDrawBackground() {
        const canvasBgColor = getComputedStyle(canvas).backgroundColor;
        ctx.fillStyle = canvasBgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    function drawRect(x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * gridSize, y * gridSize, gridSize - 1, gridSize - 1);
    }
    function drawSnake() {
        snake.forEach(segment => {
            drawRect(segment.x, segment.y, snakeColor);
        });
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
        } while (snake && snake.some(segment => segment.x === newPosition.x && segment.y === newPosition.y));
        return newPosition;
    }

    // --- 3. Logica di Gioco Principale ---
    function updateGameState() {
        if (isGameOver) return;
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
            snake.pop();
        }
    }
    function handleGameOverLogic() { // Rinominata da handleGameOver per chiarezza
        clearInterval(gameIntervalId);
        gameRunning = false;
        if (qualifiesForLeaderboard(score)) {
            highscoreInputContainer.style.display = 'block';
            playerInitialsInput.focus();
            restartBtn.style.display = 'none';
        } else {
            restartBtn.style.display = 'block';
        }
    }

    // --- 4. Gestione Input (Tastiera e Touch) ---
    function processInput(newVelocityX, newVelocityY) {
        if (isGameOver) return;

        const goingUp = velocityY === -1;
        const goingDown = velocityY === 1;
        const goingLeft = velocityX === -1;
        const goingRight = velocityX === 1;

        let directionChanged = false;

        if (newVelocityX === 0 && newVelocityY === -1 && !goingDown) { // Su
            velocityX = 0; velocityY = -1; directionChanged = true;
        } else if (newVelocityX === 0 && newVelocityY === 1 && !goingUp) { // Giù
            velocityX = 0; velocityY = 1; directionChanged = true;
        } else if (newVelocityX === -1 && newVelocityY === 0 && !goingRight) { // Sinistra
            velocityX = -1; velocityY = 0; directionChanged = true;
        } else if (newVelocityX === 1 && newVelocityY === 0 && !goingLeft) { // Destra
            velocityX = 1; velocityY = 0; directionChanged = true;
        }
        
        if (directionChanged && !gameRunning) {
            startGameLoop();
        }
    }

    function handleKeyPress(event) {
        if (highscoreInputContainer.style.display === 'block') {
            if (event.key === 'Enter') handleSaveScore();
            return;
        }
        if (isGameOver && event.key === 'Enter') {
            initializeGame();
            return;
        }

        switch (event.key) {
            case 'ArrowUp': case 'w': case 'W':
                processInput(0, -1);
                break;
            case 'ArrowDown': case 's': case 'S':
                processInput(0, 1);
                break;
            case 'ArrowLeft': case 'a': case 'A':
                processInput(-1, 0);
                break;
            case 'ArrowRight': case 'd': case 'D':
                processInput(1, 0);
                break;
        }
    }

    // --- 5. Inizializzazione e Controlli del Gioco ---
    function setupNewGame() {
        // Ricalcola la posizione iniziale del serpente basata sulle dimensioni attuali del canvas
        snake = [{ x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) }];
        food = getRandomFoodPosition();
        velocityX = 0;
        velocityY = 0;
        score = 0;
        currentScoreDisplay.textContent = score;
        isGameOver = false;
        gameRunning = false;
        restartBtn.style.display = 'none';
        highscoreInputContainer.style.display = 'none';
        playerInitialsInput.value = '';
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
        restartBtn.style.display = 'none';
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
        console.log("Gioco Snake Inizializzato!");
        adjustCanvasSize(); // Adatta le dimensioni del canvas prima di tutto
        clearInterval(gameIntervalId);
        loadLeaderboard();
        displayLeaderboard();
        setupNewGame(); // Imposta il gioco con le nuove dimensioni del canvas
        drawInitialState(); // Disegna lo stato con le nuove dimensioni
        personalHighScore = localStorage.getItem('snakePersonalHighScore') ? parseInt(localStorage.getItem('snakePersonalHighScore')) : 0;
        highScoreDisplay.textContent = personalHighScore;
    }

    // Event Listener
    document.addEventListener('keydown', handleKeyPress);
    restartBtn.addEventListener('click', initializeGame);
    saveScoreBtn.addEventListener('click', handleSaveScore);

    // Event Listener per Controlli Touch
    touchUpBtn.addEventListener('click', () => processInput(0, -1));
    touchDownBtn.addEventListener('click', () => processInput(0, 1));
    touchLeftBtn.addEventListener('click', () => processInput(-1, 0));
    touchRightBtn.addEventListener('click', () => processInput(1, 0));
    
    // Aggiungi un listener per il resize della finestra (opzionale, con debounce)
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Se il gioco è in corso, potresti volerlo mettere in pausa o resettare.
            // Per ora, lo resettiamo se la dimensione cambia significativamente.
            // Una gestione più fine potrebbe essere necessaria per un'esperienza utente ottimale.
            const oldCanvasWidth = canvas.width;
            initializeGame(); // Ricalcola tutto
            // Se il gioco era in corso e la dimensione è cambiata, è meglio resettare
            // o mettere in pausa e avvisare l'utente.
            if(gameRunning && canvas.width !== oldCanvasWidth){
                 console.warn("Canvas resized during gameplay. Game has been reset.");
                 // Potresti anche voler fermare il game loop qui e richiedere un'azione dell'utente.
            }
        }, 250); // Debounce per evitare troppe chiamate
    });


    // Avvia l'inizializzazione
    initializeGame();

}); // Fine DOMContentLoaded
