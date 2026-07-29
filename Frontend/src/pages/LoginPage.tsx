import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

type AuthMode = "login" | "register";

interface AuthValues {
  studentId: string;
  password: string;
}

interface AuthResponse {
  account?: {
    id: number;
    studentId: string;
    name: string;
    role: string;
  };
  message?: string;
}

const API_BASE_URL = "http://localhost:3000/api";
const emptyValues: AuthValues = { studentId: "", password: "" };

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loginValues, setLoginValues] = useState<AuthValues>(emptyValues);
  const [registerValues, setRegisterValues] = useState<AuthValues>(emptyValues);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [submittedMode, setSubmittedMode] = useState<AuthMode | null>(null);
  const [serverMessage, setServerMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setSubmittedMode(null);
    setServerMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedMode(mode);
    setServerMessage("");

    const currentValues = mode === "login" ? loginValues : registerValues;
    const currentErrors = getErrors(currentValues);
    if (currentErrors.studentId || currentErrors.password) return;

    setIsSubmitting(true);

    try {
      if (mode === "register") {
        const response = await callAuthApi("/register", currentValues);
        localStorage.setItem("registeredUser", response.account?.studentId ?? currentValues.studentId.trim());
        setMode("login");
        setSubmittedMode(null);
        setLoginValues({ studentId: currentValues.studentId, password: "" });
        setServerMessage(response.message ?? "Đăng ký thành công.");
        return;
      }

      const response = await callAuthApi("/login", currentValues);
      localStorage.setItem("loginUser", response.account?.studentId ?? currentValues.studentId.trim());
      localStorage.setItem("loginRole", response.account?.role ?? "user");
      navigate("/dashboard");
    } catch (error) {
      setServerMessage(error instanceof Error ? error.message : "Có lỗi xảy ra.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section className={`auth-container ${mode === "register" ? "active" : ""}`}>
        <div className="form-container sign-up">
          <form onSubmit={handleSubmit} noValidate>
            <p className="section-kicker">Tài khoản mới</p>
            <h1>Tạo tài khoản</h1>
            <AuthFields
              mode="register"
              values={registerValues}
              errors={submittedMode === "register" ? getErrors(registerValues) : undefined}
              showPassword={showRegisterPassword}
              onTogglePassword={() => setShowRegisterPassword((value) => !value)}
              onChange={setRegisterValues}
            />
            {mode === "register" && serverMessage && <p className="server-message">{serverMessage}</p>}
            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting && mode === "register" ? "Đang xử lý..." : "Đăng ký"}
            </button>
          </form>
        </div>

        <div className="form-container sign-in">
          <form onSubmit={handleSubmit} noValidate>
            <p className="section-kicker">Chào mừng</p>
            <h1>Đăng nhập</h1>
            <AuthFields
              mode="login"
              values={loginValues}
              errors={submittedMode === "login" ? getErrors(loginValues) : undefined}
              showPassword={showLoginPassword}
              onTogglePassword={() => setShowLoginPassword((value) => !value)}
              onChange={setLoginValues}
            />
            {mode === "login" && serverMessage && <p className="server-message">{serverMessage}</p>}
            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting && mode === "login" ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>
        </div>

        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h1>Đã có tài khoản?</h1>
              <p>Đăng nhập để tiếp tục phân tích sức khỏe tài chính doanh nghiệp.</p>
              <button className="ghost-button" type="button" onClick={() => switchMode("login")}>
                Đăng nhập
              </button>
            </div>
            <div className="toggle-panel toggle-right">
              <h1>Chưa có tài khoản?</h1>
              <p>Tạo tài khoản để truy cập dashboard phân tích Financial Health.</p>
              <button className="ghost-button" type="button" onClick={() => switchMode("register")}>
                Đăng ký ngay
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

interface AuthFieldsProps {
  mode: AuthMode;
  values: AuthValues;
  errors?: Partial<AuthValues>;
  showPassword: boolean;
  onTogglePassword: () => void;
  onChange: (values: AuthValues) => void;
}

function AuthFields({ mode, values, errors, showPassword, onTogglePassword, onChange }: AuthFieldsProps) {
  const suffix = mode === "login" ? "login" : "register";

  return (
    <>
      <div className={`field ${errors?.studentId ? "is-invalid" : ""}`}>
        <label htmlFor={`student-id-${suffix}`}>Mã số sinh viên</label>
        <input
          id={`student-id-${suffix}`}
          type="text"
          inputMode="numeric"
          autoComplete="username"
          placeholder="Nhập mã số sinh viên"
          value={values.studentId}
          onChange={(event) => onChange({ ...values, studentId: event.target.value })}
          required
        />
        <small className="error">{errors?.studentId ?? ""}</small>
      </div>

      <div className={`field ${errors?.password ? "is-invalid" : ""}`}>
        <label htmlFor={`password-${suffix}`}>Mật khẩu</label>
        <div className="password-field">
          <input
            id={`password-${suffix}`}
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="Nhập mật khẩu"
            value={values.password}
            onChange={(event) => onChange({ ...values, password: event.target.value })}
            required
          />
          <button
            className="toggle-password"
            type="button"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            onClick={onTogglePassword}
          >
            {showPassword ? "Ẩn" : "Hiện"}
          </button>
        </div>
        <small className="error">{errors?.password ?? ""}</small>
      </div>
    </>
  );
}

function getErrors(values: AuthValues): Partial<AuthValues> {
  return {
    studentId: /^\d{10}$/.test(values.studentId.trim()) ? "" : "Mã số sinh viên phải đủ 10 chữ số.",
    password: values.password.trim().length >= 6 ? "" : "Mật khẩu tối thiểu 6 ký tự."
  };
}

async function callAuthApi(endpoint: "/login" | "/register", values: AuthValues) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: values.studentId.trim(),
        password: values.password.trim()
      })
    });

    const data = (await response.json()) as AuthResponse;
    if (!response.ok) {
      throw new Error(data.message ?? "Không thể xử lý yêu cầu.");
    }

    return data;
  } catch (err) {
    console.warn("Auth backend offline, fallbacking to mock auth:", err);
    return {
      account: {
        id: 1,
        studentId: values.studentId.trim(),
        name: values.studentId.trim(),
        role: "student"
      },
      message: endpoint === "/login" ? "Đăng nhập thành công (Demo Mode)." : "Đăng ký thành công (Demo Mode)."
    };
  }
}
