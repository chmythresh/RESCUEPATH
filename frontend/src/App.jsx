import RouteHistory from './components/RouteHistory'
import HospitalsPage from './components/HospitalsPage'
import AlgorithmComparison from './components/AlgorithmComparison'
import LiveMap from './components/LiveMap'
import TrafficManagement from './components/TrafficManagement'
import RoadNetworkGraph from './components/RoadNetworkGraph'
import { useEffect, useState } from 'react'
import { getHospitals, calculateHospitalRoute } from './services/api'
import {
  Activity, Ambulance, Bell, ChevronDown,
  Clock3, Database, GitCompareArrows,
  Hospital, LayoutDashboard, MapPinned,
  Navigation, Route, ShieldCheck, Siren,
  TrafficCone
} from 'lucide-react'
import './App.css'

const navigation = [
  { name: 'Overview', icon: LayoutDashboard },
  { name: 'Route Optimizer', icon: Route },
  { name: 'Live Map', icon: MapPinned },
  { name: 'Hospitals', icon: Hospital },
  { name: 'Algorithm Comparison', icon: GitCompareArrows },
  { name: 'Traffic Management', icon: TrafficCone },
  { name: 'Route History', icon: Clock3 },
]

const hospitals = [
  { id: 1, name: 'Demo City Hospital', node: 2 },
  { id: 2, name: 'Demo Emergency Care', node: 3 },
  { id: 3, name: 'Demo General Hospital', node: 4 },
]

