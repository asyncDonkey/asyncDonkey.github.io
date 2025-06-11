// js/donkeyRunner.js
import { SpriteAnimation } from './animation.js';
import {
    PowerUpItem,
    POWERUP_TYPE,
    POWERUP_DURATION,
    POWERUP_CONFIGS, // Importa POWERUP_CONFIGS
} from './powerUps.js';
import * as AudioManager from './audioManager.js';
import { db, auth, generateBlockieAvatar } from './main.js';
import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    serverTimestamp,
    where,
    addDoc,
    doc,
    getDoc,
    documentId,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { showToast } from './toastNotifications.js';

import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';
import { functions } from './firebase-config.js'; // Assicurati di esportare 'functions' da firebase-config

const PALETTE = {
    DARK_BACKGROUND: '#411d31',
    MEDIUM_PURPLE: '#631b34',
    DARK_TEAL_BLUE: '#32535f',
    MEDIUM_TEAL: '#0b8a8f',
    BRIGHT_TEAL: '#0eaf9b',
    BRIGHT_GREEN_TEAL: '#30e1b9',
};

// Declare global DOM element variables with 'let' and no initial assignment
// They will be assigned in setupGameEngine() once the DOM is ready.
let miniLeaderboardListEl = null;

let creditsModal = null;
let closeCreditsModalBtn = null;
let accordionHeaders = null;
let scrollToTutorialLink = null;
let orientationPromptEl = null;
let dismissOrientationPromptBtn = null;

let canvas = null;
let ctx = null;

let gameContainer = null;
let jumpButton = null;
let shootButton = null;
let mobileControlsDiv = null;
let fullscreenButton = null;
let scoreInputContainerDonkey = null;

let saveScoreBtnDonkey = null;
let restartGameBtnDonkey = null;
let mobileStartButton = null;
let shareScoreBtnDonkey = null;
let backToMenuBtn = null; // Nuovo: Riferimento al pulsante "Torna al Menu"
let accountIconBtn = null; // Nuovo: Riferimento all'icona account/login
let mainMenuBtn = null; // Pulsante per tornare al menu
let accountIconContainer = null; // Riferimento al contenitore dell'icona profilo

let isTouchDevice = false; // Will be set in setupGameEngine
let isIPhone = false;     // Will be set in setupGameEngine

let activeMiniboss = null;

// Constants remain 'const'
const groundHeight = 70;

const PLAYER_JUMP_VELOCITY_INITIAL = -850; // px/s (valore da testare/affinare)
const GRAVITY_ACCELERATION = 2000; // px/s^2 (valore da testare/affinare)

let gameSpeed = 220;
const lineWidth = 2;
const GLOBAL_SPRITE_SCALE_FACTOR = 1.5;

const WARNING_EXCLAMATION_COLOR = 'red';
const WARNING_EXCLAMATION_FONT = 'bold 28px "Courier New", monospace';
const WARNING_EXCLAMATION_OFFSET_Y = -20;
const WARNING_DURATION = 0.4;

const PLAYER_SPRITESHEET_SRC = 'images/asyncDonkey_walk.png';
const PLAYER_ACTUAL_FRAME_WIDTH = 32;
const PLAYER_ACTUAL_FRAME_HEIGHT = 32;
const PLAYER_NUM_WALK_FRAMES = 5;
const PLAYER_TARGET_WIDTH = 60;
const PLAYER_TARGET_HEIGHT = 60;

const PLAYER_PROJECTILE_SPRITE_SRC = 'images/bitProjectile.png';
const PLAYER_UPGRADED_PROJECTILE_SPRITE_SRC = 'images/playerUpgradedProjectile.png';
const PLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH = 24;
const PLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT = 8;
const PLAYER_PROJECTILE_NUM_FRAMES = 4;
const PLAYER_PROJECTILE_ANIMATION_SPEED = 0.08;
const PLAYER_PROJECTILE_TARGET_WIDTH = PLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const PLAYER_PROJECTILE_TARGET_HEIGHT = PLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const PROJECTILE_VERTICAL_OFFSET = 15 * GLOBAL_SPRITE_SCALE_FACTOR;

const OBSTACLE_SPRITE_SRC = 'images/codeBlock.png';
const OBSTACLE_ACTUAL_FRAME_WIDTH = 32;
const OBSTACLE_ACTUAL_FRAME_HEIGHT = 32;
const OBSTACLE_NUM_FRAMES = 1;
const OBSTACLE_TARGET_WIDTH = OBSTACLE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const OBSTACLE_TARGET_HEIGHT = OBSTACLE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const OBSTACLE_HEALTH = 1;

const ENEMY_ONE_SPRITE_SRC = 'images/enemyOne.png';
const ENEMY_ONE_ACTUAL_FRAME_WIDTH = 48;
const ENEMY_ONE_ACTUAL_FRAME_HEIGHT = 64;
const ENEMY_ONE_NUM_FRAMES = 4;
const ENEMY_ONE_TARGET_WIDTH = ENEMY_ONE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_ONE_TARGET_HEIGHT = ENEMY_ONE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;

const ENEMY_TWO_SPRITE_SRC = 'images/enemyTwo.png';
const ENEMY_TWO_ACTUAL_FRAME_WIDTH = 40;
const ENEMY_TWO_ACTUAL_FRAME_HEIGHT = 56;
const ENEMY_TWO_NUM_FRAMES = 4;
const ENEMY_TWO_TARGET_WIDTH = ENEMY_TWO_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_TWO_TARGET_HEIGHT = ENEMY_TWO_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;

const ENEMY_THREE_BASE_SRC = 'images/enemyThree.png';
const ENEMY_THREE_DMG1_SRC = 'images/enemyThreeDmgOne.png';
const ENEMY_THREE_DMG2_SRC = 'images/enemyThreeDmgTwo.png';
const ENEMY_THREE_ACTUAL_FRAME_WIDTH = 56;
const ENEMY_THREE_ACTUAL_FRAME_HEIGHT = 72;
const ENEMY_THREE_NUM_FRAMES = 4;
const ENEMY_THREE_TARGET_WIDTH = ENEMY_THREE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_THREE_TARGET_HEIGHT = ENEMY_THREE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const ARMORED_ENEMY_HEALTH = 3;

const ENEMY_FOUR_IDLE_SRC = 'images/enemyFour.png';
const ENEMY_FOUR_ACTUAL_FRAME_WIDTH = 48;
const ENEMY_FOUR_ACTUAL_FRAME_HEIGHT = 72;
const ENEMY_FOUR_IDLE_NUM_FRAMES = 4;
const ENEMY_FOUR_TARGET_WIDTH = ENEMY_FOUR_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_FOUR_TARGET_HEIGHT = ENEMY_FOUR_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const SHOOTING_ENEMY_SHOOT_INTERVAL = 2.5;
const SHOOTING_ENEMY_PROJECTILE_SOUND = 'audio/enemy_shoot_light.mp3';

const ENEMY_FOUR_PROJECTILE_SPRITE_SRC = 'images/enemyFourProjectile.png';
const ENEMY_FOUR_PROJECTILE_ACTUAL_FRAME_WIDTH = 16;
const ENEMY_FOUR_PROJECTILE_ACTUAL_FRAME_HEIGHT = 16;
const ENEMY_FOUR_PROJECTILE_NUM_FRAMES = 4;
const ENEMY_FOUR_PROJECTILE_TARGET_WIDTH = ENEMY_FOUR_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_FOUR_PROJECTILE_TARGET_HEIGHT = ENEMY_FOUR_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;

const ENEMY_FIVE_SPRITE_SRC = 'images/enemyFive.png';
const ENEMY_FIVE_ACTUAL_FRAME_WIDTH = 32;
const ENEMY_FIVE_ACTUAL_FRAME_HEIGHT = 32;
const ENEMY_FIVE_NUM_FRAMES = 4;
const ENEMY_FIVE_TARGET_WIDTH = ENEMY_FIVE_ACTUAL_FRAME_WIDTH * 1.5;
const ENEMY_FIVE_TARGET_HEIGHT = ENEMY_FIVE_ACTUAL_FRAME_HEIGHT * 1.5;

const ENEMY_SIX_BASE_SRC = 'images/enemySix.png';
const ENEMY_SIX_DMG1_SRC = 'images/enemySixDmg1.png';
const ENEMY_SIX_DMG2_SRC = 'images/enemySixDmg2.png';
const ENEMY_SIX_DMG3_SRC = 'images/enemySixDmg3.png';
const ENEMY_SIX_ACTUAL_FRAME_WIDTH = 64;
const ENEMY_SIX_ACTUAL_FRAME_HEIGHT = 80;
const ENEMY_SIX_IDLE_NUM_FRAMES = 4;
const ENEMY_SIX_TARGET_WIDTH = ENEMY_SIX_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_SIX_TARGET_HEIGHT = ENEMY_SIX_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const ARMORED_SHOOTING_ENEMY_HEALTH = 4;
const ARMORED_SHOOTING_ENEMY_SHOOT_INTERVAL = 3.0;
const ARMORED_SHOOTING_ENEMY_PROJECTILE_SOUND = 'audio/enemy_shoot_heavy.mp3';

const ENEMY_SIX_PROJECTILE_SPRITE_SRC = 'images/enemySixProjectile.png';
const ENEMY_SIX_PROJECTILE_ACTUAL_FRAME_WIDTH = 20;
const ENEMY_SIX_PROJECTILE_ACTUAL_FRAME_HEIGHT = 20;
const ENEMY_SIX_PROJECTILE_NUM_FRAMES = 4;
const ENEMY_SIX_PROJECTILE_TARGET_WIDTH = ENEMY_SIX_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_SIX_PROJECTILE_TARGET_HEIGHT = ENEMY_SIX_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;

const ENEMY_SEVEN_BASE_SRC = 'images/enemySeven.png';
const ENEMY_SEVEN_DMG1_SRC = 'images/enemySevenDmg1.png';
const ENEMY_SEVEN_ACTUAL_FRAME_WIDTH = 48;
const ENEMY_SEVEN_ACTUAL_FRAME_HEIGHT = 64;
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
const GLITCHZILLA_ACTUAL_FRAME_WIDTH = 96;
const GLITCHZILLA_ACTUAL_FRAME_HEIGHT = 96;
const GLITCHZILLA_NUM_FRAMES = 4;
const GLITCHZILLA_TARGET_WIDTH = GLITCHZILLA_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR * 1.2;
const GLITCHZILLA_TARGET_HEIGHT = GLITCHZILLA_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR * 1.2;
const GLITCHZILLA_HEALTH = 40; // 40
const GLITCHZILLA_SCORE_VALUE = 500;
const GLITCHZILLA_SPAWN_SCORE_THRESHOLD = 2000;

const GLITCHZILLA_PROJECTILE_SPRITE_SRC = 'images/glitchzillaProjectile.png';
const GLITCHZILLA_PROJECTILE_ACTUAL_FRAME_WIDTH = 24;
const GLITCHZILLA_PROJECTILE_ACTUAL_FRAME_HEIGHT = 24;
const GLITCHZILLA_PROJECTILE_NUM_FRAMES = 4;
const GLITCHZILLA_PROJECTILE_TARGET_WIDTH = GLITCHZILLA_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const GLITCHZILLA_PROJECTILE_TARGET_HEIGHT = GLITCHZILLA_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;

// Aggiungi queste costanti subito dopo le costanti GLITCHZILLA_...

// --- TROJAN_BYTE (Boss 2) Constants ---
const TROJAN_BYTE_BASE_SRC = 'images/trojanByte_base.png';
const TROJAN_BYTE_DMG1_SRC = 'images/trojanByte_dmg1.png';
const TROJAN_BYTE_DMG2_SRC = 'images/trojanByte_dmg2.png';
const TROJAN_BYTE_DMG3_SRC = 'images/trojanByte_dmg3.png';
const TROJAN_BYTE_ACTUAL_FRAME_WIDTH = 80; // Larghezza sprite suggerita
const TROJAN_BYTE_ACTUAL_FRAME_HEIGHT = 80; // Altezza sprite suggerita
const TROJAN_BYTE_NUM_FRAMES = 4; // Assumendo 4 frame per animazione
const TROJAN_BYTE_TARGET_WIDTH = TROJAN_BYTE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR * 1.1; // Leggermente più grande di glitchzilla
const TROJAN_BYTE_TARGET_HEIGHT = TROJAN_BYTE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR * 1.1;
const TROJAN_BYTE_HEALTH = 80; // HP suggeriti 80
const TROJAN_BYTE_SCORE_VALUE = 1000; // Valore punteggio
const TROJAN_BYTE_SPAWN_SCORE_THRESHOLD = 5000; // Soglia di apparizione 5000
const TROJAN_BYTE_PROJECTILE_SPRITE_SRC = 'images/trojanByteProjectile.png';
const TROJAN_BYTE_PROJECTILE_ACTUAL_FRAME_WIDTH = 16;
const TROJAN_BYTE_PROJECTILE_ACTUAL_FRAME_HEIGHT = 16;
const TROJAN_BYTE_PROJECTILE_NUM_FRAMES = 4; // Assumendo 4 frame per animazione
const TROJAN_BYTE_PROJECTILE_TARGET_WIDTH = TROJAN_BYTE_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const TROJAN_BYTE_PROJECTILE_TARGET_HEIGHT = TROJAN_BYTE_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const TROJAN_BYTE_PROJECTILE_SPEED = 200; // Velocità proiettili

// --- MISSING_NUMBER (Boss 3) Constants ---
const MISSING_NUMBER_BASE_SRC = 'images/missingNumber_base.png';
const MISSING_NUMBER_DMG1_SRC = 'images/missingNumber_dmg1.png';
const MISSING_NUMBER_DMG2_SRC = 'images/missingNumber_dmg2.png';
const MISSING_NUMBER_DMG3_SRC = 'images/missingNumber_dmg3.png';
const MISSING_NUMBER_ACTUAL_FRAME_WIDTH = 70; // Larghezza sprite suggerita
const MISSING_NUMBER_ACTUAL_FRAME_HEIGHT = 70; // Altezza sprite suggerita
const MISSING_NUMBER_NUM_FRAMES = 4; // Assumendo 4 frame per animazione
const MISSING_NUMBER_TARGET_WIDTH = MISSING_NUMBER_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR * 1.1;
const MISSING_NUMBER_TARGET_HEIGHT = MISSING_NUMBER_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR * 1.1;
const MISSING_NUMBER_HEALTH = 120; // HP suggeriti
const MISSING_NUMBER_SCORE_VALUE = 1500; // Valore punteggio
const MISSING_NUMBER_SPAWN_SCORE_THRESHOLD = 9500; // Soglia di apparizione 10000
const MISSING_NUMBER_PROJECTILE_SPRITE_SRC = 'images/missingNumberProjectile.png';
const MISSING_NUMBER_PROJECTILE_ACTUAL_FRAME_WIDTH = 12;
const MISSING_NUMBER_PROJECTILE_ACTUAL_FRAME_HEIGHT = 12;
const MISSING_NUMBER_PROJECTILE_NUM_FRAMES = 4; // Assumendo 4 frame per animazione
const MISSING_NUMBER_PROJECTILE_TARGET_WIDTH = MISSING_NUMBER_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const MISSING_NUMBER_PROJECTILE_TARGET_HEIGHT = MISSING_NUMBER_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const MISSING_NUMBER_PROJECTILE_SPEED = 300; // Velocità proiettili più piccoli

// --- SLAYER_SUBROUTINE (Power-Up Permanente) Constants ---
const SLAYER_PROJECTILE_SPRITE_SRC = 'images/slay_projectile.png'; // Percorso sprite proiettile
const SLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH = 24;
const SLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT = 8;
const SLAYER_PROJECTILE_NUM_FRAMES = 4;
const SLAYER_PROJECTILE_TARGET_WIDTH = SLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const SLAYER_PROJECTILE_TARGET_HEIGHT = SLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const SLAYER_PROJECTILE_DAMAGE = 2; // Danno del proiettile slayer

// --- CODE_INJECTOR (Power-Up Permanente) Constants ---
const CODE_INJECTOR_PROJECTILE_SPRITE_SRC = 'images/inject_projectile.png'; // Percorso sprite proiettile
const CODE_INJECTOR_PROJECTILE_ACTUAL_FRAME_WIDTH = 24;
const CODE_INJECTOR_PROJECTILE_ACTUAL_FRAME_HEIGHT = 8;
const CODE_INJECTOR_PROJECTILE_NUM_FRAMES = 4;
const CODE_INJECTOR_PROJECTILE_TARGET_WIDTH = CODE_INJECTOR_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const CODE_INJECTOR_PROJECTILE_TARGET_HEIGHT = CODE_INJECTOR_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const CODE_INJECTOR_PROJECTILE_DAMAGE = 3; // Danno del proiettile injector


const ENEMY_PROJECTILE_SPEED = 250;

const POWERUP_THEMATIC_NAMES = {
    [POWERUP_TYPE.TRIPLE_SHOT]: 'Multi-Thread',
    [POWERUP_TYPE.SHIELD]: 'Active Shield',
    [POWERUP_TYPE.SMART_BOMB]: 'System Cleanup',
    [POWERUP_TYPE.DEBUG_MODE]: 'Debug Payload',
    [POWERUP_TYPE.FIREWALL]: 'Solid Firewall',
    [POWERUP_TYPE.BLOCK_BREAKER]: 'Decompiler',
    [POWERUP_TYPE.SLAYER_SUBROUTINE]: 'Slayer Subroutine', // Nuovo nome tematico
    [POWERUP_TYPE.CODE_INJECTOR]: 'Code Injector', // Nuovo nome tematico
};

const soundsToLoad = [
    { name: 'jump', path: 'audio/jump.mp3' },
    { name: 'shoot', path: 'audio/shoot.mp3' },
    { name: 'enemyHit', path: 'audio/enemy_hit.mp3' },
    { name: 'enemyExplode', path: 'audio/enemy_explode.mp3' },
    { name: 'playerHit', path: 'audio/player_hit.mp3' },
    { name: 'gameOverSound', path: 'audio/game_over.mp3' },
    { name: 'powerUpCollect', path: 'audio/powerup_collect.mp3' },
    { name: 'shieldBlock', path: 'audio/shield_block.mp3' },
    { name: 'blockBreak', path: 'audio/block_break.mp3' },
    { name: 'enemyShootLight', path: SHOOTING_ENEMY_PROJECTILE_SOUND },
    { name: 'enemyShootHeavy', path: ARMORED_SHOOTING_ENEMY_PROJECTILE_SOUND },
    { name: 'glitchzillaSpawn', path: 'audio/glitchzilla_spawn.mp3' },
    { name: 'glitchzillaHit', path: 'audio/glitchzilla_hit.mp3' },
    { name: 'glitchzillaAttack', path: 'audio/glitchzilla_attack.mp3' },
    { name: 'glitchzillaDefeat', path: 'audio/glitchzilla_defeat.mp3' },
];
const backgroundMusicPath = 'audio/background_music.mp3';

