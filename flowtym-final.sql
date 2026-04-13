-- ══════════════════════════════════════════════════════════════════
-- FLOWTYM PMS — SCRIPT SQL FINAL DE DÉPLOIEMENT
-- Supabase PostgreSQL · Version 2.3
-- Exécuter dans : Dashboard Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- ═══════════ 1. ENUMS ═══════════

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('direction','reception','gouvernante','femme_de_chambre','maintenance','petit_dejeuner','super_admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE room_status AS ENUM ('libre','occupee','en_nettoyage','inspectee','bloquee','maintenance'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE reservation_status AS ENUM ('confirmee','annulee','no_show','en_cours','check_in','check_out'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE cleaning_status AS ENUM ('a_faire','en_cours','termine','refuse'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE maintenance_priority AS ENUM ('basse','moyenne','haute','urgente'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE maintenance_status AS ENUM ('signale','planifie','en_cours','termine','annule'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE lost_item_status AS ENUM ('trouve','consigne','restitue','detruit'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══════════ 2. TABLES ═══════════

CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, address TEXT, city TEXT, postal_code TEXT,
  country TEXT DEFAULT 'France', phone TEXT, email TEXT,
  stars INT DEFAULT 3, total_rooms INT DEFAULT 0, logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hotel_floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  floor_number INT NOT NULL, name TEXT, total_rooms INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE, hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL, first_name TEXT, last_name TEXT,
  phone TEXT, role user_role NOT NULL, avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE, last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  floor_id UUID REFERENCES hotel_floors(id),
  room_number TEXT NOT NULL, room_type TEXT, status room_status DEFAULT 'libre',
  capacity INT DEFAULT 2, bed_type TEXT, surface_area NUMERIC,
  equipments JSONB DEFAULT '[]', dotation JSONB DEFAULT '[]',
  notes TEXT, is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id),
  guest_name TEXT NOT NULL, guest_email TEXT, guest_phone TEXT,
  guest_count INT DEFAULT 1, check_in DATE NOT NULL, check_out DATE NOT NULL,
  status reservation_status DEFAULT 'confirmee', source TEXT DEFAULT 'Direct',
  total_amount NUMERIC DEFAULT 0, paid_amount NUMERIC DEFAULT 0,
  notes TEXT, pms_reservation_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  email TEXT, phone TEXT, first_name TEXT, last_name TEXT,
  address TEXT, city TEXT, country TEXT DEFAULT 'France', postal_code TEXT,
  birth_date DATE, nationality TEXT, language TEXT DEFAULT 'fr',
  preferences JSONB DEFAULT '{}', id_type TEXT, id_number TEXT,
  consent_rgpd BOOLEAN DEFAULT TRUE, total_stays INT DEFAULT 0,
  total_spent NUMERIC DEFAULT 0, last_stay_date DATE,
  loyalty_tier TEXT DEFAULT 'Bronze', status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guest_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  stay_start DATE, stay_end DATE, room_number TEXT, amount NUMERIC,
  rating INT, comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_cleaning_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id),
  assigned_to UUID REFERENCES users(id),
  cleaning_type TEXT, status cleaning_status DEFAULT 'a_faire',
  priority INT DEFAULT 1, scheduled_date DATE DEFAULT CURRENT_DATE,
  started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
  duration_minutes INT DEFAULT 30, notes TEXT, photos JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id),
  cleaning_task_id UUID REFERENCES room_cleaning_tasks(id),
  inspector_id UUID REFERENCES users(id),
  score INT, checklist JSONB DEFAULT '{}', is_approved BOOLEAN,
  rejection_reason TEXT, photos JSONB DEFAULT '[]',
  inspected_at TIMESTAMPTZ DEFAULT NOW(), created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hotel_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE UNIQUE,
  checkout_time TIME DEFAULT '11:00', checkin_time TIME DEFAULT '15:00',
  default_cleaning_duration INT DEFAULT 30, inspection_required BOOLEAN DEFAULT TRUE,
  lost_found_retention_days INT DEFAULT 90,
  breakfast_start_time TIME DEFAULT '07:00', breakfast_end_time TIME DEFAULT '10:30',
  timezone TEXT DEFAULT 'Europe/Paris', tva_rate NUMERIC DEFAULT 10.0,
  city_tax NUMERIC DEFAULT 2.50, currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id),
  reported_by UUID REFERENCES users(id), assigned_to UUID REFERENCES users(id),
  title TEXT NOT NULL, description TEXT,
  priority maintenance_priority DEFAULT 'moyenne',
  status maintenance_status DEFAULT 'signale',
  category TEXT, location TEXT, photos JSONB DEFAULT '[]',
  estimated_duration INT, resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lost_found_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id), found_by UUID REFERENCES users(id),
  item_description TEXT NOT NULL, category TEXT, location_found TEXT,
  status lost_item_status DEFAULT 'trouve',
  guest_name TEXT, guest_contact TEXT, photos JSONB DEFAULT '[]',
  storage_location TEXT, retention_deadline DATE, notes TEXT,
  returned_at TIMESTAMPTZ, destroyed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL, start_time TIME, end_time TIME,
  shift_type TEXT, notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════ 3. INDEXES ═══════════

