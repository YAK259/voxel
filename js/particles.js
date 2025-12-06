// particles.js - UPDATED FOR BETTER THREE.JS LOADING
console.log('🔧 Loading particles.js...');

// Softer check - don't throw immediately
if (typeof THREE === 'undefined') {
    console.warn('THREE is not defined yet in particles.js. Make sure three.core.js loads first.');
    // We'll check again when the class is instantiated
}

class ParticleAtmosphere {
    constructor(scene, count = 1000) {
        console.log('Creating ParticleAtmosphere with count:', count);
        
        // Check THREE availability at instantiation time
        if (typeof THREE === 'undefined') {
            throw new Error("THREE is not defined! ParticleAtmosphere requires THREE.js to be loaded.");
        }
        
        // Check for required THREE.js components
        if (typeof THREE.BoxGeometry === 'undefined') {
            throw new Error("THREE.BoxGeometry is not available in your THREE.js version!");
        }
        if (typeof THREE.Mesh === 'undefined') {
            throw new Error("THREE.Mesh is not available in your THREE.js version!");
        }
        if (typeof THREE.MeshBasicMaterial === 'undefined') {
            throw new Error("THREE.MeshBasicMaterial is not available in your THREE.js version!");
        }
        if (typeof THREE.Vector3 === 'undefined') {
            throw new Error("THREE.Vector3 is not available in your THREE.js version!");
        }
        
        this.scene = scene;
        this.count = count;
        this.particles = [];
        this.baseSize = 0.1;
        this.bloomIntensity = 1.0;
        this.startTime = Date.now();
        this.center = new THREE.Vector3(0, 0, 0);
        
        // Animation state
    this.targetParticleSize = this.baseSize;
    this.targetScale = this.baseSize * 10;
    this.isAnimatingSize = false;
    this.sizeAnimationId = null;
    this.sizeAnimationStart = 0;
    
        // Use simpler BoxGeometry to be safe (available in three.core.js)
        this.geometry = new THREE.BoxGeometry(this.baseSize, this.baseSize, this.baseSize);
        
        // Simple color palette using hex values
        this.colors = [
            0x4a00ff, // Blue-purple
            0x8a2be2, // Blue violet  
            0x9370db, // Medium purple
            0xba55d3, // Medium orchid
            0xdda0dd  // Plum
        ];
        
        this.createParticles();
        console.log(`✅ Particle atmosphere created: ${count} particles`);
    }
    
    createParticles() {
        try {
            for (let i = 0; i < this.count; i++) {
                // Random position in sphere
                const radius = 10 + Math.random() * 15;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                
                const x = radius * Math.sin(phi) * Math.cos(theta);
                const y = radius * Math.cos(phi);
                const z = radius * Math.sin(phi) * Math.sin(theta);
                
                // Simple color from palette
                const colorHex = this.colors[Math.floor(Math.random() * this.colors.length)];
                
                // Create material - handle color setting carefully
                let material;
                try {
                    // Try with THREE.Color object
                    material = new THREE.MeshBasicMaterial({
                        color: new THREE.Color(colorHex),
                        transparent: true,
                        opacity: 0.6
                    });
                } catch (e) {
                    // Fallback to hex value directly
                    material = new THREE.MeshBasicMaterial({
                        color: colorHex,
                        transparent: true,
                        opacity: 0.6
                    });
                }
                
                const particle = new THREE.Mesh(this.geometry, material);
                
                // Set position safely
                if (typeof particle.position.set === 'function') {
                    particle.position.set(x, y, z);
                } else {
                    particle.position.x = x;
                    particle.position.y = y;
                    particle.position.z = z;
                }
                
                // Store animation data
                particle.userData = {
                    originalX: x,
                    originalY: y,
                    originalZ: z,
                    speed: 0.5 + Math.random() * 1.0,
                    phase: Math.random() * Math.PI * 2
                };
                
                this.particles.push(particle);
                
                // Add to scene
                if (this.scene && typeof this.scene.add === 'function') {
                    this.scene.add(particle);
                }
            }
            
            console.log(`✅ Created ${this.particles.length} particles`);
        } catch (error) {
            console.error('Error creating particles:', error);
            throw error;
        }
    }
    
