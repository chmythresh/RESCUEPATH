#include <iostream>
#include <algorithm>
#include <iostream>
#include <cstdlib>
#include <iostream>
#include "database.hpp"
#include <iostream>
#include <mutex>
#include <iostream>
#include "crow.h"
#include "crow/middlewares/cors.h"
#include <iostream>
#include "graph.hpp"

#include <iostream>
#include <exception>
#include <iostream>
#include <utility>
#include <iostream>
#include <vector>

int main() {
    crow::App<crow::CORSHandler> app;

    auto& cors = app.get_middleware<crow::CORSHandler>();

    cors.global()
        .origin("*")
        .methods("GET"_method, "POST"_method, "OPTIONS"_method)
        .headers("Content-Type", "Authorization");

    Database database;

    const char* dbPassword = std::getenv("DB_PASSWORD");
    const char* dbUser = std::getenv("DB_USER");

    std::string user = dbUser ? dbUser : "root";
    std::string password = dbPassword ? dbPassword : "";

    if (password.empty()) {
        std::cerr << "ERROR: DB_PASSWORD environment variable is required."
                  << std::endl;
        return 1;
    }
    const char* dbHostEnv = std::getenv("DB_HOST");
    const char* dbNameEnv = std::getenv("DB_NAME");
    const char* dbPortEnv = std::getenv("DB_PORT");

    std::string dbHost = dbHostEnv ? dbHostEnv : "127.0.0.1";
    std::string dbName = dbNameEnv ? dbNameEnv : "ambulance_route_db";
    unsigned int dbPort = dbPortEnv ?
        static_cast<unsigned int>(std::strtoul(dbPortEnv, nullptr, 10)) : 3306;

    if (dbPort == 0 || dbPort > 65535) {
        std::cerr << "ERROR: Invalid DB_PORT" << std::endl;
        return 1;
    }

    if (database.connect(
        dbHost,
        user,
        password,
        dbName,
        dbPort
    )) {
        CROW_LOG_INFO << "MySQL database connected successfully";
    } else {
        CROW_LOG_ERROR << "MySQL connection failed: "
                       << database.getLastError();
    }

    if (!database.isConnected()) {
        CROW_LOG_ERROR << "MySQL connection required";
        return 1;
    }

    std::vector<RoadRecord> roads = database.loadRoads();

    if (!database.getLastError().empty() || roads.empty()) {
        CROW_LOG_ERROR << "Failed to load roads: "
                       << database.getLastError();
        return 1;
    }

    int maxNode = -1;

    for (const auto& road : roads) {
        if (road.source < 0 || road.destination < 0 ||
            road.travelTime <= 0) {
            CROW_LOG_ERROR << "Invalid road data";
            return 1;
        }

        maxNode = std::max(maxNode, road.source);
        maxNode = std::max(maxNode, road.destination);
    }

    Graph graph(maxNode + 1);
    std::mutex graphMutex;

    int loadedRoads = 0;

    for (const auto& road : roads) {
        if (!road.isClosed) {
            graph.addRoad(
                road.source,
                road.destination,
                road.travelTime
            );
            loadedRoads++;
        }
    }

    CROW_LOG_INFO << "Loaded " << loadedRoads
                  << " active roads from MySQL";

    CROW_ROUTE(app, "/api/health")([]() {
        crow::json::wvalue response;
        response["status"] = "success";
        response["message"] = "Ambulance Route Optimizer C++ API running";
        return response;
    });

    CROW_ROUTE(app, "/api/route/<int>/<int>")
    ([&graph, &graphMutex, &database](int start, int destination) {
        crow::json::wvalue response;

        try {

            std::lock_guard<std::mutex> lock(graphMutex);
            auto [minutes, path] = graph.dijkstra(start, destination);

            if (!path.empty()) {
                std::string routePath;

                for (size_t i = 0; i < path.size(); ++i) {
                    if (i > 0) routePath += " -> ";
                    routePath += std::to_string(path[i]);
                }

                if (!database.saveRouteHistory(
                    start, destination, "Dijkstra", routePath, minutes
                )) {
                    CROW_LOG_ERROR << "Route history save failed: "
                                   << database.getLastError();
                }
            }

            if (path.empty()) {
                response["error"] = "No route available";
                return crow::response(404, response);
            }

            response["algorithm"] = "Dijkstra";
            response["travel_time_minutes"] = minutes;

            std::vector<crow::json::wvalue> route;
            for (int node : path) {
                route.emplace_back(node);
            }

            response["path"] = std::move(route);

            return crow::response(200, response);
        }
        catch (const std::exception& e) {
            response["error"] = e.what();
            return crow::response(400, response);
        }
    });

    CROW_ROUTE(app, "/api/astar/<int>/<int>")
    ([&graph, &graphMutex, &database](int start, int destination) {
        crow::json::wvalue response;

        try {

            std::lock_guard<std::mutex> lock(graphMutex);
            auto [minutes, path] = graph.aStar(start, destination);

            if (!path.empty()) {
                std::string routePath;

                for (size_t i = 0; i < path.size(); ++i) {
                    if (i > 0) routePath += " -> ";
                    routePath += std::to_string(path[i]);
                }

                if (!database.saveRouteHistory(
                    start, destination, "A*", routePath, minutes
                )) {
                    CROW_LOG_ERROR << "Route history save failed: "
                                   << database.getLastError();
                }
            }

            if (path.empty()) {
                response["error"] = "No route available";
                return crow::response(404, response);
            }

            response["algorithm"] = "A*";
            response["travel_time_minutes"] = minutes;

            std::vector<crow::json::wvalue> route;
            for (int node : path) {
                route.emplace_back(node);
            }

            response["path"] = std::move(route);

            return crow::response(200, response);
        }
        catch (const std::exception& e) {
            response["error"] = e.what();
            return crow::response(400, response);
        }
    });

    CROW_ROUTE(app, "/api/floyd/<int>/<int>")
    ([&graph, &graphMutex, &database](int start, int destination) {
        crow::json::wvalue response;

        try {

            std::lock_guard<std::mutex> lock(graphMutex);
            auto [minutes, path] = graph.floydWarshall(start, destination);

            if (!path.empty()) {
                std::string routePath;

                for (size_t i = 0; i < path.size(); ++i) {
                    if (i > 0) routePath += " -> ";
                    routePath += std::to_string(path[i]);
                }

                if (!database.saveRouteHistory(
                    start, destination, "Floyd-Warshall", routePath, minutes
                )) {
                    CROW_LOG_ERROR << "Route history save failed: "
                                   << database.getLastError();
                }
            }

            if (path.empty()) {
                response["error"] = "No route available";
                return crow::response(404, response);
            }

            response["algorithm"] = "Floyd-Warshall";
            response["travel_time_minutes"] = minutes;

            std::vector<crow::json::wvalue> route;

            for (int node : path) {
                route.emplace_back(node);
            }

            response["path"] = std::move(route);

            return crow::response(200, response);
        }
        catch (const std::exception& e) {
            response["error"] = e.what();
            return crow::response(400, response);
        }
    });

    CROW_ROUTE(app, "/api/roads")
    .methods(crow::HTTPMethod::GET)
    ([&database, &graphMutex]() {
        crow::json::wvalue response;

        try {
            std::lock_guard<std::mutex> lock(graphMutex);

            auto roads = database.loadRoads();

            if (!database.getLastError().empty()) {
                response["error"] = database.getLastError();
                return crow::response(500, response);
            }

            crow::json::wvalue::list roadList;

            for (const auto& road : roads) {
                crow::json::wvalue item;
                item["from"] = road.source;
                item["to"] = road.destination;
                item["time"] = road.travelTime;
                item["is_closed"] = road.isClosed;

                roadList.push_back(std::move(item));
            }

            response["status"] = "success";
            response["roads"] = std::move(roadList);

            return crow::response(200, response);
        }
        catch (const std::exception& e) {
            response["error"] = e.what();
            return crow::response(500, response);
        }
    });
    CROW_ROUTE(app, "/api/roads/close/<int>/<int>")
    .methods(crow::HTTPMethod::POST)
    ([&graph, &graphMutex, &database](int from, int to) {
        crow::json::wvalue response;

        try {

            std::lock_guard<std::mutex> lock(graphMutex);
            if (!database.closeRoadInDatabase(from, to)) {
               response["error"] = database.getLastError();
               return crow::response(400, response);
           }

           bool closed = graph.closeRoad(from, to);

            if (!closed) {
                response["error"] = "Road not found or already closed";
                return crow::response(404, response);
            }

            response["status"] = "success";
            response["message"] = "Road closed successfully";
            response["from"] = from;
            response["to"] = to;

            return crow::response(200, response);
        }
        catch (const std::exception& e) {
            response["error"] = e.what();
            return crow::response(400, response);
        }
    });

    CROW_ROUTE(app, "/api/roads/traffic/<int>/<int>/<int>")
    .methods(crow::HTTPMethod::POST)
    ([&graph, &graphMutex, &database](int from, int to, int minutes) {
        crow::json::wvalue response;

        try {

            std::lock_guard<std::mutex> lock(graphMutex);
            if (!database.updateTrafficInDatabase(from, to, minutes)) {
                response["error"] = database.getLastError();
                return crow::response(400, response);
            }

            bool updated = graph.updateTraffic(from, to, minutes);

            if (!updated) {
                response["error"] = "Road not found or closed";
                return crow::response(404, response);
            }

            response["status"] = "success";
            response["message"] = "Traffic updated successfully";
            response["from"] = from;
            response["to"] = to;
            response["travel_time_minutes"] = minutes;

            return crow::response(200, response);
        }
        catch (const std::exception& e) {
            response["error"] = e.what();
            return crow::response(400, response);
        }
    });

    CROW_ROUTE(app, "/api/history")
    ([&database, &graphMutex]() {
        crow::json::wvalue response;

        try {
            std::lock_guard<std::mutex> lock(graphMutex);

            auto history = database.getRouteHistory();

            if (!database.getLastError().empty()) {
                response["error"] = database.getLastError();
                return crow::response(500, response);
            }

            std::vector<crow::json::wvalue> records;

            for (const auto& record : history) {
                crow::json::wvalue item;

                item["route_id"] = record.routeId;
                item["start_node"] = record.startNode;
                item["destination_node"] = record.destinationNode;
                item["algorithm"] = record.algorithm;
                item["route_path"] = record.routePath;
                item["total_time"] = record.totalTime;
                item["created_at"] = record.createdAt;

                records.push_back(std::move(item));
            }

            response["status"] = "success";
            response["count"] = static_cast<int>(history.size());
            response["history"] = std::move(records);

            return crow::response(200, response);
        }
        catch (const std::exception& e) {
            response["error"] = e.what();
            return crow::response(500, response);
        }
    });
    CROW_ROUTE(app, "/api/hospitals")
    ([&database, &graphMutex]() {
        crow::json::wvalue response;

        try {
            std::lock_guard<std::mutex> lock(graphMutex);

            auto hospitals = database.getHospitals();

            if (!database.getLastError().empty()) {
                response["error"] = database.getLastError();
                return crow::response(500, response);
            }

            std::vector<crow::json::wvalue> records;

            for (const auto& hospital : hospitals) {
                crow::json::wvalue item;

                item["hospital_id"] = hospital.hospitalId;
                item["graph_node"] = hospital.graphNode;
                item["hospital_name"] = hospital.hospitalName;
                item["latitude"] = hospital.latitude;
                item["longitude"] = hospital.longitude;
                item["address"] = hospital.address;

                records.push_back(std::move(item));
            }

            response["status"] = "success";
            response["count"] = static_cast<int>(hospitals.size());
            response["hospitals"] = std::move(records);

            return crow::response(200, response);
        }
        catch (const std::exception& e) {
            response["error"] = e.what();
            return crow::response(500, response);
        }
    });
    CROW_ROUTE(app, "/api/hospital-route/<int>/<int>")
    ([&graph, &graphMutex, &database](int start, int hospitalId) {
        crow::json::wvalue response;

        try {
            std::lock_guard<std::mutex> lock(graphMutex);

            auto hospitals = database.getHospitals();

            if (!database.getLastError().empty()) {
                response["error"] = database.getLastError();
                return crow::response(500, response);
            }

            for (const auto& hospital : hospitals) {
                if (hospital.hospitalId == hospitalId) {

                    if (hospital.graphNode < 0) {
                        response["error"] = "Hospital has no graph node assigned";
                        return crow::response(400, response);
                    }

                    auto [minutes, path] =
                        graph.dijkstra(start, hospital.graphNode);

                    if (path.empty()) {
                        response["error"] = "No route found";
                        return crow::response(404, response);
                    }

                    std::vector<crow::json::wvalue> route;
                    std::string routePath;

                    for (int node : path) {
                        route.push_back(node);

                        if (!routePath.empty()) {
                            routePath += " -> ";
                        }

                        routePath += std::to_string(node);
                    }

                    if (!database.saveRouteHistory(
                        start,
                        hospital.graphNode,
                        "Dijkstra",
                        routePath,
                        minutes
                    )) {
                        CROW_LOG_ERROR << "Hospital route history save failed: "
                                       << database.getLastError();
                    }

                    response["status"] = "success";
                    response["algorithm"] = "Dijkstra";
                    response["start_node"] = start;
                    response["hospital_id"] = hospital.hospitalId;
                    response["hospital_name"] = hospital.hospitalName;
                    response["destination_node"] = hospital.graphNode;
                    response["travel_time_minutes"] = minutes;
                    response["path"] = std::move(route);

                    return crow::response(200, response);
                }
            }

            response["error"] = "Hospital not found";
            return crow::response(404, response);
        }
        catch (const std::exception& e) {
            response["error"] = e.what();
            return crow::response(500, response);
        }
    });
    const char* renderPort = std::getenv("PORT");
    int serverPort = renderPort ? std::atoi(renderPort) : 8080;

    if (serverPort <= 0 || serverPort > 65535) {
        std::cerr << "ERROR: Invalid PORT" << std::endl;
        return 1;
    }

    app.bindaddr("0.0.0.0").port(serverPort).multithreaded().run();

    return 0;
}


















