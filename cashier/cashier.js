const API_URL = "https://flashpay-back-1.onrender.com/api";
let token = null;

/* ============================= */
/*            AUTH              */
/* ============================= */
async function checkAuth() {
  const token = localStorage.getItem("auth_token"); // ✅ مفتاح موحّد

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

    const ALLOWED_ROLES = ["cashier"]; // ✅ صلاحية هذا الـ dashboard

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

/* ============================= */
/*      LOAD READY TRANSFERS    */
/* ============================= */

async function loadNewTransfers() {
  const tbody = document.getElementById("new-transfers-list");
  tbody.innerHTML = `<tr><td colspan="12" class="loading-row"><div class="loading-spinner"></div> جاري التحميل...</td></tr>`;

  try {
    const res = await fetch(`${API_URL}/transfers?status=ready`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const json = await res.json();
    tbody.innerHTML = "";

    if (!json.data?.length) {
      document.getElementById("transfers-count").textContent = "0";
      tbody.innerHTML = `<tr><td colspan="12"><div class="empty-state"><i class="fa-solid fa-inbox"></i><p>لا توجد حوالات جاهزة للتسليم حالياً</p></div></td></tr>`;
      return;
    }

    document.getElementById("transfers-count").textContent = json.data.length;

    json.data.forEach((transfer) => {
      const amountUsd = Number(transfer.amount_in_usd ?? 0);
      const currencyPrice = Number(transfer.currency?.price ?? 1);
      const currencyCode = transfer.currency?.code ?? "USD";
      const deliveryPrice = currencyPrice > 0 ? amountUsd / currencyPrice : 0;
      const sendAmount = Number(transfer.amount ?? 0);
      const sendCurrency =
        transfer.send_currency?.code ?? transfer.sendCurrency?.code ?? "—";
      const fee = Number(transfer.fee ?? 0);
      const senderPhone = transfer.sender?.phone ?? "";
      const date = transfer.created_at
        ? new Date(transfer.created_at).toLocaleString("ar-SY")
        : "—";
      const tracking = transfer.tracking_code ?? "#" + transfer.id;
      const isAgent = transfer.sender?.role === "agent";

      const destText = transfer.destination_office_id
        ? `<i class="fa-solid fa-building" style="font-size:11px;"></i> ${transfer.destination_office?.name ?? `مكتب #${transfer.destination_office_id}`}`
        : `<i class="fa-solid fa-globe" style="font-size:11px;"></i> ${transfer.destination_city ?? "—"}`;

      const notes = transfer.notes
        ? `<span style="font-size:11px;max-width:110px;display:inline-block;word-break:break-word;">${transfer.notes}</span>`
        : `<span style="opacity:.5;">—</span>`;

      // الصف يأخذ class مختلف حسب نوع المرسل
      const rowClass = isAgent ? "row-agent" : "row-customer";

      // badge النوع
      const typeBadge = isAgent
        ? `<span class="transfer-type-badge badge-agent"><i class="fa-solid fa-user-tie"></i> مندوب</span>`
        : `<span class="transfer-type-badge badge-customer"><i class="fa-solid fa-user"></i> زبون</span>`;

      tbody.innerHTML += `
        <tr class="${rowClass}">
          <td>
            <span class="transfer-id">${tracking}</span>
            <div style="font-size:10px;opacity:.6;margin-top:2px;">#${transfer.id}</div>
          </td>
          <td style="text-align:center;">${typeBadge}</td>
          <td>
            <div style="font-weight:700;">${transfer.sender?.name ?? "—"}</div>
            <div style="font-size:11px;opacity:.7;direction:ltr;">${senderPhone}</div>
          </td>
          <td>
            <div style="font-weight:700;">${transfer.receiver_name ?? "—"}</div>
            <div style="font-size:11px;opacity:.7;direction:ltr;">${transfer.receiver_phone ?? ""}</div>
          </td>
          <td><span class="amount-cell">$${amountUsd.toFixed(2)}</span></td>
          <td style="font-size:12px;">${sendAmount.toFixed(2)} ${sendCurrency}</td>
          <td><span class="delivery-price">${deliveryPrice.toFixed(2)} ${currencyCode}</span></td>
          <td style="font-weight:700;color:var(--success);">
            ${fee > 0 ? "$" + fee.toFixed(2) : '<span style="opacity:.4;">—</span>'}
          </td>
          <td style="font-size:12px;">${destText}</td>
          <td>${notes}</td>
          <td style="font-size:11px;opacity:.7;white-space:nowrap;">${date}</td>
          <td>
            <div class="upload-wrapper">
              <label class="custom-file-upload">
                <input type="file"
                       id="id_image_${transfer.id}"
                       accept="image/*"
                       onchange="previewImage(event, ${transfer.id})">
                <i class="fa-solid fa-id-card"></i>
                اختيار صورة الهوية
              </label>
              <span class="file-name" id="file_name_${transfer.id}">لم يتم اختيار ملف</span>
              <img id="preview_${transfer.id}" class="preview-img hidden">
            </div>
            <button id="btn_${transfer.id}"
                    onclick="acceptTransfer(${transfer.id})"
                    class="btn-confirm" style="margin-top:6px;">
              <i class="fa-solid fa-circle-check"></i> تأكيد التسليم
            </button>
          </td>
        </tr>`;
    });
  } catch (error) {
    console.error("Error loading transfers:", error);
    tbody.innerHTML = `<tr><td colspan="12" class="loading-row" style="color:var(--danger);">خطأ في الاتصال بالسيرفر</td></tr>`;
  }
}

/* ============================= */
/*        IMAGE PREVIEW         */
/* ============================= */

function previewImage(event, id) {
  const file = event.target.files[0];
  if (!file) return;

  document.getElementById(`file_name_${id}`).textContent = file.name;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = document.getElementById(`preview_${id}`);
    img.src = e.target.result;
    img.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

/* ============================= */
/*      COMPLETE TRANSFER       */
/* ============================= */

async function acceptTransfer(transferId) {
  const fileInput = document.getElementById(`id_image_${transferId}`);
  const button = document.getElementById(`btn_${transferId}`);
  const file = fileInput.files[0];

  if (!file) {
    alert("يرجى اختيار صورة الهوية أولاً");
    return;
  }

  button.disabled = true;
  button.innerHTML = `<div class="loading-spinner" style="width:16px;height:16px;border-width:2px;margin:0;display:inline-block;"></div> جاري المعالجة...`;

  const formData = new FormData();
  formData.append("_method", "PATCH");
  formData.append("status", "completed");
  formData.append("receiver_id_image", file);

  try {
    const res = await fetch(
      `${API_URL}/transfers/${transferId}/update-status`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      },
    );

    const data = await res.json();

    if (res.ok) {
      alert("✅ تم تسليم الحوالة بنجاح");
      loadNewTransfers();
      if (data && data.data) {
        printTransferReceipt(data.data);
      } else {
        console.error("بيانات الحوالة غير مكتملة في رد السيرفر:", data);
      }
    } else {
      alert(data.message || "فشل التحديث");
      button.disabled = false;
      button.innerHTML = `<i class="fa-solid fa-circle-check"></i> تأكيد التسليم`;
    }
  } catch (error) {
    console.error(error);
    alert("خطأ في الاتصال");
    button.disabled = false;
    button.innerHTML = `<i class="fa-solid fa-circle-check"></i> تأكيد التسليم`;
  }
}

/* ============================= */
/*           LOGOUT              */
/* ============================= */

async function handleLogout() {
  await fetch(`${API_URL}/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  localStorage.removeItem("auth_token");
  window.location.href = "../index.html";
}

/* ============================= */
/*       NAVIGATION & UI        */
/* ============================= */

function setActive(element) {
  document
    .querySelectorAll(".sidebar nav ul li")
    .forEach((li) => li.classList.remove("active"));
  element.parentElement.classList.add("active");
}

function showTransfersSection() {
  document.querySelectorAll(".section").forEach((s) => (s.style.display = "none"));
  document.getElementById("section-transfers").style.display = "block";

  document.getElementById("page-heading").textContent = "الحوالات";
  document.querySelector(".page-sub").textContent = "جاهزة للتسليم";
  document.querySelector(".page-icon").innerHTML =
    '<i class="fa-solid fa-money-bill-transfer"></i>';

  loadNewTransfers();
}

function showSafesSection() {
  document.querySelectorAll(".section").forEach((s) => (s.style.display = "none"));
  document.getElementById("section-safes").style.display = "block";

  document.getElementById("page-heading").textContent = "الصناديق";
  document.querySelector(".page-sub").textContent = "صناديق التداول والصناديق الإضافية";
  document.querySelector(".page-icon").innerHTML =
    '<i class="fa-solid fa-vault"></i>';

  loadTradingSafes();
  loadCashierExtraBoxes();
}

function showProfitsSection() {
  document.querySelectorAll(".section").forEach((s) => (s.style.display = "none"));
  document.getElementById("section-profits").style.display = "block";

  document.getElementById("page-heading").textContent = "أرباح التداول";
  document.querySelector(".page-sub").textContent = "تقرير يومي";
  document.querySelector(".page-icon").innerHTML =
    '<i class="fa-solid fa-chart-line"></i>';
}

function showInternalSection() {
  document.querySelectorAll(".section").forEach((s) => (s.style.display = "none"));
  document.getElementById("section-internal").style.display = "block";

  document.getElementById("page-heading").textContent = "الحوالات الداخلية";
  document.querySelector(".page-sub").textContent = "حوالات داخل المنطقة";
  document.querySelector(".page-icon").innerHTML =
    '<i class="fa-solid fa-right-left"></i>';

  loadInternalTransfers();
  updateInternalSummary();
  updateFeeRadio();
}

/* ============================= */
/*        TRADING SAFES         */
/* ============================= */

/* ── بيانات التداول للدايلوج ── */
let _tradingDialogData = null; // { currencyId, officeId, balance, cost, currency }

async function loadTradingSafes() {
  const container = document.getElementById("safes-container");
  container.innerHTML = `<div class="safe-loading-placeholder" style="grid-column:1/-1;"><div class="loading-spinner" style="margin:0 auto 10px;"></div> جاري التحميل...</div>`;

  try {
    const [safesRes, meRes] = await Promise.all([
      fetch(`${API_URL}/safes`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }),
      fetch(`${API_URL}/me`,    { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }),
    ]);
    const safesJson = await safesRes.json();
    const meData    = await meRes.json();
    const myOfficeId = meData.user?.office_id;
    if (!_cashierOfficeId) _cashierOfficeId = myOfficeId;
    const mySafes   = (safesJson.data || []).filter((s) => s.office_id === myOfficeId);

    if (!mySafes.length) {
      container.innerHTML = `<div class="safe-loading-placeholder" style="grid-column:1/-1;color:var(--gray);">لا توجد صناديق متاحة حالياً</div>`;
      return;
    }

    const officeSafe  = mySafes.find((s) => s.type === "office_safe");
    const mainSafe    = mySafes.find((s) => s.type === "office_main");
    const tradingSafe = mySafes.find((s) => s.type === "trading");
    const profitSafe  = mySafes.find((s) => s.type === "profit_safe") || { profit_trade: 0, profit_main: 0 };

    const total = (parseFloat(officeSafe?.balance||0) + parseFloat(mainSafe?.balance||0) + parseFloat(tradingSafe?.balance||0))
                  .toLocaleString("en-US", { minimumFractionDigits: 2 });
    const totalEl = document.getElementById("stat-safes-total");
    if (totalEl) totalEl.textContent = "$" + total;

    // حفظ بيانات صندوق التداول للدايلوج
    if (tradingSafe) {
      _tradingDialogData = {
        currencyId: tradingSafe.currency_id,
        officeId:   tradingSafe.office_id,
        balance:    parseFloat(tradingSafe.balance),
        cost:       tradingSafe.cost != null ? parseFloat(tradingSafe.cost) : null,
        currency:   tradingSafe.currency || "USD",
      };
    }

    /* ═══════════════════════════════════════════
       بناء الشبكة الجديدة
       الصف 1: خزنة المكتب | الصندوق الرئيسي | صندوق التداول | صندوق الأرباح
       الصف 2: شام كاش | USDT | + صناديق إضافية
    ═══════════════════════════════════════════ */

    // ── الصف الأول ──
    const officeCard = officeSafe ? `
    <div class="nsafe-card nsafe-card-office">
      <div class="nsafe-header">
        <div class="nsafe-icon"><i class="fa-solid fa-building-columns"></i></div>
        <div>
          <div class="nsafe-title">خزنة المكتب</div>
          <div class="nsafe-subtitle">USD + SYP</div>
        </div>
      </div>
      <div class="nsafe-balance">$${parseFloat(officeSafe.balance).toLocaleString("en-US",{minimumFractionDigits:2})}</div>
      <div class="nsafe-currency">USD</div>
      ${parseFloat(officeSafe.balance_sy||0) > 0 ? `
      <div class="nsafe-sub-balance">
        <i class="fa-solid fa-coins" style="color:#ea580c;font-size:12px;"></i>
        <span>${parseFloat(officeSafe.balance_sy).toLocaleString("en-US",{maximumFractionDigits:0})} SYP</span>
      </div>` : ""}
    </div>` : "";

    const mainCard = mainSafe ? `
    <div class="nsafe-card nsafe-card-main">
      <div class="nsafe-header">
        <div class="nsafe-icon"><i class="fa-solid fa-vault"></i></div>
        <div>
          <div class="nsafe-title">الصندوق الرئيسي</div>
          <div class="nsafe-subtitle">USD</div>
        </div>
      </div>
      <div class="nsafe-balance">$${parseFloat(mainSafe.balance).toLocaleString("en-US",{minimumFractionDigits:2})}</div>
      <div class="nsafe-currency">USD</div>
    </div>` : "";

    const tradingCard = tradingSafe ? `
    <div class="nsafe-card nsafe-card-trading nsafe-clickable" onclick="openTradingDialog()">
      <div class="nsafe-header">
        <div class="nsafe-icon"><i class="fa-solid fa-chart-line"></i></div>
        <div>
          <div class="nsafe-title">صندوق التداول</div>
          <div class="nsafe-subtitle">${tradingSafe.currency||"USD"}</div>
        </div>
      </div>
      <div class="nsafe-balance">${parseFloat(tradingSafe.balance).toLocaleString("en-US",{minimumFractionDigits:2})}</div>
      <div class="nsafe-currency">${tradingSafe.currency||"USD"}</div>
      ${tradingSafe.cost != null ? `<div class="nsafe-sub-balance" style="color:#92400e;background:#fffbeb;border:1px solid #fde68a;"><i class="fa-solid fa-scale-balanced" style="color:#f59e0b;font-size:11px;"></i> تكلفة: ${parseFloat(tradingSafe.cost).toFixed(2)}</div>` : ""}
      <div class="nsafe-trade-badge"><i class="fa-solid fa-sliders"></i> اضغط للتداول</div>
      <div class="nsafe-click-hint"><i class="fa-solid fa-arrow-pointer"></i> بيع / شراء</div>
    </div>` : "";

    const profitCard = `
    <div class="nsafe-card nsafe-card-profit">
      <div class="nsafe-header">
        <div class="nsafe-icon"><i class="fa-solid fa-sack-dollar"></i></div>
        <div>
          <div class="nsafe-title">صندوق الأرباح</div>
          <div class="nsafe-subtitle">USD + SYP</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">
        <div style="background:#f5f3ff;border-radius:8px;padding:8px 10px;">
          <div style="font-size:10px;color:#7c3aed;font-weight:700;margin-bottom:2px;">أرباح التداول</div>
          <div style="font-size:15px;font-weight:800;color:#059669;direction:ltr;">${parseFloat(profitSafe.profit_trade||0).toLocaleString("en-US",{maximumFractionDigits:0})} SYP</div>
        </div>
        <div style="background:#eff6ff;border-radius:8px;padding:8px 10px;">
          <div style="font-size:10px;color:#2563eb;font-weight:700;margin-bottom:2px;">أرباح رئيسية</div>
          <div style="font-size:15px;font-weight:800;color:#1d4ed8;direction:ltr;">$${parseFloat(profitSafe.profit_main||0).toFixed(2)}</div>
        </div>
      </div>
    </div>`;

    // ── الصف الثاني ──
    // ── الصف الثاني — مع جلب الأرصدة الإلكترونية ──
    let scSyp = "—", scUsd = "—", usdtBal = "—";
    try {
      const eRes  = await fetch(`${API_URL}/electronic-safe/balances`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (eRes.ok) {
        const eJson = await eRes.json();
        const ed = eJson.data || {};
        scSyp   = parseFloat(ed.syp_sham_cash || 0).toLocaleString("en-US",{maximumFractionDigits:0}) + " ل.س";
        scUsd   = "$" + parseFloat(ed.usd_sham_cash || 0).toLocaleString("en-US",{minimumFractionDigits:2});
        usdtBal = parseFloat(ed.usdt || 0).toLocaleString("en-US",{minimumFractionDigits:2}) + " USDT";
      }
    } catch(e) { /* تجاهل خطأ جلب الأرصدة الإلكترونية */ }

    const row2 = `
    <div class="nsafe-row2">
      <!-- شام كاش -->
      <div class="nsafe-card nsafe-card-shamcash nsafe-clickable" onclick="openShamCashDialog()">
        <div class="nsafe-header">
          <div class="nsafe-icon"><i class="fa-solid fa-money-bills"></i></div>
          <div>
            <div class="nsafe-title">صندوق شام كاش</div>
            <div class="nsafe-subtitle">SYP / USD</div>
          </div>
        </div>
        <div class="nsafe-balance" id="nsafe-sc-syp" style="font-size:18px;">${scSyp}</div>
        <div class="nsafe-currency" style="text-align:right; direction:rtl;">${scUsd} دولار</div>
        <div class="nsafe-trade-badge nsafe-badge-blue"><i class="fa-solid fa-sliders"></i> بيع / شراء</div>
        <div class="nsafe-click-hint"><i class="fa-solid fa-arrow-pointer"></i> فتح الصندوق</div>
      </div>

      <!-- USDT -->
      <div class="nsafe-card nsafe-card-usdt nsafe-clickable" onclick="openUsdtDialog()">
        <div class="nsafe-header">
          <div class="nsafe-icon"><i class="fa-solid fa-coins"></i></div>
          <div>
            <div class="nsafe-title">صندوق USDT</div>
            <div class="nsafe-subtitle">USDT / USD</div>
          </div>
        </div>
        <div class="nsafe-balance" id="nsafe-usdt-bal" style="font-size:18px;">${usdtBal}</div>
        <div class="nsafe-currency">الرصيد الإلكتروني</div>
        <div class="nsafe-trade-badge nsafe-badge-green"><i class="fa-solid fa-sliders"></i> بيع / شراء</div>
        <div class="nsafe-click-hint"><i class="fa-solid fa-arrow-pointer"></i> فتح الصندوق</div>
      </div>

      <!-- الصناديق الإضافية -->
      <div class="nsafe-card nsafe-card-extra nsafe-extra-btn-card" onclick="openCashierExtraBoxesModal()">
        <div class="nsafe-extra-icon-large"><i class="fa-solid fa-boxes-stacked"></i></div>
        <div class="nsafe-extra-label">الصناديق الإضافية</div>
        <div class="nsafe-extra-sublabel">إضافة وإدارة الصناديق</div>
        <div class="nsafe-trade-badge nsafe-badge-green" style="margin:4px auto 0;"><i class="fa-solid fa-plus"></i> إدارة</div>
      </div>
    </div>`;

    container.innerHTML = officeCard + mainCard + tradingCard + profitCard + row2;

  } catch (error) {
    console.error("Error loading safes:", error);
    container.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:40px;color:var(--danger);">خطأ في الاتصال بالسيرفر</p>`;
  }
}

/* ═══════════════════════════════════════════════════
   دايلوج صندوق التداول
═══════════════════════════════════════════════════ */
function openTradingDialog() {
  if (!_tradingDialogData) { alert("لا توجد بيانات صندوق تداول."); return; }
  const d = _tradingDialogData;

  document.getElementById("trading-dialog-currency-label").textContent = d.currency;
  document.getElementById("td-balance").textContent =
    d.balance.toLocaleString("en-US",{minimumFractionDigits:2}) + " " + d.currency;
  document.getElementById("td-cost").textContent =
    d.cost != null ? d.cost.toFixed(2) + " " + d.currency : "—";

  // حقن واجهة التداول
  document.getElementById("trading-dialog-inner").innerHTML =
    buildTradingUI(d.currencyId, d.officeId);

  document.getElementById("trading-dialog").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeTradingDialog() {
  document.getElementById("trading-dialog").classList.add("hidden");
  document.body.style.overflow = "";
}

/* ═══════════════════════════════════════════════════════════════
   الخزنة الإلكترونية — شام كاش وUSدT
   API: /electronic-safe/balances | /buy | /sell
═══════════════════════════════════════════════════════════════ */

let _scCurrency = "usd"; // عملة الإدخال في شام كاش

/* ── جلب الأرصدة وتحديث كلا الدايلوجين ── */
async function loadElectronicBalances() {
  try {
    const res  = await fetch(`${API_URL}/electronic-safe/balances`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const json = await res.json();
    if (!res.ok) return;
    const d = json.data || {};

    // شام كاش
    const scUsd = document.getElementById("sc-balance-usd");
    const scSyp = document.getElementById("sc-balance-syp");
    if (scUsd) scUsd.textContent = "$" + parseFloat(d.usd_sham_cash || 0).toLocaleString("en-US",{minimumFractionDigits:2});
    if (scSyp) scSyp.textContent = parseFloat(d.syp_sham_cash  || 0).toLocaleString("en-US",{maximumFractionDigits:0}) + " ل.س";

    // USDT
    const usdtBal  = document.getElementById("usdt-balance");
    const usdtUsd  = document.getElementById("usdt-usd-balance");
    if (usdtBal) usdtBal.textContent = parseFloat(d.usdt || 0).toLocaleString("en-US",{minimumFractionDigits:2}) + " USDT";
    if (usdtUsd) usdtUsd.textContent = parseFloat(d.usdt || 0).toLocaleString("en-US",{minimumFractionDigits:2}) + " USDT";

    // تحديث بطاقات الشبكة الرئيسية
    const scCard   = document.getElementById("nsafe-sc-syp");
    const usdtCard = document.getElementById("nsafe-usdt-bal");
    if (scCard)   scCard.textContent   = parseFloat(d.syp_sham_cash||0).toLocaleString("en-US",{maximumFractionDigits:0}) + " ل.س";
    if (usdtCard) usdtCard.textContent = parseFloat(d.usdt||0).toLocaleString("en-US",{minimumFractionDigits:2}) + " USDT";

  } catch (e) {
    console.warn("loadElectronicBalances:", e);
  }
}

/* ══════════════════════════════════
   صندوق شام كاش
══════════════════════════════════ */
function openShamCashDialog() {
  document.getElementById("shamcash-dialog").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  loadElectronicBalances();
  scCalcPreview();
}

function closeShamCashDialog() {
  document.getElementById("shamcash-dialog").classList.add("hidden");
  document.body.style.overflow = "";
}

function scSetCurrency(cur, btn) {
  _scCurrency = cur;
  document.querySelectorAll("#shamcash-dialog .sc-tab").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("sc-amount-badge").textContent = cur === "usd" ? "$" : "ل.س";
  scCalcPreview();
}

function scCalcPreview() {
  const rate    = parseFloat(document.getElementById("sc-rate").value);
  const amount  = parseFloat(document.getElementById("sc-amount").value);
  const commBuy  = parseFloat(document.getElementById("sc-comm-buy").value  || 0);
  const commSell = parseFloat(document.getElementById("sc-comm-sell").value || 0);
  const preview  = document.getElementById("sc-preview");

  if (!rate || !amount || rate <= 0 || amount <= 0) {
    preview.style.display = "none"; return;
  }

  if (_scCurrency === "usd") {
    // ── الإدخال بالدولار → عملية على usd_sham_cash ──
    // الباك: amount = amount (دولار) — لا يتأثر شيء خارجي
    const buyComm  = (amount * commBuy)  / 100;
    const sellComm = (amount * commSell) / 100;
    document.getElementById("sc-pre-gross").textContent      = amount.toLocaleString("en-US",{minimumFractionDigits:2}) + " $ دولار شام كاش";
    document.getElementById("sc-pre-commission").textContent = buyComm.toFixed(4)  + " $ (شراء) / " + sellComm.toFixed(4) + " $ (بيع)";
    const netBuyUsd  = amount - buyComm;
    const netSellUsd = amount - sellComm;
    document.getElementById("sc-pre-net").innerHTML =
      '<span style="color:#15803d;font-weight:800;font-size:15px;">شراء: ' + netBuyUsd.toFixed(4) + ' $</span>'
      + '  /  '
      + '<span style="color:#b91c1c;font-weight:800;font-size:15px;">بيع: ' + netSellUsd.toFixed(4) + ' $</span>';
  } else {
    // ── الإدخال بالليرة → عملية على syp_sham_cash ──
    // الباك: amount = amount (ليرة) — لا يتأثر شيء خارجي
    const buyComm  = (amount * commBuy)  / 100;
    const sellComm = (amount * commSell) / 100;
    document.getElementById("sc-pre-gross").textContent      = amount.toLocaleString("en-US",{maximumFractionDigits:0}) + " ل.س ليرة شام كاش";
    document.getElementById("sc-pre-commission").textContent = buyComm.toLocaleString("en-US",{maximumFractionDigits:0}) + " ل.س (شراء) / " + sellComm.toLocaleString("en-US",{maximumFractionDigits:0}) + " ل.س (بيع)";
    const netBuySyp  = amount - buyComm;
    const netSellSyp = amount - sellComm;
    document.getElementById("sc-pre-net").innerHTML =
      '<span style="color:#15803d;font-weight:800;font-size:15px;">شراء: ' + netBuySyp.toLocaleString("en-US",{maximumFractionDigits:0}) + ' ل.س</span>'
      + '  /  '
      + '<span style="color:#b91c1c;font-weight:800;font-size:15px;">بيع: ' + netSellSyp.toLocaleString("en-US",{maximumFractionDigits:0}) + ' ل.س</span>';
  }

  document.getElementById("sc-pre-comm-label").textContent = `عمولة (${commBuy}% شراء / ${commSell}% بيع)`;
  preview.style.display = "flex";
}

async function scExecute(type) {
  const rate    = parseFloat(document.getElementById("sc-rate").value);
  const amount  = parseFloat(document.getElementById("sc-amount").value);
  const commBuy  = parseFloat(document.getElementById("sc-comm-buy").value  || 0);
  const commSell = parseFloat(document.getElementById("sc-comm-sell").value || 0);
  const note    = document.getElementById("sc-note").value.trim();

  if (!rate   || rate   <= 0) { showInternalToast("يرجى إدخال سعر الصرف."); return; }
  if (!amount || amount <= 0) { showInternalToast("يرجى إدخال المبلغ.");    return; }

  // currency_type بناءً على العملة المختارة — كل منهما مستقل
  const currencyType = _scCurrency === "usd" ? "usd_sham_cash" : "syp_sham_cash";
  const commRate     = type === "buy" ? commBuy : commSell;
  // amount يُرسل كما هو — الباك يزيد/ينقص نفس الحقل فقط
  const backendAmount = amount;

  const btn = document.getElementById(type === "buy" ? "sc-btn-buy" : "sc-btn-sell");
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري التنفيذ...`;

  try {
    const res = await fetch(`${API_URL}/electronic-safe/${type}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        currency_type:   currencyType,
        amount:          backendAmount,
        commission_rate: commRate,
        exchange_rate:   rate,
        note:            note || undefined,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      showInternalToast(`✓ تمت عملية ${type === "buy" ? "الشراء" : "البيع"} بنجاح`);
      loadElectronicBalances();
      document.getElementById("sc-amount").value = "";
      document.getElementById("sc-preview").style.display = "none";
    } else {
      showInternalToast(data.message || "فشلت العملية.");
    }
  } catch (e) {
    showInternalToast("خطأ في الاتصال بالخادم.");
  } finally {
    btn.disabled = false;
    btn.innerHTML = type === "buy"
      ? `<i class="fa-solid fa-cart-shopping"></i> تنفيذ الشراء`
      : `<i class="fa-solid fa-hand-holding-dollar"></i> تنفيذ البيع`;
  }
}

/* ══════════════════════════════════
   صندوق USDT
══════════════════════════════════ */
function openUsdtDialog() {
  document.getElementById("usdt-dialog").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  loadElectronicBalances();
  usdtCalcPreview();
}

function closeUsdtDialog() {
  document.getElementById("usdt-dialog").classList.add("hidden");
  document.body.style.overflow = "";
}

function usdtCalcPreview() {
  const rate     = parseFloat(document.getElementById("usdt-rate").value);
  const amount   = parseFloat(document.getElementById("usdt-amount").value);
  const commBuy  = parseFloat(document.getElementById("usdt-comm-buy").value  || 0);
  const commSell = parseFloat(document.getElementById("usdt-comm-sell").value || 0);
  const preview  = document.getElementById("usdt-preview");

  if (!rate || !amount || rate <= 0 || amount <= 0) {
    preview.style.display = "none"; return;
  }

  // العمولة تُحسب على الكمية بالـ USDT مباشرة — لا يتأثر شيء خارجي
  const buyComm  = (amount * commBuy)  / 100;
  const sellComm = (amount * commSell) / 100;

  document.getElementById("usdt-pre-amount").textContent     = amount.toLocaleString("en-US",{minimumFractionDigits:2}) + " USDT";
  document.getElementById("usdt-pre-usd").textContent        = "سعر: " + rate + " $ / USDT";
  document.getElementById("usdt-pre-commission").textContent =
    buyComm.toFixed(4) + " USDT (شراء) / " + sellComm.toFixed(4) + " USDT (بيع)";
  const netBuyUsdt  = amount - buyComm;
  const netSellUsdt = amount - sellComm;
  document.getElementById("usdt-pre-net").innerHTML =
    '<span style="color:#15803d;font-weight:800;font-size:15px;">شراء: ' + netBuyUsdt.toFixed(4) + ' USDT</span>'
    + '  /  '
    + '<span style="color:#b91c1c;font-weight:800;font-size:15px;">بيع: ' + netSellUsdt.toFixed(4) + ' USDT</span>';
  document.getElementById("usdt-pre-comm-label").textContent =
    `عمولة (${commBuy}% شراء / ${commSell}% بيع)`;

  preview.style.display = "flex";
}

async function usdtExecute(type) {
  const rate     = parseFloat(document.getElementById("usdt-rate").value);
  const amount   = parseFloat(document.getElementById("usdt-amount").value);
  const commBuy  = parseFloat(document.getElementById("usdt-comm-buy").value  || 0);
  const commSell = parseFloat(document.getElementById("usdt-comm-sell").value || 0);
  const note     = document.getElementById("usdt-note").value.trim();

  if (!rate   || rate   <= 0) { showInternalToast("يرجى إدخال سعر USDT."); return; }
  if (!amount || amount <= 0) { showInternalToast("يرجى إدخال الكمية."); return; }

  const commRate = type === "buy" ? commBuy : commSell;
  const btn = document.getElementById(type === "buy" ? "usdt-btn-buy" : "usdt-btn-sell");
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري التنفيذ...`;

  try {
    const endpoint = type === "buy" ? "buy" : "sell";
    const res = await fetch(`${API_URL}/electronic-safe/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        currency_type:   "usdt",
        amount:          amount,
        commission_rate: commRate,
        exchange_rate:   rate,
        note:            note || undefined,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      const action = type === "buy" ? "شراء USDT" : "بيع USDT";
      showInternalToast(`✓ تمت عملية ${action} بنجاح`);
      loadElectronicBalances();
      document.getElementById("usdt-amount").value = "";
      document.getElementById("usdt-preview").style.display = "none";
    } else {
      showInternalToast(data.message || "فشلت العملية.");
    }
  } catch (e) {
    showInternalToast("خطأ في الاتصال بالخادم.");
  } finally {
    btn.disabled = false;
    if (type === "buy") {
      btn.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> تنفيذ الشراء`;
    } else {
      btn.innerHTML = `<i class="fa-solid fa-hand-holding-dollar"></i> تنفيذ البيع`;
    }
  }
}


function renderTradingSafes(safes) {
  // تُستدعى من loadTradingSafes فقط — محتفظ بها للتوافق
  loadTradingSafes();
}

/* ============================= */
/*        EXECUTE TRADE         */
/* ============================= */
function showBankTransfersSection() {
  document
    .querySelectorAll(".section")
    .forEach((s) => (s.style.display = "none"));
  document.getElementById("section-bank-transfers").style.display = "block";

  document.getElementById("page-heading").textContent = "حوالات بنكية";
  document.querySelector(".page-sub").textContent =
    "موافق عليها بانتظار التسليم";
  document.querySelector(".page-icon").innerHTML =
    '<i class="fa-solid fa-landmark"></i>';

  loadCashierBankTransfers();
}

async function loadCashierBankTransfers() {
  const tbody = document.getElementById("cashier-bt-list");
  const emptyEl = document.getElementById("cashier-bt-empty");

  tbody.innerHTML = `<tr><td colspan="7" class="loading-row"><div class="loading-spinner"></div> جاري التحميل...</td></tr>`;
  emptyEl.style.display = "none";

  try {
    const res = await fetch(`${API_URL}/bank-transfer?status=admin_approved`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const json = await res.json();

    if (!json.data || json.data.length === 0) {
      tbody.innerHTML = "";
      emptyEl.style.display = "block";
      return;
    }

    tbody.innerHTML = json.data
      .map((t, i) => {
        const date = new Date(t.created_at).toLocaleString("ar-SY");
        const printObj = JSON.stringify(t)
          .replace(/'/g, "\\'")
          .replace(/"/g, "&quot;");

        return `
            <tr>
                <td style="color:var(--gray);font-size:12px;">${i + 1}</td>
                <td style="font-weight:800;color:var(--primary);font-size:15px;">${t.recipient_name || "—"}</td>
                <td>${t.full_name}</td>
                <td>${t.bank_name}</td>
                <td style="font-weight:900;color:var(--success);">$${parseFloat(t.amount).toLocaleString()}</td>
                <td style="font-size:12px;color:var(--gray);">${date}</td>
                <td>
                    <button class="btn-confirm" onclick="completeBankTransfer(${t.id}, '${printObj}')" style="padding:8px 16px;">
                        <i class="fa-solid fa-hand-holding-dollar"></i> تسليم وطباعة
                    </button>
                </td>
            </tr>`;
      })
      .join("");
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:red;">خطأ في الاتصال بالخادم</td></tr>`;
  }
}

async function completeBankTransfer(id, txDataStr) {
  if (!confirm("هل قمت بتسليم المبلغ للمستلم الفعلي؟ ستتم طباعة الإيصال الآن."))
    return;

  try {
    const res = await fetch(`${API_URL}/bank-transfer/${id}/complete`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const json = await res.json();

    if (res.ok) {
      alert("✅ تم تسليم الحوالة بنجاح");
      loadCashierBankTransfers();

      // تحويل النص إلى كائن كمعامل للطباعة
      const tx = JSON.parse(txDataStr);
      printBankTransferReceipt(tx);
    } else {
      alert(json.message || "حدث خطأ أثناء التسليم");
    }
  } catch (e) {
    alert("فشل الاتصال بالخادم");
  }
}

function printBankTransferReceipt(tx) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const printDate = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const dest = [tx.destination_country, tx.destination_city].filter(Boolean).join(' - ');
  const amountFmt = parseFloat(tx.amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  });

  const receiptHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
  @page { size: 80mm auto; margin: 0 !important; }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Cairo', sans-serif;
    width: 72mm; max-width: 72mm; margin: 0 auto !important; padding: 2mm;
    color: #000; font-size: 13px; line-height: 1.45;
  }
  .hdr { text-align:center; padding-bottom:5px; border-bottom:2px solid #000; margin-bottom:6px; }
  .hdr .logo { font-size:18px; font-weight:800; }
  .hdr .sub { font-size:12px; font-weight:700; margin-top:2px; }
  .hdr .dt { font-size:10px; font-weight:700; direction:ltr; }

  .track { text-align:center; margin:6px 0; padding:5px; border:2px dashed #000; font-size:14px; font-weight:800; direction:ltr; }
  .track span { display:block; font-size:10px; direction:rtl; margin-bottom:2px; }

  .r { display:flex; justify-content:space-between; padding:3px 0; border-bottom:1px dotted #000; font-size:12px; }
  .r .lbl { font-weight:800; }
  .r .val { font-weight:800; direction:ltr; }
  
  .amt { text-align:center; margin:8px 0; padding:8px; border:2px solid #000; font-size:18px; font-weight:900; }
  
  .footer { display:flex; justify-content:space-between; margin-top:12px; padding-top:10px; border-top:2px solid #000; }
  .sig { text-align:center; width:45%; font-size:11px; font-weight:800; }
  .sig-line { border-top:1.5px solid #000; margin-top:20px; }
</style>
</head>
<body>
  <div class="hdr">
    <div class="logo">FlashPay</div>
    <div class="sub">إيصال تسليم حوالة بنكية</div>
    <div class="dt">${printDate}</div>
  </div>

  <div class="track"><span>رقم العملية</span> BT-${tx.id}</div>

  <div class="r"><span class="lbl">اسم المستلم:</span> <span class="val">${tx.recipient_name}</span></div>
  <div class="r"><span class="lbl">صاحب الحساب:</span> <span class="val">${tx.full_name}</span></div>
  <div class="r"><span class="lbl">البنك:</span> <span class="val">${tx.bank_name}</span></div>
  <div class="r"><span class="lbl">الوجهة:</span><span class="val">${dest}</span></div>
  <div class="amt">USD $${amountFmt}</div>

  <div class="footer">
    <div class="sig">توقيع الكاشير<div class="sig-line"></div></div>
    <div class="sig">توقيع المستلم<div class="sig-line"></div></div>
  </div>
  <div style="text-align:center;font-size:10px;margin-top:8px;">نسخة العميل</div>
</body>
</html>`;

  const printWin = window.open("", "_blank", "width=400,height=500");
  if (!printWin) {
    alert("يرجى السماح بالنوافذ المنبثقة (Popups) ثم أعد المحاولة");
    return;
  }
  printWin.document.open();
  printWin.document.write(receiptHtml);
  printWin.document.close();
  printWin.onload = function () {
    printWin.document.fonts.ready.then(function () {
      printWin.focus();
      printWin.print();
      setTimeout(() => {
        if (!printWin.closed) printWin.close();
      }, 5000);
    });
  };
}
function buildTradingUI(currencyId, officeId) {
  const amountChips = [50, 100, 200, 500, 1000];

  // أزرار الكميات تبقى كما هي
  const amountChipsHtml = amountChips
    .map(
      (v) =>
        `<button type="button" class="trade-chip" onclick="setTradeVal('buy_amount_${currencyId}','sell_amount_${currencyId}',${v})">${v}</button>`,
    )
    .join("");

  // جلب آخر سعر شراء وبيع تم استخدامه من التخزين المحلي
  const lastBuyPrice = localStorage.getItem(`last_buy_price_${currencyId}`);
  const lastSellPrice = localStorage.getItem(`last_sell_price_${currencyId}`);

  // إنشاء زر واحد لآخر سعر شراء (إن وجد)
  let buyPriceChipsHtml = "";
  if (lastBuyPrice) {
    buyPriceChipsHtml = `<button type="button" class="trade-chip trade-chip-buy" onclick="setTradeVal('buy_price_${currencyId}',null,${lastBuyPrice})">آخر سعر: ${parseFloat(lastBuyPrice).toLocaleString()}</button>`;
  }

  // إنشاء زر واحد لآخر سعر بيع (إن وجد)
  let sellPriceChipsHtml = "";
  if (lastSellPrice) {
    sellPriceChipsHtml = `<button type="button" class="trade-chip trade-chip-sell" onclick="setTradeVal('sell_price_${currencyId}',null,${lastSellPrice})">آخر سعر: ${parseFloat(lastSellPrice).toLocaleString()}</button>`;
  }

  return `
    <div class="trade-panel">
        <div class="trade-panel-title">
            <i class="fa-solid fa-sliders"></i> عمليات التداول
        </div>

        <div class="trade-field-group">
            <label class="trade-field-label"><i class="fa-solid fa-hashtag"></i> الكمية</label>
            <div class="trade-chips-row">${amountChipsHtml}</div>
            <div class="trade-input-row">
                <input type="number" id="buy_amount_${currencyId}"  class="trading-input" placeholder="أدخل الكمية يدوياً..." min="0" step="any"
                       oninput="document.getElementById('sell_amount_${currencyId}').value=this.value; _updateTradePreview(${currencyId});">
                <input type="number" id="sell_amount_${currencyId}" class="trading-input" style="display:none;" placeholder="الكمية" min="0" step="any">
            </div>
        </div>

        <div class="trade-ops-grid">
            <div class="trade-op trade-op-buy">
                <div class="trade-op-header">
                    <i class="fa-solid fa-arrow-down-to-line"></i> شراء
                </div>
                <div class="trade-chips-row">${buyPriceChipsHtml}</div>
                <div class="trade-input-row">
                    <input type="number" id="buy_price_${currencyId}" class="trading-input" placeholder="سعر الشراء يدوياً..." min="0" step="any"
                           oninput="_updateTradePreview(${currencyId})">
                </div>
                <div id="buy_preview_${currencyId}" style="display:none;margin:8px 0;padding:10px 14px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1.5px solid #86efac;border-radius:10px;text-align:center;">
                    <div style="font-size:11px;color:#15803d;font-weight:700;margin-bottom:4px;">الناتج الإجمالي</div>
                    <div id="buy_preview_val_${currencyId}" style="font-size:22px;font-weight:800;color:#15803d;direction:ltr;letter-spacing:0.5px;">—</div>
                    <div style="font-size:10px;color:#16a34a;margin-top:2px;">ل.س تُدفع مقابل الشراء</div>
                </div>
                <button class="trade-exec-btn trade-exec-buy"
                        onclick="executeTrade('buy', ${officeId}, ${currencyId})">
                    <i class="fa-solid fa-cart-shopping"></i> تنفيذ الشراء
                </button>
            </div>

            <div class="trade-op trade-op-sell">
                <div class="trade-op-header">
                    <i class="fa-solid fa-arrow-up-from-line"></i> بيع
                </div>
                <div class="trade-chips-row">${sellPriceChipsHtml}</div>
                <div class="trade-input-row">
                    <input type="number" id="sell_price_${currencyId}" class="trading-input" placeholder="سعر البيع يدوياً..." min="0" step="any"
                           oninput="_updateTradePreview(${currencyId})">
                </div>
                <div id="sell_preview_${currencyId}" style="display:none;margin:8px 0;padding:10px 14px;background:linear-gradient(135deg,#fff1f2,#fee2e2);border:1.5px solid #fca5a5;border-radius:10px;text-align:center;">
                    <div style="font-size:11px;color:#b91c1c;font-weight:700;margin-bottom:4px;">الناتج الإجمالي</div>
                    <div id="sell_preview_val_${currencyId}" style="font-size:22px;font-weight:800;color:#b91c1c;direction:ltr;letter-spacing:0.5px;">—</div>
                    <div style="font-size:10px;color:#dc2626;margin-top:2px;">ل.س تُستلم من البيع</div>
                </div>
                <button class="trade-exec-btn trade-exec-sell"
                        onclick="executeTrade('sell', ${officeId}, ${currencyId})">
                    <i class="fa-solid fa-hand-holding-dollar"></i> تنفيذ البيع
                </button>
            </div>
        </div>
    </div>`;
}

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
/** حساب الناتج الإجمالي (الكمية × السعر) وعرضه في الـ preview */
function _updateTradePreview(currencyId) {
  const amount    = parseFloat(document.getElementById('buy_amount_' + currencyId)?.value) || 0;
  const buyPrice  = parseFloat(document.getElementById('buy_price_'  + currencyId)?.value) || 0;
  const sellPrice = parseFloat(document.getElementById('sell_price_' + currencyId)?.value) || 0;

  const buyPrev  = document.getElementById('buy_preview_'      + currencyId);
  const buyVal   = document.getElementById('buy_preview_val_'  + currencyId);
  const sellPrev = document.getElementById('sell_preview_'     + currencyId);
  const sellVal  = document.getElementById('sell_preview_val_' + currencyId);

  if (buyPrev && buyVal) {
    if (amount > 0 && buyPrice > 0) {
      const total = amount * buyPrice;
      buyVal.textContent = total.toLocaleString('en-US', {minimumFractionDigits:0,maximumFractionDigits:0}) + ' ل.س';
      buyPrev.style.display = 'block';
    } else {
      buyPrev.style.display = 'none';
    }
  }
  if (sellPrev && sellVal) {
    if (amount > 0 && sellPrice > 0) {
      const total = amount * sellPrice;
      sellVal.textContent = total.toLocaleString('en-US', {minimumFractionDigits:0,maximumFractionDigits:0}) + ' ل.س';
      sellPrev.style.display = 'block';
    } else {
      sellPrev.style.display = 'none';
    }
  }
}

async function executeTrade(type, officeId, currencyId) {
  if (!officeId || !currencyId) {
    alert("بيانات الصندوق غير مكتملة، يرجى تحديث الصفحة");
    return;
  }

  const amountInput = document.getElementById(`${type}_amount_${currencyId}`);
  const priceInput = document.getElementById(`${type}_price_${currencyId}`);

  const amount = parseFloat(amountInput?.value);
  const price = parseFloat(priceInput?.value);

  if (!amount || amount <= 0 || !price || price <= 0) {
    alert("يرجى إدخال كمية وسعر صحيحين");
    return;
  }

  const payload = {
    office_id: officeId,
    currency_id: currencyId,
    amount: amount,
  };
  
  if (type === "buy") payload.buy_price = price;
  else payload.sell_price = price;

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
      // 🟢 الإضافة الجديدة: حفظ السعر المستخدم بنجاح في التخزين المحلي
      localStorage.setItem(`last_${type}_price_${currencyId}`, price);

      if (type === "sell") {
        const profitVal = data.profit ? parseFloat(data.profit).toFixed(2) : "—";
        const balSy = data.balance_sy !== undefined ? `\nرصيد SYP في التداول: ${parseFloat(data.balance_sy).toLocaleString()}` : "";
        alert(`تمت عملية البيع بنجاح!\nالربح: ${profitVal}${balSy}`);
      } else {
        alert("✅ تمت عملية الشراء بنجاح");
      }
      
      // تفريغ الحقول وإعادة تحميل الواجهة لتحديث زر السعر الجديد
      if (amountInput) amountInput.value = "";
      if (priceInput) priceInput.value = "";
      
      // استدعاء دالة تحديث الصناديق المناسبة حسب الملف الحالي
      if (typeof showSafesSection === 'function' && document.getElementById('safes-card')) {
         showSafesSection(); // Admin
      } else if (typeof loadTradingSafes === 'function') {
         loadTradingSafes(); // Cashier
      }
      
    } else {
      alert(data.message || "حدث خطأ أثناء العملية");
    }
  } catch (error) {
    console.error(error);
    alert("حدث خطأ في الاتصال بالخادم");
  }
}

/* ============================= */
/*   تقرير أرباح التداول        */
/* ============================= */

async function loadTradingReport() {
  const dateInput = document.getElementById("report-date");
  const date = dateInput.value || new Date().toISOString().split("T")[0];

  const summaryEl = document.getElementById("profits-summary");
  const tableEl = document.getElementById("profits-table");
  const emptyEl = document.getElementById("profits-empty");
  const tbodyEl = document.getElementById("profits-list");

  summaryEl.innerHTML = `<div class="loading-row" style="grid-column:1/-1;"><div class="loading-spinner" style="margin:0 auto 8px;"></div> جاري التحميل...</div>`;
  tableEl.style.display = "none";
  emptyEl.style.display = "none";
  tbodyEl.innerHTML = "";

  try {
    const res = await fetch(`${API_URL}/trading/report/details?date=${date}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });

    const json = await res.json();

    if (!res.ok) {
      summaryEl.innerHTML = `<p style="color:var(--danger); grid-column:1/-1;">${json.message || "فشل تحميل البيانات"}</p>`;
      return;
    }

    const transactions = json.transactions || [];
    const summary = json.summary || {};

    const totalProfit = parseFloat(summary.total_net_profit || 0);
    const profitColor = totalProfit >= 0 ? "var(--success)" : "var(--danger)";
    const profitBg =
      totalProfit >= 0 ? "var(--success-soft)" : "var(--danger-soft)";
    const profitIcon =
      totalProfit >= 0 ? "fa-arrow-trend-up" : "fa-arrow-trend-down";

    summaryEl.innerHTML = `
      <div class="stat-card">
        <div class="icon blue"><i class="fa-solid fa-cart-arrow-down"></i></div>
        <div>
          <div style="font-size:12px; color:var(--gray); margin-bottom:4px;">إجمالي المشتريات</div>
          <div style="font-size:20px; font-weight:800; direction:ltr; text-align:right;">${parseFloat(summary.total_bought || 0).toFixed(2)}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon orange"><i class="fa-solid fa-cart-arrow-up"></i></div>
        <div>
          <div style="font-size:12px; color:var(--gray); margin-bottom:4px;">إجمالي المبيعات</div>
          <div style="font-size:20px; font-weight:800; direction:ltr; text-align:right;">${parseFloat(summary.total_sold || 0).toFixed(2)}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon" style="background:${profitColor};"><i class="fa-solid ${profitIcon}"></i></div>
        <div>
          <div style="font-size:12px; color:var(--gray); margin-bottom:4px;">صافي الربح / الخسارة</div>
          <div style="font-size:20px; font-weight:800; color:${profitColor}; direction:ltr; text-align:right;">
            ${totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(2)}
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon purple"><i class="fa-solid fa-list-ol"></i></div>
        <div>
          <div style="font-size:12px; color:var(--gray); margin-bottom:4px;">عدد العمليات</div>
          <div style="font-size:20px; font-weight:800;">${transactions.length}</div>
        </div>
      </div>
    `;

    if (transactions.length === 0) {
      emptyEl.style.display = "block";
      return;
    }

    transactions.forEach((tx, index) => {
      const isBuy = tx.type === "buy";
      const profit = parseFloat(tx.profit || 0);
      const pColor =
        profit > 0
          ? "var(--success)"
          : profit < 0
            ? "var(--danger)"
            : "var(--gray)";
      const typeLabel = isBuy
        ? `<span class="badge-buy">شراء</span>`
        : `<span class="badge-sell">بيع</span>`;
      const profitCell = isBuy
        ? `<span style="color:var(--gray-light); font-size:12px;">—</span>`
        : `<span style="color:${pColor}; font-weight:700; direction:ltr; display:inline-block;">${profit >= 0 ? "+" : ""}${profit.toFixed(2)}</span>`;

      tbodyEl.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${typeLabel}</td>
          <td>${tx.currency?.code ?? "—"}</td>
          <td style="direction:ltr; text-align:right;">${parseFloat(tx.amount).toFixed(2)}</td>
          <td style="direction:ltr; text-align:right;">${parseFloat(tx.price).toFixed(2)}</td>
          <td style="color:var(--gray); direction:ltr; text-align:right;">${parseFloat(tx.cost_at_time || 0).toFixed(2)}</td>
          <td>${profitCell}</td>
          <td style="direction:ltr; text-align:right;">${tx.transaction_date ?? "—"}</td>
          <td>${tx.user?.name ?? "—"}</td>
        </tr>
      `;
    });

    tableEl.style.display = "table";
  } catch (error) {
    console.error("Error loading report:", error);
    summaryEl.innerHTML = `<p style="color:var(--danger); grid-column:1/-1;">خطأ في الاتصال بالسيرفر</p>`;
  }
}

/* ============================= */
/*        LIVE CLOCK            */
/* ============================= */

function updateClock() {
  const el = document.getElementById("time-display");
  if (!el) return;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  el.textContent = `${hh}:${mm}:${ss}`;
}

/* ======================================= */
/*         CUSTOMERS & NEW TRANSFER        */
/* ======================================= */

let _allCustomers = []; // كل الزبائن المجلوبين
let _selectedCustomer = null; // الزبون المختار حالياً
let _custCurrencies = []; // العملات

/* ── عرض القسم ── */
function showCustomersSection() {
  document.querySelectorAll(".section").forEach((s) => (s.style.display = "none"));
  document.getElementById("section-customers").style.display = "block";

  document.getElementById("page-heading").textContent = "إنشاء حوالة";
  document.querySelector(".page-sub").textContent = "اختر الزبون وأنشئ الحوالة";
  document.querySelector(".page-icon").innerHTML =
    '<i class="fa-solid fa-users"></i>';

  loadCustomers();
}

/* ============================= */
/*      EXTRA BOXES (CASHIER)    */
/* ============================= */

let _cashierOfficeId = null;


/* ── Extra Boxes — كاشير (نفس أسلوب admin) ── */
let _cashierExtraOfficeId = null;

async function openCashierExtraBoxesModal() {
  document.getElementById("cashier-extra-boxes-modal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  await loadCashierExtraBoxes();
}

function closeCashierExtraBoxesModal() {
  document.getElementById("cashier-extra-boxes-modal").classList.add("hidden");
  document.body.style.overflow = "";
}

document.addEventListener("DOMContentLoaded", () => {
  // إغلاق الدايلوجات عند النقر خارجها
  const dialogs = [
    { id: "cashier-extra-boxes-modal",   fn: () => closeCashierExtraBoxesModal() },
    { id: "trading-dialog",              fn: () => closeTradingDialog() },
    { id: "shamcash-dialog",             fn: () => closeShamCashDialog() },
    { id: "usdt-dialog",                 fn: () => closeUsdtDialog() },
    { id: "cashier-box-tx-dialog",       fn: () => closeCashierBoxTxDialog() },
  ];
  dialogs.forEach(({ id, fn }) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", (e) => { if (e.target === el) fn(); });
  });
  // Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeTradingDialog();
      closeShamCashDialog();
      closeUsdtDialog();
      closeCashierBoxTxDialog();
      closeCashierExtraBoxesModal();
    }
  });
});

async function loadCashierExtraBoxes() {
  const grid = document.getElementById("cashier-extra-boxes-list");
  grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--gray);"><i class="fa-solid fa-spinner fa-spin" style="font-size:22px;margin-bottom:12px;display:block;"></i>جاري التحميل...</div>`;

  try {
    if (!_cashierOfficeId) {
      const meRes  = await fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } });
      const meData = await meRes.json();
      _cashierOfficeId = meData.user?.office_id;
    }

    const res  = await fetch(`${API_URL}/extra-boxes`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
    const json = await res.json();
    const myBoxes = (json.data || []).filter((b) => b.office_id === _cashierOfficeId);

    if (!myBoxes.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:50px 20px;color:var(--gray);">
        <i class="fa-solid fa-box-open" style="font-size:32px;margin-bottom:12px;display:block;opacity:0.4;"></i>
        لا توجد صناديق إضافية مسجلة حالياً
      </div>`;
      return;
    }

    grid.innerHTML = myBoxes.map((box) => `
    <div class="eb-safe-card" id="eb-card-${box.id}">
      <div class="eb-safe-name"><i class="fa-solid fa-box" style="color:#10b981;margin-left:5px;"></i>${box.name}</div>
      <div class="eb-safe-balance">$${parseFloat(box.amount).toLocaleString("en-US",{minimumFractionDigits:2})}</div>
      <div class="eb-safe-actions">
        <button class="eb-action-btn eb-btn-dep" onclick="openCashierBoxTxDialog(${box.id}, ${box.amount}, '${box.name.replace(/'/g,"\\'")}', 'deposit')">
          <i class="fa-solid fa-plus"></i> إيداع
        </button>
        <button class="eb-action-btn eb-btn-wit" onclick="openCashierBoxTxDialog(${box.id}, ${box.amount}, '${box.name.replace(/'/g,"\\'")}', 'withdraw')">
          <i class="fa-solid fa-minus"></i> سحب
        </button>
      </div>
      <div class="eb-safe-actions" style="margin-top:4px;">
        <button class="eb-action-btn eb-btn-tra" onclick="cashierTransferExtraBoxToOffice(${box.id}, ${box.amount}, '${box.name.replace(/'/g,"\\'")}')">
          <i class="fa-solid fa-right-left"></i> للخزنة
        </button>
        <button class="eb-action-btn eb-btn-del" onclick="cashierDeleteExtraBox(${box.id})">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>`).join("");

  } catch (e) {
    console.error(e);
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--danger);">حدث خطأ أثناء تحميل البيانات</div>`;
  }
}

/* ── دايلوج عملية الصندوق الإضافي ── */
let _cBoxTxData = null;

function openCashierBoxTxDialog(boxId, currentAmount, boxName, type) {
  _cBoxTxData = { id: boxId, currentAmount, name: boxName, type };
  const isDeposit = type === "deposit";
  const header = document.getElementById("cashier-box-tx-header");
  header.style.background = isDeposit
    ? "linear-gradient(135deg,#059669,#10b981)"
    : "linear-gradient(135deg,#dc2626,#ef4444)";
  document.getElementById("cashier-box-tx-title").innerHTML =
    isDeposit
      ? `<i class="fa-solid fa-plus-circle"></i> إيداع — ${boxName}`
      : `<i class="fa-solid fa-minus-circle"></i> سحب — ${boxName}`;
  document.getElementById("cashier-box-tx-current-balance").textContent =
    "$" + parseFloat(currentAmount).toLocaleString("en-US",{minimumFractionDigits:2});
  document.getElementById("cashier-box-tx-amount").value = "";
  document.getElementById("cashier-box-tx-note").value = "";
  document.getElementById("cashier-box-tx-preview").style.display = "none";
  document.getElementById("cashier-box-tx-btn-label").textContent = isDeposit ? "تنفيذ الإيداع" : "تنفيذ السحب";
  document.getElementById("cashier-box-tx-submit").style.background =
    isDeposit ? "linear-gradient(135deg,#059669,#10b981)" : "linear-gradient(135deg,#dc2626,#ef4444)";
  document.getElementById("cashier-box-tx-dialog").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeCashierBoxTxDialog() {
  document.getElementById("cashier-box-tx-dialog").classList.add("hidden");
}

function cashierBoxTxPreview() {
  if (!_cBoxTxData) return;
  const amount = parseFloat(document.getElementById("cashier-box-tx-amount").value);
  const preview = document.getElementById("cashier-box-tx-preview");
  const afterEl = document.getElementById("cashier-box-tx-after");
  if (!amount || amount <= 0) { preview.style.display="none"; return; }
  const after = _cBoxTxData.type === "deposit"
    ? _cBoxTxData.currentAmount + amount
    : _cBoxTxData.currentAmount - amount;
  afterEl.textContent = "$" + after.toLocaleString("en-US",{minimumFractionDigits:2});
  afterEl.style.color = after >= 0 ? "#059669" : "#dc2626";
  preview.style.display = "flex";
}

async function submitCashierBoxTx() {
  if (!_cBoxTxData) return;
  const amount = parseFloat(document.getElementById("cashier-box-tx-amount").value);
  const notes  = document.getElementById("cashier-box-tx-note").value.trim();
  if (!amount || amount <= 0) { showInternalToast("يرجى إدخال مبلغ صحيح."); return; }

  // لا يوجد تحقق من الرصيد — السحب مسموح حتى لو النتيجة سالبة
  const endpoint = _cBoxTxData.type === "deposit"
    ? `${API_URL}/extra-boxes/${_cBoxTxData.id}/deposit`
    : `${API_URL}/extra-boxes/${_cBoxTxData.id}/withdraw`;

  const btn = document.getElementById("cashier-box-tx-submit");
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري التنفيذ...`;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}`, Accept:"application/json" },
      body: JSON.stringify({ amount, notes }),
    });
    const data = await res.json();
    if (res.ok) {
      showInternalToast(_cBoxTxData.type === "deposit" ? "✓ تم الإيداع بنجاح" : "✓ تم السحب بنجاح");
      closeCashierBoxTxDialog();
      loadCashierExtraBoxes();
    } else {
      showInternalToast(data.message || "فشلت العملية.");
    }
  } catch(e) {
    showInternalToast("خطأ في الاتصال بالخادم.");
  } finally {
    btn.disabled = false;
    const lbl = _cBoxTxData?.type === "deposit" ? "تنفيذ الإيداع" : "تنفيذ السحب";
    btn.innerHTML = `<i class="fa-solid fa-check"></i> <span id="cashier-box-tx-btn-label">${lbl}</span>`;
  }
}
async function cashierCreateExtraBox() {
  const nameInput   = document.getElementById("cashier-eb-name");
  const debitInput  = document.getElementById("cashier-eb-amount-debit");
  const creditInput = document.getElementById("cashier-eb-amount-credit");

  const name   = nameInput.value.trim();
  const debit  = parseFloat(debitInput.value)  || 0;
  const credit = parseFloat(creditInput.value) || 0;

  if (!name) { showInternalToast("يرجى إدخال اسم للصندوق."); return; }
  if (debit < 0 || credit < 0) { showInternalToast("القيم يجب أن تكون أكبر من أو تساوي الصفر."); return; }

  try {
    const res = await fetch(`${API_URL}/extra-boxes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name,
        amount_debit:  debit,
        amount_credit: credit,
        office_id: _cashierOfficeId,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      nameInput.value   = "";
      debitInput.value  = "";
      creditInput.value = "";
      const netEl = document.getElementById("cashier-eb-net-value");
      if (netEl) { netEl.textContent = "$0.00"; netEl.style.color = ""; }
      showInternalToast("✅ تم إضافة الصندوق بنجاح!");
      loadCashierExtraBoxes();
    } else { showInternalToast(data.message || "حدث خطأ أثناء الإضافة."); }
  } catch (e) { showInternalToast("خطأ في الاتصال بالخادم."); }
}

// حساب الصافي لحظياً عند تغيير منه / عليه
function _cashierEbUpdateNet() {
  const debit  = parseFloat(document.getElementById("cashier-eb-amount-debit")?.value)  || 0;
  const credit = parseFloat(document.getElementById("cashier-eb-amount-credit")?.value) || 0;
  const net    = debit - credit;
  const el     = document.getElementById("cashier-eb-net-value");
  if (!el) return;
  el.textContent = (net >= 0 ? "+" : "") + "$" + net.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  el.style.color = net >= 0 ? "#15803d" : "#b91c1c";
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("cashier-eb-amount-debit")?.addEventListener("input",  _cashierEbUpdateNet);
  document.getElementById("cashier-eb-amount-credit")?.addEventListener("input", _cashierEbUpdateNet);
});

async function cashierDeleteExtraBox(boxId) {
  if (!confirm("هل أنت متأكد من حذف هذا الصندوق؟\n(سيتم حذفه مع الرصيد المتبقي فيه)")) return;
  try {
    const res = await fetch(`${API_URL}/extra-boxes/${boxId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { showInternalToast("تم حذف الصندوق بنجاح."); loadCashierExtraBoxes(); }
    else { showInternalToast("فشل في حذف الصندوق."); }
  } catch (e) { showInternalToast("خطأ في الاتصال بالخادم."); }
}

async function cashierTransferExtraBoxToOffice(boxId, maxAmount, boxName) {
  const amountStr = prompt(`كم تريد أن تنقل من صندوق "${boxName}" إلى خزنة المكتب؟\nالرصيد المتاح: ${parseFloat(maxAmount).toLocaleString()}`);
  if (!amountStr) return;
  const transferAmount = parseFloat(amountStr);
  if (isNaN(transferAmount) || transferAmount <= 0) {
    alert("يرجى إدخال مبلغ صحيح أكبر من الصفر."); return;
  }
  const notes = prompt("ملاحظة على التحويل (مطلوبة):") ?? "";
  if (!notes.trim()) { alert("يرجى إدخال ملاحظة على عملية التحويل."); return; }
  try {
    const res = await fetch(`${API_URL}/extra-boxes/${boxId}/transfer-to-office`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount: transferAmount, notes }),
    });
    const data = await res.json();
    if (res.ok) {
      showInternalToast("✅ تم نقل المبلغ إلى خزنة المكتب بنجاح.");
      loadCashierExtraBoxes();
      loadTradingSafes();
    } else {
      showInternalToast(data.message || "فشلت عملية التحويل.");
    }
  } catch (e) { alert("حدث خطأ في الاتصال بالخادم أثناء النقل."); }
}