    update(audioData, time, terrain) {
        // Safety check
        if (!this.particles.length) return;
        
        // Handle missing time parameter
        if (!time && time !== 0) {
            time = (Date.now() - this.startTime) * 0.001;
        }
        
        // Get audio data safely
        let volume = 0.1;
        let frequencies = [];
        
        if (audioData && typeof audioData === 'object') {
            volume = audioData.volume || 0.1;
            frequencies = audioData.frequencies || [];
            
            // Ensure frequencies is an array
            if (!Array.isArray(frequencies)) {
                frequencies = [];
            }
        }
        
        const elapsedTime = (Date.now() - this.startTime) * 0.001;
        
        // Update each particle with safety checks
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            
            // Safety check - particle might have been removed
            if (!particle || !particle.userData) {
                continue;
            }
            
            const data = particle.userData;
            
            try {
                // Calculate floating motion
                const noise = Math.sin(elapsedTime * data.speed + data.phase) * 0.5;
                
                // Add subtle audio response
                let audioInfluence = 0;
                if (frequencies.length > 0) {
                    const freqIndex = i % frequencies.length;
                    const freqValue = frequencies[freqIndex];
                    
                    // Ensure freqValue is a number
                    if (typeof freqValue === 'number' && !isNaN(freqValue)) {
                        audioInfluence = freqValue * volume * 0.5;
                    }
                }
                
                // Calculate new position
                const newX = data.originalX + noise * (1 + audioInfluence);
                const newY = data.originalY + Math.cos(elapsedTime * data.speed * 0.7 + data.phase) * 0.3;
                const newZ = data.originalZ + Math.sin(elapsedTime * data.speed * 1.3 + data.phase) * 0.3;
                
                // Only update if values are valid numbers
                if (!isNaN(newX) && !isNaN(newY) && !isNaN(newZ)) {
                    if (typeof particle.position.set === 'function') {
                        particle.position.set(newX, newY, newZ);
                    } else {
                        particle.position.x = newX;
                        particle.position.y = newY;
                        particle.position.z = newZ;
                    }
                }
                
                // Pulsate with audio
                const pulse = 0.5 + volume * 0.5 + audioInfluence * 0.3;
                if (!isNaN(pulse) && pulse > 0) {
                    if (typeof particle.scale.set === 'function') {
                        particle.scale.set(pulse, pulse, pulse);
                    } else {
                        particle.scale.x = pulse;
                        particle.scale.y = pulse;
                        particle.scale.z = pulse;
                    }
                }
                
                // Fade in/out with audio
                if (particle.material && particle.material.opacity !== undefined) {
                    const opacity = 0.3 + volume * 0.4;
                    if (opacity >= 0 && opacity <= 1) {
                        particle.material.opacity = opacity;
                    }
                }
                
            } catch (error) {
                console.warn(`Error updating particle ${i}:`, error);
                continue; // Skip this particle and continue with others
            }
        }
    }
    
    setCount(newCount) {
    if (typeof newCount !== 'number' || newCount < 0) return;
    
    console.log(`Changing particle count from ${this.particles.length} to ${newCount}`);
    
    const difference = newCount - this.particles.length;
    
    if (difference > 0) {
        // Add more particles
        this.addParticles(difference);
    } else if (difference < 0) {
        // Remove particles
        this.removeParticles(Math.abs(difference));
    }
    
    this.count = newCount;
    console.log(`✅ Particle count changed to: ${this.particles.length}`);
}

addParticles(count) {
    for (let i = 0; i < count; i++) {
        // Random position in sphere
        const radius = 10 + Math.random() * 15;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        
        // Simple color from palette
        const colorHex = this.colors[Math.floor(Math.random() * this.colors.length)];
        const material = new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.6
        });
        
        const particle = new THREE.Mesh(this.geometry, material);
        particle.position.set(x, y, z);
        
        // Store animation data
        particle.userData = {
            originalX: x,
            originalY: y,
            originalZ: z,
            speed: 0.5 + Math.random() * 1.0,
            phase: Math.random() * Math.PI * 2
        };
        
        this.particles.push(particle);
        this.scene.add(particle);
    }
}

