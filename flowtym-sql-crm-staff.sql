-- =====================================================
-- FLOWTYM - TABLES CRM ET STAFF
-- À exécuter dans le SQL Editor de Supabase
-- =====================================================

-- =====================================================
-- 1. TABLES CRM
-- =====================================================

-- Guests (clients)
CREATE TABLE IF NOT EXISTS guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    email VARCHAR(255),
    phone VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'France',
    postal_code VARCHAR(20),
    birth_date DATE,
    nationality VARCHAR(50),
    language VARCHAR(10) DEFAULT 'fr',
    preferences JSONB DEFAULT '{}',
    consent_rgpd BOOLEAN DEFAULT true,
    consent_date TIMESTAMPTZ DEFAULT NOW(),
    total_stays INT DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    last_stay_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guest preferences
CREATE TABLE IF NOT EXISTS guest_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
    preference_type VARCHAR(50),
    preference_value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guest history (historique séjours)
CREATE TABLE IF NOT EXISTS guest_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    stay_start DATE,
    stay_end DATE,
    room_number VARCHAR(10),
    amount DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guest segments
CREATE TABLE IF NOT EXISTS guest_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    name VARCHAR(100),
    conditions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. TABLES STAFF COMPLÉMENTAIRES
-- =====================================================

-- Staff schedules (plannings)
CREATE TABLE IF NOT EXISTS staff_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    shift_type VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff leave requests
CREATE TABLE IF NOT EXISTS staff_leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    leave_type VARCHAR(50),
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. ENABLE REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE guests;
ALTER PUBLICATION supabase_realtime ADD TABLE staff_schedules;

-- =====================================================
-- 4. INDEX
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_guests_hotel ON guests(hotel_id);
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
CREATE INDEX IF NOT EXISTS idx_guest_history_guest ON guest_history(guest_id);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff ON staff_schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_date ON staff_schedules(date);
