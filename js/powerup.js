// Power-up system

class PowerUp {
    constructor(x, y, type = null) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.type = type || PowerUp.getRandomType();
        this.collected = false;
        this.animationTime = 0;
        
        this.colors = {
            speedBoost: '#00ff00',
            shield: '#00ffff',
            nitro: '#ff00ff',
            slowMotion: '#ffff00'
        };
        
        this.names = {
            speedBoost: 'Speed Boost',
            shield: 'Shield',
            nitro: 'Nitro',
            slowMotion: 'Slow Motion'
        };
    }

    static getRandomType() {
        const types = ['speedBoost', 'shield', 'nitro', 'slowMotion'];
        return types[Utils.randomInt(0, types.length - 1)];
    }

    update(deltaTime) {
        this.animationTime += deltaTime / 1000;
    }

    checkCollection(car) {
        if (this.collected) return false;
        
        const distance = Utils.distance(this.x, this.y, car.x, car.y);
        return distance < this.radius + car.width / 2;
    }

    collect() {
        this.collected = true;
    }

    render(ctx, cameraX, cameraY) {
        if (this.collected) return;
        
        const screenX = this.x - cameraX + ctx.canvas.width / 2;
        const screenY = this.y - cameraY + ctx.canvas.height / 2;
        
        // Pulsing animation
        const pulse = Math.sin(this.animationTime * 3) * 0.3 + 1;
        const radius = this.radius * pulse;
        
        // Draw glow
        const gradient = ctx.createRadialGradient(
            screenX, screenY, 0,
            screenX, screenY, radius * 2
        );
        gradient.addColorStop(0, this.colors[this.type]);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw power-up circle
        ctx.fillStyle = this.colors[this.type];
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw icon (simple shape based on type)
        ctx.fillStyle = '#000';
        ctx.save();
        ctx.translate(screenX, screenY);
        
        switch (this.type) {
            case 'speedBoost':
                // Arrow pointing up
                ctx.beginPath();
                ctx.moveTo(0, -radius * 0.6);
                ctx.lineTo(-radius * 0.4, radius * 0.2);
                ctx.lineTo(0, 0);
                ctx.lineTo(radius * 0.4, radius * 0.2);
                ctx.closePath();
                ctx.fill();
                break;
            case 'shield':
                // Shield shape
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.6, Math.PI, 0, false);
                ctx.lineTo(0, radius * 0.6);
                ctx.closePath();
                ctx.fill();
                break;
            case 'nitro':
                // Lightning bolt
                ctx.beginPath();
                ctx.moveTo(-radius * 0.3, -radius * 0.6);
                ctx.lineTo(radius * 0.2, 0);
                ctx.lineTo(-radius * 0.2, 0);
                ctx.lineTo(radius * 0.3, radius * 0.6);
                ctx.closePath();
                ctx.fill();
                break;
            case 'slowMotion':
                // Clock icon
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -radius * 0.3);
                ctx.moveTo(0, 0);
                ctx.lineTo(radius * 0.2, 0);
                ctx.stroke();
                break;
        }
        
        ctx.restore();
    }
}

class PowerUpManager {
    constructor(track) {
        this.track = track;
        this.powerUps = [];
        this.spawnTimer = 0;
        this.spawnInterval = 5; // Spawn every 5 seconds
        this.maxPowerUps = 5;
    }

    update(deltaTime) {
        const dt = deltaTime / 1000;
        
        // Update spawn timer
        this.spawnTimer += dt;
        
        // Spawn new power-up if needed
        if (this.spawnTimer >= this.spawnInterval && this.powerUps.length < this.maxPowerUps) {
            this.spawnPowerUp();
            this.spawnTimer = 0;
        }
        
        // Update existing power-ups
        for (const powerUp of this.powerUps) {
            powerUp.update(deltaTime);
        }
        
        // Remove collected power-ups
        this.powerUps = this.powerUps.filter(pu => !pu.collected);
    }

    spawnPowerUp() {
        if (!this.track || !this.track.path || this.track.path.length === 0) return;
        
        // Find a random position on the track
        const pathIndex = Utils.randomInt(0, this.track.path.length - 1);
        const pathPoint = this.track.path[pathIndex];
        const nextPoint = this.track.path[(pathIndex + 1) % this.track.path.length];
        
        // Interpolate along the path
        const t = Math.random();
        const x = Utils.lerp(pathPoint.x, nextPoint.x, t);
        const y = Utils.lerp(pathPoint.y, nextPoint.y, t);
        
        // Offset perpendicular to track
        const dx = nextPoint.x - pathPoint.x;
        const dy = nextPoint.y - pathPoint.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const perpX = -dy / len;
        const perpY = dx / len;
        
        // Random offset from center
        const offset = Utils.random(-this.track.width / 4, this.track.width / 4);
        
        const powerUp = new PowerUp(
            x + perpX * offset,
            y + perpY * offset
        );
        
        this.powerUps.push(powerUp);
    }

    checkCollection(car) {
        for (const powerUp of this.powerUps) {
            if (powerUp.checkCollection(car)) {
                powerUp.collect();
                return powerUp.type;
            }
        }
        return null;
    }

    render(ctx, cameraX, cameraY) {
        for (const powerUp of this.powerUps) {
            powerUp.render(ctx, cameraX, cameraY);
        }
    }

    clear() {
        this.powerUps = [];
        this.spawnTimer = 0;
    }
}
