package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sunshinemoon/learn-auth-backend/internal/model"
)

// Health 헬스 체크 엔드포인트 핸들러
func Health(c *gin.Context) {
	response := model.HealthResponse{
		Status:  "ok",
		Message: "Server is running!",
	}
	c.JSON(http.StatusOK, response)
}
