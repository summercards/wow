/**
 * @file Rogue.js
 * @brief 盗贼职业的实现，继承自 Unit 类。盗贼是近战爆发职业，擅长从背后攻击。
 */
WoW.Content.Rogue = class extends WoW.Entities.Unit {
    constructor(x, y) {
        super(x, y, 32, 32, WoW.Core.Constants.COLORS.ROGUE); // 盗贼颜色
        this.name = "盗贼";

        // --- 基础属性 (盗贼高敏捷、耐力) ---
        this.baseStr = 10;
        this.baseAgi = 25; // 盗贼的核心属性
        this.baseSta = 20;
        this.baseInt = 5;
        this.baseSpirit = 5;

        // --- 资源系统 (能量) ---
        this.resourceType = 'energy';
        this.baseMaxResource = 100; // 能量上限固定100
        this.resource = 100; // 能量开局为满
        this.energyRegenPerSecond = 10; // 基础能量回复速度 (10点/秒)

        this.speed = 200; // 盗贼速度较快

        // 盗贼的自动攻击速度通常更快
        this.swingSpeed = 1.6;

        // 盗贼的战斗距离
        this.meleeRange = 80;       // 近战攻击范围
        this.followDistance = 100;  // 跟随距离
        this.backstabDistance = 60;  // 背刺距离（需要更近）

        // --- 技能定义 ---
        this.skills = {
            1: {
                id: 1,
                name: '影袭', // Sinister Strike
                castType: 'target',
                cost: 40, // 消耗能量
                rangeMin: 0,
                rangeMax: 80, // 近战范围
                cd: 1.5,
                currentCd: 0,
                color: '#FFF569' // 盗贼黄色
            },
            2: {
                id: 2,
                name: '剔骨', // Eviscerate (终结技，简化为直接伤害)
                castType: 'target',
                cost: 35,
                rangeMin: 0,
                rangeMax: 80,
                cd: 5,
                currentCd: 0,
                color: '#FFD700' // 金色
            },
            3: {
                id: 3,
                name: '疾跑', // Sprint (简化为短时间加速，不消耗能量)
                castType: 'self',
                cost: 0,
                rangeMin: 0,
                rangeMax: 0,
                cd: 30,
                currentCd: 0,
                color: '#00FFFF' // 青色
            }
        };

        // 初始化时计算一次属性
        this.recalcStats();
    }

    update(dt) {
        super.update(dt);

        // 能量回复
        if (this.resource < this.maxResource) {
            this.resource += this.energyRegenPerSecond * dt; // 能量快速回复
            if (this.resource > this.maxResource) this.resource = this.maxResource;
        }
        this.resource = WoW.Core.Utils.clamp(this.resource, 0, this.maxResource); // 确保在范围内

        // 技能冷却更新
        for (let k in this.skills) {
            if (this.skills[k].currentCd > 0) this.skills[k].currentCd -= dt;
        }

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
            // === 战斗状态：移动到目标背后 ===
            const target = this.target || warrior.target;
            if (target && !target.isDead) {
                const dist = WoW.Core.Utils.getCenterDistance(this, target);
                const isBehind = this.isBehindTarget(this, target);

                // 检查是否在目标背后
                if (!isBehind || dist > this.backstabDistance) {
                    // 移动到目标背后
                    this.moveToBehind(target, dt);
                } else if (dist < this.meleeRange - 20) {
                    // 太近了，稍微后退
                    const angle = Math.atan2(this.y - target.y, this.x - target.x);
                    this.x += Math.cos(angle) * this.speed * dt;
                    this.y += Math.sin(angle) * this.speed * dt;
                }

                // 技能释放优先级 (简化)
                // 只有在目标背后或足够近时才释放技能
                if (dist <= this.meleeRange) {
                    // 1. 影袭 (基础攻击)
                    if (this.skills[1] && this.skills[1].currentCd <= 0 && this.resource >= this.skills[1].cost) {
                        WoW.State.SkillSystem.cast(this, 1, target);
                    }
                    // 2. 剔骨 (终结技，有能量就放，假设有连击点)
                    else if (this.skills[2] && this.skills[2].currentCd <= 0 && this.resource >= this.skills[2].cost) {
                        WoW.State.SkillSystem.cast(this, 2, target);
                    }
                }

                // 疾跑 (脱战或追击时使用，简化为CD到就用)
                if (this.skills[3] && this.skills[3].currentCd <= 0 && dist > this.meleeRange + 50) {
                    WoW.State.SkillSystem.cast(this, 3, this); // 疾跑不消耗能量
                }
            }
        }
    }

    /**
     * 判断盗贼是否在目标背后
     * @param {WoW.Entities.Unit} rogue 盗贼实例
     * @param {WoW.Entities.Unit} target 目标单位
     * @returns {boolean} 如果在背后返回true
     */
    isBehindTarget(rogue, target) {
        // 获取目标的朝向（目标正看向战士）
        const warrior = this.getWarrior();
        if (!warrior) return false;

        // 假设目标总是面对战士
        const targetCx = target.x + target.width / 2;
        const targetCy = target.y + target.height / 2;
        const warriorCx = warrior.x + warrior.width / 2;
        const warriorCy = warrior.y + warrior.height / 2;
        const rogueCx = rogue.x + rogue.width / 2;
        const rogueCy = rogue.y + rogue.height / 2;

        // 目标朝向战士的角度
        const targetFacingAngle = Math.atan2(warriorCy - targetCy, warriorCx - targetCx);

        // 盗贼相对于目标的角度
        const rogueAngle = Math.atan2(rogueCy - targetCy, rogueCx - targetCx);

        // 计算角度差（0-360度）
        let angleDiff = Math.abs(rogueAngle - targetFacingAngle) * (180 / Math.PI);
        if (angleDiff > 180) angleDiff = 360 - angleDiff;

        // 如果角度差在120-180度之间，认为在背后
        return angleDiff >= 120 && angleDiff <= 180;
    }

    /**
     * 移动到目标背后的理想位置
     * @param {WoW.Entities.Unit} target 目标单位
     * @param {number} dt 时间增量
     */
    moveToBehind(target, dt) {
        const warrior = this.getWarrior();
        if (!warrior) return;

        const targetCx = target.x + target.width / 2;
        const targetCy = target.y + target.height / 2;
        const warriorCx = warrior.x + warrior.width / 2;
        const warriorCy = warrior.y + warrior.height / 2;

        // 目标朝向战士的角度
        const targetFacingAngle = Math.atan2(warriorCy - targetCy, warriorCx - targetCx);

        // 目标背后的角度（对面 + 180度）
        const behindAngle = targetFacingAngle + Math.PI;

        // 期望位置（目标背后一定距离）
        const desiredDistance = this.backstabDistance;
        const desiredX = targetCx + Math.cos(behindAngle) * desiredDistance;
        const desiredY = targetCy + Math.sin(behindAngle) * desiredDistance;

        // 计算从当前位置到期望位置的方向
        const dx = desiredX - this.x;
        const dy = desiredY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
            const moveAngle = Math.atan2(dy, dx);
            this.x += Math.cos(moveAngle) * this.speed * dt;
            this.y += Math.sin(moveAngle) * this.speed * dt;
        }
    }

    /**
     * 盗贼的自定义资源获取方式。
     * @param {number} amount 获取的能量值。
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
