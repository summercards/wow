/**
 * @file Input.js
 * @brief 负责处理用户的键盘输入，并提供查询按键状态的方法。
 *        这是一个单例模式，确保只有一个输入管理器监听全局事件。
 */
WoW.Core.Input = function() {
    /** @property {object<string, boolean>} keys 存储当前所有按键的状态 (true:按下, false:抬起)。 */
    const keys = {};
    
    // 监听键盘按下事件
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        keys[key] = true;
        // 阻止默认行为，防止浏览器滚动、Tab 键切换焦点、F键打开菜单等干扰游戏操作。
        if(['arrowup','arrowdown','arrowleft','arrowright',' ','tab','6','7','8','9','0','r'].indexOf(key) > -1) {
            e.preventDefault();
        }
    });

    // 监听键盘抬起事件
    window.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });

    /**
     * 提供公共接口，用于查询某个键是否被按下。
     * @returns {object} 包含 `isDown` 方法的对象。
     */
    return {
        /**
         * 检查指定的键是否处于按下状态。
         * @param {string} key 要检查的键名 (例如: 'w', 'tab')。
         * @returns {boolean} 如果键被按下则返回 true，否则返回 false。
         */
        isDown: function(key) {
            return !!keys[key.toLowerCase()];
        }
    };
};