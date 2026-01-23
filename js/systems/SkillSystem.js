WoW.Systems.SkillSystem = class {
    constructor(battleSystem) {
        this.battleSystem = battleSystem;
    }

    cast(source, skillId, target) {
        const skill = source.skills[skillId];
        if (!skill) return;

        if (skill.currentCd > 0) return;

        // Unified Resource Check
        if (source.resource !== undefined && source.resource < skill.cost) {
            const msg = source.resourceType === 'rage' ? "怒气不足" : "法力不足";
            const color = source.resourceType === 'rage' ? "#ff0000" : "#3498db";
            this.battleSystem.addCombatText(source.x, source.y - 40, msg, color);
            return;
        }

        if (skill.castType === 'target') {
            if (!target) {
                this.battleSystem.addCombatText(source.x, source.y - 40, "无目标", "#aaa");
                return;
            }
            const dist = WoW.Core.Utils.getCenterDistance(source, target);
            
            if (skill.rangeMin > 0 && dist < skill.rangeMin) {
                this.battleSystem.addCombatText(source.x, source.y - 40, "太近了", "#aaa");
                return;
            }
            if (skill.rangeMax > 0 && dist > skill.rangeMax) {
                this.battleSystem.addCombatText(source.x, source.y - 40, "距离太远", "#aaa");
                return;
            }
        }

        // Execute
        skill.currentCd = skill.cd;
        
        // Unified Resource Deduct
        if(source.resource !== undefined) source.resource -= skill.cost;

        // Warrior Skills
        if (source.name === '战士') {
            if (skill.id === 1) this.doCharge(source, target);
            if (skill.id === 2) this.doTaunt(source, target);
            if (skill.id === 3) this.doShieldWall(source);
        }
        // Mage Skills
        else if (source.name === '法师') {
            if (skill.id === 1) { // Fireball
                this.battleSystem.dealDamage(source, target, 2.5);
                this.battleSystem.addCombatText(target.x, target.y - 30, "火球术", "#e67e22");
            }
        }
        // Priest Skills
        else if (source.name === '牧师') {
            if (skill.id === 1) { // Heal
                this.battleSystem.heal(source, target, skill.value);
            }
            if (skill.id === 2) { // Smite
                this.battleSystem.dealDamage(source, target, 1.2);
                this.battleSystem.addCombatText(target.x, target.y - 30, "惩击", "#f1c40f");
            }
        }
    }

    doCharge(source, target) {
        const cx1 = source.x + source.width / 2;
        const cy1 = source.y + source.height / 2;
        const cx2 = target.x + target.width / 2;
        const cy2 = target.y + target.height / 2;
        const dx = cx2 - cx1;
        const dy = cy2 - cy1;
        const len = Math.sqrt(dx*dx + dy*dy);
        const stopDist = 40; 
        const moveRatio = (len - stopDist) / len;

        source.x = source.x + dx * moveRatio;
        source.y = source.y + dy * moveRatio;
        
        // Check addResource existence
        if(source.addResource) source.addResource(20);
        this.battleSystem.addCombatText(source.x, source.y - 30, "冲锋!", "#fff");
        source.swingTimer = 0; 
    }

    doTaunt(source, target) {
        target.target = source;
        this.battleSystem.addCombatText(target.x, target.y - 40, "嘲讽!", "#ff0000");
    }

    doShieldWall(source) {
        source.addBuff({ name: '盾墙', duration: 10 });
        this.battleSystem.addCombatText(source.x, source.y - 50, "盾墙!", "#fff");
    }
};