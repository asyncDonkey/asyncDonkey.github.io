// js/donkeyRunner.js
import { Animation } from './animation.js';
import { PowerUpItem, POWERUP_TYPE, POWERUP_DURATION, POWERUP_COLORS, POWERUP_TARGET_HEIGHT, POWERUP_TARGET_WIDTH } from './powerUps.js';
import * as AudioManager from './audioManager.js';
import { Glitchzilla } from './minibosses.js';

console.log("Script donkeyRunner.js caricato.");

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 450;
const groundHeight = 70;
const gravity = 0.15;
let gameSpeed = 220;
const lineWidth = 2;
const GLOBAL_SPRITE_SCALE_FACTOR = 1.5;

// Player
const PLAYER_SPRITESHEET_SRC = 'images/asyncDonkey_walk.png';
const PLAYER_ACTUAL_FRAME_WIDTH = 32; const PLAYER_ACTUAL_FRAME_HEIGHT = 32; const PLAYER_NUM_WALK_FRAMES = 5;
const PLAYER_TARGET_WIDTH = 60; const PLAYER_TARGET_HEIGHT = 60;

// Player Projectiles
const PLAYER_PROJECTILE_SPRITE_SRC = 'images/bitProjectile.png';
const PLAYER_UPGRADED_PROJECTILE_SPRITE_SRC = 'images/playerUpgradedProjectile.png'; // For DEBUG_MODE
const PLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH = 24; const PLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT = 8;
const PLAYER_PROJECTILE_NUM_FRAMES = 4;
const PLAYER_PROJECTILE_ANIMATION_SPEED = 0.08;
export const PLAYER_PROJECTILE_TARGET_WIDTH = PLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
export const PLAYER_PROJECTILE_TARGET_HEIGHT = PLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const PROJECTILE_VERTICAL_OFFSET = 15 * GLOBAL_SPRITE_SCALE_FACTOR;

// Obstacle
const OBSTACLE_SPRITE_SRC = 'images/codeBlock.png';
const OBSTACLE_ACTUAL_FRAME_WIDTH = 32; const OBSTACLE_ACTUAL_FRAME_HEIGHT = 32; const OBSTACLE_NUM_FRAMES = 1;
const OBSTACLE_TARGET_WIDTH = OBSTACLE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const OBSTACLE_TARGET_HEIGHT = OBSTACLE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const OBSTACLE_HEALTH = 1;

// --- Enemy Generic Projectile Base ---
const ENEMY_PROJECTILE_DEFAULT_SPRITE_SRC = 'images/enemy_projectile_default.png'; // A default/fallback
const ENEMY_PROJECTILE_DEFAULT_ACTUAL_FRAME_WIDTH = 16;
const ENEMY_PROJECTILE_DEFAULT_ACTUAL_FRAME_HEIGHT = 16;
const ENEMY_PROJECTILE_DEFAULT_NUM_FRAMES = 4; // Assume 4 frames for default
const ENEMY_PROJECTILE_DEFAULT_TARGET_WIDTH = ENEMY_PROJECTILE_DEFAULT_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_PROJECTILE_DEFAULT_TARGET_HEIGHT = ENEMY_PROJECTILE_DEFAULT_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
export const ENEMY_PROJECTILE_SPEED = 250;

// Enemy One (Basic)
const ENEMY_ONE_SPRITE_SRC = 'images/enemyOne.png';
const ENEMY_ONE_ACTUAL_FRAME_WIDTH = 48; const ENEMY_ONE_ACTUAL_FRAME_HEIGHT = 64; const ENEMY_ONE_NUM_FRAMES = 4;
const ENEMY_ONE_TARGET_WIDTH = ENEMY_ONE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_ONE_TARGET_HEIGHT = ENEMY_ONE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;

// Enemy Two (Fast)
const ENEMY_TWO_SPRITE_SRC = 'images/enemyTwo.png';
// ... (dimensions as before)

// Enemy Three (Armored)
const ENEMY_THREE_BASE_SRC = 'images/enemyThree.png';
const ENEMY_THREE_DMG1_SRC = 'images/enemyThreeDmgOne.png';
const ENEMY_THREE_DMG2_SRC = 'images/enemyThreeDmgTwo.png';
// ... (dimensions as before)
const ARMORED_ENEMY_HEALTH = 3;

// Enemy Four (ShootingEnemy)
const ENEMY_FOUR_IDLE_SRC = 'images/enemyFour.png';
const ENEMY_FOUR_SHOOTING_SRC = 'images/enemyFourShooting.png'; // Optional separate shooting sprite
const ENEMY_FOUR_PROJECTILE_SPRITE_SRC = 'images/enemy_four_projectile.png'; // Specific projectile
// ... (dimensions as before)
const SHOOTING_ENEMY_SHOOT_INTERVAL = 2.5;
const SHOOTING_ENEMY_PROJECTILE_SOUND = 'enemy_shoot_light.mp3';

// Enemy Six (ArmoredShootingEnemy)
const ENEMY_SIX_BASE_SRC = 'images/enemySixPlaceholder.png'; // Base sprite
const ENEMY_SIX_DMG1_SRC = 'images/enemySix_dmg1.png';    // Damage sprite 1
const ENEMY_SIX_DMG2_SRC = 'images/enemySix_dmg2.png';    // Damage sprite 2
const ENEMY_SIX_DMG3_SRC = 'images/enemySix_dmg3.png';    // Damage sprite 3
const ENEMY_SIX_PROJECTILE_SPRITE_SRC = 'images/enemy_six_projectile.png'; // Specific projectile
// ... (dimensions as before)
const ARMORED_SHOOTING_ENEMY_HEALTH = 4;
const ARMORED_SHOOTING_ENEMY_SHOOT_INTERVAL = 3.0;
const ARMORED_SHOOTING_ENEMY_PROJECTILE_SOUND = 'enemy_shoot_heavy.mp3';

// Enemy Seven (ToughBasicEnemy)
const ENEMY_SEVEN_BASE_SRC = 'images/enemySevenPlaceholder.png'; // Base sprite
const ENEMY_SEVEN_DMG1_SRC = 'images/enemySeven_dmg1.png';    // Damage sprite 1
// ... (dimensions as before)
const TOUGH_BASIC_ENEMY_HEALTH = 2;

// Dangerous Flying Enemy
const DANGEROUS_FLYING_ENEMY_SRC = 'images/dangerousFlyingEnemyPlaceholder.png';
// ... (dimensions as before)

