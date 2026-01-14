package repository

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
)

// RedisClient Redis 클라이언트 래퍼
type RedisClient struct {
	Client *redis.Client
}

// NewRedisClient Redis 클라이언트 생성
func NewRedisClient(redisURL string) (*RedisClient, error) {
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, err
	}

	client := redis.NewClient(opt)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 연결 테스트
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	log.Info().Msg("Redis connected successfully")

	return &RedisClient{Client: client}, nil
}

// Close Redis 연결 종료
func (r *RedisClient) Close() error {
	log.Info().Msg("Redis connection closed")
	return r.Client.Close()
}

// Set 키-값 저장 (TTL 지정)
func (r *RedisClient) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	return r.Client.Set(ctx, key, value, ttl).Err()
}

// Get 키로 값 조회
func (r *RedisClient) Get(ctx context.Context, key string) (string, error) {
	return r.Client.Get(ctx, key).Result()
}

// Delete 키 삭제
func (r *RedisClient) Delete(ctx context.Context, keys ...string) error {
	return r.Client.Del(ctx, keys...).Err()
}
