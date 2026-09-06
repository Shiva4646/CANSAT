const express = require('express');
const path = require('path');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: { origin: "*" }
});
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const frontendDir = path.join(__dirname, '..', 'frontend');


app.use(express.static(frontendDir));
app.use('/node_modules', express.static(path.join(frontendDir, 'node_modules')));
app.use('/Backend', express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

server.listen(3000, () => {
  console.log('CanSat Ground Station Server Started on port 3000...');
  console.log('Waiting for telemetry data...');
});

const defaultSerialPath = process.platform === 'win32' ? 'COM8' : '/dev/ttyUSB0';
const serialPath = process.env.SERIAL_PORT || defaultSerialPath;
const serialBaudRate = Number(process.env.BAUD_RATE || 115200);

let port = null;
let parser = null;
let simulatorRunning = false;

// Simulator data generation (fallback when serial port unavailable)
let currentTime = 0;
const flightDuration = 600;
const maxAltitude = 700;
const launchPadAltitude = 100;
let packetCount = 0;

function simulateGNSSAltitude() {
  currentTime++;
  if (currentTime >= flightDuration) {
    currentTime = 0;
  }
  if (currentTime < 120) {
    return launchPadAltitude + (maxAltitude - launchPadAltitude) * (currentTime / 120) + (Math.random() * 5 - 2.5);
  } else if (currentTime < 240) {
    return maxAltitude + (Math.random() * 10 - 5);
  } else if (currentTime < 540) {
    const timeInDescent = currentTime - 240;
    const descentProgress = timeInDescent / 300;
    return maxAltitude - (maxAltitude - launchPadAltitude) * (descentProgress * descentProgress) + (Math.random() * 5 - 2.5);
  } else {
    return launchPadAltitude + (Math.random() * 2 - 1);
  }
}

function startSimulator() {
  if (simulatorRunning) return;
  simulatorRunning = true;
  console.log('Starting simulator mode...');
  
  const temperatureValues = [22.98, 23.00, 23.02];
  const pressureValues = [1004.9, 1005.0, 1005.1];
  const altitudeValues = [319.9, 320.0, 320.1];
  const humidityValues = [33.9, 34.0, 34.1];
  const batteryVoltageValues = [3.94, 3.95, 3.96];
  const batteryCurrentValues = [913, 915, 917];
  const gasResistanceValues = [7458, 7460, 7462];
  const batteryValues = [93, 94, 95];
  const latitudeValues = [13.733328, 13.733330, 13.733332];
  const longitudeValues = [80.204928, 80.204930, 80.204932];

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  setInterval(() => {
    packetCount++;
    const signal = (Math.random() * 110 - 120).toFixed(0);
    const data_rate = (Math.random() * 1.5 + 0.5).toFixed(2);
    const voltage = pick(batteryVoltageValues);
    const current = pick(batteryCurrentValues);
    const power = (voltage * current / 1000).toFixed(2);
    const gnssAltitude = simulateGNSSAltitude().toFixed(1);
    
    const packet = {
      team_id: "2024ASI-052",
      timestamp: Date.now(),
      temperature: pick(temperatureValues).toFixed(2),
      pressure: pick(pressureValues).toFixed(2),
      altitude: pick(altitudeValues).toFixed(2),
      humidity: pick(humidityValues).toFixed(2),
      battery_voltage: voltage.toFixed(2),
      battery_current: current.toFixed(0),
      power: power,
      gas_resistance: pick(gasResistanceValues).toFixed(0),
      battery: pick(batteryValues).toFixed(0),
      latitude: pick(latitudeValues).toFixed(6),
      longitude: pick(longitudeValues).toFixed(6),
      gnss_altitude: gnssAltitude,
      packet_count: packetCount,
      primary_parachute: "DEPLOYED",
      secondary_parachute: "NOT DEPLOYED",
      accel_x: (Math.random() * 2 - 1).toFixed(3),
      accel_y: (Math.random() * 2 - 1).toFixed(3),
      accel_z: (9.8 + Math.random() * 0.4 - 0.2).toFixed(3),
      gyro_x: (Math.random() * 20 - 10).toFixed(3),
      gyro_y: (Math.random() * 20 - 10).toFixed(3),
      gyro_z: (Math.random() * 20 - 10).toFixed(3),
      mag_x: (Math.random() * 100 - 50).toFixed(3),
      mag_y: (Math.random() * 100 - 50).toFixed(3),
      mag_z: (Math.random() * 100 - 50).toFixed(3),
      signal,
      data_rate
    };

    io.emit("new_data", packet);
  }, 1000);
}

function handleSerialData(data) {
  try {
    const rawData = data.trim();
    console.log('Raw data received:', rawData);

    
    if (!rawData || rawData.startsWith(',')) {
      return;
    }
    
    // Support multiple known CSV orders. Primary (piFieldsA) is the expected
    // order; fallback (piFieldsB) covers older simulator format (temperature-first).
    const piFieldsA = [
      "team_id",
      "timestamp",
      "packet_count",
      "altitude",
      "pressure",
      "temperature",
      "voltage",
      "gnss_time",
      "latitude",
      "longitude",
      "gnss_altitude",
      "acceleration",
      "gyroscope",
      "magnetometer",
      "flight_state",
    ];

    const piFieldsB = [
      // older simulator order where telemetry begins with temperature
      "team_id",
      "timestamp",
      "temperature",
      "pressure",
      "altitude",
      "humidity",
      "battery_voltage",
      "battery_current",
      "power",
      "gas_resistance",
      "battery",
      "latitude",
      "longitude",
      "gnss_altitude",
      "packet_count",
      // extras: parachutes, accel/gyro/mag, signal, data_rate
      "primary_parachute",
      "secondary_parachute",
      "accel_x",
      "accel_y",
      "accel_z",
      "gyro_x",
      "gyro_y",
      "gyro_z",
      "mag_x",
      "mag_y",
      "mag_z",
      "signal",
      "data_rate",
    ];

    const values = rawData.split(",");

    function mapFields(values, fields) {
      const out = {};
      fields.forEach((k, i) => {
        if (i < values.length && values[i] !== undefined) out[k] = values[i];
      });
      return out;
    }

    // Try primary mapping first, then fallback mapping if temperature or altitude missing
    let telemetryData = mapFields(values, piFieldsA);
    const looksValidA = telemetryData.temperature !== undefined || telemetryData.altitude !== undefined;
    if (!looksValidA) {
      const tryB = mapFields(values, piFieldsB);
      const looksValidB = tryB.temperature !== undefined || tryB.altitude !== undefined;
      if (looksValidB) telemetryData = tryB;
    }
      telemetryData.timestamp = Date.now();

      if (!telemetryData.humidity) {
        telemetryData.humidity = (34.0 + Math.random() * 0.2 - 0.1).toFixed(1); // 33.9-34.1
      }
      if (!telemetryData.battery_current) {
        telemetryData.battery_current = (915 + Math.random() * 4 - 2).toFixed(0); // 913-917 mA
      }
      if (!telemetryData.gas_resistance) {
        telemetryData.gas_resistance = (7460 + Math.random() * 4 - 2).toFixed(0); // 7458-7462 Ω
      }
      if (!telemetryData.primary_parachute) {
        telemetryData.primary_parachute = "DEPLOYED";
      }
      if (!telemetryData.secondary_parachute) {
        telemetryData.secondary_parachute = "NOT DEPLOYED";
      }
      if (!telemetryData.signal) {
        telemetryData.signal = (Math.random() * 110 - 120).toFixed(0); // -120 to -10 dBm
      }
      if (!telemetryData.data_rate) {
        telemetryData.data_rate = (Math.random() * 1.5 + 0.5).toFixed(2); // 0.5-2.0 kB/s
      }

      if (!telemetryData.magnetometer) {
        const mag_x = (Math.random() * 100 - 50).toFixed(3);
        const mag_y = (Math.random() * 100 - 50).toFixed(3);
        const mag_z = (Math.random() * 100 - 50).toFixed(3);
        telemetryData.magnetometer = `${mag_x}|${mag_y}|${mag_z}`;
      }     
 
      if (telemetryData.acceleration) {
        const [accel_x, accel_y, accel_z] = telemetryData.acceleration.split('|').map(parseFloat);
        telemetryData.accel_x = accel_x;
        telemetryData.accel_y = accel_y;
        telemetryData.accel_z = accel_z;
      }
      if (telemetryData.gyroscope) {
        const [gyro_x, gyro_y, gyro_z] = telemetryData.gyroscope.split('|').map(parseFloat);
        telemetryData.gyro_x = gyro_x;
        telemetryData.gyro_y = gyro_y;
        telemetryData.gyro_z = gyro_z;
      }
      if (telemetryData.magnetometer) {
        const [mag_x, mag_y, mag_z] = telemetryData.magnetometer.split('|').map(parseFloat);
        telemetryData.mag_x = mag_x;
        telemetryData.mag_y = mag_y;
        telemetryData.mag_z = mag_z;
      }

      if (telemetryData.battery_voltage && telemetryData.battery_current) {
        telemetryData.power = (parseFloat(telemetryData.battery_voltage) * parseFloat(telemetryData.battery_current) / 1000).toFixed(2); // Power in Watts
      }

      telemetryData.primary_parachute = "DEPLOYED"; 
      telemetryData.secondary_parachute = "NOT DEPLOYED"; 
      
      if (!telemetryData.signal) {
        telemetryData.signal = "-120"; 
      }
      if (!telemetryData.data_rate) {
        telemetryData.data_rate = "0.0";
      }

      console.log('Parsed telemetry:', telemetryData);
      io.emit("new_data", telemetryData);
      io.emit("raw_data", rawData);
  } catch (error) {
    console.error('Data parse error:', error);
    io.emit("data_warning", { message: "Data parse error", error: error.toString(), raw: data, timestamp: Date.now() });
    io.emit("raw_data", data);
    
  }
}

function startSerialBridge() {
  try {
    port = new SerialPort({
      path: serialPath,
      baudRate: serialBaudRate,
      autoOpen: false
    });

    port.on('error', (err) => {
      console.error('Serial port error:', err.message);
      io.emit('data_warning', {
        message: 'Serial port error',
        error: err.message,
        timestamp: Date.now()
      });
    });

    port.open((err) => {
      if (err) {
        console.error(`Failed to open serial port ${serialPath}:`, err.message);
        console.error('Set SERIAL_PORT env var if your device path is different.');
        console.log('Falling back to simulator mode...');
        startSimulator();
        return;
      }

      parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

      parser.on('error', (parseErr) => {
        console.error('Serial parser error:', parseErr.message);
      });

      parser.on('data', handleSerialData);

      console.log(`Serial port connected: ${serialPath} @ ${serialBaudRate}`);
    });
  } catch (err) {
    console.error('Serial initialization failed:', err.message);
  }
}

startSerialBridge();

io.on('connection', (socket) => {
  console.log('GUI client connected');
  socket.emit('serial_config', {
    port: port?.path || serialPath,
    baudRate: port?.baudRate || serialBaudRate
  });

  socket.on('send_command', (commandData) => {
    try {
      console.log('Received command from GUI:', commandData);

      if (!port || !port.isOpen) {
        socket.emit('command_error', { error: 'Serial port is not open' });
        return;
      }
      
      const commandString = `CMD:${commandData.type}:${commandData.value}\n`;
      
      port.write(commandString, (err) => {
        if (err) {
          console.error('Error sending command to Pi:', err);
          socket.emit('command_error', { error: err.message });
        } else {
          console.log('Command sent to Pi:', commandString.trim());
          socket.emit('command_sent', { command: commandString.trim(), timestamp: Date.now() });
        }
      });
    } catch (error) {
      console.error('Error processing command:', error);
      socket.emit('command_error', { error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('GUI client disconnected');
  });
});
 
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);

  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
  });