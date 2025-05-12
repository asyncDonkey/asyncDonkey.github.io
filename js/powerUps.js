// js/powerUps.js
import { Animation } from './animation.js';

export const POWERUP_TYPE = {
    TRIPLE_SHOT: 'TRIPLE_SHOT',
    SHIELD: 'SHIELD',
    SMART_BOMB: 'SMART_BOMB',
    DEBUG_MODE: 'DEBUG_MODE',     // Proiettili potenziati
    FIREWALL: 'FIREWALL',         // Immunità agli ostacoli (codeBlock)
    BLOCK_BREAKER: 'BLOCK_BREAKER' // Permette di rompere i codeBlock con i proiettili
};

export const POWERUP_DURATION = { // In secondi
    TRIPLE_SHOT: 6,
    SHIELD: 5,
    DEBUG_MODE: 8,
    FIREWALL: 7,
    BLOCK_BREAKER: 10
};

const POWERUP_SPRITE_SCALE_FACTOR = 1.5;
const POWERUP_ACTUAL_FRAME_WIDTH = 32;
const POWERUP_ACTUAL_FRAME_HEIGHT = 32;
const POWERUP_NUM_FRAMES = 4;
const POWERUP_ANIMATION_SPEED = 0.15;

export const POWERUP_TARGET_WIDTH = POWERUP_ACTUAL_FRAME_WIDTH * POWERUP_SPRITE_SCALE_FACTOR;
export const POWERUP_TARGET_HEIGHT = POWERUP_ACTUAL_FRAME_HEIGHT * POWERUP_SPRITE_SCALE_FACTOR;

export const POWERUP_COLORS = {
    [POWERUP_TYPE.TRIPLE_SHOT]: '#FFFF00', // Giallo
    [POWERUP_TYPE.SHIELD]: '#00FFFF',    // Ciano
    [POWERUP_TYPE.SMART_BOMB]: '#FF00FF',  // Magenta
    [POWERUP_TYPE.DEBUG_MODE]: '#32CD32', // LimeGreen (Sprite proiettile potenziato)
    [POWERUP_TYPE.FIREWALL]: '#008000',    // Verde (Aura quadrata verde)
    [POWERUP_TYPE.BLOCK_BREAKER]: '#FFA500' // Arancione (Rompere codeBlock)
};

export class PowerUpItem {
    constructor(x, y, type, imagesRef, gameSpeedRef) {
        this.x = x;
        this.y = y;
        this.width = POWERUP_TARGET_WIDTH;
        this.height = POWERUP_TARGET_HEIGHT;
        this.type = type;
        this.images = imagesRef;
        this.gameSpeedValue = gameSpeedRef;

        this.sprite = null;
        this.animation = null;
        this.fallbackColor = POWERUP_COLORS[this.type] || '#FFFFFF';

        let tempSprite = null;
        switch (this.type) {
            case POWERUP_TYPE.TRIPLE_SHOT:
                tempSprite = this.images['powerUpTripleShot'];
                break;
            case POWERUP_TYPE.SHIELD:
                tempSprite = this.images['powerUpShield'];
                break;
            case POWERUP_TYPE.SMART_BOMB:
                tempSprite = this.images['powerUpBomb'];
                break;
            case POWERUP_TYPE.DEBUG_MODE:
                tempSprite = this.images['powerUpDebugMode']; // Assicurati di aggiungere POWERUP_DEBUG_MODE_SRC
                break;
            case POWERUP_TYPE.FIREWALL:
                tempSprite = this.images['powerUpFirewall'];   // Assicurati di aggiungere POWERUP_FIREWALL_SRC
                break;
            case POWERUP_TYPE.BLOCK_BREAKER:
                tempSprite = this.images['powerUpBlockBreaker']; // Assicurati di aggiungere POWERUP_BLOCK_BREAKER_SRC
                break;
        }

        if (tempSprite && tempSprite.complete && tempSprite.naturalWidth !== 0) {
            this.sprite = tempSprite;
            if (POWERUP_NUM_FRAMES > 1) {
                this.animation = new Animation(
                    this.sprite,
                    POWERUP_ACTUAL_FRAME_WIDTH,
                    POWERUP_ACTUAL_FRAME_HEIGHT,
                    POWERUP_NUM_FRAMES,
                    POWERUP_ANIMATION_SPEED
                );
            }
        } else {
            if (tempSprite) {
                 console.warn(`Sprite per PowerUp ${this.type} (${tempSprite.src}) non è utilizzabile. Verrà usato colore fallback.`);
            } else {
                 console.warn(`Sprite per PowerUp ${this.type} non trovato in imagesRef. Verrà usato colore fallback.`);
            }
            this.sprite = null;
        }
    }

    update(dt) {
        const currentSpeed = typeof this.gameSpeedValue === 'function' ? this.gameSpeedValue() : this.gameSpeedValue;
        this.x -= currentSpeed * dt * 0.8; // Power-ups si muovono un po' più lentamente del gioco

        if (this.animation) {
            this.animation.update(dt);
        }
    }

    draw(ctx) {
        if (this.animation && this.sprite) {
            const frame = this.animation.getFrame();
            ctx.drawImage(this.sprite, frame.sx, frame.sy, frame.sWidth, frame.sHeight, this.x, this.y, this.width, this.height);
        } else if (this.sprite) {
            ctx.drawImage(
                this.sprite,
                0, 0,
                POWERUP_ACTUAL_FRAME_WIDTH, POWERUP_ACTUAL_FRAME_HEIGHT,
                this.x, this.y, this.width, this.height
            );
        } else {
            ctx.fillStyle = this.fallbackColor;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}