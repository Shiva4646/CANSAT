import { useEffect, useState } from 'react'
import { Satellite } from 'lucide-react'
import { useTelemetry } from '../context/TelemetryContext'

const formatElapsedTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':')
}

function MissionTimer() {
  const { communication, rssi, teamName, teamId } = useTelemetry()
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString('en-GB'),
  )

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1)
      setCurrentTime(new Date().toLocaleTimeString('en-GB'))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className="mission-topbar" aria-label="Mission status">
      <div className="mission-link-status">
        <span className={`status-dot${communication.connected ? ' is-connected' : ''}`} />
        <span>{communication.connected ? 'LIVE' : 'OFFLINE'} · {rssi} dBm</span>
        <strong>{communication.connected ? 'CONNECTED' : 'DISCONNECTED'}</strong>
      </div>
      <div className="mission-identity">
        <Satellite size={17} aria-hidden="true" />
        <strong>{teamName}</strong>
        <span>{teamId}</span>
      </div>
      <div className="mission-readouts">
        <span>T+ {formatElapsedTime(elapsedSeconds)}</span>
        <span>GNSS {currentTime}</span>
      </div>
    </div>
  )
}

export default MissionTimer
