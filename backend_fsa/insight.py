import os


def generate_ai_insight(symbol: str, kpi_data: dict) -> list[str]:
    """
    Sử dụng OpenAI API để phân tích 6 nhóm chỉ số tài chính và đưa ra nhận xét chuyên sâu.
    """
    api_key = os.getenv("OPENAI_API_KEY")

    # Nếu không truyền API Key, trả về đánh giá rule-based đa chiều
    if not api_key:
        return _fallback_insights(kpi_data)

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)

        ratios = kpi_data.get("ratios", {})
        metrics = kpi_data.get("metrics", {})
        year = kpi_data.get("latest_year", "")

        prompt = f"""
Bạn là một chuyên gia phân tích tài chính chứng khoán cấp cao.
Hãy phân tích báo cáo tài chính của doanh nghiệp {symbol} trong năm {year} dựa trên 6 nhóm chỉ số tài chính dưới đây:

1. QUY MÔ & HOẠT ĐỘNG:
   - Doanh thu thuần: {metrics.get('revenue', 0):,.0f} VND
   - Lợi nhuận sau thuế: {metrics.get('net_profit', 0):,.0f} VND
   - Dòng tiền từ HĐKD: {metrics.get('operating_cashflow', 0):,.0f} VND

2. KHẢ NĂNG SINH LỜI:
   - Gross Margin: {ratios.get('gross_margin', 0)}% | Net Margin: {ratios.get('net_margin', 0)}%
   - Operating Margin: {ratios.get('operating_margin', 0)}% | EBITDA Margin: {ratios.get('ebitda_margin', 0)}%
   - ROE: {ratios.get('roe', 0)}% | ROA: {ratios.get('roa', 0)}%

3. TĂNG TRƯỞNG (YoY):
   - Tăng trưởng doanh thu: {ratios.get('revenue_growth', 0)}%
   - Tăng trưởng lợi nhuận: {ratios.get('profit_growth', 0)}%
   - Tăng trưởng tổng tài sản: {ratios.get('asset_growth', 0)}%

4. ĐÒN BẨY TÀI CHÍNH:
   - Tỷ lệ Nợ/Vốn CSH (D/E): {ratios.get('de_ratio', 0)} lần
   - Tỷ lệ Nợ/Tổng tài sản: {ratios.get('debt_ratio', 0)}%
   - Tỷ lệ Tự chủ tài chính (Equity Ratio): {ratios.get('equity_ratio', 0)}%

5. THANH KHOẢN:
   - Tỷ lệ Thanh toán hiện hành: {ratios.get('current_ratio', 0)} lần
   - Tỷ lệ Thanh toán nhanh: {ratios.get('quick_ratio', 0)} lần
   - Tỷ lệ Thanh toán tiền mặt: {ratios.get('cash_ratio', 0)} lần

6. HIỆU QUẢ SỬ DỤNG TÀI SẢN:
   - Vòng quay tổng tài sản: {ratios.get('asset_turnover', 0)} lần
   - Vòng quay hàng tồn kho: {ratios.get('inventory_turnover', 0)} lần
   - Vòng quay khoản phải thu: {ratios.get('receivable_turnover', 0)} lần

Yêu cầu phân tích:
1. Đưa ra 4-5 gạch đầu dòng nhận xét súc tích, chuyên nghiệp, đánh giá thẳng vào trọng tâm.
2. Nhận xét chi tiết về: Sức khỏe tài chính, Chất lượng tăng trưởng, Khả năng sinh lời, Đòn bẩy tài chính và Rủi ro thanh khoản.
3. Mỗi dòng nhận xét bắt đầu bằng dấu gạch đầu dòng '-'.
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=400,
        )

        content = response.choices[0].message.content.strip()
        insights = [
            line.strip("- ").strip()
            for line in content.split("\n")
            if line.strip() and line.strip().startswith("-")
        ]
        return insights if insights else [content]

    except Exception as e:
        print(f"Lỗi OpenAI API: {e}")
        return _fallback_insights(kpi_data)


def _fallback_insights(kpi_data: dict) -> list[str]:
    """Nhận xét tĩnh đa chiều dự phòng khi không gọi được OpenAI API."""
    ratios = kpi_data.get("ratios", {})
    insights = []

    # 1. Sinh lời
    net_margin = ratios.get("net_margin", 0)
    roe = ratios.get("roe", 0)
    if roe >= 15 and net_margin >= 10:
        insights.append("Hiệu quả sinh lời xuất sắc với ROE đạt mốc ấn tượng và biên lợi nhuận ròng duy trì mức cao.")
    elif roe >= 10:
        insights.append("Khả năng sinh lời ở mức khá, doanh nghiệp duy trì được hiệu quả khai thác vốn ổn định.")
    else:
        insights.append("Hiệu quả sử dụng vốn (ROE) và biên lợi nhuận ròng cần được tiếp tục cải thiện.")

    # 2. Tăng trưởng
    revenue_growth = ratios.get("revenue_growth", 0)
    profit_growth = ratios.get("profit_growth", 0)
    if revenue_growth > 0 and profit_growth > 0:
        insights.append(f"Doanh nghiệp ghi nhận tăng trưởng tích cực cả về doanh thu (+{revenue_growth}%) và lợi nhuận (+{profit_growth}%).")
    elif revenue_growth < 0 or profit_growth < 0:
        insights.append("Tốc độ tăng trưởng có dấu hiệu chững lại hoặc suy giảm so với kỳ trước, cần theo dõi sức cầu thị trường.")

    # 3. Đòn bẩy tài chính
    de = ratios.get("de_ratio", 0)
    if de > 2.0:
        insights.append(f"Cảnh báo: Tỷ lệ Nợ/Vốn CSH ở mức cao ({de:.2f} lần), doanh nghiệp chịu rủi ro đòn bẩy tài chính lớn.")
    else:
        insights.append(f"Cấu trúc tài chính an toàn với tỷ lệ Nợ/Vốn CSH ở mốc {de:.2f} lần, nằm trong tầm kiểm soát.")

    # 4. Thanh khoản
    current_ratio = ratios.get("current_ratio", 0)
    quick_ratio = ratios.get("quick_ratio", 0)
    if current_ratio >= 1.2:
        insights.append(f"Khả năng thanh toán ngắn hạn đảm bảo (Current Ratio = {current_ratio:.2f} lần, Quick Ratio = {quick_ratio:.2f} lần).")
    else:
        insights.append(f"Cảnh báo áp lực thanh khoản ngắn hạn khi tỷ lệ thanh toán hiện hành chỉ đạt {current_ratio:.2f} lần (< 1.2).")

    return insights
