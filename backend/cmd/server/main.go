package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"pusleboard/config"
	"pusleboard/internal/handler"
	"pusleboard/internal/hub"
	"pusleboard/internal/repository"
	"pusleboard/internal/service"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {

	cfg := config.Load()

	db := repository.Newpostgress(cfg.DatabaseUrl)
	defer db.Close()

	roomrepo := repository.Newroomrepo(db)
	eventrepo := repository.Neweventrepo(db)

	h := hub.Newhub(eventrepo, cfg.Maxeventsperroom)

	roomsvc := service.Newroomservice(roomrepo, eventrepo, db)

	roomhandler := handler.Newroomhandler(roomsvc)

	wshandler := handler.NewWShandler(h, roomsvc)

	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	r.Use(gin.Recovery())

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.AppUrl},
		AllowMethods:     []string{"GET", "POST", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api")
	{
		rooms := api.Group("/rooms")
		{
			rooms.POST("", roomhandler.Create)
			rooms.GET("", roomhandler.List)
			rooms.GET("/:code", roomhandler.Get)
		}
	}

	r.GET("/ws", wshandler.Handle)

	r.GET("/health", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{
			"status":       "ok",
			"active_rooms": h.ActiveRooms(),
			"time":         time.Now().UTC(),
		})
	})

	srv := &http.Server{
		Addr:         cfg.Port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	go func() {
		fmt.Printf("✓ PulseBoard running on %s\n", cfg.Port)
		fmt.Printf("✓ Frontend origin: %s\n", cfg.AppUrl)
		fmt.Printf("✓ Environment: %s\n", cfg.Env)
		fmt.Printf("✓ Max events per room: %d\n", cfg.Maxeventsperroom)

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			fmt.Printf("FATAL: server error: %v\n", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	fmt.Println("\n[SERVER] Shutdown signal received")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	// 15 seconds for WebSocket connections to close gracefully
	// WebSockets are long-lived — give them more time than REST
	if err := srv.Shutdown(shutdownCtx); err != nil {
		fmt.Printf("[SERVER] Forced shutdown: %v\n", err)
	}

	fmt.Println("[SERVER] Shutdown complete")
}
