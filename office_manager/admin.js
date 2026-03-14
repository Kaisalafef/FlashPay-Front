const API_URL = 'http://127.0.0.1:8000/api';
async function checkAuth() {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        window.location.href = '/FlashPay-Front/login/login.html';
        return null;
    }

    try {
        const res = await fetch(`${API_URL}/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        // التوكن غير صالح (بعد migrate:fresh مثلاً)
        if (!res.ok) {
            localStorage.clear();
            window.location.href = '../login/login.html';
            return null;
        }

        // تحديث اسم المستخدم في الهيدر
        try {
            const meR = await fetch(`${API_URL}/me`, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } });
            if (meR.ok) {
                const meD = await meR.json();
                const nameEl = document.getElementById('admin-name');
                if (nameEl) nameEl.textContent = meD.user?.name || 'Admin';
            }
        } catch(_) {}
        return token;

    } catch (e) {
        localStorage.clear();
        window.location.href = '../login/login.html';
        return null;
    }
}


async function rejectTransfer(transferId) {
    try {
        const res = await fetch(`${API_URL}/transfers/${transferId}/update-status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                status: 'rejected'
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert('تم رفض الحوالة');
            loadPendingTransfers();
        } else {
            alert(data.message || 'حدث خطأ');
        }

    } catch (error) {
        console.error(error);
        alert('خطأ في الاتصال');
    }
}
async function showAllTransfers() {
    document.querySelector('.card').style.display = 'none';
    document.getElementById('all-transfers-card').style.display = 'block';
    loadAllTransfers(); 
}
function showPendingTransfers(){
    document.getElementById('pending-transfers-card').style.display = 'block';
    document.getElementById('all-transfers-card').style.display = 'none';
}
function showAllTransfers(){
    document.getElementById('pending-transfers-card').style.display = 'none';
    document.getElementById('all-transfers-card').style.display = 'block';

    loadAllTransfers(); // فصل التحميل عن العرض (أفضل تنظيم)
}

