#include <cmath>
#include "database.hpp"

Database::Database() : connection(nullptr) {}

Database::~Database() {
    if (connection != nullptr) {
        mysql_close(connection);
    }
}

bool Database::connect(
    const std::string& host,
    const std::string& user,
    const std::string& password,
    const std::string& database,
    unsigned int port
) {
    if (connection != nullptr) {
        mysql_close(connection);
        connection = nullptr;
    }

    connection = mysql_init(nullptr);

    if (connection == nullptr) {
        lastError = "Failed to initialize MySQL";
        return false;
    }

    if (mysql_real_connect(
        connection,
        host.c_str(),
        user.c_str(),
        password.c_str(),
        database.c_str(),
        port,
        nullptr,
        0
    ) == nullptr) {
        lastError = mysql_error(connection);
        mysql_close(connection);
        connection = nullptr;
        return false;
    }

    lastError.clear();
    return true;
}

bool Database::isConnected() const {
    return connection != nullptr;
}

std::string Database::getLastError() const {
    return lastError;
}

std::vector<RoadRecord> Database::loadRoads() {
    std::vector<RoadRecord> roads;

    if (connection == nullptr) {
        lastError = "Database is not connected";
        return roads;
    }

    const char* query =
        "SELECT source_node, destination_node, "
        "travel_time, is_closed FROM road_network "
        "ORDER BY road_id";

    if (mysql_query(connection, query) != 0) {
        lastError = mysql_error(connection);
        return roads;
    }

    MYSQL_RES* result = mysql_store_result(connection);

    if (result == nullptr) {
        lastError = mysql_error(connection);
        return roads;
    }

    MYSQL_ROW row;

    while ((row = mysql_fetch_row(result)) != nullptr) {
        RoadRecord road;

        road.source = std::stoi(row[0]);
        road.destination = std::stoi(row[1]);
        road.travelTime = std::stod(row[2]);
        road.isClosed = std::stoi(row[3]) != 0;

        roads.push_back(road);
    }

    mysql_free_result(result);
    lastError.clear();

    return roads;
}

bool Database::closeRoadInDatabase(int from, int to) {
    if (connection == nullptr) {
        lastError = "Database is not connected";
        return false;
    }

    if (from < 0 || to < 0) {
        lastError = "Invalid road nodes";
        return false;
    }

    std::string query =
        "UPDATE road_network SET is_closed = 1 "
        "WHERE is_closed = 0 AND "
        "((source_node = " + std::to_string(from) +
        " AND destination_node = " + std::to_string(to) +
        ") OR (source_node = " + std::to_string(to) +
        " AND destination_node = " + std::to_string(from) + "))";

    if (mysql_query(connection, query.c_str()) != 0) {
        lastError = mysql_error(connection);
        return false;
    }

    if (mysql_affected_rows(connection) == 0) {
        lastError = "Road not found or already closed";
        return false;
    }

    lastError.clear();
    return true;
}

bool Database::updateTrafficInDatabase(int from, int to, double minutes) {
    if (connection == nullptr) {
        lastError = "Database is not connected";
        return false;
    }

    if (from < 0 || to < 0 || !std::isfinite(minutes) || minutes <= 0) {
        lastError = "Invalid road nodes or travel time";
        return false;
    }

    std::string condition =
        "((source_node = " + std::to_string(from) +
        " AND destination_node = " + std::to_string(to) +
        ") OR (source_node = " + std::to_string(to) +
        " AND destination_node = " + std::to_string(from) + "))";

    std::string roadQuery =
        "SELECT road_id FROM road_network WHERE " +
        condition + " AND is_closed = 0 LIMIT 1";

    if (mysql_query(connection, roadQuery.c_str()) != 0) {
        lastError = mysql_error(connection);
        return false;
    }

    MYSQL_RES* result = mysql_store_result(connection);

    if (result == nullptr) {
        lastError = mysql_error(connection);
        return false;
    }

    MYSQL_ROW row = mysql_fetch_row(result);

    if (row == nullptr) {
        mysql_free_result(result);
        lastError = "Active road not found";
        return false;
    }

    int roadId = std::stoi(row[0]);
    mysql_free_result(result);

    if (mysql_query(connection, "START TRANSACTION") != 0) {
        lastError = mysql_error(connection);
        return false;
    }

    std::string updateQuery =
        "UPDATE road_network SET travel_time = " +
        std::to_string(minutes) +
        " WHERE road_id = " + std::to_string(roadId);

    std::string insertQuery =
        "INSERT INTO traffic_conditions "
        "(road_id, congestion_level, updated_travel_time) VALUES (" +
        std::to_string(roadId) +
        ", 'UPDATED', " + std::to_string(minutes) + ")";

    if (mysql_query(connection, updateQuery.c_str()) != 0 ||
        mysql_query(connection, insertQuery.c_str()) != 0) {
        lastError = mysql_error(connection);
        mysql_query(connection, "ROLLBACK");
        return false;
    }

    if (mysql_query(connection, "COMMIT") != 0) {
        lastError = mysql_error(connection);
        return false;
    }

    lastError.clear();
    return true;
}


