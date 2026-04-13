-- =====================================================
-- FLOWTYM - MODULE PAIEMENTS (Stripe, Adyen, PayPal)
-- UUID compatible avec le schéma Supabase existant
-- =====================================================

-- Providers configurés par hôtel
CREATE TABLE IF NOT EXISTS payment_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- stripe, adyen, paypal
    is_active BOOLEAN DEFAULT TRUE,
    api_keys JSONB NOT NULL DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hotel_id, provider)
);

-- Transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    payment_link_id UUID,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    status TEXT NOT NULL DEFAULT 'pending', -- pending, succeeded, failed, refunded, disputed
    payment_method TEXT,
    card_last4 TEXT,
    card_brand TEXT,
    metadata JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Liens de paiement
CREATE TABLE IF NOT EXISTS payment_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    guest_email TEXT NOT NULL,
    guest_name TEXT,
    token TEXT UNIQUE NOT NULL,
    url TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    description TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, paid, expired, cancelled
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_count INT DEFAULT 0,
    transaction_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhooks reçus
CREATE TABLE IF NOT EXISTS payment_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    event_type TEXT,
    payload JSONB,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Remboursements
CREATE TABLE IF NOT EXISTS payment_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
    refund_id TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Index
CREATE INDEX IF NOT EXISTS idx_pay_tx_reservation ON payment_transactions(reservation_id);
CREATE INDEX IF NOT EXISTS idx_pay_tx_provider ON payment_transactions(provider);
CREATE INDEX IF NOT EXISTS idx_pay_links_token ON payment_links(token);
CREATE INDEX IF NOT EXISTS idx_pay_links_reservation ON payment_links(reservation_id);
CREATE INDEX IF NOT EXISTS idx_pay_links_expires ON payment_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_pay_webhooks ON payment_webhooks(processed);

-- RLS
ALTER TABLE payment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pay_providers_auth" ON payment_providers FOR ALL TO authenticated USING (hotel_id = get_current_user_hotel_id());
CREATE POLICY "pay_tx_auth" ON payment_transactions FOR ALL TO authenticated USING (hotel_id = get_current_user_hotel_id());
CREATE POLICY "pay_links_auth" ON payment_links FOR ALL TO authenticated USING (hotel_id = get_current_user_hotel_id());
CREATE POLICY "pay_wh_auth" ON payment_webhooks FOR ALL TO authenticated USING (hotel_id = get_current_user_hotel_id());
CREATE POLICY "pay_refunds_auth" ON payment_refunds FOR ALL TO authenticated USING (hotel_id = get_current_user_hotel_id());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE payment_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_links;

-- Verification
SELECT 'payment_providers' AS t, COUNT(*) AS n FROM payment_providers
UNION ALL SELECT 'payment_transactions', COUNT(*) FROM payment_transactions
UNION ALL SELECT 'payment_links', COUNT(*) FROM payment_links;
