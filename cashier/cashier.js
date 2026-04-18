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
        method: "PATCH",
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
  document.getElementById("section-transfers").style.display = "block";
  document.getElementById("section-safes").style.display = "none";
  document.getElementById("section-profits").style.display = "none";
  document.getElementById("section-internal").style.display = "none";
  document.getElementById("section-completed").style.display = "none";
  document.getElementById("section-customers").style.display = "none";

  document.getElementById("page-heading").textContent = "الحوالات";
  document.querySelector(".page-sub").textContent = "جاهزة للتسليم";
  document.querySelector(".page-icon").innerHTML =
    '<i class="fa-solid fa-money-bill-transfer"></i>';

  loadNewTransfers();
}

function showSafesSection() {
  document.getElementById("section-transfers").style.display = "none";
  document.getElementById("section-safes").style.display = "block";
  document.getElementById("section-profits").style.display = "none";
  document.getElementById("section-internal").style.display = "none";
  document.getElementById("section-completed").style.display = "none";
  document.getElementById("section-customers").style.display = "none";
  document.getElementById("page-heading").textContent = "التداول";
  document.querySelector(".page-sub").textContent = "صناديق التداول";
  document.querySelector(".page-icon").innerHTML =
    '<i class="fa-solid fa-vault"></i>';

  loadTradingSafes();
}

function showProfitsSection() {
  document.getElementById("section-transfers").style.display = "none";
  document.getElementById("section-safes").style.display = "none";
  document.getElementById("section-profits").style.display = "block";
  document.getElementById("section-internal").style.display = "none";
  document.getElementById("section-completed").style.display = "none";
  document.getElementById("section-customers").style.display = "none";

  document.getElementById("page-heading").textContent = "أرباح التداول";
  document.querySelector(".page-sub").textContent = "تقرير يومي";
  document.querySelector(".page-icon").innerHTML =
    '<i class="fa-solid fa-chart-line"></i>';
}

