// =====================================================
//   accountant.js — FlashPay
//   البيانات كلها من API حقيقي — لا يوجد بيانات ثابتة
// =====================================================

const API_URL = "https://flashpay-back-1.onrender.com/api";
const STORAGE_URL = "https://flashpay-back-1.onrender.com/storage";

// ─────────────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────────────
let ALL_TRANSFERS = []; // كل الحوالات القادمة من API
let filteredData = []; // بعد تطبيق الفلاتر
let currentPage = 1;
const PER_PAGE = 15;
let sortField = "created_at";
let sortAsc = false;

// سجل التعديلات
let ALL_HISTORY = [];
let FILTERED_HISTORY = [];
let _historyRange = "week";

// ─────────────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────────────
window.onload = async function () {
  const token = await checkAuth(); // ✅ انتظر التحقق قبل تحميل أي بيانات
  if (!token) return;
  setDate();
  loadUserInfo();
  // إظهار قسم الرئيسية بشكل صريح عند التحميل
  document.querySelectorAll(".section").forEach((s) => {
    s.style.display = "none";
    s.classList.remove("active");
  });
  const dash = document.getElementById("dashboard-section");
  if (dash) {
    dash.style.display = "block";
    dash.classList.add("active");
  }
  await fetchAllTransfers();
};

// ─────────────────────────────────────────────────────
//  AUTH
// ─────────────────────────────────────────────────────
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

    const ALLOWED_ROLES = ["accountant"]; // ✅ صلاحية هذا الـ dashboard

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
    window.location.replace("../login.html");
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
function getHeaders() {
  return {
    Authorization: "Bearer " + localStorage.getItem("auth_token"),
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

// ─────────────────────────────────────────────────────
//  FETCH — جلب كل الحوالات من API
// ─────────────────────────────────────────────────────
async function fetchAllTransfers() {
  showPageLoader(true);
  try {
    const res = await fetch(`${API_URL}/transfers`, { headers: getHeaders() });

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = "../index.html";
      return;
    }

    const json = await res.json();

    if (json.status === "success" && Array.isArray(json.data)) {
      ALL_TRANSFERS = json.data;
    } else {
      ALL_TRANSFERS = [];
      showToast("تعذّر جلب البيانات من الخادم", "error");
    }
  } catch (err) {
    ALL_TRANSFERS = [];
    showToast("خطأ في الاتصال بالخادم 🌐", "error");
  } finally {
    showPageLoader(false);
    renderDashboard();
    renderSummarySection();
    // إذا كان قسم الحوالات مفتوحاً أعِد رسمه
    if (
      document.getElementById("transfers-section")?.classList.contains("active")
    ) {
      filteredData = [...ALL_TRANSFERS];
      updateSummaryBar();
      renderTransfersTable();
      renderPagination();
    }
  }
}

// ─────────────────────────────────────────────────────
//  HELPERS — قراءة حقول API الفعلية
// ─────────────────────────────────────────────────────

/** اسم المرسل — sender هو object من العلاقة */
function senderName(t) {
  return t.sender?.name || "—";
}

/** اسم عملة الإرسال */
function currencyName(t) {
  return t.currency?.name || t.currency?.code || "—";
}

/** اسم عملة الاستلام */
function sendCurrencyName(t) {
  return t.send_currency?.name || t.send_currency?.code || "—";
}

/** تاريخ الإنشاء بصيغة YYYY-MM-DD */
function transferDate(t) {
  return (t.created_at || "").split("T")[0] || "—";
}

/** رقم التتبع أو رقم الحوالة */
function transferRef(t) {
  return t.tracking_code || "#" + t.id;
}

// ─────────────────────────────────────────────────────
//  DATE & USER INFO
// ─────────────────────────────────────────────────────
function setDate() {
  const opts = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const el = document.getElementById("dashboard-date");
  if (el) el.textContent = new Date().toLocaleDateString("ar-SY", opts);
}

function loadUserInfo() {
  try {
    const u = JSON.parse(localStorage.getItem("user_data") || "{}");
    if (u.name) {
      setText("user-name", u.name);
      setText("hero-name", u.name.split(" ")[0]);
    }
  } catch (e) {}
}

// ─────────────────────────────────────────────────────
//  NAVIGATION
// ─────────────────────────────────────────────────────
function showSection(name) {
  // إخفاء كل الأقسام
  document.querySelectorAll(".section").forEach((s) => {
    s.classList.remove("active");
    s.style.display = "none";
  });
  document
    .querySelectorAll(".sidebar nav li")
    .forEach((l) => l.classList.remove("active"));

  const target = document.getElementById(name + "-section");
  if (target) {
    target.style.display = "block";
    target.classList.add("active");
  }
  document.getElementById("nav-" + name)?.classList.add("active");

  const titles = {
    dashboard: "لوحة المحاسب",
    transfers: "سجل الحوالات",
    summary: "ملخص الحسابات",
    trading: "أرباح التداول",
    reports: "التقارير",
    "edit-history": "سجل التعديلات",
    "acct-safes": "الصناديق",
    "acct-internal": "الحوالات الداخلية",
    "monthly-closing": "الإقفال الشهري",
    "bank-transfers": "الحوالات البنكية",
    "digital-logs": "سجل العملات الرقمية",
  };
  setText("page-heading", titles[name] || "");

  if (name === "transfers") renderTransfersSection();
  if (name === "summary") renderSummarySection();
  if (name === "trading") initTradingSection();
  if (name === "edit-history") initHistorySection();
  if (name === "acct-safes") loadAccountantSafes();
  if (name === "acct-internal") loadAccountantInternals();
  if (name === "monthly-closing") initMonthlyClosing();
  if (name === "reports") populateCountryFilter();
  if (name === "bank-transfers") loadBankTransfers();
  if (name === "digital-logs") loadDigitalLogs();

  closeSidebar();
}

// ─────────────────────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────────────────────
function renderDashboard() {
  const all = ALL_TRANSFERS;
  const today = new Date().toISOString().split("T")[0];

  const todayItems = all.filter((t) => transferDate(t) === today);
  const completed = all.filter((t) => t.status === "completed");
  const pending = all.filter((t) => t.status === "pending");
  const cancelled = all.filter(
    (t) => t.status === "cancelled" || t.status === "rejected",
  );

  // amount_in_usd هو المبلغ المحوّل بالدولار
  const totalUSD = all.reduce(
    (s, t) => s + parseFloat(t.amount_in_usd || 0),
    0,
  );
  // fee هي العمولة
  const totalFees = all.reduce((s, t) => s + parseFloat(t.fee || 0), 0);

  setText("stat-total", fmt(all.length));
  setText("stat-today-count", "اليوم: " + todayItems.length);
  setText("stat-completed", fmt(completed.length));
  setText(
    "stat-completed-pct",
    "النسبة: " +
      (all.length ? Math.round((completed.length / all.length) * 100) : 0) +
      "%",
  );
  setText("stat-pending", fmt(pending.length));
  setText("stat-amount", fmtMoney(totalUSD));
  setText("stat-commission", fmtMoney(totalFees));
  setText("stat-cancelled", fmt(cancelled.length));

  renderWeekChart(all);
  renderStatusChart(all);
  renderRecentTable(all);
}

function renderWeekChart(all) {
  const box = document.getElementById("week-chart");
  if (!box) return;

  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    days.push({
      label: d.toLocaleDateString("ar", { weekday: "short" }),
      count: all.filter((t) => transferDate(t) === ds).length,
    });
  }

  const max = Math.max(...days.map((d) => d.count), 1);
  box.innerHTML = days
    .map(
      (d) => `
        <div class="mini-bar-wrap">
            <div class="mini-bar"
                 style="height:${Math.max(4, Math.round((d.count / max) * 72))}px"
                 title="${d.count} حوالة"></div>
            <div class="mini-bar-label">${d.label}</div>
        </div>
    `,
    )
    .join("");
}

function renderStatusChart(all) {
  // جمع الحالات الفعلية الموجودة في البيانات
  const counts = {};
  all.forEach((t) => {
    const s = t.status || "unknown";
    counts[s] = (counts[s] || 0) + 1;
  });

  const colorMap = {
    completed: "#10b981",
    pending: "#f59e0b",
    cancelled: "#ef4444",
    rejected: "#ef4444",
    approved: "#3b82f6",
    waiting: "#06b6d4",
    ready: "#7c3aed",
  };

  const labelMap = {
    completed: "مكتملة",
    pending: "معلقة",
    cancelled: "ملغاة",
    rejected: "مرفوضة",
    approved: "موافق عليها",
    waiting: "قيد الانتظار",
    ready: "جاهزة للتسليم",
  };

  const total = all.length || 1;
  const el = document.getElementById("status-chart");
  if (!el) return;

  el.innerHTML =
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([s, count]) => {
        const color = colorMap[s] || "#9ca3af";
        const label = labelMap[s] || s;
        return `
                <div class="type-row">
                    <div class="type-dot" style="background:${color}"></div>
                    <div class="type-name">${label}</div>
                    <div class="type-bar-bg">
                        <div class="type-bar-fill"
                             style="width:${Math.round((count / total) * 100)}%;background:${color}"></div>
                    </div>
                    <div class="type-count" style="color:${color}">${count}</div>
                </div>
            `;
      })
      .join("") ||
    '<p style="color:var(--gray);font-size:0.8rem;text-align:center;padding:10px;">لا توجد بيانات</p>';
}

function renderRecentTable(all) {
  const tbody = document.getElementById("recent-tbody");
  if (!tbody) return;

  const rows = all.slice(0, 10);
  tbody.innerHTML = rows.length
    ? rows
        .map(
          (t) => `
            <tr>
                <td style="font-weight:700;color:var(--primary);">${transferRef(t)}</td>
                <td>${senderName(t)}</td>
                <td>${t.receiver_name || "—"}</td>
                <td style="font-weight:700;">${fmtMoney(t.amount_in_usd)} USD</td>
                <td><span class="badge badge-purple">${currencyName(t)}</span></td>
                <td>${statusBadge(t.status)}</td>
                <td>${transferDate(t)}</td>
            </tr>
        `,
        )
        .join("")
    : `<tr><td colspan="7">
               <div class="empty-state">
                   <i class="fa-solid fa-inbox"></i>
                   <p>لا توجد حوالات حتى الآن</p>
               </div>
           </td></tr>`;
}

// ─────────────────────────────────────────────────────
//  TRANSFERS SECTION
// ─────────────────────────────────────────────────────
function renderTransfersSection() {
  filteredData = [...ALL_TRANSFERS];
  currentPage = 1;
  sortData();
  updateSummaryBar();
  renderTransfersTable();
  renderPagination();
}

