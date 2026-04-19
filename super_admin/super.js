const API_URL = "https://flashpay-back-1.onrender.com/api";
const STORAGE_URL = "https://flashpay-back-1.onrender.com/storage"; // ✅ يُستخدم مع receiver_id_image مباشرة (مثال: receipts/filename.jpg)

/* =========================
   Auth Check
========================= */
async function checkAuth() {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        window.location.replace('../login/login.html');
        return null;
    }

    try {
        const res = await fetch('https://flashpay-back-1.onrender.com/api/me', {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Accept': 'application/json',
            }
        });

        if (!res.ok) {
            localStorage.clear();
            window.location.replace('../login/login.html');
            return null;
        }

        const data = await res.json();
        const userRole = data.user.role;

        const ALLOWED_ROLES = ['super_admin'];

        // 🔴 التحقق من الصلاحية
        if (!ALLOWED_ROLES.includes(userRole)) {
            // 1. عرض الـ Lottie
            showUnauthorizedLottie();
            
            // 2. الانتظار لمدة 3 ثوانٍ ثم التوجيه
            setTimeout(() => {
                redirectByRole(userRole);
            }, 1000); 
            
            return null;
        }

        return token;

    } catch (e) {
        localStorage.clear();
        showUnauthorizedLottie();
        return null;
    }
}

// 🟢 دالة لعرض الـ Lottie بملء الشاشة
function showUnauthorizedLottie() {
    // إنشاء حاوية تغطي الشاشة بالكامل
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.backgroundColor = '#ffffff'; // لون الخلفية (يمكنك تغييره)
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.zIndex = '9999';
    
    // إضافة نص توضيحي (اختياري)
    const text = document.createElement('h2');
    text.innerText = 'عذراً، ليس لديك صلاحية للوصول إلى هذه الصفحة';
    text.style.fontFamily = 'Arial, sans-serif';
    text.style.color = '#333';
    text.style.marginTop = '20px';

    // حاوية الأنيميشن
    const lottieContainer = document.createElement('div');
    lottieContainer.style.width = '300px'; // حجم الأنيميشن
    lottieContainer.style.height = '300px';

    container.appendChild(lottieContainer);
    container.appendChild(text);
    document.body.appendChild(container);

    // تشغيل الأنيميشن
    lottie.loadAnimation({
        container: lottieContainer, 
        renderer: 'svg',
        loop: true,
        autoplay: true,
        // ⚠️ ضع رابط ملف الـ JSON الخاص بالـ Lottie هنا
        path: 'https://assets3.lottiefiles.com/packages/lf20_0s6tfbuc.json' 
    });
}

function redirectByRole(role) {
    const routes = {
        'super_admin': '../super_admin/super.html',
        'admin':       '../office_manager/admin.html',
        'cashier':     '../cashier/cashier.html',
        'accountant':  '../accountant/accountant.html',
        'agent':       '../agent/agent.html',
        'customer':    '../customer/customer.html',
    };
    window.location.replace(routes[role] || '../login/login.html');
}
/* =========================
   Helpers
========================= */
function getHeaders() {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}
async function fetchCurrencies() {
  try {
    const res = await fetch(`${API_URL}/currencies`, {
      headers: getHeaders(),
    });

    console.log("Currencies status:", res.status);

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = "/FlashPay-Front/login/login.html";
      return [];
    }

    const json = await res.json();
    console.log("Currencies RAW:", json);

    return Array.isArray(json) ? json : (json.data ?? []);
  } catch (error) {
    console.error("Currencies Fetch Error:", error);
    return [];
  }
}
async function loadCurrencies() {
    const tbody = document.getElementById('currencies-table-body');
    const sel   = document.getElementById('currency-select');
    const selMain = document.getElementById('main-currency-select');
    if (!tbody) return;
 
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:28px;color:var(--gray);">
        <i class="fa-solid fa-spinner fa-spin" style="font-size:18px;"></i> جاري التحميل...
    </td></tr>`;
 
    try {
        const res  = await fetch(`${API_URL}/currencies`, { headers: getHeaders() });
        const json = await res.json();
        allCurrencies = json.data || json || [];
 
        // 1. تعريف المتغير الذي يحتوي على الخيارات (هذا ما كان ينقصك)
        const optionsHtml = allCurrencies.map(c =>
            `<option value="${c.id}">${c.name} (${c.code})</option>`
        ).join('');
 
        // 2. تعبئة قائمة تحديث السعر العادي
        if (sel) {
            sel.innerHTML = `<option value="">اختر العملة</option>` + optionsHtml;
        }

        // 3. تعبئة قائمة تحديث السعر الرئيسي
        if (selMain) {
            selMain.innerHTML = `<option value="">اختر العملة</option>` + optionsHtml;
        }

        renderCurrenciesTable(allCurrencies);
 
    } catch(err) {
        console.error('loadCurrencies:', err);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--danger);padding:20px;">خطأ في التحميل</td></tr>`;
    }
}
function fillSelect(select, data, placeholder = "اختر من القائمة") {
  if (!select) return;

  select.innerHTML = `<option value="">${placeholder}</option>`;
  data.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name || item.code;
    select.appendChild(option);
  });
}

// async function loadSafes() {
//     const grid = document.getElementById('office-safes-grid');
//     const emptyEl = document.getElementById('safes-empty');
//     if (!grid) return;

//     grid.innerHTML = '<div class="safes-skeleton-grid">' +
//         Array(4).fill('<div class="safe-card-skeleton"></div>').join('') +
//         '</div>';
//     if (emptyEl) emptyEl.classList.add('hidden');

//     try {
//         const res = await fetch(`${API_URL}/safes`, { headers: getHeaders() });
//         const json = await res.json();

//         // فلترة صناديق المكاتب فقط
//         const officeSafes = (json.data || [])
//             .filter(s => s.type === 'office_safe')
//             .sort((a, b) => (a.owner || '').localeCompare(b.owner || ''));

//         grid.innerHTML = '';

//         // تحديث Hero stats
//         const total = officeSafes.reduce((sum, s) => sum + parseFloat(s.balance || 0), 0);
//         const totalEl = document.getElementById('safes-total-balance');
//         const countEl = document.getElementById('safes-office-count');
//         if (totalEl) totalEl.textContent = '$' + total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
//         if (countEl) countEl.textContent = officeSafes.length;

//         // تحديث عداد الداشبورد
//         const dashSafes = document.getElementById('dash-safes-count');
//         if (dashSafes) dashSafes.textContent = officeSafes.length;

//         if (officeSafes.length === 0) {
//             if (emptyEl) emptyEl.classList.remove('hidden');
//             return;
//         }

//         officeSafes.forEach(safe => {
//             const balance = parseFloat(safe.balance || 0);
//             const isPositive = balance >= 0;
//             const initials = (safe.owner || '?').charAt(0).toUpperCase();
//             // تصنيف لوني حسب الرصيد
//             const levelClass = balance >= 10000 ? 'safe-level-high'
//                              : balance >= 1000  ? 'safe-level-mid'
//                              : 'safe-level-low';

//             const card = document.createElement('div');
//             card.className = `office-safe-card ${levelClass}`;
//             card.dataset.owner = (safe.owner || '').toLowerCase();
//             card.innerHTML = `
//                 <div class="osc-header">
//                     <div class="osc-avatar">${initials}</div>
//                     <div class="osc-info">
//                         <div class="osc-name">${safe.owner || '—'}</div>
//                         <div class="osc-badge"><i class="fa-solid fa-building"></i> صندوق مكتب</div>
//                     </div>
//                     <div class="osc-status-dot ${isPositive ? 'dot-green' : 'dot-red'}"></div>
//                 </div>
//                 <div class="osc-divider"></div>
//                 <div class="osc-balance">
//                     <span class="osc-balance-label">الرصيد الحالي</span>
//                     <span class="osc-balance-value ${isPositive ? 'bal-positive' : 'bal-negative'}">
//                         $${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </span>
//                 </div>
//                 <div class="osc-footer">
//                     <div class="osc-meta">
//                         <i class="fa-solid fa-circle-dollar-to-slot"></i>
//                         <span>USD</span>
//                     </div>
//                     <button class="osc-detail-btn" onclick='openSafeDetails(${JSON.stringify(safe)})'>
//                         <i class="fa-solid fa-eye"></i> التفاصيل
//                     </button>
//                 </div>
//             `;
//             grid.appendChild(card);
//         });

//     } catch (e) {
//         console.error('loadSafes error:', e);
//         grid.innerHTML = '<p style="text-align:center;color:var(--danger);padding:32px;">تعذّر تحميل الصناديق</p>';
//     }
// }

function filterSafeCards() {
  const q = (
    document.getElementById("safes-search")?.value || ""
  ).toLowerCase();
  document.querySelectorAll(".office-safe-card").forEach((card) => {
    card.style.display = card.dataset.owner?.includes(q) ? "" : "none";
  });
}

function openSafeDetails(safe) {
  document.getElementById("detail-type").textContent = safe.type;
  document.getElementById("detail-owner").textContent = safe.owner;
  document.getElementById("detail-currency").textContent = safe.currency ?? "-";
  document.getElementById("detail-balance").textContent =
    "$" + parseFloat(safe.balance).toFixed(2);
  document.getElementById("detail-cost").textContent = safe.cost ?? "-";

  document.getElementById("safe-details-modal").classList.remove("hidden");
}

function closeSafeDetails() {
  document.getElementById("safe-details-modal").classList.add("hidden");
}

