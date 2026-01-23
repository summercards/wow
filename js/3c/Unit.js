// Base Unit Class
WoW.Entities.Unit = class {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        
        this.name = "Unit";
        // Base Stats
        this.baseMaxHp = 100;
        this.baseMaxResource = 100;
        this.baseMinDmg = 5;
        this.baseMaxDmg = 10;
        
        // Calculated Stats
        this.maxHp = 100;
        this.hp = 100;
        this.maxResource = 100;
        this.resource = 100;
        this.minDmg = 5;
        this.maxDmg = 10;
        
        this.speed = 200;
        
        this.target = null;
        this.buffs = [];
        this.isDead = false;
        
        // Inventory & Equipment
        this.inventory = new Array(16).fill(null); // 16 slot bag
        this.equipment = {
            head: null,
            chest: null,
            main_hand: null
        };
        
        // Auto Attack
        this.swingTimer = 0;
        this.swingSpeed = 2.0;
        this.attackRange = 60;
    }

    recalcStats() {
        let str = 0;
        let sta = 0;
        let int = 0;
        let bonusMinDmg = 0;
        let bonusMaxDmg = 0;

        // Sum up stats from equipment
        for (let slot in this.equipment) {
            const item = this.equipment[slot];
            if (item && item.stats) {
                if (item.stats.str) str += item.stats.str;
                if (item.stats.sta) sta += item.stats.sta;
                if (item.stats.int) int += item.stats.int;
                if (item.stats.minDmg) bonusMinDmg += item.stats.minDmg;
                if (item.stats.maxDmg) bonusMaxDmg += item.stats.maxDmg;
            }
        }

        // Preserve Percentages
        const hpPct = this.maxHp > 0 ? this.hp / this.maxHp : 1;
        const resPct = this.maxResource > 0 ? this.resource / this.maxResource : 1;

        // Apply Stats
        // 1 Sta = 10 HP
        this.maxHp = this.baseMaxHp + (sta * 10);
        this.hp = this.maxHp * hpPct;
        
        // 1 Int = 15 Mana (if mana user)
        if (this.resourceType === 'mana') {
            this.maxResource = this.baseMaxResource + (int * 15);
            this.resource = this.maxResource * resPct;
        }

        // Damage
        if (this.equipment.main_hand) {
            this.minDmg = this.equipment.main_hand.stats.minDmg + Math.floor(str / 2);
            this.maxDmg = this.equipment.main_hand.stats.maxDmg + Math.floor(str / 2);
        } else {
            this.minDmg = this.baseMinDmg + Math.floor(str / 2);
            this.maxDmg = this.baseMaxDmg + Math.floor(str / 2);
        }
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

    drawHealthBar(ctx) {
        if (this.isDead) return; // Don't draw health bar for dead units

        const barWidth = this.width + 10; // Slightly wider than unit
        const barHeight = 5;
        const barX = this.x - 5; // Center the bar above unit
        const barY = this.y - 15; // Above the unit

        // Background bar
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health fill
        const healthPct = this.hp / this.maxHp;
        let healthColor = '#2ecc71'; // Green
        if (healthPct < 0.6) healthColor = '#f1c40f'; // Yellow
        if (healthPct < 0.25) healthColor = '#e74c3c'; // Red

        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPct, barHeight);
        
        // Border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
};