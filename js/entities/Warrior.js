WoW.Content.Warrior = class extends WoW.Entities.Unit {
    constructor(x, y) {
        super(x, y, 32, 32, WoW.Core.Constants.COLORS.WARRIOR);
        this.name = "战士"; 
        
        // Set base attributes for Warrior
        this.baseStr = 20; // 战士拥有高力量
        this.baseAgi = 10; // 战士的敏捷相对较低
        this.baseSta = 25; // 战士拥有高耐力
        this.baseInt = 5;  // 战士的智力较低
        this.baseSpirit = 5; // 战士的精神较低

        // Set resource type and base max for rage
        this.resourceType = 'rage';
        this.baseMaxResource = 100; // 怒气上限固定100
        this.resource = 0; // 怒气开局为0

        this.skills = {
            1: { 
                id: 1, 
                name: '冲锋', // Charge
                castType: 'target',
                cost: 0, // 冲锋不消耗怒气，反而会生成怒气
                rangeMin: 0,   
                rangeMax: 800, 
                cd: 15, 
                currentCd: 0, 
                color: '#a52a2a' 
            },
            2: { 
                id: 2, 
                name: '嘲讽', // Taunt
                castType: 'target',
                cost: 10, // 嘲讽消耗10怒气
                rangeMin: 0, 
                rangeMax: 200, 
                cd: 8, 
                currentCd: 0, 
                color: '#ff4500' 
            },
            3: { 
                id: 3, 
                name: '盾墙', // Shield Wall
                castType: 'self',
                cost: 30, // 盾墙消耗30怒气
                rangeMin: 0, 
                rangeMax: 0, 
                cd: 60, 
                currentCd: 0, 
                color: '#808080' 
            }
        };

        // Recalculate stats after all base properties are set
        this.recalcStats();
    }

    update(dt) {
        super.update(dt);
        for (let k in this.skills) {
            if (this.skills[k].currentCd > 0) this.skills[k].currentCd -= dt;
        }
        // Rage Decay: Decays if out of combat (simplified here as always decaying slowly if > 0)
        // In real WoW, decay happens after being out of combat for a bit. 
        // For simplicity, we just decay slowly constantly if not gaining.
        if (this.resource > 0) this.resource -= 1 * dt; 
        this.resource = Math.max(0, this.resource);
    }

    addResource(amount) {
        this.resource = WoW.Core.Utils.clamp(this.resource + amount, 0, this.maxResource);
    }
};