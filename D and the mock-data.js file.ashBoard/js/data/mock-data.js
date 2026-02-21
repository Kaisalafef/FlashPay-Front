/**
 * Mock Data for Polymorphic Remittance System
 * ============================================
 * This file contains mock data representing the schema from the backend
 * (Laravel/MySQL with Polymorphic Architecture)
 */

// ==========================================
// COUNTRIES DATA
// ==========================================
const COUNTRIES = [
    { id: 1, name: 'سوريا', code: 'SY', is_syria: true },
    { id: 2, name: 'الإمارات العربية المتحدة', code: 'AE', is_syria: false },
    { id: 3, name: 'السعودية', code: 'SA', is_syria: false },
    { id: 4, name: 'قطر', code: 'QA', is_syria: false },
    { id: 5, name: 'الكويت', code: 'KW', is_syria: false },
    { id: 6, name: 'البحرين', code: 'BH', is_syria: false },
    { id: 7, name: 'عمان', code: 'OM', is_syria: false },
    { id: 8, name: 'لبنان', code: 'LB', is_syria: false },
    { id: 9, name: 'الأردن', code: 'JO', is_syria: false },
    { id: 10, name: 'تركيا', code: 'TR', is_syria: false },
    { id: 11, name: 'ألمانيا', code: 'DE', is_syria: false },
    { id: 12, name: 'فرنسا', code: 'FR', is_syria: false },
    { id: 13, name: 'بريطانيا', code: 'GB', is_syria: false },
    { id: 14, name: 'أمريكا', code: 'US', is_syria: false },
    { id: 15, name: 'كندا', code: 'CA', is_syria: false },
    { id: 16, name: 'أستراليا', code: 'AU', is_syria: false }
];

// ==========================================
// SYRIA GOVERNORATES (المحافظات)
// ==========================================
const GOVERNORATES = [
    { id: 1, name: 'دمشق', country_id: 1 },
    { id: 2, name: 'حلب', country_id: 1 },
    { id: 3, name: 'حمص', country_id: 1 },
    { id: 4, name: 'اللاذقية', country_id: 1 },
    { id: 5, name: 'طرطوس', country_id: 1 },
    { id: 6, name: 'حماه', country_id: 1 },
    { id: 7, name: 'إدلب', country_id: 1 },
    { id: 8, name: 'دير الزور', country_id: 1 },
    { id: 9, name: 'الرقة', country_id: 1 },
    { id: 10, name: 'الحسكة', country_id: 1 },
    { id: 11, name: 'السويداء', country_id: 1 },
    { id: 12, name: 'درعا', country_id: 1 },
    { id: 13, name: 'القنيطرة', country_id: 1 },
    { id: 14, name: 'ريف دمشق', country_id: 1 }
];

