/**
 * Office Management Form
 * =======================
 * API-Ready Form for Office Creation
 * 
 * API Endpoint: POST /api/offices
 * Content-Type: application/json
 */

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initOfficeForm();
});

/**
 * Initialize the Office Form
 */
function initOfficeForm() {
    const governorateSelect = document.getElementById('office-governorate');
    const citySelect = document.getElementById('office-city');
    const saveBtn = document.getElementById('save-office-btn');
    
    // Populate governorates
    if (governorateSelect) {
        populateGovernorates(governorateSelect, 1); // 1 = Syria
        
        governorateSelect.addEventListener('change', function() {
            handleGovernorateChange(this.value);
        });
    }
    
    // Save button click handler
    if (saveBtn) {
        saveBtn.addEventListener('click', handleOfficeSubmit);
    }
}

/**
 * Handle governorate selection change
 */
function handleGovernorateChange(governorateId) {
    const citySelect = document.getElementById('office-city');
    
    if (citySelect && governorateId) {
        populateCitiesByGovernorate(citySelect, governorateId);
    }
}

/**
 * Handle office form submission - Full API Integration
 */
async function handleOfficeSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('save-office-btn');
    
    // Validate and prepare data
    const apiPayload = validateAndPrepareOfficeForm();
    
    if (!apiPayload) return; // Validation failed
    
    // Set loading state
    setButtonLoading(submitBtn, true, 'جاري الحفظ...');
    
    try {
        // API Integration - Production Ready
        const response = await fetch('/api/offices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
            },
            body: JSON.stringify(apiPayload)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            // Handle validation errors from server
            if (result.errors) {
                handleOfficeApiErrors(result.errors);
            }
            throw new Error(result.message || 'فشل في إضافة المكتب');
        }
        
        // Success
        showNotification('تم حفظ بيانات المكتب بنجاح!', 'success');
        
        // Reset form
        const form = document.getElementById('office-form');
        if (form) form.reset();
        
        // Refresh offices table if function exists
        if (typeof refreshOfficesTable === 'function') {
            refreshOfficesTable();
        }
        
        // Clear data cache
        if (typeof clearDataCache === 'function') {
            clearDataCache('offices');
        }
        
    } catch (error) {
        console.error('Office creation error:', error);
        showNotification(`خطأ: ${error.message}`, 'error');
    } finally {
        // Reset loading state
        setButtonLoading(submitBtn, false);
    }
}

/**
 * Validate and prepare office form data for API
 * Returns API-ready payload or null if validation fails
 */
function validateAndPrepareOfficeForm() {
    // Clear previous errors
    clearOfficeFieldErrors();
    
    const name = document.getElementById('office-name')?.value.trim();
    const governorateId = document.getElementById('office-governorate')?.value;
    const cityId = document.getElementById('office-city')?.value;
    const phone = document.getElementById('office-phone')?.value.trim();
    const openingPrice = document.getElementById('office-opening-price')?.value;
    
    let hasErrors = false;
    const errors = {};
    
    // Validate name
    if (!name || name.length < 3) {
        errors.name = 'يرجى إدخال اسم المكتب (3 أحرف على الأقل)';
        showOfficeFieldError('office-name', errors.name);
        hasErrors = true;
    }
    
    // Validate governorate
    if (!governorateId) {
        errors.governorate_id = 'يرجى اختيار المحافظة';
        showOfficeFieldError('office-governorate', errors.governorate_id);
        hasErrors = true;
    }
    
    // Validate city
    if (!cityId) {
        errors.city_id = 'يرجى اختيار المدينة';
        showOfficeFieldError('office-city', errors.city_id);
        hasErrors = true;
    }
    
    // Validate phone
    if (!phone || phone.length < 8) {
        errors.phone = 'يرجى إدخال رقم هاتف صحيح (8 أرقام على الأقل)';
        showOfficeFieldError('office-phone', errors.phone);
        hasErrors = true;
    }
    
    // Validate opening price
    if (!openingPrice || isNaN(openingPrice) || parseFloat(openingPrice) < 0) {
        errors.opening_price = 'يرجى إدخال سعر افتتاح صحيح';
        showOfficeFieldError('office-opening-price', errors.opening_price);
        hasErrors = true;
    }
    
    if (hasErrors) {
        showNotification('يرجى تصحيح الأخطاء أعلاه قبل المتابعة', 'error');
        return null;
    }
    
    // Prepare API payload
    return {
        name: name,
        governorate_id: parseInt(governorateId),
        city_id: parseInt(cityId),
        phone: phone,
        opening_price: parseFloat(openingPrice)
    };
}

/**
 * Show error message below a specific field
 * @param {string} fieldId - The field ID
 * @param {string} message - Error message in Arabic
 */
function showOfficeFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    
    // Create error element if it doesn't exist
    let errorElement = document.getElementById(`${fieldId}-error`);
    if (!errorElement) {
        errorElement = document.createElement('span');
        errorElement.id = `${fieldId}-error`;
        errorElement.className = 'field-error';
        if (field && field.parentNode) {
            field.parentNode.appendChild(errorElement);
        }
    }
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    if (field) {
        field.classList.add('error');
        field.classList.remove('valid');
    }
}

/**
 * Clear all field errors in office form
 */
function clearOfficeFieldErrors() {
    const errorElements = document.querySelectorAll('#office-form .field-error');
    errorElements.forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });

    const fields = document.querySelectorAll('#office-form input, #office-form select');
    fields.forEach(field => {
        field.classList.remove('error', 'valid');
    });
}

/**
 * Handle API errors for office form
 * @param {Object} errors - Error object from API
 */
function handleOfficeApiErrors(errors) {
    if (!errors) return;
    
    const fieldMapping = {
        'name': 'office-name',
        'governorate_id': 'office-governorate',
        'city_id': 'office-city',
        'phone': 'office-phone',
        'opening_price': 'office-opening-price'
    };
    
    Object.keys(errors).forEach(field => {
        const fieldId = fieldMapping[field] || field;
        showOfficeFieldError(fieldId, errors[field]);
    });
}

/**
 * Set button loading state
 * @param {HTMLButtonElement} button - Button element
 * @param {boolean} isLoading - Loading state
 * @param {string} loadingText - Text to show while loading
 */
function setButtonLoading(button, isLoading, loadingText = 'جاري الحفظ...') {
    if (!button) return;
    
    if (isLoading) {
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${loadingText}`;
        button.disabled = true;
    } else {
        button.innerHTML = button.dataset.originalText || 'حفظ المكتب الجديد';
        button.disabled = false;
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.initOfficeForm = initOfficeForm;
    window.handleOfficeSubmit = handleOfficeSubmit;
    window.validateAndPrepareOfficeForm = validateAndPrepareOfficeForm;
    window.showOfficeFieldError = showOfficeFieldError;
    window.clearOfficeFieldErrors = clearOfficeFieldErrors;
    window.handleOfficeApiErrors = handleOfficeApiErrors;
}
