import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import EmptyState from "../components/EmptyState";
import FinancialHealthCard from "../components/FinancialHealthCard";
import FinancialInsightPanel from "../components/FinancialInsightPanel";
import FinancialMetricsTable from "../components/FinancialMetricsTable";
import StockSymbolSearch from "../components/StockSymbolSearch";
import { analyzeStock } from "../services/financialAnalysisService";
import type { FinancialAnalysis } from "../types/financial";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<FinancialAnalysis | null>(null);
  const [lastSymbol, setLastSymbol] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleAnalyze(symbol: string) {
    const normalizedSymbol = symbol.trim().toUpperCase();
    if (!normalizedSymbol) return;

    setLastSymbol(normalizedSymbol);
    setErrorMessage("");
    setIsLoading(true);

    try {
      setAnalysis(await analyzeStock(normalizedSymbol));
    } catch (error) {
      setAnalysis(null);
      setErrorMessage(error instanceof Error ? error.message : "Không thể phân tích mã cổ phiếu này.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("loginUser");
    localStorage.removeItem("loginRole");
    navigate("/");
  }

  const currentUser = localStorage.getItem("loginUser") ?? "Người dùng";

  return (
    <main className="dashboard-page">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-logo">FA</span>
          <strong>Financial Analytics AI</strong>
        </div>
        <nav className="app-nav" aria-label="Điều hướng chính">
          <a href="#phan-tich">Phân tích</a>
          <a href="#chi-so">Chỉ số</a>
          <a href="#insight">AI Insight</a>
        </nav>
        <div className="user-menu">
          <span>{currentUser}</span>
          <button className="icon-action" type="button" onClick={handleLogout} aria-label="Đăng xuất" title="Đăng xuất">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <section className="dashboard-title-bar">
        <div>
          <p className="section-kicker">Phân tích doanh nghiệp</p>
          <h1>Financial Health theo API backend</h1>
          <span>Dashboard gọi FastAPI để lấy dữ liệu tài chính, tính KPI, chấm điểm và trả insight tiếng Việt.</span>
        </div>
      </section>

      <section id="phan-tich" className="report-workspace">
        <StockSymbolSearch isLoading={isLoading} onSubmit={handleAnalyze} />
      </section>

      {isLoading ? (
        <section className="panel loading-analysis">
          <span className="loading-spinner" />
          <div>
            <h2>Đang phân tích {lastSymbol}...</h2>
            <p>Backend đang đọc nguồn dữ liệu tài chính và chuẩn hóa response cho frontend.</p>
          </div>
        </section>
      ) : null}

      {errorMessage ? (
        <section className="panel error-panel">
          <p className="section-kicker">Không thể phân tích</p>
          <h2>{lastSymbol || "Mã cổ phiếu"}</h2>
          <p>{errorMessage}</p>
        </section>
      ) : null}

      {!analysis && !isLoading && !errorMessage ? (
        <EmptyState
          title="Chưa có kết quả phân tích"
          description="Nhập mã cổ phiếu ở phía trên để xem điểm Financial Health, bảng chỉ số và AI Insight từ backend."
        />
      ) : null}

      {analysis ? (
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