/* =========================
   API Calls
========================= */
async function fetchCountries() {
  try {
    const res = await fetch(`${API_URL}/countries`, {
      headers: getHeaders(),
    });

    console.log("Countries status:", res.status);

    const json = await res.json();
    console.log("Countries response:", json);

    return json.data || json || [];
  } catch (error) {
    console.error("Error fetching countries:", error);
    return [];
  }
}
async function fetchCitiesByCountry(countryId) {
  try {
    const res = await fetch(`${API_URL}/cities?country_id=${countryId}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      console.error("HTTP Error:", res.status);
      return [];
    }

    const json = await res.json();
    console.log("Cities:", json); // للتأكد

    return json.data || [];
  } catch (error) {
    console.error("Error fetching cities:", error);
    return [];
  }
}
/* =========================
   Init Office Cities
========================= */
async function initOfficeCities() {
  const citySelect = document.getElementById("office-city-select");
  const cities = await fetchCitiesByCountry(1); // سوريا
  console.log("Office Cities:", cities); // للتأكد
  fillSelect(citySelect, cities, "اختر المدينة");
}

/* =========================
   Init Agent Location
========================= */
async function initAgentLocation() {
  const countrySelect = document.getElementById("agent-country-select");
  const citySelect = document.getElementById("agent-city-select");

  const countries = await fetchCountries();
  fillSelect(countrySelect, countries, "اختر الدولة");

  countrySelect.addEventListener("change", async (e) => {
    const countryId = e.target.value;

    if (!countryId) {
      citySelect.innerHTML = '<option value="">اختر الدولة أولاً</option>';
      return;
    }

    citySelect.innerHTML = "<option>جاري التحميل...</option>";
    const cities = await fetchCitiesByCountry(countryId);
    fillSelect(citySelect, cities, "اختر المدينة");
  });
}

/* =========================
   Load Offices
========================= */
/* =========================
   Load Offices
========================= */
async function loadOffices() {
  try {
    const userRes = await fetch(`${API_URL}/me`, { headers: getHeaders() });
    const userData = await userRes.json();
    const isSuperAdmin = userData.user.role === "super_admin";

    const res = await fetch(`${API_URL}/offices`, { headers: getHeaders() });
    const json = await res.json();
    const tbody = document.getElementById("offices-list");
    if (!tbody) return;

    tbody.innerHTML = "";

    const offices = json.data || [];

    // تحديث الإحصائيات
    const totalBalance = offices.reduce(
      (sum, o) => sum + parseFloat(o.office_safe?.balance || 0),
      0,
    );
    const countEl = document.getElementById("stat-offices-count");
    const balEl = document.getElementById("stat-offices-balance");
    if (countEl) countEl.textContent = offices.length;
    if (balEl) balEl.textContent = "$" + totalBalance.toFixed(2);

    if (offices.length === 0) {
      document.getElementById("offices-empty")?.classList.remove("hidden");
      return;
    }
    document.getElementById("offices-empty")?.classList.add("hidden");

    offices.forEach((office, index) => {
      const balance = parseFloat(office.office_safe?.balance || 0).toFixed(2);
      const cityName = office.city?.name || "غير محدد";
      const initials = (office.name || "?").charAt(0).toUpperCase();

      const actionsHtml = isSuperAdmin
        ? `
                <div class="row-actions">
                    <button class="action-btn edit-btn" title="تعديل" onclick='openEditOfficeModal(${JSON.stringify(office)})'>
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn delete-btn" title="حذف" onclick="openDeleteOfficeModal(${office.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>`
        : `<span style="color:var(--gray);font-size:12px;">—</span>`;

      tbody.innerHTML += `
                <tr>
                    <td style="color:var(--gray);font-size:12px;">${index + 1}</td>
                    <td>
                        <div class="emp-cell">
                            <div class="emp-avatar" style="background:#dbeafe;color:#1d4ed8;">${initials}</div>
                            <div style="font-weight:700;font-size:13px;">${office.name}</div>
                        </div>
                    </td>
                    <td><span class="location-tag"><i class="fa-solid fa-city"></i> ${cityName}</span></td>
                    <td style="font-size:12px;color:var(--gray);">${office.address || "—"}</td>
                    <td>
                        <span style="font-weight:800;color:var(--success);">$${balance}</span>
                    </td>
                    <td>${actionsHtml}</td>
                </tr>`;
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

/* =========================
   Logic: Delete Office
========================= */
let currentOfficeIdToDelete = null;

function openDeleteOfficeModal(id) {
  currentOfficeIdToDelete = id;
  document.getElementById("delete-office-modal").classList.remove("hidden");
}

function closeDeleteOfficeModal() {
  document.getElementById("delete-office-modal").classList.add("hidden");
}

document.getElementById("confirm-delete-office-btn").onclick = async () => {
  if (!currentOfficeIdToDelete) return;
  const notyf = new Notyf({
    duration: 3000,
    position: { x: "left", y: "bottom" },
  });
  try {
    const res = await fetch(`${API_URL}/offices/${currentOfficeIdToDelete}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (res.ok) {
      closeDeleteOfficeModal();
      await loadOffices();
      notyf.success("تم حذف المكتب بنجاح");
    } else {
      notyf.error("حدث خطأ أثناء الحذف");
    }
  } catch (e) {
    console.error(e);
  }
};

/* =========================
   Logic: Edit Office
========================= */
async function openEditOfficeModal(office) {
  document.getElementById("edit-office-id").value = office.id;
  document.getElementById("edit-office-name").value = office.name;
  document.getElementById("edit-office-address").value = office.address || "";

  // جلب المدن وتعبئتها
  const citySelect = document.getElementById("edit-office-city-select");
  const cities = await fetchCitiesByCountry(1); // 1 هي سوريا حسب الكود الخاص بك
  fillSelect(citySelect, cities, "اختر المدينة");

  // تحديد المدينة الحالية للمكتب
  citySelect.value = office.city_id || "";

  document.getElementById("edit-office-modal").classList.remove("hidden");
}

function closeEditOfficeModal() {
  document.getElementById("edit-office-modal").classList.add("hidden");
}

document.getElementById("edit-office-form").onsubmit = async (e) => {
  e.preventDefault();
  const id = document.getElementById("edit-office-id").value;

  const data = {
    name: document.getElementById("edit-office-name").value,
    city_id: parseInt(document.getElementById("edit-office-city-select").value),
    address: document.getElementById("edit-office-address").value,
  };

  try {
    const res = await fetch(`${API_URL}/offices/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (res.ok) {
      alert("تم تحديث بيانات المكتب بنجاح");
      closeEditOfficeModal();
      loadOffices(); // تحديث الجدول
    } else {
      alert("خطأ: " + (result.message || "فشل التحديث"));
    }
  } catch (error) {
    console.error(error);
    alert("خطأ في الاتصال بالخادم");
  }
};

/* =========================
   Add Office
========================= */
document
  .getElementById("add-office-form")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    // إعداد مكتبة التنبيهات Notyf بستايلك الخاص
    const notyf = new Notyf({
      duration: 4000,
      position: { x: "left", y: "bottom" },
      types: [
        {
          type: "error",
          background: "#ef4444",
          icon: { className: "fa-solid fa-circle-exclamation", color: "white" },
        },
        {
          type: "success",
          background: "#10b981",
          icon: { className: "fa-solid fa-check-circle", color: "white" },
        },
      ],
    });

    // دالة مساعدة للتعامل مع الأخطاء والتركيز
    const triggerFieldError = (elementId, message) => {
      const el = document.getElementById(elementId);
      el.classList.add("input-error");
      el.focus();
      // إزالة اللون الأحمر بمجرد أن يبدأ المستخدم بالكتابة أو الاختيار
      el.addEventListener("input", () => el.classList.remove("input-error"), {
        once: true,
      });
      el.addEventListener("change", () => el.classList.remove("input-error"), {
        once: true,
      });
      notyf.error(message);
    };

    // جلب العناصر
    const nameEl = document.getElementById("office-name");
    const cityEl = document.getElementById("office-city-select");
    const balanceEl = document.getElementById("office-balance");
    const addressEl = document.getElementById("office-address");

    // --- عملية التحقق (Validation) ---

    if (!nameEl.value.trim()) {
      triggerFieldError("office-name", "يرجى إدخال اسم المكتب");
      return;
    }

    if (!cityEl.value) {
      triggerFieldError(
        "office-city-select",
        "يرجى اختيار المدينة التابع لها المكتب",
      );
      return;
    }

    if (balanceEl.value === "" || parseFloat(balanceEl.value) < 0) {
      triggerFieldError(
        "office-balance",
        "يرجى تحديد رصيد افتتاحي صحيح (0 أو أكثر)",
      );
      return;
    }

    // تجهيز البيانات
    const data = {
      name: nameEl.value.trim(),
      city_id: parseInt(cityEl.value),
      address: addressEl.value.trim(),
      status: 1,
      balance: parseFloat(balanceEl.value) || 0,
    };

    try {
      // إظهار حالة تحميل بسيطة (اختياري)
      const btn = e.target.querySelector('button[type="submit"]');
      const originalText = btn.innerText;
      btn.innerText = "جاري الحفظ...";
      btn.disabled = true;

      const res = await fetch(`${API_URL}/offices`, {
        method: "POST",
        headers: {
          ...getHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        notyf.success("تم إنشاء المكتب الجديد بنجاح");
        await loadOffices(); // تحديث القائمة
        e.target.reset(); // تفريغ النموذج
      } else {
        notyf.error(result.message || "فشل في حفظ البيانات");
      }

      // إعادة الزر لحالته
      btn.innerText = originalText;
      btn.disabled = false;
    } catch (error) {
      notyf.error("حدث خطأ في الاتصال بالخادم");
      console.error(error);

      // إعادة الزر لحالته في حال الخطأ
      const btn = e.target.querySelector('button[type="submit"]');
      btn.innerText = "حفظ المكتب";
      btn.disabled = false;
    }
  });
async function loadOfficesForSelect() {
  try {
    const res = await fetch(`${API_URL}/offices`, {
      headers: getHeaders(),
    });

    const json = await res.json();

    const officeSelect = document.getElementById("emp-office");
    if (!officeSelect) return;

    officeSelect.innerHTML = `<option value="">اختر المكتب</option>`;

    json.data.forEach((office) => {
      const option = document.createElement("option");
      option.value = office.id;
      option.textContent = office.name;
      officeSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading offices for select:", error);
  }
}
/* =========================
   Add Employee / Agent
========================= */
/* =========================
   Add Employee / Agent
========================= */
document
  .getElementById("add-employee-form")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const notyf = new Notyf({
      duration: 4000,
      position: { x: "left", y: "bottom" },
      types: [
        {
          type: "error",
          background: "#ef4444",
          icon: { className: "fa-solid fa-circle-exclamation", color: "white" },
        },
        {
          type: "success",
          background: "#10b981",
          icon: { className: "fa-solid fa-check-circle", color: "white" },
        },
      ],
    });

    const triggerError = (elementId, message) => {
      const el = document.getElementById(elementId);
      el.classList.add("input-error");
      el.focus();
      el.addEventListener("input", () => el.classList.remove("input-error"), {
        once: true,
      });
      notyf.error(message);
    };

    const role = document.getElementById("emp-role").value;
    const emailEl = document.getElementById("emp-email");
    const phoneEl = document.getElementById("emp-phone");
    const passEl = document.getElementById("emp-password");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailEl.value.trim())) {
      triggerError("emp-email", "يرجى إدخال بريد إلكتروني صحيح");
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneEl.value.trim())) {
      triggerError("emp-phone", "رقم الهاتف يجب أن يتكون من 10 أرقام");
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(passEl.value)) {
      triggerError(
        "emp-password",
        "كلمة المرور يجب أن تكون 8 خانات مع أرقام وحروف",
      );
      return;
    }

    /* ================= إرسال البيانات ================= */
    let data = {
      name: document.getElementById("emp-name").value.trim(),
      email: emailEl.value.trim(),
      phone: phoneEl.value.trim(),
      password: passEl.value,
      password_confirmation: passEl.value, // 👈 إضافة ضرورية لتجاوز فحص كلمة المرور في لارافيل
      role: role,
    };

    if (role === "agent") {
      data.country_id =
        document.getElementById("agent-country-select").value || null;
      data.city_id = document.getElementById("agent-city-select").value || null;
      data.balance = document.getElementById("emp-balance").value || 0;
       const ratioVal =
        parseFloat(document.getElementById("emp-profit-ratio")?.value) || 0;
      data.agent_profit_ratio = Math.min(100, Math.max(0, ratioVal));
    } else {
      // 👈 التحقق من اختيار المكتب للموظفين
      const officeId = document.getElementById("emp-office").value;
      if (!officeId) {
        triggerError("emp-office", "يرجى اختيار المكتب التابع له الموظف أولاً");
        return;
      }
      data.office_id = officeId;
      // إرسال قيم فارغة لتفادي حظر لارافيل بسبب غياب الدولة والمدينة
      data.country_id = null;
      data.city_id = null;
    }

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: getHeaders(), // 👈 سيتم الآن إرسال Accept: application/json
        body: JSON.stringify(data),
      });

      // 👈 قراءة الرد الفعلي من السيرفر لمعرفة سبب الرفض إن وجد
      const json = await res.json();

      if (res.ok) {
        notyf.success("تم إضافة الموظف بنجاح إلى النظام");
         if (role === "agent" && json?.data?.id) {
        const ratio =
          parseFloat(document.getElementById("emp-profit-ratio")?.value) || 0;
        if (ratio > 0) {
          try {
            await fetch(`${API_URL}/agent/profit-ratio`, {
              method: "PATCH",
              headers: getHeaders(),
              body: JSON.stringify({
                agent_id: json.data.id,
                agent_profit_ratio: ratio,
              }),
            });
          } catch (_) {
            // non-blocking
          }
        }
      }
        e.target.reset();
        handleRoleChange();
        await loadEmployees();
      } else {
        // الآن سيظهر لك الخطأ الحقيقي القادم من قاعدة البيانات بدلاً من "النجاح الوهمي"
        notyf.error(
          json.message ||
            "تأكد من إدخال جميع البيانات، الإيميل أو الهاتف قد يكون مسجلاً مسبقاً",
        );
        console.log("Validation Errors:", json.errors);
      }
    } catch (error) {
      notyf.error("خطأ في الاتصال بالسيرفر");
    }
  });
/* =========================
   Load Employees & Agents
========================= */
/* =========================
   Load Employees (Updated)
========================= */
async function loadEmployees() {
  try {
    const res = await fetch(`${API_URL}/users`, { headers: getHeaders() });
    const json = await res.json();
    _allEmployees = json.data || [];
    renderEmployeesStats();
    renderEmployeesTable();
  } catch (e) {
    console.error(e);
  }
}

/* =========================
   Delete Logic (Custom Dialog)
========================= */
let currentUserIdToDelete = null;
function openDeleteModal(id) {
  currentUserIdToDelete = id;
  document.getElementById("delete-modal").classList.remove("hidden");
}
function closeDeleteModal() {
  document.getElementById("delete-modal").classList.add("hidden");
}
/* =========================
   Logic: Delete & Edit
========================= */

// دالة الحذف المحدثة
document.getElementById("confirm-delete-btn").onclick = async () => {
  if (!currentUserIdToDelete) return;
  const notyf = new Notyf({
    duration: 3000,
    position: { x: "left", y: "bottom" },
  });
  try {
    const res = await fetch(`${API_URL}/users/${currentUserIdToDelete}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (res.ok) {
      closeDeleteModal();
      await loadEmployees();
      notyf.success("تم حذف الموظف بنجاح");
    } else {
      notyf.error("فشل الحذف: تأكد من صلاحياتك");
    }
  } catch (e) {
    console.error(e);
  }
};

// دالة معالجة تغيير دولة المندوب في التعديل
async function handleEditCountryChange() {
  const countryId = document.getElementById("edit-user-country").value;
  const citySelect = document.getElementById("edit-user-city");
  if (countryId) {
    const cities = await fetchCitiesByCountry(countryId);
    fillSelect(citySelect, cities, "اختر المدينة");
  }
}

// دالة فتح نافذة التعديل مع تعبئة البيانات
async function openEditModal(user) {
  document.getElementById("edit-user-id").value = user.id;
  document.getElementById("edit-user-role").value = user.role;
  document.getElementById("edit-user-name").value = user.name;
  document.getElementById("edit-user-email").value = user.email;
  document.getElementById("edit-user-phone").value = user.phone;
  document.getElementById("edit-user-password").value = "";

  const officeGroup = document.getElementById("edit-office-group");
  const agentGroup = document.getElementById("edit-agent-group");

  if (user.role === "agent") {
    officeGroup.classList.add("hidden");
    agentGroup.classList.remove("hidden");

    const countrySelect = document.getElementById("edit-user-country");
    const countries = await fetchCountries();
    fillSelect(countrySelect, countries, "اختر الدولة");
    countrySelect.value = user.country_id || "";

    await handleEditCountryChange();
    document.getElementById("edit-user-city").value = user.city_id || "";
  } else {
    officeGroup.classList.remove("hidden");
    agentGroup.classList.add("hidden");

    const officeSelect = document.getElementById("edit-user-office");
    const res = await fetch(`${API_URL}/offices`, { headers: getHeaders() });
    const offices = await res.json();
    fillSelect(officeSelect, offices.data, "اختر المكتب");
    officeSelect.value = user.office_id || "";
  }

  document.getElementById("edit-modal").classList.remove("hidden");
}

// إرسال التعديل
document.getElementById("edit-user-form").onsubmit = async (e) => {
  e.preventDefault();
  const id = document.getElementById("edit-user-id").value;
  const role = document.getElementById("edit-user-role").value;

  const data = {
    name: document.getElementById("edit-user-name").value,
    email: document.getElementById("edit-user-email").value,
    phone: document.getElementById("edit-user-phone").value,
  };

  const pass = document.getElementById("edit-user-password").value;
  if (pass) data.password = pass;

  if (role === "agent") {
    data.country_id = document.getElementById("edit-user-country").value;
    data.city_id = document.getElementById("edit-user-city").value;
  } else {
    data.office_id = document.getElementById("edit-user-office").value;
    
  }

  const res = await fetch(`${API_URL}/users/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (res.ok) {
    alert("تم التحديث بنجاح");
    closeEditModal();
    loadEmployees();
  } else {
    alert("خطأ في التحديث");
  }
};
function closeEditModal() {
  document.getElementById("edit-modal").classList.add("hidden");
}
// أضف هذا الكود في آخر سطر في ملف super.js
async function updateMainPrice() {
    console.log("تم الضغط على زر تحديث السعر الرئيسي"); // للتأكد من الاتصال
    
    const currencyId = document.getElementById("main-currency-select").value;
    const newMainPrice = document.getElementById("new-main-price").value;

    if (!currencyId || !newMainPrice) {
        if (typeof notyf !== 'undefined') notyf.error("يرجى اختيار العملة وإدخال السعر الجديد");
        else alert("يرجى اختيار العملة وإدخال السعر الجديد");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/currencies/update-main-price/${currencyId}`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify({ main_price: newMainPrice }),
        });

        const data = await res.json();

        if (data.status === "success" || res.ok) {
            if (typeof notyf !== 'undefined') notyf.success("تم تحديث السعر الرئيسي بنجاح");
            else alert("تم تحديث السعر الرئيسي بنجاح");
            
            // تحديث البيانات في الجدول
            if (typeof loadCurrencies === "function") loadCurrencies();
        } else {
            const msg = data.message || "حدث خطأ أثناء التحديث";
            if (typeof notyf !== 'undefined') notyf.error(msg);
            else alert(msg);
        }
    } catch (error) {
        console.error("Error updating main price:", error);
        if (typeof notyf !== 'undefined') notyf.error("تعذر الاتصال بالسيرفر");
        else alert("تعذر الاتصال بالسيرفر");
    }
}
async function updatePrice() {
  const currencyId = document.getElementById("currency-select").value;
  const newPrice = document.getElementById("new-price").value;

  if (!currencyId || !newPrice) {
    alert("يرجى اختيار العملة وإدخال السعر الجديد");
    return;
  }

  try {
    const res = await fetch(
      `${API_URL}/currencies/update-price/${currencyId}`,
      {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ price: newPrice }),
      },
    );

    const data = await res.json();

    if (data.status === "success") {
      alert("تم تحديث السعر بنجاح");
    } else {
      alert("خطأ: " + data.message);
    }
  } catch (error) {
    alert("تعذر الاتصال بالسيرفر");
  }
}
async function initPricePreview() {
    cachedCurrencies = await fetchCurrencies();

    // عناصر السعر العادي
    const priceInput = document.getElementById("new-price");
    const currencySelect = document.getElementById("currency-select");
    const preview = document.getElementById("syp-preview");
    const box = document.querySelector(".syp-preview-box");

    // عناصر السعر الرئيسي
    const mainPriceInput = document.getElementById("new-main-price");
    const mainCurrencySelect = document.getElementById("main-currency-select");
    const mainPreview = document.getElementById("main-syp-preview");
    const mainBox = document.getElementById("main-syp-preview-box");

    function calculate(inputEl, previewEl, boxEl) {
        if (!inputEl || !previewEl || !boxEl) return;
        
        const price = parseFloat(inputEl.value);
        if (!price) {
            previewEl.textContent = "0";
            boxEl.classList.remove("active");
            return;
        }

        const sypCurrency = cachedCurrencies.find(c => c.code === 'SYP');
        if (!sypCurrency) return;

        const sypPriceInUsd = parseFloat(sypCurrency.price);
        if (sypPriceInUsd <= 0) return;

        const result = price / sypPriceInUsd;
        const formatted = new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 2
        }).format(result);

        previewEl.textContent = formatted;
        boxEl.classList.add("active");
    }

    // ربط الأحداث للسعر العادي
    if (priceInput && currencySelect) {
        priceInput.addEventListener("input", () => calculate(priceInput, preview, box));
        currencySelect.addEventListener("change", () => calculate(priceInput, preview, box));
    }

    // ربط الأحداث للسعر الرئيسي
    if (mainPriceInput && mainCurrencySelect) {
        mainPriceInput.addEventListener("input", () => calculate(mainPriceInput, mainPreview, mainBox));
        mainCurrencySelect.addEventListener("change", () => calculate(mainPriceInput, mainPreview, mainBox));
    }
}


