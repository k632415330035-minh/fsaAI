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
    revenue = _get_val(income, ["Doanh thu thuần", "Doanh thu bán hàng và cung cấp dịch vụ"], latest_year)
    gross_profit = _get_val(income, "Lợi nhuận gộp", latest_year)
    net_profit = _get_val(income, ["Lợi nhuận sau thuế", "Lợi nhuận sau thuế thu nhập doanh nghiệp"], latest_year)
    cogs = _get_val(income, ["Giá vốn", "Giá vốn hàng bán"], latest_year)
    operating_profit = _get_val(income, ["Lãi/(lỗ) từ hoạt động kinh doanh", "Lợi nhuận thuần từ hoạt động kinh doanh"], latest_year)
    ebt = _get_val(income, ["Lãi/(lỗ) trước thuế", "Lợi nhuận trước thuế"], latest_year)
    interest_expense = _get_val(income, "Chi phí lãi vay", latest_year)

    # Balance Sheet
    total_assets = _get_val(bs, ["Tổng tài sản", "TỔNG CỘNG TÀI SẢN"], latest_year)
    total_equity = _get_val(bs, "Vốn chủ sở hữu", latest_year)
    total_liabilities = _get_val(bs, "Nợ phải trả", latest_year)
    current_assets = _get_val(bs, "Tài sản ngắn hạn", latest_year)
    current_liabilities = _get_val(bs, ["Nợ ngắn hạn", "Tổng nợ ngắn hạn"], latest_year)
    if not current_liabilities and total_liabilities:
        current_liabilities = total_liabilities

    inventory = _get_val(bs, ["Hàng tồn kho", "Hàng tồn kho, ròng"], latest_year)
    receivables = _get_val(bs, ["Các khoản phải thu", "Phải thu khách hàng", "Phải thu ngắn hạn"], latest_year)
    cash_equiv = _get_val(bs, ["Tiền và tương đương tiền", "Tiền"], latest_year) + _get_val(bs, ["Đầu tư ngắn hạn", "Đầu tư tài chính ngắn hạn"], latest_year)

    # Cash Flow
    operating_cashflow = 0.0
    depreciation = 0.0
    if cashflow is not None and not cashflow.empty:
        operating_cashflow = _get_val(cashflow, ["Dòng tiền HĐKD", "Lưu chuyển tiền thuần từ hoạt động kinh doanh"], latest_year)
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
    }


if __name__ == "__main__":
    from financials import FinancialData

    financial = FinancialData("VNM")
    data = financial.get_all()
    result = calculate_kpi(data)

    from pprint import pprint

    print("=== KPI RESULT WITH GROUPS ===")
    pprint(result)
