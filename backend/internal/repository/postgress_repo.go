package repository

import (
	"fmt"
	"log"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

func Newpostgress(databaseurl string) *sqlx.DB {
	db, err := sqlx.Connect("postgres", databaseurl)
	if err != nil {
		log.Fatalf("FATAL: could not connect with the database %v", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)

	runmigration(db)

	return db
}

func runmigration(db *sqlx.DB) {
	query := `CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS rooms (
        id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        code       VARCHAR(8)   UNIQUE NOT NULL,
        name       TEXT         NOT NULL,
        created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);

    CREATE TABLE IF NOT EXISTS events (
        id         BIGSERIAL    PRIMARY KEY,
        room_id    UUID         NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        type       VARCHAR(20)  NOT NULL,
        payload    JSONB        NOT NULL,
        created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_events_room_id ON events(room_id);
    CREATE INDEX IF NOT EXISTS idx_events_room_created ON events(room_id, created_at);`

	if _, err := db.Exec(query); err != nil {
		log.Fatalf("could not migrate the db:%v", err)
	}

	fmt.Println("migration applied")
}
