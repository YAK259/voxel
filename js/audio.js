// ====================
// SIMPLE RELIABLE AUDIO ENGINE
// ====================

class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.isRunning = false;
        
        // Test data for when mic fails
        this.testTime = 0;
        this.testData = {
            volume: 0.3,
            frequencies: new Array(64).fill(0.1),
            waveform: new Array(128).fill(0)
        };
        
        console.log("🎵 Audio Engine Created");
    }
    
    async start() {
        if (this.isRunning) {
            this.stop();
            return false;
        }
        
        try {
            // Check if AudioContext is supported
            if (!window.AudioContext && !window.webkitAudioContext) {
                console.log("⚠️ Web Audio API not supported");
                this.isRunning = true; // Use test data
                return false;
            }
            
            // Create audio context
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();
            
            // Try to get microphone
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            
            console.log("✅ Microphone connected");
            
            // Create analyser
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;
            
            // Connect microphone to analyser
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
            
            // Also connect to destination (required for Chrome)
            if (this.audioContext.destination) {
                this.analyser.connect(this.audioContext.destination);
            }
            
            this.isRunning = true;
            return true;
            
        } catch (error) {
            console.log("⚠️ Using simulated audio:", error.message);
            this.isRunning = true; // Still "running" but with test data
            return false;
        }
    }
    
    stop() {
        if (this.microphone && this.microphone.mediaStream) {
            this.microphone.mediaStream.getTracks().forEach(track => {
                track.stop();
                track.enabled = false;
            });
        }
        
        // Disconnect nodes
        if (this.analyser) {
            this.analyser.disconnect();
        }
        
        if (this.microphone) {
            this.microphone.disconnect();
        }
        
        // Close audio context
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close().then(() => {
                console.log("Audio context closed");
            }).catch(console.error);
        }
        
        this.isRunning = false;
        this.microphone = null;
        this.analyser = null;
        this.audioContext = null;
        
        console.log("⏹️ Audio stopped");
    }
    
    update() {
    // If audio is NOT running, return null or empty data
    if (!this.isRunning) {
        return null; // Return null to indicate NO audio data
    }
    
    // If we have real audio equipment
    if (this.analyser && this.microphone && this.audioContext) {
        try {
            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            // Get frequency data
            this.analyser.getByteFrequencyData(dataArray);
            const frequencies = [];
            for (let i = 0; i < 64; i++) {
                frequencies[i] = dataArray[i] / 255;
            }
            
            // Get waveform
            this.analyser.getByteTimeDomainData(dataArray);
            const waveform = [];
            for (let i = 0; i < 128; i++) {
                waveform[i] = (dataArray[i] - 128) / 128;
            }
            
            // Calculate volume (RMS)
            let sum = 0;
            for (let i = 0; i < 32; i++) {
                sum += frequencies[i] * frequencies[i];
            }
            const volume = Math.sqrt(sum / 32);
            
            return {
                volume: Math.min(volume, 1.0),
                frequencies: frequencies,
                waveform: waveform
            };
            
        } catch (error) {
            console.log("Audio processing error:", error);
            return this.getTestData(); // Fallback to test data
        }
    } else {
        // We're in test mode (no microphone)
        return this.getTestData();
    }
}
    
    getTestData() {
        this.testTime += 0.05;
        
        // Generate interesting test patterns
        const volume = 0.4 + 0.3 * Math.sin(this.testTime * 0.3);
        
        const frequencies = new Array(64).fill(0).map((_, i) => {
            return 0.2 + 0.3 * Math.sin(this.testTime * 0.5 + i * 0.2) * 
                   Math.sin(this.testTime * 0.1 + i * 0.05);
        });
        
        const waveform = new Array(128).fill(0).map((_, i) => {
            return Math.sin(this.testTime * 2 + i * 0.1) * 0.5;
        });
        
        return {
            volume: volume,
            frequencies: frequencies,
            waveform: waveform
        };
    }
}