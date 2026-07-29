import { useState } from "react";
import type { FinancialAnalysisResult, FinancialMetric, MetricGroup } from "../types/financial";
import { formatMetric, translateTrend } from "../utils/format";
import FinancialCharts from "./FinancialCharts";

interface FinancialMetricsTableProps {
  analysis: FinancialAnalysisResult;
}

type ViewMode = "both" | "charts" | "table";

export default function FinancialMetricsTable({ analysis }: FinancialMetricsTableProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const { current, previous } = analysis.periods;
  const groups: MetricGroup[] = analysis.groups && analysis.groups.length > 0
    ? analysis.groups
    : fallbackGroupFromMetrics(analysis);

  return (
    <section className="panel table-panel">
      <div className="panel-heading view-mode-heading">
        <div>
          <p className="section-kicker">Phân tích 6 nhóm ({previous} - {current})</p>
          <h2>Chỉ Số & Biểu Đồ Tài Chính Trực Quan</h2>
        </div>

        {/* Nút chuyển đổi chế độ xem */}
        <div className="view-mode-tabs">
          <button
            className={`tab-btn ${viewMode === "both" ? "active" : ""}`}
            onClick={() => setViewMode("both")}
          >
            🔀 Song song
          </button>
          <button
            className={`tab-btn ${viewMode === "charts" ? "active" : ""}`}
            onClick={() => setViewMode("charts")}
          >
            📊 Biểu đồ
          </button>
          <button
            className={`tab-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
          >
            📋 Bảng số liệu
          </button>
        </div>
      </div>

      {/* HIỂN THỊ BIỂU ĐỒ */}
      {(viewMode === "both" || viewMode === "charts") && (
        <div className="section-block">
          <FinancialCharts analysis={analysis} />
        </div>
      )}

      {/* HIỂN THỊ BẢNG SỐ LIỆU */}
      {(viewMode === "both" || viewMode === "table") && (
        <div className="table-wrap section-block margin-top-md">
          <table className="financial-grouped-table">
            <thead>
              <tr>
                <th>Chỉ số tài chính</th>
                <th>{current}</th>
                <th>{previous}</th>
                <th>Thay đổi</th>
                <th>% Thay đổi</th>
                <th>Điểm số</th>
                <th>Xu hướng</th>
                <th>Đánh giá & Nhận xét</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group, groupIdx) => (
                <GroupSection
                  key={groupIdx}
                  group={group}
                  currentYear={current}
                  previousYear={previous}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function GroupSection({ group }: { group: MetricGroup; currentYear: string; previousYear: string }) {
  return (
    <>
      <tr className="group-header-row">
        <td colSpan={8}>
          <div className="group-header-title">
            <span>{group.title}</span>
            <span className="badge-count">{group.metrics.length} chỉ số</span>
          </div>
        </td>
      </tr>
      {group.metrics.map((metric, idx) => (
        <tr key={idx} className="metric-data-row">
          <td className="font-medium">{metric.label}</td>
          <td className="text-right">{formatMetric(metric.current, metric.unit)}</td>
          <td className="text-right">{formatMetric(metric.previous, metric.unit)}</td>
          <td className="text-right">{formatMetric(metric.change, metric.unit)}</td>
          <td className="text-right">{formatMetric(metric.changePercent, "%")}</td>
          <td className="text-center">{metric.score}/{metric.maxScore}</td>
          <td className="text-center">
            <span className={`trend ${metric.trend}`}>{translateTrend(metric.trend)}</span>
          </td>
          <td className="text-sm">{metric.comment}</td>
        </tr>
      ))}
    </>
  );
}

function fallbackGroupFromMetrics(analysis: FinancialAnalysisResult): MetricGroup[] {
  const metrics = analysis.metrics;
  const list = Object.values(metrics);

  return [
    {
      title: "Chỉ số tài chính tổng hợp",
      metrics: list
    }
  ];
}
