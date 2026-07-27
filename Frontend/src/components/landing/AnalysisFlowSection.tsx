import { motion } from "framer-motion";
import { Bot, Calculator, Database, Search } from "lucide-react";
import SectionHeader from "./SectionHeader";

const steps = [
  {
    icon: Search,
    title: "Bước 1: Nhập mã cổ phiếu",
    description: "Người dùng nhập mã doanh nghiệp cần phân tích."
  },
  {
    icon: Database,
    title: "Bước 2: Thu thập dữ liệu",
    description: "Hệ thống lấy dữ liệu tài chính trong 2 năm gần nhất."
  },
  {
    icon: Calculator,
    title: "Bước 3: Tính toán chỉ số",
    description: "Tính ROE, ROA, tỷ lệ thanh toán ngắn hạn, dòng tiền kinh doanh và tăng trưởng doanh thu."
  },
  {
    icon: Bot,
    title: "Bước 4: AI đánh giá",
    description: "AI chấm điểm Financial Health và đưa ra insight về điểm mạnh, điểm yếu và rủi ro."
  }
];

export default function AnalysisFlowSection() {
  return (
    <section id="flow" className="landing-section bg-white">
      <div className="landing-container">
        <SectionHeader
          eyebrow="Quy trình hoạt động"
          title="Từ mã cổ phiếu đến đánh giá sức khỏe tài chính"
          description="Luồng phân tích được thiết kế ngắn gọn, dễ hiểu và tập trung vào dữ liệu tài chính trọng yếu."
        />
        <div className="landing-flow-grid">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.article
                className="landing-flow-card"
                key={step.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <span>{index + 1}</span>
                <Icon size={24} />
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
