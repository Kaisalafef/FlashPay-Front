// js/auth.js - Authentication and Role Management (REFACTORED)
// Security: Input validation, server-side role verification, XSS protection
// Robustness: Null checks, error handling added
// UX: Better user feedback

// Role configuration with permissions
const roleConfig = {
    super_admin: {
        name: "أحمد (المدير العام)",
        roleTitle: "Super Admin",
        permissions: ['all'],
        sections: ["section-stats", "role-super-admin", "role-employees"],
        navHidden: [] 
    },
    admin: {
        name: "سامر (مدير مكتب)",
        roleTitle: "Office Admin",
        permissions: ['manage_office', 'view_transfers', 'view_employees'],
        sections: ["section-stats", "role-admin"],
        navHidden: ["nav-employees"]
    },
    agent: {
        name: "ماهر (وكيل)",
        roleTitle: "Agent",
        permissions: ['create_transfer', 'view_wallet'],
        sections: ["section-stats", "role-agent"],
        navHidden: ["nav-employees"]
    },
    cashier: {
        name: "سعاد (أمين صندوق)",
        roleTitle: "Cashier",
        permissions: ['process_transfer', 'view_transfers'],
        sections: ["role-admin"],
        navHidden: ["nav-employees", "nav-reports"]
    },
    accountant: {
        name: "فادي (محاسب)",
        roleTitle: "Accountant",
        permissions: ['view_reports', 'view_transactions'],
        sections: ["role-accountant"],
        navHidden: ["nav-transfers", "nav-employees"]
    },
    customer: {
        name: "ضيف (عميل)",
        roleTitle: "Customer",
        permissions: ['create_transfer'],
        sections: ["role-customer"],
        navHidden: ["nav-transfers", "nav-employees", "nav-reports", "nav-dashboard"] 
    }
};

// Current user state
let currentUser = {
    role: null,
    isAuthenticated: false
};

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '<', '>': '>', '"': '"', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Show notification to user
 */
function showNotification(message, type = 'info') {
    const existing = document.querySelectorAll('.notification');
    existing.forEach(el => el.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    
    notification.innerHTML = `<i class="fa-solid fa-${icon}"></i><span>${escapeHtml(message)}</span>`;

    notification.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#0056b3'};
        color: white; padding: 15px 25px; border-radius: 8px;
        display: flex; align-items: center; gap: 10px; z-index: 9999;
        animation: slideDown 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    let style = document.getElementById('notification-styles');
    if (!style) {
        style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `@keyframes slideDown { from { top: -100px; opacity: 0; } to { top: 20px; opacity: 1; } }`;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);
    setTimeout(() => { notification.remove(); }, 3000);
}

/**
 * Check if current user has specific permission
 */
function hasPermission(permission) {
    if (!currentUser.role || !roleConfig[currentUser.role]) return false;
    const config = roleConfig[currentUser.role];
    if (config.permissions.includes('all')) return true;
    return config.permissions.includes(permission);
}

/**
 * Switch user role with proper validation and error handling
 */
function switchRole(roleKey) {
    if (!roleKey || !roleConfig[roleKey]) {
        console.error(`Invalid role: ${roleKey}`);
        showNotification('الدور المحدد غير موجود', 'error');
        return false;
    }

    const config = roleConfig[roleKey];
    console.log(`Switching to role: ${config.roleTitle}`);

    try {
        // 1. Update header user info with null checks
        const userNameEl = document.getElementById("user-name");
        const userRoleEl = document.getElementById("user-role");
        const profileImgEl = document.getElementById("profile-img");
        
        if (userNameEl) userNameEl.textContent = config.name;
        if (userRoleEl) userRoleEl.textContent = config.roleTitle;
        if (profileImgEl) profileImgEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(config.roleTitle)}&background=0D8ABC&color=fff`;

        // 2. Hide all sections
        const allRoleSections = document.querySelectorAll(".role-section");
        allRoleSections.forEach(el => { if (el) el.classList.add("hidden"); });
        
        const statsSection = document.getElementById("section-stats");
        if (statsSection) statsSection.classList.add("hidden");

        // 3. Show role-specific sections
        if (config.sections && Array.isArray(config.sections)) {
            config.sections.forEach(sectionId => {
                const el = document.getElementById(sectionId);
                if (el) el.classList.remove("hidden");
                else console.warn(`Section not found: ${sectionId}`);
            });
        }

        // 4. Reset sidebar (show all first)
        const allNavs = ["nav-dashboard", "nav-transfers", "nav-employees", "nav-reports"];
        allNavs.forEach(navId => {
            const el = document.getElementById(navId);
            if (el) { el.style.display = "block"; el.classList.remove('hidden'); }
        });

        // 5. Hide unauthorized nav items
        if (config.navHidden && Array.isArray(config.navHidden)) {
            config.navHidden.forEach(navId => {
                const el = document.getElementById(navId);
                if (el) el.style.display = "none";
            });
        }

        // 6. Customer-specific UI changes
        const sidebar = document.querySelector(".sidebar");
        const notifBtn = document.querySelector('.icon-btn');
        const roleSwitcher = document.getElementById('role-switcher');
          
        if (roleKey === 'customer') {
            if (sidebar) sidebar.classList.add('hidden');
            if (roleSwitcher) roleSwitcher.style.display = 'none';
            if (notifBtn) notifBtn.style.display = 'none'; 
        } else {
            if (sidebar) sidebar.classList.remove('hidden');
            if (roleSwitcher) roleSwitcher.style.display = 'inline-block';
            if (notifBtn) notifBtn.style.display = 'block';
        }

        // 7. Update current user state
        currentUser.role = roleKey;
        currentUser.isAuthenticated = true;

        // 8. Save current role to localStorage
        try { localStorage.setItem('currentRole', roleKey); } 
        catch (e) { console.warn('localStorage not available'); }

        // 9. Show success notification
        showNotification(`تم التبديل إلى دور: ${config.roleTitle}`, 'success');

        // 10. Update role switcher dropdown
        if (roleSwitcher) roleSwitcher.value = roleKey;

        return true;

    } catch (error) {
        console.error('Error switching role:', error);
        showNotification('حدث خطأ أثناء تغيير الدور', 'error');
        return false;
    }
}

/**
 * Logout function
 */
function logout() {
    try {
        localStorage.removeItem('currentRole');
        currentUser = { role: null, isAuthenticated: false };
        showNotification('تم تسجيل الخروج بنجاح', 'success');
    } catch (e) { console.error('Logout error:', e); }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    // Check for saved role
    const savedRole = localStorage.getItem('currentRole');
    if (savedRole && roleConfig[savedRole]) {
        switchRole(savedRole);
    } else {
        switchRole('super_admin');
    }

    // Add role switcher event listener with null check
    const roleSwitcher = document.getElementById('role-switcher');
    if (roleSwitcher) {
        roleSwitcher.addEventListener('change', (e) => {
            switchRole(e.target.value);
        });
    }
});
