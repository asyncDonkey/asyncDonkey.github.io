// js/donkeyRunner.js
import { Animation } from './animation.js';
import { PowerUpItem, POWERUP_TYPE, POWERUP_DURATION, POWERUP_COLORS, POWERUP_TARGET_HEIGHT, POWERUP_TARGET_WIDTH } from './powerUps.js';
import * as AudioManager from './audioManager.js';
import { db, auth, generateBlockieAvatar } from './main.js'; 
import {
    collection, query, orderBy, limit, getDocs, serverTimestamp, where, // 'where' dovrebbe già esserci
    addDoc, doc, getDoc // <<< AGGIUNGI addDoc, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


const PALETTE = {
    DARK_BACKGROUND: '#411d31',      // Sfondo principale del gioco/menu
    MEDIUM_PURPLE: '#631b34',        // Per testi d'impatto come GAME OVER o accenti scuri
    DARK_TEAL_BLUE: '#32535f',       // Utile per sfondi di UI o elementi meno brillanti
    MEDIUM_TEAL: '#0b8a8f',          // Per bordi, linee, accenti secondari
    BRIGHT_TEAL: '#0eaf9b',          // Testo secondario o elementi brillanti
    BRIGHT_GREEN_TEAL: '#30e1b9',    // Testo primario, istruzioni, punteggi
};

// --- LEADERBOARD ELEMENT REF ---
const miniLeaderboardListEl = document.getElementById('miniLeaderboardList');
const MAX_LEADERBOARD_ENTRIES_MINI = 5;

// --- FUNZIONI LEADERBOARD ---

/** Formatta Firestore Timestamp per la leaderboard */
function formatScoreTimestamp(firebaseTimestamp) {
    if (!firebaseTimestamp || typeof firebaseTimestamp.toDate !== 'function') {
        return 'N/A'; // Data non disponibile o formato non valido
    }
    try {
        // Esempio: 10 Mag, 14:30
        return firebaseTimestamp.toDate().toLocaleString('it-IT', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    } catch (e) {
        console.error("Errore formattazione timestamp:", e);
        return 'Data errata';
    }
}

async function loadDonkeyLeaderboard() {
    if (!miniLeaderboardListEl) {
        console.warn("Elemento miniLeaderboardList non trovato.");
        return;
    }
    if (!db) {
        console.error("Istanza DB non disponibile per caricare la leaderboard di DonkeyRunner.");
        miniLeaderboardListEl.innerHTML = '<li>Errore connessione DB.</li>';
        return;
    }

    const leaderboardScoresCollection = collection(db, "leaderboardScores");
    miniLeaderboardListEl.innerHTML = '<li>Caricamento punteggi...</li>';

    try {
        // AGGIUNGI IL FILTRO "where" ALLA QUERY:
        const q = query(
            leaderboardScoresCollection,
            where("gameId", "==", "donkeyRunner"), // Filtra per Donkey Runner
            orderBy("score", "desc"),
            limit(MAX_LEADERBOARD_ENTRIES_MINI)
        );
        const querySnapshot = await getDocs(q);
        const fetchedLeaderboard = [];
        querySnapshot.forEach((doc) => {
            fetchedLeaderboard.push({ id: doc.id, ...doc.data() });
        });
        displayDonkeyLeaderboard(fetchedLeaderboard);
    } catch (error) {
        console.error("Errore caricamento DonkeyRunner leaderboard: ", error);
        if (error.code === 'failed-precondition') {
             miniLeaderboardListEl.innerHTML = '<li>Indice Firestore mancante. Controlla la console per il link per crearlo.</li>';
             console.error("Potrebbe essere necessario un indice composito in Firestore. L'errore originale è:", error.message);
        } else {
            if (miniLeaderboardListEl) miniLeaderboardListEl.innerHTML = '<li>Errore caricamento punteggi.</li>';
        }
    }
}

function displayDonkeyLeaderboard(leaderboardData) {
    if (!miniLeaderboardListEl) {
        console.warn("Elemento miniLeaderboardList non trovato.");
        return;
    }
    miniLeaderboardListEl.innerHTML = ''; // Pulisci la lista precedente

    if (!leaderboardData || leaderboardData.length === 0) {
        miniLeaderboardListEl.innerHTML = '<li>Nessun punteggio registrato.</li>';
        return;
    }

    leaderboardData.forEach((entry, index) => {
        const li = document.createElement('li');

        // 1. Rank
        const rankSpan = document.createElement('span');
        rankSpan.className = 'player-rank';
        rankSpan.textContent = `${index + 1}.`;
        li.appendChild(rankSpan);

        // 2. Avatar
        const avatarImg = document.createElement('img'); // Definizione di avatarImg
        avatarImg.className = 'player-avatar';
        
        // Usa 'initials' come fallback per il seed se userName non è presente (utile per anonimi)
        const seedForBlockie = entry.userId || entry.initials || entry.userName || `anon-${entry.id}`;
        let altTextForBlockie = entry.userName || entry.initials || 'Anon';
        
        // Utilizza size: 8 per coerenza con le altre sezioni
        avatarImg.src = generateBlockieAvatar(seedForBlockie, 30, { size: 8 }); 
        avatarImg.alt = `${altTextForBlockie}'s Avatar`;
        avatarImg.style.backgroundColor = 'transparent'; // Blockies ha il suo sfondo
        avatarImg.onerror = () => { 
            avatarImg.style.backgroundColor = '#ddd'; 
            avatarImg.alt = 'Avatar Error';
            // Fallback SVG semplice se l'avatar non si carica
            avatarImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' fill='%23ddd'/%3E%3Ctext x='5' y='7.5' font-size='5' text-anchor='middle' fill='%23777'%3E?%3C/text%3E%3C/svg%3E";
        };
        li.appendChild(avatarImg); // Aggiungi l'avatar al list item

        // 3. Player Info (Contenitore per Nome e Data)
        const playerInfoDiv = document.createElement('div');
        playerInfoDiv.className = 'player-info';

        // Nome del Giocatore
        const nameSpan = document.createElement('span');
        nameSpan.className = 'player-name';
        let displayName = entry.userName || entry.initials || 'Giocatore Anonimo'; // Usa initials come fallback
        if (!entry.userId) { // Se non c'è userId, è un ospite
            displayName += " (Ospite)"; 
        }
        nameSpan.textContent = displayName;
        
        // Data del Punteggio
        const dateSpan = document.createElement('span');
        dateSpan.className = 'player-date';
        dateSpan.textContent = formatScoreTimestamp(entry.timestamp);

        playerInfoDiv.appendChild(nameSpan);
        playerInfoDiv.appendChild(dateSpan);
        li.appendChild(playerInfoDiv); // Aggiungi il div con nome e data

        // 4. Punteggio
        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'player-score';
        scoreSpan.textContent = entry.score !== undefined ? entry.score : '-';
        li.appendChild(scoreSpan); // Aggiungi il punteggio

        // 5. Aggiungi l'intero list item (li) alla lista della leaderboard (ol)
        miniLeaderboardListEl.appendChild(li);
    });
}

console.log("Script donkeyRunner.js caricato.");

// --- IMPOSTAZIONI GLOBALI DI GIOCO ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 450;

const groundHeight = 70;
const gravity = 0.18;
let gameSpeed = 220;
const lineWidth = 2;
const GLOBAL_SPRITE_SCALE_FACTOR = 1.5;

// --- DOM ELEMENT REFERENCES ---
const gameContainer = document.getElementById('gameContainer');
const jumpButton = document.getElementById('jumpButton');
const shootButton = document.getElementById('shootButton');
const mobileControlsDiv = document.getElementById('mobileControls');
const fullscreenButton = document.getElementById('fullscreenButton');

// --- SCORE INPUT DOM REFS ---
const scoreInputContainerDonkey = document.getElementById('scoreInputContainerDonkey');
const playerInitialsDonkeyInput = document.getElementById('playerInitialsDonkey');
const saveScoreBtnDonkey = document.getElementById('saveScoreBtnDonkey'); // Assicurati che sia definito globalmente o accessibile qui

if (saveScoreBtnDonkey) {
    saveScoreBtnDonkey.addEventListener('click', function() { // Modificato per aggiungere un log qui
        console.log("EVENT LISTENER: Pulsante 'Salva Punteggio' CLICCATO!"); // NUOVO LOG
        handleSaveDonkeyScore(); // Chiama la tua funzione originale
    });
} else {
    // Questo log è importante se il pulsante non viene trovato all'avvio!
    console.error("CRITICO: Elemento DOM saveScoreBtnDonkey NON TROVATO durante l'aggiunta del listener!");
}
const restartGameBtnDonkey = document.getElementById('restartGameBtnDonkey'); // Pulsante di restart specifico

// --- TOUCH DEVICE DETECTION & CONTROLS VISIBILITY ---
const isTouchDevice = (('ontouchstart' in window) ||
                       (navigator.maxTouchPoints > 0) ||
                       (navigator.msMaxTouchPoints > 0));

if (isTouchDevice) {
    if (mobileControlsDiv) mobileControlsDiv.style.display = 'block';
    if (fullscreenButton) fullscreenButton.style.display = 'block';
    console.log("Dispositivo touch rilevato. Controlli mobile abilitati.");
} else {
    console.log("Non è un dispositivo touch. Controlli mobile nascosti.");
}

// --- IMPOSTAZIONI INDICATORE AVVERTIMENTO SPARO ---
const WARNING_EXCLAMATION_COLOR = 'red';
const WARNING_EXCLAMATION_FONT = 'bold 28px "Courier New", monospace';
const WARNING_EXCLAMATION_OFFSET_Y = -20;
const WARNING_DURATION = 0.4;

// --- PERCORSI E SPECIFICHE SPRITE ---
const PLAYER_SPRITESHEET_SRC = 'images/asyncDonkey_walk.png';
const PLAYER_ACTUAL_FRAME_WIDTH = 32; const PLAYER_ACTUAL_FRAME_HEIGHT = 32; const PLAYER_NUM_WALK_FRAMES = 5;
const PLAYER_TARGET_WIDTH = 60; const PLAYER_TARGET_HEIGHT = 60;

const PLAYER_PROJECTILE_SPRITE_SRC = 'images/bitProjectile.png';
const PLAYER_UPGRADED_PROJECTILE_SPRITE_SRC = 'images/playerUpgradedProjectile.png';
const PLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH = 24; const PLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT = 8;
const PLAYER_PROJECTILE_NUM_FRAMES = 4;
const PLAYER_PROJECTILE_ANIMATION_SPEED = 0.08;
const PLAYER_PROJECTILE_TARGET_WIDTH = PLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const PLAYER_PROJECTILE_TARGET_HEIGHT = PLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const PROJECTILE_VERTICAL_OFFSET = 15 * GLOBAL_SPRITE_SCALE_FACTOR;

const OBSTACLE_SPRITE_SRC = 'images/codeBlock.png';
const OBSTACLE_ACTUAL_FRAME_WIDTH = 32; const OBSTACLE_ACTUAL_FRAME_HEIGHT = 32; const OBSTACLE_NUM_FRAMES = 1;
const OBSTACLE_TARGET_WIDTH = OBSTACLE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const OBSTACLE_TARGET_HEIGHT = OBSTACLE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const OBSTACLE_HEALTH = 1;

const ENEMY_ONE_SPRITE_SRC = 'images/enemyOne.png';
const ENEMY_ONE_ACTUAL_FRAME_WIDTH = 48; const ENEMY_ONE_ACTUAL_FRAME_HEIGHT = 64; const ENEMY_ONE_NUM_FRAMES = 4;
const ENEMY_ONE_TARGET_WIDTH = ENEMY_ONE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_ONE_TARGET_HEIGHT = ENEMY_ONE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;

const ENEMY_TWO_SPRITE_SRC = 'images/enemyTwo.png';
const ENEMY_TWO_ACTUAL_FRAME_WIDTH = 40; const ENEMY_TWO_ACTUAL_FRAME_HEIGHT = 56; const ENEMY_TWO_NUM_FRAMES = 4;
const ENEMY_TWO_TARGET_WIDTH = ENEMY_TWO_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_TWO_TARGET_HEIGHT = ENEMY_TWO_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;

const ENEMY_THREE_BASE_SRC = 'images/enemyThree.png';
const ENEMY_THREE_DMG1_SRC = 'images/enemyThreeDmgOne.png';
const ENEMY_THREE_DMG2_SRC = 'images/enemyThreeDmgTwo.png';
const ENEMY_THREE_ACTUAL_FRAME_WIDTH = 56; const ENEMY_THREE_ACTUAL_FRAME_HEIGHT = 72; const ENEMY_THREE_NUM_FRAMES = 4;
const ENEMY_THREE_TARGET_WIDTH = ENEMY_THREE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_THREE_TARGET_HEIGHT = ENEMY_THREE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const ARMORED_ENEMY_HEALTH = 3;

const ENEMY_FOUR_IDLE_SRC = 'images/enemyFour.png';
const ENEMY_FOUR_ACTUAL_FRAME_WIDTH = 48; const ENEMY_FOUR_ACTUAL_FRAME_HEIGHT = 72;
const ENEMY_FOUR_IDLE_NUM_FRAMES = 4;
const ENEMY_FOUR_TARGET_WIDTH = ENEMY_FOUR_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_FOUR_TARGET_HEIGHT = ENEMY_FOUR_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const SHOOTING_ENEMY_SHOOT_INTERVAL = 2.5;
const SHOOTING_ENEMY_PROJECTILE_SOUND = 'enemy_shoot_light.mp3';

const ENEMY_FOUR_PROJECTILE_SPRITE_SRC = 'images/enemyFourProjectile.png';
const ENEMY_FOUR_PROJECTILE_ACTUAL_FRAME_WIDTH = 16; const ENEMY_FOUR_PROJECTILE_ACTUAL_FRAME_HEIGHT = 16; const ENEMY_FOUR_PROJECTILE_NUM_FRAMES = 4;
const ENEMY_FOUR_PROJECTILE_TARGET_WIDTH = ENEMY_FOUR_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_FOUR_PROJECTILE_TARGET_HEIGHT = ENEMY_FOUR_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;

const ENEMY_FIVE_SPRITE_SRC = 'images/enemyFive.png';
const ENEMY_FIVE_ACTUAL_FRAME_WIDTH = 32; const ENEMY_FIVE_ACTUAL_FRAME_HEIGHT = 32; const ENEMY_FIVE_NUM_FRAMES = 4;
const ENEMY_FIVE_TARGET_WIDTH = ENEMY_FIVE_ACTUAL_FRAME_WIDTH * 1.5;
const ENEMY_FIVE_TARGET_HEIGHT = ENEMY_FIVE_ACTUAL_FRAME_HEIGHT * 1.5;

const ENEMY_SIX_BASE_SRC = 'images/enemySix.png';
const ENEMY_SIX_DMG1_SRC = 'images/enemySixDmg1.png';
const ENEMY_SIX_DMG2_SRC = 'images/enemySixDmg2.png';
const ENEMY_SIX_DMG3_SRC = 'images/enemySixDmg3.png';
const ENEMY_SIX_ACTUAL_FRAME_WIDTH = 64; const ENEMY_SIX_ACTUAL_FRAME_HEIGHT = 80;
const ENEMY_SIX_IDLE_NUM_FRAMES = 4;
const ENEMY_SIX_TARGET_WIDTH = ENEMY_SIX_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_SIX_TARGET_HEIGHT = ENEMY_SIX_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const ARMORED_SHOOTING_ENEMY_HEALTH = 4;
const ARMORED_SHOOTING_ENEMY_SHOOT_INTERVAL = 3.0;
const ARMORED_SHOOTING_ENEMY_PROJECTILE_SOUND = 'enemy_shoot_heavy.mp3';

const ENEMY_SIX_PROJECTILE_SPRITE_SRC = 'images/enemySixProjectile.png';
const ENEMY_SIX_PROJECTILE_ACTUAL_FRAME_WIDTH = 20; const ENEMY_SIX_PROJECTILE_ACTUAL_FRAME_HEIGHT = 20;
const ENEMY_SIX_PROJECTILE_NUM_FRAMES = 4;
const ENEMY_SIX_PROJECTILE_TARGET_WIDTH = ENEMY_SIX_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_SIX_PROJECTILE_TARGET_HEIGHT = ENEMY_SIX_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;

const ENEMY_SEVEN_BASE_SRC = 'images/enemySeven.png';
const ENEMY_SEVEN_DMG1_SRC = 'images/enemySevenDmg1.png';
const ENEMY_SEVEN_ACTUAL_FRAME_WIDTH = 48; const ENEMY_SEVEN_ACTUAL_FRAME_HEIGHT = 64;
const ENEMY_SEVEN_NUM_FRAMES = 4;
const ENEMY_SEVEN_TARGET_WIDTH = ENEMY_SEVEN_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_SEVEN_TARGET_HEIGHT = ENEMY_SEVEN_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const TOUGH_BASIC_ENEMY_HEALTH = 2;

const DANGEROUS_FLYING_ENEMY_SRC = 'images/dangerousFlyingEnemy.png';
const DANGEROUS_FLYING_ENEMY_ACTUAL_FRAME_WIDTH = 40;
const DANGEROUS_FLYING_ENEMY_ACTUAL_FRAME_HEIGHT = 40;
const DANGEROUS_FLYING_ENEMY_NUM_FRAMES = 4;
const DANGEROUS_FLYING_ENEMY_TARGET_WIDTH = DANGEROUS_FLYING_ENEMY_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const DANGEROUS_FLYING_ENEMY_TARGET_HEIGHT = DANGEROUS_FLYING_ENEMY_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const DANGEROUS_FLYING_ENEMY_HEALTH = 1;

const GLITCHZILLA_BASE_SRC = 'images/glitchzilla_sprite.png';
const GLITCHZILLA_DMG1_SRC = 'images/glitchzillaDmg1.png';
const GLITCHZILLA_DMG2_SRC = 'images/glitchzillaDmg2.png';
const GLITCHZILLA_DMG3_SRC = 'images/glitchzillaDmg3.png';
const GLITCHZILLA_ACTUAL_FRAME_WIDTH = 96; const GLITCHZILLA_ACTUAL_FRAME_HEIGHT = 96;
const GLITCHZILLA_NUM_FRAMES = 4;
const GLITCHZILLA_TARGET_WIDTH = GLITCHZILLA_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR * 1.2;
const GLITCHZILLA_TARGET_HEIGHT = GLITCHZILLA_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR * 1.2;
const GLITCHZILLA_HEALTH = 30;
const GLITCHZILLA_SCORE_VALUE = 500;
const GLITCHZILLA_SPAWN_SCORE_THRESHOLD = 2500;

const GLITCHZILLA_PROJECTILE_SPRITE_SRC = 'images/glitchzillaProjectile.png';
const GLITCHZILLA_PROJECTILE_ACTUAL_FRAME_WIDTH = 24; const GLITCHZILLA_PROJECTILE_ACTUAL_FRAME_HEIGHT = 24;
const GLITCHZILLA_PROJECTILE_NUM_FRAMES = 4;
const GLITCHZILLA_PROJECTILE_TARGET_WIDTH = GLITCHZILLA_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const GLITCHZILLA_PROJECTILE_TARGET_HEIGHT = GLITCHZILLA_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;

const ENEMY_PROJECTILE_SPEED = 250;

const POWERUP_TRIPLE_SHOT_SRC = 'images/tripleShotPowerUp.png';
const POWERUP_SHIELD_SRC = 'images/shieldPowerUp.png';
const POWERUP_BOMB_SRC = 'images/bombPowerUp.png';
const POWERUP_DEBUG_MODE_SRC = 'images/powerUpDebugMode.png';
const POWERUP_FIREWALL_SRC = 'images/powerUpFirewall.png';
const POWERUP_BLOCK_BREAKER_SRC = 'images/powerUpBlockBreaker.png';

const ANIMATION_SPEED = 0.1;

const POWERUP_THEMATIC_NAMES = {
    [POWERUP_TYPE.TRIPLE_SHOT]: "Multi-Thread",
    [POWERUP_TYPE.SHIELD]: "Active Shield",
    [POWERUP_TYPE.SMART_BOMB]: "System Cleanup",
    [POWERUP_TYPE.DEBUG_MODE]: "Debug Payload",
    [POWERUP_TYPE.FIREWALL]: "Solid Firewall",
    [POWERUP_TYPE.BLOCK_BREAKER]: "Decompiler"
};

const soundsToLoad = [
    { name: 'shoot', path: 'audio/shoot.mp3' },
    { name: 'jump', path: 'audio/jump.mp3' },
    { name: 'playerHit', path: 'audio/player_hit.mp3' },
    { name: 'enemyHit', path: 'audio/enemy_hit.mp3' },
    { name: 'powerUpCollect', path: 'audio/powerup_collect.mp3' },
    { name: 'enemyExplode', path: 'audio/enemy_explode.mp3'},
    { name: 'blockBreak', path: 'audio/block_break.mp3'},
    { name: 'enemyShootLight', path: `audio/${SHOOTING_ENEMY_PROJECTILE_SOUND}` },
    { name: 'enemyShootHeavy', path: `audio/${ARMORED_SHOOTING_ENEMY_PROJECTILE_SOUND}` },
    { name: 'glitchzillaSpawn', path: 'audio/glitchzilla_spawn.mp3' },
    { name: 'glitchzillaAttack', path: 'audio/glitchzilla_attack.mp3' },
    { name: 'glitchzillaHit', path: 'audio/glitchzilla_hit.mp3' },
    { name: 'glitchzillaDefeat', path: 'audio/glitchzilla_defeat.mp3' },
];
const backgroundMusicPath = 'audio/background_music.mp3';

function setupRenderingContext(context) {
    context.imageSmoothingEnabled = false; context.mozImageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false; context.msImageSmoothingEnabled = false;
    console.log("Image smoothing disabilitato.");
}
setupRenderingContext(ctx);

const GAME_STATE = { MENU: 'MENU', PLAYING: 'PLAYING', GAME_OVER: 'GAME_OVER' };
let currentGameState = GAME_STATE.MENU;

let asyncDonkey = null;
const playerInitialX = 50;
const playerInitialY = canvas.height - groundHeight - PLAYER_TARGET_HEIGHT;

let images = {};
const imagesToLoad = [
    { name: 'player', src: PLAYER_SPRITESHEET_SRC },
    { name: 'playerProjectile', src: PLAYER_PROJECTILE_SPRITE_SRC },
    { name: 'playerUpgradedProjectile', src: PLAYER_UPGRADED_PROJECTILE_SPRITE_SRC },
    { name: 'obstacle', src: OBSTACLE_SPRITE_SRC },
    { name: 'enemyOne', src: ENEMY_ONE_SPRITE_SRC },
    { name: 'enemyTwo', src: ENEMY_TWO_SPRITE_SRC },
    { name: 'enemyThreeBase', src: ENEMY_THREE_BASE_SRC },
    { name: 'enemyThreeDmg1', src: ENEMY_THREE_DMG1_SRC },
    { name: 'enemyThreeDmg2', src: ENEMY_THREE_DMG2_SRC },
    { name: 'enemyFourIdle', src: ENEMY_FOUR_IDLE_SRC },
    { name: 'enemyFourProjectile', src: ENEMY_FOUR_PROJECTILE_SPRITE_SRC },
    { name: 'enemyFive', src: ENEMY_FIVE_SPRITE_SRC },
    { name: 'powerUpTripleShot', src: POWERUP_TRIPLE_SHOT_SRC },
    { name: 'powerUpShield', src: POWERUP_SHIELD_SRC },
    { name: 'powerUpBomb', src: POWERUP_BOMB_SRC },
    { name: 'powerUpDebugMode', src: POWERUP_DEBUG_MODE_SRC },
    { name: 'powerUpFirewall', src: POWERUP_FIREWALL_SRC },
    { name: 'powerUpBlockBreaker', src: POWERUP_BLOCK_BREAKER_SRC },
    { name: 'enemySixBase', src: ENEMY_SIX_BASE_SRC },
    { name: 'enemySixDmg1', src: ENEMY_SIX_DMG1_SRC },
    { name: 'enemySixDmg2', src: ENEMY_SIX_DMG2_SRC },
    { name: 'enemySixDmg3', src: ENEMY_SIX_DMG3_SRC },
    { name: 'enemySixProjectile', src: ENEMY_SIX_PROJECTILE_SPRITE_SRC },
    { name: 'enemySevenBase', src: ENEMY_SEVEN_BASE_SRC },
    { name: 'enemySevenDmg1', src: ENEMY_SEVEN_DMG1_SRC },
    { name: 'dangerousFlyingEnemy', src: DANGEROUS_FLYING_ENEMY_SRC },
    { name: 'glitchzillaBase', src: GLITCHZILLA_BASE_SRC },
    { name: 'glitchzillaDmg1', src: GLITCHZILLA_DMG1_SRC },
    { name: 'glitchzillaDmg2', src: GLITCHZILLA_DMG2_SRC },
    { name: 'glitchzillaDmg3', src: GLITCHZILLA_DMG3_SRC },
    { name: 'glitchzillaProjectile', src: GLITCHZILLA_PROJECTILE_SPRITE_SRC },
];
let imagesLoadedCount = 0; let allImagesLoaded = false; let resourcesInitialized = false; let gameLoopRequestId = null;

let obstacles = []; let obstacleSpawnTimer = 0; let nextObstacleSpawnTime = 0; const obstacleSpawnColor = '#0f0';
let projectiles = []; let canShoot = true;
let shootTimer = 0; // << DECLARED ONCE GLOBALLY
const projectileSpeed = 400; const shootCooldownTime = 0.3; const projectileColor = '#0ff';
let enemies = []; let enemyBaseSpawnTimer = 0; let nextEnemyBaseSpawnTime = 0; const enemyBaseSpawnColor = '#0f0';
let flyingEnemies = []; let flyingEnemySpawnTimer = 0; let nextFlyingEnemySpawnTime = 0; const flyingEnemyScoreValue = 100; const flyingEnemySpawnColor = '#ff0';
const POWER_UP_DROP_CHANCE_FROM_FLYING_ENEMY = 0.35;

let fastEnemies = []; let fastEnemySpawnTimer = 0; let nextFastEnemySpawnTime = 0; const fastEnemySpeedMultiplier = 1.5; const fastEnemySpawnColor = '#FFA500';
let armoredEnemies = []; let armoredEnemySpawnTimer = 0; let nextArmoredEnemySpawnTime = 0; const armoredEnemySpeedMultiplier = 0.7; const armoredEnemySpawnColor = '#A9A9A9';
let shootingEnemies = []; let shootingEnemySpawnTimer = 0; let nextShootingEnemySpawnTime = 0; const shootingEnemySpawnColor = '#FF69B4';
let enemyProjectiles = [];

let armoredShootingEnemies = []; let armoredShootingEnemySpawnTimer = 0; let nextArmoredShootingEnemySpawnTime = 0; const armoredShootingEnemySpawnColor = '#D2691E';
let toughBasicEnemies = []; let toughBasicEnemySpawnTimer = 0; let nextToughBasicEnemySpawnTime = 0; const toughBasicEnemySpawnColor = '#2E8B57';
let dangerousFlyingEnemies = []; let dangerousFlyingEnemySpawnTimer = 0; let nextDangerousFlyingEnemySpawnTime = 0; const dangerousFlyingEnemySpawnColor = '#DC143C';

let activeMiniboss = null;
let hasGlitchzillaSpawnedThisGame = false;

let powerUpItems = [];
let powerUpSpawnTimer = 0;
let nextPowerUpSpawnTime = 0;

const SCORE_THRESHOLD_FAST_ENEMY = 200;
const SCORE_THRESHOLD_ARMORED_ENEMY = 450;
const SCORE_THRESHOLD_SHOOTING_ENEMY = 700;
const SCORE_THRESHOLD_ARMORED_SHOOTING_ENEMY = 1000;
const SCORE_THRESHOLD_TOUGH_BASIC_ENEMY = 150;
const SCORE_THRESHOLD_DANGEROUS_FLYING_ENEMY = 800;

let score = 0; let finalScore = 0; let gameOverTrigger = false;

// Timestamp for game loop
let lastTime = 0; // << DECLARED ONCE GLOBALLY


function loadImage(name, src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        images[name] = img;
        img.onload = () => {
            imagesLoadedCount++;
            if (img.naturalWidth === 0) {
                // console.error(`ERRORE CARICAMENTO EFFETTIVO: ${name} da ${src} - naturalWidth è 0.`);
            }
            if (imagesLoadedCount === imagesToLoad.length) {
                allImagesLoaded = true;
            }
            resolve(img);
        };
        img.onerror = () => {
            imagesLoadedCount++;
            console.error(`ERRORE NETWORK/DECODIFICA: ${name} da ${src}`);
            images[name] = null;
             if (imagesLoadedCount === imagesToLoad.length) {
                allImagesLoaded = true;
            }
            resolve(null);
        };
        img.src = src;
    });
}