/* =========================
   Load Currencies Table
========================= */
async function renderCurrenciesTable() {
    const tbody = document.getElementById('currencies-table-body');
    if (!tbody) return;

    const currencies = await fetchCurrencies(); 
    tbody.innerHTML = '';

    if (!currencies || currencies.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">لا توجد بيانات للعملات</td></tr>';
        return;
    }

    // 1. استخراج سعر الليرة السورية مقابل الدولار لإجراء العملية الحسابية
    const sypCurrency = currencies.find(c => c.code === 'SYP');
    const sypPriceInUsd = sypCurrency ? parseFloat(sypCurrency.price) : 0;

    currencies.forEach((currency, index) => {
        // تنسيق السعر بالدولار
        const priceInUsd = parseFloat(currency.price);
        const mainPrice  = parseFloat(currency.main_price || 0);
        const formattedPriceUsd = priceInUsd.toFixed(6).replace(/\.?0+$/, '');

        // 2. حساب السعر بالليرة السورية وتنسيقه (Frontend Only)
        let priceInSypHtml = "-";
        if (sypPriceInUsd > 0) {
            // المعادلة: سعر العملة / سعر الليرة السورية
            const calculatedSyp = priceInUsd / sypPriceInUsd; 
            
            // تنسيق الرقم ليحتوي على فواصل الألوف (مثال: 15,000)
            const formattedSyp = new Intl.NumberFormat('en-US', { 
                maximumFractionDigits: 2 
            }).format(calculatedSyp);

            priceInSypHtml = formattedSyp;
        }

        tbody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${currency.name}</strong></td>
                <td><span class="role-badge" style="background: var(--primary-bg); color: var(--primary-dark);">${currency.code}</span></td>
                <td style="font-weight: bold; color: var(--success); direction: ltr; text-align: right;">
                    ${formattedPriceUsd}
                </td>
                <td style="font-weight: bold; color: var(--success); direction: ltr; text-align: right;">
                    ${mainPrice}
                </td>
                <td style="font-weight: bold; color: var(--secondary); direction: ltr; text-align: right;">
                    ${priceInSypHtml}
                </td>
                <td>
                    ${currency.rates && currency.rates.length > 0
                        ? `<span class="tiers-count-badge"><i class="fa-solid fa-layer-group"></i> ${currency.rates.length} شريحة</span>`
                        : `<span class="tiers-count-badge tiers-empty"><i class="fa-solid fa-minus"></i> لا يوجد</span>`
                    }
                </td>
                <td>
                    <button class="btn-manage-rates" onclick="openRatesModal(${currency.id}, '${currency.name}', '${currency.code}', ${JSON.stringify(currency.rates || []).replace(/"/g, '&quot;')})">
                        <i class="fa-solid fa-sliders"></i> إدارة الشرائح
                    </button>
                </td>
            </tr>
        `;
    });
}

let cachedCurrencies = [];

async function initPricePreview() {

    cachedCurrencies = await fetchCurrencies();

    const priceInput = document.getElementById("new-price");
    const currencySelect = document.getElementById("currency-select");
    const preview = document.getElementById("syp-preview");
    const box = document.querySelector(".syp-preview-box");

    function calculate() {

        const price = parseFloat(priceInput.value);
        if (!price) {
            preview.textContent = "0";
            box.classList.remove("active");
            return;
        }

        // سعر الليرة السورية
        const sypCurrency = cachedCurrencies.find(c => c.code === 'SYP');

        if (!sypCurrency) return;

        const sypPriceInUsd = parseFloat(sypCurrency.price);

        if (sypPriceInUsd <= 0) return;

        // نفس المعادلة المستخدمة بالجدول
        const result = price / sypPriceInUsd;

        const formatted = new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 2
        }).format(result);

        preview.textContent = formatted;
        box.classList.add("active");
    }

    priceInput.addEventListener("input", calculate);
    currencySelect.addEventListener("change", calculate);
}
/* =========================
   UI Helpers
========================= */
/* =========================
   Mobile Sidebar Toggle
========================= */
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  const btn = document.getElementById("hamburger-btn");
  const isOpen = sidebar.classList.contains("open");

  if (isOpen) {
    closeSidebar();
  } else {
    sidebar.classList.add("open");
    overlay.classList.add("active");
    btn.querySelector("i").className = "fa-solid fa-xmark";
    document.body.style.overflow = "hidden";
  }
}

function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  const btn = document.getElementById("hamburger-btn");

  sidebar.classList.remove("open");
  overlay.classList.remove("active");
  if (btn) btn.querySelector("i").className = "fa-solid fa-bars";
  document.body.style.overflow = "";
}

function showSection(sectionId) {
  // حفظ القسم الحالي في localStorage
  localStorage.setItem("super_active_section", sectionId);

  // إخفاء كل الأقسام
  document
    .querySelectorAll(".card")
    .forEach((card) => card.classList.add("hidden"));
  const dashSection = document.getElementById("dashboard-section");
  if (dashSection) dashSection.style.display = "none";

  if (sectionId === "dashboard") {
    if (dashSection) dashSection.style.display = "";
    updateDashboardStats();
  } else {
    const activeSection = document.getElementById(`${sectionId}-section`);
    if (activeSection) activeSection.classList.remove("hidden");
  }

  // تحديث الـ active في الـ sidebar
  document
    .querySelectorAll(".sidebar nav li")
    .forEach((li) => li.classList.remove("active"));
  const activeLink = document.querySelector(
    `.sidebar nav a[onclick*="${sectionId}"]`,
  );
  if (activeLink) activeLink.closest("li").classList.add("active");

  // إغلاق القائمة على الموبايل بعد الاختيار
  if (window.innerWidth <= 768) closeSidebar();

  if (sectionId === "trading-profits") initTradingProfitsSection();
  if (sectionId === "customers") loadCustomers();
  if (sectionId === "employees") renderEmployeesStats();
  if (sectionId === "offices") renderOfficesStats();
  if (sectionId === "pending-transfers") loadPendingTransfers();
}

function updateDashboardStats() {
  // تحديث التاريخ والوقت
  const now = new Date();
  const dateEl = document.getElementById("dashboard-date");
  const timeEl = document.getElementById("dash-time");
  if (dateEl)
    dateEl.textContent = now.toLocaleDateString("ar-SY", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  if (timeEl) timeEl.textContent = now.toLocaleTimeString("ar-SY");

  // عدد المكاتب
  const offCount = document.getElementById("stat-offices-count")?.textContent;
  const dashOff = document.getElementById("dash-offices-count");
  if (dashOff && offCount && offCount !== "—") dashOff.textContent = offCount;

  // عدد الموظفين
  const empCount = document.getElementById("stat-emp-total")?.textContent;
  const dashEmp = document.getElementById("dash-employees-count");
  if (dashEmp && empCount && empCount !== "—") dashEmp.textContent = empCount;

  // عدد الزبائن
  const custCount = document.querySelectorAll("#customers-tbody tr").length;
  const dashCust = document.getElementById("dash-customers-count");
  if (dashCust && custCount > 0) dashCust.textContent = custCount;

  // عدد الصناديق
  const safesCount = document.querySelectorAll("#safes-table-body tr").length;
  const dashSafes = document.getElementById("dash-safes-count");
  if (dashSafes && safesCount > 0) dashSafes.textContent = safesCount;
}

/* =========================
   Offices – UI helpers
========================= */
let _addOfficeOpen = false;

function toggleAddOfficeForm() {
  _addOfficeOpen = !_addOfficeOpen;
  const body = document.getElementById("add-office-body");
  const chevron = document.getElementById("add-office-chevron");
  if (_addOfficeOpen) {
    body.style.maxHeight = body.scrollHeight + "px";
    body.classList.add("open");
    chevron.style.transform = "rotate(180deg)";
  } else {
    body.style.maxHeight = "0";
    body.classList.remove("open");
    chevron.style.transform = "";
  }
}

function resetOfficeForm() {
  document.getElementById("add-office-form")?.reset();
}

function renderOfficesStats() {
  // يُحدَّث بعد loadOffices
}

/* =========================
   Offices – filter table
========================= */
function filterOfficesTable() {
  const q =
    document.getElementById("offices-search")?.value.trim().toLowerCase() || "";
  const rows = document.querySelectorAll("#offices-list tr");
  let visible = 0;
  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    const show = text.includes(q);
    row.style.display = show ? "" : "none";
    if (show) visible++;
  });
  const empty = document.getElementById("offices-empty");
  if (empty) empty.classList.toggle("hidden", visible > 0);
}

/* =========================
   Employees – UI helpers
========================= */
let _addEmpOpen = false;
let _empFilter = "all";
let _allEmployees = [];

function toggleAddEmpForm() {
  _addEmpOpen = !_addEmpOpen;
  const body = document.getElementById("add-emp-body");
  const chevron = document.getElementById("add-emp-chevron");
  if (_addEmpOpen) {
    body.style.maxHeight = body.scrollHeight + 600 + "px";
    body.classList.add("open");
    chevron.style.transform = "rotate(180deg)";
  } else {
    body.style.maxHeight = "0";
    body.classList.remove("open");
    chevron.style.transform = "";
  }
}

function setEmpFilter(role, btn) {
  _empFilter = role;
  document
    .querySelectorAll(".filter-chip")
    .forEach((c) => c.classList.remove("active"));
  btn.classList.add("active");
  renderEmployeesTable();
}

function filterEmployeesTable() {
  renderEmployeesTable();
}

function renderEmployeesStats() {
  if (!_allEmployees.length) return;
  const nonCustomers = _allEmployees.filter((u) => u.role !== "customer");
  document.getElementById("stat-emp-total")?.textContent &&
    (document.getElementById("stat-emp-total").textContent =
      nonCustomers.length);
  document.getElementById("stat-emp-admins")?.textContent &&
    (document.getElementById("stat-emp-admins").textContent =
      nonCustomers.filter((u) => u.role === "admin").length);
  document.getElementById("stat-emp-agents")?.textContent &&
    (document.getElementById("stat-emp-agents").textContent =
      nonCustomers.filter((u) => u.role === "agent").length);
  document.getElementById("stat-emp-cashiers")?.textContent &&
    (document.getElementById("stat-emp-cashiers").textContent =
      nonCustomers.filter((u) => u.role === "cashier").length);
  document.getElementById("stat-emp-accountant")?.textContent &&
    (document.getElementById("stat-emp-accountant").textContent =
      nonCustomers.filter((u) => u.role === "accountant").length);
}

const ROLE_LABELS = {
  super_admin: { label: "سوبر أدمن", color: "#7c3aed", bg: "#ede9fe" },
  admin: { label: "مدير مكتب", color: "#1d4ed8", bg: "#dbeafe" },
  cashier: { label: "كاشير", color: "#0f766e", bg: "#ccfbf1" },
  accountant: { label: "محاسب", color: "#b45309", bg: "#fef3c7" },
  agent: { label: "مندوب", color: "#166534", bg: "#dcfce7" },
  customer: { label: "زبون", color: "#64748b", bg: "#f1f5f9" },
};

function renderEmployeesTable() {
  const q = (document.getElementById("emp-search")?.value || "")
    .trim()
    .toLowerCase();
  const tbody = document.getElementById("employees-list");
  const emptyEl = document.getElementById("employees-empty");
  if (!tbody) return;

  const filtered = _allEmployees.filter((u) => {
    if (u.role === "customer") return false;
    if (_empFilter !== "all" && u.role !== _empFilter) return false;
    if (q && !`${u.name}${u.email}${u.phone}`.toLowerCase().includes(q))
      return false;
    return true;
  });

  tbody.innerHTML = "";

  if (filtered.length === 0) {
    emptyEl?.classList.remove("hidden");
    return;
  }
  emptyEl?.classList.add("hidden");

  filtered.forEach((user, index) => {
    const roleInfo = ROLE_LABELS[user.role] || {
      label: user.role,
      color: "#64748b",
      bg: "#f1f5f9",
    };

    let locationHtml = "";
    if (user.role === "agent") {
      const country = user.country?.name || "—";
      const city = user.city?.name || "—";
      locationHtml = `<span class="location-tag"><i class="fa-solid fa-earth-americas"></i> ${country} ← ${city}</span>`;
    } else {
      locationHtml = user.office
        ? `<span class="location-tag"><i class="fa-solid fa-building"></i> ${user.office.name}</span>`
        : `<span style="color:var(--gray); font-size:12px;">بدون مكتب</span>`;
    }

    // أول حرف من الاسم للأفاتار
    const initials = (user.name || "?").charAt(0).toUpperCase();

    tbody.innerHTML += `
            <tr class="emp-row" data-id="${user.id}">
                <td style="color:var(--gray); font-size:12px;">${index + 1}</td>
                <td>
                    <div class="emp-cell">
                        <div class="emp-avatar" style="background:${roleInfo.bg}; color:${roleInfo.color};">${initials}</div>
                        <div>
                            <div style="font-weight:700; font-size:13px;">${user.name}</div>
                        </div>
                    </div>
                </td>
                <td style="font-size:12px; color:var(--gray);">${user.email}</td>
                <td style="font-size:12px; direction:ltr; text-align:right;">${user.phone}</td>
                <td>
                    <span class="role-badge-new" style="background:${roleInfo.bg}; color:${roleInfo.color};">
                        ${roleInfo.label}
                    </span>
                </td>
                <td>${locationHtml}</td>
                <td>
                    <div class="row-actions">
                        <button class="action-btn edit-btn" title="تعديل" onclick="openEditModal(${JSON.stringify(user).replace(/"/g, "&quot;")})">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="action-btn delete-btn" title="حذف" onclick="openDeleteModal(${user.id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
  });
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === "password") {
    input.type = "text";
    btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
  } else {
    input.type = "password";
    btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
  }
}

