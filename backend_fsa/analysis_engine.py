from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import pandas as pd

from financials import FinancialData
from kpi import calculate_kpi
from insight import generate_ai_insight

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

    # Lấy tính toán KPI 6 nhóm từ kpi.py
    kpi_res = calculate_kpi(financial_data)
    raw_groups = kpi_res.get("groups", {})
    raw_ratios = kpi_res.get("ratios", {})
    raw_metrics = kpi_res.get("metrics", {})

    # TÍNH CÁC METRIC TRỌNG YẾU ĐỂ CHẤM ĐIỂM FINANCIAL HEALTH (0-100)
    # Detect if the entity is a Bank / Financial institution (no standard current assets or uses interest income)
    is_bank = bool(
        "Thu nhập lãi thuần" in income.index
        or "Thu nhập lãi và các khoản thu nhập tương tự" in income.index
        or "Tài sản ngắn hạn" not in balance_sheet.index
    )

    # Determine metric score functions based on entity type
    score_roe_fn = _score_roe_bank if is_bank else _score_roe
    score_roa_fn = _score_roa_bank if is_bank else _score_roa

    # TÍNH CÁC METRIC TRỌNG YẾU ĐỂ CHẤM ĐIỂM FINANCIAL HEALTH (0-100)
    metrics_health = {
        "roe": _ratio_metric(
            label="ROE",
            unit="%",
            current=raw_ratios.get("roe"),
            previous=_safe_divide(
                _value(income, ["Lợi nhuận sau thuế", "Cổ đông của Công ty mẹ", "LỢI NHUẬN KẾ TOÁN SAU THUẾ", "Lợi nhuận sau thuế phân bổ cho chủ sở hữu"], previous_year),
                _value(balance_sheet, ["Vốn chủ sở hữu", "VỐN CHỦ SỞ HỮU", "Vốn chủ sở hữu của Ngân hàng"], previous_year),
                percent=True,
            ),
            score_fn=score_roe_fn,
            comment_up="ROE cải thiện, hiệu quả sử dụng vốn chủ sở hữu tốt hơn.",
            comment_down="ROE giảm, cần theo dõi khả năng sinh lời trên vốn chủ sở hữu.",
            comment_stable="ROE tương đối ổn định so với kỳ trước.",
        ),
        "roa": _ratio_metric(
            label="ROA",
            unit="%",
            current=raw_ratios.get("roa"),
            previous=_safe_divide(
                _value(income, ["Lợi nhuận sau thuế", "Cổ đông của Công ty mẹ", "LỢI NHUẬN KẾ TOÁN SAU THUẾ", "Lợi nhuận sau thuế phân bổ cho chủ sở hữu"], previous_year),
                _value(balance_sheet, ["Tổng tài sản", "TỔNG CỘNG TÀI SẢN", "TỔNG TÀI SẢN", "Tổng tài sản có"], previous_year),
                percent=True,
            ),
            score_fn=score_roa_fn,
            comment_up="ROA tăng, tài sản đang tạo lợi nhuận hiệu quả hơn.",
            comment_down="ROA giảm, hiệu quả khai thác tài sản suy yếu.",
            comment_stable="ROA duy trì ổn định giữa hai kỳ.",
        ),
    }

    if is_bank:
        metrics_health["currentRatio"] = _ratio_metric(
            label="Tỷ lệ Vốn CSH / Tổng tài sản",
            unit="%",
            current=_safe_divide(
                _value(balance_sheet, ["Vốn chủ sở hữu", "VỐN CHỦ SỞ HỮU", "Vốn chủ sở hữu của Ngân hàng"], current_year),
                _value(balance_sheet, ["Tổng tài sản", "TỔNG CỘNG TÀI SẢN", "TỔNG TÀI SẢN", "Tổng tài sản có"], current_year),
                percent=True,
            ),
            previous=_safe_divide(
                _value(balance_sheet, ["Vốn chủ sở hữu", "VỐN CHỦ SỞ HỮU", "Vốn chủ sở hữu của Ngân hàng"], previous_year),
                _value(balance_sheet, ["Tổng tài sản", "TỔNG CỘNG TÀI SẢN", "TỔNG TÀI SẢN", "Tổng tài sản có"], previous_year),
                percent=True,
            ),
            score_fn=_score_equity_to_assets,
            comment_up="Tỷ lệ Vốn CSH/Tổng tài sản tăng, đệm an toàn vốn vững chắc hơn.",
            comment_down="Tỷ lệ Vốn CSH/Tổng tài sản giảm, đòn bẩy tài chính gia tăng.",
            comment_stable="Tỷ lệ an toàn vốn ổn định.",
        )
    else:
        metrics_health["currentRatio"] = _ratio_metric(
            label="Tỷ lệ thanh toán ngắn hạn",
            unit="lần",
            current=raw_ratios.get("current_ratio"),
            previous=_safe_divide(
                _value(balance_sheet, ["Tài sản ngắn hạn", "TÀI SẢN NGẮN HẠN"], previous_year),
                _value(balance_sheet, ["Nợ ngắn hạn", "Tổng nợ ngắn hạn", "NỢ NGẮN HẠN", "Nợ phải trả"], previous_year),
            ),
            score_fn=_score_current_ratio,
            comment_up="Khả năng thanh toán ngắn hạn cải thiện.",
            comment_down="Khả năng thanh toán ngắn hạn giảm, cần theo dõi vốn lưu động.",
            comment_stable="Khả năng thanh toán ngắn hạn không biến động lớn.",
        )

    metrics_health["operatingCashFlow"] = _ratio_metric(
        label="Dòng tiền từ hoạt động kinh doanh",
        unit="VND",
        current=raw_metrics.get("operating_cashflow"),
        previous=_value(cash_flow, ["Dòng tiền HĐKD", "Lưu chuyển tiền thuần từ hoạt động kinh doanh", "Lưu chuyển tiền thuần từ các hoạt động sản xuất kinh doanh", "Lưu chuyển tiền thuần từ hoạt động kinh doanh trước những thay đổi về tài sản và vốn lưu động"], previous_year),
        score_fn=_score_operating_cash_flow,
        comment_up="Dòng tiền kinh doanh tăng, hỗ trợ chất lượng lợi nhuận.",
        comment_down="Dòng tiền kinh doanh giảm, cần kiểm tra khả năng chuyển lợi nhuận thành tiền.",
        comment_stable="Dòng tiền kinh doanh tương đối ổn định.",
    )

    metrics_health["revenueGrowth"] = _ratio_metric(
        label="Tăng trưởng thu nhập" if is_bank else "Tăng trưởng doanh thu",
        unit="%",
        current=raw_ratios.get("revenue_growth"),
        previous=_growth(
            _value(income, ["Doanh thu thuần", "Thu nhập lãi thuần", "DOANH THU HOẠT ĐỘNG", "Thu nhập lãi và các khoản thu nhập tương tự", "Tổng thu nhập hoạt động"], previous_year),
            _value(income, ["Doanh thu thuần", "Thu nhập lãi thuần", "DOANH THU HOẠT ĐỘNG", "Thu nhập lãi và các khoản thu nhập tương tự", "Tổng thu nhập hoạt động"], prior_year) if prior_year else None,
        ),
        score_fn=_score_revenue_growth,
        comment_up="Tăng trưởng doanh thu/thu nhập cải thiện so với giai đoạn trước.",
        comment_down="Tăng trưởng doanh thu/thu nhập suy giảm, cần theo dõi hoạt động kinh doanh cốt lõi.",
        comment_stable="Tăng trưởng doanh thu/thu nhập tương đối ổn định.",
    )

    total_score = int(sum(metric["score"] for metric in metrics_health.values()))
    level = _health_level(total_score)

    # Lấy nhận xét từ insight.py (AI hoặc Fallback)
    ai_insights = generate_ai_insight(
        str(financial_data.get("symbol", "")),
        kpi_res
    )

    formatted_insights = _build_insights_structure(ai_insights, metrics_health, total_score, level)

    # Chuyển đổi raw_groups thành mảng MetricGroup cho Frontend
    all_years = sorted({str(c) for c in balance_sheet.columns if str(c).isdigit()}, reverse=True)
    groups_list = _build_groups_list(raw_groups, income, balance_sheet, cash_flow, current_year, previous_year, prior_year, all_years)

    return {
        "symbol": str(financial_data.get("symbol", "")).upper(),
        "companyName": str(financial_data.get("symbol", "")).upper(),
        "periods": {"current": current_year, "previous": previous_year, "years": all_years},
        "financialHealth": {
            "score": total_score,
            "maxScore": 100,
            "level": level,
            "summary": f"Sức khỏe tài chính được xếp loại {level} với tổng điểm {total_score}/100 dựa trên bộ chỉ số trọng yếu.",
        },
        "metrics": metrics_health,
        "groups": groups_list,
        "growthChart": kpi_res.get("growth_chart"),
        "insights": formatted_insights,
    }


