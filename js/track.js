// Track system for racing game

class Track {
    constructor() {
        this.path = [];
        this.checkpoints = [];
        this.width = 200;
        this.boundaryWidth = 50;
        this.generateTrack();
    }

    generateTrack() {
        // Generate a simple oval track
        const centerX = 0;
        const centerY = 0;
        const radiusX = 400;
        const radiusY = 300;
        const segments = 60;
        
        this.path = [];
        this.checkpoints = [];
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radiusX;
            const y = centerY + Math.sin(angle) * radiusY;
            this.path.push({ x, y });
            
            // Add checkpoints every quarter lap
            if (i % (segments / 4) === 0) {
                this.checkpoints.push({ x, y, angle });
            }
        }
        
        // Starting position
        this.startX = this.path[0].x;
        this.startY = this.path[0].y;
        this.startAngle = Math.atan2(
            this.path[1].y - this.path[0].y,
            this.path[1].x - this.path[0].x
        );
    }

    // Check if point is on track
    isOnTrack(x, y) {
        let minDist = Infinity;
        
        for (let i = 0; i < this.path.length; i++) {
            const p1 = this.path[i];
            const p2 = this.path[(i + 1) % this.path.length];
            
            const dist = this.distanceToSegment(x, y, p1.x, p1.y, p2.x, p2.y);
            minDist = Math.min(minDist, dist);
        }
        
        return minDist < this.width / 2;
    }

    // Distance from point to line segment
    distanceToSegment(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Check collision with track boundaries
    checkBoundaryCollision(car) {
        const corners = car.getCorners();
        
        for (const corner of corners) {
            if (!this.isOnTrack(corner.x, corner.y)) {
                return true;
            }
        }
        
        return false;
    }

    // Handle boundary collision
    handleBoundaryCollision(car) {
        if (this.checkBoundaryCollision(car)) {
            // Slow down and push back
            car.speed *= 0.3;
            
            // Find nearest point on track
            let minDist = Infinity;
            let nearestPoint = { x: car.x, y: car.y };
            
            for (let i = 0; i < this.path.length; i++) {
                const p1 = this.path[i];
                const p2 = this.path[(i + 1) % this.path.length];
                
                const dist = this.distanceToSegment(car.x, car.y, p1.x, p1.y, p2.x, p2.y);
                if (dist < minDist) {
                    minDist = dist;
                    const A = car.x - p1.x;
                    const B = car.y - p1.y;
                    const C = p2.x - p1.x;
                    const D = p2.y - p1.y;
                    const dot = A * C + B * D;
                    const lenSq = C * C + D * D;
                    const param = lenSq !== 0 ? dot / lenSq : -1;
                    
                    if (param >= 0 && param <= 1) {
                        nearestPoint = {
                            x: p1.x + param * C,
                            y: p1.y + param * D
                        };
                    } else if (param < 0) {
                        nearestPoint = p1;
                    } else {
                        nearestPoint = p2;
                    }
                }
            }
            
            // Push car back towards track
            const dx = nearestPoint.x - car.x;
            const dy = nearestPoint.y - car.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                car.x += (dx / dist) * 5;
                car.y += (dy / dist) * 5;
            }
            
            return true;
        }
        
        return false;
    }

    // Check if car passed checkpoint
    checkCheckpoint(car, lastCheckpoint) {
        const currentCheckpoint = this.getCurrentCheckpoint(car);
        
        if (currentCheckpoint !== lastCheckpoint) {
            // Check if moving forward (not backwards)
            const nextCheckpoint = (currentCheckpoint + 1) % this.checkpoints.length;
            const cp1 = this.checkpoints[currentCheckpoint];
            const cp2 = this.checkpoints[nextCheckpoint];
            
            const dx1 = cp2.x - cp1.x;
            const dy1 = cp2.y - cp1.y;
            const dx2 = car.x - cp1.x;
            const dy2 = car.y - cp1.y;
            
            const dot = dx1 * dx2 + dy1 * dy2;
            
            if (dot > 0) {
                return currentCheckpoint;
            }
        }
        
        return lastCheckpoint;
    }

    // Get current checkpoint index
    getCurrentCheckpoint(car) {
        let minDist = Infinity;
        let checkpointIndex = 0;
        
        for (let i = 0; i < this.checkpoints.length; i++) {
            const cp = this.checkpoints[i];
            const dist = Utils.distance(car.x, car.y, cp.x, cp.y);
            
            if (dist < minDist) {
                minDist = dist;
                checkpointIndex = i;
            }
        }
        
        return checkpointIndex;
    }

    render(ctx, cameraX, cameraY) {
        const screenWidth = ctx.canvas.width;
        const screenHeight = ctx.canvas.height;
        
        // Draw grass background
        ctx.fillStyle = '#0a5a0a';
        ctx.fillRect(0, 0, screenWidth, screenHeight);
        
        // Draw track
        ctx.save();
        ctx.translate(screenWidth / 2 - cameraX, screenHeight / 2 - cameraY);
        
        // Draw outer boundary
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = this.boundaryWidth;
        ctx.beginPath();
        for (let i = 0; i < this.path.length; i++) {
            const p = this.path[i];
            const nextP = this.path[(i + 1) % this.path.length];
            
            // Calculate perpendicular offset for wider track
            const dx = nextP.x - p.x;
            const dy = nextP.y - p.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const perpX = -dy / len;
            const perpY = dx / len;
            
            const offset = this.width / 2 + this.boundaryWidth / 2;
            const x1 = p.x + perpX * offset;
            const y1 = p.y + perpY * offset;
            
            if (i === 0) {
                ctx.moveTo(x1, y1);
            } else {
                ctx.lineTo(x1, y1);
            }
        }
        ctx.closePath();
        ctx.stroke();
        
        // Draw inner boundary
        ctx.beginPath();
        for (let i = 0; i < this.path.length; i++) {
            const p = this.path[i];
            const nextP = this.path[(i + 1) % this.path.length];
            
            const dx = nextP.x - p.x;
            const dy = nextP.y - p.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const perpX = -dy / len;
            const perpY = dx / len;
            
            const offset = this.width / 2 + this.boundaryWidth / 2;
            const x1 = p.x - perpX * offset;
            const y1 = p.y - perpY * offset;
            
            if (i === 0) {
                ctx.moveTo(x1, y1);
            } else {
                ctx.lineTo(x1, y1);
            }
        }
        ctx.closePath();
        ctx.stroke();
        
        // Draw road surface
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        for (let i = 0; i < this.path.length; i++) {
            const p = this.path[i];
            const nextP = this.path[(i + 1) % this.path.length];
            
            const dx = nextP.x - p.x;
            const dy = nextP.y - p.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const perpX = -dy / len;
            const perpY = dx / len;
            
            const offset = this.width / 2;
            const x1 = p.x + perpX * offset;
            const y1 = p.y + perpY * offset;
            const x2 = p.x - perpX * offset;
            const y2 = p.y - perpY * offset;
            
            if (i === 0) {
                ctx.moveTo(x1, y1);
            } else {
                ctx.lineTo(x1, y1);
            }
        }
        
        // Close inner edge
        for (let i = this.path.length - 1; i >= 0; i--) {
            const p = this.path[i];
            const nextP = this.path[(i + 1) % this.path.length];
            
            const dx = nextP.x - p.x;
            const dy = nextP.y - p.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const perpX = -dy / len;
            const perpY = dx / len;
            
            const offset = this.width / 2;
            const x2 = p.x - perpX * offset;
            const y2 = p.y - perpY * offset;
            
            ctx.lineTo(x2, y2);
        }
        
        ctx.closePath();
        ctx.fill();
        
        // Draw center line
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 20]);
        ctx.beginPath();
        for (let i = 0; i < this.path.length; i++) {
            const p = this.path[i];
            if (i === 0) {
                ctx.moveTo(p.x, p.y);
            } else {
                ctx.lineTo(p.x, p.y);
            }
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw checkpoints
        ctx.fillStyle = '#00ff00';
        for (const cp of this.checkpoints) {
            ctx.beginPath();
            ctx.arc(cp.x, cp.y, 10, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}
