// js/donkeyRunner.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

console.log("Script donkeyRunner.js caricato.");

// --- IMPOSTAZIONI DELLO SPRITESHEET E DEL GIOCATORE ---
const SPRITESHEET_SRC = 'images/asyncDonkey_walk.png';
const ACTUAL_FRAME_WIDTH = 320;
const ACTUAL_FRAME_HEIGHT = 320;
const NUM_WALK_FRAMES = 5;
const ANIMATION_SPEED = 0.1;
const PLAYER_TARGET_WIDTH = 120;
const PLAYER_TARGET_HEIGHT = 120;

canvas.width = 800;
canvas.height = 450;
console.log("Canvas dimensioni impostate:", canvas.width, "x", canvas.height);

function setupRenderingContext(context) {
    context.imageSmoothingEnabled = false;
    context.mozImageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false;
    context.msImageSmoothingEnabled = false;
    console.log("Image smoothing disabilitato.");
}
setupRenderingContext(ctx);

// --- STATI DI GIOCO ---
const GAME_STATE = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER'
};
let currentGameState = GAME_STATE.MENU;

// --- VARIABILI DI GIOCO ---
let asyncDonkey = null;
const gravity = 0.1;
const groundHeight = 70;
const playerInitialX = 50;
const playerInitialY = canvas.height - groundHeight - PLAYER_TARGET_HEIGHT;
let gameSpeed = 220;

let obstacles = [];
const obstacleSpawnColor = '#0f0';
const obstacleWidth = 30; const obstacleHeight = 30;
let obstacleSpawnTimer = 0;
let nextObstacleSpawnTime = 0;

let projectiles = [];
const projectileColor = '#0ff'; const projectileWidth = 20; const projectileHeight = 8;
const projectileSpeed = 400; const shootCooldownTime = 0.3;
let canShoot = true; let shootTimer = 0;

let enemies = [];
const enemySpawnColor = '#0f0';
const enemyWidth = 50; const enemyHeight = 70;
let enemySpawnTimer = 0;
let nextEnemySpawnTime = 0;

let flyingEnemies = [];
const flyingEnemySpawnColor = '#ff0';
const flyingEnemyWidth = 40; const flyingEnemyHeight = 40;
const flyingEnemyScoreValue = 100;
let flyingEnemySpawnTimer = 0;
let nextFlyingEnemySpawnTime = 0;

const lineWidth = 2;
let gameOverTrigger = false;
let score = 0;
let finalScore = 0;

let playerImage = new Image();
let imageLoaded = false;
let resourcesInitialized = false;
let gameLoopRequestId = null;

playerImage.onload = () => {
    imageLoaded = true; console.log("Spritesheet caricato!", SPRITESHEET_SRC);
    console.log("Dim:", playerImage.naturalWidth, "x", playerImage.naturalHeight);
    if(playerImage.naturalWidth===0){console.error("Dim 0!");return;}
    if(playerImage.naturalWidth!==ACTUAL_FRAME_WIDTH*NUM_WALK_FRAMES || playerImage.naturalHeight!==ACTUAL_FRAME_HEIGHT){console.warn(`ATTENZIONE: Dim. spritesheet (${playerImage.naturalWidth}x${playerImage.naturalHeight}) non corrispondono a calcolate (${ACTUAL_FRAME_WIDTH*NUM_WALK_FRAMES}x${ACTUAL_FRAME_HEIGHT}). Controlla costanti!`);}
    
    resourcesInitialized = true;
    if (gameLoopRequestId === null) {
        startGameLoop();
    }
};
playerImage.onerror = () => { imageLoaded = false; console.error("Errore caricamento spritesheet:", SPRITESHEET_SRC); alert(`Errore caricamento immagine: ${SPRITESHEET_SRC}.`); };
playerImage.src = SPRITESHEET_SRC;

