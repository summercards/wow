// Controller System
WoW.Core.Controller = class {
    constructor(input) {
        this.input = input;
    }
    
    getIntent() {
        const intent = { dx: 0, dy: 0, actions: [] };
        
        if (this.input.isDown('w')) intent.dy -= 1;
        if (this.input.isDown('s')) intent.dy += 1;
        if (this.input.isDown('a')) intent.dx -= 1;
        if (this.input.isDown('d')) intent.dx += 1;
        
        if (this.input.isDown('1')) intent.actions.push('SKILL_1');
        if (this.input.isDown('2')) intent.actions.push('SKILL_2');
        if (this.input.isDown('3')) intent.actions.push('SKILL_3');
        
        return intent;
    }
};