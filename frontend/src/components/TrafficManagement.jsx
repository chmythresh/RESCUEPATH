import { useEffect, useState } from 'react'
import {
  TrafficCone,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Database
} from 'lucide-react'

import {
  closeRoad,
  updateRoadTraffic,
  getRoads
} from '../services/api'

export default function TrafficManagement() {
  const [roads, setRoads] = useState([])
  const [roadIndex, setRoadIndex] = useState('0')
  const [minutes, setMinutes] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const road = roads[Number(roadIndex)]

  async function loadRoads() {
    setFetching(true)

    try {
      const data = await getRoads()
      const list = data.roads || []

      setRoads(list)

      setRoadIndex((previous) => {
        const index = Number(previous)
        return String(index < list.length ? index : 0)
      })

      if (list.length === 0) {
        setMinutes('')
      }
    } catch {
      setError('Unable to fetch roads from the C++ backend.')
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    loadRoads()
  }, [])

  useEffect(() => {
    if (road) {
      setMinutes(String(road.time))
    }
  }, [road?.from, road?.to, road?.time])

  function selectRoad(value) {
    setRoadIndex(value)
    setMinutes(String(roads[Number(value)].time))
    setMessage('')
    setError('')
  }

  async function handleTrafficUpdate() {
    if (!road) return

    const travelTime = Number(minutes)

    if (
      minutes.trim() === '' ||
      !Number.isInteger(travelTime) ||
      travelTime <= 0
    ) {
      setError('Enter a positive whole number of minutes.')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      await updateRoadTraffic(road.from, road.to, travelTime)
      await loadRoads()

      setMessage(
        `Road ${road.from} → ${road.to} updated to ${travelTime} minutes.`
      )
    } catch (err) {
      setError(
        err.response?.data?.error || 'Traffic update failed.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleRoadClosure() {
    if (!road || road.is_closed) return

    const confirmed = window.confirm(
      `Close simulated road ${road.from} → ${road.to}? This may change future shortest paths.`
    )

    if (!confirmed) return

    setLoading(true)
    setError('')
    setMessage('')

    try {
      await closeRoad(road.from, road.to)
      await loadRoads()

      setMessage(
        `Road ${road.from} → ${road.to} closed successfully.`
      )
    } catch (err) {
      setError(
        err.response?.data?.error || 'Road closure failed.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section className="panel traffic-panel">
        <div className="panel-header">
          <div>
            <h3>
              <TrafficCone size={19} />
              Traffic Control Center
            </h3>
            <p>
              Manage simulated road conditions using the C++ backend.
            </p>
          </div>

          <span className="panel-tag">LIVE MYSQL</span>
        </div>

        <div className="form-grid">
          <label>
            Select Road

            <select
              value={roadIndex}
              onChange={(e) => selectRoad(e.target.value)}
              disabled={loading || fetching || roads.length === 0}
            >
              {roads.map((item, index) => (
                <option key={`${item.from}-${item.to}`} value={index}>
                  Node {item.from} → Node {item.to}
                  {item.is_closed ? ' (CLOSED)' : ''}
                </option>
              ))}
            </select>
          </label>

          <label>
            Travel Time (minutes)

            <input
              type="number"
              min="1"
              step="1"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              disabled={!road || loading || fetching || road.is_closed}
            />
          </label>
        </div>

        {road && (
          <div className="route-result" style={{ marginTop: 16 }}>
            <strong>
              Selected Road: {road.from} → {road.to}
            </strong>

            <p>
              Current Travel Time: {road.time} minutes
            </p>

            <p>
              Status: {road.is_closed ? 'CLOSED' : 'ACTIVE'}
            </p>
          </div>
        )}

        <div className="traffic-actions">
          <button
            className="primary-button"
            onClick={handleTrafficUpdate}
            disabled={loading || fetching || !road || road.is_closed}
          >
            <RefreshCw size={17} />
            {loading ? 'Processing...' : 'Update Traffic'}
          </button>

          <button
            className="primary-button danger-button"
            onClick={handleRoadClosure}
            disabled={loading || fetching || !road || road.is_closed}
          >
            <AlertTriangle size={17} />
            Close Road
          </button>

          <button
            className="primary-button"
            onClick={() => {
              setError('')
              setMessage('')
              loadRoads()
            }}
            disabled={loading || fetching}
          >
            <RefreshCw size={17} />
            Refresh Roads
          </button>
        </div>

        {message && (
          <div className="route-result">
            <CheckCircle2 size={18} />
            {message}
          </div>
        )}

        {error && (
          <div className="route-error">
            {error}
          </div>
        )}

        <div className="info-note">
          <Database size={17} />
          Road data is loaded from MySQL through the C++ API.
          Updates can change future shortest-path calculations.
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Live Road Network Status</h3>
            <p>Current simulated road conditions.</p>
          </div>
          <span className="panel-tag">{roads.length} ROADS</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left'
            }}
          >
            <thead>
              <tr>
                {['Road', 'Travel Time', 'Status'].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      padding: 14,
                      borderBottom: '1px solid #334155'
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {roads.map((item) => (
                <tr key={`${item.from}-${item.to}`}>
                  <td style={{ padding: 14 }}>
                    Node {item.from} → Node {item.to}
                  </td>

                  <td style={{ padding: 14 }}>
                    {item.time} min
                  </td>

                  <td
                    style={{
                      padding: 14,
                      color: item.is_closed ? '#f87171' : '#4ade80',
                      fontWeight: 700
                    }}
                  >
                    {item.is_closed ? 'CLOSED' : 'ACTIVE'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!fetching && roads.length === 0 && (
            <p style={{ padding: 16 }}>
              No roads available.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
