package main

import (
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/sunshinemoon/learn-auth-backend/internal/handler"
	"github.com/sunshinemoon/learn-auth-backend/internal/middleware"
)

func main() {
	// .env 로드
	if err := godotenv.Load(); err != nil {
		log.Warn().Msg("No .env file found, using environment variables")
	}

	// 로깅 설정
	setupLogger()

	// Gin 모드 설정
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 라우터 설정
	r := gin.New()

	// 미들웨어 적용
	r.Use(middleware.Logger())
	r.Use(gin.Recovery())

	// 라우트 등록
	r.GET("/", handler.Root)
	r.GET("/health", handler.Health)

	// 포트 설정
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Info().Str("port", port).Msg("🚀 Server starting...")

	if err := r.Run(":" + port); err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}

func setupLogger() {
	// 로그 레벨 설정
	logLevel := os.Getenv("LOG_LEVEL")
	switch logLevel {
	case "debug":
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	case "info":
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	case "warn":
		zerolog.SetGlobalLevel(zerolog.WarnLevel)
	case "error":
		zerolog.SetGlobalLevel(zerolog.ErrorLevel)
	default:
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	}

	// 콘솔 출력 형식 설정
	log.Logger = zerolog.New(zerolog.ConsoleWriter{Out: os.Stdout}).
		With().
		Timestamp().
		Logger()
}
