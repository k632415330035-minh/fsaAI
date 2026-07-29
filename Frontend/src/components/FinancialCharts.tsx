import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from "chart.js";
import { Bar, Radar } from "react-chartjs-2";
import type { FinancialAnalysisResult } from "../types/financial";
import { formatMetric } from "../utils/format";

// Đăng ký các thành phần cần thiết của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

interface FinancialChartsProps {
  analysis: FinancialAnalysisResult;
}

export default function FinancialCharts({ analysis }: FinancialChartsProps) {
  const { current, previous } = analysis.periods;
  const groups = analysis.groups ?? [];

  // Tìm nhóm Quy mô doanh nghiệp (Group 1)
  const scaleGroup = groups.find((g) => g.title.includes("Quy mô")) ?? groups[0];
  // Tìm nhóm Khả năng sinh lời (Group 2)
  const profitGroup = groups.find((g) => g.title.includes("sinh lời")) ?? groups[1];
  // Tìm nhóm Đòn bẩy & Thanh khoản (Group 3 & 4)
  const leverageGroup = groups.find((g) => g.title.includes("Đòn bẩy"));
  const liquidityGroup = groups.find((g) => g.title.includes("Thanh khoản"));

  // ==========================
  // 1. DATA BIỂU ĐỒ MẠNG NHỆN (RADAR CHART) - 6 NHÓM
  // ==========================
  const radarLabels = groups.map((g) => g.title.replace(/^\d+\.\s*/, ""));
  const radarScores = groups.map((g) => {
    if (!g.metrics.length) return 50;
    const avg = g.metrics.reduce((acc, m) => acc + (m.score / m.maxScore) * 100, 0) / g.metrics.length;
    return Math.round(avg);
  });

  const radarData = {
    labels: radarLabels.length ? radarLabels : ["Quy mô", "Sinh lời", "Đòn bẩy", "Thanh khoản", "Tài sản", "Tăng trưởng"],
    datasets: [
      {
        label: `Sức mạnh 6 nhóm (${current})`,
        data: radarScores.length ? radarScores : [80, 85, 75, 90, 70, 80],
        backgroundColor: "rgba(59, 130, 246, 0.25)",
        borderColor: "#3b82f6",
        borderWidth: 2,
        pointBackgroundColor: "#2563eb",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "#2563eb",
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: "rgba(226, 232, 240, 0.8)" },
        grid: { color: "rgba(226, 232, 240, 0.8)" },
        pointLabels: {
          color: "#1e293b",
          font: { size: 12, weight: 600 as const },
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: { display: false },
      },
    },
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { font: { size: 12, weight: 600 as const } }
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.raw}/100 điểm`,
        },
      },
    },
  };

  // ==========================
  // 2. DATA BIỂU ĐỒ CỘT SO SÁNH QUY MÔ (SCALE BAR CHART)
  // ==========================
  const scaleMetrics = scaleGroup?.metrics.slice(0, 5) ?? [];
  const scaleBarData = {
    labels: scaleMetrics.map((m) => m.label),
    datasets: [
      {
        label: `Kỳ ${previous}`,
        data: scaleMetrics.map((m) => (m.previous ? m.previous / 1e9 : 0)), // Đơn vị Tỷ VND
        backgroundColor: "rgba(148, 163, 184, 0.7)",
        borderRadius: 6,
      },
      {
        label: `Kỳ ${current}`,
        data: scaleMetrics.map((m) => (m.current ? m.current / 1e9 : 0)), // Đơn vị Tỷ VND
        backgroundColor: "rgba(37, 99, 235, 0.85)",
        borderRadius: 6,
      },
    ],
  };

  const scaleBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${formatMetric(ctx.raw * 1e9, "VND")}`,
        },
      },
    },
    scales: {
      y: {
        title: { display: true, text: "Đơn vị: Tỷ VND", font: { size: 11 } },
        grid: { color: "#f1f5f9" },
      },
      x: { grid: { display: false } },
    },
  };

  // ==========================
  // 3. DATA BIỂU ĐỒ TỶ SUẤT SINH LỜI (PROFITABILITY BAR CHART)
  // ==========================
  const profitMetrics = profitGroup?.metrics ?? [];
  const profitChartData = {
    labels: profitMetrics.map((m) => m.label.replace(/\s*\(.*\)/, "")),
    datasets: [
      {
        label: `Kỳ ${previous} (%)`,
        data: profitMetrics.map((m) => m.previous ?? 0),
        backgroundColor: "rgba(148, 163, 184, 0.75)",
        borderRadius: 6,
      },
      {
        label: `Kỳ ${current} (%)`,
        data: profitMetrics.map((m) => m.current ?? 0),
        backgroundColor: "rgba(16, 185, 129, 0.85)",
        borderRadius: 6,
      },
    ],
  };

  const profitChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.raw}%`,
        },
      },
    },
    scales: {
      y: {
        title: { display: true, text: "Đơn vị: %", font: { size: 11 } },
        grid: { color: "#f1f5f9" },
      },
      x: { grid: { display: false } },
    },
  };

  // ==========================
  // 4. DATA BIỂU ĐỒ THANH KHOẢN & ĐÒN BẨY (SOLVENCY BARS)
  // ==========================
  const solvencyMetrics = [
    ...(liquidityGroup?.metrics ?? []),
    ...(leverageGroup?.metrics ?? []),
  ];

  return (
    <div className="charts-dashboard-grid">
      {/* 1. Radar Chart - Tổng quan 6 nhóm */}
      <div className="chart-card">
        <div className="chart-card-header">
          <div>
            <span className="chart-tag">Tổng quan</span>
            <h3>Độ Cân Bằng 6 Nhóm Chỉ Số</h3>
          </div>
        </div>
        <div className="chart-body radar-wrapper">
          <Radar data={radarData} options={radarOptions} />
        </div>
      </div>

      {/* 2. Scale Bar Chart - So sánh Quy mô */}
      <div className="chart-card">
        <div className="chart-card-header">
          <div>
            <span className="chart-tag">Quy mô</span>
            <h3>So Sánh Quy Mô ({previous} vs {current})</h3>
          </div>
        </div>
        <div className="chart-body">
          <Bar data={scaleBarData} options={scaleBarOptions} />
        </div>
      </div>

      {/* 3. Profitability Chart - Khả năng sinh lời */}
      <div className="chart-card span-full">
        <div className="chart-card-header">
          <div>
            <span className="chart-tag">Sinh lời</span>
            <h3>Tỷ Suất Sinh Lời & Biên Lợi Nhuận ({previous} vs {current})</h3>
          </div>
        </div>
        <div className="chart-body height-lg">
          <Bar data={profitChartData} options={profitChartOptions} />
        </div>
      </div>

      {/* 4. Solvency Progress Bars - Thanh khoản & Đòn bẩy */}
      {solvencyMetrics.length > 0 && (
        <div className="chart-card span-full">
          <div className="chart-card-header">
            <div>
              <span className="chart-tag">Thanh khoản & Đòn bẩy</span>
              <h3>Chỉ Số Thanh Khoản & Cấu Trúc Vốn</h3>
            </div>
          </div>
          <div className="chart-body">
            <div className="solvency-progress-grid">
              {solvencyMetrics.map((m, idx) => {
                const val = m.current ?? 0;
                const isRatio = m.unit === "lần";
                const maxVal = isRatio ? 3 : 100;
                const percent = Math.min(100, Math.max(0, (val / maxVal) * 100));

                return (
                  <div key={idx} className="solvency-item">
                    <div className="solvency-info">
                      <span className="solvency-label">{m.label}</span>
                      <span className="solvency-val">
                        {val} {m.unit}
                      </span>
                    </div>
                    <div className="solvency-bar-bg">
                      <div
                        className="solvency-bar-fill"
                        style={{
                          width: `${percent}%`,
                          backgroundColor:
                            m.trend === "up"
                              ? "#10b981"
                              : m.trend === "down"
                              ? "#ef4444"
                              : "#3b82f6",
                        }}
                      />
                    </div>
                    <p className="solvency-comment">{m.comment}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
