import { Eye, FileSearch, Lightbulb, Timer, TrendingUp } from "lucide-react";
import SectionHeader from "./SectionHeader";

const benefits = [
  { icon: Timer, title: "Tiết kiệm thời gian đọc báo cáo tài chính" },
  { icon: Eye, title: "Trực quan hóa các chỉ số quan trọng" },
  { icon: TrendingUp, title: "Nhận biết nhanh xu hướng tài chính" },
  { icon: FileSearch, title: "Hỗ trợ người dùng hiểu doanh nghiệp dễ hơn" },
  { icon: Lightbulb, title: "Insight được tạo dựa trên dữ liệu đã phân tích" }
];

export default function BenefitsSection() {
  return (
    <section className="landing-section">
      <div className="landing-container">
        <SectionHeader eyebrow="Lợi ích" title="Hỗ trợ phân tích, không thay thế phán đoán chuyên môn" />
        <div className="landing-benefit-grid">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article className="landing-benefit-card" key={benefit.title}>
                <Icon size={24} />
                <h3>{benefit.title}</h3>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
