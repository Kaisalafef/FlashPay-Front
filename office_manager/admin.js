const API_URL = 'http://127.0.0.1:8000/api';
async function checkAuth() {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        window.location.href = '../login/login.html';
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
async function loadAllTransfers() {
    const tbody  = document.getElementById('all-transfers-list');
    const emptyEl = document.getElementById('all-transfers-empty');
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--gray);">جاري التحميل...</td></tr>';

    try {
        const res  = await fetch(`${API_URL}/transfers`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const json = await res.json();
        tbody.innerHTML = '';

        if (!json.data || json.data.length === 0) {
            emptyEl?.classList.remove('hidden');
            document.getElementById('stat-all-count').textContent = '0';
            return;
        }

        emptyEl?.classList.add('hidden');
        document.getElementById('stat-all-count').textContent = json.data.length;

        const statusMap = {
            pending:   { cls: 'status-pending',  text: 'قيد الانتظار'      },
            approved:  { cls: 'status-approved', text: 'موافق عليها'        },
            waiting:   { cls: 'status-pending',  text: 'بانتظار المكتب'     },
            ready:     { cls: 'status-approved', text: 'جاهزة للتسليم'      },
            completed: { cls: 'status-approved', text: 'مكتملة'             },
            rejected:  { cls: 'status-rejected', text: 'مرفوضة'             },
            cancelled: { cls: 'status-rejected', text: 'ملغاة'              },
        };

        json.data.forEach(transfer => {
            const s = statusMap[transfer.status] ?? { cls: '', text: transfer.status };

            const amountUsd    = Number(transfer.amount_in_usd ?? 0);
            const sendAmount   = Number(transfer.amount ?? 0);
            const sendCurrency = transfer.send_currency?.code ?? transfer.sendCurrency?.code ?? '—';
            const recvCurrency = transfer.currency?.code ?? '—';
            const recvPrice    = Number(transfer.currency?.price ?? 1);
            const deliveryAmt  = recvPrice > 0 ? amountUsd / recvPrice : 0;
            const fee          = Number(transfer.fee ?? 0);

            // الوجهة
            const destHtml = transfer.destination_office_id
                ? `<div style="display:flex;align-items:center;gap:5px;font-size:12px;">
                     <i class="fa-solid fa-building" style="color:var(--primary);"></i>
                     <span>مكتب #${transfer.destination_office_id}</span>
                   </div>`
                : `<div style="display:flex;align-items:center;gap:5px;font-size:12px;">
                     <i class="fa-solid fa-globe" style="color:#7c3aed;"></i>
                     <span>${transfer.destination_city ?? '—'}</span>
                   </div>`;

            // كود التتبع
            const trackHtml = transfer.tracking_code
                ? `<span class="tracking-code">${transfer.tracking_code}</span>`
                : '';

            tbody.innerHTML += `
                <tr data-status="${transfer.status}">
                    <td>
                        <span style="font-weight:800;color:var(--primary);">#${transfer.id}</span>
                        ${trackHtml}
                    </td>
                    <td>
                        <div style="font-weight:800;color:var(--primary);">$${amountUsd.toFixed(2)}</div>
                        <div style="font-size:11px;color:var(--gray);direction:ltr;margin-top:2px;">
                            ${sendAmount.toFixed(2)} ${sendCurrency}
                        </div>
                        <div style="font-size:11px;color:#7c3aed;margin-top:2px;">
                            يستلم: <b>${deliveryAmt.toFixed(2)} ${recvCurrency}</b>
                        </div>
                    </td>
                    <td>
                        <div style="font-weight:700;">${transfer.sender?.name ?? '—'}</div>
                        <div style="font-size:11px;color:var(--gray);">${transfer.sender?.phone ?? ''}</div>
                    </td>
                    <td>
                        <div style="font-weight:700;">${transfer.receiver_name ?? '—'}</div>
                        <div style="font-size:11px;color:var(--gray);direction:ltr;">${transfer.receiver_phone ?? ''}</div>
                    </td>
                    <td>${destHtml}</td>
                    <td style="font-weight:700;color:var(--primary);">
                        ${fee > 0 ? '$' + fee.toFixed(2) : '<span style="color:var(--gray);">—</span>'}
                    </td>
                    <td>
                        <span class="status-badge ${s.cls}" data-status="${transfer.status}">${s.text}</span>
                    </td>
                    <td style="font-size:12px;color:var(--gray);">
                        ${new Date(transfer.created_at).toLocaleString('ar-SY')}
                    </td>
                    <td>
                        <button class="btn-edit-transfer"
                            onclick='openEditModal(${JSON.stringify(transfer).replace(/'/g, "\'")} )'>
                            <i class="fa-solid fa-pen-to-square"></i> تعديل
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (error) {
        console.error('loadAllTransfers error:', error);
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--danger);padding:20px;">خطأ في التحميل</td></tr>';
    }
}

// --- وظائف عرض الأقسام الجديدة ---

function hideAllCards() {
    document.getElementById('pending-transfers-card').style.display = 'none';
    document.getElementById('all-transfers-card').style.display = 'none';
    document.getElementById('office-info-card').style.display = 'none';
    document.getElementById('safes-card').style.display = 'none';
    document.getElementById('profits-card').style.display = 'none';
    const histCard = document.getElementById('transfer-history-card');
    if (histCard) histCard.style.display = 'none';

    document.getElementById('createtransfer').style.display = 'none';
    const intlCard = document.getElementById('createtransfer-intl');
    if (intlCard) intlCard.style.display = 'none';
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
        tradingUI = buildTradingUI(safe.currency_id, safe.office_id);
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


/* =============================================
   واجهة التداول المحسّنة – زر الاختيار السريع
   ============================================= */
function buildTradingUI(currencyId, officeId) {
    const amountChips = [50, 100, 200, 500, 1000];
    const priceChips  = [11500, 11700, 11750, 11800, 20000];

    const amountChipsHtml = amountChips.map(v =>
        `<button type="button" class="trade-chip" onclick="setTradeVal('buy_amount_${currencyId}','sell_amount_${currencyId}',${v})">${v}</button>`
    ).join('');

    const buyPriceChipsHtml = priceChips.map(v =>
        `<button type="button" class="trade-chip trade-chip-buy" onclick="setTradeVal('buy_price_${currencyId}',null,${v})">${v.toLocaleString()}</button>`
    ).join('');

    const sellPriceChipsHtml = priceChips.map(v =>
        `<button type="button" class="trade-chip trade-chip-sell" onclick="setTradeVal('sell_price_${currencyId}',null,${v})">${v.toLocaleString()}</button>`
    ).join('');

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
    if (el1) { el1.value = val; el1.dispatchEvent(new Event('input')); }
    if (id2) {
        const el2 = document.getElementById(id2);
        if (el2) el2.value = val;
    }
    // تأثير بصري على الزر المضغوط
    event.target.classList.add('trade-chip-active');
    setTimeout(() => event.target.classList.remove('trade-chip-active'), 600);
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
                <button class="btn-chat"
                        onclick="openChat(${transfer.id}, '${transfer.tracking_code ?? transfer.id}', ${transfer.sender?.id ?? 0})"
                        title="فتح الدردشة مع الزبون">
                    <i class="fa-solid fa-comments"></i>
                    دردشة
                </button>
            </td>
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

/* =============================================
   قسم إنشاء الحوالة الداخلية - Create Transfer
   ============================================= */

// بيانات مخزّنة مشتركة
let _ctCurrencies = [];
let _ctAllAgents  = [];
const SYRIA_COUNTRY_ID = 1;

/* ─────────────────────────────────────────────
   helper مشترك: جلب الوكلاء مع country_id كامل
   نستخدم /users لأن /agents لا يُرجع country_id
───────────────────────────────────────────── */
async function _fetchAllAgents() {
    try {
        const res = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const json = await res.json();
        const all = json.data ?? json ?? [];
        return all.filter(u => u.role === 'agent' && u.is_active !== false);
    } catch (e) {
        // fallback على /agents إذا فشل
        const res2 = await fetch(`${API_URL}/agents`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
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
    document.getElementById('createtransfer').style.display = 'block';
    ctInitForm();
}

async function ctInitForm() {
    const overlay = document.getElementById('ct-loading-overlay');
    const wrapper = document.getElementById('ct-form-wrapper');
    overlay.classList.remove('hidden');
    wrapper.style.opacity = '0.4';
    wrapper.style.pointerEvents = 'none';

    try {
        const [currRes, officeRes] = await Promise.all([
            fetch(`${API_URL}/currencies`, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } }),
            fetch(`${API_URL}/offices`,    { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } }),
        ]);

        // ── العملات ──
        const currJson = await currRes.json();
        _ctCurrencies = Array.isArray(currJson) ? currJson : (currJson.data ?? []);
        _fillCurrencySelect('ct-send-currency', 'اختر عملة الإرسال...');
        _fillCurrencySelect('ct-recv-currency', 'اختر عملة الاستلام...');

        // ── المكاتب ──
        const officeJson = await officeRes.json();
        const offices = officeJson.data ?? [];
        const officeSel = document.getElementById('ct-office');
        officeSel.innerHTML = '<option value="">اختر المكتب المستلم...</option>';
        offices.forEach(o => officeSel.appendChild(new Option(`${o.name} — ${o.city?.name ?? ''}`, o.id)));

    } catch (err) {
        console.error('ctInitForm error:', err);
        ctShowError('فشل تحميل البيانات من الخادم. حاول مرة أخرى.');
    } finally {
        overlay.classList.add('hidden');
        wrapper.style.opacity = '1';
        wrapper.style.pointerEvents = '';
    }
}

// helper: يملأ قائمة عملات
function _fillCurrencySelect(selId, placeholder) {
    const sel = document.getElementById(selId);
    if (!sel) return;
    sel.innerHTML = `<option value="">${placeholder}</option>`;
    _ctCurrencies.forEach(c => sel.appendChild(new Option(`${c.name} (${c.code})`, c.id)));
}

// حساب الدولار – داخلية
function ctCalculateUsd() {
    const amount     = parseFloat(document.getElementById('ct-amount').value);
    const sendCurrId = parseInt(document.getElementById('ct-send-currency').value);
    const usdVal     = document.getElementById('ct-usd-value');
    const usdPreview = document.getElementById('ct-usd-preview');

    if (!amount || !sendCurrId || isNaN(amount)) {
        usdVal.textContent = usdPreview.textContent = '$0.00'; return;
    }
    const currency = _ctCurrencies.find(c => c.id === sendCurrId);
    if (!currency?.price) { usdVal.textContent = usdPreview.textContent = '$0.00'; return; }

    const eq = (amount * parseFloat(currency.price)).toFixed(2);
    usdVal.textContent = usdPreview.textContent = `$${eq}`;
}

// معالجة رفع هوية المرسل – داخلية
function ctOnSenderIdChange(input) {
    const file = input.files[0];
    if (!file) return;
    document.getElementById('ct-sender-id-filename').textContent = file.name;
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('ct-sender-id-preview').src = e.target.result;
        document.getElementById('ct-sender-id-preview-wrap').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}
function ctRemoveSenderId() {
    document.getElementById('ct-sender-id-image').value = '';
    document.getElementById('ct-sender-id-filename').textContent = 'اضغط لرفع صورة الهوية';
    document.getElementById('ct-sender-id-preview-wrap').classList.add('hidden');
}

// إرسال الحوالة الداخلية
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('ct-transfer-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await ctSubmitTransfer();
    });
    document.getElementById('intl-transfer-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await intlSubmitTransfer();
    });
});

async function ctSubmitTransfer() {
    const amount        = document.getElementById('ct-amount').value.trim();
    const sendCurrId    = document.getElementById('ct-send-currency').value;
    const recvCurrId    = document.getElementById('ct-recv-currency').value;
    const officeId      = document.getElementById('ct-office').value;
    const senderName    = document.getElementById('ct-sender-name').value.trim();
    const senderIdFile  = document.getElementById('ct-sender-id-image').files[0];
    const receiverName  = document.getElementById('ct-receiver-name').value.trim();
    const receiverPhone = document.getElementById('ct-receiver-phone').value.trim();

    if (!amount || parseFloat(amount) < 1)  return ctShowError('يرجى إدخال مبلغ صحيح (1 أو أكثر)');
    if (!sendCurrId)    return ctShowError('يرجى اختيار عملة الإرسال');
    if (!recvCurrId)    return ctShowError('يرجى اختيار عملة الاستلام');
    if (!officeId)      return ctShowError('يرجى اختيار المكتب المستلم');
    if (!senderName)    return ctShowError('يرجى إدخال اسم المرسل');
    if (!senderIdFile)  return ctShowError('يرجى رفع صورة هوية المرسل');
    if (!receiverName)  return ctShowError('يرجى إدخال اسم المستلم');
    if (!receiverPhone) return ctShowError('يرجى إدخال رقم هاتف المستلم');

    const btn = document.getElementById('ct-submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإرسال...';

    try {
        const fd = new FormData();
        fd.append('amount',                parseFloat(amount));
        fd.append('send_currency_id',      parseInt(sendCurrId));
        fd.append('currency_id',           parseInt(recvCurrId));
        fd.append('destination_office_id', parseInt(officeId));
        fd.append('status',                'waiting');
        fd.append('receiver_name',         receiverName);
        fd.append('receiver_phone',        receiverPhone);
        fd.append('sender_name',           senderName);
        fd.append('sender_id_image',       senderIdFile);

        const res = await fetch(`${API_URL}/transfers`, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
            body: fd
        });

        const json = await res.json();
        if (res.status === 201) {
            ctShowSuccess(`تم إنشاء الحوالة بنجاح — كود التتبع: ${json.data?.tracking_code ?? ''}`);
            ctResetForm();
        } else {
            const msg = json.errors ? Object.values(json.errors).flat().join(' — ') : (json.message ?? 'حدث خطأ');
            ctShowError(msg);
        }
    } catch (err) {
        console.error('ctSubmitTransfer error:', err);
        ctShowError('تعذّر الاتصال بالخادم.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> تأكيد وإرسال الحوالة';
    }
}

function ctResetForm() {
    ['ct-amount','ct-sender-name','ct-receiver-name','ct-receiver-phone'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    ['ct-send-currency','ct-recv-currency','ct-office'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    document.getElementById('ct-usd-value').textContent = '$0.00';
    document.getElementById('ct-usd-preview').textContent = '$0.00';
    ctRemoveSenderId();
}

function ctShowSuccess(msg) {
    const t = document.getElementById('ct-success-toast');
    document.getElementById('ct-toast-msg').textContent = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 6000);
    document.getElementById('ct-error-toast').classList.add('hidden');
}
function ctShowError(msg) {
    const t = document.getElementById('ct-error-toast');
    document.getElementById('ct-error-msg').textContent = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 6000);
    document.getElementById('ct-success-toast').classList.add('hidden');
}

/* ─────────────────────────────────────────────
   الحوالة الخارجية (الدولية)
───────────────────────────────────────────── */
let _intlCurrencies = [];
let _intlAllAgents  = [];
let _intlAllCountries = [];

function createIntlTransferSection() {
    hideAllCards();
    document.getElementById('createtransfer-intl').style.display = 'block';
    intlInitForm();
}

async function intlInitForm() {
    const overlay = document.getElementById('intl-loading-overlay');
    const wrapper = document.getElementById('intl-form-wrapper');
    overlay.classList.remove('hidden');
    wrapper.style.opacity = '0.4';
    wrapper.style.pointerEvents = 'none';

    try {
        const [currRes, officeRes, countryRes] = await Promise.all([
            fetch(`${API_URL}/currencies`, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } }),
            fetch(`${API_URL}/offices`,    { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } }),
            fetch(`${API_URL}/countries`,  { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } }),
        ]);

        // ── العملات ──
        const currJson = await currRes.json();
        _intlCurrencies = Array.isArray(currJson) ? currJson : (currJson.data ?? []);
        _ctCurrencies = _intlCurrencies;

        const intlSendSel = document.getElementById('intl-send-currency');
        const intlRecvSel = document.getElementById('intl-recv-currency');
        intlSendSel.innerHTML = '<option value="">اختر عملة الإرسال...</option>';
        intlRecvSel.innerHTML = '<option value="">اختر عملة الاستلام...</option>';
        _intlCurrencies.forEach(c => {
            intlSendSel.appendChild(new Option(`${c.name} (${c.code})`, c.id));
            intlRecvSel.appendChild(new Option(`${c.name} (${c.code})`, c.id));
        });

        // ── المكاتب (يختارها المدير يدوياً) ──
        const officeJson = await officeRes.json();
        const offices = officeJson.data ?? [];
        const intlOfficeSel = document.getElementById('intl-office');
        intlOfficeSel.innerHTML = '<option value="">اختر المكتب المحلي...</option>';
        offices.forEach(o => intlOfficeSel.appendChild(new Option(`${o.name} — ${o.city?.name ?? ''}`, o.id)));

        // ── الدول (كل الدول ما عدا سوريا) ──
        const countryJson = await countryRes.json();
        _intlAllCountries = (countryJson.data ?? countryJson).filter(c => c.id !== SYRIA_COUNTRY_ID);
        const countrySel = document.getElementById('intl-country');
        countrySel.innerHTML = '<option value="">اختر الدولة المستلِمة...</option>';
        _intlAllCountries.forEach(c => countrySel.appendChild(new Option(c.name, c.id)));

        // تهيئة المدينة معطّلة حتى اختيار الدولة
        const citySel = document.getElementById('intl-city');
        citySel.innerHTML = '<option value="">اختر الدولة أولاً...</option>';
        citySel.disabled = true;

    } catch (err) {
        console.error('intlInitForm error:', err);
        intlShowError('فشل تحميل البيانات من الخادم. حاول مرة أخرى.');
    } finally {
        overlay.classList.add('hidden');
        wrapper.style.opacity = '1';
        wrapper.style.pointerEvents = '';
    }
}

// عند اختيار الدولة → جلب المدن من API
async function intlOnCountryChange() {
    const countryId = parseInt(document.getElementById('intl-country').value);
    const citySel   = document.getElementById('intl-city');

    // إعادة تعيين المدينة
    citySel.innerHTML = '<option value="">اختر الدولة أولاً...</option>';
    citySel.disabled  = true;

    if (!countryId) return;

    // ── جلب المدن ──
    citySel.innerHTML = '<option value="">جاري التحميل...</option>';
    try {
        const res  = await fetch(`${API_URL}/cities?country_id=${countryId}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const json = await res.json();
        const cities = json.data ?? json ?? [];

        citySel.innerHTML = '<option value="">اختر المدينة...</option>';
        if (cities.length === 0) {
            citySel.innerHTML = '<option value="" disabled>لا توجد مدن مسجلة لهذه الدولة</option>';
        } else {
            cities.forEach(c => citySel.appendChild(new Option(c.name, c.name)));
        }
        citySel.disabled = false;
    } catch (err) {
        console.error('cities fetch error:', err);
        citySel.innerHTML = '<option value="" disabled>فشل تحميل المدن</option>';
        citySel.disabled = false;
    }
}

// حساب الدولار – خارجية
function intlCalculateUsd() {
    const amount     = parseFloat(document.getElementById('intl-amount').value);
    const sendCurrId = parseInt(document.getElementById('intl-send-currency').value);
    const usdVal     = document.getElementById('intl-usd-value');
    const usdPreview = document.getElementById('intl-usd-preview');

    if (!amount || !sendCurrId || isNaN(amount)) {
        usdVal.textContent = usdPreview.textContent = '$0.00'; return;
    }
    const currency = _intlCurrencies.find(c => c.id === sendCurrId);
    if (!currency?.price) { usdVal.textContent = usdPreview.textContent = '$0.00'; return; }

    const eq = (amount * parseFloat(currency.price)).toFixed(2);
    usdVal.textContent = usdPreview.textContent = `$${eq}`;
}

// هوية المرسل – خارجية
function intlOnSenderIdChange(input) {
    const file = input.files[0];
    if (!file) return;
    document.getElementById('intl-sender-id-filename').textContent = file.name;
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('intl-sender-id-preview').src = e.target.result;
        document.getElementById('intl-sender-id-preview-wrap').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}
function intlRemoveSenderId() {
    document.getElementById('intl-sender-id-image').value = '';
    document.getElementById('intl-sender-id-filename').textContent = 'اضغط لرفع صورة الهوية';
    document.getElementById('intl-sender-id-preview-wrap').classList.add('hidden');
}

// إرسال الحوالة الدولية
async function intlSubmitTransfer() {
    const amount          = document.getElementById('intl-amount').value.trim();
    const sendCurrId      = document.getElementById('intl-send-currency').value;
    const recvCurrId      = document.getElementById('intl-recv-currency').value;
    const officeId        = document.getElementById('intl-office').value;
    const countryId       = document.getElementById('intl-country').value;
    const city            = document.getElementById('intl-city').value.trim();
    const senderName      = document.getElementById('intl-sender-name').value.trim();
    const senderIdFile    = document.getElementById('intl-sender-id-image').files[0];
    const receiverName    = document.getElementById('intl-receiver-name').value.trim();
    const receiverPhone   = document.getElementById('intl-receiver-phone').value.trim();

    if (!amount || parseFloat(amount) < 1)  return intlShowError('يرجى إدخال مبلغ صحيح');
    if (!sendCurrId)     return intlShowError('يرجى اختيار عملة الإرسال');
    if (!recvCurrId)     return intlShowError('يرجى اختيار عملة الاستلام');
    if (!officeId)       return intlShowError('يرجى اختيار المكتب المحلي');
    if (!countryId)      return intlShowError('يرجى اختيار الدولة المستلِمة');
    if (!city)           return intlShowError('يرجى اختيار المدينة في الخارج');
    if (!senderName)     return intlShowError('يرجى إدخال اسم المرسل');
    if (!senderIdFile)   return intlShowError('يرجى رفع صورة هوية المرسل');
    if (!receiverName)   return intlShowError('يرجى إدخال اسم المستلم');
    if (!receiverPhone)  return intlShowError('يرجى إدخال رقم هاتف المستلم');

    const btn = document.getElementById('intl-submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإرسال...';

    try {
        const fd = new FormData();
        fd.append('amount',                  parseFloat(amount));
        fd.append('send_currency_id',        parseInt(sendCurrId));
        fd.append('currency_id',             parseInt(recvCurrId));
        fd.append('destination_office_id',   parseInt(officeId));
        fd.append('destination_country_id',  parseInt(countryId));
        fd.append('destination_city',        city);
        fd.append('status',                  'waiting');
        fd.append('receiver_name',           receiverName);
        fd.append('receiver_phone',          receiverPhone);
        fd.append('sender_name',             senderName);
        fd.append('sender_id_image',         senderIdFile);

        const res = await fetch(`${API_URL}/transfers`, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
            body: fd
        });

        const json = await res.json();
        if (res.status === 201) {
            intlShowSuccess(`تم إنشاء الحوالة الدولية بنجاح — كود التتبع: ${json.data?.tracking_code ?? ''}`);
            intlResetForm();
        } else {
            const msg = json.errors ? Object.values(json.errors).flat().join(' — ') : (json.message ?? 'حدث خطأ');
            intlShowError(msg);
        }
    } catch (err) {
        console.error('intlSubmitTransfer error:', err);
        intlShowError('تعذّر الاتصال بالخادم.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-globe"></i> إرسال الحوالة الدولية';
    }
}

function intlResetForm() {
    // حقول النصوص
    ['intl-amount','intl-sender-name','intl-receiver-name','intl-receiver-phone'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    // القوائم المنسدلة
    ['intl-send-currency','intl-recv-currency','intl-office','intl-country'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    // إعادة تعيين المدينة (select) وتعطيلها
    const citySel = document.getElementById('intl-city');
    if (citySel) {
        citySel.innerHTML = '<option value="">اختر الدولة أولاً...</option>';
        citySel.disabled = true;
    }
    document.getElementById('intl-usd-value').textContent = '$0.00';
    document.getElementById('intl-usd-preview').textContent = '$0.00';
    intlRemoveSenderId();
}

function intlShowSuccess(msg) {
    const t = document.getElementById('intl-success-toast');
    document.getElementById('intl-toast-msg').textContent = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 6000);
    document.getElementById('intl-error-toast').classList.add('hidden');
}
function intlShowError(msg) {
    const t = document.getElementById('intl-error-toast');
    document.getElementById('intl-error-msg').textContent = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 6000);
    document.getElementById('intl-success-toast').classList.add('hidden');
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


/* =====================================================
   تعديل الحوالة — Modal
   ===================================================== */

function openEditModal(transfer) {
    // ملء المعلومات العامة (للقراءة فقط)
    const infoEl = document.getElementById('edit-transfer-info');
    if (infoEl) {
        const amtUsd  = Number(transfer.amount_in_usd ?? 0);
        const tracking = transfer.tracking_code ? ` | ${transfer.tracking_code}` : '';
        infoEl.innerHTML = `
            <span style="color:var(--primary);font-weight:800;">#${transfer.id}${tracking}</span>
            &nbsp;—&nbsp;
            <span>$${amtUsd.toFixed(2)}</span>
            &nbsp;|&nbsp;
            <span style="color:var(--gray);">المرسل: ${transfer.sender?.name ?? '—'}</span>
        `;
    }

    document.getElementById('edit-transfer-id').value     = transfer.id;
    document.getElementById('edit-receiver-name').value   = transfer.receiver_name   ?? '';
    document.getElementById('edit-receiver-phone').value  = transfer.receiver_phone  ?? '';
    document.getElementById('edit-amount').value          = transfer.amount           ?? '';
    document.getElementById('edit-fee').value             = transfer.fee              ?? '';
    document.getElementById('edit-notes').value           = '';

    const errEl = document.getElementById('edit-modal-error');
    if (errEl) errEl.classList.add('hidden');

    document.getElementById('edit-transfer-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    document.getElementById('edit-transfer-modal').classList.add('hidden');
    document.body.style.overflow = '';
}

// إغلاق عند الضغط على الخلفية
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('edit-transfer-modal');
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeEditModal();
        });
    }
});

async function saveTransferEdit() {
    const id    = document.getElementById('edit-transfer-id').value;
    const btn   = document.getElementById('edit-save-btn');
    const errEl = document.getElementById('edit-modal-error');
    const errTxt = document.getElementById('edit-modal-error-text');

    const receiverName  = document.getElementById('edit-receiver-name').value.trim();
    const receiverPhone = document.getElementById('edit-receiver-phone').value.trim();
    const amount        = parseFloat(document.getElementById('edit-amount').value);
    const fee           = parseFloat(document.getElementById('edit-fee').value) || 0;
    const notes         = document.getElementById('edit-notes').value.trim() || 'تعديل بيانات الحوالة';

    // Validation
    const showErr = (msg) => {
        errTxt.textContent = msg;
        errEl.classList.remove('hidden');
    };
    errEl.classList.add('hidden');

    if (!receiverName)       return showErr('يرجى إدخال اسم المستلم');
    if (!receiverPhone)      return showErr('يرجى إدخال رقم هاتف المستلم');
    if (!amount || amount<1) return showErr('يرجى إدخال مبلغ صحيح (1 أو أكثر)');

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';

    try {
        const res = await fetch(`${API_URL}/transfers/${id}/edit`, {
            method:  'PUT',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept':        'application/json'
            },
            body: JSON.stringify({ receiver_name: receiverName, receiver_phone: receiverPhone, amount, fee, notes })
        });

        const data = await res.json();

        if (res.ok) {
            closeEditModal();
            showAdminToast('✓ تم تعديل الحوالة وحفظ السجل بنجاح', 'success');
            loadAllTransfers();
        } else {
            const msg = data.errors
                ? Object.values(data.errors).flat().join(' — ')
                : (data.message || 'حدث خطأ أثناء التعديل');
            showErr(msg);
        }
    } catch (e) {
        console.error('saveTransferEdit error:', e);
        showErr('تعذّر الاتصال بالخادم. تحقق من الاتصال وحاول مجدداً.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ التعديلات';
    }
}

/* =====================================================
   إشعار Toast عام
   ===================================================== */
function showAdminToast(msg, type = 'success') {
    const old = document.getElementById('admin-global-toast');
    if (old) old.remove();

    const colors = {
        success: { bg: '#16a34a', shadow: 'rgba(22,163,74,0.35)' },
        error:   { bg: '#dc2626', shadow: 'rgba(220,38,38,0.35)'  },
    };
    const c = colors[type] || colors.success;

    const toast = document.createElement('div');
    toast.id = 'admin-global-toast';
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
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .4s'; }, 3000);
    setTimeout(() => toast.remove(), 3500);
}

/* =====================================================
   سجل التعديلات
   ===================================================== */
function showTransferHistorySection() {
    hideAllCards();
    const card = document.getElementById('transfer-history-card');
    if (card) card.style.display = 'block';
    loadTransferHistory();
}

async function loadTransferHistory() {
    const tbody    = document.getElementById('history-list');
    const emptyEl  = document.getElementById('history-empty');
    const countEl  = document.getElementById('stat-history-count');

    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--gray);">جاري التحميل...</td></tr>';
    emptyEl?.classList.add('hidden');

    try {
        const res  = await fetch(`${API_URL}/transfers/history/all`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const json = await res.json();
        tbody.innerHTML = '';

        if (!json.data || json.data.length === 0) {
            emptyEl?.classList.remove('hidden');
            if (countEl) countEl.textContent = '0';
            return;
        }

        if (countEl) countEl.textContent = json.data.length;

        const fieldLabels = {
            receiver_name:  'اسم المستلم',
            receiver_phone: 'رقم الهاتف',
            amount:         'المبلغ',
            fee:            'الرسوم',
        };

        json.data.forEach((h, idx) => {
            const oldD = h.old_data || {};
            const newD = h.new_data || {};

            // بناء خلية التغييرات (مقارنة قديم/جديد)
            let changesHtml = '';
            const allKeys = [...new Set([...Object.keys(oldD), ...Object.keys(newD)])];
            let hasChanges = false;

            allKeys.forEach(key => {
                const oldVal = oldD[key] ?? '—';
                const newVal = newD[key] ?? '—';
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
                changesHtml = '<span style="color:var(--gray);font-size:12px;">لا توجد تغييرات</span>';
            }

            const date = new Date(h.created_at).toLocaleString('ar-SY', {
                year:'numeric', month:'short', day:'numeric',
                hour:'2-digit', minute:'2-digit'
            });

            tbody.innerHTML += `
                <tr>
                    <td style="font-weight:700;color:var(--gray);">${idx + 1}</td>
                    <td>
                        <span style="font-weight:800;color:var(--primary);font-size:15px;">#${h.transfer_id}</span>
                    </td>
                    <td>
                        <div style="font-weight:700;">${h.admin?.name ?? '—'}</div>
                        <div style="font-size:11px;color:var(--gray);">${h.admin?.role ?? ''}</div>
                    </td>
                    <td>
                        <span class="status-badge" style="background:#fef3c7;color:#92400e;white-space:normal;max-width:180px;display:inline-block;">
                            ${h.action ?? 'تعديل'}
                        </span>
                    </td>
                    <td style="min-width:180px;">${changesHtml}</td>
                    <td style="font-size:12px;color:var(--gray);white-space:nowrap;">${date}</td>
                </tr>
            `;
        });

    } catch (e) {
        console.error('loadTransferHistory error:', e);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--danger);padding:20px;">خطأ في التحميل — تحقق من الاتصال</td></tr>';
    }
}

function filterHistoryTable() {
    const q = (document.getElementById('history-search')?.value || '').toLowerCase();
    document.querySelectorAll('#history-list tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
}

let token = null;

document.addEventListener('DOMContentLoaded', async () => {

    token = await checkAuth();
    if (!token) return;

loadPendingTransfers();
});

// =============================================================================
//  CHAT PANEL — وظائف لوحة الدردشة
//  تتواصل مع: GET  /api/transfers/{id}/messages
//              POST /api/transfers/{id}/messages
// =============================================================================

/** الحالة الداخلية للدردشة المفتوحة حالياً */
let _chat = {
    transferId:   null,
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
            const meRes  = await fetch(`${API_URL}/me`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            const meData = await meRes.json();
            _chat.currentUserId = meData.user?.id ?? 0;
        } catch (_) {}
    }

    // حفظ بيانات الجلسة
    _chat.transferId   = transferId;
    _chat.trackingCode = trackingCode;

    // تحديث الهيدر
    document.getElementById('chat-panel-name').textContent     = `دردشة مع الزبون`;
    document.getElementById('chat-panel-tracking').textContent = `رقم الحوالة: ${trackingCode}`;

    // إظهار اللوحة
    document.getElementById('chat-panel').classList.remove('hidden');
    document.getElementById('chat-panel-overlay').classList.remove('hidden');
    document.body.classList.add('chat-open');

    // تفريغ القائمة وتحميل الرسائل
    document.getElementById('chat-messages-list').innerHTML = '';
    document.getElementById('chat-empty').classList.add('hidden');
    document.getElementById('chat-loading').classList.remove('hidden');
    await loadChatMessages();

    // تركيز على حقل الكتابة
    document.getElementById('chat-message-input').focus();

    // Polling كل 8 ثوانٍ للرسائل الجديدة
    clearInterval(_chat.pollInterval);
    _chat.pollInterval = setInterval(loadChatMessages, 8000);
}

/** إغلاق لوحة الدردشة */
function closeChatPanel() {
    clearInterval(_chat.pollInterval);
    _chat.pollInterval = null;

    document.getElementById('chat-panel').classList.add('hidden');
    document.getElementById('chat-panel-overlay').classList.add('hidden');
    document.body.classList.remove('chat-open');

    _chat.transferId   = null;
    _chat.trackingCode = null;
}

/** تحميل رسائل الحوالة من API */
async function loadChatMessages() {
    if (!_chat.transferId) return;

    const listEl    = document.getElementById('chat-messages-list');
    const loadingEl = document.getElementById('chat-loading');
    const emptyEl   = document.getElementById('chat-empty');

    // نحتفظ بالـ scroll position لمنع القفز عند التحديث التلقائي
    const area         = document.getElementById('chat-messages-area');
    const wasAtBottom  = area.scrollHeight - area.scrollTop - area.clientHeight < 60;
    const prevCount    = listEl.querySelectorAll('.chat-bubble').length;

    try {
        const res  = await fetch(`${API_URL}/transfers/${_chat.transferId}/messages`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const json = await res.json();

        loadingEl.classList.add('hidden');

        const messages = json.data ?? json.messages ?? json ?? [];

        if (!Array.isArray(messages) || messages.length === 0) {
            emptyEl.classList.remove('hidden');
            listEl.innerHTML = '';
            return;
        }

        emptyEl.classList.add('hidden');

        // إعادة رسم فقط إذا تغيّر العدد (لتجنّب الوميض عند الـ polling)
        if (messages.length !== prevCount) {
            listEl.innerHTML = messages.map(msg => buildChatBubble(msg)).join('');
            if (wasAtBottom || messages.length !== prevCount) scrollChatToBottom();
        }

    } catch (err) {
        console.error('loadChatMessages error:', err);
        loadingEl.classList.add('hidden');
        if (!listEl.querySelector('.chat-bubble')) {
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
    const isMe      = msg.sender_id === _chat.currentUserId;
    const name      = msg.sender?.name ?? (isMe ? 'أنت' : 'الزبون');
    const text      = msg.message ?? msg.text ?? '';
    const imageUrl  = msg.image_url ?? msg.image ?? null;   // ← حقل الصورة من الـ API
    const time      = msg.created_at
        ? new Date(msg.created_at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })
        : '';
    const sideClass = isMe ? 'bubble-me' : 'bubble-other';

    // ── محتوى الفقاعة: صورة أو نص أو كليهما معاً ──
    let contentHtml = '';

    if (imageUrl) {
        // عرض الصورة — نُنشئ رابطاً كاملاً إذا كان relative path
        const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${API_URL.replace('/api', '')}/${imageUrl.replace(/^\//, '')}`;
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
            ${!isMe ? `<div class="bubble-name">${escapeHtml(name)}</div>` : ''}
            <div class="bubble-body">
                ${contentHtml}
                ${time ? `<span class="bubble-time">${time}</span>` : ''}
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
    if (!file.type.startsWith('image/')) {
        alert('يرجى اختيار ملف صورة صالح (JPG, PNG, GIF, ...)');
        event.target.value = '';
        return;
    }

    // التحقق من الحجم (الحد الأقصى 5 MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً. الحد الأقصى المسموح 5 ميغابايت');
        event.target.value = '';
        return;
    }

    _chatSelectedImage = file;

    // عرض المعاينة
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('chat-img-preview-thumb').src = e.target.result;
        document.getElementById('chat-img-preview-name').textContent = file.name;
        document.getElementById('chat-img-preview-size').textContent = formatFileSize(file.size);
        document.getElementById('chat-img-preview-bar').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
    document.getElementById('chat-message-input').focus();
}

/** إلغاء اختيار الصورة */
function clearImageSelection() {
    _chatSelectedImage = null;
    document.getElementById('chat-image-input').value = '';
    document.getElementById('chat-img-preview-bar').classList.add('hidden');
    document.getElementById('chat-img-preview-thumb').src = '';
}

/** تنسيق حجم الملف */
function formatFileSize(bytes) {
    if (bytes < 1024)       return bytes + ' B';
    if (bytes < 1024*1024)  return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/(1024*1024)).toFixed(1) + ' MB';
}

/** مشغّل الصورة fullscreen (lightbox بسيط) */
function openImageLightbox(url) {
    const lb = document.createElement('div');
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
    lb.onclick = (e) => { if (e.target === lb) lb.remove(); };
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

    const input   = document.getElementById('chat-message-input');
    const sendBtn = document.getElementById('chat-send-btn');
    const text    = input.value.trim();
    if (!text) return;

    sendBtn.disabled  = true;
    sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    input.disabled    = true;

    try {
        const res = await fetch(`${API_URL}/transfers/${_chat.transferId}/messages`, {
            method:  'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept':        'application/json'
            },
            body: JSON.stringify({ message: text })
        });

        if (res.ok) {
            input.value = '';
            input.style.height = 'auto';
            await loadChatMessages();
            scrollChatToBottom();
        } else {
            const err = await res.json();
            alert(err.message ?? 'تعذّر إرسال الرسالة');
        }
    } catch (e) {
        console.error('sendChatMessage error:', e);
        alert('خطأ في الاتصال');
    } finally {
        sendBtn.disabled  = false;
        sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
        input.disabled    = false;
        input.focus();
    }
}

/** إرسال صورة عبر multipart/form-data */
async function sendChatImage() {
    if (!_chat.transferId || !_chatSelectedImage) return;

    const sendBtn = document.getElementById('chat-send-btn');
    const input   = document.getElementById('chat-message-input');

    sendBtn.disabled  = true;
    sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    input.disabled    = true;

    try {
        const fd = new FormData();
        fd.append('image', _chatSelectedImage);

        // إذا كان هناك نص مرافق للصورة أضفه أيضاً
        const caption = input.value.trim();
        if (caption) fd.append('message', caption);

        const res = await fetch(`${API_URL}/transfers/${_chat.transferId}/messages`, {
            method:  'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept':        'application/json'
                // لا تضف Content-Type — المتصفح يضعها تلقائياً مع الـ boundary
            },
            body: fd
        });

        if (res.ok) {
            input.value = '';
            input.style.height = 'auto';
            clearImageSelection();
            await loadChatMessages();
            scrollChatToBottom();
        } else {
            const err = await res.json().catch(() => ({}));
            alert(err.message ?? 'تعذّر إرسال الصورة');
        }
    } catch (e) {
        console.error('sendChatImage error:', e);
        alert('خطأ في الاتصال أثناء رفع الصورة');
    } finally {
        sendBtn.disabled  = false;
        sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
        input.disabled    = false;
        input.focus();
    }
}

/** Enter = إرسال / Shift+Enter = سطر جديد */
function handleChatKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessageOrImage();
    }
}

/** تمدّد الـ textarea تلقائياً */
function autoResizeTextarea(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

/** تمرير منطقة الرسائل للأسفل */
function scrollChatToBottom() {
    const area = document.getElementById('chat-messages-area');
    if (area) area.scrollTop = area.scrollHeight;
}

/** تهرب HTML لمنع XSS */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}