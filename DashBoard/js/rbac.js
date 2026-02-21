/**
 * Role-Based Access Control (RBAC) System
 * =========================================
 * Strict permission control for Financial Management System
 * 
 * Features:
 * - ROLE_PERMISSIONS: Defines which sections each role can access
 * - Office-based data isolation
 * - Strict permission enforcement
 * - API security: Includes role headers in fetch requests
 * 
 * ROLES:
 * 1. SUPER_ADMIN: Full system access, office selector, fund box
 * 2. ADMIN: Office-specific only (auto-assigned, no selector)
 * 3. ACCOUNTANT: Financial accounting only (no transfers, no employees)
 * 4. CASHIER: Outgoing transfers only (outside Syria), no reports
 * 
 * SECURITY NOTES:
 * - Backend is always source of truth
 * - Frontend validation is for UX only, not security
 * - All permissions must be validated server-side
 */


// ==========================================
// DEBUG LOGGING (Production-safe)
// ==========================================

const DEBUG = window.location.hostname === 'localhost' || localStorage.getItem('debug') === 'true';
function debugLog(...args) { if (DEBUG) console.log(...args); }
function debugWarn(...args) { if (DEBUG) console.warn(...args); }

// ==========================================
// ROLE PERMISSIONS CONFIGURATION
// ==========================================

const ROLE_PERMISSIONS = {
    super_admin: {
        name: 'المدير العام',
        nameEn: 'Super Admin',
        level: 1,
        allowedSections: [
            'section-stats',
            'role-transfers',
            'role-employees',
            'role-super-admin',
            'role-fund-box',
            'role-reports',
            'role-admin'
        ],
        allowedNavItems: [
            'nav-dashboard',
            'nav-transfers',
            'nav-employees',
            'nav-offices',
            'nav-reports',
            'nav-fund-box'
        ],
        apiPermissions: ['read', 'write', 'delete', 'admin', 'manage_offices', 'manage_employees', 'view_all_reports', 'fund_trading'],
        defaultRoute: 'section-stats',
        canAccessAllOffices: true,
        hasOfficeSelector: true,
        canCreateEmployees: true,
        canDeleteEmployees: true,
        canManageOffices: true,
        canViewAllReports: true,
        canAccessFundBox: true,
        dataAccess: 'all'
    },

    admin: {
        name: 'مدير مكتب',
        nameEn: 'Office Admin',
        level: 2,
        allowedSections: [
            'section-stats',
            'role-transfers',
            'role-admin',
            'role-reports'
        ],
        allowedNavItems: [
            'nav-dashboard',
            'nav-transfers',
            'nav-reports'
        ],
        apiPermissions: ['read', 'write', 'office_manage'],
        defaultRoute: 'section-stats',
        canAccessAllOffices: false,
        hasOfficeSelector: false,
        canCreateEmployees: false,
        canDeleteEmployees: false,
        canManageOffices: false,
        canViewAllReports: false,
        canAccessFundBox: false,
        dataAccess: 'office_only',
        restrictions: {
            cannotCreateEmployees: true,
            cannotDeleteEmployees: true,
            cannotAccessOtherOffices: true,
            cannotViewSystemReports: true,
            officeLocked: true
        }
    },

    accountant: {
        name: 'محاسب',
        nameEn: 'Accountant',
        level: 3,
        allowedSections: [
            'role-accountant',
            'section-stats'
        ],
        allowedNavItems: [
            'nav-dashboard',
            'nav-accountant'
        ],
        apiPermissions: ['read', 'accounting_write'],
        defaultRoute: 'role-accountant',
        canAccessAllOffices: false,
        hasOfficeSelector: false,
        canCreateEmployees: false,
        canDeleteEmployees: false,
        canManageOffices: false,
        canViewAllReports: false,
        canAccessFundBox: false,
        dataAccess: 'accounting_only',
        restrictions: {
            cannotAccessEmployees: true,
            cannotAccessOffices: true,
            cannotViewTransfers: true,
            cannotCreateTransfers: true,
            accountingOnly: true
        }
    },

    cashier: {
        name: 'أمين صندوق',
        nameEn: 'Cashier',
        level: 4,
        allowedSections: [
            'role-transfers',
            'section-stats'
        ],
        allowedNavItems: [
            'nav-dashboard',
            'nav-transfers'
        ],
        apiPermissions: ['read', 'approve_transfers'],
        defaultRoute: 'role-transfers',
        canAccessAllOffices: false,
        hasOfficeSelector: false,
        canCreateEmployees: false,
        canDeleteEmployees: false,
        canManageOffices: false,
        canViewAllReports: false,
        canAccessFundBox: false,
        dataAccess: 'transfers_only',
        restrictions: {
            outgoingTransfersOnly: true,
            canApproveTransfers: true,
            cannotAccessReports: true,
            cannotAccessEmployees: true,
            cannotAccessOffices: true,
            officeLocked: true
        }
    }
};