function applyFilters() {
  const search = document
    .getElementById("search-input")
    .value.trim()
    .toLowerCase();
  const status = document.getElementById("status-filter").value;
  const currency = document.getElementById("currency-filter").value;
  const from = document.getElementById("date-from").value;
  const to = document.getElementById("date-to").value;

  filteredData = ALL_TRANSFERS.filter((t) => {
    if (search) {
      const hay =
        `${transferRef(t)} ${senderName(t)} ${t.receiver_name || ""} ${t.receiver_phone || ""}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    if (status && t.status !== status) return false;
    if (currency && currencyName(t) !== currency) return false;
    if (from && transferDate(t) < from) return false;
    if (to && transferDate(t) > to) return false;
    return true;
  });

  sortData();
  currentPage = 1;
  updateSummaryBar();
  renderTransfersTable();
  renderPagination();
}

function resetFilters() {
  [
    "search-input",
    "status-filter",
    "currency-filter",
    "date-from",
    "date-to",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  applyFilters();
}

function sortTable(field) {
  sortField = sortField === field ? sortField : field;
  sortAsc = sortField === field ? !sortAsc : false;
  sortField = field;
  sortData();
  renderTransfersTable();
}

function sortData() {
  filteredData.sort((a, b) => {
    let av, bv;
    if (sortField === "amount") {
      av = parseFloat(a.amount_in_usd || 0);
      bv = parseFloat(b.amount_in_usd || 0);
      return sortAsc ? av - bv : bv - av;
    }
    av = sortField === "date" ? transferDate(a) : String(a[sortField] || "");
    bv = sortField === "date" ? transferDate(b) : String(b[sortField] || "");
    return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
  });
}

function updateSummaryBar() {
  const totalUSD = filteredData.reduce(
    (s, t) => s + parseFloat(t.amount_in_usd || 0),
    0,
  );
  const totalFees = filteredData.reduce(
    (s, t) => s + parseFloat(t.fee || 0),
    0,
  );
  const completed = filteredData.filter((t) => t.status === "completed").length;
  const pending = filteredData.filter((t) => t.status === "pending").length;

  // مجموع المبالغ الأصلية مجمّعة حسب عملة الإرسال
  const byCurr = {};
  filteredData.forEach((t) => {
    const c = currencyName(t);
    byCurr[c] = (byCurr[c] || 0) + parseFloat(t.amount || 0);
  });
  const currSummary =
    Object.entries(byCurr)
      .map(([c, v]) => `${fmtMoney(v)} ${c}`)
      .join(" | ") || "—";

  setText("sb-total-count", filteredData.length);
  setText("sb-total-usd", fmtMoney(totalUSD) + " USD");
  setText("sb-total-orig", currSummary);
  setText("sb-commission", fmtMoney(totalFees) + " USD");
  setText("sb-completed", completed);
  setText("sb-pending", pending);
}

function renderTransfersTable() {
  const start = (currentPage - 1) * PER_PAGE;
  const page = filteredData.slice(start, start + PER_PAGE);
  const tbody = document.getElementById("transfers-tbody");
  if (!tbody) return;

  if (!page.length) {
    tbody.innerHTML = `<tr><td colspan="10">
            <div class="empty-state">
                <i class="fa-solid fa-magnifying-glass"></i>
                <p>لا توجد نتائج مطابقة</p>
            </div>
        </td></tr>`;
    return;
  }

  tbody.innerHTML = page
    .map((t) => {
      // صورة الهوية
      const idImgCell = t.receiver_id_image
        ? `<button onclick="openIdModal('${STORAGE_URL}/${t.receiver_id_image}')"
                       title="عرض هوية المستلم"
                       style="width:32px;height:32px;border:1.5px solid var(--border);
                              background:var(--primary-bg);color:var(--primary);
                              border-radius:8px;cursor:pointer;font-size:13px;
                              display:inline-flex;align-items:center;justify-content:center;
                              transition:var(--transition);"
                       onmouseover="this.style.background='var(--primary)';this.style.color='white';"
                       onmouseout="this.style.background='var(--primary-bg)';this.style.color='var(--primary)';">
                   <i class='fa-solid fa-id-card'></i>
               </button>`
        : `<span style="color:var(--gray);font-size:11px;">—</span>`;

      return `
        <tr>
            <td style="font-weight:700;color:var(--primary);">${transferRef(t)}</td>
            <td>${senderName(t)}</td>
            <td>${t.receiver_name || "—"}</td>
            <td>${t.receiver_phone || "—"}</td>
            <td style="font-weight:700;">
                ${fmtMoney(t.amount)}
                <small style="color:var(--gray);font-size:0.7rem;">${sendCurrencyName(t)}</small>
            </td>
            <td style="font-weight:700;color:var(--secondary);">
                ${fmtMoney(t.amount_in_usd)}
                <small style="color:var(--gray);font-size:0.7rem;">USD</small>
            </td>
            <td style="color:var(--success);font-weight:600;">${fmtMoney(t.fee)}</td>
            <td>${statusBadge(t.status)}</td>
            <td>${transferDate(t)}</td>
            <td>${idImgCell}</td>
            <td>
                <button class="action-btn" onclick="viewTransfer(${t.id})" title="عرض التفاصيل">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        </tr>
    `;
    })
    .join("");
}

function renderPagination() {
  const total = Math.ceil(filteredData.length / PER_PAGE);
  const bar = document.getElementById("pagination-bar");
  if (!bar) return;
  if (total <= 1) {
    bar.innerHTML = "";
    return;
  }

  const start = (currentPage - 1) * PER_PAGE + 1;
  const end = Math.min(currentPage * PER_PAGE, filteredData.length);

  let html = `<span class="pagination-info">عرض ${start}–${end} من ${filteredData.length}</span>`;
  html += `<div class="pagination-btns">`;
  html += `<button class="page-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}>
                <i class="fa-solid fa-chevron-right"></i></button>`;

  const pages = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - currentPage) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "...") pages.push("...");
  }
  pages.forEach((p) => {
    if (p === "...") html += `<button class="page-btn" disabled>…</button>`;
    else
      html += `<button class="page-btn ${p === currentPage ? "active" : ""}" onclick="goPage(${p})">${p}</button>`;
  });

  html += `<button class="page-btn" onclick="goPage(${currentPage + 1})" ${currentPage === total ? "disabled" : ""}>
                <i class="fa-solid fa-chevron-left"></i></button>`;
  html += `</div>`;
  bar.innerHTML = html;
}

function goPage(p) {
  const total = Math.ceil(filteredData.length / PER_PAGE);
  if (p < 1 || p > total) return;
  currentPage = p;
  renderTransfersTable();
  renderPagination();
  document
    .getElementById("transfers-section")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─────────────────────────────────────────────────────
//  SUMMARY SECTION
// ─────────────────────────────────────────────────────
function renderSummarySection() {
  const all = ALL_TRANSFERS;

  const emptyRow = (cols) =>
    `<tr><td colspan="${cols}"><div class="empty-state">
            <i class="fa-solid fa-inbox"></i><p>لا توجد بيانات</p>
         </div></td></tr>`;

  if (!all.length) {
    [
      "currency-summary-tbody",
      "office-summary-tbody",
      "daily-summary-tbody",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = emptyRow(4);
    });
    ["sum-total-amount", "sum-avg-amount", "sum-max-amount"].forEach((id) =>
      setText(id, "—"),
    );
    return;
  }

  // ─ إجماليات ─
  const totalUSD = all.reduce(
    (s, t) => s + parseFloat(t.amount_in_usd || 0),
    0,
  );
  const avgUSD = totalUSD / all.length;
  const maxUSD = Math.max(...all.map((t) => parseFloat(t.amount_in_usd || 0)));

  setText("sum-total-amount", fmtMoney(totalUSD) + " USD");
  setText("sum-avg-amount", fmtMoney(avgUSD) + " USD");
  setText("sum-max-amount", fmtMoney(maxUSD) + " USD");

  // ─ جمع حسب عملة الإرسال ─
  const byCurr = {};
  all.forEach((t) => {
    const c = currencyName(t);
    if (!byCurr[c]) byCurr[c] = { count: 0, amount: 0, amountUSD: 0, fee: 0 };
    byCurr[c].count++;
    byCurr[c].amount += parseFloat(t.amount || 0);
    byCurr[c].amountUSD += parseFloat(t.amount_in_usd || 0);
    byCurr[c].fee += parseFloat(t.fee || 0);
  });

  const currEl = document.getElementById("currency-summary-tbody");
  if (currEl) {
    currEl.innerHTML =
      Object.entries(byCurr)
        .sort((a, b) => b[1].amountUSD - a[1].amountUSD)
        .map(
          ([cur, d]) => `
                <tr>
                    <td><span class="badge badge-purple">${cur}</span></td>
                    <td style="font-weight:700;">${d.count}</td>
                    <td style="font-weight:700;">
                        ${fmtMoney(d.amount)} ${cur}
                        <br><small style="color:var(--gray)">${fmtMoney(d.amountUSD)} USD</small>
                    </td>
                    <td style="color:var(--success);font-weight:600;">${fmtMoney(d.fee)} USD</td>
                </tr>
            `,
        )
        .join("") || emptyRow(4);
  }

  // ─ جمع حسب الحالة (يحل محل "حسب المكتب" لأن المكتب ليس في response مباشرة) ─
  const byStatus = {};
  all.forEach((t) => {
    const s = t.status || "unknown";
    if (!byStatus[s]) byStatus[s] = { count: 0, amountUSD: 0, fee: 0 };
    byStatus[s].count++;
    byStatus[s].amountUSD += parseFloat(t.amount_in_usd || 0);
    byStatus[s].fee += parseFloat(t.fee || 0);
  });

  const offEl = document.getElementById("office-summary-tbody");
  if (offEl) {
    offEl.innerHTML =
      Object.entries(byStatus)
        .sort((a, b) => b[1].count - a[1].count)
        .map(
          ([s, d]) => `
                <tr>
                    <td>${statusBadge(s)}</td>
                    <td style="font-weight:700;">${d.count}</td>
                    <td style="font-weight:700;">${fmtMoney(d.amountUSD)} USD</td>
                    <td style="color:var(--success);font-weight:600;">${fmtMoney(d.fee)} USD</td>
                </tr>
            `,
        )
        .join("") || emptyRow(4);
  }

  // ─ ملخص يومي ─
  const byDay = {};
  all.forEach((t) => {
    const day = transferDate(t);
    if (!byDay[day])
      byDay[day] = { count: 0, amountUSD: 0, completed: 0, pending: 0, fee: 0 };
    byDay[day].count++;
    byDay[day].amountUSD += parseFloat(t.amount_in_usd || 0);
    byDay[day].fee += parseFloat(t.fee || 0);
    if (t.status === "completed") byDay[day].completed++;
    if (t.status === "pending") byDay[day].pending++;
  });

  const dayEl = document.getElementById("daily-summary-tbody");
  if (dayEl) {
    dayEl.innerHTML =
      Object.entries(byDay)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 30)
        .map(
          ([day, d]) => `
                <tr>
                    <td style="font-weight:600;">${day}</td>
                    <td style="font-weight:700;color:var(--primary);">${d.count}</td>
                    <td style="font-weight:700;">${fmtMoney(d.amountUSD)}</td>
                    <td><span class="badge badge-success">${d.completed}</span></td>
                    <td><span class="badge badge-warning">${d.pending}</span></td>
                    <td style="color:var(--success);font-weight:600;">${fmtMoney(d.fee)}</td>
                </tr>
            `,
        )
        .join("") || emptyRow(6);
  }
}

// ─────────────────────────────────────────────────────
//  REPORTS
// ─────────────────────────────────────────────────────

function generateReport() {
  const from = document.getElementById("rep-from")?.value || "";
  const to = document.getElementById("rep-to")?.value || "";
  const status = document.getElementById("rep-status")?.value || "";
  const cur = document.getElementById("rep-currency")?.value || "";
  const country = document.getElementById("rep-country")?.value || "";

  const data = ALL_TRANSFERS.filter((t) => {
    if (from && transferDate(t) < from) return false;
    if (to && transferDate(t) > to) return false;
    if (status && t.status !== status) return false;
    if (cur && currencyName(t) !== cur) return false;
    if (country && !_matchesCountry(t, country)) return false;
    return true;
  });

  const totalUSD = data.reduce(
    (s, t) => s + parseFloat(t.amount_in_usd || 0),
    0,
  );
  const avgUSD = data.length ? totalUSD / data.length : 0;
  const totalFee = data.reduce((s, t) => s + parseFloat(t.fee || 0), 0);

  setText("rep-count", data.length);
  setText("rep-sum", fmtMoney(totalUSD) + " USD");
  setText("rep-avg", fmtMoney(avgUSD) + " USD");
  setText("rep-commission-sum", fmtMoney(totalFee) + " USD");

  const meta = [];
  if (from || to) meta.push(`الفترة: ${from || "—"} → ${to || "—"}`);
  if (status) meta.push(`الحالة: ${status}`);
  if (cur) meta.push(`العملة: ${cur}`);
  if (country) {
    const sel = document.getElementById("rep-country");
    const label = sel?.options[sel.selectedIndex]?.text || country;
    meta.push(`الدولة: ${label}`);
  }
  setText("report-meta", meta.join(" | "));

  const tbody = document.getElementById("report-tbody");
  if (tbody) {
    tbody.innerHTML = data.length
      ? data
          .map((t, i) => {
            // الدولة الوجهة (من العلاقة أو الـ ID)
            const destCountry =
              t.destination_country?.name ||
              (t.destination_country_id ? `#${t.destination_country_id}` : "—");
            const destCity = t.destination_city || "—";

            return `
                <tr>
                    <td style="font-weight:700;color:var(--gray);font-size:12px;">${i + 1}</td>
                    <td style="font-weight:700;color:var(--primary);">${transferRef(t)}</td>
                    <td>${senderName(t)}</td>
                    <td>${t.receiver_name || "—"}</td>
                    <td>
                        <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;
                                     background:#eff6ff;color:#1e40af;border-radius:16px;font-size:11px;font-weight:700;">
                            <i class="fa-solid fa-location-dot" style="font-size:9px;"></i>
                            ${destCountry}
                        </span>
                        <br><small style="color:var(--gray);font-size:11px;">${destCity}</small>
                    </td>
                    <td style="font-weight:700;">${fmtMoney(t.amount_in_usd)} USD</td>
                    <td><span class="badge badge-purple">${currencyName(t)}</span></td>
                    <td style="color:var(--success);font-weight:600;">${fmtMoney(t.fee)}</td>
                    <td>${statusBadge(t.status)}</td>
                    <td>${transferDate(t)}</td>
                </tr>`;
          })
          .join("")
      : `<tr><td colspan="10"><div class="empty-state">
                   <i class="fa-solid fa-magnifying-glass"></i>
                   <p>لا توجد نتائج تطابق الفلاتر المحددة</p>
               </div></td></tr>`;
  }

  const resultEl = document.getElementById("report-result");
  if (resultEl) {
    resultEl.style.display = "block";
    resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function exportReport() {
  const from = document.getElementById("rep-from")?.value || "";
  const to = document.getElementById("rep-to")?.value || "";
  const status = document.getElementById("rep-status")?.value || "";
  const cur = document.getElementById("rep-currency")?.value || "";
  const country = document.getElementById("rep-country")?.value || "";

  const data = ALL_TRANSFERS.filter((t) => {
    if (from && transferDate(t) < from) return false;
    if (to && transferDate(t) > to) return false;
    if (status && t.status !== status) return false;
    if (cur && currencyName(t) !== cur) return false;
    if (country && !_matchesCountry(t, country)) return false;
    return true;
  });

  const headers = [
    "#",
    "رقم_التتبع",
    "المرسل",
    "المستلم",
    "الدولة_الوجهة",
    "المدينة",
    "المبلغ_USD",
    "العملة",
    "العمولة",
    "الحالة",
    "التاريخ",
  ];
  const rows = data.map((t, i) => [
    i + 1,
    transferRef(t),
    senderName(t),
    t.receiver_name || "",
    t.destination_country?.name ||
      (t.destination_country_id ? `#${t.destination_country_id}` : ""),
    t.destination_city || "",
    t.amount_in_usd || 0,
    currencyName(t),
    t.fee || 0,
    t.status || "",
    transferDate(t),
  ]);

  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${v}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("تم تصدير التقرير بنجاح ✓", "success");
}

// ── showSection يدعم monthly-closing و reports مباشرة في الدالة الأصلية ──

// إغلاق مودالَي الـ snapshot والمؤرشفة بمفتاح Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const snap = document.getElementById("closing-snapshot-modal");
    if (snap && !snap.classList.contains("hidden")) {
      closeSnapshotModal();
      return;
    }
    const arch = document.getElementById("archived-transfers-modal");
    if (arch && !arch.classList.contains("hidden")) closeArchivedModal();
  }
});
// ─────────────────────────────────────────────────────
//  MODAL — تفاصيل حوالة
// ─────────────────────────────────────────────────────
function viewTransfer(id) {
  const t = ALL_TRANSFERS.find((x) => x.id === id);
  if (!t) return;

  setHTML("md-id", transferRef(t));
  setHTML("md-status", statusBadge(t.status));
  setText("md-sender", senderName(t));
  setText("md-receiver", t.receiver_name || "—");
  setText("md-phone", t.receiver_phone || "—");
  setText("md-amount", fmtMoney(t.amount) + " " + currencyName(t));
  setText("md-amount-usd", fmtMoney(t.amount_in_usd) + " USD");
  setText("md-currency", currencyName(t));
  setText("md-send-currency", sendCurrencyName(t));
  setText("md-commission", fmtMoney(t.fee));
  setText(
    "md-office",
    t.destination_office_id ? "مكتب #" + t.destination_office_id : "—",
  );
  setText(
    "md-agent",
    t.destination_agent_id ? "وكيل #" + t.destination_agent_id : "—",
  );
  setText("md-date", t.created_at || "—");
  setText("md-tracking", t.tracking_code || "—");

  // صورة الهوية في المودال
  const imgWrap = document.getElementById("md-id-image-wrap");
  const imgEl = document.getElementById("md-id-image");
  if (t.receiver_id_image && imgWrap && imgEl) {
    imgEl.src = `${STORAGE_URL}/${t.receiver_id_image}`;
    imgWrap.style.display = "block";
  } else if (imgWrap) {
    imgWrap.style.display = "none";
  }

  document.getElementById("transfer-modal")?.classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id)?.classList.add("hidden");
}