CREATE INDEX IF NOT EXISTS idx_rooms_hotel ON rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(hotel_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_hotel ON reservations(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(hotel_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(hotel_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_hotel_date ON room_cleaning_tasks(hotel_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON room_cleaning_tasks(hotel_id, status);
CREATE INDEX IF NOT EXISTS idx_guests_hotel ON guests(hotel_id);
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
CREATE INDEX IF NOT EXISTS idx_users_hotel ON users(hotel_id);
CREATE INDEX IF NOT EXISTS idx_users_auth ON users(auth_id);

-- ═══════════ 4. REALTIME ═══════════

ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE room_cleaning_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE inspections;
ALTER PUBLICATION supabase_realtime ADD TABLE maintenance_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE guests;

-- ═══════════ 5. RPC FUNCTIONS ═══════════

CREATE OR REPLACE FUNCTION get_current_user_hotel_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT hotel_id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_user_role(p_auth_id UUID)
RETURNS user_role LANGUAGE sql STABLE AS $$
  SELECT role FROM users WHERE auth_id = p_auth_id LIMIT 1;
$$;

-- ═══════════ 6. RLS POLICIES ═══════════

-- Hotels
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hotels_auth_read" ON hotels;
CREATE POLICY "hotels_auth_read" ON hotels FOR SELECT TO authenticated USING (id = get_current_user_hotel_id());
CREATE POLICY "hotels_auth_update" ON hotels FOR UPDATE TO authenticated USING (id = get_current_user_hotel_id());

-- Rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rooms_auth_read" ON rooms;
CREATE POLICY "rooms_auth_read" ON rooms FOR SELECT TO authenticated USING (hotel_id = get_current_user_hotel_id());
CREATE POLICY "rooms_auth_write" ON rooms FOR INSERT TO authenticated WITH CHECK (hotel_id = get_current_user_hotel_id());
CREATE POLICY "rooms_auth_update" ON rooms FOR UPDATE TO authenticated USING (hotel_id = get_current_user_hotel_id());

-- Reservations
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "resas_auth_read" ON reservations;
CREATE POLICY "resas_auth_read" ON reservations FOR SELECT TO authenticated USING (hotel_id = get_current_user_hotel_id());
CREATE POLICY "resas_auth_write" ON reservations FOR INSERT TO authenticated WITH CHECK (hotel_id = get_current_user_hotel_id());
CREATE POLICY "resas_auth_update" ON reservations FOR UPDATE TO authenticated USING (hotel_id = get_current_user_hotel_id());
CREATE POLICY "resas_auth_delete" ON reservations FOR DELETE TO authenticated USING (hotel_id = get_current_user_hotel_id());

-- Users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_auth_read" ON users;
CREATE POLICY "users_auth_read" ON users FOR SELECT TO authenticated USING (hotel_id = get_current_user_hotel_id());

-- Guests
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "guests_auth_read" ON guests;
CREATE POLICY "guests_auth_read" ON guests FOR SELECT TO authenticated USING (hotel_id = get_current_user_hotel_id());
CREATE POLICY "guests_auth_write" ON guests FOR INSERT TO authenticated WITH CHECK (hotel_id = get_current_user_hotel_id());
CREATE POLICY "guests_auth_update" ON guests FOR UPDATE TO authenticated USING (hotel_id = get_current_user_hotel_id());

-- Room Cleaning Tasks
ALTER TABLE room_cleaning_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks_auth_read" ON room_cleaning_tasks;
CREATE POLICY "tasks_auth_read" ON room_cleaning_tasks FOR SELECT TO authenticated USING (hotel_id = get_current_user_hotel_id());
CREATE POLICY "tasks_auth_write" ON room_cleaning_tasks FOR INSERT TO authenticated WITH CHECK (hotel_id = get_current_user_hotel_id());
CREATE POLICY "tasks_auth_update" ON room_cleaning_tasks FOR UPDATE TO authenticated USING (hotel_id = get_current_user_hotel_id());

-- Inspections
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insp_auth_read" ON inspections;
CREATE POLICY "insp_auth_read" ON inspections FOR SELECT TO authenticated USING (hotel_id = get_current_user_hotel_id());
CREATE POLICY "insp_auth_write" ON inspections FOR INSERT TO authenticated WITH CHECK (hotel_id = get_current_user_hotel_id());

-- Hotel Settings
ALTER TABLE hotel_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_auth_read" ON hotel_settings;
CREATE POLICY "settings_auth_read" ON hotel_settings FOR SELECT TO authenticated USING (hotel_id = get_current_user_hotel_id());
CREATE POLICY "settings_auth_update" ON hotel_settings FOR UPDATE TO authenticated USING (hotel_id = get_current_user_hotel_id());

-- Hotel Floors
ALTER TABLE hotel_floors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "floors_auth_read" ON hotel_floors;
CREATE POLICY "floors_auth_read" ON hotel_floors FOR SELECT TO authenticated USING (hotel_id = get_current_user_hotel_id());

-- Maintenance
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "maint_auth_read" ON maintenance_tasks;
CREATE POLICY "maint_auth_read" ON maintenance_tasks FOR SELECT TO authenticated USING (hotel_id = get_current_user_hotel_id());
CREATE POLICY "maint_auth_write" ON maintenance_tasks FOR INSERT TO authenticated WITH CHECK (hotel_id = get_current_user_hotel_id());
CREATE POLICY "maint_auth_update" ON maintenance_tasks FOR UPDATE TO authenticated USING (hotel_id = get_current_user_hotel_id());

-- Lost & Found
ALTER TABLE lost_found_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lf_auth_read" ON lost_found_items;
CREATE POLICY "lf_auth_read" ON lost_found_items FOR SELECT TO authenticated USING (hotel_id = get_current_user_hotel_id());
CREATE POLICY "lf_auth_write" ON lost_found_items FOR INSERT TO authenticated WITH CHECK (hotel_id = get_current_user_hotel_id());

-- Staff Schedules
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sched_auth_read" ON staff_schedules;
CREATE POLICY "sched_auth_read" ON staff_schedules FOR SELECT TO authenticated
  USING (staff_id IN (SELECT id FROM users WHERE hotel_id = get_current_user_hotel_id()));

-- Guest History
ALTER TABLE guest_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gh_auth_read" ON guest_history;
CREATE POLICY "gh_auth_read" ON guest_history FOR SELECT TO authenticated
  USING (guest_id IN (SELECT id FROM guests WHERE hotel_id = get_current_user_hotel_id()));
CREATE POLICY "gh_auth_write" ON guest_history FOR INSERT TO authenticated
  WITH CHECK (guest_id IN (SELECT id FROM guests WHERE hotel_id = get_current_user_hotel_id()));

-- ═══════════ 7. SEED ═══════════
-- NOTE: Les utilisateurs doivent être créés via Supabase Auth Admin API (seed_supabase.py)
-- Ce script seed les données de base pour un hôtel de démonstration

INSERT INTO hotels (name, address, city, postal_code, country, phone, email, stars, total_rooms)
VALUES ('Flowtym Paris', '123 Avenue des Champs-Élysées', 'Paris', '75008', 'France', '+33 1 23 45 67 89', 'contact@flowtym.com', 4, 11)
ON CONFLICT DO NOTHING;

DO $$
DECLARE h UUID; f1 UUID; f2 UUID; f3 UUID;
  r101 UUID; r102 UUID; r103 UUID; r201 UUID; r202 UUID; r203 UUID;
  r204 UUID; r301 UUID; r302 UUID; r303 UUID; r304 UUID;
BEGIN
  SELECT id INTO h FROM hotels WHERE name = 'Flowtym Paris';
  IF h IS NULL THEN RETURN; END IF;

  -- Floors
  INSERT INTO hotel_floors (hotel_id, floor_number, name, total_rooms)
  VALUES (h,1,'Étage 1',3),(h,2,'Étage 2',4),(h,3,'Étage 3',4)
  ON CONFLICT DO NOTHING;
  SELECT id INTO f1 FROM hotel_floors WHERE hotel_id=h AND floor_number=1;
  SELECT id INTO f2 FROM hotel_floors WHERE hotel_id=h AND floor_number=2;
  SELECT id INTO f3 FROM hotel_floors WHERE hotel_id=h AND floor_number=3;

  -- Settings
  INSERT INTO hotel_settings (hotel_id) VALUES (h) ON CONFLICT (hotel_id) DO NOTHING;

  -- Rooms
  INSERT INTO rooms (hotel_id,floor_id,room_number,room_type,status,capacity,bed_type,surface_area,notes) VALUES
    (h,f1,'101','Twin','libre',2,'2 lits simples',15,'Douche, Vue Rue'),
    (h,f1,'102','Double','occupee',2,'1 lit double',22,'Baignoire, Vue Cour'),
    (h,f1,'103','Twin','libre',2,'2 lits simples',15,'Douche, Vue Rue'),
    (h,f2,'201','Double','occupee',2,'1 lit double',16,'Baignoire, Vue Rue'),
    (h,f2,'202','Double','occupee',2,'1 lit double',25,'Baignoire, Vue Cour, Deluxe'),
    (h,f2,'203','Twin','libre',2,'2 lits simples',16,'Douche, Vue Rue'),
    (h,f2,'204','Double','libre',2,'1 lit double',16,'Baignoire, Vue Cour'),
    (h,f3,'301','Double','libre',2,'1 lit king',25,'Baignoire, Vue Rue, Deluxe'),
    (h,f3,'302','Double','libre',2,'1 lit double',16,'Douche, Vue Cour'),
    (h,f3,'303','Double','libre',2,'1 lit double',16,'Baignoire, Vue Rue'),
    (h,f3,'304','Double','libre',2,'1 lit double',16,'Douche, Vue Cour')
  ON CONFLICT DO NOTHING;

  SELECT id INTO r102 FROM rooms WHERE hotel_id=h AND room_number='102';
  SELECT id INTO r201 FROM rooms WHERE hotel_id=h AND room_number='201';
  SELECT id INTO r202 FROM rooms WHERE hotel_id=h AND room_number='202';
  SELECT id INTO r301 FROM rooms WHERE hotel_id=h AND room_number='301';
  SELECT id INTO r103 FROM rooms WHERE hotel_id=h AND room_number='103';
  SELECT id INTO r303 FROM rooms WHERE hotel_id=h AND room_number='303';
  SELECT id INTO r204 FROM rooms WHERE hotel_id=h AND room_number='204';

  -- Reservations
  INSERT INTO reservations (hotel_id,room_id,guest_name,guest_email,guest_phone,guest_count,check_in,check_out,status,source,total_amount) VALUES
    (h,r102,'Sophie Laurent','sophie.l@email.com','+33 6 11 22 33 44',2,'2026-04-10','2026-04-14','en_cours','Booking.com',480),
    (h,r201,'Marc Dubois','m.dubois@email.com','+33 6 22 33 44 55',1,'2026-04-12','2026-04-15','en_cours','Direct',360),
    (h,r202,'Elena Rossi','elena.r@email.com','+39 3 12 34 56 78',2,'2026-04-11','2026-04-16','en_cours','Expedia',600),
    (h,r301,'Jean-Pierre Moreau','jp.moreau@email.com','+33 6 33 44 55 66',2,'2026-04-08','2026-04-12','check_out','Direct',480),
    (h,r103,'Yuki Tanaka','yuki.t@email.com','+81 90 1234 5678',1,'2026-04-14','2026-04-18','confirmee','Hotels.com',480),
    (h,r303,'Ahmed Belkacem','a.belkacem@email.com','+33 6 44 55 66 77',2,'2026-04-13','2026-04-15','confirmee','Booking.com',240),
    (h,r204,'Maria Schmidt','m.schmidt@email.com','+49 170 123 4567',1,'2026-05-01','2026-05-05','confirmee','Direct',480)
  ON CONFLICT DO NOTHING;

  -- Guests
  INSERT INTO guests (hotel_id,email,first_name,last_name,phone,total_stays,total_spent,loyalty_tier) VALUES
    (h,'sophie.l@email.com','Sophie','Laurent','+33 6 11 22 33 44',3,1250,'Argent'),
    (h,'m.dubois@email.com','Marc','Dubois','+33 6 22 33 44 55',1,360,'Bronze'),
    (h,'elena.r@email.com','Elena','Rossi','+39 3 12 34 56 78',2,890,'Argent'),
    (h,'jp.moreau@email.com','Jean-Pierre','Moreau','+33 6 33 44 55 66',4,1800,'Or'),
    (h,'yuki.t@email.com','Yuki','Tanaka','+81 90 1234 5678',0,0,'Bronze'),
    (h,'a.belkacem@email.com','Ahmed','Belkacem','+33 6 44 55 66 77',1,240,'Bronze'),
    (h,'m.schmidt@email.com','Maria','Schmidt','+49 170 123 4567',0,0,'Bronze')
  ON CONFLICT DO NOTHING;

END $$;

-- ═══════════ 8. VERIFICATION ═══════════
SELECT 'hotels' AS t, COUNT(*) AS n FROM hotels
UNION ALL SELECT 'rooms', COUNT(*) FROM rooms
UNION ALL SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL SELECT 'guests', COUNT(*) FROM guests
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'hotel_settings', COUNT(*) FROM hotel_settings
ORDER BY t;
