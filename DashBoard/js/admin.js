    // js/admin.js

document.addEventListener('DOMContentLoaded', () => {
    const adminSection = document.getElementById('role-super-admin');
    
    // 1. تحديث أسعار الصرف
    const updateRateBtn = adminSection.querySelector('.rate-form + .btn-primary');
    if(updateRateBtn) {
        updateRateBtn.addEventListener('click', () => {
            const usdEur = document.getElementById('usd-eur').value;
            alert(`تم تحديث أسعار الصرف: USD/EUR = ${usdEur}`);
        });
    }

    // 2. إضافة مكتب جديد
    const addOfficeBtn = adminSection.querySelector('form .btn-primary');
    addOfficeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const officeName = adminSection.querySelector('input[placeholder*="مكتب"]').value;
        if(officeName) {
            alert(`تم إنشاء مكتب "${officeName}" وتعيين المدير بنجاح.`);
        }
    });
});