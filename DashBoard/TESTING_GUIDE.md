# FlashPay Dashboard - Testing Guide

## Quick Start

1. Open `DashBoard/Dashboard.html` in your browser
2. The loading screen should appear briefly
3. Super Admin dashboard should load by default
4. Check browser console for any errors (F12 → Console)

## What to Test

### 1. Role Switching (Top Right Dropdown)

Test each role and verify the sidebar shows correct items:

| Role | Expected Sidebar Items | Office Selector |
|------|------------------------|-----------------|
| Super Admin | Dashboard, Offices, Employees, Transfers, Reports, Fund Box | ✅ Visible |
| Admin | Dashboard, Transfers, Reports | ❌ Hidden |
| Accountant | Dashboard, Accounting | ❌ Hidden |
| Cashier | Dashboard, Transfers | ❌ Hidden |

### 2. Section Navigation

Click each sidebar item and verify:
- Section switches smoothly
- Content appears correctly
- Page title updates
- Active item highlighted in sidebar

### 3. Office Selector (Super Admin Only)

1. Switch to Super Admin role
2. Verify office selector dropdown is visible
3. Try switching between offices
4. Verify notification appears confirming the switch

### 4. Check for Errors

Open browser console (F12) and verify:
```
✅ No "switchRole is not defined" errors
✅ No "showSection is not defined" errors  
✅ No "ROLE_PERMISSIONS is not defined" errors
✅ No duplicate function warnings
```

## Expected Console Output

On successful load, you should see:
```
🏢 Office context initialized: {officeId: null, isAllOffices: true, ...}
✅ RBAC Applied: المدير العام (super_admin)
Allowed sections: ['section-stats', 'role-transfers', ...]
🔐 Auth Service initialized
Dashboard HTML loaded - waiting for rbac.js initialization
```

## Common Issues & Solutions

### Issue: "switchRole is not defined"
**Cause**: auth.js and rbac.js both defined switchRole
**Solution**: ✅ Fixed - only rbac.js has switchRole now

### Issue: "showSection is not defined"  
**Cause**: Multiple files defined showSection
**Solution**: ✅ Fixed - only navigation.js has showSection

### Issue: Sidebar shows all items for all roles
**Cause**: Hardcoded navigation in HTML
**Solution**: ✅ Fixed - navigation now generated dynamically

### Issue: Office selector visible for all roles
**Cause**: No role-based visibility check
**Solution**: ✅ Fixed - selector only shows for Super Admin

### Issue: Blank screen after role switch
**Cause**: Conflicting section visibility logic
**Solution**: ✅ Fixed - single source of truth in rbac.js

## File Structure After Fix

```
DashBoard/
├── Dashboard.html          # Updated: Dynamic sidebar, correct script order
├── css/
│   ├── main.css
│   ├── mobile.css
│   └── polymorphic.css
└── js/
    ├── rbac.js             # ✅ Single source of truth for roles
    ├── auth.js             # ✅ Utilities only (no role logic)
    ├── navigation.js       # ✅ Section switching only
    ├── api-service.js      # ✅ API calls only
    ├── admin.js            # ✅ Admin functions only
    ├── accounter.js        # Accountant functions
    ├── forms/
    │   ├── office-form.js
    │   ├── employee-form.js
    │   └── transfer-form.js
    ├── services/
    │   ├── laravel-api.js
    │   └── auth-service.js
    └── data/
        └── mock-data.js
```

## Code Quality Improvements

### Before Fix:
- ❌ 2 role management systems
- ❌ 3 showSection implementations
- ❌ 3 showNotification functions
- ❌ Hardcoded sidebar
- ❌ No loading screen
- ❌ Confusing script order

### After Fix:
- ✅ 1 role management system (rbac.js)
- ✅ 1 showSection implementation (navigation.js)
- ✅ 1 showNotification function (auth.js)
- ✅ Dynamic sidebar based on role
- ✅ Loading screen during init
- ✅ Clear script loading order

## API Security

All API calls now:
1. Check permissions before executing
2. Include office context for data isolation
3. Show Arabic error messages
4. Redirect to login on 401 errors

Example:
```javascript
async function createOffice(officeData) {
    if (!AuthService.isSuperAdmin()) {
        showNotification('غير مصرح: فقط المدير العام يمكنه إضافة مكاتب', 'error');
        return { success: false, message: 'Permission denied' };
    }
    return await LaravelAPI.post('/offices', officeData);
}
```

## Role Permissions Reference

```javascript
SUPER_ADMIN:
  - Sections: All (Dashboard, Offices, Employees, Transfers, Reports, Fund Box)
  - Can: Create/edit/delete offices, create/edit/delete employees, view all reports, access Fund Box
  - Office Selector: Yes (can switch between all offices)

ADMIN:
  - Sections: Dashboard, Transfers, Reports
  - Can: View office-specific transfers and reports
  - Cannot: Create employees, access other offices, access Fund Box
  - Office Selector: No (auto-assigned to one office)

ACCOUNTANT:
  - Sections: Accounting Dashboard only
  - Can: View financial reports, manage accounting
  - Cannot: Access employees, offices, transfers (except view), Fund Box
  - Office Selector: No

CASHIER:
  - Sections: Transfers only
  - Can: View outgoing transfers, approve transfers
  - Cannot: Access reports, employees, offices, Fund Box
  - Office Selector: No
```

## Success Criteria

✅ All roles load correct sections
✅ Sidebar shows only permitted items
✅ Office selector works for Super Admin only
✅ No console errors
✅ Smooth transitions between sections
✅ API calls respect role permissions
✅ Loading screen prevents flickering

## Need Help?

If you encounter issues:

1. Check browser console for errors
2. Verify script loading order in Dashboard.html
3. Check that rbac.js loads before auth.js
4. Verify ROLE_PERMISSIONS is defined
5. Check that initApp() is being called

## Next Steps

After verification:
1. Connect to actual Laravel API endpoints
2. Implement real authentication (JWT tokens)
3. Add WebSocket for real-time updates
4. Implement offline mode
5. Add comprehensive audit logging