// ==========================================
// NAVIGATION CONFIGURATION
// ==========================================

const NAV_CONFIG = {
    'nav-dashboard': { section: 'section-stats', icon: 'fa-table-columns', label: 'لوحة التحكم', order: 1 },
    'nav-offices': { section: 'role-super-admin', icon: 'fa-building', label: 'المكاتب', order: 2 },
    'nav-employees': { section: 'role-employees', icon: 'fa-users', label: 'الموظفين', order: 3 },
    'nav-transfers': { section: 'role-transfers', icon: 'fa-money-bill-transfer', label: 'الحوالات', order: 4 },
    'nav-reports': { section: 'role-reports', icon: 'fa-chart-line', label: 'التقارير', order: 5 },
    'nav-fund-box': { section: 'role-fund-box', icon: 'fa-box-open', label: 'صندوق التداول', order: 6 },
    'nav-accountant': { section: 'role-accountant', icon: 'fa-calculator', label: 'المحاسبة', order: 7 },
    'nav-settings': { section: null, icon: 'fa-gear', label: 'الإعدادات', order: 99 }
};

// ==========================================
// OFFICE CONTEXT
// ==========================================

let currentOfficeContext = {
    officeId: null,
    officeName: null,
    isAllOffices: true,
    userAssignedOffice: null
};

function setOfficeContext(officeId, officeName = null) {
    if (officeId !== null && (typeof officeId !== 'number' || isNaN(officeId) || officeId < 1)) {
        debugWarn('Invalid officeId:', officeId);
        return false;
    }
    
    const role = getCurrentRole();
    if (role.role !== 'super_admin' && officeId !== currentOfficeContext.userAssignedOffice) {
        debugWarn('Permission denied: Only Super Admin can switch offices');
        return false;
    }
    
    currentOfficeContext.officeId = officeId;
    currentOfficeContext.officeName = officeName;
    currentOfficeContext.isAllOffices = officeId === null;
    
    localStorage.setItem('currentOfficeId', officeId || 'all');
    localStorage.setItem('currentOfficeName', officeName || 'جميع المكاتب');
    
    debugLog('Office context updated:', officeName || 'جميع المكاتب');
    refreshDataForOffice();
    return true;
}

function initOfficeContext() {
    const role = getCurrentRole();
    
    if (role.role === 'super_admin') {
        const savedOfficeId = localStorage.getItem('currentOfficeId');
        const savedOfficeName = localStorage.getItem('currentOfficeName');
        
        if (savedOfficeId && savedOfficeId !== 'all') {
            currentOfficeContext.officeId = parseInt(savedOfficeId);
            currentOfficeContext.isAllOffices = false;
            currentOfficeContext.officeName = savedOfficeName;
        }
    } else {
        const assignedOffice = localStorage.getItem('userAssignedOffice') || '1';
        currentOfficeContext.userAssignedOffice = parseInt(assignedOffice);
        currentOfficeContext.officeId = parseInt(assignedOffice);
        currentOfficeContext.isAllOffices = false;
        currentOfficeContext.officeName = localStorage.getItem('userOfficeName') || 'مكتبي';
    }
    
    debugLog('Office context initialized:', currentOfficeContext);
}

