# Comprehensive Testing Guide - FlashPay Dashboard

## Overview
This guide provides thorough testing procedures for all refactored modules.

---

## 1. Office Form Testing

### Test Case 1.1: Form Structure Verification
**Steps:**
1. Navigate to Dashboard → Office Management section
2. Verify form has exactly 5 fields in this order:
   - Office Name (اسم المكتب)
   - Governorate (المحافظة)
   - City (المدينة)
   - Opening Price (السعر الافتتاحي)
   - Phone Number (رقم الهاتف)

**Expected Result:** No extra fields visible

### Test Case 1.2: Governorate-City Cascade
**Steps:**
1. Select Governorate = "دمشق"
2. Check City dropdown options

**Expected Result:** Cities should show: دمشق, جرمانا, داريا, صحنايا

### Test Case 1.3: Form Validation
**Test Invalid Scenarios:**
- Empty Office Name → Error: "يرجى إدخال اسم المكتب (3 أحرف على الأقل)"
- Empty Governorate → Error: "يرجى اختيار المحافظة"
- Empty City → Error: "يرجى اختيار المدينة"
- Negative Opening Price → Error: "يرجى إدخال سعر افتتاح صحيح"
- Short Phone (< 8 chars) → Error: "يرجى إدخال رقم هاتف صحيح"

### Test Case 1.4: Successful Submission
**Steps:**
1. Fill all fields with valid data:
   - Name: "مكتب اختبار"
   - Governorate: "دمشق"
   - City: "دمشق"
   - Opening Price: "5000"
   - Phone: "+963 11 1234567"
2. Click "حفظ المكتب الجديد"

**Expected Result:** 
- Success notification: "تم إنشاء "مكتب اختبار" بنجاح!"
- Form resets to empty state

### Test Case 1.5: API Payload Verification
**Steps:**
1. Open browser DevTools → Network tab
2. Submit form (when API is connected)
3. Check POST request to `/api/offices`

**Expected Payload:**
```json
{
  "name": "مكتب اختبار",
  "governorate_id": 1,
  "city_id": 1,
  "opening_price": 5000,
  "phone": "+963 11 1234567",
  "is_active": true
}
```

**Expected Headers:**
```
Content-Type: application/json
Accept: application/json
X-CSRF-TOKEN: {token}
```

---

## 2. Employee Form Testing

### Test Case 2.1: Role Dropdown Verification
**Steps:**
1. Click "إضافة موظف جديد" button
2. Check "نوع الموظف" dropdown options

**Expected Options:**
- مندوب (Agent)
- كاشير (Cashier)
- مدير مكتب (Office Manager)
- محاسب (Accountant)

**Verify Absent:** "وكيل دولي" or "International Agent" should NOT exist

### Test Case 2.2: Agent Role Conditional UI
**Steps:**
1. Select Role = "مندوب (Agent)"
2. Observe form fields

**Expected Result:**
- ✅ Country dropdown visible (الدولة)
- ✅ Governorate dropdown visible (المحافظة) - for Syria
- ✅ City dropdown visible (المدينة)
- ❌ Office section hidden (المكتب)

### Test Case 2.3: Non-Agent Role Conditional UI
**Steps:**
1. Select Role = "كاشير (Cashier)"
2. Observe form fields

**Expected Result:**
- ❌ Country dropdown hidden
- ❌ Governorate dropdown hidden
- ❌ City dropdown hidden
- ✅ Office section visible with required indicator (*)

### Test Case 2.4: Agent Form Validation
**Steps:**
1. Select Role = "مندوب"
2. Fill: Name, Phone
3. Leave Country empty
4. Submit form

**Expected Result:** Error: "يرجى اختيار الدولة"

### Test Case 2.5: Non-Agent Form Validation
**Steps:**
1. Select Role = "كاشير"
2. Fill: Name, Phone
3. Leave Office empty
4. Submit form

**Expected Result:** Error: "يرجى اختيار المكتب (إلزامي لغير المندوبين)"

