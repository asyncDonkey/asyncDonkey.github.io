// js/donkeyRunner.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

console.log("Script donkeyRunner.js caricato.");

// --- IMPOSTAZIONI GLOBALI DI GIOCO ---
canvas.width = 800;
canvas.height = 450; // Tua altezza canvas
const groundHeight = 70;
const gravity = 0.1; // Tuo valore
let gameSpeed = 220; // Tuo valore
const lineWidth = 2;

// --- PERCORSI E SPECIFICHE SPRITE ---
const PLAYER_SPRITESHEET_SRC = 'images/asyncDonkey_walk.png';
const PLAYER_ACTUAL_FRAME_WIDTH = 320; const PLAYER_ACTUAL_FRAME_HEIGHT = 320; const PLAYER_NUM_WALK_FRAMES = 5;
const PLAYER_TARGET_WIDTH = 120; const PLAYER_TARGET_HEIGHT = 120;

const PLAYER_PROJECTILE_SPRITE_SRC = 'images/bitProjectile.png';
const PLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH = 24; const PLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT = 8; const PLAYER_PROJECTILE_NUM_FRAMES = 1;
const PLAYER_PROJECTILE_TARGET_WIDTH = 24; const PLAYER_PROJECTILE_TARGET_HEIGHT = 8;

const OBSTACLE_SPRITE_SRC = 'images/codeBlock.png';
const OBSTACLE_ACTUAL_FRAME_WIDTH = 32; const OBSTACLE_ACTUAL_FRAME_HEIGHT = 32; const OBSTACLE_NUM_FRAMES = 1;
const OBSTACLE_TARGET_WIDTH = 32; const OBSTACLE_TARGET_HEIGHT = 32;

const ENEMY_ONE_SPRITE_SRC = 'images/enemyOne.png';
const ENEMY_ONE_ACTUAL_FRAME_WIDTH = 48; const ENEMY_ONE_ACTUAL_FRAME_HEIGHT = 64; const ENEMY_ONE_NUM_FRAMES = 4;
const ENEMY_ONE_TARGET_WIDTH = 48; const ENEMY_ONE_TARGET_HEIGHT = 64;

const ENEMY_TWO_SPRITE_SRC = 'images/enemyTwo.png';
const ENEMY_TWO_ACTUAL_FRAME_WIDTH = 40; const ENEMY_TWO_ACTUAL_FRAME_HEIGHT = 56; const ENEMY_TWO_NUM_FRAMES = 4;
const ENEMY_TWO_TARGET_WIDTH = 40; const ENEMY_TWO_TARGET_HEIGHT = 56;

const ENEMY_THREE_BASE_SRC = 'images/enemyThree.png';
const ENEMY_THREE_DMG1_SRC = 'images/enemyThreeDmgOne.png';
const ENEMY_THREE_DMG2_SRC = 'images/enemyThreeDmgTwo.png';
const ENEMY_THREE_ACTUAL_FRAME_WIDTH = 56; const ENEMY_THREE_ACTUAL_FRAME_HEIGHT = 72; const ENEMY_THREE_NUM_FRAMES = 4;
const ENEMY_THREE_TARGET_WIDTH = 56; const ENEMY_THREE_TARGET_HEIGHT = 72;
const ARMORED_ENEMY_HEALTH = 3;

const ENEMY_FOUR_IDLE_SRC = 'images/enemyFour.png';
const ENEMY_FOUR_SHOOTING_SRC = 'images/enemyFourShooting.png';
const ENEMY_FOUR_ACTUAL_FRAME_WIDTH = 48; const ENEMY_FOUR_ACTUAL_FRAME_HEIGHT = 72;
const ENEMY_FOUR_IDLE_NUM_FRAMES = 4; const ENEMY_FOUR_SHOOTING_NUM_FRAMES = 2;
const ENEMY_FOUR_TARGET_WIDTH = 48; const ENEMY_FOUR_TARGET_HEIGHT = 72;
const SHOOTING_ENEMY_SHOOT_INTERVAL = 2.5;

const ENEMY_PROJECTILE_SPRITE_SRC = 'images/enemyFourProjectile.png';
const ENEMY_PROJECTILE_ACTUAL_FRAME_WIDTH = 16; const ENEMY_PROJECTILE_ACTUAL_FRAME_HEIGHT = 16; const ENEMY_PROJECTILE_NUM_FRAMES = 4;
const ENEMY_PROJECTILE_TARGET_WIDTH = 16; const ENEMY_PROJECTILE_TARGET_HEIGHT = 16;
const ENEMY_PROJECTILE_SPEED = 250;

