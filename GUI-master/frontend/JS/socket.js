if (typeof io === 'undefined') {
  console.error('Socket.IO client is not loaded.');
} else {
const socket = io('http://localhost:3000');

const statusElement = document.getElementById('status');
const toggleCheckbox = document.getElementById('checkboxInput');
let isReceivingSignals = true;

if (toggleCheckbox) {
  toggleCheckbox.checked = true;
  toggleCheckbox.addEventListener('change', function() {
    isReceivingSignals = this.checked;
    if (!statusElement) return;
    if (isReceivingSignals) {
      statusElement.textContent = 'STATUS: CONNECTED';
      statusElement.style.color = '#22c55e';
    } else {
      statusElement.textContent = 'STATUS: SIGNAL PAUSED';
      statusElement.style.color = '#f59e0b';
    }
  });
}

socket.on('connect', () => {
  if (!statusElement) return;
  statusElement.textContent = isReceivingSignals ? 'STATUS: CONNECTED' : 'STATUS: SIGNAL PAUSED';
  statusElement.style.color = isReceivingSignals ? '#22c55e' : '#f59e0b';
});

socket.on('disconnect', () => {
  if (!statusElement) return;
  statusElement.textContent = 'STATUS: DISCONNECTED';
  statusElement.style.color = '#ef4444';
});

socket.on('serial_config', (config) => {
  const baudElem = document.getElementById('baudRate');
  const portElem = document.getElementById('port-display') || document.getElementById('portDisplay');
  if (baudElem && config?.baudRate !== undefined) baudElem.textContent = config.baudRate;
  if (portElem && config?.port !== undefined) portElem.textContent = config.port;
});

socket.on('port_detected', (data) => {
  const portElem = document.getElementById('port-display') || document.getElementById('portDisplay');
  if (portElem && data?.port) {
    portElem.textContent = data.port;
  }
});

socket.on('new_data', (data) => {
  if (!isReceivingSignals) return;
  if (typeof window.handleTelemetryUpdate === 'function') {
    window.handleTelemetryUpdate(data);
  }
});
}
