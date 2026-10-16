const API_URL = 'https://api.flashpay.website/api';

const ROLE_PAGES = {
  super_admin: "super_admin/super.html",
  admin: "office_manager/admin.html",
  cashier: "cashier/cashier.html",
  accountant: "accountant/accountant.html",
};

let alertTimer = null;
let alertFadeTimer = null;

/* ---------- عناصر الصفحة ---------- */
const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loadingOverlay = document.getElementById("loadingOverlay");
const capsHint = document.getElementById("capsHint");

document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- تسجيل الدخول ---------- */
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  hideAlert();
  emailInput.classList.remove("is-invalid");
  passwordInput.classList.remove("is-invalid");

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // 1) البريد فارغ
  if (!email) {
    return invalidField(emailInput, "يرجى إدخال البريد الإلكتروني أولاً ⚠️", "warning");
  }

  // 2) صيغة البريد
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return invalidField(emailInput, "صيغة البريد الإلكتروني غير صحيحة ❌");
  }

  // 3) كلمة المرور
  if (password.length < 6) {
    return invalidField(
      passwordInput,
      "كلمة المرور قصيرة جداً، يجب أن تكون 6 رموز على الأقل 🔒"
    );
  }

  setLoading(true);

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok && data.status === "success") {
      localStorage.setItem("auth_token", data.access_token);
      localStorage.setItem("user_data", JSON.stringify(data.user));

      const target = ROLE_PAGES[data.user.role];

      if (target) {
        window.location.href = target;
        return; // نُبقي شاشة التحميل ظاهرة حتى يتم التحويل
      }

      // دور غير معروف: ننظف البيانات حتى لا تبقى جلسة عالقة
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      setLoading(false);
      showAlert("عفواً، لا تملك صلاحية الوصول لهذا النظام.");
    } else {
      setLoading(false);
      showAlert(data.message || "بيانات الدخول غير صحيحة، تأكد من صحة الحساب.");
    }
  } catch (error) {
    setLoading(false);
    showAlert("حدث خطأ في الاتصال بالسيرفر، يرجى المحاولة لاحقاً 🌐");
  }
});

/* ---------- التحقق التلقائي من الجلسة السابقة ---------- */
window.onload = async function () {
  const token = localStorage.getItem("auth_token");
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      localStorage.clear();
      return;
    }

    const data = await response.json();
    const target = ROLE_PAGES[data.user.role];
    if (target) window.location.href = target;
  } catch {
    localStorage.clear();
  }
};

/* ---------- دوال مساعدة ---------- */

// تمييز الحقل الخاطئ + إظهار الرسالة + نقل التركيز إليه
function invalidField(input, message, type = "error") {
  input.classList.add("is-invalid");
  showAlert(message, type);
  input.focus();
}

// حالة التحميل (الزر + الشاشة)
function setLoading(isLoading) {
  loginBtn.disabled = isLoading;
  loginBtn.classList.toggle("is-loading", isLoading);
  loadingOverlay.classList.toggle("show", isLoading);
}

function hideAlert() {
  const box = document.getElementById("errorMessage");
  clearTimeout(alertTimer);
  clearTimeout(alertFadeTimer);
  box.classList.remove("show", "fade-out", "warning");
}

// إظهار التنبيهات (يعتمد على الكلاسات فقط حتى لا يتعطل الإظهار لاحقاً)
function showAlert(message, type = "error") {
  const box = document.getElementById("errorMessage");
  const text = document.getElementById("errorText");
  const icon = box.querySelector("i");

  // إلغاء المؤقتات القديمة كي لا يختفي التنبيه الجديد قبل وقته
  clearTimeout(alertTimer);
  clearTimeout(alertFadeTimer);

  box.classList.remove("show", "fade-out", "warning");
  void box.offsetWidth; // إعادة تشغيل حركة الظهور

  if (type === "warning") {
    icon.className = "fa-solid fa-triangle-exclamation";
    box.classList.add("warning");
  } else {
    icon.className = "fa-solid fa-circle-xmark";
  }

  text.textContent = message;
  box.classList.add("show");

  // إخفاء تلقائي بعد 5 ثوانٍ
  alertTimer = setTimeout(() => {
    box.classList.add("fade-out");
    alertFadeTimer = setTimeout(() => {
      box.classList.remove("show", "fade-out", "warning");
    }, 400);
  }, 5000);
}

// إظهار/إخفاء كلمة المرور
function togglePasswordVisibility() {
  const btn = document.getElementById("togglePassword");
  const icon = document.getElementById("eyeIcon");
  const show = passwordInput.type === "password";

  passwordInput.type = show ? "text" : "password";
  icon.className = show ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
  btn.setAttribute("aria-pressed", String(show));
  btn.setAttribute("aria-label", show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور");
}

// إزالة علامة الخطأ بمجرد أن يبدأ المستخدم بالتعديل
[emailInput, passwordInput].forEach((input) =>
  input.addEventListener("input", () => input.classList.remove("is-invalid"))
);

// تنبيه Caps Lock
function updateCapsHint(e) {
  if (typeof e.getModifierState !== "function") return;
  capsHint.classList.toggle("show", e.getModifierState("CapsLock"));
}
passwordInput.addEventListener("keydown", updateCapsHint);
passwordInput.addEventListener("keyup", updateCapsHint);
passwordInput.addEventListener("blur", () => capsHint.classList.remove("show"));
