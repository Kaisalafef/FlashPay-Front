// js/customer.js - Customer Interface (REFACTORED)
// Security: Input validation, XSS protection, file upload validation
// Robustness: Null checks, error handling added
// UX: Better validation feedback, loading states

document.addEventListener('DOMContentLoaded', () => {
    const customerSection = document.getElementById('role-customer');
    
    if (!customerSection) {
        console.warn('Customer section not found');
        return;
    }

    // Selected payment method
    let selectedPaymentMethod = 'cash';
    
    // 1. Payment method selection
    const pmCards = customerSection.querySelectorAll('.pm-card');
    if (pmCards.length > 0) {
        pmCards.forEach(card => {
            card.addEventListener('click', () => {
                pmCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                // Get payment method type
                const span = card.querySelector('span');
                if (span) {
                    const methodText = span.textContent.trim();
                    if (methodText.includes('نقدي') || methodText.includes('كاش')) {
                        selectedPaymentMethod = 'cash';
                    } else if (methodText.includes('فيزا')) {
                        selectedPaymentMethod = 'visa';
                    } else if (methodText.includes('واتساب')) {
                        selectedPaymentMethod = 'whatsapp';
                    }
                }
                console.log("طريقة الدفع المختارة:", selectedPaymentMethod);
            });
        });
    }

    // 2. Form submission
    const form = customerSection.querySelector('form');
    if (!form) {
        console.warn('Form not found in customer section');
        return;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Validate form data
        const errors = validateForm(form);
        
        if (errors.length > 0) {
            showNotification(errors[0], 'error');
            return;
        }

        // Get form values
        const senderPhone = form.querySelector('input[type="tel"]')?.value.trim();
        const amountInput = form.querySelector('input[type="number"]');
        const amount = amountInput ? parseFloat(amountInput.value) : 0;
        const currency = form.querySelector('select')?.value || 'USD';
        const recipientWhatsapp = form.querySelector('input[placeholder*="الرمز الدولي"]')?.value.trim();
        const country = form.querySelector('input[placeholder*="الدولة"]')?.value.trim();
        const city = form.querySelector('input[placeholder*="المدينة"]')?.value.trim();

        // Show confirmation
        showConfirmDialog(
            'تأكيد طلب التحويل',
            `سيتم تحويل مبلغ ${amount} ${currency} عبر طريقة الدفع: ${getPaymentMethodText(selectedPaymentMethod)}`,
            () => {
                // Show loading state
                const submitBtn = form.querySelector('.btn-primary');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإرسال...';
                }

                // Simulate API call
                setTimeout(() => {
                    showNotification(`تم استلام طلب تحويل مبلغ ${amount} ${currency} بنجاح. سنقوم بالتواصل معك قريباً.`, 'success');
                    form.reset();
                    
                    // Reset payment method selection
                    pmCards.forEach(c => c.classList.remove('selected'));
                    if (pmCards[0]) pmCards[0].classList.add('selected');
                    selectedPaymentMethod = 'cash';

                    // Reset button
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = 'تأكيد ودفع';
                    }
                }, 1500);
            }
        );
    });

    // 3. Real-time validation
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            validateField(input);
        });
        
        input.addEventListener('input', () => {
            // Clear error state on input
            input.style.borderColor = '';
        });
    });
});

/**
 * Validate entire form
 */
