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

        // ── الوكلاء: نجلب من /users ليتضمن country_id ──
        _ctAllAgents = await _fetchAllAgents();

        // فلتر وكلاء سوريا
        const syAgents = _ctAllAgents.filter(a => parseInt(a.country_id) === SYRIA_COUNTRY_ID);
        const agentSel = document.getElementById('ct-agent');
        agentSel.innerHTML = '<option value="">اختر الوكيل داخل سوريا...</option>';

        // إذا لم يُعثر على وكلاء بـ country_id (بيانات غير مكتملة) → اعرض الكل مع تحذير
        const toShow = syAgents.length > 0 ? syAgents : _ctAllAgents;
        if (syAgents.length === 0) {
            console.warn('لم يُعثر على وكلاء بـ country_id=1 — سيتم عرض كل الوكلاء');
        }
        toShow.forEach(a =>
            agentSel.appendChild(new Option(`${a.name}${a.phone ? ' — ' + a.phone : ''}`, a.id))
        );

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
    const agentId       = document.getElementById('ct-agent').value;
    const senderName    = document.getElementById('ct-sender-name').value.trim();
    const senderIdFile  = document.getElementById('ct-sender-id-image').files[0];
    const receiverName  = document.getElementById('ct-receiver-name').value.trim();
    const receiverPhone = document.getElementById('ct-receiver-phone').value.trim();

    if (!amount || parseFloat(amount) < 1)  return ctShowError('يرجى إدخال مبلغ صحيح (1 أو أكثر)');
    if (!sendCurrId)    return ctShowError('يرجى اختيار عملة الإرسال');
    if (!recvCurrId)    return ctShowError('يرجى اختيار عملة الاستلام');
    if (!officeId)      return ctShowError('يرجى اختيار المكتب المستلم');
    if (!agentId)       return ctShowError('يرجى اختيار الوكيل');
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
        fd.append('destination_agent_id',  parseInt(agentId));
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
    ['ct-send-currency','ct-recv-currency','ct-office','ct-agent'].forEach(id => {
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

        // ── الوكلاء: نجلب من /users ليتضمن country_id ──
        _intlAllAgents = await _fetchAllAgents();

        // وكيل المرسِل = كل الوكلاء بدون تقييد
        const localSel = document.getElementById('intl-agent-local');
        localSel.innerHTML = '<option value="">اختر وكيل المرسِل...</option>';
        _intlAllAgents.forEach(a =>
            localSel.appendChild(new Option(`${a.name}${a.phone ? ' — ' + a.phone : ''}`, a.id))
        );

        // وكيل الخارج + المدينة = فارغان حتى اختيار الدولة
        document.getElementById('intl-agent-foreign').innerHTML = '<option value="">اختر الدولة أولاً...</option>';
        const citySel = document.getElementById('intl-city');
        citySel.innerHTML = '<option value="">اختر الدولة أولاً...</option>';
        citySel.disabled = true;

        // ── الدول (كل الدول ما عدا سوريا) ──
        const countryJson = await countryRes.json();
        _intlAllCountries = (countryJson.data ?? countryJson).filter(c => c.id !== SYRIA_COUNTRY_ID);
        const countrySel = document.getElementById('intl-country');
        countrySel.innerHTML = '<option value="">اختر الدولة المستلِمة...</option>';
        _intlAllCountries.forEach(c => countrySel.appendChild(new Option(c.name, c.id)));

    } catch (err) {
        console.error('intlInitForm error:', err);
        intlShowError('فشل تحميل البيانات من الخادم. حاول مرة أخرى.');
    } finally {
        overlay.classList.add('hidden');
        wrapper.style.opacity = '1';
        wrapper.style.pointerEvents = '';
    }
}

// عند اختيار الدولة → جلب المدن من API + فلترة وكلاء الخارج
async function intlOnCountryChange() {
    const countryId = parseInt(document.getElementById('intl-country').value);
    const citySel   = document.getElementById('intl-city');
    const agentSel  = document.getElementById('intl-agent-foreign');

    // إعادة تعيين المدينة والوكيل
    citySel.innerHTML  = '<option value="">اختر الدولة أولاً...</option>';
    agentSel.innerHTML = '<option value="">اختر الدولة أولاً...</option>';
    citySel.disabled   = true;

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

    // ── فلترة وكلاء الخارج ──
    const foreignAgents = _intlAllAgents.filter(a => parseInt(a.country_id) === countryId);
    agentSel.innerHTML = '<option value="">اختر الوكيل الخارجي...</option>';
    if (foreignAgents.length === 0) {
        const noOpt = new Option('لا يوجد وكلاء مسجلون في هذه الدولة', '');
        noOpt.disabled = true;
        agentSel.appendChild(noOpt);
        agentSel.appendChild(new Option('— بدون وكيل محدد —', '0'));
    } else {
        foreignAgents.forEach(a =>
            agentSel.appendChild(new Option(`${a.name}${a.phone ? ' — ' + a.phone : ''}`, a.id))
        );
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
    const agentLocalId    = document.getElementById('intl-agent-local').value;
    const officeId        = document.getElementById('intl-office').value;
    const countryId       = document.getElementById('intl-country').value;
    const city            = document.getElementById('intl-city').value.trim();
    const agentForeignId  = document.getElementById('intl-agent-foreign').value;
    const senderName      = document.getElementById('intl-sender-name').value.trim();
    const senderIdFile    = document.getElementById('intl-sender-id-image').files[0];
    const receiverName    = document.getElementById('intl-receiver-name').value.trim();
    const receiverPhone   = document.getElementById('intl-receiver-phone').value.trim();

    if (!amount || parseFloat(amount) < 1)  return intlShowError('يرجى إدخال مبلغ صحيح');
    if (!sendCurrId)     return intlShowError('يرجى اختيار عملة الإرسال');
    if (!recvCurrId)     return intlShowError('يرجى اختيار عملة الاستلام');
    if (!agentLocalId)   return intlShowError('يرجى اختيار وكيل المرسِل');
    if (!officeId)       return intlShowError('يرجى اختيار المكتب المحلي');
    if (!countryId)      return intlShowError('يرجى اختيار الدولة المستلِمة');
    if (!city)           return intlShowError('يرجى اختيار المدينة في الخارج');
    if (!agentForeignId) return intlShowError('يرجى اختيار الوكيل الخارجي');
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
        fd.append('destination_agent_id',    parseInt(agentLocalId));  // وكيل سوريا يستلم أولاً
        fd.append('destination_office_id',   parseInt(officeId));
        fd.append('destination_country_id',  parseInt(countryId));
        fd.append('destination_city',        city);
        fd.append('destination_agent_id_foreign', parseInt(agentForeignId)); // ملاحظة: Backend قد يحتاج تعديل
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
    ['intl-send-currency','intl-recv-currency','intl-agent-local','intl-office','intl-country','intl-agent-foreign'].forEach(id => {
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

let token = null;

document.addEventListener('DOMContentLoaded', async () => {

    token = await checkAuth();
    if (!token) return;

loadPendingTransfers();
});