import { useEffect, useState } from 'react'
import { getRoads } from '../services/api'

const nodes = {
  0: { x: 55, y: 100 },
  1: { x: 150, y: 35 },
  2: { x: 150, y: 165 },
  3: { x: 260, y: 100 },
  4: { x: 360, y: 100 },
}

export default function RoadNetworkGraph({ path = [] }) {
  const [roads, setRoads] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadRoads() {
      try {
        const data = await getRoads()

        if (active) {
          setRoads(data.roads || [])
          setError('')
        }
      } catch {
        if (active) {
          setError('Unable to load live road network.')
        }
      }
    }

    loadRoads()

    return () => {
      active = false
    }
  }, [path])

  const activeEdges = new Set()

  for (let i = 0; i < path.length - 1; i++) {
    const a = Number(path[i])
    const b = Number(path[i + 1])

    activeEdges.add(
      [Math.min(a, b), Math.max(a, b)].join('-')
    )
  }

  const activeNodes = new Set(path.map(Number))

  return (
    <div className="road-graph">
      <svg
        viewBox="0 0 420 210"
        role="img"
        aria-label="Live road network with optimal route highlighted"
      >
        {roads.map((road) => {
          const from = nodes[road.from]
          const to = nodes[road.to]

          if (!from || !to) return null

          const key = [
            Math.min(road.from, road.to),
            Math.max(road.from, road.to),
          ].join('-')

          const closed = road.is_closed
          const active = !closed && activeEdges.has(key)

          return (
            <g key={key}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={
                  closed
                    ? '#ef4444'
                    : active
                      ? '#22c55e'
                      : '#475569'
                }
                strokeWidth={active ? 6 : 3}
                strokeDasharray={closed ? '7 5' : 'none'}
                strokeLinecap="round"
              />

              <text
                x={(from.x + to.x) / 2}
                y={(from.y + to.y) / 2 - 9}
                textAnchor="middle"
                fill={closed ? '#f87171' : '#cbd5e1'}
                fontSize="12"
              >
                {closed ? 'CLOSED' : `${road.time}m`}
              </text>
            </g>
          )
        })}

        {Object.entries(nodes).map(([id, node]) => {
          const active = activeNodes.has(Number(id))

          return (
            <g key={id}>
              <circle
                cx={node.x}
                cy={node.y}
                r="20"
                fill={active ? '#14532d' : '#1e293b'}
                stroke={active ? '#4ade80' : '#64748b'}
                strokeWidth="2"
              />

              <text
                x={node.x}
                y={node.y + 5}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="14"
                fontWeight="bold"
              >
                {id}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="graph-legend">
        <span><i className="legend-active" /> Optimal Route</span>
        <span><i className="legend-road" /> Other Roads</span>
        <span style={{ color: '#f87171' }}>- - Closed Road</span>
      </div>

      {error && <p className="route-error">{error}</p>}
    </div>
  )
}
