/**
 * Employee Management Form
 * =========================================
 * API-Ready Form for Employee Creation with Full Validation
 * 
 * Role-Based Conditional Logic:
 * - Agent (مندوب): Shows Country/City selection (REQUIRED), Hides Office
 * - Other roles (Manager, Cashier, etc.): Shows Office (REQUIRED), Hides Country/City
 * 
 * API Endpoint: POST /api/employees
 * Content-Type: application/json
 */

// Validation Rules with Arabic Error Messages
const VALIDATION_RULES = {
    name: {
        required: true,
        minLength: 3,
        maxLength: 50,
        pattern: /^[\u0600-\u06FFa-zA-Z\s]{3,50}$/,
        message: 'يرجى إدخال اسم الموظف (3-50 حرف، حروف فقط)'
    },
    email: {
        required: false,
        validateIfProvided: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'يرجى إدخال بريد إلكتروني صحيح (مثال: name@example.com)'
    },
    password: {
        required: false,
        validateIfProvided: true,
        minLength: 8,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل، وتحتوي على حرف كبير وحرف صغير ورقم ورمز خاص (@$!%*?&)'
    },
    phone: {
        required: true,
        pattern: /^\+?[0-9]{10,15}$/,
        message: 'يرجى إدخال رقم هاتف صحيح (10-15 رقم، يمكن أن يبدأ بـ +)'
    },
    role: {
        required: true,
        message: 'يرجى اختيار نوع الموظف'
    },
    country: {
        requiredForAgent: true,
        message: 'يرجى اختيار الدولة (إلزامي للمندوب)'
    },
    city: {
        requiredForAgent: true,
        message: 'يرجى اختيار المدينة (إلزامي للمندوب)'
    },
    office: {
        requiredForNonAgent: true,
        message: 'يرجى اختيار المكتب (إلزامي لغير المندوبين)'
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initEmployeeForm();
    initFieldValidation();
});

/**
 * Initialize field-level validation
 * Adds real-time validation to form fields
 */
function initFieldValidation() {
    const fields = [
        { id: 'emp-name', rule: 'name', event: 'blur' },
        { id: 'emp-email', rule: 'email', event: 'blur' },
        { id: 'emp-password', rule: 'password', event: 'blur' },
        { id: 'emp-phone', rule: 'phone', event: 'blur' },
        { id: 'emp-type', rule: 'role', event: 'change' }
    ];

    fields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
            element.addEventListener(field.event, function() {
                validateField(this, VALIDATION_RULES[field.rule]);
            });
        }
    });
}

/**
 * Validate a single field and show/hide error message
 * @param {HTMLElement} field - The form field element
 * @param {Object} rule - Validation rule object
 * @returns {boolean} - True if valid, false otherwise
 */
function validateField(field, rule) {
    const value = field.value.trim();
    const errorElement = document.getElementById(`${field.id}-error`);
    let isValid = true;
    let errorMessage = '';

    // Check if field is empty
    if (!value) {
        if (rule.required) {
            isValid = false;
            errorMessage = rule.message;
        } else if (rule.validateIfProvided) {
            // Field is optional and empty - valid
            isValid = true;
        }
    } else {
        // Field has value - validate it
        if (rule.minLength && value.length < rule.minLength) {
            isValid = false;
            errorMessage = rule.message;
        } else if (rule.maxLength && value.length > rule.maxLength) {
            isValid = false;
            errorMessage = rule.message;
        } else if (rule.pattern && !rule.pattern.test(value)) {
            isValid = false;
            errorMessage = rule.message;
        }
    }

    // Show/hide error message
    if (errorElement) {
        errorElement.textContent = isValid ? '' : errorMessage;
        errorElement.style.display = isValid ? 'none' : 'block';
    }

    // Add/remove error styling
    if (isValid) {
        field.classList.remove('error');
        field.classList.add('valid');
    } else {
        field.classList.add('error');
        field.classList.remove('valid');
    }

    return isValid;
}

