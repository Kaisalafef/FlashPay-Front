// =====================================================
//   accountant.js — FlashPay
//   البيانات كلها من API حقيقي — لا يوجد بيانات ثابتة
// =====================================================

const API_URL = 'http://127.0.0.1:8000/api';

// ─────────────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────────────
let ALL_TRANSFERS = [];   // كل الحوالات القادمة من API
let filteredData  = [];   // بعد تطبيق الفلاتر
let currentPage   = 1;
const PER_PAGE    = 15;
let sortField     = 'created_at';
let sortAsc       = false;

// ─────────────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────────────
window.onload = async function () {
    checkAuth();
    setDate();
    loadUserInfo();
    await fetchAllTransfers();
};

// ─────────────────────────────────────────────────────
//  AUTH
// ─────────────────────────────────────────────────────
function checkAuth() {
    if (!localStorage.getItem('auth_token')) {
        window.location.href = '../login/login.html';
    }
}

function getHeaders() {
    return {
        'Authorization': 'Bearer ' + localStorage.getItem('auth_token'),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
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
            window.location.href = '../login/login.html';
            return;
        }

        const json = await res.json();

        if (json.status === 'success' && Array.isArray(json.data)) {
            ALL_TRANSFERS = json.data;
        } else {
            ALL_TRANSFERS = [];
            showToast('تعذّر جلب البيانات من الخادم', 'error');
        }
    } catch (err) {
        ALL_TRANSFERS = [];
        showToast('خطأ في الاتصال بالخادم 🌐', 'error');
    } finally {
        showPageLoader(false);
        renderDashboard();
        renderSummarySection();
        // إذا كان قسم الحوالات مفتوحاً أعِد رسمه
        if (document.getElementById('transfers-section')?.classList.contains('active')) {
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
    return t.sender?.name || '—';
}

/** اسم عملة الإرسال */
function currencyName(t) {
    return t.currency?.name || t.currency?.code || '—';
}

/** اسم عملة الاستلام */
function sendCurrencyName(t) {
    return t.send_currency?.name || t.send_currency?.code || '—';
}

/** تاريخ الإنشاء بصيغة YYYY-MM-DD */
function transferDate(t) {
    return (t.created_at || '').split('T')[0] || '—';
}

/** رقم التتبع أو رقم الحوالة */
function transferRef(t) {
    return t.tracking_code || ('#' + t.id);
}

// ─────────────────────────────────────────────────────
//  DATE & USER INFO
// ─────────────────────────────────────────────────────
function setDate() {
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const el = document.getElementById('dashboard-date');
    if (el) el.textContent = new Date().toLocaleDateString('ar-SY', opts);
}

function loadUserInfo() {
    try {
        const u = JSON.parse(localStorage.getItem('user_data') || '{}');
        if (u.name) {
            setText('user-name', u.name);
            setText('hero-name', u.name.split(' ')[0]);
        }
    } catch (e) {}
}

// ─────────────────────────────────────────────────────
//  NAVIGATION
// ─────────────────────────────────────────────────────
function showSection(name) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar nav li').forEach(l => l.classList.remove('active'));

    document.getElementById(name + '-section')?.classList.add('active');
    document.getElementById('nav-' + name)?.classList.add('active');

    const titles = {
        dashboard : 'لوحة المحاسب',
        transfers : 'سجل الحوالات',
        summary   : 'ملخص الحسابات',
        reports   : 'التقارير'
    };
    setText('page-heading', titles[name] || '');

    if (name === 'transfers') renderTransfersSection();
    if (name === 'summary')   renderSummarySection();

    closeSidebar();
}

// ─────────────────────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────────────────────
function renderDashboard() {
    const all   = ALL_TRANSFERS;
    const today = new Date().toISOString().split('T')[0];

    const todayItems = all.filter(t => transferDate(t) === today);
    const completed  = all.filter(t => t.status === 'completed');
    const pending    = all.filter(t => t.status === 'pending');
    const cancelled  = all.filter(t => t.status === 'cancelled' || t.status === 'rejected');

    // amount_in_usd هو المبلغ المحوّل بالدولار
    const totalUSD  = all.reduce((s, t) => s + parseFloat(t.amount_in_usd || 0), 0);
    // fee هي العمولة
    const totalFees = all.reduce((s, t) => s + parseFloat(t.fee || 0), 0);

    setText('stat-total',         fmt(all.length));
    setText('stat-today-count',   'اليوم: ' + todayItems.length);
    setText('stat-completed',     fmt(completed.length));
    setText('stat-completed-pct', 'النسبة: ' + (all.length ? Math.round(completed.length / all.length * 100) : 0) + '%');
    setText('stat-pending',       fmt(pending.length));
    setText('stat-amount',        fmtMoney(totalUSD));
    setText('stat-commission',    fmtMoney(totalFees));
    setText('stat-cancelled',     fmt(cancelled.length));

    renderWeekChart(all);
    renderStatusChart(all);
    renderRecentTable(all);
}

