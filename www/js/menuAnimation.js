// AGGIUNGI QUESTA RIGA ALL'INIZIO DEL FILE
import * as AudioManager from './audioManager.js'; 

// Costanti
const GRAVITY = 0.6;
const GROUND_LEVEL_PERCENT = 0.85;

// --- CLASSI DELL'ANIMAZIONE ---

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 2;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 50; // durata in frame
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / 50; // Fade out
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

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
        if (!this.sprite || !this.sprite.complete || this.sprite.naturalWidth === 0) {
            this.ctx.fillStyle = '#FFF'; // Fallback se lo sprite non è pronto
            this.ctx.fillRect(this.x, this.y, this.dw, this.dh);
            return;
        }
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
        // Gestione degli stati con uno switch, più pulito e robusto
        switch(this.state) {
            case 'exiting':
                this.direction = 1;
                this.x += 8;
                break;

            case 'roaming':
                this.x += this.dx * this.direction;
                if (this.x + this.dw > this.canvas.width || this.x < 0) {
                    this.direction *= -1;
                }
                break;

            case 'targeting':
                if (this.target) {
                    const targetCenter = this.target.x + this.target.width / 2;
                    const selfCenter = this.x + this.dw / 2;
                    if (Math.abs(targetCenter - selfCenter) < 15) {
                        this._jump();
                    } else {
                        this.direction = (targetCenter > selfCenter) ? 1 : -1;
                        this.x += this.dx * this.direction;
                    }
                } else {
                    // Se il target non c'è più, torna a vagare
                    this.state = 'roaming';
                }
                break;
        }

        // La logica fisica viene eseguita sempre, indipendentemente dallo stato
        this.dy += GRAVITY;
        this.y += this.dy;
        if (this.y >= this.groundY) {
            this.y = this.groundY;
            this.dy = 0;
            this.isJumping = false;
        }

        // La logica dell'animazione dello sprite viene eseguita sempre
        this.tickCount++;
        if (this.tickCount > this.ticksPerFrame) {
            this.tickCount = 0;
            this.frameIndex = this.isJumping ? 1 : (this.frameIndex + 1) % this.frameCount;
        }
    }
    
    _jump() { if (!this.isJumping) { this.dy = -15; this.isJumping = true; } }

    setTarget(character) { this.target = character; this.state = 'targeting'; }
}

class MenuCharacter {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        const groundY = this.canvas.height * GROUND_LEVEL_PERCENT;
        this.x = Math.random() * (this.canvas.width - 200) + 100;
        this.y = groundY - (Math.random() * 100 + 80);
        const chars = [
            '()=>{}', 'const', 'let', 'var', 'async', 'await',
            'import', 'export', 'class', 'super', 'this', 'null',
            'true', 'false', '<null>', '0xDEAD', '0xBEEF', 'void',
            'static', '...args', 'Promise', 'Array.map'
        ];
        this.char = chars[Math.floor(Math.random() * chars.length)];
        const colors = ['#50fa7b', '#8be9fd', '#ff79c6', '#f1fa8c', '#ffb86c'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        this.glowColor = this.color;
        this.glowBlur = 10;
        this.glowAlpha = 0;
        this.glowDirection = 1;

        this.ctx.font = '22px "Source Code Pro", monospace';
        this.width = this.ctx.measureText(this.char).width; this.height = 22;
    }
    
    update() {
        this.glowAlpha += 0.02 * this.glowDirection;
        if (this.glowAlpha > 0.75) {
            this.glowAlpha = 0.75;
            this.glowDirection = -1;
        } else if (this.glowAlpha < 0) {
            this.glowAlpha = 0;
            this.glowDirection = 1;
        }
    }

