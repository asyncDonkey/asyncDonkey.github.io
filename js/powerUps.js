// js/powerUps.js

export const POWERUP_TYPE = {
    TRIPLE_SHOT: 'triple_shot',
    SHIELD: 'shield',
    SMART_BOMB: 'smart_bomb',
    DEBUG_MODE: 'debug_mode',
    FIREWALL: 'firewall',
    BLOCK_BREAKER: 'block_breaker',
};

export const POWERUP_DURATION = {
    TRIPLE_SHOT: 10,
    SHIELD: 10,
    DEBUG_MODE: 10,
    FIREWALL: 8,
    BLOCK_BREAKER: 12,
};

const POWER_UP_SPRITE_SCALE = 1.5;

export const POWERUP_CONFIGS = {
    [POWERUP_TYPE.TRIPLE_SHOT]: {
        spriteKey: 'powerUpTripleShot',
        src: 'images/tripleShotPowerUp.png', // Path immagine
        actualFrameWidth: 32,
        actualFrameHeight: 32,
        numFrames: 1, // Assumendo sprite statici per ora
        targetWidth: 32 * POWER_UP_SPRITE_SCALE,
        targetHeight: 32 * POWER_UP_SPRITE_SCALE,
    },
    [POWERUP_TYPE.SHIELD]: {
        spriteKey: 'powerUpShield',
        src: 'images/shieldPowerUp.png', // Path immagine
        actualFrameWidth: 32, actualFrameHeight: 32, numFrames: 1, targetWidth: 32 * POWER_UP_SPRITE_SCALE, targetHeight: 32 * POWER_UP_SPRITE_SCALE,
    },
    [POWERUP_TYPE.SMART_BOMB]: {
        spriteKey: 'powerUpSmartBomb',
        src: 'images/bombPowerUp.png', // Path immagine
        actualFrameWidth: 32, actualFrameHeight: 32, numFrames: 1, targetWidth: 32 * POWER_UP_SPRITE_SCALE, targetHeight: 32 * POWER_UP_SPRITE_SCALE,
    },
    [POWERUP_TYPE.DEBUG_MODE]: {
        spriteKey: 'powerUpDebugMode',
        src: 'images/powerUpDebugMode.png', // Path immagine
        actualFrameWidth: 32, actualFrameHeight: 32, numFrames: 1, targetWidth: 32 * POWER_UP_SPRITE_SCALE, targetHeight: 32 * POWER_UP_SPRITE_SCALE,
    },
    [POWERUP_TYPE.FIREWALL]: {
        spriteKey: 'powerUpFirewall',
        src: 'images/powerUpFirewall.png', // Path immagine
        actualFrameWidth: 32, actualFrameHeight: 32, numFrames: 1, targetWidth: 32 * POWER_UP_SPRITE_SCALE, targetHeight: 32 * POWER_UP_SPRITE_SCALE,
    },
    [POWERUP_TYPE.BLOCK_BREAKER]: {
        spriteKey: 'powerUpBlockBreaker',
        src: 'images/powerUpBlockBreaker.png', // Path immagine
        actualFrameWidth: 32, actualFrameHeight: 32, numFrames: 1, targetWidth: 32 * POWER_UP_SPRITE_SCALE, targetHeight: 32 * POWER_UP_SPRITE_SCALE,
    },
};

export class PowerUpItem {
    constructor(x, y, type, imagesRef) {
        this.x = x;
        this.y = y;
        this.type = type;
        
        this.config = POWERUP_CONFIGS[this.type];

        if (!this.config) {
            console.error(`Configurazione non trovata per il power-up di tipo: ${this.type}`);
            // Imposta valori di fallback se la configurazione non è trovata
            this.width = 32; 
            this.height = 32;
            this.sprite = null;
            this.animation = null;
            return; // Esce dal costruttore se la configurazione non è valida
        }

        this.width = this.config.targetWidth;
        this.height = this.config.targetHeight;
        
        if (imagesRef && this.config.spriteKey && imagesRef[this.config.spriteKey]) {
            this.sprite = imagesRef[this.config.spriteKey];
        } else {
            console.warn(`Sprite non trovato in imagesRef per spriteKey: ${this.config.spriteKey} (tipo: ${this.type}). Verifica che sia in imagesToLoad.`);
            this.sprite = null; // Imposta a null se lo sprite non è disponibile
        }

        this.animation = null; 
        // Assicurati che 'Animation' sia definita globalmente o importata correttamente in donkeyRunner.js
        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0 && this.config.numFrames > 1 && typeof Animation !== 'undefined') {
            this.animation = new Animation(
                this.sprite,
                this.config.actualFrameWidth,
                this.config.actualFrameHeight,
                this.config.numFrames,
                0.1 
            );
        }
    }

    update(dt, gameSpeed) {
        this.x -= gameSpeed * dt * 0.5; 
        if (this.animation) {
            this.animation.update(dt);
        }
    }

    draw(ctx) {
        if (!this.config || !this.sprite) { // Non disegnare se la configurazione o lo sprite mancano
            // Potresti disegnare un placeholder di errore qui se vuoi
            // console.warn(`Tentativo di disegnare PowerUpItem senza config o sprite valido: ${this.type}`);
            return;
        }

        const spriteToDraw = this.sprite;
        // Verifica aggiuntiva che lo sprite sia effettivamente un'immagine caricata
        const spriteUsable = spriteToDraw instanceof HTMLImageElement && spriteToDraw.complete && spriteToDraw.naturalWidth > 0;

        if (spriteUsable) {
            if (this.animation) { 
                const frame = this.animation.getFrame();
                ctx.drawImage(
                    spriteToDraw,
                    frame.sx, frame.sy, this.config.actualFrameWidth, this.config.actualFrameHeight,
                    this.x, this.y, this.width, this.height
                );
            } else { 
                ctx.drawImage(
                    spriteToDraw,
                    0, 0, 
                    this.sprite.naturalWidth / (this.config.numFrames || 1), // Usa naturalWidth/numFrames per il frame width sorgente
                    this.sprite.naturalHeight, // Usa naturalHeight per il frame height sorgente
                    this.x, this.y, this.width, this.height
                );
            }
        } else {
            // Fallback se lo sprite non è valido o non caricato
            ctx.fillStyle = 'gold';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = 'black';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.font = '10px Arial';
            ctx.fillText('P!', this.x + this.width / 2, this.y + this.height / 2 + 4);
        }
    }
}

