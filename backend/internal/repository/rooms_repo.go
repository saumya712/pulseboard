package repository

import (
	"fmt"
	"math/rand"
	"pusleboard/internal/domain"

	"github.com/jmoiron/sqlx"
)

type Roomrepo struct {
	db *sqlx.DB
}

func Newroomrepo(db *sqlx.DB) domain.Roomrepository {
	return &Roomrepo{db: db}
}

func (r *Roomrepo) Create(room *domain.Room) error {

	query := `
        INSERT INTO rooms (id, code, name, created_at)
        VALUES (:id, :code, :name, :created_at)
    `

	_, err := r.db.NamedExec(query, room)
	if err != nil {
		return fmt.Errorf("error creating the room %w", err)
	}

	return nil

}

func (r *Roomrepo) Getbycode(code string) (*domain.Room, error) {
	var room domain.Room
	err := r.db.Get(&room, `SELECT id, code, name, created_at FROM rooms WHERE code = $1`, code)
	if err != nil {
		return nil, fmt.Errorf("couldnt get room by code %w", err)
	}
	return &room, nil
}

func (r *Roomrepo) List() (*[]domain.Room, error) {
	var rooms *[]domain.Room

	err := r.db.Select(&rooms, `SELECT id, code, name, created_at FROM rooms ORDER BY created_at DESC`)

	if err != nil {
		return nil, fmt.Errorf("couldnt list the rooms:%w", err)
	}
	return rooms, nil
}

func Generatecode(db *sqlx.DB) (string, error) {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

	for i := 0; i < 10; i++ {
		code := make([]byte, 6)
		for j := range code {
			code[j] = charset[rand.Intn(len(charset))]
		}
		codestr := string(code)

		var count int

		err := db.Get(&count, `SELECT COUNT(*) FROM rooms WHERE code = $1`, codestr)

		if err != nil {
			return "", fmt.Errorf("cant generate code:%w", err)
		}
		if count == 0 {
			return codestr, nil
		}

	}
	return "", fmt.Errorf("could not generate unique room code after 10 attempts")
}
