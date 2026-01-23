WoW.Core.EventEmitter = function() {
    const listeners = {};

    return {
        on: function(event, callback) {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(callback);
        },
        emit: function(event, data) {
            if (listeners[event]) {
                listeners[event].forEach(cb => cb(data));
            }
        }
    };
};