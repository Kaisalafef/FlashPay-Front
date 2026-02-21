/**
 * Mock Data Service
 * =================
 * Provides mock data for dropdowns and lookups
 * In production, these would be API calls
 */

// ==========================================
// COUNTRIES DATA
// ==========================================

const COUNTRIES = [
    { id: 1, name: 'سوريا', nameEn: 'Syria', is_syria: true, code: 'SY' },
    { id: 2, name: 'الإمارات العربية المتحدة', nameEn: 'United Arab Emirates', is_syria: false, code: 'AE' },
    { id: 3, name: 'لبنان', nameEn: 'Lebanon', is_syria: false, code: 'LB' },
    { id: 4, name: 'الأردن', nameEn: 'Jordan', is_syria: false, code: 'JO' },
    { id: 5, name: 'تركيا', nameEn: 'Turkey', is_syria: false, code: 'TR' },
    { id: 6, name: 'السعودية', nameEn: 'Saudi Arabia', is_syria: false, code: 'SA' },
    { id: 7, name: 'قطر', nameEn: 'Qatar', is_syria: false, code: 'QA' },
    { id: 8, name: 'الكويت', nameEn: 'Kuwait', is_syria: false, code: 'KW' },
    { id: 9, name: 'العراق', nameEn: 'Iraq', is_syria: false, code: 'IQ' },
    { id: 10, name: 'مصر', nameEn: 'Egypt', is_syria: false, code: 'EG' }
];

// ==========================================
// GOVERNORATES DATA (Syria)
// ==========================================

const GOVERNORATES = [
    { id: 1, name: 'دمشق', country_id: 1 },
    { id: 2, name: 'حلب', country_id: 1 },
    { id: 3, name: 'حمص', country_id: 1 },
    { id: 4, name: 'اللاذقية', country_id: 1 },
    { id: 5, name: 'طرطوس', country_id: 1 },
    { id: 6, name: 'السويداء', country_id: 1 },
    { id: 7, name: 'درعا', country_id: 1 },
    { id: 8, name: 'إدلب', country_id: 1 },
    { id: 9, name: 'الرقة', country_id: 1 },
    { id: 10, name: 'الحسكة', country_id: 1 },
    { id: 11, name: 'دير الزور', country_id: 1 },
    { id: 12, name: 'حماة', country_id: 1 },
    { id: 13, name: 'القنيطرة', country_id: 1 }
];

// ==========================================
// CITIES DATA
// ==========================================

const CITIES = [
    // Syria - Damascus Governorate
    { id: 1, name: 'دمشق', governorate_id: 1, country_id: 1 },
    { id: 2, name: 'الملكية', governorate_id: 1, country_id: 1 },
    { id: 3, name: 'القابون', governorate_id: 1, country_id: 1 },
    { id: 4, name: 'جوبر', governorate_id: 1, country_id: 1 },
    { id: 5, name: 'المزة', governorate_id: 1, country_id: 1 },
    
    // Syria - Aleppo Governorate
    { id: 10, name: 'حلب', governorate_id: 2, country_id: 1 },
    { id: 11, name: 'الشهباء', governorate_id: 2, country_id: 1 },
    { id: 12, name: 'الأعظمية', governorate_id: 2, country_id: 1 },
    { id: 13, name: 'السكري', governorate_id: 2, country_id: 1 },
    { id: 14, name: 'الشيخ مقصود', governorate_id: 2, country_id: 1 },
    
    // Syria - Homs Governorate
    { id: 20, name: 'حمص', governorate_id: 3, country_id: 1 },
    { id: 21, name: 'الوعر', governorate_id: 3, country_id: 1 },
    { id: 22, name: 'الخالدية', governorate_id: 3, country_id: 1 },
    { id: 23, name: 'القصور', governorate_id: 3, country_id: 1 },
    
    // Syria - Latakia Governorate
    { id: 30, name: 'اللاذقية', governorate_id: 4, country_id: 1 },
    { id: 31, name: 'الحفة', governorate_id: 4, country_id: 1 },
    { id: 32, name: 'جبلة', governorate_id: 4, country_id: 1 },
    
    // Syria - Tartus Governorate
    { id: 40, name: 'طرطوس', governorate_id: 5, country_id: 1 },
    { id: 41, name: 'الدريكيش', governorate_id: 5, country_id: 1 },
    { id: 42, name: 'بانياس', governorate_id: 5, country_id: 1 },
    
    // UAE - Dubai
    { id: 100, name: 'دبي', country_id: 2 },
    { id: 101, name: 'أبوظبي', country_id: 2 },
    { id: 102, name: 'الشارقة', country_id: 2 },
    { id: 103, name: 'عجمان', country_id: 2 },
    { id: 104, name: 'رأس الخيمة', country_id: 2 },
    
    // Lebanon
    { id: 200, name: 'بيروت', country_id: 3 },
    { id: 201, name: 'طرابلس', country_id: 3 },
    { id: 202, name: 'صيدا', country_id: 3 },
    { id: 203, name: 'الزحلة', country_id: 3 },
    
    // Jordan
    { id: 300, name: 'عمان', country_id: 4 },
    { id: 301, name: 'إربد', country_id: 4 },
    { id: 302, name: 'الزرقاء', country_id: 4 },
    
    // Turkey
    { id: 400, name: 'إسطنبول', country_id: 5 },
    { id: 401, name: 'أنقرة', country_id: 5 },
    { id: 402, name: 'غازي عنتاب', country_id: 5 },
    { id: 403, name: 'أضنة', country_id: 5 },
    
    // Saudi Arabia
    { id: 500, name: 'الرياض', country_id: 6 },
    { id: 501, name: 'جدة', country_id: 6 },
    { id: 502, name: 'مكة', country_id: 6 },
    { id: 503, name: 'الدمام', country_id: 6 },
    
    // Qatar
    { id: 600, name: 'الدوحة', country_id: 7 },
    
    // Kuwait
    { id: 700, name: 'الكويت', country_id: 8 },
    
    // Iraq
    { id: 800, name: 'بغداد', country_id: 9 },
    { id: 801, name: 'أربيل', country_id: 9 },
    
    // Egypt
    { id: 900, name: 'القاهرة', country_id: 10 },
    { id: 901, name: 'الإسكندرية', country_id: 10 }
];

