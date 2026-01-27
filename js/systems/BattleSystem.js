/**
 * @file BattleSystem.js
 * @brief 核心战斗系统，负责处理游戏中的所有伤害、治疗、资源生成和战斗日志记录。
 *        它与 VFX 系统和 Skill 系统协同工作，但不直接触发视觉效果或技能逻辑。
 */
WoW.Systems.BattleSystem = class {
    /**
     * 构造函数，初始化战斗系统。
     * @param {WoW.Core.EventEmitter} eventEmitter 全局事件发射器实例。
     */
    constructor(eventEmitter) {
        /** @property {WoW.Core.EventEmitter} events 事件发射器，用于触发和监听战斗相关事件（当前简化，直接通过方法调用）。 */
        this.events = eventEmitter;
        /** @property {Array<object>} combatTexts 存储所有待显示的飘字信息（伤害、治疗、资源获取）。 */
        this.combatTexts = []; // {x, y, text, color, life, vy}
        /** @property {Array<string>} combatLog 存储战斗日志消息，显示在屏幕右下角。 */
        this.combatLog = []; // Strings of combat history

        // 调试日志
        this.debugLogs = []; // 存储调试信息
    }

    /**
     * 添加调试日志
     * @param {string} message 调试信息
     */
    addDebugLog(message) {
        this.debugLogs.push({
            message: message,
            timestamp: Date.now()
        });
        // 只保留最近20条
        if (this.debugLogs.length > 20) {
            this.debugLogs.shift();
        }
    }

    /**
     * 处理单位对另一个单位造成伤害的逻辑。
     * 计算伤害量，应用减伤，更新生命值，并触发相关视觉和日志反馈。
     * @param {WoW.Entities.Unit} source 伤害来源单位。
     * @param {WoW.Entities.Unit} target 伤害目标单位。
     * @param {number} multiplier 伤害倍数（例如：技能伤害加成）。
     */
    dealDamage(source, target, multiplier = 1.0) {
        // Debug: 检查目标类型
        const isPartyMember = WoW.State.Party && WoW.State.Party.includes(target);
        const isEnemy = WoW.State.Enemies && WoW.State.Enemies.includes(target);
        if (isPartyMember) {
            this.addDebugLog(`⚠️ [伤害] ${source.name} → ${target.name} (误伤队友!)`);
        } else {
            this.addDebugLog(`💥 [伤害] ${source.name} → ${target.name}`);
        }

        // 计算基础伤害范围内的随机伤害
        let rawDmg = Math.floor(source.minDmg + Math.random() * (source.maxDmg - source.minDmg));
        let damage = Math.floor(rawDmg * multiplier);

        // --- 伤害减免 (例如：盾墙 Buff) ---
        if (target.hasBuff('Shield Wall') || target.hasBuff('盾墙')) {
            damage = Math.floor(damage * 0.25); // 75% 伤害减免
            this.addCombatText(target.x, target.y - 20, "格挡", "#aaa"); // 格挡飘字
            this.addLog(`${target.name} 格挡了 ${source.name} 的攻击。伤害减免至 ${damage}。`);
        }

        // --- 护盾吸收逻辑 ---
        if (target.absorbShield > 0) {
            if (target.absorbShield >= damage) {
                target.absorbShield -= damage;
                this.addCombatText(target.x, target.y - 20, "吸收", "#fff");
                // 伤害完全被吸收，不触发受伤逻辑（如怒气生成）
                return; 
            } else {
                damage -= target.absorbShield;
                this.addCombatText(target.x, target.y - 20, `吸收 (${target.absorbShield})`, "#fff");
                target.absorbShield = 0;
                // 护盾破裂，移除护盾Buff (如果有)
                // 这里简化处理，不直接移除Buff，而是让Buff自然过期或在Unit.update中检测
            }
        }

        this.addLog(`${source.name} 击中 ${target.name} 造成 ${damage} 点伤害。`);

        // --- 应用伤害 ---
        target.hp -= damage; // 扣除目标生命值
        this.addCombatText(target.x, target.y, "-" + damage, WoW.Core.Constants.COLORS.TEXT_DMG); // 伤害飘字

        // --- 怒气生成逻辑 (基于伤害来源和伤害承受者) ---
        if (source.resourceType === 'rage') {
            // 战士普攻命中时生成怒气
            source.addResource(15);
            this.addCombatText(source.x, source.y - 40, "+15 怒气", "#C41F3B");
        }
        if (target.resourceType === 'rage') {
            // 战士受到伤害时生成怒气 (伤害量/5)
            const rageGain = Math.floor(damage / 5);
            if (rageGain > 0) {
                target.addResource(rageGain);
                this.addCombatText(target.x, target.y - 40, `+${rageGain} 怒气`, "#C41F3B");
            }
        }

        // --- 死亡判定 ---
        if (target.hp <= 0) {
            target.hp = 0;
            target.isDead = true;
            this.addLog(`${target.name} 已死亡。`);
        }
    }

    /**
     * 处理单位获得治疗的逻辑。
     * 增加生命值，并触发相关视觉和日志反馈。
     * @param {WoW.Entities.Unit} source 治疗来源单位。
     * @param {WoW.Entities.Unit} target 治疗目标单位。
     * @param {number} amount 治疗量。
     */
    heal(source, target, amount) {
        // 增加目标生命值，但不超过最大生命值
        target.hp = WoW.Core.Utils.clamp(target.hp + amount, 0, target.maxHp);
        this.addCombatText(target.x, target.y - 20, "+" + amount, WoW.Core.Constants.COLORS.TEXT_HEAL); // 治疗飘字
        this.addLog(`${source.name} 为 ${target.name} 恢复了 ${amount} 点生命值。`);
    }

    /**
     * 向战斗飘字列表中添加一个新的飘字。
     * @param {number} x 飘字的X坐标。
     * @param {number} y 飘字的Y坐标。
     * @param {string} text 飘字显示的文本。
     * @param {string} color 飘字的颜色。
     */
    addCombatText(x, y, text, color) {
        // 飘字的生命周期为 60 帧，Y轴向上移动
        this.combatTexts.push({ x, y, text, color, life: 60, vy: -1 });
    }
    
    /**
     * 向战斗日志中添加一条新消息。
     * 日志会显示时间戳，并自动保持最新的 N 条记录。
     * @param {string} msg 要记录的消息文本。
     */
    addLog(msg) {
        const time = new Date().toLocaleTimeString().split(' ')[0];
        this.combatLog.push(`[${time}] ${msg}`);
        if (this.combatLog.length > 8) this.combatLog.shift(); // 保持日志只显示最新的8条
    }

    /**
     * 更新战斗系统的状态，例如飘字计时器。
     */
    update() {
        // 更新飘字的位置和生命周期
        this.combatTexts.forEach(t => {
            t.y += t.vy;
            t.life--;
        });
        this.combatTexts = this.combatTexts.filter(t => t.life > 0); // 移除生命周期结束的飘字
    }

    /**
     * 在 Canvas 上绘制战斗相关的视觉元素，例如飘字。
     * @param {CanvasRenderingContext2D} ctx Canvas的2D渲染上下文。
     */
    draw(ctx) {
        ctx.font = "bold 16px Courier New";
        this.combatTexts.forEach(t => {
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, t.x, t.y);
        });
    }

    /**
     * 绘制调试日志
     * @param {CanvasRenderingContext2D} ctx Canvas的2D渲染上下文。
     */
    drawDebugLogs(ctx) {
        if (this.debugLogs.length === 0) return;

        const logX = 10;
        const logY = 100;
        const lineHeight = 14;

        // 半透明背景
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(logX, logY - 10, 400, this.debugLogs.length * lineHeight + 10);

        // 绘制日志
        ctx.font = "11px Consolas";
        ctx.textAlign = "left";

        this.debugLogs.forEach((log, i) => {
            ctx.fillStyle = "#00ff00"; // 绿色文字
            ctx.fillText(`[${(log.timestamp % 10000).toString().padStart(4, '0')}] ${log.message}`, logX + 5, logY + i * lineHeight);
        });

        ctx.textAlign = "left";
    }
};