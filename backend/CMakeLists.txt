cmake_minimum_required(VERSION 3.16)

project(RESCUEPATH LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

set(CROW_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
set(CROW_BUILD_TESTS OFF CACHE BOOL "" FORCE)

# Crow dependency
add_subdirectory(external/Crow)

# Find MariaDB Connector/C
find_path(MARIADB_INCLUDE_DIR
    NAMES mysql.h
    HINTS
        "${MARIADB_ROOT}"
        "$ENV{MARIADB_ROOT}"
        "$ENV{MYSQL_ROOT}"
    PATH_SUFFIXES include/mariadb mariadb
)

find_library(MARIADB_LIBRARY
    NAMES mariadb libmariadb
    HINTS
        "${MARIADB_ROOT}"
        "$ENV{MARIADB_ROOT}"
        "$ENV{MYSQL_ROOT}"
    PATH_SUFFIXES lib lib64
)

if(NOT MARIADB_INCLUDE_DIR OR NOT MARIADB_LIBRARY)
    message(FATAL_ERROR
        "MariaDB Connector/C not found. Set MARIADB_ROOT to its installation directory."
    )
endif()

message(STATUS "MariaDB headers: ${MARIADB_INCLUDE_DIR}")
message(STATUS "MariaDB library: ${MARIADB_LIBRARY}")

# RESCUEPATH C++ backend
add_executable(ambulance_server
    main.cpp
    src/graph.cpp
    src/database.cpp
)

target_include_directories(ambulance_server PRIVATE
    include
    "${MARIADB_INCLUDE_DIR}"
)

target_link_libraries(ambulance_server PRIVATE
    Crow::Crow
    "${MARIADB_LIBRARY}"
)

if(WIN32)
    target_link_libraries(ambulance_server PRIVATE
        ws2_32
        mswsock
    )
endif()
