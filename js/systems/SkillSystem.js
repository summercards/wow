WoW.Systems.SkillSystem = class {
    constructor(battleSystem, vfxSystem) {
        this.battleSystem = battleSystem;
        this.vfxSystem = vfxSystem;
    }

    cast(source, skillId, target) {
        const skill = source.skills[skillId];
        if (!skill) return;

        if (skill.currentCd > 0) return;

        // Resource Check
        if (source.resource !== undefined && source.resource < skill.cost) {
            let msg = "资源不足";
            let color = "#ffffff";
            if (source.resourceType === 'rage') { msg = "怒气不足"; color = "#ff0000"; }
            else if (source.resourceType === 'mana') { msg = "法力不足"; color = "#3498db"; }
            else if (source.resourceType === 'energy') { msg = "能量不足"; color = "#FFF569"; }
            else if (source.resourceType === 'focus') { msg = "集中值不足"; color = "#8F2A00"; }
            
            this.battleSystem.addCombatText(source.x, source.y - 40, msg, color);
            return;
        }

        // Range/Target Check
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

        // Execute Cost & CD
        skill.currentCd = skill.cd;
        if(source.resource !== undefined) source.resource -= skill.cost;

        // Dispatch with VFX
        // Warrior Skills
        if (source.name === '战士') {
            if (skill.id === 1) this.doCharge(source, target);
            if (skill.id === 2) this.doTaunt(source, target);
            if (skill.id === 3) this.doShieldWall(source);
        }
        // Mage Skills
        else if (source.name === '法师') {
            if (skill.id === 1) { // Fireball
                this.vfxSystem.spawnProjectile(source, target, '#e67e22', 400, () => {
                    this.battleSystem.dealDamage(source, target, 2.5);
                    this.battleSystem.addCombatText(target.x, target.y - 30, "火球术", '#e67e22');
                });
            }
        }
        // Priest Skills
        else if (source.name === '牧师') {
            if (skill.id === 1) { // Heal
                this.vfxSystem.spawnBeam(source, target, '#f1c40f'); // Yellow beam
                this.battleSystem.heal(source, target, skill.value);
            }
            if (skill.id === 2) { // Smite
                this.vfxSystem.spawnBeam(source, target, '#f39c12'); // Orange/Gold beam
                this.battleSystem.dealDamage(source, target, 1.2);
                this.battleSystem.addCombatText(target.x, target.y - 30, "惩击", '#f1c40f');
                this.vfxSystem.spawnImpact(target.x + target.width/2, target.y + target.height/2, '#f39c12');
            }
        }
        // Rogue Skills
        else if (source.name === '盗贼') {
            if (skill.id === 1) { // 影袭
                this.vfxSystem.spawnBeam(source, target, '#FFF569'); // 近战黄色特效
                this.battleSystem.dealDamage(source, target, 1.5);
                this.battleSystem.addCombatText(target.x, target.y - 30, "影袭", '#FFF569');
                this.vfxSystem.spawnImpact(target.x + target.width/2, target.y + target.height/2, '#FFF569');
            }
            if (skill.id === 2) { // 剔骨
                this.vfxSystem.spawnBeam(source, target, '#FFD700'); // 终结技金色特效
                this.battleSystem.dealDamage(source, target, 3.0);
                this.battleSystem.addCombatText(target.x, target.y - 30, "剔骨", '#FFD700');
                this.vfxSystem.spawnImpact(target.x + target.width/2, target.y + target.height/2, '#FFD700');
            }
            if (skill.id === 3) { // 疾跑
                source.addBuff({ name: '疾跑', duration: 10 }); 
                this.battleSystem.addCombatText(source.x, source.y - 50, "疾跑!", '#00FFFF');
                this.vfxSystem.spawnImpact(source.x + source.width/2, source.y + source.height/2, '#00FFFF');
            }
        }
        // Hunter Skills
        else if (source.name === '猎人') {
            if (skill.id === 1) { // 奥术射击
                this.vfxSystem.spawnProjectile(source, target, '#00CCFF', 500, () => {
                    this.battleSystem.dealDamage(source, target, 1.5);
                    this.battleSystem.addCombatText(target.x, target.y - 30, "奥术射击", '#00CCFF');
                });
            }
            if (skill.id === 2) { // 稳固射击
                if(source.addResource) source.addResource(skill.focusGain); // 回复集中值
                this.battleSystem.addCombatText(source.x, source.y - 30, `+${skill.focusGain} 集中`, '#AAAAAA');
                // 稳固射击通常有施法时间，这里简化为瞬发光束+投射物
                this.vfxSystem.spawnBeam(source, target, '#AAAAAA'); 
                this.vfxSystem.spawnProjectile(source, target, '#AAAAAA', 400, () => {
                     this.battleSystem.dealDamage(source, target, 1.0);
                });
            }
            if (skill.id === 3) { // 震荡射击
                this.vfxSystem.spawnProjectile(source, target, '#FFD700', 450, () => {
                    this.battleSystem.dealDamage(source, target, 0.5);
                    this.battleSystem.addCombatText(target.x, target.y - 30, "震荡射击", '#FFD700');
                });
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
        
        if(source.addResource) source.addResource(20);
        this.battleSystem.addCombatText(source.x, source.y - 30, "冲锋!", "#fff");
        this.vfxSystem.spawnImpact(source.x + source.width/2, source.y + source.height/2, '#fff');
        source.swingTimer = 0; 
    }

    doTaunt(source, target) {
        target.target = source;
        this.battleSystem.addCombatText(target.x, target.y - 40, "嘲讽!", "#ff0000");
        this.vfxSystem.spawnImpact(target.x + target.width/2, target.y, '#ff0000');
    }

    doShieldWall(source) {
        source.addBuff({ name: '盾墙', duration: 10 });
        this.battleSystem.addCombatText(source.x, source.y - 50, "盾墙!", "#fff");
        this.vfxSystem.spawnImpact(source.x + source.width/2, source.y + source.height/2, '#aaa');
    }
};