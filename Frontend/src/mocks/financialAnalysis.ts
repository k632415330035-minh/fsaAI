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
    groups: [
      {
        title: "1. Quy mô doanh nghiệp",
        metrics: [
          { label: "Doanh thu thuần", unit: "VND", current: 52800000000000, previous: 45000000000000, change: 7800000000000, changePercent: 17.3, trend: "up", score: 20, maxScore: 20, comment: "Quy mô doanh thu duy trì đà tăng trưởng cao." },
          { label: "Lợi nhuận gộp", unit: "VND", current: 20500000000000, previous: 17200000000000, change: 3300000000000, changePercent: 19.1, trend: "up", score: 20, maxScore: 20, comment: "Lợi nhuận gộp tăng trưởng tích cực." },
          { label: "Lợi nhuận sau thuế", unit: "VND", current: 7850000000000, previous: 6500000000000, change: 1350000000000, changePercent: 20.7, trend: "up", score: 20, maxScore: 20, comment: "Lợi nhuận sau thuế tăng trưởng vượt bậc." },
          { label: "Dòng tiền từ HĐKD", unit: "VND", current: 9200000000000, previous: 7800000000000, change: 1400000000000, changePercent: 17.9, trend: "up", score: 17, maxScore: 20, comment: "Dòng tiền HĐKD dương mạnh mẽ." },
          { label: "Tổng tài sản", unit: "VND", current: 65000000000000, previous: 55000000000000, change: 10000000000000, changePercent: 18.2, trend: "up", score: 18, maxScore: 20, comment: "Tổng tài sản mở rộng liên tục." },
          { label: "Vốn chủ sở hữu", unit: "VND", current: 32500000000000, previous: 27000000000000, change: 5500000000000, changePercent: 20.3, trend: "up", score: 19, maxScore: 20, comment: "Vốn CSH được củng cố qua các năm." },
          { label: "Nợ phải trả", unit: "VND", current: 32500000000000, previous: 28000000000000, change: 4500000000000, changePercent: 16.1, trend: "stable", score: 16, maxScore: 20, comment: "Nợ phải trả gia tăng cùng quy mô hoạt động." },
          { label: "Tài sản ngắn hạn", unit: "VND", current: 38000000000000, previous: 32000000000000, change: 6000000000000, changePercent: 18.75, trend: "up", score: 18, maxScore: 20, comment: "Tài sản ngắn hạn dồi dào." }
        ]
      },
      {
        title: "2. Khả năng sinh lời",
        metrics: [
          { label: "Biên lợi nhuận gộp (Gross Margin)", unit: "%", current: 38.8, previous: 38.2, change: 0.6, changePercent: 1.5, trend: "stable", score: 18, maxScore: 20, comment: "Biên LN gộp duy trì ở mức cao ấn tượng." },
          { label: "Biên lợi nhuận ròng (Net Margin)", unit: "%", current: 14.8, previous: 14.4, change: 0.4, changePercent: 2.7, trend: "stable", score: 17, maxScore: 20, comment: "Biên LN ròng cải thiện nhẹ." },
          { label: "ROE", unit: "%", current: 24.2, previous: 21.8, change: 2.4, changePercent: 11.0, trend: "up", score: 18, maxScore: 20, comment: "ROE đạt hiệu suất sinh lời rất cao." },
          { label: "ROA", unit: "%", current: 10.8, previous: 9.7, change: 1.1, changePercent: 11.3, trend: "up", score: 17, maxScore: 20, comment: "ROA cải thiện hiệu quả sử dụng tài sản." },
          { label: "Biên HĐKD (Operating Margin)", unit: "%", current: 17.5, previous: 16.8, change: 0.7, changePercent: 4.1, trend: "up", score: 18, maxScore: 20, comment: "Biên HĐKD cải thiện nhờ tối ưu chi phí." },
          { label: "Biên EBIT (EBIT Margin)", unit: "%", current: 18.2, previous: 17.6, change: 0.6, changePercent: 3.4, trend: "up", score: 18, maxScore: 20, comment: "Biên EBIT cao phản ánh năng lực cốt lõi." },
          { label: "Biên EBITDA (EBITDA Margin)", unit: "%", current: 21.5, previous: 20.8, change: 0.7, changePercent: 3.3, trend: "up", score: 19, maxScore: 20, comment: "Biên EBITDA mạnh mẽ." }
        ]
      },
      {
        title: "3. Đòn bẩy tài chính",
        metrics: [
          { label: "Tỷ lệ Nợ/Vốn CSH (Debt / Equity)", unit: "lần", current: 1.0, previous: 1.03, change: -0.03, changePercent: -2.9, trend: "stable", score: 18, maxScore: 20, comment: "Tỷ lệ D/E ở mức cân bằng safe." },
          { label: "Tỷ lệ Nợ/Tổng tài sản (Debt Ratio)", unit: "%", current: 50.0, previous: 50.9, change: -0.9, changePercent: -1.7, trend: "stable", score: 17, maxScore: 20, comment: "Nợ chiếm 50% tổng tài sản, an toàn." },
          { label: "Tỷ lệ Tự chủ tài chính (Equity Ratio)", unit: "%", current: 50.0, previous: 49.1, change: 0.9, changePercent: 1.8, trend: "stable", score: 18, maxScore: 20, comment: "Mức tự chủ tài chính vững chắc." }
        ]
      },
      {
        title: "4. Thanh khoản",
        metrics: [
          { label: "Tỷ lệ Thanh toán hiện hành (Current Ratio)", unit: "lần", current: 1.72, previous: 1.64, change: 0.08, changePercent: 4.9, trend: "stable", score: 16, maxScore: 20, comment: "Thanh toán ngắn hạn đảm bảo." },
          { label: "Tỷ lệ Thanh toán nhanh (Quick Ratio)", unit: "lần", current: 1.45, previous: 1.38, change: 0.07, changePercent: 5.0, trend: "up", score: 17, maxScore: 20, comment: "Thanh toán nhanh dồi dào." },
          { label: "Tỷ lệ Thanh toán tiền mặt (Cash Ratio)", unit: "lần", current: 0.85, previous: 0.78, change: 0.07, changePercent: 8.9, trend: "up", score: 18, maxScore: 20, comment: "Dự trữ tiền mặt khả quan." }
        ]
      },
      {
        title: "5. Hiệu quả sử dụng tài sản",
        metrics: [
          { label: "Vòng quay tổng tài sản (Asset Turnover)", unit: "lần", current: 0.81, previous: 0.81, change: 0.0, changePercent: 0.0, trend: "stable", score: 16, maxScore: 20, comment: "Hiệu quả sử dụng tài sản ổn định." },
          { label: "Vòng quay hàng tồn kho (Inventory Turnover)", unit: "lần", current: 8.5, previous: 8.1, change: 0.4, changePercent: 4.9, trend: "up", score: 18, maxScore: 20, comment: "Hàng tồn kho luôn chuyển nhanh." },
          { label: "Vòng quay khoản phải thu (Receivable Turnover)", unit: "lần", current: 6.2, previous: 5.9, change: 0.3, changePercent: 5.0, trend: "up", score: 17, maxScore: 20, comment: "Quản lý công nợ tốt." }
        ]
      },
      {
        title: "6. Tăng trưởng (YoY)",
        metrics: [
          { label: "Tăng trưởng doanh thu", unit: "%", current: 18.5, previous: 14.2, change: 4.3, changePercent: 30.3, trend: "up", score: 14, maxScore: 20, comment: "Doanh thu tăng trưởng mạnh mẽ." },
          { label: "Tăng trưởng lợi nhuận", unit: "%", current: 20.7, previous: 15.8, change: 4.9, changePercent: 31.0, trend: "up", score: 16, maxScore: 20, comment: "Lợi nhuận tăng trưởng ấn tượng." },
          { label: "Tăng trưởng tổng tài sản", unit: "%", current: 18.2, previous: 12.5, change: 5.7, changePercent: 45.6, trend: "up", score: 15, maxScore: 20, comment: "Quy mô tài sản tăng mở rộng." },
          { label: "Tăng trưởng vốn chủ", unit: "%", current: 20.3, previous: 14.8, change: 5.5, changePercent: 37.1, trend: "up", score: 17, maxScore: 20, comment: "Vốn CSH tăng tích lũy từ LNST." }
        ]
      }
    ],
    growthChart: {
      years: ["2022", "2023", "2024", "2025"],
      series: {
        revenue_growth: [12.4, 15.1, 14.2, 18.5],
        profit_growth: [10.8, 16.3, 15.8, 20.7],
        asset_growth: [9.5, 11.2, 12.5, 18.2],
        equity_growth: [11.0, 13.5, 14.8, 20.3]
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