function setupRenderingContext(context) {
    context.imageSmoothingEnabled = false;
    context.mozImageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false;
    context.msImageSmoothingEnabled = false;
    console.log('Image smoothing disabilitato.');
}

const GAME_STATE = { MENU: 'MENU', PLAYING: 'PLAYING', GAME_OVER: 'GAME_OVER' };
let currentGameState = GAME_STATE.MENU;
let asyncDonkey = null;
let playerInitialX = 50;
let playerInitialY = 0;

let images = {};
const imagesToLoad = [];

let imagesLoadedCount = 0;
let allImagesLoaded = false;
let resourcesInitialized = false;
let gameLoopRequestId = null;

let bossFightImminent = false;
let bossWarningTimer = 2.0;
let postBossCooldownActive = false;
let postBossCooldownTimer = 2.0;

let obstacles = [];
let obstacleSpawnTimer = 0;
let nextObstacleSpawnTime = 0;

let projectiles = [];
let canShoot = true;
let shootTimer = 0;
const projectileSpeed = 400;
const shootCooldownTime = 0.3;

let enemies = [];
let enemyBaseSpawnTimer = 0;
let nextEnemyBaseSpawnTime = 0;

let flyingEnemies = [];
let flyingEnemySpawnTimer = 0;
let nextFlyingEnemySpawnTime = 0;
const flyingEnemyScoreValue = 100;
const POWER_UP_DROP_CHANCE_FROM_FLYING_ENEMY = 0.35;

let fastEnemies = [];
let fastEnemySpawnTimer = 0;
let nextFastEnemySpawnTime = 0;
const fastEnemySpeedMultiplier = 1.5;

let armoredEnemies = [];
let armoredEnemySpawnTimer = 0;
let nextArmoredEnemySpawnTime = 0;
const armoredEnemySpeedMultiplier = 0.7;

let shootingEnemies = [];
let shootingEnemySpawnTimer = 0;
let nextShootingEnemySpawnTime = 0;
let enemyProjectiles = [];

let armoredShootingEnemies = [];
let armoredShootingEnemySpawnTimer = 0;
let nextArmoredShootingEnemySpawnTime = 0;

let toughBasicEnemies = [];
let toughBasicEnemySpawnTimer = 0;
let nextToughBasicEnemySpawnTime = 0;

let dangerousFlyingEnemies = [];
let dangerousFlyingEnemySpawnTimer = 0;
let nextDangerousFlyingEnemySpawnTime = 0;

let hasGlitchzillaSpawnedThisGame = false; // Flag per tracciare se Glitchzilla è SPAWNATO in questa partita (trigger della sua comparsa)
let isGlitchzillaDefeatedThisGame = false; // Nuovo: Flag per tracciare se Glitchzilla è STATO SCONFITTO in questa partita
let hasTrojanByteSpawnedThisGame = false; // Flag per tracciare se Trojan_Byte è SPAWNATO
let isTrojanByteDefeatedThisGame = false; // Nuovo: Flag per tracciare se Trojan_Byte è STATO SCONFITTO
let hasMissingNumberSpawnedThisGame = false; // Flag per tracciare se Missing_Number è SPAWNATO
let isMissingNumberDefeatedThisGame = false; // Nuovo: Flag per tracciare se Missing_Number è STATO SCONFITTO

let hasSlayerSubroutineUpgrade = false;
let hasCodeInjectorUpgrade = false;

let powerUpItems = [];
let powerUpSpawnTimer = 0;
let nextPowerUpSpawnTime = 0;

const SCORE_THRESHOLD_FAST_ENEMY = 200;
const SCORE_THRESHOLD_ARMORED_ENEMY = 450;
const SCORE_THRESHOLD_SHOOTING_ENEMY = 700;
const SCORE_THRESHOLD_ARMORED_SHOOTING_ENEMY = 1000;
const SCORE_THRESHOLD_TOUGH_BASIC_ENEMY = 150;
const SCORE_THRESHOLD_DANGEROUS_FLYING_ENEMY = 800;

let score = 0;
let finalScore = 0;
let gameOverTrigger = false;
let lastTime = 0;

let gameStats = {
    jumps: 0,
    shotsFired: 0,
    powerUpsCollected: 0
};

function formatScoreTimestamp(firebaseTimestamp) {
    if (!firebaseTimestamp || typeof firebaseTimestamp.toDate !== 'function') {
        return 'N/A';
    }
    try {
        return firebaseTimestamp.toDate().toLocaleString('it-IT', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (e) {
        console.error('Errore formattazione timestamp:', e);
        return 'Data errata';
    }
}

function getUrlParameter(name) {
    name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// --- Logica per il Prompt di Orientamento Mobile ---
let orientationPromptDismissedSession = false;

function checkAndDisplayOrientationPrompt() {
    if (!orientationPromptEl || !isTouchDevice || orientationPromptDismissedSession) {
        if (orientationPromptEl && orientationPromptEl.style.display !== 'none') {
            orientationPromptEl.style.display = 'none';
        }
        return;
    }

    const isPortrait = window.matchMedia('(orientation: portrait)').matches;
    const isGameFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);

    if (isPortrait && !isGameFullscreen) {
        if (orientationPromptEl.style.display !== 'flex') {
            orientationPromptEl.style.display = 'flex';
        }
    } else {
        if (orientationPromptEl.style.display !== 'none') {
            orientationPromptEl.style.display = 'none';
        }
    }
}
// --- Fine Logica Prompt Orientamento ---

async function handleShareScore() {
    console.log("handleShareScore attivato!");

    if (typeof finalScore === 'undefined' || finalScore < 0) {
        showToast("Nessun punteggio valido da condividere.", "warning");
        console.warn("handleShareScore: finalScore non definito o non valido:", finalScore);
        return;
    }

    // TODO: [Future Task] Rivedere la logica di condivisione del punteggio per renderla più robusta o per aggiungere opzioni.

    let challengerName = "Un Asinello Pixelato";
    const currentUser = auth.currentUser;

    if (currentUser) {
        try {
            const userProfileRef = doc(db, 'userProfiles', currentUser.uid);
            const docSnap = await getDoc(userProfileRef);
            if (docSnap.exists() && docSnap.data().nickname) {
                challengerName = docSnap.data().nickname;
            } else {
                challengerName = currentUser.displayName || currentUser.email.split('@')[0] || "Giocatore Misterioso";
            }
        } catch (error) {
            console.warn("Errore nel recuperare il nome del profilo per la condivisione:", error);
            challengerName = currentUser.displayName || currentUser.email.split('@')[0] || "Giocatore Connesso";
        }
    } else {
        const playerInitialsDonkeyInput = document.getElementById('playerInitialsDonkey');
        if (playerInitialsDonkeyInput && playerInitialsDonkeyInput.value.trim() !== "") {
            challengerName = playerInitialsDonkeyInput.value.trim().toUpperCase();
        }
    }
    console.log("Sfidante:", challengerName, "Punteggio:", finalScore);

    const siteBaseUrl = window.location.origin;
    const gamePath = "/donkeyRunner.html"; // Nota: questo dovrebbe puntare a www/game.html se usato esternamente

    const challengeUrl = `${siteBaseUrl}${gamePath}?challengeScore=${finalScore}&challengerName=${encodeURIComponent(challengerName)}&utm_source=donkey_runner_share&utm_medium=social_share`;

    const shareTitle = "SYSTEM_ALERT: codeDash Challenge!";
    const fullShareText = `WARNING! ${challengerName} (Score: ${finalScore}) ti sfida su codeDash! Accetta il protocollo: ${challengeUrl} 👾`;
    const shortShareText = `// --- INCOMING_CHALLENGE_TRANSMISSION --- //
SYSTEM_ID: asyncDonkey_Runner_Core
SOURCE_AGENT: ${challengerName}
PRIORITY: URGENT 🚨
SUBJECT: High Score Anomaly Detected!

L'agente ${challengerName} ha registrato un punteggio di ${finalScore} e ha avviato il Protocollo di Sfida Competitiva!
Sei chiamato/a a superare questo benchmark. Il sistema conta su di te!

Esegui routine di risposta: ${challengeUrl}
// --- END_OF_TRANSMISSION --- //`;

    console.log("URL Sfida:", challengeUrl);
    console.log("Testo completo:", fullShareText);

    if (navigator.share) {
        try {
            await navigator.share({
                title: shareTitle,
                text: shortShareText,
                url: challengeUrl,
            });
            showToast("Sfida condivisa con successo!", "success");
            console.log("Condivisione nativa riuscita.");
        } catch (error) {
            console.error("Errore durante navigator.share:", error);
            if (error.name !== 'AbortError') {
                showToast("Condivisione annullata o fallita.", "info");
            }
        }
    } else {
        console.log("navigator.share non supportato, uso fallback.");
        fallbackShare(fullShareText, challengeUrl);
    }
}

function fallbackShare(textToShare, urlToShare) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToShare)
            .then(() => {
                showToast("Testo della sfida copiato negli appunti!", "info");
            })
            .catch(err => {
                console.error('Fallback: Impossibile copiare negli appunti:', err);
                alert("Copia questo testo per condividere la tua sfida:\n\n" + textToShare);
            });
    } else {
        alert("Copia questo testo per condividere la tua sfida:\n\n" + textToShare);
    }
}

async function loadDonkeyLeaderboard() {
    if (!miniLeaderboardListEl) {
        console.warn('[donkeyRunner.js] Elemento miniLeaderboardList non trovato.');
        return;
    }
    if (!db) {
        console.error('[donkeyRunner.js] Istanza DB non disponibile per caricare la leaderboard di DonkeyRunner.');
        miniLeaderboardListEl.innerHTML = '<li>Errore connessione DB.</li>';
        return;
    }
    const leaderboardScoresCollection = collection(db, 'leaderboardScores');
    miniLeaderboardListEl.innerHTML =
        '<li><div class="loader-dots"><span></span><span></span><span></span></div> Caricamento...</li>';

    try {
        const q = query(
            leaderboardScoresCollection,
            where('gameId', '==', 'donkeyRunner'),
            orderBy('score', 'desc'),
            limit(5)
        );
        const querySnapshot = await getDocs(q);
        const fetchedLeaderboard = [];
        querySnapshot.forEach((doc) => {
            fetchedLeaderboard.push({ id: doc.id, ...doc.data() });
        });

        const userIds = [...new Set(fetchedLeaderboard.map((entry) => entry.userId).filter((id) => id))];
        const profilesMap = new Map();

        if (userIds.length > 0) {
            const MAX_IDS_PER_IN_QUERY = 30;
            const profilePromises = [];
            for (let i = 0; i < userIds.length; i += MAX_IDS_PER_IN_QUERY) {
                const batchUserIds = userIds.slice(i, i + MAX_IDS_PER_IN_QUERY);
                if (batchUserIds.length > 0) {
                    const profilesQuery = query(
                        collection(db, 'userPublicProfiles'),
                        where(documentId(), 'in', batchUserIds)
                    );
                    profilePromises.push(getDocs(profilesQuery));
                }
            }
            try {
                const profileSnapshotsArray = await Promise.all(profilePromises);
                profileSnapshotsArray.forEach((profileSnaps) => {
                    profileSnaps.forEach((snap) => {
                        if (snap.exists()) {
                            profilesMap.set(snap.id, snap.data());
                        }
                    });
                });
            } catch (profileError) {
                console.error(
                    '[donkeyRunner.js] Errore caricamento profili pubblici per mini leaderboard:',
                    profileError
                );
            }
        }

        displayDonkeyLeaderboard(fetchedLeaderboard, profilesMap);
    } catch (error) {
        console.error('[donkeyRunner.js] Errore caricamento DonkeyRunner leaderboard: ', error);
        if (error.code === 'failed-precondition') {
            miniLeaderboardListEl.innerHTML =
                '<li>Indice Firestore mancante. Controlla la console per il link per crearlo.</li>';
        } else {
            if (miniLeaderboardListEl) miniLeaderboardListEl.innerHTML = '<li>Errore caricamento punteggi.</li>';
        }
    }
}

function displayDonkeyLeaderboard(leaderboardData, profilesMap) {
    if (!miniLeaderboardListEl) return;

    miniLeaderboardListEl.innerHTML = '';
    if (!leaderboardData || leaderboardData.length === 0) {
        miniLeaderboardListEl.innerHTML = '<li>Nessun punteggio registrato.</li>';
        return;
    }

    leaderboardData.forEach((entry, index) => {
        const li = document.createElement('li');

        const rankSpan = document.createElement('span');
        rankSpan.className = 'player-rank';
        rankSpan.textContent = `${index + 1}.`;
        li.appendChild(rankSpan);

        const avatarImg = document.createElement('img');
        avatarImg.className = 'player-avatar';

        const seedForBlockie = entry.userId || entry.initials || entry.userName || `anon-dr-${entry.id}`;
        let userDisplayName = 'Giocatore Anonimo';
        let altTextForAvatar = 'Avatar Giocatore';
        let avatarSrcToUse = generateBlockieAvatar(seedForBlockie, 30, { size: 8 });
        let userNationalityCode = null;

        if (entry.userName) userDisplayName = entry.userName;
        if (entry.initials && !entry.userName) userDisplayName = entry.initials;
        altTextForAvatar = userDisplayName;
        if (entry.nationalityCode) userNationalityCode = entry.nationalityCode;

        const userProfile = entry.userId ? profilesMap.get(entry.userId) : null;

        if (userProfile) {
            userDisplayName = userProfile.displayName || userDisplayName;
            altTextForAvatar = userDisplayName;
            userNationalityCode = userProfile.nationalityCode || userNationalityCode;

            let chosenAvatarUrl = null;
            if (userProfile.avatarUrls) {
                if (userProfile.avatarUrls.small) {
                    chosenAvatarUrl = userProfile.avatarUrls.small;
                } else if (userProfile.avatarUrls.profile) {
                    chosenAvatarUrl = userProfile.avatarUrls.profile;
                } else if (userProfile.avatarUrls.thumbnail) {
                    chosenAvatarUrl = userProfile.avatarUrls.thumbnail;
                }
            }
            if (!chosenAvatarUrl && userProfile.avatarUrl) {
                chosenAvatarUrl = userProfile.avatarUrl;
            }

            if (chosenAvatarUrl) {
                avatarSrcToUse = chosenAvatarUrl;
                if (userProfile.profileUpdatedAt && userProfile.profileUpdatedAt.seconds) {
                    avatarSrcToUse += `?ts=${userProfile.profileUpdatedAt.seconds}`;
                } else if (userProfile.profileUpdatedAt && typeof userProfile.profileUpdatedAt === 'number') {
                    avatarSrcToUse += `?ts=${userProfile.profileUpdatedAt}`;
                }
            }
        }

        avatarImg.src = avatarSrcToUse;
        avatarImg.alt = `${altTextForAvatar}'s Avatar`;
        avatarImg.style.backgroundColor = 'transparent';
        avatarImg.onerror = () => {
            avatarImg.src = generateBlockieAvatar(seedForBlockie, 30, { size: 8 });
            avatarImg.alt = `${altTextForAvatar}'s Fallback Avatar`;
            avatarImg.style.backgroundColor = '#ddd';
            avatarImg.onerror = null;
        };
        li.appendChild(avatarImg);

        const playerInfoDiv = document.createElement('div');
        playerInfoDiv.className = 'player-info';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'player-name';

        if (
            userNationalityCode &&
            userNationalityCode !== 'OTHER' &&
            typeof userNationalityCode === 'string' &&
            userNationalityCode.length === 2
        ) {
            const flagIconSpan = document.createElement('span');
            flagIconSpan.classList.add('fi', `fi-${userNationalityCode.toLowerCase()}`);
            flagIconSpan.title = userNationalityCode;
            flagIconSpan.style.marginRight = '8px';
            flagIconSpan.style.verticalAlign = 'middle';
            nameSpan.appendChild(flagIconSpan);
        }

        if (entry.userId) {
            const profileLink = document.createElement('a');
            profileLink.href = `profile.html?userId=${entry.userId}`;
            profileLink.textContent = userDisplayName;
            nameSpan.appendChild(profileLink);
        } else {
            let guestDisplayName = userDisplayName;
            if (entry.initials && !guestDisplayName.toLowerCase().includes('(ospite)')) {
                guestDisplayName = entry.initials + ' (Ospite)';
            } else if (guestDisplayName === 'Giocatore Anonimo' && (!entry.initials || entry.initials.trim() === '')) {
                guestDisplayName += ' (Ospite)';
            }
            nameSpan.appendChild(document.createTextNode(guestDisplayName));
        }

        const dateSpan = document.createElement('span');
        dateSpan.className = 'player-date';
        dateSpan.textContent = formatScoreTimestamp(entry.timestamp);

        playerInfoDiv.appendChild(nameSpan);
        playerInfoDiv.appendChild(dateSpan);
        li.appendChild(playerInfoDiv);

        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'player-score';
        scoreSpan.textContent = entry.score !== undefined ? entry.score.toLocaleString() : '-';
        li.appendChild(scoreSpan);

        miniLeaderboardListEl.appendChild(li);
    });
}

/**
 * Helper function to prepare the list of assets to load.
 */