function getOfficeContext() {
    return { ...currentOfficeContext };
}

function canAccessOffice(officeId) {
    const role = getCurrentRole();
    if (role.canAccessAllOffices) return true;
    return currentOfficeContext.userAssignedOffice === officeId;
}

function getDataFilterParams() {
    const role = getCurrentRole();
    if (role.canAccessAllOffices && currentOfficeContext.isAllOffices) {
        return { office_id: null };
    }
    return { office_id: currentOfficeContext.officeId };
}

function refreshDataForOffice() {
    window.dispatchEvent(new CustomEvent('officeContextChanged', {
        detail: { ...currentOfficeContext }
    }));
    
    const currentHash = window.location.hash.substring(1);
    if (currentHash && typeof loadSectionData === 'function') {
        loadSectionData(currentHash);
    }
}

// ==========================================
// USER STATE
// ==========================================

let currentUserRole = 'super_admin';
let currentUserToken = null;

// ==========================================
// CORE RBAC FUNCTIONS
// ==========================================

function hasPermission(permission) {
    const role = ROLE_PERMISSIONS[currentUserRole];
    if (!role) return false;
    
    if (role.apiPermissions && role.apiPermissions.includes(permission)) {
        return true;
    }
    
    const permissionMap = {
        'create_employee': 'canCreateEmployees',
        'delete_employee': 'canDeleteEmployees',
        'manage_office': 'canManageOffices',
        'view_all_reports': 'canViewAllReports',
        'access_fund_box': 'canAccessFundBox',
        'switch_office': 'hasOfficeSelector'
    };
    
    if (permissionMap[permission]) {
        return role[permissionMap[permission]] === true;
    }
    
    return false;
}

function canAccessSection(sectionId) {
    const role = ROLE_PERMISSIONS[currentUserRole];
    if (!role) return false;
    
    if (!role.allowedSections.includes(sectionId)) {
        return false;
    }
    
    if (sectionId === 'role-super-admin' && !role.canManageOffices) {
        return false;
    }
    
    if (sectionId === 'role-fund-box' && !role.canAccessFundBox) {
        return false;
    }
    
    return true;
}

function initRBAC() {
    applyAntiFlickerStyles();
    
    const savedRole = localStorage.getItem('userRole');
    if (savedRole && ROLE_PERMISSIONS[savedRole]) {
        currentUserRole = savedRole;
    }
    
    currentUserToken = localStorage.getItem('authToken');
    initOfficeContext();
    updateUIForRole(currentUserRole);
    setupOfficeSelector();
}

function applyAntiFlickerStyles() {
    const style = document.createElement('style');
    style.id = 'rbac-anti-flicker';
    style.textContent = `
        .role-section, #section-stats {
            visibility: hidden !important;
            opacity: 0 !important;
        }
        .role-section.rbac-visible, #section-stats.rbac-visible {
            visibility: visible !important;
            opacity: 1 !important;
        }
        nav ul li[data-section] {
            display: none !important;
        }
        nav ul li[data-section].rbac-visible {
            display: block !important;
        }
    `;
    document.head.appendChild(style);
}

function updateUIForRole(role) {
    if (!ROLE_PERMISSIONS[role]) {
        console.error(`Invalid role: ${role}. Defaulting to super_admin.`);
        role = 'super_admin';
    }
    
    const permissions = ROLE_PERMISSIONS[role];
    currentUserRole = role;
    localStorage.setItem('userRole', role);
    
    hideAllSections();
    
    permissions.allowedSections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.remove('hidden');
            section.classList.add('rbac-visible');
            section.style.visibility = 'visible';
            section.style.opacity = '1';
        }
    });
    
    hideAllNavItems();
    
    permissions.allowedNavItems.forEach(navId => {
        const navItem = document.getElementById(navId);
        if (navItem) {
            navItem.classList.add('rbac-visible');
            navItem.style.display = 'block';
        }
    });
    
    updateUserProfile(role);
    setupOfficeSelector();
    ensureValidRoute(permissions);
    
    setTimeout(() => {
        const antiFlickerStyle = document.getElementById('rbac-anti-flicker');
        if (antiFlickerStyle) {
            antiFlickerStyle.remove();
        }
    }, 100);
    
    debugLog('RBAC Applied:', permissions.name, role);
}