function handleRoleChange() {
  const role = document.getElementById("emp-role").value;
  const officeGroup = document.getElementById("office-select-group");
  const agentGroup = document.getElementById("agent-fields");

  if (role === "agent") {
    officeGroup.classList.add("hidden");
    agentGroup.classList.remove("hidden");
  } else {
    officeGroup.classList.remove("hidden");
    agentGroup.classList.add("hidden");
  }
}

/* =========================
   أرباح التداول - السوبر أدمن
========================= */

/**
 * عند فتح القسم: نملأ قائمة المكاتب ونضع تاريخ اليوم
 */
async function initTradingProfitsSection() {
  // تاريخ اليوم افتراضياً
  const dateInput = document.getElementById("profits-date");
  if (!dateInput.value) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }

  // ملء قائمة المكاتب من الـ API
  try {
    const res = await fetch(`${API_URL}/offices`, { headers: getHeaders() });
    const json = await res.json();
    const select = document.getElementById("profits-office-select");
    select.innerHTML = '<option value="">اختر المكتب</option>';

    if (json.status === "success" && Array.isArray(json.data)) {
      json.data.forEach((office) => {
        const opt = document.createElement("option");
        opt.value = office.id;
        opt.textContent = office.name;
        select.appendChild(opt);
      });
    }
  } catch (e) {
    console.error("Error loading offices for profits:", e);
  }

  // إظهار placeholder وإخفاء باقي العناصر
  _resetProfitsUI();
}

function onProfitsOfficeChange() {
  const officeId = document.getElementById("profits-office-select").value;
  const labelDiv = document.getElementById("profits-office-label");
  const nameSpan = document.getElementById("profits-office-name");
  const select = document.getElementById("profits-office-select");

  if (officeId) {
    nameSpan.textContent = select.options[select.selectedIndex].text;
    labelDiv.style.display = "block";
  } else {
    labelDiv.style.display = "none";
  }
}

function _resetProfitsUI() {
  document.getElementById("profits-summary").innerHTML = "";
  document.getElementById("profits-list").innerHTML = "";
  const tw = document.getElementById("profits-table-wrapper");
  if (tw) tw.style.display = "none";
  document.getElementById("profits-table").style.display = "none";
  document.getElementById("profits-empty").style.display = "none";
  document.getElementById("profits-placeholder").style.display = "block";
}

