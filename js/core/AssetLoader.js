/**
 * @file AssetLoader.js
 * @brief Manages loading and caching of game assets (images, sounds).
 */
WoW.Core.AssetLoader = class {
    constructor() {
        this.images = {};
        this.sounds = {};
        this.loadedCount = 0;
        this.totalCount = 0;
    }

    /**
     * Load a list of image assets.
     * @param {Array<{key: string, src: string}>} assetList 
     * @returns {Promise} Resolves when all images are loaded.
     */
    loadImages(assetList) {
        this.totalCount += assetList.length;
        
        const promises = assetList.map(asset => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.images[asset.key] = img;
                    this.loadedCount++;
                    console.log(`[AssetLoader] Loaded: ${asset.key}`);
                    resolve(img);
                };
                img.onerror = (e) => {
                    console.error(`[AssetLoader] Failed to load: ${asset.key}`, e);
                    // Resolve anyway to avoid blocking the game, but maybe with a placeholder
                    this.images[asset.key] = null; 
                    this.loadedCount++;
                    resolve(null);
                };
                img.src = asset.src;
            });
        });

        return Promise.all(promises);
    }

    /**
     * Get a loaded image by key.
     * @param {string} key 
     * @returns {HTMLImageElement|null}
     */
    getImage(key) {
        return this.images[key];
    }

    /**
     * Generate a placeholder colored texture dynamically (for testing without files).
     * @param {string} key 
     * @param {number} width 
     * @param {number} height 
     * @param {string} color 
     */
    createPlaceholder(key, width, height, color, text = "") {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        
        if (text) {
            ctx.fillStyle = "white";
            ctx.font = "12px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(text, width/2, height/2);
        }

        const img = new Image();
        img.src = canvas.toDataURL();
        this.images[key] = img;
        return img;
    }
};

// Singleton instance attached to Core
WoW.Core.Assets = new WoW.Core.AssetLoader();