def _build_groups_list(raw_groups: dict, income: Any, balance_sheet: Any, cash_flow: Any, current_year: str, previous_year: str, prior_year: str | None = None, years: list[str] | None = None) -> list[dict]:
    """Chuyển đổi dict 6 nhóm từ kpi.py thành mảng MetricGroup chuẩn cho Frontend."""

    groups_result = []
    target_years = years if years else ([current_year, previous_year] + ([prior_year] if prior_year else []))

    # Map nhãn và đơn vị
    LABELS_MAP = {
        "revenue": ("Doanh thu thuần", "VND"),
        "gross_profit": ("Lợi nhuận gộp", "VND"),
        "net_profit": ("Lợi nhuận sau thuế", "VND"),
        "operating_cashflow": ("Dòng tiền từ HĐKD", "VND"),
        "total_assets": ("Tổng tài sản", "VND"),
        "total_equity": ("Vốn chủ sở hữu", "VND"),
        "total_liabilities": ("Nợ phải trả", "VND"),
        "current_assets": ("Tài sản ngắn hạn", "VND"),
        "gross_margin": ("Biên lợi nhuận gộp (Gross Margin)", "%"),
        "net_margin": ("Biên lợi nhuận ròng (Net Margin)", "%"),
        "roe": ("ROE", "%"),
        "roa": ("ROA", "%"),
        "operating_margin": ("Biên HĐKD (Operating Margin)", "%"),
        "ebit_margin": ("Biên EBIT (EBIT Margin)", "%"),
        "ebitda_margin": ("Biên EBITDA (EBITDA Margin)", "%"),
        "de_ratio": ("Tỷ lệ Nợ/Vốn CSH (Debt / Equity)", "lần"),
        "debt_ratio": ("Tỷ lệ Nợ/Tổng tài sản (Debt Ratio)", "%"),
        "equity_ratio": ("Tỷ lệ Tự chủ tài chính (Equity Ratio)", "%"),
        "current_ratio": ("Tỷ lệ Thanh toán hiện hành (Current Ratio)", "lần"),
        "quick_ratio": ("Tỷ lệ Thanh toán nhanh (Quick Ratio)", "lần"),
        "cash_ratio": ("Tỷ lệ Thanh toán tiền mặt (Cash Ratio)", "lần"),
        "asset_turnover": ("Vòng quay tổng tài sản (Asset Turnover)", "lần"),
        "inventory_turnover": ("Vòng quay hàng tồn kho (Inventory Turnover)", "lần"),
        "receivable_turnover": ("Vòng quay khoản phải thu (Receivable Turnover)", "lần"),
        "revenue_growth": ("Tăng trưởng doanh thu", "%"),
        "profit_growth": ("Tăng trưởng lợi nhuận", "%"),
        "asset_growth": ("Tăng trưởng tổng tài sản", "%"),
        "equity_growth": ("Tăng trưởng vốn chủ", "%"),
    }

    group_idx = 1
    for title, metrics_dict in raw_groups.items():
        metrics_array = []
        for key, curr_val in metrics_dict.items():
            label, unit = LABELS_MAP.get(key, (key, ""))
            
            # Tính giá trị kỳ trước tương ứng nếu có
            prev_val = _get_previous_val(key, income, balance_sheet, cash_flow, previous_year, prior_year)

            # Tính giá trị cho tất cả các năm
            yearly_values = {}
            for yr in target_years:
                val = _get_previous_val(key, income, balance_sheet, cash_flow, yr, prior_year)
                yearly_values[yr] = val if val is not None else (curr_val if yr == current_year else None)
            
            change = round(curr_val - prev_val, 2) if (curr_val is not None and prev_val is not None) else None
            change_percent = _growth(curr_val, prev_val) if (curr_val is not None and prev_val is not None) else None
            trend_val = _trend(change_percent)

            metrics_array.append({
                "label": label,
                "unit": unit,
                "current": curr_val,
                "previous": prev_val,
                "change": change,
                "changePercent": change_percent,
                "trend": trend_val,
                "score": 15 if curr_val and curr_val > 0 else 10,
                "maxScore": 20,
                "comment": f"{label} đạt {curr_val} {unit} trong kỳ." if curr_val is not None else "Chưa có đủ dữ liệu."
            })

        groups_result.append({
            "title": f"{group_idx}. {title}",
            "metrics": metrics_array
        })
        group_idx += 1

    return groups_result


