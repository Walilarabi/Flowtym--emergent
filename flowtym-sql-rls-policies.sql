-- =====================================================
-- FLOWTYM - ROW LEVEL SECURITY (RLS)
-- Isolation multi-tenant basée sur hotel_id
-- Uses the existing `users` table (not staff_members)
-- =====================================================

-- Helper function: get current user's hotel_id
CREATE OR REPLACE FUNCTION get_current_user_hotel_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT hotel_id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$;

-- =====================================================
-- 1. HOTELS
-- =====================================================
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hotels_select_own" ON hotels
    FOR SELECT TO authenticated
    USING (id = get_current_user_hotel_id());

CREATE POLICY "hotels_update_own" ON hotels
    FOR UPDATE TO authenticated
    USING (id = get_current_user_hotel_id());

-- =====================================================
-- 2. ROOMS
-- =====================================================
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms_select_own" ON rooms
    FOR SELECT TO authenticated
    USING (hotel_id = get_current_user_hotel_id());

CREATE POLICY "rooms_insert_own" ON rooms
    FOR INSERT TO authenticated
    WITH CHECK (hotel_id = get_current_user_hotel_id());

CREATE POLICY "rooms_update_own" ON rooms
    FOR UPDATE TO authenticated
    USING (hotel_id = get_current_user_hotel_id());

-- =====================================================
-- 3. RESERVATIONS
-- =====================================================
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reservations_select_own" ON reservations
    FOR SELECT TO authenticated
    USING (hotel_id = get_current_user_hotel_id());

CREATE POLICY "reservations_insert_own" ON reservations
    FOR INSERT TO authenticated
    WITH CHECK (hotel_id = get_current_user_hotel_id());

CREATE POLICY "reservations_update_own" ON reservations
    FOR UPDATE TO authenticated
    USING (hotel_id = get_current_user_hotel_id());

-- =====================================================
-- 4. ROOM CLEANING TASKS
-- =====================================================
ALTER TABLE room_cleaning_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_own" ON room_cleaning_tasks
    FOR SELECT TO authenticated
    USING (hotel_id = get_current_user_hotel_id());

CREATE POLICY "tasks_insert_own" ON room_cleaning_tasks
    FOR INSERT TO authenticated
    WITH CHECK (hotel_id = get_current_user_hotel_id());

CREATE POLICY "tasks_update_own" ON room_cleaning_tasks
    FOR UPDATE TO authenticated
    USING (hotel_id = get_current_user_hotel_id());

-- =====================================================
-- 5. USERS (own hotel's staff)
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON users
    FOR SELECT TO authenticated
    USING (hotel_id = get_current_user_hotel_id());

-- =====================================================
-- 6. INSPECTIONS
-- =====================================================
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inspections_select_own" ON inspections
    FOR SELECT TO authenticated
    USING (hotel_id = get_current_user_hotel_id());

CREATE POLICY "inspections_insert_own" ON inspections
    FOR INSERT TO authenticated
    WITH CHECK (hotel_id = get_current_user_hotel_id());

-- =====================================================
-- 7. HOTEL SETTINGS
-- =====================================================
ALTER TABLE hotel_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_select_own" ON hotel_settings
    FOR SELECT TO authenticated
    USING (hotel_id = get_current_user_hotel_id());

-- =====================================================
-- 8. HOTEL FLOORS
-- =====================================================
ALTER TABLE hotel_floors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "floors_select_own" ON hotel_floors
    FOR SELECT TO authenticated
    USING (hotel_id = get_current_user_hotel_id());

-- =====================================================
-- VERIFY
-- =====================================================
-- SELECT tablename, policyname, permissive, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