const ENEMY_FIVE_SPRITE_SRC = 'images/enemyFive.png';
const ENEMY_FIVE_ACTUAL_FRAME_WIDTH = 32; const ENEMY_FIVE_ACTUAL_FRAME_HEIGHT = 32; const ENEMY_FIVE_NUM_FRAMES = 4;
const ENEMY_FIVE_TARGET_WIDTH = ENEMY_FIVE_ACTUAL_FRAME_WIDTH * 1.5; const ENEMY_FIVE_TARGET_HEIGHT = ENEMY_FIVE_ACTUAL_FRAME_HEIGHT * 1.5;

const ANIMATION_SPEED = 0.1;

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
    { name: 'player', src: PLAYER_SPRITESHEET_SRC }, { name: 'playerProjectile', src: PLAYER_PROJECTILE_SPRITE_SRC },
    { name: 'obstacle', src: OBSTACLE_SPRITE_SRC },  { name: 'enemyOne', src: ENEMY_ONE_SPRITE_SRC },
    { name: 'enemyTwo', src: ENEMY_TWO_SPRITE_SRC },  { name: 'enemyThreeBase', src: ENEMY_THREE_BASE_SRC },
    { name: 'enemyThreeDmg1', src: ENEMY_THREE_DMG1_SRC }, { name: 'enemyThreeDmg2', src: ENEMY_THREE_DMG2_SRC },
    { name: 'enemyFourIdle', src: ENEMY_FOUR_IDLE_SRC }, { name: 'enemyFourShooting', src: ENEMY_FOUR_SHOOTING_SRC },
    { name: 'enemyFourProjectile', src: ENEMY_PROJECTILE_SPRITE_SRC }, { name: 'enemyFive', src: ENEMY_FIVE_SPRITE_SRC }
];
let imagesLoadedCount = 0; let allImagesLoaded = false; let resourcesInitialized = false; let gameLoopRequestId = null;

let obstacles = []; let obstacleSpawnTimer = 0; let nextObstacleSpawnTime = 0; const obstacleSpawnColor = '#0f0';
let projectiles = []; let canShoot = true; let shootTimer = 0; const projectileSpeed = 400; const shootCooldownTime = 0.3; const projectileColor = '#0ff';
let enemies = []; let enemyBaseSpawnTimer = 0; let nextEnemyBaseSpawnTime = 0; const enemyBaseSpawnColor = '#0f0';
let flyingEnemies = []; let flyingEnemySpawnTimer = 0; let nextFlyingEnemySpawnTime = 0; const flyingEnemyScoreValue = 100; const flyingEnemySpawnColor = '#ff0';
let fastEnemies = []; let fastEnemySpawnTimer = 0; let nextFastEnemySpawnTime = 0; const fastEnemySpeedMultiplier = 1.5; const fastEnemySpawnColor = '#FFA500';
let armoredEnemies = []; let armoredEnemySpawnTimer = 0; let nextArmoredEnemySpawnTime = 0; const armoredEnemySpeedMultiplier = 0.7; const armoredEnemySpawnColor = '#A9A9A9';
let shootingEnemies = []; let shootingEnemySpawnTimer = 0; let nextShootingEnemySpawnTime = 0; const shootingEnemySpawnColor = '#FF69B4';
let enemyProjectiles = []; const enemyProjectileColor = '#f0f';

const SCORE_THRESHOLD_FAST_ENEMY = 200; const SCORE_THRESHOLD_ARMORED_ENEMY = 450; const SCORE_THRESHOLD_SHOOTING_ENEMY = 700;
let score = 0; let finalScore = 0; let gameOverTrigger = false;

function loadImage(name,src){return new Promise((resolve,reject)=>{const img=new Image();images[name]=img;img.onload=()=>{imagesLoadedCount++;console.log(`Img ${name}(${imagesLoadedCount}/${imagesToLoad.length})`);if(imagesLoadedCount===imagesToLoad.length){allImagesLoaded=true;console.log("TUTTE img caricate");}resolve(img);};img.onerror=()=>{console.error(`ERRORE caricamento: ${name} da ${src}`);reject(new Error(name));};img.src=src;});}
function loadAllImages(){console.log("Carico img...");const p=imagesToLoad.map(d=>loadImage(d.name,d.src));Promise.all(p).then(()=>{console.log("Promise.all OK");resourcesInitialized=true;if(gameLoopRequestId===null&&currentGameState===GAME_STATE.MENU){startGameLoop();}}).catch(e=>{console.error("Errore Promise.all immagini:",e);alert("Errore risorse.");});}

