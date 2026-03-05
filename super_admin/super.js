const API_URL = 'http://127.0.0.1:8000/api';


/* =========================
   Auth Check
========================= */

async function checkAuth() {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        window.location.href = '../login/login.html';
        return null;
    }

    try {
        const res = await fetch(`${API_URL}/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        // التوكن غير صالح (بعد migrate:fresh مثلاً)
        if (!res.ok) {
            localStorage.clear();
            window.location.href = '/FlashPay-Front/login/login.html';
            return null;
        }

        return token;

    } catch (e) {
        localStorage.clear();
        window.location.href = '/FlashPay-Front/login/login.html';
        return null;
    }
}
/* =========================
   Helpers
========================= */
function getHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}
async function fetchCurrencies() {
    try {
        const res = await fetch(`${API_URL}/currencies`, {
            headers: getHeaders()
        });

        console.log("Currencies status:", res.status);

        if (res.status === 401) {
            localStorage.clear();
            window.location.href = '/FlashPay-Front/login/login.html';
            return [];
        }

        const json = await res.json();
        console.log("Currencies RAW:", json);

        return Array.isArray(json) ? json : (json.data ?? []);

    } catch (error) {
        console.error("Currencies Fetch Error:", error);
        return [];
    }
}
async function loadCurrencies() {
    const currencies = await fetchCurrencies();
    
    // Add the console.log here so you can see the data!
    console.log("Fetched currencies:", currencies); 
    
    const select = document.getElementById("currency-select");
    if (!select) return;

    select.innerHTML = `<option value="">اختر العملة</option>`;

   currencies.forEach(currency => {

    if (currency.code === 'USD') return; // اخفاء الدولار

    const option = document.createElement("option");
    option.value = currency.id;
    option.textContent = currency.name;
    select.appendChild(option);
});
}
function fillSelect(select, data, placeholder = "اختر من القائمة") {
    if (!select) return;

    select.innerHTML = `<option value="">${placeholder}</option>`;
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name || item.code;
        select.appendChild(option);
    });
}

async function loadSafes() {
    const tbody = document.getElementById('safes-table-body');
    if (!tbody) return;

    try {
        const res = await fetch(`${API_URL}/safes`, {
            headers: getHeaders()
        });

        const json = await res.json();

     const sortedSafes = json.data.sort((a, b) =>
  (a.owner || '').localeCompare(b.owner || '')
);

        tbody.innerHTML = '';

        // 2️⃣ استخدم sortedSafes بدل json.data
        sortedSafes.forEach((safe, index) => {
            let typeLabel = '';

            switch (safe.type) {
                case 'office_main':
                    typeLabel = 'صندوق مكتب';
                    break;
                case 'agent_main':
                    typeLabel = 'صندوق مندوب';
                    break;
                case 'trading':
                    typeLabel = ' صندوق مبيعات المكتب';
                    break;
            }

           tbody.innerHTML += `
    <tr>
        <td>${index + 1}</td>
        <td>${typeLabel}</td>
        <td>${safe.owner}</td>
        <td>${safe.currency ?? '-'}</td>
        <td>$${parseFloat(safe.balance).toFixed(2)}</td>
        <td>${safe.cost ?? '-'}</td>
        <td>
            <button class="safes-view-btn" onclick='openSafeDetails(${JSON.stringify(safe)})'>
                <i class="fa-solid fa-eye"></i> عرض
            </button>
        </td>
    </tr>
`;

        });

    } catch (e) {
        console.error(e);
    }
}

function openSafeDetails(safe) {
    document.getElementById("detail-type").textContent = safe.type;
    document.getElementById("detail-owner").textContent = safe.owner;
    document.getElementById("detail-currency").textContent = safe.currency ?? "-";
    document.getElementById("detail-balance").textContent = "$" + parseFloat(safe.balance).toFixed(2);
    document.getElementById("detail-cost").textContent = safe.cost ?? "-";

    document.getElementById("safe-details-modal").classList.remove("hidden");
}

function closeSafeDetails() {
    document.getElementById("safe-details-modal").classList.add("hidden");
}

/* =========================
   API Calls
========================= */
async function fetchCountries() {
    try {
        const res = await fetch(`${API_URL}/countries`, {
            headers: getHeaders()
        });

        console.log("Countries status:", res.status);

        const json = await res.json();
        console.log("Countries response:", json);

        return json.data || json || [];
    } catch (error) {
        console.error("Error fetching countries:", error);
        return [];
    }
}
async function fetchCitiesByCountry(countryId) {
    try {
        const res = await fetch(`${API_URL}/cities?country_id=${countryId}`, {
            headers: getHeaders()
        });

        if (!res.ok) {
            console.error("HTTP Error:", res.status);
            return [];
        }

        const json = await res.json();
        console.log("Cities:", json); // للتأكد

        return json.data || [];
    } catch (error) {
        console.error("Error fetching cities:", error);
        return [];
    }
}
/* =========================
   Init Office Cities
========================= */
async function initOfficeCities() {
    const citySelect = document.getElementById('office-city-select');
    const cities = await fetchCitiesByCountry(1); // سوريا
    console.log("Office Cities:", cities); // للتأكد
    fillSelect(citySelect, cities, "اختر المدينة");
}

/* =========================
   Init Agent Location
========================= */
async function initAgentLocation() {
    const countrySelect = document.getElementById('agent-country-select');
    const citySelect = document.getElementById('agent-city-select');

    const countries = await fetchCountries();
    fillSelect(countrySelect, countries, "اختر الدولة");

    countrySelect.addEventListener('change', async (e) => {
        const countryId = e.target.value;

        if (!countryId) {
            citySelect.innerHTML = '<option value="">اختر الدولة أولاً</option>';
            return;
        }

        citySelect.innerHTML = '<option>جاري التحميل...</option>';
        const cities = await fetchCitiesByCountry(countryId);
        fillSelect(citySelect, cities, "اختر المدينة");
    });
}

/* =========================
   Load Offices
========================= */
/* =========================
   Load Offices
========================= */
async function loadOffices() {
    try {
        // 1. جلب بيانات المستخدم الحالي أولاً لمعرفة صلاحياته
        const userRes = await fetch(`${API_URL}/me`, { headers: getHeaders() });
        const userData = await userRes.json();
        const isSuperAdmin = userData.user.role === 'super_admin';

        const res = await fetch(`${API_URL}/offices`, { headers: getHeaders() });
        const json = await res.json();
        const tbody = document.getElementById('offices-list');

        tbody.innerHTML = '';

        json.data.forEach(office => {
            // نتحقق: إذا كان آدمن نُظهر الأزرار، وإذا لا نترك الخانة فارغة أو نخفي العمود
            const actionsHtml = isSuperAdmin ? `
                <td>
                    <button class="btn-edit" onclick='openEditOfficeModal(${JSON.stringify(office)})'>
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-delete" onclick="openDeleteOfficeModal(${office.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            ` : `<td>-</td>`; // إذا لم يكن آدمن يظهر شرطة أو لا يظهر شيء

            tbody.innerHTML += `
                <tr>
                    <td>${office.name}</td>
                    <td>${office.city ? office.city.name : 'غير محدد'}</td>
                    <td>${office.address || '-'}</td>
                    <td>$${office.main_safe ? office.main_safe.balance : '0.00'}</td>
                    ${actionsHtml}
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error:", error);
    }
}


/* =========================
   Logic: Delete Office
========================= */
let currentOfficeIdToDelete = null;

function openDeleteOfficeModal(id) {
    currentOfficeIdToDelete = id;
    document.getElementById('delete-office-modal').classList.remove('hidden');
}

function closeDeleteOfficeModal() {
    document.getElementById('delete-office-modal').classList.add('hidden');
}

document.getElementById('confirm-delete-office-btn').onclick = async () => {
    if (!currentOfficeIdToDelete) return;
    try {
        const res = await fetch(`${API_URL}/offices/${currentOfficeIdToDelete}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (res.ok) {
            closeDeleteOfficeModal();
            loadOffices();
            alert("تم حذف المكتب بنجاح");
        } else {
            alert("حدث خطأ أثناء الحذف");
        }
    } catch (e) { console.error(e); }
};

/* =========================
   Logic: Edit Office
========================= */
async function openEditOfficeModal(office) {
    document.getElementById('edit-office-id').value = office.id;
    document.getElementById('edit-office-name').value = office.name;
    document.getElementById('edit-office-address').value = office.address || '';
    
    // جلب المدن وتعبئتها
    const citySelect = document.getElementById('edit-office-city-select');
    const cities = await fetchCitiesByCountry(1); // 1 هي سوريا حسب الكود الخاص بك
    fillSelect(citySelect, cities, "اختر المدينة");
    
    // تحديد المدينة الحالية للمكتب
    citySelect.value = office.city_id || "";

    document.getElementById('edit-office-modal').classList.remove('hidden');
}

function closeEditOfficeModal() {
    document.getElementById('edit-office-modal').classList.add('hidden');
}

document.getElementById('edit-office-form').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-office-id').value;
    
    const data = {
        name: document.getElementById('edit-office-name').value,
        city_id: parseInt(document.getElementById('edit-office-city-select').value),
        address: document.getElementById('edit-office-address').value,
    };

    try {
        const res = await fetch(`${API_URL}/offices/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (res.ok) {
            alert("تم تحديث بيانات المكتب بنجاح");
            closeEditOfficeModal();
            loadOffices(); // تحديث الجدول
        } else {
            alert("خطأ: " + (result.message || "فشل التحديث"));
        }
    } catch (error) {
        console.error(error);
        alert("خطأ في الاتصال بالخادم");
    }
};

/* =========================
   Add Office
========================= */
document.getElementById('add-office-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('office-name').value.trim();
    const cityId = document.getElementById('office-city-select').value;
    const balance1 = document.getElementById('office-balance').value;
  
    if (!name || !cityId || !balance1) {
        alert("يرجى تعبئة جميع الحقول المطلوبة واختيار المدينة");
        return;
    }

    const data = {
        name: name,
        city_id: parseInt(cityId),
        address: document.getElementById('office-address').value,
        status: 1,
        balance: balance1 ? parseFloat(balance1) : 0, 
    };

    try {
        
        const res = await fetch(`${API_URL}/offices`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (res.ok) {
            alert('تم إضافة المكتب بنجاح');
            loadOffices();
            e.target.reset();
        } else {
           console.log(cityId);
console.log(data);
            alert(result.message || "حدث خطأ");
        }

    } catch (error) {
        console.log(cityId);
console.log(data);
        alert('خطأ في الاتصال بالخادم');
        console.error(error);
    }
});

async function loadOfficesForSelect() {
    try {
        const res = await fetch(`${API_URL}/offices`, {
            headers: getHeaders()
        });

        const json = await res.json();

        const officeSelect = document.getElementById('emp-office');
        if (!officeSelect) return;

        officeSelect.innerHTML = `<option value="">اختر المكتب</option>`;

        json.data.forEach(office => {
            const option = document.createElement('option');
            option.value = office.id;
            option.textContent = office.name;
            officeSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Error loading offices for select:", error);
    }
}
/* =========================
   Add Employee / Agent
========================= */
document.getElementById('add-employee-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const role = document.getElementById('emp-role').value;

    let data = {
        name: document.getElementById('emp-name').value.trim(),
        email: document.getElementById('emp-email').value.trim(),
        phone: document.getElementById('emp-phone').value.trim(),
        password: document.getElementById('emp-password').value,
        role: role
    };

    if (role === 'agent') {
        data.country_id = document.getElementById('agent-country-select').value || null;
        data.city_id = document.getElementById('agent-city-select').value || null;
        data.balance = document.getElementById('emp-balance').value || 0;
    } else {
        data.office_id = document.getElementById('emp-office').value || null;
        
    }

    console.log("Employee Data:", data);

    try {

        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                ...getHeaders(),
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const responseData = await res.json();
        console.log("Server Response:", responseData);

        if (res.ok) {
            alert('تم إضافة الموظف بنجاح');
            e.target.reset();
            handleRoleChange();
        } else {
            alert('خطأ: ' + (responseData.message || 'فشل الإضافة'));
        }

    } catch (error) {
        console.error(error);
        alert('خطأ في الاتصال بالخادم');
    }
});


/* =========================
   Load Employees & Agents
========================= */
/* =========================
   Load Employees (Updated)
========================= */
async function loadEmployees() {
    try {
        const res = await fetch(`${API_URL}/users`, { headers: getHeaders() });
        const json = await res.json();
        const tbody = document.getElementById('employees-list');
        if (!tbody) return;

        tbody.innerHTML = '';

        // فلترة المستخدمين واستبعاد الـ costumer
        const filteredUsers = json.data.filter(user => user.role !== 'customer');

        filteredUsers.forEach((user, index) => {
            let locationInfo = '-';

            if (user.role === 'agent') {
                const country = user.country ? user.country.name : 'بدون دولة';
                const city = user.city ? user.city.name : 'بدون مدينة';
                locationInfo = `<span class="location-tag">
                    <i class="fa-solid fa-location-dot"></i> ${country}, ${city}
                </span>`;
            } else {
                locationInfo = `<span class="location-tag">
                    ${user.office ? user.office.name : 'بدون مكتب'}
                </span>`;
            }

            tbody.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.phone}</td>
                    <td><span class="role-badge">${user.role}</span></td>
                    <td>${locationInfo}</td>
                    <td>
                        <button class="btn-edit" onclick="openEditModal(${JSON.stringify(user).replace(/"/g, '&quot;')})">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn-delete" onclick="openDeleteModal(${user.id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>`;
        });

    } catch (e) {
        console.error(e);
    }
}   
/* =========================
   Delete Logic (Custom Dialog)
========================= */
let currentUserIdToDelete = null;
function openDeleteModal(id) {
    currentUserIdToDelete = id;
    document.getElementById('delete-modal').classList.remove('hidden');
}
function closeDeleteModal() {
    document.getElementById('delete-modal').classList.add('hidden');
}
/* =========================
   Logic: Delete & Edit
========================= */

