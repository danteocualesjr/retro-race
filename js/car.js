// Car class for player and AI cars

class Car {
    constructor(x, y, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.speed = 0;
        this.maxSpeed = isPlayer ? 200 : 180;
        this.acceleration = 150;
        this.deceleration = 100;
        this.turnSpeed = 0.05;
        this.friction = 0.95;
        
        this.width = 20;
        this.height = 40;
        
        this.isPlayer = isPlayer;
        this.color = isPlayer ? '#00ff00' : '#ff0000';
        
        // Power-up effects
        this.powerUpActive = null;
        this.powerUpTimer = 0;
        
        // Collision
        this.collisionCooldown = 0;
        
        // AI specific
        this.targetAngle = 0;
        this.aiPathIndex = 0;
    }

    update(deltaTime, keys, track) {
        const dt = deltaTime / 1000; // Convert to seconds
        
        // Update power-up timer
        if (this.powerUpActive) {
            this.powerUpTimer -= dt;
            if (this.powerUpTimer <= 0) {
                this.powerUpActive = null;
            }
        }
        
        // Update collision cooldown
        if (this.collisionCooldown > 0) {
            this.collisionCooldown -= dt;
        }
        
        if (this.isPlayer) {
            this.updatePlayer(dt, keys);
        } else {
            this.updateAI(dt, track);
        }
        
        // Apply friction
        if (!this.isPlayer || (!keys['ArrowUp'] && !keys['w'] && !keys['W'])) {
            this.speed *= Math.pow(this.friction, dt * 60);
        }
        
        // Apply power-up effects
        if (this.powerUpActive === 'speedBoost') {
            this.maxSpeed = (this.isPlayer ? 200 : 180) * 1.5;
        } else {
            this.maxSpeed = this.isPlayer ? 200 : 180;
        }
        
        if (this.powerUpActive === 'slowMotion') {
            this.speed *= 0.7;
        }
        
        // Move car
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;
        
        // Clamp speed
        this.speed = Utils.clamp(this.speed, 0, this.maxSpeed);
    }

    updatePlayer(dt, keys) {
        // Acceleration
        if (keys['ArrowUp'] || keys['w'] || keys['W']) {
            this.speed += this.acceleration * dt;
        }
        
        // Braking/Reverse
        if (keys['ArrowDown'] || keys['s'] || keys['S']) {
            this.speed -= this.deceleration * dt;
        }
        
        // Turning (only when moving)
        if (Math.abs(this.speed) > 10) {
            const turnFactor = Math.abs(this.speed) / this.maxSpeed;
            if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
                this.angle -= this.turnSpeed * turnFactor;
            }
            if (keys['ArrowRight'] || keys['d'] || keys['D']) {
                this.angle += this.turnSpeed * turnFactor;
            }
        }
        
        // Normalize angle
        this.angle = Utils.normalizeAngle(this.angle);
    }

    updateAI(dt, track) {
        // Simple AI: follow the track path
        if (track && track.path && track.path.length > 0) {
            const path = track.path;
            const targetIndex = this.aiPathIndex % path.length;
            const target = path[targetIndex];
            
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Update target angle
            this.targetAngle = Math.atan2(dy, dx);
            
            // Adjust angle towards target
            let angleDiff = this.targetAngle - this.angle;
            
            // Normalize angle difference
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            // Turn towards target
            if (Math.abs(angleDiff) > 0.1) {
                if (angleDiff > 0) {
                    this.angle += this.turnSpeed * 0.8;
                } else {
                    this.angle -= this.turnSpeed * 0.8;
                }
            }
            
            // Accelerate
            if (distance > 50) {
                this.speed += this.acceleration * dt * 0.8;
            } else {
                // Move to next waypoint
                this.aiPathIndex = (this.aiPathIndex + 1) % path.length;
            }
            
            // Normalize angle
            this.angle = Utils.normalizeAngle(this.angle);
        } else {
            // Fallback: simple forward movement
            this.speed += this.acceleration * dt * 0.7;
        }
    }

    applyPowerUp(type, duration = 5) {
        this.powerUpActive = type;
        this.powerUpTimer = duration;
    }

    getCorners() {
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        const w2 = this.width / 2;
        const h2 = this.height / 2;
        
        return [
            {
                x: this.x + cos * h2 - sin * w2,
                y: this.y + sin * h2 + cos * w2
            },
            {
                x: this.x + cos * h2 + sin * w2,
                y: this.y + sin * h2 - cos * w2
            },
            {
                x: this.x - cos * h2 + sin * w2,
                y: this.y - sin * h2 - cos * w2
            },
            {
                x: this.x - cos * h2 - sin * w2,
                y: this.y - sin * h2 + cos * w2
            }
        ];
    }

    checkCollision(otherCar) {
        const corners1 = this.getCorners();
        const corners2 = otherCar.getCorners();
        
        // Simple AABB collision check (approximation)
        const minX1 = Math.min(...corners1.map(c => c.x));
        const maxX1 = Math.max(...corners1.map(c => c.x));
        const minY1 = Math.min(...corners1.map(c => c.y));
        const maxY1 = Math.max(...corners1.map(c => c.y));
        
        const minX2 = Math.min(...corners2.map(c => c.x));
        const maxX2 = Math.max(...corners2.map(c => c.x));
        const minY2 = Math.min(...corners2.map(c => c.y));
        const maxY2 = Math.max(...corners2.map(c => c.y));
        
        return !(maxX1 < minX2 || minX1 > maxX2 || maxY1 < minY2 || minY1 > maxY2);
    }

    handleCollision(otherCar) {
        if (this.collisionCooldown > 0 || otherCar.collisionCooldown > 0) {
            return;
        }
        
        // Bounce effect
        const dx = otherCar.x - this.x;
        const dy = otherCar.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const angle = Math.atan2(dy, dx);
            const force = 50;
            
            this.speed *= 0.5;
            otherCar.speed *= 0.5;
            
            this.x -= Math.cos(angle) * force * 0.1;
            this.y -= Math.sin(angle) * force * 0.1;
            otherCar.x += Math.cos(angle) * force * 0.1;
            otherCar.y += Math.sin(angle) * force * 0.1;
        }
        
        this.collisionCooldown = 0.5;
        otherCar.collisionCooldown = 0.5;
    }

    render(ctx, cameraX, cameraY) {
        const screenX = this.x - cameraX + ctx.canvas.width / 2;
        const screenY = this.y - cameraY + ctx.canvas.height / 2;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.angle);
        
        // Draw car body
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Draw car outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Draw direction indicator
        ctx.fillStyle = '#fff';
        ctx.fillRect(-this.width / 2 + 2, -this.height / 2 + 2, this.width - 4, 8);
        
        // Draw shield effect if active
        if (this.powerUpActive === 'shield') {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.height / 2 + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}
