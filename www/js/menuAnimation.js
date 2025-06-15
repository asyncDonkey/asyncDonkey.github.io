// www/js/menuAnimation.js

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

// ✅ NUOVA CLASSE PORTAL (TASK 2.1)
class Portal {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.maxRadius = 40;
		this.radius = 0;
		this.life = 0; // Contatore per l'animazione
		this.isActive = true;
	}

	update(dt) {
		this.life += dt * 5; // Velocità della pulsazione
		// Anima il raggio per farlo crescere rapidamente e poi pulsare
		if (this.radius < this.maxRadius) {
			this.radius += 80 * dt; // Velocità di apertura
		} else {
			this.radius = this.maxRadius + Math.sin(this.life) * 5; // Pulsazione
		}
	}

	draw(ctx) {
		if (!this.isActive) return;
		ctx.save();
		for (let i = 4; i > 0; i--) {
			const r = this.radius * (i / 4);
			ctx.beginPath();
			ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
			// Colori blu/azzurro con trasparenza variabile
			ctx.strokeStyle = `rgba(139, 233, 253, ${0.2 * i})`; // Azzurro (Dracula Cyan)
			ctx.lineWidth = 3;
			ctx.stroke();
		}
		ctx.restore();
	}
}

class MenuDonkey {
	constructor(canvas, sprite) {
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		this.sprite = sprite;
		this.sw = 32;
		this.sh = 32;
		this.dw = 60;
		this.dh = 60;
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

		// ✅ NUOVE PROPRIETÀ PER LA NUVOLETTA (TASK 1.2)
		this.speechBubble = document.getElementById('donkey-speech-bubble');
		this.speechTimer = 0;
		this.eatenStringsCount = 0;

		// ✅ NUOVE PROPRIETÀ PER L'ANIMAZIONE DI USCITA (TASK 2.3)
		this.alpha = 1;
		this.exitResolver = null; // Funzione per risolvere la Promise dell'uscita
		// ✅ FIX: Flag per controllare la fase di "risucchio" nel portale
		this.isBeingSuckedIn = false;
	}

	// ✅ NUOVO METODO PER FAR "PARLARE" L'ASINO (TASK 1.2)
	say(text) {
		if (!this.speechBubble) return;
		this.speechBubble.textContent = text;
		this.speechBubble.classList.add('visible');
		this.speechTimer = 180; // Mostra per 3 secondi (60fps * 3)
	}

	draw() {
		if (!this.sprite || !this.sprite.complete || this.sprite.naturalWidth === 0) {
			this.ctx.fillStyle = '#FFF'; // Fallback se lo sprite non è pronto
			this.ctx.fillRect(this.x, this.y, this.dw, this.dh);
			return;
		}
		this.ctx.save();
		// ✅ GESTIONE OPACITÀ (TASK 2.3)
		this.ctx.globalAlpha = this.alpha;

		if (this.direction === -1) {
			this.ctx.scale(-1, 1);
			this.ctx.drawImage(
				this.sprite,
				this.frameIndex * this.sw,
				0,
				this.sw,
				this.sh,
				-this.x - this.dw,
				this.y,
				this.dw,
				this.dh
			);
		} else {
			this.ctx.drawImage(
				this.sprite,
				this.frameIndex * this.sw,
				0,
				this.sw,
				this.sh,
				this.x,
				this.y,
				this.dw,
				this.dh
			);
		}
		this.ctx.restore();
	}

	update(dt, portal) {
		// ✅ LOGICA PER LA NUVOLETTA (TASK 1.2)
		if (this.speechTimer > 0) {
			this.speechTimer--;
			if (this.speechBubble) {
				// Aggiorna posizione della nuvoletta per seguire l'asino
				const bubbleX = this.x + this.dw / 2;
				const bubbleY = this.y - 30; // Sopra la testa
				this.speechBubble.style.left = `${bubbleX}px`;
				this.speechBubble.style.top = `${bubbleY}px`;
				this.speechBubble.style.transform = 'translateX(-50%)'; // Centra orizzontalmente
			}
		} else {
			if (this.speechBubble) {
				this.speechBubble.classList.remove('visible');
			}
		}

		// Gestione degli stati con uno switch
		switch (this.state) {
			case 'exiting': // Mantenuto come fallback
				this.direction = 1;
				this.x += 8;
				break;

			// ✅ FIX: Logica corretta per lo stato di uscita (TASK 2.3)
			case 'entering_portal':
				this.direction = 1;
				this.dx = 300; // Velocità basata su dt

				// Se l'asino sta venendo risucchiato, applica l'effetto
				if (this.isBeingSuckedIn) {
					this.alpha -= 2 * dt; // Dissolvenza graduale
					this.dw *= 1 - 2 * dt; // Rimpicciolisci
					this.dh *= 1 - 2 * dt;
					this.y += 60 * dt; // Sposta verso il centro
				} else {
					// Altrimenti, continua a correre verso il portale
					this.x += this.dx * dt;
				}

				// Controlla se ha raggiunto il portale e non è già in fase di risucchio
				if (portal && !this.isBeingSuckedIn && this.x + this.dw / 2 >= portal.x) {
					this.isBeingSuckedIn = true; // Attiva la fase di risucchio
				}

				// Quando l'asino è completamente invisibile, risolvi la promise
				if (this.alpha <= 0) {
					this.alpha = 0;
					if (this.exitResolver) {
						this.exitResolver();
						this.exitResolver = null;
					}
				}
				break;

			case 'roaming':
				this.dx = 90; // Velocità basata su dt
				this.x += this.dx * this.direction * dt;
				if (this.x + this.dw > this.canvas.width || this.x < 0) {
					this.direction *= -1;
				}
				break;

			case 'targeting':
				this.dx = 150; // Velocità basata su dt
				if (this.target) {
					const targetCenter = this.target.x + this.target.width / 2;
					const selfCenter = this.x + this.dw / 2;
					if (Math.abs(targetCenter - selfCenter) < 15) {
						this._jump();
					} else {
						this.direction = targetCenter > selfCenter ? 1 : -1;
						this.x += this.dx * this.direction * dt;
					}
				} else {
					this.state = 'roaming';
				}
				break;
		}

		// Applica la gravità solo se non sta entrando nel portale
		if (this.state !== 'entering_portal') {
			this.dy += GRAVITY;
			this.y += this.dy;
			if (this.y >= this.groundY) {
				this.y = this.groundY;
				this.dy = 0;
				this.isJumping = false;
			}
		}

		// Animazione dello sprite
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
			'static', '...args', 'Promise', 'Array.map', 'Promise.all', 
			'JSON.stringify', 'fetch()', '<a>', '<div>', '<body>', 
			'CSS', 'HTML', 'JS', 'NaN', 'undefined', 'TypeError', 
			'SyntaxError', 'git commit', 'git push'
		];
		this.char = chars[Math.floor(Math.random() * chars.length)];
		const colors = ['#50fa7b', '#8be9fd', '#ff79c6', '#f1fa8c', '#ffb86c'];
		this.color = colors[Math.floor(Math.random() * colors.length)];