/**
 * Clear all field errors
 */
function clearAllFieldErrors() {
    const errorElements = document.querySelectorAll('.field-error');
    errorElements.forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });

    const fields = document.querySelectorAll('#employee-form input, #employee-form select, #employee-form textarea');
    fields.forEach(field => {
        field.classList.remove('error', 'valid');
    });
}

/**
 * Initialize the Employee Form
 */
function initEmployeeForm() {
    const countrySelect = document.getElementById('emp-country');
    const governorateSelect = document.getElementById('emp-governorate');
    const citySelect = document.getElementById('emp-city');
    const officeSection = document.getElementById('emp-office-section');
    const officeSelect = document.getElementById('emp-office');
    const roleSelect = document.getElementById('emp-type');
    const form = document.getElementById('employee-form');
    
    if (!form) {
        console.error('Employee form not found');
        return;
    }
    
    // Populate countries if element exists
    if (countrySelect) {
        populateCountries(countrySelect);
        
        countrySelect.addEventListener('change', function() {
            handleEmployeeCountryChange(this.value);
            // Clear country error if exists
            const errorEl = document.getElementById('emp-country-error');
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.style.display = 'none';
            }
        });
    }
    
    if (governorateSelect) {
        governorateSelect.addEventListener('change', function() {
            handleEmployeeGovernorateChange(this.value);
        });
    }
    
    if (citySelect) {
        citySelect.addEventListener('change', function() {
            handleEmployeeCityChange(this.value);
            // Clear city error if exists
            const errorEl = document.getElementById('emp-city-error');
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.style.display = 'none';
            }
        });
    }
    
    // Role change listener for conditional logic
    if (roleSelect) {
        roleSelect.addEventListener('change', function() {
            handleRoleChange(this.value);
            // Clear role error if exists
            const errorEl = document.getElementById('emp-type-error');
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.style.display = 'none';
            }
        });
    }

    // Office change listener to clear error
    if (officeSelect) {
        officeSelect.addEventListener('change', function() {
            const errorEl = document.getElementById('emp-office-error');
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.style.display = 'none';
            }
        });
    }
    
    // Form submission
    form.addEventListener('submit', handleEmployeeSubmit);
}

/**
 * Handle role selection change
 * - If Agent: Hide office selection, show country/city for zone selection (REQUIRED)
 * - If other roles: Show office selection (REQUIRED), hide country/city
 */
function handleRoleChange(role) {
    const officeSection = document.getElementById('emp-office-section');
    const officeSelect = document.getElementById('emp-office');
    const countryGroup = document.getElementById('emp-country-group');
    const countrySelect = document.getElementById('emp-country');
    const governorateGroup = document.getElementById('emp-governorate-group');
    const cityGroup = document.getElementById('emp-city-group');
    const citySelect = document.getElementById('emp-city');
    
    const isAgent = role === 'agent';
    
    if (isAgent) {
        // Agent: Show country/city for zone selection (REQUIRED), hide office
        if (officeSection) {
            officeSection.style.display = 'none';
            if (officeSelect) {
                officeSelect.required = false;
                officeSelect.value = '';
            }
        }
        
        // Show country/city selection
        if (countryGroup) {
            countryGroup.style.display = 'flex';
        }
        if (countrySelect) {
            countrySelect.required = true;
        }
        if (cityGroup) {
            cityGroup.style.display = 'flex';
        }
        if (governorateGroup) {
            governorateGroup.style.display = 'flex';
        }
    } else {
        // Non-Agent roles: Show office (REQUIRED), hide country/city
        if (officeSection) {
            officeSection.style.display = 'block';
            if (officeSelect) {
                officeSelect.required = true;
            }
        }
        
        // Hide country/city selection (office location dictates zone)
        if (countryGroup) {
            countryGroup.style.display = 'none';
        }
        if (countrySelect) {
            countrySelect.required = false;
            countrySelect.value = '';
        }
        if (governorateGroup) {
            governorateGroup.style.display = 'none';
        }
        if (cityGroup) {
            cityGroup.style.display = 'none';
        }
        if (citySelect) {
            citySelect.value = '';
        }
    }
}