async function loadAllAssets() {
    console.log("Carico assets...");
    const imagePromises = imagesToLoad.map(d => loadImage(d.name, d.src));
    const soundPromises = soundsToLoad.map(s => AudioManager.loadSound(s.name, s.path));
    const backgroundMusicPromise = AudioManager.loadBackgroundMusic(backgroundMusicPath);
    await Promise.allSettled([...imagePromises, ...soundPromises, backgroundMusicPromise]);
    console.log("Processo di caricamento assets completato.");
    if(allImagesLoaded) console.log("TUTTE le immagini dichiarate sono state processate.");
    else console.warn("Attenzione: Alcune immagini potrebbero non essersi processate.");
    
    resourcesInitialized = true;
    
    // Carica la leaderboard una volta che le risorse sono pronte e prima di avviare il game loop del menu
    if (db) { // Controlla se db è stato importato e inizializzato correttamente
        loadDonkeyLeaderboard(); // <<< CHIAMATA ALLA LEADERBOARD
    } else {
        console.error("DB non pronto, impossibile caricare la leaderboard per DonkeyRunner.");
        if (miniLeaderboardListEl) miniLeaderboardListEl.innerHTML = '<li>Classifica non disponibile (DB error).</li>';
    }

    if (gameLoopRequestId === null && currentGameState === GAME_STATE.MENU) {
        startGameLoop();
    }
}

