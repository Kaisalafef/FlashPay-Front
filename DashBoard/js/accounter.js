// js/accounter.js - Accountant Functionality
// ==========================================
// Role: المحاسب (Accountant)
// Features: Daily transactions log, Financial reports, Balance management

document.addEventListener('DOMContentLoaded', () => {
    // Initialize accountant functionality
    initAccounter();
});

// ==========================================
// MAIN INITIALIZATION
// ==========================================
function initAccounter() {
    console.log('Initializing Accountant Module...');
    
    // Initialize all sub-modules
    initTransactionsLog();
    initFinancialReports();
    initBalanceManagement();
    
    // Initialize sidebar navigation for accountant
    initAccounterNavigation();
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '<', '>': '>', '"': '"', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function sanitizeInput(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

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

// ==========================================
// TRANSACTIONS LOG
// ==========================================
function initTransactionsLog() {
    console.log('Initializing Transactions Log...');
    
    // Sample transaction data
    const transactions = [
        { date: '24 أكتوبر 2025', description: 'رصيد افتتاحي', income: '-', expense: '-', balance: '$120,000' },
        { date: '24 أكتوبر 2025', description: 'إيداع وكيل #04', income: '+$5,000', expense: '-', balance: '$125,000' },
        { date: '24 أكتوبر 2025', description: 'حوالة صادرة #882', income: '-', expense: '-$800', balance: '$124,200' },
        { date: '24 أكتوبر 2025', description: 'عمولة حوالة #882', income: '+$40', expense: '-', balance: '$124,240' },
        { date: '24 أكتوبر 2025', description: 'إيداع وكيل #07', income: '+$3,000', expense: '-', balance: '$127,240' },
        { date: '24 أكتوبر 2025', description: 'صرف حوالة #883', income: '-', expense: '-$1,500', balance: '$125,740' },
        { date: '24 أكتوبر 2025', description: 'عمولة حوالة #883', income: '+$75', expense: '-', balance: '$125,815' },
    ];

    // Populate the transactions table if it exists
    const tbody = document.querySelector('#role-accountant tbody');
    if (tbody) {
        tbody.innerHTML = transactions.map(t => `
            <tr>
                <td>${escapeHtml(t.date)}</td>
                <td>${escapeHtml(t.description)}</td>
                <td class="${t.income !== '-' ? 'green-text' : ''}">${escapeHtml(t.income)}</td>
                <td class="${t.expense !== '-' ? 'red-text' : ''}">${escapeHtml(t.expense)}</td>
                <td><strong>${escapeHtml(t.balance)}</strong></td>
            </tr>
        `).join('');
    }
}

// ==========================================
// FINANCIAL REPORTS
// ==========================================
function initFinancialReports() {
    console.log('Initializing Financial Reports...');
    
    // Add report generation functionality if needed
    const generateReportBtn = document.getElementById('generate-report-btn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateFinancialReport);
    }
}

function generateFinancialReport() {
    showNotification('جاري إنشاء التقرير المالي...', 'info');
    
    // Simulate report generation
    setTimeout(() => {
        showNotification('تم إنشاء التقرير المالي بنجاح!', 'success');
    }, 1500);
}

// ==========================================
// BALANCE MANAGEMENT
// ==========================================
function initBalanceManagement() {
    console.log('Initializing Balance Management...');
    
    // Add balance adjustment functionality if needed
    const adjustBalanceBtn = document.getElementById('adjust-balance-btn');
    if (adjustBalanceBtn) {
        adjustBalanceBtn.addEventListener('click', adjustBalance);
    }
}

function adjustBalance() {
    const amount = prompt('أدخل المبلغ المراد تعديله (موجب للإيداع، سالب للصرف):');
    if (amount === null) return;
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
        showNotification('يرجى إدخال مبلغ صحيح', 'error');
        return;
    }
    
    showNotification(`تم تعديل الرصيد بمبلغ ${parsedAmount > 0 ? '+' : ''}$${parsedAmount}`, 'success');
}

// ==========================================
// NAVIGATION HANDLERS
// ==========================================
function initAccounterNavigation() {
    // Dashboard nav
    const navDashboard = document.getElementById('nav-dashboard');
    if (navDashboard) {
        navDashboard.addEventListener('click', function(e) {
            e.preventDefault();
            showDashboard();
        });
    }
    
    // Transfers nav (view transfers)
    const navTransfers = document.getElementById('nav-transfers');
    if (navTransfers) {
        navTransfers.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('الحوالات - عرض فقط', 'info');
        });
    }
    
    // Reports nav
    const navReports = document.getElementById('nav-reports');
    if (navReports) {
        navReports.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('التقارير - جاري التطوير', 'info');
        });
    }
}

function showDashboard() {
    // Show dashboard section
    const statsSection = document.getElementById('section-stats');
    if (statsSection) {
        statsSection.classList.remove('hidden');
    }
    
    // Show super admin section (dashboard content)
    const superAdminSection = document.getElementById('role-super-admin');
    if (superAdminSection) {
        superAdminSection.classList.remove('hidden');
    }
    
    // Hide other sections
    const sections = ['role-employees', 'role-admin', 'role-agent', 'role-customer', 'role-accountant'];
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('hidden');
        }
    });
    
    // Update active nav
    document.querySelectorAll('.sidebar nav li').forEach(li => {
        li.classList.remove('active');
    });
    
    const navDashboard = document.getElementById('nav-dashboard');
    if (navDashboard) {
        navDashboard.classList.add('active');
    }
    
    // Update page title
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.textContent = 'لوحة التحكم';
    }
    
    // Update role info for accountant viewing dashboard
    updateHeaderForDashboard();
}

function updateHeaderForDashboard() {
    const userName = document.getElementById('user-name');
    const userRole = document.getElementById('user-role');
    
    if (userName) userName.textContent = 'فادي (محاسب)';
    if (userRole) userRole.textContent = 'Accountant';
}

// Export for global use
window.initAccounter = initAccounter;
window.showDashboard = showDashboard;
