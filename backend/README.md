# Backend (Rust + Axum + PostgreSQL + Redis)

이 백엔드는 Rust 기반의 Axum 웹 프레임워크를 사용합니다.
PostgreSQL은 영속 데이터 저장소, Redis는 캐시/세션/레이트리밋에 사용합니다.

## Why Axum
- Rust 생태계에서 문서/커뮤니티가 풍부하고, tower/hyper 기반이라 안정적입니다.
- 타입 안정성과 미들웨어 구성이 좋아 인증/세션/로깅/추적에 유리합니다.

## Prerequisites
- Rust (rustup 설치 권장)
- PostgreSQL
- Redis

## Project init (예시)
```bash
cargo new backend
cd backend
```

## Cargo.toml (기본 의존성 예시)
아래 의존성을 `backend/Cargo.toml`에 추가하세요.

```toml
[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["fmt", "env-filter"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# DB/Cache
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres", "macros"] }
redis = { version = "0.25", features = ["tokio-comp"] }

# Optional
thiserror = "1"
```

## Minimal main.rs
```rust
use axum::{routing::get, Router};

#[tokio::main]
async fn main() {
    let app = Router::new().route("/health", get(health));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .unwrap();

    axum::serve(listener, app).await.unwrap();
}

async fn health() -> &'static str {
    "ok"
}
```

## Run
```bash
cargo run
```

## Next steps
- DB 마이그레이션/스키마 설계 (sqlx migrate 또는 refinery)
- 인증/세션(예: cookie session, JWT, Redis 세션 스토어)
- 로깅/추적(tracing + tracing-subscriber)
- 환경변수 관리(.env + dotenvy)

원하면 현재 프로젝트 구조에 맞춰 폴더 구조/모듈 설계까지 이어서 잡아줄게요.
