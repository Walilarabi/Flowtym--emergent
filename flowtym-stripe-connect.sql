-- ═══════════════════════════════════════════════════════════════════
-- FLOWTYM — Stripe Connect Tables
-- Execute in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- 1. Add stripe_account_id to hotels
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- 2. Stripe Accounts tracking table
CREATE TABLE IF NOT EXISTS stripe_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    stripe_account_id TEXT NOT NULL UNIQUE,
    email TEXT,
    country TEXT DEFAULT 'FR',
    status TEXT DEFAULT 'pending', -- pending, active, restricted, disabled
    charges_enabled BOOLEAN DEFAULT FALSE,
    payouts_enabled BOOLEAN DEFAULT FALSE,
    details_submitted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Stripe Products table
CREATE TABLE IF NOT EXISTS stripe_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    stripe_product_id TEXT NOT NULL,
    stripe_price_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_cents INT NOT NULL,
    currency TEXT DEFAULT 'eur',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_stripe_accounts_hotel ON stripe_accounts(hotel_id);
CREATE INDEX IF NOT EXISTS idx_stripe_accounts_stripe_id ON stripe_accounts(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_stripe_products_hotel ON stripe_products(hotel_id);

-- 5. Enable RLS
ALTER TABLE stripe_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_products ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies — full access via service_role (backend)
CREATE POLICY "stripe_accounts_service_full" ON stripe_accounts
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "stripe_products_service_full" ON stripe_products
    FOR ALL USING (true) WITH CHECK (true);

-- 7. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE stripe_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE stripe_products;

-- Done!
-- After executing, configure your Stripe keys in backend/.env:
-- STRIPE_API_KEY=sk_test_...
-- STRIPE_WEBHOOK_SECRET=whsec_...
