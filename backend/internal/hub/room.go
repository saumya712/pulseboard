package hub

import (
	"encoding/json"
	"fmt"
	"log"
	"pusleboard/internal/domain"
	"time"

	"github.com/google/uuid"
)

type Room struct {
	Code       string
	Roomid     uuid.UUID
	clients    map[string]*Client
	broadcast  chan Enrichedmessage
	register   chan *Client
	unregister chan *Client
	eventrepo  domain.Eventrepository
	maxevents  int
}

func Newroom(code string, roomid uuid.UUID, eventrepo domain.Eventrepository, maxevents int) *Room {
	return &Room{
		Code:       code,
		Roomid:     roomid,
		clients:    make(map[string]*Client),
		broadcast:  make(chan Enrichedmessage, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		eventrepo:  eventrepo,
		maxevents:  maxevents,
	}
}

func (n *Room) Run() {
	for {
		select {
		case client := <-n.register:
			n.clients[client.ID] = client
			fmt.Printf("%s joined - %d online", client.Username, len(n.clients))

			go n.sendsynctoclient(client)

			n.broadcastuserevent("user joined", client.Username)

		case client := <-n.unregister:

			if _, ok := n.clients[client.ID]; ok {
				delete(n.clients, client.ID)
				close(client.Send)
				fmt.Printf("%s left--%d online\n", client.Username, len(n.clients))

				n.broadcastuserevent("user left", client.Username)
			}

		case msg := <-n.broadcast:

			n.handlemessage(msg)

		}
	}
}

func (n *Room) handlemessage(msg Enrichedmessage) {
	switch msg.Type {
	case "draw":
		n.persistevent("draw", json.RawMessage(msg.Payload))

		go n.pruneidneeded()

		n.fanout(msg)
	case "chat":
		n.persistevent("chat", json.RawMessage(msg.Payload))

		n.fanout(msg)
	case "delete":

		if err := n.eventrepo.Deletebyroomid(n.Roomid); err != nil {
			log.Printf("[ROOM %s] failed to clear events : %v", n.Code, err)

		}
		n.fanout(msg)
	}
}

func (R *Room) fanout(msg Enrichedmessage) {
	outbound := map[string]interface{}{
		"type":     msg.Type,
		"payload":  msg.Payload,
		"sender":   msg.Username,
		"senderid": msg.Sendersid,
	}

	data, err := json.Marshal(outbound)
	if err != nil {
		log.Printf("couldnt marshal data %v", err)
		return
	}

	for _, client := range R.clients {
		client.Sendd(data)
	}
}

func (r *Room) sendsynctoclient(client *Client) {
	events, err := r.eventrepo.Getbyroomid(r.Roomid)
	if err != nil {
		log.Printf("failed to get events: %v", err)
		return
	}

	users := make([]string, 0, len(r.clients))
	for _, c := range r.clients {
		users = append(users, c.Username)
	}

	syncpayload := domain.Syncpayload{
		Events: make([]domain.Event, 0, len(events)),
		Users:  users,
	}

	for _, e := range events {
		syncpayload.Events = append(syncpayload.Events, *e)
	}

	data, err := json.Marshal(map[string]interface{}{
		"type":    "sync",
		"payload": syncpayload,
	})

	if err != nil {
		log.Printf("failed to marshal sync:%v", err)
		return
	}

	client.Sendd(data)
}

func (r *Room) broadcastuserevent(eventtype, username string) {
	payload := domain.Userpayload{
		User:  username,
		Count: len(r.clients),
	}

	data, _ := json.Marshal(map[string]interface{}{
		"type":    eventtype,
		"payload": payload,
	})

	for _, client := range r.clients {
		client.Sendd(data)
	}

}

func (r *Room) persistevent(eventtype string, payload json.RawMessage) {
	event := &domain.Event{
		Roomid:    r.Roomid,
		Type:      eventtype,
		Payload:   payload,
		Createdat: time.Now().UTC(),
	}

	if err := r.eventrepo.Insert(event); err != nil {
		log.Printf("failed to persist event %v", err)
		return
	}

}

func (r *Room) pruneidneeded() {
	count, err := r.eventrepo.Countbyroomid(r.Roomid)
	if err != nil {
		return
	}

	if count > int64(r.maxevents) {
		if err := r.eventrepo.Deletetheoldest(r.Roomid, r.maxevents); err != nil {
			log.Printf("failed to prune events:%v", err)
		}
	}
}

func (r *Room) Usercount() int {
	return len(r.clients)
}