// ─────────────────────────────────────────────────────
//  REFRESH
// ─────────────────────────────────────────────────────
async function refreshData() {
  const iconEl = document.querySelector('.icon-btn[title="تحديث البيانات"] i');
  if (iconEl) iconEl.classList.add("fa-spin");
  await fetchAllTransfers();
  if (iconEl) iconEl.classList.remove("fa-spin");
  showToast("تم تحديث البيانات ✓", "success");
}

// ═══════════════════════════════════════════════════════
//   أرباح التداول — Trading Profits Section
// ═══════════════════════════════════════════════════════

let TRADING_DATA = []; // كل العمليات من API
let TRADING_FILTERED = []; // بعد فلتر النوع
let _tradingRange = "today";
let _tradingFrom = "";
let _tradingTo = "";

/** يُستدعى عند فتح القسم لأول مرة */
function initTradingSection() {
  // تعيين اليوم كافتراضي
  const today = new Date().toISOString().split("T")[0];
  _tradingFrom = today;
  _tradingTo = today;

  const fromEl = document.getElementById("trading-from");
  const toEl = document.getElementById("trading-to");
  if (fromEl) fromEl.value = today;
  if (toEl) toEl.value = today;

  setText("trading-date-label", formatArabicDate(today));
  loadTradingData();
}

/** زر الاختصارات الزمنية */
function setTradingRange(range, btn) {
  _tradingRange = range;

  // تحديث الـ active
  document
    .querySelectorAll(".trading-quick-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  const customDates = document.getElementById("trading-custom-dates");

  if (range === "custom") {
    customDates.style.display = "block";
    return; // ننتظر ضغط "عرض"
  }

  customDates.style.display = "none";

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  if (range === "today") {
    _tradingFrom = todayStr;
    _tradingTo = todayStr;
  } else if (range === "week") {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay()); // أول الأسبوع
    _tradingFrom = start.toISOString().split("T")[0];
    _tradingTo = todayStr;
  } else if (range === "month") {
    _tradingFrom = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    _tradingTo = todayStr;
  }

  loadTradingData();
}

/** جلب البيانات من API */
async function loadTradingData() {
  // إذا كان وضع مخصص نقرأ الحقول
  if (_tradingRange === "custom") {
    const f = document.getElementById("trading-from")?.value;
    const t = document.getElementById("trading-to")?.value;
    if (!f || !t) {
      showToast("يرجى تحديد تاريخ البداية والنهاية", "error");
      return;
    }
    _tradingFrom = f;
    _tradingTo = t;
  }

  // إخفاء الكروت وإظهار لودر
  _showTradingState("loading");

  try {
    // نجلب كل أيام الفترة — API يدعم ?date= ليوم واحد، لذا نجلب كل يوم على حدة
    const days = getDatesInRange(_tradingFrom, _tradingTo);
    const allTx = [];

    // نجلب بالتوازي (Promise.all) لتسريع الطلب
    const results = await Promise.all(
      days.map((d) =>
        fetch(`${API_URL}/trading/report/details?date=${d}`, {
          headers: getHeaders(),
        })
          .then((r) => r.json())
          .catch(() => null),
      ),
    );

    results.forEach((json) => {
      if (json?.status === "success" && Array.isArray(json.transactions)) {
        allTx.push(...json.transactions);
      }
    });

    TRADING_DATA = allTx;
    TRADING_FILTERED = [...allTx];

    _renderTradingStats();
    _renderTradingChart(days);
    _renderTradingTable();
    _updateTradingLabel();

    if (allTx.length === 0) {
      _showTradingState("empty");
    } else {
      _showTradingState("data");
    }
  } catch (err) {
    console.error(err);
    showToast("خطأ في جلب بيانات التداول", "error");
    _showTradingState("placeholder");
  }
}

/** تحديث بطاقات الإحصاء */
function _renderTradingStats() {
  const data = TRADING_DATA;
  const buys = data.filter((t) => t.type === "buy");
  const sells = data.filter((t) => t.type === "sell");

  const totalBought = buys.reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const totalSold = sells.reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const netProfit = data.reduce((s, t) => s + parseFloat(t.profit || 0), 0);

  const profitColor = netProfit >= 0 ? "var(--success)" : "var(--danger)";
  const profitIcon =
    netProfit >= 0 ? "fa-arrow-trend-up" : "fa-arrow-trend-down";
  const profitSign = netProfit >= 0 ? "+" : "";

  // بطاقة الربح — نعيد رسمها مع اللون
  const profitEl = document.getElementById("tr-net-profit");
  if (profitEl) {
    profitEl.innerHTML = `<span style="color:${profitColor};">
            <i class="fa-solid ${profitIcon}" style="font-size:0.9rem;"></i>
            ${profitSign}${fmtMoney(netProfit)}
        </span>`;
  }
  setText("tr-profit-sub", netProfit >= 0 ? "ربح محقق ✓" : "خسارة");
  setText("tr-total-bought", fmtMoney(totalBought));
  setText("tr-buy-count", `${buys.length} عملية شراء`);
  setText("tr-total-sold", fmtMoney(totalSold));
  setText("tr-sell-count", `${sells.length} عملية بيع`);
  setText("tr-ops-count", fmt(data.length));

  // ملخص مختصر
  setText("tr-ms-buy", fmtMoney(totalBought));
  setText("tr-ms-sell", fmtMoney(totalSold));
  const msProfit = document.getElementById("tr-ms-profit");
  if (msProfit) {
    msProfit.innerHTML = `<span style="color:${profitColor};font-weight:800;">
            ${profitSign}${fmtMoney(netProfit)}
        </span>`;
  }
}

/** مخطط الربح اليومي */
function _renderTradingChart(days) {
  const chartEl = document.getElementById("trading-daily-chart");
  if (!chartEl) return;

  if (days.length <= 1) {
    document.getElementById("trading-chart-card").style.display = "none";
    return;
  }
  document.getElementById("trading-chart-card").style.display = "block";

  // نحسب الربح لكل يوم
  const byDay = {};
  days.forEach((d) => {
    byDay[d] = 0;
  });
  TRADING_DATA.forEach((tx) => {
    const d = tx.transaction_date || "";
    if (byDay[d] !== undefined) byDay[d] += parseFloat(tx.profit || 0);
  });

  const values = days.map((d) => byDay[d]);
  const maxAbs = Math.max(...values.map(Math.abs), 0.01);

  chartEl.innerHTML = days
    .map((d, i) => {
      const val = values[i];
      const height = Math.max(4, Math.round((Math.abs(val) / maxAbs) * 80));
      const color = val >= 0 ? "#10b981" : "#ef4444";
      const label = d.slice(5); // MM-DD
      const title = `${val >= 0 ? "+" : ""}${val.toFixed(2)} | ${d}`;
      return `
            <div class="td-bar-wrap">
                <div class="td-bar" style="height:${height}px;background:${color};" title="${title}"></div>
                <div class="td-bar-label">${label}</div>
            </div>
        `;
    })
    .join("");
}

/** رسم جدول العمليات */
function _renderTradingTable() {
  const tbody = document.getElementById("trading-tbody");
  if (!tbody) return;

  const typeFilter =
    document.getElementById("trading-type-filter")?.value || "";
  TRADING_FILTERED = TRADING_DATA.filter(
    (t) => !typeFilter || t.type === typeFilter,
  );

  if (TRADING_FILTERED.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--gray);padding:24px;">
            <i class="fa-solid fa-magnifying-glass" style="margin-left:6px;"></i>لا توجد نتائج
        </td></tr>`;
    return;
  }

  tbody.innerHTML = TRADING_FILTERED.map((tx, i) => {
    const isBuy = tx.type === "buy";
    const profit = parseFloat(tx.profit || 0);
    const pColor =
      profit > 0
        ? "var(--success)"
        : profit < 0
          ? "var(--danger)"
          : "var(--gray)";
    const typeBadge = isBuy
      ? `<span class="badge badge-success" style="background:#dcfce7;color:#166534;border:none;">
                 <i class="fa-solid fa-circle-arrow-down"></i> شراء</span>`
      : `<span class="badge badge-danger" style="background:#fee2e2;color:#991b1b;border:none;">
                 <i class="fa-solid fa-circle-arrow-up"></i> بيع</span>`;
    const profitCell = isBuy
      ? `<span style="color:var(--gray);font-size:12px;">—</span>`
      : `<span style="color:${pColor};font-weight:700;">${profit >= 0 ? "+" : ""}${fmtMoney(profit)}</span>`;

    return `<tr>
            <td>${i + 1}</td>
            <td>${typeBadge}</td>
            <td><span class="badge" style="background:var(--primary-bg);color:var(--primary);border:none;">
                ${tx.currency?.code ?? "—"}</span></td>
            <td style="font-weight:700;">${parseFloat(tx.amount || 0).toFixed(2)}</td>
            <td>${parseFloat(tx.price || 0).toFixed(2)}</td>
            <td style="color:#64748b;">${parseFloat(tx.cost_at_time || 0).toFixed(2)}</td>
            <td>${profitCell}</td>
            <td>${tx.transaction_date ?? "—"}</td>
            <td style="color:var(--gray);font-size:0.8rem;">${tx.user?.name ?? "—"}</td>
        </tr>`;
  }).join("");
}

/** فلتر النوع في الجدول */
function filterTradingTable() {
  _renderTradingTable();
}

/** تحديث label الفترة في الهيدر */
function _updateTradingLabel() {
  const label =
    _tradingFrom === _tradingTo
      ? formatArabicDate(_tradingFrom)
      : `${_tradingFrom} ← ${_tradingTo}`;
  setText("trading-date-label", label);
  setText("tr-period-label", label);
}

/** إدارة حالة العرض */
function _showTradingState(state) {
  const els = {
    placeholder: document.getElementById("trading-placeholder"),
    empty: document.getElementById("trading-empty"),
    stats: document.getElementById("trading-stats-grid"),
    chart: document.getElementById("trading-chart-card"),
    table: document.getElementById("trading-table-card"),
  };

  // إخفاء الكل أولاً
  Object.values(els).forEach((el) => {
    if (el) el.style.display = "none";
  });

  if (state === "loading") {
    if (els.stats) els.stats.style.display = "grid";
    // نُبقي على الستات فارغة مع loading نص
    document
      .querySelectorAll("#trading-stats-grid .stat-value")
      .forEach((el) => {
        el.textContent = "...";
      });
  } else if (state === "empty") {
    if (els.stats) els.stats.style.display = "grid";
    if (els.empty) els.empty.style.display = "block";
  } else if (state === "data") {
    if (els.stats) els.stats.style.display = "grid";
    if (els.table) els.table.style.display = "block";
    // chart يُظهَر فقط إذا كانت هناك أيام متعددة (يُعالج في _renderTradingChart)
  } else {
    // placeholder
    if (els.placeholder) els.placeholder.style.display = "block";
  }
}

/** تصدير CSV لبيانات التداول */
function exportTradingCSV() {
  const headers = [
    "#",
    "النوع",
    "العملة",
    "الكمية",
    "السعر",
    "متوسط_التكلفة",
    "الربح/الخسارة",
    "التاريخ",
    "المنفذ",
  ];
  const rows = TRADING_FILTERED.map((tx, i) => [
    i + 1,
    tx.type === "buy" ? "شراء" : "بيع",
    tx.currency?.code ?? "",
    parseFloat(tx.amount || 0).toFixed(2),
    parseFloat(tx.price || 0).toFixed(2),
    parseFloat(tx.cost_at_time || 0).toFixed(2),
    parseFloat(tx.profit || 0).toFixed(2),
    tx.transaction_date ?? "",
    tx.user?.name ?? "",
  ]);

  const period =
    _tradingFrom === _tradingTo
      ? _tradingFrom
      : `${_tradingFrom}_${_tradingTo}`;
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${v}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `trading_profits_${period}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** طباعة التقرير */
function printTradingReport() {
  window.print();
}

// ── Helpers ─────────────────────────────────────────
/** كل الأيام بين تاريخين */
function getDatesInRange(from, to) {
  const dates = [];
  const cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    dates.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

/** تنسيق التاريخ بالعربية */
function formatArabicDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString("ar-SY", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    return dateStr;
  }
}

// ─────────────────────────────────────────────────────
//  LOGOUT
// ─────────────────────────────────────────────────────
async function handleLogout() {
  try {
    await fetch(`${API_URL}/logout`, { method: "POST", headers: getHeaders() });
  } catch (e) {}
  localStorage.clear();
  window.location.href = "../index.html";
}

// ─────────────────────────────────────────────────────
//  SIDEBAR
// ─────────────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById("sidebar")?.classList.toggle("open");
  document.getElementById("sidebar-overlay")?.classList.toggle("active");
}
function closeSidebar() {
  document.getElementById("sidebar")?.classList.remove("open");
  document.getElementById("sidebar-overlay")?.classList.remove("active");
}
function toggleProfileMenu() {}

