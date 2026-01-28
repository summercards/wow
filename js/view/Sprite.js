// Ensure namespace exists
if (!window.WoW) window.WoW = {};
if (!WoW.View) WoW.View = {};

/**
 * @file Sprite.js
 * @brief Handles rendering of animated sprites for entities.
 */
WoW.View.Sprite = class {
    /**
     * @param {WoW.Entities.Unit} owner The entity this sprite belongs to.
     */
    constructor(owner) {
        this.owner = owner;
        this.texture = null; // The spritesheet image
        
        // Animation Configuration
        this.frameWidth = 32;
        this.frameHeight = 32;
        this.scale = 1.0;
        
        // Offsets to center the sprite on the unit's logical position (hitbox)
        this.offsetX = 0;
        this.offsetY = 0;

        // Animation State
        this.animations = {}; // { 'idle': { row: 0, frames: 4, speed: 0.2 }, ... }
        this.currentAnim = 'idle';
        this.currentFrame = 0;
        this.timer = 0;
        this.facingRight = true;
    }

    /**
     * Setup animations for this sprite.
     * @param {string} textureKey Key of the loaded image in AssetLoader.
     * @param {number} fw Frame width
     * @param {number} fh Frame height
     * @param {object} animConfig Dictionary of animation definitions.
     */
    setup(textureKey, fw, fh, animConfig) {
        this.texture = WoW.Core.Assets.getImage(textureKey);
        this.frameWidth = fw;
        this.frameHeight = fh;
        this.animations = animConfig;
        
        // Default to idle
        this.play('idle');
    }

    /**
     * Change the texture of the sprite dynamically.
     * @param {string} textureKey 
     */
    setTexture(textureKey) {
        const img = WoW.Core.Assets.getImage(textureKey);
        if (img) {
            this.texture = img;
        }
    }

    /**
     * Switch animation state.
     * @param {string} animName 
     */
    play(animName) {
        if (this.currentAnim === animName) return;
        if (!this.animations[animName]) {
            // Fallback to idle if requested anim doesn't exist
            if (animName !== 'idle') this.play('idle');
            return;
        }

        this.currentAnim = animName;
        this.currentFrame = 0;
        this.timer = 0;
    }

    update(dt) {
        if (!this.texture || !this.animations[this.currentAnim]) return;

        const anim = this.animations[this.currentAnim];
        
        // Update facing direction based on owner's target or movement
        // (This logic might be in Main loop, but Sprite needs to know for flipping)
        if (this.owner.target) {
             this.facingRight = this.owner.target.x > this.owner.x;
        } 
        // Or if moving
        // const intent = ... (accessing controller might be hard here without reference)

        // Advance frame
        this.timer += dt;
        if (this.timer >= anim.speed) {
            this.timer = 0;
            
            // Check loop property (default true)
            const loop = anim.loop !== undefined ? anim.loop : true;

            if (loop) {
                this.currentFrame = (this.currentFrame + 1) % anim.frames;
            } else {
                if (this.currentFrame < anim.frames - 1) {
                    this.currentFrame++;
                }
            }
        }
    }

    draw(ctx) {
        if (!this.texture) return;

        const anim = this.animations[this.currentAnim];
        if (!anim) return;

        const row = anim.row || 0;
        const col = this.currentFrame;

        const sx = col * this.frameWidth;
        const sy = row * this.frameHeight;

        // Destination coords (Owner's logical rect + offsets)
        // Center the sprite on the unit's logical bottom-center
        const destX = this.owner.x + (this.owner.width / 2); 
        const destY = this.owner.y + this.owner.height; 

        ctx.save();
        ctx.translate(destX, destY);
        
        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }
        
        // Draw centered at the bottom anchor
        // Adjust based on sprite size vs logical size
        // Assuming sprite anchor is bottom-center
        const drawX = - (this.frameWidth * this.scale) / 2 + this.offsetX;
        const drawY = - (this.frameHeight * this.scale) + this.offsetY;

        ctx.drawImage(
            this.texture,
            sx, sy, this.frameWidth, this.frameHeight,
            drawX, drawY, this.frameWidth * this.scale, this.frameHeight * this.scale
        );

        ctx.restore();
    }
};
