// ====================
// VOXEL WAVEFORMER - MAIN
// ====================

console.log('🚀 Loading Voxel Waveformer...');

// Wait for THREE.js to load before starting
function initApp() {
    if (typeof THREE === 'undefined') {
        console.log('⏳ Waiting for THREE.js to load...');
        setTimeout(initApp, 100);
        return;
    }
    
    console.log('✅ THREE.js loaded, starting app...');
    console.log('THREE.js version:', THREE.REVISION || 'unknown');
    
    // Check what's available in three.core.js
    console.log('Checking THREE.js features:');
    console.log('- Vector3:', typeof THREE.Vector3);
    console.log('- Color:', typeof THREE.Color);
    console.log('- Scene:', typeof THREE.Scene);
    console.log('- Mesh:', typeof THREE.Mesh);
    console.log('- BoxGeometry:', typeof THREE.BoxGeometry);
    console.log('- WebGLRenderer:', typeof THREE.WebGLRenderer);
    
    window.app = new VoxelWaveformer();
}

class VoxelWaveformer {
    constructor() {
        console.log('Creating VoxelWaveformer instance...');
        
        // Enhanced safety check
        if (typeof THREE === 'undefined') {
            console.error("❌ THREE.js not loaded!");
            document.getElementById('status').textContent = 'Error: THREE.js failed to load. Check console.';
            return;
        }
        
        // Check for essential THREE.js components
        if (typeof THREE.Scene === 'undefined') {
            console.error("❌ THREE.Scene is not available!");
            return;
        }

        // Core components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.audioEngine = null;
        this.terrain = null;
        this.particles = null;
        
        // Animation
        this.clock = new THREE.Clock();
        this.animationSpeed = 1.0;
        
        // Performance
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
        
        // UI state
        this.uiVisible = true;
        this.autoRotate = true;
        
        // Recording
        this.isRecording = false;
        this.mediaRecorder = null;
        this.chunks = [];
        
        // Visuals
        this.composer = null;
        this.waveformCtx = null;
        this.waveformBoost = 1.0; // Add this line

        // Initialize
        this.init();
        this.setupUI();
    }
    