// ─────────────────────────────────────────────────────
//  UTILS
// ─────────────────────────────────────────────────────
function statusBadge(s) {
  const map = {
    completed: `<span class="badge badge-success"><i class="fa-solid fa-check"></i> مكتملة</span>`,
    pending: `<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> معلقة</span>`,
    cancelled: `<span class="badge badge-danger"><i class="fa-solid fa-xmark"></i> ملغاة</span>`,
    rejected: `<span class="badge badge-danger"><i class="fa-solid fa-ban"></i> مرفوضة</span>`,
    approved: `<span class="badge badge-info"><i class="fa-solid fa-thumbs-up"></i> موافق عليها</span>`,
    waiting: `<span class="badge badge-info"><i class="fa-solid fa-hourglass-half"></i> قيد الانتظار</span>`,
    ready: `<span class="badge badge-purple"><i class="fa-solid fa-box-open"></i> جاهزة للتسليم</span>`,
  };
  return map[s] || `<span class="badge">${s || "—"}</span>`;
}

function fmtMoney(n) {
  const num = parseFloat(n);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("ar", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmt(n) {
  return Number(n).toLocaleString("ar");
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setHTML(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = val;
}

// ─── Page Loader ──────────────────────────────────────
function showPageLoader(show) {
  let el = document.getElementById("page-loader");
  if (!el) {
    el = document.createElement("div");
    el.id = "page-loader";
    el.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:16px;">
                <div style="width:46px;height:46px;border:4px solid #e5e7eb;
                            border-top:4px solid #7c3aed;border-radius:50%;
                            animation:acct-spin 0.8s linear infinite;"></div>
                <span style="color:#4b5563;font-size:0.9rem;font-family:'Cairo',sans-serif;">
                    جاري تحميل البيانات...
                </span>
            </div>`;
    el.style.cssText = `position:fixed;inset:0;background:rgba(255,255,255,0.92);
            backdrop-filter:blur(4px);z-index:9999;
            display:flex;align-items:center;justify-content:center;`;
    const style = document.createElement("style");
    style.textContent =
      "@keyframes acct-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}";
    document.head.appendChild(style);
    document.body.appendChild(el);
  }
  el.style.display = show ? "flex" : "none";
}

// ─── Toast notifications ──────────────────────────────
function showToast(msg, type = "success") {
  if (window.Notyf) {
    const notyf = new Notyf({
      duration: 3500,
      position: { x: "left", y: "bottom" },
      ripple: true,
    });
    type === "success" ? notyf.success(msg) : notyf.error(msg);
    return;
  }
  // fallback
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.cssText = `position:fixed;bottom:24px;left:24px;padding:12px 20px;
        background:${type === "success" ? "#10b981" : "#ef4444"};color:white;
        border-radius:10px;font-size:0.875rem;font-family:'Cairo',sans-serif;
        z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);
        animation:acct-spin 0s;`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ═══════════════════════════════════════════════════════
//   صورة الهوية — ID Image Modal
// ═══════════════════════════════════════════════════════

function openIdModal(url) {
  const modal = document.getElementById("id-img-modal");
  const img = document.getElementById("id-img-viewer");
  const dlBtn = document.getElementById("id-img-download");
  if (!modal || !img) return;
  img.src = url;
  dlBtn.href = url;
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeIdModal(e) {
  // إغلاق بالنقر على الخلفية أو بالزر
  if (
    e &&
    e.target !== document.getElementById("id-img-modal") &&
    e.type !== undefined &&
    e.currentTarget !== e.target
  )
    return;
  const modal = document.getElementById("id-img-modal");
  if (!modal) return;
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

// إغلاق بمفتاح Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const m = document.getElementById("id-img-modal");
    if (m && !m.classList.contains("hidden")) closeIdModal();
  }
});

// ═══════════════════════════════════════════════════════
//   سجل التعديلات — Edit History Section
// ═══════════════════════════════════════════════════════

/**
 * تهيئة قسم سجل التعديلات — يُستدعى عند فتح القسم
 */
async function initHistorySection() {
  // ضبط الزر الافتراضي
  setHistoryRange(
    _historyRange,
    document.querySelector(`.eh-quick-btn[data-range="${_historyRange}"]`),
  );
}

/**
 * تحديد الفترة الزمنية وإعادة التحميل
 */
function setHistoryRange(range, btn) {
  _historyRange = range;
  document
    .querySelectorAll(".eh-quick-btn")
    .forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  loadEditHistory();
}

/**
 * جلب سجل التعديلات من API
 */
async function loadEditHistory() {
  const tbodyEl = document.getElementById("eh-tbody");
  const emptyEl = document.getElementById("eh-empty");
  const summaryEl = document.getElementById("eh-summary-grid");
  if (!tbodyEl) return;

  tbodyEl.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--gray);">
        <div style="width:28px;height:28px;border:3px solid #e5e7eb;border-top:3px solid var(--primary);
                    border-radius:50%;animation:acct-spin 0.8s linear infinite;margin:0 auto 10px;"></div>
        جاري التحميل...
    </td></tr>`;
  summaryEl.innerHTML = "";
  emptyEl.style.display = "none";

  try {
    const res = await fetch(`${API_URL}/transfers/history/all`, {
      headers: getHeaders(),
    });

    // إذا كان الـ API غير موجود (404) نُولّد بيانات من الحوالات الموجودة
    if (!res.ok) {
      _buildHistoryFromTransfers();
      return;
    }

    const json = await res.json();
    ALL_HISTORY = json.data || [];
    _applyHistoryRangeFilter();
    _renderHistorySummary();
    _renderHistoryTable();
  } catch (err) {
    console.warn("History API not available, building from transfers:", err);
    _buildHistoryFromTransfers();
  }
}

/**
 * بناء سجل وهمي من الحوالات المكتملة إذا لم يكن الـ API جاهزاً بعد
 */
function _buildHistoryFromTransfers() {
  // نصنع سجلات وهمية من الحوالات التي لها receiver_id_image أو fee > 0
  ALL_HISTORY = ALL_TRANSFERS.filter(
    (t) => t.status === "completed" || parseFloat(t.fee || 0) > 0,
  ).map((t) => ({
    id: t.id,
    transfer_id: t.id,
    transfer: t,
    admin: { name: "المدير" },
    action: t.status === "completed" ? "status_change" : "edited",
    old_data: {},
    new_data: { status: t.status, fee: t.fee },
    created_at: t.updated_at || t.created_at,
  }));

  _applyHistoryRangeFilter();
  _renderHistorySummary();
  _renderHistoryTable();
}

/**
 * تصفية السجل حسب الفترة المختارة
 */
function _applyHistoryRangeFilter() {
  const today = new Date();
  FILTERED_HISTORY = ALL_HISTORY.filter((h) => {
    if (_historyRange === "all") return true;
    const d = new Date(h.created_at || h.updated_at || "");
    if (isNaN(d)) return true;
    if (_historyRange === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      return d >= weekAgo;
    }
    if (_historyRange === "month") {
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth()
      );
    }
    return true;
  });
}

/**
 * رسم بطاقات الملخص
 */
function _renderHistorySummary() {
  const summaryEl = document.getElementById("eh-summary-grid");
  if (!summaryEl) return;

  const total = FILTERED_HISTORY.length;
  const edited = FILTERED_HISTORY.filter((h) => h.action === "edited").length;
  const status = FILTERED_HISTORY.filter(
    (h) => h.action === "status_change",
  ).length;

  // مجموعة المدراء الفريدة
  const admins = new Set(FILTERED_HISTORY.map((h) => h.admin?.name || "—"))
    .size;

  const cardS = `background:var(--white);border-radius:var(--radius-sm);padding:16px 18px;
                   border:1px solid var(--border);box-shadow:var(--shadow-sm);`;

  summaryEl.innerHTML = `
        <div style="${cardS}">
            <div style="font-size:11px;font-weight:700;color:var(--gray);text-transform:uppercase;
                        letter-spacing:.5px;margin-bottom:6px;">إجمالي التعديلات</div>
            <div style="font-size:26px;font-weight:800;color:var(--primary);">${total}</div>
        </div>
        <div style="${cardS}">
            <div style="font-size:11px;font-weight:700;color:var(--gray);text-transform:uppercase;
                        letter-spacing:.5px;margin-bottom:6px;">تعديلات بيانات</div>
            <div style="font-size:26px;font-weight:800;color:#f59e0b;">${edited}</div>
        </div>
        <div style="${cardS}">
            <div style="font-size:11px;font-weight:700;color:var(--gray);text-transform:uppercase;
                        letter-spacing:.5px;margin-bottom:6px;">تغييرات حالة</div>
            <div style="font-size:26px;font-weight:800;color:#10b981;">${status}</div>
        </div>
        <div style="${cardS}">
            <div style="font-size:11px;font-weight:700;color:var(--gray);text-transform:uppercase;
                        letter-spacing:.5px;margin-bottom:6px;">عدد المدراء</div>
            <div style="font-size:26px;font-weight:800;color:#6f42c1;">${admins}</div>
        </div>
    `;
}

/**
 * رسم جدول سجل التعديلات
 */
function _renderHistoryTable() {
  const tbodyEl = document.getElementById("eh-tbody");
  const emptyEl = document.getElementById("eh-empty");
  if (!tbodyEl) return;

  // تطبيق فلتر البحث والنوع
  const q = (document.getElementById("eh-search")?.value || "").toLowerCase();
  const action = document.getElementById("eh-action-filter")?.value || "";

  const rows = FILTERED_HISTORY.filter((h) => {
    const text = `${h.transfer_id} ${h.admin?.name || ""}`.toLowerCase();
    if (q && !text.includes(q)) return false;
    if (action && h.action !== action) return false;
    return true;
  });

  if (!rows.length) {
    tbodyEl.innerHTML = "";
    emptyEl.style.display = "block";
    return;
  }
  emptyEl.style.display = "none";

  tbodyEl.innerHTML = rows
    .map((h, i) => {
      const actionBadge =
        h.action === "edited"
          ? `<span class="badge badge-warning"><i class="fa-solid fa-pen"></i> تعديل</span>`
          : `<span class="badge badge-info"><i class="fa-solid fa-arrows-rotate"></i> تغيير حالة</span>`;

      // بناء عمود التغييرات
      const changes = _buildChangesCell(h.old_data, h.new_data);

      const date = h.created_at
        ? new Date(h.created_at).toLocaleString("ar-SY", {
            dateStyle: "short",
            timeStyle: "short",
          })
        : "—";

      const senderName =
        h.transfer?.sender?.name ||
        h.transfer?.receiver_name ||
        `#${h.transfer_id}`;

      return `
            <tr>
                <td style="color:var(--gray);font-size:12px;">${i + 1}</td>
                <td>
                    <span style="font-weight:700;color:var(--primary);">
                        ${h.transfer?.tracking_code || "#" + h.transfer_id}
                    </span>
                </td>
                <td>${senderName}</td>
                <td>${actionBadge}</td>
                <td style="max-width:280px;">${changes}</td>
                <td>
                    <span style="font-weight:600;font-size:13px;color:var(--dark);">
                        ${h.admin?.name || "—"}
                    </span>
                </td>
                <td style="font-size:12px;color:var(--gray);">${date}</td>
            </tr>
        `;
    })
    .join("");
}

/**
 * بناء خلية التغييرات بمقارنة old_data و new_data
 */
function _buildChangesCell(oldData, newData) {
  if (
    !oldData ||
    !newData ||
    (!Object.keys(oldData).length && !Object.keys(newData).length)
  ) {
    return `<span style="color:var(--gray);font-size:12px;">—</span>`;
  }

  const fieldLabels = {
    receiver_name: "اسم المستلم",
    receiver_phone: "هاتف المستلم",
    amount: "المبلغ",
    amount_in_usd: "المبلغ (USD)",
    fee: "العمولة",
    status: "الحالة",
  };

  const statusLabels = {
    pending: "معلقة",
    approved: "موافق عليها",
    waiting: "قيد الانتظار",
    ready: "جاهزة للتسليم",
    completed: "مكتملة",
    cancelled: "ملغاة",
    rejected: "مرفوضة",
    status_change: "تغيير حالة",
  };

  const allKeys = new Set([
    ...Object.keys(oldData || {}),
    ...Object.keys(newData || {}),
  ]);
  const items = [];

  allKeys.forEach((key) => {
    if (key === "updated_at" || key === "created_at") return;
    const label = fieldLabels[key] || key;
    const oldVal = oldData?.[key] !== undefined ? oldData[key] : null;
    const newVal = newData?.[key] !== undefined ? newData[key] : null;

    if (String(oldVal) === String(newVal)) return; // لم يتغير

    const oldStr =
      key === "status" ? statusLabels[oldVal] || oldVal : (oldVal ?? "—");
    const newStr =
      key === "status" ? statusLabels[newVal] || newVal : (newVal ?? "—");

    items.push(`
            <div style="font-size:11px;margin-bottom:3px;">
                <span style="color:var(--gray);font-weight:600;">${label}:</span>
                <span style="color:var(--danger);text-decoration:line-through;margin:0 4px;">${oldStr}</span>
                <i class="fa-solid fa-arrow-left" style="font-size:9px;color:var(--gray);"></i>
                <span style="color:var(--success);margin-right:4px;font-weight:700;">${newStr}</span>
            </div>
        `);
  });

  return items.length
    ? `<div style="line-height:1.6;">${items.join("")}</div>`
    : `<span style="color:var(--gray);font-size:12px;">—</span>`;
}

/**
 * تصفية جدول التعديلات (بحث + نوع)
 */
function filterHistoryTable() {
  _renderHistoryTable();
}

/**
 * تصدير سجل التعديلات CSV
 */
function exportHistoryCSV() {
  const headers = [
    "#",
    "رقم الحوالة",
    "المرسل",
    "الإجراء",
    "المدير",
    "التاريخ",
  ];
  const rows = FILTERED_HISTORY.map((h, i) => [
    i + 1,
    h.transfer?.tracking_code || h.transfer_id,
    h.transfer?.sender?.name || h.transfer?.receiver_name || "",
    h.action === "edited" ? "تعديل بيانات" : "تغيير حالة",
    h.admin?.name || "",
    h.created_at ? new Date(h.created_at).toLocaleString("ar-SY") : "",
  ]);

  const range =
    _historyRange === "week"
      ? "الأسبوع"
      : _historyRange === "month"
        ? "الشهر"
        : "الكل";
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${v}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `edit_history_${range}_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* =====================================================
   صناديق المكتب — للمحاسب
   ===================================================== */

async function loadAccountantSafes() {
  const container = document.getElementById("acct-safes-container");
  if (!container) return;

  container.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--gray);">
            <div style="width:40px;height:40px;border:3px solid #e5e7eb;border-top:3px solid var(--primary);
                        border-radius:50%;animation:acct-spin 0.8s linear infinite;margin:0 auto 12px;"></div>
            <p style="margin:0;font-size:13px;">جاري تحميل بيانات الصناديق...</p>
        </div>`;

  try {
    const [safesRes, meRes] = await Promise.all([
      fetch(`${API_URL}/safes`, { headers: getHeaders() }),
      fetch(`${API_URL}/me`, { headers: getHeaders() }),
    ]);

    if (!safesRes.ok || !meRes.ok) throw new Error("API error");

    const safesJson = await safesRes.json();
    const meData = await meRes.json();
    const myOfficeId = meData.user?.office_id;
    const mySafes = (safesJson.data || []).filter(
      (s) => s.office_id === myOfficeId,
    );

    if (!mySafes.length) {
      container.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--gray);">
                    <i class="fa-solid fa-vault" style="font-size:32px;margin-bottom:12px;display:block;opacity:.4;"></i>
                    <p style="margin:0;font-size:14px;font-weight:600;">لا توجد صناديق مسجلة لهذا المكتب</p>
                </div>`;
      return;
    }

    const typeConfig = {
      office_safe: {
        label: "خزنة المكتب",
        icon: "fa-building-columns",
        bg: "#dbeafe",
        fg: "#1e40af",
        border: "#3b82f6",
      },
      office_main: {
        label: "الصندوق الرئيسي",
        icon: "fa-vault",
        bg: "#d1fae5",
        fg: "#065f46",
        border: "#10b981",
      },
      trading: {
        label: "صندوق التداول",
        icon: "fa-chart-line",
        bg: "#fef3c7",
        fg: "#92400e",
        border: "#f59e0b",
      },
      profit_safe: {
        label: "صندوق الأرباح",
        icon: "fa-sack-dollar",
        bg: "#ede9fe",
        fg: "#5b21b6",
        border: "#8b5cf6",
      },
    };

    const totalUSD = mySafes.reduce(
      (s, safe) => s + parseFloat(safe.balance || 0),
      0,
    );
    const totalSYP = mySafes.reduce(
      (s, safe) => s + parseFloat(safe.balance_sy || 0),
      0,
    );

    const summaryCard = `
        <div style="grid-column:1/-1;background:linear-gradient(135deg,#1e3a8a,#1d4ed8);border-radius:16px;
                    padding:20px 24px;color:#fff;display:flex;flex-wrap:wrap;gap:20px;align-items:center;
                    box-shadow:0 8px 24px rgba(30,64,175,.25);">
            <div style="flex:1;min-width:140px;">
                <div style="font-size:11px;font-weight:700;opacity:.7;margin-bottom:4px;">إجمالي الرصيد (USD)</div>
                <div style="font-size:26px;font-weight:800;">$${totalUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            </div>
            <div style="flex:1;min-width:140px;border-right:1px solid rgba(255,255,255,.2);padding-right:20px;">
                <div style="font-size:11px;font-weight:700;opacity:.7;margin-bottom:4px;">إجمالي رصيد الليرة (SYP)</div>
                <div style="font-size:20px;font-weight:800;">${totalSYP.toLocaleString("en-US", { maximumFractionDigits: 0 })} ل.س</div>
            </div>
            <div style="flex:1;min-width:100px;border-right:1px solid rgba(255,255,255,.2);padding-right:20px;">
                <div style="font-size:11px;font-weight:700;opacity:.7;margin-bottom:4px;">عدد الصناديق</div>
                <div style="font-size:26px;font-weight:800;">${mySafes.length}</div>
            </div>
        </div>`;

    const cards = mySafes.map((safe) => {
      const cfg = typeConfig[safe.type] || {
        label: safe.type,
        icon: "fa-coins",
        bg: "#f3f4f6",
        fg: "#374151",
        border: "#9ca3af",
      };
      const bal = parseFloat(safe.balance || 0);
      const balSy = parseFloat(safe.balance_sy || 0);
      const cost =
        safe.cost !== null && safe.cost !== undefined
          ? parseFloat(safe.cost)
          : null;
      const pT =
        safe.profit_trade !== undefined ? parseFloat(safe.profit_trade) : null;
      const pM =
        safe.profit_main !== undefined ? parseFloat(safe.profit_main) : null;

      const row = (label, val, borderColor, icon) => `
                <div style="display:flex;justify-content:space-between;align-items:center;
                            padding:9px 0;border-bottom:1px dashed var(--border);font-size:13px;">
                    <span style="color:var(--gray);display:flex;align-items:center;gap:6px;">
                        <i class="fa-solid ${icon}" style="font-size:10px;color:${borderColor};"></i>${label}
                    </span>
                    <span style="font-weight:700;color:${borderColor};">${val}</span>
                </div>`;

      const rows = [];
      rows.push(
        row(
          "الرصيد (USD)",
          `$${bal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
          cfg.fg,
          "fa-dollar-sign",
        ),
      );
      if (balSy > 0)
        rows.push(
          row(
            "رصيد الليرة",
            `${balSy.toLocaleString("en-US", { maximumFractionDigits: 0 })} ل.س`,
            "#ea580c",
            "fa-coins",
          ),
        );
      if (cost !== null)
        rows.push(
          row("متوسط التكلفة", cost.toFixed(4), "#64748b", "fa-calculator"),
        );
      if (pT !== null)
        rows.push(
          row(
            "أرباح التداول",
            `${pT >= 0 ? "+" : ""}${pT.toLocaleString("en-US", { maximumFractionDigits: 0 })} ل.س`,
            pT >= 0 ? "#15803d" : "#dc2626",
            "fa-arrow-trend-up",
          ),
        );
      if (pM !== null)
        rows.push(
          row(
            "الأرباح الرئيسية",
            `$${pM.toFixed(2)}`,
            "#1d4ed8",
            "fa-hand-holding-dollar",
          ),
        );

      // remove last border
      const rowsHtml = rows
        .join("")
        .replace(
          /border-bottom:1px dashed var\(--border\);<\/div>\s*$/,
          "</div>",
        );

      return `
            <div style="background:var(--white);border-radius:16px;overflow:hidden;
                        box-shadow:0 2px 12px rgba(0,0,0,.06);
                        border:1.5px solid var(--border);border-top:4px solid ${cfg.border};">
                <div style="display:flex;align-items:center;gap:12px;padding:16px;background:${cfg.bg}22;">
                    <div style="width:44px;height:44px;border-radius:12px;background:${cfg.bg};
                                color:${cfg.fg};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">
                        <i class="fa-solid ${cfg.icon}"></i>
                    </div>
                    <div>
                        <div style="font-weight:800;font-size:15px;color:var(--dark);">${cfg.label}</div>
                        <div style="font-size:11px;color:${cfg.fg};font-weight:600;margin-top:2px;">${safe.currency || "USD"} · ${safe.type}</div>
                    </div>
                </div>
                <div style="padding:4px 16px 16px;">${rowsHtml}</div>
            </div>`;
    });

    container.innerHTML = summaryCard + cards.join("");
  } catch (err) {
    console.error("loadAccountantSafes error:", err);
    container.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:36px;color:var(--danger);">
                <i class="fa-solid fa-circle-exclamation" style="font-size:28px;margin-bottom:10px;display:block;"></i>
                <p style="margin:0;font-size:14px;font-weight:600;">خطأ في تحميل بيانات الصناديق</p>
                <button onclick="loadAccountantSafes()"
                        style="margin-top:14px;padding:8px 20px;background:var(--danger);color:#fff;
                               border:none;border-radius:8px;font-family:'Cairo',sans-serif;
                               font-size:13px;font-weight:700;cursor:pointer;">
                    إعادة المحاولة
                </button>
            </div>`;
  }
  initSafesReport();
}

/* =====================================================
   الحوالات الداخلية — للمحاسب
   ===================================================== */

let _acctInternalAll = [];

async function loadAccountantInternals() {
  const tbody = document.getElementById("acct-internal-tbody");
  const countEl = document.getElementById("acct-internal-count");
  const totalEl = document.getElementById("acct-internal-total");
  const profitEl = document.getElementById("acct-internal-profit");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--gray);">
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;border:3px solid #e5e7eb;border-top:3px solid var(--primary);
                        border-radius:50%;animation:acct-spin 0.8s linear infinite;"></div>
            <span style="font-size:13px;">جاري تحميل الحوالات الداخلية...</span>
        </div>
    </td></tr>`;

  if (countEl) countEl.textContent = "—";
  if (totalEl) totalEl.textContent = "—";
  if (profitEl) profitEl.textContent = "—";

  try {
    const res = await fetch(`${API_URL}/internal-transfers`, {
      headers: getHeaders(),
    });
    const json = await res.json();

    if (!res.ok || json.status !== "success" || !Array.isArray(json.data)) {
      tbody.innerHTML = `<tr><td colspan="10">
                <div style="text-align:center;padding:48px;color:var(--gray);">
                    <i class="fa-solid fa-right-left" style="font-size:32px;opacity:.3;display:block;margin-bottom:12px;"></i>
                    <p style="margin:0;font-size:14px;font-weight:600;">لا توجد حوالات داخلية مسجلة</p>
                    <p style="margin:4px 0 0;font-size:12px;color:var(--gray);">${json.message || "تحقق من الاتصال بالسيرفر"}</p>
                </div>
            </td></tr>`;
      if (countEl) countEl.textContent = "0";
      if (totalEl) totalEl.textContent = "0.00";
      if (profitEl) profitEl.textContent = "$0.00";
      return;
    }

    _acctInternalAll = json.data;
    _renderAccountantInternals(_acctInternalAll);
  } catch (err) {
    console.error("loadAccountantInternals error:", err);
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--danger);padding:32px;">
            <i class="fa-solid fa-circle-exclamation" style="font-size:24px;display:block;margin-bottom:8px;"></i>
            خطأ في الاتصال بالسيرفر
        </td></tr>`;
  }
}

function _renderAccountantInternals(data) {
  const tbody = document.getElementById("acct-internal-tbody");
  const countEl = document.getElementById("acct-internal-count");
  const totalEl = document.getElementById("acct-internal-total");
  const profitEl = document.getElementById("acct-internal-profit");

  if (countEl) countEl.textContent = data.length;

  const totalFees = data.reduce((s, t) => s + parseFloat(t.commission || 0), 0);
  const totalAmount = data.reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  if (totalEl)
    totalEl.textContent = totalAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
    });
  if (profitEl) profitEl.textContent = "$" + totalFees.toFixed(2);

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="10">
            <div style="text-align:center;padding:48px;color:var(--gray);">
                <i class="fa-solid fa-magnifying-glass" style="font-size:28px;opacity:.3;display:block;margin-bottom:12px;"></i>
                <p style="margin:0;font-size:14px;font-weight:600;">لا توجد نتائج مطابقة</p>
            </div>
        </td></tr>`;
    return;
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("ar-SY", {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch (e) {
      return iso;
    }
  }

  // ألوان صف متناوبة خفيفة
  tbody.innerHTML = data
    .map((t, i) => {
      const currency = t.currency ?? "";
      const feePayer = t.fee_payer ?? "sender";
      const amount = parseFloat(t.amount ?? 0);
      const commission = parseFloat(t.commission ?? 0);
      const net = feePayer === "receiver" ? amount - commission : amount;
      const bg = i % 2 === 0 ? "var(--white)" : "#fafafa";

      const feePayerBadge = `
            <span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;
                         font-size:11px;font-weight:700;
                         background:${feePayer === "sender" ? "#fef3c7" : "#dbeafe"};
                         color:${feePayer === "sender" ? "#92400e" : "#1e40af"};">
                <i class="fa-solid fa-${feePayer === "sender" ? "user-tie" : "user-check"}" style="font-size:10px;"></i>
                ${feePayer === "sender" ? "المرسل" : "المستلم"}
            </span>`;

      return `
        <tr style="background:${bg};transition:background .15s;" onmouseover="this.style.background='#eff6ff'" onmouseout="this.style.background='${bg}'">
            <td style="padding:12px 14px;font-weight:700;color:var(--gray);font-size:12px;">${i + 1}</td>
            <td style="padding:12px 14px;font-weight:700;color:var(--dark);">${t.sender_name ?? "—"}</td>
            <td style="padding:12px 14px;">${t.receiver_name ?? "—"}</td>
            <td style="padding:12px 14px;">
                <span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;
                             background:var(--primary-bg,#eff6ff);color:var(--primary,#4f46e5);font-size:12px;font-weight:700;">
                    <i class="fa-solid fa-location-dot" style="font-size:10px;"></i>
                    ${t.destination_province ?? "—"}
                </span>
            </td>
            <td style="padding:12px 14px;direction:ltr;font-size:12px;color:var(--gray);">${t.receiver_phone ?? "—"}</td>
            <td style="padding:12px 14px;font-weight:800;color:var(--dark);">
                ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                <small style="font-weight:600;color:var(--gray);"> ${currency}</small>
            </td>
            <td style="padding:12px 14px;color:${commission > 0 ? "var(--danger)" : "var(--gray)"};">
                ${commission > 0 ? commission.toFixed(2) + " " + currency : "—"}
            </td>
            <td style="padding:12px 14px;">${feePayerBadge}</td>
            <td style="padding:12px 14px;font-weight:800;color:var(--success);">
                ${net.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                <small style="font-weight:600;color:var(--gray);"> ${currency}</small>
            </td>
            <td style="padding:12px 14px;font-size:11px;color:var(--gray);white-space:nowrap;">${fmtDate(t.created_at)}</td>
        </tr>`;
    })
    .join("");
}

function filterAccountantInternals() {
  const q = (
    document.getElementById("acct-internal-search")?.value || ""
  ).toLowerCase();
  const filtered = !q
    ? _acctInternalAll
    : _acctInternalAll.filter((t) =>
        `${t.sender_name ?? ""} ${t.receiver_name ?? ""} ${t.destination_province ?? ""} ${t.receiver_phone ?? ""}`
          .toLowerCase()
          .includes(q),
      );
  _renderAccountantInternals(filtered);
}

function exportAccountantInternalsCSV() {
  const data = _acctInternalAll;
  if (!data.length) {
    showToast("لا توجد بيانات للتصدير", "error");
    return;
  }

  const headers = [
    "#",
    "المرسل",
    "المستلم",
    "الوجهة",
    "الهاتف",
    "المبلغ",
    "العملة",
    "الرسوم",
    "يدفع الرسوم",
    "الصافي",
    "التاريخ",
  ];
  const rows = data.map((t, i) => {
    const feePayer = t.fee_payer ?? "sender";
    const amount = parseFloat(t.amount ?? 0);
    const comm = parseFloat(t.commission ?? 0);
    const net = feePayer === "receiver" ? amount - comm : amount;
    return [
      i + 1,
      t.sender_name ?? "",
      t.receiver_name ?? "",
      t.destination_province ?? "",
      t.receiver_phone ?? "",
      amount.toFixed(2),
      t.currency ?? "",
      comm.toFixed(2),
      feePayer === "sender" ? "المرسل" : "المستلم",
      net.toFixed(2),
      t.created_at ? new Date(t.created_at).toLocaleString("ar-SY") : "",
    ];
  });

  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${v}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `internal_transfers_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("تم تصدير الملف بنجاح ✓", "success");
}
// =====================================================
//   PATCH لـ accountant.js — ميزتان جديدتان
//   1. الإقفال الشهري (Monthly Closing)
//   2. تصفية التقارير حسب الدولة المرسلة للحوالة
//
//   الاستخدام:
//   أضف هذا الملف كـ <script> بعد accountant.js في accountant.html
//   =====================================================

// ═══════════════════════════════════════════════════════════════════════
//  ① الإقفال الشهري — Monthly Closing
// ═══════════════════════════════════════════════════════════════════════

/**
 * STATE للإقفال الشهري
 */
const _CLOSING = {
  history: [], // سجل الإقفالات السابقة
  loaded: false,
};

/**
 * showSection تستدعي هذه الدالة عند فتح قسم الإقفال (مُدمجة في showSection)
 */
async function initMonthlyClosing() {
  // ملء قائمة الشهور في select
  _fillMonthSelect();
  // تحميل السجل
  await loadClosingHistory();
}

/**
 * ملء قائمة الأشهر تلقائياً (الـ 12 شهر الماضية)
 */
function _fillMonthSelect() {
  const sel = document.getElementById("closing-month-select");
  if (!sel) return;
  // أزل الخيارات القديمة مع الإبقاء على الـ placeholder الأول
  while (sel.options.length > 1) sel.remove(1);

  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("ar-SY", {
      year: "numeric",
      month: "long",
    });
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    sel.appendChild(opt);
  }
}

/**
 * جلب سجل الإقفالات السابقة
 */
async function loadClosingHistory() {
  const tbody = document.getElementById("closing-history-tbody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--gray);">
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
            <div style="width:28px;height:28px;border:3px solid #e5e7eb;border-top:3px solid var(--primary);
                        border-radius:50%;animation:acct-spin 0.8s linear infinite;"></div>
            <span>جاري التحميل...</span>
        </div>
    </td></tr>`;

  try {
    const res = await fetch(`${API_URL}/monthly-closing`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const json = await res.json();
    _CLOSING.history = json.data || [];
    _CLOSING.loaded = true;
    _renderClosingHistory();
  } catch (err) {
    console.error("loadClosingHistory:", err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--danger);">
            <i class="fa-solid fa-circle-exclamation" style="margin-left:6px;"></i>
            خطأ في الاتصال بالسيرفر: ${err.message || ""}
            <br><button onclick="loadClosingHistory()"
                style="margin-top:10px;padding:6px 16px;background:var(--danger);color:#fff;
                       border:none;border-radius:8px;font-family:'Cairo',sans-serif;
                       font-size:12px;font-weight:700;cursor:pointer;">
                إعادة المحاولة
            </button>
        </td></tr>`;
  }
}

/**
 * رسم جدول سجل الإقفالات
 */
function _renderClosingHistory() {
  const tbody = document.getElementById("closing-history-tbody");
  if (!tbody) return;

  const data = _CLOSING.history;

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8">
            <div style="text-align:center;padding:40px;color:var(--gray);">
                <i class="fa-solid fa-box-archive" style="font-size:32px;opacity:.3;display:block;margin-bottom:12px;"></i>
                <p style="margin:0;font-weight:600;">لا توجد إقفالات شهرية مسجلة بعد</p>
            </div>
        </td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map((c, i) => {
      const monthLabel = (() => {
        try {
          const [y, m] = c.month.split("-");
          return new Date(y, m - 1).toLocaleDateString("ar-SY", {
            year: "numeric",
            month: "long",
          });
        } catch {
          return c.month;
        }
      })();

      const date = c.created_at
        ? new Date(c.created_at).toLocaleString("ar-SY", {
            dateStyle: "short",
            timeStyle: "short",
          })
        : "—";

      const totalAmountUsd = parseFloat(c.total_amount_usd ?? 0);
      const totalProfit = parseFloat(c.total_profit ?? 0);

      return `
        <tr style="background:${i % 2 === 0 ? "var(--white)" : "#fafafa"}">
            <td style="padding:12px 14px;font-weight:700;color:var(--primary);">${monthLabel}</td>
            <td style="padding:12px 14px;color:var(--gray);font-size:12px;">
                ${c.office_id ? `مكتب #${c.office_id}` : '<span style="color:#7c3aed;font-weight:700;">كل المكاتب</span>'}
            </td>
        <td style="padding:12px 14px;font-weight:700;color:var(--dark);">
                <button onclick="viewArchivedTransfers('${c.month}', ${c.office_id ?? "null"}, '${monthLabel}')"
                        title="عرض الحوالات المؤرشفة"
                        style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;
                               background:#eff6ff;color:#1e40af;border:1.5px solid #bfdbfe;
                               border-radius:8px;font-family:'Cairo',sans-serif;font-size:13px;
                               font-weight:800;cursor:pointer;transition:all .2s;"
                        onmouseover="this.style.background='#1e40af';this.style.color='#fff';this.style.borderColor='#1e40af';"
                        onmouseout="this.style.background='#eff6ff';this.style.color='#1e40af';this.style.borderColor='#bfdbfe';">
                    <i class="fa-solid fa-box-archive" style="font-size:11px;"></i>
                    ${(c.archived_transfers_count ?? 0).toLocaleString("ar")}
                </button>
            </td>
            <td style="padding:12px 14px;font-weight:800;color:var(--secondary);">
                ${fmtMoney(totalAmountUsd)}
                <small style="font-size:10px;color:var(--gray);font-weight:600;"> USD</small>
            </td>
            <td style="padding:12px 14px;font-weight:800;color:var(--success);">
                ${fmtMoney(totalProfit)}
                <small style="font-size:10px;color:var(--gray);font-weight:600;"> USD</small>
            </td>
            <td style="padding:12px 14px;font-size:12px;color:var(--gray);">${c.performed_by_name || "—"}</td>
            <td style="padding:12px 14px;font-size:11px;color:var(--gray);white-space:nowrap;">${date}</td>
            <td style="padding:12px 14px;">
                <button onclick="viewClosingSnapshots(${c.id})"
                        style="display:inline-flex;align-items:center;gap:5px;padding:6px 12px;
                               background:var(--primary-bg);color:var(--primary);border:1px solid var(--primary);
                               border-radius:8px;font-size:12px;font-weight:700;font-family:'Cairo',sans-serif;cursor:pointer;
                               transition:var(--transition);"
                        onmouseover="this.style.background='var(--primary)';this.style.color='#fff';"
                        onmouseout="this.style.background='var(--primary-bg)';this.style.color='var(--primary)';">
                    <i class="fa-solid fa-eye"></i> الصناديق
                </button>
            </td>
        </tr>`;
    })
    .join("");
}
/**
 * تنفيذ الإقفال الشهري (يُستدعى من الزر)
 */
async function performMonthlyClosing() {
  const monthSel = document.getElementById("closing-month-select");
  const notesSel = document.getElementById("closing-notes");
  const month = monthSel?.value;

  if (!month) {
    showToast("يرجى اختيار الشهر أولاً", "error");
    return;
  }

  // تأكيد العملية — لا رجوع بعدها!
  const monthLabel = monthSel.options[monthSel.selectedIndex]?.text || month;
  const confirmed = confirm(
    `⚠️ تأكيد الإقفال الشهري\n\n` +
      `الشهر: ${monthLabel}\n\n` +
      `سيتم:\n` +
      `• تحويل جميع الحوالات المكتملة في هذا الشهر إلى "مؤرشفة"\n` +
      `• تسجيل snapshot لأرصدة الصناديق\n\n` +
      `⛔ هذه العملية لا يمكن التراجع عنها. هل أنت متأكد؟`,
  );
  if (!confirmed) return;

  const btn = document.getElementById("closing-execute-btn");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإقفال...';
  }

  try {
    // نجلب office_id من بيانات المستخدم الحالي (إن وُجد)
    let officeId = null;
    try {
      const u = JSON.parse(localStorage.getItem("user_data") || "{}");
      officeId = u.office_id ?? null;
    } catch (_) {}

    const body = {
      month: month,
      notes: notesSel?.value?.trim() || null,
      office_id: officeId,
    };

    const res = await fetch(`${API_URL}/monthly-closing`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    const json = await res.json();

    if (!res.ok) {
      showToast(json.message || "فشل الإقفال الشهري", "error");
      return;
    }

    const archived = json.data?.archived_transfers ?? 0;
    const snaps = json.data?.snapshots_taken ?? 0;
    showToast(
      `✅ تم إقفال ${monthLabel} بنجاح — أُرشفت ${archived} حوالة، ${snaps} صندوق مُسجَّل`,
      "success",
    );
    if (notesSel) notesSel.value = "";

    // إعادة تحميل السجل والحوالات
    await loadClosingHistory();
    await fetchAllTransfers();
  } catch (err) {
    console.error("performMonthlyClosing:", err);
    showToast("خطأ في الاتصال بالسيرفر", "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML =
        '<i class="fa-solid fa-calendar-check"></i> تنفيذ الإقفال';
    }
  }
}

/**
 * عرض snapshot الصناديق لإقفال معيّن
 */
async function viewClosingSnapshots(closingId) {
  const modal = document.getElementById("closing-snapshot-modal");
  const tbody = document.getElementById("snapshot-tbody");
  const title = document.getElementById("snapshot-modal-title");
  if (!modal || !tbody) return;

  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--gray);">
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
            <div style="width:24px;height:24px;border:3px solid #e5e7eb;border-top:3px solid var(--primary);
                        border-radius:50%;animation:acct-spin 0.8s linear infinite;"></div>
            <span>جاري تحميل لقطة الصناديق...</span>
        </div>
    </td></tr>`;
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  try {
    const res = await fetch(`${API_URL}/monthly-closing/${closingId}/safes`, {
      headers: getHeaders(),
    });
    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.message || `HTTP ${res.status}`);
    }

    const closing = json.closing;
    const snapshots = json.data || [];

    if (title && closing) {
      const monthLabel = (() => {
        try {
          const [y, m] = closing.month.split("-");
          return new Date(y, m - 1).toLocaleDateString("ar-SY", {
            year: "numeric",
            month: "long",
          });
        } catch {
          return closing.month;
        }
      })();
      title.textContent = `لقطة الصناديق — ${monthLabel}`;

      // معلومات الإقفال تحت العنوان
      const infoEl = document.getElementById("snapshot-modal-info");
      if (infoEl) {
        infoEl.innerHTML = `
                    <span style="background:#eff6ff;color:#1e40af;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;margin-left:6px;">
                        <i class="fa-solid fa-layer-group" style="margin-left:4px;"></i>${closing.archived_transfers_count ?? 0} حوالة مؤرشفة
                    </span>
                    <span style="background:#f0fdf4;color:#166534;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;margin-left:6px;">
                        <i class="fa-solid fa-dollar-sign" style="margin-left:4px;"></i>${fmtMoney(closing.total_amount_usd ?? 0)} USD
                    </span>
                    <span style="background:#fefce8;color:#854d0e;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">
                        <i class="fa-solid fa-coins" style="margin-left:4px;"></i>ربح: ${fmtMoney(closing.total_profit ?? 0)} USD
                    </span>`;
      }
    }

    if (!snapshots.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--gray);">
                <i class="fa-solid fa-vault" style="font-size:28px;opacity:.3;display:block;margin-bottom:10px;"></i>
                لا توجد بيانات صناديق لهذا الإقفال
            </td></tr>`;
      return;
    }

    const fmtN = (n) =>
      parseFloat(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 });

    tbody.innerHTML = snapshots
      .map(
        (s, i) => `
            <tr style="background:${i % 2 === 0 ? "#fff" : "#fafafa"}">
                <td style="padding:10px 12px;font-weight:700;color:var(--dark);">${s.office_name || `مكتب #${s.office_id}`}</td>
                <td style="padding:10px 12px;color:#1e40af;font-weight:700;">$${fmtN(s.office_safe_usd)}</td>
                <td style="padding:10px 12px;color:#ea580c;">${fmtN(s.office_safe_sy)} ل.س</td>
                <td style="padding:10px 12px;color:#92400e;font-weight:700;">$${fmtN(s.trading_safe_usd)}</td>
                <td style="padding:10px 12px;color:#7c2d12;">${fmtN(s.trading_safe_sy)} ل.س</td>
                <td style="padding:10px 12px;color:#64748b;">${parseFloat(s.trading_safe_cost ?? 0).toFixed(4)}</td>
                <td style="padding:10px 12px;color:#5b21b6;font-weight:700;">$${fmtN(s.profit_safe_main)}</td>
                <td style="padding:10px 12px;color:#6d28d9;">${fmtN(s.profit_safe_trade)} ل.س</td>
            </tr>
        `,
      )
      .join("");
  } catch (err) {
    console.error("viewClosingSnapshots:", err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--danger);">
            <i class="fa-solid fa-circle-exclamation" style="font-size:24px;display:block;margin-bottom:8px;"></i>
            خطأ في تحميل بيانات الصناديق<br>
            <small style="color:var(--gray);">${err.message || ""}</small>
        </td></tr>`;
  }
}

/**
 * عرض الحوالات المؤرشفة لإقفال معيّن
 */
async function viewArchivedTransfers(month, officeId, monthLabel) {
  const modal = document.getElementById("archived-transfers-modal");
  const tbody = document.getElementById("archived-transfers-tbody");
  const title = document.getElementById("archived-modal-title");
  const sub = document.getElementById("archived-modal-sub");
  if (!modal || !tbody) return;

  // عنوان المودال
  if (title) title.textContent = `الحوالات المؤرشفة — ${monthLabel}`;
  if (sub) sub.textContent = officeId ? `مكتب #${officeId}` : "كل المكاتب";

  // إعادة ضبط الإحصاء
  ["arch-stat-count", "arch-stat-amount", "arch-stat-fee"].forEach((id) =>
    setText(id, "..."),
  );

  // عرض المودال مع لودر
  tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--gray);">
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
            <div style="width:28px;height:28px;border:3px solid #e5e7eb;border-top:3px solid #1e40af;
                        border-radius:50%;animation:acct-spin 0.8s linear infinite;"></div>
            <span>جاري تحميل الحوالات المؤرشفة...</span>
        </div>
    </td></tr>`;
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  try {
    // بناء رابط الطلب مع الفلاتر
    let url = `${API_URL}/monthly-closing/archived-transfers?month=${month}`;
    if (officeId) url += `&office_id=${officeId}`;

    const res = await fetch(url, { headers: getHeaders() });
    const json = await res.json();

    if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);

    const transfers = json.data || [];

    // حساب الإحصاءات
    const totalUsd = transfers.reduce(
      (s, t) => s + parseFloat(t.amount_in_usd || 0),
      0,
    );
    const totalFee = transfers.reduce((s, t) => s + parseFloat(t.fee || 0), 0);

    setText("arch-stat-count", transfers.length.toLocaleString("ar"));
    setText("arch-stat-amount", fmtMoney(totalUsd) + " USD");
    setText("arch-stat-fee", fmtMoney(totalFee) + " USD");

    if (!transfers.length) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--gray);">
                <i class="fa-solid fa-inbox" style="font-size:28px;opacity:.3;display:block;margin-bottom:10px;"></i>
                <p style="margin:0;font-weight:600;">لا توجد حوالات مؤرشفة لهذا الإقفال</p>
            </td></tr>`;
      return;
    }

    tbody.innerHTML = transfers
      .map((t, i) => {
        const sName = t.sender?.name || `#${t.sender_id}`;
        const curName = t.currency?.name || t.currency?.code || "—";
        const dateStr = (t.created_at || "").split("T")[0] || "—";
        const ref = t.tracking_code || "#" + t.id;
        const bg = i % 2 === 0 ? "#fff" : "#f8fafc";

        return `<tr style="background:${bg};">
                <td style="padding:10px 12px;color:var(--gray);font-size:11px;">${i + 1}</td>
                <td style="padding:10px 12px;font-weight:700;color:#1e40af;">${ref}</td>
                <td style="padding:10px 12px;">${sName}</td>
                <td style="padding:10px 12px;">${t.receiver_name || "—"}</td>
                <td style="padding:10px 12px;direction:ltr;font-size:11px;color:var(--gray);">${t.receiver_phone || "—"}</td>
                <td style="padding:10px 12px;font-weight:700;">
                    ${fmtMoney(t.amount)}
                    <small style="color:var(--gray);font-weight:400;"> ${curName}</small>
                </td>
                <td style="padding:10px 12px;font-weight:800;color:#1e40af;">
                    ${fmtMoney(t.amount_in_usd)}
                    <small style="color:var(--gray);font-weight:400;"> USD</small>
                </td>
                <td style="padding:10px 12px;color:#16a34a;font-weight:700;">${fmtMoney(t.fee)}</td>
                <td style="padding:10px 12px;font-size:11px;color:var(--gray);">${dateStr}</td>
            </tr>`;
      })
      .join("");
  } catch (err) {
    console.error("viewArchivedTransfers:", err);
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:28px;color:var(--danger);">
            <i class="fa-solid fa-circle-exclamation" style="font-size:24px;display:block;margin-bottom:8px;"></i>
            خطأ في تحميل البيانات<br>
            <small style="color:var(--gray);">${err.message || ""}</small>
        </td></tr>`;
  }
}

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

// ═══════════════════════════════════════════════════════════════════════
//  ② تصفية التقارير حسب الدولة المرسلة للحوالة
// ═══════════════════════════════════════════════════════════════════════

/**
 * قائمة الدول المتاحة (تُبنى من بيانات الحوالات الموجودة + API)
 * تُستدعى عند فتح قسم التقارير
 */
async function populateCountryFilter() {
  const sel = document.getElementById("rep-country");
  if (!sel) return;

  // احتفظ بالخيار الأول "الكل"
  while (sel.options.length > 1) sel.remove(1);

  // ① الدول المستخرجة من الحوالات الموجودة في الذاكرة (فورية)
  const localCountries = _extractCountriesFromTransfers(ALL_TRANSFERS);
  localCountries.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id ?? c.name;
    opt.textContent = c.name;
    sel.appendChild(opt);
  });

  // ② جلب كامل قائمة الدول من API (كمرجع)
  try {
    const res = await fetch(`${API_URL}/countries`, { headers: getHeaders() });
    const json = await res.json();
    const list = json.data || json || [];

    // دمج — لا نضيف إذا موجودة
    const existingValues = new Set([...sel.options].map((o) => o.value));
    list.forEach((country) => {
      const key = String(country.id);
      if (!existingValues.has(key)) {
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = country.name;
        sel.appendChild(opt);
        existingValues.add(key);
      }
    });
  } catch (e) {
    // API الدول غير متاح — نكتفي بما استُخرج من الحوالات
  }
}

/**
 * استخراج الدول الفريدة من مصفوفة الحوالات
 * يبحث في: destination_country_id (مع العلاقة)، destination_city، send_currency
 */
/**
 * استخراج الدول الفريدة من مصفوفة الحوالات بناءً على دولة المرسل (الزبون)
 */
function _extractCountriesFromTransfers(transfers) {
  const seen = new Set();
  const countries = [];

  transfers.forEach((t) => {
    // الوصول للكائن الخاص بالمرسل (sender) وليس الرقم (sender_id)
    const sender = t.sender;

    if (sender && sender.country_id) {
      const key = String(sender.country_id);
      if (!seen.has(key)) {
        seen.add(key);

        // في حال كانت العلاقة country محملة نأخذ الاسم، وإلا نضع نص مبدئي
        const countryName =
          sender.country?.name || `دولة #${sender.country_id}`;
        countries.push({ id: sender.country_id, name: countryName });
      }
    }
  });

  return countries;
}

