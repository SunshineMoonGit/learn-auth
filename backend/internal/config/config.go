package config

import (
	"os"
)

// Config 애플리케이션 설정 구조체
type Config struct {
	// Server
	Port    string
	GinMode string

	// Database
	DatabaseURL string

	// Redis
	RedisURL string

	// JWT
	JWTSecret string

	// Logging
	LogLevel string
}

// Load 환경 변수에서 설정 로드
func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "3000"),
		GinMode:     getEnv("GIN_MODE", "debug"),
		DatabaseURL: getEnv("DATABASE_URL", ""),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:   getEnv("JWT_SECRET", ""),
		LogLevel:    getEnv("LOG_LEVEL", "info"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
