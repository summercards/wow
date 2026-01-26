WoW.Systems.SkillSystem = class {
    constructor(battleSystem, vfxSystem) {
        this.battleSystem = battleSystem;
        this.vfxSystem = vfxSystem;
        // Store last error message time for each unit-skill combination
        this.lastErrorTimes = new Map(); // key: "unitId-skillId", value: timestamp
    }

    /**
     * Check if error message can be shown (has cooldown elapsed)
     * @param {WoW.Entities.Unit} unit The unit attempting the skill
     * @param {number} skillId The skill ID
     * @returns {boolean} True if error can be shown, false if on cooldown
     */
    canShowError(unit, skillId) {
        const key = `${unit.name}-${unit.id}-${skillId}`;
        const lastTime = this.lastErrorTimes.get(key) || 0;
        const now = Date.now();
        const cooldown = 500; // 500ms cooldown for error messages
        return now - lastTime >= cooldown;
    }

    /**
     * Record that an error message was shown
     * @param {WoW.Entities.Unit} unit The unit attempting the skill
     * @param {number} skillId The skill ID
     */
    recordError(unit, skillId) {
        const key = `${unit.name}-${unit.id}-${skillId}`;
        this.lastErrorTimes.set(key, Date.now());
    }

    cast(source, skillId, target) {
        console.log(`SkillSystem.cast called: Source=${source.name}, SkillId=${skillId}, Target=${target ? target.name : 'None'}`);
        const skill = source.skills[skillId];
        if (!skill) {
            console.error(`SkillSystem.cast: Skill ${skillId} not found for ${source.name}`);
            return;
        }
        console.log(`Skill details: Name=${skill.name}, currentCd=${skill.currentCd}, cost=${skill.cost}, targetType=${skill.targetType}`);

        if (skill.currentCd > 0) {
            if (this.canShowError(source, skillId)) {
                this.battleSystem.addCombatText(source.x, source.y - 40, "冷却中", "#aaa");
                this.recordError(source, skillId);
            }
            return;
        }

        // Resource Check
        if (source.resource !== undefined && source.resource < skill.cost) {
            if (this.canShowError(source, skillId)) {
                let msg = "资源不足";
                let color = "#ffffff";
                if (source.resourceType === 'rage') { msg = "怒气不足"; color = "#ff0000"; }
                else if (source.resourceType === 'mana') { msg = "法力不足"; color = "#3498db"; }
                else if (source.resourceType === 'energy') { msg = "能量不足"; color = "#FFF569"; }
                else if (source.resourceType === 'focus') { msg = "集中值不足"; color = "#8F2A00"; }

                this.battleSystem.addCombatText(source.x, source.y - 40, msg, color);
                this.recordError(source, skillId);
            }
            return;
        }

        // For self-cast skills, force target to be source
        if (skill.castType === 'self') {
            target = source;
        }

        // Range/Target Check
        if (skill.castType === 'target') {
            if (!target) {
                if (this.canShowError(source, skillId)) {
                    this.battleSystem.addCombatText(source.x, source.y - 40, "无目标", "#aaa");
                    this.recordError(source, skillId);
                }
                return;
            }

            // --- 目标类型判定 ---
            const isTargetFriendly = WoW.State.Party.includes(target);
            const isTargetEnemy = WoW.State.Enemies.includes(target);

            if (skill.targetType === 'friend' && !isTargetFriendly) {
                if (this.canShowError(source, skillId)) {
                    this.battleSystem.addCombatText(source.x, source.y - 40, "目标非友方", "#f00");
                    this.recordError(source, skillId);
                }
                return;
            }
            if (skill.targetType === 'enemy' && !isTargetEnemy) {
                if (this.canShowError(source, skillId)) {
                    this.battleSystem.addCombatText(source.x, source.y - 40, "目标非敌方", "#f00");
                    this.recordError(source, skillId);
                }
                return;
            }
            if (skill.targetType === 'self' && target !== source) {
                if (this.canShowError(source, skillId)) {
                    this.battleSystem.addCombatText(source.x, source.y - 40, "只能对自己施放", "#f00");
                    this.recordError(source, skillId);
                }
                return;
            }
            // --- 目标类型判定结束 ---

            const dist = WoW.Core.Utils.getCenterDistance(source, target);
            if (skill.rangeMin > 0 && dist < skill.rangeMin) {
                if (this.canShowError(source, skillId)) {
                    this.battleSystem.addCombatText(source.x, source.y - 40, "太近了", "#aaa");
                    this.recordError(source, skillId);
                }
                return;
            }
            if (skill.rangeMax > 0 && dist > skill.rangeMax) {
                if (this.canShowError(source, skillId)) {
                    this.battleSystem.addCombatText(source.x, source.y - 40, "距离太远", "#aaa");
                    this.recordError(source, skillId);
                }
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
                    // Don't add duplicate text - dealDamage already shows damage
                });
            }
            if (skill.id === 2) { // Fire Blast (火焰冲击)
                this.vfxSystem.spawnExplosion(target.x + target.width/2, target.y + target.height/2, '#e74c3c');
                this.battleSystem.dealDamage(source, target, 1.5);
                // Don't add extra combat text here - dealDamage already shows damage numbers
            }
            if (skill.id === 3) { // Frost Nova (冰霜新星)
                this.vfxSystem.spawnNova(source, '#3498db', skill.rangeMax);
                const targets = this.getAoETargets(source, skill.rangeMax, 'enemy');
                targets.forEach(t => {
                    t.addBuff({ name: 'frozen', duration: 4 }); // 4秒定身
                    this.battleSystem.dealDamage(source, t, 0.5);
                    // Show frozen text above damage
                    this.battleSystem.addCombatText(t.x, t.y - 45, "被冻结", '#3498db');
                });
                this.battleSystem.addCombatText(source.x, source.y - 50, "冰霜新星", '#3498db');
            }
        }
        // Priest Skills
        else if (source.name === '牧师') {
            if (skill.id === 1) { // Heal
                this.vfxSystem.spawnBeam(source, target, '#f1c40f'); // Yellow beam
                this.battleSystem.heal(source, target, skill.value);
            }
            if (skill.id === 2) { // Power Word: Shield (真言术：盾)
                const shieldValue = skill.value + (source.currentInt * 5); // 基础值 + 智力加成
                target.absorbShield += shieldValue;
                target.addBuff({ name: '真言术：盾', duration: 15 });
                this.battleSystem.addCombatText(target.x, target.y - 40, `护盾 (${shieldValue})`, '#fff');
                this.vfxSystem.spawnImpact(target.x + target.width/2, target.y + target.height/2, '#f1c40f');
            }
            if (skill.id === 3) { // Holy Nova (神圣新星)
                this.vfxSystem.spawnNova(source, '#f1c40f', skill.rangeMax);
                
                // Heal Allies
                const friends = this.getAoETargets(source, skill.rangeMax, 'friend');
                friends.forEach(f => {
                    this.battleSystem.heal(source, f, skill.value);
                });

                // Damage Enemies
                const enemies = this.getAoETargets(source, skill.rangeMax, 'enemy');
                enemies.forEach(e => {
                    this.battleSystem.dealDamage(source, e, 0.8);
                });
                
                this.battleSystem.addCombatText(source.x, source.y - 50, "神圣新星", '#f1c40f');
            }
        }
        // Rogue Skills
        else if (source.name === '盗贼') {
            if (skill.id === 1) { // 影袭
                this.vfxSystem.spawnBeam(source, target, '#FFF569'); // 近战黄色特效
                this.battleSystem.dealDamage(source, target, 1.5);
                this.battleSystem.addCombatText(target.x, target.y - 45, "影袭", '#FFF569');
                this.vfxSystem.spawnImpact(target.x + target.width/2, target.y + target.height/2, '#FFF569');
            }
            if (skill.id === 2) { // 剔骨
                this.vfxSystem.spawnBeam(source, target, '#FFD700'); // 终结技金色特效
                this.battleSystem.dealDamage(source, target, 3.0);
                this.battleSystem.addCombatText(target.x, target.y - 45, "剔骨", '#FFD700');
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
                    // Don't add duplicate text - dealDamage already shows damage
                });
            }
            if (skill.id === 2) { // 稳固射击
                if(source.addResource) source.addResource(skill.focusGain); // 回复集中值
                this.battleSystem.addCombatText(source.x, source.y - 45, `+${skill.focusGain} 集中`, '#AAAAAA');
                // 稳固射击通常有施法时间，这里简化为瞬发光束+投射物
                this.vfxSystem.spawnBeam(source, target, '#AAAAAA');
                this.vfxSystem.spawnProjectile(source, target, '#AAAAAA', 400, () => {
                     this.battleSystem.dealDamage(source, target, 1.0);
                });
            }
            if (skill.id === 3) { // 震荡射击
                this.vfxSystem.spawnProjectile(source, target, '#FFD700', 450, () => {
                    this.battleSystem.dealDamage(source, target, 0.5);
                    // Don't add duplicate text - dealDamage already shows damage
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

    getAoETargets(source, range, type) {
        const targets = [];
        const party = WoW.State.Party || [];
        const enemies = WoW.State.Enemies || [];

        const potentialTargets = type === 'friend' ? party : enemies;

        potentialTargets.forEach(unit => {
            if (unit.isDead) return;
            const dist = WoW.Core.Utils.getCenterDistance(source, unit);
            if (dist <= range) {
                targets.push(unit);
            }
        });
        return targets;
    }
};