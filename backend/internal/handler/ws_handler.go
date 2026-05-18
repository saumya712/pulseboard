package handler

import (
	"fmt"
	"net/http"
	"pusleboard/internal/domain"
	"pusleboard/internal/hub"
	"pusleboard/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,

	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type WSHandler struct {
	hub *hub.Hub
	svc *service.Room_service
}

func NewWShandler(h *hub.Hub, svc *service.Room_service) *WSHandler {
	return &WSHandler{
		hub: h,
		svc: svc,
	}
}

func (h *WSHandler) Handle(c *gin.Context) {
	roomcode := c.Query("room")
	username := c.Query("username")

	if roomcode == "" || username == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "bad request",
		})
		return
	}

	room, err := h.svc.GetRoom(roomcode)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "not found",
		})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		fmt.Printf("WebSocket upgrade failed: %v\n", err)
		return
	}

	hubroom := h.hub.Getorcreateroom(roomcode, room.Id)

	client := &hub.Client{
		Client: domain.Client{
			ID:       uuid.New().String(),
			Username: username,
			Roomcode: roomcode,
		},
		Conn: conn,
		Send: make(chan []byte, 256),
		Room: hubroom,
		Hub:  h.hub,
	}

	h.hub.RegisterClient(client)

	go client.Writepump()
	go client.Readpump()
}
