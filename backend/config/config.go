package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type config struct {
	DatabaseUrl      string
	Port             string
	AppUrl           string
	Env              string
	Maxeventsperroom int
}

func Load() *config {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found")
	}

	Maxevents := 5000

	if v := os.Getenv("MAX_EVENTS_PER_ROOM"); v != "" {
		if n, err := strconv.Atoi(v); err != nil {
			Maxevents = n
		}
	}

	return &config{
		DatabaseUrl:      mustget("DATABASE_URL"),
		Port:             getordefault("PORT", ":8080"),
		AppUrl:           getordefault("APP_URL", "http://localhost:5173"),
		Env:              getordefault("ENV", "development"),
		Maxeventsperroom: Maxevents,
	}
}

func mustget(key string) string {
	val := os.Getenv(key)
	if val == "" {
		log.Fatalf("FATAL required env variable %q is not set", key)
	}
	return val
}

func getordefault(key string, Default string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return Default
}