    init() {
        console.log("🚀 Initializing Voxel Waveformer...");
        
        try {
            // 1. SCENE
            this.scene = new THREE.Scene();
            
            // Check if Fog is available
            if (typeof THREE.Fog !== 'undefined') {
                this.scene.fog = new THREE.Fog(0x000011, 5, 30);
                console.log('✅ Fog enabled');
            }
            
            // 2. CAMERA
            this.camera = new THREE.PerspectiveCamera(
                75, 
                window.innerWidth / window.innerHeight, 
                0.1, 
                1000
            );
            this.camera.position.set(15, 10, 15);
            console.log('✅ Camera created');
            
            // 3. RENDERER
            // Check for antialias support
            let rendererOptions = { alpha: true };
            if (typeof THREE.WebGLRenderer !== 'undefined') {
                // Try with antialias, fallback without
                try {
                    this.renderer = new THREE.WebGLRenderer({ 
                        antialias: true,
                        alpha: true
                    });
                    console.log('✅ WebGLRenderer created with antialias');
                } catch (e) {
                    console.log('⚠️ Antialias not supported, using basic renderer');
                    this.renderer = new THREE.WebGLRenderer({ alpha: true });
                }
            } else {
                console.error('❌ WebGLRenderer not available in three.core.js');
                return;
            }
            
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            
            const container = document.getElementById('container');
            if (!container) {
                console.error('❌ Container element not found!');
                return;
            }
            container.appendChild(this.renderer.domElement);
            console.log('✅ Renderer added to DOM');
            
            // 4. CONTROLS (If available)
            if (typeof THREE.OrbitControls !== 'undefined') {
                try {
                    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                    if (this.controls.autoRotate !== undefined) {
                        this.controls.autoRotate = this.autoRotate;
                    }
                    console.log("✅ OrbitControls created");
                } catch (e) {
                    console.log("⚠️ OrbitControls failed, using basic controls:", e.message);
                    this.controls = null;
                }
            } else {
                console.log("⚠️ OrbitControls not available");
                this.controls = null;
            }
            
            // 5. LIGHTING
            // Check what light types are available
            if (typeof THREE.AmbientLight !== 'undefined') {
                const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
                this.scene.add(ambientLight);
                console.log('✅ Ambient light added');
            }
            
            if (typeof THREE.DirectionalLight !== 'undefined') {
                const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
                directionalLight.position.set(10, 20, 5);
                this.scene.add(directionalLight);
                console.log('✅ Directional light added');
            } else if (typeof THREE.PointLight !== 'undefined') {
                const pointLight = new THREE.PointLight(0xffffff, 1, 100);
                pointLight.position.set(10, 20, 5);
                this.scene.add(pointLight);
                console.log('✅ Point light added');
            }
            
            // 6. POST-PROCESSING (Simple fallback)
            this.setupPostProcessing();
            
            // 7. AUDIO ENGINE
            if (typeof AudioEngine !== 'undefined') {
                this.audioEngine = new AudioEngine();
                console.log('✅ Audio engine created');
            } else {
                console.warn('⚠️ AudioEngine not found, creating mock');
                this.audioEngine = { 
                    isRunning: false,
                    start: () => Promise.resolve(false),
                    stop: () => {},
                    update: () => ({ 
                        volume: 0.1, 
                        frequencies: new Array(64).fill(0.1),
                        waveform: new Array(128).fill(0)
                    })
                };
            }
            
            // 8. TERRAIN
            if (typeof VoxelTerrain !== 'undefined') {
                this.terrain = new VoxelTerrain(this.scene, 20);
                console.log('✅ Terrain created');
            } else {
                console.error('❌ VoxelTerrain class not found!');
                // Create a simple placeholder
                this.terrain = {
                    update: () => {},
                    setIntensity: () => {},
                    setTheme: () => {},
                    size: 20
                };
            }
            
            // 9. PARTICLES
            if (typeof ParticleAtmosphere !== 'undefined') {
                this.particles = new ParticleAtmosphere(this.scene, 1000);
                console.log('✅ Particles created');
            } else {
                console.error('❌ ParticleAtmosphere class not found!');
                // Create a simple placeholder
                this.particles = {
                    update: () => {},
                    setCount: () => {},
                    setBloomIntensity: () => {},
                    setBaseSize: () => {},
                    count: 1000
                };
            }
            
            // 10. AUTO-START AUDIO
            setTimeout(() => this.autoStartAudio(), 1000);
            
            // 11. START ANIMATION
            this.animate();
            
            // 12. HANDLE RESIZE
            window.addEventListener('resize', () => this.onWindowResize());
            
            console.log("🎉 Voxel Waveformer initialized successfully!");
            document.getElementById('status').textContent = 'Ready! Click "Start Audio" to begin.';
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            document.getElementById('status').textContent = 'Error: ' + error.message;
            
            // Try to show a basic error in the container
            const container = document.getElementById('container');
            if (container) {
                container.innerHTML = `
                    <div style="color: white; padding: 20px; text-align: center;">
                        <h2>Error Initializing 3D</h2>
                        <p>${error.message}</p>
                        <p>Check browser console for details.</p>
                    </div>
                `;
            }
        }
    }
    
    setupPostProcessing() {
        // Simple composer fallback
        this.composer = {
            render: () => {
                if (this.renderer && this.scene && this.camera) {
                    this.renderer.render(this.scene, this.camera);
                }
            },
            setSize: (width, height) => {
                if (this.renderer) {
                    this.renderer.setSize(width, height);
                }
            }
        };
        console.log('✅ Post-processing setup');
    }
    
    autoStartAudio() {
        setTimeout(() => {
            if (this.audioEngine) {
                this.audioEngine.start().then(success => {
                    if (success) {
                        console.log("✅ Audio started automatically");
                        const btn = document.getElementById('audio-toggle');
                        if (btn) {
                            btn.textContent = '⏹️ Stop Audio';
                            btn.classList.add('running');
                        }
                    } else {
                        console.log("⚠️ Using synthetic audio");
                        const status = document.getElementById('status');
                        if (status) {
                            status.textContent = "Click 'Start Audio' for microphone";
                        }
                    }
                });
            }
        }, 1000);
    }
    
