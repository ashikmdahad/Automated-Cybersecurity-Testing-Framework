import os
import json
import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from src.scanner.scanner import VulnerabilityScanner
from src.reporting.report_generator import generate_report
from src.reporting.logger import Logger  # Assume logging integrated in scan
from src.scanner.attacks.sniff import sniff_can_packets
from src.scanner.attacks.inject import inject_can_packet
from src.scanner.detection.engine import DetectionEngine
import json as _json
from typing import Any, Dict

app = FastAPI()

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Settings with simple persistence
SETTINGS_PATH = os.getenv("SETTINGS_PATH", os.path.join("data", "settings.json"))

def _ensure_dir(path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)

def load_settings() -> Dict[str, Any]:
    try:
        if os.path.exists(SETTINGS_PATH):
            with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
                return _json.load(f)
    except Exception:
        pass
    return {"whitelist": ["0x123", "0x456"], "blacklist": ["0x7DF", "0x6F1"], "rate_threshold": 50}

def save_settings(cfg: Dict[str, Any]):
    _ensure_dir(SETTINGS_PATH)
    with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
        _json.dump(cfg, f)

SETTINGS = load_settings()

class ScanRequest(BaseModel):
    interface: str = "vcan0"
    simulate: bool = False

# On-demand scan (REST)
@app.post("/api/scan")
async def run_scan(request: ScanRequest):
    try:
        if request.simulate:
            # Produce deterministic synthetic results for demos/CI
            now = int(time.time())
            results = [
                {"type": "sniff", "status": "detected", "packet": f"CAN(id=0x123, data=01020304, t={now})"},
                {"type": "sniff", "status": "detected", "packet": f"CAN(id=0x456, data=11223344, t={now})"},
                {"type": "inject", "status": "success", "details": "Injected test frame on vcan0"},
            ]
        else:
            scanner = VulnerabilityScanner(request.interface)
            results = scanner.run_scan()

        # Run detection
        engine = DetectionEngine(SETTINGS)
        findings = engine.analyze(results)

        logger = Logger()
        for result in results:
            logger.log_result(result["type"], result.get("status", "detected"), str(result))
        for f in findings:
            logger.log_result("finding", f.get("severity", "alert"), str(f))
        logger.close()
        return {"results": results, "findings": findings}
    except Exception as e:
        err = {"type": "scan", "status": "failed", "error": str(e)}
        return {"results": [err], "findings": []}

@app.get("/api/report")
async def get_report():
    report = generate_report()
    return {"report": report}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/results")
async def get_results():
    # Convenience endpoint to return raw rows for UI use
    import sqlite3
    db_path = os.getenv("RESULTS_DB", "data/results.db")
    if not os.path.exists(db_path):
        return {"results": []}
    conn = sqlite3.connect(db_path)
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, timestamp, test_type, status, details FROM results ORDER BY id DESC")
        rows = cur.fetchall()
        return {
            "results": [
                {
                    "id": r[0],
                    "timestamp": r[1],
                    "type": r[2],
                    "status": r[3],
                    "details": r[4],
                }
                for r in rows
            ]
        }
    finally:
        conn.close()


@app.delete("/api/results")
async def clear_results():
    import sqlite3
    db_path = os.getenv("RESULTS_DB", "data/results.db")
    if not os.path.exists(db_path):
        return {"cleared": 0}
    conn = sqlite3.connect(db_path)
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM results")
        conn.commit()
        return {"cleared": cur.rowcount}
    finally:
        conn.close()