function setActive(element){
    document.querySelectorAll('.sidebar nav li')
        .forEach(li => li.classList.remove('active'));

    element.parentElement.classList.add('active');
}
async function loadAllTransfers(){
    try {
        const res = await fetch(`${API_URL}/transfers`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const json = await res.json();
        const tbody = document.getElementById('all-transfers-list');
        tbody.innerHTML = '';

        if (json.status === 'success' && Array.isArray(json.data)) {

            json.data.forEach(transfer => {
                let statusClass = '';
                let statusText = '';

                switch(transfer.status){
                    case 'pending':
                        statusClass = 'status-badge status-pending';
                        statusText = 'بانتظار الوكيل';
                        break;
                    case 'approved':
                        statusClass = 'status-badge status-approved';
                        statusText = 'موافق عليها';
                        break;
                    case 'waiting':
                        statusClass = 'status-badge status-pending';
                        statusText = 'بانتظار موافقة المكتب';
                        break;
                    case 'ready':
                        statusClass = 'status-badge status-approved';
                        statusText = 'جاهزة للتسليم';
                        break;
                    case 'completed':
                        statusClass = 'status-badge status-approved';
                        statusText = 'مكتملة';
                        break;
                    case 'rejected':
                        statusClass = 'status-badge status-rejected';
                        statusText = 'مرفوضة';
                        break;
                    case 'cancelled':
                        statusClass = 'status-badge status-rejected';
                        statusText = 'ملغاة';
                        break;
                    default:
                        statusClass = 'status-badge';
                        statusText = transfer.status;
                }

                // ── المبالغ ──────────────────────────────────────────────
                const amountUsd    = Number(transfer.amount_in_usd ?? 0);
                const sendAmount   = Number(transfer.amount ?? 0);
                const sendCurrency = transfer.send_currency?.code
                                   ?? transfer.sendCurrency?.code ?? '—';
                const recvCurrency = transfer.currency?.code ?? '—';
                const recvPrice    = Number(transfer.currency?.price ?? 1);
                const deliveryAmt  = recvPrice > 0 ? amountUsd / recvPrice : 0;

                tbody.innerHTML += `
                    <tr>
                        <td>#${transfer.id}</td>
                        <td>
                            <div style="font-weight:800; color:var(--primary);">
                                $${amountUsd.toFixed(2)}
                            </div>
                            <div style="font-size:11px; color:var(--gray); margin-top:2px; direction:ltr;">
                                ${sendAmount.toFixed(2)} ${sendCurrency}
                            </div>
                        </td>
                        <td>${transfer.sender ? transfer.sender.name : '-'}</td>
                        <td>
                            <div>${transfer.receiver_name}</div>
                            <div style="font-size:11px; color:var(--gray); margin-top:2px;">
                                يستلم: <b>${deliveryAmt.toFixed(2)} ${recvCurrency}</b>
                            </div>
                        </td>
                        <td><span class="${statusClass}">${statusText}</span></td>
                        <td>${new Date(transfer.created_at).toLocaleString('ar-SY')}</td>
                    </tr>
                `;
            });
        }
    } catch (error) {
        console.error(error);
    }
}

// --- وظائف عرض الأقسام الجديدة ---

function hideAllCards() {
    document.getElementById('pending-transfers-card').style.display = 'none';
    document.getElementById('all-transfers-card').style.display = 'none';
    document.getElementById('office-info-card').style.display = 'none';
    document.getElementById('safes-card').style.display = 'none';
    document.getElementById('profits-card').style.display = 'none';
}

async function showOfficeSection() {
    hideAllCards();
    document.getElementById('office-info-card').style.display = 'block';
    
    try {
        // 1. جلب بيانات المستخدم الحالي لمعرفة مكتبه
        const meRes = await fetch(`${API_URL}/me`, { headers: { 'Authorization': `Bearer ${token}` } });
        console.log("Me Response:", meRes);
        const meData = await meRes.json();
        const myOfficeId = meData.user.office_id;
         console.log("My Office ID:", myOfficeId);
        // 2. جلب بيانات المكتب
        const officeRes = await fetch(`${API_URL}/offices`, { headers: { 'Authorization': `Bearer ${token}` } });
       console.log("Offices Response:", officeRes);
        const officesJson = await officeRes.json();
        const myOffice = officesJson.data.find(o => o.id === myOfficeId);
        console.log("myOffice",myOffice)
        if (myOffice) {
            document.getElementById('office-details').innerHTML = `
                <div class="office-info-item">
                    <i class="fa-solid fa-building"></i>
                    <div><span class="info-label">اسم المكتب</span><span class="info-value">${myOffice.name}</span></div>
                </div>
                <div class="office-info-item">
                    <i class="fa-solid fa-city"></i>
                    <div><span class="info-label">المدينة</span><span class="info-value">${myOffice.city?.name || '—'}</span></div>
                </div>
                <div class="office-info-item">
                    <i class="fa-solid fa-map-marker-alt"></i>
                    <div><span class="info-label">العنوان</span><span class="info-value">${myOffice.address || 'غير محدد'}</span></div>
                </div>
            `;
            const statStaff = document.getElementById('stat-staff-count');
        }

        // 3. جلب الموظفين وفلترتهم حسب المكتب
        const usersRes = await fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } });
        const usersJson = await usersRes.json();
const staff = usersJson.data.filter(u => u.office_id === myOfficeId && (u.role === 'cashier' || u.role === 'accountant'));
        const tbody = document.getElementById('staff-list');
        tbody.innerHTML = staff.map(user => `
            <tr>
                <td>${user.name}</td>
                <td>${user.role === 'cashier' ? 'كاشير' : 'محاسب'}</td>
                <td>${user.phone}</td>
                <td><span class="status-badge status-approved">نشط</span></td>
            </tr>
        `).join('');

    } catch (e) { console.error("Error loading office info:", e); }
}