		this.glowColor = this.color;
		this.glowBlur = 10;
		this.glowAlpha = 0;
		this.glowDirection = 1;

		this.ctx.font = '22px "Source Code Pro", monospace';
		this.width = this.ctx.measureText(this.char).width;
		this.height = 22;
	}

	update(dt) {
		this.glowAlpha += 2 * dt * this.glowDirection;
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
	portal: null, animationFrameId: null, isRunning: false, particles: [],
	lastTime: 0,

	init(canvasId, playerSprite) {
		this.canvas = document.getElementById(canvasId); if (!this.canvas) return;
		this.ctx = this.canvas.getContext('2d'); this.ctx.imageSmoothingEnabled = false;
		this.donkey = new MenuDonkey(this.canvas, playerSprite);
		this.ground = new MenuGround(this.canvas);
		window.addEventListener('resize', () => this.resizeCanvas());
		this.resizeCanvas();
		this.spawnCharacter();
		this.start();
	},

	resizeCanvas() {
		this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight;
		this.ctx.imageSmoothingEnabled = false;
		if (this.ground) this.ground.resize();
		if (this.donkey) this.donkey.groundY = this.canvas.height * GROUND_LEVEL_PERCENT - this.donkey.dh;
	},

	spawnCharacter() {
		this.character = new MenuCharacter(this.canvas);
		this.donkey.setTarget(this.character);
	},

	start() {
		if (this.isRunning) return;
		this.isRunning = true;
		this.lastTime = performance.now();
		this.loop(this.lastTime);
	},

	stop() {
		this.isRunning = false;
		if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
		const bubble = document.getElementById('donkey-speech-bubble');
		if (bubble) bubble.classList.remove('visible');
	},

	loop(currentTime) {
		if (!this.isRunning) return;
		const deltaTime = (currentTime - this.lastTime) / 1000;
		this.lastTime = currentTime;

		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ground.draw();

		if (this.portal) {
			this.portal.update(deltaTime);
			this.portal.draw(this.ctx);
		}

		this.donkey.update(deltaTime, this.portal);
		this.donkey.draw();

		if (this.character) {
			this.character.update(deltaTime);
			this.character.draw();
			const donkeyRect = { x: this.donkey.x, y: this.donkey.y, width: this.donkey.dw, height: this.donkey.dh };
			const charRect = { x: this.character.x, y: this.character.y - this.character.height, width: this.character.width, height: this.character.height };

			if (donkeyRect.x < charRect.x + charRect.width && donkeyRect.x + donkeyRect.width > charRect.x && donkeyRect.y < charRect.y + charRect.height && donkeyRect.y + donkeyRect.height > charRect.y) {
				for (let i = 0; i < 20; i++) {
					this.particles.push(new Particle(this.character.x + this.character.width / 2, this.character.y - this.character.height / 2, this.character.color));
				}
				AudioManager.playSound('sfx_menu_eat', false, 0.6);

				this.donkey.eatenStringsCount++;
				if (this.donkey.eatenStringsCount >= 5) {
					const messages = ['Yum, data!', 'Delizioso!', 'sudo rm -rf', 'Mmm, bug...', 'Ne voglio ancora!', 'Gnam!'];
					this.donkey.say(messages[Math.floor(Math.random() * messages.length)]);
					this.donkey.eatenStringsCount = 0;
				}

				this.character = null;
				setTimeout(() => {
					this.donkey.target = null;
					this.donkey.state = 'roaming';
				}, 0);
				setTimeout(() => { if (this.isRunning) { this.spawnCharacter(); } }, 2000);
			}
		}

		this.ctx.save();
		for (let i = this.particles.length - 1; i >= 0; i--) {
			this.particles[i].update();
			this.particles[i].draw(this.ctx);
			if (this.particles[i].life <= 0) {
				this.particles.splice(i, 1);
			}
		}
		this.ctx.restore();

		this.animationFrameId = requestAnimationFrame((time) => this.loop(time));
	},

	startPortalExitAnimation() {
		return new Promise((resolve) => {
			const portalY = this.donkey.groundY + this.donkey.dh / 2;
			this.portal = new Portal(this.canvas.width - 120, portalY);
			this.donkey.state = 'entering_portal';
			this.donkey.exitResolver = resolve;
		});
	},
};