// ==========================================
// CITIES DATA (Syria + International)
// ==========================================
const CITIES = [
    // Syria - Damascus
    { id: 1, name: 'دمشق', governorate_id: 1, country_id: 1 },
    { id: 2, name: 'جرمانا', governorate_id: 1, country_id: 1 },
    { id: 3, name: 'داريا', governorate_id: 1, country_id: 1 },
    { id: 4, name: 'صحنايا', governorate_id: 1, country_id: 1 },
    
    // Syria - Aleppo
    { id: 5, name: 'حلب', governorate_id: 2, country_id: 1 },
    { id: 6, name: 'عفرين', governorate_id: 2, country_id: 1 },
    { id: 7, name: 'باب', governorate_id: 2, country_id: 1 },
    
    // Syria - Homs
    { id: 8, name: 'حمص', governorate_id: 3, country_id: 1 },
    { id: 9, name: 'تدمر', governorate_id: 3, country_id: 1 },
    { id: 10, name: 'القصير', governorate_id: 3, country_id: 1 },
    
    // Syria - Lattakia
    { id: 11, name: 'اللاذقية', governorate_id: 4, country_id: 1 },
    { id: 12, name: 'جبلة', governorate_id: 4, country_id: 1 },
    { id: 13, name: 'كسب', governorate_id: 4, country_id: 1 },
    
    // Syria - Tartus
    { id: 14, name: 'طرطوس', governorate_id: 5, country_id: 1 },
    { id: 15, name: 'بانياس', governorate_id: 5, country_id: 1 },
    
    // Syria - Hama
    { id: 16, name: 'حماه', governorate_id: 6, country_id: 1 },
    { id: 17, name: 'محردة', governorate_id: 6, country_id: 1 },
    
    // Syria - Other Governorates
    { id: 18, name: 'إدلب', governorate_id: 7, country_id: 1 },
    { id: 19, name: 'دير الزور', governorate_id: 8, country_id: 1 },
    { id: 20, name: 'الرقة', governorate_id: 9, country_id: 1 },
    { id: 21, name: 'الحسكة', governorate_id: 10, country_id: 1 },
    { id: 22, name: 'السويداء', governorate_id: 11, country_id: 1 },
    { id: 23, name: 'درعا', governorate_id: 12, country_id: 1 },
    { id: 24, name: 'القنيطرة', governorate_id: 13, country_id: 1 },
    { id: 25, name: 'القطيفة', governorate_id: 14, country_id: 1 },
    { id: 26, name: 'دوما', governorate_id: 14, country_id: 1 },
    
    // UAE Cities
    { id: 27, name: 'دبي', country_id: 2 },
    { id: 28, name: 'أبوظبي', country_id: 2 },
    { id: 29, name: 'الشارقة', country_id: 2 },
    { id: 30, name: 'عجمان', country_id: 2 },
    { id: 31, name: 'رأس الخيمة', country_id: 2 },
    
    // Saudi Cities
    { id: 32, name: 'الرياض', country_id: 3 },
    { id: 33, name: 'جدة', country_id: 3 },
    { id: 34, name: 'الدمام', country_id: 3 },
    { id: 35, name: 'مكة المكرمة', country_id: 3 },
    { id: 36, name: 'المدينة المنورة', country_id: 3 },
    
    // Qatar Cities
    { id: 37, name: 'الدوحة', country_id: 4 },
    { id: 38, name: 'الخور', country_id: 4 },
    
    // Kuwait Cities
    { id: 39, name: 'الكويت', country_id: 5 },
    { id: 40, name: 'الفروانية', country_id: 5 },
    { id: 41, name: 'حولي', country_id: 5 },
    
    // Bahrain Cities
    { id: 42, name: 'المنامة', country_id: 6 },
    { id: 43, name: 'المحرق', country_id: 6 },
    
    // Oman Cities
    { id: 44, name: 'مسقط', country_id: 7 },
    { id: 45, name: 'صلالة', country_id: 7 },
    
    // Lebanon Cities
    { id: 46, name: 'بيروت', country_id: 8 },
    { id: 47, name: 'طرابلس', country_id: 8 },
    { id: 48, name: 'صيدا', country_id: 8 },
    
    // Jordan Cities
    { id: 49, name: 'عمّان', country_id: 9 },
    { id: 50, name: 'الزرقاء', country_id: 9 },
    { id: 51, name: 'إربد', country_id: 9 },
    
    // Turkey Cities
    { id: 52, name: 'اسطنبول', country_id: 10 },
    { id: 53, name: 'أنقرة', country_id: 10 },
    { id: 54, name: 'إزمير', country_id: 10 },
    
    // Germany Cities
    { id: 55, name: 'برلين', country_id: 11 },
    { id: 56, name: '慕尼黑', country_id: 11 },
    { id: 57, name: 'فرانكفورت', country_id: 11 },
    
    // France Cities
    { id: 58, name: 'باريس', country_id: 12 },
    { id: 59, name: 'مرسيليا', country_id: 12 },
    { id: 60, name: 'ليون', country_id: 12 },
    
    // UK Cities
    { id: 61, name: 'لندن', country_id: 13 },
    { id: 62, name: 'مانشستر', country_id: 13 },
    { id: 63, name: 'برمنغهام', country_id: 13 },
    
    // USA Cities
    { id: 64, name: 'نيويورك', country_id: 14 },
    { id: 65, name: 'لوس أنجلوس', country_id: 14 },
    { id: 66, name: 'شيكاغو', country_id: 14 },
    
    // Canada Cities
    { id: 67, name: 'تورنتو', country_id: 15 },
    { id: 68, name: 'فانكوفر', country_id: 15 },
    { id: 69, name: 'مونتريال', country_id: 15 },
    
    // Australia Cities
    { id: 70, name: 'سيدني', country_id: 16 },
    { id: 71, name: 'ملبورن', country_id: 16 },
    { id: 72, name: 'بريسبان', country_id: 16 }
];

