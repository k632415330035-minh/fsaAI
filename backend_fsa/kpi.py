# kpi.py

import pandas as pd


def _get_val(df: pd.DataFrame, item_name: str | list[str], year: str, default=0.0) -> float:
    """
    Lấy giá trị từ DataFrame an toàn.
    Hỗ trợ tìm kiếm theo chuỗi hoặc danh sách các tên gọi thay thế (fallback).
    """
    try:
        if df is None or df.empty or not year or year not in df.columns:
            return default

        items = [item_name] if isinstance(item_name, str) else item_name
        for item in items:
            if item in df.index:
                value = df.loc[item, year]
                if pd.notna(value):
                    return float(value)

    except Exception:
        pass

    return default


def calculate_kpi(financial_data: dict) -> dict:
    """
    Tính toán và phân nhóm các KPI tài chính từ dữ liệu đã chuẩn hóa.

    Input:
        financial_data = {
            "balance_sheet": pd.DataFrame,
            "income_statement": pd.DataFrame,
            "cash_flow": pd.DataFrame,
            "financial_ratio": pd.DataFrame (tùy chọn)
        }

    Output:
        {
            "latest_year": str,
            "previous_year": str,
            "groups": dict,    # 6 nhóm chỉ số phân loại chi tiết
            "metrics": dict,   # Tương thích ngược với hệ thống cũ
            "ratios": dict     # Tương thích ngược với hệ thống cũ
        }
    """

    bs = financial_data.get("balance_sheet")
    income = financial_data.get("income_statement")
    cashflow = financial_data.get("cash_flow")

    if bs is None or bs.empty or income is None or income.empty:
        return {"error": "Thiếu dữ liệu báo cáo tài chính."}

    # ==========================
    # Xác định các năm
    # ==========================
    years = [str(col) for col in bs.columns]
    latest_year = years[0]
    previous_year = years[1] if len(years) > 1 else None

    # ==========================
    # 1. QUY MÔ DOANH NGHIỆP (Scale Metrics)
    # ==========================

    # Income Statement
    revenue = _get_val(income, ["Doanh thu thuần", "Thu nhập lãi thuần", "DOANH THU HOẠT ĐỘNG", "Thu nhập lãi và các khoản thu nhập tương tự", "Tổng thu nhập hoạt động", "Doanh thu bán hàng và cung cấp dịch vụ"], latest_year)
    gross_profit = _get_val(income, ["Lợi nhuận gộp", "LỢI NHUẬN GỘP", "Lãi/Lỗ thuần từ hoạt động dịch vụ"], latest_year)
    net_profit = _get_val(income, ["Lợi nhuận sau thuế", "Cổ đông của Công ty mẹ", "LỢI NHUẬN KẾ TOÁN SAU THUẾ", "Lợi nhuận sau thuế phân bổ cho chủ sở hữu", "Lợi nhuận sau thuế thu nhập doanh nghiệp"], latest_year)
    cogs = _get_val(income, ["Giá vốn", "Giá vốn hàng bán", "CHI PHÍ HOẠT ĐỘNG", "Chi phí lãi và các chi phí tương tự"], latest_year)
    operating_profit = _get_val(income, ["Lãi/(lỗ) từ hoạt động kinh doanh", "Lợi nhuận thuần từ hoạt động kinh doanh", "Lợi nhuận thuần hoạt động trước khi trích lập dự phòng tổn thất tín dụng", "KẾT QUẢ HOẠT ĐỘNG"], latest_year)
    ebt = _get_val(income, ["Lãi/(lỗ) trước thuế", "Lợi nhuận trước thuế", "Tổng lợi nhuận/lỗ trước thuế", "LỢI NHUẬN TRƯỚC THUẾ"], latest_year)
    interest_expense = _get_val(income, ["Chi phí lãi vay", "Chi phí lãi và các chi phí tương tự"], latest_year)

    if not gross_profit and net_profit:
        gross_profit = net_profit

    # Balance Sheet
    total_assets = _get_val(bs, ["Tổng tài sản", "TỔNG CỘNG TÀI SẢN", "TỔNG TÀI SẢN", "Tổng tài sản có"], latest_year)
    total_equity = _get_val(bs, ["Vốn chủ sở hữu", "VỐN CHỦ SỞ HỮU", "Vốn chủ sở hữu của Ngân hàng"], latest_year)
    total_liabilities = _get_val(bs, ["Nợ phải trả", "NỢ PHẢI TRẢ", "TỔNG NỢ PHẢI TRẢ"], latest_year)
    current_assets = _get_val(bs, ["Tài sản ngắn hạn", "TÀI SẢN NGẮN HẠN"], latest_year)
    current_liabilities = _get_val(bs, ["Nợ ngắn hạn", "Tổng nợ ngắn hạn", "NỢ NGẮN HẠN"], latest_year)

    if not current_assets and total_assets:
        current_assets = total_assets
    if not current_liabilities and total_liabilities:
        current_liabilities = total_liabilities

    inventory = _get_val(bs, ["Hàng tồn kho", "Hàng tồn kho, ròng"], latest_year)
    receivables = _get_val(bs, ["Các khoản phải thu", "Phải thu khách hàng", "Phải thu ngắn hạn", "Tổng các khoản phải thu"], latest_year)
    cash_equiv = _get_val(bs, ["Tiền và tương đương tiền", "Tiền và tương đương tiền", "Tiền"], latest_year) + _get_val(bs, ["Đầu tư ngắn hạn", "Đầu tư tài chính ngắn hạn", "Các tài sản tài chính ghi nhận thông qua lãi lỗ (FVTPL)"], latest_year)

    # Cash Flow
    operating_cashflow = 0.0
    depreciation = 0.0
    if cashflow is not None and not cashflow.empty:
        operating_cashflow = _get_val(cashflow, ["Dòng tiền HĐKD", "Lưu chuyển tiền thuần từ hoạt động kinh doanh", "Lưu chuyển tiền thuần từ các hoạt động sản xuất kinh doanh", "Lưu chuyển tiền thuần từ hoạt động kinh doanh trước những thay đổi về tài sản và vốn lưu động", "Lợi nhuận từ hoạt động kinh doanh trước thay đổi vốn lưu động"], latest_year)
        depreciation = _get_val(cashflow, ["Khấu hao TSCĐ và BĐSĐT", "Khấu hao TSCĐ"], latest_year)

    scale_metrics = {
        "revenue": revenue,
        "gross_profit": gross_profit,
        "net_profit": net_profit,
        "operating_cashflow": operating_cashflow,
        "total_assets": total_assets,
        "total_equity": total_equity,
        "total_liabilities": total_liabilities,
        "current_assets": current_assets,
    }

    # ==========================
    # 2. KHẢ NĂNG SINH LỜI (Profitability Ratios)
    # ==========================

    gross_margin = (gross_profit / revenue * 100) if revenue else 0.0
    net_margin = (net_profit / revenue * 100) if revenue else 0.0
    roe = (net_profit / total_equity * 100) if total_equity else 0.0
    roa = (net_profit / total_assets * 100) if total_assets else 0.0

    operating_margin = (operating_profit / revenue * 100) if revenue else 0.0

    ebit = ebt + interest_expense if (ebt or interest_expense) else operating_profit
    ebit_margin = (ebit / revenue * 100) if revenue else 0.0

    ebitda = ebit + depreciation
    ebitda_margin = (ebitda / revenue * 100) if revenue else 0.0

    profitability_ratios = {
        "gross_margin": round(gross_margin, 2),
        "net_margin": round(net_margin, 2),
        "roe": round(roe, 2),
        "roa": round(roa, 2),
        "operating_margin": round(operating_margin, 2),
        "ebit_margin": round(ebit_margin, 2),
        "ebitda_margin": round(ebitda_margin, 2),
    }

    # ==========================
    # 3. ĐÒN BẨY TÀI CHÍNH (Financial Leverage Ratios)
    # ==========================

    de_ratio = (total_liabilities / total_equity) if total_equity else 0.0
    debt_ratio = (total_liabilities / total_assets * 100) if total_assets else 0.0
    equity_ratio = (total_equity / total_assets * 100) if total_assets else 0.0

    leverage_ratios = {
        "de_ratio": round(de_ratio, 2),
        "debt_ratio": round(debt_ratio, 2),
        "equity_ratio": round(equity_ratio, 2),
    }

    # ==========================
    # 4. THANH KHOẢN (Liquidity Ratios)
    # ==========================

    current_ratio = (current_assets / current_liabilities) if current_liabilities else 0.0
    quick_ratio = ((current_assets - inventory) / current_liabilities) if current_liabilities else 0.0
    cash_ratio = (cash_equiv / current_liabilities) if current_liabilities else 0.0

    liquidity_ratios = {
        "current_ratio": round(current_ratio, 2),
        "quick_ratio": round(quick_ratio, 2),
        "cash_ratio": round(cash_ratio, 2),
    }

    # ==========================
    # 5. HIỆU QUẢ SỬ DỤNG TÀI SẢN (Asset Efficiency / Activity Ratios)
    # ==========================

    asset_turnover = (revenue / total_assets) if total_assets else 0.0
    inventory_turnover = (cogs / inventory) if inventory else (revenue / inventory if inventory else 0.0)
    receivable_turnover = (revenue / receivables) if receivables else 0.0

    efficiency_ratios = {
        "asset_turnover": round(asset_turnover, 2),
        "inventory_turnover": round(inventory_turnover, 2),
        "receivable_turnover": round(receivable_turnover, 2),
    }

    # ==========================
    # 6. TĂNG TRƯỞNG (Growth Ratios - YoY)
    # ==========================

    revenue_growth = 0.0
    profit_growth = 0.0
    asset_growth = 0.0
    equity_growth = 0.0

    if previous_year:
        prev_revenue = _get_val(income, ["Doanh thu thuần", "Doanh thu bán hàng và cung cấp dịch vụ"], previous_year)
        prev_net_profit = _get_val(income, ["Lợi nhuận sau thuế", "Lợi nhuận sau thuế thu nhập doanh nghiệp"], previous_year)
        prev_total_assets = _get_val(bs, ["Tổng tài sản", "TỔNG CỘNG TÀI SẢN"], previous_year)
        prev_total_equity = _get_val(bs, "Vốn chủ sở hữu", previous_year)

        if prev_revenue:
            revenue_growth = ((revenue - prev_revenue) / abs(prev_revenue)) * 100
        if prev_net_profit:
            profit_growth = ((net_profit - prev_net_profit) / abs(prev_net_profit)) * 100
        if prev_total_assets:
            asset_growth = ((total_assets - prev_total_assets) / abs(prev_total_assets)) * 100
        if prev_total_equity:
            equity_growth = ((total_equity - prev_total_equity) / abs(prev_total_equity)) * 100

    growth_ratios = {
        "revenue_growth": round(revenue_growth, 2),
        "profit_growth": round(profit_growth, 2),
        "asset_growth": round(asset_growth, 2),
        "equity_growth": round(equity_growth, 2),
    }

    # ==========================
    # BIỂU ĐỒ TĂNG TRƯỞNG MULTI-LINE CHART (TÍNH THEO CÁC NĂM CÓ TỐC ĐỘ YoY)
    # ==========================
    chronological_years = sorted({str(c) for c in bs.columns if str(c).isdigit()})
    growth_years = chronological_years[1:] if len(chronological_years) > 1 else chronological_years

    rev_series = []
    profit_series = []
    asset_series = []
    equity_series = []

    for i in range(1, len(chronological_years)):
        y_curr = chronological_years[i]
        y_prev = chronological_years[i - 1]

        r_c = _get_val(income, ["Doanh thu thuần", "Thu nhập lãi thuần", "DOANH THU HOẠT ĐỘNG", "Thu nhập lãi và các khoản thu nhập tương tự", "Tổng thu nhập hoạt động", "Doanh thu bán hàng và cung cấp dịch vụ"], y_curr)
        r_p = _get_val(income, ["Doanh thu thuần", "Thu nhập lãi thuần", "DOANH THU HOẠT ĐỘNG", "Thu nhập lãi và các khoản thu nhập tương tự", "Tổng thu nhập hoạt động", "Doanh thu bán hàng và cung cấp dịch vụ"], y_prev)
        rev_series.append(round(((r_c - r_p) / abs(r_p) * 100), 2) if r_p else 0.0)

        p_c = _get_val(income, ["Lợi nhuận sau thuế", "Cổ đông của Công ty mẹ", "LỢI NHUẬN KẾ TOÁN SAU THUẾ", "Lợi nhuận sau thuế phân bổ cho chủ sở hữu", "Lợi nhuận sau thuế thu nhập doanh nghiệp"], y_curr)
        p_p = _get_val(income, ["Lợi nhuận sau thuế", "Cổ đông của Công ty mẹ", "LỢI NHUẬN KẾ TOÁN SAU THUẾ", "Lợi nhuận sau thuế phân bổ cho chủ sở hữu", "Lợi nhuận sau thuế thu nhập doanh nghiệp"], y_prev)
        profit_series.append(round(((p_c - p_p) / abs(p_p) * 100), 2) if p_p else 0.0)

        a_c = _get_val(bs, ["Tổng tài sản", "TỔNG CỘNG TÀI SẢN", "TỔNG TÀI SẢN", "Tổng tài sản có"], y_curr)
        a_p = _get_val(bs, ["Tổng tài sản", "TỔNG CỘNG TÀI SẢN", "TỔNG TÀI SẢN", "Tổng tài sản có"], y_prev)
        asset_series.append(round(((a_c - a_p) / abs(a_p) * 100), 2) if a_p else 0.0)

        e_c = _get_val(bs, ["Vốn chủ sở hữu", "VỐN CHỦ SỞ HỮU", "Vốn chủ sở hữu của Ngân hàng"], y_curr)
        e_p = _get_val(bs, ["Vốn chủ sở hữu", "VỐN CHỦ SỞ HỮU", "Vốn chủ sở hữu của Ngân hàng"], y_prev)
        equity_series.append(round(((e_c - e_p) / abs(e_p) * 100), 2) if e_p else 0.0)

    if len(growth_years) > 0 and len(growth_years) < 4:
        first_year = growth_years[0]
        if first_year.isdigit():
            pad_count = 4 - len(growth_years)
            pad_years = [str(int(first_year) - i) for i in range(pad_count, 0, -1)]
            growth_years = pad_years + growth_years
            
            if rev_series:
                rev_series = [rev_series[0]] * pad_count + rev_series
            if profit_series:
                profit_series = [profit_series[0]] * pad_count + profit_series
            if asset_series:
                asset_series = [asset_series[0]] * pad_count + asset_series
            if equity_series:
                equity_series = [equity_series[0]] * pad_count + equity_series

    growth_chart = {
        "years": growth_years,
        "series": {
            "revenue_growth": rev_series,
            "profit_growth": profit_series,
            "asset_growth": asset_series,
            "equity_growth": equity_series,
        },
    }

    # ==========================
    # TỔNG HỢP KẾT QUẢ
    # ==========================

    groups = {
        "Quy mô doanh nghiệp": scale_metrics,
        "Khả năng sinh lời": profitability_ratios,
        "Đòn bẩy tài chính": leverage_ratios,
        "Thanh khoản": liquidity_ratios,
        "Hiệu quả sử dụng tài sản": efficiency_ratios,
        "Tăng trưởng": growth_ratios,
    }

    # Phẳng hóa tất cả ratios phục vụ cho việc tương thích ngược
    all_ratios = {}
    all_ratios.update(profitability_ratios)
    all_ratios.update(leverage_ratios)
    all_ratios.update(liquidity_ratios)
    all_ratios.update(efficiency_ratios)
    all_ratios.update(growth_ratios)

    return {
        "latest_year": latest_year,
        "previous_year": previous_year,
        "groups": groups,
        "metrics": scale_metrics,
        "ratios": all_ratios,
        "growth_chart": growth_chart,
    }


if __name__ == "__main__":
    from financials import FinancialData

    financial = FinancialData("VNM")
    data = financial.get_all()
    result = calculate_kpi(data)

    from pprint import pprint

    print("=== KPI RESULT WITH GROUPS ===")
    pprint(result)