// --- Miniboss Glitchzilla Constants ---
const GLITCHZILLA_BASE_SPRITE_SRC = 'images/glitchzilla_sprite.png'; // Base
const GLITCHZILLA_DMG1_SPRITE_SRC = 'images/glitchzilla_dmg1.png';   // HP <= 20
const GLITCHZILLA_DMG2_SPRITE_SRC = 'images/glitchzilla_dmg2.png';   // HP <= 10
const GLITCHZILLA_DMG3_SPRITE_SRC = 'images/glitchzilla_dmg3.png';   // HP <= 5
const GLITCHZILLA_PROJECTILE_SPRITE_SRC = 'images/glitchzilla_projectile.png'; // Specific projectile

const GLITCHZILLA_ACTUAL_FRAME_WIDTH = 96;
const GLITCHZILLA_ACTUAL_FRAME_HEIGHT = 96;
const GLITCHZILLA_NUM_FRAMES = 4; // Assume same for all its sprites for now
const GLITCHZILLA_TARGET_WIDTH = GLITCHZILLA_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR * 1.1;
const GLITCHZILLA_TARGET_HEIGHT = GLITCHZILLA_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR * 1.1;
const GLITCHZILLA_HEALTH = 30; // Updated health
const GLITCHZILLA_SCORE_VALUE = 750;
const GLITCHZILLA_SPAWN_SCORE_THRESHOLD = 1500;

// Glitchzilla Projectile - assuming it uses same frame data as default enemy projectile for now
const GLITCHZILLA_PROJECTILE_FRAME_WIDTH = ENEMY_PROJECTILE_DEFAULT_ACTUAL_FRAME_WIDTH;
const GLITCHZILLA_PROJECTILE_FRAME_HEIGHT = ENEMY_PROJECTILE_DEFAULT_ACTUAL_FRAME_HEIGHT;
const GLITCHZILLA_PROJECTILE_NUM_FRAMES = ENEMY_PROJECTILE_DEFAULT_NUM_FRAMES;
const GLITCHZILLA_PROJECTILE_TARGET_WIDTH = ENEMY_PROJECTILE_DEFAULT_TARGET_WIDTH;
const GLITCHZILLA_PROJECTILE_TARGET_HEIGHT = ENEMY_PROJECTILE_DEFAULT_TARGET_HEIGHT;


const GLITCHZILLA_CONFIG = {
    GLITCHZILLA_TARGET_WIDTH, GLITCHZILLA_TARGET_HEIGHT,
    GLITCHZILLA_ACTUAL_FRAME_WIDTH, GLITCHZILLA_ACTUAL_FRAME_HEIGHT,
    GLITCHZILLA_NUM_FRAMES, GLITCHZILLA_HEALTH, GLITCHZILLA_SCORE_VALUE,
    CANVAS_WIDTH: canvas.width,
    GLITCHZILLA_PROJECTILE_SPRITE_SRC, // Pass new projectile const
    GLITCHZILLA_PROJECTILE_FRAME_WIDTH, GLITCHZILLA_PROJECTILE_FRAME_HEIGHT, GLITCHZILLA_PROJECTILE_NUM_FRAMES,
    GLITCHZILLA_PROJECTILE_TARGET_WIDTH, GLITCHZILLA_PROJECTILE_TARGET_HEIGHT
};

// ... (Power-up sprites, ANIMATION_SPEED, POWERUP_THEMATIC_NAMES remain the same) ...
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
    { name: 'firewallDeflect', path: 'audio/firewall_deflect.mp3'}
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
    { name: 'enemyFourShooting', src: ENEMY_FOUR_SHOOTING_SRC },
    { name: 'enemyFourProjectile', src: ENEMY_FOUR_PROJECTILE_SPRITE_SRC }, // Specific projectile
    { name: 'enemySixBase', src: ENEMY_SIX_BASE_SRC },
    { name: 'enemySix_dmg1', src: ENEMY_SIX_DMG1_SRC },
    { name: 'enemySix_dmg2', src: ENEMY_SIX_DMG2_SRC },
    { name: 'enemySix_dmg3', src: ENEMY_SIX_DMG3_SRC },
    { name: 'enemySixProjectile', src: ENEMY_SIX_PROJECTILE_SPRITE_SRC }, // Specific projectile
    { name: 'enemySevenBase', src: ENEMY_SEVEN_BASE_SRC },
    { name: 'enemySeven_dmg1', src: ENEMY_SEVEN_DMG1_SRC },
    { name: 'dangerousFlyingEnemy', src: DANGEROUS_FLYING_ENEMY_SRC },
    { name: 'glitchzilla_base', src: GLITCHZILLA_BASE_SPRITE_SRC },
    { name: 'glitchzilla_dmg1', src: GLITCHZILLA_DMG1_SPRITE_SRC },
    { name: 'glitchzilla_dmg2', src: GLITCHZILLA_DMG2_SPRITE_SRC },
    { name: 'glitchzilla_dmg3', src: GLITCHZILLA_DMG3_SPRITE_SRC },
    { name: 'glitchzillaProjectile', src: GLITCHZILLA_PROJECTILE_SPRITE_SRC }, // Specific projectile
    { name: 'enemyProjectileDefault', src: ENEMY_PROJECTILE_DEFAULT_SPRITE_SRC }, // Fallback
    { name: 'enemyFive', src: ENEMY_FIVE_SPRITE_SRC }, // Flying enemy
    { name: 'powerUpTripleShot', src: POWERUP_TRIPLE_SHOT_SRC },
    { name: 'powerUpShield', src: POWERUP_SHIELD_SRC },
    { name: 'powerUpBomb', src: POWERUP_BOMB_SRC },
    { name: 'powerUpDebugMode', src: POWERUP_DEBUG_MODE_SRC },
    { name: 'powerUpFirewall', src: POWERUP_FIREWALL_SRC },
    { name: 'powerUpBlockBreaker', src: POWERUP_BLOCK_BREAKER_SRC },
];
// ... (rest of global variables, score, timers etc. as before)
let imagesLoadedCount = 0; let allImagesLoaded = false; let resourcesInitialized = false; let gameLoopRequestId = null;

let obstacles = []; let obstacleSpawnTimer = 0; let nextObstacleSpawnTime = 0; const obstacleSpawnColor = '#0f0';
let projectiles = []; let canShoot = true; let shootTimer = 0; const projectileSpeed = 400; const shootCooldownTime = 0.3; const projectileColor = '#0ff';
let enemies = []; let enemyBaseSpawnTimer = 0; let nextEnemyBaseSpawnTime = 0; const enemyBaseSpawnColor = '#0f0';
let flyingEnemies = []; let flyingEnemySpawnTimer = 0; let nextFlyingEnemySpawnTime = 0; const flyingEnemyScoreValue = 100; const flyingEnemySpawnColor = '#ff0';
const POWER_UP_DROP_CHANCE_FROM_FLYING_ENEMY = 0.35;