// ==========================================
// OFFICES DATA (Polymorphic - Syria Only)
// ==========================================
const OFFICES = [
    // Physical Offices in Damascus
    { id: 1, name: 'مكتب دمشق المركزي', address: 'دمشق - شارع الوحدة', phone: '+963 11 1234567', governorate_id: 1, city_id: 1, is_virtual: false, manager_id: null, created_at: '2023-01-15' },
    { id: 2, name: 'مكتب جرمانا', address: 'جرمانا - السوق الرئيسي', phone: '+963 11 2345678', governorate_id: 1, city_id: 2, is_virtual: false, manager_id: null, created_at: '2023-03-20' },
    { id: 3, name: 'مكتب صحنايا', address: 'صحنايا - حي الزهراء', phone: '+963 11 3456789', governorate_id: 1, city_id: 4, is_virtual: false, manager_id: null, created_at: '2023-06-10' },
    
    // Physical Offices in Aleppo
    { id: 4, name: 'مكتب حلب الشمالي', address: 'حلب - حي الأزهر', phone: '+963 21 1111111', governorate_id: 2, city_id: 5, is_virtual: false, manager_id: null, created_at: '2023-02-01' },
    { id: 5, name: 'مكتب حلب الجنوبي', address: 'حلب - حي السكري', phone: '+963 21 2222222', governorate_id: 2, city_id: 5, is_virtual: false, manager_id: null, created_at: '2023-04-15' },
    
    // Physical Offices in Homs
    { id: 6, name: 'مكتب حمص', address: 'حمص - وسط المدينة', phone: '+963 31 3333333', governorate_id: 3, city_id: 8, is_virtual: false, manager_id: null, created_at: '2023-05-20' },
    
    // Physical Offices in Lattakia
    { id: 7, name: 'مكتب اللاذقية', address: 'اللاذقية - الكورنيش', phone: '+963 41 4444444', governorate_id: 4, city_id: 11, is_virtual: false, manager_id: null, created_at: '2023-07-01' },
    
    // Physical Offices in Tartus
    { id: 8, name: 'مكتب طرطوس', address: 'طرطوس - حي الثورة', phone: '+963 43 5555555', governorate_id: 5, city_id: 14, is_virtual: false, manager_id: null, created_at: '2023-08-10' },
    
    // Physical Offices in Hama
    { id: 9, name: 'مكتب حماه', address: 'حماه - وسط المدينة', phone: '+963 33 6666666', governorate_id: 6, city_id: 16, is_virtual: false, manager_id: null, created_at: '2023-09-01' },
    
    // Physical Offices in Other Cities
    { id: 10, name: 'مكتب درعا', address: 'درعا - وسط المدينة', phone: '+963 15 7777777', governorate_id: 12, city_id: 23, is_virtual: false, manager_id: null, created_at: '2023-10-15' },
    { id: 11, name: 'مكتب دير الزور', address: 'دير الزور - شارع الرئيسية', phone: '+963 51 8888888', governorate_id: 8, city_id: 19, is_virtual: false, manager_id: null, created_at: '2023-11-01' },
    
    // Virtual Office (Global - for International Delegates)
    { id: 999, name: 'المكتب الافتراضي العالمي', address: 'Global Virtual Office', phone: '+000 0000000', governorate_id: null, city_id: null, is_virtual: true, manager_id: null, created_at: '2023-01-01' }
];