class Animation{constructor(s,fw,fh,nf,as=ANIMATION_SPEED){this.spritesheet=s;this.frameWidth=fw;this.frameHeight=fh;this.numFrames=nf;this.animationSpeed=as;this.currentFrameIndex=0;this.elapsedTime=0;if(nf<=0)console.warn("Anim 0 frame",s?s.src:"N/A");}update(dt){if(this.numFrames<=1)return;this.elapsedTime+=dt;if(this.elapsedTime>=this.animationSpeed){this.elapsedTime-=this.animationSpeed;this.currentFrameIndex=(this.currentFrameIndex+1)%this.numFrames;}}getFrame(){const sx=this.currentFrameIndex*this.frameWidth;const sy=0;return{sx,sy,sWidth:this.frameWidth,sHeight:this.frameHeight};}reset(){this.currentFrameIndex=0;this.elapsedTime=0;}}
class Player{constructor(x,y,dw,dh){this.x=x;this.y=y;this.displayWidth=dw;this.displayHeight=dh;this.velocityY=0;this.onGround=true;const pX=20;const pY=10;this.colliderWidth=this.displayWidth-pX;this.colliderHeight=this.displayHeight-pY;this.colliderOffsetX=pX/2;this.colliderOffsetY=pY/2;this.walkAnimation=images['player']?new Animation(images['player'],PLAYER_ACTUAL_FRAME_WIDTH,PLAYER_ACTUAL_FRAME_HEIGHT,PLAYER_NUM_WALK_FRAMES):null;if(!this.walkAnimation&&images['player'])console.error("Player anim non creata nonostante img!");}draw(){if(this.walkAnimation&&this.walkAnimation.spritesheet&&this.walkAnimation.spritesheet.complete){const f=this.walkAnimation.getFrame();try{ctx.drawImage(this.walkAnimation.spritesheet,f.sx,f.sy,f.sWidth,f.sHeight,this.x,this.y,this.displayWidth,this.displayHeight);}catch(e){this.drawFallback("Err draw P");}}else{this.drawFallback(this.walkAnimation&&this.walkAnimation.spritesheet?"P sprite !complete":"P anim/sprite missing");}}drawFallback(){ctx.fillStyle='orange';ctx.fillRect(this.x,this.y,this.displayWidth,this.displayHeight);}applyGravity(){this.velocityY+=gravity;this.y+=this.velocityY;}update(dt){this.applyGravity();if(this.y+this.displayHeight>canvas.height-groundHeight){this.y=canvas.height-groundHeight-this.displayHeight;this.velocityY=0;this.onGround=true;}else{this.onGround=false;}if(this.walkAnimation&&this.onGround)this.walkAnimation.update(dt);}jump(){if(this.onGround){this.velocityY=-8;this.onGround=false;}}shoot(){if(canShoot){projectiles.push(new Projectile(this.x+this.displayWidth,this.y+this.displayHeight/2-PLAYER_PROJECTILE_TARGET_HEIGHT/2));canShoot=false;shootTimer=0;}}}
class Obstacle{constructor(x,y){this.x=x;this.y=y;this.width=OBSTACLE_TARGET_WIDTH;this.height=OBSTACLE_TARGET_HEIGHT;this.sprite=images['obstacle'];this.animation=this.sprite?new Animation(this.sprite,OBSTACLE_ACTUAL_FRAME_WIDTH,OBSTACLE_ACTUAL_FRAME_HEIGHT,OBSTACLE_NUM_FRAMES):null;}update(dt){this.x-=gameSpeed*dt;if(this.animation)this.animation.update(dt);}draw(){if(this.animation&&this.sprite&&this.sprite.complete){const f=this.animation.getFrame();ctx.drawImage(this.sprite,f.sx,f.sy,f.sWidth,f.sHeight,this.x,this.y,this.width,this.height);}else{ctx.strokeStyle=obstacleSpawnColor;ctx.lineWidth=lineWidth;ctx.strokeRect(this.x,this.y,this.width,this.height);}}}
class Projectile{constructor(x,y){this.x=x;this.y=y;this.width=PLAYER_PROJECTILE_TARGET_WIDTH;this.height=PLAYER_PROJECTILE_TARGET_HEIGHT;this.speed=projectileSpeed;this.sprite=images['playerProjectile'];this.animation=this.sprite?new Animation(this.sprite,PLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH,PLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT,PLAYER_PROJECTILE_NUM_FRAMES):null;}update(dt){this.x+=this.speed*dt;if(this.animation)this.animation.update(dt);}draw(){if(this.animation&&this.sprite&&this.sprite.complete){const f=this.animation.getFrame();ctx.drawImage(this.sprite,f.sx,f.sy,f.sWidth,f.sHeight,this.x,this.y,this.width,this.height);}else{ctx.fillStyle=projectileColor;ctx.fillRect(this.x,this.y,this.width,this.height);}}}
class BaseEnemy{constructor(x,y,targetW,targetH,spriteName,frameW,frameH,numFrames,speedMult,hp=1,fallbackColor='#ccc'){this.x=x;this.y=y;this.width=targetW;this.height=targetH;this.speed=gameSpeed*speedMult;this.health=hp;this.maxHealth=hp;this.sprite=images[spriteName];this.fallbackColor=fallbackColor;this.animation=this.sprite&&numFrames>0?new Animation(this.sprite,frameW,frameH,numFrames):null;if(!this.sprite)console.warn(`Sprite ${spriteName} mancante`);}update(dt){this.x-=this.speed*dt;if(this.animation)this.animation.update(dt);}draw(){if(this.animation&&this.sprite.complete){const f=this.animation.getFrame();ctx.drawImage(this.sprite,f.sx,f.sy,f.sWidth,f.sHeight,this.x,this.y,this.width,this.height);}else{ctx.strokeStyle=this.fallbackColor;ctx.lineWidth=lineWidth;ctx.strokeRect(this.x,this.y,this.width,this.height);}if(this.maxHealth>1&&this.health>0&&this.health<this.maxHealth){const hbW=this.width*.8,hbH=5,hbX=this.x+(this.width-hbW)/2,hbY=this.y-hbH-3;ctx.fillStyle='rgba(100,100,100,0.7)';ctx.fillRect(hbX,hbY,hbW,hbH);ctx.fillStyle='rgba(0,255,0,0.7)';ctx.fillRect(hbX,hbY,hbW*(this.health/this.maxHealth),hbH);}}takeDamage(dmg=1){this.health-=dmg;}}
class ArmoredEnemy extends BaseEnemy{constructor(x,y){super(x,y,ENEMY_THREE_TARGET_WIDTH,ENEMY_THREE_TARGET_HEIGHT,'enemyThreeBase',ENEMY_THREE_ACTUAL_FRAME_WIDTH,ENEMY_THREE_ACTUAL_FRAME_HEIGHT,ENEMY_THREE_NUM_FRAMES,armoredEnemySpeedMultiplier,ARMORED_ENEMY_HEALTH,armoredEnemySpawnColor);this.animations={'3':this.animation,'2':images['enemyThreeDmg1']?new Animation(images['enemyThreeDmg1'],ENEMY_THREE_ACTUAL_FRAME_WIDTH,ENEMY_THREE_ACTUAL_FRAME_HEIGHT,ENEMY_THREE_NUM_FRAMES):null,'1':images['enemyThreeDmg2']?new Animation(images['enemyThreeDmg2'],ENEMY_THREE_ACTUAL_FRAME_WIDTH,ENEMY_THREE_ACTUAL_FRAME_HEIGHT,ENEMY_THREE_NUM_FRAMES):null,};this.animation=this.animations[String(this.health)]||this.animations['1'];}update(dt){super.update(dt);}draw(){const animToUse=this.animations[String(this.health)]||this.animation;if(animToUse&&animToUse.spritesheet&&animToUse.spritesheet.complete){const f=animToUse.getFrame();ctx.drawImage(animToUse.spritesheet,f.sx,f.sy,f.sWidth,f.sHeight,this.x,this.y,this.width,this.height);BaseEnemy.prototype.draw.call(this);}else{super.draw();}}takeDamage(dmg=1){super.takeDamage(dmg);const newAnim=this.animations[String(this.health)];if(newAnim){this.animation=newAnim;this.animation.reset();}else if(this.health>0&&this.animations['1']){this.animation=this.animations['1'];this.animation.reset();}}}
class ShootingEnemy extends BaseEnemy{constructor(x,y){super(x,y,ENEMY_FOUR_TARGET_WIDTH,ENEMY_FOUR_TARGET_HEIGHT,'enemyFourIdle',ENEMY_FOUR_ACTUAL_FRAME_WIDTH,ENEMY_FOUR_ACTUAL_FRAME_HEIGHT,ENEMY_FOUR_IDLE_NUM_FRAMES,0.5,1,shootingEnemySpawnColor);this.idleAnimation=this.animation;this.shootingAnimation=images['enemyFourShooting']?new Animation(images['enemyFourShooting'],ENEMY_FOUR_ACTUAL_FRAME_WIDTH,ENEMY_FOUR_ACTUAL_FRAME_HEIGHT,ENEMY_FOUR_SHOOTING_NUM_FRAMES,ANIMATION_SPEED/ENEMY_FOUR_SHOOTING_NUM_FRAMES):null;this.isShooting=false;this.shootTimer=Math.random()*shootingEnemyShootInterval+1.5;this.shootAnimTimer=0;this.shootAnimDuration=this.shootingAnimation?this.shootingAnimation.numFrames*this.shootingAnimation.animationSpeed:0.5;}update(dt){super.update(dt);if(this.isShooting){if(this.shootingAnimation)this.shootingAnimation.update(dt);this.shootAnimTimer+=dt;if(this.shootAnimTimer>=this.shootAnimDuration){this.isShooting=false;this.animation=this.idleAnimation;}}else{this.shootTimer+=dt;if(this.shootTimer>=shootingEnemyShootInterval){this.shootTimer=0;this.isShooting=true;this.animation=this.shootingAnimation;if(this.animation)this.animation.reset();this.shootAnimTimer=0;enemyProjectiles.push(new EnemyProjectile(this.x-ENEMY_PROJECTILE_TARGET_WIDTH,this.y+this.height/2-ENEMY_PROJECTILE_TARGET_HEIGHT/2));}}}}
class EnemyProjectile{constructor(x,y){this.x=x;this.y=y;this.width=ENEMY_PROJECTILE_TARGET_WIDTH;this.height=ENEMY_PROJECTILE_TARGET_HEIGHT;this.speed=ENEMY_PROJECTILE_SPEED;this.sprite=images['enemyFourProjectile'];this.animation=this.sprite?new Animation(this.sprite,ENEMY_PROJECTILE_ACTUAL_FRAME_WIDTH,ENEMY_PROJECTILE_ACTUAL_FRAME_HEIGHT,ENEMY_PROJECTILE_NUM_FRAMES):null;}update(dt){this.x-=this.speed*dt;if(this.animation)this.animation.update(dt);}draw(){if(this.animation&&this.sprite.complete){const f=this.animation.getFrame();ctx.drawImage(this.sprite,f.sx,f.sy,f.sWidth,f.sHeight,this.x,this.y,this.width,this.height);}else{ctx.fillStyle=enemyProjectileColor;ctx.fillRect(this.x,this.y,this.width,this.height);}}}
class FlyingEnemy extends BaseEnemy{constructor(x,y){super(x,y,ENEMY_FIVE_TARGET_WIDTH,ENEMY_FIVE_TARGET_HEIGHT,'enemyFive',ENEMY_FIVE_ACTUAL_FRAME_WIDTH,ENEMY_FIVE_ACTUAL_FRAME_HEIGHT,ENEMY_FIVE_NUM_FRAMES,(0.6+Math.random()*0.3),1,flyingEnemySpawnColor);this.initialY=y;this.angle=Math.random()*Math.PI*2;this.amplitude=20+Math.random()*20;this.frequency=0.02+Math.random()*0.03;}update(dt){super.update(dt);this.angle+=this.frequency;this.y=this.initialY+Math.sin(this.angle)*this.amplitude;}}

