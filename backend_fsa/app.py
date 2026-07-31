from __future__ import annotations

import sys
import warnings
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from analysis_engine import analyze_symbol
from data_file import get_data_records, get_data_summary

for stream in (sys.stdout, sys.stderr):
    if hasattr(stream, "reconfigure"):
        stream.reconfigure(encoding="utf-8", errors="replace")

warnings.filterwarnings("ignore", category=FutureWarning, message="Downcasting object dtype arrays.*")


app = FastAPI(title="Financial Analytics AI API", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ok(message: str, data: Any) -> dict[str, Any]:
    return {"success": True, "message": message, "data": data, "error": None}


def fail(message: str, error: Any, status_code: int = 400) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "message": message, "data": None, "error": str(error)},
    )


FRONTEND_DIST = BASE_DIR.parent / "Frontend" / "dist"


@app.get("/")
def home():
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return ok("Financial Analytics AI backend đang hoạt động.", {"service": "financial-analytics-ai", "version": "3.0"})


@app.get("/api/health")
def health():
    try:
        summary = get_data_summary()
        return ok("Backend sẵn sàng.", {"status": "online", "dataFile": summary})
    except Exception as exc:
        return fail("Backend hoạt động nhưng file dữ liệu chưa sẵn sàng.", exc, 503)


@app.get("/api/data")
def data(limit: int = Query(default=100, ge=1, le=1000)):
    try:
        return ok("Đọc file dữ liệu thành công.", get_data_records(limit=limit))
    except FileNotFoundError as exc:
        return fail("Không tìm thấy file dữ liệu.", exc, 404)
    except Exception as exc:
        return fail("Không thể đọc file dữ liệu.", exc, 500)


@app.get("/api/data/summary")
def data_summary():
    try:
        return ok("Lấy thống kê file dữ liệu thành công.", get_data_summary())
    except FileNotFoundError as exc:
        return fail("Không tìm thấy file dữ liệu.", exc, 404)
    except Exception as exc:
        return fail("Không thể đọc thống kê file dữ liệu.", exc, 500)


@app.get("/api/analyze/{symbol}")
async def analyze_stock(symbol: str):
    try:
        return ok("Phân tích mã cổ phiếu thành công.", analyze_symbol(symbol))
    except RuntimeError as exc:
        print(f"RuntimeError analyze {symbol}: {exc}", flush=True)
        return fail("Backend chưa sẵn sàng để gọi nguồn dữ liệu tài chính.", exc, 503)
    except ValueError as exc:
        print(f"ValueError analyze {symbol}: {exc}", flush=True)
        return fail("Không thể phân tích mã cổ phiếu.", exc, 400)
    except Exception as exc:
        print(f"Exception analyze {symbol}: {exc}", flush=True)
        return fail("Không thể phân tích mã cổ phiếu.", exc, 500)


@app.get("/analyze/{symbol}")
async def analyze_stock_legacy(symbol: str):
    return await analyze_stock(symbol)


# Static Files & Frontend SPA Handler
if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("analyze/"):
            return JSONResponse(status_code=404, content={"success": False, "message": "API Not Found"})
        file_path = FRONTEND_DIST / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")

