WoW.Core.Items = {
    // Rarity Colors
    RARITY: {
        COMMON: '#ffffff',
        UNCOMMON: '#1eff00',
        RARE: '#0070dd',
        EPIC: '#a335ee',
        LEGENDARY: '#ff8000' // 传说
    },

    // Item Database
    DB: {
        // Tier 1 Common Items
        1: { id: 1, name: "破旧的短剑", type: 'weapon', slot: WoW.Core.Constants.SLOTS.MAIN_HAND, rarity: 'common', iconColor: '#95a5a6', itemLevel: 1, stats: { minDmg: 5, maxDmg: 10, str: 2, sta: 3 } },
        2: { id: 2, name: "磨损的法杖", type: 'weapon', slot: WoW.Core.Constants.SLOTS.MAIN_HAND, rarity: 'common', iconColor: '#8e44ad', itemLevel: 1, stats: { minDmg: 2, maxDmg: 4, int: 5, sta: 2 } },
        3: { id: 3, name: "粗布头巾", type: 'armor', slot: WoW.Core.Constants.SLOTS.HEAD, rarity: 'common', iconColor: '#d35400', itemLevel: 1, stats: { int: 1, sta: 1 } },
        4: { id: 4, name: "破烂的衬衣", type: 'armor', slot: WoW.Core.Constants.SLOTS.CHEST, rarity: 'common', iconColor: '#cccccc', itemLevel: 1, stats: { sta: 2 } },
        5: { id: 5, name: "简易的戒指", type: 'jewelry', slot: WoW.Core.Constants.SLOTS.FINGER1, rarity: 'common', iconColor: '#f1c40f', itemLevel: 1, stats: { sta: 1 } },

        // Tier 2 Uncommon Items
        101: { id: 101, name: "坚韧之剑", type: 'weapon', slot: WoW.Core.Constants.SLOTS.MAIN_HAND, rarity: 'uncommon', iconColor: '#1eff00', itemLevel: 5, stats: { minDmg: 10, maxDmg: 20, str: 5, sta: 8 } },
        102: { id: 102, name: "奥术法典", type: 'weapon', slot: WoW.Core.Constants.SLOTS.MAIN_HAND, rarity: 'uncommon', iconColor: '#1eff00', itemLevel: 5, stats: { minDmg: 5, maxDmg: 10, int: 10, sta: 5 } },
        103: { id: 103, name: "板甲头盔", type: 'armor', slot: WoW.Core.Constants.SLOTS.HEAD, rarity: 'uncommon', iconColor: '#1abc9c', itemLevel: 5, stats: { str: 5, sta: 10 } },
        104: { id: 104, name: "锁甲护肩", type: 'armor', slot: WoW.Core.Constants.SLOTS.SHOULDER, rarity: 'uncommon', iconColor: '#1abc9c', itemLevel: 5, stats: { agi: 5, sta: 5 } },
        105: { id: 105, name: "秘术师的戒指", type: 'jewelry', slot: WoW.Core.Constants.SLOTS.FINGER2, rarity: 'uncommon', iconColor: '#1eff00', itemLevel: 5, stats: { int: 3, sta: 2 } },
        106: { id: 106, name: "防御者护腕", type: 'armor', slot: WoW.Core.Constants.SLOTS.WRIST, rarity: 'uncommon', iconColor: '#1abc9c', itemLevel: 5, stats: { sta: 7, str: 3 } },

        // Tier 3 Rare Items
        201: { id: 201, name: "大地之斧", type: 'weapon', slot: WoW.Core.Constants.SLOTS.MAIN_HAND, rarity: 'rare', iconColor: '#0070dd', itemLevel: 15, stats: { minDmg: 25, maxDmg: 50, str: 15, sta: 20 } },
        202: { id: 202, name: "灵魂治愈法杖", type: 'weapon', slot: WoW.Core.Constants.SLOTS.MAIN_HAND, rarity: 'rare', iconColor: '#0070dd', itemLevel: 15, stats: { minDmg: 10, maxDmg: 20, int: 25, sta: 10, spirit: 5 } },
        203: { id: 203, name: "勇气头盔", type: 'armor', slot: WoW.Core.Constants.SLOTS.HEAD, rarity: 'rare', iconColor: '#0070dd', itemLevel: 15, stats: { str: 10, sta: 15, agi: 5 } },
        204: { id: 204, name: "智慧项链", type: 'jewelry', slot: WoW.Core.Constants.SLOTS.NECK, rarity: 'rare', iconColor: '#0070dd', itemLevel: 15, stats: { int: 8, sta: 5, spirit: 3 } },

        // Legendary Items (WoW Famous)
        1001: { id: 1001, name: "逐风者之剑", type: 'weapon', slot: WoW.Core.Constants.SLOTS.MAIN_HAND, rarity: 'legendary', iconColor: '#ff8000', itemLevel: 40, stats: { minDmg: 150, maxDmg: 300, str: 50, sta: 50, agi: 30 } },
        1002: { id: 1002, name: "炎魔之手", type: 'weapon', slot: WoW.Core.Constants.SLOTS.MAIN_HAND, rarity: 'legendary', iconColor: '#ff8000', itemLevel: 50, stats: { minDmg: 200, maxDmg: 400, str: 100, sta: 70, fireRes: 20 } }
    },

    // Factory to create a specific item instance
    create: function(id) {
        const template = this.DB[id];
        if (!template) return null;
        return {
            ...template,
            uid: Math.random().toString(36).substr(2, 9) // Unique ID for instance
        };
    }
};