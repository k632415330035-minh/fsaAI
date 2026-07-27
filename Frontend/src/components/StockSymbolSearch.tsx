import { FormEvent, useState } from "react";
import { Search } from "lucide-react";

interface StockSymbolSearchProps {
  isLoading: boolean;
  onSubmit: (symbol: string) => void;
}

function normalizeSymbol(value: string) {
  return value.replace(/\s/g, "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export default function StockSymbolSearch({ isLoading, onSubmit }: StockSymbolSearchProps) {
  const [symbol, setSymbol] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedSymbol = normalizeSymbol(symbol);

    if (!normalizedSymbol) {
      setError("Vui lòng nhập mã cổ phiếu.");
      return;
    }

    setError("");
    onSubmit(normalizedSymbol);
  }

  return (
    <form className="stock-search-form panel" onSubmit={handleSubmit} noValidate>
      <label htmlFor="stock-symbol">
        Mã cổ phiếu
        <div className="stock-search-row">
          <input
            id="stock-symbol"
            type="text"
            placeholder="Ví dụ: FPT, HPG, VNM"
            value={symbol}
            onChange={(event) => {
              setSymbol(normalizeSymbol(event.target.value));
              setError("");
            }}
            disabled={isLoading}
            autoComplete="off"
          />
          <button className="primary-action stock-search-button" type="submit" disabled={isLoading}>
            <Search size={18} />
            {isLoading ? "Đang tải" : "Phân tích"}
          </button>
        </div>
      </label>
      <p>Nhập mã cổ phiếu để backend lấy dữ liệu tài chính, tính Financial Health và trả AI Insight theo contract API.</p>
      <small className="form-error">{error}</small>
    </form>
  );
}