function hideAllSections() {
    const allSections = document.querySelectorAll('.role-section, #section-stats');
    allSections.forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('rbac-visible');
        section.style.visibility = 'hidden';
        section.style.opacity = '0';
    });
}

function hideAllNavItems() {
    const allNavItems = document.querySelectorAll('nav ul li[data-section]');
    allNavItems.forEach(item => {
        item.classList.remove('rbac-visible', 'active');
        item.style.display = 'none';
    });
}

function setActiveNavItem(navItem) {
    if (!navItem) return;
    document.querySelectorAll('.sidebar nav ul li').forEach(item => {
        item.classList.remove('active');
    });
    navItem.classList.add('active');
}

function updateUserProfile(role) {
    const permissions = ROLE_PERMISSIONS[role];
    const userRoleEl = document.getElementById('user-role');
    const userNameEl = document.getElementById('user-name');
    const profileImg = document.getElementById('profile-img');
    
    if (userRoleEl) {
        userRoleEl.textContent = permissions.name;
    }
    
    if (userNameEl && profileImg) {
        const defaultNames = {
            super_admin: 'أحمد المدير',
            admin: 'خالد المدير',
            cashier: 'محمد الكاشير',
            accountant: 'فادي المحاسب'
        };
        
        const name = defaultNames[role] || 'مستخدم';
        userNameEl.textContent = name;
        profileImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`;
    }
    
    const roleSwitcher = document.getElementById('role-switcher');
    if (roleSwitcher) {
        roleSwitcher.value = role;
    }
}

function ensureValidRoute(permissions) {
    const currentHash = window.location.hash.substring(1);
    
    if (!currentHash || !permissions.allowedSections.includes(currentHash)) {
        const defaultSection = permissions.defaultRoute;
        history.replaceState(null, null, `#${defaultSection}`);
        
        const defaultSectionEl = document.getElementById(defaultSection);
        if (defaultSectionEl) {
            defaultSectionEl.classList.remove('hidden');
            defaultSectionEl.classList.add('rbac-visible');
            defaultSectionEl.style.visibility = 'visible';
            defaultSectionEl.style.opacity = '1';
        }
        
        const defaultNav = document.querySelector(`nav ul li[data-section="${defaultSection}"]`);
        if (defaultNav) {
            setActiveNavItem(defaultNav);
        }
        
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = 'لوحة التحكم';
        }
    }
}

function setupOfficeSelector() {
    const role = ROLE_PERMISSIONS[currentUserRole];
    const officeSelector = document.getElementById('office-selector-container');
    const officeDisplay = document.getElementById('current-office-display');
    
    if (officeSelector) {
        if (role && role.hasOfficeSelector) {
            officeSelector.classList.remove('hidden');
            officeSelector.style.display = 'block';
        } else {
            officeSelector.classList.add('hidden');
            officeSelector.style.display = 'none';
        }
    }
    
    if (!role.hasOfficeSelector && currentOfficeContext.officeName && officeDisplay) {
        officeDisplay.textContent = currentOfficeContext.officeName;
        officeDisplay.classList.remove('hidden');
    }
}

function switchRole(newRole) {
    if (!ROLE_PERMISSIONS[newRole]) {
        console.error(`Cannot switch to invalid role: ${newRole}`);
        return;
    }
    
    currentUserRole = newRole;
    localStorage.setItem('userRole', newRole);
    updateUIForRole(newRole);
    
    const roleName = ROLE_PERMISSIONS[newRole].name;
    showNotification(`تم تبديل الصلاحية إلى: ${roleName}`, 'info');
    
    debugLog('Role switched to:', newRole);
}

function getCurrentRole() {
    return {
        role: currentUserRole,
        ...ROLE_PERMISSIONS[currentUserRole]
    };
}

function isSuperAdmin() {
    return currentUserRole === 'super_admin';
}