class Player {
    constructor(x, y, dw, dh) {
        this.x = x; this.y = y; this.displayWidth = dw; this.displayHeight = dh;
        this.velocityY = 0; this.onGround = true;
        const pXRatio = 20 / 120;
        const pYRatio = 10 / 120;
        const pX = this.displayWidth * pXRatio;
        const pY = this.displayHeight * pYRatio;
        this.colliderWidth = this.displayWidth - pX; this.colliderHeight = this.displayHeight - pY;
        this.colliderOffsetX = pX / 2; this.colliderOffsetY = pY / 2;
        this.sprite = images['player'];
        this.walkAnimation = null;
        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
            this.walkAnimation = new Animation(this.sprite, PLAYER_ACTUAL_FRAME_WIDTH, PLAYER_ACTUAL_FRAME_HEIGHT, PLAYER_NUM_WALK_FRAMES);
        } else { console.error("Sprite del Player non caricato o rotto! Animazione non creata."); }

        this.activePowerUp = null;
        this.powerUpTimer = 0;
        this.isShieldActive = false;
        this.isFirewallActive = false;
        this.isBlockBreakerActive = false;
    }

    draw() {
        if (this.isFirewallActive) {
            ctx.save();
            ctx.strokeStyle = POWERUP_COLORS.FIREWALL;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.2;
            const auraPadding = 5;
            ctx.strokeRect(
                this.x - auraPadding,
                this.y - auraPadding,
                this.displayWidth + auraPadding * 2,
                this.displayHeight + auraPadding * 2
            );
            ctx.restore();
        }

        if (this.isShieldActive) {
            ctx.beginPath();
            ctx.arc(this.x + this.displayWidth / 2, this.y + this.displayHeight / 2, this.displayWidth / 1.8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 255, 255, 0.3)'; ctx.fill();
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)'; ctx.lineWidth = 3; ctx.stroke();
        }

        const spriteUsable = this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0;
        if (this.walkAnimation && spriteUsable) {
            const f = this.walkAnimation.getFrame();
            try { ctx.drawImage(this.sprite, f.sx, f.sy, PLAYER_ACTUAL_FRAME_WIDTH, PLAYER_ACTUAL_FRAME_HEIGHT, this.x, this.y, this.displayWidth, this.displayHeight); }
            catch (e) { this.drawFallback("Err draw P"); }
        } else { this.drawFallback(spriteUsable ? "P anim non presente" : "P sprite !complete/broken"); }
    }

    drawFallback() { ctx.fillStyle = 'orange'; ctx.fillRect(this.x, this.y, this.displayWidth, this.displayHeight); }
    applyGravity() { this.velocityY += gravity; this.y += this.velocityY; }

    update(dt) {
        this.applyGravity();
        // MODIFICA: Cambiato > in >= per includere l'atterraggio esatto
        if (this.y + this.displayHeight >= canvas.height - groundHeight) { 
            this.y = canvas.height - groundHeight - this.displayHeight; // Posiziona sulla linea di terra
            this.velocityY = 0; // Ferma la caduta
            this.onGround = true; // Ora è correttamente a terra
        } else {
            this.onGround = false; // È in aria
        }
        if (this.walkAnimation && this.onGround) this.walkAnimation.update(dt);

        if (this.activePowerUp) {
            this.powerUpTimer -= dt;
            if (this.powerUpTimer <= 0) { this.deactivatePowerUp(); }
        }
    }

    jump() { if (this.onGround) { this.velocityY = -9.5; this.onGround = false; AudioManager.playSound('jump'); } }

    shoot() {
        if (canShoot) {
            const projectileYBase = this.y + this.displayHeight / 2 - PLAYER_PROJECTILE_TARGET_HEIGHT / 2;
            const isDebugMode = this.activePowerUp === POWERUP_TYPE.DEBUG_MODE;

            if (this.activePowerUp === POWERUP_TYPE.TRIPLE_SHOT) {
                projectiles.push(new Projectile(this.x + this.displayWidth, projectileYBase - PROJECTILE_VERTICAL_OFFSET, isDebugMode));
                projectiles.push(new Projectile(this.x + this.displayWidth, projectileYBase, isDebugMode));
                projectiles.push(new Projectile(this.x + this.displayWidth, projectileYBase + PROJECTILE_VERTICAL_OFFSET, isDebugMode));
            } else {
                projectiles.push(new Projectile(this.x + this.displayWidth, projectileYBase, isDebugMode));
            }
            AudioManager.playSound('shoot', false, 0.8);
            canShoot = false;
            shootTimer = 0; // Assign to existing global variable
        }
    }

    activatePowerUp(type) {
        const exclusiveTypes = [POWERUP_TYPE.DEBUG_MODE, POWERUP_TYPE.TRIPLE_SHOT, POWERUP_TYPE.BLOCK_BREAKER];
        if (exclusiveTypes.includes(this.activePowerUp) && exclusiveTypes.includes(type) && this.activePowerUp !== type) {
            this.deactivatePowerUp();
        } else if (this.activePowerUp && this.activePowerUp !== type) {
             if (exclusiveTypes.includes(type) ||
                 (this.activePowerUp === POWERUP_TYPE.SHIELD && type !== POWERUP_TYPE.SHIELD) ||
                 (this.activePowerUp === POWERUP_TYPE.FIREWALL && type !== POWERUP_TYPE.FIREWALL)
             ) {
                this.deactivatePowerUp();
             }
        }

        this.activePowerUp = type;
        switch (type) {
            case POWERUP_TYPE.TRIPLE_SHOT:
                this.powerUpTimer = POWERUP_DURATION.TRIPLE_SHOT;
                this.isBlockBreakerActive = false;
                console.log("Triple Shot ATTIVATO!");
                break;
            case POWERUP_TYPE.SHIELD:
                this.powerUpTimer = POWERUP_DURATION.SHIELD;
                this.isShieldActive = true;
                console.log("Scudo ATTIVATO!");
                break;
            case POWERUP_TYPE.SMART_BOMB:
                this.activateSmartBomb();
                break;
            case POWERUP_TYPE.DEBUG_MODE:
                this.powerUpTimer = POWERUP_DURATION.DEBUG_MODE;
                this.isBlockBreakerActive = false;
                console.log("Debug Mode (Proiettili Potenziati) ATTIVATO!");
                break;
            case POWERUP_TYPE.FIREWALL:
                this.powerUpTimer = POWERUP_DURATION.FIREWALL;
                this.isFirewallActive = true;
                console.log("Firewall (Immunità Ostacoli) ATTIVATO!");
                break;
            case POWERUP_TYPE.BLOCK_BREAKER:
                this.powerUpTimer = POWERUP_DURATION.BLOCK_BREAKER;
                this.isBlockBreakerActive = true;
                console.log("Block Breaker ATTIVATO!");
                break;
        }
        if (type !== POWERUP_TYPE.SMART_BOMB) {
            AudioManager.playSound('powerUpCollect');
        }
    }

    deactivatePowerUp() {
        console.log(`Power-up ${this.activePowerUp} DISATTIVATO.`);
        if (this.activePowerUp === POWERUP_TYPE.SHIELD) { this.isShieldActive = false; }
        if (this.activePowerUp === POWERUP_TYPE.FIREWALL) { this.isFirewallActive = false; }
        if (this.activePowerUp === POWERUP_TYPE.BLOCK_BREAKER) { this.isBlockBreakerActive = false; }

        this.activePowerUp = null;
        this.powerUpTimer = 0;
    }

    activateSmartBomb() {
        console.log("BOMBA Intelligente ATTIVATA!");
        let enemiesCleared = 0;
        const allEnemyLists = [enemies, fastEnemies, armoredEnemies, shootingEnemies, flyingEnemies, armoredShootingEnemies, toughBasicEnemies, dangerousFlyingEnemies];
        allEnemyLists.forEach(enemyList => { for (let i = enemyList.length - 1; i >= 0; i--) { enemyList.splice(i, 1); score += 15; enemiesCleared++; } });
        if(activeMiniboss){
            activeMiniboss.takeDamage(5);
            console.log("Smart Bomb ha danneggiato Glitchzilla!");
        }

        let obstaclesCleared = 0;
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles.splice(i, 1);
            score += 5;
            obstaclesCleared++;
        }

        if (enemiesCleared > 0 || obstaclesCleared > 0) {
            AudioManager.playSound('enemyExplode', false, 0.9);
        }
        if (enemiesCleared > 0) console.log(`${enemiesCleared} nemici distrutti dalla bomba!`);
        if (obstaclesCleared > 0) console.log(`${obstaclesCleared} ostacoli distrutti dalla bomba!`);

        this.activePowerUp = null;
        this.powerUpTimer = 0;
    }
}

class Obstacle {
    constructor(x,y) {
        this.x=x; this.y=y;
        this.width=OBSTACLE_TARGET_WIDTH; this.height=OBSTACLE_TARGET_HEIGHT;
        this.sprite=images['obstacle'];
        this.animation = null;
        this.health = OBSTACLE_HEALTH;
        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
            if (OBSTACLE_NUM_FRAMES > 1) {
                 this.animation = new Animation(this.sprite,OBSTACLE_ACTUAL_FRAME_WIDTH,OBSTACLE_ACTUAL_FRAME_HEIGHT,OBSTACLE_NUM_FRAMES);
            }
        } else { console.warn(`Sprite ostacolo non caricato o rotto. Sprite: ${this.sprite}`); }
    }
    update(dt){ this.x -= gameSpeed*dt; if(this.animation) this.animation.update(dt); }
    draw(){
        const spriteUsable = this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0;
        if(this.animation && spriteUsable){
            const f = this.animation.getFrame();
            ctx.drawImage(this.sprite,f.sx,f.sy,OBSTACLE_ACTUAL_FRAME_WIDTH,OBSTACLE_ACTUAL_FRAME_HEIGHT,this.x,this.y,this.width,this.height);
        } else if (spriteUsable) {
             ctx.drawImage(this.sprite, 0, 0, OBSTACLE_ACTUAL_FRAME_WIDTH, OBSTACLE_ACTUAL_FRAME_HEIGHT, this.x,this.y,this.width,this.height);
        } else {
            ctx.strokeStyle=obstacleSpawnColor; ctx.lineWidth=lineWidth;
            ctx.strokeRect(this.x,this.y,this.width,this.height);
        }
    }
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            AudioManager.playSound('blockBreak');
            return true;
        }
        return false;
    }
}