async function showSafesSection() {
    hideAllCards();
    document.getElementById('safes-card').style.display = 'block';

    try {
        const res = await fetch(`${API_URL}/safes`, { headers: { 'Authorization': `Bearer ${token}` } });
        const json = await res.json();
        
        // جلب بياناتي فقط (بناءً على اسم المكتب)
        const meRes = await fetch(`${API_URL}/me`, { headers: { 'Authorization': `Bearer ${token}` } });
        const meData = await meRes.json();
        
        // فلترة الصناديق الخاصة بمكتبي فقط
    const myOfficeId = meData.user.office_id;

const mySafes = json.data.filter(s => 
    s.office_id === myOfficeId
);
console.log("My Safes:", mySafes);

        const container = document.getElementById('safes-container');
container.innerHTML = mySafes.map(safe => {
    let title = '';
    let icon = '';
    let bg = '';
    let tradingUI = '';

    if(safe.type === 'office_main'){
        title = 'الصندوق الرئيسي';
        icon = 'fa-vault';
        bg = '#f0f9ff';
    }

    if(safe.type === 'trading'){
        title = 'صندوق المبيعات / التداول';
        icon = 'fa-chart-line';
        bg = '#fff9f0';
        
        // واجهة التداول الخاصة بالصندوق
        tradingUI = `
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px dashed #cbd5e1;">
                <h5 style="color: #475569; margin-bottom: 12px; font-size: 13px;">إدارة عمليات التداول</h5>
                
                <div style="display: flex; gap: 8px; margin-bottom: 10px; align-items: center;">
                    <input type="number" id="buy_amount_${safe.currency_id}" class="trading-input" placeholder="الكمية" min="0" step="any">
                    <input type="number" id="buy_price_${safe.currency_id}" class="trading-input" placeholder="سعر الشراء" min="0" step="any">
                    <button class="btn-approve" style="flex: 1;" onclick="executeTrade('buy', ${safe.office_id}, ${safe.currency_id})">
                        <i class="fa-solid fa-arrow-down"></i> شراء
                    </button>
                </div>

                <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="number" id="sell_amount_${safe.currency_id}" class="trading-input" placeholder="الكمية" min="0" step="any">
                    <input type="number" id="sell_price_${safe.currency_id}" class="trading-input" placeholder="سعر البيع" min="0" step="any">
                    <button class="btn-reject" style="flex: 1;" onclick="executeTrade('sell', ${safe.office_id}, ${safe.currency_id})">
                        <i class="fa-solid fa-arrow-up"></i> بيع
                    </button>
                </div>
            </div>
        `;
    }

    const cardClass = safe.type === 'trading' ? 'safe-card safe-card-trading' : 'safe-card safe-card-main';
    return `
    <div class="${cardClass}">
        <div class="safe-card-header">
            <div class="safe-card-icon">
                <i class="fa-solid ${icon}"></i>
            </div>
            <div>
                <div class="safe-card-title">${title}</div>
                <div class="safe-card-subtitle">${safe.currency || 'USD'}</div>
            </div>
        </div>
        <div class="safe-card-balance">${parseFloat(safe.balance).toLocaleString()}</div>
        <div class="safe-card-currency">${safe.currency || 'USD'}</div>
        ${safe.cost !== null && safe.cost !== undefined ? `
            <div style="font-size:12px;color:var(--gray);margin-top:8px;font-weight:600;padding:8px 12px;background:var(--light);border-radius:8px;">
                متوسط التكلفة: <span style="color:var(--primary);font-weight:800;">${parseFloat(safe.cost).toFixed(2)}</span>
            </div>` : ''}
        ${tradingUI}
    </div>
    `;
}).join('');
    } catch (e) { console.error("Error loading safes:", e); }
}