// --- CLASSI ---
class Animation{constructor(s,fw,fh,nf,as){this.spritesheet=s;this.frameWidth=fw;this.frameHeight=fh;this.numFrames=nf;this.animationSpeed=as;this.currentFrameIndex=0;this.elapsedTime=0;}update(dt){this.elapsedTime+=dt;if(this.elapsedTime>=this.animationSpeed){this.elapsedTime-=this.animationSpeed;this.currentFrameIndex=(this.currentFrameIndex+1)%this.numFrames;}}getFrame(){const sx=this.currentFrameIndex*this.frameWidth;const sy=0;return{sx,sy,sWidth:this.frameWidth,sHeight:this.frameHeight};}}
class Player{constructor(x,y,dw,dh){this.x=x;this.y=y;this.displayWidth=dw;this.displayHeight=dh;this.velocityY=0;this.onGround=true;const pX=20;const pY=10;this.colliderWidth=this.displayWidth-pX;this.colliderHeight=this.displayHeight-pY;this.colliderOffsetX=pX/2;this.colliderOffsetY=pY/2;if(imageLoaded){this.walkAnimation=new Animation(playerImage,ACTUAL_FRAME_WIDTH,ACTUAL_FRAME_HEIGHT,NUM_WALK_FRAMES,ANIMATION_SPEED);}else{this.walkAnimation=null;}}draw(){if(imageLoaded&&playerImage.complete&&playerImage.naturalWidth>0&&this.walkAnimation){const f=this.walkAnimation.getFrame();try{ctx.drawImage(this.walkAnimation.spritesheet,f.sx,f.sy,f.sWidth,f.sHeight,this.x,this.y,this.displayWidth,this.displayHeight);}catch(e){console.error("Err draw:",e);this.drawFallback("Err draw");}}else{this.drawFallback(!imageLoaded?"L":!playerImage.complete?"C":playerImage.naturalWidth===0?"W0":!this.walkAnimation?"A=N":"?");}}drawFallback(r="N/A"){ctx.fillStyle='orange';ctx.fillRect(this.x,this.y,this.displayWidth,this.displayHeight);ctx.strokeStyle='red';ctx.lineWidth=1;ctx.strokeRect(this.x,this.y,this.displayWidth,this.displayHeight);}applyGravity(){this.velocityY+=gravity;this.y+=this.velocityY;}update(dt){this.applyGravity();if(this.y+this.displayHeight>canvas.height-groundHeight){this.y=canvas.height-groundHeight-this.displayHeight;this.velocityY=0;this.onGround=true;}else{this.onGround=false;}if(this.walkAnimation&&imageLoaded&&this.onGround){this.walkAnimation.update(dt);}}jump(){if(this.onGround){this.velocityY=-8;this.onGround=false;}}shoot(){if(canShoot){const pX=this.x+this.displayWidth;const pY=this.y+(this.displayHeight/2)-(projectileHeight/2);projectiles.push(new Projectile(pX,pY,projectileWidth,projectileHeight,projectileColor,projectileSpeed));canShoot=false;shootTimer=0;}}}
class Obstacle{constructor(x,y,w,h,c){this.x=x;this.y=y;this.width=w;this.height=h;this.color=c;}update(dt){this.x-=gameSpeed*dt;}draw(){ctx.strokeStyle=this.color;ctx.lineWidth=lineWidth;ctx.strokeRect(this.x,this.y,this.width,this.height);}}
class Projectile{constructor(x,y,w,h,c,s){this.x=x;this.y=y;this.width=w;this.height=h;this.color=c;this.speed=s;}update(dt){this.x+=this.speed*dt;}draw(){ctx.fillStyle=this.color;ctx.fillRect(this.x,this.y,this.width,this.height);}}
class Enemy{constructor(x,y,w,h,c,s){this.x=x;this.y=y;this.width=w;this.height=h;this.color=c;this.speed=s;this.health=1;}update(dt){this.x-=this.speed*dt;}draw(){ctx.strokeStyle=this.color;ctx.lineWidth=lineWidth;ctx.strokeRect(this.x,this.y,this.width,this.height);}takeDamage(){this.health--;}}
class FlyingEnemy{constructor(x,y,w,h,c,s){this.x=x;this.y=y;this.width=w;this.height=h;this.color=c;this.speed=s;this.initialY=y;this.angle=Math.random()*Math.PI*2;this.amplitude=20+Math.random()*20;this.frequency=0.02+Math.random()*0.03;}update(dt){this.x-=this.speed*dt;this.angle+=this.frequency;this.y=this.initialY+Math.sin(this.angle)*this.amplitude;}draw(){ctx.strokeStyle=this.color;ctx.lineWidth=lineWidth;ctx.strokeRect(this.x,this.y,this.width,this.height);}}