    setupUI() {
        console.log("🎮 Setting up UI...");
        
        // Get UI elements with safety checks
        const uiElement = document.getElementById('ui');
        const toggleBtn = document.getElementById('toggle-ui');
        const audioBtn = document.getElementById('audio-toggle');
        
        if (!uiElement || !toggleBtn || !audioBtn) {
            console.error('❌ UI elements not found!');
            return;
        }
        
        // ===== 1. AUDIO TOGGLE =====
        audioBtn.addEventListener('click', async () => {
            if (this.audioEngine.isRunning) {
                this.audioEngine.stop();
                audioBtn.textContent = '🎤 Start Audio';
                audioBtn.classList.remove('running');
                document.getElementById('status').textContent = 'Audio stopped';
            } else {
                const success = await this.audioEngine.start();
                if (success) {
                    audioBtn.textContent = '⏹️ Stop Audio';
                    audioBtn.classList.add('running');
                    document.getElementById('status').textContent = 'Microphone active';
                } else {
                    audioBtn.textContent = '🔧 Test Mode';
                    audioBtn.classList.add('running');
                    document.getElementById('status').textContent = 'Using simulation';
                }
            }
        });
        
        // ===== 2. THEME BUTTONS =====
        const themeBtn = document.getElementById('theme-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const themes = ['cyberpunk', 'oceanic', 'volcanic', 'forest', 'neon'];
                const randomTheme = themes[Math.floor(Math.random() * themes.length)];
                if (this.terrain && this.terrain.setTheme) {
                    this.terrain.setTheme(randomTheme);
                    themeBtn.textContent = `🎨 ${randomTheme.toUpperCase()}`;
                }
            });
            
            // Individual theme buttons
            document.querySelectorAll('.theme-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const theme = btn.getAttribute('data-theme');
                    if (this.terrain && this.terrain.setTheme && theme) {
                        this.terrain.setTheme(theme);
                        themeBtn.textContent = `🎨 ${theme.toUpperCase()}`;
                    }
                });
            });
        }
        
        // ===== 3. SLIDERS =====
        // In setupUI() method, update the slider event listeners:

// Intensity slider - make it more responsive
const intensitySlider = document.getElementById('intensity-slider');
if (intensitySlider) {
    intensitySlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        if (this.terrain && this.terrain.setIntensity) {
            this.terrain.setIntensity(value); // Double the effect
        }
        const intensityValue = document.getElementById('intensity-value');
        if (intensityValue) intensityValue.textContent = value.toFixed(1);
    });
}

// Particle count slider - with visual feedback
const particleSlider = document.getElementById('particle-slider');
if (particleSlider) {
    particleSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        const particleValue = document.getElementById('particle-value');
        if (particleValue) particleValue.textContent = value;
        
        // Update immediately for visual feedback
        if (this.particles && this.particles.setCount) {
            this.particles.setCount(value);
        }
    });
}

// Bloom slider - with immediate visual feedback
const bloomSlider = document.getElementById('bloom-slider');
if (bloomSlider) {
    bloomSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        const bloomValue = document.getElementById('bloom-value');
        if (bloomValue) bloomValue.textContent = value.toFixed(1);
        
        // Update immediately
        if (this.particles && this.particles.setBloomIntensity) {
            this.particles.setBloomIntensity(value);
        }
    });
}
        
        // Animation speed slider
        const speedSlider = document.getElementById('speed-slider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.animationSpeed = value;
                const speedValue = document.getElementById('speed-value');
                if (speedValue) speedValue.textContent = value.toFixed(1);
            });
        }
        
        // ===== 4. PARTICLE SIZE CONTROL =====
        this.addParticleSizeControl();
        
        // ===== 5. AUTO-ROTATE =====
        const autoRotateBtn = document.getElementById('auto-rotate');
        if (autoRotateBtn) {
            autoRotateBtn.addEventListener('click', () => {
                this.autoRotate = !this.autoRotate;
                if (this.controls && this.controls.autoRotate !== undefined) {
                    this.controls.autoRotate = this.autoRotate;
                }
                autoRotateBtn.textContent = this.autoRotate ? 
                    '🌀 Auto-Rotate: ON' : '🌀 Auto-Rotate: OFF';
            });
        }
        
        // ===== 6. FULLSCREEN =====
        const fullscreenBtn = document.getElementById('fullscreen');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(console.error);
                } else {
                    document.exitFullscreen().catch(console.error);
                }
            });
        }
        
        // ===== 7. RECORD BUTTON =====
        const recordBtn = document.getElementById('record-btn');
        if (recordBtn) {
            recordBtn.addEventListener('click', () => {
                this.toggleRecording();
            });
        }
        
        // ===== 8. UI TOGGLE =====
