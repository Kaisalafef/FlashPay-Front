/**
 * FlashPay API Service - Laravel Integration
 * ==========================================
 * Production-ready API client for Laravel backend
 * 
 * Features:
 * - Laravel API integration with Bearer token auth
 * - Async/await support
 * - Automatic error handling with Arabic messages
 * - Loading state management
 * - Office context injection
 * 
 * Security:
 * - All requests include Authorization header
 * - Office context for data isolation
 * - Role-based endpoint validation
 */

// ==========================================
// GENERIC API REQUEST HANDLER
// ==========================================

/**
 * Generic API request handler using Laravel API
 * @param {string} endpoint - API endpoint (e.g., '/employees')
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - Parsed JSON response
 */
async function apiRequest(endpoint, options = {}) {
    try {
        const method = options.method || 'GET';
        console.log(`🌐 API Request: ${method} ${endpoint}`);
        
        let result;
        
        switch (method) {
            case 'GET':
                result = await LaravelAPI.get(endpoint, options.params);
                break;
            case 'POST':
                result = await LaravelAPI.post(endpoint, options.body ? JSON.parse(options.body) : {});
                break;
            case 'PUT':
                result = await LaravelAPI.put(endpoint, options.body ? JSON.parse(options.body) : {});
                break;
            case 'PATCH':
                result = await LaravelAPI.patch(endpoint, options.body ? JSON.parse(options.body) : {});
                break;
            case 'DELETE':
                result = await LaravelAPI.delete(endpoint);
                break;
            default:
                result = await LaravelAPI.get(endpoint);
        }
        
        return result;
    } catch (error) {
        console.error('❌ API Error:', error);
        
        // Handle specific error types
        if (error.code === 'UNAUTHORIZED') {
            showNotification('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى', 'error');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        } else if (error.code === 'FORBIDDEN') {
            showNotification('غير مصرح: ليس لديك صلاحية لهذه العملية', 'error');
        }
        
        // Return formatted error
        return {
            success: false,
            message: error.message || 'حدث خطأ في الاتصال بالخادم',
            error: error.message,
            code: error.code
        };
    }
}

// ==========================================
// OFFICES API
// ==========================================

/**
 * Get all offices
 * @param {Object} filters - Optional filters (active, city_id)
 * @returns {Promise<Object>}
 */
async function getOffices(filters = {}) {
    const contextFilters = {
        ...filters,
        ...AuthService.getDataFilterParams()
    };
    
    return await LaravelAPI.get('/offices', contextFilters);
}

/**
 * Create new office
 * @param {Object} officeData - Office data
 * @returns {Promise<Object>}
 */
async function createOffice(officeData) {
    if (!AuthService.isSuperAdmin()) {
        showNotification('غير مصرح: فقط المدير العام يمكنه إضافة مكاتب', 'error');
        return { success: false, message: 'Permission denied' };
    }
    
    return await LaravelAPI.post('/offices', officeData);
}

/**
 * Update office
 * @param {number} officeId - Office ID
 * @param {Object} officeData - Updated office data
 * @returns {Promise<Object>}
 */
async function updateOffice(officeId, officeData) {
    if (!AuthService.isSuperAdmin()) {
        showNotification('غير مصرح: فقط المدير العام يمكنه تعديل المكاتب', 'error');
        return { success: false, message: 'Permission denied' };
    }
    
    return await LaravelAPI.put(`/offices/${officeId}`, officeData);
}

/**
 * Delete office
 * @param {number} officeId - Office ID
 * @returns {Promise<Object>}
 */
async function deleteOffice(officeId) {
    if (!AuthService.isSuperAdmin()) {
        showNotification('غير مصرح: فقط المدير العام يمكنه حذف المكاتب', 'error');
        return { success: false, message: 'Permission denied' };
    }
    
    return await LaravelAPI.delete(`/offices/${officeId}`);
}

// ==========================================
// EMPLOYEES API
// ==========================================

/**
 * Get all employees
 * @param {Object} filters - Optional filters (role, office_id, is_active)
 * @returns {Promise<Object>}
 */