async function cashierCreateExtraBox() {
  const nameInput   = document.getElementById("cashier-eb-name");
  const debitInput  = document.getElementById("cashier-eb-amount-debit");
  const creditInput = document.getElementById("cashier-eb-amount-credit");

  const name   = nameInput.value.trim();
  const debit  = parseFloat(debitInput.value)  || 0;
  const credit = parseFloat(creditInput.value) || 0;

  if (!name) { showInternalToast("يرجى إدخال اسم للصندوق."); return; }
  if (debit < 0 || credit < 0) { showInternalToast("القيم يجب أن تكون أكبر من أو تساوي الصفر."); return; }

  try {
    const res = await fetch(`${API_URL}/extra-boxes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name,
        amount_debit:  debit,
        amount_credit: credit,
        office_id: _cashierOfficeId,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      nameInput.value   = "";
      debitInput.value  = "";
      creditInput.value = "";
      const netEl = document.getElementById("cashier-eb-net-value");
      if (netEl) { netEl.textContent = "$0.00"; netEl.style.color = ""; }
      showInternalToast("✅ تم إضافة الصندوق بنجاح!");
      loadCashierExtraBoxes();
    } else { showInternalToast(data.message || "حدث خطأ أثناء الإضافة."); }
  } catch (e) { showInternalToast("خطأ في الاتصال بالخادم."); }
}

// حساب الصافي لحظياً عند تغيير منه / عليه
function _cashierEbUpdateNet() {
  const debit  = parseFloat(document.getElementById("cashier-eb-amount-debit")?.value)  || 0;
  const credit = parseFloat(document.getElementById("cashier-eb-amount-credit")?.value) || 0;
  const net    = debit - credit;
  const el     = document.getElementById("cashier-eb-net-value");
  if (!el) return;
  el.textContent = (net >= 0 ? "+" : "") + "$" + net.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  el.style.color = net >= 0 ? "#15803d" : "#b91c1c";
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("cashier-eb-amount-debit")?.addEventListener("input",  _cashierEbUpdateNet);
  document.getElementById("cashier-eb-amount-credit")?.addEventListener("input", _cashierEbUpdateNet);
});

async function cashierDeleteExtraBox(boxId) {
  if (!confirm("هل أنت متأكد من حذف هذا الصندوق؟\n(سيتم حذفه مع الرصيد المتبقي فيه)")) return;
  try {
    const res = await fetch(`${API_URL}/extra-boxes/${boxId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { showInternalToast("تم حذف الصندوق بنجاح."); loadCashierExtraBoxes(); }
    else { showInternalToast("فشل في حذف الصندوق."); }
  } catch (e) { showInternalToast("خطأ في الاتصال بالخادم."); }
}

async function cashierTransferExtraBoxToOffice(boxId, maxAmount, boxName) {
  const amountStr = prompt(`كم تريد أن تنقل من صندوق "${boxName}" إلى خزنة المكتب؟\nالرصيد المتاح: ${parseFloat(maxAmount).toLocaleString()}`);
  if (!amountStr) return;
  const transferAmount = parseFloat(amountStr);
  if (isNaN(transferAmount) || transferAmount <= 0) {
    alert("يرجى إدخال مبلغ صحيح أكبر من الصفر."); return;
  }
  const notes = prompt("ملاحظة على التحويل (مطلوبة):") ?? "";
  if (!notes.trim()) { alert("يرجى إدخال ملاحظة على عملية التحويل."); return; }
  try {
    const res = await fetch(`${API_URL}/extra-boxes/${boxId}/transfer-to-office`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount: transferAmount, notes }),
    });
    const data = await res.json();
    if (res.ok) {
      showInternalToast("✅ تم نقل المبلغ إلى خزنة المكتب بنجاح.");
      loadCashierExtraBoxes();
      loadTradingSafes();
    } else {
      showInternalToast(data.message || "فشلت عملية التحويل.");
    }
  } catch (e) { alert("حدث خطأ في الاتصال بالخادم أثناء النقل."); }
}