class Projectile {
    constructor(x, y, isUpgraded = false) {
        this.x = x; this.y = y;
        this.width = PLAYER_PROJECTILE_TARGET_WIDTH;
        this.height = PLAYER_PROJECTILE_TARGET_HEIGHT;
        this.speed = projectileSpeed;
        this.isUpgraded = isUpgraded;
        this.damage = this.isUpgraded ? 2 : 1;

        this.sprite = this.isUpgraded ? images['playerUpgradedProjectile'] : images['playerProjectile'];
        this.animation = null;

        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0 && PLAYER_PROJECTILE_NUM_FRAMES > 1) {
            this.animation = new Animation(this.sprite, PLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH, PLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT, PLAYER_PROJECTILE_NUM_FRAMES, PLAYER_PROJECTILE_ANIMATION_SPEED);
        } else if (this.sprite) {
            // console.warn(`Sprite proiettile (${this.isUpgraded ? 'potenziato':'normale'}) non animabile.`);
        } else {
            // console.warn(`Sprite proiettile (${this.isUpgraded ? 'potenziato':'normale'}) non trovato.`);
        }
    }
    update(dt) { this.x += this.speed * dt; if (this.animation) { this.animation.update(dt); } }
    draw() {
        const spriteUsable = this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0;
        if (this.animation && spriteUsable) {
            const frame = this.animation.getFrame();
            ctx.drawImage(this.sprite, frame.sx, frame.sy, PLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH, PLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT, this.x, this.y, this.width, this.height);
        } else if (spriteUsable) {
            ctx.drawImage(this.sprite, 0, 0, PLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH, PLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = this.isUpgraded ? POWERUP_COLORS.DEBUG_MODE : projectileColor;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

class BaseEnemy{
    constructor(x,y,targetW,targetH,spriteNameKey,frameW,frameH,numFrames,speedMult,hp=1,fallbackColor='#ccc', scoreValue = 25){
        this.x=x;this.y=y;this.width=targetW;this.height=targetH;
        this.speed=gameSpeed*speedMult;this.health=hp;this.maxHealth=hp;
        this.baseSpriteName = spriteNameKey;
        this.sprite=images[spriteNameKey];
        this.fallbackColor=fallbackColor;
        this.animation=null;
        this.numFrames = numFrames;
        this.frameWidth = frameW;
        this.frameHeight = frameH;
        this.scoreValue = scoreValue;
        this.animations = {};
        this.isWarning = false;
        this.warningTimer = 0;

        this.loadAnimation(this.baseSpriteName, frameW, frameH, numFrames, 'base');
    }

    loadAnimation(spriteNameKeyToLoad, frameW, frameH, numFramesAnim, animationKey) {
        const spriteInstance = images[spriteNameKeyToLoad];
        if(spriteInstance && spriteInstance.complete && spriteInstance.naturalWidth > 0 && numFramesAnim > 0){
            this.animations[animationKey] = new Animation(spriteInstance, frameW, frameH, numFramesAnim);
            if (animationKey === 'base') {
                this.animation = this.animations.base;
                this.sprite = spriteInstance;
            }
        } else {
            console.warn(`BaseEnemy.loadAnimation FALLITO per sprite key '${spriteNameKeyToLoad}' (anim key: ${animationKey}).`);
            this.animations[animationKey] = null;
            if (animationKey === 'base') {
                this.animation = null;
            }
        }
    }


    update(dt){this.x-=this.speed*dt;if(this.animation)this.animation.update(dt);}

    draw(){
        let currentAnimToDraw = this.animation;
        let spriteToUse = currentAnimToDraw ? currentAnimToDraw.spritesheet : this.sprite;
        let actualFrameW = currentAnimToDraw ? currentAnimToDraw.frameWidth : this.frameWidth;
        let actualFrameH = currentAnimToDraw ? currentAnimToDraw.frameHeight : this.frameHeight;

        const spriteUsable = spriteToUse && spriteToUse.complete && spriteToUse.naturalWidth > 0;

        if(currentAnimToDraw && spriteUsable){
            const f=currentAnimToDraw.getFrame();
            ctx.drawImage(spriteToUse,f.sx,f.sy,f.sWidth,f.sHeight,this.x,this.y,this.width,this.height);
        } else if (spriteUsable && !currentAnimToDraw) {
            ctx.drawImage(spriteToUse, 0, 0, actualFrameW, actualFrameH, this.x,this.y,this.width,this.height);
        } else {
            ctx.strokeStyle=this.fallbackColor;ctx.lineWidth=lineWidth;ctx.strokeRect(this.x,this.y,this.width,this.height);
        }

        if (this.isWarning) {
            ctx.fillStyle = WARNING_EXCLAMATION_COLOR;
            ctx.font = WARNING_EXCLAMATION_FONT;
            ctx.textAlign = 'center';
            ctx.fillText('!', this.x + this.width / 2, this.y + WARNING_EXCLAMATION_OFFSET_Y);
        }
        
        if(this.maxHealth>1&&this.health>0&&this.health<this.maxHealth){const hbW=this.width*.8,hbH=5,hbX=this.x+(this.width-hbW)/2,hbY=this.y-hbH-3;ctx.fillStyle='rgba(100,100,100,0.7)';ctx.fillRect(hbX,hbY,hbW,hbH);ctx.fillStyle='rgba(0,255,0,0.7)';ctx.fillRect(hbX,hbY,hbW*(this.health/this.maxHealth),hbH);}
    }
    takeDamage(dmg=1){
        this.health-=dmg;
        if(this.health < 0) this.health = 0;
    }
}

class ArmoredEnemy extends BaseEnemy{
    constructor(x,y){
        super(x,y,ENEMY_THREE_TARGET_WIDTH,ENEMY_THREE_TARGET_HEIGHT,'enemyThreeBase',ENEMY_THREE_ACTUAL_FRAME_WIDTH,ENEMY_THREE_ACTUAL_FRAME_HEIGHT,ENEMY_THREE_NUM_FRAMES,armoredEnemySpeedMultiplier,ARMORED_ENEMY_HEALTH,armoredEnemySpawnColor, 50);
        this.loadAnimation('enemyThreeDmg1', ENEMY_THREE_ACTUAL_FRAME_WIDTH, ENEMY_THREE_ACTUAL_FRAME_HEIGHT, ENEMY_THREE_NUM_FRAMES, '2');
        this.loadAnimation('enemyThreeDmg2', ENEMY_THREE_ACTUAL_FRAME_WIDTH, ENEMY_THREE_ACTUAL_FRAME_HEIGHT, ENEMY_THREE_NUM_FRAMES, '1');
        this.updateCurrentAnimation();
    }

    updateCurrentAnimation() {
        const healthKey = String(Math.max(1, this.health));
        this.animation = this.animations[healthKey] || this.animations['base'];
        if (this.animation && this.animation.reset) this.animation.reset();
    }

    takeDamage(dmg=1){
        super.takeDamage(dmg);
        this.updateCurrentAnimation();
    }
}

class ShootingEnemy extends BaseEnemy {
    constructor(x, y) {
        super(x, y, ENEMY_FOUR_TARGET_WIDTH, ENEMY_FOUR_TARGET_HEIGHT, 'enemyFourIdle', ENEMY_FOUR_ACTUAL_FRAME_WIDTH, ENEMY_FOUR_ACTUAL_FRAME_HEIGHT, ENEMY_FOUR_IDLE_NUM_FRAMES, 0.5, 1, shootingEnemySpawnColor, 40);
        this.shootTimer = Math.random() * SHOOTING_ENEMY_SHOOT_INTERVAL + 1.5; // Note: `shootTimer` for enemy logic, not player's global one

        this.projectileSpriteName = 'enemyFourProjectile';
        this.projectileFrameWidth = ENEMY_FOUR_PROJECTILE_ACTUAL_FRAME_WIDTH;
        this.projectileFrameHeight = ENEMY_FOUR_PROJECTILE_ACTUAL_FRAME_HEIGHT;
        this.projectileNumFrames = ENEMY_FOUR_PROJECTILE_NUM_FRAMES;
        this.projectileTargetWidth = ENEMY_FOUR_PROJECTILE_TARGET_WIDTH;
        this.projectileTargetHeight = ENEMY_FOUR_PROJECTILE_TARGET_HEIGHT;
    }

    update(dt) {
        super.update(dt); 

        if (this.isWarning) {
            this.warningTimer += dt;
            if (this.warningTimer >= WARNING_DURATION) {
                this.isWarning = false;
                this.warningTimer = 0;
                enemyProjectiles.push(new EnemyProjectile(
                    this.x - this.projectileTargetWidth,
                    this.y + this.height / 2 - this.projectileTargetHeight / 2, 
                    this.projectileSpriteName,
                    this.projectileFrameWidth, this.projectileFrameHeight, this.projectileNumFrames,
                    this.projectileTargetWidth, this.projectileTargetHeight
                ));
                AudioManager.playSound('enemyShootLight');
                this.shootTimer = 0; 
            }
        } else {
            this.shootTimer += dt;
            if (this.shootTimer >= SHOOTING_ENEMY_SHOOT_INTERVAL) {
                this.isWarning = true; 
                this.warningTimer = 0;
            }
        }
    }
}

class EnemyProjectile{
    constructor(x,y, spriteNameKey, frameW, frameH, numFrames, targetW, targetH, speed = ENEMY_PROJECTILE_SPEED){
        this.x=x;this.y=y;
        this.width=targetW; this.height=targetH;
        this.speed=speed;
        this.sprite=images[spriteNameKey];
        this.animation=null;
        if(this.sprite&&this.sprite.complete&&this.sprite.naturalWidth>0&&numFrames>1){
            this.animation=new Animation(this.sprite,frameW,frameH,numFrames, 0.1);
        }else if(this.sprite) {
            // console.warn(`Sprite proiettile nemico '${spriteNameKey}' non animabile.`);
        } else {
            // console.warn(`Sprite proiettile nemico '${spriteNameKey}' non trovato.`);
        }
    }
    update(dt){this.x-=this.speed*dt;if(this.animation)this.animation.update(dt);}
    draw(){
        const spriteUsable=this.sprite&&this.sprite.complete&&this.sprite.naturalWidth>0;
        if(this.animation&&spriteUsable){
            const f=this.animation.getFrame();
            ctx.drawImage(this.sprite,f.sx,f.sy,f.sWidth,f.sHeight,this.x,this.y,this.width,this.height);
        }else if(spriteUsable){
            const sourceFrameW = this.animation ? this.animation.frameWidth : (this.sprite.naturalWidth / (this.animation && this.animation.numFrames > 0 ? this.animation.numFrames : 1));
            const sourceFrameH = this.animation ? this.animation.frameHeight : this.sprite.naturalHeight;
            ctx.drawImage(this.sprite,0,0,sourceFrameW, sourceFrameH, this.x,this.y,this.width,this.height);
        }else{
            ctx.fillStyle='#F0F';
            ctx.fillRect(this.x,this.y,this.width,this.height);
        }
    }
}
class FlyingEnemy extends BaseEnemy{constructor(x,y){super(x,y,ENEMY_FIVE_TARGET_WIDTH,ENEMY_FIVE_TARGET_HEIGHT,'enemyFive',ENEMY_FIVE_ACTUAL_FRAME_WIDTH,ENEMY_FIVE_ACTUAL_FRAME_HEIGHT,ENEMY_FIVE_NUM_FRAMES,(0.6+Math.random()*0.3),1,flyingEnemySpawnColor, flyingEnemyScoreValue);this.initialY=y;this.angle=Math.random()*Math.PI*2;this.amplitude=20+Math.random()*20;this.frequency=0.02+Math.random()*0.03;}update(dt){super.update(dt);this.angle+=this.frequency;this.y=this.initialY+Math.sin(this.angle)*this.amplitude;}}

class ArmoredShootingEnemy extends BaseEnemy {
    constructor(x, y) {
        super(x, y, ENEMY_SIX_TARGET_WIDTH, ENEMY_SIX_TARGET_HEIGHT, 'enemySixBase', ENEMY_SIX_ACTUAL_FRAME_WIDTH, ENEMY_SIX_ACTUAL_FRAME_HEIGHT, ENEMY_SIX_IDLE_NUM_FRAMES, 0.4, ARMORED_SHOOTING_ENEMY_HEALTH, armoredShootingEnemySpawnColor, 60);
        this.shootTimer = Math.random() * ARMORED_SHOOTING_ENEMY_SHOOT_INTERVAL + 2.0; // Enemy's own shootTimer

        this.loadAnimation('enemySixDmg1', ENEMY_SIX_ACTUAL_FRAME_WIDTH, ENEMY_SIX_ACTUAL_FRAME_HEIGHT, ENEMY_SIX_IDLE_NUM_FRAMES, 'dmg1');
        this.loadAnimation('enemySixDmg2', ENEMY_SIX_ACTUAL_FRAME_WIDTH, ENEMY_SIX_ACTUAL_FRAME_HEIGHT, ENEMY_SIX_IDLE_NUM_FRAMES, 'dmg2');
        this.loadAnimation('enemySixDmg3', ENEMY_SIX_ACTUAL_FRAME_WIDTH, ENEMY_SIX_ACTUAL_FRAME_HEIGHT, ENEMY_SIX_IDLE_NUM_FRAMES, 'dmg3');
        this.updateCurrentAnimation();

        this.projectileSpriteName = 'enemySixProjectile';
        this.projectileFrameWidth = ENEMY_SIX_PROJECTILE_ACTUAL_FRAME_WIDTH;
        this.projectileFrameHeight = ENEMY_SIX_PROJECTILE_ACTUAL_FRAME_HEIGHT;
        this.projectileNumFrames = ENEMY_SIX_PROJECTILE_NUM_FRAMES;
        this.projectileTargetWidth = ENEMY_SIX_PROJECTILE_TARGET_WIDTH;
        this.projectileTargetHeight = ENEMY_SIX_PROJECTILE_TARGET_HEIGHT;
    }

    updateCurrentAnimation() {
        let animKey;
        if (this.health === 4) animKey = 'base';
        else if (this.health === 3) animKey = 'dmg1';
        else if (this.health === 2) animKey = 'dmg2';
        else if (this.health === 1) animKey = 'dmg3';
        else animKey = 'base';
        this.animation = this.animations[animKey] || this.animations['base'];
        if (this.animation && this.animation.reset) this.animation.reset();
    }

    takeDamage(dmg = 1) {
        super.takeDamage(dmg);
        this.updateCurrentAnimation();
    }

    update(dt) {
        super.update(dt); 

        if (this.isWarning) {
            this.warningTimer += dt;
            if (this.warningTimer >= WARNING_DURATION) {
                this.isWarning = false;
                this.warningTimer = 0;
                const projectileY = this.y + this.height - this.projectileTargetHeight - 5; 
                enemyProjectiles.push(new EnemyProjectile(
                    this.x - this.projectileTargetWidth,
                    projectileY,
                    this.projectileSpriteName,
                    this.projectileFrameWidth, this.projectileFrameHeight, this.projectileNumFrames,
                    this.projectileTargetWidth, this.projectileTargetHeight
                ));
                AudioManager.playSound('enemyShootHeavy');
                this.shootTimer = 0;
            }
        } else {
            this.shootTimer += dt;
            if (this.shootTimer >= ARMORED_SHOOTING_ENEMY_SHOOT_INTERVAL) {
                this.isWarning = true;
                this.warningTimer = 0;
            }
        }
    }
}

class ToughBasicEnemy extends BaseEnemy {
    constructor(x, y) {
        super(x, y, ENEMY_SEVEN_TARGET_WIDTH, ENEMY_SEVEN_TARGET_HEIGHT, 'enemySevenBase', ENEMY_SEVEN_ACTUAL_FRAME_WIDTH, ENEMY_SEVEN_ACTUAL_FRAME_HEIGHT, ENEMY_SEVEN_NUM_FRAMES, 0.6, TOUGH_BASIC_ENEMY_HEALTH, toughBasicEnemySpawnColor, 30);
        this.loadAnimation('enemySevenDmg1', ENEMY_SEVEN_ACTUAL_FRAME_WIDTH, ENEMY_SEVEN_ACTUAL_FRAME_HEIGHT, ENEMY_SEVEN_NUM_FRAMES, 'dmg1');
        this.updateCurrentAnimation();
    }

    updateCurrentAnimation() {
        let animKey = this.health === 2 ? 'base' : (this.health === 1 ? 'dmg1' : 'base');
        this.animation = this.animations[animKey] || this.animations['base'];
        if (this.animation && this.animation.reset) this.animation.reset();
    }

    takeDamage(dmg = 1) {
        super.takeDamage(dmg);
        this.updateCurrentAnimation();
    }
}

class DangerousFlyingEnemy extends FlyingEnemy {
    constructor(x, y) {
        super(x, y);
        this.baseSpriteName = 'dangerousFlyingEnemy';
        this.sprite = images[this.baseSpriteName];
        this.width = DANGEROUS_FLYING_ENEMY_TARGET_WIDTH;
        this.height = DANGEROUS_FLYING_ENEMY_TARGET_HEIGHT;
        this.health = DANGEROUS_FLYING_ENEMY_HEALTH;
        this.scoreValue = 150;
        this.fallbackColor = dangerousFlyingEnemySpawnColor;

        this.animations = {};
        this.loadAnimation(this.baseSpriteName, DANGEROUS_FLYING_ENEMY_ACTUAL_FRAME_WIDTH, DANGEROUS_FLYING_ENEMY_ACTUAL_FRAME_HEIGHT, DANGEROUS_FLYING_ENEMY_NUM_FRAMES, 'base');
        this.animation = this.animations['base'];

        this.isDangerousFlyer = true;
    }
}

class Glitchzilla extends BaseEnemy {
    constructor(x, y) {
        super(x, y, GLITCHZILLA_TARGET_WIDTH, GLITCHZILLA_TARGET_HEIGHT, 'glitchzillaBase', GLITCHZILLA_ACTUAL_FRAME_WIDTH, GLITCHZILLA_ACTUAL_FRAME_HEIGHT, GLITCHZILLA_NUM_FRAMES, 0.2, GLITCHZILLA_HEALTH, '#FF00FF', GLITCHZILLA_SCORE_VALUE);

        this.loadAnimation('glitchzillaDmg1', GLITCHZILLA_ACTUAL_FRAME_WIDTH, GLITCHZILLA_ACTUAL_FRAME_HEIGHT, GLITCHZILLA_NUM_FRAMES, 'dmg1');
        this.loadAnimation('glitchzillaDmg2', GLITCHZILLA_ACTUAL_FRAME_WIDTH, GLITCHZILLA_ACTUAL_FRAME_HEIGHT, GLITCHZILLA_NUM_FRAMES, 'dmg2');
        this.loadAnimation('glitchzillaDmg3', GLITCHZILLA_ACTUAL_FRAME_WIDTH, GLITCHZILLA_ACTUAL_FRAME_HEIGHT, GLITCHZILLA_NUM_FRAMES, 'dmg3');
        this.updateCurrentAnimation();

        this.spawnTime = Date.now();
        this.attackSequence = ['warn_high', 'high', 'pause_short', 'warn_medium', 'medium', 'pause_short', 'warn_low', 'low', 'pause_long'];
        this.attackSequenceIndex = 0;
        this.currentAttackPhaseDuration = 0;
        this.shotFiredInPhase = false; 

        this.pauseShortDuration = 0.75;
        this.pauseLongDuration = 2.0;

        this.projectileSpriteName = 'glitchzillaProjectile';
        this.projectileFrameWidth = GLITCHZILLA_PROJECTILE_ACTUAL_FRAME_WIDTH;
        this.projectileFrameHeight = GLITCHZILLA_PROJECTILE_ACTUAL_FRAME_HEIGHT;
        this.projectileNumFrames = GLITCHZILLA_PROJECTILE_NUM_FRAMES;
        this.projectileTargetWidth = GLITCHZILLA_PROJECTILE_TARGET_WIDTH;
        this.projectileTargetHeight = GLITCHZILLA_PROJECTILE_TARGET_HEIGHT;

        AudioManager.playSound('glitchzillaSpawn');
        console.log("GLITCHZILLA SPAWNED! HP: " + this.health);
    }

    updateCurrentAnimation() {
        let animKey;
        if (this.health > GLITCHZILLA_HEALTH * 0.75) animKey = 'base';
        else if (this.health > GLITCHZILLA_HEALTH * 0.50) animKey = 'dmg1';
        else if (this.health > GLITCHZILLA_HEALTH * 0.25) animKey = 'dmg2';
        else animKey = 'dmg3';

        this.animation = this.animations[animKey] || this.animations['base'];
        if (this.animation && this.animation.reset) this.animation.reset();
    }

    takeDamage(dmg = 1) {
        super.takeDamage(dmg); 
        console.log(`Glitchzilla took ${dmg} damage, HP: ${this.health}`);
        this.updateCurrentAnimation(); 
        AudioManager.playSound('glitchzillaHit');
        if (this.health <= 0) {
            console.log("Glitchzilla SCONFITTO! Assegno punteggio: " + this.scoreValue);
            AudioManager.playSound('glitchzillaDefeat');
            score += this.scoreValue;
            activeMiniboss = null;
            hasGlitchzillaSpawnedThisGame = true;
        }
    }

    update(dt) {
        super.update(dt); 

        this.currentAttackPhaseDuration += dt;
        const currentPhase = this.attackSequence[this.attackSequenceIndex];
        let phaseComplete = false;

        switch (currentPhase) {
            case 'warn_high':
            case 'warn_medium':
            case 'warn_low':
                this.isWarning = true; 
                if (this.currentAttackPhaseDuration >= WARNING_DURATION) {
                    phaseComplete = true;
                    this.isWarning = false; 
                }
                break;

            case 'high':
            case 'medium':
            case 'low':
                if (!this.shotFiredInPhase) {
                    let projectileY;
                    if (currentPhase === 'high') projectileY = this.y + this.height * 0.2 - this.projectileTargetHeight / 2;
                    else if (currentPhase === 'medium') projectileY = this.y + this.height * 0.65 - this.projectileTargetHeight / 2; 
                    else projectileY = this.y + this.height * 0.8 - this.projectileTargetHeight / 2;

                    enemyProjectiles.push(new EnemyProjectile(
                        this.x - this.projectileTargetWidth, projectileY,
                        this.projectileSpriteName, this.projectileFrameWidth, this.projectileFrameHeight, this.projectileNumFrames,
                        this.projectileTargetWidth, this.projectileTargetHeight
                    ));
                    AudioManager.playSound('glitchzillaAttack');
                    this.shotFiredInPhase = true;
                }
                phaseComplete = true;
                break;

            case 'pause_short':
                if (this.currentAttackPhaseDuration >= this.pauseShortDuration) {
                    phaseComplete = true;
                }
                break;

            case 'pause_long':
                if (this.currentAttackPhaseDuration >= this.pauseLongDuration) {
                    phaseComplete = true;
                }
                break;
        }

        if (phaseComplete) {
            this.attackSequenceIndex = (this.attackSequenceIndex + 1) % this.attackSequence.length;
            this.currentAttackPhaseDuration = 0;
            this.shotFiredInPhase = false; 
            if (!this.attackSequence[this.attackSequenceIndex].startsWith('warn_')) {
                 this.isWarning = false;
            }
        }

        if (this.x < canvas.width / 2) {
            this.x = canvas.width / 2;
        }
    }
}


function drawGround() {
    // Usa un colore dalla nuova palette per la linea di terra
    ctx.strokeStyle = PALETTE.BORDER_LINE_COLOR; 
    ctx.lineWidth = lineWidth; // lineWidth è già definito globalmente
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - groundHeight);
    ctx.lineTo(canvas.width, canvas.height - groundHeight);
    ctx.stroke();
}

function calculateNextObstacleSpawnTime(){const minT=6.0;const maxT=10.0;return minT+Math.random()*(maxT-minT);}
function spawnObstacleIfNeeded(dt){if(activeMiniboss) return; obstacleSpawnTimer+=dt;if(obstacleSpawnTimer>=nextObstacleSpawnTime){obstacleSpawnTimer=0;nextObstacleSpawnTime=calculateNextObstacleSpawnTime();obstacles.push(new Obstacle(canvas.width,canvas.height-groundHeight-OBSTACLE_TARGET_HEIGHT));}}
function updateObstacles(dt){for(let i=obstacles.length-1;i>=0;i--){obstacles[i].update(dt);if(obstacles[i].x+obstacles[i].width<0){obstacles.splice(i,1);score+=5;}}}
function drawObstacles(){obstacles.forEach(o=>o.draw());}
function updateProjectiles(dt){for(let i=projectiles.length-1;i>=0;i--){projectiles[i].update(dt);if(projectiles[i].x>canvas.width){projectiles.splice(i,1);}}}
function drawProjectiles(){projectiles.forEach(p=>p.draw());}
function updateShootCooldown(dt){if(!canShoot){shootTimer+=dt;if(shootTimer>=shootCooldownTime)canShoot=true;}}
function calculateNextEnemyBaseSpawnTime(){const minT=3.0;const maxT=5.0;return minT+Math.random()*(maxT-minT);}

function spawnEnemyBaseIfNeeded(dt){if(activeMiniboss) return; enemyBaseSpawnTimer+=dt;if(enemyBaseSpawnTimer>=nextEnemyBaseSpawnTime){enemyBaseSpawnTimer=0;nextEnemyBaseSpawnTime=calculateNextEnemyBaseSpawnTime();enemies.push(new BaseEnemy(canvas.width,canvas.height-groundHeight-ENEMY_ONE_TARGET_HEIGHT,ENEMY_ONE_TARGET_WIDTH,ENEMY_ONE_TARGET_HEIGHT,'enemyOne',ENEMY_ONE_ACTUAL_FRAME_WIDTH,ENEMY_ONE_ACTUAL_FRAME_HEIGHT,ENEMY_ONE_NUM_FRAMES,(0.7+Math.random()*0.5),1,enemyBaseSpawnColor, 25));}}
function calculateNextFlyingEnemySpawnTime(){const minT=8.0;const maxT=15.0;return minT+Math.random()*(maxT-minT);}
function spawnFlyingEnemyIfNeeded(dt){if(activeMiniboss) return; flyingEnemySpawnTimer+=dt;if(flyingEnemySpawnTimer>=nextFlyingEnemySpawnTime){flyingEnemySpawnTimer=0;nextFlyingEnemySpawnTime=calculateNextFlyingEnemySpawnTime();const minY=canvas.height*0.1;const maxY=canvas.height*0.45;const localFlyingEnemyY=minY+Math.random()*(maxY-minY);flyingEnemies.push(new FlyingEnemy(canvas.width,localFlyingEnemyY));}}
function calculateNextGenericEnemySpawnTime(min,max){return min+Math.random()*(max-min);}
function spawnFastEnemyIfNeeded(dt){if(activeMiniboss || score<SCORE_THRESHOLD_FAST_ENEMY)return;fastEnemySpawnTimer+=dt;if(fastEnemySpawnTimer>=nextFastEnemySpawnTime){fastEnemySpawnTimer=0;nextFastEnemySpawnTime=calculateNextGenericEnemySpawnTime(4.0,7.0);fastEnemies.push(new BaseEnemy(canvas.width,canvas.height-groundHeight-ENEMY_TWO_TARGET_HEIGHT,ENEMY_TWO_TARGET_WIDTH,ENEMY_TWO_TARGET_HEIGHT,'enemyTwo',ENEMY_TWO_ACTUAL_FRAME_WIDTH,ENEMY_TWO_ACTUAL_FRAME_HEIGHT,ENEMY_TWO_NUM_FRAMES,fastEnemySpeedMultiplier,1,fastEnemySpawnColor,35));}}
function spawnArmoredEnemyIfNeeded(dt){if(activeMiniboss || score<SCORE_THRESHOLD_ARMORED_ENEMY)return;armoredEnemySpawnTimer+=dt;if(armoredEnemySpawnTimer>=nextArmoredEnemySpawnTime){armoredEnemySpawnTimer=0;nextArmoredEnemySpawnTime=calculateNextGenericEnemySpawnTime(7.0,12.0);armoredEnemies.push(new ArmoredEnemy(canvas.width,canvas.height-groundHeight-ENEMY_THREE_TARGET_HEIGHT));}}
function spawnShootingEnemyIfNeeded(dt){if(activeMiniboss || score<SCORE_THRESHOLD_SHOOTING_ENEMY)return;shootingEnemySpawnTimer+=dt;if(shootingEnemySpawnTimer>=nextShootingEnemySpawnTime){shootingEnemySpawnTimer=0;nextShootingEnemySpawnTime=calculateNextGenericEnemySpawnTime(8.0,14.0);shootingEnemies.push(new ShootingEnemy(canvas.width,canvas.height-groundHeight-ENEMY_FOUR_TARGET_HEIGHT));}}
function spawnArmoredShootingEnemyIfNeeded(dt) { if (activeMiniboss || score < SCORE_THRESHOLD_ARMORED_SHOOTING_ENEMY) return; armoredShootingEnemySpawnTimer += dt; if (armoredShootingEnemySpawnTimer >= nextArmoredShootingEnemySpawnTime) { armoredShootingEnemySpawnTimer = 0; nextArmoredShootingEnemySpawnTime = calculateNextGenericEnemySpawnTime(15.0, 25.0); armoredShootingEnemies.push(new ArmoredShootingEnemy(canvas.width, canvas.height - groundHeight - ENEMY_SIX_TARGET_HEIGHT));}}
function spawnToughBasicEnemyIfNeeded(dt) { if (activeMiniboss || score < SCORE_THRESHOLD_TOUGH_BASIC_ENEMY) return; toughBasicEnemySpawnTimer += dt; if (toughBasicEnemySpawnTimer >= nextToughBasicEnemySpawnTime) { toughBasicEnemySpawnTimer = 0; nextToughBasicEnemySpawnTime = calculateNextGenericEnemySpawnTime(5.0, 9.0); toughBasicEnemies.push(new ToughBasicEnemy(canvas.width, canvas.height - groundHeight - ENEMY_SEVEN_TARGET_HEIGHT));}}
function spawnDangerousFlyingEnemyIfNeeded(dt) { if (activeMiniboss || score < SCORE_THRESHOLD_DANGEROUS_FLYING_ENEMY) return; dangerousFlyingEnemySpawnTimer += dt; if (dangerousFlyingEnemySpawnTimer >= nextDangerousFlyingEnemySpawnTime) { dangerousFlyingEnemySpawnTimer = 0; nextDangerousFlyingEnemySpawnTime = calculateNextGenericEnemySpawnTime(20.0, 35.0); const minY = canvas.height * 0.2; const maxY = canvas.height * 0.5; const spawnY = minY + Math.random() * (maxY - minY); dangerousFlyingEnemies.push(new DangerousFlyingEnemy(canvas.width, spawnY));}}

function spawnGlitchzillaIfNeeded() {
    if (!activeMiniboss && !hasGlitchzillaSpawnedThisGame && score >= GLITCHZILLA_SPAWN_SCORE_THRESHOLD) {
        activeMiniboss = new Glitchzilla(canvas.width, canvas.height - groundHeight - GLITCHZILLA_TARGET_HEIGHT);
    }
}


function calculateNextPowerUpAmbientSpawnTime() { const minT = 20.0; const maxT = 35.0; return minT + Math.random() * (maxT - minT); }

function spawnPowerUpAmbientIfNeeded(dt) {
    powerUpSpawnTimer += dt;
    if (powerUpSpawnTimer >= nextPowerUpSpawnTime) {
        powerUpSpawnTimer = 0; nextPowerUpSpawnTime = calculateNextPowerUpAmbientSpawnTime();

        let availablePowerUps = [
            POWERUP_TYPE.TRIPLE_SHOT, POWERUP_TYPE.SHIELD, POWERUP_TYPE.SMART_BOMB,
            POWERUP_TYPE.DEBUG_MODE, POWERUP_TYPE.FIREWALL, POWERUP_TYPE.BLOCK_BREAKER
        ];

        if (asyncDonkey && asyncDonkey.activePowerUp) {
            const conflictingActive = [POWERUP_TYPE.DEBUG_MODE, POWERUP_TYPE.TRIPLE_SHOT, POWERUP_TYPE.BLOCK_BREAKER];
            if (conflictingActive.includes(asyncDonkey.activePowerUp)) {
                availablePowerUps = availablePowerUps.filter(type => !conflictingActive.includes(type));
            }
            if(asyncDonkey.activePowerUp === POWERUP_TYPE.SHIELD) availablePowerUps = availablePowerUps.filter(type => type !== POWERUP_TYPE.SHIELD);
            if(asyncDonkey.activePowerUp === POWERUP_TYPE.FIREWALL) availablePowerUps = availablePowerUps.filter(type => type !== POWERUP_TYPE.FIREWALL);
        }
        if (availablePowerUps.length === 0) {
             return;
        }

        const randomType = availablePowerUps[Math.floor(Math.random() * availablePowerUps.length)];
        const spawnY = (canvas.height - groundHeight - POWERUP_TARGET_HEIGHT) * (0.5 + Math.random() * 0.4);
        powerUpItems.push(new PowerUpItem(canvas.width, spawnY, randomType, images, () => gameSpeed));
        console.log(`Spawned Ambient PowerUp: ${randomType}`);
    }
}
function updatePowerUpItems(dt) { for (let i = powerUpItems.length - 1; i >= 0; i--) { powerUpItems[i].update(dt); if (powerUpItems[i].x + powerUpItems[i].width < 0) { powerUpItems.splice(i, 1); } } }
function drawPowerUpItems() { powerUpItems.forEach(p => p.draw(ctx)); }

function updateAllEnemyTypes(dt){
    enemies.forEach((e,i)=>{e.update(dt);if(e.x+e.width<0)enemies.splice(i,1);});
    flyingEnemies.forEach((e,i)=>{e.update(dt);if(e.x+e.width<0)flyingEnemies.splice(i,1);});
    fastEnemies.forEach((e,i)=>{e.update(dt);if(e.x+e.width<0)fastEnemies.splice(i,1);});
    armoredEnemies.forEach((e,i)=>{e.update(dt);if(e.x+e.width<0)armoredEnemies.splice(i,1);});
    shootingEnemies.forEach((e,i)=>{e.update(dt);if(e.x+e.width<0)shootingEnemies.splice(i,1);});
    enemyProjectiles.forEach((ep,i)=>{ep.update(dt);if(ep.x+ep.width<0)enemyProjectiles.splice(i,1);});
    armoredShootingEnemies.forEach((e,i)=>{e.update(dt);if(e.x+e.width<0)armoredShootingEnemies.splice(i,1);});
    toughBasicEnemies.forEach((e,i)=>{e.update(dt);if(e.x+e.width<0)toughBasicEnemies.splice(i,1);});
    dangerousFlyingEnemies.forEach((e,i)=>{e.update(dt);if(e.x+e.width<0)dangerousFlyingEnemies.splice(i,1);});
    if (activeMiniboss) {
        activeMiniboss.update(dt);
        if (activeMiniboss && activeMiniboss.health <= 0) { 
            activeMiniboss = null;
        } else if (activeMiniboss && activeMiniboss.x + activeMiniboss.width < 0) { 
            activeMiniboss = null;
        }
    }
}
function drawAllEnemyTypes(){
    enemies.forEach(e=>e.draw());flyingEnemies.forEach(e=>e.draw());fastEnemies.forEach(e=>e.draw());
    armoredEnemies.forEach(e=>e.draw());shootingEnemies.forEach(e=>e.draw());enemyProjectiles.forEach(ep=>ep.draw());
    armoredShootingEnemies.forEach(e=>e.draw());toughBasicEnemies.forEach(e=>e.draw());dangerousFlyingEnemies.forEach(e=>e.draw());
    if (activeMiniboss) {
        activeMiniboss.draw();
    }
}

function shouldShowDonkeyScoreInput(currentScore) {
    // Qui puoi mettere logica più complessa, es. solo se è un nuovo high score personale
    // o se il punteggio è sopra una certa soglia. Per ora, mostriamolo se > 0.
    return currentScore > 0;
}

async function handleSaveDonkeyScore() {
    console.log("handleSaveDonkeyScore: Inizio funzione."); // LOG 1

    if (finalScore <= 0) {
        console.error("handleSaveDonkeyScore: Tentativo di salvare un punteggio non valido (<=0). Punteggio:", finalScore);
        alert("Impossibile salvare un punteggio di 0 o negativo.");
        if (saveScoreBtnDonkey) { // Assicurati che il pulsante esista prima di modificarlo
            saveScoreBtnDonkey.disabled = false;
            saveScoreBtnDonkey.textContent = "Salva Punteggio";
        }
        return;
    }

    if (!db || !auth) {
        console.error("DB o Auth non inizializzati. Impossibile salvare il punteggio.");
        alert("Errore: Connessione al database fallita.");
        if (saveScoreBtnDonkey) { saveScoreBtnDonkey.disabled = false; saveScoreBtnDonkey.textContent = "Salva Punteggio"; }
        return;
    }
    if (!saveScoreBtnDonkey || !playerInitialsDonkeyInput || !scoreInputContainerDonkey || !restartGameBtnDonkey) {
        console.error("Elementi DOM per il salvataggio punteggio non trovati.");
        // Non reimpostare il pulsante qui se gli elementi DOM fondamentali mancano, perché l'utente non potrebbe comunque interagire.
        return;
    }

    const scoreToSave = finalScore;
    console.log("handleSaveDonkeyScore: Punteggio da salvare =", scoreToSave); // LOG 2
    let userNameToSave = "Giocatore Anonimo";
    let userIdToSave = null;
    let initialsForDb = "";
    let isAnonymousSave = false;

    saveScoreBtnDonkey.disabled = true;
    saveScoreBtnDonkey.textContent = "Salvataggio...";

    const currentUser = auth.currentUser;
    console.log("handleSaveDonkeyScore: currentUser =", currentUser ? currentUser.uid : 'Nessuno'); // LOG 3

    if (currentUser) { // Utente Loggato
        console.log("handleSaveDonkeyScore: Blocco utente loggato."); // LOG 4
        userIdToSave = currentUser.uid;
        try {
            const userProfileRef = doc(db, "userProfiles", currentUser.uid);
            const docSnap = await getDoc(userProfileRef);
            if (docSnap.exists() && docSnap.data().nickname) {
                userNameToSave = docSnap.data().nickname;
            } else {
                userNameToSave = currentUser.email ? currentUser.email.split('@')[0] : "Utente Registrato";
            }
            console.log("handleSaveDonkeyScore: userNameToSave (loggato) =", userNameToSave); // LOG 5
        } catch (profileError) {
            console.error("Errore caricamento profilo per punteggio:", profileError);
            userNameToSave = currentUser.email ? currentUser.email.split('@')[0] : "Utente Registrato"; // Fallback
        }
        initialsForDb = userNameToSave.substring(0, 5).toUpperCase();
    } else { // Utente Non Loggato
        console.log("handleSaveDonkeyScore: Blocco utente anonimo."); // LOG 6
        isAnonymousSave = true;
        const rawInitials = playerInitialsDonkeyInput.value.trim().toUpperCase();
        console.log("handleSaveDonkeyScore: rawInitials (anonimo) =", rawInitials); // LOG 7
        if (rawInitials.length === 0 || rawInitials.length > 5) {
            console.log("handleSaveDonkeyScore: Validazione iniziali anonimo fallita."); // LOG 8
            alert('Per favore, inserisci da 1 a 5 caratteri per le tue iniziali.');
            playerInitialsDonkeyInput.focus();
            saveScoreBtnDonkey.disabled = false;
            saveScoreBtnDonkey.textContent = "Salva Punteggio";
            return;
        }
        userNameToSave = rawInitials;
        initialsForDb = rawInitials;
        console.log("handleSaveDonkeyScore: userNameToSave (anonimo) =", userNameToSave); // LOG 9
    }

    const scoreData = {
        score: scoreToSave,
        timestamp: serverTimestamp(),
        userName: userNameToSave,
        initials: initialsForDb,
        gameId: "donkeyRunner"
    };

    if (userIdToSave) {
        scoreData.userId = userIdToSave;
    }
    console.log("handleSaveDonkeyScore: scoreData pronto per Firestore =", scoreData); // LOG 10

    try {
        console.log("handleSaveDonkeyScore: Tentativo di addDoc a Firestore."); // LOG 11
        const leaderboardScoresCollection = collection(db, "leaderboardScores");
        await addDoc(leaderboardScoresCollection, scoreData);
        console.log("Punteggio DonkeyRunner salvato con successo:", scoreData); // LOG 12 (SUCCESSO!)

        scoreInputContainerDonkey.style.display = 'none';
        if (isAnonymousSave) {
            playerInitialsDonkeyInput.value = '';
        }
        const saveAsNameMessageEl = document.getElementById('saveAsNameMessage');
        if (saveAsNameMessageEl) saveAsNameMessageEl.style.display = 'none';
        
        restartGameBtnDonkey.style.display = 'block';

        await loadDonkeyLeaderboard();
    } catch (error) {
        console.error("handleSaveDonkeyScore: ERRORE durante addDoc a Firestore:", error); // LOG 13 (ERRORE FIRESTORE)
        alert("Errore nel salvataggio del punteggio. Riprova.\nControlla la console per dettagli (F12).");
        saveScoreBtnDonkey.disabled = false;
        saveScoreBtnDonkey.textContent = "Salva Punteggio";
    }
    console.log("handleSaveDonkeyScore: Fine funzione."); // LOG 14
}

function processGameOver() {
    console.log("ProcessGameOver - Punteggio finale:", finalScore); // Log esistente
    currentGameState = GAME_STATE.GAME_OVER;
    AudioManager.stopMusic();

    // ---> NUOVI LOG DA AGGIUNGERE QUI <---
    console.log("processGameOver: Controllo elementi DOM per UI salvataggio punteggio:");
    console.log("scoreInputContainerDonkey:", scoreInputContainerDonkey);
    console.log("playerInitialsDonkeyInput:", playerInitialsDonkeyInput);
    console.log("saveScoreBtnDonkey:", saveScoreBtnDonkey);
    console.log("restartGameBtnDonkey:", restartGameBtnDonkey);
    // ---> FINE NUOVI LOG <---

    if (shouldShowDonkeyScoreInput(finalScore)) {
        if (scoreInputContainerDonkey && playerInitialsDonkeyInput && saveScoreBtnDonkey && restartGameBtnDonkey) {
            scoreInputContainerDonkey.style.display = 'block';
            // ... il resto della logica per mostrare/nascondere gli input specifici ...
            // (come definito nella versione corretta di processGameOver che ti ho dato prima)
            // Assicurati che questa parte sia completa e corretta
            restartGameBtnDonkey.style.display = 'none'; // Nascondi il restart button del form inizialmente
            saveScoreBtnDonkey.disabled = false;
            saveScoreBtnDonkey.textContent = "Salva Punteggio";

            const currentUser = auth.currentUser;
            const playerInitialsLabelEl = document.getElementById('playerInitialsLabel'); // Questo viene preso qui dentro
            const saveAsNameMessageEl = document.getElementById('saveAsNameMessage'); // Anche questo

            if (currentUser) { // Utente Loggato
                playerInitialsDonkeyInput.style.display = 'none';
                if (playerInitialsLabelEl) playerInitialsLabelEl.style.display = 'none';
                if (saveAsNameMessageEl) {
                    getDoc(doc(db, "userProfiles", currentUser.uid)).then(docSnap => {
                        let nameToDisplay = currentUser.email.split('@')[0];
                        if (docSnap.exists() && docSnap.data().nickname) {
                            nameToDisplay = docSnap.data().nickname;
                        }
                        saveAsNameMessageEl.textContent = `Il punteggio sarà salvato come: ${nameToDisplay}`;
                        saveAsNameMessageEl.style.display = 'block';
                    }).catch(err => {
                        console.error("Errore nel recuperare il profilo per messaggio UI:", err);
                        saveAsNameMessageEl.textContent = `Il punteggio sarà salvato con il tuo utente.`;
                        saveAsNameMessageEl.style.display = 'block';
                    });
                }
            } else { // Utente Non Loggato
                playerInitialsDonkeyInput.style.display = 'block';
                if (playerInitialsLabelEl) playerInitialsLabelEl.style.display = 'block';
                if (saveAsNameMessageEl) saveAsNameMessageEl.style.display = 'none';
                playerInitialsDonkeyInput.value = '';
                playerInitialsDonkeyInput.placeholder = "ABCDE";
                playerInitialsDonkeyInput.focus();
            }

        } else {
            console.warn("processGameOver: Uno o più elementi DOM (scoreInputContainerDonkey, playerInitialsDonkeyInput, saveScoreBtnDonkey, restartGameBtnDonkey) sono NULL. Impossibile mostrare UI per salvare.");
            if (restartGameBtnDonkey) restartGameBtnDonkey.style.display = 'block';
        }
    } else {
        console.log("processGameOver: Punteggio finale non valido o zero, non mostro UI per salvare. Punteggio:", finalScore);
        if (scoreInputContainerDonkey) scoreInputContainerDonkey.style.display = 'none';
        if (restartGameBtnDonkey) restartGameBtnDonkey.style.display = 'block';
    }
}


function checkCollisions(){
    if(!asyncDonkey||gameOverTrigger)return;
    const pC={x:asyncDonkey.x+asyncDonkey.colliderOffsetX,y:asyncDonkey.y+asyncDonkey.colliderOffsetY,width:asyncDonkey.colliderWidth,height:asyncDonkey.colliderHeight};

    if(!asyncDonkey.isShieldActive){
        const checkPlayerCollisionWithEntity=(entity, isObstacle = false)=>{
            if (isObstacle && asyncDonkey.isFirewallActive) {
                if(entity&&pC.x<entity.x+entity.width&&pC.x+pC.width>entity.x&&pC.y<entity.y+entity.height&&pC.y+pC.height>entity.y){
                    // AudioManager.playSound('firewallDeflect'); // Optional sound
                }
                return false;
            }
            if(entity&&pC.x<entity.x+entity.width&&pC.x+pC.width>entity.x&&pC.y<entity.y+entity.height&&pC.y+pC.height>entity.y){
                gameOverTrigger=true; AudioManager.playSound('playerHit'); AudioManager.stopMusic();
                console.error(`HIT Player vs ${entity.constructor.name || 'Unknown Entity'}`);return true;
            }
            return false;
        };

        const checkPlayerCollisionWithList = (list, isObstacle = false) => {
            for(let entity of list) if(checkPlayerCollisionWithEntity(entity, isObstacle)) return true;
            return false;
        }

        if(checkPlayerCollisionWithList(obstacles, true))return;
        if(checkPlayerCollisionWithList(enemies))return; if(checkPlayerCollisionWithList(fastEnemies))return;
        if(checkPlayerCollisionWithList(armoredEnemies))return; if(checkPlayerCollisionWithList(shootingEnemies))return;
        if(checkPlayerCollisionWithList(enemyProjectiles))return;
        if(checkPlayerCollisionWithList(armoredShootingEnemies))return; if(checkPlayerCollisionWithList(toughBasicEnemies))return;
        if(checkPlayerCollisionWithList(dangerousFlyingEnemies))return;
        if(activeMiniboss && checkPlayerCollisionWithEntity(activeMiniboss)) return;
    }

    for(let i=powerUpItems.length-1;i>=0;i--){const pu=powerUpItems[i];if(pu&&pC.x<pu.x+pu.width&&pC.x+pC.width>pu.x&&pC.y<pu.y+pu.height&&pC.y+pC.height>pu.y){asyncDonkey.activatePowerUp(pu.type);powerUpItems.splice(i,1);}}

    for(let i=projectiles.length-1;i>=0;i--){
        const p=projectiles[i];if(!p)continue;
        let projectileConsumedThisHit=false;

        if (asyncDonkey.isBlockBreakerActive) {
            for (let k = obstacles.length - 1; k >= 0; k--) {
                const o = obstacles[k];
                if (o && p.x < o.x + o.width && p.x + p.width > o.x && p.y < o.y + o.height && p.y + p.height > o.y) {
                    if (o.takeDamage(p.damage)) {
                        obstacles.splice(k, 1);
                        score += 10;
                    }
                    projectileConsumedThisHit = true;
                    break;
                }
            }
            if(projectileConsumedThisHit){projectiles.splice(i,1);continue;}
        }

        const processProjectileHitOnList=(enemyList, indexInArray)=>{
            if(indexInArray<0||indexInArray>=enemyList.length)return false;
            const e=enemyList[indexInArray];
            if(e&&p.x<e.x+e.width&&p.x+p.width>e.x&&p.y<e.y+e.height&&p.y+p.height>e.y){
                e.takeDamage(p.damage); 
                AudioManager.playSound('enemyHit'); projectileConsumedThisHit=true;
                if(e.health<=0){
                    AudioManager.playSound('enemyExplode');
                    if (!(e instanceof Glitchzilla)) { 
                       score+= e.scoreValue;
                    }
                    enemyList.splice(indexInArray,1);
                    const actuallyDangerousFlyer = e.isDangerousFlyer !== undefined ? e.isDangerousFlyer : false;
                    const isRegularFlying = e instanceof FlyingEnemy && !actuallyDangerousFlyer;

                    if(actuallyDangerousFlyer){
                         const availablePowerUpsDrop=[POWERUP_TYPE.TRIPLE_SHOT,POWERUP_TYPE.SHIELD,POWERUP_TYPE.SMART_BOMB, POWERUP_TYPE.DEBUG_MODE, POWERUP_TYPE.FIREWALL, POWERUP_TYPE.BLOCK_BREAKER];
                         const randomType=availablePowerUpsDrop[Math.floor(Math.random()*availablePowerUpsDrop.length)];
                         powerUpItems.push(new PowerUpItem(e.x,e.y,randomType,images,() => gameSpeed));
                    } else if(isRegularFlying){
                        const randomRoll = Math.random();
                        if(randomRoll < POWER_UP_DROP_CHANCE_FROM_FLYING_ENEMY){
                            const availablePowerUpsDrop=[POWERUP_TYPE.TRIPLE_SHOT,POWERUP_TYPE.SHIELD,POWERUP_TYPE.SMART_BOMB, POWERUP_TYPE.DEBUG_MODE, POWERUP_TYPE.FIREWALL, POWERUP_TYPE.BLOCK_BREAKER];
                            const randomType=availablePowerUpsDrop[Math.floor(Math.random()*availablePowerUpsDrop.length)];
                            powerUpItems.push(new PowerUpItem(e.x,e.y,randomType,images,() => gameSpeed));
                        }
                    }
                }else if(e instanceof ArmoredEnemy || e instanceof ArmoredShootingEnemy || e instanceof ToughBasicEnemy || (e instanceof Glitchzilla && e.health > 0) ){score+=5;} 
                return true;
            }return false;
        };

        if (activeMiniboss && p.x < activeMiniboss.x + activeMiniboss.width && p.x + p.width > activeMiniboss.x && p.y < activeMiniboss.y + activeMiniboss.height && p.y + p.height > activeMiniboss.y) {
            activeMiniboss.takeDamage(p.damage); 
            projectileConsumedThisHit = true;
        }

        if(projectileConsumedThisHit){projectiles.splice(i,1);continue;}


        for(let j=enemies.length-1;j>=0;j--){if(processProjectileHitOnList(enemies,j)){break;}}
        if(projectileConsumedThisHit){projectiles.splice(i,1);continue;}
        for(let j=fastEnemies.length-1;j>=0;j--){if(processProjectileHitOnList(fastEnemies,j)){break;}}
        if(projectileConsumedThisHit){projectiles.splice(i,1);continue;}
        for(let j=armoredEnemies.length-1;j>=0;j--){if(processProjectileHitOnList(armoredEnemies,j)){break;}}
        if(projectileConsumedThisHit){projectiles.splice(i,1);continue;}
        for(let j=shootingEnemies.length-1;j>=0;j--){if(processProjectileHitOnList(shootingEnemies,j)){break;}}
        if(projectileConsumedThisHit){projectiles.splice(i,1);continue;}
        for(let j=armoredShootingEnemies.length-1;j>=0;j--){if(processProjectileHitOnList(armoredShootingEnemies,j)){break;}}
        if(projectileConsumedThisHit){projectiles.splice(i,1);continue;}
        for(let j=toughBasicEnemies.length-1;j>=0;j--){if(processProjectileHitOnList(toughBasicEnemies,j)){break;}}
        if(projectileConsumedThisHit){projectiles.splice(i,1);continue;}
        for(let j=dangerousFlyingEnemies.length-1;j>=0;j--){if(processProjectileHitOnList(dangerousFlyingEnemies,j)){break;}}
        if(projectileConsumedThisHit){projectiles.splice(i,1);continue;}
        for(let j=flyingEnemies.length-1;j>=0;j--){if (flyingEnemies[j]) {if(processProjectileHitOnList(flyingEnemies,j)){break;}} else {/* console.warn(`DEBUG: flyingEnemies[${j}] è undefined.`);*/}}
        if(projectileConsumedThisHit){projectiles.splice(i,1);continue;}
    }
}

function resetGame(){
    console.log("resetGame...");
    asyncDonkey=new Player(playerInitialX,playerInitialY,PLAYER_TARGET_WIDTH,PLAYER_TARGET_HEIGHT);
    obstacles=[];projectiles=[];enemies=[];flyingEnemies=[];fastEnemies=[];armoredEnemies=[];shootingEnemies=[];enemyProjectiles=[];
    armoredShootingEnemies=[]; toughBasicEnemies=[]; dangerousFlyingEnemies=[];
    activeMiniboss = null;
    hasGlitchzillaSpawnedThisGame = false;

    powerUpItems=[];powerUpSpawnTimer=0;nextPowerUpSpawnTime=calculateNextPowerUpAmbientSpawnTime();
    if(asyncDonkey)asyncDonkey.deactivatePowerUp();
    obstacleSpawnTimer=0;nextObstacleSpawnTime=calculateNextObstacleSpawnTime();
    enemyBaseSpawnTimer=0;nextEnemyBaseSpawnTime=calculateNextEnemyBaseSpawnTime();
    flyingEnemySpawnTimer=0;nextFlyingEnemySpawnTime=calculateNextFlyingEnemySpawnTime();
    fastEnemySpawnTimer=0;nextFastEnemySpawnTime=calculateNextGenericEnemySpawnTime(4.0,7.0);
    armoredEnemySpawnTimer=0;nextArmoredEnemySpawnTime=calculateNextGenericEnemySpawnTime(7.0,12.0);
    shootingEnemySpawnTimer=0;nextShootingEnemySpawnTime=calculateNextGenericEnemySpawnTime(8.0,14.0);
    armoredShootingEnemySpawnTimer=0; nextArmoredShootingEnemySpawnTime=calculateNextGenericEnemySpawnTime(15.0, 25.0);
    toughBasicEnemySpawnTimer=0; nextToughBasicEnemySpawnTime=calculateNextGenericEnemySpawnTime(5.0, 9.0);
    dangerousFlyingEnemySpawnTimer=0; nextDangerousFlyingEnemySpawnTime=calculateNextGenericEnemySpawnTime(20.0, 35.0);
    score=0;finalScore=0;gameOverTrigger=false;canShoot=true;
    shootTimer=0; // Assign to existing global variable
    score = 0;
    // finalScore = 0; // finalScore viene impostato solo al game over effettivo
    gameOverTrigger = false;
    canShoot = true;
    shootTimer = 0;

    // Nascondi UI per salvataggio punteggio e restart specifico
    if (scoreInputContainerDonkey) scoreInputContainerDonkey.style.display = 'none';
    if (restartGameBtnDonkey) restartGameBtnDonkey.style.display = 'none';
    
    // Mostra i controlli di gioco principali se erano stati nascosti
    if (isTouchDevice) { // O se li mostri sempre durante il gioco
        if (mobileControlsDiv) mobileControlsDiv.style.display = 'block';
        if (fullscreenButton) fullscreenButton.style.display = 'block';
    }

    console.log("resetGame: Fatto.");
}

function drawTerminalBackgroundEffects() {
    // Questa funzione viene chiamata DOPO aver riempito lo sfondo principale
    // con PALETTE.DARK_BACKGROUND.

    // 1. Scanlines (Più Visibili)
    ctx.save();
    // PALETTE.DARK_TEAL_BLUE ('#32535f') -> rgb(50, 83, 95)
    ctx.strokeStyle = 'rgba(50, 83, 95, 0.22)'; 
    ctx.lineWidth = 1;
    for (let y = 0; y < canvas.height; y += 2) { 
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(canvas.width, y + 0.5);
        ctx.stroke();
    }
    ctx.restore();

    // 2. Griglia Sottile
    ctx.save();
    const gridSize = 25; 
    // PALETTE.MEDIUM_PURPLE ('#631b34') -> rgb(99, 27, 52)
    ctx.strokeStyle = 'rgba(99, 27, 52, 0.1)'; 
    ctx.lineWidth = 1;

    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(canvas.width, y + 0.5);
        ctx.stroke();
    }
    ctx.restore();

    // 3. Vignette (Più Pronunciata)
    ctx.save();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2)) * 1.1;
    const innerRadius = canvas.width * 0.05; 

    const gradient = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius);
    // PALETTE.DARK_BACKGROUND ('#411d31') -> rgb(65, 29, 49)
    gradient.addColorStop(0, 'rgba(65, 29, 49, 0)');    
    gradient.addColorStop(0.60, 'rgba(65, 29, 49, 0.3)'); 
    gradient.addColorStop(1, 'rgba(65, 29, 49, 0.80)');   

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // // 4. Ghost Characters (RIMOSSI)
    // // La sezione seguente è stata commentata/rimossa:
    // /*
    // ctx.save(); 
    // const ghostChars = ['0', '1', '{', '}', ';', '#', '$', '%', '*', '>', '<', '/', '(', ')', '[', ']'];
    // ctx.fillStyle = 'rgba(48, 225, 185, 0.15)'; 
    // ctx.font = '15px "Source Code Pro", "Courier New", monospace'; 
    // const numberOfGhostChars = 80; 
    // for (let i = 0; i < numberOfGhostChars; i++) { 
    //     const char = ghostChars[Math.floor(Math.random() * ghostChars.length)];
    //     const x = Math.random() * canvas.width;
    //     const y = Math.random() * canvas.height;
    //     ctx.fillText(char, x, y); 
    // }
    // ctx.restore(); 
    // */
}