// دالة الحذف المحدثة
document.getElementById('confirm-delete-btn').onclick = async () => {
    if (!currentUserIdToDelete) return;
    try {
        const res = await fetch(`${API_URL}/users/${currentUserIdToDelete}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (res.ok) {
            closeDeleteModal();
            loadEmployees();
        } else {
            alert("فشل الحذف: ربما لا تملك صلاحية Super Admin");
        }
    } catch (e) { console.error(e); }
};

// دالة معالجة تغيير دولة المندوب في التعديل
async function handleEditCountryChange() {
    const countryId = document.getElementById('edit-user-country').value;
    const citySelect = document.getElementById('edit-user-city');
    if (countryId) {
        const cities = await fetchCitiesByCountry(countryId);
        fillSelect(citySelect, cities, "اختر المدينة");
    }
}

// دالة فتح نافذة التعديل مع تعبئة البيانات
async function openEditModal(user) {
    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-user-role').value = user.role;
    document.getElementById('edit-user-name').value = user.name;
    document.getElementById('edit-user-email').value = user.email;
    document.getElementById('edit-user-phone').value = user.phone;
    document.getElementById('edit-user-password').value = "";

    const officeGroup = document.getElementById('edit-office-group');
    const agentGroup = document.getElementById('edit-agent-group');

    if (user.role === 'agent') {
        officeGroup.classList.add('hidden');
        agentGroup.classList.remove('hidden');
        
        const countrySelect = document.getElementById('edit-user-country');
        const countries = await fetchCountries();
        fillSelect(countrySelect, countries, "اختر الدولة");
        countrySelect.value = user.country_id || "";
        
        await handleEditCountryChange();
        document.getElementById('edit-user-city').value = user.city_id || "";
    } else {
        officeGroup.classList.remove('hidden');
        agentGroup.classList.add('hidden');
        
        const officeSelect = document.getElementById('edit-user-office');
        const res = await fetch(`${API_URL}/offices`, { headers: getHeaders() });
        const offices = await res.json();
        fillSelect(officeSelect, offices.data, "اختر المكتب");
        officeSelect.value = user.office_id || "";
    }

    document.getElementById('edit-modal').classList.remove('hidden');
}

// إرسال التعديل
document.getElementById('edit-user-form').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-user-id').value;
    const role = document.getElementById('edit-user-role').value;
    
    const data = {
        name: document.getElementById('edit-user-name').value,
        email: document.getElementById('edit-user-email').value,
        phone: document.getElementById('edit-user-phone').value,
    };

    const pass = document.getElementById('edit-user-password').value;
    if (pass) data.password = pass;

    if (role === 'agent') {
        data.country_id = document.getElementById('edit-user-country').value;
        data.city_id = document.getElementById('edit-user-city').value;
    } else {
        data.office_id = document.getElementById('edit-user-office').value;
    }

    const res = await fetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });

    if (res.ok) {
        alert("تم التحديث بنجاح");
        closeEditModal();
        loadEmployees();
    } else {
        alert("خطأ في التحديث");
    }
};
function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
}


async function updatePrice() {
    const currencyId = document.getElementById('currency-select').value;
    const newPrice = document.getElementById('new-price').value;

    if (!currencyId || !newPrice) {
        alert("يرجى اختيار العملة وإدخال السعر الجديد");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/currencies/update-price/${currencyId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ price: newPrice })
        });

        const data = await res.json();

        if (data.status === 'success') {
            alert("تم تحديث السعر بنجاح");
        } else {
            alert("خطأ: " + data.message);
        }

    } catch (error) {
        alert("تعذر الاتصال بالسيرفر");
    }
}

/* =========================
   Load Currencies Table
========================= */
async function renderCurrenciesTable() {
    const tbody = document.getElementById('currencies-table-body');
    if (!tbody) return;

    const currencies = await fetchCurrencies(); 
    tbody.innerHTML = '';

    if (!currencies || currencies.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">لا توجد بيانات للعملات</td></tr>';
        return;
    }

    // 1. استخراج سعر الليرة السورية مقابل الدولار لإجراء العملية الحسابية
    const sypCurrency = currencies.find(c => c.code === 'SYP');
    const sypPriceInUsd = sypCurrency ? parseFloat(sypCurrency.price) : 0;

    currencies.forEach((currency, index) => {
        // تنسيق السعر بالدولار
        const priceInUsd = parseFloat(currency.price);
        const formattedPriceUsd = priceInUsd.toFixed(6).replace(/\.?0+$/, '');

        // 2. حساب السعر بالليرة السورية وتنسيقه (Frontend Only)
        let priceInSypHtml = "-";
        if (sypPriceInUsd > 0) {
            // المعادلة: سعر العملة / سعر الليرة السورية
            const calculatedSyp = priceInUsd / sypPriceInUsd; 
            
            // تنسيق الرقم ليحتوي على فواصل الألوف (مثال: 15,000)
            const formattedSyp = new Intl.NumberFormat('en-US', { 
                maximumFractionDigits: 2 
            }).format(calculatedSyp);

            priceInSypHtml = formattedSyp;
        }

        tbody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${currency.name}</strong></td>
                <td><span class="role-badge" style="background: var(--primary-bg); color: var(--primary-dark);">${currency.code}</span></td>
                <td style="font-weight: bold; color: var(--success); direction: ltr; text-align: right;">
                    ${formattedPriceUsd}
                </td>
                <td style="font-weight: bold; color: var(--secondary); direction: ltr; text-align: right;">
                    ${priceInSypHtml}
                </td>
            </tr>
        `;
    });
}

