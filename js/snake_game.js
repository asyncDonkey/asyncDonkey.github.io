// js/snake_game.js

import { db, auth } from './main.js'; // Importa istanze centralizzate

// DEBUG: Verifica istanze importate
console.log("snake_game.js: db instance imported:", db ? 'OK' : 'FAIL', db);
console.log("snake_game.js: auth instance imported:", auth ? 'OK' : 'FAIL', auth);

import {
    collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// onAuthStateChanged può essere utile per aggiornamenti UI reattivi (es. precompilare nome).
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


let leaderboardCollection;
if (db) { // Inizializza solo se db è valido
    leaderboardCollection = collection(db, "leaderboardScores");
    console.log("snake_game.js: leaderboardCollection initialized with db:", leaderboardCollection ? 'OK' : 'FAIL');
} else {
    console.error("snake_game.js: Istanza DB non valida! Impossibile inizializzare leaderboardCollection.");
}

let currentUserForSnake = null; // Per tenere traccia dell'utente loggato specificamente per questo modulo

// Ascolta i cambiamenti dello stato di autenticazione per snake_game
// Questo è utile se vuoi che la UI del gioco reagisca immediatamente al login/logout
// senza attendere un'azione dell'utente.
onAuthStateChanged(auth, (user) => {
    currentUserForSnake = user;
    if (user) {
        console.log("snake_game.js - onAuthStateChanged: Utente loggato", user.uid);
    } else {
        console.log("snake_game.js - onAuthStateChanged: Utente non loggato");
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('snakeCanvas');
    if (!canvas) { console.error("Elemento Canvas ('snakeCanvas') non trovato!"); return; }
    const ctx = canvas.getContext('2d');
    if (!ctx) { console.error("Contesto Canvas non disponibile!"); return; }

    const gameUIContainer = document.querySelector('.game-ui-container');
    const currentScoreDisplay = document.getElementById('currentScore');
    const highScoreDisplay = document.getElementById('highScore'); // Record personale locale
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
            console.warn("Dispositivo touch rilevato, ma contenitore controlli touch non trovato!");
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
    const PARTICLE_COUNT = 8;
    const PARTICLE_LIFESPAN = 10;
    const PARTICLE_SPEED = 2;

    function calculateTargetCanvasWidth() {
        let targetWidth = initialCanvasWidth;
        if (!gameUIContainer) {
            console.warn("Contenitore UI del gioco (gameUIContainer) non trovato!");
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
        if (!leaderboardList) {
            console.warn("Elemento leaderboard-list non trovato, non carico la leaderboard.");
            return;
        }
        if (!leaderboardCollection) {
            console.error("snake_game.js - loadLeaderboard: leaderboardCollection non è inizializzata.");
            leaderboardList.innerHTML = '<li>Errore: Connessione al database fallita.</li>';
            return;
        }
        leaderboardList.innerHTML = '<li>Caricamento punteggi...</li>';
        try {
            const q = query(leaderboardCollection, orderBy("score", "desc"), limit(MAX_LEADERBOARD_ENTRIES));
            const querySnapshot = await getDocs(q);
            const fetchedLeaderboard = [];
            querySnapshot.forEach((doc) => fetchedLeaderboard.push(doc.data()));
            displayLeaderboard(fetchedLeaderboard);
        } catch (error) {
            console.error("snake_game.js - Errore caricamento leaderboard: ", error);
            if (leaderboardList) leaderboardList.innerHTML = '<li>Errore caricamento punteggi</li>';
        }
    }

    function displayLeaderboard(leaderboardData) {
        if (!leaderboardList) return;
        leaderboardList.innerHTML = '';
        if (!leaderboardData || leaderboardData.length === 0) {
            leaderboardList.innerHTML = '<li>Nessun punteggio ancora</li>';
            return;
        }
        leaderboardData.forEach(entry => {
            const li = document.createElement('li');
            const nameSpan = document.createElement('span');
            nameSpan.className = 'player-name';
            nameSpan.textContent = entry.userName || entry.initials || 'N/A';
            const scoreSpan = document.createElement('span');
            scoreSpan.className = 'player-score';
            scoreSpan.textContent = entry.score !== undefined ? entry.score : '-';
            li.appendChild(nameSpan);
            li.appendChild(scoreSpan);
            leaderboardList.appendChild(li);
        });
    }

    async function handleSaveScore() {
        console.log("snake_game.js - handleSaveScore avviato.");
        if (!leaderboardCollection) {
            console.error("snake_game.js - handleSaveScore: leaderboardCollection non è inizializzata.");
            alert("Errore: Impossibile salvare il punteggio. Connessione al database fallita.");
            if (saveScoreBtn) { saveScoreBtn.disabled = false; saveScoreBtn.textContent = "Salva Punteggio"; }
            return;
        }

        const user = auth.currentUser; // Ottieni l'utente corrente da Firebase Auth
        const currentScoreVal = score;
        let initialsToSave = playerInitialsInput ? playerInitialsInput.value.trim().toUpperCase() : "";
        let userIdToSave = null;
        let userNameToSave = null;

        if (user) {
            console.log("snake_game.js - Utente loggato per salvataggio punteggio:", user.uid);
            userIdToSave = user.uid;
            const userProfileRef = doc(db, "userProfiles", user.uid); // Usa 'db' importato
            try {
                const docSnap = await getDoc(userProfileRef);
                if (docSnap.exists() && docSnap.data().nickname) {
                    userNameToSave = docSnap.data().nickname;
                } else {
                    userNameToSave = user.email.split('@')[0]; // Fallback
                }
            } catch (profileError) {
                console.error("snake_game.js - Errore caricamento profilo per punteggio:", profileError);
                userNameToSave = user.email.split('@')[0]; // Fallback
            }
            if (!initialsToSave) { // Se l'utente loggato lascia vuoto il campo iniziali
                initialsToSave = userNameToSave.substring(0, 5).toUpperCase();
            }
        } else {
            console.log("snake_game.js - Utente non loggato per salvataggio punteggio.");
            if (initialsToSave.length === 0 || initialsToSave.length > 5) {
                alert('Per favore, inserisci da 1 a 5 caratteri per le tue iniziali.');
                if (playerInitialsInput) playerInitialsInput.focus();
                return;
            }
            userNameToSave = initialsToSave; // Per utenti non loggati, userName è le iniziali
        }

        if (initialsToSave.length === 0 || initialsToSave.length > 5) {
             alert('Le iniziali devono essere tra 1 e 5 caratteri.');
             if (playerInitialsInput) playerInitialsInput.focus();
             return;
        }

        if (saveScoreBtn) {
            saveScoreBtn.disabled = true;
            saveScoreBtn.textContent = "Salvataggio...";
        }

        try {
            const scoreData = {
                score: currentScoreVal,
                timestamp: serverTimestamp(),
                initials: initialsToSave
            };
            if (userIdToSave) {
                scoreData.userId = userIdToSave;
                scoreData.userName = userNameToSave;
            } else {
                 scoreData.userName = initialsToSave; // Per non loggati, userName è le iniziali
            }
            console.log("snake_game.js - Dati punteggio da inviare:", scoreData);

            const docRef = await addDoc(leaderboardCollection, scoreData);
            console.log("snake_game.js - Punteggio salvato con ID:", docRef.id);

            if (highscoreInputContainer) highscoreInputContainer.style.display = 'none';
            if (playerInitialsInput) playerInitialsInput.value = '';
            if (restartBtn) restartBtn.style.display = 'block';
            await loadLeaderboard();
        } catch (error) {
            console.error("snake_game.js - Errore salvataggio punteggio a Firestore: ", error);
            alert("Errore nel salvataggio del punteggio. Riprova.");
        } finally {
            if (saveScoreBtn) {
                saveScoreBtn.disabled = false;
                saveScoreBtn.textContent = "Salva Punteggio";
            }
        }
    }

    function shouldShowHighscoreInput(currentScoreVal) {
        return currentScoreVal > 0;
    }

    function clearCanvasAndDrawBackground() {
        if (!canvas || !ctx) return;
        const canvasBgColor = getComputedStyle(canvas).backgroundColor || '#2c3e50';
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
            console.warn("Impossibile ottenere posizione cibo, tile count non valido:", tileCountX, tileCountY);
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
            isGameOver = true; return;
        }
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                isGameOver = true; return;
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
            console.warn("Bottone Restart non trovato per game over!");
        }
        if (shouldShowHighscoreInput(score)) {
            if (highscoreInputContainer) {
                highscoreInputContainer.style.display = 'block';
                const user = auth.currentUser; // Prendi l'utente da auth
                if (user && playerInitialsInput) {
                    // Tenta di caricare il profilo per il nickname
                    const userProfileRef = doc(db, "userProfiles", user.uid);
                    getDoc(userProfileRef).then(docSnap => {
                        if (docSnap.exists() && docSnap.data().nickname) {
                            playerInitialsInput.value = docSnap.data().nickname.substring(0,5).toUpperCase();
                        } else {
                            playerInitialsInput.value = (user.email.split('@')[0] || '').substring(0,5).toUpperCase();
                        }
                    }).catch(err => {
                         console.error("Errore nel precompilare iniziali da profilo:", err);
                         playerInitialsInput.value = (user.email.split('@')[0] || '').substring(0,5).toUpperCase();
                    });
                    playerInitialsInput.placeholder = "Nickname (max 5)";
                } else if (playerInitialsInput) {
                    playerInitialsInput.value = ''; // Pulisci per utenti non loggati
                    playerInitialsInput.placeholder = "ABCDE";
                }
                if (saveScoreBtn) {
                    saveScoreBtn.disabled = false;
                    saveScoreBtn.textContent = "Salva Punteggio";
                }
            } else {
                console.warn("Contenitore input highscore non trovato!");
            }
        }
    }

    function processInput(newVelocityX, newVelocityY) {
        if (isGameOver && !gameRunning) return;
        const goingUp = velocityY === -1;
        const goingDown = velocityY === 1;
        const goingLeft = velocityX === -1;
        const goingRight = velocityX === 1;
        let directionChanged = false;
        if (newVelocityX === 0 && newVelocityY === -1 && !goingDown) {
            velocityX = 0; velocityY = -1; directionChanged = true;
        } else if (newVelocityX === 0 && newVelocityY === 1 && !goingUp) {
            velocityX = 0; velocityY = 1; directionChanged = true;
        } else if (newVelocityX === -1 && newVelocityY === 0 && !goingRight) {
            velocityX = -1; velocityY = 0; directionChanged = true;
        } else if (newVelocityX === 1 && newVelocityY === 0 && !goingLeft) {
            velocityX = 1; velocityY = 0; directionChanged = true;
        }
        if (directionChanged && !gameRunning && !isGameOver) {
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
        if (isGameOver && gameRunning) return;
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
        if (gameRunning || isGameOver) return;
        gameRunning = true;
        isGameOver = false;
        clearInterval(gameIntervalId);
        if (restartBtn) restartBtn.style.display = 'none';
        if (highscoreInputContainer) highscoreInputContainer.style.display = 'none';
        gameIntervalId = setInterval(() => {
            if (isGameOver) {
                handleGameOverLogic();
            } else {
                updateGameState();
                if (isGameOver) { // Ricontrolla dopo updateGameState
                    handleGameOverLogic();
                } else {
                    clearCanvasAndDrawBackground();
                    drawFood();
                    drawSnake();
                    drawParticleEffect();
                }
            }
        }, gameSpeed);
    }

    async function initializeGame() {
        const targetWidth = calculateTargetCanvasWidth();
        if (canvas.width !== targetWidth || canvas.height !== targetWidth) {
            canvas.width = targetWidth;
            canvas.height = targetWidth;
        }
        tileCountX = Math.floor(canvas.width / gridSize);
        tileCountY = Math.floor(canvas.height / gridSize);

        clearInterval(gameIntervalId);
        gameRunning = false;
        isGameOver = false;

        if (db && leaderboardCollection) { // Carica solo se db e collection sono validi
             await loadLeaderboard();
        } else {
            console.warn("snake_game.js - DB o leaderboardCollection non validi, non carico leaderboard in init.");
            if(leaderboardList) leaderboardList.innerHTML = "<li>Leaderboard non disponibile (errore db).</li>";
        }

        setupNewGame();
        drawInitialState();

        personalHighScore = localStorage.getItem('snakePersonalHighScore') ? parseInt(localStorage.getItem('snakePersonalHighScore')) : 0;
        if (highScoreDisplay) highScoreDisplay.textContent = personalHighScore;

        if (highscoreInputContainer) highscoreInputContainer.style.display = 'none';
        if (restartBtn) restartBtn.style.display = 'none';
    }

    // Event Listeners
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
                if ((!gameRunning && !isGameOver) || (isGameOver && !isInputCurrentlyVisible)) {
                    initializeGame();
                } else if (gameRunning && !isGameOver) {
                    initializeGame(); // Semplice re-inizializzazione
                } else {
                    canvas.width = targetCanvasWidth;
                    canvas.height = targetCanvasWidth;
                    tileCountX = Math.floor(canvas.width / gridSize);
                    tileCountY = Math.floor(canvas.height / gridSize);
                    if (isGameOver) {
                        clearCanvasAndDrawBackground(); drawSnake(); drawFood();
                    } else if (!gameRunning) {
                        drawInitialState();
                    }
                }
            }
        }, 250);
    });

    // Inizializza il gioco se db è disponibile
    if (db) {
        initializeGame();
    } else {
        console.warn("snake_game.js - DOMContentLoaded: Istanza DB non valida. Non inizializzo il gioco completo.");
        if (gameUIContainer) gameUIContainer.innerHTML = "<p style='color:red; text-align:center;'>Errore di connessione al database. Il gioco non può caricare la leaderboard o salvare i punteggi.</p>";
    }
}); // Fine DOMContentLoaded

