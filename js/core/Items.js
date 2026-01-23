WoW.Core.Items = {
    // Slot Constants
    SLOTS: {
        HEAD: 'head',
        CHEST: 'chest',
        MAIN_HAND: 'main_hand'
    },

    // Rarity Colors
    RARITY: {
        COMMON: '#ffffff',
        UNCOMMON: '#1eff00',
        RARE: '#0070dd',
        EPIC: '#a335ee'
    },

    // Item Database
    DB: {
        1: {
            id: 1,
            name: "新兵长剑", // Recruit's Sword
            type: 'weapon',
            slot: 'main_hand',
            rarity: 'common',
            iconColor: '#95a5a6',
            stats: { minDmg: 5, maxDmg: 10, str: 2, sta: 5 }
        },
        2: {
            id: 2,
            name: "新兵法杖", // Recruit's Staff
            type: 'weapon',
            slot: 'main_hand',
            rarity: 'common',
            iconColor: '#8e44ad',
            stats: { minDmg: 2, maxDmg: 4, int: 5, sta: 3 }
        },
        3: {
            id: 3,
            name: "甚至没掉落的头盔", // Head
            type: 'armor',
            slot: 'head',
            rarity: 'uncommon',
            iconColor: '#2ecc71',
            stats: { sta: 10, str: 3 }
        },
        4: {
            id: 4,
            name: "熔岩板甲", // Lava Plate
            type: 'armor',
            slot: 'chest',
            rarity: 'epic',
            iconColor: '#e74c3c',
            stats: { sta: 50, str: 20 }
        },
        5: {
            id: 5,
            name: "逐风者之剑", // Thunderfury (Easter egg)
            type: 'weapon',
            slot: 'main_hand',
            rarity: 'epic',
            iconColor: '#f1c40f',
            stats: { minDmg: 100, maxDmg: 200, str: 50, sta: 50 }
        }
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