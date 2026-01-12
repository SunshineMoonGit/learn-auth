use axum::{
    routing::get,
    Router,
    Json,
};
use serde::Serialize;

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    message: String,
}

// 헬스 체크 엔드포인트
async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        message: "Server is running!".to_string(),
    })
}

// 루트 엔드포인트
async fn root() -> &'static str {
    "Welcome to Learn Auth API! 🚀"
}

#[tokio::main]
async fn main() {
    // 로깅 초기화
    tracing_subscriber::fmt::init();

    // 라우터 설정
    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health_check));

    // 서버 시작
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .unwrap();
    
    println!("🚀 Server running on http://localhost:3000");
    
    axum::serve(listener, app).await.unwrap();
}
