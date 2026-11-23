#include <cmath>
#include "graph.hpp"

#include <algorithm>
#include <functional>
#include <limits>
#include <queue>
#include <stdexcept>

Graph::Graph(int vertices) : adjacency(vertices) {
    if (vertices <= 0)
        throw std::invalid_argument("Graph must have vertices");
}

void Graph::addRoad(int from, int to, double minutes) {
    int n = static_cast<int>(adjacency.size());

    if (from < 0 || to < 0 || from >= n || to >= n ||
        !(minutes >= 0) ||
        minutes == std::numeric_limits<double>::infinity())
        throw std::invalid_argument("Invalid road");

    adjacency[from].push_back({to, minutes});
    adjacency[to].push_back({from, minutes});
}

std::pair<double, std::vector<int>> Graph::dijkstra(
    int start, int destination) const {

    int n = static_cast<int>(adjacency.size());

    if (start < 0 || destination < 0 ||
        start >= n || destination >= n)
        throw std::invalid_argument("Invalid location");

    const double INF = std::numeric_limits<double>::infinity();

    std::vector<double> distance(n, INF);
    std::vector<int> parent(n, -1);

    using State = std::pair<double, int>;

    std::priority_queue<
        State,
        std::vector<State>,
        std::greater<State>
    > pq;

    distance[start] = 0;
    pq.push({0, start});

    while (!pq.empty()) {
        auto [cost, node] = pq.top();
        pq.pop();

        if (cost > distance[node])
            continue;

        if (node == destination)
            break;

        for (auto [next, weight] : adjacency[node]) {
            double newCost = cost + weight;

            if (newCost < distance[next]) {
                distance[next] = newCost;
                parent[next] = node;
                pq.push({newCost, next});
            }
        }
    }

    std::vector<int> path;

    if (distance[destination] == INF)
        return {INF, path};

    for (int node = destination; node != -1; node = parent[node])
        path.push_back(node);

    std::reverse(path.begin(), path.end());

    return {distance[destination], path};
}

std::pair<double, std::vector<int>> Graph::aStar(
    int start, int destination) const {

    int n = static_cast<int>(adjacency.size());

    if (start < 0 || destination < 0 ||
        start >= n || destination >= n)
        throw std::invalid_argument("Invalid location");

    const double INF = std::numeric_limits<double>::infinity();

    std::vector<double> gScore(n, INF);
    std::vector<int> parent(n, -1);

    using State = std::pair<double, int>;
    std::priority_queue<State, std::vector<State>,
                        std::greater<State>> openSet;

    // Zero heuristic: h(n) = 0
    auto heuristic = [](int) -> double {
        return 0.0;
    };

    gScore[start] = 0;
    openSet.push({heuristic(start), start});

    while (!openSet.empty()) {
        auto [priority, node] = openSet.top();
        openSet.pop();

        if (priority > gScore[node] + heuristic(node))
            continue;

        if (node == destination)
            break;

        for (auto [next, weight] : adjacency[node]) {
            double tentative = gScore[node] + weight;

            if (tentative < gScore[next]) {
                gScore[next] = tentative;
                parent[next] = node;

                double fScore = tentative + heuristic(next);
                openSet.push({fScore, next});
            }
        }
    }

    std::vector<int> path;

    if (gScore[destination] == INF)
        return {INF, path};

    for (int node = destination; node != -1; node = parent[node])
        path.push_back(node);

    std::reverse(path.begin(), path.end());

    return {gScore[destination], path};
}

std::pair<double, std::vector<int>> Graph::floydWarshall(
    int start, int destination) const {

    int n = static_cast<int>(adjacency.size());

    if (start < 0 || destination < 0 ||
        start >= n || destination >= n)
        throw std::invalid_argument("Invalid location");

    const double INF = std::numeric_limits<double>::infinity();

    std::vector<std::vector<double>> dist(
        n, std::vector<double>(n, INF));

    std::vector<std::vector<int>> next(
        n, std::vector<int>(n, -1));

    for (int i = 0; i < n; i++) {
        dist[i][i] = 0;
        next[i][i] = i;

        for (auto [neighbor, weight] : adjacency[i]) {
            if (weight < dist[i][neighbor]) {
                dist[i][neighbor] = weight;
                next[i][neighbor] = neighbor;
            }
        }
    }

    for (int k = 0; k < n; k++) {
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {

                if (dist[i][k] == INF || dist[k][j] == INF)
                    continue;

                double newDistance = dist[i][k] + dist[k][j];

                if (newDistance < dist[i][j]) {
                    dist[i][j] = newDistance;
                    next[i][j] = next[i][k];
                }
            }
        }
    }

    std::vector<int> path;

    if (next[start][destination] == -1)
        return {INF, path};

    int current = start;
    path.push_back(current);

    while (current != destination) {
        current = next[current][destination];
        path.push_back(current);
    }

    return {dist[start][destination], path};
}

bool Graph::closeRoad(int from, int to) {
    int n = static_cast<int>(adjacency.size());

    if (from < 0 || to < 0 || from >= n || to >= n || from == to)
        throw std::invalid_argument("Invalid road locations");

    auto removeConnection = [](auto& edges, int target) {
        auto oldSize = edges.size();

        edges.erase(
            std::remove_if(
                edges.begin(),
                edges.end(),
                [target](const auto& edge) {
                    return edge.first == target;
                }
            ),
            edges.end()
        );

        return edges.size() != oldSize;
    };

    bool removedForward = removeConnection(adjacency[from], to);
    bool removedBackward = removeConnection(adjacency[to], from);

    return removedForward || removedBackward;
}

bool Graph::updateTraffic(int from, int to, double minutes) {
    int n = static_cast<int>(adjacency.size());

    if (from < 0 || to < 0 || from >= n || to >= n ||
        from == to || !std::isfinite(minutes) || minutes < 0)
        throw std::invalid_argument("Invalid traffic update");

    bool updated = false;

    for (auto& edge : adjacency[from]) {
        if (edge.first == to) {
            edge.second = minutes;
            updated = true;
        }
    }

    for (auto& edge : adjacency[to]) {
        if (edge.first == from) {
            edge.second = minutes;
            updated = true;
        }
    }

    return updated;
}

