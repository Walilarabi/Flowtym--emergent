-- =====================================================
-- FLOWTYM - MOTEUR DE RÈGLES D'AUTOMATISATION
-- Tables Supabase (UUID compatible)
-- =====================================================

-- 1. RÈGLES
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- mlos, pricing, cta_ctd, pickup, lastminute, overbooking, channel, composite
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0,
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    start_date DATE,
    end_date DATE,
    apply_to_weekdays JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. LOGS D'EXÉCUTION
CREATE TABLE IF NOT EXISTS automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES automation_rules(id) ON DELETE CASCADE,
    rule_name TEXT,
    trigger_date DATE NOT NULL,
    conditions_met BOOLEAN DEFAULT FALSE,
    actions_taken JSONB,
    affected_rooms JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PARAMÈTRES GLOBAUX
CREATE TABLE IF NOT EXISTS automation_settings (
    hotel_id UUID PRIMARY KEY REFERENCES hotels(id) ON DELETE CASCADE,
    execution_frequency TEXT DEFAULT 'hourly',
    execution_hour INT DEFAULT 2,
    max_price_increase_pct INT DEFAULT 50,
    max_price_decrease_pct INT DEFAULT 30,
    pickup_reference_days INT DEFAULT 30,
    mlos_activation_days INT DEFAULT 7,
    cta_activation_days INT DEFAULT 1,
    notification_enabled BOOLEAN DEFAULT TRUE,
    notification_emails JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TARIFS DYNAMIQUES (HISTORIQUE)
CREATE TABLE IF NOT EXISTS dynamic_rates_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    original_rate NUMERIC(10,2),
    applied_rate NUMERIC(10,2),
    rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RESTRICTIONS (CTA/CTD/MLOS/STOP SELL)
CREATE TABLE IF NOT EXISTS booking_restrictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    restriction_type TEXT NOT NULL, -- cta, ctd, mlos, stop_sell
    is_active BOOLEAN DEFAULT TRUE,
    reason TEXT,
    rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hotel_id, date, restriction_type)
);

-- 6. INDEX
CREATE INDEX IF NOT EXISTS idx_auto_rules_hotel ON automation_rules(hotel_id, is_active);
CREATE INDEX IF NOT EXISTS idx_auto_logs_hotel ON automation_logs(hotel_id, trigger_date);
CREATE INDEX IF NOT EXISTS idx_dynamic_rates ON dynamic_rates_history(hotel_id, date);
CREATE INDEX IF NOT EXISTS idx_restrictions ON booking_restrictions(hotel_id, date);

-- 7. REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE automation_rules;
ALTER PUBLICATION supabase_realtime ADD TABLE automation_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE booking_restrictions;

-- 8. RLS
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auto_rules_auth" ON automation_rules FOR ALL TO authenticated
  USING (hotel_id = get_current_user_hotel_id());

ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auto_logs_auth" ON automation_logs FOR ALL TO authenticated
  USING (hotel_id = get_current_user_hotel_id());

ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auto_settings_auth" ON automation_settings FOR ALL TO authenticated
  USING (hotel_id = get_current_user_hotel_id());

ALTER TABLE dynamic_rates_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rates_auth" ON dynamic_rates_history FOR ALL TO authenticated
  USING (hotel_id = get_current_user_hotel_id());

ALTER TABLE booking_restrictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "restrict_auth" ON booking_restrictions FOR ALL TO authenticated
  USING (hotel_id = get_current_user_hotel_id());

-- 9. SEED RÈGLES PAR DÉFAUT (utilise l'hôtel existant)
DO $$
DECLARE h UUID;
BEGIN
  SELECT id INTO h FROM hotels LIMIT 1;
  IF h IS NULL THEN RETURN; END IF;

  INSERT INTO automation_settings (hotel_id) VALUES (h) ON CONFLICT (hotel_id) DO NOTHING;

  INSERT INTO automation_rules (hotel_id, name, description, category, priority, conditions, actions) VALUES
  (h, 'MLOS 2 nuits si forte occupation', 'Si TO% > 70% à 30j, MLOS = 2', 'mlos', 10,
   '{"operator":"and","conditions":[{"field":"occupation_rate_30d","operator":">","value":70},{"field":"days_before_arrival","operator":">","value":7}]}',
   '{"type":"set_mlos","value":2,"apply_to":"all_rooms"}'),
  (h, 'Augmentation tarif +15% forte occupation', 'Si TO% > 85% à 14j, tarif +15%', 'pricing', 20,
   '{"operator":"and","conditions":[{"field":"occupation_rate_14d","operator":">","value":85},{"field":"days_before_arrival","operator":"between","value":[7,30]}]}',
   '{"type":"increase_rate","value":15,"unit":"percent","max_cap":50}'),
  (h, 'Réduction progressive J-1', 'Si TO% < 60% à J-1, réduction -5%', 'lastminute', 30,
   '{"operator":"and","conditions":[{"field":"days_before_arrival","operator":"=","value":1},{"field":"current_hour","operator":">=","value":12},{"field":"occupation_rate_today","operator":"<","value":60}]}',
   '{"type":"decrease_rate","value":5,"unit":"percent","max_reduction":30}'),
  (h, 'CTA si occupation > 95%', 'Fermer arrivées si TO% > 95%', 'cta_ctd', 5,
   '{"operator":"and","conditions":[{"field":"days_before_arrival","operator":"=","value":1},{"field":"occupation_rate_today","operator":">","value":95}]}',
   '{"type":"activate_cta","value":true}'),
  (h, 'Week-end chargé : MLOS 3 + tarif +10%', 'Si WE et TO% > 80%', 'composite', 15,
   '{"operator":"and","conditions":[{"field":"is_weekend","operator":"=","value":true},{"field":"occupation_rate_14d","operator":">","value":80}]}',
   '{"type":"multiple","actions":[{"type":"set_mlos","value":3},{"type":"increase_rate","value":10,"unit":"percent"}]}'),
  (h, 'Dernières chambres +20%', 'Si < 3 chambres dispo', 'pricing', 5,
   '{"operator":"and","conditions":[{"field":"available_rooms","operator":"<","value":3}]}',
   '{"type":"increase_rate","value":20,"unit":"percent","max_cap":50}'),
  (h, 'Dernière minute J-3', 'Si TO% < 50% à J-3, -15%', 'lastminute', 25,
   '{"operator":"and","conditions":[{"field":"days_before_arrival","operator":"<=","value":3},{"field":"occupation_rate_today","operator":"<","value":50}]}',
   '{"type":"decrease_rate","value":15,"unit":"percent","max_reduction":30}')
  ON CONFLICT DO NOTHING;
END $$;

-- 10. VERIFICATION
SELECT 'automation_rules' AS t, COUNT(*) AS n FROM automation_rules
UNION ALL SELECT 'automation_settings', COUNT(*) FROM automation_settings;
