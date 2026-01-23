WoW.Content.Mage = class extends WoW.Entities.Unit {
    constructor(x, y) {
        super(x, y, 32, 32, '#3498db'); 
        this.name = "法师"; 
        this.maxHp = 800;
        this.hp = 800;
        
        this.resourceType = 'mana';
        this.maxResource = 2000;
        this.resource = 2000; // Explicitly full at start
        this.manaRegen = 10; 

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
    }

    update(dt) {
        super.update(dt);
        
        // Mana Regen
        if (this.resource < this.maxResource) {
            this.resource += this.manaRegen * dt;
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

            // Using VFX System logic now, so we just call cast
            if (this.skills[1].currentCd <= 0 && dist <= 400 && this.resource >= this.skills[1].cost) {
                WoW.State.SkillSystem.cast(this, 1, this.target);
            }
        }
        
        for (let k in this.skills) {
            if (this.skills[k].currentCd > 0) this.skills[k].currentCd -= dt;
        }
    }
};