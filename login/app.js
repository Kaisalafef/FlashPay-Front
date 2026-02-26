const API_URL = 'http://127.0.0.1:8000/api';

document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault(); // منع إعادة تحميل الصفحة

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // إخفاء رسالة الخطأ السابقة وإظهار شاشة التحميل
    errorMessage.classList.remove('show');
    loadingOverlay.classList.add('show');

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        // إخفاء شاشة التحميل
        loadingOverlay.classList.remove('show');

        if (response.ok && data.status === 'success') {
            // حفظ التوكن وبيانات المستخدم في التخزين المحلي للمتصفح
            localStorage.setItem('auth_token', data.access_token);
            localStorage.setItem('user_data', JSON.stringify(data.user));

            // التوجيه بناءً على الصلاحية (Role)
            const role = data.user.role;

            switch (role) {
                case 'super_admin':
                    window.location.href = '../super_admin/index.html';
                    break;
                case 'admin':
                    window.location.href = '../office_manager/index.html';
                    break;
                case 'cashier':
                    window.location.href = '../cashier/index.html';
                    break;
                case 'accountant':
                    window.location.href = '../accountant/index.html'; // إذا كان لديك مجلد للمحاسب
                    break;
                case 'agent':
                    window.location.href = '../agent/index.html'; // مجلد المندوب
                    break;
                default:
                    errorText.textContent = 'صلاحية المستخدم غير معروفة. يرجى مراجعة الإدارة.';
                    errorMessage.classList.add('show');
            }
        } else {
            // عرض رسالة الخطأ القادمة من الباك إند
            errorText.textContent = data.message || 'بيانات الدخول غير صحيحة';
            errorMessage.classList.add('show');
        }

    } catch (error) {
        // في حال انقطاع الإنترنت أو عدم عمل السيرفر (localhost:8000)
        loadingOverlay.classList.remove('show');
        errorText.textContent = 'تعذر الاتصال بالخادم. يرجى التأكد من تشغيل السيرفر (PHP artisan serve).';
        errorMessage.classList.add('show');
        console.error('Login Error:', error);
    }
});

// إذا كان المستخدم مسجل دخول بالفعل، نوجهه تلقائياً حسب الرول
window.onload = function() {
    const token = localStorage.getItem('auth_token');
    const userDataStr = localStorage.getItem('user_data');
    
    if (token && userDataStr) {
        try {
            const user = JSON.parse(userDataStr);
            if(user.role === 'super_admin') window.location.href = '../super_admin/index.html';
            else if(user.role === 'admin') window.location.href = '../office_manager/index.html';
            else if(user.role === 'cashier') window.location.href = '../cashier/index.html';
        } catch (e) {
            localStorage.clear();
        }
    }
};