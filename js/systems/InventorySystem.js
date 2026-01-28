WoW.Systems.InventorySystem = class {
    constructor(input) {
        this.input = input;
        this.isOpen = false;
        this.draggedItem = null; 
        
        this.PANEL_X = 50;
        this.PANEL_Y = 50;
        this.PANEL_W = 700;
        this.PANEL_H = 500;
        
        this.SLOT_SIZE = 40;
        this.SLOT_GAP = 5;

        this.lastIToggle = false;
    }

    update(player) {
        const iDown = this.input.isDown('i');
        if (iDown && !this.lastIToggle) {
            this.isOpen = !this.isOpen;
        }
        this.lastIToggle = iDown;
    }

    equipItem(unit, bagIndex) {
        const item = unit.inventory[bagIndex];
        if (!item) return;

        const slot = item.slot;
        if (!slot || !unit.equipment.hasOwnProperty(slot)) {
            console.log(`无法装备 ${item.name}：无效或不支持的槽位 ${slot}。`);
            return;
        }

        const currentEquip = unit.equipment[slot];

        unit.equipment[slot] = item;
        unit.inventory[bagIndex] = currentEquip; 

        unit.recalcStats();
        console.log(`装备了 ${item.name}。`);
    }

    unequipItem(unit, slotName) {
        const item = unit.equipment[slotName];
        if (!item) return;

        const emptyIndex = unit.inventory.findIndex(i => i === null);
        if (emptyIndex === -1) {
            console.log("背包已满，无法卸下！");
            return;
        }

        unit.inventory[emptyIndex] = item;
        unit.equipment[slotName] = null;
        
        unit.recalcStats();
        console.log(`卸下了 ${item.name}。`);
    }

    handleClick(x, y, unit) {
        if (!this.isOpen) return false;

        // Check Bag Slots
        const bagAreaX = this.PANEL_X + this.PANEL_W - 20 - (4 * (this.SLOT_SIZE + this.SLOT_GAP)); 
        const bagAreaY = this.PANEL_Y + 50;

        for (let i = 0; i < 16; i++) {
            const col = i % 4;
            const row = Math.floor(i / 4);
            const bx = bagAreaX + col * (this.SLOT_SIZE + this.SLOT_GAP);
            const by = bagAreaY + row * (this.SLOT_SIZE + this.SLOT_GAP);

            if (x >= bx && x <= bx + this.SLOT_SIZE && y >= by && y <= by + this.SLOT_SIZE) {
                if (unit.inventory[i]) {
                    this.equipItem(unit, i);
                }
                return true;
            }
        }

        // Check Equipment Slots
        const equipSlotPositions = this.getEquipSlotPositions();

        for (const slotName in equipSlotPositions) {
            const pos = equipSlotPositions[slotName];
            if (x >= pos.x && x <= pos.x + this.SLOT_SIZE && y >= pos.y && y <= pos.y + this.SLOT_SIZE) {
                if (unit.equipment[slotName]) {
                    this.unequipItem(unit, slotName);
                }
                return true;
            }
        }

        return false;
    }

    getEquipSlotPositions() {
        const slots = WoW.Core.Constants.SLOTS;
        const SX = this.PANEL_X; 
        const SY = this.PANEL_Y; 
        const SS = this.SLOT_SIZE; 
        const SG = this.SLOT_GAP; 

        return {
            [slots.HEAD]:     { x: SX + 150, y: SY + 50, label: "头部" },
            [slots.SHOULDER]: { x: SX + 150, y: SY + 50 + (SS + SG), label: "肩部" },
            [slots.CHEST]:    { x: SX + 150, y: SY + 50 + 2 * (SS + SG), label: "胸部" },
            [slots.WRIST]:    { x: SX + 90, y: SY + 50 + 3 * (SS + SG), label: "手腕" },
            [slots.HANDS]:    { x: SX + 150, y: SY + 50 + 3 * (SS + SG), label: "手" },
            [slots.WAIST]:    { x: SX + 150, y: SY + 50 + 4 * (SS + SG), label: "腰部" },
            [slots.LEGS]:     { x: SX + 150, y: SY + 50 + 5 * (SS + SG), label: "腿部" },
            [slots.FEET]:     { x: SX + 150, y: SY + 50 + 6 * (SS + SG), label: "脚部" },
            [slots.NECK]:     { x: SX + 90, y: SY + 50, label: "项链" },
            [slots.FINGER1]:  { x: SX + 210, y: SY + 50 + 2 * (SS + SG), label: "戒指1" },
            [slots.FINGER2]:  { x: SX + 210, y: SY + 50 + 3 * (SS + SG), label: "戒指2" },
            [slots.TRINKET1]: { x: SX + 210, y: SY + 50 + 4 * (SS + SG), label: "饰品1" },
            [slots.TRINKET2]: { x: SX + 210, y: SY + 50 + 5 * (SS + SG), label: "饰品2" },
            [slots.MAIN_HAND]:{ x: SX + 90, y: SY + 50 + 5 * (SS + SG), label: "主手" },
            [slots.OFF_HAND]: { x: SX + 210, y: SY + 50 + 6 * (SS + SG), label: "副手" },
            [slots.RANGED]:   { x: SX + 90, y: SY + 50 + 6 * (SS + SG), label: "远程" }
        };
    }

    draw(ctx, unit) {
        if (!this.isOpen) return;

        ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
        ctx.fillRect(this.PANEL_X, this.PANEL_Y, this.PANEL_W, this.PANEL_H);
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.PANEL_X, this.PANEL_Y, this.PANEL_W, this.PANEL_H);

        ctx.fillStyle = "#fff";
        ctx.font = "24px Microsoft YaHei";
        ctx.fillText(`${unit.name} - 属性`, this.PANEL_X + 20, this.PANEL_Y + 30);
        
        // Equipment Slots
        const equipSlotPositions = this.getEquipSlotPositions();
        for (const slotName in equipSlotPositions) {
            const pos = equipSlotPositions[slotName];
            this.drawEquipSlot(ctx, unit, slotName, pos.x, pos.y, pos.label);
        }

        // Attributes Display
        ctx.font = "14px Microsoft YaHei";
        let attrX = this.PANEL_X + 30;
        let attrY = this.PANEL_Y + 70;
        ctx.fillStyle = "#fff";
        ctx.fillText(`力量: ${unit.currentStr}`, attrX, attrY);
        ctx.fillText(`敏捷: ${unit.currentAgi}`, attrX, attrY + 20);
        ctx.fillText(`耐力: ${unit.currentSta}`, attrX, attrY + 40);
        ctx.fillText(`智力: ${unit.currentInt}`, attrX, attrY + 60);
        ctx.fillText(`精神: ${unit.currentSpirit}`, attrX, attrY + 80);

        attrY = this.PANEL_Y + 200; 
        ctx.fillText(`生命值: ${Math.floor(unit.hp)} / ${unit.maxHp}`, attrX, attrY);
        ctx.fillText(`资源: ${Math.floor(unit.resource)} / ${unit.maxResource}`, attrX, attrY + 20);
        ctx.fillText(`伤害: ${unit.minDmg} - ${unit.maxDmg}`, attrX, attrY + 40);

        // Bag (Right Side)
        ctx.fillStyle = "#fff";
        ctx.font = "24px Microsoft YaHei";
        ctx.fillText("背包", this.PANEL_X + this.PANEL_W - 200, this.PANEL_Y + 30);

        const bagAreaX = this.PANEL_X + this.PANEL_W - 20 - (4 * (this.SLOT_SIZE + this.SLOT_GAP));
        const bagAreaY = this.PANEL_Y + 50;
        
        for (let i = 0; i < 16; i++) {
            const col = i % 4;
            const row = Math.floor(i / 4);
            const bx = bagAreaX + col * (this.SLOT_SIZE + this.SLOT_GAP);
            const by = bagAreaY + row * (this.SLOT_SIZE + this.SLOT_GAP);
            
            const item = unit.inventory[i];
            this.drawItemSlot(ctx, bx, by, item);
        }
    }

    drawEquipSlot(ctx, unit, slotName, x, y, label) {
        const item = unit.equipment[slotName];
        
        ctx.fillStyle = "#222";
        ctx.fillRect(x, y, this.SLOT_SIZE, this.SLOT_SIZE);
        ctx.strokeStyle = "#555";
        ctx.strokeRect(x, y, this.SLOT_SIZE, this.SLOT_SIZE);

        if (item) {
            this.drawItemIcon(ctx, x, y, item);
        } else {
            ctx.fillStyle = "#444";
            ctx.font = "10px Microsoft YaHei";
            ctx.fillText(label, x + 5, y + this.SLOT_SIZE / 2 + 5);
        }
    }

    drawItemSlot(ctx, x, y, item) {
        ctx.fillStyle = "#222";
        ctx.fillRect(x, y, this.SLOT_SIZE, this.SLOT_SIZE);
        ctx.strokeStyle = "#555";
        ctx.strokeRect(x, y, this.SLOT_SIZE, this.SLOT_SIZE);
        
        if (item) {
            this.drawItemIcon(ctx, x, y, item);
        }
    }

    drawItemIcon(ctx, x, y, item) {
        // Extra safety checks for item properties
        if (!item || !item.rarity || !item.name) return; 

        const rarityColor = WoW.Core.Items.RARITY[item.rarity.toUpperCase()] || WoW.Core.Items.RARITY.COMMON;
        ctx.strokeStyle = rarityColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, this.SLOT_SIZE, this.SLOT_SIZE);

        // Try to draw icon from AssetLoader
        const assets = WoW.Core.Assets;
        // Default to 'icon_sword' if not specified, or based on type
        let iconKey = item.icon || 'icon_sword';
        // Simple mapping based on slot if icon missing (optional improvement)
        if (!item.icon) {
             if (item.slot === 'head') iconKey = 'icon_helm';
        }

        const img = assets.getImage(iconKey);

        if (img) {
            ctx.drawImage(img, x + 2, y + 2, this.SLOT_SIZE - 4, this.SLOT_SIZE - 4);
        } else {
            // Fallback
            ctx.fillStyle = item.iconColor || '#888';
            ctx.fillRect(x + 2, y + 2, this.SLOT_SIZE - 4, this.SLOT_SIZE - 4);
            
            ctx.fillStyle = "#000";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(item.name.charAt(0), x + this.SLOT_SIZE / 2, y + this.SLOT_SIZE / 2);
        }
        
        // Item Level (Small text in corner)
        if (item.itemLevel !== undefined) {
            ctx.fillStyle = "#fff";
            ctx.font = "8px Arial";
            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";
            ctx.fillText(item.itemLevel, x + 2, y + this.SLOT_SIZE - 4); 
        }
    }
};