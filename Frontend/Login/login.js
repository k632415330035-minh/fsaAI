const form = document.getElementById("login-form");
const username = document.getElementById("username");
const password = document.getElementById("password");
const togglePassword = document.querySelector(".toggle-password");

function setError(input, message) {
  const field = input.closest(".field");
  const error = field.querySelector(".error");

  error.textContent = message;
  field.classList.toggle("is-invalid", Boolean(message));
  input.toggleAttribute("aria-invalid", Boolean(message));
}

function validateUsername() {
  const value = username.value.trim();
  const isValid = /^\d{10}$/.test(value);
  setError(username, isValid ? "" : "Ma so sinh vien phai gom dung 10 chu so.");
  return isValid;
}

function validatePassword() {
  const isValid = password.value.trim().length >= 6;
  setError(password, isValid ? "" : "Mat khau toi thieu 6 ky tu.");
  return isValid;
}

username.addEventListener("input", validateUsername);
password.addEventListener("input", validatePassword);

togglePassword.addEventListener("click", () => {
  const isHidden = password.type === "password";
  password.type = isHidden ? "text" : "password";
  togglePassword.setAttribute("aria-label", isHidden ? "An mat khau" : "Hien mat khau");
  togglePassword.setAttribute("title", isHidden ? "An mat khau" : "Hien mat khau");
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const isValid = validateUsername() && validatePassword();
  if (!isValid) return;

  localStorage.setItem("loginUser", username.value.trim());
  window.location.href = "http://localhost:3000/dashboard";
});