async function executeTrade(type, officeId, currencyId) {
    const amountInput = document.getElementById(`${type}_amount_${currencyId}`);
    const priceInput = document.getElementById(`${type}_price_${currencyId}`);

    const amount = parseFloat(amountInput.value);
    const price = parseFloat(priceInput.value);

    if (!amount || amount <= 0 || !price || price <= 0) {
        alert('يرجى إدخال كمية وسعر صحيحين');
        return;
    }

    // تجهيز البيانات للإرسال
    const payload = {
        office_id: officeId,
        currency_id: currencyId,
        amount: amount
    };

    if (type === 'buy') payload.buy_price = price;
    if (type === 'sell') payload.sell_price = price;

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
            if(type === 'sell'){
                alert(`تمت عملية البيع بنجاح!\nالربح المحقق: ${parseFloat(data.profit).toFixed(2)}`);
            } else {
                alert('تمت عملية الشراء بنجاح ودمج متوسط التكلفة!');
            }
            // إعادة تفريغ الحقول وتحديث عرض الصناديق
            amountInput.value = '';
            priceInput.value = '';
            showSafesSection(); 
        } else {
            alert(data.message || 'حدث خطأ أثناء العملية');
        }

    } catch (error) {
        console.error(error);
        alert('حدث خطأ في الاتصال بالخادم');
    }
}
// تعديل الوظائف القديمة لتعمل مع النظام الجديد
function showPendingTransfers() {
    hideAllCards();
    document.getElementById('pending-transfers-card').style.display = 'block';
    loadPendingTransfers();
}

function showAllTransfers() {
    hideAllCards();
    document.getElementById('all-transfers-card').style.display = 'block';
    loadAllTransfers();
}
async function loadPendingTransfers() {
    try {
        // التعديل الأهم: جلب الحوالات التي حالتها waiting بدلاً من pending
        const res = await fetch(`${API_URL}/transfers?status=waiting`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json' 
            }
        });
        
        if (!res.ok) {
            console.error("Server Error:", res.status);
            return;
        }

        const json = await res.json();
        const tbody = document.getElementById('transfers-list');
        tbody.innerHTML = '';

        if (json.status === 'success' && Array.isArray(json.data)) {
            json.data.forEach(transfer => {
                // ── المبالغ ──────────────────────────────────────────────
                const amountUsd      = Number(transfer.amount_in_usd ?? 0);
                const sendAmount     = Number(transfer.amount ?? 0);
                const sendCurrency   = transfer.send_currency?.code
                                    ?? transfer.sendCurrency?.code ?? '—';
                const recvCurrency   = transfer.currency?.code ?? '—';
                const recvPrice      = Number(transfer.currency?.price ?? 1);
                const deliveryAmount = recvPrice > 0 ? amountUsd / recvPrice : 0;

    tbody.innerHTML += `
        <tr>
            <td>#${transfer.id}</td>
            <td>
                <div style="font-weight:800; color:var(--primary);">
                    $${amountUsd.toFixed(2)}
                </div>
                <div style="font-size:11px; color:var(--gray); margin-top:2px; direction:ltr;">
                    ${sendAmount.toFixed(2)} ${sendCurrency}
                </div>
            </td>
            <td>${transfer.sender?.name ?? '—'}</td>
            <td>
                <div style="font-weight:700;">${transfer.receiver_name}</div>
                <div style="font-size:11px; color:var(--gray); margin-top:2px;">
                    يستلم: <b>${deliveryAmount.toFixed(2)} ${recvCurrency}</b>
                </div>
            </td>
            <td><span style="color: orange;">بانتظار الموافقة</span></td>
            <td>
                <input type="number"
                       id="fee_${transfer.id}"
                       placeholder="الرسوم"
                       min="0" inputmode="decimal"
                       style="width:80px; margin-bottom:5px;">
                <br>
                <button class="btn-approve"
                        onclick="approveTransfer(${transfer.id})">
                        موافقة
                </button>
                <button class="btn-reject"
                        onclick="rejectTransfer(${transfer.id})">
                        رفض
                </button>
            </td>
        </tr>
    `;
});
        }
    } catch (error) {
        console.error("Error loading transfers:", error);
    }
}async function approveTransfer(transferId) {

    const feeInput = document.getElementById(`fee_${transferId}`);
    const feeValue = feeInput.value;

    if (feeValue === "" || feeValue < 0) {
        alert("يرجى إدخال رسوم صحيحة");
        return;
    }

    try {
        const res = await fetch(
            `${API_URL}/transfers/${transferId}/update-status`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    status: 'ready',
                    fee: Number(feeValue)
                })
            }
        );

        const data = await res.json();

        if (res.ok) {
            alert('تمت الموافقة وتحويلها إلى جاهزة للتسليم');
            loadPendingTransfers();
        } else {
            alert(data.message || 'حدث خطأ');
        }

    } catch (error) {
        console.error(error);
        alert('خطأ في الاتصال');
    }
}
/* ============================= */
/* أرباح التداول - الأدمن        */
/* ============================= */

