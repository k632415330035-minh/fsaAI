import { FormEvent, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StockSymbolInputProps {
  compact?: boolean;
}

export default function StockSymbolInput({ compact = false }: StockSymbolInputProps) {
  const navigate = useNavigate();
  const [symbol, setSymbol] = useState("");
  const [error, setError] = useState("");

  function normalizeSymbol(value: string) {
    return value.replace(/\s/g, "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextSymbol = normalizeSymbol(symbol);

    if (!nextSymbol) {
      setError("Vui lòng nhập mã cổ phiếu.");
      return;
    }

    setError("");
    navigate(`/analysis?symbol=${encodeURIComponent(nextSymbol)}`);
  }

  return (
    <form className={compact ? "landing-symbol-form compact" : "landing-symbol-form"} onSubmit={handleSubmit} noValidate>
      <div className="landing-symbol-input-wrap">
        <Search size={18} />
        <input
          aria-label="Nhập mã cổ phiếu"
          placeholder="Nhập mã cổ phiếu, ví dụ: FPT, HPG, VNM"
          value={symbol}
          onChange={(event) => {
            setSymbol(normalizeSymbol(event.target.value));
            setError("");
          }}
          autoComplete="off"
        />
        <button type="submit">
          Phân tích ngay
          <ArrowRight size={18} />
        </button>
      </div>
      <p className="landing-symbol-error">{error}</p>
    </form>
  );
}
