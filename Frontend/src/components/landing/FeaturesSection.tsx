import { Activity, BarChart3, Bot, CalendarRange, Gauge, LineChart, Scale, TrendingUp } from "lucide-react";
import SectionHeader from "./SectionHeader";

const features = [
  { icon: CalendarRange, title: "Phân tích dữ liệu tài chính 2 năm", description: "Tập trung vào hai kỳ gần nhất để thấy biến động mới nhất." },
  { icon: Gauge, title: "Tính toán ROE và ROA", description: "Đánh giá hiệu quả sinh lời trên vốn và tài sản." },
  { icon: Scale, title: "Đánh giá khả năng thanh toán", description: "Theo dõi Current Ratio để nhận diện rủi ro thanh khoản." },
  { icon: Activity, title: "Phân tích dòng tiền kinh doanh", description: "Kiểm tra chất lượng lợi nhuận qua dòng tiền hoạt động." },
  { icon: TrendingUp, title: "Theo dõi tăng trưởng doanh thu", description: "So sánh xu hướng tăng trưởng giữa các kỳ." },
  { icon: BarChart3, title: "Chấm điểm Financial Health", description: "Tổng hợp các chỉ số thành một điểm sức khỏe tài chính." },
  { icon: LineChart, title: "So sánh xu hướng giữa các kỳ", description: "Nhìn nhanh chỉ số đang tăng, giảm hay ổn định." },
  { icon: Bot, title: "AI tạo insight bằng tiếng Việt", description: "Tóm tắt điểm mạnh, điểm yếu và rủi ro dễ hiểu." }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="landing-section">
      <div className="landing-container">
        <SectionHeader eyebrow="Tính năng chính" title="Bộ công cụ phân tích dành cho fintech hiện đại" />
        <div className="landing-feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article className="landing-feature-card" key={feature.title}>
                <Icon size={24} />
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