async function cashierBoxTransaction(boxId, currentAmount, boxName, type) {
  const actionText = type === "deposit" ? "إيداع في" : "سحب من";

  const amountStr = prompt(
    `أدخل المبلغ المراد ${actionText} صندوق (${boxName}):\nالرصيد الحالي: ${parseFloat(currentAmount).toLocaleString()}`,
  );
  if (amountStr === null) return;

  const amountValue = parseFloat(amountStr);
  if (isNaN(amountValue) || amountValue <= 0) {
    alert("يرجى إدخال مبلغ صحيح أكبر من الصفر.");
    return;
  }

  // لا يوجد تحقق من الرصيد — السحب مسموح حتى لو النتيجة سالبة
  const notes = prompt("ملاحظة على العملية (اختياري — اضغط موافق للتخطي):") ?? "";

  const endpoint = type === "deposit"
    ? `${API_URL}/extra-boxes/${boxId}/deposit`
    : `${API_URL}/extra-boxes/${boxId}/withdraw`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({ amount: amountValue, notes }),
    });

    const data = await res.json();
    if (res.ok) {
      showInternalToast(
        `✅ تمت عملية ${type === "deposit" ? "الإيداع" : "السحب"} بنجاح على صندوق (${boxName}).`,
      );
      loadCashierExtraBoxes();
    } else {
      alert(data.message || "فشل في تحديث بيانات الصندوق.");
    }
  } catch (e) {
    console.error("cashierBoxTransaction:", e);
    alert("خطأ في الاتصال بالخادم.");
  }
}
/* ── جلب الزبائن ── */
async function loadCustomers() {
  const tbody = document.getElementById("customers-list");
  tbody.innerHTML = `<tr><td colspan="6" class="loading-row"><div class="loading-spinner"></div> جاري التحميل...</td></tr>`;

  try {
    const res = await fetch(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const json = await res.json();
    const users = Array.isArray(json.data) ? json.data : (json.data ?? []);

    // نصفّي على role=customer فقط
    _allCustomers = users.filter((u) => u.role === "customer");

    _renderCustomers(_allCustomers);
  } catch (err) {
    console.error("loadCustomers error:", err);
    tbody.innerHTML = `<tr><td colspan="6" class="loading-row" style="color:var(--danger);">خطأ في الاتصال بالسيرفر</td></tr>`;
  }
}

/* ── فلترة الزبائن عبر البحث ── */
function filterCustomers() {
  const q = (document.getElementById("cust-search")?.value || "")
    .trim()
    .toLowerCase();
  if (!q) {
    _renderCustomers(_allCustomers);
    return;
  }
  const filtered = _allCustomers.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(q) ||
      (u.phone || "").toLowerCase().includes(q),
  );
  _renderCustomers(filtered);
}

