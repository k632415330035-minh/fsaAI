import { Activity, ShieldCheck } from "lucide-react";
import type { FinancialAnalysisResult } from "../types/financial";

interface FinancialHealthCardProps {
  analysis: FinancialAnalysisResult;
}

export default function FinancialHealthCard({ analysis }: FinancialHealthCardProps) {
  const { current, previous } = analysis.periods;
  const scorePercent = Math.max(0, Math.min(100, (analysis.financialHealth.score / analysis.financialHealth.maxScore) * 100));

  return (
    <section className="health-summary-grid">
      <article className="panel health-score-card">
        <div>
          <p className="section-kicker">Financial Health</p>
          <h2>{analysis.financialHealth.level}</h2>
          <strong>{analysis.financialHealth.score}/{analysis.financialHealth.maxScore}</strong>
        </div>
        <div className="health-ring" style={{ background: `conic-gradient(#2563EB ${scorePercent}%, #E2E8F0 0)` }}>
          <span>{analysis.financialHealth.score}</span>
        </div>
      </article>

      <article className="panel company-info-card">
        <div className="panel-heading compact-heading">
          <div>
            <p className="section-kicker">Doanh nghiệp</p>
            <h2>{analysis.companyName}</h2>
          </div>
          <ShieldCheck className="blue-icon" />
        </div>
        <div className="company-facts">
          <span><strong>Mã</strong>{analysis.symbol}</span>
          <span><strong>Nguồn</strong>{analysis.dataSource}</span>
          <span><strong>Kỳ so sánh</strong>{previous} - {current}</span>
        </div>
        <p>{analysis.financialHealth.summary}</p>
      </article>

      <article className="panel company-info-card">
        <div className="panel-heading compact-heading">
          <div>
            <p className="section-kicker">Lưu ý</p>
            <h2>Không phải khuyến nghị đầu tư</h2>
          </div>
          <Activity className="blue-icon" />
        </div>
        <p>Hệ thống chỉ cung cấp thông tin phân tích sức khỏe tài chính doanh nghiệp và không phải là khuyến nghị đầu tư.</p>
      </article>
    </section>
  );
}