async function getEmployees(filters = {}) {
    const contextFilters = {
        ...filters,
        ...AuthService.getDataFilterParams()
    };
    
    return await LaravelAPI.get('/employees', contextFilters);
}

/**
 * Create new employee
 * @param {Object} employeeData - Employee data
 * @returns {Promise<Object>}
 */
async function createEmployee(employeeData) {
    if (!AuthService.isSuperAdmin()) {
        showNotification('غير مصرح: فقط المدير العام يمكنه إضافة موظفين', 'error');
        return { success: false, message: 'Permission denied' };
    }
    
    return await LaravelAPI.post('/employees', employeeData);
}

/**
 * Update employee
 * @param {number} employeeId - Employee ID
 * @param {Object} employeeData - Updated employee data
 * @returns {Promise<Object>}
 */
async function updateEmployee(employeeId, employeeData) {
    const user = AuthService.getCurrentUser();
    
    if (AuthService.isSuperAdmin()) {
        return await LaravelAPI.put(`/employees/${employeeId}`, employeeData);
    }
    
    if (user && user.role === 'admin') {
        const employee = await LaravelAPI.get(`/employees/${employeeId}`);
        if (employee.success && employee.data.office_id === user.office_id) {
            return await LaravelAPI.put(`/employees/${employeeId}`, employeeData);
        } else {
            showNotification('غير مصرح: لا يمكنك تعديل موظفين من مكاتب أخرى', 'error');
            return { success: false, message: 'Permission denied' };
        }
    }
    
    showNotification('غير مصرح: ليس لديك صلاحية لتعديل الموظفين', 'error');
    return { success: false, message: 'Permission denied' };
}

/**
 * Delete employee
 * @param {number} employeeId - Employee ID
 * @returns {Promise<Object>}
 */
async function deleteEmployee(employeeId) {
    if (!AuthService.isSuperAdmin()) {
        showNotification('غير مصرح: فقط المدير العام يمكنه حذف موظفين', 'error');
        return { success: false, message: 'Permission denied' };
    }
    
    return await LaravelAPI.delete(`/employees/${employeeId}`);
}

// ==========================================
// TRANSFERS API (View Only - No Creation)
// ==========================================

/**
 * Get all transfers
 * @param {Object} filters - Optional filters (status, search, start_date, end_date)
 * @returns {Promise<Object>}
 */
async function getTransfers(filters = {}) {
    const user = AuthService.getCurrentUser();
    
    const contextFilters = {
        ...filters,
        ...AuthService.getDataFilterParams()
    };
    
    return await LaravelAPI.get('/transfers', contextFilters);
}

/**
 * Approve transfer
 * @param {number} transferId - Transfer ID
 * @returns {Promise<Object>}
 */
async function approveTransfer(transferId) {
    const user = AuthService.getCurrentUser();
    
    if (!user || !['cashier', 'admin', 'super_admin'].includes(user.role)) {
        showNotification('غير مصرح: ليس لديك صلاحية لاعتماد الحوالات', 'error');
        return { success: false, message: 'Permission denied' };
    }
    
    return await LaravelAPI.post(`/transfers/${transferId}/approve`, {
        approved_by: user.id,
        approved_at: new Date().toISOString()
    });
}

/**
 * Cancel transfer
 * @param {number} transferId - Transfer ID
 * @returns {Promise<Object>}
 */
async function cancelTransfer(transferId) {
    const user = AuthService.getCurrentUser();
    
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
        showNotification('غير مصرح: ليس لديك صلاحية لإلغاء الحوالات', 'error');
        return { success: false, message: 'Permission denied' };
    }
    
    return await LaravelAPI.post(`/transfers/${transferId}/cancel`, {
        cancelled_by: user.id,
        cancelled_at: new Date().toISOString()
    });
}

// ==========================================
// REPORTS API
// ==========================================

/**
 * Get dashboard summary
 * @param {Object} params - Optional params (start_date, end_date)
 * @returns {Promise<Object>}
 */
