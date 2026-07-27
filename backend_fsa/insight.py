import os
from openai import OpenAI


def generate_ai_insight(symbol: str, kpi_data: dict) -> list[str]:
    """
    Sử dụng OpenAI API để phân tích chỉ số tài chính và đưa ra nhận xét ngắn gọn.
    """
    api_key = os.getenv("OPENAI_API_KEY")

    # Nếu không truyền API Key, trả về đánh giá rule-based đơn giản
    if not api_key:
        return _fallback_insights(kpi_data)

    try:
        client = OpenAI(api_key=api_key)

        ratios = kpi_data.get("ratios", {})
        metrics = kpi_data.get("metrics", {})
        year = kpi_data.get("latest_year", "")

        prompt = f"""
        Bạn là một chuyên gia phân tích tài chính chứng khoán chuyên nghiệp.
        Hãy phân tích doanh nghiệp {symbol} trong năm {year} dựa trên các chỉ số sau:

        - Doanh thu thuần: {metrics.get('revenue', 0):,.0f} VND
        - Lợi nhuận sau thuế: {metrics.get('net_profit', 0):,.0f} VND
        - Biên lợi nhuận gộp: {ratios.get('gross_margin')}%
        - Biên lợi nhuận ròng: {ratios.get('net_margin')}%
        - Tỷ suất sinh lời ROE: {ratios.get('roe')}%
        - Tỷ suất sinh lời ROA: {ratios.get('roa')}%
        - Tỷ lệ Nợ/Vốn chủ sở hữu (D/E): {ratios.get('de_ratio')}

        Yêu cầu:
        1. Đưa ra 3-4 dòng nhận xét ngắn gọn, đi thẳng vào vấn đề.
        2. Đánh giá về: Sức khỏe tài chính, Khả năng sinh lời và Rủi ro nợ vay.
        3. Mỗi dòng nhận xét bắt đầu bằng dấu gạch đầu dòng '-'.
        """

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=300,
        )

        content = response.choices[0].message.content.strip()
        # Đưa ra dạng danh sách chuỗi
        insights = [
            line.strip("- ").strip()
            for line in content.split("\n")
            if line.strip()
        ]
        return insights

    except Exception as e:
        print(f"Lỗi OpenAI API: {e}")
        return _fallback_insights(kpi_data)


def _fallback_insights(kpi_data: dict) -> list[str]:
    """Nhận xét tĩnh dự phòng khi không gọi được OpenAI API."""
    ratios = kpi_data.get("ratios", {})
    insights = []

    net_margin = ratios.get("net_margin", 0)
    if net_margin > 15:
        insights.append(
            "Biên lợi nhuận ròng ở mức rất tốt, doanh nghiệp có lợi thế cạnh tranh cao."
        )
    else:
        insights.append(
            "Biên lợi nhuận ròng ở mức trung bình, cần chú ý kiểm soát chi phí."
        )

    roe = ratios.get("roe", 0)
    if roe > 15:
        insights.append(
            "Chỉ số ROE đạt mức ấn tượng, hiệu quả sử dụng vốn của cổ đông cao."
        )
    else:
        insights.append(
            "Hiệu quả khai thác vốn chủ sở hữu (ROE) cần được cải thiện."
        )

    de = ratios.get("de_ratio", 0)
    if de > 2.0:
        insights.append(
            "Cảnh báo: Tỷ lệ Nợ/Vốn chủ sở hữu cao (> 2.0), rủi ro đòn bẩy tài chính lớn."
        )
    else:
        insights.append("Cấu trúc tài chính an toàn, nợ vay trong tầm kiểm soát.")

    return insights
