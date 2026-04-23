# FitTrack — Self-Hosted Sport Tracking App

A minimalist, self-hosted fitness tracking web app built for Raspberry Pi 5. Dark mode by default, no accounts required.

## Features

- **Dashboard** — Weekly overview of workouts, calories, weight
- **Workout Logging** — Track exercises, sets, reps, weight with a built-in rest timer
- **Training Plans** — Create and activate Push/Pull/Legs or any custom split
- **Progress & Stats** — Personal records, volume charts, weight history, workout heatmap
- **Nutrition** — Log meals, track calories and macros against daily goals
- **Body Metrics** — Weight, body fat %, measurements, BMI
- **Settings** — Manage exercises/foods, set goals, export/import data

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Hono + Bun + Drizzle ORM |
| Database | SQLite (file-based) |
| Deploy | Docker Compose + nginx |

---

## Deploy on Raspberry Pi OS (64-bit)

### Prerequisites

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose plugin
sudo apt install -y docker-compose-plugin

# Verify
docker --version
docker compose version
```

### Clone & Start

```bash
# Clone the repository
git clone <your-repo-url> fittrack
cd fittrack

# Build and start all services
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f
```

The app will be available at **http://<raspberry-pi-ip>:3000**

To find your Pi's IP address:
```bash
hostname -I
```

### First-Time Setup

On first start the backend automatically:
1. Runs database migrations
2. Seeds ~50 exercises, ~30 foods, and a PPL training plan

### Stopping & Updating

```bash
# Stop
docker compose down

# Update (after git pull)
docker compose up -d --build

# View backend logs
docker compose logs backend -f
```

### Data Persistence

The SQLite database is stored in a Docker volume (`fittrack-data`). It persists across container restarts and updates.

```bash
# Backup the database
docker run --rm -v fittrack_fittrack-data:/data -v $(pwd):/backup alpine \
  cp /data/fittrack.db /backup/fittrack-backup.db

# Restore from backup
docker run --rm -v fittrack_fittrack-data:/data -v $(pwd):/backup alpine \
  cp /backup/fittrack-backup.db /data/fittrack.db
```

### Auto-Start on Boot

Docker with the restart policy `unless-stopped` will automatically restart containers after a reboot. To ensure Docker itself starts on boot:

```bash
sudo systemctl enable docker
```

---

## Local Development

### Backend

```bash
cd backend
bun install
bun run db:migrate   # run migrations
bun run db:seed      # seed initial data
bun run dev          # start dev server on :3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev          # start dev server on :3000 (proxies /api → :3001)
```

---

## Configuration

Environment variables for the backend container (set in `docker-compose.yml`):

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Backend port |
| `DB_PATH` | `./fittrack.db` | SQLite database file path |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed frontend origin |

Nutrition goals and height can be adjusted in the app under **Settings → Ziele**.

---

## API Endpoints

```
GET  /health

GET  /api/exercises
POST /api/exercises
PUT  /api/exercises/:id
DEL  /api/exercises/:id

GET  /api/workouts
GET  /api/workouts/stats/weekly
GET  /api/workouts/personal-records
GET  /api/workouts/volume/history
GET  /api/workouts/heatmap
GET  /api/workouts/:id
POST /api/workouts
PUT  /api/workouts/:id
DEL  /api/workouts/:id

GET  /api/plans
GET  /api/plans/:id
POST /api/plans
PUT  /api/plans/:id
PATCH /api/plans/:id/activate
DEL  /api/plans/:id

GET  /api/nutrition/foods
POST /api/nutrition/foods
PUT  /api/nutrition/foods/:id
DEL  /api/nutrition/foods/:id
GET  /api/nutrition/logs
GET  /api/nutrition/logs/weekly
POST /api/nutrition/logs
DEL  /api/nutrition/logs/:id

GET  /api/metrics
GET  /api/metrics/latest
POST /api/metrics
DEL  /api/metrics/:id

GET  /api/settings
PUT  /api/settings
GET  /api/settings/export
POST /api/settings/import
```