bool Database::saveRouteHistory(
    int startNode,
    int destinationNode,
    const std::string& algorithm,
    const std::string& routePath,
    double totalTime
) {
    if (connection == nullptr) {
        lastError = "Database is not connected";
        return false;
    }

    if (startNode < 0 || destinationNode < 0 ||
        algorithm.empty() || routePath.empty() ||
        !std::isfinite(totalTime) || totalTime < 0) {
        lastError = "Invalid route history data";
        return false;
    }

    std::string safeAlgorithm(algorithm.size() * 2 + 1, '\0');
    unsigned long algorithmLength = mysql_real_escape_string(
        connection, &safeAlgorithm[0],
        algorithm.c_str(),
        static_cast<unsigned long>(algorithm.size())
    );
    safeAlgorithm.resize(algorithmLength);

    std::string safePath(routePath.size() * 2 + 1, '\0');
    unsigned long pathLength = mysql_real_escape_string(
        connection, &safePath[0],
        routePath.c_str(),
        static_cast<unsigned long>(routePath.size())
    );
    safePath.resize(pathLength);

    std::string query =
        "INSERT INTO route_history "
        "(start_node, destination_node, algorithm, route_path, total_time) "
        "VALUES (" +
        std::to_string(startNode) + ", " +
        std::to_string(destinationNode) + ", '" +
        safeAlgorithm + "', '" +
        safePath + "', " +
        std::to_string(totalTime) + ")";

    if (mysql_query(connection, query.c_str()) != 0) {
        lastError = mysql_error(connection);
        return false;
    }

    lastError.clear();
    return true;
}

std::vector<RouteHistoryRecord> Database::getRouteHistory() {
    std::vector<RouteHistoryRecord> history;

    if (connection == nullptr) {
        lastError = "Database is not connected";
        return history;
    }

    const char* query =
        "SELECT route_id, start_node, destination_node, "
        "algorithm, route_path, total_time, created_at "
        "FROM route_history ORDER BY route_id DESC LIMIT 50";

    if (mysql_query(connection, query) != 0) {
        lastError = mysql_error(connection);
        return history;
    }

    MYSQL_RES* result = mysql_store_result(connection);

    if (result == nullptr) {
        lastError = mysql_error(connection);
        return history;
    }

    MYSQL_ROW row;

    while ((row = mysql_fetch_row(result)) != nullptr) {
        RouteHistoryRecord record;

        record.routeId = std::stoi(row[0]);
        record.startNode = std::stoi(row[1]);
        record.destinationNode = std::stoi(row[2]);
        record.algorithm = row[3] ? row[3] : "";
        record.routePath = row[4] ? row[4] : "";
        record.totalTime = std::stod(row[5]);
        record.createdAt = row[6] ? row[6] : "";

        history.push_back(record);
    }

    mysql_free_result(result);
    lastError.clear();

    return history;
}

std::vector<HospitalRecord> Database::getHospitals() {
    std::vector<HospitalRecord> hospitals;

    if (connection == nullptr) {
        lastError = "Database is not connected";
        return hospitals;
    }

    const char* query =
        "SELECT hospital_id, hospital_name, latitude, "
        "longitude, address, graph_node FROM hospitals ORDER BY hospital_id";

    if (mysql_query(connection, query) != 0) {
        lastError = mysql_error(connection);
        return hospitals;
    }

    MYSQL_RES* result = mysql_store_result(connection);

    if (result == nullptr) {
        lastError = mysql_error(connection);
        return hospitals;
    }

    MYSQL_ROW row;

    while ((row = mysql_fetch_row(result)) != nullptr) {
        HospitalRecord hospital;

        hospital.hospitalId = std::stoi(row[0]);
        hospital.hospitalName = row[1] ? row[1] : "";
        hospital.latitude = row[2] ? std::stod(row[2]) : 0.0;
        hospital.longitude = row[3] ? std::stod(row[3]) : 0.0;
        hospital.address = row[4] ? row[4] : "";
        hospital.graphNode = row[5] ? std::stoi(row[5]) : -1;

        hospitals.push_back(hospital);
    }

    mysql_free_result(result);
    lastError.clear();

    return hospitals;
}