/* ── رسم صفوف الجدول ── */
function _renderCustomers(list) {
  const tbody = document.getElementById("customers-list");
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="fa-solid fa-users"></i><p>لا يوجد زبائن</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = list
    .map(
      (u, i) => `
    <tr>
      <td style="color:var(--gray);font-size:12px;">${i + 1}</td>
      <td style="font-weight:700;">${u.name ?? "—"}</td>
      <td style="direction:ltr;text-align:right;">${u.phone ?? "—"}</td>
      <td style="font-size:12px;color:var(--gray);">${u.email ?? "—"}</td>
      <td>${u.city?.name ?? "—"}</td>
      <td>
        <button class="btn-confirm" style="padding:7px 18px;font-size:13px;"
          onclick="selectCustomer(${u.id})">
          <i class="fa-solid fa-paper-plane"></i> إنشاء حوالة
        </button>
      </td>
    </tr>
  `,
    )
    .join("");
}

/* ── اختيار زبون وفتح نموذج الحوالة ── */
async function selectCustomer(userId) {
  _selectedCustomer = _allCustomers.find((u) => u.id === userId) || null;
  if (!_selectedCustomer) return;

  // تحديث الهيدر
  document.getElementById("cust-selected-name").textContent =
    _selectedCustomer.name ?? "—";
  document.getElementById("cust-selected-phone").textContent =
    _selectedCustomer.phone ?? "—";

  // إخفاء قائمة الزبائن وإظهار النموذج
  document.getElementById("cust-list-card").style.display = "none";
  document.getElementById("cust-transfer-card").style.display = "block";

  // تحميل بيانات النموذج
  await custInitForm();
}