// --- FUNZIONI DI GIOCO SPECIFICHE ---
function drawGround() { ctx.strokeStyle='#0f0';ctx.lineWidth=lineWidth;ctx.beginPath();ctx.moveTo(0,canvas.height-groundHeight);ctx.lineTo(canvas.width,canvas.height-groundHeight);ctx.stroke();}
function calculateNextObstacleSpawnTime() {const minT=3.5;const maxT=6.0;return minT+Math.random()*(maxT-minT);}
function spawnObstacleIfNeeded(deltaTime) {obstacleSpawnTimer+=deltaTime;if(obstacleSpawnTimer>=nextObstacleSpawnTime){obstacleSpawnTimer=0;nextObstacleSpawnTime=calculateNextObstacleSpawnTime();obstacles.push(new Obstacle(canvas.width,canvas.height-groundHeight-obstacleHeight,obstacleWidth,obstacleHeight,obstacleSpawnColor));}}
function updateObstacles(deltaTime) {for(let i=obstacles.length-1;i>=0;i--){const o=obstacles[i];o.update(deltaTime);if(o.x+o.width<0){obstacles.splice(i,1);score+=5;}}}
function drawObstacles() {obstacles.forEach(o=>{o.draw();});}
function updateProjectiles(deltaTime) {for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i];p.update(deltaTime);if(p.x>canvas.width){projectiles.splice(i,1);}}}
function drawProjectiles() {projectiles.forEach(p=>{p.draw();});}
function updateShootCooldown(deltaTime) {if(!canShoot){shootTimer+=deltaTime;if(shootTimer>=shootCooldownTime){canShoot=true;shootTimer=0;}}}
function calculateNextEnemySpawnTime() {const minT=2.5;const maxT=4.5;return minT+Math.random()*(maxT-minT);}
function spawnEnemyIfNeeded(deltaTime) {enemySpawnTimer+=deltaTime;if(enemySpawnTimer>=nextEnemySpawnTime){enemySpawnTimer=0;nextEnemySpawnTime=calculateNextEnemySpawnTime();let eY=canvas.height-groundHeight-enemyHeight;enemies.push(new Enemy(canvas.width,eY,enemyWidth,enemyHeight,enemySpawnColor,gameSpeed*(0.7+Math.random()*0.5)));}}
function updateEnemies(deltaTime) {for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];e.update(deltaTime);if(e.x+e.width<0){enemies.splice(i,1);}}}
function drawEnemies() {enemies.forEach(e=>{e.draw();});}

function calculateNextFlyingEnemySpawnTime(){const minT=7.0;const maxT=12.0;return minT+Math.random()*(maxT-minT);}
function spawnFlyingEnemyIfNeeded(deltaTime){
    flyingEnemySpawnTimer+=deltaTime;
    if(flyingEnemySpawnTimer>=nextFlyingEnemySpawnTime){
        flyingEnemySpawnTimer=0;
        nextFlyingEnemySpawnTime=calculateNextFlyingEnemySpawnTime();
        const minY=canvas.height*0.1;
        const maxY=canvas.height*0.45;
        // CORREZIONE: Usare un nome di variabile valido
        const localFlyingEnemyY = minY + Math.random() * (maxY - minY); // Era 飞Y
        flyingEnemies.push(
            new FlyingEnemy(canvas.width, localFlyingEnemyY, // Usa la variabile corretta
            flyingEnemyWidth,flyingEnemyHeight,flyingEnemySpawnColor,
            gameSpeed*(0.6+Math.random()*0.3))
        );
        // console.log("Nuovo NEMICO VOLANTE spawnato. Totale:", flyingEnemies.length); // Commentato per meno log
    }
}
function updateFlyingEnemies(deltaTime){for(let i=flyingEnemies.length-1;i>=0;i--){const fe=flyingEnemies[i];fe.update(deltaTime);if(fe.x+fe.width<0){flyingEnemies.splice(i,1);}}}
function drawFlyingEnemies(){flyingEnemies.forEach(fe=>{fe.draw();});}

