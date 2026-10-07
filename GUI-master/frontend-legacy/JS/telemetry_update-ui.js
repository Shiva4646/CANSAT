(function () {
  const missionStart = Date.now();

  function getElementByAnyId(ids, fallbackSelector) {
    for (const id of ids) {
      const match = document.getElementById(id);
      if (match) return match;
    }
    if (fallbackSelector) {
      return document.querySelector(fallbackSelector);
    }
    return null;
  }

  function formatIstTime(date) {
    return date.toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  function setText(idList, value, fallbackSelector) {
    const el = getElementByAnyId(idList, fallbackSelector);
    if (el) el.textContent = value;
  }

  function updateIstClock() {
    const clockEl = getElementByAnyId(['istTime'], '.clock-group .display-value');
    if (clockEl) {
      const now = new Date();
      clockEl.textContent = formatIstTime(now);
    }
  }

  function updateMissionTimer() {
    const missionEl = getElementByAnyId(['missionTime'], '.mission-group .display-value');
    if (!missionEl) return;
    const elapsedSeconds = Math.floor((Date.now() - missionStart) / 1000);
    const total = Math.max(elapsedSeconds, 15);
    const hours = String(Math.floor(total / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const seconds = String(total % 60).padStart(2, '0');
    missionEl.textContent = `${hours}:${minutes}:${seconds}`;
  }

  function updateStatusField(level, value) {
    const statusEl = getElementByAnyId(['status'], '.status-group .status-value');
    if (!statusEl) return;
    statusEl.textContent = value;
    statusEl.className = 'status-value ' + (level === 'ok' ? 'connected' : level === 'warn' ? 'warning' : 'error');
  }

  function updatePacketCount(value) {
    const count = Number(value) || 0;
    const packetEl = getElementByAnyId(['packetCount'], '.stats-grid .stat-item:nth-child(3) .stat-value');
    if (packetEl) packetEl.textContent = String(count);
    window.lastPacketCount = Number(count);
  }

  function updateSensorCharts(data) {
    if (!data || typeof data !== 'object') return;

    // Accelerometer data
    const accelX = Number(data.accel_x ?? data.accelX ?? 0);
    const accelY = Number(data.accel_y ?? data.accelY ?? 0);
    const accelZ = Number(data.accel_z ?? data.accelZ ?? 0);

    if (typeof window.updateTripleAxisChart === 'function' && window.accelChart) {
      window.updateTripleAxisChart(window.accelChart, accelX, accelY, accelZ);
    }

    // Gyroscope data
    const gyroX = Number(data.gyro_x ?? data.gyroX ?? 0);
    const gyroY = Number(data.gyro_y ?? data.gyroY ?? 0);
    const gyroZ = Number(data.gyro_z ?? data.gyroZ ?? 0);

    if (typeof window.updateTripleAxisChart === 'function' && window.gyroChart) {
      window.updateTripleAxisChart(window.gyroChart, gyroX, gyroY, gyroZ);
    }

    // Magnetometer data
    const magX = Number(data.mag_x ?? data.magX ?? 0);
    const magY = Number(data.mag_y ?? data.magY ?? 0);
    const magZ = Number(data.mag_z ?? data.magZ ?? 0);

    if (typeof window.updateTripleAxisChart === 'function' && window.magChart) {
      window.updateTripleAxisChart(window.magChart, magX, magY, magZ);
    }

    // Main telemetry chart (Altitude)
    if (typeof window.updateMainTelemetryChart === 'function') {
      const altitude = Number(data.altitude ?? data.alt ?? data.gnss_altitude ?? 0.6);
      window.updateMainTelemetryChart(altitude);
    }
  }

  function hydrateTelemetryData(data) {
    if (!data || typeof data !== 'object') return;

    const latitude = Number(data.latitude ?? data.lat ?? data.gnss_lat ?? 13.7331);
    const longitude = Number(data.longitude ?? data.lon ?? data.gnss_lon ?? 80.2047);
    const altitude = Number(data.altitude ?? data.alt ?? data.gnss_altitude ?? 0.6);

    setText(['mapLat', 'gpsLatitude'], `${latitude.toFixed(4)}° N`, '.readout-block:nth-child(1) .readout-value');
    setText(['mapLon', 'gpsLongitude'], `${longitude.toFixed(4)}° E`, '.readout-block:nth-child(2) .readout-value');
    setText(['mapAlt', 'gpsAltitude'], `${altitude.toFixed(2)} m`, '.readout-block:nth-child(3) .readout-value');

    const pressure = Number(data.pressure ?? data.pressureValue ?? 101.32);
    const temperature = Number(data.temperature ?? data.temp ?? 26.5);
    const voltage = Number(data.battery_voltage ?? data.voltage ?? 4.07);
    const current = Number(data.battery_current ?? data.current ?? -0.06);
    const humidity = Number(data.humidity ?? 0.4);
    const gasResistance = Number(data.gas_resistance ?? data.gasResistance ?? 0.4);

    setText(['pressureValue'], pressure.toFixed(2), '.telemetry-item:nth-child(1) .metric-figure');
    setText(['tempValue'], temperature.toFixed(1), '.telemetry-item:nth-child(2) .metric-figure');
    setText(['voltageValue'], voltage.toFixed(2), '.telemetry-item:nth-child(3) .metric-figure');
    setText(['currentValue'], current.toFixed(2), '.telemetry-item:nth-child(4) .metric-figure');
    setText(['altitudeValue'], altitude.toFixed(2), '.telemetry-item:nth-child(5) .metric-figure');
    setText(['humidityValue'], humidity.toFixed(2), '.telemetry-item:nth-child(6) .metric-figure');
    setText(['gasResistanceValue'], gasResistance.toFixed(2), '.telemetry-item.wide-item .metric-figure');

    const packetValue = Number(data.packet_count ?? data.packetCount ?? window.lastPacketCount ?? 0) + 1;
    updatePacketCount(packetValue);

    if (data.port || data.serial_port) {
      setText(['portDisplay'], String(data.port || data.serial_port), '.stats-grid .stat-item:nth-child(1) .stat-value');
    }

    if (data.baudRate || data.baud_rate) {
      setText(['baudDisplay', 'baudRate'], String(data.baudRate || data.baud_rate), '.stats-grid .stat-item:nth-child(2) .stat-value');
    }

    if (data.signal !== undefined) {
      const signal = Number(data.signal);
      const signalText = Number.isFinite(signal) ? `${signal.toFixed(0)}` : String(data.signal);
      const signalEl = document.getElementById('signal') || document.querySelector('.signal-group .display-value');
      if (signalEl) signalEl.textContent = signalText;
    }

    const rollValue = Number(data.roll ?? data.roll_deg ?? -0.08);
    const pitchValue = Number(data.pitch ?? data.pitch_deg ?? 89.96);
    const yawValue = Number(data.yaw ?? data.yaw_deg ?? 69.11);

    if (typeof window.applyOrientationTelemetry === 'function') {
      window.applyOrientationTelemetry(rollValue, pitchValue, yawValue);
    }

    if (typeof window.updateMapPosition === 'function') {
      window.updateMapPosition(latitude, longitude, altitude);
    }

    // Update sensor charts
    updateSensorCharts(data);
  }

  document.addEventListener('DOMContentLoaded', function () {
    updateIstClock();
    updateMissionTimer();
    updateStatusField('ok', 'CONNECTED');
    setInterval(updateIstClock, 1000);
    setInterval(updateMissionTimer, 1000);
  });

  window.handleTelemetryUpdate = hydrateTelemetryData;
  window.updatePacketCount = updatePacketCount;
})();

