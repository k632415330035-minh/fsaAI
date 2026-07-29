import { Activity, ShieldCheck } from "lucide-react";
import type { FinancialAnalysisResult } from "../types/financial";

interface FinancialHealthCardProps {
  analysis: FinancialAnalysisResult;
}

export default function FinancialHealthCard({ analysis }: FinancialHealthCardProps) {
  const { current, previous } = analysis.periods;
  const score = analysis.financialHealth.score;
  const maxScore = analysis.financialHealth.maxScore;
  const level = analysis.financialHealth.level;

  const levelColor =
    level === "Tốt"
      ? "#10b981"
      : level === "Khá"
      ? "#3b82f6"
      : level === "Trung bình"
      ? "#f59e0b"
      : "#ef4444";

  return (
    <section className="health-summary-grid">
      {/* Card 1: Financial Health Score */}
      <article className="panel health-score-card-simple">
        <p className="section-kicker">Financial Health</p>
        <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: levelColor, lineHeight: 1.2 }}>
          {level}
        </h2>
        <strong style={{ display: "block", color: "#0f1f3d", fontSize: 52, fontWeight: 800, lineHeight: 1, marginTop: 4 }}>
          {score}
          <span style={{ fontSize: 24, fontWeight: 600, color: "#94a3b8" }}>/{maxScore}</span>
        </strong>
      </article>

      {/* Card 2: Company Info */}
      <article className="panel company-info-card">
        <div className="panel-heading compact-heading">
          <div>
            <p className="section-kicker">Doanh nghiệp</p>
            <h2>{analysis.companyName}</h2>
          </div>
          <ShieldCheck className="blue-icon" />
        </div>
        <div className="company-facts">
          <span>
            <strong>Mã</strong>
            {analysis.symbol}
          </span>
          <span>
            <strong>Nguồn</strong>
            {analysis.dataSource}
          </span>
          <span>
            <strong>Kỳ so sánh</strong>
            {previous} - {current}
          </span>
        </div>
        <p>{analysis.financialHealth.summary}</p>
      </article>

      {/* Card 3: Disclaimer */}
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
