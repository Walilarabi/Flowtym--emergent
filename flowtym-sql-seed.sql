-- ============================================================
-- FLOWTYM PMS - Script SQL Complet
-- Supabase PostgreSQL - Création tables + Seed
-- À exécuter dans: Supabase Dashboard → SQL Editor
-- ============================================================

-- ═══════════════════════════════════════════
-- 1. ENUMS
-- ═══════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('direction', 'reception', 'gouvernante', 'femme_de_chambre', 'maintenance', 'petit_dejeuner', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE room_status AS ENUM ('libre', 'occupee', 'en_nettoyage', 'inspectee', 'bloquee', 'maintenance');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE reservation_status AS ENUM ('confirmee', 'annulee', 'no_show', 'en_cours', 'check_in', 'check_out');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE cleaning_status AS ENUM ('a_faire', 'en_cours', 'termine', 'refuse');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE maintenance_priority AS ENUM ('basse', 'moyenne', 'haute', 'urgente');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE maintenance_status AS ENUM ('signale', 'planifie', 'en_cours', 'termine', 'annule');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lost_item_status AS ENUM ('trouve', 'consigne', 'restitue', 'detruit');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════
-- 2. TABLES PRINCIPALES
-- ═══════════════════════════════════════════

-- Hotels
CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'France',
  phone TEXT,
  email TEXT,
  stars INTEGER DEFAULT 3,
  total_rooms INTEGER DEFAULT 0,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hotel Floors
CREATE TABLE IF NOT EXISTS hotel_floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  floor_number INTEGER NOT NULL,
  name TEXT,
  total_rooms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role user_role NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rooms
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  floor_id UUID REFERENCES hotel_floors(id),
  room_number TEXT NOT NULL,
  room_type TEXT,
  status room_status DEFAULT 'libre',
  capacity INTEGER DEFAULT 2,
  bed_type TEXT,
  surface_area NUMERIC,
  equipments JSONB DEFAULT '[]',
  dotation JSONB DEFAULT '[]',
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservations
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id),
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT,
  guest_count INTEGER DEFAULT 1,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status reservation_status DEFAULT 'confirmee',
  source TEXT DEFAULT 'Direct',
  pms_reservation_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Room Cleaning Tasks
CREATE TABLE IF NOT EXISTS room_cleaning_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id),
  assigned_to UUID REFERENCES users(id),
  cleaning_type TEXT,
  status cleaning_status DEFAULT 'a_faire',
  priority INTEGER DEFAULT 1,
  scheduled_date DATE DEFAULT CURRENT_DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 30,
  notes TEXT,
  photos JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inspections
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id),
  cleaning_task_id UUID REFERENCES room_cleaning_tasks(id),
  inspector_id UUID REFERENCES users(id),
  score INTEGER,
  checklist JSONB DEFAULT '{}',
  is_approved BOOLEAN,
  rejection_reason TEXT,
  photos JSONB DEFAULT '[]',
  inspected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hotel Settings
CREATE TABLE IF NOT EXISTS hotel_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE UNIQUE,
  lost_found_retention_days INTEGER DEFAULT 90,
  checkout_time TIME DEFAULT '11:00',
  checkin_time TIME DEFAULT '15:00',
  default_cleaning_duration INTEGER DEFAULT 30,
  inspection_required BOOLEAN DEFAULT TRUE,
  breakfast_start_time TIME DEFAULT '07:00',
  breakfast_end_time TIME DEFAULT '10:30',
  timezone TEXT DEFAULT 'Europe/Paris',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lost & Found Items
CREATE TABLE IF NOT EXISTS lost_found_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id),
  found_by UUID REFERENCES users(id),
  item_description TEXT NOT NULL,
  category TEXT,
  location_found TEXT,
  status lost_item_status DEFAULT 'trouve',
  guest_name TEXT,
  guest_contact TEXT,
  photos JSONB DEFAULT '[]',
  storage_location TEXT,
  returned_at TIMESTAMPTZ,
  destroyed_at TIMESTAMPTZ,
  retention_deadline DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance Tasks
CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id),
  reported_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  priority maintenance_priority DEFAULT 'moyenne',
  status maintenance_status DEFAULT 'signale',
  category TEXT,
  location TEXT,
  photos JSONB DEFAULT '[]',
  resolved_at TIMESTAMPTZ,
  estimated_duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 3. ENABLE REALTIME
-- ═══════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE room_cleaning_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE inspections;
ALTER PUBLICATION supabase_realtime ADD TABLE maintenance_tasks;

-- ═══════════════════════════════════════════
-- 4. RPC FUNCTIONS
-- ═══════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_user_hotel_id(user_auth_id UUID)
RETURNS UUID AS $$
  SELECT hotel_id FROM users WHERE auth_id = user_auth_id LIMIT 1;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_user_role(user_auth_id UUID)
RETURNS user_role AS $$
  SELECT role FROM users WHERE auth_id = user_auth_id LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- ═══════════════════════════════════════════
-- 5. SEED DATA
-- ═══════════════════════════════════════════

-- Insert hotel
INSERT INTO hotels (name, address, city, postal_code, country, phone, email, stars, total_rooms)
VALUES ('Flowtym Paris', '123 Avenue des Champs-Élysées', 'Paris', '75008', 'France', '+33 1 23 45 67 89', 'contact@flowtym.com', 4, 12)
ON CONFLICT DO NOTHING;

-- Insert floors (need hotel_id)
DO $$
DECLARE hotel_uuid UUID;
BEGIN
  SELECT id INTO hotel_uuid FROM hotels WHERE name = 'Flowtym Paris' LIMIT 1;
  
  INSERT INTO hotel_floors (hotel_id, floor_number, name, total_rooms) VALUES
    (hotel_uuid, 1, 'Étage 1', 3),
    (hotel_uuid, 2, 'Étage 2', 4),
    (hotel_uuid, 3, 'Étage 3', 4)
  ON CONFLICT DO NOTHING;

  -- Insert hotel settings
  INSERT INTO hotel_settings (hotel_id, checkout_time, checkin_time, default_cleaning_duration, inspection_required, timezone)
  VALUES (hotel_uuid, '11:00', '15:00', 30, TRUE, 'Europe/Paris')
  ON CONFLICT (hotel_id) DO NOTHING;
END $$;

-- NOTE: Users must be created via Supabase Auth Admin API (not SQL)
-- Use the seed_supabase.py script for user creation

-- Insert rooms
DO $$
DECLARE 
  hotel_uuid UUID;
  floor1 UUID; floor2 UUID; floor3 UUID;
BEGIN
  SELECT id INTO hotel_uuid FROM hotels WHERE name = 'Flowtym Paris' LIMIT 1;
  SELECT id INTO floor1 FROM hotel_floors WHERE hotel_id = hotel_uuid AND floor_number = 1 LIMIT 1;
  SELECT id INTO floor2 FROM hotel_floors WHERE hotel_id = hotel_uuid AND floor_number = 2 LIMIT 1;
  SELECT id INTO floor3 FROM hotel_floors WHERE hotel_id = hotel_uuid AND floor_number = 3 LIMIT 1;

  INSERT INTO rooms (hotel_id, floor_id, room_number, room_type, status, capacity, bed_type, surface_area, notes) VALUES
    (hotel_uuid, floor1, '101', 'Twin',   'libre',   2, '2 lits simples', 15, 'Douche, Vue Rue'),
    (hotel_uuid, floor1, '102', 'Double', 'occupee', 2, '1 lit double',   22, 'Baignoire, Vue Cour'),
    (hotel_uuid, floor1, '103', 'Twin',   'libre',   2, '2 lits simples', 15, 'Douche, Vue Rue'),
    (hotel_uuid, floor2, '201', 'Double', 'occupee', 2, '1 lit double',   16, 'Baignoire, Vue Rue'),
    (hotel_uuid, floor2, '202', 'Double', 'occupee', 2, '1 lit double',   25, 'Baignoire, Vue Cour, Deluxe'),
    (hotel_uuid, floor2, '203', 'Twin',   'libre',   2, '2 lits simples', 16, 'Douche, Vue Rue'),
    (hotel_uuid, floor2, '204', 'Double', 'libre',   2, '1 lit double',   16, 'Baignoire, Vue Cour'),
    (hotel_uuid, floor3, '301', 'Double', 'libre',   2, '1 lit king',     25, 'Baignoire, Vue Rue, Deluxe'),
    (hotel_uuid, floor3, '302', 'Double', 'libre',   2, '1 lit double',   16, 'Douche, Vue Cour'),
    (hotel_uuid, floor3, '303', 'Double', 'libre',   2, '1 lit double',   16, 'Baignoire, Vue Rue'),
    (hotel_uuid, floor3, '304', 'Double', 'libre',   2, '1 lit double',   16, 'Douche, Vue Cour')
  ON CONFLICT DO NOTHING;
