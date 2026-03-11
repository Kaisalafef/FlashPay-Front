const API_URL = "http://127.0.0.1:8000/api";
let token = null;

/* ============================= */
/*            AUTH              */
/* ============================= */

async function checkAuth() {
  const storedToken = localStorage.getItem("auth_token");

  if (!storedToken) {
    window.location.href = "../login/login.html";
    return null;
  }

  try {
    const res = await fetch(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${storedToken}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      localStorage.clear();
      window.location.href = "../login/login.html";
      return null;
    }

    return storedToken;
  } catch (e) {
    localStorage.clear();
    window.location.href = "../login/login.html";
    return null;
  }
}

/* ============================= */
/*      LOAD READY TRANSFERS    */
/* ============================= */

async function loadNewTransfers() {
  try {
    const res = await fetch(`${API_URL}/transfers?status=ready`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const json = await res.json();
    const tbody = document.getElementById("new-transfers-list");
    tbody.innerHTML = "";

    if (json.status === "success" && Array.isArray(json.data)) {
    json.data.forEach((transfer) => {

    const amount = Number(transfer.amount);
    

   const currencyPrice = Number(transfer.currency?.price ?? 1);
const currencyCode = transfer.currency?.code ?? "USD";
    const deliveryPrice = amount / currencyPrice;

    tbody.innerHTML += `
      <tr>
          <td>#${transfer.id}</td>
          <td>${transfer.sender?.name ?? "-"}</td>
          <td>$${amount.toFixed(2)}</td>
          <td>${currencyCode}</td>
          <td style="font-weight:bold; color:#1e3c72;">
              ${deliveryPrice.toFixed(2)} ${currencyCode}
          </td>
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

        <span class="file-name" id="file_name_${transfer.id}">
            لم يتم اختيار ملف
        </span>

        <img id="preview_${transfer.id}" class="preview-img hidden">

    </div>

    <button id="btn_${transfer.id}"
            onclick="acceptTransfer(${transfer.id})"
            class="btn-primary">
        تأكيد التسليم
    </button>
</td>
      </tr>
    `;
});
    }

  } catch (error) {
    console.error("Error loading transfers:", error);
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

  // منع الضغط المكرر
  button.disabled = true;
  button.innerText = "جاري المعالجة...";

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
      }
    );

    const data = await res.json();

    if (res.ok) {
      alert("تم تسليم الحوالة بنجاح");
      loadNewTransfers();
    } else {
      alert(data.message || "فشل التحديث");
      button.disabled = false;
      button.innerText = "تأكيد التسليم";
    }

  } catch (error) {
    console.error(error);
    alert("خطأ في الاتصال");
    button.disabled = false;
    button.innerText = "تأكيد التسليم";
  }
}

/* ============================= */

