# Frontend Architecture Fix Plan

## Root Causes Identified:
1. Two conflicting RBAC systems (auth.js vs rbac.js)
2. Missing nav items in sidebar (fund-box, accountant)
3. Wrong initial visibility states
4. Office selector not integrated with RBAC
5. Page flicker due to late initialization

## Fix Plan:

### Step 1: Fix Dashboard.html
- [x] Add missing nav items (nav-fund-box, nav-accountant)
- [x] Fix initial visibility states for sections

### Step 2: Fix auth.js - Create Unified RBAC
- [ ] Replace roleConfig with ROLE_PERMISSIONS from rbac.js
- [ ] Add defaultRoute logic for role-based redirects
- [ ] Add office selector integration
- [ ] Add loading state handling

### Step 3: Add Loading Screen
- [ ] Add pre-auth loading overlay to HTML
- [ ] Initialize RBAC before page renders

### Step 4: Fix Office Selector Logic
- [ ] Integrate with unified RBAC
- [ ] Show only for Super Admin

### Step 5: Remove Conflicting Code
- [ ] Remove duplicate initialization in window.onload
- [ ] Ensure single source of truth for RBAC

## Expected Results After Fix:
- Super Admin: Full system access with office selector
- Admin: Dashboard + Transfers + Reports (no office selector)
- Accountant: Accounting only (no office selector)
- Cashier: Transfers only (no office selector)
- No UI crashes, no flicker, no broken screens
