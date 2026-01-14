# Backend (Go + Gin + PostgreSQL + Redis)

이 백엔드는 Go 기반의 Gin 웹 프레임워크를 사용합니다.
PostgreSQL은 영속 데이터 저장소, Redis는 캐시/세션/레이트리밋에 사용합니다.

## 기술 스택

| 구분          | 라이브러리 |
| ------------- | ---------- |
| 웹 프레임워크 | Gin        |
| PostgreSQL    | pgx        |
| Redis         | go-redis   |
| JWT           | golang-jwt |
| 비밀번호 해싱 | bcrypt     |
| 환경 변수     | godotenv   |
| 로깅          | zerolog    |

## Prerequisites

- Go 1.22+
- PostgreSQL
- Redis

## Project Structure

```
backend/
├── cmd/
│   └── server/
│       └── main.go           # 애플리케이션 진입점
├── internal/
│   ├── config/               # 환경 설정 관리
│   ├── handler/              # HTTP 핸들러
│   ├── middleware/           # 미들웨어 (로깅, 인증 등)
│   ├── model/                # 데이터 모델
│   └── repository/           # DB/Redis 연결
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── go.mod
└── README.md
```

## Quick Start

### 로컬 실행

```bash
# 의존성 설치
go mod tidy

# 환경 변수 설정
cp .env.example .env

# 서버 실행
go run ./cmd/server
```

### Docker 실행

```bash
# 전체 스택 실행 (PostgreSQL + Redis + Backend)
docker compose up -d

# 로그 확인
docker compose logs -f backend
```

## API Endpoints

| 엔드포인트 | 메서드 | 설명             |
| ---------- | ------ | ---------------- |
| `/`        | GET    | 루트 웰컴 메시지 |
| `/health`  | GET    | 헬스 체크        |

### 헬스 체크 응답 예시

```json
{
  "status": "ok",
  "message": "Server is running!"
}
```

## Environment Variables

| 변수           | 설명                              | 기본값                 |
| -------------- | --------------------------------- | ---------------------- |
| `PORT`         | 서버 포트                         | 3000                   |
| `DATABASE_URL` | PostgreSQL 연결 URL               | -                      |
| `REDIS_URL`    | Redis 연결 URL                    | redis://localhost:6379 |
| `JWT_SECRET`   | JWT 서명 시크릿                   | -                      |
| `LOG_LEVEL`    | 로그 레벨 (debug/info/warn/error) | info                   |
| `GIN_MODE`     | Gin 모드 (debug/release)          | debug                  |

## Next Steps

- [ ] 인증 시스템 (회원가입, 로그인, JWT)
- [ ] 데이터베이스 마이그레이션
- [ ] Redis 세션 스토어
- [ ] 미들웨어 (CORS, 인증)
- [ ] API 엔드포인트 확장