// ==========================================
// OFFICES DATA
// ==========================================

const OFFICES = [
    { id: 1, name: 'مكتب دمشق المركزي', city_id: 1, governorate_id: 1, phone: '+963 11 1234567', manager: 'أحمد المدير', is_active: true },
    { id: 2, name: 'مكتب حلب الرئيسي', city_id: 10, governorate_id: 2, phone: '+963 21 7654321', manager: 'خالد العلي', is_active: true },
    { id: 3, name: 'مكتب حمص', city_id: 20, governorate_id: 3, phone: '+963 31 9876543', manager: 'محمد الحمصي', is_active: true },
    { id: 4, name: 'مكتب اللاذقية', city_id: 30, governorate_id: 4, phone: '+963 41 4567890', manager: 'فادي اللاذقي', is_active: true },
    { id: 5, name: 'مكتب طرطوس', city_id: 40, governorate_id: 5, phone: '+963 43 2345678', manager: 'سامر طرطوسي', is_active: true }
];

// ==========================================
// DELEGATES/AGENTS DATA
// ==========================================

const DELEGATES = [
    { id: 1, name: 'ماهر الأسعد', phone: '+971 50 123 4567', city_id: 100, country_id: 2, is_active: true },
    { id: 2, name: 'خالد العلي', phone: '+971 55 987 6543', city_id: 100, country_id: 2, is_active: true },
    { id: 3, name: 'فادي محمد', phone: '+961 3 123 456', city_id: 200, country_id: 3, is_active: true },
    { id: 4, name: 'أحمد العمري', phone: '+962 7 9876 5432', city_id: 300, country_id: 4, is_active: true },
    { id: 5, name: 'محمد التركي', phone: '+90 532 123 4567', city_id: 400, country_id: 5, is_active: true },
    { id: 6, name: 'سعود السعودي', phone: '+966 50 123 4567', city_id: 500, country_id: 6, is_active: true },
    { id: 7, name: 'قطر القطري', phone: '+974 55 123 4567', city_id: 600, country_id: 7, is_active: true },
    { id: 8, name: 'كويتي الكويت', phone: '+965 99 123 4567', city_id: 700, country_id: 8, is_active: true }
];

// ==========================================
// DATA ACCESS FUNCTIONS
// ==========================================

/**
 * Get all countries
 * @returns {Array} Countries array
 */
function getCountries() {
    return COUNTRIES.map(c => ({ ...c }));
}

/**
 * Get country by ID
 * @param {number} countryId - Country ID
 * @returns {Object|null} Country object or null
 */