def _sse_event(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


# Live scan (SSE)
@app.get("/api/scan/stream")
def stream_scan(interface: str = "vcan0", simulate: bool = False):
    logger = Logger()

    def event_gen():
        # Start event
        yield _sse_event({"event": "start", "payload": {"interface": interface, "simulate": simulate}})
        collected = []
        try:
            if simulate:
                now = int(time.time())
                simulated = [
                    {"type": "sniff", "status": "detected", "packet": f"CAN(id=0x123, data=01020304, t={now})"},
                    {"type": "sniff", "status": "detected", "packet": f"CAN(id=0x456, data=11223344, t={now})"},
                    {"type": "inject", "status": "success", "details": "Injected test frame on vcan0"},
                ]
                for item in simulated:
                    logger.log_result(item["type"], item.get("status", "detected"), str(item))
                    collected.append(item)
                    yield _sse_event({"event": "result", "payload": item})
                    time.sleep(0.3)
            else:
                # Real scan: stream sniff results first, then inject
                sniff_results = sniff_can_packets(interface)
                for item in sniff_results:
                    logger.log_result(item["type"], item.get("status", "detected"), str(item))
                    collected.append(item)
                    yield _sse_event({"event": "result", "payload": item})
                    time.sleep(0.05)
                inject_results = inject_can_packet(interface)
                for item in inject_results:
                    logger.log_result(item["type"], item.get("status", "detected"), str(item))
                    collected.append(item)
                    yield _sse_event({"event": "result", "payload": item})
                    time.sleep(0.05)
            # Run detection at the end and stream findings
            engine = DetectionEngine(SETTINGS)
            findings = engine.analyze(collected)
            for f in findings:
                logger.log_result("finding", f.get("severity", "alert"), str(f))
                yield _sse_event({"event": "finding", "payload": f})
        except Exception as e:
            err = {"type": "scan", "status": "failed", "error": str(e)}
            logger.log_result("scan", "failed", str(err))
            yield _sse_event({"event": "error", "payload": err})
        finally:
            logger.close()
            yield _sse_event({"event": "done"})

    origin = allowed_origins[0] if allowed_origins else "*"
    headers = {"Cache-Control": "no-cache", "Connection": "keep-alive", "Access-Control-Allow-Origin": origin}
    return StreamingResponse(event_gen(), media_type="text/event-stream", headers=headers)


@app.websocket("/api/scan/ws")
async def ws_scan(websocket: WebSocket):
    await websocket.accept()
    # Parse query params
    params = websocket.query_params
    interface = params.get("interface", "vcan0")
    simulate = params.get("simulate", "0") in ("1", "true", "True")

    logger = Logger()
    try:
        await websocket.send_json({"event": "start", "payload": {"interface": interface, "simulate": simulate}})
        collected = []
        if simulate:
            now = int(time.time())
            simulated = [
                {"type": "sniff", "status": "detected", "packet": f"CAN(id=0x123, data=01020304, t={now})"},
                {"type": "sniff", "status": "detected", "packet": f"CAN(id=0x456, data=11223344, t={now})"},
                {"type": "inject", "status": "success", "details": "Injected test frame on vcan0"},
            ]
            for item in simulated:
                logger.log_result(item["type"], item.get("status", "detected"), str(item))
                collected.append(item)
                await websocket.send_json({"event": "result", "payload": item})
                await asyncio_sleep(0.3)
        else:
            # Send sniff results
            sniff_results = sniff_can_packets(interface)
            for item in sniff_results:
                logger.log_result(item["type"], item.get("status", "detected"), str(item))
                collected.append(item)
                await websocket.send_json({"event": "result", "payload": item})
                await asyncio_sleep(0.05)
            # Then inject
            inject_results = inject_can_packet(interface)
            for item in inject_results:
                logger.log_result(item["type"], item.get("status", "detected"), str(item))
                collected.append(item)
                await websocket.send_json({"event": "result", "payload": item})
                await asyncio_sleep(0.05)
        # After streaming results, send findings
        engine = DetectionEngine(SETTINGS)
        findings = engine.analyze(collected)
        for f in findings:
            await websocket.send_json({"event": "finding", "payload": f})
        await websocket.send_json({"event": "done"})
    except WebSocketDisconnect:
        pass
    except Exception as e:
        err = {"type": "scan", "status": "failed", "error": str(e)}
        logger.log_result("scan", "failed", str(err))
        try:
            await websocket.send_json({"event": "error", "payload": err})
        except Exception:
            pass
    finally:
        logger.close()
        try:
            await websocket.close()
        except Exception:
            pass

# Async friendly sleep for WS loop without importing asyncio globally
def asyncio_sleep(seconds: float):
    try:
        import asyncio
        return asyncio.sleep(seconds)
    except Exception:
        # Fallback: busy-wait (only used if asyncio unavailable which is unlikely)
        time.sleep(seconds)
        class _Dummy:
            def __await__(self):
                if False:
                    yield None
                return None
        return _Dummy()


@app.get("/", response_class=HTMLResponse)
async def index():
    # Simple landing page with common links
    return """
    <!doctype html>
    <html>
      <head>
        <meta charset='utf-8'/>
        <meta name='viewport' content='width=device-width, initial-scale=1'/>
        <title>Automated Cybersecurity Testing Framework API</title>
        <style>
          body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 2rem; line-height: 1.6; }
          code { background:#f4f6f8; padding:.2rem .35rem; border-radius:4px; }
          a { color: #0f62fe; text-decoration: none; }
          a:hover { text-decoration: underline; }
          ul { margin: .25rem 0 1rem 1.25rem; }
          .muted { color: #6b7280; }
        </style>
      </head>
      <body>
        <h1>Automated Cybersecurity Testing Framework API</h1>
        <p class='muted'>FastAPI backend is running. Explore the endpoints below.</p>
        <h3>Docs</h3>
        <ul>
          <li><a href="/docs">Swagger UI</a></li>
          <li><a href="/redoc">ReDoc</a></li>
        </ul>
        <h3>Health</h3>
        <ul>
          <li><a href="/health">/health</a></li>
        </ul>
        <h3>API</h3>
        <ul>
          <li><code>POST</code> <a href="/api/scan">/api/scan</a></li>
          <li><code>GET</code> <a href="/api/scan/stream">/api/scan/stream</a> (SSE)</li>
          <li><code>WS</code> <a href="/api/scan/ws">/api/scan/ws</a> (WebSocket)</li>
          <li><code>GET</code> <a href="/api/report">/api/report</a></li>
          <li><code>GET</code> <a href="/api/results">/api/results</a></li>
          <li><code>DELETE</code> <a href="/api/results">/api/results</a></li>
          <li><code>GET</code> <a href="/api/settings">/api/settings</a></li>
          <li><code>PUT</code> <a href="/api/settings">/api/settings</a></li>
        </ul>
        <p class='muted'>Frontend runs at <code>http://localhost:3000</code>.</p>
      </body>
    </html>
    """


@app.get("/api/settings")
async def get_settings():
    return SETTINGS


class SettingsModel(BaseModel):
    whitelist: list[str | int] | None = None
    blacklist: list[str | int] | None = None
    rate_threshold: int | None = None


@app.put("/api/settings")
async def update_settings(cfg: SettingsModel):
    global SETTINGS
    new_cfg = SETTINGS.copy()
    if cfg.whitelist is not None:
        new_cfg["whitelist"] = cfg.whitelist
    if cfg.blacklist is not None:
        new_cfg["blacklist"] = cfg.blacklist
    if cfg.rate_threshold is not None:
        new_cfg["rate_threshold"] = cfg.rate_threshold
    SETTINGS = new_cfg
    try:
        save_settings(SETTINGS)
    except Exception:
        pass
    return SETTINGS
