WoW.Content.Priest = class extends WoW.Entities.Unit {
    constructor(x, y) {
        super(x, y, 32, 32, '#ffffff'); 
        this.name = "牧师"; 
        
        // Set base attributes for Priest
        this.baseStr = 5;  // 牧师力量低
        this.baseAgi = 10; // 牧师敏捷一般
        this.baseSta = 15; // 牧师耐力较低
        this.baseInt = 20; // 牧师智力高
        this.baseSpirit = 25; // 牧师拥有最高的精神用于回蓝

        // Set resource type and base max for mana
        this.resourceType = 'mana';
        this.baseMaxResource = 1200; // 基础法力值，会随智力增长
        this.resource = this.baseMaxResource; // 法力开局为满
        this.manaRegenPerSecond = 15; // 基础法力回复速度

        this.speed = 180;
        
        this.skills = {
            1: { 
                id: 1, 
                name: '治疗术', 
                castType: 'target',
                cost: 200, 
                rangeMin: 0, 
                rangeMax: 500, 
                cd: 3, 
                currentCd: 0, 
                color: '#f1c40f',
                isHeal: true,
                value: 150
            },
            2: { 
                id: 2, 
                name: '惩击', 
                castType: 'target',
                cost: 80, 
                rangeMin: 0, 
                rangeMax: 400, 
                cd: 2, 
                currentCd: 0, 
                color: '#f39c12',
                value: 80
            }
        };

        // Recalculate stats after all base properties are set
        this.recalcStats();
    }

    update(dt) {
        super.update(dt);

        // Mana Regen, scales with Spirit
        if (this.resource < this.maxResource) {
            // 1 Spirit = 0.5 mana regen per second
            const totalManaRegen = this.manaRegenPerSecond + (this.currentSpirit * 0.5);
            this.resource += totalManaRegen * dt;
            if (this.resource > this.maxResource) this.resource = this.maxResource;
        }
        
        const party = WoW.State.Party || [];
        
        let healTarget = null;
        let lowestPct = 1.0;
        
        party.forEach(member => {
            const pct = member.hp / member.maxHp;
            if (pct < 0.7 && pct < lowestPct) {
                lowestPct = pct;
                healTarget = member;
            }
        });

        if (healTarget && this.skills[1].currentCd <= 0 && this.resource >= this.skills[1].cost) {
             const dist = WoW.Core.Utils.getCenterDistance(this, healTarget);
             if (dist <= 500) {
                 WoW.State.SkillSystem.cast(this, 1, healTarget);
             } else {
                 const angle = Math.atan2(healTarget.y - this.y, healTarget.x - this.x);
                 this.x += Math.cos(angle) * this.speed * dt;
                 this.y += Math.sin(angle) * this.speed * dt;
             }
        } else if (this.target && !this.target.isDead) {
            const dist = WoW.Core.Utils.getCenterDistance(this, this.target);
            if (dist <= 400 && this.skills[2].currentCd <= 0 && this.resource >= this.skills[2].cost) {
                WoW.State.SkillSystem.cast(this, 2, this.target);
            }
            
            if (dist > 300) {
                 const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                 this.x += Math.cos(angle) * this.speed * dt;
                 this.y += Math.sin(angle) * this.speed * dt;
            }
        }

        for (let k in this.skills) {
            if (this.skills[k].currentCd > 0) this.skills[k].currentCd -= dt;
        }
    }
};