function drawGround(){ctx.strokeStyle='#0f0';ctx.lineWidth=lineWidth;ctx.beginPath();ctx.moveTo(0,canvas.height-groundHeight);ctx.lineTo(canvas.width,canvas.height-groundHeight);ctx.stroke();}
function calculateNextObstacleSpawnTime(){const minT=6.0;const maxT=10.0;return minT+Math.random()*(maxT-minT);}
function spawnObstacleIfNeeded(dt){obstacleSpawnTimer+=dt;if(obstacleSpawnTimer>=nextObstacleSpawnTime){obstacleSpawnTimer=0;nextObstacleSpawnTime=calculateNextObstacleSpawnTime();obstacles.push(new Obstacle(canvas.width,canvas.height-groundHeight-OBSTACLE_TARGET_HEIGHT));}}
function updateObstacles(dt){for(let i=obstacles.length-1;i>=0;i--){obstacles[i].update(dt);if(obstacles[i].x+obstacles[i].width<0){obstacles.splice(i,1);score+=5;}}}
function drawObstacles(){obstacles.forEach(o=>o.draw());}
function updateProjectiles(dt){for(let i=projectiles.length-1;i>=0;i--){projectiles[i].update(dt);if(projectiles[i].x>canvas.width){projectiles.splice(i,1);}}}
function drawProjectiles(){projectiles.forEach(p=>p.draw());}
function updateShootCooldown(dt){if(!canShoot){shootTimer+=dt;if(shootTimer>=shootCooldownTime)canShoot=true;}}
function calculateNextEnemyBaseSpawnTime(){const minT=3.0;const maxT=5.0;return minT+Math.random()*(maxT-minT);}
function spawnEnemyBaseIfNeeded(dt){enemyBaseSpawnTimer+=dt;if(enemyBaseSpawnTimer>=nextEnemyBaseSpawnTime){enemyBaseSpawnTimer=0;nextEnemyBaseSpawnTime=calculateNextEnemyBaseSpawnTime();enemies.push(new BaseEnemy(canvas.width,canvas.height-groundHeight-ENEMY_ONE_TARGET_HEIGHT,ENEMY_ONE_TARGET_WIDTH,ENEMY_ONE_TARGET_HEIGHT,'enemyOne',ENEMY_ONE_ACTUAL_FRAME_WIDTH,ENEMY_ONE_ACTUAL_FRAME_HEIGHT,ENEMY_ONE_NUM_FRAMES,(0.7+Math.random()*0.5),1,enemyBaseSpawnColor));}}
function calculateNextFlyingEnemySpawnTime(){const minT=8.0;const maxT=15.0;return minT+Math.random()*(maxT-minT);}
function spawnFlyingEnemyIfNeeded(dt){flyingEnemySpawnTimer+=dt;if(flyingEnemySpawnTimer>=nextFlyingEnemySpawnTime){flyingEnemySpawnTimer=0;nextFlyingEnemySpawnTime=calculateNextFlyingEnemySpawnTime();const minY=canvas.height*0.1;const maxY=canvas.height*0.45;const localFlyingEnemyY=minY+Math.random()*(maxY-minY);flyingEnemies.push(new FlyingEnemy(canvas.width,localFlyingEnemyY));}}
function calculateNextGenericEnemySpawnTime(min,max){return min+Math.random()*(max-min);}
function spawnFastEnemyIfNeeded(dt){if(score<SCORE_THRESHOLD_FAST_ENEMY)return;fastEnemySpawnTimer+=dt;if(fastEnemySpawnTimer>=nextFastEnemySpawnTime){fastEnemySpawnTimer=0;nextFastEnemySpawnTime=calculateNextGenericEnemySpawnTime(4.0,7.0);fastEnemies.push(new BaseEnemy(canvas.width,canvas.height-groundHeight-ENEMY_TWO_TARGET_HEIGHT,ENEMY_TWO_TARGET_WIDTH,ENEMY_TWO_TARGET_HEIGHT,'enemyTwo',ENEMY_TWO_ACTUAL_FRAME_WIDTH,ENEMY_TWO_ACTUAL_FRAME_HEIGHT,ENEMY_TWO_NUM_FRAMES,fastEnemySpeedMultiplier,1,fastEnemySpawnColor));}}
function spawnArmoredEnemyIfNeeded(dt){if(score<SCORE_THRESHOLD_ARMORED_ENEMY)return;armoredEnemySpawnTimer+=dt;if(armoredEnemySpawnTimer>=nextArmoredEnemySpawnTime){armoredEnemySpawnTimer=0;nextArmoredEnemySpawnTime=calculateNextGenericEnemySpawnTime(7.0,12.0);armoredEnemies.push(new ArmoredEnemy(canvas.width,canvas.height-groundHeight-ENEMY_THREE_TARGET_HEIGHT));}}
function spawnShootingEnemyIfNeeded(dt){if(score<SCORE_THRESHOLD_SHOOTING_ENEMY)return;shootingEnemySpawnTimer+=dt;if(shootingEnemySpawnTimer>=nextShootingEnemySpawnTime){shootingEnemySpawnTimer=0;nextShootingEnemySpawnTime=calculateNextGenericEnemySpawnTime(8.0,14.0);shootingEnemies.push(new ShootingEnemy(canvas.width,canvas.height-groundHeight-ENEMY_FOUR_TARGET_HEIGHT));}}