/**
 * Populate countries dropdown
 */
function populateCountries(selectElement) {
    if (!selectElement) return;
    
    const countries = getCountries();
    
    selectElement.innerHTML = '<option value="" disabled selected>اختر الدولة...</option>';
    
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.id;
        option.textContent = country.name;
        option.dataset.isSyria = country.is_syria;
        selectElement.appendChild(option);
    });
}

/**
 * Handle country selection change (for Agent role)
 * - Only applies when role is Agent
 * - If Syria: Show Governorate and City
 * - If outside Syria: Show City only (no governorate)
 */
function handleEmployeeCountryChange(countryId) {
    const roleSelect = document.getElementById('emp-type');
    const isAgent = roleSelect?.value === 'agent';
    
    // Only process if role is Agent
    if (!isAgent) return;
    
    const isSyrian = isSyria(parseInt(countryId));
    
    // Get elements
    const governorateGroup = document.getElementById('emp-governorate-group');
    const cityGroup = document.getElementById('emp-city-group');
    const governorateSelect = document.getElementById('emp-governorate');
    const citySelect = document.getElementById('emp-city');
    
    if (isSyrian) {
        // Show Syria-specific fields
        if (governorateGroup) governorateGroup.style.display = 'block';
        if (cityGroup) cityGroup.style.display = 'block';
        
        // Populate governorates
        if (governorateSelect) {
            populateGovernorates(governorateSelect, 1); // 1 = Syria
        }
        
        // Reset city
        if (citySelect) {
            citySelect.innerHTML = '<option value="" disabled selected>اختر المحافظة أولاً...</option>';
        }
    } else {
        // For non-Syria countries
        if (governorateGroup) governorateGroup.style.display = 'none';
        if (cityGroup) cityGroup.style.display = 'block';
        
        // Populate cities for the selected country (no governorate)
        if (citySelect) {
            populateCitiesByCountry(citySelect, countryId);
        }
    }
}

/**
 * Handle governorate selection change (for Agent role in Syria)
 */
function handleEmployeeGovernorateChange(governorateId) {
    const citySelect = document.getElementById('emp-city');
    
    if (citySelect && governorateId) {
        populateCitiesByGovernorate(citySelect, governorateId);
    }
}

/**
 * Handle city selection change (for non-Agent roles in Syria)
 * - Populate offices for the selected city
 */
function handleEmployeeCityChange(cityId) {
    const roleSelect = document.getElementById('emp-type');
    const isAgent = roleSelect?.value === 'agent';
    const officeSelect = document.getElementById('emp-office');
    
    // Only populate offices for non-Agent roles
    if (isAgent || !officeSelect || !cityId) return;
    
    populateOfficesByCity(officeSelect, cityId);
}

/**
 * Populate governorates dropdown (Syria only)
 */
function populateGovernorates(selectElement, countryId) {
    if (!selectElement) return;
    
    const governorates = getGovernorates(countryId);
    
    selectElement.innerHTML = '<option value="" disabled selected>اختر المحافظة...</option>';
    
    governorates.forEach(gov => {
        const option = document.createElement('option');
        option.value = gov.id;
        option.textContent = gov.name;
        selectElement.appendChild(option);
    });
}

/**
 * Populate cities by governorate (Syria)
 */
function populateCitiesByGovernorate(selectElement, governorateId) {
    if (!selectElement) return;
    
    const cities = getCitiesByGovernorate(parseInt(governorateId));
    
    selectElement.innerHTML = '<option value="" disabled selected>اختر المدينة...</option>';
    
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city.id;
        option.textContent = city.name;
        selectElement.appendChild(option);
    });
}

/**
 * Populate cities by country (International)
 */
