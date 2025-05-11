// js/minibosses.js
import { BaseEnemy, EnemyProjectile } from './donkeyRunner.js';
import * as AudioManager from './audioManager.js';
import { Animation } from './animation.js';

export class Glitchzilla extends BaseEnemy {
    constructor(x, y, imagesRef, config) {
        super(x, y,
            config.GLITCHZILLA_TARGET_WIDTH, config.GLITCHZILLA_TARGET_HEIGHT,
            'glitchzilla_base', // Initial sprite name
            config.GLITCHZILLA_ACTUAL_FRAME_WIDTH, config.GLITCHZILLA_ACTUAL_FRAME_HEIGHT,
            config.GLITCHZILLA_NUM_FRAMES,
            0.15,
            config.GLITCHZILLA_HEALTH,
            '#FF00FF',
            config.GLITCHZILLA_SCORE_VALUE
        );
        this.images = imagesRef;
        this.config = config;

        this.attackPatternTimer = 0;
        this.currentAttackPhase = 0;
        this.shotsInPhase = 0;
        this.pauseAfterSequenceTimer = 0;
        this.isPausedAfterSequence = true;
        this.PAUSE_BETWEEN_SHOTS = 0.9;
        this.PAUSE_AFTER_SEQUENCE = 3.0;

        // Store sprite names for damage states
        this.spriteNames = {
            base: 'glitchzilla_base',
            dmg1: 'glitchzilla_dmg1', // for HP <= 20
            dmg2: 'glitchzilla_dmg2', // for HP <= 10
            dmg3: 'glitchzilla_dmg3'  // for HP <= 5
        };
        this.currentFrameWidth = config.GLITCHZILLA_ACTUAL_FRAME_WIDTH; // Store for animation updates
        this.currentFrameHeight = config.GLITCHZILLA_ACTUAL_FRAME_HEIGHT;
        this.currentNumFrames = config.GLITCHZILLA_NUM_FRAMES;

        this.updateSpriteBasedOnHealth(); // Set initial sprite
        AudioManager.playSound('glitchzillaSpawn', false, 0.9);
        console.log("Glitchzilla instance created with health:", this.health);
    }

    updateSpriteBasedOnHealth() {
        let newSpriteName = this.spriteNames.base;
        if (this.health <= 5) {
            newSpriteName = this.spriteNames.dmg3;
        } else if (this.health <= 10) {
            newSpriteName = this.spriteNames.dmg2;
        } else if (this.health <= 20) {
            newSpriteName = this.spriteNames.dmg1;
        }

        if (this.sprite !== this.images[newSpriteName]) {
            this.sprite = this.images[newSpriteName];
            if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0 && this.currentNumFrames > 0) {
                this.animation = new Animation(this.sprite, this.currentFrameWidth, this.currentFrameHeight, this.currentNumFrames);
            } else {
                this.animation = null; // Fallback if sprite is missing
                console.warn(`Glitchzilla sprite ${newSpriteName} missing or invalid.`);
            }
        }
    }

    update(dt, enemyProjectilesArray) {
        this.x -= this.speed * dt;

        if (this.x < this.config.CANVAS_WIDTH / 2 - this.width / 2) {
            this.x = this.config.CANVAS_WIDTH / 2 - this.width / 2;
        }
        if (this.animation) this.animation.update(dt);

        if (this.isPausedAfterSequence) {
            this.pauseAfterSequenceTimer += dt;
            if (this.pauseAfterSequenceTimer >= this.PAUSE_AFTER_SEQUENCE) {
                this.isPausedAfterSequence = false;
                this.pauseAfterSequenceTimer = 0;
                this.currentAttackPhase = 0;
                this.shotsInPhase = 0;
                this.attackPatternTimer = this.PAUSE_BETWEEN_SHOTS;
                console.log("Glitchzilla: Starting new attack sequence.");
            }
            return;
        }

        this.attackPatternTimer += dt;

        if (this.shotsInPhase < 3 && this.attackPatternTimer >= this.PAUSE_BETWEEN_SHOTS) {
            this.attackPatternTimer = 0;

            let projectileY;
            const projectileX = this.x - this.config.GLITCHZILLA_PROJECTILE_TARGET_WIDTH - 5; // Use specific projectile width

            switch (this.currentAttackPhase) {
                case 0:
                    projectileY = this.y + this.height * 0.25 - this.config.GLITCHZILLA_PROJECTILE_TARGET_HEIGHT / 2;
                    break;
                case 1:
                    projectileY = this.y + this.height * 0.50 - this.config.GLITCHZILLA_PROJECTILE_TARGET_HEIGHT / 2;
                    break;
                case 2:
                    projectileY = this.y + this.height * 0.75 - this.config.GLITCHZILLA_PROJECTILE_TARGET_HEIGHT / 2;
                    break;
            }

            if (projectileY !== undefined) {
                enemyProjectilesArray.push(new EnemyProjectile(
                    projectileX, projectileY,
                    this.config.GLITCHZILLA_PROJECTILE_SPRITE_SRC, // Specific sprite for Glitchzilla projectile
                    this.config.GLITCHZILLA_PROJECTILE_FRAME_WIDTH,
                    this.config.GLITCHZILLA_PROJECTILE_FRAME_HEIGHT,
                    this.config.GLITCHZILLA_PROJECTILE_NUM_FRAMES
                ));
                AudioManager.playSound('glitchzillaAttack', false, 0.75);
            }

            this.shotsInPhase++;
            this.currentAttackPhase++;

            if (this.shotsInPhase >= 3) {
                this.isPausedAfterSequence = true;
                this.pauseAfterSequenceTimer = 0;
            }
        }
    }

    takeDamage(dmg = 1) {
        super.takeDamage(dmg); // Reduces health
        this.updateSpriteBasedOnHealth(); // Update sprite after taking damage
        AudioManager.playSound('glitchzillaHit', false, 0.8);
        console.log(`Glitchzilla hit! Health: ${this.health}`);
        if (this.health <= 0) {
            console.log("Glitchzilla SCONFITTO!");
            AudioManager.playSound('glitchzillaDefeat', false, 1.0);
            return true;
        }
        return false;
    }
}