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

        // 检查战士是否在战斗中
        const warriorInCombat = warrior.inCombat;
        const party = WoW.State.Party || [];
        const enemies = WoW.State.Enemies || [];

        // === 优先级1：自保 / 团队保护 (真言术：盾) ===
        // 检查是否有队友（尤其是战士）血量危险，或者没有护盾
        let shieldTarget = null;
        let lowestHpMember = null;
        let lowestHpPct = 1.0;

        party.forEach(member => {
            if (member.isDead) return;
            const pct = member.hp / member.maxHp;
            if (pct < lowestHpPct) {
                lowestHpPct = pct;
                lowestHpMember = member;
            }
            // 如果有队友血量低于阈值且没有护盾，考虑套盾
            const skill2 = this.skills[2];
            if (skill2 && pct < this.healHpThreshold && member.absorbShield <= 0 && WoW.Core.Utils.getCenterDistance(this, member) <= skill2.rangeMax) {
                 shieldTarget = member; // 优先给血少的队友套盾
            }
        });

        // 优先给战士套盾，如果战士没有盾且血量不是满血
        const skill2 = this.skills[2];
        if (skill2 && warrior && warrior.absorbShield <= 0 && warrior.hp / warrior.maxHp < 1.0 && WoW.Core.Utils.getCenterDistance(this, warrior) <= skill2.rangeMax) {
            shieldTarget = warrior;
        }

        if (shieldTarget && skill2 && skill2.currentCd <= 0 && this.resource >= skill2.cost) {
            WoW.State.SkillSystem.cast(this, 2, shieldTarget);
            return; // 施放盾后立即返回
        }

        // === 优先级2：群体治疗 / 群体伤害 (神圣新星) ===
        // 仅在有多个敌人和多个友方需要治疗时使用
        const skill3 = this.skills[3];
        const nearbyAlliesNeedingHeal = skill3 ? party.filter(m => !m.isDead && m.hp / m.maxHp < this.healHpThreshold && WoW.Core.Utils.getCenterDistance(this, m) <= skill3.rangeMax).length : 0;
        const nearbyEnemies = skill3 ? enemies.filter(e => !e.isDead && WoW.Core.Utils.getCenterDistance(this, e) <= skill3.rangeMax).length : 0;

        if (warriorInCombat && skill3 && skill3.currentCd <= 0 && this.resource >= skill3.cost && nearbyEnemies >= 2 && nearbyAlliesNeedingHeal >= 1) {
             WoW.State.SkillSystem.cast(this, 3, this); // 神圣新星是自身 AoE
             return; // 施放后返回
        }

        // === 优先级3：单体治疗 ===
        let healTarget = null;
        let lowestPct = 1.0;

        party.forEach(member => {
            const pct = member.hp / member.maxHp;
            // 优先治疗生命值最低且在范围内的队友
            const dist = WoW.Core.Utils.getCenterDistance(this, member);
            if (pct < this.criticalHpThreshold && pct < lowestPct && dist <= this.healRange) {
                lowestPct = pct;
                healTarget = member;
            }
        });

        // 有治疗目标时执行治疗
        const skill1 = this.skills[1];
        if (healTarget && skill1 && skill1.currentCd <= 0 && this.resource >= skill1.cost) {
            const dist = WoW.Core.Utils.getCenterDistance(this, healTarget);
            if (dist <= this.healRange) {
                WoW.State.SkillSystem.cast(this, 1, healTarget);
            } else {
                // 移动到治疗范围内
                const angle = Math.atan2(healTarget.y - this.y, healTarget.x - this.x);
                this.x += Math.cos(angle) * this.speed * dt;
                this.y += Math.sin(angle) * this.speed * dt;
            }
            return; // 执行治疗后返回，不执行后续逻辑
        }

        // === 优先级4：移动/待机 ===
        // 检查战士的目标是否被激活（开怪）
        const isWarriorTargetAggroed = warrior.target && warrior.target.isAggroed && !warrior.target.isDead;
        
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
        } else if (warrior.target && !warrior.target.isDead) {
            // === 战斗状态：攻击/维持距离 ===
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

                // 攻击逻辑 (如果都没有治疗或盾牌需求，可以惩击)
                if (skill2 && skill2.currentCd <= 0 && dist <= this.attackRange && this.resource >= skill2.cost && nearbyAlliesNeedingHeal < 1) {
                    WoW.State.SkillSystem.cast(this, 2, target);
                }
            }
        }
    }

    /**
     * 获取队伍中的战士
     * @returns {WoW.Content.Warrior|null} 战士实例，如果不存在则返回null
     */
    getWarrior() {
        const party = WoW.State.Party || [];
        return party.find(member => member.name === '战士') || null;
    }
};