function drawGlitchText(text, x, y, fontSize, primaryColor, glitchColor1, glitchColor2, glitchOffsetX = 2, glitchOffsetY = 1) {
    const baseFont = `"Source Code Pro", "Courier New", Courier, monospace`;
    ctx.font = `bold ${fontSize}px ${baseFont}`;
    ctx.textAlign = 'center';

    // Livello glitch 1
    ctx.fillStyle = glitchColor1;
    ctx.fillText(text, x + glitchOffsetX, y + glitchOffsetY);

    // Livello glitch 2
    ctx.fillStyle = glitchColor2;
    ctx.fillText(text, x - glitchOffsetX, y - glitchOffsetY);
    
    // Testo principale
    ctx.fillStyle = primaryColor;
    ctx.fillText(text, x, y);
}

function drawMenuScreen() {
    ctx.fillStyle = PALETTE.DARK_BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawTerminalBackgroundEffects();

    // --- Titolo Principale ---
    const mainTitle = "asyncDonkey: Code Rush"; // O il titolo che preferisci
    ctx.fillStyle = PALETTE.BRIGHT_GREEN_TEAL;
    ctx.font = 'bold 48px "Source Code Pro", "Courier New", Courier, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(mainTitle, canvas.width / 2, canvas.height / 2 - 180); // Spostato più in alto

    // --- Sottotitolo Glitch ---
    const subTitleText = "F!ght GlI7chz!llA";
    drawGlitchText(
        subTitleText,
        canvas.width / 2,
        canvas.height / 2 - 130, // Sotto il titolo principale
        38, // Dimensione font per il sottotitolo
        PALETTE.BRIGHT_GREEN_TEAL,  // Colore primario del testo
        PALETTE.MEDIUM_PURPLE,      // Colore glitch 1
        PALETTE.BRIGHT_TEAL,        // Colore glitch 2
        2,                          // Offset X per glitch
        1                           // Offset Y per glitch
    );

    // --- Istruzioni (leggibili) ---
    ctx.fillStyle = PALETTE.BRIGHT_GREEN_TEAL;
    ctx.font = '22px "Source Code Pro", "Courier New", Courier, monospace';
    ctx.textAlign = 'center'; // Centra "OBJECTIVES"
    ctx.fillText("OBJECTIVES:", canvas.width / 2, canvas.height / 2 - 60);

    ctx.font = '18px "Source Code Pro", "Courier New", Courier, monospace';
    ctx.textAlign = 'left';
    const instructionStartX = canvas.width / 2 - 200;
    let currentY = canvas.height / 2 - 20; // Abbassato leggermente
    const lineHeight = 28;

    ctx.fillText("   JUMP: [SPACE] / [ARROW UP]", instructionStartX, currentY);
    currentY += lineHeight;
    ctx.fillText("  SHOOT: [CTRL] / [X]", instructionStartX, currentY);
    currentY += lineHeight;
    ctx.fillText("  AVOID: CodeBlocks & Malware Threats", instructionStartX, currentY);
    currentY += lineHeight;
    ctx.fillText(" PURGE: Corrupted Virus Programs", instructionStartX, currentY);
    currentY += lineHeight;
    ctx.fillText("COLLECT: System Exploits (Power-Ups)", instructionStartX, currentY);

    // --- Prompt di Avvio (Glitchato) ---
    const startPromptText = isTouchDevice ? "TAP TO START" : "PRESS ENTER TO START";
    drawGlitchText(
        startPromptText,
        canvas.width / 2,
        canvas.height - 70,
        28, // Dimensione font
        PALETTE.BRIGHT_TEAL,        // Colore primario
        PALETTE.MEDIUM_PURPLE,      // Colore glitch 1
        PALETTE.BRIGHT_GREEN_TEAL,  // Colore glitch 2 (invertito per varietà)
        3,                          // Offset X più marcato per il prompt
        1.5                         // Offset Y
    );
}

