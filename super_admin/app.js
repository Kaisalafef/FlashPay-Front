const API_URL = 'http://127.0.0.1:8000/api';


/* =========================
   Auth Check
========================= */

async function checkAuth() {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        window.location.href = '/FLASHPAY-FRONT/login/index.html';
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
            window.location.href = '/FlashPay-Front/login/index.html';
            return null;
        }

        return token;

    } catch (e) {
        localStorage.clear();
        window.location.href = '/FlashPay-Front/login/index.html';
        return null;
    }
}
/* =========================
   Helpers
========================= */
function getHeaders() {
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
            window.location.href = '/FlashPay-Front/login/index.html';
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
        const option = document.createElement("option");
        option.value = currency.id;
        option.textContent = currency.name + " (" + currency.code + ")";
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
async function loadOffices() {
    try {
        const res = await fetch(`${API_URL}/offices`, {
            headers: getHeaders()
        });

        const json = await res.json();

        const tbody = document.getElementById('offices-list');
        const officeSelect = document.getElementById('emp-office');

        if (!tbody || !officeSelect) return;

        tbody.innerHTML = '';
        officeSelect.innerHTML = '<option value="">اختر المكتب...</option>';

        json.data.forEach(office => {
            tbody.innerHTML += `
                <tr>
                    <td>${office.name}</td>
                    <td>${office.city ? office.city.name : 'غير محدد'}</td>
                    <td>${office.address || '-'}</td>
                    <td>$${office.main_safe ? office.main_safe.balance : '0.00'}</td>
                </tr>
            `;

            officeSelect.innerHTML += `
                <option value="${office.id}">${office.name}</option>
            `;
        });

    } catch (error) {
        console.error("Error loading offices:", error);
    }
}

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

/* =========================
   Add Employee / Agent
========================= */
document.getElementById('add-employee-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const role = document.getElementById('emp-role').value;

    let data = {
        name: document.getElementById('emp-name').value,
        email: document.getElementById('emp-email').value,
        phone: document.getElementById('emp-phone').value,
        password: document.getElementById('emp-password').value,
        role: role
    };

    if (role === 'agent') {
        data.country_id = document.getElementById('agent-country-select').value;
        data.city_id = document.getElementById('agent-city-select').value;
        data.balance = document.getElementById('emp-balance').value;
    } else {
        data.office_id = document.getElementById('emp-office').value;
    }

    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert('تم إضافة الموظف بنجاح');
            e.target.reset();
            handleRoleChange();
        } else {
            const errorData = await res.json();
            alert('خطأ: ' + (errorData.message || 'تأكد من إدخال البيانات بشكل صحيح'));
        }

    } catch (error) {
        alert('خطأ في الاتصال بالخادم');
    }
});

/* =========================
   Update Currency Price
========================= */
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
   UI Helpers
========================= */
function showSection(sectionId) {
    document.querySelectorAll('.card').forEach(el => el.classList.add('hidden'));
    document.getElementById(`${sectionId}-section`)?.classList.remove('hidden');
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
    window.location.href = '../login/index.html';
}
/* =========================
   Init App
========================= */
let token = null;

document.addEventListener('DOMContentLoaded', async () => {

    token = await checkAuth();
    if (!token) return;

    await loadOffices();
    await initOfficeCities();
    await initAgentLocation();
    await loadCurrencies();
});     