package repository

import (
	"fmt"
	"pusleboard/internal/domain"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type Eventrepo struct {
	db *sqlx.DB
}

func Neweventrepo(db *sqlx.DB) domain.Eventrepository {
	return &Eventrepo{db: db}
}

func (E *Eventrepo) Insert(event *domain.Event) error {
	query := `
        INSERT INTO events (room_id, type, payload, created_at)
        VALUES (:room_id, :type, :payload, :created_at)
    `
	_, err := E.db.NamedExec(query, event)
	if err != nil {
		return fmt.Errorf("error creating event:%w", err)
	}
	return nil
}

func (E *Eventrepo) Getbyroomid(roomid uuid.UUID) ([]*domain.Event, error) {
	var events []*domain.Event

	err := E.db.Select(&events, `SELECT id, room_id, type, payload, created_at
         FROM events
         WHERE room_id = $1
         ORDER BY created_at ASC, id ASC`, roomid)
	if err != nil {
		return nil, fmt.Errorf("couldnt get the events %w", err)
	}

	return events, nil

}

func (E *Eventrepo) Deletebyroomid(roomid uuid.UUID) error {
	_, err := E.db.Exec(`DELETE FROM events WHERE room_id = $1`, roomid)

	if err != nil {
		return fmt.Errorf("%w", err)
	}

	return nil
}

func (E *Eventrepo) Countbyroomid(roomid uuid.UUID) (int64, error) {
	var count int64

	err := E.db.Get(&count, `SELECT COUNT(*) FROM events WHERE room_id = $1`, roomid)

	if err != nil {
		return 0, fmt.Errorf("%w", err)
	}

	return count, nil
}

func (E *Eventrepo) Deletetheoldest(roomid uuid.UUID, KeepCount int) error {
	query := `
        DELETE FROM events
        WHERE room_id = $1
        AND id NOT IN (
            SELECT id FROM events
            WHERE room_id = $1
            ORDER BY created_at DESC, id DESC
            LIMIT $2
        )
    `
	_, err := E.db.Exec(query, roomid, KeepCount)
	if err != nil {
		return fmt.Errorf("EventRepo.DeleteOldest: %w", err)
	}
	return nil
}
