// Ensure namespace
if (!window.WoW) window.WoW = {};
if (!WoW.View) WoW.View = {};

/**
 * @file MapRenderer.js
 * @brief Handles rendering of the game world map using tiles.
 */
WoW.View.MapRenderer = class {
    constructor(width, height, tileSize = 32) {
        this.width = width;   // Map width in pixels
        this.height = height; // Map height in pixels
        this.tileSize = tileSize;
        
        this.cols = Math.ceil(width / tileSize);
        this.rows = Math.ceil(height / tileSize);
        
        // 2D Array for tile IDs. 0 = Grass, 1 = Stone, etc.
        this.tiles = [];
        this.generateMap();
    }

    /**
     * Generate a simple procedural map.
     */
    generateMap() {
        this.tiles = [];
        for (let r = 0; r < this.rows; r++) {
            const row = [];
            for (let c = 0; c < this.cols; c++) {
                // Default to grass (0)
                let tileId = 'tile_grass';
                
                // Add some random stone patches (1)
                if (Math.random() < 0.1) {
                    tileId = 'tile_stone';
                }
                
                // Add a path in the middle
                if (Math.abs(r - this.rows/2) < 3) {
                    tileId = 'tile_dirt';
                }

                row.push(tileId);
            }
            this.tiles.push(row);
        }
    }

    /**
     * Draw the map to the canvas.
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        const assets = WoW.Core.Assets;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tileKey = this.tiles[r][c];
                const img = assets.getImage(tileKey);
                
                const x = c * this.tileSize;
                const y = r * this.tileSize;

                if (img) {
                    ctx.drawImage(img, x, y, this.tileSize, this.tileSize);
                } else {
                    // Fallback colors
                    if (tileKey === 'tile_grass') ctx.fillStyle = '#2ecc71';
                    else if (tileKey === 'tile_stone') ctx.fillStyle = '#7f8c8d';
                    else if (tileKey === 'tile_dirt') ctx.fillStyle = '#d35400';
                    else ctx.fillStyle = '#000';
                    
                    ctx.fillRect(x, y, this.tileSize, this.tileSize);
                }
            }
        }
    }
};
