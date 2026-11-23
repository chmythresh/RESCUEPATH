#pragma once

#include <vector>
#include <utility>

class Graph {
public:
    explicit Graph(int vertices);

    void addRoad(int from, int to, double minutes);

    std::pair<double, std::vector<int>> dijkstra(
        int start, int destination
    ) const;

std::pair<double, std::vector<int>> aStar(int start, int destination) const;

std::pair<double, std::vector<int>> floydWarshall(int start, int destination) const;

bool closeRoad(int from, int to);

bool updateTraffic(int from, int to, double minutes);

private:
    std::vector<std::vector<std::pair<int, double>>> adjacency;
};




