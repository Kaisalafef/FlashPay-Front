/**
 * Authentication Utilities
 * ==========================
 * Shared authentication helper functions
 * NOTE: Role management is now handled by rbac.js
 */

// ==========================================
// UTILITY FUNCTIONS (Security: XSS Protection)
// ==========================================

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '<', '>': '>', '"': '"', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Sanitize input string
 */
function sanitizeInput(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ==========================================
// NOTIFICATION SYSTEM
// ==========================================

/**
 * Show notification to user
 * This is the canonical version used across the application
 */
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelectorAll('.notification');
    existing.forEach(el => el.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    
    notification.innerHTML = `<i class="fa-solid fa-${icon}"></i><span>${escapeHtml(message)}</span>`;

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
        font-family: 'Cairo', sans-serif;
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
// CONFIRMATION DIALOG
// ==========================================

/**
 * Show confirmation dialog
 */
function showConfirmDialog(title, message, onConfirm, onCancel = null) {
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
            font-family: 'Cairo', sans-serif;
        ">
            <h3 style="margin-bottom: 15px; color: #2c3e50;">${escapeHtml(title)}</h3>
            <p style="color: #6c757d; margin-bottom: 20px;">${escapeHtml(message)}</p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button class="btn-secondary" id="confirm-cancel" style="
                    padding: 10px 20px;
                    border: 1px solid #ddd;
                    background: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-family: 'Cairo', sans-serif;
                ">إلغاء</button>
                <button class="btn-primary" id="confirm-ok" style="
                    padding: 10px 20px;
                    border: none;
                    background: #dc3545;
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-family: 'Cairo', sans-serif;
                ">تأكيد</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('confirm-cancel').onclick = () => {
        overlay.remove();
        if (onCancel) onCancel();
    };
    
    document.getElementById('confirm-ok').onclick = () => {
        onConfirm();
        overlay.remove();
    };
}

// ==========================================
// BUTTON LOADING STATES
// ==========================================

/**
 * Set button loading state
 */
function setButtonLoading(button, isLoading, loadingText = 'جاري الحفظ...') {
    if (!button) return;
    
    if (isLoading) {
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${loadingText}`;
        button.disabled = true;
    } else {
        button.innerHTML = button.dataset.originalText || 'حفظ';
        button.disabled = false;
    }
}

// ==========================================
// FORM VALIDATION HELPERS
// ==========================================

/**
 * Show field error
 */
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`);
    
    if (field) {
        field.classList.add('error');
        field.classList.remove('valid');
    }
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

/**
 * Clear field error
 */
function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`);
    
    if (field) {
        field.classList.remove('error');
        field.classList.add('valid');
    }
    
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

/**
 * Clear all field errors in a form
 */
function clearAllFieldErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const fields = form.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
        field.classList.remove('error', 'valid');
        const errorElement = document.getElementById(`${field.id}-error`);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    });
}

// ==========================================
// EXPORTS
// ==========================================

if (typeof window !== 'undefined') {
    window.escapeHtml = escapeHtml;
    window.sanitizeInput = sanitizeInput;
    window.showNotification = showNotification;
    window.showConfirmDialog = showConfirmDialog;
    window.setButtonLoading = setButtonLoading;
    window.showFieldError = showFieldError;
    window.clearFieldError = clearFieldError;
    window.clearAllFieldErrors = clearAllFieldErrors;
}
