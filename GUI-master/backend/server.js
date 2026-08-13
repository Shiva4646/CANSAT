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

const defaultSerialPath = process.platform === 'win32' ? 'COM11' : '/dev/ttyUSB0';
const serialPath = process.env.SERIAL_PORT || defaultSerialPath;
const serialBaudRate = Number(process.env.BAUD_RATE || 9600);

let port = null;
let parser = null;

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