package domain

import (
	"time"

	"github.com/google/uuid"
)

type Room struct {
	Id        uuid.UUID `db:"id"`
	Code      string    `db:"code"`
	Name      string    `db:"name"`
	CreatedAt time.Time `db:"createdat"`
}

type Event struct {
	Id        int64     `db:"id"`
	Roomid    uuid.UUID `db:"roomid"`
	Type      string    `db:"type"`
	Payload   []byte    `db:"payload"`
	Createdat time.Time `db:"createdat"`
}

type Message struct {
	Type    string `db:"type"`
	Payload string `db:"type"`
}

type Drawpayload struct {
	Tool  string  `json:"tool"`
	X1    float64 `json:"x1"`
	Y1    float64 `json:"y1"`
	X2    float64 `json:"x2"`
	Y2    float64 `json:"y2"`
	Color string  `json:"color"`
	Width float64 `json:"width"`
}

type Chatpayload struct {
	User      string    `json:"user"`
	Text      string    `json:"text"`
	Timestamp time.Time `json:"timestamp"`
}

type Userpayload struct {
	User  string `json:"user"`
	Count int    `json:"count"`
}

type Syncpayload struct {
	Events []Event  `json:"events"`
	Users  []string `json:"users"`
}

type Roomrepository interface {
	Create(room *Room) error
	Getbycode(code string) (*Room, error)
	List() (*[]Room, error)
}

type Eventrepository interface {
	Insert(event *Event) error
	Getbyroomid(roomid uuid.UUID) ([]*Event, error)
	Deletebyroomid(roomid uuid.UUID) error
	Countbyroomid(roomid uuid.UUID) (int64, error)
	Deletetheoldest(roomid uuid.UUID, Keepcount int) error
}