def _get_previous_val(key: str, income: Any, bs: Any, cashflow: Any, prev_year: str, prior_year: str | None = None) -> float | None:
    """Lấy giá trị năm ngoái cho từng chỉ số - ĐẦY ĐỦ 28 chỉ số."""
    if not prev_year:
        return None

    # --- Nhóm 1: Quy mô doanh nghiệp (trực tiếp từ báo cáo) ---
    if key == "revenue":
        return _value(income, ["Doanh thu thuần", "Doanh thu bán hàng và cung cấp dịch vụ"], prev_year)
    if key == "gross_profit":
        return _value(income, ["Lợi nhuận gộp"], prev_year)
    if key == "net_profit":
        return _value(income, ["Lợi nhuận sau thuế", "Lợi nhuận sau thuế thu nhập doanh nghiệp"], prev_year)
    if key == "operating_cashflow":
        return _value(cashflow, ["Dòng tiền HĐKD", "Lưu chuyển tiền thuần từ hoạt động kinh doanh"], prev_year)
    if key == "total_assets":
        return _value(bs, ["Tổng tài sản", "TỔNG CỘNG TÀI SẢN"], prev_year)
    if key == "total_equity":
        return _value(bs, ["Vốn chủ sở hữu"], prev_year)
    if key == "total_liabilities":
        return _value(bs, ["Nợ phải trả"], prev_year)
    if key == "current_assets":
        return _value(bs, ["Tài sản ngắn hạn"], prev_year)

    # --- Lấy các giá trị gốc kỳ trước để tính ratios ---
    rev = _value(income, ["Doanh thu thuần", "Doanh thu bán hàng và cung cấp dịch vụ"], prev_year)
    np_val = _value(income, ["Lợi nhuận sau thuế", "Lợi nhuận sau thuế thu nhập doanh nghiệp"], prev_year)
    gp = _value(income, ["Lợi nhuận gộp"], prev_year)
    ta = _value(bs, ["Tổng tài sản", "TỔNG CỘNG TÀI SẢN"], prev_year)
    eq = _value(bs, ["Vốn chủ sở hữu"], prev_year)
    liab = _value(bs, ["Nợ phải trả"], prev_year)
    ca = _value(bs, ["Tài sản ngắn hạn"], prev_year)
    cl = _value(bs, ["Nợ ngắn hạn", "Tổng nợ ngắn hạn"], prev_year)
    if not cl and liab:
        cl = liab

    op_profit = _value(income, ["Lãi/(lỗ) từ hoạt động kinh doanh", "Lợi nhuận thuần từ hoạt động kinh doanh"], prev_year)
    ebt = _value(income, ["Lãi/(lỗ) trước thuế", "Lợi nhuận trước thuế"], prev_year)
    interest_exp = _value(income, ["Chi phí lãi vay"], prev_year)
    depreciation = _value(cashflow, ["Khấu hao TSCĐ và BĐSĐT", "Khấu hao TSCĐ"], prev_year)
    inventory = _value(bs, ["Hàng tồn kho", "Hàng tồn kho, ròng"], prev_year)
    receivables = _value(bs, ["Các khoản phải thu", "Phải thu khách hàng", "Phải thu ngắn hạn"], prev_year)
    cash_equiv = (_value(bs, ["Tiền và tương đương tiền", "Tiền"], prev_year) or 0) + (_value(bs, ["Đầu tư ngắn hạn", "Đầu tư tài chính ngắn hạn"], prev_year) or 0)
    cogs = _value(income, ["Giá vốn", "Giá vốn hàng bán"], prev_year)

    # --- Nhóm 2: Khả năng sinh lời ---
    if key == "gross_margin":
        return _safe_divide(gp, rev, percent=True)
    if key == "net_margin":
        return _safe_divide(np_val, rev, percent=True)
    if key == "roe":
        return _safe_divide(np_val, eq, percent=True)
    if key == "roa":
        return _safe_divide(np_val, ta, percent=True)
    if key == "operating_margin":
        return _safe_divide(op_profit, rev, percent=True)
    if key == "ebit_margin":
        ebit_prev = (ebt or 0) + (interest_exp or 0) if (ebt is not None or interest_exp is not None) else op_profit
        return _safe_divide(ebit_prev, rev, percent=True)
    if key == "ebitda_margin":
        ebit_prev = (ebt or 0) + (interest_exp or 0) if (ebt is not None or interest_exp is not None) else op_profit
        ebitda_prev = (ebit_prev or 0) + (depreciation or 0)
        return _safe_divide(ebitda_prev, rev, percent=True)

    # --- Nhóm 3: Đòn bẩy tài chính ---
    if key == "de_ratio":
        return _safe_divide(liab, eq)
    if key == "debt_ratio":
        return _safe_divide(liab, ta, percent=True)
    if key == "equity_ratio":
        return _safe_divide(eq, ta, percent=True)

    # --- Nhóm 4: Thanh khoản ---
    if key == "current_ratio":
        return _safe_divide(ca, cl)
    if key == "quick_ratio":
        if ca is not None and cl:
            return round((ca - (inventory or 0)) / cl, 2)
        return None
    if key == "cash_ratio":
        if cash_equiv is not None and cl:
            return round(cash_equiv / cl, 2)
        return None

    # --- Nhóm 5: Hiệu quả sử dụng tài sản ---
    if key == "asset_turnover":
        return _safe_divide(rev, ta)
    if key == "inventory_turnover":
        return _safe_divide(cogs, inventory) if cogs and inventory else _safe_divide(rev, inventory)
    if key == "receivable_turnover":
        return _safe_divide(rev, receivables)

    # --- Nhóm 6: Tăng trưởng YoY ---
    # Tăng trưởng kỳ trước = (giá trị kỳ trước - giá trị kỳ trước nữa) / |giá trị kỳ trước nữa|
    if key in ("revenue_growth", "profit_growth", "asset_growth", "equity_growth"):
        if not prior_year:
            return None
        if key == "revenue_growth":
            prev_rev = rev
            prior_rev = _value(income, ["Doanh thu thuần", "Doanh thu bán hàng và cung cấp dịch vụ"], prior_year)
            return _growth(prev_rev, prior_rev)
        if key == "profit_growth":
            prev_np = np_val
            prior_np = _value(income, ["Lợi nhuận sau thuế", "Lợi nhuận sau thuế thu nhập doanh nghiệp"], prior_year)
            return _growth(prev_np, prior_np)
        if key == "asset_growth":
            prev_ta = ta
            prior_ta = _value(bs, ["Tổng tài sản", "TỔNG CỘNG TÀI SẢN"], prior_year)
            return _growth(prev_ta, prior_ta)
        if key == "equity_growth":
            prev_eq = eq
            prior_eq = _value(bs, ["Vốn chủ sở hữu"], prior_year)
            return _growth(prev_eq, prior_eq)

    return None

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


