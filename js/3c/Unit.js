// Base Unit Class
WoW.Entities.Unit = class {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        
        this.name = "Unit";
        
        // Base Attributes (New WoW-like stats, set by derived classes)
        this.baseStr = 0;
        this.baseAgi = 0;
        this.baseSta = 0;
        this.baseInt = 0;
        this.baseSpirit = 0;

        // Base values for HP, Resource, Damage (before stats/gear)
        this.baseMaxHp = 100;
        this.baseMaxResource = 100;
        this.baseMinDmg = 5;
        this.baseMaxDmg = 10;
        
        // Calculated Stats (these will change based on gear and base stats)
        this.maxHp = this.baseMaxHp;
        this.hp = this.maxHp;
        this.maxResource = this.baseMaxResource;
        this.resource = this.maxResource; 
        this.minDmg = this.baseMinDmg;
        this.maxDmg = this.baseMaxDmg;

        // Current total attributes (Base + Gear)
        this.currentStr = 0;
        this.currentAgi = 0;
        this.currentSta = 0;
        this.currentInt = 0;
        this.currentSpirit = 0;
        
        this.speed = 200;
        
        this.target = null;
        this.buffs = [];
        this.isDead = false;
        
        // Inventory & Equipment (Expanded WoW-like slots)
        this.inventory = new Array(16).fill(null); // 16 slot bag
        this.equipment = {
            [WoW.Core.Constants.SLOTS.HEAD]: null,
            [WoW.Core.Constants.SLOTS.SHOULDER]: null,
            [WoW.Core.Constants.SLOTS.CHEST]: null,
            [WoW.Core.Constants.SLOTS.WRIST]: null,
            [WoW.Core.Constants.SLOTS.HANDS]: null,
            [WoW.Core.Constants.SLOTS.WAIST]: null,
            [WoW.Core.Constants.SLOTS.LEGS]: null,
            [WoW.Core.Constants.SLOTS.FEET]: null,
            [WoW.Core.Constants.SLOTS.NECK]: null,
            [WoW.Core.Constants.SLOTS.FINGER1]: null,
            [WoW.Core.Constants.SLOTS.FINGER2]: null,
            [WoW.Core.Constants.SLOTS.TRINKET1]: null,
            [WoW.Core.Constants.SLOTS.TRINKET2]: null,
            [WoW.Core.Constants.SLOTS.MAIN_HAND]: null,
            [WoW.Core.Constants.SLOTS.OFF_HAND]: null,
            [WoW.Core.Constants.SLOTS.RANGED]: null,
        };
        
        // Auto Attack
        this.swingTimer = 0;
        this.swingSpeed = 2.0;
        this.attackRange = 60; // Melee range

        // recalcStats will be called by derived class constructors after setting base stats
    }

    // Detailed Stat Recalculation (WoW-like logic)
    recalcStats() {
        // Preserve current HP/Resource percentages before stat changes
        const hpPct = this.maxHp > 0 ? this.hp / this.maxHp : 1;
        const resPct = this.maxResource > 0 ? this.resource / this.maxResource : 1;

        // 1. Reset current total attributes to base values
        this.currentStr = this.baseStr;
        this.currentAgi = this.baseAgi;
        this.currentSta = this.baseSta;
        this.currentInt = this.baseInt;
        this.currentSpirit = this.baseSpirit;

        let totalItemMinDmgBonus = 0;
        let totalItemMaxDmgBonus = 0;

        // 2. Sum up stats from all equipped items
        for (const slotName in this.equipment) {
            const item = this.equipment[slotName];
            if (item && item.stats) {
                if (item.stats.str) this.currentStr += item.stats.str;
                if (item.stats.agi) this.currentAgi += item.stats.agi;
                if (item.stats.sta) this.currentSta += item.stats.sta;
                if (item.stats.int) this.currentInt += item.stats.int;
                if (item.stats.spirit) this.currentSpirit += item.stats.spirit;
                
                // Items might have direct damage bonuses (e.g., trinkets)
                if (item.stats.minDmg) totalItemMinDmgBonus += item.stats.minDmg;
                if (item.stats.maxDmg) totalItemMaxDmgBonus += item.stats.maxDmg;
            }
        }

        // 3. Apply primary attribute conversions to core combat stats

        // Max HP: 1 Stamina = 10 HP
        this.maxHp = this.baseMaxHp + (this.currentSta * 10);
        this.hp = this.maxHp * hpPct; // Restore HP percentage

        // Max Resource: 
        if (this.resourceType === 'mana') { // 1 Intellect = 15 Mana
            this.maxResource = this.baseMaxResource + (this.currentInt * 15);
            this.resource = this.maxResource * resPct; // Restore resource percentage
        } else if (this.resourceType === 'rage') {
            // Rage max is typically fixed at 100, not scaled by stats in WoW
            this.maxResource = this.baseMaxResource; 
            this.resource = this.maxResource * resPct; // Restore resource percentage
        }

        // Min/Max Damage Calculation
        const mainHandWeapon = this.equipment[WoW.Core.Constants.SLOTS.MAIN_HAND];
        
        if (mainHandWeapon && mainHandWeapon.type === 'weapon') {
            // Weapon equipped: weapon base damage + attribute scaling
            this.minDmg = mainHandWeapon.stats.minDmg + totalItemMinDmgBonus;
            this.maxDmg = mainHandWeapon.stats.maxDmg + totalItemMaxDmgBonus;
            
            // Specific class scaling (e.g., Strength for Warriors)
            if (this.name === '战士') {
                this.minDmg += Math.floor(this.currentStr / 2); // 2 Str = 1 Dmg
                this.maxDmg += Math.floor(this.currentStr / 2);
            } else if (this.name === '法师' || this.name === '牧师') {
                this.minDmg += Math.floor(this.currentInt / 4); // Example: 4 Int = 1 Dmg for casters
                this.maxDmg += Math.floor(this.currentInt / 4);
            }

        } else {
            // No weapon (fists): base unarmed damage + attribute scaling
            this.minDmg = this.baseMinDmg + totalItemMinDmgBonus;
            this.maxDmg = this.baseMaxDmg + totalItemMaxDmgBonus;
            
            if (this.name === '战士') {
                this.minDmg += Math.floor(this.currentStr / 3); // Slightly less scaling unarmed
                this.maxDmg += Math.floor(this.currentStr / 3);
            } else if (this.name === '法师' || this.name === '牧师') {
                this.minDmg += Math.floor(this.currentInt / 5);
                this.maxDmg += Math.floor(this.currentInt / 5);
            }
        }
        
        // 4. Clamp current HP/Resource to new max values
        this.hp = WoW.Core.Utils.clamp(this.hp, 0, this.maxHp);
        this.resource = WoW.Core.Utils.clamp(this.resource, 0, this.maxResource);
    }

    update(dt) {
        if (this.isDead) return;

        this.buffs = this.buffs.filter(b => {
            b.duration -= dt;
            return b.duration > 0;
        });

        if (this.swingTimer > 0) this.swingTimer -= dt;

        if (this.target && !this.target.isDead) {
            const dist = WoW.Core.Utils.getCenterDistance(this, this.target);
            const range = this.name === "法师" || this.name === "牧师" ? 400 : 80;
            
            if (dist <= range && this.swingTimer <= 0) {
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
        if (this.isDead) return;

        const barWidth = this.width + 10; 
        const barHeight = 5;
        const barX = this.x - 5; 
        const barY = this.y - 15; 

        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const healthPct = this.hp / this.maxHp;
        let healthColor = '#2ecc71'; 
        if (healthPct < 0.6) healthColor = '#f1c40f'; 
        if (healthPct < 0.25) healthColor = '#e74c3c'; 

        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPct, barHeight);
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
};