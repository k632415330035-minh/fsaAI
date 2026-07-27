import StockSymbolInput from "./StockSymbolInput";

export default function CTASection() {
  return (
    <section className="landing-cta-section">
      <div className="landing-container">
        <div className="landing-cta">
          <p>Bắt đầu phân tích</p>
          <h2>Nhập mã cổ phiếu và xem minh họa Financial Health ngay</h2>
          <StockSymbolInput compact />
        </div>
      </div>
    </section>
  );
}