async function loadSuperTradingReport() {
  const officeId = document.getElementById("profits-office-select").value;
  const date = document.getElementById("profits-date").value;
  const summaryEl = document.getElementById("profits-summary");
  const tableEl = document.getElementById("profits-table");
  const emptyEl = document.getElementById("profits-empty");
  const placeholderEl = document.getElementById("profits-placeholder");
  const tbodyEl = document.getElementById("profits-list");

  if (!officeId) {
    alert("يرجى اختيار المكتب أولاً");
    return;
  }
  if (!date) {
    alert("يرجى تحديد التاريخ");
    return;
  }

  // حالة التحميل
  placeholderEl.style.display = "none";
  emptyEl.style.display = "none";
  tableEl.style.display = "none";
  tbodyEl.innerHTML = "";
  summaryEl.innerHTML = `
        <div style="padding:16px; color:var(--gray); font-size:13px; grid-column:1/-1;">
            <i class="fa-solid fa-spinner fa-spin"></i> جاري تحميل البيانات...
        </div>`;

  try {
    const res = await fetch(
      `${API_URL}/trading/report/details?date=${date}&office_id=${officeId}`,
      { headers: getHeaders() },
    );
    const json = await res.json();

    if (!res.ok) {
      summaryEl.innerHTML = `<p style="color:var(--danger); grid-column:1/-1;">${json.message || "فشل تحميل البيانات"}</p>`;
      return;
    }

    const transactions = json.transactions || [];
    const summary = json.summary || {};

    // ===== بطاقات الملخص =====
    const totalProfit = parseFloat(summary.total_net_profit || 0);
    const profitColor = totalProfit >= 0 ? "#10b981" : "#ef4444";
    const profitIcon =
      totalProfit >= 0 ? "fa-arrow-trend-up" : "fa-arrow-trend-down";

    const cardS = `
            background:var(--white);
            border-radius:var(--radius-sm,10px);
            padding:20px 22px;
            box-shadow:0 4px 12px rgba(0,0,0,.06);
            border:1px solid var(--border);
        `;

    summaryEl.innerHTML = `
            <div style="${cardS}">
                <div style="font-size:11px;font-weight:700;color:var(--gray);text-transform:uppercase;margin-bottom:8px;letter-spacing:.5px;">
                    إجمالي المشتريات
                </div>
                <div style="font-size:24px;font-weight:800;color:#1e3c72;">
                    ${parseFloat(summary.total_bought || 0).toFixed(2)}
                </div>
            </div>
            <div style="${cardS}">
                <div style="font-size:11px;font-weight:700;color:var(--gray);text-transform:uppercase;margin-bottom:8px;letter-spacing:.5px;">
                    إجمالي المبيعات
                </div>
                <div style="font-size:24px;font-weight:800;color:#f59e0b;">
                    ${parseFloat(summary.total_sold || 0).toFixed(2)}
                </div>
            </div>
            <div style="${cardS}">
                <div style="font-size:11px;font-weight:700;color:var(--gray);text-transform:uppercase;margin-bottom:8px;letter-spacing:.5px;">
                    صافي الربح / الخسارة
                </div>
                <div style="font-size:24px;font-weight:800;color:${profitColor};">
                    <i class="fa-solid ${profitIcon}" style="font-size:18px;"></i>
                    ${totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(2)}
                </div>
            </div>
            <div style="${cardS}">
                <div style="font-size:11px;font-weight:700;color:var(--gray);text-transform:uppercase;margin-bottom:8px;letter-spacing:.5px;">
                    عدد العمليات
                </div>
                <div style="font-size:24px;font-weight:800;color:#6f42c1;">
                    ${transactions.length}
                </div>
            </div>
        `;

    if (transactions.length === 0) {
      emptyEl.style.display = "block";
      return;
    }

    // ===== صفوف الجدول =====
    transactions.forEach((tx, index) => {
      const isBuy = tx.type === "buy";
      const profit = parseFloat(tx.profit || 0);
      const pColor =
        profit > 0 ? "#10b981" : profit < 0 ? "#ef4444" : "var(--gray)";

      const typeBadge = isBuy
        ? `<span style="background:#dcfce7;color:#166534;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;">شراء</span>`
        : `<span style="background:#fee2e2;color:#991b1b;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;">بيع</span>`;

      const profitCell = isBuy
        ? `<span style="color:var(--gray);font-size:12px;">—</span>`
        : `<span style="color:${pColor};font-weight:700;">${profit >= 0 ? "+" : ""}${profit.toFixed(2)}</span>`;

      tbodyEl.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${typeBadge}</td>
                    <td>${tx.currency?.code ?? "—"}</td>
                    <td>${parseFloat(tx.amount).toFixed(2)}</td>
                    <td>${parseFloat(tx.price).toFixed(2)}</td>
                    <td style="color:#64748b;">${parseFloat(tx.cost_at_time || 0).toFixed(2)}</td>
                    <td>${profitCell}</td>
                    <td>${tx.transaction_date ?? "—"}</td>
                    <td>${tx.user?.name ?? "—"}</td>
                </tr>
            `;
    });

    tableEl.style.display = "table";
    const tw2 = document.getElementById("profits-table-wrapper");
    if (tw2) tw2.style.display = "block";
  } catch (error) {
    console.error("Error loading trading report:", error);
    summaryEl.innerHTML =
      '<p style="color:var(--danger); grid-column:1/-1;">خطأ في الاتصال بالسيرفر</p>';
  }
}

/* =========================
   قسم الزبائن
========================= */
let allCustomers = [];
let allTransfers = [];

async function loadCustomers() {
  try {
    // جلب جميع المستخدمين وتصفية الزبائن فقط
    const [usersRes, transfersRes] = await Promise.all([
      fetch(`${API_URL}/users`, { headers: getHeaders() }),
      fetch(`${API_URL}/transfers`, { headers: getHeaders() }),
    ]);

    const usersJson = await usersRes.json();
    const transfersJson = await transfersRes.json();

    allTransfers = transfersJson.data || [];
    allCustomers = (usersJson.data || []).filter((u) => u.role === "customer");

    renderCustomersTable(allCustomers);
    renderCustomersStats(allCustomers);
  } catch (e) {
    console.error("Error loading customers:", e);
  }
}

function renderCustomersStats(customers) {
  const statsEl = document.getElementById("customers-stats");
  if (!statsEl) return;

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) =>
    allTransfers.some((t) => t.sender_id === c.id),
  ).length;
  const totalTransfersCount = allTransfers.filter((t) =>
    customers.some((c) => c.id === t.sender_id),
  ).length;
  const completedCount = allTransfers.filter(
    (t) =>
      customers.some((c) => c.id === t.sender_id) && t.status === "completed",
  ).length;

  const cardS = `background:var(--white); border-radius:10px; padding:18px 20px; box-shadow:0 4px 12px rgba(0,0,0,.06); border:1px solid var(--border);`;

  statsEl.innerHTML = `
        <div style="${cardS}">
            <div style="font-size:11px;font-weight:700;color:var(--gray);text-transform:uppercase;margin-bottom:8px;">إجمالي الزبائن</div>
            <div style="font-size:26px;font-weight:800;color:#1e3c72;">${totalCustomers}</div>
        </div>
        <div style="${cardS}">
            <div style="font-size:11px;font-weight:700;color:var(--gray);text-transform:uppercase;margin-bottom:8px;">زبائن لديهم حوالات</div>
            <div style="font-size:26px;font-weight:800;color:#f59e0b;">${activeCustomers}</div>
        </div>
        <div style="${cardS}">
            <div style="font-size:11px;font-weight:700;color:var(--gray);text-transform:uppercase;margin-bottom:8px;">إجمالي الحوالات</div>
            <div style="font-size:26px;font-weight:800;color:#6f42c1;">${totalTransfersCount}</div>
        </div>
        <div style="${cardS}">
            <div style="font-size:11px;font-weight:700;color:var(--gray);text-transform:uppercase;margin-bottom:8px;">حوالات مكتملة</div>
            <div style="font-size:26px;font-weight:800;color:#10b981;">${completedCount}</div>
        </div>
    `;
}

function renderCustomersTable(customers) {
  const tbody = document.getElementById("customers-tbody");
  const emptyEl = document.getElementById("customers-empty");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (customers.length === 0) {
    emptyEl.style.display = "block";
    document.getElementById("customers-table").style.display = "none";
    return;
  }

  emptyEl.style.display = "none";
  document.getElementById("customers-table").style.display = "table";

  customers.forEach((customer, index) => {
    const customerTransfers = allTransfers.filter(
      (t) => t.sender_id === customer.id,
    );
    const transferCount = customerTransfers.length;
    const badgeColor = transferCount > 0 ? "#dcfce7" : "#f1f5f9";
    const badgeText = transferCount > 0 ? "#166534" : "#64748b";
    const regDate = customer.created_at
      ? new Date(customer.created_at).toLocaleDateString("ar-SY")
      : "—";

    tbody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <strong>${customer.name}</strong>
                        ${
                          customer.id_card_image
                            ? `<button
                                onclick="openIdImageModal('${STORAGE_URL}/${customer.id_card_image}')"
                                title="عرض صورة الهوية"
                                style="border:none; cursor:pointer; border-radius:7px; background:#eff6ff; color:#2563eb; width:28px; height:28px; font-size:13px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.2s;"
                                onmouseover="this.style.background='#dbeafe'"
                                onmouseout="this.style.background='#eff6ff'">
                                <i class="fa-solid fa-id-card"></i>
                              </button>`
                            : ""
                        }
                    </div>
                </td>
                <td style="direction:ltr; text-align:right;">${customer.phone || "—"}</td>
                <td style="font-size:12px; color:var(--gray);">${customer.email || "—"}</td>
                <td>${customer.city?.name || "—"}</td>
                <td>${customer.country?.name || "—"}</td>
                <td style="font-size:12px;">${regDate}</td>
                <td>
                    <span style="background:${badgeColor}; color:${badgeText}; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700;">
                        ${transferCount} حوالة
                    </span>
                </td>
                <td style="display:flex; gap:6px; align-items:center; justify-content:center;">
                    <button class="btn-edit" onclick="openCustomerModal(${customer.id})" title="عرض التفاصيل">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button
                        class="btn-block-toggle"
                        onclick="toggleBlockCustomer(${customer.id}, ${!!customer.is_active})"
                        title="${customer.is_active ? "حظر الزبون" : "فك الحظر"}"
                        style="
                            border:none; cursor:pointer; border-radius:8px;
                            width:34px; height:34px; font-size:14px;
                            display:inline-flex; align-items:center; justify-content:center;
                            transition:all 0.2s;
                            background:${customer.is_active ? "#fee2e2" : "#dcfce7"};
                            color:${customer.is_active ? "#dc2626" : "#16a34a"};
                        "
                    >
                        <i class="fa-solid ${customer.is_active ? "fa-ban" : "fa-lock-open"}"></i>
                    </button>
                </td>
            </tr>
        `;
  });
}

function filterCustomers() {
  const q = document
    .getElementById("customer-search")
    .value.trim()
    .toLowerCase();
  if (!q) {
    renderCustomersTable(allCustomers);
    return;
  }
  const filtered = allCustomers.filter(
    (c) =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q),
  );
  renderCustomersTable(filtered);
}

// متغير لحفظ الزبون الحالي في المودال
let currentModalCustomer = null;

function openCustomerModal(customerId) {
  const customer = allCustomers.find((c) => c.id === customerId);
  if (!customer) return;
  currentModalCustomer = customer;

  const blockBtn = document.getElementById("cd-block-btn");
  const blockLabel = document.getElementById("cd-block-label");
  const blockIcon = document.getElementById("cd-block-icon");
  if (blockBtn && blockLabel && blockIcon) {
    const isActive = !!customer.is_active;
    if (isActive) {
      blockBtn.style.borderColor = "#dc2626";
      blockBtn.style.background = "#fff0f0";
      blockBtn.style.color = "#dc2626";
      blockIcon.className = "fa-solid fa-ban";
      blockLabel.textContent = "حظر الزبون";
    } else {
      blockBtn.style.borderColor = "#16a34a";
      blockBtn.style.background = "#f0fdf4";
      blockBtn.style.color = "#16a34a";
      blockIcon.className = "fa-solid fa-lock-open";
      blockLabel.textContent = "فك الحظر";
    }
  }

  const customerTransfers = allTransfers.filter(
    (t) => t.sender_id === customerId,
  );

  // ===== رأس المودال =====
  document.getElementById("cd-name").textContent = customer.name || "—";
  document.getElementById("cd-phone").textContent = customer.phone || "—";
  document.getElementById("cd-email").textContent = customer.email || "—";

  // زر عرض صورة الهوية في رأس المودال
  const cdIdBtn = document.getElementById("cd-id-card-btn");
  if (cdIdBtn) {
    if (customer.id_card_image) {
      cdIdBtn.style.display = "inline-flex";
      cdIdBtn.onclick = () =>
        openIdImageModal(`${STORAGE_URL}/${customer.id_card_image}`);
    } else {
      cdIdBtn.style.display = "none";
    }
  }

  // ===== بطاقات المعلومات =====
  document.getElementById("cd-location").textContent =
    [customer.city?.name, customer.country?.name].filter(Boolean).join(" ← ") ||
    "—";
  document.getElementById("cd-date").textContent = customer.created_at
    ? new Date(customer.created_at).toLocaleDateString("ar-SY")
    : "—";
  document.getElementById("cd-total").textContent =
    customerTransfers.length + " حوالة";

  // حساب إجمالي الدولار
  let totalAmountUsd = 0;
  const statusCounts = {
    pending: 0,
    approved: 0,
    waiting: 0,
    ready: 0,
    completed: 0,
    rejected: 0,
  };

  customerTransfers.forEach((t) => {
    if (statusCounts.hasOwnProperty(t.status)) statusCounts[t.status]++;
    totalAmountUsd += parseFloat(t.amount_in_usd || 0);
  });

  document.getElementById("cd-usd-total").textContent =
    "$" + totalAmountUsd.toFixed(2);

  // ===== ملخص الحالات (chips) =====
  const statusLabels = {
    pending: {
      label: "قيد الانتظار",
      color: "#92400e",
      bg: "#fef3c7",
      border: "#fcd34d",
      icon: "fa-clock",
    },
    approved: {
      label: "موافق عليها",
      color: "#065f46",
      bg: "#d1fae5",
      border: "#6ee7b7",
      icon: "fa-circle-check",
    },
    waiting: {
      label: "في الانتظار",
      color: "#3730a3",
      bg: "#ede9fe",
      border: "#a5b4fc",
      icon: "fa-hourglass-half",
    },
    ready: {
      label: "جاهزة للتسليم",
      color: "#0c4a6e",
      bg: "#e0f2fe",
      border: "#7dd3fc",
      icon: "fa-box-open",
    },
    completed: {
      label: "مكتملة",
      color: "#14532d",
      bg: "#bbf7d0",
      border: "#4ade80",
      icon: "fa-flag-checkered",
    },
    rejected: {
      label: "مرفوضة",
      color: "#7f1d1d",
      bg: "#fee2e2",
      border: "#fca5a5",
      icon: "fa-ban",
    },
  };

  const summaryEl = document.getElementById("cd-summary");
  summaryEl.innerHTML = "";

  let hasAny = false;
  Object.entries(statusCounts).forEach(([key, count]) => {
    if (count === 0) return;
    hasAny = true;
    const s = statusLabels[key];
    summaryEl.innerHTML += `
            <div class="cmodal-status-chip"
                 style="background:${s.bg}; color:${s.color}; border-color:${s.border};">
                <i class="fa-solid ${s.icon}" style="font-size:13px;"></i>
                <span>${s.label}</span>
                <strong style="font-size:14px; margin-right:4px;">${count}</strong>
            </div>
        `;
  });

  if (!hasAny) {
    summaryEl.innerHTML = `<span style="font-size:12px; color:var(--gray);">لا توجد حوالات بعد</span>`;
  }

  // ===== جدول الحوالات =====
  const tbody = document.getElementById("cd-transfers-tbody");
  const noTransfers = document.getElementById("cd-no-transfers");
  tbody.innerHTML = "";

  if (customerTransfers.length === 0) {
    noTransfers.style.display = "block";
  } else {
    noTransfers.style.display = "none";
    customerTransfers.forEach((t) => {
      const s = statusLabels[t.status] || {
        label: t.status,
        color: "#64748b",
        bg: "#f1f5f9",
        border: "#e2e8f0",
        icon: "fa-circle",
      };
      const date = t.created_at
        ? new Date(t.created_at).toLocaleDateString("ar-SY")
        : "—";

      tbody.innerHTML += `
                <tr>
                    <td style="font-family:monospace; font-size:11px; direction:ltr; color:var(--gray);">${t.tracking_code || "—"}</td>
                    <td style="font-weight:800; color:var(--dark);">${parseFloat(t.amount).toLocaleString()}</td>
                    <td>
                        <span class="role-badge">${t.currency?.code || "—"}</span>
                    </td>
                    <td>${t.receiver_name || "—"}</td>
                    <td>
                        <span style="background:${s.bg}; color:${s.color}; border:1px solid ${s.border}; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; display:inline-flex; align-items:center; gap:5px;">
                            <i class="fa-solid ${s.icon}" style="font-size:9px;"></i>${s.label}
                        </span>
                    </td>
                    <td style="font-size:12px; color:var(--gray);">${date}</td>
                    <td>
                        ${
                          t.receiver_id_image
                            ? `<button data-img-url="${STORAGE_URL}/${t.receiver_id_image}"
                                       onclick="openIdImageModal(this.dataset.imgUrl)"
                                       class="action-btn"
                                       title="عرض هوية المستلم"
                                       style="background:var(--primary-bg); color:var(--primary); border:1px solid var(--primary-light); width:34px; height:34px; border-radius:8px; cursor:pointer; font-size:13px; display:inline-flex; align-items:center; justify-content:center; transition:all 0.2s;">
                                   <i class="fa-solid fa-id-card"></i>
                               </button>`
                            : '<span style="font-size:12px; color:var(--gray-light);">—</span>'
                        }
                    </td>
                </tr>
            `;
    });
  }

  // إظهار المودال
  document.getElementById("customer-detail-modal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function openIdImageModal(imageUrl) {
  const modal = document.getElementById("id-image-modal");
  const img = document.getElementById("id-image-viewer");
  const dlBtn = document.getElementById("id-image-download");
  img.src = imageUrl;
  dlBtn.href = imageUrl;
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeIdImageModal(e) {
  // إغلاق بالزر أو بالنقر على الخلفية
  if (
    e &&
    e.target !== document.getElementById("id-image-modal") &&
    e.type === "click"
  )
    return;
  const modal = document.getElementById("id-image-modal");
  modal.classList.add("hidden");
  // لا نُعيد overflow هنا لأن customer modal لا يزال مفتوحاً
}

function closeCustomerModal() {
  document.getElementById("customer-detail-modal").classList.add("hidden");
  document.body.style.overflow = "";
}

// الإغلاق بالنقر على الخلفية
function handleCustomerModalBackdrop(e) {
  if (e.target === document.getElementById("customer-detail-modal")) {
    closeCustomerModal();
  }
}

// إغلاق مودال الزبون بـ ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const modal = document.getElementById("customer-detail-modal");
    if (modal && !modal.classList.contains("hidden")) {
      closeCustomerModal();
    }
  }
});

