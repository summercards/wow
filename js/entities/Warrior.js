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

        // AI 状态
        this.aiState = 'waiting'; // waiting, observing, combat
        this.observeTimer = 0; // 观察时间
        this.observeDuration = 1.5; // 观察持续时间（秒）

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

        // 如果是玩家控制，则跳过 AI 移动和技能释放
        if (this === WoW.State.Player) {
            return;
        }

        // AI 状态机
        this.aiStateMachine(dt);
    }

    aiStateMachine(dt) {
        const enemies = WoW.State.Enemies || [];
        const liveEnemies = enemies.filter(e => !e.isDead);

        // 更新战斗状态
        const wasInCombat = this.inCombat;
        this.inCombat = this.target && !this.target.isDead && WoW.Core.Utils.getCenterDistance(this, this.target) < 300;

        // 状态切换
        if (this.aiState === 'waiting') {
            // 开始观察敌人
            this.aiState = 'observing';
            this.observeTimer = 0;
        }
        else if (this.aiState === 'observing') {
            this.observeTimer += dt;

            // 观察期间检查敌人
            if (liveEnemies.length > 0) {
                // 找最近的敌人
                let nearestEnemy = null;
                let minDist = Infinity;
                liveEnemies.forEach(enemy => {
                    const dist = WoW.Core.Utils.getCenterDistance(this, enemy);
                    if (dist < minDist) {
                        minDist = dist;
                        nearestEnemy = enemy;
                    }
                });

                // 找到目标后进入战斗
                if (nearestEnemy) {
                    this.target = nearestEnemy;
                    this.aiState = 'combat';
                    console.log(`[战士AI] 观察完成，选择目标: ${nearestEnemy.name} (距离: ${Math.floor(minDist)})`);
                }
            }

            // 观察超时，如果没有敌人则进入待机
            if (this.observeTimer >= this.observeDuration) {
                if (!this.target) {
                    console.log(`[战士AI] 观察完成，没有发现敌人，待机`);
                }
            }
        }
        else if (this.aiState === 'combat') {
            if (!wasInCombat && this.inCombat && this.target) {
                // 刚进入战斗，尝试冲锋
                const dist = WoW.Core.Utils.getCenterDistance(this, this.target);
                if (dist > 80 && this.skills[1].currentCd <= 0) {
                    console.log(`[战士AI] 开怪冲锋! 目标: ${this.target.name}`);
                    WoW.State.SkillSystem.cast(this, 1, this.target);
                }
            }

            // 战斗中执行战斗逻辑
            this.combatAI(dt);

            // 如果目标死亡或没有目标，返回观察状态
            if (!this.target || this.target.isDead) {
                this.target = null;
                this.aiState = 'observing';
                this.observeTimer = 0;
            }
        }
    }

    combatAI(dt) {
        if (!this.target || this.target.isDead) return;

        const dist = WoW.Core.Utils.getCenterDistance(this, this.target);
        const meleeRange = 80;

        // 保持在近战范围内
        if (dist > meleeRange + 10) {
            const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            this.x += Math.cos(angle) * this.speed * dt;
            this.y += Math.sin(angle) * this.speed * dt;
        } else if (dist < meleeRange - 20) {
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

    addResource(amount) {
        this.resource = WoW.Core.Utils.clamp(this.resource + amount, 0, this.maxResource);
    }
};