/* ── العودة إلى قائمة الزبائن ── */
function backToCustomerList() {
  _selectedCustomer = null;
  document.getElementById("cust-list-card").style.display = "block";
  document.getElementById("cust-transfer-card").style.display = "none";
  _custResetForm();
}

/* ── تحميل العملات والمكاتب ── */
async function custInitForm() {
  const overlay = document.getElementById("cust-loading-overlay");
  const wrapper = document.getElementById("cust-form-wrapper");
  overlay.style.display = "flex";
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
    _custCurrencies = Array.isArray(currJson)
      ? currJson
      : (currJson.data ?? []);
    _custFillCurrencySelect("cust-send-currency", "اختر عملة الإرسال...");
    _custFillCurrencySelect("cust-recv-currency", "اختر عملة الاستلام...");

    // ── المكاتب ──
    const officeJson = await officeRes.json();
    const offices = officeJson.data ?? [];
    const officeSel = document.getElementById("cust-office");
    officeSel.innerHTML = '<option value="">اختر المكتب المستلم...</option>';
    offices.forEach((o) =>
      officeSel.appendChild(
        new Option(`${o.name} — ${o.city?.name ?? ""}`, o.id),
      ),
    );
  } catch (err) {
    console.error("custInitForm error:", err);
    custShowError("فشل تحميل البيانات من الخادم. حاول مرة أخرى.");
  } finally {
    overlay.style.display = "none";
    wrapper.style.opacity = "1";
    wrapper.style.pointerEvents = "";
  }
}