function showProfitsSection() {
    hideAllCards();
    document.getElementById('profits-card').style.display = 'block';

    // تعيين تاريخ اليوم كافتراضي إن لم يكن محدداً
    const dateInput = document.getElementById('report-date');
    if (!dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    loadTradingReport();
}

async function loadTradingReport() {
    const dateInput  = document.getElementById('report-date');
    const date       = dateInput.value || new Date().toISOString().split('T')[0];
    const summaryEl  = document.getElementById('profits-summary');
    const tableEl    = document.getElementById('profits-table');
    const emptyEl    = document.getElementById('profits-empty');
    const tbodyEl    = document.getElementById('profits-list');

    // حالة التحميل
    summaryEl.innerHTML = '<p style="color:var(--gray);font-size:13px;padding:10px 0;">جاري التحميل...</p>';
    tableEl.style.display = 'none';
    emptyEl.style.display  = 'none';
    tbodyEl.innerHTML = '';

    try {
        const res = await fetch(`${API_URL}/trading/report/details?date=${date}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const json = await res.json();

        if (!res.ok) {
            summaryEl.innerHTML = `<p style="color:var(--danger);">${json.message || 'فشل تحميل البيانات'}</p>`;
            return;
        }

        const transactions = json.transactions || [];
        const summary      = json.summary     || {};

        // ===== بطاقات الملخص =====
        const totalProfit = parseFloat(summary.total_net_profit || 0);
        const profitColor = totalProfit >= 0 ? 'var(--success)' : 'var(--danger)';
        const profitIcon  = totalProfit >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';

        const cardStyle = 'background:var(--white);border-radius:var(--radius-sm);padding:20px;box-shadow:var(--shadow);border:1px solid var(--border);';

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
                    ${totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
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
            emptyEl.style.display = 'block';
            const _pph = document.getElementById('profits-placeholder'); if(_pph) _pph.style.display='none';
            return;
        }

        // ===== صفوف الجدول =====
        transactions.forEach((tx, index) => {
            const isBuy   = tx.type === 'buy';
            const profit  = parseFloat(tx.profit || 0);
            const pColor  = profit > 0 ? 'var(--success)' : profit < 0 ? 'var(--danger)' : 'var(--gray)';

            const typeBadge = isBuy
                ? `<span class="status-badge" style="background:#dcfce7;color:#166534;">شراء</span>`
                : `<span class="status-badge" style="background:#fee2e2;color:#991b1b;">بيع</span>`;

            const profitCell = isBuy
                ? `<span style="color:var(--gray);font-size:12px;">—</span>`
                : `<span style="color:${pColor};font-weight:700;">${profit >= 0 ? '+' : ''}${profit.toFixed(2)}</span>`;

            tbodyEl.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${typeBadge}</td>
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
        const _ptwS = document.getElementById('profits-table-wrapper'); if(_ptwS) _ptwS.style.display='block';

    } catch (error) {
        console.error('Error loading trading report:', error);
        summaryEl.innerHTML = '<p style="color:var(--danger);">خطأ في الاتصال بالسيرفر</p>';
    }
}

async function handleLogout() {
    await fetch(`${API_URL}/logout`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    localStorage.removeItem('auth_token');
    window.location.href = '../login/login.html';
}

let token = null;

document.addEventListener('DOMContentLoaded', async () => {

    token = await checkAuth();
    if (!token) return;

loadPendingTransfers();
});