/*! OrbitControls.js - Compatible with THREE.js r149 */
(function() {
    // Wait for THREE to be available
    if (typeof THREE === 'undefined') {
        console.warn('THREE not loaded yet, OrbitControls will attach when available');
        setTimeout(function() {
            if (typeof THREE !== 'undefined') {
                initOrbitControls();
            }
        }, 100);
    } else {
        initOrbitControls();
    }
    
    function initOrbitControls() {
        THREE.OrbitControls = function(camera, domElement) {
            this.camera = camera;
            this.domElement = domElement || document;
            
            // Properties
            this.enabled = true;
            this.enableDamping = false;
            this.dampingFactor = 0.05;
            this.minDistance = 5;
            this.maxDistance = 50;
            this.autoRotate = false;
            
            // State
            this.isMouseDown = false;
            this.rotateStart = { x: 0, y: 0 };
            this.rotateEnd = { x: 0, y: 0 };
            this.rotateSpeed = 1.0;
            this.zoomSpeed = 1.2;
            
            var scope = this;
            var target = new THREE.Vector3(0, 0, 0);
            
            // Mouse events
            function onMouseDown(event) {
                if (!scope.enabled) return;
                event.preventDefault();
                scope.isMouseDown = true;
                scope.rotateStart.x = event.clientX;
                scope.rotateStart.y = event.clientY;
            }
            
            function onMouseMove(event) {
                if (!scope.isMouseDown || !scope.enabled) return;
                event.preventDefault();
                
                scope.rotateEnd.x = event.clientX;
                scope.rotateEnd.y = event.clientY;
                
                var deltaX = (scope.rotateEnd.x - scope.rotateStart.x) * scope.rotateSpeed * 0.005;
                var deltaY = (scope.rotateEnd.y - scope.rotateStart.y) * scope.rotateSpeed * 0.005;
                
                // Rotate camera
                if (scope.camera && scope.camera.position) {
                    var radius = Math.sqrt(
                        scope.camera.position.x * scope.camera.position.x +
                        scope.camera.position.z * scope.camera.position.z
                    );
                    
                    var theta = Math.atan2(scope.camera.position.x, scope.camera.position.z);
                    var phi = Math.atan2(Math.sqrt(scope.camera.position.x * scope.camera.position.x + 
                                                   scope.camera.position.z * scope.camera.position.z), 
                                         scope.camera.position.y);
                    
                    theta += deltaX;
                    phi += deltaY;
                    phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));
                    
                    scope.camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
                    scope.camera.position.y = radius * Math.cos(phi);
                    scope.camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
                    
                    scope.camera.lookAt(target);
                }
                
                scope.rotateStart.x = scope.rotateEnd.x;
                scope.rotateStart.y = scope.rotateEnd.y;
            }
            
            function onMouseUp() {
                scope.isMouseDown = false;
            }
            
            function onWheel(event) {
                if (!scope.enabled) return;
                event.preventDefault();
                
                var delta = event.deltaY * scope.zoomSpeed * 0.005;
                
                if (scope.camera && scope.camera.position) {
                    var direction = new THREE.Vector3();
                    direction.subVectors(scope.camera.position, target).normalize();
                    
                    var distance = scope.camera.position.distanceTo(target);
                    distance = Math.max(scope.minDistance, Math.min(scope.maxDistance, distance + delta));
                    
                    scope.camera.position.copy(target).add(direction.multiplyScalar(distance));
                }
            }
            
            // Add event listeners
            if (this.domElement) {
                this.domElement.addEventListener('mousedown', onMouseDown);
                this.domElement.addEventListener('mousemove', onMouseMove);
                this.domElement.addEventListener('mouseup', onMouseUp);
                this.domElement.addEventListener('wheel', onWheel);
            }
            
            // Update method
            this.update = function() {
                if (this.autoRotate && this.enabled) {
                    var time = Date.now() * 0.001;
                    if (this.camera && this.camera.position) {
                        this.camera.position.x = 20 * Math.sin(time * 0.1);
                        this.camera.position.z = 20 * Math.cos(time * 0.1);
                        this.camera.lookAt(target);
                    }
                }
            };
            
            // Dispose method
            this.dispose = function() {
                if (this.domElement) {
                    this.domElement.removeEventListener('mousedown', onMouseDown);
                    this.domElement.removeEventListener('mousemove', onMouseMove);
                    this.domElement.removeEventListener('mouseup', onMouseUp);
                    this.domElement.removeEventListener('wheel', onWheel);
                }
            };
            
            console.log("✅ OrbitControls created (THREE.js r149)");
        };
    }
})();