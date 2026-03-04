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
            window.location.href = '/FlashPay-Front/login/login.html';
            return null;
        }

        return token;

    } catch (e) {
        localStorage.clear();
        window.location.href = '/FlashPay-Front/login/login.html';
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
                        statusText = 'بانتظار الموافقة';
                        break;
                    case 'ready':
                        statusClass = 'status-badge status-approved';
                        statusText = 'تمت الموافقة';
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
                        <td>${transfer.sender_name ?? '-'}</td>
                        <td>${transfer.receiver_name}</td>
                        <td><span class="${statusClass}">${statusText}</span></td>
                        <td>${new Date(transfer.created_at).toLocaleString()}</td>
                    </tr>
                `;
            });
        }

    } catch (error) {
        console.error("Error loading all transfers:", error);
    }
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
                        statusText = 'بانتظار الموافقة';
                        break;
                    case 'ready':
                        statusClass = 'status-badge status-approved';
                        statusText = 'تمت الموافقة';
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
                        <td>${transfer.sender_name ?? '-'}</td>
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
async function loadPendingTransfers() {
    try {
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

        // ملاحظة: الـ Controller يرجع البيانات داخل كائن اسمه data
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