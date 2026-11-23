#pragma once

#include <mysql.h>
#include <string>
#include <vector>

struct RoadRecord {
    int source;
    int destination;
    double travelTime;
    bool isClosed;
};

struct RouteHistoryRecord {
    int routeId;
    int startNode;
    int destinationNode;
    std::string algorithm;
    std::string routePath;
    double totalTime;
    std::string createdAt;
};
struct HospitalRecord {
    int graphNode;
    int hospitalId;
    std::string hospitalName;
    double latitude;
    double longitude;
    std::string address;
};
class Database {
public:
    Database();
    ~Database();

    bool connect(
        const std::string& host,
        const std::string& user,
        const std::string& password,
        const std::string& database,
        unsigned int port = 3306
    );

    std::vector<RoadRecord> loadRoads();

    bool closeRoadInDatabase(int from, int to);
    bool updateTrafficInDatabase(int from, int to, double minutes);

    bool saveRouteHistory(
        int startNode,
        int destinationNode,
        const std::string& algorithm,
        const std::string& routePath,
        double totalTime
    );

    std::vector<RouteHistoryRecord> getRouteHistory();

    std::vector<HospitalRecord> getHospitals();

    bool isConnected() const;
    std::string getLastError() const;

private:
    MYSQL* connection;
    std::string lastError;
};







