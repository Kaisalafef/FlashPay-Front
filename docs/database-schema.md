# FlashPay Database Schema Documentation
## Role-Based Financial Management System

---

## Overview

This document describes the database schema for the FlashPay Financial Management System with strict Role-Based Access Control (RBAC) and office-based data isolation.

---

## Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     users       │     │    offices      │     │   employees     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ PK id           │────▶│ PK id           │◄────│ PK id           │
│ email           │     │ name            │     │ FK user_id      │
│ password_hash   │     │ governorate_id  │     │ FK office_id    │
│ role            │     │ city_id         │     │ role            │
│ FK office_id    │────▶│ phone           │     │ hire_date       │
│ is_active       │     │ opening_price   │     │ salary          │
│ created_at      │     │ is_active       │     │ is_active       │
└─────────────────┘     │ created_at      │     │ created_at      │
                        └─────────────────┘     └─────────────────┘
                                 │
                                 │
                        ┌─────────────────┐
                        │  governorates   │
                        ├─────────────────┤
                        │ PK id           │
                        │ name            │
                        │ FK country_id   │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   transfers     │     │  fund_transactions│    │   activities    │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ PK id           │     │ PK id           │     │ PK id           │
│ transfer_id     │     │ type            │     │ type            │
│ sender_name     │     │ amount          │     │ description     │
│ sender_phone    │     │ currency        │     │ FK user_id      │
│ receiver_name   │     │ rate            │     │ amount          │
│ amount          │     │ total_syp       │     │ amount_type     │
│ currency        │     │ FK created_by   │────▶│ FK office_id    │
│ status          │     │ created_at      │     │ created_at      │
│ FK office_id    │────▶│                 │     │                 │
│ FK created_by   │────▶│                 │     │                 │
│ created_at      │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Table Definitions

### 1. users
System users with authentication and role assignment.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(100) | NOT NULL | Full name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login email |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| role | ENUM | NOT NULL | User role (see below) |
| office_id | INT | FK → offices.id | Assigned office (null for Super Admin) |
| is_active | BOOLEAN | DEFAULT true | Account status |
| last_login | TIMESTAMP | NULL | Last login time |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | ON UPDATE | Last update timestamp |

**Roles Enum:**
- `super_admin` - Full system access
- `admin` - Office manager (single office)
- `accountant` - Financial accounting only
- `cashier` - Outgoing transfers only
- `agent` - Mobile app delegate (not in dashboard)
- `customer` - Mobile app customer (not in dashboard)

---

### 2. offices
Physical office locations in Syria.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Office name |
| governorate_id | INT | FK → governorates.id | Governorate location |
| city_id | INT | FK → cities.id | City location |
| address | TEXT | NULL | Full address |
| phone | VARCHAR(20) | NULL | Contact phone |
| opening_price | DECIMAL(15,2) | DEFAULT 0 | Opening balance |
| manager_id | INT | FK → users.id | Office manager |
| is_active | BOOLEAN | DEFAULT true | Office status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | ON UPDATE | Last update timestamp |

---

### 3. employees
Employee records linked to users and offices.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| user_id | INT | FK → users.id | Linked user account |
| office_id | INT | FK → offices.id | Assigned office |
| role | ENUM | NOT NULL | Employee role |
| hire_date | DATE | NOT NULL | Employment start date |
| salary | DECIMAL(10,2) | NULL | Monthly salary |
| commission_rate | DECIMAL(5,2) | DEFAULT 0 | Commission percentage |
| is_active | BOOLEAN | DEFAULT true | Employment status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | ON UPDATE | Last update timestamp |

---

### 4. transfers
Money transfer transactions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| transfer_id | VARCHAR(50) | UNIQUE, NOT NULL | Public transfer code (e.g., TRX-9981) |
| sender_name | VARCHAR(100) | NOT NULL | Sender full name |
| sender_phone | VARCHAR(20) | NOT NULL | Sender phone |
| sender_country_id | INT | FK → countries.id | Sender country |
| receiver_name | VARCHAR(100) | NOT NULL | Receiver name |
| receiver_phone | VARCHAR(20) | NULL | Receiver phone |
| receiver_country_id | INT | FK → countries.id | Receiver country |
| receiver_city_id | INT | FK → cities.id | Receiver city |
| amount | DECIMAL(15,2) | NOT NULL | Transfer amount |
| currency | VARCHAR(3) | DEFAULT 'USD' | Currency code |
| status | ENUM | DEFAULT 'pending' | Transfer status |
| transfer_type | ENUM | NOT NULL | Type: internal, outgoing, incoming |
| destination_country | VARCHAR(2) | NULL | Destination country code |
| office_id | INT | FK → offices.id | Originating office |
| created_by | INT | FK → users.id | Creator user |
| approved_by | INT | FK → users.id | Approver user (null if pending) |
| approved_at | TIMESTAMP | NULL | Approval timestamp |
| notes | TEXT | NULL | Additional notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | ON UPDATE | Last update timestamp |

**Status Enum:**
- `pending` - Awaiting approval
- `completed` - Successfully processed
- `cancelled` - Cancelled/rejected
- `on_hold` - Temporarily held

**Transfer Type Enum:**
- `internal` - Within Syria (office to office)
- `outgoing` - From Syria to abroad
- `incoming` - From abroad to Syria

