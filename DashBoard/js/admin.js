// js/admin.js - Super Admin Functionality (REFACTORED)
// ==========================================
// Security: Input sanitization, XSS protection added
// Robustness: Null checks, error handling added
// UX: Loading states, confirmation dialogs added

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all functionality
    initOfficeManagement();
    initExchangeRate();
    initEmployeeManagement();
    initEmployeesNavigation();
});

// ==========================================
// UTILITY FUNCTIONS (Security: XSS Protection)
// ==========================================
function sanitizeInput(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '<',
        '>': '>',
        '"': '"',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function showNotification(message, type = 'info') {
    // Remove existing notifications first
    const existing = document.querySelectorAll('.notification');
    existing.forEach(el => el.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fa-solid fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${escapeHtml(message)}</span>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#0056b3'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 9999;
        animation: slideDown 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { top: -100px; opacity: 0; }
            to { top: 20px; opacity: 1; }
        }
        @keyframes slideUp {
            from { top: 20px; opacity: 1; }
            to { top: -100px; opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showConfirmDialog(title, message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    overlay.innerHTML = `
        <div class="confirm-dialog" style="
            background: white;
            padding: 25px;
            border-radius: 12px;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        ">
            <h3 style="margin-bottom: 15px; color: #2c3e50;">${escapeHtml(title)}</h3>
            <p style="color: #6c757d; margin-bottom: 20px;">${escapeHtml(message)}</p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button class="btn-secondary" id="confirm-cancel">إلغاء</button>
                <button class="btn-primary" id="confirm-ok" style="background: #dc3545;">تأكيد</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('confirm-cancel').onclick = () => overlay.remove();
    document.getElementById('confirm-ok').onclick = () => {
        onConfirm();
        overlay.remove();
    };
}

// ==========================================
// OFFICE MANAGEMENT
// ==========================================
function initOfficeManagement() {
    const officeManagerSelect = document.getElementById('office-manager');
    const newManagerFields = document.getElementById('new-manager-fields');
    const saveOfficeBtn = document.getElementById('save-office-btn');

    // Robust null check
    if (!officeManagerSelect || !saveOfficeBtn) {
        console.warn('Office management elements not found');
        return;
    }

    officeManagerSelect.addEventListener('change', function() {
        if (newManagerFields) {
            newManagerFields.style.display = this.value === 'new' ? 'block' : 'none';
        }
    });

    saveOfficeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Input validation
        const officeName = document.getElementById('office-name')?.value.trim();
        const officeAddress = document.getElementById('office-address')?.value.trim();
        const officeManager = officeManagerSelect.value;
        const newManagerName = document.getElementById('new-manager-name')?.value.trim();
        const officeBalance = document.getElementById('office-balance')?.value;
        const officePhone = document.getElementById('office-phone')?.value.trim();

        // Validation checks
        if (!officeName || officeName.length < 2) {
            showNotification('يرجى إدخال اسم المكتب (أقل رمزين)', 'error');
            return;
        }

        if (!officeAddress || officeAddress.length < 5) {
            showNotification('يرجى إدخال العنوان بشكل صحيح', 'error');
            return;
        }

        if (officeManager === 'new' && (!newManagerName || newManagerName.length < 3)) {
            showNotification('يرجى إدخال اسم المدير الجديد (أقل من 3 أحرف)', 'error');
            return;
        }

        // Phone validation (basic)
        if (officePhone && !/^\+?[\d\s-]{10,}$/.test(officePhone)) {
            showNotification('يرجى إدخال رقم هاتف صحيح', 'error');
            return;
        }

        // Balance validation
        if (officeBalance && (isNaN(officeBalance) || parseFloat(officeBalance) < 0)) {
            showNotification('يرجى إدخال رصيد صحيح', 'error');
            return;
        }

        const managerName = officeManager === 'new' 
            ? sanitizeInput(newManagerName) 
            : officeManagerSelect.options[officeManagerSelect.selectedIndex]?.text || 'غير محدد';
        
        addOfficeToTable(
            sanitizeInput(officeName), 
            sanitizeInput(managerName), 
            sanitizeInput(officePhone || '')
        );
        
        showNotification(`تم إنشاء مكتب "${officeName}" وتعيين "${managerName}" بنجاح!`, 'success');
        
        // Clear form
        const form = document.getElementById('office-form');
        if (form) form.reset();
        if (newManagerFields) newManagerFields.style.display = 'none';
    });
}

function addOfficeToTable(name, manager, phone) {
    const tbody = document.getElementById('offices-table-body');
    if (!tbody) {
        console.error('Offices table body not found');
        return;
    }

    const row = document.createElement('tr');
    // Security: Use textContent for user data
    row.innerHTML = `
        <td class="office-name"></td>
        <td class="office-manager"></td>
        <td class="office-phone"></td>
        <td><span class="status-badge status-active">نشط</span></td>
        <td>
            <button class="icon-btn" title="تعديل"><i class="fa-solid fa-pen"></i></button>
            <button class="icon-btn text-danger" title="حذف" onclick="deleteOffice(this)"><i class="fa-solid fa-trash"></i></button>
        </td>
    `;
    
    // Security: Set textContent instead of innerHTML
    row.querySelector('.office-name').textContent = name;
    row.querySelector('.office-manager').textContent = manager;
    row.querySelector('.office-phone').textContent = phone || 'غير محدد';
    
    tbody.appendChild(row);
}

// Global function for delete button
function deleteOffice(btn) {
    showConfirmDialog(
        'حذف المكتب',
        'هل أنت متأكد من حذف هذا المكتب؟ لا يمكن التراجع عن هذا الإجراء.',
        () => {
            const row = btn.closest('tr');
            if (row) {
                row.remove();
                showNotification('تم حذف المكتب بنجاح', 'success');
            }
        }
    );
}

// ==========================================
// EXCHANGE RATE MANAGEMENT
// ==========================================
function initExchangeRate() {
    const rateFrom = document.getElementById('rate-from');
    const rateTo = document.getElementById('rate-to');
    const updateRateBtn = document.getElementById('update-rate-btn');
    
    if (!rateFrom || !rateTo) {
        console.warn('Exchange rate elements not found');
        return;
    }
    
    // Exchange rates (in real app, this would come from API)
    const exchangeRates = {
        'USD-SYP': 12500,
        'USD-EUR': 0.92,
        'USD-GBP': 0.78,
        'USD-TRY': 27.50,
        'USD-SAR': 3.75,
        'USD-AED': 3.67,
        'EUR-USD': 1.09,
        'GBP-USD': 1.28,
        'TRY-USD': 0.036,
        'SYP-USD': 0.00008
    };

    function calculateRate() {
        const from = rateFrom.value;
        const to = rateTo.value;
        const calculatedRateEl = document.getElementById('calculated-rate');
        
        if (!calculatedRateEl) return;

        let rate;
        const key = `${from}-${to}`;
        
        if (from === to) {
            rate = 1;
        } else if (exchangeRates[key]) {
            rate = exchangeRates[key];
        } else {
            // Calculate via USD
            const toUSD = exchangeRates[`${to}-USD`] || (1 / exchangeRates[`USD-${to}`]);
            const fromUSD = exchangeRates[`USD-${from}`] || (1 / exchangeRates[`${from}-USD`]);
            rate = toUSD * fromUSD;
        }

        const formattedRate = rate > 100 ? rate.toLocaleString() : rate.toFixed(4);
        calculatedRateEl.textContent = `${formattedRate} ${to}`;
        
        const newRateInput = document.getElementById('new-exchange-rate');
        if (newRateInput) {
            newRateInput.placeholder = `أدخل السعر الجديد (${from} = ? ${to})`;
        }
        
        updateQuickRates();
    }

    rateFrom.addEventListener('change', calculateRate);
    rateTo.addEventListener('change', calculateRate);

    if (updateRateBtn) {
        updateRateBtn.addEventListener('click', function() {
            const from = rateFrom.value;
            const to = rateTo.value;
            const newRateInput = document.getElementById('new-exchange-rate');
            
            if (!newRateInput) return;
            
            const newRate = newRateInput.value.trim();

            if (!newRate || isNaN(newRate) || parseFloat(newRate) <= 0) {
                showNotification('يرجى إدخال سعر صرف صحيح', 'error');
                return;
            }

            const rateValue = parseFloat(newRate);
            
            // Update the rate
            exchangeRates[`${from}-${to}`] = rateValue;
            exchangeRates[`${to}-${from}`] = 1 / rateValue;

            showNotification(`تم تحديث سعر الصرف: 1 ${from} = ${newRate} ${to}`, 'success');
            
            newRateInput.value = '';
            calculateRate();
        });
    }

    function updateQuickRates() {
        const quickRates = document.querySelectorAll('.quick-rate-item');
        quickRates.forEach(item => {
            const currencyEl = item.querySelector('.currency');
            const valueEl = item.querySelector('.value');
            if (!currencyEl || !valueEl) return;
            
            const currency = currencyEl.textContent;
            const [from, to] = currency.split('/');
            const key = `${from}-${to}`;
            const value = exchangeRates[key];
            if (value) {
                valueEl.textContent = value > 100 ? value.toLocaleString() : value;
            }
        });
    }

    calculateRate();
}

// ==========================================
// EMPLOYEE MANAGEMENT
// ==========================================
function initEmployeeManagement() {
    const addEmployeeBtn = document.getElementById('add-employee-btn');
    const employeeModal = document.getElementById('employee-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelEmployeeBtn = document.getElementById('cancel-employee');
    const employeeForm = document.getElementById('employee-form');

    if (!employeeModal || !employeeForm) {
        console.warn('Employee modal elements not found');
        return;
    }

    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener('click', function() {
            employeeModal.classList.remove('hidden');
        });
    }

    function closeModal() {
        employeeModal.classList.add('hidden');
        employeeForm.reset();
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    if (cancelEmployeeBtn) {
        cancelEmployeeBtn.addEventListener('click', closeModal);
    }

    employeeModal.addEventListener('click', function(e) {
        if (e.target === employeeModal) {
            closeModal();
        }
    });

    employeeForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const empName = document.getElementById('emp-name')?.value.trim();
        const empPhone = document.getElementById('emp-phone')?.value.trim();
        const empType = document.getElementById('emp-type')?.value;
        const empOffice = document.getElementById('emp-office')?.value;
        const empOfficeSelect = document.getElementById('emp-office');
        const empOfficeText = empOfficeSelect?.options[empOfficeSelect.selectedIndex]?.text || '';

        // Validation
        if (!empName || empName.length < 3) {
            showNotification('يرجى إدخال اسم الموظف (أقل من 3 أحرف)', 'error');
            return;
        }

        if (!empPhone || !/^\+?[\d\s-]{10,}$/.test(empPhone)) {
            showNotification('يرجى إدخال رقم هاتف صحيح', 'error');
            return;
        }

        if (!empType) {
            showNotification('يرجى اختيار نوع الموظف', 'error');
            return;
        }

        if (!empOffice) {
            showNotification('يرجى اختيار المكتب', 'error');
            return;
        }

        addEmployeeToTable(
            sanitizeInput(empName), 
            sanitizeInput(empPhone), 
            sanitizeInput(empType), 
            sanitizeInput(empOfficeText)
        );
        
        showNotification(`تم إضافة الموظف "${empName}" بنجاح!`, 'success');
        closeModal();
    });

    // Filters with debounce
    const employeeSearch = document.getElementById('employee-search');
    const employeeTypeFilter = document.getElementById('employee-type-filter');
    const employeeOfficeFilter = document.getElementById('employee-office-filter');
    const employeeStatusFilter = document.getElementById('employee-status-filter');

    let filterTimeout;
    function debounceFilter() {
        clearTimeout(filterTimeout);
        filterTimeout = setTimeout(filterEmployees, 300);
    }

    function filterEmployees() {
        const searchTerm = employeeSearch?.value.toLowerCase() || '';
        const typeFilter = employeeTypeFilter?.value || 'all';
        const officeFilter = employeeOfficeFilter?.value || 'all';
        const statusFilter = employeeStatusFilter?.value || 'all';

        const rows = document.querySelectorAll('#employees-table-body tr');
        
        rows.forEach(row => {
            const nameCell = row.querySelector('.employee-info span');
            const name = nameCell?.textContent.toLowerCase() || '';
            const phone = row.cells[2]?.textContent.toLowerCase() || '';
            const typeBadge = row.querySelector('.role-badge');
            const type = typeBadge?.textContent.trim() || '';
            const office = row.cells[4]?.textContent || '';
            const statusBadge = row.querySelector('.status-badge');
            const status = statusBadge?.textContent.trim() || '';

            let show = true;

            if (searchTerm && !name.includes(searchTerm) && !phone.includes(searchTerm)) {
                show = false;
            }

            if (typeFilter !== 'all') {
                const typeMap = {
                    'agent': 'مندوب',
                    'cashier': 'كاشير',
                    'office_manager': 'مدير مكتب',
                    'accountant': 'محاسب'
                };
                if (!type.includes(typeMap[typeFilter])) {
                    show = false;
                }
            }

            if (officeFilter !== 'all' && !office.includes(officeFilter)) {
                show = false;
            }

            if (statusFilter !== 'all') {
                const statusMap = {
                    'active': 'نشط',
                    'inactive': 'غير نشط'
                };
                if (!status.includes(statusMap[statusFilter])) {
                    show = false;
                }
            }

            row.style.display = show ? '' : 'none';
        });
    }

    if (employeeSearch) employeeSearch.addEventListener('input', debounceFilter);
    if (employeeTypeFilter) employeeTypeFilter.addEventListener('change', filterEmployees);
    if (employeeOfficeFilter) employeeOfficeFilter.addEventListener('change', filterEmployees);
    if (employeeStatusFilter) employeeStatusFilter.addEventListener('change', filterEmployees);
}

function addEmployeeToTable(name, phone, type, office) {
    const tbody = document.getElementById('employees-table-body');
    if (!tbody) return;

    const typeLabels = {
        'agent': '<span class="role-badge role-agent"><i class="fa-solid fa-user"></i> مندوب</span>',
        'cashier': '<span class="role-badge role-cashier"><i class="fa-solid fa-cash-register"></i> كاشير</span>',
        'office_manager': '<span class="role-badge role-manager"><i class="fa-solid fa-user-tie"></i> مدير مكتب</span>',
        'accountant': '<span class="role-badge role-accountant"><i class="fa-solid fa-calculator"></i> محاسب</span>'
    };

    const today = new Date().toLocaleDateString('ar', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const row = document.createElement('tr');
    const rowNumber = tbody.children.length + 1;
    
    row.innerHTML = `
        <td>${rowNumber}</td>
        <td>
            <div class="employee-info">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff" alt="">
                <span class="emp-name"></span>
            </div>
        </td>
        <td class="emp-phone"></td>
        <td>${typeLabels[type] || type}</td>
        <td class="emp-office"></td>
        <td>${today}</td>
        <td><span class="status-badge status-active">نشط</span></td>
        <td>
            <button class="icon-btn" title="تعديل"><i class="fa-solid fa-pen"></i></button>
            <button class="icon-btn text-danger" title="حذف" onclick="deleteEmployee(this)"><i class="fa-solid fa-trash"></i></button>
        </td>
    `;
    
    // Security: Set textContent
    row.querySelector('.emp-name').textContent = name;
    row.querySelector('.emp-phone').textContent = phone;
    row.querySelector('.emp-office').textContent = office;
    
    tbody.appendChild(row);
}

function deleteEmployee(btn) {
    showConfirmDialog(
        'حذف الموظف',
        'هل أنت متأكد من حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء.',
        () => {
            const row = btn.closest('tr');
            if (row) {
                row.remove();
                showNotification('تم حذف الموظف بنجاح', 'success');
                // Renumber rows
                const rows = document.querySelectorAll('#employees-table-body tr');
                rows.forEach((r, i) => {
                    r.cells[0].textContent = i + 1;
                });
            }
        }
    );
}

// ==========================================
// EMPLOYEES NAVIGATION
// ==========================================
function initEmployeesNavigation() {
    const navEmployees = document.getElementById('nav-employees');
    
    if (navEmployees) {
        navEmployees.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Switch to employees section
            showSection('role-employees');
            
            // Update active nav - fix the navigation highlighting
            document.querySelectorAll('.sidebar nav li').forEach(li => {
                li.classList.remove('active');
            });
            navEmployees.classList.add('active');
            
            // Update page title
            const pageTitle = document.getElementById('page-title');
            if (pageTitle) {
                pageTitle.textContent = 'إدارة الموظفين';
            }
        });
    }
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.role-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    const statsSection = document.getElementById('section-stats');
    if (statsSection) {
        statsSection.classList.add('hidden');
    }
    
    // Show requested section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.remove('hidden');
    }
}