function updateAllEnemyTypes(dt){
    enemies.forEach((e,i)=>{e.update(dt);if(e.x+e.width<0)enemies.splice(i,1);});
    flyingEnemies.forEach((e,i)=>{e.update(dt);if(e.x+e.width<0)flyingEnemies.splice(i,1);});
    fastEnemies.forEach((e,i)=>{e.update(dt);if(e.x+e.width<0)fastEnemies.splice(i,1);});
    armoredEnemies.forEach((e,i)=>{e.update(dt);if(e.x+e.width<0)armoredEnemies.splice(i,1);});
    shootingEnemies.forEach((e,i)=>{e.update(dt);if(e.x+e.width<0)shootingEnemies.splice(i,1);});
    enemyProjectiles.forEach((ep,i)=>{ep.update(dt);if(ep.x+ep.width<0)enemyProjectiles.splice(i,1);});
}
function drawAllEnemyTypes(){enemies.forEach(e=>e.draw());flyingEnemies.forEach(e=>e.draw());fastEnemies.forEach(e=>e.draw());armoredEnemies.forEach(e=>e.draw());shootingEnemies.forEach(e=>e.draw());enemyProjectiles.forEach(ep=>ep.draw());}

function checkCollisions(){
    if(!asyncDonkey||gameOverTrigger)return;
    const pC={x:asyncDonkey.x+asyncDonkey.colliderOffsetX,y:asyncDonkey.y+asyncDonkey.colliderOffsetY,width:asyncDonkey.colliderWidth,height:asyncDonkey.colliderHeight};
    const checkPlayerCollision=(entityList)=>{for(let entity of entityList){if(entity&&pC.x<entity.x+entity.width&&pC.x+pC.width>entity.x&&pC.y<entity.y+entity.height&&pC.y+pC.height>entity.y){gameOverTrigger=true;console.error(`HIT Player vs ${entity.constructor.name}`);return true;}}return false;};
    if(checkPlayerCollision(obstacles))return; if(checkPlayerCollision(enemies))return; if(checkPlayerCollision(fastEnemies))return;
    if(checkPlayerCollision(armoredEnemies))return; if(checkPlayerCollision(shootingEnemies))return; if(checkPlayerCollision(enemyProjectiles))return;

    for(let i=projectiles.length-1;i>=0;i--){
        const p=projectiles[i];if(!p)continue;
        let projectileConsumedThisHit=false;
        
        const processProjectileHit=(enemyList,pointsPerKill,indexInArray,isArmored=false,isFlying=false)=>{
            if (indexInArray < 0 || indexInArray >= enemyList.length) return false; // Boundary check
            const e=enemyList[indexInArray];
            if(e && p.x<e.x+e.width&&p.x+p.width>e.x&&p.y<e.y+e.height&&p.y+p.height>e.y){
                e.takeDamage();projectileConsumedThisHit=true;
                if(e.health<=0){enemyList.splice(indexInArray,1);score+=isFlying?flyingEnemyScoreValue:pointsPerKill;}
                else if(isArmored){score+=5;}
                return true;
            }return false;
        };

        // Check against each enemy type list. If a hit occurs, consume projectile and move to next projectile.
        for(let j=enemies.length-1;j>=0;j--){if(processProjectileHit(enemies,25,j)){break;}}
        if(projectileConsumedThisHit){projectiles.splice(i,1);continue;}

        for(let j=fastEnemies.length-1;j>=0;j--){if(processProjectileHit(fastEnemies,35,j)){break;}}
        if(projectileConsumedThisHit){projectiles.splice(i,1);continue;}

        for(let j=armoredEnemies.length-1;j>=0;j--){if(processProjectileHit(armoredEnemies,50,j,true)){break;}}
        if(projectileConsumedThisHit){projectiles.splice(i,1);continue;}

        for(let j=shootingEnemies.length-1;j>=0;j--){if(processProjectileHit(shootingEnemies,40,j)){break;}}
        if(projectileConsumedThisHit){projectiles.splice(i,1);continue;}

        for(let j=flyingEnemies.length-1;j>=0;j--){if(processProjectileHit(flyingEnemies,0,j,false,true)){break;}}
        if(projectileConsumedThisHit){projectiles.splice(i,1);continue;} // Ensure projectile is removed even if it's the last check
    }
}