let fastEnemies = []; let fastEnemySpawnTimer = 0; let nextFastEnemySpawnTime = 0; const fastEnemySpeedMultiplier = 1.5; const fastEnemySpawnColor = '#FFA500';
let armoredEnemies = []; let armoredEnemySpawnTimer = 0; let nextArmoredEnemySpawnTime = 0; const armoredEnemySpeedMultiplier = 0.7; const armoredEnemySpawnColor = '#A9A9A9';
let shootingEnemies = []; let shootingEnemySpawnTimer = 0; let nextShootingEnemySpawnTime = 0; const shootingEnemySpawnColor = '#FF69B4';
export let enemyProjectiles = [];
const enemyProjectileColor = '#f0f';

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


function loadImage(name,src){return new Promise((resolve,reject)=>{const img=new Image();images[name]=img;img.onload=()=>{imagesLoadedCount++;resolve(img);};img.onerror=()=>{console.error(`ERRORE caricamento: ${name} da ${src}`);resolve(null);};img.src=src;});}

async function loadAllAssets() {
    console.log("Carico assets...");
    // Check if all images in imagesToLoad are defined
    for (const imgData of imagesToLoad) {
        if (!imgData || !imgData.src) {
            console.error("Dati immagine mancanti o corrotti in imagesToLoad:", imgData);
        }
    }
    const imagePromises = imagesToLoad.filter(d => d && d.src).map(d => loadImage(d.name, d.src));

    const soundPromises = soundsToLoad.map(s => AudioManager.loadSound(s.name, s.path));
    const backgroundMusicPromise = AudioManager.loadBackgroundMusic(backgroundMusicPath);
    await Promise.allSettled([...imagePromises, ...soundPromises, backgroundMusicPromise]);
    allImagesLoaded = imagesLoadedCount === imagePromises.length; // Check against filtered promises

    console.log("Processo di caricamento assets completato.");
    if(allImagesLoaded) console.log("TUTTE le immagini dichiarate e valide in imagesToLoad sono state caricate con successo.");
    else console.warn("Attenzione: Alcune immagini potrebbero non essersi caricate correttamente (controlla i log ERRORE).");
    resourcesInitialized = true;
    if (gameLoopRequestId === null && currentGameState === GAME_STATE.MENU) {
        startGameLoop();
    }
}


class Player { // Player class - logic mostly same, ensure power-up interactions are solid
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
        if (this.y + this.displayHeight > canvas.height - groundHeight) {
            this.y = canvas.height - groundHeight - this.displayHeight; this.velocityY = 0; this.onGround = true;
        } else { this.onGround = false; }
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
            canShoot = false; shootTimer = 0;
        }
    }

    activatePowerUp(type) {
        const exclusiveTypes = [POWERUP_TYPE.DEBUG_MODE, POWERUP_TYPE.TRIPLE_SHOT, POWERUP_TYPE.BLOCK_BREAKER];

        // If picking up a different power-up, deactivate the current one.
        if (this.activePowerUp && this.activePowerUp !== type) {
            this.deactivatePowerUp();
        } else if (this.activePowerUp === type) { // Picking up the same power-up
            // Just refresh its timer
            this.powerUpTimer = POWERUP_DURATION[type] || this.powerUpTimer;
            console.log(`Timer rinfrescato per ${type}`);
            AudioManager.playSound('powerUpCollect'); // Play collect sound again
            return; // Don't re-apply flags if it's the same power-up
        }

        // Set the new active power-up
        this.activePowerUp = type;

        // Reset all specific effect flags initially
        this.isShieldActive = false;
        this.isFirewallActive = false;
        this.isBlockBreakerActive = false;

        // Activate specific flags based on the new power-up
        switch (type) {
            case POWERUP_TYPE.TRIPLE_SHOT:
                this.powerUpTimer = POWERUP_DURATION.TRIPLE_SHOT;
                console.log("Triple Shot ATTIVATO!");
                break;
            case POWERUP_TYPE.SHIELD:
                this.powerUpTimer = POWERUP_DURATION.SHIELD;
                this.isShieldActive = true;
                console.log("Scudo ATTIVATO!");
                break;
            case POWERUP_TYPE.SMART_BOMB:
                this.activateSmartBomb(); // Handles its own logic (instant, no timer)
                this.activePowerUp = null; // Smart Bomb is instant, clear activePowerUp
                break;
            case POWERUP_TYPE.DEBUG_MODE:
                this.powerUpTimer = POWERUP_DURATION.DEBUG_MODE;
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

        if (type !== POWERUP_TYPE.SMART_BOMB) { // Smart bomb has its own sound logic (enemyExplode)
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
            if (activeMiniboss.takeDamage(10)) { // Smart bomb does more damage to boss
                score += activeMiniboss.scoreValue;
                activeMiniboss = null;
                hasGlitchzillaSpawnedThisGame = true; // Ensure it's marked as dealt with
            }
            console.log("Smart Bomb ha danneggiato pesantemente Glitchzilla!");
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
        } else { /* console.warn("Sprite ostacolo non caricato o rotto."); */ }
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
            AudioManager.playSound('blockBreak', false, 0.7);
            return true;
        }
        return false;
    }
}

