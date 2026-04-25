const API_URL = "https://flashpay-back-1.onrender.com/api";
async function checkAuth() {
  const token = localStorage.getItem("auth_token"); // ✅ مفتاح موحّد مع getHeaders

  if (!token) {
    window.location.replace("../index.html");
    return null;
  }

  try {
    const res = await fetch("https://flashpay-back-1.onrender.com/api/me", {
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      localStorage.clear();
      window.location.replace("../index.html");
      return null;
    }

    const data = await res.json();
    const userRole = data.user.role;

    const ALLOWED_ROLES = ["admin"]; // ✅ صلاحية هذا الـ dashboard

    if (!ALLOWED_ROLES.includes(userRole)) {
      // 1. عرض الـ Lottie
      showUnauthorizedLottie();

      // 2. الانتظار لمدة 3 ثوانٍ ثم التوجيه
      setTimeout(() => {
        redirectByRole(userRole);
      }, 10000);

      return null;
    }

    return token; // ✅ إرجاع التوكن لاستخدامه في باقي الكود
  } catch (e) {
    localStorage.clear();
    window.location.replace("../index.html");
    return null;
  }
}

// 🟢 دالة لعرض الـ Lottie بملء الشاشة
function showUnauthorizedLottie() {
  // إنشاء حاوية تغطي الشاشة بالكامل
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "100vw";
  container.style.height = "100vh";
  container.style.backgroundColor = "#ffffff"; // لون الخلفية (يمكنك تغييره)
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.justifyContent = "center";
  container.style.alignItems = "center";
  container.style.zIndex = "9999";

  // إضافة نص توضيحي (اختياري)
  const text = document.createElement("h2");
  text.innerText = "عذراً، ليس لديك صلاحية للوصول إلى هذه الصفحة";
  text.style.fontFamily = "Arial, sans-serif";
  text.style.color = "#333";
  text.style.marginTop = "20px";

  // حاوية الأنيميشن
  const lottieContainer = document.createElement("div");
  lottieContainer.style.width = "300px"; // حجم الأنيميشن
  lottieContainer.style.height = "300px";

  container.appendChild(lottieContainer);
  container.appendChild(text);
  document.body.appendChild(container);

  // تشغيل الأنيميشن
  lottie.loadAnimation({
    container: lottieContainer,
    renderer: "svg",
    loop: true,
    autoplay: true,
    // ⚠️ ضع رابط ملف الـ JSON الخاص بالـ Lottie هنا
    path: "https://assets3.lottiefiles.com/packages/lf20_0s6tfbuc.json",
  });
}
function redirectByRole(role) {
  const routes = {
    super_admin: "../super_admin/super.html",
    admin: "../office_manager/admin.html",
    cashier: "../cashier/cashier.html",
    accountant: "../accountant/accountant.html",
    agent: "../agent/agent.html",
    customer: "../customer/customer.html",
  };
  window.location.replace(routes[role] || "../index.html");
}

async function rejectTransfer(transferId) {
  try {
    const res = await fetch(
      `${API_URL}/transfers/${transferId}/update-status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          status: "rejected",
        }),
      },
    );

    const data = await res.json();

    if (res.ok) {
      alert("تم رفض الحوالة");
      loadPendingTransfers();
    } else {
      alert(data.message || "حدث خطأ");
    }
  } catch (error) {
    console.error(error);
    alert("خطأ في الاتصال");
  }
}
async function showAllTransfers() {
  document.querySelector(".card").style.display = "none";
  document.getElementById("all-transfers-card").style.display = "block";
  loadAllTransfers();
}
function showPendingTransfers() {
  document.getElementById("pending-transfers-card").style.display = "block";
  document.getElementById("all-transfers-card").style.display = "none";
}
function showAllTransfers() {
  document.getElementById("pending-transfers-card").style.display = "none";
  document.getElementById("all-transfers-card").style.display = "block";

  loadAllTransfers(); // فصل التحميل عن العرض (أفضل تنظيم)
}

function setActive(element) {
  document
    .querySelectorAll(".sidebar nav li")
    .forEach((li) => li.classList.remove("active"));

  element.parentElement.classList.add("active");
}
async function loadAllTransfers() {
  const tbody = document.getElementById("all-transfers-list");
  const emptyEl = document.getElementById("all-transfers-empty");
  tbody.innerHTML =
    '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--gray);">جاري التحميل...</td></tr>';

  try {
    const res = await fetch(`${API_URL}/transfers`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const json = await res.json();
    tbody.innerHTML = "";

    if (!json.data || json.data.length === 0) {
      emptyEl?.classList.remove("hidden");
      document.getElementById("stat-all-count").textContent = "0";
      return;
    }

    emptyEl?.classList.add("hidden");
    document.getElementById("stat-all-count").textContent = json.data.length;

    const statusMap = {
      pending: { cls: "status-pending", text: "قيد الانتظار" },
      approved: { cls: "status-approved", text: "موافق عليها" },
      waiting: { cls: "status-pending", text: "بانتظار المكتب" },
      ready: { cls: "status-approved", text: "جاهزة للتسليم" },
      completed: { cls: "status-approved", text: "مكتملة" },
      rejected: { cls: "status-rejected", text: "مرفوضة" },
      cancelled: { cls: "status-rejected", text: "ملغاة" },
    };

    json.data.forEach((transfer) => {
      const s = statusMap[transfer.status] ?? {
        cls: "",
        text: transfer.status,
      };
      const amountUsd = Number(transfer.amount_in_usd ?? 0);
      const sendAmount = Number(transfer.amount ?? 0);
      const sendCurrency =
        transfer.send_currency?.code ?? transfer.sendCurrency?.code ?? "—";
      const recvCurrency = transfer.currency?.code ?? "—";
      const recvPrice = Number(transfer.currency?.price ?? 1);
      const deliveryAmt = recvPrice > 0 ? amountUsd / recvPrice : 0;
      const fee = Number(transfer.fee ?? 0);
      const date = transfer.created_at
        ? new Date(transfer.created_at).toLocaleString("ar-SY")
        : "—";

      const destHtml = transfer.destination_office_id
        ? `<div style="display:flex;align-items:center;gap:5px;font-size:12px;">
       <i class="fa-solid fa-building" style="color:var(--primary);"></i>
       <span>${transfer.destination_office?.name ?? `مكتب #${transfer.destination_office_id}`}</span>
     </div>`
        : `<div style="display:flex;align-items:center;gap:5px;font-size:12px;">
       <i class="fa-solid fa-globe" style="color:#7c3aed;"></i>
       <span>${transfer.destination_city ?? "—"}</span>
     </div>`;
      const trackHtml = transfer.tracking_code
        ? `<span class="tracking-code">${transfer.tracking_code}</span>`
        : "";

      tbody.innerHTML += `
        <tr data-status="${transfer.status}">
          <td>
            <span style="font-weight:800;color:var(--primary);">#${transfer.id}</span>
            ${trackHtml}
          </td>
          <td>
            <div style="font-weight:800;color:var(--primary);">$${amountUsd.toFixed(2)}</div>
            <div style="font-size:11px;color:var(--gray);direction:ltr;margin-top:2px;">${sendAmount.toFixed(2)} ${sendCurrency}</div>
            <div style="font-size:11px;color:#7c3aed;margin-top:2px;">يستلم: <b>${deliveryAmt.toFixed(2)} ${recvCurrency}</b></div>
          </td>
          <td>
            <div style="font-weight:700;">${transfer.sender?.name ?? "—"}</div>
            <div style="font-size:11px;color:var(--gray);">${transfer.sender?.phone ?? ""}</div>
          </td>
          <td>
            <div style="font-weight:700;">${transfer.receiver_name ?? "—"}</div>
            <div style="font-size:11px;color:var(--gray);direction:ltr;">${transfer.receiver_phone ?? ""}</div>
          </td>
          <td>${destHtml}</td>
          <td style="font-weight:700;color:var(--primary);">
            ${fee > 0 ? "$" + fee.toFixed(2) : '<span style="color:var(--gray);">—</span>'}
          </td>
          <td><span class="status-badge ${s.cls}" data-status="${transfer.status}">${s.text}</span></td>
          <td style="font-size:12px;color:var(--gray);">${date}</td>
          <td>
            <button class="btn-edit-transfer"
              onclick='openEditModal(${JSON.stringify(transfer).replace(/'/g, "\'")})'>
              <i class="fa-solid fa-pen-to-square"></i> تعديل
            </button>
          </td>
        </tr>`;
    });
  } catch (error) {
    console.error("loadAllTransfers error:", error);
    tbody.innerHTML =
      '<tr><td colspan="9" style="text-align:center;color:var(--danger);padding:20px;">خطأ في التحميل</td></tr>';
  }
}

// --- وظائف عرض الأقسام الجديدة ---

function hideAllCards() {
  document.getElementById("pending-transfers-card").style.display = "none";
  document.getElementById("all-transfers-card").style.display = "none";
  document.getElementById("office-info-card").style.display = "none";
  document.getElementById("safes-card").style.display = "none";
  document.getElementById("profits-card").style.display = "none";
  const histCard = document.getElementById("transfer-history-card");
  if (histCard) histCard.style.display = "none";
  const safeLogsCard = document.getElementById("safe-logs-card");
  if (safeLogsCard) safeLogsCard.style.display = "none";
  document.getElementById("createtransfer").style.display = "none";
  const intlCard = document.getElementById("createtransfer-intl");
  if (intlCard) intlCard.style.display = "none";
}

async function showOfficeSection() {
  hideAllCards();
  document.getElementById("office-info-card").style.display = "block";

  try {
    // 1. جلب بيانات المستخدم الحالي لمعرفة مكتبه
    const meRes = await fetch(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Me Response:", meRes);
    const meData = await meRes.json();
    const myOfficeId = meData.user.office_id;
    console.log("My Office ID:", myOfficeId);
    // 2. جلب بيانات المكتب
    const officeRes = await fetch(`${API_URL}/offices`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Offices Response:", officeRes);
    const officesJson = await officeRes.json();
    const myOffice = officesJson.data.find((o) => o.id === myOfficeId);
    console.log("myOffice", myOffice);
    if (myOffice) {
      document.getElementById("office-details").innerHTML = `
                <div class="office-info-item">
                    <i class="fa-solid fa-building"></i>
                    <div><span class="info-label">اسم المكتب</span><span class="info-value">${myOffice.name}</span></div>
                </div>
                <div class="office-info-item">
                    <i class="fa-solid fa-city"></i>
                    <div><span class="info-label">المدينة</span><span class="info-value">${myOffice.city?.name || "—"}</span></div>
                </div>
                <div class="office-info-item">
                    <i class="fa-solid fa-map-marker-alt"></i>
                    <div><span class="info-label">العنوان</span><span class="info-value">${myOffice.address || "غير محدد"}</span></div>
                </div>
            `;
      const statStaff = document.getElementById("stat-staff-count");
    }

    // 3. جلب الموظفين وفلترتهم حسب المكتب
    const usersRes = await fetch(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const usersJson = await usersRes.json();
    const staff = usersJson.data.filter(
      (u) =>
        u.office_id === myOfficeId &&
        (u.role === "cashier" || u.role === "accountant"),
    );
    const tbody = document.getElementById("staff-list");
    tbody.innerHTML = staff
      .map(
        (user) => `
            <tr>
                <td>${user.name}</td>
                <td>${user.role === "cashier" ? "كاشير" : "محاسب"}</td>
                <td>${user.phone}</td>
                <td><span class="status-badge status-approved">نشط</span></td>
            </tr>
        `,
      )
      .join("");
  } catch (e) {
    console.error("Error loading office info:", e);
  }
}

async function showSafesSection() {
  hideAllCards();
  document.getElementById("safes-card").style.display = "block";

  const container = document.getElementById("safes-container");

  // fetch آمن — يرجع null بدون crash
  async function safeGet(url) {
    try {
      const r = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) {
        console.warn("[safes]", url, "→", r.status);
        return null;
      }
      return await r.json();
    } catch (e) {
      console.warn("[safes] network error:", e);
      return null;
    }
  }

  try {
    const [json, meData, eSafeJson] = await Promise.all([
      safeGet(`${API_URL}/safes`),
      safeGet(`${API_URL}/me`),
      safeGet(`${API_URL}/electronic-safe/balances`),
    ]);

    if (!meData?.user) {
      container.innerHTML = `<p style="color:red;padding:20px;">تعذّر تحميل بيانات المستخدم.</p>`;
      return;
    }

    const myOfficeId = meData.user.office_id;
    const allSafes = json?.data ?? [];
    const mySafes = allSafes.filter((s) => s.office_id === myOfficeId);

    if (!json?.data) {
      container.innerHTML = `<p style="color:orange;padding:20px;">تعذّر تحميل الصناديق. راجع الـ console للتفاصيل.</p>`;
      return;
    }
    // ─── فصل الأنواع الثلاثة ──────────────────────────────────
    const officeSafe = mySafes.find((s) => s.type === "office_safe");
    const mainSafe = mySafes.find((s) => s.type === "office_main");
    const tradingSafes = mySafes.filter((s) => s.type === "trading");
    const profitSafe = mySafes.filter((s) => s.type === "profit_safe")[0] || {
      profit_trade: 0,
      profit_main: 0,
    };

    // ─── 1. بطاقة خزنة المكتب (OfficeSafe) ──────────────────
    const officeSafeCard = officeSafe
      ? `
    <div class="safe-card safe-card-office" id="office-safe-card">
        <div class="safe-card-header">
            <div class="safe-card-icon"><i class="fa-solid fa-building-columns"></i></div>
            <div>
                <div class="safe-card-title">خزنة المكتب</div>
                <div class="safe-card-subtitle">USD + SYP</div>
            </div>
        </div>

        <!-- رصيد الدولار -->
        <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:4px;">
            <div class="safe-card-balance" id="office-safe-balance" style="font-size:28px;">
                ${parseFloat(officeSafe.balance).toLocaleString()}
            </div>
            <div class="safe-card-currency">USD</div>
        </div>

        <!-- رصيد الليرة السورية -->
        <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:14px;
                    padding:8px 12px;background:rgba(234,88,12,.07);border-radius:8px;">
            <i class="fa-solid fa-coins" style="color:#ea580c;font-size:13px;"></i>
            <span style="font-size:13px;color:var(--gray);">رصيد الليرة السورية:</span>
            <span id="office-safe-balance-sy" style="font-size:20px;font-weight:800;color:#ea580c;">
                ${parseFloat(officeSafe.balance_sy || 0).toLocaleString()}
            </span>
            <span style="font-size:12px;color:#ea580c;font-weight:600;">SYP</span>
        </div>

        <!-- إيداع / سحب دولار -->
        <div class="office-safe-panel">
            <div class="office-safe-panel-title">
                <i class="fa-solid fa-pen-to-square"></i> تعديل يدوي — دولار (USD)
            </div>
            <div class="office-safe-row">
                <input type="number" id="adjust-amount" class="trading-input"
                       placeholder="المبلغ بالدولار..." min="0.01" step="any">
                <button class="osafe-btn osafe-btn-dep"
                        onclick="officeSafeAdjust('deposit', ${myOfficeId}, 'usd')">
                    <i class="fa-solid fa-plus"></i> إيداع
                </button>
                <button class="osafe-btn osafe-btn-wit"
                        onclick="officeSafeAdjust('withdraw', ${myOfficeId}, 'usd')">
                    <i class="fa-solid fa-minus"></i> سحب
                </button>
            </div>
            <div class="office-safe-row" style="margin-top:6px;">
                <input type="text" id="adjust-notes" class="trading-input"
                       placeholder="ملاحظة (اختياري)..." style="font-size:12px;">
            </div>
        </div>

        <!-- إيداع / سحب ليرة سورية -->
        <div class="office-safe-panel" style="border-color:rgba(234,88,12,.25);">
            <div class="office-safe-panel-title" style="color:#ea580c;">
                <i class="fa-solid fa-coins"></i> تعديل يدوي — ليرة سورية (SYP)
            </div>
            <div class="office-safe-row">
                <input type="number" id="adjust-amount-sy" class="trading-input"
                       placeholder="المبلغ بالليرة السورية..." min="1" step="any">
                <button class="osafe-btn osafe-btn-dep"
                        onclick="officeSafeAdjust('deposit', ${myOfficeId}, 'sy')">
                    <i class="fa-solid fa-plus"></i> إيداع
                </button>
                <button class="osafe-btn osafe-btn-wit"
                        onclick="officeSafeAdjust('withdraw', ${myOfficeId}, 'sy')">
                    <i class="fa-solid fa-minus"></i> سحب
                </button>
            </div>
            <div class="office-safe-row" style="margin-top:6px;">
                <input type="text" id="adjust-notes-sy" class="trading-input"
                       placeholder="ملاحظة (اختياري)..." style="font-size:12px;">
            </div>
        </div>

        <!-- تحويل إلى صندوق آخر (USD فقط) -->
        <div class="office-safe-panel">
            <div class="office-safe-panel-title">
                <i class="fa-solid fa-right-left"></i> تحويل (USD) إلى صندوق آخر
            </div>
            <div class="office-safe-row">
                <input type="number" id="transfer-amount" class="trading-input"
                       placeholder="المبلغ..." min="0.01" step="any">
                <select id="transfer-to" class="trading-input" style="flex:1.2;">
                    <option value="office_main">الصندوق الرئيسي</option>
                    <option value="trading">صندوق التداول</option>
                </select>
                <button class="osafe-btn osafe-btn-tra"
                        onclick="officeSafeTransfer(${myOfficeId})">
                    <i class="fa-solid fa-paper-plane"></i> تحويل
                </button>
            </div>
            <div class="office-safe-row" style="margin-top:6px;">
                <input type="text" id="transfer-notes" class="trading-input"
                       placeholder="ملاحظة (اختياري)..." style="font-size:12px;">
            </div>
        </div>
    </div>`
      : "";
    const profitCard = `
<div class="safe-card" style="border-color: #8b5cf6;">
    <div class="safe-card-header">
        <div class="safe-card-icon" style="background: #ede9fe; color: #7c3aed;"><i class="fa-solid fa-sack-dollar"></i></div>
        <div>
            <div class="safe-card-title">صندوق الأرباح (Profit Safe)</div>
            <div class="safe-card-subtitle">USD / SYP</div>
        </div>
    </div>

    <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
        <div>
            <div style="font-size: 10px; color: var(--gray);">أرباح التداول (ل.س)</div>
            <div style="font-size: 16px; font-weight: 800; color: #15803d;" id="profit-trade-display">
                ${parseFloat(profitSafe.profit_trade || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })} ل.س
            </div>
        </div>
        <div style="text-align:left;">
            <div style="font-size: 10px; color: var(--gray);">أرباح رئيسية (USD)</div>
            <div style="font-size: 16px; font-weight: 800; color: #1d4ed8;" id="profit-main-display">
                $${parseFloat(profitSafe.profit_main || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
        </div>
    </div>

    <!-- ── إيداع / سحب يدوي ──────────────────────────────── -->
    <div class="office-safe-panel" style="margin-bottom:10px;">
        <div class="office-safe-panel-title">
            <i class="fa-solid fa-pen-to-square"></i> إيداع / سحب يدوي في صندوق الأرباح
        </div>
        <div class="office-safe-row" style="margin-bottom:7px;">
            <input type="number" id="profit-adjust-amount" class="trading-input" placeholder="المبلغ..." min="0.01" step="any" style="flex:2;">
            <select id="profit-adjust-currency" class="trading-input" style="flex:1;">
                <option value="usd">دولار (USD)</option>
                <option value="sy">ليرة (SYP)</option>
            </select>
        </div>
        <div class="office-safe-row" style="margin-bottom:7px;">
            <input type="text" id="profit-adjust-notes" class="trading-input"
                   placeholder="ملاحظة (اختياري)..." style="font-size:12px;">
        </div>
        <div class="office-safe-row">
            <button class="osafe-btn osafe-btn-dep" onclick="profitAdjust('deposit', ${myOfficeId})">
                <i class="fa-solid fa-circle-arrow-down"></i> إيداع
            </button>
            <button class="osafe-btn osafe-btn-wit" onclick="profitAdjust('withdraw', ${myOfficeId})">
                <i class="fa-solid fa-circle-arrow-up"></i> سحب
            </button>
        </div>
    </div>

    <!-- ── تحويل الأرباح لخزنة المكتب ───────────────────── -->
    <div class="office-safe-panel">
        <div class="office-safe-panel-title">
            <i class="fa-solid fa-arrow-right-to-bracket"></i> تحويل الأرباح لخزنة المكتب
        </div>
        <div class="office-safe-row">
            <input type="number" id="profit-transfer-amount" class="trading-input" placeholder="المبلغ..." min="0.01" step="any">
            <select id="profit-source" class="trading-input" style="flex:1;">
                <option value="trade">أرباح التداول (ل.س)</option>
                <option value="main">أرباح رئيسية (USD)</option>
            </select>
            <button class="osafe-btn osafe-btn-tra" onclick="transferProfit(${myOfficeId})">
                <i class="fa-solid fa-paper-plane"></i> نقل
            </button>
        </div>
        <div class="office-safe-row" style="margin-top:6px;">
            <input type="text" id="profit-transfer-notes" class="trading-input"
                   placeholder="ملاحظة (اختياري)..." style="font-size:12px;">
        </div>
    </div>
</div>`;
    const eSafe = eSafeJson?.data || { syp_sham_cash: 0, usd_sham_cash: 0, usdt: 0 };

    // ─── بطاقة شام كاش + USDT ──────────────────────────────────
    const electronicSafeCard = `
    <div class="safe-card safe-card-electronic" id="electronic-safe-card">
        <div class="safe-card-header">
            <div class="safe-card-icon safe-card-icon-electronic">
                <i class="fa-solid fa-mobile-screen-button"></i>
            </div>
            <div>
                <div class="safe-card-title">خزنة إلكترونية</div>
                <div class="safe-card-subtitle">شام كاش + USDT</div>
            </div>
            <button onclick="refreshElectronicSafe()" title="تحديث" class="esafe-refresh-btn">
                <i class="fa-solid fa-rotate" id="esafe-refresh-icon"></i>
            </button>
        </div>

        <!-- ── أرصدة الثلاثة ── -->
        <div class="esafe-balances-grid">
            <div class="esafe-bal-item esafe-bal-syp">
                <div class="esafe-bal-label"><i class="fa-solid fa-coins"></i> ليرة شام كاش</div>
                <div class="esafe-bal-value" id="esafe-syp-display">
                    ${parseFloat(eSafe.syp_sham_cash || 0).toLocaleString("en-US",{maximumFractionDigits:0})} <span class="esafe-unit">ل.س</span>
                </div>
            </div>
            <div class="esafe-bal-item esafe-bal-usd">
                <div class="esafe-bal-label"><i class="fa-solid fa-dollar-sign"></i> دولار شام كاش</div>
                <div class="esafe-bal-value" id="esafe-usd-display">
                    ${parseFloat(eSafe.usd_sham_cash || 0).toLocaleString("en-US",{minimumFractionDigits:2})} <span class="esafe-unit">$</span>
                </div>
            </div>
            <div class="esafe-bal-item esafe-bal-usdt">
                <div class="esafe-bal-label"><i class="fa-brands fa-bitcoin"></i> USDT</div>
                <div class="esafe-bal-value" id="esafe-usdt-display">
                    ${parseFloat(eSafe.usdt || 0).toLocaleString("en-US",{minimumFractionDigits:2})} <span class="esafe-unit">USDT</span>
                </div>
            </div>
        </div>

        <!-- ── تبويبات العملة ── -->
        <div class="esafe-tabs">
            <button class="esafe-tab esafe-tab-active" id="etab-syp" onclick="eSwitchTab('syp', this)">
                <i class="fa-solid fa-coins"></i> ليرة ل.س
            </button>
            <button class="esafe-tab" id="etab-usd" onclick="eSwitchTab('usd', this)">
                <i class="fa-solid fa-dollar-sign"></i> دولار $
            </button>
            <button class="esafe-tab" id="etab-usdt" onclick="eSwitchTab('usdt', this)">
                <i class="fa-brands fa-bitcoin"></i> USDT
            </button>
        </div>

        <!-- ── بانل ليرة شام كاش ── -->
        <div class="esafe-panel" id="epanel-syp">
            <div class="office-safe-panel-title" style="color:#ea580c;">
                <i class="fa-solid fa-coins"></i> تعديل يدوي — ليرة شام كاش (SYP)
            </div>
            <div class="office-safe-row">
                <input type="number" id="esafe-syp-amount" class="trading-input"
                       placeholder="المبلغ بالليرة..." min="1" step="any">
                <button class="osafe-btn osafe-btn-dep" onclick="eSafeAdjust('deposit','syp_sham_cash','esafe-syp-amount','esafe-syp-notes')">
                    <i class="fa-solid fa-plus"></i> إيداع
                </button>
                <button class="osafe-btn osafe-btn-wit" onclick="eSafeAdjust('withdraw','syp_sham_cash','esafe-syp-amount','esafe-syp-notes')">
                    <i class="fa-solid fa-minus"></i> سحب
                </button>
            </div>
            <div class="office-safe-row" style="margin-top:6px;">
                <input type="text" id="esafe-syp-notes" class="trading-input"
                       placeholder="ملاحظة (اختياري)..." style="font-size:12px;">
            </div>
        </div>

        <!-- ── بانل دولار شام كاش ── -->
        <div class="esafe-panel" id="epanel-usd" style="display:none;">
            <div class="office-safe-panel-title" style="color:#1d4ed8;">
                <i class="fa-solid fa-dollar-sign"></i> تعديل يدوي — دولار شام كاش (USD)
            </div>
            <div class="office-safe-row">
                <input type="number" id="esafe-usd-amount" class="trading-input"
                       placeholder="المبلغ بالدولار..." min="0.01" step="any">
                <button class="osafe-btn osafe-btn-dep" onclick="eSafeAdjust('deposit','usd_sham_cash','esafe-usd-amount','esafe-usd-notes')">
                    <i class="fa-solid fa-plus"></i> إيداع
                </button>
                <button class="osafe-btn osafe-btn-wit" onclick="eSafeAdjust('withdraw','usd_sham_cash','esafe-usd-amount','esafe-usd-notes')">
                    <i class="fa-solid fa-minus"></i> سحب
                </button>
            </div>
            <div class="office-safe-row" style="margin-top:6px;">
                <input type="text" id="esafe-usd-notes" class="trading-input"
                       placeholder="ملاحظة (اختياري)..." style="font-size:12px;">
            </div>
        </div>

        <!-- ── بانل USDT ── -->
        <div class="esafe-panel" id="epanel-usdt" style="display:none;">
            <div class="office-safe-panel-title" style="color:#059669;">
                <i class="fa-brands fa-bitcoin"></i> تعديل يدوي — USDT
            </div>
            <div class="office-safe-row">
                <input type="number" id="esafe-usdt-amount" class="trading-input"
                       placeholder="الكمية بـ USDT..." min="0.000001" step="any">
                <button class="osafe-btn osafe-btn-dep" onclick="eSafeAdjust('deposit','usdt','esafe-usdt-amount','esafe-usdt-notes')">
                    <i class="fa-solid fa-plus"></i> إيداع
                </button>
                <button class="osafe-btn osafe-btn-wit" onclick="eSafeAdjust('withdraw','usdt','esafe-usdt-amount','esafe-usdt-notes')">
                    <i class="fa-solid fa-minus"></i> سحب
                </button>
            </div>
            <div class="office-safe-row" style="margin-top:6px;">
                <input type="text" id="esafe-usdt-notes" class="trading-input"
                       placeholder="ملاحظة (اختياري)..." style="font-size:12px;">
            </div>
        </div>
    </div>`;
    const mainSafeCard = mainSafe
      ? `
    <div class="safe-card safe-card-main" id="safe-card-main">
        <div class="safe-card-header">
            <div class="safe-card-icon"><i class="fa-solid fa-vault"></i></div>
            <div>
                <div class="safe-card-title">الصندوق الرئيسي</div>
                <div class="safe-card-subtitle">USD</div>
            </div>
        </div>
        <div class="safe-card-balance" id="main-safe-balance">${parseFloat(mainSafe.balance).toLocaleString()}</div>
        <div class="safe-card-currency">USD</div>

        <div class="office-safe-panel">
            <div class="office-safe-panel-title">
                <i class="fa-solid fa-arrow-right-to-bracket"></i> تحويل إلى خزنة المكتب
            </div>
            <div class="office-safe-row">
                <input type="number" id="main-to-office-amount" class="trading-input"
                       placeholder="المبلغ بالدولار..." min="0.01" step="any">
                <button class="osafe-btn osafe-btn-tra"
                        onclick="transferToOfficeSafe('office_main', ${myOfficeId})">
                    <i class="fa-solid fa-paper-plane"></i> تحويل
                </button>
            </div>
            <div class="office-safe-row" style="margin-top:6px;">
                <input type="text" id="main-to-office-notes" class="trading-input"
                       placeholder="ملاحظة (اختياري)..." style="font-size:12px;">
            </div>
        </div>
    </div>`
      : "";

    // ─── 3. بطاقات صناديق التداول (TradingSafe) ──────────────
    const tradingCards = tradingSafes
      .map(
        (safe) => `
    <div class="safe-card safe-card-trading" id="trading-safe-card">
        <div class="safe-card-header">
            <div class="safe-card-icon"><i class="fa-solid fa-chart-line"></i></div>
            <div>
                <div class="safe-card-title">صندوق المبيعات / التداول</div>
                <div class="safe-card-subtitle">${safe.currency || "USD"}</div>
            </div>
        </div>

        <!-- رصيد الدولار -->
        <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:4px;">
            <div class="safe-card-balance" id="trading-safe-balance-${safe.currency_id}"
                 style="font-size:28px;">${parseFloat(safe.balance).toLocaleString()}</div>
            <div class="safe-card-currency">${safe.currency || "USD"}</div>
        </div>

        <!-- رصيد الليرة السورية في صندوق التداول 
        <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:10px;
                    padding:8px 12px;background:rgba(234,88,12,.07);border-radius:8px;">
            <i class="fa-solid fa-coins" style="color:#ea580c;font-size:13px;"></i>
            <span style="font-size:13px;color:var(--gray);">رصيد الليرة (SYP):</span>
            <span id="trading-safe-balance-sy-${safe.currency_id}" style="font-size:20px;font-weight:800;color:#ea580c;">
            ${parseFloat(safe.balance_sy || 0).toLocaleString()}
        </span>
            <span style="font-size:12px;color:#ea580c;font-weight:600;">SYP</span>
        </div>
-->
       ${
         safe.cost !== null && safe.cost !== undefined
           ? `
    <div style="font-size:12px;color:var(--gray);margin-top:4px;font-weight:600;
                padding:8px 12px;background:var(--light);border-radius:8px; display: flex; justify-content: space-between; align-items: center;">
        <div>
            متوسط التكلفة:
            <span id="cost-display-${safe.office_id}" style="color:var(--primary);font-weight:800;">
                ${parseFloat(safe.cost).toFixed(2)}
            </span>
        </div>
        <button onclick="editCostManual(${safe.office_id}, ${safe.cost})" 
                style="background:none; border:none; color:var(--primary); cursor:pointer; font-size:14px;" title="تعديل يدوي">
            <i class="fa-solid fa-pen-to-square"></i>
        </button>
    </div>`
           : ""
       }
        ${buildTradingUI(safe.currency_id, safe.office_id)}

        <div class="office-safe-panel" style="margin-top:12px;">
            <div class="office-safe-panel-title">
                <i class="fa-solid fa-arrow-right-to-bracket"></i> تحويل (USD) إلى خزنة المكتب
            </div>
            <div class="office-safe-row">
                <input type="number" id="trading-to-office-amount" class="trading-input"
                       placeholder="المبلغ..." min="0.01" step="any">
                <button class="osafe-btn osafe-btn-tra"
                        onclick="transferToOfficeSafe('trading', ${myOfficeId})">
                    <i class="fa-solid fa-paper-plane"></i> تحويل
                </button>
            </div>
            <div class="office-safe-row" style="margin-top:6px;">
                <input type="text" id="trading-to-office-notes" class="trading-input"
                       placeholder="ملاحظة (اختياري)..." style="font-size:12px;">
            </div>
        </div>
    </div>`,
      )
      .join("");

    container.innerHTML =
      officeSafeCard + mainSafeCard + tradingCards + profitCard + electronicSafeCard;
  } catch (e) {
    console.error("Error loading safes:", e);
  }
}

async function editCostManual(officeId, currentCost) {
  const newCost = prompt(
    "أدخل قيمة التكلفة الجديدة (أدخل 0 للتصفير):",
    currentCost,
  );

  // إذا ضغط المستخدم إلغاء أو لم يدخل رقماً
  if (newCost === null || isNaN(newCost)) return;

  try {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`${API_URL}/trading-safe/update-cost`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        office_id: officeId,
        cost: parseFloat(newCost),
      }),
    });

    const data = await res.json();
    if (res.ok) {
      showToast("تم تحديث التكلفة بنجاح");
      // تحديث الواجهة فوراً
      const costEl = document.getElementById(`cost-display-${officeId}`);
      if (costEl) costEl.textContent = parseFloat(newCost).toFixed(2);
    } else {
      showToast(data.message || "خطأ في التحديث", "danger");
    }
  } catch (error) {
    console.error(error);
    showToast("فشل الاتصال بالسيرفر", "danger");
  }
}
async function transferProfit(officeId) {
  const amountInput = document.getElementById("profit-transfer-amount");
  const sourceSelect = document.getElementById("profit-source");
  const notesInput = document.getElementById("profit-transfer-notes");
  const amount = parseFloat(amountInput.value);

  if (!amount || amount <= 0) {
    alert("يرجى إدخال مبلغ صحيح");
    return;
  }
  const notes = notesInput ? notesInput.value.trim() : "";

  const btn = event.currentTarget;
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

  try {
    const res = await fetch(`${API_URL}/safes/transfer-profit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        office_id: officeId,
        source: sourceSelect.value,
        amount,
        notes,
      }),
    });
    const data = await res.json();

    if (res.ok) {
      // تحديث القيم المعروضة مباشرة دون إعادة تحميل كاملة
      const tradeEl = document.getElementById("profit-trade-display");
      const mainEl = document.getElementById("profit-main-display");
      if (tradeEl)
        tradeEl.textContent = `${parseFloat(data.profit_trade || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })} ل.س`;
      if (mainEl)
        mainEl.textContent = `$${parseFloat(data.profit_main || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
      amountInput.value = "";
      if (notesInput) notesInput.value = "";
      showAdminToast("✅ تم نقل الأرباح لخزنة المكتب بنجاح");
      setTimeout(() => showSafesSection(), 600);
    } else {
      alert(data.message || "حدث خطأ أثناء نقل الأرباح");
    }
  } catch (e) {
    alert("تعذر الاتصال بالخادم");
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

/* ── إيداع / سحب يدوي على صندوق الأرباح ─────────────────────────── */
async function profitAdjust(type, officeId) {
  const amountInput = document.getElementById("profit-adjust-amount");
  const currencySelect = document.getElementById("profit-adjust-currency");
  const notesInput = document.getElementById("profit-adjust-notes");
  const amount = parseFloat(amountInput.value);
  const currency = currencySelect.value; // 'usd' | 'sy'

  if (!amount || amount <= 0) {
    alert("يرجى إدخال مبلغ صحيح");
    return;
  }
  const notes = notesInput ? notesInput.value.trim() : "";

  const isDeposit = type === "deposit";
  const panel = amountInput.closest(".office-safe-panel");
  const btn = panel.querySelector(
    isDeposit ? ".osafe-btn-dep" : ".osafe-btn-wit",
  );
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

  try {
    const res = await fetch(`${API_URL}/safes/profit/adjust`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ office_id: officeId, amount, type, currency, notes }),
    });
    const data = await res.json();

    if (res.ok) {
      // تحديث الأرقام المعروضة مباشرة
      const tradeEl = document.getElementById("profit-trade-display");
      const mainEl = document.getElementById("profit-main-display");
      if (tradeEl)
        tradeEl.textContent = `${parseFloat(data.profit_trade || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })} ل.س`;
      if (mainEl)
        mainEl.textContent = `$${parseFloat(data.profit_main || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
      amountInput.value = "";
      if (notesInput) notesInput.value = "";
      const currencyLabel = currency === "usd" ? "USD" : "ل.س";
      showAdminToast(
        `${isDeposit ? "✅ تم الإيداع" : "✅ تم السحب"} (${currencyLabel}) في صندوق الأرباح`,
      );
    } else {
      alert(data.message || "حدث خطأ في العملية");
    }
  } catch (e) {
    alert("تعذر الاتصال بالخادم");
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

/* ── إيداع / سحب يدوي على خزنة المكتب ──────────────────────────────── */
async function officeSafeAdjust(type, officeId, currency = "usd") {
  const inputId = currency === "sy" ? "adjust-amount-sy" : "adjust-amount";
  const notesId = currency === "sy" ? "adjust-notes-sy" : "adjust-notes";
  const amountInput = document.getElementById(inputId);
  const notesInput  = document.getElementById(notesId);
  const amount = parseFloat(amountInput.value);
  if (!amount || amount <= 0) {
    alert("يرجى إدخال مبلغ صحيح");
    return;
  }

  const notes = notesInput ? notesInput.value.trim() : "";
  const isDep = type === "deposit";
  const panel = amountInput.closest(".office-safe-panel");
  const btn = panel.querySelector(isDep ? ".osafe-btn-dep" : ".osafe-btn-wit");
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

  try {
    const res = await fetch(`${API_URL}/offices/${officeId}/safe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, type, currency, notes }),
    });
    const data = await res.json();
    if (res.ok) {
      if (currency === "sy") {
        const elOfficeSy = document.getElementById("office-safe-balance-sy");
        if (elOfficeSy)
          elOfficeSy.textContent = parseFloat(
            data.new_balance_sy,
          ).toLocaleString();
        const elTradingSy = document.querySelector(
          "[id^='trading-safe-balance-sy-']",
        );
        if (elTradingSy && data.trading_balance_sy !== undefined)
          elTradingSy.textContent = parseFloat(
            data.trading_balance_sy,
          ).toLocaleString();
        showAdminToast(
          isDep
            ? "✅ تم إيداع الليرات — انعكس على التداول"
            : "✅ تم سحب الليرات",
        );
      } else {
        const elUsd = document.getElementById("office-safe-balance");
        if (elUsd)
          elUsd.textContent = parseFloat(data.new_balance).toLocaleString();
        showAdminToast(
          isDep ? "✅ تم الإيداع بالدولار" : "✅ تم السحب بالدولار",
        );
      }
      amountInput.value = "";
      if (notesInput) notesInput.value = "";
    } else {
      alert(data.message || "حدث خطأ");
    }
  } catch (e) {
    alert("تعذر الاتصال بالخادم");
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

/* ── تحويل من خزنة المكتب إلى صندوق آخر ────────────────────────────── */
async function officeSafeTransfer(officeId) {
  const amountInput = document.getElementById("transfer-amount");
  const toType = document.getElementById("transfer-to").value;
  const notesInput = document.getElementById("transfer-notes");
  const amount = parseFloat(amountInput.value);
  if (!amount || amount <= 0) {
    alert("يرجى إدخال مبلغ صحيح");
    return;
  }
  const notes = notesInput ? notesInput.value.trim() : "";

  const btn = document.querySelector(".osafe-btn-tra");
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

  try {
    const res = await fetch(`${API_URL}/safes/transfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ office_id: officeId, to_type: toType, amount, notes }),
    });
    const data = await res.json();
    if (res.ok) {
      amountInput.value = "";
      if (notesInput) notesInput.value = "";
      showAdminToast("✅ تم التحويل بنجاح");
      setTimeout(() => showSafesSection(), 500);
    } else {
      alert(data.message || "حدث خطأ أثناء التحويل");
    }
  } catch (e) {
    alert("تعذر الاتصال بالخادم");
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

/* ── تحويل من صندوق رئيسي أو تداول → خزنة المكتب ──────────────────── */
async function transferToOfficeSafe(fromType, officeId, currencyId = null) {
  const inputId =
    fromType === "trading"
      ? `trading-to-office-amount`
      : "main-to-office-amount";
  const notesId =
    fromType === "trading"
      ? "trading-to-office-notes"
      : "main-to-office-notes";
  const amountInput = document.getElementById(inputId);
  const notesInput  = document.getElementById(notesId);
  const amount = parseFloat(amountInput.value);
  if (!amount || amount <= 0) {
    alert("يرجى إدخال مبلغ صحيح");
    return;
  }
  const notes = notesInput ? notesInput.value.trim() : "";

  // نجد الزر الصح داخل نفس الـ panel
  const btn = amountInput
    .closest(".office-safe-panel")
    .querySelector(".osafe-btn-tra");
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

  try {
    const res = await fetch(`${API_URL}/safes/transfer-to-office`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        office_id: officeId,
        from_type: fromType,
        amount,
        notes,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      amountInput.value = "";
      if (notesInput) notesInput.value = "";
      showAdminToast("✅ تم التحويل إلى خزنة المكتب بنجاح");
      setTimeout(() => showSafesSection(), 500);
    } else {
      alert(data.message || "حدث خطأ أثناء التحويل");
    }
  } catch (e) {
    alert("تعذر الاتصال بالخادم");
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
} /* =========================================================
   قسم الحوالات البنكية (Super Admin & Admin)
========================================================= */
let _allBankTransfers = [];
let currentBtApproveId = null;

function showBankTransfersSection() {
  // استخدم دالة الإخفاء المعتمدة لديك (showSection في super أو hideAllCards في admin)
  if (typeof hideAllCards === "function") hideAllCards();
  else if (typeof showSection === "function") {
    document
      .querySelectorAll(".card")
      .forEach((c) => c.classList.add("hidden"));
    document.getElementById("dashboard-section").style.display = "none";
  }

  document.getElementById("bank-transfers-section").classList.remove("hidden");
  document.getElementById("bank-transfers-section").style.display = "block";

  loadBankTransfersForAdmin();
}

async function loadBankTransfers() {
  const tbody = document.getElementById("bt-tbody");
  if (!tbody) return;

  document.getElementById("bt-refresh-icon").classList.add("fa-spin");
  tbody.innerHTML = `<tr><td colspan="11" class="pt-loading-cell"><i class="fa-solid fa-spinner fa-spin"></i> جاري التحميل...</td></tr>`;

  try {
    const res = await fetch(`${API_URL}/bank-transfer`, {
      headers: getHeaders
        ? getHeaders()
        : { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const json = await res.json();
    _allBankTransfers = json.data || [];
    updateBtStats();
    filterBankTransfers();
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;color:red;">فشل التحميل</td></tr>`;
  } finally {
    document.getElementById("bt-refresh-icon").classList.remove("fa-spin");
  }
}

function updateBtStats() {
  document.getElementById("bt-stat-pending").textContent =
    _allBankTransfers.filter((t) => t.status === "pending").length;
  document.getElementById("bt-stat-approved").textContent =
    _allBankTransfers.filter((t) => t.status === "admin_approved").length;
  document.getElementById("bt-stat-completed").textContent =
    _allBankTransfers.filter((t) => t.status === "completed").length;
}

function filterBankTransfers() {
  const q = document.getElementById("bt-search").value.toLowerCase().trim();
  const status = document.getElementById("bt-status-filter").value;
  const tbody = document.getElementById("bt-tbody");
  const emptyEl = document.getElementById("bt-empty");

  const filtered = _allBankTransfers.filter((t) => {
    const matchQ =
      !q ||
      (t.full_name || "").toLowerCase().includes(q) ||
      (t.recipient_name || "").toLowerCase().includes(q) ||
      (t.bank_name || "").toLowerCase().includes(q);
    const matchStatus = !status || t.status === status;
    return matchQ && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = "";
    emptyEl.style.display = "block";
    return;
  }

  emptyEl.style.display = "none";

  const statusMap = {
    pending: { text: "بانتظار الإدارة", color: "#b45309", bg: "#fef3c7" },
    admin_approved: {
      text: "بانتظار الكاشير",
      color: "#1d4ed8",
      bg: "#dbeafe",
    },
    completed: { text: "مكتملة", color: "#15803d", bg: "#dcfce7" },
    rejected: { text: "مرفوضة", color: "#b91c1c", bg: "#fee2e2" },
  };

  tbody.innerHTML = filtered
    .map((t, index) => {
      const s = statusMap[t.status] || {
        text: t.status,
        color: "gray",
        bg: "#eee",
      };
      const date = new Date(t.created_at).toLocaleDateString("ar-SY");
      const dest =
        [t.destination_country, t.destination_city]
          .filter(Boolean)
          .join(" - ") || "—";

      let actions = "";
      if (t.status === "pending") {
        actions = `
                <button onclick="openBtApproveModal(${t.id}, '${t.recipient_name}')" style="background:#dcfce7;color:#15803d;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;font-weight:bold;margin-bottom:4px;">
                    <i class="fa-solid fa-check"></i> موافقة
                </button>
                <button onclick="rejectBankTransfer(${t.id})" style="background:#fee2e2;color:#b91c1c;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;font-weight:bold;">
                    <i class="fa-solid fa-xmark"></i> رفض
                </button>
            `;
      } else {
        actions = `<span style="color:var(--gray);font-size:12px;">مُعالج</span>`;
      }

      return `
        <tr>
            <td>${index + 1}</td>
            <td><span style="font-weight:bold;">${t.agent?.name || "—"}</span></td>
            <td><span style="font-weight:bold;color:var(--primary);">${t.recipient_name || "—"}</span></td>
            <td>${t.full_name}</td>
            <td>${t.bank_name}</td>
            <td style="direction:ltr;text-align:right;font-family:monospace;">${t.account_number}</td>
            <td style="direction:ltr;text-align:right;">${t.phone}</td>
           <td style="font-size:12px;color:var(--gray);">${dest}</td>
            <td style="font-weight:900;color:var(--success);">$${parseFloat(t.amount).toLocaleString()}</td>
            <td><span style="background:${s.bg};color:${s.color};padding:4px 10px;border-radius:20px;font-size:11px;font-weight:bold;white-space:nowrap;">${s.text}</span></td>
            <td style="font-size:11px;color:var(--gray);">${date}</td>
            <td style="display:flex;flex-direction:column;gap:4px;">${actions}</td>
        </tr>`;
    })
    .join("");
}

function openBtApproveModal(id, recipientName) {
  currentBtApproveId = id;
  loadCashiers();
  document.getElementById("bt-approve-desc").innerHTML =
    `هل أنت متأكد من الموافقة على الحوالة للمستلم <strong>${recipientName}</strong>؟<br>سيتم إرسالها للكاشير لتسليمها.`;
  document.getElementById("bt-approve-modal").style.display = "flex";
}

function closeBtApproveModal() {
  currentBtApproveId = null;
  document.getElementById("bt-approve-modal").style.display = "none";
}
async function confirmBtApprove() {
  const cashierId = document.getElementById("bt-cashier-select").value;

  if (!cashierId) {
    alert("⚠️ يجب اختيار الكاشير");
    return;
  }

  try {
    // ✅ تم تصحيح اسم المتغير هنا إلى currentBtApproveId
    const res = await fetch(
      `${API_URL}/bank-transfer/${currentBtApproveId}/approve`,
      {
        method: "PATCH", // تأكد أن نوع الطلب يتطابق مع الراوت في لارافيل (POST أو PATCH)
        headers: getHeaders(),
        body: JSON.stringify({
          cashier_id: cashierId,
        }),
      },
    );

    const data = await res.json();

    if (res.ok) {
      alert("✅ تم إرسال الحوالة للكاشير بنجاح");
      closeBtApproveModal();
      loadBankTransfers();
    } else {
      alert(data.message || "خطأ");
    }
  } catch (e) {
    console.error(e);
    alert("خطأ في الاتصال");
  }
}
async function rejectBankTransfer(id) {
  if (!confirm("هل أنت متأكد من رفض هذه الحوالة البنكية؟")) return;

  try {
    const res = await fetch(`${API_URL}/bank-transfer/${id}/reject`, {
      method: "PATCH",
      headers: getHeaders
        ? getHeaders()
        : { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (res.ok) {
      loadBankTransfersForAdmin();
      if (typeof showToast !== "undefined")
        showToast("تم رفض الحوالة", "error");
    } else {
      alert("حدث خطأ");
    }
  } catch (e) {
    alert("فشل الاتصال");
  }
} // 1. أضف هذه الدالة في أعلى ملف admin.js إذا لم تكن موجودة
function getHeaders() {
  return {
    Authorization: "Bearer " + localStorage.getItem("auth_token"),
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

// 2. تحديث دالة جلب الحوالات مع تنسيق "جميل"
async function loadBankTransfersForAdmin() {
  const list = document.getElementById("bank-transfers-list");
  if (!list) return;

  list.innerHTML = `<tr><td colspan="7" class="text-center"><i class="fa-solid fa-spinner fa-spin"></i> جاري التحميل...</td></tr>`;

  try {
    const res = await fetch(`${API_URL}/bank-transfer`, {
      headers: getHeaders(),
    });
    const data = await res.json();

    if (data.status === "success" && data.data.length > 0) {
      list.innerHTML = data.data
        .map((item) => {
          // تنسيق الحالة بلون مناسب
          let statusClass = "";
          let statusText = "";
          switch (item.status) {
            case "pending":
              statusClass = "warning";
              statusText = "قيد الانتظار";
              break;
            case "approved":
              statusClass = "success";
              statusText = "مقبولة";
              break;
            case "rejected":
              statusClass = "danger";
              statusText = "مرفوضة";
              break;
            case "completed":
              statusClass = "primary";
              statusText = "مكتملة";
              break;
            default:
              statusClass = "gray";
              statusText = item.status;
          }

          return `
                <tr class="align-middle">
                    <td><span class="text-muted">#${item.id}</span></td>
                    <td>
                        <div class="d-flex flex-column">
                            <span class="fw-bold">${item.agent ? item.agent.name : "—"}</span>
                            <small class="text-muted" style="font-size:10px">${item.agent ? item.agent.phone : ""}</small>
                        </div>
                    </td>
                    <td>
                        <div class="d-flex align-items-center">
                            <i class="fa-solid fa-building-columns me-2 text-primary"></i>
                            <div>
                                <div class="fw-bold">${item.bank_name}</div>
                                <div class="text-muted small">${item.account_number}</div>
                            </div>
                        </div>
                    </td>
                    <td><span class="fw-bold text-dark">${parseFloat(item.amount).toLocaleString()} $</span></td>
                    <td><span class="badge-status ${statusClass}">${statusText}</span></td>
                    <td><small class="text-muted">${new Date(item.created_at).toLocaleString("ar-EG")}</small></td>
                    <td>
                        ${
                          item.status === "pending"
                            ? `
                            <div class="d-flex gap-1">
                                <button onclick="approveBankTransfer(${item.id})" class="btn-action approve" title="موافقة"><i class="fa-solid fa-check"></i></button>
                                <button onclick="rejectBankTransfer(${item.id})" class="btn-action reject" title="رفض"><i class="fa-solid fa-xmark"></i></button>
                            </div>
                        `
                            : `<span class="text-muted small">لا توجد إجراءات</span>`
                        }
                    </td>
                </tr>
                `;
        })
        .join("");
    } else {
      list.innerHTML = `<tr><td colspan="7" class="text-center p-5 text-muted">لا توجد حوالات بنكية حالياً</td></tr>`;
    }
  } catch (err) {
    console.error("خطأ في جلب حوالات البنك:", err);
    list.innerHTML = `<tr><td colspan="7" class="text-center text-danger">فشل الاتصال بالسيرفر</td></tr>`;
  }
}
async function loadCashiers() {
  const select = document.getElementById("bt-cashier-select");
  if (!select) return;

  try {
    // 1. جلب بياناتي الشخصية لمعرفة رقم مكتبي (لضمان الدقة)
    const meRes = await fetch(`${API_URL}/me`, { headers: getHeaders() });
    const meData = await meRes.json();
    const adminOfficeId = meData.user.office_id;

    // 2. جلب قائمة المستخدمين
    const res = await fetch(`${API_URL}/users`, { headers: getHeaders() });
    const json = await res.json();

    // 3. الفلترة: يجب أن يكون دور المستخدم 'cashier' وفي نفس مكتب الأدمن
    const cashiers = (json.data || []).filter(
      (u) => u.role === "cashier" && u.office_id === adminOfficeId,
    );

    select.innerHTML = `<option value="">اختر الكاشير للتسليم</option>`;

    if (cashiers.length === 0) {
      select.innerHTML = `<option value="">لا يوجد كاشيرية في مكتبك</option>`;
    }

    cashiers.forEach((c) => {
      const option = document.createElement("option");
      option.value = c.id;
      option.textContent = c.name;
      select.appendChild(option);
    });
  } catch (e) {
    console.error("Error loading cashiers:", e);
    select.innerHTML = `<option>خطأ في تحميل البيانات</option>`;
  }
}
/* =============================================
   واجهة التداول المحسّنة – زر الاختيار السريع
   ============================================= */
function buildTradingUI(currencyId, officeId) {
  const amountChips = [50, 100, 200, 500, 1000];
  const priceChips = [11500, 11700, 11800, 12000, 12100, 12200];

  const amountChipsHtml = amountChips
    .map(
      (v) =>
        `<button type="button" class="trade-chip" onclick="setTradeVal('buy_amount_${currencyId}','sell_amount_${currencyId}',${v})">${v}</button>`,
    )
    .join("");

  const buyPriceChipsHtml = priceChips
    .map(
      (v) =>
        `<button type="button" class="trade-chip trade-chip-buy" onclick="setTradeVal('buy_price_${currencyId}',null,${v})">${v.toLocaleString()}</button>`,
    )
    .join("");

  const sellPriceChipsHtml = priceChips
    .map(
      (v) =>
        `<button type="button" class="trade-chip trade-chip-sell" onclick="setTradeVal('sell_price_${currencyId}',null,${v})">${v.toLocaleString()}</button>`,
    )
    .join("");

  return `
    <div class="trade-panel">
        <div class="trade-panel-title">
            <i class="fa-solid fa-sliders"></i> عمليات التداول
        </div>

        <!-- الكمية مشتركة -->
        <div class="trade-field-group">
            <label class="trade-field-label"><i class="fa-solid fa-hashtag"></i> الكمية</label>
            <div class="trade-chips-row">${amountChipsHtml}</div>
            <div class="trade-input-row">
                <input type="number" id="buy_amount_${currencyId}"  class="trading-input" placeholder="أدخل الكمية يدوياً..." min="0" step="any"
                       oninput="document.getElementById('sell_amount_${currencyId}').value=this.value">
                <input type="number" id="sell_amount_${currencyId}" class="trading-input" style="display:none;" placeholder="الكمية" min="0" step="any">
            </div>
        </div>

        <div class="trade-ops-grid">
            <!-- شراء -->
            <div class="trade-op trade-op-buy">
                <div class="trade-op-header">
                    <i class="fa-solid fa-arrow-down-to-line"></i> شراء
                </div>
                <div class="trade-chips-row">${buyPriceChipsHtml}</div>
                <div class="trade-input-row">
                    <input type="number" id="buy_price_${currencyId}" class="trading-input" placeholder="سعر الشراء يدوياً..." min="0" step="any">
                </div>
                <button class="trade-exec-btn trade-exec-buy"
                        onclick="executeTrade('buy', ${officeId}, ${currencyId})">
                    <i class="fa-solid fa-cart-shopping"></i> تنفيذ الشراء
                </button>
            </div>

            <!-- بيع -->
            <div class="trade-op trade-op-sell">
                <div class="trade-op-header">
                    <i class="fa-solid fa-arrow-up-from-line"></i> بيع
                </div>
                <div class="trade-chips-row">${sellPriceChipsHtml}</div>
                <div class="trade-input-row">
                    <input type="number" id="sell_price_${currencyId}" class="trading-input" placeholder="سعر البيع يدوياً..." min="0" step="any">
                </div>
                <button class="trade-exec-btn trade-exec-sell"
                        onclick="executeTrade('sell', ${officeId}, ${currencyId})">
                    <i class="fa-solid fa-hand-holding-dollar"></i> تنفيذ البيع
                </button>
            </div>
        </div>
    </div>`;
}

// helper: يضبط قيمة input أو inputين
function setTradeVal(id1, id2, val) {
  const el1 = document.getElementById(id1);
  if (el1) {
    el1.value = val;
    el1.dispatchEvent(new Event("input"));
  }
  if (id2) {
    const el2 = document.getElementById(id2);
    if (el2) el2.value = val;
  }
  // تأثير بصري على الزر المضغوط
  event.target.classList.add("trade-chip-active");
  setTimeout(() => event.target.classList.remove("trade-chip-active"), 600);
}

async function executeTrade(type, officeId, currencyId) {
  const amountInput = document.getElementById(`${type}_amount_${currencyId}`);
  const priceInput = document.getElementById(`${type}_price_${currencyId}`);

  const amount = parseFloat(amountInput.value);
  const price = parseFloat(priceInput.value);

  if (!amount || amount <= 0 || !price || price <= 0) {
    alert("يرجى إدخال كمية وسعر صحيحين");
    return;
  }

  // تجهيز البيانات للإرسال
  const payload = {
    office_id: officeId,
    currency_id: currencyId,
    amount: amount,
  };

  if (type === "buy") payload.buy_price = price;
  if (type === "sell") payload.sell_price = price;

  try {
    const res = await fetch(`${API_URL}/trading/${type}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      if (type === "sell") {
        const profitVal = parseFloat(data.profit).toFixed(2);
        const balSy =
          data.balance_sy !== undefined
            ? `\nرصيد SYP في التداول: ${parseFloat(data.balance_sy).toLocaleString()}`
            : "";
        alert(
          `تمت عملية البيع بنجاح!\nالربح المحقق (USD): ${profitVal}${balSy}\n✅ تم تسجيل الربح في صندوق الأرباح تلقائياً`,
        );
      } else {
        alert("تمت عملية الشراء بنجاح ودمج متوسط التكلفة!");
      }
      // إعادة تفريغ الحقول وتحديث عرض الصناديق
      amountInput.value = "";
      priceInput.value = "";
      showSafesSection();
    } else {
      alert(data.message || "حدث خطأ أثناء العملية");
    }
  } catch (error) {
    console.error(error);
    alert("حدث خطأ في الاتصال بالخادم");
  }
}
// تعديل الوظائف القديمة لتعمل مع النظام الجديد
function showPendingTransfers() {
  hideAllCards();
  document.getElementById("pending-transfers-card").style.display = "block";
  loadPendingTransfers();
}

function showAllTransfers() {
  hideAllCards();
  document.getElementById("all-transfers-card").style.display = "block";
  loadAllTransfers();
}

async function loadPendingTransfers() {
  try {
    const res = await fetch(`${API_URL}/transfers?status=waiting`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) {
      console.error("Server Error:", res.status);
      return;
    }

    const json = await res.json();
    const tbody = document.getElementById("transfers-list");
    tbody.innerHTML = "";

    if (!json.data || !json.data.length) {
      tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state"><i class="fa-solid fa-inbox"></i><p>لا توجد حوالات معلقة</p></div></td></tr>`;
      return;
    }

    json.data.forEach((transfer) => {
      const amountUsd = Number(transfer.amount_in_usd ?? 0);
      const sendAmount = Number(transfer.amount ?? 0);
      const sendCurrency =
        transfer.send_currency?.code ?? transfer.sendCurrency?.code ?? "—";
      const recvCurrency = transfer.currency?.code ?? "—";
      const recvPrice = Number(transfer.currency?.price ?? 1);
      const deliveryAmt = recvPrice > 0 ? amountUsd / recvPrice : 0;
      const fee = Number(transfer.fee ?? 0);
      const date = transfer.created_at
        ? new Date(transfer.created_at).toLocaleString("ar-SY")
        : "—";
      const tracking = transfer.tracking_code ?? `#${transfer.id}`;
      const isAgent = transfer.sender?.role === "agent";
      const senderRole = isAgent
        ? `<span style="display:inline-block;margin-top:3px;font-size:10px;padding:1px 7px;border-radius:20px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-weight:700;">مندوب</span>`
        : `<span style="display:inline-block;margin-top:3px;font-size:10px;padding:1px 7px;border-radius:20px;background:linear-gradient(135deg,#0ea5e9,#38bdf8);color:#fff;font-weight:700;">زبون</span>`;

      const destText = transfer.destination_office_id
        ? `<i class="fa-solid fa-building" style="color:var(--primary);font-size:11px;"></i> ${transfer.destination_office?.name ?? `مكتب #${transfer.destination_office_id}`}`
        : `<i class="fa-solid fa-globe" style="color:#7c3aed;font-size:11px;"></i> ${transfer.destination_city ?? "—"}`;

      const notes = transfer.notes
        ? `<span style="font-size:11px;color:var(--gray);max-width:130px;display:inline-block;word-break:break-word;">${transfer.notes}</span>`
        : `<span style="color:var(--gray);font-size:12px;">—</span>`;

      tbody.innerHTML += `
        <tr>
          <td>
            <span style="font-weight:800;color:var(--primary);">#${transfer.id}</span>
            <div style="font-size:10px;color:var(--gray);margin-top:2px;letter-spacing:.5px;">${tracking}</div>
          </td>
          <td style="text-align:center;">${senderRole}</td>
          <td>
            <div style="font-weight:700;">${transfer.sender?.name ?? "—"}</div>
            <div style="font-size:11px;color:var(--gray);direction:ltr;">${transfer.sender?.phone ?? ""}</div>
          </td>
          <td>
            <div style="font-weight:700;">${transfer.receiver_name ?? "—"}</div>
            <div style="font-size:11px;color:var(--gray);direction:ltr;">${transfer.receiver_phone ?? ""}</div>
          </td>
          <td>
            <div style="font-weight:800;color:var(--primary);">$${amountUsd.toFixed(2)}</div>
            <div style="font-size:11px;color:var(--gray);direction:ltr;">${sendAmount.toFixed(2)} ${sendCurrency}</div>
            <div style="font-size:11px;color:#7c3aed;">يستلم: ${deliveryAmt.toFixed(2)} ${recvCurrency}</div>
            ${fee > 0 ? `<div style="font-size:11px;color:var(--success);">رسوم: $${fee.toFixed(2)}</div>` : ""}
          </td>
          <td style="font-size:12px;">${destText}</td>
          <td>${notes}</td>
          <td style="font-size:11px;color:var(--gray);white-space:nowrap;">${date}</td>
          <td>
            <button class="btn-chat"
              onclick="openChat(${transfer.id}, '${transfer.tracking_code ?? transfer.id}', ${transfer.sender?.id ?? 0})"
              title="فتح الدردشة مع الزبون">
              <i class="fa-solid fa-comments"></i> دردشة
            </button>
          </td>
          <td>
            <button class="btn-approve" onclick="approveTransfer(${transfer.id})">
              <i class="fa-solid fa-check"></i> موافقة
            </button>
            <button class="btn-reject" onclick="rejectTransfer(${transfer.id})" style="margin-top:4px;">
              <i class="fa-solid fa-xmark"></i> رفض
            </button>
          </td>
        </tr>`;
    });
  } catch (error) {
    console.error("Error loading transfers:", error);
  }
}
async function approveTransfer(transferId) {
  try {
    const res = await fetch(
      `${API_URL}/transfers/${transferId}/update-status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ status: "ready", fee: 0 }),
      },
    );
    const data = await res.json();
    if (res.ok) {
      showAdminToast("✅ تمت الموافقة وتحويلها إلى جاهزة للتسليم");
      loadPendingTransfers();
    } else {
      alert(data.message || "حدث خطأ");
    }
  } catch (error) {
    console.error(error);
    alert("خطأ في الاتصال");
  }
}
/* ============================= */
/* أرباح التداول - الأدمن        */
/* ============================= */

function showProfitsSection() {
  hideAllCards();
  document.getElementById("profits-card").style.display = "block";

  // تعيين تاريخ اليوم كافتراضي إن لم يكن محدداً
  const dateInput = document.getElementById("report-date");
  if (!dateInput.value) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }
  loadTradingReport();
}

/* =============================================
   قسم إنشاء الحوالة الداخلية - Create Transfer
   ============================================= */

// بيانات مخزّنة مشتركة
let _ctCurrencies = [];
let _ctAllAgents = [];
const SYRIA_COUNTRY_ID = 1;

/* ─────────────────────────────────────────────
   helper مشترك: جلب الوكلاء مع country_id كامل
   نستخدم /users لأن /agents لا يُرجع country_id
───────────────────────────────────────────── */
async function _fetchAllAgents() {
  try {
    const res = await fetch(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const json = await res.json();
    const all = json.data ?? json ?? [];
    return all.filter((u) => u.role === "agent" && u.is_active !== false);
  } catch (e) {
    // fallback على /agents إذا فشل
    const res2 = await fetch(`${API_URL}/agents`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const json2 = await res2.json();
    return json2.data ?? [];
  }
}

/* ─────────────────────────────────────────────
   الحوالة الداخلية
───────────────────────────────────────────── */
function createTarnsferSection() {
  hideAllCards();
  document.getElementById("createtransfer").style.display = "block";
  ctInitForm();
}

async function ctInitForm() {
  const overlay = document.getElementById("ct-loading-overlay");
  const wrapper = document.getElementById("ct-form-wrapper");
  overlay.classList.remove("hidden");
  wrapper.style.opacity = "0.4";
  wrapper.style.pointerEvents = "none";

  try {
    const [currRes, officeRes] = await Promise.all([
      fetch(`${API_URL}/currencies`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }),
      fetch(`${API_URL}/offices`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }),
    ]);

    // ── العملات ──
    const currJson = await currRes.json();
    _ctCurrencies = Array.isArray(currJson) ? currJson : (currJson.data ?? []);
    _fillCurrencySelect("ct-send-currency", "اختر عملة الإرسال...");
    _fillCurrencySelect("ct-recv-currency", "اختر عملة الاستلام...");

    // ── المكاتب ──
    const officeJson = await officeRes.json();
    const offices = officeJson.data ?? [];
    const officeSel = document.getElementById("ct-office");
    officeSel.innerHTML = '<option value="">اختر المكتب المستلم...</option>';
    offices.forEach((o) =>
      officeSel.appendChild(
        new Option(`${o.name} — ${o.city?.name ?? ""}`, o.id),
      ),
    );
  } catch (err) {
    console.error("ctInitForm error:", err);
    ctShowError("فشل تحميل البيانات من الخادم. حاول مرة أخرى.");
  } finally {
    overlay.classList.add("hidden");
    wrapper.style.opacity = "1";
    wrapper.style.pointerEvents = "";
  }
}

// helper: يملأ قائمة عملات
function _fillCurrencySelect(selId, placeholder) {
  const sel = document.getElementById(selId);
  if (!sel) return;
  sel.innerHTML = `<option value="">${placeholder}</option>`;
  _ctCurrencies.forEach((c) =>
    sel.appendChild(new Option(`${c.name} (${c.code})`, c.id)),
  );
}

// حساب الدولار – داخلية
/**
 * يجلب السعر الفعلي للعملة بناءً على الشرائح (rates)
 * إن وُجدت شريحة تنطبق على المبلغ → يستخدم سعرها
 * وإلا → يستخدم السعر الأساسي (currency.price)
 * يُرجع: { rate, tierLabel }
 */
function getEffectiveRate(currency, amount) {
  const rates = currency.rates ?? [];
  if (rates.length > 0 && amount > 0) {
    // ترتيب تصاعدي حسب min_amount (الباك يُرجعها مرتبة لكن نضمن)
    const sorted = [...rates].sort(
      (a, b) => parseFloat(a.min_amount) - parseFloat(b.min_amount),
    );
    for (const tier of sorted) {
      const min = parseFloat(tier.min_amount);
      const max =
        tier.max_amount != null ? parseFloat(tier.max_amount) : Infinity;
      if (amount >= min && amount <= max) {
        const label =
          tier.max_amount != null
            ? `شريحة ${min.toLocaleString()} – ${parseFloat(tier.max_amount).toLocaleString()}`
            : `شريحة ${min.toLocaleString()}+`;
        return { rate: parseFloat(tier.rate), tierLabel: label };
      }
    }
  }
  // fallback: السعر الأساسي
  return { rate: parseFloat(currency.price ?? 1), tierLabel: null };
}

function ctCalculateUsd() {
  const amount = parseFloat(document.getElementById("ct-amount").value);
  const sendCurrId = parseInt(
    document.getElementById("ct-send-currency").value,
  );
  const usdVal = document.getElementById("ct-usd-value");
  const usdPreview = document.getElementById("ct-usd-preview");
  const tierHint = document.getElementById("ct-tier-hint");

  if (!amount || !sendCurrId || isNaN(amount)) {
    usdVal.textContent = usdPreview.textContent = "$0.00";
    if (tierHint) tierHint.style.display = "none";
    return;
  }
  const currency = _ctCurrencies.find((c) => c.id === sendCurrId);
  if (!currency) {
    usdVal.textContent = usdPreview.textContent = "$0.00";
    if (tierHint) tierHint.style.display = "none";
    return;
  }

  const { rate, tierLabel } = getEffectiveRate(currency, amount);
  const eq = (amount * rate).toFixed(2);
  usdVal.textContent = usdPreview.textContent = `$${eq}`;

  if (tierHint) {
    if (tierLabel) {
      tierHint.textContent = `السعر المطبّق: ${rate} (${tierLabel})`;
      tierHint.style.display = "inline-flex";
    } else {
      tierHint.textContent = `السعر الأساسي: ${rate}`;
      tierHint.style.display = "inline-flex";
    }
  }
}

// معالجة رفع هوية المرسل – داخلية
function ctOnSenderIdChange(input) {
  const file = input.files[0];
  if (!file) return;
  document.getElementById("ct-sender-id-filename").textContent = file.name;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById("ct-sender-id-preview").src = e.target.result;
    document
      .getElementById("ct-sender-id-preview-wrap")
      .classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}
function ctRemoveSenderId() {
  document.getElementById("ct-sender-id-image").value = "";
  document.getElementById("ct-sender-id-filename").textContent =
    "اضغط لرفع صورة الهوية";
  document.getElementById("ct-sender-id-preview-wrap").classList.add("hidden");
}

// إرسال الحوالة الداخلية
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("ct-transfer-form")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await ctSubmitTransfer();
    });
  document
    .getElementById("intl-transfer-form")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await intlSubmitTransfer();
    });
});

async function ctSubmitTransfer() {
  const amount = document.getElementById("ct-amount").value.trim();
  const sendCurrId = document.getElementById("ct-send-currency").value;
  const recvCurrId = document.getElementById("ct-recv-currency").value;
  const officeId = document.getElementById("ct-office").value;
  const senderName = document.getElementById("ct-sender-name").value.trim();
  const senderIdFile = document.getElementById("ct-sender-id-image").files[0];
  const receiverName = document.getElementById("ct-receiver-name").value.trim();
  const receiverPhone = document
    .getElementById("ct-receiver-phone")
    .value.trim();

  if (!amount || parseFloat(amount) < 1)
    return ctShowError("يرجى إدخال مبلغ صحيح (1 أو أكثر)");
  if (!sendCurrId) return ctShowError("يرجى اختيار عملة الإرسال");
  if (!recvCurrId) return ctShowError("يرجى اختيار عملة الاستلام");
  if (!officeId) return ctShowError("يرجى اختيار المكتب المستلم");
  if (!senderName) return ctShowError("يرجى إدخال اسم المرسل");
  if (!senderIdFile) return ctShowError("يرجى رفع صورة هوية المرسل");
  if (!receiverName) return ctShowError("يرجى إدخال اسم المستلم");
  if (!receiverPhone) return ctShowError("يرجى إدخال رقم هاتف المستلم");

  const btn = document.getElementById("ct-submit-btn");
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإرسال...';

  try {
    const fd = new FormData();
    fd.append("amount", parseFloat(amount));
    fd.append("send_currency_id", parseInt(sendCurrId));
    fd.append("currency_id", parseInt(recvCurrId));
    fd.append("destination_office_id", parseInt(officeId));
    fd.append("status", "waiting");
    fd.append("receiver_name", receiverName);
    fd.append("receiver_phone", receiverPhone);
    fd.append("sender_name", senderName);
    fd.append("sender_id_image", senderIdFile);

    const res = await fetch(`${API_URL}/transfers`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      body: fd,
    });

    const json = await res.json();
    if (res.status === 201) {
      ctShowSuccess(
        `تم إنشاء الحوالة بنجاح — كود التتبع: ${json.data?.tracking_code ?? ""}`,
      );
      ctResetForm();
    } else {
      const msg = json.errors
        ? Object.values(json.errors).flat().join(" — ")
        : (json.message ?? "حدث خطأ");
      ctShowError(msg);
    }
  } catch (err) {
    console.error("ctSubmitTransfer error:", err);
    ctShowError("تعذّر الاتصال بالخادم.");
  } finally {
    btn.disabled = false;
    btn.innerHTML =
      '<i class="fa-solid fa-paper-plane"></i> تأكيد وإرسال الحوالة';
  }
}

function ctResetForm() {
  [
    "ct-amount",
    "ct-sender-name",
    "ct-receiver-name",
    "ct-receiver-phone",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  ["ct-send-currency", "ct-recv-currency", "ct-office"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("ct-usd-value").textContent = "$0.00";
  document.getElementById("ct-usd-preview").textContent = "$0.00";
  ctRemoveSenderId();
}

function ctShowSuccess(msg) {
  const t = document.getElementById("ct-success-toast");
  document.getElementById("ct-toast-msg").textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 6000);
  document.getElementById("ct-error-toast").classList.add("hidden");
}
function ctShowError(msg) {
  const t = document.getElementById("ct-error-toast");
  document.getElementById("ct-error-msg").textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 6000);
  document.getElementById("ct-success-toast").classList.add("hidden");
}

/* ─────────────────────────────────────────────
   الحوالة الخارجية (الدولية)
───────────────────────────────────────────── */
let _intlCurrencies = [];
let _intlAllAgents = [];
let _intlAllCountries = [];

function createIntlTransferSection() {
  hideAllCards();
  document.getElementById("createtransfer-intl").style.display = "block";
  intlInitForm();
}

async function intlInitForm() {
  const overlay = document.getElementById("intl-loading-overlay");
  const wrapper = document.getElementById("intl-form-wrapper");
  overlay.classList.remove("hidden");
  wrapper.style.opacity = "0.4";
  wrapper.style.pointerEvents = "none";

  try {
    const [currRes, officeRes, countryRes] = await Promise.all([
      fetch(`${API_URL}/currencies`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }),
      fetch(`${API_URL}/offices`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }),
      fetch(`${API_URL}/countries`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }),
    ]);

    // ── العملات ──
    const currJson = await currRes.json();
    _intlCurrencies = Array.isArray(currJson)
      ? currJson
      : (currJson.data ?? []);
    _ctCurrencies = _intlCurrencies;

    const intlSendSel = document.getElementById("intl-send-currency");
    const intlRecvSel = document.getElementById("intl-recv-currency");
    intlSendSel.innerHTML = '<option value="">اختر عملة الإرسال...</option>';
    intlRecvSel.innerHTML = '<option value="">اختر عملة الاستلام...</option>';
    _intlCurrencies.forEach((c) => {
      intlSendSel.appendChild(new Option(`${c.name} (${c.code})`, c.id));
      intlRecvSel.appendChild(new Option(`${c.name} (${c.code})`, c.id));
    });

    // ── المكاتب (يختارها المدير يدوياً) ──
    const officeJson = await officeRes.json();
    const offices = officeJson.data ?? [];
    const intlOfficeSel = document.getElementById("intl-office");
    intlOfficeSel.innerHTML = '<option value="">اختر المكتب المحلي...</option>';
    offices.forEach((o) =>
      intlOfficeSel.appendChild(
        new Option(`${o.name} — ${o.city?.name ?? ""}`, o.id),
      ),
    );

    // ── الدول (كل الدول ما عدا سوريا) ──
    const countryJson = await countryRes.json();
    _intlAllCountries = (countryJson.data ?? countryJson).filter(
      (c) => c.id !== SYRIA_COUNTRY_ID,
    );
    const countrySel = document.getElementById("intl-country");
    countrySel.innerHTML = '<option value="">اختر الدولة المستلِمة...</option>';
    _intlAllCountries.forEach((c) =>
      countrySel.appendChild(new Option(c.name, c.id)),
    );

    // تهيئة المدينة معطّلة حتى اختيار الدولة
    const citySel = document.getElementById("intl-city");
    citySel.innerHTML = '<option value="">اختر الدولة أولاً...</option>';
    citySel.disabled = true;
  } catch (err) {
    console.error("intlInitForm error:", err);
    intlShowError("فشل تحميل البيانات من الخادم. حاول مرة أخرى.");
  } finally {
    overlay.classList.add("hidden");
    wrapper.style.opacity = "1";
    wrapper.style.pointerEvents = "";
  }
}

// عند اختيار الدولة → جلب المدن من API
async function intlOnCountryChange() {
  const countryId = parseInt(document.getElementById("intl-country").value);
  const citySel = document.getElementById("intl-city");

  // إعادة تعيين المدينة
  citySel.innerHTML = '<option value="">اختر الدولة أولاً...</option>';
  citySel.disabled = true;

  if (!countryId) return;

  // ── جلب المدن ──
  citySel.innerHTML = '<option value="">جاري التحميل...</option>';
  try {
    const res = await fetch(`${API_URL}/cities?country_id=${countryId}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const json = await res.json();
    const cities = json.data ?? json ?? [];

    citySel.innerHTML = '<option value="">اختر المدينة...</option>';
    if (cities.length === 0) {
      citySel.innerHTML =
        '<option value="" disabled>لا توجد مدن مسجلة لهذه الدولة</option>';
    } else {
      cities.forEach((c) => citySel.appendChild(new Option(c.name, c.name)));
    }
    citySel.disabled = false;
  } catch (err) {
    console.error("cities fetch error:", err);
    citySel.innerHTML = '<option value="" disabled>فشل تحميل المدن</option>';
    citySel.disabled = false;
  }
}

// حساب الدولار – خارجية
function intlCalculateUsd() {
  const amount = parseFloat(document.getElementById("intl-amount").value);
  const sendCurrId = parseInt(
    document.getElementById("intl-send-currency").value,
  );
  const usdVal = document.getElementById("intl-usd-value");
  const usdPreview = document.getElementById("intl-usd-preview");
  const tierHint = document.getElementById("intl-tier-hint");

  if (!amount || !sendCurrId || isNaN(amount)) {
    usdVal.textContent = usdPreview.textContent = "$0.00";
    if (tierHint) tierHint.style.display = "none";
    return;
  }
  const currency = _intlCurrencies.find((c) => c.id === sendCurrId);
  if (!currency) {
    usdVal.textContent = usdPreview.textContent = "$0.00";
    if (tierHint) tierHint.style.display = "none";
    return;
  }

  const { rate, tierLabel } = getEffectiveRate(currency, amount);
  const eq = (amount * rate).toFixed(2);
  usdVal.textContent = usdPreview.textContent = `$${eq}`;

  if (tierHint) {
    if (tierLabel) {
      tierHint.textContent = `السعر المطبّق: ${rate} (${tierLabel})`;
      tierHint.style.display = "inline-flex";
    } else {
      tierHint.textContent = `السعر الأساسي: ${rate}`;
      tierHint.style.display = "inline-flex";
    }
  }
}

// هوية المرسل – خارجية
function intlOnSenderIdChange(input) {
  const file = input.files[0];
  if (!file) return;
  document.getElementById("intl-sender-id-filename").textContent = file.name;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById("intl-sender-id-preview").src = e.target.result;
    document
      .getElementById("intl-sender-id-preview-wrap")
      .classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}
function intlRemoveSenderId() {
  document.getElementById("intl-sender-id-image").value = "";
  document.getElementById("intl-sender-id-filename").textContent =
    "اضغط لرفع صورة الهوية";
  document
    .getElementById("intl-sender-id-preview-wrap")
    .classList.add("hidden");
}

// إرسال الحوالة الدولية
async function intlSubmitTransfer() {
  const amount = document.getElementById("intl-amount").value.trim();
  const sendCurrId = document.getElementById("intl-send-currency").value;
  const recvCurrId = document.getElementById("intl-recv-currency").value;
  const officeId = document.getElementById("intl-office").value;
  const countryId = document.getElementById("intl-country").value;
  const city = document.getElementById("intl-city").value.trim();
  const senderName = document.getElementById("intl-sender-name").value.trim();
  const senderIdFile = document.getElementById("intl-sender-id-image").files[0];
  const receiverName = document
    .getElementById("intl-receiver-name")
    .value.trim();
  const receiverPhone = document
    .getElementById("intl-receiver-phone")
    .value.trim();

  if (!amount || parseFloat(amount) < 1)
    return intlShowError("يرجى إدخال مبلغ صحيح");
  if (!sendCurrId) return intlShowError("يرجى اختيار عملة الإرسال");
  if (!recvCurrId) return intlShowError("يرجى اختيار عملة الاستلام");
  if (!officeId) return intlShowError("يرجى اختيار المكتب المحلي");
  if (!countryId) return intlShowError("يرجى اختيار الدولة المستلِمة");
  if (!city) return intlShowError("يرجى اختيار المدينة في الخارج");
  if (!senderName) return intlShowError("يرجى إدخال اسم المرسل");
  if (!senderIdFile) return intlShowError("يرجى رفع صورة هوية المرسل");
  if (!receiverName) return intlShowError("يرجى إدخال اسم المستلم");
  if (!receiverPhone) return intlShowError("يرجى إدخال رقم هاتف المستلم");

  const btn = document.getElementById("intl-submit-btn");
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإرسال...';

  try {
    const fd = new FormData();
    fd.append("amount", parseFloat(amount));
    fd.append("send_currency_id", parseInt(sendCurrId));
    fd.append("currency_id", parseInt(recvCurrId));
    fd.append("destination_office_id", parseInt(officeId));
    fd.append("destination_country_id", parseInt(countryId));
    fd.append("destination_city", city);
    fd.append("status", "waiting");
    fd.append("receiver_name", receiverName);
    fd.append("receiver_phone", receiverPhone);
    fd.append("sender_name", senderName);
    fd.append("sender_id_image", senderIdFile);

    const res = await fetch(`${API_URL}/transfers`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      body: fd,
    });

    const json = await res.json();
    if (res.status === 201) {
      intlShowSuccess(
        `تم إنشاء الحوالة الدولية بنجاح — كود التتبع: ${json.data?.tracking_code ?? ""}`,
      );
      intlResetForm();
    } else {
      const msg = json.errors
        ? Object.values(json.errors).flat().join(" — ")
        : (json.message ?? "حدث خطأ");
      intlShowError(msg);
    }
  } catch (err) {
    console.error("intlSubmitTransfer error:", err);
    intlShowError("تعذّر الاتصال بالخادم.");
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-globe"></i> إرسال الحوالة الدولية';
  }
}

function intlResetForm() {
  // حقول النصوص
  [
    "intl-amount",
    "intl-sender-name",
    "intl-receiver-name",
    "intl-receiver-phone",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  // القوائم المنسدلة
  [
    "intl-send-currency",
    "intl-recv-currency",
    "intl-office",
    "intl-country",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  // إعادة تعيين المدينة (select) وتعطيلها
  const citySel = document.getElementById("intl-city");
  if (citySel) {
    citySel.innerHTML = '<option value="">اختر الدولة أولاً...</option>';
    citySel.disabled = true;
  }
  document.getElementById("intl-usd-value").textContent = "$0.00";
  document.getElementById("intl-usd-preview").textContent = "$0.00";
  intlRemoveSenderId();
}

function intlShowSuccess(msg) {
  const t = document.getElementById("intl-success-toast");
  document.getElementById("intl-toast-msg").textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 6000);
  document.getElementById("intl-error-toast").classList.add("hidden");
}
function intlShowError(msg) {
  const t = document.getElementById("intl-error-toast");
  document.getElementById("intl-error-msg").textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 6000);
  document.getElementById("intl-success-toast").classList.add("hidden");
}

async function loadTradingReport() {
  const dateInput = document.getElementById("report-date");
  const date = dateInput.value || new Date().toISOString().split("T")[0];
  const summaryEl = document.getElementById("profits-summary");
  const tableEl = document.getElementById("profits-table");
  const emptyEl = document.getElementById("profits-empty");
  const tbodyEl = document.getElementById("profits-list");

  // حالة التحميل
  summaryEl.innerHTML =
    '<p style="color:var(--gray);font-size:13px;padding:10px 0;">جاري التحميل...</p>';
  tableEl.style.display = "none";
  emptyEl.style.display = "none";
  tbodyEl.innerHTML = "";

  try {
    const res = await fetch(`${API_URL}/trading/report/details?date=${date}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const json = await res.json();

    if (!res.ok) {
      summaryEl.innerHTML = `<p style="color:var(--danger);">${json.message || "فشل تحميل البيانات"}</p>`;
      return;
    }

    const transactions = json.transactions || [];
    const summary = json.summary || {};

    // ===== بطاقات الملخص =====
    const totalProfit = parseFloat(summary.total_net_profit || 0);
    const profitColor = totalProfit >= 0 ? "var(--success)" : "var(--danger)";
    const profitIcon =
      totalProfit >= 0 ? "fa-arrow-trend-up" : "fa-arrow-trend-down";

    const cardStyle =
      "background:var(--white);border-radius:var(--radius-sm);padding:20px;box-shadow:var(--shadow);border:1px solid var(--border);";

    summaryEl.innerHTML = `
            <div style="${cardStyle}">
                <div style="font-size:12px;color:var(--gray);margin-bottom:6px;font-weight:700;text-transform:uppercase;">إجمالي المشتريات</div>
                <div style="font-size:22px;font-weight:800;color:#1e3c72;">
                    ${parseFloat(summary.total_bought || 0).toFixed(2)}
                </div>
            </div>
            <div style="${cardStyle}">
                <div style="font-size:12px;color:var(--gray);margin-bottom:6px;font-weight:700;text-transform:uppercase;">إجمالي المبيعات</div>
                <div style="font-size:22px;font-weight:800;color:#fd7e14;">
                    ${parseFloat(summary.total_sold || 0).toFixed(2)}
                </div>
            </div>
            <div style="${cardStyle}">
                <div style="font-size:12px;color:var(--gray);margin-bottom:6px;font-weight:700;text-transform:uppercase;">صافي الربح / الخسارة</div>
                <div style="font-size:22px;font-weight:800;color:${profitColor};">
                    <i class="fa-solid ${profitIcon}" style="font-size:16px;"></i>
                    ${totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(2)}
                </div>
            </div>
            <div style="${cardStyle}">
                <div style="font-size:12px;color:var(--gray);margin-bottom:6px;font-weight:700;text-transform:uppercase;">عدد العمليات</div>
                <div style="font-size:22px;font-weight:800;color:#6f42c1;">
                    ${transactions.length}
                </div>
            </div>
        `;

    if (transactions.length === 0) {
      emptyEl.style.display = "block";
      const _pph = document.getElementById("profits-placeholder");
      if (_pph) _pph.style.display = "none";
      return;
    }

    // ===== صفوف الجدول =====
    transactions.forEach((tx, index) => {
      const isBuy = tx.type === "buy";
      const profit = parseFloat(tx.profit || 0);
      const pColor =
        profit > 0
          ? "var(--success)"
          : profit < 0
            ? "var(--danger)"
            : "var(--gray)";

      const typeBadge = isBuy
        ? `<span class="status-badge" style="background:#dcfce7;color:#166534;">شراء</span>`
        : `<span class="status-badge" style="background:#fee2e2;color:#991b1b;">بيع</span>`;

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
    const _ptwS = document.getElementById("profits-table-wrapper");
    if (_ptwS) _ptwS.style.display = "block";
  } catch (error) {
    console.error("Error loading trading report:", error);
    summaryEl.innerHTML =
      '<p style="color:var(--danger);">خطأ في الاتصال بالسيرفر</p>';
  }
}

async function handleLogout() {
  await fetch(`${API_URL}/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  localStorage.removeItem("auth_token");
  window.location.href = "../index.html";
}

/* =====================================================
   تعديل الحوالة — Modal
   ===================================================== */

function openEditModal(transfer) {
  const infoEl = document.getElementById("edit-transfer-info");
  if (infoEl) {
    const amtUsd = Number(transfer.amount_in_usd ?? 0);
    const tracking = transfer.tracking_code
      ? ` | ${transfer.tracking_code}`
      : "";
    infoEl.innerHTML = `
      <span style="color:var(--primary);font-weight:800;">#${transfer.id}${tracking}</span>
      &nbsp;—&nbsp;
      <span>$${amtUsd.toFixed(2)}</span>
      &nbsp;|&nbsp;
      <span style="color:var(--gray);">المرسل: ${transfer.sender?.name ?? "—"}</span>`;
  }

  document.getElementById("edit-transfer-id").value = transfer.id;
  document.getElementById("edit-receiver-name").value =
    transfer.receiver_name ?? "";
  document.getElementById("edit-receiver-phone").value =
    transfer.receiver_phone ?? "";
  document.getElementById("edit-amount").value = transfer.amount ?? "";
  document.getElementById("edit-notes").value = "";

  // إخفاء حقل الرسوم — يُحسب تلقائياً من الباك
  const feeEl = document.getElementById("edit-fee");
  if (feeEl) {
    const feeParent =
      feeEl.closest(".form-group") || feeEl.closest(".form-row");
    if (feeParent) feeParent.style.display = "none";
    feeEl.value = "0";
  }

  const errEl = document.getElementById("edit-modal-error");
  if (errEl) errEl.classList.add("hidden");

  document.getElementById("edit-transfer-modal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeEditModal() {
  document.getElementById("edit-transfer-modal").classList.add("hidden");
  document.body.style.overflow = "";
}

// إغلاق عند الضغط على الخلفية
document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("edit-transfer-modal");
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeEditModal();
    });
  }
});

async function saveTransferEdit() {
  const id = document.getElementById("edit-transfer-id").value;
  const btn = document.getElementById("edit-save-btn");
  const errEl = document.getElementById("edit-modal-error");
  const errTxt = document.getElementById("edit-modal-error-text");

  const receiverName = document
    .getElementById("edit-receiver-name")
    .value.trim();
  const receiverPhone = document
    .getElementById("edit-receiver-phone")
    .value.trim();
  const amount = parseFloat(document.getElementById("edit-amount").value);
  const fee = parseFloat(document.getElementById("edit-fee").value) || 0;
  const notes =
    document.getElementById("edit-notes").value.trim() ||
    "تعديل بيانات الحوالة";

  // Validation
  const showErr = (msg) => {
    errTxt.textContent = msg;
    errEl.classList.remove("hidden");
  };
  errEl.classList.add("hidden");

  if (!receiverName) return showErr("يرجى إدخال اسم المستلم");
  if (!receiverPhone) return showErr("يرجى إدخال رقم هاتف المستلم");
  if (!amount || amount < 1) return showErr("يرجى إدخال مبلغ صحيح (1 أو أكثر)");

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';

  try {
    const res = await fetch(`${API_URL}/transfers/${id}/edit`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        receiver_name: receiverName,
        receiver_phone: receiverPhone,
        amount,
        fee,
        notes,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      closeEditModal();
      showAdminToast("✓ تم تعديل الحوالة وحفظ السجل بنجاح", "success");
      loadAllTransfers();
    } else {
      const msg = data.errors
        ? Object.values(data.errors).flat().join(" — ")
        : data.message || "حدث خطأ أثناء التعديل";
      showErr(msg);
    }
  } catch (e) {
    console.error("saveTransferEdit error:", e);
    showErr("تعذّر الاتصال بالخادم. تحقق من الاتصال وحاول مجدداً.");
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ التعديلات';
  }
}

/* =====================================================
   إشعار Toast عام
   ===================================================== */
function showAdminToast(msg, type = "success") {
  const old = document.getElementById("admin-global-toast");
  if (old) old.remove();

  const colors = {
    success: { bg: "#16a34a", shadow: "rgba(22,163,74,0.35)" },
    error: { bg: "#dc2626", shadow: "rgba(220,38,38,0.35)" },
  };
  const c = colors[type] || colors.success;

  const toast = document.createElement("div");
  toast.id = "admin-global-toast";
  toast.style.cssText = `
        position:fixed; top:24px; left:50%; transform:translateX(-50%);
        background:${c.bg}; color:#fff;
        padding:13px 28px; border-radius:14px;
        font-size:14px; font-weight:700; font-family:'Cairo',sans-serif;
        z-index:9999; box-shadow:0 6px 24px ${c.shadow};
        direction:rtl; animation:fadeIn .3s ease;
        display:flex; align-items:center; gap:10px;
        max-width:90vw; text-align:center;
    `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity .4s";
  }, 3000);
  setTimeout(() => toast.remove(), 3500);
}

/* =====================================================
   سجل التعديلات
   ===================================================== */
function showTransferHistorySection() {
  hideAllCards();
  const card = document.getElementById("transfer-history-card");
  if (card) card.style.display = "block";
  loadTransferHistory();
}

async function loadTransferHistory() {
  const tbody = document.getElementById("history-list");
  const emptyEl = document.getElementById("history-empty");
  const countEl = document.getElementById("stat-history-count");

  if (!tbody) return;
  tbody.innerHTML =
    '<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--gray);">جاري التحميل...</td></tr>';
  emptyEl?.classList.add("hidden");

  try {
    const res = await fetch(`${API_URL}/transfers/history/all`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const json = await res.json();
    tbody.innerHTML = "";

    if (!json.data || json.data.length === 0) {
      emptyEl?.classList.remove("hidden");
      if (countEl) countEl.textContent = "0";
      return;
    }

    if (countEl) countEl.textContent = json.data.length;

    const fieldLabels = {
      receiver_name: "اسم المستلم",
      receiver_phone: "رقم الهاتف",
      amount: "المبلغ",
      fee: "الرسوم",
    };

    json.data.forEach((h, idx) => {
      const oldD = h.old_data || {};
      const newD = h.new_data || {};

      // بناء خلية التغييرات (مقارنة قديم/جديد)
      let changesHtml = "";
      const allKeys = [
        ...new Set([...Object.keys(oldD), ...Object.keys(newD)]),
      ];
      let hasChanges = false;

      allKeys.forEach((key) => {
        const oldVal = oldD[key] ?? "—";
        const newVal = newD[key] ?? "—";
        if (String(oldVal) === String(newVal)) return;
        hasChanges = true;
        const label = fieldLabels[key] || key;
        changesHtml += `
                    <div class="diff-row">
                        <span class="diff-label">${label}</span>
                        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                            <span class="diff-old">${oldVal}</span>
                            <i class="fa-solid fa-arrow-left" style="font-size:10px;color:var(--gray);"></i>
                            <span class="diff-new">${newVal}</span>
                        </div>
                    </div>
                `;
      });

      if (!hasChanges) {
        changesHtml =
          '<span style="color:var(--gray);font-size:12px;">لا توجد تغييرات</span>';
      }

      const date = new Date(h.created_at).toLocaleString("ar-SY", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      tbody.innerHTML += `
                <tr>
                    <td style="font-weight:700;color:var(--gray);">${idx + 1}</td>
                    <td>
                        <span style="font-weight:800;color:var(--primary);font-size:15px;">#${h.transfer_id}</span>
                    </td>
                    <td>
                        <div style="font-weight:700;">${h.admin?.name ?? "—"}</div>
                        <div style="font-size:11px;color:var(--gray);">${h.admin?.role ?? ""}</div>
                    </td>
                    <td>
                        <span class="status-badge" style="background:#fef3c7;color:#92400e;white-space:normal;max-width:180px;display:inline-block;">
                            ${h.action ?? "تعديل"}
                        </span>
                    </td>
                    <td style="min-width:180px;">${changesHtml}</td>
                    <td style="font-size:12px;color:var(--gray);white-space:nowrap;">${date}</td>
                </tr>
            `;
    });
  } catch (e) {
    console.error("loadTransferHistory error:", e);
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align:center;color:var(--danger);padding:20px;">خطأ في التحميل — تحقق من الاتصال</td></tr>';
  }
}

function filterHistoryTable() {
  const q = (
    document.getElementById("history-search")?.value || ""
  ).toLowerCase();
  document.querySelectorAll("#history-list tr").forEach((row) => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
  });
}

let token = null;

document.addEventListener("DOMContentLoaded", async () => {
  token = await checkAuth();
  if (!token) return;

  await loadBankTransfers();
  loadPendingTransfers();
  await loadCashiers();
});

// =============================================================================
//  CHAT PANEL — وظائف لوحة الدردشة
//  تتواصل مع: GET  /api/transfers/{id}/messages
//              POST /api/transfers/{id}/messages
// =============================================================================

/** الحالة الداخلية للدردشة المفتوحة حالياً */
let _chat = {
  transferId: null,
  trackingCode: null,
  currentUserId: null,
  pollInterval: null,
};

/**
 * openChat(transferId, trackingCode, senderId)
 * يُستدعى من زر الدردشة في جدول الحوالات
 */
async function openChat(transferId, trackingCode, senderId) {
  // جلب معرّف المستخدم الحالي (الأدمن/المكتب) إن لم يكن محفوظاً
  if (!_chat.currentUserId) {
    try {
      const meRes = await fetch(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const meData = await meRes.json();
      _chat.currentUserId = meData.user?.id ?? 0;
    } catch (_) {}
  }

  // حفظ بيانات الجلسة
  _chat.transferId = transferId;
  _chat.trackingCode = trackingCode;

  // تحديث الهيدر
  document.getElementById("chat-panel-name").textContent = `دردشة مع الزبون`;
  document.getElementById("chat-panel-tracking").textContent =
    `رقم الحوالة: ${trackingCode}`;

  // إظهار اللوحة
  document.getElementById("chat-panel").classList.remove("hidden");
  document.getElementById("chat-panel-overlay").classList.remove("hidden");
  document.body.classList.add("chat-open");

  // تفريغ القائمة وتحميل الرسائل
  document.getElementById("chat-messages-list").innerHTML = "";
  document.getElementById("chat-empty").classList.add("hidden");
  document.getElementById("chat-loading").classList.remove("hidden");
  await loadChatMessages();

  // تركيز على حقل الكتابة
  document.getElementById("chat-message-input").focus();

  // Polling كل 8 ثوانٍ للرسائل الجديدة
  clearInterval(_chat.pollInterval);
  _chat.pollInterval = setInterval(loadChatMessages, 8000);
}

/** إغلاق لوحة الدردشة */
function closeChatPanel() {
  clearInterval(_chat.pollInterval);
  _chat.pollInterval = null;

  document.getElementById("chat-panel").classList.add("hidden");
  document.getElementById("chat-panel-overlay").classList.add("hidden");
  document.body.classList.remove("chat-open");

  _chat.transferId = null;
  _chat.trackingCode = null;
}

/** تحميل رسائل الحوالة من API */
async function loadChatMessages() {
  if (!_chat.transferId) return;

  const listEl = document.getElementById("chat-messages-list");
  const loadingEl = document.getElementById("chat-loading");
  const emptyEl = document.getElementById("chat-empty");

  // نحتفظ بالـ scroll position لمنع القفز عند التحديث التلقائي
  const area = document.getElementById("chat-messages-area");
  const wasAtBottom =
    area.scrollHeight - area.scrollTop - area.clientHeight < 60;
  const prevCount = listEl.querySelectorAll(".chat-bubble").length;

  try {
    const res = await fetch(
      `${API_URL}/transfers/${_chat.transferId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    );
    const json = await res.json();

    loadingEl.classList.add("hidden");

    const messages = json.data ?? json.messages ?? json ?? [];

    if (!Array.isArray(messages) || messages.length === 0) {
      emptyEl.classList.remove("hidden");
      listEl.innerHTML = "";
      return;
    }

    emptyEl.classList.add("hidden");

    // إعادة رسم فقط إذا تغيّر العدد (لتجنّب الوميض عند الـ polling)
    if (messages.length !== prevCount) {
      listEl.innerHTML = messages.map((msg) => buildChatBubble(msg)).join("");
      if (wasAtBottom || messages.length !== prevCount) scrollChatToBottom();
    }
  } catch (err) {
    console.error("loadChatMessages error:", err);
    loadingEl.classList.add("hidden");
    if (!listEl.querySelector(".chat-bubble")) {
      listEl.innerHTML = `<div style="text-align:center;color:var(--danger);padding:20px;font-size:13px;">
                <i class="fa-solid fa-triangle-exclamation"></i> تعذّر تحميل الرسائل
            </div>`;
    }
  }
}

/**
 * بناء فقاعة رسالة واحدة
 * يعتمد على message.sender_id مقارنةً بـ _chat.currentUserId
 */
function buildChatBubble(msg) {
  const isMe = msg.sender_id === _chat.currentUserId;
  const name = msg.sender?.name ?? (isMe ? "أنت" : "الزبون");
  const text = msg.message ?? msg.text ?? "";
  const imageUrl = msg.image_url ?? msg.image ?? null; // ← حقل الصورة من الـ API
  const time = msg.created_at
    ? new Date(msg.created_at).toLocaleTimeString("ar", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const sideClass = isMe ? "bubble-me" : "bubble-other";

  // ── محتوى الفقاعة: صورة أو نص أو كليهما معاً ──
  let contentHtml = "";

  if (imageUrl) {
    // عرض الصورة — نُنشئ رابطاً كاملاً إذا كان relative path
    const fullUrl = imageUrl.startsWith("http")
      ? imageUrl
      : `${API_URL.replace("/api", "")}/${imageUrl.replace(/^\//, "")}`;
    contentHtml += `
            <div class="bubble-img-wrap">
                <img
                    src="${fullUrl}"
                    class="bubble-img"
                    alt="صورة"
                    loading="lazy"
                    onclick="openImageLightbox('${fullUrl}')"
                    onerror="this.closest('.bubble-img-wrap').innerHTML='<span class=\'bubble-img-error\'><i class=\'fa-solid fa-image-slash\'></i> تعذّر تحميل الصورة</span>'"
                >
            </div>`;
  }

  if (text) {
    contentHtml += `<span class="bubble-text">${escapeHtml(text)}</span>`;
  }

  return `
        <div class="chat-bubble ${sideClass}">
            ${!isMe ? `<div class="bubble-name">${escapeHtml(name)}</div>` : ""}
            <div class="bubble-body">
                ${contentHtml}
                ${time ? `<span class="bubble-time">${time}</span>` : ""}
            </div>
        </div>`;
}

// ── متغير لتتبع الصورة المختارة ──────────────────────────────
let _chatSelectedImage = null;

/** يُختار عند النقر على زر الصورة */
function onImageSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  // التحقق من نوع الملف
  if (!file.type.startsWith("image/")) {
    alert("يرجى اختيار ملف صورة صالح (JPG, PNG, GIF, ...)");
    event.target.value = "";
    return;
  }

  // التحقق من الحجم (الحد الأقصى 5 MB)
  if (file.size > 5 * 1024 * 1024) {
    alert("حجم الصورة كبير جداً. الحد الأقصى المسموح 5 ميغابايت");
    event.target.value = "";
    return;
  }

  _chatSelectedImage = file;

  // عرض المعاينة
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById("chat-img-preview-thumb").src = e.target.result;
    document.getElementById("chat-img-preview-name").textContent = file.name;
    document.getElementById("chat-img-preview-size").textContent =
      formatFileSize(file.size);
    document.getElementById("chat-img-preview-bar").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
  document.getElementById("chat-message-input").focus();
}

/** إلغاء اختيار الصورة */
function clearImageSelection() {
  _chatSelectedImage = null;
  document.getElementById("chat-image-input").value = "";
  document.getElementById("chat-img-preview-bar").classList.add("hidden");
  document.getElementById("chat-img-preview-thumb").src = "";
}

/** تنسيق حجم الملف */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/** مشغّل الصورة fullscreen (lightbox بسيط) */
function openImageLightbox(url) {
  const lb = document.createElement("div");
  lb.style.cssText = `
        position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:9999;
        display:flex;align-items:center;justify-content:center;cursor:zoom-out;
        animation:fadeIn .2s ease;
    `;
  lb.innerHTML = `
        <img src="${url}" style="max-width:92vw;max-height:92vh;border-radius:10px;box-shadow:0 8px 40px rgba(0,0,0,0.6);">
        <button style="position:absolute;top:18px;left:18px;background:rgba(255,255,255,.15);border:none;color:white;width:38px;height:38px;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;" onclick="this.parentElement.remove()">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;
  lb.onclick = (e) => {
    if (e.target === lb) lb.remove();
  };
  document.body.appendChild(lb);
}

/** مُوجِّه: يقرر إرسال نص أو صورة */
async function sendChatMessageOrImage() {
  if (_chatSelectedImage) {
    await sendChatImage();
  } else {
    await sendChatMessage();
  }
}

/** إرسال رسالة نصية */
async function sendChatMessage() {
  if (!_chat.transferId) return;

  const input = document.getElementById("chat-message-input");
  const sendBtn = document.getElementById("chat-send-btn");
  const text = input.value.trim();
  if (!text) return;

  sendBtn.disabled = true;
  sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
  input.disabled = true;

  try {
    const res = await fetch(
      `${API_URL}/transfers/${_chat.transferId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ message: text }),
      },
    );

    if (res.ok) {
      input.value = "";
      input.style.height = "auto";
      await loadChatMessages();
      scrollChatToBottom();
    } else {
      const err = await res.json();
      alert(err.message ?? "تعذّر إرسال الرسالة");
    }
  } catch (e) {
    console.error("sendChatMessage error:", e);
    alert("خطأ في الاتصال");
  } finally {
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
    input.disabled = false;
    input.focus();
  }
}

/** إرسال صورة عبر multipart/form-data */
async function sendChatImage() {
  if (!_chat.transferId || !_chatSelectedImage) return;

  const sendBtn = document.getElementById("chat-send-btn");
  const input = document.getElementById("chat-message-input");

  sendBtn.disabled = true;
  sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
  input.disabled = true;

  try {
    const fd = new FormData();
    fd.append("image", _chatSelectedImage);

    // إذا كان هناك نص مرافق للصورة أضفه أيضاً
    const caption = input.value.trim();
    if (caption) fd.append("message", caption);

    const res = await fetch(
      `${API_URL}/transfers/${_chat.transferId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          // لا تضف Content-Type — المتصفح يضعها تلقائياً مع الـ boundary
        },
        body: fd,
      },
    );

    if (res.ok) {
      input.value = "";
      input.style.height = "auto";
      clearImageSelection();
      await loadChatMessages();
      scrollChatToBottom();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.message ?? "تعذّر إرسال الصورة");
    }
  } catch (e) {
    console.error("sendChatImage error:", e);
    alert("خطأ في الاتصال أثناء رفع الصورة");
  } finally {
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
    input.disabled = false;
    input.focus();
  }
}

/** Enter = إرسال / Shift+Enter = سطر جديد */
function handleChatKeydown(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendChatMessageOrImage();
  }
}

/** تمدّد الـ textarea تلقائياً */
function autoResizeTextarea(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 120) + "px";
}

/** تمرير منطقة الرسائل للأسفل */
function scrollChatToBottom() {
  const area = document.getElementById("chat-messages-area");
  if (area) area.scrollTop = area.scrollHeight;
}

/** تهرب HTML لمنع XSS */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =============================================================================
//  NOTIFICATION SYSTEM — نظام إشعارات الرسائل الجديدة
//  ─────────────────────────────────────────────────────
//  ✅ لا يُعدَّل أي كود موجود. كل شيء هنا إضافات خالصة.
//
//  المنطق:
//   1. MutationObserver يراقب جدول الحوالات ويضيف badge لكل زر دردشة.
//   2. Poll كل 15 ثانية: يجلب رسائل كل حوالة مرئية، يحسب غير المقروءة
//      (رسائل الزبون فقط = sender_id !== adminId).
//   3. Monkey-patch لـ openChat لتسجيل "تمت القراءة" عند فتح المحادثة.
//   4. الإشعارات مخزنة في localStorage لتستمر بين تحديثات الصفحة.
// =============================================================================

/* ─── حالة النظام ──────────────────────────────────────────────────────────── */
const _notif = {
  adminId: null,
  seenCounts: JSON.parse(localStorage.getItem("fp_chat_seen") || "{}"),
  currentCounts: {}, // { transferId: customerMsgCount }
  transferMeta: {}, // { transferId: { tracking, sender } }
  pollInterval: null,
  POLL_MS: 15000, // فترة الاستعلام: 15 ثانية
};

/* ─── تهيئة النظام (بعد أن يصبح token متاحاً) ───────────────────────────── */
async function _notifInit() {
  // جلب معرّف الأدمن لتصفية رسائله من الإشعارات
  try {
    const r = await fetch(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const d = await r.json();
    _notif.adminId = d.user?.id ?? null;
  } catch (_) {}

  // ── تغليف openChat بالطريقة الصحيحة (وقت التشغيل، لا hoisting هنا) ──────
  // السبب: إعادة تعريف openChat بـ function declaration يتسبب في hoisting
  // وبالتالي _origOpenChat يلتقط النسخة الجديدة نفسها ← حلقة لا نهائية.
  // الحل: نلتقط window.openChat هنا أثناء التشغيل بعد اكتمال الـ hoisting،
  // ثم نستبدلها بنسخة مغلفة تستدعي الأصلية وتسجّل القراءة.
  const __origOpenChat = window.openChat;
  window.openChat = async function (transferId, trackingCode, senderId) {
    await __origOpenChat(transferId, trackingCode, senderId);
    _notifMarkSeen(transferId);
  };

  // مراقبة الجدول لإضافة badge تلقائياً عند رسم الصفوف
  const tbody = document.getElementById("transfers-list");
  if (tbody) {
    new MutationObserver(_notifInjectBadges).observe(tbody, {
      childList: true,
      subtree: true,
    });
  }

  // تشغيل أول poll بعد ثانيتين (وقت كافٍ لرسم الجدول)
  setTimeout(_notifPoll, 2000);

  // ثم poll دوري
  _notif.pollInterval = setInterval(_notifPoll, _notif.POLL_MS);
}

/* ─── إضافة badge span لكل زر دردشة في الجدول ──────────────────────────── */
function _notifInjectBadges() {
  document.querySelectorAll("#transfers-list .btn-chat").forEach((btn) => {
    if (btn.dataset.notifWired) return; // تجنّب التكرار

    const match = btn.getAttribute("onclick")?.match(/openChat\((\d+)/);
    if (!match) return;

    const tid = parseInt(match[1]);
    btn.dataset.notifWired = "1";
    btn.dataset.transferId = tid;
    btn.style.position = "relative"; // لتحديد موضع الـ badge

    const badge = document.createElement("span");
    badge.className = "chat-unread-badge hidden";
    badge.id = `chat-badge-${tid}`;
    btn.appendChild(badge);
  });
}

/* ─── Poll: جلب الرسائل وحساب غير المقروءة لكل حوالة مرئية ─────────────── */
async function _notifPoll() {
  const buttons = [
    ...document.querySelectorAll("#transfers-list .btn-chat[data-transfer-id]"),
  ];
  if (!buttons.length) return;

  let totalUnread = 0;
  const notifItems = [];

  for (const btn of buttons) {
    const tid = parseInt(btn.dataset.transferId);
    try {
      const res = await fetch(`${API_URL}/transfers/${tid}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!res.ok) continue;

      const json = await res.json();
      const msgs =
        json.data ?? json.messages ?? (Array.isArray(json) ? json : []);
      if (!Array.isArray(msgs)) continue;

      // نحسب فقط رسائل الزبون (ليست من الأدمن)
      const customerMsgs = _notif.adminId
        ? msgs.filter((m) => m.sender_id !== _notif.adminId)
        : msgs;
      const currentCount = customerMsgs.length;
      const seenCount = _notif.seenCounts[tid] ?? 0;
      const unread = Math.max(0, currentCount - seenCount);

      _notif.currentCounts[tid] = currentCount;

      // حفظ بيانات الحوالة (رقم التتبع، اسم المرسل) لعرضها في الـ dropdown
      const row = btn.closest("tr");
      if (row) {
        _notif.transferMeta[tid] = {
          tracking:
            row.querySelector("td:first-child")?.textContent?.trim() ??
            `#${tid}`,
          sender:
            row.querySelector("td:nth-child(3)")?.textContent?.trim() ?? "—",
        };
      }

      // ── تحديث badge الزر ──
      const badge = document.getElementById(`chat-badge-${tid}`);
      if (badge) {
        if (unread > 0) {
          badge.textContent = unread > 9 ? "9+" : String(unread);
          badge.classList.remove("hidden");
          btn.classList.add("btn-chat-has-unread");
        } else {
          badge.classList.add("hidden");
          btn.classList.remove("btn-chat-has-unread");
        }
      }

      if (unread > 0) {
        totalUnread += unread;
        notifItems.push({ tid, unread, ..._notif.transferMeta[tid] });
      }
    } catch (_) {
      /* فشل صامت لكل حوالة على حدة */
    }
  }

  _notifUpdateBell(totalUnread, notifItems);
}

/* ─── تحديث شارة الجرس وقائمة الإشعارات ────────────────────────────────── */
function _notifUpdateBell(total, items) {
  const bellBadge = document.getElementById("notif-bell-badge");
  const list = document.getElementById("notif-dropdown-list");
  if (!bellBadge || !list) return;

  if (total > 0) {
    bellBadge.textContent = total > 99 ? "99+" : String(total);
    bellBadge.classList.remove("hidden");

    list.innerHTML = items
      .map(
        (item) => `
            <div class="notif-item" onclick="_notifClickItem(${item.tid})">
                <div class="notif-item-icon">
                    <i class="fa-solid fa-message"></i>
                </div>
                <div class="notif-item-body">
                    <div class="notif-item-title">${escapeHtml(item.tracking)}</div>
                    <div class="notif-item-sub">
                        رسائل جديدة من <b>${escapeHtml(item.sender)}</b>
                    </div>
                </div>
                <span class="notif-item-count">${item.unread}</span>
            </div>
        `,
      )
      .join("");
  } else {
    bellBadge.classList.add("hidden");
    list.innerHTML = `<div class="notif-empty">
            <i class="fa-regular fa-bell-slash"></i>
            لا توجد إشعارات جديدة
        </div>`;
  }
}

/* ─── النقر على عنصر في الـ dropdown → فتح الدردشة مباشرة ──────────────── */
function _notifClickItem(transferId) {
  toggleNotifDropdown(false);
  const btn = document.querySelector(
    `#transfers-list .btn-chat[data-transfer-id="${transferId}"]`,
  );
  if (btn) btn.click();
}

/* ─── تسجيل "تمت القراءة" لحوالة معينة ─────────────────────────────────── */
function _notifMarkSeen(transferId) {
  const current = _notif.currentCounts[transferId] ?? 0;
  _notif.seenCounts[transferId] = current;
  localStorage.setItem("fp_chat_seen", JSON.stringify(_notif.seenCounts));

  // إخفاء badge الزر فوراً
  const badge = document.getElementById(`chat-badge-${transferId}`);
  if (badge) {
    badge.classList.add("hidden");
    badge.textContent = "";
  }
  const btn = document.querySelector(
    `#transfers-list .btn-chat[data-transfer-id="${transferId}"]`,
  );
  if (btn) btn.classList.remove("btn-chat-has-unread");

  // إعادة حساب الجرس بعد إزالة هذه الحوالة
  _notifPoll();
}

/* ─── فتح/إغلاق الـ dropdown ─────────────────────────────────────────────── */
function toggleNotifDropdown(forceState) {
  const dd = document.getElementById("notif-dropdown");
  if (!dd) return;
  if (forceState === false) {
    dd.classList.add("hidden");
    return;
  }
  dd.classList.toggle("hidden");
}

/* ─── مسح جميع الإشعارات ────────────────────────────────────────────────── */
function clearAllNotifications() {
  Object.keys(_notif.currentCounts).forEach((tid) => {
    _notif.seenCounts[parseInt(tid)] = _notif.currentCounts[parseInt(tid)] ?? 0;
  });
  localStorage.setItem("fp_chat_seen", JSON.stringify(_notif.seenCounts));

  document.getElementById("notif-bell-badge")?.classList.add("hidden");
  document.getElementById("notif-dropdown-list").innerHTML =
    '<div class="notif-empty"><i class="fa-regular fa-bell-slash"></i> لا توجد إشعارات جديدة</div>';

  document.querySelectorAll(".chat-unread-badge").forEach((b) => {
    b.classList.add("hidden");
    b.textContent = "";
  });
  document
    .querySelectorAll(".btn-chat-has-unread")
    .forEach((b) => b.classList.remove("btn-chat-has-unread"));
}

/* ─── إغلاق الـ dropdown عند النقر خارجه ────────────────────────────────── */
document.addEventListener("click", (e) => {
  const wrap = document.getElementById("notif-bell-wrap");
  if (wrap && !wrap.contains(e.target)) {
    document.getElementById("notif-dropdown")?.classList.add("hidden");
  }
});

/* ─── بدء النظام بمجرد توفر token ────────────────────────────────────────── */
(function _waitForToken() {
  if (typeof token !== "undefined" && token) {
    _notifInit();
  } else {
    setTimeout(_waitForToken, 300);
  }
})();

/* ═══════════════════════════════════════════════════════════════════════════
   ★  NEW TRANSFER ARRIVAL NOTIFICATIONS  (حوالات جديدة)
   ───────────────────────────────────────────────────────────────────────────
   يُشعر الأدمن فوراً عند وصول أي حوالة جديدة بحالة "waiting"
   الآلية: polling كل 20 ثانية + toast + orange badge + dropdown section
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── State object ─────────────────────────────────────────────────────────── */
const _tNotif = {
  POLL_MS: 20_000, // فترة الـ polling
  STORAGE_KEY: "fp_seen_transfer_ids", // مفتاح localStorage
  seenIds: new Set(
    JSON.parse(localStorage.getItem("fp_seen_transfer_ids") || "[]"),
  ),
  items: [], // الحوالات الجديدة غير المُشاهَدة
  pollTimer: null,
};

/* ── Init: يُشغَّل مرة واحدة بعد توفر token ─────────────────────────────── */
function _tNotifInit() {
  _tNotifObserveList(); // ابدأ المراقبة أولاً
  _tNotifPoll(); // أول poll فوري
  _tNotif.pollTimer = setInterval(_tNotifPoll, _tNotif.POLL_MS);
}

/* ── Poll: جلب الحوالات waiting ومقارنتها بالمُشاهَدة ──────────────────── */
async function _tNotifPoll() {
  try {
    const res = await fetch(`${API_URL}/transfers?status=waiting`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return;

    const json = await res.json();
    const transfers = Array.isArray(json.data) ? json.data : [];
    let hasNew = false;

    transfers.forEach((t) => {
      // تجاهل المُشاهَدة مسبقاً أو الموجودة بالقائمة
      if (_tNotif.seenIds.has(t.id)) return;
      if (_tNotif.items.find((p) => p.id === t.id)) return;

      _tNotif.items.unshift({
        id: t.id,
        sender: t.sender?.name ?? "—",
        amount: Number(t.amount_in_usd ?? 0).toFixed(2),
      });
      hasNew = true;
    });

    if (hasNew) {
      _tNotifUpdateBadge();
      _tNotifInjectSection();
      _tNotifShowToast(_tNotif.items[0]); // toast للأحدث واحدة
    }
  } catch (_) {
    /* فشل صامت */
  }
}

/* ── Orange badge on bell button ─────────────────────────────────────────── */
function _tNotifUpdateBadge() {
  const badge = document.getElementById("tnotif-bell-badge");
  if (!badge) return;

  if (_tNotif.items.length > 0) {
    badge.textContent =
      _tNotif.items.length > 9 ? "9+" : String(_tNotif.items.length);
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

/* ── Inject the transfer section into the bell dropdown ──────────────────── */
function _tNotifInjectSection() {
  const list = document.getElementById("notif-dropdown-list");
  if (!list || !_tNotif.items.length) return;

  // أزل القسم القديم + رسالة "لا يوجد" إن وُجدت
  list.querySelector(".tnotif-section-wrapper")?.remove();
  list.querySelector(".notif-empty")?.remove();

  const wrapper = document.createElement("div");
  wrapper.className = "tnotif-section-wrapper";
  wrapper.innerHTML = `
        <div class="tnotif-section-header">
            <span>
                <i class="fa-solid fa-arrow-right-to-bracket"></i>
                حوالات جديدة وصلت
            </span>
            <span class="tnotif-section-count">${_tNotif.items.length}</span>
        </div>
        ${_tNotif.items
          .map(
            (item) => `
            <div class="notif-item tnotif-item" onclick="_tNotifClickItem(${item.id})">
                <div class="notif-item-icon tnotif-icon">
                    <i class="fa-solid fa-paper-plane-top"></i>
                </div>
                <div class="notif-item-body">
                    <div class="notif-item-title">حوالة جديدة #${item.id}</div>
                    <div class="notif-item-sub">
                        من <b>${escapeHtml(item.sender)}</b>&nbsp;·&nbsp;$${item.amount}
                    </div>
                </div>
                <span class="notif-item-count tnotif-badge-new">جديد</span>
            </div>
        `,
          )
          .join("")}
    `;

  list.prepend(wrapper);
}

/* ── MutationObserver: re-inject after _notifUpdateBell replaces innerHTML ── */
/*    يضمن ظهور قسم الحوالات حتى بعد كل تحديث لرسائل الدردشة                 */
function _tNotifObserveList() {
  const list = document.getElementById("notif-dropdown-list");
  if (!list) {
    setTimeout(_tNotifObserveList, 400);
    return;
  }

  new MutationObserver((mutations) => {
    // إذا كانت التغييرات هي قسمنا نفسه → تجنّب حلقة لانهائية
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.classList?.contains("tnotif-section-wrapper")) return;
      }
    }
    // _notifUpdateBell أعاد رسم القائمة → أعد حقن قسم الحوالات
    if (_tNotif.items.length > 0) {
      _tNotifInjectSection();
    }
  }).observe(list, { childList: true });
}
/* =====================================================
   إدارة الصناديق الإضافية (Extra Boxes)
   ===================================================== */
let _currentOfficeIdForBoxes = null;

async function openExtraBoxesModal() {
  document.getElementById("extra-boxes-modal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  await loadExtraBoxes();
}

function closeExtraBoxesModal() {
  document.getElementById("extra-boxes-modal").classList.add("hidden");
  document.body.style.overflow = "";
}

// إغلاق المودال عند النقر في الخلفية
document.addEventListener("DOMContentLoaded", () => {
  const extraOverlay = document.getElementById("extra-boxes-modal");
  if (extraOverlay) {
    extraOverlay.addEventListener("click", function (e) {
      if (e.target === extraOverlay) closeExtraBoxesModal();
    });
  }
});

async function loadExtraBoxes() {
  const tbody = document.getElementById("extra-boxes-list");
  tbody.innerHTML =
    '<tr><td colspan="3" style="text-align:center; padding: 20px;">جاري التحميل... <i class="fa-solid fa-spinner fa-spin"></i></td></tr>';

  try {
    // التأكد من جلب office_id للمستخدم الحالي
    if (!_currentOfficeIdForBoxes) {
      const meRes = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meData = await meRes.json();
      _currentOfficeIdForBoxes = meData.user?.office_id;
    }

    const res = await fetch(`${API_URL}/extra-boxes`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const json = await res.json();
    const allBoxes = json.data || [];

    // فلترة الصناديق بحيث تظهر فقط التابعة لمكتب المدير الحالي
    const myBoxes = allBoxes.filter(
      (b) => b.office_id === _currentOfficeIdForBoxes,
    );

    if (myBoxes.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="3" style="text-align:center; color: var(--gray); padding: 20px;">لا توجد صناديق إضافية مسجلة حالياً.</td></tr>';
      return;
    }

    // ابحث عن هذا الجزء داخل دالة loadExtraBoxes في ملف admin.js وقم باستبداله
    // ابحث عن الجزء المسؤول عن رسم الجدول في loadExtraBoxes واستبدله بهذا:
    tbody.innerHTML = myBoxes
      .map(
        (box) => `
    <tr>
        <td style="font-weight:700; color: var(--dark);">${box.name}</td>
        <td style="font-weight:800; color: var(--primary);">${parseFloat(box.amount).toLocaleString()}</td>
        <td style="text-align: left;">
            <button class="osafe-btn" onclick="handleBoxTransaction(${box.id}, ${box.amount}, '${box.name}', 'deposit')" title="إيداع" style="background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; padding: 7px 10px;">
                <i class="fa-solid fa-plus-circle"></i> إيداع
            </button>
            
            <button class="osafe-btn" onclick="handleBoxTransaction(${box.id}, ${box.amount}, '${box.name}', 'withdraw')" title="سحب" style="background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; padding: 7px 10px;">
                <i class="fa-solid fa-minus-circle"></i> سحب
            </button>

            <button class="osafe-btn osafe-btn-tra" onclick="transferExtraBoxToOffice(${box.id}, ${box.amount}, '${box.name}')" title="نقل إلى خزنة المكتب">
                <i class="fa-solid fa-right-left"></i> نقل للخزنة
            </button>
            
            <button class="osafe-btn osafe-btn-wit" onclick="deleteExtraBox(${box.id})" title="حذف" style="padding: 7px 10px;">
                <i class="fa-solid fa-trash"></i>
            </button>
        </td>
    </tr>
`,
      )
      .join("");
  } catch (e) {
    console.error(e);
    tbody.innerHTML =
      '<tr><td colspan="3" style="text-align:center; color: var(--danger); padding: 20px;">حدث خطأ أثناء تحميل البيانات</td></tr>';
  }
}
/**
 * تعديل رصيد الصندوق الإضافي يدوياً
 */

/**
 * معالجة عمليات السحب والإيداع للصناديق الإضافية
 * @param {number} boxId - معرف الصندوق
 * @param {number} currentAmount - الرصيد الحالي
 * @param {string} boxName - اسم الصندوق
 * @param {string} type - 'deposit' (إيداع) أو 'withdraw' (سحب)
 */
async function handleBoxTransaction(boxId, currentAmount, boxName, type) {
  const actionText = type === "deposit" ? "إيداع في" : "سحب من";
  const amountStr = prompt(
    `أدخل المبلغ المراد ${actionText} صندوق (${boxName}):`,
  );

  if (amountStr === null) return;

  const amountValue = parseFloat(amountStr);
  if (isNaN(amountValue) || amountValue <= 0) {
    alert("يرجى إدخال مبلغ صحيح أكبر من الصفر.");
    return;
  }

  if (type === "withdraw" && amountValue > currentAmount) {
    alert("عذراً، الرصيد الحالي غير كافٍ لإتمام عملية السحب.");
    return;
  }

  const notes = prompt("ملاحظة على العملية (اختياري — اضغط موافق للتخطي):") ?? "";

  let newTotal;
  if (type === "deposit") {
    newTotal = currentAmount + amountValue;
  } else {
    newTotal = currentAmount - amountValue;
  }

  try {
    const res = await fetch(`${API_URL}/extra-boxes/${boxId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({ amount: newTotal, notes }),
    });

    if (res.ok) {
      showAdminToast(
        `تمت عملية ${type === "deposit" ? "الإيداع" : "السحب"} بنجاح.`,
      );
      loadExtraBoxes(); // تحديث القائمة
    } else {
      const err = await res.json();
      alert(err.message || "فشل في تحديث بيانات الصندوق.");
    }
  } catch (e) {
    console.error(e);
    alert("خطأ في الاتصال بالخادم.");
  }
}
async function editExtraBoxAmount(boxId, currentAmount, boxName) {
  const newAmountStr = prompt(`تعديل رصيد صندوق "${boxName}":`, currentAmount);

  // إذا ضغط المستخدم إلغاء أو لم يدخل شيئاً
  if (newAmountStr === null) return;

  const newAmount = parseFloat(newAmountStr);
  if (isNaN(newAmount) || newAmount < 0) {
    alert("يرجى إدخال مبلغ صحيح.");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/extra-boxes/${boxId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({ amount: newAmount }),
    });

    const data = await res.json();
    if (res.ok) {
      showAdminToast("تم تحديث مبلغ الصندوق بنجاح.");
      loadExtraBoxes(); // إعادة تحميل القائمة لتحديث الأرقام
    } else {
      alert(data.message || "فشل في تحديث المبلغ.");
    }
  } catch (e) {
    console.error(e);
    alert("خطأ في الاتصال بالخادم.");
  }
}
async function createExtraBox() {
  const nameInput = document.getElementById("eb-name");
  const amountInput = document.getElementById("eb-amount");
  const name = nameInput.value.trim();
  const amount = parseFloat(amountInput.value);

  if (!name || isNaN(amount) || amount < 0) {
    alert("يرجى إدخال اسم للصندوق ومبلغ صالح.");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/extra-boxes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        amount,
        office_id: _currentOfficeIdForBoxes,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      nameInput.value = "";
      amountInput.value = "";
      showAdminToast("تم إضافة الصندوق بنجاح!");
      loadExtraBoxes();
    } else {
      alert(data.message || "حدث خطأ أثناء الإضافة.");
    }
  } catch (e) {
    console.error(e);
    alert("خطأ في الاتصال بالخادم.");
  }
}

async function transferExtraBoxToOffice(boxId, maxAmount, boxName) {
  const amountStr = prompt(
    `كم تريد أن تنقل من صندوق "${boxName}" إلى خزنة المكتب؟\nالرصيد المتاح: ${parseFloat(maxAmount).toLocaleString()}`,
  );
  if (!amountStr) return;

  const transferAmount = parseFloat(amountStr);
  if (
    isNaN(transferAmount) ||
    transferAmount <= 0 ||
    transferAmount > maxAmount
  ) {
    alert("المبلغ المدخل غير صحيح أو يتجاوز الرصيد المتاح في الصندوق.");
    return;
  }

  try {
    // 1. خصم المبلغ من الصندوق الإضافي
    const newBoxAmount = maxAmount - transferAmount;
    const resBox = await fetch(`${API_URL}/extra-boxes/${boxId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount: newBoxAmount }),
    });

    if (!resBox.ok) {
      alert("فشل في تحديث رصيد الصندوق الإضافي.");
      return;
    }

    // 2. إيداع المبلغ المخصوم في خزنة المكتب
    const resOffice = await fetch(
      `${API_URL}/offices/${_currentOfficeIdForBoxes}/safe`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: transferAmount, type: "deposit" }),
      },
    );

    if (resOffice.ok) {
      showAdminToast("✅ تم نقل المبلغ إلى خزنة المكتب بنجاح.");
      loadExtraBoxes();

      // تحديث العرض الخلفي للصناديق الأساسية لتظهر القيمة الجديدة
      if (document.getElementById("safes-card").style.display !== "none") {
        showSafesSection();
      }
    } else {
      alert(
        "تنبيه: تم خصم المبلغ من الصندوق ولكن فشل إيداعه في الخزنة. يرجى مراجعة الدعم الفني.",
      );
    }
  } catch (e) {
    console.error(e);
    alert("حدث خطأ في الاتصال بالخادم أثناء النقل.");
  }
}

async function deleteExtraBox(boxId) {
  if (
    !confirm(
      "هل أنت متأكد من حذف هذا الصندوق؟\n(ملاحظة: سيتم حذفه مع الرصيد المتبقي فيه)",
    )
  )
    return;

  try {
    const res = await fetch(`${API_URL}/extra-boxes/${boxId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      showAdminToast("تم حذف الصندوق بنجاح.");
      loadExtraBoxes();
    } else {
      alert("فشل في حذف الصندوق.");
    }
  } catch (e) {
    alert("حدث خطأ في الاتصال بالخادم.");
  }
}
/* ── Toast notification (top-left corner) ────────────────────────────────── */
function _tNotifShowToast(item) {
  const container = document.getElementById("tnotif-toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "tnotif-toast";
  toast.innerHTML = `
        <div class="tnotif-toast-icon">
            <i class="fa-solid fa-paper-plane-top"></i>
        </div>
        <div class="tnotif-toast-body">
            <div class="tnotif-toast-title">
                <i class="fa-solid fa-circle-dot" style="font-size:8px;margin-left:4px;"></i>
                حوالة جديدة وصلت
            </div>
            <div class="tnotif-toast-sub">
                من <b>${escapeHtml(item.sender)}</b>&nbsp;·&nbsp;$${item.amount}
            </div>
        </div>
        <button class="tnotif-toast-close"
                onclick="event.stopPropagation(); this.closest('.tnotif-toast').remove();"
                title="إغلاق">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

  // النقر على جسم الـ toast → انتقال للحوالة
  toast.addEventListener("click", (e) => {
    if (e.target.closest(".tnotif-toast-close")) return;
    _tNotifClickItem(item.id);
    toast.remove();
  });

  container.prepend(toast);

  // إزالة تلقائية بعد 8 ثوان
  setTimeout(() => toast.classList.add("tnotif-toast-exit"), 7500);
  setTimeout(() => {
    toast.remove();
  }, 8200);
}

/* ── Click item: navigate to pending transfers & highlight the row ────────── */
function _tNotifClickItem(transferId) {
  toggleNotifDropdown(false);

  // الانتقال لقسم الحوالات المعلقة
  const pendingLink = document.querySelector(".sidebar nav li:first-child a");
  if (pendingLink) pendingLink.click();
  else showPendingTransfers();

  // تمييز الصف المعني بعد انتهاء تحميل الجدول
  setTimeout(() => {
    const row = [...document.querySelectorAll("#transfers-list tr")].find(
      (r) => r.querySelector("td")?.textContent?.trim() === `#${transferId}`,
    );
    if (row) {
      row.classList.add("tnotif-row-highlight");
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => row.classList.remove("tnotif-row-highlight"), 3200);
    }
  }, 800);

  _tNotifMarkSeen(transferId);
}

/* ── Mark a transfer as seen ─────────────────────────────────────────────── */
function _tNotifMarkSeen(transferId) {
  _tNotif.seenIds.add(transferId);
  _tNotif.items = _tNotif.items.filter((p) => p.id !== transferId);
  localStorage.setItem(
    _tNotif.STORAGE_KEY,
    JSON.stringify([..._tNotif.seenIds]),
  );
  _tNotifUpdateBadge();

  // أعد رسم القسم أو أزله إن فرغ
  document.querySelector(".tnotif-section-wrapper")?.remove();
  if (_tNotif.items.length > 0) _tNotifInjectSection();
}

/* ── Hook clearAllNotifications to also clear transfer notifications ───────
     نلتف حول الدالة الموجودة دون تعديل كودها                               */
const _tNotif_origClear = clearAllNotifications;
clearAllNotifications = function () {
  // سجّل جميع الحوالات المعلقة كمشاهَدة
  _tNotif.items.forEach((item) => _tNotif.seenIds.add(item.id));
  _tNotif.items = [];
  localStorage.setItem(
    _tNotif.STORAGE_KEY,
    JSON.stringify([..._tNotif.seenIds]),
  );

  // نظّف الـ UI الخاص بالحوالات
  document.querySelector(".tnotif-section-wrapper")?.remove();
  document.getElementById("tnotif-bell-badge")?.classList.add("hidden");

  // استدعاء الدالة الأصلية (رسائل الدردشة)
  _tNotif_origClear();
};

/* ── Bootstrap: wait for token then init ─────────────────────────────────── */
(function _tWaitForToken() {
  if (typeof token !== "undefined" && token) {
    _tNotifInit();
  } else {
    setTimeout(_tWaitForToken, 300);
  }
})();

/* =====================================================
   سجل الصناديق — Safe Logs Section
   ===================================================== */

// بيانات الصناديق الكاملة للفلترة
let _allSafeLogs = [];

function showSafeLogsSection() {
  hideAllCards();
  const card = document.getElementById("safe-logs-card");
  if (card) card.style.display = "block";
  loadSafeLogs();
}

async function loadSafeLogs() {
  const tbody = document.getElementById("safe-logs-list");
  const emptyEl = document.getElementById("safe-logs-empty");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--gray);">
    <div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
      <div style="width:32px;height:32px;border:3px solid #e5e7eb;border-top:3px solid var(--primary);
                  border-radius:50%;animation:spin 0.8s linear infinite;"></div>
      <span>جاري تحميل سجل الصناديق...</span>
    </div>
  </td></tr>`;
  emptyEl?.classList.add("hidden");

  try {
    const [safesRes, meRes, logsRes, tradingRes] = await Promise.all([
      fetch(`${API_URL}/safes`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/safe-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null),
      fetch(
        `${API_URL}/trading/report/details?date=${new Date().toISOString().split("T")[0]}`,
        { headers: { Authorization: `Bearer ${token}` } },
      ).catch(() => null),
    ]);

    const safesJson = await safesRes.json();
    const meData = await meRes.json();
    const myOfficeId = meData.user?.office_id;
    const mySafes = (safesJson.data || []).filter(
      (s) => s.office_id === myOfficeId,
    );

    const logs = [];

    // ── 1. سجل حقيقي من safe_action_logs (إيداع/سحب/تحويل) ──────
    let hasRealLogs = false;
    if (logsRes?.ok) {
      try {
        const logsJson = await logsRes.json();
        const rawLogs = logsJson.data || [];

        rawLogs.forEach((row) => {
          hasRealLogs = true;

          // ترجمة action_type → opType + opLabel
          const actionMap = {
            deposit: { opType: "deposit", opLabel: "إيداع" },
            withdraw: { opType: "withdraw", opLabel: "سحب" },
            transfer_to_office: {
              opType: "transfer_from_profit",
              opLabel: "تحويل → خزنة المكتب",
            },
            buy: { opType: "deposit", opLabel: "شراء (إيداع دولار)" },
            sell: { opType: "withdraw", opLabel: "بيع (سحب دولار)" },
          };
          const mapped = actionMap[row.action_type] || {
            opType: row.action_type,
            opLabel: row.action_type,
          };
          const isSyp = (row.currency || "").toUpperCase() === "SYP";
          const amount = parseFloat(row.amount || 0);

          logs.push({
            safeType: row.safe_type || "office_safe",
            opType: mapped.opType,
            opLabel: `${mapped.opLabel}${row.description ? ` — ${row.description}` : ""}`,
            balance: isSyp ? 0 : amount,
            balance_sy: isSyp ? amount : 0,
            cost: null,
            profit_trade: null,
            profit_main: null,
            balAfterUsd:
              row.balance_after != null ? parseFloat(row.balance_after) : null,
            balAfterSy:
              row.balance_sy_after != null
                ? parseFloat(row.balance_sy_after)
                : null,
            date: row.created_at
              ? new Date(row.created_at).toLocaleDateString("ar-SY", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—",
            extra:
              row.performed_by_name && row.performed_by_name !== "—"
                ? `بواسطة: ${row.performed_by_name}`
                : null,
          });
        });
      } catch (e) {
        /* تجاهل */
      }
    }

    // ── 2. لقطة حالية لكل صندوق (تُضاف دائماً في الأعلى) ─────────
    mySafes.forEach((safe) => {
      logs.push({
        safeType: safe.type,
        opType: "snapshot",
        opLabel: "الرصيد الحالي",
        balance: parseFloat(safe.balance || 0),
        balance_sy: parseFloat(safe.balance_sy || 0),
        cost: safe.cost !== undefined ? parseFloat(safe.cost) : null,
        profit_trade:
          safe.profit_trade !== undefined
            ? parseFloat(safe.profit_trade)
            : null,
        profit_main:
          safe.profit_main !== undefined ? parseFloat(safe.profit_main) : null,
        date: new Date().toLocaleDateString("ar-SY"),
      });
    });

    // ── 3. عمليات التداول اليومية (شراء/بيع) — fallback إذا لا يوجد safe_action_logs ──
    if (tradingRes) {
      try {
        const tradingJson = await tradingRes.json();
        const txList = tradingJson?.transactions || [];

        txList.forEach((tx) => {
          const isBuy = tx.type === "buy";
          logs.push({
            safeType: "trading",
            opType: isBuy ? "deposit" : "withdraw",
            opLabel: isBuy
              ? "شراء (إيداع دولار في التداول)"
              : "بيع (سحب دولار من التداول → خزنة المكتب)",
            balance: parseFloat(tx.amount || 0),
            balance_sy: isBuy
              ? -parseFloat(tx.amount || 0) * parseFloat(tx.price || 0)
              : parseFloat(tx.amount || 0) * parseFloat(tx.price || 0),
            cost: parseFloat(tx.cost_at_time || 0),
            profit_trade: isBuy ? null : parseFloat(tx.profit || 0),
            profit_main: null,
            date: tx.transaction_date
              ? new Date(tx.transaction_date).toLocaleDateString("ar-SY")
              : "—",
            extra: `${tx.user?.name || "—"} | سعر: ${parseFloat(tx.price || 0).toFixed(2)}`,
          });
        });
      } catch (e) {
        /* تجاهل */
      }
    }

    // حفظ للفلترة
    _allSafeLogs = logs;

    // رسم ملخص الأرصدة الحالية
    _renderSafeLogsSummary(mySafes);

    // رسم الجدول
    _renderSafeLogsTable(logs, emptyEl, tbody);
  } catch (err) {
    console.error("loadSafeLogs error:", err);
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--danger);padding:24px;">
      <i class="fa-solid fa-circle-exclamation" style="font-size:20px;margin-bottom:8px;display:block;"></i>
      خطأ في تحميل بيانات الصناديق
    </td></tr>`;
  }
}

function _renderSafeLogsSummary(safes) {
  const el = document.getElementById("safe-logs-summary");
  if (!el) return;

  const officeSafe = safes.find((s) => s.type === "office_safe") || {};
  const tradingSafe = safes.find((s) => s.type === "trading") || {};
  const profitSafe = safes.find((s) => s.type === "profit_safe") || {};

  const cards = [
    {
      icon: "fa-building-columns",
      bg: "#dbeafe",
      fg: "#1e40af",
      label: "خزنة المكتب (USD)",
      value: `$${parseFloat(officeSafe.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    },
    {
      icon: "fa-money-bill-wave",
      bg: "#fef3c7",
      fg: "#92400e",
      label: "خزنة المكتب (SYP)",
      value:
        parseFloat(officeSafe.balance_sy || 0).toLocaleString("en-US", {
          maximumFractionDigits: 0,
        }) + " ل.س",
    },
    {
      icon: "fa-chart-line",
      bg: "#d1fae5",
      fg: "#065f46",
      label: "صندوق التداول",
      value: `$${parseFloat(tradingSafe.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    },
    {
      icon: "fa-sack-dollar",
      bg: "#ede9fe",
      fg: "#5b21b6",
      label: "أرباح التداول",
      value: `${parseFloat(profitSafe.profit_trade || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })} ل.س`,
    },
    {
      icon: "fa-coins",
      bg: "#fce7f3",
      fg: "#9d174d",
      label: "الأرباح الرئيسية",
      value: `$${parseFloat(profitSafe.profit_main || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    },
  ];

  el.innerHTML = cards
    .map(
      (c) => `
    <div style="background:var(--white);border-radius:12px;padding:14px 16px;
                border:1.5px solid var(--border);border-right:4px solid ${c.fg};
                box-shadow:var(--shadow-sm,0 1px 4px rgba(0,0,0,.06));">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <div style="width:28px;height:28px;border-radius:8px;background:${c.bg};color:${c.fg};
                    display:flex;align-items:center;justify-content:center;font-size:12px;">
          <i class="fa-solid ${c.icon}"></i>
        </div>
        <span style="font-size:11px;font-weight:700;color:var(--gray);">${c.label}</span>
      </div>
      <div style="font-size:15px;font-weight:800;color:${c.fg};">${c.value}</div>
    </div>
  `,
    )
    .join("");
}

function _renderSafeLogsTable(logs, emptyEl, tbody) {
  if (!logs.length) {
    tbody.innerHTML = "";
    emptyEl?.classList.remove("hidden");
    return;
  }
  emptyEl?.classList.add("hidden");

  const typeLabels = {
    office_safe: "خزنة المكتب",
    office_main: "الصندوق الرئيسي",
    trading: "صندوق التداول",
    profit_safe: "صندوق الأرباح",
  };

  const opColors = {
    snapshot: { bg: "#dbeafe", fg: "#1e40af", icon: "fa-circle-info" },
    deposit: { bg: "#d1fae5", fg: "#065f46", icon: "fa-circle-arrow-down" },
    withdraw: { bg: "#fee2e2", fg: "#991b1b", icon: "fa-circle-arrow-up" },
    transfer_from_profit: {
      bg: "#ede9fe",
      fg: "#5b21b6",
      icon: "fa-right-left",
    },
    transfer_from_trading: {
      bg: "#fef3c7",
      fg: "#92400e",
      icon: "fa-chart-line",
    },
    transfer_from_main: { bg: "#fce7f3", fg: "#9d174d", icon: "fa-vault" },
    transfer_to_office: {
      bg: "#ede9fe",
      fg: "#5b21b6",
      icon: "fa-arrow-right-to-bracket",
    },
  };

  tbody.innerHTML = logs
    .map((log, i) => {
      const typeLabel = typeLabels[log.safeType] || log.safeType;
      const oc = opColors[log.opType] || {
        bg: "#f3f4f6",
        fg: "#374151",
        icon: "fa-circle",
      };

      // ── badge نوع الصندوق ───────────────────────────────────────
      const safeBadgeColors = {
        office_safe: { bg: "#dbeafe", fg: "#1e40af" },
        office_main: { bg: "#fef3c7", fg: "#92400e" },
        trading: { bg: "#d1fae5", fg: "#065f46" },
        profit_safe: { bg: "#ede9fe", fg: "#5b21b6" },
      };
      const sbc = safeBadgeColors[log.safeType] || {
        bg: "#f3f4f6",
        fg: "#374151",
      };

      const typeBadge = `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;
        border-radius:20px;font-size:11px;font-weight:700;background:${sbc.bg};color:${sbc.fg};">
        ${typeLabel}</span>`;

      const opBadge = `<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;
        border-radius:20px;font-size:11px;font-weight:700;background:${oc.bg};color:${oc.fg};white-space:nowrap;">
        <i class="fa-solid ${oc.icon}" style="font-size:10px;"></i>
        ${log.opLabel}</span>`;

      // ── مبلغ العملية ────────────────────────────────────────────
      let amtCell = "—";
      if (log.balance > 0 && log.balance_sy === 0) {
        // عملية دولار
        const sign = log.opType === "withdraw" ? "−" : "+";
        const color = log.opType === "withdraw" ? "#dc2626" : "#059669";
        amtCell = `<span style="font-weight:800;color:${color};">${log.opType === "snapshot" ? "" : sign}$${log.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>`;
      } else if (log.balance_sy !== 0 && log.balance === 0) {
        // عملية ليرة
        const sign =
          log.balance_sy < 0 || log.opType === "withdraw" ? "−" : "+";
        const color =
          log.opType === "withdraw" || log.balance_sy < 0
            ? "#dc2626"
            : "#059669";
        amtCell = `<span style="font-weight:800;color:${color};">${log.opType === "snapshot" ? "" : sign}${Math.abs(log.balance_sy).toLocaleString("en-US", { maximumFractionDigits: 0 })} ل.س</span>`;
      } else if (log.balance > 0 || log.balance_sy > 0) {
        // لقطة: اعرض كلاهما
        const parts = [];
        if (log.balance > 0)
          parts.push(
            `<span style="font-weight:800;color:var(--primary);">$${log.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>`,
          );
        if (log.balance_sy > 0)
          parts.push(
            `<span style="font-weight:700;color:#ea580c;">${log.balance_sy.toLocaleString("en-US", { maximumFractionDigits: 0 })} ل.س</span>`,
          );
        amtCell = parts.join("<br>");
      }

      // ── الرصيد بعد العملية ──────────────────────────────────────
      let afterCell = "—";
      if (log.balAfterUsd != null && log.balAfterSy != null) {
        afterCell =
          `<span style="color:var(--primary);font-weight:700;">$${parseFloat(log.balAfterUsd).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>` +
          `<br><span style="color:#ea580c;font-size:11px;">${parseFloat(log.balAfterSy).toLocaleString("en-US", { maximumFractionDigits: 0 })} ل.س</span>`;
      } else if (log.balAfterUsd != null) {
        afterCell = `<span style="color:var(--primary);font-weight:700;">$${parseFloat(log.balAfterUsd).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>`;
      } else if (log.balAfterSy != null) {
        afterCell = `<span style="color:#ea580c;font-weight:700;">${parseFloat(log.balAfterSy).toLocaleString("en-US", { maximumFractionDigits: 0 })} ل.س</span>`;
      }

      // ── خلايا الأرباح والتكلفة ──────────────────────────────────
      const costCell =
        log.cost !== null
          ? `<span style="color:#64748b;">${log.cost.toFixed(4)}</span>`
          : "—";
      const ptCell =
        log.profit_trade !== null
          ? `<span style="color:#15803d;font-weight:700;">${parseFloat(log.profit_trade).toLocaleString("en-US", { maximumFractionDigits: 0 })} ل.س</span>`
          : "—";
      const pmCell =
        log.profit_main !== null
          ? `<span style="color:#1d4ed8;font-weight:700;">$${parseFloat(log.profit_main).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>`
          : "—";

      return `
    <tr>
      <td style="color:var(--gray);font-size:12px;">${i + 1}</td>
      <td>${typeBadge}</td>
      <td>${opBadge}</td>
      <td>${amtCell}</td>
      <td>${afterCell}</td>
      <td>${costCell}</td>
      <td>${ptCell}</td>
      <td>${pmCell}</td>
      <td style="font-size:11px;color:var(--gray);">${log.date || "—"}${log.extra ? `<br><span style="font-size:10px;color:#9ca3af;">${log.extra}</span>` : ""}</td>
    </tr>`;
    })
    .join("");
}

function filterSafeLogs() {
  const q = (
    document.getElementById("safe-logs-search")?.value || ""
  ).toLowerCase();
  const type = document.getElementById("safe-logs-type-filter")?.value || "";

  const filtered = _allSafeLogs.filter((log) => {
    if (type && log.safeType !== type) return false;
    if (q) {
      const text = `${log.safeType} ${log.opLabel} ${log.opType}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  const tbody = document.getElementById("safe-logs-list");
  const emptyEl = document.getElementById("safe-logs-empty");
  _renderSafeLogsTable(filtered, emptyEl, tbody);
}

<<<<<<< HEAD
/* =====================================================
   تقرير سجل حركات الصناديق المتوافق مع SafeLogController
   ===================================================== */
let SAFES_REPORT_DATA = [];

// تهيئة التقرير بالشهر الحالي
function initSafesReport() {
  const monthInput = document.getElementById("safes-report-month");
  if (monthInput && !monthInput.value) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    monthInput.value = `${yyyy}-${mm}`;
    loadSafesReport();
  }
}

// جلب البيانات من SafeLogController باستخدام date_from و date_to
async function loadSafesReport() {
  const monthVal = document.getElementById("safes-report-month")?.value;
  const tbody = document.getElementById("safes-report-tbody");

  if (!monthVal || !tbody) return;

  // استخراج أول وآخر يوم من الشهر المختار
  const [year, month] = monthVal.split("-");
  const dateFrom = `${year}-${month}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const dateTo = `${year}-${month}-${lastDay}`;

  tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:30px;color:var(--gray);">
        <div style="width:28px;height:28px;border:3px solid #e5e7eb;border-top:3px solid var(--primary);
                    border-radius:50%;animation:acct-spin 0.8s linear infinite;margin:0 auto 10px;"></div>
        جاري جلب السجلات...
    </td></tr>`;

  try {
    // نرسل التواريخ للمسار الموجود في الباك إند
    const res = await fetch(
      `${API_URL}/safe-logs?date_from=${dateFrom}&date_to=${dateTo}&per_page=500`,
      {
        headers: getHeaders(),
      },
    );

    if (!res.ok) throw new Error("فشل في جلب البيانات");

    const json = await res.json();
    SAFES_REPORT_DATA = json.data || [];
    _renderSafesReport(SAFES_REPORT_DATA);
  } catch (err) {
    console.error("loadSafesReport error:", err);
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--danger); padding:20px;">
            <i class="fa-solid fa-circle-exclamation" style="font-size:24px; display:block; margin-bottom:8px;"></i>
            خطأ في الاتصال بالخادم أو السجل غير متوفر
        </td></tr>`;
  }
}

// رسم الجدول بالبيانات المجلوبة
function _renderSafesReport(data) {
  const tbody = document.getElementById("safes-report-tbody");
  if (!tbody) return;

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:30px; color:var(--gray);">
            <i class="fa-solid fa-folder-open" style="font-size:24px; margin-bottom:10px; opacity:0.5; display:block;"></i>
            لا توجد حركات صناديق مسجلة في هذا الشهر
        </td></tr>`;
    return;
  }

  // قواميس لترجمة الحالات والصناديق لتظهر بشكل احترافي
  const safeNames = {
    office_safe: { label: "خزنة المكتب", color: "#1e40af", bg: "#dbeafe" },
    trading: { label: "صندوق التداول", color: "#92400e", bg: "#fef3c7" },
    profit_safe: { label: "صندوق الأرباح", color: "#5b21b6", bg: "#ede9fe" },
    office_main: { label: "الصندوق الرئيسي", color: "#065f46", bg: "#d1fae5" },
  };

  const actionNames = {
    deposit: "إيداع",
    withdraw: "سحب",
    transfer_to_office: "تحويل للمكتب",
    buy: "شراء",
    sell: "بيع",
    snapshot: "لقطة",
  };

  tbody.innerHTML = data
    .map((log, i) => {
      const fmtN = (n) =>
        parseFloat(n ?? 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
        });
      const dateStr = log.created_at
        ? new Date(log.created_at).toLocaleString("ar-SY", {
            dateStyle: "short",
            timeStyle: "short",
          })
        : "—";

      const safeInfo = safeNames[log.safe_type] || {
        label: log.safe_type,
        color: "var(--primary)",
        bg: "var(--primary-bg)",
      };
      const actionLabel = actionNames[log.action_type] || log.action_type;

      // تلوين المبلغ بناءً على نوع الحركة
      const isPositive = ["deposit", "sell"].includes(log.action_type);
      const amountColor = isPositive ? "var(--success)" : "var(--danger)";
      const amountSign = isPositive ? "+" : "-";

      // دمج الأرصدة لعرضها بطريقة ذكية
      let balanceHtml = "";
      if (log.currency === "USD" || log.currency === "usd") {
        balanceHtml = `<span style="color:#1e40af; font-weight:700;">$${fmtN(log.balance_after)}</span>`;
      } else {
        balanceHtml = `<span style="color:#ea580c; font-weight:700;">${fmtN(log.balance_sy_after)} ل.س</span>`;
      }

      return `
        <tr style="background:${i % 2 === 0 ? "var(--white)" : "#fafafa"}">
            <td>${i + 1}</td>
            <td>
                <span class="badge" style="background:${safeInfo.bg}; color:${safeInfo.color}; border:none;">
                    ${safeInfo.label}
                </span>
            </td>
            <td style="font-weight:600;">${actionLabel}</td>
            <td style="color:${amountColor}; font-weight:700; direction:ltr;">${amountSign}${fmtN(log.amount)}</td>
            <td style="font-weight:600;">${log.currency}</td>
            <td>${balanceHtml}</td>
            <td style="font-size:11px; color:var(--gray); max-width:180px;">${log.description || "—"}</td>
            <td style="font-size:12px; font-weight:600;">${log.performed_by_name || "—"}</td>
            <td style="color:var(--gray); font-size:12px;">${dateStr}</td>
        </tr>`;
    })
    .join("");
}

// تصدير الجدول إلى ملف CSV
function exportSafesReportCSV() {
  if (!SAFES_REPORT_DATA || SAFES_REPORT_DATA.length === 0) {
    showToast("لا توجد بيانات للتصدير في هذا الشهر", "error");
    return;
  }

  const month = document.getElementById("safes-report-month")?.value || "all";
  const headers = [
    "#",
    "نوع الصندوق",
    "نوع الحركة",
    "العملة",
    "المبلغ",
    "رصيد دولار بعد",
    "رصيد ليرة بعد",
    "الوصف",
    "المنفذ",
    "التاريخ",
  ];

  const actionNames = {
    deposit: "إيداع",
    withdraw: "سحب",
    transfer_to_office: "تحويل للمكتب",
    buy: "شراء",
    sell: "بيع",
    snapshot: "لقطة",
  };
  const safeNames = {
    office_safe: "خزنة المكتب",
    trading: "صندوق التداول",
    profit_safe: "صندوق الأرباح",
    office_main: "الرئيسي",
  };

  const rows = SAFES_REPORT_DATA.map((log, i) => [
    i + 1,
    safeNames[log.safe_type] || log.safe_type,
    actionNames[log.action_type] || log.action_type,
    log.currency,
    parseFloat(log.amount || 0).toFixed(2),
    parseFloat(log.balance_after || 0).toFixed(2),
    parseFloat(log.balance_sy_after || 0).toFixed(2),
    log.description || "",
    log.performed_by_name || "",
    log.created_at ? new Date(log.created_at).toLocaleString("ar-SY") : "",
  ]);

  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${v}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `safes_logs_${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("تم تصدير سجل الصناديق بنجاح ✓", "success");
}

// طباعة التقرير
function printSafesReport() {
  window.print();
}
/**
 * إغلاق مودال الحوالات المؤرشفة
 */
function closeArchivedModal() {
  const modal = document.getElementById("archived-transfers-modal");
  if (modal) modal.classList.add("hidden");
  document.body.style.overflow = "";
}

/**
 * إغلاق مودال الـ snapshot
 */
function closeSnapshotModal() {
  const modal = document.getElementById("closing-snapshot-modal");
  if (modal) modal.classList.add("hidden");
  document.body.style.overflow = "";
}
=======
/* ═══════════════════════════════════════════════════════
   الخزنة الإلكترونية — شام كاش + USDT (Admin)
   ═══════════════════════════════════════════════════════ */

/** تبديل التبويب النشط */
function eSwitchTab(tab, btn) {
  // إخفاء كل البانلات
  ["syp","usd","usdt"].forEach(t => {
    const panel = document.getElementById(`epanel-${t}`);
    const tabBtn = document.getElementById(`etab-${t}`);
    if (panel) panel.style.display = "none";
    if (tabBtn) tabBtn.classList.remove("esafe-tab-active");
  });
  // إظهار المطلوب
  const active = document.getElementById(`epanel-${tab}`);
  if (active) active.style.display = "block";
  if (btn) btn.classList.add("esafe-tab-active");
}

/** تحديث أرقام الأرصدة في البطاقة */
async function refreshElectronicSafe() {
  const icon = document.getElementById("esafe-refresh-icon");
  if (icon) icon.classList.add("fa-spin");
  try {
    const res  = await fetch(`${API_URL}/electronic-safe/balances`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const json = await res.json();
    if (!res.ok) { showAdminToast("تعذر التحديث", "danger"); return; }
    const d = json.data || {};

    const sypEl  = document.getElementById("esafe-syp-display");
    const usdEl  = document.getElementById("esafe-usd-display");
    const usdtEl = document.getElementById("esafe-usdt-display");

    if (sypEl)  sypEl.innerHTML  = parseFloat(d.syp_sham_cash||0).toLocaleString("en-US",{maximumFractionDigits:0}) + ' <span class="esafe-unit">ل.س</span>';
    if (usdEl)  usdEl.innerHTML  = parseFloat(d.usd_sham_cash||0).toLocaleString("en-US",{minimumFractionDigits:2}) + ' <span class="esafe-unit">$</span>';
    if (usdtEl) usdtEl.innerHTML = parseFloat(d.usdt||0).toLocaleString("en-US",{minimumFractionDigits:2}) + ' <span class="esafe-unit">USDT</span>';

    showAdminToast("✅ تم تحديث الأرصدة");
  } catch (e) {
    showAdminToast("خطأ في الاتصال", "danger");
  } finally {
    if (icon) icon.classList.remove("fa-spin");
  }
}

/**
 * إيداع أو سحب في الخزنة الإلكترونية
 * currencyType : syp_sham_cash | usd_sham_cash | usdt
 * actionType   : deposit | withdraw
 */
async function eSafeAdjust(actionType, currencyType, amountInputId, notesInputId) {
  const amountInput = document.getElementById(amountInputId);
  const notesInput  = document.getElementById(notesInputId);
  const amount = parseFloat(amountInput?.value);

  if (!amount || amount <= 0) {
    showAdminToast("يرجى إدخال مبلغ صحيح", "danger"); return;
  }

  const notes = notesInput?.value.trim() || "";

  // إيجاد الزر الصحيح لتعطيله
  const panel = amountInput.closest(".esafe-panel");
  const btn   = panel?.querySelector(actionType === "deposit" ? ".osafe-btn-dep" : ".osafe-btn-wit");
  const orig  = btn?.innerHTML;
  if (btn) { btn.disabled = true; btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`; }

  try {
    // نستخدم endpoint buy للإيداع وsell للسحب — كلاهما يغير الرصيد فقط
    const endpoint = actionType === "deposit" ? "buy" : "sell";
    const res = await fetch(`${API_URL}/electronic-safe/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        currency_type:   currencyType,
        amount:          amount,
        commission_rate: 0,
        exchange_rate:   1,
        note:            notes || `${actionType === "deposit" ? "إيداع" : "سحب"} يدوي — ${currencyType} (admin)`,
      }),
    });
    const data = await res.json();

    if (res.ok) {
      amountInput.value = "";
      if (notesInput) notesInput.value = "";
      // تحديث الرصيد المعروض فوراً
      await refreshElectronicSafe();
      const labels = { syp_sham_cash: "ليرة شام كاش", usd_sham_cash: "دولار شام كاش", usdt: "USDT" };
      showAdminToast(`✅ ${actionType === "deposit" ? "تم الإيداع" : "تم السحب"} (${labels[currencyType]}) بنجاح`);
    } else {
      showAdminToast(data.message || "حدث خطأ في العملية", "danger");
    }
  } catch (e) {
    showAdminToast("تعذر الاتصال بالخادم", "danger");
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = orig; }
  }
}
>>>>>>> 8bdaac5f219277b9c1a1fe4c7cba90178b334db1