def _score_roe_bank(current: float | None, _: float | None) -> int:
    if current is None:
        return 0
    if current >= 18:
        return 20
    if current >= 14:
        return 16
    if current >= 10:
        return 12
    if current >= 6:
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


def _score_roa_bank(current: float | None, _: float | None) -> int:
    if current is None:
        return 0
    if current >= 1.8:
        return 20
    if current >= 1.4:
        return 16
    if current >= 1.0:
        return 12
    if current >= 0.5:
        return 8
    return 4


def _score_equity_to_assets(current: float | None, _: float | None) -> int:
    if current is None:
        return 0
    if current >= 12:
        return 20
    if current >= 9:
        return 16
    if current >= 7:
        return 12
    if current >= 5:
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


def _build_insights_structure(ai_insights: list[str], metrics: dict[str, Metric], total_score: int, level: str) -> dict[str, Any]:
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
        "summary": ai_insights[0] if ai_insights else f"Sức khỏe tài chính ở mức {level}.",
        "strengths": strengths or ["Các chỉ số chính duy trì ở mức khá."],
        "weaknesses": weaknesses,
        "risks": risks,
        "watchItems": ai_insights,
        "overallConclusion": (
            f"Kết luận tổng quan: Sức khỏe tài chính xếp loại {level} ({total_score}/100 điểm). "
            "Đây là phân tích dữ liệu tài chính tự động, không phải khuyến nghị đầu tư."
        ),
    }
