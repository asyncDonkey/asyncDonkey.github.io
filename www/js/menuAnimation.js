/**
 * @file menuAnimation.js
 * Gestisce l'animazione AUTONOMA (non interattiva) nel menu principale.
 * L'asinello si muove da solo per "mangiare" i caratteri.
 * CORRETTO per: grafica blurry, animazione di uscita, layout fullscreen.
 */

// Costanti
const GRAVITY = 0.6;
const GROUND_LEVEL_PERCENT = 0.85; // Posizione del terreno (85% dall'alto)

// --- CLASSI DELL'ANIMAZIONE ---

class MenuDonkey {
    constructor(canvas, sprite) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.sprite = sprite;
        this.sw = 32; this.sh = 32;
        this.dw = 60; this.dh = 60;
        this.x = 50;
        this.groundY = this.canvas.height * GROUND_LEVEL_PERCENT - this.dh;
        this.y = this.groundY;
        this.dy = 0;
        this.dx = 1.5;
        this.isJumping = false;
        
        this.state = 'roaming';
        this.target = null;
        this.direction = 1;

        this.frameCount = 5;
        this.frameIndex = 0;
        this.ticksPerFrame = 5;
        this.tickCount = 0;
    }

    draw() {
        this.ctx.save();
        if (this.direction === -1) {
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(this.sprite, this.frameIndex * this.sw, 0, this.sw, this.sh, -this.x - this.dw, this.y, this.dw, this.dh);
        } else {
            this.ctx.drawImage(this.sprite, this.frameIndex * this.sw, 0, this.sw, this.sh, this.x, this.y, this.dw, this.dh);
        }
        this.ctx.restore();
    }

    update() {
        if (this.state === 'exiting') {
            this.direction = 1;
            this.x += 8;
        } else if (this.state === 'roaming') {
            this.x += this.dx * this.direction;
            if (this.x + this.dw > this.canvas.width || this.x < 0) {
                this.direction *= -1;
            }
        } else if (this.state === 'targeting' && this.target) {
            const targetCenter = this.target.x + this.target.width / 2;
            const selfCenter = this.x + this.dw / 2;
            if (Math.abs(targetCenter - selfCenter) < 15) {
                this._jump();
            } else {
                this.direction = (targetCenter > selfCenter) ? 1 : -1;
                this.x += this.dx * this.direction;
            }
        } else {
            this.state = 'roaming';
        }

        this.dy += GRAVITY;
        this.y += this.dy;
        if (this.y >= this.groundY) {
            this.y = this.groundY;
            this.dy = 0;
            this.isJumping = false;
        }

        this.tickCount++;
        if (this.tickCount > this.ticksPerFrame) {
            this.tickCount = 0;
            this.frameIndex = this.isJumping ? 1 : (this.frameIndex + 1) % this.frameCount;
        }
    }
    
    _jump() {
        if (!this.isJumping) {
            this.dy = -15;
            this.isJumping = true;
        }
    }

    setTarget(character) {
        this.target = character;
        this.state = 'targeting';
    }

    setRoaming() {
        this.target = null;
        this.state = 'roaming';
    }
}

class MenuCharacter {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        const groundY = this.canvas.height * GROUND_LEVEL_PERCENT;
        this.x = Math.random() * (this.canvas.width - 200) + 100;
        this.y = groundY - (Math.random() * 100 + 80);
        const chars = ['<VAR>', '{...}', '()=>', '0xFA'];
        this.char = chars[Math.floor(Math.random() * chars.length)];
        this.color = '#50fa7b';
        this.ctx.font = '22px "Source Code Pro", monospace';
        this.width = this.ctx.measureText(this.char).width;
        this.height = 22;
    }
    draw() {
        this.ctx.fillStyle = this.color;
        this.ctx.font = '22px "Source Code Pro", monospace';
        this.ctx.fillText(this.char, this.x, this.y);
    }
}

class MenuGround {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.y = this.canvas.height * GROUND_LEVEL_PERCENT;
        this.color = '#0eaf9b';
    }
    draw() {
        this.ctx.fillStyle = this.color;
        this.ctx.fillRect(0, this.y, this.canvas.width, 2);
    }
    resize() {
        this.y = this.canvas.height * GROUND_LEVEL_PERCENT;
    }
}

export const menuAnimation = {
    canvas: null, ctx: null, donkey: null, character: null, ground: null,
    animationFrameId: null, isRunning: false,

    init(canvasId, playerSprite) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        // --- FIX PER LA GRAFICA PIXEL ART SFUOCATA ---
        this.ctx.imageSmoothingEnabled = false;
        
        this.donkey = new MenuDonkey(this.canvas, playerSprite);
        this.ground = new MenuGround(this.canvas);
        
        // Gestione del ridimensionamento della finestra
        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas(); // Chiamata iniziale per impostare le dimensioni

        this.spawnCharacter();
        this.start();
    },
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // Riapplica l'impostazione anti-blur dopo il resize
        this.ctx.imageSmoothingEnabled = false;
        // Aggiorna la posizione degli elementi dipendenti dall'altezza
        if (this.ground) this.ground.resize();
        if (this.donkey) this.donkey.groundY = this.canvas.height * GROUND_LEVEL_PERCENT - this.donkey.dh;
    },

    spawnCharacter() {
        this.character = new MenuCharacter(this.canvas);
        this.donkey.setTarget(this.character);
    },

    start() { if (this.isRunning) return; this.isRunning = true; this.loop(); },

    stop() { this.isRunning = false; if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId); window.removeEventListener('resize', this.resizeCanvas); },

    loop() {
        if (!this.isRunning) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ground.draw();
        this.donkey.update();
        this.donkey.draw();
        
        if (this.character) {
            this.character.draw();
            const donkeyRect = { x: this.donkey.x, y: this.donkey.y, width: this.donkey.dw, height: this.donkey.dh };
            const charRect = { x: this.character.x, y: this.character.y - this.character.height, width: this.character.width, height: this.character.height };

            if (
                donkeyRect.x < charRect.x + charRect.width &&
                donkeyRect.x + donkeyRect.width > charRect.x &&
                donkeyRect.y < charRect.y + charRect.height &&
                donkeyRect.y + donkeyRect.height > charRect.y
            ) {
                // Collisione: crea un nuovo carattere e imposta un nuovo obiettivo
                this.spawnCharacter();
            }
        }
        
        this.animationFrameId = requestAnimationFrame(() => this.loop());
    },

    startExitAnimation() {
        return new Promise((resolve) => {
            // Non fermare il loop principale, ma cambia lo stato dell'asino
            this.donkey.state = 'exiting'; 

            const checkExit = () => {
                if (this.donkey.x > this.canvas.width) {
                    // Una volta fuori dallo schermo, ferma tutto e risolvi la promessa
                    this.stop();
                    resolve();
                } else {
                    // Altrimenti continua a controllare
                    requestAnimationFrame(checkExit);
                }
            };
            checkExit();
        });
    }
};