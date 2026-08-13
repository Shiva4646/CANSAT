// Three.js Satellite Visualization - Updated Implementation
class SatelliteVisualization {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with id "${containerId}" not found`);
            return;
        }
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.satellite = null;
        this.controls = null;
        this.animationId = null;
        this.isInitialized = false;
        
        // Orientation data
        this.orientation = {
            pitch: 0,
            yaw: 0,
            roll: 0
        };
        
        // Check for Three.js availability
        if (typeof THREE === 'undefined') {
            console.error('Three.js not loaded');
            this.showError('Three.js library not loaded');
            return;
        }
        
        this.init();
    }
    
    init() {
        try {
            // Create scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x111111);
            
            // Create camera
            const width = this.container.clientWidth || 800;
            const height = this.container.clientHeight || 600;
            this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
            this.camera.position.set(8, 8, 8);
            this.camera.lookAt(0, 0, 0);
            
            // Create renderer
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                alpha: false
            });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            this.container.appendChild(this.renderer.domElement);
            
            // Add orbit controls if available
            if (typeof THREE.OrbitControls !== 'undefined') {
                this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                this.controls.enableDamping = true;
                this.controls.dampingFactor = 0.05;
                this.controls.enableZoom = true;
                this.controls.enablePan = true;
                this.controls.maxDistance = 50;
                this.controls.minDistance = 2;
            }
            
            // Setup lighting
            this.setupLighting();
            
            // Load satellite model
            this.loadSatelliteModel();
            
            // Add stars background
            this.addStarsBackground();
            
            // Start animation loop
            this.animate();
            
            // Handle window resize
            this.resizeHandler = () => this.onWindowResize();
            window.addEventListener('resize', this.resizeHandler);
            
            this.isInitialized = true;
            console.log('SatelliteVisualization initialized successfully');
            
        } catch (error) {
            console.error('Error initializing satellite visualization:', error);
            this.showError('Failed to initialize 3D visualization');
        }
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Main directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.position.set(10, 10, 5);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 50;
        this.scene.add(sunLight);
        
        // Fill light
        const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
        fillLight.position.set(-5, 0, -5);
        this.scene.add(fillLight);
        
        // Rim light
        const rimLight = new THREE.DirectionalLight(0xffaa88, 0.5);
        rimLight.position.set(0, -10, 0);
        this.scene.add(rimLight);
    }
    
    loadSatelliteModel() {
        // Check if OBJ loader is available
        if (typeof THREE.OBJLoader === 'undefined') {
            console.warn('OBJLoader not available, using fallback model');
            this.createFallbackSatellite();
            return;
        }
        
        const loader = new THREE.OBJLoader();
        
        // Show loading message
        this.showLoadingMessage();
        
        loader.load(
            './pct_assy.obj',
            (object) => {
                this.satellite = object;
                
                // Apply materials to the satellite
                this.applySatelliteMaterials();
                
                // Scale the satellite appropriately
                this.satellite.scale.set(0.01, 0.01, 0.01); // Smaller scale for large models
                
                // Center the satellite
                this.centerSatellite();
                
                // Enable shadows
                this.satellite.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                this.scene.add(this.satellite);
                this.hideLoadingMessage();
                
                console.log('Satellite model loaded successfully');
            },
            (progress) => {
                if (progress.lengthComputable) {
                    const percentage = (progress.loaded / progress.total * 100);
                    this.updateLoadingProgress(percentage);
                }
            },
            (error) => {
                console.warn('Could not load OBJ model, using fallback:', error);
                this.hideLoadingMessage();
                this.createFallbackSatellite();
            }
        );
    }
    
    applySatelliteMaterials() {
        // Create different materials for satellite components (wireframe enabled)
        const materials = {
            body: new THREE.MeshPhongMaterial({
                color: 0xcccccc,
                shininess: 30,
                specular: 0x111111,
                wireframe: true
            }),
            panels: new THREE.MeshPhongMaterial({
                color: 0x2244aa,
                shininess: 80,
                specular: 0x444444,
                wireframe: true
            }),
            antenna: new THREE.MeshPhongMaterial({
                color: 0xffffff,
                shininess: 100,
                specular: 0x666666,
                wireframe: true
            }),
            default: new THREE.MeshPhongMaterial({
                color: 0x888888,
                shininess: 50,
                specular: 0x333333,
                wireframe: true
            })
        };
        
        // Apply materials based on object names or assign default
        this.satellite.traverse((child) => {
            if (child.isMesh) {
                const name = child.name.toLowerCase();
                if (name.includes('panel') || name.includes('solar')) {
                    child.material = materials.panels;
                } else if (name.includes('antenna') || name.includes('dish')) {
                    child.material = materials.antenna;
                } else if (name.includes('body') || name.includes('main')) {
                    child.material = materials.body;
                } else {
                    child.material = materials.default;
                }
            }
        });
    }
    
    centerSatellite() {
        // Calculate bounding box and center the satellite
        const box = new THREE.Box3().setFromObject(this.satellite);
        const center = box.getCenter(new THREE.Vector3());
        this.satellite.position.sub(center);
    }
    
    createFallbackSatellite() {
        // Create a realistic satellite representation
        const group = new THREE.Group();
        
        // Main body (cylinder for CanSat)
        const bodyGeometry = new THREE.CylinderGeometry(1, 1, 3, 16);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xcccccc,
            shininess: 30,
            wireframe: true
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Top cap (orange/red like actual CanSat)
        const capGeometry = new THREE.CylinderGeometry(1.1, 1.1, 0.2, 16);
        const capMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff6600,
            wireframe: true
        });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = 1.6;
        cap.castShadow = true;
        group.add(cap);
        
        // Antenna
        const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.5);
        const antennaMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffffff,
            wireframe: true
        });
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.y = 2.5;
        antenna.castShadow = true;
        group.add(antenna);
        
        // Parachute compartment
        const parachuteGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16);
        const parachuteMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x4444ff,
            wireframe: true
        });
        const parachute = new THREE.Mesh(parachuteGeometry, parachuteMaterial);
        parachute.position.y = -1.8;
        parachute.castShadow = true;
        group.add(parachute);
        
        // Add some detail components
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const x = Math.cos(angle) * 0.9;
            const z = Math.sin(angle) * 0.9;
            
            // Small sensors
            const sensorGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
            const sensorMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x333333,
                wireframe: true
            });
            const sensor = new THREE.Mesh(sensorGeometry, sensorMaterial);
            sensor.position.set(x, 0, z);
            group.add(sensor);
        }
        
        this.satellite = group;
        this.scene.add(this.satellite);
        this.hideLoadingMessage();
        
        console.log('Fallback satellite model created');
    }
    
    updateOrientation(pitch, yaw, roll) {
        this.orientation.pitch = pitch;
        this.orientation.yaw = yaw;
        this.orientation.roll = roll;
        
        if (this.satellite) {
            // Apply rotations in the correct order (ZYX for aerospace)
            this.satellite.rotation.x = THREE.MathUtils.degToRad(pitch);
            this.satellite.rotation.y = THREE.MathUtils.degToRad(yaw);
            this.satellite.rotation.z = THREE.MathUtils.degToRad(roll);
        }
        
        // Update orientation display
        this.updateOrientationDisplay();
    }
    
    updateOrientationDisplay() {
        // Update any UI elements showing orientation values
        const orientationData = {
            pitch: this.orientation.pitch.toFixed(1),
            yaw: this.orientation.yaw.toFixed(1),
            roll: this.orientation.roll.toFixed(1)
        };
        
        // Update DOM elements if they exist
        const rollDisplay = document.getElementById('rollDisplay');
        const pitchDisplay = document.getElementById('pitchDisplay');
        const yawDisplay = document.getElementById('yawDisplay');
        
        if (rollDisplay) rollDisplay.textContent = orientationData.roll + '°';
        if (pitchDisplay) pitchDisplay.textContent = orientationData.pitch + '°';
        if (yawDisplay) yawDisplay.textContent = orientationData.yaw + '°';
        
        // Dispatch event with orientation data
        const event = new CustomEvent('orientationUpdate', {
            detail: orientationData
        });
        window.dispatchEvent(event);
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Render the scene
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    showLoadingMessage() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'satellite-loading';
        loadingDiv.innerHTML = `
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-family: Arial, sans-serif;
                text-align: center;
                z-index: 1000;
            ">
                <div>Loading Satellite Model...</div>
                <div id="loading-progress">0%</div>
            </div>
        `;
        this.container.appendChild(loadingDiv);
    }
    
    updateLoadingProgress(percentage) {
        const progressElement = document.getElementById('loading-progress');
        if (progressElement) {
            progressElement.textContent = percentage.toFixed(0) + '%';
        }
    }
    
    hideLoadingMessage() {
        const loadingDiv = document.getElementById('satellite-loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    showError(message) {
        if (!this.container) return;
        this.container.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: #ff6666;
                font-family: monospace;
                text-align: center;
                padding: 1rem;
            ">${message}</div>
        `;
    }
    
    showErrorMessage() {
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #ff6666;
                font-family: Arial, sans-serif;
                text-align: center;
                z-index: 1000;
            ">
                <div>Failed to load satellite model</div>
                <div>Using fallback representation</div>
            </div>
        `;
        this.container.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
    
    // Public methods for external control
    resetView() {
        if (!this.camera) return;
        this.camera.position.set(5, 5, 5);
        if (this.controls) {
            this.controls.reset();
        }
    }
    
    toggleWireframe() {
        if (this.satellite) {
            this.satellite.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.wireframe = !child.material.wireframe;
                }
            });
        }
    }
    
    dispose() {
        // Clean up resources
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.controls) {
            this.controls.dispose();
        }
        
        // Remove event listeners
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
    }
    
    addStarsBackground() {
        const starsGeometry = new THREE.BufferGeometry();
        const starCount = 1000;
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 100;
            positions[i + 1] = (Math.random() - 0.5) * 100;
            positions[i + 2] = (Math.random() - 0.5) * 100;
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5,
            sizeAttenuation: false
        });
        
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
    }

    resetOrientation() {
        this.orientation = { pitch: 0, yaw: 0, roll: 0 };
        this.updateOrientation(0, 0, 0);
    }

    toggleAnimation() {
        this.animationEnabled = !this.animationEnabled;
        return this.animationEnabled;
    }

    setOrbitTarget(satellite) {
        if (this.controls && satellite) {
            this.controls.target.copy(satellite.position);
            this.controls.update();
        }
    }

    onWindowResize() {
        if (!this.container || !this.camera || !this.renderer) return;
        
        const rect = this.container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    showLoadingMessage() {
        const message = document.getElementById('loadingMessage');
        if (message) {
            message.style.display = 'block';
        }
    }

    cleanup() {
        // Remove event listeners
        if (this.boundResizeHandler) {
            window.removeEventListener('resize', this.boundResizeHandler);
        }
        
        // Dispose of Three.js objects
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.scene) {
            this.scene.clear();
        }
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        console.log('Satellite visualization cleaned up');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SatelliteVisualization;
}

// Global function for easy initialization
function initializeSatelliteVisualization(containerId) {
    return new SatelliteVisualization(containerId);
}