// ==========================================
// USERS/DELEGATES DATA (International Agents)
// These are filtered by country_id and city_id
// ==========================================
const USERS = [
    // UAE Delegates
    { id: 101, name: 'أحمد محمد النقبي', phone: '+971 50 1234567', role: 'delegate', country_id: 2, city_id: 27, office_id: null, is_active: true },
    { id: 102, name: 'خالد سعيد المنصوري', phone: '+971 55 2345678', role: 'delegate', country_id: 2, city_id: 27, office_id: null, is_active: true },
    { id: 103, name: 'عبدالله عمر الكتبي', phone: '+971 50 3456789', role: 'delegate', country_id: 2, city_id: 28, office_id: null, is_active: true },
    { id: 104, name: 'سعيد راشد الحربي', phone: '+971 55 4567890', role: 'delegate', country_id: 2, city_id: 29, office_id: null, is_active: true },
    
    // Saudi Delegates
    { id: 105, name: 'محمد علي الغامدي', phone: '+966 50 1111111', role: 'delegate', country_id: 3, city_id: 32, office_id: null, is_active: true },
    { id: 106, name: 'فهد محمد السالم', phone: '+966 55 2222222', role: 'delegate', country_id: 3, city_id: 32, office_id: null, is_active: true },
    { id: 107, name: 'عبدالرحمن خالد العمري', phone: '+966 50 3333333', role: 'delegate', country_id: 3, city_id: 33, office_id: null, is_active: true },
    { id: 108, name: 'تركي ناصر الحربي', phone: '+966 55 4444444', role: 'delegate', country_id: 3, city_id: 34, office_id: null, is_active: true },
    
    // Qatar Delegates
    { id: 109, name: 'يوسف أحمد المالكي', phone: '+974 55 5555555', role: 'delegate', country_id: 4, city_id: 37, office_id: null, is_active: true },
    { id: 110, name: 'أحمد خالد الخليج', phone: '+974 66 6666666', role: 'delegate', country_id: 4, city_id: 37, office_id: null, is_active: true },
    
    // Kuwait Delegates
    { id: 111, name: 'بدر علي المطيري', phone: '+965 50 7777777', role: 'delegate', country_id: 5, city_id: 39, office_id: null, is_active: true },
    { id: 112, name: 'فيصل جاسم القحطاني', phone: '+965 55 8888888', role: 'delegate', country_id: 5, city_id: 40, office_id: null, is_active: true },
    
    // Bahrain Delegates
    { id: 113, name: 'علي حسن الجلود', phone: '+973 38 9999999', role: 'delegate', country_id: 6, city_id: 42, office_id: null, is_active: true },
    
    // Oman Delegates
    { id: 114, name: 'سعيد مسعود السيابي', phone: '+968 95 1010101', role: 'delegate', country_id: 7, city_id: 44, office_id: null, is_active: true },
    
    // Lebanon Delegates
    { id: 115, name: 'كريم وليد العيتاني', phone: '+961 70 2020202', role: 'delegate', country_id: 8, city_id: 46, office_id: null, is_active: true },
    { id: 116, name: 'تامر محمد المصري', phone: '+961 71 3030303', role: 'delegate', country_id: 8, city_id: 46, office_id: null, is_active: true },
    
    // Jordan Delegates
    { id: 117, name: 'وائل ابراهيم الطراونة', phone: '+962 79 4040404', role: 'delegate', country_id: 9, city_id: 49, office_id: null, is_active: true },
    { id: 118, name: 'معاذ خليل الشبلي', phone: '+962 77 5050505', role: 'delegate', country_id: 9, city_id: 49, office_id: null, is_active: true },
    
    // Turkey Delegates
    { id: 119, name: 'أحمد محمد بكار', phone: '+90 532 6060606', role: 'delegate', country_id: 10, city_id: 52, office_id: null, is_active: true },
    { id: 120, name: 'عمر عبد الرحمن أقبر', phone: '+90 535 7070707', role: 'delegate', country_id: 10, city_id: 52, office_id: null, is_active: true },
    
    // Germany Delegates
    { id: 121, name: 'خالد عمر عبد العزيز', phone: '+49 170 8080808', role: 'delegate', country_id: 11, city_id: 55, office_id: null, is_active: true },
    { id: 122, name: 'ياسر محمد الفارس', phone: '+49 171 9090909', role: 'delegate', country_id: 11, city_id: 56, office_id: null, is_active: true },
    
    // France Delegates
    { id: 123, name: 'بسام علي التركاوي', phone: '+33 6 10101010', role: 'delegate', country_id: 12, city_id: 58, office_id: null, is_active: true },
    
    // UK Delegates
    { id: 124, name: 'عمر احمد الغانم', phone: '+44 7700 900900', role: 'delegate', country_id: 13, city_id: 61, office_id: null, is_active: true },
    { id: 125, name: 'علياء bt', phone: '+44 7700 901901', role: 'delegate', country_id: 13, city_id: 61, office_id: null, is_active: true },
    
    // USA Delegates
    { id: 126, name: 'سامي محمد الحاج', phone: '+1 347 5551212', role: 'delegate', country_id: 14, city_id: 64, office_id: null, is_active: true },
    { id: 127, name: 'وسام وليد نصار', phone: '+1 213 5552323', role: 'delegate', country_id: 14, city_id: 65, office_id: null, is_active: true },
    
    // Canada Delegates
    { id: 128, name: 'كمال احمد العتيبي', phone: '+1 416 5553434', role: 'delegate', country_id: 15, city_id: 67, office_id: null, is_active: true },
    { id: 129, name: 'رامي راغب شاهين', phone: '+1 514 5554545', role: 'delegate', country_id: 15, city_id: 69, office_id: null, is_active: true },
    
    // Australia Delegates
    { id: 130, name: 'نبيل نادر حجازي', phone: '+61 410 555555', role: 'delegate', country_id: 16, city_id: 70, office_id: null, is_active: true }
];

