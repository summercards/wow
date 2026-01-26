/**
 * @file Warrior.js
 * @brief 战士职业的实现，继承自 Unit 类。战士是团队的坦克，负责拉仇恨和抗伤害。
 */
WoW.Content.Warrior = class extends WoW.Entities.Unit {
    constructor(x, y) {
        super(x, y, 32, 32, WoW.Core.Constants.COLORS.WARRIOR);
        this.name = "战士";

        // Set base attributes for Warrior
        this.baseStr = 20; // 战士拥有高力量
        this.baseAgi = 10; // 战士的敏捷相对较低
        this.baseSta = 25; // 战士拥有高耐力
        this.baseInt = 5;  // 战士的智力较低
        this.baseSpirit = 5; // 战士的精神较低

        // Set resource type and base max for rage
        this.resourceType = 'rage';
        this.baseMaxResource = 100; // 怒气上限固定100
        this.resource = 0; // 怒气开局为0

        this.skills = {
            1: {
                id: 1,
                name: '冲锋', // Charge
                castType: 'target',
                targetType: 'enemy', // 新增：目标类型为敌人
                cost: 0, // 冲锋不消耗怒气，反而会生成怒气
                rangeMin: 0,
                rangeMax: 800,
                cd: 15,
                currentCd: 0,
                color: '#a52a2a'
            },
            2: {
                id: 2,
                name: '嘲讽', // Taunt
                castType: 'target',
                targetType: 'enemy', // 新增：目标类型为敌人
                cost: 10, // 嘲讽消耗10怒气
                rangeMin: 0,
                rangeMax: 200,
                cd: 8,
                currentCd: 0,
                color: '#ff4500'
            },
            3: {
                id: 3,
                name: '盾墙', // Shield Wall
                castType: 'self',
                targetType: 'self', // 新增：目标类型为自己
                cost: 30, // 盾墙消耗30怒气
                rangeMin: 0,
                rangeMax: 0,
                cd: 60,
                currentCd: 0,
                color: '#808080'
            }
        };

        // 战斗状态标记，用于队友判断是否进入战斗
        this.inCombat = false;

        // Recalculate stats after all base properties are set
        this.recalcStats();
    }

    update(dt) {
        super.update(dt);

        // 更新技能冷却
        for (let k in this.skills) {
            if (this.skills[k].currentCd > 0) this.skills[k].currentCd -= dt;
        }

        // 怒气衰减：没有获得怒气时缓慢衰减
        if (this.resource > 0) this.resource -= 1 * dt;
        this.resource = Math.max(0, this.resource);

        // 判断是否在战斗中 (这一步必须执行，否则队友不知道战士开怪了)
        const wasInCombat = this.inCombat;
        this.inCombat = this.target && !this.target.isDead && WoW.Core.Utils.getCenterDistance(this, this.target) < 300;

        // 如果是玩家控制，则跳过 AI 移动和技能释放
        // 添加调试日志：只在每一秒打印一次，避免刷屏
        if (this === WoW.State.Player) {
            return;
        } else {
            // Debug: 为什么 AI 还在运行？
            if (WoW.State.Player && WoW.State.Player.name === this.name) {
                 console.log("Warrior Bug: this != WoW.State.Player but names match!", this, WoW.State.Player);
            }
        }

        // AI 逻辑：自动冲锋 (仅 AI)
        if (!wasInCombat && this.inCombat && this.target && this.skills[1].currentCd <= 0) {
            const dist = WoW.Core.Utils.getCenterDistance(this, this.target);
            if (dist > 80) {
                WoW.State.SkillSystem.cast(this, 1, this.target);
            }
        }

        // 战斗AI逻辑
        if (this.target && !this.target.isDead) {
            const dist = WoW.Core.Utils.getCenterDistance(this, this.target);
            const meleeRange = 80; // 近战攻击范围

            // 保持在近战范围内
            if (dist > meleeRange + 10) {
                // 追击目标
                const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                this.x += Math.cos(angle) * this.speed * dt;
                this.y += Math.sin(angle) * this.speed * dt;
            } else if (dist < meleeRange - 20) {
                // 防止重叠太近
                const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                this.x -= Math.cos(angle) * this.speed * dt;
                this.y -= Math.sin(angle) * this.speed * dt;
            }

            // 嘲讽技能（目标仇恨不在自己时使用）
            if (this.skills[2].currentCd <= 0 && this.resource >= this.skills[2].cost && dist <= 200) {
                if (this.target.target !== this) {
                    WoW.State.SkillSystem.cast(this, 2, this.target);
                }
            }

            // 盾墙（生命值低于30%时使用）
            if (this.skills[3].currentCd <= 0 && this.resource >= this.skills[3].cost) {
                const hpPct = this.hp / this.maxHp;
                if (hpPct < 0.3) {
                    WoW.State.SkillSystem.cast(this, 3, this);
                }
            }
        }
    }

    addResource(amount) {
        this.resource = WoW.Core.Utils.clamp(this.resource + amount, 0, this.maxResource);
    }
};
