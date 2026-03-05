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
                    case 'waiting':
                        statusClass = 'status-badge status-pending';
                        statusText = 'بانتظار الوكيل';
                        break;
                    case 'waiting': // تمت إضافة حالة waiting هنا للأدمن
                        statusClass = 'status-badge status-pending';
                        statusText = 'بانتظار موافقة المكتب';
                        break;
                    case 'ready':
                        statusClass = 'status-badge status-approved';
                        statusText = 'تمت الموافقة (جاهزة)';
                        break;
                    case 'rejected':
                        statusClass = 'status-badge status-rejected';
                        statusText = 'مرفوضة';
                        break;
                    default:
                        statusClass = 'status-badge';
                        statusText = transfer.status;
                }

                tbody.innerHTML += `
                    <tr>
                        <td>#${transfer.id}</td>
                        <td>$${transfer.amount}</td>
                        <td>${transfer.sender ? transfer.sender.name : '-'}</td>
                        <td>${transfer.receiver_name}</td>
                        <td><span class="${statusClass}">${statusText}</span></td>
                        <td>${new Date(transfer.created_at).toLocaleString()}</td>
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
                <p><strong>اسم المكتب:</strong> ${myOffice.name}</p>
                <p><strong>العنوان:</strong> ${myOffice.address || 'غير محدد'}</p>
                <p><strong>المدينة:</strong> ${myOffice.city?.name || '-'}</p>
            `;
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

if(safe.type === 'office_main'){
    title = 'الصندوق الرئيسي';
    icon = 'fa-vault';
    bg = '#f0f9ff';
}

if(safe.type === 'trading'){
    title = 'صندوق المبيعات / التداول';
    icon = 'fa-chart-line';
    bg = '#fff9f0';
}

return `
<div style="padding:20px;border-radius:12px;border:2px solid #eee;background:${bg}">
    <h4 style="color:#1e3c72;margin-bottom:10px;">
        <i class="fa-solid ${icon}"></i> ${title}
    </h4>

    <div style="font-size:24px;font-weight:bold;color:#222;">
        ${parseFloat(safe.balance).toLocaleString()} 
        <small>${safe.currency}</small>
    </div>

    ${safe.cost ? `
        <div style="font-size:12px;color:gray;margin-top:5px;">
            متوسط التكلفة: ${safe.cost}
        </div>` : ''}

</div>
`;

}).join('');
    } catch (e) { console.error("Error loading safes:", e); }
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
    tbody.innerHTML += `
        <tr>
            <td>#${transfer.id}</td>
            <td>$${transfer.amount}</td>
            <td>${transfer.receiver_name}</td>
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