from __future__ import annotations

from datetime import datetime
from typing import Any

import pandas as pd

from financials import FinancialData


Metric = dict[str, Any]


def analyze_symbol(symbol: str) -> dict[str, Any]:
    normalized_symbol = symbol.strip().upper()
    if not normalized_symbol:
        raise ValueError("Vui lòng nhập mã cổ phiếu.")

    financial = FinancialData(normalized_symbol)
    statements = financial.get_all()
    result = build_financial_health_result(statements)
    result["symbol"] = normalized_symbol
    result["companyName"] = normalized_symbol
    result["dataSource"] = "VNStock"
    result["analyzedAt"] = datetime.now().isoformat()
    return result


def build_financial_health_result(financial_data: dict[str, Any]) -> dict[str, Any]:
    balance_sheet = financial_data.get("balance_sheet")
    income = financial_data.get("income_statement")
    cash_flow = financial_data.get("cash_flow")

    if not _has_data(balance_sheet) or not _has_data(income):
        raise ValueError("Thiếu dữ liệu bảng cân đối kế toán hoặc báo cáo kết quả kinh doanh.")

    years = _common_years(balance_sheet, income)
    if len(years) < 2:
        raise ValueError("Không đủ tối thiểu 2 kỳ báo cáo để so sánh.")

    current_year, previous_year = years[0], years[1]
    prior_year = years[2] if len(years) > 2 else None

    metrics = {
        "roe": _ratio_metric(
            label="ROE",
            unit="%",
            current=_safe_divide(
                _value(income, ["Lợi nhuận sau thuế"], current_year),
                _value(balance_sheet, ["Vốn chủ sở hữu"], current_year),
                percent=True,
            ),
            previous=_safe_divide(
                _value(income, ["Lợi nhuận sau thuế"], previous_year),
                _value(balance_sheet, ["Vốn chủ sở hữu"], previous_year),
                percent=True,
            ),
            score_fn=_score_roe,
            comment_up="ROE cải thiện, hiệu quả sử dụng vốn chủ sở hữu tốt hơn.",
            comment_down="ROE giảm, cần theo dõi khả năng sinh lời trên vốn chủ sở hữu.",
            comment_stable="ROE tương đối ổn định so với kỳ trước.",
        ),
        "roa": _ratio_metric(
            label="ROA",
            unit="%",
            current=_safe_divide(
                _value(income, ["Lợi nhuận sau thuế"], current_year),
                _value(balance_sheet, ["Tổng tài sản"], current_year),
                percent=True,
            ),
            previous=_safe_divide(
                _value(income, ["Lợi nhuận sau thuế"], previous_year),
                _value(balance_sheet, ["Tổng tài sản"], previous_year),
                percent=True,
            ),
            score_fn=_score_roa,
            comment_up="ROA tăng, tài sản đang tạo lợi nhuận hiệu quả hơn.",
            comment_down="ROA giảm, hiệu quả khai thác tài sản suy yếu.",
            comment_stable="ROA duy trì ổn định giữa hai kỳ.",
        ),
        "currentRatio": _ratio_metric(
            label="Tỷ lệ thanh toán ngắn hạn",
            unit="lần",
            current=_safe_divide(
                _value(balance_sheet, ["Tài sản ngắn hạn"], current_year),
                _value(balance_sheet, ["Nợ ngắn hạn", "Nợ phải trả"], current_year),
            ),
            previous=_safe_divide(
                _value(balance_sheet, ["Tài sản ngắn hạn"], previous_year),
                _value(balance_sheet, ["Nợ ngắn hạn", "Nợ phải trả"], previous_year),
            ),
            score_fn=_score_current_ratio,
            comment_up="Khả năng thanh toán ngắn hạn cải thiện.",
            comment_down="Khả năng thanh toán ngắn hạn giảm, cần theo dõi vốn lưu động.",
            comment_stable="Khả năng thanh toán ngắn hạn không biến động lớn.",
        ),
        "operatingCashFlow": _ratio_metric(
            label="Dòng tiền từ hoạt động kinh doanh",
            unit="VND",
            current=_value(cash_flow, ["Dòng tiền HĐKD"], current_year),
            previous=_value(cash_flow, ["Dòng tiền HĐKD"], previous_year),
            score_fn=_score_operating_cash_flow,
            comment_up="Dòng tiền kinh doanh tăng, hỗ trợ chất lượng lợi nhuận.",
            comment_down="Dòng tiền kinh doanh giảm, cần kiểm tra khả năng chuyển lợi nhuận thành tiền.",
            comment_stable="Dòng tiền kinh doanh tương đối ổn định.",
        ),
        "revenueGrowth": _ratio_metric(
            label="Tăng trưởng doanh thu",
            unit="%",
            current=_growth(
                _value(income, ["Doanh thu thuần"], current_year),
                _value(income, ["Doanh thu thuần"], previous_year),
            ),
            previous=_growth(
                _value(income, ["Doanh thu thuần"], previous_year),
                _value(income, ["Doanh thu thuần"], prior_year) if prior_year else None,
            ),
            score_fn=_score_revenue_growth,
            comment_up="Tăng trưởng doanh thu cải thiện so với giai đoạn trước.",
            comment_down="Tăng trưởng doanh thu suy giảm, cần theo dõi sức cầu và hiệu quả bán hàng.",
            comment_stable="Tăng trưởng doanh thu tương đối ổn định.",
        ),
    }

    total_score = int(sum(metric["score"] for metric in metrics.values()))
    level = _health_level(total_score)
    insights = _build_insights(metrics, total_score, level)

    return {
        "symbol": str(financial_data.get("symbol", "")).upper(),
        "companyName": str(financial_data.get("symbol", "")).upper(),
        "periods": {"current": current_year, "previous": previous_year},
        "financialHealth": {
            "score": total_score,
            "maxScore": 100,
            "level": level,
            "summary": f"Sức khỏe tài chính được xếp loại {level} với tổng điểm {total_score}/100 dựa trên 5 chỉ số trọng yếu.",
        },
        "metrics": metrics,
        "insights": insights,
    }


