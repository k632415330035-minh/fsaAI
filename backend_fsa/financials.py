from __future__ import annotations

import contextlib
import io
import re

import pandas as pd


STANDARD_NAMES = {
    "TỔNG CỘNG TÀI SẢN": "Tổng tài sản",
    "Tổng cộng tài sản": "Tổng tài sản",
    "TỔNG TÀI SẢN": "Tổng tài sản",
    "Tổng tài sản": "Tổng tài sản",
    "TỔNG CỘNG TÀI SẢN CÓ": "Tổng tài sản",
    "TỔNG TÀI SẢN CÓ": "Tổng tài sản",
    "Tổng tài sản có": "Tổng tài sản",
    "TÀI SẢN NGẮN HẠN": "Tài sản ngắn hạn",
    "Tài sản ngắn hạn": "Tài sản ngắn hạn",
    "NỢ PHẢI TRẢ": "Nợ phải trả",
    "Nợ phải trả": "Nợ phải trả",
    "TỔNG NỢ PHẢI TRẢ": "Nợ phải trả",
    "Tổng nợ phải trả": "Nợ phải trả",
    "Nợ ngắn hạn": "Nợ ngắn hạn",
    "Tổng nợ ngắn hạn": "Nợ ngắn hạn",
    "NỢ NGẮN HẠN": "Nợ ngắn hạn",
    "VỐN CHỦ SỞ HỮU": "Vốn chủ sở hữu",
    "Vốn chủ sở hữu": "Vốn chủ sở hữu",
    "Vốn chủ sở hữu và các quỹ": "Vốn chủ sở hữu",
    "Vốn và các quỹ": "Vốn chủ sở hữu",
    "VỐN VÀ CÁC QUỸ": "Vốn chủ sở hữu",
    "Vốn chủ sở hữu của Ngân hàng": "Vốn chủ sở hữu",
    "Tổng cộng nguồn vốn": "Tổng nguồn vốn",
    "TỔNG CỘNG NGUỒN VỐN": "Tổng nguồn vốn",
    "TỔNG NGUỒN VỐN": "Tổng nguồn vốn",
    "Doanh thu thuần": "Doanh thu thuần",
    "Doanh thu bán hàng và cung cấp dịch vụ": "Doanh thu thuần",
    "DOANH THU HOẠT ĐỘNG": "Doanh thu thuần",
    "Doanh thu thuần về hoạt động kinh doanh": "Doanh thu thuần",
    "Thu nhập lãi và các khoản thu nhập tương tự": "Doanh thu thuần",
    "Thu nhập lãi thuần": "Thu nhập lãi thuần",
    "Lợi nhuận sau thuế thu nhập doanh nghiệp": "Lợi nhuận sau thuế",
    "Lãi/(lỗ) thuần sau thuế": "Lợi nhuận sau thuế",
    "Lợi nhuận của Cổ đông của Công ty mẹ": "Lợi nhuận sau thuế",
    "Cổ đông của Công ty mẹ": "Lợi nhuận sau thuế",
    "Lợi nhuận sau thuế": "Lợi nhuận sau thuế",
    "LỢI NHUẬN KẾ TOÁN SAU THUẾ": "Lợi nhuận sau thuế",
    "Lợi nhuận sau thuế phân bổ cho chủ sở hữu": "Lợi nhuận sau thuế",
    "Lợi nhuận gộp": "Lợi nhuận gộp",
    "LỢI NHUẬN GỘP": "Lợi nhuận gộp",
    "Giá vốn hàng bán": "Giá vốn",
    "CHI PHÍ HOẠT ĐỘNG": "Giá vốn",
    "Lưu chuyển tiền thuần từ hoạt động kinh doanh": "Dòng tiền HĐKD",
    "Lưu chuyển tiền tệ ròng từ các hoạt động sản xuất kinh doanh": "Dòng tiền HĐKD",
    "Lưu chuyển tiền thuần từ các hoạt động sản xuất kinh doanh": "Dòng tiền HĐKD",
    "Lưu chuyển tiền thuần từ hoạt động kinh doanh trước những thay đổi về tài sản và vốn lưu động": "Dòng tiền HĐKD",
    "Lợi nhuận từ hoạt động kinh doanh trước thay đổi vốn lưu động": "Dòng tiền HĐKD",
}


