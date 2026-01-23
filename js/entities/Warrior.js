WoW.Content.Warrior = class extends WoW.Entities.Unit {
    constructor(x, y) {
        super(x, y, 32, 32, WoW.Core.Constants.COLORS.WARRIOR);
        this.name = "战士"; 
        this.maxHp = 1500;
        this.hp = 1500;
        
        // Unified Resource System
        this.resourceType = 'rage';
        this.maxResource = 100;
        this.resource = 0;
        
        this.skills = {
            1: { 
                id: 1, 
                name: '冲锋', 
                castType: 'target',
                cost: 0, 
                rangeMin: 0,   
                rangeMax: 800, 
                cd: 15, 
                currentCd: 0, 
                color: '#a52a2a' 
            },
            2: { 
                id: 2, 
                name: '嘲讽', 
                castType: 'target',
                cost: 0, 
                rangeMin: 0, 
                rangeMax: 200, 
                cd: 8, 
                currentCd: 0, 
                color: '#ff4500' 
            },
            3: { 
                id: 3, 
                name: '盾墙', 
                castType: 'self',
                cost: 0, 
                rangeMin: 0, 
                rangeMax: 0, 
                cd: 60, 
                currentCd: 0, 
                color: '#808080' 
            }
        };
    }

    update(dt) {
        super.update(dt);
        for (let k in this.skills) {
            if (this.skills[k].currentCd > 0) this.skills[k].currentCd -= dt;
        }
        // Rage Decay
        if (this.resource > 0) this.resource -= 2 * dt;
        this.resource = Math.max(0, this.resource);
    }

    addResource(amount) {
        this.resource = WoW.Core.Utils.clamp(this.resource + amount, 0, this.maxResource);
    }
};