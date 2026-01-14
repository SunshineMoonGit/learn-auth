package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog/log"
)

// PostgresDB PostgreSQL 연결 풀
type PostgresDB struct {
	Pool *pgxpool.Pool
}

// NewPostgresDB PostgreSQL 연결 풀 생성
func NewPostgresDB(databaseURL string) (*PostgresDB, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}

	// 연결 풀 설정
	config.MaxConns = 10
	config.MinConns = 2
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, err
	}

	// 연결 테스트
	if err := pool.Ping(ctx); err != nil {
		return nil, err
	}

	log.Info().Msg("PostgreSQL connected successfully")

	return &PostgresDB{Pool: pool}, nil
}

// Close 연결 풀 종료
func (db *PostgresDB) Close() {
	db.Pool.Close()
	log.Info().Msg("PostgreSQL connection closed")
}
