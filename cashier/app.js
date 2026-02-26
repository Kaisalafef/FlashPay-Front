const API_URL = 'http://127.0.0.1:8000/api';
async function checkAuth() {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        window.location.href = '/FlashPay-Front/login/index.html';
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
            window.location.href = '/FlashPay-Front/login/index.html';
            return null;
        }

        return token;

    } catch (e) {
        localStorage.clear();
        window.location.href = '/FlashPay-Front/login/index.html';
        return null;
    }
}
async function loadNewTransfers() {
    try {
        const res = await fetch(`${API_URL}/transfers?status=pending`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        const tbody = document.getElementById('new-transfers-list');
        tbody.innerHTML = '';

        json.data.forEach(transfer => {
            tbody.innerHTML += `
                <tr>
                    <td>#${transfer.id}</td>
                    <td>${transfer.sender_name}</td>
                    <td>$${transfer.amount}</td>
                    <td>
                        <button class="btn-primary" onclick="acceptTransfer(${transfer.id})">تأكيد الاستلام (Accept)</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error loading transfers:", error);
    }
}

async function acceptTransfer(transferId) {
    try {
        const res = await fetch(`${API_URL}/transfers/${transferId}/update-status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'cashier_accepted' }) // تغيير الحالة حسب متطلبات الباك إند
        });
        if (res.ok) {
            alert('تم تأكيد الحوالة وإرسالها لمدير المكتب للموافقة');
            loadNewTransfers(); 
        } else {
            alert('حدث خطأ أثناء التأكيد');
        }
    } catch (error) {
        alert('خطأ في الاتصال');
    }
}

async function handleLogout() {
    await fetch(`${API_URL}/logout`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    localStorage.removeItem('auth_token');
    window.location.href = '../login/index.html';
}
document.addEventListener('DOMContentLoaded', async () => {

    token = await checkAuth();
    if (!token) return;

loadNewTransfers();
loadPendingTransfers();
});     