WoW.Core.Constants = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    TILE_SIZE: 32,
    COLORS: {
        BG: '#151515',
        FLOOR: '#2a1a1a',
        WARRIOR: '#C79C6E',
        WARRIOR_RAGE: '#C41F3B',
        DUMMY: '#8B4513',
        TEXT_DMG: '#ffeb3b',
        TEXT_HEAL: '#4caf50',
        UI_BG: 'rgba(0, 0, 0, 0.8)',
        BORDER: '#444'
    }
};

WoW.Core.Utils = {
    getDistance: function(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    },
    clamp: function(val, min, max) {
        return Math.min(Math.max(val, min), max);
    }
};