function resetGame(){console.log("resetGame...");asyncDonkey=new Player(playerInitialX,playerInitialY,PLAYER_TARGET_WIDTH,PLAYER_TARGET_HEIGHT);obstacles=[];projectiles=[];enemies=[];flyingEnemies=[];fastEnemies=[];armoredEnemies=[];shootingEnemies=[];enemyProjectiles=[];obstacleSpawnTimer=0;nextObstacleSpawnTime=calculateNextObstacleSpawnTime();enemyBaseSpawnTimer=0;nextEnemyBaseSpawnTime=calculateNextEnemyBaseSpawnTime();flyingEnemySpawnTimer=0;nextFlyingEnemySpawnTime=calculateNextFlyingEnemySpawnTime();fastEnemySpawnTimer=0;nextFastEnemySpawnTime=calculateNextGenericEnemySpawnTime(4.0,7.0);armoredEnemySpawnTimer=0;nextArmoredEnemySpawnTime=calculateNextGenericEnemySpawnTime(7.0,12.0);shootingEnemySpawnTimer=0;nextShootingEnemySpawnTime=calculateNextGenericEnemySpawnTime(8.0,14.0);score=0;finalScore=0;gameOverTrigger=false;canShoot=true;shootTimer=0;console.log("resetGame: Fatto.");}
function drawMenuScreen(){ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#0f0';ctx.font='42px "Courier New",Courier,monospace';ctx.textAlign='center';ctx.fillText("asyncDonkey Runner",canvas.width/2,canvas.height/2-120);ctx.font='24px "Courier New",Courier,monospace';ctx.fillText("I S T R U Z I O N I:",canvas.width/2,canvas.height/2-50);ctx.font='18px "Courier New",Courier,monospace';ctx.textAlign='left';const iSX=canvas.width/2-220;const lS=28;let cY=canvas.height/2-10;ctx.fillText("> [SPACE] or [ARROW UP] = Jump",iSX,cY);cY+=lS;ctx.fillText("> [CTRL]  or [X]        = Shoot",iSX,cY);cY+=lS;ctx.fillText("> Evita Ostacoli",iSX,cY);cY+=lS;ctx.fillText("> Distruggi i \"Virus\" ",iSX,cY);cY+=lS;ctx.fillText("> Colpisci i \"Glitches\" (gialli) per Bonus!",iSX,cY);ctx.font='28px "Courier New",Courier,monospace';ctx.fillStyle='#ff0';ctx.textAlign='center';ctx.fillText("PRESS ENTER TO START",canvas.width/2,canvas.height-80);}
function updatePlaying(dt){if(gameOverTrigger){finalScore=score;currentGameState=GAME_STATE.GAME_OVER;return;}if(asyncDonkey)asyncDonkey.update(dt);spawnObstacleIfNeeded(dt);updateObstacles(dt);spawnEnemyBaseIfNeeded(dt);spawnFastEnemyIfNeeded(dt);spawnArmoredEnemyIfNeeded(dt);spawnShootingEnemyIfNeeded(dt);updateAllEnemyTypes(dt);spawnFlyingEnemyIfNeeded(dt);updateProjectiles(dt);updateShootCooldown(dt);checkCollisions();}
function drawPlayingScreen(){ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);drawGround();drawObstacles();drawAllEnemyTypes();drawProjectiles();if(asyncDonkey)asyncDonkey.draw();ctx.fillStyle='#0f0';ctx.font='24px "Courier New",Courier,monospace';ctx.textAlign='left';ctx.fillText("Score: "+score,20,40);}
function drawGameOverScreen(){ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#f00';ctx.font='52px "Courier New",Courier,monospace';ctx.textAlign='center';ctx.fillText("G A M E   O V E R",canvas.width/2,canvas.height/2-60);ctx.fillStyle='#ff0';ctx.font='32px "Courier New",Courier,monospace';ctx.fillText("Final Score: "+finalScore,canvas.width/2,canvas.height/2);ctx.fillStyle='#fff';ctx.font='22px "Courier New",Courier,monospace';ctx.fillText("PRESS ENTER TO RESTART",canvas.width/2,canvas.height/2+60);}

let lastTime=0;
function gameLoop(timestamp){const deltaTime=(timestamp-lastTime)/1000||0;lastTime=timestamp;ctx.clearRect(0,0,canvas.width,canvas.height);if(!resourcesInitialized){ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#0f0';ctx.font='20px "Courier New",Courier,monospace';ctx.textAlign='center';ctx.fillText("Loading Resources...",canvas.width/2,canvas.height/2);gameLoopRequestId=requestAnimationFrame(gameLoop);return;}
switch(currentGameState){case GAME_STATE.MENU:drawMenuScreen();break;case GAME_STATE.PLAYING:updatePlaying(deltaTime);drawPlayingScreen();break;case GAME_STATE.GAME_OVER:drawGameOverScreen();break;}
gameLoopRequestId=requestAnimationFrame(gameLoop);}
function startGameLoop(){if(gameLoopRequestId!==null)cancelAnimationFrame(gameLoopRequestId);lastTime=performance.now();console.log("Avvio Game Loop...");currentGameState=GAME_STATE.MENU;gameLoopRequestId=requestAnimationFrame(gameLoop);}

window.addEventListener('keydown',(e)=>{if(!resourcesInitialized)return;switch(currentGameState){case GAME_STATE.MENU:if(e.key==='Enter'){currentGameState=GAME_STATE.PLAYING;resetGame();}break;case GAME_STATE.PLAYING:if(asyncDonkey){if(e.code==='Space'||e.key==='ArrowUp'){e.preventDefault();asyncDonkey.jump();}if(e.code==='ControlLeft'||e.key==='x'||e.key==='X'||e.key==='ControlRight'){e.preventDefault();asyncDonkey.shoot();}}break;case GAME_STATE.GAME_OVER:if(e.key==='Enter'){currentGameState=GAME_STATE.PLAYING;resetGame();}break;}});

loadAllImages();
console.log("Fine script donkeyRunner.js (esecuzione iniziale). In attesa caricamento immagini...");