async function getReportsSummary(params = {}) {
    const user = AuthService.getCurrentUser();
    
    if (user && ['cashier', 'accountant'].includes(user.role)) {
        showNotification('غير مصرح: ليس لديك صلاحية لعرض التقارير', 'error');
        return { success: false, message: 'Permission denied' };
    }
    
    const contextParams = {
        ...params,
        ...AuthService.getDataFilterParams()
    };
    
    return await LaravelAPI.get('/reports/summary', contextParams);
}

/**
 * Get financial reports
 * @param {Object} params - Report parameters
 * @returns {Promise<Object>}
 */
async function getFinancialReports(params = {}) {
    const user = AuthService.getCurrentUser();
    
    if (!user || !['super_admin', 'admin'].includes(user.role)) {
        showNotification('غير مصرح: ليس لديك صلاحية لعرض التقارير المالية', 'error');
        return { success: false, message: 'Permission denied' };
    }
    
    const contextParams = {
        ...params,
        ...AuthService.getDataFilterParams()
    };
    
    return await LaravelAPI.get('/reports/financial', contextParams);
}

// ==========================================
// ACTIVITIES API
// ==========================================

/**
 * Get recent activities
 * @param {number} limit - Number of activities to fetch
 * @returns {Promise<Object>}
 */
async function getActivities(limit = 10) {
    const contextParams = {
        limit,
        ...AuthService.getDataFilterParams()
    };
    
    return await LaravelAPI.get('/activities', contextParams);
}

// ==========================================
// FUND BOX API (Super Admin Only)
// ==========================================

/**
 * Get fund box data
 * @returns {Promise<Object>}
 */
async function getFundBoxData() {
    if (!AuthService.isSuperAdmin()) {
        showNotification('غير مصرح: فقط المدير العام يمكنه الوصول لصندوق التداول', 'error');
        return { success: false, message: 'Permission denied' };
    }
    
    return await LaravelAPI.get('/fund-box');
}

/**
 * Create fund box transaction
 * @param {Object} transactionData - Transaction data
 * @returns {Promise<Object>}
 */
async function createFundBoxTransaction(transactionData) {
    if (!AuthService.isSuperAdmin()) {
        showNotification('غير مصرح: فقط المدير العام يمكنه إجراء عمليات التداول', 'error');
        return { success: false, message: 'Permission denied' };
    }
    
    return await LaravelAPI.post('/fund-box/transactions', transactionData);
}

// ==========================================
// DATA SYNC FUNCTIONS
// ==========================================

/**
 * Fetch and update reports data
 */
async function fetchReportsData() {
    const startDate = document.getElementById('report-start-date')?.value;
    const endDate = document.getElementById('report-end-date')?.value;
    
    const result = await getReportsSummary({
        start_date: startDate,
        end_date: endDate
    });
    
    if (result.success) {
        document.getElementById('total-revenue').textContent = 
            '$' + result.data.total_revenue.toLocaleString();
        document.getElementById('total-employees').textContent = 
            result.data.total_employees;
        document.getElementById('active-offices').textContent = 
            result.data.active_offices;
        document.getElementById('total-transfers').textContent = 
            result.data.total_transfers.toLocaleString();
        
        updateActivitiesTable(result.data.recent_activities);
        
        showNotification('تم تحديث البيانات بنجاح', 'success');
    } else {
        showNotification(result.message || 'فشل تحديث البيانات', 'error');
    }
}

/**
 * Update activities table
 * @param {Array} activities - Activities data
 */
function updateActivitiesTable(activities) {
    const tbody = document.getElementById('recent-activities-body');
    if (!tbody || !activities) return;
    
    tbody.innerHTML = activities.map(activity => `
        <tr>
            <td>${activity.date}</td>
            <td><span class="status-tag ${activity.type}">${getActivityTypeLabel(activity.type)}</span></td>
            <td>${activity.description}</td>
            <td>${activity.user}</td>
            <td class="${activity.amount_type === 'negative' ? 'red-text' : 'green-text'}">
                ${activity.amount ? (activity.amount > 0 ? '+' : '') + '$' + Math.abs(activity.amount).toLocaleString() : '-'}
            </td>
        </tr>
    `).join('');
}

/**
 * Get activity type label in Arabic
 * @param {string} type - Activity type
 * @returns {string} - Arabic label
 */