/* =============================================
   دوال الحظر / فك الحظر
============================================= */

/**
 * تحويل is_active للزبون عبر API PUT /users/{id}
 * @param {number} userId
 * @param {boolean} currentIsActive  - الحالة الحالية قبل التغيير
 */
async function toggleBlockCustomer(userId, currentIsActive) {
  const newIsActive = !currentIsActive;
  const action = newIsActive ? "فك الحظر" : "حظر";

  const confirmed = confirm(`هل تريد ${action} هذا الزبون؟`);
  if (!confirmed) return;

  try {
    const res = await fetch(`${API_URL}/users/${userId}/toggle-status`, {
      method: "PATCH",
      headers: getHeaders(),
    });

    if (!res.ok) throw new Error("فشلت العملية");

    // تحديث الحالة محلياً على الفور
    const customer = allCustomers.find((c) => c.id === userId);
    if (customer) customer.is_active = newIsActive;

    // تحديث الجدول زر الخطوط
    renderCustomersTable(allCustomers);

    // تحديث المودال إن كان مفتوحاً لنفس الزبون
    if (currentModalCustomer && currentModalCustomer.id === userId) {
      currentModalCustomer.is_active = newIsActive;
      const blockBtn = document.getElementById("cd-block-btn");
      const blockLabel = document.getElementById("cd-block-label");
      const blockIcon = document.getElementById("cd-block-icon");
      if (blockBtn) {
        if (newIsActive) {
          blockBtn.style.borderColor = "#16a34a";
          blockBtn.style.background = "#f0fdf4";
          blockBtn.style.color = "#16a34a";
          blockIcon.className = "fa-solid fa-lock-open";
          blockLabel.textContent = "فك الحظر";
        } else {
          blockBtn.style.borderColor = "#dc2626";
          blockBtn.style.background = "#fff0f0";
          blockBtn.style.color = "#dc2626";
          blockIcon.className = "fa-solid fa-ban";
          blockLabel.textContent = "حظر الزبون";
        }
      }
    }

    alert(`تم ${action} الزبون بنجاح`);
  } catch (err) {
    console.error(err);
    alert("حدث خطأ أثناء العملية. تحقق من أن الخادم يدعم حقل is_active.");
  }
}

/**
 * تنفيذ الحظر/فك الحظر من داخل المودال
 */
function toggleBlockFromModal() {
  if (!currentModalCustomer) return;
  toggleBlockCustomer(
    currentModalCustomer.id,
    !!currentModalCustomer.is_active,
  );
}

async function handleLogout() {
  await fetch(`${API_URL}/logout`, {
    method: "POST",
    headers: getHeaders(),
  });

  localStorage.removeItem("auth_token");
  window.location.href = "../login/login.html";
}
/* =========================
   قسم الحوالات المعلقة
========================= */
let allPendingTransfers = [];
let filteredPendingTransfers = [];
let pendingApproveId = null;

async function loadPendingTransfers() {
  // أيقونة تحديث دوّارة
  const refreshIcon = document.getElementById("pt-refresh-icon");
  if (refreshIcon) refreshIcon.classList.add("fa-spin");

  try {
    const res = await fetch(`${API_URL}/transfers`, { headers: getHeaders() });
    const json = await res.json();
    const all = json.data || [];

    // فلتر: الحوالات المعلقة فقط (waiting)
    allPendingTransfers = all.filter((t) => t.status === "waiting");
    filteredPendingTransfers = [...allPendingTransfers];

    renderPendingHeroStats(allPendingTransfers);
    populatePendingOfficeFilter(allPendingTransfers);
    renderPendingTable(filteredPendingTransfers);
    updatePendingBadge(allPendingTransfers.length);
  } catch (e) {
    console.error("Error loading pending transfers:", e);
    const tbody = document.getElementById("pt-tbody");
    if (tbody)
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:#dc2626;"><i class="fa-solid fa-triangle-exclamation" style="font-size:24px;display:block;margin-bottom:10px;"></i>خطأ في تحميل البيانات</td></tr>`;
  } finally {
    if (refreshIcon) refreshIcon.classList.remove("fa-spin");
  }
}

function renderPendingHeroStats(transfers) {
  const totalUsd = transfers.reduce(
    (s, t) => s + parseFloat(t.amount_in_usd || 0),
    0,
  );
  const offices = new Set(
    transfers.map((t) => t.destination_office_id).filter(Boolean),
  ).size;

  const countEl = document.getElementById("stat-pt-count");
  const usdEl = document.getElementById("stat-pt-usd");
  const officesEl = document.getElementById("stat-pt-offices");

  if (countEl) countEl.textContent = transfers.length;
  if (usdEl) usdEl.textContent = "$" + totalUsd.toFixed(0);
  if (officesEl) officesEl.textContent = offices;
}

function populatePendingOfficeFilter(transfers) {
  const sel = document.getElementById("pt-office-filter");
  if (!sel) return;

  const officeMap = {};
  transfers.forEach((t) => {
    if (t.destination_office_id) {
      const name = t.sender?.office?.name || ` ${t.destination_office?.name}`;
      officeMap[t.destination_office_id] = name;
    }
  });

  // إبقاء الخيار الأول
  const first = sel.options[0];
  sel.innerHTML = "";
  sel.appendChild(first);

  Object.entries(officeMap).forEach(([id, name]) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = name;
    sel.appendChild(opt);
  });
}

function filterPendingTransfers() {
  const q = (document.getElementById("pt-search")?.value || "")
    .toLowerCase()
    .trim();
  const officeId = document.getElementById("pt-office-filter")?.value || "";

  filteredPendingTransfers = allPendingTransfers.filter((t) => {
    const matchQ =
      !q ||
      (t.tracking_code || "").toLowerCase().includes(q) ||
      (t.receiver_name || "").toLowerCase().includes(q) ||
      (t.receiver_phone || "").includes(q) ||
      (t.sender?.name || "").toLowerCase().includes(q);

    const matchOffice =
      !officeId || String(t.destination_office_id) === String(officeId);

    return matchQ && matchOffice;
  });

  renderPendingTable(filteredPendingTransfers);
}

function renderPendingTable(transfers) {
  const tbody = document.getElementById("pt-tbody");
  const emptyEl = document.getElementById("pt-empty");
  if (!tbody) return;

  if (transfers.length === 0) {
    tbody.innerHTML = "";
    if (emptyEl) emptyEl.style.display = "block";
    return;
  }
  if (emptyEl) emptyEl.style.display = "none";

  tbody.innerHTML = transfers
    .map((t) => {
      const date = t.created_at
        ? new Date(t.created_at).toLocaleDateString("ar-SY")
        : "—";
      const senderName = t.sender?.name || "—";
      const currCode = t.send_currency?.code || t.currency?.code || "—";
      const destOffice = t.destination_office?.name
        ? `${t.destination_office?.name}`
        : t.destination_city || "—";
      const amount = parseFloat(t.amount).toLocaleString("ar-SY");

      return `
        <tr>
            <td style="font-family:monospace;font-size:11px;direction:ltr;color:#6366f1;font-weight:700;">${t.tracking_code || "—"}</td>
            <td style="font-weight:700;">${senderName}</td>
            <td style="font-weight:600;">${t.receiver_name || "—"}</td>
            <td style="direction:ltr;font-size:13px;color:var(--gray);">${t.receiver_phone || "—"}</td>
            <td style="font-weight:800;">${amount}</td>
            <td><span class="role-badge">${currCode}</span></td>
            <td style="font-size:13px;color:var(--gray);">${destOffice}</td>
            <td style="font-size:12px;color:var(--gray);">${date}</td>
            <td>
                <button onclick="openApproveModal(${t.id},'${t.tracking_code}','${t.receiver_name}')"
                    class="pt-approve-btn">
                    <i class="fa-solid fa-circle-check"></i> موافقة
                </button>
            </td>
        </tr>`;
    })
    .join("");
}

function updatePendingBadge(count) {
  const badge = document.getElementById("pending-transfers-badge");
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 99 ? "99+" : count;
    badge.style.display = "flex";
  } else {
    badge.style.display = "none";
  }
}

// ---- مودال الموافقة ----
function openApproveModal(id, trackingCode, receiverName) {
  pendingApproveId = id;
  const desc = document.getElementById("approve-modal-desc");
  if (desc)
    desc.innerHTML = `هل تريد الموافقة على الحوالة <strong style="color:#4338ca;">${trackingCode}</strong> للمستلم <strong>${receiverName}</strong>؟<br><br>سيتم تغيير حالتها إلى <strong style="color:#0c4a6e;">جاهزة للتسليم</strong> فوراً.`;
  const modal = document.getElementById("approve-modal");
  if (modal) {
    modal.style.display = "flex";
  }
}

function closeApproveModal() {
  const modal = document.getElementById("approve-modal");
  if (modal) modal.style.display = "none";
  pendingApproveId = null;
}

async function confirmApproveTransfer() {
  if (!pendingApproveId) return;

  const btn = document.getElementById("approve-confirm-btn");
  const originalHTML = btn.innerHTML;
  btn.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin"></i> جاري الموافقة...';
  btn.disabled = true;

  try {
    const res = await fetch(
      `${API_URL}/transfers/${pendingApproveId}/update-status`,
      {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status: "ready", fee: 0 }),
      },
    );

    const json = await res.json();
    if (res.ok && json.status === "success") {
      closeApproveModal();
      showToast("✅ تمت الموافقة على الحوالة بنجاح", "success");
      await loadPendingTransfers();
    } else {
      showToast(
        "❌ فشل تحديث الحوالة: " + (json.message || "خطأ غير معروف"),
        "error",
      );
    }
  } catch (e) {
    showToast("❌ خطأ في الاتصال بالخادم", "error");
    console.error(e);
  } finally {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  }
}

/* =========================
   SuperSafe — صندوق السوبر
========================= */
let _superSafeData = null;
let _superOfficesList = [];

async function loadSuperSafe() {
  try {
    const [safeRes, officesRes] = await Promise.all([
      fetch(`${API_URL}/super-safe`, { headers: getHeaders() }),
      fetch(`${API_URL}/offices`, { headers: getHeaders() }),
    ]);
    const safeJson = await safeRes.json();
    const officesJson = await officesRes.json();
    _superSafeData = safeJson.data;
    _superOfficesList = officesJson.data || [];
    renderSuperSafeCard();
  } catch (e) {
    console.error("loadSuperSafe error:", e);
  }
}

