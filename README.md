# RESCUEPATH — Emergency Ambulance Route Optimizer

## Overview
RESCUEPATH is a Design and Analysis of Algorithms (DAA) project that
simulates emergency ambulance routing using weighted graph algorithms.

The system supports traffic updates, road closures, hospital routing,
algorithm comparison, route visualization, and persistent route history.

## Technology Stack
- Frontend: React, Vite, Tailwind CSS
- Backend: C++17, Crow REST Framework
- Database: MySQL 8.0
- Mapping: Leaflet and OpenStreetMap
- Charts: Recharts
- Build Tools: CMake

## Algorithms
1. Dijkstra — Single-source shortest paths
2. A* — Goal-directed shortest-path search
3. Floyd-Warshall — All-pairs shortest paths

Note: The current A* implementation uses a zero heuristic and
therefore behaves like Dijkstra's algorithm.

## Main Features
- Emergency route optimization
- Three shortest-path algorithms
- Algorithm comparison dashboard
- Interactive demo map
- Hospital directory and routing
- Traffic travel-time updates
- Simulated road closures
- MySQL route history
- Dynamic road-network visualization

## System Architecture
React Frontend
    |
    | HTTP / REST
    v
C++ Crow Backend
    |
    +-- Dijkstra
    +-- A*
    +-- Floyd-Warshall
    |
    v
MySQL Database
    |
    +-- Road Network
    +-- Hospitals
    +-- Route History

## Verified Test Case

Start Node: 0
Destination Node: 4

Dijkstra:        0 -> 1 -> 3 -> 4 | 11 minutes
A*:              0 -> 1 -> 3 -> 4 | 11 minutes
Floyd-Warshall:  0 -> 1 -> 3 -> 4 | 11 minutes

Hospital: Demo General Hospital
Hospital Route: 0 -> 1 -> 3 -> 4 | 11 minutes

## Traffic Change Demonstration
Earlier route: 0 -> 2 -> 3 -> 4 | 7 minutes
After increasing road 2-3 to 10 minutes:
New route: 0 -> 1 -> 3 -> 4 | 11 minutes

Historical route records remain stored in MySQL.

## Running the Project

### Backend
Configure MySQL credentials and run the compiled C++ server
on port 8080.
open : https://rescuepath-backend-zjus.onrender.com/api/health?utm_source=chatgpt.com

### Frontend
cd frontend
npm install
npm run dev

Open : https://rescuepath-frontend.vercel.app/

## Limitations
- Uses a small simulated road network
- Hospital records are demonstration data
- Map connection lines are illustrative, not road-following routes
- No live GPS or real-time emergency dispatch integration
- No road-reopening API currently implemented

## Academic Subject
Design and Analysis of Algorithms (DAA)
