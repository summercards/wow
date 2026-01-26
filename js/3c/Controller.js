/**
 * @file Controller.js
 * @brief 玩家输入控制器，负责将原始的键盘按键事件转换为游戏中的意图 (Intent)。
 *        这使得游戏逻辑与具体的输入方式解耦。
 */
WoW.Core.Controller = class {
    /**
     * 构造函数，初始化控制器并绑定输入管理器。
     * @param {WoW.Core.Input} input 游戏的核心输入管理器实例。
     */
    constructor(input) {
        this.input = input;
    }
    
    /**
     * 获取当前帧的玩家意图。
     * 意图包含移动方向 (dx, dy) 和触发的动作列表 (actions)。
     * @returns {object} 包含 `dx`, `dy` (移动方向) 和 `actions` (动作列表) 的意图对象。
     */
    getIntent() {
        const intent = { dx: 0, dy: 0, actions: [] };
        
        // --- 移动输入 (WASD) ---
        if (this.input.isDown('w')) intent.dy -= 1;
        if (this.input.isDown('s')) intent.dy += 1;
        if (this.input.isDown('a')) intent.dx -= 1;
        if (this.input.isDown('d')) intent.dx += 1;
        
        // --- 技能/交互动作 ---
        if (this.input.isDown('1')) intent.actions.push('SKILL_1');
        if (this.input.isDown('2')) intent.actions.push('SKILL_2');
        if (this.input.isDown('3')) intent.actions.push('SKILL_3');
        /**
         * @constant {string} ACTION_NEXT_TARGET 切换目标的动作标识。
         *                             每次按下 Tab 键时触发。
         */
        if (this.input.isDown('tab')) intent.actions.push('ACTION_NEXT_TARGET');
        /**
         * @constant {string} ACTION_NEXT_PARTY_TARGET 切换队友目标的动作标识。
         *                             每次按下 'r' 键时触发。
         */
        if (this.input.isDown('r')) intent.actions.push('ACTION_NEXT_PARTY_TARGET');

        // --- 职业切换 (6-0 数字键) ---
        if (this.input.isDown('6')) intent.actions.push('SWITCH_CAREER_1');
        if (this.input.isDown('7')) intent.actions.push('SWITCH_CAREER_2');
        if (this.input.isDown('8')) intent.actions.push('SWITCH_CAREER_3');
        if (this.input.isDown('9')) intent.actions.push('SWITCH_CAREER_4');
        if (this.input.isDown('0')) intent.actions.push('SWITCH_CAREER_5');

        return intent;
    }
};