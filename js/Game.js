import { Input } from './core/Input.js';
import { Warrior } from './entities/Warrior.js';
import { TargetDummy } from './entities/TargetDummy.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, SKILL_ICONS } from './core/Constants.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        
        this.input = new Input();
        
        this.player = new Warrior(100, 300);
        this.dummy = new TargetDummy(600, 300);
        
        // Auto-target for testing
        this.player.target = this.dummy; 
        
        this.lastTime = 0;
        this.combatTexts = []; // { x, y, text, color, life, vy }
        
        // Hook into damage events for floating text
        this.hookUnitEvents(this.player);
        this.hookUnitEvents(this.dummy);
        
        requestAnimationFrame((ts) => this.loop(ts));
    }

    hookUnitEvents(unit) {
        // We override the empty hooks in Unit.js
        unit.onTakeDamage = (amount, source) => {
            if (unit instanceof Warrior) unit.addRage(amount / 5); // Extra rage logic hook if needed
            this.addCombatText(unit.x + unit.width/2, unit.y, "-" + amount, COLORS.TEXT_DMG);
        };
        unit.onDealDamage = (amount, target) => {
            if (unit instanceof Warrior) unit.addRage(15);
        };
    }

    addCombatText(x, y, text, color) {
        this.combatTexts.push({
            x, y, text, color,
            life: 60,
            vy: -1
        });
    }

    loop(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((ts) => this.loop(ts));
    }

    update(dt) {
        // Player Input
        if (this.input.isDown('w')) this.player.y -= this.player.speed * dt;
        if (this.input.isDown('s')) this.player.y += this.player.speed * dt;
        if (this.input.isDown('a')) this.player.x -= this.player.speed * dt;
        if (this.input.isDown('d')) this.player.x += this.player.speed * dt;

        // Skills
        if (this.input.isDown('1')) {
            const res = this.player.castCharge(this.player.target);
            if(res.success) this.addCombatText(this.player.x, this.player.y - 30, "Charge!", "#fff");
        }
        if (this.input.isDown('2')) {
            const res = this.player.castTaunt(this.player.target);
            if(res.success) this.addCombatText(this.dummy.x, this.dummy.y - 50, "TAUNTED!", "#ff0000");
        }
        if (this.input.isDown('3')) {
            const res = this.player.castShieldWall();
            if(res.success) this.addCombatText(this.player.x, this.player.y - 30, "Shield Wall!", "#aaa");
        }

        // Entities
        this.player.update(dt);
        this.dummy.update(dt);

        // Combat Texts
        this.combatTexts.forEach(t => {
            t.y += t.vy;
            t.life--;
        });
        this.combatTexts = this.combatTexts.filter(t => t.life > 0);
    }

    draw() {
        // BG
        this.ctx.fillStyle = COLORS.FLOOR;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Entities
        this.drawUnit(this.dummy);
        this.drawUnit(this.player);

        // Combat Text
        this.ctx.font = "bold 16px Courier New";
        this.combatTexts.forEach(t => {
            this.ctx.fillStyle = t.color;
            this.ctx.fillText(t.text, t.x, t.y);
        });

        // UI Layer
        this.drawUI();
    }

    drawUnit(unit) {
        this.ctx.fillStyle = unit.color;
        // Visual effect for Shield Wall
        if (unit.hasBuff('Shield Wall')) {
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(unit.x, unit.y, unit.width, unit.height);
        }
        this.ctx.fillRect(unit.x, unit.y, unit.width, unit.height);
        
        // Name
        this.ctx.fillStyle = "#fff";
        this.ctx.font = "12px Arial";
        this.ctx.fillText(unit.name, unit.x, unit.y - 10);
    }

    drawUI() {
        // --- Player Frame (Top Left) ---
        const startX = 20;
        const startY = 20;
        
        // HP Bar
        this.drawBar(startX, startY, 200, 20, this.player.hp, this.player.maxHp, '#e74c3c');
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(`${Math.floor(this.player.hp)} / ${this.player.maxHp}`, startX + 50, startY + 14);

        // Rage Bar
        this.drawBar(startX, startY + 25, 200, 15, this.player.rage, this.player.maxRage, COLORS.WARRIOR_RAGE);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = "10px Arial";
        this.ctx.fillText(`RAGE: ${Math.floor(this.player.rage)}`, startX + 50, startY + 36);

        // Swing Timer (Thin white bar below Rage)
        if (this.player.swingTimer > 0) {
            const width = (this.player.swingTimer / this.player.swingSpeed) * 200;
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(startX, startY + 45, width, 2);
        }

        // --- Target Frame (Top Center) ---
        if (this.player.target) {
            const t = this.player.target;
            const tX = CANVAS_WIDTH / 2 - 100;
            this.drawBar(tX, startY, 200, 30, t.hp, t.maxHp, '#e74c3c');
            this.ctx.fillStyle = '#fff';
            this.ctx.font = "14px Arial";
            this.ctx.fillText(t.name, tX + 10, startY + 20);
        }

        // --- Action Bar (Bottom Center) ---
        const barX = CANVAS_WIDTH / 2 - 80;
        const barY = CANVAS_HEIGHT - 60;
        
        // 1. Charge
        this.drawSkillIcon(barX, barY, '1', this.player.skills.charge);
        // 2. Taunt
        this.drawSkillIcon(barX + 55, barY, '2', this.player.skills.taunt);
        // 3. Shield Wall
        this.drawSkillIcon(barX + 110, barY, '3', this.player.skills.shieldWall);
        
        // --- Debug Info ---
        this.ctx.fillStyle = '#aaa';
        this.ctx.fillText("DPS Check: Attack the dummy to test rage generation.", 20, CANVAS_HEIGHT - 20);
    }

    drawBar(x, y, w, h, val, max, color) {
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x, y, w, h);
        const fillW = Math.max(0, (val / max) * w);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, fillW, h);
        this.ctx.strokeStyle = '#000';
        this.ctx.strokeRect(x, y, w, h);
    }

    drawSkillIcon(x, y, key, skill) {
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(x, y, 40, 40);
        
        // Cooldown overlay
        if (skill.currentCd > 0) {
            this.ctx.fillStyle = '#333';
            const h = (skill.currentCd / skill.cd) * 40;
            this.ctx.fillRect(x, y + 40 - h, 40, h);
        } else {
            this.ctx.fillStyle = skill.color;
            this.ctx.fillRect(x+2, y+2, 36, 36);
        }
        
        this.ctx.strokeStyle = '#555';
        this.ctx.strokeRect(x, y, 40, 40);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = "bold 14px Arial";
        this.ctx.fillText(key, x + 2, y + 12);
        
        if (skill.currentCd > 0) {
             this.ctx.font = "bold 12px Arial";
             this.ctx.fillText(Math.ceil(skill.currentCd), x + 12, y + 25);
        }
    }
}

new Game();
