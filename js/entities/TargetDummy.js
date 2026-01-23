WoW.Content.TargetDummy = class extends WoW.Entities.Unit {
    constructor(x, y) {
        super(x, y, 48, 64, WoW.Core.Constants.COLORS.DUMMY);
        this.name = "训练假人"; 
        this.maxHp = 100000;
        this.hp = 100000;
        this.speed = 0;
        this.minDmg = 50;
        this.maxDmg = 80;
    }
    
    update(dt) {
        super.update(dt);
    }
};