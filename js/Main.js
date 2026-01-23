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
    const vfxSystem = new WoW.Systems.VFXSystem(battleSystem); 
    const skillSystem = new WoW.Systems.SkillSystem(battleSystem, vfxSystem); 
    const inventorySystem = new WoW.Systems.InventorySystem(input); 
    const controller = new WoW.Core.Controller(input);

    WoW.State.BattleSystem = battleSystem;
    WoW.State.SkillSystem = skillSystem;
    WoW.State.VFXSystem = vfxSystem;

    // Initialize Entities
    const player = new WoW.Content.Warrior(100, 300);
    const mage = new WoW.Content.Mage(50, 200);
    const priest = new WoW.Content.Priest(50, 400);
    
    // Inventory Setup
    player.inventory[0] = WoW.Core.Items.create(1); // Recruit's Sword
    player.inventory[1] = WoW.Core.Items.create(3); // Helm
    player.inventory[2] = WoW.Core.Items.create(4); // Lava Plate
    player.inventory[3] = WoW.Core.Items.create(5); // Thunderfury

    // Group Setup
    WoW.State.Party = [player, mage, priest];

    // Enemies Setup
    const dummy1 = new WoW.Content.TargetDummy(600, 200);
    const dummy2 = new WoW.Content.TargetDummy(650, 300);
    const dummy3 = new WoW.Content.TargetDummy(600, 400);
    
    WoW.State.Enemies = [dummy1, dummy2, dummy3];
    
    // Auto-Target
    player.target = dummy2; // Start with middle one
    mage.target = player.target;
    priest.target = player.target;
    
    // Enemies target player by default
    WoW.State.Enemies.forEach(enemy => enemy.target = player);

    // Mouse Input for Inventory
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        inventorySystem.handleClick(mouseX, mouseY, player);
    });

    // Helper for input debounce
    let lastTabTime = 0;

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
        inventorySystem.update(player); 

        if (!inventorySystem.isOpen) {
            const intent = controller.getIntent();
            
            // Movement
            if (intent.dx !== 0 || intent.dy !== 0) {
                const len = Math.sqrt(intent.dx**2 + intent.dy**2);
                player.x += (intent.dx / len) * player.speed * dt;
                player.y += (intent.dy / len) * player.speed * dt;
            }

            // Skills
            intent.actions.forEach(action => {
                if (action === 'SKILL_1') skillSystem.cast(player, 1, player.target);
                if (action === 'SKILL_2') skillSystem.cast(player, 2, player.target);
                if (action === 'SKILL_3') skillSystem.cast(player, 3, player.target);
                
                // Target Switching (Tab)
                if (action === 'ACTION_NEXT_TARGET') {
                    const now = Date.now();
                    if (now - lastTabTime > 200) { // Simple debounce
                        lastTabTime = now;
                        switchTarget();
                    }
                }
            });
        }

        // Update All Units
        player.update(dt);
        mage.update(dt);
        priest.update(dt);
        
        // Update Enemies
        WoW.State.Enemies.forEach(e => e.update(dt));
        
        battleSystem.update();
        vfxSystem.update(dt);
        
        // Sync Party Targets
        if (mage.target !== player.target) mage.target = player.target;
        if (priest.target !== player.target) priest.target = player.target;
    }

    function switchTarget() {
        const liveEnemies = WoW.State.Enemies.filter(e => !e.isDead);
        if (liveEnemies.length === 0) return;

        let currentIndex = liveEnemies.indexOf(player.target);
        // If current target is dead or not in list, currentIndex is -1, next becomes 0
        let nextIndex = (currentIndex + 1) % liveEnemies.length;
        
        player.target = liveEnemies[nextIndex];
    }

    function draw() {
        ctx.fillStyle = WoW.Core.Constants.COLORS.FLOOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Selection Circle
        if (player.target && !player.target.isDead) {
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

        // Draw Enemies
        WoW.State.Enemies.forEach(e => {
            if (!e.isDead) drawUnit(e);
        });

        // Draw Party
        drawUnit(priest);
        drawUnit(mage);
        drawUnit(player);

        vfxSystem.draw(ctx);
        battleSystem.draw(ctx);
        drawUI();

        inventorySystem.draw(ctx, player);
    }

    function drawUnit(unit) {
        ctx.fillStyle = unit.color;
        
        // Effects
        if (unit.hasBuff('盾墙')) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.strokeRect(unit.x, unit.y, unit.width, unit.height);
        }
        
        ctx.fillRect(unit.x, unit.y, unit.width, unit.height);
        
        // Render Weapon
        if (unit.equipment && unit.equipment.main_hand) {
            const item = unit.equipment.main_hand;
            ctx.save();
            ctx.translate(unit.x + unit.width/2, unit.y + unit.height/2);
            
            let facingRight = true;
            if (unit.target && unit.target.x < unit.x) facingRight = false;
            if (!facingRight) ctx.scale(-1, 1);

            ctx.fillStyle = item.iconColor || '#fff';
            ctx.beginPath();
            ctx.moveTo(10, 5);
            ctx.lineTo(30, 5);
            ctx.lineTo(35, 0);
            ctx.lineTo(30, -5);
            ctx.lineTo(10, -5);
            ctx.fill();
            
            ctx.fillStyle = "#4a3b2a";
            ctx.fillRect(5, -8, 5, 16); 
            ctx.fillRect(0, -2, 5, 4); 

            ctx.restore();
        }

        // Name
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(unit.name, unit.x, unit.y - 10);

        // Health Bar on Head
        unit.drawHealthBar(ctx);
    }

    function drawUI() {
        // Player Frame
        drawBar(20, 20, 200, 20, player.hp, player.maxHp, '#e74c3c'); 
        drawResourceBar(20, 45, 200, 15, player); 
        
        // Party Frames
        drawBar(20, 80, 150, 15, mage.hp, mage.maxHp, '#e74c3c');
        drawResourceBar(20, 95, 150, 8, mage);
        ctx.fillStyle = '#fff'; ctx.font = '10px Arial'; ctx.fillText(mage.name, 25, 91);
        
        drawBar(20, 120, 150, 15, priest.hp, priest.maxHp, '#e74c3c');
        drawResourceBar(20, 135, 150, 8, priest);
        ctx.fillStyle = '#fff'; ctx.font = '10px Arial'; ctx.fillText(priest.name, 25, 131);

        // Removed Top Center Target Frame (moved to head)

        // Action Bar
        const startX = 250;
        const startY = 500;

        drawAutoAttackIcon(startX, startY, player);
        drawSkill(player.skills[1], startX + 50, startY, '1');
        drawSkill(player.skills[2], startX + 100, startY, '2');
        drawSkill(player.skills[3], startX + 150, startY, '3');
        
        // Combat Log
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
        
        ctx.fillStyle = "#ffff00";
        ctx.font = "12px Microsoft YaHei";
        ctx.fillText("按 'I' 打开背包 | 按 'Tab' 切换目标", 10, WoW.Core.Constants.CANVAS_HEIGHT - 10);
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
        if (unit.resourceType === 'rage') color = '#C41F3B'; 
        if (unit.resourceType === 'mana') color = '#3498db'; 
        
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = color;
        const res = unit.resource || 0;
        const max = unit.maxResource || 1;
        ctx.fillRect(x, y, Math.max(0, (res / max)*w), h);
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