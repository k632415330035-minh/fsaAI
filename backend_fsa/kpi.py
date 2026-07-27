# kpi.py

import pandas as pd


def _get_val(df: pd.DataFrame, item_name: str, year: str, default=0.0):
    """
    Lấy giá trị từ DataFrame an toàn.
    """
    try:
        if (
            df is not None
            and item_name in df.index
            and year in df.columns
        ):
            value = df.loc[item_name, year]

            if pd.notna(value):
                return float(value)

    except Exception:
        pass

    return default


def calculate_kpi(financial_data: dict) -> dict:
    """
    Tính các KPI tài chính từ dữ liệu đã chuẩn hóa.

    Input:
        financial_data = {
            balance_sheet,
            income_statement,
            cash_flow,
            financial_ratio
        }

    Output:
        {
            latest_year,
            metrics,
            ratios
        }
    """

    bs = financial_data.get("balance_sheet")
    income = financial_data.get("income_statement")
    cashflow = financial_data.get("cash_flow")

    if (
        bs is None
        or bs.empty
        or income is None
        or income.empty
    ):
        return {
            "error": "Thiếu dữ liệu báo cáo tài chính."
        }

    # ==========================
    # Năm mới nhất
    # ==========================

    latest_year = str(bs.columns[0])

    # ==========================
    # Income Statement
    # ==========================

    revenue = _get_val(
        income,
        "Doanh thu thuần",
        latest_year
    )

    gross_profit = _get_val(
        income,
        "Lợi nhuận gộp",
        latest_year
    )

    net_profit = _get_val(
        income,
        "Lợi nhuận sau thuế",
        latest_year
    )

    # ==========================
    # Balance Sheet
    # ==========================

    total_assets = _get_val(
        bs,
        "Tổng tài sản",
        latest_year
    )

    total_equity = _get_val(
        bs,
        "Vốn chủ sở hữu",
        latest_year
    )

    total_liabilities = _get_val(
        bs,
        "Nợ phải trả",
        latest_year
    )

    current_assets = _get_val(
        bs,
        "Tài sản ngắn hạn",
        latest_year
    )

    current_liabilities = total_liabilities

    # ==========================
    # Cash Flow
    # ==========================

    operating_cashflow = 0

    if cashflow is not None and not cashflow.empty:

        operating_cashflow = _get_val(
            cashflow,
            "Dòng tiền HĐKD",
            latest_year
        )

    # ==========================
    # KPI
    # ==========================

    gross_margin = (
        gross_profit / revenue * 100
        if revenue
        else 0
    )

    net_margin = (
        net_profit / revenue * 100
        if revenue
        else 0
    )

    roa = (
        net_profit / total_assets * 100
        if total_assets
        else 0
    )

    roe = (
        net_profit / total_equity * 100
        if total_equity
        else 0
    )

    # Debt / Equity
    de_ratio = (
        total_liabilities / total_equity
        if total_equity
        else 0
    )

    # Debt / Assets
    debt_ratio = (
        total_liabilities / total_assets * 100
        if total_assets
        else 0
    )

    # Current Ratio
    current_ratio = (
        current_assets / current_liabilities
        if current_liabilities
        else 0
    )

    asset_turnover = (
        revenue / total_assets
        if total_assets
        else 0
    )

    # ==========================
    # Result
    # ==========================

    return {

        "latest_year": latest_year,

        "metrics": {

            "revenue": revenue,

            "gross_profit": gross_profit,

            "net_profit": net_profit,

            "operating_cashflow": operating_cashflow,

            "total_assets": total_assets,

            "total_equity": total_equity,

            "total_liabilities": total_liabilities,

            "current_assets": current_assets

        },

        "ratios": {

            "gross_margin": round(
                gross_margin,
                2
            ),

            "net_margin": round(
                net_margin,
                2
            ),

            "roe": round(
                roe,
                2
            ),

            "roa": round(
                roa,
                2
            ),

            "de_ratio": round(
                de_ratio,
                2
            ),

            "debt_ratio": round(
                debt_ratio,
                2
            ),

            "current_ratio": round(
                current_ratio,
                2
            ),

            "asset_turnover": round(
                asset_turnover,
                2
            )

        }

    }


if __name__ == "__main__":

    from financials import FinancialData

    financial = FinancialData("VNM")

    data = financial.get_all()

    result = calculate_kpi(data)

    from pprint import pprint

    pprint(result)
