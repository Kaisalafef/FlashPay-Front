# Frontend Architecture Testing Checklist
## Critical-Path Testing for Role-Based Dashboard

### Pre-Test Setup
1. Open browser DevTools (F12) → Console tab
2. Clear browser cache/localStorage:
   ```javascript
   localStorage.clear();
   location.reload();
   ```
3. Verify no console errors on initial load

---

## Test 1: Super Admin Role (Full Access)

### Steps:
1. **Initial Load**
   - [ ] Page loads with loading screen (briefly shows)
   - [ ] Dashboard appears with stats cards visible
   - [ ] No console errors

2. **Navigation Visibility**
   - [ ] Sidebar shows ALL nav items:
     - لوحة التحكم (Dashboard)
     - المكاتب (Offices)
     - الموظفين (Employees)
     - الحوالات (Transfers)
     - التقارير (Reports)
     - صندوق التداول (Fund Box)
   - [ ] Office selector dropdown visible in header (المكتب: جميع المكاتب)
   - [ ] Role switcher shows "صلاحية: المدير العام (Super Admin)"

3. **Section Access**
   - [ ] Click "المكاتب" → Office management section appears
   - [ ] Click "الموظفين" → Employee management section appears
   - [ ] Click "الحوالات" → Transfers section appears
   - [ ] Click "التقارير" → Reports section appears
   - [ ] Click "صندوق التداول" → Fund Box section appears
   - [ ] Click "لوحة التحكم" → Returns to dashboard

4. **Office Selector Functionality**
   - [ ] Click office selector dropdown
   - [ ] Select "مكتب دمشق المركزي"
   - [ ] Verify context changes (console: "🏢 Office context updated")
   - [ ] Data should refresh for selected office

---

## Test 2: Admin Role (Office-Specific)

### Steps:
1. **Switch to Admin**
   - [ ] Use role switcher → select "مدير مكتب (Admin)"
   - [ ] Page reloads/re-renders

2. **Navigation Visibility**
   - [ ] Sidebar shows ONLY:
     - لوحة التحكم (Dashboard) ✓
     - الحوالات (Transfers) ✓
     - التقارير (Reports) ✓
   - [ ] Sidebar does NOT show:
     - المكاتب (Offices) ✗
     - الموظفين (Employees) ✗
     - صندوق التداول (Fund Box) ✗
   - [ ] Office selector is HIDDEN
   - [ ] Current office display shows "مكتب دمشق المركزي" (or assigned office)

3. **Section Access**
   - [ ] Click "الحوالات" → Transfers section appears
   - [ ] Click "التقارير" → Reports section appears (office-specific)
   - [ ] Verify no access to employee management or office management

4. **Attempt Unauthorized Access**
   - [ ] Try to manually navigate to #role-employees in URL
   - [ ] Should be blocked or redirected to dashboard

---

## Test 3: Accountant Role (Accounting-Only)

### Steps:
1. **Switch to Accountant**
   - [ ] Use role switcher → select "محاسب (Accountant)"
   - [ ] Page reloads/re-renders

2. **Navigation Visibility**
   - [ ] Sidebar shows ONLY:
     - لوحة التحكم (Dashboard) ✓ (limited stats)
     - المحاسبة (Accounting) ✓
   - [ ] Sidebar does NOT show:
     - الحوالات (Transfers) ✗
     - الموظفين (Employees) ✗
     - المكاتب (Offices) ✗
     - التقارير (Reports) ✗
     - صندوق التداول (Fund Box) ✗
   - [ ] Office selector is HIDDEN

3. **Section Access**
   - [ ] Only "النظام المحاسبي" section visible
   - [ ] Stats show accounting-specific metrics
   - [ ] Daily transactions table visible

4. **Verify Restrictions**
   - [ ] Cannot access transfer creation
   - [ ] Cannot view employee data
   - [ ] Cannot view office management

---

## Test 4: Cashier Role (Transfers-Only)

### Steps:
1. **Switch to Cashier**
   - [ ] Use role switcher → select "أمين صندوق (Cashier)"
   - [ ] Page reloads/re-renders

