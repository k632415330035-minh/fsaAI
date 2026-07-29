import { motion } from "framer-motion";
import { BarChart3, Bot, ShieldCheck, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import StockSymbolInput from "./StockSymbolInput";

export default function HeroSection() {
  return (
    <section className="landing-hero">
      <header className="landing-nav">
        <Link to="/" className="landing-brand">
          <span>FA</span>
          <strong>Financial Analytics AI</strong>
        </Link>
        <nav>
          <a href="#flow">Quy trình</a>
          <a href="#features">Tính năng</a>
          <a href="#preview">Kết quả</a>
        </nav>
        <Link to="/login" className="landing-login-link">Đăng nhập</Link>
      </header>

      <div className="landing-hero-inner">
        <motion.div
          className="landing-hero-copy"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="landing-badge">AI Financial Health Analysis</p>
          <h1>
            <span>Phân tích sức khỏe</span>
            <span>tài chính doanh nghiệp</span>
            <span className="mt-2 block font-extrabold text-blue-300">bằng AI</span>
          </h1>
          <p>
            Chỉ cần nhập mã cổ phiếu, hệ thống sẽ phân tích dữ liệu tài chính trong 2 năm gần nhất,
            tính toán các chỉ số quan trọng và đưa ra đánh giá tổng quan bằng AI.
          </p>
          <StockSymbolInput />
          <div className="landing-hero-actions">
            <a href="#features">Khám phá tính năng</a>
          </div>
        </motion.div>

        <motion.div
          className="landing-hero-preview"
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <div className="landing-preview-window">
            <div className="landing-preview-window-header">
              <div>
                <p>FPT</p>
                <h2>Financial Health: 82/100</h2>
              </div>
              <span>Tốt</span>
            </div>
            <div className="landing-preview-stat-grid">
              <article><TrendingUp size={20} /><p>ROE</p><strong>24.2%</strong></article>
              <article><BarChart3 size={20} /><p>ROA</p><strong>10.8%</strong></article>
              <article><ShieldCheck size={20} /><p>Current Ratio</p><strong>1.72</strong></article>
            </div>
            <div className="landing-preview-bars">
              {[72, 58, 84, 66, 92].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}
            </div>
            <div className="landing-preview-ai">
              <Bot size={20} />
              <p>AI nhận diện khả năng sinh lời cải thiện, dòng tiền kinh doanh tích cực và rủi ro thanh khoản thấp.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
