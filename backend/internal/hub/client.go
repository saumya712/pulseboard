package hub

import (
	"encoding/json"
	"fmt"
	"log"
	"pusleboard/internal/domain"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writewait      = 10 * time.Second
	pongwait       = 60 * time.Second
	pingperiod     = (pongwait * 9) / 10
	maxmessagesize = 4096
)

type Client struct {
	domain.Client
	Room *Room
	Conn *websocket.Conn
	Send chan []byte
	Hub  *Hub
}

func (c *Client) Readpump() {
	defer func() {
		c.Room.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxmessagesize)
	c.Conn.SetReadDeadline(time.Now().Add(pongwait))

	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongwait))
		return nil
	})

	for {
		_, rawmsg, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("websocket error for client %s : %v", c.ID, err)
			}
			break
		}
		var msg domain.Message
		if err := json.Unmarshal(rawmsg, &msg); err != nil {
			log.Printf("invalid message from the client %s:%v", c.ID, err)
			continue
		}
		enriched := Enrichedmessage{
			Message:   msg,
			Sendersid: c.ID,
			Username:  c.Username,
		}

		c.Room.broadcast <- enriched
	}

}

func (c *Client) Writepump() {
	ticker := time.NewTicker(pingperiod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writewait))

			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writewait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) Sendd(msg []byte) {
	defer func() {
		recover() // if channel is closed, just ignore
	}()
	select {
	case c.Send <- msg:
	default:
		fmt.Printf("client %s Send buffer full\n", c.ID)
	}
}

type Enrichedmessage struct {
	domain.Message
	Sendersid string
	Username  string
}
