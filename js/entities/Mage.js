WoW.Content.Mage = class extends WoW.Entities.Unit {
    constructor(x, y) {
        super(x, y, 32, 32, '#3498db'); 
        this.name = "法师"; 
        this.maxHp = 800;
        this.hp = 800;
        this.speed = 180;
        
        this.skills = {
            1: { 
                id: 1, 
                name: '火球术', 
                castType: 'target',
                cost: 0, 
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

            if (this.skills[1].currentCd <= 0 && dist <= 400) {
                WoW.State.SkillSystem.cast(this, 1, this.target);
            }
        }
        
        for (let k in this.skills) {
            if (this.skills[k].currentCd > 0) this.skills[k].currentCd -= dt;
        }
    }
};