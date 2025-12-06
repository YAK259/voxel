/*// ====================
// POST-PROCESSING EFFECTS
// ====================

// Simple check for post-processing availability
let postProcessingAvailable = false;

// Check if Three.js post-processing components exist
function checkPostProcessing() {
    if (typeof THREE === 'undefined') return false;
    
    // Check for required components
    const required = [
        'EffectComposer',
        'RenderPass', 
        'UnrealBloomPass'
    ];
    
    // They might be under THREE or as separate globals
    for (const comp of required) {
        if (!THREE[comp]) {
            console.log(`Missing post-processing component: ${comp}`);
            return false;
        }
    }
    
    return true;
}

// Create post-processing effects
function createPostProcessing(renderer, scene, camera) {
    postProcessingAvailable = checkPostProcessing();
    
    if (!postProcessingAvailable) {
        console.log("⚠️ Post-processing not available, using simple render");
        
        // Return a simple composer-like object
        return {
            render: function() {
                renderer.render(scene, camera);
            },
            setSize: function(width, height) {
                // Do nothing for simple render
            },
            passes: []
        };
    }
    
    try {
        console.log("✨ Creating post-processing effects...");
        
        // Create composer
        const composer = new THREE.EffectComposer(renderer);
        
        // Add render pass
        const renderPass = new THREE.RenderPass(scene, camera);
        composer.addPass(renderPass);
        
        // Add bloom effect
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.2,    // strength
            0.4,    // radius
            0.85    // threshold
        );
        composer.addPass(bloomPass);
        
        console.log("✅ Post-processing enabled");
        return composer;
        
    } catch (error) {
        console.error("❌ Post-processing failed:", error);
        
        // Fallback to simple render
        return {
            render: function() {
                renderer.render(scene, camera);
            },
            setSize: function(width, height) {
                // Do nothing
            },
            passes: []
        };
    }
}

// Update bloom strength (if available)
function updateBloomStrength(composer, strength) {
    if (!composer || !composer.passes || !postProcessingAvailable) return;
    
    for (const pass of composer.passes) {
        if (pass instanceof THREE.UnrealBloomPass) {
            pass.strength = Math.max(0, strength);
            break;
        }
    }
}*/
// ====================
// POST-PROCESSING (SIMPLIFIED)
// ====================

function createPostProcessing(renderer, scene, camera) {
    console.log("✨ Post-processing (simplified)");
    
    return {
        render: function() {
            renderer.render(scene, camera);
        },
        setSize: function(width, height) {
            // Do nothing for now
        }
    };
}