---

### 5. fund_transactions
Buy/Sell fund box transactions (Super Admin only).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| type | ENUM | NOT NULL | Transaction type: buy, sell |
| amount | DECIMAL(15,2) | NOT NULL | Amount in foreign currency |
| currency | VARCHAR(3) | DEFAULT 'USD' | Currency code |
| rate | DECIMAL(10,2) | NOT NULL | Exchange rate |
| total_syp | DECIMAL(20,2) | NOT NULL | Total in SYP |
| notes | TEXT | NULL | Additional notes |
| created_by | INT | FK → users.id | Creator (Super Admin) |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

---

### 6. activities
Audit log for system activities.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| type | VARCHAR(50) | NOT NULL | Activity type |
| description | TEXT | NOT NULL | Activity description |
| user_id | INT | FK → users.id | User who performed action |
| office_id | INT | FK → offices.id | Related office (null for system-wide) |
| amount | DECIMAL(15,2) | NULL | Related amount |
| amount_type | ENUM | NULL | positive, negative, neutral |
| ip_address | VARCHAR(45) | NULL | User IP address |
| user_agent | TEXT | NULL | Browser user agent |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Activity Types:**
- `transfer` - Transfer created/completed
- `employee` - Employee added/updated
- `office` - Office created/updated
- `fund_box` - Fund box transaction
- `login` - User login
- `logout` - User logout
- `report` - Report generated
- `setting` - System setting changed

---

### 7. countries
Country reference data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(100) | NOT NULL | Country name (Arabic) |
| name_en | VARCHAR(100) | NOT NULL | Country name (English) |
| code | VARCHAR(2) | UNIQUE, NOT NULL | ISO country code |
| is_syria | BOOLEAN | DEFAULT false | Is Syria flag |
| phone_code | VARCHAR(5) | NULL | International phone code |
| is_active | BOOLEAN | DEFAULT true | Active status |

---

### 8. governorates
Syrian governorates reference.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(100) | NOT NULL | Governorate name |
| country_id | INT | FK → countries.id | Always 1 (Syria) |
| is_active | BOOLEAN | DEFAULT true | Active status |

---

### 9. cities
City reference data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(100) | NOT NULL | City name |
| governorate_id | INT | FK → governorates.id | Parent governorate (Syria only) |
| country_id | INT | FK → countries.id | Parent country |
| is_active | BOOLEAN | DEFAULT true | Active status |

---

## Indexes

### Performance Indexes
```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_office ON users(office_id);

-- Transfers
CREATE INDEX idx_transfers_office ON transfers(office_id);
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_transfers_created ON transfers(created_at);
CREATE INDEX idx_transfers_type ON transfers(transfer_type);

-- Activities
CREATE INDEX idx_activities_user ON activities(user_id);
CREATE INDEX idx_activities_office ON activities(office_id);
CREATE INDEX idx_activities_created ON activities(created_at);

-- Employees
CREATE INDEX idx_employees_office ON employees(office_id);
CREATE INDEX idx_employees_user ON employees(user_id);
```

---

## Data Isolation Rules

### 1. Super Admin
- Can access ALL records across all offices
- Can filter by specific office or view all
- Can create/manage offices
- Can create/manage employees in any office

### 2. Admin (Office Manager)
- Can ONLY access records from assigned office
- Cannot switch offices
- Cannot create/delete employees
- Can view office-specific reports only

### 3. Accountant
- Can ONLY access financial/accounting records
- Cannot access transfers, employees, or offices
- Data filtered by assigned office

### 4. Cashier
- Can ONLY access outgoing transfers (outside Syria)
- Cannot access reports, employees, or offices
- Data filtered by assigned office

---

## Security Constraints

### Foreign Key Constraints
- All `office_id` references must be valid offices
- All `user_id` references must be active users
- Cascading deletes disabled (soft delete only)

### Data Validation
- Email format validation
- Phone number format validation
- Amount must be positive
- Transfer status transitions must be valid

### Audit Requirements
- All CREATE/UPDATE/DELETE operations logged to activities
- User ID and timestamp recorded
- IP address and user agent captured for security

---

## Migration Scripts

### Initial Setup
```sql
-- Create tables in order
1. countries
2. governorates
3. cities
4. offices
5. users
6. employees
7. transfers
8. fund_transactions
9. activities
```

### Sample Data Insertion
```sql
-- Insert Super Admin
INSERT INTO users (name, email, password_hash, role, is_active)
VALUES ('System Admin', 'admin@flashpay.com', HASH('password'), 'super_admin', true);

-- Insert Syria
INSERT INTO countries (name, name_en, code, is_syria, phone_code)
VALUES ('سوريا', 'Syria', 'SY', true, '+963');
```

---

## Backup and Recovery

### Daily Backup Strategy
- Full database dump at 2:00 AM
- Incremental backups every 4 hours
- 30-day retention policy

### Critical Tables (Priority 1)
1. transfers
2. fund_transactions
3. users
4. activities

### Non-Critical Tables (Priority 2)
1. countries
2. governorates
3. cities
4. reference data

---

*Document Version: 1.0*
*Last Updated: 2025-01-25*
*System: FlashPay Financial Management*
