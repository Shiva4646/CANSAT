(function () {
  if (typeof io === 'undefined') {
    console.error('Socket.IO client is not loaded.');
    return;
  }

  const socket = io('http://localhost:3000', {
    reconnectionDelay: 1000,
    reconnection: true,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    forceNew: true
  });
  
  const statusElement = document.getElementById('status') || document.querySelector('.status-group .status-value');
  let connected = false;
  let packetsSinceStart = 0;

  function setSocketStatus(label, color) {
    if (!statusElement) return;
    statusElement.textContent = label;
    statusElement.style.color = color;
  }

  socket.on('connect', () => {
    connected = true;
    setSocketStatus('CONNECTED', '#00e676');
    console.log('Socket.IO connected');
    
    if (typeof window.updatePacketCount === 'function') {
      window.updatePacketCount(packetsSinceStart);
    }
  });

  socket.on('disconnect', () => {
    connected = false;
    setSocketStatus('DISCONNECTED', '#ff3366');
    console.log('Socket.IO disconnected');
  });

  socket.on('reconnect', () => {
    connected = true;
    setSocketStatus('RECONNECTED', '#00e676');
    console.log('Socket.IO reconnected');
  });

  socket.on('new_data', (data) => {
    if (typeof window.handleTelemetryUpdate === 'function') {
      window.handleTelemetryUpdate(data);
    }

    packetsSinceStart++;
    if (typeof window.updatePacketCount === 'function') {
      window.updatePacketCount(packetsSinceStart);
    }
  });

  socket.on('telemetry_update', (data) => {
    if (typeof window.handleTelemetryUpdate === 'function') {
      window.handleTelemetryUpdate(data);
    }

    packetsSinceStart++;
    if (typeof window.updatePacketCount === 'function') {
      window.updatePacketCount(packetsSinceStart);
    }
  });

  socket.on('serial_config', (config) => {
    if (config && config.baudRate) {
      const baud = document.getElementById('baudRate') || document.querySelector('.stats-grid .stat-item:nth-child(2) .stat-value');
      if (baud) baud.textContent = config.baudRate;
    }
    if (config && config.port) {
      const port = document.getElementById('portDisplay') || document.querySelector('.stats-grid .stat-item:nth-child(1) .stat-value');
      if (port) port.textContent = config.port;
    }
  });

  socket.on('port_detected', (data) => {
    if (data && data.port) {
      const port = document.getElementById('portDisplay') || document.querySelector('.stats-grid .stat-item:nth-child(1) .stat-value');
      if (port) port.textContent = data.port;
    }
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    setSocketStatus('CONNECTION ERROR', '#ff6b6b');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  window.socket = socket;
})();

