WoW.Systems.VFXSystem = class {
    constructor(battleSystem) {
        this.battleSystem = battleSystem;
        this.projectiles = []; // {x, y, target, speed, color, onHit, type: 'homing'|'linear'}
        this.particles = [];   // {x, y, vx, vy, life, color, size}
    }

    // Spawn a projectile that travels to target and executes callback on hit
    spawnProjectile(source, target, color, speed, onHitCallback) {
        this.projectiles.push({
            x: source.x + source.width/2,
            y: source.y + source.height/2,
            target: target,
            color: color,
            speed: speed,
            onHit: onHitCallback,
            type: 'homing'
        });
    }

    // Spawn an instant beam effect (e.g., Heal, Smite)
    spawnBeam(source, target, color) {
        // Create a line of particles
        const sx = source.x + source.width/2;
        const sy = source.y + source.height/2;
        const tx = target.x + target.width/2;
        const ty = target.y + target.height/2;
        
        const dist = Math.sqrt((tx-sx)**2 + (ty-sy)**2);
        const steps = dist / 10;
        
        for(let i=0; i<steps; i++) {
            const ratio = i / steps;
            this.particles.push({
                x: sx + (tx-sx) * ratio,
                y: sy + (ty-sy) * ratio,
                vx: (Math.random()-0.5)*20,
                vy: (Math.random()-0.5)*20,
                life: 0.5, // seconds
                maxLife: 0.5,
                color: color,
                size: 2
            });
        }
    }

    // Spawn an explosion/impact effect
    spawnImpact(x, y, color) {
        for(let i=0; i<10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random()-0.5) * 100,
                vy: (Math.random()-0.5) * 100,
                life: 0.4,
                maxLife: 0.4,
                color: color,
                size: 3
            });
        }
    }

    // Spawn a larger explosion effect (e.g., Fire Blast)
    spawnExplosion(x, y, color) {
        for(let i=0; i<20; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random()-0.5) * 200,
                vy: (Math.random()-0.5) * 200,
                life: 0.5,
                maxLife: 0.5,
                color: color,
                size: 4
            });
        }
    }

    // Spawn a Nova effect (expanding ring)
    spawnNova(source, color, range) {
        const cx = source.x + source.width/2;
        const cy = source.y + source.height/2;
        const count = 36;
        for(let i=0; i<count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = range / 0.5; // Expand to range in 0.5s
            this.particles.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5,
                maxLife: 0.5,
                color: color,
                size: 3
            });
        }
    }

    spawnText(x, y, text, color) {
        // Delegate to BattleSystem for floating text as it's already there
        // Or we could move floating text here later. For now, keep as is.
        if (this.battleSystem) this.battleSystem.addCombatText(x, y, text, color);
    }

    update(dt) {
        // Update Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            
            if (p.target.isDead) {
                this.projectiles.splice(i, 1);
                continue;
            }

            const tx = p.target.x + p.target.width/2;
            const ty = p.target.y + p.target.height/2;
            
            const dx = tx - p.x;
            const dy = ty - p.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < 10) {
                // Hit!
                if (p.onHit) p.onHit();
                this.spawnImpact(tx, ty, p.color);
                this.projectiles.splice(i, 1);
            } else {
                // Move
                const moveDist = p.speed * dt;
                p.x += (dx / dist) * moveDist;
                p.y += (dy / dist) * moveDist;
                
                // Trail particle
                if (Math.random() < 0.3) {
                    this.particles.push({
                        x: p.x, 
                        y: p.y, 
                        vx: 0, vy: 0, 
                        life: 0.2, maxLife: 0.2, 
                        color: p.color, size: 2
                    });
                }
            }
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        // Draw Particles
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        ctx.globalAlpha = 1.0;

        // Draw Projectiles
        this.projectiles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
            ctx.fill();
        });
    }
};