END $$;

-- Insert sample reservations
DO $$
DECLARE hotel_uuid UUID; rm102 UUID; rm201 UUID; rm202 UUID; rm301 UUID; rm103 UUID; rm303 UUID; rm204 UUID;
BEGIN
  SELECT id INTO hotel_uuid FROM hotels WHERE name = 'Flowtym Paris' LIMIT 1;
  SELECT id INTO rm102 FROM rooms WHERE hotel_id = hotel_uuid AND room_number = '102';
  SELECT id INTO rm201 FROM rooms WHERE hotel_id = hotel_uuid AND room_number = '201';
  SELECT id INTO rm202 FROM rooms WHERE hotel_id = hotel_uuid AND room_number = '202';
  SELECT id INTO rm301 FROM rooms WHERE hotel_id = hotel_uuid AND room_number = '301';
  SELECT id INTO rm103 FROM rooms WHERE hotel_id = hotel_uuid AND room_number = '103';
  SELECT id INTO rm303 FROM rooms WHERE hotel_id = hotel_uuid AND room_number = '303';
  SELECT id INTO rm204 FROM rooms WHERE hotel_id = hotel_uuid AND room_number = '204';

  INSERT INTO reservations (hotel_id, room_id, guest_name, guest_email, guest_phone, guest_count, check_in, check_out, status, source) VALUES
    (hotel_uuid, rm102, 'Sophie Laurent',       'sophie.l@email.com',     '+33 6 11 22 33 44', 2, '2026-04-10', '2026-04-14', 'confirmee', 'Booking.com'),
    (hotel_uuid, rm201, 'Marc Dubois',          'm.dubois@email.com',     '+33 6 22 33 44 55', 1, '2026-04-12', '2026-04-15', 'confirmee', 'Direct'),
    (hotel_uuid, rm202, 'Elena Rossi',          'elena.r@email.com',      '+39 3 12 34 56 78', 2, '2026-04-11', '2026-04-16', 'en_cours',  'Expedia'),
    (hotel_uuid, rm301, 'Jean-Pierre Moreau',   'jp.moreau@email.com',    '+33 6 33 44 55 66', 2, '2026-04-08', '2026-04-12', 'check_out', 'Direct'),
    (hotel_uuid, rm103, 'Yuki Tanaka',          'yuki.t@email.com',       '+81 90 1234 5678',  1, '2026-04-14', '2026-04-18', 'confirmee', 'Hotels.com'),
    (hotel_uuid, rm303, 'Ahmed Belkacem',       'a.belkacem@email.com',   '+33 6 44 55 66 77', 2, '2026-04-13', '2026-04-15', 'confirmee', 'Booking.com'),
    (hotel_uuid, rm204, 'Maria Schmidt',        'm.schmidt@email.com',    '+49 170 123 4567',  1, '2026-05-01', '2026-05-05', 'confirmee', 'Direct')
  ON CONFLICT DO NOTHING;
END $$;

-- ═══════════════════════════════════════════
-- DONE! Vérification:
-- ═══════════════════════════════════════════
-- SELECT COUNT(*) FROM hotels;        -- 1
-- SELECT COUNT(*) FROM hotel_floors;  -- 3
-- SELECT COUNT(*) FROM rooms;         -- 11
-- SELECT COUNT(*) FROM reservations;  -- 7
