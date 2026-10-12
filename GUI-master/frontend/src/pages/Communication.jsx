import { Radio, Signal, Wifi } from 'lucide-react'
import { useTelemetry } from '../context/TelemetryContext'

function Communication() {
  const { communication } = useTelemetry()
  return (
    <section className="page">
      <header className="route-banner">
        <Radio size={20} className="route-icon" aria-hidden="true" />
        <h2>Communication Link</h2>
      </header>
      <div className="comm-grid">
        <div className="card">
          <h3>
            <Signal size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
            Signal Status
          </h3>
          <div className="comm-metric">{communication.signal.toFixed(0)} dBm</div>
          <div className="metric-list">
            <div className="metric-row">
              <span className="metric-label">Status</span>
              <strong className={`metric-value ${communication.connected ? 'status-connected' : 'status-disconnected'}`}>
                {communication.connected ? 'CONNECTED' : 'DISCONNECTED'}
              </strong>
            </div>
            <div className="metric-row">
              <span className="metric-label">Data Rate</span>
              <strong className="metric-value">{communication.dataRate.toFixed(2)} kB/s</strong>
            </div>
          </div>
        </div>
        <div className="card">
          <h3>
            <Wifi size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
            Device Link
          </h3>
          <div className="metric-list">
            <div className="metric-row">
              <span className="metric-label">Port</span>
              <strong className="metric-value">{communication.serialConfig.port || '--'}</strong>
            </div>
            <div className="metric-row">
              <span className="metric-label">Baud Rate</span>
              <strong className="metric-value">{communication.serialConfig.baudRate || '--'}</strong>
            </div>
          </div>
          <div className="comm-metric">{communication.packetCount} packets</div>
        </div>
      </div>
      <div className="card raw-log">
        <h3>Live Raw Telemetry</h3>
        <pre>{communication.rawData || 'Waiting for telemetry data...'}</pre>
      </div>
    </section>
  )
}

export default Communication
