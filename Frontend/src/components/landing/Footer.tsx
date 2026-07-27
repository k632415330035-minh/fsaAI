import { Code2, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="landing-footer">
      <div className="landing-container landing-footer-inner">
        <Link to="/" className="landing-brand footer-brand">
          <span>FA</span>
          <strong>Financial Analytics AI</strong>
        </Link>
        <nav>
          <Link to="/">Trang chủ</Link>
          <Link to="/analysis?symbol=FPT">Phân tích</Link>
          <a href="#features">Tính năng</a>
          <a href="mailto:contact@financial-ai.local">Liên hệ</a>
          <a href="https://github.com" target="_blank" rel="noreferrer"><Code2 size={16} /> Github</a>
          <a href="mailto:contact@financial-ai.local"><Mail size={16} /> Email</a>
        </nav>
      </div>
      <p className="landing-container landing-copyright">Copyright © 2026 Financial Analytics AI. All rights reserved.</p>
    </footer>
  );
}