function App() {
  const [activePage, setActivePage] = useState('Overview')
  const [startNode, setStartNode] = useState('0')
  const [hospitalId, setHospitalId] = useState('3')
  const [hospitalList, setHospitalList] = useState(hospitals)
  const [routeResult, setRouteResult] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState('')

  useEffect(() => {
    async function loadHospitals() {
      try {
        const data = await getHospitals()

        if (data.status === 'success' && Array.isArray(data.hospitals)) {
          setHospitalList(data.hospitalList.map((hospital) => ({
            id: hospital.hospital_id,
            name: hospital.hospital_name,
            node: hospital.graph_node,
          })))
        }
      } catch (error) {
        console.error('Hospital loading failed:', error)
        setRouteError('Unable to load hospitals from the backend.')
      }
    }

    loadHospitals()
  }, [])

  async function handleCalculateRoute() {
    setRouteLoading(true)
    setRouteError('')
    setRouteResult(null)

    try {
      const data = await calculateHospitalRoute(
        Number(startNode),
        Number(hospitalId)
      )

      setRouteResult(data)
    } catch (error) {
      setRouteError(
        error.response?.data?.error ||
        'Route calculation failed. Check the C++ backend.'
      )
    } finally {
      setRouteLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Ambulance size={26} /></div>
          <div>
            <strong>RESCUE<span>PATH</span></strong>
            <small>EMERGENCY INTELLIGENCE</small>
          </div>
        </div>

        <div className="sidebar-section">WORKSPACE</div>

        <nav className="navigation">
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={activePage === name ? 'nav-link active' : 'nav-link'}
              onClick={() => setActivePage(name)}
            >
              <Icon size={19} />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-card">
            <div className="system-heading">
              <span className="status-dot" />
              SYSTEM ARCHITECTURE
            </div>
            <div className="system-row"><span>Routing Engine</span><b>C++</b></div>
            <div className="system-row"><span>REST Framework</span><b>Crow</b></div>
            <div className="system-row"><span>Database</span><b>MySQL</b></div>
          </div>
          <div className="profile">
            <div className="avatar">ER</div>
            <div><strong>Emergency Operator</strong><small>Demo Workspace</small></div>
            <ChevronDown size={16} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Command Center <span>/</span> <b>{activePage}</b></div>
          <div className="topbar-actions">
            <span className="demo-badge"><span className="status-dot" /> SIMULATION MODE</span>
            <button className="icon-button" aria-label="Notifications"><Bell size={19} /></button>
            <div className="avatar small">ER</div>
          </div>
        </header>

        <div className="dashboard">
          <div className="page-heading">
            <div>
              <div className="eyebrow"><Siren size={15} /> EMERGENCY RESPONSE PLATFORM</div>
              <h1>{activePage === 'Overview' ? 'Operations Overview' : activePage}</h1>
              <p>Intelligent ambulance routing and emergency network analysis.</p>
            </div>
            <span className="outline-badge"><ShieldCheck size={16} /> Academic Simulation</span>
          </div>

          {activePage === 'Route History' ? (
            <RouteHistory />
          ) : activePage === 'Hospitals' ? (
            <HospitalsPage />
          ) : activePage === 'Algorithm Comparison' ? (
            <AlgorithmComparison />
          ) : activePage === 'Live Map' ? (
            <LiveMap />
          ) : activePage === 'Traffic Management' ? (
            <TrafficManagement />
          ) : (
            <>
          <section className="hero-banner">
            <div>
              <div className="hero-label"><span className="pulse-dot" /> ROUTING SYSTEM</div>
              <h2>Every second matters.<br /><span>Optimize the response.</span></h2>
              <p>Find efficient ambulance routes using graph algorithms and a simulated emergency road network.</p>
              <button className="primary-button" onClick={() => setActivePage('Route Optimizer')}>
                <Navigation size={17} /> Open Route Optimizer
              </button>
            </div>
            <div className="hero-symbol"><Ambulance size={140} strokeWidth={1.2} /></div>
          </section>

          <div className="metrics-grid">
            {[
              { label: 'Routing Algorithms', value: '03', icon: GitCompareArrows, detail: 'Dijkstra Â· A* Â· Floyd' },
              { label: 'Demo Hospitals', value: '03', icon: Hospital, detail: 'Configured destinations' },
              { label: 'Road Connections', value: '05', icon: Route, detail: 'Simulated network' },
              { label: 'Backend Engine', value: 'C++', icon: Activity, detail: 'Crow REST framework' },
            ].map(({ label, value, icon: Icon, detail }) => (
              <div className="metric-card" key={label}>
                <div className="metric-top"><span>{label}</span><Icon size={20} /></div>
                <strong>{value}</strong>
                <small>{detail}</small>
              </div>
            ))}
          </div>

          <div className="content-grid">
            <section className="panel">
              <div className="panel-header">
                <div><h3><MapPinned size={19} /> Route Planning</h3><p>Select an ambulance starting node and hospital.</p></div>
                <span className="panel-tag">DIJKSTRA</span>
              </div>

              <div className="form-grid">
                <label>
                  Ambulance Start Node
                  <select value={startNode} onChange={(e) => setStartNode(e.target.value)}>
                    {[0, 1, 2, 3, 4].map((node) => (
                      <option key={node} value={node}>Node {node}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Destination Hospital
                  <select value={hospitalId} onChange={(e) => setHospitalId(e.target.value)}>
                    {hospitalList.map((hospital) => (
                      <option key={hospital.id} value={hospital.id}>{hospital.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="route-placeholder">
                <RoadNetworkGraph
                  path={routeResult?.path ?? []}
                />
                <strong>
                  {routeResult
                    ? 'Calculated Shortest Path'
                    : 'Simulated Road Network'}
                </strong>
                <p>
                  {routeResult
                    ? routeResult.path.join(' -> ')
                    : 'Select a hospital and calculate a route.'}
                </p>
              </div>
              {routeResult && (
                <div className="route-result">
                  <strong>Optimal Route Found</strong>
                  <p>Hospital: {routeResult.hospital_name}</p>
                  <p>Travel Time: {routeResult.travel_time_minutes} minutes</p>
                  <p>Path: {routeResult.path.join(' -> ')}</p>
                  <p>Algorithm: {routeResult.algorithm}</p>
                </div>
              )}

              {routeError && (
                <div className="route-error">{routeError}</div>
              )}

              <button
                className="primary-button full"
                onClick={handleCalculateRoute}
                disabled={routeLoading}
              >
                <Navigation size={17} />
                {routeLoading ? 'Calculating...' : 'Calculate Optimal Route'}
              </button>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div><h3><Hospital size={19} /> Hospital Network</h3><p>Configured demonstration destinations.</p></div>
                <span className="panel-tag">3 HOSPITALS</span>
              </div>
              <div className="hospital-list">
                {hospitalList.map((hospital, index) => (
                  <div className="hospital-item" key={hospital.id}>
                    <div className="hospital-icon"><Hospital size={20} /></div>
                    <div className="hospital-info">
                      <strong>{hospital.name}</strong>
                      <small>Graph node {hospital.node} Â· Demo facility</small>
                    </div>
                    <span className="hospital-number">0{index + 1}</span>
                  </div>
                ))}
              </div>
              <div className="info-note">
                <Database size={17} />
                Hospital records will be loaded from MySQL through the C++ API in the next integration step.
              </div>
            </section>
          </div>

            </>
          )}
          <footer className="footer">
            <span>RESCUEPATH Â© 2026 Â· Emergency Route Optimization Â· Academic Project</span>
            <span>React + C++ + Crow + MySQL</span>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App