function renderSuperSafeCard() {
  const container = document.getElementById("super-safe-container");
  if (!container || !_superSafeData) return;

  const bal = parseFloat(_superSafeData.balance || 0);
  const fmtBal = bal.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const officeOpts = _superOfficesList
    .map((o) => `<option value="${o.id}">${o.name}</option>`)
    .join("");

  container.innerHTML = `
    <div class="super-safe-card">
        <!-- Header -->
        <div class="ss-header">
            <div class="ss-avatar"><i class="fa-solid fa-crown"></i></div>
            <div>
                <div class="ss-title">صندوق المدير العام </div>
                <div class="ss-subtitle">الخزينة الرئيسية للنظام</div>
            </div>
            <div class="ss-badge"> صندوق المدير العام </div>
        </div>
 
        <!-- الرصيد -->
        <div class="ss-balance-wrap" style="display: flex; justify-content: space-evenly; align-items: center;">
            <div style="flex: 1; text-align: center;">
                <div class="ss-balance-label">رصيد صندوق المدير العام</div>
                <div class="ss-balance-value" id="super-safe-balance">$${fmtBal}</div>
            </div>
            
            <div style="width: 1px; height: 60px; background: rgba(255,255,255,0.2);"></div>
            
            <div style="flex: 1; text-align: center;" class="company-total-container">
                <div class="ss-balance-label">الرصيد الإجمالي للشركة <i class="fa-solid fa-circle-info" style="font-size:11px; margin-right:4px; opacity:0.7;"></i></div>
                <div class="ss-balance-value" id="total-company-balance" style="color: #4ade80;">
                    <i class="fa-solid fa-spinner fa-spin" style="font-size:24px;"></i>
                </div>
                <div id="total-tooltip-container"></div>
            </div>
        </div>
 
        <!-- ثلاثة أعمدة للعمليات -->
        <div class="ss-panels-grid">
 
            <!-- إيداع/سحب يدوي -->
            <div class="ss-panel">
                <div class="ss-panel-title"><i class="fa-solid fa-pen-to-square"></i> إيداع / سحب</div>
                <div class="ss-row">
                    <input type="number" id="ss-adjust-amount" placeholder="المبلغ..." min="0.01" step="any" class="ss-input">
                </div>
                <div class="ss-row" style="gap:8px; margin-top:8px;">
                    <button class="ss-btn ss-btn-green" onclick="superSafeAdjust('deposit')">
                        <i class="fa-solid fa-plus"></i> إيداع
                    </button>
                    <button class="ss-btn ss-btn-red" onclick="superSafeAdjust('withdraw')">
                        <i class="fa-solid fa-minus"></i> سحب
                    </button>
                </div>
            </div>
 
            <!-- تحويل إلى مكتب -->
            <div class="ss-panel">
                <div class="ss-panel-title"><i class="fa-solid fa-paper-plane"></i> تحويل إلى مكتب</div>
                <select id="ss-to-office" class="ss-input" style="margin-bottom:8px;">
                    <option value="">اختر المكتب...</option>
                    ${officeOpts}
                </select>
                <div class="ss-row">
                    <input type="number" id="ss-to-office-amount" placeholder="المبلغ..." min="0.01" step="any" class="ss-input">
                    <button class="ss-btn ss-btn-blue" onclick="superTransferToOffice()">
                        <i class="fa-solid fa-arrow-left"></i> إرسال
                    </button>
                </div>
            </div>
 
            <!-- استلام من مكتب -->
            <div class="ss-panel">
                <div class="ss-panel-title"><i class="fa-solid fa-arrow-right-to-bracket"></i> استلام من مكتب</div>
                <select id="ss-from-office" class="ss-input" style="margin-bottom:8px;">
                    <option value="">اختر المكتب...</option>
                    ${officeOpts}
                </select>
                <div class="ss-row">
                    <input type="number" id="ss-from-office-amount" placeholder="المبلغ..." min="0.01" step="any" class="ss-input">
                    <button class="ss-btn ss-btn-orange" onclick="superTransferFromOffice()">
                        <i class="fa-solid fa-arrow-right"></i> استلام
                    </button>
                </div>
            </div>
        </div>
    </div>
 
    <!-- سجل عمليات السوبر -->
    <div class="ss-logs-section" style="margin-top:24px;">
        <div class="ss-logs-header">
            <div style="display:flex; align-items:center; gap:10px;">
                <i class="fa-solid fa-clock-rotate-left" style="color:var(--primary);"></i>
                <strong>سجل عمليات صندوق المدير العام</strong>
            </div>
            <button class="toolbar-btn" onclick="loadSuperSafeLogs()" title="تحديث">
                <i class="fa-solid fa-arrows-rotate"></i>
            </button>
        </div>
        <div class="table-wrapper" style="margin-top:12px;">
            <table class="data-table" id="super-logs-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>النوع</th>
                        <th>المبلغ</th>
                        <th>المكتب</th>
                        <th>الرصيد قبل</th>
                        <th>الرصيد بعد</th>
                        <th>ملاحظة</th>
                        <th>التاريخ</th>
                    </tr>
                </thead>
                <tbody id="super-logs-tbody">
                    <tr><td colspan="8" style="text-align:center;padding:20px;color:var(--gray);">جاري التحميل...</td></tr>
                </tbody>
            </table>
        </div>
    </div>`;

  loadSuperSafeLogs();
}

async function superSafeAdjust(type) {
  const amount = parseFloat(document.getElementById("ss-adjust-amount")?.value);
  if (!amount || amount <= 0) {
    showToast("يرجى إدخال مبلغ صحيح", "error");
    return;
  }

  const btn = event.currentTarget;
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

  try {
    const res = await fetch(`${API_URL}/super-safe/adjust`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ type, amount }),
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById("super-safe-balance").textContent =
        "$" +
        parseFloat(data.new_balance).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      document.getElementById("ss-adjust-amount").value = "";
      showToast(data.message || "تمت العملية بنجاح");
      loadSuperSafeLogs();
    } else {
      showToast(data.message || "حدث خطأ", "error");
    }
  } catch (e) {
    showToast("تعذر الاتصال بالخادم", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

async function superTransferToOffice() {
  const officeId = document.getElementById("ss-to-office")?.value;
  const amount = parseFloat(
    document.getElementById("ss-to-office-amount")?.value,
  );
  if (!officeId) {
    showToast("يرجى اختيار مكتب", "error");
    return;
  }
  if (!amount || amount <= 0) {
    showToast("يرجى إدخال مبلغ صحيح", "error");
    return;
  }

  const btn = event.currentTarget;
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

  try {
    const res = await fetch(`${API_URL}/super-safe/transfer-to-office`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ office_id: parseInt(officeId), amount }),
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById("super-safe-balance").textContent =
        "$" +
        parseFloat(data.super_safe_balance).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      document.getElementById("ss-to-office-amount").value = "";
      showToast(data.message || "تم التحويل بنجاح");
      loadSuperSafeLogs();
      loadSafes(); // تحديث بطاقات المكاتب
    } else {
      showToast(data.message || "حدث خطأ", "error");
    }
  } catch (e) {
    showToast("تعذر الاتصال بالخادم", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

async function superTransferFromOffice() {
  const officeId = document.getElementById("ss-from-office")?.value;
  const amount = parseFloat(
    document.getElementById("ss-from-office-amount")?.value,
  );
  if (!officeId) {
    showToast("يرجى اختيار مكتب", "error");
    return;
  }
  if (!amount || amount <= 0) {
    showToast("يرجى إدخال مبلغ صحيح", "error");
    return;
  }

  const btn = event.currentTarget;
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

  try {
    const res = await fetch(`${API_URL}/super-safe/transfer-from-office`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ office_id: parseInt(officeId), amount }),
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById("super-safe-balance").textContent =
        "$" +
        parseFloat(data.super_safe_balance).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      document.getElementById("ss-from-office-amount").value = "";
      showToast(data.message || "تم الاستلام بنجاح");
      loadSuperSafeLogs();
      loadSafes();
    } else {
      showToast(data.message || "حدث خطأ", "error");
    }
  } catch (e) {
    showToast("تعذر الاتصال بالخادم", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

async function loadSuperSafeLogs() {
  const tbody = document.getElementById("super-logs-tbody");
  if (!tbody) return;
  tbody.innerHTML =
    '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--gray);"><i class="fa-solid fa-spinner fa-spin"></i> جاري التحميل...</td></tr>';

  try {
    const res = await fetch(`${API_URL}/super-safe/logs`, {
      headers: getHeaders(),
    });
    const json = await res.json();
    const logs = json.data || [];

    if (!logs.length) {
      tbody.innerHTML =
        '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--gray);">لا توجد عمليات مسجلة</td></tr>';
      return;
    }

    const typeLabels = {
      deposit:
        '<span class="safe-log-badge log-dep"><i class="fa-solid fa-plus"></i> إيداع</span>',
      withdraw:
        '<span class="safe-log-badge log-wit"><i class="fa-solid fa-minus"></i> سحب</span>',
      transfer_to_office:
        '<span class="safe-log-badge log-to"><i class="fa-solid fa-arrow-left"></i> تحويل للمكتب</span>',
      transfer_from_office:
        '<span class="safe-log-badge log-from"><i class="fa-solid fa-arrow-right"></i> استلام من مكتب</span>',
    };

    tbody.innerHTML = logs
      .map(
        (log, i) => `
            <tr>
                <td style="color:var(--gray);font-size:12px;">${i + 1}</td>
                <td>${typeLabels[log.type] || log.type}</td>
                <td style="font-weight:800;color:var(--primary);">$${parseFloat(log.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                <td style="font-size:12px;">${log.office_name || "—"}</td>
                <td style="font-size:12px;color:var(--gray);">$${parseFloat(log.balance_before || 0).toFixed(2)}</td>
                <td style="font-size:12px;color:var(--success);font-weight:700;">$${parseFloat(log.balance_after || 0).toFixed(2)}</td>
                <td style="font-size:12px;color:var(--gray);">${log.note || "—"}</td>
                <td style="font-size:11px;color:var(--gray);">${log.created_at ? new Date(log.created_at).toLocaleString("ar-SY") : "—"}</td>
            </tr>`,
      )
      .join("");
  } catch (e) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--danger);">خطأ في تحميل السجل</td></tr>';
  }
}

/* =========================
   Safes — الصناديق (مع SuperSafe أولاً)
========================= */
async function loadSafes() {
  const grid = document.getElementById("office-safes-grid");
  const emptyEl = document.getElementById("safes-empty");
  if (!grid) return;

  grid.innerHTML =
    '<div class="safes-skeleton-grid">' +
    Array(4).fill('<div class="safe-card-skeleton"></div>').join("") +
    "</div>";
  if (emptyEl) emptyEl.classList.add("hidden");

  // 1. جلب رصيد السوبر أدمن أولاً
  await loadSuperSafe();

  try {
    const res = await fetch(`${API_URL}/safes`, { headers: getHeaders() });
    const json = await res.json();
    const allSafes = json.data || [];

    // ---------------------------------------------------------
    // 2. حساب الرصيد الإجمالي وتصنيفاته
    // ---------------------------------------------------------
    let totalCompany = parseFloat(_superSafeData?.balance || 0);
    
    // كائن لتخزين مجاميع كل نوع من الصناديق
    let totalsByType = {
        super: parseFloat(_superSafeData?.balance || 0),
        office: 0,
        main: 0,
        trading: 0,
        profit: 0,
        
    };
    
    allSafes.forEach(safe => {
        if (safe.type === 'profit_safe') {
            let profitTotal =   parseFloat(safe.profit_main || 0);
          
            totalCompany += profitTotal;
            totalsByType.profit += profitTotal;
        } else {
            let bal = parseFloat(safe.balance || 0);
            totalCompany += bal;
            
            // توزيع الرصيد حسب نوع الصندوق
            if (safe.type === 'office_safe') totalsByType.office += bal;
            if (safe.type === 'main_safe') totalsByType.main += bal;
            if (safe.type === 'trading_safe') totalsByType.trading += bal;
        }
    });

    // دالة مساعدة لتنسيق الأرقام
    const fmt = (num) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // تحديث الواجهة بالمجموع الكلي
    const totalCompanyEl = document.getElementById('total-company-balance');
    if (totalCompanyEl) {
        totalCompanyEl.textContent = "$" + fmt(totalCompany);
    }

    // بناء القائمة المنسدلة (Tooltip)
    const tooltipContainer = document.getElementById('total-tooltip-container');
    if (tooltipContainer) {
        tooltipContainer.innerHTML = `
            <div class="custom-tooltip">
                <div class="tt-row">
                    <span class="tt-label"><i class="fa-solid fa-crown" style="color:var(--warning);"></i>صندوق المدير العام</span> 
                    <span class="tt-val">$${fmt(totalsByType.super)}</span>
                </div>
                <div class="tt-row">
                    <span class="tt-label"><i class="fa-solid fa-building"></i> صناديق المكاتب :</span> 
                    <span class="tt-val">$${fmt(totalsByType.office)}</span>
                </div>
                <div class="tt-row">
                    <span class="tt-label"><i class="fa-solid fa-vault"></i> الصناديق الحوالات:</span> 
                    <span class="tt-val">$${fmt(totalsByType.main)}</span>
                </div>
                <div class="tt-row">
                    <span class="tt-label"><i class="fa-solid fa-chart-line"></i> صناديق التداول :</span> 
                    <span class="tt-val">$${fmt(totalsByType.trading)}</span>
                </div>
                <div class="tt-row">
                    <span class="tt-label"><i class="fa-solid fa-sack-dollar"></i> صناديق الأرباح :</span> 
                    <span class="tt-val">$${fmt(totalsByType.profit)}</span>
                </div>
            </div>
        `;
    }
    // ---------------------------------------------------------

    const officeSafes = allSafes
      .filter((s) => s.type === "office_safe")
      .sort((a, b) => (a.owner || "").localeCompare(b.owner || ""));

    grid.innerHTML = "";

    const total = officeSafes.reduce(
      (sum, s) => sum + parseFloat(s.balance || 0),
      0,
    );
    const totalEl = document.getElementById("safes-total-balance");
    const countEl = document.getElementById("safes-office-count");
    if (totalEl) totalEl.textContent = "$" + fmt(total);
    if (countEl) countEl.textContent = officeSafes.length;

    const dashSafes = document.getElementById("dash-safes-count");
    if (dashSafes) dashSafes.textContent = officeSafes.length;

    if (officeSafes.length === 0) {
      if (emptyEl) emptyEl.classList.remove("hidden");
      return;
    }

    officeSafes.forEach((safe) => {
      const balance = parseFloat(safe.balance || 0);
      const balanceSy = parseFloat(safe.balance_sy || 0);
      const isPositive = balance >= 0;
      const initials = (safe.owner || "?").charAt(0).toUpperCase();
      const levelClass =
        balance >= 10000
          ? "safe-level-high"
          : balance >= 1000
            ? "safe-level-mid"
            : "safe-level-low";

      const card = document.createElement("div");
      card.className = `office-safe-card ${levelClass}`;
      card.dataset.owner = (safe.owner || "").toLowerCase();
      card.innerHTML = `
                <div class="osc-header">
                    <div class="osc-avatar">${initials}</div>
                    <div class="osc-info">
                        <div class="osc-name">${safe.owner || "—"}</div>
                        <div class="osc-badge"><i class="fa-solid fa-building"></i> صندوق مكتب</div>
                    </div>
                    <div class="osc-status-dot ${isPositive ? "dot-green" : "dot-red"}"></div>
                </div>
                <div class="osc-divider"></div>
                <div class="osc-balance">
                    <span class="osc-balance-label">الرصيد (USD)</span>
                    <span class="osc-balance-value ${isPositive ? "bal-positive" : "bal-negative"}">
                        $${fmt(balance)}
                    </span>
                </div>
                ${
                  balanceSy > 0
                    ? `
                <div class="osc-balance" style="margin-top:4px;">
                    <span class="osc-balance-label" style="font-size:11px;">رصيد الليرة السورية</span>
                    <span style="font-size:16px;font-weight:800;color:#ea580c;">
                        ${balanceSy.toLocaleString("en-US", { minimumFractionDigits: 0 })} SYP
                    </span>
                </div>`
                    : ""
                }
                <div class="osc-footer">
                    <div class="osc-meta"><i class="fa-solid fa-circle-dollar-to-slot"></i><span>USD</span></div>
                    <button class="osc-detail-btn" onclick='openSafeDetails(${JSON.stringify(safe)})'>
                        <i class="fa-solid fa-eye"></i> التفاصيل
                    </button>
                </div>`;
      grid.appendChild(card);
    });
  } catch (e) {
    console.error("loadSafes error:", e);
    grid.innerHTML =
      '<p style="text-align:center;color:var(--danger);padding:32px;">تعذّر تحميل الصناديق</p>';
  }
}
function filterSafeCards() {
  const q = (
    document.getElementById("safes-search")?.value || ""
  ).toLowerCase();
  document.querySelectorAll(".office-safe-card").forEach((card) => {
    card.style.display = card.dataset.owner?.includes(q) ? "" : "none";
  });
}

function openSafeDetails(safe) {
  document.getElementById("detail-type").textContent = safe.type;
  document.getElementById("detail-owner").textContent = safe.owner;
  document.getElementById("detail-currency").textContent = safe.currency ?? "-";
  document.getElementById("detail-balance").textContent =
    "$" + parseFloat(safe.balance).toFixed(2);
  document.getElementById("detail-cost").textContent = safe.cost ?? "-";
  document.getElementById("safe-details-modal").classList.remove("hidden");
}

function closeSafeDetails() {
  document.getElementById("safe-details-modal").classList.add("hidden");
}

// toast بسيط إن لم يكن موجوداً
function showToast(msg, type = "success") {
  // إن كان هناك showNotification أو toast مخصص، استخدمه
  if (typeof showNotification === "function") {
    showNotification(msg, type);
    return;
  }
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.cssText = `position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:${type === "success" ? "#16a34a" : "#dc2626"};color:#fff;padding:14px 28px;border-radius:12px;font-weight:700;font-size:14px;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.2);`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

/* =========================
   Init App
========================= */
let token = null;

document.addEventListener("DOMContentLoaded", async () => {
  token = await checkAuth();
  if (!token) return;

  await loadOffices();
  await loadOfficesForSelect();
  await initOfficeCities();
  await loadCustomers();
  await initAgentLocation();
  await loadCurrencies();
  await loadEmployees();
  await renderCurrenciesTable();
  await initPricePreview();
  await loadSafes();

  // تحميل عدد الحوالات المعلقة لعرض الـ badge
  loadPendingTransfers();

  // تحميل بيانات المستخدم الحالي
  await loadCurrentUser();

  // استعادة القسم الأخير أو الرئيسية افتراضياً
  const lastSection =
    localStorage.getItem("super_active_section") || "dashboard";
  showSection(lastSection);

  // تحديث الوقت كل دقيقة
  setInterval(() => {
    const timeEl = document.getElementById("dash-time");
    if (timeEl) timeEl.textContent = new Date().toLocaleTimeString("ar-SY");
  }, 60000);

  // إغلاق الـ dropdown عند الضغط خارجه
  document.addEventListener("click", (e) => {
    const wrapper = document
      .getElementById("profile-toggle-btn")
      ?.closest(".profile-wrapper");
    if (wrapper && !wrapper.contains(e.target)) {
      closeProfileDropdown();
    }
  });
});

/* =========================
   Profile: Load Current User
========================= */
async function loadCurrentUser() {
  try {
    const res = await fetch(`${API_URL}/me`, { headers: getHeaders() });
    if (!res.ok) return;
    const json = await res.json();
    const user = json.data ?? json;

    // تحديث الاسم في الهيدر
    const nameEl = document.getElementById("user-name");
    if (nameEl) nameEl.textContent = user.name ?? "—";

    // تحديث الـ dropdown
    const dnName = document.getElementById("dropdown-user-name");
    const dnEmail = document.getElementById("dropdown-user-email");
    if (dnName) dnName.textContent = user.name ?? "—";
    if (dnEmail) dnEmail.textContent = user.email ?? "—";

    // تخزين البيانات لملء النموذج لاحقاً
    window._currentUser = user;
  } catch (e) {
    console.error("Failed to load current user:", e);
  }
}

/* =========================
   Profile Dropdown Toggle
========================= */
function toggleProfileDropdown() {
  const dropdown = document.getElementById("profile-dropdown");
  const chevron = document.getElementById("profile-chevron");
  const profileBtn = document.getElementById("profile-toggle-btn");
  if (dropdown.classList.contains("hidden")) {
    dropdown.classList.remove("hidden");
    chevron.classList.add("rotated");
    profileBtn.classList.add("active");
  } else {
    closeProfileDropdown();
  }
}

function closeProfileDropdown() {
  const dropdown = document.getElementById("profile-dropdown");
  const chevron = document.getElementById("profile-chevron");
  const profileBtn = document.getElementById("profile-toggle-btn");
  dropdown?.classList.add("hidden");
  chevron?.classList.remove("rotated");
  profileBtn?.classList.remove("active");
}

/* =========================
   Profile Modal
========================= */

function openProfileModal() {
  document.getElementById("profile-modal")?.classList.remove("hidden");
  const user = window._currentUser;
  if (user) {
    const nameEl = document.getElementById("profile-edit-name");
    const emailEl = document.getElementById("profile-edit-email");
    const phoneEl = document.getElementById("profile-edit-phone");
    const displayName = document.getElementById("profile-modal-name-display");
    const displayEmail = document.getElementById("profile-modal-email-display");
    if (nameEl) nameEl.value = user.name ?? "";
    if (emailEl) emailEl.value = user.email ?? "";
    if (phoneEl) phoneEl.value = user.phone ?? "";
    if (displayName) displayName.textContent = user.name ?? "—";
    if (displayEmail) displayEmail.textContent = user.email ?? "—";
  }
}
function closeProfileModal() {
  document.getElementById("profile-modal")?.classList.add("hidden");
}

// معالجة حفظ الملف الشخصي
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profile-edit-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const body = {};
    const name = document.getElementById("profile-edit-name").value.trim();
    const email = document.getElementById("profile-edit-email").value.trim();
    const phone = document.getElementById("profile-edit-phone").value.trim();
    const password = document.getElementById("profile-edit-password").value;

    if (name) body.name = name;
    if (email) body.email = email;
    if (phone) body.phone = phone;
    if (password) body.password = password;

    try {
      const res = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (res.ok) {
        window._currentUser = json.data ?? json;
        await loadCurrentUser();
        closeProfileModal();
        if (typeof notyf !== "undefined") {
          notyf.success("تم تحديث الملف الشخصي بنجاح");
        }
      } else {
        if (typeof notyf !== "undefined") {
          notyf.error(json.message ?? "فشل التحديث");
        }
      }
    } catch (err) {
      console.error("Profile update error:", err);
      if (typeof notyf !== "undefined") {
        notyf.error("حدث خطأ أثناء التحديث");
      }
    }
  });
});
// ===== وظائف إضافية للواجهة المحسّنة =====