function getCountryById(countryId) {
    return COUNTRIES.find(c => c.id === countryId) || null;
}

/**
 * Check if country is Syria
 * @param {number} countryId - Country ID
 * @returns {boolean} True if Syria
 */
function isSyria(countryId) {
    const country = getCountryById(countryId);
    return country ? country.is_syria : false;
}

/**
 * Get governorates by country
 * @param {number} countryId - Country ID
 * @returns {Array} Governorates array
 */
function getGovernorates(countryId) {
    return GOVERNORATES.filter(g => g.country_id === countryId).map(g => ({ ...g }));
}

/**
 * Get governorate by ID
 * @param {number} governorateId - Governorate ID
 * @returns {Object|null} Governorate object or null
 */
function getGovernorateById(governorateId) {
    return GOVERNORATES.find(g => g.id === governorateId) || null;
}

/**
 * Get cities by governorate (for Syria)
 * @param {number} governorateId - Governorate ID
 * @returns {Array} Cities array
 */
function getCitiesByGovernorate(governorateId) {
    return CITIES.filter(c => c.governorate_id === governorateId).map(c => ({ ...c }));
}

/**
 * Get cities by country (for international)
 * @param {number} countryId - Country ID
 * @returns {Array} Cities array
 */
function getCitiesByCountry(countryId) {
    return CITIES.filter(c => c.country_id === countryId && !c.governorate_id).map(c => ({ ...c }));
}

/**
 * Get city by ID
 * @param {number} cityId - City ID
 * @returns {Object|null} City object or null
 */
function getCityById(cityId) {
    return CITIES.find(c => c.id === cityId) || null;
}

/**
 * Get offices by city
 * @param {number} cityId - City ID
 * @returns {Array} Offices array
 */
function getOfficesByCity(cityId) {
    return OFFICES.filter(o => o.city_id === cityId && o.is_active).map(o => ({ ...o }));
}

/**
 * Get all offices
 * @returns {Array} All active offices
 */
function getAllOffices() {
    return OFFICES.filter(o => o.is_active).map(o => ({ ...o }));
}

/**
 * Get office by ID
 * @param {number} officeId - Office ID
 * @returns {Object|null} Office object or null
 */
function getOfficeById(officeId) {
    return OFFICES.find(o => o.id === officeId) || null;
}

/**
 * Get delegates by city
 * @param {number} cityId - City ID
 * @returns {Array} Delegates array
 */
function getDelegatesByCity(cityId) {
    return DELEGATES.filter(d => d.city_id === cityId && d.is_active).map(d => ({ ...d }));
}

/**
 * Get delegates by country
 * @param {number} countryId - Country ID
 * @returns {Array} Delegates array
 */
function getDelegatesByCountry(countryId) {
    return DELEGATES.filter(d => d.country_id === countryId && d.is_active).map(d => ({ ...d }));
}

/**
 * Get all delegates
 * @returns {Array} All active delegates
 */
function getAllDelegates() {
    return DELEGATES.filter(d => d.is_active).map(d => ({ ...d }));
}

/**
 * Get delegate by ID
 * @param {number} delegateId - Delegate ID
 * @returns {Object|null} Delegate object or null
 */
function getDelegateById(delegateId) {
    return DELEGATES.find(d => d.id === delegateId) || null;
}

// ==========================================
// EXPORTS
// ==========================================

if (typeof window !== 'undefined') {
    // Countries
    window.getCountries = getCountries;
    window.getCountryById = getCountryById;
    window.isSyria = isSyria;
    
    // Governorates
    window.getGovernorates = getGovernorates;
    window.getGovernorateById = getGovernorateById;
    
    // Cities
    window.getCitiesByGovernorate = getCitiesByGovernorate;
    window.getCitiesByCountry = getCitiesByCountry;
    window.getCityById = getCityById;
    
    // Offices
    window.getOfficesByCity = getOfficesByCity;
    window.getAllOffices = getAllOffices;
    window.getOfficeById = getOfficeById;
    
    // Delegates
    window.getDelegatesByCity = getDelegatesByCity;
    window.getDelegatesByCountry = getDelegatesByCountry;
    window.getAllDelegates = getAllDelegates;
    window.getDelegateById = getDelegateById;
    
    // Data arrays (for advanced usage)
    window.COUNTRIES = COUNTRIES;
    window.GOVERNORATES = GOVERNORATES;
    window.CITIES = CITIES;
    window.OFFICES = OFFICES;
    window.DELEGATES = DELEGATES;
}