function prepareAssetsToLoad() {
    imagesToLoad.length = 0; // Clear existing if this function is called multiple times

    imagesToLoad.push(
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
        { name: 'trojanByteBase', src: TROJAN_BYTE_BASE_SRC },
        { name: 'trojanByteDmg1', src: TROJAN_BYTE_DMG1_SRC },
        { name: 'trojanByteDmg2', src: TROJAN_BYTE_DMG2_SRC },
        { name: 'trojanByteDmg3', src: TROJAN_BYTE_DMG3_SRC },
        { name: 'trojanByteProjectile', src: TROJAN_BYTE_PROJECTILE_SPRITE_SRC },
        { name: 'missingNumberBase', src: MISSING_NUMBER_BASE_SRC },
        { name: 'missingNumberDmg1', src: MISSING_NUMBER_DMG1_SRC },
        { name: 'missingNumberDmg2', src: MISSING_NUMBER_DMG2_SRC },
        { name: 'missingNumberDmg3', src: MISSING_NUMBER_DMG3_SRC },
        { name: 'missingNumberProjectile', src: MISSING_NUMBER_PROJECTILE_SPRITE_SRC },
        { name: 'slayerProjectile', src: SLAYER_PROJECTILE_SPRITE_SRC },
        { name: 'codeInjectorProjectile', src: CODE_INJECTOR_PROJECTILE_SPRITE_SRC },
    );
    

    // Add power-up sprites dynamically
    for (const type in POWERUP_CONFIGS) {
        if (Object.prototype.hasOwnProperty.call(POWERUP_CONFIGS, type)) {
            const config = POWERUP_CONFIGS[type];
            if (config.spriteKey && config.src) {
                imagesToLoad.push({ name: config.spriteKey, src: config.src });
            } else {
                console.warn(`Configurazione src o spriteKey mancante per power-up tipo: ${type}`);
            }
        }
    }
}

function loadImage(name, src) {
    return new Promise((resolve) => {
        if (!src) {
            console.error(`ERRORE: src mancante per l'immagine '${name}'. Impossibile caricare.`);
            imagesLoadedCount++;
            if (imagesLoadedCount === imagesToLoad.length) {
                allImagesLoaded = true;
            }
            resolve(null);
            return;
        }
        const img = new Image();
        images[name] = img;
        img.onload = () => {
            imagesLoadedCount++;
            if (img.naturalWidth === 0) {
                // console.warn(`Immagine caricata ma con naturalWidth 0: ${name} da ${src}`);
            }
            if (imagesLoadedCount === imagesToLoad.length) {
                allImagesLoaded = true;
            }
            resolve(img);
        };
        img.onerror = () => {
            imagesLoadedCount++;
            console.error(`ERRORE caricamento immagine: ${name} da ${src}`);
            images[name] = null;
            if (imagesLoadedCount === imagesToLoad.length) {
                allImagesLoaded = true;
            }
            resolve(null);
        };
        img.src = src;
    });
}

/**
 * Inizializza le variabili principali, ottiene i riferimenti al DOM,
 * e attacca tutti gli event listener necessari. Va chiamata una sola volta.
 */
export function setupGameEngine() {
    console.log("⚙️ setupGameEngine: Inizializzazione motore di gioco...");

    // Get DOM references and assign them to the global 'let' variables
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error("CRITICO: Elemento Canvas non trovato! Impossibile avviare il gioco.");
        return;
    }
    ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 450;
    playerInitialY = canvas.height - groundHeight - PLAYER_TARGET_HEIGHT;

    miniLeaderboardListEl = document.getElementById('miniLeaderboardList');
    // Rimosso: creditsIconBtn = document.getElementById('creditsIconBtn');
    creditsModal = document.getElementById('creditsModal');
    closeCreditsModalBtn = document.getElementById('closeCreditsModalBtn');
    accordionHeaders = document.querySelectorAll('.accordion-header');
    scrollToTutorialLink = document.getElementById('scrollToTutorialLink');
    orientationPromptEl = document.getElementById('orientationPrompt');
    dismissOrientationPromptBtn = document.getElementById('dismissOrientationPrompt');

    gameContainer = document.getElementById('game-container-wrapper');
    jumpButton = document.getElementById('jumpButton');
    shootButton = document.getElementById('shootButton');
    mobileControlsDiv = document.getElementById('mobileControls');
    fullscreenButton = document.getElementById('fullscreenButton');
    scoreInputContainerDonkey = document.getElementById('scoreInputContainerDonkey');

    saveScoreBtnDonkey = document.getElementById('saveScoreBtnDonkey');
    restartGameBtnDonkey = document.getElementById('restartGameBtnDonkey');
    mobileStartButton = document.getElementById('mobileStartButton');
    shareScoreBtnDonkey = document.getElementById('shareScoreBtnDonkey');
    backToMenuBtn = document.getElementById('backToMenuBtn');
    mainMenuBtn = document.getElementById('mainMenuBtn'); // Corretto l'ID
    accountIconContainer = document.getElementById('account-icon-container');

    // Setup iniziale basato sul dispositivo
    isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    isIPhone = /iPhone/i.test(navigator.userAgent);
    if (isTouchDevice) {
        if (mobileControlsDiv) mobileControlsDiv.style.display = 'flex';
        if (fullscreenButton) fullscreenButton.style.display = 'block';
    } else {
        if (mobileControlsDiv) mobileControlsDiv.style.display = 'none';
        if (mobileStartButton) mobileStartButton.style.display = 'none';
    }
    if (fullscreenButton) {
        if (isIPhone) fullscreenButton.style.display = 'none';
        else if (isTouchDevice) fullscreenButton.style.display = 'block';
        else fullscreenButton.style.display = 'none';
    }
    if (jumpButton) jumpButton.innerHTML = '<i class="ph-bold ph-arrow-circle-up"></i>';
    if (shootButton) shootButton.innerHTML = '<i class="ph-bold ph-code"></i>';
    
    prepareAssetsToLoad();
    setupRenderingContext(ctx);
    attachEventListeners();

    console.log("✅ setupGameEngine: Completato.");
}



/**
 * Esegue il caricamento di tutte le immagini e suoni necessari per il gioco.
 * Restituisce una Promise che si risolve quando tutto è caricato.
 */
export async function preloadGameAssets() {
    console.log('⏳ preloadGameAssets: Avvio caricamento assets...');
    if (resourcesInitialized) {
        console.log("Assets già caricati.");
        return;
    }

    const imagePromises = imagesToLoad.map((d) => loadImage(d.name, d.src));
    const soundPromises = soundsToLoad.map((s) => AudioManager.loadSound(s.name, s.path));
    const backgroundMusicPromise = AudioManager.loadBackgroundMusic(backgroundMusicPath);

    await Promise.allSettled([...imagePromises, ...soundPromises, backgroundMusicPromise]);

    console.log('✅ preloadGameAssets: Processo di caricamento assets completato.');
    resourcesInitialized = true;

    // REMOVED: loadDonkeyLeaderboard() from here. It should be triggered when needed (e.g., in leaderboard.html or on Game Over screen display).
    checkAndDisplayOrientationPrompt();
}


/**
 * Fa partire la logica di gioco. Imposta lo stato su PLAYING,
 * resetta le variabili di gioco e avvia la musica e il game loop.
 */
export function launchGame() {
    console.log("🚀 launchGame: Avvio del gioco!");
    if (!resourcesInitialized) {
        console.error("Impossibile avviare il gioco, le risorse non sono state caricate.");
        return;
    }

    if (AudioManager.audioContext && AudioManager.audioContext.state === 'suspended') {
        AudioManager.audioContext.resume().catch(err => console.error('Errore nel riprendere AudioContext:', err));
    }

    currentGameState = 'PLAYING';
    resetGame();
    AudioManager.playMusic(false);

    if (mobileStartButton) mobileStartButton.style.display = 'none';
    if (scoreInputContainerDonkey) scoreInputContainerDonkey.style.display = 'none';

    // **NUOVO**: Nascondi l'icona del profilo quando il gioco inizia
    if (accountIconContainer) {
        accountIconContainer.style.display = 'none';
    }

    if (mobileControlsDiv) {
        mobileControlsDiv.style.setProperty('display', isTouchDevice ? 'flex' : 'none', 'important');
    }

    if (gameLoopRequestId === null) {
        startGameLoop();
    }
}

// --- Classi di Gioco ---
class Player {
    constructor(x, y, dw, dh) {
        this.x = x;
        this.y = y;
        this.displayWidth = dw;
        this.displayHeight = dh;
        this.velocityY = 0;
        this.onGround = true;
        const pXRatio = 20 / 120;
        const pYRatio = 10 / 120;
        const pX = this.displayWidth * pXRatio;
        const pY = this.displayHeight * pYRatio;
        this.colliderWidth = this.displayWidth - pX;
        this.colliderHeight = this.displayHeight - pY;
        this.colliderOffsetX = pX / 2;
        this.colliderOffsetY = pY / 2;
        this.sprite = images['player'];
        this.walkAnimation = null;
        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
            this.walkAnimation = new SpriteAnimation(
                this.sprite,
                PLAYER_ACTUAL_FRAME_WIDTH,
                PLAYER_ACTUAL_FRAME_HEIGHT,
                PLAYER_NUM_WALK_FRAMES
            );
        } else {
            console.error('Sprite del Player non caricato o rotto! Animazione non creata.');
        }

        this.activePowerUp = null;
        this.powerUpTimer = 0;
        this.isShieldActive = false;
        this.isFirewallActive = false;
        this.isBlockBreakerActive = false;
        // NUOVI FLAG PER I POWER-UP PERMANENTI (Upgrade)
        this.hasSlayerSubroutine = false;
        this.hasCodeInjector = false;
    }

    draw() {
        if (this.isFirewallActive) {
            ctx.save();
            ctx.strokeStyle = PALETTE.BRIGHT_TEAL;
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
            ctx.arc(
                this.x + this.displayWidth / 2,
                this.y + this.displayHeight / 2,
                this.displayWidth / 1.8,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        const spriteUsable = this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0;
        if (this.walkAnimation && spriteUsable) {
            const f = this.walkAnimation.getFrame();
            try {
                ctx.drawImage(
                    this.sprite,
                    f.sx,
                    f.sy,
                    PLAYER_ACTUAL_FRAME_WIDTH,
                    PLAYER_ACTUAL_FRAME_HEIGHT,
                    this.x,
                    this.y,
                    this.displayWidth,
                    this.displayHeight
                );
            } catch (e) {
                this.drawFallback('Err draw P');
            }
        } else {
            this.drawFallback(spriteUsable ? 'P anim non presente' : 'P sprite !complete/broken');
        }
    }

    drawFallback() {
        ctx.fillStyle = 'orange';
        ctx.fillRect(this.x, this.y, this.displayWidth, this.displayHeight);
    }

    update(dt) {
        this.velocityY += GRAVITY_ACCELERATION * dt;
        this.y += this.velocityY * dt;

        if (this.y + this.displayHeight >= canvas.height - groundHeight) {
            this.y = canvas.height - groundHeight - this.displayHeight;
            this.velocityY = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }

        if (this.walkAnimation && this.onGround) {
            this.walkAnimation.update(dt);
        }

        // Solo i power-up temporanei hanno un timer
        if (this.activePowerUp && ![POWERUP_TYPE.SLAYER_SUBROUTINE, POWERUP_TYPE.CODE_INJECTOR].includes(this.activePowerUp)) {
            this.powerUpTimer -= dt;
            if (this.powerUpTimer <= 0) {
                this.deactivatePowerUp();
            }
        }
    }

    jump() {
        if (this.onGround) {
            this.velocityY = PLAYER_JUMP_VELOCITY_INITIAL;
            this.onGround = false;
            AudioManager.playSound('jump');
            gameStats.jumps++;
        }
    }

    shoot() {
        if (canShoot) {
            const projectileYBase = this.y + this.displayHeight / 2 - PLAYER_PROJECTILE_TARGET_HEIGHT / 2;
            let projectileType = 'normal'; // Default
            
            if (this.hasSlayerSubroutine) {
                projectileType = 'slayer';
            } else if (this.hasCodeInjector) {
                projectileType = 'injector';
            } else if (this.activePowerUp === POWERUP_TYPE.DEBUG_MODE) {
                projectileType = 'debug';
            }

            if (this.activePowerUp === POWERUP_TYPE.TRIPLE_SHOT) {
                // Se Triple Shot è attivo, spara 3 proiettili del tipo potenziato più forte disponibile
                projectiles.push(new Projectile(this.x + this.displayWidth, projectileYBase - PROJECTILE_VERTICAL_OFFSET, projectileType));
                projectiles.push(new Projectile(this.x + this.displayWidth, projectileYBase, projectileType));
                projectiles.push(new Projectile(this.x + this.displayWidth, projectileYBase + PROJECTILE_VERTICAL_OFFSET, projectileType));
            } else {
                // Altrimenti, spara un singolo proiettile del tipo potenziato più forte disponibile
                projectiles.push(new Projectile(this.x + this.displayWidth, projectileYBase, projectileType));
            }
            
            AudioManager.playSound('shoot', false, 0.8);
            canShoot = false;
            shootTimer = 0;
            gameStats.shotsFired++;
        }
    }

    activatePowerUp(type) {
        const exclusiveTypes = [POWERUP_TYPE.TRIPLE_SHOT, POWERUP_TYPE.SHIELD, POWERUP_TYPE.SMART_BOMB, POWERUP_TYPE.DEBUG_MODE, POWERUP_TYPE.FIREWALL, POWERUP_TYPE.BLOCK_BREAKER];
        
        // Gestione dei power-up permanenti (upgrade)
        if (type === POWERUP_TYPE.SLAYER_SUBROUTINE) {
            if (!this.hasSlayerSubroutine) {
                this.hasSlayerSubroutine = true;
                this.hasCodeInjector = false; // Slayer sovrascrive Code Injector
                // Disattiva DEBUG_MODE se attivo, dato che Slayer lo rende obsoleto.
                if (this.activePowerUp === POWERUP_TYPE.DEBUG_MODE) {
                    this.deactivatePowerUp(); 
                }
                showToast("Slayer Subroutine ATTIVATO!", "success");
                AudioManager.playSound('powerUpCollect');
                gameStats.powerUpsCollected++;
            }
            return; // Non è un power-up a tempo gestito da activePowerUp/powerUpTimer
        }

        if (type === POWERUP_TYPE.CODE_INJECTOR) {
            // Code Injector può essere attivato solo se Slayer Subroutine NON è già attivo
            if (!this.hasSlayerSubroutine && !this.hasCodeInjector) {
                this.hasCodeInjector = true;
                 // Disattiva DEBUG_MODE se attivo, dato che Code Injector lo rende obsoleto.
                if (this.activePowerUp === POWERUP_TYPE.DEBUG_MODE) {
                    this.deactivatePowerUp(); 
                }
                showToast("Code Injector ATTIVATO!", "success");
                AudioManager.playSound('powerUpCollect');
                gameStats.powerUpsCollected++;
            }
            return; // Non è un power-up a tempo gestito da activePowerUp/powerUpTimer
        }


        // Logica per power-up temporanei (esistente)
        // Se un power-up temporaneo di tipo esclusivo è già attivo e ne attivi un altro diverso, disattiva il precedente.
        if (
            exclusiveTypes.includes(this.activePowerUp) &&
            exclusiveTypes.includes(type) &&
            this.activePowerUp !== type
        ) {
            this.deactivatePowerUp();
        } else if (this.activePowerUp && this.activePowerUp !== type) {
            // Se c'è un power-up attivo e quello nuovo è esclusivo o è scudo/firewall/blockbreaker che non è il tipo attuale, disattivalo
            if (
                exclusiveTypes.includes(type) ||
                (this.activePowerUp === POWERUP_TYPE.SHIELD && type !== POWERUP_TYPE.SHIELD) ||
                (this.activePowerUp === POWERUP_TYPE.FIREWALL && type !== POWERUP_TYPE.FIREWALL) ||
                (this.activePowerUp === POWERUP_TYPE.BLOCK_BREAKER && type !== POWERUP_TYPE.BLOCK_BREAKER)
            ) {
                this.deactivatePowerUp();
            }
        }

        // Attiva il power-up temporaneo
        this.activePowerUp = type;
        switch (type) {
            case POWERUP_TYPE.TRIPLE_SHOT:
                this.powerUpTimer = POWERUP_DURATION.TRIPLE_SHOT;
                this.isBlockBreakerActive = false; // Triple Shot e Block Breaker si escludono
                console.log('Triple Shot ATTIVATO!');
                break;
            case POWERUP_TYPE.SHIELD:
                this.powerUpTimer = POWERUP_DURATION.SHIELD;
                this.isShieldActive = true;
                console.log('Scudo ATTIVATO!');
                break;
            case POWERUP_TYPE.SMART_BOMB:
                this.activateSmartBomb();
                break; // Smart Bomb è istantanea, non ha timer
            case POWERUP_TYPE.DEBUG_MODE:
                this.powerUpTimer = POWERUP_DURATION.DEBUG_MODE;
                this.isBlockBreakerActive = false; // Debug Mode e Block Breaker si escludono
                console.log('Debug Mode (Proiettili Potenziati) ATTIVATO!');
                break;
            case POWERUP_TYPE.FIREWALL:
                this.powerUpTimer = POWERUP_DURATION.FIREWALL;
                this.isFirewallActive = true;
                console.log('Firewall (Immunità Ostacoli) ATTIVATO!');
                break;
            case POWERUP_TYPE.BLOCK_BREAKER:
                this.powerUpTimer = POWERUP_DURATION.BLOCK_BREAKER;
                this.isBlockBreakerActive = true;
                console.log('Block Breaker ATTIVATO!');
                break;
        }
        // Riproduci suono per i power-up temporanei (Smart Bomb già gestisce il suo suono)
        if (type !== POWERUP_TYPE.SMART_BOMB && type !== POWERUP_TYPE.SLAYER_SUBROUTINE && type !== POWERUP_TYPE.CODE_INJECTOR) {
             AudioManager.playSound('powerUpCollect');
        }
        // Incrementa contatore solo per power-up effettivamente attivati/raccolti
        if (type !== POWERUP_TYPE.SMART_BOMB) {
            gameStats.powerUpsCollected++;
        }
    }
    deactivatePowerUp() {
        console.log(`Power-up ${this.activePowerUp} DISATTIVATO.`);
        if (this.activePowerUp === POWERUP_TYPE.SHIELD) this.isShieldActive = false;
        if (this.activePowerUp === POWERUP_TYPE.FIREWALL) this.isFirewallActive = false;
        if (this.activePowerUp === POWERUP_TYPE.BLOCK_BREAKER) this.isBlockBreakerActive = false;
        this.activePowerUp = null;
        this.powerUpTimer = 0;
        // Non toccare i flag dei power-up permanenti qui
    }

    activateSmartBomb() {
        console.log('BOMBA Intelligente ATTIVATA!');
        let enemiesCleared = 0;
        const allEnemyLists = [
            enemies,
            fastEnemies,
            armoredEnemies,
            shootingEnemies,
            flyingEnemies,
            armoredShootingEnemies,
            toughBasicEnemies,
            dangerousFlyingEnemies,
        ];
        allEnemyLists.forEach((enemyList) => {
            for (let i = enemyList.length - 1; i >= 0; i--) {
                enemyList.splice(i, 1);
                score += 15;
                enemiesCleared++;
            }
        });
        if (activeMiniboss) {
            activeMiniboss.takeDamage(5);
            console.log('Smart Bomb ha danneggiato il boss!');
        }
        let obstaclesCleared = 0;
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles.splice(i, 1);
            score += 5;
            obstaclesCleared++;
        }
        if (enemiesCleared > 0 || obstaclesCleared > 0) AudioManager.playSound('enemyExplode', false, 0.9);
        if (enemiesCleared > 0) console.log(`${enemiesCleared} nemici distrutti dalla bomba!`);
        if (obstaclesCleared > 0) console.log(`${obstaclesCleared} ostacoli distrutti dalla bomba!`);
        // Smart Bomb non è un power-up a tempo, quindi non imposto activePowerUp su null qui.
        // È un'azione "usa e getta".
        this.activePowerUp = null; // Rimuovo l'activePowerUp se era Smart Bomb per evitare UI persistente.
        this.powerUpTimer = 0;
    }
}

