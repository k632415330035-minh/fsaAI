from __future__ import annotations

import os
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DATA_FILE = BASE_DIR / "FSA.xlsx"


def get_data_file_path() -> Path:
    configured = os.getenv("FSA_DATA_FILE", "").strip()
    if not configured:
        return DEFAULT_DATA_FILE

    path = Path(configured)
    return path if path.is_absolute() else BASE_DIR / path


def read_data_file() -> tuple[pd.DataFrame, Path]:
    path = get_data_file_path()
    if not path.exists():
        raise FileNotFoundError(f"Không tìm thấy file dữ liệu: {path}")

    suffix = path.suffix.lower()
    if suffix in [".xlsx", ".xls"]:
        frame = _read_excel_with_detected_header(path)
    elif suffix == ".csv":
        frame = pd.read_csv(path)
    elif suffix == ".json":
        frame = pd.read_json(path)
    else:
        raise ValueError("File dữ liệu phải là Excel, CSV hoặc JSON.")

    frame = frame.dropna(axis=1, how="all").dropna(axis=0, how="all")
    frame.columns = [str(col).strip() for col in frame.columns]
    return frame, path


def _read_excel_with_detected_header(path: Path) -> pd.DataFrame:
    raw = pd.read_excel(path, header=None)
    header_index = 0

    for index, row in raw.iterrows():
        values = {str(value).strip().lower() for value in row.tolist() if pd.notna(value)}
        if "kpi" in values or "back-end" in values or "backend" in values:
            header_index = int(index)
            break

    header = raw.iloc[header_index].tolist()
    frame = raw.iloc[header_index + 1 :].copy()
    frame.columns = [str(value).strip() if pd.notna(value) else f"column_{idx + 1}" for idx, value in enumerate(header)]
    return frame


def get_data_records(limit: int = 100) -> dict[str, Any]:
    frame, path = read_data_file()
    records = frame.head(limit).where(pd.notna(frame), None).to_dict(orient="records")
    return {
        "fileName": path.name,
        "filePath": str(path),
        "modifiedAt": datetime.fromtimestamp(path.stat().st_mtime).isoformat(),
        "totalRecords": int(len(frame)),
        "columns": list(frame.columns),
        "records": records,
    }


def get_data_summary() -> dict[str, Any]:
    frame, path = read_data_file()
    missing_values = int(frame.isna().sum().sum())
    valid_rows = int(len(frame.dropna(how="all")))
    return {
        "fileName": path.name,
        "filePath": str(path),
        "modifiedAt": datetime.fromtimestamp(path.stat().st_mtime).isoformat(),
        "totalRecords": int(len(frame)),
        "validRecords": valid_rows,
        "missingValues": missing_values,
        "columns": list(frame.columns),
        "numericColumns": list(frame.select_dtypes(include="number").columns),
    }