### Test Case 2.6: Agent with Syria Selection
**Steps:**
1. Select Role = "مندوب"
2. Select Country = "سوريا"
3. Check Governorate dropdown

**Expected Result:** Governorate dropdown appears with Syrian governorates

### Test Case 2.7: Agent with Non-Syria Selection
**Steps:**
1. Select Role = "مندوب"
2. Select Country = "الإمارات العربية المتحدة"
3. Check form fields

**Expected Result:**
- Governorate dropdown hidden
- City dropdown shows UAE cities (دبي, أبوظبي, etc.)

### Test Case 2.8: Successful Agent Submission
**Steps:**
1. Select Role = "مندوب"
2. Fill all required fields:
   - Name: "أحمد المندوب"
   - Phone: "+963 955 123456"
   - Country: "سوريا"
   - Governorate: "دمشق"
   - City: "دمشق"
3. Submit

**Expected Payload:**
```json
{
  "name": "أحمد المندوب",
  "phone": "+963 955 123456",
  "role": "agent",
  "country_id": 1,
  "city_id": 1,
  "governorate_id": 1,
  "office_id": null,
  "is_active": true
}
```

### Test Case 2.9: Successful Non-Agent Submission
**Steps:**
1. Select Role = "كاشير"
2. Fill all required fields:
   - Name: "سارة الكاشير"
   - Phone: "+963 955 654321"
   - Office: "مكتب دمشق المركزي"
3. Submit

**Expected Payload:**
```json
{
  "name": "سارة الكاشير",
  "phone": "+963 955 654321",
  "role": "cashier",
  "office_id": 1,
  "is_active": true
}
```

### Test Case 2.10: Complete Form Data
**Steps:**
1. Fill all optional fields:
   - Email: "test@example.com"
   - Password: "password123"
   - Hire Date: "2024-01-15"
   - Salary: "5000"
   - Notes: "موظف جديد"
2. Submit

**Expected Result:** All fields included in API payload

---

## 3. Navigation Testing

### Test Case 3.1: Smooth Scroll to Section
**Steps:**
1. Click "الحوالات" in left navigation
2. Observe page behavior

**Expected Result:**
- Page smoothly scrolls to #role-super-admin section
- URL updates to: `#role-super-admin`
- No page reload occurs

### Test Case 3.2: Active State Highlighting
**Steps:**
1. Click "الموظفين" in navigation
2. Scroll up and down manually

**Expected Result:**
- "الموظفين" button stays highlighted while section is in view
- Other buttons not highlighted

### Test Case 3.3: Header Offset Verification
**Steps:**
1. Click any navigation item
2. Check section position relative to header

**Expected Result:**
- Section starts 20px below header (no overlap)
- Content fully visible

### Test Case 3.4: Scroll Spy Accuracy
**Steps:**
1. Slowly scroll through all sections
2. Observe navigation highlighting

**Expected Result:**
- Active nav item changes as you scroll through sections
- Highlighting is accurate and responsive

### Test Case 3.5: Mobile Menu Close
**Steps:**
1. Open mobile menu (if on mobile/tablet)
2. Click any navigation item

**Expected Result:**
- Menu closes automatically
- Smooth scroll to section occurs

