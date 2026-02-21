# FlashPay RBAC Guide
## Role-Based Access Control Implementation

---

## Table of Contents
1. [Overview](#overview)
2. [Role Definitions](#role-definitions)
3. [Permission Matrix](#permission-matrix)
4. [Office Isolation](#office-isolation)
5. [Implementation Details](#implementation-details)
6. [API Security](#api-security)
7. [Frontend Integration](#frontend-integration)
8. [Testing Guide](#testing-guide)

---

## Overview

FlashPay implements a strict Role-Based Access Control (RBAC) system with four primary roles:

1. **SUPER_ADMIN** - System administrator with full access
2. **ADMIN** - Office manager with limited access
3. **ACCOUNTANT** - Financial officer with accounting-only access
4. **CASHIER** - Transfer operator with outgoing-only access

**Key Principles:**
- Principle of Least Privilege (PoLP)
- Office-based data isolation
- No privilege escalation
- Complete audit trail

---

## Role Definitions

### SUPER_ADMIN (المدير العام)

**Level:** 1 (Highest)

**Description:**
The system administrator with complete control over the entire FlashPay network.

**Capabilities:**
- ✅ Create, edit, and delete offices
- ✅ Create and manage all employees (Admin, Accountant, Cashier)
- ✅ Access ALL offices and their data
- ✅ View all reports (financial, transfer, performance)
- ✅ View and manage all transfers
- ✅ Access Buy/Sell Fund Box (Trading Box)
- ✅ Manual office selection via dropdown
- ✅ Full dashboard analytics across entire company

**Restrictions:**
- ❌ None

**Default Route:** Dashboard with full analytics

---

### ADMIN (مدير مكتب)

**Level:** 2

**Description:**
Office manager responsible for day-to-day operations of a single office.

**Capabilities:**
- ✅ Manage office operations
- ✅ View office-specific transfers
- ✅ View office-specific reports
- ✅ Edit employee information (view only, no create/delete)

**Restrictions:**
- ❌ Cannot create or add employees
- ❌ Cannot delete employees
- ❌ Cannot access other offices
- ❌ Cannot view system-wide reports
- ❌ No office selector (auto-assigned)
- ❌ Cannot access fund box

**Auto-Assignment:**
- Automatically linked to ONE office only
- System displays ONLY their assigned office data
- No manual office selection allowed

**Default Route:** Office dashboard

---

### ACCOUNTANT (محاسب)

**Level:** 3

**Description:**
Financial officer responsible for accounting and financial records.

**Capabilities:**
- ✅ Access company accounts (financial accounting section)
- ✅ Record financial transactions
- ✅ View financial dashboard
- ✅ Generate accounting reports

**Restrictions:**
- ❌ Cannot access employee management
- ❌ Cannot access office management
- ❌ Cannot view transfers (outside accounting scope)
- ❌ Cannot create transfers
- ❌ Cannot access reports module
- ❌ No office selector (if assigned, auto-assigned)

**Data Access:** Accounting records only

**Default Route:** Accounting dashboard

---

### CASHIER (أمين صندوق)

**Level:** 4

**Description:**
Transfer operator responsible for processing outgoing remittances.

**Capabilities:**
- ✅ View outgoing transfers (Remittances outside Syria)
- ✅ Accept/approve transfers
- ✅ Process transfer requests

**Restrictions:**
- ❌ Cannot access reports
- ❌ Cannot access employee management
- ❌ Cannot access office management
- ❌ Cannot view internal transfers (within Syria)
- ❌ No office selector (auto-assigned to one office)

**Auto-Assignment:**
- Automatically restricted to assigned office
- Cannot select office manually
- Only sees outgoing international transfers

**Default Route:** Transfers management

---

## Permission Matrix

### Section Access

| Section | SUPER_ADMIN | ADMIN | ACCOUNTANT | CASHIER |
|---------|:-----------:|:-----:|:----------:|:-------:|
| Dashboard (Full) | ✅ | ✅ | ⚠️ | ⚠️ |
| Dashboard (Office) | ✅ | ✅ | ❌ | ❌ |
| Dashboard (Accounting) | ✅ | ❌ | ✅ | ❌ |
| Transfers (All) | ✅ | ✅ | ❌ | ❌ |
| Transfers (Outgoing) | ✅ | ✅ | ❌ | ✅ |
| Transfers (Internal) | ✅ | ✅ | ❌ | ❌ |
| Employees (Create) | ✅ | ❌ | ❌ | ❌ |
| Employees (View) | ✅ | ✅ | ❌ | ❌ |
| Employees (Edit) | ✅ | ✅ | ❌ | ❌ |
| Employees (Delete) | ✅ | ❌ | ❌ | ❌ |
| Offices (Manage) | ✅ | ❌ | ❌ | ❌ |
| Offices (View) | ✅ | ✅ | ❌ | ❌ |
| Reports (All) | ✅ | ❌ | ❌ | ❌ |
| Reports (Office) | ✅ | ✅ | ❌ | ❌ |
| Fund Box | ✅ | ❌ | ❌ | ❌ |
| Accounting | ✅ | ❌ | ✅ | ❌ |

**Legend:**
- ✅ Full Access
- ⚠️ Limited Access
- ❌ No Access

### API Permissions

| Permission | SUPER_ADMIN | ADMIN | ACCOUNTANT | CASHIER |
|------------|:-----------:|:-----:|:----------:|:-------:|
| read | ✅ | ✅ | ✅ | ✅ |
| write | ✅ | ✅ | ⚠️ | ❌ |
| delete | ✅ | ❌ | ❌ | ❌ |
| admin | ✅ | ❌ | ❌ | ❌ |
| manage_offices | ✅ | ❌ | ❌ | ❌ |
| manage_employees | ✅ | ❌ | ❌ | ❌ |
| office_manage | ✅ | ✅ | ❌ | ❌ |
| accounting_write | ✅ | ❌ | ✅ | ❌ |
| approve_transfers | ✅ | ✅ | ❌ | ✅ |
| view_all_reports | ✅ | ❌ | ❌ | ❌ |
| fund_trading | ✅ | ❌ | ❌ | ❌ |

---

## Office Isolation

### Data Isolation Rules

#### 1. Super Admin
```javascript
// Can access all offices
dataAccess: 'all'
canAccessAllOffices: true
hasOfficeSelector: true

// Query filter: No filter applied
{}
```

#### 2. Admin
```javascript
// Can only access assigned office
dataAccess: 'office_only'
canAccessAllOffices: false
hasOfficeSelector: false

// Query filter
{ office_id: assignedOfficeId }
```

#### 3. Accountant
```javascript
// Can only access accounting data from assigned office
dataAccess: 'accounting_only'
canAccessAllOffices: false
hasOfficeSelector: false

// Query filter
{ office_id: assignedOfficeId, type: 'accounting' }
```

#### 4. Cashier
```javascript
// Can only access outgoing transfers from assigned office
dataAccess: 'transfers_only'
canAccessAllOffices: false
hasOfficeSelector: false

// Query filter
{ 
  office_id: assignedOfficeId, 
  transfer_type: 'outgoing',
  destination_country: { $ne: 'SY' }
}
```

### Office Context Object

```javascript
{
  officeId: number | null,        // Current office ID (null = all offices)
  officeName: string | null,      // Office name display
  isAllOffices: boolean,          // Viewing all offices flag
  userAssignedOffice: number | null, // User's fixed office (non-super-admin)
  dataAccess: 'all' | 'office_only' | 'accounting_only' | 'transfers_only'
}
```

---

## Implementation Details

### Frontend RBAC (rbac.js)

```javascript
// Role configuration
const ROLE_PERMISSIONS = {
  super_admin: {
    level: 1,
    allowedSections: ['section-stats', 'role-transfers', 'role-employees', 
                      'role-super-admin', 'role-fund-box', 'role-reports'],
    hasOfficeSelector: true,
    canAccessAllOffices: true,
    // ...
  },
  admin: {
    level: 2,
    allowedSections: ['section-stats', 'role-transfers', 'role-admin', 'role-reports'],
    hasOfficeSelector: false,  // IMPORTANT: No selector
    canAccessAllOffices: false,
    restrictions: {
      cannotCreateEmployees: true,
      cannotDeleteEmployees: true,
      officeLocked: true
    }
  }
  // ...
};
```

### Backend Middleware Chain

```javascript
// Example protected route
app.get('/api/employees',
  authenticateToken,        // 1. Verify JWT
  attachOfficeContext,      // 2. Extract office context
  applyOfficeFilter,        // 3. Apply data filters
  restrictToAccounting,     // 4. Role-specific restrictions
  (req, res) => {           // 5. Handler
    // Only filtered data is accessible
    const employees = db.employees.filter(req.officeFilter);
    res.json({ data: employees });
  }
);
```

### Permission Checking

```javascript
// Check specific permission
function hasPermission(permission) {
  const role = ROLE_PERMISSIONS[currentUserRole];
  return role.apiPermissions.includes(permission);
}

// Check resource access
function canAccessResource(role, resource, action) {
  if (role === 'super_admin') return true;
  
  switch(resource) {
    case 'employees':
      if (role === 'admin') return ['read', 'edit'].includes(action);
      return false; // Accountant, Cashier cannot access
  }
}
```

---

## API Security

### Authentication Headers

```http
GET /api/employees
Authorization: Bearer <jwt_token>
X-User-Role: admin
X-User-Token: <token>
X-Office-Context: 1
X-Data-Access: office_only
```

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "غير مصرح: لم يتم توفير رمز المصادقة",
  "code": "NO_TOKEN"
}
```

#### 403 Forbidden - Role
```json
{
  "success": false,
  "message": "غير مصرح: ليس لديك الصلاحية المطلوبة",
  "code": "INSUFFICIENT_ROLE",
  "requiredRoles": ["super_admin"],
  "currentRole": "admin"
}
```

#### 403 Forbidden - Office
```json
{
  "success": false,
  "message": "غير مصرح: لا يمكنك الوصول إلى بيانات هذا المكتب",
  "code": "OFFICE_ACCESS_DENIED",
  "requestedOffice": 2,
  "userOffice": 1
}
```

#### 403 Forbidden - Permission
```json
{
  "success": false,
  "message": "غير مصرح: مدير المكتب لا يمكنه إضافة موظفين",
  "code": "ADMIN_CANNOT_MANAGE_EMPLOYEES"
}
```

---

## Frontend Integration

### Office Selector (Super Admin Only)

```html
<!-- Only visible to Super Admin -->
<div id="office-selector-container" class="hidden">
  <select id="office-selector" onchange="onOfficeChange(this.value)">
    <option value="all">جميع المكاتب</option>
    <option value="1">مكتب دمشق المركزي</option>
    <option value="2">مكتب حلب</option>
    <!-- ... -->
  </select>
</div>

<!-- Display for other roles -->
<div id="current-office-display" class="hidden">
  المكتب: <span id="office-name">مكتب دمشق</span>
</div>
```

```javascript
function onOfficeChange(officeId) {
  // Only works for Super Admin
  if (!isSuperAdmin()) {
    showNotification('غير مصرح: لا يمكنك تبديل المكتب', 'error');
    return;
  }
  
  setOfficeContext(officeId);
  refreshDataForOffice();
}
```

### Section Visibility

```javascript
// In updateUIForRole()
permissions.allowedSections.forEach(sectionId => {
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.remove('hidden');
    section.classList.add('rbac-visible');
  }
});
```

### API Calls with Context

```javascript
async function fetchEmployees() {
  const headers = {
    ...getRoleHeaders(),  // Includes role, token, office context
    'Content-Type': 'application/json'
  };
  
  const response = await fetch('/api/employees', { headers });
  
  if (response.status === 403) {
    showNotification('غير مصرح: ليس لديك صلاحية', 'error');
    return;
  }
  
  return response.json();
}
```

---

## Testing Guide

### Test Scenarios

#### 1. Super Admin Tests
```javascript
// Test: Can access all offices
switchRole('super_admin');
setOfficeContext(null); // All offices
const allTransfers = await fetchTransfers();
assert(allTransfers.length === totalTransfers);

// Test: Can switch offices
setOfficeContext(1);
const office1Data = await fetchTransfers();
assert(every(office1Data, t => t.office_id === 1));

// Test: Can create employees
const result = await createEmployee({...});
assert(result.success === true);

// Test: Can access fund box
const fundBox = await fetchFundBox();
assert(fundBox.success === true);
```

#### 2. Admin Tests
```javascript
// Test: Auto-assigned to office
switchRole('admin');
const context = getOfficeContext();
assert(context.officeId !== null);
assert(context.isAllOffices === false);

// Test: Cannot switch offices
const result = setOfficeContext(2); // Different office
assert(result === false);

// Test: Cannot create employees
try {
  await createEmployee({...});
  assert(false); // Should not reach here
} catch (e) {
  assert(e.code === 'ADMIN_CANNOT_MANAGE_EMPLOYEES');
}

// Test: Office-specific data only
const transfers = await fetchTransfers();
assert(every(transfers, t => t.office_id === context.officeId));
```

#### 3. Accountant Tests
```javascript
// Test: Can only access accounting
switchRole('accountant');
const sections = getAllowedSections();
assert(sections.includes('role-accountant'));
assert(!sections.includes('role-transfers'));
assert(!sections.includes('role-employees'));

// Test: Cannot access transfers
try {
  await fetchTransfers();
  assert(false);
} catch (e) {
  assert(e.code === 'ACCOUNTING_ONLY');
}
```

#### 4. Cashier Tests
```javascript
// Test: Can only see outgoing transfers
switchRole('cashier');
const transfers = await fetchTransfers();
assert(every(transfers, t => t.transfer_type === 'outgoing'));
assert(every(transfers, t => t.destination_country !== 'SY'));

// Test: Cannot access reports
try {
  await fetchReports();
  assert(false);
} catch (e) {
  assert(e.code === 'TRANSFERS_ONLY');
}
```

### Security Penetration Tests

```javascript
// Test: Access other office's data as Admin
const adminToken = login('admin@flashpay.com', 'password');
const response = await fetch('/api/transfers?office_id=2', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
assert(response.status === 403);

// Test: Create employee as Admin
const response = await fetch('/api/employees', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${adminToken}` },
  body: JSON.stringify({...})
});
assert(response.status === 403);
```

---

## Best Practices

### 1. Always Check Permissions Server-Side
```javascript
// ❌ Bad: Trust client-side checks
app.post('/api/employees', (req, res) => {
  // Client said they can do this...
});

// ✅ Good: Verify on server
app.post('/api/employees', 
  requireRole('super_admin'),
  (req, res) => {
    // Only super_admin can reach here
  }
);
```

### 2. Defense in Depth
```javascript
// Multiple layers of protection
app.get('/api/sensitive-data',
  authenticateToken,      // Layer 1: Who are you?
  requireRole('admin'),   // Layer 2: What role?
  requirePermission('read_sensitive'), // Layer 3: Specific permission?
  attachOfficeContext,    // Layer 4: Which office?
  validateOfficeAccess(), // Layer 5: Can you access this office?
  (req, res) => {         // Layer 6: Handler
    // Data is filtered by office
    res.json(filteredData);
  }
);
```

### 3. Fail Closed
```javascript
// Default deny
function canAccess(resource) {
  if (!user) return false;  // No user = no access
  if (!role) return false;  // No role = no access
  // ... explicit grants only
}
```

### 4. Audit Everything
```javascript
app.use((req, res, next) => {
  logActivity({
    user: req.user.id,
    action: req.method,
    resource: req.path,
    office: req.officeContext?.officeId,
    timestamp: new Date(),
    ip: req.ip
  });
  next();
});
```

---

## Troubleshooting

### Common Issues

#### Issue: User sees wrong office data
**Cause:** Office context not properly initialized
**Solution:** 
```javascript
initOfficeContext(); // Call on login
```

#### Issue: Permission denied for valid user
**Cause:** Token expired or role mismatch
**Solution:** Check token validity and header role match

#### Issue: Office selector not showing
**Cause:** User is not Super Admin
**Solution:** Verify role is 'super_admin'

#### Issue: Empty data for valid requests
**Cause:** Office filter too restrictive
**Solution:** Check office_id assignment in database

---

## References

- [OWASP RBAC Guide](https://owasp.org/www-community/access-control)
- [NIST RBAC Standard](https://csrc.nist.gov/projects/role-based-access-control)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

*Document Version: 1.0*
*Last Updated: 2025-01-25*
*System: FlashPay Financial Management*