function hasOfficeSelector() {
    const role = ROLE_PERMISSIONS[currentUserRole];
    return role ? role.hasOfficeSelector : false;
}

// ==========================================
// API SECURITY
// ==========================================

function getRoleHeaders() {
    return {
        'X-User-Role': currentUserRole,
        'X-User-Token': currentUserToken || '',
        'X-Request-Time': new Date().toISOString()
    };
}

async function secureFetch(url, options = {}) {
    const headers = {
        ...options.headers,
        ...getRoleHeaders(),
        'Content-Type': 'application/json'
    };
    
    const endpoint = url.replace('/api/', '');
    if (!canAccessEndpoint(endpoint, options.method || 'GET')) {
        throw new Error('غير مصرح: ليس لديك صلاحية للوصول إلى هذا المورد');
    }
    
    try {
        const response = await fetch(url, { ...options, headers });
        
        if (response.status === 403) {
            showNotification('غير مصرح: ليس لديك صلاحية لهذه العملية', 'error');
            throw new Error('Access denied');
        }
        
        return response;
    } catch (error) {
        console.error('Secure fetch error:', error);
        throw error;
    }
}

function canAccessEndpoint(endpoint, method = 'GET') {
    const permissions = ROLE_PERMISSIONS[currentUserRole];
    const apiPerms = permissions.apiPermissions;
    
    if (apiPerms.includes('admin')) return true;
    
    if (endpoint === 'offices') {
        return permissions.canManageOffices === true && method === 'GET';
    }
    
    if (endpoint === 'employees') {
        if (permissions.level >= 3) return false;
        if (permissions.level === 2 && ['POST', 'DELETE'].includes(method)) return false;
        return apiPerms.includes('read') || apiPerms.includes('office_manage');
    }
    
    if (endpoint === 'transfers') {
        if (permissions.restrictions?.cannotViewTransfers) return false;
        return apiPerms.includes('read') || apiPerms.includes('approve_transfers');
    }
    
    if (endpoint === 'reports') {
        if (permissions.canViewAllReports) return true;
        if (permissions.level === 2) return true;
        return false;
    }
    
    if (endpoint === 'fund-box') {
        return permissions.canAccessFundBox === true;
    }
    
    if (method === 'GET') {
        return apiPerms.includes('read');
    }
    
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        return apiPerms.includes('write') || apiPerms.includes('office_manage') || apiPerms.includes('accounting_write');
    }
    
    if (method === 'DELETE') {
        return apiPerms.includes('delete');
    }
    
    return false;
}

// ==========================================
// NOTIFICATION
// ==========================================

function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function' && window.showNotification !== showNotification) {
        window.showNotification(message, type);
        return;
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    const colors = {
        info: '#0d8bbc',
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545'
    };
    notification.style.background = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ==========================================
// DYNAMIC SIDEBAR
// ==========================================

function generateSidebarNavigation() {
    const role = ROLE_PERMISSIONS[currentUserRole];
    if (!role) {
        console.error('No role permissions found for:', currentUserRole);
        return;
    }
    
    const navList = document.getElementById('sidebar-nav-list');
    if (!navList) {
        console.warn('Sidebar nav list element not found');
        return;
    }
    
    navList.innerHTML = '';
    
    const allowedNavIds = role.allowedNavItems || [];
    
    const sortedNavIds = allowedNavIds.sort((a, b) => {
        const orderA = NAV_CONFIG[a]?.order || 99;
        const orderB = NAV_CONFIG[b]?.order || 99;
        return orderA - orderB;
    });
    
    sortedNavIds.forEach(navId => {
        const config = NAV_CONFIG[navId];
        if (!config) return;
        
        const li = document.createElement('li');
        li.id = navId;
        li.dataset.section = config.section;
        
        const a = document.createElement('a');
        a.href = config.section ? `#${config.section}` : '#';
        a.innerHTML = `<i class="fa-solid ${config.icon}"></i> ${config.label}`;
        
        a.addEventListener('click', (e) => {
            e.preventDefault();
            if (config.section && typeof showSection === 'function') {
                showSection(config.section);
                setActiveNavItem(li);
            }
        });
        
        li.appendChild(a);
        navList.appendChild(li);
    });
    
    const settingsConfig = NAV_CONFIG['nav-settings'];
    const li = document.createElement('li');
    li.id = 'nav-settings';
    
    const a = document.createElement('a');
    a.href = '#';
    a.innerHTML = `<i class="fa-solid ${settingsConfig.icon}"></i> ${settingsConfig.label}`;
    
    li.appendChild(a);
    navList.appendChild(li);
    
    debugLog('Generated sidebar for', role.name, 'with', sortedNavIds.length, 'items');
}