    draw() {
        this.ctx.save();
        this.ctx.globalAlpha = this.glowAlpha;
        this.ctx.shadowBlur = this.glowBlur;
        this.ctx.shadowColor = this.glowColor;
        this.ctx.fillStyle = this.color;
        this.ctx.font = '22px "Source Code Pro", monospace';
        this.ctx.fillText(this.char, this.x, this.y);
        
        this.ctx.restore();
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
        
        this.palette = {
            DARK_TEAL_BLUE: '#32535f',
            MEDIUM_TEAL: '#0b8a8f',
            BRIGHT_TEAL: '#0eaf9b',
        };
        this.lineWidth = 2;
    }

    draw() {
        const groundHeight = this.canvas.height - this.y;
        this.ctx.fillStyle = this.palette.DARK_TEAL_BLUE;
        this.ctx.fillRect(0, this.y, this.canvas.width, groundHeight);

        this.ctx.fillStyle = this.palette.MEDIUM_TEAL;
        this.ctx.fillRect(0, this.y, this.canvas.width, this.lineWidth * 3);

        this.ctx.fillStyle = this.palette.BRIGHT_TEAL;
        this.ctx.fillRect(0, this.y + this.lineWidth * 3, this.canvas.width, this.lineWidth);
    }

    resize() {
        this.y = this.canvas.height * GROUND_LEVEL_PERCENT;
    }
}

export const menuAnimation = {
    canvas: null, ctx: null, donkey: null, character: null, ground: null,
    animationFrameId: null, isRunning: false, particles: [],

    init(canvasId, playerSprite) {
        this.canvas = document.getElementById(canvasId); if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d'); this.ctx.imageSmoothingEnabled = false;
        this.donkey = new MenuDonkey(this.canvas, playerSprite);
        this.ground = new MenuGround(this.canvas);
        window.addEventListener('resize', () => this.resizeCanvas()); this.resizeCanvas();
        this.spawnCharacter(); this.start();
    },
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight;
        this.ctx.imageSmoothingEnabled = false;
        if (this.ground) this.ground.resize();
        if (this.donkey) this.donkey.groundY = this.canvas.height * GROUND_LEVEL_PERCENT - this.donkey.dh;
    },

    spawnCharacter() { this.character = new MenuCharacter(this.canvas); this.donkey.setTarget(this.character); },

    start() { if (this.isRunning) return; this.isRunning = true; this.loop(); },

    stop() { this.isRunning = false; if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId); window.removeEventListener('resize', this.resizeCanvas); },

    loop() {
        if (!this.isRunning) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ground.draw();
        
        this.donkey.update();
        this.donkey.draw();
        
        if (this.character) {
            this.character.update();
            this.character.draw();
            const donkeyRect = { x: this.donkey.x, y: this.donkey.y, width: this.donkey.dw, height: this.donkey.dh };
            const charRect = { x: this.character.x, y: this.character.y - this.character.height, width: this.character.width, height: this.character.height };
            
            if (donkeyRect.x < charRect.x + charRect.width && donkeyRect.x + donkeyRect.width > charRect.x && donkeyRect.y < charRect.y + charRect.height && donkeyRect.y + donkeyRect.height > charRect.y) {
                
                for (let i = 0; i < 20; i++) {
                    this.particles.push(new Particle(this.character.x + this.character.width / 2, this.character.y - this.character.height / 2, this.character.color));
                }

                AudioManager.playSound('sfx_menu_eat', false, 0.6);
                
                this.character = null;
                this.donkey.target = null;
                this.donkey.state = 'roaming';
                
                setTimeout(() => this.spawnCharacter(), 2000);
            }
        }
        
        this.ctx.globalAlpha = 1;
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            this.particles[i].draw(this.ctx);
            if (this.particles[i].life <= 0) this.particles.splice(i, 1);
        }
        
        this.animationFrameId = requestAnimationFrame(() => this.loop());
    },

    startExitAnimation() {
        return new Promise((resolve) => {
            this.donkey.state = 'exiting';
            const checkExit = () => {
                if (this.donkey.x > this.canvas.width) { this.stop(); resolve(); } 
                else { requestAnimationFrame(checkExit); }
            };
            checkExit();
        });
    }
};