function checkCollisions() {
    if (!asyncDonkey) return;
    gameOverTrigger = false; 
    const playerCollider = { x: asyncDonkey.x + asyncDonkey.colliderOffsetX, y: asyncDonkey.y + asyncDonkey.colliderOffsetY, width: asyncDonkey.colliderWidth, height: asyncDonkey.colliderHeight };

    for(let i=0;i<obstacles.length;i++){const o=obstacles[i];if(playerCollider.x<o.x+o.width&&playerCollider.x+playerCollider.width>o.x&&playerCollider.y<o.y+o.height&&playerCollider.y+playerCollider.height>o.y){gameOverTrigger=true;console.error("COLLISIONE Ostacolo!");return;}}
    for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];if(playerCollider.x<e.x+e.width&&playerCollider.x+playerCollider.width>e.x&&playerCollider.y<e.y+e.height&&playerCollider.y+playerCollider.height>e.y){gameOverTrigger=true;console.error("COLLISIONE Nemico a Terra!");return;}}
    for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i];for(let j=enemies.length-1;j>=0;j--){const e=enemies[j];if(p.x<e.x+e.width&&p.x+p.width>e.x&&p.y<e.y+e.height&&p.y+p.height>e.y){e.takeDamage();projectiles.splice(i,1);if(e.health<=0){enemies.splice(j,1);score+=25;}break;}}}
    for (let i = projectiles.length - 1; i >= 0; i--) {if (!projectiles[i]) continue; const projectile = projectiles[i]; for (let j = flyingEnemies.length - 1; j >= 0; j--) {const flyingEnemy = flyingEnemies[j]; if (projectile.x < flyingEnemy.x + flyingEnemy.width && projectile.x + projectile.width > flyingEnemy.x && projectile.y < flyingEnemy.y + flyingEnemy.height && projectile.y + projectile.height > flyingEnemy.y) {flyingEnemies.splice(j, 1); projectiles.splice(i, 1); score += flyingEnemyScoreValue; console.log("Nemico VOLANTE distrutto! Punteggio:", score); break; }}}
}

// --- FUNZIONI DI STATO E GIOCO ---
function resetGame() {
    console.log("resetGame: Resetto lo stato del gioco...");
    asyncDonkey = new Player(playerInitialX, playerInitialY, PLAYER_TARGET_WIDTH, PLAYER_TARGET_HEIGHT);
    obstacles = []; projectiles = []; enemies = []; flyingEnemies = [];
    obstacleSpawnTimer = 0; nextObstacleSpawnTime = calculateNextObstacleSpawnTime();
    enemySpawnTimer = 0; nextEnemySpawnTime = calculateNextEnemySpawnTime();
    flyingEnemySpawnTimer = 0; nextFlyingEnemySpawnTime = calculateNextFlyingEnemySpawnTime();
    score = 0; finalScore = 0; gameOverTrigger = false; canShoot = true; shootTimer = 0;
    console.log("resetGame: Variabili resettate.");
}

function drawMenuScreen() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f0'; ctx.font = '42px "Courier New", Courier, monospace';
    ctx.textAlign = 'center';
    ctx.fillText("asyncDonkey Runner", canvas.width / 2, canvas.height / 2 - 120);
    ctx.font = '24px "Courier New", Courier, monospace';
    ctx.fillText("I S T R U Z I O N I:", canvas.width / 2, canvas.height / 2 - 50);
    ctx.font = '18px "Courier New", Courier, monospace';
    ctx.textAlign = 'left';
    const instructionStartX = canvas.width / 2 - 220; // Leggermente a sinistra del centro
    const lineSpacing = 28;
    let currentY = canvas.height / 2 - 10;
    ctx.fillText("> [SPACE] or [ARROW UP] = Jump", instructionStartX, currentY); currentY += lineSpacing;
    ctx.fillText("> [CTRL]  or [X]        = Shoot", instructionStartX, currentY); currentY += lineSpacing;
    ctx.fillText("> Evita Ostacoli Verdi Contornati", instructionStartX, currentY); currentY += lineSpacing;
    ctx.fillText("> Distruggi Nemici Verdi Contornati", instructionStartX, currentY); currentY += lineSpacing;
    ctx.fillText("> Colpisci Nemici Gialli Volanti per Bonus!", instructionStartX, currentY);
    ctx.font = '28px "Courier New", Courier, monospace';
    ctx.fillStyle = '#ff0'; ctx.textAlign = 'center';
    ctx.fillText("PRESS ENTER TO START", canvas.width / 2, canvas.height - 80); // Abbassato un po'
}

