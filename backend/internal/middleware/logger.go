package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// Logger zerolog 기반 요청 로깅 미들웨어
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		method := c.Request.Method

		// 요청 처리
		c.Next()

		// 응답 후 로깅
		latency := time.Since(start)
		status := c.Writer.Status()
		clientIP := c.ClientIP()

		log.Info().
			Str("method", method).
			Str("path", path).
			Int("status", status).
			Dur("latency", latency).
			Str("client_ip", clientIP).
			Msg("Request")
	}
}
