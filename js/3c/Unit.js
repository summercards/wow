// Base Unit Class
WoW.Entities.Unit = class {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        
        this.name = "Unit";
        this.maxHp = 100;
        this.hp = 100;
        this.speed = 200;
        
        this.target = null;
        this.buffs = [];
        this.isDead = false;
        
        // Auto Attack
        this.swingTimer = 0;
        this.swingSpeed = 2.0;
        this.attackRange = 60;
        this.minDmg = 10;
        this.maxDmg = 20;
    }

    update(dt) {
        if (this.isDead) return;

        // Buffs
        this.buffs = this.buffs.filter(b => {
            b.duration -= dt;
            return b.duration > 0;
        });

        // Swing Timer
        if (this.swingTimer > 0) this.swingTimer -= dt;

        // Auto Attack Logic
        if (this.target && !this.target.isDead) {
            const dist = WoW.Core.Utils.getCenterDistance(this, this.target);
            // Default range for melee is small, ranged will override
            const range = this.name === "法师" || this.name === "牧师" ? 400 : 80;
            
            if (dist <= range && this.swingTimer <= 0) {
                // Healers shouldn't auto attack allies
                if (this.name === "牧师" && this.target.name !== "训练假人") return;
                
                this.performAutoAttack(this.target);
            }
        }
    }

    performAutoAttack(target) {
        this.swingTimer = this.swingSpeed;
        if(WoW.State.BattleSystem) {
            WoW.State.BattleSystem.dealDamage(this, target, 1.0);
        }
    }

    hasBuff(name) {
        return this.buffs.some(b => b.name === name);
    }
    
    addBuff(buff) {
        const existing = this.buffs.find(b => b.name === buff.name);
        if (existing) {
            existing.duration = buff.duration;
        } else {
            this.buffs.push(buff);
        }
    }
};