def _has_data(frame: Any) -> bool:
    return isinstance(frame, pd.DataFrame) and not frame.empty


def _common_years(*frames: pd.DataFrame) -> list[str]:
    year_sets = []
    for frame in frames:
        year_sets.append({str(col) for col in frame.columns if str(col).isdigit()})
    return sorted(set.intersection(*year_sets), reverse=True)


def _value(frame: Any, names: list[str], year: str | None) -> float | None:
    if not year or not _has_data(frame) or year not in frame.columns:
        return None

    for name in names:
        if name in frame.index:
            value = frame.loc[name, year]
            if pd.notna(value):
                number = float(value)
                return number if pd.notna(number) else None
    return None


def _safe_divide(numerator: float | None, denominator: float | None, percent: bool = False) -> float | None:
    if numerator is None or denominator in (None, 0):
        return None
    value = numerator / denominator
    if percent:
        value *= 100
    return round(value, 2)


def _growth(current: float | None, previous: float | None) -> float | None:
    if current is None or previous in (None, 0):
        return None
    return round((current - previous) / abs(previous) * 100, 2)


def _ratio_metric(
    label: str,
    unit: str,
    current: float | None,
    previous: float | None,
    score_fn,
    comment_up: str,
    comment_down: str,
    comment_stable: str,
) -> Metric:
    change = None if current is None or previous is None else round(current - previous, 2)
    change_percent = _growth(current, previous)
    trend = _trend(change_percent)
    comment = {"up": comment_up, "down": comment_down, "stable": comment_stable}[trend]
    if current is None:
        comment = "Thiếu dữ liệu hiện tại để đánh giá chỉ số này."

    return {
        "label": label,
        "unit": unit,
        "current": current,
        "previous": previous,
        "change": change,
        "changePercent": change_percent,
        "trend": trend,
        "score": score_fn(current, previous),
        "maxScore": 20,
        "comment": comment,
    }


def _trend(change_percent: float | None) -> str:
    if change_percent is None or abs(change_percent) < 2:
        return "stable"
    return "up" if change_percent > 0 else "down"


def _score_roe(current: float | None, _: float | None) -> int:
    if current is None:
        return 0
    if current >= 20:
        return 20
    if current >= 15:
        return 16
    if current >= 10:
        return 12
    if current >= 5:
        return 8
    return 4


def _score_roa(current: float | None, _: float | None) -> int:
    if current is None:
        return 0
    if current >= 10:
        return 20
    if current >= 7:
        return 16
    if current >= 4:
        return 12
    if current >= 1:
        return 8
    return 4


def _score_current_ratio(current: float | None, _: float | None) -> int:
    if current is None:
        return 0
    if 1.2 <= current <= 2.5:
        return 20
    if current > 2.5:
        return 16
    if current >= 1:
        return 12
    if current >= 0.7:
        return 8
    return 4


def _score_operating_cash_flow(current: float | None, previous: float | None) -> int:
    if current is None:
        return 0
    if current > 0 and (previous is None or current >= previous):
        return 20
    if current > 0:
        return 14
    return 4


def _score_revenue_growth(current: float | None, _: float | None) -> int:
    if current is None:
        return 0
    if current >= 15:
        return 20
    if current >= 8:
        return 16
    if current >= 3:
        return 12
    if current >= 0:
        return 8
    return 4


def _health_level(score: int) -> str:
    if score >= 80:
        return "Tốt"
    if score >= 65:
        return "Khá"
    if score >= 50:
        return "Trung bình"
    return "Yếu"


def _build_insights(metrics: dict[str, Metric], total_score: int, level: str) -> dict[str, Any]:
    strengths = [metric["comment"] for metric in metrics.values() if metric["trend"] == "up" and metric["score"] >= 14]
    weaknesses = [metric["comment"] for metric in metrics.values() if metric["score"] < 10]
    risks = []

    if metrics["currentRatio"]["current"] is not None and metrics["currentRatio"]["current"] < 1:
        risks.append("Tỷ lệ thanh toán ngắn hạn dưới 1, có thể tạo áp lực thanh khoản.")
    if metrics["operatingCashFlow"]["current"] is not None and metrics["operatingCashFlow"]["current"] < 0:
        risks.append("Dòng tiền kinh doanh âm, cần theo dõi chất lượng lợi nhuận.")
    if metrics["revenueGrowth"]["trend"] == "down":
        risks.append("Tăng trưởng doanh thu đang suy giảm so với giai đoạn trước.")

    return {
        "summary": f"Doanh nghiệp đạt mức {level} với {total_score}/100 điểm Financial Health.",
        "strengths": strengths or ["Một số chỉ số chính duy trì ở vùng ổn định."],
        "weaknesses": weaknesses,
        "risks": risks,
        "watchItems": ["ROE", "ROA", "Tỷ lệ thanh toán ngắn hạn", "Dòng tiền từ hoạt động kinh doanh", "Tăng trưởng doanh thu"],
        "overallConclusion": (
            f"Kết luận tổng quan: sức khỏe tài chính ở mức {level}. "
            "Đây là phân tích dữ liệu tài chính doanh nghiệp, không phải khuyến nghị mua hoặc bán cổ phiếu."
        ),
    }