function updatePlaying(dt) {
    if (gameOverTrigger) {
        finalScore = score; // Assicurati che finalScore sia impostato
        // currentGameState = GAME_STATE.GAME_OVER; // Questo viene fatto in processGameOver
        AudioManager.stopMusic(); // Ferma la musica se non già fatto
        processGameOver(); // <<< NUOVA CHIAMATA per gestire la logica di fine gioco e input punteggio
        return; // Esce da updatePlaying una volta che il gioco è finito
    }

    if (asyncDonkey) {
        asyncDonkey.update(dt); // Aggiorna la logica del giocatore (gravità, onGround, animazione)
    }

    spawnGlitchzillaIfNeeded();
    if (activeMiniboss) {
        updateProjectiles(dt); 
        enemyProjectiles.forEach((ep,i)=>{ep.update(dt);if(ep.x+ep.width<0)enemyProjectiles.splice(i,1);});
    } else {
        spawnObstacleIfNeeded(dt);updateObstacles(dt);
        spawnEnemyBaseIfNeeded(dt);spawnFastEnemyIfNeeded(dt);spawnArmoredEnemyIfNeeded(dt);spawnShootingEnemyIfNeeded(dt);
        spawnArmoredShootingEnemyIfNeeded(dt); spawnToughBasicEnemyIfNeeded(dt); spawnDangerousFlyingEnemyIfNeeded(dt);
        updateProjectiles(dt);
    }
    updateAllEnemyTypes(dt); 
    spawnFlyingEnemyIfNeeded(dt);

    spawnPowerUpAmbientIfNeeded(dt); updatePowerUpItems(dt);
    updateShootCooldown(dt);
    checkCollisions();
}

