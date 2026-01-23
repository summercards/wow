WoW.Core.Utils = {
    getDistance: function(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    },
    getCenterDistance: function(a, b) {
        const cx1 = a.x + a.width / 2;
        const cy1 = a.y + a.height / 2;
        const cx2 = b.x + b.width / 2;
        const cy2 = b.y + b.height / 2;
        return Math.sqrt((cx1 - cx2) ** 2 + (cy1 - cy2) ** 2);
    },
    clamp: function(val, min, max) {
        return Math.min(Math.max(val, min), max);
    }
};