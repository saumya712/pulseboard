package service

import (
	"errors"
	"fmt"
	"pusleboard/internal/domain"
	"pusleboard/internal/repository"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type Room_service struct {
	room_repo  domain.Roomrepository
	event_repo domain.Eventrepository
	db         *sqlx.DB
}

func Newroomservice(roomRepo domain.Roomrepository, eventRepo domain.Eventrepository, db *sqlx.DB) *Room_service {
	return &Room_service{
		room_repo:  roomRepo,
		event_repo: eventRepo,
		db:         db,
	}
}

var (
	ErrRoomNotFound = errors.New("room not found")
	ErrRoomExists   = errors.New("room already exists")
)

func (s *Room_service) Createroom(name string) (*domain.Room, error) {
	code, err := repository.Generatecode(s.db)
	if err != nil {
		return nil, fmt.Errorf("create room error:%v", err)
	}

	room := &domain.Room{
		Id:        uuid.New(),
		Code:      code,
		Name:      name,
		CreatedAt: time.Now().UTC(),
	}

	if err := s.room_repo.Create(room); err != nil {
		return nil, fmt.Errorf("error creating the room:%v", err)
	}

	return room, nil
}

func (S *Room_service) GetRoom(code string) (*domain.Room, error) {
	room, err := S.room_repo.Getbycode(code)
	if err != nil {
		return nil, fmt.Errorf("couldnt find the room %v", err)
	}

	if room == nil {
		return nil, ErrRoomNotFound
	}
	return room, nil
}

func (s *Room_service) Listrooms() ([]*domain.Room, error) {

	rooms, err := s.room_repo.List()
	if err != nil {
		return nil, fmt.Errorf("couldnt fetch the list%v", err)
	}

	return rooms, nil
}