const toggleIcon = document.getElementById('toggle-icon');
const toggleText = document.getElementById('toggle-text');

toggleBtn.addEventListener('click', () => {
    this.uiVisible = !this.uiVisible;
    const uiElement = document.getElementById('ui');
    const showBtn = document.getElementById('show-ui-btn');
    
    if (this.uiVisible) {
        // Show UI
        if (uiElement) uiElement.classList.remove('hidden');
        if (showBtn) showBtn.classList.add('hidden');
        
        if (toggleIcon) toggleIcon.textContent = '👁️';
        if (toggleText) toggleText.textContent = ' Hide UI (H)';
        toggleBtn.style.background = 'linear-gradient(135deg, #4a148c, #6a1b9a)';
        
    } else {
        // Hide UI
        if (uiElement) uiElement.classList.add('hidden');
        if (showBtn) showBtn.classList.remove('hidden');
        
        if (toggleIcon) toggleIcon.textContent = '👁️‍🗨️';
        if (toggleText) toggleText.textContent = ' Show UI (H)';
        toggleBtn.style.background = '#2d0a5c';
        
        // Show indicator briefly
        const indicator = document.getElementById('immersive-indicator');
        if (indicator) {
            indicator.style.opacity = '0.5';
            setTimeout(() => {
                indicator.style.opacity = '0';
            }, 2000);
        }
    }
});
        // ===== 9. HOTKEYS =====
        document.addEventListener('keydown', (e) => {
            // Don't trigger if typing in input
            if (e.target.tagName === 'INPUT') return;
            
            const key = e.key.toLowerCase();
            
            switch(key) {
                case 'h':
                    toggleBtn.click();
                    e.preventDefault();
                    break;
                    
                case ' ':
                    if (audioBtn) audioBtn.click();
                    e.preventDefault();
                    break;
                    
                case 't':
                    if (themeBtn) themeBtn.click();
                    break;
                    
                case 'r':
                    if (recordBtn) recordBtn.click();
                    break;
                    
                case 'f':
                    if (fullscreenBtn) fullscreenBtn.click();
                    break;
                    
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                    const themes = ['cyberpunk', 'oceanic', 'volcanic', 'forest', 'neon'];
                    const themeIndex = parseInt(key) - 1;
                    if (this.terrain && this.terrain.setTheme && themeBtn && themes[themeIndex]) {
                        this.terrain.setTheme(themes[themeIndex]);
                        themeBtn.textContent = `🎨 ${themes[themeIndex].toUpperCase()}`;
                    }
                    break;
            }
        });
        
        // ===== 10. WAVEFORM CANVAS =====