class Obstacle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = OBSTACLE_TARGET_WIDTH;
        this.height = OBSTACLE_TARGET_HEIGHT;
        this.sprite = images['obstacle'];
        this.animation = null;
        this.health = OBSTACLE_HEALTH;
        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
            if (OBSTACLE_NUM_FRAMES > 1) {
                this.animation = new SpriteAnimation(
                    this.sprite,
                    OBSTACLE_ACTUAL_FRAME_WIDTH,
                    OBSTACLE_ACTUAL_FRAME_HEIGHT,
                    OBSTACLE_NUM_FRAMES
                );
            }
        } else {
            console.warn(`Sprite ostacolo non caricato o rotto. Sprite: ${this.sprite}`);
        }
    }
    update(dt) {
        this.x -= gameSpeed * dt;
        if (this.animation) this.animation.update(dt);
    }
    draw() {
        const spriteUsable = this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0;
        if (this.animation && spriteUsable) {
            const f = this.animation.getFrame();
            ctx.drawImage(
                this.sprite,
                f.sx,
                f.sy,
                OBSTACLE_ACTUAL_FRAME_WIDTH,
                OBSTACLE_ACTUAL_FRAME_HEIGHT,
                this.x,
                this.y,
                this.width,
                this.height
            );
        } else if (spriteUsable) {
            ctx.drawImage(
                this.sprite,
                0,
                0,
                OBSTACLE_ACTUAL_FRAME_WIDTH,
                OBSTACLE_ACTUAL_FRAME_HEIGHT,
                this.x,
                this.y,
                this.width,
                this.height
            );
        } else {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
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
    // Il costruttore ora accetta un 'type' per determinare sprite e danno
    constructor(x, y, type = 'normal') { // type può essere 'normal', 'debug', 'slayer', 'injector'
        this.x = x;
        this.y = y;
        this.type = type;
        this.animation = null;

        // Determina sprite, dimensioni e danno in base al tipo
        switch (this.type) {
            case 'slayer':
                this.width = SLAYER_PROJECTILE_TARGET_WIDTH;
                this.height = SLAYER_PROJECTILE_TARGET_HEIGHT;
                this.speed = projectileSpeed; // Puoi rendere la velocità specifica se vuoi
                this.damage = SLAYER_PROJECTILE_DAMAGE;
                this.sprite = images['slayerProjectile'];
                if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0 && SLAYER_PROJECTILE_NUM_FRAMES > 1) {
                    this.animation = new SpriteAnimation(
                        this.sprite,
                        SLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH,
                        SLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT,
                        SLAYER_PROJECTILE_NUM_FRAMES,
                        PLAYER_PROJECTILE_ANIMATION_SPEED
                    );
                }
                break;
            case 'injector':
                this.width = CODE_INJECTOR_PROJECTILE_TARGET_WIDTH;
                this.height = CODE_INJECTOR_PROJECTILE_TARGET_HEIGHT;
                this.speed = projectileSpeed; // Puoi rendere la velocità specifica se vuoi
                this.damage = CODE_INJECTOR_PROJECTILE_DAMAGE;
                this.sprite = images['codeInjectorProjectile'];
                if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0 && CODE_INJECTOR_PROJECTILE_NUM_FRAMES > 1) {
                    this.animation = new SpriteAnimation(
                        this.sprite,
                        CODE_INJECTOR_PROJECTILE_ACTUAL_FRAME_WIDTH,
                        CODE_INJECTOR_PROJECTILE_ACTUAL_FRAME_HEIGHT,
                        CODE_INJECTOR_PROJECTILE_NUM_FRAMES,
                        PLAYER_PROJECTILE_ANIMATION_SPEED
                    );
                }
                break;
            case 'debug': // Corrisponde a isUpgraded = true nella vecchia logica
                this.width = PLAYER_PROJECTILE_TARGET_WIDTH;
                this.height = PLAYER_PROJECTILE_TARGET_HEIGHT;
                this.speed = projectileSpeed;
                this.damage = 2; // Danno potenziato
                this.sprite = images['playerUpgradedProjectile'];
                 if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0 && PLAYER_PROJECTILE_NUM_FRAMES > 1) {
                    this.animation = new SpriteAnimation(
                        this.sprite,
                        PLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH,
                        PLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT,
                        PLAYER_PROJECTILE_NUM_FRAMES,
                        PLAYER_PROJECTILE_ANIMATION_SPEED
                    );
                }
                break;
            case 'normal': // Default
            default:
                this.width = PLAYER_PROJECTILE_TARGET_WIDTH;
                this.height = PLAYER_PROJECTILE_TARGET_HEIGHT;
                this.speed = projectileSpeed;
                this.damage = 1; // Danno normale
                this.sprite = images['playerProjectile'];
                if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0 && PLAYER_PROJECTILE_NUM_FRAMES > 1) {
                    this.animation = new SpriteAnimation(
                        this.sprite,
                        PLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH,
                        PLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT,
                        PLAYER_PROJECTILE_NUM_FRAMES,
                        PLAYER_PROJECTILE_ANIMATION_SPEED
                    );
                }
                break;
        }
    }
    update(dt) {
        this.x += this.speed * dt;
        if (this.animation) this.animation.update(dt);
    }
    draw() {
        const spriteUsable = this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0;
        if (this.animation && spriteUsable) {
            const frame = this.animation.getFrame();
            ctx.drawImage(
                this.sprite,
                frame.sx,
                frame.sy,
                this.animation.frameWidth,
                this.animation.frameHeight,
                this.x,
                this.y,
                this.width,
                this.height
            );
        } else if (spriteUsable) {
            // Fallback per sprite non animato o con un solo frame
            let sourceFrameW = this.animation ? this.animation.frameWidth : this.sprite.naturalWidth;
            let sourceFrameH = this.animation ? this.animation.frameHeight : this.sprite.naturalHeight;
            if (this.type === 'normal' || this.type === 'debug') { // Per i proiettili standard che hanno un solo frame sprite
                sourceFrameW = PLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH;
                sourceFrameH = PLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT;
            } else if (this.type === 'slayer') {
                 sourceFrameW = SLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH;
                 sourceFrameH = SLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT;
            } else if (this.type === 'injector') {
                 sourceFrameW = CODE_INJECTOR_PROJECTILE_ACTUAL_FRAME_WIDTH;
                 sourceFrameH = CODE_INJECTOR_PROJECTILE_ACTUAL_FRAME_HEIGHT;
            }
            ctx.drawImage(
                this.sprite,
                0, 0, // Assume 0,0 per il primo frame se non c'è animazione
                sourceFrameW, sourceFrameH,
                this.x, this.y, this.width, this.height
            );
        } else {
            // Fallback di disegno per proiettili senza sprite valido
            let color = '#FF0000'; // Default per proiettile rotto
            if (this.type === 'normal') color = PALETTE.BRIGHT_TEAL;
            if (this.type === 'debug') color = PALETTE.BRIGHT_GREEN_TEAL;
            if (this.type === 'slayer') color = '#FF6347'; // Esempio colore per Slayer
            if (this.type === 'injector') color = '#6A5ACD'; // Esempio colore per Injector

            ctx.fillStyle = color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

class BaseEnemy {
    constructor(
        x,
        y,
        targetW,
        targetH,
        spriteNameKey,
        frameW,
        frameH,
        numFrames,
        speedMult,
        hp = 1,
        fallbackColor = '#ccc',
        scoreValue = 25
    ) {
        this.x = x;
        this.y = y;
        this.width = targetW;
        this.height = targetH;
        this.speed = gameSpeed * speedMult;
        this.health = hp;
        this.maxHealth = hp;
        this.baseSpriteName = spriteNameKey;
        this.sprite = images[spriteNameKey];
        this.fallbackColor = fallbackColor;
        this.animation = null;
        this.numFrames = numFrames;
        this.frameWidth = frameW;
        this.frameHeight = frameH;
        this.scoreValue = scoreValue;
        this.animations = {};
        this.isWarning = false;
        this.warningTimer = 0;
        this.loadAnimation(this.baseSpriteName, this.frameWidth, this.frameHeight, this.numFrames, 'base');
    }
    loadAnimation(spriteNameKeyToLoad, frameW, frameH, numFramesAnim, animationKey) {
        const spriteInstance = images[spriteNameKeyToLoad];
        if (spriteInstance && spriteInstance.complete && spriteInstance.naturalWidth > 0 && numFramesAnim > 0) {
            this.animations[animationKey] = new SpriteAnimation(spriteInstance, frameW, frameH, numFramesAnim);
            if (animationKey === 'base' && !this.animation) {
                this.animation = this.animations.base;
                this.sprite = spriteInstance;
            }
        } else {
            console.warn(
                `BaseEnemy.loadAnimation FALLITO per sprite key '${spriteNameKeyToLoad}' (anim key: ${animationKey}). Sprite:`,
                spriteInstance
            );
            this.animations[animationKey] = null;
            if (animationKey === 'base' && !this.animation) this.animation = null;
        }
    }
    update(dt) {
        this.x -= this.speed * dt;
        if (this.animation) this.animation.update(dt);
    }
    draw() {
        let currentAnimToDraw = this.animation;
        let spriteToUse = currentAnimToDraw ? currentAnimToDraw.spritesheet : this.sprite;
        let actualFrameW = currentAnimToDraw ? currentAnimToDraw.frameWidth : this.frameWidth;
        let actualFrameH = currentAnimToDraw ? currentAnimToDraw.frameHeight : this.frameHeight;
        const spriteUsable = spriteToUse && spriteToUse.complete && spriteToUse.naturalWidth > 0;

        if (currentAnimToDraw && spriteUsable) {
            const f = currentAnimToDraw.getFrame();
            ctx.drawImage(spriteToUse, f.sx, f.sy, f.sWidth, f.sHeight, this.x, this.y, this.width, this.height);
        } else if (spriteUsable && !currentAnimToDraw) {
            ctx.drawImage(spriteToUse, 0, 0, actualFrameW, actualFrameH, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = this.fallbackColor;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
        if (this.isWarning) {
            ctx.fillStyle = WARNING_EXCLAMATION_COLOR;
            ctx.font = WARNING_EXCLAMATION_FONT;
            ctx.textAlign = 'center';
            ctx.fillText('!', this.x + this.width / 2, this.y + WARNING_EXCLAMATION_OFFSET_Y);
        }
        if (this.maxHealth > 1 && this.health > 0 && this.health < this.maxHealth) {
            const healthBarWidth = this.width * 0.8;
            const healthBarHeight = 5;
            const healthBarX = this.x + (this.width - healthBarWidth) / 2;
            const healthBarY = this.y - healthBarHeight - 3;
            ctx.fillStyle = 'rgba(100,100,100,0.7)';
            ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
            const currentHealthWidth = healthBarWidth * (this.health / this.maxHealth);
            ctx.fillStyle = 'rgba(0,255,0,0.7)';
            ctx.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);
        }
    }
    takeDamage(dmg = 1) {
        this.health -= dmg;
        if (this.health < 0) this.health = 0;
    }
}

class ArmoredEnemy extends BaseEnemy {
    constructor(x, y) {
        super(
            x,
            y,
            ENEMY_THREE_TARGET_WIDTH,
            ENEMY_THREE_TARGET_HEIGHT,
            'enemyThreeBase',
            ENEMY_THREE_ACTUAL_FRAME_WIDTH,
            ENEMY_THREE_ACTUAL_FRAME_HEIGHT,
            ENEMY_THREE_NUM_FRAMES,
            armoredEnemySpeedMultiplier,
            ARMORED_ENEMY_HEALTH,
            '#A9A9A9',
            50
        );
        this.loadAnimation(
            'enemyThreeDmg1',
            ENEMY_THREE_ACTUAL_FRAME_WIDTH,
            ENEMY_THREE_ACTUAL_FRAME_HEIGHT,
            ENEMY_THREE_NUM_FRAMES,
            '2'
        );
        this.loadAnimation(
            'enemyThreeDmg2',
            ENEMY_THREE_ACTUAL_FRAME_WIDTH,
            ENEMY_THREE_ACTUAL_FRAME_HEIGHT,
            ENEMY_THREE_NUM_FRAMES,
            '1'
        );
        this.updateCurrentAnimation();
    }
    updateCurrentAnimation() {
        let animKey = 'base';
        if (this.health === 2) animKey = '2';
        else if (this.health === 1) animKey = '1';
        this.animation = this.animations[animKey] || this.animations['base'];
        if (this.animation && this.animation.reset) this.animation.reset();
    }
    takeDamage(dmg = 1) {
        super.takeDamage(dmg);
        this.updateCurrentAnimation();
    }
}

class ShootingEnemy extends BaseEnemy {
    constructor(x, y) {
        super(
            x,
            y,
            ENEMY_FOUR_TARGET_WIDTH,
            ENEMY_FOUR_TARGET_HEIGHT,
            'enemyFourIdle',
            ENEMY_FOUR_ACTUAL_FRAME_WIDTH,
            ENEMY_FOUR_ACTUAL_FRAME_HEIGHT,
            ENEMY_FOUR_IDLE_NUM_FRAMES,
            0.5,
            1,
            '#FF69B4',
            40
        );
        this.shootTimer = Math.random() * SHOOTING_ENEMY_SHOOT_INTERVAL + 1.5;
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
                enemyProjectiles.push(
                    new EnemyProjectile(
                        this.x - this.projectileTargetWidth,
                        this.y + this.height / 2 - this.projectileTargetHeight / 2,
                        this.projectileSpriteName,
                        this.projectileFrameWidth,
                        this.projectileFrameHeight,
                        this.projectileNumFrames,
                        this.projectileTargetWidth,
                        this.projectileTargetHeight
                    )
                );
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

class EnemyProjectile {
    constructor(x, y, spriteNameKey, frameW, frameH, numFrames, targetW, targetH, speed = ENEMY_PROJECTILE_SPEED) {
        this.x = x;
        this.y = y;
        this.width = targetW;
        this.height = targetH;
        this.speed = speed;
        this.sprite = images[spriteNameKey];
        this.animation = null;
        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0 && numFrames > 1) {
            this.animation = new SpriteAnimation(this.sprite, frameW, frameH, numFrames, 0.1);
        }
    }
    update(dt) {
        this.x -= this.speed * dt;
        if (this.animation) this.animation.update(dt);
    }
    draw() {
        const spriteUsable = this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0;
        if (this.animation && spriteUsable) {
            const f = this.animation.getFrame();
            ctx.drawImage(this.sprite, f.sx, f.sy, f.sWidth, f.sHeight, this.x, this.y, this.width, this.height);
        } else if (spriteUsable) {
            const sourceFrameW = this.animation
                ? this.animation.frameWidth
                : this.sprite.naturalWidth /
                  (this.animation && this.animation.numFrames > 0 ? this.animation.numFrames : 1);
            const sourceFrameH = this.animation ? this.animation.frameHeight : this.sprite.naturalHeight;
            ctx.drawImage(this.sprite, 0, 0, sourceFrameW, sourceFrameH, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

class FlyingEnemy extends BaseEnemy {
    constructor(x, y) {
        super(
            x,
            y,
            ENEMY_FIVE_TARGET_WIDTH,
            ENEMY_FIVE_TARGET_HEIGHT,
            'enemyFive',
            ENEMY_FIVE_ACTUAL_FRAME_WIDTH,
            ENEMY_FIVE_ACTUAL_FRAME_HEIGHT,
            ENEMY_FIVE_NUM_FRAMES,
            0.6 + Math.random() * 0.3,
            1,
            '#FFFF00',
            flyingEnemyScoreValue
        );
        this.initialY = y;
        this.angle = Math.random() * Math.PI * 2;
        this.amplitude = 20 + Math.random() * 20;
        this.frequency = 0.02 + Math.random() * 0.03;
    }
    update(dt) {
        super.update(dt);
        this.angle += this.frequency;
        this.y = this.initialY + Math.sin(this.angle) * this.amplitude;
    }
}

class ArmoredShootingEnemy extends BaseEnemy {
    constructor(x, y) {
        super(
            x,
            y,
            ENEMY_SIX_TARGET_WIDTH,
            ENEMY_SIX_TARGET_HEIGHT,
            'enemySixBase',
            ENEMY_SIX_ACTUAL_FRAME_WIDTH,
            ENEMY_SIX_ACTUAL_FRAME_HEIGHT,
            ENEMY_SIX_IDLE_NUM_FRAMES,
            0.4,
            ARMORED_SHOOTING_ENEMY_HEALTH,
            '#D2691E',
            60
        );
        this.shootTimer = Math.random() * ARMORED_SHOOTING_ENEMY_SHOOT_INTERVAL + 2.0;
        this.loadAnimation(
            'enemySixDmg1',
            ENEMY_SIX_ACTUAL_FRAME_WIDTH,
            ENEMY_SIX_ACTUAL_FRAME_HEIGHT,
            ENEMY_SIX_IDLE_NUM_FRAMES,
            'dmg1'
        );
        this.loadAnimation(
            'enemySixDmg2',
            ENEMY_SIX_ACTUAL_FRAME_WIDTH,
            ENEMY_SIX_ACTUAL_FRAME_HEIGHT,
            ENEMY_SIX_IDLE_NUM_FRAMES,
            'dmg2'
        );
        this.loadAnimation(
            'enemySixDmg3',
            ENEMY_SIX_ACTUAL_FRAME_WIDTH,
            ENEMY_SIX_ACTUAL_FRAME_HEIGHT,
            ENEMY_SIX_IDLE_NUM_FRAMES,
            'dmg3'
        );
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
                enemyProjectiles.push(
                    new EnemyProjectile(
                        this.x - this.projectileTargetWidth,
                        projectileY,
                        this.projectileSpriteName,
                        this.projectileFrameWidth,
                        this.projectileFrameHeight,
                        this.projectileNumFrames,
                        this.projectileTargetWidth,
                        this.projectileTargetHeight
                    )
                );
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
        super(
            x,
            y,
            ENEMY_SEVEN_TARGET_WIDTH,
            ENEMY_SEVEN_TARGET_HEIGHT,
            'enemySevenBase',
            ENEMY_SEVEN_ACTUAL_FRAME_WIDTH,
            ENEMY_SEVEN_ACTUAL_FRAME_HEIGHT,
            ENEMY_SEVEN_NUM_FRAMES,
            0.6,
            TOUGH_BASIC_ENEMY_HEALTH,
            '#2E8B57',
            30
        );
        this.loadAnimation(
            'enemySevenDmg1',
            ENEMY_SEVEN_ACTUAL_FRAME_WIDTH,
            ENEMY_SEVEN_ACTUAL_FRAME_HEIGHT,
            ENEMY_SEVEN_NUM_FRAMES,
            'dmg1'
        );
        this.updateCurrentAnimation();
    }
    updateCurrentAnimation() {
        let animKey = this.health === 2 ? 'base' : this.health === 1 ? 'dmg1' : 'base';
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
        this.fallbackColor = '#DC143C';
        this.animations = {};
        this.loadAnimation(
            this.baseSpriteName,
            DANGEROUS_FLYING_ENEMY_ACTUAL_FRAME_WIDTH,
            DANGEROUS_FLYING_ENEMY_ACTUAL_FRAME_HEIGHT,
            DANGEROUS_FLYING_ENEMY_NUM_FRAMES,
            'base'
        );
        this.animation = this.animations['base'];
        this.isDangerousFlyer = true;
    }
}

class Glitchzilla extends BaseEnemy {
    constructor(x, y) {
        super(
            x,
            y,
            GLITCHZILLA_TARGET_WIDTH,
            GLITCHZILLA_TARGET_HEIGHT,
            'glitchzillaBase',
            GLITCHZILLA_ACTUAL_FRAME_WIDTH,
            GLITCHZILLA_ACTUAL_FRAME_HEIGHT,
            GLITCHZILLA_NUM_FRAMES,
            0.2,
            GLITCHZILLA_HEALTH,
            '#FF00FF',
            GLITCHZILLA_SCORE_VALUE
        );
        this.loadAnimation(
            'glitchzillaDmg1',
            GLITCHZILLA_ACTUAL_FRAME_WIDTH,
            GLITCHZILLA_ACTUAL_FRAME_HEIGHT,
            GLITCHZILLA_NUM_FRAMES,
            'dmg1'
        );
        this.loadAnimation(
            'glitchzillaDmg2',
            GLITCHZILLA_ACTUAL_FRAME_WIDTH,
            GLITCHZILLA_ACTUAL_FRAME_HEIGHT,
            GLITCHZILLA_NUM_FRAMES,
            'dmg2'
        );
        this.loadAnimation(
            'glitchzillaDmg3',
            GLITCHZILLA_ACTUAL_FRAME_WIDTH,
            GLITCHZILLA_ACTUAL_FRAME_HEIGHT,
            GLITCHZILLA_NUM_FRAMES,
            'dmg3'
        );
        this.updateCurrentAnimation();
        this.spawnTime = Date.now();
        this.attackSequence = [
            'warn_high',
            'high',
            'pause_short',
            'warn_medium',
            'medium',
            'pause_short',
            'warn_low',
            'low',
            'pause_long',
        ];
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
        console.log('GLITCHZILLA SPAWNED! HP: ' + this.health);
    }
    updateCurrentAnimation() {
        let animKey;
        if (this.health > GLITCHZILLA_HEALTH * 0.75) animKey = 'base';
        else if (this.health > GLITCHZILLA_HEALTH * 0.5) animKey = 'dmg1';
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
            console.log('Glitchzilla SCONFITTO! Assegno punteggio: ' + this.scoreValue);
            AudioManager.playSound('glitchzillaDefeat');

            score += this.scoreValue;
            activeMiniboss = null;
            isGlitchzillaDefeatedThisGame = true;

            // LOGICA DI DROP PER SLAYER_SUBROUTINE (20% di probabilità)
            if (Math.random() < 0.20) { // 20% chance
                console.log('Glitchzilla ha droppato Slayer Subroutine!');
                powerUpItems.push(new PowerUpItem(this.x + this.width / 2, this.y + this.height / 2, POWERUP_TYPE.SLAYER_SUBROUTINE, images));
            }

            postBossCooldownActive = true;
            postBossCooldownTimer = 2.0;

            bossFightImminent = false;

            console.log(
                `Glitchzilla defeated. postBossCooldownActive: ${postBossCooldownActive}, bossFightImminent: ${bossFightImminent}`
            );
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
                    if (currentPhase === 'high')
                        projectileY = this.y + this.height * 0.2 - this.projectileTargetHeight / 2;
                    else if (currentPhase === 'medium')
                        projectileY = this.y + this.height * 0.65 - this.projectileTargetHeight / 2;
                    else projectileY = this.y + this.height * 0.8 - this.projectileTargetHeight / 2;
                    enemyProjectiles.push(
                        new EnemyProjectile(
                            this.x - this.projectileTargetWidth,
                            projectileY,
                            this.projectileSpriteName,
                            this.projectileFrameWidth,
                            this.projectileFrameHeight,
                            this.projectileNumFrames,
                            this.projectileTargetWidth,
                            this.projectileTargetHeight
                        )
                    );
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

// Aggiungi questa classe dopo la classe Glitchzilla
class TrojanByte extends BaseEnemy {
    constructor(x, y) {
        super(
            x,
            y,
            TROJAN_BYTE_TARGET_WIDTH,
            TROJAN_BYTE_TARGET_HEIGHT,
            'trojanByteBase',
            TROJAN_BYTE_ACTUAL_FRAME_WIDTH,
            TROJAN_BYTE_ACTUAL_FRAME_HEIGHT,
            TROJAN_BYTE_NUM_FRAMES,
            0.3, // Velocità leggermente più bassa per un boss più "statico" e minaccioso
            TROJAN_BYTE_HEALTH,
            '#FF00FF', // Colore fallback, come Glitchzilla per distinguere
            TROJAN_BYTE_SCORE_VALUE
        );
        this.loadAnimation(
            'trojanByteDmg1',
            TROJAN_BYTE_ACTUAL_FRAME_WIDTH,
            TROJAN_BYTE_ACTUAL_FRAME_HEIGHT,
            TROJAN_BYTE_NUM_FRAMES,
            'dmg1'
        );
        this.loadAnimation(
            'trojanByteDmg2',
            TROJAN_BYTE_ACTUAL_FRAME_WIDTH,
            TROJAN_BYTE_ACTUAL_FRAME_HEIGHT,
            TROJAN_BYTE_NUM_FRAMES,
            'dmg2'
        );
        this.loadAnimation(
            'trojanByteDmg3',
            TROJAN_BYTE_ACTUAL_FRAME_WIDTH,
            TROJAN_BYTE_ACTUAL_FRAME_HEIGHT,
            TROJAN_BYTE_NUM_FRAMES,
            'dmg3'
        );
        this.updateCurrentAnimation();
        this.attackSequence = [
            'warn_low_1', 'low_1', 'pause_medium',
            'warn_low_2', 'low_2', 'pause_medium',
            //'warn_low_3', 'low_3', 'pause_medium', // Tre colpi in basso consecutivi
            'warn_middle', 'middle', 'pause_medium', // Un colpo in mezzo
            'warn_low_single', 'low_single', 'pause_short', // Un altro colpo in basso
            'warn_high_single', 'high_single', 'pause_long_tb' // Un colpo in alto, poi pausa lunga per ricominciare il pattern
        ];
        this.attackSequenceIndex = 0;
        this.currentAttackPhaseDuration = 0;
        this.shotFiredInPhase = false;
        this.pauseShortDuration = 0.5;
        this.pauseMediumDuration = 1.0;
        this.pauseLongTbDuration = 2.5; // Pausa più lunga dopo il pattern principale
        this.projectileSpriteName = 'trojanByteProjectile';
        this.projectileFrameWidth = TROJAN_BYTE_PROJECTILE_ACTUAL_FRAME_WIDTH;
        this.projectileFrameHeight = TROJAN_BYTE_PROJECTILE_ACTUAL_FRAME_HEIGHT;
        this.projectileNumFrames = TROJAN_BYTE_PROJECTILE_NUM_FRAMES;
        this.projectileTargetWidth = TROJAN_BYTE_PROJECTILE_TARGET_WIDTH;
        this.projectileTargetHeight = TROJAN_BYTE_PROJECTILE_TARGET_HEIGHT;
        console.log('TROJAN_BYTE SPAWNED! HP: ' + this.health);
        // Aggiungi un suono di spawn per Trojan_Byte qui, una volta che hai il file audio.
        // AudioManager.playSound('trojanByteSpawn');
    }

    updateCurrentAnimation() {
        let animKey;
        // La logica per cambiare sprite in base ai danni
        if (this.health > TROJAN_BYTE_HEALTH * 0.75) animKey = 'base';
        else if (this.health > TROJAN_BYTE_HEALTH * 0.5) animKey = 'dmg1';
        else if (this.health > TROJAN_BYTE_HEALTH * 0.25) animKey = 'dmg2';
        else animKey = 'dmg3';
        this.animation = this.animations[animKey] || this.animations['base'];
        if (this.animation && this.animation.reset) this.animation.reset();
    }

    takeDamage(dmg = 1) {
        super.takeDamage(dmg);
        console.log(`Trojan_Byte took ${dmg} damage, HP: ${this.health}`);
        this.updateCurrentAnimation();
        AudioManager.playSound('enemyHit');

        if (this.health <= 0) {
            console.log('TROJAN_BYTE SCONFITTO! Assegno punteggio: ' + this.scoreValue);

            score += this.scoreValue;
            activeMiniboss = null;
            isTrojanByteDefeatedThisGame = true;

            // LOGICA DI DROP PER CODE_INJECTOR (20% di probabilità, SOLO SE SLAYER_SUBROUTINE NON È ATTIVO)
            if (!hasSlayerSubroutineUpgrade && Math.random() < 0.20) { // 20% chance, conditional on Slayer not being active
                console.log('Trojan Byte ha droppato Code Injector!');
                powerUpItems.push(new PowerUpItem(this.x + this.width / 2, this.y + this.height / 2, POWERUP_TYPE.CODE_INJECTOR, images));
            }

            postBossCooldownActive = true;
            postBossCooldownTimer = 2.0;
            bossFightImminent = false;
        }
    }

    update(dt) {
        super.update(dt);
        this.currentAttackPhaseDuration += dt;
        const currentPhase = this.attackSequence[this.attackSequenceIndex];
        let phaseComplete = false;

        let projectileY;
        switch (currentPhase) {
            case 'warn_low_1':
            case 'warn_low_2':
            //case 'warn_low_3':
            case 'warn_middle':
            case 'warn_low_single':
            case 'warn_high_single':
                this.isWarning = true;
                if (this.currentAttackPhaseDuration >= WARNING_DURATION) {
                    phaseComplete = true;
                    this.isWarning = false;
                }
                break;
            case 'low_1': // Primo colpo basso
            case 'low_2': // Secondo colpo basso
            //case 'low_3': // Terzo colpo basso
            case 'low_single': // Singolo colpo basso
                if (!this.shotFiredInPhase) {
                    projectileY = this.y + this.height * 0.8 - this.projectileTargetHeight / 2;
                    enemyProjectiles.push(new EnemyProjectile(this.x - this.projectileTargetWidth, projectileY, this.projectileSpriteName, this.projectileFrameWidth, this.projectileFrameHeight, this.projectileNumFrames, this.projectileTargetWidth, this.projectileTargetHeight, TROJAN_BYTE_PROJECTILE_SPEED));
                    AudioManager.playSound('enemyShootLight'); // O un suono specifico per Trojan
                    this.shotFiredInPhase = true;
                }
                phaseComplete = true;
                break;
            case 'middle': // Colpo al centro
                if (!this.shotFiredInPhase) {
                    projectileY = this.y + this.height * 0.5 - this.projectileTargetHeight / 2;
                    enemyProjectiles.push(new EnemyProjectile(this.x - this.projectileTargetWidth, projectileY, this.projectileSpriteName, this.projectileFrameWidth, this.projectileFrameHeight, this.projectileNumFrames, this.projectileTargetWidth, this.projectileTargetHeight, TROJAN_BYTE_PROJECTILE_SPEED));
                    AudioManager.playSound('enemyShootLight');
                    this.shotFiredInPhase = true;
                }
                phaseComplete = true;
                break;
            case 'high_single': // Singolo colpo alto
                if (!this.shotFiredInPhase) {
                    projectileY = this.y + this.height * 0.2 - this.projectileTargetHeight / 2;
                    enemyProjectiles.push(new EnemyProjectile(this.x - this.projectileTargetWidth, projectileY, this.projectileSpriteName, this.projectileFrameWidth, this.projectileFrameHeight, this.projectileNumFrames, this.projectileTargetWidth, this.projectileTargetHeight, TROJAN_BYTE_PROJECTILE_SPEED));
                    AudioManager.playSound('enemyShootLight');
                    this.shotFiredInPhase = true;
                }
                phaseComplete = true;
                break;
            case 'pause_short':
                if (this.currentAttackPhaseDuration >= this.pauseShortDuration) {
                    phaseComplete = true;
                }
                break;
            case 'pause_medium':
                if (this.currentAttackPhaseDuration >= this.pauseMediumDuration) {
                    phaseComplete = true;
                }
                break;
            case 'pause_long_tb': // Pausa specifica per Trojan_Byte
                if (this.currentAttackPhaseDuration >= this.pauseLongTbDuration) {
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
// Aggiungi questa classe dopo la classe TrojanByte
class MissingNumber extends BaseEnemy {
    constructor(x, y) {
        super(
            x,
            y,
            MISSING_NUMBER_TARGET_WIDTH,
            MISSING_NUMBER_TARGET_HEIGHT,
            'missingNumberBase',
            MISSING_NUMBER_ACTUAL_FRAME_WIDTH,
            MISSING_NUMBER_ACTUAL_FRAME_HEIGHT,
            MISSING_NUMBER_NUM_FRAMES,
            0.4, // Velocità simile a Glitchzilla
            MISSING_NUMBER_HEALTH,
            '#8A2BE2', // Colore fallback viola
            MISSING_NUMBER_SCORE_VALUE
        );
        this.loadAnimation(
            'missingNumberDmg1',
            MISSING_NUMBER_ACTUAL_FRAME_WIDTH,
            MISSING_NUMBER_ACTUAL_FRAME_HEIGHT,
            MISSING_NUMBER_NUM_FRAMES,
            'dmg1'
        );
        this.loadAnimation(
            'missingNumberDmg2',
            MISSING_NUMBER_ACTUAL_FRAME_WIDTH,
            MISSING_NUMBER_ACTUAL_FRAME_HEIGHT,
            MISSING_NUMBER_NUM_FRAMES,
            'dmg2'
        );
        this.loadAnimation(
            'missingNumberDmg3',
            MISSING_NUMBER_ACTUAL_FRAME_WIDTH,
            MISSING_NUMBER_ACTUAL_FRAME_HEIGHT,
            MISSING_NUMBER_NUM_FRAMES,
            'dmg3'
        );
        this.updateCurrentAnimation();

        // Nuovi parametri per la logica di attacco a pattern casuale
        this.currentAttackPattern = [];
        this.currentAttackPatternIndex = 0;
        this.currentAttackPhaseDuration = 0;
        this.shotFiredInPhase = false;

        this.pauseShortDuration = 0.5; // Durata pause, simili a TrojanByte
        this.pauseMediumDuration = 1.0;
        this.pauseLongDuration = 2.5;

        // Definizione dei sub-pattern di attacco
        this.allAttackPatterns = [
            // Pattern 1: un colpo alto, due bassi, 1 medio, pausa lunga
            [
                { type: 'warn', pos: 'high' }, { type: 'shot', pos: 'high' },
                { type: 'pause', duration: this.pauseShortDuration },
                { type: 'warn', pos: 'low' }, { type: 'shot', pos: 'low' },
                { type: 'pause', duration: this.pauseShortDuration },
                { type: 'warn', pos: 'low' }, { type: 'shot', pos: 'low' },
                { type: 'pause', duration: this.pauseShortDuration },
                { type: 'warn', pos: 'middle' }, { type: 'shot', pos: 'middle' },
                { type: 'pause', duration: this.pauseLongDuration }
            ],
            // Pattern 2: uno alto, uno medio, pausa lunga
            [
                { type: 'warn', pos: 'high' }, { type: 'shot', pos: 'high' },
                { type: 'pause', duration: this.pauseMediumDuration },
                { type: 'warn', pos: 'middle' }, { type: 'shot', pos: 'middle' },
                { type: 'pause', duration: this.pauseLongDuration }
            ],
            // Pattern 3: medio medio, pausa lunga
            [
                { type: 'warn', pos: 'middle' }, { type: 'shot', pos: 'middle' },
                { type: 'pause', duration: this.pauseShortDuration },
                { type: 'warn', pos: 'middle' }, { type: 'shot', pos: 'middle' },
                { type: 'pause', duration: this.pauseLongDuration }
            ],
            // Pattern 4: basso medio basso, pausa lunga
            [
                { type: 'warn', pos: 'low' }, { type: 'shot', pos: 'low' },
                { type: 'pause', duration: this.pauseShortDuration },
                { type: 'warn', pos: 'middle' }, { type: 'shot', pos: 'middle' },
                { type: 'pause', duration: this.pauseShortDuration },
                { type: 'warn', pos: 'low' }, { type: 'shot', pos: 'low' },
                { type: 'pause', duration: this.pauseLongDuration }
            ]
        ];

        this.selectNewAttackPattern(); // Seleziona il primo pattern all'inizializzazione

        this.projectileSpriteName = 'missingNumberProjectile';
        this.projectileFrameWidth = MISSING_NUMBER_PROJECTILE_ACTUAL_FRAME_WIDTH;
        this.projectileFrameHeight = MISSING_NUMBER_PROJECTILE_ACTUAL_FRAME_HEIGHT;
        this.projectileNumFrames = MISSING_NUMBER_PROJECTILE_NUM_FRAMES;
        this.projectileTargetWidth = MISSING_NUMBER_PROJECTILE_TARGET_WIDTH;
        this.projectileTargetHeight = MISSING_NUMBER_PROJECTILE_TARGET_HEIGHT;
        this.projectileSpeed = MISSING_NUMBER_PROJECTILE_SPEED;

        console.log('MISSING_NUMBER SPAWNED! HP: ' + this.health);
        // Aggiungi un suono di spawn per MissingNumber qui, una volta che hai il file audio.
        // AudioManager.playSound('missingNumberSpawn');
    }

    // Nuovo metodo per selezionare un nuovo pattern di attacco casuale
    selectNewAttackPattern() {
        const randomIndex = Math.floor(Math.random() * this.allAttackPatterns.length);
        this.currentAttackPattern = this.allAttackPatterns[randomIndex];
        this.currentAttackPatternIndex = 0;
        this.currentAttackPhaseDuration = 0;
        this.shotFiredInPhase = false;
        this.isWarning = false; // Assicurati che l'avviso sia spento quando si inizia un nuovo pattern
        console.log('MissingNumber ha selezionato un nuovo pattern di attacco:', this.currentAttackPattern);
    }

    updateCurrentAnimation() {
        let animKey;
        if (this.health > MISSING_NUMBER_HEALTH * 0.75) animKey = 'base';
        else if (this.health > MISSING_NUMBER_HEALTH * 0.5) animKey = 'dmg1';
        else if (this.health > MISSING_NUMBER_HEALTH * 0.25) animKey = 'dmg2';
        else animKey = 'dmg3';
        this.animation = this.animations[animKey] || this.animations['base'];
        if (this.animation && this.animation.reset) this.animation.reset();
    }

    takeDamage(dmg = 1) {
        super.takeDamage(dmg);
        console.log(`Missing_Number took ${dmg} damage, HP: ${this.health}`);
        this.updateCurrentAnimation();
        AudioManager.playSound('enemyHit'); // Potremmo usare un suono specifico per i boss

        if (this.health <= 0) {
            console.log('MISSING_NUMBER SCONFITTO! Assegno punteggio: ' + this.scoreValue);
            // AudioManager.playSound('missingNumberDefeat');

            score += this.scoreValue; // Corretto da scoreData a scoreValue
            activeMiniboss = null;
            isMissingNumberDefeatedThisGame = true; // <--- MODIFICA QUI

            postBossCooldownActive = true;
            postBossCooldownTimer = 2.0;
            bossFightImminent = false;
        }
    }

    update(dt) {
        super.update(dt);
        this.currentAttackPhaseDuration += dt;

        if (this.currentAttackPattern.length === 0) {
            // Questo non dovrebbe accadere se selectNewAttackPattern() viene chiamato correttamente
            this.selectNewAttackPattern();
            return;
        }

        const currentAction = this.currentAttackPattern[this.currentAttackPatternIndex];
        let actionComplete = false;

        switch (currentAction.type) {
            case 'warn':
                this.isWarning = true;
                if (this.currentAttackPhaseDuration >= WARNING_DURATION) {
                    actionComplete = true;
                    this.isWarning = false;
                }
                break;
            case 'shot':
                if (!this.shotFiredInPhase) {
                    let projectileY;
                    if (currentAction.pos === 'high') {
                        projectileY = this.y + this.height * 0.2 - this.projectileTargetHeight / 2;
                    } else if (currentAction.pos === 'middle') {
                        projectileY = this.y + this.height * 0.5 - this.projectileTargetHeight / 2;
                    } else if (currentAction.pos === 'low') {
                        projectileY = this.y + this.height * 0.8 - this.projectileTargetHeight / 2;
                    }
                    enemyProjectiles.push(
                        new EnemyProjectile(
                            this.x - this.projectileTargetWidth,
                            projectileY,
                            this.projectileSpriteName,
                            this.projectileFrameWidth,
                            this.projectileFrameHeight,
                            this.projectileNumFrames,
                            this.projectileTargetWidth,
                            this.projectileTargetHeight,
                            this.projectileSpeed
                        )
                    );
                    AudioManager.playSound('enemyShootLight'); // O un suono specifico per MissingNumber
                    this.shotFiredInPhase = true;
                }
                actionComplete = true; // Il colpo è istantaneo, quindi l'azione è completa dopo il primo frame
                break;
            case 'pause':
                if (this.currentAttackPhaseDuration >= currentAction.duration) {
                    actionComplete = true;
                }
                break;
        }

        if (actionComplete) {
            this.currentAttackPatternIndex++;
            this.currentAttackPhaseDuration = 0;
            this.shotFiredInPhase = false;
            this.isWarning = false; // Spegni l'avviso per la prossima azione

            // Se tutte le azioni del pattern corrente sono state eseguite, seleziona un nuovo pattern
            if (this.currentAttackPatternIndex >= this.currentAttackPattern.length) {
                this.selectNewAttackPattern();
            }
        }

        // Assicurati che il boss non vada oltre una certa posizione a sinistra
        if (this.x < canvas.width / 2) {
            this.x = canvas.width / 2;
        }
    }
}
// --- Funzioni di Gioco ---
function drawGround() {
    ctx.fillStyle = PALETTE.DARK_TEAL_BLUE;
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
    ctx.fillStyle = PALETTE.MEDIUM_TEAL;
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, lineWidth * 3);
    ctx.fillStyle = PALETTE.BRIGHT_TEAL;
    ctx.fillRect(0, canvas.height - groundHeight + lineWidth * 3, canvas.width, lineWidth);
}

function calculateNextObstacleSpawnTime() {
    return 0.8 + Math.random() * 1.2;
}
nextObstacleSpawnTime = calculateNextObstacleSpawnTime();

function spawnObstacleIfNeeded(dt) {
    obstacleSpawnTimer += dt;
    if (obstacleSpawnTimer >= nextObstacleSpawnTime) {
        const yPos = canvas.height - groundHeight - OBSTACLE_TARGET_HEIGHT;
        obstacles.push(new Obstacle(canvas.width, yPos));
        obstacleSpawnTimer = 0;
        nextObstacleSpawnTime = calculateNextObstacleSpawnTime();
    }
}

function updateObstacles(dt) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update(dt);
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }
}

function drawObstacles() {
    obstacles.forEach((obstacle) => obstacle.draw());
}

function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update(dt);
        if (projectiles[i].x > canvas.width) {
            projectiles.splice(i, 1);
        }
    }
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        enemyProjectiles[i].update(dt);
        if (enemyProjectiles[i].x + enemyProjectiles[i].width < 0) {
            enemyProjectiles.splice(i, 1);
        }
    }
}

function drawProjectiles() {
    projectiles.forEach((p) => p.draw());
    enemyProjectiles.forEach((ep) => ep.draw());
}

function updateShootCooldown(dt) {
    if (!canShoot) {
        shootTimer += dt;
        if (shootTimer >= shootCooldownTime) {
            canShoot = true;
            shootTimer = 0;
        }
    }
}

function calculateNextEnemyBaseSpawnTime() {
    return 2.5 + Math.random() * 2.0;
}
nextEnemyBaseSpawnTime = calculateNextEnemyBaseSpawnTime();

function spawnEnemyBaseIfNeeded(dt) {
    enemyBaseSpawnTimer += dt;
    if (enemyBaseSpawnTimer >= nextEnemyBaseSpawnTime) {
        const enemyY = canvas.height - groundHeight - ENEMY_ONE_TARGET_HEIGHT;
        enemies.push(
            new BaseEnemy(
                canvas.width,
                enemyY,
                ENEMY_ONE_TARGET_WIDTH,
                ENEMY_ONE_TARGET_HEIGHT,
                'enemyOne',
                ENEMY_ONE_ACTUAL_FRAME_WIDTH,
                ENEMY_ONE_ACTUAL_FRAME_HEIGHT,
                ENEMY_ONE_NUM_FRAMES,
                0.8,
                1,
                '#FF0000',
                20
            )
        );
        enemyBaseSpawnTimer = 0;
        nextEnemyBaseSpawnTime = calculateNextEnemyBaseSpawnTime();
    }
}

function calculateNextFlyingEnemySpawnTime() {
    return 3.5 + Math.random() * 3;
}
nextFlyingEnemySpawnTime = calculateNextFlyingEnemySpawnTime();

function spawnFlyingEnemyIfNeeded(dt) {
    flyingEnemySpawnTimer += dt;
    if (flyingEnemySpawnTimer >= nextFlyingEnemySpawnTime) {
        const enemyY = 50 + Math.random() * (canvas.height - groundHeight - ENEMY_FIVE_TARGET_HEIGHT - 100);
        flyingEnemies.push(new FlyingEnemy(canvas.width, enemyY));
        flyingEnemySpawnTimer = 0;
        nextFlyingEnemySpawnTime = calculateNextFlyingEnemySpawnTime();
    }
}

function calculateNextGenericEnemySpawnTime(min, max) {
    return min + Math.random() * (max - min);
}

function spawnFastEnemyIfNeeded(dt) {
    if (score < SCORE_THRESHOLD_FAST_ENEMY) return;
    fastEnemySpawnTimer += dt;
    if (fastEnemySpawnTimer >= nextFastEnemySpawnTime) {
        const enemyY = canvas.height - groundHeight - ENEMY_TWO_TARGET_HEIGHT;
        fastEnemies.push(
            new BaseEnemy(
                canvas.width,
                enemyY,
                ENEMY_TWO_TARGET_WIDTH,
                ENEMY_TWO_TARGET_HEIGHT,
                'enemyTwo',
                ENEMY_TWO_ACTUAL_FRAME_WIDTH,
                ENEMY_TWO_ACTUAL_FRAME_HEIGHT,
                ENEMY_TWO_NUM_FRAMES,
                fastEnemySpeedMultiplier,
                1,
                '#FFA500',
                35
            )
        );
        fastEnemySpawnTimer = 0;
        nextFastEnemySpawnTime = calculateNextGenericEnemySpawnTime(4, 6);
    }
}

function spawnArmoredEnemyIfNeeded(dt) {
    if (score < SCORE_THRESHOLD_ARMORED_ENEMY) return;
    armoredEnemySpawnTimer += dt;
    if (armoredEnemySpawnTimer >= nextArmoredEnemySpawnTime) {
        const enemyY = canvas.height - groundHeight - ENEMY_THREE_TARGET_HEIGHT;
        armoredEnemies.push(new ArmoredEnemy(canvas.width, enemyY));
        armoredEnemySpawnTimer = 0;
        nextArmoredEnemySpawnTime = calculateNextGenericEnemySpawnTime(6, 9);
    }
}

function spawnShootingEnemyIfNeeded(dt) {
    if (score < SCORE_THRESHOLD_SHOOTING_ENEMY) return;
    shootingEnemySpawnTimer += dt;
    if (shootingEnemySpawnTimer >= nextShootingEnemySpawnTime) {
        const enemyY = canvas.height - groundHeight - ENEMY_FOUR_TARGET_HEIGHT;
        shootingEnemies.push(new ShootingEnemy(canvas.width, enemyY));
        shootingEnemySpawnTimer = 0;
        nextShootingEnemySpawnTime = calculateNextGenericEnemySpawnTime(5, 8);
    }
}

function spawnArmoredShootingEnemyIfNeeded(dt) {
    if (score < SCORE_THRESHOLD_ARMORED_SHOOTING_ENEMY) return;
    armoredShootingEnemySpawnTimer += dt;
    if (armoredShootingEnemySpawnTimer >= nextArmoredShootingEnemySpawnTime) {
        const enemyY = canvas.height - groundHeight - ENEMY_SIX_TARGET_HEIGHT;
        armoredShootingEnemies.push(new ArmoredShootingEnemy(canvas.width, enemyY));
        armoredShootingEnemySpawnTimer = 0;
        nextArmoredShootingEnemySpawnTime = calculateNextGenericEnemySpawnTime(8, 12);
    }
}
function spawnToughBasicEnemyIfNeeded(dt) {
    if (score < SCORE_THRESHOLD_TOUGH_BASIC_ENEMY) return;
    toughBasicEnemySpawnTimer += dt;
    if (toughBasicEnemySpawnTimer >= nextToughBasicEnemySpawnTime) {
        const enemyY = canvas.height - groundHeight - ENEMY_SEVEN_TARGET_HEIGHT;
        toughBasicEnemies.push(new ToughBasicEnemy(canvas.width, enemyY));
        toughBasicEnemySpawnTimer = 0;
        nextToughBasicEnemySpawnTime = calculateNextGenericEnemySpawnTime(3, 5);
    }
}
function spawnDangerousFlyingEnemyIfNeeded(dt) {
    if (score < SCORE_THRESHOLD_DANGEROUS_FLYING_ENEMY) return;
    dangerousFlyingEnemySpawnTimer += dt;
    if (dangerousFlyingEnemySpawnTimer >= nextDangerousFlyingEnemySpawnTime) {
        const enemyY = 30 + Math.random() * (canvas.height - groundHeight - DANGEROUS_FLYING_ENEMY_TARGET_HEIGHT - 150);
        dangerousFlyingEnemies.push(new DangerousFlyingEnemy(canvas.width, enemyY));
        dangerousFlyingEnemySpawnTimer = 0;
        nextDangerousFlyingEnemySpawnTime = calculateNextGenericEnemySpawnTime(7, 10);
    }
}

function spawnGlitchzillaIfNeeded() {
    if (score >= GLITCHZILLA_SPAWN_SCORE_THRESHOLD && !activeMiniboss && !hasGlitchzillaSpawnedThisGame) {
        const bossY = canvas.height - groundHeight - GLITCHZILLA_TARGET_HEIGHT;
        activeMiniboss = new Glitchzilla(canvas.width, bossY);
        hasGlitchzillaSpawnedThisGame = true;
        console.log('GLITCHZILLA È APPARSO!');
    }
}

function calculateNextPowerUpAmbientSpawnTime() {
    return 10 + Math.random() * 10;
}
nextPowerUpSpawnTime = calculateNextPowerUpAmbientSpawnTime();

function spawnPowerUpAmbientIfNeeded(dt) {
    powerUpSpawnTimer += dt;
    if (powerUpSpawnTimer >= nextPowerUpSpawnTime) {
        // Filtra i power-up che non dovrebbero più spawnare
        const availablePowerUpTypes = Object.values(POWERUP_TYPE).filter(type => {
            if (type === POWERUP_TYPE.DEBUG_MODE && (hasSlayerSubroutineUpgrade || hasCodeInjectorUpgrade)) {
                return false; // Non spawnare DEBUG_MODE se un upgrade di sparo permanente è attivo
            }
            // Non spawnare i power-up permanenti tramite spawn ambientale;
            // vengono droppati solo dai boss.
            if (type === POWERUP_TYPE.SLAYER_SUBROUTINE || type === POWERUP_TYPE.CODE_INJECTOR) {
                return false; 
            }
            return true;
        });

        if (availablePowerUpTypes.length > 0) {
            const randomTypeIndex = Math.floor(Math.random() * availablePowerUpTypes.length);
            const randomType = availablePowerUpTypes[randomTypeIndex];
            const yPos = 50 + Math.random() * (canvas.height - groundHeight - 150);
            powerUpItems.push(new PowerUpItem(canvas.width, yPos, randomType, images));
            powerUpSpawnTimer = 0;
            nextPowerUpSpawnTime = calculateNextPowerUpAmbientSpawnTime();
        } else {
            console.warn("Nessun power-up ambientale disponibile da spawnare dopo aver filtrato.");
            // Potrebbe essere necessario un meccanismo per farli spawnare più tardi o con maggiore frequenza
            // se tutti i power-up sono stati bloccati. Per ora, semplicemente non spawniamo.
            powerUpSpawnTimer = 0; // Reset del timer anche se non si spawna nulla per evitare spam di warning.
            nextPowerUpSpawnTime = calculateNextPowerUpAmbientSpawnTime();
        }
    }
}

function updatePowerUpItems(dt) {
    for (let i = powerUpItems.length - 1; i >= 0; i--) {
        powerUpItems[i].update(dt, gameSpeed);
        if (powerUpItems[i].x + powerUpItems[i].width < 0) {
            powerUpItems.splice(i, 1);
        }
    }
}

function drawPowerUpItems() {
    powerUpItems.forEach((item) => item.draw(ctx));
}

function updateAllEnemyTypes(dt) {
    enemies.forEach((e) => e.update(dt));
    flyingEnemies.forEach((e) => e.update(dt));
    fastEnemies.forEach((e) => e.update(dt));
    armoredEnemies.forEach((e) => e.update(dt));
    shootingEnemies.forEach((e) => e.update(dt));
    armoredShootingEnemies.forEach((e) => e.update(dt));
    toughBasicEnemies.forEach((e) => e.update(dt));
    dangerousFlyingEnemies.forEach((e) => e.update(dt));
    if (activeMiniboss) activeMiniboss.update(dt);
}

function drawAllEnemyTypes() {
    enemies.forEach((e) => e.draw());
    flyingEnemies.forEach((e) => e.draw());
    fastEnemies.forEach((e) => e.draw());
    armoredEnemies.forEach((e) => e.draw());
    shootingEnemies.forEach((e) => e.draw());
    armoredShootingEnemies.forEach((e) => e.draw());
    toughBasicEnemies.forEach((e) => e.draw());
    dangerousFlyingEnemies.forEach((e) => e.draw());
    if (activeMiniboss) activeMiniboss.draw();
}

function shouldShowDonkeyScoreInput(currentScore) {
    return currentScore > 0;
}

// In www/donkeyRunner.js



/**
 * Gestisce la logica e la visualizzazione della schermata di Game Over.
 * NUOVO: Chiama la Cloud Function per registrare automaticamente le statistiche.
 */
function processGameOver() {
    gameOverTrigger = false;
    currentGameState = 'GAME_OVER';
    finalScore = Math.floor(score);

    AudioManager.stopMusic();
    AudioManager.playSound('gameOverSound');

    if (accountIconContainer) {
        accountIconContainer.style.display = 'flex';
    }
    if (mobileControlsDiv) {
        mobileControlsDiv.style.display = 'none';
    }

    // --- NUOVA LOGICA DI SALVATAGGIO AUTOMATICO ---
    const currentUser = auth.currentUser;
    if (currentUser) {
        const bossesDefeatedCount = (isGlitchzillaDefeatedThisGame ? 1 : 0) + 
                                  (isTrojanByteDefeatedThisGame ? 1 : 0) + 
                                  (isMissingNumberDefeatedThisGame ? 1 : 0);
        
        const gameData = {
            score: finalScore,
            bossesDefeated: bossesDefeatedCount,
            // In futuro potremmo aggiungere altre statistiche qui
        };

        showToast("Registrazione statistiche...", "info");
        const submitGameResult = httpsCallable(functions, 'submitGameResult');
        submitGameResult(gameData)
            .then((result) => {
                console.log('Cloud function response:', result.data);
                showToast("Statistiche salvate!", "success");
            })
            .catch((error) => {
                console.error("Errore chiamata a submitGameResult:", error);
                showToast(`Errore salvataggio: ${error.message}`, "error");
            });
    }
    // --- FINE NUOVA LOGICA ---

    // Mostra il contenitore del punteggio
    if (scoreInputContainerDonkey) {
        const finalScoreDisplay = document.getElementById('finalScoreDisplayDonkey');
        if (finalScoreDisplay) {
            finalScoreDisplay.textContent = finalScore;
        }
        scoreInputContainerDonkey.style.display = 'flex';
        
        // La logica per mostrare/nascondere l'input delle iniziali è rimossa
        // perché ora gestiamo solo utenti loggati. La UI verrà semplificata nella Fase 3.
    }
}


function checkCollisions() {
    if (!asyncDonkey) return;
    const playerRect = {
        x: asyncDonkey.x + asyncDonkey.colliderOffsetX,
        y: asyncDonkey.y + asyncDonkey.colliderOffsetY,
        width: asyncDonkey.colliderWidth,
        height: asyncDonkey.colliderHeight,
    };

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        if (
            playerRect.x < obs.x + obs.width &&
            playerRect.x + playerRect.width > obs.x &&
            playerRect.y < obs.y + obs.height &&
            playerRect.y + playerRect.height > obs.y
        ) {
            if (asyncDonkey.isFirewallActive) {
                obstacles.splice(i, 1);
                score += 10;
                AudioManager.playSound('blockBreak', false, 0.7);
                continue;
            }
            if (asyncDonkey.isShieldActive) {
                asyncDonkey.isShieldActive = false;
                obstacles.splice(i, 1);
                AudioManager.playSound('shieldBlock');
                continue;
            }
            gameOverTrigger = true;
            AudioManager.playSound('playerHit');
            processGameOver();
            return;
        }
    }

    for (let i = flyingEnemies.length - 1; i >= 0; i--) {
        const enemy = flyingEnemies[i];
        if (
            playerRect.x < enemy.x + enemy.width &&
            playerRect.x + playerRect.width > enemy.x &&
            playerRect.y < enemy.y + enemy.height &&
            playerRect.y + playerRect.height > enemy.y
        ) {
            flyingEnemies.splice(i, 1);
            score += enemy.scoreValue;
            AudioManager.playSound('powerUpCollect');

            const randomTypeIndex = Math.floor(Math.random() * Object.keys(POWERUP_TYPE).length);
            const randomType = Object.values(POWERUP_TYPE)[randomTypeIndex];
            powerUpItems.push(
                new PowerUpItem(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, randomType, images)
            );
        }
    }

    const allDamagingEnemyArrays = [
        enemies,
        fastEnemies,
        armoredEnemies,
        shootingEnemies,
        armoredShootingEnemies,
        toughBasicEnemies,
        dangerousFlyingEnemies,
    ];
    if (activeMiniboss) allDamagingEnemyArrays.push([activeMiniboss]);

    for (const enemyArray of allDamagingEnemyArrays) {
        for (let i = enemyArray.length - 1; i >= 0; i--) {
            const enemy = enemyArray[i];
            if (!enemy) continue;
            if (
                playerRect.x < enemy.x + enemy.width &&
                playerRect.x + playerRect.width > enemy.x &&
                playerRect.y < enemy.y + enemy.height &&
                playerRect.y + playerRect.height > enemy.y
            ) {
                if (asyncDonkey.isShieldActive) {
                    asyncDonkey.isShieldActive = false;
                    enemyArray.splice(i, 1);
                    AudioManager.playSound('shieldBlock');
                    score += enemy.scoreValue || 10;
                    continue;
                }
                gameOverTrigger = true;
                AudioManager.playSound('playerHit');
                processGameOver();
                return;
            }
        }
    }

    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        if (!proj) continue;
        let projectileRemoved = false;

        const allShootableEnemyArrays = [...allDamagingEnemyArrays, flyingEnemies];
        for (const enemyArray of allShootableEnemyArrays) {
            if (projectileRemoved) break;
            for (let j = enemyArray.length - 1; j >= 0; j--) {
                const enemy = enemyArray[j];
                if (!enemy) continue;
                if (
                    proj.x < enemy.x + enemy.width &&
                    proj.x + proj.width > enemy.x &&
                    proj.y < enemy.y + enemy.height &&
                    proj.y + proj.height > enemy.y
                ) {
                    enemy.takeDamage(proj.damage);
                    AudioManager.playSound('enemyHit');
                    projectiles.splice(i, 1);
                    projectileRemoved = true;

                    if (enemy.health <= 0) {
                        enemyArray.splice(j, 1);
                        score += enemy.scoreValue;
                        AudioManager.playSound('enemyExplode');

                        if (
                            (enemy instanceof DangerousFlyingEnemy || enemy.isDangerousFlyer) &&
                            Math.random() < POWER_UP_DROP_CHANCE_FROM_FLYING_ENEMY
                        ) {
                            const randomTypeIndex = Math.floor(Math.random() * Object.keys(POWERUP_TYPE).length);
                            const randomType = Object.values(POWERUP_TYPE)[randomTypeIndex];
                            powerUpItems.push(
                                new PowerUpItem(
                                    enemy.x + enemy.width / 2,
                                    enemy.y + enemy.height / 2,
                                    randomType,
                                    images
                                )
                            );
                        }
                    }
                    break;
                }
            }
        }

        if (asyncDonkey && asyncDonkey.isBlockBreakerActive && !projectileRemoved) {
            for (let k = obstacles.length - 1; k >= 0; k--) {
                const obs = obstacles[k];
                if (
                    proj.x < obs.x + obs.width &&
                    proj.x + proj.width > obs.x &&
                    proj.y < obs.y + obs.height &&
                    proj.y + proj.height > obs.y
                ) {
                    if (obs.takeDamage(proj.damage)) {
                        obstacles.splice(k, 1);
                        score += 10;
                    }
                    projectiles.splice(i, 1);
                    projectileRemoved = true;
                    break;
                }
            }
        }
    }

    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        const eProj = enemyProjectiles[i];
        if (
            playerRect.x < eProj.x + eProj.width &&
            playerRect.x + playerRect.width > eProj.x &&
            playerRect.y < eProj.y + eProj.height &&
            playerRect.y + playerRect.height > eProj.y
        ) {
            enemyProjectiles.splice(i, 1);
            if (asyncDonkey.isShieldActive) {
                asyncDonkey.isShieldActive = false;
                AudioManager.playSound('shieldBlock');
                continue;
            }
            gameOverTrigger = true;
            AudioManager.playSound('playerHit');
            processGameOver();
            return;
        }
    }

    for (let i = powerUpItems.length - 1; i >= 0; i--) {
        const item = powerUpItems[i];
        if (
            playerRect.x < item.x + item.width &&
            playerRect.x + playerRect.width > item.x &&
            playerRect.y < item.y + item.height &&
            playerRect.y + playerRect.height > item.y
        ) {
            asyncDonkey.activatePowerUp(item.type);
            powerUpItems.splice(i, 1);
        }
    }
}

function resetGame() {
    asyncDonkey = new Player(playerInitialX, playerInitialY, PLAYER_TARGET_WIDTH, PLAYER_TARGET_HEIGHT);
    obstacles = [];
    projectiles = [];
    enemies = [];
    flyingEnemies = [];
    fastEnemies = [];
    armoredEnemies = [];
    shootingEnemies = [];
    armoredShootingEnemies = [];
    toughBasicEnemies = [];
    dangerousFlyingEnemies = [];
    enemyProjectiles = [];
    powerUpItems = [];

    activeMiniboss = null;

    bossFightImminent = false;
    hasGlitchzillaSpawnedThisGame = false;
    isGlitchzillaDefeatedThisGame = false;
    hasTrojanByteSpawnedThisGame = false;
    isTrojanByteDefeatedThisGame = false;
    hasMissingNumberSpawnedThisGame = false;
    isMissingNumberDefeatedThisGame = false;
    postBossCooldownActive = false;
    bossWarningTimer = 2.0;
    postBossCooldownTimer = 2.0;

    // RESET DEI NUOVI FLAG DEI POWER-UP PERMANENTI
    hasSlayerSubroutineUpgrade = false;
    hasCodeInjectorUpgrade = false;

    score = 0;
    finalScore = 0;
    gameOverTrigger = false;
    canShoot = true;
    shootTimer = 0;

    obstacleSpawnTimer = 0;
    nextObstacleSpawnTime = calculateNextObstacleSpawnTime();
    enemyBaseSpawnTimer = 0;
    nextEnemyBaseSpawnTime = calculateNextEnemyBaseSpawnTime();
    flyingEnemySpawnTimer = 0;
    nextFlyingEnemySpawnTime = calculateNextFlyingEnemySpawnTime();
    fastEnemySpawnTimer = 0;
    nextFastEnemySpawnTime = calculateNextGenericEnemySpawnTime(4, 6);
    armoredEnemySpawnTimer = 0;
    nextArmoredEnemySpawnTime = calculateNextGenericEnemySpawnTime(6, 9);
    shootingEnemySpawnTimer = 0;
    nextShootingEnemySpawnTime = calculateNextGenericEnemySpawnTime(5, 8);
    armoredShootingEnemySpawnTimer = 0;
    nextArmoredShootingEnemySpawnTime = calculateNextGenericEnemySpawnTime(8, 12);
    toughBasicEnemySpawnTimer = 0;
    nextToughBasicEnemySpawnTime = calculateNextGenericEnemySpawnTime(3, 5);
    dangerousFlyingEnemySpawnTimer = 0;
    nextDangerousFlyingEnemySpawnTime = calculateNextGenericEnemySpawnTime(7, 10);
    powerUpSpawnTimer = 0;
    nextPowerUpSpawnTime = calculateNextPowerUpAmbientSpawnTime();

    gameStats = {
        jumps: 0,
        shotsFired: 0,
        powerUpsCollected: 0
    };

    // Nascondi il contenitore dei punteggi
    if (scoreInputContainerDonkey) {
        scoreInputContainerDonkey.style.display = 'none';
    }

    // **BUG FIX**: Ripristina lo stato iniziale dei pulsanti
    
    if (shareScoreBtnDonkey) {
    shareScoreBtnDonkey.style.display = 'inline-block'; // o 'flex' a seconda dello stile del tuo container
}

    // Ripristina anche gli elementi per l'input dell'ospite
    const playerInitialsDonkeyInput = document.getElementById('playerInitialsDonkey');
    const playerInitialsLabel = document.getElementById('playerInitialsLabel');
    if (playerInitialsDonkeyInput) {
        playerInitialsDonkeyInput.style.display = 'block';
    }
    if (playerInitialsLabel) {
        playerInitialsLabel.style.display = 'block';
    }

    console.log('Gioco resettato.');
}


function drawTerminalBackgroundEffects() {
    const lines = 30;
    const chars = '01';
    ctx.font = '12px "Source Code Pro", monospace';
    for (let i = 0; i < lines; i++) {
        if (Math.random() < 0.3) {
            ctx.fillStyle = `rgba(0, 255, 0, ${Math.random() * 0.03})`;
            ctx.fillRect(0, (canvas.height / lines) * i, canvas.width, 1);
        }
        if (Math.random() < 0.05) {
            let randomText = '';
            for (let j = 0; j < 20; j++) {
                randomText += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            ctx.fillStyle = `rgba(0, 100, 0, ${0.1 + Math.random() * 0.2})`;
            if (Math.random() < 0.5) {
                ctx.fillText(randomText, 10 + Math.random() * 20, Math.random() * canvas.height);
            } else {
                ctx.fillText(randomText, canvas.width - 150 - Math.random() * 20, Math.random() * canvas.height);
            }
        }
    }
}

function drawGlitchText(
    text,
    x,
    y,
    fontSize,
    primaryColor,
    glitchColor1,
    glitchColor2,
    glitchOffsetX = 2,
    glitchOffsetY = 1
) {
    ctx.font = `${fontSize}px "Source Code Pro", "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    if (Math.random() < 0.1) {
        const offsetX = (Math.random() - 0.5) * glitchOffsetX * 2;
        const offsetY = (Math.random() - 0.5) * glitchOffsetY * 2;
        ctx.fillStyle = Math.random() < 0.5 ? glitchColor1 : glitchColor2;
        ctx.fillText(text, x + offsetX, y + offsetY);
    }
    ctx.fillStyle = primaryColor;
    ctx.fillText(text, x, y);
}

function drawMenuScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = PALETTE.DARK_BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawTerminalBackgroundEffects();
    drawGround();

    const incomingChallengeScore = getUrlParameter('challengeScore');
    const incomingChallengerName = getUrlParameter('challengerName');
    const numericalChallengeScore = parseInt(incomingChallengeScore, 10);

    drawGlitchText(
        'codeDash!',
        canvas.width / 2,
        canvas.height / 2 - 100,
        48,
        PALETTE.BRIGHT_GREEN_TEAL, PALETTE.MEDIUM_TEAL, PALETTE.DARK_TEAL_BLUE, 5, 3
    );

    if (incomingChallengerName && !isNaN(numericalChallengeScore) && numericalChallengeScore > 0) {
        drawGlitchText(
            `SYSTEM_ALERT: Sfida da ${incomingChallengerName}!`,
            canvas.width / 2,
            canvas.height / 2 - 20,
            28,
            PALETTE.BRIGHT_TEAL, PALETTE.MEDIUM_PURPLE, PALETTE.DARK_TEAL_BLUE, 3, 2
        );
        drawGlitchText(
            `TARGET SCORE: ${numericalChallengeScore}. Routine di superamento richiesta!`,
            canvas.width / 2,
            canvas.height / 2 + 20,
            22,
            PALETTE.BRIGHT_TEAL, PALETTE.MEDIUM_PURPLE, PALETTE.DARK_TEAL_BLUE, 2, 1
        );

        if (isTouchDevice && mobileStartButton) {
            mobileStartButton.textContent = '_RUN';
            mobileStartButton.style.display = 'block';
        } else {
            drawGlitchText(
                'Premi INVIO per ESEGUIRE!',
                canvas.width / 2,
                canvas.height / 2 + 70,
                26,
                PALETTE.BRIGHT_GREEN_TEAL, PALETTE.MEDIUM_TEAL, PALETTE.DARK_TEAL_BLUE, 3, 1
            );
        }
    } else {
        if (isTouchDevice && mobileStartButton) {
            mobileStartButton.innerHTML = '<span class="material-symbols-rounded">play_arrow</span><span class="visually-hidden">Start Game</span>';
            mobileStartButton.style.display = 'block';
        } else {
            drawGlitchText(
                'Premi INVIO per Iniziare',
                canvas.width / 2,
                canvas.height / 2 + 20,
                28,
                PALETTE.BRIGHT_TEAL, PALETTE.MEDIUM_PURPLE, PALETTE.DARK_TEAL_BLUE, 3, 2
            );
        }
    }
    ctx.fillStyle = PALETTE.MEDIUM_TEAL;
    ctx.font = '16px "Source Code Pro", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
        'Controlli: SPAZIO/FRECCIA SU per Saltare, CTRL/X per Sparare',
        canvas.width / 2,
        canvas.height - groundHeight - 30
    );
}

function updatePlaying(dt) {
    if (!asyncDonkey) return;

    // Gestione del cooldown post-boss
    if (postBossCooldownActive) {
        postBossCooldownTimer -= dt;
        if (postBossCooldownTimer <= 0) {
            postBossCooldownActive = false;
            console.log('Post-boss cooldown terminato. Ripresa del gioco normale.');
        }
    }

    // --- Logica di Inizio Battaglia Boss (Trigger della fase di warning) ---
    // Avvia la fase di warning di un boss solo se nessun boss è attivo, nessuna battaglia è imminente,
    // e non c'è un cooldown post-boss attivo.
    if (!activeMiniboss && !bossFightImminent && !postBossCooldownActive) {
        if (!isGlitchzillaDefeatedThisGame && score >= GLITCHZILLA_SPAWN_SCORE_THRESHOLD) {
            console.log('Soglia punteggio per Glitchzilla raggiunta. Avvio sequenza di spawn (2s warning).');
            bossFightImminent = true;
            bossWarningTimer = 2.0;
            hasGlitchzillaSpawnedThisGame = true; // Marchia che la fase di questo boss è stata triggerata
        } else if (isGlitchzillaDefeatedThisGame && !isTrojanByteDefeatedThisGame && score >= TROJAN_BYTE_SPAWN_SCORE_THRESHOLD) {
            console.log('Soglia punteggio per Trojan_Byte raggiunta. Avvio sequenza di spawn (2s warning).');
            bossFightImminent = true;
            bossWarningTimer = 2.0;
            hasTrojanByteSpawnedThisGame = true; // Marchia che la fase di questo boss è stata triggerata
        } else if (isGlitchzillaDefeatedThisGame && isTrojanByteDefeatedThisGame && !isMissingNumberDefeatedThisGame && score >= MISSING_NUMBER_SPAWN_SCORE_THRESHOLD) {
            console.log('Soglia punteggio per Missing_Number raggiunta. Avvio sequenza di spawn (2s warning).');
            bossFightImminent = true;
            bossWarningTimer = 2.0;
            hasMissingNumberSpawnedThisGame = true; // Marchia che la fase di questo boss è stata triggerata
        }
    }

    // --- Logica di Spawn Effettivo del Boss (Crea l'oggetto boss dopo il warning) ---
    // Questo avviene DOPO che il timer del warning è scaduto, ma solo se nessun boss è attualmente attivo.
    if (bossFightImminent && !activeMiniboss && !postBossCooldownActive) {
        bossWarningTimer -= dt;
        if (bossWarningTimer <= 0) {
            // Controlla quale boss deve spawnare in base ai flag di 'triggered' e 'defeated'
            if (hasGlitchzillaSpawnedThisGame && !isGlitchzillaDefeatedThisGame) {
                console.log('Warning timer scaduto. Spawn di Glitchzilla!');
                const bossY = canvas.height - groundHeight - GLITCHZILLA_TARGET_HEIGHT;
                activeMiniboss = new Glitchzilla(canvas.width, bossY);
                bossFightImminent = false; // La battaglia è iniziata, non è più solo "imminente"
            } else if (hasTrojanByteSpawnedThisGame && !isTrojanByteDefeatedThisGame) {
                console.log('Warning timer scaduto. Spawn di Trojan_Byte!');
                const bossY = canvas.height - groundHeight - TROJAN_BYTE_TARGET_HEIGHT;
                activeMiniboss = new TrojanByte(canvas.width, bossY);
                bossFightImminent = false;
            } else if (hasMissingNumberSpawnedThisGame && !isMissingNumberDefeatedThisGame) {
                console.log('Warning timer scaduto. Spawn di Missing_Number!');
                const bossY = canvas.height - groundHeight - MISSING_NUMBER_TARGET_HEIGHT;
                activeMiniboss = new MissingNumber(canvas.width, bossY);
                bossFightImminent = false;
            }
        }
    }

    asyncDonkey.update(dt);
    updateShootCooldown(dt);
    updateProjectiles(dt);
    updateObstacles(dt);
    updateAllEnemyTypes(dt);
    updatePowerUpItems(dt);

    // --- Logica di Spawn dei Nemici Normali (Messa in pausa durante boss fight/warning) ---
    // Genera nemici normali solo se NON c'è un boss attivo, NON una battaglia imminente,
    // e NON c'è un cooldown post-boss.
    if (!activeMiniboss && !bossFightImminent && !postBossCooldownActive) {
        // Determina la fase di gioco corrente in base ai boss sconfitti
        let currentPhase = 0; // 0 = pre-Glitchzilla, 1 = post-Glitchzilla, 2 = post-TrojanByte, 3 = post-MissingNumber

        if (isGlitchzillaDefeatedThisGame) {
            currentPhase = 1;
        }
        if (isTrojanByteDefeatedThisGame) {
            currentPhase = 2;
        }
        if (isMissingNumberDefeatedThisGame) {
            currentPhase = 3;
        }

        switch (currentPhase) {
            case 0: // Prima di Glitchzilla sconfitto
                spawnObstacleIfNeeded(dt);
                spawnEnemyBaseIfNeeded(dt); // enemyOne
                spawnFlyingEnemyIfNeeded(dt); // enemyFive (data packets)
                break;
            case 1: // Dopo Glitchzilla sconfitto, prima di Trojan_Byte sconfitto
                spawnObstacleIfNeeded(dt);
                spawnEnemyBaseIfNeeded(dt);
                spawnFlyingEnemyIfNeeded(dt);
                spawnFastEnemyIfNeeded(dt); // enemyTwo
                spawnArmoredEnemyIfNeeded(dt); // enemyThree
                spawnToughBasicEnemyIfNeeded(dt); // enemySeven
                break;
            case 2: // Dopo Trojan_Byte sconfitto, prima di Missing_Number sconfitto
                spawnObstacleIfNeeded(dt);
                spawnEnemyBaseIfNeeded(dt);
                spawnFlyingEnemyIfNeeded(dt);
                spawnFastEnemyIfNeeded(dt);
                spawnArmoredEnemyIfNeeded(dt);
                spawnToughBasicEnemyIfNeeded(dt);
                spawnShootingEnemyIfNeeded(dt); // enemyFour
                spawnArmoredShootingEnemyIfNeeded(dt); // enemySix
                spawnDangerousFlyingEnemyIfNeeded(dt); // dangerousFlyingEnemy
                break;
            case 3: // Dopo Missing_Number sconfitto (tutti i nemici al massimo)
                spawnObstacleIfNeeded(dt);
                spawnEnemyBaseIfNeeded(dt);
                spawnFlyingEnemyIfNeeded(dt);
                spawnFastEnemyIfNeeded(dt);
                spawnArmoredEnemyIfNeeded(dt);
                spawnShootingEnemyIfNeeded(dt);
                spawnArmoredShootingEnemyIfNeeded(dt);
                spawnToughBasicEnemyIfNeeded(dt);
                spawnDangerousFlyingEnemyIfNeeded(dt);
                // Qui potresti pensare ad aumentare la frequenza o la velocità dei nemici ulteriormente
                break;
        }
        spawnPowerUpAmbientIfNeeded(dt); // I power-up spawnano sempre
    }

    // Questi vengono eseguiti sempre, indipendentemente dalla fase di spawn dei nemici
    checkCollisions();
    if (currentGameState === GAME_STATE.PLAYING) {
        score += dt * 10;
        gameSpeed += dt * 0.3;
    }
}

function drawPlayingScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = PALETTE.DARK_BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawTerminalBackgroundEffects();
    drawGround();
    if (asyncDonkey) asyncDonkey.draw();
    drawObstacles();
    drawAllEnemyTypes();
    drawProjectiles();
    drawPowerUpItems();
    ctx.fillStyle = PALETTE.BRIGHT_GREEN_TEAL;
    ctx.font = '24px "Source Code Pro", "Courier New", Courier, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + Math.floor(score), 20, 40);
    if (asyncDonkey && asyncDonkey.activePowerUp) {
        ctx.fillStyle = PALETTE.BRIGHT_TEAL;
        ctx.font = '18px "Source Code Pro", monospace';
        ctx.textAlign = 'right';
        const powerUpName = POWERUP_THEMATIC_NAMES[asyncDonkey.activePowerUp] || asyncDonkey.activePowerUp;
        ctx.fillText(`Active: ${powerUpName} (${Math.ceil(asyncDonkey.powerUpTimer)}s)`, canvas.width - 20, 40);
    }
}

function drawGameOverScreen() {
    // TODO: [Future Task] Implementare uno schermo nero o verde terminale senza la scritta "GAME OVER"
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // drawGlitchText('GAME OVER', canvas.width / 2, canvas.height / 2 - 80, 60, 'red', '#FF5555', '#AA0000', 6, 3); // Rimosso temporaneamente
    drawGlitchText(
        'Punteggio Finale: ' + Math.floor(finalScore),
        canvas.width / 2,
        canvas.height / 2 - 20, // Spostato leggermente più in alto per lasciare spazio ai pulsanti
        32,
        PALETTE.BRIGHT_GREEN_TEAL,
        PALETTE.MEDIUM_TEAL,
        PALETTE.DARK_TEAL_BLUE,
        4,
        2
    );

    // Rimosso il testo "Premi INVIO per Riprovare" gestito dai nuovi pulsanti
    /*
    if (
        !shouldShowDonkeyScoreInput(finalScore) &&
        (!isTouchDevice || !mobileStartButton || mobileStartButton.style.display === 'none')
    ) {
        drawGlitchText(
            'Premi INVIO per Riprovare',
            canvas.width / 2,
            canvas.height / 2 + 60,
            24,
            PALETTE.BRIGHT_TEAL,
            PALETTE.MEDIUM_PURPLE,
            PALETTE.DARK_TEAL_BLUE,
            3,
            1
        );
    }
    */
}

function gameLoop(timestamp) {
    if (!resourcesInitialized) {
        gameLoopRequestId = requestAnimationFrame(gameLoop);
        return;
    }
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    switch (currentGameState) {
        case GAME_STATE.MENU:
            drawMenuScreen();
            break;
        case GAME_STATE.PLAYING:
            updatePlaying(deltaTime);
            drawPlayingScreen();
            break;
        case GAME_STATE.GAME_OVER:
            drawGameOverScreen();
            break;
    }
    gameLoopRequestId = requestAnimationFrame(gameLoop);
}

function startGameLoop() {
    if (gameLoopRequestId) {
        cancelAnimationFrame(gameLoopRequestId);
    }
    lastTime = performance.now();
    gameLoopRequestId = requestAnimationFrame(gameLoop);
    console.log('Game loop avviato.');
}

let isFullscreenActive = false;

async function toggleFullscreen() {
    if (isIPhone) {
        console.log('toggleFullscreen chiamato su iPhone, ma il pulsante dovrebbe essere nascosto. Nessuna azione intrapresa.');
        return;
    }

    if (!gameContainer) return;
    const isCurrentlyFullscreen =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

    if (!isCurrentlyFullscreen) {
        try {
            if (gameContainer.requestFullscreen) {
                await gameContainer.requestFullscreen();
            } else if (gameContainer.webkitRequestFullscreen) {
                await gameContainer.webkitRequestFullscreen();
            } else if (gameContainer.msRequestFullscreen) {
                await gameContainer.msRequestFullscreen();
            }
        } catch (err) {
            console.error(`Errore attivazione fullscreen: ${err.message} (${err.name})`);
            showToast('Impossibile attivare la modalità fullscreen.', 'error');
        }
    } else {
        try {
            if (document.exitFullscreen) await document.exitFullscreen();
            else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
            else if (document.msExitFullscreen) await document.msExitFullscreen();
        } catch (err) {
            console.error(`Errore uscita fullscreen: ${err.message} (${err.name})`);
        }
    }
}


function handleFullscreenChange() {
    isFullscreenActive = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
    );

    if (isFullscreenActive) {
        document.body.classList.add('game-fullscreen-active');
        if (
            isTouchDevice &&
            screen.orientation &&
            (screen.orientation.type.startsWith('landscape') || window.innerWidth > window.innerHeight)
        ) {
            document.body.classList.add('game-fullscreen-landscape');
        } else {
            document.body.classList.remove('game-fullscreen-landscape');
        }
        if (fullscreenButton) fullscreenButton.textContent = 'ESCI';
    } else {
        document.body.classList.remove('game-fullscreen-active');
        document.body.classList.remove('game-fullscreen-landscape');
        if (fullscreenButton) fullscreenButton.textContent = 'FULLSCREEN';
    }
    checkAndDisplayOrientationPrompt();
}

/**
 * Helper function to attach all event listeners.
 */
function attachEventListeners() {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    if (screen.orientation) {
        screen.orientation.addEventListener('change', () => {
            if (isFullscreenActive) {
                if (screen.orientation.type.startsWith('landscape')) {
                    document.body.classList.add('game-fullscreen-landscape');
                } else {
                    document.body.classList.remove('game-fullscreen-landscape');
                }
            }
        });
    }

    if (jumpButton) {
        jumpButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (asyncDonkey && currentGameState === GAME_STATE.PLAYING) asyncDonkey.jump();
        });
        jumpButton.addEventListener(
            'touchstart',
            (e) => {
                e.preventDefault();
                if (asyncDonkey && currentGameState === GAME_STATE.PLAYING) asyncDonkey.jump();
            },
            { passive: false }
        );
    }
    if (shootButton) {
        shootButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (asyncDonkey && currentGameState === GAME_STATE.PLAYING) asyncDonkey.shoot();
        });
        shootButton.addEventListener(
            'touchstart',
            (e) => {
                e.preventDefault();
                if (asyncDonkey && currentGameState === GAME_STATE.PLAYING) asyncDonkey.shoot();
            },
            { passive: false }
        );
    }

    if (fullscreenButton) {
        if (!isIPhone) {
            fullscreenButton.addEventListener('click', toggleFullscreen);
            console.log('Event listener per fullscreenButton aggiunto (non è un iPhone).');
        } else {
            console.log('Event listener per fullscreenButton NON aggiunto (è un iPhone).');
        }
    }
    
    if (restartGameBtnDonkey) {
        restartGameBtnDonkey.addEventListener('click', () => {
            if (scoreInputContainerDonkey) scoreInputContainerDonkey.style.display = 'none';
            // currentGameState = GAME_STATE.PLAYING; // launchGame() will handle this
            // resetGame(); // launchGame() will call resetGame()
            // AudioManager.playMusic(false); // launchGame() will handle this
            // if (mobileStartButton) mobileBobileStartButton.style.display = 'none'; // launchGame() will handle this
            // if (accountIconBtn) accountIconBtn.style.display = 'none'; // launchGame() will handle this
            launchGame(); // Call launchGame to properly restart and show controls
        });
    }
    if (shareScoreBtnDonkey) {
        shareScoreBtnDonkey.addEventListener('click', handleShareScore);
    }

    // Nuovo: Event Listener per il pulsante "Torna al Menu Principale"
    if (mainMenuBtn) { // **CORRETTO** usa la variabile corretta
        mainMenuBtn.addEventListener('click', () => {
            if (scoreInputContainerDonkey) scoreInputContainerDonkey.style.display = 'none';
            currentGameState = GAME_STATE.MENU; // Imposta lo stato su MENU
            resetGame(); // Resetta il gioco, ma non avviare il loop
            AudioManager.stopMusic(); // Ferma la musica del gioco
            // Mostra il menu principale
            const mainMenu = document.getElementById('main-menu');
            const gameContainerWrapper = document.getElementById('game-container-wrapper');
            if (mainMenu) {
                mainMenu.style.display = 'flex';
                mainMenu.style.opacity = '1';
                mainMenu.style.zIndex = '900';
            }
            if (gameContainerWrapper) {
                gameContainerWrapper.style.display = 'none'; // Nascondi il contenitore del gioco
            }
            if (accountIconBtn) accountIconBtn.style.display = 'flex'; // Mostra l'icona account/login
        });
    }

    // Event Listener for the mobile Start/Restart button
    if (mobileStartButton) {
        mobileStartButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentGameState === GAME_STATE.MENU || currentGameState === GAME_STATE.GAME_OVER) {
                launchGame();
            }
        });
    }

    // --- Event Listeners for Credits Modal ---
    // Rimozione completa di creditsIconBtn (già fatto in index.html)
    // Non servono più riferimenti o event listener per creditsIconBtn.

    // Questi event listener restano per la modale crediti, che può essere aperta dal menu principale
    // tramite glitchpedia-btn, non più da un'icona in gioco.
    if (closeCreditsModalBtn && creditsModal) {
        closeCreditsModalBtn.addEventListener('click', () => {
            creditsModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target == creditsModal) {
            creditsModal.style.display = 'none';
        }
    });

    // --- Logic for Expandable Info Cards (Accordion) ---
    if (accordionHeaders.length > 0) {
        accordionHeaders.forEach((header) => {
            header.addEventListener('click', function () {
                const currentlyActiveHeader = document.querySelector('.accordion-header.active');
                if (currentlyActiveHeader && currentlyActiveHeader !== this) {
                    currentlyActiveHeader.classList.remove('active');
                    const activePanel = currentlyActiveHeader.nextElementSibling;
                    activePanel.style.maxHeight = null;
                    activePanel.classList.remove('open');
                }

                this.classList.toggle('active');
                const panel = this.nextElementSibling;
                if (panel.style.maxHeight) {
                    panel.style.maxHeight = null;
                    panel.classList.remove('open');
                } else {
                    panel.classList.add('open');
                    panel.style.maxHeight = panel.scrollHeight + 'px';
                }
            });
        });
    }

    if (scrollToTutorialLink && accordionHeaders.length > 0) {
        scrollToTutorialLink.addEventListener('click', function (event) {
            event.preventDefault();

            const accordionContainer = document.getElementById('gameInfoAccordion');
            if (accordionContainer) {
                accordionContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            const firstHeader = accordionHeaders[0];
            const firstPanel = firstHeader.nextElementSibling;

            if (!firstHeader.classList.contains('active')) {
                const currentlyActiveHeader = document.querySelector('.accordion-header.active');
                if (currentlyActiveHeader) {
                    currentlyActiveHeader.classList.remove('active');
                    const activePanel = currentlyActiveHeader.nextElementSibling;
                    activePanel.style.maxHeight = null;
                    activePanel.classList.remove('open');
                }

                firstHeader.classList.add('active');
                firstPanel.classList.add('open');
                firstPanel.style.maxHeight = firstPanel.scrollHeight + 'px';
            }
        });
    }

    if (dismissOrientationPromptBtn && orientationPromptEl) {
        dismissOrientationPromptBtn.addEventListener('click', () => {
            orientationPromptEl.style.display = 'none';
            orientationPromptDismissedSession = true;
            console.log('Prompt orientamento chiuso dall utente per questa sessione.');
        });
    }

    if (window.matchMedia('(orientation: portrait)').addEventListener) {
        window.matchMedia('(orientation: portrait)').addEventListener('change', checkAndDisplayOrientationPrompt);
    } else if (window.addEventListener) {
        window.addEventListener('orientationchange', checkAndDisplayOrientationPrompt);
    }

    window.addEventListener('keydown', (e) => {
        // Questa logica è ora più semplice
        if (!resourcesInitialized) return;
        if (AudioManager.audioContext && AudioManager.audioContext.state === 'suspended') {
            AudioManager.audioContext.resume().catch((err) => console.error('Error resuming AudioContext:', err));
        }
        switch (currentGameState) {
            case 'MENU':
                if (e.key === 'Enter') {
                    launchGame();
                }
                break;
            case 'PLAYING':
                if (asyncDonkey) {
                    if (e.code === 'Space' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        asyncDonkey.jump();
                    }
                    if (e.code === 'ControlLeft' || e.key === 'x' || e.key === 'X' || e.key === 'ControlRight') {
                        e.preventDefault();
                        asyncDonkey.shoot();
                    }
                }
                break;
            case 'GAME_OVER':
                if (
                    e.key === 'Enter' &&
                    (!scoreInputContainerDonkey || scoreInputContainerDonkey.style.display === 'none')
                ) {
                    launchGame();
                }
                break;
        }
    });
}

// Remove auto-executing calls from here. These will be triggered from index.html or loader.js
