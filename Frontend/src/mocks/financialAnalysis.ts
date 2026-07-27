import type { FinancialAnalysisApiResponse } from "../types/financial";

export const mockFinancialAnalysisResponse: FinancialAnalysisApiResponse = {
  success: true,
  data: {
    symbol: "FPT",
    companyName: "Công ty Cổ phần FPT",
    exchange: "HOSE",
    dataSource: "Dữ liệu minh họa",
    analyzedAt: "2026-07-27T22:00:00",
    periods: {
      current: "2025",
      previous: "2024"
    },
    financialHealth: {
      score: 82,
      maxScore: 100,
      level: "Tốt",
      summary: "Sức khỏe tài chính của doanh nghiệp ở mức tốt, khả năng sinh lời cải thiện và dòng tiền hoạt động duy trì tích cực."
    },
    metrics: {
      roe: {
        label: "ROE",
        unit: "%",
        current: 24.2,
        previous: 21.8,
        change: 2.4,
        changePercent: 11.0,
        trend: "up",
        score: 18,
        maxScore: 20,
        comment: "ROE tăng so với kỳ trước, cho thấy hiệu quả sử dụng vốn chủ sở hữu cải thiện."
      },
      roa: {
        label: "ROA",
        unit: "%",
        current: 10.8,
        previous: 9.7,
        change: 1.1,
        changePercent: 11.3,
        trend: "up",
        score: 17,
        maxScore: 20,
        comment: "ROA tăng nhẹ, tài sản đang tạo lợi nhuận hiệu quả hơn."
      },
      currentRatio: {
        label: "Tỷ lệ thanh toán ngắn hạn",
        unit: "lần",
        current: 1.72,
        previous: 1.64,
        change: 0.08,
        changePercent: 4.9,
        trend: "stable",
        score: 16,
        maxScore: 20,
        comment: "Khả năng thanh toán ngắn hạn duy trì ở vùng an toàn."
      },
      operatingCashFlow: {
        label: "Dòng tiền từ hoạt động kinh doanh",
        unit: "VND",
        current: 9200000000000,
        previous: 7800000000000,
        change: 1400000000000,
        changePercent: 17.9,
        trend: "up",
        score: 17,
        maxScore: 20,
        comment: "Dòng tiền kinh doanh dương và tăng, hỗ trợ chất lượng lợi nhuận."
      },
      revenueGrowth: {
        label: "Tăng trưởng doanh thu",
        unit: "%",
        current: 18.5,
        previous: 14.2,
        change: 4.3,
        changePercent: 30.3,
        trend: "up",
        score: 14,
        maxScore: 20,
        comment: "Tăng trưởng doanh thu tốt hơn kỳ trước, phản ánh xu hướng hoạt động tích cực."
      }
    },
    insights: {
      summary: "Doanh nghiệp có nền tảng tài chính tích cực trong giai đoạn so sánh.",
      strengths: [
        "Khả năng sinh lời cải thiện qua cả ROE và ROA.",
        "Dòng tiền từ hoạt động kinh doanh duy trì dương.",
        "Doanh thu tăng trưởng tốt hơn so với kỳ trước."
      ],
      weaknesses: [
        "Tỷ lệ thanh toán ngắn hạn chưa tăng mạnh, cần tiếp tục theo dõi vốn lưu động."
      ],
      risks: [
        "Nếu tăng trưởng doanh thu chậm lại, điểm Financial Health có thể bị ảnh hưởng."
      ],
      watchItems: [
        "ROE",
        "ROA",
        "Dòng tiền từ hoạt động kinh doanh",
        "Tỷ lệ thanh toán ngắn hạn"
      ],
      overallConclusion: "Doanh nghiệp đang có nền tảng tài chính tốt, xu hướng hoạt động tích cực và chưa xuất hiện tín hiệu rủi ro nghiêm trọng từ bộ chỉ số minh họa."
    }
  },
  error: null
};
