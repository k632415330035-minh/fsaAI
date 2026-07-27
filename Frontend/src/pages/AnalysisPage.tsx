import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import FinancialHealthCard from "../components/FinancialHealthCard";
import FinancialInsightPanel from "../components/FinancialInsightPanel";
import FinancialMetricsTable from "../components/FinancialMetricsTable";
import StockSymbolSearch from "../components/StockSymbolSearch";
import { analyzeStock } from "../services/financialAnalysisService";
import type { FinancialAnalysisResult } from "../types/financial";

function normalizeSymbol(value: string) {
  return value.trim().replace(/\s/g, "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export default function AnalysisPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [analysis, setAnalysis] = useState<FinancialAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const symbol = searchParams.get("symbol") ?? "FPT";

  useEffect(() => {
    void loadAnalysis(symbol);
  }, [symbol]);

  async function loadAnalysis(nextSymbol: string) {
    const normalizedSymbol = normalizeSymbol(nextSymbol);

    if (!normalizedSymbol) {
      setErrorMessage("Vui lòng nhập mã cổ phiếu.");
      setAnalysis(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      setAnalysis(await analyzeStock(normalizedSymbol));
    } catch (error) {
      setAnalysis(null);
      setErrorMessage(error instanceof Error ? error.message : "Không thể phân tích mã cổ phiếu này.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(nextSymbol: string) {
    const normalizedSymbol = normalizeSymbol(nextSymbol);
    if (!normalizedSymbol) {
      setErrorMessage("Vui lòng nhập mã cổ phiếu.");
      return;
    }
    setSearchParams({ symbol: normalizedSymbol });
  }

  return (
    <main className="dashboard-page">
      <header className="app-header">
        <Link to="/" className="app-brand" style={{ textDecoration: "none" }}>
          <span className="app-logo">FA</span>
          <strong>Financial Analytics AI</strong>
        </Link>
        <nav className="app-nav" aria-label="Điều hướng chính">
          <Link to="/">Trang chủ</Link>
          <a href="#chi-so">Chỉ số</a>
          <a href="#insight">AI Insight</a>
        </nav>
      </header>

      <section className="dashboard-title-bar">
        <div>
          <p className="section-kicker">Phân tích doanh nghiệp</p>
          <h1>Financial Health theo mã cổ phiếu</h1>
          <span>Frontend gọi FastAPI backend để lấy dữ liệu tài chính, tính KPI và hiển thị kết quả phân tích.</span>
        </div>
      </section>

      <section className="report-workspace">
        <StockSymbolSearch isLoading={isLoading} onSubmit={handleSubmit} />
      </section>

      {isLoading ? (
        <section className="panel loading-analysis">
          <span className="loading-spinner" />
          <div>
            <h2>Đang phân tích {normalizeSymbol(symbol)}...</h2>
            <p>Backend đang lấy dữ liệu tài chính, chuẩn hóa báo cáo và tính các chỉ số trọng yếu.</p>
          </div>
        </section>
      ) : null}

      {errorMessage ? (
        <section className="panel error-panel">
          <p className="section-kicker">Không thể phân tích</p>
          <h2>{normalizeSymbol(symbol) || "Mã cổ phiếu"}</h2>
          <p>{errorMessage}</p>
        </section>
      ) : null}

      {analysis && !isLoading ? (
        <>
          <FinancialHealthCard analysis={analysis} />
          <section id="chi-so">
            <FinancialMetricsTable analysis={analysis} />
          </section>
          <section id="insight" className="dashboard-grid content-grid single-column">
            <FinancialInsightPanel insights={analysis.insights} />
          </section>
        </>
      ) : null}
    </main>
  );
}
