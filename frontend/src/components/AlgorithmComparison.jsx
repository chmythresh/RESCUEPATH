import { useState } from 'react'
import { GitCompareArrows, Navigation, Clock3 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import {
  calculateDijkstra,
  calculateAStar,
  calculateFloydWarshall
} from '../services/api'

const algorithms = [
  { name: 'Dijkstra', run: calculateDijkstra },
  { name: 'A*', run: calculateAStar },
  { name: 'Floyd-Warshall', run: calculateFloydWarshall },
]

export default function AlgorithmComparison() {
  const [start, setStart] = useState('0')
  const [destination, setDestination] = useState('4')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function compareAlgorithms() {
    setLoading(true)
    setError('')
    setResults([])

    try {
      const output = await Promise.all(
        algorithms.map(async (algorithm) => {
          const begin = performance.now()
          const data = await algorithm.run(Number(start), Number(destination))
          const responseTime = performance.now() - begin

          return {
            name: algorithm.name,
            path: data.path || [],
            travelTime: data.travel_time_minutes,
            responseTime: Number(responseTime.toFixed(2)),
          }
        })
      )
      setResults(output)
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to compare algorithms. Check the C++ backend.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 22 }}>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3><GitCompareArrows size={20} /> Algorithm Performance Comparison</h3>
            <p>Compare three C++ shortest-path algorithms on the same road network.</p>
          </div>
          <span className="panel-tag">DAA ANALYSIS</span>
        </div>

        <div className="form-grid">
          <label>
            Starting Node
            <select value={start} onChange={(e) => setStart(e.target.value)}>
              {[0,1,2,3,4].map((node) => (
                <option key={node} value={node}>Node {node}</option>
              ))}
            </select>
          </label>
          <label>
            Destination Node
            <select value={destination} onChange={(e) => setDestination(e.target.value)}>
              {[0,1,2,3,4].map((node) => (
                <option key={node} value={node}>Node {node}</option>
              ))}
            </select>
          </label>
        </div>

        <button
          className="primary-button"
          onClick={compareAlgorithms}
          disabled={loading}
          style={{ marginTop: 18 }}
        >
          <Navigation size={17} />
          {loading ? 'Comparing...' : 'Compare Algorithms'}
        </button>

        {error && <div className="route-error" style={{ marginTop: 14 }}>{error}</div>}
      </section>

      {results.length > 0 && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}>
            {results.map((result) => (
              <section className="panel" key={result.name}>
                <h3>{result.name}</h3>
                <p style={{ color: '#94a3b8', marginTop: 12 }}>Shortest Travel Time</p>
                <h2 style={{ fontSize: 32, margin: '8px 0', color: '#4ade80' }}>
                  {result.travelTime} min
                </h2>
                <p><strong>Path:</strong> {result.path.join(' → ')}</p>
                <p style={{ marginTop: 12, color: '#94a3b8' }}>
                  <Clock3 size={15} style={{ display: 'inline', verticalAlign: 'middle' }} />
                  {' '}API Response: {result.responseTime} ms
                </p>
              </section>
            ))}
          </div>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h3>Travel Time Comparison</h3>
                <p>Shortest-path travel time calculated by each algorithm.</p>
              </div>
            </div>

            <div style={{ width: '100%', height: 290 }}>
              <ResponsiveContainer>
                <BarChart data={results}>
                  <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="travelTime" fill="#22c55e" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 12 }}>
              API response time includes HTTP and network overhead. It is not a
              direct measurement of algorithm-only execution time.
            </p>
          </section>
        </>
      )}
    </div>
  )
}