export class EnemyProjectile {
    constructor(x, y,
        spriteName = ENEMY_PROJECTILE_DEFAULT_SPRITE_SRC,
        frameWidth = ENEMY_PROJECTILE_DEFAULT_ACTUAL_FRAME_WIDTH,
        frameHeight = ENEMY_PROJECTILE_DEFAULT_ACTUAL_FRAME_HEIGHT,
        numFrames = ENEMY_PROJECTILE_DEFAULT_NUM_FRAMES
    ) {
        this.x = x; this.y = y;
        this.width = frameWidth * GLOBAL_SPRITE_SCALE_FACTOR; // Calculate target from actual frame width
        this.height = frameHeight * GLOBAL_SPRITE_SCALE_FACTOR; // Calculate target from actual frame height
        this.speed = ENEMY_PROJECTILE_SPEED;
        this.sprite = images[spriteName];
        this.animation = null;

        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0 && numFrames > 0) {
            this.animation = new Animation(this.sprite, frameWidth, frameHeight, numFrames, 0.1); // Default anim speed
        } else {
            console.warn(`Sprite proiettile nemico (${spriteName}) non caricato o rotto. Usando fallback color.`);
            this.sprite = null; // Ensure fallback drawing if sprite is bad
        }
    }
    update(dt) { this.x -= this.speed * dt; if (this.animation) this.animation.update(dt); }
    draw() {
        if (this.animation && this.sprite) {
            const f = this.animation.getFrame();
            ctx.drawImage(this.sprite, f.sx, f.sy, this.animation.frameWidth, this.animation.frameHeight, this.x, this.y, this.width, this.height);
        } else if (this.sprite) { // Single frame sprite
             ctx.drawImage(this.sprite, 0, 0, this.sprite.naturalWidth, this.sprite.naturalHeight, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = enemyProjectileColor;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}


export class BaseEnemy {
    constructor(x,y,targetW,targetH,spriteName,frameW,frameH,numFrames,speedMult,hp=1,fallbackColor='#ccc', scoreValue = 25){
        this.x=x;this.y=y;this.width=targetW;this.height=targetH;
        this.speed=gameSpeed*speedMult;this.health=hp;this.maxHealth=hp;
        this.baseSpriteName = spriteName; // Store the name of the base sprite
        this.sprite=images[spriteName];
        this.fallbackColor=fallbackColor;
        this.animation=null;
        this.numFrames = numFrames; // Store for potential re-animation
        this.frameWidth = frameW;   // Store for potential re-animation
        this.frameHeight = frameH;  // Store for potential re-animation
        this.scoreValue = scoreValue;

        if(this.sprite && this.sprite.complete && this.sprite.naturalWidth>0 && numFrames>0){
            this.animation = new Animation(this.sprite,frameW,frameH,numFrames);
        } else {
            if(!this.sprite) console.warn(`Sprite ${spriteName} non trovato per BaseEnemy.`);
            else if (numFrames > 0) console.warn(`Sprite ${spriteName} (${this.sprite ? this.sprite.src : 'N/A'}) per BaseEnemy non caricato o rotto. Animazione non creata.`);
        }
    }
    update(dt){this.x-=this.speed*dt;if(this.animation)this.animation.update(dt);}
    draw(){
        const spriteUsable = this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0;
        if(this.animation && spriteUsable){
            const f=this.animation.getFrame();
            ctx.drawImage(this.sprite,f.sx,f.sy,this.animation.frameWidth,this.animation.frameHeight,this.x,this.y,this.width,this.height);
        } else if (spriteUsable && this.numFrames <= 1) { // Single frame sprite
            ctx.drawImage(this.sprite, 0, 0, this.frameWidth, this.frameHeight, this.x,this.y,this.width,this.height);
        } else if (spriteUsable) { // Fallback for multi-frame if animation object is missing
             const sourceFrameW = this.sprite.naturalWidth / (this.numFrames > 0 ? this.numFrames : 1);
             const sourceFrameH = this.sprite.naturalHeight;
             ctx.drawImage(this.sprite, 0, 0, sourceFrameW, sourceFrameH, this.x,this.y,this.width,this.height);
        } else {
            ctx.strokeStyle=this.fallbackColor;ctx.lineWidth=lineWidth;ctx.strokeRect(this.x,this.y,this.width,this.height);
        }
        if(this.maxHealth>1&&this.health>0&&this.health<this.maxHealth){const hbW=this.width*.8,hbH=5,hbX=this.x+(this.width-hbW)/2,hbY=this.y-hbH-3;ctx.fillStyle='rgba(100,100,100,0.7)';ctx.fillRect(hbX,hbY,hbW,hbH);ctx.fillStyle='rgba(0,255,0,0.7)';ctx.fillRect(hbX,hbY,hbW*(this.health/this.maxHealth),hbH);}
    }
    takeDamage(dmg=1){
        this.health-=dmg;
        if(this.health < 0) this.health = 0;
        // Damaged sprite logic will be in subclasses that override this
    }
}

class ArmoredEnemy extends BaseEnemy {
    constructor(x,y){
        super(x,y,ENEMY_THREE_TARGET_WIDTH,ENEMY_THREE_TARGET_HEIGHT,ENEMY_THREE_BASE_SRC,ENEMY_THREE_ACTUAL_FRAME_WIDTH,ENEMY_THREE_ACTUAL_FRAME_HEIGHT,ENEMY_THREE_NUM_FRAMES,0.7,ARMORED_ENEMY_HEALTH,armoredEnemySpawnColor, 50);
        this.spriteNames = {
            base: ENEMY_THREE_BASE_SRC,
            dmg1: ENEMY_THREE_DMG1_SRC, // Health 2
            dmg2: ENEMY_THREE_DMG2_SRC  // Health 1
        };
        this.updateSpriteBasedOnHealth();
    }

    updateSpriteBasedOnHealth() {
        let newSpriteName = this.spriteNames.base;
        if (this.health === 1) newSpriteName = this.spriteNames.dmg2;
        else if (this.health === 2) newSpriteName = this.spriteNames.dmg1;

        if (this.sprite !== images[newSpriteName] && images[newSpriteName]) {
            this.sprite = images[newSpriteName];
            if (this.sprite.complete && this.sprite.naturalWidth > 0) {
                this.animation = new Animation(this.sprite, this.frameWidth, this.frameHeight, this.numFrames);
            } else { this.animation = null; }
        }
    }
    takeDamage(dmg=1){
        super.takeDamage(dmg);
        this.updateSpriteBasedOnHealth();
    }
    // Draw is inherited from BaseEnemy, sprite is updated by takeDamage
}


class ShootingEnemy extends BaseEnemy {
    constructor(x, y) {
        super(x, y, ENEMY_FOUR_TARGET_WIDTH, ENEMY_FOUR_TARGET_HEIGHT, ENEMY_FOUR_IDLE_SRC, ENEMY_FOUR_ACTUAL_FRAME_WIDTH, ENEMY_FOUR_ACTUAL_FRAME_HEIGHT, ENEMY_FOUR_IDLE_NUM_FRAMES, 0.5, 1, shootingEnemySpawnColor, 40);
        this.idleSpriteName = ENEMY_FOUR_IDLE_SRC;
        this.shootingSpriteName = ENEMY_FOUR_SHOOTING_SRC; // Can be same as idle if no separate anim
        this.projectileSpriteName = ENEMY_FOUR_PROJECTILE_SPRITE_SRC;

        this.shootingAnimation = null;
        const shootingSpriteImg = images[this.shootingSpriteName];
        if (shootingSpriteImg && shootingSpriteImg.complete && shootingSpriteImg.naturalWidth > 0 && ENEMY_FOUR_SHOOTING_NUM_FRAMES > 0) {
            this.shootingAnimation = new Animation(shootingSpriteImg, ENEMY_FOUR_ACTUAL_FRAME_WIDTH, ENEMY_FOUR_ACTUAL_FRAME_HEIGHT, ENEMY_FOUR_SHOOTING_NUM_FRAMES, ANIMATION_SPEED / ENEMY_FOUR_SHOOTING_NUM_FRAMES);
        } else if (ENEMY_FOUR_SHOOTING_NUM_FRAMES > 0) {
            console.warn(`Sprite ${this.shootingSpriteName} non caricato per ShootingEnemy animazione sparo.`);
        }
        this.isShooting = false;
        this.shootTimer = Math.random() * SHOOTING_ENEMY_SHOOT_INTERVAL + 1.5;
        this.shootAnimTimer = 0;
        this.shootAnimDuration = this.shootingAnimation && this.shootingAnimation.animationSpeed > 0 ? (this.shootingAnimation.numFrames * this.shootingAnimation.animationSpeed) : 0.5;
    }
    update(dt) {
        this.x -= this.speed * dt;
        const currentSpriteName = this.isShooting && this.shootingSpriteName ? this.shootingSpriteName : this.idleSpriteName;
        if (this.sprite !== images[currentSpriteName] && images[currentSpriteName]) {
             this.sprite = images[currentSpriteName];
             this.animation = (this.isShooting && this.shootingAnimation) ? this.shootingAnimation : new Animation(this.sprite, this.frameWidth, this.frameHeight, this.numFrames); // Re-create or switch
        }

        if(this.animation) this.animation.update(dt);


        if (this.isShooting) {
            this.shootAnimTimer += dt;
            if (this.shootAnimTimer >= this.shootAnimDuration) {
                this.isShooting = false;
                // Switch back to idle animation if necessary
                if (this.sprite !== images[this.idleSpriteName] && images[this.idleSpriteName]) {
                    this.sprite = images[this.idleSpriteName];
                    this.animation = new Animation(this.sprite, this.frameWidth, this.frameHeight, this.numFrames);
                }
                if(this.animation) this.animation.reset();
            }
        } else {
            this.shootTimer += dt;
            if (this.shootTimer >= SHOOTING_ENEMY_SHOOT_INTERVAL) {
                this.isShooting = true;
                this.shootTimer = 0;
                this.shootAnimTimer = 0;
                 // Switch to shooting animation
                if (this.shootingAnimation && images[this.shootingSpriteName]) {
                    this.sprite = images[this.shootingSpriteName];
                    this.animation = this.shootingAnimation;
                    this.animation.reset();
                }
                enemyProjectiles.push(new EnemyProjectile(this.x - ENEMY_PROJECTILE_TARGET_WIDTH_CONST, this.y + this.height / 2 - ENEMY_PROJECTILE_TARGET_HEIGHT_CONST / 2, this.projectileSpriteName));
                AudioManager.playSound('enemyShootLight', false, 0.5);
            }
        }
    }
    // Draw is inherited from BaseEnemy
}

class FlyingEnemy extends BaseEnemy{constructor(x,y){super(x,y,ENEMY_FIVE_TARGET_WIDTH,ENEMY_FIVE_TARGET_HEIGHT,'enemyFive',ENEMY_FIVE_ACTUAL_FRAME_WIDTH,ENEMY_FIVE_ACTUAL_FRAME_HEIGHT,ENEMY_FIVE_NUM_FRAMES,(0.6+Math.random()*0.3),1,flyingEnemySpawnColor, flyingEnemyScoreValue);this.initialY=y;this.angle=Math.random()*Math.PI*2;this.amplitude=20+Math.random()*20;this.frequency=0.02+Math.random()*0.03;}update(dt){super.update(dt);this.angle+=this.frequency;this.y=this.initialY+Math.sin(this.angle)*this.amplitude;}}

class ArmoredShootingEnemy extends BaseEnemy {
    constructor(x, y) {
        super(x, y, ENEMY_SIX_TARGET_WIDTH, ENEMY_SIX_TARGET_HEIGHT, ENEMY_SIX_BASE_SRC, ENEMY_SIX_ACTUAL_FRAME_WIDTH, ENEMY_SIX_ACTUAL_FRAME_HEIGHT, ENEMY_SIX_IDLE_NUM_FRAMES, 0.4, ARMORED_SHOOTING_ENEMY_HEALTH, armoredShootingEnemySpawnColor, 60);
        this.projectileSpriteName = ENEMY_SIX_PROJECTILE_SPRITE_SRC;
        this.shootTimer = Math.random() * ARMORED_SHOOTING_ENEMY_SHOOT_INTERVAL + 2.0;
        // Potresti aggiungere animazione di sparo distinta qui se vuoi

        this.spriteNames = { // Sprite per stati di danno
            hp4: ENEMY_SIX_BASE_SRC, // Potrebbe essere lo stesso di hp3 se non c'è sprite specifico
            hp3: ENEMY_SIX_DMG1_SRC,
            hp2: ENEMY_SIX_DMG2_SRC,
            hp1: ENEMY_SIX_DMG3_SRC
        };
        this.updateSpriteBasedOnHealth();
    }

    updateSpriteBasedOnHealth() {
        let newSpriteName;
        if (this.health <= 1) newSpriteName = this.spriteNames.hp1;
        else if (this.health <= 2) newSpriteName = this.spriteNames.hp2;
        else if (this.health <= 3) newSpriteName = this.spriteNames.hp3;
        else newSpriteName = this.spriteNames.hp4;

        if (this.sprite !== images[newSpriteName] && images[newSpriteName]) {
            this.sprite = images[newSpriteName];
            if (this.sprite.complete && this.sprite.naturalWidth > 0) { // Assicurati che this.numFrames sia corretto per il nuovo sprite
                this.animation = new Animation(this.sprite, this.frameWidth, this.frameHeight, this.numFrames);
            } else { this.animation = null; console.warn(`Sprite ${newSpriteName} per ArmoredShootingEnemy mancante.`);}
        }
    }

    update(dt) {
        super.update(dt); // Handles movement and base animation update
        this.shootTimer += dt;
        if (this.shootTimer >= ARMORED_SHOOTING_ENEMY_SHOOT_INTERVAL) {
            this.shootTimer = 0;
            enemyProjectiles.push(new EnemyProjectile(this.x - ENEMY_PROJECTILE_TARGET_WIDTH_CONST, this.y + this.height / 2 - ENEMY_PROJECTILE_TARGET_HEIGHT_CONST / 2, this.projectileSpriteName));
            AudioManager.playSound('enemyShootHeavy', false, 0.6);
        }
    }
    takeDamage(dmg = 1) {
        super.takeDamage(dmg);
        this.updateSpriteBasedOnHealth();
    }
    // Draw is inherited
}

class ToughBasicEnemy extends BaseEnemy {
    constructor(x, y) {
        super(x, y, ENEMY_SEVEN_TARGET_WIDTH, ENEMY_SEVEN_TARGET_HEIGHT, ENEMY_SEVEN_BASE_SRC, ENEMY_SEVEN_ACTUAL_FRAME_WIDTH, ENEMY_SEVEN_ACTUAL_FRAME_HEIGHT, ENEMY_SEVEN_NUM_FRAMES, 0.6, TOUGH_BASIC_ENEMY_HEALTH, toughBasicEnemySpawnColor, 30);
        this.spriteNames = {
            hp2: ENEMY_SEVEN_BASE_SRC,
            hp1: ENEMY_SEVEN_DMG1_SRC
        };
        this.updateSpriteBasedOnHealth(); // Set initial sprite
    }
    updateSpriteBasedOnHealth() {
        let newSpriteName = (this.health <= 1) ? this.spriteNames.hp1 : this.spriteNames.hp2;
        if (this.sprite !== images[newSpriteName] && images[newSpriteName]) {
            this.sprite = images[newSpriteName];
             if (this.sprite.complete && this.sprite.naturalWidth > 0) {
                this.animation = new Animation(this.sprite, this.frameWidth, this.frameHeight, this.numFrames);
            } else { this.animation = null; console.warn(`Sprite ${newSpriteName} per ToughBasicEnemy mancante.`);}
        }
    }
    takeDamage(dmg = 1) {
        super.takeDamage(dmg);
        this.updateSpriteBasedOnHealth();
    }
    // Draw is inherited
}

class DangerousFlyingEnemy extends FlyingEnemy { // (Same as before, no multi-HP damage states by default)
    constructor(x, y) {
        super(x, y);
        this.sprite = images['dangerousFlyingEnemy'];
        this.width = DANGEROUS_FLYING_ENEMY_TARGET_WIDTH;
        this.height = DANGEROUS_FLYING_ENEMY_TARGET_HEIGHT;
        this.health = DANGEROUS_FLYING_ENEMY_HEALTH; // Usually 1 HP
        this.scoreValue = 150;
        this.fallbackColor = dangerousFlyingEnemySpawnColor;
        this.animation = null;
         if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0 && DANGEROUS_FLYING_ENEMY_NUM_FRAMES > 0) {
            this.animation = new Animation(this.sprite, DANGEROUS_FLYING_ENEMY_ACTUAL_FRAME_WIDTH, DANGEROUS_FLYING_ENEMY_ACTUAL_FRAME_HEIGHT, DANGEROUS_FLYING_ENEMY_NUM_FRAMES);
        } else {
            if(!this.sprite) console.warn(`Sprite dangerousFlyingEnemy non trovato.`);
            else console.warn(`Sprite dangerousFlyingEnemy (${this.sprite.src}) non caricato o rotto. Animazione non creata.`);
        }
        this.isDangerousFlyer = true;
    }
}


// ... (Rest of the functions: drawGround, spawnObstacleIfNeeded, etc. remain largely the same but check activeMiniboss flag where needed)
function drawGround(){ctx.strokeStyle='#0f0';ctx.lineWidth=lineWidth;ctx.beginPath();ctx.moveTo(0,canvas.height-groundHeight);ctx.lineTo(canvas.width,canvas.height-groundHeight);ctx.stroke();}
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
        activeMiniboss = new Glitchzilla(canvas.width, canvas.height - groundHeight - GLITCHZILLA_CONFIG.GLITCHZILLA_TARGET_HEIGHT, images, GLITCHZILLA_CONFIG);
        console.log("GLITCHZILLA SPAWNED!");
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
            const conflictingOffensive = [POWERUP_TYPE.DEBUG_MODE, POWERUP_TYPE.TRIPLE_SHOT, POWERUP_TYPE.BLOCK_BREAKER];
            const conflictingDefensive = [POWERUP_TYPE.SHIELD, POWERUP_TYPE.FIREWALL];

            if (conflictingOffensive.includes(asyncDonkey.activePowerUp)) {
                availablePowerUps = availablePowerUps.filter(type => !conflictingOffensive.includes(type));
            }
            if (conflictingDefensive.includes(asyncDonkey.activePowerUp)) {
                 availablePowerUps = availablePowerUps.filter(type => !conflictingDefensive.includes(type));
            }
        }

        if (availablePowerUps.length === 0) {
             // If all are conflicting, maybe spawn a non-conflicting one like Smart Bomb or Shield/Firewall if none of those are active
             // For now, just log and skip if no valid power-up.
             console.log("Nessun power-up non conflittuale disponibile per lo spawn (o tutti i tipi sono attivi/conflittuali).");
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
    if (!activeMiniboss) {
        enemies.forEach((e,i)=>{e.update(dt);if(e.x+e.width<0)enemies.splice(i,1);});
        flyingEnemies.forEach((e,i)=>{e.update(dt);if(e.x+e.width<0)flyingEnemies.splice(i,1);});
        fastEnemies.forEach((e,i)=>{e.update(dt);if(e.x+e.width<0)fastEnemies.splice(i,1);});
        armoredEnemies.forEach((e,i)=>{e.update(dt);if(e.x+e.width<0)armoredEnemies.splice(i,1);});
        shootingEnemies.forEach((e,i)=>{e.update(dt);if(e.x+e.width<0)shootingEnemies.splice(i,1);});
        armoredShootingEnemies.forEach((e,i)=>{e.update(dt);if(e.x+e.width<0)armoredShootingEnemies.splice(i,1);});
        toughBasicEnemies.forEach((e,i)=>{e.update(dt);if(e.x+e.width<0)toughBasicEnemies.splice(i,1);});
        dangerousFlyingEnemies.forEach((e,i)=>{e.update(dt);if(e.x+e.width<0)dangerousFlyingEnemies.splice(i,1);});
    }
    enemyProjectiles.forEach((ep,i)=>{ep.update(dt);if(ep.x+ep.width<0)enemyProjectiles.splice(i,1);});

    if (activeMiniboss) {
        activeMiniboss.update(dt, enemyProjectiles);
        if (activeMiniboss.health <= 0) {
            // score already added in takeDamage or collision check
            activeMiniboss = null;
            hasGlitchzillaSpawnedThisGame = true;
        } else if (activeMiniboss.x + activeMiniboss.width < 0) {
            activeMiniboss = null;
            console.log("Glitchzilla uscito dallo schermo.");
            hasGlitchzillaSpawnedThisGame = true;
        }
    }
}
function drawAllEnemyTypes(){
    if (!activeMiniboss) {
        enemies.forEach(e=>e.draw());
        flyingEnemies.forEach(e=>e.draw());
        fastEnemies.forEach(e=>e.draw());
        armoredEnemies.forEach(e=>e.draw());
        shootingEnemies.forEach(e=>e.draw());
        armoredShootingEnemies.forEach(e=>e.draw());
        toughBasicEnemies.forEach(e=>e.draw());
        dangerousFlyingEnemies.forEach(e=>e.draw());
    }
    enemyProjectiles.forEach(ep=>ep.draw());
    if (activeMiniboss) {
        activeMiniboss.draw();
    }
}