function populateCitiesByCountry(selectElement, countryId) {
    if (!selectElement) return;
    
    const cities = getCitiesByCountry(parseInt(countryId));
    
    selectElement.innerHTML = '<option value="" disabled selected>اختر المدينة...</option>';
    
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city.id;
        option.textContent = city.name;
        selectElement.appendChild(option);
    });
}

/**
 * Populate offices by city (Syria only)
 */
function populateOfficesByCity(selectElement, cityId) {
    if (!selectElement) return;
    
    const offices = getOfficesByCity(parseInt(cityId));
    
    selectElement.innerHTML = '<option value="" disabled selected>اختر المكتب...</option>';
    
    if (offices.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'لا توجد مكاتب في هذه المدينة';
        option.disabled = true;
        selectElement.appendChild(option);
        return;
    }
    
    offices.forEach(office => {
        const option = document.createElement('option');
        option.value = office.id;
        option.textContent = office.name;
        selectElement.appendChild(option);
    });
}

/**
 * Handle employee form submission - Full API Integration
 * Sends JSON payload to /api/employees endpoint with loading states
 */
async function handleEmployeeSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Validate and prepare data
    const apiPayload = validateAndPrepareEmployeeForm();
    
    if (!apiPayload) return; // Validation failed
    
    // Set loading state
    setButtonLoading(submitBtn, true, 'جاري الحفظ...');
    
    try {
        // API Integration - Production Ready
        const response = await fetch('/api/employees', {
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
                handleApiErrors(result.errors);
            }
            throw new Error(result.message || 'فشل في إضافة الموظف');
        }
        
        // Success
        showNotification('تم حفظ بيانات الموظف بنجاح!', 'success');
        
        // Close modal and refresh
        const modal = document.getElementById('employee-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        const form = document.getElementById('employee-form');
        if (form) form.reset();
        
        // Reset form sections visibility
        resetFormSections();
        
        // Refresh employees table if function exists
        if (typeof refreshEmployeesTable === 'function') {
            refreshEmployeesTable();
        }
        
    } catch (error) {
        console.error('Employee creation error:', error);
        showNotification(`خطأ: ${error.message}`, 'error');
    } finally {
        // Reset loading state
        setButtonLoading(submitBtn, false);
    }
}

/**
 * Validate and prepare employee form data for API
 * Returns API-ready payload or null if validation fails
 * Shows field-level error messages in Arabic
 */
