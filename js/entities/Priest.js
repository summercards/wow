/**
 * @file Priest.js
 * @brief 牧师职业的实现，继承自 Unit 类。牧师是治疗职业，负责为队友提供治疗和辅助。
 */
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

        // 牧师的治疗距离和跟随距离
        this.healRange = 500;  // 治疗范围
        this.attackRange = 400; // 攻击范围
        this.followDistance = 100;  // 跟随距离

        this.skills = {
            1: {
                id: 1,
                name: '治疗术',
                castType: 'target',
                targetType: 'friend',
                cost: 200,
                rangeMin: 0,
                rangeMax: 500,
                cd: 3,
                currentCd: 0,
                castTime: 2.5, // 2.5秒施法时间
                color: '#f1c40f',
                isHeal: true,
                value: 150
            },
            2: { // 真言术：盾 (Power Word: Shield)
                id: 2,
                name: '真言术：盾',
                castType: 'target',
                targetType: 'friend',
                cost: 100,
                rangeMin: 0,
                rangeMax: 400,
                cd: 6,
                currentCd: 0,
                castTime: 0, // 瞬发
                color: '#ffffff',
                value: 100
            },
            3: { // 神圣新星 (Holy Nova)
                id: 3,
                name: '神圣新星',
                castType: 'self',
                targetType: 'self',
                cost: 120,
                rangeMin: 0,
                rangeMax: 200,
                cd: 10,
                currentCd: 0,
                castTime: 0, // 瞬发
                color: '#f1c40f',
                value: 80 // AOE治疗队友和伤害敌人的基础值
            }
        };

        // 治疗优先级配置
        this.criticalHpThreshold = 0.5; // 生命值低于50%时优先治疗
        this.healHpThreshold = 0.7;     // 生命值低于70%时考虑治疗

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

        // 更新技能冷却
        for (let k in this.skills) {
            if (this.skills[k].currentCd > 0) this.skills[k].currentCd -= dt;
        }

        // 如果是玩家控制，则跳过 AI 逻辑
        if (this === WoW.State.Player) return;

        // 获取队友中的战士
        const warrior = this.getWarrior();
        if (!warrior) return;
        
        const party = WoW.State.Party || [];
        
        // === 检查是否需要治疗 ===
        let needsHeal = false;
        let healTarget = null;
        let lowestHpPct = 1.0;
        
        // 优先检查战士（坦克）：血量 < 70%
        if (!warrior.isDead) {
            const warriorHpPct = warrior.hp / warrior.maxHp;
            if (warriorHpPct < 0.7) {
                needsHeal = true;
                healTarget = warrior;
                lowestHpPct = warriorHpPct;
            }
        }
        
        // 如果战士不需要治疗，检查其他队友：血量 < 60%
        if (!needsHeal) {
            party.forEach(member => {
                if (member === warrior || member.isDead) return;
                
                const memberHpPct = member.hp / member.maxHp;
                const dist = WoW.Core.Utils.getCenterDistance(this, member);
                
                if (memberHpPct < 0.6 && memberHpPct < lowestHpPct && dist <= this.healRange) {
                    needsHeal = true;
                    healTarget = member;
                    lowestHpPct = memberHpPct;
                }
            });
        }
        
        // === 检查战士的目标是否被激活（开怪）===
        const isWarriorTargetAggroed = warrior.target && warrior.target.isAggroed && !warrior.target.isDead;
        
        // 如果没有开怪，只跟随战士
        if (!isWarriorTargetAggroed) {
            // === 非战斗状态：跟随战士 ===
            const distToWarrior = WoW.Core.Utils.getCenterDistance(this, warrior);
            if (distToWarrior > this.followDistance) {
                const angle = Math.atan2(warrior.y - this.y, warrior.x - this.x);
                this.x += Math.cos(angle) * this.speed * dt;
                this.y += Math.sin(angle) * this.speed * dt;
            } else if (distToWarrior < this.followDistance - 30) {
                // 防止重叠太近
                const angle = Math.atan2(this.y - warrior.y, this.x - warrior.x);
                this.x += Math.cos(angle) * this.speed * dt;
                this.y += Math.sin(angle) * this.speed * dt;
            }
            
            // 重置战斗状态
            if (this.inCombat) {
                console.log(`【牧师】 战斗结束，重新待机`);
                this.inCombat = false;
                this.target = null;
            }
            return;
        }
        
        // === 战斗状态：先治疗，再攻击 ===
        
        // 优先级1：治疗最需要治疗的队友
        if (needsHeal && healTarget) {
            const skill1 = this.skills[1]; // 治疗术
            if (skill1 && skill1.currentCd <= 0 && this.resource >= skill1.cost) {
                const dist = WoW.Core.Utils.getCenterDistance(this, healTarget);
                if (dist <= this.healRange) {
                    WoW.State.SkillSystem.cast(this, 1, healTarget);
                    console.log(`【牧师】 治疗 ${healTarget.name} (血量: ${Math.floor(lowestHpPct * 100)}%)`);
                    return;
                } else {
                    // 移动到治疗范围内
                    const angle = Math.atan2(healTarget.y - this.y, healTarget.x - this.x);
                    this.x += Math.cos(angle) * this.speed * dt;
                    this.y += Math.sin(angle) * this.speed * dt;
                    return;
                }
            }
        }
        
        // 优先级2：攻击敌人（惩击）
        const target = this.target || warrior.target;
        if (target && !target.isDead) {
            const dist = WoW.Core.Utils.getCenterDistance(this, target);
            
            // 保持攻击距离
            if (dist > this.attackRange) {
                const angle = Math.atan2(target.y - this.y, target.x - this.x);
                this.x += Math.cos(angle) * this.speed * dt;
                this.y += Math.sin(angle) * this.speed * dt;
            } else if (dist < this.attackRange - 100) {
                // 太近了，稍微后撤
                const angle = Math.atan2(this.y - target.y, this.x - target.x);
                this.x += Math.cos(angle) * this.speed * dt;
                this.y += Math.sin(angle) * this.speed * dt;
            }
            
            // 使用惩击攻击
            const skill2 = this.skills[2];
            if (skill2 && skill2.currentCd <= 0 && dist <= this.attackRange && this.resource >= skill2.cost) {
                WoW.State.SkillSystem.cast(this, 2, target);
                return;
            }
            
            // 如果技能CD中，使用自动攻击
            if (this.swingTimer <= 0) {
                this.performAutoAttack(target);
            }
        }
    }

    getWarrior() {
        const party = WoW.State.Party || [];
        return party.find(member => member.name === '战士') || null;
    }
};
