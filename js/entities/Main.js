// Main Game Entry
window.onload = function() {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = WoW.Core.Constants.CANVAS_WIDTH;
    canvas.height = WoW.Core.Constants.CANVAS_HEIGHT;

    // Initialize Core & Systems
    const input = new WoW.Core.Input();
    const events = new WoW.Core.EventEmitter();
    const battleSystem = new WoW.Systems.BattleSystem(events);
    const skillSystem = new WoW.Systems.SkillSystem(battleSystem);
    const controller = new WoW.Core.Controller(input);

    WoW.State.BattleSystem = battleSystem;
    WoW.State.SkillSystem = skillSystem;

    // Initialize Entities
    const player = new WoW.Content.Warrior(100, 300);
    const mage = new WoW.Content.Mage(50, 200);
    const priest = new WoW.Content.Priest(50, 400);
    
    // Group them
    WoW.State.Party = [player, mage, priest];

    const dummy = new WoW.Content.TargetDummy(600, 300);
    
    // Auto-Target
    player.target = dummy;
    mage.target = dummy;
    priest.target = dummy;
    dummy.target = player; 

    // Game Loop
    let lastTime = 0;
    let isPaused = false;

    function loop(timestamp) {
        if (isPaused) return;

        try {
            const dt = (timestamp - lastTime) / 1000;
            lastTime = timestamp;

            update(dt);
            draw();
            
            requestAnimationFrame(loop);
        } catch (e) {
            console.error("Game Loop Error:", e);
            ctx.fillStyle = "red";
            ctx.font = "20px Arial";
            ctx.fillText("GAME CRASHED! Check Console.", 100, 100);
            ctx.fillText(e.message, 100, 130);
            isPaused = true;
        }
    }

    function update(dt) {
        // Player Control
        const intent = controller.getIntent();
        
        if (intent.dx !== 0 || intent.dy !== 0) {
            const len = Math.sqrt(intent.dx**2 + intent.dy**2);
            player.x += (intent.dx / len) * player.speed * dt;
            player.y += (intent.dy / len) * player.speed * dt;
        }

        intent.actions.forEach(action => {
            if (action === 'SKILL_1') skillSystem.cast(player, 1, player.target);
            if (action === 'SKILL_2') skillSystem.cast(player, 2, player.target);
            if (action === 'SKILL_3') skillSystem.cast(player, 3, player.target);
        });

        // Update All Units
        player.update(dt);
        mage.update(dt);
        priest.update(dt);
        dummy.update(dt);
        
        battleSystem.update();
    }

    function draw() {
        ctx.fillStyle = WoW.Core.Constants.COLORS.FLOOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Selection Circle
        if (player.target) {
            const t = player.target;
            ctx.save();
            ctx.translate(t.x + t.width/2, t.y + t.height);
            ctx.scale(1, 0.5); 
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI*2);
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        }

        drawUnit(dummy);
        drawUnit(priest);
        drawUnit(mage);
        drawUnit(player);

        battleSystem.draw(ctx);
        drawUI();
    }

    function drawUnit(unit) {
        ctx.fillStyle = unit.color;
        if (unit.hasBuff('盾墙')) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.strokeRect(unit.x, unit.y, unit.width, unit.height);
        }
        ctx.fillRect(unit.x, unit.y, unit.width, unit.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(unit.name, unit.x, unit.y - 10);
    }

    function drawUI() {
        // --- Player Frame ---
        drawBar(20, 20, 200, 20, player.hp, player.maxHp, '#e74c3c'); // HP
        drawResourceBar(20, 45, 200, 15, player); // Resource
        
        // --- Party Frames (Left Side) ---
        // Mage
        drawBar(20, 80, 150, 15, mage.hp, mage.maxHp, '#e74c3c');
        drawResourceBar(20, 95, 150, 8, mage);
        ctx.fillStyle = '#fff'; ctx.font = '10px Arial'; ctx.fillText(mage.name, 25, 91);
        
        // Priest
        drawBar(20, 120, 150, 15, priest.hp, priest.maxHp, '#e74c3c');
        drawResourceBar(20, 135, 150, 8, priest);
        ctx.fillStyle = '#fff'; ctx.font = '10px Arial'; ctx.fillText(priest.name, 25, 131);

        // --- Target Frame ---
        if (player.target) {
            const tx = 600 - 100;
            drawBar(tx, 20, 200, 30, player.target.hp, player.target.maxHp, '#e74c3c');
            ctx.fillStyle = '#fff'; ctx.font = '12px Arial'; ctx.fillText(player.target.name, tx + 5, 40);
        }

        // --- Action Bar ---
        const startX = 250;
        const startY = 500;

        // Auto Attack Icon
        drawAutoAttackIcon(startX, startY, player);

        // Skills
        drawSkill(player.skills[1], startX + 50, startY, '1');
        drawSkill(player.skills[2], startX + 100, startY, '2');
        drawSkill(player.skills[3], startX + 150, startY, '3');
        
        // --- Combat Log ---
        const logX = WoW.Core.Constants.CANVAS_WIDTH - 320;
        const logY = WoW.Core.Constants.CANVAS_HEIGHT - 150;
        
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(logX, logY, 300, 140);
        ctx.strokeStyle = "#444";
        ctx.strokeRect(logX, logY, 300, 140);
        
        ctx.font = "12px Courier New";
        battleSystem.combatLog.forEach((msg, i) => {
            ctx.fillStyle = "#ccc";
            if (msg.includes("死亡")) ctx.fillStyle = "#ff5555";
            if (msg.includes("格挡")) ctx.fillStyle = "#aaaaff";
            if (msg.includes("恢复")) ctx.fillStyle = "#aaffaa";
            ctx.fillText(msg, logX + 10, logY + 20 + (i * 15));
        });
    }

    function drawBar(x, y, w, h, val, max, color) {
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, Math.max(0, (val/max)*w), h);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
    }
    
    function drawResourceBar(x, y, w, h, unit) {
        let color = '#ccc';
        if (unit.resourceType === 'rage') color = '#C41F3B'; // Red
        if (unit.resourceType === 'mana') color = '#3498db'; // Blue
        
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, Math.max(0, (unit.resource / unit.maxResource)*w), h);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
    }

    function drawAutoAttackIcon(x, y, unit) {
        ctx.fillStyle = '#222';
        ctx.fillRect(x, y, 40, 40);
        
        if (unit.swingTimer > 0) {
            ctx.fillStyle = '#555'; 
            const h = (unit.swingTimer / unit.swingSpeed) * 40;
            ctx.fillRect(x, y + 40 - h, 40, h);
        } else {
            ctx.fillStyle = '#fff'; 
            ctx.fillRect(x + 2, y + 2, 36, 36);
        }
        
        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px Arial';
        ctx.fillText("⚔️", x + 8, y + 28);
        
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(x, y, 40, 40);
        
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText("普攻", x + 8, y + 52); 
    }

    function drawSkill(skill, x, y, key) {
        ctx.fillStyle = '#222';
        ctx.fillRect(x, y, 40, 40);
        
        if (skill.currentCd > 0) {
            ctx.fillStyle = '#444';
            const h = (skill.currentCd / skill.cd) * 40;
            ctx.fillRect(x, y + 40 - h, 40, h);
        } else {
            ctx.fillStyle = skill.color;
            ctx.fillRect(x+2, y+2, 36, 36);
        }
        
        ctx.strokeStyle = '#555';
        ctx.strokeRect(x, y, 40, 40);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(key, x+2, y+12);
        
        ctx.font = '10px Arial';
        ctx.fillText(skill.name, x, y + 52);
    }

    requestAnimationFrame(loop);
};