const waveformCanvas = document.getElementById('waveform');
if (waveformCanvas) {
    // Get the display size
    const displayWidth = waveformCanvas.clientWidth;
    const displayHeight = waveformCanvas.clientHeight;
    
    // Set the actual canvas size to match display
    if (waveformCanvas.width !== displayWidth || waveformCanvas.height !== displayHeight) {
        waveformCanvas.width = displayWidth;
        waveformCanvas.height = displayHeight;
    }
    
    this.waveformCtx = waveformCanvas.getContext('2d');
    console.log(`✅ Waveform canvas: ${displayWidth}x${displayHeight}`);
    
    // Draw initial waveform
    this.drawWaveform(new Array(128).fill(0));
}
// Waveform boost button
const boostBtn = document.getElementById('boost-waveform');
if (boostBtn) {
    let boostLevel = 1;
    boostBtn.addEventListener('click', () => {
        boostLevel = boostLevel === 1 ? 3 : 1;
        boostBtn.textContent = boostLevel === 3 ? '⚡ BOOSTED!' : '⚡ BOOST';
        boostBtn.style.background = boostLevel === 3 ? '#00ffaa' : '#ff00aa';
        console.log(`Waveform boost: ${boostLevel}x`);
        
        // Store boost level for use in animate()
        this.waveformBoost = boostLevel;
    });
}// ===== 11. MOBILE SUPPORT =====
// Double tap to show/hide UI on mobile
let lastTap = 0;
document.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    // If double tap (within 300ms) on empty space
    if (tapLength < 300 && tapLength > 0 && e.target.id === 'container') {
        toggleBtn.click();
        e.preventDefault();
    }
    
    lastTap = currentTime;
});

// Also allow tapping the immersive indicator to show UI
const indicator = document.getElementById('immersive-indicator');
if (indicator) {
    indicator.style.pointerEvents = 'auto'; // Make it clickable
    indicator.addEventListener('click', () => {
        this.showUI();
    });
    indicator.addEventListener('touchend', () => {
        this.showUI();
    });
}
    }
    
    addParticleSizeControl() {
    // Create particle size slider
    const particleSizeSlider = document.createElement('input');
    particleSizeSlider.type = 'range';
    particleSizeSlider.min = '0.05';  // Increased from 0.01
    particleSizeSlider.max = '0.8';   // Increased from 0.5
    particleSizeSlider.step = '0.05';
    particleSizeSlider.value = '0.1';
    particleSizeSlider.className = 'slider';
    particleSizeSlider.id = 'particle-size-slider';
    
    // Create container
    const particleSizeContainer = document.createElement('div');
    particleSizeContainer.className = 'control-group';
    particleSizeContainer.innerHTML = `
        <label>Particle Size: 
            <span id="particle-size-value">0.1</span>
            <small style="color: #88aacc; font-size: 11px; margin-left: 5px;">
                (${this.particles ? this.particles.count : '0'} particles)
            </small>
        </label>
    `;
    particleSizeContainer.appendChild(particleSizeSlider);
    
    // Find where to insert (before the last control-group which is the waveform)
    const lastControlGroup = document.querySelector('#ui .control-group:last-child');
    if (lastControlGroup) {
        lastControlGroup.parentNode.insertBefore(particleSizeContainer, lastControlGroup);
    } else {
        // Fallback: add to end of UI
        document.getElementById('ui').appendChild(particleSizeContainer);
    }
    
    // Add event listener for real-time updates
    particleSizeSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        const particleSizeValue = document.getElementById('particle-size-value');
        
        if (particleSizeValue) {
            particleSizeValue.textContent = value.toFixed(2);
            particleSizeValue.style.color = '#ff00aa';
        }
        
        // Update particles immediately (WITHOUT animation for real-time feedback)
        if (this.particles && this.particles.setBaseSize) {
            // For real-time slider movement, update immediately without animation
            const scaleFactor = value * 10;
            this.particles.particles.forEach(particle => {
                if (particle && particle.scale) {
                    particle.scale.set(scaleFactor, scaleFactor, scaleFactor);
                }
            });
        }
    });
    
    // On mouse up, apply with animation
    particleSizeSlider.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value);
        const particleSizeValue = document.getElementById('particle-size-value');
        
        if (particleSizeValue) {
            particleSizeValue.style.color = '#00ffaa';
            particleSizeValue.style.fontWeight = 'bold';
        }
        
        // Update particles with animation
        if (this.particles && this.particles.setBaseSize) {
            console.log(`✅ Final particle size: ${value}`);
            this.particles.setBaseSize(value);
        }
        
        // Reset UI after 1 second
        setTimeout(() => {
            if (particleSizeValue) {
                particleSizeValue.style.color = '';
                particleSizeValue.style.fontWeight = '';
            }
        }, 1000);
    });
}
    
