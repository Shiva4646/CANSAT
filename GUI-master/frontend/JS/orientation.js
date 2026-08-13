let satelliteVisualization = null;
    let satelliteRotation = { roll: 0, pitch: 0, yaw: 0 };
    
    // Initialize the 3D satellite visualization
    function initializeSatelliteVisualization() {
      try {
        if (typeof THREE === 'undefined' || typeof SatelliteVisualization === 'undefined') {
          return false;
        }

        const container = document.getElementById('satellite3d');
        if (!container) {
          return false;
        }

        satelliteVisualization = new SatelliteVisualization('satellite3d');
        
        // Add button event listeners
        const resetBtn = document.getElementById('resetViewBtn');
        const wireframeBtn = document.getElementById('wireframeBtn');
        
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            if (satelliteVisualization) {
              satelliteVisualization.resetView();
            }
          });
        }
        
        if (wireframeBtn) {
          wireframeBtn.addEventListener('click', () => {
            if (satelliteVisualization) {
              satelliteVisualization.toggleWireframe();
            }
          });
        }
        
        // Listen for orientation updates from the visualization
        window.addEventListener('orientationUpdate', (event) => {
          const { pitch, yaw, roll } = event.detail;
          document.getElementById('rollDisplay').textContent = roll + '°';
          document.getElementById('pitchDisplay').textContent = pitch + '°';
          document.getElementById('yawDisplay').textContent = yaw + '°';
        });
        
        console.log('3D Satellite visualization initialized successfully');
        return true;
      } catch (error) {
        console.error('Failed to initialize 3D satellite visualization:', error);
        // Fallback to 2D representation could be added here
        return false;
      }
    }

    function updateSatelliteOrientation(gyroX, gyroY, gyroZ) {
      if (gyroX === undefined || gyroY === undefined || gyroZ === undefined) return;
      
      // Integration factor for gyroscope data (adjust as needed)
      const integrationFactor = 0.1;
      
      // Update rotation values
      satelliteRotation.roll += parseFloat(gyroX) * integrationFactor;
      satelliteRotation.pitch += parseFloat(gyroY) * integrationFactor;
      satelliteRotation.yaw += parseFloat(gyroZ) * integrationFactor;
      
      // Keep rotations in reasonable bounds
      satelliteRotation.roll = satelliteRotation.roll % 360;
      satelliteRotation.pitch = satelliteRotation.pitch % 360;
      satelliteRotation.yaw = satelliteRotation.yaw % 360;
      
      // Update 3D visualization if available
      if (satelliteVisualization) {
        satelliteVisualization.updateOrientation(
          satelliteRotation.pitch,
          satelliteRotation.yaw,
          satelliteRotation.roll
        );
      }
      
      // Update displays
      try {
        document.getElementById('rollDisplay').textContent = satelliteRotation.roll.toFixed(1) + '°';
        document.getElementById('pitchDisplay').textContent = satelliteRotation.pitch.toFixed(1) + '°';
        document.getElementById('yawDisplay').textContent = satelliteRotation.yaw.toFixed(1) + '°';
        
        // Motion status based on gyroscope magnitude
        const totalMotion = Math.abs(parseFloat(gyroX)) + Math.abs(parseFloat(gyroY)) + Math.abs(parseFloat(gyroZ));
        const motionDisplay = document.getElementById('motionIntensity');
        if (motionDisplay) {
          if (totalMotion < 0.5) {
            motionDisplay.textContent = 'STABLE';
            motionDisplay.className = 'text-green-400 text-xs mt-1';
          } else if (totalMotion < 2.0) {
            motionDisplay.textContent = 'MOVING';
            motionDisplay.className = 'text-yellow-400 text-xs mt-1';
          } else {
            motionDisplay.textContent = 'TUMBLING';
            motionDisplay.className = 'text-red-400 text-xs mt-1 animate-pulse';
          }
        }
      } catch (error) {
        console.error('Error updating orientation display:', error);
      }
    }
    
    // Initialize the 3D visualization when the DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
      let attempts = 0;
      const maxAttempts = 25;

      const tryInit3D = () => {
        if (satelliteVisualization) return;

        const initialized = initializeSatelliteVisualization();
        if (initialized) return;

        attempts += 1;
        if (attempts < maxAttempts) {
          setTimeout(tryInit3D, 200);
        } else {
          console.error('Satellite orientation view failed to initialize. Check Three.js loading.');
        }
      };

      tryInit3D();
    });