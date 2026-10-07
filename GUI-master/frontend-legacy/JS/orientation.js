(function () {
  let satelliteVisualization = null;
  let radarAnimationId = null;

  function getOrCreateMetricValue(id, selector) {
    let element = document.getElementById(id);
    if (!element && selector) {
      element = document.querySelector(selector);
    }
    return element;
  }

  function setMotionBadge(value) {
    const motionElement = getOrCreateMetricValue('motionIntensity', '.orientation-panel .motion-pill, .motion-badge, .orientation-row:nth-child(4)');
    if (!motionElement) return;
    motionElement.textContent = value;
    motionElement.className = 'motion-badge ' + (value === 'STABLE' ? 'stable' : value === 'MOVING' ? 'active' : 'alert');
    if (value === 'STABLE') motionElement.style.color = '#00e676';
    else if (value === 'MOVING') motionElement.style.color = '#ffc107';
    else motionElement.style.color = '#ff3366';
  }

  function ensureTextReadouts() {
    const panel = document.querySelector('.orientation-panel') || document.querySelector('.attitude-card .orientation-panel');
    if (!panel) return;

    const rows = panel.querySelectorAll('.orientation-row');
    if (rows.length >= 3) {
      const rollValue = rows[0].querySelector('.orientation-value');
      const pitchValue = rows[1].querySelector('.orientation-value');
      const yawValue = rows[2].querySelector('.orientation-value');
      
      if (rollValue) {
        rollValue.id = 'rollDisplay';
        rollValue.style.color = '#ff3366';
      }
      if (pitchValue) {
        pitchValue.id = 'pitchDisplay';
        pitchValue.style.color = '#00f0ff';
      }
      if (yawValue) {
        yawValue.id = 'yawDisplay';
        yawValue.style.color = '#0088ff';
      }
    }
  }

  function applyOrientationReadout(roll, pitch, yaw) {
    const rollEl = getOrCreateMetricValue('rollDisplay', '.orientation-row:nth-child(1) .orientation-value');
    const pitchEl = getOrCreateMetricValue('pitchDisplay', '.orientation-row:nth-child(2) .orientation-value');
    const yawEl = getOrCreateMetricValue('yawDisplay', '.orientation-row:nth-child(3) .orientation-value');

    const rollNum = Number(roll);
    const pitchNum = Number(pitch);
    const yawNum = Number(yaw);

    if (rollEl) {
      rollEl.textContent = `${rollNum.toFixed(2)}°`;
      rollEl.style.color = rollNum < 0 ? '#ff3366' : '#ff3366';
      rollEl.classList.toggle('negative', rollNum < 0);
      rollEl.classList.toggle('positive', rollNum >= 0);
    }
    if (pitchEl) {
      pitchEl.textContent = `${pitchNum.toFixed(2)}°`;
      pitchEl.style.color = '#00f0ff';
      pitchEl.classList.toggle('negative', pitchNum < 0);
      pitchEl.classList.toggle('positive', pitchNum >= 0);
    }
    if (yawEl) {
      yawEl.textContent = `${yawNum.toFixed(2)}°`;
      yawEl.style.color = '#0088ff';
      yawEl.classList.toggle('negative', yawNum < 0);
      yawEl.classList.toggle('positive', yawNum >= 0);
    }

    const motionMagnitude = Math.abs(rollNum) + Math.abs(pitchNum) + Math.abs(yawNum);
    if (motionMagnitude < 0.5) setMotionBadge('STABLE');
    else if (motionMagnitude < 25) setMotionBadge('MOVING');
    else setMotionBadge('TUMBLING');

    if (satelliteVisualization && typeof satelliteVisualization.updateFromTelemetry === 'function') {
      satelliteVisualization.updateFromTelemetry({ roll: rollNum, pitch: pitchNum, yaw: yawNum });
    }
  }

  function renderRadarCanvas(targetData = {}) {
    const container = document.querySelector('.radar-panel') || document.querySelector('.radar-card .radar-panel');
    if (!container) return;

    let canvas = document.getElementById('radarCanvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'radarCanvas';
      canvas.width = 260;
      canvas.height = 220;
      container.style.position = 'relative';
      container.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.35;

    const renderFrame = (angle = 0) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#05080e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw concentric circles
      for (let r = 1; r <= 5; r += 1) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * (r / 5), 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw crosshairs
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw compass labels
      const points = [
        { x: centerX, y: centerY - radius - 14, label: 'N' },
        { x: centerX + radius + 10, y: centerY + 5, label: 'E' },
        { x: centerX, y: centerY + radius + 14, label: 'S' },
        { x: centerX - radius - 10, y: centerY + 5, label: 'W' }
      ];

      ctx.fillStyle = '#9db4ca';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      points.forEach((point) => {
        ctx.fillText(point.label, point.x, point.y);
      });

      // Draw sweep effect
      const sweepAngle = (angle % 360) * (Math.PI / 180);
      const sweep = ctx.createRadialGradient(centerX, centerY, 15, centerX, centerY, radius);
      sweep.addColorStop(0, 'rgba(255, 51, 102, 0.1)');
      sweep.addColorStop(1, 'rgba(255, 51, 102, 0)');
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, sweepAngle - 0.6, sweepAngle + 0.6);
      ctx.closePath();
      ctx.fillStyle = sweep;
      ctx.fill();

      // Draw target marker (CANSAT)
      const targetAngle = targetData.angle ?? 1.1;
      const targetRadius = (targetData.distance ?? 0.65) * radius;
      const targetX = centerX + Math.cos(targetAngle) * targetRadius;
      const targetY = centerY + Math.sin(targetAngle) * targetRadius;

      // Target ring
      ctx.beginPath();
      ctx.arc(targetX, targetY, 8, 0, Math.PI * 2);
      ctx.strokeStyle = '#ff3366';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ff3366';
      ctx.shadowBlur = 12;
      ctx.stroke();

      // Target center dot
      ctx.beginPath();
      ctx.arc(targetX, targetY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ff3366';
      ctx.fill();
      ctx.shadowBlur = 0;

      // Target crosshairs
      ctx.beginPath();
      ctx.moveTo(targetX - 8, targetY);
      ctx.lineTo(targetX + 8, targetY);
      ctx.moveTo(targetX, targetY - 8);
      ctx.lineTo(targetX, targetY + 8);
      ctx.strokeStyle = '#ff3366';
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    if (radarAnimationId) cancelAnimationFrame(radarAnimationId);
    
    let angle = 0;
    const animate = () => {
      angle = (angle + 6) % 360;
      renderFrame(angle);
      radarAnimationId = requestAnimationFrame(animate);
    };
    animate();
  }

  function initializeSatelliteVisualization() {
    if (typeof THREE === 'undefined' || typeof window.SatelliteVisualization === 'undefined') {
      console.warn('Three.js or SatelliteVisualization not available');
      return false;
    }

    const container = document.getElementById('attitude-model');
    if (!container) {
      console.error('attitude-model container not found');
      return false;
    }

    try {
      satelliteVisualization = new window.SatelliteVisualization('attitude-model');
      if (satelliteVisualization && typeof satelliteVisualization.updateFromTelemetry === 'function') {
        satelliteVisualization.updateFromTelemetry({ roll: -0.08, pitch: 89.96, yaw: 69.11 });
      }
    } catch (e) {
      console.error('Failed to initialize SatelliteVisualization:', e);
      return false;
    }

    renderRadarCanvas();
    return true;
  }

  document.addEventListener('DOMContentLoaded', function () {
    ensureTextReadouts();
    const initialRoll = -0.08;
    const initialPitch = 89.96;
    const initialYaw = 69.11;
    applyOrientationReadout(initialRoll, initialPitch, initialYaw);
    initializeSatelliteVisualization();

    const disconnectButton = document.querySelector('.radar-footer button') || document.getElementById('disconnectFeedBtn');
    if (disconnectButton) {
      disconnectButton.addEventListener('click', function () {
        const badgeElement = document.querySelector('.radar-header .mini-badge');
        if (badgeElement) badgeElement.textContent = 'FEED DISCONNECTED';
        this.textContent = 'RECONNECT FEED';
        this.disabled = false;
      });
    }
  });

  window.applyOrientationTelemetry = applyOrientationReadout;
  window.initializeSatelliteVisualization = initializeSatelliteVisualization;
  window.updateRadarCanvas = renderRadarCanvas;
})();