// ==========================================
// EMPLOYEE ROLES
// ==========================================
const EMPLOYEE_ROLES = [
    { id: 1, name: 'مدير عام', value: 'super_admin', permissions: 'all' },
    { id: 2, name: 'مدير مكتب', value: 'admin', permissions: 'office' },
    { id: 3, name: 'مندوب', value: 'agent', permissions: 'transfer' },
    { id: 4, name: 'كاشير', value: 'cashier', permissions: 'cash' },
    { id: 5, name: 'محاسب', value: 'accountant', permissions: 'reports' },
    { id: 6, name: 'وكيل دولي', value: 'delegate', permissions: 'international' }
];

// ==========================================
// UTILITY FUNCTIONS FOR DATA ACCESS
// ==========================================

/**
 * Get all countries
 */
function getCountries() {
    return COUNTRIES;
}

/**
 * Get country by ID
 */
function getCountryById(id) {
    return COUNTRIES.find(c => c.id === id);
}

/**
 * Get country by code
 */
function getCountryByCode(code) {
    return COUNTRIES.find(c => c.code === code);
}

/**
 * Check if country is Syria
 */
function isSyria(countryId) {
    const country = getCountryById(countryId);
    return country ? country.is_syria : false;
}

/**
 * Get governorates for a country (Syria only)
 */
function getGovernorates(countryId) {
    if (countryId !== 1) return []; // Only Syria has governorates
    return GOVERNORATES.filter(g => g.country_id === countryId);
}

/**
 * Get cities for a country
 */
function getCitiesByCountry(countryId) {
    return CITIES.filter(c => c.country_id === countryId);
}

/**
 * Get cities for a governorate (Syria only)
 */
function getCitiesByGovernorate(governorateId) {
    return CITIES.filter(c => c.governorate_id === governorateId);
}

/**
 * Get all offices (only physical, not virtual)
 */
function getPhysicalOffices() {
    return OFFICES.filter(o => !o.is_virtual);
}

/**
 * Get offices by city (Syria only)
 */
function getOfficesByCity(cityId) {
    return OFFICES.filter(o => o.city_id === cityId && !o.is_virtual);
}

/**
 * Get offices by governorate (Syria only)
 */
function getOfficesByGovernorate(governorateId) {
    return OFFICES.filter(o => o.governorate_id === governorateId && !o.is_virtual);
}

/**
 * Get the virtual office (for international delegates)
 */
function getVirtualOffice() {
    return OFFICES.find(o => o.is_virtual);
}

/**
 * Get all delegates/users by country
 */
function getDelegatesByCountry(countryId) {
    return USERS.filter(u => u.country_id === countryId && u.is_active);
}

/**
 * Get all delegates/users by city
 */
function getDelegatesByCity(cityId) {
    return USERS.filter(u => u.city_id === cityId && u.is_active);
}

/**
 * Get all active delegates/users
 */
function getActiveDelegates() {
    return USERS.filter(u => u.is_active);
}

/**
 * Get employee roles
 */
function getEmployeeRoles() {
    return EMPLOYEE_ROLES;
}

/**
 * Get all managers (users with admin/manager roles)
 */
function getManagers() {
    return USERS.filter(u => ['admin', 'office_manager'].includes(u.role));
}

/**
 * Get all employees (combined with offices for the system)
 */
