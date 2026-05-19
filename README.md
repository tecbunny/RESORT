# 🏨 Premium Resort Management System

A production-ready, beautifully designed React application built with TypeScript, Vite, and Vanilla CSS. It features full responsive column wrapping, custom scrollbars, and seamless state synchronization via Supabase Postgres Cloud database.

---

## 🚀 Key Features

*   **Premium Glassmorphic Design:** Dark mode layout with styled interactive elements, responsive tables, and elegant micro-animations.
*   **Complete POS System:** Integrated billing for room services, restaurant purchases, and bar inventory tracking.
*   **Operations & Audits:** Log staff payroll records, deposit history, lease agreements, and automated audit logs.
*   **Supabase Realtime Sync:** Automatic local-to-cloud sync and live pub/sub updates for collaborative multi-device usage (reception, kitchen, restaurant).

---

## 📁 Project Architecture & Structure

```
RESORT/
├── src/
│   ├── assets/         # App logo and static assets
│   ├── lib/
│   │   ├── billing.ts           # Billing algorithms and tax calculations
│   │   └── supabaseClient.ts    # Supabase SDK instance & realtime pub/sub
│   ├── tabs/           # Tab modular components (Dashboard, Reservations, Staff, etc.)
│   ├── App.css         # Styling system & responsive layout rules
│   ├── App.tsx         # Main router and top-level layouts
│   ├── data.ts         # Initial settings, configuration defaults, and schemas
│   ├── store.tsx       # Core state management, session timeouts, and auth
│   └── types.ts        # TypeScript interface definitions
├── index.html          # Entry HTML5 document
├── package.json        # Dependencies & scripts
└── tsconfig.json       # TypeScript compiler settings
```

---

## ⚡ Setup & Deployment

### 1. Database Configuration (Supabase SQL)

Paste the following script into your [Supabase SQL Editor](https://database.new) to create the sync table, enable row-level security (RLS), and configure real-time updates:

```sql
-- Create the collections sync table
CREATE TABLE IF NOT EXISTS resort_collections (
    name TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable row-level security (RLS)
ALTER TABLE resort_collections ENABLE ROW LEVEL SECURITY;

-- Create public read/write access policies
DROP POLICY IF EXISTS "Allow public read access" ON resort_collections;
CREATE POLICY "Allow public read access"
    ON resort_collections FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public insert/update access" ON resort_collections;
CREATE POLICY "Allow public insert/update access"
    ON resort_collections FOR ALL
    USING (
        name IN (
            'rooms', 'customers', 'bookings', 'orders', 'menuItems', 'payments', 
            'serviceCharges', 'inventory', 'stockMovements', 'auditLogs', 
            'otaSettlements', 'expenses', 'bankDeposits', 'staff', 'salaryRecords', 
            'leasePayments', 'settings'
        )
    )
    WITH CHECK (
        name IN (
            'rooms', 'customers', 'bookings', 'orders', 'menuItems', 'payments', 
            'serviceCharges', 'inventory', 'stockMovements', 'auditLogs', 
            'otaSettlements', 'expenses', 'bankDeposits', 'staff', 'salaryRecords', 
            'leasePayments', 'settings'
        )
    );

-- Enable Realtime subscriptions
ALTER TABLE resort_collections REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    ALTER PUBLICATION supabase_realtime ADD TABLE resort_collections;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignore if already added
END $$;
```

### 2. Environment Variables

Create a `.env` file in the root directory for local development, or add these variables directly in the Vercel dashboard:

```env
VITE_SUPABASE_URL=https://[your-project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-public-key]
```

### 3. Local Development

Install dependencies and start the local development server:

```bash
# Install packages
npm install

# Run server
npm run dev
```

### 4. Production Build

Verify correct compilation and output the optimized bundle:

```bash
npm run build
```

---

## 🔒 Production Credentials (Default)

The system manages user logins securely with PBKDF2/SHA-256 hashed credentials. Default accounts:

*   **Owner / Admin:**
    *   Username: `admin`
    *   Password: `admin`
*   **Reception Staff:**
    *   Username: `reception`
    *   Password: `reception`
*   **Restaurant Operations:**
    *   Username: `restaurant`
    *   Password: `restaurant`