function checkCollisions(){
    if(!asyncDonkey||gameOverTrigger)return;
    const pC={x:asyncDonkey.x+asyncDonkey.colliderOffsetX,y:asyncDonkey.y+asyncDonkey.colliderOffsetY,width:asyncDonkey.colliderWidth,height:asyncDonkey.colliderHeight};

    if(!asyncDonkey.isShieldActive){
        const checkPlayerCollisionWithEntity=(entity, isObstacle = false)=>{
            if (isObstacle && asyncDonkey.isFirewallActive) {
                if(entity&&pC.x<entity.x+entity.width&&pC.x+pC.width>entity.x&&pC.y<entity.y+entity.height&&pC.y+pC.height>entity.y){
                     AudioManager.playSound('firewallDeflect', false, 0.6);
                }
                return false;
            }
            if(entity&&pC.x<entity.x+entity.width&&pC.x+pC.width>entity.x&&pC.y<entity.y+entity.height&&pC.y+pC.height>entity.y){
                gameOverTrigger=true; AudioManager.playSound('playerHit'); AudioManager.stopMusic();
                console.error(`HIT Player vs ${entity.constructor.name}`);return true;
            }
            return false;
        };
        const checkPlayerCollisionWithList = (list, isObstacle = false) => {
            for(let entity of list) if(checkPlayerCollisionWithEntity(entity, isObstacle)) return true;
            return false;
        }
        if(checkPlayerCollisionWithList(obstacles, true))return;
        if(!activeMiniboss){ // Only check regular enemies if boss is not active
            if(checkPlayerCollisionWithList(enemies))return; if(checkPlayerCollisionWithList(fastEnemies))return;
            if(checkPlayerCollisionWithList(armoredEnemies))return; if(checkPlayerCollisionWithList(shootingEnemies))return;
            if(checkPlayerCollisionWithList(armoredShootingEnemies))return; if(checkPlayerCollisionWithList(toughBasicEnemies))return;
            if(checkPlayerCollisionWithList(dangerousFlyingEnemies))return;
        }
        if(checkPlayerCollisionWithList(enemyProjectiles)) return; // Always check enemy projectiles
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
                    if (o.takeDamage(p.damage)) { obstacles.splice(k, 1); score += 10; }
                    projectileConsumedThisHit = true; break;
                }
            }
            if(projectileConsumedThisHit){projectiles.splice(i,1);continue;}
        }

        const processProjectileHitOnList=(enemyList, indexInArray)=>{
            if(indexInArray<0||indexInArray>=enemyList.length)return false;
            const e=enemyList[indexInArray];
            if(e&&p.x<e.x+e.width&&p.x+p.width>e.x&&p.y<e.y+e.height&&p.y+p.height>e.y){
                e.takeDamage(p.damage); // Subclasses will handle sprite changes
                AudioManager.playSound('enemyHit', false, 0.6); projectileConsumedThisHit=true;
                if(e.health<=0){
                    AudioManager.playSound('enemyExplode', false, 0.7); score+= e.scoreValue;
                    enemyList.splice(indexInArray,1);
                    const actuallyDangerousFlyer = e.isDangerousFlyer === true;
                    const isRegularFlying = e instanceof FlyingEnemy && !actuallyDangerousFlyer;
                    if(actuallyDangerousFlyer || (isRegularFlying && Math.random() < POWER_UP_DROP_CHANCE_FROM_FLYING_ENEMY)){
                         const availablePowerUpsDrop=[POWERUP_TYPE.TRIPLE_SHOT,POWERUP_TYPE.SHIELD,POWERUP_TYPE.SMART_BOMB, POWERUP_TYPE.DEBUG_MODE, POWERUP_TYPE.FIREWALL, POWERUP_TYPE.BLOCK_BREAKER];
                         const randomType=availablePowerUpsDrop[Math.floor(Math.random()*availablePowerUpsDrop.length)];
                         powerUpItems.push(new PowerUpItem(e.x,e.y,randomType,images,() => gameSpeed));
                    }
                }else if(e instanceof ArmoredEnemy || e instanceof ArmoredShootingEnemy || e instanceof ToughBasicEnemy){score+=5;} // Points for hitting armored/tough
                return true;
            }return false;
        };

        if (activeMiniboss && p.x < activeMiniboss.x + activeMiniboss.width && p.x + p.width > activeMiniboss.x && p.y < activeMiniboss.y + activeMiniboss.height && p.y + p.height > activeMiniboss.y) {
            if (activeMiniboss.takeDamage(p.damage)) { // takeDamage returns true if boss defeated
                score += activeMiniboss.scoreValue;
                activeMiniboss = null;
                hasGlitchzillaSpawnedThisGame = true;
            }
            projectileConsumedThisHit = true;
        }
        if(projectileConsumedThisHit){projectiles.splice(i,1);continue;}

        if(!activeMiniboss) { // Process regular enemies only if boss not active
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
            for(let j=flyingEnemies.length-1;j>=0;j--){if (flyingEnemies[j]) {if(processProjectileHitOnList(flyingEnemies,j)){break;}} else {console.warn(`DEBUG: flyingEnemies[${j}] è undefined durante il check delle collisioni.`);}}
            if(projectileConsumedThisHit){projectiles.splice(i,1);continue;}
        }
    }
}