// ==========================================
// LOADING STATES
// ==========================================

function showLoadingScreen() {
    hideLoadingScreen();
    
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'app-loading-screen';
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #ffffff;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        transition: opacity 0.3s ease;
    `;
    
    loadingOverlay.innerHTML = `
        <div style="text-align: center;">
            <div style="width: 60px; height: 60px; border: 4px solid #f3f3f3; border-top: 4px solid #0d8abc; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <h3 style="color: #2c3e50; margin: 0; font-family: 'Cairo', sans-serif;">جاري التحميل...</h3>
            <p style="color: #6c757d; margin: 10px 0 0; font-size: 14px; font-family: 'Cairo', sans-serif;">جاري تحميل النظام</p>
        </div>
    `;
    
    const style = document.createElement('style');
    style.id = 'loading-spinner-style';
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(loadingOverlay);
}

function hideLoadingScreen() {
    const loadingOverlay = document.getElementById('app-loading-screen');
    if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.remove();
        }, 300);
    }
    
    const spinnerStyle = document.getElementById('loading-spinner-style');
    if (spinnerStyle) {
        spinnerStyle.remove();
    }
}

// ==========================================
// INITIALIZATION
// ==========================================

function initApp() {
    debugLog('Initializing FlashPay Application...');
    
    showLoadingScreen();
    
    const failsafe = setTimeout(() => {
        debugWarn('Initialization timeout - forcing loading screen hide');
        hideLoadingScreen();
    }, 10000);
    
    setTimeout(() => {
        try {
            initRBAC();
            generateSidebarNavigation();
            
            const savedRole = localStorage.getItem('userRole') || 'super_admin';
            
            if (ROLE_PERMISSIONS[savedRole]) {
                switchRole(savedRole);
            } else {
                switchRole('super_admin');
            }
            
            if (typeof initNavigation === 'function') {
                initNavigation();
            }
            
            debugLog('Application initialized successfully');
            
        } catch (error) {
            debugWarn('Error initializing application:', error);
            showNotification('فشل تحميل النظام، يرجى تحديث الصفحة', 'error');
        } finally {
            clearTimeout(failsafe);
            hideLoadingScreen();
        }
    }, 500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// ==========================================
// EXPORTS
// ==========================================

if (typeof window !== 'undefined') {
    window.ROLE_PERMISSIONS = ROLE_PERMISSIONS;
    window.NAV_CONFIG = NAV_CONFIG;
    window.initRBAC = initRBAC;
    window.initApp = initApp;
    window.updateUIForRole = updateUIForRole;
    window.switchRole = switchRole;
    window.getCurrentRole = getCurrentRole;
    window.isSuperAdmin = isSuperAdmin;
    window.hasPermission = hasPermission;
    window.canAccessSection = canAccessSection;
    window.setOfficeContext = setOfficeContext;
    window.getOfficeContext = getOfficeContext;
    window.canAccessOffice = canAccessOffice;
    window.getDataFilterParams = getDataFilterParams;
    window.secureFetch = secureFetch;
    window.canAccessEndpoint = canAccessEndpoint;
    window.getRoleHeaders = getRoleHeaders;
    window.generateSidebarNavigation = generateSidebarNavigation;
    window.setActiveNavItem = setActiveNavItem;
    window.showLoadingScreen = showLoadingScreen;
    window.hideLoadingScreen = hideLoadingScreen;
    window.showNotification = showNotification;
    window.debugLog = debugLog;
    window.debugWarn = debugWarn;
}