function renderWeekChart(all) {
    const box = document.getElementById('week-chart');
    if (!box) return;

    const days = [];
    const now  = new Date();
    for (let i = 6; i >= 0; i--) {
        const d  = new Date(now);
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        days.push({
            label : d.toLocaleDateString('ar', { weekday: 'short' }),
            count : all.filter(t => transferDate(t) === ds).length
        });
    }

    const max = Math.max(...days.map(d => d.count), 1);
    box.innerHTML = days.map(d => `
        <div class="mini-bar-wrap">
            <div class="mini-bar"
                 style="height:${Math.max(4, Math.round(d.count / max * 72))}px"
                 title="${d.count} حوالة"></div>
            <div class="mini-bar-label">${d.label}</div>
        </div>
    `).join('');
}

function renderStatusChart(all) {
    // جمع الحالات الفعلية الموجودة في البيانات
    const counts = {};
    all.forEach(t => {
        const s = t.status || 'unknown';
        counts[s] = (counts[s] || 0) + 1;
    });

    const colorMap = {
        completed : '#10b981',
        pending   : '#f59e0b',
        cancelled : '#ef4444',
        rejected  : '#ef4444',
        approved  : '#3b82f6',
        waiting   : '#06b6d4',
        ready     : '#7c3aed',
    };

    const labelMap = {
        completed : 'مكتملة',
        pending   : 'معلقة',
        cancelled : 'ملغاة',
        rejected  : 'مرفوضة',
        approved  : 'موافق عليها',
        waiting   : 'قيد الانتظار',
        ready     : 'جاهزة للتسليم',
    };

    const total = all.length || 1;
    const el = document.getElementById('status-chart');
    if (!el) return;

    el.innerHTML = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([s, count]) => {
            const color = colorMap[s] || '#9ca3af';
            const label = labelMap[s] || s;
            return `
                <div class="type-row">
                    <div class="type-dot" style="background:${color}"></div>
                    <div class="type-name">${label}</div>
                    <div class="type-bar-bg">
                        <div class="type-bar-fill"
                             style="width:${Math.round(count / total * 100)}%;background:${color}"></div>
                    </div>
                    <div class="type-count" style="color:${color}">${count}</div>
                </div>
            `;
        }).join('') || '<p style="color:var(--gray);font-size:0.8rem;text-align:center;padding:10px;">لا توجد بيانات</p>';
}

function renderRecentTable(all) {
    const tbody = document.getElementById('recent-tbody');
    if (!tbody) return;

    const rows = all.slice(0, 10);
    tbody.innerHTML = rows.length
        ? rows.map(t => `
            <tr>
                <td style="font-weight:700;color:var(--primary);">${transferRef(t)}</td>
                <td>${senderName(t)}</td>
                <td>${t.receiver_name || '—'}</td>
                <td style="font-weight:700;">${fmtMoney(t.amount_in_usd)} USD</td>
                <td><span class="badge badge-purple">${currencyName(t)}</span></td>
                <td>${statusBadge(t.status)}</td>
                <td>${transferDate(t)}</td>
            </tr>
        `).join('')
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
    currentPage  = 1;
    sortData();
    updateSummaryBar();
    renderTransfersTable();
    renderPagination();
}

function applyFilters() {
    const search   = document.getElementById('search-input').value.trim().toLowerCase();
    const status   = document.getElementById('status-filter').value;
    const currency = document.getElementById('currency-filter').value;
    const from     = document.getElementById('date-from').value;
    const to       = document.getElementById('date-to').value;

    filteredData = ALL_TRANSFERS.filter(t => {
        if (search) {
            const hay = `${transferRef(t)} ${senderName(t)} ${t.receiver_name || ''} ${t.receiver_phone || ''}`.toLowerCase();
            if (!hay.includes(search)) return false;
        }
        if (status   && t.status !== status)           return false;
        if (currency && currencyName(t) !== currency)  return false;
        if (from     && transferDate(t) < from)        return false;
        if (to       && transferDate(t) > to)          return false;
        return true;
    });

    sortData();
    currentPage = 1;
    updateSummaryBar();
    renderTransfersTable();
    renderPagination();
}

