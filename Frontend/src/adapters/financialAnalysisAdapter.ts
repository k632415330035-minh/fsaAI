import type {
  FinancialAnalysisApiResponse,
  FinancialAnalysisResult,
  FinancialHealthLevel,
  FinancialMetric,
  Trend
} from "../types/financial";

type RawRecord = Record<string, unknown>;

const emptyMetric = (label: string, unit: string): FinancialMetric => ({
  label,
  unit,
  current: null,
  previous: null,
  change: null,
  changePercent: null,
  trend: "stable",
  score: 0,
  maxScore: 20,
  comment: "Chưa có đủ dữ liệu để đánh giá chỉ số này."
});

export function normalizeFinancialAnalysisResponse(raw: unknown): FinancialAnalysisResult {
  const response = raw as Partial<FinancialAnalysisApiResponse> | RawRecord;

  if (isContractSuccess(response)) {
    return response.data;
  }

  const source = asRecord(response);
  const analysis = asRecord(source.analysis);
  const dashboardData = asRecord(analysis.data);
  const metrics = asRecord(dashboardData.metrics);
  const ratios = asRecord(dashboardData.ratios);

  const currentYear = toStringOrEmpty(dashboardData.latest_year) || new Date().getFullYear().toString();
  const previousYear = inferPreviousYear(currentYear);

  return {
    symbol: toStringOrEmpty(source.symbol).toUpperCase(),
    companyName: toStringOrEmpty(source.company_name) || toStringOrEmpty(source.companyName) || toStringOrEmpty(source.symbol).toUpperCase(),
    exchange: optionalString(source.exchange),
    dataSource: toStringOrEmpty(source.data_source) || toStringOrEmpty(source.dataSource) || "VNStock",
    analyzedAt: optionalString(source.analyzed_at) ?? optionalString(source.analyzedAt),
    periods: {
      current: currentYear,
      previous: previousYear
    },
    financialHealth: {
      score: toNumberOrDefault(source.total_score ?? dashboardData.total_score, 0),
      maxScore: toNumberOrDefault(source.max_score ?? dashboardData.max_score, 100),
      level: normalizeLevel(source.rating ?? source.level ?? dashboardData.level),
      summary: toStringOrEmpty(source.summary ?? dashboardData.summary)
    },
    metrics: {
      roe: metricFromRaw("ROE", "%", ratios.roe),
      roa: metricFromRaw("ROA", "%", ratios.roa),
      currentRatio: metricFromRaw("Tỷ lệ thanh toán ngắn hạn", "lần", ratios.current_ratio ?? ratios.currentRatio),
      operatingCashFlow: metricFromRaw("Dòng tiền từ hoạt động kinh doanh", "VND", metrics.operating_cashflow ?? metrics.operatingCashFlow),
      revenueGrowth: metricFromRaw("Tăng trưởng doanh thu", "%", ratios.revenue_growth ?? ratios.revenueGrowth)
    },
    insights: {
      summary: toStringOrEmpty(source.ai_summary ?? source.summary),
      strengths: toStringArray(source.strengths),
      weaknesses: toStringArray(source.weaknesses),
      risks: toStringArray(source.risks),
      watchItems: toStringArray(source.watch_items ?? source.watchItems ?? source.recommendations),
      overallConclusion: toStringOrEmpty(source.overall_conclusion ?? source.overallConclusion)
    }
  };
}

function isContractSuccess(raw: unknown): raw is { success: true; data: FinancialAnalysisResult; error: null } {
  const record = asRecord(raw);
  return record.success === true && typeof record.data === "object" && record.data !== null;
}

function metricFromRaw(label: string, unit: string, rawValue: unknown): FinancialMetric {
  if (typeof rawValue === "object" && rawValue !== null) {
    const raw = asRecord(rawValue);
    return {
      label: toStringOrEmpty(raw.label) || label,
      unit: toStringOrEmpty(raw.unit) || unit,
      current: toNullableNumber(raw.current),
      previous: toNullableNumber(raw.previous),
      change: toNullableNumber(raw.change),
      changePercent: toNullableNumber(raw.change_percent ?? raw.changePercent),
      trend: normalizeTrend(raw.trend),
      score: toNumberOrDefault(raw.score, 0),
      maxScore: toNumberOrDefault(raw.max_score ?? raw.maxScore, 20),
      comment: toStringOrEmpty(raw.comment)
    };
  }

  return {
    ...emptyMetric(label, unit),
    current: toNullableNumber(rawValue)
  };
}

function asRecord(value: unknown): RawRecord {
  return typeof value === "object" && value !== null ? (value as RawRecord) : {};
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : Number(String(value).replace(/,/g, "").replace(/%/g, ""));
  return Number.isFinite(number) ? number : null;
}

function toNumberOrDefault(value: unknown, fallback: number): number {
  return toNullableNumber(value) ?? fallback;
}

function toStringOrEmpty(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function optionalString(value: unknown): string | undefined {
  const next = toStringOrEmpty(value);
  return next ? next : undefined;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => toStringOrEmpty(item)).filter(Boolean);
}

function normalizeTrend(value: unknown): Trend {
  const text = toStringOrEmpty(value).toLowerCase();
  if (text === "up" || text === "increase" || text === "tăng") return "up";
  if (text === "down" || text === "decrease" || text === "giảm") return "down";
  return "stable";
}

function normalizeLevel(value: unknown): FinancialHealthLevel {
  const text = toStringOrEmpty(value).toLowerCase();
  if (text.includes("tốt") || text.includes("tot") || text === "good") return "Tốt";
  if (text.includes("khá") || text.includes("kha") || text === "fair") return "Khá";
  if (text.includes("yếu") || text.includes("yeu") || text === "weak") return "Yếu";
  return "Trung bình";
}

function inferPreviousYear(currentYear: string): string {
  const year = Number(currentYear);
  return Number.isFinite(year) ? String(year - 1) : "";
}
