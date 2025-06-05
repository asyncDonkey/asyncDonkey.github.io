// js/animation.js - (MODIFIED)

export class SpriteAnimation {
    constructor(spritesheet, frameWidth, frameHeight, numFrames, animationSpeed = 0.1) {
        this.spritesheet = spritesheet;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.numFrames = numFrames;
        this.animationSpeed = animationSpeed;
        this.currentFrameIndex = 0;
        this.elapsedTime = 0;
        if (numFrames <= 0) {
            console.warn('Animazione creata con 0 o meno frame!', spritesheet ? spritesheet.src : 'Spritesheet nullo');
        }
    }

    update(deltaTime) {
        if (this.numFrames <= 1) return; // Non animare se c'è solo un frame o nessuno
        this.elapsedTime += deltaTime;
        if (this.elapsedTime >= this.animationSpeed) {
            this.elapsedTime -= this.animationSpeed;
            this.currentFrameIndex = (this.currentFrameIndex + 1) % this.numFrames;
        }
    }

    getFrame() {
        const sx = this.currentFrameIndex * this.frameWidth;
        const sy = 0; // Assumendo spritesheet a singola riga
        return { sx, sy, sWidth: this.frameWidth, sHeight: this.frameHeight };
    }

    reset() {
        this.currentFrameIndex = 0;
        this.elapsedTime = 0;
    }
}
