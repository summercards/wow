/**
 * @file Utils.js
 * @brief 包含各种常用的工具函数，如距离计算和数值钳制。
 */
WoW.Core.Utils = {
    /**
     * 计算两个矩形（或点）左上角坐标之间的直线距离。
     * @param {object} a 包含 x, y 属性的对象。
     * @param {object} b 包含 x, y 属性的对象。
     * @returns {number} 两个对象之间的直线距离。
     */
    getDistance: function(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    },

    /**
     * 计算两个矩形（或单位）中心点之间的直线距离。
     * 对于游戏中的单位，中心点距离通常比左上角距离更符合直觉。
     * @param {object} a 包含 x, y, width, height 属性的对象。
     * @param {object} b 包含 x, y, width, height 属性的对象。
     * @returns {number} 两个对象中心点之间的直线距离。
     */
    getCenterDistance: function(a, b) {
        const cx1 = a.x + a.width / 2;
        const cy1 = a.y + a.height / 2;
        const cx2 = b.x + b.width / 2;
        const cy2 = b.y + b.height / 2;
        return Math.sqrt((cx1 - cx2) ** 2 + (cy1 - cy2) ** 2);
    },

    /**
     * 将一个数值钳制在指定的最小值和最大值之间。
     * @param {number} val 要钳制的数值。
     * @param {number} min 最小值。
     * @param {number} max 最大值。
     * @returns {number} 钳制后的数值。
     */
    clamp: function(val, min, max) {
        return Math.min(Math.max(val, min), max);
    }
};