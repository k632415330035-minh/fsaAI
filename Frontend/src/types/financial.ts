export type Trend = "up" | "down" | "stable";
export type FinancialHealthLevel = "Tốt" | "Khá" | "Trung bình" | "Yếu";

export type FinancialMetricKey =
  | "roe"
  | "roa"
  | "currentRatio"
  | "operatingCashFlow"
  | "revenueGrowth"
  | "revenue"
  | "grossProfit"
  | "netProfit"
  | "totalAssets"
  | "totalEquity"
  | "totalLiabilities"
  | "currentAssets"
  | "grossMargin"
  | "netMargin"
  | "operatingMargin"
  | "ebitMargin"
  | "ebitdaMargin"
  | "deRatio"
  | "debtRatio"
  | "equityRatio"
  | "quickRatio"
  | "cashRatio"
  | "assetTurnover"
  | "inventoryTurnover"
  | "receivableTurnover"
  | "profitGrowth"
  | "assetGrowth"
  | "equityGrowth";

export interface FinancialMetric {
  label: string;
  unit: string;
  current: number | null;
  previous: number | null;
  change: number | null;
  changePercent: number | null;
  trend: Trend;
  score: number;
  maxScore: number;
  comment: string;
}

export interface MetricGroup {
  title: string;
  metrics: FinancialMetric[];
}

export interface FinancialHealth {
  score: number;
  maxScore: number;
  level: FinancialHealthLevel;
  summary: string;
}

export interface FinancialInsights {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  watchItems: string[];
  overallConclusion: string;
}

export interface AnalysisPeriods {
  current: string;
  previous: string;
}

export interface FinancialAnalysisResult {
  symbol: string;
  companyName: string;
  exchange?: string;
  dataSource: string;
  analyzedAt?: string;
  periods: AnalysisPeriods;
  financialHealth: FinancialHealth;
  metrics: Record<string, FinancialMetric>;
  groups?: MetricGroup[];
  insights: FinancialInsights;
}

export interface FinancialAnalysisSuccessResponse {
  success: true;
  message?: string;
  data: FinancialAnalysisResult;
  error: null;
}

export interface FinancialAnalysisErrorResponse {
  success: false;
  message?: string;
  data: null;
  error: unknown;
}

export type FinancialAnalysisApiResponse =
  | FinancialAnalysisSuccessResponse
  | FinancialAnalysisErrorResponse;

export type FinancialInsight = FinancialInsights;
export type FinancialAnalysis = FinancialAnalysisResult;