function showInternalSection() {
  document.getElementById("section-transfers").style.display = "none";
  document.getElementById("section-safes").style.display = "none";
  document.getElementById("section-profits").style.display = "none";
  document.getElementById("section-internal").style.display = "block";
  document.getElementById("section-completed").style.display = "none";
  document.getElementById("section-customers").style.display = "none";

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

async function loadTradingSafes() {
  const container = document.getElementById("safes-container");
  container.innerHTML = `<div class="loading-row" style="padding:40px;text-align:center;grid-column:1/-1;"><div class="loading-spinner" style="margin:0 auto 10px;"></div> جاري التحميل...</div>`;

  try {
    const [safesRes, meRes] = await Promise.all([
      fetch(`${API_URL}/safes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }),
      fetch(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }),
    ]);
    const safesJson = await safesRes.json();
    const meData = await meRes.json();
    const myOfficeId = meData.user?.office_id;
    const mySafes = (safesJson.data || []).filter(
      (s) => s.office_id === myOfficeId,
    );

    if (!mySafes.length) {
      container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fa-solid fa-vault"></i><p>لا توجد صناديق متاحة حالياً</p></div>`;
      return;
    }

    const officeSafe = mySafes.find((s) => s.type === "office_safe");
    const mainSafe = mySafes.find((s) => s.type === "office_main");
    const tradingSafe = mySafes.find((s) => s.type === "trading");
    const profitSafe = mySafes.find((s) => s.type === "profit_safe") || {
      profit_trade: 0,
      profit_main: 0,
    };

    let html = "";

    if (officeSafe) {
      html += `
      <div class="safe-card safe-card-office">
        <div class="safe-card-header">
          <div class="safe-card-icon"><i class="fa-solid fa-building-columns"></i></div>
          <div><div class="safe-card-title">خزنة المكتب</div><div class="safe-card-subtitle">USD + SYP</div></div>
        </div>
        <div class="safe-card-balance">${parseFloat(officeSafe.balance).toLocaleString()}</div>
        <div class="safe-card-currency">USD</div>
        ${
          parseFloat(officeSafe.balance_sy || 0) > 0
            ? `
        <div style="padding:8px 12px;background:rgba(234,88,12,.07);border-radius:8px;margin-top:8px;display:flex;align-items:center;gap:6px;">
          <i class="fa-solid fa-coins" style="color:#ea580c;font-size:13px;"></i>
          <span style="font-size:13px;color:var(--gray);">رصيد الليرة السورية:</span>
          <span style="font-size:18px;font-weight:800;color:#ea580c;">${parseFloat(officeSafe.balance_sy || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })} SYP</span>
        </div>`
            : ""
        }
      </div>`;
    }

    if (mainSafe) {
      html += `
      <div class="safe-card safe-card-main">
        <div class="safe-card-header">
          <div class="safe-card-icon"><i class="fa-solid fa-vault"></i></div>
          <div><div class="safe-card-title">الصندوق الرئيسي</div><div class="safe-card-subtitle">USD</div></div>
        </div>
        <div class="safe-card-balance">${parseFloat(mainSafe.balance).toLocaleString()}</div>
        <div class="safe-card-currency">USD</div>
      </div>`;
    }

    if (tradingSafe) {
      html += `
      <div class="safe-card safe-card-trading">
        <div class="safe-card-header">
          <div class="safe-card-icon"><i class="fa-solid fa-chart-line"></i></div>
          <div><div class="safe-card-title">صندوق التداول</div><div class="safe-card-subtitle">${tradingSafe.currency || "USD"}</div></div>
        </div>
        <div class="safe-card-balance">${parseFloat(tradingSafe.balance).toLocaleString()}</div>
        <div class="safe-card-currency">${tradingSafe.currency || "USD"}</div>
        ${tradingSafe.cost !== null && tradingSafe.cost !== undefined ? `<div class="safe-cost">متوسط التكلفة: <span>${parseFloat(tradingSafe.cost).toFixed(2)}</span></div>` : ""}
        ${buildTradingUI(tradingSafe.currency_id, tradingSafe.office_id)}
      </div>`;
    }

    html += `
    <div class="safe-card" style="border-color:#8b5cf6;">
      <div class="safe-card-header">
        <div class="safe-card-icon" style="background:#ede9fe;color:#7c3aed;"><i class="fa-solid fa-sack-dollar"></i></div>
        <div><div class="safe-card-title">صندوق الأرباح (Profit Safe)</div><div class="safe-card-subtitle">USD</div></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:15px;">
        <div>
          <div style="font-size:10px;color:var(--gray);">أرباح التداول</div>
          <div style="font-size:16px;font-weight:800;color:#15803d;">SYP${parseFloat(profitSafe.profit_trade || 0).toFixed(2)}</div>
        </div>
        <div>
          <div style="font-size:10px;color:var(--gray);">أرباح رئيسية</div>
          <div style="font-size:16px;font-weight:800;color:#1d4ed8;">$${parseFloat(profitSafe.profit_main || 0).toFixed(2)}</div>
        </div>
      </div>
    </div>`;

    container.innerHTML = html;
  } catch (error) {
    console.error("Error loading safes:", error);
    container.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:40px;color:var(--danger);">خطأ في الاتصال بالسيرفر</p>`;
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
const dest =
        [tx.destination_country, tx.destination_city]
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
  if (!officeId || !currencyId) {
    alert("بيانات الصندوق غير مكتملة، يرجى تحديث الصفحة");
    return;
  }

  const amount = parseFloat(
    document.getElementById(`${type}_amount_${currencyId}`)?.value,
  );
  const price = parseFloat(
    document.getElementById(`${type}_price_${currencyId}`)?.value,
  );

  if (!amount || amount <= 0 || !price || price <= 0) {
    alert("يرجى إدخال قيم صحيحة للكمية والسعر");
    return;
  }

  const payload = {
    office_id: officeId,
    currency_id: currencyId,
    amount: amount,
  };
  if (type === "buy") payload.buy_price = parseFloat(price);
  else payload.sell_price = parseFloat(price);

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
      alert(
        type === "buy"
          ? "✅ تمت عملية الشراء بنجاح"
          : `✅ تمت عملية البيع!\nالربح: ${data.profit}`,
      );
      loadTradingSafes();
    } else {
      alert(data.message || "فشلت العملية");
    }
  } catch (error) {
    alert("خطأ في الاتصال بالسيرفر");
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
  document.getElementById("section-transfers").style.display = "none";
  document.getElementById("section-safes").style.display = "none";
  document.getElementById("section-profits").style.display = "none";
  document.getElementById("section-internal").style.display = "none";
  document.getElementById("section-completed").style.display = "none";
  document.getElementById("section-customers").style.display = "block";

  document.getElementById("page-heading").textContent = "إنشاء حوالة";
  document.querySelector(".page-sub").textContent = "اختر الزبون وأنشئ الحوالة";
  document.querySelector(".page-icon").innerHTML =
    '<i class="fa-solid fa-users"></i>';

  loadCustomers();
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
  document.getElementById("section-transfers").style.display = "none";
  document.getElementById("section-safes").style.display = "none";
  document.getElementById("section-profits").style.display = "none";
  document.getElementById("section-internal").style.display = "none";
  document.getElementById("section-completed").style.display = "block";
  document.getElementById("section-customers").style.display = "none";

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
