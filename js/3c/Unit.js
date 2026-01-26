/**
 * @file Unit.js
 * @brief 所有游戏单位的基类。定义了单位的基础属性、战斗状态、装备、背包、增益/减益效果以及生命条绘制等功能。
 *        所有可交互或有战斗能力的实体都应继承此类。
 */
WoW.Entities.Unit = class {
    /**
     * 构造函数，初始化单位的视觉和基础战斗属性。
     * @param {number} x 单位的X坐标。
     * @param {number} y 单位的Y坐标。
     * @param {number} width 单位的宽度。
     * @param {number} height 单位的高度。
     * @param {string} color 单位的渲染颜色。
     */
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        
        /** @property {string} name 单位的名称（例如：“战士”，“训练假人”）。 */
        this.name = "Unit";
        
        // --- 基础属性 (由派生类设置，代表裸装时的属性) ---
        /** @property {number} baseStr 基础力量。 */
        this.baseStr = 0;
        /** @property {number} baseAgi 基础敏捷。 */
        this.baseAgi = 0;
        /** @property {number} baseSta 基础耐力。 */
        this.baseSta = 0;
        /** @property {number} baseInt 基础智力。 */
        this.baseInt = 0;
        /** @property {number} baseSpirit 基础精神。 */
        this.baseSpirit = 0;

        // --- 核心基础数值 (在没有装备和属性加成时的默认值) ---
        /** @property {number} baseMaxHp 基础最大生命值。 */
        this.baseMaxHp = 100;
        /** @property {number} baseMaxResource 基础最大资源值（怒气/法力）。 */
        this.baseMaxResource = 100;
        /** @property {number} baseMinDmg 基础最小伤害。 */
        this.baseMinDmg = 5;
        /** @property {number} baseMaxDmg 基础最大伤害。 */
        this.baseMaxDmg = 10;
        
        // --- 计算后的实时属性 (受基础属性和装备影响) ---
        /** @property {number} maxHp 最大生命值。 */
        this.maxHp = this.baseMaxHp;
        /** @property {number} hp 当前生命值。 */
        this.hp = this.maxHp;
        /** @property {string} resourceType 资源类型（'rage' 或 'mana'）。 */
        this.resourceType = 'none'; // 默认为无资源，由派生类设置
        /** @property {number} maxResource 最大资源值。 */
        this.maxResource = this.baseMaxResource;
        /** @property {number} resource 当前资源值。 */
        this.resource = this.maxResource; 
        /** @property {number} minDmg 最小伤害。 */
        this.minDmg = this.baseMinDmg;
        /** @property {number} maxDmg 最大伤害。 */
        this.maxDmg = this.baseMaxDmg;

        // --- 当前总属性 (基础属性 + 装备属性的总和) ---
        /** @property {number} currentStr 当前总力量。 */
        this.currentStr = 0;
        /** @property {number} currentAgi 当前总敏捷。 */
        this.currentAgi = 0;
        /** @property {number} currentSta 当前总耐力。 */
        this.currentSta = 0;
        /** @property {number} currentInt 当前总智力。 */
        this.currentInt = 0;
        /** @property {number} currentSpirit 当前总精神。 */
        this.currentSpirit = 0;
        
        /** @property {number} speed 单位的移动速度（像素/秒）。 */
        this.speed = 200;
        
        /** @property {object} target 单位当前锁定的目标。 */
        this.target = null;
        /** @property {Array<object>} buffs 单位当前拥有的增益/减益效果列表。 */
        this.buffs = [];
        /** @property {boolean} isDead 单位是否已死亡。 */
        this.isDead = false;
        
        // --- 背包与装备 ---
        /** @property {Array<object|null>} inventory 单位的背包，存储物品实例。 */
        this.inventory = new Array(16).fill(null); // 16格背包
        /** 
         * @property {object<string, object|null>} equipment 单位当前装备的物品。
         *                          键是装备槽位名称，值是物品实例或 null。
         */
        this.equipment = {
            [WoW.Core.Constants.SLOTS.HEAD]: null,
            [WoW.Core.Constants.SLOTS.SHOULDER]: null,
            [WoW.Core.Constants.SLOTS.CHEST]: null,
            [WoW.Core.Constants.SLOTS.WRIST]: null,
            [WoW.Core.Constants.SLOTS.HANDS]: null,
            [WoW.Core.Constants.SLOTS.WAIST]: null,
            [WoW.Core.Constants.SLOTS.LEGS]: null,
            [WoW.Core.Constants.SLOTS.FEET]: null,
            [WoW.Core.Constants.SLOTS.NECK]: null,
            [WoW.Core.Constants.SLOTS.FINGER1]: null,
            [WoW.Core.Constants.SLOTS.FINGER2]: null,
            [WoW.Core.Constants.SLOTS.TRINKET1]: null,
            [WoW.Core.Constants.SLOTS.TRINKET2]: null,
            [WoW.Core.Constants.SLOTS.MAIN_HAND]: null,
            [WoW.Core.Constants.SLOTS.OFF_HAND]: null,
            [WoW.Core.Constants.SLOTS.RANGED]: null,
        };
        
        // --- 自动攻击 ---
        /** @property {number} swingTimer 自动攻击的冷却计时器。 */
        this.swingTimer = 0;
        /** @property {number} swingSpeed 自动攻击的间隔时间（秒）。 */
        this.swingSpeed = 2.0;
        /** @property {number} attackRange 自动攻击的范围（像素）。 */
        this.attackRange = 60; // 近战单位的攻击范围

        // 派生类构造函数在设置完基础属性后会调用 recalcStats()
    }

    /**
     * 重新计算单位的所有实时属性 (生命值、资源、伤害等)。
     * 此方法在装备穿戴/卸下或基础属性变化时调用，以确保属性的动态更新。
     */
    recalcStats() {
        // 在属性变化前，保存当前生命值和资源值的百分比，以便后续恢复
        const hpPct = this.maxHp > 0 ? this.hp / this.maxHp : 1;
        const resPct = this.maxResource > 0 ? this.resource / this.maxResource : 1;

        // 1. 将当前总属性重置为基础属性值
        this.currentStr = this.baseStr;
        this.currentAgi = this.baseAgi;
        this.currentSta = this.baseSta;
        this.currentInt = this.baseInt;
        this.currentSpirit = this.baseSpirit;

        let totalItemMinDmgBonus = 0; // 物品提供的直接最小伤害加成
        let totalItemMaxDmgBonus = 0; // 物品提供的直接最大伤害加成

        // 2. 遍历所有已装备的物品，累加其提供的属性
        for (const slotName in this.equipment) {
            const item = this.equipment[slotName];
            if (item && item.stats) {
                if (item.stats.str) this.currentStr += item.stats.str;
                if (item.stats.agi) this.currentAgi += item.stats.agi;
                if (item.stats.sta) this.currentSta += item.stats.sta;
                if (item.stats.int) this.currentInt += item.stats.int;
                if (item.stats.spirit) this.currentSpirit += item.stats.spirit;
                
                // 物品可能提供直接的伤害加成（例如饰品）
                if (item.stats.minDmg) totalItemMinDmgBonus += item.stats.minDmg;
                if (item.stats.maxDmg) totalItemMaxDmgBonus += item.stats.maxDmg;
            }
        }

        // 3. 将总属性转换为核心战斗数值 (WoW 经典转换规则)

        // 最大生命值: 1 点耐力 = 10 点生命值
        this.maxHp = this.baseMaxHp + (this.currentSta * 10);
        this.hp = this.maxHp * hpPct; // 恢复生命值百分比

        // 最大资源值 (怒气/法力):
        if (this.resourceType === 'mana') { // 1 点智力 = 15 点法力值
            this.maxResource = this.baseMaxResource + (this.currentInt * 15);
            this.resource = this.maxResource * resPct; // 恢复法力值百分比
        } else if (this.resourceType === 'rage') {
            // 怒气上限通常固定为 100，不随属性变化
            this.maxResource = this.baseMaxResource; 
            this.resource = this.maxResource * resPct; // 恢复怒气百分比
        }

        // 最小/最大伤害计算
        const mainHandWeapon = this.equipment[WoW.Core.Constants.SLOTS.MAIN_HAND];
        
        if (mainHandWeapon && mainHandWeapon.type === 'weapon') {
            // 装备武器时：武器的基础伤害 + 属性加成 + 物品直接伤害加成
            this.minDmg = mainHandWeapon.stats.minDmg + totalItemMinDmgBonus;
            this.maxDmg = mainHandWeapon.stats.maxDmg + totalItemMaxDmgBonus;
            
            // 特定职业的伤害属性加成 (例如：战士的力量)
            if (this.name === '战士') {
                this.minDmg += Math.floor(this.currentStr / 2); // 2 点力量 = 1 点伤害
                this.maxDmg += Math.floor(this.currentStr / 2);
            } else if (this.name === '法师' || this.name === '牧师') {
                this.minDmg += Math.floor(this.currentInt / 4); // 示例：4 点智力 = 1 点伤害 (施法者)
                this.maxDmg += Math.floor(this.currentInt / 4);
            }

        } else {
            // 未装备武器 (徒手)：基础徒手伤害 + 属性加成 + 物品直接伤害加成
            this.minDmg = this.baseMinDmg + totalItemMinDmgBonus;
            this.maxDmg = this.baseMaxDmg + totalItemMaxDmgBonus;
            
            if (this.name === '战士') {
                this.minDmg += Math.floor(this.currentStr / 3); // 徒手伤害力量加成略低
                this.maxDmg += Math.floor(this.currentStr / 3);
            } else if (this.name === '法师' || this.name === '牧师') {
                this.minDmg += Math.floor(this.currentInt / 5);
                this.maxDmg += Math.floor(this.currentInt / 5);
            }
        }
        
        // 4. 将当前生命值/资源值钳制到新的最大值 (防止溢出或负值)
        this.hp = WoW.Core.Utils.clamp(this.hp, 0, this.maxHp);
        this.resource = WoW.Core.Utils.clamp(this.resource, 0, this.maxResource);
    }

    /**
     * 每帧更新单位状态的逻辑。
     * @param {number} dt 距离上一帧的时间增量（秒）。
     */
    update(dt) {
        if (this.isDead) return; // 如果单位已死亡，则不进行更新

        // 更新所有 Buff 的持续时间
        this.buffs = this.buffs.filter(b => {
            b.duration -= dt;
            return b.duration > 0; // 移除已过期的 Buff
        });

        // 更新自动攻击计时器
        if (this.swingTimer > 0) this.swingTimer -= dt;

        // 自动攻击逻辑
        if (this.target && !this.target.isDead) {
            const dist = WoW.Core.Utils.getCenterDistance(this, this.target);
            // 根据职业设置不同的自动攻击范围
            const range = this.name === "法师" || this.name === "牧师" ? 400 : 80; // 远程 vs 近战
            
            if (dist <= range && this.swingTimer <= 0) {
                // 牧师不自动攻击友方单位或训练假人以外的目标 (简化AI)
                if (this.name === "牧师" && this.target.name !== "训练假人") return;
                
                this.performAutoAttack(this.target);
            }
        }
    }

    /**
     * 执行自动攻击的逻辑。
     * @param {WoW.Entities.Unit} target 自动攻击的目标。
     */
    performAutoAttack(target) {
        this.swingTimer = this.swingSpeed; // 重置自动攻击计时器
        if(WoW.State.BattleSystem) {
            WoW.State.BattleSystem.dealDamage(this, target, 1.0); // 造成基础伤害 (100% 武器伤害)
        }
    }

    /**
     * 检查单位是否拥有某个名称的 Buff。
     * @param {string} name Buff 的名称。
     * @returns {boolean} 如果单位拥有该 Buff 则返回 true，否则返回 false。
     */
    hasBuff(name) {
        return this.buffs.some(b => b.name === name);
    }
    
    /**
     * 为单位添加一个 Buff 或刷新现有 Buff 的持续时间。
     * @param {object} buff 要添加的 Buff 对象 (包含 name, duration等属性)。
     */
    addBuff(buff) {
        const existing = this.buffs.find(b => b.name === buff.name);
        if (existing) {
            existing.duration = buff.duration; // 刷新持续时间
        } else {
            this.buffs.push(buff);
        }
    }

    /**
     * 在 Canvas 上绘制单位头顶的生命条。
     * @param {CanvasRenderingContext2D} ctx Canvas的2D渲染上下文。
     */
    drawHealthBar(ctx) {
        if (this.isDead) return; // 死亡单位不绘制生命条

        const barWidth = this.width + 10; // 血条宽度略宽于单位
        const barHeight = 5;
        const barX = this.x - 5; // 血条居中于单位上方
        const barY = this.y - 15; // 血条位置在单位上方15像素

        // 血条背景
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // 血条填充 (根据生命值百分比和颜色变化)
        const healthPct = this.hp / this.maxHp;
        let healthColor = '#2ecc71'; // 绿色 (高血量)
        if (healthPct < 0.6) healthColor = '#f1c40f'; // 黄色 (中血量)
        if (healthPct < 0.25) healthColor = '#e74c3c'; // 红色 (低血量)

        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPct, barHeight);
        
        // 血条边框
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
};