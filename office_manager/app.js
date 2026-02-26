const API_URL = 'http://127.0.0.1:8000/api';
const token = localStorage.getItem('auth_token');

if (!token) window.location.href = '../login/index.html';

async function loadPendingTransfers() {
    try {
        // افتراض وجود نقطة نهاية تجلب حوالات المكتب الحالي
        const res = await fetch(`${API_URL}/transfers?status=cashier_accepted`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        const tbody = document.getElementById('transfers-list');
        tbody.innerHTML = '';

        json.data.forEach(transfer => {
            tbody.innerHTML += `
                <tr>
                    <td>#${transfer.id}</td>
                    <td>$${transfer.amount}</td>
                    <td>${transfer.receiver_name}</td>
                    <td><span style="color: orange;">مقبولة من الكاشير</span></td>
                    <td>
                        <button class="btn-success-sm" onclick="approveTransfer(${transfer.id}, 'admin_approved')">موافقة نهائية</button>
                        <button class="btn-danger-sm" onclick="approveTransfer(${transfer.id}, 'rejected')">رفض</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error loading transfers:", error);
    }
}

async function approveTransfer(transferId, newStatus) {
    try {
        const res = await fetch(`${API_URL}/transfers/${transferId}/update-status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
            alert('تم تحديث حالة الحوالة بنجاح');
            loadPendingTransfers(); // إعادة تحميل الجدول
        } else {
            alert('حدث خطأ أثناء التحديث');
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

loadPendingTransfers();