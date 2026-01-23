WoW.Systems.SkillSystem = class {
    constructor(battleSystem) {
        this.battleSystem = battleSystem;
    }

    cast(source, skillId, target) {
        const skill = source.skills[skillId];
        if (!skill) return;

        // 1. Cooldown Check
        if (skill.currentCd > 0) return;

        // 2. Resource Check
        if (source.rage < skill.cost) {
            this.battleSystem.addCombatText(source.x, source.y - 40, "No Rage", "#ff0000");
            return;
        }

        // 3. Range Check
        if (skill.castType === 'target') {
            if (!target) {
                this.battleSystem.addCombatText(source.x, source.y - 40, "No Target", "#aaa");
                return;
            }

            // Use Center Distance for better feel
            const dist = WoW.Core.Utils.getCenterDistance(source, target);
            
            if (dist < skill.rangeMin) {
                this.battleSystem.addCombatText(source.x, source.y - 40, "Too Close", "#aaa");
                return;
            }
            if (dist > skill.rangeMax) {
                this.battleSystem.addCombatText(source.x, source.y - 40, "Out of Range", "#aaa");
                return;
            }
        }

        // Execute
        skill.currentCd = skill.cd;
        if(source.rage !== undefined) source.rage -= skill.cost;

        if (skill.id === 1) this.doCharge(source, target);
        if (skill.id === 2) this.doTaunt(source, target);
        if (skill.id === 3) this.doShieldWall(source);
    }

    doCharge(source, target) {
        // Calculate vector from source to target
        const cx1 = source.x + source.width / 2;
        const cy1 = source.y + source.height / 2;
        const cx2 = target.x + target.width / 2;
        const cy2 = target.y + target.height / 2;

        const dx = cx2 - cx1;
        const dy = cy2 - cy1;
        const len = Math.sqrt(dx*dx + dy*dy);

        // Move to 40px away from target center
        const stopDist = 40; 
        const moveRatio = (len - stopDist) / len;

        source.x = source.x + dx * moveRatio;
        source.y = source.y + dy * moveRatio;
        
        if(source.addRage) source.addRage(20);
        
        this.battleSystem.addCombatText(source.x, source.y - 30, "CHARGE!", "#fff");
        source.swingTimer = 0; 
    }

    doTaunt(source, target) {
        target.target = source;
        this.battleSystem.addCombatText(target.x, target.y - 40, "TAUNTED!", "#ff0000");
    }

    doShieldWall(source) {
        source.addBuff({ name: 'Shield Wall', duration: 10 });
        this.battleSystem.addCombatText(source.x, source.y - 50, "SHIELD WALL!", "#fff");
    }
};