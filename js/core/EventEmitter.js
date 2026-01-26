/**
 * @file EventEmitter.js
 * @brief 实现一个简单的事件发射器 (Event Emitter) 模式。
 *        允许不同模块之间进行解耦通信，一个模块可以监听某个事件，另一个模块可以触发该事件并传递数据。
 */
WoW.Core.EventEmitter = function() {
    /** @property {object<string, Array<function>>} listeners 存储所有事件监听器。
     *                            键是事件名称 (string)，值是回调函数数组 (Array<function>)。
     */
    const listeners = {};

    /**
     * 返回事件发射器的公共接口。
     * @returns {object} 包含 `on` 和 `emit` 方法的对象。
     */
    return {
        /**
         * 注册一个事件监听器。
         * @param {string} event 要监听的事件名称。
         * @param {function} callback 事件触发时要执行的回调函数。
         */
        on: function(event, callback) {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(callback);
        },
        /**
         * 触发一个事件，并向所有监听器传递数据。
         * @param {string} event 要触发的事件名称。
         * @param {*} data 传递给监听器的数据。
         */
        emit: function(event, data) {
            if (listeners[event]) {
                listeners[event].forEach(cb => cb(data));
            }
        }
    };
};