function getAllEmployees() {
    // This would typically come from an API, combining users and office managers
    return [
        ...USERS.filter(u => !u.is_active || u.role !== 'delegate').map(u => ({
            id: u.id,
            name: u.name,
            phone: u.phone,
            role: u.role
        })),
        { id: 1001, name: 'خالد العلي', phone: '+963 955 111111', role: 'office_manager' },
        { id: 1002, name: 'محمد Hassan', phone: '+963 955 222222', role: 'office_manager' },
        { id: 1003, name: 'أحمد Martins', phone: '+963 955 333333', role: 'office_manager' },
        { id: 1004, name: 'سارة أحمد', phone: '+963 955 444444', role: 'cashier' },
        { id: 1005, name: 'فادي محمد', phone: '+963 955 555555', role: 'accountant' }
    ];
}

// ==========================================
// API OBJECT PREPARATION HELPERS
// ==========================================

/**
 * Prepare transfer API object based on destination type
 * @param {Object} transferData - Basic transfer data
 * @param {number} destinationId - Office or User ID
 * @param {string} destinationType - 'office' or 'user'
 * @returns {Object} - Ready-to-send API object
 */
function prepareTransferAPIObject(transferData, destinationId, destinationType) {
    const apiObject = {
        // Sender info
        sender_name: transferData.sender_name,
        sender_phone: transferData.sender_phone,
        sender_country_id: transferData.sender_country_id,
        
        // Receiver info
        receiver_name: transferData.receiver_name,
        receiver_phone: transferData.receiver_phone,
        
        // Amount and currency
        amount: transferData.amount,
        currency: transferData.currency || 'USD',
        
        // Destination - Polymorphic relation
        destination_id: destinationId,
        destination_type: destinationType === 'office' 
            ? 'App\\Models\\Office' 
            : 'App\\Models\\User',
        
        // Additional info
        notes: transferData.notes || '',
        created_by: transferData.created_by || 1
    };
    
    return apiObject;
}

/**
 * Prepare employee/user API object
 * @param {Object} employeeData - Employee form data
 * @returns {Object} - Ready-to-send API object
 */
function prepareEmployeeAPIObject(employeeData) {
    const isSyrian = isSyria(employeeData.country_id);
    
    const apiObject = {
        name: employeeData.name,
        phone: employeeData.phone,
        role: employeeData.role,
        country_id: employeeData.country_id,
        
        // Location (Syria specific)
        ...(isSyrian && {
            governorate_id: employeeData.governorate_id,
            city_id: employeeData.city_id
        }),
        
        // Office assignment
        // If Syria: office_id from selection
        // If outside Syria: auto-assign to Virtual Office (id: 999)
        office_id: isSyrian 
            ? employeeData.office_id 
            : 999, // Virtual Office ID
        
        is_active: true,
        created_by: employeeData.created_by || 1
    };
    
    return apiObject;
}

/**
 * Prepare office API object
 * @param {Object} officeData - Office form data
 * @returns {Object} - Ready-to-send API object
 */
function prepareOfficeAPIObject(officeData) {
    const apiObject = {
        name: officeData.name,
        address: officeData.address,
        phone: officeData.phone,
        governorate_id: officeData.governorate_id,
        city_id: officeData.city_id,
        
        // Virtual office toggle
        is_virtual: officeData.is_virtual || false,
        
        // Manager assignment (can be null)
        manager_id: officeData.manager_id || null,
        
        // Currency and balance
        default_currency: officeData.default_currency || 'USD',
        opening_balance: officeData.opening_balance || 0,
        
        is_active: true,
        created_by: officeData.created_by || 1
    };
    
    return apiObject;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        COUNTRIES,
        GOVERNORATES,
        CITIES,
        OFFICES,
        USERS,
        EMPLOYEE_ROLES,
        getCountries,
        getCountryById,
        getCountryByCode,
        isSyria,
        getGovernorates,
        getCitiesByCountry,
        getCitiesByGovernorate,
        getPhysicalOffices,
        getOfficesByCity,
        getOfficesByGovernorate,
        getVirtualOffice,
        getDelegatesByCountry,
        getDelegatesByCity,
        getActiveDelegates,
        getEmployeeRoles,
        getManagers,
        getAllEmployees,
        prepareTransferAPIObject,
        prepareEmployeeAPIObject,
        prepareOfficeAPIObject
    };
}
