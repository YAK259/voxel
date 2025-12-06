// voxels.js - FIXED VERSION
console.log('📦 Loading voxels.js...');

if (typeof THREE === 'undefined') {
    console.warn("THREE is not defined yet. Will check when class is instantiated.");
    // Don't throw error - just warn
}

class VoxelTerrain {
    constructor(scene, size = 16) {
        console.log(`✅ Creating Voxel terrain: ${size}x${size} grid`);
        
        this.scene = scene;
        this.size = size;
        this.voxels = [];
        this.intensity = 1.0;
        
        // Simple colors for minimal Three.js
        this.colors = [0x1a237e, 0x4a148c, 0x00acc1, 0xff6f00];
        
        this.createGrid();
        console.log('✅ Voxel grid created');
    }
    
    createGrid() {
        for (let x = 0; x < this.size; x++) {
            this.voxels[x] = [];
            for (let z = 0; z < this.size; z++) {
                // Create simple geometry
                const geometry = new THREE.BoxGeometry(1, 1, 1);
                
                // Random color
                const color = this.colors[Math.floor(Math.random() * this.colors.length)];
                const material = new THREE.MeshBasicMaterial({ 
                    color: color 
                });
                
                const voxel = new THREE.Mesh(geometry, material);
                
                // Position in grid
                voxel.position.set(
                    x - this.size / 2,
                    0,
                    z - this.size / 2
                );
                
                // Store animation data
                voxel.userData = {
                    baseHeight: (Math.random() - 0.5) * 2,
                    phase: Math.random() * Math.PI * 2,
                    speed: 0.5 + Math.random() * 1.5
                };
                
                this.scene.add(voxel);
                this.voxels[x][z] = voxel;
            }
        }
    }
    
    update(audioData, time) {
    // Safety check - allow animation even without audio
    if (!this.voxels.length) return;
    
    let volume = 0;
    let frequencies = new Array(64).fill(0); // Start with 0, not 0.1
    
    if (audioData && audioData.volume !== undefined) {
        volume = audioData.volume;
        frequencies = audioData.frequencies || frequencies;
    }
    
    // Ensure time is a valid number
    if (time === undefined || time === null) {
        time = Date.now() * 0.001;
    }
    
    // Only animate if we have audio OR if we want subtle idle animation
    const shouldAnimate = volume > 0.1 || true; // Set to false if you want complete stillness
    
    for (let x = 0; x < this.size; x++) {
        if (!this.voxels[x]) continue;
        
        for (let z = 0; z < this.size; z++) {
            const voxel = this.voxels[x][z];
            if (!voxel || !voxel.userData) continue;
            
            const data = voxel.userData;
            
            try {
                // Only add wave animation if we should animate
                let wave = 0;
                if (shouldAnimate) {
                    wave = Math.sin(time * data.speed + data.phase) * 0.2; // Reduced from 0.5
                }
                
                // Safe audio wave calculation
                let audioWave = 0;
                if (Array.isArray(frequencies) && frequencies.length > 0 && volume > 0.05) {
                    const freqIndex = (x + z) % Math.min(frequencies.length, 64);
                    const freqValue = frequencies[freqIndex];
                    if (typeof freqValue === 'number' && !isNaN(freqValue)) {
                        audioWave = freqValue * volume * this.intensity * 5; // Multiply by 5 for stronger effect
                    }
                }
                
                const height = data.baseHeight + wave + audioWave * 3;
                
                // Validate height before setting
                if (!isNaN(height)) {
                    voxel.position.y = height;
                }
                
                // Scale based on height - only scale up, not down
                const minScale = 0.7;
                const scaleY = minScale + Math.max(0, voxel.position.y) * 0.3;
                if (!isNaN(scaleY) && scaleY > 0) {
                    voxel.scale.set(1, scaleY, 1);
                }
            } catch (error) {
                console.warn(`Error updating voxel at (${x}, ${z}):`, error);
                continue;
            }
        }
    }
}
    setIntensity(value) {
        if (typeof value === 'number' && !isNaN(value)) {
            this.intensity = value;
            console.log(`Terrain intensity set to: ${value}`);
        }
    }
    
    setTheme(themeName) {
        const themes = {
            cyberpunk: [0x00ffff, 0xff00ff, 0xffff00, 0x0000ff],
            oceanic: [0x1a237e, 0x0d47a1, 0x0277bd, 0x4fc3f7],
            volcanic: [0xff6f00, 0xff3d00, 0xff1744, 0xd50000],
            forest: [0x1b5e20, 0x2e7d32, 0x388e3c, 0x43a047],
            neon: [0xff00ff, 0x00ff00, 0x00ffff, 0xff0000]
        };
        
        const colors = themes[themeName] || themes.cyberpunk;
        
        try {
            this.voxels.forEach(row => {
                if (!row) return;
                row.forEach(voxel => {
                    if (voxel && voxel.material && voxel.material.color) {
                        const color = colors[Math.floor(Math.random() * colors.length)];
                        voxel.material.color = new THREE.Color(color);
                    }
                });
            });
            
            console.log(`🎨 Theme applied: ${themeName}`);
        } catch (error) {
            console.error('Error applying theme:', error);
        }
    }
    
    // FIXED: Safer getHeightAt method
    getHeightAt(x, z) {
        try {
            // Convert world coordinates to grid coordinates
            const gridX = Math.floor(x + this.size / 2);
            const gridZ = Math.floor(z + this.size / 2);
            
            // Check bounds safely
            if (gridX >= 0 && gridX < this.size && 
                gridZ >= 0 && gridZ < this.size &&
                this.voxels[gridX] && 
                this.voxels[gridX][gridZ] &&
                this.voxels[gridX][gridZ].position &&
                typeof this.voxels[gridX][gridZ].position.y === 'number') {
                
                return this.voxels[gridX][gridZ].position.y;
            }
            
            // Return 0 if out of bounds or invalid
            return 0;
            
        } catch (error) {
            console.warn('Error in getHeightAt:', error);
            return 0;
        }
    }
}

console.log('✅ voxels.js loaded successfully');