-- =====================================================
-- FLOWTYM - POLITIQUES D'ANNULATION
-- Table cancellation_policies + colonne rate_plans
-- =====================================================

CREATE TABLE IF NOT EXISTS cancellation_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    policy_type TEXT NOT NULL, -- individuelle, groupe, flexible, semi_flexible, strict, moderate, non_refundable
    free_cancellation_days INT DEFAULT 1,
    cancellation_fee_percent NUMERIC(5,2) DEFAULT 0,
    fixed_fee_amount NUMERIC(10,2) DEFAULT 0,
    applies_to_nights INT DEFAULT 1,
    min_rooms_for_group INT,
    group_cancellation_days INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hotel_id, code)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_cancel_policies_hotel ON cancellation_policies(hotel_id);

-- RLS
ALTER TABLE cancellation_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cancel_pol_auth" ON cancellation_policies FOR ALL TO authenticated
  USING (hotel_id = get_current_user_hotel_id());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE cancellation_policies;

-- Seed exemples
DO $$
DECLARE h UUID;
BEGIN
  SELECT id INTO h FROM hotels LIMIT 1;
  IF h IS NULL THEN RETURN; END IF;

  INSERT INTO cancellation_policies (hotel_id, name, code, policy_type, free_cancellation_days, cancellation_fee_percent, fixed_fee_amount, applies_to_nights) VALUES
    (h, 'Flexible - Annulation gratuite 24h', 'FLEX', 'flexible', 1, 0, 0, 0),
    (h, 'Semi-Flexible - 50% si < 48h', 'SEMI', 'semi_flexible', 2, 50, 0, 1),
    (h, 'Stricte - 1ère nuit si < 7j', 'STRICT', 'strict', 7, 100, 0, 1),
    (h, 'Non Remboursable', 'NREM', 'non_refundable', 0, 100, 0, 0),
    (h, 'Modérée - 25% si < 72h', 'MOD', 'moderate', 3, 25, 0, 0),
    (h, 'Groupe - 30j pour groupes 5+', 'GRP', 'groupe', 30, 100, 0, 1)
  ON CONFLICT DO NOTHING;
END $$;

-- Verification
SELECT 'cancellation_policies' AS t, COUNT(*) AS n FROM cancellation_policies;
