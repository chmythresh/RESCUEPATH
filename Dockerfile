# Stage 1: Build C++ backend
FROM debian:bookworm AS builder

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    ninja-build \
    libmariadb-dev \
    libasio-dev \
    libssl-dev \
    zlib1g-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/ .

RUN cmake -S . -B build -G Ninja \
    -DCMAKE_BUILD_TYPE=Release

RUN cmake --build build --parallel 2


# Stage 2: Production runtime
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    libmariadb3 \
    libssl3 \
    zlib1g \
    libstdc++6 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/build/ambulance_server /app/ambulance_server

ENV PORT=10000

EXPOSE 10000

CMD ["/app/ambulance_server"]
