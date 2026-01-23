WoW.Content.Warrior = class extends WoW.Entities.Unit {
    constructor(x, y) {
        super(x, y, 32, 32, WoW.Core.Constants.COLORS.WARRIOR);
        this.name = "Warrior";
        this.maxHp = 1500;
        this.hp = 1500;
        
        this.rage = 0;
        this.maxRage = 100;
        
        this.skills = {
            1: { 
                id: 1, 
                name: 'Charge', 
                castType: 'target',
                cost: 0, 
                rangeMin: 0,   // Remove min range to make it feel responsive even close up (just generates rage)
                rangeMax: 800, // Covers entire screen
                cd: 15, 
                currentCd: 0, 
                color: '#a52a2a' 
            },
            2: { 
                id: 2, 
                name: 'Taunt', 
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
                name: 'Shield Wall', 
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
        if (this.rage > 0) this.rage -= 2 * dt;
    }

    addRage(amount) {
        this.rage = WoW.Core.Utils.clamp(this.rage + amount, 0, this.maxRage);
    }
};