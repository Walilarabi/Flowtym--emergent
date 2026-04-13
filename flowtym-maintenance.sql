-- ═══════════════════════════════════════════════════════════════════
-- FLOWTYM — Maintenance Tickets Table
-- Execute in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS maintenance_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    room_number TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
    category TEXT DEFAULT 'general' CHECK (category IN ('plumbing', 'electrical', 'hvac', 'furniture', 'general')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'new', 'in_progress', 'resolved', 'closed')),
    assigned_to TEXT,
    reported_by TEXT,
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_hotel ON maintenance_tickets(hotel_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_tickets(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_priority ON maintenance_tickets(priority);

ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maintenance_service_full" ON maintenance_tickets
    FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE maintenance_tickets;
