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

async function loadPendingTransfers() {
    try {
        const res = await fetch(`${API_URL}/transfers?status=pending`, {
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
                            <button class="btn-approve" onclick="approveTransfer(${transfer.id}, 'admin_approved')">موافقة</button>
                            <button class="btn-reject" onclick="approveTransfer(${transfer.id}, 'rejected')">رفض</button>
                        </td>
                    </tr>
                `;
            });
        }
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
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                status: 'ready',
                fee: 0
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert('تم تحديث حالة الحوالة بنجاح');
            loadPendingTransfers();
        } else {
            console.log(data);
            alert('حدث خطأ');
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