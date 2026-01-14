package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Root 루트 엔드포인트 핸들러
func Root(c *gin.Context) {
	c.String(http.StatusOK, "Welcome to Learn Auth API! 🚀")
}
