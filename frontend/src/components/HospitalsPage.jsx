import { useEffect, useState } from 'react'
import { Hospital, MapPin, Navigation, Search, Database } from 'lucide-react'
import { getHospitals, calculateHospitalRoute } from '../services/api'

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState([])
  const [search, setSearch] = useState('')
  const [startNode, setStartNode] = useState('0')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [route, setRoute] = useState(null)
  const [routingId, setRoutingId] = useState(null)

  useEffect(() => {
    async function loadHospitals() {
      try {
        const data = await getHospitals()
        setHospitals(data.hospitals || [])
      } catch {
        setError('Unable to load hospitals from C++ backend.')
      } finally {
        setLoading(false)
      }
    }
    loadHospitals()
  }, [])

  async function findRoute(hospitalId) {
    setRoutingId(hospitalId)
    setRoute(null)
    setError('')

    try {
      const data = await calculateHospitalRoute(
        Number(startNode),
        hospitalId
      )
      setRoute(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Route calculation failed.')
    } finally {
      setRoutingId(null)
    }
  }

  const filtered = hospitals.filter((hospital) =>
    `${hospital.hospital_name} ${hospital.address}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3><Hospital size={20} /> Hospital Directory</h3>
            <p>Hospital records loaded from MySQL through the C++ Crow API.</p>
          </div>
          <span className="panel-tag">{hospitals.length} HOSPITALS</span>
        </div>

        <div className="form-grid">
          <label>
            <Search size={15} /> Search Hospitals
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hospital name or location"
              style={{
                width: '100%',
                padding: 13,
                borderRadius: 9,
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#fff'
              }}
            />
          </label>

          <label>
            Ambulance Start Node
            <select
              value={startNode}
              onChange={(e) => {
                setStartNode(e.target.value)
                setRoute(null)
              }}
            >
              {[0, 1, 2, 3, 4].map((node) => (
                <option key={node} value={node}>Node {node}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {loading && <p>Loading hospitals...</p>}
      {error && <div className="route-error">{error}</div>}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 18
      }}>
        {filtered.map((hospital) => (
          <section className="panel" key={hospital.hospital_id}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 18
            }}>
              <div className="hospital-icon">
                <Hospital size={25} />
              </div>
              <span className="panel-tag">
                NODE {hospital.graph_node}
              </span>
            </div>

            <h3 style={{ marginBottom: 12 }}>
              {hospital.hospital_name}
            </h3>

            <p style={{ color: '#94a3b8', marginBottom: 10 }}>
              <MapPin size={15} style={{ display: 'inline' }} />
              {' '}{hospital.address}
            </p>

            <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 18 }}>
              <Database size={15} style={{ display: 'inline' }} />
              {' '}MySQL Record #{hospital.hospital_id}
            </p>

            <button
              className="primary-button full"
              onClick={() => findRoute(hospital.hospital_id)}
              disabled={routingId !== null}
            >
              <Navigation size={17} />
              {routingId === hospital.hospital_id
                ? 'Calculating...'
                : 'Find Optimal Route'}
            </button>
          </section>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <p>No matching hospitals found.</p>
      )}

      {route && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h3><Navigation size={20} /> Optimal Hospital Route</h3>
              <p>Calculated by the C++ Dijkstra routing engine.</p>
            </div>
          </div>

          <div className="route-result">
            <strong>{route.hospital_name}</strong>
            <p>Travel Time: {route.travel_time_minutes} minutes</p>
            <p>Shortest Path: {route.path.join(' → ')}</p>
            <p>Algorithm: {route.algorithm}</p>
          </div>
        </section>
      )}

      <p style={{ color: '#94a3b8', fontSize: 13 }}>
        Academic simulation: hospital names, addresses and coordinates are
        demonstration data, not verified emergency facilities.
      </p>
    </div>
  )
}