// ... (resetGame, drawMenuScreen, drawGameOverScreen, gameLoop, startGameLoop, event listeners remain the same)
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
    score=0;finalScore=0;gameOverTrigger=false;canShoot=true;shootTimer=0;
    console.log("resetGame: Fatto.");
}

function drawMenuScreen(){ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#0f0';ctx.font='42px "Courier New",Courier,monospace';ctx.textAlign='center';ctx.fillText("asyncDonkey Runner",canvas.width/2,canvas.height/2-120);ctx.font='24px "Courier New",Courier,monospace';ctx.fillText("I S T R U Z I O N I:",canvas.width/2,canvas.height/2-50);ctx.font='18px "Courier New",Courier,monospace';ctx.textAlign='left';const iSX=canvas.width/2-220;const lS=28;let cY=canvas.height/2-10;ctx.fillText("> [SPACE] or [ARROW UP] = Jump",iSX,cY);cY+=lS;ctx.fillText("> [CTRL]  or [X]        = Shoot",iSX,cY);cY+=lS;ctx.fillText("> Evita Ostacoli",iSX,cY);cY+=lS;ctx.fillText("> Distruggi i \"Virus\" ",iSX,cY);cY+=lS;ctx.fillText("> Colpisci i \"Glitches\" (gialli) per Bonus!",iSX,cY);ctx.font='28px "Courier New",Courier,monospace';ctx.fillStyle='#ff0';ctx.textAlign='center';ctx.fillText("PRESS ENTER TO START",canvas.width/2,canvas.height-80);}

function updatePlaying(dt){
    if(gameOverTrigger){finalScore=score;currentGameState=GAME_STATE.GAME_OVER;return;}
    if(asyncDonkey)asyncDonkey.update(dt);

    spawnGlitchzillaIfNeeded();

    if (activeMiniboss) {
        updateProjectiles(dt);
    } else {
        spawnObstacleIfNeeded(dt); updateObstacles(dt);
        spawnEnemyBaseIfNeeded(dt); spawnFastEnemyIfNeeded(dt); spawnArmoredEnemyIfNeeded(dt); spawnShootingEnemyIfNeeded(dt);
        spawnArmoredShootingEnemyIfNeeded(dt); spawnToughBasicEnemyIfNeeded(dt); spawnDangerousFlyingEnemyIfNeeded(dt);
        updateProjectiles(dt);
    }
    updateAllEnemyTypes(dt);
    spawnFlyingEnemyIfNeeded(dt);

    spawnPowerUpAmbientIfNeeded(dt); updatePowerUpItems(dt);
    updateShootCooldown(dt);
    checkCollisions();
}

function drawPlayingScreen(){
    ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);
    drawGround();
    if (!activeMiniboss) {
        drawObstacles();
    }
    drawAllEnemyTypes();
    drawPowerUpItems();drawProjectiles();
    if(asyncDonkey)asyncDonkey.draw();
    ctx.fillStyle='#0f0';ctx.font='24px "Courier New",Courier,monospace';ctx.textAlign='left';ctx.fillText("Score: "+score,20,40);
    if(asyncDonkey&&asyncDonkey.activePowerUp&&asyncDonkey.powerUpTimer>0){
        const powerUpColor = (POWERUP_COLORS && POWERUP_COLORS[asyncDonkey.activePowerUp]) ? POWERUP_COLORS[asyncDonkey.activePowerUp] : '#FFD700';
        ctx.fillStyle = powerUpColor;
        ctx.font='18px "Courier New",Courier,monospace';ctx.textAlign='right';
        let powerUpDisplayName = POWERUP_THEMATIC_NAMES[asyncDonkey.activePowerUp] || asyncDonkey.activePowerUp.replace(/_/g, ' ');
        ctx.fillText(`${powerUpDisplayName}: ${asyncDonkey.powerUpTimer.toFixed(1)}s`,canvas.width-20,40);
    }
    if (activeMiniboss && activeMiniboss.health > 0) {
        const bossHealthPercentage = activeMiniboss.health / activeMiniboss.maxHealth;
        const bossHealthBarWidth = canvas.width * 0.6;
        const bossHealthBarHeight = 20;
        const bossHealthBarX = canvas.width / 2 - bossHealthBarWidth / 2;
        const bossHealthBarY = 20;

        ctx.fillStyle = 'rgba(100,0,0,0.7)';
        ctx.fillRect(bossHealthBarX, bossHealthBarY, bossHealthBarWidth, bossHealthBarHeight);
        ctx.fillStyle = 'rgba(255,0,0,0.9)';
        ctx.fillRect(bossHealthBarX, bossHealthBarY, bossHealthBarWidth * bossHealthPercentage, bossHealthBarHeight);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(bossHealthBarX, bossHealthBarY, bossHealthBarWidth, bossHealthBarHeight);
        ctx.fillStyle = '#fff';
        ctx.font = '14px "Courier New", Courier, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`GLITCHZILLA: ${Math.ceil(bossHealthPercentage*100)}%`, canvas.width/2, bossHealthBarY + bossHealthBarHeight - 5);
    }

}
function drawGameOverScreen(){ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#f00';ctx.font='52px "Courier New",Courier,monospace';ctx.textAlign='center';ctx.fillText("G A M E   O V E R",canvas.width/2,canvas.height/2-60);ctx.fillStyle='#ff0';ctx.font='32px "Courier New",Courier,monospace';ctx.fillText("Final Score: "+finalScore,canvas.width/2,canvas.height/2);ctx.fillStyle='#fff';ctx.font='22px "Courier New",Courier,monospace';ctx.fillText("PRESS ENTER TO RESTART",canvas.width/2,canvas.height/2+60);}

let lastTime=0;
function gameLoop(timestamp){const deltaTime=(timestamp-lastTime)/1000||0;lastTime=timestamp;ctx.clearRect(0,0,canvas.width,canvas.height);if(!resourcesInitialized){ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#0f0';ctx.font='20px "Courier New",Courier,monospace';ctx.textAlign='center';ctx.fillText("Loading Resources...",canvas.width/2,canvas.height/2);gameLoopRequestId=requestAnimationFrame(gameLoop);return;}
switch(currentGameState){case GAME_STATE.MENU:drawMenuScreen();break;case GAME_STATE.PLAYING:updatePlaying(deltaTime);drawPlayingScreen();break;case GAME_STATE.GAME_OVER:drawGameOverScreen();break;}
gameLoopRequestId=requestAnimationFrame(gameLoop);}
function startGameLoop(){if(gameLoopRequestId!==null)cancelAnimationFrame(gameLoopRequestId);lastTime=performance.now();console.log("Avvio Game Loop...");currentGameState=GAME_STATE.MENU;gameLoopRequestId=requestAnimationFrame(gameLoop);}

window.addEventListener('keydown',(e)=>{
    if(!resourcesInitialized)return;
    if (AudioManager.audioContext && AudioManager.audioContext.state === "suspended") {
        AudioManager.audioContext.resume().catch(err => console.error("Errore nel riprendere AudioContext:", err));
    }
    switch(currentGameState){
        case GAME_STATE.MENU:
            if(e.key==='Enter'){
                AudioManager.playMusic(false);
                currentGameState=GAME_STATE.PLAYING;
                resetGame();
            } break;
        case GAME_STATE.PLAYING:
            if(asyncDonkey){
                if(e.code==='Space'||e.key==='ArrowUp'){e.preventDefault();asyncDonkey.jump();}
                if(e.code==='ControlLeft'||e.key==='x'||e.key==='X'||e.key==='ControlRight'){e.preventDefault();asyncDonkey.shoot();}
            } break;
        case GAME_STATE.GAME_OVER:
            if(e.key==='Enter'){
                currentGameState=GAME_STATE.PLAYING;
                resetGame();
                AudioManager.playMusic(false);
            } break;
    }
});

loadAllAssets();
console.log("Fine script donkeyRunner.js (esecuzione iniziale). In attesa caricamento assets...");