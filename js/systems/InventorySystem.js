WoW.Systems.InventorySystem = class {
    constructor(input) {
        this.input = input;
        this.isOpen = false;
        this.draggedItem = null; // For future drag & drop
        
        // UI Layout Constants
        this.PANEL_X = 100;
        this.PANEL_Y = 100;
        this.PANEL_W = 600;
        this.PANEL_H = 400;
        
        // Input toggling
        this.lastIToggle = false;
    }

    update(player) {
        // Toggle Inventory with 'I'
        const iDown = this.input.isDown('i');
        if (iDown && !this.lastIToggle) {
            this.isOpen = !this.isOpen;
        }
        this.lastIToggle = iDown;
    }

    // Logic: Equip item from bag index
    equipItem(unit, bagIndex) {
        const item = unit.inventory[bagIndex];
        if (!item) return;

        // Check slot
        const slot = item.slot;
        const currentEquip = unit.equipment[slot];

        // Swap
        unit.equipment[slot] = item;
        unit.inventory[bagIndex] = currentEquip; // Put old item in bag (or null)

        unit.recalcStats();
        console.log(`Equipped ${item.name}. New Str: ${unit.minDmg}-${unit.maxDmg}`);
    }

    // Logic: Unequip item from slot
    unequipItem(unit, slot) {
        const item = unit.equipment[slot];
        if (!item) return;

        // Find empty bag slot
        const emptyIndex = unit.inventory.findIndex(i => i === null);
        if (emptyIndex === -1) {
            console.log("Bag is full!");
            return;
        }

        unit.inventory[emptyIndex] = item;
        unit.equipment[slot] = null;
        
        unit.recalcStats();
        console.log(`Unequipped ${item.name}.`);
    }

    // Input Handling (Click)
    handleClick(x, y, unit) {
        if (!this.isOpen) return false;

        // Check Bag Slots
        // Grid: 4x4 starting at right side
        const bagStartX = this.PANEL_X + 350;
        const bagStartY = this.PANEL_Y + 50;
        const cellSize = 40;
        const gap = 5;

        for (let i = 0; i < 16; i++) {
            const col = i % 4;
            const row = Math.floor(i / 4);
            const bx = bagStartX + col * (cellSize + gap);
            const by = bagStartY + row * (cellSize + gap);

            if (x >= bx && x <= bx + cellSize && y >= by && y <= by + cellSize) {
                // Clicked bag slot i
                if (unit.inventory[i]) {
                    this.equipItem(unit, i);
                }
                return true;
            }
        }

        // Check Equipment Slots
        // Simple layout: Head (top), Chest (mid), MainHand (left)
        const eqSlots = [
            { id: 'head', x: this.PANEL_X + 150, y: this.PANEL_Y + 50 },
            { id: 'chest', x: this.PANEL_X + 150, y: this.PANEL_Y + 110 },
            { id: 'main_hand', x: this.PANEL_X + 90, y: this.PANEL_Y + 200 }
        ];

        for (let s of eqSlots) {
             if (x >= s.x && x <= s.x + 40 && y >= s.y && y <= s.y + 40) {
                 if (unit.equipment[s.id]) {
                     this.unequipItem(unit, s.id);
                 }
                 return true;
             }
        }

        return false;
    }

    draw(ctx, unit) {
        if (!this.isOpen) return;

        // 1. Draw Panel Background
        ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
        ctx.fillRect(this.PANEL_X, this.PANEL_Y, this.PANEL_W, this.PANEL_H);
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.PANEL_X, this.PANEL_Y, this.PANEL_W, this.PANEL_H);

        // 2. Character Paper Doll (Left Side)
        ctx.fillStyle = "#fff";
        ctx.font = "20px Microsoft YaHei";
        ctx.fillText("角色属性", this.PANEL_X + 20, this.PANEL_Y + 30);
        
        // Stats
        ctx.font = "14px Microsoft YaHei";
        ctx.fillStyle = "#aaa";
        let statY = this.PANEL_Y + 300;
        ctx.fillText(`力量: ${unit.name === '战士' ? 'High' : 'Low'}`, this.PANEL_X + 20, statY);
        ctx.fillText(`伤害: ${unit.minDmg} - ${unit.maxDmg}`, this.PANEL_X + 20, statY + 20);
        ctx.fillText(`生命: ${Math.floor(unit.hp)} / ${unit.maxHp}`, this.PANEL_X + 20, statY + 40);

        // Equipment Slots
        this.drawEquipSlot(ctx, unit, 'head', this.PANEL_X + 150, this.PANEL_Y + 50, "头部");
        this.drawEquipSlot(ctx, unit, 'chest', this.PANEL_X + 150, this.PANEL_Y + 110, "胸部");
        this.drawEquipSlot(ctx, unit, 'main_hand', this.PANEL_X + 90, this.PANEL_Y + 200, "主手");

        // 3. Bag (Right Side)
        ctx.fillStyle = "#fff";
        ctx.font = "20px Microsoft YaHei";
        ctx.fillText("背包", this.PANEL_X + 350, this.PANEL_Y + 30);

        const bagStartX = this.PANEL_X + 350;
        const bagStartY = this.PANEL_Y + 50;
        const cellSize = 40;
        const gap = 5;

        for (let i = 0; i < 16; i++) {
            const col = i % 4;
            const row = Math.floor(i / 4);
            const bx = bagStartX + col * (cellSize + gap);
            const by = bagStartY + row * (cellSize + gap);
            
            const item = unit.inventory[i];
            this.drawItemSlot(ctx, bx, by, item);
        }
    }

    drawEquipSlot(ctx, unit, slotName, x, y, label) {
        const item = unit.equipment[slotName];
        
        ctx.fillStyle = "#222";
        ctx.fillRect(x, y, 40, 40);
        ctx.strokeStyle = "#555";
        ctx.strokeRect(x, y, 40, 40);

        if (item) {
            this.drawItemIcon(ctx, x, y, item);
        } else {
            ctx.fillStyle = "#444";
            ctx.font = "10px Microsoft YaHei";
            ctx.fillText(label, x + 5, y + 24);
        }
    }

    drawItemSlot(ctx, x, y, item) {
        ctx.fillStyle = "#222";
        ctx.fillRect(x, y, 40, 40);
        ctx.strokeStyle = "#555";
        ctx.strokeRect(x, y, 40, 40);
        
        if (item) {
            this.drawItemIcon(ctx, x, y, item);
        }
    }

    drawItemIcon(ctx, x, y, item) {
        // Rarity Border
        const rarityColor = WoW.Core.Items.RARITY[item.rarity.toUpperCase()] || '#fff';
        ctx.strokeStyle = rarityColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 40, 40);

        // Icon (Simple color block for now)
        ctx.fillStyle = item.iconColor || '#888';
        ctx.fillRect(x + 2, y + 2, 36, 36);
        
        // Initial letter
        ctx.fillStyle = "#000";
        ctx.font = "bold 14px Arial";
        ctx.fillText(item.name.charAt(0), x + 10, y + 25);
        
        // Tooltip logic would go here on hover
    }
};