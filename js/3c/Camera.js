// Camera System
WoW.Core.Camera = class {
    constructor() {
        this.x = 0;
        this.y = 0;
    }
    
    follow(target) {
        this.x = target.x - WoW.Core.Constants.CANVAS_WIDTH / 2;
        this.y = target.y - WoW.Core.Constants.CANVAS_HEIGHT / 2;
    }
};