function validateAndPrepareEmployeeForm() {
    clearAllFieldErrors();
    
    const name = document.getElementById('emp-name')?.value.trim();
    const phone = document.getElementById('emp-phone')?.value.trim();
    const role = document.getElementById('emp-type')?.value;
    const email = document.getElementById('emp-email')?.value.trim();
    const password = document.getElementById('emp-password')?.value;
    const hireDate = document.getElementById('emp-hire-date')?.value;
    const salary = document.getElementById('emp-salary')?.value;
    const notes = document.getElementById('emp-notes')?.value.trim();
    
    let hasErrors = false;
    
    // Validate name
    if (!name || name.length < 3 || !/^[\u0600-\u06FFa-zA-Z\s]{3,50}$/.test(name)) {
        showFieldError('emp-name', VALIDATION_RULES.name.message);
        hasErrors = true;
    }
    
    // Validate phone
    if (!phone || !/^\+?[0-9]{10,15}$/.test(phone.replace(/\s/g, ''))) {
        showFieldError('emp-phone', VALIDATION_RULES.phone.message);
        hasErrors = true;
    }
    
    // Validate email (if provided)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFieldError('emp-email', VALIDATION_RULES.email.message);
        hasErrors = true;
    }
    
    // Validate password (if provided)
    if (password && password.length > 0) {
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
            showFieldError('emp-password', VALIDATION_RULES.password.message);
            hasErrors = true;
        }
    }
    
    // Validate role
    if (!role) {
        showFieldError('emp-type', VALIDATION_RULES.role.message);
        hasErrors = true;
    }
    
    if (hasErrors) {
        showNotification('يرجى تصحيح الأخطاء أعلاه قبل المتابعة', 'error');
        return null;
    }
    
    const isAgent = role === 'agent';
    
    // Prepare base API payload
    const apiPayload = {
        name: name,
        phone: phone,
        role: role,
        email: email || null,
        password: password || null,
        hire_date: hireDate || null,
        salary: salary ? parseFloat(salary) : null,
        notes: notes || null,
        is_active: true
    };
    
    if (isAgent) {
        // Agent: Must have country/city for zone selection
        const countryId = document.getElementById('emp-country')?.value;
        const cityId = document.getElementById('emp-city')?.value;
        
        let agentHasErrors = false;
        
        if (!countryId) {
            showFieldError('emp-country', VALIDATION_RULES.country.message);
            agentHasErrors = true;
        }
        
        if (!cityId) {
            showFieldError('emp-city', VALIDATION_RULES.city.message);
            agentHasErrors = true;
        }
        
        if (agentHasErrors) {
            showNotification('يرجى اختيار الدولة والمدينة للمندوب', 'error');
            return null;
        }
        
        apiPayload.country_id = parseInt(countryId);
        apiPayload.city_id = parseInt(cityId);
        apiPayload.office_id = null; // No office for agents
        
        const isSyrian = isSyria(parseInt(countryId));
        if (isSyrian) {
            const governorateId = document.getElementById('emp-governorate')?.value;
            if (governorateId) {
                apiPayload.governorate_id = parseInt(governorateId);
            }
        }
    } else {
        // Non-Agent roles: Must have office assignment
        const officeId = document.getElementById('emp-office')?.value;
        
        if (!officeId) {
            showFieldError('emp-office', VALIDATION_RULES.office.message);
            showNotification('يرجى اختيار المكتب (إلزامي لغير المندوبين)', 'error');
            return null;
        }
        
        apiPayload.office_id = parseInt(officeId);
        apiPayload.country_id = null;
        apiPayload.city_id = null;
        apiPayload.governorate_id = null;
    }
    
    return apiPayload;
}

/**
 * Show error message below a specific field
 * @param {string} fieldId - The field ID
 * @param {string} message - Error message in Arabic
 */
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}-error`);
    
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
 * Handle API errors and display them on form fields
 * @param {Object} errors - Error object from API
 */
function handleApiErrors(errors) {
    if (!errors) return;
    
    const fieldMapping = {
        'name': 'emp-name',
        'phone': 'emp-phone',
        'email': 'emp-email',
        'password': 'emp-password',
        'role': 'emp-type',
        'country_id': 'emp-country',
        'city_id': 'emp-city',
        'office_id': 'emp-office',
        'governorate_id': 'emp-governorate'
    };
    
    Object.keys(errors).forEach(field => {
        const fieldId = fieldMapping[field] || field;
        showFieldError(fieldId, errors[field]);
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
        button.innerHTML = button.dataset.originalText || 'حفظ الموظف';
        button.disabled = false;
    }
}

/**
 * Reset form sections to initial state
 */
function resetFormSections() {
    const countryGroup = document.getElementById('emp-country-group');
    const governorateGroup = document.getElementById('emp-governorate-group');
    const cityGroup = document.getElementById('emp-city-group');
    const officeSection = document.getElementById('emp-office-section');
    
    if (countryGroup) countryGroup.style.display = 'none';
    if (governorateGroup) governorateGroup.style.display = 'none';
    if (cityGroup) cityGroup.style.display = 'none';
    if (officeSection) officeSection.style.display = 'none';
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.initEmployeeForm = initEmployeeForm;
    window.validateAndPrepareEmployeeForm = validateAndPrepareEmployeeForm;
    window.handleRoleChange = handleRoleChange;
    window.showFieldError = showFieldError;
    window.clearAllFieldErrors = clearAllFieldErrors;
    window.handleApiErrors = handleApiErrors;
    window.setButtonLoading = setButtonLoading;
}
