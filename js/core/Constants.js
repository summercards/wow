/**
 * @file Constants.js
 * @brief 包含游戏中的所有常量定义，如画布尺寸、颜色、装备槽位、属性名称等。
 *        所有模块应从这里获取常量，以确保一致性。
 */
WoW.Core.Constants = {
    /** @property {number} CANVAS_WIDTH 游戏画布的宽度。 */
    CANVAS_WIDTH: 800,
    /** @property {number} CANVAS_HEIGHT 游戏画布的高度。 */
    CANVAS_HEIGHT: 600,
    /** @property {number} TILE_SIZE 游戏中的基础瓦片大小（像素风格单位）。 */
    TILE_SIZE: 32,

    /**
     * @property {object} SLOTS 定义所有魔兽世界风格的装备槽位。
     *                  这些槽位用于 `Unit` 类的 `equipment` 对象和 `Items` 数据库。
     */
    SLOTS: {
        HEAD: 'head',
        SHOULDER: 'shoulder',
        CHEST: 'chest',
        WRIST: 'wrist',
        HANDS: 'hands',
        WAIST: 'waist',
        LEGS: 'legs',
        FEET: 'feet',
        NECK: 'neck',
        FINGER1: 'finger1',
        FINGER2: 'finger2',
        TRINKET1: 'trinket1',
        TRINKET2: 'trinket2',
        MAIN_HAND: 'main_hand',
        OFF_HAND: 'off_hand', // 用于未来的盾牌/副手武器
        RANGED: 'ranged' // 用于未来的弓/魔杖等远程武器
    },

    /**
     * @property {object} ATTRIBUTES 定义角色的基础属性名称。
     *                       这些属性直接影响角色的战斗能力和资源池。
     */
    ATTRIBUTES: {
        STRENGTH: 'str',
        AGILITY: 'agi',
        STAMINA: 'sta',
        INTELLECT: 'int',
        SPIRIT: 'spirit'
    },

    /**
     * @property {object} COLORS 定义游戏中使用的各种颜色代码。
     *                      包括背景、地面、职业颜色、UI 颜色和飘字颜色。
     */
    COLORS: {
        BG: '#151515', // 背景色
        FLOOR: '#2a1a1a', // 地面/副本颜色
        WARRIOR: '#C79C6E', // 战士角色颜色 (魔兽世界棕褐色)
        MAGE: '#69CCF0', // 法师角色颜色 (浅蓝色)
        PRIEST: '#FFFFFF', // 牧师角色颜色 (白色)
        ROGUE: '#FFF569', // 盗贼角色颜色 (黄色)
        HUNTER: '#ABD473', // 猎人角色颜色 (绿色)
        WARRIOR_RAGE: '#C41F3B', // 战士怒气条颜色 (红色)
        ROGUE_ENERGY: '#FFFF00', // 盗悟能量条颜色 (黄色)
        HUNTER_FOCUS: '#FF7D0A', // 猎人专注条颜色 (橙色)
        DUMMY: '#8B4513', // 训练假人颜色
        TEXT_DMG: '#ffeb3b', // 飘字伤害文字颜色
        TEXT_HEAL: '#4caf50', // 飘字治疗文字颜色
        UI_BG: 'rgba(0, 0, 0, 0.8)', // UI 面板背景色
        BORDER: '#444' // UI 边框颜色
    }
};