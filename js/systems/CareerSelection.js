/**
 * @file CareerSelection.js
 * @brief 职业选择界面系统，允许玩家在游戏开始时选择要控制的职业。
 */
WoW.Systems.CareerSelection = class {
    constructor() {
        /** @property {boolean} isOpen 职业选择界面是否打开 */
        this.isOpen = true;

        /** @property {string|null} selectedCareer 选中的职业 */
        this.selectedCareer = null;

        /** @property {object} CAREERS 职业数据配置 */
        this.CAREERS = {
            warrior: {
                id: 'warrior',
                name: '战士',
                color: WoW.Core.Constants.COLORS.WARRIOR,
                description: '坦克职业，高血量高防御',
                resource: '怒气',
                skills: ['冲锋', '嘲讽', '盾墙'],
                icon: '🛡️'
            },
            mage: {
                id: 'mage',
                name: '法师',
                color: '#3498db',
                description: '远程法术输出，高爆发',
                resource: '法力',
                skills: ['火球术', '火焰冲击', '冰霜新星'],
                icon: '🔥'
            },
            priest: {
                id: 'priest',
                name: '牧师',
                color: '#ffffff',
                description: '治疗/辅助职业，为队友提供治疗与护盾',
                resource: '法力',
                skills: ['治疗术', '真言术：盾', '神圣新星'],
                icon: '✨'
            },
            rogue: {
                id: 'rogue',
                name: '盗贼',
                color: WoW.Core.Constants.COLORS.ROGUE,
                description: '近战爆发，擅长背身攻击',
                resource: '能量',
                skills: ['影袭', '剔骨', '疾跑'],
                icon: '🗡️'
            },
            hunter: {
                id: 'hunter',
                name: '猎人',
                color: WoW.Core.Constants.COLORS.HUNTER,
                description: '远程物理输出，高敏捷',
                resource: '专注',
                skills: ['奥术射击', '稳固射击', '震荡射击'],
                icon: '🏹'
            }
        };

        // 界面布局配置
        this.PANEL_X = 100;
        this.PANEL_Y = 100;
        this.PANEL_W = 600;
        this.PANEL_H = 500;

        this.CAREER_CARD_W = 250;
        this.CAREER_CARD_H = 180;
        this.CAREER_GAP = 30;

        this.careerNames = Object.keys(this.CAREERS);
        this.selectedIndex = 0;
        this.blockInputUntil = null;
    }

    /**
     * 更新职业选择界面状态
     * @param {WoW.Core.Input} input 输入管理器
     * @returns {boolean} 如果职业已选择并确认，返回true
     */
    update(input) {
        if (!this.isOpen) return false;

        // 检查输入是否被阻塞
        if (this.blockInputUntil && Date.now() < this.blockInputUntil) {
            return false;
        }
        this.blockInputUntil = null;

        // 左右方向键切换职业
        if (input.isDown('arrowleft')) {
            this.selectedIndex = (this.selectedIndex - 1 + this.careerNames.length) % this.careerNames.length;
            this.blockInputUntil = Date.now() + 200; // 防止快速切换
            console.log('Career selection: left arrow, index =', this.selectedIndex);
        }
        if (input.isDown('arrowright')) {
            this.selectedIndex = (this.selectedIndex + 1) % this.careerNames.length;
            this.blockInputUntil = Date.now() + 200;
            console.log('Career selection: right arrow, index =', this.selectedIndex);
        }

        // Enter键确认选择
        if (input.isDown('enter') || input.isDown('return')) {
            this.selectedCareer = this.careerNames[this.selectedIndex];
            this.isOpen = false;
            console.log('Career selected:', this.selectedCareer);
            return true;
        }

        return false;
    }

    /**
     * 绘制职业选择界面
     * @param {CanvasRenderingContext2D} ctx Canvas渲染上下文
     */
    draw(ctx) {
        if (!this.isOpen) return;

        // 半透明遮罩背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        if (ctx && ctx.canvas) {
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        } else {
            // Fallback
            ctx.fillRect(0, 0, 800, 600);
        }

        // 面板背景
        ctx.fillStyle = 'rgba(30, 30, 30, 0.95)';
        ctx.fillRect(this.PANEL_X, this.PANEL_Y, this.PANEL_W, this.PANEL_H);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.PANEL_X, this.PANEL_Y, this.PANEL_W, this.PANEL_H);

        // 标题
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.fillText('选择你的职业', this.PANEL_X + this.PANEL_W / 2, this.PANEL_Y + 50);

        // 绘制职业卡片
        const centerX = this.PANEL_X + this.PANEL_W / 2;
        const centerY = this.PANEL_Y + this.PANEL_H / 2 + 20;

        // 绘制当前选中的职业（大卡片）
        this.drawCareerCard(ctx, this.selectedIndex, centerX - this.CAREER_CARD_W / 2, centerY - this.CAREER_CARD_H / 2, true);

        // 绘制左右箭头
        this.drawArrow(ctx, centerX - this.CAREER_CARD_W / 2 - 40, centerY, 'left');
        this.drawArrow(ctx, centerX + this.CAREER_CARD_W / 2 + 40, centerY, 'right');

        // 提示文字
        ctx.fillStyle = '#aaa';
        ctx.font = '18px Microsoft YaHei';
        ctx.fillText('按 ← → 切换职业 | 按 Enter 确认选择', centerX, this.PANEL_Y + this.PANEL_H - 30);

        // 快捷键提示
        ctx.fillStyle = '#888';
        ctx.font = '14px Microsoft YaHei';
        ctx.fillText('游戏中按 6-0 快速切换职业', centerX, this.PANEL_Y + this.PANEL_H - 10);

        ctx.textAlign = 'left'; // 恢复默认对齐
    }

    /**
     * 绘制职业卡片
     * @param {CanvasRenderingContext2D} ctx Canvas渲染上下文
     * @param {number} index 职业索引
     * @param {number} x X坐标
     * @param {number} y Y坐标
     * @param {boolean} isSelected 是否为选中状态
     */
    drawCareerCard(ctx, index, x, y, isSelected) {
        const careerKey = this.careerNames[index];
        const career = this.CAREERS[careerKey];

        // 卡片背景
        ctx.fillStyle = isSelected ? 'rgba(50, 50, 50, 0.95)' : 'rgba(40, 40, 40, 0.8)';
        ctx.fillRect(x, y, this.CAREER_CARD_W, this.CAREER_CARD_H);

        // 选中状态边框
        if (isSelected) {
            ctx.strokeStyle = career.color;
            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, this.CAREER_CARD_W, this.CAREER_CARD_H);
        } else {
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, this.CAREER_CARD_W, this.CAREER_CARD_H);
        }

        // 职业图标
        ctx.font = isSelected ? 'bold 60px Arial' : 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = career.color;
        ctx.fillText(career.icon, x + this.CAREER_CARD_W / 2, y + 70);

        // 职业名称
        ctx.font = 'bold 28px Microsoft YaHei';
        ctx.fillStyle = '#fff';
        ctx.fillText(career.name, x + this.CAREER_CARD_W / 2, y + 110);

        // 资源类型
        ctx.font = '16px Microsoft YaHei';
        ctx.fillStyle = '#aaa';
        ctx.fillText(`资源: ${career.resource}`, x + this.CAREER_CARD_W / 2, y + 135);

        // 技能列表
        ctx.font = '14px Microsoft YaHei';
        ctx.fillStyle = '#888';
        const skillsText = career.skills.join(' / ');
        ctx.fillText(skillsText, x + this.CAREER_CARD_W / 2, y + 160);
    }

    /**
     * 绘制箭头
     * @param {CanvasRenderingContext2D} ctx Canvas渲染上下文
     * @param {number} x X坐标
     * @param {number} y Y坐标
     * @param {string} direction 箭头方向 'left' 或 'right'
     */
    drawArrow(ctx, x, y, direction) {
        ctx.fillStyle = '#666';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        const arrow = direction === 'left' ? '◀' : '▶';
        ctx.fillText(arrow, x, y + 15);
    }

    /**
     * 获取选中的职业ID
     * @returns {string|null} 职业ID
     */
    getSelectedCareer() {
        return this.selectedCareer;
    }

    /**
     * 根据职业ID获取职业名称
     * @param {string} careerId 职业ID
     * @returns {string} 职业名称
     */
    getCareerName(careerId) {
        return this.CAREERS[careerId]?.name || '未知';
    }

    /**
     * 根据职业ID获取职业颜色
     * @param {string} careerId 职业ID
     * @returns {string} 职业颜色
     */
    getCareerColor(careerId) {
        return this.CAREERS[careerId]?.color || '#fff';
    }
};
