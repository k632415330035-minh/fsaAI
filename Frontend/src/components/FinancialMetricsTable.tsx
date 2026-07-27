import type { FinancialAnalysisResult, FinancialMetric, FinancialMetricKey } from "../types/financial";
import { formatMetric, translateTrend } from "../utils/format";

const metricOrder: FinancialMetricKey[] = ["roe", "roa", "currentRatio", "operatingCashFlow", "revenueGrowth"];

interface FinancialMetricsTableProps {
  analysis: FinancialAnalysisResult;
}

export default function FinancialMetricsTable({ analysis }: FinancialMetricsTableProps) {
  const { current, previous } = analysis.periods;

  return (
    <section className="panel table-panel">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">So sánh 2 năm</p>
          <h2>Chỉ số tài chính trọng yếu</h2>
        </div>
      </div>

      <div className="metric-chart-grid">
        {metricOrder.map((key) => (
          <MetricBars key={key} metric={analysis.metrics[key]} />
        ))}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Chỉ số</th>
              <th>{current}</th>
              <th>{previous}</th>
              <th>Thay đổi</th>
              <th>% thay đổi</th>
              <th>Điểm</th>
              <th>Xu hướng</th>
              <th>Nhận xét</th>
            </tr>
          </thead>
          <tbody>
            {metricOrder.map((key) => {
              const metric = analysis.metrics[key];
              return (
                <tr key={key}>
                  <td>{metric.label}</td>
                  <td>{formatMetric(metric.current, metric.unit)}</td>
                  <td>{formatMetric(metric.previous, metric.unit)}</td>
                  <td>{formatMetric(metric.change, metric.unit)}</td>
                  <td>{formatMetric(metric.changePercent, "%")}</td>
                  <td>{metric.score}/{metric.maxScore}</td>
                  <td><span className={`trend ${metric.trend}`}>{translateTrend(metric.trend)}</span></td>
                  <td>{metric.comment}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MetricBars({ metric }: { metric: FinancialMetric }) {
  const current = Math.abs(metric.current ?? 0);
  const previous = Math.abs(metric.previous ?? 0);
  const max = Math.max(current, previous, 1);

  return (
    <article className="metric-mini-chart">
      <div>
        <strong>{metric.label}</strong>
        <span className={`trend ${metric.trend}`}>{translateTrend(metric.trend)}</span>
      </div>
      <div className="mini-bars">
        <span style={{ width: `${(previous / max) * 100}%` }} />
        <span className="current" style={{ width: `${(current / max) * 100}%` }} />
      </div>
    </article>
  );
}
