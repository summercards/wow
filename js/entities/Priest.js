WoW.Content.Priest = class extends WoW.Entities.Unit {
    constructor(x, y) {
        super(x, y, 32, 32, '#ffffff'); 
        this.name = "牧师"; 
        this.maxHp = 800;
        this.hp = 800;
        this.speed = 180;
        
        this.skills = {
            1: { 
                id: 1, 
                name: '治疗术', 
                castType: 'target',
                cost: 0, 
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
                cost: 0, 
                rangeMin: 0, 
                rangeMax: 400, 
                cd: 2, 
                currentCd: 0, 
                color: '#f39c12',
                value: 80
            }
        };
    }

    update(dt) {
        super.update(dt);
        
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

        if (healTarget && this.skills[1].currentCd <= 0) {
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
            if (dist <= 400 && this.skills[2].currentCd <= 0) {
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