function resetFilters() {
    ['search-input','status-filter','currency-filter','date-from','date-to']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    applyFilters();
}

function sortTable(field) {
    sortField = sortField === field ? sortField : field;
    sortAsc   = sortField === field ? !sortAsc : false;
    sortField = field;
    sortData();
    renderTransfersTable();
}

function sortData() {
    filteredData.sort((a, b) => {
        let av, bv;
        if (sortField === 'amount') {
            av = parseFloat(a.amount_in_usd || 0);
            bv = parseFloat(b.amount_in_usd || 0);
            return sortAsc ? av - bv : bv - av;
        }
        av = sortField === 'date' ? transferDate(a) : String(a[sortField] || '');
        bv = sortField === 'date' ? transferDate(b) : String(b[sortField] || '');
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
}

function updateSummaryBar() {
    const totalUSD  = filteredData.reduce((s, t) => s + parseFloat(t.amount_in_usd || 0), 0);
    const totalFees = filteredData.reduce((s, t) => s + parseFloat(t.fee || 0), 0);
    const completed = filteredData.filter(t => t.status === 'completed').length;
    const pending   = filteredData.filter(t => t.status === 'pending').length;

    // مجموع المبالغ الأصلية مجمّعة حسب عملة الإرسال
    const byCurr = {};
    filteredData.forEach(t => {
        const c = currencyName(t);
        byCurr[c] = (byCurr[c] || 0) + parseFloat(t.amount || 0);
    });
    const currSummary = Object.entries(byCurr)
        .map(([c, v]) => `${fmtMoney(v)} ${c}`)
        .join(' | ') || '—';

    setText('sb-total-count', filteredData.length);
    setText('sb-total-usd',   fmtMoney(totalUSD) + ' USD');
    setText('sb-total-orig',  currSummary);
    setText('sb-commission',  fmtMoney(totalFees) + ' USD');
    setText('sb-completed',   completed);
    setText('sb-pending',     pending);
}

function renderTransfersTable() {
    const start = (currentPage - 1) * PER_PAGE;
    const page  = filteredData.slice(start, start + PER_PAGE);
    const tbody = document.getElementById('transfers-tbody');
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

    tbody.innerHTML = page.map(t => `
        <tr>
            <td style="font-weight:700;color:var(--primary);">${transferRef(t)}</td>
            <td>${senderName(t)}</td>
            <td>${t.receiver_name  || '—'}</td>
            <td>${t.receiver_phone || '—'}</td>
            <td style="font-weight:700;">
                ${fmtMoney(t.amount)}
                <small style="color:var(--gray);font-size:0.7rem;">${currencyName(t)}</small>
            </td>
            <td style="font-weight:700;color:var(--secondary);">
                ${fmtMoney(t.amount_in_usd)}
                <small style="color:var(--gray);font-size:0.7rem;">USD</small>
            </td>
            <td style="color:var(--success);font-weight:600;">${fmtMoney(t.fee)}</td>
            <td>${statusBadge(t.status)}</td>
            <td>${transferDate(t)}</td>
            <td>
                <button class="action-btn" onclick="viewTransfer(${t.id})" title="عرض التفاصيل">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderPagination() {
    const total = Math.ceil(filteredData.length / PER_PAGE);
    const bar   = document.getElementById('pagination-bar');
    if (!bar) return;
    if (total <= 1) { bar.innerHTML = ''; return; }

    const start = (currentPage - 1) * PER_PAGE + 1;
    const end   = Math.min(currentPage * PER_PAGE, filteredData.length);

    let html = `<span class="pagination-info">عرض ${start}–${end} من ${filteredData.length}</span>`;
    html += `<div class="pagination-btns">`;
    html += `<button class="page-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fa-solid fa-chevron-right"></i></button>`;

    const pages = [];
    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || Math.abs(i - currentPage) <= 1) pages.push(i);
        else if (pages[pages.length - 1] !== '...') pages.push('...');
    }
    pages.forEach(p => {
        if (p === '...') html += `<button class="page-btn" disabled>…</button>`;
        else html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" onclick="goPage(${p})">${p}</button>`;
    });

    html += `<button class="page-btn" onclick="goPage(${currentPage + 1})" ${currentPage === total ? 'disabled' : ''}>
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
    document.getElementById('transfers-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        ['currency-summary-tbody', 'office-summary-tbody', 'daily-summary-tbody']
            .forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = emptyRow(4);
            });
        ['sum-total-amount','sum-avg-amount','sum-max-amount'].forEach(id => setText(id, '—'));
        return;
    }

    // ─ إجماليات ─
    const totalUSD = all.reduce((s, t) => s + parseFloat(t.amount_in_usd || 0), 0);
    const avgUSD   = totalUSD / all.length;
    const maxUSD   = Math.max(...all.map(t => parseFloat(t.amount_in_usd || 0)));

    setText('sum-total-amount', fmtMoney(totalUSD) + ' USD');
    setText('sum-avg-amount',   fmtMoney(avgUSD)   + ' USD');
    setText('sum-max-amount',   fmtMoney(maxUSD)   + ' USD');

    // ─ جمع حسب عملة الإرسال ─
    const byCurr = {};
    all.forEach(t => {
        const c = currencyName(t);
        if (!byCurr[c]) byCurr[c] = { count: 0, amount: 0, amountUSD: 0, fee: 0 };
        byCurr[c].count++;
        byCurr[c].amount    += parseFloat(t.amount || 0);
        byCurr[c].amountUSD += parseFloat(t.amount_in_usd || 0);
        byCurr[c].fee       += parseFloat(t.fee || 0);
    });

    const currEl = document.getElementById('currency-summary-tbody');
    if (currEl) {
        currEl.innerHTML = Object.entries(byCurr)
            .sort((a, b) => b[1].amountUSD - a[1].amountUSD)
            .map(([cur, d]) => `
                <tr>
                    <td><span class="badge badge-purple">${cur}</span></td>
                    <td style="font-weight:700;">${d.count}</td>
                    <td style="font-weight:700;">
                        ${fmtMoney(d.amount)} ${cur}
                        <br><small style="color:var(--gray)">${fmtMoney(d.amountUSD)} USD</small>
                    </td>
                    <td style="color:var(--success);font-weight:600;">${fmtMoney(d.fee)} USD</td>
                </tr>
            `).join('') || emptyRow(4);
    }

    // ─ جمع حسب الحالة (يحل محل "حسب المكتب" لأن المكتب ليس في response مباشرة) ─
    const byStatus = {};
    all.forEach(t => {
        const s = t.status || 'unknown';
        if (!byStatus[s]) byStatus[s] = { count: 0, amountUSD: 0, fee: 0 };
        byStatus[s].count++;
        byStatus[s].amountUSD += parseFloat(t.amount_in_usd || 0);
        byStatus[s].fee       += parseFloat(t.fee || 0);
    });

    const offEl = document.getElementById('office-summary-tbody');
    if (offEl) {
        offEl.innerHTML = Object.entries(byStatus)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([s, d]) => `
                <tr>
                    <td>${statusBadge(s)}</td>
                    <td style="font-weight:700;">${d.count}</td>
                    <td style="font-weight:700;">${fmtMoney(d.amountUSD)} USD</td>
                    <td style="color:var(--success);font-weight:600;">${fmtMoney(d.fee)} USD</td>
                </tr>
            `).join('') || emptyRow(4);
    }

    // ─ ملخص يومي ─
    const byDay = {};
    all.forEach(t => {
        const day = transferDate(t);
        if (!byDay[day]) byDay[day] = { count: 0, amountUSD: 0, completed: 0, pending: 0, fee: 0 };
        byDay[day].count++;
        byDay[day].amountUSD  += parseFloat(t.amount_in_usd || 0);
        byDay[day].fee        += parseFloat(t.fee || 0);
        if (t.status === 'completed') byDay[day].completed++;
        if (t.status === 'pending')   byDay[day].pending++;
    });

    const dayEl = document.getElementById('daily-summary-tbody');
    if (dayEl) {
        dayEl.innerHTML = Object.entries(byDay)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 30)
            .map(([day, d]) => `
                <tr>
                    <td style="font-weight:600;">${day}</td>
                    <td style="font-weight:700;color:var(--primary);">${d.count}</td>
                    <td style="font-weight:700;">${fmtMoney(d.amountUSD)}</td>
                    <td><span class="badge badge-success">${d.completed}</span></td>
                    <td><span class="badge badge-warning">${d.pending}</span></td>
                    <td style="color:var(--success);font-weight:600;">${fmtMoney(d.fee)}</td>
                </tr>
            `).join('') || emptyRow(6);
    }
}

// ─────────────────────────────────────────────────────
//  REPORTS
// ─────────────────────────────────────────────────────
function generateReport() {
    const from   = document.getElementById('rep-from').value;
    const to     = document.getElementById('rep-to').value;
    const status = document.getElementById('rep-status').value;
    const cur    = document.getElementById('rep-currency').value;

    const data = ALL_TRANSFERS.filter(t => {
        if (from && transferDate(t) < from)            return false;
        if (to   && transferDate(t) > to)              return false;
        if (status && t.status !== status)             return false;
        if (cur    && currencyName(t) !== cur)         return false;
        return true;
    });

    const totalUSD = data.reduce((s, t) => s + parseFloat(t.amount_in_usd || 0), 0);
    const avgUSD   = data.length ? totalUSD / data.length : 0;
    const totalFee = data.reduce((s, t) => s + parseFloat(t.fee || 0), 0);

    setText('rep-count',          data.length);
    setText('rep-sum',            fmtMoney(totalUSD) + ' USD');
    setText('rep-avg',            fmtMoney(avgUSD)   + ' USD');
    setText('rep-commission-sum', fmtMoney(totalFee) + ' USD');

    const meta = [];
    if (from || to) meta.push(`الفترة: ${from || '—'} → ${to || '—'}`);
    if (status) meta.push(`الحالة: ${status}`);
    if (cur)    meta.push(`العملة: ${cur}`);
    setText('report-meta', meta.join(' | '));

    const tbody = document.getElementById('report-tbody');
    if (tbody) {
        tbody.innerHTML = data.length
            ? data.map(t => `
                <tr>
                    <td style="font-weight:700;color:var(--primary);">${transferRef(t)}</td>
                    <td>${senderName(t)}</td>
                    <td>${t.receiver_name || '—'}</td>
                    <td style="font-weight:700;">${fmtMoney(t.amount_in_usd)} USD</td>
                    <td><span class="badge badge-purple">${currencyName(t)}</span></td>
                    <td style="color:var(--success);font-weight:600;">${fmtMoney(t.fee)}</td>
                    <td>${statusBadge(t.status)}</td>
                    <td>${transferDate(t)}</td>
                </tr>
            `).join('')
            : `<tr><td colspan="8"><div class="empty-state">
                   <i class="fa-solid fa-magnifying-glass"></i>
                   <p>لا توجد نتائج تطابق الفلاتر المحددة</p>
               </div></td></tr>`;
    }

    const resultEl = document.getElementById('report-result');
    if (resultEl) {
        resultEl.style.display = 'block';
        resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function exportReport() {
    const from   = document.getElementById('rep-from').value;
    const to     = document.getElementById('rep-to').value;
    const status = document.getElementById('rep-status').value;
    const cur    = document.getElementById('rep-currency').value;

    const data = ALL_TRANSFERS.filter(t => {
        if (from && transferDate(t) < from)    return false;
        if (to   && transferDate(t) > to)      return false;
        if (status && t.status !== status)     return false;
        if (cur    && currencyName(t) !== cur) return false;
        return true;
    });
    downloadCSV(data, 'report');
}

function exportCSV() { downloadCSV(filteredData, 'transfers'); }

function downloadCSV(data, name) {
    const headers = [
        'رقم التتبع', 'المرسل', 'المستلم', 'هاتف المستلم',
        'المبلغ', 'العملة', 'المبلغ_USD', 'عملة_الاستلام', 'العمولة', 'الحالة', 'التاريخ'
    ];
    const rows = data.map(t => [
        transferRef(t),
        senderName(t),
        t.receiver_name   || '',
        t.receiver_phone  || '',
        t.amount          || 0,
        currencyName(t),
        t.amount_in_usd   || 0,
        sendCurrencyName(t),
        t.fee             || 0,
        t.status          || '',
        transferDate(t)
    ]);

    const csv  = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${name}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────
//  MODAL — تفاصيل حوالة
// ─────────────────────────────────────────────────────
function viewTransfer(id) {
    const t = ALL_TRANSFERS.find(x => x.id === id);
    if (!t) return;

    setHTML('md-id',           transferRef(t));
    setHTML('md-status',       statusBadge(t.status));
    setText('md-sender',       senderName(t));
    setText('md-receiver',     t.receiver_name   || '—');
    setText('md-phone',        t.receiver_phone  || '—');
    setText('md-amount',       fmtMoney(t.amount) + ' ' + currencyName(t));
    setText('md-amount-usd',   fmtMoney(t.amount_in_usd) + ' USD');
    setText('md-currency',     currencyName(t));
    setText('md-send-currency',sendCurrencyName(t));
    setText('md-commission',   fmtMoney(t.fee));
    setText('md-office',       t.destination_office_id ? 'مكتب #' + t.destination_office_id : '—');
    setText('md-agent',        t.destination_agent_id  ? 'وكيل #' + t.destination_agent_id  : '—');
    setText('md-date',         t.created_at || '—');
    setText('md-tracking',     t.tracking_code || '—');

    document.getElementById('transfer-modal')?.classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id)?.classList.add('hidden');
}

// ─────────────────────────────────────────────────────
//  REFRESH
// ─────────────────────────────────────────────────────
async function refreshData() {
    const iconEl = document.querySelector('.icon-btn[title="تحديث البيانات"] i');
    if (iconEl) iconEl.classList.add('fa-spin');
    await fetchAllTransfers();
    if (iconEl) iconEl.classList.remove('fa-spin');
    showToast('تم تحديث البيانات ✓', 'success');
}

// ─────────────────────────────────────────────────────
//  LOGOUT
// ─────────────────────────────────────────────────────
async function handleLogout() {
    try {
        await fetch(`${API_URL}/logout`, { method: 'POST', headers: getHeaders() });
    } catch (e) {}
    localStorage.clear();
    window.location.href = '../login/login.html';
}

// ─────────────────────────────────────────────────────
//  SIDEBAR
// ─────────────────────────────────────────────────────
function toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('open');
    document.getElementById('sidebar-overlay')?.classList.toggle('active');
}
function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('active');
}
function toggleProfileMenu() {}

// ─────────────────────────────────────────────────────
//  UTILS
// ─────────────────────────────────────────────────────
function statusBadge(s) {
    const map = {
        completed : `<span class="badge badge-success"><i class="fa-solid fa-check"></i> مكتملة</span>`,
        pending   : `<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> معلقة</span>`,
        cancelled : `<span class="badge badge-danger"><i class="fa-solid fa-xmark"></i> ملغاة</span>`,
        rejected  : `<span class="badge badge-danger"><i class="fa-solid fa-ban"></i> مرفوضة</span>`,
        approved  : `<span class="badge badge-info"><i class="fa-solid fa-thumbs-up"></i> موافق عليها</span>`,
        waiting   : `<span class="badge badge-info"><i class="fa-solid fa-hourglass-half"></i> قيد الانتظار</span>`,
        ready     : `<span class="badge badge-purple"><i class="fa-solid fa-box-open"></i> جاهزة للتسليم</span>`,
    };
    return map[s] || `<span class="badge">${s || '—'}</span>`;
}

function fmtMoney(n) {
    const num = parseFloat(n);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('ar', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmt(n) {
    return Number(n).toLocaleString('ar');
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
    let el = document.getElementById('page-loader');
    if (!el) {
        el = document.createElement('div');
        el.id = 'page-loader';
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
        const style = document.createElement('style');
        style.textContent = '@keyframes acct-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}';
        document.head.appendChild(style);
        document.body.appendChild(el);
    }
    el.style.display = show ? 'flex' : 'none';
}

// ─── Toast notifications ──────────────────────────────
function showToast(msg, type = 'success') {
    if (window.Notyf) {
        const notyf = new Notyf({
            duration: 3500,
            position: { x: 'left', y: 'bottom' },
            ripple: true
        });
        type === 'success' ? notyf.success(msg) : notyf.error(msg);
        return;
    }
    // fallback
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = `position:fixed;bottom:24px;left:24px;padding:12px 20px;
        background:${type === 'success' ? '#10b981' : '#ef4444'};color:white;
        border-radius:10px;font-size:0.875rem;font-family:'Cairo',sans-serif;
        z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);
        animation:acct-spin 0s;`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}