function updatePlaying(deltaTime) {
    if (gameOverTrigger) {
        finalScore = score;
        currentGameState = GAME_STATE.GAME_OVER;
        return;
    }
    if (asyncDonkey) asyncDonkey.update(deltaTime); // asyncDonkey potrebbe essere null brevemente
    spawnObstacleIfNeeded(deltaTime); updateObstacles(deltaTime);
    spawnEnemyIfNeeded(deltaTime); updateEnemies(deltaTime);
    spawnFlyingEnemyIfNeeded(deltaTime); updateFlyingEnemies(deltaTime);
    updateProjectiles(deltaTime); updateShootCooldown(deltaTime);
    checkCollisions();
}

function drawPlayingScreen() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGround(); drawObstacles(); drawEnemies(); drawFlyingEnemies(); drawProjectiles();
    if (asyncDonkey) asyncDonkey.draw();
    ctx.fillStyle = '#0f0'; ctx.font = '24px "Courier New",Courier,monospace';
    ctx.textAlign = 'left'; ctx.fillText("Score: " + score, 20, 40);
}

function drawGameOverScreen() {
    ctx.fillStyle = '#000'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#f00'; ctx.font = '52px "Courier New",Courier,monospace';
    ctx.textAlign = 'center';
    ctx.fillText("G A M E   O V E R", canvas.width/2, canvas.height/2 - 60);
    ctx.fillStyle = '#ff0'; ctx.font = '32px "Courier New",Courier,monospace';
    ctx.fillText("Final Score: " + finalScore, canvas.width/2, canvas.height/2);
    ctx.fillStyle = '#fff'; ctx.font = '22px "Courier New",Courier,monospace';
    ctx.fillText("PRESS ENTER TO RESTART", canvas.width/2, canvas.height/2 + 60);
}

// --- GAME LOOP PRINCIPALE ---
let lastTime = 0;
function gameLoop(timestamp) {
    const deltaTime = (timestamp - lastTime) / 1000 || 0;
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!resourcesInitialized) {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0f0'; ctx.font = '20px "Courier New",Courier,monospace';
        ctx.textAlign = 'center'; ctx.fillText("Loading Resources...", canvas.width / 2, canvas.height / 2);
        gameLoopRequestId = requestAnimationFrame(gameLoop);
        return;
    }

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
    if (gameLoopRequestId !== null) { cancelAnimationFrame(gameLoopRequestId); }
    lastTime = performance.now();
    console.log("Avvio Game Loop principale...");
    currentGameState = GAME_STATE.MENU;
    gameLoopRequestId = requestAnimationFrame(gameLoop);
}

// --- GESTIONE INPUT ---
window.addEventListener('keydown', (e) => {
    if (!resourcesInitialized) return;
    switch (currentGameState) {
        case GAME_STATE.MENU:
            if (e.key === 'Enter') {
                console.log("Da MENU a PLAYING");
                currentGameState = GAME_STATE.PLAYING;
                resetGame();
            }
            break;
        case GAME_STATE.PLAYING:
            if (asyncDonkey) {
                if (e.code === 'Space' || e.key === 'ArrowUp') {
                    e.preventDefault(); asyncDonkey.jump();
                }
                if (e.code === 'ControlLeft' || e.key === 'x' || e.key === 'X' || e.key === 'ControlRight') { // Aggiunto ControlRight
                    e.preventDefault(); asyncDonkey.shoot();
                }
            }
            break;
        case GAME_STATE.GAME_OVER:
            if (e.key === 'Enter') {
                console.log("Da GAME_OVER a PLAYING");
                currentGameState = GAME_STATE.PLAYING;
                resetGame();
            }
            break;
    }
});

// CONTROLLO FINALE E AVVIO
if (playerImage.complete && playerImage.naturalWidth > 0) {
    console.log("Img cache valida.");
    if (!imageLoaded) imageLoaded = true;
    if (!resourcesInitialized) resourcesInitialized = true;
    if (gameLoopRequestId === null) {
        console.log("Avvio loop da controllo cache.");
        startGameLoop();
    }
} else if (playerImage.complete && playerImage.naturalWidth === 0) {
    console.error("Img 'complete' W/H=0. File corrotto?");
    alert("L'immagine sembra corrotta (dimensioni 0).");
} else {
    console.log("Img non (ancora) cache/valida. Attendo onload/onerror.");
}
console.log("Fine script donkeyRunner.js (esecuzione iniziale).");