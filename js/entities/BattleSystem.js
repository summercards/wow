WoW.Systems.BattleSystem = class {
    constructor(eventEmitter) {
        this.events = eventEmitter;
        this.combatTexts = []; 
        this.combatLog = []; 
    }

    dealDamage(source, target, multiplier = 1.0) {
        let rawDmg = Math.floor(source.minDmg + Math.random() * (source.maxDmg - source.minDmg));
        let damage = Math.floor(rawDmg * multiplier);

        // Mitigation
        if (target.hasBuff('Shield Wall') || target.hasBuff('盾墙')) {
            damage = Math.floor(damage * 0.25);
            this.addCombatText(target.x, target.y - 20, "格挡", "#aaa");
            this.addLog(`${target.name} 格挡了 ${source.name} 的攻击。伤害减免至 ${damage}。`);
        } else {
            this.addLog(`${source.name} 击中 ${target.name} 造成 ${damage} 点伤害。`);
        }

        target.hp -= damage;
        this.addCombatText(target.x, target.y, "-" + damage, WoW.Core.Constants.COLORS.TEXT_DMG);

        // Rage logic (Using unified addResource)
        if (source.resourceType === 'rage') {
            source.addResource(15);
        }
        if (target.resourceType === 'rage') {
            target.addResource(damage / 5);
        }

        if (target.hp <= 0) {
            target.hp = 0;
            target.isDead = true;
            this.addLog(`${target.name} 已死亡。`);
        }
    }

    heal(source, target, amount) {
        target.hp = Math.min(target.maxHp, target.hp + amount);
        this.addCombatText(target.x, target.y - 20, "+" + amount, WoW.Core.Constants.COLORS.TEXT_HEAL);
        this.addLog(`${source.name} 为 ${target.name} 恢复了 ${amount} 点生命值。`);
    }

    addCombatText(x, y, text, color) {
        this.combatTexts.push({ x, y, text, color, life: 60, vy: -1 });
    }
    
    addLog(msg) {
        const time = new Date().toLocaleTimeString().split(' ')[0];
        this.combatLog.push(`[${time}] ${msg}`);
        if (this.combatLog.length > 8) this.combatLog.shift();
    }

    update() {
        this.combatTexts.forEach(t => {
            t.y += t.vy;
            t.life--;
        });
        this.combatTexts = this.combatTexts.filter(t => t.life > 0);
    }

    draw(ctx) {
        ctx.font = "bold 16px Courier New";
        this.combatTexts.forEach(t => {
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, t.x, t.y);
        });
    }
};