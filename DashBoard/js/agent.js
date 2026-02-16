// js/agent.js - Agent, error handling, and security improvements. Functionality (REFACTORED)
// ==========================================
// Security: Input validation, error handling added
// UX: Loading states, confirmation dialogs added
// Robustness: Null checks, proper form handling

const AgentManager = {
    // Transfer types
    transferType: 'cash', // cash, internal, visa
    
    init() {
        this.bindEvents();
        this.initTransferTypeTabs();
    },

    bindEvents() {
        const agentSection = document.getElementById('role-agent');
        if (!agentSection) {
            console.warn('Agent section not found');
            return;
        }

        // Submit button - using proper event listener
        const submitBtn = agentSection.querySelector('.btn-primary.full-width');
        if (!submitBtn) {
            console.warn('Submit button not found');
            return;
        }

        // Remove old listener and add new one
        const newSubmitBtn = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
        
        newSubmitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.processTransfer();
        });

        // Form input validation
        const inputs = agentSection.querySelectorAll('input[type="number"], input[type="text"]');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.validateForm();
            });
        });
    },

    initTransferTypeTabs() {
        const agentSection = document.getElementById('role-agent');
        if (!agentSection) return;

        const tabs = agentSection.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Update transfer type based on tab
                const tabText = tab.textContent.trim();
                if (tabText.includes('نقدي') || tabText.includes('تسليم نقدي')) {
                    this.transferType = 'cash';
                } else if (tabText.includes('داخلي') || tabText.includes('تحويل داخلي')) {
                    this.transferType = 'internal';
                } else if (tabText.includes('فيزا') || tabText.includes('فيزا كارد')) {
                    this.transferType = 'visa';
                }
                
                console.log('Transfer type changed to:', this.transferType);
            });
        });
    },

    validateForm() {
        const agentSection = document.getElementById('role-agent');
        if (!agentSection) return false;

        const inputs = agentSection.querySelectorAll('.transfer-form input[required], .transfer-form select[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
            }
        });

        // Check amount
        const amountInput = agentSection.querySelector('.transfer-form input[type="number"]');
        if (amountInput) {
            const amount = parseFloat(amountInput.value);
            if (isNaN(amount) || amount <= 0) {
                isValid = false;
            }
        }

        // Update button state
        const submitBtn = agentSection.querySelector('.btn-primary.full-width');
        if (submitBtn) {
            submitBtn.disabled = !isValid;
            submitBtn.style.opacity = isValid ? '1' : '0.5';
        }

        return isValid;
    },

    getFormData() {
        const agentSection = document.getElementById('role-agent');
        if (!agentSection) return null;

        const form = agentSection.querySelector('.transfer-form');
        if (!form) return null;

        const inputs = form.querySelectorAll('input, select');
        const data = {};

        inputs.forEach(input => {
            const label = form.querySelector(`label[for="${input.id}"]`) || 
                         input.previousElementSibling;
            const fieldName = label ? label.textContent.trim() : input.name || input.id;
            
            data[fieldName] = {
                value: input.value.trim(),
                valid: input.value.trim().length > 0
            };
        });

        return data;
    },

    validateTransferData(data) {
        const errors = [];

        // Get actual field values
        const senderPhone = document.querySelector('#role-agent .transfer-form input[placeholder*="+963"]');
        const recipientName = document.querySelector('#role-agent .transfer-form input[placeholder*="الاسم"]');
        const amountInput = document.querySelector('#role-agent .transfer-form input[type="number"]');
        const countrySelect = document.getElementById('country-selector');

        // Validate sender phone
        if (!senderPhone || !senderPhone.value.trim()) {
            errors.push('يرجى إدخال هاتف المرسل');
        } else if (!/^\+?[\d\s-]{10,}$/.test(senderPhone.value.trim())) {
            errors.push('يرجى إدخال هاتف المرسل بشكل صحيح');
        }

        // Validate recipient name
        if (!recipientName || !recipientName.value.trim()) {
            errors.push('يرجى إدخال اسم المستلم');
        } else if (recipientName.value.trim().length < 3) {
            errors.push('يرجى إدخال اسم المستلم بشكل صحيح (3 أحرف على الأقل)');
        }

        // Validate amount
        if (!amountInput || !amountInput.value.trim()) {
            errors.push('يرجى إدخال المبلغ');
        } else {
            const amount = parseFloat(amountInput.value);
            if (isNaN(amount) || amount <= 0) {
                errors.push('يرجى إدخال مبلغ صحيح');
            } else if (amount > 10000) {
                errors.push('الحد الأقصى للتحويل هو 10,000 دولار');
            } else if (amount < 10) {
                errors.push('الحد الأدنى للتحويل هو 10 دولارات');
            }
        }

        // Validate country
        if (!countrySelect || !countrySelect.value) {
            errors.push('يرجى اختيار الدولة');
        }

        return errors;
    },

    processTransfer() {
        // Get form data
        const data = this.getFormData();
        
        // Validate
        const errors = this.validateTransferData(data);
        if (errors.length > 0) {
            this.showNotification(errors[0], 'error');
            return;
        }

        // Get amount for balance check
        const amountInput = document.querySelector('#role-agent .transfer-form input[type="number"]');
        const amount = parseFloat(amountInput.value);
        
        // Get current balance
        const balanceEl = document.querySelector('.wallet-balance');
        
        // Show confirmation dialog
        this.showConfirmDialog(
            'تأكيد الحوالة',
            `سيتم تحويل مبلغ ${amount} دولار${this.getTransferTypeText()} إلى ${document.querySelector('#role-agent .transfer-form input[placeholder*="الاسم"]').value}`,
            () => {
                this.executeTransfer(amount, balanceEl);
            }
        );
    },

    getTransferTypeText() {
        switch(this.transferType) {
            case 'cash': return ' تسليم نقدي';
            case 'internal': return ' تحويل داخلي';
            case 'visa': return ' عبر فيزا كارد';
            default: return '';
        }
    },

    executeTransfer(amount, balanceEl) {
        // Show loading state
        this.setLoadingState(true);

        // Simulate API call
        setTimeout(() => {
            try {
                // Check and update balance
                if (balanceEl) {
                    let current = parseFloat(balanceEl.textContent.replace(/[$,,\s]/g, ''));
                    
                    if (isNaN(current)) {
                        throw new Error('خطأ في قراءة الرصيد');
                    }

                    // Check if sufficient balance
                    if (current < amount) {
                        this.showNotification('رصيد غير كافٍ في المحفظة', 'error');
                        this.setLoadingState(false);
                        return;
                    }

                    const newBalance = current - amount;
                    balanceEl.textContent = `$${newBalance.toLocaleString()}`;
                }

                // Generate transaction ID
                const transactionId = 'TRX-' + Math.random().toString(36).substr(2, 9).toUpperCase();
                
                this.showNotification(`تم إتمام الحوالة بنجاح! رقم المعاملة: ${transactionId}`, 'success');
                
                // Reset form
                this.resetForm();
                
            } catch (error) {
                console.error('Transfer error:', error);
                this.showNotification('حدث خطأ أثناء معالجة الحوالة', 'error');
            } finally {
                this.setLoadingState(false);
            }
        }, 1500); // Simulate network delay
    },

    setLoadingState(loading) {
        const agentSection = document.getElementById('role-agent');
        if (!agentSection) return;

        const submitBtn = agentSection.querySelector('.btn-primary.full-width');
        if (submitBtn) {
            if (loading) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري المعالجة...';
            } else {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'إتمام العملية';
            }
        }
    },

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelectorAll('.notification');
        existing.forEach(el => el.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 
                     type === 'error' ? 'exclamation-circle' : 'info-circle';
        
        notification.innerHTML = `
            <i class="fa-solid fa-${icon}"></i>
            <span>${this.escapeHtml(message)}</span>
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
            max-width: 90%;
        `;

        // Add animation styles
        let style = document.getElementById('notification-styles');
        if (!style) {
            style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideDown {
                    from { top: -100px; opacity: 0; }
                    to { top: 20px; opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Auto remove
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    showConfirmDialog(title, message, onConfirm) {
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
                <h3 style="margin-bottom: 15px; color: #2c3e50;">${this.escapeHtml(title)}</h3>
                <p style="color: #6c757d; margin-bottom: 20px;">${this.escapeHtml(message)}</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button class="btn-secondary" id="confirm-cancel">إلغاء</button>
                    <button class="btn-primary" id="confirm-ok" style="background: #0056b3;">تأكيد</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        document.getElementById('confirm-cancel').onclick = () => overlay.remove();
        document.getElementById('confirm-ok').onclick = () => {
            overlay.remove();
            onConfirm();
        };
    },

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '<',
            '>': '>',
            '"': '"',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    },

    resetForm() {
        const agentSection = document.getElementById('role-agent');
        if (!agentSection) return;

        const form = agentSection.querySelector('.transfer-form');
        if (form) {
            form.reset();
        }
        
        // Reset validation state
        this.validateForm();
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => AgentManager.init());
