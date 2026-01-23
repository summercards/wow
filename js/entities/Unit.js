import { Utils } from '../core/Utils.js';

export class Unit {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        
        // Stats
        this.maxHp = 1000;
        this.hp = this.maxHp;
        this.speed = 200;
        this.name = "Unit";
        
        // Combat State
        this.target = null;
        this.buffs = []; // { name, duration, effect... }
        this.isDead = false;
        
        // Auto Attack
        this.swingTimer = 0;
        this.swingSpeed = 2.0; // Seconds between attacks
        this.attackRange = 50;
        this.minDmg = 50;
        this.maxDmg = 70;
    }

    update(dt) {
        if (this.isDead) return;

        // Buffs
        this.buffs = this.buffs.filter(b => {
            b.duration -= dt;
            return b.duration > 0;
        });

        // Auto Attack Timer
        if (this.swingTimer > 0) {
            this.swingTimer -= dt;
        }

        // Auto Attack Logic (Simple)
        if (this.target && !this.target.isDead) {
            const dist = Utils.getDistance(this, this.target);
            if (dist <= this.attackRange && this.swingTimer <= 0) {
                this.performAutoAttack(this.target);
            }
        }
    }

    performAutoAttack(target) {
        this.swingTimer = this.swingSpeed;
        const dmg = Math.floor(this.minDmg + Math.random() * (this.maxDmg - this.minDmg));
        // Check for damage reduction buffs on target
        let finalDmg = dmg;
        if (target.hasBuff('Shield Wall')) {
            finalDmg = Math.floor(dmg * 0.25); // 75% reduction
        }
        
        target.takeDamage(finalDmg, this);
        this.onDealDamage(finalDmg, target);
    }

    takeDamage(amount, source) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
        // Visual text logic can be handled by Game event listener usually, but for now we might trigger it here
        this.onTakeDamage(amount, source);
    }

    die() {
        this.isDead = true;
    }

    hasBuff(name) {
        return this.buffs.some(b => b.name === name);
    }

    addBuff(buff) {
        const existing = this.buffs.find(b => b.name === buff.name);
        if (existing) {
            existing.duration = buff.duration; // Refresh
        } else {
            this.buffs.push(buff);
        }
    }

    // Hooks for subclasses
    onDealDamage(amount, target) {}
    onTakeDamage(amount, source) {}
}
