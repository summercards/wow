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
                cost: 200,
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
                cost: 80,
                rangeMin: 0,
                rangeMax: 400,
                cd: 2,
                currentCd: 0,
                color: '#f39c12',
                value: 80
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

        // === 优先级1：治疗（优先于战斗状态） ===
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
        if (healTarget && this.skills[1] && this.skills[1].currentCd <= 0 && this.resource >= this.skills[1].cost) {
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
            // === 战斗状态：攻击 ===
            const target = this.target || warrior.target;
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

            // 攻击逻辑
            if (this.skills[2] && this.skills[2].currentCd <= 0 && dist <= this.attackRange && this.resource >= this.skills[2].cost) {
                WoW.State.SkillSystem.cast(this, 2, target);
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
