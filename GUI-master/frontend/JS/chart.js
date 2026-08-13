// Charts Section
const chartColors = {
  temperature: 'orange',
  pressure: '#10b981',
  altitude: '#3b82f6',
  humidity: 'yellow'
};

const chartUnits = {
  temperature: '°C',
  pressure: 'hPa',
  altitude: 'm',
  humidity: '%'
};

window.chartUnits = chartUnits;
window.charts = {};
window.batteryVoltageChart = null;
window.batteryCurrentChart = null;
window.powerChart = null;
window.accelChart = null;
window.gyroChart = null;
window.magChart = null;

window.vectorMagnitude = function vectorMagnitude(x, y, z) {
  return Math.sqrt(x * x + y * y + z * z).toFixed(2);
};

function createRealtimeChart(id, label, color, unit) {
  const el = document.getElementById(id);
  if (!el) return null;

  return new Chart(el, {
    type: 'line',
    data: {
      datasets: [{
        label,
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        data: []
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          type: 'realtime',
          realtime: {
            duration: 5000,
            refresh: 1000,
            delay: 1000
          },
          ticks: { display: false }
        },
        y: {
          ticks: {
            color,
            callback: (val) => `${val} ${unit}`
          }
        }
      },
      plugins: {
        legend: { labels: { color } }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  window.charts = {
    temperature: createRealtimeChart('temperatureChart', 'Temperature', chartColors.temperature, chartUnits.temperature),
    pressure: createRealtimeChart('pressureChart', 'Pressure', chartColors.pressure, chartUnits.pressure),
    altitude: createRealtimeChart('altitudeChart', 'Altitude', chartColors.altitude, chartUnits.altitude),
    humidity: createRealtimeChart('humidityChart', 'Humidity', chartColors.humidity, chartUnits.humidity)
  };

  if (window.charts.pressure) {
    window.charts.pressure.options.scales.y.ticks.callback = function(val) {
      return parseFloat(val).toFixed(3) + ' ' + chartUnits.pressure;
    };
  }

  const packetCount = document.getElementById('packetCount');
  if (packetCount) {
    packetCount.textContent = '0';
  }

  function createBarChart(id, max, color, label) {
    const el = document.getElementById(id);
    if (!el) return null;

    return new Chart(el, {
      type: 'bar',
      data: {
        labels: [label],
        datasets: [{
          data: [0],
          backgroundColor: color,
          borderColor: color,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: { beginAtZero: true, max: max, ticks: { color: '#ffffff' } }
        }
      }
    });
  }

  window.batteryVoltageChart = createBarChart('batteryVoltageChart', 5, '#3b82f6', 'Voltage');
  window.batteryCurrentChart = createBarChart('batteryCurrentChart', 2000, '#f97316', 'Current');
  window.powerChart = createBarChart('powerChart', 10, '#10b981', 'Power');

  const axisColors = { x: '#f87171', y: '#60a5fa', z: '#34d399' };
  function create3AxisChart(id, label, unit) {
    const el = document.getElementById(id);
    if (!el) return null;

    return new Chart(el, {
      type: 'line',
      data: {
        datasets: [
          { label: `${label} X`, borderColor: axisColors.x, backgroundColor: `${axisColors.x}33`, data: [], borderWidth: 2, pointRadius: 0 },
          { label: `${label} Y`, borderColor: axisColors.y, backgroundColor: `${axisColors.y}33`, data: [], borderWidth: 2, pointRadius: 0 },
          { label: `${label} Z`, borderColor: axisColors.z, backgroundColor: `${axisColors.z}33`, data: [], borderWidth: 2, pointRadius: 0 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: { type: 'realtime', realtime: { duration: 5000, refresh: 1000, delay: 1000 }, ticks: { display: false } },
          y: { ticks: { color: '#fff', callback: (val) => `${val} ${unit}` } }
        },
        plugins: { legend: { labels: { color: '#fff' } } }
      }
    });
  }

  window.accelChart = create3AxisChart('accelChart', 'Accel', 'm/s²');
  window.gyroChart = create3AxisChart('gyroChart', 'Gyro', '°/s');
  window.magChart = create3AxisChart('magChart', 'Mag', 'μT');
});