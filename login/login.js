const API_URL = 'https://flashpay-back-1.onrender.com/api';

document
  .getElementById("login-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const errorMessage = document.getElementById("errorMessage");
    const errorText = document.getElementById("errorText");
    const loadingOverlay = document.getElementById("loadingOverlay");

    // إعادة ضبط الحالة الأصلية
    errorMessage.classList.remove("show");
    emailInput.classList.remove("is-invalid");
    passwordInput.classList.remove("is-invalid");

    // --- التحقق الذكي (Validation) ---

    if (!emailInput.value.trim()) {
      emailInput.classList.add("is-invalid");
      showAlert("يرجى إدخال البريد الإلكتروني أولاً ⚠️", "warning");
      emailInput.focus();
      return;
    }
    // 1. التحقق من البريد الإلكتروني
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailInput.value.trim())) {
      showAlert("عذراً، صيغة البريد الإلكتروني غير مدعومة ❌");
      errorText.textContent = "عذراً، البريد الإلكتروني الذي أدخلته غير صحيح.";
      errorMessage.classList.add("show");
      emailInput.classList.add("is-invalid");
      emailInput.focus();
      return;
    }

    // 2. التحقق من كلمة المرور
    if (passwordInput.value.length < 6) {
      errorText.textContent =
        "أمنك يهمنا.. يجب أن تتكون كلمة المرور من 6 رموز على الأقل.";
      errorMessage.classList.add("show");
      passwordInput.classList.add("is-invalid");
      showAlert("كلمة المرور قصيرة جداً، يجب أن تكون 6 رموز على الأقل 🔒");
      passwordInput.focus();
      return;
    }

    // إظهار التحميل في حال كانت البيانات سليمة
    loadingOverlay.classList.add("show");

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: emailInput.value.trim(),
          password: passwordInput.value,
        }),
      });

      const data = await response.json();
      loadingOverlay.classList.remove("show");

      if (response.ok && data.status === "success") {
        localStorage.setItem("auth_token", data.access_token);
        localStorage.setItem("user_data", JSON.stringify(data.user));

        const role = data.user.role;
        switch (role) {
          case "super_admin":
            window.location.href = "super_admin/super.html";
            break;
          case "admin":
            window.location.href = "office_manager/admin.html";
            break;
          case "cashier":
            window.location.href = "cashier/cashier.html";
            break;
          case "accountant":
            window.location.href = "accountant/accountant.html";
            break;

          default:
            errorText.textContent = "عفواً، لا تملك صلاحية الوصول لهذا النظام.";
            errorMessage.classList.add("show");
        }
      } else {
        showAlert(
          data.message || "بيانات الدخول غير صحيحة، تأكد من صحة الحساب.",
        );
      }
    } catch (error) {
      loadingOverlay.classList.remove("show");
      showAlert("حدث خطأ في الاتصال بالسيرفر، يرجى المحاولة لاحقاً 🌐");
      errorMessage.classList.add("show");
    }
  });

// بقية كود window.onload كما هو في الملف الأصلي...
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
    const user = data.user;

    if (user.role === "super_admin")
      window.location.href = "super_admin/super.html";
    else if (user.role === "admin")
      window.location.href = "office_manager/admin.html";
    else if (user.role === "cashier")
      window.location.href = "cashier/cashier.html";
    else if (user.role === "accountant")
      window.location.href = "accountant/accountant.html";
  } catch {
    localStorage.clear();
  }
};
// دالة مساعدة لإظهار التنبيهات بشكل احترافي
function showAlert(message, type = "error") {
  const errorBox = document.getElementById("errorMessage");
  const errorText = document.getElementById("errorText");
  const icon = errorBox.querySelector("i");

  // تغيير الأيقونة واللون بناءً على النوع
  if (type === "error") {
    icon.className = "fa-solid fa-circle-xmark";
    errorBox.style.borderRightColor = "#ff4d4d";
  } else if (type === "warning") {
    icon.className = "fa-solid fa-triangle-exclamation";
    errorBox.style.borderRightColor = "#fbbf24";
  }

  errorText.textContent = message;
  errorBox.style.display = "flex";
  errorBox.classList.remove("fade-out");
  errorBox.classList.add("show");

  // إخفاء التنبيه تلقائياً بعد 5 ثوانٍ
  setTimeout(() => {
    errorBox.classList.add("fade-out");
    setTimeout(() => {
      errorBox.style.display = "none";
    }, 500);
  }, 5000);
}
