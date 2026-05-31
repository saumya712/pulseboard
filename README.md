# PulseBoard

> Real-time collaborative whiteboard built with Go and WebSockets.

Create a board, share the code, and draw together. Every stroke syncs instantly across all connected users via WebSockets. Rooms persist — reload the page and the canvas is still there.

---

## Demo

```
1. Create a board → get a 6-character room code
2. Share the code with anyone
3. Draw, use shapes, chat — everything syncs in milliseconds
4. Leave and come back — canvas is saved
```

---

## Features

| Feature | Detail |
|---|---|
| Real-time drawing sync | WebSocket fan-out — every stroke broadcast to all clients |
| Drawing tools | Pen, rectangle, circle, eraser |
| Color palette | 8 colors with adjustable stroke width |
| Persistent canvas | All events stored in PostgreSQL, replayed on join |
| Built-in chat | Live chat alongside the whiteboard |
| Room codes | 6-character human-readable codes, no confusable characters |
| Event sourcing | New users see full canvas history on join |
| Graceful shutdown | Context cancellation, ping/pong keepalive |

---

## Architecture

```
Browser (React + Canvas)
        │
        │  WebSocket /ws?room=CODE&username=NAME
        │  REST      /api/rooms
        ▼
   Gin HTTP Server
        │
   Middleware: Logger · CORS · gin.Recovery
        │
   ┌────┴────┐
   │   Hub   │  ← one instance, owns all rooms
   └────┬────┘
        │
   ┌────┴────┐
   │  Room   │  ← one goroutine per active room, fan-out broadcast
   └────┬────┘
        │
   ┌────┴────┐
   │  Client │  ← two goroutines per connection: readPump + writePump
   └─────────┘
        │
   PostgreSQL
   ├── rooms  (id, code, name, created_at)
   └── events (id, room_id, type, payload JSONB, created_at)
```

### Layer Dependency Rule
```
Handler → Service → Repository → Domain
                 ↘ Hub        ↗
```

---

## WebSocket Message Protocol

```json
// Draw stroke
{ "type": "draw", "payload": { "tool": "pen", "x1": 100, "y1": 150, "x2": 105, "y2": 155, "color": "#111827", "width": 4 } }

// Chat message
{ "type": "chat", "payload": { "user": "Saumya", "text": "hello", "timestamp": "..." } }

// Canvas clear
{ "type": "clear" }

// Full state sync (server → new joiner)
{ "type": "sync", "payload": { "events": [...], "users": [...] } }

// User join/leave (server → all clients)
{ "type": "user_joined", "payload": { "user": "Saumya", "count": 3 } }
{ "type": "user_left",   "payload": { "user": "Saumya", "count": 2 } }
```

---

## Tech Stack

### Backend
- **Go 1.25** — Gin, Gorilla WebSocket, sqlx, lib/pq, uuid
- **PostgreSQL 15** — rooms + events with JSONB payload
- **Architecture** — Hub/Room/Client WebSocket engine, clean layered architecture

### Frontend
- **React 18** — React Router v6, Vite, Tailwind CSS v3
- **HTML5 Canvas** — pen, rectangle, circle, eraser tools
- **WebSocket client** — custom `useWebSocket` hook

### Infrastructure
- **Docker** — multi-stage builds (~15MB backend image)
- **Docker Compose** — local three-container setup
- **Kubernetes** — namespace, deployments, services, PVC for postgres

---

## Database Schema

```sql
CREATE TABLE rooms (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code       VARCHAR(8)  UNIQUE NOT NULL,
    name       TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE events (
    id         BIGSERIAL   PRIMARY KEY,
    room_id    UUID        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    type       VARCHAR(20) NOT NULL,   -- 'draw', 'chat', 'clear'
    payload    JSONB       NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_room_id      ON events(room_id);
CREATE INDEX idx_events_room_created ON events(room_id, created_at);
```

---

## Local Development

### Prerequisites
- Go 1.25+
- Node.js 20+
- PostgreSQL 15+

### Setup

```bash
# Backend
cd backend
cp .env.example .env
# fill in DATABASE_URL
go mod tidy
go run cmd/server/main.go

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

### Environment Variables

```bash
DATABASE_URL=postgres://postgres:password@localhost:5432/pulseboard?sslmode=disable
PORT=:8080
APP_URL=http://localhost:5173
ENV=development
MAX_EVENTS_PER_ROOM=5000
```

---

## Docker

```bash
# Run all three containers
docker-compose up --build

# Open
http://localhost
```

Services:
- `pulseboard-postgres` — PostgreSQL 15
- `pulseboard-backend`  — Go server on :8080
- `pulseboard-frontend` — Nginx serving React on :80

---

## Kubernetes

```bash
# Build images
docker build -t pulseboard-backend:v1  ./backend
docker build -t pulseboard-frontend:v2 ./frontend

# Deploy
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/

# Check status
kubectl get pods -n pulseboard

# Open
http://localhost:30080
```

---

## Key Engineering Decisions

**Two goroutines per client** — WebSocket connections are not goroutine-safe. A single goroutine writing to a connection from multiple places panics. The `writePump` is the only goroutine that ever writes to a connection. Everything else sends to a buffered channel and the pump drains it.

**No mutex in Room** — all Room state (clients map) is only ever accessed from inside the `Run()` goroutine. No concurrent access possible. Go's "share memory by communicating" — channels instead of locks.

**Event sourcing** — every draw stroke is stored as a JSONB event. New joiners receive all past events and replay them on their canvas. Persistent rooms with zero extra complexity.

**Double-checked locking in Hub** — `GetOrCreateRoom` reads with `RLock` (allows concurrent reads), then upgrades to `Lock` for writing. Checks again after acquiring write lock to prevent duplicate rooms under concurrent connections.

**Room code charset** — `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` excludes `I`, `O`, `0`, `1` which look similar in most fonts. Users typing codes on mobile never misread them.

---

## Resume Points

```
• Built real-time collaborative whiteboard using WebSocket hub/room/client
  architecture in Go — fan-out broadcast pattern serving N clients simultaneously

• Implemented event sourcing for canvas persistence — all draw events stored
  as JSONB in PostgreSQL, replayed on join to reconstruct exact canvas state

• Two-goroutine-per-connection design (readPump/writePump) with buffered
  channels for backpressure handling and goroutine-safe WebSocket writes

• Deployed on Kubernetes with 2 backend replicas, persistent volume for
  PostgreSQL, NodePort service, and Nginx reverse proxy with WS upgrade headers
```

---

## Author

**Saumya Pathak** — B.Tech Computer Engineering '27
