import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip as MapTooltip,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import { useTelemetry } from '../context/TelemetryContext'

const markerIcon = L.divIcon({
  className: 'gps-marker',
  html: '<span></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function MapViewport({ position }) {
  const map = useMap()
  useEffect(() => {
    map.setView(position)
    const frame = window.requestAnimationFrame(() => map.invalidateSize())
    const timeout = window.setTimeout(() => map.invalidateSize(), 100)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
    }
  }, [map, position])
  return null
}

function GPSMap() {
  const { gps, gnssAlt, history } = useTelemetry()
  const position = [gps.latitude || 13.7331, gps.longitude || 80.2047]
  const gpsPoints = history
    .filter((point) => point.latitude && point.longitude)
  const trace = gpsPoints.map((point) => [point.latitude, point.longitude])
  const path = trace.length ? trace : [position]

  return (
    <div className="gps-map">
      <MapContainer className="gps-map-container" center={position} zoom={15} scrollWheelZoom>
        <TileLayer
          attribution="Tiles &copy; Esri"
          maxZoom={18}
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <MapViewport position={position} />
        <Polyline
          positions={path}
          pathOptions={{ color: '#22d3ee', weight: 2 }}
        >
          <MapTooltip sticky>Flight path</MapTooltip>
        </Polyline>
        {gpsPoints.map((point, index) => {
          const pointAltitude = point.gnssAltitude ?? gnssAlt

          return (
            <CircleMarker
              center={trace[index]}
              key={`${point.timestamp}-${index}`}
              pathOptions={{
                color: '#22d3ee',
                fillColor: '#0c1116',
                fillOpacity: 0.85,
                weight: 1,
              }}
              radius={4}
            >
              <MapTooltip>
                <strong>{new Date(point.timestamp).toLocaleTimeString()}</strong>
                <br />
                Lat: {point.latitude.toFixed(6)}°
                <br />
                Lon: {point.longitude.toFixed(6)}°
                <br />
                GNSS Alt: {pointAltitude.toFixed(1)} m
              </MapTooltip>
            </CircleMarker>
          )
        })}
        <Marker icon={markerIcon} position={position}>
          <MapTooltip>
            <strong>Current position</strong>
            <br />
            Lat: {gps.latitude.toFixed(6)}°
            <br />
            Lon: {gps.longitude.toFixed(6)}°
            <br />
            GNSS Alt: {gnssAlt.toFixed(1)} m
            <br />
            Satellites: {gps.satellites}
          </MapTooltip>
        </Marker>
      </MapContainer>
      <div className="map-overlay">
        {gps.latitude.toFixed(4)}, {gps.longitude.toFixed(4)} · GNSS Alt: {gnssAlt.toFixed(1)} m
      </div>
    </div>
  )
}

export default GPSMap
