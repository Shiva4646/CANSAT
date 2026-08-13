// Telemetry to UI update
window.handleTelemetryUpdate = function handleTelemetryUpdate(data) {
  if (!data) return;

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText('lat', data.latitude || '--');
  setText('lon', data.longitude || '--');
  setText('gnssAlt', data.gnss_altitude || data.altitude || '--');
  setText('pPara', data.primary_parachute || '--');
  setText('sPara', data.secondary_parachute || '--');

  if (data.packet_count !== undefined) {
    setText('packetCount', data.packet_count);
  }

  if (data.signal !== undefined) {
    setText('signal', `SIGNAL: ${data.signal} dBm`);
  }

  if (data.data_rate !== undefined) {
    setText('dataRate', `DATA RATE: ${data.data_rate} kB/s`);
  }

  ['temperature', 'pressure', 'altitude', 'humidity'].forEach((key) => {
    if (data[key] !== undefined && window.charts && window.charts[key]) {
      window.charts[key].data.datasets[0].data.push({
        x: Date.now(),
        y: parseFloat(data[key])
      });
      setText(`${key}Display`, `${data[key]} ${window.chartUnits[key]}`);
    }
  });

  const batteryVoltage = data.battery_voltage !== undefined ? data.battery_voltage : data.voltage;
  if (batteryVoltage !== undefined && window.batteryVoltageChart) {
    window.batteryVoltageChart.data.datasets[0].data = [parseFloat(batteryVoltage)];
    window.batteryVoltageChart.update();
    setText('voltageDisplay', `${batteryVoltage} V`);
  }

  if (data.battery_current !== undefined && window.batteryCurrentChart) {
    window.batteryCurrentChart.data.datasets[0].data = [parseFloat(data.battery_current)];
    window.batteryCurrentChart.update();
    setText('currentDisplay', `${data.battery_current} mA`);
  }

  if (data.power !== undefined && window.powerChart) {
    window.powerChart.data.datasets[0].data = [parseFloat(data.power)];
    window.powerChart.update();
    setText('powerDisplay', `${data.power} W`);
  }

  if (data.gas_resistance !== undefined) {
    setText('gasResistance', data.gas_resistance);
  }

  if (data.accel_x !== undefined && data.accel_y !== undefined && data.accel_z !== undefined && window.accelChart) {
    const t = Date.now();
    window.accelChart.data.datasets[0].data.push({ x: t, y: parseFloat(data.accel_x) });
    window.accelChart.data.datasets[1].data.push({ x: t, y: parseFloat(data.accel_y) });
    window.accelChart.data.datasets[2].data.push({ x: t, y: parseFloat(data.accel_z) });
    const mag = window.vectorMagnitude(+data.accel_x, +data.accel_y, +data.accel_z);
    setText('accelDisplay', `|a| = ${mag} m/s²`);
  }

  if (data.gyro_x !== undefined && data.gyro_y !== undefined && data.gyro_z !== undefined && window.gyroChart) {
    const t = Date.now();
    window.gyroChart.data.datasets[0].data.push({ x: t, y: parseFloat(data.gyro_x) });
    window.gyroChart.data.datasets[1].data.push({ x: t, y: parseFloat(data.gyro_y) });
    window.gyroChart.data.datasets[2].data.push({ x: t, y: parseFloat(data.gyro_z) });
    const mag = window.vectorMagnitude(+data.gyro_x, +data.gyro_y, +data.gyro_z);
    setText('gyroDisplay', `|ω| = ${mag} °/s`);
    if (typeof updateSatelliteOrientation === 'function') {
      updateSatelliteOrientation(data.gyro_x, data.gyro_y, data.gyro_z);
    }
  }

  if (data.mag_x !== undefined && data.mag_y !== undefined && data.mag_z !== undefined && window.magChart) {
    const t = Date.now();
    window.magChart.data.datasets[0].data.push({ x: t, y: parseFloat(data.mag_x) });
    window.magChart.data.datasets[1].data.push({ x: t, y: parseFloat(data.mag_y) });
    window.magChart.data.datasets[2].data.push({ x: t, y: parseFloat(data.mag_z) });
    const mag = window.vectorMagnitude(+data.mag_x, +data.mag_y, +data.mag_z);
    setText('magDisplay', `|B| = ${mag} μT`);
  }

  if (data.latitude !== undefined && data.longitude !== undefined && typeof updateMap === 'function') {
    updateMap(data.latitude, data.longitude, data.altitude);
  }
};