function drawPlayingScreen() {
    ctx.fillStyle = PALETTE.DARK_BACKGROUND; // Nuovo sfondo per l'area di gioco
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawTerminalBackgroundEffects();
    drawGround(); // La linea di terra userà il nuovo colore da drawGround()

    if (!activeMiniboss) {
        drawObstacles();
    }
    drawAllEnemyTypes();
    drawPowerUpItems();
    drawProjectiles();

    if (asyncDonkey) asyncDonkey.draw();

    // Disegna Punteggio
    ctx.fillStyle = PALETTE.BRIGHT_GREEN_TEAL; // Nuovo colore per il testo del punteggio
    ctx.font = '24px "Source Code Pro", "Courier New", Courier, monospace';
    ctx.textAlign = 'left';
    ctx.fillText("Score: " + score, 20, 40);

    // Disegna Timer Power-Up (già modificato per la posizione, il colore del testo è gestito da POWERUP_COLORS)
    if (asyncDonkey && asyncDonkey.activePowerUp && asyncDonkey.powerUpTimer > 0) {
        const powerUpColor = (POWERUP_COLORS && POWERUP_COLORS[asyncDonkey.activePowerUp]) ? POWERUP_COLORS[asyncDonkey.activePowerUp] : PALETTE.BRIGHT_TEAL; // Fallback alla palette
        ctx.fillStyle = powerUpColor;
        ctx.font = '18px "Source Code Pro", "Courier New", Courier, monospace';
        ctx.textAlign = 'left';
        let powerUpDisplayName = POWERUP_THEMATIC_NAMES[asyncDonkey.activePowerUp] || asyncDonkey.activePowerUp.replace(/_/g, ' ');
        ctx.fillText(`${powerUpDisplayName}: ${asyncDonkey.powerUpTimer.toFixed(1)}s`, 20, 70);
    }
}

