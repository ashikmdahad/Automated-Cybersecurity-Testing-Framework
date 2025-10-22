# Automated Cybersecurity Testing Framework

An end-to-end, full‑stack framework for simulating and testing cybersecurity in automotive‑style networks (e.g., CAN bus). It provides:

- Python scanner with sniff/inject routines (Scapy)
- Optional CAN traffic generation and a C++ emulator (pybind11‑ready)
- FastAPI backend with REST, SSE, and WebSocket streaming
- React + Material‑UI dashboard with charts, history, and export
- SQLite logging, reporting, tests, and Dockerized local setup

Use it to demo security scanning concepts, prototype detection pipelines, or build automated test rigs for IoT/automotive systems.

## Architecture
- Frontend (React + MUI): Dashboard, live scans, reporting, history, CSV/JSON export, dark mode.
- Backend (FastAPI): REST (`/api/scan`, `/api/report`, `/api/results`), SSE (`/api/scan/stream`), WebSocket (`/api/scan/ws`).
- Core (Python/C++): Scapy‑based sniff/inject, C++ CAN emulator (Linux), SQLite logging.
- CI/CD: GitLab CI job examples; CMake lists for native build.

## Quick Start

Option A — Docker (recommended)
1) `docker-compose up --build`
2) Open `http://localhost:3000` (frontend)
3) Backend at `http://localhost:8000` (docs at `/docs`)

Option B — Local dev
- Backend
  - `cd backend && pip install -r requirements.txt`
  - `uvicorn main:app --reload`
- Frontend
  - `cd frontend && npm install && npm start`

## Using the App
- Simulate toggle: Runs a deterministic scan without requiring real CAN.
- Run Scan: One‑shot scan via REST; results and report update on completion.
- Live Scan (SSE): Streams results server‑sent events in real time.
- Live Scan (WS): Streams results over WebSocket.
- History: View past results from SQLite, filter by status/type, clear history.
- Export: CSV/JSON export for Results and History.
- Dark Mode: Toggle in the header; layout remains responsive.

## Backend API
- `POST /api/scan` body `{ "interface": "vcan0", "simulate": bool }` → returns `{ results: [...] }` and logs entries to SQLite.
- `GET /api/scan/stream?interface=vcan0&simulate=0|1` → SSE stream of `{ event, payload }` messages.
- `GET /api/scan/ws?interface=vcan0&simulate=0|1` → WebSocket stream, same message contract.
- `GET /api/report` → Markdown report based on DB contents.
- `GET /api/results` → Raw rows from SQLite for UI/history.
- `DELETE /api/results` → Clear stored results.
- `GET /health` → Health probe.

## Environment Variables
- Backend
  - `ALLOWED_ORIGINS`: Comma‑separated CORS origins (default `http://localhost:3000`).
  - `ENABLE_TRAFFIC`: `1` enables `cangen` traffic on `vcan0` in the backend container.
  - `RESULTS_DB`: Path to SQLite DB (default `data/results.db`).
- Frontend
  - `REACT_APP_API_BASE`: API base (default `http://localhost:8000`).

## Data & Persistence
- Results persist to `./data/results.db` in Docker via a bind mount.
- Reports are generated from SQLite; if empty, a friendly message is shown.

## Platform Notes
- CAN tooling (cangen/vcan) requires Linux capabilities. Docker compose uses `NET_ADMIN` and runs privileged to configure vcan inside the container.
- The C++ emulator is Linux‑only; tests skip when unsupported or the module isn’t compiled.

## Building the C++ Emulator (optional)
```
mkdir build && cd build
cmake ..
make
```
If `pybind11` CMake config isn’t available system‑wide, the build is skipped with a warning to keep CI/dev flows green.

## Tests
```
pip install -r requirements.txt
pytest src/tests/
```
Scanner tests run everywhere thanks to fallbacks. Emulator tests auto‑skip where unsupported.

## Troubleshooting
- No live results: Ensure backend is up at `:8000`. If not simulating, you need vcan0 and Scapy CAN support; use Docker compose or set up vcan locally.
- CORS issues: Set `ALLOWED_ORIGINS` appropriately in the backend.
- DB not found: The app creates `data/` automatically. Check `RESULTS_DB` if customized.

## Security & Scope
This repo demonstrates scanning concepts for educational and prototyping purposes. It is not intended for production use on real vehicles. Always follow local laws and safety best practices.
