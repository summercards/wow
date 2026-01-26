/**
 * @file Mage.js
 * @brief 法师职业的实现，继承自 Unit 类。法师是远程输出职业，负责从远处输出伤害。
 */
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

        // 法师的安全距离
        this.optimalRangeMin = 200; // 最小施法距离
        this.optimalRangeMax = 350; // 最大施法距离
        this.followDistance = 100;  // 跟随距离

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

        if (!warriorInCombat) {
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
        } else if (warriorInCombat && warrior.target) {
            // === 战斗状态 ===
            const target = this.target || warrior.target;
            if (target && !target.isDead) {
                const dist = WoW.Core.Utils.getCenterDistance(this, target);

                // 保持施法距离
                if (dist > this.optimalRangeMax) {
                    // 太远，靠近
                    const angle = Math.atan2(target.y - this.y, target.x - this.x);
                    this.x += Math.cos(angle) * this.speed * dt;
                    this.y += Math.sin(angle) * this.speed * dt;
                } else if (dist < this.optimalRangeMin) {
                    // 太近，后撤
                    const angle = Math.atan2(this.y - target.y, this.x - target.x);
                    this.x += Math.cos(angle) * this.speed * dt;
                    this.y += Math.sin(angle) * this.speed * dt;
                }

                // 攻击逻辑
                if (this.skills[1] && this.skills[1].currentCd <= 0 && dist <= 400 && this.resource >= this.skills[1].cost) {
                    WoW.State.SkillSystem.cast(this, 1, target);
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
