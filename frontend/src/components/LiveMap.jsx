import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const ambulance = {
  name: 'Demo Ambulance',
  position: [16.5062, 80.6480],
}

const hospitals = [
  { id: 1, name: 'Demo City Hospital', position: [16.5080, 80.6520] },
  { id: 2, name: 'Demo Emergency Care', position: [16.5150, 80.6350] },
  { id: 3, name: 'Demo General Hospital', position: [16.4950, 80.6600] },
]

const markerIcon = (emoji) => L.divIcon({
  html: `<div style="font-size:24px;background:#0f172a;border:2px solid #475569;border-radius:50%;width:42px;height:42px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px #0006">${emoji}</div>`,
  className: '',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
})

export default function LiveMap() {
  const [hospitalId, setHospitalId] = useState(3)
  const [showRoute, setShowRoute] = useState(false)

  const selectedHospital = hospitals.find((hospital) => hospital.id === hospitalId)

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h3>Real City Map — Vijayawada</h3>
          <p>OpenStreetMap with demonstration ambulance and hospital markers.</p>
        </div>
        <span className="panel-tag">OSM LIVE MAP</span>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <select
          value={hospitalId}
          onChange={(event) => {
            setHospitalId(Number(event.target.value))
            setShowRoute(false)
          }}
          style={{
            padding: 12,
            background: '#0f172a',
            color: '#fff',
            border: '1px solid #334155',
            borderRadius: 8,
            flex: 1,
            minWidth: 200,
          }}
        >
          {hospitals.map((hospital) => (
            <option key={hospital.id} value={hospital.id}>
              {hospital.name}
            </option>
          ))}
        </select>

        <button
          className="primary-button"
          onClick={() => setShowRoute(true)}
        >
          Show Demo Route
        </button>
      </div>

      <div style={{ height: 480, width: '100%', borderRadius: 14, overflow: 'hidden' }}>
        <MapContainer
          center={[16.5062, 80.6480]}
          zoom={13}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ZoomControl position="bottomright" />

          <Marker position={ambulance.position} icon={markerIcon('🚑')}>
            <Popup>Demo Ambulance — Illustrative Location</Popup>
          </Marker>

          {hospitals.map((hospital) => (
            <Marker
              key={hospital.id}
              position={hospital.position}
              icon={markerIcon('🏥')}
            >
              <Popup>{hospital.name} — Illustrative Location</Popup>
            </Marker>
          ))}

          {showRoute && (
            <Polyline
              positions={[ambulance.position, selectedHospital.position]}
              pathOptions={{
                color: '#22c55e',
                weight: 5,
                opacity: 0.9,
                dashArray: '10 8',
              }}
            />
          )}
        </MapContainer>
      </div>

      {showRoute && (
        <div className="route-result" style={{ marginTop: 16 }}>
          <strong>Illustrative Connection Displayed</strong>
          <p>From: {ambulance.name}</p>
          <p>To: {selectedHospital.name}</p>
          <p>This straight line is not a road route or a C++ shortest-path result.</p>
        </div>
      )}

      <p style={{ marginTop: 12, color: '#94a3b8', fontSize: 13 }}>
        Academic demonstration only. Locations are illustrative.
        Real-world navigation and emergency dispatch are not supported.
      </p>
    </section>
  )
}