function filterSafesTable() {
  const q = (
    document.getElementById("safes-search")?.value || ""
  ).toLowerCase();
  const rows = document.querySelectorAll("#safes-table-body tr");
  rows.forEach((row) => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
  });
}

/* ==============================================
   إدارة شرائح أسعار الصرف - Currency Rate Tiers
   ============================================== */

let currentRatesCurrencyId = null;

function openRatesModal(currencyId, name, code, rates) {
    currentRatesCurrencyId = currencyId;
    document.getElementById('rates-modal-currency-name').textContent = name;
    document.getElementById('rates-modal-currency-code').textContent = code;

    const container = document.getElementById('rates-tiers-container');
    container.innerHTML = '';

    if (rates && rates.length > 0) {
        rates.forEach(tier => addRateTier(tier));
    } else {
        // شريحة افتراضية واحدة فارغة
        addRateTier();
    }

    document.getElementById('rates-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeRatesModal() {
    document.getElementById('rates-modal').classList.add('hidden');
    document.body.style.overflow = '';
    currentRatesCurrencyId = null;
}

function handleRatesModalBackdrop(e) {
    if (e.target === document.getElementById('rates-modal')) {
        closeRatesModal();
    }
}

function addRateTier(data = null) {
    const container = document.getElementById('rates-tiers-container');
    const index = container.querySelectorAll('.rate-tier-row').length + 1;

    const row = document.createElement('div');
    row.className = 'rate-tier-row';
    row.innerHTML = `
        <div class="tier-number">${index}</div>
        <div class="tier-fields">
            <div class="tier-field">
                <label><i class="fa-solid fa-arrow-down"></i> من (USD)</label>
                <input type="number" class="tier-min" placeholder="0" min="0" step="any"
                    value="${data ? data.min_amount : ''}">
            </div>
            <div class="tier-field">
                <label><i class="fa-solid fa-arrow-up"></i> إلى (USD)</label>
                <input type="number" class="tier-max" placeholder="∞ لا نهاية" min="0" step="any"
                    value="${data && data.max_amount != null ? data.max_amount : ''}">
                <small class="tier-hint">اتركه فارغاً = ما لا نهاية</small>
            </div>
            <div class="tier-field">
                <label><i class="fa-solid fa-dollar-sign"></i> السعر مقابل الدولار</label>
                <input type="number" class="tier-rate" placeholder="1.0000" min="0" step="any"
                    value="${data ? data.rate : ''}">
            </div>
        </div>
        <button class="tier-delete-btn" onclick="removeTierRow(this)" title="حذف هذه الشريحة">
            <i class="fa-solid fa-trash"></i>
        </button>
    `;
    container.appendChild(row);
    reindexTiers();
}

function removeTierRow(btn) {
    const row = btn.closest('.rate-tier-row');
    row.style.opacity = '0';
    row.style.transform = 'translateX(20px)';
    setTimeout(() => {
        row.remove();
        reindexTiers();
    }, 250);
}

function reindexTiers() {
    const rows = document.querySelectorAll('.rate-tier-row');
    rows.forEach((row, i) => {
        row.querySelector('.tier-number').textContent = i + 1;
    });
}

async function saveRates() {
    if (!currentRatesCurrencyId) return;

    const rows = document.querySelectorAll('.rate-tier-row');
    const rates = [];
    let hasError = false;

    rows.forEach((row, i) => {
        const min = row.querySelector('.tier-min').value;
        const max = row.querySelector('.tier-max').value;
        const rate = row.querySelector('.tier-rate').value;

        if (min === '' || rate === '') {
            row.querySelector('.tier-min').style.borderColor = min === '' ? 'var(--danger)' : '';
            row.querySelector('.tier-rate').style.borderColor = rate === '' ? 'var(--danger)' : '';
            hasError = true;
            return;
        }

        // إعادة تلوين الحقول الصحيحة
        row.querySelector('.tier-min').style.borderColor = '';
        row.querySelector('.tier-rate').style.borderColor = '';

        rates.push({
            min_amount: parseFloat(min),
            max_amount: max !== '' ? parseFloat(max) : null,
            rate: parseFloat(rate)
        });
    });

    if (hasError) {
        if (typeof notyf !== 'undefined') notyf.error('يرجى ملء جميع حقول الشريحة (من، السعر)');
        else alert('يرجى ملء جميع حقول الشريحة (من، السعر)');
        return;
    }

    if (rates.length === 0) {
        if (typeof notyf !== 'undefined') notyf.error('أضف شريحة واحدة على الأقل');
        else alert('أضف شريحة واحدة على الأقل');
        return;
    }

    const saveBtn = document.querySelector('.btn-save-rates');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';

    try {
        const res = await fetch(`${API_URL}/currencies/${currentRatesCurrencyId}/rates`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ rates })
        });

        const data = await res.json();

        if (data.status === 'success') {
            if (typeof notyf !== 'undefined') notyf.success('تم حفظ الشرائح بنجاح');
            else alert('تم حفظ الشرائح بنجاح');
            closeRatesModal();
            // إعادة تحميل جدول العملات لعرض عدد الشرائح المحدث
            renderCurrenciesTable();
        } else {
            if (typeof notyf !== 'undefined') notyf.error(data.message ?? 'فشل الحفظ');
            else alert('فشل الحفظ: ' + (data.message ?? ''));
        }
    } catch (err) {
        console.error(err);
        if (typeof notyf !== 'undefined') notyf.error('تعذر الاتصال بالسيرفر');
        else alert('تعذر الاتصال بالسيرفر');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ الشرائح';
    }
}