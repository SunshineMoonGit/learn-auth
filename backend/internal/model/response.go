package model

// HealthResponse 헬스 체크 응답 구조체
type HealthResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

// ErrorResponse API 에러 응답 구조체
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

// SuccessResponse 성공 응답 구조체
type SuccessResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
}
