# RLS Policy Audit Report

This document reports the Row Level Security (RLS) policies configured for all core tables in the database.

## Summary table

| Table Name | SELECT Policy | INSERT Policy | UPDATE Policy | DELETE Policy | RLS Enabled |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `expenses` | ✅ Scoped to `auth.uid() = user_id` | ✅ Scoped to `auth.uid() = user_id` | ✅ Scoped to `auth.uid() = user_id` | ✅ Scoped to `auth.uid() = user_id` | Yes |
| `budgets` | ✅ Scoped to `auth.uid() = user_id` | ✅ Scoped to `auth.uid() = user_id` | ✅ Scoped to `auth.uid() = user_id` | ✅ Scoped to `auth.uid() = user_id` | Yes |
| `allowances` | ✅ Scoped to `auth.uid() = user_id` | ✅ Scoped to `auth.uid() = user_id` | ✅ Scoped to `auth.uid() = user_id` | ✅ Scoped to `auth.uid() = user_id` | Yes |
| `recurring_bills` | ✅ Scoped to `auth.uid() = user_id` | ✅ Scoped to `auth.uid() = user_id` | ✅ Scoped to `auth.uid() = user_id` | ✅ Scoped to `auth.uid() = user_id` | Yes |
| `bill_savings_progress` | ✅ Scoped to `auth.uid() = user_id` | ✅ Scoped to `auth.uid() = user_id` | ✅ Scoped to `auth.uid() = user_id` | ✅ Scoped to `auth.uid() = user_id` | Yes |

## Details of SQL Policies

### 1. `expenses` Table
```sql
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);
```

### 2. `budgets` Table
```sql
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budgets" ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON budgets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON budgets FOR DELETE USING (auth.uid() = user_id);
```

### 3. `allowances` Table
```sql
ALTER TABLE allowances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own allowances" ON allowances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own allowances" ON allowances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own allowances" ON allowances FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own allowances" ON allowances FOR DELETE USING (auth.uid() = user_id);
```

### 4. `recurring_bills` Table
```sql
ALTER TABLE recurring_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bills" ON recurring_bills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bills" ON recurring_bills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bills" ON recurring_bills FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bills" ON recurring_bills FOR DELETE USING (auth.uid() = user_id);
```

### 5. `bill_savings_progress` Table
```sql
ALTER TABLE bill_savings_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own savings progress" ON bill_savings_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own savings progress" ON bill_savings_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own savings progress" ON bill_savings_progress FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own savings progress" ON bill_savings_progress FOR DELETE USING (auth.uid() = user_id);
```
