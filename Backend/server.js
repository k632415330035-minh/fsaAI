const express = require("express");
const path = require("path");
const {
  createAccount,
  findPublicAccount,
  listAccounts,
  validateLogin
} = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;
const frontendDist = path.join(__dirname, "..", "Frontend", "dist");

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json());

app.post("/api/register", (req, res) => {
  const { studentId, password } = req.body ?? {};
  const normalizedStudentId = String(studentId ?? "").trim();

  if (!/^\d{10}$/.test(normalizedStudentId)) {
    res.status(400).json({ message: "Mã số sinh viên phải đủ 10 chữ số." });
    return;
  }

  if (String(password ?? "").trim().length < 6) {
    res.status(400).json({ message: "Mật khẩu tối thiểu 6 ký tự." });
    return;
  }

  if (findPublicAccount(normalizedStudentId)) {
    res.status(409).json({ message: "Tài khoản đã tồn tại." });
    return;
  }

  const account = createAccount(normalizedStudentId, password.trim());
  res.status(201).json({ account, message: "Đăng ký thành công." });
});

app.post("/api/login", (req, res) => {
  const { studentId, password } = req.body ?? {};
  const account = validateLogin(String(studentId ?? "").trim(), String(password ?? "").trim());

  if (!account) {
    res.status(401).json({ message: "Mã số sinh viên hoặc mật khẩu không đúng." });
    return;
  }

  res.json({ account, message: "Đăng nhập thành công." });
});

app.get("/api/accounts", (req, res) => {
  res.json({ accounts: listAccounts() });
});

app.use(express.static(frontendDist));

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

app.use((req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Frontend is running at http://localhost:${PORT}`);
});
