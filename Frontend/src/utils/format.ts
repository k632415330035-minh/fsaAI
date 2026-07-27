import type { Trend } from "../types/financial";

export function formatMetric(value: number | null | undefined, unit: string): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Thiếu dữ liệu";

  if (unit === "VND") {
    return new Intl.NumberFormat("vi-VN", {
      notation: "compact",
      maximumFractionDigits: 1
    }).format(value);
  }

  if (unit === "%") {
    return `${value.toFixed(1)}%`;
  }

  if (unit === "lần") {
    return value.toFixed(2);
  }

  return value.toFixed(2);
}

export function translateTrend(trend: Trend): string {
  const trends: Record<Trend, string> = {
    up: "Tăng",
    down: "Giảm",
    stable: "Ổn định"
  };

  return trends[trend];
}