/* ── helper: ملء قائمة عملات ── */
function _custFillCurrencySelect(selId, placeholder) {
  const sel = document.getElementById(selId);
  if (!sel) return;
  sel.innerHTML = `<option value="">${placeholder}</option>`;
  _custCurrencies.forEach((c) =>
    sel.appendChild(new Option(`${c.name} (${c.code})`, c.id)),
  );
}

/* ── حساب القيمة بالدولار (نفس منطق admin.js) ── */
function custCalcUsd() {
  const amount = parseFloat(document.getElementById("cust-amount").value) || 0;
  const sendCurrId =
    parseInt(document.getElementById("cust-send-currency").value) || 0;
  const currency = _custCurrencies.find((c) => c.id === sendCurrId);

  const preview = document.getElementById("cust-usd-preview");
  const tierHint = document.getElementById("cust-tier-hint");

  if (!currency || amount <= 0) {
    preview.textContent = "= $0.00";
    tierHint.textContent = "";
    return;
  }

  // نفس getEffectiveRate من admin.js
  const rates = currency.rates ?? [];
  let rate = parseFloat(currency.price ?? 1);
  let tierLabel = null;

  if (rates.length > 0 && amount > 0) {
    const sorted = [...rates].sort(
      (a, b) => parseFloat(a.min_amount) - parseFloat(b.min_amount),
    );
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (amount >= parseFloat(sorted[i].min_amount)) {
        rate = parseFloat(sorted[i].rate);
        tierLabel = `≥ ${sorted[i].min_amount}`;
        break;
      }
    }
  }

  const eq = (amount * rate).toFixed(2);
  preview.textContent = `= $${eq}`;

  if (tierLabel) {
    tierHint.textContent = `السعر المطبّق: ${rate} (${tierLabel})`;
    tierHint.style.color = "var(--primary)";
  } else {
    tierHint.textContent = `السعر الأساسي: ${rate}`;
    tierHint.style.color = "var(--gray)";
  }
}

/* ── إرسال الحوالة ── */
async function custSubmitTransfer() {
  const amount = document.getElementById("cust-amount").value.trim();
  const sendCurrId = document.getElementById("cust-send-currency").value;
  const recvCurrId = document.getElementById("cust-recv-currency").value;
  const officeId = document.getElementById("cust-office").value;
  const receiverName = document
    .getElementById("cust-receiver-name")
    .value.trim();
  const receiverPhone = document
    .getElementById("cust-receiver-phone")
    .value.trim();

  if (!_selectedCustomer) return custShowError("لم يتم اختيار زبون");
  if (!amount || parseFloat(amount) < 1)
    return custShowError("يرجى إدخال مبلغ صحيح (1 أو أكثر)");
  if (!sendCurrId) return custShowError("يرجى اختيار عملة الإرسال");
  if (!recvCurrId) return custShowError("يرجى اختيار عملة الاستلام");
  if (!officeId) return custShowError("يرجى اختيار المكتب المستلم");
  if (!receiverName) return custShowError("يرجى إدخال اسم المستلم");
  if (!receiverPhone) return custShowError("يرجى إدخال رقم هاتف المستلم");

  const btn = document.getElementById("cust-submit-btn");
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإرسال...';

  try {
    const fd = new FormData();
    fd.append("amount", parseFloat(amount));
    fd.append("send_currency_id", parseInt(sendCurrId));
    fd.append("currency_id", parseInt(recvCurrId));
    fd.append("destination_office_id", parseInt(officeId));
    fd.append("sender_id", _selectedCustomer.id);
    fd.append("status", "ready"); // مباشرة ready بدون موافقة
    fd.append("receiver_name", receiverName);
    fd.append("receiver_phone", receiverPhone);
    fd.append("fee", 0);

    const res = await fetch(`${API_URL}/transfers`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      body: fd,
    });
    const json = await res.json();

    if (res.status === 201) {
      const trackingCode = json.data?.tracking_code ?? "";
      custShowSuccess(
        `✅ تم إنشاء الحوالة بنجاح — كود التتبع: ${trackingCode}`,
      );
      _custResetForm();
    } else {
      const msg = json.errors
        ? Object.values(json.errors).flat().join(" — ")
        : (json.message ?? "حدث خطأ غير متوقع");
      custShowError(msg);
    }
  } catch (err) {
    console.error("custSubmitTransfer error:", err);
    custShowError("تعذّر الاتصال بالخادم.");
  } finally {
    btn.disabled = false;
    btn.innerHTML =
      '<i class="fa-solid fa-paper-plane"></i> إنشاء وإرسال الحوالة';
  }
}

/* ── إعادة تعيين النموذج ── */
function _custResetForm() {
  ["cust-amount", "cust-receiver-name", "cust-receiver-phone"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  ["cust-send-currency", "cust-recv-currency", "cust-office"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("cust-usd-preview").textContent = "= $0.00";
  document.getElementById("cust-tier-hint").textContent = "";
  document.getElementById("cust-success-toast").classList.add("hidden");
  document.getElementById("cust-error-toast").classList.add("hidden");
}

/* ── التوستات ── */
function custShowSuccess(msg) {
  const t = document.getElementById("cust-success-toast");
  document.getElementById("cust-toast-msg").textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 7000);
  document.getElementById("cust-error-toast").classList.add("hidden");
}
function custShowError(msg) {
  const t = document.getElementById("cust-error-toast");
  document.getElementById("cust-error-msg").textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 7000);
  document.getElementById("cust-success-toast").classList.add("hidden");
}

/* ============================= */
/*             INIT             */
/* ============================= */

document.addEventListener("DOMContentLoaded", async () => {
  token = await checkAuth();
  if (!token) return;

  document.getElementById("report-date").value = new Date()
    .toISOString()
    .split("T")[0];

  updateClock();
  setInterval(updateClock, 1000);

  loadNewTransfers();
  bindInternalListeners();
});

