import { ShieldAlert } from "lucide-react";

export default function DisclaimerSection() {
  return (
    <section className="landing-disclaimer-section">
      <div className="landing-container">
        <div className="landing-disclaimer">
          <ShieldAlert size={24} />
          <p>Hệ thống chỉ cung cấp thông tin phân tích sức khỏe tài chính doanh nghiệp và không phải là khuyến nghị đầu tư.</p>
        </div>
      </div>
    </section>
  );
}