async function handleLogout() {
  await fetch(`${API_URL}/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  localStorage.removeItem("auth_token");
  window.location.href = "../login/login.html";
}
/* ============================= */
/* NAVIGATION & UI         */
/* ============================= */
function setActive(element) {
    document.querySelectorAll('.sidebar nav ul li').forEach(li => li.classList.remove('active'));
    element.parentElement.classList.add('active');
}

function showTransfersSection() {
    document.getElementById('safes-card').style.display = 'none';
    // البحث عن الكارت الذي يحتوي على جدول الحوالات
    const cards = document.querySelectorAll('.main-content .card');
    cards.forEach(card => {
        if(card.id !== 'safes-card') card.style.display = 'block';
    });
    loadNewTransfers();
}

function showSafesSection() {
    const cards = document.querySelectorAll('.main-content .card');
    cards.forEach(card => {
        if(card.id !== 'safes-card') card.style.display = 'none';
    });
    document.getElementById('safes-card').style.display = 'block';
    loadTradingSafes();
}

function showProfitsSection() {
    const cards = document.querySelectorAll('.main-content .card');
    cards.forEach(card => {
        if(card.id !== 'profits-card') card.style.display = 'none';
    });
    document.getElementById('profits-card').style.display = 'block';

    // تعيين تاريخ اليوم كافتراضي
    const dateInput = document.getElementById('report-date');
    if (!dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    loadTradingReport();
}

/* ============================= */
/* جلب وعرض صناديق التداول      */
/* ============================= */

async function loadTradingSafes() {
    try {
        const res = await fetch(`${API_URL}/main-safes`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        const data = await res.json();
        if (res.ok) {
            // تصفية البيانات لعرض صناديق التداول (trading) فقط
            const tradingSafes = data.data.filter(safe => safe.type === 'trading');
            renderTradingSafes(tradingSafes);
        }
    } catch (error) {
        console.error("Error loading trading safes:", error);
    }
}

function renderTradingSafes(safes) {
    const container = document.getElementById('safes-container');
    if (safes.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">لا توجد صناديق تداول متاحة حالياً.</p>';
        return;
    }

    container.innerHTML = safes.map(safe => `
        <div class="safe-card" style="padding:20px; border-radius:12px; border:2px solid #eee; background:#fff9f0; display:flex; flex-direction:column;">
            <h4 style="color:#1e3c72; margin-bottom:10px;">
                <i class="fa-solid fa-chart-line"></i> صندوق التداول (${safe.currency})
            </h4>

            <div style="font-size:24px; font-weight:bold; color:#222;">
                ${parseFloat(safe.balance).toLocaleString()} 
                <small>${safe.currency}</small>
            </div>

            <div style="font-size:13px; color:#64748b; margin-top:5px; font-weight:600;">
                متوسط التكلفة: <span style="color:#1e3c72;">${parseFloat(safe.cost || 0).toFixed(2)}</span>
            </div>

            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px dashed #cbd5e1;">
                <h5 style="color: #475569; margin-bottom: 12px; font-size: 13px;">إدارة عمليات التداول</h5>
                
                <div style="display: flex; gap: 8px; margin-bottom: 10px; align-items: center;">
                    <input type="number" id="buy_amount_${safe.currency_id}" class="trading-input" placeholder="الكمية" step="any">
                    <input type="number" id="buy_price_${safe.currency_id}" class="trading-input" placeholder="سعر الشراء" step="any">
                    <button class="btn-approve" style="flex: 1;" onclick="executeTrade('buy', ${safe.office_id}, ${safe.currency_id})">
                         شراء
                    </button>
                </div>

                <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="number" id="sell_amount_${safe.currency_id}" class="trading-input" placeholder="الكمية" step="any">
                    <input type="number" id="sell_price_${safe.currency_id}" class="trading-input" placeholder="سعر البيع" step="any">
                    <button class="btn-reject" style="flex: 1;" onclick="executeTrade('sell', ${safe.office_id}, ${safe.currency_id})">
                         بيع
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

async function executeTrade(type, officeId, currencyId) {
    const amount = document.getElementById(`${type}_amount_${currencyId}`).value;
    const price = document.getElementById(`${type}_price_${currencyId}`).value;

    if (!amount || amount <= 0 || !price || price <= 0) {
        alert('يرجى إدخال قيم صحيحة للكمية والسعر');
        return;
    }

    const payload = {
        office_id: officeId,
        currency_id: currencyId,
        amount: parseFloat(amount)
    };
    if (type === 'buy') payload.buy_price = parseFloat(price);
    else payload.sell_price = parseFloat(price);

    try {
        const res = await fetch(`${API_URL}/trading/${type}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok) {
            alert(type === 'buy' ? 'تمت عملية الشراء بنجاح' : `تمت عملية البيع! الربح: ${data.profit}`);
            loadTradingSafes(); // تحديث الأرصدة
        } else {
            alert(data.message || 'فشلت العملية');
        }
    } catch (error) {
        alert('خطأ في الاتصال بالسيرفر');
    }
}
/* ============================= */

/* ============================= */
/* تقرير أرباح التداول           */
/* ============================= */

async function loadTradingReport() {
    const dateInput = document.getElementById('report-date');
    const date = dateInput.value || new Date().toISOString().split('T')[0];

    const summaryEl  = document.getElementById('profits-summary');
    const tableEl    = document.getElementById('profits-table');
    const emptyEl    = document.getElementById('profits-empty');
    const tbodyEl    = document.getElementById('profits-list');

    summaryEl.innerHTML = '<p style="color:var(--gray); font-size:13px;">جاري التحميل...</p>';
    tableEl.style.display  = 'none';
    emptyEl.style.display  = 'none';
    tbodyEl.innerHTML = '';

    try {
        const res = await fetch(`${API_URL}/trading/report/details?date=${date}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json'
            }
        });

        const json = await res.json();
        if (!res.ok) {
            summaryEl.innerHTML = `<p style="color:var(--danger);">${json.message || 'فشل تحميل البيانات'}</p>`;
            return;
        }

        const transactions = json.transactions || [];
        const summary      = json.summary || {};

        // ===== بطاقات الملخص =====
        const totalProfit = parseFloat(summary.total_net_profit || 0);
        const profitColor = totalProfit >= 0 ? 'var(--success)' : 'var(--danger)';
        const profitIcon  = totalProfit >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';

        summaryEl.innerHTML = `
            <div class="card" style="margin:0;">
                <div class="stat-card">
                    <div class="icon blue"><i class="fa-solid fa-cart-arrow-down"></i></div>
                    <div>
                        <div style="font-size:12px; color:var(--gray); margin-bottom:4px;">إجمالي المشتريات</div>
                        <div style="font-size:20px; font-weight:bold;">${parseFloat(summary.total_bought || 0).toFixed(2)}</div>
                    </div>
                </div>
            </div>
            <div class="card" style="margin:0;">
                <div class="stat-card">
                    <div class="icon orange"><i class="fa-solid fa-cart-arrow-up"></i></div>
                    <div>
                        <div style="font-size:12px; color:var(--gray); margin-bottom:4px;">إجمالي المبيعات</div>
                        <div style="font-size:20px; font-weight:bold;">${parseFloat(summary.total_sold || 0).toFixed(2)}</div>
                    </div>
                </div>
            </div>
            <div class="card" style="margin:0;">
                <div class="stat-card">
                    <div class="icon" style="background:${profitColor};"><i class="fa-solid ${profitIcon}"></i></div>
                    <div>
                        <div style="font-size:12px; color:var(--gray); margin-bottom:4px;">صافي الربح / الخسارة</div>
                        <div style="font-size:20px; font-weight:bold; color:${profitColor};">
                            ${totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>
            <div class="card" style="margin:0;">
                <div class="stat-card">
                    <div class="icon purple"><i class="fa-solid fa-list-ol"></i></div>
                    <div>
                        <div style="font-size:12px; color:var(--gray); margin-bottom:4px;">عدد العمليات</div>
                        <div style="font-size:20px; font-weight:bold;">${transactions.length}</div>
                    </div>
                </div>
            </div>
        `;

        if (transactions.length === 0) {
            emptyEl.style.display = 'block';
            return;
        }

        // ===== صفوف الجدول =====
        transactions.forEach((tx, index) => {
            const isBuy    = tx.type === 'buy';
            const profit   = parseFloat(tx.profit || 0);
            const pColor   = profit > 0 ? 'var(--success)' : profit < 0 ? 'var(--danger)' : 'var(--gray)';
            const typeLabel = isBuy
                ? `<span style="background:#e8f5e9; color:var(--success); padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600;">شراء</span>`
                : `<span style="background:#fdecea; color:var(--danger); padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600;">بيع</span>`;

            const profitCell = isBuy
                ? `<span style="color:var(--gray); font-size:12px;">—</span>`
                : `<span style="color:${pColor}; font-weight:bold;">${profit >= 0 ? '+' : ''}${profit.toFixed(2)}</span>`;

            tbodyEl.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${typeLabel}</td>
                    <td>${tx.currency?.code ?? '—'}</td>
                    <td>${parseFloat(tx.amount).toFixed(2)}</td>
                    <td>${parseFloat(tx.price).toFixed(2)}</td>
                    <td style="color:#64748b;">${parseFloat(tx.cost_at_time || 0).toFixed(2)}</td>
                    <td>${profitCell}</td>
                    <td>${tx.transaction_date ?? '—'}</td>
                    <td>${tx.user?.name ?? '—'}</td>
                </tr>
            `;
        });

        tableEl.style.display = 'table';

    } catch (error) {
        console.error('Error loading report:', error);
        summaryEl.innerHTML = '<p style="color:var(--danger);">خطأ في الاتصال بالسيرفر</p>';
    }
}

/* ============================= */

document.addEventListener("DOMContentLoaded", async () => {
  token = await checkAuth();
  if (!token) return;

  loadNewTransfers();
});