class FinancialData:
    def __init__(self, symbol: str, source: str = "VCI"):
        self.symbol = symbol.strip().upper()
        if not self.symbol:
            raise ValueError("Mã cổ phiếu không được để trống.")

        try:
            from vnstock import Vnstock
        except ImportError as exc:
            raise RuntimeError(
                "Backend chưa cài thư viện vnstock. Hãy chạy: pip install -r backend_fsa/requirements.txt"
            ) from exc

        with _quiet_vendor_output():
            self.stock = Vnstock().stock(symbol=self.symbol, source=source)

    @staticmethod
    def normalize_statement(df: pd.DataFrame) -> pd.DataFrame:
        if df is None or df.empty:
            return pd.DataFrame()

        frame = df.copy()
        if frame.columns[0] != "item":
            frame.rename(columns={frame.columns[0]: "item"}, inplace=True)

        frame.drop(columns=[col for col in ["item_en", "item_id"] if col in frame.columns], inplace=True)
        frame["item"] = frame["item"].astype(str).str.strip().replace(STANDARD_NAMES)
        frame = frame.dropna(subset=["item"]).drop_duplicates(subset="item", keep="first")
        frame.set_index("item", inplace=True)
        frame.columns = [FinancialData._normalize_year(col) for col in frame.columns]
        frame = frame.loc[:, [col for col in frame.columns if col]]
        frame = frame.apply(pd.to_numeric, errors="coerce")
        years = sorted(set(frame.columns), reverse=True)
        return frame.loc[:, years]

    @staticmethod
    def normalize_ratio(df: pd.DataFrame) -> pd.DataFrame:
        if df is None or df.empty:
            return pd.DataFrame()

        frame = df.copy()
        if frame.columns[0] != "item":
            frame.rename(columns={frame.columns[0]: "item"}, inplace=True)

        remove_cols = ["item_en", "item_id", "ratio_id", "ratio_type"]
        frame.drop(columns=[col for col in remove_cols if col in frame.columns], inplace=True)
        frame = frame[~frame["item"].isin(["Năm", "Quý", "Mã TTM", "Loại tỷ lệ"])]
        frame["item"] = frame["item"].astype(str).str.strip()
        frame = frame.dropna(subset=["item"]).drop_duplicates(subset="item", keep="first")
        frame.set_index("item", inplace=True)
        frame.columns = [FinancialData._normalize_year(col) for col in frame.columns]
        frame = frame.loc[:, [col for col in frame.columns if col]]
        return frame.apply(pd.to_numeric, errors="coerce")

    @staticmethod
    def _normalize_year(value: object) -> str:
        text = str(value)
        match = re.search(r"(20\d{2}|19\d{2})", text)
        return match.group(1) if match else text.strip()

    def _fetch_statement(self, statement_type: str) -> pd.DataFrame:
        with _quiet_vendor_output():
            try:
                fn = getattr(self.stock.finance, statement_type)
                df = fn(period="year")
                if df is not None and not df.empty:
                    return self.normalize_statement(df)
            except Exception:
                pass

        # Fallback thử nguồn khác nếu nguồn chính lỗi
        try:
            with _quiet_vendor_output():
                from vnstock import Vnstock
                fallback_source = "TCBS" if getattr(self, "source", "VCI") == "VCI" else "VCI"
                alt_stock = Vnstock().stock(symbol=self.symbol, source=fallback_source)
                fn = getattr(alt_stock.finance, statement_type)
                df = fn(period="year")
                if df is not None and not df.empty:
                    return self.normalize_statement(df)
        except Exception:
            pass

        return pd.DataFrame()

    def get_balance_sheet(self) -> pd.DataFrame:
        return self._fetch_statement("balance_sheet")

    def get_income_statement(self) -> pd.DataFrame:
        return self._fetch_statement("income_statement")

    def get_cash_flow(self) -> pd.DataFrame:
        return self._fetch_statement("cash_flow")

    def get_financial_ratio(self) -> pd.DataFrame:
        with _quiet_vendor_output():
            try:
                return self.normalize_ratio(self.stock.finance.ratio(period="year"))
            except Exception:
                return pd.DataFrame()

    def get_all(self) -> dict:
        return {
            "symbol": self.symbol,
            "balance_sheet": self.get_balance_sheet(),
            "income_statement": self.get_income_statement(),
            "cash_flow": self.get_cash_flow(),
            "financial_ratio": self.get_financial_ratio(),
        }


@contextlib.contextmanager
def _quiet_vendor_output():
    import os
    try:
        with open(os.devnull, "w", encoding="utf-8", errors="replace") as devnull:
            with contextlib.redirect_stdout(devnull), contextlib.redirect_stderr(devnull):
                yield
    except Exception:
        yield

