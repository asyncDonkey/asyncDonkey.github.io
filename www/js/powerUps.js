// js/powerUps.js
import { SpriteAnimation } from './animation.js'; // FIX: Renamed import

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
        src: 'images/powerups/tripleShotPowerUp.png',
        spriteKey: 'powerup_triple_shot',
        frameWidth: 32,
        frameHeight: 32,
        numFrames: 4,
        animationSpeed: 0.1,
    },
    [POWERUP_TYPE.SHIELD]: {
        src: 'images/powerups/shieldPowerUp.png',
        spriteKey: 'powerup_shield',
        frameWidth: 32,
        frameHeight: 32,
        numFrames: 4,
        animationSpeed: 0.1,
    },
    [POWERUP_TYPE.SMART_BOMB]: {
        src: 'images/powerups/bombPowerUp.png',
        spriteKey: 'powerup_smart_bomb',
        frameWidth: 32,
        frameHeight: 32,
        numFrames: 4,
        animationSpeed: 0.1,
    },
    [POWERUP_TYPE.DEBUG_MODE]: {
        src: 'images/powerups/powerUpDebugMode.png',
        spriteKey: 'powerup_debug_mode',
        frameWidth: 32,
        frameHeight: 32,
        numFrames: 4,
        animationSpeed: 0.1,
    },
    [POWERUP_TYPE.FIREWALL]: {
        src: 'images/powerups/powerUpFirewall.png',
        spriteKey: 'powerup_firewall',
        frameWidth: 32,
        frameHeight: 32,
        numFrames: 4,
        animationSpeed: 0.1,
    },
    [POWERUP_TYPE.BLOCK_BREAKER]: {
        src: 'images/powerups/powerUpBlockBreaker.png',
        spriteKey: 'powerup_block_breaker',
        frameWidth: 32,
        frameHeight: 32,
        numFrames: 4,
        animationSpeed: 0.1,
    },
};

export class PowerUpItem {
    constructor(x, y, type, images) {
        this.type = type;
        this.config = POWERUP_CONFIGS[type];
        if (!this.config) {
            console.error(`Configurazione non trovata per power-up tipo: ${type}`);
            this.config = { frameWidth: 32, frameHeight: 32 };
        }

        this.x = x;
        this.y = y;
        this.width = this.config.frameWidth * 1.5;
        this.height = this.config.frameHeight * 1.5;

        this.sprite = images[this.config.spriteKey];
        this.animation = null;

        // FIX: Use new SpriteAnimation class
        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0 && this.config.numFrames > 1) {
            this.animation = new SpriteAnimation(
                this.sprite,
                this.config.frameWidth,
                this.config.frameHeight,
                this.config.numFrames,
                this.config.animationSpeed || 0.1
            );
        }
    }

    update(dt, gameSpeed) {
        this.x -= gameSpeed * dt;
        if (this.animation) {
            this.animation.update(dt);
        }
    }

    draw(ctx) {
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
            ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = 'purple';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.font = '10px monospace';
            ctx.fillText(this.type.slice(0, 3), this.x + this.width / 2, this.y + this.height / 2);
        }
    }
}
