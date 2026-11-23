import { useEffect, useState } from 'react'
import { Clock3, RefreshCw, Database, Route } from 'lucide-react'
import { getRouteHistory } from '../services/api'

export default function RouteHistory() {
  const [records, setRecords] = useState([])
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadHistory() {
    setLoading(true)
    setError('')

    try {
      const data = await getRouteHistory()
      setRecords(data.history || [])
    } catch {
      setError('Unable to load route history from the C++ backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const filtered = records.filter((record) => {
    const matchesAlgorithm =
      filter === 'All' || record.algorithm === filter

    const matchesSearch =
      `${record.route_id} ${record.route_path} ${record.start_node} ${record.destination_node}`
        .toLowerCase()
        .includes(search.toLowerCase())

    return matchesAlgorithm && matchesSearch
  })

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3><Clock3 size={20} /> Route Calculation History</h3>
            <p>Previous shortest-path calculations stored in MySQL.</p>
          </div>
          <span className="panel-tag">{records.length} RECORDS</span>
        </div>

        <div className="metrics-grid" style={{ marginBottom: 20 }}>
          <div className="metric-card">
            <div className="metric-top"><span>Total Routes</span><Route size={19} /></div>
            <strong>{records.length}</strong>
            <small>Saved calculations</small>
          </div>
          <div className="metric-card">
            <div className="metric-top"><span>Algorithms Used</span><Database size={19} /></div>
            <strong>{new Set(records.map((r) => r.algorithm)).size}</strong>
            <small>Distinct algorithms</small>
          </div>
        </div>

        <div className="form-grid">
          <label>
            Search Route
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search route ID, path or node"
              style={{
                width: '100%',
                padding: 12,
                background: '#0f172a',
                color: '#fff',
                border: '1px solid #334155',
                borderRadius: 8
              }}
            />
          </label>

          <label>
            Algorithm
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="All">All Algorithms</option>
              <option value="Dijkstra">Dijkstra</option>
              <option value="A*">A*</option>
              <option value="Floyd-Warshall">Floyd-Warshall</option>
            </select>
          </label>
        </div>

        <button
          className="primary-button"
          onClick={loadHistory}
          disabled={loading}
          style={{ marginTop: 16 }}
        >
          <RefreshCw size={17} />
          {loading ? 'Loading...' : 'Refresh History'}
        </button>
      </section>

      {error && <div className="route-error">{error}</div>}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Saved Route Records</h3>
            <p>Historical routes are retained even when traffic changes.</p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            color: '#e2e8f0'
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['ID', 'Algorithm', 'Start', 'Destination', 'Shortest Path', 'Travel Time', 'Date & Time'].map((heading) => (
                  <th key={heading} style={{ padding: 14, whiteSpace: 'nowrap' }}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.route_id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: 14 }}>#{record.route_id}</td>
                  <td style={{ padding: 14 }}>{record.algorithm}</td>
                  <td style={{ padding: 14 }}>{record.start_node}</td>
                  <td style={{ padding: 14 }}>{record.destination_node}</td>
                  <td style={{ padding: 14, whiteSpace: 'nowrap' }}>{record.route_path}</td>
                  <td style={{ padding: 14, color: '#4ade80', fontWeight: 700 }}>
                    {record.total_time} min
                  </td>
                  <td style={{ padding: 14, whiteSpace: 'nowrap' }}>
                    {record.created_at}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && filtered.length === 0 && (
            <p style={{ padding: 20, color: '#94a3b8' }}>
              No route records found.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