2. **Navigation Visibility**
   - [ ] Sidebar shows ONLY:
     - لوحة التحكم (Dashboard) ✓ (minimal)
     - الحوالات (Transfers) ✓
   - [ ] Sidebar does NOT show:
     - التقارير (Reports) ✗
     - الموظفين (Employees) ✗
     - المكاتب (Offices) ✗
     - صندوق التداول (Fund Box) ✗
   - [ ] Office selector is HIDDEN

3. **Section Access**
   - [ ] Only "إدارة الحوالات" section visible
   - [ ] Can view pending transfers
   - [ ] Can approve/reject transfers

4. **Verify Restrictions**
   - [ ] Cannot access reports
   - [ ] Cannot view employee data
   - [ ] Cannot access accounting section

---

## Test 5: Navigation & Section Switching

### Steps:
1. **Smooth Transitions**
   - [ ] Click between nav items
   - [ ] Sections switch with fade animation
   - [ ] No page reload (SPA behavior)
   - [ ] Active nav item highlighted

2. **Active State**
   - [ ] Click "الحوالات" → nav item gets active class (blue highlight)
   - [ ] Click "التقارير" → previous nav inactive, new nav active
   - [ ] Page title updates in header

3. **Direct URL Access**
   - [ ] Visit Dashboard.html#role-transfers
   - [ ] Should show transfers section directly
   - [ ] Correct nav item should be active

---

## Test 6: Initialization & Loading

### Steps:
1. **Clear Storage & Reload**
   ```javascript
   localStorage.clear();
   location.reload();
   ```

2. **Verify Defaults**
   - [ ] Loading screen appears briefly
   - [ ] Defaults to Super Admin role
   - [ ] Dashboard section visible
   - [ ] All Super Admin nav items shown

3. **Role Persistence**
   - [ ] Switch to Admin role
   - [ ] Reload page (F5)
   - [ ] Should remember Admin role
   - [ ] Check localStorage: `localStorage.getItem('userRole')` → "admin"

---

## Test 7: Console Error Check

### Steps:
1. **Open DevTools Console**
2. **Perform These Actions:**
   - [ ] Load page → no errors
   - [ ] Switch roles → no errors
   - [ ] Navigate sections → no errors
   - [ ] Click office selector → no errors
   - [ ] Submit forms → no errors

3. **Expected Console Messages (Informational):**
   ```
   ✅ RBAC Applied: المدير العام (super_admin)
   ✅ RBAC Applied: مدير مكتب (admin)
   🏢 Office context initialized: {officeId: 1, ...}
   ```

4. **No Red Errors Should Appear**

---

## Test 8: Mobile Responsiveness (Quick Check)

### Steps:
1. **Open DevTools → Toggle Device Toolbar (Ctrl+Shift+M)**
2. **Select iPhone SE or similar**
3. **Verify:**
   - [ ] Mobile menu toggle button visible (hamburger icon)
   - [ ] Sidebar collapses/expandable
   - [ ] Nav items stack properly
   - [ ] Content readable without horizontal scroll

---

## Success Criteria

✅ **PASS** if:
- All role switches work correctly
- Navigation items show/hide per role
- Sections display correct content
- No console errors
- Office selector logic correct
- Smooth transitions between sections

❌ **FAIL** if:
- Any role shows wrong navigation items
- Sections don't switch properly
- Console shows red errors
- Office selector visible for non-Super-Admin
- Page requires reload to switch roles

---

## Bug Reporting Template

If you find issues, report with:

```
**Role:** [Super Admin/Admin/Accountant/Cashier]
**Action:** [What you clicked/did]
**Expected:** [What should happen]
**Actual:** [What actually happened]
**Console Error:** [Copy any red errors]
**Screenshot:** [If applicable]
```

---

## Quick Verification Commands

Run in console to verify state:

```javascript
// Check current role
console.log("Current role:", localStorage.getItem('userRole'));

// Check office context
console.log("Office context:", window.getOfficeContext?.());

// Check permissions
console.log("Can manage employees:", window.canManageEmployees?.('create'));

// Check if Super Admin
console.log("Is Super Admin:", window.isSuperAdmin?.());