removeParticles(count) {
    const toRemove = Math.min(count, this.particles.length);
    
    for (let i = 0; i < toRemove; i++) {
        const particle = this.particles.pop(); // Remove from end
        if (particle && this.scene) {
            this.scene.remove(particle);
            // Dispose geometry and material to free memory
            if (particle.geometry) particle.geometry.dispose();
            if (particle.material) particle.material.dispose();
        }
    }
}
    
    setBloomIntensity(intensity) {
    if (typeof intensity === 'number' && !isNaN(intensity)) {
        this.bloomIntensity = intensity;
        console.log(`Bloom intensity set to: ${intensity}`);
        
        // Apply to existing particles
        this.particles.forEach(particle => {
            if (particle && particle.material) {
                // Increase opacity with bloom
                particle.material.opacity = 0.4 + (intensity * 0.3);
                // Make particles slightly larger
                const scale = 0.8 + (intensity * 0.4);
                particle.scale.set(scale, scale, scale);
            }
        });
    }
}
    
setBaseSize(size) {
    if (typeof size === 'number' && !isNaN(size) && size > 0) {
        const oldSize = this.baseSize;
        this.baseSize = size;
                console.log(`Setting particle size to: ${size}`);
        
        console.log(`🔧 Particle size changed: ${oldSize.toFixed(2)} → ${size.toFixed(2)}`);
    
        const targetScale = size * 10;
        // Calculate scale: if base geometry is 0.1, then size 0.1 = scale 1.0
        // So scale = size / 0.1 = size * 10
        const scale = size * 10;
        
        // Update all particles
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            if (particle && particle.scale) {
                particle.scale.set(scale, scale, scale);
                
                // Optional: adjust opacity
                if (particle.material) {
                    particle.material.opacity = 0.3 + (size * 0.7);
                }
            }
        }
        
        // Update display
        const display = document.getElementById('particle-size-value');
        if (display) {
            display.textContent = size.toFixed(2);
            display.style.color = '#ff00aa';
            setTimeout(() => {
                display.style.color = '';
            }, 500);
        }
        // Store animation data
        this.targetParticleSize = size;
        this.targetScale = targetScale;
        this.isAnimatingSize = true;
        this.sizeAnimationStart = Date.now();
        
        // Start animation if not already running
        if (!this.sizeAnimationId) {
            this.animateParticleSize();
        }
        
        
        return true;
    }

            return false;
}



animateParticleSize() {
    if (!this.isAnimatingSize) {
        this.sizeAnimationId = null;
        return;
    }
    
    const elapsed = Date.now() - this.sizeAnimationStart;
    const duration = 500; // 0.5 second animation
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function for smooth animation
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const easedProgress = easeOut(progress);
    
    // Calculate current scale
    const startScale = 0.1 * 10; // Default scale (0.1 * 10 = 1)
    const currentScale = startScale + (this.targetScale - startScale) * easedProgress;
    
    // Update all particles
    this.particles.forEach(particle => {
        if (particle && particle.scale) {
            particle.scale.set(currentScale, currentScale, currentScale);
            
            // Update opacity
            if (particle.material && particle.material.opacity !== undefined) {
                const targetOpacity = 0.4 + (this.targetParticleSize * 0.6);
                particle.material.opacity = 0.4 + (targetOpacity - 0.4) * easedProgress;
            }
        }
    });
    
    // Update UI
    const sizeValueElement = document.getElementById('particle-size-value');
    if (sizeValueElement) {
        const currentSize = 0.1 + (this.targetParticleSize - 0.1) * easedProgress;
        sizeValueElement.textContent = currentSize.toFixed(2);
    }
    
    // Continue animation or stop
    if (progress < 1) {
        this.sizeAnimationId = requestAnimationFrame(() => this.animateParticleSize());
    } else {
        this.isAnimatingSize = false;
        this.sizeAnimationId = null;
        
        // Final update
        if (sizeValueElement) {
            sizeValueElement.textContent = this.targetParticleSize.toFixed(2);
            sizeValueElement.style.color = '#00ffaa';
            setTimeout(() => {
                sizeValueElement.style.color = '';
            }, 1000);
        }
        
        console.log(`✅ Particle size animation complete: ${this.targetParticleSize}`);
    }
}
}

console.log('✅ ParticleAtmosphere class loaded (waiting for THREE.js)');