### Test Case 3.6: URL Hash Handling
**Steps:**
1. Click "التقارير" navigation
2. Copy URL (should include #role-accountant)
3. Open URL in new tab

**Expected Result:**
- Page loads and auto-scrolls to reports section
- Correct nav item highlighted

### Test Case 3.7: Scroll to Top
**Steps:**
1. Scroll down to any section
2. Click logo or "scroll to top" button (if available)

**Expected Result:**
- Smooth scroll to top of page
- URL hash cleared
- Dashboard nav item highlighted

### Test Case 3.8: Performance Test
**Steps:**
1. Rapidly click different nav items
2. Scroll quickly up and down

**Expected Result:**
- No lag or freezing
- Smooth animations throughout
- No duplicate highlight changes

---

## 4. Integration Testing

### Test Case 4.1: Page Load Verification
**Steps:**
1. Open Dashboard.html
2. Open browser console (F12)

**Expected Result:**
- No JavaScript errors
- No 404 errors for resources
- All scripts load successfully

### Test Case 4.2: Global Function Availability
**Steps:**
1. Open browser console
2. Type: `window.initOfficeForm`
3. Type: `window.initEmployeeForm`
4. Type: `window.initNavigation`

**Expected Result:** All should return function definitions (not undefined)

### Test Case 4.3: Mock Data Availability
**Steps:**
1. Open console
2. Type: `getCountries()`
3. Type: `getGovernorates(1)`
4. Type: `getOfficesByCity(1)`

**Expected Result:** All should return arrays with data

---

## 5. Edge Case Testing

### Test Case 5.1: Rapid Role Switching
**Steps:**
1. Open Employee modal
2. Rapidly switch between Agent and Cashier roles
3. Observe field visibility

**Expected Result:** Fields toggle correctly without glitches

### Test Case 5.2: Invalid API Response
**Steps:**
1. (When API connected) Simulate server error
2. Submit form

**Expected Result:** Error notification displayed, form not reset

### Test Case 5.3: Network Failure
**Steps:**
1. (When API connected) Disconnect network
2. Submit form

**Expected Result:** Error notification with appropriate message

### Test Case 5.4: XSS Prevention
**Steps:**
1. Enter in Office Name: `<script>alert('xss')</script>`
2. Submit form

**Expected Result:** Text treated as string, no script execution

### Test Case 5.5: Very Long Inputs
**Steps:**
1. Enter 500+ character string in name field
2. Submit form

**Expected Result:** Form handles gracefully (validation or truncation)

---

## 6. Browser Compatibility

### Tested Browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

### Features to Verify per Browser:
- [ ] Smooth scroll behavior
- [ ] CSS animations
- [ ] Form validation
- [ ] Modal functionality
- [ ] Dropdown cascades

---

## 7. Accessibility Testing

### Test Case 7.1: Keyboard Navigation
**Steps:**
1. Use Tab key to navigate through form
2. Use Enter to submit

**Expected Result:** All fields accessible via keyboard

### Test Case 7.2: Screen Reader Compatibility
**Steps:**
1. Enable screen reader
2. Navigate form fields

**Expected Result:** Labels and inputs properly announced

### Test Case 7.3: Focus Indicators
**Steps:**
1. Tab through all interactive elements

**Expected Result:** Clear focus indicators visible

---

## Test Results Log

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1.1 | ⬜ | |
| 1.2 | ⬜ | |
| 1.3 | ⬜ | |
| 1.4 | ⬜ | |
| 1.5 | ⬜ | |
| 2.1 | ⬜ | |
| 2.2 | ⬜ | |
| 2.3 | ⬜ | |
| 2.4 | ⬜ | |
| 2.5 | ⬜ | |
| 2.6 | ⬜ | |
| 2.7 | ⬜ | |
| 2.8 | ⬜ | |
| 2.9 | ⬜ | |
| 2.10 | ⬜ | |
| 3.1 | ⬜ | |
| 3.2 | ⬜ | |
| 3.3 | ⬜ | |
| 3.4 | ⬜ | |
| 3.5 | ⬜ | |
| 3.6 | ⬜ | |
| 3.7 | ⬜ | |
| 3.8 | ⬜ | |
| 4.1 | ⬜ | |
| 4.2 | ⬜ | |
| 4.3 | ⬜ | |
| 5.1 | ⬜ | |
| 5.2 | ⬜ | |
| 5.3 | ⬜ | |
| 5.4 | ⬜ | |
| 5.5 | ⬜ | |

---

## Sign-off Checklist

- [ ] All Office Form tests passed
- [ ] All Employee Form tests passed
- [ ] All Navigation tests passed
- [ ] All Integration tests passed
- [ ] Edge cases handled correctly
- [ ] Browser compatibility verified
- [ ] Accessibility requirements met
- [ ] No console errors
- [ ] API payloads correct
- [ ] Business logic verified

**Tester Name:** _________________
**Date:** _________________
**Signature:** _________________
