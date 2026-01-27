/**
 * @file Input.js
 * @brief 负责处理用户的键盘输入，并提供查询按键状态的方法。
 *        这是一个单例模式，确保只有一个输入管理器监听全局事件。
 */
WoW.Core.Input = function() {
    /** @property {object<string, boolean>} keys 存储当前所有按键的状态 (true:按下, false:抬起)。 */
    const keys = {};
    
    /** @property {object<string, boolean>} keysPressed 存储在当前帧刚刚按下的键（防抖动）。 */
    const keysPressed = {};
    
    /** @property {object<string, Function>} keyCallbacks 存储按键按下时的回调函数。 */
    const keyCallbacks = {};
    
    // 监听键盘按下事件
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        keys[key] = true;
        keysPressed[key] = true;
        
        // 阻止默认行为，防止浏览器滚动、Tab 键切换焦点、F键打开菜单等干扰游戏操作。
        if(['arrowup','arrowdown','arrowleft','arrowright',' ','tab','6','7','8','9','0','r','`'].indexOf(key) > -1) {
            e.preventDefault();
        }
        
        // 执行按键回调
        if (keyCallbacks[key] && !e.repeat) {
            keyCallbacks[key]();
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
        },
        
        /**
         * 检查指定的键是否在当前帧刚刚被按下（防重复触发）。
         * @param {string} key 要检查的键名。
         * @returns {boolean} 如果键刚刚被按下则返回 true，否则返回 false。
         */
        isPressed: function(key) {
            return !!keysPressed[key.toLowerCase()];
        },
        
        /**
         * 清除当前帧的按键按下状态（应在每帧结束时调用）。
         */
        resetPressed: function() {
            for (let key in keysPressed) {
                keysPressed[key] = false;
            }
        },
        
        /**
         * 注册按键按下时的回调函数。
         * @param {string} key 按键名称。
         * @param {Function} callback 回调函数。
         */
        onKeyPress: function(key, callback) {
            keyCallbacks[key.toLowerCase()] = callback;
        }
    };
};
