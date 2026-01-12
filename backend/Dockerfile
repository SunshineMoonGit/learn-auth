# Build stage
FROM rust:1.84 AS builder

WORKDIR /app

# 의존성 캐싱을 위해 먼저 Cargo 파일만 복사
COPY Cargo.toml Cargo.lock* ./

# 빈 src 생성 후 의존성만 빌드 (캐싱 최적화)
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# 실제 소스 복사 후 빌드
COPY src ./src
RUN touch src/main.rs && cargo build --release

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/backend /app/backend

EXPOSE 3000

CMD ["./backend"]
