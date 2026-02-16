// تكوين الأدوار والصلاحيات
const roleConfig = {
    super_admin: {
        name: "أحمد (المدير العام)",
        roleTitle: "Super Admin",
        sections: ["section-stats", "role-super-admin"],
        navHidden: [] 
    },
    admin: {
        name: "سامر (مدير مكتب)",
        roleTitle: "Office Admin",
        sections: ["section-stats", "role-admin"],
        navHidden: ["nav-employees"]
    },
    agent: {
        name: "ماهر (وكيل)",
        roleTitle: "Agent",
        sections: ["section-stats", "role-agent"],
        navHidden: ["nav-employees"]
    },
    cashier: {
        name: "سعاد (أمين صندوق)",
        roleTitle: "Cashier",
        sections: ["role-admin"], // Cashier uses the Admin table for pending transfers
        navHidden: ["nav-employees", "nav-reports"]
    },
    accountant: {
        name: "فادي (محاسب)",
        roleTitle: "Accountant",
        sections: ["role-accountant"],
        navHidden: ["nav-transfers", "nav-employees"]
    },
    customer: {
        name: "ضيف (عميل)",
        roleTitle: "Customer",
        sections: ["role-customer"],
        navHidden: ["nav-transfers", "nav-employees", "nav-reports", "nav-dashboard"] 
    }
};

function switchRole(roleKey) {
    const config = roleConfig[roleKey];
    if (!config) return;

    // 1. تحديث بيانات الهيدر
    document.getElementById("user-name").textContent = config.name;
    document.getElementById("user-role").textContent = config.roleTitle;
    document.getElementById("profile-img").src = `https://ui-avatars.com/api/?name=${config.roleTitle}&background=0D8ABC&color=fff`;

    // 2. إخفاء جميع الأقسام (Sections)
    const allRoleSections = document.querySelectorAll(".role-section");
    allRoleSections.forEach(el => el.classList.add("hidden"));
    document.getElementById("section-stats").classList.add("hidden");

    // 3. إظهار الأقسام الخاصة بالدور الحالي
    config.sections.forEach(sectionId => {
        const el = document.getElementById(sectionId);
        if(el) el.classList.remove("hidden");
    });

    // 4. إعادة تعيين القائمة الجانبية (إظهار الكل أولاً)
    const allNavs = ["nav-dashboard", "nav-transfers", "nav-employees", "nav-reports"];
    allNavs.forEach(navId => {
        const el = document.getElementById(navId);
        if(el) el.style.display = "block";
    });

    // 5. إخفاء عناصر القائمة غير المصرح بها
    if (config.navHidden) {
        config.navHidden.forEach(navId => {
            const el = document.getElementById(navId);
            if(el) el.style.display = "none";
        });
    }

    // 6. تعديلات خاصة بالعميل (إخفاء السايدبار والجرس)
    const sidebar = document.querySelector(".sidebar");
    const notifBtn = document.querySelector('.icon-btn');
      
    if(roleKey === 'customer') {
        sidebar.classList.add('hidden'); // Use CSS class instead of inline display
        if(notifBtn) notifBtn.style.display = 'none'; 
    } else {
        sidebar.classList.remove('hidden');
        if(notifBtn) notifBtn.style.display = 'block';
    }
}
// تهيئة التبديل عند تغيير الخيار من القائمة
document.getElementById('role-switcher').addEventListener('change', (e) => {
    switchRole(e.target.value);
});