/**
 * الاستعلام عن حوالة بناءً على دولة المرسل
 */
function _matchesCountry(transfer, countryValue) {
  if (!countryValue) return true;

  const sender = transfer.sender;
  if (!sender) return false;

  // مطابقة بالـ ID الخاص بدولة المرسل
  if (String(sender.country_id) === String(countryValue)) {
    return true;
  }

  // مطابقة باسم الدولة (في حال كان الفلتر يعتمد على الاسم بدلاً من الـ ID)
  if (sender.country?.name === countryValue) {
    return true;
  }

  return false;
}

/**
 * نسخة معدّلة من generateReport() تدعم فلتر الدولة
 * تستبدل الدالة الأصلية في accountant.js
 */

/**
 * نسخة معدّلة من exportReport() تدعم فلتر الدولة
 */

// ═══════════════════════════════════════════════════════════════════
//  BANK TRANSFERS — قسم الحوالات البنكية (للمحاسب — عرض وتصدير فقط)
// ═══════════════════════════════════════════════════════════════════

let ALL_BANK_TRANSFERS = [];     // كل السجلات من API
let FILTERED_BANK_TRANSFERS = []; // بعد تطبيق الفلاتر
let BT_PAGE = 1;
const BT_PER_PAGE = 15;

// ── جلب البيانات من API ──
async function loadBankTransfers() {
  const tbody = document.getElementById("bt-tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="13" style="text-align:center;padding:30px;color:var(--gray);">
    <i class="fa-solid fa-spinner fa-spin" style="font-size:22px;margin-bottom:8px;display:block;color:#3b82f6;"></i>
    جاري التحميل...</td></tr>`;

  try {
    const res = await fetch(`${API_URL}/bank-transfer`, { headers: getHeaders() });
    if (!res.ok) throw new Error("فشل الجلب");
    const json = await res.json();
    ALL_BANK_TRANSFERS = json.data || [];
  } catch (e) {
    ALL_BANK_TRANSFERS = [];
    tbody.innerHTML = `<tr><td colspan="13" style="text-align:center;padding:30px;color:#ef4444;">
      <i class="fa-solid fa-triangle-exclamation" style="margin-left:6px;"></i>
      تعذّر تحميل البيانات. تأكد من الاتصال بالخادم.</td></tr>`;
    return;
  }

  BT_PAGE = 1;
  filterBankTransfers();
}

// ── تطبيق البحث والفلتر ──
function filterBankTransfers() {
  const q     = (document.getElementById("bt-search")?.value || "").trim().toLowerCase();
  const stat  = document.getElementById("bt-filter-status")?.value || "";

  FILTERED_BANK_TRANSFERS = ALL_BANK_TRANSFERS.filter(t => {
    const agentName  = (t.agent?.name  || "").toLowerCase();
    const bankName   = (t.bank_name    || "").toLowerCase();
    const accNo      = (t.account_number || "").toLowerCase();
    const fullName   = (t.full_name    || "").toLowerCase();
    const recipName  = (t.recipient_name || "").toLowerCase();
    const phone      = (t.phone        || "").toLowerCase();

    const matchQ    = !q || [agentName, bankName, accNo, fullName, recipName, phone].some(v => v.includes(q));
    const matchStat = !stat || t.status === stat;
    return matchQ && matchStat;
  });

  BT_PAGE = 1;
  renderBankTransfersStats();
  renderBankTransfersTable();
}

// ── الإحصائيات ──
function renderBankTransfersStats() {
  const all = FILTERED_BANK_TRANSFERS;
  setText("bt-stat-total",     all.length);
  setText("bt-stat-pending",   all.filter(t => t.status === "pending").length);
  setText("bt-stat-completed", all.filter(t => t.status === "completed").length);
  setText("bt-stat-rejected",  all.filter(t => t.status === "rejected").length);
  const totalAmt = all.reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  setText("bt-stat-amount", `$${totalAmt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
}

// ── رسم الجدول ──
function renderBankTransfersTable() {
  const tbody = document.getElementById("bt-tbody");
  if (!tbody) return;

  const start  = (BT_PAGE - 1) * BT_PER_PAGE;
  const paged  = FILTERED_BANK_TRANSFERS.slice(start, start + BT_PER_PAGE);

  if (!paged.length) {
    tbody.innerHTML = `<tr><td colspan="13" style="text-align:center;padding:40px;color:var(--gray);">
      <i class="fa-solid fa-inbox" style="font-size:28px;display:block;margin-bottom:8px;"></i>
      لا توجد سجلات</td></tr>`;
    renderBtPagination();
    return;
  }

  const statusMap = {
    pending:        { label: "معلّق",        color: "#f59e0b", bg: "#fef3c7" },
    admin_approved: { label: "موافَق عليه",  color: "#3b82f6", bg: "#dbeafe" },
    completed:      { label: "مكتمل",        color: "#22c55e", bg: "#dcfce7" },
    rejected:       { label: "مرفوض",        color: "#ef4444", bg: "#fee2e2" },
  };

  tbody.innerHTML = paged.map((t, i) => {
    const s    = statusMap[t.status] || { label: t.status, color: "#6b7280", bg: "#f3f4f6" };
    const date = t.created_at ? new Date(t.created_at).toLocaleDateString("ar-SY") : "—";
    const rowBg = i % 2 === 0 ? "#fff" : "#f8fafc";

    return `<tr style="background:${rowBg};transition:background .15s;"
              onmouseover="this.style.background='#eff6ff'"
              onmouseout="this.style.background='${rowBg}'">
      <td style="padding:11px 14px;color:var(--gray);font-size:12px;">${start + i + 1}</td>
      <td style="padding:11px 14px;font-weight:600;">${t.agent?.name || "—"}</td>
      <td style="padding:11px 14px;">${t.bank_name || "—"}</td>
      <td style="padding:11px 14px;font-family:monospace;font-size:12px;">${t.account_number || "—"}</td>
      <td style="padding:11px 14px;">${t.full_name || "—"}</td>
      <td style="padding:11px 14px;">${t.recipient_name || "—"}</td>
      <td style="padding:11px 14px;direction:ltr;text-align:right;">${t.phone || "—"}</td>
      <td style="padding:11px 14px;">${t.destination_country || "—"}</td>
      <td style="padding:11px 14px;font-weight:700;color:#1d4ed8;">$${parseFloat(t.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
      <td style="padding:11px 14px;">
        <span style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:11px;
          font-weight:700;background:${s.bg};color:${s.color};">${s.label}</span>
      </td>
      <td style="padding:11px 14px;">${t.cashier?.name || "—"}</td>
      <td style="padding:11px 14px;font-size:12px;color:var(--gray);">${date}</td>
      <td style="padding:11px 14px;">
        <button onclick="showBtDetail(${t.id})"
          style="padding:5px 12px;border-radius:8px;border:1.5px solid #3b82f6;
          background:#fff;color:#1d4ed8;font-family:'Cairo',sans-serif;font-size:12px;
          font-weight:700;cursor:pointer;"
          onmouseover="this.style.background='#eff6ff'"
          onmouseout="this.style.background='#fff'">
          <i class="fa-solid fa-eye"></i>
        </button>
      </td>
    </tr>`;
  }).join("");

  renderBtPagination();
}

// ── pagination ──
function renderBtPagination() {
  const container = document.getElementById("bt-pagination");
  if (!container) return;
  const total = Math.ceil(FILTERED_BANK_TRANSFERS.length / BT_PER_PAGE);
  if (total <= 1) { container.innerHTML = ""; return; }

  let html = "";
  const btnStyle = (active) => `style="padding:7px 14px;border-radius:8px;border:1.5px solid ${active ? "#3b82f6" : "var(--border)"};
    background:${active ? "#3b82f6" : "#fff"};color:${active ? "#fff" : "var(--dark)"};
    font-family:'Cairo',sans-serif;font-size:13px;font-weight:700;cursor:pointer;"`;

  if (BT_PAGE > 1)
    html += `<button ${btnStyle(false)} onclick="btGoPage(${BT_PAGE - 1})">‹ السابق</button>`;

  for (let p = Math.max(1, BT_PAGE - 2); p <= Math.min(total, BT_PAGE + 2); p++)
    html += `<button ${btnStyle(p === BT_PAGE)} onclick="btGoPage(${p})">${p}</button>`;

  if (BT_PAGE < total)
    html += `<button ${btnStyle(false)} onclick="btGoPage(${BT_PAGE + 1})">التالي ›</button>`;

  container.innerHTML = html;
}

function btGoPage(p) {
  BT_PAGE = p;
  renderBankTransfersTable();
  document.getElementById("bank-transfers-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── مودال التفاصيل ──
function showBtDetail(id) {
  const t = ALL_BANK_TRANSFERS.find(x => x.id === id);
  if (!t) return;

  const statusMap = {
    pending:        { label: "معلّق",        color: "#f59e0b" },
    admin_approved: { label: "موافَق عليه",  color: "#3b82f6" },
    completed:      { label: "مكتمل",        color: "#22c55e" },
    rejected:       { label: "مرفوض",        color: "#ef4444" },
  };
  const s    = statusMap[t.status] || { label: t.status, color: "#6b7280" };
  const date = t.created_at ? new Date(t.created_at).toLocaleString("ar-SY") : "—";

  const field = (label, value) => `
    <div style="background:#f8fafc;border-radius:10px;padding:12px 14px;border:1px solid var(--border);">
      <div style="font-size:11px;color:var(--gray);font-weight:700;margin-bottom:4px;">${label}</div>
      <div style="font-size:14px;font-weight:700;color:var(--dark);">${value || "—"}</div>
    </div>`;

  document.getElementById("bt-detail-grid").innerHTML = `
    ${field("الوكيل",          t.agent?.name)}
    ${field("البنك",           t.bank_name)}
    ${field("رقم الحساب",     t.account_number)}
    ${field("صاحب الحساب",    t.full_name)}
    ${field("اسم المستلم",    t.recipient_name)}
    ${field("رقم الهاتف",     t.phone)}
    ${field("الدولة",          t.destination_country)}
    ${field("المدينة",         t.destination_city)}
    ${field("المبلغ (USD)",    `$${parseFloat(t.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`)}
    <div style="background:#f8fafc;border-radius:10px;padding:12px 14px;border:1px solid var(--border);">
      <div style="font-size:11px;color:var(--gray);font-weight:700;margin-bottom:4px;">الحالة</div>
      <div style="font-size:14px;font-weight:800;color:${s.color};">${s.label}</div>
    </div>
    ${field("الكاشير",         t.cashier?.name)}
    ${field("الموافق عليه",   t.approvedBy?.name)}
    ${field("تاريخ الطلب",    date)}
    <div style="background:#f8fafc;border-radius:10px;padding:12px 14px;border:1px solid var(--border);grid-column:1/-1;">
      <div style="font-size:11px;color:var(--gray);font-weight:700;margin-bottom:4px;">ملاحظات</div>
      <div style="font-size:13px;color:var(--dark);line-height:1.6;">${t.notes || "لا توجد ملاحظات"}</div>
    </div>`;

  const modal = document.getElementById("bt-detail-modal");
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
}

function closeBtModal() {
  const modal = document.getElementById("bt-detail-modal");
  if (modal) modal.style.display = "none";
}

// ── تصدير CSV ──
function exportBankTransfersCSV() {
  const data = FILTERED_BANK_TRANSFERS;
  if (!data.length) {
    showToast("لا توجد بيانات للتصدير", "error");
    return;
  }

  const statusLabel = {
    pending:        "معلّق",
    admin_approved: "موافَق عليه",
    completed:      "مكتمل",
    rejected:       "مرفوض",
  };

  const headers = [
    "#", "الوكيل", "البنك", "رقم الحساب", "صاحب الحساب", "اسم المستلم",
    "الهاتف", "الدولة", "المدينة", "المبلغ (USD)", "الحالة",
    "الكاشير", "الموافق عليه", "الملاحظات", "تاريخ الطلب"
  ];

  const rows = data.map((t, i) => [
    i + 1,
    t.agent?.name || "",
    t.bank_name || "",
    t.account_number || "",
    t.full_name || "",
    t.recipient_name || "",
    t.phone || "",
    t.destination_country || "",
    t.destination_city || "",
    parseFloat(t.amount || 0).toFixed(2),
    statusLabel[t.status] || t.status,
    t.cashier?.name || "",
    t.approvedBy?.name || "",
    (t.notes || "").replace(/[\r\n,]/g, " "),
    t.created_at ? new Date(t.created_at).toLocaleString("ar-SY") : "",
  ]);

  // BOM للعربية في Excel
  const BOM = "\uFEFF";
  const csv = BOM + [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `bank_transfers_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`تم تصدير ${data.length} سجل بنجاح ✓`);
}
/* ════════════════════════════════════════════════
   سجل العملات الرقمية — للمحاسب (جميع المكاتب)
════════════════════════════════════════════════ */

async function loadDigitalLogs() {
  const tbody = document.getElementById("dl-table-body");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="10" class="loading-row"><div class="loading-spinner"></div> جاري التحميل...</td></tr>`;

  const currency = document.getElementById("dl-filter-currency")?.value || "";
  const action   = document.getElementById("dl-filter-action")?.value   || "";
  const dateFrom = document.getElementById("dl-filter-from")?.value     || "";
  const dateTo   = document.getElementById("dl-filter-to")?.value       || "";

  const params = new URLSearchParams();
  if (currency) params.append("currency_type", currency);
  if (action)   params.append("action_type",   action);
  if (dateFrom) params.append("date_from",     dateFrom);
  if (dateTo)   params.append("date_to",       dateTo);
  params.append("per_page", "500");

  try {
    const res  = await fetch(`${API_URL}/electronic-safe/logs?${params}`, {
      headers: getHeaders(),
    });
    const json = await res.json();

    if (!res.ok) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:30px;color:#dc2626;">${json.message || "خطأ في جلب البيانات"}</td></tr>`;
      return;
    }

    const logs   = json.data   || [];
    const totals = json.totals || {};
    const count  = json.count  ?? logs.length;

    const fmt = (v) => parseFloat(v || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    });

    // تحديث Hero
    document.getElementById("dl-hero-buy").textContent   = "$" + fmt(totals.total_buy_profit);
    document.getElementById("dl-hero-sell").textContent  = "$" + fmt(totals.total_sell_profit);
    document.getElementById("dl-hero-total").textContent = "$" + fmt(totals.total_profit);

    // تحديث شريط الإحصاء
    document.getElementById("dl-stat-count").textContent = count;
    document.getElementById("dl-stat-buy").textContent   = "$" + fmt(totals.total_buy_profit);
    document.getElementById("dl-stat-sell").textContent  = "$" + fmt(totals.total_sell_profit);
    document.getElementById("dl-stat-total").textContent = "$" + fmt(totals.total_profit);

    if (!logs.length) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px;color:#94a3b8;">
        <i class="fa-solid fa-bitcoin-sign" style="font-size:32px;display:block;margin-bottom:10px;opacity:.3;"></i>
        لا توجد عمليات تطابق الفلتر المحدد</td></tr>`;
      return;
    }

    const currencyLabel = {
      syp_sham_cash: `<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;">شام كاش ليرة</span>`,
      usd_sham_cash: `<span style="background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;">شام كاش دولار</span>`,
      usdt:          `<span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;">USDT</span>`,
    };

    const fmtDate = (str) => {
      if (!str) return "—";
      const d = new Date(str);
      const p = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}/${p(d.getMonth()+1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
    };

    // حفظ البيانات للتصدير
    window._dlLogsCache = logs;

    tbody.innerHTML = logs.map((log) => {
      const badge = log.action_type === "buy"
        ? `<span style="background:#dcfce7;color:#15803d;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;"><i class="fa-solid fa-arrow-down-to-line"></i> شراء</span>`
        : `<span style="background:#fee2e2;color:#b91c1c;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;"><i class="fa-solid fa-arrow-up-from-line"></i> بيع</span>`;

      const profitColor = parseFloat(log.profit) >= 0 ? "#15803d" : "#b91c1c";

      return `<tr>
        <td style="font-size:12px;color:#94a3b8;">${log.id}</td>
        <td style="font-weight:600;font-size:12px;">${log.office_id || "—"}</td>
        <td>${currencyLabel[log.currency_type] || log.currency_type}</td>
        <td style="text-align:center;">${badge}</td>
        <td style="font-weight:600;">${fmt(log.amount)}</td>
        <td style="text-align:center;">${parseFloat(log.commission_rate).toFixed(2)}%</td>
        <td>${fmt(log.net_amount)}</td>
        <td style="font-weight:700;color:${profitColor};">${fmt(log.profit)}</td>
        <td style="font-size:12px;color:#64748b;max-width:160px;word-break:break-word;">${log.note || "—"}</td>
        <td style="font-size:11px;color:#94a3b8;white-space:nowrap;direction:ltr;text-align:right;">${fmtDate(log.created_at)}</td>
      </tr>`;
    }).join("");

  } catch (err) {
    console.error("loadDigitalLogs:", err);
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:30px;color:#dc2626;">خطأ في الاتصال بالسيرفر</td></tr>`;
  }
}

function exportDigitalLogs() {
  const logs = window._dlLogsCache;
  if (!logs || !logs.length) { showToast("لا توجد بيانات للتصدير", "error"); return; }

  const currencyMap = { syp_sham_cash: "شام كاش ليرة", usd_sham_cash: "شام كاش دولار", usdt: "USDT" };
  const actionMap   = { buy: "شراء", sell: "بيع" };
  const fmtDate = (str) => str ? new Date(str).toLocaleString("ar-SY") : "";

  const rows = [
    ["#", "المكتب", "نوع العملة", "العملية", "المبلغ", "نسبة العمولة%", "المبلغ الصافي", "الربح", "الملاحظة", "التاريخ"],
    ...logs.map(l => [
      l.id,
      l.office_id,
      currencyMap[l.currency_type] || l.currency_type,
      actionMap[l.action_type]     || l.action_type,
      l.amount,
      l.commission_rate,
      l.net_amount,
      l.profit,
      l.note || "",
      fmtDate(l.created_at),
    ])
  ];

  const csv = "\uFEFF" + rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "digital_logs.csv"; a.click();
  URL.revokeObjectURL(url);
}