drawWaveform(waveform) {
    if (!this.waveformCtx) {
        console.error('No waveform context!');
        return;
    }
    
    if (!waveform || !Array.isArray(waveform) || waveform.length === 0) {
        console.warn('Invalid or empty waveform data');
        return;
    }
     if (!this.audioEngine || !this.audioEngine.isRunning) {
        this.drawStaticWaveform(waveform);
        return;
    }
    const ctx = this.waveformCtx;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Check if canvas is actually visible
    if (width === 0 || height === 0) {
        console.warn('Canvas has zero dimensions:', width, 'x', height);
        return;
    }
    
    // Clear with black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid for reference (subtle)
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;
    
    // Horizontal grid lines
    for (let y = 0; y <= height; y += height/4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Vertical grid lines
    for (let x = 0; x <= width; x += width/8) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    // Draw center line (thicker)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.moveTo(0, height/2);
    ctx.lineTo(width, height/2);
    ctx.stroke();
    
    // Draw EXTREME waveform
    ctx.beginPath();
    ctx.lineWidth = 4;
    
    // Create vibrant rainbow gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#ff0000');    // Red
    gradient.addColorStop(0.2, '#ff8800');  // Orange
    gradient.addColorStop(0.4, '#ffff00');  // Yellow
    gradient.addColorStop(0.6, '#00ff00');  // Green
    gradient.addColorStop(0.8, '#0088ff');  // Blue
    gradient.addColorStop(1, '#ff00ff');    // Magenta
    
    ctx.strokeStyle = gradient;
    
    // Draw each point with extreme visibility
    const step = Math.max(1, Math.floor(waveform.length / width));
    
    for (let i = 0; i < width; i++) {
        const dataIndex = Math.min(Math.floor(i * waveform.length / width), waveform.length - 1);
        let value = waveform[dataIndex] || 0;
        
        // EXTREME amplification for visibility
        value = value * 1.5; // Additional boost
        
        // Clamp but allow dramatic overshoot
        value = Math.max(-2.0, Math.min(2.0, value));
        
        // Invert Y axis (canvas Y goes down)
        const y = height/2 - value * (height/3);
        
        if (i === 0) {
            ctx.moveTo(i, y);
        } else {
            ctx.lineTo(i, y);
        }
    }
    
    ctx.stroke();
    
    // Add intense glow effect
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#00ffff';
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Fill under waveform for maximum visibility
    ctx.lineTo(width, height/2);
    ctx.lineTo(0, height/2);
    ctx.closePath();
    
    const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
    fillGradient.addColorStop(0, 'rgba(255, 0, 0, 0.5)');
    fillGradient.addColorStop(0.3, 'rgba(255, 255, 0, 0.3)');
    fillGradient.addColorStop(0.7, 'rgba(0, 255, 255, 0.2)');
    fillGradient.addColorStop(1, 'rgba(255, 0, 255, 0.1)');
    
    ctx.fillStyle = fillGradient;
    ctx.fill();
    
    // Draw peak indicators (when audio is loud)
    const peakThreshold = 0.6;
    for (let i = 0; i < waveform.length; i += Math.floor(waveform.length / 15)) {
        const value = Math.abs(waveform[i] || 0);
        if (value > peakThreshold) {
            const x = (i / waveform.length) * width;
            const y = height/2;
            
            // Draw glowing peak dot
            ctx.beginPath();
            ctx.fillStyle = '#ffff00';
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Add glow to peak
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffff00';
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Draw peak indicator line
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.4)';
            ctx.lineWidth = 1;
            ctx.moveTo(x, y - 10);
            ctx.lineTo(x, y + 10);
            ctx.stroke();
        }
    }
    
    // Draw volume meter on side
    if (this.audioEngine && this.audioEngine.isRunning) {
        const volume = this.audioEngine.update().volume || 0;
        const meterHeight = volume * height;
        
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.fillRect(width - 10, height - meterHeight, 8, meterHeight);
        
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(width - 10, height - meterHeight, 8, meterHeight);
    }
}
drawStaticWaveform(waveform) {
    if (!this.waveformCtx || !waveform) return;
    
    const ctx = this.waveformCtx;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Clear with dark background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw "Audio Off" message
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎤 Audio Off - Click "Start Audio"', width/2, height/2);
    
    // Draw subtle center line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.moveTo(0, height/2);
    ctx.lineTo(width, height/2);
    ctx.stroke();
    
    // Draw border to indicate inactive state
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, width-2, height-2);
}
    
  animate() {
    requestAnimationFrame(() => this.animate());
    
    // FPS counter
    this.frameCount++;
    const currentTime = performance.now();
    if (currentTime >= this.lastTime + 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
        this.frameCount = 0;
        this.lastTime = currentTime;
        
        // Update performance display
        const fpsElem = document.getElementById('fps');
        const voxelElem = document.getElementById('voxel-count');
        const particleElem = document.getElementById('particle-count');
        
        if (fpsElem) fpsElem.textContent = this.fps;
        if (voxelElem && this.terrain) {
            voxelElem.textContent = this.terrain.size * this.terrain.size;
        }
        if (particleElem && this.particles) {
            particleElem.textContent = this.particles.count || 0;
        }
    }
    
    const time = this.clock.getElapsedTime() * this.animationSpeed;
    
    // Get audio data
    const audioData = this.audioEngine ? this.audioEngine.update() : null;
    
    // DEBUG: Log audio data occasionally
    if (audioData && this.frameCount % 60 === 0) { // Every second at 60fps
        console.log('🎵 Audio Data:', {
            volume: audioData.volume?.toFixed(3),
            hasWaveform: !!audioData.waveform,
            waveformLength: audioData.waveform?.length || 0,
            maxValue: audioData.waveform ? 
                Math.max(...audioData.waveform.map(v => Math.abs(v))).toFixed(3) : 'none'
        });
    }
    
    // Update UI visuals
    if (audioData) {
        // Volume display - make it dramatic
        const volumeValue = document.getElementById('volume-value');
        const volumeBar = document.getElementById('volume-bar');
        
        if (volumeValue && audioData.volume !== undefined) {
            // Boost volume display
            const boostedVolume = Math.min(audioData.volume * 3, 2.0);
            volumeValue.textContent = boostedVolume.toFixed(2);
            
            // Color code by volume
            if (boostedVolume > 1.5) {
                volumeValue.style.color = '#ff0000';
                volumeValue.style.fontWeight = 'bold';
            } else if (boostedVolume > 1.0) {
                volumeValue.style.color = '#ffff00';
            } else {
                volumeValue.style.color = '#00ffaa';
            }
        }
        
        if (volumeBar && audioData.volume !== undefined) {
            const volumePercent = Math.min(audioData.volume * 300, 100); // Boosted!
            const hue = 120 - (volumePercent * 0.8); // Green to red
            
            volumeBar.style.background = `linear-gradient(90deg, 
                hsl(${hue}, 100%, 60%) ${volumePercent}%, 
                rgba(255,255,255,0.1) 0%)`;
            volumeBar.style.boxShadow = `0 0 20px hsl(${hue}, 100%, 50%)`;
            volumeBar.style.border = `2px solid hsl(${hue}, 100%, 50%)`;
        }
        
        // WAVEFORM - EXTREME AMPLIFICATION
        if (audioData.waveform && this.waveformCtx) {
            // Create SUPER amplified waveform
            const superAmplified = new Array(audioData.waveform.length);
            const baseAmplification = 15.0; // 15x base!
            const volumeBoost = 1.0 + (audioData.volume * 2); // Add volume-based boost
            
            for (let i = 0; i < audioData.waveform.length; i++) {
                let value = audioData.waveform[i];
                
                // Apply extreme amplification
                value = value * baseAmplification * volumeBoost;
                
                // Add harmonic distortion for visibility
                if (Math.abs(value) > 0.3) {
                    value = value * 1.8; // Make peaks even bigger
                }
                
                // Apply boost button if active
                if (this.waveformBoost && this.waveformBoost > 1) {
                    value = value * this.waveformBoost;
                }
                
                superAmplified[i] = value;
            }
            
            this.drawWaveform(superAmplified);
        }
    } else if (this.waveformCtx) {
        // Draw dramatic test animation when no audio
        const testTime = Date.now() * 0.005;
        const testWave = new Array(128).fill(0).map((_, i) => {
            const base = Math.sin(testTime + i * 0.1) * 0.7;
            const harmonic = Math.sin(testTime * 3 + i * 0.2) * 0.3;
            return (base + harmonic) * 2.0; // 2x amplification for test
        });
        this.drawWaveform(testWave);
    }
    
    // Update terrain with safety
    if (this.terrain && typeof this.terrain.update === 'function') {
        try {
            this.terrain.update(audioData, time);
        } catch (e) {
            console.warn('Terrain update error:', e);
        }
    }
    
    // Update particles with safety
    if (this.particles && typeof this.particles.update === 'function') {
        try {
            const safeTime = isNaN(time) ? 0 : time;
            this.particles.update(audioData, safeTime, this.terrain);
        } catch (e) {
            console.warn('Particles update error:', e);
        }
    }
    
    // Auto-rotate camera
    if (this.controls && this.autoRotate && typeof this.controls.update === 'function') {
        try {
            this.controls.update();
        } catch (e) {
            console.warn('Controls update error:', e);
        }
    }
    
    // Render
    if (this.composer && typeof this.composer.render === 'function') {
        this.composer.render();
    } else if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
    }
    
    // Update recording if active
    if (this.isRecording) {
        this.updateRecording();
    }
}
    
    toggleRecording() {
        if (!this.isRecording) {
            this.startRecording();
        } else {
            this.stopRecording();
        }
    }
    showUI() {
    this.uiVisible = true;
    const uiElement = document.getElementById('ui');
    const showBtn = document.getElementById('show-ui-btn');
    const toggleBtn = document.getElementById('toggle-ui');
    const toggleIcon = document.getElementById('toggle-icon');
    const toggleText = document.getElementById('toggle-text');
    
    if (uiElement) {
        uiElement.classList.remove('hidden');
    }
    
    if (showBtn) {
        showBtn.classList.add('hidden');
    }
    
    if (toggleBtn) {
        toggleBtn.style.background = 'linear-gradient(135deg, #4a148c, #6a1b9a)';
    }
    
    if (toggleIcon) {
        toggleIcon.textContent = '👁️';
    }
    
    if (toggleText) {
        toggleText.textContent = ' Hide UI (H)';
    }
    
    console.log('UI shown');
}
    startRecording() {
        try {
            if (!this.renderer || !this.renderer.domElement) {
                throw new Error('Renderer not available');
            }
            
            this.chunks = [];
            const stream = this.renderer.domElement.captureStream(30);
            
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9'
            });
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.chunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `voxel-waveformer-${Date.now()}.webm`;
                a.click();
                
                URL.revokeObjectURL(url);
            };
            
            this.mediaRecorder.start();
            this.isRecording = true;
            
            const button = document.getElementById('record-btn');
            if (button) {
                button.textContent = '⏹️ Stop Recording';
                button.style.background = '#d32f2f';
            }
            
            document.getElementById('status').textContent = 'Recording...';
            
        } catch (error) {
            console.error('Recording failed:', error);
            document.getElementById('status').textContent = 'Recording not supported';
        }
    }
    
    stopRecording() {
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
        }
        
        this.isRecording = false;
        
        const button = document.getElementById('record-btn');
        if (button) {
            button.textContent = '⏺️ Record';
            button.style.background = '#4a148c';
        }
        
        document.getElementById('status').textContent = 'Recording saved!';
    }
    
    updateRecording() {
        const elapsed = Math.floor(this.clock.getElapsedTime());
        document.getElementById('status').textContent = `Recording... ${elapsed}s`;
    }
    
    onWindowResize() {
        if (this.camera) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            if (typeof this.camera.updateProjectionMatrix === 'function') {
                this.camera.updateProjectionMatrix();
            }
        }
        
        if (this.renderer) {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
        
        if (this.composer && typeof this.composer.setSize === 'function') {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }
    }
}

// Start the app when page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log("📄 DOM loaded, checking for THREE.js...");
    initApp();
});