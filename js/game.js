// Core game engine

const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    HIGH_SCORES: 'high_scores',
    INSTRUCTIONS: 'instructions'
};

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.state = GameState.MENU;
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Game objects
        this.track = null;
        this.playerCar = null;
        this.aiCars = [];
        this.powerUpManager = null;
        
        // Input
        this.keys = {};
        this.setupInput();
        
        // Game state
        this.score = 0;
        this.lap = 1;
        this.maxLaps = 3;
        this.currentCheckpoint = 0;
        this.hasPassedStartLine = false;
        this.raceTime = 0;
        this.startTime = 0;
        this.playerPowerUp = null;
        this.playerPowerUpTimer = 0;
        
        // Camera
        this.cameraX = 0;
        this.cameraY = 0;
        
        // Audio
        this.audioManager = new AudioManager();
        this.engineSound = null;
        
        // Game loop
        this.lastTime = 0;
        this.running = false;
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Handle special keys
            if (e.key === 'Escape') {
                if (this.state === GameState.PLAYING) {
                    this.state = GameState.PAUSED;
                } else if (this.state === GameState.PAUSED) {
                    this.state = GameState.PLAYING;
                }
            }
            
            if (e.key === ' ' && this.state === GameState.PLAYING) {
                e.preventDefault();
                this.usePowerUp();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    start() {
        // Initialize track
        this.track = new Track();
        
        // Create player car
        this.playerCar = new Car(this.track.startX, this.track.startY, true);
        this.playerCar.angle = this.track.startAngle;
        
        // Create AI cars
        this.aiCars = [];
        const numAICars = 3;
        for (let i = 0; i < numAICars; i++) {
            const offsetAngle = (i + 1) * (Math.PI * 2 / (numAICars + 1));
            const aiCar = new Car(
                this.track.startX + Math.cos(offsetAngle) * 50,
                this.track.startY + Math.sin(offsetAngle) * 50,
                false
            );
            aiCar.angle = this.track.startAngle;
            aiCar.aiPathIndex = Math.floor(this.track.path.length * (i / numAICars));
            this.aiCars.push(aiCar);
        }
        
        // Initialize power-up manager
        this.powerUpManager = new PowerUpManager(this.track);
        
        // Reset game state
        this.score = 0;
        this.lap = 1;
        this.currentCheckpoint = 0;
        this.hasPassedStartLine = false;
        this.raceTime = 0;
        this.startTime = Date.now();
        this.playerPowerUp = null;
        this.playerPowerUpTimer = 0;
        
        // Start engine sound
        this.engineSound = this.audioManager.createEngineSound();
        
        // Start game loop
        this.state = GameState.PLAYING;
        this.running = true;
        this.lastTime = Date.now();
        this.gameLoop();
        
        // Play countdown
        this.playCountdown();
    }

    playCountdown() {
        setTimeout(() => this.audioManager.playCountdown(), 500);
        setTimeout(() => this.audioManager.playCountdown(), 1500);
        setTimeout(() => {
            this.audioManager.playRaceStart();
            this.startTime = Date.now();
        }, 2500);
    }

    usePowerUp() {
        if (this.playerPowerUp && this.playerPowerUpTimer > 0) {
            switch (this.playerPowerUp) {
                case 'nitro':
                    this.playerCar.speed = Math.min(this.playerCar.speed + 100, this.playerCar.maxSpeed);
                    break;
                case 'slowMotion':
                    // Slow down all AI cars
                    for (const aiCar of this.aiCars) {
                        aiCar.applyPowerUp('slowMotion', 3);
                    }
                    break;
            }
            this.playerPowerUp = null;
            this.playerPowerUpTimer = 0;
        }
    }

    update(deltaTime) {
        if (this.state !== GameState.PLAYING) return;
        
        const dt = deltaTime / 1000;
        
        // Update race time
        this.raceTime = (Date.now() - this.startTime) / 1000;
        
        // Update player car
        this.playerCar.update(deltaTime, this.keys, this.track);
        
        // Update AI cars
        for (const aiCar of this.aiCars) {
            aiCar.update(deltaTime, {}, this.track);
        }
        
        // Check track boundary collisions
        this.track.handleBoundaryCollision(this.playerCar);
        for (const aiCar of this.aiCars) {
            this.track.handleBoundaryCollision(aiCar);
        }
        
        // Check car-to-car collisions
        for (let i = 0; i < this.aiCars.length; i++) {
            if (this.playerCar.checkCollision(this.aiCars[i])) {
                this.playerCar.handleCollision(this.aiCars[i]);
                this.audioManager.playCollision();
            }
            
            for (let j = i + 1; j < this.aiCars.length; j++) {
                if (this.aiCars[i].checkCollision(this.aiCars[j])) {
                    this.aiCars[i].handleCollision(this.aiCars[j]);
                }
            }
        }
        
        // Check power-up collection
        const collectedPowerUp = this.powerUpManager.checkCollection(this.playerCar);
        if (collectedPowerUp) {
            this.audioManager.playPowerUp();
            this.playerPowerUp = collectedPowerUp;
            this.playerPowerUpTimer = 5;
            this.playerCar.applyPowerUp(collectedPowerUp, 5);
            this.score += 100;
        }
        
        // Update power-up timer
        if (this.playerPowerUpTimer > 0) {
            this.playerPowerUpTimer -= dt;
            if (this.playerPowerUpTimer <= 0) {
                this.playerPowerUp = null;
            }
        }
        
        // Update power-up manager
        this.powerUpManager.update(deltaTime);
        
        // Check checkpoint
        const newCheckpoint = this.track.checkCheckpoint(this.playerCar, this.currentCheckpoint);
        if (newCheckpoint !== this.currentCheckpoint) {
            // Mark that we've passed the start line at least once
            if (newCheckpoint === 0) {
                this.hasPassedStartLine = true;
            }
            
            this.currentCheckpoint = newCheckpoint;
            
            // Check if lap completed (only if we've passed start line before)
            if (this.currentCheckpoint === 0 && this.hasPassedStartLine) {
                if (this.lap < this.maxLaps) {
                    this.lap++;
                    this.audioManager.playLapComplete();
                    this.score += 500;
                } else if (this.lap === this.maxLaps) {
                    // Race finished
                    this.finishRace();
                }
            }
        }
        
        // Update score based on position
        this.updateScore();
        
        // Update camera to follow player
        this.cameraX = this.playerCar.x;
        this.cameraY = this.playerCar.y;
        
        // Update engine sound
        if (this.engineSound) {
            this.engineSound.setSpeed(Math.abs(this.playerCar.speed));
        }
    }

    updateScore() {
        // Score for speed
        this.score += Math.floor(Math.abs(this.playerCar.speed) * 0.1);
        
        // Score for position (overtaking)
        const playerPosition = this.getPlayerPosition();
        const positionBonus = (this.aiCars.length + 2 - playerPosition) * 10;
        this.score += positionBonus;
    }

    getPlayerPosition() {
        let position = 1;
        const playerCheckpoint = this.track.getCurrentCheckpoint(this.playerCar);
        const playerProgress = this.lap * 1000 + playerCheckpoint * 100 + 
                              Utils.distance(this.playerCar.x, this.playerCar.y, 
                                           this.track.checkpoints[playerCheckpoint].x,
                                           this.track.checkpoints[playerCheckpoint].y);
        
        for (const aiCar of this.aiCars) {
            const aiCheckpoint = this.track.getCurrentCheckpoint(aiCar);
            const aiProgress = this.lap * 1000 + aiCheckpoint * 100 +
                              Utils.distance(aiCar.x, aiCar.y,
                                           this.track.checkpoints[aiCheckpoint].x,
                                           this.track.checkpoints[aiCheckpoint].y);
            
            if (aiProgress > playerProgress) {
                position++;
            }
        }
        
        return position;
    }

    finishRace() {
        this.state = GameState.GAME_OVER;
        
        if (this.engineSound) {
            this.engineSound.stop();
        }
        
        // Calculate final score
        const timeBonus = Math.max(0, 10000 - Math.floor(this.raceTime * 10));
        const positionBonus = (this.aiCars.length + 2 - this.getPlayerPosition()) * 500;
        this.score += timeBonus + positionBonus;
        
        // Save high score
        UI.saveHighScore(this.score, this.raceTime, this.getPlayerPosition());
        
        // Update UI
        UI.showGameOver(this.score, this.raceTime, this.getPlayerPosition());
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.state === GameState.PLAYING || this.state === GameState.PAUSED) {
            // Render track
            if (this.track) {
                this.track.render(this.ctx, this.cameraX, this.cameraY);
            }
            
            // Render power-ups
            if (this.powerUpManager) {
                this.powerUpManager.render(this.ctx, this.cameraX, this.cameraY);
            }
            
            // Render AI cars
            for (const aiCar of this.aiCars) {
                aiCar.render(this.ctx, this.cameraX, this.cameraY);
            }
            
            // Render player car (on top)
            if (this.playerCar) {
                this.playerCar.render(this.ctx, this.cameraX, this.cameraY);
            }
            
            // Update HUD
            if (this.playerCar) {
                UI.updateHUD(
                    Math.floor(Math.abs(this.playerCar.speed)),
                    this.lap,
                    this.maxLaps,
                    this.getPlayerPosition(),
                    this.raceTime,
                    this.score,
                    this.playerPowerUp !== null
                );
            }
        }
    }

    gameLoop() {
        if (!this.running) return;
        
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    stop() {
        this.running = false;
        if (this.engineSound) {
            this.engineSound.stop();
        }
    }
}
