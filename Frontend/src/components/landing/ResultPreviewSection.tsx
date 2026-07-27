import { Bot, Building2 } from "lucide-react";
import { normalizeFinancialAnalysisResponse } from "../../adapters/financialAnalysisAdapter";
import { mockFinancialAnalysisResponse } from "../../mocks/financialAnalysis";
import { formatMetric, translateTrend } from "../../utils/format";
import SectionHeader from "./SectionHeader";

const metricKeys = ["roe", "roa", "currentRatio", "operatingCashFlow", "revenueGrowth"] as const;
const result = normalizeFinancialAnalysisResponse(mockFinancialAnalysisResponse);

export default function ResultPreviewSection() {
  const { current, previous } = result.periods;

  return (
    <section id="preview" className="landing-section bg-white">
      <div className="landing-container">
        <SectionHeader
          eyebrow="Minh họa kết quả"
          title="Một màn hình phân tích rõ ràng từ dữ liệu đã chuẩn hóa"
          description="Dữ liệu bên dưới là mock frontend để minh họa giao diện, chưa gọi API backend thật."
        />
        <div className="landing-preview-shell">
          <div className="landing-preview-header">
            <div>
              <p>{result.symbol}</p>
              <h3>{result.companyName}</h3>
            </div>
            <span><Building2 size={18} /> {previous} - {current}</span>
          </div>

          <div className="landing-preview-grid">
            <article className="landing-health-preview">
              <p>Financial Health</p>
              <strong>{result.financialHealth.score}/{result.financialHealth.maxScore}</strong>
              <span>{result.financialHealth.level}</span>
              <small>{result.financialHealth.summary}</small>
            </article>

            <div className="landing-preview-metrics">
              {metricKeys.map((key) => {
                const metric = result.metrics[key];
                return (
                  <article key={key}>
                    <p>{metric.label}</p>
                    <strong>{formatMetric(metric.current, metric.unit)}</strong>
                    <span className={`trend ${metric.trend}`}>{translateTrend(metric.trend)}</span>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="landing-preview-lower">
            <article className="landing-chart-card">
              <h4>Biểu đồ so sánh 2 năm</h4>
              {metricKeys.map((key) => {
                const metric = result.metrics[key];
                const currentValue = Math.abs(metric.current ?? 0);
                const previousValue = Math.abs(metric.previous ?? 0);
                const max = Math.max(currentValue, previousValue, 1);

                return (
                  <div className="landing-chart-row" key={key}>
                    <span>{metric.label}</span>
                    <div>
                      <i style={{ width: `${(previousValue / max) * 100}%` }} />
                      <i className="current" style={{ width: `${(currentValue / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </article>

            <article className="landing-ai-card">
              <h4><Bot size={20} /> AI Insight</h4>
              <ul>
                {result.insights.strengths.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
              </ul>
              <p>{result.insights.overallConclusion}</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
