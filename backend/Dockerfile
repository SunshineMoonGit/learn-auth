# Build stage
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Git 설치 (go mod에서 필요할 수 있음)
RUN apk add --no-cache git

# 의존성 캐싱
COPY go.mod ./
RUN go mod download || true

# 소스 복사 및 의존성 정리
COPY . .
RUN go mod tidy

# 빌드
RUN CGO_ENABLED=0 GOOS=linux go build -o backend ./cmd/server

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

COPY --from=builder /app/backend .

EXPOSE 3000

CMD ["./backend"]
