package hub

import (
	"fmt"
	"pusleboard/internal/domain"
	"sync"

	"github.com/google/uuid"
)

type Hub struct {
	rooms     map[string]*Room
	mu        sync.RWMutex
	eventrepo domain.Eventrepository
	maxevents int
}

func Newhub(eventrepo domain.Eventrepository, maxevents int) *Hub {
	return &Hub{
		rooms:     make(map[string]*Room),
		eventrepo: eventrepo,
		maxevents: maxevents,
	}
}

func (h *Hub) Getorcreateroom(code string, roomid uuid.UUID) *Room {
	h.mu.RLock()
	room, exists := h.rooms[code]
	h.mu.RUnlock()

	if exists {
		return room
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	if room, exists = h.rooms[code]; exists {
		return room
	}

	room = Newroom(code, roomid, h.eventrepo, h.maxevents)
	h.rooms[code] = room

	go room.Run()

	fmt.Printf("[HUB] Room %s created and started\n", code)
	return room

}
func (h *Hub) RegisterClient(client *Client) {
	client.Room.register <- client
}

// GetRoom returns a room by code — nil if not active
func (h *Hub) GetRoom(code string) *Room {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.rooms[code]
}

// ActiveRooms returns count of rooms with connected clients
func (h *Hub) ActiveRooms() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.rooms)
}
