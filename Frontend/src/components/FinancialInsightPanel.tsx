import { Bot, CircleAlert, Lightbulb, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import type { FinancialInsights } from "../types/financial";

interface FinancialInsightPanelProps {
  insights: FinancialInsights;
}

export default function FinancialInsightPanel({ insights }: FinancialInsightPanelProps) {
  return (
    <section className="panel ai-panel">
      <div className="panel-heading compact-heading">
        <div>
          <p className="section-kicker">AI Insight</p>
          <h2>Đánh giá bằng tiếng Việt</h2>
        </div>
        <Bot className="blue-icon" />
      </div>

      {insights.summary ? <p className="insight-copy">{insights.summary}</p> : null}
      <InsightGroup icon={<TrendingUp size={18} />} title="Điểm mạnh tài chính" items={insights.strengths} />
      <InsightGroup icon={<CircleAlert size={18} />} title="Điểm yếu hoặc rủi ro" items={[...insights.weaknesses, ...insights.risks]} />
      <InsightGroup icon={<Lightbulb size={18} />} title="Chỉ số cần theo dõi" items={insights.watchItems} />

      <div className="overall-conclusion">
        <strong>Kết luận tổng quan</strong>
        <p>{insights.overallConclusion}</p>
      </div>
    </section>
  );
}

function InsightGroup({ icon, title, items }: { icon: ReactNode; title: string; items: string[] }) {
  return (
    <div className="insight-group">
      <h3>{icon}{title}</h3>
      {items.length > 0 ? (
        <ul>
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p>Không có cảnh báo nổi bật từ bộ chỉ số hiện tại.</p>
      )}
    </div>
  );
}