/* ============================= */
/*        PRINT RECEIPT         */
/* ============================= */
function printTransferReceipt(tx) {
  if (!tx) return;

  function toEn(val) {
    return String(val ?? "---")
      .replace(/[\u0660-\u0669]/g, (d) => d.charCodeAt(0) - 0x0660)
      .replace(/[\u06F0-\u06F9]/g, (d) => d.charCodeAt(0) - 0x06f0);
  }

  function fmtNum(val, decimals = 2) {
    const num = parseFloat(val ?? 0);
    return toEn(
      isNaN(num)
        ? "0.00"
        : num.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }),
    );
  }

  const trackingCode = toEn(tx.tracking_code ?? "---");
  const senderName = tx.sender?.name ?? "غير معروف";
  const senderCountry = tx.sender?.country?.name ?? "---";
  const sendAmount = fmtNum(tx.amount);
  const sendCurrencyCode = tx.send_currency?.code ?? "USD";
  const amountUsd = parseFloat(tx.amount_in_usd ?? 0);
  const deliveryCurrencyPrice = parseFloat(tx.currency?.price ?? 1);
  const deliveryCurrencyCode = tx.currency?.code ?? "---";
  const deliveryAmount = fmtNum(
    deliveryCurrencyPrice > 0 ? amountUsd / deliveryCurrencyPrice : 0,
  );
  const receiverName = tx.receiver_name ?? "---";
  const receiverPhone = toEn(tx.receiver_phone ?? "---");

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const printDate = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())}  ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const receiptHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');

  @page {
    size: 80mm auto;
    margin: 0 !important;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Cairo', sans-serif;
    width: 72mm; 
    max-width: 72mm;
    margin: 0 auto !important;
    padding: 2mm;
    padding-bottom: 0;
    color: #000 !important; /* إجبار كل شيء على اللون الأسود */
    font-size: 13px;
    line-height: 1.45;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    overflow: hidden;
  }

  .hdr { text-align:center; padding-bottom:5px; border-bottom:2px solid #000; margin-bottom:6px; }
  .hdr .logo { font-size:18px; font-weight:700; color: #000; }
  .hdr .sub  { font-size:12px; font-weight:700; color: #000; margin-top:1px; }
  .hdr .dt   { font-size:11px; font-weight:700; color: #000; margin-top:2px; direction:ltr; }

  .track {
    text-align:center; margin:6px 0; padding:5px 4px;
    border:2px dashed #000; border-radius:3px;
    font-size:15px; font-weight:700; direction:ltr; color: #000;
  }
  .track-lbl { display:block; font-size:10px; font-weight:700; color:#000; direction:rtl; margin-bottom:2px; }

  .r { display:flex; justify-content:space-between; align-items:baseline; padding:3px 1px; font-size:12px; border-bottom:1px dotted #000; }
  .r .lbl { color:#000; font-weight:700; font-size:11px; white-space:nowrap; }
  .r .val { color:#000; font-weight:700; text-align:left; direction:ltr; unicode-bidi:embed; max-width:60%; word-break:break-word; }

  .divider { border:none; border-top:1.5px dashed #000; margin:6px 0; }

  .amt-wrap { display:flex; gap:4px; margin:6px 0 4px; }
  .amt-box { flex:1; border:1.5px solid #000; border-radius:4px; padding:5px 3px; text-align:center; overflow:hidden; }
  .amt-box .albl { font-size:10px; font-weight:700; color:#000; display:block; margin-bottom:2px; }
  .amt-box .aval { font-size:13px; font-weight:700; color:#000; direction:ltr; unicode-bidi:embed; display:block; }
  
  /* تم إزالة الخلفية الرمادية واستبدالها بإطار أسمك لتمييز الصافي */
  .amt-box.net { border: 2.5px solid #000; background: transparent; }
  .amt-box.net .aval { font-size:14px; }

  .footer { display:flex; justify-content:space-between; margin-top:8px; padding-top:6px; border-top:2px solid #000; }
  .sig { text-align:center; width:45%; font-size:11px; font-weight:700; color:#000; }
  .sig-line { border-top:1.5px solid #000; margin-top:16px; padding-top:2px; }
</style>
</head>
<body>

  <div class="hdr">
    <div class="logo"><i class="fa-solid fa-bolt-lightning"></i>
   <span class="pay">Flash</span> <span class="flash">Pay</span></div>

    <div class="sub">إيصال تسليم حوالة صادرة</div>
    <div class="dt">${printDate}</div>
  </div>

  <div class="track">
    <span class="track-lbl">رمز التتبع (Tracking Code)</span>
    ${trackingCode}
  </div>

  <div class="r"><span class="lbl">المرسل</span>      <span class="val">${senderName}</span></div>
  <div class="r"><span class="lbl">دولة المرسل</span> <span class="val">${senderCountry}</span></div>
  <hr class="divider">
  <div class="r"><span class="lbl">المستلم</span>     <span class="val">${receiverName}</span></div>
  <div class="r"><span class="lbl">رقم الهاتف</span>  <span class="val">${receiverPhone}</span></div>

  <div class="amt-wrap">
    <div class="amt-box">
      <span class="albl">المبلغ المرسل</span>
      <span class="aval">${sendAmount}</span>
      <span class="albl">${sendCurrencyCode}</span>
    </div>
    <div class="amt-box net">
      <span class="albl">صافي التسليم</span>
      <span class="aval">${deliveryAmount}</span>
      <span class="albl">${deliveryCurrencyCode}</span>
    </div>
  </div>

  <div class="footer">
    <div class="sig">توقيع الموظف<div class="sig-line"></div></div>
    <div class="sig">توقيع المستلم<div class="sig-line"></div></div>
  </div>

</body>
</html>`;

  const printWin = window.open("", "_blank", "width=400,height=600");

  if (!printWin) {
    alert("يرجى السماح بالنوافذ المنبثقة (Popups) لهذا الموقع ثم أعد المحاولة");
    return;
  }

  printWin.document.open();
  printWin.document.write(receiptHtml);
  printWin.document.close();

  printWin.onload = function () {
    printWin.document.fonts.ready.then(function () {
      printWin.focus();
      printWin.print();
      printWin.onafterprint = function () {
        printWin.close();
      };
      setTimeout(function () {
        if (!printWin.closed) printWin.close();
      }, 5000);
    });
  };
}
/* ======================================= */
/*        INTERNAL TRANSFERS              */
/* ======================================= */

/* تحديث الـ radio UI */
function updateFeeRadio() {
  const senderCard = document.getElementById("radio-sender-card");
  const receiverCard = document.getElementById("radio-receiver-card");
  const senderRadio = document.getElementById("fee-sender");
  if (!senderCard) return;
  if (senderRadio.checked) {
    senderCard.classList.add("active");
    receiverCard.classList.remove("active");
  } else {
    receiverCard.classList.add("active");
    senderCard.classList.remove("active");
  }
  updateInternalSummary();
}

/* تحديث ملخص الحوالة */
function updateInternalSummary() {
  const amount = parseFloat(document.getElementById("int-amount")?.value) || 0;
  const commission =
    parseFloat(document.getElementById("int-commission")?.value) || 0;
  const currency = document.getElementById("int-currency")?.value || "SYP";
  const feePayer =
    document.querySelector('input[name="fee_payer"]:checked')?.value ||
    "sender";

  const net = feePayer === "receiver" ? amount - commission : amount;
  const fmt = (v) =>
    v.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const sentEl = document.getElementById("sum-sent");
  const feeEl = document.getElementById("sum-fee");
  const netEl = document.getElementById("sum-net");

  if (sentEl) sentEl.textContent = `${fmt(amount)} ${currency}`;
  if (feeEl)
    feeEl.textContent =
      commission > 0 ? `−${fmt(commission)} ${currency}` : "— لا توجد رسوم";
  if (netEl) netEl.textContent = `${fmt(net)} ${currency}`;
}

/* ربط الأحداث على الحقول */
function bindInternalListeners() {
  ["int-amount", "int-commission", "int-currency"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", updateInternalSummary);
  });
  document
    .querySelectorAll('input[name="fee_payer"]')
    .forEach((r) => r.addEventListener("change", updateFeeRadio));
}

/* ────────────────────────────────────────
   حفظ الحوالة → POST /api/internal-transfers
   ──────────────────────────────────────── */
async function saveInternalTransfer() {
  const senderName = document.getElementById("int-sender").value.trim();
  const receiverName = document.getElementById("int-receiver").value.trim();
  const phone = document.getElementById("int-phone").value.trim();
  const province = document.getElementById("int-province").value;
  const amount = parseFloat(document.getElementById("int-amount").value) || 0;
  const commission =
    parseFloat(document.getElementById("int-commission").value) || 0;
  const currency = document.getElementById("int-currency").value;
  const feePayer =
    document.querySelector('input[name="fee_payer"]:checked')?.value ||
    "sender";

  // تحقق أساسي
  if (!senderName) {
    alert("يرجى إدخال اسم المرسل");
    return;
  }
  if (!receiverName) {
    alert("يرجى إدخال اسم المستلم");
    return;
  }
  if (!phone) {
    alert("يرجى إدخال رقم موبايل المستلم");
    return;
  }
  if (amount <= 0) {
    alert("يرجى إدخال مبلغ صحيح");
    return;
  }
  if (!province) {
    alert("يرجى اختيار المحافظة (الوجهة)");
    return;
  }

  // تعطيل الزر
  const btn = document.querySelector(".int-btn-save");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML =
      '<div class="loading-spinner" style="width:16px;height:16px;border-width:2px;margin:0 auto;"></div>';
  }

  // جلب office_id من /me
  let officeId = null;
  try {
    const meRes = await fetch(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const meData = await meRes.json();
    officeId = meData?.user?.office_id ?? null;
  } catch (e) {
    /* سنتابع بدون office_id إذا فشل */
  }

  const today = new Date().toISOString().slice(0, 10);

  const payload = {
    office_id: officeId,
    sender_name: senderName,
    receiver_name: receiverName,
    receiver_phone: phone,
    destination_province: province,
    amount,
    commission,
    currency,
    fee_payer: feePayer,
    is_paid: false,
    transfer_date: today,
  };

  try {
    const res = await fetch(`${API_URL}/internal-transfers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok && data.status === "success") {
      // بناء كائن الطباعة من رد الـ API
      const saved = data.data;
      const printObj = {
        id: saved.id,
        sender: saved.sender_name,
        receiver: saved.receiver_name,
        province: saved.destination_province,
        phone: saved.receiver_phone,

        amount: parseFloat(saved.amount),

        commission: parseFloat(saved.commission),
        currency: saved.currency,
        feePayer: saved.fee_payer,
        net:
          saved.fee_payer === "receiver"
            ? parseFloat(saved.amount) - parseFloat(saved.commission)
            : parseFloat(saved.amount),
        date: saved.created_at ?? new Date().toISOString(),
      };

      printInternalReceipt(printObj);
      resetInternalForm();
      loadInternalTransfers();
      // ربح الداخلية → profit_main (يُعالج في الباك)
      console.log(
        "[Cashier] Internal transfer commission:",
        saved.commission,
        "fee_payer:",
        saved.fee_payer,
      );
      showInternalToast("✅ تم حفظ الحوالة الداخلية وطباعة الإيصال");
    } else {
      alert(data.message || "فشل الحفظ، يرجى المحاولة مجدداً");
    }
  } catch (err) {
    console.error("Internal transfer save error:", err);
    alert("خطأ في الاتصال بالسيرفر");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML =
        '<i class="fa-solid fa-floppy-disk"></i> حفظ وطباعة الإيصال';
    }
  }
}

/* إعادة تعيين النموذج */
function resetInternalForm() {
  document.getElementById("int-sender").value = "";
  document.getElementById("int-receiver").value = "";
  document.getElementById("int-phone").value = "";
  document.getElementById("int-amount").value = "";
  document.getElementById("int-commission").value = "0";
  document.getElementById("int-province").value = ""; // <--- لإعادة التعيين
  document.getElementById("fee-sender").checked = true;
  updateFeeRadio();
  updateInternalSummary();
}

/* ────────────────────────────────────────
   تحميل سجل الحوالات الداخلية من API
   GET /api/internal-transfers
   ──────────────────────────────────────── */
async function loadInternalTransfers() {
  const tbody = document.getElementById("internal-list");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="10" class="loading-row">
        <div class="loading-spinner"></div> جاري التحميل...
      </td>
    </tr>`;

  try {
    const res = await fetch(`${API_URL}/internal-transfers`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const data = await res.json();

    if (
      !res.ok ||
      data.status !== "success" ||
      !Array.isArray(data.data) ||
      data.data.length === 0
    ) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10">
            <div class="empty-state">
              <i class="fa-solid fa-right-left"></i>
              <p>لا توجد حوالات داخلية مسجّلة بعد</p>
            </div>
          </td>
        </tr>`;
      return;
    }

    const fmt = (v, cur) =>
      `${parseFloat(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur ?? ""}`;

    const fmtDate = (iso) => {
      if (!iso) return "—";
      const d = new Date(iso);
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    tbody.innerHTML = data.data
      .map((t, i) => {
        const currency = t.currency ?? "";
        const feePayer = t.fee_payer ?? "sender";
        const amount = parseFloat(t.amount ?? 0);
        const commission = parseFloat(t.commission ?? 0);
        const net = feePayer === "receiver" ? amount - commission : amount;

        // كائن الطباعة
        const printObj = JSON.stringify({
          id: t.id,
          sender: t.sender_name,
          receiver: t.receiver_name,
          province: t.destination_province,
          phone: t.receiver_phone,
          amount,
          commission,
          currency,
          feePayer,
          net,
          date: t.created_at,
        }).replace(/"/g, "&quot;");

        return `
        <tr>
          <td><span class="transfer-id">#${t.id}</span></td>
          <td>${t.sender_name ?? "—"}</td>
          <td>${t.receiver_name ?? "—"}</td>
         <td>${t.destination_province ?? "—"}</td> <td style="direction:ltr;text-align:right;">${t.receiver_phone ?? "—"}</td>
          
          <td><span class="amount-cell">${fmt(amount, currency)}</span></td>
          <td>${commission > 0 ? fmt(commission, currency) : "—"}</td>
          <td><span class="delivery-price">${fmt(net, currency)}</span></td>
          <td>
            <span class="fee-payer-badge ${feePayer}">
              <i class="fa-solid fa-${feePayer === "sender" ? "user-tie" : "user-check"}"></i>
              ${feePayer === "sender" ? "المرسل" : "المستلم"}
            </span>
          </td>
          <td style="direction:ltr;text-align:right;font-size:12px;color:var(--gray);">${fmtDate(t.created_at)}</td>
          <td>
            <button class="btn-reprint" onclick='printInternalReceipt(JSON.parse(this.dataset.tx))' data-tx="${printObj}">
              <i class="fa-solid fa-print"></i> طباعة
            </button>
          </td>
        </tr>`;
      })
      .join("");
  } catch (err) {
    console.error("loadInternalTransfers error:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="loading-row" style="color:var(--danger);">
          خطأ في الاتصال بالسيرفر
        </td>
      </tr>`;
  }
}

/* Toast بسيط */
function showInternalToast(msg) {
  let toast = document.getElementById("int-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "int-toast";
    toast.style.cssText = `
      position:fixed; bottom:24px; left:50%; transform:translateX(-50%) translateY(20px);
      background:var(--dark); color:#fff; padding:12px 24px; border-radius:30px;
      font-family:'Cairo',sans-serif; font-size:14px; font-weight:700;
      box-shadow:0 8px 30px rgba(0,0,0,0.25); z-index:9999;
      opacity:0; transition:all 0.35s cubic-bezier(0.4,0,0.2,1);
      white-space:nowrap;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
  });
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(20px)";
  }, 3200);
}

function showCompletedSection() {
  document.querySelectorAll(".section").forEach((s) => (s.style.display = "none"));
  document.getElementById("section-completed").style.display = "block";

  document.getElementById("page-heading").textContent = "سجل المكتملة";
  document.querySelector(".page-sub").textContent = "الحوالات المسلّمة";
  document.querySelector(".page-icon").innerHTML =
    '<i class="fa-solid fa-circle-check"></i>';

  loadCompletedTransfers();
}

let _completedAll = []; // كل الحوالات المجلوبة
let _completedPage = 1; // الصفحة الحالية
const COMPLETED_PER_PAGE = 20;

/**
 * جلب الحوالات المكتملة من API
 */
async function loadCompletedTransfers() {
  const tbody = document.getElementById("completed-list");
  const pagination = document.getElementById("completed-pagination");
  tbody.innerHTML = `<tr><td colspan="10" class="loading-row"><div class="loading-spinner"></div> جاري التحميل...</td></tr>`;
  pagination.innerHTML = "";

  try {
    const res = await fetch(`${API_URL}/transfers?status=completed`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const json = await res.json();

    if (json.status === "success" && Array.isArray(json.data)) {
      _completedAll = json.data;
      _completedPage = 1;
      _renderCompleted();
    } else {
      tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state"><i class="fa-solid fa-inbox"></i><p>لا توجد حوالات مكتملة</p></div></td></tr>`;
    }
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="10" class="loading-row" style="color:var(--danger);">خطأ في الاتصال بالسيرفر</td></tr>`;
  }
}

/**
 * تصفية حسب البحث والتواريخ (client-side)
 */
function filterCompleted() {
  _completedPage = 1;
  _renderCompleted();
}

function resetCompletedFilters() {
  document.getElementById("cf-search").value = "";
  document.getElementById("cf-date-from").value = "";
  document.getElementById("cf-date-to").value = "";
  _completedPage = 1;
  _renderCompleted();
}

/**
 * الدالة الرئيسية للعرض
 */
function _renderCompleted() {
  const search = (document.getElementById("cf-search")?.value || "")
    .trim()
    .toLowerCase();
  const dateFrom = document.getElementById("cf-date-from")?.value || "";
  const dateTo = document.getElementById("cf-date-to")?.value || "";

  // --- تصفية ---
  let filtered = _completedAll.filter((tx) => {
    const senderName = (tx.sender?.name || "").toLowerCase();
    const receiverName = (tx.receiver_name || "").toLowerCase();
    const tracking = (tx.tracking_code || "").toLowerCase();

    const matchSearch =
      !search ||
      senderName.includes(search) ||
      receiverName.includes(search) ||
      tracking.includes(search);

    const txDate = (tx.updated_at || tx.created_at || "").slice(0, 10);
    const matchFrom = !dateFrom || txDate >= dateFrom;
    const matchTo = !dateTo || txDate <= dateTo;

    return matchSearch && matchFrom && matchTo;
  });

  // --- إحصاءات ---
  const totalUsd = filtered.reduce(
    (s, t) => s + parseFloat(t.amount_in_usd || 0),
    0,
  );
  const countEl = document.getElementById("completed-count");
  const totalEl = document.getElementById("completed-total");
  if (countEl) countEl.textContent = filtered.length;
  if (totalEl)
    totalEl.textContent =
      "$" +
      totalUsd.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

  // --- Pagination ---
  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / COMPLETED_PER_PAGE),
  );
  if (_completedPage > totalPages) _completedPage = totalPages;
  const start = (_completedPage - 1) * COMPLETED_PER_PAGE;
  const paged = filtered.slice(start, start + COMPLETED_PER_PAGE);

  _renderCompletedRows(paged, filtered.length === 0);
  _renderCompletedPagination(totalPages, filtered.length);
}

/**
 * رسم صفوف الجدول
 */
function _renderCompletedRows(rows, empty) {
  const tbody = document.getElementById("completed-list");

  if (empty) {
    tbody.innerHTML = `
      <tr><td colspan="10">
        <div class="empty-state">
          <i class="fa-solid fa-circle-check"></i>
          <p>لا توجد نتائج تطابق البحث</p>
        </div>
      </td></tr>`;
    return;
  }

  function fmtDate(str) {
    if (!str) return "—";
    const d = new Date(str);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  tbody.innerHTML = rows
    .map((tx) => {
      const amountUsd = parseFloat(tx.amount_in_usd ?? 0);
      const currPrice = parseFloat(tx.currency?.price ?? 1);
      const currCode = tx.currency?.code ?? "—";
      const sendAmt = parseFloat(tx.amount ?? 0);
      const sendCur = tx.send_currency?.code ?? tx.sendCurrency?.code ?? "—";
      const deliveryAmt = currPrice > 0 ? amountUsd / currPrice : 0;
      const fee = parseFloat(tx.fee ?? 0);
      const txDate = fmtDate(tx.updated_at || tx.created_at);
      const txJson = JSON.stringify(tx)
        .replace(/'/g, "\'")
        .replace(/"/g, "&quot;");

      return `
    <tr>
      <td><span class="transfer-id">${tx.tracking_code ?? "#" + tx.id}</span></td>
      <td>
        ${tx.sender?.name ?? "—"}
        <div style="font-size:10px;color:var(--gray);">${tx.sender?.phone ?? ""}</div>
      </td>
      <td>
        ${tx.receiver_name ?? "—"}
        <div style="font-size:10px;color:var(--gray);direction:ltr;">${tx.receiver_phone ?? ""}</div>
      </td>
      <td>
        <span style="direction:ltr;display:inline-block;">
          ${sendAmt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <small style="color:var(--gray);font-size:11px;"> ${sendCur}</small>
        </span>
      </td>
      <td><span class="amount-cell">$${amountUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></td>
      <td><span class="delivery-price">${deliveryAmt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></td>
      <td>${currCode}</td>
      <td style="font-weight:700;color:var(--success);">${fee > 0 ? "$" + fee.toFixed(2) : "—"}</td>
      <td style="font-size:12px;color:var(--gray);direction:ltr;text-align:right;">${txDate}</td>
      <td>
        <button class="btn-print-completed" onclick='printTransferReceipt(${txJson})'>
          <i class="fa-solid fa-print"></i> طباعة
        </button>
      </td>
    </tr>`;
    })
    .join("");
}

/**
 * رسم أزرار Pagination
 */
function _renderCompletedPagination(totalPages, totalCount) {
  const el = document.getElementById("completed-pagination");
  if (!el) return;

  if (totalPages <= 1) {
    el.innerHTML = "";
    return;
  }

  const start = (_completedPage - 1) * COMPLETED_PER_PAGE + 1;
  const end = Math.min(_completedPage * COMPLETED_PER_PAGE, totalCount);

  let html = `
    <button class="pg-btn" onclick="_goPage(${_completedPage - 1})" ${_completedPage === 1 ? "disabled" : ""}>
      <i class="fa-solid fa-chevron-right"></i>
    </button>`;

  // أزرار الأرقام (max 5 ظاهرة)
  const range = 2;
  for (let p = 1; p <= totalPages; p++) {
    if (
      p === 1 ||
      p === totalPages ||
      (p >= _completedPage - range && p <= _completedPage + range)
    ) {
      html += `<button class="pg-btn ${p === _completedPage ? "active" : ""}" onclick="_goPage(${p})">${p}</button>`;
    } else if (
      p === _completedPage - range - 1 ||
      p === _completedPage + range + 1
    ) {
      html += `<span class="pg-info">…</span>`;
    }
  }

  html += `
    <button class="pg-btn" onclick="_goPage(${_completedPage + 1})" ${_completedPage === totalPages ? "disabled" : ""}>
      <i class="fa-solid fa-chevron-left"></i>
    </button>
    <span class="pg-info">${start}–${end} من ${totalCount}</span>`;

  el.innerHTML = html;
}

function _goPage(p) {
  const totalPages = Math.max(
    1,
    Math.ceil(
      (() => {
        const search = (document.getElementById("cf-search")?.value || "")
          .trim()
          .toLowerCase();
        const dateFrom = document.getElementById("cf-date-from")?.value || "";
        const dateTo = document.getElementById("cf-date-to")?.value || "";
        return _completedAll.filter((tx) => {
          const matchSearch =
            !search ||
            (tx.sender?.name || "").toLowerCase().includes(search) ||
            (tx.receiver_name || "").toLowerCase().includes(search) ||
            (tx.tracking_code || "").toLowerCase().includes(search);
          const txDate = (tx.updated_at || tx.created_at || "").slice(0, 10);
          return (
            matchSearch &&
            (!dateFrom || txDate >= dateFrom) &&
            (!dateTo || txDate <= dateTo)
          );
        }).length;
      })() / COMPLETED_PER_PAGE,
    ),
  );
  if (p < 1 || p > totalPages) return;
  _completedPage = p;
  _renderCompleted();
  document
    .getElementById("section-completed")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}
/* ======================================= */
/*    PRINT INTERNAL TRANSFER RECEIPT     */
/* ======================================= */

function printInternalReceipt(t) {
  if (!t) return;

  function toEn(val) {
    return String(val ?? "—")
      .replace(/[\u0660-\u0669]/g, (d) => d.charCodeAt(0) - 0x0660)
      .replace(/[\u06F0-\u06F9]/g, (d) => d.charCodeAt(0) - 0x06f0);
  }
  function fmtN(val, dec = 2) {
    const n = parseFloat(val ?? 0);
    return toEn(
      isNaN(n)
        ? "0.00"
        : n.toLocaleString("en-US", {
            minimumFractionDigits: dec,
            maximumFractionDigits: dec,
          }),
    );
  }

  const now = new Date(t.date || Date.now());
  const pad = (n) => String(n).padStart(2, "0");
  const printDate = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())}  ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const feePayerAr = t.feePayer === "sender" ? "المرسل" : "المستلم";
  const commissionLine =
    t.commission > 0
      ? `<div class="r"><span class="lbl">الرسوم (على ${feePayerAr})</span><span class="val">−${fmtN(t.commission)} ${t.currency}</span></div>`
      : `<div class="r"><span class="lbl">الرسوم</span><span class="val">لا توجد رسوم</span></div>`;

  const receiptHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
  @page { size: 80mm auto; margin: 0 !important; }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Cairo', sans-serif;
    width: 72mm; max-width: 72mm;
    margin: 0 auto !important; padding: 2mm; padding-bottom: 0;
    color: #000; font-size: 13px; line-height: 1.45;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
    overflow: hidden;
  }

  /* الهيدر مع شريط مميز للداخلية */
  .hdr {
    text-align: center; padding-bottom: 5px;
    border-bottom: 2px solid #000; margin-bottom: 6px;
  }
  .hdr .logo { font-size: 18px; font-weight: 700; color: #000; }
  .hdr .type-badge {
    display: inline-block;
    background: #000; color: #fff;
    font-size: 10px; font-weight: 800;
    padding: 2px 10px; border-radius: 20px;
    margin: 4px 0; letter-spacing: 0.5px;
  }
  .hdr .sub { font-size: 12px; font-weight: 700; color: #000; margin-top: 1px; }
  .hdr .dt  { font-size: 11px; font-weight: 700; color: #000; margin-top: 2px; direction: ltr; }

  /* رمز الحوالة المتسلسل */
  .ref {
    text-align: center; margin: 6px 0; padding: 5px 4px;
    border: 2px dashed #000; border-radius: 3px;
    font-size: 13px; font-weight: 700; direction: ltr; color: #000;
  }
  .ref-lbl { display: block; font-size: 10px; font-weight: 700; color: #000; direction: rtl; margin-bottom: 2px; }

  .section-title {
    font-size: 10px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.5px; color: #000;
    border-top: 1px solid #000; border-bottom: 1px solid #000;
    padding: 3px 0; margin: 6px 0; text-align: center;
  }

  .r { display: flex; justify-content: space-between; align-items: baseline; padding: 3px 1px; font-size: 12px; border-bottom: 1px dotted #000; }
  .r .lbl { color: #000; font-weight: 700; font-size: 11px; white-space: nowrap; }
  .r .val { color: #000; font-weight: 700; text-align: left; direction: ltr; unicode-bidi: embed; max-width: 60%; word-break: break-word; }

  .divider { border: none; border-top: 1.5px dashed #000; margin: 6px 0; }

  .amt-wrap { display: flex; gap: 4px; margin: 6px 0 4px; }
  .amt-box {
    flex: 1; border: 1.5px solid #000; border-radius: 4px;
    padding: 5px 3px; text-align: center; overflow: hidden;
  }
  .amt-box .albl { font-size: 10px; font-weight: 700; color: #000; display: block; margin-bottom: 2px; }
  .amt-box .aval { font-size: 13px; font-weight: 700; color: #000; direction: ltr; unicode-bidi: embed; display: block; }
  .amt-box.net   { border: 2.5px solid #000; }
  .amt-box.net .aval { font-size: 14px; }

  /* شريط من يدفع الرسوم */
  .fee-strip {
    text-align: center; font-size: 10.5px; font-weight: 800;
    padding: 4px; border: 1.5px solid #000; border-radius: 4px;
    margin: 4px 0;
  }

  .internal-badge {
    text-align: center;
    font-size: 9px; font-weight: 800; color: #000;
    border: 1px solid #000; border-radius: 3px; padding: 2px 6px;
    margin: 4px auto; display: inline-block;
  }

  .footer { display: flex; justify-content: space-between; margin-top: 8px; padding-top: 6px; border-top: 2px solid #000; }
  .sig { text-align: center; width: 45%; font-size: 11px; font-weight: 700; color: #000; }
  .sig-line { border-top: 1.5px solid #000; margin-top: 16px; padding-top: 2px; }
</style>
</head>
<body>

  <div class="hdr">
    <div class="logo">Flash<span>Pay</span></div>
    <div><span class="type-badge">⇄ حوالة داخلية</span></div>
    <div class="sub">إيصال حوالة داخلية</div>
    <div class="dt">${printDate}</div>
  </div>

  <div class="ref">
    <span class="ref-lbl">رقم العملية</span>
    INT-${toEn(t.id)}
  </div>

  <div class="section-title">بيانات المرسل</div>
  <div class="r"><span class="lbl">الاسم</span><span class="val">${t.sender}</span></div>

  <hr class="divider">

  <div class="section-title">بيانات المستلم</div>
  <div class="r"><span class="lbl">الاسم</span>      <span class="val">${t.receiver}</span></div>
  <div class="r"><span class="lbl">الوجهة</span>     <span class="val">${t.province ?? "—"}</span></div> <div class="r"><span class="lbl">رقم الموبايل</span><span class="val">${toEn(t.phone)}</span></div>
  <hr class="divider">

  <div class="amt-wrap">
    <div class="amt-box">
      <span class="albl">المبلغ المرسل</span>
      <span class="aval">${fmtN(t.amount)}</span>
      <span class="albl">${t.currency}</span>
    </div>
    <div class="amt-box net">
      <span class="albl">صافي التسليم</span>
      <span class="aval">${fmtN(t.net)}</span>
      <span class="albl">${t.currency}</span>
    </div>
  </div>

  ${commissionLine}

  ${t.commission > 0 ? `<div class="fee-strip">الرسوم مدفوعة من: ${feePayerAr}</div>` : ""}

  <div class="footer">
    <div class="sig">توقيع الموظف<div class="sig-line"></div></div>
    <div class="sig">توقيع المستلم<div class="sig-line"></div></div>
  </div>
<div style="text-align:center;font-size:10px;color:var(--gray);margin-top:6px;">شكراً لاستخدامكم FlashPay</div>
</body>
</html>`;

  const printWin = window.open("", "_blank", "width=400,height=620");
  if (!printWin) {
    alert("يرجى السماح بالنوافذ المنبثقة (Popups) ثم أعد المحاولة");
    return;
  }
  
  printWin.document.open();
  printWin.document.write(receiptHtml);
  printWin.document.close();
  printWin.onload = function () {
    printWin.document.fonts.ready.then(function () {
      printWin.focus();
      printWin.print();
      printWin.onafterprint = function () {
        printWin.close();
      };
      setTimeout(function () {
        if (!printWin.closed) printWin.close();
      }, 5000);
    });
  };
}

/* ======================================= */
/*      DIGITAL CURRENCY LOGS SECTION     */
/* ======================================= */
 
function showDigitalLogsSection() {
  // الأسطر البديلة لـ _hideAllSections()
  document.getElementById("section-transfers").style.display = "none";
  document.getElementById("section-safes").style.display = "none";
  document.getElementById("section-profits").style.display = "none";
  document.getElementById("section-internal").style.display = "none";
  document.getElementById("section-completed").style.display = "none";
  document.getElementById("section-customers").style.display = "none";

  // إظهار قسم السجل
  document.getElementById("section-digital-logs").style.display = "block";
 
  document.getElementById("page-heading").textContent = "سجل العملات الرقمية";
  document.querySelector(".page-sub").textContent = "عمليات الخزنة الإلكترونية";
  document.querySelector(".page-icon").innerHTML = '<i class="fa-solid fa-bitcoin-sign"></i>';
 
  loadDigitalLogs();
}
 
async function loadDigitalLogs() {
  const tbody = document.getElementById("digital-logs-list");
  if (!tbody) return;
 
  tbody.innerHTML = `<tr><td colspan="9" class="loading-row"><div class="loading-spinner"></div> جاري التحميل...</td></tr>`;
 
  const currency = document.getElementById("dl-filter-currency")?.value || "";
  const action   = document.getElementById("dl-filter-action")?.value || "";
  const dateFrom = document.getElementById("dl-filter-from")?.value || "";
  const dateTo   = document.getElementById("dl-filter-to")?.value || "";
 
  const params = new URLSearchParams();
  if (currency) params.append("currency_type", currency);
  if (action)   params.append("action_type", action);
  if (dateFrom) params.append("date_from", dateFrom);
  if (dateTo)   params.append("date_to", dateTo);
  params.append("per_page", "200");
 
  try {
    const res  = await fetch(`${API_URL}/electronic-safe/logs?${params}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const json = await res.json();
 
    if (!res.ok) {
      tbody.innerHTML = `<tr><td colspan="9" class="loading-row" style="color:var(--danger);">${json.message || "خطأ في جلب البيانات"}</td></tr>`;
      return;
    }
 
    const logs    = json.data || [];
    const totals  = json.totals || {};
    const count   = json.count  ?? logs.length;
 
    /* ── تحديث شريط الأرباح ── */
    const fmt = (v) => parseFloat(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
 
    document.getElementById("dl-buy-profit").textContent  = fmt(totals.total_buy_profit);
    document.getElementById("dl-sell-profit").textContent = fmt(totals.total_sell_profit);
    document.getElementById("dl-total-profit").textContent = fmt(totals.total_profit);
    document.getElementById("dl-count").textContent       = count;
    document.getElementById("dl-stat-profit").textContent = "$" + fmt(totals.total_profit);
 
    if (!logs.length) {
      tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><i class="fa-solid fa-bitcoin-sign"></i><p>لا توجد عمليات تطابق الفلتر المحدد</p></div></td></tr>`;
      return;
    }
 
    const currencyLabels = {
      syp_sham_cash: '<span style="background:#fef3c7;color:#92400e;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:700;">شام كاش ليرة</span>',
      usd_sham_cash: '<span style="background:#dbeafe;color:#1e40af;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:700;">شام كاش دولار</span>',
      usdt:          '<span style="background:#d1fae5;color:#065f46;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:700;">USDT</span>',
    };
 
    function fmtDate(str) {
      if (!str) return "—";
      const d = new Date(str);
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
 
    tbody.innerHTML = logs.map((log, idx) => {
      const actionBadge = log.action_type === "buy"
        ? `<span style="background:#dcfce7;color:#15803d;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;"><i class="fa-solid fa-arrow-down-to-line"></i> شراء</span>`
        : `<span style="background:#fee2e2;color:#b91c1c;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;"><i class="fa-solid fa-arrow-up-from-line"></i> بيع</span>`;
 
      const profitColor = parseFloat(log.profit) >= 0 ? "#15803d" : "#b91c1c";
 
      return `
      <tr>
        <td style="color:var(--gray);font-size:12px;">${log.id}</td>
        <td>${currencyLabels[log.currency_type] || log.currency_type}</td>
        <td style="text-align:center;">${actionBadge}</td>
        <td><span class="amount-cell">${fmt(log.amount)}</span></td>
        <td style="text-align:center;">${parseFloat(log.commission_rate).toFixed(2)}%</td>
        <td><span class="delivery-price">${fmt(log.net_amount)}</span></td>
        <td style="font-weight:700;color:${profitColor};">${fmt(log.profit)}</td>
        <td style="font-size:12px;color:var(--gray);max-width:160px;word-break:break-word;">${log.note || "—"}</td>
        <td style="font-size:11px;color:var(--gray);white-space:nowrap;direction:ltr;text-align:right;">${fmtDate(log.created_at)}</td>
      </tr>`;
    }).join("");
 
  } catch (err) {
    console.error("loadDigitalLogs error:", err);
    tbody.innerHTML = `<tr><td colspan="9" class="loading-row" style="color:var(--danger);">خطأ في الاتصال بالسيرفر</td></tr>`;
  }
}
 
