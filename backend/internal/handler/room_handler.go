package handler

import (
	"errors"
	"net/http"
	"pusleboard/internal/service"

	"github.com/gin-gonic/gin"
)

type Roomhandler struct {
	svc *service.Room_service
}

func Newroomhandler(svc *service.Room_service) Roomhandler {
	return Roomhandler{
		svc: svc,
	}
}

type createroomrequest struct {
	Name string `json:"name" binding:"required,min=1,max=50"`
}

type roomresponse struct {
	Id        string `json:"id"`
	Code      string `json:"code"`
	Name      string `json:"name"`
	Createdat string `json:"createdat"`
}

type errresponse struct {
	Error string `json:"error"`
}

func (h *Roomhandler) Create(c *gin.Context) {
	var req createroomrequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "parsing issue",
		})
		return
	}

	room, err := h.svc.Createroom(req.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to create room",
		})
		return
	}

	c.JSON(http.StatusCreated, roomresponse{
		Id:        room.Id.String(),
		Code:      room.Code,
		Name:      room.Name,
		Createdat: room.CreatedAt.Format("2006-01-02T15:04:05Z"),
	})
}

func (h *Roomhandler) Get(c *gin.Context) {
	code := c.Param("code")

	room, err := h.svc.GetRoom(code)

	if err != nil {
		if errors.Is(err, service.ErrRoomNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "room not found",
			})
			return
		}
		c.JSON(500, gin.H{
			"error": "failed to get room",
		})
		return
	}

	c.JSON(201, roomresponse{
		Id:        room.Id.String(),
		Name:      room.Name,
		Code:      code,
		Createdat: room.CreatedAt.Format("2006-01-02T15:04:05Z"),
	})

}

func (h *Roomhandler) List(c *gin.Context) {
	rooms, err := h.svc.Listrooms()
	if err != nil {
		c.JSON(501, gin.H{
			"error": "failed to list the rooms",
		})
		return
	}

	resp := make([]roomresponse, 0, len(rooms))
	for _, r := range rooms {
		resp = append(resp, roomresponse{
			Id:        r.Id.String(),
			Code:      r.Code,
			Name:      r.Name,
			Createdat: r.CreatedAt.Format("2006-01-02T15:04:05Z"),
		})
	}
	c.JSON(200, resp)
}
