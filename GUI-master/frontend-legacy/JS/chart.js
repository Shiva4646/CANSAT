(function () {
  const MAX_POINTS = 30;

  const palette = {
    cyan: '#00f0ff',
    red: '#ff3366',
    blue: '#0088ff',
    green: '#00e676',
    grid: '#162235',
    muted: '#94a3b8',
    slate: '#64748b',
    panel: '#0b111e'
  };

  function ensureCanvas(id) {
    return document.getElementById(id);
  }

  function seedSeries(length, value) {
    return Array.from({ length }, () => value);
  }

  function pushSlidingValue(dataset, value) {
    dataset.push({ x: Date.now(), y: Number(value) || 0 });
    if (dataset.length > MAX_POINTS) {
      dataset.shift();
    }
  }

  function createMainTelemetryChart() {
    const canvas = ensureCanvas('telemetryChart');
    if (!canvas || typeof Chart === 'undefined') return null;

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height || 220);
    gradient.addColorStop(0, 'rgba(0, 240, 255, 0.46)');
    gradient.addColorStop(1, 'rgba(0, 240, 255, 0.02)');

    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Altitude',
          data: seedSeries(MAX_POINTS, 0).map((value, index) => ({ x: Date.now() - (MAX_POINTS - index) * 1000, y: value })),
          borderColor: palette.cyan,
          backgroundColor: gradient,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: 'start',
          tension: 0.28,
          cubicInterpolationMode: 'monotone'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: {
          mode: 'nearest',
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            callbacks: {
              title(items) {
                const ts = items[0]?.parsed?.x ?? Date.now();
                return new Date(ts).toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
              },
              label(context) {
                return `${Number(context.parsed.y).toFixed(1)} m`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'second',
              tooltipFormat: 'HH:mm:ss',
              displayFormats: { second: 'HH:mm:ss' }
            },
            grid: {
              color: palette.grid,
              drawBorder: false
            },
            ticks: {
              color: palette.muted,
              autoSkip: true,
              maxTicksLimit: 6,
              callback(value) {
                const date = new Date(value);
                return date.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
              }
            },
            title: { display: false }
          },
          y: {
            min: 0,
            max: 1.2,
            grid: {
              color: palette.grid,
              drawBorder: false
            },
            ticks: {
              color: palette.muted,
              maxTicksLimit: 5
            },
            title: {
              display: true,
              text: 'Altitude (m)',
              color: palette.muted,
              font: { size: 11, weight: '600' }
            }
          }
        }
      }
    });

    return chart;
  }

  function createTripleAxisChart(canvasId, label) {
    const canvas = ensureCanvas(canvasId);
    if (!canvas || typeof Chart === 'undefined') return null;

    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [
          {
            label: `${label} X`,
            data: seedSeries(MAX_POINTS, 0).map((value, index) => ({ x: Date.now() - (MAX_POINTS - index) * 1000, y: value })),
            borderColor: palette.red,
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 0,
            tension: 0.2,
            animation: false
          },
          {
            label: `${label} Y`,
            data: seedSeries(MAX_POINTS, 0).map((value, index) => ({ x: Date.now() - (MAX_POINTS - index) * 1000, y: value })),
            borderColor: palette.blue,
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 0,
            tension: 0.2,
            animation: false
          },
          {
            label: `${label} Z`,
            data: seedSeries(MAX_POINTS, 0).map((value, index) => ({ x: Date.now() - (MAX_POINTS - index) * 1000, y: value })),
            borderColor: palette.green,
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 0,
            tension: 0.2,
            animation: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            type: 'time',
            time: { unit: 'second', displayFormats: { second: 'HH:mm:ss' } },
            grid: { color: palette.grid, drawBorder: false },
            ticks: { display: false }
          },
          y: {
            grid: { color: palette.grid, drawBorder: false },
            ticks: { color: palette.muted, maxTicksLimit: 4 }
          }
        }
      }
    });

    return chart;
  }

  function updateDataset(chart, seriesName, value) {
    if (!chart || !chart.data || !chart.data.datasets) return;
    const target = chart.data.datasets.find((set) => set.label && set.label.toLowerCase().includes(seriesName));
    if (!target) return;

    const point = { x: Date.now(), y: Number(value) || 0 };
    target.data.push(point);
    if (target.data.length > MAX_POINTS) {
      target.data.shift();
    }
    chart.update('none');
  }

  function updateMainChart(value) {
    const chart = window.mainTelemetryChart;
    if (!chart) return;
    const ds = chart.data.datasets[0];
    ds.data.push({ x: Date.now(), y: Number(value) || 0 });
    if (ds.data.length > MAX_POINTS) ds.data.shift();
    chart.update('none');
  }

  function updateTripleAxisChart(chart, xValue, yValue, zValue) {
    if (!chart) return;
    const ts = Date.now();
    chart.data.datasets[0].data.push({ x: ts, y: Number(xValue) || 0 });
    chart.data.datasets[1].data.push({ x: ts, y: Number(yValue) || 0 });
    chart.data.datasets[2].data.push({ x: ts, y: Number(zValue) || 0 });

    for (const dataset of chart.data.datasets) {
      if (dataset.data.length > MAX_POINTS) dataset.data.shift();
    }
    chart.update('none');
  }

  document.addEventListener('DOMContentLoaded', function () {
    const mainChart = createMainTelemetryChart();
    const accelChart = createTripleAxisChart('accelChart', 'Accel');
    const gyroChart = createTripleAxisChart('gyroChart', 'Gyro');
    const magChart = createTripleAxisChart('magChart', 'Mag');

    window.mainTelemetryChart = mainChart;
    window.accelChart = accelChart;
    window.gyroChart = gyroChart;
    window.magChart = magChart;
    window.updateMainTelemetryChart = updateMainChart;
    window.updateTripleAxisChart = updateTripleAxisChart;
  });
})();
