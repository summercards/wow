WoW.Content.Mage = class extends WoW.Entities.Unit {
    constructor(x, y) {
        super(x, y, 32, 32, '#3498db'); 
        this.name = "法师"; 
        
        // Set base attributes for Mage
        this.baseStr = 5;  // 法师力量低
        this.baseAgi = 10; // 法师敏捷一般
        this.baseSta = 15; // 法师耐力较低
        this.baseInt = 25; // 法师拥有高智力
        this.baseSpirit = 15; // 法师拥有较高的精神用于回蓝

        // Set resource type and base max for mana
        this.resourceType = 'mana';
        this.baseMaxResource = 1000; // 基础法力值，会随智力增长
        this.resource = this.baseMaxResource; // 法力开局为满
        this.manaRegenPerSecond = 10; // 基础法力回复速度

        this.speed = 180;
        
        this.skills = {
            1: { 
                id: 1, 
                name: '火球术', 
                castType: 'target',
                cost: 150, 
                rangeMin: 0, 
                rangeMax: 400, 
                cd: 2.5, 
                currentCd: 0, 
                color: '#e67e22' 
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

        if (this.target && !this.target.isDead) {
            const dist = WoW.Core.Utils.getCenterDistance(this, this.target);
            
            if (dist > 350) {
                const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                this.x += Math.cos(angle) * this.speed * dt;
                this.y += Math.sin(angle) * this.speed * dt;
            } else if (dist < 200) {
                const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                this.x -= Math.cos(angle) * this.speed * dt;
                this.y -= Math.sin(angle) * this.speed * dt;
            }

            if (this.skills[1].currentCd <= 0 && dist <= 400 && this.resource >= this.skills[1].cost) {
                WoW.State.SkillSystem.cast(this, 1, this.target);
            }
        }
        
        for (let k in this.skills) {
            if (this.skills[k].currentCd > 0) this.skills[k].currentCd -= dt;
        }
    }
};