function drawGameOverScreen() {
    ctx.fillStyle = PALETTE.DARK_BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawTerminalBackgroundEffects();

    // --- Messaggio "GAME OVER" Glitchato ---
    drawGlitchText(
        "G A M E   O V E R",
        canvas.width / 2,
        canvas.height / 2 - 70,
        60, // Dimensione Font
        PALETTE.MEDIUM_PURPLE,      // Colore primario d'impatto (diverso dal menu)
        PALETTE.BRIGHT_GREEN_TEAL,  // Colore glitch 1
        PALETTE.BRIGHT_TEAL,        // Colore glitch 2
        4,                          // Offset X per un glitch più forte
        2                           // Offset Y
    );

    // --- Punteggio Finale (leggibile) ---
    ctx.fillStyle = PALETTE.BRIGHT_GREEN_TEAL;
    ctx.font = '32px "Source Code Pro", "Courier New", Courier, monospace';
    ctx.textAlign = 'center';
    ctx.fillText("Final Score: " + finalScore, canvas.width / 2, canvas.height / 2 + 10); // Leggermente più in basso

    // --- Prompt di Riavvio (Glitchato) ---
    const restartPromptText = isTouchDevice ? "TAP TO RESTART" : "PRESS ENTER TO RESTART";
    drawGlitchText(
        restartPromptText,
        canvas.width / 2,
        canvas.height / 2 + 70,
        22, // Dimensione font
        PALETTE.BRIGHT_TEAL,        // Colore primario
        PALETTE.MEDIUM_PURPLE,      // Colore glitch 1
        PALETTE.BRIGHT_GREEN_TEAL,  // Colore glitch 2
        3,
        1.5
    );
}


function gameLoop(timestamp){
    const deltaTime=(timestamp-lastTime)/1000||0;
    lastTime=timestamp; // Assign to existing global variable
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(!resourcesInitialized){
        ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle='#0f0';ctx.font='20px "Courier New",Courier,monospace';
        ctx.textAlign='center';ctx.fillText("Loading Resources...",canvas.width/2,canvas.height/2);
        gameLoopRequestId=requestAnimationFrame(gameLoop);return;
    }
    switch(currentGameState){
        case GAME_STATE.MENU:drawMenuScreen();break;
        case GAME_STATE.PLAYING:updatePlaying(deltaTime);drawPlayingScreen();break;
        case GAME_STATE.GAME_OVER:drawGameOverScreen();break;
    }
    gameLoopRequestId=requestAnimationFrame(gameLoop);
}
function startGameLoop(){
    if(gameLoopRequestId!==null) cancelAnimationFrame(gameLoopRequestId);
    lastTime=performance.now(); // Assign to existing global variable
    console.log("Avvio Game Loop...");
    gameLoopRequestId=requestAnimationFrame(gameLoop);
}

// --- EVENT LISTENERS PER NUOVI BOTTONI ---
if (jumpButton) {
    jumpButton.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (AudioManager.audioContext && AudioManager.audioContext.state === "suspended") {
            AudioManager.audioContext.resume().catch(err => console.error("Errore resume AudioContext:", err));
        }
        if (currentGameState === GAME_STATE.PLAYING && asyncDonkey) {
            asyncDonkey.jump();
        } else if (currentGameState === GAME_STATE.MENU) {
            AudioManager.playMusic(false);
            currentGameState = GAME_STATE.PLAYING;
            resetGame();
        } else if (currentGameState === GAME_STATE.GAME_OVER) {
            currentGameState = GAME_STATE.PLAYING;
            resetGame();
            AudioManager.playMusic(false);
        }
    });
    jumpButton.addEventListener('click', function(e) { // Fallback per click
         if (currentGameState === GAME_STATE.PLAYING && asyncDonkey) {
            asyncDonkey.jump();
        }
    });
}

if (shootButton) {
    shootButton.addEventListener('touchstart', function(e) {
        e.preventDefault();
         if (AudioManager.audioContext && AudioManager.audioContext.state === "suspended") {
            AudioManager.audioContext.resume().catch(err => console.error("Errore resume AudioContext:", err));
        }
        if (currentGameState === GAME_STATE.PLAYING && asyncDonkey) {
            asyncDonkey.shoot();
        }
    });
     shootButton.addEventListener('click', function(e) { // Fallback per click
         if (currentGameState === GAME_STATE.PLAYING && asyncDonkey) {
            asyncDonkey.shoot();
        }
    });
}

if (fullscreenButton) {
    fullscreenButton.addEventListener('click', function() {
        toggleFullscreen();
    });
}

if (saveScoreBtnDonkey) {
    saveScoreBtnDonkey.addEventListener('click', handleSaveDonkeyScore);
}

if (restartGameBtnDonkey) {
    restartGameBtnDonkey.addEventListener('click', () => {
        if(scoreInputContainerDonkey) scoreInputContainerDonkey.style.display = 'none'; // Nascondi input
        currentGameState = GAME_STATE.PLAYING;
        resetGame();
        AudioManager.playMusic(false); // Ricomincia la musica
    });
}

// Potresti voler modificare l'event listener 'keydown' e 'touchstart' del jumpButton
// per gestire il riavvio se scoreInputContainerDonkey è visibile e l'utente preme Enter/Tap
// senza aver cliccato "Salva" o "Ricomincia".
// Per ora, il pulsante esplicito restartGameBtnDonkey è la via più chiara.

// Assicurati che la funzione resetGame() nasconda anche scoreInputContainerDonkey
// e restartGameBtnDonkey all'inizio di una nuova partita.

// --- FULLSCREEN FUNCTIONALITY ---
function toggleFullscreen() {
    if (!document.fullscreenElement &&
        !document.mozFullScreenElement &&
        !document.webkitFullscreenElement &&
        !document.msFullscreenElement) {

        if (gameContainer && gameContainer.requestFullscreen) {
            gameContainer.requestFullscreen();
        } else if (gameContainer && gameContainer.mozRequestFullScreen) {
            gameContainer.mozRequestFullScreen();
        } else if (gameContainer && gameContainer.webkitRequestFullscreen) {
            gameContainer.webkitRequestFullscreen();
        } else if (gameContainer && gameContainer.msRequestFullscreen) {
            gameContainer.msRequestFullscreen();
        }
        // Testo aggiornato da event listener 'fullscreenchange'
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        // Testo aggiornato da event listener 'fullscreenchange'
    }
}

function updateFullscreenButtonText() {
    if (!document.fullscreenElement && !document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
        if(fullscreenButton) fullscreenButton.textContent = "FULLSCREEN";
    } else {
        if(fullscreenButton) fullscreenButton.textContent = "ESCI FULLSCREEN";
    }
}
document.addEventListener('fullscreenchange', updateFullscreenButtonText);
document.addEventListener('webkitfullscreenchange', updateFullscreenButtonText);
document.addEventListener('mozfullscreenchange', updateFullscreenButtonText);
document.addEventListener('MSFullscreenChange', updateFullscreenButtonText);


// KEYBOARD EVENT LISTENER
window.addEventListener('keydown',(e)=>{
    if(!resourcesInitialized) return;

    if (AudioManager.audioContext && AudioManager.audioContext.state === "suspended") {
        AudioManager.audioContext.resume().catch(err => console.error("Errore nel riprendere AudioContext:", err));
    }

    switch(currentGameState){
        case GAME_STATE.MENU:
            if(e.key==='Enter'){
                AudioManager.playMusic(false);
                currentGameState=GAME_STATE.PLAYING;
                resetGame();
            }
            break; // Added break
        case GAME_STATE.PLAYING:
            if(asyncDonkey){
                if(e.code==='Space'||e.key==='ArrowUp'){e.preventDefault();asyncDonkey.jump();}
                if(e.code==='ControlLeft'||e.key==='x'||e.key==='X'||e.key==='ControlRight'){e.preventDefault();asyncDonkey.shoot();}
            }
            break; // Added break
        case GAME_STATE.GAME_OVER:
            if(e.key==='Enter'){
                currentGameState=GAME_STATE.PLAYING;
                resetGame();
                AudioManager.playMusic(false);
            }
            break; // Added break
    }
}); // Semicolon for addEventListener statement

// INIZIO CARICAMENTO ASSETS E GIOCO
loadAllAssets();

console.log("Fine script donkeyRunner.js (esecuzione iniziale). In attesa caricamento assets...");