let cachedCurrencies = [];

async function initPricePreview() {

    cachedCurrencies = await fetchCurrencies();

    const priceInput = document.getElementById("new-price");
    const currencySelect = document.getElementById("currency-select");
    const preview = document.getElementById("syp-preview");
    const box = document.querySelector(".syp-preview-box");

    function calculate() {

        const price = parseFloat(priceInput.value);
        if (!price) {
            preview.textContent = "0";
            box.classList.remove("active");
            return;
        }

        // سعر الليرة السورية
        const sypCurrency = cachedCurrencies.find(c => c.code === 'SYP');

        if (!sypCurrency) return;

        const sypPriceInUsd = parseFloat(sypCurrency.price);

        if (sypPriceInUsd <= 0) return;

        // نفس المعادلة المستخدمة بالجدول
        const result = price / sypPriceInUsd;

        const formatted = new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 2
        }).format(result);

        preview.textContent = formatted;
        box.classList.add("active");
    }

    priceInput.addEventListener("input", calculate);
    currencySelect.addEventListener("change", calculate);
}
/* =========================
   UI Helpers
========================= */
function showSection(sectionId) {

    // اخفاء كل الاقسام
    document.querySelectorAll('.card').forEach(card => {
        card.classList.add('hidden');
    });

    // اظهار القسم المطلوب فقط
    const activeSection = document.getElementById(`${sectionId}-section`);
    if (activeSection) {
        activeSection.classList.remove('hidden');
    }
}

function handleRoleChange() {
    const role = document.getElementById('emp-role').value;
    const officeGroup = document.getElementById('office-select-group');
    const agentGroup = document.getElementById('agent-fields');

    if (role === 'agent') {
        officeGroup.classList.add('hidden');
        agentGroup.classList.remove('hidden');
    } else {
        officeGroup.classList.remove('hidden');
        agentGroup.classList.add('hidden');
    }
}

async function handleLogout() {
    await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: getHeaders()
    });

    localStorage.removeItem('auth_token');
    window.location.href = '../login/login.html';
}
/* =========================
   Init App
========================= */
let token = null;

document.addEventListener('DOMContentLoaded', async () => {

    token = await checkAuth();
    if (!token) return;

    await loadOffices();
    await loadOfficesForSelect();
    await initOfficeCities();
    
    await initAgentLocation();
    await loadCurrencies();
    await loadEmployees();
    await renderCurrenciesTable();
    await initPricePreview();
    await loadSafes();
});     