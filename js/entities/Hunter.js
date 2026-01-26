/**
 * @file Hunter.js
 * @brief 猎人职业的实现，继承自 Unit 类。猎人远程物理输出职业，擅长从远处输出伤害。
 */
WoW.Content.Hunter = class extends WoW.Entities.Unit {
    /**
     * 构造函数，初始化猎人的视觉、基础战斗属性和技能。
     * @param {number} x 猎人的X坐标。
     * @param {number} y 猎人的Y坐标。
     */
    constructor(x, y) {
        super(x, y, 32, 32, WoW.Core.Constants.COLORS.HUNTER); // 猎人颜色
        this.name = "猎人";

        // --- 基础属性 (猎人高敏捷、耐力) ---
        this.baseStr = 12;
        this.baseAgi = 24; // 猎人的核心属性
        this.baseSta = 20;
        this.baseInt = 8;
        this.baseSpirit = 8;

        // --- 资源系统 (专注) ---
        this.resourceType = 'focus';
        this.baseMaxResource = 100; // 专注上限固定100
        this.resource = 100; // 专注开局为满
        this.focusRegenPerSecond = 5; // 基础专注回复速度 (5点/秒)

        this.speed = 190;

        // 猎人的自动攻击速度较慢，远程
        this.swingSpeed = 2.0;
        this.attackRange = 150; // 远程攻击范围

        // 猎人的安全距离
        this.optimalRangeMin = 80;  // 最小攻击距离
        this.optimalRangeMax = 150; // 最大攻击距离
        this.followDistance = 120;  // 跟随距离

        // --- 技能定义 ---
        this.skills = {
            1: {
                id: 1,
                name: '奥术射击', // Arcane Shot
                castType: 'target',
                targetType: 'enemy', // 新增：目标类型为敌人
                cost: 30, // 消耗专注
                rangeMin: 0,
                rangeMax: 150, // 远程范围
                cd: 1.5,
                currentCd: 0,
                color: '#00CCFF' // 蓝色
            },
            2: {
                id: 2,
                name: '稳固射击', // Steady Shot (回复专注)
                castType: 'target',
                targetType: 'enemy', // 新增：目标类型为敌人
                cost: 0, // 固稳射击不消耗专注，反而回复
                rangeMin: 0,
                rangeMax: 150,
                cd: 2,
                currentCd: 0,
                color: '#AAAAAA', // 灰色
                focusGain: 10 // 回复专注量
            },
            3: {
                id: 3,
                name: '震荡射击', // Concussive Shot
                castType: 'target',
                targetType: 'enemy', // 新增：目标类型为敌人
                cost: 20,
                rangeMin: 0,
                rangeMax: 150,
                cd: 10,
                currentCd: 0,
                color: '#FFD700' // 金色
            }
        };

        // 初始化时计算一次属性
        this.recalcStats();
    }

    update(dt) {
        super.update(dt);

        // 专注回复
        if (this.resource < this.maxResource) {
            this.resource += this.focusRegenPerSecond * dt; // 专注回复
            if (this.resource > this.maxResource) this.resource = this.maxResource;
        }
        this.resource = WoW.Core.Utils.clamp(this.resource, 0, this.maxResource); // 确保在范围内

        // 技能冷却更新
        for (let k in this.skills) {
            if (this.skills[k].currentCd > 0) this.skills[k].currentCd -= dt;
        }

        // 如果是玩家控制，则跳过 AI 逻辑
        if (this === WoW.State.Player) return;

        // 获取队友中的战士
        const warrior = this.getWarrior();
        if (!warrior) return;

        // 如果是玩家控制，则跳过 AI 逻辑
        if (this === WoW.State.Player) return;

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
            // === 战斗状态：保持安全距离并输出 ===
            const target = this.target || warrior.target;
            if (target && !target.isDead) {
                const dist = WoW.Core.Utils.getCenterDistance(this, target);

                // 保持远程距离
                if (dist < this.optimalRangeMin) {
                    // 太近了，后撤到安全距离
                    const angle = Math.atan2(this.y - target.y, this.x - target.x);
                    this.x += Math.cos(angle) * this.speed * dt;
                    this.y += Math.sin(angle) * this.speed * dt;
                } else if (dist > this.optimalRangeMax) {
                    // 太远了，靠近目标
                    const angle = Math.atan2(target.y - this.y, target.x - this.x);
                    this.x += Math.cos(angle) * this.speed * dt;
                    this.y += Math.sin(angle) * this.speed * dt;
                }

                // 技能释放优先级 (简化)
                // 1. 奥术射击 (基础攻击)
                if (this.skills[1].currentCd <= 0 && this.resource >= this.skills[1].cost && dist <= this.optimalRangeMax) {
                    WoW.State.SkillSystem.cast(this, 1, target);
                }
                // 2. 稳固射击 (回复专注，当专注较低时使用)
                else if (this.skills[2].currentCd <= 0 && this.resource < 50 && dist <= this.optimalRangeMax) {
                    WoW.State.SkillSystem.cast(this, 2, target);
                }
                // 3. 震荡射击 (CD较长，消耗较少)
                else if (this.skills[3].currentCd <= 0 && this.resource >= this.skills[3].cost && dist <= this.optimalRangeMax) {
                    WoW.State.SkillSystem.cast(this, 3, target);
                }
            }
        }
    }

    /**
     * 猎人的自定义资源获取方式。
     * @param {number} amount 获取的专注值。
     */
    addResource(amount) {
        this.resource = WoW.Core.Utils.clamp(this.resource + amount, 0, this.maxResource);
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
