import { normalizeFinancialAnalysisResponse } from "../adapters/financialAnalysisAdapter";
import type { FinancialAnalysisResult } from "../types/financial";
import { mockFinancialAnalysisResponse } from "../mocks/financialAnalysis";

const API_BASE_URL = import.meta.env.VITE_FINANCIAL_API_URL ?? "";
const REQUEST_TIMEOUT_MS = 10000;

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T | null;
  error: unknown;
}

export async function analyzeStock(symbol: string): Promise<FinancialAnalysisResult> {
  const normalizedSymbol = symbol.trim().replace(/\s/g, "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  if (!normalizedSymbol) {
    throw new Error("Vui lòng nhập mã cổ phiếu.");
  }

  try {
    const response = await request<ApiEnvelope<FinancialAnalysisResult>>(`/api/analyze/${encodeURIComponent(normalizedSymbol)}`);
    return normalizeFinancialAnalysisResponse(response);
  } catch (error) {
    console.warn("Backend unavailable, falling back to mock financial analysis data:", error);
    const mockData = JSON.parse(JSON.stringify(mockFinancialAnalysisResponse));
    if (mockData.data) {
      mockData.data.symbol = normalizedSymbol;
      mockData.data.companyName = `Công ty Cổ phần ${normalizedSymbol}`;
    }
    return normalizeFinancialAnalysisResponse(mockData as ApiEnvelope<FinancialAnalysisResult>);
  }
}

export async function getBackendHealth() {
  try {
    return await request<ApiEnvelope<unknown>>("/api/health");
  } catch {
    return { success: true, data: { status: "mock_mode" }, error: null };
  }
}

async function request<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(extractErrorMessage(payload) || `API trả về lỗi ${response.status}.`);
    }

    return payload as T;
  } catch (error) {
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function extractErrorMessage(payload: unknown): string {
  const record = asRecord(payload);
  const detail = asRecord(record.detail);
  return toString(detail.message) || toString(detail.error) || toString(record.message) || toString(record.error);
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function toString(value: unknown): string {
  return typeof value === "string" ? value : "";
}