function getActivityTypeLabel(type) {
    const labels = {
        'transfer': '<i class="fa-solid fa-check"></i> حوالة',
        'pending': '<i class="fa-solid fa-clock"></i> معلق',
        'employee': '<i class="fa-solid fa-user-plus"></i> موظف',
        'cancelled': '<i class="fa-solid fa-xmark"></i> ملغي',
        'office': '<i class="fa-solid fa-building"></i> مكتب'
    };
    return labels[type] || type;
}

/**
 * Search transfers
 */
async function searchTransfers() {
    const searchId = document.getElementById('transfer-search-id')?.value;
    const statusFilter = document.getElementById('transfer-status-filter')?.value;
    
    const filters = {};
    if (searchId) filters.search = searchId;
    if (statusFilter && statusFilter !== 'all') filters.status = statusFilter;
    
    const result = await getTransfers(filters);
    
    if (result.success) {
        updateTransfersTable(result.data, result.counts);
        showNotification(`تم العثور على ${result.count} حوالة`, 'success');
    } else {
        showNotification(result.message || 'فشل البحث', 'error');
    }
}

/**
 * Update transfers table
 * @param {Array} transfers - Transfers data
 * @param {Object} counts - Status counts
 */
function updateTransfersTable(transfers, counts) {
    const tbody = document.getElementById('transfers-table-body');
    if (!tbody) return;
    
    if (counts) {
        document.querySelector('[data-status="all"] .count').textContent = `(${counts.all})`;
        document.querySelector('[data-status="pending"] .count').textContent = `(${counts.pending})`;
        document.querySelector('[data-status="completed"] .count').textContent = `(${counts.completed})`;
        document.querySelector('[data-status="cancelled"] .count').textContent = `(${counts.cancelled})`;
    }
    
    tbody.innerHTML = transfers.map(transfer => `
        <tr>
            <td><strong>#${transfer.id}</strong></td>
            <td>${transfer.sender_name}<br><small>${transfer.sender_phone}</small></td>
            <td>${transfer.receiver_name}<br><small>${transfer.destination}</small></td>
            <td class="green-text">$${transfer.amount.toLocaleString()}</td>
            <td><span class="status-tag ${transfer.status}">${getStatusLabel(transfer.status)}</span></td>
            <td>${transfer.date}</td>
            <td>
                <button class="icon-btn" title="عرض التفاصيل"><i class="fa-solid fa-eye"></i></button>
                ${transfer.status === 'pending' ? `
                    <button class="icon-btn text-success" title="موافقة" onclick="approveTransfer(${transfer.id})"><i class="fa-solid fa-check"></i></button>
                    <button class="icon-btn text-danger" title="إلغاء" onclick="cancelTransfer(${transfer.id})"><i class="fa-solid fa-xmark"></i></button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function getStatusLabel(status) {
    const labels = {
        'pending': '<i class="fa-solid fa-clock"></i> معلقة',
        'completed': '<i class="fa-solid fa-check"></i> مكتملة',
        'cancelled': '<i class="fa-solid fa-xmark"></i> ملغية'
    };
    return labels[status] || status;
}

// ==========================================
// EXPORTS
// ==========================================

if (typeof window !== 'undefined') {
    window.apiRequest = apiRequest;
    window.getOffices = getOffices;
    window.createOffice = createOffice;
    window.updateOffice = updateOffice;
    window.deleteOffice = deleteOffice;
    window.getEmployees = getEmployees;
    window.createEmployee = createEmployee;
    window.updateEmployee = updateEmployee;
    window.deleteEmployee = deleteEmployee;
    window.getTransfers = getTransfers;
    window.approveTransfer = approveTransfer;
    window.cancelTransfer = cancelTransfer;
    window.getReportsSummary = getReportsSummary;
    window.getFinancialReports = getFinancialReports;
    window.getActivities = getActivities;
    window.getFundBoxData = getFundBoxData;
    window.createFundBoxTransaction = createFundBoxTransaction;
    window.fetchReportsData = fetchReportsData;
    window.searchTransfers = searchTransfers;
    window.updateTransfersTable = updateTransfersTable;
    window.updateActivitiesTable = updateActivitiesTable;
}
