import type {
  FinancialAnalysisApiResponse,
  FinancialAnalysisResult,
  FinancialHealthLevel,
  FinancialMetric,
  MetricGroup,
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
    return ensureGroupsInResult(response.data);
  }

  const source = asRecord(response);
  const analysis = asRecord(source.analysis);
  const analysisData = asRecord(analysis.data);
  const dashboardData = asRecord(source.metrics || source.groups || source.ratios ? source : (analysisData.metrics ? analysisData : source));
  const metricsRaw = asRecord(dashboardData.metrics);
  const ratiosRaw = asRecord(dashboardData.ratios);
  const groupsRaw = asRecord(dashboardData.groups);

  const currentYear = toStringOrEmpty(dashboardData.latest_year) || new Date().getFullYear().toString();
  const previousYear = toStringOrEmpty(dashboardData.previous_year) || inferPreviousYear(currentYear);

  // Parse 6 groups
  const scaleGroup: MetricGroup = {
    title: "1. Quy mô doanh nghiệp",
    metrics: [
      metricFromRaw("Doanh thu thuần", "VND", metricsRaw.revenue ?? ratiosRaw.revenue),
      metricFromRaw("Lợi nhuận gộp", "VND", metricsRaw.gross_profit ?? ratiosRaw.gross_profit),
      metricFromRaw("Lợi nhuận sau thuế", "VND", metricsRaw.net_profit ?? ratiosRaw.net_profit),
      metricFromRaw("Dòng tiền từ HĐKD", "VND", metricsRaw.operating_cashflow ?? metricsRaw.operatingCashFlow),
      metricFromRaw("Tổng tài sản", "VND", metricsRaw.total_assets ?? ratiosRaw.total_assets),
      metricFromRaw("Vốn chủ sở hữu", "VND", metricsRaw.total_equity ?? ratiosRaw.total_equity),
      metricFromRaw("Nợ phải trả", "VND", metricsRaw.total_liabilities ?? ratiosRaw.total_liabilities),
      metricFromRaw("Tài sản ngắn hạn", "VND", metricsRaw.current_assets ?? ratiosRaw.current_assets),
    ]
  };

  const profitGroup: MetricGroup = {
    title: "2. Khả năng sinh lời",
    metrics: [
      metricFromRaw("Biên lợi nhuận gộp (Gross Margin)", "%", ratiosRaw.gross_margin ?? ratiosRaw.grossMargin),
      metricFromRaw("Biên lợi nhuận ròng (Net Margin)", "%", ratiosRaw.net_margin ?? ratiosRaw.netMargin),
      metricFromRaw("ROE", "%", ratiosRaw.roe),
      metricFromRaw("ROA", "%", ratiosRaw.roa),
      metricFromRaw("Biên HĐKD (Operating Margin)", "%", ratiosRaw.operating_margin ?? ratiosRaw.operatingMargin),
      metricFromRaw("Biên EBIT (EBIT Margin)", "%", ratiosRaw.ebit_margin ?? ratiosRaw.ebitMargin),
      metricFromRaw("Biên EBITDA (EBITDA Margin)", "%", ratiosRaw.ebitda_margin ?? ratiosRaw.ebitdaMargin),
    ]
  };

  const leverageGroup: MetricGroup = {
    title: "3. Đòn bẩy tài chính",
    metrics: [
      metricFromRaw("Tỷ lệ Nợ/Vốn CSH (Debt / Equity)", "lần", ratiosRaw.de_ratio ?? ratiosRaw.deRatio),
      metricFromRaw("Tỷ lệ Nợ/Tổng tài sản (Debt Ratio)", "%", ratiosRaw.debt_ratio ?? ratiosRaw.debtRatio),
      metricFromRaw("Tỷ lệ Tự chủ tài chính (Equity Ratio)", "%", ratiosRaw.equity_ratio ?? ratiosRaw.equityRatio),
    ]
  };

  const liquidityGroup: MetricGroup = {
    title: "4. Thanh khoản",
    metrics: [
      metricFromRaw("Tỷ lệ Thanh toán hiện hành (Current Ratio)", "lần", ratiosRaw.current_ratio ?? ratiosRaw.currentRatio),
      metricFromRaw("Tỷ lệ Thanh toán nhanh (Quick Ratio)", "lần", ratiosRaw.quick_ratio ?? ratiosRaw.quickRatio),
      metricFromRaw("Tỷ lệ Thanh toán tiền mặt (Cash Ratio)", "lần", ratiosRaw.cash_ratio ?? ratiosRaw.cashRatio),
    ]
  };

  const efficiencyGroup: MetricGroup = {
    title: "5. Hiệu quả sử dụng tài sản",
    metrics: [
      metricFromRaw("Vòng quay tổng tài sản (Asset Turnover)", "lần", ratiosRaw.asset_turnover ?? ratiosRaw.assetTurnover),
      metricFromRaw("Vòng quay hàng tồn kho (Inventory Turnover)", "lần", ratiosRaw.inventory_turnover ?? ratiosRaw.inventoryTurnover),
      metricFromRaw("Vòng quay khoản phải thu (Receivable Turnover)", "lần", ratiosRaw.receivable_turnover ?? ratiosRaw.receivableTurnover),
    ]
  };

  const growthGroup: MetricGroup = {
    title: "6. Tăng trưởng (YoY)",
    metrics: [
      metricFromRaw("Tăng trưởng doanh thu", "%", ratiosRaw.revenue_growth ?? ratiosRaw.revenueGrowth),
      metricFromRaw("Tăng trưởng lợi nhuận", "%", ratiosRaw.profit_growth ?? ratiosRaw.profitGrowth),
      metricFromRaw("Tăng trưởng tổng tài sản", "%", ratiosRaw.asset_growth ?? ratiosRaw.assetGrowth),
      metricFromRaw("Tăng trưởng vốn chủ", "%", ratiosRaw.equity_growth ?? ratiosRaw.equityGrowth),
    ]
  };

  const groups: MetricGroup[] = [
    scaleGroup,
    profitGroup,
    leverageGroup,
    liquidityGroup,
    efficiencyGroup,
    growthGroup,
  ];

  const allMetrics: Record<string, FinancialMetric> = {
    roe: metricFromRaw("ROE", "%", ratiosRaw.roe),
    roa: metricFromRaw("ROA", "%", ratiosRaw.roa),
    currentRatio: metricFromRaw("Tỷ lệ thanh toán ngắn hạn", "lần", ratiosRaw.current_ratio ?? ratiosRaw.currentRatio),
    operatingCashFlow: metricFromRaw("Dòng tiền từ hoạt động kinh doanh", "VND", metricsRaw.operating_cashflow ?? metricsRaw.operatingCashFlow),
    revenueGrowth: metricFromRaw("Tăng trưởng doanh thu", "%", ratiosRaw.revenue_growth ?? ratiosRaw.revenueGrowth),
  };

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
      score: toNumberOrDefault(source.total_score ?? dashboardData.total_score ?? source.score, 0),
      maxScore: toNumberOrDefault(source.max_score ?? dashboardData.max_score ?? source.maxScore, 100),
      level: normalizeLevel(source.rating ?? source.level ?? dashboardData.level),
      summary: toStringOrEmpty(source.summary ?? dashboardData.summary)
    },
    metrics: allMetrics,
    groups: groups,
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

function ensureGroupsInResult(result: FinancialAnalysisResult): FinancialAnalysisResult {
  if (result.groups && result.groups.length > 0) return result;
  return normalizeFinancialAnalysisResponse({ success: false, analysis: { data: result } });
}

function isContractSuccess(raw: unknown): raw is { success: true; data: FinancialAnalysisResult; error: null } {
  const record = asRecord(raw);
  return record.success === true && typeof record.data === "object" && record.data !== null && Array.isArray((record.data as FinancialAnalysisResult).groups);
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

  const num = toNullableNumber(rawValue);
  return {
    ...emptyMetric(label, unit),
    current: num
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
