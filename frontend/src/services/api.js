import axios from 'axios'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || ''}/api`,
  timeout: 60000,
})

export async function getHospitals() {
  const response = await api.get('/hospitals')
  return response.data
}

export async function calculateHospitalRoute(startNode, hospitalId) {
  const response = await api.get(
    `/hospital-route/${startNode}/${hospitalId}`
  )
  return response.data
}

export async function getRouteHistory() {
  const response = await api.get('/history')
  return response.data
}

export async function calculateDijkstra(startNode, destinationNode) {
  const response = await api.get(
    `/route/${startNode}/${destinationNode}`
  )
  return response.data
}

export async function calculateAStar(startNode, destinationNode) {
  const response = await api.get(
    `/astar/${startNode}/${destinationNode}`
  )
  return response.data
}

export async function calculateFloydWarshall(startNode, destinationNode) {
  const response = await api.get(
    `/floyd/${startNode}/${destinationNode}`
  )
  return response.data
}

export default api

export async function closeRoad(fromNode, toNode) {
  const response = await api.post(
    `/roads/close/${fromNode}/${toNode}`
  )
  return response.data
}

export async function updateRoadTraffic(fromNode, toNode, minutes) {
  const response = await api.post(
    `/roads/traffic/${fromNode}/${toNode}/${minutes}`
  )
  return response.data
}

export async function getRoads() {
  const response = await api.get('/roads')
  return response.data
}