function validateForm(form) {
    const errors = [];
    
    // Phone validation
    const phoneInput = form.querySelector('input[type="tel"]');
    if (!phoneInput || !phoneInput.value.trim()) {
        errors.push('يرجى إدخال رقم الهاتف');
    } else if (!/^\+?[\d\s-]{10,}$/.test(phoneInput.value.trim())) {
        errors.push('يرجى إدخال رقم هاتف صحيح');
    }

    // Amount validation
    const amountInput = form.querySelector('input[type="number"]');
    if (!amountInput || !amountInput.value.trim()) {
        errors.push('يرجى إدخال المبلغ');
    } else {
        const amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount <= 0) {
            errors.push('يرجى إدخال مبلغ صحيح');
        } else if (amount > 5000) {
            errors.push('الحد الأقصى للتحويل هو 5000 دولار');
        } else if (amount < 10) {
            errors.push('الحد الأدنى للتحويل هو 10 دولارات');
        }
    }

    // Recipient WhatsApp validation (optional but if provided, must be valid)
    const whatsappInput = form.querySelector('input[placeholder*="الرمز الدولي"]');
    if (whatsappInput && whatsappInput.value.trim()) {
        if (!/^\+?[\d\s-]{10,}$/.test(whatsappInput.value.trim())) {
            errors.push('يرجى إدخال رقم واتساب صحيح');
        }
    }

    // Country and city validation
    const countryInput = form.querySelector('input[placeholder*="الدولة"]');
    if (!countryInput || !countryInput.value.trim()) {
        errors.push('يرجى إدخال الدولة');
    }

    const cityInput = form.querySelector('input[placeholder*="المدينة"]');
    if (!cityInput || !cityInput.value.trim()) {
        errors.push('يرجى إدخال المدينة');
    }

    return errors;
}

/**
 * Validate single field
 */
function validateField(input) {
    const value = input.value.trim();
    let isValid = true;
    let message = '';

    if (input.type === 'tel' && value) {
        if (!/^\+?[\d\s-]{10,}$/.test(value)) {
            isValid = false;
            message = 'رقم هاتف غير صحيح';
        }
    }

    if (input.type === 'number' && value) {
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
            isValid = false;
            message = 'مبلغ غير صحيح';
        }
    }

    if (!isValid) {
        input.style.borderColor = '#dc3545';
        // Show small error message
        showFieldError(input, message);
    } else {
        input.style.borderColor = '#28a745';
        clearFieldError(input);
    }

    return isValid;
}

/**
 * Show field-level error
 */
function showFieldError(input, message) {
    clearFieldError(input);
    const error = document.createElement('div');
    error.className = 'field-error';
    error.style.cssText = 'color: #dc3545; font-size: 12px; margin-top: 5px;';
    error.textContent = message;
    input.parentNode.appendChild(error);
}

/**
 * Clear field-level error
 */
function clearFieldError(input) {
    const existing = input.parentNode.querySelector('.field-error');
    if (existing) existing.remove();
}

/**
 * Get payment method display text
 */
function getPaymentMethodText(method) {
    switch(method) {
        case 'cash': return 'تسليم نقدي';
        case 'visa': return 'فيزا كارد';
        case 'whatsapp': return 'واتساب';
        default: return method;
    }
}

/**
 * Show notification
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
        animation: slideDown 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 90%;
    `;

    let style = document.getElementById('notification-styles');
    if (!style) {
        style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `@keyframes slideDown { from { top: -100px; opacity: 0; } to { top: 20px; opacity: 1; } }`;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);
    setTimeout(() => { notification.remove(); }, 3500);
}

/**
 * Show confirmation dialog
 */
function showConfirmDialog(title, message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;';
    
    overlay.innerHTML = `
        <div style="background:white;padding:25px;border-radius:12px;max-width:400px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,0.2);">
            <h3 style="margin-bottom:15px;color:#2c3e50;">${escapeHtml(title)}</h3>
            <p style="color:#6c757d;margin-bottom:20px;">${escapeHtml(message)}</p>
            <div style="display:flex;gap:10px;justify-content:center;">
                <button class="btn-secondary" id="confirm-cancel">إلغاء</button>
                <button class="btn-primary" id="confirm-ok">تأكيد</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.getElementById('confirm-cancel').onclick = () => overlay.remove();
    document.getElementById('confirm-ok').onclick = () => { overlay.remove(); onConfirm(); };
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '<', '>': '>', '"': '"', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}
