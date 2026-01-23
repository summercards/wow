WoW.Core.Input = function() {
    const keys = {};
    
    window.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].indexOf(e.code) > -1) {
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });

    return {
        isDown: function(key) {
            return !!keys[key.toLowerCase()];
        }
    };
};